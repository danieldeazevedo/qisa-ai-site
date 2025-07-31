// Ping service to prevent Vercel hibernation

export class PingService {
  private static instance: PingService;
  private pingInterval: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL = 13 * 60 * 1000; // 13 minutes (Vercel hibernates after 15 min)
  
  private constructor() {}
  
  static getInstance(): PingService {
    if (!PingService.instance) {
      PingService.instance = new PingService();
    }
    return PingService.instance;
  }
  
  start(baseUrl?: string) {
    // Only start ping service in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('🏓 Ping service skipped in development');
      return;
    }
    
    // Determine the URL to ping
    const pingUrl = baseUrl || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/ping`
      : 'http://localhost:5000/api/ping';
    
    console.log(`🏓 Starting ping service to prevent hibernation: ${pingUrl}`);
    
    // Clear any existing interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // Set up ping interval
    this.pingInterval = setInterval(async () => {
      try {
        console.log('🏓 Sending keep-alive ping...');
        const response = await fetch(pingUrl, {
          method: 'GET',
        });
        
        if (response.ok) {
          console.log('🏓 Keep-alive ping successful');
        } else {
          console.warn('🏓 Keep-alive ping failed:', response.status);
        }
      } catch (error) {
        console.error('🏓 Keep-alive ping error:', error);
      }
    }, this.PING_INTERVAL);
    
    // Initial ping after 1 minute
    setTimeout(async () => {
      try {
        console.log('🏓 Sending initial ping...');
        await fetch(pingUrl, { method: 'GET' });
      } catch (error) {
        console.log('🏓 Initial ping failed (expected in some environments)');
      }
    }, 60000);
  }
  
  stop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      console.log('🏓 Ping service stopped');
    }
  }
}