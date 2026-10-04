/* Where the two room crates are on the world, in metres, for the words that name them. */
import { loadPure } from '../test/harness.mjs';

const H = await loadPure();
console.log(JSON.stringify({
  flare: H.flareCrateAt(),
  arc: H.arcCrateAt(),
  hall: H.arcHall(),
  halls: [3, 4, 5].map((i) => H.anchorAt(i)),
  gate0: H.gateDepth(0),
  gate1: H.gateDepth(1)
}));
