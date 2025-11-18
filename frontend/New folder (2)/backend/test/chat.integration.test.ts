import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE_URL = 'http://localhost:5000';

describe('Chat API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let lawyerId: string;
  let bookingId: string;
  let chatRoomId: string;

  beforeAll(async () => {
    // Create test users
<<<<<<< HEAD
=======

>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
    const client = await prisma.user.create({
      data: {
        email: 'testclient@chat.com',
        firstName: 'Test',
        lastName: 'Client',
        password: 'hashedpassword',
<<<<<<< HEAD
  role: 'PUBLIC' as any,
=======
        role: 'PUBLIC',
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
        emailVerified: true
      }
    });
    userId = client.id;
<<<<<<< HEAD

=======
              role: 'PUBLIC',
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
    const lawyer = await prisma.user.create({
      data: {
        email: 'testlawyer@chat.com',
        firstName: 'Test',
        lastName: 'Lawyer',
        password: 'hashedpassword',
<<<<<<< HEAD
  role: 'LAWYER' as any,
=======
        role: 'LAWYER',
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
        emailVerified: true
      }
    });
    lawyerId = lawyer.id;
<<<<<<< HEAD

=======
              role: 'LAWYER',
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
    // Create lawyer profile
    await prisma.lawyerProfile.create({
      data: {
        userId: lawyer.id,
        licenseNumber: 'TEST123',
        yearOfAdmission: 2018,
<<<<<<< HEAD
        specializations: ['CORPORATE_LAW'] as any,
        location: {} as any,
        yearsOfExperience: 5,
        bio: 'Test lawyer for chat system',
        isVerified: true,
        availability: {} as any
=======
        specializations: ['CORPORATE'],
        location: { county: 'Nairobi', city: 'Nairobi' },
        yearsOfExperience: 5,
        bio: 'Test lawyer for chat system',
        isVerified: true,
        availability: [
          {
            day: 'MONDAY',
            startTime: '09:00',
            endTime: '17:00',
            isAvailable: true
          }
        ]
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
      }
    });

    // Create test service
    const service = await prisma.marketplaceService.create({
      data: {
        providerId: lawyer.id,
        title: 'Chat Test Service',
        description: 'Service for testing chat functionality',
<<<<<<< HEAD
        type: 'CONSULTATION' as any,
        priceKES: 150,
        duration: 60,
        tags: ['test']
=======
        type: 'CONSULTATION',
        priceKES: 150,
        duration: 60,
        tags: ['test'],
        status: 'ACTIVE'
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
      }
    });

    // Create test booking
    const booking = await prisma.serviceBooking.create({
      data: {
        serviceId: service.id,
        clientId: client.id,
        providerId: lawyer.id,
<<<<<<< HEAD
        status: 'CONFIRMED' as any,
        paymentStatus: 'PAID' as any,
=======
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
        totalAmountKES: 150,
        clientRequirements: 'Test requirements',
        scheduledAt: new Date(Date.now() + 86400000) // Tomorrow
      }
    });
    bookingId = booking.id;

    // Get auth token (simulate login)
    authToken = 'mock_jwt_token'; // In real test, would get from login endpoint
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.serviceBooking.deleteMany({
      where: { id: bookingId }
    });
    await prisma.marketplaceService.deleteMany({
      where: { providerId: lawyerId }
    });
    await prisma.lawyerProfile.deleteMany({
      where: { userId: lawyerId }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userId, lawyerId] } }
    });
    await prisma.$disconnect();
  });

  describe('Chat Room Management', () => {
    it('should create a chat room for a booking', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId: bookingId
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.bookingId).toBe(bookingId);
      
      chatRoomId = response.body.data.id;
    });

    it('should get user chat rooms', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const chatRoom = response.body.data.find((room: any) => room.id === chatRoomId);
      expect(chatRoom).toBeDefined();
      expect(chatRoom.bookingId).toBe(bookingId);
    });

    it('should not create duplicate chat room for same booking', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId: bookingId
        });

      // Should return existing room or handle gracefully
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Message Management', () => {
    it('should get messages for a chat room', async () => {
      const response = await request(API_BASE_URL)
        .get(`/api/chat/rooms/${chatRoomId}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('messages');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.messages)).toBe(true);
    });

    it('should send a message', async () => {
      const messageData = {
        roomId: chatRoomId,
        content: 'Hello, this is a test message!',
        messageType: 'TEXT'
      };

      const response = await request(API_BASE_URL)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.content).toBe(messageData.content);
      expect(response.body.data.roomId).toBe(chatRoomId);
    });

    it('should validate message content', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roomId: chatRoomId,
          content: '', // Empty content should fail
          messageType: 'TEXT'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });

    it('should mark message as read', async () => {
      const messageId = 'test_message_123';
      
      const response = await request(API_BASE_URL)
        .patch(`/api/chat/messages/${messageId}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('messageId', messageId);
      expect(response.body.data).toHaveProperty('readAt');
    });
  });

  describe('Notifications', () => {
    it('should get user notifications', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/chat/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notifications');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.notifications)).toBe(true);
    });

    it('should filter unread notifications', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/chat/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // All returned notifications should be unread
      response.body.data.notifications.forEach((notification: any) => {
        expect(notification.isRead).toBe(false);
      });
    });

    it('should support pagination', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/chat/notifications?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 5);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/chat/rooms' },
        { method: 'post', path: '/api/chat/rooms' },
        { method: 'get', path: '/api/chat/notifications' },
        { method: 'post', path: '/api/chat/messages' }
      ];

      for (const endpoint of endpoints) {
        const response = await (request(API_BASE_URL) as any)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
      }
    });

    it('should prevent access to other users\' chat rooms', async () => {
      // This would require creating another user and testing cross-user access
      // For now, we verify the endpoint exists and returns proper format
      const response = await request(API_BASE_URL)
        .get(`/api/chat/rooms/invalid_room_id/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid room ID', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/chat/rooms/invalid_room_id/messages')
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should handle invalid booking ID for room creation', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId: 'invalid_booking_id'
        });

      expect([400, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should validate message size limits', async () => {
      const longMessage = 'a'.repeat(3000); // Exceed 2000 character limit
      
      const response = await request(API_BASE_URL)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roomId: chatRoomId,
          content: longMessage,
          messageType: 'TEXT'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });
});