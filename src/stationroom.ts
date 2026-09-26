/* The Outfitter, rebuilt as a room rather than a wall of cases.

   Playtest: *"I wanted a full overhaul. change how it is layed out completely.
   make it look like a completely different room and less cluttered. I want it
   to feel like a space station with a completely different feel, neon lights
   and realistic textures and models. it should be an open room with display
   cases or something similar and elements that make it feel real, like gauges
   and different artifacts that would be found in a digging space station."*

   What was there: fifteen upgrade cases stacked in two columns either side of
   the ship, which is a menu drawn in 3D. Grouping and heading them helped and
   did not change what it was.

   What it is now, and why each piece is here:

   **Four pedestals, not fifteen cases.** Deep Rock Galactic's Space Rig is the
   sourced pattern - every function at its own named, walked-to station instead
   of one wall of terminals. Here that is four lit display plinths across the
   front of the room, one per group, and the cases for a group only appear when
   its plinth is chosen. Fifteen objects competing for a portrait frame becomes
   four, which is the whole of "less cluttered".

   **The room is dressed with the work.** An ore skip with rock still in it,
   stacked crates, loose samples on the deck, pipe runs along the walls and a
   window onto the planet you are parked over. These are the "artifacts you
   would find in a digging space station" - and they are imported models rather
   than primitives because that is what they are for: props read at full size
   on a screen where nothing is moving.

   **Neon without a bloom pass.** There is no post-processing in this renderer,
   so an emissive strip on its own is just a bright line. Each strip gets a
   second, larger, dimmer quad behind it on additive blending - a hand-made
   halo, which is what sells a light source as glowing when the pipeline cannot
   do it for you. Colours are saturated against a desaturated ambient, which is
   the other half of the trick.

   **The gauges are real.** The consoles on the back wall carry the claim's
   strain, the deepest metre reached and what is in the store shed. `CRAFT.md`
   warns against inventing a symbol for something you can show; the inverse
   applies here, which is that a dial in the fiction showing state the player
   already has is not a duplicate HUD, it is the room knowing what you know. */

import { ballastStarted } from './sim/unrest';
import { WRONGNESS } from './sim/wrongness';
import * as THREE from 'three';
import { g, worldUnrest } from './sim/state';
import { WORLD_DEPTH } from './sim/region';
import { SHIP_LAYER } from './scene';

const PROPS = [
  'table-display', 'table-display-small', 'container', 'container-flat',
  'skip-rocks', 'computer', 'computer-wide', 'pipe', 'pipe-bend', 'rail',
  'floor-panel', 'wall', 'wall-window', 'rocks', 'structure-panel'
] as const;
type PropName = typeof PROPS[number];

const props = new Map<PropName, THREE.Object3D>();
let loading: Promise<void> | null = null;

/* One material family for everything imported, for the reason the ship parts
   use one: a kit's baked look next to a hand-tuned scene is the join that
   shows in the first frame. Two variants only - the deck and the machinery -
   because more than that stops reading as one place. */
/* The deck, and why it is wet.

   R5 in `PLAN.md` asked for *"mirrored fittings and ship under a translucent
   floor"*, and its own brief said to judge it against the room before spending
   a day on it. Judged from a screenshot at 460x996: the bottom sixth of the
   frame was a flat dead navy band under an otherwise rich picture, so there is
   a real fault there - but it was not the one the brief names, and a mirror is
   not what fixes it.

   MEASURED: nothing was lighting the deck at all. The neon fittings are real
   PointLights with a pool distance of 1.6, and they sit two and a half metres
   above a deck at y -1.35, so their light stopped well short of it. A glossier
   floor under no light is still a dead floor, which is why this is a material
   change AND a light, and why neither alone was tried.

   So: low roughness and high metalness, and the deck catches the aisle's own
   neon in a long soft streak instead of being a matte plate. That is the wet
   read, it costs one material and one light, and it keeps the room's own
   standing rule - *"anything neon should feel like it is actually coming from
   an object or light in the room, not an overlay"*. A translucent floor with
   the ship under it remains unbuilt and is recorded that way. */
const deckMat = new THREE.MeshStandardMaterial({
  color: 0x2f353f, metalness: 0.62, roughness: 0.26, flatShading: true
});
const gearMat = new THREE.MeshStandardMaterial({
  color: 0x767f8c, metalness: 0.6, roughness: 0.55, flatShading: true
});

