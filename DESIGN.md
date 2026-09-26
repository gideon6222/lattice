# The Lattice — the plan

Round four, written 2026-09-10 against v0.24.0. **The plan, not a history.** Rewrite in place
as things land; the changelog is where the record goes. Rounds one to three are in the
appendix at the bottom, shipped.

This file was `DESIGN.md` until 2026-09-09. It is `PLAN.md` because that is the name
`INDEX.md` tells a resuming session to open.

---

## Summary

**Fantasy:** a contracted driller working the Verdax Drift, cutting a world apart from the
inside to buy his way out of it.
**Loop:** dive, cut, fill the hold, climb out before the world takes it back, sell, buy one
rung, go deeper.
**Engine:** web, three.js. Decided 2026-09-10 on measurement rather than habit: the game runs
well on the S26 Ultra installed as a PWA, the only platform limit it has met is 400x larger
than it needs, and a Godot rewrite is 12,716 lines of working game thrown away for a benefit
you have said you do not want yet.
**Reference:** none. Original. Genre neighbours are Motherload, SteamWorld Dig 1 and 2, Dome
Keeper and Mr. Driller, researched 2026-09-10 and cited where a mechanism is borrowed.
**New technique:** per-face axis-selected UV projection on the rock (a right-sized triplanar).
Fixes a real bug and is the first thing that will make caverns look like stone.
**What you keep:** one relic per planet, the five Jump Drive components, and the record book.

### The three faults, measured

Everything below is derived from the shipped game, through the same bundle the golden tests
use. The probes are in the milestone list so they become permanent.

**Fault 1 — everything at stake is the ship.** Fuel, heat, hull and tremors all threaten one
object, and the worst outcome is a tow that costs a percentage of one haul. There is nothing
you can lose that you are not holding. Dome Keeper's designer names this exactly: depth is
worth something when it is dangerous to a system you are *not* touching. The Lattice has no
second system. This is why *"it feels free"* survived a reprice: the price was never the
problem, the absence of a second thing to lose was.

**Fault 2 — the first sale defuses the first hour.** Measured, planet 0, no upgrades:

| Band | Ore cells per 1,000 | Value per kg | One 60 kg hold |
|---|---|---|---|
| 5–20 m | 57 | 11.1 | 666 cr |
| 20–35 m | 45 | 20.4 | 1,223 cr |
| 35–50 m | 45 | 36.0 | 2,161 cr |
| 50–70 m | 41 | 78.4 | 4,703 cr |
| 70–85 m | 27 | 115.3 | 6,916 cr |
| 85–110 m | 55 | 162.8 | 9,770 cr |

That table is an upper bound: it prices a hold of pure ore. **M1 has since measured the real
thing** and it is worse rather than better — a first run pays 114 to 311 credits because most
of what you cut is in the way rather than worth money, and yet *every ladder in the shop is
started inside the first four to sixteen minutes whatever style you play*. The M1 section in
`NOTES.md` has the table.

Against that, the first rung of every ladder: Thrusters 100, Cargo 110, Drill 130, Scanner
140, Fuel Tank 480, Cooling 1,000. **The first hold you ever sell buys four upgrades**, and
the two that answer the game's two pressures cost less than a second hold. There is no point
in the opening where you want something you cannot have, which is the whole of *"I can afford
upgrades pretty early on for fuel and cooling so neither is a risk."*

**Fault 3 — half the game is behind a wall you have never reached.** Planet 0's core is at
**110 m**. Heat starts at 70, tremors at 85. Across five sessions every note you have written
has been about the first sixty metres and the surface. So the chart, the traits, the Jump
Drive, the Heart, the crossing and the twelve palettes — everything built in rounds one to
three — sits behind one 110 m dive that has never happened. It is not undiscovered content,
it is unplayed content, and the fix is not to build more of it.

### What this round does about them

1. **A second system: the Claim.** Something at the surface that depth threatens and the ship
   cannot protect. Section below.
2. **An economy measured rather than assumed**, with a probe that reports the run at which
   each upgrade is bought and a test that fails when the opening goes free again.
3. **The first world compressed** so heat, tremors, a core break, the chart and a crossing all
   happen in the first session, and the hazard depths scale per world instead of sitting on
   global constants.
4. **An art pass that starts with a bug**: the rock's texture projection is wrong on every
   face that is not facing the camera, which is every floor, ceiling and cavern wall.
5. **The things POLISH.md asks for that this game has never had**: haptics, a run debrief, a
   record book.

### Your asks, expanded

Numbered because you asked for the whole game overhauled, and these are the standing ones
that this round finally answers rather than works around.

1. *"it feels free"* / *"there isn't really a risk or reward yet"* → the Claim, plus a
   measured opening. Fault 1 and 2.
2. *"think about a larger point to the game, or secondary objective"* → the record book and
   the Claim's ledger, on top of the relics and the drive that already exist.
3. *"make the graphics look more realistic and detailed, more gritty"* → the UV fix, then the
   imported mineral surfaces, then a second normal-mapped surface on the ship.
4. *"make it so upgrades show visual changes on the ship"* → extended to the Claim, which
   visibly grows and visibly breaks.
5. *"use pre-made assets wherever you can"* → the asset table below, with the misses named.
6. *"add a log to see how fast things drain and whether the cost is worth the benefit"* → the
   telemetry panel gets the two questions it cannot currently answer: what a run was worth per
   minute, and which upgrade paid for itself.
7. *"is there a way to see how far I have gone"* (implied by the depth marker you asked for)
   → the record book, kept across worlds.

### My additions, marked as mine

- **The core breach becomes an escape.** Breaking a core currently opens a menu. It should
  start the world coming apart around you with the shaft collapsing behind you, and the chart
  should open once you are out. The best moment in the game is currently a dialog box.
- **Ore has a shape on the ground.** Fault 2's real cause is that every kilo is the same
  decision. Heavy-and-cheap versus light-and-dear only matters when the hold is nearly full,
  so the hold should fill sooner and the manifest should let you dump a mineral by name.
- **A reason to come back tomorrow**: the Drift's worlds are seeded from a daily seed as well
  as the run seed, so the chart's offer changes day to day.
---

## Systems

### 1. The Claim — the second thing you can lose

**The idea in one line.** You do not own the ship, you own a claim on the surface: a
refinery, a fuel derrick and a store shed standing beside the pad. Cutting the world apart
shakes the ground it stands on.

**Why this and not another hazard.** Every pressure in the game today points at the ship, so
every one of them is answered by the same reflex, which is to fly up. A system you are not
touching is the mechanism the best game in this genre uses to stop mining being a treadmill,
and it is the missing half of *"it feels free"*. It also gives credits a second place to go,
which matters because a purely geometric upgrade ladder makes every amount you earn
irrelevant to the amount before it.

**State it owns** (`src/sim/claim.ts`, saved per world, cleared on a core break):

| Field | What it is |
|---|---|
| `strain` | 0–1, how far the world has been pushed. Rises with cells removed below the stability line |
| `integrity` | 0–100 on each of three structures: refinery, derrick, shed |
| `stored` | ore left in the shed rather than sold, at a better price later |

**Rules.**

- **Strain rises from your own digging, below the stability line only.** Per cell removed,
  scaled by how far below the line it is. Dwelling costs nothing on its own — heat already
  charges for that, and two systems charging for the same verb is one system.
- **Strain is spent, not survived.** At 1.0 a surface quake fires: each structure rolls
  against its own exposure and takes damage, strain drops to 0.35, and the world is a little
  richer afterwards (`rich` rises 4%). The world is being broken open, and that is worth
  something. *This is the bet: a shaken world pays more.*
- **Damage is a discount, never a wall.** A damaged refinery pays less per kilo. A damaged
  derrick refuels slower. A damaged shed loses a fraction of what is stored. None of them
  stops a run, and none of them can make a save unwinnable, per `CRAFT.md`.
- **Repair costs credits and one deep material.** The material for repairing the refinery is
  found below the stability line, so the thing that fixes the surface is only found in the
  place that breaks it. `CRAFT.md`: gate an upgrade behind a place, not a price.
- **The shed is the greed dial you hold yourself.** Store ore instead of selling and it is
  worth 1.4x at the end of the world, if the shed is still standing when you break the core.

**Numbers, first pass, to be replaced by whatever the probe says.** Strain per cell at the
line 0.004, doubling by the core; quake at 1.0; refinery damage 12–30; refinery payout
penalty 0.35 x damage fraction; repair 900 cr plus 4 units of the deep material; shed
multiplier 1.4 and shed loss 20% of stored per quake at full damage.

**The test.** `test_claim`: strain is monotonic in cells removed and zero above the line; a
quake never reduces payout below 0.5x; the repair material's generation depth is below the
stability line at every leg; and the invariance test `CRAFT.md` asks for — same world, same
digging, different starting bank, same strain.

**How it is shown.** The Claim is geometry on the pad you fly past every time you surface, and
it is the only place the gauge lives. No new HUD element: `CRAFT.md` says a HUD is a claim
about what the player should think about, and this is a thing you should think about when you
are up, not while you are cutting. A quake is a shot: the camera shakes at the surface, dust
comes off the structures, and one of them is visibly bent afterwards.

---

### 2. The economy, measured

**The fault, restated in one number.** The first hold you sell pays 1,223 credits. The first
rung of Thrusters, Cargo, Drill and Scanner together cost 480.

**The rebuild.**

- **Price every pressure-answering upgrade against the depth where its pressure begins**, not
  against the first haul. Fuel Tank and Cooling Rig rung 1 land at roughly three holds from
  the band where fuel and heat first bite, not one.
- **Flatten the multiplier and lengthen the ladder.** A 2.0x step means the last rung costs
  more than the first eight together, which is why maxing is 245,000 credits and nobody will
  ever see it. 1.55x is already recorded here as hyper-inflationary. Target 1.35–1.45 with
  more rungs and a real top.
- **Give credits a sink that is not a rung**: Claim repair, shed storage, and transit fuel.
- **The rule the shop obeys**: everything unlocked, plus exactly one teaser, the shallowest
  thing still out of reach. Already the rule, now asserted at every leg rather than at one.

**The tool, and this is the milestone that matters.** `scripts/econ.mjs`: run a scripted
player through the pure layer — dive to the best band reachable, fill, climb, sell, buy the
best affordable rung, repeat — and report the run number and the wall-clock minute at which
each upgrade is bought, for three play styles (cautious, greedy, optimal). `CRAFT.md`:
measure a progression by simulating play, never by dividing a late price by early income.

**The test.** `test_econ`: the first sale buys at most one rung; Fuel Tank and Cooling are not
affordable before 60% of the depth where their pressure starts; every upgrade is bought by
leg 6 under the optimal style; and the spread between cautious and greedy is at least 25%,
because when every style scores the same, the finding is that the game has no decision in it.

---

### 3. The first world, compressed

**The fault.** Planet 0's core is at 110 m with heat at 70 and tremors at 85, and five
sessions of play have never gone past about 78 m. Everything from the chart onward is
unplayed rather than unbuilt.

**The change.** The three thresholds stop being global constants and become functions of the
leg, anchored to that world's core:

| | Now | Proposed leg 0 | Relation |
|---|---|---|---|
| Core | 110 m | 58 m | `core(leg) = 58 + 28 * leg` |
| Heat line | 70 m | 32 m | `heat = round(0.55 * core)` |
| Tremor line | 85 m | 44 m | `tremor = round(0.76 * core)` |

So the first world teaches heat at 32 m, teaches tremors at 44 m, and ends at 58 m — a core
break, a chart, a crossing and a trait inside the first session. Leg 1's core is at 86 m, and
by leg 4 the numbers are where they are today.

**The invariant survives, as a relation instead of a constant.** `GRANITE_TO_SCORIA ===
HEAT_DEPTH` becomes `graniteToScoria(leg) === heatDepth(leg)`, and the test asserts it at
every leg rather than at one. The four things that land on the same metre still land on the
same metre.

**Existing saves.** The depths are written into the save the first time a world is entered, so
the world you are standing on keeps the numbers it was generated with. A save cannot end up
with its ship below a core that moved.

---

### 4. Breaking the core becomes the best moment instead of a dialog

Today: the core breaks, a modal opens, you pick the next world. The most cinematic beat in the
game is a box with a button.

**The breach.** The core cracks, and the world starts coming apart from the bottom up:

1. A hard shake, the lamp cuts to emergency red, and the ambient goes to ember.
2. **Ninety seconds on the clock**, shown as the shaft filling from below rather than as a
   number. Tremors every 6–9 s instead of every 27.
3. Collapse propagates upward through dug cells behind you, so the route you cut is the route
   that closes. The pathfinder guarantee stays: `CRAFT.md` says never let a hazard take the
   run, so the collapse can never seal the last open route to the surface, and there is a test.
4. Reach the pad and the transit plays as it does now, with the world breaking apart behind
   you rather than receding intact.
5. Fail to reach it and you are towed for the usual cut — you lose the hold, not the run, and
   the world still breaks.

**Why it earns its cost.** It is one clock, reusing the tremor system, the collapse system,
the tow and the transit, and it converts the moment the game is named after into something you
survive. It also makes the shed a real decision: everything stored is sold at the breach.

---

### 5. The hold becomes a decision

`CRAFT.md`: a weight cap is what turns "which is worth more" into a decision — but only in the
minutes when it binds. Today the hold is 60 kg and the ore that fills it is chosen for you by
what you happened to fly through.

- **Dump by mineral from the manifest.** One tap on a row jettisons that mineral. It is the
  action the manifest has been describing for four versions without offering.
- **Widen the weight spread** so heavy-and-cheap genuinely competes with light-and-dear. Keep
  the value spread on a premium under 2x per the recorded measurement, and put the variety in
  weight instead.
- **The hold fills sooner and the climb is where you pay for it**, which is Motherload's
  weight-versus-fuel tradeoff, the one mechanism in that game everybody remembers.

---

### 6. Everything POLISH.md asks for that this game has never had

- **Haptics.** There is not one `navigator.vibrate` call in the repo. Android Chrome supports
  it, it is three lines behind a settings toggle, and `POLISH.md` requires every action to
  fire visual, audio, camera and haptic together. Cutting a block, a strike, a quake, a
  purchase, a tow.
- **A run debrief.** A run currently ends by folding numbers into a total. It should show what
  the run paid, the depth reached against the record, what was left on the ground, and the one
  thing you were closest to affording — `POLISH.md`'s "a run that ended one decision short".
- **A record book.** Deepest metre, best haul, fastest core, worlds broken, relics held,
  components carried. A collection that does not decay, kept across worlds, reachable from the
  pause screen beside the patch notes.
- **The tremor roll gets seeded.** `planCollapse()` takes `rand: () => number = Math.random`
  and the shipping game takes the default, so the one event a replay cannot reproduce is the
  one that decides whether the way out is open. It moves onto the world's seeded stream.

---

## Presentation

### The rock, starting with a bug

`src/materials.ts:198` sets `vec2 rockUv = wpos.xy` for **every face of every cell**. That is
correct only for faces pointing at the camera. A tunnel floor or ceiling has its extent in X
and Z and is being sampled with (x, y), so one whole axis of texture variation collapses and
the surface reads as a flat band rather than stone. Every horizontal tunnel, every cavern
floor and every ledge underside in the game is currently smeared.

**The fix is the round's new technique**: pick the projection plane per face in the vertex
shader from the box's own normal — `abs(normal)` decides between `wpos.xy`, `wpos.zy` and
`wpos.xz`. This is triplanar mapping's right-sized form for this geometry: the terrain is a
flat-shaded box with hard 90-degree edges, so there is no seam for a three-way blend to hide,
and a full blend would triple the texture fetches for nothing. Cost: 0 KB of bundle, 0 draw
calls, a handful of scalar compares at vertex frequency. Sources are in the research note;
the canonical ones are GPU Gems 3 chapter 1 and Ben Golus on triplanar normal mapping.

Filmed on a horizontal tunnel and a cavern before and after, because a texture artefact under
a moving lamp does not show in a still.

### The rest of the art pass

- **More mineral surfaces**, normal and roughness only, never colour, so twelve palettes keep
  deciding colour. Table below.
- **A normal map on the hull.** The ship is the object on screen for the entire game at full
  size, and it is the one large surface with no relief on it. `CRAFT.md`: "cartoony" means
  under-lit and under-textured, and a normal map on the largest surface does more than a model
  swap.
- **The Claim as geometry**, built from imported industrial props rather than modelled, since
  it stands at full size on screen every time you surface and it is exactly what the assets
  rule is for.
- **The breach as a grade**: ember ambient, red lamp, dust density up, the vignette closing.
  One palette shift driven by one number, not five separate effects.

---

## Assets

Hunted 2026-09-10 against `ASSETS.md`. The rule is a measurement, not a preference: import
what the player reads at its real size, model in code what is judged on silhouette at thirty
pixels. Everything below is CC0 or OFL unless stated, and every import is **normal and
roughness only, never a colour map**, because twelve palettes keep deciding colour.

### The budget decision that comes first

There is **no glTF loader in the bundle today** — the ship, the pad and every prop are coded.
The first model import therefore costs `GLTFLoader` once, roughly 15 to 20 KB minified and
gzipped, before a single model's bytes. Today's totals: 747.2 KB overall, and the `index`
chunk is already at 151.1 KB against a 144.4 KB budget, drifting +4.61%.

**So the loader and the props are lazy-loaded, not bundled.** They are surface geometry, and
the surface is not the first thing on screen: the game is interactive before the pad's
detail arrives, the loader lands in its own chunk, and the size guard gets a new budget line
for it rather than a raised one on `index`. If that proves awkward, the fallback is to keep
the Claim coded and spend the import budget only on textures, which cost no loader at all.

### Surfaces — the textures, which need no loader

| Need | Source | Id | Licence | Fetch | Into |
|---|---|---|---|---|---|
| Granite | ambientCG | `Granite002A` | CC0 | `python assets.py get ambientcg Granite002A --res 1K --maps NormalGL,Roughness` | `src/textures/` |
| Basalt, and obsidian by reuse | ambientCG | `Rock035` | CC0 | `python assets.py get ambientcg Rock035 --res 1K --maps NormalGL,Roughness` | `src/textures/` |
| Ice | ambientCG | `Snow006` | CC0 | `python assets.py get ambientcg Snow006 --res 1K --maps NormalGL,Roughness` | `src/textures/` |
| Sandstone | ambientCG | `Rock029` | CC0 | `python assets.py get ambientcg Rock029 --res 1K --maps NormalGL,Roughness` | `src/textures/` |
| Marble | Poly Haven | `marble_cliff_05` | CC0 | `python assets.py get polyhaven marble_cliff_05 --res 1k` | `src/textures/` |
| Crystal, and salt by reuse | ambientCG | `Onyx006` | CC0 | `python assets.py get ambientcg Onyx006 --res 1K --maps NormalGL,Roughness` | `src/textures/` |

Each becomes a WebP pair and a palette-driven material variant through the existing
`src/materials.ts` path. No new code path, no loader, and they are the reason the UV fix goes
first: a better normal map projected wrong is still smeared.

### Props and the ship

| Need | Verdict |
|---|---|
| **The drill ship** | **Stays coded.** Nothing CC0 is a purpose-built mining vessel at a sane size, and this is the hero object on screen for the whole game. The search is the answer, not a redirection |
| **The landing pad and the Claim** | Import. On screen at full size every time you surface, which is exactly what the rule is for. Kenney `factory-kit` (crates, pipes, catwalks), `space-station-kit` (antennae, panels, lights), `modular-space-kit` (platform tiles) |
| **Drill tier, visibly** | PolyPizza `8uBbH7Dvmb`, Kay Lousberg's Drill, CC0, 1,198 tris, as the nose attachment that changes per tier |
| **Thruster and plating tiers** | Kenney `space-kit` parts, **only if** the zip turns out to contain glTF. It is an unversioned Kenney pack, which historically means OBJ or FBX, and nothing here converts those |

**Verify before relying on any of them**: only the versioned zips (`factory-kit_3.0`,
`city-kit-industrial_2.0`, `modular-space-kit_1.0`) are likely to be current-format re-exports.
The milestone opens the zip and looks before the plan promises anything.

**This shortlist is provisional, and here is why.** The hunt found that
`gamedev-notes/scripts/assets.py` could not search Kenney at all: its listing regex matched
only double-quoted links, and Kenney's pages emit single quotes — measured at 55 single-quoted
against 6 double-quoted on one category page, so about a tenth of the library was visible and
the rest was reported as absent. It is fixed now, and the very first re-run surfaced
**`modular-cave-kit`**, which nothing in the original shortlist knew existed and which is the
most obviously relevant pack in the library to a game made of caves. M2 re-runs the search
before importing anything.

Every imported mesh has its baked atlas stripped at load and a `MeshStandardMaterial` coloured
from the palette assigned instead, roughness about 0.8 and metallic 0 unless the piece is meant
to read as bare metal. That keeps a Kenney crate and the coded ship under one lighting model.

### Interface

| Need | Source | Id | Licence | Note |
|---|---|---|---|---|
| HUD frames, gauge and bar plates | Kenney | `ui-pack-sci-fi` | CC0 | 768 KB zip, a handful of sprites reach `dist/` |
| Ten icons | Lucide | `fuel`, `flame`, `package`, `coins`, `drill`, `zap`, `bomb`, `radar`, `anchor`, `rocket` | ISC | One stroke family, tinted by `currentColor`, so the palette still decides. There is no tow-truck glyph, `anchor` is the tow |
| Display face | Google Fonts | `Orbitron` 700/900 | OFL-1.1 | Wide, geometric, industrial |
| Numerals | Google Fonts | `Share Tech Mono` 400 | OFL-1.1 | A readout face for the gauges, about 20 KB |

Both faces join the existing two in the Workbox precache glob, or an installed app falls back
to a system face offline.

### Sound

Eight CC0 sounds from Freesound, fetched as HQ OGG previews: drilling loop `634322`, rock
break `524312`, ore pickup `646673`, thruster loop `347576`, hull damage `682736`, tremor
rumble `483287`, purchase click `839832`, alarm `584287`.

These replace the synthesised **effects**, where a produced sample is simply better. **The
music stays synthesised**, and this is now a measured answer rather than an inherited one: the
scout searched OpenGameArt and Freesound for a bed, a tension layer and a danger layer at one
tempo and key, and no CC0 library indexes stems as a matched set. The score mixes live by
depth, danger and zone off one scheduler, and nothing available can do that.

