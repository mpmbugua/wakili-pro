import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Search, User, Paperclip, MoreVertical } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  lawyerId: string;
  lawyerName: string;
  lawyerImage?: string;
  specialty: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

export const MessagesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API endpoint
      // const response = await axiosInstance.get('/messages/conversations');
      // setConversations(response.data.data);
      
      // Mock data
      const mockConversations: Conversation[] = [
        {
          id: '1',
          lawyerId: 'lawyer1',
          lawyerName: 'Sarah Mwangi',
          specialty: 'Corporate Law',
          lastMessage: 'I have reviewed your contract and have some suggestions.',
          lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          unreadCount: 2,
          messages: [
            {
              id: 'm1',
              senderId: user?.id || 'user',
              content: 'Hello, I need help with my employment contract.',
              timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
              read: true,
            },
            {
              id: 'm2',
              senderId: 'lawyer1',
              content: 'Hello! I\'d be happy to help. Please send me the contract.',
              timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              read: true,
            },
            {
              id: 'm3',
              senderId: user?.id || 'user',
              content: 'Thank you! I\'ve attached the document.',
              timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
              read: true,
            },
            {
              id: 'm4',
              senderId: 'lawyer1',
              content: 'I have reviewed your contract and have some suggestions.',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              read: false,
            },
          ],
        },
        {
          id: '2',
          lawyerId: 'lawyer2',
          lawyerName: 'John Kamau',
          specialty: 'Family Law',
          lastMessage: 'The documents are ready for your review.',
          lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          unreadCount: 0,
          messages: [
            {
              id: 'm5',
              senderId: 'lawyer2',
              content: 'The documents are ready for your review.',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              read: true,
            },
          ],
        },
      ];
      setConversations(mockConversations);
      if (mockConversations.length > 0) {
        setSelectedConversation(mockConversations[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `m${Date.now()}`,
      senderId: user?.id || 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Update local state
    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              messages: [...conv.messages, message],
              lastMessage: newMessage,
              lastMessageTime: message.timestamp,
            }
          : conv
      )
    );

    setSelectedConversation(prev =>
      prev ? { ...prev, messages: [...prev.messages, message] } : null
    );

    setNewMessage('');

    // TODO: Send to API
    // await axiosInstance.post(`/messages/${selectedConversation.id}`, { content: newMessage });
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

  const filteredConversations = conversations.filter(conv =>
    conv.lawyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Conversations List */}
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

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`w-full p-4 flex items-start space-x-3 hover:bg-slate-50 transition border-b border-slate-100 ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-slate-900 truncate">{conversation.lawyerName}</h3>
                    <span className="text-xs text-slate-500">{formatTime(conversation.lastMessageTime)}</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-1">{conversation.specialty}</p>
                  <p className="text-sm text-slate-700 truncate">{conversation.lastMessage}</p>
                </div>
                {conversation.unreadCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                    {conversation.unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{selectedConversation.lawyerName}</h3>
                <p className="text-xs text-slate-600">{selectedConversation.specialty}</p>
              </div>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg">
              <MoreVertical className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {selectedConversation.messages.map((message) => {
              const isOwn = message.senderId === user?.id;
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md px-4 py-2 rounded-lg ${
                    isOwn ? 'bg-blue-600 text-white' : 'bg-white text-slate-900 border border-slate-200'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-slate-500'}`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
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
            <h3 className="text-lg font-medium text-slate-900 mb-2">Select a conversation</h3>
            <p className="text-slate-600">Choose a conversation from the list to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
