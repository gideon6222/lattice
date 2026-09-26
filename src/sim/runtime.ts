/* Shared mutable loop state.

   These were plain `let` bindings at the top of app.ts. Once the file is split
   they are written in one module and read in another, and you cannot assign to
   an imported binding — `import { shake } from ...; shake = 0.5` is a compile
   error. So they live on one mutable object, exactly the way `g` already does.

   Only state that genuinely crosses a module boundary belongs here. Things the
   frame loop alone touches (camZBoost, freeze, thrustLevel, bank, last,
   skyTick) stay local to loop.ts, and per-module caches (lastRow, pHead,
   resetArmed) stay with their module. */

import type { Dir, Dig, Flight } from '../types';
import { blankLog } from './telemetry';

/* The crossing between worlds, while it is running. Null the rest of the
   time, exactly like `flight`. */
export type Transit = {
  t: number; dur: number;
  dest: { world: number; trait: string; coreOff: number; rich: number; fuel: number };
  leg: number;
};

export const R = {
  /* How many tremors have fired this run. It is the seed coordinate for the
     collapse, so the roll that decides which cells fall is reproducible - the
     one event in the game a replay could not repeat until M5. */
  tremorN: 0,
  /* The same, for lodes. Its own counter rather than sharing the tremor's, so
     a lode cut and a tremor landing in one descent cannot consume each other's
     rolls - the separation every generator in this game keeps, and for the same
     reason: a shared stream makes one feature's change move another's output. */
  lodeN: 0,
  /* Seconds elapsed in the ending shot, or -1 when it is not running.

     Round twelve, V9. Counts UP so `endingBoost(t)` stays a pure function of
     elapsed time rather than an accumulator the loop decays - a dropped frame
     cannot shorten a shot that is read off a clock. -1 rather than 0 because 0
     is a real instant in it. */
  endShot: -1,
  /* Round seventeen, AM. The camera's lean toward a key the drill just cut:
     seconds left, and where it leans. Null the rest of the time. It moves the
     camera only and never the ship, and a change of direction ends it that
     frame, so it can never cost a thumb anything. */
  keyHold: null as { t: number; x: number; y: number; dir: string | null } | null,
  /* Wall-clock seconds since landing on this world, for the fastest-core
     record. Reset by arrive(); read once, when a core breaks. */
  worldT: 0,
  /* The way in, while it is running; see intro.ts. The intro's clock, or
     CONTINUE's. Null the rest of the time, exactly like `flight`. */
  intro: null as { t: number; started: boolean; done: boolean } | null,
  arrive: null as { t: number; done: boolean; to: { px: number; pd: number } | null } | null,
  /* Where the world streams from, the lamp floods from and the camera looks,
     when that is not the ship. Null in play, which means "the ship". The
     intro and CONTINUE move this and leave the ship where it is. */
  eye: null as { px: number; pd: number } | null,
  /* whether the ship is in the picture at all */
  shipShown: true,
  /* the sky and the surface light, 0 night .. 1 the world's own day */
  dawn: 1,
  /* the lamp, 0..1 of its play intensity */
  lampLevel: 1,
  /* the per-world ambience clock; see ambience.ts */
  amb: { t: 0 },
  /* The timed consumables, while they are running.

     Run-scoped and NOT saved, unlike the kit counts. A window you bought and
     paid for is part of a descent; carrying one across a reload would make it
     a permanent upgrade you can bank, which is the axis these exist to be the
     opposite of. Cleared by goSurface() with everything else. */
  odT: 0,          /* seconds of Overdrive left */
  pulseT: 0,       /* seconds of Survey Pulse left */
  bulwark: 0,      /* impacts the Bulwark Field will still absorb */
  transit: null as Transit | null,
  /* input -> loop */
  held: null as Dir | null,
  /* Round fifteen, Y4. Whether the Sink button is DOWN, which is not the same
     question as whether the ship is sinking: a ship already inside rock keeps
     going until it reaches air whatever the thumb is doing, or letting go
     halfway through a wall would seal it in. */
  sinkHeld: false,
  /* And whether the ship IS sinking, which is a latch rather than a reading.

     It is set by the button and cleared when the ship reaches air, so letting
     go halfway through a wall does not seal you in - but it never starts on
     its own. The first version had no latch and asked `embedded()` directly,
     which meant a ship that was inside rock for ANY reason began sinking the
     moment it had the ability: the e2e that drills tier 2's core put the ship
     in solid ground the way a fixture does, and it sank straight past the core
     without cutting it and reported "the gate stayed shut". A ship sinking
     because of where it happens to be is not a verb the player has. */
  sinking: false,
  /* Whether The Hollow is being held. A lens costs charge by the second, so
     this is the only ability the loop has to keep asking about. */
  seeHeld: false,

  /* actions <-> loop */
  /* Velocity, in cells per second. Replaced the cell-to-cell `moving` lerp:
     the ship has a position and a speed now, and the frame loop integrates
     them like anything else. */
  vx: 0,
  vy: 0,
  /* Edge trigger for arriving at the pad, since selling used to happen on
     landing in a cell and there are no cell arrivals any more. */
  wasAtSurface: true,
  /* The same shape, for a gate's station: which tier the ship was last at, or
     -1. Round fifteen, Y8. */
  wasAtGate: -1,
  /* Round seventeen, AO: whether this gate visit's one key trade is spent.
     Cleared on arriving at a gate, the same edge that writes the checkpoint. */
  dealTaken: false,
  digging: null as Dig | null,
  /* This run's telemetry. Lives here rather than in `g` because it is reset at
     the pad and folded into the all-time totals there; only the totals are
     worth saving. */
  run: blankLog(),
  flight: null as Flight | null,

  /* actions -> loop: what is currently eating the hull, so the tow screen
     names the right cause. Heat is the default because it is the only
     continuous drain; a gas pocket overwrites it on the frame it fires. */
  hullCause: 'heat' as 'heat' | 'gas' | 'sink',

  /* Whether the last frame was inside the heat zone, so crossing in can
     announce itself once instead of every frame. */
  wasHot: false,

  /* Tremor clock. `tremorT` counts down to the next one and is reset whenever
     the ship leaves the unstable band, so surfacing genuinely resets the
     threat rather than merely pausing it. */
  tremorT: 0,
  tremorWarn: 0,

  /* Say "hold full" once per trip, not once per block. */
  warnedFull: false,

  /* And say what a wreck is once per descent, not once per plate.

     Round thirteen, W2. A hull plate is five or six cells of the same block, so
     a line on every break would be the toast repeating at itself while the
     player cuts one wall. Once per trip rather than once ever, because a wreck
     is per region and each descent is a different one - and because the whole
     purpose of the line is the moment of recognising what you have cut into,
     which happens again in Kryllon even though it happened in Rustmoor. */
  sawWreck: false,

  /* Credits handed back for a deleted upgrade, so main.ts can say so once the
     HUD exists. Set during load(), which runs long before anything can show a
     toast. */
  refund: 0,

  /* ---------- the Point of No Return ----------

     `climb` is the fuel it would take to fly the route home from here, and
     `fuelState` is what to do about it. Both live here rather than being
     recomputed where they are read, because the route is a breadth-first
     search over every dug cell and three different things want the answer -
     the dial, the readout and the warning tone.

     Recomputed on `climbT`, a few times a second rather than every frame. A
     BFS per frame at four hundred metres of tunnel is not free, and the answer
     does not change meaningfully in sixteen milliseconds. */
  climb: 0,
  climbT: 0,
  fuelState: 'clear' as 'clear' | 'plan' | 'danger' | 'stranded',
  /* So the escalating tone and the haptic fire on the EDGE rather than every
     frame they are true for. */
  warnedFuel: 'clear' as 'clear' | 'plan' | 'danger' | 'stranded',

  /* actions -> loop, decayed by the loop */
  shake: 0,
  squash: 0,

  /* written by resize() in scene.ts, read by the camera block in loop.ts */
  camZ: 13
};
