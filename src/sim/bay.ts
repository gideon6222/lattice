/* What the fitting bay shows, as pure code. Progression round, BA.

   His ask of 2026-10-02: *"I want them to be locked and either hidden or some
   kind of creative way for you to get them at some point so it's not just all
   shown at once."* The studio rule (plans/unlocks-2026-10-02.md, section A) is
   what this file holds as numbers a test can read:

     - a rack shows at most THREE lines the player owns, and ONE sealed shadow,
     - one Next line names the nearest thing, its route and never a count,
     - every sealed thing states its route in the game's own words,
     - at least half of everything that enters the ship is earned by an act.

   The bay (ui.ts) draws what `bayRack` returns and the pause sheet prints
   `nextLine`, so the room and the tests cannot disagree. Nothing here reads
   state: the caller passes the two facts it needs, which also lets a test ask
   what a hypothetical save would see.

   Reach. A thing is only ever named when the player can get to it. The next
   barrier is the edge of the reachable world, so a device buried below it, or
   a rung that opens at a later core, is dark until the core in front breaks.
   (Counsel, 2026-10-02: the Next line must never name a Cooling Rig while core
   one stands.) */

import { UPGRADES, TIER_DEPTHS, SYSTEMS, type SystemKey } from './config';
import { FINDS, ROOM_FINDS, FOUND_KEYS } from './finds';
import { depthTier, gateDepth } from './gate';
import { FEATS, FEAT_DEVICES } from './feats';
import type { Upgrade } from '../types';

/* How a thing comes to the ship. `core` is a rung that opens when a barrier's
   core breaks: an act, not a price. */
export type RouteKind = 'bought' | 'found' | 'core' | 'feat';

export const ORDINAL = ['first', 'second', 'third'];

/* How many metres above a buried device its shadow appears. A shadow at the
   surface for a device two barriers down is a list of locks by another name. */
export const SHADOW_LEAD = 40;

const ABILITY_ROUTES = [
  { key: 'hollow', kind: 'core' as RouteKind, name: 'The Hollow', card: 'Handed over when the first core breaks.' },
  { key: 'call', kind: 'core' as RouteKind, name: 'The Call', card: 'Handed over when the second core breaks.' },
  { key: 'sink', kind: 'bought' as RouteKind, name: 'Sink', card: 'Sold at the first gate.' }
];

export interface Route {
  key: string;
  kind: RouteKind;
  /* One sentence for the sealed card, in the game's words. */
  card: string;
  /* The part of the Next line after the name. Empty for a found device, whose
     name is not given away: "Next: ? in the rock below 20 m". */
  act: string;
  /* The depth the thing sits at: where it is buried, or the barrier that opens
     it. 0 for what the pad sells from the first dock. */
  at: number;
}

function find(key: string) { return FINDS.find((f) => f.key === key) || ROOM_FINDS.find((f) => f.key === key); }

/* The route of a line, read off the table it already sits in. Nothing here is
   a second copy of a depth: a retune of `unlock` or `below` moves the words. */
export function routeOf(u: Upgrade): Route {
  const fd = FEAT_DEVICES[u.key];
  if (fd) {
    const feat = FEATS.find((x) => x.key === fd.feat);
    const act = feat ? feat.act : '';
    return { key: u.key, kind: 'feat', at: 0, card: 'Handed over when you ' + act + '.', act };
  }
  const f = find(u.key);
  if (FOUND_KEYS.has(u.key) && f) {
    const room = ROOM_FINDS.find((r) => r.key === u.key);
    if (room) {
      return { key: u.key, kind: 'found', at: Math.max(f.below, u.unlock),
        card: 'Found ' + room.where + ', below ' + f.below + ' m.', act: room.where };
    }
    return { key: u.key, kind: 'found', at: Math.max(f.below, u.unlock),
      card: 'Dug up in the rock below ' + f.below + ' m.', act: 'in the rock below ' + f.below + ' m' };
  }
  if (u.unlock > 0) {
    const n = Math.max(0, TIER_DEPTHS.indexOf(u.unlock) - 1);
    const ord = ORDINAL[n] || 'next';
    return { key: u.key, kind: 'core', at: u.unlock,
      card: 'Opens when the ' + ord + ' core breaks.', act: 'break the ' + ord + ' core' };
  }
  return { key: u.key, kind: 'bought', at: 0, card: 'On sale at the pad.', act: '' };
}

