const FEEDBACK_VISIBLE_CLASS = "opacity-100";
const FEEDBACK_HIDDEN_CLASS = "opacity-0";
const FEEDBACK_TIMEOUT_MS = 1800;

const shareWindow = window as Window &
  typeof globalThis & {
    __astroPaperShareActionsReady?: boolean;
  };

async function copyText(text: string) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Continue to the textarea fallback below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.inset = "0 auto auto -9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const copied = document.execCommand("copy");

    if (!copied) {
      window.prompt("复制链接", text);
    }

    return copied;
  } catch {
    window.prompt("复制链接", text);
    return false;
  } finally {
    textarea.remove();
  }
}

function showFeedback(root: HTMLElement, message: string) {
  const feedback = root.querySelector<HTMLElement>("[data-share-feedback]");
  if (!feedback) return;

  feedback.textContent = message;
  feedback.classList.remove(FEEDBACK_HIDDEN_CLASS);
  feedback.classList.add(FEEDBACK_VISIBLE_CLASS);

  window.setTimeout(() => {
    feedback.classList.remove(FEEDBACK_VISIBLE_CLASS);
    feedback.classList.add(FEEDBACK_HIDDEN_CLASS);
  }, FEEDBACK_TIMEOUT_MS);
}

function setWechatPopover(root: HTMLElement, open: boolean) {
  const popover = root.querySelector<HTMLElement>("[data-wechat-popover]");
  const button = root.querySelector<HTMLButtonElement>(
    '[data-share-action="wechat"]'
  );

  if (!popover || !button) return;

  popover.classList.toggle("hidden", !open);
  button.setAttribute("aria-expanded", String(open));
}

function closeAllWechatPopovers(exceptRoot?: HTMLElement) {
  document.querySelectorAll<HTMLElement>("[data-share-root]").forEach(root => {
    if (root !== exceptRoot) {
      setWechatPopover(root, false);
    }
  });
}

function getShareUrl(root: HTMLElement) {
  return root.dataset.shareUrl || window.location.href;
}

function initShareActions() {
  document.querySelectorAll<HTMLElement>("[data-share-root]").forEach(root => {
    if (root.dataset.shareReady === "true") return;

    root.dataset.shareReady = "true";

    root
      .querySelectorAll<HTMLButtonElement>("[data-share-action]")
      .forEach(button => {
        button.addEventListener("click", async () => {
          const action = button.dataset.shareAction;
          const copied = await copyText(getShareUrl(root));

          if (action === "wechat") {
            closeAllWechatPopovers(root);
            setWechatPopover(root, true);
            showFeedback(root, copied ? "已复制" : "请手动复制");
            return;
          }

          if (action === "copy") {
            setWechatPopover(root, false);
            showFeedback(root, copied ? "已复制" : "请手动复制");
          }
        });
      });

    root.querySelector("[data-wechat-close]")?.addEventListener("click", () => {
      setWechatPopover(root, false);
    });
  });
}

if (!shareWindow.__astroPaperShareActionsReady) {
  shareWindow.__astroPaperShareActionsReady = true;
  document.addEventListener("astro:page-load", initShareActions);
  document.addEventListener("click", event => {
    const target = event.target;

    if (!(target instanceof Element)) return;

    document.querySelectorAll<HTMLElement>("[data-share-root]").forEach(root => {
      if (!root.contains(target)) {
        setWechatPopover(root, false);
      }
    });
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeAllWechatPopovers();
    }
  });
}

initShareActions();
