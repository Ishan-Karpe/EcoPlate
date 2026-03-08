/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision: string | null }>;
};

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  ({ request, url }) => request.mode === "navigate" && url.pathname.startsWith("/admin"),
  new NetworkOnly()
);

registerRoute(
  ({ request, url }) => request.method === "GET" && url.pathname === "/api/drops",
  new StaleWhileRevalidate({
    cacheName: "api-drops",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 }),
    ],
  })
);

registerRoute(
  ({ request, url }) => request.method === "GET" && url.pathname.startsWith("/api/user/"),
  new StaleWhileRevalidate({
    cacheName: "api-user",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 }),
    ],
  })
);

registerRoute(
  ({ request, url }) => request.method === "GET" && url.pathname === "/api/reservations",
  new NetworkFirst({
    cacheName: "api-reservations",
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 }),
    ],
  })
);

registerRoute(
  ({ request, url }) =>
    url.pathname.startsWith("/api/") && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method),
  new NetworkOnly()
);

registerRoute(
  ({ request, url }) => request.method === "GET" && url.hostname === "images.unsplash.com",
  new CacheFirst({
    cacheName: "unsplash-images",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
);
