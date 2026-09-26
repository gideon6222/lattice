import { panelOpened, panelClosed } from './closestack';
import { hap, haptics, setHaptics } from './haptics';
import { coreDepth, planetName, traitOf, SUPPLIES, RELIC_OF } from './sim/config';
import { atTitle, showTitle } from './titleui';
import { relicDistance } from './relic';

/* mm:ss for the fastest-core record. Anything over an hour reads as hours, and
   nothing in this game should ever reach that. */
function fmtTime(secs: number) {
  const m = Math.floor(secs / 60), r = secs % 60;
  return m + ':' + String(r).padStart(2, '0');
}
import { g , coreM, worldTrait, save, docked, shopHere, gateHere } from './sim/state';
import { haulValue } from './sim/world';
import { R } from './sim/runtime';
import { openMap, wireMap } from './mapui';
import { ANCHOR_COUNT } from './sim/vaults';
import { MAP_TILE, WORLD_DEPTH, regionName, regionAt } from './sim/region';
import { W } from './sim/config';
import { shoreUp } from './collapse';
import { mustEl, ui, atSurface, buildShop, openBay, setTimedOpen, toggleTimed, buildManifest, audioLabels, buildNotes, buildRunLog, buildCredits, buildBallast, updateHUD,
         selectSystem, stepSystem, stepCard, confirmCard } from './ui';
import { dockShip, undockShip, resizeStation, turnShip, pickPart } from './station';
import { UPGRADES } from './sim/config';
import type { Dir } from './types';
import { autopilot, hardReset, useSupply, fireBomb, fireLaser, packHere } from './actions';
import { sfx, audioInit, setAudio, setVolume, audioFocus, audioState } from './audio';
import { setTier, tier, type Tier } from './visuals';
import { applyVisuals } from './visualsapply';

function firstTouch() { audioInit(); }
window.addEventListener('pointerdown', firstTouch, { once: true });
window.addEventListener('keydown', firstTouch, { once: true });

/* ---------- the d-pad, and the forgiveness in it ----------

   `mechanics/FOUNDATIONS.md` principle 3: forgiveness is invisible and is most
   of "feel". Round ten's research ranked input BUFFERING first for a game at
   this stage, and measuring it here said it was the wrong forgiveness: the
   only press this game refuses on a timescale a buffer could bridge is
   ordnance with an empty meter, and `CHARGE_SECONDS` is 42 seconds a point, so
   a 150 ms window bridges nothing. The forgiveness that was actually missing
   was one step upstream, in who owns the pointer.

   The keys are 60 px on a 5 px grid, which is about 10 mm on his phone against
   a thumb nearer 18 mm. They used to bind `pointerleave` to a release, so:

     A THUMB THAT DRIFTS STOPPED THE SHIP. Three pixels into the gutter ended
     a dig, silently, in the middle of the one action this game is about. A
     player does not report that as "the key released", they report it as the
     controls feeling wrong, which is exactly what principle 3 predicts.
     A SLIDE BETWEEN KEYS DEAD-ENDED. `pointerleave` fired on the key the
     thumb left and `pointerdown` never fired on the key it reached, because
     the pointer was already down. So the ship simply stopped.

   `setPointerCapture` fixes both and is the whole change. A press owns the
   pointer until it is lifted, which suppresses the boundary events outright,
   and a move is hit-tested against the grid so the thumb can slide from one
   key to another and hand the ship over. Drifting OFF the pad entirely keeps
   the last direction: the press is still live, and guessing that the player
   meant to stop is the same mistake `pointerleave` was making. */
const keyUnder = (x: number, y: number): HTMLElement | null => {
  const el = document.elementFromPoint(x, y);
  return el ? (el.closest('#dpad .k') as HTMLElement | null) : null;
};

