import * as THREE from 'three';
import { C, Q, R, buffers, gauss, glow, mix3, near, points, put, randDir, smooth, std, type Piece, type V3 } from './shared';

/** 03 · Destino: a spiral galaxy where a bubble of light spreads from one star. */
export function civilizacion(scene: THREE.Scene, center: THREE.Vector3, stop: number, map: number): Piece {
  const group = new THREE.Group();
  group.position.copy(center);
  group.rotation.set(.5, 0, -.12);
  scene.add(group);

  const form = { value: .8 }, bubble = { value: 0 };
  const n = Math.round(26000 * Q), b = buffers(n), neb = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const k = R();
    let p: number[], c: V3, s: number;
    if (k < .14) { // bulge
      p = [gauss() * 1.2, gauss() * .55, gauss() * 1.2];
      c = mix3(C.warm, C.white, R() * .6).map(v => v * .45) as V3; s = .06 + R() * .04;
    } else { // two arms, with dust lanes
      const dust = k > .86, r = 1 + 13 * Math.pow(R(), .9), arm = Math.floor(R() * 2);
      const th = arm * Math.PI + 2.3 * Math.log(r) + gauss() * .22 * (1 + 2.5 / r) + (dust ? .28 : 0);
      const sp = .35 + r * .03;
      p = [Math.cos(th) * r + gauss() * sp, gauss() * .22 * Math.exp(-r / 10), Math.sin(th) * r + gauss() * sp];
      c = dust ? [.18, .13, .1] : R() < .04 ? C.pink : mix3(C.blue, C.white, R() * .6);
      s = dust ? .1 : R() < .04 ? .16 : .05 + R() * .05;
    }
    put(b, i, p, c, s);
    const d = randDir(), m = 3 + R() * 5;
    neb.set([d[0] * m, d[1] * m * .4, d[2] * m], i * 3);
  }
  const r0 = 7.5, th0 = 2.3 * Math.log(r0);
  const seed = new THREE.Vector3(Math.cos(th0) * r0, 0, Math.sin(th0) * r0);
  group.add(points({ ...std(b), aNeb: [neb, 3] }, `
    attribute vec3 aNeb; uniform float uForm; uniform vec3 uSeedP; uniform float uBubble; uniform vec3 uTeal;
    void main(){
      float f = clamp(uForm + 0.14 * sin(uTime * 0.3 + aSeed * 6.2831), 0.0, 1.0); f = f * f * (3.0 - 2.0 * f);
      float ang = uTime * 0.08 * (0.5 + aSeed); float c = cos(ang), s = sin(ang);
      vec3 n = aNeb; n.xz = mat2(c, -s, s, c) * n.xz;
      vec3 p = mix(position + n, position, f);
      float d = distance(position, uSeedP);
      float lit = (1.0 - smoothstep(uBubble - 1.6, uBubble, d)) * f;
      float ring = exp(-pow((d - uBubble) / 0.5, 2.0)) * f * step(0.3, uBubble);
      vec3 cc = mix(aColor, uTeal, lit * 0.8) + uTeal * ring * 0.6;
      emit(p, aSize * (1.0 + 0.3 * lit + 0.7 * ring), cc, (0.25 + 0.55 * f) * (1.0 + 0.6 * ring));
    }`, { uForm: form, uSeedP: { value: seed }, uBubble: bubble, uTeal: { value: new THREE.Vector3(...C.civ) } }));
  group.add(glow(0xffe2b8, 6, .25));

  return {
    center, group,
    update(t, p) {
      form.value = .8 + .25 * Math.max(near(p, stop), near(p, map)); // formed, breathing a little
      const ph = (t / 24) % 1;
      bubble.value = 11 * ph * (1 - smooth(.9, 1, ph));
      group.rotation.y = t * .015;
    },
  };
}
