declare global {
  interface Window {
    __astroPaperNavigationStateReady?: boolean;
  }
}

const BACK_URL_KEY = "backUrl";
const BACK_URL_SOURCE_SELECTOR = "[data-back-url]";

function getStoredBackUrl(): string | null {
  try {
    return sessionStorage.getItem(BACK_URL_KEY);
  } catch {
    return null;
  }
}

function setStoredBackUrl(value: string): void {
  try {
    sessionStorage.setItem(BACK_URL_KEY, value);
  } catch {
    // Keep regular links usable when session storage is unavailable.
  }
}

function rememberCurrentBackUrl(): void {
  const source = document.querySelector<HTMLElement>(BACK_URL_SOURCE_SELECTOR);
  const backUrl = source?.dataset.backUrl;

  if (backUrl) {
    setStoredBackUrl(backUrl);
  }
}

function updateBackButton(): void {
  const backButton = document.querySelector<HTMLAnchorElement>("#back-button");
  const backUrl = getStoredBackUrl();

  if (backButton && backUrl) {
    backButton.href = backUrl;
  }
}

function syncNavigationState(): void {
  rememberCurrentBackUrl();
  updateBackButton();
}

syncNavigationState();

if (!window.__astroPaperNavigationStateReady) {
  window.__astroPaperNavigationStateReady = true;
  document.addEventListener("astro:page-load", syncNavigationState);
}

export {};
