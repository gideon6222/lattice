/* The Anchors, and the rooms they are in.

   This is the first authored content in a world that has been entirely
   generated until now, and authored content fails differently: a generator
   fails by producing something wrong, and a stamp fails by producing something
   INCOMPLETE - half a room, a wall with nothing behind it, a door across the
   only way down.

   So the properties here are mostly about wholeness:

   1. every Anchor is inside its own region, room and all
   2. no room overlaps another, and none is clipped by the edge of the world
   3. every hall is actually sealed by its own walls - you break in
   4. a locked door never locks the planet: with no key at all, every depth is
      still reachable
   5. and the key is never behind the door it opens */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();
const VAULT = H.vaultCells();

/* ---------- where they are ---------- */

test('there are nine Anchors and none of them is in the deepest row', () => {
  assert.equal(H.ANCHOR_COUNT, 9);
  const band = H.WORLD_DEPTH / H.REGION_ROWS;
  for (let r = 0; r < H.ANCHOR_COUNT; r++) {
    const a = H.anchorAt(r);
    assert.ok(a.d < band * (H.REGION_ROWS - 1),
      `${H.regionName(r)}'s Anchor is at ${a.d} m, inside the row the Vault owns`);
  }
});

test('every Anchor hall is inside its own region, corner to corner', () => {
  /* The insets in anchorAt are a claim about how far a wandering region
     boundary can move, and "far enough" is exactly the sort of claim that is
     wrong by two. Checked at the room's corners, not at its centre - a centre
     that is inside proves nothing about a room eleven cells wide. */
  for (let r = 0; r < H.ANCHOR_COUNT; r++) {
    assert.ok(H.anchorInRegion(r),
      `${H.regionName(r)}'s Anchor hall crosses out of its own region`);
  }
});

test('the Anchors are spread across the planet, not stacked in a column', () => {
  /* "Spread wide as much as deep" is the design's own wording and the whole
     reason the world got to 61 columns. A set of Anchors that all sat near the
     pad would be the old game with extra steps. */
  const xs = [], ds = [];
  for (let r = 0; r < H.ANCHOR_COUNT; r++) {
    const a = H.anchorAt(r);
    xs.push(a.x); ds.push(a.d);
  }
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanD = Math.max(...ds) - Math.min(...ds);
  assert.ok(spanX > H.W * 0.5,
    `the Anchors span ${spanX} of ${H.W} columns - they are not spread wide`);
  assert.ok(spanD > H.WORLD_DEPTH * 0.4,
    `the Anchors span ${spanD} m of ${H.WORLD_DEPTH} - they are not spread deep`);
});

/* ---------- wholeness ---------- */

test('no room is clipped by the edge of the world', () => {
  /* A clipped room is a wall with no room behind it, which is the worst thing
     this system can produce: the player cuts through worked stone and finds
     rock. Checked as "every stamped cell is in bounds", which the stamp
     enforces by dropping cells - so this is really checking that no room was
     PLACED anywhere it would have to be dropped from. */
  for (let r = 0; r < H.ANCHOR_COUNT; r++) {
    const a = H.anchorAt(r);
    const half = (H.VAULT_W - 1) / 2;
    assert.ok(a.x - half >= 0 && a.x + half < H.W,
      `${H.regionName(r)}'s hall runs off the side of the world at x ${a.x}`);
    assert.ok(a.d - (H.VAULT_H - 1) / 2 >= 1,
      `${H.regionName(r)}'s hall runs into the sky at ${a.d} m`);
  }
  /* And every stamped cell really is inside the world. */
  for (const k of VAULT.keys()) {
    const i = k.indexOf(',');
    const x = +k.slice(0, i), d = +k.slice(i + 1);
    assert.ok(x >= 0 && x < H.W, `a room cell sits at column ${x}`);
    assert.ok(d >= 1 && d < H.WORLD_DEPTH, `a room cell sits at ${d} m`);
  }
});

