declare global {
  interface Window {
    __astroPaperHitokotoReady?: boolean;
  }
}

type HitokotoResponse = {
  id: number;
  uuid: string;
  hitokoto: string;
  type: string;
  from: string;
  from_who: string | null;
  creator: string;
  creator_uid: number;
  reviewer: number;
  commit_from: string;
  created_at: string;
  length: number;
};

type HitokotoCache = {
  savedAt: number;
  data: HitokotoResponse;
};

const HITOKOTO_API =
  "https://v1.hitokoto.cn/?c=d&c=e&c=k&max_length=42&encode=json";
const HITOKOTO_REFRESH_MS = 5 * 60 * 1000;
const HITOKOTO_CACHE_KEY = "hitokoto:latest";
const HITOKOTO_CACHE_MAX_AGE_MS = HITOKOTO_REFRESH_MS;
const FALLBACK_QUOTE: HitokotoResponse = {
  id: 0,
  uuid: "",
  hitokoto: "慢慢来，认真走，今天也会有一点新的光。",
  type: "e",
  from: "sayliks corner",
  from_who: null,
  creator: "sayliks",
  creator_uid: 0,
  reviewer: 0,
  commit_from: "fallback",
  created_at: "",
  length: 20,
};

const hitokotoRequests = new WeakMap<HTMLElement, AbortController>();

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

function readCachedQuote(): HitokotoResponse | null {
  try {
    const raw = sessionStorage.getItem(HITOKOTO_CACHE_KEY);
    if (!raw) return null;

    const cache = JSON.parse(raw) as HitokotoCache;
    if (Date.now() - cache.savedAt > HITOKOTO_CACHE_MAX_AGE_MS) return null;

    return cache.data;
  } catch {
    return null;
  }
}

function writeCachedQuote(data: HitokotoResponse): void {
  try {
    sessionStorage.setItem(
      HITOKOTO_CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), data } satisfies HitokotoCache)
    );
  } catch {
    // The fallback quote remains visible when session storage is unavailable.
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
    const data = (await response.json()) as HitokotoResponse;
    writeCachedQuote(data);
    applyQuote(card, data);
  } catch {
    if (controller.signal.aborted) return;

    applyQuote(card, FALLBACK_QUOTE);
    if (error) {
      error.textContent = "一言获取失败，已显示备用句子。";
    }
  } finally {
    if (hitokotoRequests.get(card) === controller) {
      hitokotoRequests.delete(card);
    }
  }
}

function runWhenPageIsIdle(callback: () => void): () => void {
  const requestIdle = window.requestIdleCallback?.bind(window);
  const cancelIdle = window.cancelIdleCallback?.bind(window);

  if (requestIdle) {
    const idleId = requestIdle(callback, { timeout: 2000 });
    return () => cancelIdle?.(idleId);
  }

  let timeoutId: number | undefined;
  const run = () => {
    timeoutId = window.setTimeout(callback, 0);
  };

  if (document.readyState === "complete") {
    run();
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }

  window.addEventListener("load", run, { once: true });
  return () => {
    window.removeEventListener("load", run);
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  };
}

function setupHitokotoCards(): void {
  document
    .querySelectorAll<HTMLElement>("[data-hitokoto-card]")
    .forEach(card => {
      if (card.dataset.hitokotoReady === "true") return;
      card.dataset.hitokotoReady = "true";

      const cachedQuote = readCachedQuote();
      const cancelInitialFetch = cachedQuote
        ? () => undefined
        : runWhenPageIsIdle(() => fetchQuote(card, { showLoading: false }));

      if (cachedQuote) {
        applyQuote(card, cachedQuote);
      }

      const refreshId = window.setInterval(() => {
        if (document.hidden) return;
        fetchQuote(card, { showLoading: false });
      }, HITOKOTO_REFRESH_MS);

      document.addEventListener(
        "astro:before-swap",
        () => {
          cancelInitialFetch();
          window.clearInterval(refreshId);
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
