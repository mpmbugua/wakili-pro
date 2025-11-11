import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { useAuthStore } from '../store/authStore';

export interface VideoConsultation {
  id: string;
  roomId: string;
  status: 'SCHEDULED' | 'WAITING_FOR_PARTICIPANTS' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  lawyerId: string;
  clientId: string;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  isRecorded: boolean;
  participantCount: number;
}

export interface Participant {
  userId: string;
  email: string;
  socketId: string;
  hasVideo: boolean;
  hasAudio: boolean;
  isScreenSharing?: boolean;
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface VideoSettings {
  hasVideo: boolean;
  hasAudio: boolean;
  isScreenSharing: boolean;
  qualityProfile: 'low' | 'medium' | 'high' | 'auto';
  resolution: string;
  bitrate: number;
}

export interface ConnectionStats {
  bandwidth: number;
  packetLoss: number;
  jitter: number;
  rtt: number;
}

interface UseEnhancedVideoConsultationOptions {
  consultationId: string;
  enableAdaptiveQuality?: boolean;
  enableRecording?: boolean;
  onParticipantJoined?: (participant: Participant) => void;
  onParticipantLeft?: (userId: string) => void;
  onConsultationEnded?: () => void;
  onConnectionQualityChanged?: (quality: string) => void;
  onError?: (error: string) => void;
}

export const useEnhancedVideoConsultation = (options: UseEnhancedVideoConsultationOptions) => {
  const { user, accessToken: token } = useAuthStore();
  const {
    consultationId,
    enableAdaptiveQuality = true,
    enableRecording = false,
    onParticipantJoined,
    onConnectionQualityChanged,
    onError
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [consultation] = useState<VideoConsultation | null>(null);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [peers, setPeers] = useState<Map<string, SimplePeer.Instance>>(new Map());
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    hasVideo: true,
    hasAudio: true,
    isScreenSharing: false,
    qualityProfile: 'auto',
    resolution: '1280x720',
    bitrate: 800000
  });
  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({
    bandwidth: 0,
    packetLoss: 0,
    jitter: 0,
    rtt: 0
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');

  // Refs
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const connectionStatsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Quality profiles for adaptive streaming
  const qualityProfiles = {
    low: {
      video: {
        width: { min: 320, max: 480 },
        height: { min: 240, max: 360 },
        frameRate: { max: 15 }
      },
      bitrate: 300000
    },
    medium: {
      video: {
        width: { min: 640, max: 960 },
        height: { min: 480, max: 720 },
        frameRate: { max: 24 }
      },
      bitrate: 800000
    },
    high: {
      video: {
        width: { min: 960, max: 1920 },
        height: { min: 720, max: 1080 },
        frameRate: { max: 30 }
      },
      bitrate: 1500000
    }
  };

  // ICE servers configuration with STUN/TURN
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Add TURN servers for production
    ...(process.env.REACT_APP_TURN_SERVER_URL ? [{
      urls: process.env.REACT_APP_TURN_SERVER_URL,
      username: process.env.REACT_APP_TURN_USERNAME,
      credential: process.env.REACT_APP_TURN_PASSWORD
    }] : [])
  ];

  // Network quality detection
  const detectNetworkQuality = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as { connection?: { effectiveType?: string; downlink?: number } }).connection;
      const effectiveType = connection?.effectiveType;
      
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          setNetworkQuality('poor');
          return 'low';
        case '3g':
          setNetworkQuality('fair');
          return 'medium';
        case '4g':
        case '5g':
          setNetworkQuality('good');
          return 'high';
        default:
          setNetworkQuality('good');
          return 'medium';
      }
    }
    return 'medium';
  }, []);

  // Adaptive quality adjustment
  const adjustQualityBasedOnStats = useCallback((stats: ConnectionStats) => {
    if (!enableAdaptiveQuality) return;

    let newProfile = videoSettings.qualityProfile;
    
    // Adjust based on packet loss
    if (stats.packetLoss > 5) {
      newProfile = 'low';
    } else if (stats.packetLoss > 2) {
      newProfile = 'medium';
    } else if (stats.packetLoss < 1 && stats.bandwidth > 1000000) {
      newProfile = 'high';
    }

    // Adjust based on RTT
    if (stats.rtt > 300) {
      newProfile = 'low';
    } else if (stats.rtt > 150) {
      newProfile = newProfile === 'high' ? 'medium' : newProfile;
    }

    if (newProfile !== videoSettings.qualityProfile) {
      updateVideoQuality(newProfile);
    }
  }, [enableAdaptiveQuality, videoSettings.qualityProfile]);

  // Monitor connection statistics
  const startConnectionMonitoring = useCallback(() => {
    if (connectionStatsIntervalRef.current) return;

    connectionStatsIntervalRef.current = setInterval(async () => {
      for (const [socketId, peer] of peers.entries()) {
        try {
          const peerConnection = (peer as unknown as { _pc?: RTCPeerConnection })._pc;
          if (!peerConnection) continue;

          const stats = await peerConnection.getStats();
          let totalBytesReceived = 0;
          let totalPacketsLost = 0;
          let totalPacketsReceived = 0;
          let rtt = 0;

          stats.forEach((report: any) => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              totalBytesReceived += report.bytesReceived || 0;
              totalPacketsLost += report.packetsLost || 0;
              totalPacketsReceived += report.packetsReceived || 0;
            }
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              rtt = report.currentRoundTripTime * 1000 || 0;
            }
          });

          const packetLoss = totalPacketsReceived > 0 
            ? (totalPacketsLost / totalPacketsReceived) * 100 
            : 0;

          const newStats = {
            bandwidth: totalBytesReceived * 8, // Convert to bits
            packetLoss,
            jitter: 0, // Would need more complex calculation
            rtt
          };

          setConnectionStats(newStats);
          adjustQualityBasedOnStats(newStats);

          // Update participant connection quality
          const quality: 'excellent' | 'good' | 'fair' | 'poor' = packetLoss < 1 ? 'excellent' 
            : packetLoss < 3 ? 'good'
            : packetLoss < 5 ? 'fair' : 'poor';

          setParticipants(prev => {
            const participant = prev.get(socketId);
            if (participant && participant.connectionQuality !== quality) {
              const updated = { ...participant, connectionQuality: quality };
              onConnectionQualityChanged?.(quality);
              return new Map(prev.set(socketId, updated));
            }
            return prev;
          });

        } catch (error) {
          console.error('Error collecting connection stats:', error);
        }
      }
    }, 5000); // Check every 5 seconds
  }, [peers, adjustQualityBasedOnStats, onConnectionQualityChanged]);

  // Update video quality
  const updateVideoQuality = useCallback(async (profile: string) => {
    if (profile === 'auto') {
      profile = detectNetworkQuality();
    }

    const qualityConfig = qualityProfiles[profile as keyof typeof qualityProfiles];
    if (!qualityConfig) return;

    try {
      // Update local stream constraints
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          await videoTrack.applyConstraints(qualityConfig.video);
        }
      }

      // Update peer connection encodings
      peers.forEach(async (peer) => {
        try {
          const peerConnection = (peer as unknown as { _pc?: RTCPeerConnection })._pc;
          if (!peerConnection) return;

          const senders = peerConnection.getSenders();
          for (const sender of senders) {
            if (sender.track && sender.track.kind === 'video') {
              const params = sender.getParameters();
              if ((params as any).encodings && (params as any).encodings.length > 0) {
                (params as any).encodings[0].maxBitrate = qualityConfig.bitrate;
                await sender.setParameters(params);
              }
            }
          }
        } catch (error) {
          console.error('Error updating peer encoding parameters:', error);
        }
      });

      setVideoSettings(prev => ({
        ...prev,
        qualityProfile: profile as 'low' | 'medium' | 'high' | 'auto',
        bitrate: qualityConfig.bitrate
      }));

    } catch (error) {
      console.error('Error updating video quality:', error);
      onError?.(`Failed to update video quality: ${error}`);
    }
  }, [detectNetworkQuality, peers, onError]);

  // Enhanced peer connection creation with simulcast support
  const createEnhancedPeerConnection = useCallback((socketId: string, initiator: boolean) => {
    if (!localStreamRef.current) return;

    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream: localStreamRef.current,
      config: {
        iceServers,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      }
    });

    // Enable simulcast for video
    peer.on('signal', (signal) => {
      if (signal.type === 'offer' || signal.type === 'answer') {
        try {
          // Modify SDP for simulcast support
          if (signal.sdp) {
            signal.sdp = signal.sdp.replace(
              /a=mid:0\r?\n/g,
              'a=mid:0\r\na=simulcast:send rid=high;medium;low\r\n'
            );
          }
        } catch (error) {
          console.error('Error modifying SDP for simulcast:', error);
        }
      }

      if (socketRef.current) {
        socketRef.current.emit('webrtc-signal', {
          targetSocketId: socketId,
          consultationId,
          signal
        });
      }
    });

    peer.on('stream', (remoteStream) => {
      console.log('Received remote stream from:', socketId);
      const event = new CustomEvent('remote-stream', {
        detail: { socketId, stream: remoteStream }
      });
      window.dispatchEvent(event);
    });

    peer.on('connect', () => {
      console.log('Peer connected:', socketId);
      startConnectionMonitoring();
    });

    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
      onError?.(`Connection error with participant: ${err.message}`);
    });

    setPeers(prev => new Map(prev.set(socketId, peer)));

  }, [consultationId, startConnectionMonitoring, onError]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!localStreamRef.current || isRecording) return;

    try {
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: videoSettings.bitrate,
        audioBitsPerSecond: 128000
      };

      recordingChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(localStreamRef.current, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const recordingBlob = new Blob(recordingChunksRef.current, {
          type: 'video/webm'
        });

        // Upload recording to server
        const formData = new FormData();
        formData.append('recording', recordingBlob, `consultation_${consultationId}.webm`);
        formData.append('consultationId', consultationId);
        formData.append('format', 'webm');
        formData.append('codec', 'VP9');
        formData.append('resolution', videoSettings.resolution);
        formData.append('duration', '0'); // Would need to calculate actual duration

        try {
          const response = await fetch('/api/recordings/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          console.log('Recording uploaded successfully');
        } catch (error) {
          console.error('Failed to upload recording:', error);
          onError?.('Failed to upload recording');
        }
      };

      mediaRecorderRef.current.start(10000); // Record in 10-second chunks
      setIsRecording(true);

      // Notify server that recording started
      if (socketRef.current) {
        socketRef.current.emit('recording-started', { consultationId });
      }

    } catch (error) {
      console.error('Failed to start recording:', error);
      onError?.('Failed to start recording');
    }
  }, [consultationId, videoSettings, token, isRecording, onError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Notify server that recording stopped
      if (socketRef.current) {
        socketRef.current.emit('recording-stopped', { consultationId });
      }
    }
  }, [consultationId, isRecording]);

  // Enhanced getUserMedia with quality constraints
  const getEnhancedUserMedia = useCallback(async (qualityProfile: string = 'medium') => {
    const profile = qualityProfiles[qualityProfile as keyof typeof qualityProfiles] || qualityProfiles.medium;
    
    const constraints = {
      video: {
        ...profile.video,
        facingMode: 'user'
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 2
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Apply bitrate constraints
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities();
        console.log('Video track capabilities:', capabilities);
      }

      return stream;
    } catch (error) {
      console.error('Failed to get enhanced user media:', error);
      throw error;
    }
  }, []);

  // Join consultation with enhanced features
  const joinConsultation = useCallback(async () => {
    if (!socketRef.current || !user || isJoining) return;

    setIsJoining(true);

    try {
      // Detect network quality and adjust settings
      const detectedProfile = enableAdaptiveQuality ? detectNetworkQuality() : 'medium';
      
      // Get user media with quality constraints
      const stream = await getEnhancedUserMedia(detectedProfile);
      localStreamRef.current = stream;
      
      // Set local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Connect socket if not connected
      if (!socketRef.current.connected) {
        socketRef.current.connect();
      }

      // Join the consultation room
      socketRef.current.emit('join-consultation', {
        consultationId
      });

      // Update video settings
      socketRef.current.emit('update-video-settings', {
        consultationId,
        hasVideo: videoSettings.hasVideo,
        hasAudio: videoSettings.hasAudio
      });

      // Start recording if enabled
      if (enableRecording) {
        setTimeout(() => startRecording(), 2000);
      }

    } catch (error: unknown) {
      console.error('Failed to join consultation:', error);
      onError?.(`Failed to join consultation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsJoining(false);
    }
  }, [consultationId, user, videoSettings, isJoining, enableAdaptiveQuality, enableRecording, detectNetworkQuality, getEnhancedUserMedia, startRecording, onError]);

  // Initialize socket connection (keeping existing logic but enhanced)
  const connectSocket = useCallback(() => {
    if (!token || socketRef.current) return;

    socketRef.current = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to enhanced video signaling server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from video signaling server');
    });

    socket.on('participant-joined', (participant: Participant) => {
      setParticipants(prev => new Map(prev.set(participant.userId, participant)));
      onParticipantJoined?.(participant);
      
      if (localStreamRef.current) {
        createEnhancedPeerConnection(participant.socketId, false);
      }
    });

    socket.on('existing-participants', (existingParticipants: Participant[]) => {
      existingParticipants.forEach(participant => {
        setParticipants(prev => new Map(prev.set(participant.userId, participant)));
        
        if (localStreamRef.current) {
          createEnhancedPeerConnection(participant.socketId, true);
        }
      });
    });

    // Handle other socket events (keeping existing logic)
    // ... rest of socket event handlers

  }, [token, consultationId, onParticipantJoined, createEnhancedPeerConnection]);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop recording
    if (isRecording) {
      stopRecording();
    }

    // Stop connection monitoring
    if (connectionStatsIntervalRef.current) {
      clearInterval(connectionStatsIntervalRef.current);
      connectionStatsIntervalRef.current = null;
    }

    // Stop media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (screenShareStreamRef.current) {
      screenShareStreamRef.current.getTracks().forEach(track => track.stop());
      screenShareStreamRef.current = null;
    }

    // Destroy peer connections
    peers.forEach(peer => peer.destroy());
    setPeers(new Map());

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setParticipants(new Map());
  }, [isRecording, stopRecording, peers]);

  // Initialize on mount
  useEffect(() => {
    connectSocket();
    return cleanup;
  }, [connectSocket, cleanup]);

  return {
    // State
    isConnected,
    consultation,
    participants: Array.from(participants.values()),
    videoSettings,
    connectionStats,
    networkQuality,
    isRecording,
    isJoining,
    localVideoRef,

    // Actions
    joinConsultation,
    updateVideoQuality,
    startRecording,
    stopRecording,
    cleanup
  };
};