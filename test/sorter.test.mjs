/* The Ore Sorter (progression round, BD): the swap rule, the gift, the route. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();
const ores = H.ORES.filter((o) => !H.isKey(o.id)).sort((a, b) => a.value - b.value);
const cheap = ores[0], mid = ores[Math.floor(ores.length / 2)], rich = ores[ores.length - 1];
const keyId = H.KEY_ORES[0];

test('no Sorter, no swap', () => {
  assert.equal(H.sortSwap({ [cheap.id]: 5 }, 45, 45, rich.id, 0), null);
});

test('a full hold swaps its cheapest ore for a richer find', () => {
  const cargo = { [cheap.id]: 3, [mid.id]: 2 };
  const weight = 3 * cheap.wt + 2 * mid.wt;
  const cap = weight + Math.max(0, rich.wt - cheap.wt);
  const victim = H.sortSwap(cargo, weight, cap, rich.id, 1);
  assert.equal(victim, cheap.id);
  const w = H.applySwap(cargo, weight, victim, rich.id);
  assert.equal(cargo[cheap.id], 2);
  assert.equal(cargo[rich.id], 1);
  assert.ok(Math.abs(w - (weight - cheap.wt + rich.wt)) < 1e-9);
});

test('it never swaps for something cheaper or equal', () => {
  const cap = 4 * rich.wt;
  assert.equal(H.sortSwap({ [rich.id]: 4 }, cap, cap, cheap.id, 3), null);
  assert.equal(H.sortSwap({ [rich.id]: 4 }, cap, cap, rich.id, 3), null);
});

test('it will not swap when one unit would not free enough weight', () => {
  const heavy = ores.slice().sort((a, b) => b.wt - a.wt)[0];
  const light = ores.find((o) => o.wt < heavy.wt && o.value < heavy.value);
  if (!light) return;
  const cargo = { [light.id]: 1 };
  const cap = light.wt;
  assert.equal(H.sortSwap(cargo, cap, cap, heavy.id, 3), null);
});

test('rungs widen how many kinds it weighs', () => {
  /* Two kinds held; the cheaper one is too light to make room, the dearer one
     is not. Rung 1 looks only at the cheapest, rung 2 at both. */
  const a = ores.find((o) => o.wt < 1.01 * Math.min(...ores.map((x) => x.wt)));
  const need = ores.filter((o) => o.value > a.value && o.wt > a.wt + 0.01);
  if (!need.length) return;
  const inc = need[need.length - 1];
  const b = ores.find((o) => o.value > a.value && o.value < inc.value && o.wt >= inc.wt);
  if (!b) return;
  const cargo = { [a.id]: 1, [b.id]: 1 };
  const weight = a.wt + b.wt, cap = weight;
  assert.equal(H.sortSwap(cargo, weight, cap, inc.id, 1), null);
  assert.equal(H.sortSwap(cargo, weight, cap, inc.id, 2), b.id);
});

test('only the top rung lets a key mineral displace a money ore', () => {
  const k = H.DEF[keyId];
  const cap = 10 * rich.wt + 1;
  const cargo = { [rich.id]: 10 };
  const w = 10 * rich.wt;
  const heavyEnough = w - rich.wt + k.wt <= cap;
  if (!heavyEnough) return;
  if (k.value < rich.value) {
    assert.equal(H.sortSwap(cargo, Math.max(w, cap - 0.001), cap, keyId, 2), null);
    assert.equal(H.sortSwap(cargo, Math.max(w, cap - 0.001), cap, keyId, 3), rich.id);
  }
});

test('a key in the hold is never the one put down', () => {
  const cargo = { [keyId]: 4 };
  assert.equal(H.sortSwap(cargo, 45, 45, rich.id, 3), null);
});

test('the Sorter is a hold line with three rungs, handed over by the first feat', () => {
  const u = H.UPGRADES.find((x) => x.key === 'sorter');
  assert.ok(u);
  assert.equal(u.system, 'hold');
  assert.equal(u.max, 3);
  assert.equal(H.FEAT_DEVICES.sorter.feat, 'fullHold');
  assert.ok(H.FEATS.some((f) => f.key === 'fullHold' && f.gift === 'sorter'));
  assert.ok(H.FOUND_KEYS.has('sorter'));
});

test('the hold rack names the Sorter\'s route before the feat, and owns it after', () => {
  /* The dig outranks the gift for the rack's one shadow; the Next line leads
     with the gift, an act that can be done now. */
  assert.equal(H.bayRack('hold', { depth: 0, found: [] }).shadow.key, 'magnet');
  assert.equal(H.bayRack('hold', { depth: 0, found: ['magnet'] }).shadow.key, 'sorter');
  assert.equal(H.routeOf(H.UPGRADES.find((u) => u.key === 'sorter')).kind, 'feat');
  assert.equal(H.nextLine({ depth: 0, found: [] }), 'Next: Ore Sorter, sell a full hold');
  const after = H.bayRack('hold', { depth: 0, found: ['sorter'] });
  assert.ok(after.lines.some((u) => u.key === 'sorter'));
});