test('every Anchor hall is shut, so getting in is always a decision', () => {
  /* The ritual the room exists for: break in, cross the room, cut the plinth.
     It only works if the room is actually enclosed - one gap in the wall and
     an ordinary shaft wanders in without the player noticing they arrived.

     Checked on the STAMPED world rather than on the template, because the
     stamp is where a room could lose a wall to a clip or to an overlap. */
  for (let r = 0; r < H.ANCHOR_COUNT; r++) {
    const a = H.anchorAt(r);
    const x0 = a.x - (H.VAULT_W - 1) / 2, d0 = a.d - (H.VAULT_H - 1) / 2;
    for (let dy = 0; dy < H.VAULT_H; dy++) {
      for (let dx = 0; dx < H.VAULT_W; dx++) {
        const x = x0 + dx, d = d0 + dy;
        if (VAULT.get(x + ',' + d) !== '.') continue;
        /* Air. Every one of its four neighbours has to be part of this room -
           air, a wall, the plinth, or the Anchor. A neighbour that is not
           stamped at all is a hole in the wall. */
        for (const n of [[x, d - 1], [x, d + 1], [x - 1, d], [x + 1, d]]) {
          assert.ok(VAULT.has(n[0] + ',' + n[1]),
            `${H.regionName(r)}'s hall is open to the rock at (${n[0]},${n[1]})`);
        }
      }
    }
  }
});

test('an Anchor can never be mined, and a lit one is never in the way', () => {
  /* Two halves, and the second one has now been solved twice.

     UNLIT it is uncuttable, and that is the ritual: you cannot mine your way
     to the objective, you fly to it. A block you can drill out is a pickup.

     LIT it must not be a PLUG, because three Anchors share each of the three
     columns they live in. Six of the nine were once unreachable by digging down
     their own column, each stopping a metre above the Anchor above it.

     **The first fix made a lit Anchor cuttable, and his playtest of 2026-09-19
     rejected it**: "make the anchor something physically located at that spot
     that you can't dig". A monument you are allowed to mine is not a monument.

     The property that fix was protecting was never HARDNESS, it was that the
     column stays passable - two different things that the old code had one knob
     for. So the Anchor is uncuttable for ever now and a lit one is `ghost`: the
     ship flies through it, `findRoute` counts it as open, and the light field
     stops treating the brightest object in the game as a wall.

     This test asserts the PROPERTY (never mineable, never a plug) rather than
     either mechanism, so the next person to solve the plug a third way does not
     have to rewrite it. */
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.ground = H.newGround();
  const a = H.anchorAt(0);
  const before = H.blockAt(a.x, a.d);
  assert.equal(before.id, 'anchor');
  assert.equal(before.hard, Infinity, 'an intact Anchor can be drilled out');
  assert.ok(!before.ghost, 'an intact Anchor can be flown through, so it is not an obstacle at all');

  H.lightAnchor(H.g.ground, 0);
  const after = H.blockAt(a.x, a.d);
  assert.equal(after.id, 'anchorbroken', 'a broken Anchor looks exactly like an intact one');
  assert.equal(after.hard, Infinity,
    'a broken Anchor can be drilled out, which is the thing he asked to stop');
  assert.ok(after.ghost,
    'a broken Anchor is uncuttable AND solid, which is the permanent plug all over again');
  /* Round fifteen, Y13 inverts the old assertion here, which was that breaking
     an Anchor made it BRIGHTER. The permanence moved to the dark core at his
     ask, and what is left at an Anchor is a dim violet remnant - so the one
     thing that must still hold is that the two states do not look alike. */
  assert.ok(after.glow < before.glow,
    'a broken Anchor is still the brightest thing in the hall, which is the core\'s job now');
  assert.notEqual(after.color, before.color, 'breaking an Anchor does not change how it reads');
  /* And it never enters the hold, whichever state it is in - see the sweep in
     `cut stone never enters the hold`. */
  assert.equal(after.spoil, true);
  H.g.ground = H.newGround();
});

/* ---------- the locked door ---------- */

