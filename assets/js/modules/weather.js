import { formatDateTime, pad } from "../utils/datetime.js";

const TEN_MINUTES_MS = 10 * 60 * 1000;
const PRECIP_WINDOW_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const SYNODIC_MONTH_DAYS = 29.53058867;
const SYNODIC_MONTH_MS = SYNODIC_MONTH_DAYS * DAY_MS;
const NEW_MOON_REFERENCE_MS = Date.UTC(2000, 0, 6, 18, 14);

const WEATHER_CODE_MAP = {
  0: "快晴",
  1: "晴れ",
  2: "薄い雲",
  3: "曇り",
  45: "霧",
  48: "着氷霧",
  51: "霧雨",
  53: "細かな雨",
  55: "霧雨 (強)",
  56: "氷霧雨",
  57: "氷霧雨 (強)",
  61: "弱い雨",
  63: "雨",
  65: "強い雨",
  66: "氷雨",
  67: "氷雨 (強)",
  71: "小雪",
  73: "雪",
  75: "大雪",
  77: "雪あられ",
  80: "にわか雨",
  81: "にわか雨 (強)",
  82: "激しいにわか雨",
  85: "にわか雪",
  86: "激しいにわか雪",
  95: "雷雨",
  96: "雷雨 (雹)",
  99: "雷雨 (大雹)",
};

const WEATHER_ICON_MAP = {
  0: "☀️",
  1: "🌤️",
  2: "🌤️",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌦️",
  56: "🌧️",
  57: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  66: "🌨️",
  67: "🌨️",
  71: "🌨️",
  73: "🌨️",
  75: "🌨️",
  77: "🌨️",
  80: "🌦️",
  81: "🌧️",
  82: "🌧️",
  85: "🌨️",
  86: "🌨️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

const CLEAR_WEATHER_CODES = new Set([0, 1, 2]);

const MOON_PHASE_SEGMENTS = [
  { threshold: 0.0625, icon: "🌑", label: "新月" },
  { threshold: 0.1875, icon: "🌒", label: "三日月" },
  { threshold: 0.3125, icon: "🌓", label: "上弦の月" },
  { threshold: 0.4375, icon: "🌔", label: "十三夜" },
  { threshold: 0.5625, icon: "🌕", label: "満月" },
  { threshold: 0.6875, icon: "🌖", label: "十六夜" },
  { threshold: 0.8125, icon: "🌗", label: "下弦の月" },
  { threshold: 0.9375, icon: "🌘", label: "有明月" },
  { threshold: 1, icon: "🌑", label: "新月" },
];

const describeWeatherCode = (code) => {
  if (code == null) {
    return "";
  }
  return WEATHER_CODE_MAP[code] || `コード ${code}`;
};

const getWeatherIcon = (code) => {
  if (code == null) {
    return "";
  }
  return WEATHER_ICON_MAP[code] || "";
};

const parseHourlyEntries = (meteo) => {
  const times = Array.isArray(meteo?.hourly?.time) ? meteo.hourly.time : [];
  const temps = Array.isArray(meteo?.hourly?.temperature_2m) ? meteo.hourly.temperature_2m : [];
  const precip = Array.isArray(meteo?.hourly?.precipitation) ? meteo.hourly.precipitation : [];
  const pop = Array.isArray(meteo?.hourly?.precipitation_probability) ? meteo.hourly.precipitation_probability : [];
  const codes = Array.isArray(meteo?.hourly?.weathercode) ? meteo.hourly.weathercode : [];
  const dayFlags = Array.isArray(meteo?.hourly?.is_day) ? meteo.hourly.is_day : [];
  const entries = [];

  for (let i = 0; i < times.length; i += 1) {
    const timeStr = times[i];
    const date = new Date(timeStr);
    if (!Number.isFinite(date.getTime())) {
      continue;
    }
    const temp = temps[i];
    if (typeof temp !== "number") {
      continue;
    }
    const isDayFlag = dayFlags[i];
    let isDay = null;
    if (isDayFlag === 1 || isDayFlag === 0) {
      isDay = Boolean(isDayFlag);
    }
    entries.push({
      time: date,
      dateKey: typeof timeStr === "string" ? timeStr.slice(0, 10) : null,
      temp,
      precipitation: typeof precip[i] === "number" ? precip[i] : 0,
      pop: typeof pop[i] === "number" ? pop[i] : null,
      weathercode: typeof codes[i] === "number" ? codes[i] : null,
      isDay,
    });
  }
  return entries.sort((a, b) => a.time.getTime() - b.time.getTime());
};

const normalizeMoonPhase = (value) => {
  if (!Number.isFinite(value)) {
    return null;
  }
  const wrapped = value % 1;
  return wrapped < 0 ? wrapped + 1 : wrapped;
};

const getMoonPhaseInfo = (value) => {
  const normalized = normalizeMoonPhase(value);
  if (normalized == null) {
    return null;
  }
  for (const segment of MOON_PHASE_SEGMENTS) {
    if (normalized < segment.threshold) {
      return segment;
    }
  }
  return MOON_PHASE_SEGMENTS[MOON_PHASE_SEGMENTS.length - 1];
};

const describeMoonPhase = (value) => getMoonPhaseInfo(value)?.label || "";
const getMoonIconFromPhase = (value) => getMoonPhaseInfo(value)?.icon || "🌙";

const estimateMoonPhaseFraction = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }
  const elapsed = date.getTime() - NEW_MOON_REFERENCE_MS;
  if (!Number.isFinite(elapsed)) {
    return null;
  }
  const normalized = (elapsed % SYNODIC_MONTH_MS) / SYNODIC_MONTH_MS;
  if (!Number.isFinite(normalized)) {
    return null;
  }
  return normalized < 0 ? normalized + 1 : normalized;
};

