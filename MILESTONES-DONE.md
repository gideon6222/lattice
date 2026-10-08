# Finished phases

## Milestones

### Phase 1: the faults

- [x] **M1 — Measure before changing anything.** `scripts/econ.mjs` and the three play styles,
      reporting the run at which each upgrade is bought. No behaviour change. The report goes
      in `NOTES.md` and is the baseline every later number is argued against.
      (more: journal/legacy-plan.md)
      design: # The Lattice — the plan

- [x] **M2 — The Claim, as a place.** `src/sim/claim.ts`, strain, quakes, three structures,
      repair, the shed. `test_claim`, the strain golden, a filmed quake. The geometry comes
      with the first model import this repo has ever done, so this milestone also opens the
      (more: journal/legacy-plan.md)
      design: # The Lattice — the plan

- [x] **M3 — The economy rebuilt on M1's numbers.** New curve, pressure-priced rungs, credits
      sink. `test_econ`. The probe report before and after, in `NOTES.md`.
      design: # The Lattice — the plan

- [x] **M4 — The hold as a decision.** Dump by mineral, widened weight spread, manifest tap.
      Promoted by M1 from a refinement to a missing mechanic: a cap that never binds is not a
      decision, and Cargo Hold is currently the first thing every style buys.
      design: # The Lattice — the plan

- [x] **M5 — The first world compressed.** Per-leg thresholds, save migration, the invariant as
      a relation asserted at every leg.
      design: # The Lattice — the plan

- [x] **M6 — The breach.** The clock, the collapse behind you, the tow path, the chart after.
      Filmed. This is the one to send a video of.
      design: # The Lattice — the plan

### Phase 2: the look

- [x] **M7 — The UV fix and the mineral surfaces.** The new technique, then the imported
      normal and roughness pairs, then the hull normal. Filmed on a cavern, before and after.
      Writes `assets/CREDITS.md`, which this repo has never had, and backfills the four
      (more: journal/legacy-plan.md)
      design: # The Lattice — the plan

- [x] **M8 — Haptics, the debrief and the record book.** The three POLISH lines this game has
      never had, in one pass because they are all "what happens when a run ends".
      design: # The Lattice — the plan

- [x] **M9 — The screens as pictures.** Every screen at 460x996, the shop, the chart, the
      debrief, the record book, the pause sheet. Fix what the picture shows.
      design: # The Lattice — the plan

### Phase 3: what it becomes

- [x] **M10 — The daily Drift.** The chart's offer seeded by the date as well as the run, so
      there is a reason to open it tomorrow.
      design: # The Lattice — the plan

- [x] **M11 — Trait signatures with teeth.** Each trait changes a rule, not only the picture:
      Hollow's caverns carry light and hide long falls, Volatile's gas answers the bomb,
      Crystalline's veins pay on a chain, Searing raises the heat line, Stable pays a premium
      (more: journal/legacy-plan.md)
      design: # The Lattice — the plan

- [x] **R1 Neon as fittings** - tube, housing, one short-range light each, gradient pools on
      the wall. Replaces `neonBar` everywhere. Frame cost measured on the phone
      design: # Round five: the Outfitter as a gas station — ## Milestones

- [x] **R2 The forecourt** - fascia band, totem, pump island, bollards, floor
      design: # Round five: the Outfitter as a gas station — ## Milestones

- [x] **R3 The counter and the wall** - expensive under glass and spot-lit, standard on a
      repeating rack behind. Retires the plinths and the group filtering
      design: # Round five: the Outfitter as a gas station — ## Milestones

- [x] **R4 The pump** - hose, nozzle, ticking readout
      **R5 Wet ground - DROPPED 2026-09-13, on Gideon's word after the measurement
      below.** It has no box because it is no longer owed work, and a `- [ ]` that
      (more: journal/legacy-plan.md)
      design: # Round five: the Outfitter as a gas station — ## Milestones

