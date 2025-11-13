import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const CreateMessageSchema = z.object({
  roomId: z.string().min(1, 'Room ID required'),
  content: z.string().min(1, 'Message content required').max(2000, 'Message too long'),
  messageType: z.enum(['TEXT', 'FILE', 'IMAGE', 'DOCUMENT']).default('TEXT'),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional()
});

const CreateChatRoomSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID required')
});

export const createChatRoom = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { bookingId } = CreateChatRoomSchema.parse(req.body);

    // Verify booking exists and user is participant
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: bookingId },
      include: {
        service: { select: { title: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.clientId !== userId && booking.providerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create chat for this booking'
      });
    }

    // Check if chat room already exists
    const existingRoom = await prisma.serviceBooking.findUnique({
      where: { id: bookingId },
      select: { id: true }
    });

    if (existingRoom) {
      // For now, return a mock chat room since Prisma models aren't generated
      const mockChatRoom = {
        id: `chat_${bookingId}`,
        bookingId: bookingId,
        clientId: booking.clientId,
        lawyerId: booking.providerId,
        status: 'ACTIVE',
        lastActivity: new Date(),
        createdAt: new Date()
      };

      return res.json({
        success: true,
        data: mockChatRoom,
        message: 'Chat room created successfully'
      });
    }

    // Create new chat room (mock for now)
    const chatRoom = {
      id: `chat_${bookingId}`,
      bookingId: bookingId,
      clientId: booking.clientId,
      lawyerId: booking.providerId,
      status: 'ACTIVE',
      lastActivity: new Date(),
      createdAt: new Date()
    };

    res.status(201).json({
      success: true,
      data: chatRoom,
      message: 'Chat room created successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    logger.error('Create chat room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat room'
    });
  }
};

export const getUserChatRooms = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get user's bookings that could have chat rooms
    const bookings = await prisma.serviceBooking.findMany({
      where: {
        OR: [
          { clientId: userId },
          { providerId: userId }
        ],
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] }
      },
      include: {
        service: {
          select: { id: true, title: true, type: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Get user details for each booking
    const userIds = [...new Set([
      ...bookings.map((b: any) => b.clientId),
      ...bookings.map((b: any) => b.providerId)
    ])];

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    type UserSummary = { id: string; firstName: string; lastName: string; email: string };
    const userMap = users.reduce((acc: Record<string, UserSummary>, user: UserSummary) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, UserSummary>);

    // Mock chat rooms based on bookings
  const chatRooms = bookings.map((booking: any) => ({
      id: `chat_${booking.id}`,
      bookingId: booking.id,
      clientId: booking.clientId,
      lawyerId: booking.providerId,
      status: 'ACTIVE',
      lastActivity: booking.updatedAt,
      service: booking.service,
      client: userMap[booking.clientId] || { 
        id: booking.clientId, 
        firstName: 'Client', 
        lastName: 'User', 
        email: 'client@example.com' 
      },
      lawyer: userMap[booking.providerId] || { 
        id: booking.providerId, 
        firstName: 'Lawyer', 
        lastName: 'User', 
        email: 'lawyer@example.com' 
      },
      unreadCount: 0, // Would be calculated from actual messages
      lastMessage: {
        content: 'Chat room created',
        createdAt: booking.createdAt,
        senderId: booking.clientId
      }
    }));

    res.json({
      success: true,
      data: chatRooms
    });

  } catch (error) {
    logger.error('Get user chat rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat rooms'
    });
  }
};

export const getChatMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user has access to this chat room (extract booking ID from room ID)
    const bookingId = roomId.replace('chat_', '');
    
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    if (booking.clientId !== userId && booking.providerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mock messages for now
    const mockMessages = [
      {
        id: 'msg_1',
        roomId: roomId,
        senderId: booking.clientId,
        content: 'Hello, I would like to discuss my legal matter.',
        messageType: 'TEXT',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        sender: {
          firstName: 'John',
          lastName: 'Doe',
          profilePicture: null
        }
      },
      {
        id: 'msg_2',
        roomId: roomId,
        senderId: booking.providerId,
        content: 'Of course! I\'d be happy to help. Could you provide more details about your case?',
        messageType: 'TEXT',
        isRead: true,
        createdAt: new Date(Date.now() - 3500000), // 55 minutes ago
        sender: {
          firstName: 'Jane',
          lastName: 'Smith',
          profilePicture: null
        }
      }
    ];

    res.json({
      success: true,
      data: {
        messages: mockMessages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: mockMessages.length,
          hasMore: false
        }
      }
    });

  } catch (error) {
    logger.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const validatedData = CreateMessageSchema.parse(req.body);

    // Verify user has access to this chat room
    const bookingId = validatedData.roomId.replace('chat_', '');
    
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    if (booking.clientId !== userId && booking.providerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create mock message
    const message = {
      id: `msg_${Date.now()}`,
      roomId: validatedData.roomId,
      senderId: userId,
      content: validatedData.content,
      messageType: validatedData.messageType,
      fileUrl: validatedData.fileUrl,
      fileName: validatedData.fileName,
      fileSize: validatedData.fileSize,
      isRead: false,
      createdAt: new Date(),
      sender: {
        firstName: 'User',
        lastName: 'Name',
        profilePicture: null
      }
    };

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    logger.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

export const markMessageRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { messageId } = req.params;

    // Mock successful read confirmation
    res.json({
      success: true,
      data: { messageId, readAt: new Date() },
      message: 'Message marked as read'
    });

  } catch (error) {
    logger.error('Mark message read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read'
    });
  }
};

export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    // Mock notifications
    const mockNotifications = [
      {
        id: 'notif_1',
        userId: userId,
        type: 'MESSAGE_RECEIVED',
        title: 'New Message',
        message: 'You have a new message from Jane Smith',
        data: { roomId: 'chat_booking_123' },
        isRead: false,
        createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
      },
      {
        id: 'notif_2',
        userId: userId,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed',
        message: 'Your legal consultation has been confirmed',
        data: { bookingId: 'booking_123' },
        isRead: true,
        readAt: new Date(Date.now() - 3600000),
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
      }
    ];

    const filteredNotifications = unreadOnly === 'true' 
      ? mockNotifications.filter(n => !n.isRead)
      : mockNotifications;

    res.json({
      success: true,
      data: {
        notifications: filteredNotifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredNotifications.length,
          unreadCount: mockNotifications.filter(n => !n.isRead).length
        }
      }
    });

  } catch (error) {
    logger.error('Get user notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};