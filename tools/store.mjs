/* The Play listing images for The Lattice, rendered from the built game.

   The Godot games do this with `scripts\store.ps1`, which drives their
   `Main.dev_seek` through `scripts\shot.gd`. This game is a web game and has
   neither, but it has the same seam under a different name: `window.__cw`, the
   debug handle `tools/filmstrip.mjs` already drives.

   IT SHOOTS AT 1080x1920, the 9:16 Play needs for its recommendation formats
   (install-drivers.md S2 and G6). The phone's own 1080x2340 is 2.167:1 and is
   REJECTED. Each frame is drawn at twice that (2160x3840) and scaled down by
   ffmpeg, which is the antialiasing a still deserves and a phone frame cannot
   afford.

   AT THE HIGH TIER. The game loads the PC's saved visuals choice, and a fresh
   browser context has none, so it would draw at medium. A still tool applies
   the tier it wants (studio lesson, yardling 2026-10-01).

   CLOSER THAN PLAY. The 2026-10-18 store art audit: "The ship is small in every
   shot. Zoom the camera in for the store shots so the ship reads at thumbnail
   size." The game's camera frames 18 rows. After a state's setup the camera is
   pulled in by `zoom` and nudged by `ox`/`oy` (world cells), then the frame is
   redrawn by `tick(0)`, which moves nothing in the world: every follow is an
   exponential approach on the step, and a step of zero is no motion.

   THE HUD IS HIDDEN in the play shots and a caption band sits over the top of
   each picture, in the game's own Chakra Petch. The band is 15% of the frame
   (Play allows about 20% of text). The fitting bay keeps its own screen,
   because there the screen is the thing being shown.

   Usage:
     npm run build && node tools/store.mjs [--only name,name] [--no-feature]

   Everything lands in store/listing/en-US/images/. Commit it. The coordinator
   syncs that folder to Play. */

import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, mkdir, rm, readdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'store', 'listing', 'en-US', 'images');
const SHOTS = join(OUT, 'phoneScreenshots');
const RAW = join(ROOT, 'test-results', 'store-raw');
/* Its own port: several games build on this machine at once. */
const PORT = 4321;
const W = 1080;
const H = 1920;
const SCALE = 2;

const args = process.argv.slice(2);
/* STORE_ONLY too, since `studio run store-shots` takes no arguments. */
const onlyArg = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',')
  : process.env.STORE_ONLY ? process.env.STORE_ONLY.split(',') : null;
const doFeature = !args.includes('--no-feature') && (!onlyArg || onlyArg.includes('feature'));

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.ico': 'image/x-icon'
};

/* Run in the page before every state: every ore already met (or the first
   find's flash washes the frame white), and a finder for the richest patch of
   ore in a depth range, so a shot stands in front of what the world really put
   there rather than a cell typed into this file. */
const PRELUDE = `
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
`;

/* A mid-game ship: the hardware a player has a few hours in, so the ship in
   every picture is the dressed one rather than the bare starter. */
const DRESS = `
  Object.assign(__cw.g.up, { drill: 4, cargo: 3, thrust: 4, tank: 4, cool: 4, scan: 2, hull: 5, magnet: 1 });
  __cw.setDrillTier(4); __cw.setUpgradeHardware(__cw.g.up);
`;

/* Eight moments, eight different places. The first three sell the core fun at
   a glance: the drill in ore, the colors down there, and the pad you sell at. */
