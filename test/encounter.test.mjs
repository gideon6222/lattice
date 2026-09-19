/* The encounter frame, asserted on the properties it exists to guarantee.

   `src/sim/encounter.ts` answers his 2026-09-18 ask: *"Make more encounters and
   random events as you go."* The frame decides WHAT fires and HOW OFTEN; what
   each one does is content that registers with it.

   The research says the failures here are all about rate rather than about
   content, so that is what is asserted:

   1. it is deterministic - the same planet plays the same beats in the same
      places, which is what makes a descent describable rather than a slot
      machine
   2. a once-only beat never fires twice in one run
   3. the cap holds, so a descent cannot be wall-to-wall events
   4. the gap holds, so two never land on top of each other
   5. an uneventful descent is POSSIBLE, which is the one the cap and the gap
      exist for and the one nothing would otherwise check
   6. depth bands are respected, so a deep beat never greets a new player
   7. and the pool is not empty, so none of the above passes by inspecting
      nothing

   The weights and FIRE_CHANCE are feel numbers and are deliberately NOT pinned:
   every property below holds for any weighting. CLAUDE.md records two lighting
   tests that failed the moment a value was retuned to exactly what a playtest
   asked for, which is the wrong way round for a test to behave. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

/* A fixture pool rather than the game's own, so these properties are about the
   FRAME. Tying them to shipped content would make a content change look like a
   frame regression. */
const DEFS = [
  { key: 'shallow', weight: 3, from: 0, to: 120, once: false },
  { key: 'onceonly', weight: 2, from: 10, to: 400, once: true },
  { key: 'deep', weight: 4, from: 200, to: 452, once: false }
];

const SEEDS = [0, 1, 7, 12, 99, 404, 1013];

test('the same planet plays the same beats in the same places', () => {
  for (const seed of SEEDS) {
    const a = H.walk(DEFS, 452, seed);
    const b = H.walk(DEFS, 452, seed);
    assert.deepEqual(a, b, `seed ${seed} replayed differently`);
  }
});

test('different planets do not all play the same beats', () => {
  /* The other half, and the one that catches a hash that ignores its seed - a
     constant function is perfectly deterministic. */
  const walks = SEEDS.map((s) => JSON.stringify(H.walk(DEFS, 452, s)));
  assert.ok(new Set(walks).size > 1,
    'every seed produced an identical descent, so the seed is not reaching the roll');
});

test('a once-only beat never fires twice in one run', () => {
  for (const seed of SEEDS) {
    const keys = H.walk(DEFS, 452, seed).map((e) => e.key);
    const onces = keys.filter((k) => k === 'onceonly');
    assert.ok(onces.length <= 1, `seed ${seed} fired onceonly ${onces.length} times: ${keys.join(', ')}`);
  }
});

test('the cap holds, so a descent is never wall to wall', () => {
  for (const seed of SEEDS) {
    const got = H.walk(DEFS, 452, seed);
    assert.ok(got.length <= H.MAX_PER_RUN,
      `seed ${seed} fired ${got.length} encounters against a cap of ${H.MAX_PER_RUN}`);
  }
});

test('two never land on top of each other', () => {
  for (const seed of SEEDS) {
    const got = H.walk(DEFS, 452, seed);
    for (let i = 1; i < got.length; i++) {
      assert.ok(got[i].depth - got[i - 1].depth >= H.MIN_GAP,
        `seed ${seed}: ${got[i - 1].key} at ${got[i - 1].depth} and ${got[i].key} at ${got[i].depth} are closer than ${H.MIN_GAP} m`);
    }
  }
});

test('an uneventful descent is possible', () => {
  /* The property the cap and the gap exist FOR, and the one nothing else here
     would catch: a frame that fires on every band satisfies every assertion
     above except this one. Swept over many seeds rather than asserted of one,
     because the claim is that quiet runs happen, not that a particular seed is
     quiet. */
  let quiet = 0;
  for (let seed = 0; seed < 200; seed++) {
    if (H.walk(DEFS, 120, seed).length === 0) quiet++;
  }
  assert.ok(quiet > 10,
    `only ${quiet} of 200 shallow descents were quiet, so the planet is wall to wall`);
});

test('a deep beat never greets a player at the surface', () => {
  for (let seed = 0; seed < 200; seed++) {
    for (const e of H.walk(DEFS, 452, seed)) {
      const def = DEFS.find((d) => d.key === e.key);
      assert.ok(e.depth >= def.from && e.depth <= def.to,
        `${e.key} fired at ${e.depth}, outside its ${def.from}-${def.to} band`);
    }
  }
});

test('the gap and the cap are enforced by the pool, not only by the walk', () => {
  /* `walk` is a convenience and a caller could roll by hand, so the rules have
     to live in `eligible` rather than in the loop around it. Asserted directly
     so a refactor that moves the checks into `walk` fails here. */
  const st = { fired: ['shallow'], lastDepth: 100 };
  assert.deepEqual(H.eligible(DEFS, st, 110), [], 'the gap is not enforced by eligible');
  assert.ok(H.eligible(DEFS, st, 100 + H.MIN_GAP).length > 0, 'the gap never opens again');

  const full = { fired: ['shallow', 'shallow', 'shallow'], lastDepth: -1 };
  assert.deepEqual(H.eligible(DEFS, full, 60), [], 'the cap is not enforced by eligible');

  const used = { fired: ['onceonly'], lastDepth: -1 };
  assert.ok(!H.eligible(DEFS, used, 60).some((d) => d.key === 'onceonly'),
    'a spent once-only beat is still in the pool');
});

test('firing is pure and does not mutate the state it was given', () => {
  const before = H.newEncounters();
  const after = H.fired(before, 'shallow', 40);
  assert.deepEqual(before.fired, [], 'the original state was mutated');
  assert.equal(before.lastDepth, -1);
  assert.deepEqual(after.fired, ['shallow']);
  assert.equal(after.lastDepth, 40);
});

/* ---------- the guard against a frame that inspects nothing ---------- */

test('these properties were checked against beats that actually fired', () => {
  /* INDEX.md rule 11. Every assertion above is satisfied trivially by a frame
     that never fires anything at all, which is the exact shape of a check that
     passes because nothing happened. */
  let total = 0;
  for (let seed = 0; seed < 200; seed++) total += H.walk(DEFS, 452, seed).length;
  assert.ok(total > 150,
    `200 full descents produced only ${total} encounters, so the tests above are asserting about an empty frame`);
});
