import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../src/utils/database';

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
  // Clean up test data
  await prisma.consultationRecording.deleteMany({});
  await prisma.videoParticipant.deleteMany({});
  await prisma.videoConsultation.deleteMany({});
  await prisma.escrowTransaction.deleteMany({});
  await prisma.refund.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.serviceBooking.deleteMany({});
  await prisma.marketplaceService.deleteMany({});
  await prisma.userProfile.deleteMany({});
  await prisma.lawyerProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
  });

  describe('User Management', () => {
    test('should create user with correct schema', async () => {
      const user = await prisma.user.create({
        data: {
          email: `test+${Date.now()}@example.com`,
          password: 'hashedpassword',
          firstName: 'Test',
          lastName: 'User',
          role: 'PUBLIC',
          emailVerified: true
        }
      });

      expect(user).toHaveProperty('id');
    expect(user.email).toContain('@example.com');
      expect(user.role).toBe('PUBLIC');
      expect(user.emailVerified).toBe(true);
    });

    test('should create lawyer with profile', async () => {
      const lawyer = await prisma.user.create({
        data: {
          email: `lawyer+${Date.now()}@example.com`,
          password: 'hashedpassword',
          firstName: 'Test',
          lastName: 'Lawyer',
          role: 'LAWYER',
          emailVerified: true
        }
      });

      const lawyerProfile = await prisma.lawyerProfile.create({
        data: {
          userId: lawyer.id,
          licenseNumber: 'LSK001',
          yearOfAdmission: 2020,
          specializations: ['CORPORATE', 'FAMILY'],
          location: { county: 'Nairobi', city: 'Nairobi' },
          bio: 'Experienced lawyer specializing in corporate and family law',
          yearsOfExperience: 5,
          isVerified: true,
          availability: [
            {
              day: 'MONDAY',
              startTime: '09:00',
              endTime: '17:00',
              isAvailable: true
            }
          ]
        }
      });

      expect(lawyerProfile).toHaveProperty('id');
      expect(lawyerProfile.licenseNumber).toBe('LSK001');
      expect(lawyerProfile.isVerified).toBe(true);
    });
  });

  describe('Marketplace Services', () => {
    let providerId: string;

    beforeAll(async () => {
      const provider = await prisma.user.create({
        data: {
          email: `provider+${Date.now()}@example.com`,
          password: 'hashedpassword',
          firstName: 'Service',
          lastName: 'Provider',
          role: 'LAWYER',
          emailVerified: true
        }
      });
      providerId = provider.id;
    });

    test('should create marketplace service', async () => {
      const service = await prisma.marketplaceService.create({
        data: {
          type: 'CONSULTATION',
          title: 'Legal Consultation',
          description: 'Professional legal advice',
          providerId,
          priceKES: 5000,
          status: 'ACTIVE'
        }
      });

      expect(service).toHaveProperty('id');
      expect(service.type).toBe('CONSULTATION');
      expect(service.priceKES).toBe(5000);
      expect(service.status).toBe('ACTIVE');
    });

    test('should create service booking', async () => {
      const client = await prisma.user.create({
        data: {
          email: `client+${Date.now()}@example.com`,
          password: 'hashedpassword',
          firstName: 'Test',
          lastName: 'Client',
          role: 'PUBLIC',
          emailVerified: true
        }
      });

      const service = await prisma.marketplaceService.create({
        data: {
          type: 'CONSULTATION',
          title: 'Legal Consultation',
          description: 'Professional legal advice',
          providerId,
          priceKES: 5000,
          status: 'ACTIVE'
        }
      });

      const booking = await prisma.serviceBooking.create({
        data: {
          serviceId: service.id,
          clientId: client.id,
          providerId,
          totalAmountKES: 5000,
          clientRequirements: 'Need legal advice',
          status: 'PENDING'
        }
      });

      expect(booking).toHaveProperty('id');
      expect(booking.totalAmountKES).toBe(5000);
      expect(booking.status).toBe('PENDING');
    });
  });

  describe('Video Consultations', () => {
    let bookingId: string;
    let lawyerId: string;
    let clientId: string;

    beforeAll(async () => {
      const lawyer = await prisma.user.create({
        data: {
          email: `consultation-lawyer+${Date.now()}@example.com`,
          password: 'hashedpassword',
          firstName: 'Consultation',
          lastName: 'Lawyer',
          role: 'LAWYER',
          emailVerified: true
        }
      });
      lawyerId = lawyer.id;

      const client = await prisma.user.create({
        data: {
          email: `consultation-client+${Date.now()}@example.com`,
          password: 'hashedpassword',
          firstName: 'Consultation',
          lastName: 'Client',
          role: 'PUBLIC',
          emailVerified: true
        }
      });
      clientId = client.id;

      const service = await prisma.marketplaceService.create({
        data: {
          type: 'CONSULTATION',
          title: 'Video Consultation',
          description: 'Online legal consultation',
          providerId: lawyerId,
          priceKES: 7000,
          status: 'ACTIVE'
        }
      });

      const booking = await prisma.serviceBooking.create({
        data: {
          serviceId: service.id,
          clientId,
          providerId: lawyerId,
          totalAmountKES: 7000,
          clientRequirements: 'Need video consultation',
          status: 'CONFIRMED'
        }
      });
      bookingId = booking.id;
    });

    test('should create video consultation', async () => {
      const consultation = await prisma.videoConsultation.create({
        data: {
          bookingId,
          lawyerId,
          clientId,
          roomId: `room_${Date.now()}`,
          scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
          status: 'SCHEDULED'
        }
      });

      expect(consultation).toHaveProperty('id');
      expect(consultation.status).toBe('SCHEDULED');
      expect(consultation.roomId).toMatch(/^room_/);
    });

    test('should create consultation recording', async () => {
      const service = await prisma.marketplaceService.create({
        data: {
          type: 'CONSULTATION',
          title: 'Video Consultation Recording',
          description: 'Online legal consultation recording',
          providerId: lawyerId,
          priceKES: 7000,
          status: 'ACTIVE'
        }
      });
      const uniqueBooking = await prisma.serviceBooking.create({
        data: {
          serviceId: service.id,
          clientId,
          providerId: lawyerId,
          totalAmountKES: 7000,
          clientRequirements: 'Need video consultation recording',
          status: 'CONFIRMED'
        }
      });
      const consultation = await prisma.videoConsultation.create({
        data: {
          bookingId: uniqueBooking.id,
          lawyerId,
          clientId,
          roomId: `room_recording_${Date.now()}`,
          scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
          status: 'IN_PROGRESS',
          isRecorded: true
        }
      });

      const recording = await prisma.consultationRecording.create({
        data: {
          consultationId: consultation.id,
          fileName: 'consultation_recording.webm',
          storageKey: '/recordings/consultation_recording.webm',
          duration: 1800,
          fileSize: 10485760,
          format: 'webm',
          codec: 'VP9',
          resolution: '1280x720'
        }
      });

      expect(recording).toHaveProperty('id');
      expect(recording.duration).toBe(1800);
      expect(recording.format).toBe('webm');
    });

    test('should add video participants', async () => {
      const service = await prisma.marketplaceService.create({
        data: {
          type: 'CONSULTATION',
          title: 'Video Consultation Participants',
          description: 'Online legal consultation participants',
          providerId: lawyerId,
          priceKES: 7000,
          status: 'ACTIVE'
        }
      });
      const uniqueBooking = await prisma.serviceBooking.create({
        data: {
          serviceId: service.id,
          clientId,
          providerId: lawyerId,
          totalAmountKES: 7000,
          clientRequirements: 'Need video consultation participants',
          status: 'CONFIRMED'
        }
      });
      const consultation = await prisma.videoConsultation.create({
        data: {
          bookingId: uniqueBooking.id,
          lawyerId,
          clientId,
          roomId: `room_participants_${Date.now()}`,
          scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
          status: 'IN_PROGRESS'
        }
      });

      await prisma.videoParticipant.createMany({
        data: [
          {
            consultationId: consultation.id,
            userId: lawyerId,
            participantType: 'LAWYER',
            joinedAt: new Date()
          },
          {
            consultationId: consultation.id,
            userId: clientId,
            participantType: 'CLIENT',
            joinedAt: new Date()
          }
        ]
      });

      const participants = await prisma.videoParticipant.findMany({
        where: { consultationId: consultation.id }
      });

      expect(participants).toHaveLength(2);
      expect(participants.map(p => p.participantType)).toContain('LAWYER');
      expect(participants.map(p => p.participantType)).toContain('CLIENT');
    });
  });

  describe('Payment Processing', () => {
    let bookingId: string;
    let userId: string;

    beforeAll(async () => {
      const user = await prisma.user.create({
        data: {
          email: `payment-user+${Date.now()}@example.com`,
          password: 'hashedpassword',
          firstName: 'Payment',
          lastName: 'User',
          role: 'PUBLIC',
          emailVerified: true
        }
      });
      userId = user.id;

      const provider = await prisma.user.create({
        data: {
          email: `payment-provider+${Date.now()}@example.com`,
          password: 'hashedpassword',
          firstName: 'Payment',
          lastName: 'Provider',
          role: 'LAWYER',
          emailVerified: true
        }
      });

      const service = await prisma.marketplaceService.create({
        data: {
          type: 'CONSULTATION',
          title: 'Paid Consultation',
          description: 'Consultation with payment',
          providerId: provider.id,
          priceKES: 8000,
          status: 'ACTIVE'
        }
      });

      const booking = await prisma.serviceBooking.create({
        data: {
          serviceId: service.id,
          clientId: userId,
          providerId: provider.id,
          totalAmountKES: 8000,
          clientRequirements: 'Paid consultation needed',
          status: 'CONFIRMED'
        }
      });
      bookingId = booking.id;
    });

    test('should create payment record', async () => {
      const payment = await prisma.payment.create({
        data: {
          bookingId,
          userId,
          amount: 8000,
          method: 'MPESA',
          status: 'PENDING',
          externalTransactionId: 'MPG123456789'
        }
      });

      expect(payment).toHaveProperty('id');
      expect(payment.amount).toBe(8000);
      expect(payment.method).toBe('MPESA');
      expect(payment.status).toBe('PENDING');
    });

    test('should create escrow transaction', async () => {
      const payment = await prisma.payment.create({
        data: {
          bookingId,
          userId,
          amount: 8000,
          method: 'STRIPE_CARD',
          status: 'PAID',
          externalTransactionId: 'pi_escrow_test',
          verifiedAt: new Date()
        }
      });

      const escrow = await prisma.escrowTransaction.create({
        data: {
          paymentId: payment.id,
          amount: 8000,
          status: 'HELD',
          platformFee: 800, // 10%
          lawyerPayout: 7200
        }
      });

      expect(escrow).toHaveProperty('id');
      expect(escrow.status).toBe('HELD');
      expect(escrow.platformFee).toBe(800);
      expect(escrow.lawyerPayout).toBe(7200);
    });

    test('should process refund', async () => {
      const payment = await prisma.payment.create({
        data: {
          bookingId,
          userId,
          amount: 8000,
          method: 'STRIPE_CARD',
          status: 'PAID',
          externalTransactionId: 'pi_refund_test',
          verifiedAt: new Date()
        }
      });

      const refund = await prisma.refund.create({
        data: {
          paymentId: payment.id,
          amount: 4000, // Partial refund
          reason: 'Service partially completed',
          status: 'PENDING',
          requestedBy: userId,
          externalRefundId: 're_test_refund'
        }
      });

      expect(refund).toHaveProperty('id');
      expect(refund.amount).toBe(4000);
      expect(refund.status).toBe('PENDING');
    });
  });

  describe('Schema Relationships', () => {
    test('should maintain referential integrity', async () => {
      const user = await prisma.user.create({
        data: {
          email: `integrity+${Date.now()}@example.com`,
          password: 'hashedpassword',
          firstName: 'Integrity',
          lastName: 'Test',
          role: 'PUBLIC',
          emailVerified: true
        }
      });

      const profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          bio: 'Test user profile',
          county: 'Nairobi',
          city: 'Nairobi'
        }
      });

      // Verify the relationship
      const userWithProfile = await prisma.user.findUnique({
        where: { id: user.id },
<<<<<<< HEAD
        include: { profile: true }
      });

      expect(userWithProfile?.profile).toBeDefined();
      expect(userWithProfile?.profile?.id).toBe(profile.id);
=======
        include: { userProfile: true }
      });

      expect(userWithProfile?.userProfile).toBeDefined();
      expect(userWithProfile?.userProfile?.id).toBe(profile.id);
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
    });

    test('should handle cascade deletions properly', async () => {
      const user = await prisma.user.create({
        data: {
          email: `cascade+${Date.now()}@example.com`,
          password: 'hashedpassword',
          firstName: 'Cascade',
          lastName: 'Test',
          role: 'PUBLIC',
          emailVerified: true
        }
      });

      await prisma.userProfile.create({
        data: {
          userId: user.id,
          bio: 'Test profile for cascade',
          county: 'Mombasa',
          city: 'Mombasa'
        }
      });

      // Delete user should cascade to profile
      await prisma.user.delete({ where: { id: user.id } });

      const profile = await prisma.userProfile.findFirst({
        where: { userId: user.id }
      });

      expect(profile).toBeNull();
    });
  });

  describe('Data Validation', () => {
    test('should enforce unique constraints', async () => {
      const email = 'unique@example.com';
      
      await prisma.user.create({
        data: {
          email,
          password: 'hashedpassword',
          firstName: 'First',
          lastName: 'User',
          role: 'PUBLIC',
          emailVerified: true
        }
      });

      // Attempting to create another user with the same email should fail
      await expect(
        prisma.user.create({
          data: {
            email,
            password: 'hashedpassword2',
            firstName: 'Second',
            lastName: 'User',
            role: 'PUBLIC',
            emailVerified: true
          }
        })
      ).rejects.toThrow();
    });

    test('should validate enum values', async () => {
      // Invalid UserRole should fail
      await expect(
        prisma.user.create({
          data: {
            email: 'invalid-role@example.com',
            password: 'hashedpassword',
            firstName: 'Invalid',
            lastName: 'Role',
<<<<<<< HEAD
            role: 'INVALID_ROLE' as any,
=======
              role: 'INVALID_ROLE',
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
            emailVerified: true
          }
        })
      ).rejects.toThrow();
    });
  });
});