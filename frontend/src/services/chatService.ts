import { ApiResponse, PaginatedResponse } from '@shared/types';
import { api } from './api';
import io from 'socket.io-client';

type Socket = ReturnType<typeof io>;

// Types for chat functionality
export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  messageType: 'TEXT' | 'FILE' | 'IMAGE' | 'DOCUMENT';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  createdAt: Date;
  sender: {
    firstName: string;
    lastName: string;
    profilePicture?: string | null;
  };
}

export interface ChatRoom {
  id: string;
  bookingId: string;
  clientId: string;
  lawyerId: string;
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  lastActivity: Date;
  service: {
    id: string;
    title: string;
    type: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  lawyer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  unreadCount: number;
  lastMessage?: {
    content: string;
    createdAt: Date;
    senderId: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: 'MESSAGE_RECEIVED' | 'BOOKING_CONFIRMED' | 'PAYMENT_RECEIVED' | 'SYSTEM_ALERT';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface SendMessageRequest {
  roomId: string;
  content: string;
  messageType?: 'TEXT' | 'FILE' | 'IMAGE' | 'DOCUMENT';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

class ChatService {
  private socket: Socket | null = null;

  // Initialize Socket.IO connection
  initializeSocket(token: string) {
    
    this.socket = io(import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:5000', {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join a chat room
  joinRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('join_room', { roomId });
    }
  }

  // Leave a chat room
  leaveRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('leave_room', { roomId });
    }
  }

  // Send a message via socket
  sendSocketMessage(message: SendMessageRequest) {
    if (this.socket) {
      this.socket.emit('send_message', message);
    }
  }

  // Listen for new messages
  onNewMessage(callback: (message: ChatMessage) => void) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  // Listen for typing indicators
  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  // Send typing indicator
  sendTypingStatus(roomId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('typing', { roomId, isTyping });
    }
  }

  // Listen for notifications
  onNotification(callback: (notification: Notification) => void) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  // REST API Methods

  // Create a chat room for a booking
  async createChatRoom(bookingId: string): Promise<ApiResponse<ChatRoom>> {
    const response = await api.post<ApiResponse<ChatRoom>>('/chat/rooms', {
      bookingId
    });
    return response.data;
  }

  // Get user's chat rooms
  async getChatRooms(): Promise<ApiResponse<ChatRoom[]>> {
    const response = await api.get<ApiResponse<ChatRoom[]>>('/chat/rooms');
    return response.data;
  }

  // Get messages for a chat room
  async getChatMessages(
    roomId: string,
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<ChatMessage>> {
    const response = await api.get<PaginatedResponse<ChatMessage>>(
      `/chat/rooms/${roomId}/messages`,
      {
        params: { page, limit }
      }
    );
    return response.data;
  }

  // Send a message via REST API
  async sendMessage(messageData: SendMessageRequest): Promise<ApiResponse<ChatMessage>> {
    const response = await api.post<ApiResponse<ChatMessage>>('/chat/messages', messageData);
    return response.data;
  }

  // Mark message as read
  async markMessageRead(messageId: string): Promise<ApiResponse<{ messageId: string; readAt: Date }>> {
    const response = await api.patch<ApiResponse<{ messageId: string; readAt: Date }>>(
      `/chat/messages/${messageId}/read`
    );
    return response.data;
  }

  // Get user notifications
  async getNotifications(
    page = 1,
    limit = 20,
    unreadOnly = false
  ): Promise<PaginatedResponse<Notification>> {
    const response = await api.get<PaginatedResponse<Notification>>(
      '/chat/notifications',
      {
        params: { page, limit, unreadOnly }
      }
    );
    return response.data;
  }

  // Upload file for chat
  async uploadChatFile(file: File, roomId: string): Promise<ApiResponse<{ fileUrl: string; fileName: string; fileSize: number }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', roomId);

    const response = await api.post<ApiResponse<{ fileUrl: string; fileName: string; fileSize: number }>>(
      '/chat/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }

  // Get socket instance (for external listeners)
  getSocket(): Socket | null {
    return this.socket;
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;