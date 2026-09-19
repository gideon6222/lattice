/* US English in everything a player reads. INDEX.md standing rule 15.

   ---------- why this exists in THIS repo ----------

   The studio's own check is `Test-UsEnglish` in `C:\dev\gamedev-notes\scripts\
   doctor.ps1`, and its documented scope is a double-quoted string with a space
   in it in `src\**\*.gd`, `text` and `tooltip_text` in a `.tscn`, every line of
   a Markdown changelog, and README prose. **Every one of those is Godot-shaped,
   and this game is a web game**: its player-facing strings are TypeScript
   literals in `src/`, its changelog is `src/changelog.ts` rather than a `.md`,
   and its shell is `index.html`. So rule 15's receipt has never once read a
   word of this game.

   Measured on 2026-09-19, which is how it was found: the doctor was added to
   `npm run check` that afternoon on the assumption that it covered this, a
   British spelling was planted in `src/changelog.ts` to verify the step bit,
   and the doctor reported `0 fail` and no warning at all. Two spellings -
   "greys out" and "greyed out" - had been shipping in the What's New panel for
   ten versions, and were found by eye rather than by any check.

   The gap is in another repo, so under rule 13c it is not this session's to
   fix; naming it and covering this side is. The WORD LIST is still the
   studio's, read from disk at run time rather than copied, so adding a word
   there teaches this too and the two can never disagree about what the rule is.

   ---------- FAIL rather than WARN, unlike the doctor ----------

   The doctor is explicit that it warns and never fails, and gives a good
   reason: "a FAIL here would block a game's commit on a word in a README that
   has nothing to do with the change being committed." That reason does not
   apply here, because this reads NOTHING but text a player sees. Every hit is a
   word on somebody's screen, and a warning nobody is required to act on is
   exactly what let two of them ship. */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIST = 'C:/dev/gamedev-notes/scripts/us-english.txt';

if (!existsSync(LIST)) {
  /* Not a failure. The knowledge base is a separate checkout and a machine that
     does not have it should still be able to build the game. */
  console.log('us-english: no word list at ' + LIST + ' - skipped');
  process.exit(0);
}

/* `british=american`, one per line, `#` comments, blank lines ignored - the
   list's own header states the format, and this parses exactly that. */
const pairs = readFileSync(LIST, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split('='))
  .filter((p) => p.length === 2 && p[0] && p[1]);

if (!pairs.length) {
  console.error('us-english: the word list parsed to nothing, which is a broken list rather than a clean repo');
  process.exit(1);
}

/* ---------- inflections, which is the whole reason this catches anything ----

   The doctor builds `\b<british>\b` per pair, and the list's own header says so:
   *"Whole words only... `Colour` and `COLOUR` are caught and `discolouration`
   is not."* **That is why the two spellings this file exists for got through.**
   The list has `grey=gray`, and `\bgrey\b` does not match "greyed" or "greys" -
   the `y` is followed by a word character, so the trailing boundary fails. Both
   of the words actually shipping in this game were inflections, and the first
   version of this check reproduced the doctor's pattern exactly and reported
   the repo clean with both of them planted back in.

   So a listed word is matched with an optional regular English ending. Four
   suffixes and no stem changes, which is conservative on purpose: `greying` is
   caught and `colourise` is not, because guessing at spelling rules is how a
   checker starts inventing words. A miss here is one line in the list away from
   being fixed; a false positive in a FAILing gate is somebody's afternoon.

   The list is still the single source of what is British. This only changes
   what counts as the same word, and `US` keys on the STEM so the suggestion
   carries the ending back: "greyed" is reported as wanting "grayed". */
export const ENDINGS = ['', 's', 'ed', 'ing'];
export const RE = new RegExp('\\b(' + pairs.map((p) => p[0]).join('|') + ')(s|ed|ing)?\\b', 'gi');
const US = new Map(pairs.map(([b, a]) => [b.toLowerCase(), a]));

/* What the American form of a matched word is, ending and all. */
export function americanFor(word) {
  const w = word.toLowerCase();
  for (const end of ENDINGS) {
    const stem = end && w.endsWith(end) ? w.slice(0, -end.length) : w;
    const us = US.get(stem);
    if (us && (!end || w === stem + end)) return us + end;
  }
  return US.get(w) || w;
}

