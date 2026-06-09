import {
  getFetchFailureQuote,
  isHitokotoResponse,
  readCachedQuote,
  writeCachedQuote,
  type HitokotoResponse,
} from "./hitokoto-cache";

declare global {
  interface Window {
    __astroPaperHitokotoReady?: boolean;
  }
}

const HITOKOTO_API =
  "https://v1.hitokoto.cn/?c=d&c=e&c=k&max_length=42&encode=json";

const hitokotoRequests = new WeakMap<HTMLElement, AbortController>();
type QuoteFetchHandle =
  | { type: "idle"; id: number }
  | { type: "timeout"; id: ReturnType<typeof setTimeout> };

const scheduledQuoteFetches = new WeakMap<HTMLElement, QuoteFetchHandle>();

function getQuoteStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function formatSource(data: HitokotoResponse): string {
  if (data.from) return data.from;
  return "一言";
}

function formatAuthor(data: HitokotoResponse): string {
  return data.from_who || data.creator || "佚名";
}

function formatQuoteText(value: string): string {
  return value.trim().replace(/([。！？!?])\s*(?=\S)/g, "$1\n\n");
}

function applyQuote(card: HTMLElement, data: HitokotoResponse): void {
  const text = card.querySelector<HTMLElement>("[data-hitokoto-text]");
  const link = card.querySelector<HTMLAnchorElement>("[data-hitokoto-link]");

  if (text) text.textContent = `“${formatQuoteText(data.hitokoto)}”`;

  if (link) {
    const meta = `-- ${formatAuthor(data)} / ${formatSource(data)}`;
    link.textContent = meta;
    link.setAttribute("aria-label", `查看一言出处：${meta}`);

    if (data.uuid) {
      link.href = `https://hitokoto.cn/?uuid=${encodeURIComponent(data.uuid)}`;
    } else {
      link.href = "https://hitokoto.cn/";
    }
  }
}

async function fetchQuote(
  card: HTMLElement,
  { showLoading = true }: { showLoading?: boolean } = {}
): Promise<void> {
  if (hitokotoRequests.has(card)) return;

  const controller = new AbortController();
  const text = card.querySelector<HTMLElement>("[data-hitokoto-text]");
  const error = card.querySelector<HTMLElement>("[data-hitokoto-error]");

  hitokotoRequests.set(card, controller);

  if (showLoading && text) text.textContent = "正在获取一言...";
  if (error) error.textContent = "";

  try {
    const response = await fetch(HITOKOTO_API, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Hitokoto request failed");
    const data: unknown = await response.json();
    if (!isHitokotoResponse(data)) {
      throw new Error("Unexpected Hitokoto response");
    }

    writeCachedQuote(getQuoteStorage(), data);
    applyQuote(card, data);
  } catch {
    if (controller.signal.aborted) return;

    applyQuote(card, getFetchFailureQuote(getQuoteStorage()));
    if (error) {
      error.textContent = "一言获取失败，已显示备用句子。";
    }
  } finally {
    if (hitokotoRequests.get(card) === controller) {
      hitokotoRequests.delete(card);
    }
  }
}

function scheduleQuoteFetch(card: HTMLElement): void {
  if (scheduledQuoteFetches.has(card)) return;

  if ("requestIdleCallback" in window) {
    const callbackId = window.requestIdleCallback(() => {
      scheduledQuoteFetches.delete(card);
      void fetchQuote(card, { showLoading: false });
    });
    scheduledQuoteFetches.set(card, { type: "idle", id: callbackId });
    return;
  }

  const timeoutId = globalThis.setTimeout(() => {
    scheduledQuoteFetches.delete(card);
    void fetchQuote(card, { showLoading: false });
  }, 1);
  scheduledQuoteFetches.set(card, { type: "timeout", id: timeoutId });
}

function cancelScheduledQuoteFetch(card: HTMLElement): void {
  const handle = scheduledQuoteFetches.get(card);

  if (!handle) return;

  if (handle.type === "idle") {
    window.cancelIdleCallback(handle.id);
  } else {
    globalThis.clearTimeout(handle.id);
  }

  scheduledQuoteFetches.delete(card);
}

function setupHitokotoCards(): void {
  document
    .querySelectorAll<HTMLElement>("[data-hitokoto-card]")
    .forEach(card => {
      if (card.dataset.hitokotoReady === "true") return;
      card.dataset.hitokotoReady = "true";

      const cachedQuote = readCachedQuote(getQuoteStorage());
      if (cachedQuote) {
        applyQuote(card, cachedQuote);
      } else {
        scheduleQuoteFetch(card);
      }

      document.addEventListener(
        "astro:before-swap",
        () => {
          cancelScheduledQuoteFetch(card);
          hitokotoRequests.get(card)?.abort();
          hitokotoRequests.delete(card);
        },
        { once: true }
      );
    });
}

setupHitokotoCards();

if (!window.__astroPaperHitokotoReady) {
  window.__astroPaperHitokotoReady = true;
  document.addEventListener("astro:page-load", setupHitokotoCards);
}

export {};