const splitHourly = (entries, nowDate, config) => {
  const historyHours = Math.max(1, config?.historyHours || 24);
  const chartHours = Math.max(1, config?.chartHours || 24);
  const historyMs = historyHours * 3600 * 1000;
  const horizonMs = chartHours * 3600 * 1000;
  const nowMs = nowDate.getTime();
  const past = entries.filter((e) => e.time.getTime() < nowMs && nowMs - e.time.getTime() <= historyMs);
  const future = entries.filter((e) => e.time.getTime() >= nowMs && e.time.getTime() - nowMs <= horizonMs);
  return { past, future };
};

const buildMoonPhaseLookup = () => new Map();

const getEntryDateKey = (entry) => {
  if (!entry) {
    return null;
  }
  if (entry.dateKey) {
    return entry.dateKey;
  }
  if (entry.time instanceof Date) {
    return entry.time.toISOString().slice(0, 10);
  }
  return null;
};

const getMoonPhaseForEntry = (entry, lookup) => {
  if (!lookup || !(lookup instanceof Map)) {
    return null;
  }
  const key = getEntryDateKey(entry);
  if (!key) {
    return null;
  }
  if (!lookup.has(key)) {
    const date = entry.time instanceof Date ? entry.time : new Date(entry.time);
    const phase = estimateMoonPhaseFraction(date);
    lookup.set(key, Number.isFinite(phase) ? phase : null);
  }
  const phase = lookup.get(key);
  return Number.isFinite(phase) ? phase : null;
};

const isNightTime = (entry) => {
  if (!entry) {
    return false;
  }
  if (typeof entry.isDay === "boolean") {
    return !entry.isDay;
  }
  if (entry.isDay === 0) {
    return true;
  }
  if (entry.isDay === 1) {
    return false;
  }
  if (entry.time instanceof Date) {
    const hour = entry.time.getHours();
    return hour < 6 || hour >= 18;
  }
  return false;
};

const selectWeatherGlyph = (entry, moonPhaseLookup) => {
  const isClearNight = CLEAR_WEATHER_CODES.has(entry?.weathercode) && isNightTime(entry);
  if (!isClearNight) {
    return { icon: getWeatherIcon(entry?.weathercode), moonLabel: null, iconClass: "" };
  }
  const phaseValue = getMoonPhaseForEntry(entry, moonPhaseLookup);
  const hasPhase = Number.isFinite(phaseValue);
  const showCloudOverlay = entry?.weathercode === 1 || entry?.weathercode === 2;
  return {
    icon: hasPhase ? getMoonIconFromPhase(phaseValue) : "🌙",
    moonLabel: hasPhase ? describeMoonPhase(phaseValue) : null,
    iconClass: showCloudOverlay ? "wx-icon--moon-cloud" : "",
  };
};

