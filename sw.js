const CACHE_NAME = "simple-dashboard-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./assets/manifest.webmanifest",
  "./assets/css/dashboard.css",
  "./assets/favicon.svg",
  "./assets/icons/app-icon.svg",
  "./assets/js/main.js",
  "./assets/js/utils/datetime.js",
  "./assets/js/modules/calendar.js",
  "./assets/js/modules/clock.js",
  "./assets/js/modules/config.js",
  "./assets/js/modules/kiosk.js",
  "./assets/js/modules/location.js",
  "./assets/js/modules/panels.js",
  "./assets/js/modules/radar.js",
  "./assets/js/modules/weather.js",
  "./panels/calendar.html",
  "./panels/clock.html",
  "./panels/weather.html",
  "./panels/radar.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (event.request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }

  if (!isSameOrigin) {
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

async function handleNavigationRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const fallback = await cache.match("./index.html");
    if (fallback) {
      return fallback;
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Update in background but ignore failures to keep offline path working
    fetchAndCache(request, cache);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
  } catch (error) {
    // Ignore refresh errors, offline cache will keep serving old assets
  }
}
