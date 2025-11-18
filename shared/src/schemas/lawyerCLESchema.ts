import { z } from 'zod';

export const CLECourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  duration: z.number(),
  instructor: z.string(),
});

export const CLEEnrollmentSchema = z.object({
  userId: z.string(),
  courseId: z.string(),
  enrolledAt: z.string(),
});

export const CLEProgressSchema = z.object({
  userId: z.string(),
  courseId: z.string(),
  progress: z.number(),
});

export const CLECertificateSchema = z.object({
  userId: z.string(),
  courseId: z.string(),
  issuedAt: z.string(),
  certificateUrl: z.string(),
});