const buildPastSeries = (historicalPoints, nowUnix, currentTemp, nowDate, forecastTimes, config) => {
  if (!Array.isArray(historicalPoints) || !historicalPoints.length) {
    return [];
  }
  const historyHours = config?.historyHours || 24;
  const shiftHours = Number.isFinite(config?.historyShiftHours) ? config.historyShiftHours : historyHours;
  const dayAgo = nowUnix - historyHours * 3600;
  const shiftSeconds = Math.max(0, shiftHours) * 3600;

  const times = (forecastTimes || [])
    .map((t) => (t instanceof Date ? t.getTime() : new Date(t).getTime()))
    .filter((time) => Number.isFinite(time));
  const range = times.length ? { start: Math.min(...times), end: Math.max(...times) } : null;
  const withinRange = (timeMs) => !range || (timeMs >= range.start && timeMs <= range.end);

  const byDt = new Map();
  for (const entry of historicalPoints) {
    const dt =
      typeof entry?.dt === "number"
        ? entry.dt
        : entry?.t instanceof Date
        ? Math.floor(entry.t.getTime() / 1000)
        : NaN;
    const temp =
      typeof entry?.temp === "number"
        ? entry.temp
        : typeof entry?.temperature === "number"
        ? entry.temperature
        : null;
    if (!Number.isFinite(dt) || !Number.isFinite(temp)) {
      continue;
    }
    if (dt < dayAgo || dt > nowUnix) {
      continue;
    }
    byDt.set(dt, { dt, temp });
  }
  if (!byDt.size) {
    return [];
  }

  const sorted = Array.from(byDt.values()).sort((a, b) => a.dt - b.dt);
  let series = sorted.map((point) => {
    const originalDate = new Date(point.dt * 1000);
    const shiftedDate = new Date((point.dt + shiftSeconds) * 1000);
    return { t: shiftedDate, originalDate, temp: point.temp, label: `${pad(originalDate.getHours())}:00` };
  });

  series = series.filter((entry) => withinRange(entry.t instanceof Date ? entry.t.getTime() : new Date(entry.t).getTime()));
  const shiftedNowTime = nowDate.getTime() + shiftSeconds * 1000;

  if (currentTemp != null && withinRange(shiftedNowTime)) {
    let currentIdx = -1;
    for (let i = 0; i < series.length; i += 1) {
      const comparedDate = series[i].originalDate instanceof Date ? series[i].originalDate : series[i].t;
      if (Math.abs(comparedDate.getTime() - nowDate.getTime()) < 45 * 60 * 1000) {
        currentIdx = i;
        break;
      }
    }
    if (currentIdx >= 0) {
      series[currentIdx] = { ...series[currentIdx], isCurrent: true };
    } else {
      const shiftedNow = new Date(nowDate.getTime() + shiftSeconds * 1000);
      series.push({
        t: shiftedNow,
        originalDate: nowDate,
        temp: currentTemp,
        label: `${pad(nowDate.getHours())}:00`,
        isCurrent: true,
      });
      series.sort((a, b) => a.t.getTime() - b.t.getTime());
    }
  }
  return series;
};

const buildTenMinuteBuckets = (entries, nowDate) => {
  if (!Array.isArray(entries) || !entries.length) {
    return [];
  }
  const startMs = nowDate.getTime() - PRECIP_WINDOW_MS;
  const endMs = nowDate.getTime() + PRECIP_WINDOW_MS;
  const byHour = new Map();
  for (const entry of entries) {
    if (!(entry?.time instanceof Date)) {
      continue;
    }
    const t = new Date(entry.time);
    t.setMinutes(0, 0, 0);
    byHour.set(t.getTime(), Math.max(0, Number(entry.precipitation) || 0));
  }

  const buckets = [];
  for (let ts = startMs; ts < endMs; ts += TEN_MINUTES_MS) {
    const hour = new Date(ts);
    hour.setMinutes(0, 0, 0);
    const hourKey = hour.getTime();
    const hourlyValue = byHour.has(hourKey) ? byHour.get(hourKey) : 0;
    const amount = (hourlyValue / 60) * (TEN_MINUTES_MS / (60 * 1000));
    buckets.push({
      time: new Date(ts + TEN_MINUTES_MS / 2),
      value: Math.max(0, amount),
      isPast: ts + TEN_MINUTES_MS / 2 < nowDate.getTime(),
    });
  }
  return buckets;
};

