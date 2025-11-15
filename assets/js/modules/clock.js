import { formatDate, pad } from "../utils/datetime.js";

const WEEKDAYS_JA_FULL = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];

export const initClock = () => {
  const dowEl = document.getElementById("dow");
  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("date");
  if (!dowEl || !clockEl || !dateEl) {
    return;
  }

  let showSeconds = true;

  const updateClock = () => {
    const now = new Date();
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    const secondsPart = showSeconds ? `:${seconds}` : "";

    dowEl.textContent = WEEKDAYS_JA_FULL[now.getDay()];
    clockEl.textContent = `${hours}:${minutes}${secondsPart}`;
    clockEl.setAttribute("aria-checked", String(showSeconds));
    dateEl.textContent = formatDate(now);
  };

  const toggleSeconds = () => {
    showSeconds = !showSeconds;
    updateClock();
  };

  clockEl.addEventListener("click", toggleSeconds);
  clockEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleSeconds();
    }
  });

  setInterval(updateClock, 1000);
  updateClock();
};
