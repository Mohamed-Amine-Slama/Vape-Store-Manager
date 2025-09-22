const CACHE_NAME = 'vape-store-manager-v1.0.1'
const STATIC_CACHE_NAME = 'vape-store-static-v1.0.1'
const DYNAMIC_CACHE_NAME = 'vape-store-dynamic-v1.0.1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  // Add other critical assets here
]

// Assets to cache on first request
const DYNAMIC_ASSETS = [
  '/src/',
  '/assets/',
  '/api/'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated successfully')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  const request = event.request
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return
  }
  
  // Skip caching in development mode (localhost) and for critical app files
  if (request.url.includes('localhost') || request.url.includes('127.0.0.1')) {
    event.respondWith(fetch(request))
    return
  }
  
  // Also skip caching for main app files that need to be fresh
  if (request.url.includes('/src/') || 
      request.url.includes('main.jsx') || 
      request.url.includes('App.jsx') ||
      request.url.includes('AuthContext.jsx') ||
      request.url.includes('LoadingScreen.jsx')) {
    event.respondWith(fetch(request))
    return
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache:', request.url)
          return cachedResponse
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse
            }
            
            // Clone the response before caching
            const responseToCache = networkResponse.clone()
            
            // Determine which cache to use
            let cacheName = DYNAMIC_CACHE_NAME
            
            // Cache static assets in static cache
            if (STATIC_ASSETS.includes(url.pathname) || 
                url.pathname.includes('.js') || 
                url.pathname.includes('.css') || 
                url.pathname.includes('.png') || 
                url.pathname.includes('.jpg') || 
                url.pathname.includes('.svg')) {
              cacheName = STATIC_CACHE_NAME
            }
            
            caches.open(cacheName)
              .then((cache) => {
                console.log('Service Worker: Caching new resource:', request.url)
                cache.put(request, responseToCache)
              })
            
            return networkResponse
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed:', error)
            
            // Return offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match('/offline.html')
            }
            
            // Return a generic offline response
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            })
          })
      })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from Vape Store Manager',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/pwa-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/pwa-192x192.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('Vape Store Manager', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event.action)
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Helper function for background sync
async function doBackgroundSync() {
  try {
    // Implement background sync logic here
    console.log('Service Worker: Performing background sync')
    
    // Example: sync offline data
    const offlineData = await getOfflineData()
    if (offlineData.length > 0) {
      await syncOfflineData(offlineData)
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error)
  }
}

// Helper functions
async function getOfflineData() {
  // Implement logic to get offline data from IndexedDB
  return []
}

async function syncOfflineData(data) {
  // Implement logic to sync offline data with server
  console.log('Service Worker: Syncing offline data:', data)
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})