const STATES = [
  {
    name: 'drill-seam',
    caption: 'Drill deep for <b>shiny ore</b>',
    enter: true,
    setup: `
      ${DRESS}
      const r = __richest(64, 110, 2, 3, ['gold', 'amethyst', 'silver']);
      const X = r.x, D = r.d - 2;
      const dug = [];
      for (let d = 0; d <= D - 1; d++) dug.push(X + ',' + d);
      __cw.g.dug = new Set(dug);
      __cw.g.px = X; __cw.g.pd = D - 1;
      __cw.resetBlocks();
      __cw.advance(0.6);
      __cw.R.held = 'down';
      __cw.advance(0.55);
    `,
    frame: { zoom: 0.55, oy: -0.6 },
    assert: `__cw.g.pd > 20`
  },
  {
    name: 'gem-tunnel',
    caption: 'Treasure in <b>every layer</b>',
    /* A side tunnel through the richest row of the deep middle, lit end to end
       by the ship's own Flare Line, the way a player sees a whole wall at once. */
    enter: true,
    setup: `
      ${DRESS}
      __cw.g.best.depth = 400; __cw.g.ground.gates = [0, 1];
      __cw.g.found.push('flare'); __cw.g.up.flare = 4;
      const r = __richest(140, 200, 3, 3, ['ruby', 'emerald', 'amethyst', 'gold', 'magmite']);
      const X = r.x, D = r.d;
      const dug = [];
      for (let d = 0; d <= D; d++) dug.push((X + 2) + ',' + d);
      for (let x = X - 3; x <= X + 2; x++) dug.push(x + ',' + D);
      __cw.g.dug = new Set(dug);
      __cw.g.px = X + 1; __cw.g.pd = D; __cw.g.face = 'left';
      __cw.resetBlocks();
      __cw.advance(0.5);
      __cw.throwFlare();
      __cw.advance(1.5);
    `,
    frame: { zoom: 0.62, ox: -1.2 },
    assert: `__cw.g.pd > 100`
  },
  {
    name: 'surface',
    caption: 'Sell your haul, <b>dive again</b>',
    enter: true,
    setup: `
      ${DRESS}
      __cw.R.held = 'down';
      __cw.advance(1.2);
    `,
    frame: { zoom: 0.8, ox: 1.2, oy: 2.2 },
    assert: `__cw.g.pd > 0.5`
  },
  {
    name: 'key-find',
    caption: 'Find the <b>crystal keys</b>',
    enter: true,
    setup: `
      ${DRESS}
      const pk = __cw.keyPockets(0).pockets.find((p) => p.id === 'emerald');
      const KX = pk.cells[0][0], KD = pk.cells[0][1];
      __cw.g.ground.gates = [0];
      const dug = [];
      for (let d = 0; d <= KD - 2; d++) dug.push(KX + ',' + d);
      __cw.g.dug = new Set(dug);
      __cw.g.px = KX; __cw.g.pd = KD - 2;
      __cw.resetBlocks();
      __cw.advance(0.8);
    `,
    frame: { zoom: 0.5, oy: -1.0 },
    assert: `__cw.g.pd > 2`
  },
  {
    name: 'upgrade-bay',
    caption: 'Upgrade your <b>drill ship</b>',
    /* Reached the way a player reaches it: standing at the gate's station and
       pressing the button. A mid-game purse, not a debug one. The bay is a
       screen with its own header, so the band goes above it, not over it. */
    enter: true,
    hud: true,
    bandAbove: true,
    setup: `
      ${DRESS}
      __cw.g.credits = 18450; __cw.g.best.depth = 140; __cw.g.ground.gates = [0];
      for (const k of ['amethyst','emerald','ruby']) __cw.g.stock[k] = 3;
      __cw.g.px = __cw.coreColumn(0); __cw.g.pd = __cw.gateDepth(0) - 1;
      __cw.advance(0.5);
      document.getElementById('btnShop').click();
    `,
    /* The room's models arrive in their own chunk the first time the bay
       opens; a shot before they land is a ship in a black void. */
    waitFor: `__cw.roomReady()`,
    after: `__cw.selectSystem && __cw.selectSystem('drill'); __cw.advance(1.5)`,
    assert: `__cw.roomPlace() === 0`
  },
  {
    name: 'glowing-deep',
    caption: 'Dig to the <b>glowing deep</b>',
    /* Past the third barrier, where the ores light themselves: the richest
       patch of magmite and coreite, a flare thrown along a short cut. */
    enter: true,
    setup: `
      ${DRESS}
      __cw.g.best.depth = 420; __cw.g.ground.gates = [0, 1, 2];
      __cw.g.ground.lit = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      __cw.g.found.push('flare'); __cw.g.up.flare = 4;
      __cw.g.up.drill = 8; __cw.setDrillTier(8);
      const r = __richest(255, 330, 3, 3, ['coreite', 'magmite', 'ruby', 'umbrite']);
      const X = r.x, D = r.d;
      const dug = [];
      /* Cut the other way from shot two, so the two tunnels are not twins. */
      for (let d = 0; d <= D; d++) dug.push((X - 2) + ',' + d);
      for (let x = X - 2; x <= X + 3; x++) dug.push(x + ',' + D);
      __cw.g.dug = new Set(dug);
      __cw.g.px = X - 1; __cw.g.pd = D; __cw.g.face = 'right';
      __cw.resetBlocks();
      __cw.advance(0.5);
      __cw.throwFlare();
      __cw.advance(1.5);
    `,
    frame: { zoom: 0.56, ox: 1.2, oy: 0.6 },
    assert: `__cw.g.pd > 250`
  },
  {
    name: 'barrier-core',
    caption: 'Smash the <b>barrier core</b>',
    enter: true,
    setup: `
      ${DRESS}
      const CX = __cw.coreColumn(0), CD = __cw.gateDepth(0);
      const dug = [];
      for (let d = 0; d <= CD - 4; d++) dug.push(CX + ',' + d);
      for (let x = CX - 4; x <= CX + 4; x++) for (let d = CD - 4; d <= CD - 1; d++) dug.push(x + ',' + d);
      __cw.g.dug = new Set(dug);
      __cw.g.ground.lit = __cw.gateAnchors(0).slice();
      __cw.g.px = CX; __cw.g.pd = CD - 3;
      __cw.resetBlocks();
      __cw.advance(2.5);
    `,
    frame: { zoom: 0.62, oy: -0.8 },
    assert: `__cw.g.pd > 2`
  },
  {
    name: 'vault',
    caption: 'Open the <b>Vault</b> at the core',
    /* The Vault's door with all nine Anchors broken, the ship at its sill.
       (The ending's own burst was tried: at a still it reads as an empty red
       room, because the door is already gone.) */
    enter: true,
    setup: `
      ${DRESS}
      const VX = __cw.VAULT_CORE_X, VD = __cw.VAULT_CORE_D;
      const dug = [];
      for (let x = VX - 5; x <= VX + 5; x++) for (let d = VD - 6; d <= VD - 1; d++) dug.push(x + ',' + d);
      __cw.g.dug = new Set(dug);
      __cw.g.ground.lit = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      __cw.g.ground.gates = [0, 1];
      __cw.g.px = VX; __cw.g.pd = VD - 2;
      __cw.resetBlocks();
      __cw.advance(2.5);
    `,
    frame: { zoom: 0.58, oy: -0.8 },
    assert: `__cw.g.pd > 300`
  }
];