document.querySelectorAll<HTMLElement>('#dpad .k').forEach((b) => {
  /* Which key is lit is the thumb's business, not this element's, because a
     slide moves the light to a key that never saw a pointerdown. */
  const light = (el: HTMLElement | null) => {
    document.querySelectorAll<HTMLElement>('#dpad .k').forEach((k) => k.classList.toggle('on', k === el));
  };
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    /* Capture can throw when the pointer is already gone (a cancel that
       arrived first). The press must still register if it does. */
    try { b.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    light(b);
    R.held = b.dataset.dir as Dir;
  });
  b.addEventListener('pointermove', (e) => {
    if (!b.hasPointerCapture(e.pointerId)) return;
    const k = keyUnder(e.clientX, e.clientY);
    /* Off the grid is not a release. Only landing on a DIFFERENT key changes
       anything, which also means the gutters between keys cost nothing. */
    if (!k || k === b) return;
    e.preventDefault();
    light(k);
    R.held = k.dataset.dir as Dir;
  });
  const up = (e: PointerEvent) => {
    e.preventDefault();
    try { b.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    light(null);
    /* Unconditional, unlike the old `R.held === dir` guard: after a slide the
       direction being flown is not this key's, and it is still this key's
       pointer that is ending. */
    R.held = null;
  };
  b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up);
});

const KEYS: Record<string, Dir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
/* Only while the ship is the thing the arrows move. The shop binds the same
   four keys to walking the room, and without this gate a player who steered
   with the keyboard into the Outfitter left `R.held` set behind them and the
   ship flew off the moment they undocked. */
const flying = () => g.mode === 'play' || g.mode === 'fly';
window.addEventListener('keydown', (e) => { if (KEYS[e.key] && flying()) { R.held = KEYS[e.key]; e.preventDefault(); } });
window.addEventListener('keyup', (e) => { if (KEYS[e.key] && R.held === KEYS[e.key]) R.held = null; });

/* Supplies. pointerdown rather than click so a spend feels as immediate as a
   dig does, and preventDefault so the press cannot also scroll or select. */
for (const sup of SUPPLIES) {
  const btn = mustEl('sup' + sup.key[0].toUpperCase() + sup.key.slice(1));
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    useSupply(sup.key);
    /* A timed one spent closes the row it opened from (AJ). */
    setTimedOpen(false);
  });
}
/* The TIMED button opens and closes the row of three (round seventeen, AJ). */
mustEl('supTimed').addEventListener('pointerdown', (e) => { e.preventDefault(); sfx.ui(); toggleTimed(); });

/* Ordnance. Same pointerdown treatment as the supplies - a spend should feel
   as immediate as a dig - and both refuse loudly rather than silently when
   there is not enough power. */
mustEl('ordBomb').addEventListener('pointerdown', (e) => { e.preventDefault(); fireBomb(); });
mustEl('ordLaser').addEventListener('pointerdown', (e) => { e.preventDefault(); fireLaser(); });

/* The cores' abilities. Round fifteen, Y4, and they are HELD rather than
   tapped, which is why they are wired like the d-pad rather than like the
   ordnance above.

   `pointercancel` and `pointerleave` as well as `pointerup`, for the reason the
   d-pad already learned: a thumb that slides off a button on a phone never
   sends `pointerup` to it, and a held ability that nothing turns off is a
   power drain the player cannot stop or a ship that sinks for ever. */
function hold(id: string, set: (on: boolean) => void) {
  const el = mustEl(id);
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); set(true); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave'] as const) {
    el.addEventListener(ev, (e) => { e.preventDefault(); set(false); });
  }
}
hold('abSee', (on) => { R.seeHeld = on; });
hold('abSink', (on) => { R.sinkHeld = on; });

ui.btnAuto.onclick = autopilot;
ui.btnShop.onclick = () => {
  if (!shopHere() || g.mode !== 'play') return;
  sfx.ui();
  g.mode = 'shop';
  /* Move the real ship into the station scene. Nothing is copied, so the
     machine on the deck is wearing exactly the hardware it will undock with. */
  /* Round seventeen, AO: the room around the lift is the gate's own. */
  dockShip(docked() ? -1 : gateHere());
  document.body.classList.add('docked');
  openBay();
  buildShop();
  /* Un-hidden BEFORE the camera is framed, and that order is load-bearing.

     The framing measures the tray and the bars to find the band of screen the
     player can actually see, and a `display:none` subtree measures zero on
     every axis. Called the other way round it silently fell back to "the band
     is the whole screen" on every single open. */
  ui.shop.classList.remove('hidden');
  resizeStation();
  panelOpened('shop', closeShop);
};
function closeShop() {
  panelClosed('shop');
  sfx.ui();
  undockShip();
  document.body.classList.remove('docked');
  ui.shop.classList.add('hidden');
  g.mode = 'play';
}
mustEl('shopClose').onclick = closeShop;

