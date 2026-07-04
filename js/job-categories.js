const JOB_CATEGORIES = {
  'Mobile mechanic – at your address': [
    'Mobile mechanic – oil change at your address',
    'Mobile mechanic – oil filter at your address',
    'Mobile mechanic – air filter at your address',
    'Mobile mechanic – brake pads at your address',
    'Mobile mechanic – battery replacement at your address',
    'Mobile mechanic – tyre change at your address',
    'Mobile mechanic – diagnostic check at your address',
    'Mobile mechanic – car won\'t start at your address',
    'Mobile mechanic – same day call-out'
  ],
  'Car servicing & maintenance': [
    'Full car service', 'Interim / oil service', 'Oil change', 'Oil filter replacement',
    'Air filter replacement', 'Spark plugs replacement', 'Brake fluid change', 'Battery check & replacement',
    'Car diagnostic check', 'MOT test', 'MOT fail repair work'
  ],
  'Car brakes, tyres & mechanical': [
    'Brake pads replacement', 'Brake discs replacement', 'Tyre replacement', 'Puncture repair',
    'Wheel alignment / tracking', 'Clutch replacement', 'Exhaust repair', 'Timing belt / cambelt',
    'Alternator repair', 'Starter motor repair', 'Air con regas', 'Lost car keys'
  ],
  'Plumbing – leaks & repairs': [
    'Leaking tap repair', 'Tap replacement', 'Burst pipe emergency repair', 'Toilet repair',
    'Blocked drain', 'Blocked sink', 'Radiator leak repair', 'Silicone reseal (bathroom/kitchen)'
  ],
  'Plumbing – heating & gas': [
    'Boiler breakdown repair', 'Boiler service', 'Boiler installation', 'Gas safety certificate (CP12)',
    'Radiator installation', 'Central heating repair', 'Power flush', 'Underfloor heating installation'
  ],
  'Bathrooms & kitchens': [
    'Full bathroom renovation', 'Bathroom fitter', 'Shower installation', 'Bath installation',
    'Full kitchen installation', 'Kitchen fitter', 'Kitchen worktop replacement', 'Wet room installation'
  ],
  'Electrical': [
    'Full house rewire', 'Partial rewire', 'EICR electrical test certificate', 'Fuse box / consumer unit upgrade',
    'Additional socket installation', 'Light fitting installation', 'Downlights / spotlights', 'Extractor fan installation',
    'EV home charger installation', 'CCTV installation', 'Smoke alarm installation', 'Electrical fault finding'
  ],
  'Building & construction': [
    'General builder', 'Full property renovation', 'Full house refurbishment', 'Renew kitchen', 'Renew bathroom',
    'Extension build', 'Loft conversion', 'Garage conversion', 'Bricklayer', 'Plastering', 'Groundworks',
    'Steel beam installation', 'Damp proofing', 'Insulation', 'Demolition'
  ],
  'Roofing & gutters': [
    'Roof leak repair', 'New roof / re-tile', 'Flat roof repair', 'Chimney repair', 'Gutter repair',
    'Gutter cleaning', 'Fascia & soffit replacement', 'Skylight / Velux installation', 'Lead flashing repair'
  ],
  'Windows, doors & UPVC': [
    'Quality UPVC windows', 'UPVC windows supply & fit', 'UPVC doors supply & fit', 'Double glazing – new windows',
    'Misted / foggy unit replacement', 'Composite front door', 'Bi-fold doors', 'Patio / sliding doors',
    'Sash windows', 'Conservatory', 'Window lock / handle repair'
  ],
  'Painting & decorating': [
    'Interior painting', 'Exterior painting', 'Wallpapering', 'Plastering', 'Ceiling painting',
    'Woodwork painting', 'Coving installation', 'Crack repair & filling'
  ],
  'Flooring & tiling': [
    'Laminate flooring fitting', 'Vinyl / LVT flooring', 'Carpet fitting', 'Floor tiling', 'Wall tiling',
    'Floor sanding & sealing', 'Floor screeding', 'Skirting board fitting'
  ],
  'Carpentry & doors': [
    'Carpenter / joiner', 'Internal door fitting', 'Front door replacement', 'Staircase build / repair',
    'Built-in wardrobe', 'Shelving installation', 'Loft boarding', 'Kitchen fitting'
  ],
  'Garden & outdoor': [
    'Landscaping', 'Gardening / lawn mowing', 'Hedge trimming', 'Tree surgeon', 'Fence installation',
    'Decking installation', 'Patio laying', 'Block paving / driveway', 'Artificial grass fitting', 'Garden clearance'
  ],
  'Cleaning services': [
    'Domestic cleaning', 'Deep clean', 'End of tenancy clean', 'Carpet cleaning', 'Oven cleaning',
    'Window cleaning', 'Pressure washing (drive/patio)', 'Gutter cleaning', 'Pest control'
  ],
  'Handyman & repairs': [
    'Handyman – general jobs', 'Flat pack assembly', 'TV wall mounting', 'Blind fitting', 'Furniture repair',
    'Picture / mirror hanging', 'Curtain rail fitting', 'General home maintenance'
  ],
  'Appliance repair': [
    'Washing machine repair', 'Dishwasher repair', 'Fridge / freezer repair', 'Cooker / oven repair',
    'Tumble dryer repair', 'Hob installation', 'Extractor hood repair'
  ],
  'Removals & waste': [
    'House removal', 'Man with van', 'Furniture delivery', 'Waste clearance', 'Rubbish removal',
    'Garage clearance', 'Loft clearance', 'Office clearance'
  ]
};