### The misses, plainly

- No distinct CC0 basalt, obsidian or salt scan. Handled by reusing one normal map and
  separating them in code by roughness and palette.
- No CC0 drill ship worth importing. The ship stays code.
- No CC0 layered music stems anywhere searched. The score stays code.
- `assets/CREDITS.md` does not exist in this repo yet, and the four textures already in
  `src/textures/` are not recorded anywhere. `POLISH.md` requires it. M7 writes it and
  backfills those four.

---

## Tests and tools

| Layer | What is added |
|---|---|
| Probes | `scripts/econ.mjs` (three play styles, run-by-run purchase report), `scripts/claim.mjs` (strain per style over a world) |
| Golden | Claim strain and quake sequence for a fixed seed; the per-leg threshold table |
| Design | `test_econ` and `test_claim` above; the per-leg `granite === heat` relation at every leg |
| Boundary | `test/sim-boundary.test.mjs` already guards `src/sim`; `claim.ts` goes inside it |
| Smoke | The breach: core break, clock, collapse behind, reach the pad, chart opens. And the tow path out of a failed breach |
| Filmstrip | New scenarios `breach`, `quake`, `cavern` (the UV fix), `debrief` |
| Phone | The six questions in `TESTING.md` after the breach lands, because it is the one new thing that is all motion |

---

## Polish budget

`POLISH.md` lines this round pays for, and where:

- First sixty seconds, a win in the first minute → M3 (economy) and M5 (compressed world).
- Haptics on every action → M8.
- Ambient motion in the idle state → the Claim's structures, M2.
- The shop is a place with the real object in it → already true; the Claim extends it, M2.
- A run that ended one decision short → the debrief, M8.
- A meta-goal that does not decay → the record book, M8.
- Every screen looked at as a picture at the phone's aspect → M9, before the ship.

---

## Second month

The Drift keeps generating worlds after the Heart, so the endgame is already open-ended. What
it wants next, in rough order: a second ship hull with different arithmetic rather than bigger
numbers, so the choice is a shape and not a rung; contracts that ask for a named mineral by a
named depth and pay in Claim repairs; and a wreck to find, which is somebody else's Claim,
abandoned, with their ledger still in it.

---

## Open decisions I made for you

Each is reversible, each has an alternative, and each goes into `NOTES.md` when it lands.

1. **The Claim is per world and does not travel.** The alternative is one Claim carried
   across the whole Drift, which makes the arc longer but means one bad world can sour ten.
2. **A quake makes the world richer.** The alternative is pure downside, which would make
   depth simply worse and is the thing this round is trying to fix.
3. **The breach clock is 90 seconds.** Long enough to climb 58 m at level 0 thrust with room
   for two mistakes. It is the number most likely to be wrong and it is one constant.
4. **The compressed thresholds keep today's numbers by leg 4** rather than rescaling the whole
   ladder, so nothing about the deep game changes, only when you first meet it.
5. **Web, not Godot.** Decided 2026-09-10 on the measurements in the summary.

---

# Round five: the Outfitter as a gas station

Written 2026-09-10 against v0.26.0, from his own design brief:

> *"like a 3d futuristic gas station. the ship parks at the gas station, it has a retro neon
> feel with the lights. anything neon should feel like it is actually coming from an object or
> light in the room, not an overlay. the shop is similar to a gas station store. there is a
> display case that is also a counter. in the display case are important and expensive
> upgrades. behind the counter on the wall are the more standard upgrades."*

He designed the room. This is how it gets built.

## What is wrong with what is there

**The plinths are a control that does nothing.** They were built to filter the shelf, the
filtering was cut in the same commit for a real reason, and four lit, labelled,
tappable-looking objects shipped anyway. `POLISH.md`: every state names a visible action. He
found it in the first minute. Two attempts to wire them back up broke three different smoke
tests, all of which were written when every case was always on the shelf - which is the signal
that the grouping is the wrong mechanism, not that the tests are wrong.

**The neon is a decal.** `MeshBasicMaterial` planes with an additive halo, at a fixed z in
front of the room. Lit rectangles, not lit fittings. His read of it is exactly right.

## The build

### R1. Neon that is a fitting

The sourced recipe has four ingredients and the room has one:

- a **tube**, not a plane - a thin cylinder, so it has a lit side and a shaded side
- an **emissive material** on that tube
- a **housing** it sits in: a shallow channel of ordinary metal, lit by the room's own lights.
  This is the missing ingredient and it is the whole reason the current version reads as a
  sticker - the eye needs "normally lit" beside "self-lit" in one glance to believe the second
- a **real light** at the tube, short range and colour-matched, which is what actually puts
  colour on the wall behind it

For the softness a bloom pass would give: a **radial-gradient canvas texture** flush against
the wall behind the tube, additive and depth-write-free - not a hard-edged colour plane, and on
the wall rather than in front of the sign. That is the difference between a halo and a light
pool.

**Light budget.** The three.js forum's practical figure is about ten fixed point lights against
a typical uniform ceiling near fifteen, and a forward renderer pays for every light on every
shaded fragment. So six to eight short-range lights, **no shadows** - a point-light shadow is
six cube faces - with `visible` and `intensity` toggled rather than lights added and removed,
which avoids shader recompiles, and `layers` keeping each fitting's light off geometry it has
no business touching. This game already uses `SHIP_LAYER` for exactly that. **Measured on the
phone before it is called done**: none of those are mobile numbers.

### R2. The forecourt

Portrait decides the composition. The sourced vocabulary is canopy, illuminated fascia band,
totem sign, pump island, bollards, wet forecourt - and in a tall narrow frame **the canopy is
the one element that reads badly**, so it is implied by the fascia band rather than modelled.

- an **illuminated fascia band** across the top of frame, the element canopy makers call the
  most visible part of the whole structure
- a **totem sign** standing tall at one side with the dock name and the world on it
- a **pump island** the ship is parked at, at eye level
- **bollards** and a nozzle at the near edge
- the **wet forecourt** filling the bottom third

### R3. The counter and the wall

His split, and it is better than the one it replaces because it is how a real shop works:

- **A display case that is also a counter** in the foreground, holding the **expensive**
  upgrades, each individually spot-lit under glass with the down-light cone already built.
  Individual light reads as precious.
- **The wall behind the counter** holds the **standard** upgrades: a repeating rack washed by
  one strip rather than lit per item. Repetition plus flat light reads as stock.

A split by PRICE, not by category - which retires the four-group filtering that has been
fighting this room since it was added. Nothing has to be tapped to reveal anything: both tiers
are on screen at once. The clutter was never the count, it was fifteen things competing for one
lighting setup.

### R4. The ship parks at the pump

The docking collar becomes a pump: a housing, a hose to the ship's existing hardpoint, a
nozzle, and a readout that ticks while the tank fills, reusing the canvas-plate code the prices
already use. A reskin of geometry that exists rather than a new system.

### R5. Wet ground without a reflection pass

The Half-Life: Blue Shift trick, still used on mobile: duplicate the geometry, flip it in Y
under the floor, darken it, blend it under a semi-transparent floor plane. **Only the neon
fittings and the ship get mirrored** - a handful of meshes, not the room - with a
normal-mapped floor at low roughness so the lights streak across it.

## Milestones


The ask was mirrored fittings and the ship under a translucent floor. Its own
      brief said to judge it against the room before spending a day on
      it, so on 2026-09-13 the room was screenshotted at 460x996 and measured.
      **The floor is barely in the picture.** `#shopStage`, the 3D room, runs
      from y 120 to y **782** of a 996-tall screen; everything below that is
      DOM. Unprojecting the camera onto the deck plane and then confirming it
      by tinting `deckMat` emissive magenta put the visible deck in the last
      ~20 px of the stage. A mirror in a twenty-pixel strip is not worth a day,
      and "the ship under a translucent floor" would be showing the ship
      through a letterbox.

      **What the same measurement did find** is that the big dead band at the
      bottom of that screen is not the floor at all - it is `#shopCard`, 124 px
      of DOM, blank because nothing is selected. Fixed under the completeness
      pass rather than here (v0.41.0).

      **Two small things were kept** from the attempt, because they are right
      on their own: the deck is glossy instead of matte, and a third roaming
      light walks with the aisle and washes it in that aisle's color, which
      costs one light rather than one per aisle and leaves `NEON_LIGHT_BUDGET`
      untouched. Nothing was lighting the deck at all before - the neon
      fittings' pool distance is 1.6 and they sit two and a half metres above
      it.

      **Dropped rather than deferred.** The room is a shelf-height shot: the
      camera is at y 0.48 looking a few degrees down at cases and signs, and
      that is the right framing for a portrait phone, where the product has to
      be big. A floor worth reflecting into would mean lowering or pulling back
      the camera, which trades the thing the screen is for against a surface
      nobody looks at. If the room is ever re-framed, this is the note that
      says a wet floor becomes worth building again.

---

# Round six: you find the gear, then the shop fits it

Written 2026-09-10 against v0.27.0, from his own brief on the 0.27.0 build:

> *"the neon lights look more like lights now which I like. it looks like the
> description of the upgrade is cutting into the bottom upgrades in the cases.
> also the ship is in front of the hull upgrade. For the neon, I was hoping for
> more of a mix of cyberpunk, matrix, and steam punk. also for the 3 different
> neon lights at the bottom, this normally signifies different categories of
> gear. can you expand on my design ideas and feel, research how to give this
> whole 3d space that feel, and find a way to split the upgrades into
> categories, that aren't all shown at once. I want most of the upgrades to be
> hidden for now and unlock later in the game, possibly after unlocking new
> planets. and introduce some of the other power ups later as you make it
> further into the first planet. find a way to make new items appearing feel
> natural and an intuitive way to scroll or swap through upgrades. I also want
> them to be explained in game. so you only unlock certain upgrades by finding
> them initially, the game hints at what it does and you now own it, then you
> can upgrade it at the shop."*

Standing rule 9: **when he names a mechanism, build that mechanism.** He named
one, completely, in the last two sentences. Everything below is downstream of
it.

## The two faults he can see

Both are composition, not code, and both come from the same cause: the room is
framed for the whole canvas and the canvas is not what the player can see.

1. **The card cuts into the counter.** The tray is an HTML overlay held to the
   bottom of the screen; the counter row is drawn in world space with no
   knowledge that the bottom of the frame is spoken for. Measured, not guessed -
   see S1.
2. **The ship stands in front of the wall rack.** The ship is at z 0.9 and the
   rack at z -2.15, with nine cases behind a machine parked in the middle of
   the room. This is unfixable by nudging: with a 22 degree horizontal field
   there is no "beside the ship" in portrait. The ship and the shelf must stop
   sharing a shot.

## What the research changed

Four findings, and two of them overturned what I was about to build.

**The Matrix green is exclusive, and that is the whole point of it.** Phosphor
green near `#00FF41` on near-black is a MONOCHROME grade, not one neon among
several. A surface that goes Matrix goes green-and-black only; put it beside
cyan and magenta and both identities cancel into mud. So Matrix is not a
department colour, which is what I had planned. It is **one terminal**, kept
strictly monochrome, with code falling down it.

**Gesture-only navigation is missed by most people.** NN/g measured a 21% drop
in task completion for hidden navigation and roughly half the discoverability
of visible navigation. So the aisle swipe ships with a visible dot row AND
arrows from the first commit, not as a later affordance. A swipe nobody finds is
a shop with one aisle.

**Discovery does not pause the game.** Subnautica, Valheim and Hades all do this
the same way - a short non-blocking banner at the moment of pickup, play
continues, and the shop entry itself carries no further explanation because the
fiction already did it. This game's own grammar pauses for a relic and a drive
component, and those stay: a relic is the END of a search. A schematic is a
thing you are about to USE, so it must not stop the hand that is about to use
it.

**Glow without bloom has a real technique.** A fresnel-style "fake glow" shader
on a smooth proxy mesh around the neon prop, not an emissive material on the
prop itself. It needs smooth normals, so it is an added cylinder around the
tube rather than anything baked onto the low-poly edges. This is a forward-
renderer shader, not a post pass, which is the constraint it has to satisfy.

## The mechanism: seven devices are found, not bought

The fifteen upgrades split cleanly in two, and the split is **already in the
data** - it was not invented for this round, which is why it is the right one.

Seven upgrades read `Not installed` at level zero. Those are devices the ship
does not have. Eight do not, because they are ladders on gear the ship is
already wearing - a bigger tank, a thicker hull, a better drill.

So:

| | what it is | how you get it |
|---|---|---|
| **drill, cargo, thrust, tank, scan, tow, hull, cool** | ladders on gear you already have | the Outfitter sells them, depth-gated as now |
| **magnet, survey, bomb, laser, auto, drone, reactor** | devices you do not have | **found in the ground**, then the Outfitter improves them |

Nothing about the second column is buyable until it is found. That is "most of
the upgrades are hidden for now", and it is hidden for a reason the player can
state: *I have not found one yet.*

### Where they are, and when

One per device, buried like the relic and the drive component are - a hashed
cell on the world rather than a roll against the ore stream, so a schematic
never loses a coin flip to a cave and never eats a roll another generator was
using. Its own seed offset, 257, registered with the rest.

Two gates decide what can be down there: the **leg** it first appears on and the
**depth** it is buried below, which is the `unlock` depth the row already had.

| device | from leg | below | what the first world holds |
|---|---|---|---|
| Salvage Magnet | 0 | 20 m | yes |
| Deep Survey | 0 | 35 m | yes |
| Seismic Charge | 0 | 40 m | yes |
| Reactor Core | 1 | 50 m | |
| Repair Drone | 1 | 60 m | |
| Autopilot | 2 | 65 m | |
| Cutting Laser | 2 | 90 m | |

Leg 0's core is at 58 m, so the first planet holds exactly three of them, at 20,
35 and 40 metres - which is his *"introduce some of the other power ups later as
you make it further into the first planet"*, arriving at three separate moments
of one descent rather than all at the surface. Everything past that arrives with
a new world, which is his *"possibly after unlocking new planets."*

**Missable, but never lost.** Leave one in the ground, break the core, and it
comes back on the next world at a new position, because the candidate list is
"everything not yet found whose leg has come". That is deliberately kinder than
the relic. A relic is a trophy and losing one is a story; a device is a verb,
and a save that can permanently lack a verb is a save that got worse by
accident.

### The moment itself

A crate in the rock, lit, obviously not ore. Break it and a banner slides in for
four seconds carrying three things and nothing else: what it is, one line of
what it does, and that it is fitted. No tap, no pause, no modal - the drill keeps
turning. Then it is on the ship, at level one, for free, and the Outfitter has a
new row.

The free first rung is the reward for the dig. It is worth 33,300 credits across
all seven, spread over hours, and it is paid for by the fact that none of those
seven can be bought at all until the rock gives them up.

## The room: four aisles, one at a time

Four departments, each with its own bay in the room, its own sign, and its own
camera station. Swipe or tap an arrow to move along the forecourt; the camera
glides. Never more than five cases in a shot.

| aisle | holds | lit in |
|---|---|---|
| **RIG** | drill, cargo, thrust, magnet | brass amber |
| **LIFE** | tank, hull, tow, cool, drone | hot magenta |
| **SURVEY** | scan, survey, auto | cyan |
| **ORDNANCE** | bomb, laser, reactor | violet |

Ordnance is **entirely** found. Until you dig up your first charge, that aisle
is dark and unlit and the swipe passes it by - and the first time you dock after
finding one, the shop opens on that aisle with its sign coming up. A whole
department lighting for the first time is a better reward than a row appearing
in a list.

This is also the honest answer to his read of the three console bars: *"this
normally signifies different categories of gear."* He is right that coloured
lights in a row mean categories, and the room was using them for claim strain,
depth and stock. The bars become the aisle indicator - one per department, in
the department's colour, the current one burning and the rest idle - which is
both the dot row the research demands and a fitting rather than an overlay.

**The ship stops sharing a shot with the shelf.** It is parked at the pump, and
the pump is the forecourt station at one end of the sweep. Buying something cuts
the camera to it for a beat so you see the part go on, then returns. That is a
better feedback moment than a static ship behind the stock, and it is what
finally kills the occlusion instead of nudging it.

## The look: one identity per role

The blend rule, and it is the finding that makes the three styles survive being
in one room: **do not mix them on a surface, give each a job.**

- **Steampunk is the room.** Brass, copper and riveted iron are what the
  building is made of - the counter, the pump, the pipe runs, the gauges with
  real needles, the valve wheels. It reads through silhouette and albedo and
  costs no lights at all, which is why it can be everywhere.
- **Cyberpunk is the light.** Magenta and cyan, the sourced pair, rationed
  against a warm brass base - accents that cut through, never a wash. Two or
  three of the seven lights are warm filament practicals, two or three are the
  cool signage accents.
- **Matrix is the information, on exactly one surface.** The terminal behind the
  counter: phosphor green on black, monochrome, code falling down it, drawn to a
  canvas at twelve frames a second with scanlines in the texture. Nothing else
  in the room is allowed that green.

And the tubes get the fresnel proxy, because an emissive material with no bloom
behind it is a bright line and this renderer will never have bloom.


## S7: the kit becomes a discovery too

From his read of 0.28.0:

> *"The 6 upgrades at the bottom feel out of place and are too big of an
> advantage to just purchase. Can you remove all 6 of the upgrades from the
> bottom of the page. Make it so you have to find them as you dig, then after
> you find them, you can upgrade them. They will only show up in the shop after
> they are found. A secret display case at the bottom of the screen pops open
> and shows all of the upgrades you have collected and lets you purchase the
> upgrades there."*

Both halves right, and the second is the sharper one. A Bulwark Field absorbs
three impacts outright and was on sale to a first-hour player for money they
would have in ten minutes.

**The mechanism was already in the ground.** Supply caches have been buried on
every world since the game had caches, and opening one already handed over a
consumable. The only thing missing was the consequence: the first one of a kind
you are given is the one that teaches the Outfitter it exists. So a cache now
prefers something you have never held, and the kit fills in as a by-product of
playing rather than as a second hunt - deliberately softer than the devices'
gate, because two gates of the same hardness would make the first hour a
scavenger list.

**The drawer.** A brass front in the counter with a handle, which drops on a
hinge while a lit shelf slides out. Three things make it read as a drawer
rather than a panel that appears: the front hinges rather than fading, the
shelf slides while it does, and the inside is dark until it opens. One drawer,
moved to whichever counter is in frame, for the same reason there are two
roaming lights rather than eight.


### What the measurements missed again, and what caught it

Three faults, three different detectors, and the pattern is the same as S1-S5.

**Two rows of three does not fit.** Measured: the drawer has 117 px of band
between the counter cases and the tray, and two rows of crates with plates want
about 160. They overlapped each other and ran under the tray. One row of six,
read by coloured lid and four-letter code, with the card expanding whichever
one you tap.

**The counter's light and the drawer wanted the same sixty pixels.** The strip
was on the counter's front lip, which is where a drawer is; the brass front
came out with a bright coloured bar through the middle of its label. It moved
under the counter TOP, which is where the light is on a real display counter
anyway - lit glass above, dark drawers below.

**A fitting's brightness is a function of its distance from the lens.** The
same tube and the same settings read as a neat lit line on a wall four metres
back and as a full-width glare at the counter: 3.2 units at that distance is
about 880 screen pixels, wider than the phone. Fittings take a `glow` scale
now.

And three bugs that only a running browser could show: a circular import
between `ui.ts` and `input.ts` that presented as "Cannot access 'k' before
initialization" with the shop simply never opening; a projection 97 px out
because the station camera is not a child of the station scene, so updating the
scene leaves the camera's matrix stale; and a test helper calling `advance()`,
which stops the clock and never gives it back - the game froze with the mode
still 'play' and the key still held, which is about as misleading as a symptom
gets, and is the trap already written down beside `startClock`.

## What the numbers missed, and the screenshots caught

Worth writing down, because it is the same lesson twice and it is about the
harness rather than about the room.

A measurement harness was built for S1 that projects every case into screen
pixels and compares it against the tray. It found the real fault immediately -
the room was composed for the whole canvas while the tray covered 40% of it -
and it was right about that. Then it passed a layout in which two of the five
plates were half off the edges of the screen.

**A case is not a point.** The harness measured projected CENTRES against a
24-pixel margin. The plates are 136 pixels wide and the outer centres were 133
pixels from the middle, so both hung over the edge while every centre was
comfortably inside. The same blind spot passed a Matrix terminal a third of
which was off the left edge.

Five more things only the screenshot could say: the light pool under the
counter was sized off the tube's LENGTH in both axes and threw a pink fog over
the whole counter; the imported wall panels are a metre tall and sit on the
deck, so the rack and the sign floated in pure black with nothing for a light
to land on; the ambient was left at a workshop's 1.15 and drowned every neon in
the room; the selection panel behind each case was a hard-edged rectangle
visible on all five at once; and the aisle name was printed by the DOM directly
on top of the 3D sign already saying it.

The rule this earns: **a harness that measures positions cannot judge a
composition.** Keep both. The numbers say what is provably wrong and the
picture says what is actually wrong, and this round needed six passes of the
second after the first had gone green.

---

# Round seven: fuel is the game, and a prize is rare

Written 2026-09-10 against v0.29.0, from his own brief:

> *"I dont want towing to be a thing. if you run out of gas, you should game
> over. I want digging to cost a much larger amount of fuel than just flying, so
> that when you get close to running out of fuel, you have a better chance of
> getting back safely. when you get close to running out, make it obvious that
> you are in danger and make the fuel flash red. I want there to be way less
> special resources to show up so it actually feels like a prize when you get
> one. you only start seeing new resources when you get really deep and even
> then they are rare."*

Four asks, and three of them are one system: **fuel has never actually been a
constraint, and the tow is why nobody noticed.**

## What is measured, before anything is designed

### 1. Fuel stops binding exactly when the stakes rise

A full tank, against cells of the hardest rock at that depth, at a player
plausibly kitted for the leg:

| leg | core | tank | fuel per cell of basalt | climb home | **cells a tank buys** |
|---|---|---|---|---|---|
| 0 | 58 m | 90 | 5.02 | 15 (17%) | **14** |
| 5 | 298 m | 250 | 1.05 | 41 (16%) | **199** |
| 11 | 586 m | 450 | 0.53 | 50 (11%) | **760** |

