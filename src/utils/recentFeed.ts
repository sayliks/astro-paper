type FeedDate = Date | string | null | undefined;

export type RecentFeedPostInput = {
  data: {
    pubDatetime: Date | string;
    modDatetime?: FeedDate;
    featured?: boolean;
  };
};

export type RecentFeedMomentInput = {
  data: {
    pubDatetime: Date | string;
    modDatetime?: FeedDate;
    pinned?: boolean;
  };
};

export type RecentFeedItem<
  Post extends RecentFeedPostInput,
  Moment extends RecentFeedMomentInput,
> =
  | {
      type: "post";
      sortTime: number;
      post: Post;
    }
  | {
      type: "moment";
      sortTime: number;
      moment: Moment;
    };

type RecentFeedOptions<
  Post extends RecentFeedPostInput,
  Moment extends RecentFeedMomentInput,
> = {
  posts: readonly Post[];
  moments: readonly Moment[];
  limit: number;
};

const getSortTime = (date: FeedDate) => (date ? new Date(date).getTime() : 0);

const getEntrySortTime = (entry: RecentFeedPostInput | RecentFeedMomentInput) =>
  getSortTime(entry.data.modDatetime ?? entry.data.pubDatetime);

export function getRecentFeedItems<
  Post extends RecentFeedPostInput,
  Moment extends RecentFeedMomentInput,
>({
  posts,
  moments,
  limit,
}: RecentFeedOptions<Post, Moment>): RecentFeedItem<Post, Moment>[] {
  if (limit <= 0) return [];

  const recentPostCandidates = posts
    .filter(post => !post.data.featured)
    .slice(0, limit);

  const recentMomentCandidates = moments
    .map((moment, index) => ({
      moment,
      inputIndex: index,
      sortTime: getEntrySortTime(moment),
    }))
    .sort((a, b) => b.sortTime - a.sortTime || a.inputIndex - b.inputIndex)
    .slice(0, limit);

  return [
    ...recentPostCandidates.map((post, index) => ({
      type: "post" as const,
      sortTime: getEntrySortTime(post),
      post,
      feedIndex: index,
    })),
    ...recentMomentCandidates.map((item, index) => ({
      type: "moment" as const,
      sortTime: item.sortTime,
      moment: item.moment,
      feedIndex: recentPostCandidates.length + index,
    })),
  ]
    .sort((a, b) => b.sortTime - a.sortTime || a.feedIndex - b.feedIndex)
    .slice(0, limit)
    .map(({ feedIndex: _feedIndex, ...item }) => item);
}
