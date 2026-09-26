import { W, START_X, ORES, DEF, isKey, baseRock, coreDepth, hardMult, valueMult,
         GEODE, GAS, CACHE, BLOOM, BLOOM_MAX, LODE, SALVAGE, RUBBLE, RUBBLE_HARD, SEAM, SEAM_CHANCE, TREMOR_SAFE_RADIUS,
         RELIC_COLOR, RELIC_HOST, relicAt, relicFor,
         CAVE_MIN_DEPTH, caveChanceOn, gasChanceOn, geodeChanceOn, SUPPLIES, traitOf,
         VEIN_W, VEIN_H, VEIN_CELLS, VEIN_R, VEIN_WOBBLE_LO, VEIN_WOBBLE_HI, VEIN_REACH_MAX } from './config';
import { WRONGNESS } from './wrongness';
import { key, mixHex, rnd } from './util';
import { regionAt, REGION_COUNT } from './region';
import { vaultCells, anchorHere, anchorPlinth, WORKED_HARD, SEALED_HARD, HULK_HARD,
         vaultOpen, VAULT_WALL_HARD, ANCHOR_COUNT, anchorAt, VAULT_W, VAULT_H } from './vaults';
import { isCollapsed, hardScale, isAwake, UNREST_BANDS } from './unrest';
import { gateCellAt, gateDepth } from './gate';
import { g , coreM, valueM, worldTrait} from './state';
import { findMap, cacheSupply, FIND_COLOR, FIND_HOST, FIND_HARD, type Find } from './finds';
import { keyAt } from './keys';

const GEODE_DEEP_MULT = 3;
import type { Block, SupplyKey, Ore } from '../types';

/* The crates buried on the world you are standing on, cached.

   `blockAt` is called for every cell of every rebuilt chunk, so the map cannot
   be rebuilt inside it. The cache key is everything the map is a function of:
   the leg, where the core is, and how many devices are in hand - that last one
   is what makes the crate vanish the instant it is opened rather than on the
   next world. A list length is enough because the list only ever grows. */
let fcKey = '';
let fcMap: Map<string, Find> = new Map();
export function findCells(): Map<string, Find> {
  const cd = coreM();
  const k = g.planet + '|' + cd + '|' + g.found.length;
  if (k !== fcKey) { fcKey = k; fcMap = evictFromRooms(findMap(g.planet, cd, g.found), cd); }
  return fcMap;
}

/* A crate never sits inside an ANCHOR HALL - not its stone and not its air.

   This started as SEALED halls only. The laser is the key to those, and a crate
   stamped inside one is a save that cannot be finished; with all seven devices
   on the one world the hash put one there on the first run of the test that
   checks (`the key is never behind the door it opens`).

   **Widened to every hall on 2026-09-18, when the eighth device found the other
   half of the same bug.** `blockAt` answers the crate BEFORE the authored
   rooms, so a crate that hashes onto a hall's wall does not sit in the wall, it
   REPLACES it - and an Anchor hall with a crate where a wall should be is a
   hall you can walk into. `vaults.test.mjs` caught it as "schematic is cut
   stone and is not flagged as spoil", which is that test doing exactly its job:
   it swept the wall cells and one of them had stopped being a wall.

   The rule it protects is the ritual: you BREAK IN to an Anchor hall. That is
   true of all nine and was only ever enforced for the three sealed ones,
   because until there were eight devices nothing had landed on the other six.

   Walked down out of the footprint, here rather than in finds.ts, because this
   module already imports both sides and finds.ts importing the vault geometry
   was a cycle that deleted the Vault. Counted, so a test can say it is rare. */
let evicted = 0;
export function findEvictions() { return evicted; }

/* **Both a footprint AND the stamp, because neither alone is the answer**, and
   finding that out cost two wrong versions, each caught by a different test:

   - The FOOTPRINT around each Anchor covers the hall's interior AIR as well as
     its stone. `vaultMap()` holds only the cells the template marks, so an open
     cell inside a hall is simply absent from it - and a crate in the air of a
     sealed hall is the save-cannot-be-finished bug this whole function exists
     for. The stamp-only version put one in Serrik's hall at 45,306 and the test
     said so by name.
   - The STAMP covers what the footprint cannot: the CENTRE Vault, which is a
     room and is not at any Anchor, and any hall whose template is a different
     size from the constants.

   `vaultMap()` rather than `vaultCells()` directly, because the stamp is built
   once and kept and rebuilding the whole authored geometry per candidate cell
   would be its own mistake. */
function inAuthoredRoom(x: number, d: number): boolean {
  if (vaultMap().has(x + ',' + d)) return true;
  for (let r = 0; r < ANCHOR_COUNT; r++) {
    const a = anchorAt(r);
    if (Math.abs(x - a.x) <= (VAULT_W - 1) / 2 && Math.abs(d - a.d) <= (VAULT_H - 1) / 2) return true;
  }
  return false;
}

function evictFromRooms(m: Map<string, Find>, coreDepthHere: number): Map<string, Find> {
  const out = new Map<string, Find>();
  for (const [k, f] of m) {
    const i = k.indexOf(',');
    const x = +k.slice(0, i);
    let d = +k.slice(i + 1);
    while ((inAuthoredRoom(x, d) || out.has(x + ',' + d)) && d < coreDepthHere - 1) { d++; evicted++; }
    out.set(x + ',' + d, f);
  }
  return out;
}

/* Which device the crate at this cell holds, or null if there is no crate
   there. The break handlers ask this instead of reading a field off the block -
   see the note in blockAt. */
export function findHere(x: number, d: number): Find | null {
  return findCells().get(x + ',' + d) || null;
}

/* ---------- the authored rooms ----------

   Built once and kept. Unlike the find crates this does not key on anything:
   there is one world now and the rooms in it never move. Lighting an Anchor
   changes what a cell LOOKS like and not where it is, so the stamp is
   computed on the first cell that asks for it and never again. */
let vcMap: Map<string, string> | null = null;
export function vaultMap(): Map<string, string> {
  if (!vcMap) vcMap = vaultCells();
  return vcMap;
}
export function resetVaults() { vcMap = null; }

