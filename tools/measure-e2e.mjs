/* Measures what the e2e run costs the PC: wall time, and the CPU seconds the
   browser processes burned. Run `npm run build` first, then
   `node tools/measure-e2e.mjs`. The gate-speed numbers in STATE.md come from here.

   CPU seconds are read from `tasklist /v` once a second, keeping the last value
   seen per browser process, so a process that exits between reads loses at most
   a second of its time. "Share of the PC" is browser CPU seconds over
   wall seconds times logical cores. */
import { spawn, spawnSync } from 'node:child_process';
import os from 'node:os';

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
const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], { stdio: 'inherit' });
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
  process.exit(code ?? 1);
});
