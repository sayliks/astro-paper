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

function getNextThemeMode(): ThemeMode {
  if (themeMode === SYSTEM) return LIGHT;
  if (themeMode === LIGHT) return DARK;
  return SYSTEM;
}

function reflect(): void {
  const root = document.firstElementChild;
  root?.setAttribute("data-theme", themeValue);
  root?.setAttribute("data-theme-mode", themeMode);

  const themeButton = document.querySelector<HTMLButtonElement>("#theme-btn");
  const toggleLabel = themeButton?.dataset.labelToggle ?? "Toggle theme";
  const currentLabel = themeButton?.dataset.labelCurrent ?? "Current theme";
  const themeLabel =
    themeButton?.dataset[
      `label${themeMode.charAt(0).toUpperCase()}${themeMode.slice(1)}`
    ] ?? themeMode;
  const label = `${toggleLabel} (${currentLabel}: ${themeLabel})`;
  themeButton?.setAttribute("aria-label", label);
  themeButton?.setAttribute("title", label);

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

  if (!themeButton) return;

  themeButton.onclick = () => {
    themeMode = getNextThemeMode();
    themeValue = resolveTheme(themeMode);
    persist();
  };
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