/* ---------- the steampunk half ----------

   Playtest: *"I was hoping for more of a mix of cyberpunk, matrix, and steam
   punk."*

   Three styles in one room is a recipe for mud unless each is given a JOB, and
   the research is clear about what each one is actually made of:

     steampunk  is MATERIALS AND PROPS - brass, copper, riveted iron, pipes,
                gauges with needles, valve wheels. It reads through albedo and
                silhouette and needs no lighting trick at all, which is exactly
                why it can be everywhere. It is the room.
     cyberpunk  is LIGHT - saturated magenta and cyan rationed against a warm
                base. It is the signage and nothing else.
     Matrix     is INFORMATION, on one surface, kept monochrome. See crtTexture.

   So these three are the building, and every one of them is high metalness and
   low roughness: brass that does not catch a light is painted wood. */
export const brassMat = new THREE.MeshStandardMaterial({
  color: 0xb8863c, metalness: 0.95, roughness: 0.32, flatShading: true
});
export const copperMat = new THREE.MeshStandardMaterial({
  color: 0x9c5a32, metalness: 0.9, roughness: 0.4, flatShading: true
});
/* Riveted iron: dark, and rough enough that the brass beside it reads as the
   precious one. A room of nothing but brass is a trumpet. */
export const ironMat = new THREE.MeshStandardMaterial({
  color: 0x32302c, metalness: 0.65, roughness: 0.74, flatShading: true
});

/* Rivets, as one instanced mesh for the whole room.

   The single cheapest thing that says "built, and built a long time ago". Six
   hundred of them cost one draw call, which is the only reason they are
   affordable at all - six hundred meshes would not be. */
const rivetGeo = new THREE.SphereGeometry(0.018, 5, 3);
export function rivetRow(into: THREE.Object3D, x0: number, y: number, z: number,
                         len: number, n: number) {
  const m = new THREE.InstancedMesh(rivetGeo, brassMat, n);
  const t = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    t.position.set(x0 + (len * i) / Math.max(1, n - 1), y, z);
    t.updateMatrix();
    m.setMatrixAt(i, t.matrix);
  }
  m.frustumCulled = false;
  into.add(m);
  return m;
}

function dress(o: THREE.Object3D, mat: THREE.Material) {
  o.traverse((n) => {
    const m = n as THREE.Mesh;
    if (m.isMesh) m.material = mat;
  });
  return o;
}

export function loadStationProps(): Promise<void> {
  if (loading) return loading;
  loading = (async () => {
    let GLTFLoader;
    try {
      ({ GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js'));
    } catch (e) { return; }
    const loader = new GLTFLoader();
    await Promise.all(PROPS.map((p) => new Promise<void>((res) => {
      loader.load('./models/station/' + p + '.glb',
        (gl) => { props.set(p, gl.scene); res(); },
        undefined,
        () => res());
    })));
  })();
  return loading;
}

function prop(name: PropName, mat: THREE.Material, scale = 1): THREE.Object3D | null {
  const src = props.get(name);
  if (!src) return null;
  const o = src.clone(true);
  dress(o, mat);
  o.scale.setScalar(scale);
  return o;
}

/* ---------- the Matrix terminal ----------

   ONE surface in the whole room, and that exclusivity is the entire technique
   rather than a budget decision.

   The sourced finding: the film's green is a MONOCHROME grade - phosphor
   #00ff41 on near-black, with brighter near-white-green at the hot points and
   no other saturated hue allowed in the same read. It is not one neon among
   several. Put it next to the magenta and the cyan on equal terms and both
   identities cancel: the green stops reading as "a screen from that film" and
   becomes "a third colored light", and the cyberpunk pair stops reading as a
   pair. So it gets a terminal, the terminal is green and black and nothing
   else, and no fitting in this room is ever that colour.

   It also costs almost nothing, which is the part that makes it viable here.
   Falling glyph columns on a canvas at twelve frames a second, with the
   scanlines drawn INTO the texture rather than added by a post pass this
   renderer does not have. A CRT is one of the few things that is easier
   without post-processing than with it. */
const CRT_W = 256, CRT_H = 320;
const GLYPHS = '01<>[]{}/\\|=+*#%$@&ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const COLS = 16;
const CELL = CRT_W / COLS;
const ROWS = Math.floor(CRT_H / 16);

export interface Crt {
  mesh: THREE.Mesh;
  step(t: number): void;
}

export function makeCrt(w = 1.0, h = 1.25): Crt {
  const c = document.createElement('canvas');
  c.width = CRT_W; c.height = CRT_H;
  const x = c.getContext('2d')!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  /* One head per column, each falling at its own rate. Seeded off the column
     index rather than Math.random, for the same reason everything else in this
     repo is: a screen that looks different every time you open the shop is a
     screen you cannot photograph and compare. */
  const head: number[] = [], rate: number[] = [];
  for (let i = 0; i < COLS; i++) {
    head[i] = ((i * 7919) % 97) / 97 * ROWS;
    rate[i] = 6 + ((i * 104729) % 11);
  }

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    /* Unlit and toneMapped off: a CRT emits, it is not lit. This is the one
       place in the room where MeshBasicMaterial is the honest answer rather
       than the lazy one. */
    new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })
  );

  let acc = 0, last = 0;
  return {
    mesh,
    step(t: number) {
      /* Twelve frames a second, not sixty. A canvas redraw plus a texture
         upload every frame for a decorative screen is the kind of cost that
         does not show up until it is on a phone - and the effect is BETTER
         slow, because real phosphor lags. */
      if (t - last < 1 / 12) return;
      acc += t - last;
      last = t;

      x.fillStyle = '#050a06';
      x.fillRect(0, 0, CRT_W, CRT_H);
      x.font = '700 13px "Chakra Petch", monospace';
      x.textAlign = 'center';
      for (let i = 0; i < COLS; i++) {
        head[i] = (head[i] + acc * rate[i] * 0.12) % (ROWS + 14);
        const hy = Math.floor(head[i]);
        /* A tail of fourteen, fading from the near-white head down into the
           black. The head being WHITER than the green is the detail that makes
           it read as falling rather than as a static gradient. */
        for (let k = 0; k < 14; k++) {
          const r = hy - k;
          if (r < 0 || r > ROWS) continue;
          const gi = (i * 31 + r * 17 + Math.floor(head[i])) % GLYPHS.length;
          x.fillStyle = k === 0 ? '#ccffcc'
            : 'rgba(0,255,65,' + (0.85 * (1 - k / 14)).toFixed(3) + ')';
          x.fillText(GLYPHS[gi], i * CELL + CELL / 2, r * 16 + 13);
        }
      }
      /* Scanlines, drawn in. Every other row darkened is what a phosphor tube
         looks like and what a bloom pass would never give you anyway. */
      x.fillStyle = 'rgba(0,0,0,0.30)';
      for (let y = 0; y < CRT_H; y += 3) x.fillRect(0, y, CRT_W, 1);
      acc = 0;
      tex.needsUpdate = true;
    }
  };
}

