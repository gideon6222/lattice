/* The Anchors, and the rooms they are in.

   Playtest: *"find more secrets, random caves, and other things to make the
   planet feel mysterious and intriguing ... I dont want to just try to dig to
   the bottom."*

   ---------- what the research settled ----------

   Dome Keeper's own developer made this exact pivot and said why. The original
   win condition was "reach the bottom of the map"; Rene Habermann called it
   *"seriously flawed"* and replaced it with searching for a special underground
   location and recovering something from it. This is that, and it is not a
   guess.

   The other finding is about how authored mystery survives procedural
   generation, and there is only one answer that works: **hand-authored room
   templates dropped at seeded slots.** Spelunky stitches rooms; Noita drops
   hand-placed structures into generated terrain. Animal Well's layered secrecy
   is seven years of hand placement and does not translate at all.

   And the named failure mode is templates you start to recognise. So the
   library is small but most of it is RARE - a first playthrough sees a
   fraction - and the three kinds are deliberately different in what they are
   worth, including one that is worth nothing.

   ---------- the five kinds ----------

     ANCHOR      nine of them, one in each region of the top three rows. The
                 objective
     SEALED      an Anchor you can see through a wall you cannot cut. The
                 "locked door with no visible key", and the key is a device
                 that is buried somewhere else
     EXPEDITION  somebody was here first. Their shaft, their spoil, their
                 supply crate, and the place they stopped. No text
     VEIN        worked stone around something worth having
     QUIET       a room with nothing in it at all, which is what makes the
                 ones that do matter

   ---------- how a room is written ----------

   As characters, because a room is a drawing and a drawing should be legible
   in the file it lives in. Anything that is not one of these is untouched
   ground, and the generator fills it as usual:

     #   worked stone - hard, cut, and unmistakably not rock
     =   sealed stone - unbreakable until you have the Cutting Laser
     .   open air. The room
     A   the Anchor
     o   a supply crate
     *   a pocket worth having
     r   rubble - somebody else's spoil

   Every template is the same size, which costs a few spaces in the source and
   saves the stamping code from ever having to think about it. */

import { rnd } from './util';
import { W, CACHE } from './config';
import { REGION_COLS, REGION_ROWS, REGION_COUNT, WORLD_DEPTH, regionAt } from './region';
import { GATE_COUNT } from './gate';

/* The size of an ORDINARY room. The Vault is bigger, so the stamp reads each
   template's own dimensions and these two are only the figure the wild slots
   and the Anchor halls are laid out against. */
export const VAULT_W = 11;
export const VAULT_H = 9;

export const vaultW = (v: Vault) => v.rows[0].length;
export const vaultH = (v: Vault) => v.rows.length;

export interface Vault {
  id: string;
  kind: 'anchor' | 'expedition' | 'vein' | 'quiet' | 'vault' | 'derelict';
  rows: string[];
}

/* ---------- the Anchor halls ----------

   Two versions of the same room, and the difference is one character.

   The NICHE in the middle is the point. The chamber opens as one space, and
   the Anchor stands in a shallow recess at the centre of it, walled either side
   and floored underneath but OPEN ABOVE - so arriving is not the same act as
   reaching it: you break in, you cross the room, and you drop into the recess.
   A monument you can fly down to is worth more than a block you happen to
   drill.

   Open above and not boxed in, and that is a lighting decision as much as a
   design one. The first version sealed the Anchor on all four sides, and the
   light field did exactly what it should with a cell enclosed by stone: it
   left it in shadow. The brightest object in the game rendered as a dull teal
   smudge, correctly. A recess takes the lamp. */
const ANCHOR_HALL: Vault = {
  id: 'anchor-hall', kind: 'anchor',
  rows: [
    '  #######  ',
    ' ##.....## ',
    ' #.......# ',
    ' #..#.#..# ',
    ' #..#A#..# ',
    ' #..###..# ',
    ' #.......# ',
    ' ##.....## ',
    '  #######  '
  ]
};

/* The same hall with a skin you cannot cut.

   This is the sourced device that makes a map worth coming back to: Hollow
   Knight's rule is that a new tool opens things you have ALREADY SEEN and
   could not pass, and backtracking with it is itself content at no cost in new
   world. The wall is visibly different and the room behind it is visibly
   there. */
