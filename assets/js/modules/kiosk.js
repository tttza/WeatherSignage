export const enableKioskIdleCursor = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  let timeoutId;
  let hidden = false;

  const show = () => {
    if (hidden) {
      root.style.cursor = "";
      hidden = false;
    }
  };

  const hide = () => {
    root.style.cursor = "none";
    hidden = true;
  };

  window.addEventListener(
    "mousemove",
    () => {
      show();
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(hide, 3000);
    },
    { passive: true }
  );

  timeoutId = window.setTimeout(hide, 3000);
};
