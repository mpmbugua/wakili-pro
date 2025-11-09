import { z } from 'zod';

// Payment Method Types
export const PaymentMethodSchema = z.enum([
  'MPESA',
  'STRIPE_CARD',
  'BANK_TRANSFER',
  'WALLET'
]);

// Payment Status Types  
export const PaymentStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
  'CANCELLED'
]);

// M-Pesa Payment Schema
export const MpesaPaymentSchema = z.object({
  phoneNumber: z.string().regex(/^254[0-9]{9}$/, 'Invalid Kenyan phone number format'),
  amount: z.number().min(1, 'Amount must be greater than 0').max(1000000, 'Amount exceeds limit'),
  accountReference: z.string().min(1, 'Account reference required').max(50),
  transactionDesc: z.string().min(1, 'Transaction description required').max(100),
});

// Stripe Payment Schema
export const StripePaymentSchema = z.object({
  paymentMethodId: z.string().min(1, 'Payment method ID required'),
  amount: z.number().min(50, 'Minimum amount is KES 50').max(1000000, 'Amount exceeds limit'), // Amount in KES
  currency: z.string().default('kes'),
  description: z.string().min(1, 'Payment description required').max(200),
  customerEmail: z.string().email('Invalid email format'),
});

// Payment Intent Creation Schema
export const CreatePaymentIntentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID required'),
  paymentMethod: PaymentMethodSchema,
  mpesaDetails: MpesaPaymentSchema.optional(),
  stripeDetails: StripePaymentSchema.optional(),
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
export const PaymentVerificationSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID required'),
  paymentMethod: PaymentMethodSchema,
  externalTransactionId: z.string().optional(), // M-Pesa receipt or Stripe payment intent ID
});

// Refund Request Schema
export const RefundRequestSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID required'),
  amount: z.number().min(1, 'Refund amount must be greater than 0').optional(), // Partial refund
  reason: z.string().min(10, 'Refund reason required').max(500),
});

// Escrow Release Schema
export const EscrowReleaseSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID required'),
  releaseAmount: z.number().min(1, 'Release amount must be greater than 0'),
  platformFee: z.number().min(0, 'Platform fee cannot be negative').default(0),
  lawyerPayout: z.number().min(1, 'Lawyer payout must be greater than 0'),
});

// Wallet Transaction Schema
export const WalletTransactionSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REFUND', 'PAYOUT']),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  description: z.string().min(1, 'Description required').max(200),
  referenceId: z.string().optional(), // Booking ID, Payment ID, etc.
});

// Payment Webhook Schema (for M-Pesa and Stripe callbacks)
export const PaymentWebhookSchema = z.object({
  provider: z.enum(['MPESA', 'STRIPE']),
  eventType: z.string().min(1, 'Event type required'),
  transactionId: z.string().min(1, 'Transaction ID required'),
  status: PaymentStatusSchema,
  amount: z.number().min(0),
  metadata: z.record(z.any()).optional(),
});

// Payment Analytics Schema
export const PaymentAnalyticsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  paymentMethod: PaymentMethodSchema.optional(),
  status: PaymentStatusSchema.optional(),
  lawyerId: z.string().optional(),
});

// Export types
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type MpesaPaymentData = z.infer<typeof MpesaPaymentSchema>;
export type StripePaymentData = z.infer<typeof StripePaymentSchema>;
export type CreatePaymentIntentData = z.infer<typeof CreatePaymentIntentSchema>;
export type PaymentVerificationData = z.infer<typeof PaymentVerificationSchema>;
export type RefundRequestData = z.infer<typeof RefundRequestSchema>;
export type EscrowReleaseData = z.infer<typeof EscrowReleaseSchema>;
export type WalletTransactionData = z.infer<typeof WalletTransactionSchema>;
export type PaymentWebhookData = z.infer<typeof PaymentWebhookSchema>;
export type PaymentAnalyticsData = z.infer<typeof PaymentAnalyticsSchema>;