// Client-side ping service to complement server-side keep-alive
export class ClientPingService {
  private static instance: ClientPingService;
  private pingInterval: number | null = null;
  private readonly PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
  
  private constructor() {}
  
  static getInstance(): ClientPingService {
    if (!ClientPingService.instance) {
      ClientPingService.instance = new ClientPingService();
    }
    return ClientPingService.instance;
  }
  
  start() {
    // Only start in production
    if (import.meta.env.MODE !== 'production') {
      console.log('🏓 Client ping service skipped in development');
      return;
    }
    
    console.log('🏓 Starting client-side ping service');
    
    // Clear any existing interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // Set up ping interval
    this.pingInterval = window.setInterval(async () => {
      try {
        console.log('🏓 Sending client keep-alive ping...');
        const response = await fetch('/api/ping', {
          method: 'GET',
        });
        
        if (response.ok) {
          console.log('🏓 Client keep-alive ping successful');
        } else {
          console.warn('🏓 Client keep-alive ping failed:', response.status);
        }
      } catch (error) {
        console.error('🏓 Client keep-alive ping error:', error);
      }
    }, this.PING_INTERVAL);
    
    // Initial ping after 2 minutes
    setTimeout(async () => {
      try {
        console.log('🏓 Sending initial client ping...');
        await fetch('/api/ping', { method: 'GET' });
      } catch (error) {
        console.log('🏓 Initial client ping failed');
      }
    }, 120000);
  }
  
  stop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      console.log('🏓 Client ping service stopped');
    }
  }
  
  // Ping on user activity to show the app is active
  pingOnActivity() {
    if (import.meta.env.MODE !== 'production') return;
    
    try {
      fetch('/api/ping', { method: 'GET' }).catch(() => {
        // Silent fail for activity pings
      });
    } catch (error) {
      // Silent fail
    }
  }
}