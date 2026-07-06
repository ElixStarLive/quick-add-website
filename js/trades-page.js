/** All Construction Trades page — category cards from JOB_CATEGORIES */
(function () {
  var TRADE_ICON_KEYS = {
    'Construction & building': 'building',
    'Plumbing': 'tap',
    'Heating & gas': 'boiler',
    'Electrical': 'electrical',
    'Roofing': 'roof',
    'Plastering & rendering': 'plaster',
    'Painting & decorating': 'paint',
    'Carpentry & joinery': 'carpenter',
    'Kitchens': 'kitchen',
    'Bathrooms': 'bathroom',
    'Flooring': 'floor',
    'Windows & doors': 'upvc',
    'Landscaping': 'garden',
    'Cleaning': 'cleaning',
    'Pest control': 'pest',
    'Security': 'cctv',
    'Handyman': 'handyman',
    'Appliance repairs': 'washer',
    'Removals & clearance': 'removal'
  };

  var TRADE_DISPLAY_NAMES = {
    'Construction & building': 'Building & Construction',
    'Heating & gas': 'Heating & Gas',
    'Plastering & rendering': 'Plastering & Rendering',
    'Painting & decorating': 'Painting & Decorating',
    'Carpentry & joinery': 'Carpentry & Joinery',
    'Windows & doors': 'Windows & Doors',
    'Removals & clearance': 'Demolition & Waste'
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderTradeCategoryCards(containerId) {
    var el = document.getElementById(containerId);
    if (!el || typeof JOB_CATEGORIES === 'undefined') return;

    el.innerHTML = Object.entries(JOB_CATEGORIES).map(function (entry) {
      var group = entry[0];
      var items = entry[1];
      var iconKey = TRADE_ICON_KEYS[group] || 'services';
      var title = TRADE_DISPLAY_NAMES[group] || group;
      var work = items[0];
      var preview = items.slice(0, 5);
      var iconHtml = typeof qpIconBox === 'function' ? qpIconBox(iconKey) : '';
      var bullets = preview.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
      var more = items.length > 5 ? '<li class="trade-card-more">+ ' + (items.length - 5) + ' more</li>' : '';
      var href = 'post-job.html?work=' + encodeURIComponent(work);

      return '<a href="' + href + '" class="trade-card">' +
        '<div class="trade-card-icon">' + iconHtml + '</div>' +
        '<h3>' + esc(title) + '</h3>' +
        '<ul class="trade-card-services">' + bullets + more + '</ul>' +
        '<span class="trade-card-cta">Post a job →</span>' +
        '</a>';
    }).join('');
  }

  window.renderTradeCategoryCards = renderTradeCategoryCards;
})();
