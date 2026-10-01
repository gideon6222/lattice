/* After a crash, the game opens normally, with the progress kept.

   His bar (studio-knowledge checklists/launch.md section 2, 2026-10-01): a
   player never sees crash or debug UI. No stack trace, no CLEAR SAVE button, no
   "last run did not finish" screen. A half-finished run is dropped quietly and
   the game opens on its main screen, the diagnostics kept in the console and in
   one localStorage record.

   index.html's first script catches every uncaught error and rejection. It
   prints the stack to the console, writes it to `CRASH_KEY` as a pending
   record, and shows its overlay only behind ?debug. This file is the other
   half, run by main.ts before the save is loaded:

   - A pending crash, or a boot that never finished, puts the ship back on the
     pad with an empty hold. The credits, the upgrades, the keys, the tunnels,
     the Anchors and the record all stay: those were earned. The run in
     progress (where the ship was, what it carried) is what goes, the same
     trade `landSave` makes for an old mid-run save.
   - Two boots in a row that never finished mean the save itself is what will
     not load. It is moved aside, never deleted, to `ASIDE_KEY`, and the game
     opens fresh, rather than staying on LOADING for ever with no way out.

   Storage is passed in, so the node suite drives all of it on a Map. */

import { SAVE_KEY, OLD_KEY, START_X } from './sim/config';

/* The last crash: { at, kind, message, stack, pending }. Written by index.html. */
export const CRASH_KEY = 'coreward.crash';
/* Boots begun and not yet finished, this one included. index.html's first
   script adds one as the page starts, before any module can fail to load, and
   `bootFinished` clears it once a screen is up. */
export const BOOT_KEY = 'coreward.boot';
/* Where a save that would not load is kept, untouched, for a look later. */
export const ASIDE_KEY = 'coreward.v2.crashed';
/* How many unfinished boots in a row before the save is set aside. */
export const BOOTS_BEFORE_ASIDE = 2;

export interface StoreLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export interface Recovered {
  /* A crash or an unfinished boot came before this one. */
  crashed: boolean;
  /* The run in progress was dropped: the ship is on the pad, the hold empty. */
  dropped: boolean;
  /* The save would not load twice running and was moved to ASIDE_KEY. */
  setAside: boolean;
}

function read(store: StoreLike, k: string): string | null {
  try { return store.getItem(k); } catch (e) { return null; }
}

/* Run once, before load(). */
export function recoverBeforeLoad(store: StoreLike): Recovered {
  const out: Recovered = { crashed: false, dropped: false, setAside: false };
  /* The ones before this one that never reached a screen. */
  const started = parseInt(read(store, BOOT_KEY) || '0', 10) || 0;
  const unfinished = Math.max(0, started - 1);
  let pending = false;
  const raw = read(store, CRASH_KEY);
  if (raw) {
    try {
      const rec = JSON.parse(raw);
      if (rec && rec.pending) {
        pending = true;
        rec.pending = false;
        store.setItem(CRASH_KEY, JSON.stringify(rec));
        console.warn('[lattice] recovering from the last crash:', rec.kind, rec.message);
      }
    } catch (e) { /* an unreadable record is no reason to drop anything */ }
  }
  out.crashed = pending || unfinished > 0;

  if (unfinished >= BOOTS_BEFORE_ASIDE) {
    out.setAside = setAside(store);
  } else if (out.crashed) {
    out.dropped = dropRun(store);
  }
  return out;
}

/* The boot reached the screen in front of the game. */
export function bootFinished(store: StoreLike) {
  try { store.removeItem(BOOT_KEY); } catch (e) { /* ignore */ }
}

/* The ship back on the pad, the hold empty; everything else in the save kept. */
export function dropRun(store: StoreLike): boolean {
  const raw = read(store, SAVE_KEY);
  if (!raw) return false;
  let s: Record<string, unknown>;
  try { s = JSON.parse(raw); } catch (e) { return false; }
  if (!s || typeof s !== 'object') return false;
  s.at = 'pad';
  s.px = START_X;
  s.pd = -1;
  s.cargo = {};
  s.weight = 0;
  /* On the pad the tank and hull are filled by the way in. */
  delete s.fuel;
  delete s.hull;
  try { store.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { return false; }
  console.warn('[lattice] the run in progress was dropped; the ship is back on the pad');
  return true;
}

export function setAside(store: StoreLike): boolean {
  let moved = false;
  for (const k of [SAVE_KEY, OLD_KEY]) {
    const raw = read(store, k);
    if (!raw) continue;
    try {
      store.setItem(k === SAVE_KEY ? ASIDE_KEY : ASIDE_KEY + '.v1', raw);
      store.removeItem(k);
      moved = true;
    } catch (e) { /* ignore */ }
  }
  if (moved) console.warn('[lattice] the save would not load twice running; it is kept at ' + ASIDE_KEY);
  return moved;
}
