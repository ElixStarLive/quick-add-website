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

(function loadMobileNav() {
  if (document.querySelector('script[data-mobile-nav]')) return;
  const s = document.createElement('script');
  s.src = 'js/mobile-nav.js';
  s.dataset.mobileNav = '1';
  document.head.appendChild(s);
})();

(function compactTopBarForMobile() {
  const MQ = window.matchMedia('(max-width: 768px)');
  const saved = new Map();

  function walkText(node, fn) {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) fn(child);
      else if (child.nodeType === Node.ELEMENT_NODE) walkText(child, fn);
    });
  }

  function apply() {
    document.querySelectorAll('.top-bar-contact span').forEach((span, i) => {
      if (!saved.has(span)) saved.set(span, span.innerHTML);
      span.innerHTML = saved.get(span);
      if (!MQ.matches) return;

      walkText(span, (textNode) => {
        let t = textNode.textContent;
        t = t.replace('23 Calderon Road, Leyton, London E11 4ET', 'Leyton, London E11 4ET');
        t = t.replace('Phone: ', '').replace('Email: ', '');
        textNode.textContent = t;
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
  MQ.addEventListener('change', apply);
})();