/* ---------- the fitting bay, round seventeen AN ----------

   A drag on the stage turns the ship on its lift; a tap on the ship opens the
   system of the part it landed on. Only the stage turns the ship - a drag that
   starts on the rack scrolls the rack and nothing else, so the two can never
   blur into one gesture. Resolved on the way UP, because a turn and a tap
   start identically. */
const TAP_PX = 10;
let dragX = 0, dragY = 0, lastX = 0, dragging = false, moved = 0;
document.addEventListener('pointerdown', (e) => {
  if (g.mode !== 'shop') return;
  const t = e.target as HTMLElement;
  if (t.id !== 'shop' && t.id !== 'shopStage') return;
  dragX = lastX = e.clientX; dragY = e.clientY; dragging = true; moved = 0;
});
document.addEventListener('pointermove', (e) => {
  if (g.mode !== 'shop' || !dragging) return;
  turnShip(e.clientX - lastX);
  moved = Math.max(moved, Math.abs(e.clientX - dragX), Math.abs(e.clientY - dragY));
  lastX = e.clientX;
});
document.addEventListener('pointerup', (e) => {
  if (g.mode !== 'shop' || !dragging) return;
  dragging = false;
  if (moved > TAP_PX) return;
  const key = pickPart(e.clientX, e.clientY);
  const u = key ? UPGRADES.find((x) => x.key === key) : null;
  if (u) { sfx.ui(); selectSystem(u.system); }
});

/* The bay from the keyboard: left and right walk the systems, up and down the
   cards, Enter or Space presses the picked card's own buy button. Gated on the
   mode so the arrows that fly the ship and the arrows that walk the bay are
   never both live. */
const SHOP_KEYS: Record<string, () => void> = {
  ArrowLeft: () => { sfx.ui(); stepSystem(-1); },
  ArrowRight: () => { sfx.ui(); stepSystem(1); },
  ArrowUp: () => stepCard(-1),
  ArrowDown: () => stepCard(1),
  Enter: () => { if (confirmCard()) sfx.ui(); },
  ' ': () => { if (confirmCard()) sfx.ui(); }
};
window.addEventListener('keydown', (e) => {
  if (g.mode !== 'shop') return;
  const fn = SHOP_KEYS[e.key];
  if (!fn) return;
  e.preventDefault();
  fn();
});

function closeManifest() { panelClosed('manifest'); sfx.ui(); ui.manifest.classList.add('hidden'); g.mode = 'play'; }
mustEl('btnManifest').onclick = () => {
  if (g.mode !== 'play') return;
  sfx.ui(); g.mode = 'manifest'; buildManifest(); ui.manifest.classList.remove('hidden');
  panelOpened('manifest', closeManifest);
};
mustEl('manifestClose').onclick = closeManifest;

/* The map. Gated on 'play' like the manifest: a screen opened out of another
   screen is how you get two modals and no way back. */
mustEl('btnMap').onclick = () => { if (g.mode !== 'play') return; sfx.ui(); R.held = null; sfx.digStop(); openMap(); };
wireMap();

/* The Ballast, at the pad. Rebuilt on open rather than kept live: the panel is
   a decision screen and nothing on it moves while it is up except in response
   to a tap, so a rebuild per tap is both simpler and correct. */
const ballastSheet = mustEl('ballast');
function openBallast() {
  if (g.mode !== 'play' || !docked()) return;
  sfx.ui();
  g.mode = 'ballast';
  buildBallast();
  ballastSheet.classList.remove('hidden');
  panelOpened('ballast', closeBallast);
}
mustEl('btnBallast').onclick = openBallast;
mustEl('btnSeal').onclick = () => { sfx.ui(); packHere(); };
mustEl('ballastClose').onclick = () => closeBallast();
function closeBallast() {
  panelClosed('ballast');
  sfx.ui();
  ballastSheet.classList.add('hidden');
  g.mode = 'play';
  updateHUD();
  save();
}
/* Delegated, because the rows are rebuilt after every tap and handlers bound
   to the old nodes would be bound to nodes that no longer exist. */
