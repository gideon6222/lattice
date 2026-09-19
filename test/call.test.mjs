/* The Call, asserted on its intent rather than on its curve.

   `src/sim/call.ts` is the instrument that answers his 2026-09-18 ask: *"Make
   the game feel like it is pushing you in a specific direction ... Make sure the
   player knows the objective or is subtly pointed in the correct direction."*

   What is asserted here is what the instrument MEANS, not what it currently
   returns. CALL_POW is a feel number and is expected to be retuned by a
   playtest; CLAUDE.md records two lighting tests that were written against a
   raw field and both failed the moment the value was retuned to exactly what a
   playtest asked for, which is the wrong way round for a test to behave. So the
   properties below hold for ANY monotonically decreasing falloff.

   ---------- one distinction these tests exist to keep straight ----------

   `callFrom(x, d, r)` is ONE Anchor's voice and is monotonic in distance to it.
   `resonance(x, d, lit)` is the LOUDEST unlit voice, and is deliberately not
   monotonic along an approach: walking toward a far Anchor while walking away
   from a near one should make the reading fall, because the reading is about the
   nearest thing and the nearest thing is now further away.

   The first version of this file asserted monotonicity on `resonance` and it
   failed on the real Anchor layout - three Anchors sit in a row and standing
   between two of them is an ordinary place to be. The test was wrong and the
   code was right, which is worth recording: the property is real, it just
   belongs to `callFrom`. What ties them together is asserted separately below,
   and it is the strongest statement in this file: the loudest voice is always
   the nearest one. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

const ALL = Array.from({ length: H.ANCHOR_COUNT }, (_, i) => i);
const NONE = [];

/* ---------- one Anchor's voice ---------- */

test('walking straight at an Anchor never makes its own voice fall', () => {
  for (let r = 0; r < H.ANCHOR_COUNT; r++) {
    const a = H.anchorAt(r);
    let prev = -1;
    /* From 60 cells out, which is past CALL_REACH, to the cell itself. Starting
       outside the reach is deliberate: it proves the voice turns ON during the
       walk rather than having been on the whole time. */
    for (let step = 60; step >= 0; step--) {
      const v = H.callFrom(a.x, a.d - step, r);
      assert.ok(v >= prev,
        `approaching Anchor ${r} at ${a.x},${a.d}: its voice fell from ${prev} to ${v} at ${step} cells out`);
      prev = v;
    }
    assert.equal(prev, 1, `standing on Anchor ${r} its voice is ${prev}, not 1`);
  }
});

test('a voice turns on during that walk rather than being on already', () => {
  /* The other half of the test above, stated separately because "never falls"
     is satisfied by a constant: a voice that is always 1 would pass test one and
     be useless. */
  const a = H.anchorAt(0);
  assert.equal(H.callFrom(a.x, a.d - 60, 0), 0, 'audible from 60 cells, which is past CALL_REACH');
  assert.ok(H.callFrom(a.x, a.d - 10, 0) > 0, 'silent at 10 cells');
});

test('a voice says nothing beyond its reach, so it cannot be read as a map', () => {
  const a = H.anchorAt(8);
  assert.equal(H.callFrom(a.x, a.d - H.CALL_REACH, 8), 0, 'exactly at the reach it is not yet silent');
  assert.equal(H.callFrom(a.x, a.d - H.CALL_REACH - 1, 8), 0, 'past the reach it is not silent');
  assert.ok(H.callFrom(a.x, a.d - H.CALL_REACH + 2, 8) > 0, 'just inside the reach it is already silent');
});

test('a voice is proximity and not bearing', () => {
  /* The design decision this asserts: the instrument says "near" and never
     "that way", because choosing a direction and digging it is the decision the
     game is built on. Four points at the same distance in four directions must
     read the same, so nothing downstream can extract a heading from it. */
  const a = H.anchorAt(4);
  const k = 12;
  const around = [
    H.callFrom(a.x + k, a.d, 4),
    H.callFrom(a.x - k, a.d, 4),
    H.callFrom(a.x, a.d + k, 4),
    H.callFrom(a.x, a.d - k, 4)
  ];
  for (const v of around) {
    assert.ok(Math.abs(v - around[0]) < 1e-9,
      `equal distances read differently (${around.join(', ')}), so this is a bearing`);
  }
  assert.ok(around[0] > 0, 'the sample points are outside the reach, so this proves nothing');
});