/* Every entry that enters the ship: the lines and the abilities. The share a
   test counts for "at least half earned". */
export function entries(): { key: string; kind: RouteKind }[] {
  return [
    ...UPGRADES.map((u) => ({ key: u.key as string, kind: routeOf(u).kind })),
    ...ABILITY_ROUTES.map((a) => ({ key: a.key, kind: a.kind }))
  ];
}
export function earnedShare(): { earned: number; total: number } {
  const all = entries();
  return { earned: all.filter((e) => e.kind !== 'bought').length, total: all.length };
}

export interface BayState {
  /* Deepest metre ever reached: after a barrier it can only be past it. */
  depth: number;
  /* Keys of the devices dug up. */
  found: readonly string[];
}

const ownable = (u: Upgrade, st: BayState) =>
  (!FOUND_KEYS.has(u.key) || st.found.includes(u.key)) && st.depth >= u.unlock;

/* The edge of the world the player can get to now: the bottom of the tier
   they are in. */
export function reachEdge(depth: number): number {
  return gateDepth(depthTier(depth));
}

/* Whether the shadow of a line is shown yet. A found device appears
   SHADOW_LEAD metres before its depth and only inside the reachable tier. A
   line that opens at a core appears one barrier ahead and no further. */
function shown(u: Upgrade, st: BayState): boolean {
  if (FEAT_DEVICES[u.key]?.dark) return false;
  const r = routeOf(u);
  const edge = reachEdge(st.depth);
  if (r.kind === 'found') {
    const f = find(u.key);
    return !!f && f.below < edge && st.depth >= f.below - SHADOW_LEAD && r.at <= edge;
  }
  return r.at <= edge;
}

export interface Shadow { key: string; name: string; route: Route }

export interface BayRack {
  /* The lines on the shelf, in table order. Never more than three. */
  lines: Upgrade[];
  /* The one sealed shape behind them, or none. */
  shadow: Shadow | null;
}

/* What `sys` shows. Owned lines first; then the single shallowest line that is
   not yet owned and whose shadow is due. */
export function bayRack(sys: SystemKey, st: BayState): BayRack {
  const inSys = UPGRADES.filter((u) => u.system === sys);
  const lines = inSys.filter((u) => ownable(u, st));
  /* A device dug up or a rung behind a core takes the shadow before a feat
     gift does: the feat is named by the Next line and the Ledger instead. */
  const rank = (u: Upgrade) => (routeOf(u).kind === 'feat' ? 1e6 : 0) + routeOf(u).at;
  const next = inSys
    .filter((u) => !ownable(u, st) && shown(u, st))
    .sort((a, b) => rank(a) - rank(b))[0];
  return { lines, shadow: next ? { key: next.key, name: next.name, route: routeOf(next) } : null };
}

export const RACK_LINES_MAX = 3;

/* The one Next line, or null when nothing is left to name. The nearest shadow
   across all racks: a found device reads "? in the rock below N m" and keeps
   its name sealed; anything else names itself and its act. */
export function nextLine(st: BayState): string | null {
  let best: Shadow | null = null;
  /* A feat gift not yet won is the nearest thing there is: it is an act the
     player can do now, so it is named ahead of a dig. */
  for (const u of UPGRADES) {
    const r = routeOf(u);
    if (r.kind !== 'feat' || FEAT_DEVICES[u.key]?.dark || ownable(u, st) || r.at > reachEdge(st.depth)) continue;
    if (!best || r.at < best.route.at) best = { key: u.key, name: u.name, route: r };
  }
  if (best) return 'Next: ' + best.name + ', ' + best.route.act;
  for (const s of SYSTEMS) {
    const sh = bayRack(s.key, st).shadow;
    if (sh && (!best || sh.route.at < best.route.at)) best = sh;
  }
  if (!best) return null;
  return best.route.kind === 'found'
    ? 'Next: ? ' + best.route.act
    : 'Next: ' + best.name + ', ' + best.route.act;
}
