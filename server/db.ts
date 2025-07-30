import { createClient } from 'redis';

// Parse Redis URL for different formats (Upstash vs local)
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

console.log('🔗 Redis URL format:', redisUrl.substring(0, 15) + '...');

let clientConfig: any = {
  socket: {
    reconnectStrategy: false // Disable reconnection
  }
};

// Check if URL is incorrect format (HTTP/HTTPS instead of Redis protocol)
if (redisUrl.startsWith('http://') || redisUrl.startsWith('https://')) {
  console.log('❌ Invalid Redis URL format detected!');
  console.log('💡 Expected: redis://... or rediss://...');
  console.log('💡 Got: ' + redisUrl.substring(0, 30) + '...');
  console.log('📝 Please update REDIS_URL with the Redis protocol URL, not the REST API URL');
  
  // Force fallback mode
  clientConfig.url = 'redis://invalid-url-forcing-fallback:6379';
} else if (redisUrl.includes('upstash') || redisUrl.startsWith('rediss://')) {
  // Upstash Redis with TLS
  try {
    const url = new URL(redisUrl);
    clientConfig = {
      socket: {
        host: url.hostname,
        port: parseInt(url.port) || 6380,
        tls: url.protocol === 'rediss:',
        reconnectStrategy: false
      },
      password: url.password,
    };
    console.log('🔧 Using Upstash Redis config for:', url.hostname);
  } catch (error) {
    console.log('❌ Invalid Redis URL format');
    clientConfig.url = 'redis://invalid-url:6379';
  }
} else {
  // Local or standard Redis
  clientConfig.url = redisUrl;
  console.log('🔧 Using standard Redis config');
}

const client = createClient(clientConfig);

// Silence Redis errors for now
client.on('error', () => {});

// Initialize Redis connection - but don't throw on failure
let connected = false;
const connectRedis = async () => {
  if (!connected) {
    try {
      await client.connect();
      connected = true;
      console.log('✅ Redis connected successfully to:', process.env.REDIS_URL?.substring(0, 20) + '...');
    } catch (error: any) {
      console.log('❌ Redis connection failed:', error.message);
      console.log('🔄 Using fallback memory storage');
      throw new Error('Redis unavailable');
    }
  }
};

export { client, connectRedis };