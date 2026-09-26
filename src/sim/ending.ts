/* The ending: the light leaves. Round seventeen, AH.

   His answer of 2026-09-24, asked whether the ending shows a creature: *"Yes,
   the light leaves."* Nothing is drawn that is the thing; what the player sees
   is what it does. The light of every core they released leaves the scar it
   has burned in since, and gathers at the center; then the planet goes dark
   from the center upward, the camera riding up just ahead of the dark; and at
   the top the sky over the pad has taken the core's colour. Only then the
   card - a card first is a sentence read over a world that has not yet done
   the thing the sentence is about.

   One timeline, pure and a function of elapsed seconds, so a dropped frame
   cannot shorten it, the filmstrip can hold any moment of it still, and a test
   can walk it. The renderer (barrier.ts, lightmap.ts, loop.ts) only reads it. */

import { START_X } from './config';
import { coreColumn, gateDepth } from './gate';
import { VAULT_CORE_X, VAULT_CORE_D } from './vaults';

export const END_GATHER = 3.0;     /* the lights travel to the center */
export const END_HOLD = 0.8;       /* gathered, they flare and go out */
export const END_RISE = 4.6;       /* the dark climbs from the center to the pad */
export const END_SKY = 1.6;        /* the sky over the pad turns */
export const END_CARD_AT = END_GATHER + END_HOLD + END_RISE + END_SKY + 0.4;
/* How long the dark takes to lift once the card has been read. The planet is
   "quiet now", not dead: the ground after the ending is still somewhere to be. */
export const END_LIFT = 4.0;

const ease = (u: number) => { const k = Math.max(0, Math.min(1, u)); return k * k * (3 - 2 * k); };

/* Where one released core's light is, `t` seconds in: from its own spent core
   to the center, on a curve that swings wide rather than a straight line, so
   three of them read as coming FROM somewhere. Returns cell coordinates. */
export function moteAt(t: number, tier: number): { x: number; d: number; k: number } {
  const x0 = coreColumn(tier), d0 = gateDepth(tier);
  /* Fast out of the scar and slow into the center: the paths are hundreds of
     metres and the camera is on the center, so the arrival is the part that
     is seen, and it is given most of the time. */
  const k = Math.max(0, Math.min(1, t / END_GATHER));
  const u = 1 - Math.pow(1 - k, 3);
  const swing = Math.sin(u * Math.PI) * (tier % 2 === 0 ? -1 : 1) * (6 + tier * 3);
  return { x: x0 + (VAULT_CORE_X - x0) * u + swing, d: d0 + (VAULT_CORE_D - d0) * u, k: u };
}

export interface EndFrame {
  /* 0..1: how far the released lights have left their scars. */
  gather: number;
  /* 0..1: the gathered light at the center, up and then out. */
  flare: number;
  /* The depth, in metres, above which the world is still lit. Below it the
     planet has gone dark. Starts at the floor, ends above the pad. */
  front: number;
  /* 0..1: how dark "dark" is. */
  dark: number;
  /* 0..1: how far the sky over the pad has turned. */
  sky: number;
  /* Where the camera looks, in cells. */
  eyeX: number; eyeD: number;
  card: boolean;
  /* Whether the camera has cut to the pad. */
  cut: boolean;
  /* 0..1: the screen going to black and back through the cut, on game time
     so a dropped frame or a filmstrip cannot stretch it. */
  black: number;
}

/* How deep the dark's front is when the camera arrives at the pad. */
export const END_FRONT_FROM = 60;

export function endingAt(t: number): EndFrame {
  const gather = ease(t / END_GATHER);
  const tHold = t - END_GATHER;
  const flare = tHold <= 0 ? 0 : tHold < END_HOLD ? Math.sin((tHold / END_HOLD) * Math.PI) : 0;
  const tRise = t - END_GATHER - END_HOLD;
  const r = ease(tRise / END_RISE);
  /* The dark below the center is already total by the time the camera is
     back at the pad; what the player watches is its last sixty metres, the
     part daylight can show, coming up out of the ground and over the pad. */
  const front = tRise <= 0 ? VAULT_CORE_D + 8 : END_FRONT_FROM - (END_FRONT_FROM + 12) * r;
  const dark = tRise <= 0 ? 0 : 0.9;
  const sky = ease((t - END_GATHER - END_HOLD - END_RISE + 0.4) / END_SKY);
  /* The camera is on the center while the lights arrive, then cuts to the
     pad. The first version rode up the world ahead of the dark and filmed
     four seconds of black: the eye was inside solid rock, and rock lit by
     nothing is the one thing a lamp cannot show. */
  const eyeD = tRise <= 0 ? VAULT_CORE_D - 2 : -1;
  const eyeX = tRise <= 0 ? VAULT_CORE_X : START_X;
  const black = tRise <= 0 ? Math.max(0, Math.min(1, (tRise + 0.3) / 0.3))
    : Math.max(0, 1 - tRise / 0.9);
  return { gather, flare, front, dark, sky, eyeX, eyeD, card: t >= END_CARD_AT, cut: tRise > 0, black };
}
