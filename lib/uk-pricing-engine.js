/**
 * UK trade pricing engine — numbers come from curated rates, not AI guesses.
 * AI (when configured) only classifies the job; this module calculates prices.
 */

const SCOPES = ['minor_repair', 'partial', 'standard', 'full_refit', 'major_project'];

const LOCATION_MULTIPLIERS = {
  london: 1.22,
  south_east: 1.12,
  major_city: 1.05,
  uk_average: 1.0,
  rural: 0.95
};

const QUALITY_MULTIPLIERS = { budget: 0.88, standard: 1.0, premium: 1.28, luxury: 1.45 };

const CATEGORIES = [
  {
    id: 'full_bathroom',
    label: 'Full bathroom renewal',
    keywords: [/full bathroom|bathroom renovation|bathroom fitter|renew bathroom|wet room|full property renovation|full house refurbishment/],
    defaultScope: 'full_refit',
    scopes: {
      minor_repair: { min: 80, max: 280, labourRatio: 0.72 },
      partial: { min: 900, max: 2800, labourRatio: 0.58 },
      full_refit: { min: 5000, max: 9000, labourRatio: 0.5, perSqm: { rateMin: 1100, rateMax: 1650, baseSqm: 4 } },
      major_project: { min: 9000, max: 14000, labourRatio: 0.48, perSqm: { rateMin: 1400, rateMax: 2000, baseSqm: 6 } }
    },
    scopeHints: { minor_repair: /leak|blocked|tap|toilet repair|silicone|minor/, full_refit: /full|renew|refit|renovation|rip.?out|new suite|complete|2000|2m|wet room/ }
  },
  {
    id: 'full_kitchen',
    label: 'Full kitchen refit',
    keywords: [/full kitchen|kitchen fitter|kitchen installation|renew kitchen/],
    defaultScope: 'full_refit',
    scopes: {
      partial: { min: 800, max: 2500, labourRatio: 0.55 },
      full_refit: { min: 8000, max: 18000, labourRatio: 0.48, perSqm: { rateMin: 900, rateMax: 1400, baseSqm: 12 } },
      major_project: { min: 18000, max: 35000, labourRatio: 0.45 }
    },
    scopeHints: { partial: /worktop|door|single|repair/, full_refit: /full|renew|refit|complete|new kitchen/ }
  },
  {
    id: 'shower_bath',
    label: 'Shower or bath installation',
    keywords: [/shower installation|bath installation/],
    defaultScope: 'partial',
    scopes: {
      partial: { min: 900, max: 2800, labourRatio: 0.55 },
      full_refit: { min: 3500, max: 6500, labourRatio: 0.5 }
    }
  },
  {
    id: 'plumbing_repair',
    label: 'Plumbing repair',
    keywords: [/leaking tap|tap replacement|toilet repair|blocked drain|blocked sink|silicone reseal|burst pipe|radiator leak/],
    defaultScope: 'minor_repair',
    scopes: {
      minor_repair: { min: 80, max: 280, labourRatio: 0.75 },
      partial: { min: 280, max: 650, labourRatio: 0.65 }
    }
  },
  {
    id: 'heating_gas',
    label: 'Heating & gas',
    keywords: [/boiler service|boiler breakdown|boiler installation|power flush|radiator installation|central heating|gas safety|cp12|underfloor heating/],
    defaultScope: 'standard',
    scopes: {
      minor_repair: { min: 120, max: 350, labourRatio: 0.7 },
      standard: { min: 350, max: 900, labourRatio: 0.6 },
      full_refit: { min: 1800, max: 3200, labourRatio: 0.52 }
    },
    scopeHints: { full_refit: /installation|new boiler|replace boiler/, minor_repair: /service|breakdown|repair|leak/ }
  },
  {
    id: 'electrical_major',
    label: 'Electrical (major)',
    keywords: [/full house rewire|partial rewire|eicr|consumer unit|fuse box/],
    defaultScope: 'full_refit',
    scopes: {
      minor_repair: { min: 150, max: 400, labourRatio: 0.7 },
      partial: { min: 400, max: 1500, labourRatio: 0.62 },
      full_refit: { min: 3000, max: 8000, labourRatio: 0.58 }
    },
    scopeHints: { full_refit: /full|rewire|consumer unit|fuse box/, minor_repair: /socket|light|single|fault/ }
  },
  {
    id: 'electrical_minor',
    label: 'Electrical (small job)',
    keywords: [/socket|light fitting|smoke alarm|fault finding|downlight|extractor fan/],
    defaultScope: 'minor_repair',
    scopes: {
      minor_repair: { min: 80, max: 350, labourRatio: 0.72 },
      partial: { min: 350, max: 750, labourRatio: 0.65 }
    }
  },
  {
    id: 'ev_cctv',
    label: 'EV charger or CCTV',
    keywords: [/ev home charger|cctv installation/],
    defaultScope: 'standard',
    scopes: { standard: { min: 400, max: 1200, labourRatio: 0.55 } }
  },
  {
    id: 'building_major',
    label: 'Extension or conversion',
    keywords: [/extension|loft conversion|garage conversion/],
    defaultScope: 'major_project',
    scopes: { major_project: { min: 25000, max: 80000, labourRatio: 0.42 } }
  },
  {
    id: 'building_general',
    label: 'General building',
    keywords: [/general builder|plastering|bricklayer|damp proof|insulation|demolition|groundworks/],
    defaultScope: 'standard',
    scopes: {
      minor_repair: { min: 200, max: 600, labourRatio: 0.68 },
      standard: { min: 600, max: 3500, labourRatio: 0.55 },
      major_project: { min: 3500, max: 15000, labourRatio: 0.48 }
    }
  },
  {
    id: 'roofing',
    label: 'Roofing & gutters',
    keywords: [/roof leak|new roof|flat roof|gutter|chimney|fascia|velux|skylight/],
    defaultScope: 'standard',
    scopes: {
      minor_repair: { min: 150, max: 550, labourRatio: 0.7 },
      standard: { min: 550, max: 2500, labourRatio: 0.58 },
      major_project: { min: 5000, max: 12000, labourRatio: 0.45 }
    },
    scopeHints: { major_project: /new roof|re-tile|full re-roof/, minor_repair: /leak|clean|small repair/ }
  },
  {
    id: 'windows_doors',
    label: 'Windows & doors',
    keywords: [/upvc window|double glazing|composite front door|conservatory|bi-fold|patio door|sash window/],
    defaultScope: 'standard',
    scopes: {
      minor_repair: { min: 80, max: 250, labourRatio: 0.75 },
      partial: { min: 400, max: 1200, labourRatio: 0.5 },
      full_refit: { min: 2500, max: 12000, labourRatio: 0.45 }
    },
    scopeHints: { partial: /single|one window|handle|lock|misty unit/, full_refit: /full house|all windows|conservatory/ }
  },
  {
    id: 'painting',
    label: 'Painting & decorating',
    keywords: [/interior painting|exterior painting|wallpaper|decorat|coving/],
    defaultScope: 'standard',
    scopes: {
      partial: { min: 250, max: 700, labourRatio: 0.72 },
      standard: { min: 600, max: 2500, labourRatio: 0.68 },
      full_refit: { min: 1500, max: 4500, labourRatio: 0.65 }
    },
    scopeHints: { partial: /single room|one room/, full_refit: /whole house|full house|exterior whole/ }
  },
  {
    id: 'flooring',
    label: 'Flooring & tiling',
    keywords: [/floor tiling|wall tiling|laminate|vinyl|lvt|carpet fitting|floor screed/],
    defaultScope: 'standard',
    scopes: {
      partial: { min: 200, max: 800, labourRatio: 0.65 },
      standard: { min: 800, max: 1800, labourRatio: 0.58, perSqm: { rateMin: 35, rateMax: 65, baseSqm: 15 } },
      full_refit: { min: 1800, max: 5000, labourRatio: 0.52 }
    }
  },
  {
    id: 'mobile_oil',
    label: 'Mobile oil change',
    keywords: [/oil change|mobile mechanic.*oil|oil filter at your address/],
    defaultScope: 'minor_repair',
    scopes: { minor_repair: { min: 80, max: 180, labourRatio: 0.65 } }
  },
  {
    id: 'car_service',
    label: 'Car service & MOT',
    keywords: [/full car service|interim|mot test|mot fail/],
    defaultScope: 'standard',
    scopes: { standard: { min: 120, max: 350, labourRatio: 0.55 } }
  },
  {
    id: 'car_repair',
    label: 'Car repair',
    keywords: [/brake|tyre|battery|diagnostic|clutch|exhaust|air con regas|mobile mechanic|alternator|starter motor|timing belt/],
    defaultScope: 'standard',
    scopes: {
      minor_repair: { min: 80, max: 200, labourRatio: 0.6 },
      standard: { min: 150, max: 450, labourRatio: 0.55 },
      major_project: { min: 450, max: 1200, labourRatio: 0.5 }
    }
  },
  {
    id: 'cleaning',
    label: 'Cleaning',
    keywords: [/domestic cleaning|deep clean|end of tenancy|oven clean|carpet cleaning|pressure washing/],
    defaultScope: 'standard',
    scopes: {
      minor_repair: { min: 60, max: 120, labourRatio: 0.85 },
      standard: { min: 120, max: 350, labourRatio: 0.82 }
    }
  },
  {
    id: 'garden',
    label: 'Garden & outdoor',
    keywords: [/landscap|garden|fence|decking|driveway|artificial grass|tree surgeon|patio/],
    defaultScope: 'standard',
    scopes: {
      partial: { min: 200, max: 800, labourRatio: 0.62 },
      standard: { min: 800, max: 3500, labourRatio: 0.55 },
      major_project: { min: 3500, max: 12000, labourRatio: 0.48 }
    }
  },
  {
    id: 'handyman',
    label: 'Handyman',
    keywords: [/handyman|flat pack|tv wall|blind fitting|picture hanging|curtain rail/],
    defaultScope: 'minor_repair',
    scopes: { minor_repair: { min: 50, max: 250, labourRatio: 0.78 } }
  },
  {
    id: 'appliance',
    label: 'Appliance repair',
    keywords: [/washing machine|dishwasher|fridge|oven repair|tumble dryer|appliance/],
    defaultScope: 'standard',
    scopes: { standard: { min: 70, max: 200, labourRatio: 0.7 } }
  },
  {
    id: 'removals',
    label: 'Removals & clearance',
    keywords: [/house removal|man with van|waste clearance|rubbish removal/],
    defaultScope: 'standard',
    scopes: {
      partial: { min: 80, max: 250, labourRatio: 0.75 },
      standard: { min: 250, max: 800, labourRatio: 0.68 },
      major_project: { min: 400, max: 1500, labourRatio: 0.6 }
    }
  }
];