/* The feature graphic: the ship cutting into the gold, the same subject as his
   icon pick, right of center so Play's play button in the middle never sits on
   it, no text (art KNOWLEDGE R14, thumbnails.md section 4). */
const FEATURE = {
  name: 'feature',
  enter: true,
  /* Shot one's seam, with a flare thrown left along a short side cut first so
     the ore left of the ship is lit rather than a black void. */
  setup: `
    ${DRESS}
    __cw.g.best.depth = 400; __cw.g.ground.gates = [0, 1];
    __cw.g.found.push('flare'); __cw.g.up.flare = 4;
    const r = __richest(64, 110, 2, 3, ['gold', 'amethyst', 'silver']);
    const X = r.x, D = r.d - 2;
    const dug = [];
    for (let d = 0; d <= D - 1; d++) dug.push(X + ',' + d);
    for (let x = X - 5; x < X; x++) dug.push(x + ',' + (D - 2));
    __cw.g.dug = new Set(dug);
    __cw.g.px = X; __cw.g.pd = D - 2; __cw.g.face = 'left';
    __cw.resetBlocks();
    __cw.advance(0.4);
    __cw.throwFlare();
    __cw.advance(0.3);
    __cw.g.face = 'down';
    __cw.R.held = 'down';
    __cw.advance(0.9);
  `,
  frame: { zoom: 0.6, ox: -2.4, oy: -0.2 }
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

/* PNG IHDR, read byte by byte as numbers. */
async function pngInfo(path) {
  const b = await readFile(path);
  if (b.length < 26 || b[0] !== 0x89 || b[1] !== 0x50) return null;
  const w = (b[16] << 24) + (b[17] << 16) + (b[18] << 8) + b[19];
  const h = (b[20] << 24) + (b[21] << 16) + (b[22] << 8) + b[23];
  return { w, h, colorType: b[25], bytes: b.length };
}

const HIDE_HUD = `#hud,#actions,#cluster,#ctrl,#kit,#toast,#savedMark,#found,#anchors,#callLamp,
  #keyNear,#timedWrap,#ord,#abil,#event{display:none!important}`;

const BAND = `
  #storeBand{position:fixed;left:0;top:0;width:100%;height:288px;z-index:99999;pointer-events:none;
    display:flex;align-items:center;justify-content:center;padding:0 48px 30px;box-sizing:border-box;
    background:linear-gradient(to bottom,rgba(9,8,12,.94) 0,rgba(9,8,12,.88) 72%,rgba(9,8,12,0) 100%)}
  #storeBand span{font-family:'Chakra Petch',sans-serif;font-weight:700;font-size:74px;line-height:1.05;
    color:#fff;text-align:center;letter-spacing:.5px;text-shadow:0 4px 0 rgba(0,0,0,.55)}
  #storeBand b{color:#ffc84a}`;

async function shoot(browser, state, file, vw, vh) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: SCALE, hasTouch: true });
  /* The tier before the bundle reads it. */
  await ctx.addInitScript(() => { try { localStorage.setItem('coreward.visuals', 'high'); } catch { /* none */ } });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') problems.push(state.name + ': ' + m.text()); });
  page.on('pageerror', (e) => problems.push(state.name + ': UNCAUGHT: ' + e.message));

  await page.goto('http://127.0.0.1:' + PORT + '/?debug');
  await page.waitForFunction(() => !!window.__cw, null, { timeout: 30_000 });
  await page.waitForFunction(
    () => document.getElementById('boot').classList.contains('hidden'), null, { timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);

  /* A state about PLAY crosses the way in first, the way a player does. */
  if (state.enter) {
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

  await page.evaluate(PRELUDE);
  await page.evaluate(state.setup);
  if (state.waitFor) await page.waitForFunction(state.waitFor, null, { timeout: 20_000 });
  if (state.after) await page.evaluate(state.after);

  /* Assert the STATE, not the picture: two frames of this game are never
     byte-identical, so only the game's own terms say the shot arrived. */
  if (state.assert) {
    const got = await page.evaluate(state.assert);
    if (!got) {
      const pd = await page.evaluate(() => window.__cw.g.pd);
      throw new Error(`state '${state.name}' never arrived: ${state.assert} was false (depth ${pd})`);
    }
  }

  if (state.frame) {
    await page.evaluate((f) => {
      const c = window.__cw.camera;
      const p = window.__cw.player.position;
      /* Centered on the ship (the follow lags a teleport), then pulled in. */
      c.position.x = p.x + (f.ox || 0);
      c.position.y = p.y + (f.oy || 0);
      c.position.z = c.position.z * (f.zoom || 1);
      window.__cw.R.shake = 0;
      window.__cw.tick(0, true);
    }, state.frame);
  }

  const overlay = state.caption && !state.bandAbove;
  const css = (state.hud ? '' : HIDE_HUD) + (overlay ? BAND : '');
  if (css) await page.addStyleTag({ content: css });
  if (overlay) {
    await page.evaluate((cap) => {
      const d = document.createElement('div');
      d.id = 'storeBand';
      d.innerHTML = '<span>' + cap + '</span>';
      document.body.appendChild(d);
    }, state.caption);
  }
  await page.evaluate(() => document.fonts.ready);
  /* The page composites the canvas as last drawn; a paint for the band. */
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.screenshot({ path: file });
  const where = await page.evaluate(() => [window.__cw.g.px, Math.round(window.__cw.g.pd)]);
  await ctx.close();
  return where;
}

/* The same band, drawn on its own, for a screen that has a header of its own
   and is shot BAND_H shorter: the band then sits above it rather than over it. */
const BAND_H = 288;
async function bandAbove(browser, caption, shotFile) {
  const ctx = await browser.newContext({ viewport: { width: W, height: BAND_H }, deviceScaleFactor: SCALE });
  const page = await ctx.newPage();
  /* On the game's own origin first, or the font is a cross-origin load. */
  await page.goto('http://127.0.0.1:' + PORT + '/band');
  await page.setContent(`<html><head><style>
    @font-face{font-family:'Chakra Petch';font-weight:700;src:url('/fonts/chakrapetch-700.woff2')}
    html,body{margin:0;background:#09080c}
    ${BAND.replace('rgba(9,8,12,0) 100%', 'rgba(9,8,12,.88) 100%')}
  </style></head><body><div id="storeBand"><span>${caption}</span></div></body></html>`);
  await page.evaluate(() => document.fonts.load("700 80px 'Chakra Petch'"));
  await page.evaluate(() => document.fonts.ready);
  const bandFile = shotFile.replace(/\.png$/, '.band.png');
  await page.screenshot({ path: bandFile });
  await ctx.close();
  const tmp = shotFile.replace(/\.png$/, '.stack.png');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', bandFile, '-i', shotFile,
    '-filter_complex', 'vstack=inputs=2', tmp], { stdio: 'inherit' });
  await rm(shotFile);
  await rm(bandFile);
  await rename(tmp, shotFile);
}

