export const loadPanels = async () => {
  const sections = Array.from(document.querySelectorAll("[data-panel-src]"));
  await Promise.all(
    sections.map(async (section) => {
      const src = section.getAttribute("data-panel-src");
      if (!src) {
        return;
      }
      try {
        const res = await fetch(src, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load ${src} (${res.status})`);
        }
        section.innerHTML = await res.text();
      } catch (error) {
        const name = section.getAttribute("data-panel-name") || "Panel";
        section.innerHTML = `<div class="title">${name} 読み込み失敗</div>`;
        console.error("Panel load error", error);
      }
    })
  );
};
