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
  }
};