/* Whether sealed stone will cut.

   The Cutting Laser is the key, and it is the key because it already exists:
   Hollow Knight's rule is that each key opens a few locks, and a new device
   invented purely to open doors would be a key that opens exactly one. Having
   FOUND it is enough - the laser's own charge is not spent on stone. */
export const canCutSealed = () => g.found.includes('laser');

export function blockAt(x: number, d: number): Block | null {
  if (d < 0 || x < 0 || x >= W) return null;
  if (g.dug.has(key(x, d))) return null;
  /* Ground that has come down.

     Checked before anything else that can generate, including the relic and
     the drive component, because a collapsed region is not a kind of rock with
     things in it - it is closed. A relic showing through fallen ground you
     cannot enter would be the worst possible read: a prize you can see and
     have no way to be told why you cannot reach.

     Unbreakable, like bedrock. A bomb does not open it either, which is the
     point: the only thing that opens a fallen region is the Ballast. */
  /* The region, asked ONCE. It is five seeded hashes deep and three separate
     things below want it - whether the ground is shut, how angry it is, and
     which trait it has - and blockAt runs for every cell of a 21-column
     streaming window on every rebuild. Three lookups was three times the
     hashing for one answer that cannot change between them. */
  const reg = regionAt(x, d);
  if (g.ground.collapsed.length && isCollapsed(g.ground, reg)) {
    return { id: 'fallen', name: 'Fallen Ground', color: 0x24222a, host: 0x181720,
             hard: Infinity, wt: 0, value: 0, glow: 0.02 };
  }
  /* The floor. There is no Planet Core any more.

     Breaking one used to be the end of a world and the start of the next, back
     when the game was a chain of planets you passed through. Round eight made
     it one planet and W9 gave it an ending of its own - the Vault, at the
     centre, behind nine Anchors - and two endings is worse than either. So the
     bottom of the world is simply the bottom of the world. */
  const cd = coreM();
  if (d >= cd) return { id: 'bedrock', name: 'Bedrock', color: 0x1a1820, hard: Infinity, wt: 0, value: 0, glow: 0.02 };
  /* The trait of THIS CELL, not of the world. Hardness, caves, gas and geodes
     are all properties of the ground you are cutting, so they answer to the
     region the cell is in - which is what makes a region somewhere you can
     walk into rather than a label on a save. */
  const tr = traitOf(reg);
  /* And how angry this region is, which closes the rock up as it rises.

     Small, and deliberately the least visible thing Unrest does: a hardness
     multiplier is the most expensive-but-invisible change that can be made to
     a mining game, so it does nothing at all below the third band and reaches
     about a third more drilling at the top. You notice the tremors first. */
  const hm = hardMult() * (tr.hard ?? 1) * hardScale(g.ground.unrest[reg]);

  /* The gate goes HERE and not higher, because the core's hardness rides the
     local band like every other authored wall and `hm` is what carries the
     trait and the unrest into it. Still ahead of the relic, the crates and the
     rooms, which is the ordering that matters: a forcefield a room can punch a
     hole in is not one. */
  /* ---------- a tier gate ----------

     Round fifteen, Y1. One cell thick, the full width of the world, at a fixed
     depth, and nothing in the game can cut it until its tier is opened.

     Checked HERE - before the bedrock, the relic, the crates and the authored
     rooms - because a forcefield that a room can punch a hole in is not one.
     A hall is nine cells tall and a gate is one, so what a collision between
     them looks like is a seam across the room, which is the right read for
     something planet-wide.

     `hard: Infinity` and NOT `ghost`: this is the one thing in the game that is
     both uncuttable and genuinely in the way. That pair is what X6 separated,
     and this is the block that needs both halves. */
  const gc = gateCellAt(x, d, g.ground.lit, g.ground.gates);
  if (gc === 'wall') {
    return { id: 'gate', name: 'Barrier', color: 0x7a4fd4, host: 0x1a1230,
             glow: 0.55, shards: 6, tone: 3, ore: true, spoil: true,
             hard: Infinity, wt: 0, value: 0 };
  }
  if (gc === 'core') {
    /* The one cell of the barrier that can be cut, and only once this tier's
       Anchors are all broken. His words: "an unbreakable block will open up
       that looks inviting but full of dark energy."

       **It has to LOOK like a reward**, because that is the whole of the turn
       the story takes - the player is meant to read releasing it as a good
       deed. So it is the brightest thing in the tier and it is the warm end of
       the palette, not the cold one. Nothing here hints; the hints are their
       own milestone and they escalate.

       Hard, but finite: three times the band, which is what a lit Anchor used
       to cost to move. Breaking it is the climax of a tier and it should take
       long enough to be a decision about fuel. */
    /* Round seventeen, AE: the core's light is the one wrongness colour.
       Still the brightest thing in the tier, still inviting; what it is lit
       in is the colour the scars and the pip already taught. */
    return { id: 'darkcore', name: 'Dark Core', color: WRONGNESS, host: 0x2a1236,
             glow: 1.0, shards: 10, tone: 10, ore: true, spoil: true,
             hard: baseRock(d, g.planet, x).hard * hm * 3, wt: 0, value: 0 };
  }
  if (gc === 'spent') {
    /* And what is left when it is broken: permanent, lit, flown through.

       This is X6's `ghost` doing exactly the job it was built for, moved from
       the Anchor to the core at his ask - "the dark ominous feeling thing that
       breaks the barrier should be the thing that is permanent and stays lit".
       Uncuttable for ever so it can never be tidied away, and passable so it is
       a light in the doorway rather than a plug in the one cell every player of
       the tier below has to pass through. */
    return { id: 'darkspent', name: 'Released', color: 0xd8b6ff, host: 0x241a38,
             glow: 1.0, shards: 10, tone: 10, ore: true, spoil: true, ghost: true,
             hard: Infinity, wt: 0, value: 0 };
  }


  /* The relic, before anything that could hide it. It is one cell on the whole
     planet and it must not lose a coin flip to a cave. */
  const rl = relicAt(g.planet, g.coreOff);
  if (x === rl.x && d === rl.d && !g.relicsTaken.includes(g.planet)) {
    return { id: 'relic', name: relicFor(g.planet).name, color: RELIC_COLOR, host: RELIC_HOST,
             glow: 0.95, shards: 9, tone: 10, hard: 9 * hm, wt: 0, value: 0,
             ore: true, relic: true };
  }

  /* A schematic crate, on the same footing as the relic and the component and
     for the same reason: it is one cell carrying a whole verb, and it must not
     lose a coin flip to a cave. AFTER those two, so if a crate hashes onto the
     relic's cell the relic wins and the crate is simply on the next world -
     which the design already permits, because a device is never lost.

     No roll of its own: the position is a hash of the leg and the device, so
     it consumes nothing from the ore stream. See finds.ts.

     ONE id for all seven, and the device is NOT a field on the block.

     The obvious shape - `id: 'find:laser'` with the key on the payload - broke
     the golden snapshot in two ways at once, and both were the test being
     right. Seven ids need seven legend characters, and a payload that varies
     cell to cell within one id is exactly the drift the snapshot's payload
     assertion exists to catch. So the crate is one block and `findHere()` says
     what is inside it, which is also why there is only one instanced pool for
     them rather than seven. */
  if (findCells().has(x + ',' + d)) {
    return { id: 'schematic', name: 'Sealed Crate', color: FIND_COLOR, host: FIND_HOST,
             glow: 1.0, shards: 9, tone: 9, hard: FIND_HARD * hm, wt: 0, value: 0,
             ore: true, find: true };
  }

  /* Rubble, and it goes BEFORE the authored rooms rather than after them.

     Found by a test: a tunnel cut through a hall wall and then closed up by
     W8's waking ground came back as WORKED STONE, because the stamp was
     checked first and the stamp still says there is a wall there. Coherent, in
     a way - the hall reseals - and wrong twice over. The planet does not
     rebuild somebody else's masonry, it fills the hole with spoil; and worked
     stone is twice the hardness of the band while rubble is a fraction of it,
     so the reseal was quietly harder to get back through than the wall had
     been the first time.

     Hardness rides on the band it sits in; weight and value are the flat DEF
     numbers, because haulValue() looks those up by id and cannot know what
     depth a given unit came from. */
  if (g.rubble.has(key(x, d))) {
    /* Coloured as broken pieces of whatever band it sits in rather than as one
       fixed grey. A neutral fill dropped into the scoria zone looked like
       sandstone boulders in a lava tube; half-blended it reads as the local
       rock, shattered - identifiable as fill without leaving the palette.
       Free: the pool is keyed by block id but the shade rides on the instance. */
    const band = baseRock(d, g.planet, x);
    return { id: RUBBLE.id, name: RUBBLE.name, glow: RUBBLE.glow,
             color: mixHex(band.color, RUBBLE.color, 0.5),
             hard: band.hard * hm * RUBBLE_HARD, wt: RUBBLE.wt, value: RUBBLE.value, ore: false };
  }


  /* ---------- an authored room ----------

     AFTER the three singletons, so a room that happens to be stamped over the
     relic, a drive component or a crate does not swallow it - those are one
     cell each on the whole planet and losing one is losing a whole thing. A
     crate embedded in a room's wall reads perfectly well; a crate that does not
     exist reads as nothing at all.

     BEFORE everything that generates, because a room is authored and the rock
     it is cut into is not. Nothing in a room is a coin flip. */
  const vch = vaultMap().get(x + ',' + d);
  if (vch) {
    if (vch === '.') return null;
    if (vch === 'A') {
      /* The Anchor itself, and it is the one block in the game that cannot be
         cut at all - not by the drill, not by a charge, not by the laser.

         That is the whole ritual. You break into the hall, you cross it, you
         cut one block of the plinth, and then you are STANDING NEXT TO the
         thing rather than having mined it. `CRAFT.md`: make the moment a
         place, not a pickup. The lighting happens in the frame loop, on
         proximity - see lightHere(). */
      const lit = g.ground.lit.includes(anchorHere(x, d));
      /* `ore: true` and it is not ore. That flag is what blocks.ts reads to
         decide between "pebbles on a rock face" and "crystal shards with a
         halo", and a monument wants the second one - the first build had none
         of it and the Anchor rendered as a flat teal tile on a plinth.

         Safe, because the only thing `ore` otherwise does is decide what goes
         into the hold when a block breaks, and this block cannot break. */
      /* UNCUTTABLE, ALWAYS, and passable once it is lit. Round fourteen, X6.

         You cannot mine your way to the objective, you fly to it. That is the
         ritual and it was never in question. What changed twice is the other
         half.

         **It used to become cuttable when lit, and that was a bug fix, not a
         design.** Three Anchors share each of the three columns they live in,
         and an Anchor is a single cell in the middle of its own hall. Left
         unbreakable after lighting, the shallowest in a column became a
         permanent plug: the ship dug down, stopped one metre above a monument
         it had already lit, and could not pass. Six of the nine were
         unreachable that way. The test that found it is `every Anchor lights by
         digging down its own column`, and it still guards this.

         **His playtest, 2026-09-19: "make the anchor something physically
         located at that spot that you can't dig."** He had met the half he
         could drill through, and a monument you are allowed to mine is not a
         monument. But reverting brings the plug straight back, so the answer is
         not to make it hard again - the problem was never that it was HARD, it
         was that it was IN THE WAY. Those are two different properties and the
         old code only had one knob for both.

         So: `hard: Infinity` for ever, and `ghost` once it is broken. A broken
         Anchor is a hollow rather than a wall - the ship flies through it, the
         route finder counts it as open ground, and the light field stops
         treating it as rock. Nothing can ever cut it again.

         ---------- what it turns INTO. Round fifteen, Y13 ----------

         **It used to become the brightest object in the game**, a mint monument
         at full glow, because up to X6 the beat was called "lighting an
         Anchor". His brief of 2026-09-19 turned that over: *"I want the anchors
         to now imply that you are slowly allowing the world to break. Each
         anchor should be dramatic when it breaks and leave remnants behind.
         The dark ominous feeling thing that breaks the barrier should be the
         thing that is permanent and stays lit."*

         So there are TWO monuments now and they must not look alike, which is
         the two-tier signal Shadow of the Colossus uses and the research in
         `plans/lattice/DESCENT.md` Q4 recommends by name: a body of small
         private costs, and one big public landmark. Three dim violet scars per
         tier, and then the spent core - the only thing in the world still at
         full glow.

         The colour moves from the makers' mint to the dark energy's violet,
         which is the same violet as the barrier and the spent core, so the
         player's eye ties the three together long before anything says they
         are tied. The unlit Anchor keeps its teal, because that is what the
         thing WAS and it is the teal the ship's own seams carry. */
      return { id: lit ? 'anchorbroken' : 'anchor',
               name: lit ? 'Anchor · broken' : 'Anchor',
               color: lit ? WRONGNESS : 0x2f6f5e, host: lit ? 0x16101f : 0x16241f,
               glow: lit ? 0.26 : 0.30, shards: 10, tone: lit ? 3 : 6,
               ore: true, spoil: true, ghost: lit,
               hard: Infinity,
               wt: 0, value: 0 };
    }
    if (vch === 'V') {
      /* The end of the game, and it looks like one: the only gold thing in the
         ground, and the only block besides an Anchor that cannot be cut. */
      const won = g.won;
      return { id: won ? 'vaultlit' : 'vaultcore', name: won ? 'The Vault · open' : 'The Vault',
               color: won ? 0xfff0b8 : 0x8a6a2a, host: 0x2a2114,
               glow: won ? 1.0 : 0.34, shards: 10, tone: won ? 10 : 6,
               ore: true, hard: Infinity, wt: 0, value: 0 };
    }
    if (vch === '%') {
      /* The last wall. Not sealed stone: sealed stone waits for a tool you can
         find by accident, and this waits for all nine Anchors - which is the
         difference between a locked door and an ending. */
      const open = vaultOpen(g.ground.gates);
      /* Lit even while it is shut, and that is the point of it.

         At 0.18 it went black with the rock at the edge of the lamp, so the
         picture a player got on arriving was worked stone and then a void -
         which reads as an unfinished room rather than as a door. A locked door
         you cannot see is not a promise, it is a dead end. */
      return { id: open ? 'vaultopen' : 'vaultwall',
               name: open ? 'Vault Seal · open' : 'Vault Seal',
               color: open ? 0xffd98a : 0xa8862e, host: 0x241d12,
               glow: open ? 0.75 : 0.48,
               hard: open ? baseRock(d, g.planet, x).hard * hm * VAULT_WALL_HARD : Infinity,
               wt: 0, value: 0, spoil: true };
    }
    if (vch === '=') {
      /* The locked door you can see. Unbreakable until the laser is FOUND,
         and then merely very hard - which is the whole of the ability gate,
         and it costs no new world at all. */
      return { id: 'sealed', name: 'Sealed Stone', color: 0x5ad0e0, host: 0x1d2a33,
               glow: 0.34,
               hard: canCutSealed() ? baseRock(d, g.planet, x).hard * hm * SEALED_HARD : Infinity,
               wt: 0, value: 0, spoil: true };
    }
    if (vch === '#') {
      /* Round fifteen, Y13: the plinth of a BROKEN Anchor is not worked stone
         any more. His words: "Each anchor should be dramatic when it breaks
         and leave remnants behind."

         Uncuttable, so the site cannot be tidied away or dug over - the
         research in `plans/lattice/DESCENT.md` Q4 is specific that the remnant
         has to survive at the exact place the deed happened, because it is
         read by flying past it again rather than by opening a screen. It is
         also why this is not rubble: rubble is something you clear.

         Derived from `g.ground.lit` and stored nowhere, so it costs the save
         nothing and cannot drift out of step with which Anchors are broken. */
      const scarred = anchorPlinth(x, d);
      if (scarred >= 0 && g.ground.lit.includes(scarred)) {
        /* ---------- the floor of the recess gives way ----------

           The one cell of the plinth directly under the Anchor is GONE rather
           than scarred, and it is not a special case bolted on: it is where
           the Anchor went.

           It is also the third time this game has met the same bug, and the
           first two are written up in the Anchor's own branch above. Three
           Anchors share each of the three columns they sit in. A broken Anchor
           is `ghost`, so the ship flies through it - and then lands on the
           uncuttable scar one metre below and cannot pass. Six of the nine
           went unreachable exactly that way, again, and the e2e that has
           caught it every time is `every Anchor lights by digging down its own
           column`: "3 at (10,188) - the ship got to 95 m", which is Verdax's
           Anchor at 94 in the same column.

           `hard: Infinity` was never the problem here and is not now. What
           must not happen is a permanent mark being IN THE WAY, and the answer
           each time has been to keep the mark and move the obstruction. */
        const a = anchorAt(scarred);
        if (x === a.x && d === a.d + 1) return null;
        /* SATURATED, not dark, and that took two wrong shots to establish.

           The obvious reading is that a scar should be the darkest surface in
           the game, so the first two versions were 0x3c2a5e and then 0x241a3a,
           each darker than the last. Both rendered as ordinary pink granite.
           The lamp is a point light at intensity 30 with decay 1.75 and the
           rock carries a normal map and a per-instance brightness jitter: at
           the range you actually look at a hall from, that lights a dark
           albedo up to mid grey and the normal map's warm mottling does the
           rest. Value cannot separate anything this close to the lamp.

           What CAN is saturation, which the diagnostic settled rather than
           argued: the same block at 0xff0000 came back unmistakably red. So
           the scar is a strong violet held just under the barrier's own
           0x7a4fd4 - the same family as the gate and the spent core, darker
           because it is what is left rather than what is holding.

           0.10 rather than 0, for worked stone's reason four rules up: at zero
           it goes black with the rock at the edge of the lamp and the hall
           reads as unfinished rather than as damaged. */
        return { id: 'anchorscar', name: 'Scar', color: WRONGNESS, host: 0x0c0814,
                 glow: 0.10, hard: Infinity, wt: 0, value: 0, spoil: true };
      }
      /* Off the LOCAL BAND, like the rubble below it and unlike the flat
         numbers the singletons use. A room at 300 m has to be harder than the
         same room at 40 m for the same reason everything else down there is -
         a fixed hardness would make the deepest halls the cheapest walls in
         the game, which is exactly backwards. */
      /* A little self-lit, unlike every rock in the game. Cut stone at the edge
         of the lamp's reach was going black with the rock around it, which
         threw away the one moment the room has to say "somebody built this"
         before you are all the way inside it. */
      return { id: 'worked', name: 'Worked Stone', color: 0x8a7f63, host: 0x2c2a24,
               glow: 0.13, hard: baseRock(d, g.planet, x).hard * hm * WORKED_HARD,
               wt: 0, value: 0, spoil: true };
    }
    if (vch === 'r') {
      const band = baseRock(d, g.planet, x);
      return { id: RUBBLE.id, name: RUBBLE.name, glow: RUBBLE.glow,
               color: mixHex(band.color, RUBBLE.color, 0.5),
               hard: band.hard * hm * RUBBLE_HARD, wt: RUBBLE.wt, value: RUBBLE.value, ore: false };
    }
    if (vch === 'o') {
      return { id: CACHE.id, name: CACHE.name, color: CACHE.color, host: CACHE.host, glow: CACHE.glow,
               shards: CACHE.shards, tone: CACHE.tone, hard: CACHE.hard * hm, wt: CACHE.wt,
               value: CACHE.value, ore: true, cache: true };
    }
    if (vch === '*') {
      return { id: GEODE.id, name: GEODE.name, color: GEODE.color, host: GEODE.host, glow: GEODE.glow,
               shards: GEODE.shards, tone: GEODE.tone, hard: GEODE.hard * hm, wt: GEODE.wt,
               value: GEODE.value, ore: true };
    }
    /* ---------- the derelict, round thirteen ---------- */
    if (vch === 'H') {
      /* Hull plate. Off the local band like every other authored wall, for the
         same reason: a wreck at 300 m has to cost more to open than a wreck at
         40 m, or the deepest ones are the cheapest walls in the game.

         `spoil`, so cutting it puts nothing in the hold. A hull that paid would
         turn twelve tableaux into twelve quarries, and the one thing this room
         is for is being looked at. */
      return { id: 'hulk', name: 'Hull Plate', color: 0x6d7a88, host: 0x252c34,
               glow: 0.09, hard: baseRock(d, g.planet, x).hard * hm * HULK_HARD,
               wt: 0, value: 0, spoil: true };
    }
    if (vch === 'L') {
      /* The wreck's own lamp, and it is the telegraph rather than a prize.

         Glow rides `coreGlow()`, the find-the-vein curve, so it shows through
         unbroken rock exactly as ore does - which means the beat arrives in the
         right order: a light in the ground first, and what is around it second.
         Worth nothing and cuttable at a hull plate's price, because a player
         who drills straight at the light should find it was only a light. */
      /* `ore: true` and it is not ore, which is the Anchor's own trick two
         hundred lines above and it is here for the same reason plus one more.

         blocks.ts reads that flag to choose between "pebbles on a rock face"
         and "a dark housing with bright shards in it", and a lamp wants the
         second. **And the additive HALO is emitted on the ore path only** -
         found by looking, after a first build in which this block had glow
         0.88, correct emissive, and was completely invisible in unlit ground.
         Emissive alone does not carry through rock; the halo is what does, and
         it is the same mechanism that lets you see a vein before you reach it.
         Without the flag the telegraph simply does not exist.

         Safe, because the only other thing `ore` does is decide what enters the
         hold, and `spoil` diverts past that branch before it is reached. The
         shards read as the lens in pieces, which is the right accident. */
      return { id: 'derelictlamp', name: 'Dead Lamp', color: 0xffd9a0, host: 0x2a2620,
               glow: 0.88, shards: 5, tone: 7, ore: true, spoil: true,
               hard: baseRock(d, g.planet, x).hard * hm * HULK_HARD,
               wt: 0, value: 0 };
    }
    if (vch === 'S') {
      /* `cache: true`, so breaking it goes through `grantCache` and hands over
         `cachePrize(x, d)` - the deepest minerals this depth allows, or a
         supply, or credits. See the note in config.ts for why it is not a
         material with a price: a wreck is not depth-gated and a flat price put
         several runs of income at 13 m.

         `salvage` alongside it is presentation only: it picks the crate
         geometry over crystal shards, and it names the toast. */
      return { id: SALVAGE.id, name: SALVAGE.name, color: SALVAGE.color, host: SALVAGE.host,
               glow: SALVAGE.glow, shards: SALVAGE.shards, tone: SALVAGE.tone,
               hard: SALVAGE.hard * hm, wt: 0, value: 0,
               ore: true, cache: true, salvage: true };
    }
  }

  /* A key pocket (round seventeen, AL). Keys no longer roll out of the ore
     ladder: each is a fixed set of small seeded pockets, most in one home
     region, so the map can point at a key and no single find finishes a band
     of the upgrade ladder. An overwriter on its own seed - see sim/keys.ts -
     checked before caves so a pocket is never swallowed by open ground. */
  const kid = keyAt(x, d);
  if (kid) {
    const o = DEF[kid] as Ore;
    return { id: o.id, name: o.name, color: o.color, host: o.host, glow: o.glow, shards: o.shards, tone: o.tone,
             hard: o.hard * hm, wt: o.wt, value: o.value, ore: true, key: true };
  }

  /* Caves, in 2x2 blobs so they read as open ground rather than confetti.
     Evaluated on a coarse grid and with its own seed offset, so adding them
     leaves every ore and rock roll exactly where it was. */
  if (d >= CAVE_MIN_DEPTH &&
      rnd(Math.floor(x / 2), Math.floor(d / 2), 77) < caveChanceOn(d, tr)) {
    return null;
  }

  /* ---------- the vein roll ----------

     One roll per block of cells rather than one per cell, so a whole blob asks
     the ladder the same question. See the long note in config.ts: the per-cell
     `fill` gate below compensates exactly, so this moves ore without changing
     how much of it there is.

     Offset 1063, which was free: 11, 23, 41, 77, 91, 131, 137, 173, 211, 257,
     311, 313, 421, 431, 601, 619 (and 620, 621), 643, 733, 887, 977 and 1013
     are taken. 1064 is its neighbour, the way SLOT_SEED uses its own. */
  /* ---------- which vein, if any, this cell belongs to ----------

     Each block of VEIN_W x VEIN_H cells holds one vein's HEART, and the heart
     roams its whole block rather than being kept a radius clear of the edges.
     That freedom is the fix for a real artifact: clamping the heart inside its
     own block left every block boundary barren, and the measured result was
     vertical stripes of dead rock at columns 0, 4, 8 ... 60, with 0 to 2 ore
     cells in a column where every other column had 16 to 38.

     The price is that a cell has to ask more than one block, because a vein now
     straddles boundaries. At most FOUR: a heart can only reach VEIN_REACH_MAX,
     and twice that is less than a block, so the blocks that could cover this
     cell span at most two in each axis.

     Nearest heart wins where two overlap, so a cell belongs to the vein it is
     most inside rather than to whichever block happened to be visited first. */
  const wob = VEIN_WOBBLE_LO +
    rnd(x + 53, d + 97, g.planet + 1066) * (VEIN_WOBBLE_HI - VEIN_WOBBLE_LO);
  const reach2 = (VEIN_R * wob) * (VEIN_R * wob);
  const bx0 = Math.floor((x - VEIN_REACH_MAX) / VEIN_W);
  const bx1 = Math.floor((x + VEIN_REACH_MAX) / VEIN_W);
  const bd0 = Math.floor((d - VEIN_REACH_MAX) / VEIN_H);
  const bd1 = Math.floor((d + VEIN_REACH_MAX) / VEIN_H);
  /* 1 is "no vein here": every entry's scaled chance is well under 1, so the
     ladder below cannot match it. */
  let r = 1, best = Infinity;
  for (let bxi = bx0; bxi <= bx1; bxi++) {
    for (let bdi = bd0; bdi <= bd1; bdi++) {
      const hx = (bxi + rnd(bxi * 13 + 5, bdi * 29 + 3, g.planet + 1064)) * VEIN_W;
      const hd = (bdi + rnd(bxi * 23 + 11, bdi * 7 + 19, g.planet + 1065)) * VEIN_H;
      const ox = x - hx, od = d - hd;
      const dist = ox * ox + od * od;
      if (dist > reach2 || dist >= best) continue;
      best = dist;
      r = rnd(bxi * 31 + 7, bdi * 17 + 13, g.planet + 1063);
    }
  }
  const inVein = best < Infinity;

  /* Pockets are checked before ore and on their own seed, so they are rare
     enough to be an event rather than a resource. Gas first: it is the one you
     do not want, and it should not be crowded out by a geode roll. */
  const pr = rnd(x + 313, d + 977, g.planet + 41);
  if (d >= GAS.min && pr < gasChanceOn(tr)) {
    return { id: GAS.id, name: GAS.name, color: GAS.color, host: GAS.host, glow: GAS.glow,
             shards: GAS.shards, tone: GAS.tone, hard: GAS.hard * hm, wt: GAS.wt,
             value: GAS.value, ore: true, hazard: true };
  }
  /* Carved out of the middle of the same roll gas and geodes use, so caches
     are independent of both and, like them, only ever overwrite - the ore
     stream underneath is untouched. */
  if (d >= CACHE.min && pr > 0.5 && pr < 0.5 + CACHE.chance) {
    return { id: CACHE.id, name: CACHE.name, color: CACHE.color, host: CACHE.host, glow: CACHE.glow,
             shards: CACHE.shards, tone: CACHE.tone, hard: CACHE.hard * hm, wt: CACHE.wt,
             value: CACHE.value, ore: true, cache: true };
  }
  /* A Bloom, on its own seed and only once the planet has answered.

     Rolled AFTER gas, caches and geodes and on a separate hash, so turning it
     on moves nothing that was already there - which is the invariant the
     frozen baseline defends, and the reason this is a fourth pocket rather
     than a twelfth entry in the ore ladder. An ore would have had to be the
     deepest thing in the game to keep the ladder's subset property, and the
     whole point of a Bloom is that it grows in the shallow ground you thought
     was finished.

     Its own offset: 11, 23, 41, 77, 91, 131, 137, 173, 211, 257, 311, 313,
     421, 601, 619, 977 and 1013 are taken. */
  if (isAwake(g.ground) && d >= BLOOM.min && d < BLOOM_MAX &&
      rnd(x + 149, d + 683, g.planet + 643) < BLOOM.chance) {
    return { id: BLOOM.id, name: BLOOM.name, color: BLOOM.color, host: BLOOM.host,
             glow: BLOOM.glow, shards: BLOOM.shards, tone: BLOOM.tone,
             hard: BLOOM.hard * hm, wt: BLOOM.wt, value: BLOOM.value, ore: true };
  }
  /* A strained lode. Round twelve, V5 - see the long note in config.ts for why
     this and not a telegraphed gas pocket.

     A fifth pocket rather than a twelfth ore, for exactly the reason the Bloom
     is: it is an OVERWRITER on its own hash, so adding it moves nothing that was
     already generated. That is the invariant `blocks-frozen.json` defends, and
     the census golden's own legal-change list names the overwriters by name
     because the claim is what makes them legal - they replace a cell and
     consume no roll.

     Offset 887, which was free: 11, 23, 41, 77, 91, 131, 137, 173, 211, 257,
     311, 313, 421, 431, 601, 619, 643, 977 and 1013 are taken.

     Unlike the Bloom it does NOT wait for the planet to wake. Ground under load
     is a property of the deep and not of the Lattice being disturbed, and the
     wake is already carrying enough meaning of its own. */
  if (d >= LODE.min && rnd(x + 71, d + 419, g.planet + 887) < LODE.chance) {
    return { id: LODE.id, name: LODE.name, color: LODE.color, host: LODE.host,
             glow: LODE.glow, shards: LODE.shards, tone: LODE.tone,
             hard: LODE.hard * hm, wt: LODE.wt, value: LODE.value, ore: true, lode: true };
  }
  /* Deeper than the second gate the geodes come back at three times the rate
     (round seventeen, AL). The cut that took them from 69% of the shallow
     value to a quarter was about the shallow tiers, where they drowned the
     keys; below 226 m money is gold, lodes and these, and with too few of
     them the heat-zone rungs became a credit grind on the campaign probe. */
  if (d >= GEODE.min && pr > 1 - geodeChanceOn(tr) * (d >= gateDepth(1) ? GEODE_DEEP_MULT : 1)) {
    return { id: GEODE.id, name: GEODE.name, color: GEODE.color, host: GEODE.host, glow: GEODE.glow,
             shards: GEODE.shards, tone: GEODE.tone, hard: GEODE.hard * hm, wt: GEODE.wt,
             value: GEODE.value, ore: true };
  }

  for (const o of ORES) {
    /* Keys never come out of the ladder (sim/keys.ts places them), and money
       ore thins out below its own band - copper was the commonest ore at the
       very bottom of the world, which is a reason to feel nothing when you
       find it (round seventeen, AL). Skipping an entry leaves its cells to the
       rock underneath rather than to the next ore up. */
    if (isKey(o.id)) continue;
    if (o.max !== undefined && d > o.max) continue;
    /* The block roll picks which ore this block is a vein of, and the disc
       decides whether this cell is inside it. The block probability is scaled
       by cells-per-block over cells-per-vein, so the two multiply back to
       `chance` - the supply the world had before veins existed. */
    if (d >= o.min && r < o.chance * (VEIN_W * VEIN_H) / VEIN_CELLS && inVein) {
      return { id: o.id, name: o.name, color: o.color, host: o.host, glow: o.glow, shards: o.shards, tone: o.tone,
               hard: o.hard * hm, wt: o.wt, value: o.value, ore: true };
    }
  }
  const b = baseRock(d, g.planet, x);

  /* A seam: the same cells that already had mineral flecks scattered on their
     face. Its own seed offset, checked only after every ore roll has failed,
     so it can only ever replace plain rock.

     Coloured as the band lifted toward the seam's own sandy tone, the same
     trick rubble uses - it has to belong to the wall it is in while still
     being the thing your eye goes to. Hardness stays the band's: finding one
     should not also be a chore. */
  if (rnd(x + 61, d + 17, g.planet) < SEAM_CHANCE) {
    return { id: SEAM.id, name: SEAM.name, glow: SEAM.glow,
             /* Only a fifth of the way toward the seam tone. The body has to
                stay recognisably its own band; the flecks are what the eye is
                meant to catch. A stronger blend turned every wall sandy. */
             color: mixHex(b.color, SEAM.color, 0.2),
             hard: b.hard * hm, wt: SEAM.wt, value: SEAM.value, ore: false, seam: true };
  }

  return { id: b.id, name: b.name, color: b.color, glow: b.glow, hard: b.hard * hm, wt: b.wt, value: b.value, ore: false };
}

