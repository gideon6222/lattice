/* Repairing the planet, which is an activity and not a payment.
   Round fifteen, Y7.

   His brief, 2026-09-19: *"From there, you can start repairing it. I want
   repairing the planet to have an actual mechanic rather than just feeding it
   materials."*

   ---------- what was wrong with the old one ----------

   There was already a repair, and it is the thing he is describing: the
   Ballast panel at the pad lists your banked ore with a BUY-shaped button
   beside each row, and tipping it in raises the meter. There is no decision in
   it. You are standing on the pad with nothing at stake, the ore is already
   banked, and the only question is whether you would rather have the number go
   up. Rule 12 says the stand-in goes in the same commit as the real thing, and
   a donation screen is the stand-in here.

   ---------- where repair happens now ----------

   **At the scar of an Anchor you broke.** That is the whole design and every
   other property falls out of it:

     it cannot be done from the pad     the scars are where the Anchors were,
                                        and the shallowest is ninety metres down
     it costs materials and not credits it takes ore out of the HOLD, which has
                                        weight, so carrying repair ore down is
                                        capacity you are not bringing ore back in
     it is a trip with a decision in it  the ore in your hold is worth more at
                                        the Outfitter, and you are deep, and the
                                        way back is the same way you came
     it means something                  you are patching the hole you made, at
                                        the exact place you made it

   That last one is the reason to build it this way rather than any other. Y13
   put a permanent scar at every broken Anchor because he asked for remnants;
   this gives the remnants a USE, which is what stops them being decoration.
   And under the reveal it is the most honest thing in the game: the player
   spends the middle of the campaign carefully patching a planet they are
   themselves taking apart.

   ---------- the rate, measured rather than chosen ----------

   `REPAIR_MULT` is what a unit is worth carried down against what it was worth
   tipped in at the pad. Measured on 2026-09-19 against a starting 45 kg hold,
   which is the number to keep in view because it is what a new player has:

     ore        units in 45 kg   Ballast at the pad rate   at x3
     copper     12               0.096                     0.288
     amethyst   6                0.240                     0.720
     umbrite    2                0.160                     0.480

   At x1 a full hold of the best ore in the game moves the meter a sixth, and
   filling it is four or five dives of doing nothing else - a grind, which is
   what round seven already recorded happening to the upgrade tree. At x3 one
   deliberate trip is a real repair and no trip is a whole one. It is also
   nearly FLAT above iron, which is the property worth protecting: you repair
   with whatever you happen to be carrying rather than farming one ore for it.

   The test asserts that derived range rather than the constant, because the
   feed values and the hold size are both tuned numbers that will move. */

import { ORES, DEF, isOre, isKey } from './config';
import { anchorAt, ANCHOR_COUNT } from './vaults';
import { clamp } from './util';
import { feedValue, type GroundState } from './unrest';

/* Carried down against tipped in at the pad. See the measurement above. */
export const REPAIR_MULT = 3;

/* And what one repair does to the ground it is standing in.

   A step rather than a reset, for the reason `lightAnchor` pushes Unrest back
   instead of zeroing it: you are patching a region, not undoing what you did
   to it. It is the same size as the step an Anchor gives, so the two readings
   a player has of "this region is calmer now" agree with each other. */
export const REPAIR_UNREST = 0.18;

/* How near you have to be. The scar is nine cells and the ship is one, so
   standing anywhere in the recess counts - which is what `anchorPlinth`
   already answers, one cell out from the Anchor. */
export const REPAIR_REACH = 2;

/* Which broken Anchor's scar the ship is standing in, or -1.

   Asked of the ANCHOR rather than of the block, on purpose: the scar is nine
   cells with a hole through the middle of it, and a player hovering in the
   hole is standing in the scar whatever `blockAt` says about that one cell. */
export function scarHere(px: number, pd: number, lit: readonly number[]): number {
  for (let r = 0; r < ANCHOR_COUNT; r++) {
    if (!lit.includes(r)) continue;
    const a = anchorAt(r);
    if (Math.abs(px - a.x) <= REPAIR_REACH && Math.abs(pd - a.d) <= REPAIR_REACH) return r;
  }
  return -1;
}

