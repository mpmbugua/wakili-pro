"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationSchema = exports.ServiceSearchSchema = exports.CreateReviewSchema = exports.UpdateBookingStatusSchema = exports.CreateBookingSchema = exports.ServiceFiltersSchema = exports.CreateServiceSchema = void 0;
const zod_1 = require("zod");
exports.CreateServiceSchema = zod_1.z.object({
    type: zod_1.z.enum(['CONSULTATION', 'DOCUMENT_DRAFTING', 'LEGAL_REVIEW', 'IP_FILING', 'DISPUTE_MEDIATION', 'CONTRACT_NEGOTIATION']),
    title: zod_1.z.string().min(5, 'Title must be at least 5 characters').max(100),
    description: zod_1.z.string().min(20, 'Description must be at least 20 characters').max(1000),
    priceKES: zod_1.z.number().min(100, 'Price must be at least KES 100').max(1000000),
    duration: zod_1.z.number().min(15, 'Duration must be at least 15 minutes').max(480).optional(), // For consultations
    deliveryTimeframe: zod_1.z.string().max(50).optional(),
    tags: zod_1.z.array(zod_1.z.string().min(2).max(30)).max(10).optional(),
});
exports.ServiceFiltersSchema = zod_1.z.object({
    type: zod_1.z.enum(['CONSULTATION', 'DOCUMENT_DRAFTING', 'LEGAL_REVIEW', 'IP_FILING', 'DISPUTE_MEDIATION', 'CONTRACT_NEGOTIATION']).optional(),
    location: zod_1.z.object({
        latitude: zod_1.z.number().min(-90).max(90),
        longitude: zod_1.z.number().min(-180).max(180),
        radius: zod_1.z.number().min(1).max(100), // km
    }).optional(),
    priceRange: zod_1.z.object({
        min: zod_1.z.number().min(0),
        max: zod_1.z.number().min(1),
    }).optional(),
    specialization: zod_1.z.string().optional(),
    rating: zod_1.z.number().min(1).max(5).optional(),
});
exports.CreateBookingSchema = zod_1.z.object({
    serviceId: zod_1.z.string().min(1, 'Service ID is required'),
    scheduledAt: zod_1.z.string().datetime().optional(), // ISO string for consultations
    clientRequirements: zod_1.z.string().min(10, 'Please provide detailed requirements').max(2000),
});
exports.UpdateBookingStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    providerNotes: zod_1.z.string().max(1000).optional(),
});
exports.CreateReviewSchema = zod_1.z.object({
    serviceId: zod_1.z.string().min(1, 'Service ID is required'),
    rating: zod_1.z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment: zod_1.z.string().min(10, 'Review comment must be at least 10 characters').max(500),
});
exports.ServiceSearchSchema = zod_1.z.object({
    query: zod_1.z.string().optional(),
    type: zod_1.z.enum(['CONSULTATION', 'DOCUMENT_DRAFTING', 'LEGAL_REVIEW', 'IP_FILING', 'DISPUTE_MEDIATION', 'CONTRACT_NEGOTIATION']).optional(),
    location: zod_1.z.object({
        latitude: zod_1.z.number(),
        longitude: zod_1.z.number(),
        radius: zod_1.z.number().default(10),
    }).optional(),
    priceMin: zod_1.z.number().min(0).optional(),
    priceMax: zod_1.z.number().min(1).optional(),
    rating: zod_1.z.number().min(1).max(5).optional(),
    page: zod_1.z.number().min(1).default(1),
    limit: zod_1.z.number().min(1).max(50).default(10),
});
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.number().min(1).default(1),
    limit: zod_1.z.number().min(1).max(100).default(10),
});