- [x] **R6 The phone pass** - all of it judged at 1080x2340 rather than on a contact sheet,
      which is where the last three rounds of this room went wrong.
      *Done as part of round eight's W10*, which shot every screen in the game
      (more: journal/legacy-plan.md)
      design: # Round five: the Outfitter as a gas station — ## Milestones

## From Gideon 2026-09-29

His words: "Can you improve the sounds in the game. They seem too cartoony"

- [x] **AS Rewards sound like things, not tunes.** Picking up ore, finding a key, opening a
      cache, a relic, a record, selling, fitting an upgrade and spending a supply stop being
      triangle-wave arpeggios. Each becomes a struck or handled object (stone, crystal, metal,
      a latch, a relay), pre-rendered offline by a script in the repo into small mono files,
      played with a little pitch and filter spread so no two are alike. The synthesized
      version stays as the fallback until a file has loaded. Receipt: a test that no reward
      calls the old oscillator blip, the files and their LICENSES rows, and a listen pack.
      briefs: audio
      design: ## Round eighteen: the sound of things

- [x] **AT Machinery and warnings sound like a ship.** The drill, cutting and cracking rock,
      thrusters, the laser, the alarm, dropping ore and the UI tap move off bare sawtooth and
      square beeps onto layered mechanical sounds: motor, grit, servo, relay. What answers the
      game's state as it changes (the drill's pitch with hardness) stays synthesized at
      runtime. Receipt: the same test extended, and the listen pack.
      briefs: audio
      design: ## Round eighteen: the sound of things

- [x] **AU Deeper, earthier, and soothing.** His words, 2026-09-30: "I don't really like any
      of the new sounds. They sound very tinny and hollow. I want deeper more rumbly sounds. It
      should feel and sound like you are digging into the earth but still sound soothing and
      satisfying." AS's struck metal and crystal go: the energy moves below about 600 Hz (earth
      thuds, soil crumbling, a warm low body that settles), nothing bright or ringing, the
      shared room darkened so it stops sounding hollow, and soft attacks so a sound fired a
      thousand times a session never grates. The drill loop drops lower and rumbles. Receipt:
      a test that every rendered sound's spectral centroid sits under a ceiling, a listen pack,
      and his word on it.
      Then, on the second draft: "I don't want higher tones to be removed completely, just
      less often or less pronounced... Can you find a good mix and see if you can find some
      more realistic sounds?" So the texture is real CC0 recordings (Kenney, OpenGameArt) with
      their highs pulled down, over the deep body; loudness is set as a phone speaker plays it.
      His word on the third draft: "That sounds great."
      briefs: audio
      design: ## Round eighteen: the sound of things

## From Gideon 2026-10-01

*His standing bar (studio-knowledge `checklists/launch.md` section 2): no debug UI for players,
the version line read from the build, patch notes from the first Play upload on.*

- [x] **AV No crash or debug UI for a player.** The stack overlay and its CLEAR SAVE button
      show only under the dev server or with ?debug. Every uncaught error and rejection goes to
      the console and to one record, `coreward.crash`. On the next boot `src/recovery.ts` puts
      a crashed run's ship back on the pad with an empty hold, keeping credits, upgrades,
      keys, tunnels, Anchors and the record; a boot that fails is retried quietly, and a save
      that will not load twice running is set aside (never deleted) so the game opens rather
      than sitting on LOADING. RUN LOG, the balance table, is behind ?debug too.
      `test/recovery.test.mjs`, and two e2e specs that boot without ?debug.
      briefs: save, menu
      design: ## Polish budget

- [x] **AW The version line says what the build is.** The pause sheet (Settings) reads
      `v0.56.0 | <commit> | release`: the version from the changelog, the commit Vite stamps,
      and the kind from the build itself (`vite build` is release, the dev server debug). It
      no longer falls back to "unbuilt". `src/buildinfo.ts`, the stamp spec.
      briefs: menu
      design: ## Polish budget

