import { pad, ymd } from "../utils/datetime.js";

const holidayCache = {};
let calOffset = 0;
let lastCalendarTodayKey = ymd(new Date());

const loadHolidays = async (year) => {
  if (holidayCache[year]) {
    return holidayCache[year];
  }
  try {
    const res = await fetch(`https://holidays-jp.github.io/api/v1/${year}/date.json`, {
      cache: "no-store",
    });
    const json = res.ok ? await res.json() : {};
    holidayCache[year] = json;
    return json;
  } catch (error) {
    console.warn("Holiday fetch failed", error);
    holidayCache[year] = {};
    return {};
  }
};

const renderTwoMonths = async (base, cal3El) => {
  if (!cal3El) {
    return;
  }
  cal3El.innerHTML = "";
  const months = [
    new Date(base.getFullYear(), base.getMonth(), 1),
    new Date(base.getFullYear(), base.getMonth() + 1, 1),
  ];
  const years = [...new Set(months.map((d) => d.getFullYear()))];
  const holiByYear = {};
  await Promise.all(years.map(async (y) => (holiByYear[y] = await loadHolidays(y))));
  const todayStr = ymd(new Date());

  for (const mdate of months) {
    const y = mdate.getFullYear();
    const m = mdate.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);

    const box = document.createElement("div");
    box.className = "mcal";

    const head = document.createElement("div");
    head.className = "mh";
    head.textContent = `${y}年 ${m + 1}月`;

    const grid = document.createElement("div");
    grid.className = "grid7";

    ["日", "月", "火", "水", "木", "金", "土"].forEach((wd) => {
      const wdEl = document.createElement("div");
      wdEl.className = "wd";
      wdEl.textContent = wd;
      grid.appendChild(wdEl);
    });

    for (let i = 0; i < first.getDay(); i += 1) {
      const blank = document.createElement("div");
      blank.className = "d";
      grid.appendChild(blank);
    }

    for (let d = 1; d <= last.getDate(); d += 1) {
      const cur = new Date(y, m, d);
      const el = document.createElement("div");
      el.className = "d";
      el.textContent = d;

      const dow = cur.getDay();
      const key = ymd(cur);
      const holidays = holiByYear[y] || {};
      const isHoliday = Object.prototype.hasOwnProperty.call(holidays, key);

      if (key === todayStr) {
        el.classList.add("today");
      }
      if (dow === 0) {
        el.classList.add("sun");
      }
      if (dow === 6) {
        el.classList.add("sat");
      }
      if (isHoliday) {
        el.classList.add("holiday");
        el.title = holidays[key];
      }
      grid.appendChild(el);
    }

    box.appendChild(head);
    box.appendChild(grid);
    cal3El.appendChild(box);
  }
};

const getCalendarBaseMonth = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + calOffset, 1);
};

export const initCalendar = () => {
  const cal3El = document.getElementById("cal3");
  if (!cal3El) {
    return;
  }

  const calPrevBtn = document.getElementById("calPrev");
  const calNextBtn = document.getElementById("calNext");
  const calTodayBtn = document.getElementById("calToday");

  const updateCalendar = async () => {
    await renderTwoMonths(getCalendarBaseMonth(), cal3El);
    lastCalendarTodayKey = ymd(new Date());
  };

  const requestCalendarRender = () => updateCalendar().catch((err) => console.error("Calendar refresh failed", err));

  calPrevBtn?.addEventListener("click", () => {
    calOffset -= 1;
    requestCalendarRender();
  });
  calNextBtn?.addEventListener("click", () => {
    calOffset += 1;
    requestCalendarRender();
  });
  calTodayBtn?.addEventListener("click", () => {
    calOffset = 0;
    requestCalendarRender();
  });

  requestCalendarRender();

  setInterval(() => {
    const todayKey = ymd(new Date());
    if (todayKey !== lastCalendarTodayKey) {
      requestCalendarRender();
    }
  }, 60 * 1000);
};
