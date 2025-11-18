// Centralized type and schema exports for shared package
export * from './types/auth';
export * from './types/user';
export * from './types/marketplace';
export * from './types/case';
export * from './types/ai';
export * from './types/index';
export { LoginSchema, RegisterSchema, RefreshTokenSchema, ChangePasswordSchema, VerifyEmailSchema } from './schemas/auth';
export { ForgotPasswordSchema, ResetPasswordSchema } from './schemas/forgotPassword';
export { CreateServiceSchema, CreateBookingSchema, UpdateBookingStatusSchema, CreateReviewSchema, ServiceSearchSchema, PaginationSchema, ServiceFiltersSchema } from './schemas/marketplace';
export { CreatePaymentIntentSchema, PaymentVerificationSchema, RefundRequestSchema, EscrowReleaseSchema, PaymentWebhookSchema, PaymentMethodSchema, PaymentStatusSchema, MpesaPaymentSchema, StripePaymentSchema, WalletTransactionSchema, PaymentAnalyticsSchema } from './schemas/payment';
export { UpdateUserProfileSchema, LawyerOnboardingSchema, UpdateAvailabilitySchema, UserProfileSchema, WorkingHoursSchema } from './schemas/user';
export { CreateAIQuerySchema, CreateDocumentGenerationSchema, LegalResearchSchema, ContractAnalysisSchema, UpdateAIQuerySchema, AIQueryFiltersSchema, LegalTemplateSchema } from './schemas/ai';
export { CreateVideoConsultationSchema, JoinVideoConsultationSchema, UpdateParticipantStatusSchema, MeetingControlSchema, WebRTCSignalSchema, ScreenShareRequestSchema, VideoSettingsUpdateSchema, MeetingAnalyticsSchema, VideoQualitySchema } from './schemas/video';
export * from './schemas/case';
// Force TypeScript to emit a runtime file for the shared package
export const __shared_runtime_marker = true;
