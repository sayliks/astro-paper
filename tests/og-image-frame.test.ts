import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createCenteredOgBody,
  createOgFooter,
  createOgImageFrame,
  createOgSpan,
  createOgText,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  type OgNode,
} from "../src/utils/ogImageFrame.ts";

function asNode(value: unknown): OgNode {
  assert.ok(value && typeof value === "object" && "props" in value);
  return value as OgNode;
}

function asNodeArray(value: unknown): OgNode[] {
  assert.ok(Array.isArray(value));
  return value.map(asNode);
}

test("keeps shared OG image dimensions and response content type", () => {
  assert.equal(OG_IMAGE_WIDTH, 1200);
  assert.equal(OG_IMAGE_HEIGHT, 630);
  assert.equal(OG_IMAGE_CONTENT_TYPE, "image/png");
});

test("creates the shared OG frame shell around route-provided content", () => {
  const body = createOgText("Post title", {
    fontSize: 72,
    fontWeight: "bold",
    maxHeight: "84%",
    overflow: "hidden",
  });
  const footer = createOgFooter(createOgSpan("Site title"), "space-between");
  const frame = createOgImageFrame({ body, footer });

  assert.equal(frame.type, "div");
  assert.equal(frame.key, null);
  assert.deepEqual(frame.props.style, {
    background: "#fefbfb",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Google Sans Code",
  });

  const [shadow, card] = asNodeArray(frame.props.children);
  assert.deepEqual(shadow.props.style, {
    position: "absolute",
    top: "-1px",
    right: "-1px",
    border: "4px solid #000",
    background: "#ecebeb",
    opacity: "0.9",
    borderRadius: "4px",
    display: "flex",
    justifyContent: "center",
    margin: "2.5rem",
    width: "88%",
    height: "80%",
  });
  assert.deepEqual(card.props.style, {
    border: "4px solid #000",
    background: "#fefbfb",
    borderRadius: "4px",
    display: "flex",
    justifyContent: "center",
    margin: "2rem",
    width: "88%",
    height: "80%",
  });

  const content = asNode(card.props.children);
  assert.deepEqual(content.props.style, {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    margin: "20px",
    width: "90%",
    height: "90%",
  });
  assert.deepEqual(asNodeArray(content.props.children), [body, footer]);
});

test("creates centered site OG body and footer structure", () => {
  const title = createOgText("Site title", {
    fontSize: 72,
    fontWeight: "bold",
  });
  const description = createOgText("Site description", { fontSize: 28 });
  const body = createCenteredOgBody([title, description]);
  const footer = createOgFooter(
    createOgSpan("example.com", {
      overflow: "hidden",
      fontWeight: "bold",
    }),
    "flex-end"
  );

  assert.deepEqual(body.props.style, {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "90%",
    maxHeight: "90%",
    overflow: "hidden",
    textAlign: "center",
  });
  assert.deepEqual(asNodeArray(body.props.children), [title, description]);
  assert.deepEqual(footer.props.style, {
    display: "flex",
    justifyContent: "flex-end",
    width: "100%",
    marginBottom: "8px",
    fontSize: 28,
  });
});
