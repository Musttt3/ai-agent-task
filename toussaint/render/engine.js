// Case-file documentary renderer. Deterministic: time = frame / fps, seeded PRNG, all assets preloaded.
// Reads data/beats.json (built by tools/build_beats.py). Exposes window.__init and window.__frame for the Playwright driver.
import * as THREE from 'three';

const RED = '#B3261E';
let D, FPS, W, H, FOV, renderer, scene, camera, objects = [], beats = [], fx = [], shakes = [];
let RT = {}, MAT = {}, quad, quadScene, quadCam, TEX = {}, IMG = new Map(), geo;
const VH = d => 2 * d * Math.tan(THREE.MathUtils.degToRad(FOV) / 2);   // visible height at distance d

// ---------------------------------------------------------------- utils
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => x * x * (3 - 2 * x);
const easeOut = x => 1 - Math.pow(1 - x, 3);
function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h)); return c; }
function ctex(c, repeat = false) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
async function loadImg(src) {
  if (IMG.has(src)) return IMG.get(src);
  const p = (async () => { const r = await fetch('/' + src); if (!r.ok) throw new Error('missing ' + src); return await createImageBitmap(await r.blob()); })();
  IMG.set(src, p); return p;
}
function fontCSS(font, px) {
  return { hero: `${px}px "Black Ops One"`, type: `${px}px "Special Elite"`, tape: `700 ${px}px Oswald`, label: `500 ${px}px Oswald`, hand: `700 ${px}px Caveat` }[font || 'type'];
}
function capRatio(font) { // cap height / font size, measured
  const c = canvas(10, 10).getContext('2d'); c.font = fontCSS(font, 100); return c.measureText('H').actualBoundingBoxAscent / 100;
}

// ---------------------------------------------------------------- procedural textures
function noiseCanvas(size, seed, opts) {
  const r = mulberry32(seed), c = canvas(size, size), x = c.getContext('2d');
  x.fillStyle = `rgb(${opts.base},${opts.base},${opts.base})`; x.fillRect(0, 0, size, size);
  // soft blotches
  for (let i = 0; i < opts.blobs; i++) {
    const px = r() * size, py = r() * size, rad = size * (0.02 + r() * opts.blobR), v = r() < 0.5 ? 0 : 255;
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, rad);
      g.addColorStop(0, `rgba(${v},${v},${v},${opts.blobA * r()})`); g.addColorStop(1, `rgba(${v},${v},${v},0)`);
      x.fillStyle = g; x.fillRect(px + ox - rad, py + oy - rad, rad * 2, rad * 2);
    }
  }
  // scratches
  for (let i = 0; i < opts.scratches; i++) {
    const px = r() * size, py = r() * size, a = r() * Math.PI, l = size * (0.02 + r() * 0.15), v = r() < 0.6 ? 255 : 0;
    x.strokeStyle = `rgba(${v},${v},${v},${0.05 + r() * 0.12})`; x.lineWidth = 0.6 + r();
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * 0.5 + (r() - .5) * 8, py + Math.sin(a) * l * 0.5 + (r() - .5) * 8, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  // per-pixel grain
  const id = x.getImageData(0, 0, size, size), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * opts.grain; d[i] = clamp(d[i] + n, 0, 255); d[i + 1] = clamp(d[i + 1] + n * (opts.fiber ? 0.6 : 1) + (opts.fiber ? (r() - .5) * 10 : 0), 0, 255); d[i + 2] = clamp(d[i + 2] + n, 0, 255); }
  x.putImageData(id, 0, 0);
  if (opts.blur) { const c2 = canvas(size, size), x2 = c2.getContext('2d'); x2.filter = `blur(${opts.blur}px)`; x2.drawImage(c, 0, 0); return c2; }
  return c;
}

function softRect(w = 256, h = 256, feather = 0.18) { // contact shadow alpha
  const c = canvas(w, h), x = c.getContext('2d'); x.filter = `blur(${Math.round(w * feather * 0.5)}px)`;
  x.fillStyle = '#fff'; const m = w * feather; x.fillRect(m, m * h / w, w - 2 * m, h - 2 * m * h / w); return c;
}

