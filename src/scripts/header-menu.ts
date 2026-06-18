declare global {
  interface Window {
    __astroPaperHeaderMenuReady?: boolean;
  }
}

const DIRECT_TAP_CLICK_GRACE_MS = 650;

let closeCurrentMenu: (() => void) | undefined;

function setupHeaderMenu(): void {
  const menuBtn = document.querySelector<HTMLButtonElement>("#menu-btn");
  const menuItems = document.querySelector<HTMLElement>("#menu-items");
  const menuIcon = document.querySelector<HTMLElement>("#menu-icon");
  const closeIcon = document.querySelector<HTMLElement>("#close-icon");

  if (!menuBtn || !menuItems || !menuIcon || !closeIcon) return;

  const button = menuBtn;
  const items = menuItems;
  const iconMenu = menuIcon;
  const iconClose = closeIcon;
  const openLabel = button.dataset.labelOpen ?? "Open menu";
  const closeLabel = button.dataset.labelClose ?? "Close menu";

  function setMenuOpen(open: boolean): void {
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? closeLabel : openLabel);

    if (open) {
      items.classList.remove("max-h-0", "opacity-0");
      items.classList.add("max-h-96", "opacity-100", "grid");
    } else {
      items.classList.remove("max-h-96", "opacity-100", "grid");
      items.classList.add("max-h-0", "opacity-0");
    }
    iconMenu.classList.toggle("hidden", open);
    iconClose.classList.toggle("hidden", !open);
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

  items.querySelectorAll<HTMLAnchorElement>("a").forEach(link => {
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
  document.addEventListener("astro:after-swap", setupHeaderMenu);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeHeaderMenu();
    }
  });
  const closeWhenOutside = (eventTarget: EventTarget | null) => {
    const navMenu = document.querySelector("#nav-menu");

    if (
      eventTarget instanceof Node &&
      navMenu &&
      !navMenu.contains(eventTarget)
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
