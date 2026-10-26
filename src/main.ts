import './style.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { apply as applyLang, t as tr, type Lang } from './i18n';
import { mobile, shared, smooth } from './scene/shared';
import { sky } from './scene/sky';
import { potencias } from './scene/potencias';
import { astro } from './scene/astro';
import { tiempo } from './scene/tiempo';
import { civilizacion } from './scene/civilizacion';
import { infinito } from './scene/infinito';

declare global { interface Window { __t0: number; __go?: boolean; renderAt?: (t: number, p: number) => void; sceneReady?: boolean } }

const body = document.body;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
const capture = params.has('capture'); // ?capture: no interface, frames drawn on demand by renderAt (README clip)
if (capture) body.classList.add('capture');

applyLang();
if (import.meta.env.BASE_URL !== '/') { // the DCC copy points back to GitHub Pages instead of to itself
  const other = document.getElementById('other-home') as HTMLAnchorElement;
  other.href = 'https://drayzu.github.io/'; other.textContent = 'DRAYZU.GITHUB.IO';
}
document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach(b => b.addEventListener('click', () => {
  applyLang(b.dataset.lang as Lang); active = -2; // re-label the current stop
}));

// ------------------------------------------------------------------ renderer (or the plain list, without WebGL)
const canvas = document.getElementById('gl') as HTMLCanvasElement;
let renderer: THREE.WebGLRenderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: params.has('og') });
} catch {
  body.classList.remove('locked');
  body.classList.add('nogl', 'ready');
  throw new Error('WebGL is not available; showing the list instead.');
}
let PR = Math.min(devicePixelRatio, mobile ? 1.5 : 1.75);
renderer.setPixelRatio(PR);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040507);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.05, 5000);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.9, 0.6, 0.1);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const finish = new ShaderPass({ // vignette and a little film grain
  uniforms: { tDiffuse: { value: null }, uTime: shared.uTime },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float d = length(vUv - 0.5) * 1.35;
      c *= 1.0 - 0.55 * smoothstep(0.45, 1.15, d);
      c += (hash(vUv * 1000.0 + fract(uTime) * 61.0) - 0.5) * 0.035;
      gl_FragColor = vec4(c, 1.0);
    }`,
});
composer.addPass(finish);

// ------------------------------------------------------------------ the series
const C1 = new THREE.Vector3(0, 0, 0);
const C2 = new THREE.Vector3(46, 7, -78);
const C3 = new THREE.Vector3(-40, -10, -165);
const C4 = new THREE.Vector3(30, 14, -255);
const C5 = new THREE.Vector3(-34, 2, -338);
sky(scene);
// The journey stops at the pieces (Espacio, Tiempo, Destino, Infinito); the Atlas, the library that serves them all,
// shines beside the route instead of on it, and opens straight from the map or the header.
const pieces = [potencias(scene, C1), astro(scene, C2), tiempo(scene, C3, 2, 5), civilizacion(scene, C4, 3, 5), infinito(scene, C5, 4, 5)];
const centers = pieces.map(p => p.center);
const onRoute = [centers[0], centers[2], centers[3], centers[4]];

const route = (() => { // the path between them, shown on the map
  const curve = new THREE.CatmullRomCurve3(onRoute, false, 'centripetal');
  const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(240));
  const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0xece7db, dashSize: 1.6, gapSize: 2.6, transparent: true, opacity: 0, depthWrite: false }));
  l.computeLineDistances(); scene.add(l);
  return l;
})();

// ------------------------------------------------------------------ camera stops
const UP = new THREE.Vector3(0, 1, 0);
function stop(center: THREE.Vector3, offset: THREE.Vector3, side: number) { // side > 0 puts the object right of centre, leaving room for the text
  const pos = center.clone().add(offset);
  const fwd = center.clone().sub(pos).normalize();
  const right = new THREE.Vector3().crossVectors(fwd, UP).normalize();
  return { pos, target: center.clone().addScaledVector(right, -side) };
}
const mid = new THREE.Vector3().addVectors(C1, C5).multiplyScalar(.5).add(new THREE.Vector3(2, 0, 0));
const S = mobile || capture ? 0 : 1; // without text beside it, each piece sits in the middle
const STOPS = [
  stop(C1, new THREE.Vector3(9, 3.5, 44), 10 * S),
  stop(C1, new THREE.Vector3(-19, 6, 16), 7.5 * S),
  stop(C3, new THREE.Vector3(9, 5, 30), 10 * S),
  stop(C4, new THREE.Vector3(-8, 15, 30), 11 * S),
  stop(C5, new THREE.Vector3(10, 4, 26), 9 * S),
  { pos: mid.clone().add(new THREE.Vector3(200, 160, 10)), target: mid.clone().add(new THREE.Vector3(-8, -58, 0)) },
];
const LAST_PIECE = STOPS.length - 2;
if (mobile) { // on a phone the object sits above the text instead of beside it
  for (const s of STOPS.slice(0, LAST_PIECE + 1)) s.target.y -= 4;
}
const posCurve = new THREE.CatmullRomCurve3(STOPS.map(s => s.pos), false, 'centripetal');
const tgtCurve = new THREE.CatmullRomCurve3(STOPS.map(s => s.target), false, 'centripetal');
const LAST = STOPS.length - 1;
const dwell = (f: number) => .5 - .5 * Math.cos(Math.PI * Math.min(Math.max((f - .14) / .72, 0), 1));
const BANK = [.10, -.12, .14, -.10, .08];
const INTRO = { pos: C1.clone().add(new THREE.Vector3(.35, .15, 1.4)), target: C1.clone() };

// ------------------------------------------------------------------ scroll and input
const track = document.getElementById('track')!;
let segH = innerHeight * 1.4;
const layout = () => { segH = innerHeight * 1.4; track.style.height = `${innerHeight + LAST * segH}px`; };
layout();
let pTarget = 0, p = 0;
const clampP = (v: number) => Math.min(Math.max(v, 0), LAST);
addEventListener('scroll', () => { pTarget = clampP(scrollY / segH); }, { passive: true });
const go = (k: number) => scrollTo({ top: clampP(k) * segH, behavior: reduced ? 'auto' : 'smooth' });
document.querySelectorAll<HTMLElement>('[data-go]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); go(+el.dataset.go!); }));
addEventListener('keydown', e => { // one key, one stop
  if (introT < 1 || e.altKey || e.ctrlKey || e.metaKey) return;
  const next = ['ArrowDown', 'PageDown', ' ', 'ArrowRight'].includes(e.key) ? 1 : ['ArrowUp', 'PageUp', 'ArrowLeft'].includes(e.key) ? -1 : 0;
  if (!next) return;
  e.preventDefault(); go(Math.round(pTarget) + next);
});

const mouse = new THREE.Vector2(), mouseS = new THREE.Vector2();
if (!reduced) addEventListener('pointermove', e => { mouse.set(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1); });

// the arrival
let introT = -1; // -1 waiting, 0..1 revealing, 1 done
const intro = document.getElementById('intro')!;
const startReveal = () => { if (introT >= 0) return; intro.classList.add('out'); introT = reduced ? 1 : 0; if (reduced) arrived(); };
const arrived = () => {
  body.classList.remove('locked'); body.classList.add('ready');
  const k = Number(params.get('stop'));
  if (k) go(k);
};
intro.addEventListener('click', startReveal);
addEventListener('keydown', startReveal, { once: true });
addEventListener('wheel', startReveal, { once: true, passive: true });
addEventListener('touchstart', startReveal, { once: true, passive: true });
if (window.__go || reduced || capture || params.has('og') || params.has('stop')) startReveal();
setTimeout(startReveal, Math.max(3400 - (performance.now() - window.__t0), 300));
history.scrollRestoration = 'manual';
scrollTo(0, 0);

// diving into a project
let dive: { t: number; from: THREE.Vector3; target: THREE.Vector3; href: string; fired: boolean } | null = null;
const flood = document.getElementById('flood')!;
document.querySelectorAll<HTMLAnchorElement>('[data-dive]').forEach(a => a.addEventListener('click', e => {
  if (reduced || e.metaKey || e.ctrlKey || e.shiftKey) return; // let the browser handle it
  e.preventDefault();
  if (dive) return;
  const color = getComputedStyle(a.closest('.panel')!).getPropertyValue('--c').trim();
  dive = { t: 0, from: camera.position.clone(), target: centers[+a.dataset.dive! - 1].clone(), href: a.href, fired: false };
  flood.style.setProperty('--c', color);
  body.classList.add('diving');
}));
addEventListener('pageshow', e => { if (e.persisted) { dive = null; flood.classList.remove('on'); body.classList.remove('diving'); } });

// interface
const panels = [...document.querySelectorAll<HTMLElement>('.panel')];
const shade = document.getElementById('shade')!;
const railBtns = [...document.querySelectorAll<HTMLElement>('.rail button')];
const railFill = document.getElementById('rail-fill')!;
const hudStop = document.getElementById('hud-stop')!;
const STOP_NAMES = (k: number) => k === 0 ? tr('stop.0') : k === LAST ? tr('stop.5') : `0${k} · ${tr(['name.space', 'name.time', 'name.civ', 'name.inf'][k - 1]).toUpperCase()}`;
const STOP_COLORS = ['--ink', '--pot', '--time', '--civ', '--inf', '--ink'];
const labels = [...document.querySelectorAll<HTMLElement>('.lbl')];
let active = -2;

// ------------------------------------------------------------------ loop
const timer = new THREE.Timer();
const pos = new THREE.Vector3(), tgt = new THREE.Vector3(), tmp = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
let frames = 0, slow = 0;
let fixed: { t: number; p: number } | null = null;

function frame(now: number) {
  timer.update(now);
  let dt = Math.min(timer.getDelta(), .05), t = timer.getElapsed();
  if (fixed) { dt = 1 / 30; t = fixed.t; p = fixed.p; introT = 1; }
  shared.uTime.value = t;

  if (!fixed) p += (pTarget - p) * (1 - Math.exp(-dt * (reduced ? 8 : 3.2)));
  const i = Math.min(Math.floor(p), LAST - 1), f = p - i, u = i + dwell(f);
  posCurve.getPoint(u / LAST, pos);
  tgtCurve.getPoint(u / LAST, tgt);
  const travel = reduced ? 0 : Math.sin(Math.PI * dwell(f));
  let fov = 55 + 12 * travel, roll = BANK[i] * travel;

  // the arrival: from inside the smallest world, out to the whole series
  if (introT < 1) {
    if (introT >= 0) { introT = Math.min(introT + dt / 4.6, 1); if (introT === 1) arrived(); }
    const k = Math.max(introT, 0), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    pos.lerpVectors(INTRO.pos, pos, e); tgt.lerpVectors(INTRO.target, tgt, e);
    fov = 80 + (fov - 80) * e; roll = (1 - e) * .5;
  }

  // a little parallax from the pointer
  mouseS.lerp(mouse, 1 - Math.exp(-dt * 2.5));
  tmp.subVectors(tgt, pos).normalize();
  right.crossVectors(tmp, UP).normalize(); up.crossVectors(right, tmp);
  const par = Math.min(pos.distanceTo(tgt) * .03, 4);
  pos.addScaledVector(right, mouseS.x * par).addScaledVector(up, -mouseS.y * par * .6);

  bloom.strength = .9;
  if (dive) {
    dive.t += dt / 1.5;
    const e = Math.pow(Math.min(dive.t, 1), 3.2);
    pos.lerpVectors(dive.from, dive.target, e * .985); tgt.copy(dive.target);
    fov += 60 * e; bloom.strength += 2.5 * e;
    if (dive.t > .55) flood.classList.add('on');
    if (dive.t > 1.25 && !dive.fired) { dive.fired = true; location.href = dive.href; }
  }

  camera.position.copy(pos);
  camera.up.copy(UP).applyAxisAngle(tmp.subVectors(tgt, pos).normalize(), roll);
  camera.lookAt(tgt);
  if (Math.abs(camera.fov - fov) > .01) { camera.fov = fov; camera.updateProjectionMatrix(); }
  shared.uScale.value = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));

  for (const piece of pieces) piece.update(t, p);
  (route.material as THREE.LineDashedMaterial).opacity = .35 * smooth(LAST - .8, LAST - .1, p);

  // interface
  const a = introT < 1 ? -1 : Math.abs(p - Math.round(p)) < .3 ? Math.round(p) : -1;
  if (a !== active) {
    active = a;
    panels.forEach(el => el.classList.toggle('on', +el.dataset.stop! === a));
    shade.classList.toggle('on', a >= 0 && a !== LAST);
    body.classList.toggle('map', a === LAST);
    railBtns.forEach(b => b.classList.toggle('on', +b.dataset.go! === a));
    if (a >= 0) { hudStop.textContent = STOP_NAMES(a); hudStop.style.setProperty('--c', `var(${STOP_COLORS[a]})`); }
  }
  railFill.style.width = `${smooth(0, 1, (p - 1) / (LAST - 1)) * 100}%`;
  if (p > LAST - .7) labels.forEach((el, k) => {
    tmp.copy(centers[k]).project(camera);
    const x = (tmp.x * .5 + .5) * innerWidth, flip = x > innerWidth - 260;
    el.classList.toggle('flip', flip);
    el.style.transform = `translate(${flip ? x - 18 : x + 18}px, ${(-tmp.y * .5 + .5) * innerHeight - 16}px) translateX(${flip ? '-100%' : '0'})`;
  });

  composer.render(dt);
  if (capture) return;

  // adapt resolution once if the machine struggles
  if (introT >= 1 && frames < 180) {
    frames++; if (dt > 1 / 40) slow++;
    if (frames === 180 && slow > 90 && PR > 1) { PR = 1; renderer.setPixelRatio(1); composer.setPixelRatio(1); resize(); }
  }
  requestAnimationFrame(frame);
}

function resize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
  layout(); pTarget = clampP(scrollY / segH);
}
addEventListener('resize', resize);
if (capture) {
  window.renderAt = (time, at) => { fixed = { t: time, p: at }; frame(performance.now()); };
  window.sceneReady = true;
} else requestAnimationFrame(frame);
