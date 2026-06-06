declare global {
  interface Window {
    __astroPaperHeaderMenuReady?: boolean;
  }
}

function setupHeaderMenu(): void {
  const menuBtn = document.querySelector<HTMLButtonElement>("#menu-btn");
  const menuItems = document.querySelector<HTMLElement>("#menu-items");
  const menuIcon = document.querySelector<HTMLElement>("#menu-icon");
  const closeIcon = document.querySelector<HTMLElement>("#close-icon");

  if (!menuBtn || !menuItems || !menuIcon || !closeIcon) return;

  const openLabel = menuBtn.dataset.labelOpen ?? "Open menu";
  const closeLabel = menuBtn.dataset.labelClose ?? "Close menu";

  function setMenuOpen(open: boolean): void {
    menuBtn?.setAttribute("aria-expanded", String(open));
    menuBtn?.setAttribute("aria-label", open ? closeLabel : openLabel);

    menuItems?.classList.toggle("hidden", !open);
    menuItems?.classList.toggle("grid", open);
    menuIcon?.classList.toggle("hidden", open);
    closeIcon?.classList.toggle("hidden", !open);
  }

  menuBtn.onclick = () => {
    setMenuOpen(menuBtn.getAttribute("aria-expanded") !== "true");
  };

  menuItems.querySelectorAll("a").forEach(link => {
    link.onclick = () => setMenuOpen(false);
  });
}

function closeHeaderMenu(): void {
  const menuBtn = document.querySelector<HTMLButtonElement>("#menu-btn");

  if (menuBtn?.getAttribute("aria-expanded") === "true") {
    menuBtn.click();
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
  document.addEventListener("click", event => {
    const target = event.target;
    const navMenu = document.querySelector("#nav-menu");

    if (target instanceof Node && navMenu && !navMenu.contains(target)) {
      closeHeaderMenu();
    }
  });
}

setupHeaderMenu();
setupHeaderMenuListeners();

export {};
