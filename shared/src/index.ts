// Export all types
export * from './types/auth';
export * from './types/user';
export * from './types/marketplace';
export * from './types/case';
export * from './types/ai';

// Export schemas under namespaces to avoid conflicts
export * as AuthSchemas from './schemas/auth';
export * as UserSchemas from './schemas/user';
export * as MarketplaceSchemas from './schemas/marketplace';
export * as CaseSchemas from './schemas/case';
export * as AISchemas from './schemas/ai';