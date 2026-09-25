/* The campaign probe, pinned (round seventeen, AA).

   `tools/campaign-model.mjs` plays the ladder from nothing on the pure layer
   and is the table every later retune argues against. Two things about it
   must never quietly stop being true: it may not fly through a barrier the
   game has not opened, and it must still get to the end - a probe that stalls
   is reporting on its own policy, not on the game, and the table it prints
   would be a number about nothing. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';
import { makeCampaign } from '../tools/campaign-model.mjs';

const H = await loadPure();
const c = makeCampaign(H);

test('the probe cannot pass a closed barrier', () => {
  c.reset();
  const x = H.coreColumn(0) + 3, gd = H.gateDepth(0);
  assert.ok(c.wall(x, gd), 'the barrier row should be a wall before its core breaks');
  const trip = c.price(x, gd + 4, false);
  assert.equal(trip.ok, false, 'a trip below a closed barrier was priced as possible');
  H.openGate(H.g.ground.gates, 0);
  assert.equal(c.wall(x, gd), false, 'an opened barrier should no longer be a wall');
});

test('the probe plays the whole ladder to the Vault, one row per tier', () => {
  const r = c.play();
  assert.ok(r.won, 'the probe stalled: ' + JSON.stringify(r.log.slice(-3)));
  assert.equal(r.gates.length, H.GATE_COUNT);
  assert.equal(r.tiers.length, H.GATE_COUNT + 1);
  for (const t of r.tiers) assert.ok(t.minutes > 0 && t.runs > 0, 'tier ' + t.tier + ' took no time');
});
