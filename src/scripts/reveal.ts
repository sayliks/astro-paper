declare global {
  interface Window {
    __astroPaperRevealReady?: boolean;
  }
}

const REVEAL_SELECTOR = ".fade-in-up, .reveal-section";

function setupReveal(): void {
  const elements = document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR);
  if (elements.length === 0) return;

  // Pause all reveal animations initially so they can be triggered on scroll.
  // CSS defaults to "running" as a JS-fail fallback; JS takes over here.
  for (const el of elements) {
    el.style.animationPlayState = "paused";
  }

  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.animationPlayState = "running";
          observer.unobserve(entry.target);
        }
      }
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
}

export {};
