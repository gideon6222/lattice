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

- **The new progression, past its first box.** His ask of 2026-10-02 (locked, found, earned;
  DESIGN.md "Progression and unlocks"). The rule is in pure code (BA, `src/sim/bay.ts`) but the
  bay does not use it yet: racks still run past three, there is no Next line, no Ledger, and
  the six new finds and feats do not exist.

## Next three milestones

Done 2026-09-30: **V0**, the internal track, and **AU**, the sounds he settled on. Done
2026-10-02: **BA**, the shelf rule as code (tested, not yet drawn).

1. **BB** - the bay shows three and one shadow, with the Next line and a KIT drawer.
2. **BC** - the Ledger and the feats.
3. **BD** - the Ore Sorter. Then BE to BI (see MILESTONES.md); **Z2**, the desk's perf reading,
   waits for the Play install.

## For Gideon

- A phone run with your own eyes on the first two runs once BB is in: is the first buy quick
  and does the one shadow on a rack make you want to dig? (2026-10-02, the bay)

## Phone readings

None in the studio's format: the desk cannot launch a web game (2026-09-30). His own checks on
the S26 Ultra, 2026-09-30: back, HUD and offline all good. The last desk evidence (2026-09-14):
full gate green, 86 of 150 draw calls in the worst window.