export const haulValue = () => {
  let v = 0;
  for (const k in g.cargo) {
    /* Anything the sale table does not know about is worth nothing rather than
       fatal. DEF covers every ore, rock, geode, gas pocket, cache, seam and
       rubble - but the core, the bedrock, a relic and a drive component are
       built inline in blockAt() and are not in it, so a single one of those
       reaching the hold turned every call to this into
       "Cannot read properties of undefined (reading 'value')".

       This is called from updateHUD, which runs every frame, so that is not a
       bad sale - it is a save that cannot be loaded. The econ probe hit exactly
       this by digging into a core, and the game deserves the same guard. */
    const def = DEF[k];
    const n = g.cargo[k];
    /* And a count that is not a real number contributes nothing rather than
       turning the whole haul into NaN, which the HUD then prints. Found by the
       test below rather than by a player, which is the right order. */
    /* A key is banked, never sold (round seventeen, AK), so it is worth
       nothing at the pad - and the haul readout says so. */
    if (def && Number.isFinite(n) && !isKey(k)) v += n * def.value;
  }
  return Math.round(v * valueM());
};

/* ---------- cache contents ----------

   Rolled from the cell's own coordinates rather than from Math.random, so a
   given cache on a given planet always holds the same thing. That is the same
   discipline as the rest of generation and it buys two concrete things: the
   reward is testable, and it cannot be re-rolled by closing the tab at the
   right moment.

   The weighting is deliberate. Supplies most often, because a consumable you
   did not buy is the most interesting thing to be handed - it changes what
   this run can attempt. Minerals second, and always the deepest kind the depth
   allows, because after the mineral gate the thing most likely to be blocking
   you is two emerald rather than any amount of money. Credits last and least:
   money is the one reward the game already hands out constantly. */
