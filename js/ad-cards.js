(function () {
  var BASKET_ICON = '<span class="card-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.6-1.4 2.5c-.2.3-.3.7-.3 1.1 0 1.1.9 2 2 2h12v-2H7.4c-.1 0-.2-.1-.2-.2l.9-1.7h7.4c.8 0 1.4-.3 1.9-.8.5-.5.8-1.2.8-1.9l-1.2-6.2c-.1-.4-.3-.7-.6-1L17 3H6.2L5.2 0H1v2zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg></span>';

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderAdCard(ad, opts) {
    opts = opts || {};
    var title = escapeHtml(ad.title);
    var meta = [ad.price, ad.location].filter(Boolean).map(escapeHtml).join(' · ');
    var tag = opts.link ? 'a' : 'div';
    var href = opts.link ? ' href="' + escapeHtml(opts.link) + '"' : '';
    var html = '<' + tag + href + ' class="job-icon-item ad-shop-item">' + BASKET_ICON + '<strong>' + title + '</strong>';
    if (meta) html += '<small>' + meta + '</small>';
    html += '</' + tag + '>';
    return html;
  }

  function bindAdCardPhotos() {}

  window.renderAdCard = renderAdCard;
  window.bindAdCardPhotos = bindAdCardPhotos;
})();
