/* After a crash the game opens normally, with the progress kept.

   His bar (launch.md section 2, 2026-10-01): a player never sees crash or
   debug UI. index.html records a crash and counts boots; src/recovery.ts,
   before the save is loaded, puts a crashed run's ship back on the pad with an
   empty hold and keeps everything earned, and sets aside a save that would not
   load twice running rather than leave the game on LOADING. This drives all of
   it on a Map, the way the browser's localStorage would be. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModule } from './harness.mjs';

const R = await loadModule('src/recovery.ts');
const B = await loadModule('src/buildinfo.ts');
const C = await loadModule('src/sim/config.ts');

function store(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    m,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); }
  };
}

/* A run under way: 180 m down, a hold half full, a checkpoint written. */
const MID_RUN = {
  at: 'checkpoint', planet: 0, credits: 4321, up: { drill: 3, hull: 2 },
  dug: ['30,1', '30,2', '30,3'], cargo: { iron: 4, silver: 2 }, weight: 31,
  px: 33, pd: 180, fuel: 12, hull: 40, best: { depth: 212 }, ground: { lit: [0, 1] }
};

const quiet = (fn) => {
  const warn = console.warn;
  console.warn = () => {};
  try { return fn(); } finally { console.warn = warn; }
};

test('a clean boot changes nothing', () => {
  const s = store({ [C.SAVE_KEY]: JSON.stringify(MID_RUN), [R.BOOT_KEY]: '1' });
  const out = quiet(() => R.recoverBeforeLoad(s));
  assert.deepEqual(out, { crashed: false, dropped: false, setAside: false });
  assert.deepEqual(JSON.parse(s.getItem(C.SAVE_KEY)), MID_RUN, 'a clean boot touched the save');
});

test('after a crash the run in progress is dropped and the progress kept', () => {
  const s = store({
    [C.SAVE_KEY]: JSON.stringify(MID_RUN), [R.BOOT_KEY]: '1',
    [R.CRASH_KEY]: JSON.stringify({ at: 'x', kind: 'ERROR', message: 'boom', pending: true })
  });
  const out = quiet(() => R.recoverBeforeLoad(s));
  assert.equal(out.crashed, true);
  assert.equal(out.dropped, true);
  const after = JSON.parse(s.getItem(C.SAVE_KEY));
  assert.equal(after.at, 'pad', 'the ship was not put back on the pad');
  assert.equal(after.px, C.START_X);
  assert.equal(after.pd, -1);
  assert.deepEqual(after.cargo, {}, 'the half-finished run kept its hold');
  assert.equal(after.weight, 0);
  /* What was earned stays. */
  assert.equal(after.credits, 4321);
  assert.deepEqual(after.up, MID_RUN.up);
  assert.deepEqual(after.dug, MID_RUN.dug);
  assert.deepEqual(after.best, MID_RUN.best);
  assert.deepEqual(after.ground, MID_RUN.ground);
  /* The record is kept for a look later, and never acted on twice. */
  const rec = JSON.parse(s.getItem(R.CRASH_KEY));
  assert.equal(rec.message, 'boom', 'the diagnostics were thrown away');
  assert.equal(rec.pending, false, 'the crash is still pending, so the next boot would drop a run again');
  const again = quiet(() => R.recoverBeforeLoad(s));
  assert.equal(again.crashed, false, 'one crash was recovered from twice');
});

test('a boot that never reached a screen counts as a crash', () => {
  /* index.html added this boot to one that never finished: 2. */
  const s = store({ [C.SAVE_KEY]: JSON.stringify(MID_RUN), [R.BOOT_KEY]: '2' });
  const out = quiet(() => R.recoverBeforeLoad(s));
  assert.equal(out.crashed, true);
  assert.equal(out.dropped, true);
  assert.equal(JSON.parse(s.getItem(C.SAVE_KEY)).at, 'pad');
  R.bootFinished(s);
  assert.equal(s.getItem(R.BOOT_KEY), null, 'a finished boot left its count behind');
});

test('a save that will not load twice running is set aside, never deleted', () => {
  const raw = JSON.stringify(MID_RUN);
  const s = store({ [C.SAVE_KEY]: raw, [R.BOOT_KEY]: '3' });
  const out = quiet(() => R.recoverBeforeLoad(s));
  assert.equal(out.setAside, true);
  assert.equal(s.getItem(C.SAVE_KEY), null, 'the save that will not load is still where the boot reads it');
  assert.equal(s.getItem(R.ASIDE_KEY), raw, 'the save set aside is not the save that was there');
});

test('no save and storage that throws are both a plain boot', () => {
  const empty = store({ [R.BOOT_KEY]: '2' });
  const out = quiet(() => R.recoverBeforeLoad(empty));
  assert.equal(out.dropped, false);
  const broken = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
    removeItem: () => { throw new Error('blocked'); }
  };
  assert.doesNotThrow(() => quiet(() => R.recoverBeforeLoad(broken)));
  assert.doesNotThrow(() => R.bootFinished(broken));
});

test('the version line names version, commit and build kind', () => {
  assert.equal(B.buildLine('0.56.0', 'abc1234', 'release'), 'v0.56.0 | abc1234 | release');
  /* Unbuilt (this suite) it is a debug build, and says so rather than "unbuilt". */
  assert.equal(B.buildKind(), 'debug');
  assert.match(B.buildLine(), /^v\d+\.\d+\.\d+ \| \S+ \| (debug|release)$/);
  assert.ok(!B.buildLine().includes('unbuilt'));
});