The Drill divides the cost of a cell and the Tank multiplies the supply, and
the two compound. By the end of the ladder a tank is seven hundred and sixty
cells of the hardest rock in the game, which is not a resource, it is a
formality. His *"digging should cost a much larger amount of fuel than just
flying"* is the right instinct aimed at the wrong half: **per cell, digging
already costs six times a metre of flight. What it does not do is stay
expensive.**

The fix is not a bigger number. It is to charge fuel per CELL rather than per
SECOND, so the Drill buys speed and never efficiency.

### 2. The climb home was always affordable, and never shown

The rightmost column above is the good news: getting out costs 11 to 17% of a
tank from the deepest cell in the world, at every stage of the game. His
instinct - *"you have a better chance of getting back safely"* - is already
true and has never once been communicated, because a tow meant it did not
matter.

That is what makes death fair enough to ship. The gauge can tell you exactly
what the climb costs, because the game can compute it.

### 3. The rarest thing in the game is the fourth most common

`chance` in the ore table is not a probability, it is a cumulative threshold:
`blockAt` walks ORES deepest-first and takes the first whose `chance` the roll
falls under. So each ore's real share is the gap to the next one up - and the
deepest ore, tested first, keeps its whole number.

Measured, per cell, at depth:

| depth | total ore | what is in it |
|---|---|---|
| 10 m | **10.0%** | copper 10.00 |
| 60 m | **10.0%** | amethyst 5.50, gold 0.50, silver 1.00, iron 1.50, copper 1.50 |
| 250 m | **10.0%** | **solmarrow 2.10**, umbrite 0.50, coreite 0.40, magmite 0.80, ruby 0.40, emerald 0.60, amethyst 0.70, gold 0.50, silver 1.00, iron 1.50, copper 1.50 |

Three things are wrong and all three are his complaint:

- **One cell in ten is ore, at every depth in the game.** Going deeper never
  makes a find rarer or commoner, it only changes which one. There is no
  scarcity curve at all.
- **Solmarrow is worth 132,000 and turns up at 2.10%** - four times as often as
  Umbrite at 54,000, five times as often as Coreite. The whole deep tier is
  ordered backwards.
- **Adding a deeper ore steals from the one above it** rather than adding
  density, which is why the table has quietly flattened as it grew.

### 4. Every world shows you almost everything

`coreDepth(leg) = 58 + leg * 48`, and the ore gates are at 4, 11, 22, 36, 56,
78, 105, 145, 185, 210, 245 m. So the first world, 58 m deep, already contains
copper, iron, silver, gold AND amethyst. Five of the eleven materials in the
game are on the tutorial planet. *"You only start seeing new resources when you
get really deep"* is not a change of degree; it is the opposite of what the
table does now.

## What the research settles

**Nobody wipes the save.** Not one comparable game destroys its meta-progression
on a single failed run - permadeath modes wipe a *run* or a *character*, never
the unlocks. The penalty that reads as real stakes without producing quitting
is consistently: **the run's take is lost in full, and nothing permanent is
touched.** SteamWorld Dig takes half your gold and drops your loot; Deep Rock
leaves you 25% of a failed mission; Subnautica takes only what you were
carrying.

So **"game over" here means the hold, the run and the ship - and nothing else.**
Credits already banked, every upgrade level, every relic, every drive component
and the world itself all survive. That is already harsher than any of the games
above, and it is where I am drawing the line: taking the upgrade ladder would be
the one decision no shipped game in this genre makes.

Two findings underneath it are worth more than the verdict:

**Motherload does exactly what he asked for.** Run the tank dry and the digger
explodes - game over, no rescue. And *Super Motherload* sells the rescue back as
a premium panic button: a cheap teleporter that can malfunction and kill you,
and an expensive one that always works. The Lattice has been shipping the sequel's
panic button as the default outcome.

**Which means the Fuel Cell is promoted, not replaced.** The consumable that
burns 35 fuel straight into the tank has been a minor convenience. With no tow
it becomes the thing that saves your life - and it is now something you have to
find first. No new mechanic needed; an existing one stops being decoration.

**The Point of No Return is the name for what he described.** It is the aviation
term for the moment you no longer carry the fuel to return, and the design
commentary is explicit that *it only works as tension if the player can compute
it*. That is the piece The Lattice is missing - not a bigger fuel cost, a visible
reserve.

**The warning has sourced numbers.** One continuously escalating cue per
resource rather than two discrete pops (Deep Rock keeps oxygen and health on
different sound identities so they can never be confused). Dead Space switches
colour at 75 / 50 / 25%. Subnautica's first oxygen warning is at about 40%
remaining. Haptics belong only in the last seconds - a constant buzz goes numb.
And the hard limit: **never more than three flashes a second, under 25% of the
screen, no sequence longer than five seconds** (WCAG and the Game Accessibility
Guidelines agree).

**Rarity should come from depth, not from a low roll.** The one sourced
mechanism is Motherload's: a material does not exist above its floor depth, so a
player who does not go deep never rolls for it at all. That avoids the failure
mode where a rare thing "could have dropped an hour ago" and the hunt becomes
grinding. And the moment itself wants the withheld-then-revealed treatment: a
distinct sound and colour beat at the reveal, not a background particle nobody
catches.

---

# The build

## F1. Fuel is charged by the cell, not by the second

The measurement says the ratio is not the problem - per cell, drilling already
costs six times a metre of flight. The problem is that the ratio **decays**: the
Drill divides the cost of a cell, the Tank multiplies the supply, and by leg 11
a tank is 760 cells of basalt.

So fuel is charged against PROGRESS THROUGH THE CELL rather than against time
spent drilling:

```
FUEL_PER_CELL(hard) = FUEL_CELL_BASE + hard * FUEL_CELL_PER_HARD
```

billed pro-rata as the cell is chewed, so a half-dug block costs half. **The
Drill now buys speed and never efficiency**, which is what keeps the constraint
alive at every level. A partial dig is charged fairly, which the per-second
model also did and which a charge-on-break model would not.

Flying is untouched: 0.8 a second, and the whole point.

## F2. The reserve is on the dial

`fuelHome()` walks the actual route back with the existing BFS - not the depth,
because a tunnel is not a straight line - and converts it to fuel at the ship's
current speed. From that, one ratio: `fuel / fuelHome`.

- **above 2.2** clear
- **2.2 to 1.5** amber, and the readout names it
- **1.5 to 1.0** red, pulsing at 2 Hz, an escalating tone, a vignette
- **below 1.0** you can no longer get home, and everything says so

The dial gets a **red band that MOVES**: the reserve you need is drawn on the
fuel gauge and grows as you descend, so you watch the arc you cannot spend eat
into the tank. That is the Point of No Return made visible, which the research
says is the only way it works at all.

Flash rate 2 Hz, the vignette under a quarter of the screen, no sequence past
five seconds - the accessibility limits are hard numbers and they are cheap to
respect.

## F3. Running dry kills you

Both zeroes kill now, fuel and hull. The ship is lost with everything in the
hold. A proper death - the ship breaks up, the screen goes, and a card says what
happened and how deep.

**Tow Insurance is deleted.** It is an upgrade whose entire subject no longer
exists. Anyone who bought a level gets **every credit they spent on it back**,
once, on load - which is the honest thing to do about deleting something
somebody paid for.

In its place, on the same axis the round is about: **the Scrubber**, which cuts
the fuel a cell costs. The survival group gets a real ladder on the game's new
central resource, and the shelf keeps fifteen rows.

## F4. Ore, re-tabled

Rarity comes from depth first, as the research says, and from the roll second.

The ladder spans **eight worlds instead of five**, so a new material arrives
roughly every planet: copper and iron on the tutorial world, and Solmarrow not
until 372 m, which is planet 7. And the deep tier's shares are inverted back the
right way round, so the most valuable thing in the game stops being the fourth
most common.

Total ore density drops from a flat 10% to about 5%, and the top four materials
go from 0.4-2.1% to 0.10-0.25%.

That halves mining income, so **the values and the ladder are re-tuned against
the econ probe rather than guessed** - which is what it is for.

## F5. A first find is an event

The first time you ever cut a given material, the game stops for a beat and
tells you what it is and what it is worth, with the banner the devices and
supplies already use. Withheld, then revealed, then a sting that is not the
ordinary collect sound.

After that it is just ore. The prize is the discovery, not the pickup.


## What the probe says afterwards

| style | first upgrade | minutes to all ladders | payout spread |
|---|---|---|---|
| cautious | 1.4 min | 13.7 | 183 - 894 |
| greedy | 2.3 min | **21.4** | **0 - 563** |
| optimal | 1.0 min | 8.1 | 381 - 6841 |

Greedy loses the ship twice in twenty-four runs and takes half as long again to
get every ladder started. That is the whole round in one row: digging past your
reserve is now the thing that costs you, and the cautious player is no longer
the one being punished for it by a tow fee.

## What had to move with it, and why

The ore rebalance was not a table edit. Halving the ore doubled every mineral
gate without anybody choosing to - maxing the tree wanted 72 iron, about sixteen
hundred-cell runs of nothing but looking - so the requirement now grows by one a
rung and stops at four. Five upgrades changed which mineral they are built from,
because gold and amethyst went below the first world's core and an opening row
cannot ask for something that is not there yet. Prices were re-ordered so a row
that unseals deeper still costs more.

And the frozen world reference was re-recorded for the first time since it was
made - the one thing its own note always said would require it. The diff was
read first: of 15,639 cells, 11,053 changed rock band (already licensed), 841
changed ore, 574 stopped being ore and 368 started, against a deliberate density
cut from 10% to 7.5%.


---

# Round eight: one world, and a reason to be in it

Written 2026-09-10 against v0.30.0, from his own brief:

> *"I like how a lot of it is feeling but it still feels like there is a main
> component missing. can you redesign how the main overall objective works? I
> want to stay on one plannet for much longer. find more secrets, random caves,
> and other things to make the planet feel mysterious and intriguing. I want the
> entire game to be based around one planet ... I dont want to just try to dig to
> the bottom. can you fully redesign the main objective into something closer to
> dome keeper but unique. I want to remove the buildings or redesign them
> visually and their purpose. redesign the ship to look more steam punk and
> unique. redesign the blocks for a more interesting stylized feel."*

## What is actually there today, before anything is designed

An honest inventory, because most of this round is deciding what to keep.

| system | what it is | fate |
|---|---|---|
| fly and dig | 13 columns, a fixed side camera, one block at a time | **keep** |
| fuel as life | run dry and the ship is lost; the climb home is drawn on the dial | **keep** - this is round seven and it works |
| heat / gas / tremors | a heat line at 66% of the core, gas pockets, quakes that collapse tunnels | **keep**, re-tuned to a bigger world |
| ore ladder | 11 materials gated over eight planets' worth of depth | **becomes strata** |
| 15 upgrades, 6 consumables, 7 devices | the shop, the drawer, the crates in the ground | **keep** |
| **the star chart** | pick a destination, fly between planets | **cut** |
| **planet traits** | 5 traits that bend hazard rates and rules | **becomes regions** |
| **12 palettes** | a colour identity per planet: rock, fog, haze, growth | **becomes strata** |
| **coreDepth(leg)** | 58 + 48 per leg; the world gets deeper each hop | **cut** - one fixed, much larger world |
| **the Jump Drive** | 5 components, one per trait, across many worlds | **cut, and replaced** |
| **relics** | one buried artefact per planet, a permanent perk | **becomes one per region** |
| **the Heart** | the final world; breaking its core wins | **becomes the thing under this world** |
| **the claim** | 3 surface buildings that accrue strain; damage is a discount | **cut, and replaced** |
| caves | 2x2 blobs, 3-9% below 26 m | **kept and massively expanded** |
| geodes, gas pockets, caches | one-cell events on their own seeds | **keep** |

## Two facts about the code that shape what is cheap and what is not

**The multi-planet structure can fold inward.** Twelve palettes, five traits and a
per-leg core depth are already a description of twelve different places with
different rules and different rock. They were spent on twelve worlds you visit
one at a time. Spent instead on twelve REGIONS of one world, they are most of a
large, varied planet for almost no new code - the palette applies to a depth
band rather than a save slot, and a trait bends the rules of a region rather
than of a visit.

That is the single biggest lever in this round and it is nearly free.

**There is no map. Of anything.** Not of the tunnels you have dug, not of where
you have been, not of what you have found. That is survivable in a game whose
world is 58 metres of straight-down and fatal in one that is meant to be wide
and mysterious. Whatever else this round does, it has to answer that.

**The world is 13 columns wide, and widening it is NOT just a constant.** The
generator is fine - `rnd(x, d, planet)` is seeded per cell, so columns 0-12
generate exactly as they do now and anything added is new ground, which the code
already says in a comment. The RENDERER is the problem: `syncBlocks` streams a
window of rows around the ship (`row - 13` to `row + 15`) and then walks
`for (let x = 0; x < W; x++)` - the full width, every rebuild - and every
instanced pool is allocated at `WINDOW_ROWS * W`.

So at 60 columns each of about eighteen pools allocates 1,740 instances instead
of 377, and every rebuild touches five times the cells. The streaming window has
to gain a horizontal axis: a column range around `g.px`, a rebuild triggered by
crossing a column as well as a row, and `MAX_CELLS` sized off the window rather
than off `W`. That is contained, it is real work, and it is much cheaper to find
now than halfway through the build.

**The ship is coded primitives.** A box hull, a cone cowl, four struts, two
fins, a cylinder auger, a cone cab. Nothing is imported and nothing is fixed in
place by geometry, so a redesign is a rewrite of one file rather than an asset
hunt.


# What the research settled

**Dome Keeper's own developer made this exact pivot, and said why.** The
original win condition was "reach the bottom of the map." René Habermann called
it *"seriously flawed"* and wrote, in February 2022:

> *"I'm mostly thinking about searching a special underground location and to
> recover something from it. So you'd still need to dig down, but it's not sure
> where to and it will also need some time to recover."*

That shipped as Relic Hunt mode. **"I dont want to just try to dig to the
bottom" is the same conclusion the designer of the game he is pointing at
reached about his own game.** This round is not a guess.

**And the criticism to design against is specific.** Dome Keeper's content
ceiling is about ten hours - "at the ten-hour mark many players will have seen
the breadth of its unlocks" - and Eurogamer's read is that its two phases feel
*divided*, competing for attention rather than fusing. So: do not alternate
mining and something-else. **Fuse them.** The Lattice already has the material for
that, and it is not combat.

Five devices make one map last, and four of them survive procedural generation:

- **Ability gating.** Hollow Knight's rule is "each key only opens a few locks" -
  new tools open things you have already SEEN and could not pass. Backtracking
  with a new tool is itself content, and it costs no new world.
- **World-state flags.** A region marked sealed, collapsed or active changes
  meaning without changing its geometry.
- **A world-changing event that recolours the map you already have.** Terraria's
  Hardmode retroactively edits the existing world rather than generating new
  space. The research calls this the strongest procgen-friendly longevity device
  there is, and it is nearly free.
- **Authored set-pieces dropped into procgen.** Spelunky stitches hand-made room
  templates; Noita drops hand-placed structures into a generated world. This is
  the one way to get authored mystery into a seeded world.
- **Knowledge as the unlock** (Outer Wilds) - needs a journal to work at all.

The one that does **not** translate is Animal Well's layered secrecy: it is
seven years of hand placement. It needs procedural *slots* for authored content
instead, which is the Noita answer above.

**And the failure modes are named.** Mystery becomes emptiness when templates
repeat often enough to be recognised, when there is no map to track partial
progress against, or when too many unexplained hooks are open at once. Animal
Well's author: *"it can be overwhelming to walk into a room and see six doors."*

**A base earns stakes two ways.** Dome Keeper's dome can be damaged and lost.
Subnautica's base has an *internal* failure mode - it consumes power and most
bases are lost to their own hull integrity, not to attack. Deep Rock's rig is
the anti-pattern: organisationally rich, in no jeopardy at all, which is what
the current three buildings are. SteamWorld Dig adds the third thing worth
stealing: the town visibly grows at underground milestones, so progress reads
from the surface without opening a menu.

---

# The design

## The planet is not a resource. It is a ruin, and it is waking up.

One world. You are not the first here, and the thing you are standing on is not
inert.

### The objective: the Lattice

Buried across the whole planet - spread **wide** as much as deep - are
**Anchors**: parts of a structure that predates you and is still, barely,
running. There are nine.

Lighting an Anchor does three things, and the third is the point:

1. it pushes the **Unrest** back in its region
2. it reveals that region on your map
3. **it wakes the planet a little more**

The ninth opens the Vault at the centre, which is the end of the game.

This is the recovery pivot, and it is not a race down a line: an Anchor's
location is not known in advance, several are behind things you cannot open
yet, and the map is how you hunt.

### The pressure: Unrest, and it is the planet

Dome Keeper alternates digging with fighting, and its own reviews call that
division its weakness. The Lattice already has the material for a version that
**fuses**: cutting the world raises strain and the ground answers with tremors.

So strain grows up into **Unrest**, and it belongs to the planet rather than to
a building. Everything you cut raises it. It drives the tremors that already
exist, and past thresholds it does worse. **There is no second phase** - the
pressure is applied to the thing you are already doing, which is the fusion the
research says Dome Keeper never got.

And it is the mystery, not a meter with a monster behind it. The rules are
withheld: you learn what Unrest does by watching it, the way Rain World teaches
its hazards.

### The surface: one thing, with a stake

The refinery, the derrick and the store shed are cut. Three buildings whose
damage was three discounts is exactly Deep Rock's rig - rich-looking, no
jeopardy - and he is right that it is not a system.

In their place, **the Ballast**: a steampunk pressure-station standing over the
pad, and the only thing holding the planet quiet.

- **It decays on its own**, faster as Unrest rises. That is Subnautica's
  internal failure mode, which is the one that actually kills bases.
- **You feed it ore.** Not spend - feed. The hold is now two decisions: what is
  worth money and what is worth keeping the ground still.
- **If it empties, a region collapses.** Not a discount: you lose access to
  somewhere until you re-stabilise. That is Dome Keeper's stake.
- **It visibly grows a tier with every Anchor lit.** That is SteamWorld Dig's
  legible progress - the surface tells you how far through the game you are
  without a menu.

### The world: regions, not planets

Twelve palettes and five traits already describe twelve places with different
rock and different rules. They were spent one at a time on twelve worlds. Spent
instead on **regions of one world** - laid out across width as well as depth -
they are most of a large, varied planet for almost no new code.

Volatile ground riddled with gas. Hollow ground that is more cave than rock.
Crystalline seams. The Searing deep. Each with its own palette, its own rules,
its own Anchor.

### The mystery: authored rooms in a seeded world

The Noita and Spelunky answer, which is the only one that works in procgen: a
small library of **hand-authored vault templates** dropped at seeded, rare,
region-appropriate slots. Worked stone rather than generated rock, so you know
one when you see one.

- **sealed vaults** you can see through and cannot open until you have the tool -
  the locked door with no visible key
- **the previous expedition**, told without text: their equipment, their
  tunnels, where they stopped
- **the deep quiet**: rooms that contain nothing at all, which is what makes the
  ones that do matter

Against the named failure mode - templates you start to recognise - the library
is small but the *contents* are seeded, and most of them are rare enough that a
first playthrough sees a fraction.

### The map, which is not optional

There is no map in this game of anything. That is survivable in 58 metres of
straight-down and fatal in a world meant to be wide and mysterious - and every
mystery device the research names needs one to work.

So: a map that fills in as you dig, marks what you have found, marks what you
have found *and not understood*, and shows Unrest by region. It is the journal
too, because "not yet understood" has to read as a tracked goal rather than as
confusion.

### The event that recolours everything

The single strongest longevity device the research found, and it costs almost
no content: at a threshold - the fifth Anchor - **the planet answers.** Unrest
steps permanently, a hazard appears in ground you thought you knew, and
something new grows in old rock.

The map you have filled in becomes unfamiliar. Terraria does this with
Hardmode, and it is the cheapest possible way to make a known world strange
again.

## What this does to the session

Sessions stay what they are: dive, dig, return, spend - self-contained, no
penalty for leaving, which the mobile-pacing research is firm about. The
campaign - map coverage, Anchors, Ballast tier, Unrest - persists quietly
between them and is re-stated in one line when you come back, because the
research is equally firm that a phone game must never ask you to remember where
you were.


# The look

## The ship, designed at thirty pixels

The research is blunt about this and it overturns how I would have gone at it.
**At 30 px only things that break the OUTLINE survive.** Rivets, gauges, valve
dials, portholes, individual pipes and brass-versus-iron all vanish - a 2-3 px
brass trim band is not a colour, it is noise. Brass only reads at play scale if
it covers a whole hull panel.

What survives the squint test, in order of efficiency:

- **a chimney or stack** - a vertical cylinder breaking the roofline is the
  single most efficient steampunk signal there is, because it changes the
  outline rather than the surface
- **a boiler bulge** - a barrel-shaped body segment distinct from a flat hull
- **asymmetry** - steampunk craft are almost never symmetric front-to-back the
  way sci-fi ships are, and a symmetric hull reads as "generic vehicle"
- **one big spoked wheel**, if it is 15-20% of ship height or more
- **negative space** - an open under-frame, a gap between hull and a jutting
  pipe. Gaps read as strongly as filled shape at distance and cost nothing

And the rule that decides the rest: **one dominant feature, not several.** The
TF2 principle - one unmistakable shape cue, everything else deliberately plain
so the eye lands on the one thing.

So the ship is designed twice, on purpose, which is what the two scales
deserve:

- **the silhouette**, authored at 30 px against the tunnel and judged blurred:
  an off-centre stack, a boiler bulge under the cab, an open under-frame, the
  auger still leading. Asymmetric front-to-back.
- **the greeble**, which only exists because the Outfitter shows the ship at
  full screen: rivet rows, a brass boiler band, a pressure gauge on the flank,
  a valve wheel, a porthole cab.

And it is TESTED at 30 px rather than judged in the shop, which is where every
previous ship pass in this repo went wrong - the drill tier that "did not read"
and had to become spark count was this same mistake.

## The blocks: break the grid, not the texture

