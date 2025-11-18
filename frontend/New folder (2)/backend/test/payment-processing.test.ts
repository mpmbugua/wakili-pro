import { describe, expect, test, beforeEach, afterEach, jest, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { prisma } from '../src/utils/database';
import { generateAccessToken } from '../src/middleware/auth';

// Create a minimal Express app for testing
import express from 'express';
import paymentRoutes from '../src/routes/payments';

const app = express();
app.use(express.json());
app.use('/api/payments', paymentRoutes);

// Mock external payment services
jest.mock('stripe');
jest.mock('../src/services/mpesaService');

describe('Enhanced Payment Processing', () => {
  let authToken: string;
  let userId: string;
  let bookingId: string;
  let serviceId: string;
  let providerId: string;

  beforeAll(async () => {
    // Connect to test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Disconnect from test database
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create test users
    const client = await prisma.user.create({
      data: {
        email: 'client@test.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'Client',
        role: 'PUBLIC',
        emailVerified: true
      }
    });
    userId = client.id;

    const provider = await prisma.user.create({
      data: {
        email: 'lawyer@test.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'Lawyer',
        role: 'LAWYER',
        emailVerified: true
      }
    });
    providerId = provider.id;

    authToken = generateAccessToken({
      userId: client.id,
      email: client.email,
      role: client.role
    });

    // Create test service
    const service = await prisma.marketplaceService.create({
      data: {
        type: 'CONSULTATION',
        title: 'Legal Consultation',
        description: 'Test service',
        providerId: provider.id,
        priceKES: 5000,
        status: 'ACTIVE'
      }
    });
    serviceId = service.id;

    // Create test booking
    const booking = await prisma.serviceBooking.create({
      data: {
        serviceId: service.id,
        clientId: client.id,
        providerId: provider.id,
        totalAmountKES: 5000,
        clientRequirements: 'Test booking',
        status: 'CONFIRMED'
      }
    });
    bookingId = booking.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.payment.deleteMany({});
    await prisma.serviceBooking.deleteMany({});
    await prisma.marketplaceService.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('POST /api/payments/intent', () => {
    test('should create M-Pesa payment intent successfully', async () => {
      const response = await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId,
          provider: 'MPESA',
          mpesaDetails: {
            phoneNumber: '254700000000'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('paymentId');
      expect(response.body.data).toHaveProperty('redirectUrl');
    });

    test('should create Stripe payment intent successfully', async () => {
      const mockStripe = require('stripe') as any;
      mockStripe.paymentIntents = {
        create: (jest.fn() as any).mockResolvedValue({
          id: 'pi_test123',
          client_secret: 'pi_test123_secret',
          status: 'requires_payment_method'
        })
      };

      const response = await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId,
          provider: 'STRIPE',
          stripeDetails: {
            customerEmail: 'client@test.com'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('clientSecret');
      expect(response.body.data).toHaveProperty('paymentId');
    });

    test('should validate booking ownership', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@test.com',
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
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          bookingId,
          provider: 'MPESA',
          mpesaDetails: {
            phoneNumber: '254700000000'
          }
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('authorized');
    });

    test('should validate payment amount matches booking', async () => {
      const response = await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId,
          provider: 'MPESA',
          amount: 10000, // Different from booking amount
          mpesaDetails: {
            phoneNumber: '254700000000'
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('amount');
    });
  });

  describe('POST /api/payments/verify', () => {
    let paymentId: string;

    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          bookingId,
          userId,
          amount: 5000,
          method: 'MPESA',
          status: 'PENDING',
          externalTransactionId: 'MPG12345'
        }
      });
      paymentId = payment.id;
    });

    test('should verify M-Pesa payment successfully', async () => {
      const mockMpesaService = require('../src/services/mpesaService') as any;
      mockMpesaService.verifyPayment = (jest.fn() as any).mockResolvedValue({
        success: true,
        status: 'PAID',
<<<<<<< HEAD
=======
          status: 'COMPLETED',
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
        transactionId: 'MPG12345',
        amount: 5000
      });

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentId,
          provider: 'MPESA',
          transactionId: 'MPG12345'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PAID');
<<<<<<< HEAD
=======
        expect(response.body.data.status).toBe('COMPLETED');
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
    });

    test('should handle payment verification failure', async () => {
      const mockMpesaService = require('../src/services/mpesaService') as any;
      mockMpesaService.verifyPayment = (jest.fn() as any).mockResolvedValue({
        success: false,
        status: 'FAILED',
        message: 'Transaction not found'
      });

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentId,
          provider: 'MPESA',
          transactionId: 'INVALID123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('verification failed');
    });
  });

  describe('POST /api/payments/:id/refund', () => {
    let paymentId: string;

    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          bookingId,
          userId,
          amount: 5000,
          method: 'STRIPE_CARD',
          status: 'PAID',
<<<<<<< HEAD
=======
            status: 'COMPLETED',
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
          externalTransactionId: 'pi_test123',
          verifiedAt: new Date()
        }
      });
      paymentId = payment.id;
    });

    test('should process refund successfully', async () => {
      const mockStripe = require('stripe') as any;
      mockStripe.refunds = {
        create: (jest.fn() as any).mockResolvedValue({
          id: 're_test123',
          status: 'succeeded',
          amount: 5000
        })
      };

      const response = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Service cancelled by client',
          amount: 5000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('refundId');
      expect(response.body.data.status).toBe('PROCESSING');
    });

    test('should validate refund amount', async () => {
      const response = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Service cancelled',
          amount: 10000 // More than payment amount
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('amount exceeds');
    });

    test('should prevent refund for pending payments', async () => {
      // Create pending payment
      const pendingPayment = await prisma.payment.create({
        data: {
          bookingId,
          userId,
          amount: 5000,
          method: 'MPESA',
          status: 'PENDING',
          externalTransactionId: 'MPG67890'
        }
      });

      const response = await request(app)
        .post(`/api/payments/${pendingPayment.id}/refund`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Service cancelled',
          amount: 5000
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('completed payment');
    });
  });

  describe('GET /api/payments/history', () => {
    beforeEach(async () => {
      // Create multiple payments
      await prisma.payment.createMany({
        data: [
          {
            bookingId,
            userId,
            amount: 5000,
            method: 'MPESA',
            status: 'PAID',
<<<<<<< HEAD
=======
              status: 'COMPLETED',
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
            externalTransactionId: 'MPG1',
            verifiedAt: new Date()
          },
          {
            bookingId,
            userId,
            amount: 3000,
            method: 'STRIPE_CARD',
            status: 'FAILED',
            externalTransactionId: 'pi_failed'
          }
        ]
      });
    });

    test('should return payment history', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('amount');
      expect(response.body.data[0]).toHaveProperty('status');
      expect(response.body.data[0]).toHaveProperty('method');
    });

    test('should filter by payment status', async () => {
      const response = await request(app)
        .get('/api/payments/history?status=PAID')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('PAID');
<<<<<<< HEAD
=======
        expect(response.body.data[0].status).toBe('COMPLETED');
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
    });

    test('should paginate results', async () => {
      const response = await request(app)
        .get('/api/payments/history?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta).toHaveProperty('pagination');
      expect(response.body.meta.pagination.totalPages).toBeGreaterThan(1);
    });
  });

  describe('Webhook Handling', () => {
    test('should handle M-Pesa callback webhook', async () => {
      const mockMpesaService = require('../src/services/mpesaService') as any;
      mockMpesaService.validateCallback = jest.fn().mockReturnValue(true);

      const webhookPayload = {
        Body: {
          stkCallback: {
            CheckoutRequestID: 'ws_CO_123456789',
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 5000 },
                { Name: 'MpesaReceiptNumber', Value: 'OEI2AK4Q16' },
                { Name: 'PhoneNumber', Value: 254700000000 }
              ]
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/webhook/mpesa')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should handle Stripe webhook', async () => {
      const mockStripe = require('stripe') as any;
      mockStripe.webhooks = {
        constructEvent: jest.fn().mockReturnValue({
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_test123',
              status: 'succeeded',
              amount: 500000, // Stripe amount in cents
              metadata: {
                bookingId: bookingId
              }
            }
          }
        })
      };

      const response = await request(app)
        .post('/api/payments/webhook/stripe')
        .set('stripe-signature', 'test-signature')
        .send({
          type: 'payment_intent.succeeded',
          data: { object: { id: 'pi_test123' } }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Performance and Security', () => {
    test('should handle concurrent payment requests', async () => {
      const promises = Array(5).fill(null).map((_, index) => 
        request(app)
          .post('/api/payments/intent')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            bookingId,
            provider: 'MPESA',
            mpesaDetails: {
              phoneNumber: `25470000000${index}`
            }
          })
      );

      const responses = await Promise.allSettled(promises);
      const successful = responses.filter(r => r.status === 'fulfilled' && 
        (r.value as any).status === 200);
      
      // Only one should succeed due to duplicate payment prevention
      expect(successful.length).toBe(1);
    });

    test('should validate payment webhooks for security', async () => {
      const response = await request(app)
        .post('/api/payments/webhook/mpesa')
        .send({ invalid: 'payload' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid webhook payload');
    });

    test('should rate limit payment attempts', async () => {
      // Make multiple rapid requests
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/payments/intent')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            bookingId,
            provider: 'MPESA',
            mpesaDetails: {
              phoneNumber: '254700000000'
            }
          })
      );

      const responses = await Promise.allSettled(promises);
      const rateLimited = responses.some(r => 
        r.status === 'fulfilled' && (r.value as any).status === 429
      );

      expect(rateLimited).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    test('should handle payment processor downtime', async () => {
      const mockMpesaService = require('../src/services/mpesaService') as any;
      mockMpesaService.initiatePayment = (jest.fn() as any).mockRejectedValue(
        new Error('Service temporarily unavailable')
      );

      const response = await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId,
          provider: 'MPESA',
          mpesaDetails: {
            phoneNumber: '254700000000'
          }
        })
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('temporarily unavailable');
    });

    test('should handle database transaction rollback', async () => {
      // Mock database error during payment creation
      jest.spyOn(prisma.payment, 'create')
        .mockRejectedValueOnce(new Error('Database constraint violation'));

      const response = await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId,
          provider: 'MPESA',
          mpesaDetails: {
            phoneNumber: '254700000000'
          }
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Internal server error');
    });
  });
});