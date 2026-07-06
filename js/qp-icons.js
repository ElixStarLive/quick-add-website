/* QuickPostAds icons – Lucide pro line art + gold gradient (see qp-icons-data.js) */
(function () {
  var LABEL_RULES = [
    [/oil change|oil filter|oil service|interim/i, 'oil'],
    [/mot\b|mot test|mot fail/i, 'mot'],
    [/mobile mechanic|mechanic/i, 'mechanic'],
    [/brake pad|brake disc|brake fluid/i, 'brake'],
    [/tyre|tire|puncture|wheel align|tracking/i, 'tyre'],
    [/battery/i, 'battery'],
    [/diagnostic|won't start|won t start/i, 'diagnostic'],
    [/lost car key|car key/i, 'keys'],
    [/air con|regas/i, 'aircon'],
    [/full car service|car service/i, 'car'],
    [/spark plug|clutch|exhaust|timing belt|cambelt|alternator|starter motor/i, 'mechanic'],
    [/domestic cleaning/i, 'cleaning'],
    [/deep clean/i, 'deep-clean'],
    [/end of tenancy/i, 'cleaning'],
    [/carpet clean/i, 'carpet'],
    [/oven clean/i, 'oven'],
    [/window clean/i, 'window-clean'],
    [/pressure wash/i, 'pressure-wash'],
    [/gutter clean/i, 'gutter'],
    [/pest control/i, 'pest'],
    [/leak.*tap|tap replacement|leaking tap/i, 'tap'],
    [/burst pipe|pipe/i, 'pipe'],
    [/blocked drain|blocked sink/i, 'drain'],
    [/toilet/i, 'toilet'],
    [/boiler/i, 'boiler'],
    [/radiator/i, 'radiator'],
    [/shower install/i, 'shower'],
    [/bathroom fit|renew bathroom|wet room|full bathroom/i, 'bathroom'],
    [/kitchen fit|renew kitchen|full kitchen|worktop/i, 'kitchen'],
    [/rewire|eicr|consumer unit|fuse box/i, 'rewire'],
    [/socket/i, 'socket'],
    [/light fitting|downlight|spotlight/i, 'light'],
    [/ev home charger|ev charger/i, 'ev-charger'],
    [/cctv/i, 'cctv'],
    [/smoke alarm/i, 'smoke'],
    [/electrical fault|electrical/i, 'electrical'],
    [/extension build|extension/i, 'extension'],
    [/loft conversion|loft board/i, 'loft'],
    [/bricklayer|brick/i, 'brick'],
    [/plaster/i, 'plaster'],
    [/damp proof/i, 'damp'],
    [/garage conversion/i, 'garage'],
    [/steel beam/i, 'steel'],
    [/insulation/i, 'insulation'],
    [/demolition/i, 'demolition'],
    [/renovation|refurbishment/i, 'renovation'],
    [/general builder|building/i, 'building'],
    [/roof leak|re-tile|new roof/i, 'roof'],
    [/flat roof/i, 'flat-roof'],
    [/chimney/i, 'chimney'],
    [/fascia|soffit/i, 'fascia'],
    [/upvc|double glazing|misted|foggy unit|composite front|bi-fold|patio.*door|sash window/i, 'upvc'],
    [/conservatory/i, 'conservatory'],
    [/interior painting|exterior painting|woodwork painting/i, 'paint'],
    [/wallpaper/i, 'wallpaper'],
    [/ceiling painting/i, 'ceiling'],
    [/laminate flooring|vinyl|lvt flooring/i, 'floor'],
    [/floor tiling|wall tiling|tiling/i, 'tile'],
    [/carpet fitting|carpet fit/i, 'carpet-fit'],
    [/skirting/i, 'skirting'],
    [/internal door|front door|door replacement/i, 'door'],
    [/wardrobe/i, 'wardrobe'],
    [/shelving/i, 'shelving'],
    [/staircase|stairs/i, 'stairs'],
    [/carpenter|joiner/i, 'carpenter'],
    [/landscap/i, 'garden'],
    [/lawn|mowing/i, 'lawn'],
    [/hedge trim/i, 'hedge'],
    [/tree surgeon/i, 'tree'],
    [/fence/i, 'fence'],
    [/decking/i, 'deck'],
    [/patio laying|block paving|driveway/i, 'paving'],
    [/artificial grass/i, 'lawn'],
    [/garden clearance/i, 'clearance'],
    [/handyman|home maintenance/i, 'handyman'],
    [/flat pack/i, 'flatpack'],
    [/tv wall|wall mount/i, 'tv'],
    [/blind fit/i, 'blinds'],
    [/furniture repair/i, 'furniture'],
    [/mirror|picture.*hang/i, 'mirror'],
    [/curtain/i, 'curtain'],
    [/washing machine/i, 'washer'],
    [/dishwasher/i, 'dishwasher'],
    [/fridge|freezer/i, 'fridge'],
    [/cooker|oven repair/i, 'cooker'],
    [/tumble dryer|dryer repair/i, 'dryer'],
    [/hob install/i, 'hob'],
    [/extractor hood|hood repair/i, 'hood'],
    [/house removal/i, 'removal'],
    [/man with van|furniture delivery/i, 'van'],
    [/waste clearance|rubbish removal/i, 'waste'],
    [/garage clearance|loft clearance|office clearance/i, 'clearance'],
    [/plumb/i, 'tap'],
    [/clean/i, 'cleaning'],
    [/car\b|vehicle/i, 'car'],
    [/other$/i, 'other']
  ];

  var SHOP_CATEGORIES = [
    { key: 'furniture', label: 'Furniture', labelFull: 'Furniture', icon: 'furniture', href: 'search.html?category=furniture' },
    { key: 'electronics', label: 'Electronics', labelFull: 'Electronics', icon: 'monitor', href: 'search.html?category=electronics' },
    { key: 'phones', label: 'Phones', labelFull: 'Phones & tablets', icon: 'phone', href: 'search.html?category=phones' },
    { key: 'appliances', label: 'Appliances', labelFull: 'Appliances', icon: 'washer', href: 'search.html?category=appliances' },
    { key: 'tools', label: 'Tools', labelFull: 'Tools & DIY', icon: 'tools', href: 'search.html?category=tools' },
    { key: 'garden', label: 'Home & garden', labelFull: 'Home & garden', icon: 'garden', href: 'search.html?category=garden' },
    { key: 'baby', label: 'Baby & kids', labelFull: 'Baby & kids', icon: 'baby', href: 'search.html?category=baby' },
    { key: 'clothing', label: 'Clothing', labelFull: 'Clothing & shoes', icon: 'shirt', href: 'search.html?category=clothing' },
    { key: 'sports', label: 'Sports', labelFull: 'Sports & leisure', icon: 'sports', href: 'search.html?category=sports' },
    { key: 'other', label: 'Other', labelFull: 'Other items', icon: 'grid', href: 'search.html?category=other' },
    { key: 'sell', label: 'Sell – £1', labelFull: 'Sell your item – £1', icon: 'sell', href: 'post-ad.html' }
  ];

  var HOME_CATEGORIES = [
    { label: 'All jobs', icon: 'jobs', href: 'post-job.html', hint: 'Post your job free' },
    { label: 'Local services', icon: 'services', href: 'post-job.html?work=plumber', hint: 'Post your job free' },
    { label: 'Car service', icon: 'car', href: 'post-job.html?work=car', hint: 'Post your job free' },
    { label: 'Cleaning services', icon: 'cleaning', href: 'post-job.html?work=cleaning', hint: 'Post your job free' },
    { label: 'On sale live', icon: 'shop', href: 'search.html', hint: '£1 per item to post' },
    { label: 'Other', icon: 'other', href: 'post-job.html?work=handyman', hint: 'Post your job free' }
  ];

  var GROUP_ICON_MAP = {
    car: 'car', clean: 'cleaning', wrench: 'tap', bolt: 'electrical',
    build: 'building', roof: 'roof', window: 'upvc', paint: 'paint',
    floor: 'floor', door: 'door', leaf: 'garden', washer: 'washer',
    truck: 'removal', post: 'post'
  };

  function iconInner(key) {
    var bank = window.QP_ICON_INNER || {};
    return bank[key] || bank.default || '';
  }

  function iconForLabel(label, fallback) {
    var text = String(label || '').toLowerCase();
    for (var i = 0; i < LABEL_RULES.length; i++) {
      if (LABEL_RULES[i][0].test(text)) return LABEL_RULES[i][1];
    }
    if (fallback && GROUP_ICON_MAP[fallback]) return GROUP_ICON_MAP[fallback];
    if (fallback && iconInner(fallback)) return fallback;
    return 'default';
  }

  function iconForShopCategory(cat) {
    var map = {
      cars: 'car', furniture: 'furniture', electronics: 'monitor', phones: 'phone',
      appliances: 'washer', tools: 'tools', garden: 'garden', baby: 'baby',
      clothing: 'shirt', sports: 'sports', other: 'grid'
    };
    return map[String(cat || '').toLowerCase()] || 'shop';
  }

  function qpIconHtml(key) {
    var inner = iconInner(key);
    var gid = 'qpG' + String(key).replace(/\W/g, '');
    var grad =
      '<defs><linearGradient id="' + gid + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" stop-color="#f5e6a8"/>' +
      '<stop offset="45%" stop-color="#d4af37"/>' +
      '<stop offset="100%" stop-color="#8c6a00"/>' +
      '</linearGradient></defs>';
    return '<svg class="qp-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="url(#' + gid + ')" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">' +
      grad + inner + '</svg>';
  }

  function qpIconBox(key) {
    return '<span class="card-icon">' + qpIconHtml(key) + '</span>';
  }

  function renderShopCategoryGrid(container, opts) {
    opts = opts || {};
    var el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;
    el.innerHTML = SHOP_CATEGORIES.map(function (c) {
      var text = opts.fullLabels && c.labelFull ? c.labelFull : c.label;
      return '<a href="' + c.href + '" class="job-icon-item" title="' + text + '">' +
        qpIconBox(c.icon) + '<strong>' + text + '</strong></a>';
    }).join('');
  }

  function renderHomeCategoryGrid(container) {
    var el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;
    el.innerHTML = HOME_CATEGORIES.map(function (c) {
      return '<a href="' + c.href + '" class="category-card" title="' + c.label + '">' +
        qpIconBox(c.icon) + '<strong>' + c.label + '</strong><small>' + c.hint + '</small></a>';
    }).join('');
  }

  window.qpIconHtml = qpIconHtml;
  window.qpIconBox = qpIconBox;
  window.qpIconForLabel = iconForLabel;
  window.qpIconForShopCategory = iconForShopCategory;
  window.qpRenderShopCategoryGrid = renderShopCategoryGrid;
  window.qpRenderHomeCategoryGrid = renderHomeCategoryGrid;
})();
