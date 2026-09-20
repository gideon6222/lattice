/* Ore comes in veins. Round fourteen, X1.

   His playtest, 2026-09-19: *"Can you make materials feel more rare? I want it
   to feel exciting when you find resources."*

   **Measured before anything was designed**, by flood-filling every ore cell on
   the planet into deposits of the same id: the mean deposit was 1.00 cells for
   every one of the eleven ores. There were no veins anywhere and never had
   been. Finding gold got you one gold. The deep ores were already savage -
   solmarrow is five cells on the whole planet - so lowering a rate would not
   have made anything exciting, it would have made it absent.

   So the same total supply is clustered into far fewer, richer veins: rarer in
   the only sense that matters, the number of separate find-events, and worth
   stopping for when it happens.

   **What this file pins is the SHAPE and the SUPPLY, never the layout.** Where
   any particular vein sits is the seed's business and `blocks-frozen.json`
   guards the world itself. What must not quietly stop being true is that ore
   still clusters, and that clustering did not change how much ore there is -
   because the whole argument for doing it this way was that the economy would
   not need rebalancing. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

/* Every ore cell on the planet, and the deposits they form. Built once: it is
   a sweep of 27,572 cells and four tests want it. */
function survey() {
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.rubble = new Set();
  const cd = H.coreM();
  const ids = new Set(H.ORES.map((o) => o.id));
  const grid = new Map();
  const perOre = {};
  const column = new Array(H.W).fill(0);
  for (let d = 0; d < cd; d++) {
    for (let x = 0; x < H.W; x++) {
      const b = H.blockAt(x, d);
      if (!b || !b.ore || !ids.has(b.id)) continue;
      grid.set(x + ',' + d, b.id);
      perOre[b.id] = (perOre[b.id] || 0) + 1;
      column[x]++;
    }
  }
  /* Flood fill into connected deposits of one id. */
  const seen = new Set();
  const deposits = [];
  for (const [k, id] of grid) {
    if (seen.has(k)) continue;
    const stack = [k];
    seen.add(k);
    let n = 0;
    while (stack.length) {
      const c = stack.pop();
      n++;
      const i = c.indexOf(',');
      const x = +c.slice(0, i), d = +c.slice(i + 1);
      for (const [dx, dd] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nk = (x + dx) + ',' + (d + dd);
        if (!seen.has(nk) && grid.get(nk) === id) { seen.add(nk); stack.push(nk); }
      }
    }
    deposits.push({ id, n });
  }
  return { total: grid.size, perOre, deposits, column };
}

const S = survey();

/* The supply the world had the day before veins existed, measured cell by cell
   on the same planet. Not a target that was chosen - a reading that was taken,
   and the whole claim of X1 is that it did not have to move. */
const BEFORE_TOTAL = 1582;

test('ore still exists, and there is about as much of it as there ever was', () => {
  /* The load-bearing one. Clustering is a change to WHERE ore is, and the
     reason nothing else in the economy needed rebalancing is that it is not a
     change to how much. The block probability is scaled by cells-per-block
     over cells-per-vein precisely so these two multiply back to the old rate.

     Ten per cent, and the measured figure is -3%. The slack is for the two
     places the arithmetic is only nearly exact: two veins of the same ore that
     overlap are counted once, and where two hearts cover one cell the nearer
     wins, which moves a little supply between ores. Tighten this if either is
     ever made exact; do not loosen it to make a retune pass. */
  const drift = (S.total - BEFORE_TOTAL) / BEFORE_TOTAL;
  assert.ok(Math.abs(drift) < 0.10,
    `the world holds ${S.total} ore cells against ${BEFORE_TOTAL} before veins, ` +
    `${(drift * 100).toFixed(1)}% - clustering was supposed to move ore, not add or delete it`);
});

test('ore comes in veins, not in single cells', () => {
  /* The measurement that started the round, turned into a guard. Before, the
     mean deposit was 1.00 for all eleven ores and the biggest anywhere was 3. */
  const mean = S.total / S.deposits.length;
  assert.ok(mean > 2.5,
    `the mean deposit is ${mean.toFixed(2)} cells - ore has gone back to being scattered`);
  const biggest = Math.max(...S.deposits.map((x) => x.n));
  assert.ok(biggest >= 6, `the biggest vein on the planet is ${biggest} cells`);
});

test('a vein is a find, not a field', () => {
  /* The other end of the same dial. A "vein" the size of a room would make ore
     terrain rather than a prize, and the failure would look like success in the
     test above. */
  const mean = S.total / S.deposits.length;
  assert.ok(mean < 8, `the mean deposit is ${mean.toFixed(2)} cells, which is a seam to live in`);
  assert.ok(S.deposits.length > 200,
    `only ${S.deposits.length} deposits on the whole planet - most descents would meet none`);
});

test('every ore still exists, and the deepest ones did not vanish', () => {
  /* Clustering makes rare things rarer in the number of PLACES they are, and
     the deepest ores had five cells to begin with. This is the assertion that
     stops a retune quietly deleting one from the world. */
  for (const o of H.ORES) {
    assert.ok((S.perOre[o.id] || 0) > 0,
      `${o.id} does not generate anywhere on the planet any more`);
  }
});

test('no column of the world is barren, which is the artifact this cost a cycle to find', () => {
  /* The first build kept each vein's heart a radius clear of its own block's
     edges, so a vein could never straddle a boundary - and the measured result
     was vertical stripes of dead rock at columns 0, 4, 8 ... 60, holding 0 to 2
     ore cells where every other column held 16 to 38.

     Nothing in the supply total showed it: the world still had the right amount
     of ore, arranged in barcode. Only a per-column reading found it, which is
     why there is a per-column reading here. */
  const min = Math.min(...S.column);
  const max = Math.max(...S.column);
  assert.ok(min > max * 0.2,
    `column ore counts run from ${min} to ${max} - the block grid is showing through as barren stripes`);
});

