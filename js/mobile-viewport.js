/** Fit full desktop layout (1200px) onto phone screens — iPhone 14 Pro Max etc. */
(function () {
  var w = Math.min(window.innerWidth || 430, screen.width || 430);
  if (w > 960) return;
  var scale = (w / 1200).toFixed(4);
  var meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    meta.setAttribute('content', 'width=1200, initial-scale=' + scale + ', viewport-fit=cover');
  }
  document.documentElement.classList.add('mobile-fit');

  window.addEventListener('orientationchange', function () {
    setTimeout(function () {
      var nw = Math.min(window.innerWidth, screen.width);
      var ns = (nw / 1200).toFixed(4);
      if (meta) meta.setAttribute('content', 'width=1200, initial-scale=' + ns + ', viewport-fit=cover');
    }, 300);
  });
})();
