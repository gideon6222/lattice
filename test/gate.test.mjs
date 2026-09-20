/* The tier gates. Round fifteen, Y1.

   His brief, 2026-09-19: *"Have a certain number of anchors that need to be
   released before you can get past a certain depth ... It controls a forcefield
   or something similar that blocks your path. Once you destroy it, the
   forcefield releases and you can go further down."*

   **The geometry was not invented for this.** The world has been four region
   rows of 113 m since round eight, with three Anchors in each of the top three
   rows and none in the deepest, where the Vault sits at 405. So the gates fall
   at 113, 226 and 339, each opened by its own row's three Anchors, and the last
   one is the Vault's door - which is what he confirmed when asked.

   The receipt his brief asks for is a test that walks the ship DOWN and finds
   it stopped, because "the forcefield blocks your path" is a claim about
   travel and not about a block's id. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

function fresh(gates = []) {
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.ground = H.newGround();
  H.g.ground.gates = gates.slice();
}

/* The deepest metre the ship can get to, ANYWHERE, if it digs everything it is
   able to dig.

   A flood fill and not a walk down one column, and the first version was the
   walk - which failed at 94 m in column 10 because Verdax's unlit Anchor is
   also `hard: Infinity`. That was the test being wrong rather than the world:
   an Anchor is uncuttable and you fly around it, so "this column is blocked" is
   not "the world is blocked". The claim his brief makes is about the PLANET -
   the forcefield blocks your path, with no way round - and the only honest way
   to ask that is to try every way round. */
function deepestReach(gates) {
  fresh(gates);
  const open = (x, d) => {
    if (x < 0 || x >= H.W || d < 0) return false;
    const b = H.blockAt(x, d);
    return !b || b.ghost || b.hard !== Infinity;
  };
  const seen = new Set(['30,0']);
  let queue = [[30, 0]];
  let deepest = 0;
  while (queue.length) {
    const next = [];
    for (const [x, d] of queue) {
      if (d > deepest) deepest = d;
      for (const [nx, nd] of [[x + 1, d], [x - 1, d], [x, d + 1], [x, d - 1]]) {
        const k = nx + ',' + nd;
        if (seen.has(k) || !open(nx, nd)) continue;
        seen.add(k);
        next.push([nx, nd]);
      }
    }
    queue = next;
  }
  return deepest;
}

test('with no gate open, every column of the world stops at the first barrier', () => {
  /* Every column, not a sample: a forcefield with one hole in it is not one,
     and a hole is exactly what a room or a cave stamped over the gate depth
     would make. */
  const want = H.gateDepth(0) - 1;
  const got = deepestReach([]);
  assert.equal(got, want,
    `the ship can reach ${got} m with no gate open, not ${want} - there is a way round the barrier`);
});

test('opening a gate opens it across the whole world, and only that one', () => {
  assert.equal(deepestReach([0]), H.gateDepth(1) - 1, 'after the first gate');
  assert.equal(deepestReach([0, 1]), H.gateDepth(2) - 1, 'after the second');
});

test('with every gate open the world is diggable to the floor', () => {
  /* The bedrock is Infinity too, so "the floor" is where this stops. */
  const got = deepestReach([0, 1, 2]);
  assert.ok(got >= H.VAULT_CORE_D,
    `the ship stops at ${got} m with every gate open, short of the Vault at ${H.VAULT_CORE_D}`);
});

test('a barrier can never be cut, by anything', () => {
  /* Not "very hard" - Infinity. The lode taught this game that a number a
     player can grind past is a number they will grind past, and the whole point
     of the gate is that the Anchors are the only way through it. */
  fresh([]);
  const b = H.blockAt(30, H.gateDepth(0));
  assert.equal(b.hard, Infinity, 'the barrier is merely hard, so a big enough drill opens the world');
  assert.equal(b.spoil, true, 'cutting a barrier would put one in the hold');
  assert.ok(!b.ghost, 'the barrier is passable, which is the one thing it must not be');
});

test('the gates are where the region rows already were', () => {
  /* Derived and not placed. If somebody re-cuts the region grid, the gates
     follow it rather than drifting out of step with the Anchors that open
     them - which would strand a tier whose Anchors sit below its own gate. */
  assert.equal(H.GATE_COUNT, H.REGION_ROWS - 1, 'there is a gate under the bottom row');
  for (let t = 0; t < H.GATE_COUNT; t++) {
    const d = H.gateDepth(t);
    assert.equal(H.depthTier(d - 1), t, `the metre above gate ${t} is not in tier ${t}`);
    assert.equal(H.depthTier(d), t + 1, `the metre at gate ${t} is not in the tier below it`);
  }
});

test('every Anchor that opens a gate is ABOVE that gate', () => {
  /* The bug this is here for: an Anchor placed below its own gate is a tier
     that can never be opened, and the save is unfinishable. It cannot happen
     while the rows line up, and that is exactly the sort of thing that stops
     being true when somebody moves a constant. */
  for (let t = 0; t < H.GATE_COUNT; t++) {
    for (const r of H.gateAnchors(t)) {
      const a = H.anchorAt(r);
      assert.ok(a.d < H.gateDepth(t),
        `${H.regionName(r)}'s Anchor is at ${a.d} m, below the gate at ${H.gateDepth(t)} that it opens`);
    }
  }
});

