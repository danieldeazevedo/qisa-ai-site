import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    const handleNetworkChange = (event: CustomEvent) => {
      const { isOnline: online } = event.detail;
      setIsOnline(online);
      setShowStatus(true);
      
      if (online) {
        setTimeout(() => setShowStatus(false), 3000);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('networkstatuschange', handleNetworkChange as EventListener);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('networkstatuschange', handleNetworkChange as EventListener);
    };
  }, []);

  if (!showStatus && isOnline) {
    return null;
  }

  return (
    <div className={cn(
      "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300",
      showStatus ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
    )}>
      <div className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm",
        isOnline 
          ? "bg-green-500/90 text-white" 
          : "bg-orange-500/90 text-white"
      )}>
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            Conexão restaurada
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            Modo offline ativo
          </>
        )}
      </div>
    </div>
  );
}