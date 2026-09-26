import * as THREE from 'three';
import { renderer, scene as gameScene, SHIP_LAYER } from './scene';
import { player, rig, flames, setUpgradeHardware, fitImportedHardware } from './ship';
import { loadShipParts } from './shipparts';
import { loadStationProps, buildRoom, LIFT_X, LIFT_Z, type Room } from './stationroom';
import { g } from './sim/state';

/* The Outfitter, as a room you are standing in.

   Playtest: "can you rearrange how the shop is layed out? make it look like a
   full room where upgrades have a physical model associated with it instead of
   a list of upgrades."

   It was a scrolling list on a styled background, and a list is a list however
   it is dressed. This is a second three.js scene: a hangar bay with the ship
   parked on a deck and the upgrades racked around it in lit display cases.

   Two decisions carry most of the value.

   THE SHIP IN HERE IS THE SHIP. `player` is reparented out of the game scene
   into this one, not copied. The machine on the deck is wearing exactly the
   hardware it will wear when you undock, and buying something changes the thing
   you are looking at. A copy would be a second source of truth and would drift
   inside a single session.

   THE PARTS IN THE CASES ARE THE PARTS. Same geometry, same materials,
   exported from ship.ts as HW. The model on the pedestal is not a picture of
   the upgrade, it is the upgrade - so "what changes in the shop" and "what
   changes in play" cannot disagree, because there is only one set of art.

   Its own scene rather than a corner of the game world, because the lighting
   here wants to be a lit workshop and the game's wants to be a dark hole, and
   one set of lights cannot be both. */

export const stationScene = new THREE.Scene();
/* The station gets a real background, unlike the game.

   The renderer runs `alpha: true` with no scene background so the game's CSS
   sky can show through - which is right underground and wrong in here, where it
   showed as a band of planet-coloured sky above the back wall. A scene
   background is per-scene, so setting one here does not disturb that. */
stationScene.background = new THREE.Color(0x090c12);
export const stationCamera = new THREE.PerspectiveCamera(46, 1, 0.1, 60);
/* Framed for a room rather than for a wall of cases.

   The old shot sat level with a shelf and looked straight at it, which is the
   right camera for the thing that used to be here and the wrong one for a
   deck with plinths on it. This stands back and a little above and looks down
   into the room, which is the diorama framing the fixed-camera research points
   at: foreground rail, plinths, ship, back wall, in four readable layers. */
/* Standing at a counter, not looking down into a diorama.

   The old shot stood back and above because the room was a deck with plinths
   on it. A shop you walk along wants eye level: the counter in the near third,
   the rack and the sign behind it, and the aisle you are NOT in sliding past
   the edges of frame. Only x moves - the height and the distance are the same
   at every station, which is what makes the glide read as walking rather than
   as a camera being flown somewhere. */
export const CAM_AIM_Y = -0.16;
export const CAM_AIM_Z = -1.4;
stationCamera.position.set(0, 0.48, 5.35);
stationCamera.lookAt(0, CAM_AIM_Y, CAM_AIM_Z);
/* The ship lives on its own layer so the game's lamp cannot blow it out. That
   decision follows it in here: without this the station camera does not RENDER
   it and the station's lights do not reach it, which presented as an empty
   docking clamp and took a moment to recognise. */
stationCamera.layers.enable(SHIP_LAYER);

/* ---------- the room ---------- */

/* The bay is TALL, not wide, and that is forced by the screen.

   Portrait is about 0.46 aspect, so at a 46 degree vertical field the
   horizontal one is only ~22 degrees: at eight units back you can see 6.8 units
   of height and barely 3.1 of width. A hangar laid out sideways - the obvious
   shape for a hangar - puts most of itself off the edges of a phone. So the
   cases are racked in two vertical columns flanking the ship, which is both
   what fits and what a parts wall in a workshop actually looks like. */
