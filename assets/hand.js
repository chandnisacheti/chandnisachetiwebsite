// Opt-in hand control for the shader background. MediaPipe hand tracking runs
// entirely in the browser; camera frames never leave the visitor's device.
import { FilesetResolver, HandLandmarker } from './vendor/mediapipe/vision_bundle.mjs';

let landmarker, stream, video, panel, dots, raf = 0, on = false, pinched = false;
const base = new URL('./vendor/mediapipe/', import.meta.url).href;

async function start(btn) {
  btn.innerHTML = 'Loading hand tracking&#8230;';
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
  panel.innerHTML = '<video playsinline muted></video><canvas></canvas><p>Move your palm. Pinch to send a pulse.</p>';
  document.body.appendChild(panel);
  video = panel.querySelector('video');
  dots = panel.querySelector('canvas');
  video.srcObject = stream;
  await video.play();
  on = true;
  window.__bg && window.__bg.setHand(true);
  btn.innerHTML = '<span aria-hidden="true">&#9995;</span> Stop hand control';
  btn.setAttribute('aria-pressed', 'true');
  loop();
}

function stop(btn) {
  on = false;
  cancelAnimationFrame(raf);
  if (stream) stream.getTracks().forEach(t => t.stop());
  if (panel) panel.remove();
  stream = panel = video = null;
  window.__bg && window.__bg.setHand(false);
  btn.innerHTML = '<span aria-hidden="true">&#9995;</span> Move it with your hand';
  btn.setAttribute('aria-pressed', 'false');
}

let lastT = -1;
function loop() {
  if (!on) return;
  raf = requestAnimationFrame(loop);
  if (video.readyState < 2 || video.currentTime === lastT) return;
  lastT = video.currentTime;
  const res = landmarker.detectForVideo(video, performance.now());
  const ctx = dots.getContext('2d');
  dots.width = dots.clientWidth; dots.height = dots.clientHeight;
  ctx.clearRect(0, 0, dots.width, dots.height);
  const lm = res.landmarks && res.landmarks[0];
  if (!lm) { window.__bg.energy(0); return; }
  // palm centre (middle-finger knuckle), mirrored so it moves like a mirror
  const x = 1 - lm[9].x, y = 1 - lm[9].y;
  window.__bg.pointer(x, y);
  // open hand = more energy (fingertips far from the wrist)
  const d = (a, b) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y);
  const span = d(0, 9) || 1;
  const open = ([8, 12, 16, 20].reduce((s, i) => s + d(0, i), 0) / 4) / span;
  window.__bg.energy(Math.max(0, Math.min(1, (open - 1.1) / 0.8)));
  // pinch (thumb tip to index tip) sends a ripple, once per pinch
  const pinch = d(4, 8) / span < 0.28;
  if (pinch && !pinched) window.__bg.ripple(x, y);
  pinched = pinch;
  // draw the hand as a small constellation in the preview
  ctx.fillStyle = 'rgba(158, 225, 205, .95)';
  for (const p of lm) { ctx.beginPath(); ctx.arc((1 - p.x) * dots.width, p.y * dots.height, 2.2, 0, 7); ctx.fill(); }
}

export async function toggle(btn) {
  if (on) stop(btn); else {
    try { await start(btn); }
    catch (e) { stop(btn); btn.innerHTML = 'Camera unavailable'; throw e; }
  }
}
