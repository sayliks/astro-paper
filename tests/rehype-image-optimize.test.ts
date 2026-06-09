import assert from "node:assert/strict";
import { test } from "node:test";
import { rehypeImageOptimize } from "../src/utils/transformers/rehypeImageOptimize.ts";

type TestNode = {
  type?: string;
  tagName?: string;
  properties?: Record<
    string,
    string | number | boolean | null | undefined | Array<string | number>
  >;
  children?: TestNode[];
};

const DEFAULT_SIZES = "(max-width: 768px) 100vw, 768px";

function optimize(tree: TestNode) {
  rehypeImageOptimize()(tree);
}

test("prioritizes the first image with dimensions and lazy-loads later images", () => {
  const tree: TestNode = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "img",
        properties: { src: "/uploads/hero.jpg", width: 1200, height: 800 },
      },
      {
        type: "element",
        tagName: "img",
        properties: { src: "/uploads/detail.jpg", width: 900, height: 600 },
      },
    ],
  };

  optimize(tree);

  assert.deepEqual(tree.children?.[0]?.properties, {
    src: "/uploads/hero.jpg",
    width: 1200,
    height: 800,
    loading: "eager",
    decoding: "async",
    sizes: DEFAULT_SIZES,
    fetchpriority: "high",
  });
  assert.deepEqual(tree.children?.[1]?.properties, {
    src: "/uploads/detail.jpg",
    width: 900,
    height: 600,
    loading: "lazy",
    decoding: "async",
    sizes: DEFAULT_SIZES,
  });
});

test("does not prioritize an image without complete dimensions", () => {
  const tree: TestNode = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "img",
        properties: {
          src: "/uploads/no-height.jpg",
          width: 1200,
          decoding: "sync",
          sizes: "(min-width: 960px) 720px, 100vw",
          fetchpriority: "high",
        },
      },
    ],
  };

  optimize(tree);

  assert.deepEqual(tree.children?.[0]?.properties, {
    src: "/uploads/no-height.jpg",
    width: 1200,
    decoding: "sync",
    sizes: "(min-width: 960px) 720px, 100vw",
    loading: "lazy",
  });
});

test("walks nested image nodes", () => {
  const tree: TestNode = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "figure",
        children: [
          {
            type: "element",
            tagName: "img",
            properties: { src: "/uploads/nested.jpg", width: 1000, height: 500 },
          },
        ],
      },
    ],
  };

  optimize(tree);

  assert.equal(
    tree.children?.[0]?.children?.[0]?.properties?.fetchpriority,
    "high"
  );
});
