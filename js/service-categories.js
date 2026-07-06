/* Service icons — every tile opens Post job with that work type pre-filled (real form, not fake). */
(function () {
  var ICON = {
    car: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
    clean: 'M15.5 12h1.5l-2 4-2-4h1.5v-2h-4v2h1.5l2 4 2-4H13v-2h2.5V8h-5v2zm-7 0h2l1.5 4 1.5-4h2v6h-2v-3l-1 2.5-1-2.5v3h-2v-6z',
    wrench: 'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
    bolt: 'M7 2v11h3v9l7-12h-4l4-8z',
    build: 'M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z',
    roof: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    window: 'M4 4h16v16H4V4zm2 2v5h5V6H6zm7 0v5h5V6h-5zM6 13v5h5v-5H6zm7 0v5h5v-5h-5z',
    paint: 'M18 4V3c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V6h1v4H9v11c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-9h8V4h-4z',
    floor: 'M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z',
    door: 'M19 19V3H5v16H3v2h18v-2h-2zM10 12c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    leaf: 'M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C4 8 17 8 17 8z',
    washer: 'M18 2.01L6 2c-1.11 0-2 .89-2 2v16c0 1.11.89 2 2 2h12c1.11 0 2-.89 2-2V4c0-1.11-.89-1.99-2-1.99zM18 20H6v-9.02h12V20zm0-11H6V4h12v5zM8 6H7v1h1V6zm2 0H9v1h1V6zm4.5 10c1.93 0 3.5-1.57 3.5-3.5S16.43 9 14.5 9 11 10.57 11 12.5s1.57 3.5 3.5 3.5z',
    truck: 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
    post: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z'
  };

  var GROUPS = [
    { title: 'Car service', icon: 'car', work: 'car', items: ['Oil change','MOT test','Mobile mechanic','Brake pads replacement','Tyre replacement','Battery check & replacement','Lost car keys','Car diagnostic check','Air con regas','Full car service','Puncture repair','Mobile mechanic – same day call-out'] },
    { title: 'Cleaning services', icon: 'clean', work: 'cleaning', items: ['Domestic cleaning','Deep clean','End of tenancy clean','Carpet cleaning','Oven cleaning','Window cleaning','Pressure washing (drive/patio)','Gutter cleaning','Pest control'] },
    { title: 'Plumbing', icon: 'wrench', work: 'plumbing', items: ['Leaking tap repair','Burst pipe emergency repair','Blocked drain','Toilet repair','Boiler breakdown repair','Boiler service','Radiator installation','Shower installation','Bathroom fitter','Power flush'] },
    { title: 'Electrical', icon: 'bolt', work: 'electrical', items: ['Full house rewire','Fuse box / consumer unit upgrade','Additional socket installation','Light fitting installation','EV home charger installation','Electrical fault finding','EICR electrical test certificate','Extractor fan installation','CCTV installation','Smoke alarm installation'] },
    { title: 'Building & construction', icon: 'build', work: 'building', items: ['Extension build','Loft conversion','Bricklayer','Plastering','Groundworks','Damp proofing','Garage conversion','Steel beam installation','Insulation','Demolition','Renew kitchen','Renew bathroom','Full property renovation'] },
    { title: 'Roofing & gutters', icon: 'roof', work: 'roofing', items: ['Roof leak repair','New roof / re-tile','Flat roof repair','Gutter cleaning','Gutter repair','Chimney repair','Fascia & soffit replacement','Skylight / Velux installation','Lead flashing repair'] },
    { title: 'Windows, doors & UPVC', icon: 'window', work: 'UPVC', items: ['Quality UPVC windows','UPVC doors supply & fit','Double glazing – new windows','Misted / foggy unit replacement','Composite front door','Bi-fold doors','Patio / sliding doors','Conservatory','Sash windows','Window lock / handle repair'] },
    { title: 'Painting & decorating', icon: 'paint', work: 'painting', items: ['Interior painting','Exterior painting','Wallpapering','Plastering','Ceiling painting','Woodwork painting','Coving installation','Crack repair & filling'] },
    { title: 'Flooring & tiling', icon: 'floor', work: 'flooring', items: ['Laminate flooring fitting','Vinyl / LVT flooring','Carpet fitting','Floor tiling','Wall tiling','Floor sanding & sealing','Floor screeding','Skirting board fitting'] },
    { title: 'Carpentry & doors', icon: 'door', work: 'carpentry', items: ['Carpenter / joiner','Internal door fitting','Front door replacement','Staircase build / repair','Built-in wardrobe','Shelving installation','Loft boarding','Kitchen fitting'] },
    { title: 'Garden & outdoor', icon: 'leaf', work: 'garden', items: ['Landscaping','Gardening / lawn mowing','Hedge trimming','Tree surgeon','Fence installation','Decking installation','Patio laying','Block paving / driveway','Artificial grass fitting','Garden clearance'] },
    { title: 'Handyman', icon: 'wrench', work: 'handyman', items: ['Handyman – general jobs','Flat pack assembly','TV wall mounting','Blind fitting','Furniture repair','Picture / mirror hanging','Curtain rail fitting','General home maintenance'] },
    { title: 'Appliance repair', icon: 'washer', work: 'appliance', items: ['Washing machine repair','Dishwasher repair','Fridge / freezer repair','Cooker / oven repair','Tumble dryer repair','Hob installation','Extractor hood repair'] },
    { title: 'Removals & waste', icon: 'truck', work: 'removal', items: ['House removal','Man with van','Furniture delivery','Waste clearance','Rubbish removal','Garage clearance','Loft clearance','Office clearance'] }
  ];

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function postUrl(label) {
    if (typeof postJobUrl === 'function') return postJobUrl(label);
    return 'post-job.html?work=' + encodeURIComponent(label);
  }

  function tileText(label) {
    if (/[–—]\s*other$/i.test(label)) return 'Other';
    return String(label)
      .replace(/\s*[–—]\s*/g, ' ')
      .replace(/\.{2,}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tile(label, iconKey) {
    var href = postUrl(label);
    var text = tileText(label);
    return '<a href="' + href + '" class="job-icon-item" title="Post a job: ' + esc(label) + '">' +
      '<span class="job-icon-icon-box"><span class="card-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICON[iconKey] + '"/></svg></span></span>' +
      '<span class="job-icon-text-box"><strong>' + esc(text) + '</strong>' +
      '<small class="job-icon-hint">Post job free</small></span></a>';
  }

  function renderServiceCategories(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var html = '<p class="page-subtitle" style="margin-bottom:1.25rem;">Tap any service to <strong>post your job free</strong> — work type is pre-filled on the form. Contractors find your job on Find jobs.</p>';
    GROUPS.forEach(function (g) {
      html += '<h2 class="section-title">' + esc(g.title) + '</h2>';
      html += '<div class="job-icons-section"><div class="job-icons-grid">';
      g.items.forEach(function (label) {
        html += tile(label, g.icon);
      });
      html += tile(g.title + ' – other', g.icon);
      html += '</div></div>';
    });
    el.innerHTML = html;
  }

  window.renderServiceCategories = renderServiceCategories;
})();
