/* Shoots the built portal game (dist-portal/) for the CrazyGames covers and videos.
   Jobs come from tools/crazygames-jobs.json, because `studio run` takes no arguments.
   Run it with `studio run cg-media`. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'dist-portal');
const OUT = join(ROOT, 'test-results', 'cg');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary', '.ogg': 'audio/ogg'
};
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

const jobs = JSON.parse(await readFile(join(ROOT, 'tools', 'crazygames-jobs.json'), 'utf8'));
const { SCENES } = await import('./scenes.mjs');
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
/* A preview video: real keys on the real build, recorded by the browser. The
   page loads the way CrazyGames shows it (index.html, the phone-shaped frame
   in the window) or, for the portrait one, the game alone filling the screen.
   The debug flag is used once, to stand the ship in the shaft above the ore. */
async function video(job) {
  const { w: W, h: H } = job;
  const dir = join(OUT, 'rec-' + job.video + '-' + H);
  const { execFileSync } = await import('node:child_process');
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir, size: { width: W, height: H } } });
  const page = await ctx.newPage();
  const ctxStart = Date.now();
  if (job.frame) {
    await page.route('**/index.html', async (route) => {
      const r = await route.fetch();
      await route.fulfill({ response: r, body: (await r.text()).replace('src="game.html"', 'src="game.html?debug"') });
    });
    await page.goto(base + 'index.html');
  } else await page.goto(base + 'game.html?debug');
  const gp = () => (job.frame ? page.frames().find((f) => f !== page.mainFrame()) : page);
  await gp().waitForFunction(() => !!window.__cw && document.getElementById('boot').classList.contains('hidden'), null, { timeout: 30000 });
  await gp().evaluate(() => {
    const skip = document.getElementById('introSkip');
    if (skip && !document.getElementById('intro').classList.contains('hidden')) skip.click();
    const cont = document.getElementById('btnContinue');
    if (cont && !document.getElementById('title').classList.contains('hidden')) (cont.disabled ? document.getElementById('btnNewGame') : cont).click();
  });
  await gp().evaluate(() => window.__cw.advance(8));
  await gp().waitForFunction(() => window.__cw.g.mode === 'play', null, { timeout: 15000 });
  await gp().evaluate(SCENES.vein.setup);
  /* advance() stops the real-time clock for good; give it back so the keys play */
  await gp().evaluate(() => window.__cw.startClock());
  await page.waitForTimeout(600);
  const t0 = Date.now();
  const look = (tag) => gp().evaluate(() => `${window.__cw.g.mode} pd=${window.__cw.g.pd.toFixed(1)} px=${window.__cw.g.px.toFixed(1)} held=${window.__cw.R.held} focus=${document.hasFocus()}`).then((s) => console.log(tag, s));
  await look('before');
  const key = async (k, ms) => { await page.keyboard.down(k); await page.waitForTimeout(ms); await page.keyboard.up(k); };
  /* down through the last rock into the ore, sweep it, then on down */
  await key('ArrowDown', 3500);
  await look('after down');
  await key('ArrowLeft', 900);
  await key('ArrowDown', 1500);
  await key('ArrowRight', 1200);
  await key('ArrowDown', 1500);
  await key('ArrowLeft', 1000);
  await key('ArrowDown', 2500);
  await key('ArrowRight', 900);
  await key('ArrowDown', 2500);
  await key('ArrowLeft', 700);
  await key('ArrowDown', 3000);
  const start = (t0 - ctxStart) / 1000;
  const vpath = await page.video().path();
  await page.screenshot({ path: join(OUT, 'last-' + job.video + '.png') });
  await ctx.close();
  console.log('recorded', vpath, 'play began', start);
  /* trim to the play: the offset is how long after the recording began the play did */
  const begin = Math.max(0, (t0 - ctxStart) / 1000 - 0.2);
  /* The video opens on the cover (1.2 s of it) and fades into the play, 19.1 s in all. */
  const src = ['-loop', '1', '-t', '1.2', '-i', join(OUT, job.open), '-ss', String(begin), '-t', '18.3', '-i', vpath];
  const fc = `[0:v]scale=${W}:${H},fps=30,format=yuv420p[a];[1:v]scale=${W}:${H},fps=30,format=yuv420p[b];[a][b]xfade=transition=fade:duration=0.4:offset=0.8[v]`;
  const store = join(ROOT, 'store', 'crazygames');
  const master = join(OUT, 'master-' + job.video.replace('.mp4', '') + '-' + W + 'x' + H + '.mp4');
  execFileSync('ffmpeg', ['-y', ...src, '-filter_complex', fc, '-map', '[v]', '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', master], { stdio: 'ignore' });
  if (job.out) {
    execFileSync('ffmpeg', ['-y', '-i', master, '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', join(store, job.video)], { stdio: 'ignore' });
  }
  if (job.upload) {
    /* two passes at 3500 kbps keep 19 s well under the browser tool's 10 MB */
    await mkdir(join(store, 'upload'), { recursive: true });
    const log = join(OUT, 'pass-' + job.video);
    execFileSync('ffmpeg', ['-y', '-i', master, '-c:v', 'libx264', '-b:v', '3500k', '-pass', '1', '-passlogfile', log, '-an', '-f', 'null', 'NUL'], { stdio: 'ignore' });
    execFileSync('ffmpeg', ['-y', '-i', master, '-c:v', 'libx264', '-b:v', '3500k', '-pass', '2', '-passlogfile', log, '-an', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(store, 'upload', job.video)], { stdio: 'ignore' });
  }
}

