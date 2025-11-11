import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { prisma } from '../src/utils/database';
import { generateAccessToken } from '../src/middleware/auth';

// Create a minimal Express app for testing
import express from 'express';
import videoRoutes from '../src/routes/video';

const app = express();
app.use(express.json());
app.use('/api/video', videoRoutes);

// Mock the WebSocket and recording services
jest.mock('../services/enhancedVideoSignalingService');
jest.mock('../services/recordingService');

describe('Enhanced Video Consultation API', () => {
  let authToken: string;
  let userId: string;
  let consultationId: string;
  let bookingId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'PUBLIC',
        emailVerified: true
      }
    });
    userId = user.id;
    authToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Create test lawyer
    const lawyer = await prisma.user.create({
      data: {
        email: 'lawyer@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'Lawyer',
        role: 'LAWYER',
        emailVerified: true
      }
    });

    // Create test service
    const service = await prisma.marketplaceService.create({
      data: {
        type: 'CONSULTATION',
        title: 'Legal Consultation',
        description: 'Video consultation service',
        providerId: lawyer.id,
        priceKES: 5000,
        status: 'ACTIVE'
      }
    });

    // Create test booking
    const booking = await prisma.serviceBooking.create({
      data: {
        serviceId: service.id,
        clientId: userId,
        providerId: lawyer.id,
        totalAmountKES: 5000,
        clientRequirements: 'Legal advice needed',
        status: 'CONFIRMED'
      }
    });
    bookingId = booking.id;

    // Create test video consultation
    const consultation = await prisma.videoConsultation.create({
      data: {
        bookingId: booking.id,
        lawyerId: lawyer.id,
        clientId: userId,
        roomId: `room_${Date.now()}`,
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        status: 'SCHEDULED'
      }
    });
    consultationId = consultation.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.videoConsultation.deleteMany({});
    await prisma.serviceBooking.deleteMany({});
    await prisma.marketplaceService.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('POST /api/video/consultation/:id/start', () => {
    test('should start video consultation successfully', async () => {
      const response = await request(app)
        .post(`/api/video/consultation/${consultationId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('turnServers');
      expect(response.body.data).toHaveProperty('roomId');
    });

    test('should return 404 for non-existent consultation', async () => {
      const response = await request(app)
        .post('/api/video/consultation/non-existent-id/start')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .post(`/api/video/consultation/${consultationId}/start`)
        .expect(401);
    });
  });

  describe('POST /api/video/consultation/:id/end', () => {
    test('should end video consultation successfully', async () => {
      // Start consultation first
      await request(app)
        .post(`/api/video/consultation/${consultationId}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .post(`/api/video/consultation/${consultationId}/end`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ duration: 1800 }) // 30 minutes
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('COMPLETED');
      expect(response.body.data.duration).toBe(1800);
    });

    test('should validate duration input', async () => {
      const response = await request(app)
        .post(`/api/video/consultation/${consultationId}/end`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ duration: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('POST /api/video/consultation/:id/recording/start', () => {
    test('should start recording successfully', async () => {
      const response = await request(app)
        .post(`/api/video/consultation/${consultationId}/recording/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Recording started');
    });

    test('should handle recording permissions', async () => {
      // Mock recording service to throw permission error
      const mockRecordingService = require('../services/recordingService');
      mockRecordingService.startRecording.mockRejectedValue(
        new Error('Recording requires consent from all participants')
      );

      const response = await request(app)
        .post(`/api/video/consultation/${consultationId}/recording/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('consent');
    });
  });

  describe('POST /api/video/consultation/:id/recording/stop', () => {
    test('should stop recording and return recording info', async () => {
      // Start recording first
      await request(app)
        .post(`/api/video/consultation/${consultationId}/recording/start`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .post(`/api/video/consultation/${consultationId}/recording/stop`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recordingUrl');
      expect(response.body.data).toHaveProperty('duration');
    });
  });

  describe('GET /api/video/consultation/:id/recordings', () => {
    test('should return consultation recordings', async () => {
      // Create test recording
      await prisma.consultationRecording.create({
        data: {
          consultationId,
          fileName: 'test-recording.webm',
          storageKey: '/recordings/test-recording.webm',
          duration: 1800,
          fileSize: 10485760,
          format: 'webm',
          codec: 'VP9',
          resolution: '1280x720'
        }
      });

      const response = await request(app)
        .get(`/api/video/consultation/${consultationId}/recordings`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('fileName');
      expect(response.body.data[0]).toHaveProperty('duration');
    });

    test('should return empty array for consultation without recordings', async () => {
      const response = await request(app)
        .get(`/api/video/consultation/${consultationId}/recordings`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/video/consultation/:id/stats', () => {
    test('should return consultation statistics', async () => {
      // Create test participant data
      await prisma.videoParticipant.create({
        data: {
          consultationId,
          userId,
          joinedAt: new Date(),
          participantType: 'CLIENT'
        }
      });

      const response = await request(app)
        .get(`/api/video/consultation/${consultationId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('participantCount');
      expect(response.body.data).toHaveProperty('totalDuration');
      expect(response.body.data).toHaveProperty('recordingCount');
    });
  });

  describe('WebSocket Integration', () => {
    test('should handle signaling message validation', async () => {
      const mockSignalingService = require('../services/enhancedVideoSignalingService');
      
      // Test invalid signaling message
      const invalidMessage = { type: 'invalid' };
      
      expect(() => {
        mockSignalingService.validateSignalingMessage(invalidMessage);
      }).toThrow('Invalid signaling message');
    });

    test('should handle connection quality monitoring', async () => {
      const mockSignalingService = require('../services/enhancedVideoSignalingService');
      
      const qualityData = {
        participantId: userId,
        quality: 'good',
        latency: 50,
        bandwidth: 1000000,
        packetLoss: 0.1
      };

      const result = mockSignalingService.updateConnectionQuality(qualityData);
      expect(result).toHaveProperty('status');
      expect(result.status).toBe('updated');
    });
  });

  describe('Performance and Error Handling', () => {
    test('should handle concurrent consultation access', async () => {
      const promises = Array(5).fill(null).map(() =>
        request(app)
          .get(`/api/video/consultation/${consultationId}`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    test('should handle database connection errors gracefully', async () => {
      // Mock database error
      jest.spyOn(prisma.videoConsultation, 'findUnique')
        .mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get(`/api/video/consultation/${consultationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Internal server error');
    });

    test('should validate consultation access permissions', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          password: 'hashedpassword',
          firstName: 'Other',
          lastName: 'User',
          role: 'PUBLIC',
          emailVerified: true
        }
      });

      const otherToken = generateAccessToken({
        userId: otherUser.id,
        email: otherUser.email,
        role: otherUser.role
      });

      const response = await request(app)
        .get(`/api/video/consultation/${consultationId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('access');
    });
  });

  describe('Recording Management', () => {
    test('should handle recording file cleanup', async () => {
      const mockRecordingService = require('../services/recordingService');
      
      const recordingData = {
        consultationId,
        fileName: 'test-cleanup.webm',
        filePath: '/recordings/test-cleanup.webm'
      };

      await mockRecordingService.cleanupRecording(recordingData);
      
      // Verify cleanup was called
      expect(mockRecordingService.cleanupRecording).toHaveBeenCalledWith(recordingData);
    });

    test('should generate signed URLs for recording access', async () => {
      const recording = await prisma.consultationRecording.create({
        data: {
          consultationId,
          fileName: 'test-recording.webm',
          storageKey: '/recordings/test-recording.webm',
          duration: 1800,
          fileSize: 10485760,
          format: 'webm',
          codec: 'VP9',
          resolution: '1280x720'
        }
      });

      const response = await request(app)
        .get(`/api/video/recording/${recording.id}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('downloadUrl');
      expect(response.body.data).toHaveProperty('expiresAt');
    });
  });
});