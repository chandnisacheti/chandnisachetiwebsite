(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  Array.prototype.forEach.call(document.querySelectorAll('.link-ph'), function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  var bar = document.querySelector('.bar');
  function onScroll() { bar.classList.toggle('is-scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- Background glow follows the cursor and shifts hue ----
  var W = window.innerWidth, H = window.innerHeight;
  var target = { x: W * 0.6, y: H * 0.3 }, a = { x: target.x, y: target.y }, b = { x: W * 0.2, y: H * 0.75 };
  var hue = 75, hueTarget = 75;
  window.addEventListener('resize', function () { W = window.innerWidth; H = window.innerHeight; });
  window.addEventListener('pointermove', function (e) {
    target.x = e.clientX; target.y = e.clientY;
    // olive-gold on the left through coral to rose-violet on the right; lower = warmer
    hueTarget = 75 - (e.clientX / W) * 140 + (e.clientY / H) * 30;
  }, { passive: true });

  function tick(t) {
    if (!reduce) {
      // when the cursor is still, drift slowly so the light keeps breathing
      var driftX = Math.sin(t / 5200) * W * 0.04, driftY = Math.cos(t / 6100) * H * 0.04;
      a.x += (target.x + driftX - a.x) * 0.06; a.y += (target.y + driftY - a.y) * 0.06;
      b.x += (W - target.x - b.x) * 0.02; b.y += (H - target.y * 0.5 - b.y) * 0.02;
      hue += (hueTarget - hue) * 0.05;
      root.style.setProperty('--gx', a.x.toFixed(1) + 'px');
      root.style.setProperty('--gy', a.y.toFixed(1) + 'px');
      root.style.setProperty('--hx', b.x.toFixed(1) + 'px');
      root.style.setProperty('--hy', b.y.toFixed(1) + 'px');
      
      requestAnimationFrame(tick);
    }
  }
  if (!reduce) requestAnimationFrame(tick);

  // ---- Spotlight inside tiles and circles ----
  Array.prototype.forEach.call(document.querySelectorAll('.tile, .circle'), function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // ---- Copy email ----
  var toast = document.querySelector('[data-toast]');
  var timer;
  function say(msg) {
    toast.textContent = msg; toast.classList.add('is-on');
    clearTimeout(timer); timer = setTimeout(function () { toast.classList.remove('is-on'); }, 2200);
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    var label = btn.querySelector('[data-copy-label]');
    var email = btn.parentNode.querySelector('[data-email]');
    btn.addEventListener('click', function () {
      var text = email.textContent.trim();
      function done() { label.textContent = 'Copied'; say('Email copied'); setTimeout(function () { label.textContent = 'Copy'; }, 2000); }
      function fallback() {
        var r = document.createRange(); r.selectNodeContents(email);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        say('Email selected. Press Ctrl+C or ⌘C to copy.');
      }
      try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
    });
  });
})();
