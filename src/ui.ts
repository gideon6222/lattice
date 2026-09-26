import { SYSTEMS, SUPPLY_SYSTEM, WHAT, shelfStock, type SystemKey } from './sim/config';
import { keyNear, senseRange } from './sim/keys';
import { vendorLines, sellsRung, rungBand, sellsSupplies, dealAt, SINK_GATE, SINK_PRICE, type Place } from './sim/vendor';
import { HULL_MAX, DEF, isOre, isKey, ORES, GEODE, UPGRADES, SUPPLIES, SUPPLY_OF, BOMB_CHARGE, LASER_CHARGE, coreDepth, planetName, traitOf, valueMult, costOf, matCost, capstoneCost, TRAIT_OF, heatDepth, levelCap, TIER_DEPTHS } from './sim/config';
import { setGauges, setFuelReserve } from './gauges';
import { clamp } from './sim/util';
import { flashScale } from './motion';
import { g, S, save, coreM, valueM, worldTrait, padFuel, worldUnrest, docked, shopHere, gateHere, atSurface as aboveGround } from './sim/state';
import { heatDamagePerSecond } from './sim/feel';
import type { Upgrade, Supply } from './types';
import { VERSION, CHANGELOG } from './changelog';
import { haulValue } from './sim/world';
import { GATE_COUNT, ANCHORS_PER_GATE, gateAnchors, gateReady, gateDepth } from './sim/gate';
import { resonance } from './sim/call';
import { lamp } from './scene';
import { setDrillTier, setUpgradeHardware } from './ship';
import { sfx, audioState, audioVolume } from './audio';
import CREDITS_MD from '../assets/CREDITS.md?raw';
import { summarise, mergeLog, loadLog, type Row } from './sim/telemetry';
import { R } from './sim/runtime';
import { ballastDrain, unrestBand, UNREST_BANDS, ballastStarted,
         BALLAST_SAFE, BALLAST_SHORE_COST, BALLAST_LOW } from './sim/unrest';
import { regionName, regionAt } from './sim/region';
import { hasAbility } from './sim/ability';
import { scarHere, repairable, repairRoom, repairValue } from './sim/repair';
import { hap, haptics, setHaptics } from './haptics';
import { reframeIfNeeded, boltOn } from './station';


export /* el() is for lookups that may legitimately be absent. mustEl() is for the
   ones the game cannot run without: throwing here reaches the on-screen
   error overlay, which on a phone is the only way to see it at all. */
const el = (id: string) => document.getElementById(id);
export const mustEl = (id: string): HTMLElement => {
  const node = document.getElementById(id);
  if (!node) throw new Error('missing required element #' + id);
  return node;
};
export const ui = {
  planet: mustEl('planet'), credits: mustEl('credits'), haul: mustEl('haul'), depth: mustEl('depth'),
  anchors: mustEl('anchors'), callLamp: mustEl('callLamp'), keyNear: mustEl('keyNear'),
  cargoTxt: mustEl('cargoTxt'), fuelTxt: mustEl('fuelTxt'),
  toast: mustEl('toast'), shop: mustEl('shop'), shopCredits: mustEl('shopCredits'),
  rack: mustEl('rack'), systems: mustEl('systems'), shopName: mustEl('shopName'), shopSub: mustEl('shopSub'),
  event: mustEl('event'), evTitle: mustEl('evTitle'), evBody: mustEl('evBody'), evBtn: mustEl('evBtn'),
  manifest: mustEl('manifest'), manifestRows: mustEl('manifestRows'), manifestTotal: mustEl('manifestTotal'),
  vault: mustEl('vault'),
  pause: mustEl('pause'), pauseStats: mustEl('pauseStats'), btnReset: mustEl('btnReset'),
  btnMusic: mustEl('btnMusic'), btnSfx: mustEl('btnSfx'), heat: mustEl('heat'),
  /* el(), not mustEl(): the toggle is new and a save loaded into an older
     cached shell must not take the whole HUD down with it. */
  btnHaptics: el('btnHaptics'),
  alarm: mustEl('alarm'), hullTxt: mustEl('hullTxt'),
  vignette: mustEl('vignette'),
  flash: mustEl('flash'), btnShop: mustEl('btnShop'), btnAuto: mustEl('btnAuto'),
  kit: mustEl('kit'),
  ordBomb: mustEl('ordBomb'), ordLaser: mustEl('ordLaser'),
  abSee: mustEl('abSee'), abSink: mustEl('abSink'),
  power: mustEl('power'), powerChip: mustEl('powerChip'),
  verNum: mustEl('verNum'), notes: mustEl('notes'), btnNotes: mustEl('btnNotes'),
  runlog: mustEl('runlog'), btnLog: mustEl('btnLog'),
  creditsPanel: mustEl('creditsPanel'), btnCredits: mustEl('btnCredits'),
  volMusic: mustEl('volMusic') as HTMLInputElement, volSfx: mustEl('volSfx') as HTMLInputElement,
  /* el(), not mustEl(): the banner is new, and a save loaded into an older
     cached shell must not take the whole HUD down with it - the same clause
     the haptics toggle needed and for the same reason. */
  found: el('found'), foundName: el('foundName'), foundWhat: el('foundWhat')
};

/* The run log, built on open and never in the loop.

   This is the half of the telemetry that costs anything, and it only runs when
   a finger lands on the button. Two columns of the same numbers: what this run
   has done, and what every run has done. All time is what a balance decision
   should be made on - one run is a mood - but this run is what makes the panel
   worth opening while playing.

   All-time is merged into a throwaway copy rather than written back, because
   the run is not over: folding it into the saved totals here would count it
   twice when the ship actually docks. */
export function buildRunLog() {
  const allNow = loadLog(g.log);
  mergeLog(allNow, R.run);
  const table = (rows: Row[]) => rows.map((r) =>
    '<div class="lg"><div class="l">' + r.label + '</div><div class="v">' + r.value +
    '</div><div class="n">' + r.note + '</div></div>').join('');
  ui.runlog.innerHTML =
    '<div class="lgh">THIS RUN</div>' + table(summarise(R.run, S.fuelCap(), S.hullCap())) +
    '<div class="lgh">ALL TIME</div>' + table(summarise(allNow, S.fuelCap(), S.hullCap()));
}

/* Rendered once, on first open, because a changelog does not change while the
   game is running and rebuilding it on every pause would be pure churn. */