ballastSheet.onclick = (e) => {
  const btn = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null;
  if (!btn || btn.disabled) return;
  /* Shoring is the only thing this panel still DOES. Round fifteen, Y7 took
     the FEED rows out: filling the Ballast is a trip to a scar now, not a list
     of donate buttons you stand on the pad and press. Shoring stays here
     because it spends the Ballast rather than filling it, and because the
     thing it buys back - a fallen region - is read off this same panel. */
  if (btn.dataset.shore && shoreUp() >= 0) buildBallast();
};

ui.btnMusic.onclick = () => { audioInit(); setAudio('music', !audioState.music); audioLabels(); };
ui.btnSfx.onclick = () => { audioInit(); setAudio('sfx', !audioState.sfx); audioLabels(); sfx.ui(); };
/* Guarded: the toggle is new, and an installed app running an older cached
   shell has no such button. A missing control must not take the pause sheet
   down with it. */
if (ui.btnHaptics) ui.btnHaptics.onclick = () => { setHaptics(!haptics.on); audioLabels(); hap.buy(); };

let resetArmed = 0;
function disarmReset() {
  resetArmed = 0;
  ui.btnReset.textContent = 'RESTART PROGRESS';
  ui.btnReset.classList.remove('armed');
}
mustEl('btnPause').onclick = () => {
  if (g.mode !== 'play') return;
  sfx.ui();
  g.mode = 'pause';
  R.held = null;
  sfx.digStop();
  disarmReset();
  audioLabels();
  buildNotes();
  ui.pauseStats.innerHTML =
    /* The REGION, like the HUD chip, and for the same reason: one planet means
       a planet name is the same word for the whole game. And it is not "Core
       at 452 m" any more - there is no core to break, only a floor. */
    '<div class="up"><div class="upinfo"><div class="upname">' +
    regionName(regionAt(Math.round(g.px), Math.max(0, Math.round(g.pd)))) +
    (worldTrait().id === 'stable' ? '' : ' <span class="mult">' + worldTrait().name + '</span>') + '</div>' +
    '<div class="upeff">You are at ' + Math.max(0, Math.round(g.pd)) + ' m of ' + coreM() + '</div>' +
    '<div class="upeff">' + worldTrait().blurb + '</div></div></div>' +
    '<div class="up"><div class="upinfo"><div class="upname">Credits</div>' +
    '<div class="upeff">Haul aboard worth ◈ ' + haulValue().toLocaleString() + '</div></div>' +
    '<div class="val">◈ ' + Math.floor(g.credits).toLocaleString() + '</div></div>' +
    '<div class="up"><div class="upinfo"><div class="upname">Relics</div>' +
    '<div class="upeff">' + (g.relics.length
      ? g.relics.map((r) => RELIC_OF[r] ? RELIC_OF[r].name : r).join(' · ')
      : 'One is buried on this planet, below the halfway mark. Nothing marks it.') +
    '</div>' +
    (relicDistance() === null
      ? '<div class="upeff">Recovered.</div>'
      : '<div class="upeff">Still in the ground here.</div>') + '</div>' +
    '<div class="val">' + g.relics.length + '</div></div>' +
    '<div class="up"><div class="upinfo"><div class="upname">Records</div>' +
    '<div class="upeff">Deepest ' + g.best.depth + ' m' +
    (g.best.haul ? ' · best haul ◈ ' + g.best.haul.toLocaleString() : '') +
    '</div></div>' +
    '<div class="val">' + g.best.depth + ' m</div></div>' +
    /* The campaign, in the two numbers it actually turns on. The Jump Drive and
       the Core Shards used to be here and went with the chart in W9 - one
       planet does not have worlds broken or routes to plot. */
    '<div class="up"><div class="upinfo"><div class="upname">The Lattice</div>' +
    '<div class="upeff">' + (g.ground.lit.length >= ANCHOR_COUNT
      ? (g.won ? 'Every Anchor, and the center is behind you' : 'Every Anchor broken')
      : 'Anchors broken') + '</div></div>' +
    '<div class="val">' + g.ground.lit.length + ' / ' + ANCHOR_COUNT + '</div></div>' +
    '<div class="up"><div class="upinfo"><div class="upname">Survey</div>' +
    '<div class="upeff">How much of the planet you have had a lamp on</div></div>' +
    '<div class="val">' + Math.floor((g.seen.length /
      (Math.ceil(W / MAP_TILE) * Math.ceil(WORLD_DEPTH / MAP_TILE))) * 100) + '%</div></div>';
  ui.pause.classList.remove('hidden');
  panelOpened('pause', () => mustEl('btnResume').click());
};
/* Built on the click, never while the game is running. ONE panel open at a
   time: the pause sheet is already the tallest thing in the game, and two open
   lists inside one scroll region is how the shop's shelves got clipped at the
   fold. Written as a table rather than as three buttons closing each other by
   hand, because that was two pairwise closes at two panels and would have been
   six at four. */
