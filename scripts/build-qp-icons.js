/* Build qp-icons-data.js from lucide-static SVGs (ISC licence) */
const fs = require('fs');
const path = require('path');

const LUCIDE_DIR = path.join(__dirname, '..', 'node_modules', 'lucide-static', 'icons');
const OUT = path.join(__dirname, '..', 'js', 'qp-icons-data.js');

const MAP = {
  car: 'car-front',
  oil: 'droplet',
  mot: 'clipboard-check',
  mechanic: 'wrench',
  brake: 'disc',
  tyre: 'circle-dashed',
  battery: 'battery',
  diagnostic: 'scan-line',
  keys: 'key-round',
  aircon: 'air-vent',
  puncture: 'circle-x',
  cleaning: 'brush-cleaning',
  'deep-clean': 'sparkles',
  carpet: 'layout-panel-top',
  oven: 'microwave',
  'window-clean': 'panel-top',
  'pressure-wash': 'waves',
  gutter: 'grip-horizontal',
  pest: 'bug',
  tap: 'soap-dispenser-droplet',
  pipe: 'pipette',
  drain: 'circle-off',
  toilet: 'bath',
  boiler: 'heater',
  radiator: 'columns-3',
  shower: 'shower-head',
  bathroom: 'bath',
  kitchen: 'cooking-pot',
  electrical: 'zap',
  rewire: 'cable',
  socket: 'plug',
  light: 'lightbulb',
  'ev-charger': 'plug-zap',
  cctv: 'cctv',
  smoke: 'alarm-smoke',
  building: 'building-2',
  extension: 'blocks',
  loft: 'home',
  brick: 'brick-wall',
  plaster: 'paint-roller',
  damp: 'droplets',
  garage: 'warehouse',
  steel: 'construction',
  insulation: 'layers',
  demolition: 'hard-hat',
  renovation: 'hammer',
  roof: 'home',
  'flat-roof': 'square',
  chimney: 'factory',
  fascia: 'minus',
  upvc: 'panel-top',
  window: 'app-window',
  door: 'door-open',
  conservatory: 'glass-water',
  sash: 'layout-template',
  paint: 'paintbrush',
  wallpaper: 'wallpaper',
  ceiling: 'align-vertical-space-around',
  floor: 'grid-3x3',
  tile: 'grid-2x2',
  'carpet-fit': 'layout-panel-top',
  skirting: 'separator-horizontal',
  wardrobe: 'archive',
  shelving: 'library',
  stairs: 'move-vertical',
  carpenter: 'hammer',
  garden: 'flower-2',
  lawn: 'sprout',
  hedge: 'shrub',
  tree: 'trees',
  fence: 'fence',
  deck: 'columns-2',
  patio: 'square-dashed-bottom',
  paving: 'grid-2x2',
  clearance: 'trash-2',
  handyman: 'wrench',
  flatpack: 'package',
  tv: 'tv',
  blinds: 'blinds',
  furniture: 'sofa',
  mirror: 'square',
  curtain: 'columns-2',
  washer: 'washing-machine',
  dishwasher: 'waves-ladder',
  fridge: 'refrigerator',
  cooker: 'chef-hat',
  dryer: 'wind',
  hob: 'flame',
  hood: 'fan',
  removal: 'truck',
  van: 'van',
  waste: 'trash-2',
  briefcase: 'briefcase',
  house: 'house',
  monitor: 'monitor',
  phone: 'smartphone',
  tools: 'hammer',
  sofa: 'sofa',
  shirt: 'shirt',
  paw: 'paw-print',
  community: 'users',
  grid: 'layout-grid',
  shop: 'shopping-bag',
  sell: 'badge-pound-sterling',
  sports: 'dumbbell',
  baby: 'baby',
  jobs: 'briefcase',
  services: 'wrench',
  property: 'house',
  post: 'calendar-plus',
  other: 'more-horizontal',
  default: 'circle-help'
};

function innerSvg(name) {
  const file = path.join(LUCIDE_DIR, name + '.svg');
  if (!fs.existsSync(file)) {
    console.warn('Missing lucide icon:', name);
    return null;
  }
  const raw = fs.readFileSync(file, 'utf8');
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg[\s\S]*?>/, '')
    .replace(/<\/svg>\s*/, '')
    .trim();
}

const icons = {};
for (const [key, lucide] of Object.entries(MAP)) {
  const inner = innerSvg(lucide);
  if (inner) icons[key] = inner;
}

const js =
  '/* Auto-generated from lucide-static – do not edit by hand */\n' +
  'window.QP_ICON_INNER = ' + JSON.stringify(icons, null, 2) + ';\n';

fs.writeFileSync(OUT, js, 'utf8');
console.log('Wrote', Object.keys(icons).length, 'icons to', OUT);
