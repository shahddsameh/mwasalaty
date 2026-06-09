/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } from "workbox-precaching";
import { NavigationRoute, registerRoute, setCatchHandler } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

// Precache the build manifest (app shell + offline.html via includeAssets).
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Support the prompt-based update flow (PwaUpdatePrompt.vue -> updateServiceWorker(true)).
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Navigations go to the network first; an offline reload falls back to the
// cached index.html shell so the Vue app (and its offline features) still boot.
registerRoute(
  new NavigationRoute(new NetworkFirst({ cacheName: "navigations" })),
);

// True last resort: only when a document request can't be served from network
// or cache (e.g. a cold first visit while offline) show the static offline page.
setCatchHandler(async ({ request }) => {
  if (request.destination === "document") {
    return (await matchPrecache("/offline.html")) ?? Response.error();
  }
  return Response.error();
});
