import * as THREE from 'three';
import { C, Q, R, TAU, buffers, gauss, mix3, points, put, randDir, std } from './shared';

/** Distant stars, a faint band of our own galaxy, and dust along the route so motion is felt. */
export function sky(scene: THREE.Scene) {
  {
    const n = Math.round(9000 * Q), b = buffers(n);
    for (let i = 0; i < n; i++) {
      const d = randDir(), r = 700 + R() * 900;
      const c = [C.white, C.warm, C.blue, C.ink][Math.floor(R() * 4)];
      put(b, i, [d[0] * r, d[1] * r, d[2] * r], c, (R() < .03 ? 6 : 1.4 + R() * 2.4) * (r / 1000));
    }
    scene.add(points(std(b), `void main(){ float tw = 0.55 + 0.45 * sin(uTime * (0.5 + aSeed * 2.0) + aSeed * 60.0); emit(position, aSize, aColor, tw); }`));
  }
  {
    const n = Math.round(16000 * Q), b = buffers(n);
    const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(.9, .3, .5));
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const a = R() * TAU, lat = gauss() * (R() < .7 ? .06 : .16) + Math.sin(a * 3) * .03;
      v.set(Math.cos(a) * Math.cos(lat), Math.sin(lat), Math.sin(a) * Math.cos(lat)).applyQuaternion(tilt).multiplyScalar(1100 + R() * 300);
      put(b, i, [v.x, v.y, v.z], mix3(R() < .5 ? C.warm : C.blue, [.25, .2, .18], R() * .6), 2 + R() * 4);
    }
    scene.add(points(std(b), `void main(){ emit(position, aSize, aColor, 0.3); }`));
  }
  {
    const n = Math.round(4000 * Q), b = buffers(n);
    for (let i = 0; i < n; i++) put(b, i, [-90 + R() * 190, -50 + R() * 100, -300 + R() * 380], mix3(C.ink, C.blue, R() * .5), .06 + R() * .16);
    scene.add(points(std(b), `void main(){ vec3 p = position + vec3(sin(uTime*.07+aSeed*20.), cos(uTime*.09+aSeed*11.), sin(uTime*.05+aSeed*7.)) * .8; emit(p, aSize, aColor, .55); }`));
  }
}
