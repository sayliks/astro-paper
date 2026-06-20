const LIGHT = "light";
const DARK = "dark";
const SYSTEM = "system";

type ResolvedTheme = typeof LIGHT | typeof DARK;

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

function getPrefersDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

function resolveSystemTheme(): ResolvedTheme {
  return getPrefersDark() ? DARK : LIGHT;
}

// Reuse the value already set by the inline FOUC-prevention script if available.
const initialTheme = window.__theme?.value;
let themeValue: ResolvedTheme =
  isResolvedTheme(initialTheme) && resolveSystemTheme() === initialTheme
    ? initialTheme
    : resolveSystemTheme();
let themeColorFrame: number | undefined;

function persistSystemTheme(): void {
  window.__theme = {
    mode: SYSTEM,
    value: themeValue,
  };
  reflect();
}

function scheduleThemeColorUpdate(): void {
  if (themeColorFrame) {
    window.cancelAnimationFrame(themeColorFrame);
  }

  themeColorFrame = window.requestAnimationFrame(() => {
    themeColorFrame = undefined;

    const bg = window.getComputedStyle(document.body).backgroundColor;
    document
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", bg);
  });
}

function reflect(): void {
  const root = document.firstElementChild;
  root?.setAttribute("data-theme", themeValue);
  root?.setAttribute("data-theme-mode", SYSTEM);

  // Fill <meta name="theme-color"> with the computed background colour so
  // Android's browser chrome matches the page background.
  scheduleThemeColorUpdate();
}

function setup(): void {
  reflect();
}

function setupThemeListeners(): void {
  if (window.__astroPaperThemeReady) return;

  window.__astroPaperThemeReady = true;
  document.addEventListener("astro:after-swap", setup);

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

  // Sync with OS-level dark/light preference changes.
  try {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", ({ matches }) => {
        themeValue = matches ? DARK : LIGHT;
        persistSystemTheme();
      });
  } catch {
    // No media-query change listener in this environment.
  }
}

setup();
setupThemeListeners();

export {};
