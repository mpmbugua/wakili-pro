import { z } from 'zod';

export const CreateServiceSchema = z.object({
  type: z.enum(['CONSULTATION', 'DOCUMENT_DRAFTING', 'LEGAL_REVIEW', 'IP_FILING', 'DISPUTE_MEDIATION', 'CONTRACT_NEGOTIATION']),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  priceKES: z.number().min(100, 'Price must be at least KES 100').max(1000000),
  duration: z.number().min(15, 'Duration must be at least 15 minutes').max(480).optional(), // For consultations
  deliveryTimeframe: z.string().max(50).optional(),
  tags: z.array(z.string().min(2).max(30)).max(10).optional(),
});

export const ServiceFiltersSchema = z.object({
  type: z.enum(['CONSULTATION', 'DOCUMENT_DRAFTING', 'LEGAL_REVIEW', 'IP_FILING', 'DISPUTE_MEDIATION', 'CONTRACT_NEGOTIATION']).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radius: z.number().min(1).max(100), // km
  }).optional(),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(1),
  }).optional(),
  specialization: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

export const CreateBookingSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  scheduledAt: z.string().datetime().optional(), // ISO string for consultations
  clientRequirements: z.string().min(10, 'Please provide detailed requirements').max(2000),
});

export const UpdateBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  providerNotes: z.string().max(1000).optional(),
});

export const CreateReviewSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().min(10, 'Review comment must be at least 10 characters').max(500),
});

export const ServiceSearchSchema = z.object({
  query: z.string().optional(),
  type: z.enum(['CONSULTATION', 'DOCUMENT_DRAFTING', 'LEGAL_REVIEW', 'IP_FILING', 'DISPUTE_MEDIATION', 'CONTRACT_NEGOTIATION']).optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    radius: z.number().default(10),
  }).optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(1).optional(),
  rating: z.number().min(1).max(5).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10),
});

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// Infer types from schemas
export type CreateServiceData = z.infer<typeof CreateServiceSchema>;
export type ServiceFiltersData = z.infer<typeof ServiceFiltersSchema>;
export type CreateBookingData = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingStatusData = z.infer<typeof UpdateBookingStatusSchema>;
export type CreateReviewData = z.infer<typeof CreateReviewSchema>;
export type ServiceSearchData = z.infer<typeof ServiceSearchSchema>;
export type PaginationData = z.infer<typeof PaginationSchema>;