import { io, Socket } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(BACKEND_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Typing indicators
  startTyping(conversationId: string): void {
    this.socket?.emit('typing_start', { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.socket?.emit('typing_stop', { conversationId });
  }

  // Message read receipts
  markMessageAsRead(messageId: string, conversationId: string): void {
    this.socket?.emit('message_read', { messageId, conversationId });
  }

  // Online status
  setOnlineStatus(status: 'online' | 'away' | 'offline'): void {
    this.socket?.emit('set_online_status', status);
  }

  // Event listeners
  onNewMessage(callback: (message: any) => void): void {
    this.socket?.on('new_message', callback);
  }

  onUserTyping(callback: (data: { userId: string; conversationId: string }) => void): void {
    this.socket?.on('user_typing', callback);
  }

  onUserStoppedTyping(callback: (data: { userId: string; conversationId: string }) => void): void {
    this.socket?.on('user_stopped_typing', callback);
  }

  onMessageReadReceipt(callback: (data: { messageId: string; readBy: string }) => void): void {
    this.socket?.on('message_read_receipt', callback);
  }

  onUserStatusChanged(callback: (data: { userId: string; status: string; lastSeen: Date }) => void): void {
    this.socket?.on('user_status_changed', callback);
  }

  onConversationUpdated(callback: (conversation: any) => void): void {
    this.socket?.on('conversation_updated', callback);
  }

  // Remove event listeners
  offNewMessage(callback?: (message: any) => void): void {
    this.socket?.off('new_message', callback);
  }

  offUserTyping(callback?: (data: any) => void): void {
    this.socket?.off('user_typing', callback);
  }

  offUserStoppedTyping(callback?: (data: any) => void): void {
    this.socket?.off('user_stopped_typing', callback);
  }

  offMessageReadReceipt(callback?: (data: any) => void): void {
    this.socket?.off('message_read_receipt', callback);
  }

  offUserStatusChanged(callback?: (data: any) => void): void {
    this.socket?.off('user_status_changed', callback);
  }

  offConversationUpdated(callback?: (conversation: any) => void): void {
    this.socket?.off('conversation_updated', callback);
  }
}

export const socketService = new SocketService();
export default socketService;
