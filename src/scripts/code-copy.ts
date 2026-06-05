declare global {
  interface Window {
    __astroPaperCodeCopyReady?: boolean;
  }
}

const COPY_LABEL = "复制";
const COPIED_LABEL = "已复制";
const COPY_FAILED_LABEL = "复制失败";

async function copyCode(
  block: HTMLElement,
  button: HTMLButtonElement
): Promise<void> {
  const text = block.querySelector("code")?.innerText ?? "";

  try {
    await navigator.clipboard.writeText(text);
    button.innerText = COPIED_LABEL;
  } catch {
    button.innerText = COPY_FAILED_LABEL;
  }

  setTimeout(() => {
    button.innerText = COPY_LABEL;
  }, 700);
}

function attachCopyButtons(): void {
  const codeBlocks = document.querySelectorAll<HTMLElement>("#article pre");

  for (const codeBlock of codeBlocks) {
    if (codeBlock.closest(".code-wrapper")) continue;

    const parent = codeBlock.parentNode;
    if (!parent) continue;

    const wrapper = document.createElement("div");
    wrapper.className = "code-wrapper relative";

    const computedStyle = getComputedStyle(codeBlock);
    const hasFileNameOffset =
      computedStyle.getPropertyValue("--file-name-offset").trim() !== "";
    const topClass = hasFileNameOffset
      ? "top-(--file-name-offset)"
      : "-top-3";

    const copyButton = document.createElement("button");
    copyButton.className = `copy-code absolute end-3 ${topClass} rounded border border-muted bg-muted px-2 py-1 text-xs leading-4 font-medium text-foreground`;
    copyButton.type = "button";
    copyButton.innerText = COPY_LABEL;
    copyButton.setAttribute("aria-label", "复制代码");

    codeBlock.setAttribute("tabindex", "0");
    parent.insertBefore(wrapper, codeBlock);
    wrapper.appendChild(codeBlock);
    wrapper.appendChild(copyButton);

    copyButton.addEventListener("click", () => {
      void copyCode(codeBlock, copyButton);
    });
  }
}

attachCopyButtons();

if (!window.__astroPaperCodeCopyReady) {
  window.__astroPaperCodeCopyReady = true;
  document.addEventListener("astro:after-swap", attachCopyButtons);
  document.addEventListener("astro:page-load", attachCopyButtons);
}

export {};
