import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import { WebRTCSignalSchema, ScreenShareRequestSchema, VideoSettingsUpdateSchema } from '@wakili-pro/shared';

const prisma = new PrismaClient();

interface AuthenticatedSocket {
  userId: string;
  email: string;
  role: string;
}

export class VideoSignalingServer {
  private io: Server;
  private authenticatedSockets = new Map<string, AuthenticatedSocket>();
  private roomParticipants = new Map<string, Set<string>>(); // roomId -> socketIds

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        this.authenticatedSockets.set(socket.id, {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        });

        socket.data = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };

        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = this.authenticatedSockets.get(socket.id);
      if (!user) return;

      logger.info(`User ${user.email} connected to video signaling server`);

      // Join video consultation room
      socket.on('join-consultation', async (data) => {
        try {
          const { consultationId } = data;
          
          // Verify user is authorized for this consultation
          const consultation = await prisma.videoConsultation.findUnique({
            where: { id: consultationId },
            include: { participants: true }
          });

          if (!consultation) {
            socket.emit('error', { message: 'Consultation not found' });
            return;
          }

          // Check if user is authorized
          if (consultation.lawyerId !== user.userId && consultation.clientId !== user.userId) {
            socket.emit('error', { message: 'Not authorized for this consultation' });
            return;
          }

          // Join the room
          await socket.join(consultation.roomId);
          
          // Track room participants
          if (!this.roomParticipants.has(consultation.roomId)) {
            this.roomParticipants.set(consultation.roomId, new Set());
          }
          this.roomParticipants.get(consultation.roomId)?.add(socket.id);

          // Update participant status in database
          await prisma.videoParticipant.upsert({
            where: {
              consultationId_userId: {
                consultationId: consultationId,
                userId: user.userId
              }
            },
            update: {
              connectionStatus: 'CONNECTED',
              joinedAt: new Date()
            },
            create: {
              consultationId: consultationId,
              userId: user.userId,
              participantType: consultation.lawyerId === user.userId ? 'LAWYER' : 'CLIENT',
              connectionStatus: 'CONNECTED',
              joinedAt: new Date(),
              hasVideo: true,
              hasAudio: true
            }
          });

          // Notify other participants
          socket.to(consultation.roomId).emit('participant-joined', {
            userId: user.userId,
            email: user.email,
            socketId: socket.id
          });

          // Send current participants to new joiner
          const participants = Array.from(this.roomParticipants.get(consultation.roomId) || [])
            .filter(id => id !== socket.id)
            .map(id => {
              const participant = this.authenticatedSockets.get(id);
              return participant ? {
                userId: participant.userId,
                email: participant.email,
                socketId: id
              } : null;
            })
            .filter(Boolean);

          socket.emit('existing-participants', participants);

          logger.info(`User ${user.email} joined consultation room: ${consultation.roomId}`);

        } catch (error) {
          logger.error('Join consultation error:', error);
          socket.emit('error', { message: 'Failed to join consultation' });
        }
      });

      // Handle WebRTC signaling
      socket.on('webrtc-signal', (data) => {
        try {
          const validatedData = WebRTCSignalSchema.parse(data);
          
          // Forward signal to target peer
          if (validatedData.targetSocketId) {
            socket.to(validatedData.targetSocketId).emit('webrtc-signal', {
              ...validatedData,
              sourceSocketId: socket.id,
              sourceUserId: user.userId
            });

            logger.debug(`WebRTC signal forwarded from ${socket.id} to ${validatedData.targetSocketId}`);
          }

        } catch (error) {
          logger.error('WebRTC signal error:', error);
          socket.emit('error', { message: 'Invalid WebRTC signal format' });
        }
      });

      // Handle screen sharing
      socket.on('screen-share-request', (data) => {
        try {
          const validatedData = ScreenShareRequestSchema.parse(data);
          
          // Broadcast screen share request to room
          socket.to(validatedData.roomId).emit('screen-share-started', {
            userId: user.userId,
            email: user.email,
            isSharing: validatedData.isSharing
          });

          logger.info(`Screen sharing ${validatedData.isSharing ? 'started' : 'stopped'} by ${user.email}`);

        } catch (error) {
          logger.error('Screen share request error:', error);
          socket.emit('error', { message: 'Invalid screen share request' });
        }
      });

      // Handle video/audio settings updates
      socket.on('update-video-settings', async (data) => {
        try {
          const validatedData = VideoSettingsUpdateSchema.parse(data);
          
          // Update participant settings in database
          await prisma.videoParticipant.updateMany({
            where: {
              consultationId: validatedData.consultationId,
              userId: user.userId
            },
            data: {
              hasVideo: validatedData.hasVideo,
              hasAudio: validatedData.hasAudio
            }
          });

          // Notify other participants
          const consultation = await prisma.videoConsultation.findUnique({
            where: { id: validatedData.consultationId },
            select: { roomId: true }
          });

          if (consultation) {
            socket.to(consultation.roomId).emit('participant-settings-updated', {
              userId: user.userId,
              hasVideo: validatedData.hasVideo,
              hasAudio: validatedData.hasAudio
            });
          }

        } catch (error) {
          logger.error('Video settings update error:', error);
          socket.emit('error', { message: 'Failed to update video settings' });
        }
      });

      // Handle chat messages during consultation
      socket.on('consultation-message', async (data) => {
        try {
          const { consultationId, message, roomId } = data;
          
          if (!message?.trim()) {
            socket.emit('error', { message: 'Message cannot be empty' });
            return;
          }

          // Verify user is in the consultation
          const consultation = await prisma.videoConsultation.findFirst({
            where: {
              id: consultationId,
              OR: [
                { lawyerId: user.userId },
                { clientId: user.userId }
              ]
            }
          });

          if (!consultation) {
            socket.emit('error', { message: 'Not authorized for this consultation' });
            return;
          }

          // Broadcast message to room
          const messageData = {
            userId: user.userId,
            email: user.email,
            message: message.trim(),
            timestamp: new Date().toISOString(),
            consultationId
          };

          this.io.to(roomId).emit('consultation-message', messageData);
          
          logger.info(`Consultation message sent by ${user.email} in room ${roomId}`);

        } catch (error) {
          logger.error('Consultation message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        try {
          const user = this.authenticatedSockets.get(socket.id);
          if (!user) return;

          // Find and update participant status
          await prisma.videoParticipant.updateMany({
            where: {
              userId: user.userId,
              connectionStatus: 'CONNECTED'
            },
            data: {
              connectionStatus: 'DISCONNECTED',
              leftAt: new Date()
            }
          });

          // Remove from room tracking
          for (const [roomId, participants] of this.roomParticipants.entries()) {
            if (participants.has(socket.id)) {
              participants.delete(socket.id);
              
              // Notify other participants
              socket.to(roomId).emit('participant-left', {
                userId: user.userId,
                email: user.email
              });

              // Clean up empty rooms
              if (participants.size === 0) {
                this.roomParticipants.delete(roomId);
              }
            }
          }

          this.authenticatedSockets.delete(socket.id);
          logger.info(`User ${user.email} disconnected from video signaling server`);

        } catch (error) {
          logger.error('Disconnect handling error:', error);
        }
      });
    });
  }

  public getIO(): Server {
    return this.io;
  }
}