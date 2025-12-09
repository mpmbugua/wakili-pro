import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Search, User, Paperclip, MoreVertical } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../lib/axios';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  messageType: string;
  sender?: {
    firstName: string;
    lastName: string;
  };
}

interface ChatRoom {
  id: string;
  bookingId: string;
  clientId: string;
  lawyerId: string;
  status: string;
  lastActivity: string;
  service?: {
    title: string;
    type: string;
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  lawyer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  unreadCount: number;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

export const MessagesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLawyer = user?.role === 'LAWYER';

  useEffect(() => {
    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/chat/rooms');
      
      if (response.data.success) {
        setChatRooms(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedRoom(response.data.data[0]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching chat rooms:', error);
      if (error.response?.status === 404 || error.response?.data?.message?.includes('No bookings')) {
        // User has no bookings/chats yet - this is normal
        setChatRooms([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      setLoadingMessages(true);
      const response = await axiosInstance.get(`/chat/rooms/${roomId}/messages`);
      
      if (response.data.success) {
        setMessages(response.data.data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      senderId: user?.id || '',
      content: newMessage,
      createdAt: new Date().toISOString(),
      isRead: false,
      messageType: 'TEXT',
      sender: {
        firstName: user?.firstName || '',
        lastName: user?.lastName || ''
      }
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, tempMessage]);
    const messageContent = newMessage;
    setNewMessage('');

    try {
      const response = await axiosInstance.post('/chat/messages', {
        roomId: selectedRoom.id,
        content: messageContent,
        messageType: 'TEXT'
      });

      if (response.data.success) {
        // Replace temp message with real one
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id ? response.data.data : msg
          )
        );

        // Update chat room last message
        setChatRooms(prev =>
          prev.map(room =>
            room.id === selectedRoom.id
              ? {
                  ...room,
                  lastMessage: {
                    content: messageContent,
                    createdAt: new Date().toISOString()
                  },
                  lastActivity: new Date().toISOString()
                }
              : room
          )
        );
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.response?.data?.message || 'Failed to send message');
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(messageContent); // Restore message text
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherParticipant = (room: ChatRoom) => {
    if (isLawyer) {
      return {
        name: `${room.client?.firstName} ${room.client?.lastName}`,
        email: room.client?.email
      };
    } else {
      return {
        name: `${room.lawyer?.firstName} ${room.lawyer?.lastName}`,
        email: room.lawyer?.email
      };
    }
  };

  const filteredRooms = chatRooms.filter(room => {
    const participant = getOtherParticipant(room);
    const serviceName = room.service?.title || '';
    return (
      participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      serviceName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Chat Rooms List */}
      <div className="w-full md:w-96 border-r border-slate-200 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Chat Room List */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-900 font-medium mb-2">No conversations yet</p>
              <p className="text-sm text-slate-600">
                {isLawyer 
                  ? 'Conversations will appear here when clients book your services'
                  : 'Book a consultation to start chatting with a lawyer'
                }
              </p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const participant = getOtherParticipant(room);
              return (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full p-4 flex items-start space-x-3 hover:bg-slate-50 transition border-b border-slate-100 ${
                    selectedRoom?.id === room.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {participant.name}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {room.lastMessage?.createdAt ? formatTime(room.lastMessage.createdAt) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{room.service?.title || 'Consultation'}</p>
                    <p className="text-sm text-slate-700 truncate">
                      {room.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {room.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                      {room.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message Thread */}
      {selectedRoom ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {getOtherParticipant(selectedRoom).name}
                </h3>
                <p className="text-xs text-slate-600">{selectedRoom.service?.title || 'Consultation'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Paid Booking
              </span>
              <button className="p-2 hover:bg-slate-100 rounded-lg">
                <MoreVertical className="h-5 w-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600">No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.senderId === user?.id;
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md px-4 py-2 rounded-lg ${
                      isOwn ? 'bg-blue-600 text-white' : 'bg-white text-slate-900 border border-slate-200'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-slate-500'}`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex items-center space-x-2">
              <button 
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                title="File attachments coming soon"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {chatRooms.length === 0 ? 'No conversations yet' : 'Select a conversation'}
            </h3>
            <p className="text-slate-600">
              {chatRooms.length === 0 
                ? isLawyer 
                  ? 'Chats will appear when clients book your services'
                  : 'Book a consultation to start chatting'
                : 'Choose a conversation from the list to start messaging'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
