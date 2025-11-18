import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import { Server as SocketServer } from 'socket.io';

const prisma = new PrismaClient();

export interface LoadTestConfig {
  maxParticipantsPerRoom: number;
  maxConcurrentRooms: number;
  testDurationMinutes: number;
  participantJoinIntervalMs: number;
  messageFrequencyMs: number;
}

export interface PerformanceMetrics {
  timestamp: Date;
  activeConnections: number;
  activeRooms: number;
  totalParticipants: number;
  averageLatency: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: number;
  messagesSentPerSecond: number;
  bandwidthUsageMbps: number;
  errorRate: number;
}

export interface RoomMetrics {
  roomId: string;
  participantCount: number;
  connectionTime: Date;
  lastActivity: Date;
  averageLatency: number;
  totalMessages: number;
  dataTransferred: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

class PerformanceTestingService {
  private io: SocketServer | null = null;
  private testConfig: LoadTestConfig;
  private activeTests: Map<string, Record<string, unknown>> = new Map();
  private metricsHistory: PerformanceMetrics[] = [];
  private roomMetrics: Map<string, RoomMetrics> = new Map();
  private messageCounter = 0;
  private errorCounter = 0;
  private startTime: Date | null = null;

  constructor(defaultConfig?: Partial<LoadTestConfig>) {
    this.testConfig = {
      maxParticipantsPerRoom: parseInt(process.env.MAX_PARTICIPANTS_PER_ROOM || '6'),
      maxConcurrentRooms: parseInt(process.env.MAX_CONCURRENT_ROOMS || '100'),
      testDurationMinutes: 30,
      participantJoinIntervalMs: 1000,
      messageFrequencyMs: 5000,
      ...defaultConfig
    };
    
    logger.info('Performance Testing Service initialized', this.testConfig);
  }

  /**
   * Initialize with Socket.IO server for monitoring
   */
  initialize(io: SocketServer): void {
    this.io = io;
    this.startMetricsCollection();
    logger.info('Performance monitoring started');
  }

  /**
   * Start comprehensive load test
   */
  async startLoadTest(config?: Partial<LoadTestConfig>): Promise<string> {
    const testId = `test_${Date.now()}`;
    const testConfig = { ...this.testConfig, ...config };
    
    logger.info(`Starting load test: ${testId}`, testConfig);
    
    this.startTime = new Date();
    this.messageCounter = 0;
    this.errorCounter = 0;
    
    const testInstance = {
      id: testId,
      config: testConfig,
      startTime: this.startTime,
      status: 'running',
      simulatedParticipants: [],
      createdRooms: []
    };

    this.activeTests.set(testId, testInstance);

    try {
      // Create multiple consultation rooms
      const rooms = await this.createTestRooms(testConfig.maxConcurrentRooms);
      (testInstance as Record<string, unknown>).createdRooms = rooms;

      // Simulate participants joining
      await this.simulateParticipantLoad(testId, testConfig);

      // Start message flooding
      this.startMessageFlood(testId, testConfig);

      logger.info(`Load test ${testId} started successfully`);
      return testId;

    } catch (error) {
      logger.error(`Failed to start load test ${testId}:`, error);
      this.activeTests.delete(testId);
      throw error;
    }
  }

  /**
   * Create test video consultation rooms
   */
  private async createTestRooms(roomCount: number): Promise<string[]> {
    const rooms: string[] = [];
    
    for (let i = 0; i < roomCount; i++) {
      try {
        // Create a test booking first
        const booking = await prisma.serviceBooking.create({
          data: {
            clientId: 'test-client-id',
            serviceId: 'test-service-id',
            providerId: 'test-lawyer-id',
            status: 'CONFIRMED',
            scheduledAt: new Date()
          }
        });

        // Create video consultation
        const consultation = await prisma.videoConsultation.create({
          data: {
            bookingId: booking.id,
            lawyerId: 'test-lawyer-id',
            clientId: 'test-client-id',
            roomId: `test-room-${i}-${Date.now()}`,
            scheduledAt: new Date(),
            status: 'SCHEDULED'
          }
        });

        rooms.push(consultation.roomId);
        
        // Initialize room metrics
        this.roomMetrics.set(consultation.roomId, {
          roomId: consultation.roomId,
          participantCount: 0,
          connectionTime: new Date(),
          lastActivity: new Date(),
          averageLatency: 0,
          totalMessages: 0,
          dataTransferred: 0,
          quality: 'excellent'
        });

      } catch (error) {
        logger.error(`Failed to create test room ${i}:`, error);
      }
    }

    logger.info(`Created ${rooms.length} test rooms`);
    return rooms;
  }

  /**
   * Simulate participants joining rooms
   */
  private async simulateParticipantLoad(testId: string, config: LoadTestConfig): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) return;