test('sealed stone is shut without the laser and cuts with it', () => {
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.ground = H.newGround();
  const sealedRegion = [4, 6, 8].find((r) => H.anchorSealed(r));
  const a = H.anchorAt(sealedRegion);
  /* The top-left corner of the ring, which the template makes '=' . */
  let cell = null;
  for (const k of VAULT.keys()) {
    if (VAULT.get(k) !== '=') continue;
    const i = k.indexOf(',');
    const x = +k.slice(0, i), d = +k.slice(i + 1);
    if (Math.abs(x - a.x) <= 5 && Math.abs(d - a.d) <= 4) { cell = [x, d]; break; }
  }
  assert.ok(cell, 'no sealed stone anywhere near the sealed hall');

  const held = H.g.found.slice();
  H.g.found = [];
  const shut = H.blockAt(cell[0], cell[1]);
  assert.equal(shut.id, 'sealed');
  assert.equal(shut.hard, Infinity, 'sealed stone cuts without the key');

  H.g.found = ['laser'];
  const open = H.blockAt(cell[0], cell[1]);
  assert.ok(Number.isFinite(open.hard), 'sealed stone is still shut with the key in hand');
  assert.ok(open.hard > 20, `sealed stone drills at ${open.hard} even with the key - a door should stay a door`);
  H.g.found = held;
});

test('the first Anchor you can reach is never behind a door', () => {
  /* Two mutations passed before this existed - sealing every hall, and letting
     sealed stone into the ordinary hall's walls - and neither is a bug the
     other tests can see. They are both the same failure: the player meets the
     locked door BEFORE they have met the mechanic, and a door you cannot open
     is only a promise if you already know what doors are.

     So the shallowest Anchor in the world is always open, and an ordinary hall
     has no sealed stone in it anywhere. */
  let shallow = -1, best = Infinity;
  for (let r = 0; r < H.ANCHOR_COUNT; r++) {
    const a = H.anchorAt(r);
    if (a.d < best) { best = a.d; shallow = r; }
  }
  assert.equal(H.anchorSealed(shallow), false,
    `the shallowest Anchor (${H.regionName(shallow)}, ${best} m) is sealed - the first one you meet cannot be the locked one`);

  let open = 0;
  for (let r = 0; r < H.ANCHOR_COUNT; r++) if (!H.anchorSealed(r)) open++;
  assert.ok(open >= H.ANCHOR_COUNT / 2,
    `${open} of ${H.ANCHOR_COUNT} Anchors are open - too much of the game is behind one device`);

  /* And "sealed" has to mean something: an ordinary hall with sealed stone in
     its wall is a door the player cannot tell from a wall. */
  for (let r = 0; r < H.ANCHOR_COUNT; r++) {
    if (H.anchorSealed(r)) continue;
    const v = H.anchorVault(r);
    for (const row of v.rows) {
      assert.equal(row.indexOf('='), -1,
        `${H.regionName(r)}'s hall is open but has sealed stone in its wall`);
    }
  }
});

test('a locked door never locks the planet', () => {
  /* The one that matters. Sealed halls are placed by hand, and a hand can put
     one across the only way down - at which point a first-time player with no
     laser has a world that ends at 131 metres and no way to be told why.

     So: with NOTHING found, flood the world through everything that is not
     unbreakable and check the bottom is still reachable. This is a claim about
     the whole planet and it is checked over the whole planet.

     **Round fifteen narrowed the claim and did not weaken it.** The tier gates
     deliberately DO lock the planet - that is Y1's whole job - so "every depth
     is reachable with nothing found" stopped being true by design. What still
     has to be true, and is the same protection under the new structure, is that
     nothing is ever locked behind ITSELF: every gate is open here, and the test
     below it checks each tier's own Anchors are reachable without passing the
     gate they open. Together those two are the old claim, split at the seam the
     gates put in the world. */
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.ground = H.newGround();
  H.g.ground.gates = [];
  for (let t = 0; t < H.GATE_COUNT; t++) H.g.ground.gates.push(t);
  const held = H.g.found.slice();
  H.g.found = [];

  const floor = H.WORLD_DEPTH - 1;
  const seen = new Set(['30,0']);
  let queue = [[30, 0]];
  let deepest = 0;
  while (queue.length) {
    const next = [];
    for (const c of queue) {
      for (const n of [[c[0], c[1] - 1], [c[0], c[1] + 1], [c[0] - 1, c[1]], [c[0] + 1, c[1]]]) {
        const x = n[0], d = n[1];
        if (x < 0 || x >= H.W || d < 0 || d > floor) continue;
        const k = x + ',' + d;
        if (seen.has(k)) continue;
        const b = H.blockAt(x, d);
        /* Passable means "a drill could get through it", so empty or finite. */
        if (b && !Number.isFinite(b.hard)) continue;
        seen.add(k);
        if (d > deepest) deepest = d;
        next.push(n);
      }
    }
    queue = next;
  }
  H.g.found = held;
  assert.equal(deepest, floor,
    `with no devices at all the world bottoms out at ${deepest} m of ${floor} - a sealed hall has walled the planet off`);

  /* And every Anchor hall that is NOT sealed can be broken into with nothing
     but a drill, which is the other half of the same promise. A hall whose
     walls the flood never reached is a room nobody can get into. */
  for (let r = 0; r < H.ANCHOR_COUNT; r++) {
    if (H.anchorSealed(r)) continue;
    const a = H.anchorAt(r);
    assert.ok(seen.has(a.x + ',' + (a.d + 1)) || seen.has(a.x + ',' + (a.d - 1)) ||
              seen.has((a.x - 1) + ',' + a.d) || seen.has((a.x + 1) + ',' + a.d),
      `${H.regionName(r)}'s Anchor cannot be reached from the surface at all`);
  }
});

