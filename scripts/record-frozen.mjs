/* Re-record `test/baseline/blocks-frozen.json`, the fixed point the ore stream
   is measured against.

   **This is not an ordinary golden and it is not re-recorded when it fails.**
   `blocks.test.mjs` compares today's world against this file and allows exactly
   two kinds of difference: a cell kept its id, or a known overwriter replaced
   it. Anything else is "the ore stream moved", which is the bug the file exists
   to catch - the one where a new feature consumes a roll and silently shifts
   every ore on every planet while the diff looks like three lines.

   So there is exactly one reason to run this: a DELIBERATE ore rebalance, where
   moving the ore is the change being made. It has happened twice.

     round seven, 2026-09-10  the ladder spread from five worlds to eight and
                              total density fell from 10% to 7.5%
     round fourteen, 2026-09-19  ore stopped being single scattered cells and
                              started coming in veins

   **Read the diff before running this, and write it down.** Round seven's
   reading is in `NOTES.md` as a four-row table, and that note is the reason
   anybody can still say what that re-record did. A re-record with no reading
   beside it is indistinguishable from covering up a bug.

   This script exists because round seven did not leave one, so round fourteen
   had to work out the file format from the file. The window each planet is
   recorded over is PRESERVED rather than recomputed - same columns, same depth
   range - so that the new fixed point is comparable with the old one and the
   file does not quietly grow from a 13-column world to a 61-column one.

   Usage:
     node scripts/record-frozen.mjs          say what would change, write nothing
     node scripts/record-frozen.mjs --write  replace the file
*/

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPure } from '../test/harness.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, 'test', 'baseline', 'blocks-frozen.json');
const WRITE = process.argv.includes('--write');

const H = await loadPure();
const old = JSON.parse(readFileSync(FILE, 'utf8'));
const ORE = new Set(H.ORES.map((o) => o.id));

/* The same alphabet the file already uses, so a legend character keeps meaning
   roughly what it meant and a hand diff of the grid stays readable. */
const ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/* An ARRAY, like the file it replaces. The first version of this wrote an
   object, because `Object.keys` on an array hands back numeric keys and the
   shape looked the same from that end - `blocks.test.mjs` caught it as
   "PRE is not iterable", which is the test doing its job. */
const out = [];
let same = 0, changed = 0, oreWas = 0, oreNow = 0;
const moves = {};

for (let p = 0; p < old.length; p++) {
  const w = old[p];
  H.setWorld(+p);
  H.g.dug = new Set();
  H.g.rubble = new Set();

  /* Every id in this window, sorted, so the legend never depends on the order
     cells happen to be visited. */
  const ids = new Set();
  const cells = [];
  /* INCLUSIVE of rowsTo, which is how `blocks.test.mjs` walks it. The first
     version used `<` and wrote every grid one row short, and the test said
     "undefined became stone" - a legend lookup running off the end. */
  for (let d = w.rowsFrom; d <= w.rowsTo; d++) {
    for (let x = 0; x < w.cols; x++) {
      const b = H.blockAt(x, d);
      const id = b ? b.id : '(empty)';
      ids.add(id);
      cells.push(id);
    }
  }
  const sorted = [...ids].sort();
  if (sorted.length > ALPHA.length) throw new Error('planet ' + p + ' needs more legend characters');
  const charOf = new Map(sorted.map((id, i) => [id, ALPHA[i]]));
  const legend = {};
  for (const [id, c] of charOf) legend[c] = id;

  /* The reading, against the file being replaced. */
  for (let i = 0; i < cells.length; i++) {
    const was = w.legend[w.grid[i]];
    const now = cells[i];
    if (ORE.has(was)) oreWas++;
    if (ORE.has(now)) oreNow++;
    if (was === now) { same++; continue; }
    changed++;
    const kind = ORE.has(was) && ORE.has(now) ? 'one ore became another'
      : ORE.has(was) ? 'stopped being ore'
      : ORE.has(now) ? 'started being ore'
      : 'rock, air or a room changed';
    moves[kind] = (moves[kind] || 0) + 1;
  }

  out.push({
    planet: w.planet, coreDepth: w.coreDepth, cols: w.cols,
    rowsFrom: w.rowsFrom, rowsTo: w.rowsTo,
    grid: cells.map((id) => charOf.get(id)).join(''),
    legend
  });
}

console.log('against the file on disk, across ' + old.length + ' recorded worlds:');
console.log('  cells identical  ' + same);
console.log('  cells changed    ' + changed + '  (' + (changed / (same + changed) * 100).toFixed(1) + '%)');
for (const [k, v] of Object.entries(moves).sort((a, b) => b[1] - a[1])) {
  console.log('    ' + String(v).padStart(6) + '  ' + k);
}
console.log('  ore cells        ' + oreWas + ' -> ' + oreNow +
  '  (' + ((oreNow - oreWas) / oreWas * 100).toFixed(1) + '%)');

if (!WRITE) {
  console.log('\nnothing written. Read the numbers above, write them into NOTES.md,');
  console.log('and only then run again with --write.');
  process.exit(0);
}

writeFileSync(FILE, JSON.stringify(out, null, 2) + '\n');
console.log('\nwrote ' + FILE);
