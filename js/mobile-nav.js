/** Mobile bottom nav + menu — phones only (desktop unchanged). */
(function () {
  const MQ = window.matchMedia('(max-width: 768px)');

  const TABS = [
    { href: 'index.html', label: 'Home', match: /^(index\.html)?$/, icon: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>' },
    { href: 'jobs.html', label: 'Jobs', match: /^jobs\.html$|^job-detail\.html$/, icon: '<path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>' },
    { href: 'post-job.html', label: 'Post', match: /^post-job\.html$/, icon: '<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>', primary: true },
    { href: 'categories.html', label: 'Shop', match: /^categories\.html$|^ads\.html$/, icon: '<path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>' },
    { href: '#menu', label: 'Menu', menu: true, icon: '<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>' }
  ];

  const MENU_LINKS = [
    { href: 'for-employers.html', label: 'For homeowners' },
    { href: 'roadmap.html', label: 'How it works' },
    { href: 'search.html', label: 'Search ads' },
    { href: 'post-ad.html', label: 'Sell an item' },
    { href: 'dashboard.html', label: 'Dashboard' },
    { href: 'contact.html', label: 'Contact' }
  ];

  let built = false;
  let overlay = null;

  function currentPage() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    return path;
  }

  function isActive(tab, page) {
    if (tab.menu) return false;
    if (tab.match instanceof RegExp) return tab.match.test(page);
    return tab.href === page;
  }

  function closeMenu() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('mobile-menu-open');
  }

  function openMenu(e) {
    e.preventDefault();
    overlay.classList.add('is-open');
    document.body.classList.add('mobile-menu-open');
  }

  function build() {
    if (built || !MQ.matches) return;
    built = true;

    const page = currentPage();
    const nav = document.createElement('nav');
    nav.className = 'mobile-bottom-nav';
    nav.setAttribute('aria-label', 'Mobile navigation');

    TABS.forEach((tab) => {
      const a = document.createElement('a');
      a.className = 'mobile-nav-item' + (tab.primary ? ' mobile-nav-item--primary' : '');
      if (isActive(tab, page)) a.classList.add('is-active');
      a.href = tab.menu ? '#menu' : tab.href;
      a.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' + tab.icon + '</svg>' +
        '<span>' + tab.label + '</span>';
      if (tab.menu) a.addEventListener('click', openMenu);
      nav.appendChild(a);
    });

    overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    overlay.innerHTML =
      '<div class="mobile-menu-panel" role="dialog" aria-label="Site menu">' +
      '<div class="mobile-menu-head">' +
      '<strong>Menu</strong>' +
      '<button type="button" class="mobile-menu-close" aria-label="Close menu">&times;</button>' +
      '</div>' +
      '<div class="mobile-menu-links">' +
      MENU_LINKS.map((l) => '<a href="' + l.href + '">' + l.label + '</a>').join('') +
      '</div></div>';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeMenu();
    });
    overlay.querySelector('.mobile-menu-close').addEventListener('click', closeMenu);
    overlay.querySelectorAll('.mobile-menu-links a').forEach((a) => {
      a.addEventListener('click', closeMenu);
    });

    document.body.appendChild(nav);
    document.body.appendChild(overlay);
    document.body.classList.add('has-mobile-nav');
  }

  function teardown() {
    if (!built) return;
    document.querySelector('.mobile-bottom-nav')?.remove();
    overlay?.remove();
    overlay = null;
    built = false;
    document.body.classList.remove('has-mobile-nav', 'mobile-menu-open');
  }

  function init() {
    if (MQ.matches) build();
    else teardown();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  MQ.addEventListener('change', init);
})();
