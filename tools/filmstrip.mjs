/* A contact sheet of the game in motion.

   The tool this repo was missing. Every other way of looking at The Lattice
   produces a STILL - a screenshot, a pixel read, a uniform dumped to the
   console - and half of what the game is judged on is movement. "Make the
   intro less like a slide show" is a note about motion, and there was no way
   to check the answer except to look at one frame and reason about the code
   in between. That is the habit that cost four rounds on the lighting
   artefact, applied to animation.

   So: drive the built game, advance GAME time in fixed steps, screenshot each
   step, and composite the lot into one PNG. A whole sequence becomes a single
   image.

   Three decisions worth stating.

   IT RUNS ON THE TICK SEAM, never on the wall clock. `advance(dt)` steps the
   simulation by a fixed amount however fast the machine is, so the same
   command produces the same sheet on CI, on this PC, and in six months. A
   harness that samples real time is measuring the machine.

   IT COMPOSITES IN THE BROWSER. `sharp` is not a dependency of this repo and
   ASSETS.md is explicit that it should stay that way - it is a
   run-it-once-by-hand tool. The page is already open and already has a canvas
   API, so the frames go back in as data URLs and come out as one image. No
   dependency, no install step.

   IT DRIVES THROUGH `?debug`, NEVER THROUGH AN IMPORT. Under the dev server a
   dynamic `import()` resolves to a different module instance than the one the
   loop is running - the trap that had breakCore sitting in 'boom' forever and
   painted an intro caption from the wrong module. Everything here goes through
   `window.__cw`.

   Usage:
     node scripts/filmstrip.mjs <scenario> [frames] [secondsPerFrame]

   Scenarios are listed in SCENES below. The sheet lands in
   `test-results/film-<scenario>.png` and any console errors are printed after
   it - three separate bugs this session were sitting in the console while I
   looked for them somewhere else. */

import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { SCENES } from './scenes.mjs';

const ROOT = resolve(process.cwd());
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'test-results');
const PORT = 4321;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json'
};

/* The built game, served flat. Deliberately not `vite dev`: the harness should
   look at what ships, and the dev server's module instances are the thing that
   makes `import()` unreliable in the first place. */
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

const name = process.argv[2] || 'intro';
const scene = SCENES[name];
if (!scene) {
  console.error('unknown scenario "' + name + '". known: ' + Object.keys(SCENES).join(', '));
  process.exit(1);
}
const frames = Number(process.argv[3] || scene.frames);
const secs = Number(process.argv[4] || scene.secs);

const server = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

/* Everything the page complains about, kept and printed with the sheet. */
const problems = [];
page.on('console', (m) => {
  if (m.type() === 'error') problems.push(m.text());
});
page.on('pageerror', (e) => problems.push('UNCAUGHT: ' + e.message));

await page.goto('http://127.0.0.1:' + PORT + '/?debug');
await page.waitForFunction(() => !!window.__cw, null, { timeout: 20_000 });
await page.waitForFunction(
  () => document.getElementById('boot').classList.contains('hidden'), null, { timeout: 20_000 });

/* Scenarios about the GAME have to get past the way in first. Skipping it
   here rather than bypassing it with a flag, for the same reason the e2e does:
   a bypass makes the one screen every player crosses the one screen nothing
   ever exercises. */
if (scene.enter) {
  await page.evaluate(() => {
    const skip = document.getElementById('introSkip');
    if (skip && !document.getElementById('intro').classList.contains('hidden')) skip.click();
    const cont = document.getElementById('btnContinue');
    if (cont && !document.getElementById('title').classList.contains('hidden')) {
      (cont.disabled ? document.getElementById('btnNewGame') : cont).click();
    }
  });
  /* The landing flies down before play starts; run it out on the seam. */
  await page.evaluate(() => window.__cw.advance(8));
  await page.waitForFunction(() => window.__cw.g.mode === 'play', null, { timeout: 15_000 });
}

await page.evaluate(scene.setup);

const shots = [];
for (let i = 0; i < frames; i++) {
  if (i > 0) await page.evaluate(scene.step.replaceAll('SECS', String(secs)));
  /* A real frame has to be painted after the state moves, or every capture is
     the frame before it. */
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  shots.push((await page.screenshot()).toString('base64'));
}

/* Composite in the page - see the note at the top on why not sharp. */
const sheet = await page.evaluate(async ({ shots, cols }) => {
  const imgs = await Promise.all(shots.map((b64) => new Promise((ok) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.src = 'data:image/png;base64,' + b64;
  })));
  /* Scaled down hard: the point of a contact sheet is the SEQUENCE, and twenty
     full-size phone screenshots is an image nothing will open. */
  const w = 188, h = 406, pad = 4;
  const rows = Math.ceil(imgs.length / cols);
  const c = document.createElement('canvas');
  c.width = cols * (w + pad) + pad;
  c.height = rows * (h + pad + 14) + pad;
  const x = c.getContext('2d');
  x.fillStyle = '#0b0e14';
  x.fillRect(0, 0, c.width, c.height);
  x.font = '11px monospace';
  imgs.forEach((im, i) => {
    const cx = pad + (i % cols) * (w + pad);
    const cy = pad + Math.floor(i / cols) * (h + pad + 14);
    x.drawImage(im, cx, cy, w, h);
    x.fillStyle = '#7f8a9c';
    x.fillText('#' + i, cx + 2, cy + h + 11);
  });
  return c.toDataURL('image/png');
}, { shots, cols: Math.min(frames, 6) });

mkdirSync(OUT, { recursive: true });
const file = join(OUT, 'film-' + name + '.png');
writeFileSync(file, Buffer.from(sheet.split(',')[1], 'base64'));

await browser.close();
server.close();

console.log('sheet: ' + file);
console.log('frames: ' + frames + ' at ' + secs + ' s of game time each (' +
  (frames * secs).toFixed(1) + ' s total)');
if (problems.length) {
  console.log('\nCONSOLE PROBLEMS (' + problems.length + '):');
  for (const p of problems.slice(0, 12)) console.log('  ' + p.slice(0, 200));
} else {
  console.log('console: clean');
}
