const VERSION = 'v1.0.0';
const CACHE_NAMES = {
    static: `static-${VERSION}`,
    pages: `pages-${VERSION}`,
    api: `api-${VERSION}`,
};

const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
    '/',
    '/index.html',
    OFFLINE_URL,
    '/manifest.json',
];

// Simple route matching for patterns like '/dashboard/classes-v2/container/:id'
function matchRoute(pathname, pattern) {
    if (pattern.includes(':')) {
        const pParts = pattern.split('/').filter(Boolean);
        const uParts = pathname.split('/').filter(Boolean);
        if (pParts.length !== uParts.length) return false;
        return pParts.every((part, i) => part.startsWith(':') || part === uParts[i]);
    }
    if (pattern.includes('*')) return pathname.startsWith(pattern.replace('*', ''));
    return pathname === pattern;
}

// IndexedDB helpers for background queue
const DB_NAME = 'yogique-sw-queue';
const DB_STORE = 'requests';

function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: 'id' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function enqueueRequest(entry) {
    const db = await openDb();
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(entry);
    return tx.complete;
}

async function getQueuedRequests() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readonly');
        const store = tx.objectStore(DB_STORE);
        const all = store.getAll();
        all.onsuccess = () => resolve(all.result || []);
        all.onerror = () => reject(all.error);
    });
}

async function deleteQueuedRequest(id) {
    const db = await openDb();
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(id);
    return tx.complete;
}

// Caching strategies
async function cacheFirst(request, cacheName, maxAge = 300) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response && response.ok) cache.put(request, response.clone());
        return response;
    } catch (err) {
        return caches.match(OFFLINE_URL);
    }
}

async function networkFirst(request, cacheName, maxAge = 60) {
    const cache = await caches.open(cacheName);
    try {
        const response = await fetch(request);
        if (response && response.ok) cache.put(request, response.clone());
        return response;
    } catch (err) {
        const cached = await cache.match(request);
        if (cached) return cached;
        return caches.match(OFFLINE_URL);
    }
}

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    const fetchPromise = fetch(request)
        .then((response) => {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
        })
        .catch(() => { });
    return cached || fetchPromise;
}

async function networkOnly(request) {
    try {
        return await fetch(request);
    } catch (err) {
        // Enqueue for background sync
        const body = request.clone().text ? await request.clone().text() : null;
        const entry = {
            id: `${Date.now()}-${Math.random()}`,
            url: request.url,
            method: request.method,
            headers: Array.from(request.headers.entries()),
            body,
            timestamp: Date.now(),
        };
        try {
            await enqueueRequest(entry);
            // Try to register sync
            if (self.registration && self.registration.sync) {
                await self.registration.sync.register('sync-offline-queue');
            }
        } catch (e) {
            // ignore
        }
        return new Response(JSON.stringify({ queued: true }), { status: 202, headers: { 'Content-Type': 'application/json' } });
    }
}

// Route and API configs (kept minimal and extensible)
const ROUTES_CONFIG = {
    precache: ['/dashboard/classes-v2', '/dashboard/classes-v2/containers', OFFLINE_URL, '/manifest.json'],
    cacheFirst: ['/dashboard/classes-v2/container/:id', '/dashboard/classes-v2/assignments', '/dashboard/classes-v2/students'],
    networkFirst: ['/dashboard/bookings', '/dashboard/classes-v2/calendar', '/dashboard/classes-v2/analytics'],
    networkOnly: ['/dashboard/classes-v2/create', '/dashboard/classes-v2/edit/:id', '/dashboard/classes-v2/settings'],
    static: ['/assets/', '/icons/', '/fonts/'],
};

const API_CACHE_CONFIG = {
    'GET /api/v2/containers': { strategy: 'cache-first', maxAge: 300 },
    'GET /api/v2/containers/:id': { strategy: 'cache-first', maxAge: 300 },
    'GET /api/v2/packages': { strategy: 'cache-first', maxAge: 3600 },
    'GET /api/v2/instructors': { strategy: 'cache-first', maxAge: 1800 },
    'GET /api/v2/assignments': { strategy: 'network-first', maxAge: 120 },
    'GET /api/v2/bookings': { strategy: 'network-first', maxAge: 60 },
};

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAMES.static).then((cache) => cache.addAll(PRECACHE_URLS.concat(ROUTES_CONFIG.precache)))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((k) => !Object.values(CACHE_NAMES).includes(k)).map((k) => caches.delete(k))))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle same-origin
    if (url.origin !== location.origin) return;

    // API requests
    if (url.pathname.startsWith('/api/v2/')) {
        event.respondWith(handleAPIRequest(request));
        return;
    }

    // Static assets
    if (request.destination && ['script', 'style', 'image', 'font'].includes(request.destination)) {
        event.respondWith(cacheFirst(request, CACHE_NAMES.static, 31536000));
        return;
    }

    // Navigation requests
    if (request.mode === 'navigate') {
        event.respondWith(handleNavigation(request));
        return;
    }

    // Fallback: try network, then cache
    event.respondWith(fetch(request).catch(() => caches.match(request)));
});

async function handleAPIRequest(request) {
    const url = new URL(request.url);
    const endpoint = url.pathname;
    const method = request.method;
    const cacheKey = `${method} ${endpoint}`;
    const config = API_CACHE_CONFIG[cacheKey] || API_CACHE_CONFIG[`${method} ${endpoint.replace(/\/\d+$/, '/:id')}`] || { strategy: 'network-only' };

    switch (config.strategy) {
        case 'cache-first':
            return cacheFirst(request, CACHE_NAMES.api, config.maxAge);
        case 'network-first':
            return networkFirst(request, CACHE_NAMES.api, config.maxAge);
        default:
            if (method === 'GET') return networkFirst(request, CACHE_NAMES.api, config.maxAge || 60);
            return networkOnly(request);
    }
}

async function handleNavigation(request) {
    const url = new URL(request.url);
    // Priority: cacheFirst routes
    if (ROUTES_CONFIG.cacheFirst.some((r) => matchRoute(url.pathname, r))) {
        return cacheFirst(request, CACHE_NAMES.pages, 300);
    }
    if (ROUTES_CONFIG.networkFirst.some((r) => matchRoute(url.pathname, r))) {
        return networkFirst(request, CACHE_NAMES.pages, 120);
    }
    if (ROUTES_CONFIG.networkOnly.some((r) => matchRoute(url.pathname, r))) {
        return networkOnly(request);
    }
    // Default: try network, fallback to cache or offline
    try {
        return await fetch(request);
    } catch (err) {
        const cached = await caches.match(request);
        return cached || (await caches.match(OFFLINE_URL));
    }
}

// Background sync: process queued requests
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-offline-queue') {
        event.waitUntil(processQueue());
    }
});

async function processQueue() {
    try {
        const items = await getQueuedRequests();
        for (const item of items) {
            try {
                const headers = new Headers(item.headers);
                const resp = await fetch(item.url, { method: item.method, headers, body: item.body });
                if (resp && resp.ok) await deleteQueuedRequest(item.id);
            } catch (err) {
                // leave item in queue for retry
            }
        }
    } catch (e) {
        // ignore
    }
}