/* The old spine may not come back in the words. Round seventeen, AD.

   Until round fifteen the game was a collection: nine Anchors anywhere, lit in
   any order, the ninth opening the centre. Round fifteen built a ladder instead
   and round seventeen retired the collection's last mechanisms (AC) - but the
   words outlived them for two rounds: the intro said "break all nine, and the
   center opens", the title said "light the Anchors", the store listing said
   "light them all and the Vault opens". A player reading any of them is told
   to play a game that no longer exists.

   So this reads every piece of text a player sees - the page's own markup, the
   store listing, and the string literals in the source (comments stripped, so
   history written in comments is free to say whatever it needs) - and fails
   on the collection's two phrasings: nine as the goal, and "light" as the
   verb. Nine as a plain count ("3 of 9 Anchors broken") is allowed; it is
   true. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from './harness.mjs';

const BANNED = [
  /\b(light|lit|lighting|break|find)\s+(all\s+)?nine\b/i,
  /\bnine anchors\b/i,
  /\ball nine\b/i,
  /\blight (the|an|every) anchors?\b/i,
  /\bfifth anchor\b/i
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/* String literals of a TypeScript file with its comments removed. The old
   changelog is history the player reads as history, so it is left out. */
function literals(src) {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const out = [];
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;
  let m;
  while ((m = re.exec(code))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

test('no player-facing text asks for nine Anchors, or for lighting them', () => {
  const found = [];
  const check = (where, text) => {
    for (const b of BANNED) if (b.test(text)) found.push(where + ': "' + text.trim().slice(0, 90) + '"');
  };

  const html = readFileSync(join(REPO, 'index.html'), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
  check('index.html', html);

  for (const f of walk(join(REPO, 'store', 'listing'))) {
    if (f.endsWith('.txt')) check(f.slice(REPO.length + 1), readFileSync(f, 'utf8'));
  }

  for (const f of walk(join(REPO, 'src'))) {
    if (!f.endsWith('.ts') || f.endsWith('changelog.ts')) continue;
    for (const s of literals(readFileSync(f, 'utf8'))) check(f.slice(REPO.length + 1), s);
  }

  assert.deepEqual(found, [], 'the old spine is still talking:\n  ' + found.join('\n  '));
});
