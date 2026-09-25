/* What a dark core hands over. Round fifteen, Y4.

   His brief: *"Once you destroy it, the forcefield releases and you can go
   further down. It should also give you a new ability or mechanic."*

   The plan's receipt is that every tier grants exactly one and that no two
   grant the same, which is the shape rather than the content - the content is
   his to play and edit. What these tests defend is that the shape cannot rot:
   a tier with nothing, a tier with two, or two tiers handing over the same
   thing are each the ladder losing a rung, and each of them is the sort of
   thing that happens when somebody adds a fourth ability later. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

test('every gate but the door hands over exactly one ability', () => {
  /* Round seventeen, AC: the last core is the Vault's door, and the door is
     its gift. Every other core hands over exactly one. Sink comes from no core
     (tier -1): it is what the gate vendors sell (AO). */
  for (let t = 0; t < H.GATE_COUNT - 1; t++) {
    const mine = H.ABILITIES.filter((a) => a.tier === t);
    assert.equal(mine.length, 1,
      `tier ${t} hands over ${mine.length} abilities: ${mine.map((a) => a.key).join(', ')}`);
    assert.equal(H.abilityFor(t).tier, t);
  }
  assert.equal(H.abilityFor(H.GATE_COUNT - 1), undefined, 'the door handed over an ability');
});

test('no two cores hand over the same thing', () => {
  const keys = H.ABILITIES.map((a) => a.key);
  assert.equal(new Set(keys).size, keys.length, `two tiers share an ability: ${keys.join(', ')}`);
  const names = H.ABILITIES.map((a) => a.name);
  assert.equal(new Set(names).size, names.length, `two abilities share a name: ${names.join(', ')}`);
});

test('an ability arrives with its core and never before it', () => {
  /* Derived from `g.ground.gates`, which is already the save's record of which
     cores are broken - so this is really asserting that nothing keeps a second
     copy of that list. A player who has broken no core has nothing. */
  for (const a of H.ABILITIES.filter((x) => x.tier >= 0)) {
    assert.equal(H.hasAbility([], a.key), false, `${a.key} is aboard before any core is broken`);
    assert.equal(H.hasAbility([a.tier], a.key), true, `tier ${a.tier}'s core did not hand over ${a.key}`);
    for (const other of H.ABILITIES) {
      if (other.tier === a.tier) continue;
      assert.equal(H.hasAbility([other.tier], a.key), false,
        `tier ${other.tier}'s core handed over ${a.key}, which belongs to tier ${a.tier}`);
    }
  }
});

test('the abilities arrive in the order the cores do', () => {
  const all = [];
  for (let t = 0; t < H.GATE_COUNT - 1; t++) all.push(t);
  const got = H.abilitiesOf([...all, H.GATE_COUNT - 1]).map((a) => a.tier);
  assert.deepEqual(got, all, 'the ladder is out of order, so the ending arrives before the middle');
  assert.deepEqual(H.abilitiesOf([1]).map((a) => a.key), ['call']);
  assert.deepEqual(H.abilitiesOf([]).length, 0);
});

test('not one of them is a number', () => {
  /* The plan's rule, from GMTK on Hollow Knight: each key opens a few locks,
     and a numeric upgrade opens none. The shop sells numbers; the cores hand
     over verbs and lenses. Nothing mechanical can read intent, so this reads
     the WORDS - a blurb that talks in percentages or in "more" is the shape of
     an upgrade that has wandered into the wrong table. */
  const numeric = /\b\d+\s?%|\bper cent\b|\bmore\b|\bfaster\b|\bbigger\b|\blonger\b|\bextra\b/i;
  const bad = H.ABILITIES.filter((a) => numeric.test(a.blurb));
  assert.deepEqual(bad.map((a) => a.key), [],
    'these read like upgrades rather than abilities. A core hands over a verb or a lens; ' +
    'the shop is where numbers are sold.');
});

test('sinking cannot get past the things nothing cuts', () => {
  /* The barrier, the bedrock, an Anchor, the Vault. They share exactly one
     property, `hard: Infinity`, and sinking has to respect it or the ladder
     his whole brief is about has a way round it - a player who can sink
     through a forcefield has no reason to find an Anchor. */
  assert.equal(H.SINK_STOPS_AT_INFINITY, true);
  assert.ok(H.SINK_HULL > 0, 'sinking is free, so there is no decision in it');
  assert.ok(H.SINK_RATE > 0);
});

