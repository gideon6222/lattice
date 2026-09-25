/* Minerals are ingredients. Round seventeen, AK.

   His ask, 2026-09-25: *"I want it to be rebalanced, so it feels like they are
   key ingredients you are trying to find."* The first rarity pass (X1-X4) did
   not land, and the census found why: selling banked the ore as well as paying
   for it, geodes nobody asked for carried the economy, caches handed out more
   of the rare minerals than the rock held, and recipes wanted copper by the
   fifty. These pin the shape that answers it, not the tuned numbers. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

/* Everything the whole tree asks for, key by key: bands and capstones. */
function asks() {
  const out = {};
  for (const u of H.UPGRADES) {
    for (let l = 0; l < u.max; l++) {
      for (const m of [H.matCost(u, l), H.capstoneCost(u, l)]) {
        if (m) out[m.id] = (out[m.id] || 0) + m.need;
      }
    }
  }
  return out;
}

/* What the rock holds of each key, counted cell by cell with the shipping
   generator. Veins and all. */
function supply() {
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.ground = H.newGround();
  const out = {};
  for (let d = 0; d < H.WORLD_DEPTH; d++) {
    for (let x = 0; x < H.W; x++) {
      const b = H.blockAt(x, d);
      if (b && H.isKey(b.id)) out[b.id] = (out[b.id] || 0) + 1;
    }
  }
  return out;
}

test('every key is asked for, and nothing that is not a key is', () => {
  const a = asks();
  for (const k of H.KEY_ORES) assert.ok(a[k] > 0, `${k} is a key that nothing asks for - a mineral with no use`);
  for (const id of Object.keys(a)) assert.ok(H.isKey(id), `${id} is asked for but is money, not a key`);
});

test('the rock holds well over what the tree asks for, of every key', () => {
  /* 2.5x, so a key is a hunt and never a wall: most of it is still out there
     when you need it, and a player who misses a pocket can find another. */
  const a = asks(), s = supply();
  for (const k of H.KEY_ORES) {
    assert.ok((s[k] || 0) >= a[k] * 2.5,
      `${k}: the rock holds ${s[k] || 0} and the tree asks for ${a[k]} - under 2.5x, so it is a wall rather than a hunt`);
  }
});

test('a key is never sold and never handed out by a cache', () => {
  for (const k of H.KEY_ORES) {
    H.g.cargo = { [k]: 5 };
    assert.equal(H.haulValue(), 0, `${k} in the hold is worth credits at the pad, so it is money again`);
  }
  H.g.cargo = {};
  H.setWorld(0);
  H.g.foundKit = H.SUPPLIES.map((s) => s.key);
  let caches = 0;
  for (let d = 0; d < H.WORLD_DEPTH; d++) {
    for (let x = 0; x < H.W; x++) {
      const b = H.blockAt(x, d);
      if (!b || !b.cache) continue;
      caches++;
      const p = H.cachePrize(x, d);
      assert.ok(!(p.kind === 'mineral' && H.isKey(p.id)), `the cache at ${x},${d} gives ${p.n} ${p.id}`);
    }
  }
  assert.ok(caches > 20, 'no caches found, so this checked nothing');
});

test('the first band of every line is credits only, and a capstone asks for one key', () => {
  for (const u of H.UPGRADES) {
    for (let l = 0; l < u.max; l++) {
      if (H.keyBand(u, l + 1) === 0) assert.equal(H.matCost(u, l), null, `${u.key} level ${l + 1} asks for a key in the first band`);
      if (H.capstoneCost(u, l)) assert.equal(H.matCost(u, l), null, `${u.key} level ${l + 1} asks for two keys at once`);
    }
  }
});
