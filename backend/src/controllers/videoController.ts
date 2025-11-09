import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  CreateVideoConsultationSchema,
  JoinVideoConsultationSchema,
  UpdateParticipantStatusSchema,
  MeetingControlSchema
} from '../../../shared/src/schemas/video';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const createVideoConsultation = async (req: AuthRequest, res: Response) => {
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
    const existingConsultation = await prisma.videoConsultation.findUnique({
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
        lawyerId: booking.providerId,
        clientId: booking.clientId,
        roomId: roomId,
        scheduledAt: new Date(validatedData.scheduledAt),
        isRecorded: validatedData.isRecorded,
        meetingNotes: validatedData.meetingNotes,
        status: 'SCHEDULED'
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

export const joinVideoConsultation = async (req: AuthRequest, res: Response) => {
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
        participants: true
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
    const existingParticipant = consultation.participants.find((p: any) => p.userId === userId);
    
    if (existingParticipant) {
      // Update existing participant
      const updatedParticipant = await prisma.videoParticipant.update({
        where: { id: existingParticipant.id },
        data: {
          joinedAt: new Date(),
          connectionStatus: 'CONNECTING',
          hasVideo: validatedData.hasVideo,
          hasAudio: validatedData.hasAudio,
          leftAt: null
        }
      });

      // Update consultation participant count
      const activeParticipants = await prisma.videoParticipant.count({
        where: {
          consultationId: consultationId,
          connectionStatus: { in: ['CONNECTING', 'CONNECTED'] }
        }
      });

      await prisma.videoConsultation.update({
        where: { id: consultationId },
        data: {
          participantCount: activeParticipants,
          status: activeParticipants > 0 ? 'WAITING_FOR_PARTICIPANTS' : consultation.status
        }
      });

      return res.json({
        success: true,
        data: {
          consultation,
          participant: updatedParticipant,
          roomId: consultation.roomId
        },
        message: 'Rejoined consultation successfully'
      });
    }

    // Create new participant
    const participant = await prisma.videoParticipant.create({
      data: {
        consultationId: consultationId,
        userId: userId,
        participantType: validatedData.participantType,
        joinedAt: new Date(),
        connectionStatus: 'CONNECTING',
        hasVideo: validatedData.hasVideo,
        hasAudio: validatedData.hasAudio
      }
    });

    // Update consultation status and participant count
    const activeParticipants = consultation.participants.length + 1;
    const shouldStartMeeting = activeParticipants >= 2 && consultation.status === 'SCHEDULED';
    
    const updatedConsultation = await prisma.videoConsultation.update({
      where: { id: consultationId },
      data: {
        participantCount: activeParticipants,
        status: shouldStartMeeting ? 'IN_PROGRESS' : 'WAITING_FOR_PARTICIPANTS',
        startedAt: shouldStartMeeting ? new Date() : undefined
      }
    });

    res.json({
      success: true,
      data: {
        consultation: updatedConsultation,
        participant,
        roomId: consultation.roomId
      },
      message: 'Joined consultation successfully'
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

export const updateParticipantStatus = async (req: AuthRequest, res: Response) => {
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
      data: validatedData
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

export const leaveVideoConsultation = async (req: AuthRequest, res: Response) => {
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
        leftAt: new Date(),
        connectionStatus: 'DISCONNECTED'
      }
    });

    // Update consultation participant count
    const activeParticipants = await prisma.videoParticipant.count({
      where: {
        consultationId: consultationId,
        connectionStatus: { in: ['CONNECTING', 'CONNECTED'] },
        leftAt: null
      }
    });

    // End consultation if no active participants
    const shouldEndConsultation = activeParticipants === 0;
    
    if (shouldEndConsultation) {
      await prisma.videoConsultation.update({
        where: { id: consultationId },
        data: {
          status: 'COMPLETED',
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

export const getMyVideoConsultations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      OR: [
        { lawyerId: userId },
        { authorId: userId }
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
            // TODO: Add profilePicture to User model
          },
          client: {
            select: { firstName: true, lastName: true }
            // TODO: Add profilePicture to User model
          },
          participants: {
            select: {
              participantType: true,
              joinedAt: true,
              leftAt: true,
              connectionStatus: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { scheduledAt: 'desc' }
      }),
      prisma.videoConsultation.count({ where })
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        consultations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
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

export const controlMeeting = async (req: AuthRequest, res: Response) => {
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
          status: 'COMPLETED',
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
            connectionStatus: 'DISCONNECTED'
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