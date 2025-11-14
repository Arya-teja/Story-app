/* eslint-disable no-restricted-globals */
/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

// Do precaching
precacheAndRoute(self.__WB_MANIFEST);

// Runtime caching for Story API
registerRoute(
  ({ request, url }) => {
    return url.origin === 'https://story-api.dicoding.dev' && request.destination !== 'image';
  },
  new NetworkFirst({
    cacheName: 'story-api-cache',
  }),
);

registerRoute(
  ({ request, url }) => {
    return url.origin === 'https://story-api.dicoding.dev' && request.destination === 'image';
  },
  new StaleWhileRevalidate({
    cacheName: 'story-api-images',
  }),
);

// Cache map tiles
registerRoute(
  ({ url }) => {
    return url.origin === 'https://tile.openstreetmap.org' || 
           url.origin === 'https://server.arcgisonline.com' || 
           url.origin.includes('opentopomap');
  },
  new CacheFirst({
    cacheName: 'map-tiles-cache',
  }),
);

// Push notification event
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received", event);

  let notificationData = {
    title: "New Story Added",
    body: "Someone just shared a new story!",
    icon: "/images/icon-192x192.png",
    badge: "/images/icon-72x72.png",
    tag: "story-notification",
    data: {
      url: "/#/",
    },
  };

  // Try to parse push data
  if (event.data) {
    try {
      const data = event.data.json();
      console.log("[SW] Push data:", data);

      if (data.title) notificationData.title = data.title;
      if (data.body || data.message)
        notificationData.body = data.body || data.message;
      if (data.icon) notificationData.icon = data.icon;
      if (data.url) notificationData.data.url = data.url;
      if (data.storyId) {
        notificationData.data.storyId = data.storyId;
        notificationData.actions = [
          {
            action: "view",
            title: "View Story",
            icon: "/images/icon-72x72.png",
          },
          {
            action: "close",
            title: "Close",
          },
        ];
      }
    } catch (error) {
      console.error("[SW] Error parsing push data:", error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions || [],
      vibrate: [200, 100, 200],
      requireInteraction: false,
    })
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked", event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/#/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background Sync event
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync event:", event.tag);

  if (event.tag === "sync-stories") {
    event.waitUntil(syncPendingStories());
  }
});

// Sync pending stories function
async function syncPendingStories() {
  try {
    // Open IndexedDB
    const db = await openDatabase();
    const tx = db.transaction("pending-stories", "readonly");
    const store = tx.objectStore("pending-stories");
    const pendingStories = await store.getAll();
    await tx.done;

    console.log("[SW] Syncing pending stories:", pendingStories.length);

    // Get auth token from clients
    const allClients = await clients.matchAll({ includeUncontrolled: true });
    let token = null;

    for (const client of allClients) {
      // Try to get token from client
      const response = await new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        client.postMessage({ type: "GET_TOKEN" }, [messageChannel.port2]);
      });

      if (response && response.token) {
        token = response.token;
        break;
      }
    }

    if (!token) {
      // Try to get from cache or storage
      const storedToken = await getTokenFromCache();
      token = storedToken;
    }

    if (!token) {
      console.log("[SW] No auth token found, cannot sync");
      return;
    }

    // Upload each pending story
    for (const story of pendingStories) {
      try {
        // Convert base64 photo back to file
        const photoBlob = await fetch(story.photoData).then((r) => r.blob());
        const photoFile = new File([photoBlob], story.photoName, {
          type: story.photoType,
        });

        const formData = new FormData();
        formData.append("description", story.description);
        formData.append("photo", photoFile);
        if (story.lat) formData.append("lat", story.lat);
        if (story.lon) formData.append("lon", story.lon);

        const response = await fetch(
          "https://story-api.dicoding.dev/v1/stories",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (response.ok) {
          // Remove from pending
          const deleteTx = db.transaction("pending-stories", "readwrite");
          await deleteTx.objectStore("pending-stories").delete(story.tempId);
          await deleteTx.done;

          console.log("[SW] Story synced successfully:", story.tempId);

          // Show notification
          await self.registration.showNotification("Story Uploaded", {
            body: "Your offline story has been uploaded successfully!",
            icon: "/images/icon-192x192.png",
            tag: "sync-success",
          });
        }
      } catch (error) {
        console.error("[SW] Error syncing story:", error);
      }
    }
  } catch (error) {
    console.error("[SW] Error in syncPendingStories:", error);
  }
}

// Helper function to open IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("story-app-db", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("pending-stories")) {
        const store = db.createObjectStore("pending-stories", {
          keyPath: "tempId",
          autoIncrement: true,
        });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

// Helper to get token from cache
async function getTokenFromCache() {
  try {
    const cache = await caches.open("runtime-cache");
    const response = await cache.match("/auth-token");
    if (response) {
      const data = await response.json();
      return data.token;
    }
  } catch (error) {
    console.error("[SW] Error getting token from cache:", error);
  }
  return null;
}

// Message event handler
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
