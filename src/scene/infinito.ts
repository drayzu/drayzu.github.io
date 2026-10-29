import * as THREE from 'three';
import { C, Q, R, buffers, glow, mix3, mobile, points, put, randDir, std, type Piece, type V3 } from './shared';

/** 04 · Infinito: the tree of all your lives. One thread of light that splits at every choice, with light flowing out to every tip. */
export function infinito(scene: THREE.Scene, center: THREE.Vector3): Piece {
  const group = new THREE.Group();
  group.position.copy(center);
  group.rotation.set(0, 0, -.08);
  scene.add(group);

  const DEPTH = mobile ? 7 : 8, DENS = 30 * Q + 8;
  const ROOT = new THREE.Vector3(0, -6.5, 0), UP = new THREE.Vector3(0, 1, 0);
  const thread: V3 = mix3(C.teal, C.white, .55), lilac: V3 = mix3(C.inf, C.pink, .35);
  const pts: { p: number[]; c: V3; s: number; arc: number; tip: number }[] = [];

  const perp = (d: THREE.Vector3) => new THREE.Vector3(...randDir()).cross(d).normalize();
  function branch(a: THREE.Vector3, dir: THREE.Vector3, len: number, depth: number, s0: number) {
    const bend = perp(dir).multiplyScalar(len * .14);
    const ctl = a.clone().addScaledVector(dir, len * .5).add(bend), b = a.clone().addScaledVector(dir, len);
    const n = Math.max(5, Math.round(len * DENS)), f = depth / DEPTH;
    const c = f < .2 ? mix3(thread, C.inf, f / .2) : mix3(C.inf, lilac, (f - .2) / .8);
    for (let i = 0; i < n; i++) {
      const u = i / n, k = 1 - u;
      const p = [0, 1, 2].map(j => { const ax = 'xyz'[j] as 'x'; return k * k * a[ax] + 2 * k * u * ctl[ax] + u * u * b[ax]; });
      pts.push({ p, c, s: .085 - .05 * f, arc: s0 + u * len, tip: 0 });
    }
    // the tangent at the end, so children leave smoothly
    const out = b.clone().sub(ctl).normalize();
    if (depth === DEPTH) { pts.push({ p: b.toArray(), c: mix3(lilac, C.white, .4), s: .2, arc: s0 + len, tip: 1 }); return; }
    const axis = perp(out);
    for (let k = 0; k < 2; k++) {
      const ang = (.32 + R() * .2) * (k ? 1 : -1);
      const d = out.clone().applyAxisAngle(axis, ang).lerp(UP, .12).normalize();
      branch(b, d, len * (.76 + R() * .08), depth + 1, s0 + len);
    }
  }
  branch(ROOT, UP.clone(), 3.1, 0, 0);

  const b = buffers(pts.length), arc = new Float32Array(pts.length), tip = new Float32Array(pts.length);
  pts.forEach((o, i) => { put(b, i, o.p, o.c, o.s); arc[i] = o.arc; tip[i] = o.tip; });
  group.add(points({ ...std(b), aArc: [arc, 1], aTip: [tip, 1] }, `
    attribute float aArc; attribute float aTip;
    void main(){
      // pulses of light run from the root out to every life
      float w = fract(aArc * 0.1 - uTime * 0.16);
      float pulse = pow(w, 12.0);
      float tw = mix(1.0, 0.65 + 0.35 * sin(uTime * 1.7 + aSeed * 30.0), aTip);
      vec3 p = position + vec3(sin(uTime * 0.35 + aArc * 0.25), 0.0, cos(uTime * 0.3 + aArc * 0.2)) * 0.012 * aArc;
      emit(p, aSize * (1.0 + 0.9 * pulse), aColor, (0.45 + 1.3 * pulse) * tw);
    }`));
  group.add(glow(0xc9b4ff, 20, .1));
  const seed = glow(0xdffcf3, 2.6, .8); seed.position.copy(ROOT); group.add(seed);

  return {
    center,
    update(t) { group.rotation.y = t * .03; },
  };
}
