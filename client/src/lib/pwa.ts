// PWA Registration and Utilities



// Service Worker Registration
export async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      // Registrar Service Worker nativo
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registrado com sucesso:', registration.scope);

      // Listener para atualizações do Service Worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível
              if (confirm('Nova versão disponível! Deseja atualizar agora?')) {
                newWorker.postMessage({ action: 'skipWaiting' });
                window.location.reload();
              }
            }
          });
        }
      });

      // Listener para quando o Service Worker assumir controle
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

    } catch (error) {
      console.log('Falha ao registrar Service Worker:', error);
    }
  }
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
  
  // Configurar listeners de rede
  setupNetworkListener();
  
  // Inicializar armazenamento offline
  await offlineStorage.init();
  
  console.log('PWA inicializado com sucesso');
}