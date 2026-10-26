import * as THREE from 'three';
import { C, Q, R, buffers, glow, mix3, near, points, put, randDir, std, type Piece } from './shared';

/** 04 · Infinito: shells of light falling forever into one point. Still a nebula. */
export function infinito(scene: THREE.Scene, center: THREE.Vector3, stop: number, map: number): Piece {
  const group = new THREE.Group();
  group.position.copy(center);
  scene.add(group);

  const form = { value: .3 };
  const SHELLS = 9;
  const n = Math.round(22000 * Q), b = buffers(n), neb = new Float32Array(n * 3), shell = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const d = randDir();
    put(b, i, d, mix3(C.inf, C.white, R() * .55), .05 + R() * .05);
    shell[i] = Math.floor(R() * SHELLS);
    const e = randDir(), m = 2 + R() * 6;
    neb.set([e[0] * m, e[1] * m * .5, e[2] * m], i * 3);
  }
  group.add(points({ ...std(b), aNeb: [neb, 3], aShell: [shell, 1] }, `
    attribute vec3 aNeb; attribute float aShell; uniform float uForm;
    void main(){
      float f = clamp(uForm + 0.14 * sin(uTime * 0.3 + aSeed * 6.2831), 0.0, 1.0); f = f * f * (3.0 - 2.0 * f);
      // each shell shrinks into the next one, forever: the same picture at every scale
      float k = aShell + fract(uTime * 0.05);
      float r = 9.0 * pow(0.62, k);
      float fade = smoothstep(0.0, 1.2, k) * (1.0 - smoothstep(6.5, 9.0, k));
      float ang = uTime * 0.05 * (1.0 + aShell * 0.3); float c = cos(ang), s = sin(ang);
      vec3 q = position * r; q.xz = mat2(c, -s, s, c) * q.xz;
      vec3 p = mix(q + aNeb, q, f);
      emit(p, aSize * (0.6 + 0.4 * r / 9.0) + 0.02, aColor, (0.2 + 0.6 * f) * fade);
    }`, { uForm: form }));
  group.add(glow(0xe9dcff, 3.5, .45));

  return {
    center,
    update(t, p) {
      form.value = .22 + .66 * near(p, stop) + .2 * near(p, map);
      group.rotation.y = t * .01;
    },
  };
}
