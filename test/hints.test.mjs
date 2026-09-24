/* Y15's own receipt: "a test that the number of hints delivered is monotonic
   in tiers opened, and that none of them fires before the first core." */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

test('no hint fires before the first core', () => {
  assert.deepEqual(H.hintsFor(0), []);
  assert.equal(H.hintAt(0), null);
});

test('the number of hints delivered is monotonic in tiers opened', () => {
  let last = -1;
  for (let tiers = 0; tiers <= H.GATE_COUNT; tiers++) {
    const got = H.hintsFor(tiers);
    assert.ok(got.length >= last, `tier ${tiers} delivered fewer hints than tier ${tiers - 1}`);
    last = got.length;
  }
});

test('a later tier is a strict superset of an earlier one, not a different set', () => {
  for (let tiers = 1; tiers <= H.GATE_COUNT; tiers++) {
    const prev = H.hintsFor(tiers - 1);
    const cur = H.hintsFor(tiers);
    assert.deepEqual(cur.slice(0, prev.length), prev,
      `hintsFor(${tiers}) did not extend hintsFor(${tiers - 1})`);
  }
});

test('every gate-breaking tier has exactly one hint due at it', () => {
  for (let tiers = 1; tiers <= H.GATE_COUNT; tiers++) {
    const hint = H.hintAt(tiers);
    assert.equal(typeof hint, 'string');
    assert.ok(hint.length > 0, `tier ${tiers} delivered an empty hint`);
  }
});

test('there is exactly one hint per gate-breaking moment, no more and no less', () => {
  assert.equal(H.HINTS.length, H.GATE_COUNT);
});

test('past the last gate, the count holds rather than growing or throwing', () => {
  assert.deepEqual(H.hintsFor(H.GATE_COUNT + 3), H.HINTS);
  assert.equal(H.hintAt(H.GATE_COUNT + 3), H.HINTS[H.HINTS.length - 1]);
});