// ---------------------------------------------------------------- shaders
const VS = `varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;
const LAMP = { lamp: { value: new THREE.Vector2() }, lampR: { value: 6 } };
function paperMat(map, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: map }, paper: { value: TEX.paper }, lamp: LAMP.lamp, lampR: LAMP.lampR,
      dim: { value: o.dim || 0 }, opacity: { value: o.opacity ?? 1 }, desat: { value: o.desat ?? 0.93 }, sepia: { value: o.sepia ?? 0.75 },
      contrast: { value: o.contrast ?? 1.18 }, bright: { value: o.bright ?? 0 }, paperAmt: { value: o.paperAmt ?? 0.35 }, lift: { value: o.lift ?? 0 },
    },
    vertexShader: VS, transparent: true, depthWrite: o.depthWrite ?? true, side: THREE.DoubleSide,
    blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    fragmentShader: `uniform sampler2D map,paper; uniform vec2 lamp; uniform float lampR,dim,opacity,desat,sepia,contrast,bright,paperAmt,lift;
      varying vec2 vUv; varying vec3 vW;
      void main(){ vec4 c=texture2D(map,vUv); if(c.a*opacity<0.01) discard; vec3 col=c.rgb;
        float l=dot(col,vec3(.299,.587,.114)); float lc=clamp((l-.5)*contrast+.5+bright,0.,1.);
        vec3 tone=mix(vec3(.085,.07,.06),vec3(1.,.945,.83),lc); vec3 g=mix(vec3(lc),tone,sepia); col=mix(col,g,desat);
        float pn=texture2D(paper,vW.xy/2.7).r*2.; col*=mix(1.,pn,paperAmt);
        float d=distance(vW.xy,lamp); float L=mix(.36,.97,exp(-d*d/(2.*lampR*lampR)));
        col=col*L*(1.-dim)+lift; gl_FragColor=vec4(col,c.a*opacity); }`,
  });
}

// ---------------------------------------------------------------- object builders
// coordinates: x,y in frame units (1 = visible height at the beat's base distance), relative to beat centre; z in world units
class Obj {
  constructor(spec, beat) {
    this.s = spec; this.b = beat; this.vh = VH(beat.dist); this.group = new THREE.Group();
    this.group.position.set(beat.center[0] + (spec.x || 0) * this.vh, beat.center[1] + (spec.y || 0) * this.vh, spec.z ?? 0.02);
    this.group.rotation.z = THREE.MathUtils.degToRad(spec.rot || 0);
    this.life = spec.life || [beat.t0 - 1.2, beat.t1 + 1.2];
    scene.add(this.group);
  }
  plane(w, h, mat, z = 0, renderOrder = 0) { const m = new THREE.Mesh(geo, mat); m.scale.set(w, h, 1); m.position.z = z; m.renderOrder = renderOrder; this.group.add(m); return m; }
  shadow(w, h, lift = 1) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: TEX.shadow, color: 0x000000, transparent: true, opacity: 0.62, depthWrite: false }));
    m.material.alphaMap = TEX.shadow; m.scale.set(w * 1.1, h * 1.1, 1);
    // shadow falls away from the lamp (down-right) and sits just under the object
    const zz = this.group.position.z; m.position.set(0.05 * lift + zz * 0.06, -0.07 * lift - zz * 0.08, -Math.min(zz, 0.012) + 0.001);
    m.renderOrder = -1; this.group.add(m); return m;
  }
  visibleAt(t) { return t >= this.life[0] && t <= this.life[1]; }
  update(t) { }
}

// --- photo print or film frame (stills and "moving photos")
class Print extends Obj {
  async build() {
    const s = this.s, a = D.assets[s.asset];
    this.isVideo = a.type === 'video';
    const first = this.isVideo ? await loadImg(`${a.dir}/0001.jpg`) : await loadImg(a.src);
    const cr = s.crop || [0, 0, 1, 1];
    const sw = first.width * (cr[2] - cr[0]), sh = first.height * (cr[3] - cr[1]);
    const aspect = sw / sh, maxPx = 1700;
    const pw = aspect >= 1 ? maxPx : maxPx * aspect, ph = aspect >= 1 ? maxPx / aspect : maxPx;
    const film = !!s.film, b = (s.border ?? (film ? 0.11 : 0.055)) * Math.min(pw, ph);
    const bx = film ? b * 0.35 : b, by = film ? b : b;
    this.layout = { pw, ph, bx, by, cr, cw: pw + 2 * bx, ch: ph + 2 * by };
    this.base = canvas(this.layout.cw, this.layout.ch); this.drawFrame(this.base.getContext('2d'));
    this.c = canvas(this.layout.cw, this.layout.ch); this.x = this.c.getContext('2d');
    this.lastKey = null; this.drawPhoto(first);
    this.tex = ctex(this.c);
    const hW = (s.h || 0.6) * this.vh, wW = hW * this.layout.cw / this.layout.ph * (this.layout.ph / this.layout.ch) * (this.layout.ch / this.layout.ph);
    // world height includes border: s.h refers to the whole print height
    this.wh = hW; this.ww = hW * this.layout.cw / this.layout.ch;
    const g = s.grade || {};
    this.mat = paperMat(this.tex, { dim: s.dim || 0, desat: g.desat, sepia: g.sepia, contrast: g.contrast, bright: g.bright });
    this.shadow(this.ww, this.wh, 1 + (this.group.position.z) * 2);
    this.mesh = this.plane(this.ww, this.wh, this.mat, 0, 1);
    // red overlays drawn on top of the print (regions, ilus tag) — not graded
    if (s.regions || s.ilus) {
      this.oc = canvas(this.layout.cw / 2, this.layout.ch / 2); this.ox = this.oc.getContext('2d'); this.otex = ctex(this.oc);
      this.omat = paperMat(this.otex, { desat: 0, paperAmt: 0.15, depthWrite: false, dim: s.dim || 0 }); this.plane(this.ww, this.wh, this.omat, 0.004, 2);
      this.okey = null;
    }
    if (s.overlay) {
      const oa = D.assets[s.overlay.asset]; this.ovA = oa; this.ovc = canvas(960, 960 * this.layout.ph / this.layout.pw); this.ovx = this.ovc.getContext('2d');
      this.ovtex = ctex(this.ovc); this.ovmat = paperMat(this.ovtex, { additive: true, opacity: s.overlay.opacity ?? 0.5, depthWrite: false, contrast: 1.4 });
      const fx = this.layout.pw / this.layout.cw, fy = this.layout.ph / this.layout.ch; this.plane(this.ww * fx, this.wh * fy, this.ovmat, 0.003, 2);
    }
  }
  drawFrame(x) {
    const L = this.layout, r = mulberry32(hashStr(this.s.asset));
    if (this.s.film) {
      x.fillStyle = '#100f0e'; x.fillRect(0, 0, L.cw, L.ch);
      const hs = L.by * 0.34, n = Math.round(L.cw / (hs * 2.2));
      x.fillStyle = '#d9d2c2';
      for (let i = 0; i < n; i++) for (const yy of [L.by * 0.33, L.ch - L.by * 0.33 - hs]) {
        const xx = (i + 0.5) * L.cw / n - hs * 0.6; roundRect(x, xx, yy, hs * 1.2, hs, hs * 0.2); x.fill();
      }
    } else {
      x.fillStyle = '#efe9db'; x.fillRect(0, 0, L.cw, L.ch);
      for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(${r() < .5 ? '90,70,50' : '255,255,255'},${r() * 0.05})`; x.fillRect(r() * L.cw, r() * L.ch, 1 + r() * 3, 1 + r() * 3); }
      const g = x.createRadialGradient(L.cw / 2, L.ch / 2, Math.min(L.cw, L.ch) * 0.3, L.cw / 2, L.ch / 2, Math.max(L.cw, L.ch) * 0.75);
      g.addColorStop(0, 'rgba(120,90,50,0)'); g.addColorStop(1, 'rgba(120,90,50,0.22)'); x.fillStyle = g; x.fillRect(0, 0, L.cw, L.ch);
    }
  }
  drawPhoto(img) {
    const L = this.layout, x = this.x, cr = L.cr;
    x.drawImage(this.base, 0, 0);
    x.drawImage(img, cr[0] * img.width, cr[1] * img.height, (cr[2] - cr[0]) * img.width, (cr[3] - cr[1]) * img.height, L.bx, L.by, L.pw, L.ph);
    // inner edge burn, like an old print
    const g = x.createLinearGradient(L.bx, 0, L.bx + L.pw, 0);
    x.save(); x.globalCompositeOperation = 'multiply';
    const rg = x.createRadialGradient(L.bx + L.pw / 2, L.by + L.ph / 2, Math.min(L.pw, L.ph) * 0.35, L.bx + L.pw / 2, L.by + L.ph / 2, Math.hypot(L.pw, L.ph) * 0.6);
    rg.addColorStop(0, '#fff'); rg.addColorStop(1, '#b9b0a0'); x.fillStyle = rg; x.fillRect(L.bx, L.by, L.pw, L.ph); x.restore();
  }
  videoFrameAt(t) {
    const a = D.assets[this.s.asset], v = this.s.video || {};
    const t0 = v.t0 ?? this.b.t0 - 0.5, rate = v.rate ?? 0.85;
    let k = Math.floor((t - t0) * rate * a.fps); k = ((k % a.count) + a.count) % a.count;   // loop
    return `${a.dir}/${String(k + 1).padStart(4, '0')}.jpg`;
  }
  needs(t) { const n = []; if (this.isVideo) n.push(this.videoFrameAt(t)); if (this.s.overlay) n.push(this.overlayFrameAt(t)); return n; }
  overlayFrameAt(t) { const a = this.ovA; let k = Math.floor((t - this.b.t0 + 1) * 0.9 * a.fps); k = ((k % a.count) + a.count) % a.count; return `${a.dir}/${String(k + 1).padStart(4, '0')}.jpg`; }
  async update(t) {
    const s = this.s;
    if (this.isVideo) { const f = this.videoFrameAt(t); if (f !== this.lastKey) { this.drawPhoto(await loadImg(f)); this.tex.needsUpdate = true; this.lastKey = f; } }
    if (s.overlay) { const f = this.overlayFrameAt(t); if (f !== this.ovKey) { const im = await loadImg(f); this.ovx.drawImage(im, 0, 0, this.ovc.width, this.ovc.height); this.ovtex.needsUpdate = true; this.ovKey = f; } }
    if (s.drain) { const p = ease(clamp((t - s.drain.t) / (s.drain.dur || 1))); this.mat.uniforms.contrast.value = 1.18 - 0.55 * p; this.mat.uniforms.bright.value = -0.08 * p; this.mat.uniforms.sepia.value = 0.75 * (1 - p); }
    if (s.dimTo) { const p = ease(clamp((t - s.dimTo.t) / (s.dimTo.dur || 0.6))); this.mat.uniforms.dim.value = (s.dim || 0) + (s.dimTo.v - (s.dim || 0)) * p; }
    if (this.oc) {
      const prog = (s.regions || []).map(r => Math.round(clamp((t - r.t) / (r.dur || 0.6)) * (r.out !== undefined ? 1 - clamp((t - r.out) / 0.6) : 1) * 30));
      const key = prog.join(',');
      if (key !== this.okey) {
        const x = this.ox, L = this.layout, sc = 0.5; x.clearRect(0, 0, this.oc.width, this.oc.height);
        (s.regions || []).forEach((r, i) => {
          const p = prog[i] / 30; if (p <= 0) return;
          x.save(); x.beginPath(); r.poly.forEach(([u, v], j) => { const px = (L.bx + u * L.pw) * sc, py = (L.by + v * L.ph) * sc; j ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); x.clip();
          // wash sweeps in from the left like ink soaking in
          const xs = Math.min(...r.poly.map(q => q[0])), xe = Math.max(...r.poly.map(q => q[0]));
          const cut = (L.bx + (xs + (xe - xs) * (r.sweep === false ? 1 : p)) * L.pw) * sc;
          x.globalAlpha = (r.alpha ?? 0.55) * (r.sweep === false ? p : 1); x.fillStyle = RED; x.fillRect(0, 0, cut, this.oc.height); x.restore();
          x.save(); x.globalAlpha = 0.9 * p; x.strokeStyle = RED; x.lineWidth = 3; x.beginPath(); r.poly.forEach(([u, v], j) => { const px = (L.bx + u * L.pw) * sc, py = (L.by + v * L.ph) * sc; j ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); x.stroke(); x.restore();
        });
        if (s.ilus) {
          const fsz = 0.035 / (s.h || 0.6) * L.ch * sc / capRatioCache('tape');
          x.font = fontCSS('tape', fsz); const tw = x.measureText('ILUSTRASI').width, pad = fsz * 0.3;
          const bx = (L.bx + L.pw) * sc - tw - pad * 3, by = (L.by + L.ph) * sc - fsz - pad * 2.4;
          x.fillStyle = 'rgba(236,229,213,0.92)'; x.fillRect(bx, by, tw + pad * 2, fsz + pad * 1.2);
          x.strokeStyle = RED; x.lineWidth = Math.max(2, fsz * 0.08); x.strokeRect(bx, by, tw + pad * 2, fsz + pad * 1.2);
          x.fillStyle = RED; x.textBaseline = 'top'; x.fillText('ILUSTRASI', bx + pad, by + pad * 0.45);
        }
        this.otex.needsUpdate = true; this.okey = key;
      }
    }
  }
}
const _cap = {}; function capRatioCache(f) { return _cap[f] ??= capRatio(f); }
function hashStr(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function roundRect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

// --- code-drawn paper documents (body copy = soft grey lines, never fake words)
class Doc extends Obj {
  build() {
    const s = this.s, ww = (s.w || 0.5) * this.vh, wh = (s.h || 0.65) * this.vh, px = 1400, py = px * wh / ww;
    const c = canvas(px, py), x = c.getContext('2d'), r = mulberry32(s.seed || hashStr(this.b.id + s.kind));
    const paper = { card: '#e9e2cf', ledger: '#ddd0b0', decree: '#e3d8bd', typed: '#e6dfcc', notice: '#d8cba8', cert: '#e8dfc6', roster: '#e4dcc6', folder: '#c9a86b', petition: '#dccfae' }[s.kind] || '#e3dac4';
    x.fillStyle = paper; x.fillRect(0, 0, px, py);
    // stains, fibres, folds
    for (let i = 0; i < 8; i++) { const sx = r() * px, sy = r() * py; const g = x.createRadialGradient(sx, sy, 0, sx, sy, px * (0.1 + r() * 0.4)); g.addColorStop(0, `rgba(110,80,40,${0.05 + r() * 0.08})`); g.addColorStop(1, 'rgba(110,80,40,0)'); x.fillStyle = g; x.fillRect(0, 0, px, py); }
    for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${r() < .5 ? '80,60,40' : '255,250,235'},${r() * 0.07})`; x.fillRect(r() * px, r() * py, 1 + r() * 2, 1 + r() * 2); }
    if (s.fold !== false) { x.strokeStyle = 'rgba(90,70,40,0.18)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, py * 0.5); x.lineTo(px, py * 0.5 + (r() - .5) * 10); x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, py * 0.5 + 3); x.lineTo(px, py * 0.5 + 3); x.stroke(); }
    const ink = 'rgba(60,52,44,', m = px * 0.09;
    const lines = (y0, y1, gap, lw, wavy) => { for (let y = y0; y < y1; y += gap) { const len = (0.55 + r() * 0.45) * (px - 2 * m); x.strokeStyle = ink + (0.22 + r() * 0.12) + ')'; x.lineWidth = lw; x.beginPath(); x.moveTo(m, y); if (wavy) { for (let xx = m; xx < m + len; xx += 18) x.lineTo(xx, y + Math.sin(xx * 0.09 + r() * 6) * lw * 0.9); } else { let xx = m; while (xx < m + len) { const seg = 30 + r() * 120; x.moveTo(xx, y); x.lineTo(Math.min(m + len, xx + seg), y); xx += seg + 14 + r() * 10; } } x.stroke(); } };
    if (s.kind === 'card') { x.strokeStyle = 'rgba(70,90,120,0.22)'; x.lineWidth = 2; for (let y = py * 0.22; y < py; y += py * 0.085) { x.beginPath(); x.moveTo(0, y); x.lineTo(px, y); x.stroke(); } x.strokeStyle = 'rgba(80,60,50,0.35)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, py * 0.15); x.lineTo(px, py * 0.15); x.stroke(); }
    else if (s.kind === 'ledger') { x.strokeStyle = 'rgba(70,55,40,0.3)'; x.lineWidth = 2; for (const cx of [0.2, 0.62, 0.8]) { x.beginPath(); x.moveTo(px * cx, py * 0.12); x.lineTo(px * cx, py * 0.95); x.stroke(); } x.lineWidth = 1.5; for (let y = py * 0.16; y < py * 0.95; y += py * 0.05) { x.beginPath(); x.moveTo(m * 0.5, y); x.lineTo(px - m * 0.5, y); x.stroke(); } lines(py * 0.06, py * 0.1, 40, 7, true); for (let y = py * 0.19; y < py * 0.93; y += py * 0.05) { if (r() < 0.25) continue; x.strokeStyle = ink + '0.3)'; x.lineWidth = 4; x.beginPath(); const x0 = px * 0.22, x1 = x0 + px * (0.15 + r() * 0.22); for (let xx = x0; xx < x1; xx += 10) x.lineTo(xx, y - 10 + Math.sin(xx * 0.15 + y) * 4); x.stroke(); } }
    else if (s.kind === 'decree' || s.kind === 'cert') { x.fillStyle = ink + '0.3)'; x.fillRect(px * 0.3, py * 0.07, px * 0.4, py * 0.022); x.fillRect(px * 0.22, py * 0.115, px * 0.56, py * 0.012); lines(py * 0.2, py * 0.78, py * 0.034, 6, false); x.strokeStyle = ink + '0.25)'; x.lineWidth = 5; x.beginPath(); x.arc(px * 0.78, py * 0.87, px * 0.07, 0, 7); x.stroke(); x.beginPath(); x.arc(px * 0.78, py * 0.87, px * 0.055, 0, 7); x.stroke(); x.lineWidth = 3; x.beginPath(); x.moveTo(px * 0.12, py * 0.9); for (let xx = px * 0.12; xx < px * 0.45; xx += 12) x.lineTo(xx, py * 0.9 + Math.sin(xx * 0.08) * 12); x.stroke(); }
    else if (s.kind === 'typed' || s.kind === 'roster' || s.kind === 'notice' || s.kind === 'petition') { x.fillStyle = ink + '0.32)'; x.fillRect(m, py * 0.07, px * 0.35, py * 0.02); lines(py * 0.16, py * 0.9, py * 0.04, 6, s.kind === 'petition'); if (s.kind === 'petition') { for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(60,45,35,${0.25 + r() * 0.2})`; x.beginPath(); x.ellipse(m + r() * (px - 2 * m), py * (0.55 + r() * 0.38), 16, 22, r() * 3, 0, 7); x.fill(); } } }
    if (s.torn) { x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.moveTo(0, py); for (let xx = 0; xx <= px; xx += 25) x.lineTo(xx, py - 10 - r() * 26); x.lineTo(px, py); x.fill(); x.globalCompositeOperation = 'source-over'; }
    (s.fields || []).forEach(f => {
      const fsz = (f.size || 0.04) * this.vh / wh * py / capRatioCache(f.font || 'type');
      x.font = fontCSS(f.font || 'type', fsz); x.fillStyle = f.color === 'red' ? RED : '#1f1a15'; x.textAlign = f.align || 'left'; x.textBaseline = 'alphabetic';
      x.fillText(f.text, (0.5 + (f.x || 0) / (s.w || 0.5)) * px, (0.5 - (f.y || 0) / (s.h || 0.65)) * py);
    });
    this.tex = ctex(c); this.ww = ww; this.wh = wh;
    this.mat = paperMat(this.tex, { dim: s.dim || 0, desat: 0.35, sepia: 0.3, contrast: 1.05, paperAmt: 0.45 });
    this.shadow(ww, wh, 1 + this.group.position.z * 2); this.plane(ww, wh, this.mat, 0, 1);
  }
  update(t) { const s = this.s; if (s.dimTo) { const p = ease(clamp((t - s.dimTo.t) / (s.dimTo.dur || 0.6))); this.mat.uniforms.dim.value = (s.dim || 0) + (s.dimTo.v - (s.dim || 0)) * p; } }
}

