const THEME_KEY = "theme";
const LIGHT = "light";
const DARK = "dark";

function isTheme(
  value: string | null | undefined
): value is typeof LIGHT | typeof DARK {
  return value === LIGHT || value === DARK;
}

function getStoredTheme(): string | null {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function setStoredTheme(value: string): void {
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

function getPreferredTheme(): string {
  const stored = getStoredTheme();
  if (isTheme(stored)) return stored;
  return getPrefersDark() ? DARK : LIGHT;
}

// Reuse the value already set by the inline FOUC-prevention script if available.
const initialTheme = (window as unknown as { __theme?: { value: string } })
  .__theme?.value;
let themeValue: string = isTheme(initialTheme)
  ? initialTheme
  : getPreferredTheme();

function persist(): void {
  setStoredTheme(themeValue);
  (window as unknown as { __theme?: { value: string } }).__theme = {
    value: themeValue,
  };
  reflect();
}

function reflect(): void {
  document.firstElementChild?.setAttribute("data-theme", themeValue);
  document
    .querySelector("#theme-btn")
    ?.setAttribute(
      "aria-label",
      themeValue === DARK ? "切换到浅色模式" : "切换到深色模式"
    );

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
    themeValue = themeValue === LIGHT ? DARK : LIGHT;
    persist();
  };
}

setup();

// Re-run after View Transitions navigation.
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
      if (isTheme(getStoredTheme())) return;

      themeValue = matches ? DARK : LIGHT;
      reflect();
    });
} catch {
  // No media-query change listener in this environment.
}
