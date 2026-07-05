/**
 * QuickPost Ads — https://quickpostads.co.uk
 * Sister app: Elix Star Live (TikTok-style video)
 */
const SITE_URL = 'https://quickpostads.co.uk';
const SITE_CONTACT_EMAIL = 'info@QuickPostAds.co.uk';
const USER_EMAIL_STORAGE_KEY = 'quickpostAdsUserEmail';
const DASHBOARD_EMAIL_STORAGE_KEY = 'quickpostAdsDashboardEmail';

const ELIX_STAR_APP = {
  name: 'Elix Star Live',
  url: 'https://www.elixstarlive.co.uk',
  tagline: 'TikTok-style video app — watch, create & go live'
};

function isBlockedStoredEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e || !e.includes('@')) return true;
  if (e.includes('@elixstarlive.co.uk') || e.includes('@elixstar.live')) return true;
  return e.endsWith('@example.com') || e === 'test@test.com';
}

function getStoredUserEmail() {
  const legacy = localStorage.getItem('userEmail');
  const current = localStorage.getItem(USER_EMAIL_STORAGE_KEY);
  let email = current || legacy || '';

  if (isBlockedStoredEmail(email)) {
    localStorage.removeItem('userEmail');
    localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
    return '';
  }

  if (legacy && !current) {
    localStorage.setItem(USER_EMAIL_STORAGE_KEY, email);
    localStorage.removeItem('userEmail');
  }
  return email;
}

function setStoredUserEmail(email) {
  const trimmed = String(email || '').trim();
  if (isBlockedStoredEmail(trimmed)) return;
  localStorage.setItem(USER_EMAIL_STORAGE_KEY, trimmed);
}

function getStoredDashboardEmail() {
  const legacy = localStorage.getItem('dashboardEmail');
  const current = localStorage.getItem(DASHBOARD_EMAIL_STORAGE_KEY);
  let email = current || legacy || getStoredUserEmail();

  if (isBlockedStoredEmail(email)) {
    localStorage.removeItem('dashboardEmail');
    localStorage.removeItem(DASHBOARD_EMAIL_STORAGE_KEY);
    return '';
  }

  if (legacy && !current && email) {
    localStorage.setItem(DASHBOARD_EMAIL_STORAGE_KEY, email);
    localStorage.removeItem('dashboardEmail');
  }
  return email;
}

function setStoredDashboardEmail(email) {
  const trimmed = String(email || '').trim();
  if (isBlockedStoredEmail(trimmed)) return;
  localStorage.setItem(DASHBOARD_EMAIL_STORAGE_KEY, trimmed);
  setStoredUserEmail(trimmed);
}
