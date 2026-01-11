// Service Worker pour les notifications Push - ifiMoney
// Ce fichier doit être placé à la racine du dossier public

const CACHE_NAME = 'ifimoney-v1';
const OFFLINE_URL = '/offline.html';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache ouvert');
      return cache.addAll([
        '/',
        '/offline.html',
        '/manifest.json',
      ]);
    })
  );
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Réception des notifications Push
self.addEventListener('push', (event) => {
  console.log('[SW] Notification Push reçue');

  let data = {
    title: 'ifiMoney',
    body: 'Vous avez une nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        ...data,
        ...payload,
      };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'ifimoney-notification',
    renotify: true,
    requireInteraction: data.priority === 'urgent',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur une notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Clic sur notification');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Vérifier si une fenêtre est déjà ouverte
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Fermeture d'une notification
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification fermée');
  // On pourrait envoyer une analytique ici
});

// Fetch avec stratégie Network First (pour les API), Cache First (pour les assets)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;

  // Ignorer les requêtes vers Supabase et autres APIs
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Mettre en cache les réponses réussies
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // En cas d'erreur réseau, essayer le cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si c'est une navigation, montrer la page offline
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Synchronisation en arrière-plan (pour les notifications planifiées)
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      // Logique de synchronisation des notifications
      Promise.resolve()
    );
  }
});

// Message depuis l'application principale
self.addEventListener('message', (event) => {
  console.log('[SW] Message reçu:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