// --- dark grunge typewriter card
class Card extends Obj {
  build() {
    const s = this.s, ww = (s.w || 3.2) * this.vh, wh = (s.h || 1.8) * this.vh;
    const c = noiseCanvas(1024, hashStr('card' + this.b.id), { base: 24, blobs: 70, blobR: 0.25, blobA: 0.12, scratches: 260, grain: 22, blur: 0.4 });
    const x = c.getContext('2d'); const g = x.createRadialGradient(512, 512, 120, 512, 512, 760); g.addColorStop(0, 'rgba(255,240,220,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); x.fillStyle = g; x.fillRect(0, 0, 1024, 1024);
    this.mat = paperMat(ctex(c), { desat: 0.5, sepia: 0.6, contrast: 1.1, paperAmt: 0.25, bright: -0.03 });
    this.plane(ww, wh, this.mat, 0, 0);
  }
}

// --- text pieces: typewriter, tape label, stamp, hero title, handwriting
class TextObj extends Obj {
  build() {
    const s = this.s, kind = s.type;
    this.font = s.font || { type: 'type', tape: 'tape', stamp: 'hero', title: 'hero', hand: 'hand' }[kind];
    this.capW = (s.size || 0.05) * this.vh;                         // cap height in world units
    const fpx = 160, cr = capRatioCache(this.font), fs = fpx / cr;    // render at 160px cap height
    const mx = canvas(10, 10).getContext('2d'); mx.font = fontCSS(this.font, fs);
    const lines = String(s.text).split('\n'); const ls = s.letterSpacing || (kind === 'tape' ? 0.04 : kind === 'title' ? 0.02 : 0);
    const meas = l => mx.measureText(l).width + ls * fs * Math.max(0, l.length - 1);
    const tw = Math.max(...lines.map(meas)), lh = fs * (s.lineHeight || 1.25);
    let subH = 0; if (s.sub) { this.subFs = fs * 0.36; subH = this.subFs * 1.9; }
    const padX = kind === 'tape' ? fs * 0.55 : kind === 'stamp' ? fs * 0.45 : fs * 0.15, padY = kind === 'tape' ? fs * 0.32 : kind === 'stamp' ? fs * 0.32 : fs * 0.15;
    const cw = tw + padX * 2 + (kind === 'type' ? fs * 0.7 : 0), ch = lh * (lines.length - 1) + fs * 1.05 + padY * 2 + subH;
    this.c = canvas(cw, ch); this.x = this.c.getContext('2d'); this.fs = fs; this.lines = lines; this.ls = ls; this.lh = lh; this.padX = padX; this.padY = padY; this.tw = tw; this.meas = meas;
    this.tex = ctex(this.c);
    const scale = this.capW / fpx; this.ww = cw * scale; this.wh = ch * scale;
    const red = s.color === 'red' || kind === 'stamp';
    this.mat = paperMat(this.tex, { desat: red ? 0 : (kind === 'tape' ? 0.4 : 0.2), sepia: 0.3, contrast: 1, paperAmt: kind === 'tape' ? 0.3 : 0.12, depthWrite: false, dim: s.dim || 0 });
    this.mesh = this.plane(this.ww, this.wh, this.mat, 0, 5);
    if (kind === 'tape') this.shadow(this.ww, this.wh, 0.5);
    this.mesh.position.x = s.align === 'left' ? this.ww / 2 : s.align === 'right' ? -this.ww / 2 : 0;
    this.rng = mulberry32(hashStr(s.text + this.b.id)); this.grit = this.makeGrit(cw, ch);
    this.key = null;
  }
  makeGrit(w, h) { const c = canvas(w, h), x = c.getContext('2d'), r = this.rng; for (let i = 0; i < w * h / 900; i++) { x.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.7})`; const s = 1 + r() * (this.s.type === 'stamp' ? 9 : 4); x.beginPath(); x.arc(r() * w, r() * h, s, 0, 7); x.fill(); } return c; }
  charsAt(t) {
    const s = this.s, total = s.text.length;
    if (s.words) { // per-word timing: [[start,end],...] one per whitespace-separated word
      let n = 0, idx = 0; const parts = s.text.split(/(\s+)/);
      for (const p of parts) { if (/^\s+$/.test(p)) { if (t >= (s.words[Math.max(0, idx - 1)] || [0, 0])[1]) n += p.length; else break; continue; }
        const [a, b] = s.words[idx] || [s.t1, s.t1]; idx++; const k = Math.floor(clamp((t - a) / Math.max(0.05, b - a)) * p.length + 1e-6); n += k; if (k < p.length) break; }
      return Math.min(total, n);
    }
    if (s.t0 === undefined) return total;
    return Math.floor(clamp((t - s.t0) / Math.max(0.05, s.t1 - s.t0)) * total + 1e-6);
  }
  draw(n, cursorOn) {
    const s = this.s, x = this.x, kind = s.type, fs = this.fs; x.clearRect(0, 0, this.c.width, this.c.height);
    x.font = fontCSS(this.font, fs); x.textBaseline = 'alphabetic';
    if (kind === 'tape') { // torn paper-tape strip
      const r = mulberry32(hashStr('tape' + s.text)), w = this.c.width, h = this.c.height; x.fillStyle = s.style === 'kraft' ? '#c9ae7e' : '#ebe4cf';
      x.beginPath(); x.moveTo(0, 0); for (let y = 0; y <= h; y += h / 9) x.lineTo(r() * fs * 0.12, y); for (let xx = 0; xx <= w; xx += w / 40) x.lineTo(xx, h - r() * fs * 0.05); for (let y = h; y >= 0; y -= h / 9) x.lineTo(w - r() * fs * 0.12, y); for (let xx = w; xx >= 0; xx -= w / 40) x.lineTo(xx, r() * fs * 0.05); x.closePath(); x.fill();
      x.fillStyle = 'rgba(120,95,60,0.12)'; for (let i = 0; i < 300; i++) x.fillRect(r() * w, r() * h, 2, 2);
    }
    const col = kind === 'stamp' || s.color === 'red' ? RED : s.color === 'ink' || kind === 'tape' ? '#1b1712' : '#e9e3d3';
    let shown = n, y = this.padY + fs * 0.95; let lastX = this.padX, lastY = y;
    this.lines.forEach((line, li) => {
      const take = Math.max(0, Math.min(line.length, shown)); shown -= line.length + 1;
      const lw = this.meas(line); let xx = this.padX + (s.align === 'left' || kind === 'type' && s.align !== 'center' ? 0 : (this.tw - lw) / 2);
      for (let i = 0; i < take; i++) {
        const ch = line[i], jit = kind === 'type' ? (mulberry32(li * 131 + i * 7 + 3)() - .5) * fs * 0.035 : 0;
        x.fillStyle = col; x.globalAlpha = kind === 'type' ? 0.82 + mulberry32(i * 17 + li)() * 0.18 : 1; x.fillText(ch, xx, y + jit);
        if (kind === 'type' && !s.color) { x.globalAlpha = 0.25; x.fillText(ch, xx + fs * 0.012, y + jit + fs * 0.01); }
        xx += x.measureText(ch).width + this.ls * fs;
      }
      x.globalAlpha = 1; if (take > 0 || li === 0) { lastX = xx; lastY = y; }
      y += this.lh;
    });
    if (s.sub) { x.font = fontCSS('type', this.subFs); x.fillStyle = s.subColor === 'red' ? RED : col; x.textAlign = 'center'; const sp = this.subFs * 0.45; const sub = s.sub.split('').join(String.fromCharCode(8202).repeat(3));
      x.fillText(sub, this.c.width / 2, y - this.lh + fs * 0.25 + this.subFs * 1.5); x.textAlign = 'left'; }
    if (kind === 'stamp') { x.strokeStyle = RED; x.lineWidth = fs * 0.07; roundRect(x, fs * 0.12, fs * 0.12, this.c.width - fs * 0.24, this.c.height - fs * 0.24, fs * 0.08); x.stroke(); x.lineWidth = fs * 0.025; roundRect(x, fs * 0.22, fs * 0.22, this.c.width - fs * 0.44, this.c.height - fs * 0.44, fs * 0.05); x.stroke(); }
    if (cursorOn) { x.fillStyle = col; x.fillRect(lastX + fs * 0.05, lastY - fs * 0.75, fs * 0.08, fs * 0.95); }
    if (kind === 'stamp' || kind === 'title' || kind === 'type') { x.globalCompositeOperation = 'destination-out'; x.globalAlpha = kind === 'stamp' ? 0.75 : 0.45; x.drawImage(this.grit, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
  }
  update(t) {
    const s = this.s, kind = s.type, fps = FPS;
    let n = s.text.length, cursor = false;
    if (kind === 'type') { n = this.charsAt(t); const done = n >= s.text.length; cursor = s.cursor !== false && (!done || t < (s.cursorUntil ?? (s.t1 ?? 0) + 1.5)) && (Math.floor(t * 2.2) % 2 === 0 || !done); }
    const key = n + '|' + cursor; if (key !== this.key) { this.draw(n, cursor); this.tex.needsUpdate = true; this.key = key; }
    // entrance animations
    let sc = 1, op = 1;
    const at = s.t ?? this.b.t0;
    if (kind === 'stamp') { const k = (t - at) * fps; op = k < 0 ? 0 : 0.93; sc = k < 0 ? 1.4 : 1 + 0.4 * (1 - easeOut(clamp(k / 3))); }
    else if (kind === 'tape') { const k = (t - at) * fps; op = clamp(k / 2); sc = 1 + 0.14 * (1 - easeOut(clamp(k / 4))); }
    else if (kind === 'title') { const k = (t - at) * fps; op = clamp(k / 3); sc = 1 + 0.22 * (1 - easeOut(clamp(k / 6))); }
    else if (kind === 'hand') { const k = (t - at) / 0.6; op = clamp(k); }
    if (s.out !== undefined) op *= 1 - clamp((t - s.out) / 0.4);
    this.mesh.scale.set(this.ww * sc, this.wh * sc, 1); this.mat.uniforms.opacity.value = op;
    if (s.dimTo) { const p = ease(clamp((t - s.dimTo.t) / (s.dimTo.dur || 0.6))); this.mat.uniforms.dim.value = (s.dim || 0) + (s.dimTo.v - (s.dim || 0)) * p; }
  }
}

// --- red marker strokes drawn on in 0.4-0.6 s
class Mark extends Obj {
  build() {
    const s = this.s; this.ww = (s.w || 0.3) * this.vh; this.wh = (s.h || 0.3) * this.vh;
    const px = 900, py = Math.max(64, px * this.wh / this.ww); this.c = canvas(px, py); this.x = this.c.getContext('2d'); this.tex = ctex(this.c);
    this.mat = paperMat(this.tex, { desat: 0, paperAmt: 0.1, depthWrite: false }); this.plane(this.ww, this.wh, this.mat, 0, 6); this.key = null;
    this.r = mulberry32(hashStr(this.b.id + s.kind + (s.x || 0)));
  }
  path() { // list of strokes; each stroke = array of [x,y] in canvas px
    const s = this.s, W_ = this.c.width, H_ = this.c.height, r = mulberry32(hashStr(this.b.id + s.kind + (s.x || 0) + (s.y || 0))), lw = this.lw();
    const P = []; const m = lw * 1.2;
    if (s.kind === 'circle') { const cx = W_ / 2, cy = H_ / 2, rx = W_ / 2 - m, ry = H_ / 2 - m, a0 = -2.2 + r() * 0.6, st = []; for (let i = 0; i <= 120; i++) { const a = a0 + i / 120 * Math.PI * 2 * 1.1, w = 1 + Math.sin(a * 3 + r()) * 0.025 - i / 120 * 0.05; st.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]); } P.push(st); }
    else if (s.kind === 'underline' || s.kind === 'strike' || s.kind === 'line') { const y = s.kind === 'underline' ? H_ * 0.62 : H_ / 2, st = []; for (let i = 0; i <= 40; i++) { const u = i / 40; st.push([m + u * (W_ - 2 * m), y + Math.sin(u * 5 + r() * 3) * H_ * 0.06 - (s.kind === 'strike' ? (u - 0.5) * H_ * 0.18 : 0)]); } P.push(st); }
    else if (s.kind === 'x') { P.push([[m, m], [W_ - m, H_ - m]]); P.push([[W_ - m, m], [m, H_ - m]]); }
    else if (s.kind === 'tick') { P.push([[m, H_ * 0.55], [W_ * 0.38, H_ - m], [W_ - m, m]]); }
    else if (s.kind === 'arrow' || s.kind === 'thread') {
      const [x0, y0] = s.from || [-0.45, 0], [x1, y1] = s.to || [0.45, 0]; const A = [(x0 + 0.5) * W_, (0.5 - y0) * H_], B = [(x1 + 0.5) * W_, (0.5 - y1) * H_];
      const bend = s.bend ?? (s.kind === 'thread' ? 0.03 : 0.18); const mx = (A[0] + B[0]) / 2 - (B[1] - A[1]) * bend, my = (A[1] + B[1]) / 2 + (B[0] - A[0]) * bend; const st = [];
      for (let i = 0; i <= 50; i++) { const u = i / 50; st.push([(1 - u) * (1 - u) * A[0] + 2 * (1 - u) * u * mx + u * u * B[0], (1 - u) * (1 - u) * A[1] + 2 * (1 - u) * u * my + u * u * B[1]]); }
      P.push(st);
      if (s.kind === 'arrow') { const e = st[50], p = st[44], ang = Math.atan2(e[1] - p[1], e[0] - p[0]), hl = lw * 5; P.push([[e[0] - Math.cos(ang - 0.5) * hl, e[1] - Math.sin(ang - 0.5) * hl], e, [e[0] - Math.cos(ang + 0.5) * hl, e[1] - Math.sin(ang + 0.5) * hl]]); }
    }
    else if (s.kind === 'bracket') { P.push([[m, H_ * 0.15], [m, m], [W_ - m, m], [W_ - m, H_ * 0.15]]); }
    else if (s.kind === 'tear') { const st = []; for (let i = 0; i <= 30; i++) { const u = i / 30; st.push([W_ / 2 + (r() - .5) * W_ * 0.6, m + u * (H_ - 2 * m)]); } P.push(st); }
    return P;
  }
  lw() { return (this.s.width || 0.012) * this.vh / this.wh * this.c.height; }
  draw(p) {
    const x = this.x, s = this.s; x.clearRect(0, 0, this.c.width, this.c.height); if (p <= 0) return;
    if (s.kind === 'q') { const fs = this.c.height * 0.9; x.font = fontCSS('hand', fs); x.fillStyle = RED; x.textAlign = 'center'; x.textBaseline = 'middle'; x.save(); x.beginPath(); x.rect(0, this.c.height * (1 - p) - 2, this.c.width, this.c.height * p + 4); x.clip(); x.fillText('?', this.c.width / 2, this.c.height / 2); x.restore(); return; }
    if (s.kind === 'tick3') return;
    const P = this.path(), lens = P.map(st => st.reduce((a, q, i) => i ? a + Math.hypot(q[0] - st[i - 1][0], q[1] - st[i - 1][1]) : 0, 0)), tot = lens.reduce((a, b) => a + b, 0);
    let rem = p * tot; const lw = this.lw();
    const thread = s.kind === 'thread', tear = s.kind === 'tear';
    for (let pass = 0; pass < (thread ? 1 : 2); pass++) {
      rem = p * tot;
      x.strokeStyle = tear ? 'rgba(25,18,12,0.9)' : RED; x.globalAlpha = pass ? 0.35 : (thread ? 0.95 : 0.88); x.lineWidth = thread ? lw * 0.4 : tear ? lw * 0.6 : lw * (pass ? 0.55 : 1); x.lineCap = 'round'; x.lineJoin = 'round';
      P.forEach((st, k) => { if (rem <= 0) return; x.beginPath(); x.moveTo(st[0][0] + pass * 2, st[0][1] - pass * 2); let acc = 0; for (let i = 1; i < st.length; i++) { const sl = Math.hypot(st[i][0] - st[i - 1][0], st[i][1] - st[i - 1][1]); if (acc + sl > rem) { const f = (rem - acc) / sl; x.lineTo(st[i - 1][0] + (st[i][0] - st[i - 1][0]) * f, st[i - 1][1] + (st[i][1] - st[i - 1][1]) * f); acc = rem; break; } acc += sl; x.lineTo(st[i][0] + pass * 2, st[i][1] - pass * 2); } x.stroke(); rem -= lens[k]; });
    }
    x.globalAlpha = 1;
    if (thread) { const st = P[0]; for (const q of [st[0], ...(p >= 1 ? [st[st.length - 1]] : [])]) { x.fillStyle = '#5a0f0b'; x.beginPath(); x.arc(q[0], q[1], lw * 1.6, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.arc(q[0] - lw * 0.5, q[1] - lw * 0.5, lw * 0.5, 0, 7); x.fill(); } }
  }
  update(t) { const s = this.s, p = Math.round(clamp((t - s.t) / (s.dur || 0.5)) * 60) / 60; const op = s.out !== undefined ? 1 - clamp((t - s.out) / 0.4) : 1; this.mat.uniforms.opacity.value = op; if (p !== this.key) { this.draw(easeOut(p)); this.tex.needsUpdate = true; this.key = p; } }
}

// --- black redaction bar that wipes away
class Redact extends Obj {
  build() { const s = this.s; this.ww = s.w * this.vh; this.wh = s.h * this.vh; const c = canvas(512, 96), x = c.getContext('2d'), r = mulberry32(7); x.fillStyle = '#0c0b0a'; x.beginPath(); x.moveTo(0, 6); for (let i = 0; i <= 20; i++) x.lineTo(i * 25.6, r() * 8); x.lineTo(512, 90); for (let i = 20; i >= 0; i--) x.lineTo(i * 25.6, 88 + r() * 8); x.fill(); this.mat = paperMat(ctex(c), { desat: 0, paperAmt: 0.2, depthWrite: false }); this.mesh = this.plane(this.ww, this.wh, this.mat, 0, 4); }
  update(t) { const s = this.s, p = ease(clamp((t - s.t) / (s.dur || 0.45))), w = this.ww * (1 - p); this.mesh.scale.x = Math.max(1e-4, w); this.mesh.position.x = this.ww / 2 - w / 2; this.mesh.visible = p < 1; }
}

// --- folder with a cover that swings open
class Folder extends Obj {
  build() {
    const s = this.s, ww = (s.w || 0.6) * this.vh, wh = (s.h || 0.75) * this.vh;
    const mk = (inside) => { const c = canvas(1000, 1000 * wh / ww), x = c.getContext('2d'), r = mulberry32(inside ? 3 : 5); x.fillStyle = inside ? '#bf9e62' : '#c8a96d'; x.fillRect(0, 0, c.width, c.height); for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(90,60,30,${r() * 0.08})`; x.fillRect(r() * c.width, r() * c.height, 2, 2); } if (!inside) { x.fillStyle = RED; x.fillRect(c.width * 0.62, 0, c.width * 0.3, c.height * 0.035); x.strokeStyle = 'rgba(60,40,20,0.35)'; x.lineWidth = 3; x.strokeRect(c.width * 0.12, c.height * 0.12, c.width * 0.5, c.height * 0.1); } else { x.fillStyle = '#e4dbc5'; x.fillRect(c.width * 0.08, c.height * 0.06, c.width * 0.84, c.height * 0.9); x.strokeStyle = 'rgba(60,52,44,0.3)'; x.lineWidth = 6; for (let y = c.height * 0.15; y < c.height * 0.9; y += c.height * 0.045) { x.beginPath(); x.moveTo(c.width * 0.15, y); x.lineTo(c.width * (0.45 + r() * 0.4), y); x.stroke(); } } return ctex(c); };
    this.shadow(ww, wh, 1.2); this.plane(ww, wh, paperMat(mk(true), { desat: 0.4, sepia: 0.4, contrast: 1 }), 0, 1);
    this.hinge = new THREE.Group(); this.hinge.position.set(-ww / 2, 0, 0.01); this.group.add(this.hinge);
    const cover = new THREE.Mesh(geo, paperMat(mk(false), { desat: 0.4, sepia: 0.4, contrast: 1 })); cover.scale.set(ww, wh, 1); cover.position.x = ww / 2; cover.renderOrder = 3; this.hinge.add(cover);
  }
  update(t) { const p = ease(clamp((t - this.s.t) / 0.7)); this.hinge.rotation.y = -p * Math.PI * 0.93; }
}

