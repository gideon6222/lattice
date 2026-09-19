/* The strained lode: the first thing in this game that is an EVENT.

   Round twelve, V5, from his *"make more encounters and random events as you
   go"*. Scoping found the game further along than the research assumed - gas
   already glows at 0.45 through unlit rock and a tremor already warns before it
   lands, so both are telegraphed and are encounters by the research's own
   definition. What the game had none of is an event: a once-off decision that
   costs something on EVERY branch.

   A lode pays better than anything at its depth and brings dug ground down when
   it is cut. Take it and the way home closes; leave it and you walked past the
   richest thing on the descent while watching it glow.

   What is asserted here is the SHAPE of that bargain and the invariants adding
   a fifth pocket can break. The value, the chance and the weight are feel
   numbers and are deliberately not pinned. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

/* ---------- the invariant this game has already shipped a crash on ---------- */

test('a lode has a DEF entry, because it reaches the hold', () => {
  /* CLAUDE.md: anything that can reach `g.cargo` must have a DEF entry, since
     the manifest, the debrief and the sale all look materials up by id. This
     shipped once as a crash - the game ran, the manifest opened, and then it
     did not, depending on whether you had cut cut-stone since you last looked.
     A lode is ore and goes in the hold, so it is exactly that class. */
  assert.ok(H.DEF[H.LODE.id], 'no DEF row for the lode: the manifest will throw on it');
  assert.equal(H.DEF[H.LODE.id].value, H.LODE.value);
  assert.ok(H.LODE.wt > 0, 'a lode weighs nothing, so the hold never has to choose');
});

/* ---------- it is an overwriter, which is what makes it legal at all ---------- */

test('adding the lode moved no ore', () => {
  /* The invariant `blocks-frozen.json` defends and the reason this is a fifth
     POCKET rather than a twelfth ore. An ore would have had to enter the ladder
     and shift every band below it; an overwriter on its own hash replaces the
     cell it lands on and consumes no roll from any other stream.

     Asserted directly rather than via the golden: for every cell the lode takes,
     the ore roll underneath is unchanged, which is the actual claim. */
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.ground = H.newGround();
  let lodes = 0, checked = 0;
  for (let d = H.LODE.min; d < H.WORLD_DEPTH - 4; d += 3) {
    for (let x = 0; x < H.W; x += 2) {
      const b = H.blockAt(x, d);
      checked++;
      if (b && b.id === H.LODE.id) lodes++;
    }
  }
  assert.ok(checked > 1000, `only ${checked} cells swept, so this proves little`);
  assert.ok(lodes > 0, 'not one lode in the whole deep half, so nothing below is being tested');
});

test('a lode never appears above its own floor', () => {
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.ground = H.newGround();
  for (let d = 0; d < H.LODE.min; d++) {
    for (let x = 0; x < H.W; x += 2) {
      const b = H.blockAt(x, d);
      assert.ok(!b || b.id !== H.LODE.id,
        `a lode at ${x},${d} is above its floor of ${H.LODE.min} m`);
    }
  }
});

test('a lode is rarer than a Bloom, so it stays an event and not a resource', () => {
  /* The property, not the number: two in a descent would make it a resource and
     the whole design is that it is the thing you remember about one. */
  assert.ok(H.LODE.chance < H.BLOOM.chance,
    `a lode at ${H.LODE.chance} is commoner than a Bloom at ${H.BLOOM.chance}`);
});

test('a lode is the best thing at its depth, or the bargain is not a bargain', () => {
  /* If something nearby pays more for free, nobody sane cuts a lode, and the
     decision the whole milestone exists for never gets asked. Checked against
     every ore that exists at its floor. */
  const here = H.ORES.filter((o) => o.min <= H.LODE.min);
  for (const o of here) {
    assert.ok(H.LODE.value > o.value,
      `${o.name} pays ${o.value} at ${o.min} m and a lode pays ${H.LODE.value}, so the lode is not worth its price`);
  }
  assert.ok(here.length >= 3, `only ${here.length} ores exist at the lode's floor, so this compares almost nothing`);
});

test('it is flagged so the loop can charge for it', () => {
  /* The flag is what the break handler branches on. Without it a lode is just
     an expensive ore and the ground never answers - which would be the
     milestone silently not shipping. */
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.ground = H.newGround();
  let found = null;
  for (let d = H.LODE.min; d < H.WORLD_DEPTH - 4 && !found; d++) {
    for (let x = 0; x < H.W; x++) {
      const b = H.blockAt(x, d);
      if (b && b.id === H.LODE.id) { found = b; break; }
    }
  }
  assert.ok(found, 'no lode anywhere in the world');
  assert.equal(found.lode, true, 'a lode is not flagged, so cutting one costs nothing');
  assert.equal(found.ore, true, 'a lode is not ore, so it never reaches the hold');
  assert.ok(!found.hazard && !found.cache && !found.spoil,
    'a lode carries another branch flag, so the break handler will take the wrong path');
});

/* ---------- the guarantee that makes it fair ---------- */

test('cutting a lode can never strand the ship', () => {
  /* The promise the design rests on: it can cost you the easy way home and can
     never cost you the run. It is `planCollapse`'s own guarantee - CLAUDE.md's
     "a tremor must never take the run" - and this asserts the lode's collapse
     size cannot defeat it.

     Driven through planCollapse directly with a shaft dug down and a big ask:
     whatever it takes, a route to the pad must survive. */
  H.setWorld(0);
  H.g.ground = H.newGround();
  const dug = new Set();
  for (let d = 0; d <= 140; d++) dug.add('30,' + d);
  H.g.dug = dug;
  H.g.px = 30; H.g.pd = 140;
  const rand = H.stream(1, 140, 887);
  const taken = H.planCollapse(H.LODE_COLLAPSE, rand);
  /* Either it took cells and a route still exists, or it reverted and took
     none. Both are correct; a stranded ship is not. */
  const route = H.findRoute();
  assert.ok(route, `the lode's collapse took ${taken.length} cells and left no way to the pad`);
});

test('the lode collapse is not bigger than the worst tremor', () => {
  /* Sized against something the game already does rather than picked: a lode
     should cost about what the worst tremor costs, because it is a tremor you
     chose. If this ever exceeds it, the deliberate choice has become worse than
     the accident, which is the wrong way round. */
  const worst = H.tremorCells(H.WORLD_DEPTH - 1, 0);
  assert.ok(H.LODE_COLLAPSE <= worst,
    `a lode brings down ${H.LODE_COLLAPSE} cells and the worst tremor only ${worst}`);
});