const DEFAULT_CATEGORY = {
  id: 'general',
  label: 'General trade work',
  defaultScope: 'standard',
  scopes: { standard: { min: 150, max: 600, labourRatio: 0.65 } }
};

function formatGbp(n) {
  return `£${Math.round(n).toLocaleString('en-GB')}`;
}

function formatGbpRange(min, max) {
  return `${formatGbp(min)}–${formatGbp(max)}`;
}

function parseGbpAmount(str) {
  const m = String(str || '').match(/[\d,]+/);
  return m ? parseInt(m[0].replace(/,/g, ''), 10) : 0;
}

function parseSqm(text) {
  const t = String(text || '').toLowerCase();
  const dim = t.match(/(\d+(?:\.\d+)?)\s*[m]?\s*[x×]\s*(\d+(?:\.\d+)?)\s*m?/);
  if (dim) return Math.max(1, Math.round(parseFloat(dim[1]) * parseFloat(dim[2]) * 10) / 10);
  const sqm = t.match(/(\d+(?:\.\d+)?)\s*sq\s*m/);
  if (sqm) return parseFloat(sqm[1]);
  return null;
}

function detectLocationTier(location) {
  const loc = String(location || '').toLowerCase();
  if (/london|central london|greater london|wc|ec|sw|se|nw|ne|e1|w1/.test(loc)) return 'london';
  if (/brighton|oxford|cambridge|reading|guildford|surrey|kent|essex|hertfordshire|berkshire|south east|south east england/.test(loc)) return 'south_east';
  if (/manchester|birmingham|leeds|liverpool|bristol|sheffield|edinburgh|glasgow|cardiff|nottingham|newcastle|city centre/.test(loc)) return 'major_city';
  if (/rural|village|countryside|remote|highlands|wales valley/.test(loc)) return 'rural';
  return 'uk_average';
}