/* ---------- the loudest voice ---------- */

test('the reading is always the NEAREST unlit Anchor, never a blend', () => {
  /* The tie between the two functions, and the reason resonance takes a max
     rather than a sum: a sum would make two distant Anchors read as one near
     one, which is a lie the instrument would tell regularly on a grid that puts
     three of them in a row.

     Swept over the world against two different lit sets, because the property
     has to hold as the campaign progresses and not only at the start. */
  for (const lit of [NONE, [0, 4, 7]]) {
    for (let x = 0; x < H.W; x += 4) {
      for (let d = 0; d < H.WORLD_DEPTH; d += 9) {
        const near = H.nearestUnlit(x, d, lit);
        const got = H.resonance(x, d, lit);
        assert.ok(near, 'nearestUnlit returned null with Anchors still unlit');
        assert.ok(Math.abs(got - H.callFrom(x, d, near.r)) < 1e-9,
          `at ${x},${d} the reading ${got} is not the nearest unlit Anchor ${near.r}'s voice`);
      }
    }
  }
});

test('lighting an Anchor removes its voice', () => {
  const a = H.anchorAt(0);
  const before = H.resonance(a.x, a.d, NONE);
  const after = H.resonance(a.x, a.d, [0]);
  assert.equal(before, 1, `unlit, standing on it, reads ${before}`);
  assert.ok(after < before, 'lighting it did not quieten it');
  /* Not asserted as exactly 0: another Anchor may be within reach, and if it is,
     the correct reading is that one's voice. What must be true is that Anchor 0
     is no longer the reason for the number. */
  const others = H.nearestUnlit(a.x, a.d, [0]);
  if (others === null) assert.equal(after, 0);
  else assert.ok(Math.abs(after - H.callFrom(a.x, a.d, others.r)) < 1e-9,
    'with Anchor 0 lit the reading is not the next nearest unlit one');
});

test('with all nine lit the instrument is silent everywhere', () => {
  /* Swept rather than spot-checked, because "silent" is the claim and one sample
     cannot support it. It is also the state the instrument stops meaning
     anything in, and one that keeps twitching after the campaign is over is
     worse than one that goes quiet. */
  for (let x = 0; x < H.W; x += 3) {
    for (let d = 0; d < H.WORLD_DEPTH; d += 7) {
      assert.equal(H.resonance(x, d, ALL), 0,
        `the campaign is over and the instrument still reads at ${x},${d}`);
    }
  }
  assert.equal(H.nearestUnlit(0, 0, ALL), null, 'nearestUnlit still names one');
});

test('the reading is pure: the same question twice gives the same answer', () => {
  /* Cheap, and it is the property that lets the renderer call this per frame
     without caching and lets a golden test trust it. */
  const a = H.anchorAt(2);
  for (let i = 0; i < 5; i++) {
    assert.equal(H.resonance(a.x + 3, a.d - 5, [1]), H.resonance(a.x + 3, a.d - 5, [1]));
  }
});

/* ---------- the guard against a check that inspects nothing ---------- */

test('the sweep above actually found Anchors to be quiet about', () => {
  /* INDEX.md rule 11 and the doctor's own rule: a check that passes because
     nothing happened is the failure mode. If ANCHOR_COUNT were ever 0, or
     anchorAt started returning points outside the world, every "is silent"
     assertion above would pass while proving nothing. */
  assert.equal(H.ANCHOR_COUNT, 9);
  let audible = 0;
  for (let x = 0; x < H.W; x += 3) {
    for (let d = 0; d < H.WORLD_DEPTH; d += 7) {
      if (H.resonance(x, d, NONE) > 0) audible++;
    }
  }
  assert.ok(audible > 40,
    `only ${audible} sampled points can hear anything with nothing lit, so the silence tests prove nothing`);
});
