type HastProperties = Record<
  string,
  string | number | boolean | null | undefined | Array<string | number>
>;

type HastNode = {
  type?: string;
  tagName?: string;
  properties?: HastProperties;
  children?: HastNode[];
};

export function rehypeImageOptimize() {
  return (tree: HastNode): void => {
    let isFirstImage = true;

    function walk(node: HastNode): void {
      if (node.type === "element" && node.tagName === "img") {
        node.properties ??= {};
        node.properties.loading = isFirstImage ? "eager" : "lazy";
        node.properties.decoding = "async";
        node.properties.sizes ??= "(max-width: 768px) 100vw, 768px";
        isFirstImage = false;
      }

      for (const child of node.children ?? []) {
        walk(child);
      }
    }

    walk(tree);
  };
}
