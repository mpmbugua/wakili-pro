import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateServiceFee } from '../utils/serviceFeeCalculator';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

type RequestStatus = 'PENDING' | 'QUOTES_RECEIVED' | 'LAWYER_SELECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CONFIRMED' | 'CANCELLED';

/**
 * Create a new service request
 * POST /api/service-requests
 */
export const createServiceRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      serviceCategory,
      serviceTitle,
      description,
      estimatedBudget,
      urgency,
      phoneNumber,
      email,
      transactionValue,
      dealValue,
      claimAmount,
      businessType,
      complexity,
      commitmentFeePaid,
      commitmentFeeTxId
    } = req.body;

    // Calculate estimated fee using shared utility
    const feeCalculation = calculateServiceFee(serviceCategory, {
      transactionValue,
      dealValue,
      claimAmount,
      businessType,
      complexity
    });

    // Validate commitment fee payment
    if (!commitmentFeePaid || !commitmentFeeTxId) {
      return res.status(400).json({ 
        error: 'Commitment fee payment required',
        commitmentFeeAmount: 500
      });
    }

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        userId,
        serviceCategory,
        serviceTitle,
        description,
        estimatedBudget,
        estimatedFee: feeCalculation.estimatedFee,
        tier: feeCalculation.tier,
        urgency,
        phoneNumber,
        email,
        transactionValue,
        dealValue,
        claimAmount,
        businessType,
        complexity,
        commitmentFeePaid,
        commitmentFeeAmount: 500,
        commitmentFeeTxId,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // TODO: Trigger lawyer matching notification here
    // await notifyMatchedLawyers(serviceRequest);

    res.status(201).json({
      success: true,
      data: serviceRequest,
      message: 'Service request created successfully. Notifying available lawyers...'
    });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ error: 'Failed to create service request' });
  }
};

/**
 * Get service request by ID
 * GET /api/service-requests/:id
 */
export const getServiceRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        },
        quotes: {
          include: {
            lawyer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                lawyerProfile: {
                  select: {
                    specialization: true,
                    yearsOfExperience: true,
                    rating: true,
                    subscriptionTier: true
                  }
                }
              }
            }
          },
          orderBy: {
            submittedAt: 'asc'
          }
        },
        selectedLawyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        }
      }
    });

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    // Authorization check: only request creator or lawyers with quotes can view
    const hasQuote = serviceRequest.quotes.some(q => q.lawyerId === userId);
    if (serviceRequest.userId !== userId && !hasQuote && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to view this request' });
    }

    res.json({
      success: true,
      data: serviceRequest
    });
  } catch (error) {
    console.error('Error fetching service request:', error);
    res.status(500).json({ error: 'Failed to fetch service request' });
  }
};

/**
 * Get client's own service requests
 * GET /api/service-requests/my-requests
 */
export const getMyRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status, page = '1', limit = '10' } = req.query;

    const where: any = { userId };
    if (status) {
      where.status = status as RequestStatus;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          quotes: {
            select: {
              id: true,
              lawyerId: true,
              proposedFee: true,
              submittedAt: true
            }
          },
          selectedLawyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.serviceRequest.count({ where })
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching my requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

/**
 * Get available service requests for lawyers (filtered by tier)
 * GET /api/service-requests/available
 */
export const getAvailableRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = '1', limit = '10' } = req.query;

    if (req.user?.role !== 'LAWYER') {
      return res.status(403).json({ error: 'Only lawyers can view available requests' });
    }

    // Get lawyer's subscription tier
    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { userId },
      select: { tier: true }
    });

    if (!lawyerProfile) {
      return res.status(403).json({ error: 'Lawyer profile not found' });
    }

    // Tier filtering logic
    const where: any = {
      status: 'PENDING',
      NOT: {
        quotes: {
          some: {
            lawyerId: userId
          }
        }
      }
    };

    // LITE tier can only see tier1 requests (< 100K)
    // PRO tier can see both tier1 and tier2
    if (lawyerProfile.tier === 'LITE') {
      where.tier = 'tier1';
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              quotes: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.serviceRequest.count({ where })
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      },
      tierInfo: {
        currentTier: lawyerProfile.tier,
        canAccessTier2: lawyerProfile.tier === 'PRO'
      }
    });
  } catch (error) {
    console.error('Error fetching available requests:', error);
    res.status(500).json({ error: 'Failed to fetch available requests' });
  }
};

/**
 * Submit quote for a service request
 * POST /api/service-requests/:id/quotes
 */
