/* The Flare Line: the first wreck's find. Progression round, BG.

   Flares are thrown ahead of the ship and light a dark pocket for a minute, so
   a cave can be read before you commit to it. A flare is a light added to the
   lights: the propagated light still only darkens (`coreLit()` clamps at 1) and
   the lightmap is never boosted for it.

   Four rungs: how many flares a run carries (they are restocked at the pad) and
   how far each one lights. Pure: the caller holds the flares and the lights. */

export const FLARE_MAX = 4;
/* A minute at full light, then the last FADE seconds (flares.ts) guttering out.
   It was 60 in all, so the light was already fading at the one-minute mark. */
export const FLARE_SECONDS = 66;
/* How many cells ahead a flare flies before it lands. */
export const FLARE_THROW = 6;

const PER_RUN = [0, 2, 3, 4, 6];
const RADIUS = [0, 4, 5, 6, 7];
const clampLevel = (l: number) => Math.max(0, Math.min(FLARE_MAX, Math.floor(l || 0)));
export const flaresPerRun = (level: number) => PER_RUN[clampLevel(level)];
export const flareRadius = (level: number) => RADIUS[clampLevel(level)];

/* Whether one can be thrown: owned, underground, one left. */
export const flareReady = (level: number, thrown: number, underground: boolean) =>
  (level || 0) >= 1 && underground && thrown < flaresPerRun(level);

/* Where a flare lands: along the facing until the next cell is closed, at most
   FLARE_THROW cells out. `open` says whether a cell is air. */
export function flareLand(open: (x: number, d: number) => boolean, sx: number, sd: number,
                          dx: number, dy: number): { x: number; d: number } {
  let x = sx, d = sd;
  for (let i = 1; i <= FLARE_THROW; i++) {
    if (!open(sx + dx * i, sd + dy * i)) break;
    x = sx + dx * i; d = sd + dy * i;
  }
  return { x, d };
}

/* How many flares can burn at once. A fixed pool, like the cores' lights: the
   shader and the scene's light count are fixed at compile time. The oldest is
   put out when a fourth is thrown. */
export const FLARE_POOL = 3;