const SEALED_HALL: Vault = {
  id: 'sealed-hall', kind: 'anchor',
  rows: [
    '  =======  ',
    ' ==.....== ',
    ' =.......= ',
    ' =..#.#..= ',
    ' =..#A#..= ',
    ' =..###..= ',
    ' =.......= ',
    ' ==.....== ',
    '  =======  '
  ]
};

/* ---------- the rooms that are not the objective ---------- */

/* Somebody was here first, and the room says so without a word.

   A shaft that comes in from above and stops. Spoil piled where they worked.
   One crate they did not carry out. The research is explicit that this is how
   an environment tells a story in a game with no dialogue, and that it stops
   working the moment a note explains it. */
const EXPEDITION: Vault = {
  id: 'expedition', kind: 'expedition',
  rows: [
    '     .     ',
    '     .     ',
    '  ####.### ',
    ' ##r...r.# ',
    ' #..o.....#',
    ' #.r....r.#',
    ' ##......## ',
    '  ###..###  ',
    '    ###     '
  ]
};

/* Worked stone around something worth having. The one room that pays. */
const VEIN_ROOM: Vault = {
  id: 'vein-room', kind: 'vein',
  rows: [
    '   #####   ',
    '  ##...##  ',
    ' ##.***.## ',
    ' #..***..# ',
    ' #...*...# ',
    ' #.......# ',
    ' ##.....## ',
    '  ##...##  ',
    '   #####   '
  ]
};

/* And the one that does not.

   The deliberate emptiness, and it is load-bearing. If every worked room in
   the planet held something, finding worked stone would be a reward rather
   than a question, and the moment of "what is this" would be over before you
   were through the wall. There have to be rooms that are just rooms. */
const QUIET_ROOM: Vault = {
  id: 'quiet-room', kind: 'quiet',
  rows: [
    '  #######  ',
    ' #.......# ',
    ' #.......# ',
    ' #.......# ',
    ' #.......# ',
    ' #.......# ',
    ' #.......# ',
    ' #.......# ',
    '  #######  '
  ]
};

/* Somebody was here first, and this time they did not leave.

   Round thirteen, W2, and the third of the research's ranked archetypes. The
   expedition room above says a crew worked here; this says a ship came down
   here and stopped. The brief's own words: *"a wrecked prior ship sits in a
   seeded cell with salvageable ore. No choice required, which is the point: it
   is the wordless tableau, and it is how the player learns this world holds
   more than hazards."*

   **Four characters, and the whole beat is in the order you meet them.**

   `L` is the wreck's own lamp, still faintly on, and it is the telegraph. Glow
   goes through `coreGlow()` rather than `coreLit()` - the find-the-vein curve -
   so a glowing cell shows THROUGH unbroken rock. You see a light in the ground
   before you see what is around it, which is exactly the "telegraph before the
   stakes land" the encounter research is built on, and it costs nothing because
   the mechanism is the one ore already uses.

   `H` is hull plate. It is the room's wall, and it is a wall that reads as
   MADE: harder than the masonry of a worked room, softer than a sealed one.

   `S` is the hold, one cell, amidships and behind two plates whichever way you
   come in. `r` is spoil where it ploughed in.

   **The silhouette is the point and it is canted.** A wreck drawn upright is a
   box; the lean in rows five and six is what makes it a thing that fell rather
   than a thing that was built. It is also why the lamp is at the low end - a
   ship nose-down has its lamp pointing into the floor, which is a sentence
   without a word in it. */
const DERELICT: Vault = {
  id: 'derelict', kind: 'derelict',
  rows: [
    '           ',
    '   .....   ',
    '  ..HHH..  ',
    ' ..HHHHH.. ',
    ' ..HHSHH.. ',
    ' ..HHHH... ',
    ' .rHLH..r. ',
    '  rr...rr  ',
    '   .....   '
  ]
};

/* ---------- the Vault ----------

   The centre of the planet, and the end of the game.

   One room, hand-placed rather than seeded, at the middle column of the
   deepest band - which is the one place on a 61-by-452 world that can be
   described without a map: *the centre*. It is bigger than everything else in
   the library because it is the only room in the game that has to feel like an
   arrival rather than a discovery.

   Two shells, and they say different things. The outer one is ordinary worked
   stone, so finding it reads exactly like finding any other room - you have
   met this language before and it means "somebody built this". The inner one
   is `%`, which nothing in the game can cut until all nine Anchors are lit,
   and that is the difference: this is not a door waiting for a tool, it is a
   door waiting for the whole errand.

   The core sits in the same open-topped niche the Anchors do, and for the same
   two reasons: a monument you fly down to is worth more than a block you
   drill, and a cell walled in on four sides is a cell the light field quite
   correctly leaves in the dark. */
