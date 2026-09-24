# State

Moved onto the studio 2026-09-22. Eleven rounds and fourteen numbered phases shipped
(`journal/legacy-plan.md` is the full history, `journal/legacy-notes.md` the full journal).

## What still does not exist

- **The Play store listing is not live.** The machine side is done (listing text, four
  screenshots, feature graphic, icon, release notes, the TWA, assetlinks); what blocks it is
  Gideon's own console work, and he has explicitly held off ("I will hold off on adding
  anything to the play store for now", 2026-09-18). V0 stays unticked because the work is
  not done, not because anything here is broken.

## Next three milestones

Done 2026-09-23: **Y12 and Y15 together.** Y12's own box asked for a measurement of how
often a descent meets a secret at all before adding more; `tools/secrets-probe.mjs` walked
a campaign's shaft-and-corridor across five offsets and found only about 27% of mining
sessions meet one of the four kinds (find, relic, wreck, cache), and that caches are
about 90% of every hit because the other three are each finite and a campaign runs out of
them. No rate tuning fixes a finite pool, so Y12 is closed by Y15 instead: `src/sim/hints.ts`
delivers one escalating one-line toast per gate broken (three total), the mechanism
DESIGN.md had already named as Y12's real spine because a hint costs nothing to place and
is never exhausted by finding it. Delivered from `coreBroken`, keyed on the tiers-opened
count that call already had. Receipt: `test/hints.test.mjs` and `tools/secrets-probe.mjs`'s
own printed run.

Only one open box is left (`studio progress`):

1. **V0** — the Play listing, held by Gideon's own word since 2026-09-18.

## Phone readings

None in the studio's `VISUALS tier=... gpu_ms=...` format — this game predates that
convention and has no `studio phone read` history yet. The last check before the migration
(`journal/legacy-notes.md`, "Phone readings", 2026-09-14) found no device connected and
stood on desk evidence instead: full gate green (320 unit tests, 52 e2e, typecheck, build,
size guard at 980.0 KB), 86 of 150 draw calls in the worst window the game can build, and
filmed contact sheets of the way in and the first minute. A service worker cannot be
exercised anywhere but real Chrome or the phone, so the PWA install/offline behaviour has
only ever been checked there, never measured on this handset.
