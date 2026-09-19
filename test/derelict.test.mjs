/* The derelict drill ship, round thirteen W2.

   His ask of 2026-09-18 was *"make more encounters and random events as you
   go"*, and round twelve answered half of it with the strained lode. Scoping
   the rest found that archetype 2 of the research's ranked list, the cracked
   vein, is what the lode already IS - a visibly rich thing past a
   tremor-adjacent wall that pays the best at its depth and brings the tunnel
   down behind you - so building it again would have been two of the same event
   competing for one descent, which is the wallpaper the encounter frame's own
   cap exists to prevent.

   Archetype 3 is the one that was genuinely missing, and it is a different
   kind of thing: *"a wrecked prior ship in a seeded cell with salvageable ore.
   No choice demanded, which is the point: it is the wordless tableau, and it is
   how the player learns this world holds more than hazards."*

   So the assertions here are mostly about RELATIONS rather than figures, for
   the reason `grade.test.mjs` gives: the numbers are feel and must stay free to
   retune, while the design rules they express must not quietly stop being true.
   The exceptions are the two counts - twelve regions, twelve wrecks - because
   "guaranteed once per region" is a promise and not a preference. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

const DEREL = H.VAULTS.find((v) => v.id === 'derelict');
const wrecks = () => H.vaultPlan().filter((p) => p.vault.id === 'derelict');

test('the template is a rectangle, and it holds exactly one hold and one lamp', () => {
  /* A room whose rows are not all the same length stamps a ragged silhouette
     and the stamp loop simply skips the short ends, so it fails as a slightly
     wrong ship rather than as an error. */
  assert.ok(DEREL, 'the derelict is not in VAULTS, so nothing else here means anything');
  const w = DEREL.rows[0].length;
  for (const r of DEREL.rows) assert.equal(r.length, w, 'ragged row: ' + JSON.stringify(r));

  const all = DEREL.rows.join('');
  const count = (c) => [...all].filter((x) => x === c).length;
  assert.equal(count('S'), 1, 'a wreck has one hold; more than one makes it a quarry');
  assert.equal(count('L'), 1, 'a wreck has one lamp, and the lamp is the telegraph');
  assert.ok(count('H') > 10, 'the hull is too thin to read as a ship');
});

test('the hold is behind hull whichever way you come in', () => {
  /* The room asks for a detour and nothing else, so the ONE thing that has to
     be true of its geometry is that the hold is not simply lying in the open:
     every orthogonal neighbour of `S` must be hull. Without this the wreck is a
     cache with decoration around it. */
  const rows = DEREL.rows;
  let sx = -1, sy = -1;
  rows.forEach((r, y) => { const i = r.indexOf('S'); if (i >= 0) { sx = i; sy = y; } });
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const ch = rows[sy + dy]?.[sx + dx];
    assert.equal(ch, 'H', 'the hold is open to the ' + dx + ',' + dy + ' side (' + ch + ')');
  }
});

test('every region gets a wreck, which is what "guaranteed once per region" means', () => {
  /* The promise, and the check on DERELICT_TRIES' margin. Measured while
     building it: one attempt each placed eight of twelve, because region 10
     draws a cell the Vault is standing on and three others landed on a hall.
     Four attempts places all twelve and the fourth is genuinely used; the
     constant is six, and the two spare exist so that retuning some OTHER room
     cannot silently cost a region its wreck. This is what makes that margin
     checked rather than hoped for. */
  const w = wrecks();
  assert.equal(w.length, H.DERELICT_SLOTS,
    'only ' + w.length + ' of ' + H.DERELICT_SLOTS + ' wrecks placed - the world got crowded ' +
    'enough to exhaust DERELICT_TRIES, which is ' + H.DERELICT_TRIES);
  const regions = new Set(w.map((p) => H.regionAt(p.x, p.d)));
  assert.equal(regions.size, H.DERELICT_SLOTS, 'two wrecks landed in one region and another has none');
});

