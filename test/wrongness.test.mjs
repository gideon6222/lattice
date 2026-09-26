/* The barrier and the core as objects. Round seventeen, AE.

   The milestone's own receipt first: the wrongness colour's value lives in
   one file. Then the things that were adjectives in the plan, pinned as
   numbers - darker and more alive tier by tier, each core making the deep
   worse - and the barrier's answer when you touch it. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { loadPure } from './harness.mjs';

const H = await loadPure();

function files(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...files(p));
    else if (/\.(ts|mjs|js|css|html)$/.test(f)) out.push(p);
  }
  return out;
}

test("the wrongness colour's value lives in one file", () => {
  const hex = H.WRONGNESS.toString(16).padStart(6, '0');
  const r = (H.WRONGNESS >> 16) & 255, g = (H.WRONGNESS >> 8) & 255, b = H.WRONGNESS & 255;
  const pats = [new RegExp(hex, 'i'), new RegExp(r + ' *, *' + g + ' *, *' + b)];
  const hits = [];
  for (const f of [...files('src'), 'index.html']) {
    const s = readFileSync(f, 'utf8');
    if (pats.some((p) => p.test(s))) hits.push(f.split(String.fromCharCode(92)).join('/'));
  }
  assert.deepEqual(hits, ['src/sim/wrongness.ts']);
});

test('only the core, the scar, the pip, the gate room and the map wear it', () => {
  /* The milestone: "the pip row, the scar and the gate room take it from that
     constant and nothing else uses it." These are the files that do: the core
     light and its block, the scar's block and its bursts, the map's scar and
     core marks, the pip (via --wrong in main.ts) and the gate room's band. */
  /* loop.ts since AH: the sky over the pad takes the core's colour at the end.
     blocks.ts and loop.ts since AI: the rock and the air show each Anchor broken. */
  const allowed = new Set(['src/barrier.ts', 'src/sim/world.ts', 'src/actions.ts', 'src/mapui.ts',
    'src/main.ts', 'src/stationroom.ts', 'src/sim/wrongness.ts', 'src/loop.ts', 'src/blocks.ts']);
  const users = files('src').filter((f) => /from '\.{1,2}\/(sim\/)?wrongness'/.test(readFileSync(f, 'utf8')))
    .map((f) => f.split(String.fromCharCode(92)).join('/'));
  for (const u of users) assert.ok(allowed.has(u), u + ' wears the wrongness colour');
  const css = readFileSync('index.html', 'utf8').match(/var\(--wrong\)/g) || [];
  assert.ok(css.length >= 3 && css.length <= 6, 'var(--wrong) used ' + css.length + ' times in index.html');
});

test('each core is darker and more alive than the one above it', () => {
  const lum = (c) => ((c >> 16) & 255) + ((c >> 8) & 255) + (c & 255);
  for (let t = 1; t < H.GATE_COUNT; t++) {
    const a = H.coreLook(t - 1), b = H.coreLook(t);
    assert.ok(lum(b.color) < lum(a.color), 'core ' + (t + 1) + ' is not darker');
    assert.ok(b.pulse > a.pulse && b.rate > a.rate, 'core ' + (t + 1) + ' is not more alive');
    assert.ok(b.dim > a.dim && b.dimRadius > a.dimRadius, 'core ' + (t + 1) + ' darkens less rock');
    assert.ok(b.dim < 1, 'a core blacks the rock out entirely');
  }
});

test('every core released lifts the heat line and steps the dust and the tremors up', () => {
  for (let c = 1; c <= H.GATE_COUNT; c++) {
    const a = H.coreStep(c - 1), b = H.coreStep(c);
    assert.ok(b.heatRise > a.heatRise && b.dust > a.dust && b.tremor > a.tremor);
  }
  assert.deepEqual(H.coreStep(0), { heatRise: 0, dust: 1, tremor: 1 });
  /* The line never rises out of the ground. */
  assert.ok(H.heatDepth(0) - H.coreStep(H.GATE_COUNT).heatRise > 20);
});

test('the barrier says what opens it, and never where', () => {
  const need = H.gateAnchors(0);
  const none = H.barrierSays(0, []);
  assert.match(none, new RegExp(need.length + ' Anchors'));
  assert.match(H.barrierSays(0, need.slice(0, need.length - 1)), /1 Anchor /);
  assert.match(H.barrierSays(0, need), /core is open/);
  assert.match(H.barrierSays(H.GATE_COUNT - 1, []), /Vault's door/);
  for (const s of [none, H.barrierSays(0, need)]) assert.doesNotMatch(s, /\d+ m|column|east|west|left|right/i);
});

test('the hints are seen near a spent core', () => {
  const t = 0;
  assert.equal(H.spentCoreNear(H.coreColumn(t), H.gateDepth(t) - 2, [t]), t);
  assert.equal(H.spentCoreNear(H.coreColumn(t), H.gateDepth(t) - 20, [t]), -1);
  assert.equal(H.spentCoreNear(H.coreColumn(t), H.gateDepth(t) - 2, []), -1);
});

test('every Anchor broken adds one visible step, spreading from details to mass to air', () => {
  let prev = H.wrongSigns(0);
  assert.deepEqual(prev, { detail: 0, mass: 0, air: 0 });
  for (let n = 1; n <= 9; n++) {
    const cur = H.wrongSigns(n);
    const grew = ['detail', 'mass', 'air'].filter((k) => cur[k] > prev[k] + 1e-9);
    assert.equal(grew.length, 1, n + ' Anchors broken changed ' + grew.length + ' signs, not one');
    const want = n <= 3 ? 'detail' : n <= 6 ? 'mass' : 'air';
    assert.equal(grew[0], want, 'Anchor ' + n + ' showed in the ' + grew[0] + ', not the ' + want);
    prev = cur;
  }
  assert.ok(H.wrongSigns(9).mass < 0.25 && H.wrongSigns(9).air < 0.35, 'the rock or the air stopped reading as itself');
});
