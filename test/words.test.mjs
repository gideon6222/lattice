/* The US English checker, checked.

   `scripts/check-us-english.mjs` is a gate step, and a gate step that stops
   inspecting things is worse than no gate step at all, because it reports
   "clean" and everybody believes it. That is not hypothetical here: **the first
   version of that file scanned the whole repo, matched nothing, and printed
   clean with the two spellings it was written for sitting in the changelog.**
   It had faithfully reproduced the doctor's `\b<british>\b` pattern, which
   cannot match an inflection, and both words that had actually shipped -
   "greys" and "greyed" - were inflections.

   So this is the receipt, and it is the shape `scripts\doctor-tests.ps1` uses
   in the knowledge base: plant what the check exists to catch and assert it is
   caught. INDEX.md rule 11 - a construct that cannot fail is untested, not
   safe.

   The assertions are about the MATCHING and the scope, never about the word
   list's contents: the list lives in `gamedev-notes` and is edited there, so a
   test that pinned its words would fail every time somebody added one. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const LIST = 'C:/dev/gamedev-notes/scripts/us-english.txt';

/* The checker skips when the knowledge base is not on this machine, and so
   does its test - a clone with no `C:\dev\gamedev-notes` must still be able to
   run the suite. */
const HAVE_LIST = existsSync(LIST);
const W = HAVE_LIST ? await import('../scripts/check-us-english.mjs') : null;

test('the word list is reachable, or this whole file is inert', { skip: !HAVE_LIST }, () => {
  /* Stated rather than assumed, so a run where the list went missing says so
     instead of quietly passing five empty tests. */
  assert.ok(readFileSync(LIST, 'utf8').includes('='), 'the word list has no pairs in it');
});

test('an inflection is caught, which is the bug this checker was born from',
  { skip: !HAVE_LIST }, () => {
  /* The two words that actually shipped in this game, for about ten versions,
     in the panel a player opens from the pause sheet. If either of these stops
     being caught, the checker has regressed to the version that could not see
     them. */
  for (const [word, want] of [['greyed', 'grayed'], ['greys', 'grays']]) {
    const hits = [...('a slider ' + word + ' out when muted').matchAll(W.RE)];
    assert.equal(hits.length, 1, '"' + word + '" is not matched at all');
    assert.equal(hits[0][0], word);
    assert.equal(W.americanFor(word), want,
      '"' + word + '" is matched but suggests the wrong word, so the fix offered is wrong');
  }
});

test('the dictionary form is still caught, and the ending comes back with it',
  { skip: !HAVE_LIST }, () => {
  assert.equal(W.americanFor('grey'), 'gray');
  assert.equal(W.americanFor('greying'), 'graying');
  /* Case is ignored on the way in and the suggestion is lower case, which is
     what the report prints beside the original. */
  assert.equal(W.americanFor('GREY'), 'gray');
});

test('a word that merely contains a listed one is left alone', { skip: !HAVE_LIST }, () => {
  /* The boundary is what keeps a FAILing gate safe to have. `greyhound` is a
     dog and `metres` is caught but `parameters` must not be. */
  for (const safe of ['greyhound', 'parameters', 'diametre_'.replace('_', 'x')]) {
    const hits = [...safe.matchAll(W.RE)].filter((m) => m[0].length === safe.length);
    assert.equal(hits.length, 0, '"' + safe + '" is reported as a whole-word hit');
  }
});

test('only strings with a space in them count, because the rest are identifiers',
  { skip: !HAVE_LIST }, () => {
  /* This is the property that makes failing the build on a hit safe: an id, a
     CSS class, a storage key and an import path can never be one. */
  const src = `const k = 'coreward.colour'; const msg = 'the colour of it';`;
  const found = W.stringsIn(src).map((s) => s.text);
  assert.deepEqual(found, ['the colour of it'],
    'the checker is reading identifiers, so any hit could be a false positive');
});

test('comments are not player text, and a commented-out string does not count',
  { skip: !HAVE_LIST }, () => {
  /* This repo's comments run to paragraphs and are written for whoever
     maintains the game. Scanning them would bury every real hit, and stripping
     rather than skipping means a string inside a commented-out block is gone
     too. Line offsets have to survive, or every reported line number is wrong. */
  const src = [
    `/* a colour of grey in a comment */`,
    `const a = 'the gray one';`,
    `// const b = 'the grey one';`
  ].join('\n');
  const stripped = W.stripComments(src);
  assert.equal(stripped.split('\n').length, 3, 'stripping comments moved the line numbers');
  const found = W.stringsIn(stripped).map((s) => s.text);
  assert.deepEqual(found, ['the gray one']);
});

test('the checker actually reads this repo, and reports it clean',
  { skip: !HAVE_LIST }, () => {
  /* The end-to-end half. `scan()` returning [] is only meaningful if it looked
     at something, so this asserts the repo is clean AND that the files it is
     supposed to read are there to be read - a scan of nothing returns [] too,
     which is exactly how the first version passed. */
  for (const f of ['src/changelog.ts', 'index.html', 'store/listing/en-US/full_description.txt']) {
    assert.ok(existsSync(join(ROOT, f)), f + ' is gone, so the checker is no longer reading it');
  }
  const hits = W.scan();
  assert.deepEqual(hits, [],
    'British spellings in player text: ' +
    hits.map((h) => h.file + ':' + h.line + ' ' + h.word).join(', '));
});
