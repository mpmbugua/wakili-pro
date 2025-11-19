import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient, MessageType, NotificationType } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

type AuthenticatedSocket = Socket & {
  userId: string;
  email: string;
  role: string;
  fullName: string;
}

interface SocketUser {
  userId: string;
  socketId: string;
  email: string;
  role: string;
  lastSeen: Date;
}

// Store active users
const activeUsers = new Map<string, SocketUser>();
const userSockets = new Map<string, string>(); // userId -> socketId

export class ChatService {
  private io: SocketIOServer;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    // Authentication middleware
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          throw new Error('No token provided');
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, role: true, firstName: true, lastName: true }
        });

        if (!user) {
          throw new Error('User not found');
        }

        socket.userId = user.id;
        socket.email = user.email;
        socket.role = user.role;
        socket.fullName = `${user.firstName} ${user.lastName}`;
        
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket: any) => {
      this.handleUserConnection(socket as AuthenticatedSocket);
    });
  }

  private handleUserConnection(socket: AuthenticatedSocket) {
    logger.info(`User connected: ${socket.email} (${socket.id})`);

    // Store active user
    activeUsers.set(socket.id, {
      userId: socket.userId,
      socketId: socket.id,
      email: socket.email,
      role: socket.role,
      lastSeen: new Date()
    });

    userSockets.set(socket.userId, socket.id);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Get user's active chat rooms
    this.joinUserChatRooms(socket);

    // Socket event handlers
    socket.on('join_chat_room', (data: any) => this.handleJoinChatRoom(socket, data));
    socket.on('send_message', (data: any) => this.handleSendMessage(socket, data));
    socket.on('message_read', (data: any) => this.handleMessageRead(socket, data));
    socket.on('typing_start', (data: any) => this.handleTypingStart(socket, data));
    socket.on('typing_stop', (data: any) => this.handleTypingStop(socket, data));
    socket.on('get_chat_history', (data: any) => this.handleGetChatHistory(socket, data));
    socket.on('mark_notifications_read', (data: any) => this.handleMarkNotificationsRead(socket, data));

    socket.on('disconnect', () => this.handleUserDisconnection(socket));

    // Send initial data
    this.sendUserStatus(socket);
  }

  private async joinUserChatRooms(socket: AuthenticatedSocket) {
    try {
      const chatRooms = await prisma.chatRoom.findMany({
        where: {
          OR: [
            { clientId: socket.userId },
            { lawyerId: socket.userId }
          ],
          status: 'ACTIVE'
        },
        select: { id: true }
      });

      chatRooms.forEach((room: { id: string }) => {
        socket.join(`chat_${room.id}`);
      });

      logger.info(`User ${socket.email} joined ${chatRooms.length} chat rooms`);
    } catch (error) {
      logger.error('Error joining chat rooms:', error);
    }
  }

  private async handleJoinChatRoom(socket: AuthenticatedSocket, data: { roomId: string }) {
    try {
      const chatRoom = await prisma.chatRoom.findFirst({
        where: {
          id: data.roomId,
          OR: [
            { clientId: socket.userId },
            { lawyerId: socket.userId }
          ]
        },
        include: {
          client: { select: { firstName: true, lastName: true } },
          lawyer: { select: { firstName: true, lastName: true } },
          booking: { 
            include: { 
              service: { select: { title: true, type: true } } 
            } 
          }
        }
      });

      if (!chatRoom) {
        socket.emit('error', { message: 'Chat room not found or access denied' });
        return;
      }

      socket.join(`chat_${data.roomId}`);
      
      // Send room info
      socket.emit('chat_room_joined', {
        roomId: data.roomId,
        client: chatRoom.client,
        lawyer: chatRoom.lawyer,
        booking: chatRoom.booking,
        status: chatRoom.status
      });

      // Update last activity
      await prisma.chatRoom.update({
        where: { id: data.roomId },
        data: { lastActivity: new Date() }
      });

    } catch (error) {
      logger.error('Error joining chat room:', error);
      socket.emit('error', { message: 'Failed to join chat room' });
    }
  }

  private async handleSendMessage(socket: AuthenticatedSocket, data: {
    roomId: string;
    content: string;
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }) {
    try {
      // Verify room access
      const chatRoom = await prisma.chatRoom.findFirst({
        where: {
          id: data.roomId,
          OR: [
            { clientId: socket.userId },
            { lawyerId: socket.userId }
          ]
        }
      });

      if (!chatRoom) {
        socket.emit('error', { message: 'Chat room not found or access denied' });
        return;
      }

      // Create message
      const message = await prisma.chatMessage.create({
        data: {
          roomId: data.roomId,
          senderId: socket.userId,
          content: data.content,
          messageType: (data.messageType as MessageType) || MessageType.TEXT,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize
        },
        include: {
          sender: {
            select: { firstName: true, lastName: true }
          }
        }
      });

      // Update room last activity
      await prisma.chatRoom.update({
        where: { id: data.roomId },
        data: { lastActivity: new Date() }
      });
            // clientId removed: not present in schema
      // Emit to room participants
      this.io.to(`chat_${data.roomId}`).emit('new_message', {
        id: message.id,
        roomId: message.roomId,
        senderId: message.senderId,
        content: message.content,
        messageType: message.messageType,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        sender: (message as any).sender,
        createdAt: message.createdAt,
        isRead: false
      });

      // Send notification to other participant
      const otherUserId = chatRoom.clientId === socket.userId ? chatRoom.lawyerId : chatRoom.clientId;
      await this.createNotification(otherUserId, {
        type: NotificationType.MESSAGE_RECEIVED,
        title: 'New Message',
        message: `New message from ${socket.fullName}`,
        data: { roomId: data.roomId, messageId: message.id }
      });

    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private async handleMessageRead(socket: AuthenticatedSocket, data: { messageId: string }) {
    try {
      await prisma.chatMessage.update({
        where: { id: data.messageId },
        data: { isRead: true }
      });

      // Emit read status to room
      const message = await prisma.chatMessage.findUnique({
        where: { id: data.messageId },
        select: { roomId: true }
      });

      if (message) {
        this.io.to(`chat_${message.roomId}`).emit('message_read', {
          messageId: data.messageId,
          readBy: socket.userId
        });
      }
    } catch (error) {
      logger.error('Error marking message as read:', error);
    }
  }

  private handleTypingStart(socket: AuthenticatedSocket, data: { roomId: string }) {
    socket.to(`chat_${data.roomId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping: true
    });
  }

  private handleTypingStop(socket: AuthenticatedSocket, data: { roomId: string }) {
    socket.to(`chat_${data.roomId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping: false
    });
  }

  private async handleGetChatHistory(socket: AuthenticatedSocket, data: {
    roomId: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const { roomId, page = 1, limit = 50 } = data;
      const skip = (page - 1) * limit;

      // Verify room access
      const chatRoom = await prisma.chatRoom.findFirst({
        where: {
          id: roomId,
          OR: [
            { clientId: socket.userId },
            { lawyerId: socket.userId }
          ]
        }
      });

      if (!chatRoom) {
        socket.emit('error', { message: 'Chat room not found or access denied' });
        return;
      }

      const messages = await prisma.chatMessage.findMany({
        where: { roomId },
        include: {
          sender: {
            select: { firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      socket.emit('chat_history', {
        roomId,
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: { page, limit, hasMore: messages.length === limit }
      });

    } catch (error) {
      logger.error('Error getting chat history:', error);
      socket.emit('error', { message: 'Failed to load chat history' });
    }
  }

  private async handleMarkNotificationsRead(socket: AuthenticatedSocket, data: { notificationIds: string[] }) {
    try {
      await prisma.notification.updateMany({
        where: {
          id: { in: data.notificationIds },
          userId: socket.userId
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      socket.emit('notifications_marked_read', { notificationIds: data.notificationIds });
    } catch (error) {
      logger.error('Error marking notifications as read:', error);
    }
  }

  private handleUserDisconnection(socket: AuthenticatedSocket) {
    logger.info(`User disconnected: ${socket.email} (${socket.id})`);
    
    activeUsers.delete(socket.id);
    userSockets.delete(socket.userId);
  }

  private async sendUserStatus(socket: AuthenticatedSocket) {
    try {
      // Get unread notification count
      const unreadCount = await prisma.notification.count({
        where: {
          userId: socket.userId,
          isRead: false
        }
      });

      socket.emit('user_status', {
        userId: socket.userId,
        unreadNotifications: unreadCount,
        connectedAt: new Date()
      });
    } catch (error) {
      logger.error('Error sending user status:', error);
    }
  }

  // Helper method to create notifications
  async createNotification(userId: string, notification: {
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
  }) {
    try {
      const newNotification = await prisma.notification.create({
        data: {
          userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
                // data removed: not present in schema
        }
      });

      // Send to user if they're online
      const userSocketId = userSockets.get(userId);
      if (userSocketId) {
        this.io.to(`user_${userId}`).emit('new_notification', newNotification);
      }

      return newNotification;
    } catch (error) {
      logger.error('Error creating notification:', error);
    }
  }

  // Helper method to create chat room for a booking
  async createChatRoom(bookingId: string, clientId: string, lawyerId: string) {
    try {
      const chatRoom = await prisma.chatRoom.create({
        data: {
                // name removed: not present in schema
          bookingId,
          clientId,
          lawyerId,
          status: 'ACTIVE',
          lastActivity: new Date()
        }
      });
      // Notify both parties
      this.io.to(`user_${clientId}`).emit('chat_room_created', { roomId: chatRoom.id, bookingId });
      this.io.to(`user_${lawyerId}`).emit('chat_room_created', { roomId: chatRoom.id, bookingId });
      return chatRoom;
    } catch (error) {
      logger.error('Error creating chat room:', error);
      throw error;
    }
  }

  // Get active users count
  getActiveUsersCount(): number {
    return activeUsers.size;
  }

  // Get active users list (for admin)
  getActiveUsers(): SocketUser[] {
    return Array.from(activeUsers.values());
  }
}

export default ChatService;