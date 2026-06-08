(function registerCmsPreviewStyle() {
  const stylePath = "/cms/article-preview.css";
  const maxAttempts = 20;
  let attempts = 0;
  let registered = false;

  function register() {
    if (registered) return true;
    if (!window.CMS?.registerPreviewStyle) return false;

    window.CMS.registerPreviewStyle(stylePath);
    registered = true;
    return true;
  }

  function retry() {
    if (register() || attempts >= maxAttempts) return;

    attempts += 1;
    window.setTimeout(retry, 100);
  }

  retry();
  window.addEventListener("DOMContentLoaded", retry, { once: true });
  window.addEventListener("load", retry, { once: true });
})();