export const VAULT_CORE_X = Math.floor(W / 2);

/* In the deepest band, clear of the bedrock under it and of the band's own
   wandering ceiling. 405 of 452. */
export const VAULT_CORE_D = 405;

export const THE_VAULT: Vault = {
  id: 'the-vault', kind: 'vault',
  rows: [
    '    #######    ',
    '  ###%%%%%###  ',
    ' ##%%.....%%## ',
    ' #%%.......%%# ',
    ' #%.........%# ',
    ' #%...#.#...%# ',
    ' #%...#V#...%# ',
    ' #%...###...%# ',
    ' #%.........%# ',
    ' #%%.......%%# ',
    ' ##%%.....%%## ',
    '  ###%%%%%###  ',
    '    #######    '
  ]
};

/* The pool the seeded slots draw from, and the weights are the design.

   Quiet is the most common single kind on purpose - see the note on it - and
   the expedition is rare enough that meeting one is an event rather than a
   furnishing. */
const WILD: Vault[] = [
  QUIET_ROOM, QUIET_ROOM, QUIET_ROOM,
  EXPEDITION, EXPEDITION,
  VEIN_ROOM, VEIN_ROOM
];

export const VAULTS: Vault[] = [ANCHOR_HALL, SEALED_HALL, EXPEDITION, VEIN_ROOM, QUIET_ROOM, DERELICT];

/* ---------- where the Anchors are ----------

   Nine, one in each region of the top three rows. The bottom row holds none,
   because the bottom row is where the Vault is and the deep has to be worth
   reaching for its own reason rather than for a tenth of the same errand.

   Spread WIDE as much as deep, which is the whole point: a grid that was only
   deep would still be a game about digging down. You have to cross the planet
   to light them all. */
export const ANCHOR_COUNT = (REGION_ROWS - 1) * REGION_COLS;

/* The rows an Anchor can be in. Also the rows it cannot: REGION_ROWS - 1. */
export const ANCHOR_ROWS = REGION_ROWS - 1;

export const anchorRegions = (): number[] => {
  const out: number[] = [];
  for (let i = 0; i < ANCHOR_COUNT; i++) out.push(i);
  return out;
};

/* Its own seed offset, like everything else that generates. 11, 23, 41, 77,
   91, 131, 137, 173, 211, 257, 311, 313, 421, 977 and 1013 are taken. */
const ANCHOR_SEED = 601;
const SLOT_SEED = 619;

/* The centre of the Anchor hall in region `r`.

   Seeded inside the region's NOMINAL box, inset far enough that the wandering
   boundaries cannot push the room across one. The insets are the wanders
   themselves plus half the room, so the whole hall is inside its own region
   even at the worst boundary offset - which a test checks, because "far enough"
   is exactly the kind of claim that is wrong by two. */
export function anchorAt(r: number): { x: number; d: number } {
  const row = Math.floor(r / REGION_COLS), col = r % REGION_COLS;
  const band = WORLD_DEPTH / REGION_ROWS;
  const span = W / REGION_COLS;

  /* 7 is ROW_WANDER and 3 is COL_WANDER from region.ts, plus half the room,
     plus one for luck. Written out rather than imported because region.ts
     keeps them private and a room that fits is a stronger statement than a
     room that tracks a constant. */
  const dPad = 7 + VAULT_H / 2 + 1;
  const xPad = 3 + VAULT_W / 2 + 1;
  const d0 = row * band + dPad, d1 = (row + 1) * band - dPad;
  const x0 = Math.max(xPad, col * span + xPad);
  const x1 = Math.min(W - 1 - xPad, (col + 1) * span - xPad);

  const d = Math.round(d0 + rnd(r * 13, r * 29 + 7, ANCHOR_SEED) * (d1 - d0));
  const x = Math.round(x0 + rnd(r * 17 + 5, r * 31, ANCHOR_SEED + 1) * (x1 - x0));
  return { x, d };
}

