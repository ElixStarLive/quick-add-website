const { relatedSeoLinks } = require('./seo-pages-data');
const { renderSiteNav } = require('./site-nav');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSeoLandingPage(page, siteUrl) {
  const base = String(siteUrl || 'https://www.quickpostads.co.uk').replace(/\/$/, '');
  const { entity, location, segmentSlug, locationSlug, slug, pageType } = page;
  const title = entity.label + ' in ' + location.label + ' | Free Quotes | QuickPost Ads';
  const description =
    'Post your ' + entity.label.toLowerCase() + ' job free in ' + location.label +
    '. Receive quotes from trusted local professionals. No hidden fees for homeowners.';
  const canonical = base + '/' + slug;
  const workParam = encodeURIComponent(entity.workType);
  const locationParam = encodeURIComponent(location.label);
  const related = relatedSeoLinks(segmentSlug, locationSlug, pageType);

  const relatedHtml = related.length
    ? related.map((link) => '<li><a href="' + escapeHtml(link.href) + '">' + escapeHtml(link.label) + '</a></li>').join('')
    : '';

  const pageTypeNote = pageType === 'trade'
    ? 'Find trusted ' + entity.label.toLowerCase() + ' covering ' + entity.intro + '.'
    : 'Need ' + entity.label.toLowerCase() + '? Post free and get quotes from local ' + entity.intro + ' professionals.';

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index,follow">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="stylesheet" href="/css/style.css?v=79">
</head>
<body>
  <script src="/js/site-config.js?v=2"></script>
  <header class="site-header">
    <div class="header-inner">
      <a href="/" class="logo-block"><span class="logo-text"><span class="logo">QuickPostAds</span></span></a>
      ${renderSiteNav('trades')}
    </div>
  </header>
  <main class="main seo-landing">
    <h1 class="page-title">${escapeHtml(entity.label)} in ${escapeHtml(location.label)}</h1>
    <p class="page-subtitle">${escapeHtml(pageTypeNote)} Post your job <strong>free</strong> in under 60 seconds.</p>

    <form class="hero-search-form seo-landing-form" action="/post-job.html" method="get">
      <label class="sr-only" for="seo-service">What service do you need?</label>
      <input type="text" id="seo-service" name="work" value="${escapeHtml(entity.workType)}" required autocomplete="off">
      <label class="sr-only" for="seo-location">Your location</label>
      <input type="text" id="seo-location" name="location" value="${escapeHtml(location.label)}" required autocomplete="address-level2">
      <button type="submit" class="btn btn-primary btn-block">Get Quotes</button>
    </form>

    <ul class="hero-trust-list seo-landing-trust">
      <li>✓ Free to post</li>
      <li>✓ No hidden fees</li>
      <li>✓ Local professionals in ${escapeHtml(location.label)}</li>
      <li>✓ Fast response</li>
    </ul>

    <section class="seo-landing-copy">
      <h2 class="section-title">How it works in ${escapeHtml(location.label)}</h2>
      <ol class="seo-steps">
        <li>Describe your ${escapeHtml(entity.label.toLowerCase())} job and where you are in ${escapeHtml(location.label)}.</li>
        <li>Local tradespeople browse jobs on QuickPost Ads and unlock your contact to quote you.</li>
        <li>Compare quotes and hire directly — homeowners never pay to post.</li>
      </ol>
      <p class="text-center">
        <a href="/post-job.html?work=${workParam}&amp;location=${locationParam}" class="btn btn-primary">Post your ${escapeHtml(entity.label.toLowerCase())} job free</a>
        <a href="/jobs.html" class="btn btn-outline" style="margin-left:0.5rem;">Browse live jobs</a>
      </p>
    </section>

    ${relatedHtml ? `<section class="seo-related" aria-labelledby="seo-related-title">
      <h2 class="section-title" id="seo-related-title">Related searches in ${escapeHtml(location.label)}</h2>
      <ul class="seo-related-list">${relatedHtml}</ul>
    </section>` : ''}
  </main>
  <footer class="site-footer">
    <div class="site-footer-links">
      <a href="/terms-of-service.html">Terms of Service</a>
      <a href="/privacy-policy.html">Privacy Policy</a>
      <a href="/content-rules.html">Content Rules</a>
      <a href="/contact.html">Contact</a>
    </div>
    <p>QuickPost Ads · Jobs &amp; local trades.</p>
  </footer>
</body>
</html>`;
}

function renderSeoSitemap(siteUrl, slugs) {
  const base = String(siteUrl || 'https://www.quickpostads.co.uk').replace(/\/$/, '');
  const urls = slugs.map((slug) =>
    '  <url><loc>' + escapeHtml(base + '/' + slug) + '</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>'
  ).join('\n');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>';
}

module.exports = {
  renderSeoLandingPage,
  renderSeoSitemap,
  escapeHtml
};
