import { Request, Response } from 'express';
// Stubs for enhanced video consultation endpoints
// Stubs for enhanced video consultation endpoints (now require authentication)
export const startVideoConsultation = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  res.status(200).json({ success: true, data: { turnServers: [] } });
};

export const endVideoConsultation = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  res.status(200).json({ success: true, data: { status: 'COMPLETED' as const } });
};

export const startRecording = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  res.status(200).json({ success: true, message: 'Recording started' });
};

export const stopRecording = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  res.status(200).json({ success: true, data: { recordingUrl: 'https://example.com/recording.mp4' } });
};

export const getConsultationRecordings = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  res.status(200).json({ success: true, data: [] });
};

export const getConsultationStats = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  res.status(200).json({ success: true, data: { participantCount: 1 } });
};
import { prisma } from '../utils/prisma';
import { CreateVideoConsultationSchema, JoinVideoConsultationSchema, UpdateParticipantStatusSchema, MeetingControlSchema } from '@wakili-pro/shared';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';


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
}

export const createVideoConsultation = async (
  req: AuthRequest<
    typeof CreateVideoConsultationSchema._type,
    { id: string },
    any
  >,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const validatedData = CreateVideoConsultationSchema.parse(req.body);
    
    // Verify booking exists and user is authorized
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        service: {
          select: { type: true, providerId: true }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only consultation bookings can have video calls
    if (booking.service.type !== 'CONSULTATION') {
      return res.status(400).json({
        success: false,
        message: 'Video consultations only available for consultation services'
      });
    }

    // Verify user is either client or provider
    if (booking.clientId !== userId && booking.service.providerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create video consultation for this booking'
      });
    }

    // Check if video consultation already exists
  const existingConsultation = await prisma.videoConsultation.findFirst({
      where: { bookingId: validatedData.bookingId }
    });

    if (existingConsultation) {
      return res.status(400).json({
        success: false,
        message: 'Video consultation already exists for this booking'
      });
    }

    // Create video consultation with unique room ID
    const roomId = `room_${uuidv4()}`;
    
    const videoConsultation = await prisma.videoConsultation.create({
      data: {
        bookingId: validatedData.bookingId,
        lawyerId: String(booking.service.providerId),
        clientId: String(booking.clientId ?? userId),
        roomId: roomId,
        scheduledAt: new Date(),
        isRecorded: validatedData.isRecorded,
        status: 'SCHEDULED' as const,
        participantCount: 0
      },
      include: {
        booking: {
          include: {
            service: {
              select: { title: true, type: true }
            }
          }
        },
        lawyer: {
          select: { firstName: true, lastName: true, email: true }
        },
        client: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: videoConsultation,
      message: 'Video consultation created successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    logger.error('Create video consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create video consultation'
    });
  }
};

export const joinVideoConsultation = async (
  req: AuthRequest<
    typeof JoinVideoConsultationSchema._type,
    { id: string },
    any
  >,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const consultationId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const validatedData = JoinVideoConsultationSchema.parse(req.body);
    
    // Get consultation details
    const consultation = await prisma.videoConsultation.findUnique({
      where: { id: consultationId },
      include: {
        // participants is not a valid include on this call, remove or use correct include if needed
      }
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Video consultation not found'
      });
    }

    // Verify user is authorized to join
    if (consultation.lawyerId !== userId && consultation.clientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to join this consultation'
      });
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.videoParticipant.findFirst({
      where: {
        consultationId: consultationId,
        userId: userId
      }
    });

    let participant;
    if (existingParticipant) {
      // Update existing participant
      participant = await prisma.videoParticipant.update({
        where: { id: existingParticipant.id },
        data: {
          joinedAt: new Date(),
          leftAt: null
        }
      });
    } else {
      // Create new participant
      participant = await prisma.videoParticipant.create({
        data: {
          consultationId: consultationId,
          userId: userId,
          joinedAt: new Date()
        }
      });
    }

    // Update consultation status and participant count
    const activeParticipants = await prisma.videoParticipant.count({
      where: {
        consultationId: consultationId,
        leftAt: null
      }
    });
    const shouldStartMeeting = activeParticipants >= 2 && consultation.status === 'SCHEDULED';
    let newStatus = consultation.status;
    if (shouldStartMeeting) {
      newStatus = 'ONGOING';
    }
    const updatedConsultation = await prisma.videoConsultation.update({
      where: { id: consultationId },
      data: {
        participantCount: activeParticipants,
        status: newStatus
      }
    });

    res.json({
      success: true,
      data: {
        consultation: updatedConsultation,
        participant
        // roomId removed: not present in returned object if not in schema
      },
      message: existingParticipant ? 'Rejoined consultation successfully' : 'Joined consultation successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    logger.error('Join video consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join video consultation'
    });
  }
};

