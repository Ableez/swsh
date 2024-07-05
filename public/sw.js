/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable drizzle/enforce-delete-with-where */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */

// Advanced Service Worker for Next.js 14.2
const CACHE_NAME = "swoosh-cache-v1";
const STATIC_ASSETS = [];

const API_CACHE_NAME = "swoosh-api-cache-v1";
const API_ROUTES = ["/api/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Handle API routes
  if (API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(handleApiRequest(event.request));
  }
  // Handle static assets
  else if (STATIC_ASSETS.some((asset) => url.pathname.startsWith(asset))) {
    event.respondWith(handleStaticRequest(event.request));
  }
  // For other routes, use a network-first strategy
  else {
    event.respondWith(handleNetworkFirst(event.request));
  }
});

async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    void cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    return new Response("Offline content not available", { status: 404 });
  }
}

async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Return cached response and update in background
    void fetchAndCache(request, cache);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetchAndCache(request, cache);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response("Offline content not available", { status: 404 });
  }
}

async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response("Offline content not available", { status: 404 });
  }
}

async function fetchAndCache(request, cache) {
  try {
     const networkResponse = await fetch(request);
     cache.put(request, networkResponse.clone());
     return networkResponse;
  } catch (error) {
    console.error("Failed to fetch and cache:", error);
    return new Response("Offline content not available");
  }
 
}

self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/favicon.ico", // Make sure to have an icon file
      badge: "/favicon.ico", // Make sure to have a badge file
    };

    console.log("EVENT CAME", event.data);
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
// Background Sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-data") {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  const db = await openIndexedDB();
  const offlineData = await db.getAll("offlineChanges");

  for (const data of offlineData) {
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await db.delete("offlineChanges", data.id);
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }
}

// Periodic Sync
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "update-content") {
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  const cache = await caches.open(API_CACHE_NAME);
  for (const route of API_ROUTES) {
    try {
      const response = await fetch(route);
      await cache.put(route, response);
    } catch (error) {
      console.error("Periodic sync failed:", error);
    }
  }
}

// Handle inactive notifications
self.addEventListener("notificationclose", (event) => {
  console.log("Notification was closed", event.notification);
});

// Badge API
async function updateBadge(count) {
  if ("setAppBadge" in navigator) {
    await navigator.setAppBadge(count);
  }
}

// Helper function to open IndexedDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("OfflineDB", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore("offlineChanges", {
        keyPath: "id",
        autoIncrement: true,
      });
    };
  });
}

// Listen for messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
