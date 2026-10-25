import * as THREE from 'three';
import { C, Q, R, TAU, buffers, gauss, glow, mix3, near, points, put, randDir, smooth, std, type Piece, type V3 } from './shared';

/** 03 · Tiempo: the history of the universe as an expanding cone. Still a nebula that condenses as you approach. */
export function tiempo(scene: THREE.Scene, center: THREE.Vector3, stop: number): Piece {
  const group = new THREE.Group();
  group.position.copy(center);
  group.rotation.set(.12, .55, .05);
  scene.add(group);

  const form = { value: .3 };
  const coneR = (u: number) => .15 + 1.6 * smooth(0, .06, u) + 5.2 * Math.pow(u, 1.7);
  const n = Math.round(17000 * Q), b = buffers(n), neb = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const kind = R();
    let u: number, rad: number, c: V3, s: number;
    if (kind < .45) { // the edge of the universe
      u = Math.pow(R(), .85); rad = coneR(u) * (.97 + R() * .03);
      c = u < .05 ? C.white : u > .85 ? mix3(C.time, C.red, (u - .85) / .15) : mix3(C.white, C.time, Math.min(u * 4, 1)); s = .07;
    } else if (kind < .57) { // the cosmic microwave background, a speckled wall
      u = .27 + gauss() * .004; rad = coneR(u) * Math.sqrt(R());
      c = [C.amber, C.coral, C.time, C.blue][Math.floor(R() * 4)]; s = .08;
    } else { // stars and galaxies, fading at the end of time
      u = .35 + R() * .65; rad = coneR(u) * Math.sqrt(R()) * .94;
      c = R() < .1 ? C.warm : mix3(C.white, C.blue, R()); c = u > .85 ? mix3(c, C.red, (u - .85) / .15) : c; s = .05 + R() * .07;
    }
    const a = R() * TAU;
    put(b, i, [-13 + 26 * u, Math.cos(a) * rad, Math.sin(a) * rad], c, s);
    const d = randDir(), k = 2.5 + R() * 4.5;
    neb.set([d[0] * k, d[1] * k, d[2] * k], i * 3);
  }
  group.add(points({ ...std(b), aNeb: [neb, 3] }, `
    attribute vec3 aNeb; uniform float uForm;
    void main(){
      float f = clamp(uForm + 0.16 * sin(uTime * 0.35 + aSeed * 6.2831), 0.0, 1.0); f = f * f * (3.0 - 2.0 * f);
      float ang = uTime * 0.12 * (0.4 + aSeed); float c = cos(ang), s = sin(ang);
      vec3 n = aNeb; n.yz = mat2(c, -s, s, c) * n.yz;
      vec3 p = mix(position + n, position, f);
      float tw = 0.7 + 0.3 * sin(uTime * (1.0 + aSeed * 2.0) + aSeed * 30.0);
      emit(p, aSize, aColor, (0.3 + 0.45 * f) * tw);
    }`, { uForm: form }));

  // the light that travels through time
  const m = 70, pl = buffers(m), idx = new Float32Array(m);
  for (let i = 0; i < m; i++) { put(pl, i, [0, 0, 0], mix3(C.white, C.time, i / m), i === 0 ? .45 : .22); idx[i] = i; }
  group.add(points({ ...std(pl), aIdx: [idx, 1] }, `
    attribute float aIdx; uniform float uForm;
    void main(){
      float x = -13.0 + 28.0 * fract(uTime / 9.0) - aIdx * 0.14;
      float a = pow(1.0 - aIdx / 70.0, 2.0) * step(-13.0, x) * step(x, 13.0) * smoothstep(0.2, 0.7, uForm);
      emit(vec3(x, 0.0, 0.0), aSize, aColor, a);
    }`, { uForm: form }));
  const bang = glow(0xcfe0ff, 6, .9);
  bang.position.set(-13, 0, 0);
  group.add(bang);

  return {
    center,
    update(t, p) {
      form.value = .22 + .66 * near(p, stop) + .2 * near(p, 5);
      const ph = (t / 9) % 1;
      bang.scale.setScalar(2 + 9 * Math.exp(-ph * 7) * smooth(.15, .6, form.value));
    },
  };
}
