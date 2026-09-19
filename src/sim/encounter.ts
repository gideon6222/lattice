/* Encounters: the 94% of the planet that currently has nothing to say.

   Playtest, 2026-09-18: *"Make more encounters and random events as you go."*

   ---------- the three words, because the whole ask turns on them ----------

   The research (`C:\dev\plans\lattice\ENCOUNTERS.md`) draws a line this game
   was on the wrong side of:

   - A **hazard** is an unconditional rule the sim applies with no choice
     attached. A gas pocket opening the hull is a hazard. **This game currently
     has only hazards**, which is exactly why the world reads as a place things
     happen TO you rather than a place you make decisions in.
   - An **encounter** is a hazard made legible BEFORE it resolves: a visible
     tell, plus a response using a verb the player already has.
   - An **event** is an encounter with a named, once-off decision that costs
     something on EVERY branch. Slay the Spire's Golden Idol is the clean case -
     four buttons and not one of them is free - and that is what makes an event
     retellable rather than merely survivable.

   This module is the FRAME. It decides what fires, when, and how often. What
   each one DOES belongs to the content that registers with it, because a frame
   that knows about gas pockets is a frame that cannot be tested without them.

   ---------- what the frame is actually for ----------

   Not for making things happen. Things already happen. It is for making them
   happen at a RATE that keeps them memorable, and the research is specific that
   this is where the failures are:

   - **Telegraph before the stakes land.** Deep Rock warns before a mutator
     bites; Terraria says "a goblin army is approaching from the west" before
     the army arrives. An encounter the player could not have seen coming is a
     hazard wearing an encounter's clothes.
   - **Throttle repeats explicitly, or a good beat becomes wallpaper.** Slay the
     Spire removes a one-time event from the pool once seen in a run. Terraria
     decays an invasion's chance from 1/3 to 1/30 to 1/60 once it has been
     beaten.
   - **Leave clean ground.** Deep Rock caps mutators at two per mission and one
     anomaly, and keeps at least one mission per rotation clean. A descent where
     something always happens is a descent where nothing registers, so `MAX_PER_
     RUN` and `MIN_GAP` exist to make an uneventful dive possible.

   ---------- determinism ----------

   Everything here is a pure function of (where you are, what you have already
   seen, the world seed). No `Math.random`, no clock, no state of its own: the
   caller owns the state and passes it in, which is what lets a test replay a
   whole descent and get the same beats. Offset 431 is this module's, alongside
   caves on 77, pockets on 41, quakes on 173, breach tremors on 211 and finds on
   257 - taken are 11, 23, 41, 77, 91, 131, 137, 173, 211, 257, 311, 313, 421,
   431, 601, 619, 643, 977 and 1013. */

import { rnd } from './util';

export interface EncounterDef {
  key: string;
  /* Relative likelihood within the eligible pool. */
  weight: number;
  /* The shallowest metre it can fire at, and the deepest. A beat that belongs
     to the deep must not greet a player at 12 m. */
  from: number;
  to: number;
  /* Once per run. Slay the Spire's shrine rule: the beats worth remembering are
     the ones that cannot happen twice in an evening. A repeatable encounter is
     texture; a once-only one is a story. */
  once: boolean;
}

export interface EncounterState {
  /* Keys fired in THIS run, in order. Also the once-only filter. */
  fired: string[];
  /* The depth the last one fired at, for the gap rule. Negative means none
     yet, which is not the same as 0 - the pad is a real depth. */
  lastDepth: number;
}

export function newEncounters(): EncounterState {
  return { fired: [], lastDepth: -1 };
}

/* At most this many in one descent. Deep Rock's cap, and its reason: a run
   where something always happens is a run where nothing registers. Three is
   enough for a long dive to have a shape and few enough that an uneventful
   descent is common rather than notable. */
export const MAX_PER_RUN = 3;

/* And at least this many metres between them, so two never land on top of each
   other and the player always has time to deal with the first. Chosen against
   the world rather than by eye: 452 m deep with a cap of three means the gap
   could be as wide as 150 and still permit the cap, so 28 is loose enough to
   never be the binding constraint and tight enough to stop a cluster. */
export const MIN_GAP = 28;

/* How often the dice are thrown, in metres. Rolling per cell would make the
   per-metre chance a number nobody can reason about and would couple the rate
   to how fast the player digs. One roll per band of 4 m is a rate in the units
   the design actually thinks in. */
export const ROLL_EVERY = 4;

