(function registerCmsPreviewStyle() {
  const stylePath = "/cms/article-preview.css";

  function register() {
    if (!window.CMS?.registerPreviewStyle) return false;

    window.CMS.registerPreviewStyle(stylePath);
    return true;
  }

  if (register()) return;

  window.addEventListener("load", register, { once: true });
})();
