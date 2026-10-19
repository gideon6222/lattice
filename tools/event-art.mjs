/* The Play "Major update" event picture, rendered from the built game.

   Same seam as tools/store.mjs (`window.__cw`), shot at 1920x1080 landscape
   (Play wants 16:9, 1920x1080, no alpha, under 15 MB). No HUD, no caption, no
   words: only what a player sees in the game. The frame is drawn at twice that
   and scaled down by ffmpeg.

   Usage:
     npm run build && node tools/event-art.mjs [--out path]

   Lands in store/events/major-update-<version>/event.png. */

import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'store', 'events', 'major-update-0.57.0');
const RAW = join(ROOT, 'test-results', 'event-raw.png');
/* Its own port: several games build on this machine at once. */
const PORT = 4322;
const W = 1920;
const H = 1080;
const SCALE = 2;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.ico': 'image/x-icon'
};

const HIDE_HUD = `#hud,#actions,#cluster,#ctrl,#kit,#toast,#savedMark,#found,#anchors,#callLamp,
  #keyNear,#timedWrap,#ord,#abil,#event{display:none!important}`;

/* A side tunnel through the richest row of the deep middle, lit end to end by
   the ship's own Flare Line, with every earned gift fitted so the hull shows
   them. */
const SETUP = `
  __cw.g.seenOre = __cw.ORES.map((o) => o.id);
  window.__isOre = (x, d) => {
    const b = __cw.blockAt(x, d);
    return b && __cw.ORES.some((o) => o.id === b.id) ? b.id : null;
  };
  window.__richest = (d0, d1, wx, wy, kinds) => {
    let best = null;
    for (let x = 6; x < __cw.W - 6; x++) for (let d = d0; d <= d1; d++) {
      const seen = new Set(); let n = 0;
      for (let i = -wx; i <= wx; i++) for (let j = -wy; j <= wy; j++) {
        const id = __isOre(x + i, d + j);
        if (id && (!kinds || kinds.includes(id))) { n++; seen.add(id); }
      }
      const s = n + seen.size * 3;
      if (!best || s > best.s) best = { x, d, s, n, kinds: [...seen] };
    }
    return best;
  };
  Object.assign(__cw.g.up, { drill: 4, cargo: 3, thrust: 4, tank: 4, cool: 4, scan: 2, hull: 5, magnet: 1,
    sorter: 3, seal: 4, tip: 4, beacon: 3, flare: 4, arc: 3 });
  __cw.g.found.push('sorter', 'seal', 'tip', 'beacon', 'flare', 'arc');
  __cw.setDrillTier(4); __cw.setUpgradeHardware(__cw.g.up);
  __cw.g.best.depth = 400; __cw.g.ground.gates = [0, 1];
  const r = __richest(140, 200, 4, 3, ['ruby', 'emerald', 'amethyst', 'gold', 'magmite']);
  const X = r.x, D = r.d;
  const dug = [];
  for (let d = 0; d <= D; d++) dug.push((X + 2) + ',' + d);
  for (let x = X - 4; x <= X + 2; x++) dug.push(x + ',' + D);
  __cw.g.dug = new Set(dug);
  __cw.g.px = X + 1; __cw.g.pd = D; __cw.g.face = 'left';
  __cw.resetBlocks();
  __cw.advance(0.5);
  __cw.throwFlare();
  __cw.advance(1.5);
`;
const FRAME = { zoom: Number(process.env.EV_ZOOM || 0.45), ox: Number(process.env.EV_OX || -2.2), oy: Number(process.env.EV_OY || 0) };

const server = await new Promise((ok) => {
  const s = createServer(async (req, res) => {
    const url = (req.url || '/').split('?')[0];
    const file = join(DIST, url === '/' ? 'index.html' : url);
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404).end('not found'); }
  });
  s.listen(PORT, () => ok(s));
});

if (!existsSync(DIST)) { console.error('no dist/: run `npm run build` first'); process.exit(1); }
await mkdir(OUT, { recursive: true });
await mkdir(dirname(RAW), { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
try {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
  await ctx.addInitScript(() => { try { localStorage.setItem('coreward.visuals', 'high'); } catch { /* none */ } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('UNCAUGHT: ' + e.message));
  await page.goto('http://127.0.0.1:' + PORT + '/?debug');
  await page.waitForFunction(() => !!window.__cw, null, { timeout: 30_000 });
  await page.waitForFunction(() => document.getElementById('boot').classList.contains('hidden'), null, { timeout: 30_000 });
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
  await page.evaluate(SETUP);
  await page.evaluate((f) => {
    const c = window.__cw.camera;
    const p = window.__cw.player.position;
    c.position.x = p.x + f.ox;
    c.position.y = p.y + f.oy;
    c.position.z = c.position.z * f.zoom;
    window.__cw.R.shake = 0;
    window.__cw.tick(0, true);
  }, FRAME);
  await page.addStyleTag({ content: HIDE_HUD });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.screenshot({ path: RAW });
  await ctx.close();
} finally {
  await browser.close();
  server.close();
}
const out = join(OUT, 'event.png');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', RAW,
  '-vf', `scale=${W}:${H}:flags=lanczos`, '-pix_fmt', 'rgb24', out], { stdio: 'inherit' });
await rm(RAW);
console.log('wrote', out);
