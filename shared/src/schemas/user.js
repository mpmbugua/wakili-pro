"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LawyerProfileUpdateSchema = exports.UpdateUserProfileSchema = exports.UpdateAvailabilitySchema = exports.WorkingHoursSchema = exports.LawyerOnboardingSchema = exports.UserProfileSchema = void 0;
const zod_1 = require("zod");
exports.UserProfileSchema = zod_1.z.object({
    bio: zod_1.z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
    avatarUrl: zod_1.z.string().url('Invalid avatar URL').optional(),
    county: zod_1.z.string().min(2, 'County is required').max(50).optional(),
    city: zod_1.z.string().min(2, 'City is required').max(50).optional(),
});
exports.LawyerOnboardingSchema = zod_1.z.object({
    licenseNumber: zod_1.z.string().min(1, 'License number is required').max(20),
    yearOfAdmission: zod_1.z.number()
        .min(1960, 'Year of admission must be after 1960')
        .max(new Date().getFullYear(), 'Year of admission cannot be in the future'),
    specializations: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        category: zod_1.z.enum(['CORPORATE', 'CRIMINAL', 'FAMILY', 'PROPERTY', 'IMMIGRATION', 'IP', 'EMPLOYMENT']),
    })).min(1, 'At least one specialization is required'),
    location: zod_1.z.object({
        latitude: zod_1.z.number().min(-90).max(90),
        longitude: zod_1.z.number().min(-180).max(180),
        address: zod_1.z.string().min(10, 'Address must be at least 10 characters'),
        city: zod_1.z.string().min(2, 'City is required'),
        county: zod_1.z.string().min(2, 'County is required'),
    }),
    bio: zod_1.z.string().min(100, 'Bio must be at least 100 characters').max(1000),
    yearsOfExperience: zod_1.z.number().min(0, 'Years of experience cannot be negative').max(60),
    profileImageUrl: zod_1.z.string().url('Invalid profile image URL').optional(),
});
exports.WorkingHoursSchema = zod_1.z.object({
    dayOfWeek: zod_1.z.number().min(0).max(6), // 0-6 (Sunday-Saturday)
    startTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    endTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    isAvailable: zod_1.z.boolean(),
});
exports.UpdateAvailabilitySchema = zod_1.z.object({
    availability: zod_1.z.array(exports.WorkingHoursSchema).length(7, 'Must provide availability for all 7 days'),
});
exports.UpdateUserProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters').max(50).optional(),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters').max(50).optional(),
    phoneNumber: zod_1.z.string()
        .regex(/^(\+254|0)[17]\d{8}$/, 'Invalid Kenyan phone number format')
        .optional(),
    profile: exports.UserProfileSchema.optional(),
});
exports.LawyerProfileUpdateSchema = zod_1.z.object({
    bio: zod_1.z.string().min(100, 'Bio must be at least 100 characters').max(1000).optional(),
    yearsOfExperience: zod_1.z.number().min(0).max(60).optional(),
    profileImageUrl: zod_1.z.string().url('Invalid profile image URL').optional(),
    specializations: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        category: zod_1.z.enum(['CORPORATE', 'CRIMINAL', 'FAMILY', 'PROPERTY', 'IMMIGRATION', 'IP', 'EMPLOYMENT']),
    })).optional(),
});
