import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';
    const where = { userId, ...(unreadOnly ? { isRead: false } : {}) };
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await prisma.notification.count({ where });
    const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });
    res.json({
      success: true,
      data: {
        notifications,
        pagination: { page, limit, total, unreadCount, hasMore: page * limit < total }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { notificationId } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() }
    });
    res.json({ success: true, data: updated, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

import type { NotificationType } from '@prisma/client';

export const createNotification = async (userId: string, type: NotificationType | string, title: string, message: string, data?: Record<string, unknown>) => {
  return prisma.notification.create({
    data: {
      userId,
      type: type as NotificationType,
      title,
      message
    }
  });
};
