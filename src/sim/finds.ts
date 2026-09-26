/* Devices you dig up, as opposed to ladders you buy.

   Playtest: *"I want most of the upgrades to be hidden for now and unlock
   later in the game, possibly after unlocking new planets. and introduce some
   of the other power ups later as you make it further into the first planet
   ... you only unlock certain upgrades by finding them initially, the game
   hints at what it does and you now own it, then you can upgrade it at the
   shop."*

   That is a complete mechanism, stated. This is it.

   ---------- the split, which was already in the data ----------

   Fifteen upgrades divide in two, and the line was not invented for this
   round - it was sitting in `effect(0)` the whole time, which is why it is the
   right one.

   Seven upgrades print `Not installed` at level zero. Those are DEVICES the
   ship does not have. The other eight do not, because they are ladders on gear
   the ship is already wearing: a bigger tank, a thicker hull, a better drill.
   You cannot "discover" a bigger fuel tank; you can absolutely discover a
   cutting laser in a crate.

   So the Outfitter sells the eight ladders, depth-gated exactly as before, and
   the seven devices are not for sale at any price until the rock gives one up.
   That is *"most of the upgrades are hidden for now"*, hidden for a reason the
   player can say out loud rather than because a number has not gone up yet.

   ---------- where they are ----------

   Buried the way the relic and the drive component are: a HASHED CELL, not a
   roll against the ore stream. Two reasons, both learned here already. A roll
   can lose a coin flip to a cave, and the one crate on the planet that carries
   a whole verb must not be deletable by weather. And a new roll consumes from
   a stream another generator is using unless it gets its own offset, which is
   the trap CLAUDE.md names - avoided here by not rolling at all.

   Offset 257 is this module's, alongside caves on 77, pockets on 41, quakes on
   173 and breach tremors on 211.

   ---------- missable, but never lost ----------

   The relic's rule is *"missable, but never fatal"*: leave it, break the core,
   and it goes with the planet forever. A device does NOT follow that rule, and
   the difference is deliberate.

   A relic is a trophy, and losing one is a story you tell. A device is a VERB -
   the charge, the laser, the drone - and a save that can permanently lack a
   verb is a save that got quietly worse while nobody was looking. So the
   candidate list is simply "everything not yet found whose leg has come": miss
   one, and it is on the next world at a new position. The cost of missing it is
   a world, which is real, and is the right size of punishment. */

import { W, coreDepth } from './config';
import type { UpgradeKey } from '../types';

export interface Find {
  key: UpgradeKey;
  /* The seed slot the device's crate is placed with. Fixed per device; see findAt. */
  slot: number;
  /* What the banner says at the moment it comes out of the rock. One line,
     present tense, what it DOES - not what it is made of. The research is
     consistent that the fiction does the explaining and the shop row needs no
     further words. */
  blurb: string;
  /* The shallowest metre it can be buried at - the same depth the row already
     used as its shop gate, so the device is found in the neighbourhood of the
     problem it answers rather than five minutes before. On the one world this
     is the whole of the spread: the laser, which opens three of the nine
     Anchors, is below 260 m and is the last thing met. */
  below: number;
}

/* Ordered shallowest first, which is also the order they are met. */
export const FINDS: Find[] = [
  { key: 'magnet', slot: 1,  below: 20,
    blurb: 'Pulls loose ore toward the ship instead of making you fetch it.' },
  /* 48 m, between the bomb and the Deep Survey.

     FINDS is ordered shallowest-first and `finds.test.mjs` asserts a player
     MEETS them in that order, so the position here is not cosmetic - it is the
     same fact as `below` and the test catches the two disagreeing.

     The depth itself: shallow enough that a player has the Receiver well before
     the fifth Anchor wakes the planet, because it is the device that makes the
     campaign findable rather than stumbled into, and arriving after that would
     be arriving after the problem it solves has been suffered through. Deep
     enough that the FIRST descent is still unguided, which is the one descent
     that should be. */
  { key: 'receiver', slot: 3, below: 48,
    blurb: 'Hears an intact Anchor through rock. How near, never which way.' },
  { key: 'survey', slot: 4,  below: 62,
    blurb: 'Reads ore through solid rock, so you can dig at something.' },
  /* Round seventeen, AI: the Charge and the Repair Drone moved out of tier 0
     (from 40 m and 78 m) into tier 1. Tier 0 buried five of the seven
     devices and tier 1 almost nothing, and the secrets probe had tier 1 quiet
     on three runs in four: the first dives were full of things to find and
     the second tier, where the game should be widening, was empty. The first
     dive still has the Magnet, the Receiver and the Deep Survey. Their slots
     are their own, so no other device moves. */
  { key: 'bomb', slot: 2,    below: 125,
    blurb: 'Breaks a pocket of cells at once. Runs on the power meter.' },
  { key: 'drone', slot: 6,   below: 150,
    blurb: 'Mends the hull slowly while you are underground.' },
  { key: 'auto', slot: 7,    below: 190,
    blurb: 'Flies you back to the surface on its own, and cheaply.' },
  { key: 'laser', slot: 8,   below: 260,
    blurb: 'Cuts a straight shaft ahead of you. Expensive in power.' }
];

