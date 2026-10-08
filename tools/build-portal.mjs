/* The CrazyGames build: `npm run build:portal`.

   Builds the unchanged game with `vite build --mode portal` into dist-portal/
   (no service worker, no manifest, no outside URLs: see portalPage() in
   vite.config.js), then makes the folder the portal's shape:

   - the game page becomes game.html;
   - a plain index.html at the root holds it in a frame at the phone's own
     shape, centered on a dark background, so a wide desktop window never
     stretches the portrait game (the game sizes itself to its window, so the
     frame is the whole trick and no game code is touched);
   - the files only the installed app used are dropped;
   - build/lattice-crazygames.zip is written with index.html at the root.

   The normal build and the TWA are not touched by any of this. */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { zipSync } from 'fflate';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const out = join(root, 'dist-portal');
const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js');

rmSync(out, { recursive: true, force: true });
execFileSync(process.execPath, [vite, 'build', '--mode', 'portal'], { cwd: root, stdio: 'inherit' });

/* Only the installed app and the Play wrapper read these. */
for (const f of ['.well-known','manifest.webmanifest', 'sw-legacy-cleanup.js', 'icon-monochrome.png', 'icon-monochrome.svg']) {
  rmSync(join(out, f), { recursive: true, force: true });
}

const game = readFileSync(join(out, 'index.html'), 'utf8');
writeFileSync(join(out, 'game.html'), game);

writeFileSync(join(out, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<title>The Lattice</title>
<style>
  html,body{margin:0; height:100%; overflow:hidden; background:#05070d;}
  /* The phone's shape, 1080 x 2340. A window narrower than that shape gets
     the whole window, as a phone does. */
  #frame{
    position:absolute; top:0; bottom:0; left:50%; height:100%;
    width:min(100vw, calc(100vh * 1080 / 2340));
    transform:translateX(-50%); border:0; background:#05070d;
  }
</style>
</head>
<body>
<iframe id="frame" src="game.html" title="The Lattice" allow="autoplay; fullscreen; gamepad"></iframe>
<script>
  /* Keys go to whatever has focus, so keep it on the game: after a click on
     the dark margin, and when the window comes back. */
  var f = document.getElementById('frame');
  function aim(){ try { f.contentWindow.focus(); } catch (x) {} }
  f.addEventListener('load', aim);
  window.addEventListener('focus', aim);
  document.addEventListener('pointerdown', aim);
  aim();
</script>
</body>
</html>
`);

const files = {};
let count = 0;
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else { files[relative(out, p).split(sep).join('/')] = new Uint8Array(readFileSync(p)); count++; }
  }
})(out);

mkdirSync(join(root, 'build'), { recursive: true });
const zipPath = join(root, 'build', 'lattice-crazygames.zip');
writeFileSync(zipPath, zipSync(files, { level: 9 }));
const banned = Object.keys(files).filter((f) => f.includes('.well-known') || f === 'sw.js' || f.startsWith('workbox'));
const registers = Object.entries(files).filter(([f]) => /\.(html|js)$/.test(f))
  .filter(([, b]) => /serviceWorker\s*\.\s*register|serviceWorker\.register/.test(Buffer.from(b).toString('utf8'))).map(([f]) => f);
if (banned.length || registers.length) throw new Error(`portal holds ${banned.concat(registers).join(', ')}`);
console.log('portal: no .well-known, no sw.js, no service worker registration');
const raw =Object.values(files).reduce((a, b) => a + b.length, 0);
console.log(`portal: ${count} files, ${(raw / 1048576).toFixed(2)} MB unpacked, zip ${(statSync(zipPath).size / 1048576).toFixed(2)} MB at ${zipPath}`);