// --- old-paper map drawn from Natural Earth geometry, with animated red routes / fills / pulses
let WORLD = null;
class MapObj extends Obj {
  async build() {
    const s = this.s; if (!WORLD) { const tj = await (await fetch('/node_modules/world-atlas/countries-50m.json')).json(); WORLD = { countries: topojson.feature(tj, tj.objects.countries), land: topojson.feature(tj, tj.objects.land), borders: topojson.mesh(tj, tj.objects.countries, (a, b) => a !== b) }; }
    const ww = (s.w || 1.6) * this.vh, wh = (s.h || 0.95) * this.vh, px = 2400, py = Math.round(px * wh / ww);
    const [l0, b0, l1, b1] = s.bbox; const proj = d3.geoMercator().fitExtent([[0, 0], [px, py]], { type: 'MultiPoint', coordinates: [[l0, b0], [l1, b1]] });
    // keep the requested aspect: fitExtent letterboxes; recentre on bbox centre
    this.proj = proj; const path = d3.geoPath(proj);
    const c = canvas(px, py), x = c.getContext('2d'), r = mulberry32(hashStr(this.b.id + 'map'));
    x.fillStyle = '#d9c9a2'; x.fillRect(0, 0, px, py);
    for (let i = 0; i < 10; i++) { const sx = r() * px, sy = r() * py; const g = x.createRadialGradient(sx, sy, 0, sx, sy, px * (0.15 + r() * 0.4)); g.addColorStop(0, `rgba(110,75,35,${0.05 + r() * 0.1})`); g.addColorStop(1, 'rgba(110,75,35,0)'); x.fillStyle = g; x.fillRect(0, 0, px, py); }
    // graticule
    x.strokeStyle = 'rgba(80,60,40,0.18)'; x.lineWidth = 1.5; x.beginPath(); path.context(x)(d3.geoGraticule().step([10, 10])()); x.stroke();
    // engraved water lines around coasts
    for (const [w, a] of [[26, 0.06], [17, 0.08], [10, 0.1]]) { x.strokeStyle = `rgba(60,70,80,${a})`; x.lineWidth = w; x.beginPath(); path.context(x)(WORLD.land); x.stroke(); }
    x.fillStyle = '#e2d3ae'; x.beginPath(); path.context(x)(WORLD.land); x.fill();
    // land hatch tone
    x.save(); x.beginPath(); path.context(x)(WORLD.land); x.clip(); x.strokeStyle = 'rgba(90,70,45,0.10)'; x.lineWidth = 1.2; for (let k = -py; k < px; k += 9) { x.beginPath(); x.moveTo(k, py); x.lineTo(k + py, 0); x.stroke(); } x.restore();
    x.strokeStyle = 'rgba(70,55,40,0.4)'; x.setLineDash([6, 6]); x.lineWidth = 1.5; x.beginPath(); path.context(x)(WORLD.borders); x.stroke(); x.setLineDash([]);
    x.strokeStyle = '#2b2219'; x.lineWidth = 2.6; x.beginPath(); path.context(x)(WORLD.land); x.stroke();
    // frame
    x.strokeStyle = 'rgba(40,30,20,0.6)'; x.lineWidth = 6; x.strokeRect(18, 18, px - 36, py - 36); x.lineWidth = 2; x.strokeRect(32, 32, px - 64, py - 64);
    (s.labels || []).forEach(l => { const [lx, ly] = proj([l.lon, l.lat]); const fsz = (l.size || 0.045) * this.vh / wh * py / capRatioCache(l.font || 'hand'); x.save(); x.translate(lx, ly); x.rotate((l.rot || 0) * Math.PI / 180); x.font = fontCSS(l.font || 'hand', fsz); x.fillStyle = l.color === 'red' ? RED : 'rgba(40,30,22,0.85)'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(l.text, 0, 0); x.restore(); });
    this.ww = ww; this.wh = wh; this.px = px; this.py = py;
    this.mat = paperMat(ctex(c), { desat: 0.35, sepia: 0.4, contrast: 1.08, paperAmt: 0.4, dim: s.dim || 0 });
    this.shadow(ww, wh, 1.2); this.plane(ww, wh, this.mat, 0, 1);
    this.oc = canvas(px / 2, py / 2); this.ox = this.oc.getContext('2d'); this.otex = ctex(this.oc);
    this.omat = paperMat(this.otex, { desat: 0, paperAmt: 0.15, depthWrite: false }); this.plane(ww, wh, this.omat, 0.004, 2); this.key = null;
    this.feat = id => WORLD.countries.features.find(f => f.id === id);
  }
  update(t) {
    const s = this.s, q = v => Math.round(clamp(v) * 40) / 40;
    const st = { r: (s.routes || []).map(r => q((t - r.t0) / (r.t1 - r.t0))), f: (s.fills || []).map(f => q((t - f.t) / (f.dur || 0.8))), p: (s.pulses || []).map(p => t >= p.t ? Math.round(((t - p.t) % 1.4) * 20) : -1), g: (s.rings || []).map(g => q((t - g.t) / (g.dur || 2.5))) };
    const key = JSON.stringify(st); if (key === this.key) return; this.key = key;
    const x = this.ox, sc = 0.5, proj = this.proj; x.clearRect(0, 0, this.oc.width, this.oc.height);
    x.save(); x.scale(sc, sc); const path = d3.geoPath(proj, x);
    (s.fills || []).forEach((f, i) => { const p = st.f[i]; if (p <= 0) return; const ft = this.feat(f.id); if (!ft) return; x.globalAlpha = (f.alpha ?? 0.6) * p; x.fillStyle = RED; x.beginPath(); path(ft); x.fill(); x.globalAlpha = p; x.strokeStyle = RED; x.lineWidth = 4; x.beginPath(); path(ft); x.stroke(); });
    x.globalAlpha = 1;
    (s.routes || []).forEach((rt, i) => { const p = st.r[i]; if (p <= 0) return; const pts = []; for (let k = 0; k < rt.pts.length - 1; k++) { const ip = d3.geoInterpolate(rt.pts[k], rt.pts[k + 1]); for (let j = 0; j < 40; j++) pts.push(proj(ip(j / 40))); } pts.push(proj(rt.pts[rt.pts.length - 1]));
      const n = Math.max(2, Math.floor(p * pts.length)); x.strokeStyle = RED; x.lineWidth = 9; x.lineCap = 'round'; x.setLineDash(rt.dash ? [26, 18] : []); x.beginPath(); pts.slice(0, n).forEach((q2, j) => j ? x.lineTo(q2[0], q2[1]) : x.moveTo(q2[0], q2[1])); x.stroke(); x.setLineDash([]);
      const e = pts[n - 1]; x.fillStyle = RED; x.beginPath(); x.arc(e[0], e[1], 13, 0, 7); x.fill(); x.beginPath(); x.arc(pts[0][0], pts[0][1], 10, 0, 7); x.fill(); });
    (s.pulses || []).forEach((pu, i) => { if (st.p[i] < 0) return; const [cx, cy] = proj([pu.lon, pu.lat]), k = st.p[i] / 28; x.fillStyle = RED; x.beginPath(); x.arc(cx, cy, 16, 0, 7); x.fill(); x.strokeStyle = RED; x.globalAlpha = 1 - k; x.lineWidth = 5; x.beginPath(); x.arc(cx, cy, 16 + k * 90, 0, 7); x.stroke(); x.globalAlpha = 1; });
    (s.rings || []).forEach((g, i) => { const p = st.g[i]; if (p <= 0 || p >= 1) return; const [cx, cy] = proj([g.lon, g.lat]); for (let k = 0; k < 4; k++) { const pp = clamp(p * 1.6 - k * 0.2); if (pp <= 0) continue; x.globalAlpha = (1 - pp) * 0.85; x.strokeStyle = RED; x.lineWidth = 6; x.beginPath(); x.arc(cx, cy, 30 + pp * this.px * 0.45, 0, 7); x.stroke(); } x.globalAlpha = 1; });
    x.restore(); this.otex.needsUpdate = true;
  }
}