export type CachePrize =
  | { kind: 'supply'; id: SupplyKey }
  | { kind: 'mineral'; id: string; n: number }
  | { kind: 'credits'; n: number };

export function cachePrize(x: number, d: number): CachePrize {
  const r = rnd(x + 601, d + 149, g.planet + 91);
  const r2 = rnd(x + 907, d + 313, g.planet + 137);

  if (r < 0.55) {
    /* Something you have never held, while there is anything left you have
       never held. The weighted roll below is what a cache always did and is
       what it goes back to once the kit is complete - at that point the
       question is which consumable you WANT, not which one you have seen.

       This is what makes the kit a discovery without adding a second hunt to
       the world: caches were already buried on every world and already handed
       over consumables, and the only thing missing was the consequence. See
       the note on supplies in finds.ts. */
    const fallback: SupplyKey = r2 < 0.42 ? 'cell' : r2 < 0.8 ? 'patch' : 'coolant';
    const id = cacheSupply(SUPPLIES.map((s2) => s2.key), g.foundKit, fallback) as SupplyKey;
    return { kind: 'supply', id };
  }

  if (r < 0.86) {
    /* the deepest three minerals this depth can hold, so a deep cache is
       worth more than a shallow one without needing a separate table */
    /* Money only (round seventeen, AK): the measured caches handed out more
       coreite than the rock held and the legendary key as a toast. A key has
       to be found in the rock, or it is not a thing you hunt. */
    const reachable = ORES.filter((o) => o.min <= d && !isKey(o.id));
    const pick = reachable.slice(0, 3);
    const o = (pick.length ? pick : reachable)[Math.floor(r2 * Math.max(1, pick.length)) % Math.max(1, pick.length)];
    if (!o) return { kind: 'credits', n: 500 };
    return { kind: 'mineral', id: o.id, n: 3 + Math.floor(r2 * 4) };
  }

  return { kind: 'credits', n: Math.round((400 + d * 22) * valueM()) };
}

