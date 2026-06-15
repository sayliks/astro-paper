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
        const hasDimensions = Boolean(
          node.properties.width && node.properties.height
        );
        const canPrioritize = isFirstImage && hasDimensions;

        node.properties.loading ??= canPrioritize ? "eager" : "lazy";
        node.properties.decoding ??= "async";
        node.properties.sizes ??= "(max-width: 768px) 100vw, 768px";

        if (canPrioritize) {
          node.properties.fetchpriority ??= "high";
        } else {
          delete node.properties.fetchpriority;
        }

        isFirstImage = false;
      }

      for (const child of node.children ?? []) {
        walk(child);
      }
    }

    walk(tree);
  };
}