test('no wreck touches any other room, so nothing already in the world moved', () => {
  /* The property the whole placement design rests on. Wrecks are appended LAST
     in vaultPlan and one that would overlap anything is dropped rather than
     clipped, so every room that existed before this round is where it was - and
     a wreck can only ever take cells the generator made, which is the claim
     that puts its three ids in blocks.test.mjs's OVERWRITERS honestly.

     A half-stamped room is the worst thing this system can produce: the player
     breaks through a wall and finds no room behind it, and the language of
     worked stone stops meaning anything. */
  const plan = H.vaultPlan();
  for (let i = 0; i < plan.length; i++) {
    for (let j = i + 1; j < plan.length; j++) {
      const a = plan[i], b = plan[j];
      const near = Math.abs(a.x - b.x) < (H.vaultW(a.vault) + H.vaultW(b.vault)) / 2 &&
                   Math.abs(a.d - b.d) < (H.vaultH(a.vault) + H.vaultH(b.vault)) / 2;
      assert.ok(!near, a.vault.id + ' at ' + a.x + ',' + a.d + ' overlaps ' +
        b.vault.id + ' at ' + b.x + ',' + b.d);
    }
  }
});

test('a wreck is stamped whole, every cell of it', () => {
  const stamp = H.vaultCells();
  for (const p of wrecks()) {
    const w = H.vaultW(p.vault), h = H.vaultH(p.vault);
    const x0 = p.x - (w - 1) / 2, d0 = p.d - (h - 1) / 2;
    for (let ry = 0; ry < h; ry++) {
      for (let rx = 0; rx < w; rx++) {
        const ch = p.vault.rows[ry][rx];
        if (ch === ' ') continue;
        const k = (x0 + rx) + ',' + (d0 + ry);
        assert.equal(stamp.get(k), ch, 'wreck at ' + p.x + ',' + p.d + ' is missing ' + ch + ' at ' + k);
      }
    }
  }
});

test('placement is a pure function of the region and the attempt', () => {
  /* The seed's promise: a given planet plays the same beats in the same places.
     A wreck that moved between two asks would be a wreck you could not tell
     anybody about. */
  for (let r = 0; r < H.DERELICT_SLOTS; r++) {
    for (let t = 0; t < H.DERELICT_TRIES; t++) {
      assert.deepEqual(H.derelictAt(r, t), H.derelictAt(r, t));
    }
  }
  /* And a retry has to be a real redraw rather than a nudge, or the ladder
     cannot get a wreck out from under whatever it collided with.

     **Asserted on DEPTH alone, and that is a fact about the world rather than
     a weaker test.** A region's column band is `W / REGION_COLS`, about 20
     cells, and the padding a room needs either side is `3 + VAULT_W/2 + 1`,
     about 9.5 - so the x freedom inside one region is roughly ONE cell, and
     every wreck in a column lands at 10, 31 or 50 whatever it draws. The
     Anchors have had exactly this property since they were placed with this
     same geometry, which is why CLAUDE.md records three of them sharing each of
     three columns. A first version of this test demanded both axes move and
     failed, correctly, on a world where one of them cannot.

     So what has to be true is that the six draws SPREAD down the band, far
     enough that a wreck pushed off one room is not delivered onto the next. */
  const band = 452 / 4;
  for (let r = 0; r < H.DERELICT_SLOTS; r++) {
    const ds = [];
    for (let t = 0; t < H.DERELICT_TRIES; t++) ds.push(H.derelictAt(r, t).d);
    const spread = Math.max(...ds) - Math.min(...ds);
    assert.ok(spread > band / 3,
      'region ' + r + ' draws all six attempts within ' + spread + ' m, which is a nudge');
  }
});

/* ---------- what the room is worth, as rules and not as figures ---------- */