/* ---------- collapse ----------

   Chooses which cells a tremor fills in, applies it, and guarantees the result
   is survivable. Lives here rather than in actions.ts because the guarantee is
   the whole design and it has to be testable without a renderer.

   The guarantee: after the collapse, `findRoute()` must still find open tunnel
   from the ship to the pad. If it cannot, the entire collapse is reverted and
   the tremor is spent as noise. A tremor takes time, fuel and patience. It
   must never take the run.

   Candidates are dug cells ABOVE the ship and outside the safe radius. Above,
   because what a collapse threatens is the way out; filling in dead ends below
   you would be a light show rather than a mechanic. */
export function planCollapse(want: number, rand: () => number): string[] {
  const sx = Math.round(g.px), sd = Math.round(g.pd);
  const pool: string[] = [];
  for (const k of g.dug) {
    const c = k.split(',');
    const x = +c[0], d = +c[1];
    if (d < 0 || d > sd - 1) continue;
    if (Math.abs(x - sx) + Math.abs(d - sd) < TREMOR_SAFE_RADIUS) continue;
    pool.push(k);
  }
  if (!pool.length) return [];

  /* Shuffled so a tremor does not always eat the same end of the tunnel.
     Fisher-Yates rather than sort(() => rand() - 0.5), which is not a shuffle
     and is biased toward leaving the array roughly where it started. */
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }

  const taken = pool.slice(0, want);
  for (const k of taken) { g.rubble.add(k); g.dug.delete(k); }

  if (!findRoute()) {
    for (const k of taken) { g.rubble.delete(k); g.dug.add(k); }
    return [];
  }
  return taken;
}

