// minimal DOM stand-ins so the scene modules load under Node (only used by the timeline exporter)
const ctx2d = new Proxy({}, { get: () => () => ({ width: 0 }) , set: () => true });
(globalThis as any).document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d, style: {} }), fonts: { add() {}, ready: Promise.resolve() } };
(globalThis as any).FontFace = class { load() { return Promise.resolve(this); } };
