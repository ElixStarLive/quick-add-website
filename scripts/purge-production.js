/**
 * Purge all demo/test listings from a running QuickPost Ads instance.
 * Usage: node scripts/purge-production.js [site-url]
 */
require('dotenv').config();

const siteUrl = (process.argv[2] || process.env.SITE_URL || 'https://www.quickpostads.co.uk').replace(/\/$/, '');
const adminKey = process.env.ADMIN_SECRET;

if (!adminKey) {
  console.error('ADMIN_SECRET missing from .env');
  process.exit(1);
}

async function main() {
  const res = await fetch(`${siteUrl}/api/admin/purge-all`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Purge failed:', res.status, data.error || data);
    process.exit(1);
  }
  console.log('Production cleaned:', data.message || 'ok');

  const jobs = await fetch(`${siteUrl}/api/jobs`).then((r) => r.json()).catch(() => ({ jobs: [] }));
  const ads = await fetch(`${siteUrl}/api/ads`).then((r) => r.json()).catch(() => ({ ads: [] }));
  console.log('Remaining jobs:', jobs.jobs?.length ?? 0);
  console.log('Remaining shop listings:', ads.ads?.length ?? 0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
