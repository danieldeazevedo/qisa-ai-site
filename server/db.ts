import { createClient } from 'redis';

// Parse Redis URL for different formats (Upstash vs local)
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let clientConfig: any = {
  socket: {
    reconnectStrategy: false // Disable reconnection
  }
};

// If it's an Upstash URL (starts with rediss:// or contains upstash), parse it differently
if (redisUrl.includes('upstash') || redisUrl.startsWith('rediss://')) {
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
} else {
  clientConfig.url = redisUrl;
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
      console.log('Redis connected successfully');
    } catch (error) {
      // Silently fail and use fallback
      throw new Error('Redis unavailable');
    }
  }
};

export { client, connectRedis };