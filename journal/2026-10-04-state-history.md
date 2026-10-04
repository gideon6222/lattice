# History moved out of STATE.md, 2026-10-04

- His launch bar (AV, AW, AX) met 2026-10-01, not yet in a Play build.
- Progression (his ask 2026-10-02, DESIGN.md "Progression and unlocks"): the bay draws the rule
  (BB). The Ledger (pause sheet: DEVICES, FEATS, RELICS) and `src/sim/feats.ts` (BC). Four feats
  hand over a device at rung 1 through `FEAT_DEVICES`: Ore Sorter (BD, full hold sold), Pressure
  Seal and Resonance Tip (BE, gas and hard rock), Return Beacon (BF, `src/sim/beacon.ts`: hold
  HOME two seconds underground, once a run, climb to the pad keeping 50/65/80/90% of ore and all
  keys, no fuel). The Seal covers gas only and the Sorter the drill only. BJ's five e2e specs
  cover each gift's banner and bay card.
- Pacing is a floor (BH, BK, `studio run pacing`, `test/pacing.test.mjs`): the bot plays the
  whole game in 52 runs and 66 minutes, first buy run 1, Sorter run 2, no rung over four runs of
  saving. It loses a ship on purpose at run 4 and holds the Beacon then. Every device is met by
  run 47, before the third barrier at run 51.
- Flare Line and Arc Lance (BG, `src/sim/flare.ts`, `lance.ts`, `ROOM_FINDS`): crates beside a
  wreck (45 m) and an Anchor hall of the second barrier (189 m). Crates join the world only once
  you are within 20 m, so the block golden is unchanged. No keys asked. Measured in the browser
  2026-10-03: crate on screen 1.5 s before pickup, banner 4 s, flare 2x bright at 30 frames and
  1.5x at a minute, the Arc vein breaks over 15 frames.
- Done 2026-09-30: V0 and AU. Done 2026-10-02 and 03: BA to BK.
- Z3 done 2026-10-04: `studio run film-beacon`, `film-arc`, `film-flare` (after `studio run
  build`) film the three moments. Z1b done: `studio run film-hullgifts`. The Seal ring and
  flare canisters are small at bay size, so Z2's phone shot judges them.
- E2E: browser run pinned to 3 CPUs beside other gates, 6 alone (`tools/e2e-cpu-cap.mjs`).
  `npm run e2e:measure` takes 27 min and the desk cuts a call at 10.
- The room-crate smoke test took 47 s alone and the gate hit its time cap 7 times on 2026-10-04.
  Trimmed: settle 4 s to 1.5 s, drill starts 14 m above the crate rather than 18.
