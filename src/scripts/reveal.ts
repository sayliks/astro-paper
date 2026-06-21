declare global {
  interface Window {
    __astroPaperRevealReady?: boolean;
  }
}

const REVEAL_SELECTOR = ".fade-in-up, .reveal-section";

function setupReveal(): void {
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)
  ).filter(
    el =>
      el.dataset.revealReady !== "true" && el.dataset.revealed !== "true"
  );
  if (elements.length === 0) return;

  // Pause all reveal animations initially so they can be triggered on scroll.
  // CSS defaults to "running" as a JS-fail fallback; JS takes over here.
  for (const el of elements) {
    el.dataset.revealReady = "true";
    el.style.animationPlayState = "paused";
  }

  let pendingCount = elements.length;
  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.animationPlayState = "running";
          delete (entry.target as HTMLElement).dataset.revealReady;
          (entry.target as HTMLElement).dataset.revealed = "true";
          observer.unobserve(entry.target);
          pendingCount -= 1;
        }
      }

      if (pendingCount <= 0) observer.disconnect();
    },
    { threshold: 0.1 }
  );

  for (const el of elements) {
    observer.observe(el);
  }
}

setupReveal();

if (!window.__astroPaperRevealReady) {
  window.__astroPaperRevealReady = true;
  document.addEventListener("astro:page-load", setupReveal);
  document.addEventListener("astro:after-swap", setupReveal);
}

export {};
