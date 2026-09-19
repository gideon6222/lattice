/* The three acts, as a colour grade.

   Playtest, 2026-09-18: *"Can you set up a plan to make the game feel more
   rounded and story like?"*

   The story research (`C:\dev\plans\lattice\STORY.md`) is unambiguous about how
   a near-wordless game tells a story: not by delivering it but by the world
   VISIBLY CHANGING, and the highest-ranked techniques are all versions of that.
   Hollow Knight's Infection is the reference - it spreads as a scripted
   threshold event over ground the player already walked clean, and that is what
   makes it read as a story beat rather than as ambient decay. Shadow of the
   Colossus tells its ending by desaturating.

   This game already has the thresholds. It has never spent them on the picture.

   ---------- why the CAMPAIGN and not the Unrest meter ----------

   The brief says "a three-act grade on Unrest thresholds" and that is the one
   thing here done differently, on purpose. Unrest is per-region, it rises and
   falls, and a grade driven off it would flicker as you crossed a boundary -
   a world whose mood changes every twenty metres has no acts, it has weather.

   The campaign thresholds are MONOTONIC and each one is something the player
   did. That is what an act is. So:

     ACT 1  before the fifth Anchor. The planet is a dead place you are taking
            things out of, and it looks like one.
     ACT 2  the wake. The ground stops staying where you left it, and the world
            warms and hardens to say so - this is the act with the most heat in
            it, because it is the only one where the planet is against you.
     ACT 3  the Vault is open and the ending has been read. *"It is quiet now,
            and it is quiet because of you."* So act three is QUIETER than act
            two and quieter than act one: desaturated, cool, settled. The
            planet stops being a threat and stops being a resource, which is
            what the ending's own words promise and what nothing in the game
            currently keeps.

   That last one matters most. The second month's own measurement is that the
   ending "hands the planet back and means it" and that the sentence is a
   promise the game does not keep. A grade cannot add content, but it can make
   the place LOOK handed back, which is the cheapest honest half of that
   promise.

   ---------- muted, and safe to be ----------

   Every value here is a colour. The story research's hard constraint is that a
   phone is played muted and every beat needs a visual carrier; a grade is
   nothing but visual carrier, which is why it ranks where it does.

   Pure, renderer-free, and the renderer reads it per frame. Nothing here knows
   what a colour object is - it returns numbers, and `loop.ts` decides what to
   do with them. */

import { WAKE_AT } from './unrest';

export const ACT_DEAD = 0;
export const ACT_WAKE = 1;
export const ACT_QUIET = 2;

/* Which act the campaign is in.

   `won` beats `lit` deliberately: a save that has opened the Vault is in act
   three for ever, including on a New Game Plus pass where `lit` has been reset,
   because act three is about what the player has DONE and `g.won` is the one
   flag a wipe does not clear (see `vaultReached` in actions.ts). */
export function actOf(lit: number, won: boolean): number {
  if (won) return ACT_QUIET;
  if (lit >= WAKE_AT) return ACT_WAKE;
  return ACT_DEAD;
}

export interface Grade {
  /* How far to pull the frame toward the act's own tint, 0..1. */
  tint: number;
  /* How much colour to take OUT, 0..1. Shadow of the Colossus' ending. */
  desat: number;
  /* The tint's colour as a plain hex number, for the renderer to lerp toward. */
  color: number;
}

/* Deliberately small numbers.

   A grade that announces itself is a filter, and the failure mode the lighting
   notes in CLAUDE.md record over and over is a whole-frame effect that reads as
   a wash rather than as the world. These are at the edge of noticeable when you
   are looking for them and invisible when you are not, which is what an act
   break should be: you do not see the grade, you notice the place feels
   different and cannot say why.

   Act two's tint is the same ember the heat line already uses, so the wake
   deepens a colour the player has learned rather than introducing a tenth one.
   Act three's is the Anchors' own mint, because the thing that quietened the
   planet is the thing the player lit. */
const GRADES: Grade[] = [
  { tint: 0.00, desat: 0.00, color: 0x000000 },
  { tint: 0.16, desat: 0.00, color: 0x6b1c08 },
  { tint: 0.10, desat: 0.34, color: 0x8fffc8 }
];

export function gradeOf(act: number): Grade {
  return GRADES[Math.max(0, Math.min(GRADES.length - 1, act))];
}

/* The grade for a save, which is the only call the renderer needs. */
export function gradeFor(lit: number, won: boolean): Grade {
  return gradeOf(actOf(lit, won));
}