- [x] **AX Patch notes start at the first Play upload.** WHAT'S NEW lists 0.56.0 back to
      0.39.0 (version code 1, the first build on Play); the 52 releases before it are counted by
      `RELEASES_BEFORE_PLAY` and not shown, and every line kept reads as what is better now.
      `test/version.test.mjs` holds the first version, the version code against the notes, and
      the wording.
      briefs: store
      design: ## Polish budget

## From Gideon 2026-10-04

*His words: "A lot of the games are much better than they were regarding their menus and
transition between levels, but they still feel kind of unintuitive and cluttered. Can you
have a session research why our games feel cluttered and multiple different things that make
them feel better. Check in with Fable, then apply these findings to all current and future
games."* The standard is `plans/studio-menu-clarity/RULING.md`. The Godot menu kit does not
cover a web game, so the counts are applied by hand in the page.

- [x] **BM The menu standard.** One PLAY, one small SETTINGS and one status line on the
      title. Pause is one sheet of three pages (pause with RESUME first and SETTINGS, settings
      of five rows plus MORE, more with the long list and the version line last). One X
      top-right on every sheet, Back does what X does, one sheet at a time with the HUD
      hidden, pause top-right. Receipt: the "menu check" smoke test at 360x780 and the
      before-and-after sheet `test-results/menus-sheet.png`. Not done: the shop's six tabs and
      per-card FIT buttons, and the left-hand gauge cluster, stay as they were.
      briefs: menu, web
      design: ## Polish budget

## From Gideon 2026-10-02 (progression)

His words: "I want them to be locked and either hidden or some kind of creative way for you to get
them at some point", then "improve the amount and the quality of the items and upgrades and XP and
everything like that and base it around that same structure." The rule is Fable's (studio plan
`unlocks-2026-10-02.md`, section A). Existing saves carry over: an owned line stays owned, and a
save already past a feat is granted its gift. Nothing here ships: the app is in Google's review.

- [x] **BA The shelf rule, as pure code.** `src/sim/bay.ts`: seven systems (CREW added, Autopilot and
      Repair Drone move to it), `bayView(system, state)` returns the owned lines plus at most one
      silhouette, `nextLine(state)` returns the one Next line, and a route table states how every
      entry is earned. Old saves keep every key and level. Proved by `test/bay.test.mjs`: at most
      three lines a system, at most one silhouette a rack, every sealed entry carries a non-empty
      route, at least half of all entries are earned by an act, a save from before the change
      loads with every owned level intact, and the Next line never names a thing out of reach
      (no Cooling Rig while core 1 is unbroken).
      briefs: menu, save
      design: ## Progression and unlocks

- [x] **BB The bay shows three and one shadow.** The fitting bay uses `bayView`: seven tabs, at most
      three cards plus one silhouette card (outline, SEALED, its route in a sentence), the Next
      line at the top, and the supplies move to a KIT drawer of three a page. Proved by an e2e
      spec on a fresh save and a mid-game save (count the cards and the silhouette, read the Next
      line, one scroll region, an explicit close on the KIT drawer) and an emulator shot of the
      rack. The sealed slot is an empty mount with a bolt pattern, not a flat outline.
      briefs: menu
      design: ## Progression and unlocks

- [x] **BC The Ledger and the feats.** `src/sim/feats.ts` records the feats (full hold sold, gas ridden out and
      hard rock cut as totals across runs, a lost ship; thresholds set from the bot's measured
      counts, not guessed), saved as `feats`. The Ledger sheet opens from the
      pause sheet with DEVICES, FEATS and RELICS, never a lock. A save already past a feat gets
      its gift on the first dock. Proved by `test/feats.test.mjs` (each feat fires once, saves
      round-trip, backfill grants once) and an e2e that opens the Ledger.
      briefs: menu, save
      design: ## Progression and unlocks

- [x] **BD Ore Sorter.** The first feat gift: a full hold swaps out its cheapest ore for the new
      find. Three rungs, a model on the hull. Proved by a sim test of the swap and a bot run that
      sells a full hold and holds the Sorter by run 2 to 3.
      briefs: feel
      design: ## Progression and unlocks

