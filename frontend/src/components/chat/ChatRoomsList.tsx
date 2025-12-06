import React, { useState, useEffect } from 'react';
import { chatService, ChatRoom } from '../../services/chatService';
import { ChatComponent } from './ChatComponent';

// Mock useAuth hook
const useAuth = () => ({
  user: {
    id: 'client_123', // Match the test data clientId
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe'
  }
});

export const ChatRoomsList: React.FC = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load chat rooms
  const loadChatRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await chatService.getChatRooms();
      if (response.success && response.data) {
        setChatRooms(response.data);
      } else {
        setError(response.message || 'Failed to load chat rooms');
      }
    } catch (err) {
      console.error('Error loading chat rooms:', err);
      setError('Failed to load chat rooms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChatRooms();
  }, []);

  // Create new chat room for a booking
  const createChatRoom = async (bookingId: string) => {
    try {
      const response = await chatService.createChatRoom(bookingId);
      if (response.success && response.data) {
        setChatRooms(prev => [response.data!, ...prev]);
        setSelectedRoom(response.data);
      }
    } catch (err) {
      console.error('Error creating chat room:', err);
    }
  };

  // Format last activity time
  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      return 'Just now';
    }
  };

  // Get other participant name
  const getOtherParticipant = (room: ChatRoom) => {
    return user?.id === room.clientId ? room.lawyer : room.client;
  };

  if (selectedRoom) {
    return (
      <ChatComponent
        roomId={selectedRoom.id}
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
      />
    );
  }

  return (
    <div className="h-full bg-white border rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900">Chat Rooms</h2>
        <p className="text-sm text-gray-600">Your legal consultations</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadChatRooms}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-100"
            >
              Try Again
            </button>
          </div>
        ) : chatRooms.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.471c-2.576 1.969-6.094 1.969-6.094-1.969V9c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            </div>
            <p className="text-lg mb-2">No chat rooms yet</p>
            <p className="text-sm">Chat rooms will appear when you have confirmed bookings</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {chatRooms.map((room) => {
              const otherParticipant = getOtherParticipant(room);
              
              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-lg">
                          {otherParticipant.firstName.charAt(0)}{otherParticipant.lastName.charAt(0)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {otherParticipant.firstName} {otherParticipant.lastName}
                        </p>
                        <div className="flex items-center space-x-2">
                          {room.unreadCount > 0 && (
                            <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-2 py-1">
                              {room.unreadCount}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatLastActivity(room.lastActivity)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mb-1">
                        {room.service.title}
                      </p>
                      
                      {room.lastMessage && (
                        <p className="text-xs text-gray-500 truncate">
                          {room.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center justify-between mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      room.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800'
                        : room.status === 'CLOSED'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {room.status}
                    </span>
                    
                    <span className="text-xs text-gray-400">
                      Booking: {room.bookingId.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Demo Actions */}
      <div className="p-4 border-t bg-gray-50">
        <button
          onClick={() => createChatRoom('demo_booking_123')}
          className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-100 transition-colors"
        >
          Create Demo Chat Room
        </button>
      </div>
    </div>
  );
};