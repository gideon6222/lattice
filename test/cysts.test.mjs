/* Cysts: sealed air in dense rock, tier 2 only. Round seventeen, AQ.

   The receipt Fable asked for: every cyst is fully enclosed, holds a cache,
   and there are six to eight of them. And the property that makes them legal
   in this world: they are a function of the seed, never of a save. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

test('six to eight cysts, all in tier 2, each sealed all round and holding a cache', () => {
  H.g.dug = new Set();
  const cysts = H.cystsOnWorld();
  assert.ok(cysts.length >= 6 && cysts.length <= 8, cysts.length + ' cysts');
  for (const c of cysts) {
    assert.ok(c.d0 > H.gateDepth(0) && c.d0 + H.CYST_H - 1 < H.gateDepth(1), 'a cyst outside tier 2 at ' + c.d0);
    let caches = 0, open = 0;
    for (let dx = 0; dx < H.CYST_W; dx++) {
      for (let dd = 0; dd < H.CYST_H; dd++) {
        const b = H.blockAt(c.x0 + dx, c.d0 + dd);
        const edge = dx === 0 || dd === 0 || dx === H.CYST_W - 1 || dd === H.CYST_H - 1;
        if (edge) assert.equal(b && b.id, 'cystshell', 'a gap in the shell at ' + (c.x0 + dx) + ',' + (c.d0 + dd));
        else if (!b) open++;
        else if (b.cache) caches++;
      }
    }
    assert.equal(caches, 1, 'a cyst without its cache');
    assert.ok(open >= 3, 'a cyst with no air in it');
    if (c.key) assert.ok(H.blockAt(c.x0 + 3, c.d0 + 2)?.key, 'a cyst built round a key has no key in it');
  }
  assert.ok(cysts.filter((c) => c.key).length >= 3, 'fewer than three cysts carry a key');
});

test('the shell is four times the rock around it, cut stone, and a thing Sink can pass', () => {
  const c = H.cystsOnWorld()[0];
  const b = H.blockAt(c.x0, c.d0);
  const band = H.baseRock(c.d0, 0, c.x0);
  assert.ok(b.hard >= band.hard * H.CYST_HARD * 0.99, 'the shell is not dense');
  assert.ok(Number.isFinite(b.hard), 'the shell is uncuttable, so drilling is not a way in');
  assert.equal(b.spoil, true);
  assert.equal(b.wt, 0);
});

test('where the cysts are is the seed, not the save', () => {
  const before = JSON.stringify(H.cystsOnWorld());
  H.resetCysts();
  const c = JSON.parse(before)[0];
  /* Somebody has dug straight into where the first cyst would go, and the
     plan is rebuilt after it: it must come out the same. */
  H.g.dug = new Set([c.x0 + ',' + c.d0, (c.x0 + 1) + ',' + (c.d0 + 1)]);
  assert.equal(JSON.stringify(H.cystsOnWorld()), before);
  H.g.dug = new Set();
});

test("tier 2 has its own vein room", () => {
  const rooms = H.vaultPlan().filter((p) => p.vault.id === 'vein-room' && p.d > H.gateDepth(0) && p.d < H.gateDepth(1));
  assert.ok(rooms.length >= 1, 'tier 2 has no vein room');
});
