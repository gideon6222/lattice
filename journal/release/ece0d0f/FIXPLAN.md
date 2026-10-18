# Fix plan: lattice at ece0d0f

sonnet at medium effort, 1 pass(es), $0.00. From the loop's findings.json, 2 dropped before the plan.

Ship line: C: 4 advice, 4 taken, 0 kept, 0 later. Other advice: 5, 1 taken, 3 kept, 1 later.

Stop rule: one pass per box plus one retry. A box that fails its retry goes to the coordinator, and a must still open then blocks the ship until the coordinator rules or he speaks.

## Boxes (4)

### 1. The bay's Next line leads to the barrier and feats stay dark until met (bay guidance, about $6)

Code: in src/sim/bay.ts a feat is named and shown only once its counter has moved or its hazard is in reach, and the Next line then falls through to the nearest dig and the barrier with its three Anchors, per DESIGN.md's own 'then the barrier or depth that opens a rung' and his words 'Make sure the player knows the objective'; this also removes the Resonance Tip card at 32 m so one screen shows one next goal.

- **C1** [advice] The bay's one guidance line always names an unwon feat first, and every feat counts as reachable at 0 m. So for the whole first tier, and likely into the second, it reads "Ore Sorter, sell a full hold", then "Pressure Se
- **C2** [advice] The gas feat and the hard-rock feat are shown from the first dock, before the player has met either. The DRILL rack's sealed card for the Resonance Tip appears at 32 m and says "keep cutting hard rock". Rock that counts 
- **A14** [advice] In tour frame 7 (Rustmoor, about 32 m) the bay's Next line says 'Ore Sorter, sell a full hold' (a HOLD item). The open DRILL tab shows a different sealed card, Resonance Tip. The catalog says Resonance Tip is first shown

### 2. Goal words say what counts, the Dense Shell cause is shown every time, small text is readable (words and legibility, about $7)

Code and words: name the thing in each feat goal without adding a count to the Next line, show the sink-damage cause each time hull is lost to a Dense Shell (rate-limited), give the feat gift card its own EARNED head with the feat's done line and one name for the shop, lift small-text contrast and move the X clear of THE WAY OPENS body text, and commit LOOK.md confirming the draft style.

- **A3** [should] Resonance Tip reads 'Handed over when you keep cutting hard rock'. Pressure Seal's goal is 'ride out some gas'. Both are running totals across runs, and the Next line is deliberately never given a count, so it shows no n
- **A5** [should] Dense Shell is four times harder and costs hull when I sink through it. The warning appears only the first time one is touched in a session ('slow to drill, and sinking through it costs hull'). If I miss that line, the d
- **A7** [should] In the 'THE WAY OPENS' panel, the body text is dim grey-violet on purple, and the X button sits on top of the first line of it ('Whatever was' is clipped). Other small text is hard to read: the 'Next:' line in the bay, t
- **C4** [advice] A feat's gift arrives on the same card as a dug-up device, "DEVICE RECOVERED · FITTED · UPGRADE IT AT THE OUTFITTER". It never says it was earned, or by what act. So the full hold that earned the Ore Sorter goes unthanke
- **B0** [should] Commit LOOK.md: the tag has none, so B wrote only a draft style and named no change. Confirm the draft or write the game's own.

### 3. The gate reads as a wall, a broken core warns of its cost, the last hint lands before the door (barrier and Anchor feedback, about $7)

Code: draw the gate row as a visible wall with a spark when drilled (look only, the barrierSays text stays), add one line to the core card that the heat line, dust and tremors worsen, and move hint 3 to when the last tier 3 Anchor breaks or core 3 first glows; each new roll uses its own seed offset and blocks-frozen.json is untouched.

