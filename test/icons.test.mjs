/* The app icon set, which nothing looked at until 2026-09-19.

   There are four of these files and they are four renderings of ONE picture:
   the render `scripts/icon.mjs` shoots out of the game, the flat vector the
   browser may pick instead of it, Android's themed alpha, and the store's copy.
   Which one a given surface shows is not ours to decide - the manifest offers
   the browser a choice and the launcher takes the alpha - so the failure they
   have is that one of them changes and the others do not, and NOBODY SEES IT,
   because whichever you happen to be looking at is the one that is showing.

   That is exactly how the set came to be shipping the objective from before
   round eight. The icons had a planet with a glowing core and a probe going
   into it; the core was taken out of the game in round eight and the icons
   were not, so for four rounds the first thing anyone saw of The Lattice was a
   picture of a game that no longer existed. INDEX.md rule 12 says to delete a
   stand-in in the same commit as the real thing and names a replaced OBJECTIVE
   as the most expensive kind. This is what having no receipt for that costs.

   So the assertions here are about AGREEMENT rather than about taste. What the
   picture is of is a judgement and his; that there are four of it is a fact. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

/* ---------- just enough PNG to ask about pixels ----------

   Both icons are 8-bit RGBA and not interlaced, which is asserted below rather
   than assumed, so this reader can stay the twenty lines it is. */
function readPng(name) {
  const b = readFileSync(join(PUBLIC, name));
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  const head = { w, h, depth: b[24], color: b[25], interlace: b[28] };

  /* IDAT may be split across any number of chunks and the zlib stream runs
     across all of them, so they are concatenated before a single inflate. */
  const parts = [];
  for (let p = 8; p + 8 <= b.length;) {
    const len = b.readUInt32BE(p);
    if (b.toString('ascii', p + 4, p + 8) === 'IDAT') parts.push(b.subarray(p + 8, p + 8 + len));
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(parts));

  /* Undo the per-scanline filter. Five of them, and every one is needed:
     a filter type this does not handle would silently decode as noise. */
  const bpp = 4, stride = w * bpp;
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? px[y * stride + i - bpp] : 0;
      const up = y > 0 ? px[(y - 1) * stride + i] : 0;
      const ul = y > 0 && i >= bpp ? px[(y - 1) * stride + i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += a;
      else if (f === 2) v += up;
      else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) {
        const p0 = a + up - ul, pa = Math.abs(p0 - a), pb = Math.abs(p0 - up), pc = Math.abs(p0 - ul);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? up : ul;
      } else if (f !== 0) throw new Error(name + ' uses PNG filter ' + f + ', which this reader does not do');
      px[y * stride + i] = v & 255;
    }
  }
  return { ...head, px, stride };
}

/* The box the visible pixels sit in, and how much of the square they cover. */
function alphaBox(img, floor = 8) {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1, on = 0;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (img.px[y * img.stride + x * 4 + 3] <= floor) continue;
      on++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, cover: on / (img.w * img.h) };
}

const manifest = JSON.parse(readFileSync(join(PUBLIC, 'manifest.webmanifest'), 'utf8'));

test('every icon the manifest offers is actually there', () => {
  /* A missing one is not a broken image on a page: the browser silently falls
     through to the next entry, or to a screenshot of the page, and the install
     looks fine to whoever made it. */
  for (const i of manifest.icons) {
    const f = i.src.replace(/^\.\//, '');
    assert.ok(existsSync(join(PUBLIC, f)), 'manifest offers ' + i.src + ' and public/ has no such file');
  }
  /* And the set is the four it should be, so a fifth cannot be added with no
     rendering of the picture behind it. */
  assert.deepEqual(
    [...new Set(manifest.icons.map((i) => i.src))].sort(),
    ['./icon-512.png', './icon-monochrome.png', './icon.svg']);
});

test('the raster icons are the size and the depth their surfaces require', () => {
  for (const name of ['icon-512.png', 'icon-monochrome.png']) {
    const img = readPng(name);
    /* 512 is Play's requirement for the store icon and the manifest's own
       claim for both of these. A 511 here is a Play upload rejected months
       from now with no clue which command produced it. */
    assert.equal(img.w, 512, name + ' is ' + img.w + ' wide and the manifest says 512x512');
    assert.equal(img.h, 512, name + ' is ' + img.h + ' tall and the manifest says 512x512');
    /* Play asks for 32-bit PNG. It is also what the reader above assumes. */
    assert.equal(img.depth, 8, name);
    assert.equal(img.color, 6, name + ' is not 32-bit RGBA, which Play refuses for the store icon');
    assert.equal(img.interlace, 0, name);
  }
});

test('the themed icon is an alpha SHAPE, because Android throws its colours away', () => {
  /* The launcher takes only the alpha of the monochrome icon and tints it
     itself. Rasterised without a transparent background it is a solid square,
     which does not look broken - it looks like a deliberate block of the
     user's accent colour, on every home screen that has themed icons on. */
  const img = readPng('icon-monochrome.png');
  const box = alphaBox(img);
  assert.ok(box.cover > 0.05, 'the themed icon is blank: it covers ' + (box.cover * 100).toFixed(1) + '%');
  assert.ok(box.cover < 0.60,
    'the themed icon covers ' + (box.cover * 100).toFixed(1) + '% and has lost its transparency');
});

test('the themed PNG is the current rasterisation of the themed SVG', () => {
  /* The two have carried "if you change one, change both" in a comment since
     the day they were written, and a sentence is not a mechanism. The SVG is
     one white <rect> under a mask, so its own numbers say where the shape
     begins and ends, and the PNG's alpha says where it actually does. Edit the
     SVG and skip `node scripts/icon.mjs --mono` and these disagree.

     It checks the OUTER shape and deliberately not the holes in it: the hull,
     the teeth and the eye are drawn to be looked at, and pinning their
     geometry would make every touch of the drawing a test edit. The bar is
     what the icon IS at 48dp. */
  const svg = readFileSync(join(PUBLIC, 'icon-monochrome.svg'), 'utf8');
  const m = svg.match(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"[^>]*fill="#fff"/);
  assert.ok(m, 'icon-monochrome.svg no longer has one white <rect> as its shape; this test needs rewriting');
  const [, x, y, w, h] = m.map(Number);

  const box = alphaBox(readPng('icon-monochrome.png'));
  /* Two pixels of slack for the rounded corners' antialiasing and nothing more. */
  for (const [what, want, got] of [['x', x, box.x], ['y', y, box.y], ['width', w, box.w], ['height', h, box.h]]) {
    assert.ok(Math.abs(want - got) <= 2,
      'icon-monochrome.svg says ' + what + ' ' + want + ' and the PNG has ' + got +
      ' - run `node scripts/icon.mjs --mono`');
  }
});

test('the two SVGs are the same square as the rasters', () => {
  /* A viewBox that is not 512 square makes the vector a different crop of the
     picture from the PNG, which is the drift this whole file is about, and it
     shows up only on whichever surface picks the SVG. */
  for (const name of ['icon.svg', 'icon-monochrome.svg']) {
    const svg = readFileSync(join(PUBLIC, name), 'utf8');
    assert.match(svg, /viewBox="0 0 512 512"/, name);
  }
});
