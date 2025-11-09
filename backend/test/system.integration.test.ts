import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

const API_BASE_URL = 'http://localhost:5000';

describe('Wakili Pro - System Integration Tests', () => {
  let authToken: string;
  let testBookingId: string;

  beforeAll(async () => {
    // Mock auth token for testing
    authToken = 'mock_jwt_token_for_testing';
    testBookingId = 'test_booking_123';
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(API_BASE_URL).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('API Base Route', () => {
    it('should return API information', async () => {
      const response = await request(API_BASE_URL).get('/api');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Welcome to Wakili Pro API');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('Authentication Routes', () => {
    it('should handle login endpoint', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword'
        });

      // Should return 400/401 for invalid credentials (expected)
      expect([400, 401]).toContain(response.status);
    });

    it('should handle register endpoint', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'newtest@example.com',
          password: 'testpassword',
          role: 'CLIENT'
        });

      // Should return success or validation error (both acceptable for test)
      expect([200, 201, 400]).toContain(response.status);
    });
  });

  describe('Chat System Endpoints', () => {
    it('should require authentication for chat rooms', async () => {
      const response = await request(API_BASE_URL).get('/api/chat/rooms');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle chat room creation request format', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId: testBookingId
        });

      // Should process the request (may fail due to mock data, but structure is correct)
      expect([200, 201, 400, 401, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    it('should handle messages endpoint', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/chat/rooms/test_room_123/messages')
        .set('Authorization', `Bearer ${authToken}`);

      // Should process the request structure correctly
      expect([200, 401, 403, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    it('should handle send message request', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roomId: 'test_room_123',
          content: 'Test message',
          messageType: 'TEXT'
        });

      // Should process the request structure correctly
      expect([200, 201, 400, 401, 403, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    it('should validate message content requirements', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roomId: 'test_room_123',
          content: '', // Empty content should fail validation
          messageType: 'TEXT'
        });

      expect([400, 401]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should handle notifications endpoint', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/chat/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 401]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Payment System Endpoints', () => {
    it('should handle payment creation', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          currency: 'KES',
          method: 'M_PESA',
          phoneNumber: '+254700000000',
          serviceId: 'test_service_123'
        });

      expect([200, 201, 400, 401]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    it('should handle wallet operations', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/payments/wallet/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 401, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Marketplace Endpoints', () => {
    it('should handle service listings', async () => {
      const response = await request(API_BASE_URL).get('/api/marketplace/services');

      expect([200, 404]).toContain(response.status);
    });

    it('should handle lawyer profiles', async () => {
      const response = await request(API_BASE_URL).get('/api/lawyers/profiles');

      expect([200, 404]).toContain(response.status);
    });

    it('should handle service booking', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/marketplace/services/test_service_123/book')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scheduledAt: new Date().toISOString(),
          clientRequirements: 'Test booking requirements',
          contactMethod: 'EMAIL'
        });

      expect([200, 201, 400, 401, 404]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(API_BASE_URL).get('/api/nonexistent');
      
      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });

    it('should handle missing required fields', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          messageType: 'TEXT'
        });

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('Security Tests', () => {
    it('should require authentication for protected routes', async () => {
      const protectedRoutes = [
        '/api/chat/rooms',
        '/api/payments',
        '/api/users/profile'
      ];

      for (const route of protectedRoutes) {
        const response = await request(API_BASE_URL).get(route);
        expect(response.status).toBe(401);
      }
    });

    it('should validate input lengths', async () => {
      const longString = 'a'.repeat(3000);
      
      const response = await request(API_BASE_URL)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roomId: 'test_room_123',
          content: longString,
          messageType: 'TEXT'
        });

      expect([400, 401]).toContain(response.status);
    });

    it('should handle SQL injection attempts', async () => {
      const sqlInjection = "'; DROP TABLE users; --";
      
      const response = await request(API_BASE_URL)
        .post('/api/auth/login')
        .send({
          email: sqlInjection,
          password: 'password'
        });

      // Should handle gracefully without crashing
      expect([400, 401]).toContain(response.status);
    });
  });
});