- [x] **BE Pressure Seal and Resonance Tip.** The gas feat and the hard-rock feat, the two
      ladders, their effect in the sim, their hull parts. Proved by sim tests (damage taken in gas
      with and without the Seal, strikes to open a hard vein with and without the Tip).
      briefs: feel
      design: ## Progression and unlocks

- [x] **BF Return Beacon.** The black box on the pad after the first lost ship, then the HOME hold
      that climbs the ship to the pad with a share of the hold. Four rungs. Proved by a sim test of
      the kept share and the once-a-run limit, and a bot that loses a ship and finds the box.
      briefs: feel, save
      design: ## Progression and unlocks

- [x] **BG Flare Line and Arc Lance.** Two new finds on seed offsets 263 and 269, crates in the
      first derelict wreck and the rock beside an Anchor hall of the second barrier (150 m and
      below; on this world 189 m), with their banners, effects and
      ladders. Proved by `test/finds.test.mjs` extended (placement, missable but never lost) and
      the frozen block golden unchanged.
      briefs: feel
      design: ## Progression and unlocks

- [x] **BH Pacing bots.** Bots play the first hour on the economy probe. Proved by: a first buy
      inside two runs, no rung under a ladder's last asking more than four runs of saving, the
      Sorter by run 3, and every device met once by the end of the third barrier. Any rung that
      fails is retuned with the diff read.
      briefs: feel
      design: ## Progression and unlocks

- [x] **BI The notes for players.** The changelog and Play release notes for all of the above, as
      what is better now. Proved by `test/version.test.mjs`.
      briefs: store
      design: ## Progression and unlocks

- [x] **BJ The four gifts have an e2e.** One spec loads a save one act short of each of the four
      feats (a full hold sold, gas ridden out, hard rock cut, a lost ship), performs the act, docks,
      and sees the banner and the new card on the right bay tab, plus the Beacon's HOME hold
      climbing to the pad with the kept share shown. Proved by that spec in `npm run check`.
      briefs: menu, feel
      design: ## Progression and unlocks

- [x] **BK The pacing test settles the Beacon.** The pacing bot loses one ship on purpose by a stated
      run and holds the Beacon the run after, and `test/pacing.test.mjs` asserts it beside the
      four-run saving cap, so STATE.md and the commit message agree. Proved by the test.
      briefs: feel
      design: ## Progression and unlocks

### The asks, numbered by their trigger

- [x] **Y1, at a depth the player has not earned yet: a forcefield stops the ship.** Done 2026-09-19.
      The world is cut into tiers by barriers the drill cannot pass. Default is
      blocked; the exception is a tier whose gate has been broken. Reason: a depth you
      (more: journal/legacy-plan.md)
      design: ## Round fifteen: the descent becomes a ladder

- [x] **Y2, when N Anchors of a tier are lit: a dark-energy core appears.** Done 2026-09-19. It looks
      inviting and it is the only thing in the tier that can open the gate. Default is
      absent; it exists only once the tier's Anchors are lit. Reason: the Anchors stop
      (more: journal/legacy-plan.md)
      design: ## Round fifteen: the descent becomes a ladder

- [x] **Y3, when the core is destroyed: the forcefield below it drops.** Done 2026-09-19. One core, one
      tier, for ever - it does not come back. Reason: a gate that can re-lock is a
      chore. Receipt: the Y1 test, run after breaking each core in turn.
      design: ## Round fifteen: the descent becomes a ladder