test('a vein can never reach past its neighbouring block', () => {
  /* The four-block sweep in `blockAt` rests on this: a cell asks only the
     blocks that could hold a heart within reach of it, and that is at most two
     in each axis because twice the maximum reach is less than a block. Make a
     vein big enough, or a block small enough, and the sweep starts missing
     veins - silently, because a missed vein just looks like rock. */
  assert.ok(2 * H.VEIN_REACH_MAX < H.VEIN_W,
    `a vein reaches ${H.VEIN_REACH_MAX.toFixed(2)} either side of its heart in a block ${H.VEIN_W} wide`);
  assert.ok(2 * H.VEIN_REACH_MAX < H.VEIN_H,
    `a vein reaches ${H.VEIN_REACH_MAX.toFixed(2)} either side of its heart in a block ${H.VEIN_H} tall`);
});

test('the radius is derived from the size of a find, not written down twice', () => {
  /* INDEX.md rule 10b. `VEIN_CELLS` is the dial - "a vein is about this many
     cells" - and the radius is the circle that holds that many. A second
     literal here is how the comment and the world stop agreeing. */
  assert.ok(Math.abs(Math.PI * H.VEIN_R * H.VEIN_R - H.VEIN_CELLS) < 1e-9,
    'VEIN_R is no longer the radius of a circle holding VEIN_CELLS cells');
  /* And the wobble averages 1, so widening it changes how ragged a vein is and
     never how big. */
  assert.ok(Math.abs((H.VEIN_WOBBLE_LO + H.VEIN_WOBBLE_HI) / 2 - 1) < 1e-9,
    'the edge wobble no longer averages 1, so it is silently resizing every vein');
});

test('generation is still a pure function of the seed', () => {
  /* Four new hashes went into `blockAt` for this, and a vein that moved between
     two asks would be a world that cannot be saved. */
  H.setWorld(0);
  H.g.dug = new Set();
  for (const [x, d] of [[10, 40], [30, 200], [50, 400], [0, 5], [60, 120]]) {
    const a = H.blockAt(x, d), b = H.blockAt(x, d);
    assert.deepEqual(a, b);
  }
});

/* ---------- X2: a rare find announces itself ---------- */

test('only the deepest few ores announce themselves, and the deepest loudest', () => {
  /* The research's first-ranked mechanism, and its stated risk: doing this to
     everything collapses it back to nothing, because a signal every find sends
     is not a signal. Four tiers, off the ladder's own order.

     Asserted as the SHAPE - monotonic, bounded, silent outside the tiers - so
     the numbers stay free to retune, which is the rule `grade.test.mjs`
     already sets for anything that is a feel value. */
  let prev = Infinity;
  for (let rank = 0; rank < H.REVEAL_TIERS; rank++) {
    const v = H.revealOf(rank);
    assert.ok(v > 0, `rank ${rank} is inside the tiers and announces nothing`);
    assert.ok(v <= 1, `rank ${rank} reveals at ${v}, over the ceiling`);
    assert.ok(v < prev, `rank ${rank} is louder than the rarer ore above it`);
    prev = v;
  }
  assert.equal(H.revealOf(H.REVEAL_TIERS), 0,
    'the tiers have widened, so an ordinary find now announces itself too');
  assert.equal(H.revealOf(-1), 0, 'a block that is not on the ore ladder at all');

  /* **Absolutely, not relative to the constant.** Every assertion above is
     phrased in terms of REVEAL_TIERS, so all of them pass for ANY value of it -
     which was found by planting the obvious fault, widening the tiers to the
     whole ladder, and watching the file stay green. A test that moves with the
     thing it is testing inspects nothing.

     The claim is that MOST ores stay quiet. The research is explicit that a
     signal every find sends is not a signal, and names the bottom three or four
     of eleven. */
  assert.ok(H.REVEAL_TIERS * 2 < H.ORES.length,
    `${H.REVEAL_TIERS} of ${H.ORES.length} ores announce themselves, which is most of them`);
  assert.equal(H.revealOf(H.ORES.length - 1), 0, 'copper announces itself');
});

test('the loud ones are the deep ones, by the ladder and not by a list', () => {
  /* `ORES` is deepest-first and that order IS the rarity, so rank is rarity.
     A second list of "which ores are exciting" would be a thing to keep in
     step with the ladder for ever, and this asserts the ladder still has the
     property that makes reading rank off it legitimate. */
  for (let i = 1; i < H.ORES.length; i++) {
    assert.ok(H.ORES[i].min < H.ORES[i - 1].min,
      `${H.ORES[i].id} is not shallower than ${H.ORES[i - 1].id} - ORES is no longer deepest-first`);
  }
  /* And the ones that announce themselves are genuinely the deep end. */
  const loud = H.ORES.slice(0, H.REVEAL_TIERS).map((o) => o.id);
  const quiet = H.ORES.slice(H.REVEAL_TIERS);
  assert.ok(quiet.length >= H.ORES.length / 2,
    `only ${quiet.length} of ${H.ORES.length} ores are quiet, so the signal has stopped being one`);
  for (const o of quiet) {
    assert.ok(o.min < Math.min(...H.ORES.slice(0, H.REVEAL_TIERS).map((z) => z.min)),
      `${o.id} is quiet but lives deeper than ${loud.join(', ')}`);
  }
});