/* What a hold is worth at a scar. Ore only, the same rule feeding ran on -
   rock does not hold a planet down. */
export function repairValue(cargo: Readonly<Record<string, number>>): number {
  let v = 0;
  for (const o of ORES) {
    /* Never a key (round seventeen, AF). Keys are banked and never spent on
       anything but the rung that asks for them; a scar that swallowed the
       ruby the next gate wants was a way to lose one without being asked. */
    if (isKey(o.id)) continue;
    const n = cargo[o.id] || 0;
    if (n > 0) v += feedValue(o.id) * n * REPAIR_MULT;
  }
  return v;
}

/* Whether there is anything in the hold worth packing into a scar. */
export function repairable(cargo: Readonly<Record<string, number>>): boolean {
  return repairValue(cargo) > 0;
}

export interface Repair {
  /* How much of the Ballast it actually filled, which is capped by the room in
     it - so the caller can refuse a pack that would waste a hold. */
  gain: number;
  /* What it consumed, by id, so the caller can take it out of the hold and say
     what went in. */
  used: Record<string, number>;
  /* Total units, for the toast. */
  units: number;
}

/* Pack a scar. Mutates the ground and reports what it took.

   **It takes everything or nothing**, and that is deliberate rather than
   lazy: a per-ore picker is the pad panel again, and the pad panel is the
   thing being replaced. The decision this mechanic wants is made before you
   fly down - what is in the hold when you get there - not at the scar with a
   list in front of you.

   The caller is expected to have asked `repairRoom` first; packing into a full
   Ballast returns a zero gain and consumes nothing, so a misread cannot cost a
   player their hold. */
export function packScar(
  s: GroundState, region: number, cargo: Readonly<Record<string, number>>
): Repair {
  const out: Repair = { gain: 0, used: {}, units: 0 };
  const room = 1 - s.ballast;
  if (room <= 0 || region < 0 || region >= ANCHOR_COUNT) return out;
  const value = repairValue(cargo);
  if (value <= 0) return out;

  for (const o of ORES) {
    if (isKey(o.id)) continue;
    const n = cargo[o.id] || 0;
    if (n > 0) { out.used[o.id] = n; out.units += n; }
  }
  out.gain = Math.min(room, value);
  s.packed[region] = (s.packed[region] || 0) + out.gain;
  s.ballast = clamp(s.ballast + out.gain, 0, 1);
  s.fed += out.units;
  s.unrest[region] = Math.max(0, s.unrest[region] - REPAIR_UNREST);
  return out;
}

/* How much room the Ballast has, which is what the button on the scar has to
   say before it is pressed. A pack that would waste most of a hold is one the
   player has to be able to see coming. */
export function repairRoom(s: GroundState): number {
  return 1 - s.ballast;
}

/* Ore only, and the same question `feedable` asks - kept as its own name so
   the two can be given different answers later without one silently changing
   the other. */
export function packable(id: string): boolean {
  const d = DEF[id];
  return !!d && isOre(d) && feedValue(id) > 0;
}

/* ---------- the scar closes as it is packed. Round seventeen, AF ----------

   The "+X%" toast was the only thing a repair changed that a player could
   see, and a percentage is a payment's receipt, not a repair. So the scar
   itself closes: in stages, its violet dimming and the crystal that broke out
   of the Anchor drawing back in, until it is dark stone. Stages rather than a
   smooth fade because a change you can see on the next glance is one that
   reads as caused by what you just did.

   A stage is SCAR_STEP of Ballast packed into that scar. A full starting hold
   of money ore is 0.3 to 0.5 of Ballast (measured 2026-09-25; keys no longer
   count), so a full hold closes a scar one or two stages and a scar is healed
   in a trip or two - a thing you finish, not a meter you feed. The first try
   was 0.12 a stage, and the film showed one press closing a scar outright:
   stages you never see are not stages. */
export const SCAR_STAGES = 4;
export const SCAR_STEP = 0.2;
export function scarStage(packed: number): number {
  return Math.max(0, Math.min(SCAR_STAGES - 1, Math.floor(packed / SCAR_STEP + 1e-9)));
}
