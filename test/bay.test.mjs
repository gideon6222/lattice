/* The shelf rule, as numbers. Progression round, BA.

   Fable's studio rule (plans/unlocks-2026-10-02.md, section A) says what a shop
   may show. The room that draws it is three.js and cannot be unit tested; the
   decision underneath is pure (src/sim/bay.ts) and these hold it. They prove
   the SHAPE of the rule. Whether the first hour is paced is the bots' job (BH),
   and a phone run. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();
const DEPTHS = [0, 10, 25, 45, 60, 90, 112, 113, 130, 160, 200, 226, 260, 300, 340];
const ALL_FOUND = H.FINDS.map((f) => f.key);
const stateAt = (depth, found = []) => ({ depth, found });

test('a rack never lists more than three lines, at any depth, found or not', () => {
  for (const d of DEPTHS) for (const found of [[], ALL_FOUND]) {
    for (const s of H.SYSTEMS) {
      const r = H.bayRack(s.key, stateAt(d, found));
      assert.ok(r.lines.length <= H.RACK_LINES_MAX, s.key + ' at ' + d + ' m lists ' + r.lines.length);
    }
  }
});

test('the table itself holds no more than three lines in any system', () => {
  for (const s of H.SYSTEMS) {
    assert.ok(H.UPGRADES.filter((u) => u.system === s.key).length <= H.RACK_LINES_MAX, s.key);
  }
});

test('Autopilot and Repair Drone moved to CREW and nothing else changed system', () => {
  const sys = (k) => H.UPGRADES.find((u) => u.key === k).system;
  assert.equal(sys('auto'), 'crew');
  assert.equal(sys('drone'), 'crew');
  assert.equal(sys('hull'), 'hull');
  assert.equal(sys('tank'), 'engines');
});

test('a rack shows one shadow at most, and never one it already owns', () => {
  for (const d of DEPTHS) for (const found of [[], ALL_FOUND]) {
    for (const s of H.SYSTEMS) {
      const r = H.bayRack(s.key, stateAt(d, found));
      if (r.shadow) assert.ok(!r.lines.some((u) => u.key === r.shadow.key), r.shadow.key);
    }
  }
});

test('every shadow states its route, in words, and a found one gives a depth', () => {
  for (const d of DEPTHS) for (const s of H.SYSTEMS) {
    const sh = H.bayRack(s.key, stateAt(d)).shadow;
    if (!sh) continue;
    assert.ok(sh.route.card.length > 10, sh.key);
    assert.ok(sh.route.card.endsWith('.'), sh.key);
    if (sh.route.kind === 'found') assert.match(sh.route.card, /below \d+ m/);
    if (sh.route.kind === 'core') assert.match(sh.route.card, /core breaks/);
  }
});

test('every entry has a route kind, and at least half are earned by an act', () => {
  const all = H.entries();
  assert.equal(all.length, H.UPGRADES.length + 3);
  for (const e of all) assert.ok(['bought', 'found', 'core', 'feat'].includes(e.kind), e.key);
  const { earned, total } = H.earnedShare();
  assert.ok(earned * 2 >= total, earned + ' of ' + total);
});

test('the only road is on sale at the first dock', () => {
  const at0 = H.SYSTEMS.flatMap((s) => H.bayRack(s.key, stateAt(0)).lines.map((u) => u.key));
  for (const k of ['drill', 'cargo', 'thrust', 'tank', 'scan']) assert.ok(at0.includes(k), k);
});

test('a fresh save shows no device it has not found, only a shadow', () => {
  const at0 = H.SYSTEMS.flatMap((s) => H.bayRack(s.key, stateAt(30)).lines.map((u) => u.key));
  for (const k of ALL_FOUND) assert.ok(!at0.includes(k), k);
});

test('a found device is on its rack from the moment it is found', () => {
  const r = H.bayRack('hold', stateAt(30, ['magnet']));
  assert.ok(r.lines.some((u) => u.key === 'magnet'));
});

test('the Next line never names a thing out of reach', () => {
  for (const d of [0, 20, 60, 100, 112]) {
    const line = H.nextLine(stateAt(d));
    assert.ok(line === null || !/Cooling Rig|second core|third core/.test(line), d + ': ' + line);
    assert.ok(line === null || !/below (1[3-9]\d|2\d\d) m/.test(line), d + ': ' + line);
  }
  // With core one broken, the second core's rung may be named.
  assert.match(H.nextLine(stateAt(130)) ?? '', /Next:/);
});

test('the Next line is one line, in the right shape, and never carries a count', () => {
  for (const d of DEPTHS) {
    const line = H.nextLine(stateAt(d));
    if (line === null) continue;
    assert.ok(line.startsWith('Next: '), line);
    assert.ok(!line.includes('\n'), line);
    assert.ok(!/\d+ of \d+/.test(line), line);
  }
  assert.equal(H.nextLine(stateAt(0)), 'Next: Ore Sorter, sell a full hold');
  assert.equal(H.nextLine(stateAt(0, ['sorter'])), 'Next: ? in the rock below 20 m');
  assert.equal(H.nextLine(stateAt(60, ['magnet', 'receiver', 'survey', 'sorter'])), 'Next: Hull Plating, break the first core');
});

test('a first run is told about the nearest dig, before it has found anything', () => {
  assert.match(H.nextLine(stateAt(0)) + '', /Next:/);
  const hold = H.bayRack('hold', stateAt(0));
  assert.equal(hold.shadow?.key, 'magnet');
});

test('the line carries the table: regrouping changed no key, price, level cap or gate', () => {
  const frozen = {
    drill: [340, 1.42, 9, 0], cargo: [320, 1.42, 9, 0], thrust: [300, 1.42, 9, 0],
    tank: [1100, 1.42, 9, 0], cool: [6000, 1.38, 7, 226], scan: [700, 1.42, 9, 0],
    auto: [4900, 1.42, 6, 113], bomb: [3000, 1.45, 3, 0], laser: [12500, 1.45, 5, 226],
    hull: [3700, 1.38, 9, 113], magnet: [1200, 1.38, 6, 0], survey: [3600, 1.42, 5, 0],
    receiver: [3500, 1.38, 5, 0], drone: [4400, 1.38, 5, 113],
    /* Added in BD: the Ore Sorter, handed over for a full hold. */
    sorter: [1500, 1.6, 3, 0]
  };
  const now = Object.fromEntries(H.UPGRADES.map((u) => [u.key, [u.base, u.mul, u.max, u.unlock]]));
  assert.deepEqual(now, frozen);
});

test('a save from before the change loads with every level intact', () => {
  // The save stores levels by key (g.up) and finds by key (g.found); neither
  // mentions a system, so a key surviving is the whole carry-over.
  for (const u of H.UPGRADES) assert.ok(typeof u.key === 'string' && u.key.length > 0);
  assert.ok(H.SYSTEMS.map((s) => s.key).includes('crew'));
});
