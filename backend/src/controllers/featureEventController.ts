import { Response } from 'express';
import { prisma } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';

// POST /analytics/event - log a feature event
export const logFeatureEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { type, details } = req.body;
    if (!type) {
      return res.status(400).json({ success: false, message: 'Event type required' });
    }
    await prisma.featureEvent.create({
      data: {
        userId,
        type,
        details: details || {},
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging feature event:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /analytics/feature-events - aggregate feature event stats
export const getFeatureEventStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only allow admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }
    // Aggregate stats for last 30 days
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await prisma.featureEvent.findMany({
      where: { createdAt: { gte: since } },
    });
    // Aggregate counts
    const aiChatMessages = events.filter(e => e.type === 'ai_chat_message_sent').length;
    const aiChatAudio = events.filter(e => e.type === 'ai_chat_audio_played').length;
    const aiChatByLanguage = events.filter(e => e.type.startsWith('ai_chat')).reduce((acc, e) => {
      let lang = 'unknown';
      if (e.details && typeof e.details === 'object' && !Array.isArray(e.details) && 'language' in e.details) {
        lang = (e.details as { language?: string }).language || 'unknown';
      }
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const emergencyInitiated = events.filter(e => e.type === 'emergency_connect_payment_initiated').length;
    const emergencySuccess = events.filter(e => e.type === 'emergency_connect_payment_success').length;
    const emergencyByLawyer = events.filter(e => e.type.startsWith('emergency_connect')).reduce((acc, e) => {
      let lawyer = 'unknown';
      if (e.details && typeof e.details === 'object' && !Array.isArray(e.details) && 'lawyerName' in e.details) {
        lawyer = (e.details as { lawyerName?: string }).lawyerName || 'unknown';
      }
      acc[lawyer] = (acc[lawyer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    // Timeline (per day)
    const timeline: Array<{ date: string; aiChat: number; emergency: number }> = [];
    for (let i = 0; i < 30; i++) {
      const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = day.toISOString().split('T')[0];
      timeline.unshift({
        date: dateStr,
        aiChat: events.filter(e => e.type.startsWith('ai_chat') && e.createdAt.toISOString().startsWith(dateStr)).length,
        emergency: events.filter(e => e.type.startsWith('emergency_connect') && e.createdAt.toISOString().startsWith(dateStr)).length,
      });
    }
    res.json({
      aiChatMessages,
      aiChatAudio,
      aiChatByLanguage,
      emergencyInitiated,
      emergencySuccess,
      emergencyByLawyer,
      timeline
    });
  } catch (error) {
    console.error('Error aggregating feature event stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
