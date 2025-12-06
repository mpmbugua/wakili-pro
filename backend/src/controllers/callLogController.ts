import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createCallLog = async (req: Request, res: Response) => {
  try {
    const {
      callerName,
      callerPhone,
      callerEmail,
      issueCategory,
      issueDescription,
      recommendation,
      recommendationNotes,
      callDuration,
      followUpRequired,
      followUpDate,
      handledBy
    } = req.body;

    const callLog = await prisma.callLog.create({
      data: {
        callerName,
        callerPhone,
        callerEmail,
        issueCategory,
        issueDescription,
        recommendation,
        recommendationNotes,
        callDuration,
        followUpRequired,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        handledBy,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      data: callLog
    });
  } catch (error) {
    console.error('Error creating call log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create call log'
    });
  }
};

export const getCallLogs = async (req: Request, res: Response) => {
  try {
    const { recommendation, status, startDate, endDate } = req.query;

    const where: any = {};
    
    if (recommendation) {
      where.recommendation = recommendation;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const callLogs = await prisma.callLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: callLogs
    });
  } catch (error) {
    console.error('Error fetching call logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call logs'
    });
  }
};

export const updateCallLogStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const callLog = await prisma.callLog.update({
      where: { id },
      data: { status }
    });

    res.status(200).json({
      success: true,
      data: callLog
    });
  } catch (error) {
    console.error('Error updating call log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update call log'
    });
  }
};

export const getCallLogStats = async (req: Request, res: Response) => {
  try {
    const totalCalls = await prisma.callLog.count();
    
    const byRecommendation = await prisma.callLog.groupBy({
      by: ['recommendation'],
      _count: true
    });

    const byStatus = await prisma.callLog.groupBy({
      by: ['status'],
      _count: true
    });

    const conversionRate = totalCalls > 0
      ? ((await prisma.callLog.count({ where: { status: 'CONVERTED' } }) / totalCalls) * 100).toFixed(1)
      : '0';

    res.status(200).json({
      success: true,
      data: {
        totalCalls,
        byRecommendation,
        byStatus,
        conversionRate
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};
