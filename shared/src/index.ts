// Export all types
// Runtime export to ensure dist/index.js is emitted
export const sharedMarker = true;
export * from './types/auth';
export * from './types/user';
export * from './types/marketplace';
export * from './types/case';
export * from './types/ai';

// Export only Zod schemas (not types) to avoid conflicts
export {
	LoginSchema,
	RegisterSchema,
	RefreshTokenSchema,
	ChangePasswordSchema,
	VerifyEmailSchema
} from './schemas/auth';

export {
	CreateAIQuerySchema,
	CreateDocumentGenerationSchema,
	LegalResearchSchema,
	ContractAnalysisSchema,
	UpdateAIQuerySchema,
	AIQueryFiltersSchema,
	LegalTemplateSchema
} from './schemas/ai';

export {
	CreateServiceSchema,
	ServiceFiltersSchema,
	CreateBookingSchema,
	UpdateBookingStatusSchema,
	CreateReviewSchema,
	ServiceSearchSchema,
	PaginationSchema
} from './schemas/marketplace';

export {
	PaymentMethodSchema,
	PaymentStatusSchema,
	MpesaPaymentSchema,
	StripePaymentSchema,
	CreatePaymentIntentSchema,
	PaymentVerificationSchema,
	RefundRequestSchema,
	EscrowReleaseSchema,
	WalletTransactionSchema,
	PaymentWebhookSchema,
	PaymentAnalyticsSchema
} from './schemas/payment';

export {
	CreateVideoConsultationSchema,
	JoinVideoConsultationSchema,
	UpdateParticipantStatusSchema,
	WebRTCSignalSchema,
	ScreenShareRequestSchema,
	MeetingControlSchema,
	VideoQualitySchema,
	MeetingAnalyticsSchema,
	VideoSettingsUpdateSchema
} from './schemas/video';

export {
	UserProfileSchema,
	LawyerOnboardingSchema,
	WorkingHoursSchema,
	UpdateAvailabilitySchema,
	UpdateUserProfileSchema
} from './schemas/user';

export { ForgotPasswordSchema, ResetPasswordSchema } from './schemas/forgotPassword';

export * from './schemas/case';

// Export ApiResponse interface and UserRole for backend usage
export type { ApiResponse, UserRole } from './types/index';