/* ---------- the ground closing behind you ----------

   W8's second half, and the one that makes a MAP go stale rather than a
   resource. Once the planet has answered, tunnels in restless ground fill in
   while you are away, so the shaft you cut last night is not necessarily there
   this morning - and the route home is computed from the tunnels you cut.

   Terraria's Hardmode is the sourced device: edit the world the player already
   has rather than building more of it. This is the cheapest possible version
   and it is aimed at the one thing in this game that a player genuinely owns.

   Four things keep it from taking a run, and `CRAFT.md` is absolute that it
   must not:

   1. it only ever runs WHILE DOCKED - see the caller
   2. it fills with RUBBLE, which is diggable, not with rock
   3. it never touches the ground around the pad, so the way down always
      starts open
   4. and it is proportional to how angry the region is, so quiet ground stays
      exactly as you left it for ever */

/* How much of a region's tunnels close per return, at maximum Unrest. A tenth:
   a shaft you keep using is re-cut as you use it and stays open, and one you
   abandoned is gone in a dozen runs. */
export const CLOSE_RATE = 0.10;

/* And the ground that never closes. Eight metres of the pad's own column, so
   leaving is never something you have to dig out of. */
export const CLOSE_SAFE = 8;

export function planClose(rand: () => number): string[] {
  if (!isAwake(g.ground)) return [];
  const floor = UNREST_BANDS[1].at;

  /* Bucketed by region first, because the share closing is a property of the
     region and not of the planet - which is the whole reason Unrest is per
     region at all. */
  const pools: string[][] = [];
  for (let i = 0; i < REGION_COUNT; i++) pools.push([]);
  for (const k of g.dug) {
    const c = k.split(',');
    const x = +c[0], d = +c[1];
    if (d < 0) continue;
    if (Math.abs(x - START_X) <= 1 && d <= CLOSE_SAFE) continue;
    pools[regionAt(x, d)].push(k);
  }

  const taken: string[] = [];
  for (let i = 0; i < REGION_COUNT; i++) {
    const u = g.ground.unrest[i];
    if (u <= floor || !pools[i].length) continue;
    const share = CLOSE_RATE * ((u - floor) / (1 - floor));
    const want = Math.floor(pools[i].length * share);
    if (want <= 0) continue;
    const pool = pools[i];
    for (let j = pool.length - 1; j > 0; j--) {
      const n = Math.floor(rand() * (j + 1));
      const t = pool[j]; pool[j] = pool[n]; pool[n] = t;
    }
    for (const k of pool.slice(0, want)) taken.push(k);
  }
  for (const k of taken) { g.rubble.add(k); g.dug.delete(k); }
  return taken;
}

