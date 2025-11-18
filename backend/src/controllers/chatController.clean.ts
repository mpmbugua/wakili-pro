import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createNotification } from './notificationController';
import { z } from 'zod';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface AuthRequest<
  Body = any,
  Params = any,
  Query = any
> extends Request<Params, any, Body, Query> {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  body: Body;
  params: Params;
  query: Query;
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
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { bookingId } = CreateChatRoomSchema.parse(req.body);
    // Verify booking exists and user is participant
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.clientId !== userId && booking.providerId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to create chat for this booking' });
    }
    // Check if chat room already exists
    let chatRoom = await prisma.chatRoom.findFirst({ where: { bookingId } });
    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: {
          bookingId,
          clientId: booking.clientId,
          lawyerId: booking.providerId,
          status: 'ACTIVE' as const,
        },
      });
    }
    return res.status(201).json({
      success: true,
      data: chatRoom,
      message: 'Chat room created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    }
    logger.error('Create chat room error:', error);
    res.status(500).json({ success: false, message: 'Failed to create chat room' });
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
      status: 'ACTIVE' as const,
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
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { roomId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    // Verify user has access to this chat room
    const chatRoom = await prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!chatRoom) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }
    if (chatRoom.clientId !== userId && chatRoom.lawyerId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });
    const total = await prisma.chatMessage.count({ where: { roomId } });
    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          hasMore: page * limit < total
        }
      }
    });
  } catch (error) {
    logger.error('Get chat messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const validatedData = CreateMessageSchema.parse(req.body);
    // Verify user has access to this chat room
    const chatRoom = await prisma.chatRoom.findUnique({ where: { id: validatedData.roomId } });
    if (!chatRoom) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }
    if (chatRoom.clientId !== userId && chatRoom.lawyerId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const message = await prisma.chatMessage.create({
      data: {
        roomId: validatedData.roomId,
        senderId: userId,
        content: validatedData.content,
        messageType: validatedData.messageType,
        fileUrl: validatedData.fileUrl,
        fileName: validatedData.fileName,
        fileSize: validatedData.fileSize,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });
    // Update lastActivity on chat room
    await prisma.chatRoom.update({ where: { id: validatedData.roomId }, data: { lastActivity: new Date() } });

    // Send notification to recipient
    const recipientId = (chatRoom.clientId === userId) ? chatRoom.lawyerId : chatRoom.clientId;
    // Fetch sender's name
    const sender = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
    const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'a user';
    await createNotification(
      recipientId,
      'MESSAGE_RECEIVED',
      'New Message',
      `You have a new message from ${senderName}`,
      { roomId: validatedData.roomId, messageId: message.id }
    );

    res.status(201).json({ success: true, data: message, message: 'Message sent successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    }
    logger.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

export const markMessageRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { messageId } = req.params;
    const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    // Only recipient can mark as read (not sender)
    if (message.senderId === userId) {
      return res.status(403).json({ success: false, message: 'Sender cannot mark own message as read' });
    }
    const updated = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { isRead: true, editedAt: new Date() }
    });
    res.json({ success: true, data: { messageId, readAt: updated.editedAt }, message: 'Message marked as read' });
  } catch (error) {
    logger.error('Mark message read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark message as read' });
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
        type: 'MESSAGE_RECEIVED' as const,
        title: 'New Message',
        message: 'You have a new message from Jane Smith',
        data: { roomId: 'chat_booking_123' },
        isRead: false,
        createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
      },
      {
        id: 'notif_2',
        userId: userId,
        type: 'BOOKING_CONFIRMED' as const,
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
