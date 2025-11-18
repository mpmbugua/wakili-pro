// Mock/in-memory service implementations for engagement and retention features

// Favorites
export async function listFavorites(userId: string) {
  return [{ id: 'fav1', userId, targetType: 'Document', targetId: 'doc1', createdAt: new Date() }];
}
export interface FavoriteData {
  targetType: string;
  targetId: string;
}
export async function addFavorite(userId: string, data: FavoriteData) {
  return { id: 'fav2', userId, ...data, createdAt: new Date() };
}
export async function removeFavorite(userId: string, id: string) {
  return { success: true, id };
}

// Referrals
export async function listReferrals(userId: string) {
  return [{ id: 'ref1', referrerId: userId, refereeId: 'user2', reward: 100, createdAt: new Date() }];
}
export interface ReferralData {
  refereeId: string;
}
export async function createReferral(userId: string, data: ReferralData) {
  return { id: 'ref2', referrerId: userId, ...data, reward: 100, createdAt: new Date() };
}

// Loyalty Points
export async function getLoyaltyPoints(userId: string) {
  return { userId, points: 250 };
}

// Notifications
export async function listNotifications(userId: string) {
  return [{ id: 'notif1', userId, type: 'reminder', message: 'Your subscription is expiring soon!', read: false, createdAt: new Date() }];
}
export async function markNotificationRead(userId: string, id: string) {
  return { success: true, id };
}

// Badges
export async function listBadges(userId: string) {
  return [{ id: 'badge1', userId, type: 'FirstPurchase', awardedAt: new Date() }];
}

// Onboarding Progress
export async function getOnboardingProgress(userId: string) {
  return { userId, step: 'profile', completed: false, updatedAt: new Date() };
}
export interface OnboardingProgressData {
  step: string;
  completed: boolean;
}
export async function updateOnboardingProgress(userId: string, data: OnboardingProgressData) {
  return { userId, ...data, updatedAt: new Date() };
}

// AI Chat History
export async function getAIChatHistory(userId: string) {
  return [{ id: 'chat1', userId, messages: [{ role: 'user', content: 'What is a contract?' }, { role: 'ai', content: 'A contract is ...' }], createdAt: new Date() }];
}
export interface AIChatMessageData {
  messages: { role: string; content: string }[];
}
export async function addAIChatMessage(userId: string, data: AIChatMessageData) {
  return { id: 'chat2', userId, ...data, createdAt: new Date() };
}
