declare global {
  interface Window {
    __astroPaperBackToTopReady?: boolean;
  }
}

function setupBackToTop(): void {
  const rootElement = document.documentElement;
  const btnContainer =
    document.querySelector<HTMLElement>("#btt-btn-container");
  const backToTopBtn = document.querySelector<HTMLButtonElement>(
    "[data-button='back-to-top']"
  );
  const progressIndicator = document.querySelector<HTMLElement>(
    "#progress-indicator"
  );

  if (!rootElement || !btnContainer || !backToTopBtn || !progressIndicator)
    return;
  if (btnContainer.dataset.backToTopReady === "true") return;

  const container = btnContainer;
  const indicator = progressIndicator;

  container.dataset.backToTopReady = "true";

  const controller = new AbortController();

  backToTopBtn.addEventListener(
    "click",
    () => {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    },
    { signal: controller.signal }
  );

  let lastVisible: boolean | null = null;

  function handleScroll(): void {
    const scrollTotal = Math.max(
      rootElement.scrollHeight - rootElement.clientHeight,
      1
    );
    const scrollTop = rootElement.scrollTop;
    const scrollPercent = Math.min(
      100,
      Math.max(0, Math.floor((scrollTop / scrollTotal) * 100))
    );

    indicator.style.setProperty(
      "background-image",
      `conic-gradient(var(--accent), var(--accent) ${scrollPercent}%, transparent ${scrollPercent}%)`
    );

    const isVisible = scrollTop / scrollTotal > 0.3;

    if (isVisible !== lastVisible) {
      container.classList.toggle("opacity-100", isVisible);
      container.classList.toggle("translate-y-0", isVisible);
      container.classList.toggle("opacity-0", !isVisible);
      container.classList.toggle("translate-y-14", !isVisible);
      lastVisible = isVisible;
    }
  }

  let ticking = false;
  document.addEventListener(
    "scroll",
    () => {
      if (ticking) return;

      window.requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    },
    { passive: true, signal: controller.signal }
  );

  document.addEventListener("astro:before-swap", () => controller.abort(), {
    once: true,
  });
}

setupBackToTop();

if (!window.__astroPaperBackToTopReady) {
  window.__astroPaperBackToTopReady = true;
  document.addEventListener("astro:page-load", setupBackToTop);
}

export {};