/* The room's shell is gone from here.

   It was a six-by-six box with a back wall, two returns, ribs, a hazard stripe
   and a docking collar, all built before the imported room existed and all of
   it now inside a box the camera pans out of. `buildRoom()` in stationroom.ts
   owns the building - the deck, the wall, the four bays and the forecourt -
   which is the "one writer per phase" rule applied to a room: two modules both
   drawing a floor is two floors, and the second one is always the one you can
   see the seam of. */

/* ---------- lights ----------

   A workshop. Strong key from above and in front so the ship's facets read, a
   cool fill from behind so it is not sitting in a void, and a warm bounce off
   the deck. None of it changes with depth: the point of the room is that it is
   the one place in the game that is properly lit. */
/* Lit for neon, which means lit DARK.

   These were a workshop's lights: a strong warm key, a cool fill and a bright
   ambient, set when this room was a hangar whose job was to show the ship's
   facets clearly. Against the round-six room they were the whole problem. The
   sourced cyberpunk rule is saturated accents against a dark, desaturated
   base - "neon is rationed, not everywhere" - and a base lit to 1.15 ambient
   is not a dark base. The screenshot showed a mid-grey wall with a pink line
   on it, which is the same complaint as round five's in a different disguise:
   the fitting was fine and the room around it was drowning it.

   So the ambient is a third of what it was, the key is less than half, and the
   light that actually falls on the counter you are standing at comes from the
   fitting under its lip. The ship keeps enough key to read, because it is the
   one object in here whose shape is game state.

   The three fixed lights do not count against the neon budget - they are
   directional and ambient, which cost one term each regardless of how many
   fragments they touch. Only the point lights are metered. */
const ambLight = new THREE.AmbientLight(0x8fa4c4, 0.38);
ambLight.layers.enable(SHIP_LAYER);
stationScene.add(ambLight);
const keyLight = new THREE.DirectionalLight(0xffe8cc, 1.35);
keyLight.position.set(2.2, 3, 5);
keyLight.layers.enable(SHIP_LAYER);
stationScene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x4a6a9c, 0.55);
fillLight.position.set(-3, 0.5, -2);
fillLight.layers.enable(SHIP_LAYER);
stationScene.add(fillLight);

/* The warm bounce off the deck is gone from here.

   It was a fixed point light at the origin, which in a one-room shop was the
   middle of the floor and in a shop you walk along is a lamp burning in the
   RIG aisle wherever you happen to be standing. The room hands out its own
   lights now and moves them with the camera - see the note on the roaming
   lights in stationroom.ts - and two modules both lighting the same floor is
   the same "one writer per phase" fault as two modules both drawing it.

   It also freed the eighth light. The scene measured eight real lights against
   a stated ceiling of seven, and this was the one nobody had counted.
   */

/* ---------- framing, measured ----------

   Playtest: *"it looks like the description of the upgrade is cutting into the
   bottom upgrades in the cases."*

   He was right and the cause was one number. Measured at 360x780 CSS, which is
   the phone at its device pixel ratio: the bar takes the top 120 px, the tray
   takes the bottom 310, and the room is composed into the 350 px between them -
   45% of the screen. The camera was framing for all 780, so the counter landed
   at y 461 with the tray starting at 470 and the plates hung into it.

   `setViewOffset` SHIFTS the frustum and does not rescale it. That distinction
   took two attempts. The first version passed the visible band's height as the
   virtual full height, which does not move the composition up - it redefines
   the field of view as covering only the band, and everything in the room comes
   out at 47% of the size it was. What is wanted is much smaller: the same
   camera, the same scale, the image slid up by half the difference between what
   the tray covers and what the bar covers, so the composition is centred in the
   gap the player can actually see rather than in the canvas.

   Re-measured on every open rather than stored, because the tray's height is a
   function of the font and the safe-area inset and neither is knowable from
   here.

   AND MEASURED WHEN THE TRAY IS ON SCREEN. The second attempt was worse than
   wrong, it was invisible: `resizeStation()` was called while #shop still
   carried `.hidden`, so every `getBoundingClientRect` returned zero, the guard
   below fired, and the whole thing was a no-op that had been shipping for an
   afternoon while a hand-tuned camera angle quietly did the job instead. It was
   found by deliberately deleting the call and watching the test that guards it
   pass anyway - which is rule 11 catching a construct that could not fail. */
