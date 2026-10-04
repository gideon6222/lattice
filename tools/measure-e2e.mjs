/* Measures what the e2e run costs the PC: wall time, and the CPU seconds the
   browser processes burned. Run `npm run build` first.

   The whole suite is about 27 minutes, too long for one foreground call. So it
   runs in short parts that save their numbers as they go:

     node tools/measure-e2e.mjs --part 1/8     one eighth of the tests (a few minutes)
     node tools/measure-e2e.mjs --report       sum the saved parts, say which are missing
     node tools/measure-e2e.mjs --reset        forget the saved parts
     node tools/measure-e2e.mjs -g "heat"      only the scenes a change touched, nothing saved
     node tools/measure-e2e.mjs                everything in one go (the old way)

   Parts are every Nth test by list order, so the slow ones spread out. A part
   saves .e2e-measure/part-I-of-N.json when it finishes, pass or fail, so a cut
   run loses only the part it was in. Keep the whole-game measure for the end of
   a phase.

   CPU seconds are read from `tasklist /v` once a second, keeping the last value
   seen per browser process, so a process that exits between reads loses at most
   a second of its time. "Share of the PC" is browser CPU seconds over
   wall seconds times logical cores. */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';

const CLI = 'node_modules/@playwright/test/cli.js';
const DIR = '.e2e-measure';
const args = process.argv.slice(2);

function take(flag) {
  const i = args.indexOf(flag);
  if (i < 0) return null;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
}
function takeBool(flag) {
  const i = args.indexOf(flag);
  if (i < 0) return false;
  args.splice(i, 1);
  return true;
}

const part = take('--part');
const report = takeBool('--report');
const reset = takeBool('--reset');

if (reset) {
  fs.rmSync(DIR, { recursive: true, force: true });
  console.log('E2E MEASURE saved parts cleared');
  process.exit(0);
}

if (report) {
  const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => /^part-\d+-of-\d+\.json$/.test(f)) : [];
  if (!files.length) { console.log('E2E MEASURE no saved parts'); process.exit(1); }
  const parts = files.map((f) => JSON.parse(fs.readFileSync(`${DIR}/${f}`, 'utf8')));
  const of = parts[0].of;
  if (parts.some((p) => p.of !== of)) { console.log(`E2E MEASURE saved parts disagree on the split, run --reset`); process.exit(1); }
  const have = new Set(parts.map((p) => p.part));
  const missing = [];
  for (let i = 1; i <= of; i++) if (!have.has(i)) missing.push(i);
  let wall = 0, cpu = 0, bad = 0;
  for (const p of parts) { wall += p.wall; cpu += p.cpu; if (p.code) bad++; }
  const cores = os.availableParallelism();
  console.log(`E2E MEASURE ${have.size} of ${of} parts, wall ${wall.toFixed(0)} s, browser CPU ${cpu.toFixed(0)} s, ` +
    `average ${(100 * cpu / wall / cores).toFixed(1)}% of the PC (${cores} threads), ${bad} failed part(s)` +
    (missing.length ? `, missing ${missing.join(' ')}` : ', complete'));
  process.exit(missing.length || bad ? 1 : 0);
}

/* the test titles for a part, from Playwright's own list */
function titlesFor(i, n) {
  const r = spawnSync(process.execPath, [CLI, 'test', '--list', '--reporter=json'], { encoding: 'utf8', maxBuffer: 64 << 20 });
  const json = JSON.parse(r.stdout);
  const titles = [];
  const walk = (s) => {
    for (const sp of s.specs || []) titles.push(sp.title);
    for (const c of s.suites || []) walk(c);
  };
  for (const s of json.suites || []) walk(s);
  return titles.filter((_, k) => k % n === i - 1);
}

let extra = args;
let partInfo = null;
if (part) {
  const m = /^(\d+)\/(\d+)$/.exec(part);
  if (!m || +m[1] < 1 || +m[1] > +m[2]) { console.error('--part wants I/N, like 1/8'); process.exit(2); }
  const i = +m[1], n = +m[2];
  const titles = titlesFor(i, n);
  if (!titles.length) { console.error(`part ${part} has no tests`); process.exit(2); }
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  extra = [...args, '--grep', titles.map(esc).join('|')];
  partInfo = { part: i, of: n, tests: titles.length };
  console.log(`E2E MEASURE part ${part}: ${titles.length} tests`);
}

const seen = new Map();
const masks = new Map();

/* Only browsers that descend from the run we started count: other sessions and
   his own Chrome are not this suite's cost. */
const PS = `$p = Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,KernelModeTime,UserModeTime;` +
  `$root = ${'$ROOT'}; $ids = @{}; $ids[$root] = 1; $grew = $true;` +
  `while ($grew) { $grew = $false; foreach ($x in $p) { if ($ids.ContainsKey([int]$x.ParentProcessId) -and -not $ids.ContainsKey([int]$x.ProcessId)) { $ids[[int]$x.ProcessId] = 1; $grew = $true } } }` +
  `foreach ($x in $p) { if ($ids.ContainsKey([int]$x.ProcessId) -and $x.Name -match 'chrome|headless_shell') { "$($x.ProcessId) $([double]$x.KernelModeTime + [double]$x.UserModeTime) $((Get-Process -Id $x.ProcessId -ErrorAction SilentlyContinue).ProcessorAffinity) $($x.Name) $($x.ParentProcessId)" } }`;

function sample() {
  if (!child.pid) return;
  const r = spawnSync('powershell.exe', ['-NoProfile', '-Command', PS.replace('$ROOT', String(child.pid))],
    { encoding: 'utf8', maxBuffer: 64 << 20 });
  for (const line of (r.stdout || '').split(/\r?\n/)) {
    const [pid, t100ns, mask, name, ppid] = line.trim().split(' ');
    if (pid && t100ns) seen.set(pid, Number(t100ns) / 1e7);
    if (mask) masks.set(pid, `${mask}${seen.get(pid) > 20 ? ' (busy)' : ''}`);
  }
}

const t0 = Date.now();
/* no shell: the child's PID must be the real root of the tree */
const child = spawn(process.execPath, [CLI, 'test', ...extra], { stdio: 'inherit' });
const timer = setInterval(sample, 1000);
child.on('exit', (code) => {
  clearInterval(timer);
  sample();
  const wall = (Date.now() - t0) / 1000;
  let cpu = 0;
  for (const v of seen.values()) cpu += v;
  const cores = os.availableParallelism();
  console.log(`\nE2E MEASURE wall ${wall.toFixed(0)} s, browser CPU ${cpu.toFixed(0)} s, ` +
    `average ${(100 * cpu / wall / cores).toFixed(1)}% of the PC (${cores} threads), browser affinity masks seen: ${[...new Set(masks.values())].join(', ')}`);
  if (partInfo) {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(`${DIR}/part-${partInfo.part}-of-${partInfo.of}.json`,
      JSON.stringify({ ...partInfo, wall, cpu, code: code ?? 1 }) + '\n');
  }
  process.exit(code ?? 1);
});
