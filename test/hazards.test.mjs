/* The Pressure Seal and the Resonance Tip (progression round, BE). */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

function withUp(patch, fn) {
  const saved = { ...H.g.up };
  Object.assign(H.g.up, patch);
  try { return fn(); } finally { Object.assign(H.g.up, saved); }
}

test('gas hits for less at every rung of the Seal, and the top rung vents it', () => {
  const dmg = (l) => withUp({ seal: l }, () => Math.round(H.GAS_HULL_DAMAGE * H.S.gasTake()));
  const soak = (l) => withUp({ seal: l }, () => H.GAS_SOAK * H.S.gasSoak());
  for (let l = 1; l <= H.SEAL_MAX; l++) assert.ok(dmg(l) < dmg(l - 1), 'rung ' + l);
  assert.equal(dmg(0), H.GAS_HULL_DAMAGE);
  assert.equal(soak(0), H.GAS_SOAK);
  assert.equal(soak(H.SEAL_VENTS_AT - 1), H.GAS_SOAK);
  assert.equal(soak(H.SEAL_VENTS_AT), 0);
  assert.equal(soak(H.SEAL_MAX), 0);
});

test('the Seal stacks with the Damper relic and never takes gas to nothing', () => {
  assert.ok(H.sealTake(H.SEAL_MAX) > 0.25);
  assert.ok(Math.round(H.GAS_HULL_DAMAGE * H.sealTake(H.SEAL_MAX)) >= 1);
});

test('a hard cell needs fewer strikes with the Tip, soft rock and ore below the line are untouched', () => {
  const hard = H.ROCKS.find((r) => r.hard >= H.HARD_ROCK && isFinite(r.hard));
  const soft = H.ROCKS.find((r) => r.hard < H.HARD_ROCK);
  const strikes = (l, b) => H.DIG_BASE * b.hard * H.tipWork(l, b.hard);
  for (let l = 1; l <= H.TIP_MAX; l++) assert.ok(strikes(l, hard) < strikes(l - 1, hard), 'rung ' + l);
  assert.equal(H.tipWork(H.TIP_MAX, hard.hard), 0.5, 'the top rung is the half the design names');
  for (let l = 0; l <= H.TIP_MAX; l++) assert.equal(strikes(l, soft), strikes(0, soft));
  assert.equal(H.tipWork(H.TIP_MAX, Infinity), 1);
});

test('the gas and hard-rock feats hand over the Seal and the Tip', () => {
  assert.equal(H.FEAT_DEVICES.seal.feat, 'ridOutGas');
  assert.equal(H.FEAT_DEVICES.tip.feat, 'hardRock');
  for (const k of ['seal', 'tip']) {
    const u = H.UPGRADES.find((x) => x.key === k);
    assert.ok(u && u.max === 4, k);
    assert.ok(H.FOUND_KEYS.has(k), k);
  }
});

test('the feat thresholds are a few committed runs, not an errand', () => {
  const at = (k) => H.FEATS.find((f) => f.key === k).at;
  assert.ok(at('ridOutGas') >= 3 && at('ridOutGas') <= 6);
  assert.ok(at('hardRock') >= 30 && at('hardRock') <= 60);
});
