import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { notifyMatchedLawyers } from '../services/lawyerNotificationService';
import * as analyticsService from '../services/analyticsService';

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
      urgency,
      phoneNumber,
      email,
      preferredTimeline,
      additionalNotes,
      // Context fields (no monetary values)
      propertyLocation,
      titleType,
      hasDisputes,
      companyType,
      numberOfEmployees,
      industry,
      debtType,
      debtAge,
      hasContract,
      businessType,
      numberOfDirectors,
      hasNameReserved,
      needsTaxRegistration,
      numberOfBeneficiaries,
      hasInternationalAssets,
      hasBusiness,
      includesNonCompete,
      hasProperty,
      needsCustody,
      commitmentFeeTxId
    } = req.body;

    // Check for first-time service request freebie
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { freeServiceRequestUsed: true }
    });

    const isFreebie = !user?.freeServiceRequestUsed;

    // For freebie, skip payment validation
    if (!isFreebie && !commitmentFeeTxId) {
      return res.status(400).json({ 
        error: 'Commitment fee payment required',
        commitmentFeeAmount: 500
      });
    }

    // Mark freebie as used if applicable
    if (isFreebie) {
      await prisma.user.update({
        where: { id: userId },
        data: { freeServiceRequestUsed: true }
      });
    }

    // Create service request without fee estimates
    // Lawyers will provide quotes based on case details
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        userId,
        serviceCategory,
        serviceTitle,
        description,
        urgency,
        phoneNumber,
        email,
        // Context fields - casting to any since they may not all exist in schema
        propertyLocation,
        titleType,
        hasDisputes: hasDisputes === true || hasDisputes === 'true',
        companyType,
        numberOfEmployees: numberOfEmployees ? parseInt(numberOfEmployees) : undefined,
        industry,
        debtType,
        debtAge,
        hasContract: hasContract === true || hasContract === 'true',
        businessType,
        numberOfDirectors: numberOfDirectors ? parseInt(numberOfDirectors) : undefined,
        hasNameReserved: hasNameReserved === true || hasNameReserved === 'true',
        needsTaxRegistration: needsTaxRegistration === true || needsTaxRegistration === 'true',
        numberOfBeneficiaries: numberOfBeneficiaries ? parseInt(numberOfBeneficiaries) : undefined,
        hasInternationalAssets: hasInternationalAssets === true || hasInternationalAssets === 'true',
        hasBusiness: hasBusiness === true || hasBusiness === 'true',
        includesNonCompete: includesNonCompete === true || includesNonCompete === 'true',
        hasProperty: hasProperty === true || hasProperty === 'true',
        needsCustody: needsCustody === true || needsCustody === 'true',
        // Payment tracking
        commitmentFeePaid: isFreebie ? true : false, // Freebies skip payment
        commitmentFeeAmount: isFreebie ? 0 : 500,
        commitmentFeeTxId: isFreebie ? null : commitmentFeeTxId,
        status: 'PENDING'
      } as any,
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

    // Match ALL verified lawyers (remove tier filtering)
    // Lawyers will self-select based on their expertise
    const matchedLawyers = await prisma.lawyerProfile.findMany({
      where: {
        specializations: { has: serviceCategory },
        isVerified: true,
        status: 'APPROVED'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        }
      },
      orderBy: [
        { rating: 'desc' }
      ],
      take: 10 // Match up to 10 lawyers (system will select top 3 quotes for user)
    });

    // Send notifications to matched lawyers
    if (matchedLawyers.length > 0) {
      const formattedLawyers = matchedLawyers.map(lp => ({
        id: lp.user.id,
        name: `${lp.user.firstName} ${lp.user.lastName}`,
        email: lp.user.email,
        phone: lp.user.phoneNumber || '',
        tier: lp.tier || 'LITE',
        specializations: lp.specializations
      }));

      // Send notifications asynchronously (don't wait)
      notifyMatchedLawyers({
        id: serviceRequest.id,
        serviceCategory: serviceRequest.serviceCategory,
        serviceTitle: serviceRequest.serviceTitle,
        description: serviceRequest.description,
        urgency: serviceRequest.urgency,
        createdAt: serviceRequest.createdAt,
        phoneNumber: serviceRequest.phoneNumber,
        email: serviceRequest.email
      } as any, formattedLawyers).catch(err => {
        console.error('Failed to send lawyer notifications:', err);
      });
    }

    // Track freebie usage if applicable
    if (isFreebie) {
      await analyticsService.trackFreebieUsage(userId, 'first_service_request', {
        serviceRequestId: serviceRequest.id,
        serviceCategory,
        savings: 500
      });
    }

    res.status(201).json({
      success: true,
      data: {
        ...serviceRequest,
        isFreebie,
        savings: isFreebie ? 500 : 0
      },
      matchedLawyers: matchedLawyers.length,
      message: `Service request created successfully. ${matchedLawyers.length} qualified lawyers notified. You will receive up to 3 quotes within 24-48 hours.`
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
                    specializations: true,
                    yearsOfExperience: true,
                    rating: true
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

    // Check if lawyer has paid connection fee (for lawyer viewing)
    let connectionFeePaid = false;
    let clientContact = null;

    if (req.user?.role === 'LAWYER') {
      const existingQuote = await prisma.lawyerQuote.findFirst({
        where: {
          serviceRequestId: id,
          lawyerId: userId,
          connectionFeePaid: true
        }
      });

      if (existingQuote) {
        connectionFeePaid = true;
        clientContact = {
          name: `${serviceRequest.user.firstName} ${serviceRequest.user.lastName}`,
          phone: serviceRequest.phoneNumber || serviceRequest.user.phoneNumber || 'Not provided',
          email: serviceRequest.email || serviceRequest.user.email
        };
      }
    }

    // Authorization check: only request creator or matched lawyers can view
    const hasQuote = serviceRequest.quotes.some(q => q.lawyerId === userId);
    const isOwner = serviceRequest.userId === userId;
    
    if (!isOwner && !hasQuote && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to view this request' });
    }

    // Get selected quote details if lawyer is selected
    let selectedQuote = null;
    if (serviceRequest.selectedLawyerId) {
      selectedQuote = await prisma.lawyerQuote.findFirst({
        where: {
          serviceRequestId: id,
          lawyerId: serviceRequest.selectedLawyerId,
          isSelected: true
        }
      });
    }

    // Get selected lawyer profile
    let selectedLawyerProfile = null;
    if (serviceRequest.selectedLawyer) {
      const lawyerProfile = await prisma.lawyerProfile.findUnique({
        where: { userId: serviceRequest.selectedLawyer.id },
        select: {
          rating: true,
          yearsOfExperience: true,
          specializations: true
        }
      });
      
      selectedLawyerProfile = {
        ...serviceRequest.selectedLawyer,
        lawyerProfile
      };
    }

    res.json({
      success: true,
      serviceRequest: {
        id: serviceRequest.id,
        serviceCategory: serviceRequest.serviceCategory,
        serviceTitle: serviceRequest.serviceTitle,
        description: serviceRequest.description,
        estimatedFee: serviceRequest.estimatedFee,
        tier: serviceRequest.tier,
        urgency: serviceRequest.urgency,
        status: serviceRequest.status,
        createdAt: serviceRequest.createdAt,
        completedAt: serviceRequest.completedAt,
        confirmedAt: serviceRequest.confirmedAt,
        rating: serviceRequest.rating,
        feedback: serviceRequest.feedback,
        selectedLawyer: selectedLawyerProfile,
        selectedQuote: selectedQuote ? {
          proposedFee: selectedQuote.proposedFee,
          proposedTimeline: selectedQuote.proposedTimeline,
          approach: selectedQuote.approach,
          offersMilestones: selectedQuote.offersMilestones,
          milestones: selectedQuote.milestones
        } : null,
        user: {
          firstName: isOwner || connectionFeePaid ? serviceRequest.user.firstName : 'Client',
          lastName: isOwner || connectionFeePaid ? serviceRequest.user.lastName : ''
        }
      },
      connectionFeePaid,
      clientContact
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
      proposedFee,
      proposedTimeline,
      approach,
      offersMilestones,
      milestones
    } = req.body;

    // Validate required fields
    if (!proposedFee || !proposedTimeline || !approach) {
      return res.status(400).json({ 
        error: 'proposedFee, proposedTimeline, and approach are required' 
      });
    }

    // Get service request
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    if (serviceRequest.status !== 'PENDING' && serviceRequest.status !== 'QUOTES_RECEIVED') {
      return res.status(400).json({ error: 'This request is no longer accepting quotes' });
    }

    // Get lawyer profile (verify lawyer is verified)
    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { userId },
      select: { 
        tier: true,
        isVerified: true,
        specializations: true,
        rating: true,
        yearsOfExperience: true
      }
    });

    if (!lawyerProfile) {
      return res.status(403).json({ error: 'Lawyer profile not found' });
    }

    if (!lawyerProfile.isVerified) {
      return res.status(403).json({ 
        error: 'Only verified lawyers can submit quotes',
        verificationRequired: true
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

    // Create quote (no connection fee required - free to submit)
    const quote = await prisma.lawyerQuote.create({
      data: {
        serviceRequestId: id,
        lawyerId: userId!,
        connectionFeePaid: true, // Always true since we removed the fee
        connectionFeeAmount: 0, // No fee required
        connectionFeeTxId: null,
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
                specializations: true,
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

    // Get client contact to return to lawyer
    const clientContact = await prisma.user.findUnique({
      where: { id: serviceRequest.userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true
      }
    });

    // TODO: Notify client about new quote

    res.status(201).json({
      success: true,
      data: quote,
      message: 'Quote submitted successfully. Client will review and may select you for this case.'
    });
  } catch (error) {
    console.error('Error submitting quote:', error);
    res.status(500).json({ error: 'Failed to submit quote' });
  }
};

/**
 * Get all quotes for a service request (client view)
 * GET /api/service-requests/:id/quotes
 */
export const getQuotesForRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Get service request
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        serviceCategory: true,
        serviceTitle: true,
        description: true,
        estimatedFee: true,
        tier: true,
        status: true,
        createdAt: true
      }
    });

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    // Only request owner can view quotes
    if (serviceRequest.userId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to view quotes' });
    }

    // Get all quotes with lawyer details
    const quotes = await prisma.lawyerQuote.findMany({
      where: { serviceRequestId: id },
      include: {
        lawyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImageUrl: true,
            lawyerProfile: {
              select: {
                specializations: true,
                yearsOfExperience: true,
                rating: true,
                reviewCount: true,
                licenseNumber: true
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    res.json({
      success: true,
      serviceRequest,
      quotes
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
};

/**
 * Select a lawyer for a service request
 * POST /api/service-requests/:id/select
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

    // Get selected lawyer details
    const selectedLawyer = await prisma.user.findUnique({
      where: { id: selectedQuote.lawyerId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true
      }
    });

    // TODO: Notify selected lawyer and client

    res.json({
      success: true,
      message: 'Lawyer selected successfully',
      selectedLawyer: {
        name: `${selectedLawyer?.firstName} ${selectedLawyer?.lastName}`,
        phone: selectedLawyer?.phoneNumber || 'Not provided',
        email: selectedLawyer?.email || 'Not provided',
        proposedFee: selectedQuote.proposedFee,
        proposedTimeline: selectedQuote.proposedTimeline
      }
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

    // Update lawyer's rating and review count
    if (serviceRequest.selectedLawyerId) {
      const lawyerProfile = await prisma.lawyerProfile.findUnique({
        where: { userId: serviceRequest.selectedLawyerId },
        select: { rating: true, reviewCount: true }
      });

      if (lawyerProfile) {
        const currentRating = lawyerProfile.rating || 0;
        const currentReviewCount = lawyerProfile.reviewCount || 0;
        const newReviewCount = currentReviewCount + 1;
        const newRating = ((currentRating * currentReviewCount) + rating) / newReviewCount;

        await prisma.lawyerProfile.update({
          where: { userId: serviceRequest.selectedLawyerId },
          data: {
            rating: newRating,
            reviewCount: newReviewCount
          }
        });
      }
    }

    res.json({
      success: true,
      message: 'Service confirmed and rated successfully. Thank you for your feedback!'
    });
  } catch (error) {
    console.error('Error confirming completion:', error);
    res.status(500).json({ error: 'Failed to confirm completion' });
  }
};