/* ---------- what counts as a word a player reads ----------

   Deliberately narrow. A quoted string with a space in it is a sentence; one
   without is an id, a CSS class, a storage key or a colour name. Identifiers,
   import paths and code are all out of scope by construction rather than by
   exception, which is the property that makes a FAIL safe. */
export function stringsIn(src) {
  const out = [];
  /* Single, double and template literals. The template case matters: half the
     HUD's text is built with one. */
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;
  let m;
  while ((m = re.exec(src))) {
    const s = m[1] ?? m[2] ?? m[3] ?? '';
    if (s.includes(' ')) out.push({ text: s, at: m.index });
  }
  return out;
}

function lineOf(src, index) {
  return src.slice(0, index).split('\n').length;
}

/* Comments are prose for whoever maintains the game, not for a player, and this
   repo's comments are long enough that scanning them would bury every real hit.
   Stripped rather than skipped, so a string inside a commented-out block does
   not count either. */
export function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + m.slice(p.length).replace(/./g, ' '));
}

function tsFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...tsFiles(p));
    else if (name.endsWith('.ts')) out.push(p);
  }
  return out;
}

/* ---------- the scan ----------

   In a function, and run only when this file is the thing node was asked to
   run, so `test/words.test.mjs` can import the matching and assert it finds the
   words it is supposed to. The studio's own precedent for testing a checker is
   `scripts\doctor-tests.ps1`, which plants a fault per doctor check and asserts
   the FAIL; the reason it exists applies here with force, because the first
   version of THIS file inspected the whole repo, matched nothing, and printed
   "clean" with the two spellings it was written for sitting in the changelog. */
export function scan() {
const hits = [];

/* Every TypeScript string a player could read. `env.d.ts` and `types.ts` emit
   nothing and hold no sentences, but they cost nothing to read and excluding
   files by name is how a scanner quietly stops inspecting things. */
for (const f of tsFiles(join(ROOT, 'src'))) {
  const src = stripComments(readFileSync(f, 'utf8'));
  for (const s of stringsIn(src)) {
    for (const m of s.text.matchAll(RE)) {
      hits.push({ file: relative(ROOT, f), line: lineOf(src, s.at), word: m[0],
                  want: americanFor(m[0]), text: s.text });
    }
  }
}

/* The shell, which carries the on-screen labels, the error overlay and the
   meta description a search result shows. Tags are stripped so an attribute
   name or a class cannot be a hit. */
for (const rel of ['index.html']) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) continue;
  const raw = readFileSync(p, 'utf8');
  /* script and style blocks are code; their own strings are covered above or
     are CSS values. */
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/<style[\s\S]*?<\/style>/gi, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
    /* Keep `content="..."` from the meta tags - that IS read, in a search
       result and on a shared link - then drop every other tag. */
    .replace(/<meta[^>]*content="([^"]*)"[^>]*>/gi, (_m, c) => c)
    .replace(/<[^>]+>/g, ' ');
  for (const m of text.matchAll(RE)) {
    hits.push({ file: rel, line: lineOf(text, m.index), word: m[0],
                want: americanFor(m[0]), text: text.slice(Math.max(0, m.index - 40), m.index + 40).trim() });
  }
}

/* And the store listing, which is the first paragraph anybody reads about this
   game and is the one place rule 15 names by name. */
const store = join(ROOT, 'store');
if (existsSync(store)) {
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith('.txt')) {
        const src = readFileSync(p, 'utf8');
        for (const m of src.matchAll(RE)) {
          hits.push({ file: relative(ROOT, p), line: lineOf(src, m.index), word: m[0],
                      want: americanFor(m[0]),
                      text: src.slice(Math.max(0, m.index - 40), m.index + 40).trim() });
        }
      }
    }
  };
  walk(store);
}

return hits;
}

/* Imported by the test, run by the gate. `process.argv[1]` is the script node
   was asked to run, so this is false whenever the module is imported. */
const RUN = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (!RUN) { /* imported: the exports above are the whole point */ }
else {

const hits = scan();

if (!hits.length) {
  console.log('us-english: ' + pairs.length + ' words checked, clean');
  process.exit(0);
}

console.error('us-english: ' + hits.length + ' British spelling(s) in text a player reads.');
console.error('He is in the United States (INDEX.md rule 15). The word list is ' + LIST + '.');
for (const h of hits) {
  console.error('  ' + h.file + ':' + h.line + '  "' + h.word + '" -> "' + h.want + '"');
  console.error('      ' + h.text.slice(0, 110));
}
process.exit(1);

}