/* Whether region `r`'s Anchor is behind a wall you cannot cut yet.

   A third of them, spread so that the first one you are likely to meet is not
   one of them: region 0 to 2 is the shallow row and the shallow row is where
   the mechanic is learned. "How many locked doors are open at once" is a
   pacing decision and the research's named failure mode is too many
   unexplained hooks at the same time.

   ---------- round fifteen: it is DERIVED now, and this was a deadlock ----------

   It used to be a hand-picked `new Set([4, 6, 8])`, and region 4 is Kryllon,
   whose Anchor is at 135 m. Once Y1 put a barrier at 226 m that Kryllon opens,
   the save became unfinishable: sealed stone needs the Cutting Laser, the
   laser is a deep device, and the barrier that stands between the player and
   it is the one Kryllon is supposed to open. A hand-picked set cannot know
   that; it is a fact about where the KEY is.

   So the rule is the fact: **an Anchor may be sealed only in a tier at or
   below the tier its key is buried in.** Nothing shallower can be, whatever
   anybody picks, and if the laser ever moves the sealed set moves with it.

   `SEALED_MIN_TIER` is written out rather than imported from `finds.ts`,
   because `config.ts` imports finds and finds imports config - see the note in
   `findMap`, which lost the Vault to exactly that cycle once. `finishable.test.mjs`
   asserts this equals `depthTier(FIND_OF.laser.below)`, which is INDEX.md
   rule 10b: where you cannot derive, assert the derived quantity. */
export const SEALED_MIN_TIER = 2;

/* Local, for the same reason and with the same receipt: `gate.ts` would be a
   cycle through config. Asserted against `depthTier` in the test. */
const tierOfDepth = (d: number) =>
  Math.min(REGION_ROWS - 1, Math.max(0, Math.floor(d / (WORLD_DEPTH / REGION_ROWS))));

export const anchorSealed = (r: number) =>
  r < ANCHOR_COUNT && tierOfDepth(anchorAt(r).d) >= SEALED_MIN_TIER;

export const anchorVault = (r: number): Vault => anchorSealed(r) ? SEALED_HALL : ANCHOR_HALL;

/* ---------- the seeded slots ----------

   Sixteen rooms that are not Anchors, scattered over a world of 27,572 cells.
   That is about four per cent of the planet's cells inside worked stone, which
   is rare enough that the first one is a surprise and common enough that a
   long campaign meets several.

   Placed on a coarse lattice rather than by rejection sampling, because a
   lattice cannot fail to terminate and a seeded world has to generate the same
   rooms every time it is asked. */
export const WILD_SLOTS = 16;

export function wildSlot(i: number): { x: number; d: number; vault: Vault } {
  /* Spread down the world by index so they cannot all hash into one band, and
     jittered inside their share so they are not a ladder. */
  const share = (WORLD_DEPTH - 40) / WILD_SLOTS;
  const d = Math.round(24 + i * share + rnd(i * 7, i * 19, SLOT_SEED) * (share - VAULT_H - 2));
  const xPad = VAULT_W / 2 + 1;
  const x = Math.round(xPad + rnd(i * 23 + 3, i * 11, SLOT_SEED + 1) * (W - 1 - xPad * 2));
  const vault = WILD[Math.floor(rnd(i * 5, i * 37, SLOT_SEED + 2) * WILD.length) % WILD.length];
  return { x, d, vault };
}

/* ---------- the wrecks ----------

   One per region, twelve on the planet, and they have their OWN slots rather
   than joining the wild pool. That is the load-bearing decision here and it is
   not about design, it is about not moving the world.

   `wildSlot` picks its room with `WILD[floor(rnd(...) * WILD.length)]`. Adding
   a thirteenth entry to that array changes the divisor, which changes the pick
   at every one of the sixteen slots, which moves rooms the player has already
   met on a planet the seed promises is fixed. `test/baseline/blocks-frozen.json`
   would have read that as the room stream moving, and it would have been right.
   Placed last in `vaultPlan`, a wreck can only ever take cells that were rock,
   and every room that existed before this round is bit-identical.

   Per REGION rather than on a lattice, because the brief's pity rule is
   per-region ("guaranteed-once per region, per Slay the Spire's seen-pool
   logic") and because that is what makes a wreck part of the character of a
   place: you work Rustmoor, you meet Rustmoor's wreck. The geometry is
   `anchorAt`'s, deliberately - same box, same padding, same shape of jitter -
   because a second way of saying "somewhere inside region r" is a second thing
   to keep in step with the region grid when it moves.

   Offset 733, which was free: 11, 23, 41, 77, 91, 131, 137, 173, 211, 257,
   311, 313, 421, 431, 601, 619 (and 620, 621, the slot seed's neighbours),
   643, 887, 977 and 1013 are taken. */