/* shortest route home through already dug tunnels, breadth first */
/* How many cells of flying it is from here to the pad.

   The real route through tunnel, not the depth: a shaft you have wandered
   sideways in is longer than the metre reading, and the difference is exactly
   the margin the Point of No Return is measured against.

   Falls back to the depth plus one when there is no route at all, which means
   you are sealed in and would have to cut your way out. That is a LOWER bound
   on the real cost rather than an honest one - but the alternative is
   declaring you stranded the moment a tremor closes a tunnel you could open
   again with two cells of drilling, and a warning that cries wolf is a warning
   nobody reads. */
export function climbCells(): number {
  const r = findRoute();
  if (r) return r.length - 1;
  return Math.max(0, Math.round(g.pd) + 1);
}

export function findRoute() {
  const sx = Math.round(g.px), sd = Math.round(g.pd);
  const goal = key(START_X, -1);
  const start = key(sx, sd);
  if (start === goal) return null;
  const prev = new Map();
  const seen = new Set([start]);
  let queue = [[sx, sd]];
  let found = false;
  let guard = 0;
  while (queue.length && !found && guard < 40000) {
    const next = [];
    for (const cell of queue) {
      const cx = cell[0], cd = cell[1];
      const around = [[cx, cd - 1], [cx - 1, cd], [cx + 1, cd], [cx, cd + 1]];
      for (const n of around) {
        guard++;
        const nx = n[0], nd = n[1];
        if (nx < 0 || nx >= W || nd < -3 || nd > coreM()) continue;
        const k = key(nx, nd);
        if (seen.has(k)) continue;
        /* A ghost cell is open ground to the route finder, because the ship can
           fly through it. Reading this the same way collision does is the whole
           point of the flag: a route that called a lit Anchor solid would make
           the fuel-to-climb estimate and the autopilot disagree with where the
           ship can actually go. */
        const nb = blockAt(nx, nd);
        if (nb && !nb.ghost) continue;
        seen.add(k);
        prev.set(k, cell);
        if (k === goal) { found = true; break; }
        next.push(n);
      }
      if (found) break;
    }
    queue = next;
  }
  if (!found) return null;
  const route = [];
  let cur = [START_X, -1];
  while (cur) {
    route.push(cur);
    const p = prev.get(key(cur[0], cur[1]));
    if (!p) break;
    cur = p;
  }
  route.reverse();
  return route.length > 1 ? route : null;
}