let notesBuilt = false;
export function buildNotes() {
  ui.verNum.textContent = 'v' + VERSION;
  if (notesBuilt) return;
  notesBuilt = true;
  ui.notes.innerHTML = CHANGELOG.map((r) =>
    '<div class="rel"><div class="relhead"><span class="v">v' + r.version + '</span>  ' +
    r.title + '  <span class="d">' + r.date + '</span></div><ul>' +
    r.notes.map((n) => '<li>' + n + '</li>').join('') + '</ul></div>'
  ).join('');
}

/* The three kit buttons, looked up once. Ids are derived from the supply key
   so index.html and SUPPLIES cannot drift apart without mustEl throwing. */
const supBtns = SUPPLIES.map((sup) => ({
  sup, el: mustEl('sup' + sup.key[0].toUpperCase() + sup.key.slice(1))
}));

let toastT = 0;
export function toast(msg: string) { ui.toast.textContent = msg; ui.toast.style.opacity = '1'; toastT = 2.0; }
/* the frame loop used to decrement toastT directly; it stays owned here now */
export function tickToast(dt: number) {
  if (toastT <= 0) return;
  toastT -= dt;
  if (toastT <= 0) ui.toast.style.opacity = '0';
}
/* The save moment (round seventeen, AO). Shown for two and a half seconds on
   game time, so the filmstrip can hold it still like the banner below. */
let savedT = 0;
export function savedMoment(text: string) {
  const el = document.getElementById('savedMark');
  if (!el) return;
  (el.querySelector('span') as HTMLElement).textContent = text;
  el.classList.add('on');
  savedT = 2.5;
}
export function tickSaved(dt: number) {
  if (savedT <= 0) return;
  savedT -= dt;
  if (savedT <= 0) document.getElementById('savedMark')?.classList.remove('on');
}

/* ---------- the discovery banner ----------

   Four seconds, no tap, no pause. Long enough to read nineteen words at arm's
   length and short enough that it is gone before the next block is through.
   Driven off the same tick as the toast rather than a setTimeout, so it runs
   on game time and the filmstrip can hold it still. */
let foundT = 0;
/* `kind` decides the two fixed lines, because a device and a consumable are
   different promises. A device is bolted on and its ladder opens; a supply is
   in the hold and the counter will restock it. Saying "FITTED" over a Fuel
   Cell would be a small lie in the one place the game is teaching. */
export function foundBanner(name: string, what: string, kind: 'device' | 'supply' | 'ore' | 'key' = 'device') {
  if (!ui.found || !ui.foundName || !ui.foundWhat) return;
  ui.foundName.textContent = name;
  ui.foundWhat.textContent = what;
  const head = ui.found.querySelector('.fhead');
  const fit = ui.found.querySelector('.ffit');
  if (head) head.textContent = kind === 'device' ? 'DEVICE RECOVERED'
    : kind === 'supply' ? 'NEW SUPPLY' : kind === 'key' ? 'NEW KEY' : 'NEW MINERAL';
  if (fit) {
    fit.textContent = kind === 'device'
      ? 'FITTED · UPGRADE IT AT THE OUTFITTER'
      : kind === 'supply' ? 'IN THE HOLD · THE OUTFITTER STOCKS IT NOW'
      /* A key is never sold (round seventeen, AK), so the ore line would be
         the one wrong instruction on the card. */
      : kind === 'key' ? 'IN THE HOLD · BANKED AT THE PAD, NEVER SOLD'
      : 'IN THE HOLD · SELL IT AT THE PAD';
  }
  ui.found.classList.add('on');
  foundT = 4.0;
}
export function tickFound(dt: number) {
  if (foundT <= 0) return;
  foundT -= dt;
  if (foundT <= 0 && ui.found) ui.found.classList.remove('on');
}

export function flash(color: string, ms?: number) {
  ui.flash.style.background = color;
  /* Dimmed rather than dropped under reduced motion: the flash still marks the
     event and its colour still tells a gas pocket from a relic, it just stops
     washing the whole screen white. Applied to the element's opacity rather
     than by rewriting the colour, so every caller keeps passing the same
     rgba() it always did. */
  ui.flash.style.opacity = String(flashScale());
  setTimeout(() => { ui.flash.style.opacity = '0'; }, ms || 220);
}
/* Re-exported so the modules that already import it from here keep working.
   It is the GROUND LINE, not the dock: `docked()` in sim/state.ts is the pad. */
export const atSurface = aboveGround;
export { docked };

/* The Anchor tally: THIS tier's Anchors and the core they wake.

   Round seventeen, AC. It was nine pips and a Vault diamond - the old spine,
   a collection of nine that ended at the centre - on the HUD all game. The
   ladder is three at a time, so the row is the three Anchors holding the
   barrier you are working on and a diamond for that barrier's core, which
   lights when the three are broken. Past the last gate the row stays full.

   Built from ANCHORS_PER_GATE rather than hand-written tags, for the reason
   CLAUDE.md records about literals that go stale the day the grid changes. */
let anchorPips: HTMLElement[] = [];
let vaultPip: HTMLElement | null = null;
function buildAnchorPips() {
  if (anchorPips.length) return;
  for (let i = 0; i < ANCHORS_PER_GATE; i++) {
    const pip = document.createElement('i');
    anchorPips.push(pip);
    ui.anchors.appendChild(pip);
  }
  vaultPip = document.createElement('i');
  vaultPip.className = 'vault';
  ui.anchors.appendChild(vaultPip);
}

/* The row still fills left to right by COUNT, not by which Anchor: pip i means
   "i of this tier's three", never "the i-th region", because the instrument
   says how far through and the map says which (src/sim/call.ts). */
let paintedKey = '';
function paintAnchorPips() {
  buildAnchorPips();
  let t = 0;
  while (t < GATE_COUNT && g.ground.gates.includes(t)) t++;
  const lit = t >= GATE_COUNT ? ANCHORS_PER_GATE
    : gateAnchors(t).filter((r) => g.ground.lit.includes(r)).length;
  const ready = t >= GATE_COUNT || gateReady(t, g.ground.lit);
  /* updateHUD runs every frame; this changes a handful of times a campaign. */
  const k = t + '|' + lit + '|' + ready;
  if (k === paintedKey) return;
  paintedKey = k;
  for (let i = 0; i < anchorPips.length; i++) anchorPips[i].classList.toggle('lit', i < lit);
  if (vaultPip) vaultPip.classList.toggle('open', ready);
}

/* The Lattice Receiver's telltale.

   The reading goes out as a CSS custom property and the stylesheet does the
   rest, so nothing here animates per frame - the 140ms transition on the lamp
   is what smooths it, which is the same trick the sky gradient uses.

   Rounded to hundredths before it is written. The raw value changes on every
   frame you are moving, and setting a custom property to a fresh 17-digit
   string sixty times a second is a style recalculation per frame for a
   difference no eye can see. */