The complaint is that blocks feel plain, and the instinct is to add texture.
The sourced answer is the opposite: **vary the geometry and the phase, not the
surface.** Four changes, and three of them are free at runtime.

**Per-instance rotation and scale jitter.** A quarter-turn snap (90, 180, 270 -
which keeps normals and UVs sane on a cube) and a 10-20% scale wobble, written
into the instance matrix once at generation. Zero draw calls, zero per-frame
cost, and it is the standard fix for "obviously a grid".

**Two or three chamfered block meshes per material, swapped by index.** A
bevelled cube stops reading as a cube, and the cost is in the source mesh
rather than in the shader. There is no CC0 kit for this - a bevelled cube is
cheaper to model than a licence is to vet - so it is a handful of lines of
geometry.

**Irregular band boundaries.** Right now a rock band changes at an exact
horizontal metre, which is the most artificial line in the game. A seeded
offset per column turns every stratum boundary into a ragged seam, and Deep
Rock's own technique is exactly this shape: define the large forms irregularly,
then let surface variation fill in. Large-scale irregularity does more than any
amount of per-block noise.

**Sparse decals for cracks, veins and moss**, in one instanced batch rather
than in the shader - placed irregularly and rarely, because uniform decoration
reads as texture and rare decoration reads as detail.

Skipped, deliberately: vertex displacement and true face-blending between
neighbours. They want either a compute step or per-vertex neighbour lookups,
and they buy the least per unit of cost of anything on the list.

## Reading a dark tunnel with no post-processing

Ranked by what they buy per unit of cost, which is the only ranking that
matters with no bloom, no SSAO and no colour grading:

1. **Baked ambient occlusion at the seams**, darkened into the per-instance
   colour the bands already use. One bake, no runtime cost, and it is the
   single cheapest thing that makes a wall look solid rather than printed.
2. **Rim light as a shader term**, not a pass - one dot product of view against
   normal in the forward shader. It puts a lit contour on the edge of every
   block and on the ship, which is the half of bloom that actually matters
   here.
3. **Fog**, which the game already has, tuned per stratum.
4. **Value separation**: the tunnel dark, the rock mid, the ore and the ship
   bright. Value carries the read; hue count does not.

## The one number to respect

Mobile GPUs are commonly cited as struggling past about **100 draw calls**, and
this game's budget is already 150. That is a ceiling to stay under, not a
target to grow into - so the decals ride one instanced batch, the block
variants ride the pools that already exist, and nothing in this section adds a
draw call.


## Milestones

Ordered so each one ships and is playable, and so the two that are pure
presentation come early - they are the ones you can judge fastest, and they are
independent of the objective work.


## What I am deliberately not doing

**Not adding combat.** Dome Keeper's own reviews say its two phases feel
divided; the fusion here is that the pressure applies to digging itself. Adding
a second verb would import the exact criticism the research warns about.

**Not hand-authoring a secret world.** Animal Well is seven years of hand
placement and does not survive procgen. Authored templates in seeded slots is
the version that does.

**Not keeping the star chart.** It is a good screen for a game about visiting
places and this is now a game about one place. It comes back if the sequel does.

## The honest risk

This is the largest change the game has had - it replaces the objective, the
world's shape, the surface, and two art passes. **W3 and W4 together break every
golden test in the repo**, because they change what the world IS. That is
expected and manageable, but it means the middle of this round will have a
stretch where the suite is red by design, and I will re-record with the diffs
read rather than fixing them one at a time.

If you would rather have it in smaller bites, the natural split is **W1-W2 first
as a look pass you can judge in a day**, then the objective work as its own
round.

# Appendix: rounds one to three, as planned and shipped

Kept because the reasoning is why the game is shaped the way it is. Everything below has
shipped; the milestone list at the top is the live one.

The ask, in his words:

> "can you write out a plan to expand the game, add additional upgrades and power ups, make
> each planet feel and look different, have an overall goal besides just digging for
> resources, have the ship actually look like it is flying between planets."

Five things, and they are not five separate features. Four of them are the same feature seen
from different sides, which is what this plan is mostly about.

---

## What the game is now, and what is actually missing

The loop works. Fly down, cut rock, fill a 60 kg hold, come back up, sell, buy a rung of a
ladder, go deeper. Heat at 70 m and tremors at 85 m give depth a price. Relics give one
permanent keepsake per planet. Breaking a core destroys the planet and moves you to the next
one, which is harder and richer.

What is missing is not content. It is that **nothing above the run has a shape**:

- **Planet N+1 is the only place you can go.** There is no choice at the top level, so the
  traits — Volatile, Hollow, Crystalline, Searing — are flavour that happens *to* you rather
  than anything you can seek out or avoid. A trait you cannot choose is a weather report.
- **The planets differ by numbers, not by looking different.** Sky colours change; the rock,
  the fog, the dust and the silhouette do not. Every world is the same cave with the tint
  moved.
- **There is no reason to stop.** Shards accumulate, credits accumulate, and the honest
  answer to "why am I doing this" is "the number goes up". `CRAFT.md`: *"Money is a rung:
  every amount you earn makes the last amount irrelevant."*
- **Leaving a planet is a modal dialog.** The single most cinematic beat in the game — you
  just destroyed a world — is a box with a button.

So the plan is one arc: **give the top level a map, a goal, and a journey**, and make the
worlds on that map worth telling apart.

---

## The spine: The Drift, the Jump Drive, and the Heart

The fiction is already there and unused. You are a contracted driller working the **Verdax
Drift**. The plan makes the Drift a place you are trying to get *out* of.

**The goal: build a Jump Drive and reach the Heart of the Drift.**

The Jump Drive takes **five components**. Each one is buried on a world of a particular
trait, and only on that trait:

| Component | Found on | Trait |
|---|---|---|
| Guidance Spine | a Stable world | `stable` |
| Plasma Injector | a Volatile world | `volatile` |
| Void Resonator | a Hollow world | `hollow` |
| Lattice Prism | a Crystalline world | `crystalline` |
| Thermal Core | a Searing world | `searing` |

With all five aboard, the chart opens a route to **The Heart** — one final world, harder than
anything before it, whose core ends the game.

Why this shape and not a longer story:

- **It makes the trait the decision.** You need a Searing world, so you go looking for one on
  the chart and accept what a Searing world costs you. That is `CRAFT.md`'s *"gate an upgrade
  behind a place, not a price"* applied to the whole game rather than to one shop row.
- **It is a collection, so its value does not decay.** Three of five is a real answer to
  "what have I got".
- **It is missable, and that is the point.** Break the core with the component still in the
  ground and it is gone with the planet. `CRAFT.md`: *"Make the best reward missable."*
  Crucially it is **recoverable but costly** — another world of that trait will come round on
  the chart — so a mistake is a detour, never a dead run. A permanently unwinnable save is
  the one outcome this must not have.
- **It ends.** And after it ends, the Drift stays open: the chart keeps generating worlds, so
  the endless game people are already playing is still there, now with a completed thing
  behind it.

The component is a **second buried object**, generated like the relic and deliberately deeper
than it, with its own finder cue. It is not a relic and does not use the relic's slot: the
relic is a perk you keep, the component is a key you spend.

---

## The chart: choosing where to go

After a core breaks, instead of a modal announcing planet N+1, you get **the chart** — two or
three candidate worlds, each showing:

- name and trait, with the trait's blurb
- depth to core
- whether it is known to hold a Jump Drive component you still need
- a **transit cost in fuel**, from how far it is

Two or three, never one, and never a good option beside a bad one. `CRAFT.md`: *"Two upside
gates beat a good gate and a bad gate."* A shallow Hollow world with nothing you need against
a deep Searing world holding the Thermal Core is a real question, and the answer changes
depending on what you have.

The chart is deterministic from a seed, so a save is reproducible and the golden tests can
assert its properties — in particular the one that matters: **every trait you still need must
keep appearing**, or the run can strand itself.

---

## The transit: actually flying there

The chart choice hands off to a real sequence, not a dialog:

1. the ship lifts off the pad and climbs out of the atmosphere
2. the planet you just broke recedes behind you, in pieces
3. a starfield with real parallax, the drive lit and running
4. the destination swells, its own colour and its own sky
5. the ship descends through cloud and settles onto the new pad

It is a scene, and it is where the goal gets restated: the Jump Drive's five slots are on
screen during the crossing, so every journey shows you how close you are. Skippable after the
first time — a cutscene you cannot skip becomes a tax on the twentieth playthrough — but
worth watching once.

No minigame in it. `CRAFT.md` is clear that a mechanic which cannot be failed or optimised is
a rhythm, not a decision, and a transit minigame would be exactly that.

---

## Making the worlds look different

Right now a planet is a pair of sky colours. It should be a **palette**, applied everywhere at
once, so a world reads as somewhere else before you have dug a metre:

- **rock**: each world gets its own band colours for the shallow, middle and deep rock
- **atmosphere**: fog colour and density, haze tint, dust colour and thickness
- **sky and backdrop**: the gradient it already has, plus the parallax silhouette behind the
  tunnels
- **signature**: one thing per trait you can see from the surface —
  - *Volatile*: gas venting from the rock face, and the air is dirty
  - *Hollow*: huge open caverns, and light carries much further in them
  - *Crystalline*: crystal formations that catch the lamp and glow through rock
  - *Searing*: veins of lit magma in the deep rock, and the air shimmers
  - *Stable*: clean, cold, quiet — the control against which the others read

`CRAFT.md`: *"A threshold the player cannot see is not a mechanic"* — the same argument
applies to a whole world. Four coordinated signals, not one tint.

---

## Upgrades and power-ups

Ten upgrades now, in four groups. The gaps are specific rather than general.

**New permanent upgrades:**

| Upgrade | Group | What it answers |
|---|---|---|
| **Hull Plating** | survival | Hull is a flat 100 forever. The only survival stat with no ladder. |
| **Salvage Magnet** | rig | Ore left on the ground when the hold filled has to be re-approached one cell at a time. |
| **Deep Survey** | instruments | Ore through rock at a radius — distinct from Scanner, which is light and framing. Also points at the buried component. |
| **Repair Drone** | survival | Slow hull repair underground: turns a bad run into a long one instead of a tow. |
| **Reactor** | ordnance | Power cell ceiling and trickle rate. Ordnance currently has no ladder of its own. |

**New consumables**, on the other axis — one run, never a ceiling:

| Kit | What it does |
|---|---|
| **Overdrive** | 20 s of much faster drilling |
| **Bulwark** | absorbs the next two hull hits outright |
| **Pulse** | lights up every ore in a wide radius for 30 s, through rock |

And **field power-ups**: caches already exist as a discovery moment, and they should
sometimes hand you a *temporary* effect rather than goods — aimed, per `CRAFT.md`, at the
bottleneck you are actually in.

---

## Status

- **1. Planet identity** — shipped in 0.17.0. Twelve palettes, applied to rock, fog, haze,
  dust and the silhouettes at once. Ore keeps its own colour everywhere.
- **2. The chart and the transit** — shipped in 0.18.0.
- **3. The Jump Drive and the Heart** — shipped in 0.18.0. Components generate, are collected,
  are tracked in the manifest, and the Heart appears on the chart once the drive is complete.
- **4. Upgrades** — shipped in 0.19.0. Hull Plating, Salvage Magnet, Deep Survey, Repair
  Drone and Reactor Core, taking the shop from ten cases to fifteen. Three of the five had
  their material changed by a test before they landed: `hull` wanted iron from 11 m behind a
  45 m seal, which is CRAFT.md's *"two gates on one thing means one of them is decoration"*,
  and `drone` wanted emerald from inside the heat zone for something you buy before reaching
  it.
- **5. Consumables** — shipped in 0.19.0. Overdrive, Bulwark Field and Survey Pulse. The kit
  had three items and all three UNDID something (heat, damage, an empty tank); these buy a
  window in which the ship is better than it is, which is the axis that was missing. Bulwark
  counts impacts rather than seconds because heat soak is a drain and would eat a timer before
  the thing it exists to stop ever arrived.

- **6. Per-trait ambience** — shipped in 0.20.0. A palette is a still image; two worlds
  painted differently still behaved identically. Each trait now emits something of its own in
  the air — gas out of the walls, embers from below, glints, falling grit — and Stable emits
  nothing at all, which is what makes the others read. The timing is a pure reducer for the
  same reason everything else is: the preview browser stops `requestAnimationFrame` when
  hidden, so anything on a timer cannot be tested by eye there.

**Still open:** caches that sometimes hand you a temporary effect instead of goods, aimed at
whatever bottleneck the player is actually in.

**Wanting a playtest before anything else is built on them:** the chart's shallow/poor against
deep/rich balance, which is the central new decision and was tuned by one person looking at it;
the nine-second crossing, which may be four seconds too long by the twentieth planet; and
whether the per-trait ambience is dense enough to tell a Volatile world from a Stable one while
flying past.

Two things changed shape while building, both worth recording:

**The leg and the world had to be split.** `g.planet` was doing two jobs — difficulty ladder
and identity — and a chart offering three worlds at the same leg needs those to be different
numbers. `g.world`, `g.trait`, `g.coreOff` and `g.rich` are the chart's answer, and they all
default to the pre-chart behaviour so old saves load unchanged.

**The trait had to be stored rather than hashed.** `traitOf()` returns Stable only for planet
zero, so a Guidance Spine gated behind a Stable world would have been unobtainable for the
whole game. The chart is now the authority on what a world is, which is where that decision
belonged anyway.

---

## The way in: a title screen and a first-run intro

The ask:

> "can you create an intro screen? if it is the first time starting, make a little intro going
> through the story and objective. if the game has already been started by the player before,
> can you just have a start screen that has normal first screen options like, new game,
> continue, settings, notes."

The game currently boots straight into a ship on a pad, which was fine when the whole of it
was "dig down, sell, upgrade". It is not fine now: there is a Jump Drive to assemble and a
Heart to reach, and **nothing anywhere tells the player either of those things exists** until
they break their first core, which is an hour in.

### What the intro is for, and what it must not be

`CRAFT.md`: *"DO NOT INVENT A SYMBOL FOR SOMETHING YOU CAN SHOW."* The rule was written about
HUD elements and it applies exactly here — an intro that is paragraphs of fiction over a black
screen is the same mistake in a different costume. The game already owns a starfield, twelve
painted worlds, a ship, and a planet coming apart in pieces. The intro should be those things,
with one line of text over each.

Three hard requirements, all of them learned already this session:

- **Skippable, always.** A cutscene you cannot skip is a tax on every replay. The crossing
  needed this and shipped without it once.
- **It must state the OBJECTIVE, not just the mood.** "Five pieces of a jump drive, one buried
  on each kind of world" is the sentence the player needs; the rest is flavour.
- **It must not block the tests.** Every one of the 24 e2e specs boots into play and starts
  driving. A screen in front of that breaks all of them at once, and the fix is a dismissal in
  the shared `beforeEach` rather than a bypass flag — so the title is exercised on every run
  instead of being the one path nothing covers.

### The shape

**First run** (no save in `localStorage`): the intro plays immediately. Six beats over a live
3D scene, auto-advancing, tap to go faster, SKIP in the corner throughout. It ends by starting
a new game.

**Every run after** (a save exists): a title screen over the same live scene.

| | |
|---|---|
| **CONTINUE** | straight back in, and the default |
| **NEW GAME** | confirms first — it wipes credits, upgrades, shards and relics — then replays the intro |
| **SETTINGS** | the existing pause sheet: audio, restart, build stamp |
| **NOTES** | the same sheet with what's-new already open |

Settings and Notes **reuse the pause modal rather than duplicating it.** It is already the
settings screen — audio toggles, restart progress, version, run log, what's new, build stamp —
and a second copy of those controls is a second place for them to drift. It changes its
heading and its close button depending on where it was opened from, and nothing else.

### Two things it gets for free

**The AudioContext gesture.** `audioInit()` currently rides on the first `pointerdown`
anywhere, which means the first tap of the game is silent. A title screen is a tap before
anything is at stake, which is the correct place for it.

**A reason for the showcase scene to exist.** `transit.ts` already has a starfield at three
depths, palette-painted planets, the ship, and debris. The title and the intro drive the same
scene rather than a second one — so a world in the intro is drawn by exactly the code that
draws it in the crossing.

---

## Round two: the way in, the shop, and how to actually see this stuff

The ask, in his words:

> "for the intro can you make it less like a slide show and more like the ship is flying past
> planets. when the intro ends, have it fly to the planet. if you hit continue, have the ship
> take off and fly to the planet the player is currently at. If there is no saved game, make
> sure the continue button is greyed out. Also dont explain the whole story of the game. Make
> it feel more mysterious."
>
> "can you also revamp the shop? some of the words are cut off and it feels a bit cluttered. I
> want future upgrades that dont unlock until later to be hidden."
>
> "I want you to find a good way to play test and trouble shoot the game ... if there are any
> rules keeping you from doing something that could be beneficial, make sure the rule is
> actually needed ... use pre-made assets whenever you can."

---

### 0. First, a way to SEE motion - because I currently cannot

This comes first because everything else depends on it. "Less like a slide show" is a
judgement about **movement**, and every tool I have produces **stills**. I have been approving
animation by looking at single frames and reasoning about the code in between, which is
exactly the habit that cost four rounds on the lighting artefact.

**The filmstrip harness** (`scripts/filmstrip.mjs`): drive the built game under Playwright,
advance GAME time deterministically through `advance()`, screenshot at fixed intervals, and
composite the frames into **one contact-sheet PNG**. A whole sequence then becomes a single
image I can actually look at.

- Deterministic, because it runs on the tick seam - a slow machine changes nothing.
- Named scenarios (`intro`, `continue`, `crossing`, `shop`) so a repro is a command rather
  than a paragraph of set-up.
- Console errors collected and printed with the sheet. Three separate bugs this session were
  sitting in the console and were found by eye instead.

*Challenges.* Compositing without a new dependency - `sharp` is not in the repo and ASSETS.md
says to install it in a scratch directory rather than depend on it. The answer is to composite
**in the browser**: hand the screenshot buffers back into the page as data URLs, draw them into
a canvas grid, read one PNG out. No dependency, and the page is already open.

The second challenge is the one that keeps biting: under the dev server a dynamic `import()`
resolves to a **different module instance** than the one the loop is running, so the harness
drives everything through the `?debug` seam and never through an import.

---

### 1. The intro: a flight, not a slide show

It is currently six discrete *shots*, each easing its planet in from nothing. That is a slide
show with a dissolve, and it is a fair description of what is wrong with it.

**The rework:** one continuous flight. Planets sit along a line ahead of the ship, the ship
moves forward at a constant rate, and each world approaches, passes to one side and falls
behind. Captions fade over the top, **decoupled from the visuals**, so text changes without
anything cutting.

**The landing.** The intro and CONTINUE end on the same shared sequence: the destination grows
until it fills the frame, the ship pitches toward it, atmosphere washes the screen out, and the
game is there. Shared deliberately - "fly to the planet" is the same event either way, and two
copies would drift.

- **Intro** = flythrough, then land on Verdax.
- **CONTINUE** = take off, then land on the world you are actually on.
- **No save** = CONTINUE greyed and inert, not hidden. He asked for greyed and he is right: an
  absent button tells a new player nothing, a greyed one says "this is where your game will be".

**Mysterious, not explanatory.** One of the six beats explains the core loop, which the player
is about to be taught by playing it. Cutting to five, shorter, and dropping that beat. What
must survive is the *objective* - five pieces, one per kind of world - because it is the thing
the game otherwise never says. Mystery is withholding the explanation, not the goal.

*Challenges.* The existing test asserts the intro names the jump drive, five, the Heart, and
where the pieces are. A shorter script may drop a word, and the test has to be re-aimed at
*the objective survives* rather than *these four strings appear* - the literal-versus-property
mistake, which I have already made twice this session.

---

### 2. The shop: fewer things, bigger, nothing cut off

Three faults, and only one of them is layout.

**Words cut off** has an exact cause: `drawPlate()` calls `fillText` at a fixed 62 px with no
width limit on a 512 px plate, and "SALVAGE MAGNET" does not fit. Measure and shrink to fit,
rather than shortening the names.

**Cluttered** is the count. The shop went from ten cases to fifteen without the room changing,
and five of the fifteen are things you cannot buy yet.

**Hiding locked upgrades** runs straight into a rule:

> `CRAFT.md`: *"Locking shop stock behind 'deepest ever reached' is the cheapest structural
> progression available, and it should be shown, not hidden: a row that says 'Sealed until
> 90 m' is a reason to go deeper. A hidden row is nothing at all."*

**That rule is right about the next gate and wrong about all of them.** A case reading "Sealed
until 90 m" when your best is 78 m is a reason to go deeper. The same case when your best is
12 m is furniture: it cannot be planned toward, it is five rungs away, and it is one of five
crowding a phone screen. The rule was written at ten upgrades and two gates; at fifteen and six
it stopped being true and nobody noticed, because it was being applied rather than measured.

**Correction: show the NEXT sealed upgrade, hide the rest.** That keeps everything the rule was
defending and removes the clutter. `CRAFT.md` gets updated rather than worked around.

**Layout.** With the far cases gone the count is dynamic - about eight early, fifteen late - so
the room lays out from the count rather than from a fixed table: two columns while eight or
fewer fit, the back rack added above that. Fewer cases also means each can be bigger, which is
most of what makes a plate readable.

---

### 3. Pre-made assets, where the rule says to use them

ASSETS.md's rule is a **measurement**, not a preference: *"Import what the player reads at its
real size. Model in code anything that is thirty pixels tall and judged on silhouette"* - and,
added later, *"over about two hundred pixels and permanently on screen, import."*

Applying it rather than skipping it: **the planets in the intro and the crossing are two to six
hundred pixels tall and on screen for the whole sequence.** They are untextured spheres, which
is a large part of why the intro reads as coloured balls sliding about. That is squarely on the
import side of a rule I have been half-reading.

**One rock normal map from ambientCG**, about 45 KB, on the planet sphere - and, per the rule
that lets a photographed texture into a stylised game at all, **the normal only, never the
colour map.** Each world keeps its palette colour and gains relief and a real terminator.

*Challenges.* The download is a 9 MB zip for one 45 KB file and `sharp` is not a dependency -
both already solved in ASSETS.md, via a scratch directory and `npx`.

