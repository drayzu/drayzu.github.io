import * as THREE from 'three';
import { C, Q, R, TAU, buffers, gauss, glow, mix3, points, put, randDir, std, type Piece, type V3 } from './shared';

/** 01 · Espacio: worlds inside worlds, flowing outward forever. */
export function potencias(scene: THREE.Scene, center: THREE.Vector3): Piece {
  const group = new THREE.Group();
  group.position.copy(center);
  scene.add(group);

  const K = 6, per = Math.round(4200 * Q), b = buffers(K * per), shell = new Float32Array(K * per);
  const up = new THREE.Vector3(0, 1, .3);
  let i = 0;
  for (let k = 0; k < K; k++) {
    const kind = k % 4;
    const centers = Array.from({ length: 70 }, randDir);
    const arcs: [V3, V3][] = Array.from({ length: 36 }, () => [randDir(), randDir()]);
    for (let j = 0; j < per; j++, i++) {
      let p: number[], c: V3, s: number;
      if (kind === 0) { // cells: membranes and nuclei
        const ce = new THREE.Vector3(...centers[Math.floor(R() * centers.length)]);
        const t1 = new THREE.Vector3().crossVectors(ce, up).normalize();
        const t2 = new THREE.Vector3().crossVectors(ce, t1);
        const nucleus = R() < .22, a = R() * TAU, rc = nucleus ? .03 * Math.sqrt(R()) : .1 + gauss() * .006;
        p = ce.addScaledVector(t1, Math.cos(a) * rc).addScaledVector(t2, Math.sin(a) * rc).normalize().toArray();
        c = nucleus ? C.teal : mix3(C.pot, C.amber, R() * .4); s = nucleus ? .028 : .018;
      } else if (kind === 1) { // lattice
        const y = 1 - 2 * (j + .5) / per, r = Math.sqrt(1 - y * y), a = j * 2.39996;
        p = [r * Math.cos(a), y, r * Math.sin(a)].map(v => v * (1 + gauss() * .008));
        c = mix3(C.green, C.ink, R() * .3); s = .016;
      } else if (kind === 2) { // filaments
        const [a0, a1] = arcs[Math.floor(R() * arcs.length)];
        const v = new THREE.Vector3(...a0).lerp(new THREE.Vector3(...a1), R()).normalize();
        p = v.multiplyScalar(1 + gauss() * .01).toArray(); c = mix3(C.warm, C.pot, R() * .3); s = .02;
      } else { // dust
        const d = randDir(), r = .75 + R() * .3;
        p = d.map(v => v * r); c = R() < .5 ? C.pot : C.green; s = .014 + R() * .012;
      }
      put(b, i, p, c, s); shell[i] = k;
    }
  }
  group.add(points({ ...std(b), aShell: [shell, 1] }, `
    attribute float aShell; uniform float uK;
    void main(){
      float ph = fract(uTime * 0.032 + aShell / uK);
      float sc = 1.2 * pow(9.0, ph);
      float dir = mod(aShell, 2.0) * 2.0 - 1.0;
      float ang = uTime * 0.05 * dir * (1.0 + aShell * 0.2);
      float c = cos(ang), s = sin(ang);
      vec3 p = position; p.xz = mat2(c, -s, s, c) * p.xz;
      float fade = pow(sin(3.14159 * ph), 1.5);
      emit(p * sc, aSize * sc, aColor, fade * 0.95);
    }`, { uK: { value: K } }));

  const n = Math.round(1800 * Q), core = buffers(n);
  for (let j = 0; j < n; j++) { const d = randDir(), r = Math.abs(gauss()) * .35; put(core, j, d.map(v => v * r), mix3(C.white, C.pot, R() * .7), .03 + R() * .03); }
  group.add(points(std(core), `void main(){ emit(position * (1.0 + 0.08 * sin(uTime * 1.4)), aSize, aColor, 0.9); }`));
  group.add(glow(0xff7a45, 5, .55));

  return { center, update() {} };
}
