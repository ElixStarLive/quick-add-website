/**
 * UK SEO pages: /{trade-or-service}/{location}
 * Examples: /plumbers/london  /boiler-repair/manchester  /house-extension/bristol
 */
const {
  SEO_TRADE_DEFINITIONS,
  allTaxonomyServices,
  slugifyLabel
} = require('./uk-trades-taxonomy');

const SEO_LOCATIONS = {
  london: { label: 'London' },
  manchester: { label: 'Manchester' },
  liverpool: { label: 'Liverpool' },
  birmingham: { label: 'Birmingham' },
  leeds: { label: 'Leeds' },
  bristol: { label: 'Bristol' },
  sheffield: { label: 'Sheffield' },
  edinburgh: { label: 'Edinburgh' },
  glasgow: { label: 'Glasgow' },
  cardiff: { label: 'Cardiff' },
  belfast: { label: 'Belfast' },
  newcastle: { label: 'Newcastle' },
  'newcastle-upon-tyne': { label: 'Newcastle upon Tyne' },
  nottingham: { label: 'Nottingham' },
  southampton: { label: 'Southampton' },
  leicester: { label: 'Leicester' },
  coventry: { label: 'Coventry' },
  bradford: { label: 'Bradford' },
  brighton: { label: 'Brighton' },
  hull: { label: 'Hull' },
  plymouth: { label: 'Plymouth' },
  stoke: { label: 'Stoke-on-Trent' },
  'stoke-on-trent': { label: 'Stoke-on-Trent' },
  wolverhampton: { label: 'Wolverhampton' },
  derby: { label: 'Derby' },
  swansea: { label: 'Swansea' },
  aberdeen: { label: 'Aberdeen' },
  northampton: { label: 'Northampton' },
  portsmouth: { label: 'Portsmouth' },
  york: { label: 'York' },
  oxford: { label: 'Oxford' },
  cambridge: { label: 'Cambridge' },
  reading: { label: 'Reading' },
  'milton-keynes': { label: 'Milton Keynes' },
  luton: { label: 'Luton' },
  bournemouth: { label: 'Bournemouth' },
  peterborough: { label: 'Peterborough' },
  norwich: { label: 'Norwich' },
  sunderland: { label: 'Sunderland' },
  warrington: { label: 'Warrington' },
  slough: { label: 'Slough' },
  blackpool: { label: 'Blackpool' },
  middlesbrough: { label: 'Middlesbrough' },
  bolton: { label: 'Bolton' },
  ipswich: { label: 'Ipswich' },
  exeter: { label: 'Exeter' },
  cheltenham: { label: 'Cheltenham' },
  colchester: { label: 'Colchester' },
  crawley: { label: 'Crawley' },
  gloucester: { label: 'Gloucester' },
  wigan: { label: 'Wigan' },
  croydon: { label: 'Croydon' },
  watford: { label: 'Watford' },
  romford: { label: 'Romford' },
  ilford: { label: 'Ilford' },
  dartford: { label: 'Dartford' }
};

const SEO_TRADES = Object.fromEntries(
  SEO_TRADE_DEFINITIONS.map((t) => [t.slug, { label: t.label, workType: t.workType, intro: t.intro }])
);

function buildSeoServices() {
  const services = {};
  const usedSlugs = new Set([...Object.keys(SEO_TRADES), ...Object.keys(SEO_LOCATIONS)]);

  allTaxonomyServices().forEach(({ label, group, slug }) => {
    let finalSlug = slug || slugifyLabel(label);
    if (!finalSlug) return;
    let n = 2;
    while (usedSlugs.has(finalSlug)) {
      finalSlug = slug + '-' + n;
      n += 1;
    }
    usedSlugs.add(finalSlug);
    services[finalSlug] = {
      label,
      workType: label,
      intro: group.replace(/&/g, 'and').toLowerCase()
    };
  });
  return services;
}

const SEO_SERVICES = buildSeoServices();

