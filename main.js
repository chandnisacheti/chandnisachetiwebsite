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

// ---- Phone menu, swipe dots, scroll reveal, touch glow ----
(function () {
  'use strict';
  var body = document.body;
  var btn = document.querySelector('[data-menu]');
  if (btn) {
    var setOpen = function (open) {
      body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.querySelector('.menu-label').textContent = open ? 'Close' : 'Menu';
    };
    btn.addEventListener('click', function () { setOpen(!body.classList.contains('menu-open')); });
    Array.prototype.forEach.call(document.querySelectorAll('#site-nav a'), function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    window.matchMedia('(min-width: 701px)').addEventListener('change', function (m) { if (m.matches) setOpen(false); });
  }

  // Dots under each swipeable row
  Array.prototype.forEach.call(document.querySelectorAll('.board'), function (board) {
    var tiles = board.querySelectorAll(':scope > .tile');
    if (tiles.length < 2) return;
    var hint = document.createElement('div');
    hint.className = 'swipe-hint'; hint.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < tiles.length; i++) hint.appendChild(document.createElement('span'));
    board.parentNode.insertBefore(hint, board.nextSibling);
    var dots = hint.children;
    function update() {
      var w = tiles[0].getBoundingClientRect().width + 12;
      var idx = Math.round(board.scrollLeft / w);
      if (board.scrollLeft + board.clientWidth >= board.scrollWidth - 4) idx = tiles.length - 1;
      for (var j = 0; j < dots.length; j++) dots[j].classList.toggle('on', j === idx);
    }
    board.addEventListener('scroll', update, { passive: true });
    update();
  });

  // Reveal on scroll
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    var els = document.querySelectorAll('.tile, .circle, .pillar-head, .work-intro, .block, .portrait');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    Array.prototype.forEach.call(els, function (el) {
      var r = el.getBoundingClientRect();
      if (r.top > window.innerHeight) { el.classList.add('reveal'); io.observe(el); }
    });
  }

  // On touch screens there is no cursor: let the glow drift with scrolling
  if (window.matchMedia('(hover: none)').matches) {
    window.addEventListener('scroll', function () {
      var y = window.scrollY, W = window.innerWidth, H = window.innerHeight;
      var ev = new PointerEvent('pointermove', { clientX: W * (0.5 + 0.35 * Math.sin(y / 700)), clientY: H * (0.35 + 0.2 * Math.cos(y / 900)) });
      window.dispatchEvent(ev);
    }, { passive: true });
  }
})();

/* Media strip: keeps drifting on its own; arrows (and swipe/drag) jump back and forth */
(function () {
  var media = document.querySelector('.media');
  var strip = media && media.querySelector('.strip');
  if (!strip) return;
  var wrap = document.createElement('div');
  wrap.className = 'media-wrap';
  media.parentNode.insertBefore(wrap, media);
  wrap.appendChild(media);
  function btn(cls, label, ch) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'media-btn ' + cls; b.setAttribute('aria-label', label); b.textContent = ch;
    wrap.appendChild(b); return b;
  }
  var prev = btn('prev', 'Previous photos', '←');
  var next = btn('next', 'Next photos', '→');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var paused = false, holdUntil = 0, pos = 0, last = 0;
  function half() { var gap = parseFloat(getComputedStyle(strip).columnGap) || 0; return strip.scrollWidth / 2 + gap / 2; }
  function wrapPos() { var h = half(); if (media.scrollLeft >= h) media.scrollLeft -= h; else if (media.scrollLeft <= 0) media.scrollLeft += h; }
  function step() {
    var item = strip.querySelector('li');
    return item ? item.getBoundingClientRect().width + 14 : 300;
  }
  function jump(dir) {
    holdUntil = performance.now() + 2500;
    if (dir < 0 && media.scrollLeft < step()) media.scrollLeft += half();
    media.scrollBy({ left: dir * step(), behavior: reduce ? 'auto' : 'smooth' });
  }
  prev.addEventListener('click', function () { jump(-1); });
  next.addEventListener('click', function () { jump(1); });
  media.addEventListener('mouseenter', function () { paused = true; });
  media.addEventListener('mouseleave', function () { paused = false; });
  ['touchstart', 'wheel', 'pointerdown'].forEach(function (ev) {
    media.addEventListener(ev, function () { holdUntil = performance.now() + 2500; }, { passive: true });
  });
  media.addEventListener('scroll', function () { if (performance.now() < holdUntil || paused) { wrapPos(); pos = media.scrollLeft; } }, { passive: true });
  if (reduce) return;
  function tick(t) {
    var dt = last ? Math.min(t - last, 50) : 0; last = t;
    if (!paused && t > holdUntil && !document.hidden) {
      pos += dt * 0.03;              /* ~30px per second */
      media.scrollLeft = pos;
      if (media.scrollLeft >= half()) { pos -= half(); media.scrollLeft = pos; }
    } else { pos = media.scrollLeft; }
    requestAnimationFrame(tick);
  }
  media.scrollLeft = 1; pos = 1;
  requestAnimationFrame(tick);
})();

// ---- Live "This morning on Neuro Morning" player ----
(function () {
  'use strict';
  var root = document.querySelector('[data-nm]');
  if (!root || !window.fetch || !window.DOMParser) return;
  var FEED = 'https://chandnisacheti.github.io/daily-neuro-podcast/feed.xml';
  fetch(FEED, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (xml) {
    var doc = new DOMParser().parseFromString(xml, 'application/xml');
    var item = doc.querySelector('item');
    if (!item) return;
    var title = (item.querySelector('title') || {}).textContent || '';
    title = title.replace(/^Neuro Morning:\s*/i, '');
    var enc = item.querySelector('enclosure');
    if (!enc) return;
    var date = new Date((item.querySelector('pubDate') || {}).textContent || '');
    var dur = item.getElementsByTagNameNS('*', 'duration')[0];
    var secs = dur ? parseInt(dur.textContent, 10) : 0;
    var when = isNaN(date) ? '' : date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    root.querySelector('[data-nm-title]').textContent = title;
    root.querySelector('[data-nm-meta]').textContent = when + (secs ? ' · ' + Math.round(secs / 60) + ' min' : '');
    var audio = root.querySelector('[data-nm-audio]');
    audio.src = enc.getAttribute('url');
    var play = root.querySelector('[data-nm-play]');
    var bar = root.querySelector('[data-nm-progress]');
    play.addEventListener('click', function () { if (audio.paused) audio.play(); else audio.pause(); });
    audio.addEventListener('play', function () { root.classList.add('is-playing'); play.setAttribute('aria-label', 'Pause'); });
    audio.addEventListener('pause', function () { root.classList.remove('is-playing'); play.setAttribute('aria-label', 'Play this morning’s episode'); });
    audio.addEventListener('timeupdate', function () { if (audio.duration) bar.style.width = (audio.currentTime / audio.duration * 100) + '%'; });
    root.hidden = false;
  }).catch(function () { /* stay hidden */ });
})();