test('the key exists: a player who has found the rest can dig up the laser', () => {
  /* The test below checks that the laser's crate is never inside sealed
     stone - and passed for three days while the crate did not exist at all,
     because a check over an empty set is a check of nothing. So this one
     asks the question that comes first. */
  H.setWorld(0);
  H.g.ground = H.newGround();
  const others = H.FINDS.map((f) => f.key).filter((k) => k !== 'laser');
  H.g.found = others;
  const crates = [...H.findCells().values()].map((f) => f.key);
  assert.deepEqual(crates, ['laser'], 'with everything else found the world buries ' + crates.join(', '));
  /* And it is cuttable rock, not bedrock, sealed stone or an Anchor. */
  for (const [k, f] of H.findCells()) {
    const i = k.indexOf(',');
    const b = H.blockAt(+k.slice(0, i), +k.slice(i + 1));
    assert.ok(b && b.find, f.key + ' at ' + k + ' is not drawn as a crate');
    assert.ok(Number.isFinite(b.hard), f.key + ' at ' + k + ' is inside something uncuttable');
  }
  H.g.found = [];
});

test('the key is never behind the door it opens', () => {
  /* The deadlock. The Cutting Laser's crate opens every sealed hall, so a
     crate stamped inside one is a save that cannot be finished - and the
     positions of both are seeded, so this is a thing to CHECK rather than a
     thing to assume. */
  H.setWorld(0);
  H.g.found = [];
  const crates = H.findCells();
  for (const [k] of crates) {
    assert.notEqual(VAULT.get(k), '=',
      `a device crate is inside sealed stone at ${k}`);
  }
  /* And not in the air of a sealed hall either, which would be worse: visible,
     reachable-looking, and behind a wall. */
  for (let r = 0; r < H.ANCHOR_COUNT; r++) {
    if (!H.anchorSealed(r)) continue;
    const a = H.anchorAt(r);
    for (const [k] of crates) {
      const i = k.indexOf(',');
      const x = +k.slice(0, i), d = +k.slice(i + 1);
      assert.ok(Math.abs(x - a.x) > (H.VAULT_W - 1) / 2 || Math.abs(d - a.d) > (H.VAULT_H - 1) / 2,
        `a device crate is inside ${H.regionName(r)}'s sealed hall at ${k}`);
    }
  }
});

/* ---------- how much of the world is authored ---------- */

test('worked stone is rare enough to be a question', () => {
  /* The named failure mode of authored content in a seeded world is templates
     you start to recognise. The library is small, so the defence is rarity:
     meeting one has to be an event. Under a tenth of the world, and the
     stamp is nowhere near that - but the ceiling is what stops the next person
     adding forty slots because rooms are fun to write. */
  const total = H.W * H.WORLD_DEPTH;
  assert.ok(VAULT.size / total < 0.1,
    `${Math.round(1000 * VAULT.size / total) / 10}% of the planet is inside an authored room`);
  assert.ok(VAULT.size > 800, `only ${VAULT.size} authored cells in the whole world`);
});

test('the rooms that are worth nothing outnumber the rooms that pay', () => {
  /* Load-bearing, and the reason a quiet room exists at all: if every worked
     room held something, worked stone would be a reward rather than a
     question. Counted over the actual stamp rather than over the pool, because
     what matters is what got placed. */
  let pay = 0, quiet = 0;
  for (let i = 0; i < H.WILD_SLOTS; i++) {
    const s = H.wildSlot(i);
    if (s.vault.kind === 'quiet') quiet++;
    else pay++;
  }
  assert.ok(quiet > 0, 'not one empty room anywhere in the world');
  assert.ok(quiet >= pay * 0.4,
    `${quiet} empty rooms against ${pay} that hold something - finding worked stone is a reward, not a question`);
});

