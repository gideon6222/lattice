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
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { loadPure, REPO } from './harness.mjs';

const H = await loadPure();

function walkSrc(dir = join(REPO, 'src')) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walkSrc(p));
    else if (e.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

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

/* ---------- Y3: the core breaks and the forcefield drops ----------

   His brief: *"Once you destroy it, the forcefield releases and you can go
   further down."* The receipt the plan names for this is the Y1 test run again
   after each core is broken, which is what the first test below is: the same
   flood fill, driven by breaking cores rather than by handing it a list. */

test('breaking each core in turn walks the world open, one tier at a time', () => {
  /* The whole ladder, played in order, with nothing set by hand except the
     Anchors. `deepestReach` re-seeds the world every call, so the gate list
     has to be carried forward - which is the point: it is the SAVE that opens
     the world, and `openGate` is the only thing that writes it. */
  const open = [];
  assert.equal(deepestReach(open), H.gateDepth(0) - 1, 'the world starts shut at the first gate');

  for (let t = 0; t < H.GATE_COUNT; t++) {
    const cx = H.coreColumn(t), cd = H.gateDepth(t);
    const lit = H.gateAnchors(t);

    assert.equal(H.coreOpens(cx, cd, [], open), -1,
      `tier ${t}'s core answered before its Anchors were broken`);
    assert.equal(H.coreOpens(cx, cd, lit, open), t,
      `tier ${t}'s core does not open tier ${t}`);
    assert.equal(H.openGate(open, t), true, `tier ${t}'s gate refused to open`);

    const want = t + 1 < H.GATE_COUNT ? H.gateDepth(t + 1) - 1 : null;
    const got = deepestReach(open);
    if (want !== null) {
      assert.equal(got, want,
        `after breaking core ${t} the ship reaches ${got} m, not ${want}`);
    } else {
      assert.ok(got >= H.VAULT_CORE_D,
        `after the last core the ship stops at ${got} m, short of the Vault at ${H.VAULT_CORE_D}`);
    }
  }
  assert.deepEqual(open, [0, 1, 2]);
});

test('only the core opens a gate, and only while it is a core', () => {
  /* The bug: asking `gateAtDepth` at the dig site instead of asking what the
     CELL is. That version opens the tier for any cell on the barrier row -
     every one of which is uncuttable today, and every one of which becomes a
     key the day somebody adds a way through a wall. The cell and the
     consequence come off one question so they cannot drift. */
  for (let t = 0; t < H.GATE_COUNT; t++) {
    const cx = H.coreColumn(t), cd = H.gateDepth(t);
    const lit = H.gateAnchors(t);

    for (let x = 0; x < H.W; x++) {
      if (x === cx) continue;
      assert.equal(H.coreOpens(x, cd, lit, []), -1,
        `a plain barrier cell at column ${x} opens tier ${t}`);
    }
    assert.equal(H.coreOpens(cx, cd - 1, lit, []), -1, 'the cell above the barrier opens it');
    assert.equal(H.coreOpens(cx, cd + 1, lit, []), -1, 'the cell below the barrier opens it');
    /* And a core already spent is not a second key. */
    assert.equal(H.coreOpens(cx, cd, lit, [t]), -1, `tier ${t}'s spent core opens the gate again`);
  }
});

test('a gate opens once, for ever, and nothing else can be opened', () => {
  /* Idempotent by CHECKING rather than by tidying up afterwards. This list is
     the record of an irreversible event, so a second copy of tier 1 in it is
     not a cosmetic duplicate - it is the save claiming the thing happened
     twice, which is what the ability grant in Y4 will be counting. */
  const open = [];
  assert.equal(H.openGate(open, 1), true);
  assert.equal(H.openGate(open, 1), false, 'the same gate opened twice');
  assert.deepEqual(open, [1]);

  assert.equal(H.openGate(open, -1), false);
  assert.equal(H.openGate(open, H.GATE_COUNT), false, 'a gate below the bottom row opened');
  assert.deepEqual(open, [1], 'a refused open still wrote to the save');
});

test('nothing in the game can shut a gate that is open', () => {
  /* His brief asks for one direction only, and the one thing in this game that
     already takes ground back - a collapse - is safe precisely because it takes
     a REGION and never a rung of the ladder. There is no runtime state that
     could catch a re-lock, because a re-lock would BE the state, so this reads
     the source: `gates` may be written by the three writers named below and by
     nothing else.

     Rule 11: put `g.ground.gates.pop()` anywhere in src and it fails naming the
     file. */
  const ALLOWED = new Set(['sim/gate.ts', 'sim/unrest.ts']);
  const bad = [];
  for (const file of walkSrc()) {
    const rel = relative(join(REPO, 'src'), file).replace(/\\/g, '/');
    if (ALLOWED.has(rel)) continue;
    const txt = readFileSync(file, 'utf8');
    /* Any mutation of the list, not just the removing ones. Writing to it at
       all outside the two owners is the trend worth stopping - the removal is
       only the worst way it goes wrong.

       READS are fine and there are several: `gates.length` is how the HUD and
       the Ballast's own clock ask whether the planet has started to go. The
       first version of this pattern had a bare `length` in the alternation and
       failed on exactly those, which would have taught the next session to add
       `ui.ts` to the allow-list and lose the check. `length` counts only when
       it is assigned to, because `gates.length = 0` is a truncation. */
    const m = txt.match(/\.gates\s*(?:=[^=]|\.(?:pop|shift|splice|push)\s*\(|\.length\s*=[^=]|\[[^\]]*\]\s*=[^=])/g);
    if (m) bad.push(`${rel}: ${m.join(', ')}`);
  }
  assert.deepEqual(bad, [],
    'these files write g.ground.gates. Only openGate() in sim/gate.ts and the save ' +
    'filter in sim/unrest.ts may, because the list is the record of three irreversible events.');
});

/* ---------- Y8: at every tier gate, a shop and a save point ----------

   His brief: "Each barrier is already a place to stop." The station is the
   spent core's cell - no new world, one per tier, by construction of
   `coreColumn`/`gateDepth`. The receipt his milestone names: a test that each
   tier has exactly one, at its own gate. */

test('a gate has no station until it is open', () => {
  for (let t = 0; t < H.GATE_COUNT; t++) {
    const cx = H.coreColumn(t), cd = H.gateDepth(t);
    assert.equal(H.gateNear(cx, cd, []), -1,
      `tier ${t}'s core is a station before its own gate has opened`);
  }
});

test('each tier has exactly one station, at its own gate', () => {
  const open = Array.from({ length: H.GATE_COUNT }, (_, i) => i);
  for (let t = 0; t < H.GATE_COUNT; t++) {
    const cx = H.coreColumn(t), cd = H.gateDepth(t);
    assert.equal(H.gateNear(cx, cd, open), t, `tier ${t}'s own cell is not its station`);
    /* Reachable from all four sides, the same footprint an Anchor has - it is
       a place you arrive at, not a single pixel you must land on exactly. */
    for (const [dx, dd] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      assert.equal(H.gateNear(cx + dx, cd + dd, open), t,
        `tier ${t}'s station cannot be reached from (${dx}, ${dd})`);
    }
    /* And not further than that - a station you can shop from anywhere in the
       tier is not "the one cell every player passes through", it is the whole
       tier, which is what the milestone's "exactly one" rules out. */
    assert.equal(H.gateNear(cx + 2, cd, open), -1, 'a cell two away is still the station');
    assert.equal(H.gateNear(cx + 1, cd + 1, open), -1, 'a diagonal cell is still the station');
  }
});

test('gateHere reads the ship\'s own position, at whichever gates are open', () => {
  fresh([0, 1, 2]);
  const cx = H.coreColumn(1), cd = H.gateDepth(1);
  H.g.px = cx; H.g.pd = cd;
  assert.equal(H.gateHere(), 1, 'standing at tier 1\'s station did not answer tier 1');
  H.g.px = cx + 1; H.g.pd = cd;
  assert.equal(H.gateHere(), 1, 'standing next to tier 1\'s station did not answer tier 1');
  H.g.px = 3; H.g.pd = 3;
  assert.equal(H.gateHere(), -1, 'the ship is nowhere near a gate and gateHere answered anyway');
});

test('the shop opens at a gate\'s station without needing the pad', () => {
  fresh([1]);
  H.g.px = H.coreColumn(1); H.g.pd = H.gateDepth(1);
  assert.equal(H.docked(), false, 'a gate station is not the pad');
  assert.equal(H.shopHere(), true, 'the shop refused to open at an open gate\'s station');
});
