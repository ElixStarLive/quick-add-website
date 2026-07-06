(function () {
  var BASKET_ICON = '';

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
    var iconKey = typeof qpIconForShopCategory === 'function' ? qpIconForShopCategory(ad.category) : 'shop';
    var icon = typeof qpIconBox === 'function' ? qpIconBox(iconKey) : '';
    var html = '<' + tag + href + ' class="job-icon-item ad-shop-item">' + icon + '<strong>' + title + '</strong>';
    if (meta) html += '<small>' + meta + '</small>';
    html += '</' + tag + '>';
    return html;
  }

  function bindAdCardPhotos() {}

  window.renderAdCard = renderAdCard;
  window.bindAdCardPhotos = bindAdCardPhotos;
})();