test('every room that was placed is stamped whole', () => {
  /* Two rooms sharing cells is one room with a wall through the middle of it.

     The first version of this test re-derived the stamp's own drop rule and
     then asserted the rule had been applied - which is a test of the
     implementation by the implementation, and it passed happily with the drop
     removed. It proved nothing.

     This asks the STAMP instead: for every room that made it into the world,
     is every cell of it exactly the character its template says? A room that
     was overwritten by another loses cells and fails here, whatever the
     placement code believes. */
  /* Each room's OWN size, not the standard one. The Vault is 15 by 13 and
     checking it against 11 by 9 reads the wrong characters out of the
     template - which this test reported, correctly, as the Vault having lost
     cells it never had. */
  const check = (cx, cd, v, what) => {
    const w = H.vaultW(v), h = H.vaultH(v);
    const x0 = cx - (w - 1) / 2, d0 = cd - (h - 1) / 2;
    for (let ry = 0; ry < h; ry++) {
      for (let rx = 0; rx < w; rx++) {
        const ch = v.rows[ry][rx];
        if (!ch || ch === ' ') continue;
        const x = x0 + rx, d = d0 + ry;
        if (x < 0 || x >= H.W || d < 1 || d >= H.WORLD_DEPTH) continue;
        assert.equal(VAULT.get(x + ',' + d), ch,
          `${what} lost its cell at (${x},${d}): expected '${ch}', found '${VAULT.get(x + ',' + d)}'`);
      }
    }
  };
  /* The PLAN, not a re-derivation of the drop rule.

     The first version of this identified a placed room by whether its centre
     cell was stamped - which is true of a room that was dropped for overlapping
     an Anchor, because the Anchor's own hall covers that cell. It reported a
     room that does not exist as having lost its walls. */
  const plan = H.vaultPlan();
  for (const p of plan) check(p.x, p.d, p.vault, `the ${p.vault.id} at (${p.x},${p.d})`);

  /* And nothing on the plan overlaps anything else on it. */
  for (let i = 0; i < plan.length; i++) {
    for (let j = i + 1; j < plan.length; j++) {
      assert.ok(
        Math.abs(plan[i].x - plan[j].x) >= (H.vaultW(plan[i].vault) + H.vaultW(plan[j].vault)) / 2 ||
        Math.abs(plan[i].d - plan[j].d) >= (H.vaultH(plan[i].vault) + H.vaultH(plan[j].vault)) / 2,
        `the ${plan[i].vault.id} at (${plan[i].x},${plan[i].d}) overlaps the ` +
        `${plan[j].vault.id} at (${plan[j].x},${plan[j].d})`);
    }
  }
  assert.ok(plan.length > H.ANCHOR_COUNT + 9,
    `only ${plan.length - H.ANCHOR_COUNT - 1} of ${H.WILD_SLOTS} wild rooms survived placement`);
});

/* ---------- lighting one ---------- */

test('lighting an Anchor pushes its region back, raises the tier, and only once', () => {
  const s = H.newGround();
  s.unrest[3] = 0.9;
  assert.equal(H.tierOf(s), 0);
  assert.equal(H.lightAnchor(s, 3), 1);
  assert.ok(s.unrest[3] <= H.UNREST_AFTER_ANCHOR,
    `lighting left ${H.regionName(3)} at ${s.unrest[3]}`);
  assert.ok(s.unrest[3] > 0,
    'lighting an Anchor wiped the region clean - it holds the ground down, it does not undo what you did');
  assert.equal(H.tierOf(s), 1);
  assert.equal(H.isLit(s, 3), true);

  /* Twice is once. The loop calls this every frame while the ship is next to
     the plinth, so a second call has to be free. */
  assert.equal(H.lightAnchor(s, 3), 1);
  assert.equal(H.tierOf(s), 1);

  /* And it does not calm anywhere else. */
  assert.equal(s.unrest[4], 0);
});

