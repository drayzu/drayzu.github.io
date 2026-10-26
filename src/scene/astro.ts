import * as THREE from 'three';
import { C, Q, R, buffers, glow, mix3, points, put, randDir, shared, std, type Piece } from './shared';
import { NOISE } from './noise';

/** The Atlas (the series' library): a star, half wrapped in a Dyson swarm that builds and unbuilds itself. */
export function astro(scene: THREE.Scene, center: THREE.Vector3): Piece {
  const group = new THREE.Group();
  group.position.copy(center);
  scene.add(group);

  const star = new THREE.ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vP; varying vec3 vV;
      void main(){ vN = normalize(normalMatrix * normal); vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      uniform float uTime; varying vec3 vN; varying vec3 vP; varying vec3 vV;
      ${NOISE}
      void main(){
        float n = snoise(vP * 0.45 + vec3(0.0, uTime * 0.04, 0.0)) * 0.6 + snoise(vP * 1.3 - uTime * 0.09) * 0.3 + snoise(vP * 3.5 + uTime * 0.15) * 0.15;
        float g = 0.55 + 0.45 * n;
        vec3 c = mix(vec3(0.7, 0.09, 0.01), vec3(1.0, 0.4, 0.06), smoothstep(0.25, 0.75, g));
        c = mix(c, vec3(1.0, 0.66, 0.3), smoothstep(0.8, 1.1, g));
        float mu = max(dot(vN, vV), 0.0);
        c *= (0.25 + 0.6 * pow(mu, 0.7)) * 0.62;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  group.add(new THREE.Mesh(new THREE.SphereGeometry(4, 96, 64), star));
  group.add(glow(0xff8a3a, 26, .28), glow(0xffd9a0, 11.5, .22));

  // the swarm: geodesic panels that appear along a moving front
  const g = new THREE.IcosahedronGeometry(5.2, 3);
  const n = g.attributes.position.count, bary = new Float32Array(n * 3), order = new Float32Array(n);
  const seed = new THREE.Vector3(.85, .3, .42).normalize(), v = new THREE.Vector3(), w = new THREE.Vector3();
  for (let f = 0; f < n; f += 3) {
    v.set(0, 0, 0);
    for (let k = 0; k < 3; k++) v.add(w.fromBufferAttribute(g.attributes.position, f + k));
    const o = Math.acos(v.normalize().dot(seed)) / Math.PI + (R() - .5) * .07;
    for (let k = 0; k < 3; k++) { bary[(f + k) * 3 + k] = 1; order[f + k] = o; }
  }
  g.setAttribute('aBary', new THREE.BufferAttribute(bary, 3));
  g.setAttribute('aOrder', new THREE.BufferAttribute(order, 1));
  const reveal = { value: .4 };
  const dyson = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { uReveal: reveal, uGold: { value: new THREE.Color(0xe3c48a) } },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aBary; attribute float aOrder; varying vec3 vB; varying float vO; varying vec3 vN; varying vec3 vV;
      void main(){ vB = aBary; vO = aOrder; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      uniform float uReveal; uniform vec3 uGold; varying vec3 vB; varying float vO; varying vec3 vN; varying vec3 vV;
      void main(){
        float m = min(min(vB.x, vB.y), vB.z);
        float w = fwidth(m);
        float edge = 1.0 - smoothstep(w * 0.6, w * 1.8, m);
        float front = 1.0 - smoothstep(0.0, 0.045, abs(vO - uReveal));
        if (vO > uReveal) {
          if (edge < 0.05) discard;
          gl_FragColor = vec4(uGold * edge * (0.28 + front * 2.5), 1.0);
          return;
        }
        float rim = pow(1.0 - abs(dot(vN, vV)), 3.0);
        vec3 panel = vec3(0.012, 0.011, 0.01) + uGold * (0.08 * rim + front * 1.2);
        gl_FragColor = vec4(mix(panel, uGold * 0.55, edge), 1.0);
      }`,
  }));
  group.add(dyson);

  // construction drones on inclined orbits
  const m = Math.round(500 * Q), b = buffers(m), axis = new Float32Array(m * 3);
  for (let i = 0; i < m; i++) {
    const a = new THREE.Vector3(...randDir()), t = new THREE.Vector3(...randDir()).cross(a).normalize(), r = 6 + R() * 4;
    put(b, i, a.multiplyScalar(r).toArray(), mix3(C.astro, C.white, R() * .4), .05 + R() * .05);
    axis.set(t.multiplyScalar(r).toArray(), i * 3);
  }
  group.add(points({ ...std(b), aV: [axis, 3] }, `
    attribute vec3 aV;
    void main(){ float a = aSeed * 6.2831 + uTime * (0.08 + 0.12 * fract(aSeed * 7.0)); emit(position * cos(a) + aV * sin(a), aSize, aColor, 0.8); }`));

  return {
    center,
    update(t) {
      reveal.value = .14 + .6 * (.5 - .5 * Math.cos(t * Math.PI * 2 / 40));
      dyson.rotation.y = Math.sin(t * .05) * .35;
    },
  };
}
