/* The pacing bot's report (BH): the first hour on the economy probe.
   `node tools/pacing.mjs`, or `studio run pacing`. The assertions live in
   test/pacing.test.mjs; this prints the numbers they are read from. */

import { loadPure } from '../test/harness.mjs';
import { makeCampaign } from './campaign-model.mjs';

const H = await loadPure();
const r = makeCampaign(H).play();

console.log('won', r.won, 'runs', r.runs, 'minutes', r.minutes, 'barrier runs', JSON.stringify(r.barrierRun));
console.log('\nfirst 14 buys (run, rung, cost, mean of last four sales, runs of saving)');
for (const b of r.buys.slice(0, 14)) {
  console.log(String(b.run).padStart(3), (b.key + ' ' + b.level).padEnd(12), String(b.cost).padStart(7),
    String(Math.round(b.income)).padStart(7), (b.income ? b.cost / b.income : Infinity).toFixed(2));
}
console.log('\nrungs over three runs of saving (not a ladder\'s last)');
for (const b of r.buys) {
  if (!b.last && b.income && b.cost / b.income > 3) {
    console.log(String(b.run).padStart(3), (b.key + ' ' + b.level).padEnd(12), b.cost, Math.round(b.income), (b.cost / b.income).toFixed(2));
  }
}
console.log('\ndevices met (run, minute)');
for (const [k, m] of Object.entries(r.metAt)) console.log(k.padEnd(10), m.run, m.min);

console.log('\nbeacon: the climb is free of fuel, so the price is the share left behind');
for (let l = 1; l <= H.BEACON_MAX; l++) console.log('rung', l, 'keeps', H.beaconKeep(l));
