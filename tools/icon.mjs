/* The app icon, rendered out of the game rather than drawn beside it.

   The icon this replaced was a flat vector planet with a glowing core and a
   probe going into it: the objective from before round eight, which took the
   core out. So it was a stand-in for a design that no longer exists (INDEX.md
   rule 12), and it also looked nothing like the game - his words, 2026-09-19:
   "something that matches the more realistic textures on the rock, and feel of
   the game."

   Drawing a new one by hand would buy the same problem again, because a hand
   drawing cannot be checked against a picture it is not made of. This shoots
   the real renderer: real rock normals, the real lamp, the real fog. When the
   art changes, re-running this changes the icon, and nothing drifts.

   Three decisions, and two of them are shot.mjs's for shot.mjs's reasons:
   it serves `dist` so it looks at what ships, and it drives through `?debug`
   and `window.__cw` and advances GAME time, so the same command gives the same
   picture on any machine.

   The third is its own. It renders at the PHONE's aspect and crops a square
   out of the middle, rather than rendering into a square viewport, because
   `resize()` solves eighteen rows into a camera distance from the viewport
   HEIGHT: a square viewport is a legal framing the player never sees, with
   eighteen columns in it. Cropping keeps the rock at the size his thumb knows.

   It renders at deviceScaleFactor 2 and downsamples, which is supersampling
   and is why the rock grain survives at 512 instead of aliasing into noise.

   Usage:
     node scripts/icon.mjs                 # every preset, into test-results/
     node scripts/icon.mjs shaft           # one preset, into test-results/
     node scripts/icon.mjs shaft --write   # and over public/icon-512.png
     node scripts/icon.mjs --mono          # rasterise the two SVGs; writes
                                           # public/icon-monochrome.png

   Each preset also writes a 48 px copy beside the 512, because 48dp is the
   size the launcher actually draws and a composition that only works at 512 is
   a composition nobody sees. Judge the small one. */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'test-results');
const PORT = 4323;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json',
  '.map': 'application/json', '.ico': 'image/x-icon'
};

/* The panel, and the supersample. 2340 is the S26 Ultra's own height and is
   what every framing number in this game was tuned against. */
const W = 1080, H = 2340, DSF = 2;

function serve() {
  return new Promise((ok) => {
    const s = createServer(async (req, res) => {
      const url = (req.url || '/').split('?')[0];
      const file = join(DIST, url === '/' ? 'index.html' : url);
      try {
        const body = await readFile(file);
        res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404).end('not found');
      }
    });
    s.listen(PORT, () => ok(s));
  });
}

/* ---------- the candidates ----------

   `crop` is the side of the square taken out of the 1080-wide render, in CSS
   pixels, and it is the only zoom dial: 1080 is the full width and about eight
   rows of world, 700 is about five. Smaller is closer, and closer means bigger
   rock faces and more of the texture he asked for.

   `drop` nudges the crop down from the ship in CSS pixels, for a composition
   that wants more of the shaft under it than over it. */
