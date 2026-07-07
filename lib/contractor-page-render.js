const { renderSiteNav } = require('./site-nav');

const CSS_VERSION = 'v=110';

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function contractorDisplayName(c) {
  return (c.company_name && c.company_name.trim()) || (c.name && c.name.trim()) || 'Contractor';
}

function isProContractor(c) {
  if (!c || c.subscription_status !== 'active') return false;
  if (!c.subscription_expires_at) return true;
  return new Date(c.subscription_expires_at).getTime() > Date.now();
}

function memberSinceYear(c) {
  if (!c.created_at) return '';
  const y = new Date(c.created_at).getFullYear();
  return Number.isFinite(y) ? String(y) : '';
}

function truncate(text, max) {
  const t = String(text || '').trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + '…';
}

function pageShell({ title, description, canonical, structuredData, bodyMain, navActive }) {
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index,follow">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <link rel="stylesheet" href="/css/style.css?${CSS_VERSION}">
  <script type="application/ld+json">${structuredData}</script>
</head>
<body>
  <script src="/js/site-config.js?v=2"></script>
  <header class="site-header">
    <div class="header-inner">
      <a href="/" class="logo-block"><span class="logo-text"><span class="logo">QuickPostAds</span></span></a>
      ${renderSiteNav(navActive)}
    </div>
  </header>
${bodyMain}
  <footer class="site-footer">
    <div class="site-footer-links">
      <a href="/contractors">Find a Contractor</a>
      <a href="/for-contractors.html">For Contractors</a>
      <a href="/terms-of-service.html">Terms of Service</a>
      <a href="/privacy-policy.html">Privacy Policy</a>
      <a href="/contact.html">Contact</a>
    </div>
    <p>QuickPost Ads · Jobs &amp; local trades.</p>
  </footer>
</body>
</html>`;
}

function renderContractorDirectory(contractors, siteUrl) {
  const base = String(siteUrl || 'https://www.quickpostads.co.uk').replace(/\/$/, '');
  const canonical = base + '/contractors';
  const title = 'Find a Contractor | Trusted Local Tradespeople | QuickPost Ads';
  const description =
    'Browse trusted contractors and tradespeople on QuickPostAds. View trade, location and profile, then post your job free to get quotes.';

  const list = Array.isArray(contractors) ? contractors : [];

  const cardsHtml = list.length
    ? list.map((c) => {
        const name = contractorDisplayName(c);
        const url = '/contractor/' + escapeHtml(c.profile_slug);
        const meta = [c.trade, c.city].filter(Boolean).map(escapeHtml).join(' · ');
        const pro = isProContractor(c)
          ? '<span class="contractor-badge" title="Active Pro member">Pro member</span>'
          : '';
        const bio = c.bio ? '<p class="contractor-card-bio">' + escapeHtml(truncate(c.bio, 140)) + '</p>' : '';
        return `<li class="contractor-card">
          <div class="contractor-card-head">
            <a class="contractor-card-name" href="${url}">${escapeHtml(name)}</a>
            ${pro}
          </div>
          ${meta ? '<p class="contractor-card-meta">' + meta + '</p>' : ''}
          ${bio}
          <a class="btn btn-outline btn-sm" href="${url}">View profile</a>
        </li>`;
      }).join('')
    : '<li class="contractor-empty"><p>No public contractor profiles yet. Are you a tradesperson? <a href="/contractor-register.html">Register free</a> and publish your profile.</p></li>';

  const itemList = {
    '@type': 'ItemList',
    itemListElement: list.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: base + '/contractor/' + c.profile_slug,
      name: contractorDisplayName(c)
    }))
  };
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base + '/' },
      { '@type': 'ListItem', position: 2, name: 'Find a Contractor', item: canonical }
    ]
  };
  const structuredData = JSON.stringify({ '@context': 'https://schema.org', '@graph': [itemList, breadcrumb] })
    .replace(/</g, '\\u003c');

  const bodyMain = `  <main class="main">
    <h1 class="page-title">Find a Contractor</h1>
    <p class="page-subtitle">Browse trusted tradespeople on QuickPostAds. Post your job <strong>free</strong> to get quotes from local professionals.</p>
    <p class="text-center" style="margin-bottom:1.5rem;">
      <a href="/post-job.html" class="btn btn-primary">Post a job free</a>
      <a href="/contractor-register.html" class="btn btn-outline" style="margin-left:0.5rem;">List your business</a>
    </p>
    <ul class="contractor-directory">${cardsHtml}</ul>
  </main>`;

  return pageShell({ title, description, canonical, structuredData, bodyMain, navActive: 'contractors' });
}

function renderContractorProfile(contractor, siteUrl) {
  const base = String(siteUrl || 'https://www.quickpostads.co.uk').replace(/\/$/, '');
  const c = contractor;
  const name = contractorDisplayName(c);
  const canonical = base + '/contractor/' + escapeHtml(c.profile_slug);
  const tradeLabel = c.trade ? String(c.trade).trim() : '';
  const cityLabel = c.city ? String(c.city).trim() : '';
  const pro = isProContractor(c);
  const since = memberSinceYear(c);

  const titleParts = [name];
  if (tradeLabel) titleParts.push(tradeLabel);
  if (cityLabel) titleParts.push(cityLabel);
  const title = titleParts.join(' · ') + ' | QuickPost Ads';
  const description = truncate(
    c.bio ||
      (name + (tradeLabel ? ' — ' + tradeLabel : '') + (cityLabel ? ' in ' + cityLabel : '') +
        '. View this contractor on QuickPostAds and post your job free to get a quote.'),
    160
  );

  let website = c.website ? String(c.website).trim() : '';
  if (website && !/^https?:\/\//i.test(website)) website = 'https://' + website;
  let websiteLabel = website.replace(/^https?:\/\//i, '').replace(/\/$/, '');

  const badges = [];
  if (pro) badges.push('<span class="contractor-badge">Pro member</span>');
  if (tradeLabel) badges.push('<span class="contractor-tag">' + escapeHtml(tradeLabel) + '</span>');
  if (cityLabel) badges.push('<span class="contractor-tag">' + escapeHtml(cityLabel) + '</span>');

  const detailRows = [];
  if (tradeLabel) detailRows.push('<div><dt>Trade</dt><dd>' + escapeHtml(tradeLabel) + '</dd></div>');
  if (cityLabel) detailRows.push('<div><dt>Area covered</dt><dd>' + escapeHtml(cityLabel) + '</dd></div>');
  if (since) detailRows.push('<div><dt>On QuickPostAds since</dt><dd>' + escapeHtml(since) + '</dd></div>');
  if (website) {
    detailRows.push('<div><dt>Website</dt><dd><a href="' + escapeHtml(website) +
      '" rel="nofollow noopener" target="_blank">' + escapeHtml(websiteLabel) + '</a></dd></div>');
  }

  const bioHtml = c.bio
    ? '<section class="contractor-section"><h2 class="section-title">About ' + escapeHtml(name) + '</h2><p class="contractor-bio">' +
      escapeHtml(c.bio).replace(/\n+/g, '</p><p class="contractor-bio">') + '</p></section>'
    : '';

  const localBusiness = {
    '@type': 'LocalBusiness',
    name: name,
    url: canonical,
    description: c.bio || description
  };
  if (tradeLabel) localBusiness.knowsAbout = tradeLabel;
  if (cityLabel) localBusiness.areaServed = { '@type': 'City', name: cityLabel };
  if (website) localBusiness.sameAs = [website];

  const graph = [
    { '@type': 'ProfilePage', mainEntity: localBusiness },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: base + '/' },
        { '@type': 'ListItem', position: 2, name: 'Find a Contractor', item: base + '/contractors' },
        { '@type': 'ListItem', position: 3, name: name, item: canonical }
      ]
    }
  ];
  const structuredData = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');

  const bodyMain = `  <main class="main contractor-profile">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a> › <a href="/contractors">Find a Contractor</a> › <span>${escapeHtml(name)}</span>
    </nav>
    <header class="contractor-profile-hero">
      <div class="contractor-avatar" aria-hidden="true">${escapeHtml(name.charAt(0).toUpperCase())}</div>
      <div class="contractor-hero-body">
        <h1 class="page-title" style="margin:0;">${escapeHtml(name)}</h1>
        ${badges.length ? '<div class="contractor-badges">' + badges.join('') + '</div>' : ''}
      </div>
    </header>

    ${detailRows.length ? '<section class="contractor-section"><dl class="contractor-details">' + detailRows.join('') + '</dl></section>' : ''}

    ${bioHtml}

    <section class="contractor-cta">
      <h2 class="section-title">Want a quote from ${escapeHtml(name)}?</h2>
      <p>Post your job free on QuickPostAds. Local tradespeople — including ${escapeHtml(name)} — can see your job and send you a quote. Homeowners never pay to post.</p>
      <p>
        <a href="/post-job.html" class="btn btn-primary">Post your job free</a>
        <a href="/contractors" class="btn btn-outline" style="margin-left:0.5rem;">Browse more contractors</a>
      </p>
    </section>
  </main>`;

  return pageShell({ title, description, canonical, structuredData, bodyMain, navActive: 'contractors' });
}

module.exports = {
  renderContractorDirectory,
  renderContractorProfile,
  escapeHtml
};
