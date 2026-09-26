/* What each counter sells. Round seventeen, AO.

   The plan's line: *"Gate vendors are different rooms around the same lift,
   never a second UI."* The bay is the same everywhere; what changes is the
   stock. The pad sells every rung of every line and every supply, and it is
   the only place that sells supplies for credits. A gate sells only the rungs
   up to the top of the tier it opens onto, plus two things the pad never has:

   - SINK, at the first gate. It came from no core after round seventeen moved
     the last gate onto the Vault's door (`ability.ts`), and it is bought here
     as a skill, once, for credits and amethyst.
   - ONE key-priced supply a visit. A key is what the depths pay in, so a gate
     trades in it; one a visit, so a gate is a lifeline and never a shop you
     can stand in until the hold is full.

   Pure: the bay reads it, and the test that each vendor's stock differs reads
   the same function the player sees. */

import { UPGRADES, TIER_DEPTHS, levelCap, shelfStock } from './config';
import { GATE_COUNT, gateDepth } from './gate';
import type { Upgrade, SupplyKey } from '../types';

/* -1 is the pad; 0 .. GATE_COUNT-1 is the gate at `gateDepth(t)`. */
export type Place = number;
export const PAD: Place = -1;

/* The one key-priced supply each gate trades, a visit. Each key is one the
   tier above the gate yields, so the price is something the player can have. */
export interface KeyDeal { supply: SupplyKey; key: string; need: number; }
export const GATE_DEAL: KeyDeal[] = [
  { supply: 'cell', key: 'amethyst', need: 1 },
  { supply: 'patch', key: 'ruby', need: 1 },
  { supply: 'bulwark', key: 'coreite', need: 1 }
];

/* Sink, sold once, at the first gate. */
export const SINK_GATE = 0;
export const SINK_PRICE = { credits: 4000, key: 'amethyst', need: 2 };

/* The rungs a place fits for a line, as levels [lo, hi): buying level n takes
   the ship from n to n + 1, and a place fits it when lo <= n < hi.

   A gate fits every rung up to the top of the tier it opens onto, and none
   past it: come back up to the first gate after the second and it will not
   fit the second tier's rungs. The first version fitted ONLY its own tier's
   band, and the screenshot showed what that costs - a player arriving a rung
   behind found a counter with nothing on it they could buy. The last gate is
   the Vault's door, past every tier, and fits everything. */
export function rungBand(u: Upgrade, place: Place): [number, number] {
  if (place < 0 || place + 1 >= TIER_DEPTHS.length) return [0, u.max];
  return [0, levelCap(u, TIER_DEPTHS[place + 1])];
}

export function sellsRung(u: Upgrade, level: number, place: Place): boolean {
  const [lo, hi] = rungBand(u, place);
  return level >= lo && level < hi;
}

/* The lines a place shows. The pad is the shelf as it always was, teaser and
   all. A gate shows only lines it fits a rung of and that are open at its own
   depth - a gate is a counter, not a catalogue, so it carries no teaser. */
export function vendorLines(place: Place, bestDepth: number, found: string[] = []): Upgrade[] {
  const shelf = shelfStock(bestDepth, found);
  if (place < 0) return shelf;
  const depth = gateDepth(place);
  return shelf.filter((u) => {
    const [lo, hi] = rungBand(u, place);
    return hi > lo && u.unlock <= depth;
  });
}

/* Whether a place sells supplies for credits. Only the pad. */
export const sellsSupplies = (place: Place) => place < 0;

export const dealAt = (place: Place): KeyDeal | null =>
  place >= 0 && place < GATE_COUNT ? GATE_DEAL[place] ?? null : null;

/* What a place sells, as a list of ids, for the test that no two agree and for
   a reader who wants the whole counter at once. */
export function vendorStock(place: Place, bestDepth: number, found: string[] = []): string[] {
  const out = vendorLines(place, bestDepth, found).map((u) => {
    const [lo, hi] = rungBand(u, place);
    return u.key + ':' + lo + '-' + hi;
  });
  if (sellsSupplies(place)) out.push('supplies');
  const deal = dealAt(place);
  if (deal) out.push('deal:' + deal.supply + ':' + deal.key);
  if (place === SINK_GATE) out.push('skill:sink');
  return out;
}

/* Every line, for callers that want the table without the shelf's rules. */
export const ALL_LINES = UPGRADES;
