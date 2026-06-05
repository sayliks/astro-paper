const THEME_KEY = "theme";
const LIGHT = "light";
const DARK = "dark";

function isTheme(value: string | null): value is typeof LIGHT | typeof DARK {
  return value === LIGHT || value === DARK;
}

function getPreferredTheme(): string {
  const stored = localStorage.getItem(THEME_KEY);
  if (isTheme(stored)) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? DARK
    : LIGHT;
}

// Reuse the value already set by the inline FOUC-prevention script if available.
let themeValue: string =
  (window as unknown as { __theme?: { value: string } }).__theme?.value ??
  getPreferredTheme();

function persist(): void {
  localStorage.setItem(THEME_KEY, themeValue);
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
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", ({ matches }) => {
    if (isTheme(localStorage.getItem(THEME_KEY))) return;

    themeValue = matches ? DARK : LIGHT;
    reflect();
  });
