import { z } from 'zod';

export const CreateCaseSchema = z.object({
  title: z.string().min(5, 'Case title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Case description must be at least 20 characters').max(2000),
  caseType: z.enum(['CIVIL', 'CRIMINAL', 'FAMILY', 'CORPORATE', 'CONSTITUTIONAL', 'EMPLOYMENT', 'REAL_ESTATE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedValue: z.number().min(0).optional(),
  clientId: z.string().min(1, 'Client ID is required').optional(), // For lawyer-created cases
});

export const UpdateCaseSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(20).max(2000).optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'CLOSED', 'ARCHIVED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  estimatedValue: z.number().min(0).optional(),
});

export const CreateDocumentSchema = z.object({
  caseId: z.string().min(1, 'Case ID is required'),
  name: z.string().min(1, 'Document name is required').max(100),
  type: z.enum(['CONTRACT', 'EVIDENCE', 'CORRESPONDENCE', 'COURT_FILING', 'LEGAL_MEMO', 'OTHER']),
  description: z.string().max(500).optional(),
  fileUrl: z.string().url('Invalid file URL').optional(),
  content: z.string().optional(),
});

export const UpdateDocumentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['CONTRACT', 'EVIDENCE', 'CORRESPONDENCE', 'COURT_FILING', 'LEGAL_MEMO', 'OTHER']).optional(),
  description: z.string().max(500).optional(),
  content: z.string().optional(),
});

export const CreateTimelineEventSchema = z.object({
  caseId: z.string().min(1, 'Case ID is required'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(1000).optional(),
  eventDate: z.string().datetime(), // ISO string
  eventType: z.enum(['FILING', 'HEARING', 'MEETING', 'DEADLINE', 'MILESTONE', 'NOTE']),
  isImportant: z.boolean().default(false),
});

export const UpdateTimelineEventSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  eventDate: z.string().datetime().optional(),
  eventType: z.enum(['FILING', 'HEARING', 'MEETING', 'DEADLINE', 'MILESTONE', 'NOTE']).optional(),
  isImportant: z.boolean().optional(),
});

export const CaseFiltersSchema = z.object({
  status: z.enum(['ACTIVE', 'ON_HOLD', 'CLOSED', 'ARCHIVED']).optional(),
  caseType: z.enum(['CIVIL', 'CRIMINAL', 'FAMILY', 'CORPORATE', 'CONSTITUTIONAL', 'EMPLOYMENT', 'REAL_ESTATE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  clientId: z.string().optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
});

export const CaseSearchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'CLOSED', 'ARCHIVED']).optional(),
  caseType: z.enum(['CIVIL', 'CRIMINAL', 'FAMILY', 'CORPORATE', 'CONSTITUTIONAL', 'EMPLOYMENT', 'REAL_ESTATE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  clientId: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10),
});

// Infer types from schemas
export type CreateCaseData = z.infer<typeof CreateCaseSchema>;
export type UpdateCaseData = z.infer<typeof UpdateCaseSchema>;
export type CreateDocumentData = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentData = z.infer<typeof UpdateDocumentSchema>;
export type CreateTimelineEventData = z.infer<typeof CreateTimelineEventSchema>;
export type UpdateTimelineEventData = z.infer<typeof UpdateTimelineEventSchema>;
export type CaseFiltersData = z.infer<typeof CaseFiltersSchema>;
export type CaseSearchData = z.infer<typeof CaseSearchSchema>;