# State

Moved onto the studio 2026-09-22. Rounds one to seventeen shipped (`journal/legacy-plan.md`).
Round eighteen is the sounds (DESIGN.md, "Round eighteen: the sound of things").

His launch bar (AV, AW, AX) is met 2026-10-01 and not yet in a Play build.

## What still does not exist

- **A reviewed app on Play.** 7 (0.56.0) is live on the internal track (2026-09-30). The app was
  sent for Google's review the same day (listing, content rating, privacy policy now at
  privacy/lattice.html, ads declared none); until it passes, testers see a temporary name.
- **Web builds in the studio.** `studio ship` and `studio deliver` do not build the TWA, and
  this repo has no signing or Play secrets, so the listing-sync workflow cannot run either.
  The bundle is built by tools/twa.ps1 and uploaded by hand.
- **A studio phone reading.** Possible now that Play installs `com.gideon.lattice` (Z2).
- **The new progression, past its eighth box.** His ask of 2026-10-02 (locked, found, earned;
  DESIGN.md "Progression and unlocks"). The bay draws the rule (BB). The Ledger (pause sheet:
  DEVICES, FEATS, RELICS) and `src/sim/feats.ts` exist (BC). Four feats hand over a device at
  rung 1 through `FEAT_DEVICES`: Ore Sorter (BD, full hold sold), Pressure Seal and Resonance Tip
  (BE, gas and hard rock), Return Beacon (BF, `src/sim/beacon.ts`: hold HOME two seconds
  underground, once a run, climb to the pad keeping 50/65/80/90% of ore and all keys, no fuel).
  The Seal covers gas only and the Sorter the drill only. BJ's five e2e specs cover each gift's
  banner and bay card, and the Beacon hold (gas and hard rock bump the counter, not real play).
- **Pacing is a floor** (BH, BK, `studio run pacing`, `test/pacing.test.mjs`): the bot plays the
  whole game in 52 runs and 66 minutes, first buy run 1, Sorter run 2, no rung over four runs of
  saving. It loses a ship on purpose at run 4 and holds the Beacon then. Every device is met by
  run 47, before the third barrier at run 51. All asserted.
- **Flare Line and Arc Lance** (BG, `src/sim/flare.ts`, `lance.ts`, `ROOM_FINDS`): two finds in
  crates beside a wreck (40 m) and an Anchor hall (150 m). Crates join the world only once
  you have been within 20 m, so the frozen block golden is unchanged. They ask for no keys,
  because the rock has no key slack left. Measured in the browser 2026-10-03 (crate on screen
  1.5 s before pickup, banner 4 s, flare 2x bright at 30 frames and 1.5x at a minute, the Arc's
  vein breaks over 15 frames). The ordnance row has both edges and fits at 360 and 412 wide.
- **A light e2e.** The browser run is pinned to 3 CPUs beside other gates and 6 alone, below
  normal priority (`tools/e2e-cpu-cap.mjs`). Gate smoke is about 24 min. `npm run e2e:measure`
  prints wall time and browser CPU. The whole measure is 27 min and the desk cuts a call at 10,
  so run it in parts: `-- --part 1/8` to `8/8`, `-- --report` sums, `-- --reset` clears,
  `-- -g "<title>"` runs touched scenes. All eight only at the end of a phase.

## Next three milestones

Done 2026-09-30: **V0** and **AU**. Done 2026-10-02 and 03: **BA** to **BK**
(0.57.0 is in the changelog and `store/release-notes`, not yet built or uploaded to Play).

1. **Z2** - the phone read of this phase (0.57.0 build, four shots, three readings). Needs the phone.
2. See MILESTONES.md for anything after it.

## For Gideon

Nothing open.

## Phone readings

None in the studio's format: the desk cannot launch a web game (2026-09-30). His own checks on
the S26 Ultra, 2026-09-30: back, HUD and offline all good.