    const totalParticipants = test.createdRooms.length * config.maxParticipantsPerRoom;
    
    if (Array.isArray(test.createdRooms)) {
      for (let i = 0; i < totalParticipants; i++) {
        setTimeout(() => {
          this.simulateParticipantJoin(testId, i);
        }, i * config.participantJoinIntervalMs);
      }
    }

    logger.info(`Scheduled ${totalParticipants} simulated participants`);
  }

  /**
   * Simulate a single participant joining
   */
  private simulateParticipantJoin(testId: string, participantIndex: number): void {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== 'running') return;

    if (!Array.isArray(test.createdRooms)) return;
    const roomIndex = participantIndex % test.createdRooms.length;
    const roomId = test.createdRooms[roomIndex];
    
    const participant = {
      id: `test-participant-${participantIndex}`,
      roomId,
      joinTime: new Date(),
      messagesSent: 0,
      lastMessage: new Date()
    };

    if (Array.isArray(test.simulatedParticipants)) {
      test.simulatedParticipants.push(participant);
    }

    // Update room metrics
    const roomMetrics = this.roomMetrics.get(roomId);
    if (roomMetrics) {
      roomMetrics.participantCount++;
      roomMetrics.lastActivity = new Date();
    }

    // Simulate WebSocket connection
    this.simulateWebSocketActivity(participant);
  }

  /**
   * Simulate WebSocket activity for a participant
   */
  private simulateWebSocketActivity(participant: any): void {
    // Simulate joining room
    this.messageCounter++;
    
    // Simulate periodic messages
    const messageInterval = setInterval(() => {
      if (!this.activeTests.has(participant.testId)) {
        clearInterval(messageInterval);
        return;
      }

      // Simulate video signaling
      this.messageCounter += Math.random() > 0.7 ? 1 : 0;
      
      // Simulate chat messages
      if (Math.random() > 0.9) {
        this.messageCounter++;
        participant.messagesSent++;
        participant.lastMessage = new Date();
      }

      // Update room metrics
      const roomMetrics = this.roomMetrics.get(participant.roomId);
      if (roomMetrics) {
        roomMetrics.totalMessages++;
        roomMetrics.dataTransferred += Math.random() * 1000; // Simulate data transfer
        roomMetrics.lastActivity = new Date();
      }

    }, this.testConfig.messageFrequencyMs + (Math.random() * 2000));
  }

  /**
   * Start message flood simulation
   */
  private startMessageFlood(testId: string, _config: LoadTestConfig): void {
    const floodInterval = setInterval(() => {
      const test = this.activeTests.get(testId);
      if (!test || test.status !== 'running') {
        clearInterval(floodInterval);
        return;
      }

      // Simulate high-frequency signaling messages
      const messagesThisSecond = Math.floor(Math.random() * 50) + 10;
      this.messageCounter += messagesThisSecond;

      // Simulate some errors
      if (Math.random() > 0.95) {
        this.errorCounter++;
      }

    }, 1000);
  }

  /**
   * Start collecting performance metrics
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectCurrentMetrics();
    }, 5000); // Collect every 5 seconds
  }

  /**
   * Collect current performance metrics
   */
  private collectCurrentMetrics(): void {
    if (!this.io) return;

    const memoryUsage = process.memoryUsage();
    const activeConnections = this.io.sockets.sockets.size;
    const activeRooms = this.roomMetrics.size;
    
    let totalParticipants = 0;
    let totalMessages = 0;
    let totalDataTransferred = 0;

    this.roomMetrics.forEach(room => {
      totalParticipants += room.participantCount;
      totalMessages += room.totalMessages;
      totalDataTransferred += room.dataTransferred;
    });

    const elapsedMinutes = this.startTime 
      ? (Date.now() - this.startTime.getTime()) / (1000 * 60) 
      : 1;
    
    const messagesSentPerSecond = this.messageCounter / (elapsedMinutes * 60);
    const errorRate = this.errorCounter / Math.max(this.messageCounter, 1);
    const bandwidthUsageMbps = (totalDataTransferred * 8) / (1024 * 1024 * elapsedMinutes * 60);

    const metrics: PerformanceMetrics = {
      timestamp: new Date(),
      activeConnections,
      activeRooms,
      totalParticipants,
      averageLatency: this.calculateAverageLatency(),
      memoryUsage,
      messagesSentPerSecond,
      bandwidthUsageMbps,
      errorRate: errorRate * 100
    };

    this.metricsHistory.push(metrics);
    
    // Keep only last 1000 metrics entries
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory.shift();
    }

    // Log critical metrics
    if (activeConnections > 0) {
      logger.info('Performance Metrics', {
        activeConnections,
        activeRooms,
        totalParticipants,
        memoryMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        messagesSentPerSecond: Math.round(messagesSentPerSecond),
        errorRate: Math.round(errorRate * 100 * 100) / 100
      });
    }
  }

  /**
   * Calculate average latency across all rooms
   */
  private calculateAverageLatency(): number {
    let totalLatency = 0;
    let roomCount = 0;

    this.roomMetrics.forEach(room => {
      totalLatency += room.averageLatency;
      roomCount++;
    });

    return roomCount > 0 ? totalLatency / roomCount : 0;
  }

  /**
   * Stop a load test
   */
  async stopLoadTest(testId: string): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    test.status = 'stopped';
    test.endTime = new Date();

    // Cleanup test data
    try {
      // Delete test consultations and bookings
      for (const roomId of test.createdRooms) {
        const consultation = await prisma.videoConsultation.findFirst({
          where: { roomId }
        });

        if (consultation) {
          await prisma.videoConsultation.delete({
            where: { id: consultation.id }
          });

          await prisma.serviceBooking.delete({
            where: { id: consultation.bookingId }
          });
        }

        this.roomMetrics.delete(roomId);
      }

      logger.info(`Load test ${testId} stopped and cleaned up`);
    } catch (error) {
      logger.error(`Error cleaning up test ${testId}:`, error);
    }

    this.activeTests.delete(testId);
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metricsHistory.length > 0 
      ? this.metricsHistory[this.metricsHistory.length - 1] 
      : null;
  }

  /**
   * Get performance history
   */
  getMetricsHistory(lastMinutes?: number): PerformanceMetrics[] {
    if (!lastMinutes) return this.metricsHistory;

    const cutoffTime = new Date(Date.now() - lastMinutes * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp >= cutoffTime);
  }

  /**
   * Get room metrics
   */
  getRoomMetrics(): RoomMetrics[] {
    return Array.from(this.roomMetrics.values());
  }

  /**
   * Get active test status
   */
  getActiveTests(): Record<string, unknown>[] {
    return Array.from(this.activeTests.values());
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(testId?: string): Record<string, unknown> {
    const metrics = testId && this.activeTests.has(testId) 
      ? this.getMetricsHistory(30) // Last 30 minutes for specific test
      : this.getMetricsHistory();

    if (metrics.length === 0) {
      return { message: 'No metrics available' };
    }

    const latest = metrics[metrics.length - 1];
    const earliest = metrics[0];
    
    const avgConnections = metrics.reduce((sum, m) => sum + m.activeConnections, 0) / metrics.length;
    const maxConnections = Math.max(...metrics.map(m => m.activeConnections));
    const avgLatency = metrics.reduce((sum, m) => sum + m.averageLatency, 0) / metrics.length;
    const maxMemory = Math.max(...metrics.map(m => m.memoryUsage.heapUsed));
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;

    return {
      testPeriod: {
        start: earliest.timestamp,
        end: latest.timestamp,
        durationMinutes: (latest.timestamp.getTime() - earliest.timestamp.getTime()) / (1000 * 60)
      },
      performance: {
        currentConnections: latest.activeConnections,
        averageConnections: Math.round(avgConnections),
        maxConnections,
        currentLatencyMs: Math.round(latest.averageLatency),
        averageLatencyMs: Math.round(avgLatency),
        currentMemoryMB: Math.round(latest.memoryUsage.heapUsed / 1024 / 1024),
        maxMemoryMB: Math.round(maxMemory / 1024 / 1024),
        averageErrorRate: Math.round(avgErrorRate * 100) / 100,
        bandwidthUsageMbps: Math.round(latest.bandwidthUsageMbps * 100) / 100,
        messagesThroughput: Math.round(latest.messagesSentPerSecond)
      },
      rooms: this.getRoomMetrics(),
      activeTests: this.getActiveTests()
    };
  }

  /**
   * Report connection metrics from video signaling
   */
  reportConnectionMetrics(userId: string, stats: { roundTripTime: number; audioPacketsLost: number; videoPacketsLost: number; bandwidth: number }): void {
    logger.info(`Connection metrics reported for user ${userId}`, {
      roundTripTime: stats.roundTripTime,
      audioPacketsLost: stats.audioPacketsLost,
      videoPacketsLost: stats.videoPacketsLost,
      bandwidth: stats.bandwidth
    });
  }

  /**
   * Report server metrics
   */
  reportServerMetrics(metrics: {
    activeRooms: number;
    totalParticipants: number;
    averageRoomOccupancy: number;
  }): void {
    logger.info('Server metrics reported', {
      activeRooms: metrics.activeRooms,
      totalParticipants: metrics.totalParticipants,
      averageRoomOccupancy: metrics.averageRoomOccupancy,
      timestamp: new Date()
    });
  }
}

export const performanceTestingService = new PerformanceTestingService();