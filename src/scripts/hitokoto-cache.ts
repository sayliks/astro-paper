export type HitokotoResponse = {
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

export type HitokotoStorage = Pick<Storage, "getItem" | "setItem">;

export const HITOKOTO_CACHE_KEY = "hitokoto:latest";

export const FALLBACK_QUOTE: HitokotoResponse = {
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

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type ReadCachedQuoteOptions = {
  date?: Date;
  includeStale?: boolean;
};

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isHitokotoResponse(value: unknown): value is HitokotoResponse {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "number" &&
    typeof value.uuid === "string" &&
    isNonEmptyString(value.hitokoto) &&
    typeof value.type === "string" &&
    typeof value.from === "string" &&
    (value.from_who === null || typeof value.from_who === "string") &&
    typeof value.creator === "string" &&
    typeof value.creator_uid === "number" &&
    typeof value.reviewer === "number" &&
    typeof value.commit_from === "string" &&
    typeof value.created_at === "string" &&
    typeof value.length === "number"
  );
}

function readCache(
  storage: HitokotoStorage | null | undefined
): HitokotoCache | null {
  if (!storage) return null;

  try {
    const raw = storage.getItem(HITOKOTO_CACHE_KEY);
    if (!raw) return null;

    const cache = JSON.parse(raw) as Partial<HitokotoCache>;
    const { data, savedOn } = cache;
    if (
      typeof savedOn !== "string" ||
      !DATE_KEY_PATTERN.test(savedOn) ||
      !isHitokotoResponse(data)
    ) {
      return null;
    }

    return {
      savedOn,
      data,
    };
  } catch {
    return null;
  }
}

export function readCachedQuote(
  storage: HitokotoStorage | null | undefined,
  { date = new Date(), includeStale = false }: ReadCachedQuoteOptions = {}
): HitokotoResponse | null {
  const cache = readCache(storage);
  if (!cache) return null;

  if (!includeStale && cache.savedOn !== getLocalDateKey(date)) {
    return null;
  }

  return cache.data;
}

export function writeCachedQuote(
  storage: HitokotoStorage | null | undefined,
  data: unknown,
  date = new Date()
): boolean {
  if (!storage || !isHitokotoResponse(data)) return false;

  try {
    storage.setItem(
      HITOKOTO_CACHE_KEY,
      JSON.stringify({
        savedOn: getLocalDateKey(date),
        data,
      } satisfies HitokotoCache)
    );
    return true;
  } catch {
    return false;
  }
}

export function getFetchFailureQuote(
  storage: HitokotoStorage | null | undefined
): HitokotoResponse {
  return (
    readCachedQuote(storage, {
      includeStale: true,
    }) ?? FALLBACK_QUOTE
  );
}