let paintedCall = -1;
function paintCallLamp() {
  const level = g.up.receiver ?? 0;
  const aboard = level > 0;
  ui.callLamp.classList.toggle('hidden', !aboard);
  if (!aboard) return;
  const v = Math.round(
    resonance(Math.round(g.px), Math.max(0, Math.round(g.pd)), g.ground.lit, level) * 100) / 100;
  if (v === paintedCall) return;
  paintedCall = v;
  ui.callLamp.style.setProperty('--call', String(v));
}

/* The Sensors hearing a key. Round seventeen, AM.

   A name and nothing else - "EMERALD NEAR" - in the key's own colour, so the
   hunt has a warmer-colder without a compass in it. Asked again only when the
   ship crosses into a new cell or the rock changes, since the answer cannot
   change in between. */
let paintedNear = '';
export function sensedKey(): string | null {
  const x = Math.round(g.px), d = Math.max(0, Math.round(g.pd));
  if (d < 1) return null;
  return keyNear(x, d, senseRange(g.up.scan, g.up.survey ?? 0), (cx, cd) => g.dug.has(cx + ',' + cd));
}
function paintKeyNear() {
  const id = sensedKey();
  const k = (id || '') + '|' + Math.round(g.px) + '|' + Math.round(g.pd);
  if (k === paintedNear) return;
  paintedNear = k;
  ui.keyNear.classList.toggle('hidden', !id);
  if (!id) return;
  ui.keyNear.textContent = DEF[id].name.toUpperCase() + ' NEAR';
  ui.keyNear.style.color = '#' + DEF[id].color.toString(16).padStart(6, '0');
}

export function updateHUD() {
  /* The chip names WHERE YOU ARE, and it is the only always-visible place that
     happens.

     It used to name the planet, which was right when a planet was a place you
     flew to and stayed on. There is one planet now, so a chip reading "Verdax"
     for the entire game says nothing at all - while the thing it could be
     saying changes every time you cross a boundary, which is the single
     clearest way a player finds out that regions exist.

     The trait rides along with it for the same reason it always did: a
     modifier you have to open a menu to remember is a modifier you play
     without. Stable is left unlabelled, so the first hour never learns that
     traits are a thing before it has seen one bite. */
  const tr = worldTrait();
  const here = regionName(regionAt(Math.round(g.px), Math.max(0, Math.round(g.pd))));
  ui.planet.textContent = tr.id === 'stable'
    ? here
    : here + '  ·  ' + tr.name.toUpperCase();
  ui.credits.textContent = Math.floor(g.credits).toLocaleString();
  ui.haul.textContent = haulValue().toLocaleString();
  /* "CORE 452 m" was the other thing that stopped being true. The core was the
     end of a world you were passing through; the floor of the one world is
     just how deep it goes, and naming it after the thing you used to break
     there points the player at an objective that is no longer the objective. */
  ui.depth.textContent = 'DEPTH ' + Math.max(0, Math.round(g.pd)) + ' m   /   ' + coreM() + ' m DEEP';
  paintAnchorPips();
  paintCallLamp();
  paintKeyNear();
  /* The dials take fractions and do their own smoothing - see gauges.ts. The
     two numbers under them are the exact reading a needle cannot give you, and
     fuel is the one that decides whether to turn round. Rounded UP, so a gauge
     never prints 0% while there is still a metre of climb in the tank. */
  const fuelFrac = clamp(g.fuel / S.fuelCap(), 0, 1);
  const hullFrac = clamp(g.hull / S.hullCap(), 0, 1);
  const weightFrac = clamp(g.weight / S.cargoCap(), 0, 1);
  ui.fuelTxt.textContent = Math.ceil(fuelFrac * 100) + '%';
  ui.cargoTxt.textContent = g.weight.toFixed(1) + ' / ' + S.cargoCap() + ' KG';
  const isDocked = docked() && g.mode === 'play';
  /* Round fifteen, Y8. The shop opens at the pad AND at any open gate's
     station - the Ballast panel and the seal below stay `isDocked` alone,
     since reading the planet is the pad's job and repairing it the scar's. */
  ui.btnShop.style.display = shopHere() && g.mode === 'play' ? '' : 'none';
  /* The Ballast button carries its own alarm. It is the only place the
     campaign's state reaches the HUD, and it only does so when there is
     something to do about it - a button that is always shouting is a button
     nobody reads. */
  const bal = el('btnBallast');
  if (bal) {
    /* Round fifteen, Y5: and not before the planet has started to go. The
       readout is the LAST half of that milestone, not the first - `unrest.ts`
       holds back the drain itself, and this holds back the only place it
       reaches the HUD. Both off one question, `ballastStarted`. */
    bal.style.display = isDocked && ballastStarted(g.ground) ? '' : 'none';
    const low = g.ground.ballast < BALLAST_LOW || g.ground.collapsed.length > 0;
    bal.textContent = 'BALLAST  ' + Math.round(g.ground.ballast * 100) + '%';
    bal.classList.toggle('armed', low);
  }
  /* Round fifteen, Y7. The scar is a PLACE, so the button is only there while
     you are standing in one - and only when there is something in the hold it
     would take, because a control that can do nothing is a control that
     teaches the player to ignore the row it is in. */
  const seal = el('btnSeal');
  if (seal) {
    /* Round seventeen, AF: and not before the first core. Until then the
       Ballast is full and nothing drains it, so a scar has nothing to take.
       No percentage on it either: what a repair does shows in the rock. */
    const at = !isDocked && g.mode === 'play' && ballastStarted(g.ground) &&
               scarHere(Math.round(g.px), Math.round(g.pd), g.ground.lit) >= 0;
    seal.style.display = at && repairable(g.cargo) && repairRoom(g.ground) > 0.001 ? '' : 'none';
    seal.textContent = 'SEAL THE SCAR';
  }

  if (g.up.auto > 0 && !atSurface() && g.mode === 'play') {
    ui.btnAuto.style.display = '';
    ui.btnAuto.textContent = 'AUTOPILOT  ' + Math.ceil(g.pd * S.autoRate()) + ' FUEL';
  } else {
    ui.btnAuto.style.display = 'none';
  }
  /* ---------- heat, as its own channel ----------

     Three signals, all saying the same thing at different volumes, none of
     them shared with any other kind of damage:

       the ember fill    how much soak you are carrying
       the -x.x/s label  that heat is draining the hull, and how fast
       the ember edges   that you are inside the zone right now

     The rate is the load-bearing one. It appears on the hull bar only while
     heat is actually flowing, so the connection between the two is not
     something the player has to be told. */
  /* The readout has to use the same world-scaled curve the loop does, or the
     number on the hull bar disagrees with the hull. */
  const heatLine = heatDepth(g.planet, worldTrait());
  const drain = heatDamagePerSecond(g.pd, S.shield(), g.soak, heatLine, coreM() - heatLine);
  const cooking = drain > 0;
  ui.hullTxt.classList.toggle('hot', cooking);
  ui.hullTxt.textContent = cooking ? 'HULL  -' + drain.toFixed(1) + '/s' : 'HULL';
  /* One call for every reading, so the dials cannot end up describing
     different frames. */
  setGauges(fuelFrac, weightFrac, hullFrac, clamp(g.soak, 0, 1));
  /* The reserve, as a fraction of the TANK rather than of what is left - the
     band is a mark on the dial, so it has to be in the dial's own units. */
  setFuelReserve(R.climb / Math.max(1, S.fuelCap()), R.fuelState);
  /* And the printed figure takes the state's colour, because somebody reading
     the number rather than the needle must get the same warning. */
  ui.fuelTxt.className = 'fuel-' + R.fuelState;

  /* Ember edges are heat. They hold a floor the moment you cross the line,
     because damage starts there whether or not you have soaked yet, and fade
     to a residue above it - you are still hot, just not being cooked. */
  ui.heat.style.opacity = String(cooking ? 0.14 + g.soak * 0.36 : g.soak * 0.10);
  updateOrd();

  /* Red is the hull itself, whatever emptied it: heat, a gas pocket, or the
     next thing. A pulse rather than a gauge, because it is an alarm. */
  const danger = clamp((45 - g.hull) / 45, 0, 1);
  ui.alarm.style.opacity = String(danger * (0.35 + 0.25 * Math.sin(performance.now() / 180)));
  updateKit();
}

