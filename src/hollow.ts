/* The Hollow. Round fifteen, Y4, the ability tier 0's dark core hands over.

   His brief: *"It should also give you a new ability or mechanic."* The plan's
   rule for what that may be, from GMTK on Hollow Knight by way of `PLAN.md`
   X5: a verb or a lens, never a number - and the first one opens only a few
   locks, so there is no reason to backtrack yet.

   ---------- what it shows, and what it deliberately does not ----------

   Open space, through rock, within `HOLLOW_REACH` cells. Not ore, not devices,
   not Anchors, and never a direction: this game's decision is which way to
   dig, and the Receiver has held that fence since round eight - proximity and
   never bearing. A lens that named what was in a cavity would answer the
   question instead of informing it.

   It skips cells the player has already dug, which is what makes it read as an
   instrument rather than a highlight: what lights up is what you have NOT
   found. Standing in your own shaft, it shows nothing at all, and that is the
   correct answer.

   ---------- why it is drawn as flat quads and not as lit boxes ----------

   The thing being drawn is a hole, and a hole has no surface. An instanced box
   with a material on it reads as a block sitting inside the rock, which is the
   opposite of the information. A flat additive quad at the cell's centre reads
   as a glow coming from behind the wall - the same grammar the ore haloes
   already use, and the same reason they work.

   Additive and depth-test OFF, because the whole point is that it is seen
   THROUGH rock. `depthWrite` off too, or the quads occlude each other and the
   nearer ones punch holes in the field. */

import * as THREE from 'three';
import { scene } from './scene';
import { g } from './sim/state';
import { blockAt } from './sim/world';
import { key } from './sim/util';
import { worldX, glowTex } from './materials';
import { HOLLOW_REACH } from './sim/ability';

/* One shared plane, scaled per instance. A cell is one unit across and the
   quad is a little smaller, so neighbouring cells read as a row of lights
   rather than as one continuous sheet - a cave with a shape is the
   information, and a solid block of glow has none. */
const QUAD = new THREE.PlaneGeometry(0.82, 0.82);

const MAT = new THREE.MeshBasicMaterial({
  map: glowTex,
  color: 0x9a6cff,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthTest: false,
  depthWrite: false,
  opacity: 0.5
});

/* The most cells the lens can ever light at once: every cell inside the reach.
   Sized from the constant rather than from a number, so widening the lens
   cannot silently start dropping cells off the end of the pool. */
const MAX = (HOLLOW_REACH * 2 + 1) * (HOLLOW_REACH * 2 + 1);

const mesh = new THREE.InstancedMesh(QUAD, MAT, MAX);
mesh.frustumCulled = false;
mesh.renderOrder = 6;
mesh.count = 0;
mesh.visible = false;
/* Between the haze and the ship: it has to sit over the rock it is seen
   through, and under the hull, or the ship flies behind its own instrument. */
mesh.position.z = 0.86;
scene.add(mesh);

const m = new THREE.Matrix4();

/* How many cells the lens is lighting right now. For the e2e, which cannot
   read an InstancedMesh's count from outside the module and has to be able to
   tell "the lens is on" from "the lens is on and drawing nothing". */
export function hollowCount() { return mesh.visible ? mesh.count : 0; }

/* Draw the lens around the ship, or clear it.

   `on` is the only argument that matters; everything else is read off the
   world, because the lens has no state of its own. That is deliberate - an
   instrument that remembered what it saw would be a map, and the map is earned
   one Anchor at a time. */
export function drawHollow(on: boolean, t: number) {
  if (!on) {
    if (mesh.visible) { mesh.visible = false; mesh.count = 0; }
    return;
  }
  const cx = Math.round(g.px), cd = Math.round(g.pd);
  let n = 0;
  for (let dx = -HOLLOW_REACH; dx <= HOLLOW_REACH; dx++) {
    for (let dd = -HOLLOW_REACH; dd <= HOLLOW_REACH; dd++) {
      /* A disc and not a square. A square lens has corners, and a corner is a
         direction - which is the one thing this must not give. */
      if (dx * dx + dd * dd > HOLLOW_REACH * HOLLOW_REACH) continue;
      const x = cx + dx, d = cd + dd;
      if (d < 0) continue;
      /* Already dug is already known. */
      if (g.dug.has(key(x, d))) continue;
      const b = blockAt(x, d);
      if (b !== null) continue;
      if (n >= MAX) break;
      /* Dimmer toward the edge of the reach, so the lens has a falloff rather
         than a rim - a hard circle would read as the instrument's own edge
         instead of as something seen through rock. */
      const f = 1 - Math.sqrt(dx * dx + dd * dd) / (HOLLOW_REACH + 1);
      /* And a slow breath, so a field of quads that never changes does not
         read as part of the HUD. */
      const s = (0.55 + f * 0.65) * (0.94 + Math.sin(t * 2.1 + (x + d) * 0.7) * 0.06);
      m.makeScale(s, s, 1);
      m.setPosition(worldX(x), -d, 0);
      mesh.setMatrixAt(n++, m);
    }
  }
  mesh.count = n;
  mesh.visible = n > 0;
  mesh.instanceMatrix.needsUpdate = true;
}