export const FIND_OF: Record<string, Find> = {};
for (const f of FINDS) FIND_OF[f.key] = f;

/* The set of keys that are found rather than sold. Exported as a set because
   every caller is asking "is this one of them", never iterating. */
export const FOUND_KEYS = new Set<UpgradeKey>(FINDS.map((f) => f.key));

/* ---------- what is buried on THIS world ----------

   Everything unfound whose leg has come and whose depth fits inside the world,
   shallowest first, capped. The cap is what stops a late world that has been
   skipped through turning into a crate hunt: four is already more buried
   singletons than the relic and the component put together.

   `found` is the player's list. Pure in, pure out: no state import, so the
   tests can ask what a hypothetical save would see. */
export const FINDS_PER_WORLD = 4;

/* ONE WORLD, SO EVERY DEVICE IS ON IT. `from` gated each device to a leg of
   the old planet chain, and the chain went in W9 while this filter did not:
   the leg stayed at zero for ever, so only the magnet and the bomb were ever
   buried, and the Cutting Laser - the key to three of the nine Anchors -
   did not exist anywhere. The campaign could not be finished, and the probe
   in R9c is what found it. Depth does the spreading now: each device is
   buried below its own `below`, which already put it in the neighbourhood
   of the problem it answers, and the cap keeps it to four crates at a time,
   shallowest first, the next appearing as one is found. */
export function findsOn(_leg: number, coreDepthHere: number, found: string[]): Find[] {
  return FINDS
    .filter((f) => !found.includes(f.key) && f.below <= coreDepthHere - 3)
    .slice(0, FINDS_PER_WORLD);
}

/* ---------- where one sits ----------

   Its own hash per device AND per leg, so the crate is somewhere new on each
   world and two devices on one world are never in the same column. The
   constants are the odd 32-bit multipliers the rest of this repo uses for
   position hashes; the device's index is folded in so `magnet` and `survey` on
   the same leg cannot collide by construction.

   Depth is drawn from the band between the device's own `below` and the floor
   of the TIER that `below` sits in, so it is always inside the world, never
   inside bedrock, and never behind a barrier.

   ---------- that last clause is round fifteen, and it was a deadlock ----------

   This used to draw from `below` to three metres clear of the core - anywhere
   in the world. Harmless for eight rounds, and then Y1 cut the world into
   tiers with barriers the drill cannot pass, and "anywhere" started to mean
   "possibly behind a gate you need this device to open". Measured on planet 0:
   the Cutting Laser came out at 434 m, behind all three barriers, and one of
   the Anchors that opens the second barrier is sealed and needs it. The
   Receiver - the device that helps you FIND Anchors - was at 443 m.

   A device becomes available at `below`, so the tier that depth is in is the
   deepest the player is known to be able to reach when it appears. Burying it
   there is the whole fix, and it needs no new state.

   `TIER_ROWS` is written out rather than imported from `region.ts`, because
   this module is imported by `config.ts` and importing back through it is the
   cycle that deleted the Vault once (see `findMap`). `finds.test.mjs` asserts
   it equals `REGION_ROWS`, which is INDEX.md rule 10b: where you cannot
   derive, assert the derived quantity. */
export const TIER_ROWS = 4;

export function findAt(f: Find, leg: number, coreDepthHere: number): { x: number; d: number } {
  /* The device's own fixed slot, never its place in the list: round
     seventeen cut the Reactor Core's crate, and an index-based seed moved the
     Drone, the Autopilot and the Cutting Laser along with it (the laser went
     from 281 m to 320 m). A seed is part of the world and must not move when a
     neighbour leaves. */
  const i = f.slot;
  const lo = Math.max(1, f.below);
  const band = coreDepthHere / TIER_ROWS;
  const tier = Math.min(TIER_ROWS - 1, Math.floor(f.below / band));
  /* The metre above this tier's own barrier, or three clear of the core for
     the bottom tier, which has the floor of the world under it instead. */
  const hi = tier < TIER_ROWS - 1
    ? Math.min(coreDepthHere - 3, Math.round(band * (tier + 1)) - 1)
    : coreDepthHere - 3;
  const span = Math.max(1, hi - lo);
  const hx = Math.imul(leg * 31 + i + 257, 2654435761) >>> 0;
  const hd = Math.imul(leg * 17 + i * 101 + 257, 1597334677) >>> 0;
  return {
    x: 1 + (hx % (W - 2)),
    d: lo + (hd % span)
  };
}

