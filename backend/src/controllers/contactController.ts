import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/**
 * Submit contact form - sends message to admin
 * POST /api/contact
 */
export const submitContactForm = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message }: ContactFormData = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required'
      });
    }

    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Message must be at least 10 characters long'
      });
    }

    // Find admin user(s)
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'SUPER_ADMIN' }
        ]
      },
      select: { id: true }
    });

    if (adminUsers.length === 0) {
      logger.error('[Contact Form] No admin users found in database');
      return res.status(500).json({
        success: false,
        message: 'Unable to process contact form. Please try again later.'
      });
    }

    // Create contact form submission record (for tracking)
    const contactSubmission = await prisma.contactSubmission.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject,
        message,
        status: 'PENDING'
      }
    });

    // Send message to all admins
    const messageContent = `
**New Contact Form Submission**

**From:** ${name}
**Email:** ${email}
${phone ? `**Phone:** ${phone}` : ''}
**Subject:** ${subject}

**Message:**
${message}

---
*Submission ID: ${contactSubmission.id}*
    `.trim();

    for (const admin of adminUsers) {
      try {
        // Create or get conversation with admin
        const conversation = await prisma.conversation.create({
          data: {
            participants: {
              create: [
                { userId: admin.id }
              ]
            },
            messages: {
              create: {
                senderId: admin.id, // Message appears as system message
                content: messageContent,
                read: false
              }
            }
          }
        });

        logger.info(`[Contact Form] Sent to admin ${admin.id} in conversation ${conversation.id}`);
      } catch (convError) {
        logger.error(`[Contact Form] Failed to send to admin ${admin.id}:`, convError);
      }
    }

    logger.info(`[Contact Form] Submission ${contactSubmission.id} from ${email}`);

    res.status(200).json({
      success: true,
      message: 'Thank you for contacting us. We will respond within 24 hours.',
      data: {
        submissionId: contactSubmission.id
      }
    });

  } catch (error) {
    logger.error('[Contact Form] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form. Please try again later.'
    });
  }
};
