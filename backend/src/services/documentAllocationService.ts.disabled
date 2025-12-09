import { PrismaClient, LawyerTier, DocumentStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface LawyerScore {
  lawyerId: string;
  score: number;
  breakdown: {
    specialtyMatch: number;
    availability: number;
    performance: number;
    tierPriority: number;
    geographicMatch: number;
    workloadBalance: number;
  };
  lawyer: any;
}

/**
 * Smart allocation algorithm for document certifications
 * Scores lawyers based on multiple factors and assigns to best match
 */
export const allocateCertificationToLawyer = async (
  documentPurchaseId: string,
  documentCategory: string,
  clientLocation?: string
): Promise<string | null> => {
  const documentPurchase = await prisma.documentPurchase.findUnique({
    where: { id: documentPurchaseId },
    include: {
      template: true,
      user: true,
    },
  });

  if (!documentPurchase) {
    throw new Error('Document purchase not found');
  }

  // Get all eligible lawyers (accepting certifications, not at limits)
  const eligibleLawyers = await prisma.lawyerProfile.findMany({
    where: {
      acceptingCertifications: true,
      isVerified: true,
      status: 'ACTIVE',
      tier: {
        in: [LawyerTier.LITE, LawyerTier.PRO], // FREE tier cannot certify
      },
    },
    include: {
      user: true,
      subscriptions: {
        where: { status: 'ACTIVE' },
      },
    },
  });

  if (eligibleLawyers.length === 0) {
    console.log('No eligible lawyers available for certification');
    return null;
  }

  // Score each lawyer
  const scoredLawyers: LawyerScore[] = [];

  for (const lawyer of eligibleLawyers) {
    // Check if lawyer has exceeded their certification limits
    if (lawyer.tier === LawyerTier.LITE && lawyer.monthlyCertifications >= 5) {
      continue; // Skip - at monthly limit
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCertifications = await prisma.documentPurchase.count({
      where: {
        certifiedBy: lawyer.userId,
        certifiedAt: { gte: today },
      },
    });

    if (todayCertifications >= lawyer.maxCertificationsPerDay) {
      continue; // Skip - at daily limit
    }

    // Calculate score breakdown
    const specialtyMatch = calculateSpecialtyMatch(lawyer, documentCategory);
    const availability = calculateAvailability(lawyer);
    const performance = calculatePerformance(lawyer);
    const tierPriority = calculateTierPriority(lawyer);
    const geographicMatch = calculateGeographicMatch(lawyer, clientLocation);
    const workloadBalance = calculateWorkloadBalance(lawyer, eligibleLawyers.length);

    // Weighted total score (out of 100)
    const totalScore =
      specialtyMatch * 0.4 +
      availability * 0.25 +
      performance * 0.2 +
      tierPriority * 0.1 +
      geographicMatch * 0.05;

    // Apply workload balance multiplier
    const finalScore = totalScore * workloadBalance;

    scoredLawyers.push({
      lawyerId: lawyer.userId,
      score: finalScore,
      breakdown: {
        specialtyMatch,
        availability,
        performance,
        tierPriority,
        geographicMatch,
        workloadBalance,
      },
      lawyer,
    });
  }

  if (scoredLawyers.length === 0) {
    console.log('All eligible lawyers are at capacity');
    return null;
  }

  // Sort by score (highest first)
  scoredLawyers.sort((a, b) => b.score - a.score);

  // PRO tier early access: Notify PRO lawyers 5 minutes before others
  const proLawyers = scoredLawyers.filter(s => s.lawyer.tier === LawyerTier.PRO);
  const liteLawyers = scoredLawyers.filter(s => s.lawyer.tier === LawyerTier.LITE);

  // Notify top 5 PRO lawyers first
  const topProLawyers = proLawyers.slice(0, 5);
  
  if (topProLawyers.length > 0) {
    console.log(`Notifying ${topProLawyers.length} PRO lawyers first (early access)`);
    await notifyLawyers(topProLawyers, documentPurchaseId);
    
    // Update document status to PENDING_REVIEW
    await prisma.documentPurchase.update({
      where: { id: documentPurchaseId },
      data: { status: DocumentStatus.PENDING_REVIEW },
    });

    // Return null for now - lawyer will accept from queue
    return null;
  }

  // If no PRO lawyers available, notify LITE lawyers
  const topLiteLawyers = liteLawyers.slice(0, 5);
  
  if (topLiteLawyers.length > 0) {
    console.log(`Notifying ${topLiteLawyers.length} LITE lawyers`);
    await notifyLawyers(topLiteLawyers, documentPurchaseId);
    
    await prisma.documentPurchase.update({
      where: { id: documentPurchaseId },
      data: { status: DocumentStatus.PENDING_REVIEW },
    });

    return null;
  }

  return null;
};

/**
 * Calculate specialty match score (0-100)
 */
function calculateSpecialtyMatch(lawyer: any, documentCategory: string): number {
  const specializations = lawyer.specializations || [];
  
  // Category to specialization mapping
  const categorySpecialtyMap: { [key: string]: string[] } = {
    EMPLOYMENT: ['Employment Law', 'Labor Law', 'HR Law'],
    PROPERTY: ['Property Law', 'Real Estate Law', 'Land Law', 'Conveyancing'],
    FAMILY: ['Family Law', 'Matrimonial Law', 'Succession'],
    CORPORATE: ['Corporate Law', 'Commercial Law', 'Company Law'],
    INTELLECTUAL_PROPERTY: ['IP Law', 'Trademark', 'Copyright', 'Patent'],
    LITIGATION: ['Civil Litigation', 'Commercial Litigation', 'Dispute Resolution'],
  };

  const relevantSpecialties = categorySpecialtyMap[documentCategory] || [];
  
  // Check for exact matches
  const exactMatches = specializations.filter((s: string) =>
    relevantSpecialties.some(rs => s.toLowerCase().includes(rs.toLowerCase()))
  );

  if (exactMatches.length > 0) {
    return 100; // Perfect match
  }

  // Partial match based on general practice areas
  const generalMatch = specializations.some((s: string) =>
    ['General Practice', 'All Areas'].includes(s)
  );

  return generalMatch ? 50 : 20; // Some experience vs minimal
}

/**
 * Calculate availability score (0-100)
 */
function calculateAvailability(lawyer: any): number {
  const { monthlyCertifications = 0, maxCertificationsPerMonth } = lawyer;

  // Calculate capacity utilization
  const utilizationRate = monthlyCertifications / maxCertificationsPerMonth;

  // Higher score for lower utilization (more available)
  if (utilizationRate < 0.25) return 100; // Less than 25% utilized
  if (utilizationRate < 0.50) return 80;
  if (utilizationRate < 0.75) return 60;
  return 40; // Over 75% utilized but still available
}

/**
 * Calculate performance score (0-100)
 */
function calculatePerformance(lawyer: any): number {
  const {
    rating = 0,
    certificationCompletionRate = 0,
    avgCertificationTimeHours = 0,
  } = lawyer;

  let score = 0;

  // Rating contribution (0-40 points)
  if (rating >= 4.8) score += 40;
  else if (rating >= 4.5) score += 30;
  else if (rating >= 4.0) score += 20;
  else if (rating >= 3.5) score += 10;

  // Completion rate contribution (0-40 points)
  if (certificationCompletionRate >= 0.95) score += 40;
  else if (certificationCompletionRate >= 0.90) score += 30;
  else if (certificationCompletionRate >= 0.85) score += 20;
  else if (certificationCompletionRate >= 0.80) score += 10;

  // Speed contribution (0-20 points) - faster is better
  if (avgCertificationTimeHours > 0) {
    if (avgCertificationTimeHours <= 2) score += 20; // Very fast
    else if (avgCertificationTimeHours <= 6) score += 15;
    else if (avgCertificationTimeHours <= 12) score += 10;
    else if (avgCertificationTimeHours <= 24) score += 5;
  }

  return score;
}

/**
 * Calculate tier priority score (0-100)
 */
function calculateTierPriority(lawyer: any): number {
  if (lawyer.tier === LawyerTier.PRO) return 100;
  if (lawyer.tier === LawyerTier.LITE) return 70;
  return 0; // FREE tier shouldn't be here
}

/**
 * Calculate geographic match score (0-100)
 */
function calculateGeographicMatch(lawyer: any, clientLocation?: string): number {
  if (!clientLocation || !lawyer.location) {
    return 50; // Neutral if location unknown
  }

  const lawyerLocation = lawyer.location.toLowerCase();
  const client = clientLocation.toLowerCase();

  // Exact match
  if (lawyerLocation === client) return 100;

  // Same county (rough matching)
  if (lawyerLocation.includes(client) || client.includes(lawyerLocation)) {
    return 80;
  }

  // Nairobi lawyers can serve nationwide
  if (lawyerLocation.includes('nairobi')) return 60;

  return 30; // Different locations
}

/**
 * Calculate workload balance multiplier (0.8-1.2)
 */
function calculateWorkloadBalance(lawyer: any, totalEligible: number): number {
  const { certificationCount = 0 } = lawyer;

  // Favor lawyers with fewer total certifications to distribute work
  if (certificationCount < 10) return 1.2; // New lawyers get boost
  if (certificationCount < 50) return 1.1;
  if (certificationCount < 100) return 1.0;
  return 0.9; // Very experienced lawyers - still good but let others grow
}

/**
 * Notify lawyers about available certification
 */
async function notifyLawyers(scoredLawyers: LawyerScore[], documentPurchaseId: string) {
  for (const scored of scoredLawyers) {
    await prisma.notification.create({
      data: {
        userId: scored.lawyerId,
        type: 'CERTIFICATION_AVAILABLE',
        title: 'New Certification Available',
        message: `A new document certification request matches your expertise (Match Score: ${Math.round(scored.score)}%). Review now.`,
        isRead: false,
      },
    });

    // TODO: Send email/SMS notification
    console.log(`Notified lawyer ${scored.lawyerId} - Score: ${scored.score.toFixed(2)}`);
  }
}

/**
 * Lawyer accepts a certification from the queue
 */
export const acceptCertification = async (
  documentPurchaseId: string,
  lawyerId: string
): Promise<boolean> => {
  const documentPurchase = await prisma.documentPurchase.findUnique({
    where: { id: documentPurchaseId },
  });

  if (!documentPurchase) {
    throw new Error('Document purchase not found');
  }

  if (documentPurchase.status !== DocumentStatus.PENDING_REVIEW) {
    throw new Error('Document is not available for review');
  }

  if (documentPurchase.certifiedBy) {
    throw new Error('Document has already been assigned');
  }

  // Check lawyer's capacity
  const lawyer = await prisma.lawyerProfile.findUnique({
    where: { userId: lawyerId },
  });

  if (!lawyer) {
    throw new Error('Lawyer not found');
  }

  if (lawyer.tier === LawyerTier.LITE && lawyer.monthlyCertifications >= 5) {
    throw new Error('Monthly certification limit reached');
  }

  // Assign to lawyer
  await prisma.documentPurchase.update({
    where: { id: documentPurchaseId },
    data: {
      certifiedBy: lawyerId,
      status: DocumentStatus.UNDER_REVIEW,
    },
  });

  // Increment counter
  await prisma.lawyerProfile.update({
    where: { userId: lawyerId },
    data: {
      monthlyCertifications: { increment: 1 },
      certificationCount: { increment: 1 },
    },
  });

  return true;
};

/**
 * Get available certifications for a lawyer (queue view)
 */
export const getAvailableCertifications = async (lawyerId: string) => {
  const lawyer = await prisma.lawyerProfile.findUnique({
    where: { userId: lawyerId },
  });

  if (!lawyer) {
    throw new Error('Lawyer not found');
  }

  // Get pending certifications
  const pendingCertifications = await prisma.documentPurchase.findMany({
    where: {
      status: DocumentStatus.PENDING_REVIEW,
      requiresCertification: true,
      certifiedBy: null,
    },
    include: {
      template: true,
      user: true,
    },
    orderBy: { purchasedAt: 'desc' },
    take: 20,
  });

  // Score each certification for this lawyer
  const scoredCertifications = [];

  for (const cert of pendingCertifications) {
    const category = cert.template.category;
    const clientLocation = lawyer.location; // Would come from user profile

    const specialtyMatch = calculateSpecialtyMatch(lawyer, category);
    const score = specialtyMatch * 0.6 + 40; // Simplified scoring for display

    scoredCertifications.push({
      ...cert,
      matchScore: Math.round(score),
      estimatedFee: 2500, // Would calculate based on complexity
    });
  }

  // Sort by match score
  scoredCertifications.sort((a, b) => b.matchScore - a.matchScore);

  return scoredCertifications;
};

export default {
  allocateCertificationToLawyer,
  acceptCertification,
  getAvailableCertifications,
};