test('an Anchor never raises a region it already calmed', () => {
  /* A quiet region stays quiet: the push-back is a ceiling, not an
     assignment, so lighting an Anchor in ground you have barely touched must
     not make it angrier than it was. */
  const s = H.newGround();
  s.unrest[2] = 0.02;
  H.lightAnchor(s, 2);
  assert.equal(s.unrest[2], 0.02);
});

test('cut stone never enters the hold', () => {
  /* A crash found by the phone pass, and the worst kind: the game ran, the
     manifest opened, and then it did not - because the fixture had cut into an
     Anchor hall in between and `worked` was sitting in the cargo with no DEF
     entry behind it. `buildManifest` sorts by `DEF[id].value` and threw on the
     whole screen.

     Every other block in the world either has a DEF entry or is caught by a
     branch above the cargo one. The three cut-stone blocks are caught by
     `spoil`, and the rule they encode is also the right one: you are getting
     THROUGH a wall, not mining it. */
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.ground = H.newGround();
  H.g.found = ['laser'];
  const seen = new Set();
  for (const [k, ch] of VAULT) {
    if (!'#=%'.includes(ch)) continue;
    const i = k.indexOf(',');
    const b = H.blockAt(+k.slice(0, i), +k.slice(i + 1));
    if (!b || seen.has(b.id)) continue;
    seen.add(b.id);
    assert.equal(b.spoil, true, `${b.id} is cut stone and is not flagged as spoil`);
    assert.equal(b.wt, 0, `${b.id} has weight, so a full hold behaves differently near a wall`);
    assert.equal(b.value, 0, `${b.id} is worth something, so it would be worth mining a wall`);
  }
  assert.ok(seen.size >= 3, `only ${seen.size} kinds of cut stone found in the whole world`);

  /* And the general rule underneath it: anything that CAN reach the hold has
     to be lookup-able, because the manifest, the debrief and the sale all go
     through DEF by id. Swept over the world rather than asserted about the
     three ids that caused it. */
  const bad = new Set();
  for (let d = 0; d < H.WORLD_DEPTH; d += 3) {
    for (let x = 0; x < H.W; x += 3) {
      const b = H.blockAt(x, d);
      if (!b || b.spoil || b.hazard || b.cache || b.find || b.relic) continue;
      if (!Number.isFinite(b.hard)) continue;
      if (!H.DEF[b.id]) bad.add(b.id);
    }
  }
  assert.deepEqual([...bad], [],
    `these can be broken into the hold and have no DEF entry: ${[...bad].join(', ')}`);
  H.g.found = [];
});

test('a lit Anchor does not plug its own column, which is the bug the ghost flag exists for', () => {
  /* The PROPERTY, asserted through the thing that would actually break: the
     route finder. Six of the nine Anchors were once unreachable by digging down
     their own column, and the reason was a lit monument the ship could not pass.

     `findRoute` is the right instrument rather than a hand-written walk,
     because it is what the fuel-to-climb estimate and the autopilot both use -
     if it disagrees with collision about a cell, the game lies to the player
     about whether they can get home. */
  H.setWorld(0);
  H.g.ground = H.newGround();
  const a = H.anchorAt(0);

  /* A shaft straight down the Anchor's own column, from the surface to one
     metre BELOW it, with the Anchor's own cell left undug - it cannot be dug. */
  const dug = [];
  for (let d = -1; d <= a.d + 1; d++) if (d !== a.d) dug.push(a.x + ',' + d);
  H.g.dug = new Set(dug);
  H.g.px = a.x; H.g.pd = a.d + 1;

  H.lightAnchor(H.g.ground, 0);
  const route = H.findRoute();
  assert.ok(route, 'no way home from under a lit Anchor: the monument is a plug again');

  /* And the route really does pass through the Anchor's cell rather than
     finding some way around, or this asserts nothing about the flag.

     `findRoute` returns [x, d] PAIRS and not keys - the first version of this
     compared them against a "x,d" string, matched nothing, and failed claiming
     the route had avoided the Anchor. The code was right and the test was
     reading the wrong shape. */
  assert.ok(route.some((c) => c[0] === a.x && c[1] === a.d),
    'the route home avoided the Anchor, so this test would pass with the flag removed');
});

