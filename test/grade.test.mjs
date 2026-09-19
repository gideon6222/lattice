/* The three acts, asserted as a SHAPE rather than as colours.

   `src/sim/grade.ts` answers the story half of his 2026-09-18 ask. The research
   is that a near-wordless game tells its story by the world visibly changing at
   thresholds - Hollow Knight's Infection spreading over ground already walked
   clean, Shadow of the Colossus desaturating for its ending.

   The tints and the strengths are feel numbers and are deliberately not pinned;
   CLAUDE.md records two lighting tests that failed the moment a value was
   retuned to exactly what a playtest asked for. What IS pinned is the dramatic
   shape, because that is the thing a retune must not quietly destroy:

   1. the acts are monotonic in the campaign - you never go back an act
   2. act two is the loudest, because it is the only act where the planet is
      against you
   3. act three is QUIETER than act two AND quieter than act one, because the
      ending's own words are "it is quiet now, and it is quiet because of you"
   4. act three is the only one that takes colour out
   5. and `won` outranks `lit`, so New Game Plus does not walk back to act one */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPure } from './harness.mjs';

const H = await loadPure();

test('the acts are the campaign, and you never go back one', () => {
  let prev = -1;
  for (let lit = 0; lit <= 9; lit++) {
    const act = H.actOf(lit, false);
    assert.ok(act >= prev, `lighting the ${lit}th Anchor moved the game from act ${prev} to ${act}`);
    prev = act;
  }
  /* And the wake is where act two starts, which is the threshold the game
     already treats as its middle - not a number invented for the grade. */
  assert.equal(H.actOf(H.WAKE_AT - 1, false), H.ACT_DEAD);
  assert.equal(H.actOf(H.WAKE_AT, false), H.ACT_WAKE);
});

test('winning outranks lighting, so New Game Plus stays in act three', () => {
  /* `g.won` is the one flag a wipe deliberately does not clear - it is not
     progress, it is something you did. A second pass with nothing lit must not
     read as a dead planet again. */
  assert.equal(H.actOf(0, true), H.ACT_QUIET);
  assert.equal(H.actOf(9, true), H.ACT_QUIET);
});

test('act two is the loudest, and act three is quieter than act one', () => {
  const dead = H.gradeOf(H.ACT_DEAD);
  const wake = H.gradeOf(H.ACT_WAKE);
  const quiet = H.gradeOf(H.ACT_QUIET);

  assert.ok(wake.tint > dead.tint, 'the wake does not change the picture at all');
  assert.ok(wake.tint > quiet.tint,
    `act three tints harder (${quiet.tint}) than act two (${wake.tint}), so the ending is louder than the threat`);

  /* "Quieter" is the whole claim of act three and it is more than tint: the
     ending has to take colour OUT, which is the one thing neither other act
     does. Without this, "quiet" could be satisfied by simply tinting less,
     which would make act three identical to act one. */
  assert.ok(quiet.desat > 0, 'act three takes no colour out, so the ending is not quiet, it is just untinted');
  assert.equal(dead.desat, 0);
  assert.equal(wake.desat, 0);
  assert.ok(quiet.desat > wake.desat);
});

test('act one changes nothing, so a first hour looks like the game always did', () => {
  /* The grade must not be a filter over the whole game. Act one is the state a
     new player spends their first hour in, and it has to be the calibrated
     picture every lighting note in CLAUDE.md was tuned against. */
  const dead = H.gradeOf(H.ACT_DEAD);
  assert.equal(dead.tint, 0);
  assert.equal(dead.desat, 0);
});

test('the grade is subtle enough to be a world and not a filter', () => {
  /* The failure mode CLAUDE.md records repeatedly is a whole-frame effect that
     reads as a wash. Nothing here may pull more than a quarter of the frame,
     and this is the assertion that stops a retune drifting into a filter. */
  for (const act of [H.ACT_DEAD, H.ACT_WAKE, H.ACT_QUIET]) {
    const g = H.gradeOf(act);
    assert.ok(g.tint <= 0.25, `act ${act} tints ${g.tint}, which is a filter rather than a grade`);
    assert.ok(g.desat <= 0.5, `act ${act} desaturates ${g.desat}, which washes the palette out`);
  }
});

test('gradeFor is the same as looking the act up by hand', () => {
  for (const [lit, won] of [[0, false], [5, false], [9, false], [0, true], [9, true]]) {
    assert.deepEqual(H.gradeFor(lit, won), H.gradeOf(H.actOf(lit, won)));
  }
});

test('an out of range act does not throw, it clamps', () => {
  /* The renderer calls this per frame. A crash here is the whole screen, and a
     save from a future version with a fourth act is not a reason to take the
     game down. */
  assert.deepEqual(H.gradeOf(-1), H.gradeOf(H.ACT_DEAD));
  assert.deepEqual(H.gradeOf(99), H.gradeOf(H.ACT_QUIET));
});

/* ---------- V9: the ending shot ---------- */

test('the ending shot rises, holds, and comes back', () => {
  /* The hold is what makes it a SHOT rather than a lurch. A pull-back that
     turns round the instant it arrives reads as a camera error, and the
     research's whole point is that the player gets a moment to look at what
     they dug. Asserted as a shape so the three durations stay free to retune. */
  assert.equal(H.endingBoost(0), 0, 'it starts already pulled back');
  assert.equal(H.endingBoost(H.ENDING_SECS), 0, 'it never returns');
  assert.equal(H.endingBoost(H.ENDING_SECS + 1), 0, 'it is still running after it ended');
  assert.equal(H.endingBoost(-1), 0, 'it is running before it started');

  /* Rises to the full pull-back... */
  const mid = H.endingBoost(H.ENDING_SECS / 2);
  assert.ok(Math.abs(mid - H.ENDING_BACK) < 1e-9,
    `halfway through the shot it is at ${mid}, not the full ${H.ENDING_BACK} - there is no hold`);

  /* ...monotonically on the way out and on the way back, so it never jitters. */
  let prev = -1;
  for (let t = 0; t <= H.ENDING_SECS / 2; t += 0.05) {
    const v = H.endingBoost(t);
    assert.ok(v >= prev - 1e-9, `the shot fell back at ${t.toFixed(2)}s on the way out`);
    prev = v;
  }
  prev = Infinity;
  for (let t = H.ENDING_SECS / 2; t <= H.ENDING_SECS; t += 0.05) {
    const v = H.endingBoost(t);
    assert.ok(v <= prev + 1e-9, `the shot rose again at ${t.toFixed(2)}s on the way back`);
    prev = v;
  }
});

test('the ending pulls back far enough to be a different picture', () => {
  /* The frame is eighteen rows. A boost that is a rounding error on that is a
     shot nobody sees, which is the failure the V7 grade already made once
     today. */
  assert.ok(H.ENDING_BACK >= 6, `pulling back ${H.ENDING_BACK} on an 18-row frame is not a shot`);
  assert.ok(H.ENDING_SECS >= 3, 'the shot is over before it registers');
});
