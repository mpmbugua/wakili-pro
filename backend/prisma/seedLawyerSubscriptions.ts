import { PrismaClient, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Since SubscriptionPlan is an enum, we cannot seed it directly in the DB.
 * Instead, we document the available plans and their prices here for the app to read.
 * If you want to store plan definitions in the DB, create a Plan table and seed it here.
 */
const PLAN_DEFINITIONS = [
  {
    plan: SubscriptionPlan.MONTHLY,
    label: 'Monthly',
    priceKES: 3499,
    durationMonths: 1,
  },
  {
    plan: SubscriptionPlan.YEARLY,
    label: 'Yearly',
    priceKES: 39999,
    durationMonths: 12,
  },
];

async function main() {
  // Example: Seed a test user with both plans for demo/testing
  const userId = 'seed-user';
  const now = new Date();

  // Seed monthly subscription
  await prisma.lawyerSubscription.upsert({
    where: { id: 'seed-monthly-plan' },
    update: {},
    create: {
      id: 'seed-monthly-plan',
      userId,
      plan: SubscriptionPlan.MONTHLY,
      status: SubscriptionStatus.ACTIVE,
      priceKES: 3499,
      startDate: now,
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
      paymentInfo: { method: 'seed', status: 'paid' },
    },
  });

  // Seed yearly subscription
  await prisma.lawyerSubscription.upsert({
    where: { id: 'seed-yearly-plan' },
    update: {},
    create: {
      id: 'seed-yearly-plan',
      userId,
      plan: SubscriptionPlan.YEARLY,
      status: SubscriptionStatus.ACTIVE,
      priceKES: 39999,
      startDate: now,
      endDate: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
      paymentInfo: { method: 'seed', status: 'paid' },
    },
  });

  console.log('Seeded lawyer subscription plans:', PLAN_DEFINITIONS);
}

main()
  .then(() => {
    console.log('✅ seedLawyerSubscriptions.ts completed successfully.');
  })
  .catch((e) => {
    console.error('❌ seedLawyerSubscriptions.ts failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
