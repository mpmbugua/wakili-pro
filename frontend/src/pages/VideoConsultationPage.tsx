import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  MessageCircle,
  Users,
  Settings,
  PhoneOff
} from 'lucide-react';
import { useVideoConsultation } from '../hooks/useVideoConsultation';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface RemoteVideo {
  socketId: string;
  stream: MediaStream;
  userId: string;
}

export const VideoConsultationPage: React.FC = () => {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  
  const [remoteVideos, setRemoteVideos] = useState<RemoteVideo[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const {
    isConnected,
    participants,
    videoSettings,
    isJoining,
    roomMessages,
    localVideoRef,
    joinConsultation,
    leaveConsultation,
    updateVideoSettings,
    startScreenShare,
    stopScreenShare,
    sendMessage
  } = useVideoConsultation({
    consultationId: consultationId!,
    onParticipantJoined: (participant) => {
      console.log('Participant joined:', participant.email);
    },
    onParticipantLeft: (userId) => {
      console.log('Participant left:', userId);
      // Remove remote video
      setRemoteVideos(prev => prev.filter(v => v.userId !== userId));
    },
    onConsultationEnded: () => {
      alert('Consultation has ended');
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Video consultation error:', error);
      alert(`Video consultation error: ${error}`);
    }
  });

  // Handle remote streams
  useEffect(() => {
    const handleRemoteStream = (event: any) => {
      const { socketId, stream } = event.detail;
      const participant = participants.find(p => p.socketId === socketId);
      
      if (participant) {
        setRemoteVideos(prev => {
          const existing = prev.find(v => v.socketId === socketId);
          if (existing) {
            return prev.map(v => v.socketId === socketId ? { ...v, stream } : v);
          }
          return [...prev, { socketId, stream, userId: participant.userId }];
        });
      }
    };

    window.addEventListener('remote-stream', handleRemoteStream);
    return () => window.removeEventListener('remote-stream', handleRemoteStream);
  }, [participants]);

  // Update remote video elements when streams change
  useEffect(() => {
    remoteVideos.forEach(({ socketId, stream }) => {
      const videoElement = remoteVideoRefs.current.get(socketId);
      if (videoElement && videoElement.srcObject !== stream) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteVideos]);

  const handleToggleVideo = () => {
    updateVideoSettings({ hasVideo: !videoSettings.hasVideo });
  };

  const handleToggleAudio = () => {
    updateVideoSettings({ hasAudio: !videoSettings.hasAudio });
  };

  const handleToggleScreenShare = () => {
    if (videoSettings.isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      sendMessage(chatMessage);
      setChatMessage('');
    }
  };

  const handleEndCall = () => {
    leaveConsultation();
    navigate('/dashboard');
  };

  if (!consultationId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Consultation</h1>
          <p className="text-gray-600 mb-6">The consultation ID is missing or invalid.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Video Consultation</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-300">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">{participants.length + 1} participants</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className="relative"
          >
            <MessageCircle className="w-4 h-4" />
            {roomMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {roomMessages.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Video Area */}
        <div className="flex-1 relative">
          {/* Remote Videos Grid */}
          <div className={`grid gap-2 p-4 h-full ${
            remoteVideos.length === 1 ? 'grid-cols-1' :
            remoteVideos.length <= 4 ? 'grid-cols-2' :
            'grid-cols-3'
          }`}>
            {remoteVideos.map(({ socketId, userId }) => {
              const participant = participants.find(p => p.socketId === socketId);
              return (
                <div
                  key={socketId}
                  className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video"
                >
                  <video
                    ref={(el) => {
                      if (el) {
                        remoteVideoRefs.current.set(socketId, el);
                      } else {
                        remoteVideoRefs.current.delete(socketId);
                      }
                    }}
                    autoPlay
                    playsInline
                    muted={false}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Participant Info */}
                  <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">
                    {participant?.email || userId}
                  </div>
                  
                  {/* Video Status */}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    {!participant?.hasVideo && (
                      <div className="bg-red-500 p-1 rounded">
                        <VideoOff className="w-3 h-3" />
                      </div>
                    )}
                    {!participant?.hasAudio && (
                      <div className="bg-red-500 p-1 rounded">
                        <MicOff className="w-3 h-3" />
                      </div>
                    )}
                    {participant?.isScreenSharing && (
                      <div className="bg-blue-500 p-1 rounded">
                        <Monitor className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Show message when no other participants */}
            {remoteVideos.length === 0 && (
              <div className="col-span-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Waiting for other participants to join...</p>
                </div>
              </div>
            )}
          </div>

          {/* Local Video (Picture in Picture) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {!videoSettings.hasVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <VideoOff className="w-8 h-8 text-gray-400" />
              </div>
            )}
            
            <div className="absolute bottom-1 left-1 text-xs bg-black/50 px-1 rounded">
              You
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold">Chat</h3>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {roomMessages.map((msg, index) => (
                <div key={index} className="text-sm">
                  <div className="text-gray-400 text-xs">{msg.email}</div>
                  <div className="bg-gray-700 p-2 rounded mt-1">{msg.message}</div>
                </div>
              ))}
            </div>
            
            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <Button type="submit" size="sm">
                  Send
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <Card className="bg-gray-800/90 backdrop-blur border-gray-700">
          <div className="flex items-center space-x-4 p-4">
            {/* Join Button */}
            {!isConnected && (
              <Button
                onClick={joinConsultation}
                disabled={isJoining}
                className="bg-green-600 hover:bg-green-700"
              >
                {isJoining ? 'Joining...' : 'Join Call'}
              </Button>
            )}

            {/* Video Controls */}
            {isConnected && (
              <>
                <Button
                  onClick={handleToggleVideo}
                  variant={videoSettings.hasVideo ? 'secondary' : 'destructive'}
                  size="sm"
                  className="p-3"
                >
                  {videoSettings.hasVideo ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>

                <Button
                  onClick={handleToggleAudio}
                  variant={videoSettings.hasAudio ? 'secondary' : 'destructive'}
                  size="sm"
                  className="p-3"
                >
                  {videoSettings.hasAudio ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>

                <Button
                  onClick={handleToggleScreenShare}
                  variant={videoSettings.isScreenSharing ? 'default' : 'secondary'}
                  size="sm"
                  className="p-3"
                >
                  {videoSettings.isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </Button>

                <Button
                  onClick={() => setShowSettings(!showSettings)}
                  variant="secondary"
                  size="sm"
                  className="p-3"
                >
                  <Settings className="w-5 h-5" />
                </Button>

                <div className="w-px h-8 bg-gray-600" />

                <Button
                  onClick={handleEndCall}
                  variant="destructive"
                  size="sm"
                  className="p-3 bg-red-600 hover:bg-red-700"
                >
                  <PhoneOff className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};