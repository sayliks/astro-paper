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
  savedOn: string;
  data: HitokotoResponse;
};

const HITOKOTO_API =
  "https://v1.hitokoto.cn/?c=d&c=e&c=k&max_length=42&encode=json";
const HITOKOTO_CACHE_KEY = "hitokoto:latest";
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

function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isHitokotoResponse(value: unknown): value is HitokotoResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "hitokoto" in value &&
    "uuid" in value &&
    "from" in value &&
    typeof value.hitokoto === "string" &&
    typeof value.uuid === "string" &&
    typeof value.from === "string" &&
    ("from_who" in value
      ? value.from_who === null || typeof value.from_who === "string"
      : true)
  );
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
    const raw = localStorage.getItem(HITOKOTO_CACHE_KEY);
    if (!raw) return null;

    const cache = JSON.parse(raw) as Partial<HitokotoCache>;
    if (
      cache.savedOn !== getLocalDateKey() ||
      !isHitokotoResponse(cache.data)
    ) {
      return null;
    }

    return cache.data;
  } catch {
    return null;
  }
}

function writeCachedQuote(data: HitokotoResponse): void {
  try {
    localStorage.setItem(
      HITOKOTO_CACHE_KEY,
      JSON.stringify({
        savedOn: getLocalDateKey(),
        data,
      } satisfies HitokotoCache)
    );
  } catch {
    // The fallback quote remains visible when browser storage is unavailable.
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

function setupHitokotoCards(): void {
  document
    .querySelectorAll<HTMLElement>("[data-hitokoto-card]")
    .forEach(card => {
      if (card.dataset.hitokotoReady === "true") return;
      card.dataset.hitokotoReady = "true";

      const cachedQuote = readCachedQuote();
      if (cachedQuote) {
        applyQuote(card, cachedQuote);
      } else {
        void fetchQuote(card, { showLoading: false });
      }

      document.addEventListener(
        "astro:before-swap",
        () => {
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
