/** Homepage — Popular Construction Trades grid (mockup) */
(function () {
  var POPULAR_TRADES = [
    { label: 'Builders', icon: 'building', work: 'General Builder' },
    { label: 'Plumbers', icon: 'tap', work: 'Emergency Plumber' },
    { label: 'Electricians', icon: 'electrical', work: 'Emergency Electrician' },
    { label: 'Roofers', icon: 'roof', work: 'Roof Repairs' },
    { label: 'Carpenters', icon: 'carpenter', work: 'Carpenter' },
    { label: 'Kitchen Fitters', icon: 'kitchen', work: 'Kitchen Installation' },
    { label: 'Bathroom Fitters', icon: 'bathroom', work: 'Bathroom Installation' },
    { label: 'Plasterers', icon: 'plaster', work: 'Plastering' },
    { label: 'Painters', icon: 'paint', work: 'Interior Painting' },
    { label: 'Flooring', icon: 'floor', work: 'Laminate Flooring' },
    { label: 'Tilers', icon: 'tile', work: 'Floor Tiling' },
    { label: 'Landscaping', icon: 'garden', work: 'Landscaping' },
    { label: 'Heating Engineers', icon: 'boiler', work: 'Gas Engineer' },
    { label: 'Windows & Doors', icon: 'upvc', work: 'UPVC Windows' },
    { label: 'Locksmiths', icon: 'door', work: 'Locksmith' },
    { label: 'Handyman', icon: 'handyman', work: 'General Repairs' }
  ];

  function renderHomePopularTrades(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = POPULAR_TRADES.map(function (cat) {
      var href = 'post-job.html?work=' + encodeURIComponent(cat.work);
      var iconHtml = typeof qpIconBox === 'function' ? qpIconBox(cat.icon) : '';
      return (
        '<a href="' + href + '" class="home-trade-tile" title="Post a ' + cat.label + ' job free">' +
          iconHtml +
          '<strong>' + cat.label + '</strong>' +
        '</a>'
      );
    }).join('');
  }

  window.renderHomePopularTrades = renderHomePopularTrades;
})();
