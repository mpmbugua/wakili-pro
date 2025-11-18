// Mock/in-memory implementations for marketplace backend enhancements

// Advanced filtering/search
export async function advancedSearchTemplates(query: Record<string, unknown>) {
  // Return mock filtered templates
  return { templates: [], total: 0 };
}

// Document ratings/reviews
export interface ReviewData {
  rating: number;
  comment: string;
}
export async function addReview(documentId: string, userId: string, data: ReviewData) {
  // Add review to in-memory store
  return { id: 'mock-review', ...data, userId, documentId, createdAt: new Date() };
}
export async function listReviews(documentId: string) {
  // Return mock reviews
  return [{ id: 'mock-review', userId: 'user1', documentId, rating: 5, comment: 'Great!', createdAt: new Date() }];
}

// Popularity analytics
export async function getAnalytics(documentId: string) {
  // Return mock analytics
  return { documentId, views: 123, purchases: 45, trendingScore: 7.8 };
}

// Real payment integration (stub)
export interface PurchaseData {
  documentId: string;
  paymentMethod: string;
}
export async function purchaseDocument(userId: string, data: PurchaseData) {
  // Return mock purchase
  return { id: 'mock-purchase', userId, ...data, status: 'PAID', createdAt: new Date() };
}

// Purchase limits
export async function getPurchaseLimits(userId: string) {
  // Return mock limits
  return [{ documentId: 'doc1', limit: 5, used: 2, period: 'month', resetAt: new Date() }];
}
export interface PurchaseLimitData {
  documentId: string;
  limit: number;
  period: string;
}
export async function setPurchaseLimit(userId: string, data: PurchaseLimitData) {
  // Set mock limit
  return { ...data, userId };
}

// Audit logging
export async function listAuditLogs(userId: string) {
  // Return mock logs
  return [{ id: 'log1', userId, action: 'PURCHASE', targetType: 'Document', targetId: 'doc1', createdAt: new Date() }];
}

// Document versioning
export async function listVersions(documentId: string) {
  // Return mock versions
  return [{ id: 'ver1', documentId, version: 1, content: {}, isActive: true, createdAt: new Date() }];
}
export async function addVersion(documentId: string, data: any) {
  // Add mock version
  return { id: 'ver2', documentId, ...data, createdAt: new Date(), isActive: true };
}
