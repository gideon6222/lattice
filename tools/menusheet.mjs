/* Every menu screen at the phone canvas (360x780 CSS px at density 3, which is
   1080x2340), and the before-and-after contact sheet of them.

   Usage:
     node tools/menusheet.mjs shoot <distDir> <outDir>   one PNG per screen
     node tools/menusheet.mjs sheet <beforeDir> <afterDir> <out.png>

   Serves a built dist, drives it through ?debug and window.__cw like shot.mjs,
   and crosses the way in rather than bypassing it. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json'
};

function serve(root, port) {
  return new Promise((ok) => {
    const s = createServer(async (req, res) => {
      const url = (req.url || '/').split('?')[0];
      const file = join(root, url === '/' ? 'index.html' : url);
      try {
        const body = await readFile(file);
        res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
        res.end(body);
      } catch { res.writeHead(404).end('not found'); }
    });
    s.listen(port, () => ok(s));
  });
}

const mode = process.argv[2];

if (mode === 'shoot') {
  const [dist, out] = [process.argv[3], process.argv[4]];
  await mkdir(out, { recursive: true });
  const server = await serve(dist, 4330);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4330/?debug');
  await page.waitForFunction(() => !!window.__cw, null, { timeout: 30_000 });
  await page.waitForFunction(() => document.getElementById('boot').classList.contains('hidden'), null, { timeout: 30_000 });
  const frames = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const snap = async (name) => { await frames(); await page.waitForTimeout(350); await writeFile(join(out, name + '.png'), await page.screenshot()); };
  const click = (id) => page.evaluate((i) => document.getElementById(i).click(), id);
  const shut = (id) => page.evaluate((i) => document.getElementById(i).click(), id);

  await page.evaluate(() => {
    const skip = document.getElementById('introSkip');
    if (skip && !document.getElementById('intro').classList.contains('hidden')) skip.click();
    const cont = document.getElementById('btnContinue');
    if (cont && !document.getElementById('title').classList.contains('hidden')) {
      (cont.disabled ? document.getElementById('btnNewGame') : cont).click();
    }
  });
  await page.evaluate(async () => {
    const cw = window.__cw;
    const busy = () => document.body.classList.contains('crossing') || cw.g.mode !== 'play';
    for (let i = 0; i < 40 && busy(); i++) { cw.advance(1); await new Promise((r) => requestAnimationFrame(r)); }
  });
  await page.waitForFunction(() => window.__cw.g.mode === 'play', null, { timeout: 15_000 });
  await page.evaluate(() => { const w = window.__cw; w.g.credits = 5400; w.g.best.depth = 120; });

  await snap('1-hud');
  await click('btnPause');
  await snap('2-pause');
  await page.evaluate(() => { const s = document.querySelector('#pause .sheet'); s.scrollTop = s.scrollHeight; });
  const hasPages = await page.evaluate(() => !!document.getElementById('btnToSettings'));
  if (hasPages) {
    await click('btnToSettings'); await snap('3-settings');
    await click('btnToMore'); await snap('4-more');
  } else {
    await snap('4-more');
  }
  await click('btnResume');
  await click('btnMap'); await snap('5-map'); await click('mapClose');
  await click('btnShop'); await snap('6-shop'); await click('shopClose');
  await page.evaluate(() => { window.__cw.advance(0.3); window.__cw.showTitle(); });
  await snap('0-title');
  await browser.close();
  server.close();
  console.log('shots in ' + out);
} else if (mode === 'sheet') {
  const [before, after, outPng] = process.argv.slice(3);
  const names = [['0-title', 'Start'], ['1-hud', 'HUD'], ['2-pause', 'Pause'], ['3-settings', 'Settings'],
    ['4-more', 'More'], ['5-map', 'Map'], ['6-shop', 'Shop']];
  const have = async (d) => new Set(await readdir(d));
  const hb = await have(before), ha = await have(after);
  const cell = async (d, h, n) => h.has(n + '.png')
    ? `<img src="data:image/png;base64,${(await readFile(join(d, n + '.png'))).toString('base64')}">`
    : '<div class="none">no such screen</div>';
  let rows = '';
  for (const [label, d, h] of [['BEFORE', before, hb], ['AFTER', after, ha]]) {
    rows += `<div class="row"><div class="lab">${label}</div>`;
    for (const [n, t] of names) rows += `<div class="c"><div class="t">${t}</div>${await cell(d, h, n)}</div>`;
    rows += '</div>';
  }
  const html = `<style>body{margin:0;background:#111;font:16px sans-serif;color:#ddd}
.row{display:flex;gap:10px;padding:10px;align-items:flex-start}.lab{writing-mode:vertical-rl;font-weight:700;font-size:28px;padding:0 6px}
.c{width:300px}.t{text-align:center;margin-bottom:4px}img{width:300px;display:block;border:1px solid #333}
.none{width:300px;height:650px;border:1px dashed #444;display:flex;align-items:center;justify-content:center;color:#666}</style>${rows}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2300, height: 1500 } });
  await page.setContent(html);
  await mkdir(join(outPng, '..'), { recursive: true });
  await page.screenshot({ path: outPng, fullPage: true });
  await browser.close();
  console.log('sheet: ' + outPng);
} else {
  console.error('usage: shoot <dist> <out> | sheet <before> <after> <out.png>');
  process.exit(1);
}
