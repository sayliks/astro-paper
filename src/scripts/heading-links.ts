declare global {
  interface Window {
    __astroPaperHeadingLinksReady?: boolean;
  }
}

const HEADING_SELECTOR =
  "#article h2[id], #article h3[id], #article h4[id], #article h5[id], #article h6[id]";

function hasHeadingLink(heading: Element): boolean {
  return Array.from(heading.children).some(child =>
    child.classList.contains("heading-link")
  );
}

function addHeadingLinks(): void {
  const headings = document.querySelectorAll<HTMLElement>(HEADING_SELECTOR);

  for (const heading of headings) {
    if (hasHeadingLink(heading)) continue;

    heading.classList.add("group");

    const link = document.createElement("a");
    link.className =
      "heading-link ms-2 no-underline opacity-75 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100";
    link.href = `#${heading.id}`;

    const span = document.createElement("span");
    span.ariaHidden = "true";
    span.innerText = "#";

    link.appendChild(span);
    heading.appendChild(link);
  }
}

addHeadingLinks();

if (!window.__astroPaperHeadingLinksReady) {
  window.__astroPaperHeadingLinksReady = true;
  document.addEventListener("astro:after-swap", addHeadingLinks);
  document.addEventListener("astro:page-load", addHeadingLinks);
}

export {};