const PRESETS = {
  /* The descent: the ship in its own lamp, in a shaft it cut. This is the one
     image the game is mostly made of. */
  shaft: {
    crop: 760, drop: 40,
    setup: `
      const dug = [];
      for (let d = 0; d <= 40; d++) dug.push('6,' + d);
      __cw.g.dug = new Set(dug);
      __cw.g.px = 6; __cw.g.pd = 22;
      __cw.advance(0.4);
      __cw.R.held = 'down';
      __cw.advance(0.5);
    `
  },

  /* Closer, so the ship is a machine rather than a glow at 48dp. */
  shaftnear: {
    crop: 560, drop: 20,
    setup: `
      const dug = [];
      for (let d = 0; d <= 40; d++) dug.push('6,' + d);
      __cw.g.dug = new Set(dug);
      __cw.g.px = 6; __cw.g.pd = 22;
      __cw.advance(0.4);
      __cw.R.held = 'down';
      __cw.advance(0.5);
    `
  },

  shaftmid: {
    crop: 640, drop: 0,
    setup: `
      const dug = [];
      for (let d = 0; d <= 40; d++) dug.push('6,' + d);
      __cw.g.dug = new Set(dug);
      __cw.g.px = 6; __cw.g.pd = 22;
      __cw.advance(0.4);
      __cw.R.held = 'down';
      __cw.advance(0.5);
    `
  },

  /* The same, wider: more wall, smaller ship. */
  shaftwide: {
    crop: 1080, drop: 60,
    setup: `
      const dug = [];
      for (let d = 0; d <= 40; d++) dug.push('6,' + d);
      __cw.g.dug = new Set(dug);
      __cw.g.px = 6; __cw.g.pd = 22;
      __cw.advance(0.4);
      __cw.R.held = 'down';
      __cw.advance(0.5);
    `
  },

  /* A gallery rather than a shaft: the ship cutting sideways, so the picture
     is a lit chamber in rock instead of a bright vertical stripe. */
  gallery: {
    crop: 820, drop: 0,
    setup: `
      const dug = [];
      for (let d = 0; d <= 24; d++) dug.push('6,' + d);
      for (let x = 3; x <= 9; x++) dug.push(x + ',24');
      for (let x = 4; x <= 8; x++) dug.push(x + ',25');
      __cw.g.dug = new Set(dug);
      __cw.g.px = 7; __cw.g.pd = 24;
      __cw.advance(0.4);
      __cw.R.held = 'right';
      __cw.advance(0.4);
    `
  },

  /* The objective: an Anchor in its hall, which is the one thing in the world
     that makes its own light. `hallEye` is where the way in starts.

     KEPT, AND IT DOES NOT WORK YET. Standing two cells off the Anchor lights
     it, and lighting it stops the clock on the event card, so the shot is a
     dark room with THE ANCHOR WAKES over it. Anyone wanting this framing has to
     park outside the trigger or dismiss the card first. It stays in the list
     because deleting it would mean the next session tries it again from
     scratch and finds the same card. */
  anchor: {
    crop: 900, drop: 0,
    setup: `
      const hall = __cw.hallEye();
      __cw.g.px = hall.px; __cw.g.pd = hall.pd + 2;
      __cw.resetBlocks();
      __cw.advance(0.6);
    `
  }
};

/* ---------- the run ---------- */

const FLAGS = ['--write', '--mono'];
const arg = process.argv.slice(2).filter((a) => !FLAGS.includes(a));
const write = process.argv.includes('--write');
const mono = process.argv.includes('--mono');
const names = mono && !arg.length ? [] : (arg.length ? arg : Object.keys(PRESETS));

for (const n of names) {
  if (!PRESETS[n]) {
    console.error('unknown preset "' + n + '". known: ' + Object.keys(PRESETS).join(', '));
    process.exit(1);
  }
}
if (write && names.length !== 1) {
  console.error('--write takes exactly one preset, so the icon has one author');
  process.exit(1);
}

const server = await serve();
const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });

/* One page for the game, one to downsample in. `createImageBitmap` with
   resizeQuality high is chromium's own filter, which is why the grain reads
   at 512 instead of turning into speckle. */
const sizer = await browser.newPage();
await sizer.goto('about:blank');

async function downsample(png, side) {
  return Buffer.from(await sizer.evaluate(async ([b64, px]) => {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([bin], { type: 'image/png' }),
      { resizeWidth: px, resizeHeight: px, resizeQuality: 'high' });
    const cv = new OffscreenCanvas(px, px);
    cv.getContext('2d').drawImage(bmp, 0, 0);
    const out = await cv.convertToBlob({ type: 'image/png' });
    const buf = new Uint8Array(await out.arrayBuffer());
    let s = '';
    for (const c of buf) s += String.fromCharCode(c);
    return btoa(s);
  }, [png.toString('base64'), side]), 'base64');
}

