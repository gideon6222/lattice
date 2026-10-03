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

- **The new progression, past its fifth box.** His ask of 2026-10-02 (locked, found, earned;
  DESIGN.md "Progression and unlocks"). The bay draws the rule (BB). The Ledger (pause sheet:
  DEVICES, FEATS, RELICS) and `src/sim/feats.ts` exist (BC). Three feats now hand over a device
  at rung 1 through `FEAT_DEVICES`: the Ore Sorter (BD, a full hold sold), the Pressure Seal and
  the Resonance Tip (BE, `src/sim/hazards.ts`: gas hits for less and the top rungs vent it, hard
  rock needs fewer strikes). The lost-ship feat still hands over nothing (BF). Thresholds (4 gas
  pockets, 40 hard-rock cells) are from the pure world, not a bot, and were kept. Rockfall has
  no hull damage in the game, so the Seal covers gas only. The Sorter works on the drill only.
  The first lost ship now hands over the Return Beacon (BF, `src/sim/beacon.ts`): hold HOME two
  seconds underground, once a run, and the ship climbs to the pad keeping 50/65/80/90% of the
  ore and all keys. It is dark in the bay until the box lands. Kept shares are the design's own
  numbers, BH measures them. None of the four gifts has an e2e, only pure tests.
- **Flare Line and Arc Lance** (BG, `src/sim/flare.ts`, `lance.ts`, `ROOM_FINDS`): two finds in
  crates beside a wreck (40 m) and an Anchor hall (150 m). Crates join the world only once
  you have been within 20 m, so the frozen block golden is unchanged. They ask for no keys,
  because the rock has no key slack left. Pure tests only.
- **A shot of the bay.** `studio deliver` refuses web builds, so BB was proved by e2e only.

## Next three milestones

Done 2026-09-30: **V0**, the internal track, and **AU**, the sounds he settled on. Done
2026-10-02: **BA**, the shelf rule as code, **BB**, the bay that draws it, and **BC**, the
Ledger and the feats, and **BD**, the Ore Sorter, and **BE**, the Pressure Seal and Resonance Tip, and **BF**, the Return Beacon, and **BG**, the Flare Line and Arc Lance.

1. **BH** - Pacing bots.
2. **BI** - The notes for players.
3. See MILESTONES.md; **Z2**, the desk's perf reading, waits for the
   Play install.

## For Gideon

- Do the Flare Line and Arc Lance feel found: dig to about 40 m for the wreck crate at the left
  edge, throw a flare in a dark pocket, and later find the Anchor-hall crate near 189 m and
  follow a vein with the Arc button? Check the four-button ordnance row fits. (2026-10-03, BG)

## Phone readings

None in the studio's format: the desk cannot launch a web game (2026-09-30). His own checks on
the S26 Ultra, 2026-09-30: back, HUD and offline all good. The last desk evidence (2026-09-14):
full gate green, 86 of 150 draw calls in the worst window.
