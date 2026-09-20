/* What the first Anchor buys you: the Survey map says where the ground is rich.

   Round fourteen, X4. His ask, 2026-09-19: *"since it start filling out the
   map, it would be cool if you could add an indication on the map that
   materials or secrets, or a higher concentration of valuable minerals are in
   certain areas. It would only show for areas that you have found the anchor."*

   Two things are pinned here and they pull in opposite directions, which is why
   both need saying:

   1. the reading has to be INFORMATIVE - a map that flags everything, or
      nothing, or only what depth already told you, is not worth an Anchor
   2. and it has to stay COARSE - the Receiver gives proximity and never
      bearing, and a mineral hint finer than a region would undo the decision
      this whole game is built on */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();
H.setWorld(0);
H.resetSurvey();

const TIERS = [];
for (let r = 0; r < H.REGION_COUNT; r++) TIERS.push(H.richnessOf(r));

test('the map says something, and does not say it about everything', () => {
  /* Both failure modes at once. All-ordinary is an Anchor that bought nothing;
     all-flagged is a wash, and the player goes back to reading depth. */
  const rich = TIERS.filter((t) => t === 1).length;
  const lean = TIERS.filter((t) => t === -1).length;
  const plain = TIERS.filter((t) => t === 0).length;
  assert.ok(rich > 0, 'no region on the planet is rich, so the reading never says anything');
  assert.ok(plain > 0, 'every region carries a mark, so the map is a wash');
  assert.ok(rich + lean <= H.REGION_COUNT / 2,
    `${rich + lean} of ${H.REGION_COUNT} regions are flagged - most of the map should be ordinary`);
});

test('richness is judged against the same depth, not against the world', () => {
  /* The measurement that decided the design. Mean ore value per cell runs 11
     at the surface to 896 in the deep, because ore is depth-gated - so a
     world-wide comparison would light up the bottom of the map and tell the
     player what the depth ladder already tells them.

     Asserted as a PROPERTY rather than by re-deriving the sweep: every depth
     row must contain at least one ordinary region, which can only be true if
     the comparison is being made inside the row. A world-wide comparison would
     put every deep region above every shallow one and the deepest row would
     come back all-rich. */
  const rows = H.REGION_COUNT / H.REGION_COLS;
  for (let row = 0; row < rows; row++) {
    const inRow = [];
    for (let c = 0; c < H.REGION_COLS; c++) inRow.push(TIERS[row * H.REGION_COLS + c]);
    assert.ok(!inRow.every((t) => t === 1),
      `every region in row ${row} is rich, which is what a world-wide comparison looks like`);
    assert.ok(!inRow.every((t) => t === -1),
      `every region in row ${row} is lean, which is what a world-wide comparison looks like`);
  }
});

test('the reading is about the ground, not about what you have dug', () => {
  /* Two players with the same seed must see the same map, and a player who has
     mined Palewell out must not be told Palewell was always poor. `blockAt`
     returns null for a dug cell and `fallen` for a collapsed region, so the
     sweep swaps both out and puts them back. */
  H.resetSurvey();
  const before = [];
  for (let r = 0; r < H.REGION_COUNT; r++) before.push(H.richnessOf(r));

  /* Dig out a quarter of the world and collapse a region. */
  const dug = new Set();
  for (let d = 0; d < 400; d += 2) for (let x = 0; x < H.W; x += 2) dug.add(x + ',' + d);
  H.g.dug = dug;
  H.g.ground.collapsed = [7];
  H.resetSurvey();
  const after = [];
  for (let r = 0; r < H.REGION_COUNT; r++) after.push(H.richnessOf(r));

  assert.deepEqual(after, before,
    'the survey changed when the player dug, so it is reporting history rather than ground');

  /* And it put the world back exactly as it found it. */
  assert.equal(H.g.dug.size, dug.size, 'the sweep did not restore g.dug');
  assert.deepEqual(H.g.ground.collapsed, [7], 'the sweep did not restore the collapsed list');
  H.g.dug = new Set();
  H.g.ground.collapsed = [];
  H.resetSurvey();
});

test('a region says nothing until its Anchor is lit', () => {
  /* His sentence, in a test: "It would only show for areas that you have found
     the anchor." The same gate the map reveal already uses. */
  assert.equal(H.surveyKnown([], 3), false, 'an unlit region is reporting its minerals');
  assert.equal(H.surveyKnown([3], 3), true, 'a lit region says nothing');
  assert.equal(H.surveyKnown([0, 1, 2], 3), false, 'lighting one region reported another');
});

test('a region is far too big to be a marker', () => {
  /* The fence. The research's named failure is No Man's Sky's Analysis Visor,
     which pins exact nodes; the precedent is Valheim's Wishbone, which says
     nearer and never which way. A hint that covers fifteen columns and a
     hundred metres is a reason to go somewhere, and cannot be walked to. */
  assert.ok(H.REGION_SPAN_X >= 10,
    `a region is ${H.REGION_SPAN_X} columns wide, which is getting close to pointing at a cell`);
  assert.ok(H.REGION_SPAN_D >= 50,
    `a region is ${H.REGION_SPAN_D} m deep, which is getting close to pointing at a cell`);
});

test('the sweep does not step in time with the grids it is sampling', () => {
  /* The stride must not share a factor with the vein block, or every sample
     lands on the same offset inside every block for ever and whole veins go
     unseen - which would be a richness reading that is systematically wrong
     rather than merely noisy. */
  assert.notEqual(H.VEIN_W % H.SURVEY_STRIDE, 0,
    `the survey samples every ${H.SURVEY_STRIDE} cells and veins are ${H.VEIN_W} wide`);
  assert.notEqual(H.VEIN_H % H.SURVEY_STRIDE, 0,
    `the survey samples every ${H.SURVEY_STRIDE} cells and veins are ${H.VEIN_H} tall`);
});

test('the answer is the same every time it is asked', () => {
  H.resetSurvey();
  const a = [];
  for (let r = 0; r < H.REGION_COUNT; r++) a.push(H.richnessOf(r));
  H.resetSurvey();
  const b = [];
  for (let r = 0; r < H.REGION_COUNT; r++) b.push(H.richnessOf(r));
  assert.deepEqual(a, b);
});