test('every Anchor is reachable without passing the gate it opens', () => {
  /* The unfinishable-save guard, in the shape the tier gates give it. Tier t's
     three Anchors open tier t's gate, so if any of them sat BELOW that gate the
     world could never be opened past it and the save would be dead - with
     nothing on screen to say why.

     Depth alone is checked elsewhere; this is reachability, which is the
     stronger claim: an Anchor above the gate but walled off by unbreakable
     ground is just as fatal. Flooded with only the gates ABOVE this tier open,
     which is exactly what a player arriving at this tier has. */
  for (let t = 0; t < H.GATE_COUNT; t++) {
    H.setWorld(0);
    H.g.dug = new Set();
    H.g.ground = H.newGround();
    for (let k = 0; k < t; k++) H.g.ground.gates.push(k);
    /* WITH the laser, deliberately. Three halls are sealed by design and the
       laser is their key; whether that key can be reached before it is needed
       is a different claim with its own test two above this one ("the key is
       never behind the door it opens"). Asking both questions in one flood made
       this fail on Kryllon, whose hall is sealed - which was this test
       over-reaching rather than a gate being wrong. The question here is only
       about GATES. */
    const held = H.g.found.slice();
    H.g.found = ['laser'];

    const seen = new Set(['30,0']);
    let queue = [[30, 0]];
    while (queue.length) {
      const next = [];
      for (const c of queue) {
        for (const n of [[c[0], c[1] - 1], [c[0], c[1] + 1], [c[0] - 1, c[1]], [c[0] + 1, c[1]]]) {
          const x = n[0], d = n[1];
          if (x < 0 || x >= H.W || d < 0 || d >= H.WORLD_DEPTH) continue;
          const k = x + ',' + d;
          if (seen.has(k)) continue;
          const b = H.blockAt(x, d);
          if (b && !Number.isFinite(b.hard) && !b.ghost) continue;
          seen.add(k);
          next.push(n);
        }
      }
      queue = next;
    }
    H.g.found = held;

    for (const r of H.gateAnchors(t)) {
      const a = H.anchorAt(r);
      /* The Anchor's own cell is uncuttable, so reaching it means reaching a
         cell NEXT to it - which is what lighting one actually requires. */
      const touching = [[a.x, a.d - 1], [a.x, a.d + 1], [a.x - 1, a.d], [a.x + 1, a.d]]
        .some((c) => seen.has(c[0] + ',' + c[1]));
      assert.ok(touching,
        `${H.regionName(r)}'s Anchor at ${a.x},${a.d} cannot be reached with only the gates above ` +
        `tier ${t} open - it is locked behind the gate it is supposed to open`);
    }
  }
});

/* ---------- Y13: the Anchor breaks and leaves a remnant ---------- */

test('a broken Anchor leaves a scar that nothing can clear', () => {
  /* His words: "Each anchor should be dramatic when it breaks and leave
     remnants behind." The drama is `actions.ts`; this is the remnant.

     One dim cell where the Anchor stood would be a monument a player flies
     past without noticing, so the PLINTH goes with it - the five cells of
     worked stone the Anchor was set into. Five is not a number anybody chose:
     it is however many `#` the hall template puts around the `A`, which is
     what `anchorPlinth` reads. */
  H.setWorld(0);
  for (let r = 0; r < H.ANCHOR_COUNT; r++) {
    H.g.dug = new Set();
    H.g.ground = H.newGround();
    const a = H.anchorAt(r);

    const plinth = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dd = -1; dd <= 1; dd++) {
        if (dx === 0 && dd === 0) continue;
        const b = H.blockAt(a.x + dx, a.d + dd);
        if (b && b.id === 'worked') plinth.push([a.x + dx, a.d + dd]);
      }
    }
    assert.ok(plinth.length >= 5,
      `${H.regionName(r)}'s Anchor sits in ${plinth.length} cells of worked stone, not the plinth's five`);

    H.lightAnchor(H.g.ground, r);
    for (const [x, d] of plinth) {
      const b = H.blockAt(x, d);
      /* Except the floor directly under it, which is not scarred but GONE -
         it is where the Anchor went, and it is also the one cell of the
         plinth that would otherwise plug the column. See the note in
         `world.ts`; this is the third time that bug has been built. */
      if (x === a.x && d === a.d + 1) {
        assert.equal(b, null,
          `${H.regionName(r)}: the floor under the Anchor is ${b && b.id}, so the recess has a lid on it`);
        continue;
      }
      assert.equal(b.id, 'anchorscar',
        `${H.regionName(r)}: the plinth at ${x},${d} is still ${b && b.id} after the Anchor broke`);
      assert.equal(b.hard, Infinity,
        'a scar can be drilled away, so the site can be tidied up and the evidence removed');
      assert.equal(b.spoil, true, 'a scar goes in the hold');
    }
  }
});