/* Down to the listing size, 24-bit RGB with no alpha. */
function downscale(src, dst, w, h) {
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', src,
    '-vf', `scale=${w}:${h}:flags=lanczos`, '-pix_fmt', 'rgb24', dst], { stdio: 'inherit' });
}

if (!existsSync(DIST)) {
  console.error('there is no dist/ to photograph. Run `npm run build` first.');
  process.exit(1);
}

await mkdir(SHOTS, { recursive: true });
await mkdir(RAW, { recursive: true });

/* A full run replaces the whole set, so a renamed shot leaves no orphan. */
if (!onlyArg) {
  for (const f of await readdir(SHOTS)) if (f.endsWith('.png')) await rm(join(SHOTS, f));
}

const server = await serve();
const browser = await chromium.launch({
  /* Headless Chrome has no GPU, so WebGL comes from SwiftShader, as in
     playwright.config.ts. */
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});

const problems = [];
const written = [];
let feature = null;

try {
  for (const [i, state] of STATES.entries()) {
    if (onlyArg && !onlyArg.includes(state.name)) continue;
    const raw = join(RAW, state.name + '.png');
    const where = await shoot(browser, state, raw, W, state.bandAbove ? H - BAND_H : H);
    if (state.bandAbove) await bandAbove(browser, state.caption, raw);
    const file = join(SHOTS, (i + 1) + '-' + state.name + '.png');
    downscale(raw, file, W, H);
    written.push(file);
    console.log('screenshot %d  %s  at %s  "%s"', i + 1, state.name, where.join(','), state.caption.replace(/<\/?b>/g, ''));
  }
  if (doFeature) {
    const raw = join(RAW, 'feature.png');
    await shoot(browser, FEATURE, raw, 1024, 500);
    feature = join(OUT, 'featureGraphic.png');
    downscale(raw, feature, 1024, 500);
    console.log('feature graphic  featureGraphic.png');
  }
} finally {
  await browser.close();
  server.close();
}