// --- paper-tape timeline
class Timeline extends Obj {
  build() {
    const s = this.s, ww = (s.w || 1.4) * this.vh, wh = (s.h || 0.16) * this.vh, px = 2400, py = px * wh / ww; const c = canvas(px, py), x = c.getContext('2d');
    x.fillStyle = '#e8e0c9'; x.fillRect(0, py * 0.1, px, py * 0.8); x.strokeStyle = '#2a231b'; x.lineWidth = 5; x.beginPath(); x.moveTo(px * 0.03, py * 0.5); x.lineTo(px * 0.97, py * 0.5); x.stroke();
    const fsz = (s.size || 0.045) * this.vh / wh * py / capRatioCache('tape'); x.font = fontCSS('tape', fsz); x.fillStyle = '#1b1712'; x.textAlign = 'center';
    (s.items || []).forEach(it => { const xx = px * (0.05 + it.pos * 0.9); x.lineWidth = 6; x.beginPath(); x.moveTo(xx, py * 0.4); x.lineTo(xx, py * 0.6); x.stroke(); x.fillText(it.label, xx, py * 0.36); });
    this.shadow(ww, wh, 0.8); this.plane(ww, wh, paperMat(ctex(c), { desat: 0.3, sepia: 0.3, contrast: 1.05, dim: s.dim || 0 }), 0, 1);
  }
}

