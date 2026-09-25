# Milestones

The boxes, moved out of DESIGN.md (standing rule 3b: a box is `- [x]` or `- [ ]` and nothing
else). Each keeps its own heading grouping from the original plan and points back at the
DESIGN.md section that explains it with a `design:` line; an open box that touches a moment
the knowledge base has an opinion on also carries a `briefs:` line (`studio brief <trigger>`
lists the records). The full text behind every entry, including everything trimmed here,
is in `journal/legacy-plan.md`.

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

## Milestones

- [x] **S1 The two faults** - the tray's height measured on the phone and the
      room framed above it; ship and shelf separated by composition
      design: # Round six: you find the gear, then the shop fits it

- [x] **S2 `sim/finds.ts`** - seven devices, hashed positions on offset 257, the
      block, the break, the banner, the save field, the tests
      design: # Round six: you find the gear, then the shop fits it

- [x] **S3 The shop sells what you own** - `shelfStock` gains the found gate,
      departments become the layout, ordnance starts dark
      design: # Round six: you find the gear, then the shop fits it

- [x] **S4 The aisles** - camera stations, swipe, dot row AND arrows, the dark
      aisle. The cut-to-the-ship on a purchase was CUT: the ship is a station of
      its own at the end of the run, and moving the camera under the player
      (more: journal/legacy-plan.md)
      design: # Round six: you find the gear, then the shop fits it

- [x] **S5 The look** - brass and rivets, rationed magenta and cyan, one Matrix
      terminal, fresnel proxies on the tubes. Six measured corrections, every
      one of them found by a screenshot rather than by the numbers - see the
      (more: journal/legacy-plan.md)
      design: # Round six: you find the gear, then the shop fits it

- [x] **S6 The phone pass** - judged at 1080x2340, with the light count measured.
      *Done as part of round eight's W10.* Draw calls in the worst window are
      86 of 150; every screen has been looked at as a picture at the phone's
      (more: journal/legacy-plan.md)
      design: # Round six: you find the gear, then the shop fits it

- [x] **S7** - the kit is found, not bought, and lives in a drawer
      design: ## S7: the kit becomes a discovery too

## Milestones

- [x] **F1** fuel per cell, drill buys speed not efficiency, measured at every leg
      design: # The build

- [x] **F2** `fuelHome`, the moving reserve band, the escalating warning, the red dial
      design: # The build

- [x] **F3** death replaces the tow; Tow Insurance deleted and refunded; the Scrubber
      design: # The build

- [x] **F4** the ore table: eight worlds, rarity ordering fixed, density halved
      design: # The build

- [x] **F5** the first-find reveal
      design: # The build

- [x] **F6** the economy re-tuned against the probe, goldens re-recorded with the diffs read
      design: # The build

- [x] **W1 The ship, designed at thirty pixels.** Silhouette first: an
      off-centre stack, a boiler bulge, an open under-frame, asymmetric
      front-to-back, the auger still leading. Judged blurred at 30 px against
      (more: journal/legacy-plan.md)
      design: # The look — ## Milestones

- [x] **W2 The blocks.** Per-instance quarter-turn and scale jitter; two or
      three chamfered mesh variants per material; ragged stratum boundaries
      instead of straight horizontal lines; sparse crack and vein decals in one
      (more: journal/legacy-plan.md)
      design: # The look — ## Milestones

- [x] **W3 The world gets wide.** `W` from 13 to about 61, and the streaming
      window gains a horizontal axis - a column range around the ship, a rebuild
      on crossing a column, and `MAX_CELLS` sized off the window rather than off
      (more: journal/legacy-plan.md)
      design: # The look — ## Milestones

- [x] **W4 Regions.** The twelve palettes and five traits stop being planets and
      become regions of one world, in width and depth. `coreDepth(leg)` and the
      chart go. One fixed world about 450 m deep.
      design: # The look — ## Milestones

