/* The scripted tour for the release check: `film_tour` in studio.toml.

   Plays The Lattice from a wiped save with no input from anyone and writes its OWN movie
   (Playwright's video of the page at the phone's portrait shape, 450x975) to the path after
   `--write-movie`. It is not a replay: every step is code in this file, run against the built
   game, so it follows the game as the game changes.

   The tour, in order (about two and a half minutes of video, hard-capped below):
     1 first launch    the intro, then the title screen of a new player
     2 the menu        settings, then NEW GAME and the descent
     3 first minute    the stock ship digging down from the pad, cards taken as they come
     4 each screen     survey map, manifest, pause, the Outfitter (a buy), the ledger
     5 mechanics       sell at the pad, the Flare Line, the Arc Lance, the Beacon climb,
                       a wreck, breaking a core (the barrier moment)
   Game time goes through the debug seam's `advance` in 1/30 s steps with a real 33 ms wait
   between them, so the video runs at about real speed whatever the machine. The seam is the
   same one tools/filmstrip.mjs and the e2e use. Mechanics 5 are staged the way
   tools/scenes.mjs stages them (the state is written, the act itself is the game's own).

   Usage: node tools/film-tour.mjs --write-movie .studio/film/tour/run.webm */

import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, extname, join, resolve } from 'node:path';

/* `--root DIR` points the tour at another checkout (the desk films a clean `git archive` copy of
   a rev, which has no node_modules and no dist). Default: the folder it runs in. */
const rootAt = process.argv.indexOf('--root');
const ROOT = resolve(rootAt > 0 ? process.argv[rootAt + 1] : process.cwd());
const DIST = join(ROOT, 'dist');
const LIMIT_MS = 12 * 60_000; // under the desk's 15 minute cap, whatever the machine does
const W = 450, H = 975;

const at = process.argv.indexOf('--write-movie');
if (at < 0 || !process.argv[at + 1]) {
  console.error('usage: node tools/film-tour.mjs --write-movie <path> [--root DIR]');
  process.exit(2);
}
const OUT = resolve(process.argv[at + 1]);

/* What ships at this rev, never a stale dist: install if the checkout has no modules (a fresh
   copy), then build. */
function npm(args) {
  const r = spawnSync('npm', args, { cwd: ROOT, stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(1);
}
if (!existsSync(join(ROOT, 'node_modules'))) {
  console.log('tour: no node_modules, npm ci');
  npm(['ci', '--no-audit', '--no-fund']);
}
console.log('tour: building');
npm(['run', 'build']);

const { chromium } = await import('@playwright/test');

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json',
  '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav'
};
const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  try {
    const file = url === '/' ? 'index.html' : url;
    const body = await readFile(join(DIST, file));
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = 'http://127.0.0.1:' + server.address().port;

const tmp = join(dirname(OUT), '.video-tmp');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: W, height: H }, hasTouch: true, serviceWorkers: 'block',
  recordVideo: { dir: tmp, size: { width: W, height: H } }
});
const page = await ctx.newPage();
const problems = [];
page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
page.on('pageerror', (e) => problems.push('UNCAUGHT: ' + e.message));

const started = Date.now();
const over = () => Date.now() - started > LIMIT_MS;
const wait = (ms) => page.waitForTimeout(ms);

/* Game seconds at about real speed, painted as they go so the video moves. `each` runs in the
   page before every step (hold a key, take a card). */
async function play(secs, each = '', dt = 1 / 15) {
  const steps = Math.max(1, Math.round(secs / dt));
  for (let i = 0; i < steps && !over(); i++) {
    await page.evaluate(`(() => { ${each}; __cw.advance(${dt}); })()`);
    await wait(8);
  }
}
/* Play on until the page expression `cond` holds, or `cap` game seconds pass. */
async function playUntil(cond, cap, each = '', dt = 0.1) {
  for (let t = 0; t < cap && !over(); t += dt) {
    if (await page.evaluate(cond)) return true;
    await play(dt, each, dt);
  }
  return false;
}
const click = (id) => page.evaluate((i) => document.getElementById(i)?.click(), id);
const TAKE_CARDS = `
  const ev = document.getElementById('event');
  if (ev && !ev.classList.contains('hidden')) document.getElementById('evBtn')?.click();`;