const BUILDERS = { print: Print, doc: Doc, card: Card, type: TextObj, tape: TextObj, stamp: TextObj, title: TextObj, hand: TextObj, mark: Mark, redact: Redact, folder: Folder, map: MapObj, timeline: Timeline };

// ---------------------------------------------------------------- camera path
// pose = [tx, ty, tz, dist, az, tilt, roll]; C1-continuous Hermite through beat start/end poses
let KN = [];
function buildCamera() {
  KN = [];
  beats.forEach((b, i) => {
    const vh = VH(b.dist), c = b.cam;
    const S = [b.center[0] + (c.off?.[0] || 0) * vh, b.center[1] + (c.off?.[1] || 0) * vh, c.z ?? 0.1, b.dist, c.az ?? -90, c.tilt ?? 18, c.roll ?? 0];
    const E = [S[0] + (c.drift?.[0] || 0) * vh, S[1] + (c.drift?.[1] || 0) * vh, S[2], b.dist * (1 - (c.push ?? 0.08)), S[4] + (c.azDrift || 0), S[5] + (c.tiltDrift || 0), S[6] + (c.rollDrift || 0)];
    b.S = S; b.E = E;
  });
  beats.forEach((b, i) => {
    const tin = i === 0 ? 0 : b.trFrames / FPS / 2, nxt = beats[i + 1], tout = nxt ? nxt.trFrames / FPS / 2 : 0;
    b.ta = b.t0 + tin; b.td = nxt ? nxt.t0 - tout : D.duration;
    if (b.td - b.ta < 0.2) b.td = b.ta + 0.2;
  });
  beats.forEach((b, i) => {
    const dt = b.td - b.ta, last = i === beats.length - 1;
    const v = b.S.map((s, k) => (b.E[k] - s) / dt);
    KN.push({ t: b.ta, p: b.S, v }); KN.push({ t: b.td, p: b.E, v: last ? b.S.map(() => 0) : v });
  });
  // unwrap azimuth
  for (let i = 1; i < KN.length; i++) { while (KN[i].p[4] - KN[i - 1].p[4] > 180) KN[i].p[4] -= 360; while (KN[i].p[4] - KN[i - 1].p[4] < -180) KN[i].p[4] += 360; }
}
function poseAt(t) {
  if (t <= KN[0].t) return KN[0].p.map((p, k) => p + KN[0].v[k] * (t - KN[0].t));
  for (let i = 0; i < KN.length - 1; i++) {
    const a = KN[i], b = KN[i + 1]; if (t > b.t && i < KN.length - 2) continue;
    const dt = Math.max(1e-6, b.t - a.t), u = clamp((t - a.t) / dt), u2 = u * u, u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
    return a.p.map((p, k) => h00 * p + h10 * dt * a.v[k] + h01 * b.p[k] + h11 * dt * b.v[k]);
  }
  return KN[KN.length - 1].p;
}
function handheld(t) {
  const n = (f, ph) => Math.sin(t * f * 6.2832 + ph);
  return [n(0.21, 1.3) * 0.55 + n(0.47, 4.1) * 0.3 + n(0.93, 2.2) * 0.15, n(0.17, 0.7) * 0.55 + n(0.41, 5.3) * 0.3 + n(1.07, 3.9) * 0.15, n(0.13, 2.9) * 0.6 + n(0.37, 0.4) * 0.4];
}
function setCamera(t) {
  const p = poseAt(t), hh = handheld(t), vh = VH(p[3]), px = vh / H;
  let sx = 0, sy = 0; for (const s of shakes) { const k = t - s.t; if (k >= 0 && k < 0.32) { const a = (s.amp || 9) * px * Math.exp(-k * 14); sx += Math.sin(k * 115) * a; sy += Math.cos(k * 97) * a * 0.8; } }
  const tx = p[0] + hh[0] * 3 * px + sx, ty = p[1] + hh[1] * 3 * px + sy, tz = p[2];
  const az = THREE.MathUtils.degToRad(p[4]), tl = THREE.MathUtils.degToRad(p[5]);
  camera.position.set(tx + Math.cos(az) * Math.sin(tl) * p[3], ty + Math.sin(az) * Math.sin(tl) * p[3], tz + Math.cos(tl) * p[3]);
  camera.up.set(-Math.cos(az), -Math.sin(az), 0.0001);
  camera.lookAt(tx, ty, tz);
  camera.rotateZ(THREE.MathUtils.degToRad(p[6] + hh[2] * 0.25));
  camera.updateMatrixWorld();
  LAMP.lamp.value.set(p[0], p[1]); LAMP.lampR.value = vh * 0.85;
  return { focus: p[3], vh };
}