/** Map homepage / icon labels to the best real job category option */
function findBestJobMatch(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return '';

  const aliases = {
    mot: 'MOT test',
    car: 'Oil change',
    cleaning: 'Domestic cleaning',
    plumbing: 'Leaking tap repair',
    electrical: 'Full house rewire',
    building: 'General builder',
    roofing: 'Roof leak repair',
    upvc: 'Quality UPVC windows',
    painting: 'Interior painting',
    flooring: 'Laminate flooring fitting',
    carpentry: 'Carpenter / joiner',
    garden: 'Landscaping',
    handyman: 'Handyman – general jobs',
    appliance: 'Washing machine repair',
    removal: 'House removal',
    services: 'Handyman – general jobs',
    domestic: 'Domestic cleaning',
    'deep clean': 'Deep clean',
    'end of tenancy': 'End of tenancy clean',
    'mobile mechanic': 'Mobile mechanic – oil change at your address',
    'full service': 'Full car service',
    'renew bathroom': 'Renew bathroom',
    'renew kitchen': 'Renew kitchen',
    'full renovation': 'Full property renovation',
    'shower install': 'Shower installation',
    'bathroom fit': 'Bathroom fitter',
    'fuse box': 'Fuse box / consumer unit upgrade',
    rewire: 'Full house rewire',
    sockets: 'Additional socket installation',
    lighting: 'Light fitting installation',
    extension: 'Extension build',
    'loft conversion': 'Loft conversion',
    plastering: 'Plastering',
    'roof leak': 'Roof leak repair',
    'gutter cleaning': 'Gutter cleaning',
    'upvc windows': 'Quality UPVC windows',
    'double glazing': 'Double glazing – new windows',
    wallpapering: 'Wallpapering',
    laminate: 'Laminate flooring fitting',
    carpet: 'Carpet fitting',
    'floor tiling': 'Floor tiling',
    carpenter: 'Carpenter / joiner',
    landscaping: 'Landscaping',
    gardening: 'Gardening / lawn mowing',
    fencing: 'Fence installation',
    'flat pack': 'Flat pack assembly',
    'tv mounting': 'TV wall mounting',
    'washing machine': 'Washing machine repair',
    dishwasher: 'Dishwasher repair',
    'house removal': 'House removal',
    'man with van': 'Man with van',
    'waste clearance': 'Waste clearance'
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