/* The contact sheet: each video at eight even moments, the three covers above them. */
async function sheet() {
  await sheetFrames();
  const f = (p) => 'file:///' + join(ROOT, p).replace(/\\/g, '/');
  const html = join(OUT, 'sheet.html');
  await writeFile(html, `<body style="margin:0;background:#111;width:1920px;color:#ccc;font:16px sans-serif">
<div style="display:flex;gap:12px;padding:12px;align-items:flex-start">
<div>cover-landscape 1920x1080<br><img src="${f('store/crazygames/cover-landscape.png')}" width="1000"></div>
<div>portrait 800x1200<br><img src="${f('store/crazygames/cover-portrait.png')}" height="470"></div>
<div>square 800x800<br><img src="${f('store/crazygames/cover-square.png')}" height="470"><br>tile size<br>
<img src="${f('store/crazygames/cover-landscape.png')}" height="110"> <img src="${f('store/crazygames/cover-portrait.png')}" height="110"> <img src="${f('store/crazygames/cover-square.png')}" height="110"></div></div>
<div style="padding:0 12px">video-landscape.mp4, 19.5 s, eight moments<br><img src="${f('test-results/cg/sheet-land.png')}" width="1500"></div>
<div style="padding:12px">video-portrait.mp4, 19.5 s, eight moments<br><img src="${f('test-results/cg/sheet-port.png')}" width="1500"></div></body>`);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1200 } });
  await p.goto('file:///' + html.replace(/\\/g, '/'));
  await p.waitForTimeout(500);
  await mkdir(join(ROOT, 'journal'), { recursive: true });
  await p.screenshot({ path: join(ROOT, 'journal', 'crazygames-media-sheet.png'), fullPage: true });
  await b.close();
}
async function sheetFrames() {
  const { execFileSync } = await import('node:child_process');
  const dir = join(ROOT, 'store', 'crazygames');
  for (const v of ['video-landscape.mp4', 'video-portrait.mp4']) {
    console.log(v, execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,pix_fmt,width,height,r_frame_rate:format=duration,size', '-of', 'default=nw=1', join(dir, v)]).toString().replace(/\n/g, ' '));
    const n = v.includes('landscape') ? 'land' : 'port';
    execFileSync('ffmpeg', ['-y', '-i', join(dir, v), '-vf', 'fps=8/19.5,scale=' + (n === 'land' ? '480:-1' : '270:-1') + ',tile=' + (n === 'land' ? '4x2' : '8x1'), '-frames:v', '1', join(OUT, 'sheet-' + n + '.png')], { stdio: 'ignore' });
  }
}

for (const job of jobs) {
  if (job.sheet) { await sheet(); continue; }
  if (job.video) { await video(job); continue; }
  const { scene: sceneName, w: W, h: H } = job;
  const scene = SCENES[sceneName];
  const page = await browser.newPage({ viewport: { width: +W, height: +H } });
  await page.goto(base + 'game.html?debug');
  await page.waitForFunction(() => !!window.__cw && document.getElementById('boot').classList.contains('hidden'), null, { timeout: 30000 });
  await page.evaluate(() => {
    const skip = document.getElementById('introSkip');
    if (skip && !document.getElementById('intro').classList.contains('hidden')) skip.click();
    const cont = document.getElementById('btnContinue');
    if (cont && !document.getElementById('title').classList.contains('hidden')) (cont.disabled ? document.getElementById('btnNewGame') : cont).click();
  });
  await page.evaluate(() => window.__cw.advance(8));
  await page.waitForFunction(() => window.__cw.g.mode === 'play', null, { timeout: 15000 });
  if (scene.setup) await page.evaluate(scene.setup);
  if (scene.step) await page.evaluate(scene.step.replaceAll('SECS', String(scene.secs || 0.4)));
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  if (job.cover) {
    /* A cover is the game at its own size with the HUD out of the way and the
       title, nothing else, in the game's own face. */
    await page.addStyleTag({ content: 'body > *:not(#game):not(#vignette):not(canvas):not(#coverTitle){display:none !important}' });
    await page.evaluate(({ y, size }) => {
      const t = document.createElement('div');
      t.id = 'coverTitle';
      t.textContent = 'THE LATTICE';
      t.style.cssText = `position:fixed;left:0;right:0;top:${y}%;text-align:center;z-index:99;pointer-events:none;`
        + `font:700 ${size}px 'Chakra Petch',sans-serif;letter-spacing:.14em;color:#ffe9c4;`
        + 'text-shadow:0 0 18px rgba(255,150,40,.85),0 3px 0 #3a1c06,0 6px 24px rgba(0,0,0,.95);';
      document.body.appendChild(t);
    }, { y: job.titleY, size: Math.round(Math.min(W * 0.1, H * 0.12)) });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const png = await page.screenshot();
    await writeFile(join(OUT, job.cover), png);
    if (job.store) await writeFile(join(ROOT, 'store', 'crazygames', job.cover), png);
  } else await writeFile(join(OUT, `probe-${sceneName}-${W}x${H}.png`), await page.screenshot());
  await page.close();
}
await browser.close();
server.close();
