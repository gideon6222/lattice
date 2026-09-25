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

Fable reviewed the Y1-Y15 packet on 2026-09-24 (the standing check-in Gideon asked every
game to run at a major milestone) and two things held up: the reveal never reached the
Vault's own card, and S6's "phone pass" was desk evidence, never a reading taken on the
handset. Both became milestones (Round sixteen, DESIGN.md), Y12 closed on paper at the
same time, and the plan change committed on its own before either was built.

Done 2026-09-24: **Z1, the Vault's own card names the entity, and one core break gets
filmed.** `vaultReached`'s card (`src/actions.ts`) now states his third answer plainly -
"The cores were one thing, held apart, and every one you broke let more of it out" - rather than
only reassuring, and keeps "it is quiet now, and it is quiet because of you" verbatim
because `src/sim/grade.ts` quotes that exact clause as the reason act three grades
quieter than act one. The manifest's vault panel (`src/ui.ts`) carries the same turn in
one line. Two new scenarios in `tools/scenes.mjs`, `corebreak` and `vaultend`, drive
`coreBroken`/`vaultReached` directly (now exposed on the `__cw` debug seam) to shoot the
break itself and the ending, not just their aftermath. Receipt:
`test-results/film-corebreak.png`, `test-results/film-vaultend.png`.

Two open boxes are left (`studio progress`):

1. **Z2** — a real phone read before V0 is argued from a phone number nobody has actually
   read off the phone (Fable's review): `studio phone read perf`, a shot of a shop station
   and of the third hint, an install-and-offline pass in Chrome. Needs the phone connected;
   the last check this session found none.
2. **V0** — the Play listing, held by Gideon's own word since 2026-09-18.

## Phone readings

None in the studio's `VISUALS tier=... gpu_ms=...` format — this game predates that
convention and has no `studio phone read` history yet. The last check before the migration
(`journal/legacy-notes.md`, "Phone readings", 2026-09-14) found no device connected and
stood on desk evidence instead: full gate green (320 unit tests, 52 e2e, typecheck, build,
size guard at 980.0 KB), 86 of 150 draw calls in the worst window the game can build, and
filmed contact sheets of the way in and the first minute. A service worker cannot be
exercised anywhere but real Chrome or the phone, so the PWA install/offline behaviour has
only ever been checked there, never measured on this handset.
