// Original glossy 3D icons built from geometry: droplet, leaf, music note, sparkle, sun, cloud, heart.
// Each builder returns a Group about 1 unit tall, centred on the origin.
import * as THREE from "three";

export type IconKind = "droplet" | "leaf" | "note" | "sparkle" | "sun" | "cloud" | "heart";

const glossy = (color: string, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.18, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.08, ...extra });

const extrude = (shape: THREE.Shape, depth: number, bevel: number) => {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 4, curveSegments: 24 });
  g.center();
  return g;
};

const shadowy = (g: THREE.Object3D) => {
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; } });
  return g;
};

export const buildIcon = (kind: IconKind): THREE.Group => {
  const g = new THREE.Group();
  if (kind === "droplet") {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + (i / 16) * (Math.PI / 2); pts.push(new THREE.Vector2(0.36 * Math.cos(a), 0.36 * Math.sin(a))); }
    for (let i = 1; i <= 20; i++) { const u = i / 20; pts.push(new THREE.Vector2(0.36 * Math.pow(1 - u, 1.5) + 0.0001, 0.62 * u)); }
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), glossy("#3cc2f5", { emissive: "#0a5d8a", emissiveIntensity: 0.25 }));
    m.position.y = -0.12;
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
    hl.position.set(-0.13, 0.0, 0.27);
    hl.scale.set(0.8, 1.3, 0.4);
    g.add(m, hl);
  } else if (kind === "leaf") {
    const s = new THREE.Shape();
    s.moveTo(0, -0.5);
    s.quadraticCurveTo(0.5, -0.15, 0, 0.55);
    s.quadraticCurveTo(-0.5, -0.15, 0, -0.5);
    const m = new THREE.Mesh(extrude(s, 0.05, 0.03), glossy("#38b24a", { emissive: "#0d4a16", emissiveIntensity: 0.2 }));
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.9, 0.04), glossy("#bff59a"));
    rib.position.set(0, -0.02, 0.05);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.2, 8), glossy("#2a7a32"));
    stem.position.set(0, -0.58, 0);
    g.add(m, rib, stem);
    g.rotation.z = -0.35;
  } else if (kind === "note") {
    const s = new THREE.Shape();
    const head = (cx: number, cy: number) => { s.moveTo(cx + 0.16, cy); s.absellipse(cx, cy, 0.16, 0.12, 0, Math.PI * 2, false, 0.35); };
    head(-0.22, -0.38);
    head(0.26, -0.3);
    const stems = new THREE.Shape();
    stems.moveTo(-0.09, -0.36); stems.lineTo(-0.09, 0.42); stems.lineTo(0.39, 0.5); stems.lineTo(0.39, -0.28);
    stems.lineTo(0.33, -0.28); stems.lineTo(0.33, 0.33); stems.lineTo(-0.03, 0.27); stems.lineTo(-0.03, -0.36); stems.closePath();
    const mat = glossy("#ffc531", { metalness: 0.35, roughness: 0.22, emissive: "#6b4300", emissiveIntensity: 0.2 });
    const a = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.025, bevelSegments: 3, curveSegments: 24 }), mat);
    const b = new THREE.Mesh(new THREE.ExtrudeGeometry(stems, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 3 }), mat);
    const inner = new THREE.Group();
    inner.add(a, b);
    inner.position.set(-0.04, 0, -0.06);
    g.add(inner);
  } else if (kind === "sparkle") {
    const s = new THREE.Shape();
    s.moveTo(0, 0.55);
    s.quadraticCurveTo(0.07, 0.07, 0.55, 0);
    s.quadraticCurveTo(0.07, -0.07, 0, -0.55);
    s.quadraticCurveTo(-0.07, -0.07, -0.55, 0);
    s.quadraticCurveTo(-0.07, 0.07, 0, 0.55);
    g.add(new THREE.Mesh(extrude(s, 0.06, 0.05), glossy("#fff1a6", { emissive: "#ffd34a", emissiveIntensity: 0.55, metalness: 0.2 })));
  } else if (kind === "sun") {
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.27, 40, 28), glossy("#ffcf2e", { emissive: "#ff8a00", emissiveIntensity: 0.35 }));
    g.add(core);
    for (let i = 0; i < 8; i++) {
      const r = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 16), glossy("#ff9f1c", { emissive: "#c25400", emissiveIntensity: 0.3 }));
      const a = (i / 8) * Math.PI * 2;
      r.position.set(Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0);
      r.rotation.z = a - Math.PI / 2;
      g.add(r);
    }
  } else if (kind === "cloud") {
    const mat = glossy("#ffffff", { roughness: 0.45, clearcoat: 0.4 });
    ([[-0.28, -0.06, 0.22], [0.0, 0.08, 0.3], [0.27, -0.04, 0.24], [0.1, -0.14, 0.2], [-0.12, -0.15, 0.2]] as const).forEach(([x, y, r]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), mat);
      m.position.set(x, y, 0);
      g.add(m);
    });
  } else if (kind === "heart") {
    const s = new THREE.Shape();
    s.moveTo(0, -0.45);
    s.bezierCurveTo(-0.15, -0.3, -0.5, -0.1, -0.5, 0.15);
    s.bezierCurveTo(-0.5, 0.42, -0.2, 0.52, 0, 0.3);
    s.bezierCurveTo(0.2, 0.52, 0.5, 0.42, 0.5, 0.15);
    s.bezierCurveTo(0.5, -0.1, 0.15, -0.3, 0, -0.45);
    g.add(new THREE.Mesh(extrude(s, 0.16, 0.07), glossy("#ff4d6d", { emissive: "#7a0019", emissiveIntensity: 0.25 })));
  }
  return shadowy(g) as THREE.Group;
};