/* Whether spending this supply right now would do anything at all. Used to dim
   the button rather than disable it: a supply you cannot usefully spend is
   still worth seeing, because the count is the information. */
function supplyIdle(key: string) {
  if (key === 'coolant') return g.soak < 0.02;
  if (key === 'patch') return g.hull >= S.hullCap() - 0.5;
  return g.fuel >= S.fuelCap() - 0.5;
}

/* The power meter and the two ordnance buttons.

   The chip is hidden entirely until something can spend it, because a meter
   for a thing you do not own is a question with no answer. */
export function updateOrd() {
  const owns = g.up.bomb > 0 || g.up.laser > 0;
  ui.powerChip.classList.toggle('hidden', !owns);
  ui.power.textContent = String(Math.floor(g.charge));

  const hidden = g.mode !== 'play' || atSurface();
  for (const [el, lvl, cost] of [
    [ui.ordBomb, g.up.bomb, BOMB_CHARGE] as const,
    [ui.ordLaser, g.up.laser, LASER_CHARGE] as const
  ]) {
    el.classList.toggle('none', lvl <= 0 || hidden);
    el.classList.toggle('cold', g.charge < cost);
    const n = el.querySelector('.n');
    if (n) n.textContent = String(cost);
  }

  /* And what the cores handed over. Round fifteen, Y4. A button exists only
     once its core is broken, off `g.ground.gates` like everything else this
     round - no second list, and no flag that could disagree with the save. */
  for (const [el, key] of [
    [ui.abSee, 'hollow'] as const,
    [ui.abSink, 'sink'] as const
  ]) {
    const has = hasAbility(g.ground.gates, key, g.skills);
    el.classList.toggle('none', !has || hidden);
    /* The Hollow is the only one that runs off power; sinking is paid in hull
       and is therefore never cold, only expensive. */
    el.classList.toggle('cold', key === 'hollow' && g.charge <= 0);
    el.classList.toggle('on', has && (key === 'hollow' ? R.seeHeld : R.sinkHeld));
  }
}

export function updateKit() {
  const hidden = g.mode !== 'play' || atSurface();
  for (const b of supBtns) {
    const n = g.kit[b.sup.key];
    b.el.classList.toggle('none', n <= 0 || hidden);
    b.el.classList.toggle('idle', supplyIdle(b.sup.key));
    const count = b.el.querySelector('.n');
    if (count) count.textContent = String(n);
  }
}

export function buildManifest() {
  ui.manifestRows.innerHTML = '';
  const vm = valueM();
  const rows = Object.keys(g.cargo).filter((k) => g.cargo[k] > 0)
    .sort((a, b) => g.cargo[b] * DEF[b].value - g.cargo[a] * DEF[a].value);
  if (!rows.length) {
    ui.manifestRows.innerHTML = '<div class="upeff" style="padding:12px 0">Hold empty. Go find a deposit.</div>';
  }
  for (const k of rows) {
    const o = DEF[k], n = g.cargo[k];
    const row = document.createElement('div');
    row.className = 'up';
    row.innerHTML =
      '<span class="dot" style="background:#' + o.color.toString(16).padStart(6, '0') + '"></span>' +
      '<div class="upinfo"><div class="upname">' + o.name + ' <span class="mult">x' + n + '</span></div>' +
      (isKey(k)
        /* Round seventeen, AK: a key is banked at the pad, never sold. */
        ? '<div class="upeff">' + (n * o.wt).toFixed(1) + ' kg · a key, kept at the pad, never sold</div></div>' +
          '<div class="val">KEY</div>'
        : '<div class="upeff">' + (n * o.wt).toFixed(1) + ' kg · ' + Math.round(o.value * vm).toLocaleString() + ' each</div></div>' +
          '<div class="val">◈ ' + Math.round(n * o.value * vm).toLocaleString() + '</div>');
    ui.manifestRows.appendChild(row);
  }
  ui.manifestTotal.textContent = '◈ ' + haulValue().toLocaleString();
  buildVault();
}

/* What is banked at the pad, in depth order. This is the half of the manifest
   that turns it from a receipt into a plan: the hold says what you are
   carrying, the vault says what the Outfitter is still waiting on. */
