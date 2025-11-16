import { getConfig } from "./modules/config.js";
import { loadPanels } from "./modules/panels.js";
import { ensureInitialLocation } from "./modules/location.js";
import { initClock } from "./modules/clock.js";
import { initCalendar } from "./modules/calendar.js";
import { initWeather } from "./modules/weather.js";
import { initRadar } from "./modules/radar.js";
import { enableKioskIdleCursor } from "./modules/kiosk.js";

const registerServiceWorker = () => {
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const isSecureContext = window.location.protocol === "https:" || isLocalhost;

  if (!("serviceWorker" in navigator) || !isSecureContext) {
    return;
  }

  const serviceWorkerUrl = new URL("../../sw.js", import.meta.url);
  navigator.serviceWorker
    .register(serviceWorkerUrl)
    .catch((error) => {
      console.error("Service worker registration failed", error);
    });
};

const bootstrap = async () => {
  await loadPanels();
  const config = getConfig();
  await ensureInitialLocation(config);
  initClock();
  initCalendar();
  initWeather(config);
  initRadar(config);
  enableKioskIdleCursor();
  registerServiceWorker();
};

bootstrap().catch((error) => {
  console.error("Dashboard bootstrap failed", error);
});
