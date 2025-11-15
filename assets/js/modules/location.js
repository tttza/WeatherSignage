export const ensureInitialLocation = async (config) => {
  if (!config) {
    return;
  }
  const fallback = { lat: config.lat, lon: config.lon, timezone: config.timezone };

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return;
  }

  const coords = await new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (pos && pos.coords) {
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        } else {
          resolve(null);
        }
      },
      (err) => {
        console.warn("Geolocation unavailable, using config defaults.", err);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  });

  if (coords) {
    config.lat = coords.lat;
    config.lon = coords.lon;
    const tz =
      typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : null;
    config.timezone = tz || fallback.timezone;
  } else {
    config.lat = fallback.lat;
    config.lon = fallback.lon;
    config.timezone = fallback.timezone;
  }
};
