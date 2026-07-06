/** Homepage main trade categories — 19 browse groups matching uk-trades-taxonomy.js */
(function () {
  var MAIN_TRADE_CATEGORIES = [
    { emoji: '🏗️', label: 'Construction & Building', work: 'General Builder' },
    { emoji: '🔧', label: 'Plumbing', work: 'Emergency Plumber' },
    { emoji: '🔥', label: 'Heating & Gas', work: 'Gas Engineer' },
    { emoji: '⚡', label: 'Electrical', work: 'Emergency Electrician' },
    { emoji: '🏠', label: 'Roofing', work: 'Roof Repairs' },
    { emoji: '🧱', label: 'Plastering', work: 'Plastering' },
    { emoji: '🎨', label: 'Painting', work: 'Interior Painting' },
    { emoji: '🪵', label: 'Carpentry', work: 'Carpenter' },
    { emoji: '🍳', label: 'Kitchens', work: 'Kitchen Installation' },
    { emoji: '🚿', label: 'Bathrooms', work: 'Bathroom Installation' },
    { emoji: '📐', label: 'Flooring', work: 'Laminate Flooring' },
    { emoji: '🪟', label: 'Windows & Doors', work: 'UPVC Windows' },
    { emoji: '🌳', label: 'Landscaping', work: 'Landscaping' },
    { emoji: '🧹', label: 'Cleaning', work: 'Domestic Cleaning' },
    { emoji: '🐛', label: 'Pest Control', work: 'Pest Control' },
    { emoji: '🔒', label: 'Security', work: 'Locksmith' },
    { emoji: '🛠️', label: 'Handyman', work: 'General Repairs' },
    { emoji: '🧰', label: 'Appliance Repair', work: 'Washing Machine Repair' },
    { emoji: '🚚', label: 'Removals', work: 'House Removals' }
  ];

  function renderMainTradeCategories(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = MAIN_TRADE_CATEGORIES.map(function (cat) {
      var href = 'post-job.html?work=' + encodeURIComponent(cat.work);
      return '<a href="' + href + '" class="popular-service-btn">' + cat.emoji + ' ' + cat.label + '</a>';
    }).join('');
  }

  window.renderMainTradeCategories = renderMainTradeCategories;
})();
