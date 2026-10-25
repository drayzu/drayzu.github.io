import * as THREE from 'three';

export const TAU = Math.PI * 2;
export const mobile = matchMedia('(max-width: 760px)').matches;
export const Q = mobile ? 0.5 : 1; // particle budget

export type V3 = [number, number, number];

function rng(seed: number) { // mulberry32
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export const R = rng(7);
export const gauss = () => {
  let u = 0, v = 0;
  while (!u) u = R();
  while (!v) v = R();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
};
export const randDir = (): V3 => {
  const z = R() * 2 - 1, a = R() * TAU, r = Math.sqrt(1 - z * z);
  return [r * Math.cos(a), r * Math.sin(a), z];
};
const col = (hex: number): V3 => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export const mix3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const smooth = (a: number, b: number, x: number) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };

export const C = {
  pot: col(0xff5b2e), astro: col(0xe3c48a), time: col(0x8fb4ff), civ: col(0x6fe3c1), ink: col(0xece7db),
  white: col(0xffffff), warm: col(0xffd9a0), green: col(0x7fe08a), teal: col(0x7be0c4), red: col(0x7a2a2a),
  amber: col(0xffb46b), coral: col(0xff7a59), blue: col(0xb9cdff), pink: col(0xff8fb0),
};

/** Uniforms every particle material shares (same objects, so one write updates all). */
export const shared = { uTime: { value: 0 }, uScale: { value: 1 } };

// Note: on Windows (ANGLE / D3D11) smoothstep with reversed edges misbehaves; always pass edges in order.
const HEAD = /* glsl */`
  uniform float uTime; uniform float uScale; uniform float uOpacity;
  attribute vec3 aColor; attribute float aSize; attribute float aSeed;
  varying vec3 vColor; varying float vAlpha;
  void emit(vec3 p, float size, vec3 c, float alpha) {
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float ps = size * uScale / max(-mv.z, 0.001);
    float a = alpha;
    if (ps < 1.6) { a *= ps / 1.6; ps = 1.6; }
    gl_PointSize = min(ps, 96.0);
    gl_Position = projectionMatrix * mv;
    vColor = c; vAlpha = a * uOpacity;
  }`;
const FRAG = /* glsl */`
  varying vec3 vColor; varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = 1.0 - smoothstep(0.0, 0.5, d); a *= a;
    gl_FragColor = vec4(vColor * a * vAlpha, 1.0);
  }`;

export type Attrs = Record<string, [Float32Array, number]>;

export function points(attrs: Attrs, body: string, uniforms: Record<string, THREE.IUniform> = {}) {
  const g = new THREE.BufferGeometry();
  for (const [name, [arr, size]] of Object.entries(attrs)) g.setAttribute(name, new THREE.BufferAttribute(arr, size));
  const m = new THREE.ShaderMaterial({
    uniforms: { ...shared, uOpacity: { value: 1 }, ...uniforms },
    vertexShader: HEAD + body, fragmentShader: FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  return p;
}

export interface Buf { pos: Float32Array; col: Float32Array; size: Float32Array; seed: Float32Array }
export const buffers = (n: number): Buf => ({ pos: new Float32Array(n * 3), col: new Float32Array(n * 3), size: new Float32Array(n), seed: new Float32Array(n) });
export function put(b: Buf, i: number, p: V3 | number[], c: V3, s: number) { b.pos.set(p, i * 3); b.col.set(c, i * 3); b.size[i] = s; b.seed[i] = R(); }
export const std = (b: Buf): Attrs => ({ position: [b.pos, 3], aColor: [b.col, 3], aSize: [b.size, 1], aSeed: [b.seed, 1] });

let glowTex: THREE.CanvasTexture | null = null;
export function glow(color: number, scale: number, opacity = 1) {
  if (!glowTex) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d')!, gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.5)');
    gr.addColorStop(.5, 'rgba(255,255,255,.1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    glowTex = new THREE.CanvasTexture(c); glowTex.colorSpace = THREE.SRGBColorSpace;
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity }));
  s.scale.setScalar(scale);
  return s;
}

/** Each piece of the series: where it sits, and how it moves with time and with the journey. */
export interface Piece {
  center: THREE.Vector3;
  update(t: number, p: number): void;
}

/** How close the journey is to stop k (1 at the stop, fading over about half a stop). */
export const near = (p: number, k: number) => Math.exp(-((p - k) ** 2) / .3);