export function buildVault() {
  /* Geodes sort in with the ores rather than trailing them: the list is in
     depth order, and depth order is how the player reads "where do I go". */
  const rows = [...ORES, GEODE]
    .sort((a, b) => a.min - b.min)
    .filter((o) => (g.stock[o.id] || 0) > 0);
  ui.vault.innerHTML = '';
  if (!rows.length) {
    ui.vault.innerHTML =
      '<div class="upeff" style="padding:10px 0">Nothing banked yet. Minerals are kept when you sell, ' +
      'and the Outfitter wants them for anything past level three.</div>';
    return;
  }
  for (const o of rows) {
    const row = document.createElement('div');
    row.className = 'up';
    row.innerHTML =
      '<span class="dot" style="background:#' + o.color.toString(16).padStart(6, '0') + '"></span>' +
      '<div class="upinfo"><div class="upname">' + o.name + '</div>' +
      '<div class="upeff">from ' + o.min + ' m</div></div>' +
      '<div class="val">' + (g.stock[o.id] || 0) + '</div>';
    ui.vault.appendChild(row);
  }

    if (g.won) {
    const w = document.createElement('div');
    w.className = 'upeff';
    w.style.marginTop = '10px';
    /* Z1: the same turn `vaultReached`'s own card states, kept to one line
       because this sits in a sidebar a player may reread many times over. */
    w.textContent = 'The center is open. The cores held one entity, not energy - ' +
      'it is loose now, and it is quiet because of you.';
    ui.vault.appendChild(w);
  }
}

/* The shop is a room now, so this builds the HEADER and the card for whatever
   case is currently picked - not a list. The room itself is station.ts.

   Everything underneath is unchanged: costs, level caps, the mineral gate and
   the depth seals all still come from config, and the buy path is the same one
   the list used. Only the presentation moved. */
/* ---------- the fitting bay, round seventeen AN ----------

   His ask of 2026-09-25: *"a full overhaul of the shop for visuals, structure,
   and how upgrades are purchased."* The walked gas station is gone: no aisles,
   no cases re-sorting by price, no drawer, no four arrows. The ship stands on
   its lift in the room; six systems sit in a strip under it; the chosen
   system's lines are a scrolling rack of cards, each saying in one sentence
   what it does, what the number goes from and to, what it costs, and which
   keys it wants - with the buy button on the card, in the thumb's third. Two
   taps from an open bay to a new level: the system, then the buy.

   Supplies live in the system they serve (a coolant flush is HULL), so there
   is no second place to look. A found device is a card like any other, owned
   from the moment it came out of the rock; one never found is not shown at
   all, which keeps it a discovery. */
const SYS_ICON: Record<string, string> = {
  drill: '<svg viewBox="0 0 24 24"><path d="M12 22 7 9h10z"/><path d="M8 5h8v4H8z"/><path d="M10 13h4M9.5 16h5"/></svg>',
  hold: '<svg viewBox="0 0 24 24"><path d="M3 8l9-4 9 4v9l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v9"/></svg>',
  engines: '<svg viewBox="0 0 24 24"><path d="M8 3h8v7l-4 3-4-3z"/><path d="M9 14c0 3 3 4 3 7 0-3 3-4 3-7"/></svg>',
  hull: '<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>',
  sensors: '<svg viewBox="0 0 24 24"><path d="M5 19a10 10 0 0 1 0-14"/><path d="M9 15a5 5 0 0 1 0-6"/><circle cx="14" cy="12" r="2"/><path d="M14 14v7"/></svg>',
  ordnance: '<svg viewBox="0 0 24 24"><circle cx="11" cy="14" r="6"/><path d="M15 9l3-3M17 4l3 3"/></svg>'
};

let baySys: SystemKey = 'drill';
/* Which card the keyboard is on - the arrows and Enter drive the bay too. */
let bayPick = 0;
export function baySystem(): SystemKey { return baySys; }
/* Where the bay opens. At a gate, on the system holding that gate's own
   counter - Sink at the first until it is learned, then the key trade - so
   the thing only this gate sells is the first thing on screen. */
export function openBay() {
  const place = placeNow();
  if (place < 0) return;
  const d = dealAt(place);
  const sys: SystemKey | null = place === SINK_GATE && !g.skills.includes('sink') ? 'engines'
    : d ? SUPPLY_SYSTEM[d.supply] : null;
  if (sys) { baySys = sys; bayPick = 0; }
}
export function selectSystem(k: SystemKey) {
  if (k !== baySys) bayPick = 0;
  baySys = k;
  buildShop();
  ui.rack.scrollTop = 0;
}
export function stepSystem(dir: number) {
  const i = SYSTEMS.findIndex((x) => x.key === baySys);
  selectSystem(SYSTEMS[(i + dir + SYSTEMS.length) % SYSTEMS.length].key);
}
export function stepCard(dir: number) {
  const n = ui.rack.querySelectorAll('.bcard').length;
  if (!n) return;
  bayPick = Math.max(0, Math.min(n - 1, bayPick + dir));
  buildShop();
  const el = ui.rack.querySelectorAll('.bcard')[bayPick] as HTMLElement | undefined;
  if (el) el.scrollIntoView({ block: 'nearest' });
}
/* The keyboard's confirm: press the picked card's own buy button. */
export function confirmCard(): boolean {
  const card = ui.rack.querySelectorAll('.bcard')[bayPick] as HTMLElement | undefined;
  const btn = card ? card.querySelector('button.bbuy') as HTMLButtonElement | null : null;
  if (!btn || btn.disabled) return false;
  btn.click();
  return true;
}

/* Where the bay is standing: the pad, or the gate the ship is docked at.
   Round seventeen, AO: the same bay everywhere, a different counter. */
function placeNow(): Place { return docked() ? -1 : gateHere(); }

/* The lines a system shows, in the order the table lists them: what this
   counter stocks (see vendor.ts; found devices included, unfound ones not). */
function linesOf(sys: SystemKey): Upgrade[] {
  return vendorLines(placeNow(), g.best.depth, g.found).filter((u) => u.system === sys);
}
function suppliesOf(sys: SystemKey): Supply[] {
  if (!sellsSupplies(placeNow())) return [];
  return SUPPLIES.filter((sp) => SUPPLY_SYSTEM[sp.key] === sys && g.foundKit.includes(sp.key));
}

/* The gate's own two things (AO): its one key-priced supply a visit, and Sink
   at the first gate. Each shows in the system it serves. */
function dealIn(sys: SystemKey) {
  const d = dealAt(placeNow());
  return d && SUPPLY_SYSTEM[d.supply] === sys ? d : null;
}
function dealOk(): boolean {
  const d = dealAt(placeNow());
  if (!d || R.dealTaken) return false;
  const sp = SUPPLY_OF[d.supply];
  return g.kit[d.supply] < sp.max && (g.stock[d.key] || 0) >= d.need;
}
const sinkHere = (sys: SystemKey) => sys === 'engines' && placeNow() === SINK_GATE;
function sinkOk(): boolean {
  return !g.skills.includes('sink') && g.credits >= SINK_PRICE.credits &&
    (g.stock[SINK_PRICE.key] || 0) >= SINK_PRICE.need;
}

