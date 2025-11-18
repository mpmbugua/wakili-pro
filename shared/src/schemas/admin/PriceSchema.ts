import { z } from 'zod';

export const PriceSchema = z.object({
  id: z.string(),
  type: z.enum(['subscription', 'document']),
  name: z.string(),
  amount: z.number().min(0),
  currency: z.string().length(3),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
