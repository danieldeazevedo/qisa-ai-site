const CACHE_NAME = 'qisa-v1';
const STATIC_CACHE_NAME = 'qisa-static-v1';
const DYNAMIC_CACHE_NAME = 'qisa-dynamic-v1';

// Cache estratégico para diferentes tipos de recursos
const CACHE_STRATEGY = {
  // Recursos estáticos (HTML, CSS, JS, imagens)
  static: [
    '/',
    '/manifest.webmanifest',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/apple-touch-icon.png'
  ],
  // API calls que podem ser cachadas
  api: [
    '/api/auth/check',
    '/api/system/config'
  ],
  // Recursos que devem sempre buscar da rede primeiro
  networkFirst: [
    '/api/chat/send',
    '/api/chat/sessions',
    '/api/auth/login',
    '/api/auth/register'
  ]
};

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache recursos estáticos
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(CACHE_STRATEGY.static);
      }),
      // Pular espera para ativar imediatamente
      self.skipWaiting()
    ])
  );
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Assumir controle de todas as páginas
      self.clients.claim()
    ])
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests não HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }

  // Estratégia para API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Estratégia para recursos estáticos
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Para outros requests, usar cache first
  event.respondWith(handleDefaultRequest(request));
});

// Manipular requests de API
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Para requests críticos, sempre tentar rede primeiro
  if (CACHE_STRATEGY.networkFirst.some(path => url.pathname.startsWith(path))) {
    try {
      const networkResponse = await fetch(request);
      
      // Cache apenas respostas bem-sucedidas
      if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      console.log('Network failed for critical API, trying cache:', error);
      const cachedResponse = await caches.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Retornar resposta offline se disponível
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'Você está offline. Algumas funcionalidades podem não estar disponíveis.' 
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // Para outros APIs, tentar cache primeiro
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Buscar atualização em background
    fetch(request).then(response => {
      if (response.ok) {
        const cache = caches.open(DYNAMIC_CACHE_NAME);
        cache.then(c => c.put(request, response));
      }
    }).catch(() => {});
    
    return cachedResponse;
  }

  // Se não há cache, buscar da rede
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Você está offline. Algumas funcionalidades podem não estar disponíveis.' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Manipular requests estáticos
async function handleStaticRequest(request) {
  // Tentar cache primeiro
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Se não há cache, buscar da rede e cachear
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Para documentos HTML, retornar página offline
    if (request.destination === 'document') {
      const offlineResponse = await caches.match('/');
      return offlineResponse || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Manipular outros requests
async function handleDefaultRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache recursos GET bem-sucedidos
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background sync para mensagens offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncOfflineMessages());
  }
});

// Sincronizar mensagens offline
async function syncOfflineMessages() {
  try {
    // Obter mensagens pendentes do IndexedDB
    const pendingMessages = await getOfflineMessages();
    
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          await removeOfflineMessage(message.id);
        }
      } catch (error) {
        console.log('Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Funções auxiliares para IndexedDB (implementação básica)
async function getOfflineMessages() {
  // Implementar busca no IndexedDB
  return [];
}

async function removeOfflineMessage(messageId) {
  // Implementar remoção do IndexedDB
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Qisa', options)
  );
});

// Manipular cliques em notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});