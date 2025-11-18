
// Force TypeScript to emit this file at runtime
export const __types_runtime_marker = true;

// User & Roles
import type { UserRole } from './user';
export type { UserRole } from './user';
export type { VerificationStatus, SubscriptionTier, SubscriptionStatus, BillingCycle, UserProfile, LawyerProfile, LegalSpecialization, LocationData, WorkingHours, Subscription } from './user';
export type { UserRole as AdminUserRole, Permission, PermissionKey } from './roles';
export { RolePermissions } from './roles';

// Admin
// export type { Price } from './admin/Price';

// CLE & Lawyer Collaboration
// export type { CLECourse, CLEEnrollment, CLEProgress, CLECertificate } from './lawyerCLE';
// export type { LawyerMessage, LawyerReferral, ForumPost } from './lawyerCollaboration';
// export type { LawyerDocumentTemplate } from './lawyerDocumentTemplate';

// Lawyer Marketing
// export type { LawyerMarketingProfile, LawyerReview, SEOAnalytics } from './lawyerMarketing';

// Security
// export type { PasswordPolicy, TwoFAMethod, UserSecurity } from './security';

// Payment Types
// (All payment types are now only exported from ../schemas/payment.ts)

// Zod Schemas (for backend validation)


// Explicit Zod Schema Exports for Backend Compatibility
export { 
  LoginSchema, RegisterSchema, RefreshTokenSchema, ChangePasswordSchema 
} from '../schemas/auth';
export { ForgotPasswordSchema, ResetPasswordSchema } from '../schemas/forgotPassword';
export { 
  CreateServiceSchema, CreateBookingSchema, UpdateBookingStatusSchema, CreateReviewSchema, ServiceSearchSchema 
} from '../schemas/marketplace';
export { 
  CreatePaymentIntentSchema, PaymentVerificationSchema, RefundRequestSchema, EscrowReleaseSchema, PaymentWebhookSchema 
} from '../schemas/payment';
export { 
  UpdateUserProfileSchema, LawyerOnboardingSchema, UpdateAvailabilitySchema 
} from '../schemas/user';
export { 
  CreateAIQuerySchema, CreateDocumentGenerationSchema, LegalResearchSchema, ContractAnalysisSchema 
} from '../schemas/ai';



export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// AI Legal Assistant Types
export interface AIQueryRequest {
  query: string;
  type: 'LEGAL_ADVICE' | 'DOCUMENT_REVIEW' | 'CASE_ANALYSIS' | 'GENERAL_QUESTION';
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  includeReferences?: boolean;
  context?: Record<string, any>;
}

export interface AIQueryResponse {
  id: string;
  query: string;
  answer: string;
  confidence: number;
  sources?: Array<{
    type: string;
    title: string;
    jurisdiction: string;
    url?: string;
  }>;
  consultationSuggestion?: {
    message: string;
    benefits: string[];
    callToAction: {
      text: string;
      link: string;
      price: string;
    };
  };
  remainingQueries?: number;
  createdAt: Date;
}
export interface VoiceQueryRequest {
  audioData: string; // base64 encoded audio
  format: 'mp3' | 'wav' | 'webm' | 'ogg' | 'm4a';
  language?: string;
}