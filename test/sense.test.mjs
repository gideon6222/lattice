/* The Sensors line hears keys. Round seventeen, AM.

   It names a key pocket within range and nothing more: no cell, no bearing.
   That is the same fence the Lattice Receiver keeps for the Anchors, and the
   research's own line about Terraria's Metal Detector - it names what is near
   and leaves the dig to you. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

test('a key pocket in range is named, one out of range is not, and a dug one is silent', () => {
  const pk = H.keyPockets(0).pockets[0];
  const [x, d] = pk.cells[0];
  const none = () => false;
  assert.equal(H.keyNear(x, d - 2, 3, none), pk.id);
  assert.notEqual(H.keyNear(x, d - 40, 3, none), pk.id, 'a pocket forty metres off was heard at a range of three');
  assert.equal(H.keyNear(x, d - 2, 3, (cx, cd) => cx === x && cd === d) === pk.id, false,
    'a pocket already cut out is still heard');
});

test('it says a name and never a place', () => {
  const pk = H.keyPockets(0).pockets[0];
  const [x, d] = pk.cells[0];
  const got = H.keyNear(x + 1, d, 4, () => false);
  assert.equal(typeof got, 'string', 'the sensors answered with something other than a name');
});

test('the scanner and the survey both widen what the sensors hear', () => {
  assert.ok(H.senseRange(0, 0) >= 1.5, 'with nothing fitted the sensors hear nothing at all');
  assert.ok(H.senseRange(5, 0) > H.senseRange(0, 0));
  assert.ok(H.senseRange(0, 3) > H.senseRange(0, 0));
  assert.ok(H.senseRange(9, 5) < 20, 'fully fitted, the sensors hear most of the screen - that is a map, not a hunt');
});
