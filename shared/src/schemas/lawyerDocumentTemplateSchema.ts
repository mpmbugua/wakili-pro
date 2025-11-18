import { z } from 'zod';

export const LawyerDocumentTemplateSchema = z.object({
  id: z.string(),
  title: z.string().min(3),
  description: z.string().optional(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  createdBy: z.string(),
  createdAt: z.string(),
});