for (const name of names) {
  const preset = PRESETS[name];
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('http://127.0.0.1:' + PORT + '/?debug');
  await page.waitForFunction(() => !!window.__cw, null, { timeout: 20_000 });
  await page.waitForFunction(
    () => document.getElementById('boot').classList.contains('hidden'), null, { timeout: 20_000 });

  /* The way in is crossed and never bypassed, for the reason CLAUDE.md gives. */
  await page.evaluate(() => {
    const skip = document.getElementById('introSkip');
    if (skip && !document.getElementById('intro').classList.contains('hidden')) skip.click();
    const cont = document.getElementById('btnContinue');
    if (cont && !document.getElementById('title').classList.contains('hidden')) {
      (cont.disabled ? document.getElementById('btnNewGame') : cont).click();
    }
  });
  await page.evaluate(() => window.__cw.advance(8));
  await page.waitForFunction(() => window.__cw.g.mode === 'play', null, { timeout: 15_000 });

  /* Everything the player's thumb needs and the icon does not. The renderer's
     own vignette and haze stay, because those are the picture. */
  await page.addStyleTag({
    content: '#hud,#actions,#cluster,#kit,#ord,#ctrl,#vignette,#heat,#dry,#alarm{display:none!important}'
  });

  await page.evaluate(preset.setup);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

  /* Where the ship actually is on screen. The lamp rides the ship exactly
     (loop.ts sets it to px, py every frame), and asking the camera to project
     it beats assuming the framing, which leads the ship downward by a margin
     that is itself a tuned number. */
  const at = await page.evaluate(() => {
    const v = window.__cw.lamp.position.clone().project(window.__cw.camera);
    return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
  });

  const side = preset.crop;
  const cx = Math.min(Math.max(at.x, side / 2), W - side / 2);
  const cy = Math.min(Math.max(at.y + (preset.drop || 0), side / 2), H - side / 2);
  const clip = { x: cx - side / 2, y: cy - side / 2, width: side, height: side };

  const full = await page.screenshot({ clip });
  await writeFile(join(OUT, 'icon-' + name + '-512.png'), await downsample(full, 512));
  await writeFile(join(OUT, 'icon-' + name + '-48.png'), await downsample(full, 48));
  if (write) await writeFile(join(ROOT, 'public', 'icon-512.png'), await downsample(full, 512));

  console.log(name.padEnd(10) + ' ship at ' + at.x.toFixed(0) + ',' + at.y.toFixed(0) +
    '  crop ' + side + ' at ' + clip.x.toFixed(0) + ',' + clip.y.toFixed(0) +
    (errors.length ? '  CONSOLE ERRORS: ' + errors.join(' | ') : ''));
  await page.close();
}

/* ---------- the two vector siblings ----------

   icon.svg is the favicon and the manifest's "sizes: any" entry; the browser
   picks between it and the PNG and does not say which. icon-monochrome.svg is
   Android's themed icon, of which only the alpha survives.

   Rasterising the monochrome one here rather than by hand is the point: its own
   header has said "if you change one, change both" since the day it was
   written, and a sentence is not a mechanism. `omitBackground` is what keeps
   the alpha, and without it Android tints a solid square. */
if (mono) {
  for (const [src, out, alpha] of [
    ['icon-monochrome.svg', join(ROOT, 'public', 'icon-monochrome.png'), true],
    ['icon.svg', join(OUT, 'icon-svg-512.png'), false]
  ]) {
    const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
    /* The markup inlined into a blank page, rather than navigated to: an SVG
       opened directly is an SVG document, with no <head> to style and no way to
       make the page behind it transparent. It is read from `public/` rather
       than from `dist/`, so the two SVGs do not need a build to be rasterised. */
    const svg = await readFile(join(ROOT, 'public', src), 'utf8');
    await page.setContent(
      '<style>html,body{margin:0;background:transparent}svg{display:block}</style>' + svg);
    const png = await page.screenshot({ omitBackground: alpha });
    await writeFile(out, png);
    if (alpha) await writeFile(join(OUT, 'icon-mono-48.png'), await downsample(png, 48));
    console.log(src.padEnd(22) + ' -> ' + out);
    await page.close();
  }
}

if (write) console.log('wrote public/icon-512.png');
console.log('out: ' + OUT);

await browser.close();
server.close();
