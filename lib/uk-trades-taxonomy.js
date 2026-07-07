/**
 * UK Construction & Property Maintenance taxonomy.
 * 19 main trade categories · 250+ specific services
 */

const UK_TRADES_TAXONOMY = {
  'Construction & building': [
    'General Builder', 'House Extension', 'Loft Conversion', 'Garage Conversion', 'Basement Conversion',
    'New Build', 'Property Renovation', 'Structural Alterations', 'RSJ Steel Beams', 'Bricklayer',
    'Blockwork', 'Groundworks', 'Foundations', 'Concrete Services', 'Demolition', 'Scaffolding',
    'Steel Fixing', 'Damp Proofing', 'Waterproofing', 'Insulation'
  ],
  'Plumbing': [
    'Emergency Plumber', 'General Plumbing', 'Leak Detection', 'Burst Pipes', 'Blocked Drains',
    'Toilet Repairs', 'Sink Installation', 'Tap Repairs', 'Shower Installation', 'Shower Repairs',
    'Bath Installation', 'Radiator Installation', 'Radiator Repairs', 'Power Flushing', 'Water Tanks',
    'Hot Water Cylinders', 'Pipework', 'Underfloor Heating'
  ],
  'Heating & gas': [
    'Gas Engineer', 'Boiler Installation', 'Boiler Repairs', 'Boiler Servicing', 'Central Heating',
    'Gas Safety Certificate', 'Smart Thermostats', 'Gas Cooker Installation', 'Gas Fire Installation',
    'LPG Services'
  ],
  'Electrical': [
    'Emergency Electrician', 'Full Rewire', 'Partial Rewire', 'Consumer Unit', 'Fuse Board Upgrade',
    'Fault Finding', 'EICR Certificate', 'PAT Testing', 'Socket Installation', 'Lighting Installation',
    'Outdoor Lighting', 'LED Lighting', 'Smoke Alarms', 'CCTV Installation', 'Burglar Alarms',
    'EV Charger Installation', 'Door Entry Systems', 'Data Cabling', 'Solar PV Installation',
    'Battery Storage'
  ],
  'Roofing': [
    'Roof Repairs', 'New Roof', 'Flat Roofing', 'Slate Roofing', 'Tile Roofing', 'EPDM Roofing',
    'GRP Fibreglass Roofing', 'Leadwork', 'Chimney Repairs', 'Chimney Rebuild', 'Fascias', 'Soffits',
    'Gutters', 'Gutter Repairs', 'Roof Cleaning', 'Roof Inspection', 'Velux Windows'
  ],
  'Plastering & rendering': [
    'Plastering', 'Skimming', 'Dry Lining', 'Ceiling Repairs', 'Coving', 'Rendering',
    'Silicone Rendering', 'Pebble Dashing', 'Artex Removal'
  ],
  'Painting & decorating': [
    'Interior Painting', 'Exterior Painting', 'Wallpaper Hanging', 'Wallpaper Removal',
    'Spray Painting', 'Wood Staining', 'Wood Painting', 'Commercial Decorating'
  ],
  'Carpentry & joinery': [
    'Carpenter', 'Joiner', 'Kitchen Fitting', 'Internal Doors', 'External Doors', 'Fire Doors',
    'Staircases', 'Skirting Boards', 'Architraves', 'Loft Boarding', 'Bespoke Furniture',
    'Wardrobes', 'Shelving', 'Timber Framing'
  ],
  'Kitchens': [
    'Kitchen Installation', 'Kitchen Renovation', 'Kitchen Design', 'Cabinets', 'Worktops',
    'Splashbacks', 'Kitchen Appliance Installation'
  ],
  'Bathrooms': [
    'Bathroom Installation', 'Bathroom Renovation', 'Wet Rooms', 'Shower Rooms', 'Bathroom Tiling',
    'Bathroom Plumbing', 'Bathroom Furniture'
  ],
  'Flooring': [
    'Laminate Flooring', 'Hardwood Flooring', 'Engineered Wood', 'Vinyl Flooring', 'LVT Flooring',
    'Carpet Fitting', 'Floor Tiling', 'Wall Tiling', 'Screeding', 'Floor Sanding', 'Floor Polishing',
    'Resin Flooring'
  ],
  'Windows & doors': [
    'UPVC Windows', 'Aluminium Windows', 'Timber Windows', 'Double Glazing', 'Triple Glazing',
    'Composite Doors', 'French Doors', 'Patio Doors', 'Bi-Fold Doors', 'Conservatories', 'Porches',
    'Window Repairs', 'Door Repairs', 'Locks & Handles'
  ],
  'Landscaping': [
    'Landscaping', 'Garden Design', 'Turfing', 'Artificial Grass', 'Decking', 'Fencing',
    'Garden Walls', 'Patios', 'Block Paving', 'Resin Driveways', 'Tarmac Driveways',
    'Gravel Driveways', 'Tree Surgery', 'Hedge Cutting', 'Stump Grinding', 'Drainage',
    'Garden Clearance', 'Pressure Washing'
  ],
  'Cleaning': [
    'Domestic Cleaning', 'Commercial Cleaning', 'End of Tenancy Cleaning', 'Deep Cleaning',
    'Carpet Cleaning', 'Upholstery Cleaning', 'Oven Cleaning', 'Window Cleaning', 'Gutter Cleaning',
    'Builders Clean'
  ],
  'Pest control': [
    'Pest Control', 'Rats', 'Mice', 'Wasps', 'Bees', 'Ants', 'Fleas', 'Bed Bugs', 'Cockroaches',
    'Birds', 'Squirrels'
  ],
  'Security': [
    'Locksmith', 'Security CCTV', 'Burglar Alarm', 'Smart Security', 'Access Control',
    'Intercom Systems'
  ],
  'Handyman': [
    'General Repairs', 'Flat Pack Assembly', 'TV Wall Mounting', 'Handyman Shelving', 'Curtain Rails',
    'Mirror Hanging', 'Blind Fitting', 'Furniture Repairs'
  ],
  'Appliance repairs': [
    'Washing Machine Repair', 'Dishwasher Repair', 'Fridge Freezer Repair', 'Oven Repair',
    'Cooker Repair', 'Hob Repair', 'Tumble Dryer Repair', 'Extractor Hood Repair'
  ],
  'Removals & clearance': [
    'House Removals', 'Office Removals', 'Man with Van', 'House Clearance', 'Garage Clearance',
    'Loft Clearance', 'Waste Clearance', 'Rubbish Removal', 'Skip Hire'
  ]
};

