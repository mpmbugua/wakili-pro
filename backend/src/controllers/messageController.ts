import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { uploadToCloudinary } from '../services/fileUploadService';

const prisma = new PrismaClient();

/**
 * Get all conversations for a user
 */
export const getConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    // Get all conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                lawyerProfile: {
                  select: {
                    specializations: true,
                    bio: true
                  }
                }
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: {
                  not: userId
                },
                read: false
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Format response
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p.userId !== userId);
      const lastMessage = conv.messages[0];

      return {
        id: conv.id,
        participantId: otherParticipant?.userId,
        participantName: otherParticipant?.user 
          ? `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`
          : 'Unknown',
        participantRole: otherParticipant?.user?.role,
        specialty: otherParticipant?.user?.lawyerProfile?.specialization || 'General Practice',
        lastMessage: lastMessage?.content || '',
        lastMessageTime: lastMessage?.createdAt || conv.updatedAt,
        unreadCount: conv._count.messages,
        updatedAt: conv.updatedAt
      };
    });

    res.json({
      success: true,
      data: formattedConversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
};

/**
 * Get or create conversation with another user
 */
export const getOrCreateConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { otherUserId } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    if (!otherUserId) {
      res.status(400).json({
        success: false,
        message: 'Other user ID is required'
      });
      return;
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: {
                userId: userId
              }
            }
          },
          {
            participants: {
              some: {
                userId: otherUserId
              }
            }
          }
        ]
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (existingConversation) {
      res.json({
        success: true,
        data: existingConversation
      });
      return;
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: userId },
            { userId: otherUserId }
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Get or create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
  }
};

/**
 * Get messages in a conversation
 */
export const getMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string; // For pagination

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    // Verify user is participant in conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: userId
          }
        }
      }
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
      return;
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(before && {
          createdAt: {
            lt: new Date(before)
          }
        })
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        attachments: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId
        },
        read: false
      },
      data: {
        read: true
      }
    });

    res.json({
      success: true,
      data: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

/**
 * Send a message
 */
export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;
    const { content } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    if (!content && (!files || files.length === 0)) {
      res.status(400).json({
        success: false,
        message: 'Message content or attachment is required'
      });
      return;
    }

    // Verify user is participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        participants: true
      }
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
      return;
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content || '',
        read: false
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Upload attachments if any
    if (files && files.length > 0) {
      const attachmentPromises = files.map(async (file) => {
        const uploadResult = await uploadToCloudinary(
          file.buffer,
          file.originalname,
          `wakili-pro/message-attachments/${conversationId}`
        );

        return prisma.messageAttachment.create({
          data: {
            messageId: message.id,
            fileName: file.originalname,
            fileUrl: uploadResult.url,
            fileSize: uploadResult.fileSize,
            mimeType: uploadResult.mimeType
          }
        });
      });

      const attachments = await Promise.all(attachmentPromises);
      
      // Include attachments in response
      (message as any).attachments = attachments;
    }

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    // Emit socket event (handled by socket service)
    const io = (req as any).io;
    if (io) {
      // Notify other participants
      conversation.participants
        .filter(p => p.userId !== userId)
        .forEach(participant => {
          io.to(`user:${participant.userId}`).emit('new_message', message);
        });
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

/**
 * Mark messages as read
 */
export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId
        },
        read: false
      },
      data: {
        read: true
      }
    });

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { messageId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      res.status(404).json({
        success: false,
        message: 'Message not found'
      });
      return;
    }

    if (message.senderId !== userId) {
      res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
      return;
    }

    await prisma.message.delete({
      where: { id: messageId }
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
};