/* Whether anything in a system can be bought right now - the strip's pip. */
function canBuyIn(sys: SystemKey): boolean {
  for (const u of linesOf(sys)) if (buyState(u).ok) return true;
  for (const sp of suppliesOf(sys)) if (g.kit[sp.key] < sp.max && g.credits >= sp.cost) return true;
  if (dealIn(sys) && dealOk()) return true;
  if (sinkHere(sys) && sinkOk()) return true;
  return false;
}

interface BuyState {
  ok: boolean; sealed: boolean; maxed: boolean; capped: boolean; short: boolean;
  /* This counter does not fit the next rung (AO): 'pad' when it is an earlier
     rung the pad fits, 'deeper' when it is a later one. */
  elsewhere: '' | 'pad' | 'deeper';
  cost: number; keys: { id: string; need: number }[]; next?: number;
}
function buyState(u: Upgrade): BuyState {
  const lvl = g.up[u.key];
  const sealed = g.best.depth < u.unlock;
  const maxed = lvl >= u.max;
  const capped = !maxed && lvl >= levelCap(u, g.best.depth);
  const keys: { id: string; need: number }[] = [];
  if (!maxed) for (const m of [matCost(u, lvl), capstoneCost(u, lvl)]) if (m) keys.push(m);
  const short = keys.some((m) => (g.stock[m.id] || 0) < m.need);
  const cost = costOf(u, lvl);
  const next = TIER_DEPTHS.find((d) => d > g.best.depth);
  const place = placeNow();
  const elsewhere = maxed || sellsRung(u, lvl, place) ? ''
    : lvl < rungBand(u, place)[0] ? 'pad' : 'deeper';
  return { ok: !sealed && !maxed && !capped && !short && !elsewhere && g.credits >= cost,
           sealed, maxed, capped, short, elsewhere, cost, keys, next };
}

export function buildShop() {
  ui.shopCredits.textContent = Math.floor(g.credits).toLocaleString();
  /* Where you are, never a planet name: the pad, or the gate you are standing
     in (round seventeen - the header said "DOCK 04 · VERDAX" off a vestigial
     planet field). */
  const gate = gateHere();
  ui.shopSub.textContent = gate >= 0 && !docked()
    ? 'GATE ' + (gate + 1) + ' · ' + gateDepth(gate) + ' M · SAVED HERE' : 'THE PAD';
  buildStrip();
  buildRack();
  reframeIfNeeded();
}

function buildStrip() {
  ui.systems.innerHTML = '';
  for (const sys of SYSTEMS) {
    const b = document.createElement('button');
    b.className = 'sysb' + (sys.key === baySys ? ' on' : '') + (canBuyIn(sys.key) ? ' can' : '');
    b.dataset.sys = sys.key;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(sys.key === baySys));
    b.innerHTML = SYS_ICON[sys.key] + '<span>' + sys.name + '</span><i class="pip"></i>';
    b.onclick = () => { sfx.ui(); selectSystem(sys.key); };
    ui.systems.appendChild(b);
  }
}

const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');

function buildRack() {
  ui.rack.innerHTML = '';
  let i = 0;
  /* The gate's own counter (AO) comes FIRST: it is the reason to stop here
     rather than at the pad, and below the lines it sat under the fold. */
  const deal = dealIn(baySys), sink = sinkHere(baySys);
  if (deal || sink) {
    const h = document.createElement('div');
    h.className = 'bsub';
    h.textContent = 'THIS GATE ONLY';
    ui.rack.appendChild(h);
    if (sink) ui.rack.appendChild(sinkCard(i++ === bayPick));
    if (deal) ui.rack.appendChild(dealCard(deal, i++ === bayPick));
  }
  for (const u of linesOf(baySys)) ui.rack.appendChild(upgradeCard(u, i++ === bayPick));
  const sups = suppliesOf(baySys);
  if (sups.length) {
    const h = document.createElement('div');
    h.className = 'bsub';
    h.textContent = 'SUPPLIES';
    ui.rack.appendChild(h);
    for (const sp of sups) ui.rack.appendChild(supplyCard(sp, i++ === bayPick));
  }
  if (!i) {
    const e = document.createElement('div');
    e.className = 'bwhat';
    e.style.padding = '14px 4px';
    e.textContent = 'Nothing in this system yet. Some of it is still in the rock.';
    ui.rack.appendChild(e);
  }
}

function keyChip(m: { id: string; need: number }): string {
  const d = DEF[m.id];
  const have = g.stock[m.id] || 0;
  const short = have < m.need;
  return '<span class="bkey upmat' + (short ? ' short' : '') + '"><i style="background:' + hex(d.color) + '"></i>' +
    m.need + ' ' + d.name + ' · you have ' + have +
    (short && isOre(d) ? ' · from ' + d.min + ' m' : '') + '</span>';
}

function upgradeCard(u: Upgrade, picked: boolean): HTMLElement {
  const lvl = g.up[u.key];
  const st = buyState(u);
  const card = document.createElement('div');
  card.className = 'bcard' + (picked ? ' sel' : '') + (st.sealed ? ' dim' : '');
  card.dataset.key = u.key;
  const label = u.tiers ? u.name + ' — ' + u.tiers[Math.min(lvl, u.tiers.length - 1)] : u.name;
  let html =
    '<div class="bhead"><div class="bname">' + label + '</div>' +
    '<div class="blvl">' + (st.sealed ? 'SEALED' : 'Lv ' + lvl + '/' + u.max) + '</div></div>' +
    '<div class="bwhat">' + (WHAT[u.key] || '') + '</div>';
  if (st.sealed) {
    html += '<div class="bnote">Sealed until you have reached ' + u.unlock + ' m</div>';
  } else {
    html += '<div class="beff">' + u.effect(lvl) + (st.maxed ? '' : ' → <b>' + u.effect(lvl + 1) + '</b>') + '</div>';
    if (st.keys.length) html += '<div class="bkeys">' + st.keys.map(keyChip).join('') + '</div>';
    if (st.elsewhere && !st.capped) {
      const [lo, hi] = rungBand(u, placeNow());
      html += '<div class="bnote">This gate fits levels ' + (lo + 1) + ' to ' + hi +
        (st.elsewhere === 'pad' ? ' · the pad fits the ones before' : '') + '</div>';
    } else if (st.capped) {
      html += '<div class="bnote">The rig will not take another at this depth' +
        (st.next ? ' · past ' + st.next + ' m it will' : '') + '</div>';
    }
  }
  card.innerHTML = html;
  const btn = document.createElement('button');
  btn.className = 'bbuy buy';
  btn.textContent = st.sealed ? u.unlock + ' m'
    : st.maxed ? 'FULLY FITTED'
    : st.capped ? (st.next ? 'PAST ' + st.next + ' M' : 'HELD')
    : st.elsewhere === 'pad' ? 'FIT AT THE PAD'
    : st.elsewhere ? 'NOT AT THIS GATE'
    : 'FIT  ◈ ' + st.cost.toLocaleString();
  btn.disabled = !st.ok;
  btn.onclick = () => buyLine(u);
  card.appendChild(btn);
  return card;
}

