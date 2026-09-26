/* Repairing the planet. Round fifteen, Y7.

   His brief: *"From there, you can start repairing it. I want repairing the
   planet to have an actual mechanic rather than just feeding it materials."*

   The plan's receipt is two claims - repair cannot be completed from the pad,
   and it consumes something other than credits - and both of them are really
   one claim about where the mechanic lives. A donation screen satisfies
   neither; a trip to the scar of an Anchor you broke satisfies both without
   either being designed in. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

function fresh() {
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.cargo = {};
  H.g.ground = H.newGround();
  return H.g.ground;
}

test('repair cannot be done from the pad, or anywhere but a scar', () => {
  /* The plan's first receipt, and it is not enforced by a check that says "not
     at the pad" - it is enforced by the scars being ninety metres down. The
     shallowest Anchor in the world is the nearest a player can ever be to a
     repair while standing on the surface. */
  const s = fresh();
  s.lit = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  assert.equal(H.scarHere(H.START_X, 0, s.lit), -1, 'the pad is a scar');

  let shallowest = Infinity;
  for (let r = 0; r < H.ANCHOR_COUNT; r++) shallowest = Math.min(shallowest, H.anchorAt(r).d);
  assert.ok(shallowest > H.REPAIR_REACH * 4,
    `the nearest scar is ${shallowest} m down, which is close enough to reach without a dive`);
});

test('a scar answers only where the Anchor is actually broken', () => {
  const s = fresh();
  for (let r = 0; r < H.ANCHOR_COUNT; r++) {
    const a = H.anchorAt(r);
    s.lit = [];
    assert.equal(H.scarHere(a.x, a.d, s.lit), -1,
      `${H.regionName(r)} has a scar before anybody broke its Anchor`);
    s.lit = [r];
    assert.equal(H.scarHere(a.x, a.d, s.lit), r);
    /* And you have to be AT it. One region away is not standing in a hole. */
    assert.equal(H.scarHere(a.x + H.REPAIR_REACH + 1, a.d, s.lit), -1,
      'a scar can be packed from across the room');
    assert.equal(H.scarHere(a.x, a.d + H.REPAIR_REACH + 1, s.lit), -1);
  }
});

test('repair takes ore out of the hold and never credits', () => {
  /* The plan's second receipt. It takes the HOLD rather than the bank, which
     is the whole difference between this and what it replaced: cargo has
     weight, so every kilo carried down is a kilo not carried back, and that
     decision was made on the surface before the dive. */
  const s = fresh();
  s.lit = [0];
  /* A Ballast with room in it, which is the only state anybody repairs in - a
     new ground starts full, and the first version of this test packed into
     that and correctly got nothing. */
  s.ballast = 0.4;
  const before = H.g.credits;
  /* Silver is money; the amethyst is a key and must come home (AF). */
  H.g.cargo = { silver: 6, amethyst: 2 };

  const out = H.packScar(s, 0, H.g.cargo);
  assert.ok(out.gain > 0, 'a hold of silver packed into a scar did nothing');
  assert.equal(out.units, 6);
  assert.deepEqual(out.used, { silver: 6 }, 'it did not take what it said it took - or it took a key');
  assert.equal(H.g.credits, before, 'repair charged credits');
  assert.ok(s.ballast > 0.4, 'the Ballast did not rise');
});

test('one deliberate trip is a real repair, and no trip is a whole one', () => {
  /* The rate, asserted as the DERIVED quantity rather than as REPAIR_MULT -
     the feed values and the hold size are both tuned numbers that will move,
     and what has to survive them moving is how a repair run feels.

     Measured 2026-09-19 against a starting 45 kg hold, which is what a new
     player has: copper 0.29 of the tank, amethyst 0.72, umbrite 0.48. At x1
     the best ore in the game moves it a sixth and filling it is five dives of
     doing nothing else, which is the grind round seven already recorded
     happening to the upgrade tree. */
  const CAP = 45;
  for (const o of H.ORES.filter((o) => !H.isKey(o.id))) {
    const n = Math.floor(CAP / o.wt);
    if (n <= 0) continue;
    const v = H.repairValue({ [o.id]: n });
    assert.ok(v > 0.2,
      `a full starting hold of ${o.id} repairs ${(v * 100).toFixed(0)}% of the Ballast - that is a grind`);
    assert.ok(v < 1,
      `a full starting hold of ${o.id} repairs ${(v * 100).toFixed(0)}% of the Ballast, so one trip is the whole mechanic`);
  }
});

