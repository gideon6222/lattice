# The Lattice: look

Confirmed 2026-10-18 for the release check at ece0d0f. It writes down the style the game already has
(DESIGN.md, "The look" and "Presentation"); it changes none of it.

## Mood

A buried machine world, seen from a drill ship's small light. Dark, quiet, wet rock with bright
ore and a wrongness that grows as you break things open.

- Deep Rock Galactic: ore that glows against a dark wall is the reward, and the dark is what makes it read.
- Subnautica: the further down, the more the lights are all you have.
- Hades (UI): heavy plates with a bevel, warm print on dark metal, one glow colour per meaning.

## Palette (role: hex)

- Ground: rock tints per region, kept dark (host colours in `src/sim/config.ts`).
- Hero light: cyan `#3fe0ff` (haul, the ship's own light).
- Reward: amber `#ffc861` (credits), then each ore's own colour.
- Fuel: green `#4be08a`.
- Hazard: red `#ff5c6b` (hull) and gas yellow-green `#d4ee2a`.
- Wrongness: `--wrong`, set at boot from `src/sim/wrongness.ts`: the scar and core colour.
- UI plate: `#32353d` to `#191b20`, ink `#e6e3dc`, dim text `#aeaaa1`, dial print aged ivory `#cdbf9d`.

## Shape language

Safe is a round, lit, lamp-like thing (pad, ship, dial). Danger is a hard-edged dark shape or a
green-yellow glow. Reward is a small bright faceted fleck. The barrier is a straight band across the
whole width, never a round thing.

## Surface rule

Flat-shaded instanced blocks with one generated grain over the top. Two rules in one frame only
for the UI plates, which carry a bevel (see Broken on purpose).

## Hour, fog, grade

No sun. Underground black fog and a propagated light that only ever darkens. Vignette and grain
on; no bloom (fake fresnel glow on ore instead).

## Sizes

One cell is the ship's width. A tunnel is one cell wide, a door is the barrier row, a step is one cell.

## Sound

Beds per region, a pitch per ore (deeper is lower and heavier), music that stays out of the way.

## Never

- No bright daylight scene.
- No colour that changes meaning (cyan haul, amber credits, green fuel, red hull stay put).
- No text under 12 px on a dark plate.
- No count in the Next line.
- No light that makes the world brighter than the lights themselves (the lightmap only darkens).

## Broken on purpose

- Bevelled, grained UI plates over flat-shaded rock: the screen is a ship's console, so it should look like a device.
- Ore glows in the dark through unlit rock: the reward must read at a distance.