test('The Call hears everything the ship can reach, and nothing past a shut gate', () => {
  /* Round seventeen, AC. It answered only in regions whose Anchor was broken -
     ground already worked - and it arrived with the last core, where it could
     say nothing about the tier it came in. It is the second core's now and
     points somewhere the player has not been, but never below a gate that is
     still shut, because a secret the ship cannot reach is a promise the game
     cannot keep yet. */
  const g0 = H.gateDepth(0), g1 = H.gateDepth(1);
  assert.equal(H.callAnswers([0], g1 - 1), true, 'ground above the next shut gate is silent');
  assert.equal(H.callAnswers([0], g1 + 5), false, 'the Call heard through a shut gate');
  assert.equal(H.callAnswers([0], g0 + 5), true);
  assert.equal(H.callAnswers([], g0 + 5), false);
});

test('The Call hears what is buried, and stops hearing it once it is dug', () => {
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.ground = H.newGround();
  H.resetSecrets();
  /* Round seventeen, AC: it hears everything the ship can reach, so with no
     gate open that is the first tier and nothing below it. */
  const heard = H.secretsHeard();
  assert.ok(heard.length > 0, 'nothing is buried in the whole first tier');
  for (const s of heard) {
    assert.ok(s.d < H.gateDepth(0), `it answered from ${s.d} m, below the shut first gate`);
    assert.ok(['find', 'relic', 'cache', 'wreck'].includes(s.kind));
    assert.ok(H.blockAt(s.x, s.d), 'it answered from a cell with nothing in it');
  }
  H.g.ground.gates = [0];
  H.resetSecrets();
  assert.ok(H.secretsHeard().some((s) => s.d > H.gateDepth(0)), 'opening a gate let it hear nothing deeper');
  H.g.ground.gates = [];
  H.resetSecrets();

  /* Dig one out and it stops answering, which is what makes the map a list of
     what is LEFT rather than a list of what exists. */
  const one = heard[0];
  H.g.dug.add(H.key(one.x, one.d));
  H.resetSecrets();
  const after = H.secretsHeard();
  assert.equal(after.length, heard.length - 1, 'a secret the player dug up is still on the map');
  assert.ok(!after.some((s) => s.x === one.x && s.d === one.d));
  H.g.dug = new Set();
  H.resetSecrets();
});

test('The Call does not answer with ore', () => {
  /* Ore is the Survey device's question and the map's richness shading
     already says where it is thickest. A list of every seam on the planet
     turns a search into a checklist, which is the one thing this round has
     been trying to stop the Anchors being. */
  H.setWorld(0);
  H.g.dug = new Set();
  H.g.ground = H.newGround();
  H.g.ground.lit = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  H.resetSecrets();
  /* NOT `isOre`, which was the first version and was wrong in a way worth
     recording: `isOre` is `'min' in m`, and a supply cache carries a depth
     gate too, so it answers true for the very thing The Call is FOR. The
     question is the ore TABLE, which is the list of things you mine and sell.

     Two claims, and the second is the one that cannot be satisfied by
     accident: nothing it names is a mineral, and the whole list stays a short
     one. A lens that named every seam would be a checklist, which is exactly
     what this round has spent itself stopping the Anchors from being. */
  const oreIds = new Set(H.ORES.map((o) => o.id));
  const heard = H.secretsHeard();
  for (const s of heard) {
    const b = H.blockAt(s.x, s.d);
    assert.ok(!oreIds.has(b.id), `The Call is reading out ${b.id}, which is a mineral`);
  }

  let ore = 0;
  for (let x = 0; x < H.W; x += 3) {
    for (let d = 0; d < H.WORLD_DEPTH; d += 3) {
      const b = H.blockAt(x, d);
      if (b && oreIds.has(b.id)) ore++;
    }
  }
  assert.ok(heard.length < ore,
    `The Call names ${heard.length} things against ${ore} sampled ore cells - it is reading out the ground`);
  H.resetSecrets();
});

test("The Hollow answers what is around you, not where to go", () => {
  /* The Receiver's fence, which has held since round eight: proximity and
     never bearing, because choosing a direction and digging it is the decision
     this game is built on. A lens that reached across a region would answer
     that question outright.

     Six cells is a little over what the portrait frame shows at rest. The
     assertion is against the FRAME rather than against 6, so re-framing the
     camera cannot silently turn a local lens into a map. */
  assert.ok(H.HOLLOW_REACH > 0);
  assert.ok(H.HOLLOW_REACH < H.W / 4,
    `The Hollow reaches ${H.HOLLOW_REACH} of ${H.W} columns, which is a map rather than a lamp`);
  assert.ok(H.HOLLOW_DRAIN > 0, 'The Hollow is free to leave on, so it is never off');
});
