/* CAN THE GAME BE FINISHED AT ALL.

   Round fifteen, and this file exists because the answer was NO for several
   commits and the test that should have said so was narrowed until it could
   not.

   ---------- what went wrong, in full, because it is the lesson ----------

   Y1 put three barriers across the world at 113, 226 and 339 m, each opened by
   the three Anchors of its own row. A new guard was written at the same time -
   `every Anchor is reachable without passing the gate it opens` - and it
   FAILED, on Kryllon. The reasoning at the time was that it was "asking the
   gate question and the laser question at once", so it was given
   `g.found = ['laser']` and went green.

   That reasoning was wrong and the test was right. Kryllon's hall is SEALED,
   sealed stone needs the Cutting Laser, and the laser's crate is drawn from
   anywhere between its own depth and the floor of the world - on this planet,
   434 m. So:

     - the barrier at 226 needs Kryllon, at 135 m, in tier 1
     - Kryllon needs the laser
     - the laser is at 434 m, behind the barriers at 226 AND 339

   Two deadlocks, either one fatal, and neither visible from any single test
   that asks about one mechanism. Handing a test the very key whose absence is
   the bug is how a check stops inspecting anything, and `INDEX.md` rule 11 is
   exactly about the shape of that mistake.

   ---------- what this file asks instead ----------

   It plays the campaign forward from nothing: no gates open, nothing found,
   no Anchors broken. At each step it asks what is reachable, takes everything
   reachable, and stops when nothing new can be had. If the Vault is not
   reachable at the end, the game cannot be finished, and the message says
   which rung it stopped on.

   This is deliberately the whole question in one test rather than four narrow
   ones. Narrow ones are what let this through. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

/* Every cell the ship can get to, given what has been found and opened.

   A flood fill from the pad through anything that is not permanently solid.
   `hard === Infinity` is the wall; everything else is time and fuel, which is
   not what this test is about. `ghost` is passable whatever its hardness. */
function reach() {
  const open = (x, d) => {
    if (x < 0 || x >= H.W || d < 0) return false;
    const b = H.blockAt(x, d);
    return !b || b.ghost || b.hard !== Infinity;
  };
  const seen = new Set(['30,0']);
  let queue = [[30, 0]];
  while (queue.length) {
    const next = [];
    for (const [x, d] of queue) {
      for (const [nx, nd] of [[x + 1, d], [x - 1, d], [x, d + 1], [x, d - 1]]) {
        const k = nx + ',' + nd;
        if (seen.has(k) || !open(nx, nd)) continue;
        seen.add(k);
        next.push([nx, nd]);
      }
    }
    queue = next;
  }
  return seen;
}

/* Standing NEXT to a cell is what lighting an Anchor and opening a crate both
   require - neither is mined. */
function touching(seen, x, d) {
  return seen.has(x + ',' + d) ||
         seen.has((x + 1) + ',' + d) || seen.has((x - 1) + ',' + d) ||
         seen.has(x + ',' + (d + 1)) || seen.has(x + ',' + (d - 1));
}

test('the campaign can be played from nothing to the Vault', () => {
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.ground = H.newGround();
  H.g.found = [];
  H.g.relics = [];

  const log = [];
  for (let step = 0; step < 40; step++) {
    const seen = reach();
    let moved = false;

    /* Pick up any device crate you can stand next to. The laser is the one
       that matters; the rest change what the map is worth and nothing about
       whether the game ends. */
    for (const [k, f] of H.findCells()) {
      if (H.g.found.includes(f.key)) continue;
      const i = k.indexOf(',');
      const x = +k.slice(0, i), d = +k.slice(i + 1);
      if (!touching(seen, x, d)) continue;
      H.g.found.push(f.key);
      log.push('found ' + f.key + ' at ' + d + ' m');
      moved = true;
    }
    if (moved) continue;

    /* Break any Anchor you can stand next to. A sealed one needs the laser,
       which `blockAt` answers for us: without it the hall's skin is Infinity
       and the flood never gets inside. */
    for (let r = 0; r < H.ANCHOR_COUNT; r++) {
      if (H.g.ground.lit.includes(r)) continue;
      const a = H.anchorAt(r);
      if (!touching(seen, a.x, a.d)) continue;
      H.lightAnchor(H.g.ground, r);
      log.push('broke ' + H.regionName(r) + ' at ' + a.d + ' m');
      moved = true;
    }
    if (moved) continue;

    /* And break any core whose tier is ready and whose cell you can reach. */
    for (let t = 0; t < H.GATE_COUNT; t++) {
      if (H.g.ground.gates.includes(t)) continue;
      if (!H.gateReady(t, H.g.ground.lit)) continue;
      const cx = H.coreColumn(t), cd = H.gateDepth(t);
      if (!touching(seen, cx, cd)) continue;
      H.openGate(H.g.ground.gates, t);
      log.push('opened gate ' + t + ' at ' + cd + ' m');
      moved = true;
    }
    if (!moved) break;
  }

  const seen = reach();
  const at = H.VAULT_CORE_X + ',' + H.VAULT_CORE_D;
  assert.ok(touching(seen, H.VAULT_CORE_X, H.VAULT_CORE_D),
    'THE GAME CANNOT BE FINISHED. Playing forward from nothing, taking everything reachable ' +
    'at every step, the Vault at ' + at + ' is never reached.\n' +
    'What a perfect player could do, in order:\n  ' + (log.join('\n  ') || '(nothing at all)') + '\n' +
    'Anchors broken: ' + H.g.ground.lit.length + ' of ' + H.ANCHOR_COUNT +
    '. Gates open: ' + H.g.ground.gates.join(', ') + '. Devices: ' + H.g.found.join(', '));

  assert.equal(H.g.ground.lit.length, H.ANCHOR_COUNT, 'some Anchor is unreachable');
  assert.equal(H.g.ground.gates.length, H.GATE_COUNT, 'some gate cannot be opened');
});

