/* The scenarios both shot tools drive, kept in one place.

   Extracted from `filmstrip.mjs` on 2026-09-18 when `shot.mjs` was added.
   Before that the list lived inside filmstrip and could not be reached without
   running it: importing that file starts a server and launches a browser at
   module scope. Two tools that drive the same game should not disagree about
   what "the dig" means, and the way that happens is one of them getting its own
   copy.

   Each scenario is: how to get the game into the state, and what to do between
   frames. `setup` runs once; `step` runs before every capture after the first.
   Both are strings because they are evaluated in the page. `secs` and `frames`
   are filmstrip's defaults for the scene and are ignored by a single shot. */
export const SCENES = {
  /* The first-run intro, from the tap. Twenty frames a second and a half
     apart is the whole thing on one sheet: the hall, the rise, the surface
     at night, the descent. */
  intro: {
    secs: 1.5,
    frames: 20,
    setup: `
      localStorage.clear();
      __cw.showIntro();
      document.getElementById('intro').click();
    `,
    step: `__cw.advance(SECS);`
  },

  /* The title screen: the hall in the dark, the Anchor's own glow. */
  title: {
    secs: 0.5,
    frames: 4,
    setup: `
      localStorage.setItem('coreward.v2', JSON.stringify({ credits: 5000, best: { depth: 140, haul: 900 }, dug: [], up: {} }));
      __cw.g.pd = -1; __cw.g.best.depth = 140;
      __cw.showTitle();
    `,
    step: `__cw.advance(SECS);`
  },

  /* CONTINUE: the intro at a run, silent. Sixteen frames a quarter second
     apart is the whole four seconds. */
  continue: {
    secs: 0.25,
    frames: 16,
    setup: `
      /* A save has to exist or CONTINUE is correctly greyed and inert - which
         is what this scenario caught the first time it ran. */
      localStorage.setItem('coreward.v2', JSON.stringify({ credits: 5000, best: { depth: 140, haul: 900 }, dug: [], up: {} }));
      __cw.g.pd = -1; __cw.g.best.depth = 140;
      __cw.showTitle();
      __cw.advance(0.5);
      document.getElementById('btnContinue').click();
    `,
    step: `__cw.advance(SECS);`
  },

  /* The Outfitter. `enter` first, or the click lands on a button behind the
     intro - which is exactly what the first run of this scenario showed. */
  shop: {
    secs: 0.25,
    frames: 12,
    enter: true,
    setup: `
      __cw.g.credits = 9e6; __cw.g.best.depth = 300;
      for (const k of ['iron','copper','silver','gold','amethyst','emerald','ruby']) __cw.g.stock[k] = 99;
      __cw.g.px = 6; __cw.g.pd = -1;
      __cw.advance(0.5);
      document.getElementById('btnShop').click();
    `,
    step: `__cw.advance(SECS);`
  },

  /* CONTINUE on a checkpoint: light the first Anchor from beside it, then
     the title, then straight to the ship - the hall, the travel, the lamp. */
  continuecp: {
    secs: 0.25,
    frames: 14,
    enter: true,
    setup: `
      const hall = __cw.hallEye();
      __cw.g.px = hall.px; __cw.g.pd = hall.pd + 1; __cw.g.fuel = 40;
      __cw.resetBlocks();
      for (let i = 0; i < 20 && __cw.g.mode !== 'event'; i++) __cw.advance(0.1);
      document.getElementById('evBtn').click();
      __cw.showTitle();
      __cw.advance(0.5);
      document.getElementById('btnContinue').click();
    `,
    step: `__cw.advance(SECS);`
  },

  /* New Game Plus with the skip taken on the second frame: straight to the
     descent, which still plays. */
  ngskip: {
    secs: 0.7,
    frames: 12,
    setup: `
      localStorage.clear();
      __cw.g.won = true;
      __cw.showIntro();
      document.getElementById('intro').click();
    `,
    step: `
      /* Once. A second press during the descent ends it, by design. */
      if (!window.__skipped) { window.__skipped = true; document.getElementById('introSkip').click(); }
      __cw.advance(SECS);
    `
  },

  /* The shop as a NEW player sees it - which is the one the "cluttered" note
     was about, and the one that is easy to never look at. */
  shopnew: {
    secs: 0.25,
    frames: 3,
    enter: true,
    setup: `
      __cw.g.credits = 800; __cw.g.best.depth = 8;
      __cw.g.px = 6; __cw.g.pd = -1;
      __cw.advance(0.5);
      document.getElementById('btnShop').click();
    `,
    step: `__cw.advance(SECS);`
  },

  /* The ground on four different worlds, side by side: what a wall looks like
     is the whole point of the growth and the surface channels. */
  ground: {
    secs: 0.1,
    frames: 4,
    enter: true,
    setup: `
      window.__w = [0, 2, 5, 9];
      window.__i = 0;
      window.__show = (w) => {
        __cw.g.world = w; __cw.g.planet = w; __cw.g.trait = 'stable';
        __cw.g.coreOff = 0; __cw.g.rich = 1;
        const dug = [];
        for (let d = 0; d <= 30; d++) dug.push('6,' + d);
        for (let x = 2; x <= 10; x++) dug.push(x + ',18');
        __cw.g.dug = new Set(dug);
        __cw.g.px = 6; __cw.g.pd = 14;
        __cw.resetBlocks();
        __cw.advance(0.4);
      };
      __show(__w[0]);
    `,
    step: `
      __i++;
      __show(__w[__i % __w.length]);
      __cw.advance(SECS);
    `
  },

  /* The breach: the core goes and the world starts closing from the bottom.
     Eight frames over the first half of the clock, which is where the grade
     moves fastest. */
  breach: {
    secs: 5,
    frames: 8,
    enter: true,
    setup: `
      __cw.stopClock();
      __cw.g.up.thrust = 4; __cw.g.up.tank = 9; __cw.g.up.cool = 9; __cw.g.up.drill = 8;
      __cw.g.best.depth = 300;
      const core = __cw.coreM();
      const dug = [];
      for (let d = 0; d <= core - 1; d++) for (let x = 5; x <= 7; x++) dug.push(x + ',' + d);
      __cw.g.dug = new Set(dug);
      __cw.g.px = 6; __cw.g.pd = core - 2;
      __cw.resetBlocks();
      __cw.beginBreach();
      __cw.advance(0.2);
    `,
    step: `
      /* climbing, so the frames show the front rising behind the ship */
      __cw.R.held = 'up';
      __cw.advance(SECS);
    `
  },

  /* The Claim, from intact to wrecked. Four frames because damage is shown as
     a lean and a settle, and a lean is only legible against the one before it. */
  claim: {
    secs: 0.15,
    frames: 4,
    enter: true,
    setup: `
      window.__lv = [100, 70, 35, 0];
      window.__i = 0;
      window.__show = (v) => {
        __cw.g.px = 6; __cw.g.pd = -1;
        __cw.g.claim.refinery = v; __cw.g.claim.derrick = v; __cw.g.claim.shed = v;
        __cw.g.claim.strain = (100 - v) / 100;
        __cw.advance(0.3);
      };
      __show(__lv[0]);
    `,
    step: `
      __i++;
      __show(__lv[__i % __lv.length]);
      __cw.advance(SECS);
    `
  },

  /* Flying down a shaft: the case the lighting work was all about. */
  dig: {
    secs: 0.4,
    frames: 16,
    enter: true,
    setup: `
      const dug = [];
      for (let d = 0; d <= 40; d++) dug.push('6,' + d);
      for (let x = 2; x <= 10; x++) dug.push(x + ',28');
      __cw.g.dug = new Set(dug);
      __cw.g.px = 6; __cw.g.pd = 18;
      __cw.advance(0.3);
    `,
    step: `
      __cw.R.held = 'down';
      __cw.advance(SECS);
    `
  },

  /* THE FIRST MINUTE, as a new player has it: land, hold DOWN, and see what
     the ship goes through. A fresh save, the stock ship, no shaft. Twelve
     frames four seconds apart is the whole of POLISH.md's "the first minute
     gives a win" on one sheet - the roof of Rustmoor's hall should be in it,
     and so should the card that follows. */
  firstminute: {
    secs: 4,
    frames: 12,
    enter: true,
    setup: `
      __cw.advance(0.3);
    `,
    step: `
      /* The card stops the clock on 'event'; press its button so the sheet
         shows what comes after the win as well as the win. */
      const ev = document.getElementById('event');
      if (ev && !ev.classList.contains('hidden')) document.getElementById('evBtn').click();
      __cw.R.held = 'down';
      __cw.advance(SECS);
    `
  },

  /* THE OBJECTIVE ROW, mid-campaign. Round twelve, V2.

     The tally is nine pips under the depth line and its whole job is to be
     readable at a glance, which means the state worth looking at is the one
     with SOME of them lit - all-off and all-on both read as a plain row. Four
     lit is far enough in to show the contrast and short enough to show that the
     row still has somewhere to go.

     The dug shaft is copied from the `dig` scene rather than shared, because
     what this scene is for is the top 80 pixels of the screen and the ground
     under it only has to be somewhere plausible. */
  anchors: {
    secs: 0.4,
    frames: 4,
    enter: true,
    setup: `
      const dug = [];
      for (let d = 0; d <= 40; d++) dug.push('6,' + d);
      for (let x = 2; x <= 10; x++) dug.push(x + ',28');
      __cw.g.dug = new Set(dug);
      __cw.g.px = 6; __cw.g.pd = 18;
      __cw.g.ground.lit = [0, 1, 2, 3];
      __cw.advance(0.3);
    `,
    step: `
      __cw.R.held = 'down';
      __cw.advance(SECS);
    `
  },

  /* THE THREE ACTS. Round twelve, V7.

     Same shaft, same depth, same time of day - the only thing that differs is
     where the campaign is. Shot side by side that is the only way to judge a
     grade, because "does the world feel different" is a comparison and a single
     frame cannot answer it.

     Act one is the `dig` scene itself, so it is not repeated here. */
  act2: {
    secs: 0.4,
    frames: 4,
    enter: true,
    setup: `
      const dug = [];
      for (let d = 0; d <= 40; d++) dug.push('6,' + d);
      __cw.g.dug = new Set(dug);
      __cw.g.px = 6; __cw.g.pd = 18;
      /* The wake: five Anchors lit is where act two begins. */
      __cw.g.ground.lit = [0, 1, 2, 3, 4];
      __cw.g.ground.woke = true;
      __cw.advance(0.3);
    `,
    step: `__cw.R.held = 'down'; __cw.advance(SECS);`
  },

  /* A WRECK, round thirteen W2. Verdax's, at 10,46, because it is the
     shallowest of the twelve and so the one a first descent actually meets.

     The cell is written in rather than derived, and that is a deliberate
     trade: `derelictAt` is not on the debug seam and putting it there to serve
     a screenshot would be adding a hole to the game for a picture. The test
     suite is what keeps the position honest; if the wreck ever moves, this
     scene shows rock and says so loudly - which it did once already, when the
     CACHE.min floor pushed Rustmoor's wreck from 13 m to Verdax's at 46.

     The tunnel stops two cells SHORT of the hull on purpose. What this scene
     is for is the approach - the dead lamp glowing through unbroken rock,
     which is the whole telegraph - and a shot from inside the wreck would only
     show that a room exists. */
  wreck: {
    secs: 0.4,
    frames: 4,
    enter: true,
    setup: `
      const WX = 10, WD = 46;
      const dug = [];
      for (let d = 0; d <= WD - 6; d++) dug.push(WX + ',' + d);
      __cw.g.dug = new Set(dug);
      __cw.g.px = WX; __cw.g.pd = WD - 7;
      __cw.resetBlocks();
      __cw.advance(0.5);
    `,
    step: `__cw.R.held = 'down'; __cw.advance(SECS);`
  },

  /* The wreck's whole flank, cleared from the side.

     Not a state any player reaches, and that is what it is for: judging whether
     eighteen hull plates, a hold and a lamp read as a SHIP needs the silhouette
     entire and lit, which a tunnel's-eye view can never show. The first pass of
     W2 was judged from inside a shaft and passed; side-on it was obviously a
     patch of pale rock. */
  wreckopen: {
    secs: 0.4,
    frames: 2,
    enter: true,
    setup: `
      const WX = 10, WD = 46;
      const dug = [];
      /* Through to x = WX - 5, which is the room's own border column. The first
         version stopped one short and left a wall of natural rock between the
         ship and the wreck: the lamp's flood does not pass rock, so the whole
         room sat in the dark and the shot showed a void. */
      for (let d = 0; d <= WD + 8; d++) for (let x = WX - 13; x <= WX - 5; x++) dug.push(x + ',' + d);
      __cw.g.dug = new Set(dug);
      __cw.g.px = WX - 4; __cw.g.pd = WD;
      __cw.resetBlocks();
      __cw.advance(0.6);
    `,
    step: `__cw.advance(SECS);`
  },



  /* THE SURVEY MAP with the first Anchor's gift showing. Round fourteen, X4.

     Three regions lit so the wash appears on some of the map and not all of
     it - the thing being judged is whether a rich region reads as different
     from an ordinary one WITHOUT reading as a marker, and that is a judgement
     about a map with both on it.

     Most of the world seen, because the wash only paints over ground already
     explored and a fresh save would show a black chart. */
  surveymap: {
    secs: 0.3,
    frames: 3,
    enter: true,
    setup: `
      const seen = [];
      for (let ty = 0; ty < 113; ty++) for (let tx = 0; tx < 16; tx++) seen.push(tx + ',' + ty);
      __cw.g.seen = seen;
      __cw.g.ground.lit = [2, 7, 10];
      __cw.g.best.depth = 400;
      __cw.g.px = 6; __cw.g.pd = -1;
      __cw.advance(0.4);
      document.getElementById('btnMap').click();
      __cw.advance(0.4);
    `,
    step: `__cw.advance(SECS);`
  },

  /* A VEIN, round fourteen X1. A seven-cell gold vein at 16,72 on planet 0 -
     the biggest between 64 and 140 m, found by sweeping the world rather than
     by looking for a nice one, so this is a typical good find and not a
     showpiece.

     The shaft stops three cells short so the shot is the approach: ore glows
     through unbroken rock (coreGlow, the find-the-vein curve), and what is
     being judged is whether SEVEN cells of it reads differently from the one
     cell this game used to give you. */
  vein: {
    secs: 0.4,
    frames: 6,
    enter: true,
    setup: `
      const VX = 16, VD = 72;
      const dug = [];
      for (let d = 0; d <= VD - 4; d++) dug.push(VX + ',' + d);
      __cw.g.dug = new Set(dug);
      __cw.g.up.drill = 3;
      __cw.g.px = VX; __cw.g.pd = VD - 5;
      __cw.resetBlocks();
      __cw.advance(0.4);
    `,
    step: `__cw.R.held = 'down'; __cw.advance(SECS);`
  },


  /* THE BARRIER, and the door in it. Round fifteen, Y1 and Y2.

     Two frames of one place: the ship arriving at tier 0's forcefield with its
     Anchors not yet broken, and the same cell once they are. What is being
     judged is whether the barrier reads as a wall rather than as rock, and
     whether the core reads as an invitation - which is the whole of the turn
     the story takes, so it has to look like a reward and not like a warning.

     The shaft is cut straight down the core's own column so both frames are
     the same picture with one cell different. */
  barrier: {
    secs: 0.4,
    frames: 2,
    enter: true,
    setup: `
      const CX = __cw.coreColumn(0), CD = __cw.gateDepth(0);
      const dug = [];
      for (let d = 0; d <= CD - 4; d++) dug.push(CX + ',' + d);
      for (let x = CX - 4; x <= CX + 4; x++) for (let d = CD - 4; d <= CD - 1; d++) dug.push(x + ',' + d);
      __cw.g.dug = new Set(dug);
      __cw.g.up.drill = 4; __cw.g.up.scan = 3;
      __cw.g.px = CX; __cw.g.pd = CD - 3;
      __cw.resetBlocks();
      __cw.advance(0.5);
    `,
    step: `__cw.advance(SECS);`
  },

  /* The same wall once the tier's three Anchors are broken. */
  barrieropen: {
    secs: 0.4,
    frames: 2,
    enter: true,
    setup: `
      const CX = __cw.coreColumn(0), CD = __cw.gateDepth(0);
      const dug = [];
      for (let d = 0; d <= CD - 4; d++) dug.push(CX + ',' + d);
      for (let x = CX - 4; x <= CX + 4; x++) for (let d = CD - 4; d <= CD - 1; d++) dug.push(x + ',' + d);
      __cw.g.dug = new Set(dug);
      __cw.g.ground.lit = __cw.gateAnchors(0).slice();
      __cw.g.up.drill = 4; __cw.g.up.scan = 3;
      __cw.g.px = CX; __cw.g.pd = CD - 3;
      __cw.resetBlocks();
      __cw.advance(0.5);
    `,
    step: `__cw.advance(SECS);`
  },

  /* A LIT ANCHOR, with the ship sitting inside its cell. Round fourteen, X6.

     `hallEye()` is Anchor 1's hall, which is the one the intro uses, so its
     own geometry is already known-good. The ship is put ON the monument rather
     than beside it, because the thing to judge is whether a cell you fly
     THROUGH still reads as solid and powerful - a light rather than a hole.

     The hall is dug out around it so the shot is the monument and not the wall
     in front of it. */
  anchorbroken: {
    secs: 0.4,
    frames: 4,
    enter: true,
    setup: `
      const hall = __cw.hallEye();
      const AX = hall.px, AD = hall.pd + 2;
      const dug = [];
      /* Everything EXCEPT the Anchor's own cell AND the plinth around it.
         blockAt checks g.dug before it checks the authored rooms, so putting
         the monument's cell in the dug set erases it - which is exactly what
         the first run of this scene did, and the shot came back as an empty
         hall full of haze. Round fifteen, Y13 widened the exclusion from one
         cell to nine, because the remnant IS the plinth and a scene that digs
         it out is a scene of the one thing this milestone did not change. No
         backticks in here: this whole setup IS a template literal. */
      for (let d = AD - 7; d <= AD + 5; d++) for (let x = AX - 6; x <= AX + 6; x++) {
        if (Math.abs(x - AX) <= 1 && Math.abs(d - AD) <= 1) continue;
        dug.push(x + ',' + d);
      }
      __cw.g.dug = new Set(dug);
      __cw.g.ground.lit = [1];
      /* Three cells ABOVE the plinth, not on it. The old shot put the ship on
         the Anchor's own cell, which was right while the Anchor was the
         brightest thing in the game - you were judging whether a cell you fly
         THROUGH still reads as solid. Round fifteen, Y13 made it the dimmest
         thing in the hall, and a lamp at intensity 30 sitting on a scar washes
         out the one surface the shot is of. */
      __cw.g.px = AX; __cw.g.pd = AD - 3;
      __cw.resetBlocks();
      __cw.advance(0.6);
    `,
    step: `__cw.advance(SECS);`
  },

  /* CUTTING INTO ONE, which is the beat nothing else here shows.

     The approach scene proves a wreck announces itself and the opened one
     proves it reads as a ship. Neither shows the thing the player actually
     DOES: two hull plates at three and a quarter times the band, the one line
     the ship's instruments say when the first of them breaks, and the hold
     behind them. Straight down column WX from four metres above, which is the
     way anybody would meet it. */
  wreckcut: {
    secs: 1.2,
    frames: 12,
    enter: true,
    setup: `
      const WX = 10, WD = 46;
      const dug = [];
      for (let d = 0; d <= WD - 6; d++) dug.push(WX + ',' + d);
      __cw.g.dug = new Set(dug);
      /* A real drill rather than the stock one: at tier 0 two hull plates is
         most of a minute and the sheet would be twelve frames of the same
         rock face. This is what a player who has reached 46 m actually has. */
      __cw.g.up.drill = 3;
      __cw.g.px = WX; __cw.g.pd = WD - 6;
      __cw.resetBlocks();
      __cw.advance(0.4);
    `,
    step: `__cw.R.held = 'down'; __cw.advance(SECS);`
  },

  /* And the same wreck opened up, so the hull, the hold and the lamp can be
     judged as a tableau rather than as a glow. */
  wreckin: {
    secs: 0.4,
    frames: 4,
    enter: true,
    setup: `
      const WX = 10, WD = 46;
      const dug = [];
      for (let d = 0; d <= WD - 3; d++) dug.push(WX + ',' + d);
      for (let x = WX - 5; x <= WX + 5; x++) dug.push(x + ',' + (WD - 4));
      __cw.g.dug = new Set(dug);
      __cw.g.px = WX; __cw.g.pd = WD - 4;
      __cw.resetBlocks();
      __cw.advance(0.5);
    `,
    step: `__cw.advance(SECS);`
  },

  act3: {
    secs: 0.4,
    frames: 4,
    enter: true,
    setup: `
      const dug = [];
      for (let d = 0; d <= 40; d++) dug.push('6,' + d);
      __cw.g.dug = new Set(dug);
      __cw.g.px = 6; __cw.g.pd = 18;
      __cw.g.ground.lit = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      __cw.g.ground.woke = true;
      /* The Vault has been opened and the card read. The planet is quiet now. */
      __cw.g.won = true;
      __cw.advance(0.3);
    `,
    step: `__cw.R.held = 'down'; __cw.advance(SECS);`
  }
};
