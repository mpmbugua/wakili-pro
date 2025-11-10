"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentAnalyticsSchema = exports.PaymentWebhookSchema = exports.WalletTransactionSchema = exports.EscrowReleaseSchema = exports.RefundRequestSchema = exports.PaymentVerificationSchema = exports.CreatePaymentIntentSchema = exports.StripePaymentSchema = exports.MpesaPaymentSchema = exports.PaymentStatusSchema = exports.PaymentMethodSchema = void 0;
const zod_1 = require("zod");
// Payment Method Types
exports.PaymentMethodSchema = zod_1.z.enum([
    'MPESA',
    'STRIPE_CARD',
    'BANK_TRANSFER',
    'WALLET'
]);
// Payment Status Types  
exports.PaymentStatusSchema = zod_1.z.enum([
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'REFUNDED',
    'CANCELLED'
]);
// M-Pesa Payment Schema
exports.MpesaPaymentSchema = zod_1.z.object({
    phoneNumber: zod_1.z.string().regex(/^254[0-9]{9}$/, 'Invalid Kenyan phone number format'),
    amount: zod_1.z.number().min(1, 'Amount must be greater than 0').max(1000000, 'Amount exceeds limit'),
    accountReference: zod_1.z.string().min(1, 'Account reference required').max(50),
    transactionDesc: zod_1.z.string().min(1, 'Transaction description required').max(100),
});
// Stripe Payment Schema
exports.StripePaymentSchema = zod_1.z.object({
    paymentMethodId: zod_1.z.string().min(1, 'Payment method ID required'),
    amount: zod_1.z.number().min(50, 'Minimum amount is KES 50').max(1000000, 'Amount exceeds limit'), // Amount in KES
    currency: zod_1.z.string().default('kes'),
    description: zod_1.z.string().min(1, 'Payment description required').max(200),
    customerEmail: zod_1.z.string().email('Invalid email format'),
});
// Payment Intent Creation Schema
exports.CreatePaymentIntentSchema = zod_1.z.object({
    bookingId: zod_1.z.string().min(1, 'Booking ID required'),
    paymentMethod: exports.PaymentMethodSchema,
    mpesaDetails: exports.MpesaPaymentSchema.optional(),
    stripeDetails: exports.StripePaymentSchema.optional(),
}).refine((data) => {
    if (data.paymentMethod === 'MPESA' && !data.mpesaDetails) {
        return false;
    }
    if (data.paymentMethod === 'STRIPE_CARD' && !data.stripeDetails) {
        return false;
    }
    return true;
}, {
    message: 'Payment details required for selected payment method',
});
// Payment Verification Schema
exports.PaymentVerificationSchema = zod_1.z.object({
    transactionId: zod_1.z.string().min(1, 'Transaction ID required'),
    paymentMethod: exports.PaymentMethodSchema,
    externalTransactionId: zod_1.z.string().optional(), // M-Pesa receipt or Stripe payment intent ID
});
// Refund Request Schema
exports.RefundRequestSchema = zod_1.z.object({
    paymentId: zod_1.z.string().min(1, 'Payment ID required'),
    amount: zod_1.z.number().min(1, 'Refund amount must be greater than 0').optional(), // Partial refund
    reason: zod_1.z.string().min(10, 'Refund reason required').max(500),
});
// Escrow Release Schema
exports.EscrowReleaseSchema = zod_1.z.object({
    bookingId: zod_1.z.string().min(1, 'Booking ID required'),
    releaseAmount: zod_1.z.number().min(1, 'Release amount must be greater than 0'),
    platformFee: zod_1.z.number().min(0, 'Platform fee cannot be negative').default(0),
    lawyerPayout: zod_1.z.number().min(1, 'Lawyer payout must be greater than 0'),
});
// Wallet Transaction Schema
exports.WalletTransactionSchema = zod_1.z.object({
    type: zod_1.z.enum(['DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REFUND', 'PAYOUT']),
    amount: zod_1.z.number().min(1, 'Amount must be greater than 0'),
    description: zod_1.z.string().min(1, 'Description required').max(200),
    referenceId: zod_1.z.string().optional(), // Booking ID, Payment ID, etc.
});
// Payment Webhook Schema (for M-Pesa and Stripe callbacks)
exports.PaymentWebhookSchema = zod_1.z.object({
    provider: zod_1.z.enum(['MPESA', 'STRIPE']),
    eventType: zod_1.z.string().min(1, 'Event type required'),
    transactionId: zod_1.z.string().min(1, 'Transaction ID required'),
    status: exports.PaymentStatusSchema,
    amount: zod_1.z.number().min(0),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
// Payment Analytics Schema
exports.PaymentAnalyticsSchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    paymentMethod: exports.PaymentMethodSchema.optional(),
    status: exports.PaymentStatusSchema.optional(),
    lawyerId: zod_1.z.string().optional(),
});