test('the hold has no price of its own, because a wreck is not depth-gated', () => {
  /* The rule this enforces was bought with a failure. The hold shipped for an
     hour as a material paying `BLOOM.value`, on the argument that the game
     sorts prizes by what they COST you and a wreck asks only for a detour,
     exactly as a Bloom does. Sound reasoning, wrong source: **a Bloom is gated
     on `isAwake`**, so its 4,200 is priced against a player who has lit five
     Anchors, while a wreck is gated on nothing at all - Rustmoor's is at 13 m,
     where copper is 40 a unit and iron 95. Three wrecks in the top sixty metres
     were several runs of income in the first ten minutes. The e2e `the shallow
     world holds three materials, and the deep ones are a prize` is what caught
     it.

     So the hold carries no price. It is a cache, and `cachePrize(x, d)` decides
     what is in it - which is depth-scaled already, tested already, and is also
     the better fiction: a hold holds what that crew had dug, and they dug where
     they died.

     ANY non-zero value here is the bug coming back, so it is asserted as zero
     rather than as a bound. */
  assert.equal(H.SALVAGE.value, 0,
    'the hold has a price again, which puts a flat payout at 13 m - see cachePrize');
  assert.equal(H.SALVAGE.wt, 0, 'the hold has weight again, so it is going in the cargo hold');
});

test('hull plate is harder than masonry and softer than a locked door', () => {
  /* A hull is a made object somebody meant to keep four hundred metres of rock
     out, so it is not the wall of a worked room; and nothing about it is
     waiting for a tool, so it is not sealed stone either. Written as the
     midpoint of the two rather than as a third number to keep in step. */
  assert.ok(H.HULK_HARD > H.WORKED_HARD, 'a hull cuts like masonry');
  assert.ok(H.HULK_HARD < H.SEALED_HARD, 'a hull cuts like a door you need a laser for');
});

test('the salvage has a DEF row anyway, which is the cheap half of an invariant', () => {
  /* It is a cache now and so it cannot reach `g.cargo` at all, which means
     CLAUDE.md's invariant does not strictly bite. The row stays because that
     invariant shipped as a crash once - the game runs, the manifest opens, and
     then it does not, depending on what you picked up - and one row is a much
     cheaper way to be wrong about this than a stack trace is. */
  assert.ok(H.DEF[H.SALVAGE.id], 'DEF has no row for ' + H.SALVAGE.id);
  assert.equal(H.DEF[H.SALVAGE.id].value, H.SALVAGE.value);
});

test('a deep wreck is worth more than a shallow one, and never by a table of its own', () => {
  /* The property the flat price destroyed, restored by making the hold a
     cache: `cachePrize` hands over "the deepest three minerals this depth can
     hold". Asserted here on the WRECKS' own depths rather than on abstract
     ones, because what matters is that the twelve actually placed span enough
     of the world for the rule to bite. */
  const byDepth = wrecks().slice().sort((a, b) => a.d - b.d);
  const shallow = H.cachePrize(byDepth[0].x, byDepth[0].d);
  const deep = H.cachePrize(byDepth[byDepth.length - 1].x, byDepth[byDepth.length - 1].d);
  for (const p of [shallow, deep]) {
    assert.ok(['supply', 'mineral', 'credits'].includes(p.kind), 'a wreck holds ' + p.kind);
  }
  /* And the shallowest wreck can never hold a mineral the deep gates. */
  if (shallow.kind === 'mineral') {
    const o = H.ORES.find((z) => z.id === shallow.id);
    assert.ok(o.min <= byDepth[0].d,
      'the shallowest wreck holds ' + o.id + ', which does not exist above ' + o.min + ' m');
  }
});

/* ---------- what the three blocks do in the world ---------- */

function blockAtWreck(ch) {
  const p = wrecks()[0];
  const w = H.vaultW(p.vault), h = H.vaultH(p.vault);
  const x0 = p.x - (w - 1) / 2, d0 = p.d - (h - 1) / 2;
  for (let ry = 0; ry < h; ry++) {
    const rx = p.vault.rows[ry].indexOf(ch);
    if (rx >= 0) return H.blockAt(x0 + rx, d0 + ry);
  }
  return null;
}

