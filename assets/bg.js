// Interactive shader background (three.js). Flowing teal field with neural-like
// filaments; the cursor bends the flow and lights it, clicks send a ripple.
import * as THREE from './vendor/three.module.min.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' });
} catch (e) { renderer = null; }

if (renderer) {
  const canvas = renderer.domElement;
  canvas.className = 'bg-shader';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  document.documentElement.classList.add('has-shader');

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0.62, 0.7) },
    uScroll: { value: 0 },
    uClick: { value: new THREE.Vector2(-9, -9) },
    uClickT: { value: -100 },
    uEnergy: { value: 0 }
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      precision highp float;
      uniform float uTime, uScroll, uClickT, uEnergy;
      uniform vec2 uRes, uMouse, uClick;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
        for (int i = 0; i < 5; i++){ v += a*noise(p); p = m*p; a *= 0.5; }
        return v;
      }
      void main(){
        vec2 uv = gl_FragCoord.xy / uRes;
        float asp = uRes.x / uRes.y;
        vec2 sc = vec2(asp, 1.0) * 1.7;
        vec2 p = uv * sc; p.y -= uScroll * 0.35;
        vec2 m = uMouse * sc; m.y -= uScroll * 0.35;
        float t = uTime * 0.022;
        float d = length(p - m);

        vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
        q += 0.6 * (p - m) * exp(-d*d*1.2);
        vec2 r = vec2(fbm(p + 3.0*q + vec2(1.7, 9.2) + t*1.5), fbm(p + 3.0*q + vec2(8.3, 2.8) - t));
        float f = fbm(p + 3.0*r);

        vec3 deep = vec3(0.098, 0.165, 0.141);
        vec3 base = vec3(0.145, 0.235, 0.200);
        vec3 teal = vec3(0.32, 0.58, 0.50);
        vec3 col = mix(deep, base, smoothstep(0.25, 0.75, f));
        col = mix(col, teal, 0.2 * smoothstep(0.55, 0.95, f) * length(q));

        float ridge = 1.0 - abs(2.0 * fbm(p*1.3 + 2.0*r - t) - 1.0);
        col += teal * 0.06 * pow(ridge, 10.0);

        col += teal * 0.15 * exp(-d*d*1.1);

        vec2 c = uClick * sc; c.y -= uScroll * 0.35;
        float age = uTime - uClickT;
        float ring = exp(-pow(length(p - c) - age*1.1, 2.0) * 30.0) * exp(-age * 1.6);
        col += teal * 0.25 * ring * (0.6 + 0.4*ridge);

        col *= 0.88 + 0.12 * smoothstep(1.2, 0.2, length(uv - 0.5));
        col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.012;
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.6;
  function resize() {
    renderer.setPixelRatio(scale);
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.getDrawingBufferSize(uniforms.uRes.value);
  }
  resize();
  addEventListener('resize', resize);

  const target = uniforms.uMouse.value.clone();
  addEventListener('pointermove', e => { if (handOn) return; target.set(e.clientX / innerWidth, 1 - e.clientY / innerHeight); }, { passive: true });
  addEventListener('pointerdown', e => {
    uniforms.uClick.value.set(e.clientX / innerWidth, 1 - e.clientY / innerHeight);
    uniforms.uClickT.value = uniforms.uTime.value;
  }, { passive: true });

  let handOn = false;
  window.__bg = {
    pointer(x, y) { target.set(x, y); },
    ripple(x, y) { uniforms.uClick.value.set(x, y); uniforms.uClickT.value = uniforms.uTime.value; },
    energy(v) { uniforms.uEnergy.value += (v - uniforms.uEnergy.value) * 0.15; },
    setHand(on) { handOn = on; if (!on) uniforms.uEnergy.value = 0; }
  };

  // Opt-in hand control (desktop with a camera only)
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && matchMedia('(pointer: fine)').matches) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'hand-btn';
    btn.innerHTML = '<span class="hand-dot" aria-hidden="true"></span><span class="hand-label">Scroll with your hand</span>';
    document.body.appendChild(btn);
    btn.addEventListener('click', async () => {
      if (btn.dataset.busy) return;
      btn.dataset.busy = '1';
      try {
        const mod = await import('./hand.js?v=5');
        await mod.toggle(btn);
      } catch (e) {
        btn.querySelector('.hand-label').textContent = 'Camera unavailable';
        console.warn(e);
      }
      delete btn.dataset.busy;
    });
    // keep hand control on when a hand-click opens another page
    let resume = false;
    try { resume = sessionStorage.getItem('handOn') === '1'; } catch (e) {}
    if (resume) btn.click();
  }

  const clock = new THREE.Clock();
  let running = true;
  function frame() {
    if (!running) return;
    uniforms.uTime.value += Math.min(clock.getDelta(), 0.05);
    uniforms.uMouse.value.lerp(target, 0.04);
    uniforms.uScroll.value = scrollY / innerHeight;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  if (reduce) {
    uniforms.uTime.value = 40;
    renderer.render(scene, camera);
    addEventListener('scroll', () => { uniforms.uScroll.value = scrollY / innerHeight; renderer.render(scene, camera); }, { passive: true });
  } else {
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) { clock.getDelta(); requestAnimationFrame(frame); }
    });
    requestAnimationFrame(frame);
  }
}
