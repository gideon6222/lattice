# State

Rounds one to seventeen shipped (`journal/legacy-plan.md`). Round eighteen is the sounds
(DESIGN.md, "Round eighteen: the sound of things"). History is in `journal/`.

## What still does not exist

- **A reviewed app on Play.** 7 (0.56.0) is on the internal track, sent for Google's review
  2026-09-30. Until it passes, testers see a temporary name.
- **Web builds in the studio.** `studio ship` and `studio deliver` do not build the TWA. The
  bundle is built by tools/twa.ps1 and uploaded by hand.
- **A studio phone reading.** Possible now that Play installs `com.gideon.lattice` (Z2).
- **The 0.57.0 build on Play.** Progression (locked, found, earned: BB to BK), the four feat
  gifts, the Flare Line and Arc Lance crates and the pacing floor are all in the changelog
  and `store/release-notes`, not yet built or uploaded.
- **A light e2e.** Gate smoke is about 26 min. Run `npm run e2e:measure` in parts:
  `-- --part 1/8` to `8/8`, `-- --report`, `-- --reset`, `-- -g "<title>"`.

## Next three milestones

1. **Z2** - the named phone list (upload 0.57.0 first, three shots, flare-lit readings).
   Needs the phone.

## For Gideon

Z2 is the only open box and needs the phone: 0.57.0 must be built with tools/twa.ps1 and
uploaded to Play by hand, then installed, before the three shots and flare-lit readings.

Menus (2026-10-04): the menu standard is applied by hand (the Godot kit does not cover web).
`test-results/menus-sheet.png` is the before-and-after of every menu screen. The shop's six
tabs, per-card FIT buttons and the gauge cluster are not reduced yet. Rebuild the sheet with
`studio run menus-after` then `studio run menus-sheet` (`menus-before` needs a `.before/` build of an older commit).

## Phone readings

None in the studio's format. His own checks on the S26 Ultra, 2026-09-30: back, HUD and
offline all good.
