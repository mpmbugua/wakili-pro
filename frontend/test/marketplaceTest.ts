import { describe, it, expect } from 'vitest';
import { marketplaceService } from '../src/services/marketplaceService';

// Test data for service creation
interface CreateServiceData {
  type: 'CONSULTATION' | 'DOCUMENT_DRAFTING' | 'LEGAL_REVIEW' | 'IP_FILING' | 'DISPUTE_MEDIATION' | 'CONTRACT_NEGOTIATION';
  title: string;
  description: string;
  price: number;
  duration?: number;
  deliveryTimeframe?: string;
  tags?: string[];
}

// Test data for service creation
const testServiceData: CreateServiceData = {
  type: 'CONSULTATION',
  title: 'Corporate Law Consultation',
  description: 'Expert legal advice for corporate matters including business formation, contracts, and compliance. Get professional guidance from an experienced corporate lawyer.',
  price: 5000,
  duration: 60,
  deliveryTimeframe: '24 hours',
  tags: ['corporate', 'business-law', 'contracts', 'compliance']
};

describe('Marketplace Service', () => {
  it('should search for services', async () => {
    const searchResult = await marketplaceService.searchServices({
      query: 'consultation',
      type: 'CONSULTATION',
      page: 1,
      limit: 10
    });
    expect(searchResult.success).toBe(true);
    expect(searchResult.data?.services).toBeDefined();
    expect(Array.isArray(searchResult.data?.services)).toBe(true);
  });

  it('should create a new service', async () => {
    const createResult = await marketplaceService.createService(testServiceData);
    expect(createResult.success).toBe(true);
    expect(createResult.data).toBeDefined();
    expect(createResult.data?.title).toBe(testServiceData.title);
  });
});