// PWA Registration and Utilities
import { Workbox } from 'workbox-window';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Service Worker Registration
export async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      // Use Workbox for better Service Worker management
      const wb = new Workbox('/sw.js');

      // Listener para atualizações do Service Worker
      wb.addEventListener('waiting', (event) => {
        // Mostrar notificação para o usuário sobre atualização disponível
        if (confirm('Nova versão disponível! Deseja atualizar agora?')) {
          wb.messageSkipWaiting();
          window.location.reload();
        }
      });

      // Listener para quando o Service Worker assumir controle
      wb.addEventListener('controlling', () => {
        window.location.reload();
      });

      // Registrar o Service Worker
      await wb.register();
      console.log('Service Worker registrado com sucesso');
    } catch (error) {
      console.log('Falha ao registrar Service Worker:', error);
    }
  }
}

// PWA Install Prompt
let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function setupPWAInstall(): void {
  // Capturar o evento beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    // Mostrar botão de instalação customizado
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'block';
    }
  });

  // Listener para quando o app for instalado
  window.addEventListener('appinstalled', () => {
    console.log('PWA instalado com sucesso');
    deferredPrompt = null;
    
    // Esconder botão de instalação
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  });
}

export async function installPWA(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }

  try {
    // Mostrar prompt de instalação
    await deferredPrompt.prompt();
    
    // Aguardar escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuário aceitou instalar o PWA');
      return true;
    } else {
      console.log('Usuário rejeitou instalar o PWA');
      return false;
    }
  } catch (error) {
    console.error('Erro ao tentar instalar PWA:', error);
    return false;
  } finally {
    deferredPrompt = null;
  }
}

// Verificar se o app está sendo executado como PWA
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
}

// Verificar se o navegador suporta PWA
export function isPWASupported(): boolean {
  return 'serviceWorker' in navigator && 'Cache' in window;
}

// Utilitário para notificações push
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('Este navegador não suporta notificações');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

// Mostrar notificação local
export function showLocalNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...options
    });
  }
}

// Gerenciamento de armazenamento offline
export class OfflineStorage {
  private dbName = 'qisa-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store para mensagens offline
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
          messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
          messagesStore.createIndex('sessionId', 'sessionId', { unique: false });
        }

        // Store para configurações
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async saveOfflineMessage(message: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      
      const request = store.add({
        ...message,
        id: Date.now().toString(),
        timestamp: Date.now(),
        offline: true
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineMessages(): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearOfflineMessages(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Instância global do armazenamento offline
export const offlineStorage = new OfflineStorage();

// Verificar conexão de rede
export function setupNetworkListener(): void {
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;
    
    // Disparar evento customizado
    window.dispatchEvent(new CustomEvent('networkstatuschange', {
      detail: { isOnline }
    }));

    // Adicionar/remover classe no body
    document.body.classList.toggle('offline', !isOnline);

    if (isOnline) {
      console.log('Conexão restaurada');
      // Tentar sincronizar dados offline
      syncOfflineData();
    } else {
      console.log('Conexão perdida - modo offline ativo');
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Verificar status inicial
  updateOnlineStatus();
}

// Sincronizar dados offline quando a conexão for restaurada
async function syncOfflineData(): Promise<void> {
  try {
    const messages = await offlineStorage.getOfflineMessages();
    
    for (const message of messages) {
      try {
        const response = await fetch('/api/chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message)
        });

        if (response.ok) {
          // Remover mensagem sincronizada
          // Implementar remoção individual se necessário
        }
      } catch (error) {
        console.log('Falha ao sincronizar mensagem:', error);
      }
    }

    // Se todas as mensagens foram sincronizadas, limpar storage
    await offlineStorage.clearOfflineMessages();
  } catch (error) {
    console.log('Erro durante sincronização offline:', error);
  }
}

// Inicializar PWA
export async function initializePWA(): Promise<void> {
  // Registrar Service Worker
  await registerServiceWorker();
  
  // Configurar instalação PWA
  setupPWAInstall();
  
  // Configurar listeners de rede
  setupNetworkListener();
  
  // Inicializar armazenamento offline
  await offlineStorage.init();
  
  console.log('PWA inicializado com sucesso');
}