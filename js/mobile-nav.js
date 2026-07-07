/** Mobile navigation — same links as desktop, slide-in panel */
(function () {
  function wireMobileNav(headerInner) {
    var nav = headerInner.querySelector('.nav-links');
    var header = headerInner.closest('.site-header');
    var toggle = headerInner.querySelector('.nav-toggle');
    if (!nav || !header || !toggle) return;

    var overlay = header.querySelector('.nav-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'nav-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      header.appendChild(overlay);
    }

    if (toggle.dataset.navWired === '1') return;
    toggle.dataset.navWired = '1';

    function closeNav() {
      header.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('nav-menu-open');
    }

    function openNav() {
      header.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('nav-menu-open');
    }

    toggle.addEventListener('click', function () {
      if (header.classList.contains('nav-open')) closeNav();
      else openNav();
    });

    overlay.addEventListener('click', closeNav);

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 960) closeNav();
    });
  }

  function initMobileNav() {
    document.querySelectorAll('.site-header .header-inner').forEach(function (headerInner) {
      var toggle = headerInner.querySelector('.nav-toggle');
      if (!toggle) {
        toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'nav-toggle';
        toggle.setAttribute('aria-label', 'Open menu');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML =
          '<span class="nav-toggle-bar" aria-hidden="true"></span>' +
          '<span class="nav-toggle-bar" aria-hidden="true"></span>' +
          '<span class="nav-toggle-bar" aria-hidden="true"></span>';
        headerInner.appendChild(toggle);
      }
      wireMobileNav(headerInner);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav();
  }
})();
