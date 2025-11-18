import { describe, it, expect } from 'vitest';
import { marketplaceService } from '../services/marketplaceService';

const testServiceData = {
  title: 'Corporate Law Consultation',
  description: 'Expert legal advice for corporate matters including business formation, contracts, and compliance. Get professional guidance from an experienced corporate lawyer.',
  price: 5000
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