/** Old plumber-london URLs → new /plumbers/london */
const LEGACY_COMPOUND_REDIRECTS = (() => {
  const map = {};
  Object.keys(SEO_TRADES).forEach((tradeSlug) => {
    const singular = tradeSlug.replace(/s$/, '').replace(/-men$/, '-man').replace(/-companies$/, '-company');
    Object.keys(SEO_LOCATIONS).forEach((loc) => {
      map[singular + '-' + loc] = tradeSlug + '/' + loc;
    });
  });
  Object.keys(SEO_SERVICES).forEach((serviceSlug) => {
    Object.keys(SEO_LOCATIONS).forEach((loc) => {
      map[serviceSlug + '-' + loc] = serviceSlug + '/' + loc;
    });
  });
  return map;
})();

function parseSeoPagePath(segment, locationSlug) {
  const seg = String(segment || '').toLowerCase();
  const loc = String(locationSlug || '').toLowerCase();
  const location = SEO_LOCATIONS[loc];
  if (!seg || !loc || !location) return null;

  const trade = SEO_TRADES[seg];
  if (trade) {
    return {
      pageType: 'trade',
      segmentSlug: seg,
      locationSlug: loc,
      entity: trade,
      location,
      slug: seg + '/' + loc
    };
  }

  const service = SEO_SERVICES[seg];
  if (service) {
    return {
      pageType: 'service',
      segmentSlug: seg,
      locationSlug: loc,
      entity: service,
      location,
      slug: seg + '/' + loc
    };
  }
  return null;
}

function parseLegacyCompoundSlug(rawSlug) {
  const slug = String(rawSlug || '').toLowerCase().replace(/^\/+|\/+$/g, '');
  if (!slug || slug.includes('/')) return null;
  const target = LEGACY_COMPOUND_REDIRECTS[slug];
  return target ? { redirect: '/' + target } : null;
}

function listSeoPageSlugs() {
  const slugs = [];
  const locations = Object.keys(SEO_LOCATIONS);
  Object.keys(SEO_TRADES).forEach((trade) => {
    locations.forEach((loc) => slugs.push(trade + '/' + loc));
  });
  Object.keys(SEO_SERVICES).forEach((service) => {
    locations.forEach((loc) => slugs.push(service + '/' + loc));
  });
  return slugs.sort();
}

function relatedSeoLinks(segmentSlug, locationSlug, pageType, limit = 8) {
  const links = [];
  const otherLocations = Object.keys(SEO_LOCATIONS).filter((l) => l !== locationSlug);

  if (pageType === 'trade') {
    const otherTrades = Object.keys(SEO_TRADES).filter((s) => s !== segmentSlug);
    for (let i = 0; i < otherTrades.length && links.length < limit / 2; i += 1) {
      links.push({
        href: '/' + otherTrades[i] + '/' + locationSlug,
        label: SEO_TRADES[otherTrades[i]].label + ' in ' + SEO_LOCATIONS[locationSlug].label
      });
    }
    for (let i = 0; i < otherLocations.length && links.length < limit; i += 1) {
      links.push({
        href: '/' + segmentSlug + '/' + otherLocations[i],
        label: SEO_TRADES[segmentSlug].label + ' in ' + SEO_LOCATIONS[otherLocations[i]].label
      });
    }
  } else {
    const otherServices = Object.keys(SEO_SERVICES).filter((s) => s !== segmentSlug);
    for (let i = 0; i < otherServices.length && links.length < limit; i += 1) {
      if (otherServices[i] === segmentSlug) continue;
      links.push({
        href: '/' + otherServices[i] + '/' + locationSlug,
        label: SEO_SERVICES[otherServices[i]].label + ' in ' + SEO_LOCATIONS[locationSlug].label
      });
      if (links.length >= limit) break;
    }
    for (let i = 0; i < otherLocations.length && links.length < limit; i += 1) {
      links.push({
        href: '/' + segmentSlug + '/' + otherLocations[i],
        label: SEO_SERVICES[segmentSlug].label + ' in ' + SEO_LOCATIONS[otherLocations[i]].label
      });
    }
  }
  return links.slice(0, limit);
}

module.exports = {
  SEO_TRADES,
  SEO_SERVICES,
  SEO_LOCATIONS,
  parseSeoPagePath,
  parseLegacyCompoundSlug,
  listSeoPageSlugs,
  relatedSeoLinks,
  LEGACY_COMPOUND_REDIRECTS
};
