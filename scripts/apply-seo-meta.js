/** One-off helper: inject SEO meta into all public HTML pages */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.quickpostads.co.uk';
const CSS = 'css/style.css?v=66';

const PAGES = {
  'index.html': {
    title: 'QuickPost Ads | Free UK Jobs & Classified Ads',
    description:
      'QuickPost Ads is a free UK marketplace to post local jobs, find trade work, and sell items. Homeowners post free; contractors unlock leads.',
    canonical: `${SITE}/`,
    robots: 'index,follow',
    extra: `  <meta name="keywords" content="local jobs, job postings, free classifieds, UK trades, mobile mechanic, post job free">
`,
  },
  'for-employers.html': {
    title: 'For Homeowners – Post a Job Free | QuickPost Ads',
    description:
      'Post plumbing, electrician, cleaning and mechanic jobs free in the UK. Your contact stays hidden until a contractor pays to unlock it.',
    canonical: `${SITE}/for-employers.html`,
  },
  'jobs.html': {
    title: 'Find Local Jobs – Trades & Mechanics | QuickPost Ads',
    description:
      'Browse local trade, mechanic and cleaning jobs across the UK. Contractors search free homeowner listings on QuickPost Ads.',
    canonical: `${SITE}/jobs.html`,
  },
  'post-job.html': {
    title: 'Post a Job Free – Trades & Mechanics | QuickPost Ads',
    description:
      'Post a trade, building, mechanic or cleaning job free. Your job goes live instantly; contact details unlock after contractor payment.',
    canonical: `${SITE}/post-job.html`,
  },
  'post-ad.html': {
    title: 'Sell an Item – £1 Listings | QuickPost Ads',
    description:
      'Sell items online in the UK for £1 per listing. Add photos and reach local buyers in the QuickPost Ads shop.',
    canonical: `${SITE}/post-ad.html`,
  },
  'search.html': {
    title: 'Shop – Search Items for Sale | QuickPost Ads',
    description:
      'Search items for sale on QuickPost Ads – cars, furniture, electronics, phones and more from sellers across the UK.',
    canonical: `${SITE}/search.html`,
  },
  'categories.html': {
    title: 'Shop Categories – Buy & Sell | QuickPost Ads',
    description:
      'Browse shop categories on QuickPost Ads – buy and sell cars, furniture, electronics, tools and local items in the UK.',
    canonical: `${SITE}/categories.html`,
  },
  'contact.html': {
    title: 'Contact Us | QuickPost Ads',
    description:
      'Contact QuickPost Ads for help posting jobs, selling items, reporting ads or business enquiries. We reply within 24 hours.',
    canonical: `${SITE}/contact.html`,
  },
  'roadmap.html': {
    title: 'How It Works – Growth Roadmap | QuickPost Ads',
    description:
      'How QuickPost Ads works: homeowners post jobs free, contractors pay to unlock leads, and sellers list shop items for £1.',
    canonical: `${SITE}/roadmap.html`,
  },
  'terms-of-service.html': {
    title: 'Terms of Service | QuickPost Ads',
    description:
      'Terms of Service for QuickPost Ads – the UK marketplace for local jobs, trade services and classified listings.',
    canonical: `${SITE}/terms-of-service.html`,
  },
  'privacy-policy.html': {
    title: 'Privacy Policy | QuickPost Ads',
    description:
      'Privacy Policy for QuickPost Ads – how we collect and use your data when you post jobs or classified ads in the UK.',
    canonical: `${SITE}/privacy-policy.html`,
  },
  'content-rules.html': {
    title: 'Content Rules | QuickPost Ads',
    description:
      'Content rules for QuickPost Ads – permitted listings, prohibited content and community guidelines for UK users.',
    canonical: `${SITE}/content-rules.html`,
  },
  'job-detail.html': {
    title: 'Job Details | QuickPost Ads',
    description:
      'View a local trade, mechanic or service job on QuickPost Ads. Contractors can unlock full details and homeowner contact.',
    canonical: `${SITE}/job-detail.html`,
  },
  'dashboard.html': {
    title: 'Your Dashboard | QuickPost Ads',
    description:
      'Manage your QuickPost Ads account – view posted jobs, shop listings and account activity in one place.',
    canonical: `${SITE}/dashboard.html`,
  },
  'payment-unlock.html': {
    title: 'Unlock Job Contact | QuickPost Ads',
    description:
      'Pay to unlock a homeowner job on QuickPost Ads – view full details, photos and contact information to submit your quote.',
    canonical: `${SITE}/payment-unlock.html`,
  },
  'unlock-success.html': {
    title: 'Contact Unlocked | QuickPost Ads',
    description:
      'Payment successful – you have unlocked the job contact on QuickPost Ads and can now reach the homeowner directly.',
    canonical: `${SITE}/unlock-success.html`,
  },
  'admin.html': {
    title: 'Admin | QuickPost Ads',
    description: 'QuickPost Ads administration.',
    canonical: `${SITE}/admin.html`,
    robots: 'noindex,nofollow',
  },
};

for (const [file, meta] of Object.entries(PAGES)) {
  const filePath = path.join(ROOT, file);
  if (!fs.existsSync(filePath)) continue;
  let html = fs.readFileSync(filePath, 'utf8');

  html = html.replace(/<html lang="en">/g, '<html lang="en-GB">');
  html = html.replace(/href="css\/style\.css\?v=\d+"/g, `href="${CSS}"`);

  const robots = meta.robots || 'index,follow';
  const extra = meta.extra || '';
  const headBlock = `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="${robots}">
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}">
  <link rel="canonical" href="${meta.canonical}">
${extra}  <link rel="stylesheet" href="${CSS}">`;

  html = html.replace(
    /<meta charset="UTF-8">[\s\S]*?<link rel="stylesheet" href="css\/style\.css\?v=\d+">/,
    headBlock
  );

  // index.html may have OG tags after stylesheet — preserve them
  if (file === 'index.html' && !html.includes('og:type')) {
    const ogBlock = `
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE}/">
  <meta property="og:title" content="${meta.title}">
  <meta property="og:description" content="${meta.description}">
  <meta property="og:image" content="${SITE}/images/hero-trades.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${meta.title}">
  <meta name="twitter:description" content="${meta.description}">
  <meta name="twitter:image" content="${SITE}/images/hero-trades.jpg">`;
    html = html.replace(`<link rel="stylesheet" href="${CSS}">`, `<link rel="stylesheet" href="${CSS}">${ogBlock}`);
  }

  fs.writeFileSync(filePath, html);
  console.log('Updated', file);
}
