

// Centralized type and schema exports for shared package

// Centralized type and schema exports for shared package
export * from './src/types/auth';
export * from './src/types/user';
export * from './src/types/marketplace';
export * from './src/types/case';
export * from './src/types/ai';
export * from './src/types/lawyerCLE';
export * from './src/types/lawyerCollaboration';
export * from './src/types/lawyerDocumentTemplate';
export * from './src/types/lawyerMarketing';
export * from './src/types/security';
export * from './src/types/index';
export type { Price } from './src/types/admin/Price';
export { PriceSchema } from './src/schemas/admin/PriceSchema';
export { LoginSchema, RegisterSchema, RefreshTokenSchema, ChangePasswordSchema, VerifyEmailSchema } from './src/schemas/auth';
export { ForgotPasswordSchema, ResetPasswordSchema } from './src/schemas/forgotPassword';
export { CreateServiceSchema, CreateBookingSchema, UpdateBookingStatusSchema, CreateReviewSchema, ServiceSearchSchema, PaginationSchema, ServiceFiltersSchema } from './src/schemas/marketplace';
export { CreatePaymentIntentSchema, PaymentVerificationSchema, RefundRequestSchema, EscrowReleaseSchema, PaymentWebhookSchema, PaymentMethodSchema, PaymentStatusSchema, MpesaPaymentSchema, StripePaymentSchema, WalletTransactionSchema, PaymentAnalyticsSchema } from './src/schemas/payment';
export { UpdateUserProfileSchema, LawyerOnboardingSchema, UpdateAvailabilitySchema, UserProfileSchema, WorkingHoursSchema } from './src/schemas/user';
export { CreateAIQuerySchema, CreateDocumentGenerationSchema, LegalResearchSchema, ContractAnalysisSchema, UpdateAIQuerySchema, AIQueryFiltersSchema, LegalTemplateSchema } from './src/schemas/ai';
export { CreateVideoConsultationSchema, JoinVideoConsultationSchema, UpdateParticipantStatusSchema, MeetingControlSchema, WebRTCSignalSchema, ScreenShareRequestSchema, VideoSettingsUpdateSchema, MeetingAnalyticsSchema, VideoQualitySchema } from './src/schemas/video';
export * from './src/schemas/case';
// Force TypeScript to emit a runtime file for the shared package
export const __shared_runtime_marker = true;


