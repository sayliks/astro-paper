export type PhotoWallItem = {
  src: string;
  title: string;
  alt: string;
  width: number;
  height: number;
  order: number;
  published: boolean;
};

type PhotoWallData = {
  photos?: unknown;
};

type AssetPathResolver = (path: string) => string;

type PhotoWallOptions = {
  allowedExternalHosts?: readonly string[];
};

type ResolvedPhotoWallOptions = {
  allowedExternalHostSet: ReadonlySet<string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readString(value: unknown, field: string, index: number): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  throw new Error(`Photo wall item ${index + 1} has an invalid ${field}.`);
}

function createResolvedPhotoWallOptions(
  options: PhotoWallOptions
): ResolvedPhotoWallOptions {
  return {
    allowedExternalHostSet: new Set(
      (options.allowedExternalHosts ?? [])
        .map(normalizeAllowedHost)
        .filter(Boolean)
    ),
  };
}

function parseExternalPhotoUrl(url: string, index: number): URL {
  try {
    return new URL(url);
  } catch {
    throw new Error(
      `Photo wall item ${index + 1} has a malformed external src.`
    );
  }
}

function getExternalPhotoHost(src: string, index: number): string | undefined {
  if (/^\/\//.test(src)) {
    throw new Error(
      `Photo wall item ${index + 1} external src must use https://.`
    );
  }

  if (/^https?:/i.test(src)) {
    if (/^http:\/\//i.test(src)) {
      throw new Error(
        `Photo wall item ${index + 1} external src must use https://.`
      );
    }

    if (!/^https:\/\/[^/]/i.test(src)) {
      throw new Error(
        `Photo wall item ${index + 1} has a malformed external src.`
      );
    }

    return parseExternalPhotoUrl(src, index).hostname.toLowerCase();
  }

  return undefined;
}

function normalizeAllowedHost(host: string): string {
  return host.trim().toLowerCase();
}

function isAllowedExternalPhotoHost(
  host: string,
  allowedHostSet: ReadonlySet<string>
): boolean {
  return allowedHostSet.has(host);
}

function readPhotoSrc(
  value: unknown,
  index: number,
  options: ResolvedPhotoWallOptions
): string {
  const src = readString(value, "src", index);
  const hasProtocol = /^[a-z][\w+.-]*:/i.test(src);

  if (hasProtocol && !/^https?:/i.test(src)) {
    throw new Error(`Photo wall item ${index + 1} has an unsupported src.`);
  }

  const externalHost = getExternalPhotoHost(src, index);
  if (
    externalHost &&
    !isAllowedExternalPhotoHost(externalHost, options.allowedExternalHostSet)
  ) {
    throw new Error(
      `Photo wall item ${index + 1} uses an unapproved external src host.`
    );
  }

  return src;
}

function readPositiveInteger(
  value: unknown,
  field: string,
  index: number
): number {
  const number = Number(value);
  if (Number.isInteger(number) && number > 0) {
    return number;
  }
  throw new Error(
    `Photo wall item ${index + 1} has an invalid positive integer ${field}.`
  );
}

function readFiniteNumber(
  value: unknown,
  field: string,
  index: number
): number {
  const number = Number(value);
  if (Number.isFinite(number)) {
    return number;
  }
  throw new Error(`Photo wall item ${index + 1} has an invalid ${field}.`);
}

function readBoolean(value: unknown, field: string, index: number): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  throw new Error(`Photo wall item ${index + 1} has an invalid ${field}.`);
}

export function isExternalPhotoSrc(src: string): boolean {
  return /^https:\/\//i.test(src);
}

export function resolvePhotoWallSrc(
  src: string,
  getAssetPath: AssetPathResolver
): string {
  return isExternalPhotoSrc(src) ? src : getAssetPath(src);
}

export function getPublishedPhotoWallItems(
  data: PhotoWallData,
  options: PhotoWallOptions = {}
): PhotoWallItem[] {
  if (!Array.isArray(data.photos)) {
    throw new Error("Photo wall data must contain a photos array.");
  }

  const resolvedOptions = createResolvedPhotoWallOptions(options);

  return data.photos
    .map((item, index) => {
      if (!isRecord(item)) {
        throw new Error(`Photo wall item ${index + 1} must be an object.`);
      }

      return {
        src: readPhotoSrc(item.src, index, resolvedOptions),
        title: readString(item.title, "title", index),
        alt: readString(item.alt, "alt", index),
        width: readPositiveInteger(item.width, "width", index),
        height: readPositiveInteger(item.height, "height", index),
        order: readFiniteNumber(item.order, "order", index),
        published: readBoolean(item.published, "published", index),
      };
    })
    .filter(item => item.published)
    .sort((a, b) => a.order - b.order);
}