function detectQuality(text) {
  const t = String(text || '').toLowerCase();
  if (/luxury|high.?end|designer|premium suite|marble|bespoke/.test(t)) return 'luxury';
  if (/premium|quality|mid.?range|decent|good spec/.test(t)) return 'premium';
  if (/budget|cheap|basic|economy|low cost|affordable/.test(t)) return 'budget';
  return 'standard';
}

function matchCategory(text) {
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((re) => re.test(text))) return cat;
  }
  return null;
}

function detectScope(category, text) {
  const hints = category.scopeHints || {};
  const isFull = /full|complete|renew|refit|renovation|rip.?out|new suite|from scratch|total/.test(text);
  const isMinor = /leak|repair|blocked|minor|single|small|fix|replace one|tap|silicone/.test(text);

  for (const scope of ['major_project', 'full_refit', 'partial', 'minor_repair']) {
    if (hints[scope] && hints[scope].test(text)) return scope;
  }
  if (isFull && category.scopes.full_refit) return 'full_refit';
  if (isFull && category.scopes.major_project) return 'major_project';
  if (isMinor && category.scopes.minor_repair && !isFull) return 'minor_repair';
  if (category.scopes[category.defaultScope]) return category.defaultScope;
  return Object.keys(category.scopes)[0];
}

