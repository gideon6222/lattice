/* Y15: the reveal, and the hints that escalate toward it.

   Round fifteen's own note on Y12 ("always more secrets"): the derelicts, the
   lode and the veins are all recent answers to that ask, and what a probe
   (`tools/secrets-probe.mjs`) found is that they cannot be the WHOLE answer -
   a find crate, the one relic and the twelve wrecks are each finite, so a
   campaign that has met them all is a campaign where "more" has run out no
   matter how their odds are tuned. Three of every five simulated shafts sit
   quiet more often than not by mid-campaign, and tuning the cache roll higher
   only makes the ground noisier, not stranger.

   What does not run out is the one thing DESIGN.md already named as Y12's
   real spine: "the hints ARE the secrets, and they escalate toward the
   Vault." A hint costs nothing to place, cannot be exhausted by finding it,
   and answers the actual ask - a planet that keeps having more to say, not
   more to loot.

   ---------- near-wordless, escalating, and honest until it isn't ----------

   His brief: *"I want it to look like you are doing a good thing by releasing
   the dark energy from it, but at the end of the game, find out that you
   actually freed a dark entity. It should ... hint at it as you get closer to
   the end."* `coreBroken`'s own card is the first place this is said
   straight - "the core gives, and the barrier goes with it" is true and is
   not the whole truth. These are the same kind of half-truth, one per gate,
   each a little less deniable than the last: the first is a stray fact, the
   third names what the cores were actually FOR.

   ---------- tiers opened, not depth reached ----------

   Driven off `g.ground.gates.length` - the same count `coreBroken` already
   has in hand - rather than off metres, because a hint about what breaking a
   core does belongs to the number of cores broken. `GATE_COUNT` many hints
   because there is exactly one gate-breaking moment to hang each one on. */

import { GATE_COUNT } from './gate';

/* Ordered so index 0 is the first hint, delivered when the first gate opens. */
export const HINTS: string[] = [
  'The core went out instantly. Nothing that dark should stop that easily.',
  'Two cores spent, and the rock past each one runs warmer than before.',
  'Three gates open now. Whatever they were built to hold has three fewer ways to stay in.'
];

/* `GATE_COUNT` is round fifteen's own count of gate-breaking moments; a
   fourth would fire nowhere, and a hint for a tier this world does not have
   is a bug a length mismatch would otherwise hide. */
if (HINTS.length !== GATE_COUNT) throw new Error('hints.ts: HINTS must have exactly GATE_COUNT entries');

/* Every hint due once `tiersOpened` gates have come down. Monotonic by
   construction - a slice only ever grows - and empty before the first core,
   which is `coreBroken`'s own gate on ever calling this at all. */
export function hintsFor(tiersOpened: number): string[] {
  return HINTS.slice(0, Math.max(0, Math.min(HINTS.length, tiersOpened)));
}

/* The one new line due at THIS break, for the toast - the last element of
   `hintsFor(tiersOpened)`, or null if this tier is out of range (defensive;
   `coreBroken` never calls this at 0). */
export function hintAt(tiersOpened: number): string | null {
  const all = hintsFor(tiersOpened);
  return all.length ? all[all.length - 1] : null;
}