**Audio stays synthesised**, and not out of habit: ASSETS.md records that both CC0 audio
libraries need a browser session or an API key and are unavailable unattended, and this score
mixes by depth, danger and zone off one scheduler, which a recording cannot do.

---

### 4. Rules that were wrong, and are being corrected

- **`CRAFT.md`, sealed shop rows.** Show the next one, not all of them.
- **`CLAUDE.md`, "the only binary assets are two woff2 font files".** Stale - there are three
  WebP textures in `src/textures/`, imported through the bundler. A rule that misdescribes the
  repo teaches the next session something false about what is allowed.

---

## Round three: point the ship where it is going, land it, and dress the rock

The ask:

> "can you make it look like the ship is actually flying toward the planets rather than always
> facing us in the intro and flying scenes? it should point the drill end toward what it is
> flying to. when the screen cuts from the ship flying to it being on the planet, and you have
> a short landing sequence before the player can take control of the ship? I want the ship to
> be shown lowering itself onto the landing pad right before the player takes over. I also
> want the actual dirt and rocks to change color and texture with each planet. add additional
> details like moss patches, frost, plants, oil."

---

### 1. Fly nose-first, not broadside

Right now the flight sets `rig.rotation.z = PI` and leaves it there, which points the drill up
the screen. The ship is flying "up" past worlds that are receding into the distance - two
different directions at once, and the eye reads the one it can measure, so the ship looks like
it is holding station while the scenery slides by.

**The drill has to point at the thing it is going to.** In practice that is a three-quarter
rear view: the ship seen from behind and slightly above, drill into the screen, drive toward
the camera. Which is also better-looking, because the thrusters are the lit end and they end
up facing us.

The geometry: at rotation zero the drill points at the floor - local `-Y`, because
`FACE_ANGLE.down` is 0 - so pointing it into the screen means taking `-Y` to `-Z`.

*Challenges.* `rig.rotation` is an Euler in XYZ order and it is the same node the game and the
station use, so the flight has to set it and put it back rather than assume a resting value.
And "into the screen" is not one fixed angle once the ship starts turning toward a world it is
about to land on - the descent has to rotate from the cruise attitude to a nose-down one, or
the ship arrives flying sideways into a planet. Verified on a filmstrip, because an orientation
is exactly the thing a still frame can lie about.

---

### 2. Land the thing before handing it over

At the moment the descent fills the screen with the planet's surface, flashes, and the next
frame is a ship parked on a pad with the HUD up. The arrival is asserted rather than shown.

**A short settle, in the game's own scene.** The ship comes in above the pad with the drive
lit, drops the last few metres under thrust, touches down, the gear takes the weight, dust goes
up - and *then* the controls come alive.

- A mode of its own (`settle`), because during it the d-pad must do nothing. A player who can
  fly during a landing animation will, and then the animation is fighting them.
- Two seconds at most. It happens on every crossing and every CONTINUE, and the second time
  you see it, it is a wait.
- It reuses the drop the game already has: the ship eases from a few metres up to the pad on
  the same `approach()` smoothing everything else uses, so it looks like the game rather than
  like a cutscene bolted to it.

*Challenges.* Input has to be locked without freezing the frame loop - the world still has to
render. The e2e polls for mode `play` as the signal that the way in has finished, so a new mode
in front of it lands on every spec at once; that is the third time this session, and the
answer is the same as before, drive it on the tick seam rather than the wall clock. And
`goSurface()` currently teleports the ship to the pad, so the settle has to run *after* it and
own the ship's position for its duration.

---

### 3. The ground itself, per world

The palettes tint rock colour. That is one channel, and it is why every world still reads as
the same stone under a different light.

**Three more channels, all per palette:**

| | |
|---|---|
| **roughness** | ice is smooth and catches the lamp; ash is matte and eats it |
| **relief** | how hard the normal map bites - weathered against sharp |
| **growth** | what lives, settles or leaks on the rock face |

The growth is the visible one, and it is the ask: **moss patches, frost, plants, oil**, plus
ash drifts and salt crusts to fill the twelve. One signature per world, scattered on a fraction
of rock faces, so a world is recognisable from a single wall rather than from the horizon.

Placed like the seam flecks already are - small instanced quads at `z 0.5`, in front of the
rock face and behind everything else - because that geometry is already proven and already
inside the draw budget. **One instanced mesh for all of it, not one per world**, so it is a
single extra draw call; the count at 96 m is 66 of 150.

*Challenges, and the first one is the one that eats a day if it is got wrong.*

**Every roll must be on its own seed offset.** `CLAUDE.md` is explicit: consuming an existing
roll shifts every ore at every depth on every planet, and the diff looks like three lines.
Growth rolls on `(x + 91, d + 29, planet + 131)` and touches nothing else.

**It must not change a single block id.** Growth is decoration drawn on top of a cell, not a
cell type, so `test/baseline/blocks-preadditive.json` stays green - and that is the proof, not
the intention.

**Depth bands.** Moss and plants belong near the surface where the damp is; frost belongs
anywhere on a cold world; oil seeps deep. A growth that ignores depth is wallpaper.

---

## Order of work

Each slice ships on its own: typecheck, golden tests, build, size guard, e2e, CI, deploy.
Nothing sits half-finished on `main`.

1. **Planet identity.** Palettes, atmosphere, per-trait signatures. Pure data plus rendering,
   no rules change, so it is the safest large visible change and it makes everything after it
   look better.
2. **The chart and the transit.** Choosing where to go, and flying there. Replaces the modal.
3. **The Jump Drive and the Heart.** Components, progress, the final world, the ending.
4. **Upgrades and power-ups.** Independent of the other three, so it lands last and can be
   tuned against the finished shape.

The risk to watch across all four is the one `CLAUDE.md` already names: **world generation is
a pure seeded hash, and anything new that generates content must roll on its own seed
offset.** Components, signatures and caverns all generate, and all three will silently shift
every ore in the game if they consume an existing roll.


---

# Round nine

Round eight closed on 2026-09-12 with W1-W10 ticked. What follows is the work
it left open, in the order it should be done. **The first two are not features -
they are the things that stop round eight being nine hours of unplayed work.**

No new design asks came in during round eight. Every milestone below is either
something the round left behind or something `POLISH.md` wants before a ship;
the shape of the game is not up for revision until R9a has happened.


# Round ten: the polish round

His words on v0.37.0, 2026-09-13, in `playtests/lattice.md`. Four asks, and the
first is the frame the other three are evidence for: *"polish everything up ...
things that official games have that make them feel complete ... things that
arent specifically game issues but feel awkward."*

Measured before anything was designed, so these are faults rather than
opinions:

- **The dock is the whole top row, not the pad.** `atSurface()` is
  `g.pd <= -0.6` and nothing else, so flying up ANY of the 61 columns sells the
  hold, refills the tank, repairs the hull and lands a pending collapse. The
  game's own fuel model already disagrees with this: `findRoute()` paths to
  `key(START_X, -1)` - the pad - so the reserve on the dial has always been
  costed against returning to the pad specifically. One depth comparison is
  contradicting the arithmetic printed next to it.
- **The growth quads are buried in the rock.** The rock's displacement shader
  pushes its face outward by `ROCK_BUMP` - 0.16 on dirt up to 0.40 on rubble -
  from a face at z = 0.5. The growth quad is placed at a FIXED z = 0.52. So on
  ordinary stone the surface reaches z = 0.70 and the decal at 0.52 sits inside
  it, showing only where the noise happens to dip below it, and changing as the
  camera moves. That is the "pops in randomly", and it is also why it reads as
  low quality: what is on screen is a clipped fragment of a flat sticker.
- **The ship is steampunk and he no longer wants it to be.** A restatement from
  scratch rather than a refinement, which by standing rule 9 means the model is
  wrong, not the tuning.


# Round eleven: the professional-polish sweep

*2026-09-14, v0.43.0 to v0.48.0.* His words: *"look into and fix anything that
a professional game shouldn't have."*

**Every one of these was found by opening the game at a shape, a setting or a
state nobody had opened it at before.** The mechanical checks were clean - no
`console.log` in `src/`, no TODO or FIXME anywhere, no placeholder text, a
clean tree, and the doctor's full run with nothing but PASS lines against this
repo. The faults were not in the code's hygiene, and none of them would have
been found by reading it.

**Each has a test that asserts the INVARIANT rather than the number, and every
test was verified by putting the bug back.** That is the durable half: the
fixes are CSS and a few modules, the tests are what stop the next round of
work reintroducing them.


**Two things were measured and found already fine**, recorded so nobody spends
the time twice: the save cannot outgrow its storage (digging out the ENTIRE
world is 232 KB against a ~5 MB limit) and there is no leak (14 MB of heap at
the pad, still 14 MB after digging to 43 m, booting in 804 ms).

# The Play listing

**These four landed in this repo without boxes, and a box is how the outline
stays true** (INDEX.md rule 3: one `- [ ]` line per milestone, ticked in the
commit that finishes it). Three of them were built by other sessions working in
this repo on 2026-09-13, which is why the plan did not have them; they are
recorded here rather than left uncounted, with the commit that did the work.
The reasoning behind each belongs to the session that wrote it and is in the
commit messages, not restated here.


# The second month

> **ANSWERED 2026-09-18, and the answer retired candidate 1.** R9a happened: he
> played the build on his phone and liked it. His first sentence was *"I think
> any more than 7 anchors would feel like a checklist."* This section's
> ranked-first candidate was nine MORE Anchors in the deep, which is eighteen.
> It is dead, and the reasoning below is left standing rather than deleted
> because **why it was ranked first is the useful part**: it was chosen for
> being cheapest to build and best fitted to the world's existing shape, and
> nobody asked whether another nine of the same thing would feel like anything.
> That is the failure mode this note exists to leave on the record. What
> replaced it is **Round twelve**, below, and his ceiling is its governing rule.

**A sketch, not a plan, and it is deliberately not started.** `POLISH.md` asks
for the next month's content to be in this file even when it is not built, and
the reason to write it now is that round eight ended the game without saying
what follows it. Nothing here is committed to until R9a - a human play - says
what this game actually is.

## What the campaign leaves behind, measured

Round nine's probe finishes the game in about seventy game-minutes: five
Anchors in the first twenty-one, the remaining four in forty-two more, the
Vault in eight. That is the floor rather than the forecast - it plays badly on
purpose - but it tells us the shape of the problem. At the end:

- **The deepest quarter of the world is empty of objective.** Anchors live in
  the top three region rows by construction (`ANCHOR_ROWS = REGION_ROWS - 1`),
  so 339-452 m holds one hand-placed room, the Vault, and nothing else.
- **5.8% of the planet is authored** - 23 rooms, 1,764 cells. The other 94% is
  seeded rock, and it is the part a second month would have to make worth
  re-entering.
- **The ending hands the planet back** and means it: *"The ground is yours.
  There is more of it than you have seen."* Right now that sentence is a
  promise the game does not keep - nothing new exists after the Vault.
- **`g.won` already survives a reset**, and New Game Plus already offers the
  skip. The hook for a second pass is built and unused.

## The three candidates, in the order they are worth doing

**1. The deep, and a reason to be in it.** The cheapest real content and the
one the world is already shaped for: the fourth region row has palettes,
traits and ore and no objective at all. A second Lattice that only appears
once the first is lit - the Anchors were holding something DOWN, and the
Vault says so - puts nine more rooms in ground the player has learned to
survive but never had to stay in. Reuses the room stamper, the Anchor state
machine and the Unrest model whole; the new work is the hazard that makes
339 m different from 250 m, and heat is already there to build on.

**2. The relics as the collection that outlives the campaign.** There are
eight relics and one is buried per planet, which on a one-planet world means
a player sees one per playthrough. That is a collection nobody completes and
therefore a meta-goal that does not work. Either the relic moves to a
per-REGION drop (twelve, one per region, a shelf in the station that fills)
or it becomes the New Game Plus carry: what you keep, and what makes the
second pass differ from the first. The station room already has the geometry
for a shelf; `g.relics` already persists through a reset.

**3. New Game Plus as a changed world, not a faster one.** The flag is there
and the only thing it buys today is a skip button. The cheapest version that
is worth anything: the Anchors move (they are seeded, so a different offset
is a different hunt), the sealed three become five, and the planet starts
awake. No new systems at all - it is the wake threshold, the seal set and a
seed offset, all of which are constants.

## What this deliberately still refuses

**No combat**, for the reason round eight refused it: Dome Keeper's own
reviews say its two phases feel divided, and the fusion here is that the
pressure applies to digging itself. **No second planet.** The chain was
deleted in W9 and the whole of round eight is the argument against it; a
second world is the answer only if R9a says one world is exhausted, and the
measurement above says 94% of this one has never been authored at all.

## What to do next

**R9a, and nothing else.** Every item above is guesswork until a human has
played the campaign end to end. The probe can prove the game is completable;
it cannot say whether hunting Anchors feels like a hunt, whether the map is
worth opening, or whether the fifth Anchor lands. Those three answers decide
which of the three candidates is even the right question.

## What round eight deliberately did not do, and still has not

Carried forward from the round-eight design so it is not rediscovered:

**No combat.** Dome Keeper's own reviews say its two phases feel divided, and
the fusion here is that the pressure applies to digging itself. A second verb
imports the exact criticism the research warns about.

**No hand-authored secret world.** Animal Well is seven years of hand
placement and does not survive procgen. Authored templates in seeded slots is
the version that does, and that is what `src/sim/vaults.ts` is.

**No star chart.** It was a good screen for a game about visiting places and
this is a game about one place. It comes back if a sequel does.

# Round twelve: the world gets a voice

**His words, 2026-09-18, verbatim in `playtests/lattice.md`:**

> "I think any more than 7 anchors would feel like a checklist. For now, I like
> how everything is laid out. I want to get this first version onto the play
> store. Can you set up a plan to make the game feel more rounded and story
> like? Make more encounters and random events as you go. Make the game feel
> like it is pushing you in a specific direction, so it doesn't just feel open
> with no point to the game. Make sure the player knows the objective or is
> subtly pointed in the correct direction. Expand on all of these requests,
> research how to do this, then implement it."

## The five asks, numbered

1. **The Play store, for this version.** Ordered first by the word "first", and
   it is a separate track from everything below. `P5` is what blocks it.
2. **More rounded and story like.**
3. **More encounters and random events as you go.**
4. **Pushed in a specific direction, rather than open with no point.**
5. **The player knows the objective, or is subtly pointed at it.**

**2 through 5 are one problem in four voices**, and reading them separately is
how this round would get built wrong. The world is a place with no pressure and
no voice in it. Story, encounters, direction and objective are four different
symptoms of that, and the fix for all four is the same: **the world has to say
something.** They are kept as separate asks below only so that each can be
checked off against his words.

## The governing rule of this round

**The answer to "the game needs more" is never another Anchor.** Nine ship; he
has named seven as the ceiling where collecting stops being a hunt. Every
milestone here is checked against that rule, and the rule is the reason the
second month's ranked-first candidate is dead rather than deferred.

Read it as a ceiling on the COUNT and not as an instruction to cut: *"for now, I
like how everything is laid out"* is the sentence beside it, and nine laid-out
Anchors are what he likes. **What he is refusing is more collectibles in an
empty world**, which is exactly what the Anchors were being asked to supply and
exactly what they cannot.

## The diagnosis, measured rather than asserted

Four findings, each checked against the running build at v0.48.0 rather than
against memory.

**The objective is never on screen.** A screenshot of the pad at 375x812 shows
the whole HUD: the region name (`Rustmoor`), `HAUL ◈ 0`, `◈ 0`, `DEPTH 0 m /
452 m DEEP`, a fuel gauge, a d-pad, and five buttons. **Not one pixel names the
Anchors, the Vault or the Lattice.** The only goal-shaped number on screen is
`452 m DEEP`, which says go down and never says why. That single frame is most
of asks 4 and 5.

**The objective is stated at the door and never once inside.** It is three lines
in the intro (`src/sim/intro.ts`): *"Whoever cut these halls is gone."*, *"Nine
Anchors, buried across one world."*, *"Light all nine, and the center opens."*
The intro plays only when there is NO save, and a returning player gets the
title screen instead.

**This finding was first written as "never again to the player who comes back"
and that was too strong.** Shooting the title screen for V8 disproved it: it
carries *"Dig down. Light the Anchors. Open the center."* under the name and
*"Rustmoor - 140 m of 452 - 0 of 9 Anchors lit"* along the foot. A returning
player is told, clearly, on the way in. Corrected here rather than quietly
softened, because an overstated diagnosis is the same fault as a stale one and
this round has already retired one of those (M7).

**What was true is the sharper claim**, and it is the one V2 answered: the
objective was on the way IN and nowhere in the game. Once play starts, the
title is gone and the HUD named nothing.

**The tally exists but is buried.** `src/input.ts:371` renders `Anchors lit, of
nine` with a count - inside the pause sheet's record book, under Relics and
Records. It is a statistic in a menu, not a goal on a screen.

**94% of the world is silent.** 23 authored rooms, 1,764 cells, 5.8% of the
planet. The other 94% holds ore, three hazards and nothing that would ever be
retold. `src/sim/finds.ts` is the one exception and it is the proof the idea
works: seven devices buried in hashed cells, each granting a verb, each a small
story when it surfaces.

## What the research settled

Three briefs, 2026-09-18, kept at `C:\dev\plans\lattice\DIRECTION.md` and
`STORY.md` with their sources.

**Both independently reached his conclusion before being told it.** The
direction brief: *"the fix is not more Anchors - it's making the Ballast, the
Survey map and the Anchors' calmed/uncalmed state readable from a distance and
audible from underground."* The story brief: *"a wordless game's story is not
delivered, it is noticed."* His instinct and the reference games agree, which is
the strongest signal this round has.

**Direction, the three ingredients every reference game shares.** A
limited-visibility instrument that makes the unknown adjacent rather than
distant; a signal that ARRIVES from the world and can be ignored; and a visible
contrast between resolved and unresolved that reads at a glance without reading
a word. The Lattice already has the first (the lamp) and the third in data (lit
versus unlit regions) but has never drawn it where the player looks.

**Story, the four rules.** Push on what exists rather than adding. Make the wake
a visible rewrite of ground already dug. Keep every found record a silent
tableau rather than a log. **And pair every beat with a visual or haptic
carrier, never audio alone** - a phone game is played muted, and the sourced
finding is that needless audio gets muted immediately and stays muted.

**What the research says to SKIP**, recorded so it is not rediscovered: audio
logs and data slates (players skip them, and this game is muted-first), voice
acting, cutscenes (they contradict this game's own grammar, where the `#found`
banner is deliberately not a modal), Outer Wilds' dense knowledge web (needs
20+ nodes, and nine would read thin - and it is the most tempting way to
accidentally rebuild "more things to find"), and Hollow Knight's NPC-dialogue
half (needs a written character).

## The design

Four systems. Every one of them reuses machinery this repo already has, and not
one of them adds an Anchor.

**The Call - direction as an instrument, not a marker.** An unlit Anchor is
ancient machinery and it should be audible from underground. The ship gets a
RESONANCE reading in the instrument cluster that strengthens with true proximity
to the nearest unlit Anchor. It is warmer-and-colder, never a bearing arrow and
never a 3D waypoint: the player still has to choose a direction and dig it, which
is the decision the whole game is built on. The fiction and the instrument are one
object, which `mechanics\FOUNDATIONS.md` asks for.

**The receiver is one of the FINDS.** It is not owned at the start; it is dug up,
like the laser. That costs nothing extra (`finds.ts` is built and tested), makes
the direction system arrive as a discovery rather than as a UI feature, and means
the first descent is still the unguided one it should be.

**The objective, always legible.** A standing Anchor tally in the HUD's top
row, in the Lattice's own glyph rather than as a quest line, plus the Survey map
redrawn so lit and unlit regions separate at a glance. This is the cheapest
milestone in the round and it answers ask 5 almost by itself.

**Encounters - the 94% gets something to say.** Authored pockets stamped into
seeded slots, the way `vaults.ts` already stamps Anchor halls, each asking a
QUESTION the player answers with the verbs they have (fly, dig, carry, sell,
buy). No combat and no new verb. The detailed archetypes are in the milestone
table below.

**The world changes, which is the story.** The wake at the fifth Anchor is
already a threshold event and it is the shape to copy: a three-act grade over
the existing Unrest thresholds, the wake rewriting tunnels the player themselves
cut, and an ending that shows the dug world rather than only stating a sentence
about it.

## Milestones

Phase T, and the boxes are `- [ ]` or `- [x]` and nothing else (rule 3b).


**V0 through V3 are the round's first delivery** and they are the ones that
answer asks 4 and 5. V4 and V5 answer ask 3. V6 through V9 answer ask 2.

## Round thirteen: the icon

His ask, 2026-09-19, in full: *"That looks good to me. One thing I would like to
have updated is the app icon. Can you update it to something that matches the
more realistic textures on the rock, and feel of the game?"* One ask, and it is
a stand-in described as a preference - the icon was the planet-and-core
objective that round eight removed, still shipping on the launcher, the tab, the
shared link and the store listing five rounds later (rule 12, whose note names a
replaced OBJECTIVE as the most expensive stand-in there is).


## Round fourteen: rarity, usefulness, and what an Anchor gives you

His brief, 2026-09-19, after the first real play of 0.54.0. Five asks, numbered
here in his order, and the verbatim words are in
`gamedev-notes\playtests\lattice.md`:

1. **Make materials feel more rare** - "I want it to feel exciting when you find
   resources."
2. **Make them more useful** - "so they feel like you are searching for them."
3. **Abilities on each Anchor.**
4. **The first Anchor's ability is the map**, showing where minerals, secrets or
   a higher concentration are, only in regions whose Anchor is lit.
5. **The Anchor is a physical thing at that spot that you cannot dig**, glowing,
   visibly powerful.

Research: `C:\dev\plans\lattice\RARITY.md`.

### The measurement that decides asks 1 and 2

Taken before any design, on planet 0, by flood-filling every ore cell into
deposits of the same id:

    ore         deposits  cells  mean size   biggest
    copper           292    307      1.05        3
    iron             355    370      1.04        3
    gold             213    219      1.03        2
    ruby              82     83      1.01        2
    magmite           40     40      1.00        1
    coreite           23     23      1.00        1
    umbrite           13     13      1.00        1
    solmarrow          5      5      1.00        1

