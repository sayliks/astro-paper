import type { PagefindTranslations } from "@pagefind/default-ui";

declare global {
  interface Window {
    __astroPaperSearchReady?: boolean;
  }
}

type IdleHandle =
  | { type: "idle"; id: number }
  | { type: "timeout"; id: ReturnType<typeof setTimeout> };
type PagefindUIConstructor = typeof import("@pagefind/default-ui").PagefindUI;

const SEARCH_CONTAINER_SELECTOR = "#pagefind-search";
const SEARCH_READY = "searchReady";
const SEARCH_PENDING = "searchPending";
const BACK_URL_KEY = "backUrl";
const SAME_ORIGIN_BASE = "https://astro-paper.local";

let pendingSearch:
  | {
      container: HTMLElement;
      handle: IdleHandle;
    }
  | undefined;
let searchRunId = 0;

function getDatasetValue(
  container: HTMLElement,
  key: keyof DOMStringMap
): string {
  return container.dataset[key]?.trim() ?? "";
}

function getSearchContainer(): HTMLElement | null {
  return document.querySelector<HTMLElement>(SEARCH_CONTAINER_SELECTOR);
}

function scheduleIdle(callback: () => void): IdleHandle {
  if ("requestIdleCallback" in window && "cancelIdleCallback" in window) {
    return {
      type: "idle",
      id: window.requestIdleCallback(callback),
    };
  }

  return {
    type: "timeout",
    id: globalThis.setTimeout(callback, 1),
  };
}

function cancelIdle(handle: IdleHandle): void {
  if (handle.type === "idle" && "cancelIdleCallback" in window) {
    window.cancelIdleCallback(handle.id);
    return;
  }

  globalThis.clearTimeout(handle.id);
}

function cancelPendingSearch(container?: HTMLElement): void {
  if (!pendingSearch) return;
  if (container && pendingSearch.container !== container) return;

  searchRunId += 1;
  cancelIdle(pendingSearch.handle);
  delete pendingSearch.container.dataset[SEARCH_PENDING];
  pendingSearch = undefined;
}

function readTranslations(container: HTMLElement): PagefindTranslations {
  const raw = getDatasetValue(container, "translations");
  if (!raw) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string"
      )
    );
  } catch {
    return {};
  }
}

function showDevSearchNotice(container: HTMLElement): void {
  const notice = document.createElement("div");
  notice.className = "bg-muted/75 mb-4 space-y-4 rounded p-4";

  const message = document.createElement("p");
  const prefix = document.createElement("strong");
  prefix.textContent = getDatasetValue(container, "devNoticeTitle");
  message.append(prefix, getDatasetValue(container, "devNoticeMessage"));

  const command = document.createElement("code");
  command.className = "block rounded bg-black px-2 py-1 text-white";
  command.textContent = getDatasetValue(container, "devNoticeCommand");

  notice.append(message, command);
  container.replaceChildren(notice);
  container.dataset[SEARCH_READY] = "true";
}

async function loadPagefindUI(): Promise<PagefindUIConstructor> {
  const { PagefindUI } = await import("@pagefind/default-ui");
  return PagefindUI;
}

export function getSearchUrlWithTerm(currentSearch: string, term: string) {
  const params = new URLSearchParams(currentSearch);
  params.set("q", term);
  return `?${params.toString()}`;
}

function getSameOriginPath(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = new URL(trimmed, SAME_ORIGIN_BASE);
    return parsed.origin === SAME_ORIGIN_BASE ? parsed.pathname : undefined;
  } catch {
    return undefined;
  }
}

function getSafeSearch(search: string) {
  return search.startsWith("?") ? search : "";
}

export function getSafeBackUrl(backUrl: string, fallbackPath = "/") {
  const fallback = getSameOriginPath(fallbackPath) ?? "/";
  const value = getSameOriginPath(backUrl);
  if (!value) return fallback;

  return value;
}

export function getBackUrlWithSearch(
  backUrl: string,
  search: string,
  fallbackPath = "/"
) {
  return `${getSafeBackUrl(backUrl, fallbackPath)}${getSafeSearch(search)}`;
}

export function shouldResetSearchParam(value: string | null | undefined) {
  return (value ?? "").trim() === "";
}

function rememberSearchBackUrl(
  backUrl: string,
  search: string,
  fallbackPath: string
): void {
  try {
    sessionStorage.setItem(
      BACK_URL_KEY,
      getBackUrlWithSearch(backUrl, search, fallbackPath)
    );
  } catch {
    // The regular back link still works when storage is unavailable.
  }
}

function replaceCurrentUrl(search: string): void {
  history.replaceState(history.state, "", search || window.location.pathname);
}

function isCurrentSearchContainer(container: HTMLElement, runId: number) {
  return (
    searchRunId === runId &&
    document.contains(container) &&
    getSearchContainer() === container
  );
}

async function initializePagefind(
  container: HTMLElement,
  runId: number
): Promise<void> {
  if (!isCurrentSearchContainer(container, runId)) return;

  if (import.meta.env.DEV) {
    showDevSearchNotice(container);
    return;
  }

  const bundlePath = getDatasetValue(container, "bundlePath");
  if (!bundlePath) return;

  const backUrl =
    getDatasetValue(container, "backUrl") || window.location.pathname;

  const PagefindUI = await loadPagefindUI();
  if (!isCurrentSearchContainer(container, runId)) return;

  const search = new PagefindUI({
    element: SEARCH_CONTAINER_SELECTOR,
    bundlePath,
    showImages: false,
    showSubResults: true,
    translations: readTranslations(container),
    processTerm(term: string) {
      const nextSearch = getSearchUrlWithTerm(window.location.search, term);
      replaceCurrentUrl(nextSearch);
      rememberSearchBackUrl(backUrl, nextSearch, window.location.pathname);
      return term;
    },
  });

  const query = new URLSearchParams(window.location.search).get("q");
  if (query) {
    search.triggerSearch(query);
  }

  const resetSearchParam = (event: Event) => {
    if (
      shouldResetSearchParam((event.target as HTMLInputElement | null)?.value)
    ) {
      replaceCurrentUrl("");
    }
  };

  container
    .querySelector(".pagefind-ui__search-input")
    ?.addEventListener("input", resetSearchParam);
  container
    .querySelector(".pagefind-ui__search-clear")
    ?.addEventListener("click", resetSearchParam);

  container.dataset[SEARCH_READY] = "true";
}

function setupSearch(): void {
  const container = getSearchContainer();
  if (!container) return;
  if (container.dataset[SEARCH_READY] === "true") return;
  if (container.dataset[SEARCH_PENDING] === "true") return;
  if (container.querySelector("form")) {
    container.dataset[SEARCH_READY] = "true";
    return;
  }
  if (!getDatasetValue(container, "bundlePath")) return;

  container.dataset[SEARCH_PENDING] = "true";
  const runId = (searchRunId += 1);

  const handle = scheduleIdle(() => {
    void initializePagefind(container, runId).finally(() => {
      if (searchRunId === runId && pendingSearch?.container === container) {
        pendingSearch = undefined;
      }
      delete container.dataset[SEARCH_PENDING];
    });
  });

  pendingSearch = { container, handle };
}

function setupSearchListeners(): void {
  if (window.__astroPaperSearchReady) return;

  window.__astroPaperSearchReady = true;
  document.addEventListener("astro:after-swap", setupSearch);
  document.addEventListener("astro:page-load", setupSearch);
  document.addEventListener("astro:before-swap", () => cancelPendingSearch());
}

if (typeof document !== "undefined") {
  setupSearch();
  setupSearchListeners();
}

export {};