- **A8** [should] The simulation marks the gate row as `gate`, which is uncuttable. blocks.ts draws those cells as the rock the row runs through, and the field is a thin additive strip between two rails. A first-timer who drills into it m
- **A10** [should] By design (the story is that you are freeing something bad), every Anchor broken makes things worse. Each one adds BALLAST_ANCHOR_BITE 0.05 to the drain. Each core broken moves the heat line up 12 m (199 to 187, 175, 163
- **C3** [advice] The last and plainest foreshadowing line ("Whatever they were built to hold has three fewer ways to stay in") is only due once the third gate is open. It shows 20 s or more later, and only near a spent core. The third ga

### 4. The Ore Sorter never swaps out a key (ore sorter, about $3)

Code: in src/sim the Sorter skips key ores when choosing the lowest-value ore to replace, with a pure test; the sim wall is kept.

- **A11** [should] The Ore Sorter swaps out 'the lowest-value ore it carries' for the new find. Keys (amethyst, emerald, ruby, magmite, coreite, umbrite, Solmarrow) are 'worth nothing on the haul readout' because they are banked, never sol

## Waiting on milestones

### Z2 A real phone read, before V0

- **A17** [advice] Keys come from fixed one-cell pockets: amethyst 40, emerald 40, ruby 36, magmite 40, coreite 20, umbrite 10, Solmarrow 5. One rung asks for one key, or two for a common one. Drill ends on Solmarrow (5 pockets), while Hul

## Answers

- **A4** [advice] Movement is only the on-screen d-pad and buttons in the bottom corner (`src/input.ts` wires 'all d-pad, keyboard and button wiring'). A first tap mid-screen does nothing. The first-run intro is 'tap to go faster', which 
  Answer: KEEP: An on-screen d-pad is a standard control and nothing on screen misleads, so a watch only.
- **A6** [advice] The DEVICE RECOVERED card for Ore Sorter reads 'Swaps the cheapest ore in a full hold for a richer find. FITTED · UPGRADE IT AT THE OUTFITTER'. It says what the device does but not how much it changes. The card is a shor
  Answer: KEEP: The card is short and true, banner placement was already fixed, and C4 changes its head in the box above.
- **A14** [advice] In tour frame 7 (Rustmoor, about 32 m) the bay's Next line says 'Ore Sorter, sell a full hold' (a HOLD item). The open DRILL tab shows a different sealed card, Resonance Tip. The catalog says Resonance Tip is first shown
  Answer: TAKE: It is the same fault as C2 and the bay box removes the early card.
- **A15** [advice] Each Anchor broken adds violet flecks to plain rock, two per cell, in 8%, 16% and 24% of cells for Anchors 1 to 3. Their colour is 0x8a5ad0, close to amethyst (a060ff) and umbrite (9d7bff). Keys are glowing crystal fans,
  Answer: KEEP: Flecks and keys differ by shape and the design notes already carry it as a watch on the phone.
- **A17** [advice] Keys come from fixed one-cell pockets: amethyst 40, emerald 40, ruby 36, magmite 40, coreite 20, umbrite 10, Solmarrow 5. One rung asks for one key, or two for a common one. Drill ends on Solmarrow (5 pockets), while Hul
  Answer: LATER (waits on Z2 A real phone read, before V0): Key supply balance needs a real phone read of how often keys are found before any number moves.
- **C1** [advice] The bay's one guidance line always names an unwon feat first, and every feat counts as reachable at 0 m. So for the whole first tier, and likely into the second, it reads "Ore Sorter, sell a full hold", then "Pressure Se
  Answer: TAKE: The one pointer should lead to the barrier, as DESIGN.md promises and as he asked on 2026-09-18.
- **C2** [advice] The gas feat and the hard-rock feat are shown from the first dock, before the player has met either. The DRILL rack's sealed card for the Resonance Tip appears at 32 m and says "keep cutting hard rock". Rock that counts 
  Answer: TAKE: A goal should name something the player has met, and he wants things hidden until they are earned.
- **C3** [advice] The last and plainest foreshadowing line ("Whatever they were built to hold has three fewer ways to stay in") is only due once the third gate is open. It shows 20 s or more later, and only near a spent core. The third ga
  Answer: TAKE: All three hints should climb toward the reveal, as he asked 'hint at it as you get closer to the end'.
- **C4** [advice] A feat's gift arrives on the same card as a dug-up device, "DEVICE RECOVERED · FITTED · UPGRADE IT AT THE OUTFITTER". It never says it was earned, or by what act. So the full hold that earned the Ore Sorter goes unthanke
  Answer: TAKE: A reward that never says what earned it cannot be linked to the effort.

## DECIDED

DECIDED: keep as it is: Movement is only the on-screen d-pad and buttons in the bottom corner (`src/input.ts` wires 'all d-pad, keyboard and button wiring'). | release loop ece0d0f A4 KEEP: An on-screen d-pad is a standard control and nothing on screen misleads, so a watch only.
DECIDED: keep as it is: The DEVICE RECOVERED card for Ore Sorter reads 'Swaps the cheapest ore in a full hold for a richer find. | release loop ece0d0f A6 KEEP: The card is short and true, banner placement was already fixed, and C4 changes its head in the box above.
DECIDED: keep as it is: Each Anchor broken adds violet flecks to plain rock, two per cell, in 8%, 16% and 24% of cells for Anchors 1 to 3. | release loop ece0d0f A15 KEEP: Flecks and keys differ by shape and the design notes already carry it as a watch on the phone.
