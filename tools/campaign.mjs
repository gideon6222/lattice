/* campaign.mjs - how long each tier of the ladder takes, played by a probe.

   Round seventeen, AA. The model and its limits are in campaign-model.mjs; the
   one to remember is that every number here is a FLOOR - the probe never
   hesitates and always knows where everything is - and his own session times
   replace it tier by tier when he plays.

   Run:  npm run campaign        (or: node tools/campaign.mjs) */

import { loadPure } from '../test/harness.mjs';
import { makeCampaign } from './campaign-model.mjs';

const H = await loadPure();
const c = makeCampaign(H);
const r = c.play();

console.log('The Lattice campaign probe - the ladder from nothing, played on the pure layer.');
console.log('A floor, not a forecast: the probe never hesitates and always knows where things are.');
console.log('');
console.table(r.tiers);
console.log('');
console.log(r.won ? `Vault reached after ${r.runs} runs, ${r.minutes} game-minutes.`
                  : `NOT FINISHED after ${r.runs} runs, ${r.minutes} game-minutes. Gates open: ${r.gates.join(', ') || 'none'}, Anchors ${r.lit}.`);
console.log('');
console.log('Every goal, in the order it was taken:');
console.table(r.log);