test('no device is buried behind a barrier it is needed to open', () => {
  /* The general rule, and the root cause. A crate used to be drawn from
     anywhere between its own depth and the floor of the world, which was
     harmless until barriers existed - the Receiver, which is the device that
     helps you FIND Anchors, came out at 443 m.

     A crate now lands inside the tier its own depth sits in, so the deepest it
     can ever be is the metre above that tier's own barrier. */
  H.setWorld(0);
  for (const f of H.FINDS) {
    const p = H.findAt(f, 0, H.coreDepth(0));
    const tier = H.depthTier(f.below);
    const floor = tier < H.GATE_COUNT ? H.gateDepth(tier) - 1 : H.WORLD_DEPTH;
    assert.ok(p.d >= f.below,
      `${f.key} is buried at ${p.d} m, above its own depth of ${f.below}`);
    assert.ok(p.d <= floor,
      `${f.key} becomes available at ${f.below} m, which is tier ${tier}, but its crate is at ` +
      `${p.d} m - past the barrier at ${floor + 1}. A device behind a gate it is needed to open ` +
      'is a save nobody can finish.');
  }
});

test('the two written-out constants still agree with the world', () => {
  /* INDEX.md rule 10b. Both of these exist because `finds.ts` and `vaults.ts`
     cannot import `gate.ts` or `region.ts` without going back through
     `config.ts`, which is the cycle that deleted the Vault once. Where you
     cannot derive, assert the derived quantity - and this is that assertion,
     for both of them, in the file whose subject is what they protect.

     Verify by changing either: the message names which one drifted. */
  assert.equal(H.TIER_ROWS, H.REGION_ROWS,
    'finds.ts believes the world has ' + H.TIER_ROWS + ' tiers and region.ts says ' +
    H.REGION_ROWS + ' - every crate is being buried against the wrong barrier');
  assert.equal(H.SEALED_MIN_TIER, H.depthTier(H.FIND_OF.laser.below),
    'vaults.ts seals from tier ' + H.SEALED_MIN_TIER + ' but the Cutting Laser is a tier ' +
    H.depthTier(H.FIND_OF.laser.below) + ' device - a sealed Anchor above its own key is a deadlock');
});

test('no sealed Anchor is above the depth its key is buried at', () => {
  /* The other half. Sealed stone needs the Cutting Laser, so an Anchor behind
     it can only be part of a barrier the player reaches WITH the laser in
     hand - which means its tier can be no shallower than the laser's.

     `SEALED_REGIONS` used to be a hand-picked set with Kryllon in it, at
     135 m in tier 1, and the laser is a tier 2 device. That is the deadlock
     this test names. */
  H.setWorld(0);
  const keyTier = H.depthTier(H.FIND_OF.laser.below);
  for (let r = 0; r < H.ANCHOR_COUNT; r++) {
    if (!H.anchorSealed(r)) continue;
    const a = H.anchorAt(r);
    assert.ok(H.depthTier(a.d) >= keyTier,
      `${H.regionName(r)}'s Anchor is sealed and sits at ${a.d} m, in tier ${H.depthTier(a.d)} - ` +
      `but the Cutting Laser that opens it is a tier ${keyTier} device. The barrier below ` +
      `${H.regionName(r)} can never be opened.`);
  }
});
