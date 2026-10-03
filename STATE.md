# State

Moved onto the studio 2026-09-22. Rounds one to seventeen shipped (`journal/legacy-plan.md` has
the early history). Round eighteen is his ask of 2026-09-29, that the sounds stop being
cartoony (DESIGN.md, "Round eighteen: the sound of things").

Met 2026-10-01, his launch bar (AV, AW, AX): a player never sees the stack overlay or the
RUN LOG (both behind ?debug or the dev server); a crash is logged to the console and to
`coreward.crash`, and the next boot puts the ship back on the pad with the progress kept; the
pause sheet reads `v<version> | <commit> | release`; WHAT'S NEW starts at 0.39.0, the first
Play upload. Not yet in a Play build: the next ship carries it.

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
- **A shot of the bay.** `studio deliver` refuses web builds, so BB was proved by e2e only.

## Next three milestones

Done 2026-09-30: **V0**, the internal track, and **AU**, the sounds he settled on. Done
2026-10-02: **BA**, the shelf rule as code, **BB**, the bay that draws it, and **BC**, the
Ledger and the feats, and **BD**, the Ore Sorter, and **BE**, the Pressure Seal and Resonance Tip, and **BF**, the Return Beacon.

1. **BG** - Flare Line and Arc Lance.
2. **BH** - Pacing bots.
3. **BI** (see MILESTONES.md); **Z2**, the desk's perf reading, waits for the
   Play install.

## For Gideon

- A phone run with your own eyes on the first two runs: is the first buy quick, and does the
  one shadow on a rack make you want to dig? Look at the Next line and the KIT button above
  the cards. (2026-10-02, the bay)
- Does the Ore Sorter feel like a gift: fill the hold in a rich seam, sell it, then fill it again
  and watch a cheap ore swap out for a better one? (2026-10-02, BD)

- Do the Pressure Seal and Resonance Tip feel earned: ride out four gas pockets over a few runs,
  cut hard rock in the deep, and see the hull ring and the drill fins arrive? (2026-10-03, BE)

- Does the Return Beacon feel like a rescue: lose a ship, then hold HOME deep down and see the
  climb, the kept share in the toast and the mast on the hull? (2026-10-03, BF)

## Phone readings

None in the studio's format: the desk cannot launch a web game (2026-09-30). His own checks on
the S26 Ultra, 2026-09-30: back, HUD and offline all good. The last desk evidence (2026-09-14):
full gate green, 86 of 150 draw calls in the worst window.
