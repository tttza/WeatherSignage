import { getConfig } from "./modules/config.js";
import { loadPanels } from "./modules/panels.js";
import { ensureInitialLocation } from "./modules/location.js";
import { initClock } from "./modules/clock.js";
import { initCalendar } from "./modules/calendar.js";
import { initWeather } from "./modules/weather.js";
import { initRadar } from "./modules/radar.js";
import { enableKioskIdleCursor } from "./modules/kiosk.js";

const bootstrap = async () => {
  await loadPanels();
  const config = getConfig();
  await ensureInitialLocation(config);
  initClock();
  initCalendar();
  initWeather(config);
  initRadar(config);
  enableKioskIdleCursor();
};

bootstrap().catch((error) => {
  console.error("Dashboard bootstrap failed", error);
});
