"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__shared_runtime_marker = exports.VideoQualitySchema = exports.MeetingAnalyticsSchema = exports.VideoSettingsUpdateSchema = exports.ScreenShareRequestSchema = exports.WebRTCSignalSchema = exports.MeetingControlSchema = exports.UpdateParticipantStatusSchema = exports.JoinVideoConsultationSchema = exports.CreateVideoConsultationSchema = exports.LegalTemplateSchema = exports.AIQueryFiltersSchema = exports.UpdateAIQuerySchema = exports.ContractAnalysisSchema = exports.LegalResearchSchema = exports.CreateDocumentGenerationSchema = exports.CreateAIQuerySchema = exports.UpdateAvailabilitySchema = exports.LawyerOnboardingSchema = exports.UpdateUserProfileSchema = exports.PaymentAnalyticsSchema = exports.WalletTransactionSchema = exports.StripePaymentSchema = exports.MpesaPaymentSchema = exports.PaymentStatusSchema = exports.PaymentMethodSchema = exports.PaymentWebhookSchema = exports.EscrowReleaseSchema = exports.RefundRequestSchema = exports.PaymentVerificationSchema = exports.CreatePaymentIntentSchema = exports.PaginationSchema = exports.ServiceSearchSchema = exports.CreateReviewSchema = exports.UpdateBookingStatusSchema = exports.CreateBookingSchema = exports.CreateServiceSchema = exports.ResetPasswordSchema = exports.ForgotPasswordSchema = exports.VerifyEmailSchema = exports.ChangePasswordSchema = exports.RefreshTokenSchema = exports.RegisterSchema = exports.LoginSchema = void 0;
// Centralized type and schema exports for shared package
__exportStar(require("./types/index"), exports);
var auth_1 = require("./schemas/auth");
Object.defineProperty(exports, "LoginSchema", { enumerable: true, get: function () { return auth_1.LoginSchema; } });
Object.defineProperty(exports, "RegisterSchema", { enumerable: true, get: function () { return auth_1.RegisterSchema; } });
Object.defineProperty(exports, "RefreshTokenSchema", { enumerable: true, get: function () { return auth_1.RefreshTokenSchema; } });
Object.defineProperty(exports, "ChangePasswordSchema", { enumerable: true, get: function () { return auth_1.ChangePasswordSchema; } });
Object.defineProperty(exports, "VerifyEmailSchema", { enumerable: true, get: function () { return auth_1.VerifyEmailSchema; } });
var forgotPassword_1 = require("./schemas/forgotPassword");
Object.defineProperty(exports, "ForgotPasswordSchema", { enumerable: true, get: function () { return forgotPassword_1.ForgotPasswordSchema; } });
Object.defineProperty(exports, "ResetPasswordSchema", { enumerable: true, get: function () { return forgotPassword_1.ResetPasswordSchema; } });
var marketplace_1 = require("./schemas/marketplace");
Object.defineProperty(exports, "CreateServiceSchema", { enumerable: true, get: function () { return marketplace_1.CreateServiceSchema; } });
Object.defineProperty(exports, "CreateBookingSchema", { enumerable: true, get: function () { return marketplace_1.CreateBookingSchema; } });
Object.defineProperty(exports, "UpdateBookingStatusSchema", { enumerable: true, get: function () { return marketplace_1.UpdateBookingStatusSchema; } });
Object.defineProperty(exports, "CreateReviewSchema", { enumerable: true, get: function () { return marketplace_1.CreateReviewSchema; } });
Object.defineProperty(exports, "ServiceSearchSchema", { enumerable: true, get: function () { return marketplace_1.ServiceSearchSchema; } });
Object.defineProperty(exports, "PaginationSchema", { enumerable: true, get: function () { return marketplace_1.PaginationSchema; } });
var payment_1 = require("./schemas/payment");
Object.defineProperty(exports, "CreatePaymentIntentSchema", { enumerable: true, get: function () { return payment_1.CreatePaymentIntentSchema; } });
Object.defineProperty(exports, "PaymentVerificationSchema", { enumerable: true, get: function () { return payment_1.PaymentVerificationSchema; } });
Object.defineProperty(exports, "RefundRequestSchema", { enumerable: true, get: function () { return payment_1.RefundRequestSchema; } });
Object.defineProperty(exports, "EscrowReleaseSchema", { enumerable: true, get: function () { return payment_1.EscrowReleaseSchema; } });
Object.defineProperty(exports, "PaymentWebhookSchema", { enumerable: true, get: function () { return payment_1.PaymentWebhookSchema; } });
Object.defineProperty(exports, "PaymentMethodSchema", { enumerable: true, get: function () { return payment_1.PaymentMethodSchema; } });
Object.defineProperty(exports, "PaymentStatusSchema", { enumerable: true, get: function () { return payment_1.PaymentStatusSchema; } });
Object.defineProperty(exports, "MpesaPaymentSchema", { enumerable: true, get: function () { return payment_1.MpesaPaymentSchema; } });
Object.defineProperty(exports, "StripePaymentSchema", { enumerable: true, get: function () { return payment_1.StripePaymentSchema; } });
Object.defineProperty(exports, "WalletTransactionSchema", { enumerable: true, get: function () { return payment_1.WalletTransactionSchema; } });
Object.defineProperty(exports, "PaymentAnalyticsSchema", { enumerable: true, get: function () { return payment_1.PaymentAnalyticsSchema; } });
var user_1 = require("./schemas/user");
Object.defineProperty(exports, "UpdateUserProfileSchema", { enumerable: true, get: function () { return user_1.UpdateUserProfileSchema; } });
Object.defineProperty(exports, "LawyerOnboardingSchema", { enumerable: true, get: function () { return user_1.LawyerOnboardingSchema; } });
Object.defineProperty(exports, "UpdateAvailabilitySchema", { enumerable: true, get: function () { return user_1.UpdateAvailabilitySchema; } });
var ai_1 = require("./schemas/ai");
Object.defineProperty(exports, "CreateAIQuerySchema", { enumerable: true, get: function () { return ai_1.CreateAIQuerySchema; } });
Object.defineProperty(exports, "CreateDocumentGenerationSchema", { enumerable: true, get: function () { return ai_1.CreateDocumentGenerationSchema; } });
Object.defineProperty(exports, "LegalResearchSchema", { enumerable: true, get: function () { return ai_1.LegalResearchSchema; } });
Object.defineProperty(exports, "ContractAnalysisSchema", { enumerable: true, get: function () { return ai_1.ContractAnalysisSchema; } });
Object.defineProperty(exports, "UpdateAIQuerySchema", { enumerable: true, get: function () { return ai_1.UpdateAIQuerySchema; } });
Object.defineProperty(exports, "AIQueryFiltersSchema", { enumerable: true, get: function () { return ai_1.AIQueryFiltersSchema; } });
Object.defineProperty(exports, "LegalTemplateSchema", { enumerable: true, get: function () { return ai_1.LegalTemplateSchema; } });
var video_1 = require("./schemas/video");
Object.defineProperty(exports, "CreateVideoConsultationSchema", { enumerable: true, get: function () { return video_1.CreateVideoConsultationSchema; } });
Object.defineProperty(exports, "JoinVideoConsultationSchema", { enumerable: true, get: function () { return video_1.JoinVideoConsultationSchema; } });
Object.defineProperty(exports, "UpdateParticipantStatusSchema", { enumerable: true, get: function () { return video_1.UpdateParticipantStatusSchema; } });
Object.defineProperty(exports, "MeetingControlSchema", { enumerable: true, get: function () { return video_1.MeetingControlSchema; } });
Object.defineProperty(exports, "WebRTCSignalSchema", { enumerable: true, get: function () { return video_1.WebRTCSignalSchema; } });
Object.defineProperty(exports, "ScreenShareRequestSchema", { enumerable: true, get: function () { return video_1.ScreenShareRequestSchema; } });
Object.defineProperty(exports, "VideoSettingsUpdateSchema", { enumerable: true, get: function () { return video_1.VideoSettingsUpdateSchema; } });
Object.defineProperty(exports, "MeetingAnalyticsSchema", { enumerable: true, get: function () { return video_1.MeetingAnalyticsSchema; } });
Object.defineProperty(exports, "VideoQualitySchema", { enumerable: true, get: function () { return video_1.VideoQualitySchema; } });
__exportStar(require("./schemas/case"), exports);
// Force TypeScript to emit a runtime file for the shared package
exports.__shared_runtime_marker = true;
