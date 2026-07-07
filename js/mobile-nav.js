/** Mobile navigation — same links as desktop, slide-in panel */
(function () {
  function initMobileNav() {
    document.querySelectorAll('.site-header .header-inner').forEach(function (headerInner) {
      if (headerInner.querySelector('.nav-toggle')) return;

      var nav = headerInner.querySelector('.nav-links');
      var header = headerInner.closest('.site-header');
      if (!nav || !header) return;

      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nav-toggle';
      toggle.setAttribute('aria-label', 'Open menu');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML =
        '<span class="nav-toggle-bar" aria-hidden="true"></span>' +
        '<span class="nav-toggle-bar" aria-hidden="true"></span>' +
        '<span class="nav-toggle-bar" aria-hidden="true"></span>';

      var overlay = document.createElement('div');
      overlay.className = 'nav-overlay';
      overlay.setAttribute('aria-hidden', 'true');

      headerInner.appendChild(toggle);
      header.appendChild(overlay);

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
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav();
  }
})();