function supplyCard(sp: Supply, picked: boolean): HTMLElement {
  const held = g.kit[sp.key];
  const full = held >= sp.max;
  const card = document.createElement('div');
  card.className = 'bcard' + (picked ? ' sel' : '');
  card.dataset.key = sp.key;
  card.innerHTML =
    '<div class="bhead"><div class="bname">' + sp.name + '</div><div class="blvl">' + held + '/' + sp.max + ' aboard</div></div>' +
    '<div class="bwhat">' + sp.blurb + '</div>';
  const btn = document.createElement('button');
  btn.className = 'bbuy cbuy';
  btn.textContent = full ? 'HOLD IS FULL' : 'BUY  ◈ ' + sp.cost.toLocaleString();
  btn.disabled = full || g.credits < sp.cost;
  btn.onclick = () => {
    if (full || g.credits < sp.cost) return;
    g.credits -= sp.cost;
    g.kit[sp.key]++;
    sfx.buy();
    hap.buy();
    save(); buildShop(); updateHUD();
    flash('rgba(120,255,200,.25)', 160);
  };
  card.appendChild(btn);
  return card;
}

/* Sink, the skill the first gate sells (AO). Once, and then it is the ship's. */
function sinkCard(picked: boolean): HTMLElement {
  const owned = g.skills.includes('sink');
  const card = document.createElement('div');
  card.className = 'bcard' + (picked ? ' sel' : '');
  card.dataset.key = 'sink';
  card.innerHTML =
    '<div class="bhead"><div class="bname">Sink</div><div class="blvl">' + (owned ? 'LEARNED' : 'A SKILL') + '</div></div>' +
    '<div class="bwhat">Hold SINK and the ship falls straight through solid rock, paying in hull instead of time. The pad never teaches it.</div>' +
    (owned ? '' : '<div class="bkeys">' + keyChip({ id: SINK_PRICE.key, need: SINK_PRICE.need }) + '</div>');
  const btn = document.createElement('button');
  btn.className = 'bbuy buy';
  btn.textContent = owned ? 'LEARNED' : 'LEARN  ◈ ' + SINK_PRICE.credits.toLocaleString();
  btn.disabled = !sinkOk();
  btn.onclick = () => {
    if (!sinkOk()) return;
    g.credits -= SINK_PRICE.credits;
    g.stock[SINK_PRICE.key] -= SINK_PRICE.need;
    g.skills.push('sink');
    sfx.buy(); hap.buy();
    flash('rgba(169,124,255,.28)', 220);
    toast('SINK LEARNED · hold it to fall through rock');
    save(); buildShop(); updateHUD();
  };
  card.appendChild(btn);
  return card;
}

/* The gate's one key-priced supply a visit (AO). */
function dealCard(d: { supply: string; key: string; need: number }, picked: boolean): HTMLElement {
  const sp = SUPPLY_OF[d.supply as keyof typeof SUPPLY_OF];
  const held = g.kit[sp.key];
  const card = document.createElement('div');
  card.className = 'bcard' + (picked ? ' sel' : '');
  card.dataset.key = 'deal-' + sp.key;
  card.innerHTML =
    '<div class="bhead"><div class="bname">' + sp.name + '</div><div class="blvl">' + held + '/' + sp.max + ' aboard</div></div>' +
    '<div class="bwhat">' + sp.blurb + ' One a visit, and this gate takes keys, not credits.</div>' +
    '<div class="bkeys">' + keyChip({ id: d.key, need: d.need }) + '</div>';
  const btn = document.createElement('button');
  btn.className = 'bbuy cbuy';
  btn.textContent = R.dealTaken ? 'TAKEN THIS VISIT' : held >= sp.max ? 'HOLD IS FULL' : 'TRADE  ' + d.need + ' ' + DEF[d.key].name.toUpperCase();
  btn.disabled = !dealOk();
  btn.onclick = () => {
    if (!dealOk()) return;
    g.stock[d.key] -= d.need;
    g.kit[sp.key]++;
    R.dealTaken = true;
    sfx.buy(); hap.buy();
    flash('rgba(120,255,200,.25)', 160);
    save(); buildShop(); updateHUD();
  };
  card.appendChild(btn);
  return card;
}

/* Buying a level: spend, fit, and show it being fitted. */
export function buyLine(u: Upgrade) {
  const st = buyState(u);
  if (!st.ok) return;
  g.credits -= st.cost;
  for (const m of st.keys) g.stock[m.id] = (g.stock[m.id] || 0) - m.need;
  g.up[u.key]++;
  if (u.key === 'tank') g.fuel = padFuel();
  if (u.key === 'scan') lamp.distance = S.light();
  if (u.key === 'drill') setDrillTier(g.up.drill);
  setUpgradeHardware(g.up);
  sfx.buy();
  hap.buy();
  boltOn(u.key);
  save(); buildShop(); updateHUD();
}

/* `buildSupplies` is gone with the grid it built.

   It rendered six chips into the tray, which is where they had been since
   before the Outfitter was a room at all. They are crates in a drawer under
   the counter now and `refreshKit()` in station.ts draws them, for the same
   reason `refreshBays` draws the upgrade cases: the room owns what the room
   shows. */

export function audioLabels() {
  if (ui.btnHaptics) {
    ui.btnHaptics.textContent = 'HAPTICS  ' + (haptics.on ? 'ON' : 'OFF');
    ui.btnHaptics.classList.toggle('off', !haptics.on);
  }
  ui.btnMusic.textContent = 'MUSIC  ' + (audioState.music ? 'ON' : 'OFF');
  ui.btnSfx.textContent = 'SOUND  ' + (audioState.sfx ? 'ON' : 'OFF');
  ui.btnMusic.classList.toggle('off', !audioState.music);
  ui.btnSfx.classList.toggle('off', !audioState.sfx);
  /* The sliders follow the saved level, and go visibly dead when their own
     channel is muted - a control that can do nothing has to look like it
     (`POLISH.md`, and he has asked for it by name in two other games). */
  ui.volMusic.value = String(Math.round(audioVolume.music * 100));
  ui.volSfx.value = String(Math.round(audioVolume.sfx * 100));
  ui.volMusic.disabled = !audioState.music;
  ui.volSfx.disabled = !audioState.sfx;
  ui.volMusic.parentElement?.classList.toggle('off', !audioState.music);
  ui.volSfx.parentElement?.classList.toggle('off', !audioState.sfx);
}

