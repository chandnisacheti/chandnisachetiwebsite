// Opt-in hand control for the shader background. MediaPipe hand tracking runs
// entirely in the browser; camera frames never leave the visitor's device.
import { FilesetResolver, HandLandmarker } from './vendor/mediapipe/vision_bundle.mjs';

let landmarker, stream, video, panel, dots, raf = 0, on = false;
const base = new URL('./vendor/mediapipe/', import.meta.url).href;

async function start(btn) {
  btn.querySelector('.hand-label').textContent = 'Loading…';
  if (!landmarker) {
    const fileset = await FilesetResolver.forVisionTasks(base + 'wasm');
    let model = null;
    for (const url of [base + 'hand_landmarker.task', base + 'hand_landmarker.task.wasm',
      'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task']) {
      try { const r = await fetch(url); if (r.ok) { model = new Uint8Array(await r.arrayBuffer()); break; } } catch (e) {}
    }
    if (!model) throw new Error('hand model unavailable');
    landmarker = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetBuffer: model, delegate: 'GPU' },
      runningMode: 'VIDEO', numHands: 1
    });
  }
  stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false });
  panel = document.createElement('div');
  panel.className = 'hand-panel';
  panel.innerHTML = '<div class="hand-cam"><video playsinline muted></video><canvas></canvas></div><p>Swipe your hand up to scroll down, down to scroll up. Lower it again to reset. Point at a link for 2 seconds to click it.</p>';
  document.body.appendChild(panel);
  cursor = document.createElement('div');
  cursor.className = 'hand-cursor lost';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cursor);
  video = panel.querySelector('video');
  dots = panel.querySelector('canvas');
  video.srcObject = stream;
  await video.play();
  on = true;
  try { sessionStorage.setItem('handOn', '1'); } catch (e) {}
  window.__bg && window.__bg.setHand(true);
  btn.querySelector('.hand-label').textContent = 'Stop hand control';
  btn.setAttribute('aria-pressed', 'true');
  loop();
}

function stop(btn, keep) {
  if (!keep) { try { sessionStorage.removeItem('handOn'); } catch (e) {} }
  on = false;
  cancelAnimationFrame(raf);
  if (stream) stream.getTracks().forEach(t => t.stop());
  if (panel) panel.remove();
  if (cursor) { setHover(null); cursor.remove(); cursor = null; }
  vel = 0; prevY = null;
  stream = panel = video = null;
  window.__bg && window.__bg.setHand(false);
  btn.querySelector('.hand-label').textContent = 'Scroll with your hand';
  btn.setAttribute('aria-pressed', 'false');
}

// Two moves only:
//  swipe your hand up and the page scrolls down (and the other way), like a phone.
//    Slow movements are ignored, so you can bring your hand back without scrolling.
//  point at a link or button and hold still for 2 seconds to click it.
let lastT = -1, vel = 0, carry = 0, seen = 0, lastFrame = 0, prevY = null, cursor = null, hoverEl = null;
let tx = 0, ty = 0, sx = 0, sy = 0, dwellEl = null, dwellStart = 0, cooldown = 0, lockDir = 0, lockUntil = 0;
const REACH = 0.7;                       // central 70% of the camera covers the whole screen
const DWELL = 2000;
const SWIPE = 0.9;                       // hand speed (camera heights per second) that counts as a swipe
const toScreen = v => Math.min(1, Math.max(0, (v - (1 - REACH) / 2) / REACH));
const clickable = el => el && !el.closest('.hand-btn, .hand-panel') ? el.closest('a, button, [role="button"], summary') : null;

function scrollStep(dt) {
  carry += vel * dt / 1000;
  const step = carry | 0;
  if (step) { window.scrollBy({ top: step, behavior: 'instant' }); carry -= step; }
}

function setHover(el) {
  if (el === hoverEl) return;
  if (hoverEl) hoverEl.classList.remove('hand-hover');
  hoverEl = el;
  if (el) el.classList.add('hand-hover');
  cursor.classList.toggle('on-link', !!el);
}

function loop(now) {
  if (!on) return;
  raf = requestAnimationFrame(loop);
  now = now || performance.now();
  const dt = lastFrame ? Math.min(now - lastFrame, 50) : 16; lastFrame = now;
  vel *= Math.pow(0.93, dt / 16);                               // glide, then settle
  scrollStep(dt);
  sx += (tx - sx) * 0.35; sy += (ty - sy) * 0.35;
  cursor.style.transform = `translate(${sx}px, ${sy}px)`;

  // dwell-to-click progress
  if (dwellEl && hoverEl === dwellEl && now > cooldown) {
    const p = Math.min(1, (now - dwellStart) / DWELL);
    cursor.style.setProperty('--p', p);
    if (p >= 1) {
      cursor.classList.add('tap'); setTimeout(() => cursor && cursor.classList.remove('tap'), 300);
      const el = dwellEl; dwellEl = null; cooldown = now + 1200;
      cursor.style.setProperty('--p', 0);
      el.click();
    }
  } else cursor.style.setProperty('--p', 0);

  if (video.readyState < 2 || video.currentTime === lastT) return;
  lastT = video.currentTime;
  const res = landmarker.detectForVideo(video, performance.now());
  const ctx = dots.getContext('2d');
  dots.width = dots.clientWidth; dots.height = dots.clientHeight;
  ctx.clearRect(0, 0, dots.width, dots.height);
  const lm = res.landmarks && res.landmarks[0];
  if (!lm) { prevY = null; cursor.classList.add('lost'); setHover(null); dwellEl = null; return; }
  cursor.classList.remove('lost');
  const t = performance.now();

  // cursor on the index fingertip (mirrored)
  const cx = toScreen(1 - lm[8].x) * innerWidth, cy = toScreen(lm[8].y) * innerHeight;
  tx = cx; ty = cy;
  window.__bg.pointer(cx / innerWidth, 1 - cy / innerHeight);
  const el = clickable(document.elementFromPoint(cx, cy));
  setHover(el);
  if (el !== dwellEl) { dwellEl = el; dwellStart = t; }

  // swipes scroll; slow moves don't
  const py = lm[9].y;
  if (prevY !== null) {
    const frameDt = Math.max(16, t - seen) / 1000;
    const hv = (py - prevY) / frameDt;                         // camera heights per second, up is negative
    if (Math.abs(hv) > SWIPE) {
      const dir = Math.sign(hv);
      dwellStart = t;                                          // moving fast never clicks
      if (lockDir && dir === -lockDir && t < lockUntil) {
        // this is the hand coming back to reset after a swipe: ignore it,
        // and keep ignoring while the return stroke continues
        lockUntil = t + 700;
      } else {
        const v = -hv * innerHeight * 1.6;                     // hand up -> page down
        vel += (v - vel) * 0.5;
        lockDir = dir; lockUntil = t + 1500;                   // opposite moves in the next 1.5s are resets
      }
    }
  }
  prevY = py; seen = t;

  ctx.fillStyle = 'rgba(158, 225, 205, .95)';
  for (const p of lm) { ctx.beginPath(); ctx.arc((1 - p.x) * dots.width, p.y * dots.height, 2.2, 0, 7); ctx.fill(); }
}

export async function toggle(btn) {
  if (on) stop(btn); else {
    try { await start(btn); }
    catch (e) { stop(btn); btn.querySelector('.hand-label').textContent = 'Camera unavailable'; throw e; }
  }
}