const buildPathD = (points) => {
  if (!points.length) {
    return "";
  }
  return points.reduce((acc, p, idx) => acc + `${idx ? "L" : "M"}${p.x},${p.y}`, "");
};

const buildTemperatureScale = (values) => {
  const STEP = 2;
  const MIN_SPAN = 16;
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  let lower = Math.floor(minVal / STEP) * STEP;
  let upper = Math.ceil(maxVal / STEP) * STEP;
  if (upper - lower < MIN_SPAN) {
    const needed = MIN_SPAN - (upper - lower);
    const padding = Math.ceil(needed / (2 * STEP)) * STEP;
    lower -= padding;
    upper += padding;
  }
  if (minVal < lower) {
    lower -= STEP * Math.ceil((lower - minVal) / STEP);
  }
  if (maxVal > upper) {
    upper += STEP * Math.ceil((maxVal - upper) / STEP);
  }
  if (upper - lower < MIN_SPAN) {
    upper = lower + Math.ceil(MIN_SPAN / STEP) * STEP;
  }
  const ticks = [];
  for (let t = lower; t <= upper; t += STEP) {
    ticks.push(t);
  }
  return { min: lower, max: upper, ticks };
};

const buildTimeTicks = (minTime, maxTime, innerWidth, offsetLeft, offsetBottom, totalHeight) => {
  const range = maxTime - minTime || 1;
  const tickCount = Math.max(4, Math.min(8, Math.floor(innerWidth / 120)));
  const parts = [];
  for (let i = 0; i <= tickCount; i += 1) {
    const ratio = i / tickCount;
    const time = minTime + ratio * range;
    const x = offsetLeft + ratio * innerWidth;
    const label = formatTickLabel(new Date(time));
    parts.push(`
      <line class="axis" x1="${x}" y1="${totalHeight - offsetBottom}" x2="${x}" y2="${totalHeight - offsetBottom + 6}"></line>
      <text class="label" x="${x}" y="${totalHeight - offsetBottom + 22}" text-anchor="middle">${label}</text>
    `);
  }
  return parts.join("");
};