/* Re-frame only if the band has actually moved.

   Called after anything that can change the tray's height. The card reserves
   its tallest size so in practice this finds nothing to do - but a card that
   ever outgrows the reserve would otherwise cover the bottom of the room
   silently, which is exactly what it did before the reserve existed. */
export function reframeIfNeeded() {
  const W = window.innerWidth, H = window.innerHeight;
  const band = visibleBand();
  if (W + ':' + H + ':' + band.top + ':' + band.bottom === lastBand) return;
  resizeStation();
}

export function visibleBand(): { top: number; bottom: number } {
  const H = window.innerHeight;
  const bar = document.querySelector('#shop .shopbar') as HTMLElement | null;
  const nav = document.querySelector('#shop .systems') as HTMLElement | null;
  const tray = document.querySelector('#shop .tray') as HTMLElement | null;
  const top = bar ? bar.getBoundingClientRect().height : 0;
  /* Y11 moved the four arrows out of .aislebar and into .shopnav, just above
     the tray - so the band the camera frames against has to count that bar
     too, or the room gets composed into space the nav bar is now sitting on
     top of. */
  const bottom = (nav ? nav.getBoundingClientRect().height : 0) +
                 (tray ? tray.getBoundingClientRect().height : 0);
  /* A guard, not a nicety. If nothing has been laid out the band is the whole
     screen, which is the old behaviour and is merely unframed rather than
     broken. It must stay rare: see the note above about the afternoon it spent
     firing on every single open. */
  if (top + bottom > H * 0.85) return { top: 0, bottom: 0 };
  return { top, bottom };
}

let lastBand = '';
export function resizeStation() {
  const W = window.innerWidth, H = window.innerHeight;
  const band = visibleBand();
  lastBand = W + ':' + H + ':' + band.top + ':' + band.bottom;
  stationCamera.aspect = W / H;
  /* Slide the image up by half the difference. Same size, same field, just
     centred on the gap between the furniture instead of on the canvas. */
  const shift = (band.bottom - band.top) / 2;
  if (Math.abs(shift) < 1) stationCamera.clearViewOffset();
  else stationCamera.setViewOffset(W, H, 0, shift, W, H);
  stationCamera.updateProjectionMatrix();
}

/* The room, once its models have arrived. */
let room: Room | null = null;
/* Exposed so a test can wait for the thing itself instead of a timeout. */
export function roomReady() { return room !== null; }
/* Which room is showing: -1 the pad, 0.. a gate, null before it is built. */
export function roomPlace() { return room ? room.place() : null; }

/* ---------- docking ---------- */

let docked = false;
export function isDocked() { return docked; }

/* ---------- the bay's ship: turn it, tap it, bolt things to it ---------- */
let bayYaw = 0, bayIdle = 0;
const CAM_Z = 5.35;
/* A horizontal drag on the stage turns the ship. Only the stage turns it; a
   drag that starts on the rack scrolls the rack and nothing else. */
export function turnShip(dxPx: number) {
  bayYaw += dxPx * 0.012;
  bayIdle = 0;
}
export function shipYaw() { return rig.rotation.y; }

let bolting: { t: number; meshes: THREE.Object3D[] } | null = null;
export function boltOn(key: string) {
  const meshes: THREE.Object3D[] = [];
  player.traverse((o) => {
    if (o.userData.part === key && o.parent && o.parent.userData.part !== key && !(o as THREE.InstancedMesh).isInstancedMesh) meshes.push(o);
  });
  /* Instanced rows (tanks, fins, jets, plates, charges) are not scaled: they
     sit at the ship's origin and would swell outward from its middle. The
     camera's lean still marks the moment for them. */
  bolting = { t: 0, meshes };
  bayIdle = 0;
}

/* Which line's part that tap landed on, or null. */
const partRay = new THREE.Raycaster();
/* The ship lives on its own layer so the lamp does not light it (ship.ts), and
   a raycaster only sees layer 0 by default - so a tap on the ship hit nothing
   until it was told to look at every layer. */
