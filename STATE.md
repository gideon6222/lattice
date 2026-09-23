# State

Moved onto the studio 2026-09-22. Eleven rounds and fourteen numbered phases shipped
(`journal/legacy-plan.md` is the full history, `journal/legacy-notes.md` the full journal).

## What still does not exist

- **The Play store listing is not live.** The machine side is done (listing text, four
  screenshots, feature graphic, icon, release notes, the TWA, assetlinks); what blocks it is
  Gideon's own console work, and he has explicitly held off ("I will hold off on adding
  anything to the play store for now", 2026-09-18). V0 stays unticked because the work is
  not done, not because anything here is broken.
- **No shop or save point yet at any tier gate (Y8).** Y0b answered what one does when it
  exists — remembering position is free, restocking is a priced shop like the surface one,
  and the Point of No Return keeps routing to the surface pad, never to a gate — but the
  gate stations themselves are not built.
- **The shop screens have not had their own redesign pass** (Y11): one-thumb portrait,
  thumb-reach zones, locked vs. unaffordable distinguished.
- **No material is gated as a key rather than sold as currency** (X3) — very deliberately
  not done yet; the research warns that doing this to too many ores collapses back into
  currency with extra steps.
- **"Always more secrets" (Y12) and the reveal's escalating hints (Y15) have no measurement**
  of how often a descent currently meets anything at all, which is what would tell us
  whether more is even needed yet.

## Next three milestones

1. **Y8** — a shop and a save point at every tier gate, now that Y0b has answered what it
   saves and restocks. `MILESTONES.md`.
2. **Y11** — redesign the shop screens: one-thumb portrait, thumb-reach zones, locked vs.
   unaffordable.
3. **X3** — name an exact small count of a named deep material as a key rather than a
   currency, narrowly, per the research's warning against doing this to too many ores.

## Phone readings

None in the studio's `VISUALS tier=... gpu_ms=...` format — this game predates that
convention and has no `studio phone read` history yet. The last check before the migration
(`journal/legacy-notes.md`, "Phone readings", 2026-09-14) found no device connected and
stood on desk evidence instead: full gate green (320 unit tests, 52 e2e, typecheck, build,
size guard at 980.0 KB), 86 of 150 draw calls in the worst window the game can build, and
filmed contact sheets of the way in and the first minute. A service worker cannot be
exercised anywhere but real Chrome or the phone, so the PWA install/offline behaviour has
only ever been checked there, never measured on this handset.
