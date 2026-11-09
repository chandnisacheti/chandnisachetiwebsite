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

// ---- Design round 1: live hero signal, card tilt, reading progress ----
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero signal: a calm alpha rhythm that turns into faster beta when you move.
  var cv = document.querySelector('[data-sig]');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var band = document.querySelector('[data-sig-band]'), state = document.querySelector('[data-sig-state]');
    var W = 0, H = 0, t = 0, energy = 0, target = 0, lastX = null, lastY = null, shown = '';
    var size = function () { var r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); window.addEventListener('resize', size);
    var kick = function (x, y) { if (lastX !== null) target = Math.min(1, target + Math.hypot(x - lastX, y - lastY) / 260); lastX = x; lastY = y; };
    window.addEventListener('pointermove', function (e) { kick(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener('scroll', function () { kick(0, window.scrollY); }, { passive: true });
    var draw = function () {
      target *= 0.96; energy += (target - energy) * 0.08;
      var f = 10 + energy * 16;                 // 10 Hz alpha -> ~26 Hz beta
      var amp = H * (0.16 + energy * 0.16);
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
      var g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'rgba(228,223,243,0)'); g.addColorStop(.15, 'rgba(228,223,243,.85)'); g.addColorStop(.85, 'rgba(228,223,243,.85)'); g.addColorStop(1, 'rgba(228,223,243,0)');
      ctx.strokeStyle = g; ctx.beginPath();
      for (var x = 0; x <= W; x += 2) {
        var u = x / W * 6;                        // ~6 "seconds" across the screen
        var spindle = 0.55 + 0.45 * Math.sin(u * 1.3 - t * 0.7);
        var y = H / 2 + amp * spindle * Math.sin(2 * Math.PI * (f / 10) * (u * 1.6) - t * 3)
              + amp * 0.25 * Math.sin(u * 9.1 + t * 1.7) * energy
              + amp * 0.12 * Math.sin(u * 3.3 - t);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      var label = energy > 0.35 ? 'β ' + Math.round(f) + ' Hz' : 'α ' + Math.round(f) + ' Hz';
      var st = energy > 0.35 ? 'focused' : 'calm';
      if (label + st !== shown) { band.textContent = label; state.textContent = st; shown = label + st; }
      t += 0.016;
      if (!reduce) requestAnimationFrame(draw);
    };
    draw();
  }

  // Cards lean slightly toward the cursor (mouse only).
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    Array.prototype.forEach.call(document.querySelectorAll('.st-card, .bi-card, .po-next, .nm-card'), function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', px * 100 + '%'); c.style.setProperty('--my', py * 100 + '%');
        c.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * 4) + 'deg) rotateY(' + ((px - 0.5) * 5) + 'deg) translateY(-2px)';
      });
      c.addEventListener('pointerleave', function () { c.style.transform = ''; });
    });
  }

  // Reading progress bar on blog posts.
  if (document.body.classList.contains('page-post')) {
    var bar = document.createElement('div'); bar.className = 'read-progress'; document.body.appendChild(bar);
    var upd = function () { var h = document.documentElement.scrollHeight - window.innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')'; };
    window.addEventListener('scroll', upd, { passive: true }); upd();
  }
})();

// ---- Design round 2: hero rise, word-by-word statements, film photos, cursor, magnets ----
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var root = document.documentElement;
  root.classList.add('js-motion');

  // Hero lines rise from a mask.
  Array.prototype.forEach.call(document.querySelectorAll('.hero-h > span'), function (line) {
    var wrap = document.createElement('span'); wrap.className = 'rise';
    while (line.firstChild) wrap.appendChild(line.firstChild);
    line.appendChild(wrap);
  });

  // Statements light up word by word, tied to scroll position.
  var statements = Array.prototype.slice.call(document.querySelectorAll('.mission, .work-intro'));
  statements.forEach(function (el) {
    el.classList.add('wr');
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  });
  var lightUp = function () {
    var vh = window.innerHeight;
    statements.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var p = (vh * 0.85 - r.top) / (vh * 0.5);         // 0 when entering, 1 when it reaches ~35% from top
      var words = el.querySelectorAll('.w'), n = Math.round(Math.max(0, Math.min(1, p)) * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
    });
  };
  window.addEventListener('scroll', lightUp, { passive: true }); window.addEventListener('resize', lightUp); lightUp();

  // Photos develop in as they enter the viewport.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('dev'); io.unobserve(e.target); } }); }, { threshold: 0.2 });
    Array.prototype.forEach.call(document.querySelectorAll('.portrait, .t-photo:not(.t-diagram)'), function (f) { io.observe(f); });
  } else {
    Array.prototype.forEach.call(document.querySelectorAll('.portrait, .t-photo'), function (f) { f.classList.add('dev'); });
  }

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  // Custom cursor.
  var ring = document.createElement('div'); ring.className = 'cur'; ring.innerHTML = '<span class="cur-label"></span>';
  var dot = document.createElement('div'); dot.className = 'cur-dot';
  document.body.appendChild(ring); document.body.appendChild(dot);
  var label = ring.firstChild, mx = -100, my = -100, rx = -100, ry = -100;
  window.addEventListener('pointermove', function (e) {
    mx = e.clientX; my = e.clientY; dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
    root.classList.add('has-cur');
  }, { passive: true });
  document.addEventListener('mouseleave', function () { root.classList.remove('has-cur'); });
  (function loop() { rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18; ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)'; requestAnimationFrame(loop); })();
  var hoverText = function (el) {
    if (el.closest('.st-card, .bi-card, .po-next')) return 'Read';
    if (el.closest('.nm-play')) return 'Play';
    return '';
  };
  document.addEventListener('pointerover', function (e) {
    var t = e.target; var txt = hoverText(t);
    var interactive = t.closest('a, button');
    ring.classList.toggle('big', !!interactive && !!txt);
    label.textContent = txt;
    ring.style.borderColor = interactive && !txt ? 'rgba(228,223,243,1)' : '';
  });

  // Magnetic buttons pull gently toward the cursor.
  Array.prototype.forEach.call(document.querySelectorAll('.btn, .nav-cta, .nm-play'), function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      b.style.transform = 'translate(' + x * 0.25 + 'px,' + y * 0.35 + 'px)';
    });
    b.addEventListener('pointerleave', function () { b.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)'; b.style.transform = ''; setTimeout(function () { b.style.transition = ''; }, 500); });
  });
})();
