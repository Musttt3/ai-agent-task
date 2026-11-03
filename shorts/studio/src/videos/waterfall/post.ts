// Post: directional (whip) blur + chromatic aberration in one convolution effect, then bloom, then a grade with
// split-toning, soft shoulder, vignette, grain, flash and fade.
import * as THREE from "three";
import { BlendFunction, BloomEffect, Effect, EffectAttribute } from "postprocessing";

const fxFrag = /* glsl */ `
uniform vec2 uBlur;
uniform float uCA;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 dc = (uv - 0.5) * uCA;
  if (dot(uBlur, uBlur) < 1e-7) {
    outputColor = vec4(texture2D(inputBuffer, uv + dc).r, inputColor.g, texture2D(inputBuffer, uv - dc).b, inputColor.a);
    return;
  }
  vec3 acc = vec3(0.0);
  float ws = 0.0;
  for (int i = 0; i < 14; i++) {
    float f = float(i) / 13.0 - 0.5;
    float w = 1.0 - abs(f) * 0.8;
    vec2 o = uBlur * f;
    acc.r += texture2D(inputBuffer, uv + o + dc).r * w;
    acc.g += texture2D(inputBuffer, uv + o).g * w;
    acc.b += texture2D(inputBuffer, uv + o - dc).b * w;
    ws += w;
  }
  outputColor = vec4(acc / ws, inputColor.a);
}`;

export class FxEffect extends Effect {
  constructor() {
    super("FxEffect", fxFrag, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, THREE.Uniform>([
        ["uBlur", new THREE.Uniform(new THREE.Vector2(0, 0))],
        ["uCA", new THREE.Uniform(0.002)],
      ]),
    });
  }
  set(blur: [number, number], ca: number) {
    (this.uniforms.get("uBlur")!.value as THREE.Vector2).set(blur[0], blur[1]);
    this.uniforms.get("uCA")!.value = ca;
  }
}

const gradeFrag = /* glsl */ `
uniform float uExposure;
uniform float uFlash;
uniform float uFade;
uniform float uTime;
uniform float uAspect;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 shoulder(vec3 c) {
  // linear below 0.8, soft roll-off above
  vec3 x = max(c - 0.8, 0.0);
  return min(c, 0.8) + x / (1.0 + x * 2.5);
}
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = inputColor.rgb * uExposure;
  c = shoulder(c);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  // split tone: teal shadows, warm highlights; gentle saturation lift
  vec3 shadowTint = vec3(-0.012, 0.006, 0.012);
  vec3 highTint = vec3(0.025, 0.01, -0.02);
  c += shadowTint * (1.0 - smoothstep(0.0, 0.35, l)) + highTint * smoothstep(0.35, 0.9, l);
  c = mix(vec3(l), c, 1.1);
  // contrast S-curve around mid grey (in linear-ish space)
  c = max(c, 0.0);
  c = c * c * (3.0 - 2.0 * c) * 0.25 + c * 0.75;
  // vignette
  vec2 q = (uv - 0.5) * vec2(uAspect, 1.0);
  float v = smoothstep(0.95, 0.25, length(q) * 1.15);
  c *= mix(0.62, 1.0, v);
  // grain
  float g = hash(uv * 1000.0 + fract(uTime * 7.31) * 100.0) - 0.5;
  c += g * 0.007 * (1.0 - l * 0.5);
  c = mix(c, vec3(1.0, 0.98, 0.95), uFlash);
  c = mix(c, vec3(0.0), uFade);
  outputColor = vec4(max(c, 0.0), inputColor.a);
}`;

export class GradeEffect extends Effect {
  constructor() {
    super("GradeEffect", gradeFrag, {
      uniforms: new Map<string, THREE.Uniform>([
        ["uExposure", new THREE.Uniform(1)],
        ["uFlash", new THREE.Uniform(0)],
        ["uFade", new THREE.Uniform(0)],
        ["uTime", new THREE.Uniform(0)],
        ["uAspect", new THREE.Uniform(1080 / 1920)],
      ]),
    });
  }
  set(v: { exposure: number; flash: number; fade: number; time: number }) {
    this.uniforms.get("uExposure")!.value = v.exposure;
    this.uniforms.get("uFlash")!.value = v.flash;
    this.uniforms.get("uFade")!.value = v.fade;
    this.uniforms.get("uTime")!.value = v.time;
  }
}

export const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 0.88, luminanceSmoothing: 0.22, mipmapBlur: true, levels: 7, radius: 0.72 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