/* ---------- an analogue gauge ----------

   The steampunk half's one moving part. A brass bezel, a dark face, a red
   needle, and the needle reads REAL state - the claim's strain, the deepest
   metre, what is in the shed. `CRAFT.md` warns against inventing a symbol for
   something you can show; a dial in the fiction showing state the player
   already has is not a duplicate HUD, it is the room knowing what you know. */
export interface Gauge {
  group: THREE.Group;
  set(v: number): void;
}

function gaugeFaceTexture(label: string): THREE.CanvasTexture {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  x.fillStyle = '#12100c';
  x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); x.fill();
  /* Ticks around the top 240 degrees, which is what a real dial uses. */
  x.strokeStyle = '#d8c89a';
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * 0.9 + (i / 10) * Math.PI * 1.2;
    const r0 = S / 2 - 8, r1 = i % 5 === 0 ? S / 2 - 20 : S / 2 - 14;
    x.lineWidth = i % 5 === 0 ? 2.5 : 1.2;
    x.beginPath();
    x.moveTo(S / 2 + Math.cos(a) * r0, S / 2 + Math.sin(a) * r0);
    x.lineTo(S / 2 + Math.cos(a) * r1, S / 2 + Math.sin(a) * r1);
    x.stroke();
  }
  x.fillStyle = '#b8a473';
  x.font = '700 13px "Chakra Petch", system-ui, sans-serif';
  x.textAlign = 'center';
  x.fillText(label, S / 2, S * 0.74);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function makeGauge(label: string, r = 0.2): Gauge {
  const grp = new THREE.Group();
  /* The bezel is a torus of real brass, lit by the room. That is the whole
     reason the dial reads as an object rather than as a picture of one. */
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.11, 6, 18), brassMat);
  grp.add(bezel);
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(r * 0.94, 20),
    new THREE.MeshStandardMaterial({ map: gaugeFaceTexture(label), roughness: 0.55, metalness: 0.1 })
  );
  face.position.z = -0.006;
  grp.add(face);
  /* The needle pivots at its own end, so it swings rather than slides: the
     geometry is offset inside a pivot group instead of the mesh being rotated
     about its centre. */
  const pivot = new THREE.Group();
  const needle = new THREE.Mesh(
    new THREE.BoxGeometry(r * 0.78, r * 0.045, 0.008),
    new THREE.MeshStandardMaterial({ color: 0xd83c2c, roughness: 0.5, metalness: 0.2 })
  );
  needle.position.x = r * 0.34;
  pivot.add(needle);
  pivot.position.z = 0.012;
  grp.add(pivot);
  grp.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.1, r * 0.1, 0.02, 8),
    brassMat).rotateX(Math.PI / 2));

  let shown = 0;
  return {
    group: grp,
    set(v: number) {
      /* Eased toward the reading rather than snapped to it, because a real
         needle has mass and a snapping one reads as a number pretending to be
         a dial. */
      shown += (Math.max(0, Math.min(1, v)) - shown) * 0.12;
      pivot.rotation.z = Math.PI * 0.9 + shown * Math.PI * 1.2;
    }
  };
}

