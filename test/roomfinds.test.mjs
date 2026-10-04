/* The Flare Line and the Arc Lance (BG): two finds that sit in a room, not in
   the open rock. The claims: each crate is placed once, beside its own room and
   outside it, on the shallow side of the tier it should be met in; it stays
   until opened (missable, never lost); and no other crate and no frozen block
   moves. The two ladders and the lance's vein walk are pure and tested here. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

test('the flare crate is beside the first wreck, outside it, and in the world', () => {
  const w = H.firstWreck();
  assert.ok(w, 'no wreck is placed');
  for (const p of H.vaultPlan().filter((q) => q.vault.id === 'derelict')) {
    assert.ok(w.d <= p.d, 'a shallower wreck exists than the first');
  }
  const c = H.flareCrateAt();
  assert.ok(Math.abs(c.x - w.x) >= 6, 'the crate sits inside the wreck footprint');
  assert.ok(c.x >= 1 && c.x <= H.W - 2);
  assert.ok(c.d > 0 && c.d < H.coreDepth(0));
});

test('the arc crate is beside one of the three halls under the second barrier', () => {
  assert.ok([3, 4, 5].includes(H.arcHall()));
  const a = H.anchorAt(H.arcHall()), c = H.arcCrateAt();
  assert.ok(Math.abs(c.x - a.x) >= 6, 'the crate sits inside the hall');
  assert.ok(c.d >= 113 && c.d < 226, 'the crate is at ' + c.d + ' m, outside the tier after the first barrier');
});

test('both crates are on the world until opened, and each is missable but never lost', () => {
  const m = H.withRoomFinds(new Map(), []);
  assert.deepEqual([...m.values()].map((f) => f.key).sort(), ['arc', 'flare']);
  assert.equal(H.withRoomFinds(new Map(), ['flare']).size, 1);
  assert.equal(H.withRoomFinds(new Map(), ['flare', 'arc']).size, 0);
});

test('the two are devices: not installed at zero, found rather than sold, with a route in words', () => {
  for (const k of ['flare', 'arc']) {
    const u = H.UPGRADES.find((x) => x.key === k);
    assert.match(u.effect(0), /not installed/i);
    assert.ok(H.FOUND_KEYS.has(k));
    assert.equal(H.routeOf(u).kind, 'found');
  }
  assert.equal(H.routeOf(H.UPGRADES.find((x) => x.key === 'flare')).act, 'in an old wreck');
  assert.equal(H.routeOf(H.UPGRADES.find((x) => x.key === 'arc')).act, 'beside an Anchor hall of the second barrier');
});

test('the flare ladder: more flares and more reach at every rung, none without the line', () => {
  assert.equal(H.flaresPerRun(0), 0);
  for (let l = 1; l <= H.FLARE_MAX; l++) {
    assert.ok(H.flaresPerRun(l) > H.flaresPerRun(l - 1));
    assert.ok(H.flareRadius(l) > H.flareRadius(l - 1));
  }
  assert.equal(H.flareReady(1, 0, true), true);
  assert.equal(H.flareReady(1, 2, true), false, 'a spent rack throws another');
  assert.equal(H.flareReady(1, 0, false), false, 'a flare is thrown on the pad');
  assert.equal(H.flareReady(0, 0, true), false);
});

test('a flare flies ahead and lands before the first closed cell', () => {
  const open = (x) => x < 3;
  assert.deepEqual(H.flareLand(open, 0, 5, 1, 0), { x: 2, d: 5 });
  assert.deepEqual(H.flareLand(() => true, 0, 5, 0, 1), { x: 0, d: 5 + H.FLARE_THROW });
  assert.deepEqual(H.flareLand(() => false, 0, 5, 1, 0), { x: 0, d: 5 });
});

/* A tiny world: ore 'a' in a stripe, ore 'b' beside it, rock elsewhere. */
const kind = (x, d) => (d === 5 && x >= 3 && x <= 12 ? 'a' : d === 6 && x === 3 ? 'b' : d < 0 ? null : '');

test('the lance finds the first ore ahead and follows only that ore', () => {
  const cells = H.lanceVein(kind, 0, 5, 1, 0, 4);
  assert.ok(cells.length > 0 && cells.length <= H.lanceCells(4));
  assert.deepEqual(cells[0], [3, 5], 'the first cell is the first ore met');
  for (const [x, d] of cells) assert.equal(kind(x, d), 'a', 'followed the wrong ore at ' + x + ',' + d);
});

test('the lance is capped by its rung and does nothing with no ore in reach', () => {
  assert.equal(H.lanceVein(kind, -3, 5, 1, 0, 1).length, 0, 'ore six cells ahead is past the first rung');
  assert.ok(H.lanceVein(kind, -3, 5, 1, 0, 3).length > 0, 'the third rung looks eight cells');
  assert.equal(H.lanceVein(kind, -3, 5, 1, 0, 0).length, 0, 'no lance, no shot');
});

test('a deeper rung takes more of a vein', () => {
  const a = H.lanceVein(kind, 0, 5, 1, 0, 1).length;
  const b = H.lanceVein(kind, 0, 5, 1, 0, 2).length;
  const c = H.lanceVein(kind, 0, 5, 1, 0, 3).length;
  assert.ok(c >= b && b >= a);
  assert.equal(H.lanceVein(kind, 0, 9, 1, 0, 4).length, 0, 'no ore along that row');
});

test('the Arc Lance breaks its vein over 8 to 30 frames at 30 fps, nearest first, never all at once', () => {
  for (const n of [6, 10, 16, 24]) {
    let first = -1, last = -1, prev = 0;
    for (let f = 0; f <= 60; f++) {
      const due = H.lanceDue(n, f / 30);
      assert.ok(due >= prev, 'the count only grows');
      if (due > 0 && first < 0) first = f;
      if (due === n && last < 0) last = f;
      prev = due;
    }
    assert.equal(first, 0, 'the first cell goes on the tap');
    assert.ok(last - first >= 8 && last - first <= 30, n + ' cells took ' + (last - first) + ' frames');
  }
  assert.equal(H.lanceDue(1, 0), 1);
  assert.equal(H.lanceDue(0, 1), 0);
});

test('a flare is still at full light a minute after the throw', () => {
  assert.ok(H.FLARE_SECONDS >= 60 + 6, 'the minute is lit, then the six-second fade');
});