const WRECK_SEED = 733;

export const DERELICT_SLOTS = REGION_COUNT;

/* How many places a region is allowed to try before it goes without.

   Measured, not chosen, and the first version had no ladder at all:

     tries    wrecks placed    deepest attempt actually used
       1         8 of 12                  1
       2        10 of 12                  2
       3        10 of 12                  2
       4        11 of 12                  4
       5        11 of 12                  4
       6        12 of 12                  6
       8        12 of 12                  6

   With one attempt each, four regions went without - region 10 draws a cell the
   Vault core is standing on, a collision it can never win, and three others
   landed on a hall or a wild room. Six attempts is what this world actually
   needs and the sixth is genuinely used.

   **This table was re-measured after the `CACHE.min` floor went in below, and
   it moved.** Before the floor, four attempts sufficed; squeezing the shallow
   row into a shorter band costs two more. That is the reason to keep margin
   rather than to set this to exactly what works: a change somewhere else
   entirely moves this number, and the version that fits exactly is the version
   that silently stops fitting.

   Eight rather than six, and the two spare are the point: at exactly six, any
   retune of any OTHER room - a hall moving, a wild slot's jitter changing -
   silently costs a region its wreck, and "guaranteed once per region" would
   quietly stop being true with nothing to say so. The margin is not trusted
   either: `test/derelict.test.mjs` asserts all twelve are placed, so if the
   world ever does get crowded enough to exhaust the ladder it fails there
   rather than in a descent nobody takes. */
export const DERELICT_TRIES = 8;

/* Where region `r` would put its wreck on its `t`th attempt.

   `t` goes into the hash rather than being a nudge off the first position, so
   a retry is a fresh draw from the same region box instead of a slide in some
   fixed direction. A nudge would walk every crowded wreck the same way and
   pile them against the same wall of whatever pushed them. */
export function derelictAt(r: number, t = 0): { x: number; d: number } {
  const row = Math.floor(r / REGION_COLS), col = r % REGION_COLS;
  const band = WORLD_DEPTH / REGION_ROWS;
  const span = W / REGION_COLS;
  const dPad = 7 + VAULT_H / 2 + 1;
  const xPad = 3 + VAULT_W / 2 + 1;
  /* The shallow floor is CACHE's, and it is imported rather than chosen.

     A wreck's hold is a cache (see config.ts), and `CACHE.min` is a deliberate
     pacing gate: no consumable is handed to anybody in the first twenty metres,
     because finding your first one is a discovery and it should not happen
     before the player has a reason to want it. Round thirteen's first build put
     Rustmoor's wreck at 13 m and walked straight under that gate - caught by
     `a cache is rare enough to be a surprise and common enough to be met`,
     which has guarded that floor since long before this room existed.

     Half a room's height on top, so the whole wreck clears it and not merely
     its centre. Costs nothing: the shallow band runs to 113 m. */
  const floor = CACHE.min + VAULT_H / 2;
  const d0 = Math.max(row * band + dPad, floor), d1 = (row + 1) * band - dPad;
  const x0 = Math.max(xPad, col * span + xPad);
  const x1 = Math.min(W - 1 - xPad, (col + 1) * span - xPad);

  const d = Math.round(d0 + rnd(r * 19 + 3 + t * 53, r * 41 + t * 7, WRECK_SEED) * (d1 - d0));
  const x = Math.round(x0 + rnd(r * 29 + t * 11, r * 13 + 11 + t * 37, WRECK_SEED + 1) * (x1 - x0));
  return { x, d };
}

/* ---------- the stamp ----------

   Every authored cell in the world, keyed by cell, built once.

   Built rather than queried per cell: a lookup that had to test 25 rooms for
   every one of the 735 cells a streaming rebuild touches would be 18,000 box
   tests a rebuild. This is 25 rooms times 99 cells, once, and then a Map get.

   Anchors are stamped FIRST and a wild room that would overlap one is dropped
   entirely rather than clipped. A half-stamped room is a wall with no room
   behind it, which is the worst thing this system could produce: the player
   goes through it and finds nothing, and the language of worked stone stops
   meaning anything. */
