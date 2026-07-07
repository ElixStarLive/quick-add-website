/** PWA install + service worker registration */
(function () {
  var deferredPrompt = null;
  var banner = null;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  }

  function dismissBanner() {
    try { localStorage.setItem('pwa-install-dismissed', '1'); } catch (e) { /* ignore */ }
    if (banner) {
      banner.remove();
      banner = null;
    }
  }

  function createBanner() {
    if (banner || isStandalone()) return;
    try {
      if (localStorage.getItem('pwa-install-dismissed') === '1') return;
    } catch (e) { /* ignore */ }

    banner = document.createElement('div');
    banner.className = 'pwa-install-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Install app');

    var isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    var iosHint = isIos && !deferredPrompt
      ? '<p class="pwa-install-hint">Tap <strong>Share</strong> then <strong>Add to Home Screen</strong>.</p>'
      : '';

    banner.innerHTML =
      '<div class="pwa-install-inner">' +
        '<div class="pwa-install-copy">' +
          '<strong>Install QuickPostAds</strong>' +
          '<span>Jobs &amp; trades on your phone — works like an app.</span>' +
          iosHint +
        '</div>' +
        '<div class="pwa-install-actions">' +
          (deferredPrompt ? '<button type="button" class="btn btn-primary pwa-install-btn">Install</button>' : '') +
          '<button type="button" class="pwa-install-close" aria-label="Dismiss">×</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(banner);

    var installBtn = banner.querySelector('.pwa-install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', function () {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function () {
          deferredPrompt = null;
          dismissBanner();
        });
      });
    }

    banner.querySelector('.pwa-install-close').addEventListener('click', dismissBanner);
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    createBanner();
  });

  if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone()) {
    window.addEventListener('load', function () {
      setTimeout(createBanner, 2500);
    });
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () { /* offline unsupported */ });
    });
  }
})();