// ---------------------------------------------------------------- post-processing
const QV = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
function makePost() {
  const opt = { type: THREE.HalfFloatType, colorSpace: THREE.NoColorSpace };
  RT.scene = new THREE.WebGLRenderTarget(W, H, { ...opt, samples: (D.msaa ?? 4), depthTexture: new THREE.DepthTexture(W, H, THREE.UnsignedIntType) });
  RT.dof = new THREE.WebGLRenderTarget(W, H, opt); RT.acc = new THREE.WebGLRenderTarget(W, H, opt);
  RT.b1 = new THREE.WebGLRenderTarget(W / 4, H / 4, opt); RT.b2 = new THREE.WebGLRenderTarget(W / 4, H / 4, opt);
  quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); quadScene = new THREE.Scene(); quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); quadScene.add(quad);
  RT.half = new THREE.WebGLRenderTarget(W / 2, H / 2, opt); RT.halfB = new THREE.WebGLRenderTarget(W / 2, H / 2, opt);
  const DU = { tD: { value: null }, cn: { value: 0.1 }, cf: { value: 400 }, focus: { value: 10 }, aper: { value: 0.07 }, maxB: { value: 16 }, boost: { value: 0 }, res: { value: new THREE.Vector2(W, H) } };
  const COC = `uniform sampler2D tD; uniform vec2 res; uniform float cn,cf,focus,aper,maxB,boost;
    float lin(float d){ float z=d*2.-1.; return 2.*cn*cf/(cf+cn-z*(cf-cn)); }
    float coc(vec2 u){ float z=lin(texture2D(tD,u).r); return min(maxB, abs(z-focus)/z*aper*res.y)+boost; }`;
  // 1) half-res colour with CoC (in full-res px) in alpha
  MAT.dofDown = new THREE.ShaderMaterial({ vertexShader: QV, uniforms: { tC: { value: null }, ...DU },
    fragmentShader: `uniform sampler2D tC; ${COC} varying vec2 vUv; void main(){ gl_FragColor=vec4(texture2D(tC,vUv).rgb, coc(vUv)); }` });
  // 2) gather blur at half res
  MAT.dofBlur = new THREE.ShaderMaterial({ vertexShader: QV, uniforms: { t: { value: null }, res: { value: new THREE.Vector2(W, H) } },
    fragmentShader: `uniform sampler2D t; uniform vec2 res; varying vec2 vUv;
    void main(){ vec4 c0=texture2D(t,vUv); float c=c0.a; if(c<0.75){ gl_FragColor=c0; return; }
      vec3 acc=c0.rgb; float ws=1.;
      for(int i=0;i<20;i++){ float fi=float(i)+.5; float r=sqrt(fi/20.); float a=fi*2.39996; vec2 o=vec2(cos(a),sin(a))*r*c/res; vec4 s=texture2D(t,vUv+o);
        float w=clamp(s.a/(r*c+0.5),0.,1.); acc+=s.rgb*w; ws+=w; }
      gl_FragColor=vec4(acc/ws,c); }` });
  // 3) composite sharp full-res with blurred half-res by CoC
  MAT.dof = new THREE.ShaderMaterial({ vertexShader: QV, uniforms: { tC: { value: null }, tB: { value: null }, ...DU },
    fragmentShader: `uniform sampler2D tC,tB; ${COC} varying vec2 vUv;
    void main(){ float c=coc(vUv); vec3 s=texture2D(tC,vUv).rgb; if(c<0.75){ gl_FragColor=vec4(s,1.); return; } vec3 b=texture2D(tB,vUv).rgb; gl_FragColor=vec4(mix(s,b,smoothstep(0.75,2.5,c)),1.); }` });
  MAT.dofDown.uniforms.tD = MAT.dof.uniforms.tD; 
  for (const k of ['cn', 'cf', 'focus', 'aper', 'maxB', 'boost', 'res']) MAT.dofDown.uniforms[k] = MAT.dof.uniforms[k];
  MAT.acc = new THREE.ShaderMaterial({ vertexShader: QV, uniforms: { t: { value: null }, w: { value: 1 } }, transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D t; uniform float w; varying vec2 vUv; void main(){ gl_FragColor=vec4(texture2D(t,vUv).rgb*w,w); }` });
  MAT.smear = new THREE.ShaderMaterial({ vertexShader: QV, uniforms: { t: { value: null }, d: { value: new THREE.Vector2() } },
    fragmentShader: `uniform sampler2D t; uniform vec2 d; varying vec2 vUv; void main(){ vec3 c=vec3(0.); for(int i=0;i<9;i++){ c+=texture2D(t,vUv+d*(float(i)/8.-.5)).rgb; } gl_FragColor=vec4(c/9.,1.); }` });
  RT.acc2 = new THREE.WebGLRenderTarget(W, H, opt);
  MAT.bright = new THREE.ShaderMaterial({ vertexShader: QV, uniforms: { t: { value: null } }, fragmentShader: `uniform sampler2D t; varying vec2 vUv; void main(){ vec3 c=texture2D(t,vUv).rgb; float l=dot(c,vec3(.3,.59,.11)); gl_FragColor=vec4(c*smoothstep(.72,1.0,l),1.); }` });
  MAT.blur = new THREE.ShaderMaterial({ vertexShader: QV, uniforms: { t: { value: null }, d: { value: new THREE.Vector2() } }, fragmentShader: `uniform sampler2D t; uniform vec2 d; varying vec2 vUv; void main(){ vec3 c=vec3(0.); float ws=0.; for(int i=-6;i<=6;i++){ float w=exp(-float(i*i)/18.); c+=texture2D(t,vUv+d*float(i)).rgb*w; ws+=w; } gl_FragColor=vec4(c/ws,1.); }` });
  MAT.final = new THREE.ShaderMaterial({ vertexShader: QV, uniforms: { tC: { value: null }, tB: { value: null }, res: { value: new THREE.Vector2(W, H) }, seed: { value: 0 }, flick: { value: 0 }, glitch: { value: 0 }, leak: { value: 0 }, leakPh: { value: 0 }, fade: { value: 1 }, scratch: { value: 0 } },
    fragmentShader: `uniform sampler2D tC,tB; uniform vec2 res; uniform float seed,flick,glitch,leak,leakPh,fade,scratch; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233))+seed*0.1731)*43758.5453); }
    float h1(float x){ return fract(sin(x*91.345+seed*1.917)*47453.5453); }
    void main(){ vec2 uv=vUv;
      if(glitch>0.){ float rows=floor(uv.y*mix(14.,48.,h1(1.))); float r=h1(rows+3.); if(r<glitch*.55) uv.x+=(h1(rows+11.)-.5)*.16*glitch; if(h1(rows+29.)<glitch*.2) uv.y+= (h1(rows+5.)-.5)*.03; }
      vec2 cc=uv-.5; float e=dot(cc,cc); vec2 ca=cc*e*0.012 + vec2(glitch*0.012,0.);
      vec3 col=vec3(texture2D(tC,uv+ca).r, texture2D(tC,uv).g, texture2D(tC,uv-ca).b);
      col+=texture2D(tB,uv).rgb*0.32;
      if(glitch>0.){ vec2 bl=floor(uv*vec2(48.,27.)); float r=h(bl); if(r<glitch*0.022){ col=mix(col, h(bl+3.)<.5?vec3(.15,.9,.3):vec3(.9,.2,.8), .45); } float band=floor(uv.y*90.); if(h1(band+51.)<glitch*.05){ col=mix(col, h1(band+7.)<.5?vec3(.2,.95,.35):vec3(.95,.25,.85), .35); } col=mix(col, floor(col*7.)/7., glitch*.3); }
      if(leak>0.){ vec2 p1=vec2(.15+leakPh*.9,.35+sin(leakPh*3.)*.15), p2=vec2(.95-leakPh*.6,.75); float l=exp(-dot(uv-p1,uv-p1)*4.)+exp(-dot(uv-p2,uv-p2)*7.)*.7+.25;
        col=col*(1.-leak*.25)+vec3(1.,.28,.10)*l*leak*.95+vec3(1.,.6,.3)*pow(l,3.)*leak*.35; }
      col*=1.+flick;
      float v=length(cc*vec2(1.,.82)); col*=1.-smoothstep(.32,.95,v)*.72;
      vec2 gp=uv*res/2.4; vec2 gi=floor(gp), gf=fract(gp); gf=gf*gf*(3.-2.*gf); float g=mix(mix(h(gi),h(gi+vec2(1,0)),gf.x),mix(h(gi+vec2(0,1)),h(gi+vec2(1,1)),gf.x),gf.y); col+=(g-.5)*.06;
      for(int i=0;i<5;i++){ vec2 dp=vec2(h1(float(i)*7.+1.),h1(float(i)*13.+2.)); float rr=(0.6+h1(float(i)*3.)*2.2)/res.y; float d=length((uv-dp)*vec2(res.x/res.y,1.)); if(h1(float(i)+40.)<.55) col=mix(col, h1(float(i)+9.)<.6?vec3(.05):vec3(.9,.85,.75), smoothstep(rr,rr*.4,d)*.8); }
      if(scratch>0.){ float sx=h1(70.); float d=abs(uv.x-sx-sin(uv.y*7.+seed)*.002)*res.x; col=mix(col,vec3(.85,.8,.7), smoothstep(1.2,0.,d)*.35*scratch); }
      col*=fade; gl_FragColor=vec4(col,1.); }` });
}
function pass(mat, target) { quad.material = mat; renderer.setRenderTarget(target); renderer.render(quadScene, quadCam); }

// ---------------------------------------------------------------- fx timeline
function fxAt(t) {
  let glitch = 0, leak = 0, leakPh = 0, boost = 0, fade = 1;
  for (const e of fx) {
    const k = (t - e.t) * FPS; // frames relative to event centre
    if (e.type === 'glitch') { const half = (e.frames || 6) / 2; if (Math.abs(k) <= half) { const r = mulberry32(Math.floor(t * FPS) * 31 + 7)(); glitch = Math.max(glitch, (0.55 + 0.45 * r) * (1 - Math.abs(k) / (half + 1)) * (e.amp || 1)); } }
    if (e.type === 'leak') { const half = (e.frames || 14) / 2; if (Math.abs(k) <= half + 4) { const a = Math.max(0, 1 - Math.abs(k) / (half + 4)); leak = Math.max(leak, ease(a)); leakPh = (k + half) / (2 * half); boost = Math.max(boost, ease(a) * 9); } }
    if (e.type === 'fadein') { fade *= ease(clamp((t - e.t) / e.dur)); }
    if (e.type === 'fadeout') { fade *= 1 - ease(clamp((t - e.t) / e.dur)); }
  }
  return { glitch, leak, leakPh, boost, fade };
}

// ---------------------------------------------------------------- frame
let poseCache = null;
function screenSpeed(t) { // px/frame of camera target motion, used to pick motion-blur sample count
  const a = poseAt(t - 0.5 / FPS), b = poseAt(t + 0.5 / FPS), vh = VH(a[3]);
  return Math.hypot(b[0] - a[0], b[1] - a[1]) / vh * H + Math.abs(b[3] - a[3]) / a[3] * H * 0.5 + Math.abs(b[4] - a[4]) * 12;
}
async function renderFrame(f, opts = {}) {
  const t = f / FPS, sp = screenSpeed(t);
  let N = opts.samples ?? clamp(Math.ceil(sp / 9), 1, 12);
  if (N > 1 && N < 8 && sp > 30) N = 8;
  for (const s of D.stampTimes) if (t >= s && t < s + 4 / FPS) N = Math.max(N, 4);
  const vis = objects.filter(o => o.visibleAt(t));
  objects.forEach(o => { o.group.visible = false; }); vis.forEach(o => { o.group.visible = true; });
  // preload any video frames needed for every sub-sample
  const need = new Set(); for (let k = 0; k < N; k++) { const ts = t + (N > 1 ? ((k + 0.5) / N - 0.5) * 0.5 / FPS : 0); vis.forEach(o => o.needs && o.needs(ts).forEach(n => need.add(n))); }
  await Promise.all([...need].map(loadImg));
  const F = fxAt(t);
  renderer.setRenderTarget(RT.acc); renderer.setClearColor(0x000000, 0); renderer.clear();
  for (let k = 0; k < N; k++) {
    const ts = t + (N > 1 ? ((k + 0.5) / N - 0.5) * 0.5 / FPS : 0);
    for (const o of vis) await o.update(ts);
    const cam = setCamera(ts);
    const target = RT.scene;
    renderer.setRenderTarget(target); renderer.setClearColor(0x0b0a09, 1); renderer.clear(); if (!(window.__flags || {}).noScene) renderer.render(scene, camera);
    const U = MAT.dof.uniforms; U.tC.value = target.texture; U.tD.value = target.depthTexture; U.focus.value = cam.focus; U.boost.value = F.boost; U.cn.value = camera.near; U.cf.value = camera.far;
    const FL = window.__flags || {};
    if (!FL.noDof) { MAT.dofDown.uniforms.tC.value = target.texture; pass(MAT.dofDown, RT.half); MAT.dofBlur.uniforms.t.value = RT.half.texture; pass(MAT.dofBlur, RT.halfB); U.tB.value = RT.halfB.texture; pass(MAT.dof, RT.dof); }
    MAT.acc.uniforms.t.value = FL.noDof ? target.texture : RT.dof.texture; MAT.acc.uniforms.w.value = 1 / N; pass(MAT.acc, RT.acc);
  }
  let ACC = RT.acc;
  if (N > 1) { // fill the gaps between sub-samples: blur along the camera's screen-space motion over one sub-sample interval
    const a = poseAt(t - 0.25 / FPS), b = poseAt(t + 0.25 / FPS), vh = VH(a[3]), az = THREE.MathUtils.degToRad(a[4] + 90);
    let dx = (b[0] - a[0]) / vh * H, dy = (b[1] - a[1]) / vh * H; const rx = dx * Math.cos(az) + dy * Math.sin(az), ry = -dx * Math.sin(az) + dy * Math.cos(az);
    const gap = 1 / N; MAT.smear.uniforms.t.value = RT.acc.texture; MAT.smear.uniforms.d.value.set(-rx * gap / W * 1.2, -ry * gap / H * 1.2); pass(MAT.smear, RT.acc2); ACC = RT.acc2;
  }
  MAT.bright.uniforms.t.value = ACC.texture; pass(MAT.bright, RT.b1);
  MAT.blur.uniforms.t.value = RT.b1.texture; MAT.blur.uniforms.d.value.set(4 / W, 0); pass(MAT.blur, RT.b2);
  MAT.blur.uniforms.t.value = RT.b2.texture; MAT.blur.uniforms.d.value.set(0, 4 / H); pass(MAT.blur, RT.b1);
  const r = mulberry32(f * 977 + 13);
  const u = MAT.final.uniforms; u.tC.value = ACC.texture; u.tB.value = RT.b1.texture; u.seed.value = (f % 997) + 1; u.flick.value = (r() - 0.5) * 0.06;
  u.glitch.value = F.glitch; u.leak.value = F.leak; u.leakPh.value = F.leakPh; u.fade.value = F.fade; u.scratch.value = r() < 0.12 ? 1 : 0;
  pass(MAT.final, null);
  return { N };
}

// ---------------------------------------------------------------- init
window.__init = async (dataUrl, opts = {}) => {
  D = await (await fetch(dataUrl)).json(); FPS = D.fps; W = D.width; H = D.height; FOV = D.fov || 32;
  await Promise.all(['40px "Black Ops One"', '40px "Special Elite"', '700 40px Caveat', '700 40px Oswald', '500 40px Oswald'].map(f => document.fonts.load(f)));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; document.body.appendChild(cv);
  renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.autoClear = false; renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
  geo = new THREE.PlaneGeometry(1, 1);
  scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(FOV, W / H, 0.5, 400);
  TEX.paper = ctex(noiseCanvas(512, 11, { base: 128, blobs: 30, blobR: 0.2, blobA: 0.08, scratches: 0, grain: 22, fiber: true, blur: 0.5 }), true);
  TEX.deskMicro = ctex(noiseCanvas(1024, 21, { base: 128, blobs: 160, blobR: 0.12, blobA: 0.16, scratches: 700, grain: 30, blur: 0.5 }), true);
  TEX.deskMacro = ctex(noiseCanvas(512, 31, { base: 128, blobs: 60, blobR: 0.3, blobA: 0.25, scratches: 0, grain: 4, blur: 6 }), true);
  TEX.shadow = ctex(softRect(256, 256, 0.16));
  // desk
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000), new THREE.ShaderMaterial({ vertexShader: VS, uniforms: { micro: { value: TEX.deskMicro }, macro: { value: TEX.deskMacro }, lamp: LAMP.lamp, lampR: LAMP.lampR },
    fragmentShader: `uniform sampler2D micro,macro; uniform vec2 lamp; uniform float lampR; varying vec3 vW; varying vec2 vUv;
    void main(){ vec2 p=vW.xy; float m1=texture2D(micro,p/6.5).r*2.; vec2 q=mat2(.8,-.6,.6,.8)*p; float m2=texture2D(micro,q/10.7+.37).r*2.; float M=texture2D(macro,p/70.).r*2.;
      float m3=texture2D(micro,p/1.9+.71).g*2.; vec3 c=vec3(.112,.105,.097)*pow(m1,1.6)*mix(1.,m2,.6)*mix(1.,m3,.45)*pow(M,1.5); float d=distance(p,lamp); float L=mix(.42,1.2,exp(-d*d/(2.*lampR*lampR))); gl_FragColor=vec4(c*L,1.); }` }));
  desk.renderOrder = -2; scene.add(desk);
  makePost();
  beats = D.beats; fx = D.fx || []; shakes = (D.stampTimes || []).map(t => ({ t, amp: 9 })).concat(D.shakes || []); D.stampTimes = D.stampTimes || [];
  for (const b of beats) for (const spec of b.objects) { const O = BUILDERS[spec.type]; if (!O) throw new Error('unknown type ' + spec.type); const o = new O(spec, b); await o.build(); objects.push(o); }
  buildCamera();
  return { frames: D.frames, objects: objects.length };
};
window.__frame = async (f, opts = {}) => { const a = performance.now(); const info = await renderFrame(f, opts); renderer.getContext().finish(); const b = performance.now(); const url = renderer.domElement.toDataURL(opts.png ? 'image/png' : 'image/jpeg', 0.95); const c = performance.now(); return { url, N: info.N, tr: b - a, te: c - b }; };
window.__fxAt = t => fxAt(t);
window.__camSpeeds = () => { const out = []; for (let f = 0; f < D.frames; f++) { const t = f / FPS; const p = poseAt(t); out.push([+screenSpeed(t).toFixed(2), +p[3].toFixed(3)]); } return { speeds: out, beats: beats.map(b => ({ id: b.id, t0: b.t0, ta: b.ta, td: b.td, tr: b.tr })) }; };
window.__ready = true;
