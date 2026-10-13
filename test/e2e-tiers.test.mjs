/* The e2e slow tier is a list of titles in tools/e2e-tiers.mjs. This holds it to the spec: every
   title is a real test exactly once, and the pattern the gate's tier inverts matches those tests
   and no other. A rename that broke either would put a 90 s test back in the gate, or leave a
   quick one out of it, and nobody would see it. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from './harness.mjs';
import { SLOW_TITLES, slowPattern } from '../tools/e2e-tiers.mjs';

const spec = readFileSync(join(REPO, 'e2e', 'smoke.spec.ts'), 'utf8');
const titles = [...spec.matchAll(/^\s*test\('((?:[^'\\\n]|\\.)*)',/gm)].map((m) => m[1]);

test('every slow title is a test in the spec, once', () => {
  for (const t of SLOW_TITLES) {
    assert.equal(titles.filter((x) => x === t).length, 1, 'not exactly one test titled: ' + t);
  }
  assert.equal(new Set(SLOW_TITLES).size, SLOW_TITLES.length, 'a title is listed twice');
});

test('the slow pattern matches the slow tests and nothing else', () => {
  const re = new RegExp(slowPattern());
  const hit = titles.filter((t) => re.test(t));
  assert.deepEqual(hit.sort(), [...SLOW_TITLES].sort());
});

test('the gate keeps most of the suite, and the slow tier is a minority', () => {
  assert.ok(titles.length > 80, 'the spec was found: ' + titles.length);
  assert.ok(SLOW_TITLES.length <= titles.length / 3, 'the slow tier grew past a third of the suite');
});