const formatTickLabel = (date) => {
  const hh = pad(date.getHours());
  const day = `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
  return `${day} ${hh}:00`;
};

const drawTempChart = (chartSvg, futureSeries, pastSeries) => {
  if (!chartSvg) {
    return;
  }
  const future = Array.isArray(futureSeries) ? futureSeries.filter((s) => s && typeof s.temp === "number" && s.t) : [];
  const past = Array.isArray(pastSeries) ? pastSeries.filter((s) => s && typeof s.temp === "number" && s.t) : [];
  const combined = [...past, ...future];
  if (!combined.length) {
    chartSvg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="label">気温データがありません</text>';
    return;
  }

  const width = 800;
  const height = 260;
  const margin = { top: 24, right: 24, bottom: 52, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const temps = combined.map((s) => s.temp);
  const scale = buildTemperatureScale(temps);
  const times = combined.map((s) => (s.t instanceof Date ? s.t.getTime() : new Date(s.t).getTime()));
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeRange = maxTime - minTime || 1;

  const toPoint = (entry) => {
    const date = entry.t instanceof Date ? entry.t : new Date(entry.t);
    const time = date.getTime();
    const ratioX = (time - minTime) / timeRange;
    const ratioY = (entry.temp - scale.min) / (scale.max - scale.min || 1);
    return {
      ...entry,
      date,
      x: margin.left + ratioX * innerWidth,
      y: margin.top + (1 - ratioY) * innerHeight,
    };
  };

  const pastPoints = past
    .slice()
    .sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime())
    .map(toPoint);
  const futurePoints = future
    .slice()
    .sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime())
    .map(toPoint);

  const pastPath = buildPathD(pastPoints);
  const futurePath = buildPathD(futurePoints);
  const nowPoint = [...futurePoints, ...pastPoints].find((p) => p.isCurrent);
  const nowMarkup = nowPoint
    ? `<line class="axis axis-now" x1="${nowPoint.x}" y1="${margin.top}" x2="${nowPoint.x}" y2="${height - margin.bottom}"></line><text class="label" x="${nowPoint.x}" y="${margin.top - 6}" text-anchor="middle">現在</text>`
    : "";

  const tempGrid = scale.ticks
    .map((temp) => {
      const ratio = (temp - scale.min) / (scale.max - scale.min || 1);
      const y = margin.top + (1 - ratio) * innerHeight;
      return `
        <line class="axis" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke-dasharray="4 4"></line>
        <text class="label" x="${margin.left - 10}" y="${y + 4}" text-anchor="end">${temp.toFixed(0)}°C</text>
      `;
    })
    .join("");

  const timeTicks = buildTimeTicks(minTime, maxTime, innerWidth, margin.left, margin.bottom, height);
  const futureDotMarkup = futurePoints.map((p) => `<circle class="dot" cx="${p.x}" cy="${p.y}" r="4"></circle>`).join("");
  const pastDotMarkup = pastPoints.map((p) => `<circle class="dot dot-past" cx="${p.x}" cy="${p.y}" r="3"></circle>`).join("");
  const futureLabelMarkup = futurePoints.map((p) => `<text class="label" x="${p.x}" y="${p.y - 8}" text-anchor="middle">${Math.round(p.temp)}°</text>`).join("");

  chartSvg.innerHTML = `
    ${tempGrid}
    ${timeTicks}
    ${pastPath ? `<path class="line line-past" d="${pastPath}"></path>` : ""}
    ${futurePath ? `<path class="line line-future" d="${futurePath}"></path>` : ""}
    ${nowMarkup}
    ${pastDotMarkup}
    ${futureDotMarkup}
    ${futureLabelMarkup}
    <line class="axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}"></line>
    <line class="axis" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"></line>
  `;
};

const drawPrecipogram = (precipogramSvg, buckets, nowDate) => {
  if (!precipogramSvg) {
    return;
  }
  if (!Array.isArray(buckets) || !buckets.length) {
    precipogramSvg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="label">降水データがありません</text>';
    return;
  }

  const referenceNow = nowDate instanceof Date && !Number.isNaN(nowDate.getTime()) ? nowDate : new Date();

  const width = 520;
  const height = 280;
  const margin = { top: 20, right: 24, bottom: 48, left: 56 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(...buckets.map((b) => b.value), 0.1);
  const barWidth = innerWidth / buckets.length;
  const startMs = referenceNow.getTime() - PRECIP_WINDOW_MS;
  const totalRange = PRECIP_WINDOW_MS * 2;
  const nowRatio = (referenceNow.getTime() - startMs) / totalRange;
  const nowX = margin.left + nowRatio * innerWidth;
  const axisPrecision = maxValue >= 1 ? 1 : 2;
  const labelThreshold = Math.max(0.1, maxValue * 0.25);

  const yTicks = 4;
  const yGrid = Array.from({ length: yTicks + 1 }, (_, idx) => {
    const value = (maxValue / yTicks) * idx;
    const ratio = value / maxValue;
    const y = height - margin.bottom - ratio * innerHeight;
    return { y, value };
  });

  const timeLabels = buckets
    .map((bucket, idx) => ({ bucket, idx }))
    .filter(({ idx }) => idx % 6 === 0 || idx === buckets.length - 1)
    .map(({ bucket, idx }) => {
      const x = margin.left + (idx + 0.5) * barWidth;
      const label = `${pad(bucket.time.getHours())}:${pad(bucket.time.getMinutes())}`;
      return { x, label };
    });

  precipogramSvg.innerHTML = `
    <line class="precip-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}"></line>
    <line class="precip-axis" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"></line>
    ${yGrid
      .map(
        (tick) => `
      <line class="precip-axis" x1="${margin.left}" y1="${tick.y}" x2="${width - margin.right}" y2="${tick.y}" stroke-dasharray="4 4"></line>
      <text class="precip-label" x="${margin.left - 8}" y="${tick.y + 4}" text-anchor="end">${tick.value.toFixed(axisPrecision)}mm</text>
    `
      )
      .join("")}
    ${buckets
      .map((bucket, idx) => {
        const barH = bucket.value <= 0 ? 0 : (bucket.value / maxValue) * innerHeight;
        const x = margin.left + idx * barWidth + barWidth * 0.05;
        const w = barWidth * 0.9;
        const y = height - margin.bottom - barH;
        const label =
          bucket.value >= labelThreshold
            ? `<text class="precip-label" x="${x + w / 2}" y="${y - 6}" text-anchor="middle">${bucket.value.toFixed(axisPrecision)}</text>`
            : "";
        return `
        <rect class="precip-bar ${bucket.isPast ? "past" : "future"}" x="${x}" y="${y}" width="${w}" height="${barH}"></rect>
        ${label}
      `;
      })
      .join("")}
    ${timeLabels
      .map((tick) => `<text class="precip-label" x="${tick.x}" y="${height - margin.bottom + 20}" text-anchor="middle">${tick.label}</text>`)
      .join("")}
    <line class="precip-now-line" x1="${nowX}" y1="${margin.top}" x2="${nowX}" y2="${height - margin.bottom}"></line>
    <text class="precip-label" x="${nowX + 4}" y="${margin.top + 12}">現在</text>
  `;
};

const renderRowForecast = (rowForecast, items) => {
  if (!rowForecast) {
    return;
  }
  if (!Array.isArray(items) || !items.length) {
    rowForecast.innerHTML = '<div class="f">予報データがありません</div>';
    return;
  }
  rowForecast.innerHTML = items
    .map((item) => {
      const popText = typeof item.pop === "number" ? `${Math.round(item.pop * 100)}% 雨確率` : "";
      const popMarkup = popText ? `<div class="pop">${popText}</div>` : "";
      const iconClassName = ["wx-icon", item.iconClass].filter(Boolean).join(" ");
      const iconMarkup = item.icon ? `<div class="${iconClassName}" aria-hidden="true">${item.icon}</div>` : "";
      return `
        <div class="f">
          <div class="tm">${item.label}</div>
          ${iconMarkup}
          <div class="temp">${Math.round(item.temp)}°C</div>
          <div class="desc">${item.description || ""}</div>
          ${popMarkup}
        </div>
      `;
    })
    .join("");
};

export const initWeather = (config) => {
  const chartSvg = document.getElementById("tempChart");
  const rowForecast = document.getElementById("rowForecast");
  const precipogramSvg = document.getElementById("precipogram");
  const lastUpdatedEl = document.getElementById("weatherLastUpdated");
  const currentTempEl = document.getElementById("currentTempDisplay");

  if (!chartSvg || !rowForecast || !precipogramSvg) {
    return;
  }

  const setLastUpdated = (tsMs) => {
    if (!lastUpdatedEl) {
      return;
    }
    if (!Number.isFinite(tsMs)) {
      lastUpdatedEl.textContent = "最終更新: --";
      return;
    }
    const date = new Date(tsMs);
    if (Number.isNaN(date.getTime())) {
      lastUpdatedEl.textContent = "最終更新: --";
      return;
    }
    lastUpdatedEl.textContent = `最終更新: ${formatDateTime(date)}`;
  };

  const setCurrentTemp = (temp) => {
    if (!currentTempEl) {
      return;
    }
    if (typeof temp === "number" && Number.isFinite(temp)) {
      currentTempEl.textContent = `${Math.round(temp)}°C`;
    } else {
      currentTempEl.textContent = "--°C";
    }
  };

  const getSetting = (key, fallback) => {
    const value = config?.[key];
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  };

  const renderWeatherFromMeteo = ({ meteo, nowDate, nowUnix, futureWindow, historicalPoints, moonPhaseLookup }) => {
    const step = Math.max(1, getSetting("historyStepHours", 3));
    const currentTemp =
      typeof meteo?.current_weather?.temperature === "number"
        ? meteo.current_weather.temperature
        : futureWindow[0]?.temp ?? null;
    const currentCode =
      typeof meteo?.current_weather?.weathercode === "number"
        ? meteo.current_weather.weathercode
        : futureWindow[0]?.weathercode ?? null;

    setCurrentTemp(currentTemp);
    const futureSeriesSeed = [];
    if (currentTemp != null) {
      futureSeriesSeed.push({
        t: nowDate,
        label: `${pad(nowDate.getHours())}:00`,
        temp: currentTemp,
        isCurrent: true,
        weathercode: currentCode,
      });
    }

    const sampledForecast = futureWindow
      .filter((_, idx) => idx % step === 0)
      .map((entry) => ({
        t: entry.time,
        label: `${pad(entry.time.getHours())}:00`,
        temp: entry.temp,
        weathercode: entry.weathercode,
      }));

    const futureSeries = [...futureSeriesSeed, ...sampledForecast];
    const overlayTimeline = [nowDate, ...futureWindow.map((p) => p.time)];
    const pastSeries = buildPastSeries(historicalPoints, nowUnix, currentTemp, nowDate, overlayTimeline, config);
    drawTempChart(chartSvg, futureSeries, pastSeries);

    const rowItems = futureWindow
      .filter((_, idx) => idx % 3 === 0)
      .slice(0, 8)
      .map((entry) => {
        const glyph = selectWeatherGlyph(entry, moonPhaseLookup);
        return {
          label: `${pad(entry.time.getHours())}:00`,
          temp: entry.temp,
          icon: glyph.icon,
          iconClass: glyph.iconClass,
          description: describeWeatherCode(entry.weathercode),
          pop: entry.pop == null ? null : entry.pop / 100,
        };
      });
    renderRowForecast(rowForecast, rowItems);
  };

  const renderPrecipFromMeteo = (entries, nowDateParam) => {
    const buckets = buildTenMinuteBuckets(entries, nowDateParam);
    drawPrecipogram(precipogramSvg, buckets, nowDateParam);
  };

  const fetchWeather = async () => {
    const params = new URLSearchParams({
      latitude: String(config?.lat ?? 35.6762),
      longitude: String(config?.lon ?? 139.6503),
      timezone: config?.timezone || "auto",
      hourly: "temperature_2m,precipitation,precipitation_probability,weathercode,is_day",
      past_days: "1",
      forecast_days: "2",
      current_weather: "true",
    });
    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Open-Meteo error ${res.status}`);
      }
      const meteo = await res.json();
      const currentTime = meteo?.current_weather?.time ? new Date(meteo.current_weather.time) : new Date();
      const nowDate = Number.isNaN(currentTime.getTime()) ? new Date() : currentTime;
      const nowUnix = Math.floor(nowDate.getTime() / 1000);
      const entries = parseHourlyEntries(meteo);
      const { past, future } = splitHourly(entries, nowDate, config);
      const historicalPoints = past.map((entry) => ({ dt: Math.floor(entry.time.getTime() / 1000), temp: entry.temp }));
      const futureWindow = future.length
        ? future
        : entries
            .filter((e) => e.time.getTime() >= nowDate.getTime())
            .slice(0, Math.max(1, getSetting("chartHours", 24)));

      const moonPhaseLookup = buildMoonPhaseLookup();
      renderWeatherFromMeteo({ meteo, nowDate, nowUnix, futureWindow, historicalPoints, moonPhaseLookup });
      renderPrecipFromMeteo(entries, nowDate);
      setLastUpdated(Date.now());
    } catch (error) {
      console.error("Weather fetch failed", error);
      chartSvg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="label">${error.message || "Failed to fetch weather data"}</text>`;
      rowForecast.innerHTML = "";
      drawPrecipogram(precipogramSvg, [], new Date());
      setCurrentTemp(null);
      setLastUpdated(Number.NaN);
    }
  };

  fetchWeather();
  const refreshInterval = Math.max(60_000, getSetting("weatherRefresh", 10 * 60 * 1000));
  setInterval(fetchWeather, refreshInterval);
};
