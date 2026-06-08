const THEME_KEY = "theme";
const LIGHT = "light";
const DARK = "dark";
const SYSTEM = "system";

type ResolvedTheme = typeof LIGHT | typeof DARK;
type ThemeMode = ResolvedTheme | typeof SYSTEM;

declare global {
  interface Window {
    __astroPaperThemeReady?: boolean;
    __theme?: {
      mode?: string;
      value?: string;
    };
  }
}

function isResolvedTheme(
  value: string | null | undefined
): value is ResolvedTheme {
  return value === LIGHT || value === DARK;
}

function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return isResolvedTheme(value) || value === SYSTEM;
}

function getStoredThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return isThemeMode(stored) ? stored : SYSTEM;
  } catch {
    return SYSTEM;
  }
}

function setStoredThemeMode(value: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {
    // The reflected DOM state still updates when storage is unavailable.
  }
}

function getPrefersDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === SYSTEM ? (getPrefersDark() ? DARK : LIGHT) : mode;
}

// Reuse the value already set by the inline FOUC-prevention script if available.
const initialMode = window.__theme?.mode;
let themeMode: ThemeMode = isThemeMode(initialMode)
  ? initialMode
  : getStoredThemeMode();

const initialTheme = window.__theme?.value;
let themeValue: ResolvedTheme =
  isResolvedTheme(initialTheme) && resolveTheme(themeMode) === initialTheme
    ? initialTheme
    : resolveTheme(themeMode);

function persist(): void {
  setStoredThemeMode(themeMode);
  window.__theme = {
    mode: themeMode,
    value: themeValue,
  };
  reflect();
}

function getThemeOptions(): HTMLButtonElement[] {
  return Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-theme-option]")
  );
}

function getThemeLabel(): string {
  const activeOption = getThemeOptions().find(
    option => option.dataset.themeOption === themeMode
  );
  return activeOption?.dataset.label ?? themeMode;
}

function setThemeMenuOpen(open: boolean): void {
  const themeButton = document.querySelector<HTMLButtonElement>("#theme-btn");
  const themeMenu = document.querySelector<HTMLElement>("#theme-menu");

  themeButton?.setAttribute("aria-expanded", String(open));
  themeMenu?.classList.toggle("hidden", !open);
}

function closeThemeMenu(): void {
  setThemeMenuOpen(false);
}

function reflect(): void {
  const root = document.firstElementChild;
  root?.setAttribute("data-theme", themeValue);
  root?.setAttribute("data-theme-mode", themeMode);

  const themeButton = document.querySelector<HTMLButtonElement>("#theme-btn");
  const currentLabel = themeButton?.dataset.labelCurrent ?? "Theme";
  const themeLabel = getThemeLabel();
  themeButton?.setAttribute("aria-label", `${currentLabel}: ${themeLabel}`);
  themeButton?.setAttribute("title", `${currentLabel}: ${themeLabel}`);

  getThemeOptions().forEach(option => {
    const active = option.dataset.themeOption === themeMode;
    option.setAttribute("aria-checked", String(active));
    option.classList.toggle("bg-muted", active);
    option.classList.toggle("text-accent", active);
    option
      .querySelector("[data-theme-check]")
      ?.classList.toggle("opacity-0", !active);
  });

  // Fill <meta name="theme-color"> with the computed background colour so
  // Android's browser chrome matches the page background.
  const bg = window.getComputedStyle(document.body).backgroundColor;
  document
    .querySelector("meta[name='theme-color']")
    ?.setAttribute("content", bg);
}

function setup(): void {
  reflect();
  const themeButton = document.querySelector<HTMLButtonElement>("#theme-btn");
  const themeMenu = document.querySelector<HTMLElement>("#theme-menu");

  if (!themeButton || !themeMenu) return;

  themeButton.onclick = event => {
    event.stopPropagation();
    const willOpen = themeButton.getAttribute("aria-expanded") !== "true";
    setThemeMenuOpen(willOpen);

    if (willOpen) {
      const activeOption =
        getThemeOptions().find(
          option => option.dataset.themeOption === themeMode
        ) ?? getThemeOptions()[0];
      activeOption?.focus();
    }
  };

  themeMenu.onclick = event => {
    event.stopPropagation();
  };

  getThemeOptions().forEach(option => {
    option.onclick = () => {
      const optionTheme = option.dataset.themeOption;

      if (!isThemeMode(optionTheme)) return;

      themeMode = optionTheme;
      themeValue = resolveTheme(themeMode);
      persist();
      closeThemeMenu();
      themeButton.focus();
    };
  });
}

function focusThemeOption(offset: number): void {
  const themeOptions = getThemeOptions();
  const activeElement = document.activeElement;
  const currentIndex = themeOptions.findIndex(
    option => option === activeElement
  );
  const nextIndex =
    currentIndex === -1
      ? 0
      : (currentIndex + offset + themeOptions.length) % themeOptions.length;

  themeOptions[nextIndex]?.focus();
}

function setupThemeListeners(): void {
  if (window.__astroPaperThemeReady) return;

  window.__astroPaperThemeReady = true;
  document.addEventListener("astro:after-swap", setup);
  document.addEventListener("keydown", event => {
    const themeButton = document.querySelector<HTMLButtonElement>("#theme-btn");
    const themeMenu = document.querySelector<HTMLElement>("#theme-menu");
    const menuIsOpen = !!themeMenu && !themeMenu.classList.contains("hidden");

    if (event.key === "Escape") {
      if (menuIsOpen) {
        closeThemeMenu();
        themeButton?.focus();
      }
      return;
    }

    if (!menuIsOpen) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusThemeOption(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusThemeOption(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      getThemeOptions()[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      getThemeOptions().at(-1)?.focus();
    }
  });
  document.addEventListener("click", event => {
    const target = event.target;
    const themePicker = document.querySelector("#theme-picker");

    if (
      target instanceof Node &&
      themePicker &&
      !themePicker.contains(target)
    ) {
      closeThemeMenu();
    }
  });

  // Carry the theme-color value across View Transitions to prevent the
  // Android navigation bar from flashing during page transitions.
  document.addEventListener("astro:before-swap", event => {
    const color = document
      .querySelector("meta[name='theme-color']")
      ?.getAttribute("content");
    if (color) {
      (event as { newDocument: Document }).newDocument
        .querySelector("meta[name='theme-color']")
        ?.setAttribute("content", color);
    }
  });

  // Sync with OS-level dark/light preference changes while following system.
  try {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", ({ matches }) => {
        if (themeMode !== SYSTEM) return;

        themeValue = matches ? DARK : LIGHT;
        reflect();
      });
  } catch {
    // No media-query change listener in this environment.
  }
}

setup();
setupThemeListeners();

export {};
