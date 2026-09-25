/* The Call. Round fifteen, Y4, the ability tier 2's dark core hands over.

   His brief: *"It should also give you a new ability or mechanic."* The plan's
   job for the LAST one, from GMTK on Hollow Knight by way of `PLAN.md` X5: it
   does double duty - it advances the ending, and it gives a reason to go back
   over ground already walked.

   ---------- what it answers ----------

   Everything still buried in a region whose Anchor you broke. Devices nobody
   has dug up, caches nobody has opened, the relic, a wreck's hold. Not ore:
   ore is the Survey device's question and the map's richness shading already
   says where it is thickest, and a list of every seam on the planet would turn
   the game into a checklist rather than a search.

   **Only in regions you have broken**, which is the same fence X4's richness
   shading runs on and the reason both are worth the trip. A planet-wide answer
   handed over at tier 2 would retroactively delete the eight Anchors you have
   not been to yet.

   ---------- and it is the first thing that answers BACK ----------

   Its name is the reveal starting to surface. Every other instrument in this
   game reads: the Receiver hears, the Survey reads, The Hollow shows. This one
   is the only one where something responds, and the wording on the card says
   so plainly enough to be uncomfortable later and harmless now. Y15 is what
   turns it over.

   ---------- pure, and swept rather than stored ----------

   A cache is decided by the generator, not by a list, so the only way to know
   where they all are is to ask. That is one sweep of the world per map open,
   cached against everything it is a function of - which digging changes, so
   the key carries `dug.size`. */

import { W } from './config';
import { g } from './state';
import { blockAt } from './world';
import { WORLD_DEPTH } from './region';
import { reachableDepth } from './gate';

export interface Secret {
  x: number;
  d: number;
  /* Which marker the map draws. Four kinds and not one, because "there is
     something here" is a worse sentence than "there is a device here" - the
     second is a decision about whether to make the trip. */
  kind: 'find' | 'relic' | 'cache' | 'wreck';
}

/* Whether a cell's secret answers. Round seventeen, AC: it used to be only
   regions whose Anchor was broken, which meant ground the player had already
   worked - and the Call arrived with the last core, in an Anchor-less tier it
   could say nothing about. It is the second core's gift now, and it hears
   everything the ship can currently reach, broken regions or not, so it
   points somewhere the player has not been. Still never past a shut gate:
   a secret the ship cannot get to is a promise the game cannot keep yet. */
export function callAnswers(openGates: readonly number[], d: number): boolean {
  return d <= reachableDepth(openGates);
}

let ckey = '';
let cached: Secret[] = [];

export function secretsHeard(): Secret[] {
  /* Everything the sweep is a function of. `dug.size` rather than the set
     itself because it only ever grows; `collapsed` and `woke` because both
     change what `blockAt` answers without any cell being dug. */
  const k = g.ground.gates.slice().sort().join('.') + '|' + g.dug.size + '|' +
            g.found.length + '|' + g.relics.length + '|' +
            g.ground.collapsed.length + '|' + (g.ground.woke ? 1 : 0);
  if (k === ckey) return cached;
  ckey = k;

  const out: Secret[] = [];
  for (let x = 0; x < W; x++) {
    for (let d = 0; d <= WORLD_DEPTH; d++) {
      if (!callAnswers(g.ground.gates, d)) continue;
      /* Anything already dug is already gone: `blockAt` answers `g.dug` before
         it answers anything else, so a cell the player has taken is null here
         and falls out on the next line. An explicit check for it was the first
         version of this loop and it was dead code that READ as the rule -
         verified by disabling it, which changed nothing. The rule is `blockAt`,
         and that is worth one comment rather than a second copy. */
      const b = blockAt(x, d);
      if (!b) continue;
      const kind: Secret['kind'] | null =
        b.relic ? 'relic'
        : b.find ? 'find'
        : b.salvage ? 'wreck'
        : b.cache ? 'cache'
        : null;
      if (kind) out.push({ x, d, kind });
    }
  }
  cached = out;
  return out;
}

/* For a test, or for anything that changes the world in a way the key above
   cannot see. Everything the game actually does to the world is in that key. */
export function resetSecrets() { ckey = ''; cached = []; }
