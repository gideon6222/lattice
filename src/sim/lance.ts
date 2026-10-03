/* The Arc Lance: the second barrier's vault find. Progression round, BG.

   A charged shot that follows a vein of one ore through the rock and breaks all
   of it within reach. The Charge is an area and the Laser a straight line, so
   this is a third shape: it finds the first ore along the facing, then spreads
   through the ore of that same kind that touches it.

   Four rungs: how far ahead it looks for a vein, and how many cells of it one
   shot will take. Pure: the caller says what each cell is and breaks the list. */

export const LANCE_MAX = 4;
export const LANCE_CHARGE = 2;

const LOOK = [0, 4, 6, 8, 10];
const CELLS = [0, 6, 10, 16, 24];
const clampLevel = (l: number) => Math.max(0, Math.min(LANCE_MAX, Math.floor(l || 0)));
export const lanceLook = (level: number) => LOOK[clampLevel(level)];
export const lanceCells = (level: number) => CELLS[clampLevel(level)];

/* What a cell is: the id of an ore, '' for rock that is not ore, null for air.
   Crates, caches, hazards and anything unbreakable are '' to the lance: it
   follows ore and leaves everything else alone. */
export type CellKind = (x: number, d: number) => string | null;

/* The cells one shot breaks, nearest the ship first, or an empty list when
   there is no ore inside the look. */
export function lanceVein(kindAt: CellKind, sx: number, sd: number, dx: number, dy: number, level: number): number[][] {
  const look = lanceLook(level), cap = lanceCells(level);
  let first: number[] | null = null, ore = '';
  for (let i = 1; i <= look; i++) {
    const x = sx + dx * i, d = sd + dy * i;
    const k = kindAt(x, d);
    if (k) { first = [x, d]; ore = k; break; }
  }
  if (!first) return [];
  const out: number[][] = [first];
  const seen = new Set<string>([first[0] + ',' + first[1]]);
  for (let h = 0; h < out.length && out.length < cap; h++) {
    const [cx, cd] = out[h];
    for (let ax = -1; ax <= 1 && out.length < cap; ax++)
      for (let ay = -1; ay <= 1 && out.length < cap; ay++) {
        if (!ax && !ay) continue;
        const x = cx + ax, d = cd + ay, k = x + ',' + d;
        if (seen.has(k)) continue;
        seen.add(k);
        if (kindAt(x, d) === ore) out.push([x, d]);
      }
  }
  return out;
}
