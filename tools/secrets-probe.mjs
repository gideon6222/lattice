/* secrets-probe.mjs - how often a descent actually meets one of the secrets.

   Y12's own box: "make it feel like there are always more secrets to find" ...
   "what it needs is a measurement of how often a descent meets anything at
   all before more is added." This is that measurement. It changes nothing.

   ---------- what counts as a secret ----------

   The same four kinds `secrets.ts`'s `secretsHeard()` sweeps for on the map:
   a find crate (`b.find`), a relic (`b.relic`), a wreck's hold (`b.salvage`),
   a supply cache (`b.cache`). A cell can be both salvage and cache (a wreck's
   hold IS a cache); counted as a wreck, the rarer and more legible of the two,
   matching secrets.ts's own priority order.

   Anchors are not counted: they are not hidden, the map and the Receiver both
   point straight at them, and Y12's ask ("always MORE to find") is about the
   ground answering when you did not already know to look.

   Ore veins are not counted either: X1 already answered "does the ground hold
   surprises" for ore specifically, and this probe is about the four kinds the
   map itself calls secrets - a vein is worth credits, not a banner.

   ---------- one world, not many seeds ----------

   `g.planet`/`g.world` are vestigial (CLAUDE.md): there is one planet, so
   there is nothing to average over except WHERE the shaft goes. Five offsets,
   spread across the full W=61 width around START_X, are this probe's
   equivalent of econ.mjs's five seeds.

   ---------- the model ----------

   A campaign, not a run: the shaft persists and deepens tier by tier (113,
   226, 339, 452 - the four barrier depths from `region.ts`), the way a real
   playthrough does, widening into a corridor at the bottom of each leg until
   the hold is full. Digging is real `blockAt`, real hardness, real cargo cap;
   what is NOT simulated is the shop, fuel or hull - this probe cannot die and
   does not need to, because the question is purely geometric: of the cells a
   normal campaign's shaft-and-corridor actually cuts, how many carry a
   secret, and how many consecutive empty-handed runs does a player sit
   through between them.

   Run:  node tools/secrets-probe.mjs */

import { loadPure } from '../test/harness.mjs';

const H = await loadPure();
H.setWorld(0);

const W = H.W;
const START_X = Math.floor(W / 2);
const TIERS = [113, 226, 339, 452];
const RUNS_PER_TIER = 15;
const OFFSETS = [-24, -12, 0, 12, 24].map((o) => START_X + o);

/* Priority order matches secrets.ts's secretsHeard(): relic, then find, then
   wreck (salvage), then cache - a wreck's hold is also a cache and should not
   be double-counted as both. */
function kindOf(b) {
  if (b.relic) return 'relic';
  if (b.find) return 'find';
  if (b.salvage) return 'wreck';
  if (b.cache) return 'cache';
  return null;
}

function digTime(b) {
  return (b.hard * H.DIG_BASE) / H.S.drill();
}

function probe(ox) {
  H.g.ground = H.newGround();
  H.g.dug = new Set();
  let shaft = 0;
  const runs = [];
  const totals = { relic: 0, find: 0, wreck: 0, cache: 0 };
  let sinceLast = 0;
  const gaps = [];

  for (const cap of TIERS) {
    /* The gates above this leg are open and the one at its floor is not: a
       probe that digs through a closed barrier measures a game that does not
       exist (round seventeen, AA). */
    const leg = TIERS.indexOf(cap);
    H.g.ground.gates = [];
    for (let t = 0; t < Math.min(leg, H.GATE_COUNT); t++) H.g.ground.gates.push(t);
    const step = Math.max(1, Math.round((cap - shaft) / RUNS_PER_TIER));
    for (let r = 0; r < RUNS_PER_TIER; r++) {
      const target = Math.min(cap, shaft + step);
      const hit = { relic: 0, find: 0, wreck: 0, cache: 0 };

      /* down: extend the shaft if this run reaches new ground */
      let reached = shaft;
      for (let d = shaft + 1; d <= target; d++) {
        const b = H.blockAt(ox, d);
        if (b && b.hard === Infinity && !b.ghost) break;
        reached = d;
        if (!b) continue;
        const k = kindOf(b);
        if (k) hit[k]++;
      }
      shaft = Math.max(shaft, reached);

      /* work a corridor at the bottom until the hold would be full, the same
         alternating-side widening econ.mjs uses */
      const cargoCap = H.S.cargoCap();
      let weight = 0, x = 1, side = 1, steps = 0;
      while (weight < cargoCap && steps < 80) {
        for (const dd of [shaft, shaft - 1]) {
          if (dd < 1) continue;
          const b = H.blockAt(ox + x * side, dd);
          if (!b || (b.hard === Infinity && !b.ghost)) continue;
          weight += b.wt || 0;
          const k = kindOf(b);
          if (k) hit[k]++;
        }
        side = -side;
        if (side === 1) x++;
        steps++;
      }

      const met = hit.relic + hit.find + hit.wreck + hit.cache;
      for (const k of Object.keys(totals)) totals[k] += hit[k];
      if (met > 0) { gaps.push(sinceLast); sinceLast = 0; } else { sinceLast++; }
      runs.push({ tier: TIERS.indexOf(cap) + 1, depth: shaft, met, ...hit });
    }
  }
  return { ox, runs, totals, gaps, trailingQuiet: sinceLast };
}

const med = (a) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};

console.log(`The Lattice secrets probe - one world, ${OFFSETS.length} shaft offsets, ` +
            `${RUNS_PER_TIER} runs per tier, tier caps ${TIERS.join('/')} m.`);
console.log('Counts a run as meeting a secret if its shaft extension or corridor work');
console.log('breaks a find, relic, wreck or cache cell. Nothing here changes the game.');
console.log('');

const all = OFFSETS.map(probe);

for (const p of all) {
  const quiet = p.runs.filter((r) => r.met === 0).length;
  console.log(`--- offset x=${p.ox} (${p.ox - START_X >= 0 ? '+' : ''}${p.ox - START_X} from pad) ---`);
  console.log(`  runs: ${p.runs.length}, quiet: ${quiet} (${Math.round(quiet / p.runs.length * 100)}%), ` +
              `secrets met: ${JSON.stringify(p.totals)}`);
  console.log(`  median gap between secrets (runs): ${med(p.gaps)}, ` +
              `longest run of consecutive quiet runs: ${Math.max(0, ...p.gaps, p.trailingQuiet)}`);
}

console.log('');
console.log('=== across all offsets ===');
const allRuns = all.flatMap((p) => p.runs);
const quietAll = allRuns.filter((r) => r.met === 0).length;
const totalsAll = { relic: 0, find: 0, wreck: 0, cache: 0 };
for (const p of all) for (const k of Object.keys(totalsAll)) totalsAll[k] += p.totals[k];
console.log(`total runs: ${allRuns.length}, quiet: ${quietAll} (${Math.round(quietAll / allRuns.length * 100)}%)`);
console.log(`totals: ${JSON.stringify(totalsAll)}`);
console.log(`median gap between secrets, all offsets pooled (runs): ${med(all.flatMap((p) => p.gaps))}`);

console.log('');
console.log('=== by tier ===');
for (let t = 1; t <= TIERS.length; t++) {
  const tr = allRuns.filter((r) => r.tier === t);
  const q = tr.filter((r) => r.met === 0).length;
  console.log(`tier ${t} (to ${TIERS[t - 1]} m): ${tr.length} runs, ${q} quiet ` +
              `(${Math.round(q / tr.length * 100)}%), median met/run: ${med(tr.map((r) => r.met))}`);
}
