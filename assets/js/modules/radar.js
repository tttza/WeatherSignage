import { pad } from "../utils/datetime.js";

let map;
let radarLayer;
let radarTimes = [];
let radarIndex = 0;

export const initRadar = (config) => {
  const mapEl = document.getElementById("map");
  const radarTimeEl = document.getElementById("radarTime");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");

  if (!mapEl || typeof L === "undefined") {
    return;
  }

  const initMap = () => {
    map = L.map("map", { zoomControl: false, attributionControl: false });
    map.setView([config?.lat ?? 35.6762, config?.lon ?? 139.6503], 7);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 7 }).addTo(map);
  };

  const setRadarLayer = () => {
    if (!radarTimes.length) {
      if (radarTimeEl) {
        radarTimeEl.textContent = "Radar unavailable";
      }
      return;
    }
    const ts = radarTimes[radarIndex];
    const url = `https://tilecache.rainviewer.com/v2/radar/${ts}/256/{z}/{x}/{y}/1/1_1.png`;
    if (radarLayer) {
      map.removeLayer(radarLayer);
    }
    radarLayer = L.tileLayer(url, { opacity: 0.7 });
    radarLayer.addTo(map);
    if (radarTimeEl) {
      const t = new Date(ts * 1000);
      radarTimeEl.textContent = `${pad(t.getHours())}:${pad(t.getMinutes())}`;
    }
  };

  const loadRadarTimes = async () => {
    try {
      const res = await fetch("https://tilecache.rainviewer.com/api/maps.json", { cache: "no-store" });
      radarTimes = await res.json();
      radarIndex = radarTimes.length - 1;
    } catch (error) {
      console.error("Radar timeline fetch failed", error);
      radarTimes = [];
      radarIndex = 0;
    }
  };

  const refreshRadar = async () => {
    await loadRadarTimes();
    setRadarLayer();
  };

  btnPrev?.addEventListener("click", () => {
    if (!radarTimes.length) {
      return;
    }
    radarIndex = Math.max(0, radarIndex - 1);
    setRadarLayer();
  });

  btnNext?.addEventListener("click", () => {
    if (!radarTimes.length) {
      return;
    }
    radarIndex = Math.min(radarTimes.length - 1, radarIndex + 1);
    setRadarLayer();
  });

  initMap();
  refreshRadar();
  const refreshInterval = Math.max(60_000, config?.radarRefresh || 10 * 60 * 1000);
  setInterval(refreshRadar, refreshInterval);
};