/* Everything Play measures, plus whether the game is actually in the picture. */
let bad = 0;
for (const f of [feature, ...written].filter(Boolean)) {
  const sz = await pngInfo(f);
  const name = f.split(/[\\/]/).pop();
  if (!sz) { console.log('  %s  NOT A PNG', name); bad++; continue; }
  let ok;
  if (name === 'featureGraphic.png') ok = sz.w === 1024 && sz.h === 500 && sz.colorType === 2;
  else ok = sz.w === W && sz.h === H && sz.bytes <= 8 * 1024 * 1024;
  console.log('  %s %sx%s %s KB  %s', name.padEnd(24), sz.w, sz.h, Math.round(sz.bytes / 1024), ok ? 'ok' : 'REJECTED BY PLAY');
  if (!ok) bad++;
}

/* Two shots byte-for-byte equal mean a setup never took effect. */
const digests = new Map();
for (const f of written) {
  const hash = (await readFile(f)).toString('base64');
  const name = f.split(/[\\/]/).pop();
  if (digests.has(hash)) {
    console.error('  %s is pixel-for-pixel %s - its setup never took effect', name, digests.get(hash));
    bad++;
  } else digests.set(hash, name);
}

if (problems.length) {
  console.log('\nthe page complained:');
  for (const p of problems.slice(0, 10)) console.log('  ' + p);
}

if (bad) {
  console.error('\n%d image(s) are not fit to send to Play', bad);
  process.exit(1);
}
console.log('\nstore images in store/listing/en-US/images - commit them');
