declare global {
  interface Window {
    __astroPaperImageFadeReady?: boolean;
  }
}

function setupImageFade(): void {
  const images = document.querySelectorAll<HTMLImageElement>(
    "#article img, .moment-content img, .photo-wall-grid img"
  );

  for (const img of images) {
    if (img.dataset.fadeReady === "true") continue;
    img.dataset.fadeReady = "true";

    if (img.complete) {
      img.classList.add("img-fade", "loaded");
    } else {
      img.classList.add("img-fade");
      const markLoaded = () => img.classList.add("loaded");

      img.addEventListener("load", markLoaded, { once: true });
      img.addEventListener("error", markLoaded, { once: true });
    }
  }
}

setupImageFade();

if (!window.__astroPaperImageFadeReady) {
  window.__astroPaperImageFadeReady = true;
  document.addEventListener("astro:page-load", setupImageFade);
  document.addEventListener("astro:after-swap", setupImageFade);
}

export {};
