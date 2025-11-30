import { PrismaClient } from '@prisma/client';
import { sendLawyerAssignedEmail, sendLawyerAssignedSMS, notifyLawyerOfAssignment } from './documentNotificationService';

const prisma = new PrismaClient();

/**
 * Assign lawyer to document review based on specialization and availability
 */
export const assignLawyerToDocumentReview = async (reviewId: string): Promise<void> => {
  try {
    console.log('[LawyerAssignment] Assigning lawyer to review:', reviewId);

    const review = await prisma.documentReview.findUnique({
      where: { id: reviewId },
      include: {
        userDocument: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true
          }
        }
      }
    });

    if (!review) {
      throw new Error('Document review not found');
    }

    // Find available lawyers sorted by:
    // 1. Verified status (isVerified: true)
    // 2. Tier limits (FREE: 2 per service, LITE: 5, PRO: unlimited)
    // 3. Workload (fewest active reviews)
    // 4. Average rating
    const lawyers = await prisma.user.findMany({
      where: {
        role: 'LAWYER',
        isActive: true,
        lawyerProfile: {
          isVerified: true
        }
      },
      include: {
        lawyerProfile: true,
        _count: {
          select: {
            assignedReviews: {
              where: {
                status: {
                  in: ['pending_lawyer_assignment', 'assigned', 'in_progress']
                }
              }
            },
            completedReviews: {
              where: {
                status: 'completed'
              }
            }
          }
        }
      },
      orderBy: [
        {
          lawyerProfile: {
            avgRating: 'desc'
          }
        }
      ]
    });

    if (lawyers.length === 0) {
      console.error('[LawyerAssignment] No available lawyers found');
      throw new Error('No verified lawyers available');
    }

    // Filter lawyers based on tier limits (strict 2-per-service for FREE tier)
    const eligibleLawyers = lawyers.filter(lawyer => {
      const tier = lawyer.lawyerProfile?.tier || 'FREE';
      const activeWorkload = lawyer._count.assignedReviews;
      const completedCount = lawyer._count.completedReviews;
      
      // Tier limits - FREE tier can only do 2 certifications total
      const tierLimits = {
        FREE: { certifications: 2 },
        LITE: { certifications: 5 },
        PRO: { certifications: 999 }
      };
      
      const limit = tierLimits[tier as keyof typeof tierLimits]?.certifications || 2;
      
      // For FREE tier: strict limit - only 2 certifications total (active + completed)
      if (tier === 'FREE') {
        const totalCertifications = activeWorkload + completedCount;
        if (totalCertifications >= limit) {
          console.log(`[LawyerAssignment] FREE lawyer ${lawyer.firstName} at limit: ${totalCertifications}/${limit} certifications used`);
          return false;
        }
      }
      
      // For LITE/PRO: check active workload only
      if (activeWorkload >= limit) {
        console.log(`[LawyerAssignment] Lawyer ${lawyer.firstName} at capacity: ${activeWorkload}/${limit} (${tier})`);
        return false;
      }
      
      return true;
    });

    if (eligibleLawyers.length === 0) {
      console.error('[LawyerAssignment] No eligible lawyers within tier limits');
      throw new Error('All lawyers are at capacity. Our team has been notified to onboard more lawyers.');
    }

    // Sort by workload (fewest active reviews)
    const sortedLawyers = eligibleLawyers.sort((a, b) => {
      return a._count.assignedReviews - b._count.assignedReviews;
    });

    const assignedLawyer = sortedLawyers[0];
    const tier = assignedLawyer.lawyerProfile?.tier || 'FREE';
    const totalCerts = assignedLawyer._count.assignedReviews + assignedLawyer._count.completedReviews;

    console.log('[LawyerAssignment] Assigning lawyer:', {
      lawyerId: assignedLawyer.id,
      lawyerName: `${assignedLawyer.firstName} ${assignedLawyer.lastName}`,
      tier,
      activeWorkload: assignedLawyer._count.assignedReviews,
      completedReviews: assignedLawyer._count.completedReviews,
      totalCertifications: totalCerts,
      remainingSlots: tier === 'FREE' ? (2 - totalCerts) : 'unlimited'
    });

    // Update document review with assigned lawyer
    const updatedReview = await prisma.documentReview.update({
      where: { id: reviewId },
      data: {
        lawyerId: assignedLawyer.id,
        status: 'assigned',
        assignedAt: new Date()
      }
    });

    console.log('[LawyerAssignment] Lawyer assigned successfully');

    // Send SMS notification to user
    if (review.user?.phoneNumber) {
      const userName = `${review.user.firstName} ${review.user.lastName}`;
      const lawyerName = `${assignedLawyer.firstName} ${assignedLawyer.lastName}`;
      const documentTitle = review.userDocument?.title || 'your document';
      
      sendLawyerAssignedSMS(
        review.user.phoneNumber,
        userName,
        lawyerName,
        documentTitle
      ).catch(err => console.error('[LawyerAssignment] SMS notification error:', err));
    }

    // Send email notification to user
    if (review.user?.email) {
      const userName = `${review.user.firstName} ${review.user.lastName}`;
      const lawyerName = `${assignedLawyer.firstName} ${assignedLawyer.lastName}`;
      const documentTitle = review.userDocument?.title || 'your document';
      
      sendLawyerAssignedEmail(
        review.user.email,
        userName,
        lawyerName,
        documentTitle,
        updatedReview.estimatedDeliveryDate || new Date(Date.now() + 24 * 60 * 60 * 1000)
      ).catch(err => console.error('[LawyerAssignment] Email notification error:', err));
    }

    // Notify lawyer of assignment
    if (assignedLawyer.email) {
      const lawyerName = `${assignedLawyer.firstName} ${assignedLawyer.lastName}`;
      const documentTitle = review.userDocument?.title || 'Document';
      
      notifyLawyerOfAssignment(
        assignedLawyer.email,
        assignedLawyer.phoneNumber || '',
        lawyerName,
        documentTitle,
        reviewId,
        updatedReview.urgency || 'STANDARD',
        updatedReview.deadline || new Date(Date.now() + 24 * 60 * 60 * 1000)
      ).catch(err => console.error('[LawyerAssignment] Lawyer notification error:', err));
    }
  } catch (error) {
    console.error('[LawyerAssignment] Error assigning lawyer:', error);
    
    // Update review status to indicate assignment failed
    await prisma.documentReview.update({
      where: { id: reviewId },
      data: {
        status: 'pending_lawyer_assignment',
        aiReviewResults: {
          error: 'Failed to assign lawyer. Support has been notified.'
        } as any
      }
    });
  }
};

/**
 * Get lawyer's current workload statistics
 */
export const getLawyerWorkload = async (lawyerId: string) => {
  const activeReviews = await prisma.documentReview.count({
    where: {
      lawyerId,
      status: {
        in: ['assigned', 'in_progress']
      }
    }
  });

  const completedToday = await prisma.documentReview.count({
    where: {
      lawyerId,
      status: 'completed',
      completedAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });

  return {
    activeReviews,
    completedToday
  };
};
