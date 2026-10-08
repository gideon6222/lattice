/* Plays the portal build (dist-portal/) in headless Chrome from a local static
   server, with real keyboard and mouse input only: boot to flying under 20 s,
   fly with the arrow keys and with the mouse on the d-pad, open the shop, and
   see audio start on the first input. Shots go to test-results/crazygames/.

   Usage: npm run build:portal && node tools/portal-check.mjs */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'dist-portal');
const OUT = join(ROOT, 'test-results', 'crazygames');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary', '.ogg': 'audio/ogg'
};
const SIZES = [['1920x1080', 1920, 1080], ['1366x768', 1366, 768], ['375x812', 375, 812]];

const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  try {
    const f = join(DIR, url.endsWith('/') ? url + 'index.html' : url);
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
    res.end(await readFile(f));
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}/`;
await mkdir(OUT, { recursive: true });

/* flying: the crossing is over, the intro is gone, the d-pad is there */
const flying = (page) => page.waitForFunction(() => {
  const d = document.querySelector('#frame').contentDocument;
  return d && !d.body.classList.contains('crossing') && d.querySelector('#intro').classList.contains('hidden')
    && d.querySelector('#title').classList.contains('hidden');
}, null, { timeout: 50000 }).catch(async (e) => {
  console.log('     stuck:', await page.evaluate(() => {
    const d = document.querySelector('#frame').contentDocument;
    return d.body.className + ' | intro=' + d.getElementById('intro').className + ' | title=' + d.getElementById('title').className
      + ' | tap=' + d.getElementById('introTap').className + ' | text=' + d.getElementById('introText').textContent;
  }));
  const f = await page.evaluate(() => new Promise((ok) => {
    const w = document.querySelector('#frame').contentWindow; let n = 0; const t = w.performance.now();
    const step = () => { n++; if (w.performance.now() - t < 2000) w.requestAnimationFrame(step); else ok(n / 2); };
    w.requestAnimationFrame(step);
  }));
  console.log('     frames per second in the frame:', f);
  throw e;
});

const browser =await chromium.launch({ args: (process.env.PORTAL_SOFTWARE_GL
  ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  : ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']) });
let failed = false;
const say = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) failed = true; };

for (const [name, w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: name === '375x812' });
  const page = await ctx.newPage();
  const errors = [];
  const external = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', (r) => { if (!r.url().startsWith(base) && !/^(blob|data):/.test(r.url())) external.push(r.url()); });
  const game = page.frameLocator('#frame');
  const t0 = Date.now();
  await page.goto(base);
  await game.locator('#boot').waitFor({ state: 'hidden', timeout: 15000 });

  /* the frame: phone shape, centered, never stretched */
  const box = await page.locator('#frame').boundingBox();
  const want = Math.min(w, h * 1080 / 2340);
  say(Math.abs(box.width - want) < 1.5 && Math.abs(box.x + box.width / 2 - w / 2) < 1.5 && box.height === h,
    `${name}: frame ${box.width.toFixed(0)}x${box.height} at x=${box.x.toFixed(0)}`);
  /* a first run opens on the intro, with no title in front of it */
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, `${name}-1-intro.png`) });

  /* the tap that begins the intro is also the first input */
  await game.locator('#intro').click({ force: true });
  await flying(page);
  const secs = (Date.now() - t0) / 1000;
  /* the portal's intro has SKIP from the first second and a tap skips it */
  say(secs < 20, `${name}: brand-new player, page open to flying in ${secs.toFixed(1)} s`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: join(OUT, `${name}-2-flying.png`) });

  const depth = () => game.locator('#depth').innerText();

  /* arrow keys: hold down, depth must change */
  const d0 = await depth();
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(2500);
  await page.keyboard.up('ArrowDown');
  const d1 = await depth();
  say(d1 !== d0, `${name}: arrow keys fly (${d0} -> ${d1})`);

  /* mouse on the d-pad: hold the down key, depth must change again */
  const key = game.locator('#dpad .k[data-dir=down]');
  const kb = await key.boundingBox();
  await page.mouse.move(kb.x + kb.width / 2, kb.y + kb.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2500);
  await page.mouse.up();
  const d2 = await depth();
  say(d2 !== d1, `${name}: mouse on the d-pad flies (${d1} -> ${d2})`);
  await page.screenshot({ path: join(OUT, `${name}-3-dpad.png`) });

  /* back up to the pad and open the shop */
  await page.keyboard.down('ArrowUp');
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(500);
    if (await game.locator('#btnShop').isVisible()) break;
  }
  await page.keyboard.up('ArrowUp');
  const shopBtn = game.locator('#btnShop');
  if (await shopBtn.isVisible()) {
    await shopBtn.click();
    await game.locator('#shop:not(.hidden)').waitFor({ timeout: 5000 }).catch(() => {});
    say(await game.locator('#shop').evaluate((e) => !e.classList.contains('hidden')), `${name}: shop opens`);
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(OUT, `${name}-4-shop.png`) });
  } else say(false, `${name}: shop button never showed`);

  /* a returning player: reload, PLAY, and fly inside 20 s of the page opening */
  await game.locator('#shopClose').click().catch(() => {});
  await page.waitForTimeout(3000);
  const t1 = Date.now();
  await page.reload();
  await game.locator('#btnContinue').click({ timeout: 15000 });
  await flying(page);
  const back = (Date.now() - t1) / 1000;
  say(back < 20, `${name}: returning player, page open to flying in ${back.toFixed(1)} s`);

  say(external.length === 0, `${name}: no requests outside the build ${external.join(' ')}`);
  say(errors.length === 0, `${name}: no console errors ${errors.slice(0, 3).join(' | ')}`);
  await ctx.close();
}

/* audio: no context before the first real input, a running one after it */
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto(base + 'game.html?debug');
  await page.locator('#boot').waitFor({ state: 'hidden', timeout: 15000 });
  const before = await page.evaluate(() => window.__cw.audioCtxState());
  await page.mouse.click(180, 400);
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => window.__cw.audioCtxState());
  say(before === 'closed' && after === 'running', `audio: ${before} before the first input, ${after} after`);
  await ctx.close();
}
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
