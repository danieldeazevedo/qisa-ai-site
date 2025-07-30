import { Redis } from '@upstash/redis';

// Upstash Redis configuration
const redisUrl = process.env.REDIS_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

console.log('🔗 Redis URL configured:', redisUrl ? 'Yes' : 'No');
console.log('🔑 Redis Token configured:', redisToken ? 'Yes' : 'No');

// Create Upstash Redis client
let client: Redis | null = null;

if (redisUrl && redisToken) {
  client = new Redis({
    url: redisUrl,
    token: redisToken,
  });
  console.log('✅ Upstash Redis client initialized');
} else {
  console.log('❌ Missing Redis credentials - using fallback mode');
}

// Test connection function
const connectRedis = async () => {
  if (!client) {
    throw new Error('Redis client not configured');
  }
  
  try {
    // Test the connection with a simple ping
    const result = await client.ping();
    console.log('✅ Redis connection test successful:', result);
    return true;
  } catch (error: any) {
    console.log('❌ Redis connection test failed:', error.message);
    throw new Error('Redis unavailable');
  }
};

export { client, connectRedis };