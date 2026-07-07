/** Update site navigation across all public HTML pages — skips index.html */
const fs = require('fs');
const path = require('path');
const { renderSiteNav } = require('../lib/site-nav');

const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['admin.html', '_live-home.html', 'index.html']);

const ACTIVE_BY_FILE = {
  'jobs.html': 'jobs',
  'job-detail.html': 'jobs',
  'trades.html': 'trades',
  'for-contractors.html': 'contractors',
  'for-employers.html': 'contractors',
  'pricing.html': 'pricing',
  'roadmap.html': 'how',
  'contact.html': 'contact',
  'post-job.html': 'jobs',
  'dashboard.html': 'login',
  'contractor-register.html': 'login',
  'payment-unlock.html': 'jobs',
  'unlock-success.html': 'jobs',
  'post-ad.html': 'jobs',
  'search.html': 'jobs',
  'categories.html': 'jobs'
};

const NAV_RE = /<nav class="nav-links">[\s\S]*?<\/nav>/;

function updateFile(fileName) {
  if (SKIP.has(fileName)) return false;
  const filePath = path.join(ROOT, fileName);
  if (!fs.existsSync(filePath)) return false;
  let html = fs.readFileSync(filePath, 'utf8');
  if (!NAV_RE.test(html)) return false;
  const active = ACTIVE_BY_FILE[fileName] || '';
  html = html.replace(NAV_RE, renderSiteNav(active));
  fs.writeFileSync(filePath, html, 'utf8');
  return true;
}

const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
let count = 0;
files.forEach((f) => {
  if (updateFile(f)) count += 1;
});
console.log('Updated navigation in ' + count + ' HTML files (index.html skipped)');
