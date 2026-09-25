/* What a dark core hands over. Round fifteen, Y4.

   His brief, 2026-09-19: *"Once you destroy it, the forcefield releases and you
   can go further down. It should also give you a new ability or mechanic."*

   ---------- one per core, and never a number ----------

   Three cores, three abilities, and the plan's rule for them is the research's:
   a verb or a lens, not a bigger tank. `PLAN.md` X5 has the shape, taken from
   GMTK on Hollow Knight, and three tiers happen to be exactly the three jobs it
   names:

     tier 0   opens only a FEW locks, so there is no reason to backtrack yet
     tier 1   opens MANY locks at once, across ground already dug - this is the
              one that turns a guided descent into a search space
     tier 2   does DOUBLE DUTY: it advances the ending and it gives a reason to
              go back over everything

   A numeric upgrade opens none of them, which is why none of these three is
   one. The shop sells numbers; the cores hand over verbs.

   ---------- derived from the gates, stored nowhere ----------

   `g.ground.gates` is already the save's record of which cores are broken, and
   an ability is a fact about that list rather than a second copy of it. Same
   rule as the Anchor's scar and the Ballast's clock: two fields that must agree
   is one field with a bug in it.

   ---------- and they are the deception ----------

   Every one of them is dark energy doing something useful for you, which is
   exactly what he asked the middle of this game to feel like: *"I want it to
   look like you are doing a good thing by releasing the dark energy from it."*
   The names are the instruments' names for them, flat and practical, because a
   game that called them ominous would be telling you. */

import { GATE_COUNT } from './gate';

export type AbilityKey = 'hollow' | 'sink' | 'call';

export interface Ability {
  key: AbilityKey;
  /* The tier whose core hands it over. */
  tier: number;
  name: string;
  /* One line, present tense, in the voice of the ship's instruments. */
  blurb: string;
  /* Three letters for the button face, or empty when it has no button -
     `call` is a property of the Survey screen rather than a thing you fire. */
  icon: string;
}

export const ABILITIES: Ability[] = [
  {
    key: 'hollow', tier: 0, icon: 'SEE',
    name: 'The Hollow',
    /* A LENS, and a short-ranged one. It shows open space and never what is in
       it, which keeps it on the correct side of the Receiver's own fence: this
       game's decision is which way to dig, and an instrument that answers it
       outright would take the decision away rather than inform it. */
    blurb: 'Shows empty space through rock, close by. Not what is in it.'
  },
  {
    /* Round seventeen, AC: no core hands this over any more. The last core is
       the Vault's door, so three abilities became two, and Sink - the one that
       could not pass the laser-sealed Anchors of the tier it came in - moves
       to the gate vendors (AO) as the first thing a deeper shop sells that the
       pad never will. Until then no save has it. */
    key: 'sink', tier: -1, icon: 'SINK',
    name: 'Sink',
    /* A VERB, and the one that opens many locks at once. Depth in this game
       has always been gated by the drill, so every band below your tier is a
       lock you cannot pick. Sinking pays for depth in HULL instead of time and
       fuel, which does not make the drill pointless - you still cannot mine
       while you sink, so everything you pass, you pass. */
    blurb: 'Fall straight through solid rock. It costs hull, and you mine nothing.'
  },
  {
    key: 'call', tier: 1, icon: '',
    name: 'The Call',
    /* DOUBLE DUTY. It finishes the map - every secret still in the ground in a
       region whose Anchor you broke - which is the reason to go back over the
       whole planet, and it is the first time the game says out loud that the
       thing you have been releasing is the thing doing the finding. */
    blurb: 'Whatever is still buried within your reach answers you, on the Survey map.'
  }
];

/* What tier `t`'s core hands over, or undefined if there is no such tier. */
export function abilityFor(tier: number): Ability | undefined {
  return ABILITIES.find((a) => a.tier === tier);
}

/* Whether a save has an ability yet. The gates are the record. */
/* `skills` is what a gate vendor sold (round seventeen): an ability with no
   core of its own (tier -1) is had by owning it, never by breaking anything. */
export function hasAbility(open: readonly number[], key: AbilityKey, skills: readonly string[] = []): boolean {
  const a = ABILITIES.find((x) => x.key === key);
  if (!a) return false;
  return a.tier >= 0 ? open.includes(a.tier) : skills.includes(key);
}

/* Everything the player has, in the order they got it. */
export function abilitiesOf(open: readonly number[]): Ability[] {
  return ABILITIES.filter((a) => open.includes(a.tier)).sort((x, y) => x.tier - y.tier);
}

/* ---------- The Hollow ----------

   How far it reaches, in cells. Six is a little over the width of what the
   portrait frame shows at rest, so it answers "what is directly around me" and
   never "where should I go next" - the second is the map's question and the
   map is earned separately, one Anchor at a time.

   It runs while the button is held and costs charge by the second rather than
   per press, so leaving it on is the expensive way to use it. */
export const HOLLOW_REACH = 6;
export const HOLLOW_DRAIN = 0.22;   /* power cells a second */

/* ---------- Sink ----------

   Cells a second, and hull per cell. The rate is deliberately slower than
   drilling soft rock and faster than drilling hard rock, so sinking is a way
   past a band you cannot afford rather than a replacement for the drill.

   The hull cost is what makes it a decision instead of a free descent: it is
   paid out of the same pool heat and gas take from, so sinking deep is a bet
   against the climb home. */
export const SINK_RATE = 2.4;
export const SINK_HULL = 3.1;

/* Nothing sinks through the things nothing cuts. A barrier, the bedrock, an
   Anchor, the Vault - `hard: Infinity` is the one property they share, and
   sinking has to respect it or the ladder his whole brief is about has a way
   round it. */
export const SINK_STOPS_AT_INFINITY = true;
