import { useState, useEffect } from 'react';
import { isPWA, isPWASupported, requestNotificationPermission } from '@/lib/pwa';

export function usePWA() {
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [isPWASupportedBrowser, setIsPWASupportedBrowser] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setIsPWAInstalled(isPWA());
    setIsPWASupportedBrowser(isPWASupported());
    
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    return permission;
  };

  return {
    isPWAInstalled,
    isPWASupportedBrowser,
    notificationPermission,
    requestNotifications
  };
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}