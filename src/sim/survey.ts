/* What the Survey map knows about where the ground is rich.

   Round fourteen, X4, and the first Anchor's gift. His ask, 2026-09-19: *"since
   it start filling out the map, it would be cool if you could add an indication
   on the map that materials or secrets, or a higher concentration of valuable
   minerals are in certain areas. It would only show for areas that you have
   found the anchor."*

   ---------- the fence this sits behind ----------

   The Lattice Receiver tells you how NEAR an unlit Anchor is and deliberately
   never which way, because choosing a direction and digging it is the decision
   this game is built on. Anything the map says about minerals has to stay on
   that side of the line.

   So the grain is a REGION and never a cell. A region is about fifteen columns
   by a hundred and thirteen metres; knowing one of them is rich is a reason to
   go there and is not a map to anything. The research names the failure mode by
   name - No Man's Sky's Analysis Visor pins exact resource nodes and its own
   community describes it as reducing exploration to walking to icons - and the
   precedent to copy is Valheim's Wishbone, which is nearer-and-not-which-way,
   the same shape the Receiver already has.

   ---------- why it is measured against the ROW and not the world ----------

   Measured before the tiers were designed, as mean ore value per sampled cell:

     row 0 (surface)   Verdax 11    Rustmoor 12    Cryon 22
     row 1             Ashvault 68  Kryllon 52     Tessivar 76
     row 2             Obrinth 53   Palewell 213   Serrik 56
     row 3 (deep)      Vantomir 896 Halcyne 121    Dross 454

   **Compared across the whole world this says nothing a player does not
   already know.** Ore is depth-gated and the game tells you so; a heat map that
   lights up the bottom of the world is a picture of the depth ladder. Down a
   ROW the spread is the interesting part and it is large - Palewell holds four
   times what its two neighbours do at the same depth, and Halcyne is a quarter
   of Vantomir's. That is a reason to cross the world sideways, which is the one
   direction this game has never given anybody a reason to go. */

import { W, ORES } from './config';
import { REGION_COLS, REGION_COUNT, WORLD_DEPTH, regionAt } from './region';
import { g, coreM } from './state';
import { blockAt } from './world';

/* Every third cell in each axis, so about a ninth of the world. The sweep is
   the expensive thing here - `blockAt` is a dozen seeded hashes deep - and a
   ninth of 27,572 cells is three thousand samples, which is plenty to rank
   twelve regions and cheap enough to do on a phone in one frame.

   The stride is deliberately coprime with neither the region grid nor the vein
   block, which are 4 wide: a stride of 4 would sample the same offset inside
   every vein block for ever and could miss whole veins systematically. */
export const SURVEY_STRIDE = 3;

/* What counts as rich, and what counts as lean, as a ratio against the mean of
   that region's own depth row. Measured ratios run 0.25 to 1.99, and these
   leave most regions ordinary on purpose: if every region carries a mark then
   the map is a wash and the player is back to reading depth. */
export const SURVEY_RICH = 1.35;
export const SURVEY_LEAN = 0.70;

export type Richness = -1 | 0 | 1;

/* Built once and kept. It is a property of the SEED - the same world always has
   the same rich regions - so it cannot change, and recomputing it would be
   three thousand `blockAt` calls every time the map opened. */
let cache: Richness[] | null = null;

/* Ignore what has been dug and what has fallen, so the reading is about the
   GROUND rather than about the player's own history.

   `blockAt` returns null for a dug cell and `fallen` for a collapsed region, so
   a sweep that respected either would tell a player who had mined out Palewell
   that Palewell was poor - and would give two players with the same seed
   different maps. Swapped and restored rather than reimplemented from the ore
   ladder: re-deriving what blockAt does is how the two drift apart, and this
   module would be the one that was wrong. */
function sweep(): Richness[] {
  const dug = g.dug, collapsed = g.ground.collapsed;
  g.dug = new Set();
  g.ground.collapsed = [];
  const ids = new Set(ORES.map((o) => o.id));
  const value = new Array(REGION_COUNT).fill(0);
  const cells = new Array(REGION_COUNT).fill(0);
  try {
    const floor = coreM();
    for (let d = 0; d < floor; d += SURVEY_STRIDE) {
      for (let x = 0; x < W; x += SURVEY_STRIDE) {
        const r = regionAt(x, d);
        cells[r]++;
        const b = blockAt(x, d);
        if (b && b.ore && ids.has(b.id)) value[r] += b.value;
      }
    }
  } finally {
    g.dug = dug;
    g.ground.collapsed = collapsed;
  }

  const mean = value.map((v, r) => v / Math.max(1, cells[r]));
  const out: Richness[] = new Array(REGION_COUNT).fill(0);
  /* Row by row, because the comparison that carries information is between
     regions at the same depth. */
  for (let row = 0; row * REGION_COLS < REGION_COUNT; row++) {
    const idx = [];
    for (let c = 0; c < REGION_COLS; c++) {
      const r = row * REGION_COLS + c;
      if (r < REGION_COUNT) idx.push(r);
    }
    const rowMean = idx.reduce((a, r) => a + mean[r], 0) / Math.max(1, idx.length);
    if (rowMean <= 0) continue;
    for (const r of idx) {
      const ratio = mean[r] / rowMean;
      out[r] = ratio >= SURVEY_RICH ? 1 : ratio <= SURVEY_LEAN ? -1 : 0;
    }
  }
  return out;
}

export function richnessOf(region: number): Richness {
  if (!cache) cache = sweep();
  return cache[region] ?? 0;
}

/* For the tests and for a world change. */
export function resetSurvey() { cache = null; }

/* Whether the map may say anything about this region at all.

   His words: "It would only show for areas that you have found the anchor."
   Same gate the map reveal already uses, so a region you have not settled shows
   the ground you have walked and nothing about what is in it. */
export function surveyKnown(lit: readonly number[], region: number): boolean {
  return lit.includes(region);
}

/* The whole world is 61 columns and 452 metres, so a region is roughly this
   much of it - stated here because the fence above is an argument about SIZE
   and an argument about size should carry its numbers. */
export const REGION_SPAN_X = Math.round(W / REGION_COLS);
export const REGION_SPAN_D = Math.round(WORLD_DEPTH / (REGION_COUNT / REGION_COLS));
