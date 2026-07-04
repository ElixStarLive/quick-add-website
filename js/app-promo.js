/** Elix Star Live app promo — injected on all pages that load site-config + this script */
(function () {
  const app = typeof ELIX_STAR_APP !== 'undefined' ? ELIX_STAR_APP : {
    name: 'Elix Star Live',
    url: 'https://www.elixstarlive.co.uk',
    tagline: 'TikTok-style video app — watch, create & go live'
  };

  function injectTopBarLink() {
    const bar = document.querySelector('.top-bar-contact');
    if (!bar || bar.querySelector('.app-top-link')) return;
    const link = document.createElement('a');
    link.className = 'app-top-link';
    link.href = app.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.innerHTML =
      '<svg class="icon-inline" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg> ' +
      app.name;
    bar.appendChild(link);
  }

  function injectFooterPromo() {
    const footer = document.querySelector('.site-footer');
    if (!footer || footer.querySelector('.app-footer-promo')) return;
    const block = document.createElement('div');
    block.className = 'app-footer-promo';
    block.innerHTML =
      '<p><strong>Also from us:</strong> <a href="' + app.url + '" target="_blank" rel="noopener noreferrer">' +
      app.name + '</a> — ' + app.tagline + '</p>';
    footer.insertBefore(block, footer.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectTopBarLink();
      injectFooterPromo();
    });
  } else {
    injectTopBarLink();
    injectFooterPromo();
  }
})();