test('a broken Anchor never plugs its own column, scar and all', () => {
  /* The bug this game has now built three times, and the one the e2e catches
     at fifteen minutes a run - so it is asked here too, in a second.

     Three Anchors share each of the three columns they sit in, and the
     shallowest of them is what the ship meets on the way to the other two. It
     is uncuttable for ever by design, so the ONLY way past it is that nothing
     it leaves behind is solid: the Anchor itself is `ghost` (X6) and the floor
     of its recess is gone (Y13). Put either back and six of the nine Anchors
     become unreachable however well anybody plays. */
  H.setWorld(0);
  for (let r = 0; r < H.ANCHOR_COUNT; r++) {
    H.g.dug = new Set();
    H.g.ground = H.newGround();
    H.lightAnchor(H.g.ground, r);
    const a = H.anchorAt(r);
    for (let d = a.d - 1; d <= a.d + 2; d++) {
      const b = H.blockAt(a.x, d);
      /* `b && b.id` and not `b.id`: the message is an argument, so it is built
         whether or not the assertion holds, and most of these cells are null. */
      assert.ok(!b || b.ghost || Number.isFinite(b.hard),
        `${H.regionName(r)}: ${a.x},${d} is a solid uncuttable ${b && b.id} under a broken Anchor - the column is plugged`);
    }
  }
});

test('the scar is a remnant and not a monument', () => {
  /* Two permanent marks now exist and they must not look alike - the research
     in `plans/lattice/DESCENT.md` Q4 calls it the two-tier signal, a body of
     small private costs and one big public landmark. Three dim violet scars
     per tier, and then the spent core at full glow.

     The bug this catches: somebody retuning the scar upward until it reads
     well on its own, at which point the world has twelve monuments and no
     landmark. */
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.ground = H.newGround();
  H.lightAnchor(H.g.ground, 0);
  const a = H.anchorAt(0);
  const broken = H.blockAt(a.x, a.d);

  H.g.ground.gates = [0];
  const core = H.blockAt(H.coreColumn(0), H.gateDepth(0));
  assert.equal(core.id, 'darkspent');
  assert.ok(core.glow > broken.glow * 2,
    `a broken Anchor glows ${broken.glow} against the spent core's ${core.glow} - the scar is ` +
    'competing with the landmark it is supposed to lead to');
});

test('the remnant survives a save and a load', () => {
  /* It is derived from `g.ground.lit` and stored nowhere, which is why this
     costs the save nothing - and is exactly why it needs asserting: a derived
     mark is only as permanent as the field it derives from. */
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.ground = H.newGround();
  H.lightAnchor(H.g.ground, 3);
  const a = H.anchorAt(3);
  const wasBroken = H.blockAt(a.x, a.d).id;
  const wasScarred = H.blockAt(a.x - 1, a.d).id;

  H.g.ground = H.loadGround(JSON.parse(JSON.stringify(H.g.ground)));
  assert.equal(H.blockAt(a.x, a.d).id, wasBroken, 'the broken Anchor came back intact after a load');
  assert.equal(H.blockAt(a.x - 1, a.d).id, wasScarred, 'the scar did not survive a load');
  assert.equal(wasBroken, 'anchorbroken');
  assert.equal(wasScarred, 'anchorscar');
});

test('an Anchor nobody has broken has no scar', () => {
  /* The other half, and the one a derived mark gets wrong: a scar that appears
     before the deed is the world spoiling its own reveal. */
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.ground = H.newGround();
  for (let r = 0; r < H.ANCHOR_COUNT; r++) {
    const a = H.anchorAt(r);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dd = -1; dd <= 1; dd++) {
        const b = H.blockAt(a.x + dx, a.d + dd);
        assert.notEqual(b && b.id, 'anchorscar',
          `${H.regionName(r)} is scarred before anybody has been there`);
      }
    }
  }
});