/* ---------- neon ---------- */

/* A soft radial falloff, drawn once and shared by every light pool.

   This is the half a bloom pass would otherwise do: light spreading onto the
   surface behind a fitting. A hard-edged coloured plane cannot stand in for it
   - the edge is the tell - so the gradient goes into a texture and the quad
   that carries it is tinted per fitting. */
let fallTex: THREE.CanvasTexture | null = null;
export function falloffTexture(): THREE.CanvasTexture {
  if (fallTex) return fallTex;
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  const grd = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.34)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = grd;
  x.fillRect(0, 0, S, S);
  fallTex = new THREE.CanvasTexture(c);
  return fallTex;
}

/* ---------- glow without a bloom pass ----------

   The sourced technique, and it is the one thing that was actually missing
   from round five's fittings. A tube with an emissive material and no bloom
   behind it is a bright line: the light stops dead at the silhouette, which is
   the opposite of what a gas discharge tube does.

   The fix is a smooth PROXY - a second, slightly larger cylinder around the
   tube carrying a fresnel falloff, so the apparent brightness rises toward the
   grazing edges the way a real tube's does. It has to be its own smooth mesh
   rather than the tube's own material because the falloff is computed from
   interpolated normals, and the flat-shaded low-poly geometry this game is
   made of has none worth reading. That limitation is in the source and it is
   the reason this is an added mesh rather than a material tweak.

   Additive and depth-write-free, so it layers over the housing without
   punching a hole in it, and `side: BackFace` so the near half of the shell
   does not wash out the tube it is meant to be surrounding. */
