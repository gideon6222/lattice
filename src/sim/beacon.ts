/* The Return Beacon: the lost-ship feat's gift. Progression round, BF.

   A black box is left on the pad when the first ship is lost, and it turns
   into a mast on the hull. Once a run, hold HOME for two seconds underground
   and the ship climbs to the pad on its own, keeping a share of the ore in the
   hold (key minerals always come along, they are banked and never sold). A way
   out when fuel and nerve run low, at a price: the ore it leaves is gone.

   Four rungs: 50, 65, 80 and 90 percent kept. BH sets these against the
   climb's fuel and time; until then they are the design's own numbers.

   Pure: the caller holds the cargo and applies the answer. Imports nothing,
   because config.ts reads `beaconKeep` for the rung text and a cycle between
   the two is a trap. */

export const BEACON_MAX = 4;
export const BEACON_HOLD_SECONDS = 2;

const BEACON_KEEP = [0, 0.5, 0.65, 0.8, 0.9];
export const beaconKeep = (level: number) =>
  BEACON_KEEP[Math.max(0, Math.min(BEACON_MAX, Math.floor(level || 0)))];

/* Whether HOME can be held right now. `used` is the once-a-run latch. */
export const beaconReady = (level: number, used: boolean, underground: boolean) =>
  (level || 0) >= 1 && !used && underground;

/* The hold after the climb: each ore kind keeps its share of units, rounded
   down, and every key comes along whole. Returns a new cargo and its weight. */
export function beaconCargo(cargo: Record<string, number>, level: number,
                            kind: (id: string) => { wt: number; key: boolean } | undefined):
    { cargo: Record<string, number>; weight: number } {
  const keep = beaconKeep(level);
  const out: Record<string, number> = {};
  let weight = 0;
  for (const k of Object.keys(cargo)) {
    const have = cargo[k], def = kind(k);
    if (!(have > 0) || !def) continue;
    const n = def.key ? have : Math.floor(have * keep);
    if (n <= 0) continue;
    out[k] = n;
    weight += def.wt * n;
  }
  return { cargo: out, weight };
}