- [x] **Y4, when the core is destroyed: the player gains one new ability.** Done
      2026-09-19. THE HOLLOW (see open space through rock, close by), SINK (fall
      through solid rock, paying hull) and THE CALL (whatever is still buried in the
      (more: journal/legacy-plan.md)
      design: ## Round fifteen: the descent becomes a ladder

- [x] **Y5, when the first core is destroyed: planet integrity appears, and it is
      falling.** Done 2026-09-19, and it is the DRAIN that waits, not only the
      readout - a clock nobody can see is still a clock. Before that it does not exist on screen at all. Reason, his: "the
      (more: journal/legacy-plan.md)
      design: ## Round fifteen: the descent becomes a ladder

- [x] **Y6, when each further core is destroyed: integrity falls faster.** Done
      2026-09-19. `BALLAST_CORE_BITE` 1.75, squeezed between the Anchor relief it has
      to beat and the fairness line it must not break. The
      (more: journal/legacy-plan.md)
      design: ## Round fifteen: the descent becomes a ladder

- [x] **Y7, when the player repairs the planet: it is an activity, not a payment.**
      Done 2026-09-19. Repair happens at the SCAR of an Anchor you broke: carry ore
      down in the hold and pack it into the hole. Cannot be done from the pad because
      (more: journal/legacy-plan.md)
      design: ## Round fifteen: the descent becomes a ladder

- [x] **Y8, at every tier gate: a shop and a save point.** Done 2026-09-23. The
      station is the spent core's own cell - the one every player of a tier
      already passes through once its gate is open - so it cost no new world:
      no fixture, no second thing to find. The Outfitter opens there exactly
      as it does at the pad, because the shelf is keyed on best depth and not
      on where the ship is standing, so restocking is priced there precisely
      like the surface shop (Y0b). Arriving writes a checkpoint, the same free
      "remembering position" every large event already gets. What stays the
      pad's alone: the free refuel, repair and sale, so a gate is a shop and
      never a second pad. Receipt: a test that each tier has exactly one
      station, at its own gate.
      design: ## Round fifteen: the descent becomes a ladder

- [x] **Y9, buying at the first shop: a cap on what it will sell.** Done
      2026-09-19. Rows AND levels: the shelf steps at the barrier depths, and
      `levelCap` steps the max level with it - a nine-level row caps at 3, then 6,
      (more: journal/legacy-plan.md)
      design: ## Round fifteen: the descent becomes a ladder

- [x] **Y10, buying at a deeper shop: more, and abilities as well as numbers.**
      Done 2026-09-19, and it needed no new gate: a depth past 113 m can only have
      been reached by breaking the first core, so putting each row's `unlock` on a
      (more: journal/legacy-plan.md)
      design: ## Round fifteen: the descent becomes a ladder

- [x] **Y11, drawing any shop: it is redesigned.** Done 2026-09-23. His words:
      "redesign the shops completely using your own skills and research, to
      give me something that looks and feels better suited for the game."
      One-thumb portrait: the four arrows that walk the aisles and the cases
      used to sit in the header, the hardest third of a tall phone to reach
      one-handed; they are in their own bar just above the tray now, in the
      same reachable third as UNDOCK and the buy button, and the room's own
      framing was re-measured against the new header and tray heights so it
      still fills exactly the space between them. Locked vs. unaffordable:
      a per-tier cap (Y9) used to fall through the case's own lamp logic to
      'ready' even though the card underneath it already knew better and
      greyed its button - so a case could glow cyan and say buy me for a row
      no price would move. It reads as locked now, the same as a depth seal,
      because both mean no amount of credits fixes it, which short-on-credits
      or short-on-ore never mean. Receipt: `shelfState` gets a `capped` state
      with its own tests, and `visibleBand`/the framing tests measure the new
      bar instead of assuming its height.
      briefs: menu
      design: ## Round fifteen: the descent becomes a ladder

- [x] **Y12, throughout: more secrets.** Done 2026-09-23, closed by Y15 rather than
      by its own new content. His words: "make it feel like there are always more
      secrets to find." The measurement the box asked for
      (`tools/secrets-probe.mjs`) found that a campaign's shaft-and-corridor meets
      one of the four secret kinds in only about 27% of mining sessions, and that
      the interesting three of the four - a find crate, the one relic, a wreck's
      hold - are each finite and run out, which no rate tuning fixes: the cache
      alone (about 90% of every hit) is what is left once a campaign has found
      everything else. DESIGN.md had already named the real answer before the
      probe ran: "the hints ARE the secrets, and they escalate toward the Vault" -
      an escalating hint costs nothing to place and cannot be exhausted by finding
      it, which answers "always more" in a way a finite crate never could. See Y15.
      **Closed on paper 2026-09-24**, per Fable's review: the 27% is now recorded in
      DESIGN.md as the accepted figure, so a later reader does not mistake a closed
      box for dense secrets. See Round sixteen.
      (more: journal/legacy-plan.md)
      briefs: level-design
      design: ## Round fifteen: the descent becomes a ladder

### The three open questions, answered by him 2026-09-19

- [x] **Y0a The Vault is still the ending, and the last gate is its door.** His
      words: "The last gate should be the door." That is exactly what the
      existing geometry already suggests - the deepest region row holds no
      (more: journal/legacy-plan.md)
      design: ## Round fifteen: the descent becomes a ladder

- [x] **Y0b A save point saves your POSITION, and maybe restocks.** Researched
      2026-09-22 against five games. Position is free, exactly like every
      checkpoint this game already writes; restocking is Y8's shop, priced like
      the surface shop, never free; the Point of No Return keeps routing to the
      surface pad, never to a gate. (more: journal/legacy-plan.md)
      briefs: mechanic-design
      design: ## Round fifteen: the descent becomes a ladder

- [x] **Y0c The Anchors BREAK, and the core is what stays lit.** His words: "I
      want the anchors to now imply that you are slowly allowing the world to
      break. Each anchor should be dramatic when it breaks and leave remnants
      (more: journal/legacy-plan.md)
      design: ## Round fifteen: the descent becomes a ladder

- [x] **Y13 The Anchor breaks, dramatically, and leaves a remnant.** Done
      2026-09-19. The plinth goes with it - five cells of worked stone become a
      permanent uncuttable scar, dim violet, derived from `g.ground.lit` so it
      (more: journal/legacy-plan.md)
      design: ### The turn the story takes, and what it makes the rest of the round mean

- [x] **Y14 The spent core stays lit for ever.** Done 2026-09-19, inside Y2 - the
      spent state is one of `gateCellAt`'s four and could not have been built
      separately. It takes X6's `ghost` - drawn,
      (more: journal/legacy-plan.md)
      design: ### The turn the story takes, and what it makes the rest of the round mean

- [x] **Y15 The reveal, and the hints that escalate toward it.** Done 2026-09-23.
      Near-wordless, in the grammar this game already uses: a one-line toast,
      the mechanism every other quiet consequence in this game already speaks
      through. `src/sim/hints.ts` is three lines, one per gate broken, each a
      half-truth a little less deniable than the last: the first is a stray
      fact (a core that dark should not go out that easily), the third names
      what the cores were actually for (something being let OUT, not spent).
      Delivered from `coreBroken` once its "THE WAY OPENS" card closes, keyed
      on `g.ground.gates.length` - the tiers-opened count that call already had
      in hand, so no new state and no new trigger. Also closes Y12; see its box
      for the measurement that pointed here.
      (more: journal/legacy-plan.md)
      briefs: level-design
      design: ### The turn the story takes, and what it makes the rest of the round mean

### Round seventeen: the ladder, finished (2026-09-25)

- [x] **AA Measure the ladder.** A campaign probe on the pure layer (rebuilt from
      `tools/econ.mjs`, which still thinks the world is 13 columns wide) plays the ladder:
      mines, buys, breaks each tier's Anchors and core, respects barriers, and prints
      game-minutes and runs per tier; the secrets probe stops at a closed barrier. After it, a per-tier table exists in DESIGN.md that every later retune argues
      against - a lower bound, since a probe never hesitates, replaced tier by tier by his
      own times when he plays it. Receipt: the probe's own printed table, and a test that a
      probe cannot walk through a closed barrier.
      briefs: balance, testing
      design: ## Round seventeen: the ladder, finished

- [x] **AB Back closes the top panel, every panel has an X, and every panel scrolls.** One
      close stack is the only way a panel opens (event card, map, pause, manifest, Ballast,
      shop, and any panel added later): Android back pops the top panel and does nothing
      more, and on the bare HUD it falls through. An X at thumb reach on every panel.
      Receipt: an e2e test that opens the shop, fires history.back(), and finds it closed
      and the page alive; a test that every panel-open goes through the stack; an e2e scroll
      of the shop at 1080x2340 that reaches its last item; and one phone reading on the
      installed app (shop open, back pressed, the HUD still running) in STATE.md.
      briefs: menu, web
      design: ## Round seventeen: the ladder, finished

- [x] **AC The last gate is the Vault's door.** Gate 3 moves onto the Vault; core 3's break
      opens it and nothing else does; the ninth Anchor opens nothing. Abilities reshuffle:
      the Hollow at core 1, the Call at core 2 answering for unbroken regions too, Sink
      leaves the core list for the gate shop (AG). Each Anchor broken steps the drain up
      instead of down, the cards stop saying "holds", and the fifth-Anchor wake folds into
      the first core. The pip row becomes this tier's three Anchors. Receipt: tests
      (the ninth Anchor opens nothing, core 3 opens the Vault, the drain rises per Anchor),
      AA's table rerun with three rows.
      briefs: level-design, stakes, balance
      design: ## Round seventeen: the ladder, finished

- [x] **AD Retire the old spine.** Intro captions, Anchor and centre cards, the store listing
      and release notes say the ladder, not "light nine"; Ballast-feed leftovers go (dead
      `feed` path, stale panel lines); film scenarios that build impossible states (`breach`,
      `claim`, `act2`, `act3`) are rebuilt on the ladder or removed. Receipt: a grep test
      that no player text says "nine" as an objective, and every scenario films clean.
      briefs: first-minute, store
      design: ## Round seventeen: the ladder, finished

- [x] **AK Minerals become ingredients.** MONEY (copper, iron, silver, gold, geodes, lodes)
      sells; KEYS (amethyst, emerald, ruby, magmite, coreite, umbrite, Solmarrow) ride in the
      hold by weight, are banked on docking and never sell, and a hull loss takes only the hold,
      never the bank. Rungs 1-3 of a line cost credits only; each later band asks for the keys
      of the tier it opens with; capstones ask for umbrite or Solmarrow. Credits still gate
      every within-tier rung and all supplies. Caches give money and supplies, never keys. The
      catalogue folds from 16 rows to six systems: DRILL (bit, the laser as its sealed-stone
      rung carrying its own power), HOLD (cargo, magnet), ENGINES (thrusters, tank, autopilot),
      HULL (plating, cooling, drone), SENSORS (scanner, survey, receiver), ORDNANCE (charge);
      Reactor and Scrubber are cut. Receipt: tests (every key asked for, supply at least 2.5x
      its ask, no cache yields a key, a hull loss leaves the bank), and AA's probe per tier
      showing one rung where credits are bought last and one where the key is.
      briefs: economy, balance
      design: ## Round seventeen, the shop and the minerals

- [x] **AN The fitting bay, the only purchase screen.** Top 60%: the ship on a lift as a
      rotatable model, dimmed under anything drawn over it. A strip of six system icons at 56dp
      or more that also lights when a part of the ship is tapped. A bottom sheet with the chosen
      system as a scrolling rack of cards (price, key slots filled from the bank, one plain
      sentence and the before-to-after number), buy in the thumb zone, the X and back from AB.
      Found devices are owned cards in their system with their sentence. Buying bolts the part
      on in view, and every part has its own model. Receipt: an e2e that opens the bay, scrolls
      to the last card of the longest line, buys in two taps and leaves by the X; a test that a
      drag on the model rotates it and a drag on the sheet scrolls it, never both; a test that
      no part uses the placeholder mesh; a 1080x2340 shot with the strip and the last card.
      briefs: menu, art, feel
      design: ## Round seventeen, the shop and the minerals

- [x] **AL Where minerals sit.** Each key has a depth window, a home region rolled on its own
      seed offset, at least four pockets, and no pocket over a third of any one rung's ask;
      commons thin out below their band; geodes fall under a quarter of the value in 0-113 m.
      Each key has its own mesh and material in the wall, never a recolour of a money ore. The
      frozen golden is re-recorded with the diff read. Receipt: a census test in the gate
      asserting all three placement rules, and a test that no key shares a material with a
      money ore.
      briefs: level-design, balance, art
      design: ## Round seventeen, the shop and the minerals

- [x] **AM A key find is an event, and a hunt.** The first cut of each pocket fires it: light,
      sound, a 15 ms haptic, a short camera hold, a map mark, the key's name. Any move input ends
      the hold on that frame, and it never fires while the ship touches a hazard. The Sensors
      line names the key pockets within range, never the cell; the map shows each key's home
      region once its tier is open. Receipt: a film of two finds of one key; tests that the
      event fires per pocket and that a thrust ends the hold.
      briefs: feel, controls
      design: ## Round seventeen, the shop and the minerals

- [x] **AO Gate vendors.** Each gate is a different room around the same lift, stocked with that
      tier's rungs, Sink (a skill the pad never sells) at the first gate, one key-priced
      consumable per visit, a visible save moment, and no pump. Receipt: a test that each
      vendor's stock differs, and a screenshot per gate.
      briefs: menu, economy
      design: ## Round seventeen, the shop and the minerals

- [x] **AE The barrier and the core become objects, and the drain shows in the world.** The
      core's light is the one wrongness colour, defined once; the pip row, the scar and the
      gate room take it from that constant and nothing else uses it. The barrier's look lives
      in two emitter rails, real geometry with the ship's rock-and-metal treatment; the field
      between them is thin and reads as heat shimmer, not a ribbon. Each core is a real light
      from a fixed pool that grows darker and more alive tier by tier while the lightmap dims
      around it; spent cores stay lit. Touching a barrier says what opens it; a core
      appearing is an event and a map mark. Per core, the heat line rises, dust and tremor
      step up, and the three hints become things seen near the cores. Receipt: a grep test
      that the colour's value lives in one file; a film of core 1 and core 3 and a still of
      a barrier on approach, with the Mobile renderer; a GPU reading before and after.
      briefs: rendering, lighting, web, feel
      design: ## Round seventeen: the ladder, finished

- [x] **AF Repair shows in the rock.** A scar refills in stages, cracks closing and its
      glow dimming as it is packed; the "+X%" toast goes; SEAL and every Ballast readout (the pad's
      sight glass, the shop's wall gauge) stay hidden until the first core. Receipt: a test
      that the scar's stage follows the packing, and a film.
      briefs: mechanic-design, feel
      design: ## Round seventeen: the ladder, finished

- [x] **AH The ending: the light leaves.** At the Vault the light of every spent core leaves
      its scar and gathers at the center, the planet goes dark from the center upward, and
      the sky over the pad takes the core's colour; a short card follows, never before.
      Receipt: a film of the whole ending with the Mobile renderer.
      briefs: lighting, rendering, stakes
      design: ## Round seventeen: the ladder, finished

- [x] **AI Always more, inside every tier.** One visible sign per Anchor broken, in one
      wrongness colour used nowhere else, spreading from details to mass to air; two of tier
      0's six buried devices move deeper. Receipt: the secrets probe per tier, rerun.
      briefs: level-design
      design: ## Round seventeen: the ladder, finished

- [x] **AJ A slimmer HUD, nothing lost.** The depth line folds into the region chip and the
      three timed supplies sit behind one button; credits and haul stay, since they decide
      when to surface. Receipt: the readout count before and after, a screenshot at
      1080x2340, and after his first phone session on it, the readout he missed or his word
      that none was, in STATE.md.
      briefs: hud
      design: ## Round seventeen: the ladder, finished
