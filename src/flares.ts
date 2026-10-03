import { worldX } from './sim/config';
import { R } from './sim/runtime';
import { g } from './sim/state';
import { FLARE_POOL, flareRadius } from './sim/flare';
import { setFlare } from './lightmap';
import { flareLights } from './scene';

/* The Flare Line's burning flares, aged and shown (BG).

   Each flare takes one slot of a fixed pool: a point light in the scene for the
   walls' colour and a uniform in the lightmap shader that raises the lit factor
   around it (clamped at 1, like everything there). The last few seconds gutter
   out rather than snapping off, so the dark does not slam shut. */
const FADE = 6;

export function stepFlares(dt: number) {
  const reach = flareRadius(g.up.flare || 0);
  for (let i = R.flares.length - 1; i >= 0; i--) {
    R.flares[i].t -= dt;
    if (R.flares[i].t <= 0) R.flares.splice(i, 1);
  }
  /* The pool keeps the newest, so a fourth throw puts the oldest out. */
  while (R.flares.length > FLARE_POOL) R.flares.shift();
  for (let i = 0; i < FLARE_POOL; i++) {
    const f = R.flares[i];
    if (!f) { setFlare(i, 0, 0, 1, 0); flareLights[i].intensity = 0; continue; }
    const fade = Math.min(1, f.t / FADE);
    const flick = 1 + 0.06 * Math.sin(f.t * 23 + i * 5) * (f.t < FADE ? 2 : 1);
    const k = fade * flick;
    setFlare(i, worldX(f.x), -f.d, reach + 0.5, Math.min(1, 0.9 * k));
    flareLights[i].position.set(worldX(f.x), -f.d, 0.9);
    flareLights[i].distance = reach * 2;
    flareLights[i].intensity = 14 * k;
  }
}

/* Everything out: a new run, a lost ship, a planet change. */
export function clearFlares() {
  R.flares.length = 0;
  stepFlares(0);
}