partRay.layers.enableAll();
const partNdc = new THREE.Vector2();
export function pickPart(clientX: number, clientY: number): string | null {
  partNdc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
  partRay.setFromCamera(partNdc, stationCamera);
  const hits = partRay.intersectObject(player, true);
  for (const h of hits) {
    let o: THREE.Object3D | null = h.object;
    while (o && !o.userData.part) o = o.parent;
    if (o && o.visible) return o.userData.part as string;
  }
  return null;
}

/* Reparenting, not copying. three removes an object from its old parent when
   it is added to a new one, so this is the whole mechanism - and it is what
   guarantees the ship on the deck is the ship you fly out. */
export function dockShip(place = -1) {
  if (docked) return;
  docked = true;
  /* First time the shop is opened, the imported hardware comes down in its own
     chunk. Deliberately here and not at boot: it is surface detail, the game is
     playable without it, and the entry bundle should not carry a model loader
     for a screen most first sessions reach a minute in. */
  loadShipParts().then(() => { fitImportedHardware(); setUpgradeHardware(g.up); });
  loadStationProps().then(() => {
    if (room) return;
    room = buildRoom();
    if (room) {
      stationScene.add(room.group);
      room.setPlace(place);
    }
  });
  /* Which room is around the lift: the pad, or the gate you docked at. */
  if (room) room.setPlace(place);
  /* Round seventeen, AN: the fitting bay. The room stays at the forecourt,
     where the ship stands on its lift; the aisles, cases and drawer are
     retired and the rack of cards under the ship is the whole shop. */
  bayYaw = 0; bayIdle = 0;
  stationScene.add(player);
  /* On the lift, which is the one thing every room has (round seventeen, AO). */
  player.position.set(LIFT_X - 0.1, 0.24, LIFT_Z);
  /* Bigger than the old forecourt shot: in the bay the ship IS the shop. */
  player.scale.setScalar(1.25);
  rig.rotation.set(0, 0, 0);
  /* Engines off. The frame loop's thruster animation is downstream of the
     branch that returns for a docked ship, so whatever the flames were doing on
     the way in is what they would keep doing forever - a parked ship burning
     its engines inside a hangar. */
  for (const f of flames) { f.cone.visible = false; f.glow.visible = false; }
}
export function undockShip() {
  if (!docked) return;
  docked = false;
  gameScene.add(player);
  player.scale.setScalar(1);
  rig.rotation.set(0, 0, 0);
  for (const f of flames) { f.cone.visible = true; f.glow.visible = true; }
}

export function stepStation(t: number, dt: number) {
  if (room) room.step(t, dt);
  const x = LIFT_X;
  stationCamera.position.x = x;
  stationCamera.lookAt(x, CAM_AIM_Y, CAM_AIM_Z);
  /* The ship on its lift: turned by a drag on the stage, and drifting slowly
     back into a gentle turntable once it has been left alone for a while. */
  bayIdle += dt;
  const drift = bayIdle > 2.5 ? Math.sin(t * 0.32) * 0.35 * Math.min(1, (bayIdle - 2.5) / 2) : 0;
  rig.rotation.y = bayYaw + drift;
  /* The bolt-on moment: the part just bought swells and settles, and the
     camera leans in for it (round seventeen, AN). */
  if (bolting) {
    bolting.t += dt;
    const k = Math.min(1, bolting.t / 0.55);
    const s = 1 + 0.45 * Math.sin(k * Math.PI);
    for (const m of bolting.meshes) m.scale.setScalar(s);
    stationCamera.position.z = CAM_Z - 0.35 * Math.sin(k * Math.PI);
    if (k >= 1) { for (const m of bolting.meshes) m.scale.setScalar(1); stationCamera.position.z = CAM_Z; bolting = null; }
  }
}

export function renderStation() {
  /* The renderer no longer resets its own statistics - see renderWorld() - so
     the station has to, or its counts accumulate for as long as you stand in
     the shop. */
  renderer.info.reset();
  renderer.render(stationScene, stationCamera);
}
