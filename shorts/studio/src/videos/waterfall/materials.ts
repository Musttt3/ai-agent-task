// Shader materials for the waterfall piece: depth-displaced photo panels (and their mirrored water reflections),
// the person cut-out with pseudo-volume and back-rim light, particles, god rays, sky dome and the water surface.
import * as THREE from "three";

export const FLOOR_Y = -1.52;
const MAX_RIP = 4;

const ripple = /* glsl */ `
uniform vec4 uRip[${MAX_RIP}]; // x, z, age (s, <0 off), strength
vec2 rippleOffset(vec3 w) {
  vec2 off = vec2(0.0);
  for (int i = 0; i < ${MAX_RIP}; i++) {
    vec4 r = uRip[i];
    if (r.z < 0.0) continue;
    vec2 d = w.xz - r.xy;
    float dist = length(d) + 1e-4;
    float front = r.z * 1.5;
    float env = exp(-pow((dist - front) * 2.2, 2.0)) * exp(-r.z * 1.1) * r.w;
    off += d / dist * sin(dist * 34.0 - r.z * 14.0) * env;
  }
  return off;
}`;

const panelVert = /* glsl */ `
uniform sampler2D depthMap;
uniform float uDisp;
uniform float uReflect;
uniform float uFloorY;
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vUv = uv;
  float h = texture2D(depthMap, uv).r;
  vec3 p = position + vec3(0.0, 0.0, (h - 0.35) * uDisp);
  vec4 w = modelMatrix * vec4(p, 1.0);
  if (uReflect > 0.5) w.y = 2.0 * uFloorY - w.y;
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const panelFrag = /* glsl */ `
uniform sampler2D map;
uniform float uOpacity;
uniform float uEdge;
uniform float uBright;
uniform float uReflect;
uniform float uFloorY;
uniform float uTime;
uniform float uSweep;
uniform vec2 uSize;
varying vec2 vUv;
varying vec3 vWorld;
${ripple}
void main() {
  vec2 uv = vUv;
  if (uReflect > 0.5) {
    vec2 o = rippleOffset(vWorld) * 0.035;
    o.x += sin(vWorld.x * 23.0 + uTime * 1.7) * 0.0025 + sin(vWorld.z * 31.0 - uTime * 2.3) * 0.0018;
    uv += vec2(o.x, o.y * 0.6);
  }
  vec4 c = clamp(texture2D(map, uv), 0.0, 1.0);
  vec3 col = c.rgb * uBright;
  bool front = gl_FrontFacing;
  if (uReflect > 0.5) front = !front;
  if (!front) {
    float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = vec3(0.012, 0.035, 0.035) + vec3(0.5, 0.75, 0.75) * l * 0.1;
  }
  vec2 px = vec2(min(vUv.x, 1.0 - vUv.x) * uSize.x, min(vUv.y, 1.0 - vUv.y) * uSize.y);
  float e = min(px.x, px.y);
  col += vec3(1.0, 0.96, 0.88) * (exp(-e * 260.0) * 1.6 + exp(-e * 40.0) * 0.12) * uEdge;
  if (uSweep >= 0.0) {
    float d = (vWorld.x * 0.55 + vWorld.y * 0.83) - mix(-3.2, 3.2, uSweep);
    col += vec3(1.0, 0.95, 0.85) * exp(-d * d * 22.0) * 0.32;
  }
  float a = uOpacity;
  if (uReflect > 0.5) {
    float below = max(uFloorY - vWorld.y, 0.0);
    col *= vec3(0.62, 0.78, 0.8);
    a *= exp(-below * 1.5) * 0.42;
  }
  if (any(isnan(col)) || any(isinf(col))) col = vec3(0.0); // edge-on anisotropic sampling can return NaN
  col = clamp(col, 0.0, 24.0);
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;

export const makePanelMaterial = (map: THREE.Texture, depth: THREE.Texture, size: [number, number], reflect: boolean) =>
  new THREE.ShaderMaterial({
    uniforms: {
      map: { value: map },
      depthMap: { value: depth },
      uDisp: { value: 0.1 },
      uReflect: { value: reflect ? 1 : 0 },
      uFloorY: { value: FLOOR_Y },
      uOpacity: { value: 1 },
      uEdge: { value: 0.3 },
      uBright: { value: 1 },
      uTime: { value: 0 },
      uSweep: { value: -1 },
      uSize: { value: new THREE.Vector2(size[0], size[1]) },
      uRip: { value: Array.from({ length: MAX_RIP }, () => new THREE.Vector4(0, 0, -1, 0)) },
    },
    vertexShader: panelVert,
    fragmentShader: panelFrag,
    transparent: true,
    depthWrite: !reflect,
    side: THREE.DoubleSide,
  });

const personVert = /* glsl */ `
uniform sampler2D bulgeMap;
uniform float uBulge;
uniform float uReflect;
uniform float uFloorY;
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vUv = uv;
  float b = texture2D(bulgeMap, uv).r;
  vec3 p = position + vec3(0.0, 0.0, b * uBulge);
  vec4 w = modelMatrix * vec4(p, 1.0);
  if (uReflect > 0.5) w.y = 2.0 * uFloorY - w.y;
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const personFrag = /* glsl */ `
uniform sampler2D map;
uniform float uOpacity;
uniform float uRim;
uniform float uReflect;
uniform float uFloorY;
uniform float uTime;
uniform float uSweep;
varying vec2 vUv;
varying vec3 vWorld;
${ripple}
void main() {
  vec2 uv = vUv;
  if (uReflect > 0.5) {
    vec2 o = rippleOffset(vWorld) * 0.03;
    o.x += sin(vWorld.x * 23.0 + uTime * 1.7) * 0.0025;
    uv += o;
  }
  vec4 c = clamp(texture2D(map, uv), 0.0, 1.0);
  c.a = smoothstep(0.12, 0.88, c.a);
  if (c.a < 0.02) discard;
  vec3 col = c.rgb;
  // back light from above: brighten edges whose neighbour toward the light is transparent
  float up = clamp(texture2D(map, uv + vec2(0.0, 0.004)).a, 0.0, 1.0);
  float rim = c.a * smoothstep(0.2, 1.0, 1.0 - up);
  col += vec3(1.0, 0.92, 0.78) * rim * uRim * 0.22;
  if (uSweep >= 0.0) {
    float d = (vWorld.x * 0.55 + vWorld.y * 0.83) - mix(-3.2, 3.2, uSweep);
    col += vec3(1.0, 0.95, 0.85) * exp(-d * d * 22.0) * 0.32;
  }
  float a = c.a * uOpacity;
  if (uReflect > 0.5) {
    float below = max(uFloorY - vWorld.y, 0.0);
    col *= vec3(0.62, 0.78, 0.8);
    a *= exp(-below * 1.5) * 0.45;
  }
  if (any(isnan(col)) || any(isinf(col)) || isnan(a)) { col = vec3(0.0); a = 0.0; }
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;

export const makePersonMaterial = (map: THREE.Texture, bulge: THREE.Texture, reflect: boolean) =>
  new THREE.ShaderMaterial({
    uniforms: {
      map: { value: map },
      bulgeMap: { value: bulge },
      uBulge: { value: 0.07 },
      uReflect: { value: reflect ? 1 : 0 },
      uFloorY: { value: FLOOR_Y },
      uOpacity: { value: 1 },
      uRim: { value: 0.6 },
      uTime: { value: 0 },
      uSweep: { value: -1 },
      uRip: { value: Array.from({ length: MAX_RIP }, () => new THREE.Vector4(0, 0, -1, 0)) },
    },
    vertexShader: personVert,
    fragmentShader: personFrag,
    transparent: true,
    depthWrite: !reflect,
    side: reflect ? THREE.DoubleSide : THREE.FrontSide,
  });

// ---------------- particles: drifting mist / droplets, imploding into the slit at the build, falling in P3 ----------------
const dustVert = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime;
uniform float uDensity;
uniform float uImplode;
uniform float uFall;
uniform float uPx;
uniform float uHat;
varying float vA;
varying float vSoft;
void main() {
  vec3 box = vec3(7.5, 6.5, 7.0);
  vec3 p = (aSeed.xyz - 0.5) * box + vec3(0.0, 0.4, 0.6);
  float sp = 0.03 + aSeed.w * 0.08;
  float fall = uFall * (0.6 + aSeed.x * 1.4);
  p.y = mod(p.y + 3.25 + uTime * sp - uTime * fall, 6.5) - 2.85;
  p.x += sin(uTime * 0.37 + aSeed.w * 31.0) * 0.18;
  p.z += cos(uTime * 0.29 + aSeed.x * 17.0) * 0.18;
  vec3 slit = vec3(0.0, p.y * 0.25, 0.75);
  p = mix(p, slit, uImplode * (0.35 + 0.65 * aSeed.w));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float big = pow(aSeed.w, 6.0);
  float size = 0.004 + 0.008 * aSeed.y + 0.04 * big;
  gl_PointSize = clamp(size * uPx / max(-mv.z, 0.05), 1.0, 90.0);
  vSoft = big;
  float keep = step(aSeed.y, uDensity * 0.6);
  float twinkle = 0.6 + 0.4 * sin(uTime * (2.0 + aSeed.x * 5.0) + aSeed.z * 40.0);
  float near = smoothstep(0.3, 1.6, -mv.z);
  vA = keep * twinkle * near * (0.4 + 0.5 * uHat * aSeed.z) * (1.0 - 0.8 * big);
}`;

const dustFrag = /* glsl */ `
varying float vA;
varying float vSoft;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d) * 2.0;
  float a = mix(exp(-r * r * 5.0), smoothstep(1.0, 0.75, r) * 0.55, vSoft);
  if (a * vA < 0.003) discard;
  gl_FragColor = vec4(vec3(1.0, 0.97, 0.9) * 1.25, a * vA);
}`;

export const makeDust = (n: number) => {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  const seed = new Float32Array(n * 4);
  let s = 12345;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < n * 4; i++) seed[i] = rnd();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDensity: { value: 1 }, uImplode: { value: 0 }, uFall: { value: 0 }, uPx: { value: 1000 }, uHat: { value: 0 } },
    vertexShader: dustVert, fragmentShader: dustFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  return p;
};

// ---------------- burst of droplets at the drop ----------------
const burstVert = /* glsl */ `
attribute vec4 aSeed;
uniform float uAge;
uniform float uPx;
uniform vec3 uOrigin;
varying float vA;
void main() {
  float th = aSeed.x * 6.2831853;
  float ph = (aSeed.y - 0.5) * 2.2;
  vec3 dir = normalize(vec3(cos(th) * cos(ph), sin(ph) * 0.8, sin(th) * cos(ph) * 0.6 + 0.35));
  float speed = 1.2 + 4.5 * pow(aSeed.z, 2.0);
  float k = 2.2;
  float age = max(uAge, 0.0);
  vec3 p = uOrigin + vec3((aSeed.w - 0.5) * 1.6, (aSeed.x - 0.5) * 1.8, 0.0) * 0.6
         + dir * speed * (1.0 - exp(-k * age)) / k - vec3(0.0, 0.35 * age * age, 0.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp((0.007 + 0.018 * aSeed.w) * uPx / max(-mv.z, 0.05), 1.0, 50.0);
  vA = (uAge < 0.0 ? 0.0 : 1.0) * exp(-age * (0.8 + aSeed.y)) * smoothstep(0.0, 0.03, age);
}`;

const burstFrag = /* glsl */ `
varying float vA;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float a = exp(-dot(d, d) * 18.0);
  if (a * vA < 0.003) discard;
  gl_FragColor = vec4(vec3(1.0, 0.95, 0.85) * 2.2, a * vA);
}`;

export const makeBurst = (n: number) => {
  const g = new THREE.BufferGeometry();
  const seed = new Float32Array(n * 4);
  let s = 777;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < n * 4; i++) seed[i] = rnd();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  const m = new THREE.ShaderMaterial({
    uniforms: { uAge: { value: -1 }, uPx: { value: 1000 }, uOrigin: { value: new THREE.Vector3(0, 0.2, 0.6) } },
    vertexShader: burstVert, fragmentShader: burstFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  return p;
};

// ---------------- god rays (additive plane) ----------------
const raysFrag = /* glsl */ `
uniform float uTime;
uniform float uStrength;
uniform vec3 uColA;
uniform vec3 uColB;
uniform vec2 uOrigin;
uniform float uSoft;
varying vec2 vUv;
float hash(float n) { return fract(sin(n) * 43758.5453); }
float noise1(float x) { float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hash(i), hash(i + 1.0), f); }
void main() {
  vec2 d = vUv - uOrigin;
  float ang = atan(d.x, -d.y);
  float len = length(d);
  float r = noise1(ang * 9.0 + uTime * 0.15) * 0.55 + noise1(ang * 23.0 - uTime * 0.27) * 0.35 + noise1(ang * 51.0 + uTime * 0.4) * 0.2;
  r = pow(clamp(r, 0.0, 1.0), mix(3.0, 1.4, uSoft));
  float cone = exp(-ang * ang * 2.2);
  float fall = exp(-len * 1.7) * smoothstep(0.0, 0.12, len);
  float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x) * smoothstep(0.0, 0.2, vUv.y);
  vec3 col = mix(uColA, uColB, clamp(len * 1.2, 0.0, 1.0));
  float a = r * cone * fall * edge * uStrength;
  gl_FragColor = vec4(col * a, 1.0);
}`;

const simpleVert = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

export const makeRays = (soft: number) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uStrength: { value: 1 }, uSoft: { value: soft },
      uColA: { value: new THREE.Color(1.0, 0.9, 0.72) }, uColB: { value: new THREE.Color(0.16, 0.42, 0.38) },
      uOrigin: { value: new THREE.Vector2(0.5, 1.02) },
    },
    vertexShader: simpleVert, fragmentShader: raysFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });

// ---------------- sky dome ----------------
const skyFrag = /* glsl */ `
uniform float uTime;
uniform float uBright;
varying vec3 vWorld;
varying vec2 vUv;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec3 d = normalize(vWorld);
  float y = d.y;
  vec3 top = vec3(0.002, 0.007, 0.008);
  vec3 mid = vec3(0.008, 0.026, 0.024);
  vec3 hor = vec3(0.03, 0.075, 0.066);
  vec3 col = mix(hor, mid, smoothstep(-0.02, 0.25, y));
  col = mix(col, top, smoothstep(0.25, 0.8, y));
  col = mix(col, vec3(0.008, 0.02, 0.02), smoothstep(-0.02, -0.3, y));
  float az = atan(d.x, d.z);
  float mist = vnoise(vec2(az * 3.0 + uTime * 0.02, y * 6.0)) * 0.6 + vnoise(vec2(az * 9.0 - uTime * 0.03, y * 14.0)) * 0.4;
  col += vec3(0.015, 0.04, 0.036) * mist * exp(-abs(y) * 4.0);
  gl_FragColor = vec4(col * uBright, 1.0);
  #include <colorspace_fragment>
}`;

export const makeSky = () =>
  new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uBright: { value: 1 } },
    vertexShader: simpleVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false,
  });

// ---------------- water surface: ripple rings + sheen ----------------
const waterFrag = /* glsl */ `
uniform float uTime;
uniform float uStrength;
varying vec3 vWorld;
varying vec2 vUv;
${ripple}
void main() {
  float ring = 0.0;
  for (int i = 0; i < ${MAX_RIP}; i++) {
    vec4 r = uRip[i];
    if (r.z < 0.0) continue;
    float dist = length(vWorld.xz - r.xy);
    float front = r.z * 1.5;
    ring += (exp(-pow((dist - front) * 9.0, 2.0)) * 0.9 + exp(-pow((dist - front * 0.7) * 12.0, 2.0)) * 0.35) * exp(-r.z * 1.2) * r.w;
  }
  float sheen = exp(-abs(vWorld.z - 0.2) * 0.6) * exp(-abs(vWorld.x) * 0.35);
  float sparkle = pow(max(0.0, sin(vWorld.x * 41.0 + uTime * 0.9) * sin(vWorld.z * 37.0 - uTime * 1.1)), 24.0);
  float fade = exp(-length(vWorld.xz) * 0.22);
  vec3 col = vec3(0.75, 0.92, 0.95) * ring * 0.55 + vec3(0.1, 0.22, 0.2) * sheen * 0.35 + vec3(0.8, 0.9, 0.9) * sparkle * sheen * 0.25;
  gl_FragColor = vec4(col * fade * uStrength, 1.0);
}`;

export const makeWater = () =>
  new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uStrength: { value: 1 }, uRip: { value: Array.from({ length: MAX_RIP }, () => new THREE.Vector4(0, 0, -1, 0)) } },
    vertexShader: simpleVert, fragmentShader: waterFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });

export const setRipples = (m: THREE.ShaderMaterial, rip: { x: number; z: number; age: number; s: number }[]) => {
  const arr = m.uniforms.uRip.value as THREE.Vector4[];
  for (let i = 0; i < MAX_RIP; i++) {
    const r = rip[i];
    if (r) arr[i].set(r.x, r.z, r.age, r.s);
    else arr[i].set(0, 0, -1, 0);
  }
};

// ---------------- vertical light strip (the slit between the closing doors) ----------------
const slitFrag = /* glsl */ `
uniform float uStrength;
varying vec2 vUv;
void main() {
  float x = (vUv.x - 0.5) * 2.0;
  float v = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
  float a = (exp(-x * x * 140.0) * 2.4 + exp(-x * x * 9.0) * 0.35) * v * uStrength;
  gl_FragColor = vec4(vec3(1.0, 0.93, 0.8) * a, 1.0);
}`;

export const makeSlit = () =>
  new THREE.ShaderMaterial({
    uniforms: { uStrength: { value: 0 } },
    vertexShader: simpleVert, fragmentShader: slitFrag, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  });