function classifyJobLocally(jobType, description, location) {
  const text = `${jobType || ''} ${description || ''}`.toLowerCase();
  const category = matchCategory(text) || DEFAULT_CATEGORY;
  const scope = detectScope(category, text);
  const sqm = parseSqm(text);
  const quality = detectQuality(text);
  const locationTier = detectLocationTier(location);

  return {
    category_id: category.id,
    scope,
    sqm,
    quality_tier: quality,
    location_tier: locationTier,
    source: 'engine'
  };
}

function calculateFromScope(scopeConfig, sqm, qualityTier, locationTier) {
  let min = scopeConfig.min;
  let max = scopeConfig.max;

  if (scopeConfig.perSqm && sqm) {
    const base = scopeConfig.perSqm.baseSqm || 4;
    const factor = Math.max(0.75, sqm / base);
    min = Math.round(scopeConfig.min * 0.4 + scopeConfig.perSqm.rateMin * sqm);
    max = Math.round(scopeConfig.max * 0.4 + scopeConfig.perSqm.rateMax * sqm);
    if (factor > 1.15) {
      min = Math.round(min * Math.min(factor, 1.8));
      max = Math.round(max * Math.min(factor, 1.8));
    }
  }

  const qMult = QUALITY_MULTIPLIERS[qualityTier] || 1;
  const lMult = LOCATION_MULTIPLIERS[locationTier] || 1;
  const mult = qMult * lMult;

  min = Math.round(min * mult);
  max = Math.round(max * mult);
  if (max < min) max = min + Math.round(min * 0.2);

  const labourRatio = scopeConfig.labourRatio || 0.55;
  const mid = Math.round((min + max) / 2);
  const labourMid = Math.round(mid * labourRatio);
  const matMid = mid - labourMid;
  const labourMin = Math.round(min * labourRatio);
  const labourMax = Math.round(max * labourRatio);
  const matMin = min - labourMin;
  const matMax = max - labourMax;

  return { min, max, mid, labourMin, labourMax, matMin, matMax, labourRatio };
}

function budgetVerdict(customerBudget, min, max) {
  if (!customerBudget) return 'not_provided';
  if (customerBudget < min * 0.65) return 'too_low';
  if (customerBudget > max * 1.35) return 'generous';
  return 'reasonable';
}