- [x] **W5 The map.** Fills in as you dig, marks finds, marks the
      not-yet-understood, shows Unrest per region. Nothing else in this round
      works without it.
      (more: journal/legacy-plan.md)
      design: # The look — ## Milestones

- [x] **W6 Unrest and the Ballast.** Strain grows into a planet-wide meter that
      everything you cut raises; the Ballast decays against it, is fed with ore,
      collapses a region if it empties, and grows a tier per Anchor. The three
      (more: journal/legacy-plan.md)
      design: # The look — ## Milestones

- [x] **W7 Anchors, and vaults.** Nine Anchors across the regions. A small
      library of authored vault templates dropped at seeded rare slots -
      sealed ones you can see and not open, the previous expedition, and empty
      (more: journal/legacy-plan.md)
      design: # The look — ## Milestones

- [x] **W8 The planet answers.** At the fifth Anchor, Unrest steps permanently,
      a hazard appears in ground you already know, and something new grows in
      old rock. The cheapest possible way to make a mapped world strange again.
      (more: journal/legacy-plan.md)
      design: # The look — ## Milestones

- [x] **W9 The Vault.** The ninth Anchor opens the centre, and that is the end
      of the game. Other planets are what comes after, later.
      
      (more: journal/legacy-plan.md)
      design: # The look — ## Milestones

- [x] **W10 The phone pass**, and a long play of the whole thing rather than of
      any one milestone.
      
      (more: journal/legacy-plan.md)
      design: # The look — ## Milestones

- [x] **R9a A human play of the whole campaign.** `/playtest`. Round eight has
      had no human minute in it, and the long-play probe cannot answer the
      questions that matter: does hunting Anchors feel like a hunt or like a
      (more: journal/legacy-plan.md)
      design: # Round nine

- [x] **R9b The first hour introduces the game that exists.** Done 2026-09-12,
      v0.32.0. The five captions are about one world, nine Anchors and the
      centre; the title line under CONTINUE is the campaign in one line; the
      (more: journal/legacy-plan.md)
      design: # Round nine

- [x] **R9c A campaign the probe can finish.** Done 2026-09-13: the probe
      plays to the Vault (seeded from the wake, 27 runs to nine Anchors and
      5 more to the centre). It found that the laser was never buried, which
      (more: journal/legacy-plan.md)
      design: # Round nine

- [x] **R9d Ship it.** Done 2026-09-14, v0.42.0. `POLISH.md` walked line by
      line rather than assumed, and it refused three times before it passed.
      The deploy is GitHub Pages through CI; version, changelog and a screenshot
      (more: journal/legacy-plan.md)
      design: # Round nine

- [x] **R9e The second month, sketched.** Done 2026-09-13; the sketch is the
      section "The second month" immediately below this list. Original brief:
      `POLISH.md` asks for the next month's
      (more: journal/legacy-plan.md)
      design: # Round nine

- [x] **R9f The way in, redone.** Done 2026-09-12, v0.33.0, as designed
      below; the three things the film found and fixed are in `NOTES.md`.
      His words on v0.32.0, 2026-09-12, three asks:
      (more: journal/legacy-plan.md)
      design: # Round nine

- [x] **R9g The pad save, and CONTINUE as the intro compressed.** Done
      2026-09-12, v0.34.0, as below; `NOTES.md` has the one case to watch
      (an Anchor lit on an abandoned run). His words on v0.33.0, after
      (more: journal/legacy-plan.md)
      design: # Round nine

- [x] **R9h Checkpoints at every large event.** Done 2026-09-12, v0.35.0,
      as below. His words on v0.34.0,
      2026-09-12: *"lets do a second save point at the anchor. If there are
      (more: journal/legacy-plan.md)
      design: # Round nine

- [x] **T1 The pad is the dock.** Done 2026-09-13, v0.38.0. Split the one function that is doing two
      jobs: `atSurface()` stays "above the ground" (heat, charge, the camera
      lift, the fuel reserve) and a new `docked()` is "at the pad" - at the
      (more: journal/legacy-plan.md)
      design: # Round ten: the polish round

