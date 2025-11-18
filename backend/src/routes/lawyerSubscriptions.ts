import { Router } from 'express';

const router = Router();

// Mock subscription plans
const subscriptionPlans = [
  { plan: 'MONTHLY', priceKES: 3499, label: 'Monthly', duration: '1 month' },
  { plan: 'YEARLY', priceKES: 39999, label: 'Yearly', duration: '12 months' },
];

// In-memory mock subscriptions (keyed by userId)
const userSubscriptions: Record<string, any> = {};

// 1. Get available subscription plans
router.get('/subscriptions/plans', (req, res) => {
  res.json({
    success: true,
    plans: subscriptionPlans
  });
});

// 2. Get current user's subscription status (with plan details)
router.get('/subscriptions/status', (req, res) => {
  // In real app, get userId from auth middleware
  const userId = req.query.userId as string || 'mock-user';
  const sub = userSubscriptions[userId] || null;
  let planInfo = null;
  if (sub) {
    planInfo = subscriptionPlans.find(p => p.plan === sub.plan) || null;
  }
  res.json({
    success: true,
    subscription: sub,
    plan: planInfo,
    isActive: !!(sub && sub.status === 'ACTIVE'),
    isExpired: !!(sub && sub.endDate && new Date(sub.endDate) < new Date()),
    isCancelled: !!(sub && sub.status === 'CANCELLED'),
    expiresAt: sub ? sub.endDate : null,
    cancelledAt: sub ? sub.cancelledAt || null : null
  });
});
// 2b. Get subscription history (mocked)
router.get('/subscriptions/history', (req, res) => {
  // In a real app, fetch from DB. Here, return all user's subscriptions (just one in mock)
  const userId = req.query.userId as string || 'mock-user';
  const sub = userSubscriptions[userId] ? [userSubscriptions[userId]] : [];
  res.json({
    success: true,
    history: sub
  });
});
// 3b. Renew subscription (if expired or cancelled)
router.post('/subscriptions/renew', (req, res) => {
  const { userId = 'mock-user', plan } = req.body;
  const planInfo = subscriptionPlans.find(p => p.plan === plan);
  if (!planInfo) {
    return res.status(400).json({ success: false, error: 'Invalid plan selected.' });
  }
  const existing = userSubscriptions[userId];
  if (existing && existing.status === 'ACTIVE') {
    return res.status(409).json({
      success: false,
      error: 'You already have an active subscription.',
      subscription: existing
    });
  }
  // Simulate payment failure (10% chance)
  if (Math.random() < 0.1) {
    return res.status(502).json({
      success: false,
      error: 'Payment processor unavailable. Please try again.'
    });
  }
  // Renew: new start/end dates
  const now = new Date();
  const endDate = plan === 'MONTHLY'
    ? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
    : new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  userSubscriptions[userId] = {
    plan,
    status: 'ACTIVE',
    priceKES: planInfo.priceKES,
    startDate: now,
    endDate,
    paymentInfo: { method: 'mock', status: 'paid', paidAt: now },
    renewed: true
  };
  return res.json({
    success: true,
    subscription: userSubscriptions[userId],
    message: 'Subscription renewed successfully.'
  });
});

// 3. Subscribe to a plan (mock payment, all scenarios)
router.post('/subscriptions/subscribe', (req, res) => {
  const { userId = 'mock-user', plan } = req.body;
  const planInfo = subscriptionPlans.find(p => p.plan === plan);
  // 1. Invalid plan
  if (!planInfo) {
    return res.status(400).json({ success: false, error: 'Invalid plan selected.' });
  }
  // 2. Already active subscription
  const existing = userSubscriptions[userId];
  if (existing && existing.status === 'ACTIVE') {
    return res.status(409).json({
      success: false,
      error: 'You already have an active subscription.',
      subscription: existing
    });
  }
  // 3. Simulate payment failure (10% chance)
  if (Math.random() < 0.1) {
    return res.status(502).json({
      success: false,
      error: 'Payment processor unavailable. Please try again.'
    });
  }
  // 4. Simulate payment success
  const now = new Date();
  const endDate = plan === 'MONTHLY'
    ? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
    : new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  userSubscriptions[userId] = {
    plan,
    status: 'ACTIVE',
    priceKES: planInfo.priceKES,
    startDate: now,
    endDate,
    paymentInfo: { method: 'mock', status: 'paid', paidAt: now },
  };
  return res.json({
    success: true,
    subscription: userSubscriptions[userId],
    message: 'Subscription activated successfully.'
  });
});

// 4. Cancel subscription (handle all scenarios)
router.post('/subscriptions/cancel', (req, res) => {
  const { userId = 'mock-user' } = req.body;
  const sub = userSubscriptions[userId];
  if (!sub) {
    return res.status(404).json({ success: false, error: 'No subscription found.' });
  }
  if (sub.status !== 'ACTIVE') {
    return res.status(409).json({
      success: false,
      error: 'No active subscription to cancel.',
      subscription: sub
    });
  }
  sub.status = 'CANCELLED';
  sub.cancelledAt = new Date();
  return res.json({
    success: true,
    subscription: sub,
    message: 'Subscription cancelled.'
  });
});

export default router;
