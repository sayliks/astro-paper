declare global {
  interface Window {
    __astroPaperHeaderMenuReady?: boolean;
  }
}

const DIRECT_TAP_CLICK_GRACE_MS = 650;

let closeCurrentMenu: (() => void) | undefined;

function setupHeaderMenu(): void {
  const menuBtn = document.querySelector<HTMLButtonElement>("#menu-btn");
  const overlay = document.querySelector<HTMLElement>("#mobile-menu-overlay");
  const closeBtn = document.querySelector<HTMLButtonElement>(
    "#mobile-menu-close"
  );

  if (!menuBtn || !overlay) return;

  const button = menuBtn;
  const menuOverlay = overlay;
  const openLabel = button.dataset.labelOpen ?? "Open menu";
  const closeLabel =
    button.dataset.labelClose ??
    closeBtn?.getAttribute("aria-label") ??
    "Close menu";

  function setMenuOpen(open: boolean): void {
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? closeLabel : openLabel);

    if (open) {
      menuOverlay.classList.remove("hidden");
      menuOverlay.classList.add("flex");
      document.body.style.overflow = "hidden";
    } else {
      menuOverlay.classList.remove("flex");
      menuOverlay.classList.add("hidden");
      document.body.style.overflow = "";
    }
  }

  function toggleMenuOpen(): void {
    setMenuOpen(button.getAttribute("aria-expanded") !== "true");
  }

  closeCurrentMenu = () => setMenuOpen(false);

  if (button.dataset.menuReady !== "true") {
    button.dataset.menuReady = "true";

    let lastDirectTapAt = 0;

    button.addEventListener("pointerup", event => {
      if (event.pointerType === "mouse") return;

      lastDirectTapAt = window.performance.now();
      event.preventDefault();
      toggleMenuOpen();
    });

    button.addEventListener("click", () => {
      if (
        lastDirectTapAt &&
        window.performance.now() - lastDirectTapAt < DIRECT_TAP_CLICK_GRACE_MS
      ) {
        return;
      }

      toggleMenuOpen();
    });
  }

  if (closeBtn && closeBtn.dataset.menuReady !== "true") {
    closeBtn.dataset.menuReady = "true";
    closeBtn.addEventListener("click", () => setMenuOpen(false));
  }

  menuOverlay.querySelectorAll<HTMLAnchorElement>("a").forEach(link => {
    if (link.dataset.menuReady === "true") return;

    link.dataset.menuReady = "true";

    link.addEventListener(
      "pointerup",
      event => {
        if (event.pointerType !== "mouse") {
          setMenuOpen(false);
        }
      },
      { passive: true }
    );
    link.addEventListener("click", () => setMenuOpen(false));
  });
}

function closeHeaderMenu(): void {
  const menuBtn = document.querySelector<HTMLButtonElement>("#menu-btn");

  if (menuBtn?.getAttribute("aria-expanded") === "true") {
    closeCurrentMenu?.();
  }
}

function setupHeaderMenuListeners(): void {
  if (window.__astroPaperHeaderMenuReady) return;

  window.__astroPaperHeaderMenuReady = true;
  document.addEventListener("astro:page-load", setupHeaderMenu);
  document.addEventListener("astro:after-swap", setupHeaderMenu);
  document.addEventListener("astro:before-swap", () => {
    closeHeaderMenu();
    document.body.style.overflow = "";
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeHeaderMenu();
    }
  });
  const closeWhenOutside = (eventTarget: EventTarget | null) => {
    const menuBtn = document.querySelector("#menu-btn");
    const overlay = document.querySelector("#mobile-menu-overlay");

    if (
      eventTarget instanceof Node &&
      overlay &&
      !overlay.contains(eventTarget) &&
      !menuBtn?.contains(eventTarget)
    ) {
      closeHeaderMenu();
    }
  };

  document.addEventListener(
    "pointerup",
    event => {
      closeWhenOutside(event.target);
    },
    { passive: true }
  );
  document.addEventListener("click", event => {
    closeWhenOutside(event.target);
  });
}

setupHeaderMenu();
setupHeaderMenuListeners();

export {};
