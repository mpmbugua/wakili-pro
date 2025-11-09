import { z } from 'zod';

export const CreateAIQuerySchema = z.object({
  query: z.string().min(5, 'Query must be at least 5 characters').max(2000),
  type: z.enum(['LEGAL_ADVICE', 'CASE_RESEARCH', 'DOCUMENT_ANALYSIS', 'CONTRACT_REVIEW', 'LEGAL_WRITING']),
  context: z.string().max(5000).optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  includeReferences: z.boolean().default(true),
});

export const CreateDocumentGenerationSchema = z.object({
  type: z.enum(['CONTRACT', 'WILL', 'POWER_OF_ATTORNEY', 'COMPANY_RESOLUTION', 'LEASE_AGREEMENT', 'EMPLOYMENT_CONTRACT', 'NDA', 'PARTNERSHIP_AGREEMENT']),
  parameters: z.record(z.any()), // Dynamic based on document type
  clientName: z.string().min(1, 'Client name is required').max(100),
  customRequirements: z.string().max(1000).optional(),
});

export const LegalResearchSchema = z.object({
  query: z.string().min(10, 'Research query must be at least 10 characters').max(1000),
  jurisdiction: z.enum(['KENYA', 'UGANDA', 'TANZANIA', 'RWANDA', 'BURUNDI', 'SOUTH_SUDAN', 'EAC']).default('KENYA'),
  searchDepth: z.enum(['BASIC', 'COMPREHENSIVE', 'EXHAUSTIVE']).default('BASIC'),
  includeStatutes: z.boolean().default(true),
  includeCaselaw: z.boolean().default(true),
  includeRegulations: z.boolean().default(true),
  maxResults: z.number().min(5).max(100).default(20),
});

export const ContractAnalysisSchema = z.object({
  contractText: z.string().min(100, 'Contract text must be at least 100 characters').max(50000),
  analysisType: z.enum(['RISK_ASSESSMENT', 'CLAUSE_REVIEW', 'COMPLIANCE_CHECK', 'FAIR_TERMS_ANALYSIS']),
  jurisdiction: z.enum(['KENYA', 'UGANDA', 'TANZANIA', 'RWANDA', 'BURUNDI', 'SOUTH_SUDAN', 'EAC']).default('KENYA'),
  contractType: z.enum(['EMPLOYMENT', 'SERVICE', 'SALE', 'LEASE', 'PARTNERSHIP', 'NDA', 'OTHER']).optional(),
  focusAreas: z.array(z.string()).optional(),
});

export const UpdateAIQuerySchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().max(1000).optional(),
  isUseful: z.boolean().optional(),
});

export const AIQueryFiltersSchema = z.object({
  type: z.enum(['LEGAL_ADVICE', 'CASE_RESEARCH', 'DOCUMENT_ANALYSIS', 'CONTRACT_REVIEW', 'LEGAL_WRITING']).optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
});

export const LegalTemplateSchema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters').max(100),
  type: z.enum(['CONTRACT', 'WILL', 'POWER_OF_ATTORNEY', 'COMPANY_RESOLUTION', 'LEASE_AGREEMENT', 'EMPLOYMENT_CONTRACT', 'NDA', 'PARTNERSHIP_AGREEMENT']),
  content: z.string().min(50, 'Template content must be at least 50 characters').max(20000),
  fields: z.array(z.object({
    name: z.string().min(1).max(50),
    type: z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(), // For SELECT type
    placeholder: z.string().optional(),
  })),
  jurisdiction: z.enum(['KENYA', 'UGANDA', 'TANZANIA', 'RWANDA', 'BURUNDI', 'SOUTH_SUDAN', 'EAC']).default('KENYA'),
  isPublic: z.boolean().default(false),
});

// Infer types from schemas
export type CreateAIQueryData = z.infer<typeof CreateAIQuerySchema>;
export type CreateDocumentGenerationData = z.infer<typeof CreateDocumentGenerationSchema>;
export type LegalResearchData = z.infer<typeof LegalResearchSchema>;
export type ContractAnalysisData = z.infer<typeof ContractAnalysisSchema>;
export type UpdateAIQueryData = z.infer<typeof UpdateAIQuerySchema>;
export type AIQueryFiltersData = z.infer<typeof AIQueryFiltersSchema>;
export type LegalTemplateData = z.infer<typeof LegalTemplateSchema>;