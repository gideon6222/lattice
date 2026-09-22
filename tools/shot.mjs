/* One full-resolution screenshot of the built game, at the phone's own aspect.

   `filmstrip.mjs` composites many frames into one sheet, which is the right
   tool for motion and the wrong one for looking closely at a readout: every
   frame comes back at a fraction of its real size, and a six-pixel pip is
   gone. This is its single-frame sibling.

   It shoots at 1080x2340, the S26 Ultra's own panel, because
   `gamedev-notes\CRAFT.md` records that every screenshot this game has ever
   been judged on was taken at the device aspect and that judging a phone game
   at a desktop shape is how the left buttons ended up buried under the fuel
   gauge.

   Same three decisions as filmstrip, for the same reasons: it serves `dist`
   rather than the dev server so it looks at what ships, it drives through
   `?debug` and `window.__cw` rather than through an import, and it advances
   GAME time rather than waiting on the wall clock, so the same command gives
   the same picture on any machine.

   Usage:
     node scripts/shot.mjs <scenario> [outName]

   Scenarios are filmstrip's own - it is imported rather than copied, so a
   scene added there is available here on the same day. */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'test-results');
const PORT = 4322;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json',
  '.map': 'application/json', '.ico': 'image/x-icon'
};

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

const { SCENES } = await import('./scenes.mjs');

const name = process.argv[2] || 'dig';
const outName = process.argv[3] || name;
const scene = SCENES[name];
if (!scene) {
  console.error('unknown scenario "' + name + '". known: ' + Object.keys(SCENES).join(', '));
  process.exit(1);
}

const server = await serve();
const browser = await chromium.launch();
/* The real panel, not a scaled one. deviceScaleFactor stays 1 because the
   point is to count pixels the way the phone lays them out. */
const page = await browser.newPage({ viewport: { width: 1080, height: 2340 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('http://127.0.0.1:' + PORT + '/?debug');
await page.waitForFunction(() => !!window.__cw, null, { timeout: 20_000 });
await page.waitForFunction(
  () => document.getElementById('boot').classList.contains('hidden'), null, { timeout: 20_000 });

/* The way in is crossed and never bypassed, the same sequence filmstrip uses
   and for the reason CLAUDE.md gives: a bypass flag would make the one screen
   every player crosses the one screen nothing exercises. */
if (scene.enter) {
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
}

if (scene.setup) await page.evaluate(scene.setup);
if (scene.step) await page.evaluate(scene.step.replaceAll('SECS', String(scene.secs || 0.4)));
/* A real frame has to be painted after the state moves, or the capture is the
   frame before it. */
await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

await mkdir(OUT, { recursive: true });
const shot = join(OUT, 'shot-' + outName + '.png');
await writeFile(shot, await page.screenshot());

console.log('shot: ' + shot);
console.log('size: 1080x2340');
console.log(errors.length ? 'console errors:\n  ' + errors.join('\n  ') : 'console: clean');

await browser.close();
server.close();