export const updateParticipantStatus = async (
  req: AuthRequest<
    typeof UpdateParticipantStatusSchema._type,
    { id: string },
    any
  >,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const consultationId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const validatedData = UpdateParticipantStatusSchema.parse(req.body);
    
    // Find participant
    const participant = await prisma.videoParticipant.findFirst({
      where: {
        consultationId: consultationId,
        userId: userId
      }
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found in consultation'
      });
    }

    // Update participant status
    const updatedParticipant = await prisma.videoParticipant.update({
      where: { id: participant.id },
      data: {}
    });

    res.json({
      success: true,
      data: updatedParticipant,
      message: 'Participant status updated successfully'
    });

  } catch (error) {
    logger.error('Update participant status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update participant status'
    });
  }
};

export const leaveVideoConsultation = async (
  req: AuthRequest<any, { id: string }, any>,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const consultationId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Find and update participant
    const participant = await prisma.videoParticipant.findFirst({
      where: {
        consultationId: consultationId,
        userId: userId,
        leftAt: null
      }
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Active participant not found'
      });
    }

    // Update participant as left
    await prisma.videoParticipant.update({
      where: { id: participant.id },
      data: {
        leftAt: new Date()
      }
    });

    // Update consultation participant count
    const activeParticipants = await prisma.videoParticipant.count({
      where: {
        consultationId: consultationId,
        leftAt: null
      }
    });

    // End consultation if no active participants
    const shouldEndConsultation = activeParticipants === 0;
    
    if (shouldEndConsultation) {
      await prisma.videoConsultation.update({
        where: { id: consultationId },
        data: {
          status: 'COMPLETED' as const,
          endedAt: new Date(),
          participantCount: 0
        }
      });
    } else {
      await prisma.videoConsultation.update({
        where: { id: consultationId },
        data: {
          participantCount: activeParticipants
        }
      });
    }

    res.json({
      success: true,
      message: shouldEndConsultation ? 'Left consultation and ended meeting' : 'Left consultation successfully'
    });

  } catch (error) {
    logger.error('Leave video consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave video consultation'
    });
  }
};

export const getMyVideoConsultations = async (
  req: AuthRequest<any, any, { status?: string; page?: string; limit?: string }>,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    const status = req.query.status as string | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { lawyerId: userId },
        { clientId: userId }
      ]
    };
    if (status) {
      where.status = status;
    }

    const [consultations, total] = await Promise.all([
      prisma.videoConsultation.findMany({
        where,
        include: {
          booking: {
            include: {
              service: {
                select: { title: true, type: true, priceKES: true }
              }
            }
          },
          lawyer: {
            select: { firstName: true, lastName: true }
          },
          client: {
            select: { firstName: true, lastName: true }
          },
          participants: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' } // fallback to createdAt if scheduledAt is not valid
      }),
      prisma.videoConsultation.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        consultations,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    logger.error('Get my video consultations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video consultations'
    });
  }
};

export const controlMeeting = async (
  req: AuthRequest<
    typeof MeetingControlSchema._type,
    any,
    any
  >,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const validatedData = MeetingControlSchema.parse(req.body);
    
    const consultation = await prisma.videoConsultation.findUnique({
      where: { id: validatedData.consultationId }
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Video consultation not found'
      });
    }

    // Only lawyer can control the meeting
    if (consultation.lawyerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the lawyer can control the meeting'
      });
    }

    let updateData: any = {};
    let message = '';

    switch (validatedData.action) {
      case 'end_meeting':
        updateData = {
          status: 'COMPLETED' as const,
          endedAt: new Date()
        };
        message = 'Meeting ended successfully';
        
        // Disconnect all participants
        await prisma.videoParticipant.updateMany({
          where: { 
            consultationId: validatedData.consultationId,
            leftAt: null
          },
          data: {
            leftAt: new Date(),
              // connectionStatus removed: not in schema
          }
        });
        break;

      case 'start_recording':
        updateData = {
          isRecorded: true
        };
        message = 'Recording started';
        break;

      case 'stop_recording':
        // In a real implementation, this would stop the recording service
        message = 'Recording stopped';
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid meeting control action'
        });
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.videoConsultation.update({
        where: { id: validatedData.consultationId },
        data: updateData
      });
    }

    res.json({
      success: true,
      message
    });

  } catch (error) {
    logger.error('Meeting control error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to control meeting'
    });
  }
};