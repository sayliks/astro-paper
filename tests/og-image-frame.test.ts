import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createCenteredOgBody,
  createOgFooter,
  createOgImageResponse,
  createOgImageFrame,
  createOgSpan,
  createOgSatoriOptions,
  createOgText,
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

test("creates shared Satori options and PNG responses", () => {
  const fonts = [{ name: "Test Font" }];
  const options = createOgSatoriOptions(fonts);
  const response = createOgImageResponse(new Uint8Array([1, 2, 3]));

  assert.deepEqual(options, {
    width: 1200,
    height: 630,
    embedFont: true,
    fonts,
  });
  assert.equal(response.headers.get("Content-Type"), "image/png");
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