/* The chance that a roll fires anything at all, before the pool is consulted.
   The dial for "how eventful is the planet", and the only number here that is a
   matter of taste rather than of structure - so it is the one that was measured
   rather than argued about.

   Over 400 seeds, against a three-entry fixture pool:

     chance   quiet 120 m descents   full 452 m descents, 0/1/2/3   mean
     0.130      3 of 400   ( 1%)         0 /   0 /   1 / 399        3.00
     0.060     59 of 400   (15%)         0 /   4 /  29 / 367        2.91
     0.035    131 of 400   (33%)         5 /  34 /  94 / 267        2.56
     0.025    188 of 400   (47%)        22 /  82 / 128 / 168        2.10
     0.018    232 of 400   (58%)        60 / 120 / 119 / 101        1.65

   **The first version was 0.130 and it was picked by eye.** One shallow descent
   in a hundred was quiet and 399 of 400 full descents hit the cap - a planet
   where something is always happening, which is the wallpaper the cap and the
   gap exist to prevent. `test/encounter.test.mjs` caught it on its first run,
   which is the whole reason "an uneventful descent is possible" is a test
   rather than an intention.

   0.025 is the pick: about half of shallow descents are quiet, so an encounter
   is an event rather than a feature of the ground, and a full dive averages two
   so a long descent still has a shape. Retune by re-running the table, not by
   nudging the number. */
export const FIRE_CHANCE = 0.025;

/* Which band of depth a metre is in. Exported because a test wants to walk
   bands rather than metres, and because the caller has to know when the band
   changed to know whether to roll at all. */
export function bandOf(depth: number): number {
  return Math.floor(Math.max(0, depth) / ROLL_EVERY);
}

/* Everything that COULD fire here: in range, not already used up, and not
   blocked by the gap or the cap.

   Pure and separate from the roll so a test can ask "what was available" - a
   roll that returns nothing is indistinguishable from an empty pool otherwise,
   and those are two very different bugs. */
export function eligible(defs: readonly EncounterDef[], state: EncounterState,
                         depth: number): EncounterDef[] {
  if (state.fired.length >= MAX_PER_RUN) return [];
  if (state.lastDepth >= 0 && depth - state.lastDepth < MIN_GAP) return [];
  return defs.filter((d) =>
    depth >= d.from && depth <= d.to &&
    !(d.once && state.fired.includes(d.key)));
}

/* What fires at this depth, or null.

   `seed` is the world seed, so a given planet plays the same beats in the same
   places - which is what makes a descent describable ("the gas bloom at 60")
   rather than a slot machine. The band goes into the hash rather than the raw
   depth, so hovering at one metre cannot re-roll the same dice.

   The weighted pick walks the pool in order and subtracts, which is the
   standard shape and is deterministic given the same pool ORDER - so callers
   must not sort `defs` differently between runs. `eligible` preserves the
   order it was given, which is why it filters rather than rebuilds. */
export function rollAt(defs: readonly EncounterDef[], state: EncounterState,
                       depth: number, seed: number): EncounterDef | null {
  const pool = eligible(defs, state, depth);
  if (!pool.length) return null;
  const band = bandOf(depth);
  if (rnd(band * 13 + 5, band * 29 + 11, seed + 431) >= FIRE_CHANCE) return null;
  const total = pool.reduce((a, d) => a + d.weight, 0);
  if (total <= 0) return null;
  let pick = rnd(band * 31 + 7, band * 17 + 3, seed + 431) * total;
  for (const d of pool) {
    pick -= d.weight;
    if (pick <= 0) return d;
  }
  return pool[pool.length - 1];
}

/* The state after one has fired. Pure: a new object, so a caller can roll
   speculatively without committing, and so the golden tests can hold a run's
   history without it changing underneath them. */
export function fired(state: EncounterState, key: string, depth: number): EncounterState {
  return { fired: [...state.fired, key], lastDepth: depth };
}

/* A whole descent's beats, for a test or a probe: walk from the surface to
   `toDepth` one band at a time and report what fired where.

   Here rather than in the test file because it is the thing the loop does, and
   a test that reimplements the caller is a test of the reimplementation. */
export function walk(defs: readonly EncounterDef[], toDepth: number, seed: number):
    { key: string; depth: number }[] {
  let st = newEncounters();
  const out: { key: string; depth: number }[] = [];
  for (let band = 0; band <= bandOf(toDepth); band++) {
    const depth = band * ROLL_EVERY;
    const hit = rollAt(defs, st, depth, seed);
    if (!hit) continue;
    out.push({ key: hit.key, depth });
    st = fired(st, hit.key, depth);
  }
  return out;
}
