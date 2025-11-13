import { z } from 'zod';

export const PaymentMethodEnum = z.enum(['MPESA', 'STRIPE_CARD', 'BANK_TRANSFER', 'WALLET']);

export const CreatePaymentIntentSchema = z.object({
  bookingId: z.string(),
  paymentMethod: PaymentMethodEnum,
  amount: z.number().optional(), // Optional, validated against booking
  mpesaDetails: z.object({
    phoneNumber: z.string().optional()
  }).optional(),
  stripeDetails: z.object({
    customerEmail: z.string().email().optional()
  }).optional()
});

export const PaymentVerificationSchema = z.object({
  paymentId: z.string(),
  provider: PaymentMethodEnum,
  transactionId: z.string(),
});

export type CreatePaymentIntentInput = z.infer<typeof CreatePaymentIntentSchema>;
export type PaymentVerificationInput = z.infer<typeof PaymentVerificationSchema>;