const fresnelVert = `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const fresnelFrag = `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uAmount;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    /* One minus the facing ratio: zero head-on, one at the grazing edge. */
    float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
    f = pow(clamp(f, 0.0, 1.0), uPower);
    gl_FragColor = vec4(uColor * f * uAmount, f * uAmount);
  }`;

export interface Halo extends THREE.Mesh {
  material: THREE.ShaderMaterial;
}

function fresnelShell(color: number, len: number, r: number): Halo {
  const m = new THREE.Mesh(
    /* Smooth: 16 segments and no flat shading, because the whole effect is
       computed off the interpolated normal. */
    new THREE.CylinderGeometry(r * 1.9, r * 1.9, len * 1.02, 16, 1, true),
    new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uPower: { value: 2.2 },
        uAmount: { value: 0.8 }
      },
      vertexShader: fresnelVert,
      fragmentShader: fresnelFrag,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
      toneMapped: false
    })
  ) as Halo;
  m.rotation.z = Math.PI / 2;
  return m;
}

/* How many real lights the room has handed out.

   A forward renderer costs every light on every shaded fragment, and the
   three.js forum's practical figure is about ten fixed point lights against a
   typical uniform ceiling near fifteen. Fittings past the cap still get their
   tube, their housing and their light pool - they simply do not get a light of
   their own, which is invisible in a still and cheap in a frame. */
export const NEON_LIGHT_BUDGET = 7;
let lightsUsed = 0;
export function neonLightsUsed() { return lightsUsed; }
export function resetNeonLights() { lightsUsed = 0; }

/* A neon fitting: a tube in a housing, with a light.

   Playtest: *"anything neon should feel like it is actually coming from an
   object or light in the room, not an overlay."* That was a correct read of
   what this used to be - a MeshBasicMaterial plane with an additive quad
   behind it, floating at a fixed z. A lit rectangle, not a lit fitting.

   The sourced recipe names four ingredients and the old version had one:

     1. a TUBE rather than a plane, so it has a lit side and a shaded side
     2. an emissive material on that tube
     3. a HOUSING of ordinary metal around it, lit by the room's own lights -
        the missing ingredient, and the whole reason the old one read as a
        sticker. The eye needs "normally lit" beside "self-lit" in one glance
        before it will believe the second
     4. a real light at the tube, which is what actually puts colour on the
        surfaces near it

   The light pool on the wall behind is the fifth thing, and it is the piece
   that stands in for a bloom pass this renderer does not have. */
export function neonFitting(color: number, len: number, opts: {
  housing?: boolean; light?: number; pool?: number; radius?: number; glow?: number;
} = {}): NeonFitting {
  const grp = new THREE.Group() as NeonFitting;
  const r = opts.radius ?? 0.028;

  /* The housing: a shallow channel the tube sits in, in ordinary lit metal.
     Slightly longer than the tube and open toward the camera. */
  if (opts.housing !== false) {
    const back = new THREE.Mesh(new THREE.BoxGeometry(len + 0.12, r * 2.6, r * 1.6), gearMat);
    back.position.z = -r * 1.5;
    grp.add(back);
    for (const sy of [-1, 1]) {
      const lip = new THREE.Mesh(new THREE.BoxGeometry(len + 0.12, r * 0.6, r * 2.6), gearMat);
      lip.position.set(0, sy * r * 1.5, -r * 0.4);
      grp.add(lip);
    }
  }

  /* The tube. Emissive rather than unlit, so the room's own lighting still
     touches its shaded side and it sits in the scene instead of on top of it. */
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, len, 8, 1),
    new THREE.MeshStandardMaterial({
      color: 0x0b0b0b, emissive: color, emissiveIntensity: 1.0,
      roughness: 0.35, metalness: 0
    })
  );
  tube.rotation.z = Math.PI / 2;
  grp.add(tube);

  /* The light. Short range and no shadow - a point-light shadow is six cube
     faces and this room would pay for it on every fragment. */
  if ((opts.light ?? 2.4) > 0 && lightsUsed < NEON_LIGHT_BUDGET) {
    const l = new THREE.PointLight(color, opts.light ?? 2.4, opts.pool ?? 1.6, 2);
    l.castShadow = false;
    l.position.z = 0.06;
    /* Its own full intensity, remembered, so setNeon can dim and restore it
       without every caller having to hand the number back. */
    l.userData.base = opts.light ?? 2.4;
    grp.add(l);
    lightsUsed++;
  }

  /* And the pool it throws on whatever is behind it. */
  /* Sized off the tube's length ALONG it and off its radius ACROSS it.

     Both axes used to scale with the length, so the 3.2-metre strip under the
     counter threw a 4.8 by 1.8 metre haze - a wash over the whole counter and
     the two cases standing on it, which in the screenshot read as a pink fog
     with upgrades floating in it. A light pool is long and thin because the
     thing making it is long and thin. */
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(len * 1.08, Math.min(len * 0.3, r * 18)),
    new THREE.MeshBasicMaterial({
      color, map: falloffTexture(), transparent: true, opacity: 0.26,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
    })
  );
  pool.position.z = -r * 2.2;
  grp.add(pool);

  /* Named handles rather than child indices. The old version was poked at with
     children[0] and children[1] from three different places, which is a
     structure nobody can change without breaking a caller that never said what
     it wanted. */
  /* The fresnel shell, between the tube and the pool: it is the glow the tube
     itself cannot have without a bloom pass. */
  const halo = fresnelShell(color, len, r);
  grp.add(halo);
  /* How hard this fitting glows, over and above how long it is.

     Needed because a fitting's apparent brightness is a function of how close
     it is to the lens, and the fittings in this room are at wildly different
     distances: the sign is on a wall four metres back and the counter strip is
     barely a metre away. The same tube at the same settings read as a neat lit
     line on the wall and as a full-width glare across the bottom of the frame.
     Measured rather than argued: 3.2 units at the counter's distance is about
     880 screen pixels on a 360-wide phone, which is wider than the screen. */
  grp.userData.glow = opts.glow ?? 1;

  (grp as NeonFitting).tube = tube;
  (grp as NeonFitting).pool = pool;
  (grp as NeonFitting).halo = halo;
  return grp as NeonFitting;
}

export interface NeonFitting extends THREE.Group {
  tube: THREE.Mesh;
  pool: THREE.Mesh;
  halo: Halo;
}

/* How brightly a fitting is burning, 0 to 1 of its own colour. Drives the
   tube's emissive and the pool together, because a tube that brightens without
   its pool brightening is back to being a sticker. */
export function setNeon(f: NeonFitting, amount: number) {
  const a = Math.max(0, Math.min(1, amount)) * (f.userData.glow ?? 1);
  (f.tube.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.25 + a * 1.15;
  (f.pool.material as THREE.MeshBasicMaterial).opacity = 0.1 + a * 0.34;
  /* All three together, always. A tube that brightens without its pool is back
     to being a sticker, and one that brightens without its halo is a bright
     line again - which is exactly the fault round five shipped. */
  if (f.halo) f.halo.material.uniforms.uAmount.value = 0.15 + a * 0.85;
  /* And the real light, when this fitting got one. Dimming a fitting whose
     lamp keeps burning is the tell that the lamp was never really its. */
  for (const c of f.children) {
    const l = c as THREE.PointLight;
    if (l.isPointLight) l.intensity = (l.userData.base || 2.4) * (0.15 + a * 0.85);
  }
}

/* Kept as a thin alias so the callers that only want a lit line still read
   that way. Everything goes through the fitting now. */
export function neonBar(color: number, w: number, _h = 0.05, _glow = 3.2): NeonFitting {
  return neonFitting(color, w);
}


/* ---------- the bay, round seventeen AO ----------

   The walked gas station is retired: no aisles, no four department counters,
   no drawer, no pump shared by every stop. What is left is one bay - a deck, a
   back wall with the terminal and the gauges on it, and a lift under the ship
   - and the ROOM AROUND THE LIFT changes with where you are. The plan's line
   is *"Gate vendors are different rooms around the same lift, never a second
   UI"*, so the lift, the camera and every card are the same in all four and
   only the dressing moves:

     THE PAD    iron and brass, the fuel pump. The only room with a pump,
                because it is the only place that refuels.
     GATE 1     113 m, a chamber cut out of the rock, lamplit amber.
     GATE 2     226 m, cold, with the violet crystal of the deep coming
                through the walls.
     GATE 3     398 m, the Vault's door: dark, and red with the heat.

   Each is a wall tint, an accent light, a sign and a set of props, all built
   once and switched by visibility - a room swap costs nothing per frame. */

export type PlaceLook = { name: string; wall: number; accent: number; key: number };
export const PLACE_LOOKS: PlaceLook[] = [
  { name: 'THE PAD', wall: 0x767f8c, accent: 0x5fd6ff, key: 0xffc27a },
  { name: 'GATE 1 · 113 M', wall: 0x7a5a3e, accent: 0xffa23a, key: 0xffb45e },
  { name: 'GATE 2 · 226 M', wall: 0x4a5670, accent: 0xa97cff, key: 0x9fb8ff },
  { name: 'GATE 3 · 398 M', wall: 0x4a2a26, accent: 0xff4a3a, key: 0xff8a5a }
];

export interface Room {
  group: THREE.Group;
  crt: Crt;
  gauges: { g: Gauge; read: () => number }[];
  /* -1 the pad, 0.. the gate index. */
  setPlace(place: number): void;
  place(): number;
  step(t: number, dt: number): void;
}

/* The ship's lift, centred on the deck. station.ts parks the ship over it. */
export const LIFT_X = 0, LIFT_Z = 0.75;

/* Built once, the first time the bay is opened and the props have arrived.
   Returns null if nothing loaded, and the caller keeps the bare bay - a
   missing model must never cost the player the ability to buy anything. */
export function buildRoom(): Room | null {
  if (!props.size) return null;
  resetNeonLights();
  const root = new THREE.Group();
  const LEFT = -3.4, RIGHT = 3.4;
  /* The wall's own material, so tinting it for a gate never tints the brass
     and iron the lift is made of. */
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x767f8c, metalness: 0.55, roughness: 0.5, flatShading: true
  });

  /* --- the deck --- */
  for (let x = Math.floor(LEFT); x <= Math.ceil(RIGHT); x++) {
    for (let z = -2; z <= 2; z++) {
      const p = prop('floor-panel', deckMat, 1.0);
      if (!p) continue;
      p.position.set(x, -1.35, z);
      root.add(p);
    }
  }

  /* --- the back wall: panels on the deck and a plate above them --- */
  for (let x = Math.floor(LEFT); x <= Math.ceil(RIGHT); x++) {
    const w = prop(Math.abs(x % 4) === 2 ? 'wall-window' : 'wall', wallMat, 1.0);
    if (!w) continue;
    w.position.set(x, -1.35, -2.5);
    root.add(w);
  }
  const upper = new THREE.Mesh(new THREE.BoxGeometry(RIGHT - LEFT, 3.6, 0.16), wallMat);
  upper.position.set(0, 0.55, -2.55);
  root.add(upper);
  for (let x = Math.floor(LEFT); x <= Math.ceil(RIGHT); x += 2) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.6, 0.06), brassMat);
    seam.position.set(x, 0.55, -2.45);
    root.add(seam);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(RIGHT - LEFT, 0.09, 0.14), brassMat);
  rail.position.set(0, 1.92, -2.35);
  root.add(rail);
  rivetRow(root, LEFT, 1.79, -2.3, RIGHT - LEFT, Math.round((RIGHT - LEFT) * 3));
  for (let i = 0; i < Math.ceil(RIGHT - LEFT); i++) {
    const p = prop('pipe', copperMat, 1.0);
    if (!p) continue;
    p.position.set(LEFT + i, 1.55, -2.2);
    p.rotation.z = Math.PI / 2;
    root.add(p);
  }

  /* --- the lift: the one thing every room shares --- */
  const deckTop = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.14, 28), ironMat);
  deckTop.position.set(LIFT_X, -1.26, LIFT_Z);
  root.add(deckTop);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.05, 6, 36), brassMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(LIFT_X, -1.18, LIFT_Z);
  root.add(ring);
  /* The lit band round the lift, in the room's accent: the colour that says
     which counter this is before a word is read. */
  const bandMat = new THREE.MeshBasicMaterial({ color: 0x5fd6ff, toneMapped: false });
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.018, 4, 36), bandMat);
  band.rotation.x = Math.PI / 2;
  band.position.set(LIFT_X, -1.17, LIFT_Z);
  root.add(band);
  /* Two guide rails behind the ship, so it reads as a lift and not a plate. */
  for (const sx of [-1.25, 1.25]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 3.1, 0.09), brassMat);
    post.position.set(LIFT_X + sx, 0.2, LIFT_Z - 0.9);
    root.add(post);
  }

  /* --- the terminal and the gauges, on the wall in every room --- */
  const gauges: { g: Gauge; read: () => number }[] = [
    { g: makeGauge('UNREST'), read: () => worldUnrest() },
    { g: makeGauge('DEPTH'), read: () => Math.min(1, g.best.depth / WORLD_DEPTH) },
    { g: makeGauge('BALLAST'), read: () => g.ground.ballast }
  ];
  gauges.forEach((gg, i) => {
    gg.g.group.position.set(0.9 + i * 0.46, 0.72, -2.28);
    root.add(gg.g.group);
  });
  const gaugeBoard = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.62, 0.1), ironMat);
  gaugeBoard.position.set(1.36, 0.72, -2.36);
  root.add(gaugeBoard);
  rivetRow(root, 0.66, 0.44, -2.3, 1.4, 6);
  const crt = makeCrt(1.0, 1.25);
  crt.mesh.position.set(-1.4, 0.35, -2.28);
  root.add(crt.mesh);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.16, 1.41, 0.12), brassMat);
  bezel.position.set(-1.4, 0.35, -2.36);
  root.add(bezel);

  /* --- the sign: where you are, on the wall above the lift --- */
  const signs = PLACE_LOOKS.map((look) => {
    const m = makeLabel(look.name, look.accent);
    m.scale.setScalar(1.6);
    m.position.set(0, 1.28, -2.3);
    root.add(m);
    return m;
  });

  /* --- each room's own dressing --- */
  const dress: THREE.Group[] = PLACE_LOOKS.map(() => {
    const d = new THREE.Group();
    root.add(d);
    return d;
  });
  const put = (d: THREE.Group, o: THREE.Object3D | null, x: number, y: number, z: number, ry = 0) => {
    if (!o) return;
    o.position.set(x, y, z);
    o.rotation.y = ry;
    d.add(o);
  };
  /* Where dressing can be SEEN. Portrait at a 46 degree field is barely three
     units wide at the back wall and under two at the lift, so the first
     version's props at x 2.5 were all off the edge of every screen. Everything
     here sits inside x -1.5 to 1.5, against the wall or on the deck behind the
     lift, where the ship does not cover it. */
  /* The pad: the pump behind the lift, and a skip of spoil. */
  {
    const d = dress[0];
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 0.4), ironMat);
    pump.position.set(1.25, -0.6, -1.7);
    d.add(pump);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.5), brassMat);
    head.position.set(1.25, 0.28, -1.7);
    d.add(head);
    rivetRow(d, 1.05, -0.6, -1.48, 0.4, 4);
    const hose = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.035, 5, 14, Math.PI * 0.8),
      new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: 0.9, metalness: 0 }));
    hose.position.set(0.85, -0.5, -1.5);
    hose.rotation.set(0, 0, Math.PI * 0.15);
    d.add(hose);
    put(d, prop('skip-rocks', ironMat, 0.8), -1.3, -1.32, -1.5, 0.5);
  }
  /* Gate 1: rock pressing in at both sides of the wall, and two lamps. */
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x6b4a32, roughness: 0.95, metalness: 0.05, flatShading: true
  });
  {
    const d = dress[1];
    put(d, prop('rocks', rockMat, 1.5), -1.4, -1.33, -1.8, 0.4);
    put(d, prop('rocks', rockMat, 1.2), 1.4, -1.33, -1.7, -0.9);
    put(d, prop('rocks', rockMat, 0.8), -0.9, -1.33, -1.2, 1.7);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffc27a, toneMapped: false });
    for (const x of [-1.05, 1.05]) {
      const lampM = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), lampMat);
      lampM.position.set(x, 1.0, -2.25);
      d.add(lampM);
      const cage = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 4, 12), brassMat);
      cage.position.set(x, 1.0, -2.25);
      d.add(cage);
    }
  }
  /* Gate 2: crystal through the wall and the deck, lit from inside. */
  {
    const d = dress[2];
    const xMat = new THREE.MeshStandardMaterial({
      color: 0x7a5cff, emissive: 0x5a2fd0, emissiveIntensity: 0.9,
      roughness: 0.15, metalness: 0.1, flatShading: true
    });
    const shard = new THREE.CylinderGeometry(0, 1, 1, 6);
    shard.translate(0, 0.5, 0);
    const spots: [number, number, number, number, number][] = [
      [-1.35, -1.3, -1.7, 1.2, 0.2], [-1.05, -1.3, -1.3, 0.7, -0.3], [-1.5, -1.3, -2.1, 0.9, 0.35],
      [1.3, -1.3, -1.8, 1.0, -0.25], [1.05, -1.3, -1.25, 0.6, 0.3], [1.45, -1.3, -2.1, 1.4, 0.1],
      [-0.95, 1.8, -2.3, 0.55, 3.0], [0.9, 1.8, -2.3, 0.5, 2.9]
    ];
    for (const [x, y, z, h, tilt] of spots) {
      const m = new THREE.Mesh(shard, xMat);
      m.scale.set(0.16 * h, h, 0.16 * h);
      m.position.set(x, y, z);
      m.rotation.z = tilt;
      d.add(m);
    }
  }
  /* Gate 3: the door. Dark iron, and a red seam of heat low along the wall. */
  {
    const d = dress[3];
    const seamM = new THREE.Mesh(new THREE.BoxGeometry(RIGHT - LEFT, 0.05, 0.05),
      new THREE.MeshBasicMaterial({ color: 0xff4a3a, toneMapped: false }));
    seamM.position.set(0, -0.3, -2.4);
    d.add(seamM);
    put(d, prop('container-flat', ironMat, 0.8), -1.3, -1.32, -1.6, 0.2);
    put(d, prop('rocks', rockMat, 1.0), 1.35, -1.33, -1.6, -0.5);
  }

  /* --- lights: three, in every room ---

     The key light over the lift in the room's warm, a kicker from the left so
     the ship has an edge, and the accent on the wall behind it. Three point
     lights against a budget of seven, the same whichever room is showing. */
  const keyL = new THREE.PointLight(0xffc27a, 5.5, 6.0, 2);
  keyL.position.set(0.9, 1.0, 2.0);
  keyL.layers.enable(SHIP_LAYER);
  root.add(keyL);
  const kick = new THREE.PointLight(0x6fa8ff, 3.2, 5.0, 2);
  kick.position.set(-1.5, 0.3, 1.9);
  kick.layers.enable(SHIP_LAYER);
  root.add(kick);
  const accentL = new THREE.PointLight(0x5fd6ff, 4.0, 4.5, 2);
  accentL.position.set(0, 0.4, -1.6);
  root.add(accentL);

  let where = -1;
  function setPlace(place: number) {
    const i = Math.max(0, Math.min(PLACE_LOOKS.length - 1, place + 1));
    where = i - 1;
    const look = PLACE_LOOKS[i];
    wallMat.color.setHex(look.wall);
    /* A gate's lift band is the wrongness colour (AE): the gates are what the
       cores were holding shut, and the band is where that shows in the room.
       The pad's band is its own cyan. */
    bandMat.color.setHex(place >= 0 ? WRONGNESS : look.accent);
    accentL.color.setHex(look.accent);
    keyL.color.setHex(look.key);
    signs.forEach((m, j) => { m.visible = j === i; });
    dress.forEach((d, j) => { d.visible = j === i; });
  }
  setPlace(-1);

  return {
    group: root,
    crt,
    gauges,
    setPlace,
    place: () => where,
    step(t: number) {
      crt.step(t);
      for (const gg of gauges) gg.g.set(gg.read());
      /* The Ballast dial is not on the wall until the first core (AF). */
      gauges[2].g.group.visible = ballastStarted(g.ground);
    }
  };
}

/* A small lit label, drawn to a canvas and measured to fit - the same
   measure-and-shrink the shop plates and the group headers both needed. */
function makeLabel(text: string, color: number): THREE.Mesh {
  const W = 256, H = 56;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d')!;
  const col = '#' + color.toString(16).padStart(6, '0');
  x.fillStyle = col;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.letterSpacing = '2px';
  let size = 34;
  do {
    x.font = '700 ' + size + 'px "Chakra Petch", system-ui, sans-serif';
    if (x.measureText(text).width <= W - 16) break;
    size -= 2;
  } while (size > 12);
  x.fillText(text, W / 2, H / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 0.17),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })
  );
  m.renderOrder = 3;
  return m;
}
