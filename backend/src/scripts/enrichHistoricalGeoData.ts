/**
 * Script to enrich historical analytics data with geographic information
 * Run this once to backfill country/city for existing PageView and UserSession records
 * 
 * Usage: npx ts-node src/scripts/enrichHistoricalGeoData.ts
 */

import { prisma } from '../utils/database';
import { getLocationFromIP, batchGetLocations } from '../services/geoLocationService';

async function enrichHistoricalData() {
  console.log('🌍 Starting historical geographic data enrichment...\n');

  try {
    // 1. Enrich PageView records
    console.log('📄 Enriching PageView records...');
    const pageViewsWithoutGeo = await prisma.pageView.findMany({
      where: {
        OR: [
          { country: null },
          { country: 'Unknown' }
        ],
        ipAddress: { not: null }
      },
      select: {
        id: true,
        ipAddress: true
      },
      take: 1000 // Process in batches
    });

    console.log(`Found ${pageViewsWithoutGeo.length} PageView records to enrich`);

    if (pageViewsWithoutGeo.length > 0) {
      // Get unique IPs
      const uniqueIPs = [...new Set(pageViewsWithoutGeo.map(pv => pv.ipAddress!))];
      console.log(`Processing ${uniqueIPs.length} unique IP addresses...`);

      // Batch fetch locations
      const ipLocationMap = await batchGetLocations(uniqueIPs);

      // Update records
      let updatedPageViews = 0;
      for (const pageView of pageViewsWithoutGeo) {
        if (!pageView.ipAddress) continue;

        const location = ipLocationMap.get(pageView.ipAddress);
        if (location) {
          await prisma.pageView.update({
            where: { id: pageView.id },
            data: {
              country: location.country,
              city: location.city
            }
          });
          updatedPageViews++;
        }
      }

      console.log(`✅ Updated ${updatedPageViews} PageView records with geographic data\n`);
    }

    // 2. Enrich UserSession records
    console.log('👤 Enriching UserSession records...');
    const sessionsWithoutGeo = await prisma.userSession.findMany({
      where: {
        OR: [
          { country: null },
          { country: 'Unknown' }
        ]
      },
      select: {
        sessionId: true
      },
      take: 1000
    });

    console.log(`Found ${sessionsWithoutGeo.length} UserSession records to enrich`);

    if (sessionsWithoutGeo.length > 0) {
      let updatedSessions = 0;
      for (const session of sessionsWithoutGeo) {
        // Get first PageView from this session to extract IP
        const firstPageView = await prisma.pageView.findFirst({
          where: { sessionId: session.sessionId },
          select: { ipAddress: true },
          orderBy: { createdAt: 'asc' } // Fixed: viewedAt doesn't exist
        });

        if (firstPageView?.ipAddress) {
          const location = await getLocationFromIP(firstPageView.ipAddress);
          await prisma.userSession.update({
            where: { sessionId: session.sessionId },
            data: {
              country: location.country,
              city: location.city
            }
          });
          updatedSessions++;
        }
      }

      console.log(`✅ Updated ${updatedSessions} UserSession records with geographic data\n`);
    }

    // 3. Summary statistics
    console.log('📊 Geographic Distribution Summary:');
    
    const countryStats = await prisma.pageView.groupBy({
      by: ['country'],
      _count: true,
      orderBy: {
        _count: {
          country: 'desc'
        }
      },
      take: 10
    });

    console.log('\nTop 10 Countries by Page Views:');
    countryStats.forEach((stat, index) => {
      console.log(`${index + 1}. ${stat.country}: ${stat._count} views`);
    });

    const cityStats = await prisma.pageView.groupBy({
      by: ['city', 'country'],
      _count: true,
      orderBy: {
        _count: {
          city: 'desc'
        }
      },
      take: 10
    });

    console.log('\nTop 10 Cities by Page Views:');
    cityStats.forEach((stat, index) => {
      console.log(`${index + 1}. ${stat.city}, ${stat.country}: ${stat._count} views`);
    });

    console.log('\n✅ Geographic enrichment completed successfully!');

  } catch (error) {
    console.error('❌ Error enriching historical data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
enrichHistoricalData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