/* Everything buried on a world, as cells, with the device each cell holds.

   One call rather than a loop at the call site, because `blockAt` runs per cell
   per frame and the thing it needs is a lookup, not a list. The caller caches
   this per world - see `findCells` in world.ts. */
/* How many metres the collision nudge has had to move devices, ever.

   A counter rather than a flag, because the claim worth testing is that the
   nudge is doing almost nothing: across six hundred legs and every holding
   state it should fire a handful of times out of thirteen thousand
   placements. If a change to the hash makes it fire constantly, this number
   grows and the test says so - which a test of the repaired positions never
   could, because the repair is the thing hiding the damage. */
let nudged = 0;
export function findNudges() { return nudged; }
export function resetFindNudges() { nudged = 0; }

export function findMap(leg: number, coreDepthHere: number, found: string[]): Map<string, Find> {
  const m = new Map<string, Find>();
  for (const f of findsOn(leg, coreDepthHere, found)) {
    const p = findAt(f, leg, coreDepthHere);
    /* A deterministic nudge, which was written, then cut, and is now back with
       a test that can see it.

       It was cut because a sweep of 13,176 placements found zero collisions,
       which made it dead code - and worse, a nudge silently repairs a
       collision, so the test asserting one cell per device would have kept
       passing however bad the hash got. That reasoning was right and its
       premise stopped being true the moment round seven moved every device's
       depth: two devices whose bands overlap will eventually land on one cell,
       and across thirteen thousand placements that is the birthday problem
       rather than a bad hash. No per-device hash can promise otherwise.

       So the nudge is back, and `findNudges()` below counts how far it has to
       move things. The test asserts on THAT rather than on the repaired
       result, which is a claim the nudge cannot satisfy by doing its job. */
    let d = p.d;
    while (m.has(p.x + ',' + d) && d < coreDepthHere - 1) { d++; nudged++; }
    m.set(p.x + ',' + d, f);
  }
  /* A crate must also never sit inside a SEALED hall, and that eviction
     lives in world.ts's findCells rather than here: this module is imported
     by config, and the vault geometry importing config back is a cycle that
     evaluated the Vault's position while W was still undefined - and quietly
     deleted the Vault from the world. The blocks golden's diff said so. */
  return m;
}

/* The block a schematic cell is.

   Green, and the one green in the game: `#00ff41` is the Matrix phosphor, and
   the research is emphatic that it is a monochrome identity rather than one
   neon among several. In the ground it has no competition, so it can simply be
   the colour that means "this is information, not ore" - which is exactly what
   a crate holding a device is.

   Hard enough to be a commitment and not so hard it is a chore: between a geode
   and the relic. */
export const FIND_COLOR = 0x00ff41;
export const FIND_HOST = 0x102818;
export const FIND_HARD = 10;

/* ---------- supplies, which are found the same way for a different reason ----

   Playtest: *"The 6 upgrades at the bottom feel out of place and are too big of
   an advantage to just purchase. Can you remove all 6 of the upgrades from the
   bottom of the page. Make it so you have to find them as you dig, then after
   you find them, you can upgrade them."*

   He is right about both halves, and the second half is the sharper one. Six
   consumables in a flat grid under the room was a menu that had survived the
   room being rebuilt around it - and worse, a Bulwark Field is three impacts
   absorbed outright, sold to a first-hour player for money they will have in
   ten minutes. A consumable that strong should cost knowing it exists.

   THE MECHANISM WAS ALREADY IN THE GROUND, which is why this is six lines
   rather than a second system. Supply caches have been buried on every world
   since the game had caches, and opening one already hands over a consumable.
   All that was missing was the consequence: the first time a cache gives you
   something you have never held, you now know what it is, and the Outfitter can
   stock it from then on.

   That is deliberately softer than the devices' gate. A device is one hashed
   crate on a world and finding it is an event; a supply turns up in the ordinary
   run of opening caches, so the kit fills in as a by-product of playing rather
   than as a hunt. Two gates of the same hardness would make the first hour a
   scavenger list. */

/* Which supply a cache should hand over.

   Prefers something you have never held, in the table's own order - so the kit
   fills in cheapest-and-most-useful first and a cache is reliably a discovery
   while there is anything left to discover. Once you have them all it falls
   back to the weighted roll the cache always used, because at that point the
   question is which consumable you want, not which one you have seen.

   `order` is the full supply list in table order and `found` is what you hold;
   both are passed in rather than imported, so this stays pure and a test can
   ask what any hypothetical save would be handed. */
export function cacheSupply(order: string[], found: string[], fallback: string): string {
  for (const k of order) if (!found.includes(k)) return k;
  return fallback;
}

/* Whether the Outfitter will sell this consumable at all yet. */
export function kitKnown(key: string, found: string[]) { return found.includes(key); }
