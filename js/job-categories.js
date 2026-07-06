/** Job category logic — data in job-categories-data.js (auto-generated from lib/uk-trades-taxonomy.js) */

/** Map homepage / icon labels to the best real job category option */
function findBestJobMatch(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return '';

  const aliases = {
    plumber: 'Emergency Plumber',
    plumbers: 'Emergency Plumber',
    electrician: 'Emergency Electrician',
    electricians: 'Emergency Electrician',
    roofer: 'Roof Repairs',
    roofers: 'Roof Repairs',
    builder: 'General Builder',
    builders: 'General Builder',
    'gas engineer': 'Gas Engineer',
    'gas-engineer': 'Gas Engineer',
    'boiler repair': 'Boiler Repairs',
    'boiler-repair': 'Boiler Repairs',
    'boiler repairs': 'Boiler Repairs',
    'emergency plumber': 'Emergency Plumber',
    'emergency-plumber': 'Emergency Plumber',
    'house extension': 'House Extension',
    'house-extension': 'House Extension',
    'loft conversion': 'Loft Conversion',
    'loft-conversion': 'Loft Conversion',
    cleaning: 'Domestic Cleaning',
    cleaner: 'Domestic Cleaning',
    cleaners: 'Domestic Cleaning',
    plumbing: 'Emergency Plumber',
    electrical: 'Emergency Electrician',
    building: 'General Builder',
    construction: 'General Builder',
    roofing: 'Roof Repairs',
    painting: 'Interior Painting',
    painter: 'Interior Painting',
    carpentry: 'Carpenter',
    carpenter: 'Carpenter',
    joiner: 'Joiner',
    garden: 'Landscaping',
    gardening: 'Garden Design',
    landscaper: 'Landscaping',
    landscaping: 'Landscaping',
    handyman: 'General Repairs',
    handymen: 'General Repairs',
    locksmith: 'Locksmith',
    tiler: 'Floor Tiling',
    plasterer: 'Plastering',
    plastering: 'Plastering',
    removal: 'House Removals',
    removals: 'House Removals',
    'man with van': 'Man with Van',
    appliance: 'Washing Machine Repair',
    services: 'General Repairs',
    domestic: 'Domestic Cleaning',
    'deep clean': 'Deep Cleaning',
    'deep cleaning': 'Deep Cleaning',
    'end of tenancy': 'End of Tenancy Cleaning',
    'kitchen fitter': 'Kitchen Installation',
    'kitchen fitting': 'Kitchen Fitting',
    'bathroom fitter': 'Bathroom Installation',
    'bathroom fitting': 'Bathroom Installation',
    rewire: 'Full Rewire',
    'consumer unit': 'Consumer Unit',
    'fuse board': 'Fuse Board Upgrade',
    extension: 'House Extension',
    landscaping: 'Landscaping',
    fencing: 'Fencing',
    'flat pack': 'Flat Pack Assembly',
    'washing machine': 'Washing Machine Repair',
    dishwasher: 'Dishwasher Repair',
    'pest control': 'Pest Control',
    security: 'Locksmith',
    flooring: 'Laminate Flooring',
    windows: 'UPVC Windows',
    doors: 'Composite Doors',
    heating: 'Central Heating',
    boiler: 'Boiler Repairs',
    skip: 'Skip Hire',
    clearance: 'House Clearance'
  };

  if (aliases[q]) return aliases[q];

  let best = '';
  let bestScore = 0;
  const all = Object.entries(JOB_CATEGORIES).flatMap(([group, items]) =>
    items.map((label) => ({ label, group }))
  );

  all.forEach(({ label, group }) => {
    const l = label.toLowerCase();
    const g = group.toLowerCase();
    let score = 0;
    if (l === q) score = 100;
    else if (l.startsWith(q) || q.startsWith(l)) score = 85;
    else if (l.includes(q) || q.includes(l)) score = 70;
    else if (g.includes(q)) score = 55;
    else {
      const words = q.split(/\s+/).filter(Boolean);
      if (words.length && words.every((w) => l.includes(w) || g.includes(w))) score = 50;
    }
    if (score > bestScore) {
      bestScore = score;
      best = label;
    }
  });
  return best;
}

function postJobUrl(workLabel) {
  return 'post-job.html?work=' + encodeURIComponent(workLabel);
}

function populateJobCategorySelect(selectId, filterQuery) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const q = (filterQuery || '').trim();
  const qLower = q.toLowerCase();
  select.innerHTML = '<option value="">Choose work type</option>';
  Object.entries(JOB_CATEGORIES).forEach(([group, items]) => {
    const filtered = qLower
      ? items.filter((l) => l.toLowerCase().includes(qLower) || group.toLowerCase().includes(qLower))
      : items;
    if (!filtered.length) return;
    const og = document.createElement('optgroup');
    og.label = group;
    filtered.forEach((label) => {
      const o = document.createElement('option');
      o.value = label;
      o.textContent = label;
      og.appendChild(o);
    });
    select.appendChild(og);
  });
  const other = document.createElement('option');
  other.value = 'Other';
  other.textContent = 'Other (specify below)';
  if (!qLower || 'other'.includes(qLower)) select.appendChild(other);

  const match = findBestJobMatch(q);
  if (match) {
    select.value = match;
    if (!select.value) {
      for (const opt of select.options) {
        if (opt.value === match) {
          select.value = match;
          break;
        }
      }
    }
  }
}
