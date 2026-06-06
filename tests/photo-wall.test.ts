import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getPublishedPhotoWallItems,
  isExternalPhotoSrc,
  resolvePhotoWallSrc,
} from "../src/utils/photoWall.ts";

const validPhoto = {
  src: "photo-wall/a.jpg",
  title: "A",
  alt: "A photo",
  width: 1200,
  height: 800,
  order: 20,
  published: true,
};

test("filters unpublished photo wall items and sorts by order", () => {
  const photos = getPublishedPhotoWallItems({
    photos: [
      validPhoto,
      { ...validPhoto, src: "photo-wall/b.jpg", title: "B", order: 10 },
      {
        ...validPhoto,
        src: "photo-wall/c.jpg",
        title: "C",
        order: 5,
        published: false,
      },
    ],
  });

  assert.deepEqual(
    photos.map(photo => photo.title),
    ["B", "A"]
  );
});

test("resolves local photo wall sources with the asset path helper", () => {
  assert.equal(
    resolvePhotoWallSrc("photo-wall/a.jpg", path => `/base/${path}`),
    "/base/photo-wall/a.jpg"
  );
});

test("keeps external photo wall URLs unchanged", () => {
  assert.equal(isExternalPhotoSrc("https://example.com/a.jpg"), true);
  assert.equal(
    resolvePhotoWallSrc("https://example.com/a.jpg", path => `/base/${path}`),
    "https://example.com/a.jpg"
  );
});

test("rejects invalid photo wall dimensions and empty text fields", () => {
  assert.throws(() =>
    getPublishedPhotoWallItems({
      photos: [{ ...validPhoto, width: 0 }],
    })
  );
  assert.throws(() =>
    getPublishedPhotoWallItems({
      photos: [{ ...validPhoto, alt: "" }],
    })
  );
  assert.throws(() =>
    getPublishedPhotoWallItems({
      photos: [{ ...validPhoto, title: "" }],
    })
  );
});
