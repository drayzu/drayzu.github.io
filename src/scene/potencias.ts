import * as THREE from 'three';
import { C, Q, R, TAU, buffers, gauss, glow, mix3, points, put, randDir, std, type Buf, type Piece, type V3 } from './shared';

/** 01 · Espacio: a living cell, the first world the piece opens on: membrane, nucleus, mitochondria, Golgi, vesicles. */
export function potencias(scene: THREE.Scene, center: THREE.Vector3): Piece {
  const group = new THREE.Group();
  group.position.copy(center);
  group.rotation.set(.3, .4, .12);
  scene.add(group);

  const RC = 6;                                       // cell radius
  const NUC = new THREE.Vector3(.8, .35, .5), RN = 2; // nucleus
  const v = new THREE.Vector3(), w = new THREE.Vector3();
  const pts: { p: number[]; c: V3; s: number; k: number }[] = []; // k: 0 membrane (breathes with the outline), 1 contents (drift)
  const add = (p: number[], c: V3, s: number, k = 1) => pts.push({ p, c, s, k });
  const dim = (c: V3, f: number) => c.map(x => x * f) as V3;
  const N = (n: number) => Math.round(n * Q);

  // membrane: two close layers, so the rim reads as a double line
  for (let i = 0; i < N(14000); i++) {
    const d = randDir(), r = RC * (R() < .5 ? 1 : .975);
    add(d.map(x => x * r), mix3(C.pot, C.amber, R() * .45), .055, 0);
  }
  // cytoplasm
  for (let i = 0; i < N(2600); i++) {
    const d = randDir(), r = RC * .86 * Math.cbrt(R());
    add(d.map(x => x * r), dim(mix3(C.pot, C.ink, R()), .35), .035);
  }
  // nucleus: envelope, chromatin threads, nucleolus
  for (let i = 0; i < N(3600); i++) {
    const d = randDir();
    add(v.set(...d).multiplyScalar(RN).add(NUC).toArray(), dim(mix3(C.teal, C.blue, .3 + R() * .4), .55), .045);
  }
  for (let t = 0; t < 34; t++) {
    v.set(...randDir()).multiplyScalar(RN * .8 * Math.cbrt(R()));
    w.set(...randDir()).multiplyScalar(.09);
    for (let j = 0; j < N(60); j++) {
      w.add(new THREE.Vector3(...randDir()).multiplyScalar(.035)).setLength(.09);
      v.add(w); if (v.length() > RN * .85) v.setLength(RN * .85);
      add(v.clone().add(NUC).toArray(), dim(mix3(C.teal, C.blue, .5), .42), .04);
    }
  }
  const nucleolus = NUC.clone().add(new THREE.Vector3(.5, .35, -.3));
  for (let i = 0; i < N(500); i++) add([nucleolus.x + gauss() * .28, nucleolus.y + gauss() * .28, nucleolus.z + gauss() * .28], dim(mix3(C.teal, C.white, .3 + R() * .3), .7), .05);
  // rough ER: patchy folds around the nucleus
  for (let i = 0; i < N(2400); i++) {
    const d = randDir(), shell = Math.floor(R() * 3);
    if (Math.sin(d[0] * 5 + shell) * Math.sin(d[1] * 4 - d[2] * 3) < .15) continue;
    add(v.set(...d).multiplyScalar(RN + .45 + shell * .38).add(NUC).toArray(), dim(C.green, .55), .035);
  }
  // mitochondria: striped capsules
  const placed: THREE.Vector3[] = [];
  for (let m = 0; m < 8; m++) {
    let c = new THREE.Vector3();
    for (let tries = 0; tries < 40; tries++) {
      c.set(...randDir()).multiplyScalar(2.8 + R() * 1.4);
      if (c.distanceTo(NUC) > RN + 1.1 && placed.every(o => o.distanceTo(c) > 1.6)) break;
    }
    placed.push(c);
    const axis = new THREE.Vector3(...randDir()), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), axis);
    const L = .75 + R() * .3, r = .32;
    for (let i = 0; i < N(520); i++) {
      let p: THREE.Vector3;
      if (R() < .62) { const d = randDir(); p = new THREE.Vector3(d[0] * L, d[1] * r, d[2] * r); }      // outer membrane
      else { const x = Math.round((R() * 2 - 1) * 3.4) / 3.4 * L * .8, a = R() * TAU, rr = r * .8 * Math.sqrt(R()) * Math.sqrt(Math.max(0, 1 - (x / L) ** 2));
        p = new THREE.Vector3(x, Math.cos(a) * rr, Math.sin(a) * rr); }                                 // cristae
      add(p.applyQuaternion(q).add(c).toArray(), mix3(C.coral, C.pink, R()), .045);
    }
  }
  // Golgi: a stack of curved cisternae, opposite the nucleus
  const gC = NUC.clone().normalize().multiplyScalar(-3.3), gN = gC.clone().normalize();
  const gQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), gN);
  for (let s = 0; s < 5; s++) for (let i = 0; i < N(340); i++) {
    const a = (R() - .5) * 1.5, b = (R() - .5) * .5, rad = 2.2 + s * .2;
    const p = new THREE.Vector3(Math.sin(a) * rad, Math.sin(b) * rad * .5, Math.cos(a) * rad - rad + s * .2);
    add(p.applyQuaternion(gQ).add(gC).toArray(), mix3(C.amber, C.warm, R() * .5), .042);
  }
  // vesicles
  for (let i = 0; i < 70; i++) add(randDir().map(x => x * (1.5 + R() * 3.2)), mix3(C.white, C.warm, R()), .1 + R() * .1);

  const b: Buf = buffers(pts.length), kind = new Float32Array(pts.length);
  pts.forEach((o, i) => { put(b, i, o.p, o.c, o.s); kind[i] = o.k; });
  group.add(points({ ...std(b), aKind: [kind, 1] }, `
    attribute float aKind;
    // a slow, blobby outline: the cell is alive
    float wob(vec3 d){ return 1.0 + 0.085 * sin(dot(d, vec3(2.1, 1.3, -1.7)) * 1.3 + uTime * 0.45) + 0.045 * sin(dot(d, vec3(-1.2, 2.4, 0.8)) * 2.6 - uTime * 0.33); }
    void main(){
      vec3 p = position;
      if (aKind < 0.5) p = normalize(p) * length(p) * wob(normalize(p));
      else p = p * (0.96 + 0.04 * wob(normalize(p + 0.001))) + 0.06 * vec3(sin(uTime * 0.7 + aSeed * 40.0), cos(uTime * 0.6 + aSeed * 23.0), sin(uTime * 0.5 + aSeed * 17.0));
      emit(p, aSize, aColor, aKind < 0.5 ? 0.55 : 0.85);
    }`));
  group.add(glow(0xff7a45, 17, .16));
  const nGlow = glow(0x5fb8d8, 5, .1); nGlow.position.copy(NUC); group.add(nGlow);

  return {
    center,
    update(t) { group.rotation.y = .4 + t * .02; },
  };
}
