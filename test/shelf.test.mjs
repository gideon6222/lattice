/* What a shop case says about itself.

   Playtest: "can you label each upgrade so that it is easy to tell what it is
   without clicking on it, and doing something to visually show that certain
   upgrades aren't available or you don't have enough money to purchase it."

   The room that draws this is three.js and cannot be unit tested; the decision
   underneath it is pure and is where the judgement lives - which state wins
   when several apply, and what the one line under the name should say. Those
   are the things that go quietly wrong. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();
const up = (key) => H.UPGRADES.find((u) => u.key === key);
const rich = 10_000_000;
const stocked = { iron: 99, copper: 99, silver: 99, gold: 99, amethyst: 99, emerald: 99, ruby: 99 };

test('a case you can afford is ready, and quotes the price', () => {
  const u = up('drill');
  const s = H.shelfState(u, 0, rich, stocked, 300);
  assert.equal(s.state, 'ready');
  assert.match(s.line, /^◈ [\d,]+$/, 'a ready case should show a credit price, got ' + s.line);
});

test('a depth lock beats everything, rich or broke', () => {
  /* Sealed has to win: quoting a price for something no amount of money can
     buy is a lie, and the depth IS the price.

     Tested BOTH rich and broke on purpose. The rich case alone passes whether
     the depth check runs first or last, so on its own it proves nothing about
     the ordering - which is exactly what a mutation of that ordering revealed.
     Broke-and-sealed is the case where the two orderings disagree: the wrong
     one reports "short" and sends the player off to earn money for something
     money cannot buy. */
  const u = up('laser');
  for (const [what, credits, stock] of [['rich', rich, stocked], ['broke', 0, {}]]) {
    const s = H.shelfState(u, 0, credits, stock, 0);
    assert.equal(s.state, 'sealed', 'a sealed case read as "' + s.state + '" when ' + what);
    assert.equal(s.line, u.unlock + ' m', 'a sealed case must name the depth that opens it');
  }
});

test('maxed beats affordability, because there is nothing to buy', () => {
  const u = up('drill');
  assert.equal(H.shelfState(u, u.max, rich, stocked, 300).state, 'max');
  assert.equal(H.shelfState(u, u.max, 0, {}, 300).state, 'max',
    'a maxed case must not report as unaffordable');
});

test('a per-tier cap beats affordability too, because money does not fix it either', () => {
  /* Y11: the card built from `levelCap` already greyed itself and named the
     next depth (see buildUpgradeRow in ui.ts); the case itself used to fall
     straight through to 'ready' here, which is the same lie a sealed case
     quoting a price would tell. */
  const u = up('drill');
  const cap = H.levelCap(u, 0);
  const s = H.shelfState(u, cap, rich, stocked, 0);
  assert.equal(s.state, 'capped', 'drill at its own level cap read as "' + s.state + '"');
  assert.doesNotMatch(s.line, /◈/, 'a capped case must not quote a price it will not sell at');
  /* one level below the cap is an ordinary case again, not capped */
  assert.notEqual(H.shelfState(u, cap - 1, rich, stocked, 0).state, 'capped',
    'a level below the cap read as capped');
});

test('short on credits reads as short, and still says the price', () => {
  const u = up('drill');
  const cost = H.costOf(u, 0);
  const s = H.shelfState(u, 0, cost - 1, stocked, 300);
  assert.equal(s.state, 'short');
  assert.match(s.line, /^◈ /, 'the price is still the actionable number when you are short of it');
  /* and one credit more flips it */
  assert.equal(H.shelfState(u, 0, cost, stocked, 300).state, 'ready');
});

test('a missing mineral is named ahead of the credits', () => {
  /* The design call this encodes: credits are what the loop pays constantly, so
     a mineral you have never seen is the thing actually stopping you. Naming
     the price instead would send the player off to do the thing they are
     already doing. */
  const u = up('cool');
  const lvl = 3;
  const mat = H.matCost(u, lvl);
  assert.ok(mat, 'this test needs an upgrade level that costs a mineral');
  const s = H.shelfState(u, lvl, rich, {}, 300);
  assert.equal(s.state, 'short');
  assert.match(s.line, /^\d+ [A-Z]+$/, 'expected "<n> MINERAL", got ' + s.line);
  assert.match(s.line, new RegExp('^' + mat.need + ' '), 'the count must be what is required');
  assert.doesNotMatch(s.line, /◈/, 'a mineral shortfall must not quote credits instead');
});

