/* The feats (progression round, BC): each fires once, saves round-trip, and a
   save already past one is granted it once. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};

test('each feat fires once, at its threshold, however far past it goes', () => {
  for (const f of H.FEATS) {
    const t = H.blankTally(); const done = [];
    let fired = 0;
    for (let i = 0; i < f.at + 5; i++) fired += H.bump(t, done, f.counter).filter((x) => x.key === f.key).length;
    assert.equal(fired, 1, f.key + ' fired ' + fired + ' times');
    assert.ok(done.includes(f.key));
  }
});

test('a feat stays unwon one short of its threshold', () => {
  const f = H.FEATS.find((x) => x.at > 1);
  const t = H.blankTally(); const done = [];
  H.bump(t, done, f.counter, f.at - 1);
  assert.ok(!done.includes(f.key));
});

test('a full hold is nine tenths of the cap, and an empty cap is never full', () => {
  assert.ok(H.holdIsFull(45, 45));
  assert.ok(H.holdIsFull(41, 45));
  assert.ok(!H.holdIsFull(30, 45));
  assert.ok(!H.holdIsFull(0, 0));
});

test('feats and the tally round-trip through the real save text', () => {
  store.clear();
  H.g.feats = ['fullHold']; H.g.tally = { hold: 1, gas: 2, hard: 3, lost: 0 };
  H.g.mode = 'play'; H.g.px = H.START_X; H.g.pd = -1;
  H.save();
  const raw = JSON.parse(store.get(H.SAVE_KEY));
  assert.deepEqual(raw.feats, ['fullHold']);
  assert.deepEqual(raw.tally, { hold: 1, gas: 2, hard: 3, lost: 0 });
  H.g.feats = []; H.g.tally = H.blankTally();
  H.load();
  assert.deepEqual(H.g.feats, ['fullHold']);
  assert.deepEqual(H.g.tally, { hold: 1, gas: 2, hard: 3, lost: 0 });
});

test('a mistyped save field is zero or dropped, never NaN', () => {
  const t = H.loadTally({ hold: 'x', gas: NaN, hard: 7.9, lost: -3 });
  assert.deepEqual(t, { hold: 0, gas: 0, hard: 7, lost: 0 });
  assert.deepEqual(H.loadFeats(['fullHold', 'fullHold', 'nope', 4]), ['fullHold']);
  assert.deepEqual(H.loadFeats('junk'), []);
});

test('a save from before feats is granted what its log reached, once', () => {
  store.clear();
  store.set(H.SAVE_KEY, JSON.stringify({
    planet: 0, credits: 10, best: { depth: 100 }, up: {},
    log: { towed: 2, hullGas: 26 * 5 }
  }));
  H.load();
  assert.equal(H.g.tally.lost, 2);
  assert.equal(H.g.tally.gas, 5);
  assert.deepEqual(H.g.feats, [], 'load must not grant; the dock does');
  const first = H.settle(H.g.tally, H.g.feats).map((f) => f.key).sort();
  assert.deepEqual(first, ['ridOutGas', 'shipLost']);
  assert.deepEqual(H.settle(H.g.tally, H.g.feats), [], 'granted twice');
});

test('the Ledger lists what is done and one feat in front, never a lock', () => {
  const l = H.ledgerFeats(['fullHold']);
  assert.deepEqual(l.done.map((f) => f.key), ['fullHold']);
  assert.equal(l.next.key, H.FEATS[1].key);
  assert.equal(H.ledgerFeats(H.FEATS.map((f) => f.key)).next, null);
  for (const f of H.FEATS) assert.ok(!/\d/.test(f.act), f.key + ' puts a count in its act');
});
