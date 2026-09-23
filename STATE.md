# State

Moved onto the studio 2026-09-22. Eleven rounds and fourteen numbered phases shipped
(`journal/legacy-plan.md` is the full history, `journal/legacy-notes.md` the full journal).

## What still does not exist

- **The Play store listing is not live.** The machine side is done (listing text, four
  screenshots, feature graphic, icon, release notes, the TWA, assetlinks); what blocks it is
  Gideon's own console work, and he has explicitly held off ("I will hold off on adding
  anything to the play store for now", 2026-09-18). V0 stays unticked because the work is
  not done, not because anything here is broken.
- **"Always more secrets" (Y12) and the reveal's escalating hints (Y15) have no measurement**
  of how often a descent currently meets anything at all, which is what would tell us
  whether more is even needed yet.

## Next three milestones

Done 2026-09-23: **X3**, one material promoted from currency to key. Solmarrow — the
rarest mineral in the world, about five cells on the whole planet, none of them above
372 m — was wanted by nothing before this; a find just became credits at the pad. Now
the Drill's own last tier, Godcore, the only upgrade already named as an ending, costs
exactly one Solmarrow on top of whatever iron the rest of the ladder already asks for.
Deliberately its own mechanism, `capstoneCost`, rather than a case folded into `matCost`'s
per-level scaling — a key is not a bigger number, it is a single fact that becomes true
once — so `matCost`, `matTotalFor` and the save-grandfathering that trusts one material
per upgrade are all untouched.

1. **Y12** — blocked on its own prerequisite: no measurement yet of how often a descent
   meets a secret at all, which is what would say whether "always more" needs more built or
   just needs the ones that exist to be found more often.
2. **Y15** — the escalating hints toward the reveal, behind the same missing number as Y12.
3. **V0** — the Play listing, held by Gideon's own word since 2026-09-18.

These are the only three open boxes left (`studio progress`).

## Phone readings

None in the studio's `VISUALS tier=... gpu_ms=...` format — this game predates that
convention and has no `studio phone read` history yet. The last check before the migration
(`journal/legacy-notes.md`, "Phone readings", 2026-09-14) found no device connected and
stood on desk evidence instead: full gate green (320 unit tests, 52 e2e, typecheck, build,
size guard at 980.0 KB), 86 of 150 draw calls in the worst window the game can build, and
filmed contact sheets of the way in and the first minute. A service worker cannot be
exercised anywhere but real Chrome or the phone, so the PWA install/offline behaviour has
only ever been checked there, never measured on this handset.
