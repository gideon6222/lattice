/* Cysts: sealed air in dense rock. Round seventeen, AQ.

   His ask of 2026-09-25: *"Plan more for tier 2."* Fable's review of the plan
   named what this has to be: a kind of thing tier 2 has that no tier above it
   has, with two prices to get in and legible before a player commits.

   A cyst is a small pocket of air sealed inside a shell of much denser rock -
   the band's hardness times four - holding a cache, and usually a key pocket
   too, since each is built around one where it can be. Two ways in:

     DRILL     through the shell, four times the rock around it a cell
     SINK      straight through it, paying in hull - Sink is sold at the first
               gate, the top of tier 2, and until now nothing rewarded it

   And a way to see one first: the shell is its own rock, drawn differently
   from the band around it; the Hollow (the first core's gift) shows the void
   inside; and the Sensors name a key in it. So each tier's gift opens the next
   tier's secret, and a cyst is never an invisible wall.

   ---------- how they are placed ----------

   Pure and seeded, on offsets 1401 and up, which were free. Each is placed
   only where every cell of its footprint is ordinary generated ground - not a
   room, not a barrier, not a crate, not another key - and a cyst that cannot
   find such ground in its tries is simply not on this world. So cysts take
   cells the generator made and nothing else, which is what makes them an
   OVERWRITER in blocks.test.mjs's sense. */

import { W } from './config';
import { rnd } from './util';
import { keyPockets } from './keys';

/* The band they live in: tier 2, clear of both barriers. */
export const CYST_LO = 118;
export const CYST_HI = 220;
export const CYST_COUNT = 7;
export const CYST_HARD = 4;
const TRIES = 16;
const SEED = 1401;

/* Footprint: a 3 x 2 air pocket inside a one-cell shell, so 5 x 4. The
   interior's top-left cell is the cache; a key pocket, when there is one, is
   placed at the interior's bottom-right. */
export const CYST_W = 5, CYST_H = 4;

export type CystCell = 'shell' | 'air' | 'cache' | 'key';
export interface Cyst { x0: number; d0: number; key: string | null; }

let cache: { cysts: Cyst[]; cells: Map<string, CystCell> } | null = null;
/* Set while the plan is being built, so the world answers without cysts in
   it - the plan is placed on the ground as it would be without them. */
let building = false;
export function cystsBuilding() { return building; }

export function cystPlan(ground: (x: number, d: number) => { ok: boolean }): { cysts: Cyst[]; cells: Map<string, CystCell> } {
  if (cache) return cache;
  building = true;
  const cysts: Cyst[] = [];
  const cells = new Map<string, CystCell>();
  try {
    const pockets = keyPockets(0).pockets
      .filter((p) => p.cells.length === 1 && p.cells[0][1] >= CYST_LO + 2 && p.cells[0][1] <= CYST_HI - 1);
    for (let i = 0; i < CYST_COUNT; i++) {
      let placed: Cyst | null = null;
      for (let t = 0; t < TRIES && !placed; t++) {
        /* Around a key pocket first, on the pocket's own roll; failing that,
           anywhere in the band. */
        const pk = t < TRIES / 2 && pockets.length
          ? pockets[Math.floor(rnd(i * 31 + t, i * 7 + 3, SEED) * pockets.length) % pockets.length]
          : null;
        let x0: number, d0: number;
        if (pk) {
          x0 = pk.cells[0][0] - 3; d0 = pk.cells[0][1] - 2;
        } else {
          x0 = 1 + Math.floor(rnd(i * 17 + t, i * 5 + 11, SEED + 1) * (W - CYST_W - 2));
          d0 = CYST_LO + Math.floor(rnd(i * 13 + t, i * 23 + 7, SEED + 2) * (CYST_HI - CYST_LO - CYST_H));
        }
        if (x0 < 1 || x0 + CYST_W > W - 1 || d0 < CYST_LO || d0 + CYST_H > CYST_HI) continue;
        let ok = true;
        for (let dx = -1; dx <= CYST_W && ok; dx++) {
          for (let dd = -1; dd <= CYST_H && ok; dd++) {
            if (cells.has((x0 + dx) + ',' + (d0 + dd))) ok = false;
          }
        }
        for (let dx = 0; dx < CYST_W && ok; dx++) {
          for (let dd = 0; dd < CYST_H && ok; dd++) {
            const x = x0 + dx, d = d0 + dd;
            const isKeyCell = pk && x === pk.cells[0][0] && d === pk.cells[0][1];
            if (!isKeyCell && !ground(x, d).ok) ok = false;
          }
        }
        if (ok) placed = { x0, d0, key: pk ? pk.id : null };
      }
      if (!placed) continue;
      cysts.push(placed);
      for (let dx = 0; dx < CYST_W; dx++) {
        for (let dd = 0; dd < CYST_H; dd++) {
          const inner = dx >= 1 && dx <= 3 && dd >= 1 && dd <= 2;
          const kind: CystCell = !inner ? 'shell'
            : dx === 1 && dd === 1 ? 'cache'
            : placed.key && dx === 3 && dd === 2 ? 'key' : 'air';
          cells.set((placed.x0 + dx) + ',' + (placed.d0 + dd), kind);
        }
      }
    }
  } finally {
    building = false;
  }
  cache = { cysts, cells };
  return cache;
}

/* For tests and a world change. */
export function resetCysts() { cache = null; }
