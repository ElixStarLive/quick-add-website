const { renderSiteNav } = require('./site-nav');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSectionHub(hub, categories, navActive, siteUrl) {
  const base = String(siteUrl || 'https://www.quickpostads.co.uk').replace(/\/$/, '');
  const cards = Object.entries(categories).map(([slug, cat]) => {
    const href = '/' + hub.slug + '/' + slug;
    return `<a href="${escapeHtml(href)}" class="popular-service-btn">${escapeHtml(cat.emoji)} ${escapeHtml(cat.label)}</a>`;
  }).join('\n        ');

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index,follow">
  <title>${escapeHtml(hub.title)}</title>
  <meta name="description" content="${escapeHtml(hub.description)}">
  <link rel="canonical" href="${escapeHtml(base + '/' + hub.slug)}">
  <link rel="stylesheet" href="/css/style.css?v=78">
</head>
<body>
  <script src="/js/site-config.js?v=2"></script>
  <header class="site-header">
    <div class="header-inner">
      <a href="/" class="logo-block"><span class="logo-text"><span class="logo">QuickPostAds</span></span></a>
      ${renderSiteNav(navActive)}
    </div>
  </header>
  <main class="main section-hub">
    <h1 class="page-title">${escapeHtml(hub.label)}</h1>
    <p class="page-subtitle">${escapeHtml(hub.intro)}</p>
    <div class="popular-services-grid section-hub-grid">
        ${cards}
    </div>
    <p class="text-center mt-2">
      <a href="/post-ad.html" class="btn btn-primary">Sell an item – £1</a>
      <a href="/search.html" class="btn btn-outline" style="margin-left:0.5rem;">Browse all listings</a>
    </p>
  </main>
  <footer class="site-footer">
    <div class="site-footer-links">
      <a href="/terms-of-service.html">Terms of Service</a>
      <a href="/privacy-policy.html">Privacy Policy</a>
      <a href="/content-rules.html">Content Rules</a>
      <a href="/contact.html">Contact</a>
    </div>
    <p>QuickPost Ads · Jobs, trades &amp; marketplace.</p>
  </footer>
</body>
</html>`;
}

function renderSectionCategory(hub, category, navActive, siteUrl) {
  const base = String(siteUrl || 'https://www.quickpostads.co.uk').replace(/\/$/, '');
  const path = '/' + hub.slug + '/' + category.slug;
  const title = category.label + ' | ' + hub.label + ' | QuickPost Ads';

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index,follow">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(category.description)}">
  <link rel="canonical" href="${escapeHtml(base + path)}">
  <link rel="stylesheet" href="/css/style.css?v=78">
</head>
<body>
  <script src="/js/site-config.js?v=2"></script>
  <header class="site-header">
    <div class="header-inner">
      <a href="/" class="logo-block"><span class="logo-text"><span class="logo">QuickPostAds</span></span></a>
      ${renderSiteNav(navActive)}
    </div>
  </header>
  <main class="main section-hub">
    <p class="page-subtitle" style="margin-bottom:0.5rem;"><a href="/${escapeHtml(hub.slug)}">${escapeHtml(hub.label)}</a></p>
    <h1 class="page-title">${escapeHtml(category.emoji)} ${escapeHtml(category.label)}</h1>
    <p class="page-subtitle">${escapeHtml(category.description)}</p>
    <p class="text-center mt-2">
      <a href="${escapeHtml(category.searchHref)}" class="btn btn-primary">Browse listings</a>
      <a href="/${escapeHtml(hub.slug)}" class="btn btn-outline" style="margin-left:0.5rem;">All ${escapeHtml(hub.label.toLowerCase())} categories</a>
    </p>
  </main>
  <footer class="site-footer">
    <div class="site-footer-links">
      <a href="/terms-of-service.html">Terms of Service</a>
      <a href="/privacy-policy.html">Privacy Policy</a>
      <a href="/content-rules.html">Content Rules</a>
      <a href="/contact.html">Contact</a>
    </div>
    <p>QuickPost Ads · Jobs, trades &amp; marketplace.</p>
  </footer>
</body>
</html>`;
}

module.exports = {
  renderSectionHub,
  renderSectionCategory,
  escapeHtml
};
