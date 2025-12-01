import { z } from 'zod';

export const UserProfileSchema = z.object({
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
  county: z.string().min(2, 'County is required').max(50).optional(),
  city: z.string().min(2, 'City is required').max(50).optional(),
});

export const LawyerOnboardingSchema = z.object({
  licenseNumber: z.string().min(1, 'License number is required').max(20),
  yearOfAdmission: z.number()
    .min(1960, 'Year of admission must be after 1960')
    .max(new Date().getFullYear(), 'Year of admission cannot be in the future'),
  specializations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.enum(['CORPORATE', 'CRIMINAL', 'FAMILY', 'PROPERTY', 'IMMIGRATION', 'IP', 'EMPLOYMENT']),
    })
  ).min(1, 'At least one specialization is required'),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(10, 'Address must be at least 10 characters'),
    city: z.string().min(2, 'City is required'),
    county: z.string().min(2, 'County is required'),
  }),
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters'),
  yearsOfExperience: z.number().min(0, 'Years of experience cannot be negative').max(60),
  profileImageUrl: z.string().url('Invalid profile image URL').optional(),
  linkedInProfile: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  hourlyRate: z.number().min(500, 'Hourly rate must be at least KES 500').max(50000, 'Hourly rate cannot exceed KES 50,000'),
  offPeakHourlyRate: z.number().min(500, 'Off-peak rate must be at least KES 500').max(50000, 'Off-peak rate cannot exceed KES 50,000').optional(),
  available24_7: z.boolean().optional(),
  workingHours: z.object({
    monday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
    tuesday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
    wednesday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
    thursday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
    friday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
    saturday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
    sunday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
  }).optional(),
});

export const WorkingHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6), // 0-6 (Sunday-Saturday)
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  isAvailable: z.boolean(),
});

export const UpdateAvailabilitySchema = z.object({
  availability: z.array(WorkingHoursSchema).length(7, 'Must provide availability for all 7 days'),
});

export const UpdateUserProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50).optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50).optional(),
  email: z.string().email('Invalid email address').optional(),
  phoneNumber: z.string()
    .regex(/^(\+254|0)[17]\d{8}$/, 'Invalid Kenyan phone number format')
    .optional(),
  profile: UserProfileSchema.optional(),
});

export const LawyerProfileUpdateSchema = z.object({
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters').optional(),
  yearsOfExperience: z.number().min(0).max(60).optional(),
  profileImageUrl: z.string().url('Invalid profile image URL').optional(),
  specializations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.enum(['CORPORATE', 'CRIMINAL', 'FAMILY', 'PROPERTY', 'IMMIGRATION', 'IP', 'EMPLOYMENT']),
    })
  ).optional(),
});

// Infer types from schemas
export type UserProfileUpdate = z.infer<typeof UserProfileSchema>;
export type LawyerOnboardingData = z.infer<typeof LawyerOnboardingSchema>;
export type WorkingHours = z.infer<typeof WorkingHoursSchema>;
export type UpdateAvailabilityData = z.infer<typeof UpdateAvailabilitySchema>;
export type UserUpdate = z.infer<typeof UpdateUserProfileSchema>;
export type LawyerProfileUpdate = z.infer<typeof LawyerProfileUpdateSchema>;