test('a gate needs all of its own Anchors and none of anybody else\'s', () => {
  assert.equal(H.gateReady(0, []), false);
  assert.equal(H.gateReady(0, [0, 1]), false, 'two of three opened a gate');
  assert.equal(H.gateReady(0, [0, 1, 2]), true);
  assert.equal(H.gateReady(1, [0, 1, 2]), false, 'the first tier opened the second tier\'s gate');
  assert.equal(H.gateReady(2, [6, 7, 8]), true);
});

test('the deepest gate is the Vault\'s door', () => {
  /* His answer of 2026-09-19 to the one structural question the brief left
     open. The Vault sits in the bottom row, which has no Anchors of its own, so
     the last gate is the threshold of its tier - the geometry already said so
     and this asserts the two have not drifted apart. */
  const last = H.GATE_COUNT - 1;
  assert.ok(H.VAULT_CORE_D > H.gateDepth(last),
    `the Vault at ${H.VAULT_CORE_D} m is not behind the last gate at ${H.gateDepth(last)}`);
  assert.equal(H.depthTier(H.VAULT_CORE_D), H.REGION_ROWS - 1,
    'the Vault is not in the bottom tier any more');
  for (let r = 0; r < H.ANCHOR_COUNT; r++) {
    assert.ok(H.anchorAt(r).d < H.gateDepth(last),
      `${H.regionName(r)}'s Anchor is behind the Vault's own door`);
  }
});

test('a save cannot carry a gate that does not exist', () => {
  const loaded = H.loadGround({ gates: [0, 99, -1, 1, 1, 'x'] });
  assert.deepEqual(loaded.gates, [0, 1],
    'a hand-edited or corrupt save can open a gate the world does not have');
});

/* ---------- Y2: the dark-energy core ---------- */

test('the barrier grows a door only when the tier\'s Anchors are all broken', () => {
  /* His words: "Once the anchors are broken, an unbreakable block will open up
     that looks inviting but full of dark energy." The whole beat is the
     CHANGE - a wall you have met and could not pass becomes a wall with one
     cuttable cell in it. */
  for (let t = 0; t < H.GATE_COUNT; t++) {
    const cx = H.coreColumn(t), cd = H.gateDepth(t);
    const need = H.gateAnchors(t);

    fresh([]);
    H.g.ground.lit = need.slice(0, need.length - 1);
    assert.equal(H.blockAt(cx, cd).id, 'gate',
      `tier ${t}'s core appeared with ${need.length - 1} of ${need.length} Anchors`);

    fresh([]);
    H.g.ground.lit = need.slice();
    const core = H.blockAt(cx, cd);
    assert.equal(core.id, 'darkcore', `tier ${t}'s core did not appear with every Anchor broken`);
    assert.ok(Number.isFinite(core.hard), 'the core cannot be cut, so the tier cannot be opened');
    assert.ok(core.hard > 0);
  }
});

test('the core is one cell, and the rest of the barrier stays shut', () => {
  /* The failure this catches is the barrier becoming cuttable everywhere the
     moment the Anchors are done, which would make the core decorative. */
  for (let t = 0; t < H.GATE_COUNT; t++) {
    fresh([]);
    H.g.ground.lit = H.gateAnchors(t).slice();
    const cx = H.coreColumn(t), cd = H.gateDepth(t);
    let cuttable = 0;
    for (let x = 0; x < H.W; x++) {
      const b = H.blockAt(x, cd);
      if (b && Number.isFinite(b.hard)) cuttable++;
    }
    assert.equal(cuttable, 1, `tier ${t}'s barrier has ${cuttable} cuttable cells, not one`);
    assert.equal(H.blockAt(cx, cd).id, 'darkcore');
  }
});

test('a released core stays for ever, lit, and is never in the way', () => {
  /* His ask: "the dark ominous feeling thing that breaks the barrier should be
     the thing that is permanent and stays lit."

     This is X6's `ghost` moved from the Anchor to the core - drawn, uncuttable,
     flown through. Uncuttable so it can never be tidied away; passable because
     it sits in the one cell every player of the tier below has to pass. */
  for (let t = 0; t < H.GATE_COUNT; t++) {
    fresh([t]);
    const b = H.blockAt(H.coreColumn(t), H.gateDepth(t));
    assert.equal(b.id, 'darkspent', `tier ${t}'s core vanished once the gate opened`);
    assert.equal(b.hard, Infinity, 'a released core can be drilled away');
    assert.ok(b.ghost, 'a released core is solid, so it plugs the doorway it just opened');
    assert.ok(b.glow > 0.9, 'a released core does not stay lit');
  }
});

test('the three cores are in three different places, and none at the edge', () => {
  const cols = [];
  for (let t = 0; t < H.GATE_COUNT; t++) cols.push(H.coreColumn(t));
  assert.equal(new Set(cols).size, cols.length, `the cores share a column: ${cols.join(', ')}`);
  for (const c of cols) {
    assert.ok(c >= 4 && c < H.W - 4, `a core sits at column ${c}, against the edge of the world`);
  }
});

test('breaking a tier\'s Anchors does not open anybody else\'s door', () => {
  fresh([]);
  H.g.ground.lit = H.gateAnchors(0).slice();
  for (let t = 1; t < H.GATE_COUNT; t++) {
    assert.equal(H.blockAt(H.coreColumn(t), H.gateDepth(t)).id, 'gate',
      `breaking tier 0's Anchors opened tier ${t}'s door`);
  }
});
