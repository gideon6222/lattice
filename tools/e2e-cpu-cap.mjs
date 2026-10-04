/* Keeps the e2e browser from taking the whole PC.

   Chromium under SwiftShader draws every WebGL frame on the CPU and spreads that
   over every thread it can see, so one Lattice run held the PC near 96% and made
   every other game's checks run about 2.5 times as long. `workers: 1` does not
   help, since the threads are the browser's own. What does: pin this process to a
   few logical CPUs and run it below normal priority. Both are inherited by every
   child, so the workers, the browsers and their GPU threads all stay inside them.

   How many CPUs: the studio's gate queue (`gate-slots/*.ticket`, one file per live
   gate run) says how many other gates are running. Alone, the browser may use
   MAX_ALONE of the threads, and beside other gates only MAX_BESIDE. Our own ticket
   is named by STUDIO_GATE_SLOT and is not counted. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

export const MAX_ALONE = 6;
export const MAX_BESIDE = 3;

/* Pure: how many logical CPUs the browser gets. `threads` is what the PC has and
   `others` the gate runs beside this one. Never fewer than 1, never more than
   half the PC, so a small machine keeps room for everything else. */
export function cpuBudget(threads, others) {
  const cap = others > 0 ? MAX_BESIDE : MAX_ALONE;
  return Math.max(1, Math.min(cap, Math.floor(threads / 2)));
}

/* Pure: the affinity mask for `n` CPUs, taken from the top of the PC so the
   browser stays off the low CPUs the desk and the other games land on first. */
export function affinityMask(threads, n) {
  let mask = 0n;
  for (let i = threads - n; i < threads; i++) mask |= 1n << BigInt(i);
  return mask;
}

export function otherGates(env = process.env) {
  const home = env.STUDIO_HOME || path.join(env.LOCALAPPDATA || '', 'studio');
  let files;
  try {
    files = fs.readdirSync(path.join(home, 'gate-slots')).filter((f) => f.endsWith('.ticket'));
  } catch {
    return 0;
  }
  const ours = env.STUDIO_GATE_SLOT ? path.basename(env.STUDIO_GATE_SLOT) : '';
  return files.filter((f) => f !== ours).length;
}

/* Applies the cap to this process and everything it starts. Idempotent through
   an environment flag, because Playwright loads its config in every worker too. */
export function applyCpuCap() {
  if (process.env.LATTICE_E2E_CAPPED || process.platform !== 'win32') return null;
  process.env.LATTICE_E2E_CAPPED = '1';
  const threads = os.availableParallelism();
  const n = cpuBudget(threads, otherGates());
  try {
    os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL);
  } catch { /* priority is a courtesy, never a failure */ }
  const mask = affinityMask(threads, n);
  spawnSync('powershell.exe', ['-NoProfile', '-Command',
    `(Get-Process -Id ${process.pid}).ProcessorAffinity = ${mask}`], { stdio: 'ignore' });
  /* Chromium's own child processes (the GPU process, where SwiftShader runs, and
     the renderers) come up with every CPU allowed again, whatever their parent
     had. So a watcher re-applies the mask to every headless-shell process every
     second until this process is gone. Only the e2e browser has that name (the
     interactive browser tools run chrome.exe), and Get-Process is cheap where a
     walk of the process tree never finished a pass on a busy PC. */
  const watch = [
    `$root = ${process.pid}`,
    `$mask = ${mask}`,
    `while (Get-Process -Id $root -ErrorAction SilentlyContinue) {`,
    `  foreach ($q in Get-Process -Name chrome-headless-shell -ErrorAction SilentlyContinue) {`,
    `    try { if ($q.ProcessorAffinity -ne $mask) { $q.ProcessorAffinity = $mask }; if ($q.PriorityClass -ne 'BelowNormal') { $q.PriorityClass = 'BelowNormal' } } catch {}`,
    `  }`,
    `  Start-Sleep -Seconds 1`,
    `}`
  ].join('\n');
  const script = path.join(os.tmpdir(), `lattice-e2e-cap-${process.pid}.ps1`);
  fs.writeFileSync(script, watch);
  spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script],
    { stdio: 'ignore', detached: true, windowsHide: true }).unref();
  return n;
}
