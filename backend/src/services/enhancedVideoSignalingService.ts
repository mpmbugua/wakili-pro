import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { authenticateSocket } from '../middleware/socketAuth';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { recordingService } from './recordingService';
import { webrtcConfig } from './webrtcConfigService';
import { performanceTestingService } from './performanceTestingService';
import { mobileIntegrationService } from './mobileIntegrationService';

export interface VideoSignalingRoom {
  consultationId: string;
  participants: Map<string, ParticipantInfo>;
  isRecording: boolean;
  recordingStartedAt?: Date;
  createdAt: Date;
  lastActivity: Date;
  settings: RoomSettings;
  metrics: RoomMetrics;
}

export interface ParticipantInfo {
  userId: string;
  socketId: string;
  role: 'CLIENT' | 'LAWYER';
  displayName: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  connectionStatus: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  joinedAt: Date;
  lastSeen: Date;
  deviceInfo?: {
    platform: string;
    browser?: string;
    isMobile: boolean;
  };
  mediaStats?: {
    audioPacketsLost: number;
    videoPacketsLost: number;
    roundTripTime: number;
    jitter: number;
    bandwidth: {
      incoming: number;
      outgoing: number;
    };
  };
}

export interface RoomSettings {
  maxParticipants: number;
  recordingEnabled: boolean;
  autoRecording: boolean;
  qualityProfile: 'low' | 'medium' | 'high';
  simulcastEnabled: boolean;
  screenShareEnabled: boolean;
  chatEnabled: boolean;
  waitingRoomEnabled: boolean;
}

export interface RoomMetrics {
  totalParticipants: number;
  activeParticipants: number;
  averageConnectionQuality: string;
  networkStability: number;
  cpuUsage: number;
  memoryUsage: number;
  bandwidth: {
    total: number;
    audio: number;
    video: number;
  };
}

