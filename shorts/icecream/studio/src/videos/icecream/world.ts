// The world of "Es Krim di Zaman Purba" in one Three.js scene (structure of the 2d-in-3d-animation-agent template):
// painted 5-stop sky dome, stars + moon, motivated halos (freezer glow, generator lamp, camp fire), real sun shadows,
// two-tone shaded sets (school front, the valley by the sea, the shady river), the cart + generator + boards, and the
// 2D lit character cards and effect cards of the current beat.
import * as THREE from "three";
import { getInputProps } from "remotion";
import { V, Kit, buildSchool, buildValley, buildRiver, buildCart, buildGenerator, buildBoard, buildPile, lam, Cart, Gen, Board, ctex, rng, FIRE } from "./build";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, makeCtx, setLight } from "./cast";
import { RANGES, camAt } from "./story";
import { DEFAULT_WS, WS, CART_S, GEN_POS, PILE_POS } from "./beats";

export const loadKit = async (): Promise<Kit> => ({});

const haloTex = () => ctex("glowHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
const discTex = () => ctex("moonDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 54, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private stars: THREE.Group;
  private fog = new THREE.Fog("#e5a87e", 35, 380);
  private moon: THREE.Sprite; private moonHalo: THREE.Sprite;
  private coldHalo: THREE.Sprite; private fireHalo: THREE.Sprite; private fireLight = new THREE.PointLight("#ffa860", 0, 14, 1.6);
  private sunCache = new Map<number, THREE.Vector3>();
  private school: THREE.Group; private valley: THREE.Group; private river: THREE.Group; private sea: THREE.Mesh;
  private cart: Cart; private gen: Gen; private board: Board; private pile: THREE.Group;
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(_kit: Kit) {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(-0.15, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el)); c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -2; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.stars = new THREE.Group();
    const sr = rng(88), starGeo = new THREE.SphereGeometry(1, 6, 6), starMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.3, 2.6), fog: false, depthWrite: false });
    for (let i = 0; i < 260; i++) {
      const th = sr() * Math.PI * 2, ph = Math.acos(2 * sr() - 1) * 0.6 + 0.1, m = new THREE.Mesh(starGeo, starMat);
      m.position.set(680 * Math.sin(ph) * Math.cos(th), 680 * Math.cos(ph), 680 * Math.sin(ph) * Math.sin(th)); m.scale.setScalar(1.6 + sr() * 3); m.layers.set(NOINK); this.stars.add(m);
    }
    R.add(this.stars);
    const halo = (c: [number, number, number]) => new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(...c), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
    this.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(2.4, 2.3, 2.1), fog: false, depthWrite: false }));
    this.moonHalo = halo([1.2, 1.1, 1.5]); this.coldHalo = halo([0.5, 1.1, 1.6]); this.fireHalo = halo([1.9, 1.0, 0.35]);
    for (const s of [this.moon, this.moonHalo, this.coldHalo, this.fireHalo]) { s.frustumCulled = false; s.layers.set(NOINK); R.add(s); }
    this.hemi = new THREE.HemisphereLight("#d8c4ff", "#5e3c82", 0.65);
    this.sun = new THREE.DirectionalLight("#fff0d6", 3.1);
    const sm = (getInputProps() as { post?: { shadow?: number } }).post?.shadow ?? 4096;
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(sm, sm);
    R.add(this.hemi, this.sun, this.sun.target, this.fireLight);

    this.school = buildSchool(); this.valley = buildValley(); this.river = buildRiver();
    this.sea = new THREE.Mesh(new THREE.PlaneGeometry(1200, 500).rotateX(-Math.PI / 2), lam("sea", () => ({ color: "#3e90ac" })));
    this.sea.position.set(0, -0.3, -284); this.valley.add(this.sea);
    this.cart = buildCart(); this.gen = buildGenerator();
    this.board = buildBoard({
      ask: [["1 ES KRIM =", "?"], "#f2efe6", "#241726"],
      fish1: [["1 ES KRIM", "= 1 IKAN"], "#f2efe6", "#241726"],
      fish2: [["1 ES KRIM", "= 2 IKAN"], "#ffd43b", "#241726"],
      rule: [["1 ORANG", "1 ES KRIM"], "#f2efe6", "#241726"],
    });
    this.board.root.position.set(-2.55, 0, 0.75); this.board.root.rotation.y = 0.25;
    this.pile = buildPile(); this.pile.position.set(PILE_POS[0], 0, PILE_POS[2]);
    R.add(this.school, this.valley, this.river, this.cart.root, this.gen.root, this.board.root, this.pile);
  }

  private shotSun(i: number, L: LightPreset) {
    let v = this.sunCache.get(i);
    if (v) return v;
    const r = RANGES[i], s = r.beat.sun;
    let fx = 0, fz = 0;
    for (let f = r.a; f < r.b; f += 3) { const c = camAt(i, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1; fx += x / n; fz += z / n; }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s ? s[0] : L.az), el = THREE.MathUtils.degToRad(s ? s[1] : L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(i, v);
    return v;
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(i: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const R = RANGES[i], beat = R.beat, L = LIGHTS[beat.light], K = LOOK[beat.light];
    const ws: WS = { ...DEFAULT_WS, set: beat.set, cart: beat.set === "school" ? CART_S : DEFAULT_WS.cart, ...(beat.ws ? beat.ws(f) : {}) };
    // camera
    const c = camAt(i, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // light rig and the two-tone uniforms
    const sunDir = this.shotSun(i, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + 6, 12, 65);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term;
    TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad; CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    setLight(beat.light);
    // sky, stars, fog
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, k) => untone(h, su["c" + k].value));
    const e = K.sky.e.map((d) => THREE.MathUtils.degToRad(d)); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position); this.stars.position.copy(cam.position); this.stars.visible = ws.stars;
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = this.fog; scene.background = null;
    (this.sea.material as THREE.MeshLambertMaterial).color.copy(untone(K.water.mid));
    // sets and props
    this.school.visible = ws.set === "school"; this.valley.visible = ws.set === "valley"; this.river.visible = ws.set === "river";
    const onSet = ws.set !== "river";
    this.cart.root.visible = onSet; this.cart.root.position.set(...ws.cart);
    this.cart.lid.rotation.x = -1.75 * ws.lid;
    this.cart.stock.visible = !ws.melt; this.cart.melt.visible = ws.melt;
    for (const [k, m] of Object.entries(this.cart.signs)) m.visible = ws.top === k;
    this.gen.root.visible = ws.set === "valley"; this.gen.root.position.set(...GEN_POS);
    this.gen.gauges.forEach((g, k) => (g.visible = k === ws.gauge));
    this.gen.lamp.color.setRGB(ws.genOn ? 0.5 : 2.6, ws.genOn ? 2.6 : 0.4, ws.genOn ? 0.6 : 0.3);
    this.gen.body.position.set(ws.genOn ? 0.006 * Math.sin(f * 2.7) : 0, ws.genOn ? 0.004 * Math.abs(Math.sin(f * 3.1)) : 0, 0);
    this.pile.visible = ws.set === "valley" && ws.fish;
    this.board.root.visible = ws.set === "valley" && !!ws.board;
    for (const [k, m] of Object.entries(this.board.faces)) m.visible = ws.board === k;
    // motivated glows
    this.moon.visible = this.moonHalo.visible = ws.moon;
    if (ws.moon) { this.moon.position.set(cam.position.x - 60, 140, cam.position.z - 420); this.moon.scale.setScalar(26); this.moonHalo.position.copy(this.moon.position); this.moonHalo.scale.setScalar(110); }
    this.coldHalo.visible = onSet && ws.lid > 0.3;
    if (this.coldHalo.visible) { this.coldHalo.position.set(ws.cart[0], 1.45, ws.cart[2]); this.coldHalo.scale.setScalar(1.6 * ws.lid); }
    this.fireHalo.visible = ws.fire && ws.set === "valley";
    this.fireLight.intensity = this.fireHalo.visible ? 9 * (1 + 0.12 * Math.sin(f * 1.7)) : 0;
    if (this.fireHalo.visible) { this.fireHalo.position.set(FIRE[0], 0.7, FIRE[2]); this.fireHalo.scale.setScalar(3.2 + 0.25 * Math.sin(f * 1.3)); this.fireLight.position.set(FIRE[0], 1.0, FIRE[2]); }
    // 2D cast and effect cards of this beat
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const ctx = makeCtx(f, R.a, R.b, { pos: cam.position, right, sun: sunDir });
    if (ws.genOn && ws.set === "valley") ctx.puffs("exhaust", GEN_POS[0] + 0.7, 0.4, GEN_POS[2] - 0.12, { n: 3, period: 30, life: 30, size: 0.28, rise: 0.5, drift: [0.25, 0], col: "#c8c4c0" });
    beat.stage(ctx);
    const st = ctx.out;
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0; const used: Actor[] = [];
    for (const p of st.places) {
      const s2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * s2, p.z), 3.5))) continue;
      const a = this.actor(ai++), [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -s2 : s2, s2, s2); a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let k = ai; k < this.actors.length; k++) this.actors[k].mesh.visible = false;
    let fi = 0; const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h) + 1.5))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw); e.use(!!p.soft);
      e.mesh.visible = true; e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0); else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1); fused.push(e);
    }
    for (let k = fi; k < this.fxs.length; k++) this.fxs[k].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }
}
