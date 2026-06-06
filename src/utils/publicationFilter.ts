export type PublicationEntry = {
  data: {
    draft?: boolean;
    pubDatetime: Date | string;
  };
};

export type PublicationFilterOptions = {
  isDev?: boolean;
  now?: Date | number;
  scheduledPostMargin?: number;
};

function toTime(value: Date | number | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

export function isContentPublished(
  entry: PublicationEntry,
  {
    isDev = false,
    now = Date.now(),
    scheduledPostMargin = 0,
  }: PublicationFilterOptions = {}
): boolean {
  const nowTime = typeof now === "number" ? now : now.getTime();
  const publishTime = toTime(entry.data.pubDatetime);
  const isPublishTimePassed = nowTime > publishTime - scheduledPostMargin;

  return !entry.data.draft && (isDev || isPublishTimePassed);
}
