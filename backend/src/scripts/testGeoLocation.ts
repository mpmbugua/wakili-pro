/**
 * Test script for geolocation service
 * Run: npx ts-node src/scripts/testGeoLocation.ts
 */

import { getLocationFromIP } from '../services/geoLocationService';

async function testGeoLocation() {
  console.log('🧪 Testing IP Geolocation Service\n');

  // Test cases
  const testIPs = [
    { ip: '127.0.0.1', description: 'Localhost (IPv4)' },
    { ip: '::1', description: 'Localhost (IPv6)' },
    { ip: '8.8.8.8', description: 'Google DNS (USA)' },
    { ip: '105.160.0.1', description: 'Kenya IP' },
    { ip: '41.90.0.1', description: 'South Africa IP' },
    { ip: '102.0.0.1', description: 'Egypt IP' }
  ];

  for (const test of testIPs) {
    console.log(`📍 Testing: ${test.description}`);
    console.log(`   IP: ${test.ip}`);
    
    try {
      const location = await getLocationFromIP(test.ip);
      console.log(`   ✅ Result: ${location.city}, ${location.country}`);
      if (location.countryCode) {
        console.log(`   Code: ${location.countryCode}`);
      }
      if (location.timezone) {
        console.log(`   Timezone: ${location.timezone}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
    
    console.log('');
  }

  console.log('✅ Test completed!');
}

testGeoLocation().catch(console.error);
