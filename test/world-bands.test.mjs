/* Moved out of the browser (e2e): it only reads the world, so it needs no page.
   The claims are the same ones the spec made. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

/* Blocks that carry `ore: true` and are not materials: they decide the draw, not
   the hold. See the e2e history for why `salvage` and `derelictlamp` are here. */
const NOT_ORE = new Set(['__cells', 'geode', 'gas', 'cache', 'schematic', 'relic', 'part',
  'anchor', 'anchorbroken', 'anchorscar', 'salvage', 'derelictlamp']);

function band(lo, hi) {
  const seen = {};
  let cells = 0;
  for (let d = lo; d < hi; d++) {
    for (let x = 0; x < H.W; x++) {
      const b = H.blockAt(x, d);
      cells++;
      if (b && b.ore && !b.core) seen[b.id] = (seen[b.id] || 0) + 1;
    }
  }
  seen.__cells = cells;
  return seen;
}

test('no cell above a material\'s floor depth ever holds it', () => {
  const bad = [];
  const floor = H.coreM();
  for (let d = 0; d < floor; d++) {
    for (let x = 0; x < H.W; x += 3) {
      const b = H.blockAt(x, d);
      if (!b || !b.ore || b.core) continue;
      const o = H.ORES.find((z) => z.id === b.id);
      if (o && d < o.min) bad.push(o.id + ' at ' + d + ' m, above its floor of ' + o.min);
    }
  }
  assert.equal(bad.slice(0, 5).join('; '), '', 'a material generated above its own floor depth');
});

test('the top sixty metres hold the starter three materials', () => {
  const shallow = Object.keys(band(0, 60)).filter((k) => !NOT_ORE.has(k));
  assert.equal(shallow.sort().join(','), 'copper,iron,silver');
});

test('the deepest material is rare even in the band it lives in', () => {
  const floor = H.coreM();
  const deep = band(floor - 90, floor);
  const sol = deep.solmarrow || 0;
  assert.ok(sol > 0, 'solmarrow does not generate at all in the deepest band');
  assert.ok(sol / deep.__cells < 0.006,
    'solmarrow is ' + ((sol / deep.__cells) * 100).toFixed(2) + '% of the deep band, not a prize');
});
