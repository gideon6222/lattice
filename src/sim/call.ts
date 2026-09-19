/* The Call: an unlit Anchor is audible from underground.

   Playtest, 2026-09-18: *"Make the game feel like it is pushing you in a
   specific direction, so it doesn't just feel open with no point to the game.
   Make sure the player knows the objective or is subtly pointed in the correct
   direction."*

   ---------- why this and not a waypoint ----------

   The research on six reference games (`C:\dev\plans\lattice\DIRECTION.md`)
   found that none of them creates direction with a marker. What they share is
   three things: an instrument with a limited radius that makes the unknown
   ADJACENT rather than distant, a signal that ARRIVES from the world and can be
   ignored, and a visible contrast between resolved and unresolved. Subnautica's
   signals are the closest match and the mechanism is the important part - a
   signal reads as the world calling because of HOW IT ARRIVES, overheard on a
   radio, rather than because the UI decided to draw a task.

   So this is a proximity instrument and deliberately NOT a bearing. It answers
   "is there an unlit Anchor near here" and never "it is that way". The player
   still has to choose a direction and dig it, which is the decision the whole
   game is built on - `CLAUDE.md` calls the 7-to-8 visible columns of a portrait
   frame deliberate, so that which way to dig is a real choice rather than a
   formality. A bearing arrow would delete that decision and turn a mining game
   into a following game.

   ---------- why it is a find and not a fitting ----------

   The receiver is one of the buried DEVICES in `finds.ts`, not something the
   ship starts with. Three reasons and the third is the one that matters:

   - It costs nothing. `finds.ts` is built, tested and already carries seven
     devices that arrive this way.
   - The first descent stays unguided, which is the one descent that should be.
   - **The direction system arrives as a discovery rather than as a UI feature.**
     A needle that was always on the dashboard is a tool. A receiver you dug out
     of a dead world and fitted yourself is a story, and it is the same story the
     game is already telling about salvaged ancient gear.

   ---------- the muted phone ----------

   Whatever draws this MUST carry visually. The story research is blunt about
   it: needless audio on a phone gets muted immediately and stays muted, so a
   beat carried by sound alone is a beat most players never receive. The audio
   ping is an addition to the needle, never the whole of it. That rule belongs
   to the renderer, but it is written here because this is the file somebody
   reads when they wire it up. */

import { anchorAt, ANCHOR_COUNT } from './vaults';
import { callReach } from './config';

/* The reach is the RECEIVER'S, and it is read from the level rather than fixed.

   `callReach(level)` lives in `config.ts` because the shop's effect string has
   to print the same number and the import direction only runs one way. Level 0
   is no receiver at all and reaches nothing, which is what makes the first
   descent unguided without a single branch anywhere else.

   Too far and the instrument is on everywhere, which reads as nothing. Too near
   and you only hear it once you are already on top of the thing, which is a
   confirmation rather than a direction. `config.ts` carries the numbers and the
   reasoning. */

/* The falloff.

   A linear ramp spends most of its range in values too small to see. Raising
   (1 - t) to a power below 1 does the opposite and is on too early. 1.6 puts
   the readable part of the curve in the outer half of the reach, so the
   instrument is faint and present at the edge of the region and unmistakable in
   the last ten cells.

   Any monotonically decreasing function of distance satisfies the approach test
   in test/call.test.mjs, so this exponent is free to be retuned by feel without
   touching what is asserted. That is deliberate: CLAUDE.md records two lighting
   tests that were written against a raw field and both failed the moment the
   value was retuned to exactly what a playtest asked for, which is the wrong way
   round for a test to behave. */
export const CALL_POW = 1.6;

/* Distance in cells from a point to one Anchor. x is a column and d is a metre,
   and a cell is one of each, so this is a plain Euclidean distance with no
   scaling - see blockAt(x, d) in world.ts, which indexes on the same pair. */
export function anchorDistance(x: number, d: number, r: number): number {
  const a = anchorAt(r);
  const dx = x - a.x, dd = d - a.d;
  return Math.sqrt(dx * dx + dd * dd);
}

/* One Anchor's contribution, 0 at the receiver's reach and beyond, 1 at its
   cell. `level` is the Lattice Receiver's level; 0 means it is not aboard and
   nothing is audible. */
export function callFrom(x: number, d: number, r: number, level = 1): number {
  const reach = callReach(level);
  if (reach <= 0) return 0;
  const t = anchorDistance(x, d, r) / reach;
  if (t >= 1) return 0;
  return Math.pow(1 - t, CALL_POW);
}

/* The index of the nearest UNLIT Anchor and its distance, or null when every
   Anchor is lit.

   Returned as well as the strength because the renderer wants to know WHICH one
   is calling - not to point at it, but so the needle can settle rather than
   flicker between two Anchors at equal range, and so a test can name the one it
   means. */
export function nearestUnlit(x: number, d: number, lit: readonly number[]):
    { r: number; dist: number } | null {
  let best: { r: number; dist: number } | null = null;
  for (let r = 0; r < ANCHOR_COUNT; r++) {
    if (lit.includes(r)) continue;
    const dist = anchorDistance(x, d, r);
    if (!best || dist < best.dist) best = { r, dist };
  }
  return best;
}

/* The reading, 0..1.

   The MAX over unlit Anchors rather than the sum. A sum would make two distant
   Anchors read as one near one, which is a lie the instrument would tell
   regularly - the grid puts three Anchors in a row, so standing between two of
   them is an ordinary place to be, not a corner case.

   Zero everywhere once all nine are lit, which is not a special case in the code
   and is asserted anyway: it is the state the whole instrument stops meaning
   anything in, and an instrument that keeps twitching after the campaign is over
   is worse than one that goes quiet. */
export function resonance(x: number, d: number, lit: readonly number[], level = 1): number {
  if (callReach(level) <= 0) return 0;
  let out = 0;
  for (let r = 0; r < ANCHOR_COUNT; r++) {
    if (lit.includes(r)) continue;
    const c = callFrom(x, d, r, level);
    if (c > out) out = c;
  }
  return out;
}