**Every ore in this game is a single isolated cell.** There are no veins
anywhere and never have been. Finding gold gets you one gold: the number goes up
and you move on, which is exactly the "it does not feel exciting" he is
reporting. And the deep ores are already savage - solmarrow is five separate
single cells on the whole planet, about one in 980 below its own floor - so
lowering a spawn rate would not make it exciting, it would make it absent.

The research says the same thing from the other side and it is the one finding
that governs this round: **lowering a rate alone is not shown anywhere to
increase excitement.** The excitement lives in the reveal and in the material
having a named use. Every game surveyed clusters its rarest resource -
Minecraft generates ore as vein blobs rather than single blocks, Deep Rock's
Nitra bulges out of cave walls in clumps that read from a distance.

So "more rare" is the right instinct pointed at the wrong number. Clustering the
SAME total supply into far fewer, richer veins makes a find rarer in the only
sense that matters - the number of separate find-events - while making each one
a place you stop and work. Total supply is unchanged by construction, so nothing
else in the economy needs rebalancing.


## Round fifteen: the descent becomes a ladder

His brief of 2026-09-19, rewritten to the format `techniques/instruction-design.md`
sets out: one subject a rule, the TRIGGER first, the reason as a clause rather
than a paragraph, the receipt named, and about 120 words a part. His words are
in `gamedev-notes\playtests\lattice.md` verbatim and are the authority; this is
the reading of them, not a replacement for them.

**The sentence the brief turns on is "it should also work backward from how we
have it".** Today the Anchors are a COLLECTION that ends in a Vault - nine of
them anywhere on the planet, lit in any order, and the ninth opens the centre.
He is asking for a LADDER: a few Anchors per tier, each tier ending in a gate
you break to descend. The current structure pays once, at the very end. A ladder
pays at every tier, which is the same sentence as "building in intensity as you
find more".


### What this REPLACES, which is the expensive part

Rule 12: a replaced objective is the most expensive stand-in there is, and two
structures in one game is worse than either. Everything here is in the path of
the brief and has to be resolved rather than left beside it.

- **The Vault ending.** Nine Anchors opening the centre is the current climax.
  A ladder of tier gates is a different spine.
- **The Ballast as a bar you feed**, which Y5 and Y7 replace outright.
- **The single pad shop**, which Y8 turns into the first of several.
- **The flat upgrade tree**, which Y9 and Y10 re-cut by tier.
- **The wake at the fifth Anchor**, whose job - the planet answering partway
  through - is what Y6 now does at every tier.
- **Nine Anchors.** A ladder wants a few per tier; nine over four tiers is two
  and a bit, which is not a number.


### The turn the story takes, and what it makes the rest of the round mean

His words: *"I want it to look like you are doing a good thing by releasing the
dark energy from it, but at the end of the game, find out that you actually
freed a dark entity. It should play into the ending, and hint at it as you get
closer to the end."*

**This is the reason the rest of the brief exists, arriving after it.** Every
piece of the structure above was mechanically sound and narratively arbitrary:
why do Anchors gate depth, why does integrity fall faster each tier, why repair
a planet at all. With the reveal, all three answer at once.

- **Integrity falling faster per core is no longer a difficulty knob**, it is
  the consequence being shown honestly while the player reads it as progress.
  That also settles the research's objection to it: it argued for tying the
  acceleration to depth rather than to cores, on Risk of Rain's evidence about
  punishing success. Under the reveal the acceleration is not a difficulty
  ratchet at all, it is the plot. It stays on cores.
- **Repair (Y7) becomes tragic rather than janitorial.** The player patches a
  planet they are themselves breaking, which is a far better reason to build a
  real mechanic than "the bar should have something to do".
- **Y12's "always more secrets" gets a spine.** The hints ARE the secrets, and
  they escalate toward the Vault, which is what "building in intensity as you
  find more" has wanted all round.


### Y0b: what the save point does

His words: *"The save point saves your position and possibly allows you to
restock supplies, but we should research and plan what feels better."*
Researched against five games, three that pair a hard survival resource with
an intermediate waypoint: Deep Rock Galactic prices its mid-mission resupply pod
in Nitra for a half refill, FTL never gives fuel away (even a dedicated
refuel event still costs scrap, and every jump costs fuel regardless), and
Barotrauma's outposts are paid shops whose only "safety" is that your sub
stops draining while you are physically docked. Against them, the negative
case: Subnautica's base network recharges power and oxygen for free at as
many nodes as you build, and players report the power tension gone once one
base is up; Dome Keeper keeps its wave-timer tension alive specifically by
having no second free hub at all.

**The pattern holds across all five: the moment a mid-route stop gives
something for nothing, it functions as a second surface pad, and the
decision to turn around collapses into "walk to the nearer freebie."** So
the gate save point answers in two halves that do different jobs:

- **Remembering position is free**, exactly like every checkpoint this game
  already writes (R9h): CONTINUE resumes there, tank and hull exactly as the
  run left them, nothing restored. It costs nothing because it changes
  nothing.
- **Restocking is Y8's shop, and it is priced like the surface shop, never
  free.** A gate station that refuels or repairs for nothing, the way the
  pad does, would make the pad's own free refuel pointless the moment a
  player reaches the first gate, and every metre below tier 0 would stop
  being a decision.

**The fuel math itself does not move to the gate.** `climbCells()` and
`fuelToClimb()` keep routing the Point of No Return to the surface pad at
`(START_X, -1)` — never to the nearest open gate — so the dial still answers
"can I get all the way home," not "can I reach the nearer shop." A gate
makes a long descent more survivable because a shop partway down can sell
fuel, not because the climb got shorter. See Invariants.


## Round sixteen: closing Fable's review

Fable reviewed the Y1-Y15 packet on 2026-09-24, the standing check-in Gideon asked every
game to run at a major milestone (`gamedev-notes\playtests\lattice.md` has the reply
verbatim). Three things from that review changed the plan.

### The reveal never reached the Vault itself

His third answer, 2026-09-19: *"I want it to look like you are doing a good thing by
releasing the dark energy from it, but at the end of the game, find out that you actually
freed a dark entity."* Y15 built the half of that which escalates on the way down - the
three hints in `src/sim/hints.ts` - but the Vault's own card (`vaultReached`, `src/actions.ts`)
never named the entity, so a player who reads the hints and then reads the ending sees three
suspicious rumors and a reassurance that seems to contradict them. Z1 rewrites that card to
say the thing plainly, and adds the film receipt round fifteen never took: Y13 asked for
every Anchor break to be dramatic and leave remnants, and nothing filmed the break itself,
only its aftermath (`anchorbroken` in `tools/scenes.mjs` shoots the scar, not the moment).

### S6's phone pass was desk evidence

STATE.md's own phone-readings section says the last check found no device connected, and
every "phone pass" milestone since (S6, W10) has stood on draw-call counts and filmed
contact sheets rather than a reading taken on the handset itself - and PWA install and
offline behaviour, which only a real device or real Chrome can exercise, has never been
checked there at all. Z2 is that reading, before V0 is argued from a phone number nobody
has actually read off the phone.

### Y12 closes on paper, not with new content

Y12's own box already carries the number - a campaign's shaft-and-corridor meets one of
the four secret kinds in about 27% of mining sessions, and caches are about 90% of every
hit because the other three are each finite. That is the accepted figure for "how often
does a descent meet a secret," recorded here rather than only in the milestone file so a
later round arguing for a rate change is arguing against a number instead of a memory:
**27% is accepted as correct for a campaign that has also shipped Y15's hints**, because
the hints are what makes "always more" true without the rate itself needing to move.


## Round seventeen: the ladder, finished

His ask of 2026-09-25: go through every request since the barrier change, find what should
be improved or redesigned, plan it, check with Fable, research, check again, then build.
Three read-only audits of the code (mechanics against his words, pacing tier by tier,
presentation against his repeated complaints) and Fable's first review shaped what follows.
He answered two questions the same day: **the last gate moves down onto the Vault**, and
**the ending shows the light leaving, not a creature**.

### What the audits found, in the order a player meets it

1. **Two door moments.** The Vault opens on the ninth ANCHOR ("THE CENTER IS OPEN") while
   barrier 3 still stands; then core 3; then the Vault. His answer was "the last gate
   should be the door", and the old spine is still the one that opens it.
2. **The old spine lives beside the new one.** Nine amber pips and a Vault diamond on the
   HUD, captions that say "break all nine and the center opens", the fifth-Anchor wake as
   a second escalation next to the per-core drain, Ballast-feeding leftovers, a store
   listing about lighting nine Anchors, film scenarios for states that can no longer occur.
3. **The story contradicts itself.** Every Anchor broken REDUCES the drain by a quarter and
   its card says the planet "holds harder", the opposite of "you are slowly allowing the
   world to break".
4. **Readouts stand in for the world.** Integrity speeding up per core is a number; hint 2
   says the rock "runs warmer" and heat never reads the gates; repair is a SEAL button and a
   "+X%" toast and the scar never changes; the save point is silent; an ability is a line
   in a card.
5. **The barrier and the core are drawn as ore.** Both go through the ore pipeline in
   colours beside amethyst and gold, so the forcefield reads as uncuttable amethyst and the
   inviting core as a gold nugget. Neither emits light. All three tiers look identical, so
   nothing turns from inviting to sinister.
6. **No guidance.** Touching a barrier says nothing; a core appearing is not an event and
   neither is on the map.
7. **The gate shop is the pad's shop.** Same room and shelf (stock keys on best depth), a
   fuel pump that does nothing there, a vestigial planet name in the header. "New skills in
   deeper shops" was never built, and nothing new is stocked after 226 m.
8. **Abilities land in the wrong place.** The Call only answers in regions whose Anchor is
   broken, so it says nothing about the tier it arrives in. Sink cannot pass sealed stone.
9. **The deepest quarter is empty.** 339-452 m has no Anchors, core, hint, hazard or stock.
10. **No back button.** Nothing handles Android back in a fullscreen PWA, so back leaves the
   app over any panel, and no panel has an X. About 30 readouts on the late-game HUD.
11. **Nothing measures the ladder.** The long-play probe predates the gates, and the econ and
   secrets probes walk straight through barriers.

### Decisions

- **The last gate is the Vault's door (his pick).** Gate 3 moves from 339 m down to sit on
  the Vault; tier 2 becomes 226 m to the door, which also brings the relic and Solmarrow
  inside a tier that has Anchors. Core 3's break opens the Vault and nothing else does.
  Core 3 gives the door, not an ability, so the abilities reshuffle: **the Hollow at core 1,
  the Call at core 2** (and it answers for unbroken regions, so it points somewhere the
  player has not been), and **Sink leaves the core list to become the first skill a gate
  shop sells** - which is where "new skills in deeper shops" finally gets built.
- **Breaking an Anchor makes the planet worse.** The per-Anchor relief is removed; each
  Anchor adds a step to the drain the first core starts, and the cards stop saying "holds".
  The fifth-Anchor wake stops being its own system and folds into the first core's "the
  ground starts to go".
- **The story blames one thing: the cores are what you let out.** Every caption, card and
  hint says the same thing, and the Vault card was brought in line in Z1.
- **The ending shows the light leaving (his pick).** No creature model. The spent cores have
  stayed lit all game; at the Vault their light leaves the scars one by one and gathers at
  the center, the planet goes dark from the center upward, and the sky over the pad takes
  the core's colour. This is Shadow of the Colossus's inversion - the light the player read
  as good turns out to be the thing itself - and it uses only lights, the lightmap's
  darkening and the camera, so it can be filmed and proven.
- **The core's glow is a real light; its menace is the dark around it.** The lightmap only
  ever darkens (Engineering reference), so a core is a PointLight from a fixed pool that is
  toggled by intensity, never added or removed (three.js compiles the light count into the
  shader, so changing it recompiles every material), and the propagated light dims around
  it tier by tier. The forcefield is one additive, depth-write-off ShaderMaterial strip per
  barrier (fresnel edge, scrolling noise), one draw call each. Both need a GPU reading
  before and after, since these are the first lights the world has ever had.
- **Back closes the top panel.** One close stack: each panel that opens pushes a history
  entry and registers what closes it; back pops the top panel and does nothing more; on the
  bare HUD back falls through. CloseWatcher is the newer primitive for this and is used
  where Chrome has it, with the history stack as the fallback, because the research found
  an open report that a TWA and an installed PWA do not agree on back.
- **Repair shows in the rock.** PowerWash Simulator's lesson: split the job into pieces that
  each visibly finish. A scar refills in stages, cracks closing and violet dimming, and the
  "+X%" toast goes.
- **A deeper shop sells what the pad never will.** One skill per gate shop (Sink first) plus
  a one-per-visit item, the Hades Wretched Broker pattern, so reaching a gate is a reason
  in itself.

### AA: the ladder, measured

`npm run campaign` (`tools/campaign.mjs`, model in `tools/campaign-model.mjs`) plays the
campaign from nothing on the pure layer: mine at whichever of seven shafts pays best per second,
sell, buy the cheapest rung the shelf allows, and go and get the cheapest survivable goal (a
device crate, an Anchor, a ready core, the Vault). First reading, 2026-09-25, the ladder as it
stood before AC:

| Tier | Ends | Runs | Game-minutes | At minute |
|---|---|---|---|---|
| 0 (0-113 m) | gate 0 opens | 9 | 7.5 | 7.5 |
| 1 (113-226 m) | gate 1 opens | 9 | 10.0 | 17.5 |
| 2 (226-339 m) | gate 2 opens | 23 | 25.5 | 43.0 |
| 3 (339 m-the Vault) | the Vault | 1 | 2.2 | 45.2 |

**A floor, never a forecast.** The studio's own lessons say it: a perfect, zero-latency scripted
player winning is evidence that the ladder is fair to a perfect player, not that it is easy, and
this one never hesitates, never explores and always knows where everything is. His session
times replace it tier by tier when he plays.

What the reading says: tier 2 is where the time goes - nineteen of its twenty-three runs are
mining until the ship can survive the heat at 281 m to fetch the laser, which every Anchor of the
tier needs. Tier 3 is two minutes of flying to the Vault, the empty last quarter the audit
named, and the reason AC moves the last gate down. Two things the probe hit on the way that are
the game's and not the probe's: Rustmoor's scar at 42-44 m is an uncuttable plug two columns
from the pad, and Cryon's scar sits in the same column as tier 1's core (49), so a straight
shaft to the core is blocked at 47 m. Neither strands a player - both route round - but a core
column running through an Anchor's remnant is worth avoiding when AC re-places things.

The secrets probe now opens the gates above each leg and stops at the one below it; it had been
digging straight through barriers.

### AC: the last gate is the Vault's door

Built 2026-09-25, as he chose it. The last barrier moved from 339 m to 398 m, the row directly
above the Vault room (399-411 m, core at 405), and its core sits at the Vault's own column, so
breaking it opens the Vault and nothing else does; `vaultOpen` takes the open gates now, not a
count of Anchors. The card for that core is THE DOOR OPENS and hands over no ability - the door
is the gift. What moved with it:

- **The old spine's two openings are gone.** The ninth Anchor opens nothing (the THE CENTER IS
  OPEN card is deleted), and the fifth-Anchor wake is the first core's: the Blooms, the Unrest
  step and the ground closing arrive with THE GROUND IS GOING, and the colour grade's second act
  starts there too. `WAKE_AT` is 1 core.
- **An Anchor makes the planet worse.** `BALLAST_ANCHOR_BITE` 0.05 replaces the old quarter of
  relief, and the core bite fell from 1.75 to 0.1 because it no longer has the Anchors' relief
  to beat. The fairness line still holds: the clock reads about 12, 10 and 8 minutes at the
  three cores and rises with every Anchor between them. Its card says how many Anchors still
  hold its barrier, never that anything "holds harder".
- **Abilities.** The Hollow at core 1, the Call at core 2 - and it hears everything the ship can
  reach, not only broken regions, stopping at the next shut gate. Sink comes from no core; it
  is a skill (`g.skills`) the first gate's vendor sells (AO).
- **The pip row is this tier's three Anchors and its core**, starting again at each gate.

**The golden diff, read before re-recording** `test/baseline/blocks.json`: on all six recorded
planets exactly two rows changed - 339 m, where the barrier no longer runs (61 cells back to what
the generator always had under it), and 398 m, where it now does. No ore moved anywhere else;
the per-id count shifts are only those two rows. The frozen golden did not need re-recording.

**The probe on the new ladder** (`npm run campaign`): tier 0 7.5 min, tier 1 9.8, tier 2 29.4
(226 m to the door, still mostly mining until the ship survives the heat at 281 m for the
laser), then 1.5 min to cut through the door into the Vault - the Vault at minute 48.2, and no
empty tier left.

### AD: the old spine retired

Built 2026-09-25. The collection's words went with its mechanisms: the intro's middle lines are
"Three Anchors under every barrier. / Break them, and the way down opens."; the title line, the
page's own description and the store's short description say "break" and never "light nine";
the store listing's campaign and "planet notices" paragraphs describe the ladder (the mineral
and shop paragraphs wait for AK and AN, and the whole listing goes back to him before V0, since
he approved the old one on 2026-09-19). The dead `feed()` path and its test, the Ballast panel's
feeding lines and the old long-play probe (`tools/longplay.mjs`, superseded by AA's campaign
probe) are gone. The breach and Claim film scenarios filmed mechanics that no longer exist and
are deleted; the rest build states the ladder can reach, and all twenty-five film clean.
`test/spine.test.mjs` reads every string a player sees and fails on nine as the goal or "light"
as the verb.

### AE: the barrier and the core become objects

Built 2026-09-25.

