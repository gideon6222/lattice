/* `g.planet` and `g.world` are vestigial, and this test is what stops them
   spreading.

   CLAUDE.md, Invariants: both fields are zero and both are left over from the
   chain of planets that round eight deleted. They survive for two reasons and
   only two - they seed the generator, and `test/baseline/blocks-frozen.json` is
   recorded against them - so `setWorld(p)` still exists for the tests that walk
   the old snapshots. The rule written next to them is:

     "Nothing new should read either of them - `regionAt(x, d)` is the question
      you actually want, and `traitAt` / `paletteAt` / `worldTrait()` all go
      through it."

   That sentence had no receipt for five rounds. It is a rule about a TREND -
   not "there are no reads" (there are sixty) but "there are no NEW reads" -
   and a trend is exactly what prose cannot hold, because every individual
   addition looks harmless next to the fifty already there. The census below is
   the frozen count per file. Adding a read fails here and names the file.

   Why a census and not a ban: banning the field outright would fail on the
   generator and the frozen baseline, which are the two legitimate readers, and
   a test that has to be suppressed on its first run teaches the next session to
   suppress it. Freezing the number lets the legitimate reads stand and stops
   the illegitimate ones, which is the actual rule.

   **When this test fails and you are deleting reads rather than adding them,
   lower the number.** The census is a ceiling, not an equality, for that
   direction - see the assertion. A file that reaches zero should be removed
   from the census entirely.

   INDEX.md rule 11: verify this test by reintroducing the bug. Add
   `const p = g.planet;` to any file below and it fails naming that file. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { REPO } from './harness.mjs';

const SRC = join(REPO, 'src');

/* Comments first, then string and template literals - the same order and the
   same reason as `sim-boundary.test.mjs`: an apostrophe inside a comment would
   otherwise open a string that never closes and swallow the rest of the file. */
function strip(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``');
}

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

/* `\b` after the name so `g.worldT` - the run timer on R, a different thing
   entirely - is not counted as a read of `g.world`. That near-miss is the
   reason this counts with a word boundary rather than a bare indexOf. */
const PATTERN = /\bg\.(planet|world)\b/g;

function census() {
  const counts = {};
  for (const file of walk(SRC)) {
    const n = (strip(readFileSync(file, 'utf8')).match(PATTERN) || []).length;
    if (n > 0) counts[relative(SRC, file).replace(/\\/g, '/')] = n;
  }
  return counts;
}

/* Frozen 2026-09-18 at v0.48.0. Every entry is a read that predates the rule.
   The two legitimate readers are `sim/world.ts` (the generator seeds on it) and
   `sim/state.ts` (save, load and `setWorld`); everything else is a read that
   would be written as `regionAt(x, d)` today. */
const FROZEN = {
  /* 3 -> 4 on 2026-09-18, round twelve V5: `lodeCollapse` seeds its collapse
     stream on `g.planet + 887`. That is a SEED use, which is the one thing
     `g.planet` is still legitimately for - the field survives precisely because
     it seeds the generator - and it sits beside the tremor's own
     `g.planet + 211` two lines away. Not a read that `regionAt(x, d)` could
     answer: there is no cell being asked about, only a stream being started. */
  /* 4 -> 5 on the same day, round twelve V6: `wakeCloses` seeds its own
     collapse stream on `g.planet + 887` beside `lodeCollapse`'s. Same
     justification as the line below it and as the tremor's `g.planet + 211`
     two functions away: a seed, not a question about a cell. */
  'actions.ts': 5,
  'blocks.ts': 20,
  'growth.ts': 3,
  'loop.ts': 14,
  'relic.ts': 4,
  'sim/state.ts': 11,
  /* 18 -> 19 on the same commit: the strained lode's placement hash,
     `rnd(x + 71, d + 419, g.planet + 887)`. The generator is the other
     legitimate reader, and every pocket in this file already reads it the same
     way. */
  /* 19 -> 21 on 2026-09-19, round thirteen W2: the derelict's hull plate and
     its dead lamp each take their hardness off the LOCAL BAND, which is
     `baseRock(d, g.planet, x)` - the identical call worked stone, sealed
     stone, the Vault seal and rubble all make within forty lines of them, and
     for the identical reason: a wall at 300 m has to cost more to open than
     the same wall at 40 m, or the deepest rooms are the cheapest in the game.

     Not a read `regionAt(x, d)` could answer. The region decides the TRAIT and
     the unrest, both of which are already applied here as `hm`; the band is a
     depth question, and `g.planet` is in it because the band boundaries wander
     per world. This is the generator, which is what the field still exists
     for. */
  /* 21 -> 23 on 2026-09-19, round fourteen X1: the vein sampler. Four seeded
     hashes - the vein roll, the heart's two coordinates and the edge wobble -
     all on `g.planet + 1063..1066`, which is the generator seeding its own
     stream exactly as every pocket in this file already does. Two of the four
     share a line, which is why this is +2 and not +4.

     Not a question `regionAt(x, d)` could answer: there is no cell being asked
     about, only a stream being started, and the stream has to be the same on
     every machine that loads the same save. */
  /* 23 -> 24 on 2026-09-19, round fifteen Y2: the dark-energy core takes its
     hardness off the LOCAL BAND like every other authored wall, which is
     `baseRock(d, g.planet, x)` - the identical call worked stone, the Vault
     seal, rubble and the derelict's hull all make. The generator seeding
     itself, which is what the field still exists for. */
  'sim/world.ts': 24,
  'ui.ts': 2
};

test('no file reads g.planet or g.world more often than it did at v0.48.0', () => {
  const now = census();
  const grew = [];
  for (const [file, n] of Object.entries(now)) {
    const was = FROZEN[file] ?? 0;
    if (n > was) grew.push(`${file}: ${was} -> ${n}`);
  }
  assert.deepEqual(grew, [],
    'These files gained a read of g.planet or g.world, which CLAUDE.md says nothing new should do. ' +
    'Ask regionAt(x, d) instead, or traitAt / paletteAt / worldTrait() which all go through it. ' +
    'If the new read really is the generator or the save, add it to FROZEN in this file with a line saying why.');
});

test('no file outside the generator and the save starts reading them', () => {
  const now = census();
  const fresh = Object.keys(now).filter((f) => !(f in FROZEN));
  assert.deepEqual(fresh, [],
    'A file that never read g.planet or g.world now does. This is the trend the census exists to stop.');
});

/* The census must not be allowed to rot into a check that inspects nothing:
   if the fields were renamed, every count would fall to zero and both tests
   above would pass while proving nothing. INDEX.md rule 11, and the doctor's
   own "a check that inspected nothing FAILS" rule. */
test('the census still finds the fields it is guarding', () => {
  const now = census();
  const total = Object.values(now).reduce((a, b) => a + b, 0);
  assert.ok(total >= 70,
    `the census found only ${total} reads of g.planet / g.world across src. It was 75 at v0.48.0. ` +
    'If the fields were genuinely removed, delete this test; if they were renamed, update PATTERN. ' +
    'What must not happen is this test passing because it stopped looking.');
});
