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
}

export interface VideoSettings {
  hasVideo: boolean;
  hasAudio: boolean;
  isScreenSharing: boolean;
}

interface SocketError {
  message: string;
}

interface WebRTCSignal {
  sourceSocketId: string;
  signal: SimplePeer.SignalData;
}

interface ParticipantSettingsUpdate {
  userId: string;
  hasVideo: boolean;
  hasAudio: boolean;
}

interface ScreenShareUpdate {
  userId: string;
  isSharing: boolean;
}

interface ConsultationMessage {
  userId: string;
  email: string;
  message: string;
  timestamp: string;
}

interface UseVideoConsultationOptions {
  consultationId: string;
  onParticipantJoined?: (participant: Participant) => void;
  onParticipantLeft?: (userId: string) => void;
  onConsultationEnded?: () => void;
  onError?: (error: string) => void;
}

export const useVideoConsultation = (options: UseVideoConsultationOptions) => {
  const { user, accessToken: token } = useAuthStore();
  const {
    consultationId,
    onParticipantJoined,
    onParticipantLeft,
    onConsultationEnded,
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
    isScreenSharing: false
  });
  const [isJoining, setIsJoining] = useState(false);
  const [roomMessages, setRoomMessages] = useState<ConsultationMessage[]>([]);

  // Refs
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);

  // Initialize socket connection
  const connectSocket = useCallback(() => {
    if (!token || socketRef.current) return;

    socketRef.current = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to video signaling server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from video signaling server');
    });

    socket.on('error', (error: SocketError) => {
      console.error('Socket error:', error);
      onError?.(error.message || 'Connection error');
    });

    // Video consultation events
    socket.on('participant-joined', (participant: Participant) => {
      console.log('Participant joined:', participant);
      setParticipants(prev => new Map(prev.set(participant.userId, participant)));
      onParticipantJoined?.(participant);
      
      // Create peer connection for new participant
      if (localStreamRef.current) {
        createPeerConnection(participant.socketId, false);
      }
    });

    socket.on('participant-left', ({ userId }: { userId: string }) => {
      console.log('Participant left:', userId);
      
      // Clean up peer connection
      const peer = peers.get(userId);
      if (peer) {
        peer.destroy();
        setPeers(prev => {
          const newPeers = new Map(prev);
          newPeers.delete(userId);
          return newPeers;
        });
      }

      setParticipants(prev => {
        const newParticipants = new Map(prev);
        newParticipants.delete(userId);
        return newParticipants;
      });
      
      onParticipantLeft?.(userId);
    });

    socket.on('existing-participants', (existingParticipants: Participant[]) => {
      console.log('Existing participants:', existingParticipants);
      
      existingParticipants.forEach(participant => {
        setParticipants(prev => new Map(prev.set(participant.userId, participant)));
        
        // Create peer connection for existing participants
        if (localStreamRef.current) {
          createPeerConnection(participant.socketId, true);
        }
      });
    });

    socket.on('webrtc-signal', ({ sourceSocketId, signal }: WebRTCSignal) => {
      const peer = peers.get(sourceSocketId);
      if (peer && signal) {
        peer.signal(signal);
      }
    });

    socket.on('participant-settings-updated', ({ userId, hasVideo, hasAudio }: ParticipantSettingsUpdate) => {
      setParticipants(prev => {
        const participant = prev.get(userId);
        if (participant) {
          const updated = { ...participant, hasVideo, hasAudio };
          return new Map(prev.set(userId, updated));
        }
        return prev;
      });
    });

    socket.on('screen-share-started', ({ userId, isSharing }: ScreenShareUpdate) => {
      setParticipants(prev => {
        const participant = prev.get(userId);
        if (participant) {
          const updated = { ...participant, isScreenSharing: isSharing };
          return new Map(prev.set(userId, updated));
        }
        return prev;
      });
    });

    socket.on('consultation-message', (message: ConsultationMessage) => {
      setRoomMessages(prev => [...prev, message]);
    });

    socket.on('meeting-ended', () => {
      onConsultationEnded?.();
      disconnectAll();
    });

  }, [token, consultationId, onParticipantJoined, onParticipantLeft, onConsultationEnded, onError, peers]);

  // Create peer connection
  const createPeerConnection = useCallback((socketId: string, initiator: boolean) => {
    if (!localStreamRef.current) return;

    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream: localStreamRef.current
    });

    peer.on('signal', (signal) => {
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
      // Handle remote stream - this should be connected to video elements
      const event = new CustomEvent('remote-stream', {
        detail: { socketId, stream: remoteStream }
      });
      window.dispatchEvent(event);
    });

    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
      onError?.(`Connection error with participant: ${err.message}`);
    });

    setPeers(prev => new Map(prev.set(socketId, peer)));

  }, [consultationId, onError]);

  // Join consultation
  const joinConsultation = useCallback(async () => {
    if (!socketRef.current || !user || isJoining) return;

    setIsJoining(true);

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoSettings.hasVideo,
        audio: videoSettings.hasAudio
      });

      localStreamRef.current = stream;
      
      // Set local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Join the consultation room
      socketRef.current.emit('join-consultation', {
        consultationId
      });

      // Update video settings in backend
      socketRef.current.emit('update-video-settings', {
        consultationId,
        hasVideo: videoSettings.hasVideo,
        hasAudio: videoSettings.hasAudio
      });

    } catch (error: unknown) {
      console.error('Failed to get user media:', error);
      onError?.(`Camera/microphone access denied: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsJoining(false);
    }
  }, [consultationId, user, videoSettings, isJoining, onError]);

  // Leave consultation
  const leaveConsultation = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave-consultation', { consultationId });
    }
    disconnectAll();
  }, [consultationId]);

  // Update video/audio settings
  const updateVideoSettings = useCallback(async (newSettings: Partial<VideoSettings>) => {
    const updatedSettings = { ...videoSettings, ...newSettings };
    setVideoSettings(updatedSettings);

    // Update local stream
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      
      tracks.forEach(track => {
        if (track.kind === 'video') {
          track.enabled = updatedSettings.hasVideo;
        } else if (track.kind === 'audio') {
          track.enabled = updatedSettings.hasAudio;
        }
      });
    }

    // Notify server
    if (socketRef.current) {
      socketRef.current.emit('update-video-settings', {
        consultationId,
        hasVideo: updatedSettings.hasVideo,
        hasAudio: updatedSettings.hasAudio
      });
    }
  }, [consultationId, videoSettings]);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      screenShareStreamRef.current = screenStream;

      // Replace video track in all peer connections
      peers.forEach(peer => {
        const pc = (peer as unknown as { _pc?: { getSenders?(): RTCRtpSender[] } })._pc;
        const sender = pc?.getSenders?.()?.find((s: RTCRtpSender) => 
          s.track?.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
      });

      // Notify other participants
      if (socketRef.current) {
        socketRef.current.emit('screen-share-request', {
          consultationId,
          isSharing: true
        });
      }

      setVideoSettings(prev => ({ ...prev, isScreenSharing: true }));

      // Stop screen share when stream ends
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

    } catch (error: unknown) {
      console.error('Screen share failed:', error);
      onError?.(`Screen sharing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [consultationId, peers, onError]);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    if (screenShareStreamRef.current) {
      screenShareStreamRef.current.getTracks().forEach(track => track.stop());
      screenShareStreamRef.current = null;
    }

    // Get camera stream again
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: videoSettings.hasVideo,
        audio: videoSettings.hasAudio
      });

      localStreamRef.current = cameraStream;

      // Replace tracks in peer connections
      peers.forEach(peer => {
        const pc = (peer as unknown as { _pc?: { getSenders?(): RTCRtpSender[] } })._pc;
        const videoSender = pc?.getSenders?.()?.find((s: RTCRtpSender) => 
          s.track?.kind === 'video'
        );
        if (videoSender && cameraStream.getVideoTracks()[0]) {
          videoSender.replaceTrack(cameraStream.getVideoTracks()[0]);
        }
      });

      // Update local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream;
      }

    } catch (error) {
      console.error('Failed to restore camera stream:', error);
    }

    // Notify other participants
    if (socketRef.current) {
      socketRef.current.emit('screen-share-request', {
        consultationId,
        isSharing: false
      });
    }

    setVideoSettings(prev => ({ ...prev, isScreenSharing: false }));
  }, [consultationId, videoSettings, peers]);

  // Send chat message
  const sendMessage = useCallback((message: string) => {
    if (socketRef.current && message.trim()) {
      socketRef.current.emit('consultation-message', {
        consultationId,
        message: message.trim(),
        roomId: consultation?.roomId
      });
    }
  }, [consultationId, consultation]);

  // Disconnect all
  const disconnectAll = useCallback(() => {
    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (screenShareStreamRef.current) {
      screenShareStreamRef.current.getTracks().forEach(track => track.stop());
      screenShareStreamRef.current = null;
    }

    // Destroy all peer connections
    peers.forEach(peer => peer.destroy());
    setPeers(new Map());

    // Clear participants
    setParticipants(new Map());
    setRoomMessages([]);

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
  }, [peers]);

  // Initialize on mount
  useEffect(() => {
    connectSocket();

    return () => {
      disconnectAll();
    };
  }, [connectSocket, disconnectAll]);

  return {
    // State
    isConnected,
    consultation,
    participants: Array.from(participants.values()),
    videoSettings,
    isJoining,
    roomMessages,
    localVideoRef,

    // Actions
    joinConsultation,
    leaveConsultation,
    updateVideoSettings,
    startScreenShare,
    stopScreenShare,
    sendMessage
  };
};