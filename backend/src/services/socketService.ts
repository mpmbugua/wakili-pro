import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const initializeWebSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
      
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = decoded.userId;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    
    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`User connected: ${userId} (Socket ID: ${socket.id})`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Join all conversation rooms for this user
    joinUserConversations(socket, userId);

    // Handle typing indicator
    socket.on('typing_start', async (data: { conversationId: string }) => {
      try {
        // Verify user is in conversation
        const isParticipant = await verifyConversationParticipant(userId, data.conversationId);
        
        if (isParticipant) {
          socket.to(data.conversationId).emit('user_typing', {
            userId,
            conversationId: data.conversationId
          });
        }
      } catch (error) {
        console.error('Typing start error:', error);
      }
    });

    socket.on('typing_stop', async (data: { conversationId: string }) => {
      try {
        const isParticipant = await verifyConversationParticipant(userId, data.conversationId);
        
        if (isParticipant) {
          socket.to(data.conversationId).emit('user_stopped_typing', {
            userId,
            conversationId: data.conversationId
          });
        }
      } catch (error) {
        console.error('Typing stop error:', error);
      }
    });

    // Handle message read receipt
    socket.on('message_read', async (data: { messageId: string, conversationId: string }) => {
      try {
        const isParticipant = await verifyConversationParticipant(userId, data.conversationId);
        
        if (isParticipant) {
          // Update message read status
          await prisma.message.update({
            where: { id: data.messageId },
            data: { read: true }
          });

          // Notify sender
          socket.to(data.conversationId).emit('message_read_receipt', {
            messageId: data.messageId,
            readBy: userId
          });
        }
      } catch (error) {
        console.error('Message read error:', error);
      }
    });

    // Handle online status
    socket.on('set_online_status', async (status: 'online' | 'away' | 'offline') => {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { 
            onlineStatus: status,
            lastSeen: new Date()
          }
        });

        // Broadcast to all conversations
        const conversations = await getUserConversations(userId);
        
        conversations.forEach(conv => {
          socket.to(conv.id).emit('user_status_changed', {
            userId,
            status,
            lastSeen: new Date()
          });
        });
      } catch (error) {
        console.error('Set online status error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId} (Socket ID: ${socket.id})`);

      try {
        // Update last seen
        await prisma.user.update({
          where: { id: userId },
          data: { 
            onlineStatus: 'offline',
            lastSeen: new Date()
          }
        });

        // Notify conversations
        const conversations = await getUserConversations(userId);
        
        conversations.forEach(conv => {
          io.to(conv.id).emit('user_status_changed', {
            userId,
            status: 'offline',
            lastSeen: new Date()
          });
        });
      } catch (error) {
        console.error('Disconnect cleanup error:', error);
      }
    });
  });

  return io;
};

/**
 * Join all conversation rooms for a user
 */
async function joinUserConversations(socket: AuthenticatedSocket, userId: string): Promise<void> {
  try {
    const conversations = await getUserConversations(userId);
    
    conversations.forEach(conv => {
      socket.join(conv.id);
    });

    console.log(`User ${userId} joined ${conversations.length} conversation rooms`);
  } catch (error) {
    console.error('Join conversations error:', error);
  }
}

/**
 * Get all conversations for a user
 */
async function getUserConversations(userId: string) {
  return await prisma.conversation.findMany({
    where: {
      participants: {
        some: {
          userId: userId
        }
      }
    },
    select: {
      id: true
    }
  });
}

/**
 * Verify user is participant in conversation
 */
async function verifyConversationParticipant(userId: string, conversationId: string): Promise<boolean> {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: {
        some: {
          userId: userId
        }
      }
    }
  });

  return !!conversation;
}

/**
 * Emit new message to conversation participants
 */
export const emitNewMessage = (io: Server, message: any, conversationId: string): void => {
  io.to(conversationId).emit('new_message', message);
};

/**
 * Emit conversation update (new conversation created)
 */
export const emitConversationUpdate = (io: Server, userId: string, conversation: any): void => {
  io.to(`user:${userId}`).emit('conversation_updated', conversation);
};
