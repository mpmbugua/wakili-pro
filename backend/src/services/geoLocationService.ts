/**
 * IP Geolocation Service
 * Uses ip-api.com (free tier: 45 requests/minute)
 * Enriches analytics data with country and city information
 */

interface GeoLocationData {
  country: string;
  city: string;
  regionName?: string;
  countryCode?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
}

interface IpApiResponse {
  status: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  message?: string;
}

// In-memory cache to avoid repeated API calls for same IP
const geoLocationCache = new Map<string, GeoLocationData>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const cacheTimestamps = new Map<string, number>();

/**
 * Get geographic location from IP address
 * Uses free ip-api.com service with caching
 */
export const getLocationFromIP = async (ipAddress: string | null): Promise<GeoLocationData> => {
  // Default fallback
  const defaultLocation: GeoLocationData = {
    country: 'Unknown',
    city: 'Unknown'
  };

  if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.startsWith('::ffff:127.')) {
    // Localhost - use Kenya as default for development
    return {
      country: 'Kenya',
      city: 'Nairobi',
      countryCode: 'KE',
      regionName: 'Nairobi',
      timezone: 'Africa/Nairobi'
    };
  }

  // Clean IPv6-mapped IPv4 addresses (::ffff:192.168.1.1 -> 192.168.1.1)
  const cleanIP = ipAddress.replace(/^::ffff:/, '');

  // Check cache first
  const cached = geoLocationCache.get(cleanIP);
  const cacheTime = cacheTimestamps.get(cleanIP);
  
  if (cached && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
    return cached;
  }

  try {
    // Call ip-api.com (free tier)
    const response = await fetch(`http://ip-api.com/json/${cleanIP}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });

    if (!response.ok) {
      console.warn(`[GeoLocation] API request failed: ${response.status}`);
      return defaultLocation;
    }

    const data: IpApiResponse = await response.json();

    if (data.status === 'fail') {
      console.warn(`[GeoLocation] API returned failure: ${data.message}`);
      return defaultLocation;
    }

    const locationData: GeoLocationData = {
      country: data.country || 'Unknown',
      city: data.city || 'Unknown',
      regionName: data.regionName,
      countryCode: data.countryCode,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
      isp: data.isp
    };

    // Cache the result
    geoLocationCache.set(cleanIP, locationData);
    cacheTimestamps.set(cleanIP, Date.now());

    return locationData;

  } catch (error) {
    if (error instanceof Error) {
      console.warn(`[GeoLocation] Error fetching location for ${cleanIP}:`, error.message);
    }
    return defaultLocation;
  }
};

/**
 * Get location for multiple IPs in batch
 * Useful for enriching historical data
 */
export const batchGetLocations = async (ipAddresses: string[]): Promise<Map<string, GeoLocationData>> => {
  const results = new Map<string, GeoLocationData>();
  
  // Process in batches to respect rate limits (45 req/min)
  const BATCH_SIZE = 40;
  const BATCH_DELAY = 60000; // 1 minute

  for (let i = 0; i < ipAddresses.length; i += BATCH_SIZE) {
    const batch = ipAddresses.slice(i, i + BATCH_SIZE);
    
    const promises = batch.map(async (ip) => {
      const location = await getLocationFromIP(ip);
      results.set(ip, location);
    });

    await Promise.all(promises);

    // Wait between batches if there are more
    if (i + BATCH_SIZE < ipAddresses.length) {
      console.log(`[GeoLocation] Processed ${i + BATCH_SIZE}/${ipAddresses.length} IPs. Waiting 1 minute...`);
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }

  return results;
};

/**
 * Clear expired cache entries
 * Call this periodically to prevent memory bloat
 */
export const cleanupCache = (): void => {
  const now = Date.now();
  let cleaned = 0;

  for (const [ip, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp > CACHE_DURATION) {
      geoLocationCache.delete(ip);
      cacheTimestamps.delete(ip);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[GeoLocation] Cleaned ${cleaned} expired cache entries`);
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: geoLocationCache.size,
    oldestEntry: Math.min(...Array.from(cacheTimestamps.values())),
    newestEntry: Math.max(...Array.from(cacheTimestamps.values()))
  };
};
