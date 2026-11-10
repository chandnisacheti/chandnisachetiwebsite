// Opt-in hand control for the shader background. MediaPipe hand tracking runs
// entirely in the browser; camera frames never leave the visitor's device.
import { FilesetResolver, HandLandmarker } from './vendor/mediapipe/vision_bundle.mjs';

let landmarker, stream, video, panel, dots, raf = 0, on = false, pinched = false;
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
  panel.innerHTML = '<div class="hand-cam"><video playsinline muted></video><canvas></canvas></div><p>Open hand: drag the page up or down. Fist: let go. Point and pinch twice to click.</p>';
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

// Gestures
//  open hand  : grab the page and drag it, like a touchscreen (move up = page goes down)
//  fist       : let go, so you can reposition without scrolling
//  fingertip  : a cursor follows your index finger; pinch twice quickly to click
let lastT = -1, vel = 0, carry = 0, seen = 0, lastFrame = 0, prevY = null, lastPinch = 0, cursor = null, hoverEl = null, tx = 0, ty = 0, sx = 0, sy = 0;
const REACH = 0.7;                       // central 70% of the camera covers the whole screen
const toScreen = v => Math.min(1, Math.max(0, (v - (1 - REACH) / 2) / REACH));

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

function clickAt(px, py) {
  cursor.classList.add('tap'); setTimeout(() => cursor && cursor.classList.remove('tap'), 260);
  cursor.style.visibility = 'hidden';
  const el = document.elementFromPoint(px, py);
  cursor.style.visibility = '';
  if (!el || el.closest('.hand-btn, .hand-panel')) return;
  const target = el.closest('a, button, [role="button"], summary, label, input') || el;
  target.click();
}

function loop(now) {
  if (!on) return;
  raf = requestAnimationFrame(loop);
  now = now || performance.now();
  const dt = lastFrame ? Math.min(now - lastFrame, 50) : 16; lastFrame = now;
  if (now - seen > 120 || prevY === null) vel *= Math.pow(0.94, dt / 16);   // fling keeps gliding, then settles
  scrollStep(dt);
  sx += (tx - sx) * 0.35; sy += (ty - sy) * 0.35;
  cursor.style.transform = `translate(${sx}px, ${sy}px)`;
  if (video.readyState < 2 || video.currentTime === lastT) return;
  lastT = video.currentTime;
  const res = landmarker.detectForVideo(video, performance.now());
  const ctx = dots.getContext('2d');
  dots.width = dots.clientWidth; dots.height = dots.clientHeight;
  ctx.clearRect(0, 0, dots.width, dots.height);
  const lm = res.landmarks && res.landmarks[0];
  if (!lm) { prevY = null; cursor.classList.add('lost'); setHover(null); return; }
  cursor.classList.remove('lost');

  const d = (a, b) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y);
  const span = d(0, 9) || 1;
  const ext = i => d(0, i) > d(0, i - 2) * 1.12;            // fingertip further from wrist than its middle joint
  const fingers = [8, 12, 16, 20].filter(ext).length;
  const open = fingers >= 3;

  // cursor on the index fingertip (mirrored)
  const cx = toScreen(1 - lm[8].x) * innerWidth, cy = toScreen(lm[8].y) * innerHeight;
  tx = cx; ty = cy;
  window.__bg.pointer(cx / innerWidth, 1 - cy / innerHeight);
  const under = document.elementFromPoint(cx, cy);
  setHover(under && !under.closest('.hand-btn, .hand-panel') ? under.closest('a, button, [role="button"], summary') : null);

  // open hand drags the page; a fist lets go
  const t = performance.now();
  const py = lm[9].y;
  if (open && prevY !== null) {
    const dy = py - prevY;                                     // camera units; up is negative
    const frameDt = Math.max(16, t - seen);
    const v = (-dy * innerHeight * 2.2) / (frameDt / 1000);    // hand up -> page scrolls down
    vel += (v - vel) * 0.5;
  } else if (!open) {
    vel *= 0.6;
  }
  prevY = open ? py : null;
  seen = t;
  cursor.classList.toggle('grab', open);

  // pinch twice within 900ms clicks whatever is under the cursor; one pinch sends a ripple
  const pinch = d(4, 8) / span < 0.28;
  if (pinch && !pinched) {
    window.__bg.ripple(cx / innerWidth, 1 - cy / innerHeight);
    if (t - lastPinch < 900) { clickAt(cx, cy); lastPinch = 0; } else lastPinch = t;
  }
  pinched = pinch;

  ctx.fillStyle = 'rgba(158, 225, 205, .95)';
  for (const p of lm) { ctx.beginPath(); ctx.arc((1 - p.x) * dots.width, p.y * dots.height, 2.2, 0, 7); ctx.fill(); }
}

export async function toggle(btn) {
  if (on) stop(btn); else {
    try { await start(btn); }
    catch (e) { stop(btn); btn.querySelector('.hand-label').textContent = 'Camera unavailable'; throw e; }
  }
}
