/* The gate's end-to-end tier: the whole suite except tools/e2e-tiers.mjs's SLOW_TITLES.
   Extra arguments go to Playwright. The full suite is `npm run e2e` (the `smoke_slow` command). */
import { spawnSync } from 'node:child_process';
import { slowPattern } from './e2e-tiers.mjs';

const check = spawnSync(process.execPath, ['tools/check-e2e-browser.mjs'], { stdio: 'inherit' });
if (check.status !== 0) process.exit(check.status ?? 1);

const cli = 'node_modules/@playwright/test/cli.js';
const run = spawnSync(process.execPath,
  [cli, 'test', '--grep-invert', slowPattern(), ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(run.status ?? 1);
