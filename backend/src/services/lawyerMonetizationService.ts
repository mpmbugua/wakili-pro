import { PrismaClient } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function upgradeTier(userId: string, tier: 'LITE' | 'PRO') {
  // TODO: Add payment validation and business logic
  return prisma.lawyerProfile.update({
    where: { userId },
    data: { tier },
  });
}

export async function featureProfile(userId: string, durationDays: number) {
  // TODO: Add payment validation and business logic
  const featuredUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  return prisma.lawyerProfile.update({
    where: { userId },
    data: { isFeatured: true, featuredUntil },
  });
}

// publishArticle removed: article model does not exist in schema.

export async function payForMonetization(userId: string, { type, targetId, amount }: { type: string; targetId?: string; amount: number }) {
  // TODO: Integrate with payment provider
  return prisma.payment.create({
    data: {
      userId,
      amount,
      status: 'COMPLETED',
      method: 'MANUAL',
    },
  });
}
