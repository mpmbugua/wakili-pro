import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatMessage } from '../services/chatService';

interface Recording {
  id: string;
  fileName: string;
  duration: number;
  createdAt: Date;
  downloadUrl?: string;
}
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff,
  Settings,
  Users,
  MessageCircle,
  Circle,
  StopCircle,
  Download,
  AlertCircle,
  Signal,
  Maximize2,
  PhoneOff
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useEnhancedVideoConsultation } from '../hooks/useEnhancedVideoConsultation';
import { useAuthStore } from '../store/authStore';

interface VideoQuality {
  label: string;
  value: 'low' | 'medium' | 'high';
  resolution: string;
  bitrate: string;
}

const QUALITY_OPTIONS: VideoQuality[] = [
  { label: 'Low (360p)', value: 'low', resolution: '640x360', bitrate: '300 kbps' },
  { label: 'Medium (720p)', value: 'medium', resolution: '1280x720', bitrate: '1 Mbps' },
  { label: 'High (1080p)', value: 'high', resolution: '1920x1080', bitrate: '2.5 Mbps' }
];

export const EnhancedVideoConsultation: React.FC = () => {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Video consultation hook with enhanced features
  const {
    isConnected,
    participants,
    networkQuality,
    isRecording,
    localVideoRef,
    joinConsultation,
    updateVideoQuality,
    startRecording,
    stopRecording,
    cleanup
  } = useEnhancedVideoConsultation({ consultationId: consultationId! });

  // Mock additional properties for now
  const isVideoEnabled = true;
  const isAudioEnabled = true;
  const isScreenSharing = false;
  const connectionQuality = networkQuality;
  const participantCount = participants.length;
  const recordingDuration = 0;
  const chatMessages: ChatMessage[] = [];

  // Additional refs
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Mock functions
  const leaveConsultation = React.useCallback(() => {
    cleanup();
  }, [cleanup]);
  const toggleVideo = React.useCallback(() => {}, []);
  const toggleAudio = React.useCallback(() => {}, []);
  const toggleScreenShare = React.useCallback(() => {}, []);
  const sendChatMessage = React.useCallback(() => {
    // Mock implementation - no message handling needed for demo
  }, []);
  const changeVideoQuality = React.useCallback(() => {
    updateVideoQuality();
  }, [updateVideoQuality]);
  const getRecordings = React.useCallback(() => Promise.resolve([]), []);

  // Component state
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [networkStats, setNetworkStats] = useState({
    bandwidth: { incoming: 0, outgoing: 0 },
    latency: 0,
    packetsLost: 0
  });
  const [chatMessage, setChatMessage] = useState('');
  const [showRecordings, setShowRecordings] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isLawyer = user?.role === 'LAWYER';

  // Initialize consultation
  useEffect(() => {
    if (consultationId) {
      joinConsultation();
    }
    
    return () => {
      leaveConsultation();
    };
  }, [consultationId, joinConsultation, leaveConsultation]);

  // Network stats monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      // This would be populated by the WebRTC hook with real stats
      // For now, simulating network stats
      setNetworkStats({
        bandwidth: { 
          incoming: Math.random() * 1000 + 500, 
          outgoing: Math.random() * 800 + 300 
        },
        latency: Math.random() * 50 + 20,
        packetsLost: Math.random() * 5
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle quality change
  const handleQualityChange = useCallback(async (quality: 'low' | 'medium' | 'high') => {
    try {
      await changeVideoQuality(quality);
      setSelectedQuality(quality);
    } catch (error) {
      console.error('Failed to change quality:', error);
    }
  }, [changeVideoQuality]);

  // Handle recording
  const handleStartRecording = useCallback(async () => {
    if (!isLawyer) {
      alert('Only lawyers can start recording');
      return;
    }
    
    try {
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [isLawyer, startRecording]);

  const handleStopRecording = useCallback(async () => {
    try {
      await stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, [stopRecording]);

  // Handle chat
  const handleSendMessage = useCallback(() => {
    if (chatMessage.trim()) {
      sendChatMessage();
      setChatMessage('');
    }
  }, [chatMessage, sendChatMessage]);

  // Handle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, [isFullscreen]);

  // Load recordings
  const loadRecordings = useCallback(async () => {
    try {
      const consultationRecordings = await getRecordings();
      setRecordings(consultationRecordings);
      setShowRecordings(true);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  }, [getRecordings]);

  // Connection quality indicator
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-orange-500';
      case 'offline': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!consultationId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-xl font-semibold mb-2">Invalid Consultation</h2>
          <p className="text-gray-600 mb-4">The consultation ID is missing or invalid.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`h-screen bg-gray-900 text-white relative overflow-hidden ${isFullscreen ? 'fullscreen' : ''}`}
    >
      {/* Main Video Area */}
      <div className="flex h-full">
        {/* Primary Video */}
        <div className="flex-1 relative">
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted={false}
          />
          
          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <VideoOff size={32} />
              </div>
            )}
          </div>

          {/* Connection Quality Indicator */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <Signal className={getQualityColor(connectionQuality)} size={20} />
              <span className="text-sm capitalize">{connectionQuality}</span>
              {networkStats.latency > 0 && (
                <span className="text-xs text-gray-300">
                  {Math.round(networkStats.latency)}ms
                </span>
              )}
            </div>
          </div>

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 rounded-lg px-3 py-1 flex items-center space-x-2">
              <Circle className="animate-pulse text-red-500 fill-current" size={16} />
              <span className="text-sm">REC {formatDuration(recordingDuration)}</span>
            </div>
          )}

          {/* Participant Count */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 rounded-lg p-2 flex items-center space-x-2">
            <Users size={16} />
            <span className="text-sm">{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-600 flex flex-col">
            <div className="p-4 border-b border-gray-600">
              <h3 className="font-semibold">Chat</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chatMessages.map((message: ChatMessage, index: number) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    message.senderId === user?.id
                      ? 'bg-blue-600 ml-8'
                      : 'bg-gray-700 mr-8'
                  }`}
                >
                  <div className="text-xs text-gray-300 mb-1">
                    {message.sender.firstName} {message.sender.lastName} • {new Date(message.createdAt).toLocaleTimeString()}
                  </div>
                  <div className="text-sm">{message.content}</div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-600">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-700 rounded text-white placeholder-gray-400"
                />
                <Button 
                  size="sm" 
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Audio Controls */}
          <Button
            variant={isAudioEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full w-12 h-12"
          >
            {isAudioEnabled ? <Mic /> : <MicOff />}
          </Button>

          {/* Video Controls */}
          <Button
            variant={isVideoEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-12 h-12"
          >
            {isVideoEnabled ? <Video /> : <VideoOff />}
          </Button>

          {/* Screen Share */}
          <Button
            variant={isScreenSharing ? "secondary" : "outline"}
            size="lg"
            onClick={toggleScreenShare}
            className="rounded-full w-12 h-12"
          >
            {isScreenSharing ? <MonitorOff /> : <Monitor />}
          </Button>

          {/* Recording Controls (Lawyer Only) */}
          {isLawyer && (
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className="rounded-full w-12 h-12"
            >
              {isRecording ? <StopCircle /> : <Circle />}
            </Button>
          )}

          {/* Chat Toggle */}
          <Button
            variant={showChat ? "secondary" : "outline"}
            size="lg"
            onClick={() => setShowChat(!showChat)}
            className="rounded-full w-12 h-12"
          >
            <MessageCircle />
          </Button>

          {/* Settings */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-full w-12 h-12"
          >
            <Settings />
          </Button>

          {/* Fullscreen */}
          <Button
            variant="outline"
            size="lg"
            onClick={toggleFullscreen}
            className="rounded-full w-12 h-12"
          >
            <Maximize2 />
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={() => {
              leaveConsultation();
              navigate('/dashboard');
            }}
            className="rounded-full w-12 h-12 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-4 right-4 w-80 bg-gray-800 rounded-lg p-4 border border-gray-600">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Settings</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
              ×
            </Button>
          </div>

          {/* Video Quality */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Video Quality</label>
            <select
              value={selectedQuality}
              onChange={(e) => handleQualityChange(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-3 py-2 bg-gray-700 rounded text-white"
            >
              {QUALITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.bitrate}
                </option>
              ))}
            </select>
          </div>

          {/* Network Statistics */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Network Statistics</h4>
            <div className="space-y-1 text-sm text-gray-300">
              <div>Latency: {Math.round(networkStats.latency)}ms</div>
              <div>Incoming: {Math.round(networkStats.bandwidth.incoming)} kbps</div>
              <div>Outgoing: {Math.round(networkStats.bandwidth.outgoing)} kbps</div>
              <div>Packets Lost: {Math.round(networkStats.packetsLost)}</div>
            </div>
          </div>

          {/* Recordings */}
          {isLawyer && (
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadRecordings}
                className="w-full"
              >
                <Download className="mr-2" size={16} />
                View Recordings
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Recordings Modal */}
      {showRecordings && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-96 overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Consultation Recordings</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowRecordings(false)}>
                ×
              </Button>
            </div>
            
            {recordings.length > 0 ? (
              <div className="space-y-2">
                {recordings.map((recording, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                    <div className="text-sm">
                      <div>{new Date(recording.createdAt).toLocaleDateString()}</div>
                      <div className="text-gray-400">{formatDuration(recording.duration)}</div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                No recordings available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40">
          <Card className="p-8 text-center bg-gray-800 border-gray-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2 text-white">Connecting...</h2>
            <p className="text-gray-300">Establishing video consultation connection</p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnhancedVideoConsultation;