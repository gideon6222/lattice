# State

Moved onto the studio 2026-09-22. Eleven rounds and fourteen numbered phases shipped
(`journal/legacy-plan.md` is the full history, `journal/legacy-notes.md` the full journal).

## What still does not exist

- **The Play store listing is not live.** The machine side is done (listing text, four
  screenshots, feature graphic, icon, release notes, the TWA, assetlinks); what blocks it is
  Gideon's own console work, and he has explicitly held off ("I will hold off on adding
  anything to the play store for now", 2026-09-18). V0 stays unticked because the work is
  not done, not because anything here is broken.
- **No material is gated as a key rather than sold as currency** (X3) — very deliberately
  not done yet; the research warns that doing this to too many ores collapses back into
  currency with extra steps.
- **"Always more secrets" (Y12) and the reveal's escalating hints (Y15) have no measurement**
  of how often a descent currently meets anything at all, which is what would tell us
  whether more is even needed yet.

## Next three milestones

Done 2026-09-23: **Y11**, the shop redesigned for one thumb. The four arrows that walk
the aisles and the cases moved out of the header — the hardest third of a tall phone to
reach one-handed — into their own bar just above the tray, next to UNDOCK and the buy
button; the room's own camera framing re-measures against the new header and tray heights
rather than assuming them. A per-tier cap (Y9) used to read as 'ready' on the case's own
lamp even though the card underneath already knew it was unbuyable; `shelfState` now has a
`capped` state that reads the same as a depth seal — locked, not just short of money —
which is the "locked vs. unaffordable" half of the brief.

1. **X3** — name an exact small count of a named deep material as a key rather than a
   currency, narrowly, per the research's warning against doing this to too many ores.
2. **Y12** — blocked on its own prerequisite: no measurement yet of how often a descent
   meets a secret at all, which is what would say whether "always more" needs more built or
   just needs the ones that exist to be found more often. `MILESTONES.md` also has Y15
   (escalating hints) behind the same missing number.
3. **V0** — the Play listing, held by Gideon's own word since 2026-09-18.

## Phone readings

None in the studio's `VISUALS tier=... gpu_ms=...` format — this game predates that
convention and has no `studio phone read` history yet. The last check before the migration
(`journal/legacy-notes.md`, "Phone readings", 2026-09-14) found no device connected and
stood on desk evidence instead: full gate green (320 unit tests, 52 e2e, typecheck, build,
size guard at 980.0 KB), 86 of 150 draw calls in the worst window the game can build, and
filmed contact sheets of the way in and the first minute. A service worker cannot be
exercised anywhere but real Chrome or the phone, so the PWA install/offline behaviour has
only ever been checked there, never measured on this handset.