async function segment(name, fn) {
  const t0 = Date.now();
  try { await fn(); console.log('tour: ' + name + ' ok (' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)'); }
  catch (e) { problems.push(name + ': ' + String(e.message).split('\n')[0]); console.log('tour: ' + name + ' FAILED ' + e.message.split('\n')[0]); }
}

/* Leave whatever screen is open and put the ship where a scene needs it. */
const stage = (js) => page.evaluate(`(() => {
  const sh = document.querySelector('#shop .x'); if (__cw.g.mode === 'shop' && sh) sh.click();
  ${js}
})()`);

await page.goto(base + '/?debug');
await page.waitForFunction(() => !!window.__cw, null, { timeout: 30_000 });
await page.waitForFunction(() => document.getElementById('boot').classList.contains('hidden'), null, { timeout: 60_000 });
await page.evaluate(() => { localStorage.clear(); __cw.stopClock(); });

await segment('1 first launch', async () => {
  await page.evaluate(() => __cw.showTitle());
  await play(4);
});

await segment('2 the menu', async () => {
  await click('btnSettings');
  await play(3);
  await click('btnToMore');
  await play(2);
  await click('pauseX');
  await play(1);
  /* PLAY on a fresh save starts the new game: the intro, the tap, the descent. */
  await click('btnContinue');
  await play(2);
  await click('intro');
  await playUntil(() => __cw.g.mode === 'play', 90);
});

await segment('3 first minute', async () => {
  await play(1);
  await play(40, `${TAKE_CARDS}; __cw.R.held = 'down'`);
  await page.evaluate(() => { __cw.R.held = null; });
});

await segment('4 each screen', async () => {
  await stage(`__cw.g.credits = 6000; __cw.g.best.depth = 40; __cw.g.px = __cw.START_X; __cw.g.pd = -1; __cw.R.held = null;
    __cw.g.cargo = { iron: 6, copper: 3 }; __cw.g.weight = 12; __cw.advance(0.5);`);
  await play(1);
  for (const [open, close] of [['btnMap', 'mapClose'], ['btnManifest', 'manifestClose'], ['btnPause', 'pauseX']]) {
    await click(open);
    await play(2.5);
    await click(close);
    await play(0.5);
  }
  await click('btnShop');
  await play(4);
  await page.evaluate(() => document.querySelector('#shop .bbuy.buy:not([disabled])')?.click());
  await play(3);
  await stage('');
  await click('btnPause');
  await play(1);
  await click('btnLedger');
  await play(3);
  await click('pauseX');
  await play(1);
});

await segment('5a mechanic: sell at the pad', async () => {
  await stage(`__cw.g.px = __cw.START_X; __cw.g.pd = -1; __cw.g.cargo = { iron: 8, copper: 4, silver: 2 };
    __cw.g.weight = 20; __cw.advance(0.4);`);
  await play(1);
  await page.evaluate(() => __cw.sell());
  await play(3, TAKE_CARDS);
});

await segment('5b mechanic: Flare Line', async () => {
  await stage(`const dug = [];
    for (let d = 0; d <= 100; d++) dug.push('20,' + d);
    for (let x = 20; x <= 24; x++) dug.push(x + ',100');
    __cw.g.dug = new Set(dug); __cw.g.best.depth = 400; __cw.g.ground.gates = [0, 1, 2];
    __cw.g.found.push('flare'); __cw.g.up.flare = 4;
    __cw.g.px = 20; __cw.g.pd = 100; __cw.g.face = 'right'; __cw.resetBlocks(); __cw.advance(0.4);`);
  await play(2);
  await page.evaluate(() => __cw.throwFlare());
  await play(6);
});

await segment('5c mechanic: Arc Lance', async () => {
  await stage(`const VX = 16, VD = 72, dug = [];
    for (let d = 0; d <= VD - 4; d++) dug.push(VX + ',' + d);
    __cw.g.dug = new Set(dug); __cw.g.found.push('arc'); __cw.g.up.arc = 4;
    __cw.g.px = VX; __cw.g.pd = VD - 5; __cw.g.face = 'down'; __cw.g.charge = 99;
    __cw.resetBlocks(); __cw.advance(0.4);`);
  await play(2);
  await page.evaluate(() => __cw.fireArc());
  await play(4);
});

await segment('5d mechanic: Beacon climb', async () => {
  await stage(`__cw.g.best.depth = 400; __cw.g.ground.gates = [0, 1, 2];
    __cw.g.found.push('beacon'); __cw.g.up.beacon = 2;
    const dug = [];
    for (let d = 90; d <= 101; d++) for (let x = 29; x <= 31; x++) dug.push(x + ',' + d);
    __cw.g.dug = new Set(dug); __cw.g.px = 30; __cw.g.pd = 100; __cw.g.cargo = { gold: 10 };
    __cw.g.weight = 10 * __cw.ORES.find((o) => o.id === 'gold').wt; __cw.resetBlocks(); __cw.advance(0.5);`);
  await play(2);
  await page.evaluate(() => __cw.useBeacon());
  await play(8);
});

await segment('5e mechanic: a wreck', async () => {
  await stage(`const WX = 10, WD = 46, dug = [];
    for (let d = 0; d <= WD - 6; d++) dug.push(WX + ',' + d);
    __cw.g.dug = new Set(dug); __cw.g.px = WX; __cw.g.pd = WD - 7; __cw.resetBlocks(); __cw.advance(0.5);`);
  await play(10, `${TAKE_CARDS}; __cw.R.held = 'down'`);
  await page.evaluate(() => { __cw.R.held = null; });
});

await segment('5f mechanic: breaking a core', async () => {
  await stage(`const CX = __cw.coreColumn(0), CD = __cw.gateDepth(0), dug = [];
    for (let d = 0; d <= CD; d++) dug.push(CX + ',' + d);
    for (let x = CX - 4; x <= CX + 4; x++) for (let d = CD - 4; d <= CD; d++) dug.push(x + ',' + d);
    __cw.g.dug = new Set(dug); __cw.g.ground.lit = __cw.gateAnchors(0).slice();
    __cw.g.px = CX; __cw.g.pd = CD - 2; __cw.resetBlocks(); __cw.advance(0.3);
    __cw.g.ground.gates.push(0); __cw.coreBroken(0);`);
  await play(10);
});

await ctx.close();
const video = page.video();
await browser.close();
server.close();
rmSync(OUT, { force: true });
renameSync(await video.path(), OUT);
rmSync(tmp, { recursive: true, force: true });

console.log('tour: wrote ' + OUT + ' in ' + ((Date.now() - started) / 1000).toFixed(0) + ' s');
if (problems.length) {
  console.log('tour: CONSOLE PROBLEMS (' + problems.length + '):');
  for (const p of problems.slice(0, 12)) console.log('  ' + p.slice(0, 200));
} else {
  console.log('tour: console clean');
}
