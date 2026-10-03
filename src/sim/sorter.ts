/* The Ore Sorter: the first feat gift. Progression round, BD.

   A full hold stops being a wall in a rich seam. When an ore will not fit, the
   bit may swap out one unit of the cheapest ore it carries for the new find,
   instead of leaving the find in the rock. The swapped ore is not lost: the
   caller sets it down where the find came from, as a full hold always did.

   Rungs widen how many kinds it will weigh up and, at the top, let a key
   mineral go first (a key is banked, never sold, so a hold with room only for
   money ore should still make way for one):

     1  looks at the cheapest ore kind in the hold,
     2  the two cheapest,
     3  every kind, and a key displaces a money ore.

   Pure: the caller holds the cargo and applies the answer. */

import { DEF, isOre, isKey } from './config';

export const SORTER_MAX = 3;

/* The kind to put down so `id` fits, or null when the Sorter will not swap
   (no Sorter, nothing cheaper, or one unit would not free enough weight). */
export function sortSwap(cargo: Record<string, number>, weight: number, cap: number,
                         id: string, level: number): string | null {
  if (level <= 0) return null;
  const inc = DEF[id];
  if (!inc || !isOre(inc)) return null;
  const incKey = isKey(id);
  /* A key outranks money ore only at the top rung; below it, a key is judged
     by its own value like any other ore. */
  const rank = incKey && level >= SORTER_MAX ? Infinity : inc.value;
  const held = Object.keys(cargo)
    .filter((k) => cargo[k] > 0 && !isKey(k) && DEF[k] && isOre(DEF[k]))
    .sort((a, b) => DEF[a].value - DEF[b].value || (a < b ? -1 : 1));
  const weighed = level >= SORTER_MAX ? held : held.slice(0, level);
  for (const k of weighed) {
    if (DEF[k].value >= rank) break;
    if (weight - DEF[k].wt + inc.wt <= cap) return k;
  }
  return null;
}

/* Put the swap into effect on a cargo and its weight. Returns the kind that
   was put down. */
export function applySwap(cargo: Record<string, number>, weight: number, victim: string,
                          id: string): number {
  cargo[victim]--;
  if (cargo[victim] <= 0) delete cargo[victim];
  cargo[id] = (cargo[id] || 0) + 1;
  return weight - DEF[victim].wt + DEF[id].wt;
}
