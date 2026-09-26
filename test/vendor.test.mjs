/* What each counter sells. Round seventeen, AO.

   The receipt the milestone names: each vendor's stock differs. And the three
   rules that make a gate a stop rather than a second pad: supplies for credits
   are the pad's alone, a gate trades one supply for a key, and Sink is sold at
   the first gate and nowhere else. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();
const FOUND = ['auto', 'laser', 'drone', 'magnet', 'survey', 'receiver', 'bomb'];
const PLACES = [-1, ...Array.from({ length: H.GATE_COUNT }, (_, i) => i)];

test('no two counters stock the same thing', () => {
  const seen = new Map();
  for (const p of PLACES) {
    const k = H.vendorStock(p, 400, FOUND).join('|');
    assert.ok(!seen.has(k), 'place ' + p + ' stocks exactly what place ' + seen.get(k) + ' does');
    seen.set(k, p);
  }
});

test('only the pad sells supplies for credits, and every gate trades one for a key', () => {
  assert.equal(H.sellsSupplies(-1), true);
  assert.equal(H.dealAt(-1), null);
  for (let t = 0; t < H.GATE_COUNT; t++) {
    assert.equal(H.sellsSupplies(t), false, 'gate ' + t + ' sells supplies for credits');
    const d = H.dealAt(t);
    assert.ok(d, 'gate ' + t + ' has no key trade');
    assert.ok(H.isKey(d.key), 'gate ' + t + ' trades for ' + d.key + ', which is not a key');
    assert.ok(H.SUPPLY_OF[d.supply], 'gate ' + t + ' trades a supply that does not exist');
    /* The key has to be findable above the gate that asks for it. */
    const plan = H.KEY_PLANS.find((p) => p.id === d.key);
    assert.ok(plan.lo < H.gateDepth(t), d.key + ' starts below gate ' + t + ', which asks for it');
  }
});

test('Sink is sold at the first gate and nowhere else, for a key the first tier yields', () => {
  for (const p of PLACES) {
    assert.equal(H.vendorStock(p, 400, FOUND).includes('skill:sink'), p === H.SINK_GATE, 'place ' + p);
  }
  const plan = H.KEY_PLANS.find((p) => p.id === H.SINK_PRICE.key);
  assert.ok(plan.lo < H.gateDepth(H.SINK_GATE));
  assert.equal(H.ABILITIES.find((a) => a.key === 'sink').tier, -1, 'Sink came back as a core gift');
});

test('a gate fits every rung up to its own tier and none past it; the pad fits them all', () => {
  for (const u of H.UPGRADES) {
    assert.deepEqual(H.rungBand(u, -1), [0, u.max]);
    const [lo0, hi0] = H.rungBand(u, 0);
    assert.equal(lo0, 0, u.key + ': the first gate refuses the early rungs');
    assert.ok(hi0 < u.max, u.key + ': the first gate fits the capstone');
    assert.ok(H.rungBand(u, 1)[1] >= hi0);
    assert.equal(H.sellsRung(u, hi0, 0), false);
    assert.equal(H.sellsRung(u, hi0 - 1, 0), true);
  }
});

test('a gate shows no line sealed below its own depth', () => {
  for (let t = 0; t < H.GATE_COUNT; t++) {
    for (const u of H.vendorLines(t, 400, FOUND)) {
      assert.ok(u.unlock <= H.gateDepth(t), u.key + ' is on gate ' + t + "'s counter but sealed there");
    }
  }
});
