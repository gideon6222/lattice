# The Lattice

3D planet-mining PWA. One planet, 61 columns wide and 452 metres deep, twelve regions each
with their own rock and rules. Fly a drill ship down, sell ore at the surface pad, buy
upgrades, and hunt the nine ANCHORS buried across the world; the ninth opens the Vault at
the centre, and that is the end.

Live: **https://gideon6222.github.io/lattice/**. Repo: github.com/gideon6222/lattice.
Target: Samsung S26 Ultra, Chrome, portrait, installed to the home screen. Engine: `web`
(three.js, TypeScript, Vite). Current version: see `src/changelog.ts`.

Use the `build-game` skill for any change here. Read `STATE.md` first (what still does not
exist, the next three milestones, phone readings), then the milestone in `MILESTONES.md`,
whose `design:` line names the `DESIGN.md` section it belongs to. Run `studio brief
<trigger>` for a moment a milestone touches (the `web` trigger covers three.js, Vite, PWA
and TWA specifics) before writing that part. `DESIGN.md` also carries a full "Engineering
reference" section (stack, file map, invariants, calibrated numbers) moved out of this file
during the studio migration.

## Do not break these without reading DESIGN.md's Engineering reference first

- `src/sim/**` is the pure simulation and has no renderer in it (the sim-wall gate check
  enforces this: no `document`, `window`, `THREE`, `requestAnimationFrame`, `performance`,
  `Math.random`). `test/sim-boundary.test.mjs` is this game's own extra check on top of it.
- World generation is a pure seeded hash, `rnd(x, d, planet)`. Anything new that generates
  content must roll on its own seed offset, or every existing value at every depth on every
  planet shifts and the diff looks unrelated.
- `test/baseline/blocks-frozen.json` is a frozen golden, re-recorded only for a deliberate
  ore rebalance, diff read first. `ORES` must stay ordered deepest-first with strictly
  increasing `chance`, and `GRANITE_TO_SCORIA === HEAT_DEPTH` (both 70) is asserted equal by
  a test because they drifted apart silently once.
- `g.planet` and `g.world` are vestigial (there is one planet now); nothing new should read
  either — use `regionAt(x, d)`. `test/vestigial.test.mjs` freezes the read count.
- Every shader injection goes through `chainCompile`, never a bare `onBeforeCompile`
  assignment (it silently discards whatever was already there), and `Material.clone()` drops
  `onBeforeCompile`/`customProgramCacheKey` so a cloned material needs them reapplied by hand.
- The propagated light only ever darkens (`coreLit()` clamps at 1); if the world needs to be
  brighter, change the lights, not the lightmap.
- localStorage keys keep the old `coreward.*` names on purpose — the origin, not the path,
  scopes storage, and renaming them would orphan every existing save.
- `AudioContext` starts only on a real user gesture (first `pointerdown`/`keydown`); the
  graph is built atomically and published only when complete.

## Files worth knowing before a big change

`src/main.ts` boots; `src/loop.ts` is `frame()`; `src/scene.ts` is the renderer; `src/ui.ts`
is the HUD and screens; `src/actions.ts` is sell/autopilot/ordnance/Anchor moments;
`src/sim/*` is everything pure (config, state, world, light, feel, fly, region, unrest,
vaults, ambience, intro). Import direction is one-way: types → `src/sim` → shader →
lightmap → renderer modules → ui → actions → loop.

## Local development

```
npm install
npm run check   # typecheck, tests, build, size, e2e — the gate, in fail-fast order
npm run dev     # vite dev server, no service worker
```
