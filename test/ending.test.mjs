/* The ending: the light leaves. Round seventeen, AH.

   The milestone's order is the design, so the test walks the timeline and
   asserts the order: the lights leave their scars and reach the center, the
   dark comes up from below to the pad, the sky turns, and only then the card.
   "A short card follows, never before." */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();
const at = (t) => H.endingAt(t);

test('the card comes last, after the sky has turned', () => {
  for (let t = 0; t < H.END_CARD_AT; t += 0.1) assert.equal(at(t).card, false, 'the card is up at ' + t.toFixed(1) + ' s');
  assert.equal(at(H.END_CARD_AT).card, true);
  assert.ok(at(H.END_CARD_AT).sky > 0.99, 'the card went up over a sky that had not turned');
});

test('the lights gather before the dark rises, and the dark rises before the sky turns', () => {
  const gathered = H.END_GATHER;
  assert.ok(at(gathered).gather > 0.99);
  assert.equal(at(gathered - 0.01).dark, 0, 'the world went dark before the lights had arrived');
  let lastFront = Infinity, sawSkyDuringRise = false;
  for (let t = gathered + H.END_HOLD + 0.01; t < gathered + H.END_HOLD + H.END_RISE; t += 0.1) {
    const f = at(t);
    assert.ok(f.front <= lastFront, 'the dark went back down at ' + t.toFixed(1));
    lastFront = f.front;
    if (f.sky > 0.2 && t < gathered + H.END_HOLD + H.END_RISE * 0.7) sawSkyDuringRise = true;
  }
  assert.equal(sawSkyDuringRise, false, 'the sky turned before the dark had reached the pad');
  assert.ok(at(H.END_CARD_AT).front < 0, 'the dark never reached the surface');
});

test('each released light starts at its own scar and ends at the center', () => {
  for (let t = 0; t < H.GATE_COUNT; t++) {
    const a = H.moteAt(0, t), b = H.moteAt(H.END_GATHER, t);
    assert.equal(a.d, H.gateDepth(t));
    assert.equal(Math.round(a.x), H.coreColumn(t));
    assert.equal(b.d, H.VAULT_CORE_D);
    assert.ok(Math.abs(b.x - H.VAULT_CORE_X) < 1e-6);
  }
});

test('the cut to the pad goes through black, on the timeline', () => {
  const cutAt = H.END_GATHER + H.END_HOLD;
  assert.ok(at(cutAt).black > 0.95, 'the cut is not through black');
  assert.equal(at(cutAt - 1).black, 0);
  assert.equal(at(cutAt + 1.5).black, 0);
  assert.equal(at(cutAt - 0.01).cut, false);
  assert.equal(at(cutAt + 0.01).cut, true);
  assert.ok(at(cutAt + 0.01).eyeD < 0, 'the camera did not go to the pad');
});
