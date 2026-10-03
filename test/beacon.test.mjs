/* The Return Beacon (progression round, BF). */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();
const kind = (id) => (H.DEF[id] ? { wt: H.DEF[id].wt, key: H.isKey(id) } : undefined);
const ore = H.ORES.map((o) => o.id).find((id) => !H.isKey(id));
const key = H.KEY_ORES[0];

test('the kept share climbs with each rung and is the design numbers', () => {
  assert.deepEqual([1, 2, 3, 4].map(H.beaconKeep), [0.5, 0.65, 0.8, 0.9]);
  assert.equal(H.beaconKeep(0), 0);
  for (let l = 1; l <= H.BEACON_MAX; l++) assert.ok(H.beaconKeep(l) > H.beaconKeep(l - 1));
});

test('a climb keeps the share of ore, never more, and every key', () => {
  const cargo = { [ore]: 20, [key]: 3 };
  for (let l = 1; l <= H.BEACON_MAX; l++) {
    const out = H.beaconCargo(cargo, l, kind);
    assert.equal(out.cargo[ore], Math.floor(20 * H.beaconKeep(l)));
    assert.equal(out.cargo[key], 3);
    const w = H.DEF[ore].wt * out.cargo[ore] + H.DEF[key].wt * 3;
    assert.ok(Math.abs(out.weight - w) < 1e-9);
  }
  assert.deepEqual(cargo, { [ore]: 20, [key]: 3 }, 'the input is not touched');
});

test('no Beacon keeps nothing, and an empty or unknown hold is safe', () => {
  assert.deepEqual(H.beaconCargo({ [ore]: 5 }, 0, kind).cargo, {});
  assert.deepEqual(H.beaconCargo({}, 3, kind), { cargo: {}, weight: 0 });
  assert.deepEqual(H.beaconCargo({ nope: 4 }, 3, kind).cargo, {});
});

test('HOME is once a run, underground only, and needs the device', () => {
  assert.equal(H.beaconReady(0, false, true), false);
  assert.equal(H.beaconReady(1, false, true), true);
  assert.equal(H.beaconReady(1, true, true), false);
  assert.equal(H.beaconReady(1, false, false), false);
});

test('the first lost ship hands over the Beacon, once, at rung one', () => {
  assert.equal(H.FEAT_DEVICES.beacon.feat, 'shipLost');
  const tally = H.blankTally(), feats = [];
  const won = H.bump(tally, feats, 'lost');
  assert.deepEqual(won.map((f) => f.gift), ['beacon']);
  assert.deepEqual(H.bump(tally, feats, 'lost'), []);
  const u = H.UPGRADES.find((x) => x.key === 'beacon');
  assert.ok(u && u.max === 4 && H.FOUND_KEYS.has('beacon'));
  assert.equal(u.effect(0), 'Not installed');
});

test('the Beacon is dark: no silhouette and no Next line asks for a lost ship', () => {
  const st = { depth: 0, found: ['sorter', 'seal', 'tip'] };
  assert.equal(H.nextLine(st), 'Next: ? in the rock below 20 m');
  for (const s of H.SYSTEMS) assert.notEqual(H.bayRack(s.key, st).shadow?.key, 'beacon');
  assert.ok(!(H.nextLine({ depth: 0, found: [] }) || '').includes('Beacon'));
});

test('a bot that loses a ship finds the box, and one HOME climb is spent per run', () => {
  const saved = { up: { ...H.g.up }, tally: H.g.tally, feats: H.g.feats };
  try {
    H.g.tally = H.blankTally(); H.g.feats = [];
    H.bump(H.g.tally, H.g.feats, 'lost');
    assert.ok(H.g.feats.includes('shipLost'));
    H.g.up.beacon = 1;
    let used = false;
    assert.equal(H.beaconReady(H.g.up.beacon, used, true), true);
    used = true;
    assert.equal(H.beaconReady(H.g.up.beacon, used, true), false);
  } finally { Object.assign(H.g, saved); }
});