test('banking the mineral is what flips it, with money held constant', () => {
  const u = up('cool');
  const lvl = 3;
  const mat = H.matCost(u, lvl);
  const short = H.shelfState(u, lvl, rich, { [mat.id]: mat.need - 1 }, 300);
  const ok = H.shelfState(u, lvl, rich, { [mat.id]: mat.need }, 300);
  assert.equal(short.state, 'short');
  assert.equal(ok.state, 'ready', 'exactly enough of the mineral must be enough');
});

test('every upgrade produces a state and a non-empty line at every level', () => {
  /* A blank plate is worse than a wrong one: it reads as a broken case. */
  for (const u of H.UPGRADES) {
    for (let lvl = 0; lvl <= u.max; lvl++) {
      for (const [credits, stock, depth] of [[0, {}, 0], [rich, stocked, 300], [500, { iron: 1 }, 50]]) {
        const s = H.shelfState(u, lvl, credits, stock, depth);
        assert.ok(['ready', 'short', 'sealed', 'capped', 'max'].includes(s.state),
          u.key + ' lv' + lvl + ' gave state "' + s.state + '"');
        assert.ok(s.line && s.line.length > 0, u.key + ' lv' + lvl + ' had a blank plate');
        assert.doesNotMatch(s.line, /NaN|undefined/, u.key + ' lv' + lvl + ': ' + s.line);
      }
    }
  }
});

/* ---------- X3: a mineral that is a key, not a currency ---------- */

test('the Drill\'s last rung asks for its named key, exactly and only there', () => {
  const u = up('drill');
  for (let lvl = 0; lvl < u.max; lvl++) {
    const key = H.capstoneCost(u, lvl);
    if (lvl === u.max - 1) {
      assert.deepEqual(key, { id: 'solmarrow', need: 1 },
        'the level that reaches Godcore should ask for exactly 1 Solmarrow');
    } else {
      assert.equal(key, null, `level ${lvl} of the drill should not ask for a key yet`);
    }
  }
});

test('a Solmarrow shortfall reads as short even with every other mineral banked', () => {
  const u = up('drill');
  const lvl = u.max - 1;
  const short = H.shelfState(u, lvl, rich, stocked, 300);
  assert.equal(short.state, 'short');
  assert.match(short.line, /SOLMARROW/, 'the missing key must be named, not the credits');
  const ok = H.shelfState(u, lvl, rich, { ...stocked, solmarrow: 1 }, 300);
  assert.equal(ok.state, 'ready', 'exactly one Solmarrow must be enough to flip it');
});

test('only the named lines end on a capstone key', () => {
  /* Round seventeen, AK: X3 named only the Drill; the Hull and the Cooling Rig
     now end on umbrite, which nothing asked for before. Anything else ending
     on a capstone is an accident. */
  const named = new Set(['drill', 'hull', 'cool']);
  for (const u of H.UPGRADES) {
    for (let lvl = 0; lvl < u.max; lvl++) {
      const c = H.capstoneCost(u, lvl);
      if (!named.has(u.key)) assert.equal(c, null, `${u.key} lv${lvl + 1} asks for a capstone key`);
      else if (lvl + 1 === u.max) assert.ok(c, `${u.key} has no capstone at its last level`);
    }
  }
});

test('a sealed case stays sealed at every level it could be at', () => {
  for (const u of H.UPGRADES) {
    if (u.unlock === 0) continue;
    for (let lvl = 0; lvl <= u.max; lvl++) {
      assert.equal(H.shelfState(u, lvl, rich, stocked, u.unlock - 1).state, 'sealed',
        u.key + ' was buyable one metre above its own unlock depth');
      assert.notEqual(H.shelfState(u, lvl, rich, stocked, u.unlock).state, 'sealed',
        u.key + ' stayed sealed AT its unlock depth');
    }
  }
});
