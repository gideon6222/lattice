/* The pacing bot, pinned (progression round, BH).

   `tools/campaign-model.mjs` plays the first hour and every hour after it on
   the shipping economy; `node tools/pacing.mjs` (or `studio run pacing`)
   prints the numbers. The bot never hesitates and never dies, so every figure
   is a floor on a real player's runs and a ceiling on how fast the economy can
   be. These are the four promises of DESIGN.md "Pacing, in sessions".

   The Return Beacon is outside the third: a bot that cannot lose a ship never
   earns it. Its climb costs no fuel, so what it costs is the share it leaves,
   and those shares are asserted to climb and to stay under a whole hold. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';
import { makeCampaign } from '../tools/campaign-model.mjs';

const H = await loadPure();
const r = makeCampaign(H).play();

test('the bot finishes, so the pacing numbers are about the game', () => {
  assert.ok(r.won, 'the bot stalled: ' + JSON.stringify(r.log.slice(-3)));
});

test('a first buy inside two runs, and a choice among equals', () => {
  const first = r.buys[0];
  assert.ok(first && first.run <= 2, 'the first buy came at run ' + (first && first.run));
  const afford = H.shelfStock(0, []).filter((u) => H.costOf(u, 0) <= r.sales[0] && !H.matCost(u, 0));
  assert.ok(afford.length >= 2,
    'one run banked ' + r.sales[0] + ' and that affords ' + afford.map((u) => u.key).join(', ') + ': not a choice');
});

test('no rung under a ladder\'s last asks more than four runs of saving', () => {
  for (const b of r.buys) {
    if (b.last || !b.income) continue;
    const runs = b.cost / b.income;
    assert.ok(runs <= 4, `${b.key} ${b.level} cost ${b.cost} at run ${b.run}, ${runs.toFixed(1)} runs of the last four sales (${Math.round(b.income)} each)`);
  }
});

test('the Ore Sorter comes by run 3', () => {
  assert.ok(r.metAt.sorter && r.metAt.sorter.run <= 3, 'the Sorter came at run ' + (r.metAt.sorter && r.metAt.sorter.run));
});

test('every device is met once by the end of the third barrier', () => {
  const end = r.barrierRun[2];
  assert.ok(end, 'the third barrier was never broken');
  for (const key of H.FOUND_KEYS) {
    if (key === 'beacon') continue;
    assert.ok(r.metAt[key] && r.metAt[key].run <= end,
      `${key} was met at run ${r.metAt[key] && r.metAt[key].run}, after the third barrier at run ${end}`);
  }
});

test('the Return Beacon keeps more on each rung and never a whole hold', () => {
  for (let l = 1; l <= H.BEACON_MAX; l++) {
    assert.ok(H.beaconKeep(l) < 1, 'rung ' + l + ' keeps everything');
    if (l > 1) assert.ok(H.beaconKeep(l) > H.beaconKeep(l - 1), 'rung ' + l + ' keeps no more than rung ' + (l - 1));
  }
});