export interface Placed { x: number; d: number; vault: Vault }

/* Which rooms are actually in the world, in stamping order.

   Split out from the stamp itself because "was this room placed" is otherwise
   only answerable by re-deriving the drop rule, and a test that re-derives the
   rule it is testing passes with the rule deleted. Asked for a list, a test can
   check the RESULT: that every room on it is stamped whole, and that no two of
   them overlap. */
export function vaultPlan(): Placed[] {
  const out: Placed[] = [];
  /* The Vault first of all, because it is the one room that is not allowed to
     move for anything. */
  out.push({ x: VAULT_CORE_X, d: VAULT_CORE_D, vault: THE_VAULT });
  for (let r = 0; r < ANCHOR_COUNT; r++) {
    const a = anchorAt(r);
    out.push({ x: a.x, d: a.d, vault: anchorVault(r) });
  }
  for (let i = 0; i < WILD_SLOTS; i++) {
    const s = wildSlot(i);
    /* Rooms are VAULT_W apart before they can touch, and a whole room's
       clearance either way is the cheapest correct test. Dropped entirely
       rather than clipped: a half-stamped room is a wall with no room behind
       it, and that is the worst thing this system could produce. */
    /* Cleared against each room's OWN size, so the Vault's larger footprint
       pushes wild rooms further away than an Anchor hall does. */
    if (out.some((t) =>
      Math.abs(t.x - s.x) < (vaultW(t.vault) + VAULT_W) / 2 &&
      Math.abs(t.d - s.d) < (vaultH(t.vault) + VAULT_H) / 2)) continue;
    out.push(s);
  }
  /* The wrecks last of all, and that ORDER is the whole reason they are safe
     to add to a world people have already played: everything above this line
     is placed exactly where it was before they existed, and a wreck that would
     touch any of it is dropped rather than clipped, like a wild room. So a
     wreck can only ever take cells the generator made, which is what puts it
     in `OVERWRITERS` honestly rather than by assertion. */
  for (let r = 0; r < DERELICT_SLOTS; r++) {
    for (let t = 0; t < DERELICT_TRIES; t++) {
      const w = derelictAt(r, t);
      const s: Placed = { x: w.x, d: w.d, vault: DERELICT };
      if (out.some((o) =>
        Math.abs(o.x - s.x) < (vaultW(o.vault) + vaultW(s.vault)) / 2 &&
        Math.abs(o.d - s.d) < (vaultH(o.vault) + vaultH(s.vault)) / 2)) continue;
      out.push(s);
      break;
    }
  }
  return out;
}

export function vaultCells(): Map<string, string> {
  const out = new Map<string, string>();
  for (const p of vaultPlan()) {
    const w = vaultW(p.vault), h = vaultH(p.vault);
    const x0 = p.x - (w - 1) / 2, d0 = p.d - (h - 1) / 2;
    for (let ry = 0; ry < h; ry++) {
      const row = p.vault.rows[ry];
      for (let rx = 0; rx < w; rx++) {
        const ch = row[rx];
        if (!ch || ch === ' ') continue;
        const x = x0 + rx, d = d0 + ry;
        if (x < 0 || x >= W || d < 1 || d >= WORLD_DEPTH) continue;
        out.set(x + ',' + d, ch);
      }
    }
  }
  return out;
}

/* Every Anchor cell, keyed by cell. Built once.

   Asked by blockAt for every cell of a streaming rebuild AND by the frame loop
   for the ship's four neighbours, so a nine-entry linear scan would be eighteen
   seeded hashes a frame and six thousand a rebuild for an answer that never
   changes. */
let acMap: Map<string, number> | null = null;
export function anchorCells(): Map<string, number> {
  if (!acMap) {
    acMap = new Map();
    for (let r = 0; r < ANCHOR_COUNT; r++) {
      const a = anchorAt(r);
      acMap.set(a.x + ',' + a.d, r);
    }
  }
  return acMap;
}

/* Which region's Anchor is at this cell, or -1. */
export function anchorHere(x: number, d: number): number {
  const r = anchorCells().get(x + ',' + d);
  return r === undefined ? -1 : r;
}

/* And whether one is within reach of a cell, which is how an Anchor is lit:
   by standing next to it, not by mining it. Returns the region, or -1. */