const PANELS: { btn: HTMLElement; panel: HTMLElement; label: string; build: () => void }[] = [
  { btn: ui.btnNotes, panel: ui.notes, label: "WHAT'S NEW", build: buildNotes },
  { btn: ui.btnLog, panel: ui.runlog, label: 'RUN LOG', build: buildRunLog },
  { btn: ui.btnCredits, panel: ui.creditsPanel, label: 'CREDITS', build: buildCredits }
];
for (const p of PANELS) {
  p.btn.onclick = () => {
    sfx.ui();
    const opening = p.panel.classList.contains('hidden');
    for (const q of PANELS) {
      q.panel.classList.add('hidden');
      q.btn.textContent = q.label;
    }
    if (opening) {
      p.build();
      p.panel.classList.remove('hidden');
      p.btn.textContent = 'HIDE';
    }
  };
}

/* The volume sliders. `input`, not `change`: on a phone `change` does not fire
   until the thumb is released, so the whole point of a volume control - hear
   it move - would be missing. */
for (const [el, kind] of [[ui.volMusic, 'music'], [ui.volSfx, 'sfx']] as const) {
  el.addEventListener('input', () => {
    audioInit();
    setVolume(kind, Number(el.value) / 100);
  });
}

/* The visuals tier. Three buttons, one checked, applied live (visuals.ts).
   `pointerdown` like every other control in this game that spends or changes
   something, so it answers the thumb rather than the click that follows it. */
for (const b of document.querySelectorAll<HTMLElement>('#tierPick .tierb')) {
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const t = b.dataset.tier as Tier;
    sfx.ui();
    if (setTier(t)) void applyVisuals();
    paintTiers();
  });
}

/* One writer for which button reads as on, called after a change and once at
   boot so the control shows the saved tier rather than the markup's default. */
export function paintTiers() {
  for (const b of document.querySelectorAll<HTMLElement>('#tierPick .tierb')) {
    b.setAttribute('aria-checked', String(b.dataset.tier === tier()));
  }
}
paintTiers();

/* Focus. `POLISH.md`: audio ducks and pauses on focus loss and resumes on
   return. `visibilitychange` covers the phone (home, app switcher, screen
   off); `blur`/`focus` covers a desktop tab that is visible but not in front,
   where a game left running under something else is still making noise. */
const focusChanged = () => audioFocus(!document.hidden && document.hasFocus());
document.addEventListener('visibilitychange', focusChanged);
window.addEventListener('blur', focusChanged);
window.addEventListener('focus', focusChanged);

mustEl('btnResume').onclick = () => {
  panelClosed('pause');
  sfx.ui();
  ui.pause.classList.add('hidden');
  /* The pause sheet doubles as the title screen's Settings, so closing it has
     two destinations. Reading the mode rather than a flag of its own: `title`
     is already the fact being asked about, and a second boolean tracking the
     same thing is a second thing to get out of step. */
  if (atTitle()) { showTitle(); return; }
  g.mode = 'play';
};
ui.btnReset.onclick = () => {
  if (resetArmed === 0) {
    resetArmed = 1;
    ui.btnReset.textContent = 'TAP AGAIN TO WIPE EVERYTHING';
    ui.btnReset.classList.add('armed');
    setTimeout(disarmReset, 4000);
    return;
  }
  hardReset();
  disarmReset();
};
document.addEventListener('contextmenu', (e) => e.preventDefault());

/* The station has its own camera, so it needs its own aspect update. Hooked
   here rather than inside scene.ts's resize(), because scene.ts is imported BY
   station.ts and the reverse import would be a cycle. */
window.addEventListener('resize', resizeStation);

/* Round seventeen, AB: every panel's X is its own bottom button, pressed. One
   close per panel, so the X can never close less (or more) than the button. */
for (const b of document.querySelectorAll<HTMLElement>('button.x[data-for]')) {
  b.onclick = () => mustEl(b.dataset.for as string).click();
}
