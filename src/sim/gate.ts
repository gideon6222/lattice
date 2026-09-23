/* The forcefields that cut the world into tiers. Round fifteen, Y1.

   His brief, 2026-09-19: *"Have a certain number of anchors that need to be
   released before you can get past a certain depth ... It controls a forcefield
   or something similar that blocks your path. Once you destroy it, the
   forcefield releases and you can go further down."*

   ---------- the geometry was already here ----------

   Nothing about the shape of this was invented. The world has been four region
   ROWS of 113 m since round eight, with three Anchors in each of the top three
   rows and none in the deepest, which is where the Vault sits at 405 m. So:

     tier 0    0 - 113 m    Verdax, Rustmoor, Cryon        gate at 113
     tier 1  113 - 226 m    Ashvault, Kryllon, Tessivar    gate at 226
     tier 2  226 - 339 m    Obrinth, Palewell, Serrik      gate at 339
     tier 3  339 - 452 m    no Anchors. The Vault.

   Three gates, three Anchors apiece, and the deepest gate is the Vault's own
   door. That is the reading the existing geometry suggests for the question his
   brief leaves open - whether the Vault is still the ending - and it is his to
   confirm, not this file's to decide. Y1 does not depend on the answer: the
   barriers are the same either way.

   ---------- what a gate is ----------

   One cell thick, the full width of the world, at a fixed depth. Not wandering
   like a region boundary: a barrier you have to find the end of is a maze, and
   a barrier with no end is a statement. Uncuttable by everything - the drill, a
   charge, the laser - because a forcefield you can drill is a wall.

   It is checked BEFORE the authored rooms in `blockAt`, so a hall or a wreck
   that happens to sit on a gate depth has the barrier run through it rather
   than punching a hole in the planet. A room is nine cells tall and a gate is
   one, so what that looks like is a room with a seam across it, which is the
   right read for something planet-wide. */

import { REGION_ROWS, REGION_COLS, REGION_COUNT, WORLD_DEPTH } from './region';
import { W } from './config';
import { rnd } from './util';

/* One fewer than the rows: the bottom tier has no gate under it, it has the
   floor of the world. */
export const GATE_COUNT = REGION_ROWS - 1;

/* How many Anchors open one gate. Derived rather than chosen - it is however
   many the world already puts in a row, and that is what makes three the
   answer rather than a number somebody liked. */
export const ANCHORS_PER_GATE = REGION_COLS;

/* The depth of tier `t`'s gate, which is the bottom edge of that tier. */
export function gateDepth(tier: number): number {
  return Math.round((WORLD_DEPTH / REGION_ROWS) * (tier + 1));
}

/* Which tier a depth is in, 0 at the surface.

   `depthTier` and not `tierOf`, because `unrest.ts` has exported a `tierOf`
   since round eight that means something completely different - how many
   Anchors are lit, which is the Ballast's tier. Two star-exports of one name
   are AMBIGUOUS and an ES module drops them both without a word, so the first
   version of this simply did not exist at the test harness and failed as
   "H.tierOf is not a function". A collision that silently deletes both sides is
   worse than one that shadows, and the fix is the name. */
export function depthTier(d: number): number {
  const t = Math.floor(d / (WORLD_DEPTH / REGION_ROWS));
  return t < 0 ? 0 : t >= REGION_ROWS ? REGION_ROWS - 1 : t;
}

/* The Anchors that open tier `t`'s gate. Regions are numbered row-major, so a
   tier's Anchors are its row's, and `anchorAt` already places them there. */
export function gateAnchors(tier: number): number[] {
  const out: number[] = [];
  for (let c = 0; c < ANCHORS_PER_GATE; c++) {
    const r = tier * ANCHORS_PER_GATE + c;
    if (r < REGION_COUNT) out.push(r);
  }
  return out;
}

/* Which gate sits exactly at this depth, or -1. */
export function gateAtDepth(d: number): number {
  for (let t = 0; t < GATE_COUNT; t++) if (gateDepth(t) === d) return t;
  return -1;
}

/* Whether the ship may pass a depth. The default is blocked and the exception
   is a gate that has been opened, which is the way round his brief asks for:
   the world is shut until you earn it. */
export function gateBlocks(d: number, open: readonly number[]): boolean {
  const t = gateAtDepth(d);
  return t >= 0 && !open.includes(t);
}

/* Whether every Anchor of a tier is lit, which is what makes its core appear
   (Y2) and therefore what makes the gate openable at all. */
export function gateReady(tier: number, lit: readonly number[]): boolean {
  const need = gateAnchors(tier);
  return need.length > 0 && need.every((r) => lit.includes(r));
}

/* The deepest metre the ship can currently reach, for a test or a readout.
   Everything below the shallowest shut gate is unreachable. */
export function reachableDepth(open: readonly number[]): number {
  for (let t = 0; t < GATE_COUNT; t++) if (!open.includes(t)) return gateDepth(t) - 1;
  return WORLD_DEPTH;
}

