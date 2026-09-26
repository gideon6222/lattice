import * as THREE from 'three';
import { scene } from './scene';
import { applyLight, lmUniforms, LM_DECL_SRC, setCoreDim } from './lightmap';
import { rockRelief } from './materials';
import { W, worldX } from './sim/config';
import { g } from './sim/state';
import { GATE_COUNT, gateDepth, coreColumn, gateReady } from './sim/gate';
import { WRONGNESS, coreLook } from './sim/wrongness';

/* The barrier and its core, as objects. Round seventeen, AE.

   Fable's review of the ladder: *"the barrier and core are drawn as ore"* - a
   row of violet crystal blocks, the same shards and haloes as a vein of
   amethyst, and a core that was one more ore cell in it. Nothing about the
   thing that stops you at 113 m said it was built.

   So the barrier is two EMITTER RAILS, real geometry in the ship's own
   rock-and-metal treatment (pale, matte, relief-textured, lit by the same
   lightmap as the rock), running the width of the world above and below the
   one row it holds. What spans between them is a FIELD, and the field is thin:
   a pale shimmer that moves like heat over a road, not a coloured ribbon.
   The row's cells are still `gate` blocks to the simulation - uncuttable and
   in the way - and blocks.ts simply stops drawing them.

   Each core is a real light, from a fixed pool made once and never added to or
   taken from: a forward renderer recompiles every lit material when the light
   count changes, so the count is constant and a light with nothing to say
   sits at zero. The pool is one light - see the note at `light` below. A core that has appeared is darker and more
   alive tier by tier (a deeper wrongness, a faster and wider pulse), and the
   rock around it goes darker too - the lightmap only ever darkens, so that is
   the direction a core pushes it. A spent core stays lit, steady and pale. */

/* Proud of the rock face (z 0.5) so they read as fitted to it, not buried. */
const RAIL_H = 0.17, RAIL_D = 0.42, RAIL_Z = 0.52;
const LEFT = worldX(0) - 0.5, RIGHT = worldX(W - 1) + 0.5, SPAN = RIGHT - LEFT;

/* Pale, matte, barely metallic: the ship's own palette (see ship.ts), so the
   barrier reads as the same makers' work as the Anchors, not as a new style. */
const railMat = new THREE.MeshStandardMaterial({
  color: 0x6e6c62, metalness: 0.18, roughness: 0.9, flatShading: true
});
rockRelief(railMat);
applyLight(railMat);

/* The emitters: one small lit block a cell along each rail. Emissive, so they
   read through the dark the way ore does, and on the glow curve the lightmap
   gives every emissive thing. */
const studMat = new THREE.MeshStandardMaterial({
  color: 0x2a2c34, emissive: 0xbfd4ff, emissiveIntensity: 0.55,
  metalness: 0.2, roughness: 0.6, flatShading: true
});
applyLight(studMat);

/* The field. Its own ShaderMaterial, lit by the lightmap's declarations
   exactly as the haze and the dust are, so it fades into the same dark. */
const fieldMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { ...lmUniforms(), uTime: { value: 0 }, uTint: { value: new THREE.Color(0xbfd4ff) } },
  vertexShader: `
    varying vec2 vLmPos;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec4 w = modelMatrix * vec4(position, 1.0);
      vLmPos = w.xy;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
  fragmentShader: `
    ${LM_DECL_SRC()}
    uniform float uTime;
    uniform vec3 uTint;
    varying vec2 vUv;
    float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
    }
    void main() {
      /* Rising wavers, like air over something hot: noise advected upward and
         pulled sideways by a second, slower noise. Thin everywhere, a little
         stronger at the rails where the field leaves them. */
      vec2 p = vec2(vLmPos.x * 1.7, vUv.y * 2.0 - uTime * 0.9);
      float warp = n(vec2(vLmPos.x * 0.4, uTime * 0.25)) * 2.0;
      float s = n(p + vec2(warp, 0.0)) * n(p * 2.3 - vec2(0.0, uTime * 0.6));
      float edge = pow(abs(vUv.y - 0.5) * 2.0, 6.0);
      float a = 0.05 + s * 0.16 + edge * 0.12;
      gl_FragColor = vec4(uTint * a * coreGlow(vLmPos), 1.0);
    }`
});

const railGeo = new THREE.BoxGeometry(1, 1, 1);
const studGeo = new THREE.BoxGeometry(0.34, 0.1, 0.34);
const fieldGeo = new THREE.PlaneGeometry(SPAN, 1 - RAIL_H, 1, 1);

interface Gate { group: THREE.Group; appeared: number; x: number; y: number; color: number; level: number; }
const gates: Gate[] = [];
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();

/* THE POOL IS ONE LIGHT. The first build gave each gate its own, and the GPU
   reading said what that costs: three more point lights is three more terms on
   every lit fragment in the game, all the time, for cores that are 113 m apart
   and never two on one screen. So there is one, made once, and each frame it
   goes to the nearest core that has anything to say. */
const light = new THREE.PointLight(WRONGNESS, 0, 5.5, 1.4);
scene.add(light);

function build(t: number): Gate {
  const d = gateDepth(t), y = -d;
  const group = new THREE.Group();
  const rails = new THREE.InstancedMesh(railGeo, railMat, 2);
  [y + 0.5, y - 0.5].forEach((ry, i) => {
    m4.compose(v.set((LEFT + RIGHT) / 2, ry, RAIL_Z), q, sc.set(SPAN, RAIL_H, RAIL_D));
    rails.setMatrixAt(i, m4);
  });
  rails.computeBoundingSphere();
  group.add(rails);
  const studs = new THREE.InstancedMesh(studGeo, studMat, W * 2);
  let n = 0;
  for (let x = 0; x < W; x++) {
    for (const sy of [y + 0.5 - RAIL_H / 2 - 0.05, y - 0.5 + RAIL_H / 2 + 0.05]) {
      m4.compose(v.set(worldX(x), sy, RAIL_Z + 0.12), q, sc.set(1, 1, 1));
      studs.setMatrixAt(n++, m4);
    }
  }
  studs.computeBoundingSphere();
  group.add(studs);
  const field = new THREE.Mesh(fieldGeo, fieldMat);
  /* Just proud of the rock's face, which is at z 0.5. */
  field.position.set((LEFT + RIGHT) / 2, y, 0.6);
  field.renderOrder = 2;
  group.add(field);
  scene.add(group);
  return { group, appeared: -1, x: worldX(coreColumn(t)), y, color: WRONGNESS, level: 0 };
}
for (let t = 0; t < GATE_COUNT; t++) gates.push(build(t));

/* Each frame. `clock` is seconds of game time; `eyeD` is the depth the
   camera is looking at, which decides which core the one light serves. */
export function stepBarriers(clock: number, eyeD: number) {
  fieldMat.uniforms.uTime.value = clock;
  for (let t = 0; t < gates.length; t++) {
    const gt = gates[t];
    const open = g.ground.gates.includes(t);
    gt.group.visible = !open;
    if (open) {
      /* Spent: lit for ever, and the rock is let go. Each one burns in a way
         that is its hint, so the line is about something the player can see
         beside it: the first stutters out and back (it "went out instantly"
         and has not stayed out), the second runs warm, the third breathes. */
      let k = 1;
      if (t === 0) k = Math.sin(clock * 13.1) * Math.sin(clock * 3.7) > 0.93 ? 0.15 : 1;
      if (t === 2) k = 0.7 + 0.3 * Math.sin(clock * 0.9);
      gt.color = t === 1 ? 0xc0607a : WRONGNESS;
      gt.level = 4 * k;
      setCoreDim(t, gt.x, gt.y, 1, 0);
      continue;
    }
    if (!gateReady(t, g.ground.lit)) {
      gt.appeared = -1;
      gt.level = 0;
      setCoreDim(t, 0, 0, 1, 0);
      continue;
    }
    /* Appeared. It comes up over two seconds from the moment it did, which is
       the event's own beat in the world. */
    if (gt.appeared < 0) gt.appeared = clock;
    const k = Math.min(1, (clock - gt.appeared) / 2);
    const look = coreLook(t);
    const beat = 1 + look.pulse * Math.sin(clock * look.rate) * Math.sin(clock * look.rate * 0.37 + t);
    gt.color = look.color;
    gt.level = look.intensity * beat * k;
    setCoreDim(t, gt.x, gt.y, look.dimRadius, look.dim * k);
  }
  let best: Gate | null = null;
  for (const gt of gates) {
    if (gt.level <= 0) continue;
    if (!best || Math.abs(-gt.y - eyeD) < Math.abs(-best.y - eyeD)) best = gt;
  }
  light.intensity = best ? best.level : 0;
  if (best) {
    light.position.set(best.x, best.y, 0.9);
    light.color.setHex(best.color);
  }
}

/* For the debug seam: the pool, and what each core is asking of it. */
export function coreLights() { return [light]; }
export function coreLevels() { return gates.map((gt) => gt.level); }
