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
      vec2 nodePos(vec2 c){
        vec2 h = vec2(hash(c), hash(c + 17.3));
        return c + 0.5 + 0.32 * sin(6.2831 * h + uTime * 0.12 * (0.6 + h.yx));
      }
      float cortexH(vec2 bp, float t){
        float g = noise(bp * 1.3 + t * 0.6) + 0.5 * noise(bp * 2.6 - t * 0.4);
        return sqrt(abs(sin(g * 19.0)));
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

        // cortex: rounded gyri split by sulci, lit like a surface, drifting slowly
        vec2 bp = p * 1.7 + 0.15 * r;
        float folds = cortexH(bp, t);
        float e = 0.012;
        vec2 grad = vec2(cortexH(bp + vec2(e, 0.0), t) - folds, cortexH(bp + vec2(0.0, e), t) - folds) / e;
        vec3 nrm = normalize(vec3(-grad * 0.035, 1.0));
        float light = dot(nrm, normalize(vec3(-0.5, 0.6, 0.65)));
        float gyri = folds;
        col *= mix(0.72, 1.0, smoothstep(0.0, 0.55, folds));
        col *= 0.86 + 0.22 * light;
        col += teal * 0.05 * gyri * (0.5 + f);
        // slow alpha-like wave of activity sweeping across the folds
        float wave = 0.5 + 0.5 * sin(dot(p, vec2(0.8, 0.6)) * 1.6 - uTime * (0.5 + uEnergy));
        col += teal * 0.05 * wave * gyri;

        // neurons: soft cells that fire now and then (no connecting lines)
        vec2 np = p * 1.25 + vec2(7.0, 3.0);
        vec2 mn = m * 1.25 + vec2(7.0, 3.0);
        vec2 cell = floor(np);
        float fire = 0.0;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 c = cell + vec2(float(i), float(j));
          vec2 da = np - nodePos(c);
          float rate = 0.12 * (0.5 + hash(c + 5.3)) * (1.0 + 2.0 * uEnergy);
          float ph = fract(uTime * rate + hash(c - 2.1));
          float pulse = exp(-ph * 9.0);
          fire += (0.15 + pulse) * exp(-dot(da, da) * 45.0);
        }
        float near = exp(-dot(np - mn, np - mn) * 0.9);
        col += vec3(0.62, 0.88, 0.80) * 0.09 * fire * (0.5 + 1.2 * near + 0.8 * uEnergy);

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
    btn.innerHTML = '<span aria-hidden="true">&#9995;</span> Move it with your hand';
    document.body.appendChild(btn);
    btn.addEventListener('click', async () => {
      if (btn.dataset.busy) return;
      btn.dataset.busy = '1';
      try {
        const mod = await import('./hand.js?v=2');
        await mod.toggle(btn);
      } catch (e) {
        btn.innerHTML = 'Camera unavailable';
        console.warn(e);
      }
      delete btn.dataset.busy;
    });
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