/* ---------- the dark-energy core ----------

   Round fifteen, Y2. His brief: *"Once the anchors are broken, an unbreakable
   block will open up that looks inviting but full of dark energy. It controls a
   forcefield or something similar that blocks your path."*

   **It sits IN the barrier**, one cell of it, rather than somewhere else in the
   tier. Three reasons and the first is his: the block that "controls the
   forcefield" belongs on the forcefield. The second is that a player who has
   met the barrier already knows exactly where to look, so the hunt is for the
   Anchors and never for the thing they unlock. The third is that it makes the
   barrier tell its own story - a wall that grows an inviting door is a better
   sentence than a wall and a door in different rooms.

   The column is seeded per tier and kept clear of the world edges, so the three
   cores are in three different places and none of them is in a corner.

   Offset 1069, which was free: 11, 23, 41, 77, 91, 131, 137, 173, 211, 257,
   311, 313, 421, 431, 601, 619 (and 620, 621), 643, 733, 887, 977, 1013 and
   1063 to 1066 are taken. */
const CORE_EDGE_PAD = 6;

export function coreColumn(tier: number): number {
  const span = W - 1 - CORE_EDGE_PAD * 2;
  return Math.round(CORE_EDGE_PAD + rnd(tier * 37 + 11, tier * 13 + 5, 1069) * span);
}

/* What a cell of the barrier layer IS right now. Four states and they are the
   whole of the tier's story:

     'wall'   the tier's Anchors are not all broken yet
     'core'   they are, and this is the one cell that opens the gate
     'spent'  the core has been broken; it stays for ever as a lit monument
     'open'   the rest of the barrier, once the gate is down: nothing at all

   One function so that `blockAt`, the map and any test all read the same
   answer. Two places deciding what a barrier cell is would be the bug where
   the world draws a wall the ship can fly through. */
export type GateCell = 'wall' | 'core' | 'spent' | 'open';

export function gateCellAt(
  x: number, d: number, lit: readonly number[], open: readonly number[]
): GateCell | null {
  const t = gateAtDepth(d);
  if (t < 0) return null;
  const isCore = x === coreColumn(t);
  if (open.includes(t)) return isCore ? 'spent' : 'open';
  if (isCore && gateReady(t, lit)) return 'core';
  return 'wall';
}

/* ---------- breaking the core ----------

   Round fifteen, Y3. His brief: *"Once you destroy it, the forcefield releases
   and you can go further down."*

   **It never comes back.** A gate that can re-lock is a chore, and this game
   already has one thing that takes ground back from you - a collapse - which
   works precisely because it takes a REGION and never a rung of the ladder.
   Nothing in the game removes a tier from this list, and the load filter is
   the only other writer.

   Pure, and separate from the moment in `actions.ts`, for the ordinary reason:
   what opening a gate DOES to the state is a save question and has to be
   testable with no renderer in the room. It answers whether it actually opened
   anything, so the caller can tell a first break from a repeat and only the
   first one gets the card.

   Idempotent by checking rather than by sorting afterwards: the list is the
   record of an irreversible event, so a second copy of tier 1 is not a
   cosmetic duplicate, it is the state claiming something happened twice. */
export function openGate(open: number[], tier: number): boolean {
  if (tier < 0 || tier >= GATE_COUNT || open.includes(tier)) return false;
  open.push(tier);
  return true;
}

/* Which gate a core at this depth opens, or -1 if there is no core here.

   The cell and the consequence come off ONE question, so a core the player can
   cut is always a core that opens something. Asking `gateAtDepth` at the dig
   site and trusting it would open a gate for any cell on the barrier row, and
   every one of those is `hard: Infinity`, right up until somebody adds a way
   through a wall and quietly gains a way through every gate in the game. */
export function coreOpens(
  x: number, d: number, lit: readonly number[], open: readonly number[]
): number {
  return gateCellAt(x, d, lit, open) === 'core' ? gateAtDepth(d) : -1;
}

/* ---------- Y8: the gate station ----------

   Round fifteen, Y8. His words: "at every tier gate: a shop and a save
   point." *Each barrier is already a place to stop* - every player of a tier
   passes through its one cuttable cell to get below it, and once it is spent
   that cell is a lit monument nobody can cut away (Y3, Y14). Putting the
   station there costs no new world: no fixture, no model, no second thing to
   find. One station per tier, which is what the milestone's own receipt asks
   for - `gateDepth`/`coreColumn` already guarantee that, since each tier has
   exactly one gate and each gate exactly one core column.

   Reach is the same shape as an Anchor's: the cell itself and its four
   neighbours, so arriving from any side counts. A gate that has not opened
   yet has no station - the core is still the thing blocking the way, not a
   place to stop at. */
export function gateNear(x: number, d: number, open: readonly number[]): number {
  for (const t of open) {
    const cx = coreColumn(t), cd = gateDepth(t);
    for (const n of [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]]) {
      if (x + n[0] === cx && d + n[1] === cd) return t;
    }
  }
  return -1;
}