/** Trade-level SEO pages — plural slugs e.g. /plumbers/london */
const SEO_TRADE_DEFINITIONS = [
  { slug: 'builders', label: 'Builders', workType: 'General Builder', intro: 'extensions, renovations, structural work and new builds' },
  { slug: 'plumbers', label: 'Plumbers', workType: 'Emergency Plumber', intro: 'plumbing repairs, leaks, installations and emergencies' },
  { slug: 'gas-engineers', label: 'Gas Engineers', workType: 'Gas Engineer', intro: 'boilers, central heating, gas safety and LPG services' },
  { slug: 'electricians', label: 'Electricians', workType: 'Emergency Electrician', intro: 'rewires, lighting, fault finding and electrical safety' },
  { slug: 'roofers', label: 'Roofers', workType: 'Roof Repairs', intro: 'roof repairs, new roofs, gutters and chimney work' },
  { slug: 'plasterers', label: 'Plasterers', workType: 'Plastering', intro: 'plastering, rendering, skimming and ceiling repairs' },
  { slug: 'painters', label: 'Painters & Decorators', workType: 'Interior Painting', intro: 'interior and exterior painting and decorating' },
  { slug: 'carpenters', label: 'Carpenters', workType: 'Carpenter', intro: 'joinery, doors, staircases and bespoke woodwork' },
  { slug: 'kitchen-fitters', label: 'Kitchen Fitters', workType: 'Kitchen Installation', intro: 'kitchen design, fitting, worktops and cabinets' },
  { slug: 'bathroom-fitters', label: 'Bathroom Fitters', workType: 'Bathroom Installation', intro: 'bathroom installation, wet rooms and tiling' },
  { slug: 'flooring-fitters', label: 'Flooring Fitters', workType: 'Laminate Flooring', intro: 'laminate, hardwood, carpet, tiling and resin floors' },
  { slug: 'window-fitters', label: 'Window Fitters', workType: 'UPVC Windows', intro: 'windows, doors, glazing and conservatories' },
  { slug: 'landscapers', label: 'Landscapers', workType: 'Landscaping', intro: 'garden design, driveways, decking and outdoor projects' },
  { slug: 'cleaners', label: 'Cleaners', workType: 'Domestic Cleaning', intro: 'domestic, commercial and end of tenancy cleaning' },
  { slug: 'pest-controllers', label: 'Pest Controllers', workType: 'Pest Control', intro: 'rats, wasps, bed bugs and pest removal' },
  { slug: 'locksmiths', label: 'Locksmiths', workType: 'Locksmith', intro: 'lock changes, CCTV, alarms and home security' },
  { slug: 'handymen', label: 'Handymen', workType: 'General Repairs', intro: 'general repairs, assembly and small home jobs' },
  { slug: 'appliance-repairers', label: 'Appliance Repairers', workType: 'Washing Machine Repair', intro: 'washing machines, dishwashers, ovens and white goods' },
  { slug: 'removal-companies', label: 'Removal Companies', workType: 'House Removals', intro: 'house moves, clearances and waste removal' }
];

function slugifyLabel(label) {
  return String(label || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function allTaxonomyServices() {
  const seen = new Set();
  const items = [];
  Object.entries(UK_TRADES_TAXONOMY).forEach(([group, labels]) => {
    labels.forEach((label) => {
      const key = label.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      items.push({ label, group, slug: slugifyLabel(label) });
    });
  });
  return items;
}

/** SEO_TRADE_DEFINITIONS is parallel to UK_TRADES_TAXONOMY group order. */
const TRADE_GROUP_BY_SLUG = Object.fromEntries(
  SEO_TRADE_DEFINITIONS.map((t, i) => [t.slug, Object.keys(UK_TRADES_TAXONOMY)[i]])
);

function servicesForTrade(slug) {
  const group = TRADE_GROUP_BY_SLUG[String(slug || '')];
  return group && UK_TRADES_TAXONOMY[group] ? UK_TRADES_TAXONOMY[group].slice() : [];
}

module.exports = {
  UK_TRADES_TAXONOMY,
  SEO_TRADE_DEFINITIONS,
  slugifyLabel,
  allTaxonomyServices,
  servicesForTrade
};
