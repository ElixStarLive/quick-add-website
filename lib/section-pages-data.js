const MARKETPLACE_HUB = {
  slug: 'marketplace',
  label: 'Marketplace',
  title: 'Marketplace – Buy & Sell Items | QuickPost Ads',
  description: 'Buy and sell furniture, electronics, phones, tools and more in the UK. List items for £1 on QuickPost Ads.',
  intro: 'General classifieds — furniture, electronics, fashion and more. Separate from jobs and trades.'
};

const MARKETPLACE_CATEGORIES = {
  furniture: {
    label: 'Furniture',
    emoji: '🛋️',
    description: 'Sofas, beds, tables and home furniture from local sellers.',
    searchHref: '/search.html?category=furniture'
  },
  phones: {
    label: 'Phones',
    emoji: '📱',
    description: 'Mobile phones and tablets — new and used.',
    searchHref: '/search.html?category=phones'
  },
  electronics: {
    label: 'Electronics',
    emoji: '💻',
    description: 'TVs, laptops, gaming and home electronics.',
    searchHref: '/search.html?category=electronics'
  },
  tools: {
    label: 'Tools',
    emoji: '🔧',
    description: 'Power tools, hand tools and DIY equipment.',
    searchHref: '/search.html?category=tools'
  },
  garden: {
    label: 'Garden',
    emoji: '🌿',
    description: 'Garden furniture, plants, BBQs and outdoor gear.',
    searchHref: '/search.html?category=garden'
  },
  fashion: {
    label: 'Fashion',
    emoji: '👗',
    description: 'Clothing, shoes and accessories.',
    searchHref: '/search.html?category=clothing'
  },
  'baby-items': {
    label: 'Baby Items',
    emoji: '🍼',
    description: 'Pushchairs, cots, toys and baby essentials.',
    searchHref: '/search.html?category=baby'
  },
  pets: {
    label: 'Pets',
    emoji: '🐾',
    description: 'Pet supplies and accessories. Live animal sales must follow our content rules.',
    searchHref: '/search.html?category=other&q=pet'
  },
  'free-items': {
    label: 'Free Items',
    emoji: '🎁',
    description: 'Items being given away free — collection only.',
    searchHref: '/search.html?q=free'
  }
};

function getMarketplaceCategory(slug) {
  return MARKETPLACE_CATEGORIES[slug] ? { slug, ...MARKETPLACE_CATEGORIES[slug] } : null;
}

module.exports = {
  MARKETPLACE_HUB,
  MARKETPLACE_CATEGORIES,
  getMarketplaceCategory
};
