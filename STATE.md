# State

Moved onto the studio 2026-09-22. Rounds one to seventeen shipped (`journal/legacy-plan.md` has
the early history). Round eighteen is his ask of 2026-09-29, that the sounds stop being
cartoony (DESIGN.md, "Round eighteen: the sound of things").

## What still does not exist

- **A reviewed app on Play.** 7 (0.56.0) is live on the internal track (2026-09-30), so testers
  see a temporary name until Google reviews the app; "Send app for review" is greyed out in
  the Console, waiting on something the Console does not name.
- **Web builds in the studio.** `studio ship` and `studio deliver` do not build the TWA, and
  this repo has no signing or Play secrets, so the listing-sync workflow cannot run either.
  The bundle is built by tools/twa.ps1 and uploaded by hand.
- **A studio phone reading.** Possible now that Play installs `com.gideon.lattice` (Z2).

## Next three milestones

Done 2026-09-30: **V0**, the internal track (tester link
https://play.google.com/apps/internaltest/4701290322801317660), and **AU**, the sounds he
settled on ("That sounds great").

1. **Z2** - the desk's perf reading, once he installs from the tester link.
2. Whatever he finds playing the Play build.
3. Past internal: his click, and Google's review.

## Phone readings

None in the studio's format: the desk cannot launch a web game (2026-09-30). His own checks on
the S26 Ultra, 2026-09-30: back, HUD and offline all good. The last desk evidence (2026-09-14):
full gate green, 86 of 150 draw calls in the worst window.
