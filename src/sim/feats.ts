/* The feats: things the player has done, each with a gift. Progression round, BC.

   His ask of 2026-10-02: locked, found or earned, so the shelf is not all
   shown at once. A found device is earned by digging. A feat is earned by an
   act: a full hold sold, gas ridden out, hard rock cut, a ship lost. The
   Ledger (pause sheet) lists what is done and the one feat in front of you.
   It never lists a lock, and no count shows outside it (counsel: a fraction
   in a Next line is an XP bar).

   Pure and independent of state: callers hold the numbers, `state.ts` saves
   them. The gift each feat hands over is built in BD (Ore Sorter), BE
   (Pressure Seal, Resonance Tip) and BF (Return Beacon); this file only says
   when a feat is won.

   Thresholds. The gas and hard-rock feats are totals across runs so they land
   on someone who is just playing. Measured on the pure world, a straight dig
   down one column (a floor, since a real run wanders after ore) meets 0.36
   gas pockets in the first 60 m, 1.2 in 125 m and 3.0 in 250 m, and 3 cells of
   rock at hardness 5 or more in 60 m, 9 in 125 m and 98 in 250 m. Four
   pockets is a few committed runs to the first barrier; forty cells is the
   edge of the deep rock. BE retunes these from a bot run. */

export type Counter = 'hold' | 'gas' | 'hard' | 'lost';

export interface Feat {
  key: string;
  name: string;
  /* What the Next line says after the gift's name: the kind of act, no count. */
  act: string;
  /* What the Ledger says once it is done. */
  done: string;
  counter: Counter;
  at: number;
  /* The thing it hands over, by name. Empty until the milestone that builds it. */
  gift: string;
}

export const FEATS: Feat[] = [
  { key: 'fullHold', name: 'Full Hold', act: 'sell a full hold', done: 'Sold a hold filled to the brim.',
    counter: 'hold', at: 1, gift: 'sorter' },
  { key: 'ridOutGas', name: 'Gas Ridden Out', act: 'ride out some gas', done: 'Rode out the gas pockets and kept the ship.',
    counter: 'gas', at: 4, gift: 'seal' },
  { key: 'hardRock', name: 'Hard Rock Cut', act: 'keep cutting hard rock', done: 'Cut a long way through the hard rock.',
    counter: 'hard', at: 40, gift: 'tip' },
  { key: 'shipLost', name: 'A Ship Lost', act: 'lose a ship', done: 'Lost a ship, and a black box was left on the pad.',
    counter: 'lost', at: 1, gift: 'beacon' }
];

/* The devices a feat hands over, by upgrade key: the feat that earns it and the
   line the banner reads. BE and BF add the Seal, the Tip and the Beacon. */
export const FEAT_DEVICES: Record<string, { feat: string; blurb: string }> = {
  sorter: { feat: 'fullHold', blurb: 'Swaps the cheapest ore in a full hold for a richer find.' }
};

export type Tally =Record<Counter, number>;
export const blankTally = (): Tally => ({ hold: 0, gas: 0, hard: 0, lost: 0 });

/* A hold counts as full at nine tenths: ore weighs up to seven kilos, so a
   hold one nugget short of the cap still refuses the next. */
export const FULL_HOLD = 0.9;
export const holdIsFull = (weight: number, cap: number) => cap > 0 && weight >= cap * FULL_HOLD;

/* Rock that counts as hard: ore does not (it is a prize, not a wall). */
export const HARD_ROCK = 5;

const COUNTERS: Counter[] = ['hold', 'gas', 'hard', 'lost'];

/* A tally read off a save, field by field: a missing or mistyped field is zero,
   never NaN, and a number is kept whole. */
export function loadTally(raw: unknown): Tally {
  const out = blankTally();
  if (raw && typeof raw === 'object') {
    for (const c of COUNTERS) {
      const v = (raw as Record<string, unknown>)[c];
      if (typeof v === 'number' && isFinite(v) && v > 0) out[c] = Math.floor(v);
    }
  }
  return out;
}

/* Feat keys read off a save: only those this build knows, once each. */
export function loadFeats(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(FEATS.map((f) => f.key));
  return Array.from(new Set(raw.filter((k): k is string => typeof k === 'string' && known.has(k))));
}

/* Count `n` more of `counter` and return the feats that this crossed, each
   marked done in `feats`. A feat fires once, however far past it the count
   goes. */
export function bump(tally: Tally, feats: string[], counter: Counter, n = 1): Feat[] {
  tally[counter] += n;
  return settle(tally, feats);
}

/* Mark every feat whose threshold the tally has reached and return the new
   ones. Also what a first dock runs for a save that was played before feats
   existed, so nobody loses a gift for having played early. */
export function settle(tally: Tally, feats: string[]): Feat[] {
  const won: Feat[] = [];
  for (const f of FEATS) {
    if (feats.includes(f.key) || tally[f.counter] < f.at) continue;
    feats.push(f.key);
    won.push(f);
  }
  return won;
}

/* What a save from before feats had plainly already done, read off the log it
   kept. Ships lost are counted exactly (`towed`). Gas is only known as hull
   lost to it, and each pocket cost 26 (GAS_HULL_DAMAGE), so that is the floor. Sales and
   hard rock were never counted, so those stay zero and are earned from here. */
export function backfillTally(log: { towed?: number; hullGas?: number }, gasHit = 26): Tally {
  const t = blankTally();
  t.lost = Math.max(0, Math.floor(log.towed || 0));
  t.gas = Math.max(0, Math.floor((log.hullGas || 0) / gasHit));
  return t;
}

/* The one feat in front of the player: the first not done. */
export function currentFeat(feats: readonly string[]): Feat | null {
  return FEATS.find((f) => !feats.includes(f.key)) || null;
}

/* The Ledger's FEATS tab: done feats, then the one in front. Never a lock. */
export function ledgerFeats(feats: readonly string[]): { done: Feat[]; next: Feat | null } {
  return { done: FEATS.filter((f) => feats.includes(f.key)), next: currentFeat(feats) };
}