/* The credits, from the file `POLISH.md` requires and `scripts/assets.py`
   appends to - imported raw so the one source of truth is the markdown rather
   than a copy of it in here. Rendered as its own rows, not as HTML: it is a
   table in a file nobody proofreads for markup. */
let creditsBuilt = false;
export function buildCredits() {
  if (creditsBuilt) return;
  creditsBuilt = true;
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const rows = CREDITS_MD.split('\n')
    .filter((l) => l.trim().startsWith('|') && !/^\s*\|[\s|:-]*\|\s*$/.test(l))
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
  if (rows.length < 2) { ui.creditsPanel.innerHTML = '<div class="upeff">No credits recorded.</div>'; return; }
  ui.creditsPanel.innerHTML = rows.slice(1).map((c) =>
    '<div class="rel"><div class="relhead">' + esc(c[2] || '') +
    '  <span class="d">' + esc(c[3] || '') + '</span></div>' +
    '<div class="upeff">' + esc(c[1] || '') + (c[0] ? '  ·  ' + esc(c[0]) : '') + '</div></div>'
  ).join('') +
    '<div class="upeff" style="margin-top:10px">Audio is synthesized at runtime; no sound files are used.</div>';
}




/* ---------- the Ballast panel ----------

   The one screen where the campaign is a decision rather than a reading.

   It opens at the pad only, because the two bars on it are the sort of thing
   that would rot into wallpaper if they
   were on the HUD while you dig. `CRAFT.md`: a HUD is a claim about what the
   player should be thinking about, and what they should be thinking about
   underground is fuel and the way home.

   Round seventeen, AD: it used to list banked ore to feed it with. Repair is
   packing a scar now (Y7), so what is left is the reading and where the work
   is. */
export function buildBallast() {
  const s = g.ground;
  const u = worldUnrest();
  const pct = Math.round(s.ballast * 100);

  const sub = el('balSub');
  if (sub) {
    /* Says what it is DOING, not what it is. The rate is the thing a player
       can act on, and it is the only place the drain is ever stated - the
       machine outside shows it as a vent and a needle and never as a number. */
    const tier = s.lit.length;
    /* The cores are in this now (Y6), or the panel quotes the player a number
       the machine outside has stopped obeying - and it is the one place in the
       game the drain is ever stated, so a stale one here is the game lying. */
    const secs = s.ballast > 0
      ? s.ballast / ballastDrain(u, tier, s.collapsed.length, s.gates.length) : 0;
    sub.textContent = s.ballast <= 0
      ? 'Empty. The ground is going to give somewhere.'
      : 'Holding for about ' + Math.max(1, Math.round(secs / 60)) + ' more minutes of digging'
        + (tier > 0 ? ' · ' + tier + ' anchor' + (tier === 1 ? '' : 's') + ' broken' : '');
  }
  const fill = el('balFill');
  if (fill) {
    fill.style.width = pct + '%';
    fill.classList.toggle('low', s.ballast < BALLAST_LOW);
  }
  const pctEl = el('balPct');
  if (pctEl) pctEl.textContent = pct + '%';
  const safe = el('balSafe');
  if (safe) {
    safe.style.left = Math.round(BALLAST_SAFE * 100) + '%';
    /* The shoring line only means anything while there is something to shore,
       so it is only drawn then. A permanent mark whose significance is
       conditional is a mark you learn to ignore. */
    safe.style.display = s.collapsed.length ? '' : 'none';
  }
  const unFill = el('balUnFill');
  if (unFill) {
    unFill.style.width = Math.round(u * 100) + '%';
    /* The BAND's own colour, flat, and not a green-to-red gradient across the
       fill. A gradient belongs to the track it is measured against; painted on
       the fill it compresses into the bar's own width, so a Calm planet drew a
       little rainbow with red in it. The colour is the reading. */
    unFill.style.background = '#' +
      UNREST_BANDS[unrestBand(u)].color.toString(16).padStart(6, '0');
  }
  const unEl = el('balUn');
  if (unEl) unEl.textContent = UNREST_BANDS[unrestBand(u)].name.toUpperCase();

  /* ---- fallen ground ---- */
  const fallen = el('balFallen');
  if (fallen) {
    fallen.innerHTML = '';
    for (const r of s.collapsed) {
      const row = document.createElement('div');
      row.className = 'fallen';
      const first = r === s.collapsed[0];
      const can = first && s.ballast >= BALLAST_SAFE;
      row.innerHTML =
        '<div class="upinfo"><div class="upname">' + regionName(r) + ' has come down</div>' +
        '<div class="upeff">' + (first
          ? 'Shoring it costs ' + Math.round(BALLAST_SHORE_COST * 100) + '% of the Ballast'
          : 'Waiting on the ground above it') + '</div></div>' +
        (first ? '<button class="buy" data-shore="1"' + (can ? '' : ' disabled') + '>SHORE UP</button>' : '');
      fallen.appendChild(row);
    }
  }

  /* ---- where repair happens ----

     Round fifteen, Y7, and this used to be a list of FEED buttons: every ore
     you had banked, with a donate control beside it. That is the thing his
     brief names - *"I want repairing the planet to have an actual mechanic
     rather than just feeding it materials"* - and rule 12 says the stand-in
     goes in the same commit as the real thing rather than sitting beside it.

     What is left is a readout and one sentence saying where the work is. The
     panel still has a job: it is where you find out how much is left in the
     tank and which ground has come down, and both of those are things you
     check before you decide what to put in the hold. */
  const rows = el('balRows');
  if (!rows) return;
  rows.innerHTML = '';
  const broken = s.lit.length;
  rows.innerHTML = broken === 0
    ? '<div class="upeff" style="padding:10px 0">Nothing to pack it with yet. ' +
      'The Ballast is filled at the Anchors, and you have not broken one.</div>'
    : '<div class="upeff" style="padding:10px 0">Fill it at a scar. Carry ore ' +
      'down to an Anchor you broke and pack it into the hole, and it settles ' +
      'the ground around it. ' + broken + ' of them are open to you.</div>';
}