- [x] **T2 Growth that is a thing on the rock, not a sticker over it.** Done 2026-09-13, v0.38.0. His
      words: *"turn these into textures or physically different models instead
      of an overlay."* Real instanced geometry with volume, seated so it
      (more: journal/legacy-plan.md)
      design: # Round ten: the polish round

- [x] **T3 A ship that is advanced and ancient.** Done 2026-09-13, v0.39.0. Not steampunk: no boiler, no
      raked stack, no spoked flywheel, no brass. Advanced technology that has
      been sitting for thousands of years, which is the same civilization that
      (more: journal/legacy-plan.md)
      design: # Round ten: the polish round

- [x] **T4 The completeness pass.** Done 2026-09-13, v0.40.0. The research's ranked
      list of what a shipped game has and a hobby build does not, audited item by
      item against this game rather than applied as a checklist. Two were real and
      (more: journal/legacy-plan.md)
      design: # Round ten: the polish round

- [x] **E1 No control may be buried, and nothing may run off screen.** Measured
      at four shapes. On a phone held sideways MAP and BALLAST were 100%
      covered by the fuel dial, SHOP 55%, and AUTOPILOT was entirely off the
      (more: journal/legacy-plan.md)
      design: # Round eleven: the professional-polish sweep

- [x] **E2 The camera may not frame more than is streamed.** The terrain is a
      21-column window and the camera was framing 40 columns on a sideways
      phone and 28.8 on a laptop, so the ground stopped in mid-air. `resize()`
      (more: journal/legacy-plan.md)
      design: # Round eleven: the professional-polish sweep

- [x] **E3 The way out of a sheet is never below the fold.** The pause sheet's
      920 px of content in a 352 px box put RESUME out of sight with nothing
      saying so - in the only menu that unpauses the game.
      design: # Round eleven: the professional-polish sweep

- [x] **E4 `prefers-reduced-motion`, without losing the warning.** The shake
      goes to zero and the flash to 30%, and every pulsing warning is HELD at
      the loud end of its own swing instead of switched off - `fuelpulse` runs
      (more: journal/legacy-plan.md)
      design: # Round eleven: the professional-polish sweep

- [x] **E5 The link describes itself.** No description, no Open Graph, no
      `apple-touch-icon`. For a game distributed as a link that is the front
      door. iOS was saving a screenshot of whatever was on screen as the icon.
      design: # Round eleven: the professional-polish sweep

- [x] **E6 Losing the GPU.** Android drops a WebGL context on a backgrounded
      tab, a driver reset or memory pressure. There was no handler, so three.js
      stopped drawing while the loop kept running: the game carried on
      (more: journal/legacy-plan.md)
      design: # Round eleven: the professional-polish sweep

- [x] **E7 Every word on screen meets WCAG AA.** Two of 51 nodes failed and the
      worse one was the restart warning at 3.17:1 - the hardest text in the
      game to read was the warning on the one irreversible button in it.
      design: # Round eleven: the professional-polish sweep

- [x] **E8 A menu keeps the keyboard.** Tabbing with the pause sheet open
      walked into the HUD behind it. This game supports the keyboard on purpose
      (the Outfitter has a test for it), and half-finished keyboard support
      (more: journal/legacy-plan.md)
      design: # Round eleven: the professional-polish sweep

- [x] **E9 A browser that cannot run it says why.** No WebGL check and no
      `<noscript>`. The common case is not an old phone, it is desktop Chrome
      with hardware acceleration off, and what those players got was a three.js
      (more: journal/legacy-plan.md)
      design: # Round eleven: the professional-polish sweep

- [x] **P1 A 512 PNG icon**, which the Play wrapper and the Android home screen
      both need. Done 2026-09-13, `76cd79a`.
      design: # The Play listing

- [x] **P2 The Android wrapper.** A Trusted Web Activity, so Google Play can
      list a web game at all: `scripts/twa.ps1` and `twa/`. Done 2026-09-13,
      `1e0bd12`. Its build output is `build/`, which is gitignored as of
      (more: journal/legacy-plan.md)
      design: # The Play listing

