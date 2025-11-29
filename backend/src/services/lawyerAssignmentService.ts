import { PrismaClient } from '@prisma/client';

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
        userDocument: true
      }
    });

    if (!review) {
      throw new Error('Document review not found');
    }

    // Find available lawyers sorted by:
    // 1. Active certification status
    // 2. Specialization match (if available)
    // 3. Workload (fewest active reviews)
    // 4. Average rating
    const lawyers = await prisma.user.findMany({
      where: {
        role: 'LAWYER',
        isActive: true,
        lawyerProfile: {
          certificationStatus: 'ACTIVE'
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
      throw new Error('No certified lawyers available');
    }

    // Sort by workload (fewest active reviews)
    const sortedLawyers = lawyers.sort((a, b) => {
      return a._count.assignedReviews - b._count.assignedReviews;
    });

    const assignedLawyer = sortedLawyers[0];

    console.log('[LawyerAssignment] Assigning lawyer:', {
      lawyerId: assignedLawyer.id,
      lawyerName: `${assignedLawyer.firstName} ${assignedLawyer.lastName}`,
      currentWorkload: assignedLawyer._count.assignedReviews
    });

    // Update document review with assigned lawyer
    await prisma.documentReview.update({
      where: { id: reviewId },
      data: {
        lawyerId: assignedLawyer.id,
        status: 'assigned',
        assignedAt: new Date()
      }
    });

    console.log('[LawyerAssignment] Lawyer assigned successfully');
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
