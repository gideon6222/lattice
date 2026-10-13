/* The two tiers of the end-to-end suite.

   The whole suite is about 100 tests and 21 minutes alone on a quiet PC. Beside other gates the
   e2e browser is held to 3 CPUs (tools/e2e-cpu-cap.mjs) and the same run takes 30 minutes or
   more, which is the gate's time cap, so `smoke` timed out five times in one day (2026-10-12).

   `smoke` (the gate, every commit) now runs everything but the tests named in SLOW_TITLES, about
   480 s of the measured 1278 s. `smoke_slow` runs the whole suite and is what `studio ship` and
   `studio gate --slow` use. The slow ones are the longest by measurement, each over 15 s alone
   (`studio run e2e-times`), and none of them is a boot, menu, audio or privacy check.

   test/e2e-tiers.test.mjs holds this list to the spec, so a renamed test cannot drop out of the
   slow tier unnoticed and quietly come back into the gate. */

export const SLOW_TITLES = [
  'every Anchor lights by digging down its own column',
  'The Hollow draws what is buried and costs power to hold',
  'Sink carries the ship through rock, and never through a barrier',
  'each room crate is on screen for 1.5 s before it opens, and the banner holds 2 s',
  'with a panel open, the keyboard cannot reach the game behind it',
  'stays inside the draw-call budget while underground',
  'a supply can be bought at the pad and spent underground',
  'the camera never frames more columns than the terrain window streams',
  'a lower tier thins the dust as well as the resolution',
  'crossing your deepest reach is announced exactly once',
  'an upgrade past the free tier needs minerals, not just credits',
  'the HUD stays off the screen while the intro and the title are up',
  'the score layers respond to depth and to danger',
  'the charge and the laser spend power and clear the ground',
  'the map records the descent and draws it',
  'a key cut while the hull is going is marked but never takes the camera',
  'ore left behind is picked up by flying back through it',
  'a ship parked off-lane still digs instead of snagging on its own shaft',
  'the three ways in behave differently, and New Game Plus can skip',
  'the way out of the pause sheet is on screen without scrolling, at every shape'
];

/* The regex source Playwright's --grep-invert takes: any of the titles, escaped. */
export function slowPattern(titles = SLOW_TITLES) {
  return titles.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
}