function buildSummary(category, classification, calc, customerBudget, verdict) {
  const parts = [];
  parts.push(`This is a ${classification.scope.replace(/_/g, ' ')} ${category.label.toLowerCase()} job`);
  if (classification.sqm) parts.push(` (~${classification.sqm} sq m)`);
  parts.push(` in the ${classification.location_tier.replace(/_/g, ' ')} price band (${classification.quality_tier} spec).`);
  parts.push(` Typical UK total (labour + materials): ${formatGbpRange(calc.min, calc.max)}.`);
  parts.push(` Suggested starting budget: ${formatGbp(calc.mid)}.`);

  if (verdict === 'too_low') {
    parts.push(` Your entered budget (£${customerBudget.toLocaleString('en-GB')}) is below what contractors usually need — they may not respond.`);
  } else if (verdict === 'reasonable') {
    parts.push(' Your budget looks in line with typical market rates.');
  } else if (verdict === 'generous') {
    parts.push(' Your budget is above typical — you should attract good quotes.');
  }

  parts.push(' Always get written quotes after a site visit before committing.');
  return parts.join('');
}

function buildEstimate(input) {
  const { job_type, description, location, budget, classification: aiClass } = input;
  const classification = aiClass || classifyJobLocally(job_type, description, location);

  const category =
    CATEGORIES.find((c) => c.id === classification.category_id) ||
    matchCategory(`${job_type} ${description}`) ||
    DEFAULT_CATEGORY;

  const scope = classification.scope && category.scopes[classification.scope]
    ? classification.scope
    : detectScope(category, `${job_type} ${description}`.toLowerCase());

  const scopeConfig = category.scopes[scope] || Object.values(category.scopes)[0];
  const sqm = classification.sqm ?? parseSqm(`${job_type} ${description}`);
  const qualityTier = classification.quality_tier || detectQuality(`${job_type} ${description}`);
  const locationTier = classification.location_tier || detectLocationTier(location);

  const calc = calculateFromScope(scopeConfig, sqm, qualityTier, locationTier);
  const customerBudget = parseGbpAmount(budget);
  const verdict = budgetVerdict(customerBudget, calc.min, calc.max);

  return {
    enabled: true,
    category: category.label,
    scope,
    total_range_gbp: formatGbpRange(calc.min, calc.max),
    labour_range_gbp: formatGbpRange(calc.labourMin, calc.labourMax),
    materials_range_gbp: formatGbpRange(calc.matMin, calc.matMax),
    suggested_budget_gbp: formatGbp(calc.mid),
    verdict,
    summary: buildSummary(category, { ...classification, scope, quality_tier: qualityTier, location_tier: locationTier, sqm }, calc, customerBudget, verdict),
    method: aiClass ? 'ai_classified' : 'engine',
    disclaimer: 'Calculated from UK trade rate guides — not a fixed quote. Contractors may quote differently after site visit.'
  };
}

function getCategoryIdsForAI() {
  return CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    scopes: Object.keys(c.scopes)
  }));
}

function validateAIClassification(raw, jobType, description, location) {
  const fallback = classifyJobLocally(jobType, description, location);
  if (!raw || typeof raw !== 'object') return fallback;

  const category = CATEGORIES.find((c) => c.id === raw.category_id);
  const category_id = category ? raw.category_id : fallback.category_id;

  const cat = CATEGORIES.find((c) => c.id === category_id) || DEFAULT_CATEGORY;
  const scope = raw.scope && cat.scopes[raw.scope] ? raw.scope : fallback.scope;

  const quality = QUALITY_MULTIPLIERS[raw.quality_tier] ? raw.quality_tier : fallback.quality_tier;
  const loc = LOCATION_MULTIPLIERS[raw.location_tier] ? raw.location_tier : fallback.location_tier;
  const sqm = typeof raw.sqm === 'number' && raw.sqm > 0 ? raw.sqm : fallback.sqm;

  return {
    category_id,
    scope,
    sqm,
    quality_tier: quality,
    location_tier: loc,
    ai_notes: raw.notes || '',
    source: 'ai'
  };
}

module.exports = {
  SCOPES,
  CATEGORIES,
  classifyJobLocally,
  buildEstimate,
  validateAIClassification,
  getCategoryIdsForAI,
  formatGbp,
  parseGbpAmount
};
