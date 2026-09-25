/* Where the keys are. Round seventeen, AL.

   His ask of 2026-09-25: *"restructuring where and how much of different
   valuable minerals/ore is found... I want it to be more rare and feel
   exciting when you find some... key ingredients you are trying to find."*

   The census of every cell found why the first rarity pass did not land: the
   rare minerals rolled out of the same vein ladder as copper, so they sat
   nowhere in particular (no region bias at all, so a map could not point at
   them) and came in veins big enough that one find finished a recipe.

   So keys no longer roll out of the ladder. Each key is a fixed set of small
   POCKETS - one or two cells, never enough to finish a band of the ladder on
   their own - placed on their own seed inside the key's depth window, most of
   them in one HOME region the map can name and the rest anywhere in the
   window, so the home is where to hunt and never the only place to look.

   Pure and seeded: the same world every time, testable cell by cell, and an
   OVERWRITER in `blockAt` - it replaces the cell it lands on and consumes no
   roll of anything else. Offsets 1301 to 1309, which were free. */

import { rnd } from './util';
import { W } from './config';
import { regionAt, REGION_COLS, REGION_ROWS, WORLD_DEPTH } from './region';

export interface KeyPlan {
  id: string;
  /* The depth window, inclusive. */
  lo: number; hi: number;
  /* Which region rows the home may be rolled in. */
  rows: number[];
  pockets: number;
  /* The largest a pocket may be, in cells. One: a rung asks for one key, so a
     pocket is one rung and never a whole band of the ladder. */
  size: number;
}

/* Deepest last, like the ladder they replace. Every window ends above the last
   gate's door (398 m): a key has to be findable before the ending, not in it. */
export const KEY_PLANS: KeyPlan[] = [
  { id: 'amethyst', lo: 85, hi: 205, rows: [0, 1], pockets: 40, size: 1 },
  { id: 'emerald', lo: 118, hi: 222, rows: [1], pockets: 40, size: 1 },
  { id: 'ruby', lo: 150, hi: 320, rows: [1, 2], pockets: 36, size: 1 },
  /* Home at the TOP of the heat zone (200-226 m, row 1's floor): the Cooling
     Rig asks for magmite, so the first magmite has to be a heat run you can
     survive without it. With its home at 230-340 m the campaign probe sat on
     130,000 credits unable to reach any. */
  { id: 'magmite', lo: 200, hi: 340, rows: [1], pockets: 40, size: 1 },
  { id: 'coreite', lo: 250, hi: 392, rows: [2, 3], pockets: 20, size: 1 },
  { id: 'umbrite', lo: 300, hi: 392, rows: [2, 3], pockets: 10, size: 1 },
  { id: 'solmarrow', lo: 345, hi: 394, rows: [3], pockets: 5, size: 1 }
];

/* The share of a key's pockets that sit in its home region. */
export const HOME_SHARE = 0.6;

const SEED = 1301;

export interface Pocket { id: string; home: boolean; cells: [number, number][]; }

/* A key's home region, rolled once per world. */
export function keyHome(p: KeyPlan, planet = 0): number {
  const i = KEY_PLANS.indexOf(p);
  const row = p.rows[Math.floor(rnd(i * 7 + 3, 11, planet + SEED) * p.rows.length) % p.rows.length];
  const col = Math.floor(rnd(i * 13 + 5, 17, planet + SEED + 1) * REGION_COLS) % REGION_COLS;
  return row * REGION_COLS + col;
}

let cache: { planet: number; pockets: Pocket[]; cells: Map<string, string> } | null = null;

/* Every pocket in the world, and the cell-to-key lookup `blockAt` reads. */
export function keyPockets(planet = 0): { pockets: Pocket[]; cells: Map<string, string> } {
  if (cache && cache.planet === planet) return cache;
  const pockets: Pocket[] = [];
  const cells = new Map<string, string>();
  const band = WORLD_DEPTH / REGION_ROWS;
  const span = W / REGION_COLS;
  KEY_PLANS.forEach((p, ki) => {
    const home = keyHome(p, planet);
    const hr = Math.floor(home / REGION_COLS), hc = home % REGION_COLS;
    const homeN = Math.round(p.pockets * HOME_SHARE);
    for (let i = 0; i < p.pockets; i++) {
      const inHome = i < homeN;
      let x = 0, d = 0, ok = false;
      for (let t = 0; t < 12 && !ok; t++) {
        const a = rnd(ki * 101 + i * 7 + t, i * 13 + t * 3, planet + SEED + 2);
        const b = rnd(ki * 103 + i * 11 + t, i * 17 + t * 5, planet + SEED + 3);
        if (inHome) {
          const dlo = Math.max(p.lo, Math.round(hr * band)), dhi = Math.min(p.hi, Math.round((hr + 1) * band) - 1);
          x = Math.floor(hc * span + a * span);
          d = Math.round(dlo + b * Math.max(0, dhi - dlo));
          ok = regionAt(x, d) === home;
        } else {
          x = 1 + Math.floor(a * (W - 2));
          d = Math.round(p.lo + b * (p.hi - p.lo));
          ok = true;
        }
        if (ok && cells.has(x + ',' + d)) ok = false;
      }
      if (!ok) continue;
      const pk: Pocket = { id: p.id, home: inHome, cells: [[x, d]] };
      if (p.size > 1 && rnd(ki * 107 + i, i * 19, planet + SEED + 4) < 0.55) {
        const across = rnd(ki * 109 + i, i * 23, planet + SEED + 5) < 0.5;
        const nx = across ? Math.min(W - 1, x + 1) : x, nd = across ? d : d + 1;
        if (!cells.has(nx + ',' + nd) && nd <= p.hi) pk.cells.push([nx, nd]);
      }
      for (const [cx, cd] of pk.cells) cells.set(cx + ',' + cd, p.id);
      pockets.push(pk);
    }
  });
  cache = { planet, pockets, cells };
  return cache;
}

/* The key at a cell, or null. */
export function keyAt(x: number, d: number, planet = 0): string | null {
  return keyPockets(planet).cells.get(x + ',' + d) ?? null;
}

/* ---------- the Sensors line hears keys: round seventeen, AM ----------

   How far, in cells, the ship's sensors hear a key pocket. The scanner is the
   Sensors line's opening rung and the Deep Survey its found device, so both
   widen it; with neither it hears only what the drill is about to touch. */
export function senseRange(scan: number, survey: number): number {
  return 2 + scan * 0.5 + survey * 1.6;
}

/* The NAME of the nearest key pocket still in the rock within `range`, or
   null. Never the cell and never a bearing: like the Receiver it says near,
   never where - choosing a direction and digging it is the game's decision,
   and an instrument that answered it outright would take the decision away. */
export function keyNear(x: number, d: number, range: number, dug: (cx: number, cd: number) => boolean,
                        planet = 0): string | null {
  let best: string | null = null, bestD = Infinity;
  for (const p of keyPockets(planet).pockets) {
    for (const [cx, cd] of p.cells) {
      const dx = cx - x, dd = cd - d;
      const dist = Math.sqrt(dx * dx + dd * dd);
      if (dist > range || dist >= bestD || dug(cx, cd)) continue;
      best = p.id; bestD = dist;
    }
  }
  return best;
}