**One wrongness colour.** `src/sim/wrongness.ts` holds `WRONGNESS`, 0x8a5ad0, and nothing else
in `src` or `index.html` spells the value. A test greps for it and allows only that file, and a
second test lists the files allowed to import it. Four things take it:
- the core's light and its crystal
- the scar (a broken Anchor, its plinth, its burst and the map's mark for it)
- the pip row, through `--wrong` set at boot: broken Anchors, and the core diamond once it is open
- the lift band in a gate's room

The core used to be warm gold. It is now the wrongness colour, and it is still the brightest
thing in its tier.

**The barrier is built.** `src/barrier.ts` draws each shut gate as:
- two emitter rails the width of the world, in the ship's pale matte relief-textured treatment
  and lit by the lightmap, proud of the rock face so they read as fitted to it
- a row of lit emitters along each rail
- a thin additive field between them that wavers upward like heat over a road

blocks.ts draws the barrier's cells as the rock they run through. The first build drew nothing
there, and the field over empty space read as a dark ribbon, which is the one look the milestone
ruled out. To the simulation the row is still `gate`: uncuttable and in the way.

**The core's light.** The pool is one PointLight, made once, and it goes each frame to the
nearest core with something to say. The first build had one light per gate, and the reading
counted three more lights on every lit fragment for cores that are never two on one screen.
- **An appeared core** comes up over two seconds, then pulses. `coreLook(t)` in the pure layer
  makes each tier darker in colour, stronger, and wider and faster in its pulse, and a test pins
  each of those as a number.
- **The rock around a live core goes darker.** `uLmCores` feeds `coreDim()` inside `coreLit`,
  a darkening only, as the lightmap rule requires.
- **A spent core stays lit,** and burns the way its hint reads: the first stutters, the second
  runs warm, the third breathes.

**Events.**
- **Touching the barrier** names what opens it, at most every four seconds (`barrierSays`): how
  many of this depth's Anchors still hold it, or that its core is open. It never says where.
- **The last Anchor of a tier** gets its own card, A CORE OPENS. It puts a core mark ('o', the
  wrongness diamond) on the map, which gains a CORE key.
- **The hints** no longer follow the core's card. Each is due at its break and shows the first
  time after that (at least 20 s on) that the ship passes within four cells of a spent core.
  `g.hintsShown` is saved, and an older save counts every due hint as heard.

**Per core** (`coreStep`): the heat line rises 12 m, the dust thickens by 0.35 and tremors come
0.3 faster. On this world that moves the heat line from 199 m to 187, 175 and 163 m. The campaign
probe prices the heat and the Vault still falls at minute 54.7. One e2e had placed a key at 179 m
with two gates open, and the risen heat line now hurt the hull there, so the camera correctly
refused to lean. The test now opens only the gate above the key.

**GPU reading** at the barrier with its core open (360x780 at DPR 3, headless Chromium,
software GL, both builds measured in the same session):

| | draw calls a frame | triangles | programs | point lights | fps |
|---|---|---|---|---|---|
| before | 71 | 32,856 | 32 | 2 | 9 |
| after | 72 | 33,514 | 35 | 3 | 9 |

The underground budget test reads 68 of 150. A reading from the phone is still owed.

Receipts: `test/wrongness.test.mjs`; three e2e specs (the barrier names what opens it; the last
Anchor's card, map mark and light; a hint seen once past a spent core); `npm run film core1`,
`npm run film core3`, and `node tools/shot.mjs barrier` for the still.

### AF: repair shows in the rock

Built 2026-09-25.

**The scar closes as it is packed.** Each region keeps what its scar has taken
(`g.ground.packed`, saved). `scarStage` turns that into four stages at 0.2 of Ballast each. Both
the broken Anchor and the plinth are drawn by stage:
- the violet mixes toward stone
- the glow drops
- the broken Anchor's crystal draws in from ten shards to one

A Block's new `look` field keys the instanced pool, so one id can have four drawings and the
simulation, the tests and the goldens still see `anchorscar` and `anchorbroken`. A full starting
hold of money ore is 0.3 to 0.5 of Ballast, so a scar closes in a trip or two. The first step
was 0.12, and the film showed one press closing a scar outright.

**Nothing on screen reads as a payment.** The "+X%" toast is gone. The line now says which way
the rock went: "The scar takes it", "draws in", or "closes". The SEAL button reads SEAL THE SCAR.

**No readout before the first core.** SEAL, the pad's sight glass and the bay's Ballast dial are
all hidden until then, off the same `ballastStarted` the drain and the HUD button already use.

**Found on the way: a scar ate keys.** `packScar` took every ore in the hold, and since AK that
includes keys, so sealing a scar could spend the ruby the next gate asks for. Keys are now skipped
by `repairValue` and `packScar`. The hold's weight is taken down by what went in; it used to be
zeroed.

Receipts: `test/repair.test.mjs` (the stage follows the packing and never reopens, a trip or two
closes one, keys are never taken); the scar e2e (no SEAL before the first core, the key kept, no
percentage in the line, the plinth drawn at a later stage after a press); `npm run film
scarseal`.

### AH: the ending, the light leaves

Built 2026-09-25, on his answer of 2026-09-24 that the ending shows the light leaving and not a
creature. One pure timeline, `src/sim/ending.ts`, about 10.4 s long. The renderer only reads it.

1. **The lights gather (3 s).** Each spent core's light leaves its scar as a streak (`moteAt`:
   fast out of the scar, slow into the center, where the camera is). The one core light rides
   with them. The scars go dark and stay dark afterwards: the light is gone, not resting.
2. **The flare (0.8 s).** Gathered at the center, the light flares and goes out.
3. **The cut through black (0.3 s in, 0.9 s out).** The fade is on the timeline, not a timer. A
   timer version was stretched across the whole filmstrip.
4. **The dark (4.6 s).** The camera is at the pad and the dark comes up out of the ground over it
   (`uLmEnd` darkens everything below a rising front, in `coreLit` and `coreGlow`). The first
   version rode the camera up the world ahead of the dark and filmed four seconds of black: the
   eye was inside solid rock, which nothing lights.
5. **The sky (1.6 s).** The sky over the pad turns from the core's colour darkened to the core's
   colour itself, and it stays that way after the ending.
6. **The card.** Only now. STAY brings the camera back to the ship and lifts the dark over 4 s.

For the whole ending the game is in `event` mode, so nothing can hurt the ship or move it while
the camera is away, and `body.ending` hides the HUD, the toasts and the heat and fuel washes.

**Found here, not fixed: the surface sky has never shown.** The tunnel haze is an additive
full-screen plane that writes alpha 1, so the canvas is opaque everywhere and the CSS sky gradient
(the dawn, the planet's colours) sits behind it unseen. The sky a player knows is black with
stars. Fixing it would turn the surface sky blue by day, a large change nobody asked for, so the
ending draws its sky on its own plane (`setSkyTurn` in barrier.ts). The question is his.

Receipts: `test/ending.test.mjs` (the card comes last, the order of gather, dark and sky, the
motes' ends, the cut through black); the Vault e2e (no card while the light leaves, the ship not
flyable, the camera home after STAY); `npm run film vaultend`, the whole ending.

### AK: minerals become ingredients

Built 2026-09-25. Money (copper, iron, silver, gold, geodes, lodes) sells at the pad and nothing
else about it is kept; keys (amethyst, emerald, ruby, magmite, coreite, umbrite, Solmarrow) are
banked when you dock, never sold, worth nothing on the haul readout, and never handed out by a
cache - a cache's mineral prize pays out as credits. A line's first band is credits only, its
second band asks for one key and its third for a deeper one (`keyBand`, the same steps the level
cap takes at the barriers), two of a common key a rung and one of magmite or coreite; the Drill
ends on Solmarrow and the Hull and the Cooling Rig on umbrite, which nothing asked for before.
The Cooling Rig's first key is magmite, from inside the heat zone, so the heat run still comes
before the heat protection. The Scrubber and the Reactor Core are cut - invisible multipliers on
rows of their own - and refunded in full on load; the Fuel Tank's top three rungs carry the
fuel-per-cell saving and the two weapons carry the power. Every line now names one of the six
systems the fitting bay will show.

`test/keys.test.mjs` pins the shape: every key asked for, the rock holding at least 2.5x each
key's whole ask, no key sold or cached, the first band free of keys, a capstone never asking for
two. One fault found on the way: the device crates were seeded by their place in the list, so
cutting the Reactor's crate moved the Drone, the Autopilot and the Cutting Laser (281 m to 320
m); each device now has a fixed seed slot and they are back where they were.

**The probe, and what it says AL has to fix.** Keys changed the ladder's shape exactly as asked:
tier 0 is bought on credits (7 purchases waited on credits, none on keys), tier 1 on both (6 and
7), tier 2 on keys alone (12). But tier 2 now takes 42.5 game-minutes against 29.4 before, the
Vault at minute 74 against 48: magmite, the heat-zone key, is thin in the rock and the probe
spends most of tier 2 hunting it. That is the "wall, not a hunt" the research warned about, and
it is AL's first target - every key a home and at least four pockets - with credits made to bind
in tier 2 again by cutting the geodes that still carry the money.

### AN: the fitting bay

Built 2026-09-25. The walked gas station is gone - aisles, cases re-sorted by price, the
supplies drawer, the dots, the four arrows and the swipe hint - and so is 750 lines of
`station.ts` that drove them. The shop is one screen: the ship on its lift in the top of the
frame (drag the stage to turn it; it drifts back into a slow turntable when left alone), six
system icons at 56 px in the reachable third (DRILL, HOLD, ENGINES, HULL, SENSORS, ORDNANCE),
and the chosen system as a scrolling rack of cards in a fixed-height sheet. Each card says in
one sentence what the line does (`WHAT` in config.ts), shows the number going from and to,
names the keys it wants and how many you hold, and carries its own FIT button with the price.
Two taps from an open bay to a new level. A found device is a card like any other; one never
found is not shown. Supplies are cards in the system they serve (`SUPPLY_SYSTEM`). A tap on a
part of the ship opens its system; a drag on the stage turns the ship and a drag on the rack
scrolls the rack, never both. Buying swells the new part and leans the camera in, with the
buy haptic. The keyboard drives it too: left and right for systems, up and down for cards,
Enter to fit. The header says where you are - THE PAD or GATE n - not a vestigial planet name.

**Every line has its own part on the ship.** Eight lines had none and six showed a plain
steel cube in the old room: hull plates, the magnet's coil, the survey's probe, the receiver's
whip antenna, the drone, the autopilot's beacon, the charge rack and the laser's barrel are
now real geometry in the ship's materials, one or two meshes each so a fully fitted ship stays
inside the draw-call budget (the budget e2e still passes). Found on the way: the ship lives on
its own light layer, and a raycaster only sees layer 0, so a tap on the ship hit nothing until
the pick ray was told to see every layer.

Receipts: e2e tests that open the bay, reach the last card of the longest rack at 360x780,
fit a level in two taps, find the ship clear of the strip, and leave by the X; that a stage
drag turns the ship, a rack scroll does not, and a tap on the drill bit opens DRILL; that every
line has a part on the ship. The room's aisle geometry is still built by `stationroom.ts`, out
of the camera's view; AO rebuilds the rooms around the same lift and retires it there.

### AL: where minerals sit

Built 2026-09-25. **Keys left the ore ladder.** Each is a fixed set of one-cell pockets placed on
its own seed (`src/sim/keys.ts`, offsets 1301-1309) inside a depth window, 60% of them in one
home region the Survey map can point at and the rest anywhere in the window, so the home is
where to hunt and never the only place to look. A pocket is one key and a rung asks for one key,
so every find is exactly one rung and no find is ever a band - the one-vein-finishes-the-laser
fault is gone by construction. Windows and pockets: amethyst 85-205 m (40), emerald 118-222
(40), ruby 150-320 (36), magmite 200-340 (40, home on the top edge of the heat zone), coreite
250-392 (20), umbrite 300-392 (10), Solmarrow 345-394 (5). Every window ends above the door.
Keys draw as their own crystal - a fan of long six-sided points out of one spot, glassier and
brighter - never as a money ore's scatter of flecks in another colour.

**Money thinned and moved.** Copper stops rolling below 150 m, iron below 220, silver below 300,
gold below 398, so the commons are shallow finds again rather than the commonest thing at the
bottom. Geodes went from 6,200 credits to 1,500 and to about a third as common above the second
gate, which takes them from 69-76% of the first tier's value to 25%; below the second gate they
come back at three times that rate, because there money is gold, lodes and geodes and the
heat-zone rungs have to be paid for. The upgrade price curves eased (1.55 to 1.42 a level, 1.5
to 1.38, 1.6 to 1.45), since keys now hold back the upper bands and the old top-rung prices
were set for the geode economy - the Cooling Rig's last level went from 102,516 to 57,188.

**Three things the tuning found, all written down because each one looked like a balance
problem and one was not.** Two a rung of the common keys turned tier 1 into seventy
game-minutes of fetching on the probe, so it is one a rung. Magmite's first home at 230-340 m put
every pocket in heat the Cooling Rig was needed to survive, and the rig needed magmite: the probe
sat on 130,000 credits unable to reach any, so its home moved to 200-226 m, a heat run you can
live through. And the probe itself had stopped one metre above every barrier it opened, so its
shelf never stepped past the first cap - which also inflated every tier-2 figure recorded before
this, including AA's 25.5 and AK's 42.5 minutes.

**The probe now:** tier 0 8.4 game-minutes, tier 1 17.6, tier 2 26.9, the Vault at minute 55.
Credits and keys both bind: 5 and 0 purchases waited on them in tier 0, 8 and 5 in tier 1, 1 and
10 in tier 2. The probe hunts a key the way a player reading the map does - only for the line
that fixes what stops its next goal, only once the credits are banked, and up to three nearby
pockets a trip.

Goldens, diffs read first: the frozen world changed 345 of 14,118 recorded cells (2.4%) - 128
started being ore, 118 changed ore, 44 stopped - and ore cells went 740 to 824 as the old key
rolls fell to gold and silver; `blocks.json` changed 1,127 of 27,755 cells on the reference
planet, all key, money-ceiling and geode cells. `test/keys.test.mjs` pins the placement: at least
four pockets a key, one key a pocket, at least half at home, geodes at most a quarter of the
first tier's value, no money ore below its ceiling. The X4 richness overlay now reads the key
homes, which is what AM builds on.

### AM: a key find is an event, and a hunt

Every key cell is the whole event, since a pocket is one cell. The cut flashes the screen in the
key's own colour, sprays it, plays the relic sound, buzzes 15 ms (`hap.key`), toasts the name and
the count aboard, and marks the map with an outlined diamond in that colour (outlined so an
emerald never reads as the green FOUND mark). The first of each key gets the discovery card with
its own head and footer: NEW KEY, and "banked at the pad, never sold" in place of the ore card's
"sell it at the pad", which was the one wrong instruction on it.

The camera then leans a third of the way toward the cell and 1.2 units closer for 0.6 s
(`R.keyHold`). It is camera only, it ends on the frame the held direction changes, and it never
starts within a second of the hull going down. That is how "never while touching a hazard" is
read: the find still counts and still marks the map, but the screen is never taken while the
ship is being hurt. The hurt clock reads the hull itself, so a new hazard cannot forget to tell it.

The hunt: `keyNear(x, d, range, dug)` in `src/sim/keys.ts` returns the nearest undug pocket's
NAME within range and never its cell or bearing, the Receiver's own fence. Range is
`2 + scan * 0.5 + survey * 1.6` cells, so the starter rig hears only what the drill is about to
touch and a full Sensors line hears about eleven cells, not the screen. The HUD shows it as a chip
over the dials, "EMERALD NEAR" in the key's colour. The map names each key's home region, "EMERALD
LIVES HERE", once the key's window starts above `reachableDepth(gates)`.

Receipts: `test/sense.test.mjs`; three e2e specs (the mark and the lean and a turn ending it, no
lean while hurt, the chip naming a key and going quiet once it is cut); `npm run film keyfind`,
two finds of one emerald on one strip.

### AO: gate vendors

The bay is the same at every counter and the room around the lift is not. `stationroom.ts` lost
its aisles, its four department counters, its drawer and `stationsigns.ts`. It now builds one
bay: a deck, the back wall with the terminal and gauges, and a lift under the ship. There are four
dressings switched by visibility, so a room swap costs nothing per frame:
- the pad: iron, the pump, and cyan
- gate 1: rock and lamps, amber
- gate 2: crystal through the walls, violet
- gate 3: a red seam of heat

The same three point lights serve every room. The first dressing put its props at x 2.5, and all
of them were off the edge of the screen: portrait at a 46 degree field is about three units wide
at the back wall. Everything now sits inside x -1.5 to 1.5.

The stock rules live in `src/sim/vendor.ts`, which is pure:
- **The pad** fits every rung and is the only counter selling supplies for credits.
- **A gate** fits every rung up to the top of the tier it opens onto, and none past it. The last
  gate fits everything. The first version fitted only the gate's own tier band, and a player
  arriving a rung behind found nothing on the counter to buy.
- **Every gate** trades one supply a visit for a key the tier above it yields: a Fuel Cell for 1
  amethyst, a Hull Patch for 1 ruby, a Bulwark Field for 1 coreite. `R.dealTaken` clears on the
  arrival edge.
- **The first gate** teaches Sink once, for 4,000 credits and 2 amethyst.

These gate-only cards sit at the top of the rack under THIS GATE ONLY, and a gate's bay opens on
the system holding them.

The save moment: arriving at a gate writes the checkpoint as before, and now also shows a plate,
"SAVED · GATE n", for 2.5 s of game time. The bay's header reads "GATE n · D M · SAVED HERE".
Also found here: the heat and hull washes stayed over the bay when you docked at a hot gate, which
turned the violet room brown. `body.docked` hides both now.

Receipts: `test/vendor.test.mjs` (no two counters stock the same thing, supply and trade rules,
Sink at the first gate only, rung bands); three e2e specs (the save plate and the gate's own room;
Sink once, one trade a visit, no credit supplies at a gate; the pad sells supplies and never
Sink); `npm run film gatebays`, the pad and the three gates. The campaign probe shops only at the
pad, so its pacing is unchanged.

### Fable's second review, after the research, and what it changed

- **One wrongness colour, defined once.** Hollow Knight's Infection works because orange
  belongs to nothing else. The core's light is that colour, held in one constant, and the
  pips, the scar and the gate room borrow it; nothing else may use it. A test greps for it.
- **The barrier's look lives in its rails.** Additive fresnel and scrolling noise is the
  stock asset-pack forcefield, and his one line about this game's look was "cartoonie".
  The emitter rails are real geometry with the ship's rock-and-metal treatment; the field
  between them is thin and reads as heat shimmer.
- **Back is only proven on the phone.** A desktop test can prove the close stack pops; only
  the installed app can prove Android back reaches it rather than killing the game. AB's
  receipt carries a phone reading, the stack is the only way any panel opens (so AG's room
  cannot miss it), and every panel must scroll to its last item.
- **The HUD slims without losing what decides a surfacing.** Credits and haul stay; only
  duplicates fold. Anything more waits for his word after he plays it.
- **AG, the gate station, moved into the shop overhaul** he asked for the same day (the
  fitting bay and the gate vendors), so it is planned there rather than twice.
- **The probe's minutes are a floor.** A probe never hesitates, so AA's table is a lower
  bound that his own session times replace.


## Round seventeen, the shop and the minerals

His ask of 2026-09-25, verbatim: *"Can you also do a full overhaul of the shop for visuals,
structure, and how upgrades are purchased? Along with restructuring where and how much of
different valuable minerals/ore is found? I want it to be more rare and feel exciting when you
find some. I also want it to be rebalanced, so it feels like they are key ingredients you are
trying to find."* It is the second time he has asked for rarity: X1-X4 answered 2026-09-19 and
did not land. Two audits (every one of the 61x452 cells counted with the real generator, and the
shop read end to end), two research briefs, and two Fable reviews shaped what follows.

### Why the rarity pass did not land

1. **Selling also banked the ore**, so spending a mineral cost nothing: a free tally of where you
   had been, never a choice.
2. **Geodes were the economy.** No recipe uses them, and they were 69% of all value in 0-113 m,
   paying more per kilo than every ore above coreite.
3. **Money swamped minerals.** The world holds 4.5x the whole shop's credit price.
4. **Caches out-supplied the rock**: 58 coreite from caches against 17 in the ground, 9 Solmarrow
   against 3. The legendary key most likely arrived as a toast.
5. **Recipes asked for the wrong things**: copper 51 and silver 42, ruby 6 and coreite 4. The four
   commons are 5-14x oversupplied and only gate from level 4, past 113 m.
6. **One vein finished a recipe.** A single coreite vein is 70% of the laser's need.
7. **Nothing had a home.** No ore reads its region, so the X4 map's "rich" meant geodes and noise;
   ore density is flat at 6-7% of cells at every depth.

### What the shop was

A walked gas station: five camera stations, four aisles, cases re-sorted by price between
counter and rack, a supplies drawer, dots plus two arrow pairs plus swipe plus a hint to get
around, 3-7 taps to own a level, no X and no back. Sixteen rows, four of them each answering hull
damage, seeing and fuel; six shown as a plain steel cube; effects as bare multipliers; a found
device's sentence shown once at its find and never again. The gate shops were the same room.

### Decisions

- **Money and keys.** Copper, iron, silver, gold, geodes and lodes sell. Amethyst, emerald, ruby,
  magmite, coreite, umbrite and Solmarrow are keys: they ride in the hold by weight, bank on
  docking, never sell, and a hull loss takes only the hold, never the bank. Every reference game
  with a special material keeps it out of the sell pool (SteamWorld Dig's orbs, Deep Rock's
  crafting minerals, Dome Keeper's cobalt at 10:1 over iron); selling keys at a poor rate would
  only let a desperate player sell the ruby the next gate needs.
- **Credits still bind.** Rungs 1-3 of a line are credits only, and credits gate every rung and
  every supply, so every sale at the pad is for something; keys gate each band past the first.
- **Every key has a home and many small pockets.** A depth window, a home region on its own seed
  offset, at least four pockets, none holding more than a third of any one rung's ask - no source
  was found for this ratio, and "one find finishes it" is this game's own finding.
- **A find is an event per pocket, and a hunt.** Detection in Terraria and Deep Rock names what is
  near and never marks the cell; the Sensors line does the same for keys.
- **One bay, everywhere.** The ship on a lift in the top 60% as a rotatable model, six system
  icons, the chosen line as a scrolling card rack in the bottom sheet where the thumb rests
  (Hoober's thumb zone), two taps from open to owned, before-to-after shown the way Hill Climb
  Racing 2 previews an upgrade. A drag on the model rotates it and a drag on the sheet scrolls it,
  never both. Gate vendors are different rooms around the same lift, never a second UI.
- **Sixteen rows become six systems.** DRILL (bit; the laser as its sealed-stone rung, carrying
  its own power), HOLD (cargo; magnet), ENGINES (thrusters, tank; autopilot), HULL (plating,
  cooling, drone), SENSORS (scanner, survey, receiver), ORDNANCE (charge). Reactor and Scrubber
  are cut: invisible multipliers.
- **Order**: AK first (pure sim, the thing that failed twice), then the bay (AN) so the keys have
  somewhere to show, then placement (AL), the find (AM), and the gate vendors (AO).


---

# Engineering reference

Moved here from the pre-migration CLAUDE.md on 2026-09-22 (studio migration): stack notes,
the file map, and the invariants and calibrated numbers a change here can silently break.

## Stack

The standard web stack from `WEB.md` in the notes. This game's own pins and choices:

- **three.js pinned to exactly `0.166.0`**, with `@types/three` at the same version. Not a
  caret range: the lighting values below are calibrated to it, and three ships no
  declarations of its own.
- **Audio is 100% synthesised at runtime.** Kept that way because it is genuinely better
  here, not because of any restriction — the score has layers that mix by depth, danger and
  zone off one scheduler, which a recording cannot do.
- **Binary assets are imported when the rule in `ASSETS.md` says to, and that rule is a
  MEASUREMENT: import what the player reads at its real size.** This line used to claim the
  only binaries were two `woff2` fonts, which stopped being true the day the rock textures
  landed and was still being repeated afterwards - a rule that misdescribes the repo teaches
  the next session something false about what is allowed.

  What is actually here: two `woff2` faces in `public/fonts/` (in the Workbox glob, or the
  installed app falls back to a system face offline), and three WebP maps in `src/textures/`
  imported through the bundler so they are hashed and precached - the rock maps for the
  terrain. (A fourth, a normal map for the planets of the old space intro, went with that
  scene on 2026-09-12.) Every one is a
  **normal or roughness map and never a colour map**, which is what lets a photographed
  texture into a flat-shaded game at all: the palette keeps deciding colour and the import
  only adds relief.

  The one thing still synthesised on principle is **audio**, and it is a reason rather than a
  habit - both CC0 libraries need a browser session or an API key and cannot be fetched
  unattended, and this score mixes by depth, danger and zone off one scheduler in a way a
  recording cannot.

### Files

**`src/sim/` is the simulation and has no renderer in it** (INDEX.md standing rule 2). It is
what `test/pure-entry.ts` bundles for the goldens, so it must keep running under node with no
three.js, no DOM and no audio context. `test/sim-boundary.test.mjs` enforces that by reading
the files: no three, nothing but `import type` crossing out of the directory, no renderer or
input globals, and no unseeded roll. Persistence is deliberately inside the wall, the same way
`save.gd` sits in `src/sim/` in the Godot games. Everything else in `src/` is presentation and
may import freely from `src/sim/`, never the other way.

| Path | What it is |
|---|---|
| `index.html` | Shell: all CSS, HUD, d-pad, kit and ordnance buttons, the station screen, error overlay, SW registration |
| `src/main.ts` | Boot sequence only |
| `src/types.ts` | Domain types. Type-only, emits nothing |
| `src/env.d.ts` | Ambient declarations for the Vite `define` build stamp |
| `src/sim/config.ts` | Tuning constants and pure functions over them. Imports only types |
| `src/sim/util.ts` | `key`, `clamp`, `mixHex`. Imports nothing |
| `src/sim/runtime.ts` | `R`, the mutable loop state that crosses modules. Imports nothing |
| `src/sim/state.ts` | `g`, derived stats `S`, relic perks, save/load |
| `src/sim/telemetry.ts` | The run log: numbers to balance against, accumulated as `+=` and summarised only when a panel opens |
| `src/sim/light.ts` | The lighting solvers: the flood through open cells and the shadow ray fan |
| `src/lightmap.ts` | The solved field as a texture, the shader injection, and the haze quad |
| `src/shader.ts` | `chainCompile`, the one way anything patches a stock three shader |
| `src/sim/feel.ts` | Every number that decides how it *feels*, plus the pure reducers (`tremorTick`, `chargeAfter`, `soakAfter`) |
| `src/sim/world.ts` | Generation, `blockAt`, `findRoute`, `planCollapse`, `cachePrize` |
| `src/sim/fly.ts` | Collision, thrust, and the hull's facing geometry (`FACE_ANGLE`, `headingFor`). No renderer, fully unit-tested |
| `src/scene.ts` | Renderer, camera, lights, fog, backdrop, `resize()` |
| `src/materials.ts` | Shared geometry and materials, rock displacement shader, procedural textures |
| `src/blocks.ts` | Instanced terrain, pools keyed by block id, haloes, `beginDig`/`dropBlock` |
| `src/ship.ts` | The drill ship, headlight cone, drill tiers |
| `src/pad.ts` | The landing platform |
| `src/drops.ts` | Ore left lying where it fell |
| `src/relic.ts` | The buried relic and its proximity finder |
| `src/mark.ts` | The deepest-reach marker line |
| `src/beam.ts` | The cutting laser's visible cut |
| `src/parallax.ts` | Distant rock behind the tunnels |
| `src/particles.ts` | Sprays, stars, sun |
| `src/dust.ts` | The lit mote field. World-anchored, wraps around the ship |
| `src/audio.ts` | The whole audio graph, score and effects |
| `src/ui.ts` | The `ui` element map, HUD, station screen, manifest, patch notes |
| `src/input.ts` | All d-pad, keyboard and button wiring |
| `src/actions.ts` | Sell, autopilot, ordnance, supplies, tremor, `stopDigging`, the Anchor / wake / Vault moments |
| `src/loop.ts` | `frame()`. The one big function |
| `src/sim/ambience.ts` | What a world DOES in the air: per-trait emission timing |
| `src/sim/intro.ts` | The first-run intro: its beats, their shots and their timing |
| `src/titleui.ts` | The title screen and the intro, wired to the DOM |
| `src/sim/region.ts` | The twelve regions, their names and traits, and the map's coarse tile grid |
| `src/sim/vaults.ts` | The nine Anchors, the authored room templates, and the Vault at the centre |
| `src/sim/unrest.ts` | Unrest per region, the Ballast, collapse, the wake at the fifth Anchor |
| `src/collapse.ts` | What a collapse and a shoring do to the world; the ground closing behind you |
| `src/mapui.ts` | The Survey screen, on a canvas |
| `src/ballast.ts` | The Ballast on the pad. Sight glass, dial, stack, tier collars |
| `src/titleui.ts` | The title, the intro and CONTINUE, over the game's own scene. The timelines are `src/sim/intro.ts`; the loop draws them |
| `src/changelog.ts` | Version and the player-facing what's-new list |

**Import direction is one-way and load-bearing:** types → `src/sim` (config → util → runtime →
state → region/unrest/vaults/feel/fly/world/light/ambience/intro) → shader → lightmap → renderer
modules → ui → actions → loop. `actions.ts`
deliberately does *not* import from `loop.ts`; `FACE_VEC` is duplicated there instead, because a cycle that only works
because of when each binding happens to be read is a trap for whoever moves a call next.

---

## Invariants

Things that will silently break the game if changed without understanding them.

**World generation is a pure seeded hash.** `rnd(x, d, planet)` decides every cell. Anything
new that generates content **must roll on its own seed offset** — caves on `planet + 77`,
pockets on `planet + 41`, seams on `(x + 61, d + 17)`. Consuming the ore roll shifts every
value at every depth on every planet, and the diff looks like three lines.

**`test/baseline/blocks-frozen.json` is frozen and is re-recorded only for a deliberate ore
rebalance** - once so far, in round seven, with the diff read first and written down. It is the
world as it stood before pockets existed, with its own id legend, and the test asserts the only
legal difference: a cell kept its id, or a known overwriter replaced it. Re-recording it is
exactly the mistake it exists to catch.

**`GRANITE_TO_SCORIA === HEAT_DEPTH`, both 70.** Four things land on that metre: the rock band
changes, the sky and fog warm, the hull starts draining, the vignette builds. A test asserts the
two constants stay equal because they drifted apart silently once.

**`ORES` is ordered deepest-first, and each entry's `chance` is strictly lower than the next.**
That is what makes adding a new deepest ore convert only the ore directly above it rather than
reshuffling every band. There is a test.

**`g.planet` and `g.world` are both zero and both vestigial.** They were the LEG and the
IDENTITY of a world on the chart, back when the game was a chain of planets. There is one
planet now; they survive because they seed the generator and because the frozen baseline is
recorded against them, and `setWorld(p)` still exists for the tests that walk the old
snapshots. **Nothing new should read either of them** - `regionAt(x, d)` is the question you
actually want, and `traitAt` / `paletteAt` / `worldTrait()` all go through it.
**Receipt: `test/vestigial.test.mjs`**, which freezes the count of reads per file (75 across
eight files at v0.48.0) and fails naming the file that gained one. It is a census and not a
ban because the generator and the save are legitimate readers; what it stops is the trend,
which is the part prose cannot hold - every single addition looks harmless beside the
seventy-five already there. It carries a third test asserting the census still FINDS the
fields, so renaming them cannot turn the other two green by making them inspect nothing.

**Unrest is PER REGION, and `tier` is derived from `lit`.** `g.ground.unrest` is twelve
numbers; a single planet-wide figure would be a second fuel gauge - it rises, you cannot point
at where, and there is nothing to do about it. And the number of Anchors lit is
`g.ground.lit.length`, never a stored count: two numbers that must agree is one number with a
bug in it. `woke` IS stored, because the wake applies a one-off step to every region and the
flag is the record that the step has been paid.

**Anything that can reach `g.cargo` must have a `DEF` entry.** The manifest, the debrief and
the sale all look materials up by id. Cut stone does not have one and is flagged `spoil`
instead, which is why breaking a wall puts nothing in the hold. This shipped as a crash: the
game ran, the manifest opened, and then it did not, depending on whether you had cut through
an Anchor hall since you last looked. There is a test that sweeps the world for it.

**A collapse has two fences and both were found by a long play, not a unit test.** It never
takes a region holding an Anchor nobody has lit, and never more than `MAX_COLLAPSED` at once.
Without them the cascade has no bottom: each collapse removes ground you earned in, which
makes the Ballast harder to fill, which takes the next region.

**Per-cell maps carry no planet in their keys.** `dug`, `rubble`, `damage` and `drops` must all
be cleared together on a planet change, or the new world inherits the old one's holes.

**Every shader injection goes through `chainCompile`, and never through a bare assignment
to `onBeforeCompile`.** A material has exactly one of those, so an assignment silently
discards whatever was already there - and the result renders perfectly, just wrong.
Relatedly, **`Material.clone()` drops `onBeforeCompile` and `customProgramCacheKey`
entirely**: the drilled block is the only cloned material in the game and it has to have
its displacement and its lighting re-applied by hand. There is an e2e test that reads the
compiled shaders back out of WebGL and fails if any rock program has lost the light.

**Every uniform the lighting shader declares must be supplied by `inject()`, which is why
that loops over `U` rather than listing names.** GLSL gives a missing sampler texture unit
zero and a missing vector all zeroes, so the shader compiles, runs, and silently ignores that
part of the model - the shadow fan shipped inert on the terrain for exactly this reason while
the haze, which listed its uniforms by hand, worked. The haze now spreads `U` too. There is an
e2e test that reads the declarations out of the compiled shader and fails on any that nothing
supplies.

**`Object3D.layers` does NOT stop a light reaching an object, and the world is drawn in two
passes because of it.** Layers decide what a CAMERA draws; three collects a scene's lights once
and every lit material gets all of them. Putting the ship on `SHIP_LAYER` and leaving the lamp
off that layer excluded exactly nothing for three versions - the intensity-44 lamp sitting on
the ship was lighting it the whole time, which is why the hull rendered white however dark it
was painted. `renderWorld()` in scene.ts draws the world without the ship, then the ship alone
with the lamp momentarily at zero. `renderer.info.autoReset` is off and reset by hand there, or
the draw-call guard measures only the second pass.

**There are TWO lights and they must not be fused.** `coreReach()` lights rock faces:
flood x pool x lobe, and **never the shadow fan**. `coreReachAir()` lights the air in a tunnel:
the same terms plus the fan, over a much higher ambient. A rock face is lit by being near a lit
tunnel, which is a property of the rock; the air in a tunnel is lit by light arriving along it,
which a corner can block. Fusing them put hard-edged shadow wedges across every rock face in
the frame, and no amount of fixing the fan could remove a shadow that was never meant to be
there.

**The propagated light only ever darkens.** `coreLit()` is clamped to at most 1, so every
lighting value in `feel.ts` is still the ceiling it was calibrated to be. If the world ever
needs to be brighter, that is a change to the lights, not to the lightmap.

**The shadow fan records the distance to the farthest CORNER of the first wall cell it hits,
not where the ray leaves it.** The fan is sampled by angle and interpolated between rays, so a
fragment's occluder is a blend of two rays that may have clipped different parts of a wall;
with the exit distance, roughly an eighth of every wall face falls beyond its own occluder and
goes dark - a hard diagonal cut across every block in the frame, which reads as every rock
shadowing itself. There is a test that samples across a wall face and fails above five per
cent.

**The old rule, still true underneath it:** the fan records the FAR side of the first wall, not
the near side. A rock
face is the surface the lamp is falling on and has to stay lit; shadow starts behind it.
Recording the near side puts every rock face in the game into its own shadow.

**Rock is relaxed but never expanded by the solver.** That one line in `light.ts` is what
stops light passing through a wall into the chamber behind it. Without it every sealed
pocket glows faintly and tells the player it is there before they have dug to it.

**Every upgrade needs a display case, and station.ts throws at boot if it does not have one.**
`SLOTS` in station.ts is a hand-placed list and `UPGRADES` is a one-line addition in config.ts
a long way from it. The index used to wrap with `i % SLOTS.length`, which put four cases
*inside* four others where they were invisible and could not be tapped. The e2e asserts one
case per upgrade against `UPGRADES.length` rather than a literal, because the literal version
of that test said 10, failed for the wrong reason, and would have been "fixed" by editing the
number.

**Bedrock is unbreakable by ordnance.** (The planet core it used to share this note with is
gone - see the top of the file.) The rest still holds, and so do the four blocks that joined
it: the Anchor and the Vault core cannot be cut at all, and sealed stone and the Vault seal
cannot until the laser is found and the ninth Anchor is lit respectively. The old note read:
The core is a planet's climax and
has to be drilled by hand.

**A tremor must never take the run.** `planCollapse()` applies the collapse, re-runs
`findRoute()`, and reverts entirely if the ship can no longer reach the pad.

**The game boots into a screen, and the e2e crosses it rather than bypassing it.** `main.ts`
does all of its setup first and then shows the title (a save exists) or the intro (none), so
starting is hiding a div rather than loading anything. The shared `beforeEach` in the e2e
dismisses whichever appeared, and every spec that navigates itself calls `enterGame(page)`
after its own `goto`. **Do not add a bypass flag for this** - a flag would make the one path
every player takes the one path nothing exercises.

**The pause sheet doubles as the title's Settings screen**, changing only its heading and its
close button. It is already the settings screen - audio, restart, version, run log, what's
new, build stamp - and a second copy would be a second place for those to drift. `showTitle()`
puts the wording back, or the next in-game pause is still headed "Settings" with a BACK button.

**The error overlay is in `<head>`**, above the module script. Vite hoists the entry, so a
handler in `<body>` is registered too late. After changing the head, verify by deliberately
breaking an import.

**`AudioContext` needs a real user gesture.** `audioInit()` is on the first
`pointerdown`/`keydown`. The graph is built atomically and published only when complete, so one
null check narrows every node.

**A gate save point (Y8) must never become a second surface pad.** `climbCells()` and
`fuelToClimb()` always route the Point of No Return to the surface pad at `(START_X, -1)`,
never to the nearest open gate, and a gate checkpoint restores state exactly as the run left
it - never a free refuel or repair the way the pad gives. Y0b decided this after research
turned up one pattern across five games: the moment an intermediate stop gives something for
nothing, it functions as a second home and the decision to turn around collapses. See "Y0b:
what the save point does" above.

---

**Anything given `asMetal()` gets its colour almost entirely from the environment map.** A
metal has no diffuse term to speak of, so with a dark albedo the env IS the visible brightness -
painting the hull darker three times running changed nothing until the env's missing
`colorSpace` was fixed. If a metal object will not respond to its own colour, look at the
environment before anything else.

## Numbers that are calibrated, not chosen

**Lighting, for three.js 0.166.** Ambient 1.75 at the surface falling by 1.62 with depth; sun
1.5 fading out below the surface; rim 0.5 falling by 0.44; lamp a point light at intensity 30,
range `S.light()`, **decay 1.75**. Old tutorial values render nearly black under 0.166's
physically based lighting.

**The z stack: rock to 0.7, haze 0.74, lamp glow 0.80, ship 0.95.** The displacement shader
pushes rock vertices a fifth of a cell forward, so a tunnel wall bulges to z 0.7; the haze has
to clear that or those bulges draw over it as chips of lit rock floating in the fog. The ship
in turn has to clear the haze, or an additive quad centred on its own lamp washes the hull
flat.

**Propagated light.** Attenuation 0.78 per unit of DETOUR - not per unit of distance;
distance is the pool, evaluated per pixel from the ship's exact position so it does not step
as you fly. Rock seeps 0.32 per cell for three cells. Unreached cells settle to 0.06 of the
light they would otherwise get, which is dark enough to read as unreachable and light enough
to keep the rock's shape. Daylight gives out between 2 m and 14 m, read from each CELL's own
depth rather than the ship's, so the top of a shaft still glows from ninety metres down.
Rock seeps 0.62 per cell for three cells, which is 1.0, 0.38, 0.15, 0.06 once the contrast
below is applied - a wall, two readable layers and a third that is nearly gone. **Any threshold
about how dark something looks belongs on the post-contrast value**: two tests were written
against the raw field and both failed the moment the seep was retuned to exactly what a
playtest asked for, which is the wrong way round for a test to behave.

The multiplier is then SQUARED (`LM_CONTRAST`) before it is applied, because it multiplies
linear light that is about to be sRGB-encoded: six per cent of the lamp displays as roughly a
third of full brightness, which is how an early version came out as a grey wash over a field
that was numerically correct.

**Beam and bounce, combined with max() and never multiplied.** Direct light is the lobe times
the shadow; the bounce is a flat 0.22, omnidirectional and unshadowed, and both are gated by
the flood. Multiplied, somewhere both behind the ship and in shadow lands on the product of
two floors and goes black - which erases the shaft you came down. The bounce also has its OWN
falloff, 1.7x the beam's reach on a much gentler curve: sharing the beam's pool made the glow
behind the ship end exactly where the beam did, with the same hard edge, which is the one thing
the soft half must not do.

**Dust motes are anchored in the WORLD and wrapped around the ship, never parented to it.**
The field this replaced did `dust.position.set(px, py, 0)` every frame with a slow spin, and
that single line is why it never read as dust: a cloud that travels with you cannot move past
you, so a hundred metres of diving leaves the same motes in the same places. Wrapping costs a
modulo and does more than any amount of extra geometry. They are also lit by `coreAir` on a
hard curve (`DUST_LIT_POW`), which is what makes the beam read as a volume rather than a
gradient - a flat-lit mote field is just noise over the picture. They sit BEHIND the terrain
(z -0.55 to -1.25) so a mote only ever shows down a tunnel that has actually been dug, and they
fade out at the surface on the same ramp as the haze, or specks hang in the daylight over the
pad.

**The shadow fan records where a ray MEETS a wall, and that value has to be continuous in
angle.** The fan is sampled by bearing and interpolated, so anything constant across a whole
cell makes occlusion-against-angle a staircase - one plateau per wall cell - and each plateau
draws as its own cone. A single point lamp then renders as several separate beams, which is
exactly what a playtest called: *"it looks like you are creating the shadows by sending out
multiple cone shape beams ... since the light should be coming from one location it shouldn't
be split into more than one beam."* The entry distance is `(wall - lamp) / cos(angle)`, smooth
in angle, and jumps only at a real silhouette corner. **The old far-corner rule existed because
rock used to sample this fan; it does not any more** (`coreReach` has no shadow term), so that
justification is dead and re-adopting it brings the cones back. There is a test that sweeps
adjacent rays across a flat wall and fails on a jump over a seventh of a cell - it reads 0.033
correct against 0.293 for the old rule.

**The haze is an additive quad through a HARD per-cell mask, so its value must vary across
that mask or it draws flat cards.** This is the single most expensive thing in the file: five
playtest rounds of *"there is a circle of light around the ship"*, four correct fixes to things
that were not the cause. `LM_AIR_AMBIENT` is the bounce's share of the light in air, and the
bounce is omnidirectional with a long reach and a gentle curve - at 0.62 every open cell in the
connected tunnel network landed on nearly the same number, and a near-constant value through a
hard stencil does not read as fog. It reads as flat orange cards, one per cell, with
cell-aligned edges and 45-degree corners where they meet. It showed *approaching* a branch and
not at one because level with the branch you are inside its card; four cells above you see it
edge-on beside the shaft's, as a trapezoid. It is 0.20; above about 0.28 the cards return,
below about 0.05 a branch the beam has passed becomes a hole again. **Anything that raises the
floor under the air - a new ambient term, a bigger bounce, a wider glow - has to be checked for
this, and checked by hiding the haze quad rather than by reasoning about the shader.** There is
a test on the property, and there was none on any haze constant for the whole five rounds.

**Glow is dimmed on its own curve, not the surface one.** Ore glowing through unlit rock is the
find-the-vein mechanic and must not switch off, so emissive and the ore haloes go through
`coreGlow()` - a square-root curve over a small floor - rather than `coreLit()`. `LM_GLOW_FLOOR`
and `LM_GLOW_POW` are the dial if ore becomes hard to find rather than merely hard to see
through rock.

**Framing.** 18 rows solved into a camera distance in `resize()`, then multiplied by
`zoomForScan(g.up.scan)` — 0.82 at Scanner 0 up to 1.22 at 9. The Scanner *is* the framing;
that is most of what makes it worth buying. There is a test asserting the lit radius grows
faster than the frame, so an upgrade can never buy darkness.

**Portrait aspect is ~0.46.** The world is 13 columns wide and only 7–8 fit, which is
deliberate: which way to dig is a real choice rather than a formality.

**Flight.** `FLY_ACCEL 18` (~0.2 s to top speed), `FLY_DRAG 9` (~0.75 cells of coast),
`SHIP_R 0.34`. If flight needs tuning, it is these three and nothing else.

**Bands.** Heat at 70 m, tremors at 85 m, cave systems from 26 m, gas from 34 m, geodes from
52 m, caches from 20 m, relics below the halfway mark of each planet.

---

## Save data

`localStorage`, keys `coreward.v2` (game, with a migration from `coreward.v1`),
`coreward.audio` (toggles and volumes), `coreward.haptics` and `coreward.hint.aisle`.
"RESTART PROGRESS" clears the first two. Typical save 339 bytes, worst case measured 12.5 KB
against a ~5 MB quota — size is not a consideration.

**The keys keep the old name on purpose, and it is not an oversight.** localStorage is scoped
to the ORIGIN, and the origin did not change when the game was renamed on 2026-09-13 - only
the path did - so leaving them alone is exactly what carries a campaign from
`/coreward/` to `/lattice/` untouched. Renaming them would orphan every existing save unless
migrated, and the migration path in `load()` applies the **v1 schema** conversion (credits
× 4, and so on), which run over a v2 save is not a migration, it is corruption. A private
identifier nobody reads is not a stand-in that owes anyone a rename.

Old saves are handled forward, not broken: `grandfatherStock()` grants exactly the materials a
pre-materials save already paid for, and every new field defaults.

**Seeding a save from the console does not work naively** — the game saves on
`visibilitychange`, so the outgoing page writes live state back over the seed on reload. Freeze
`Storage.prototype.setItem` for that key first.

---

## Feel

The numbers live in `src/feel.ts` and are pinned two ways by `test/feel.test.mjs`: a snapshot
that fixes the values, and separate assertions on *intent* — ore lands heavier than rock, the
core is the biggest shake in the game, hit-stop stays in the range that reads as weight. The
intent tests survive a retune; the snapshot does not.

If you retune anything there, re-record the baseline and **check it on the phone**. A desktop
cannot tell you whether hit-stop still lands.

- **Hit-stop** pauses the *simulation* for 35 ms on rock, 75 ms on ore. Camera and UI keep
  running off `raw` rather than `dt`. Do not collapse those two deltas.
- **All smoothing is `1 - exp(-rate * dt)`** via `approach()`, and every rate goes through
  `asExpRate(n)` so it covers the same fraction per 60 fps frame as the number that was
  originally tuned by eye. The baseline records those fractions, which is the proof the fix
  changed nothing at 60 fps.
- **Three feedback channels per action**: particles in the block's colour, a pitched sound,
  screen shake, plus a squash on the ship.
- **Autopilot flies a Catmull-Rom spline** over a breadth-first shortest route. Stepping cell
  to cell read as a fast-forward and was rejected in playtest.
- **Fake bloom** is a 64px radial-gradient canvas texture on additive instanced quads. Pulse
  by animating *scale*, not opacity — the material is shared.
- **Sky is a CSS gradient** on `#game`, updated ~8×/sec. The renderer runs `alpha: true` with
  no scene background.

---

## Local development

```
npm install
npm run check      # THE GATE before any commit touching src/ or test/:
                   # typecheck, tests, build, size, e2e, in the order that fails fastest
npm run dev        # vite dev server, no service worker
npm run build      # production build into dist/
npm run typecheck  # tsc --noEmit, app and e2e
npm test           # golden tests, ~1.2 s
npm run e2e        # Playwright against the built game
npm run size       # bundle drift guard
npm run size:update
npm run preview    # serve dist/ exactly as Pages will
```

Node is at `C:\Program Files\nodejs` and is on the user PATH, so a **new** terminal has it.

Service workers are off in `vite dev` on purpose. The in-app Claude browser cannot register
one at all, so any PWA check has to happen in real Chrome or on the phone — and that browser
also stops `requestAnimationFrame` when its pane is hidden, so anything on a timer must be
tested through a pure reducer rather than by watching it.
