import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  socket: {
    reconnectStrategy: false // Disable reconnection
  }
});

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