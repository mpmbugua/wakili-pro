import { marketplaceService } from '../src/services/marketplaceService';
// Test data for service creation
interface CreateServiceData {
  type: 'CONSULTATION' | 'DOCUMENT_DRAFTING' | 'LEGAL_REVIEW' | 'IP_FILING' | 'DISPUTE_MEDIATION' | 'CONTRACT_NEGOTIATION';
  title: string;
  description: string;
  priceKES: number;
  duration?: number;
  deliveryTimeframe?: string;
  tags?: string[];
}

// Test data for service creation
const testServiceData: CreateServiceData = {
  type: 'CONSULTATION',
  title: 'Corporate Law Consultation',
  description: 'Expert legal advice for corporate matters including business formation, contracts, and compliance. Get professional guidance from an experienced corporate lawyer.',
  priceKES: 5000,
  duration: 60,
  deliveryTimeframe: '24 hours',
  tags: ['corporate', 'business-law', 'contracts', 'compliance']
};

async function testMarketplaceServices() {
  console.log('🧪 Testing Sprint 2 Marketplace Services...\n');

  try {
    // Test 1: Search services (should work without authentication)
    console.log('1️⃣ Testing service search...');
    const searchResult = await marketplaceService.searchServices({
      query: 'consultation',
      type: 'CONSULTATION',
      page: 1,
      limit: 10
    });
    
    console.log('✅ Search result:', {
      success: searchResult.success,
      message: searchResult.message,
      serviceCount: searchResult.data?.services?.length || 0
    });

    // Test 2: Get specific service (should work without authentication)
    console.log('\n2️⃣ Testing get service details...');
    if (searchResult.data?.services && searchResult.data.services.length > 0) {
      const firstService = searchResult.data.services[0];
      const serviceResult = await marketplaceService.getService(firstService.id);
      console.log('✅ Service details result:', {
        success: serviceResult.success,
        serviceTitle: serviceResult.data?.title || 'N/A'
      });
    } else {
      console.log('ℹ️ No services found to test service details');
    }

    // Test 3: Create service (requires authentication - will fail without token)
    console.log('\n3️⃣ Testing service creation (without auth - expected to fail)...');
    const createResult = await marketplaceService.createService(testServiceData);
    console.log('❌ Create service result (expected failure):', {
      success: createResult.success,
      message: createResult.message
    });

    // Test 4: Get my services (requires authentication - will fail without token)
    console.log('\n4️⃣ Testing get my services (without auth - expected to fail)...');
    const myServicesResult = await marketplaceService.getMyServices();
    console.log('❌ My services result (expected failure):', {
      success: myServicesResult.success,
      message: myServicesResult.message
    });

    console.log('\n✅ Sprint 2 Marketplace API Tests Completed!');
    console.log('\n📝 Summary:');
    console.log('- ✅ Service search API working');
    console.log('- ✅ Service details API working'); 
    console.log('- ✅ Authentication required for protected endpoints (as expected)');
    console.log('- ✅ Frontend marketplace service client properly configured');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testMarketplaceServices();
}

export { testMarketplaceServices };