class VideoSignalingService {
  private io: SocketIOServer;
  private rooms: Map<string, VideoSignalingRoom> = new Map();
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId
  private metricsInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupSocketHandlers();
    this.startBackgroundTasks();
  }

  private setupMiddleware() {
    // Authenticate socket connections
    this.io.use(authenticateSocket);
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      const userId = (socket as any).user?.id;
      const userRole = (socket as any).user?.role;
      
      if (!userId) {
        logger.warn('Unauthenticated socket connection attempt');
        socket.disconnect();
        return;
      }

      logger.info(`User ${userId} connected to video signaling`, { 
        socketId: socket.id,
        userRole 
      });

      // Map user to socket
      this.userSockets.set(userId, socket.id);
      this.socketUsers.set(socket.id, userId);

      // Join consultation room
      socket.on('join-consultation', async (data) => {
        await this.handleJoinConsultation(socket, data);
      });

      // Leave consultation room
      socket.on('leave-consultation', async (data) => {
        await this.handleLeaveConsultation(socket, data);
      });

      // WebRTC signaling
      socket.on('offer', (data) => {
        this.handleOffer(socket, data);
      });

      socket.on('answer', (data) => {
        this.handleAnswer(socket, data);
      });

      socket.on('ice-candidate', (data) => {
        this.handleIceCandidate(socket, data);
      });

      // Media control events
      socket.on('toggle-audio', (data) => {
        this.handleToggleAudio(socket, data);
      });

      socket.on('toggle-video', (data) => {
        this.handleToggleVideo(socket, data);
      });

      socket.on('toggle-screen-share', (data) => {
        this.handleToggleScreenShare(socket, data);
      });

      // Recording control
      socket.on('start-recording', async (data) => {
        await this.handleStartRecording(socket, data);
      });

      socket.on('stop-recording', async (data) => {
        await this.handleStopRecording(socket, data);
      });

      // Quality and performance
      socket.on('report-stats', (data) => {
        this.handleStatsReport(socket, data);
      });

      socket.on('change-quality', (data) => {
        this.handleChangeQuality(socket, data);
      });

      // Chat messages
      socket.on('chat-message', (data) => {
        this.handleChatMessage(socket, data);
      });

      // Connection quality updates
      socket.on('connection-quality-update', (data) => {
        this.handleConnectionQualityUpdate(socket, data);
      });

      // Device info reporting
      socket.on('report-device-info', (data) => {
        this.handleDeviceInfoReport(socket, data);
      });

      // Disconnect handler
      socket.on('disconnect', async (reason) => {
        await this.handleDisconnect(socket, reason);
      });

      // Send initial configuration
      this.sendInitialConfig(socket);
    });
  }

  private async handleJoinConsultation(socket: any, data: { consultationId: string }) {
    try {
      const userId = this.socketUsers.get(socket.id);
      if (!userId) return;

      const { consultationId } = data;

      // Verify consultation access
      const consultation = await prisma.videoConsultation.findFirst({
        where: {
          id: consultationId,
          OR: [
            { clientId: userId },
            { lawyerId: userId }
          ]
        },
        include: {
          booking: {
            include: {
              client: { select: { id: true, email: true } },
              provider: { select: { id: true, email: true } }
            }
          }
        }
      });

      if (!consultation) {
        socket.emit('error', { message: 'Consultation not found or access denied' });
        return;
      }

      // Get or create room
      let room = this.rooms.get(consultationId);
      if (!room) {
        room = this.createRoom(consultationId);
      }

      // Check room capacity
      if (room.participants.size >= room.settings.maxParticipants) {
        socket.emit('error', { message: 'Consultation room is full' });
        return;
      }

      // Determine participant role and info
      const isLawyer = consultation.lawyerId === userId;
      const userInfo = isLawyer ? consultation.booking.provider : consultation.booking.client;
      const role = isLawyer ? 'LAWYER' : 'CLIENT';

      const participant: ParticipantInfo = {
        userId,
        socketId: socket.id,
        role,
        displayName: userInfo.email,
        audioEnabled: true,
        videoEnabled: true,
        screenSharing: false,
        connectionStatus: 'connecting',
        connectionQuality: 'good',
        joinedAt: new Date(),
        lastSeen: new Date()
      };

      // Add participant to room
      room.participants.set(userId, participant);
      room.lastActivity = new Date();

      // Join socket to room
      socket.join(consultationId);

      // Update consultation status
      await this.updateConsultationStatus(consultationId, 'IN_PROGRESS');

      // Notify other participants
      socket.to(consultationId).emit('participant-joined', {
        participant: this.sanitizeParticipantInfo(participant)
      });

      // Send room info to joining participant
      socket.emit('consultation-joined', {
        consultationId,
        participants: Array.from(room.participants.values()).map(p => 
          this.sanitizeParticipantInfo(p)
        ),
        isRecording: room.isRecording,
        settings: room.settings,
        webrtcConfig: webrtcConfig.getWebRTCConfig()
      });

      // Send mobile notification to other participant if they're not online
      const otherParticipantId = isLawyer ? consultation.clientId : consultation.lawyerId;
      if (!this.userSockets.has(otherParticipantId)) {
        await mobileIntegrationService.sendVideoCallNotification(
          otherParticipantId,
          {
            title: 'Incoming Video Consultation',
            body: `${participant.displayName} is calling you`,
            consultationId,
            roomId: consultationId,
            callerName: participant.displayName,
            callType: 'incoming',
            data: {
              type: 'video_call',
              consultationId,
              action: 'join_call'
            }
          }
        );
      }

      logger.info(`User ${userId} joined consultation ${consultationId}`, {
        role,
        participantCount: room.participants.size
      });

    } catch (error) {
      logger.error('Error joining consultation:', error);
      socket.emit('error', { message: 'Failed to join consultation' });
    }
  }

  private async handleLeaveConsultation(socket: any, data: { consultationId: string }) {
    try {
      const userId = this.socketUsers.get(socket.id);
      if (!userId) return;

      const { consultationId } = data;
      const room = this.rooms.get(consultationId);

      if (!room || !room.participants.has(userId)) {
        return;
      }

      // Remove participant from room
      room.participants.delete(userId);
      room.lastActivity = new Date();

      // Leave socket room
      socket.leave(consultationId);

      // Notify other participants
      socket.to(consultationId).emit('participant-left', {
        userId,
        participantCount: room.participants.size
      });

      // Update consultation status if room is empty
      if (room.participants.size === 0) {
        await this.updateConsultationStatus(consultationId, 'ENDED');
        
        // Stop recording if active
        if (room.isRecording) {
          await recordingService.stopRecording(consultationId);
        }

        // Clean up room after delay
        setTimeout(() => {
          this.rooms.delete(consultationId);
        }, 30000); // 30 seconds cleanup delay
      }

      logger.info(`User ${userId} left consultation ${consultationId}`, {
        participantCount: room.participants.size
      });

    } catch (error) {
      logger.error('Error leaving consultation:', error);
    }
  }

  private handleOffer(socket: any, data: { targetUserId: string; offer: any; consultationId: string }) {
    const targetSocketId = this.userSockets.get(data.targetUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('offer', {
        fromUserId: this.socketUsers.get(socket.id),
        offer: data.offer,
        consultationId: data.consultationId
      });
    }
  }

  private handleAnswer(socket: any, data: { targetUserId: string; answer: any; consultationId: string }) {
    const targetSocketId = this.userSockets.get(data.targetUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('answer', {
        fromUserId: this.socketUsers.get(socket.id),
        answer: data.answer,
        consultationId: data.consultationId
      });
    }
  }

  private handleIceCandidate(socket: any, data: { targetUserId: string; candidate: any; consultationId: string }) {
    const targetSocketId = this.userSockets.get(data.targetUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('ice-candidate', {
        fromUserId: this.socketUsers.get(socket.id),
        candidate: data.candidate,
        consultationId: data.consultationId
      });
    }
  }

  private handleToggleAudio(socket: any, data: { consultationId: string; enabled: boolean }) {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    const room = this.rooms.get(data.consultationId);
    if (room && room.participants.has(userId)) {
      const participant = room.participants.get(userId)!;
      participant.audioEnabled = data.enabled;
      participant.lastSeen = new Date();

      socket.to(data.consultationId).emit('participant-audio-toggled', {
        userId,
        enabled: data.enabled
      });
    }
  }

  private handleToggleVideo(socket: any, data: { consultationId: string; enabled: boolean }) {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    const room = this.rooms.get(data.consultationId);
    if (room && room.participants.has(userId)) {
      const participant = room.participants.get(userId)!;
      participant.videoEnabled = data.enabled;
      participant.lastSeen = new Date();

      socket.to(data.consultationId).emit('participant-video-toggled', {
        userId,
        enabled: data.enabled
      });
    }
  }

  private handleToggleScreenShare(socket: any, data: { consultationId: string; enabled: boolean }) {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    const room = this.rooms.get(data.consultationId);
    if (room && room.participants.has(userId)) {
      const participant = room.participants.get(userId)!;
      participant.screenSharing = data.enabled;
      participant.lastSeen = new Date();

      socket.to(data.consultationId).emit('participant-screen-share-toggled', {
        userId,
        enabled: data.enabled
      });

      // Send screen share constraints if enabled
      if (data.enabled) {
        socket.emit('screen-share-config', {
          constraints: webrtcConfig.getDisplayMediaConstraints()
        });
      }
    }
  }

  private async handleStartRecording(socket: any, data: { consultationId: string }) {
    try {
      const userId = this.socketUsers.get(socket.id);
      if (!userId) return;

      const room = this.rooms.get(data.consultationId);
      if (!room) return;

      const participant = room.participants.get(userId);
      if (!participant || participant.role !== 'LAWYER') {
        socket.emit('error', { message: 'Only lawyers can start recording' });
        return;
      }

      if (room.isRecording) {
        socket.emit('error', { message: 'Recording is already in progress' });
        return;
      }

      await recordingService.startRecording(data.consultationId);
      
      room.isRecording = true;
      room.recordingStartedAt = new Date();

      this.io.to(data.consultationId).emit('recording-started', {
        startedBy: userId,
        startedAt: room.recordingStartedAt
      });

      logger.info(`Recording started for consultation ${data.consultationId} by user ${userId}`);

    } catch (error) {
      logger.error('Error starting recording:', error);
      socket.emit('error', { message: 'Failed to start recording' });
    }
  }

  private async handleStopRecording(socket: any, data: { consultationId: string }) {
    try {
      const userId = this.socketUsers.get(socket.id);
      if (!userId) return;

      const room = this.rooms.get(data.consultationId);
      if (!room) return;

      const participant = room.participants.get(userId);
      if (!participant || participant.role !== 'LAWYER') {
        socket.emit('error', { message: 'Only lawyers can stop recording' });
        return;
      }

      if (!room.isRecording) {
        socket.emit('error', { message: 'No recording in progress' });
        return;
      }

      await recordingService.stopRecording(data.consultationId);
      
      room.isRecording = false;
      const recordingDuration = room.recordingStartedAt ? 
        Date.now() - room.recordingStartedAt.getTime() : 0;

      this.io.to(data.consultationId).emit('recording-stopped', {
        stoppedBy: userId,
        duration: recordingDuration
      });

      logger.info(`Recording stopped for consultation ${data.consultationId} by user ${userId}`);

    } catch (error) {
      logger.error('Error stopping recording:', error);
      socket.emit('error', { message: 'Failed to stop recording' });
    }
  }

  private handleStatsReport(socket: any, data: { 
    consultationId: string; 
    stats: any;
    connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  }) {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    const room = this.rooms.get(data.consultationId);
    if (room && room.participants.has(userId)) {
      const participant = room.participants.get(userId)!;
      participant.mediaStats = data.stats;
      participant.connectionQuality = data.connectionQuality;
      participant.lastSeen = new Date();

      // Update room metrics
      this.updateRoomMetrics(room);

      // Report to performance testing service
      performanceTestingService.reportConnectionMetrics(userId, data.stats);
    }
  }

  private handleChangeQuality(socket: any, data: { 
    consultationId: string; 
    quality: 'low' | 'medium' | 'high' 
  }) {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    const room = this.rooms.get(data.consultationId);
    if (room && room.participants.has(userId)) {
      const constraints = webrtcConfig.getMediaConstraints(data.quality);
      const simulcastEncodings = webrtcConfig.getSimulcastEncodings();

      socket.emit('quality-changed', {
        quality: data.quality,
        constraints,
        simulcastEncodings
      });

      socket.to(data.consultationId).emit('participant-quality-changed', {
        userId,
        quality: data.quality
      });
    }
  }

  private handleChatMessage(socket: any, data: { 
    consultationId: string; 
    message: string;
    timestamp: string;
  }) {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    const room = this.rooms.get(data.consultationId);
    if (room && room.participants.has(userId)) {
      const participant = room.participants.get(userId)!;
      
      socket.to(data.consultationId).emit('chat-message', {
        fromUserId: userId,
        fromName: participant.displayName,
        message: data.message,
        timestamp: data.timestamp
      });
    }
  }

  private handleConnectionQualityUpdate(socket: any, data: { 
    consultationId: string; 
    quality: 'excellent' | 'good' | 'poor' | 'offline';
  }) {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    const room = this.rooms.get(data.consultationId);
    if (room && room.participants.has(userId)) {
      const participant = room.participants.get(userId)!;
      participant.connectionQuality = data.quality;
      participant.lastSeen = new Date();

      // Notify other participants of quality change
      socket.to(data.consultationId).emit('participant-quality-update', {
        userId,
        quality: data.quality
      });

      // Update room metrics
      this.updateRoomMetrics(room);
    }
  }

  private handleDeviceInfoReport(socket: any, data: { 
    consultationId: string; 
    deviceInfo: {
      platform: string;
      browser?: string;
      isMobile: boolean;
    }
  }) {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    const room = this.rooms.get(data.consultationId);
    if (room && room.participants.has(userId)) {
      const participant = room.participants.get(userId)!;
      participant.deviceInfo = data.deviceInfo;
      participant.lastSeen = new Date();
    }
  }

  private async handleDisconnect(socket: any, reason: string) {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    logger.info(`User ${userId} disconnected`, { reason, socketId: socket.id });

    // Clean up mappings
    this.userSockets.delete(userId);
    this.socketUsers.delete(socket.id);

    // Update participant status in all rooms
    for (const [consultationId, room] of this.rooms.entries()) {
      if (room.participants.has(userId)) {
        const participant = room.participants.get(userId)!;
        participant.connectionStatus = 'disconnected';
        participant.lastSeen = new Date();

        // Notify other participants
        socket.to(consultationId).emit('participant-disconnected', {
          userId,
          reason
        });

        // Remove participant after timeout (they might reconnect)
        setTimeout(() => {
          if (room.participants.has(userId)) {
            const p = room.participants.get(userId)!;
            if (p.connectionStatus === 'disconnected') {
              room.participants.delete(userId);
              this.io.to(consultationId).emit('participant-left', {
                userId,
                participantCount: room.participants.size
              });

              // End consultation if empty
              if (room.participants.size === 0) {
                this.updateConsultationStatus(consultationId, 'ENDED');
                if (room.isRecording) {
                  recordingService.stopRecording(consultationId);
                }
                setTimeout(() => this.rooms.delete(consultationId), 30000);
              }
            }
          }
        }, 30000); // 30 second grace period for reconnection
      }
    }
  }

  private sendInitialConfig(socket: any) {
    socket.emit('config', {
      webrtc: webrtcConfig.getWebRTCConfig(),
      qualityProfiles: webrtcConfig.getAllQualityProfiles(),
      simulcastSupport: true,
      maxParticipants: 2 // Current limit for video consultations
    });
  }

  private createRoom(consultationId: string): VideoSignalingRoom {
    const room: VideoSignalingRoom = {
      consultationId,
      participants: new Map(),
      isRecording: false,
      createdAt: new Date(),
      lastActivity: new Date(),
      settings: {
        maxParticipants: 2,
        recordingEnabled: true,
        autoRecording: false,
        qualityProfile: 'medium',
        simulcastEnabled: true,
        screenShareEnabled: true,
        chatEnabled: true,
        waitingRoomEnabled: false
      },
      metrics: {
        totalParticipants: 0,
        activeParticipants: 0,
        averageConnectionQuality: 'good',
        networkStability: 1.0,
        cpuUsage: 0,
        memoryUsage: 0,
        bandwidth: {
          total: 0,
          audio: 0,
          video: 0
        }
      }
    };

    this.rooms.set(consultationId, room);
    return room;
  }

  private updateRoomMetrics(room: VideoSignalingRoom) {
    const participants = Array.from(room.participants.values());
    
    room.metrics.totalParticipants = participants.length;
    room.metrics.activeParticipants = participants.filter(p => 
      p.connectionStatus === 'connected'
    ).length;

    // Calculate average connection quality
    const qualityScores = { excellent: 4, good: 3, poor: 2, offline: 1 };
    const avgScore = participants.reduce((sum, p) => 
      sum + qualityScores[p.connectionQuality], 0
    ) / participants.length;
    
    room.metrics.averageConnectionQuality = avgScore >= 3.5 ? 'excellent' :
      avgScore >= 2.5 ? 'good' : avgScore >= 1.5 ? 'poor' : 'offline';

    // Calculate network stability (based on connection quality consistency)
    const stableConnections = participants.filter(p => 
      ['excellent', 'good'].includes(p.connectionQuality)
    ).length;
    room.metrics.networkStability = participants.length > 0 ? 
      stableConnections / participants.length : 1.0;

    // Update bandwidth usage from media stats
    room.metrics.bandwidth = participants.reduce((total, p) => {
      if (p.mediaStats?.bandwidth) {
        total.total += p.mediaStats.bandwidth.incoming + p.mediaStats.bandwidth.outgoing;
      }
      return total;
    }, { total: 0, audio: 0, video: 0 });
  }

  private async updateConsultationStatus(consultationId: string, status: string) {
    try {
      await prisma.videoConsultation.update({
        where: { id: consultationId },
        data: { 
          status: status as any,
          endedAt: status === 'ENDED' ? new Date() : undefined
        }
      });
    } catch (error) {
      logger.error('Error updating consultation status:', error);
    }
  }

  private sanitizeParticipantInfo(participant: ParticipantInfo) {
    return {
      userId: participant.userId,
      role: participant.role,
      displayName: participant.displayName,
      audioEnabled: participant.audioEnabled,
      videoEnabled: participant.videoEnabled,
      screenSharing: participant.screenSharing,
      connectionStatus: participant.connectionStatus,
      connectionQuality: participant.connectionQuality,
      joinedAt: participant.joinedAt,
      deviceInfo: participant.deviceInfo
    };
  }

  private startBackgroundTasks() {
    // Metrics collection every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.collectAndReportMetrics();
    }, 30000);

    // Room cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveRooms();
    }, 300000);
  }

  private collectAndReportMetrics() {
    const currentMetrics = {
      activeRooms: this.rooms.size,
      totalParticipants: Array.from(this.rooms.values())
        .reduce((sum, room) => sum + room.participants.size, 0),
      averageRoomOccupancy: this.rooms.size > 0 ? 
        Array.from(this.rooms.values())
          .reduce((sum, room) => sum + room.participants.size, 0) / this.rooms.size : 0
    };

    performanceTestingService.reportServerMetrics(currentMetrics);
  }

  private cleanupInactiveRooms() {
    const now = new Date();
    const inactivityThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [consultationId, room] of this.rooms.entries()) {
      const timeSinceLastActivity = now.getTime() - room.lastActivity.getTime();
      
      if (room.participants.size === 0 && timeSinceLastActivity > inactivityThreshold) {
        logger.info(`Cleaning up inactive room: ${consultationId}`);
        this.rooms.delete(consultationId);
      }
    }
  }

  // Public methods for external access
  public getRoomInfo(consultationId: string): VideoSignalingRoom | undefined {
    return this.rooms.get(consultationId);
  }

  public getActiveRooms(): Map<string, VideoSignalingRoom> {
    return this.rooms;
  }

  public forceEndConsultation(consultationId: string): boolean {
    const room = this.rooms.get(consultationId);
    if (!room) return false;

    // Notify all participants
    this.io.to(consultationId).emit('consultation-force-ended', {
      reason: 'Ended by administrator'
    });

    // Stop recording if active
    if (room.isRecording) {
      recordingService.stopRecording(consultationId);
    }

    // Remove all participants and clean up
    for (const [userId] of room.participants) {
      const socketId = this.userSockets.get(userId);
      if (socketId) {
        this.io.sockets.sockets.get(socketId)?.leave(consultationId);
      }
    }

    this.rooms.delete(consultationId);
    this.updateConsultationStatus(consultationId, 'ENDED');

    return true;
  }

  public shutdown() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.io.close();
  }
}

export { VideoSignalingService };