export const submitQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (req.user?.role !== 'LAWYER') {
      return res.status(403).json({ error: 'Only lawyers can submit quotes' });
    }

    const {
      connectionFeePaid,
      connectionFeeTxId,
      proposedFee,
      proposedTimeline,
      approach,
      offersMilestones,
      milestones
    } = req.body;

    // Get service request
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    if (serviceRequest.status !== 'PENDING') {
      return res.status(400).json({ error: 'This request is no longer accepting quotes' });
    }

    // Get lawyer tier
    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { userId },
      select: { tier: true }
    });

    if (!lawyerProfile) {
      return res.status(403).json({ error: 'Lawyer profile not found' });
    }

    // Tier validation
    if (lawyerProfile.tier === 'LITE' && serviceRequest.tier === 'tier2') {
      return res.status(403).json({ 
        error: 'PRO subscription required for this request',
        upgradeRequired: true
      });
    }

    // Calculate connection fee
    const connectionFeeAmount = serviceRequest.tier === 'tier2' ? 5000 : 2000;

    // Validate connection fee payment
    if (!connectionFeePaid || !connectionFeeTxId) {
      return res.status(400).json({ 
        error: 'Connection fee payment required',
        connectionFeeAmount
      });
    }

    // Check for duplicate quote
    const existingQuote = await prisma.lawyerQuote.findFirst({
      where: {
        serviceRequestId: id,
        lawyerId: userId
      }
    });

    if (existingQuote) {
      return res.status(400).json({ error: 'You have already submitted a quote for this request' });
    }

    // Create quote
    const quote = await prisma.lawyerQuote.create({
      data: {
        serviceRequestId: id,
        lawyerId: userId!,
        connectionFeePaid,
        connectionFeeAmount,
        connectionFeeTxId,
        proposedFee,
        proposedTimeline,
        approach,
        offersMilestones: offersMilestones || false,
        milestones: milestones || null
      },
      include: {
        lawyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            lawyerProfile: {
              select: {
                specialization: true,
                yearsOfExperience: true,
                rating: true
              }
            }
          }
        }
      }
    });

    // Update request status
    await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'QUOTES_RECEIVED'
      }
    });

    // TODO: Notify client about new quote

    res.status(201).json({
      success: true,
      data: quote,
      message: 'Quote submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting quote:', error);
    res.status(500).json({ error: 'Failed to submit quote' });
  }
};

/**
 * Select a lawyer for a service request
 * POST /api/service-requests/:id/select-lawyer
 */
export const selectLawyer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quoteId } = req.body;
    const userId = req.user?.id;

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        quotes: true
      }
    });

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    if (serviceRequest.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (serviceRequest.status !== 'PENDING' && serviceRequest.status !== 'QUOTES_RECEIVED') {
      return res.status(400).json({ error: 'Lawyer already selected' });
    }

    const selectedQuote = serviceRequest.quotes.find(q => q.id === quoteId);
    if (!selectedQuote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Update quote and service request
    await Promise.all([
      prisma.lawyerQuote.update({
        where: { id: quoteId },
        data: { isSelected: true }
      }),
      prisma.serviceRequest.update({
        where: { id },
        data: {
          selectedLawyerId: selectedQuote.lawyerId,
          status: 'LAWYER_SELECTED'
        }
      })
    ]);

    // TODO: Notify selected lawyer and client

    res.json({
      success: true,
      message: 'Lawyer selected successfully'
    });
  } catch (error) {
    console.error('Error selecting lawyer:', error);
    res.status(500).json({ error: 'Failed to select lawyer' });
  }
};

/**
 * Mark service as complete (lawyer)
 * PATCH /api/service-requests/:id/mark-complete
 */
export const markComplete = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    if (serviceRequest.selectedLawyerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // TODO: Notify client to confirm completion

    res.json({
      success: true,
      message: 'Service marked as complete. Awaiting client confirmation.'
    });
  } catch (error) {
    console.error('Error marking complete:', error);
    res.status(500).json({ error: 'Failed to mark complete' });
  }
};

/**
 * Confirm service completion and rate lawyer (client)
 * PATCH /api/service-requests/:id/confirm-complete
 */
export const confirmComplete = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const userId = req.user?.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    if (serviceRequest.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (serviceRequest.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Service not marked as complete yet' });
    }

    await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        rating,
        feedback
      }
    });

    // TODO: Update lawyer's rating and stats

    res.json({
      success: true,
      message: 'Service confirmed and rated successfully'
    });
  } catch (error) {
    console.error('Error confirming completion:', error);
    res.status(500).json({ error: 'Failed to confirm completion' });
  }
};