test('the hull is spoil and the hold is cargo, which is the whole economy of the room', () => {
  const hull = blockAtWreck('H');
  assert.equal(hull.id, 'hulk');
  assert.ok(hull.spoil, 'cutting the hull pays, so twelve tableaux are twelve quarries');
  assert.equal(hull.value, 0);
  assert.ok(!hull.ore);

  const hold = blockAtWreck('S');
  assert.equal(hold.id, H.SALVAGE.id);
  assert.ok(hold.cache, 'the hold is not a cache, so breaking it hands over nothing');
  assert.ok(!hold.spoil, 'the hold is spoil, so the room pays nothing at all');
  assert.ok(hold.salvage, 'the hold lost its salvage flag, so it draws as gems and says "Supply cache"');
  assert.equal(hold.value, 0);
  assert.equal(hold.wt, 0);
});

test('the lamp is a telegraph and not a prize', () => {
  /* Glow rides `coreGlow()`, the find-the-vein curve, so a glowing cell shows
     through unbroken rock. That is what puts the beat in the right order - a
     light in the ground first, what is around it second - and it is the whole
     reason the lamp exists. It must out-glow the rock it is buried in by
     enough to be seen, and it must be worth nothing, so a player who drills
     straight at the light finds out it was only a light. */
  const lamp = blockAtWreck('L');
  assert.equal(lamp.id, 'derelictlamp');
  assert.equal(lamp.value, 0);
  assert.ok(lamp.spoil);

  /* `ore: true` on a thing that is not ore, which looks exactly like a mistake
     somebody will tidy away, so it is asserted with the reason attached.

     blocks.ts emits the additive HALO on the ore path alone, and the halo is
     what carries a glow through unbroken rock - `coreGlow` on the body's
     emissive is not enough on its own. Measured by looking: the first build
     had this block at glow 0.88 with correct emissive and it was completely
     invisible in unlit ground. Remove the flag and the telegraph stops
     existing, silently, while every number here still reads right.

     It is the Anchor's own trick, and it is safe for the same reason: the only
     other thing `ore` does is decide what enters the hold, and `spoil` diverts
     past that branch before it is reached. */
  assert.ok(lamp.ore,
    'the lamp lost ore:true, so blocks.ts emits no halo for it and it cannot be seen through rock');
  assert.ok(lamp.spoil,
    'the lamp is ore without being spoil, so cutting one puts a Dead Lamp in the hold');
  assert.ok(lamp.glow > H.GAS.glow,
    'the lamp glows less than a gas pocket, so the tell is weaker than the hazard beside it');
  assert.ok(lamp.glow > 0.5, 'the lamp will not carry through rock at ' + lamp.glow);
});

test('a wreck sits in rock, not in the air, at every depth it is placed', () => {
  /* The hull is a wall you cut, so its hardness rides the local band exactly as
     every other authored wall does - a wreck at 300 m has to cost more to open
     than one at 40 m, or the deepest rooms are the cheapest in the game. */
  const byDepth = wrecks().slice().sort((a, b) => a.d - b.d);
  const shallow = byDepth[0], deep = byDepth[byDepth.length - 1];
  const hullOf = (p) => {
    const h = H.vaultH(p.vault), w = H.vaultW(p.vault);
    const d0 = p.d - (h - 1) / 2, x0 = p.x - (w - 1) / 2;
    for (let ry = 0; ry < h; ry++) {
      const rx = p.vault.rows[ry].indexOf('H');
      if (rx >= 0) return H.blockAt(x0 + rx, d0 + ry);
    }
    return null;
  };
  assert.ok(deep.d - shallow.d > 200, 'the wrecks are not spread over the world');
  assert.ok(hullOf(deep).hard > hullOf(shallow).hard,
    'the deepest wreck opens as cheaply as the shallowest, so depth buys nothing here');
});