- [x] **P3 The privacy policy** Play requires, and the one fact a web game has
      to state. Done 2026-09-13, `4056acc`, `PRIVACY.md`.
      design: # The Play listing

- [x] **P4 The store listing, rendered from the built game.** `npm run store`
      drives `scripts/store.mjs`, a filmstrip driver at 1080x1920 (16:9, because
      a 19.5:9 phone screenshot is rejected by Play), one frame per named state
      (more: journal/legacy-plan.md)
      design: # The Play listing

- [x] **P5 Gideon reads the listing text.** **Approved 2026-09-19: "The listing
      looks good."** Title, short description and full description in
      `store/listing/en-US/`, as refreshed that day for rounds twelve and
      (more: journal/legacy-plan.md)
      design: # The Play listing

- [ ] **V0 The Play store, this version.** *(HELD BY HIM, 2026-09-18: "I will
      hold off on adding anything to the play store for now." The box stays open
      and unticked because the work is not done, not because it is blocked - and
      (more: journal/legacy-plan.md)
      briefs: store
      design: # Round twelve: the world gets a voice — ## Milestones

- [x] **V1 The Call.** `src/sim/call.ts`, pure and renderer-free:
      `resonance(x, d, lit)` is the loudest unlit Anchor's voice, 0..1, over a
      40-cell reach chosen against the region grid rather than by eye. **A
      (more: journal/legacy-plan.md)
      design: # Round twelve: the world gets a voice — ## Milestones

- [x] **V2 The tally, always on screen.** Nine pips under the depth line that
      fill as Anchors are lit, and a tenth diamond for the Vault that opens only
      on the ninth. Pips and not `3 / 9` because the research is specific: what
      (more: journal/legacy-plan.md)
      design: # Round twelve: the world gets a voice — ## Milestones

- [x] **V2b The resonance needle, which became a lamp.** V1's reading drawn in the instrument
      cluster, and the receiver that carries it added to `FINDS` so it arrives
      as a discovery rather than as a UI feature. Split out of V2 on 2026-09-18
      (more: journal/legacy-plan.md)
      design: # Round twelve: the world gets a voice — ## Milestones

- [x] **V3 The Survey map says which ground is settled.** Ask 5's other half.
      
      **The box's own premise was half wrong and that is worth recording.** It
      (more: journal/legacy-plan.md)
      design: # Round twelve: the world gets a voice — ## Milestones

- [x] **V4 The encounter frame.** One pure module: a weighted pool, a pity
      timer, once-only beats, and a seeded roll on its own offset, with the
      archetypes as data. No content yet - this is the frame the content lands
      (more: journal/legacy-plan.md)
      design: # Round twelve: the world gets a voice — ## Milestones

- [x] **V5 The first EVENT.** Was "the first three encounters", and scoping it
      changed the milestone rather than the schedule.
      
      (more: journal/legacy-plan.md)
      design: # Round twelve: the world gets a voice — ## Milestones

- [x] **V5b The other two archetypes.** Closed 2026-09-19, and the two halves
      were closed differently. **Archetype 2, the cracked vein, is the lode**,
      and that was established by reading the brief's own row against what V5
      (more: journal/legacy-plan.md)
      design: # Round twelve: the world gets a voice — ## Milestones

- [x] **V6 The wake rewrites what you dug.** The story brief's highest-ranked
      technique: at the fifth Anchor, tunnels the player already cut visibly
      change. Done 2026-09-18 as v0.52.0.
      (more: journal/legacy-plan.md)
      design: # Round twelve: the world gets a voice — ## Milestones

- [x] **V7 The three-act grade.** Done 2026-09-18 as v0.51.0, and driven off the
      CAMPAIGN rather than off the Unrest meter the box asked for.
      
      (more: journal/legacy-plan.md)
      design: # Round twelve: the world gets a voice — ## Milestones

- [x] **V8 The first ten seconds show a ruin.** The story brief's first-minute
      finding: worked geometry in view before it is reachable, no text.
      
      (more: journal/legacy-plan.md)
      design: # Round twelve: the world gets a voice — ## Milestones

- [x] **V9 The ending shows the world.** A pull-back over the dug planet behind
      the existing card, so the ending hands back a place the player can see
      they made. Done 2026-09-18 as v0.53.0.
      (more: journal/legacy-plan.md)
      design: # Round twelve: the world gets a voice — ## Milestones

- [x] **W1 The icon comes off the game.** Done 2026-09-19 as v0.53.1.
      
      **Shot, not drawn.** `scripts/icon.mjs` drives the built game the way
      (more: journal/legacy-plan.md)
      design: ## Round thirteen: the icon

- [x] **W2 The derelict drill ship.** Done 2026-09-19 as v0.54.0. Archetype 3 of
      the research's ranked list, and the half of his round-twelve ask that the
      lode did not touch: *"more rounded and story like."* A wrecked prior ship,
      (more: journal/legacy-plan.md)
      design: ## Round thirteen: the icon

- [x] **X1 Ore comes in veins.** Done 2026-09-19. The round's biggest change and the answer to
      ask 1. Each ore's cells cluster into blobs around rolled vein sites
      instead of rolling independently per cell. **Total cells per ore stay
      (more: journal/legacy-plan.md)
      design: ### The measurement that decides asks 1 and 2

- [x] **X2 A rare find announces itself.** Done 2026-09-19. Ask 1's other half, and the research
      ranks it first because it is cheap and carries most of the feeling:
      Diablo III's Loot 2.0 gave each rarity tier its own light and particle so
      (more: journal/legacy-plan.md)
      design: ### The measurement that decides asks 1 and 2

- [x] **X3 One or two materials become keys rather than currency.** Done
      2026-09-23, cut to one material for one purchase, per the research's own
      warning against doing this broadly. Solmarrow - the rarest mineral in
      (more: journal/legacy-plan.md)
      design: ### The measurement that decides asks 1 and 2

- [x] **X4 The first Anchor's gift: the Survey map shows where the ground is
      rich.** Done 2026-09-19. Asks 3 and 4. An aggregate richness read per REGION, rendered as
      two or three heat tiers over that region's tiles, and shown only for
      (more: journal/legacy-plan.md)
      design: ### The measurement that decides asks 1 and 2

- [x] **X5 The ability ladder, designed and not yet built.** Built 2026-09-19 as
      round fifteen's Y4, and the thing that made it buildable was his own
      brief: nine Anchors would have meant nine invented abilities, which is
      (more: journal/legacy-plan.md)
      design: ### The measurement that decides asks 1 and 2

- [x] **X6 A lit Anchor stays a monument.** Done 2026-09-19. Ask 5, and the interesting one,
      because the game already half does it. `blockAt` gives an unlit Anchor
      `hard: Infinity` - it cannot be cut by the drill, a charge or the laser.
      (more: journal/legacy-plan.md)
      design: ### The measurement that decides asks 1 and 2

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

### Round sixteen: closing Fable's review, 2026-09-24

- [x] **Z1 The Vault's own card names the entity, and one core break gets filmed.**
      Done 2026-09-24. `vaultReached`'s card (`src/actions.ts`) now says the turn
      plainly - "The cores were one thing, held apart, and every one you broke let
      more of it out" - rather than only reassuring, and keeps "it is quiet now, and it is
      quiet because of you" verbatim because `src/sim/grade.ts` quotes that exact
      clause as the reason act three grades quieter than act one. The manifest's
      vault panel (`src/ui.ts`) carries the same turn in one line. Two new film
      scenarios in `tools/scenes.mjs`, `corebreak` and `vaultend`, drive
      `coreBroken`/`vaultReached` directly (exposed on the `__cw` debug seam) the
      way `act3` already shortcuts to a won state, and shot clean contact sheets
      of both - the break's own card and the ending's. Receipt:
      `test-results/film-corebreak.png`, `test-results/film-vaultend.png`.
      briefs: level-design
      design: ## Round sixteen: closing Fable's review

- [ ] **Z2 A real phone read, before V0.** Fable's review: S6's phone pass was
      desk evidence (draw calls, filmed contact sheets), never a reading taken on
      the handset, and PWA install/offline behaviour has never been checked on
      this phone at all. `studio phone read perf`, a shot of a shop station and
      of the third hint, and an install-and-offline pass in Chrome on the S26
      Ultra - none of it needs Gideon's held console work, so it does not wait on
      V0.
      briefs: phone
      design: ## Round sixteen: closing Fable's review

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

- [ ] **AB Back closes the top panel, every panel has an X, and every panel scrolls.** One
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

- [ ] **AL Where minerals sit.** Each key has a depth window, a home region rolled on its own
      seed offset, at least four pockets, and no pocket over a third of any one rung's ask;
      commons thin out below their band; geodes fall under a quarter of the value in 0-113 m.
      Each key has its own mesh and material in the wall, never a recolour of a money ore. The
      frozen golden is re-recorded with the diff read. Receipt: a census test in the gate
      asserting all three placement rules, and a test that no key shares a material with a
      money ore.
      briefs: level-design, balance, art
      design: ## Round seventeen, the shop and the minerals

- [ ] **AM A key find is an event, and a hunt.** The first cut of each pocket fires it: light,
      sound, a 15 ms haptic, a short camera hold, a map mark, the key's name. Any move input ends
      the hold on that frame, and it never fires while the ship touches a hazard. The Sensors
      line names the key pockets within range, never the cell; the map shows each key's home
      region once its tier is open. Receipt: a film of two finds of one key; tests that the
      event fires per pocket and that a thrust ends the hold.
      briefs: feel, controls
      design: ## Round seventeen, the shop and the minerals

- [ ] **AO Gate vendors.** Each gate is a different room around the same lift, stocked with that
      tier's rungs, Sink (a skill the pad never sells) at the first gate, one key-priced
      consumable per visit, a visible save moment, and no pump. Receipt: a test that each
      vendor's stock differs, and a screenshot per gate.
      briefs: menu, economy
      design: ## Round seventeen, the shop and the minerals

- [ ] **AE The barrier and the core become objects, and the drain shows in the world.** The
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

- [ ] **AF Repair shows in the rock.** A scar refills in stages, cracks closing and its
      glow dimming as it is packed; the "+X%" toast goes; SEAL and every Ballast readout (the pad's
      sight glass, the shop's wall gauge) stay hidden until the first core. Receipt: a test
      that the scar's stage follows the packing, and a film.
      briefs: mechanic-design, feel
      design: ## Round seventeen: the ladder, finished

- [ ] **AH The ending: the light leaves.** At the Vault the light of every spent core leaves
      its scar and gathers at the center, the planet goes dark from the center upward, and
      the sky over the pad takes the core's colour; a short card follows, never before.
      Receipt: a film of the whole ending with the Mobile renderer.
      briefs: lighting, rendering, stakes
      design: ## Round seventeen: the ladder, finished

- [ ] **AI Always more, inside every tier.** One visible sign per Anchor broken, in one
      wrongness colour used nowhere else, spreading from details to mass to air; two of tier
      0's six buried devices move deeper. Receipt: the secrets probe per tier, rerun.
      briefs: level-design
      design: ## Round seventeen: the ladder, finished

- [ ] **AJ A slimmer HUD, nothing lost.** The depth line folds into the region chip and the
      three timed supplies sit behind one button; credits and haul stay, since they decide
      when to surface. Receipt: the readout count before and after, a screenshot at
      1080x2340, and after his first phone session on it, the readout he missed or his word
      that none was, in STATE.md.
      briefs: hud
      design: ## Round seventeen: the ladder, finished
