import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getRecentFeedItems,
  type RecentFeedMomentInput,
  type RecentFeedPostInput,
} from "../src/utils/recentFeed.ts";

type TestPost = RecentFeedPostInput & { id: string };
type TestMoment = RecentFeedMomentInput & { id: string };

function createPost(
  id: string,
  pubDatetime: string,
  overrides: Partial<TestPost["data"]> = {}
): TestPost {
  return {
    id,
    data: {
      pubDatetime,
      ...overrides,
    },
  };
}

function createMoment(
  id: string,
  pubDatetime: string,
  overrides: Partial<TestMoment["data"]> = {}
): TestMoment {
  return {
    id,
    data: {
      pubDatetime,
      ...overrides,
    },
  };
}

function feedIds(items: ReturnType<typeof getRecentFeedItems<TestPost, TestMoment>>) {
  return items.map(item =>
    item.type === "post" ? `post:${item.post.id}` : `moment:${item.moment.id}`
  );
}

test("builds a posts-only recent feed", () => {
  const older = createPost("older", "2026-06-01T10:00:00+08:00");
  const newer = createPost("newer", "2026-06-02T10:00:00+08:00");

  assert.deepEqual(
    feedIds(getRecentFeedItems({ posts: [newer, older], moments: [], limit: 4 })),
    ["post:newer", "post:older"]
  );
});

test("builds a moments-only recent feed by activity date", () => {
  const older = createMoment("older", "2026-06-01T10:00:00+08:00");
  const updated = createMoment("updated", "2026-06-01T09:00:00+08:00", {
    modDatetime: "2026-06-03T10:00:00+08:00",
  });

  assert.deepEqual(
    feedIds(
      getRecentFeedItems({ posts: [], moments: [older, updated], limit: 4 })
    ),
    ["moment:updated", "moment:older"]
  );
});

test("builds a mixed feed in descending chronological order", () => {
  const post = createPost("post", "2026-06-03T10:00:00+08:00");
  const olderMoment = createMoment("older", "2026-06-02T10:00:00+08:00");
  const newerMoment = createMoment("newer", "2026-06-04T10:00:00+08:00");

  assert.deepEqual(
    feedIds(
      getRecentFeedItems({
        posts: [post],
        moments: [olderMoment, newerMoment],
        limit: 4,
      })
    ),
    ["moment:newer", "post:post", "moment:older"]
  );
});

test("applies the final result limit", () => {
  const posts = [
    createPost("post-1", "2026-06-05T10:00:00+08:00"),
    createPost("post-2", "2026-06-04T10:00:00+08:00"),
  ];
  const moments = [
    createMoment("moment-1", "2026-06-06T10:00:00+08:00"),
    createMoment("moment-2", "2026-06-03T10:00:00+08:00"),
  ];

  assert.deepEqual(
    feedIds(getRecentFeedItems({ posts, moments, limit: 2 })),
    ["moment:moment-1", "post:post-1"]
  );
});

test("uses deterministic equal-date ordering", () => {
  const date = "2026-06-06T10:00:00+08:00";
  const post = createPost("post", date);
  const moment = createMoment("moment", date);

  assert.deepEqual(
    feedIds(getRecentFeedItems({ posts: [post], moments: [moment], limit: 4 })),
    ["post:post", "moment:moment"]
  );
});

test("does not mutate input arrays", () => {
  const posts = [
    createPost("post-1", "2026-06-01T10:00:00+08:00"),
    createPost("post-2", "2026-06-03T10:00:00+08:00"),
  ];
  const moments = [
    createMoment("moment-1", "2026-06-02T10:00:00+08:00"),
    createMoment("moment-2", "2026-06-04T10:00:00+08:00"),
  ];

  getRecentFeedItems({ posts, moments, limit: 3 });

  assert.deepEqual(
    posts.map(post => post.id),
    ["post-1", "post-2"]
  );
  assert.deepEqual(
    moments.map(moment => moment.id),
    ["moment-1", "moment-2"]
  );
});

test("does not promote pinned moments above newer activity", () => {
  const pinnedOlder = createMoment(
    "pinned-older",
    "2026-06-01T10:00:00+08:00",
    { pinned: true }
  );
  const normalNewer = createMoment("normal-newer", "2026-06-02T10:00:00+08:00");

  assert.deepEqual(
    feedIds(
      getRecentFeedItems({
        posts: [],
        moments: [pinnedOlder, normalNewer],
        limit: 4,
      })
    ),
    ["moment:normal-newer", "moment:pinned-older"]
  );
});

test("excludes featured posts from the recent feed", () => {
  const featured = createPost("featured", "2026-06-06T10:00:00+08:00", {
    featured: true,
  });
  const normal = createPost("normal", "2026-06-05T10:00:00+08:00");

  assert.deepEqual(
    feedIds(getRecentFeedItems({ posts: [featured, normal], moments: [], limit: 4 })),
    ["post:normal"]
  );
});

test("returns an empty feed for empty input", () => {
  assert.deepEqual(getRecentFeedItems({ posts: [], moments: [], limit: 4 }), []);
});