export function anchorNear(x: number, d: number): number {
  const m = anchorCells();
  for (const n of [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const r = m.get((x + n[0]) + ',' + (d + n[1]));
    if (r !== undefined) return r;
  }
  return -1;
}

/* The PLINTH: the worked stone an Anchor is set into, which is the five `#`
   cells of the recess around it - left, right, and the three underneath.

   Round fifteen, Y13. When the Anchor breaks, these are what is left of the
   place, and they are the remnant his brief asks for: *"Each anchor should be
   dramatic when it breaks and leave remnants behind."* One dim cell where the
   Anchor stood would be a monument you could fly past without noticing; the
   plinth going with it is a scar the size of the thing that was there.

   Chebyshev distance 1 and not the four neighbours, because three of the five
   are the row underneath and two of those are diagonal. Excludes the Anchor's
   own cell, which is a different block with a different answer. */
export function anchorPlinth(x: number, d: number): number {
  const m = anchorCells();
  for (let dx = -1; dx <= 1; dx++) {
    for (let dd = -1; dd <= 1; dd++) {
      if (dx === 0 && dd === 0) continue;
      const r = m.get((x + dx) + ',' + (d + dd));
      if (r !== undefined) return r;
    }
  }
  return -1;
}

/* And the region an Anchor belongs to, which is where its position was drawn
   from - stated as a function so the rest of the game never assumes the index
   and the region are the same number, in case the bottom row ever gets one. */
export const anchorRegion = (r: number) => r;

/* Whether the Anchor for a region is actually inside it. Used by the test, and
   worth exporting rather than recomputing: the insets above are a claim and
   this is how the claim is checked. */
export function anchorInRegion(r: number): boolean {
  const a = anchorAt(r);
  for (const dx of [-(VAULT_W - 1) / 2, 0, (VAULT_W - 1) / 2]) {
    for (const dd of [-(VAULT_H - 1) / 2, 0, (VAULT_H - 1) / 2]) {
      if (regionAt(a.x + dx, a.d + dd) !== r) return false;
    }
  }
  return true;
}

/* ---------- how hard worked stone is ----------

   Both as multiples of the local band, so a room at 300 m is harder than the
   same room at 40 m for the same reason everything else down there is.

   Worked stone is a wall you are MEANT to get through, so it is about twice
   the rock around it - long enough that breaking in is a decision about fuel
   and short enough that it is never the reason a run ends. Sealed stone, once
   the laser makes it cuttable at all, is four times: the door stays a door
   even after you have the key. */
export const WORKED_HARD = 2.1;
export const SEALED_HARD = 4.4;

/* And a wreck's hull plate is exactly between them, which is a derivation
   rather than a third number to keep in step (INDEX.md rule 10b).

   It says the right thing in both directions. A hull is a made object somebody
   meant to keep four hundred metres of rock out, so it is not masonry; and it
   is not a door either - nothing about it is waiting for a tool, it is only
   thick. Halfway is the one value that cannot drift away from that sentence
   when either neighbour is retuned, and `test/derelict.test.mjs` asserts the
   ordering rather than the figure. */
export const HULK_HARD = (WORKED_HARD + SEALED_HARD) / 2;


/* ---------- the Vault's own rules ----------

   `%` is not `=`. Sealed stone waits for a TOOL, which is a thing you can find
   by accident; the Vault waits for the whole errand, and nothing in the game
   opens it early. That is the difference between a locked door and an ending.

   Once it is open it is still the hardest thing anybody ever drills - six
   times the band - because the last wall in the game should cost something
   even after you have earned the right to cut it. */
export const VAULT_WALL_HARD = 6.0;

/* Open when the last gate is. Round seventeen, AC: it used to open on the
   ninth Anchor, while the barrier above it still stood - the old spine's door
   beside the new one's. Now breaking the last core IS opening the Vault, and
   nothing else does. Takes the open gates, not a count of Anchors. */
export const vaultOpen = (openGates: readonly number[]) => openGates.includes(GATE_COUNT - 1);

/* Whether a cell is the Vault's core, and whether one is next to it. Same
   shape as the Anchors' pair and for the same reason: reaching it is standing
   next to it, not mining it. */
export const isVaultCore = (x: number, d: number) =>
  x === VAULT_CORE_X && d === VAULT_CORE_D;

export function vaultCoreNear(x: number, d: number): boolean {
  for (const n of [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]]) {
    if (isVaultCore(x + n[0], d + n[1])) return true;
  }
  return false;
}