test('you repair with whatever you are carrying, not with one farmed ore', () => {
  /* The property that keeps this from becoming a shopping list. A hold of
     copper and a hold of umbrite must be worth roughly the same to the
     ground, or there is exactly one correct repair ore and the trip stops
     being a decision about what you happened to find. */
  const CAP = 45;
  const vals = H.ORES
    .filter((o) => o.id !== 'copper' && !H.isKey(o.id))
    .map((o) => H.repairValue({ [o.id]: Math.floor(CAP / o.wt) }));
  const lo = Math.min(...vals), hi = Math.max(...vals);
  assert.ok(hi / lo < 2,
    `a hold of the best repair ore is worth ${(hi / lo).toFixed(1)}x a hold of the worst - ` +
    'there is a right answer, so the hunt for it replaces the decision');
});

test('packing a scar settles the ground it is in', () => {
  /* A step and not a reset, the same size as the one an Anchor gives, so the
     two readings a player has of "this region is calmer now" agree. */
  const s = fresh();
  s.lit = [2];
  s.ballast = 0.4;
  s.unrest[2] = 0.9;
  H.packScar(s, 2, { iron: 10 });
  assert.ok(s.unrest[2] < 0.9, 'repairing a region did nothing to the ground');
  assert.ok(s.unrest[2] > 0, 'repairing a region undid everything you did to it');
  assert.equal(s.unrest[3], H.newGround().unrest[3], 'repairing one region settled another');
});

test('a full Ballast takes nothing and costs nothing', () => {
  /* There is no undo and a hold is most of a dive. `CRAFT.md`: the expensive
     irreversible action is the one that has to be hardest to do by accident,
     so packing into a full tank is refused rather than half-honoured. */
  const s = fresh();
  s.lit = [0];
  s.ballast = 1;
  const out = H.packScar(s, 0, { solmarrow: 2 });
  assert.equal(out.gain, 0);
  assert.equal(out.units, 0, 'a full Ballast ate the hold anyway');
  assert.deepEqual(out.used, {});
});

test('rock is not a repair', () => {
  /* The rule feeding ran on and it still holds: rock does not hold a planet
     down. It also means cut stone in the hold - which cannot happen, but has
     shipped as a crash before - is worth nothing here rather than throwing. */
  assert.equal(H.repairValue({ stone: 99, granite: 99, rubble: 99 }), 0);
  assert.equal(H.repairable({ stone: 99 }), false);
  assert.equal(H.repairable({}), false);
  assert.equal(H.repairable({ copper: 1 }), true);
  assert.equal(H.packable('stone'), false);
  assert.equal(H.packable('copper'), true);
});

test('a scar never takes a key, and a hold of keys alone cannot seal one', () => {
  /* Round seventeen, AF. Keys are banked and spent only on the rung that asks
     for them; a scar swallowing one was a way to lose it without being asked. */
  for (const k of H.KEY_ORES) assert.equal(H.repairValue({ [k]: 5 }), 0, k + ' repairs the ground');
  assert.equal(H.repairable({ ruby: 3, coreite: 1 }), false);
});

test("the scar's stage follows the packing, and a trip or two closes it", () => {
  const s = fresh();
  s.lit = [0];
  s.ballast = 0;
  assert.equal(H.scarStage(s.packed[0]), 0);
  let last = 0, trips = 0;
  while (H.scarStage(s.packed[0]) < H.SCAR_STAGES - 1 && trips < 10) {
    H.packScar(s, 0, { silver: 6 });
    const st = H.scarStage(s.packed[0]);
    assert.ok(st >= last, 'the scar opened again as it was packed');
    last = st; trips++;
  }
  assert.equal(last, H.SCAR_STAGES - 1, 'ten trips never closed the scar');
  assert.ok(trips <= 3, 'closing one scar took ' + trips + ' trips of silver - that is a meter, not a repair');
  /* Only its own scar. */
  assert.equal(H.scarStage(s.packed[1] || 0), 0);
});
