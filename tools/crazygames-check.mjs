/* Checks the CrazyGames media in store/crazygames/: cover sizes, the title kept out
   of the top-left quarter (their labels cover it), and the videos (H.264, no audio,
   at most 20 s, the sizes asked for, the upload copies under 9.5 MB).
   Run it with `studio run crazygames`. */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'store', 'crazygames');
let failed = false;
const say = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) failed = true; };

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, w, h] of [['cover-landscape.png', 1920, 1080], ['cover-portrait.png', 800, 1200], ['cover-square.png', 800, 800]]) {
  const b64 = (await readFile(join(DIR, name))).toString('base64');
  /* title pixels are the pale cream of the title face, which nothing else in the game is */
  const r = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    const cream = (i) => d[i] > 250 && Math.abs(d[i + 1] - 233) < 5 && Math.abs(d[i + 2] - 196) < 5;
    let all = 0, tl = 0, minY = 1e9, maxY = 0;
    for (let yy = 0; yy < c.height; yy++) for (let xx = 0; xx < c.width; xx++) {
      if (!cream((yy * c.width + xx) * 4)) continue;
      all++; minY = Math.min(minY, yy); maxY = Math.max(maxY, yy);
      if (xx < c.width / 2 && yy < c.height / 2) tl++;
    }
    return { w: img.width, h: img.height, all, tl, minY, maxY };
  }, b64);
  say(r.w === w && r.h === h, `${name} is ${r.w}x${r.h}`);
  say(r.all > 300, `${name} has the title (${r.all} title pixels, rows ${r.minY}-${r.maxY})`);
  /* a few stray cream pixels of lit rock can match, so the bar is under 1% of the title's */
  say(r.tl < r.all * 0.01, `${name}: ${r.tl} of ${r.all} title-colored pixels in the top-left quarter`);
}
await browser.close();

const probe = (f) => {
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', join(DIR, f)]).toString());
  return { streams: j.streams, dur: +j.format.duration, size: +j.format.size };
};
for (const [f, w, h, cap] of [['video-landscape.mp4', 1920, 1080, 0], ['video-portrait.mp4', 1080, 1920, 0],
  ['upload/video-landscape.mp4', 1920, 1080, 9.5e6], ['upload/video-portrait.mp4', 1080, 1620, 9.5e6]]) {
  const p = probe(f);
  const v = p.streams.find((s) => s.codec_type === 'video');
  say(v.codec_name === 'h264' && v.pix_fmt === 'yuv420p' && +v.width === w && +v.height === h, `${f} is ${v.codec_name} ${v.pix_fmt} ${v.width}x${v.height}`);
  say(!p.streams.some((s) => s.codec_type === 'audio'), `${f} has no sound`);
  say(p.dur <= 20, `${f} lasts ${p.dur.toFixed(1)} s`);
  if (cap) say(p.size < cap, `${f} is ${(p.size / 1e6).toFixed(2)} MB, under ${cap / 1e6}`);
  else say(p.size < 50e6, `${f} is ${(p.size / 1e6).toFixed(2)} MB`);
}
process.exit(failed ? 1 : 0);
