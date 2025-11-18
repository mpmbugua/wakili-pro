import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PushNotification {
  title: string;
  body: string;
  data?: { [key: string]: string };
  imageUrl?: string;
  clickAction?: string;
  tag?: string;
}

export interface VideoCallNotification extends PushNotification {
  consultationId: string;
  roomId: string;
  callerName: string;
  callType: 'incoming' | 'missed' | 'ended';
}

export interface MobileDevice {
  id: string;
  userId: string;
  deviceToken: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  isActive: boolean;
  lastSeen: Date;
}

class MobileIntegrationService {
  private isInitialized = false;
  private registeredDevices: Map<string, MobileDevice> = new Map();

  constructor() {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initializeFirebase(): void {
    try {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      const projectId = process.env.FIREBASE_PROJECT_ID;

      if (!serviceAccountKey || !projectId) {
        logger.warn('Firebase credentials not configured - push notifications disabled');
        return;
      }

      const serviceAccount = JSON.parse(serviceAccountKey);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId
      });

      this.isInitialized = true;
      logger.info('Firebase Admin SDK initialized for push notifications');
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK:', error);
    }
  }

  /**
   * Register a mobile device for push notifications
   */
  async registerDevice(
    userId: string,
    deviceToken: string,
    platform: 'ios' | 'android' | 'web',
    appVersion: string = '1.0.0'
  ): Promise<void> {
    try {
      const deviceId = `${userId}_${platform}_${deviceToken.substr(-8)}`;
      
      const device: MobileDevice = {
        id: deviceId,
        userId,
        deviceToken,
        platform,
        appVersion,
        isActive: true,
        lastSeen: new Date()
      };

      // Store in memory (in production, use database)
      this.registeredDevices.set(deviceId, device);

      // Store in database
      await prisma.deviceRegistration.upsert({
        where: { deviceToken },
        update: {
          isActive: true,
          lastSeen: new Date(),
          appVersion
        },
        create: {
          userId,
          deviceToken,
          platform,
          appVersion,
          isActive: true
        }
      });

      logger.info(`Device registered: ${platform} device for user ${userId}`);
    } catch (error) {
      logger.error('Failed to register device:', error);
      throw new Error('Failed to register device for notifications');
    }
  }

  /**
   * Send push notification to specific user
   */
  async sendNotificationToUser(
    userId: string,
    notification: PushNotification,
    platforms?: ('ios' | 'android' | 'web')[]
  ): Promise<void> {
    if (!this.isInitialized) {
      logger.warn('Firebase not initialized - skipping push notification');
      return;
    }

    try {
      // Get user's active devices
      const userDevices = await this.getUserDevices(userId, platforms);
      
      if (userDevices.length === 0) {
        logger.info(`No active devices found for user ${userId}`);
        return;
      }

  const tokens = userDevices.map((device: MobileDevice) => device.deviceToken);
      
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl
        },
        data: notification.data || {},
        android: {
          priority: 'high',
          notification: {
            clickAction: notification.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
            tag: notification.tag,
            channelId: 'video_calls'
          }
        },
        apns: {
          headers: {
            'apns-priority': '10'
          },
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body
              },
              badge: 1,
              sound: 'default',
              category: notification.clickAction
            }
          }
        },
        webpush: {
          headers: {
            Urgency: 'high'
          },
          notification: {
            title: notification.title,
            body: notification.body,
            icon: '/assets/icon-192x192.png',
            badge: '/assets/badge-72x72.png',
            image: notification.imageUrl,
            tag: notification.tag,
            requireInteraction: true
          },
          fcmOptions: {
            link: notification.clickAction || '/'
          }
        }
      };

  const response = await (admin.messaging() as admin.messaging.Messaging).sendMulticast(message);
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
  response.responses.forEach((resp: admin.messaging.SendResponse, idx: number) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            logger.warn(`Failed to send notification to token ${tokens[idx]}:`, resp.error);
          }
        });

        // Deactivate invalid tokens
        await this.deactivateTokens(failedTokens);
      }

      logger.info(`Push notification sent to ${response.successCount} devices for user ${userId}`);
    } catch (error) {
      logger.error('Failed to send push notification:', error);
      throw new Error('Failed to send push notification');
    }
  }

  /**
   * Send video call notification
   */
  async sendVideoCallNotification(
    userId: string,
    callNotification: VideoCallNotification
  ): Promise<void> {
    const notification: PushNotification = {
      title: callNotification.title,
      body: callNotification.body,
      data: {
        type: 'video_call',
        consultationId: callNotification.consultationId,
        roomId: callNotification.roomId,
        callerName: callNotification.callerName,
        callType: callNotification.callType
      },
      clickAction: `/consultation/${callNotification.consultationId}/video`,
      tag: `video_call_${callNotification.consultationId}`
    };

    await this.sendNotificationToUser(userId, notification);
  }

  /**
   * Send incoming video call notification
   */
  async sendIncomingCallNotification(
    consultationId: string,
    recipientUserId: string,
    callerName: string
  ): Promise<void> {
    const consultation = await prisma.videoConsultation.findUnique({
      where: { id: consultationId }
    });

    if (!consultation) {
      throw new Error('Consultation not found');
    }

    const callNotification: VideoCallNotification = {
      title: 'Incoming Video Call',
      body: `${callerName} is calling you for a consultation`,
      consultationId,
      roomId: consultation.roomId,
      callerName,
      callType: 'incoming',
      clickAction: `/consultation/${consultationId}/video`,
      data: {
        type: 'incoming_call',
        consultationId,
        roomId: consultation.roomId,
        action: 'answer_call'
      }
    };

    await this.sendVideoCallNotification(recipientUserId, callNotification);
  }

  /**
   * Send consultation reminder notification
   */
  async sendConsultationReminder(
    consultationId: string,
    minutesBefore: number = 15
  ): Promise<void> {
    try {
      const consultation = await prisma.videoConsultation.findUnique({
        where: { id: consultationId },
        include: {
          lawyer: { select: { firstName: true, lastName: true } },
          client: { select: { firstName: true, lastName: true } }
        }
      });

      if (!consultation) return;

      const lawyerName = `${consultation.lawyer.firstName} ${consultation.lawyer.lastName}`;
      const clientName = `${consultation.client.firstName} ${consultation.client.lastName}`;

      // Send to both lawyer and client
      const notifications = [
        {
          userId: consultation.lawyerId,
          title: 'Consultation Reminder',
          body: `Your consultation with ${clientName} starts in ${minutesBefore} minutes`
        },
        {
          userId: consultation.clientId,
          title: 'Consultation Reminder', 
          body: `Your consultation with ${lawyerName} starts in ${minutesBefore} minutes`
        }
      ];

      for (const notif of notifications) {
        await this.sendNotificationToUser(notif.userId, {
          title: notif.title,
          body: notif.body,
          data: {
            type: 'consultation_reminder',
            consultationId,
            minutesBefore: minutesBefore.toString()
          },
          clickAction: `/consultation/${consultationId}/video`
        });
      }

    } catch (error) {
      logger.error('Failed to send consultation reminder:', error);
    }
  }

  /**
   * Send consultation ended notification
   */
  async sendConsultationEndedNotification(consultationId: string): Promise<void> {
    try {
      const consultation = await prisma.videoConsultation.findUnique({
        where: { id: consultationId },
        include: {
          lawyer: { select: { firstName: true, lastName: true } },
          client: { select: { firstName: true, lastName: true } }
        }
      });

      if (!consultation) return;

      const duration = consultation.endedAt && consultation.startedAt
        ? Math.round((consultation.endedAt.getTime() - consultation.startedAt.getTime()) / (1000 * 60))
        : 0;

      const notifications = [
        {
          userId: consultation.lawyerId,
          title: 'Consultation Completed',
          body: `Your consultation has ended. Duration: ${duration} minutes`
        },
        {
          userId: consultation.clientId,
          title: 'Consultation Completed',
          body: `Your consultation has ended. Duration: ${duration} minutes`
        }
      ];

      for (const notif of notifications) {
        await this.sendNotificationToUser(notif.userId, {
          title: notif.title,
          body: notif.body,
          data: {
            type: 'consultation_ended',
            consultationId,
            duration: duration.toString()
          },
          clickAction: '/dashboard'
        });
      }

    } catch (error) {
      logger.error('Failed to send consultation ended notification:', error);
    }
  }

  /**
   * Get user's registered devices
   */
  private async getUserDevices(
    userId: string,
    platforms?: ('ios' | 'android' | 'web')[]
  ): Promise<MobileDevice[]> {
        try {
      const whereClause: Record<string, unknown> = {
        userId,
        isActive: true
      };

      if (platforms && platforms.length > 0) {
        whereClause.platform = { in: platforms };
      }

      const devices = await prisma.deviceRegistration.findMany({
        where: whereClause
      });

      return devices.map((device: any) => ({
        id: device.id,
        userId: device.userId,
        deviceToken: device.deviceToken,
        platform: device.platform as 'ios' | 'android' | 'web',
        appVersion: device.appVersion,
        isActive: device.isActive,
        lastSeen: device.lastSeen
      }));

    } catch (error) {
      logger.error('Failed to get user devices:', error);
      return [];
    }
  }

  /**
   * Deactivate invalid device tokens
   */
  private async deactivateTokens(tokens: string[]): Promise<void> {
    try {
      await prisma.deviceRegistration.updateMany({
        where: {
          deviceToken: { in: tokens }
        },
        data: {
          isActive: false
        }
      });

      tokens.forEach(token => {
        const device = Array.from(this.registeredDevices.values())
          .find((d: MobileDevice) => d.deviceToken === token);
        if (device) {
          device.isActive = false;
        }
      });

      logger.info(`Deactivated ${tokens.length} invalid device tokens`);
    } catch (error) {
      logger.error('Failed to deactivate tokens:', error);
    }
  }

  /**
   * Schedule consultation reminders
   */
  async scheduleConsultationReminders(): Promise<void> {
    try {
      const upcomingConsultations = await prisma.videoConsultation.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
          }
        }
      });

      for (const consultation of upcomingConsultations) {
        const scheduledTime = consultation.scheduledAt.getTime();
        const now = Date.now();
        
        // Schedule 15-minute reminder
        const fifteenMinutesBefore = scheduledTime - (15 * 60 * 1000);
        if (fifteenMinutesBefore > now) {
          setTimeout(() => {
            this.sendConsultationReminder(consultation.id, 15);
          }, fifteenMinutesBefore - now);
        }

        // Schedule 5-minute reminder
        const fiveMinutesBefore = scheduledTime - (5 * 60 * 1000);
        if (fiveMinutesBefore > now) {
          setTimeout(() => {
            this.sendConsultationReminder(consultation.id, 5);
          }, fiveMinutesBefore - now);
        }
      }

      logger.info(`Scheduled reminders for ${upcomingConsultations.length} consultations`);
    } catch (error) {
      logger.error('Failed to schedule consultation reminders:', error);
    }
  }

  /**
   * Get mobile app configuration
   */
  getMobileAppConfig(): Record<string, unknown> {
    return {
      videoCall: {
        maxParticipants: 6,
        maxDuration: 7200, // 2 hours in seconds
        supportedCodecs: ['VP9', 'VP8', 'H264'],
        supportedFormats: ['webm', 'mp4'],
        qualityProfiles: ['low', 'medium', 'high', 'auto']
      },
      features: {
        recording: true,
        screenSharing: true,
        chat: true,
        fileSharing: false,
        virtualBackground: false
      },
      notifications: {
        enabled: this.isInitialized,
        types: ['incoming_call', 'consultation_reminder', 'consultation_ended']
      },
      api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:5000/api',
        websocketUrl: process.env.WEBSOCKET_URL || 'ws://localhost:5000',
        version: '1.0.0'
      }
    };
  }
}

export const mobileIntegrationService = new MobileIntegrationService();