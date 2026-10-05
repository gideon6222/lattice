/* What changed, in the player's terms.

   The build stamp answers "did my update land". It cannot answer "what is
   actually different", which after a few sessions of work is the question that
   matters more. A commit log is the wrong shape for that - it is written for
   whoever has to maintain the code, and there are eighty of them.

   Rules for entries: describe what the player can now do or see, not what was
   refactored; one line each; newest first. If an entry cannot be written that
   way it probably did not need a version.

   Entries start at the first build uploaded to Google Play (0.39.0, version
   code 1, 2026-09-13). Every line is a new feature, an improvement, or a fix
   worded as what is better now, and nothing a player would read as negative
   (his rule, 2026-09-30). test/version.test.mjs holds both. */

export interface Release {
  version: string;
  date: string;
  title: string;
  notes: string[];
}

export const VERSION = '0.57.0';

/* The first version on Google Play, and how many releases came before it.
   Those are not shown, but they were releases, so the count is kept here the
   way the Godot games' RELEASES_BEFORE_PLAY keeps theirs. The Play version
   code is not tied to it: tools/twa.ps1 raises the code once per version that
   is uploaded, and every upload so far is one of the entries below. */
export const FIRST_ON_PLAY = '0.39.0';
export const RELEASES_BEFORE_PLAY = 52;

export const CHANGELOG: Release[] = [
  {
    version: '0.57.0', date: '2026-10-03', title: 'Found and earned',
    notes: [
      'The fitting bay shows only what you own: three lines at most on a rack, one sealed mount that says how to get it, a Next line on top, and your supplies in a KIT drawer. Autopilot and the Repair Drone have a CREW rack of their own.',
      'A Ledger opens from the pause sheet with DEVICES, FEATS and RELICS, so you can see what you have done and what it handed you.',
      'Sell a full hold and the Ore Sorter is yours: in a full hold the drill swaps the cheapest ore for a richer find. It has three rungs and a sieve drum on the hull.',
      'Ride out gas and cut hard rock and two more gifts arrive. The Pressure Seal takes a third off gas hits and vents it at the top rungs. The Resonance Tip opens hard rock in fewer strikes. Both show on the hull.',
      'The first ship you lose leaves a black box on the pad: the Return Beacon. Hold HOME for two seconds underground, once a run, and the ship climbs to the pad with a share of the hold and all your keys.',
      'Two new finds wait in crates: a Flare Line beside an old wreck lights a dark pocket for a minute, and an Arc Lance in an Anchor hall breaks a whole vein of ore. Each has a part on the hull.',
      'Cleaner menus: one big PLAY on the title, a pause sheet with RESUME first and SETTINGS beside it, the long list behind MORE, and one X in the top corner of every sheet.',
      'Bots that play the game end to end pace the whole ladder: your first purchase comes within two runs, the Ore Sorter by the third, and no rung asks for more than four runs of saving.'
    ]
  },
  {
    version: '0.56.0', date: '2026-09-30', title: 'Keys, the fitting bay, and the sound of rock',
    notes: [
      'Minerals are two things now. Copper, iron, silver and gold are money: you sell them at the pad. Amethyst, emerald, ruby and the rarer ones are keys: one crystal at a time in small pockets, never sold, and the better parts of the ship are made from them.',
      'Every key you cut is a moment: it flashes in its own color, the camera leans in, and the map marks it. Your sensors can tell you a key is near, never where.',
      'The shop is a fitting bay. The ship stands on its lift, and every upgrade is a card that says what it does and what it costs, in credits and in keys. Two taps fit a level.',
      'Every barrier you open has a bay of its own, a save point, and something the pad will never sell. The first one sells Sink.',
      'The barriers and cores are things in the rock now, with their own light and heat. The last core is the door of the Vault, and the ending shows the light leaving.',
      'Deep in the second tier, pockets of air sit sealed in dense rock, each holding a cache. Drill in slowly, or sink straight through and let the hull pay.',
      'Scars you pack with ore close as you watch, and every Anchor you break leaves a sign in the rock and then in the air.',
      'The sky over the pad shows, the HUD is slimmer, and Android back closes the top panel and keeps you in the game.',
      'Every sound is new: real recordings of rock, stones, air and machinery, their highs kept quiet over a deep warm body. The drill runs on a motor that labors in harder rock.'
    ]
  },
  {
    version: '0.55.0', date: '2026-09-19', title: 'The descent is a ladder now',
    notes: [
      'Ore comes in veins. The same amount is in the ground as before, gathered into pockets, so a wall of nothing is a real answer and finding one seam can be worth the whole trip. Anything genuinely rare announces itself when you cut it.',
      'The first Anchor you wake does something new: the Survey map starts marking where the ground is rich, in the regions you have already woken. It says richer or leaner, never what or exactly where.',
      'A barrier stops you at 113 meters, and again at 226 and 339. The drill cannot touch it, and it runs the full width of the world. Wake all three Anchors of that depth and one cell of the barrier opens up: a dark core, warm gold in a cold violet wall, directly in your path.',
      'Cut it and the whole barrier goes with it. The core stays where it was, spent and still lit, and you fly straight through it on the way down. The last of the three is the Vault\'s own door.',
      'The Outfitter grows with the barriers. The surface shelf holds the rig you need for the first hundred meters. Break the first core and the shelf steps up: more rows, and higher levels on the ones you already own. Break the second and it opens the rest.',
      'Two upgrades are built from minerals that match their new place on the ladder: the Scrubber wants emerald and Hull Plating wants amethyst.',
      'Repairing the planet is a trip: carry ore down to the scar of an Anchor you broke and pack it into the hole. It is worth three times what tipping it in at the surface was, and it settles the ground around it. It comes out of the hold, so every kilo of it is a kilo of ore you are not bringing back.',
      'Every core hands something over, and none of it is a number. The first gives you THE HOLLOW: hold SEE and empty space shows through rock within a few cells (caves, rooms, a wreck), never what is in it. The second gives you SINK: hold it and the ship falls straight through solid rock, paying in hull instead of time, mining nothing on the way. The third gives you THE CALL, and whatever is still buried in the regions you have broken answers it on the Survey map.',
      'A barrier, an Anchor, the bedrock and the Vault all hold firm against Sink. Those are the four things this planet will not let you past.',
      'The Ballast waits beside the pad, full and still, until the first core breaks. The moment you release that core it starts to fall, and every core after it makes it fall faster.',
      'The Anchors break when you reach them. Standing next to one settles its region, strengthens the Ballast and draws the ground onto your map, and the thing itself comes apart, hard, leaving a dark scar in the plinth it was set into. The scar stays, so every place you have been stays marked.'
    ]
  },
  {
    version: '0.54.0', date: '2026-09-19', title: 'Somebody else got here first',
    notes: [
      'There is a wrecked drill ship buried in every region of the planet - twelve of them, always in the same places. You will see the shape of it in the dark before you see what it is: flat plates where the ground has none, and its own lamp still faintly lit at the low end where it went in nose-first.',
      'The plates are a wall, and behind them is that ship\'s hold, still holding whatever its crew had dug. A wreck near the surface is full of copper, and one near the bottom holds what that depth gives. It costs you no cargo weight, so a full hold always has room for one.',
      'It asks nothing of you: no choice to make and no clock on it. It is something that happened down here before you arrived, and it gives the planet a history.'
    ]
  },
  {
    version: '0.53.1', date: '2026-09-19', title: 'The icon is the game now',
    notes: [
      'The icon on your home screen is a real frame out of the game: the ship in its own lamp, in a shaft it cut, in the same rock you actually dig through.'
    ]
  },
  {
    version: '0.53.0', date: '2026-09-18', title: 'The ending shows you the world',
    notes: [
      'When the Vault opens, the camera pulls back over the planet while you read the card, holds there long enough to look at what you dug, and then hands the frame back. The ending says the ground is yours and there is more of it than you have seen - now you can see some of it.'
    ]
  },
  {
    version: '0.52.0', date: '2026-09-18', title: 'The ground will not be as you left it',
    notes: [
      'When the fifth Anchor wakes the planet, it takes some of your own tunnels back, so the card\'s warning that the ground will not be as you left it reaches the digging you have already done.',
      'It takes what you can spare. One straight hole down loses almost nothing, tunnels spread across the planet lose more, and the last way back to the pad always stays open.'
    ]
  },
  {
    version: '0.51.0', date: '2026-09-18', title: 'The planet in three acts',
    notes: [
      'The world looks different depending on how far through you are. Before the fifth Anchor it is the dead place it always was. From the fifth on, when the ground starts moving on its own, the air and the far rock take on the same ember the deep heat has, so the planet reads as being against you.',
      'Once the Vault is open and the center is behind you, it goes quiet: cooler, and with some of the color taken out. The ending says the ground is yours, and now the ground looks like it.',
      'The lighting, the prices and where everything is all stay exactly as they were. It is the same game in a different mood.'
    ]
  },
  {
    version: '0.50.0', date: '2026-09-18', title: 'Rock that is holding something up',
    notes: [
      'Below ninety meters you will start seeing a warm glow in the rock that is worth more than anything else down there. Cutting it pays better than any ore at that depth. It also brings the tunnel you came down in partly down behind you, so the way home is one you have to find again. Both choices cost you something, which is the point of it.',
      'It can take your easy way out. It can never take your run: if the ground coming down would leave you with no route to the pad at all, it holds instead.',
      'The Survey map writes the name of a region you have calmed in the Anchors’ own color, so you can see how much of the planet is settled without counting markers.'
    ]
  },
  {
    version: '0.49.0', date: '2026-09-18', title: 'The game says what it wants',
    notes: [
      'Nine marks sit under the depth readout, one for each Anchor, and they light as you light them, so the screen always says what you are down there for.',
      'The tenth mark is the Vault. It stays dark until all nine Anchors are lit, and then it is the only thing left on the row.'
    ]
  },
  {
    version: '0.48.0', date: '2026-09-14', title: 'It says why it cannot run',
    notes: [
      'A browser that cannot run the game says so in a sentence you can act on. The usual cause on a computer is graphics acceleration being switched off, and it says that.',
      'With scripts turned off the page says what it needs.'
    ]
  },
  {
    version: '0.47.0', date: '2026-09-14', title: 'A menu keeps the keyboard',
    notes: [
      'With a menu open, the keyboard stays in it, so Tab moves through the menu you are reading.'
    ]
  },
  {
    version: '0.46.0', date: '2026-09-14', title: 'The warning is readable now',
    notes: [
      'The restart warning, the line that tells you what erasing your progress costs, is easy to read, and so is the build stamp. Every other word on screen was measured to make sure it already was.'
    ]
  },
  {
    version: '0.45.0', date: '2026-09-14', title: 'When the phone takes the graphics away',
    notes: [
      'If the phone takes the game’s graphics away, which Android does when an app has been in the background a while or when the driver resets, the game stops, saves and tells you, then picks up again when the graphics come back.'
    ]
  },
  {
    version: '0.44.0', date: '2026-09-14', title: 'Less motion, if you ask for it',
    notes: [
      'If your phone is set to reduce motion, the game listens. The camera holds steady and the screen keeps its color, and every warning stays exactly as visible as it was, held steady rather than pulsing. Turning the motion down keeps all of the information.',
      'Sharing the link shows the game’s name, a line about it and its icon.',
      'Added to an iPhone home screen, the game gets its own icon.'
    ]
  },
  {
    version: '0.43.0', date: '2026-09-14', title: 'It looks right on a screen that is not mine',
    notes: [
      'Held sideways, or on a small phone, every button down the left stays in view beside the fuel gauge, MAP, BALLAST and AUTOPILOT included.',
      'On a wide screen the ground reaches the edges of the frame.',
      'The pause menu keeps RESUME on screen on a short screen, so the way back into the game is always in reach.',
      'A phone held upright frames the game exactly as before.'
    ]
  },
  {
    version: '0.42.0', date: '2026-09-14', title: 'Detail, and a screen that stays on',
    notes: [
      'Three levels of visual detail in the menu - LOW, MEDIUM and HIGH - which change straight away and are remembered. They change the resolution, how much dust is in the air, how much grows on the rock and whether the rock has relief. They never change the game: the same reach, the same rules, the same ore.',
      'The screen stays awake while you are flying, all through a long dig on one held thumb.'
    ]
  },
  {
    version: '0.41.0', date: '2026-09-13', title: 'The Outfitter says what to do',
    notes: [
      'The panel under the shop shelves picks up where the "swipe to walk the aisles" hint leaves off after your first visit, so the screen always has something to tell you.',
      'The Outfitter deck is wet: glossy, with the aisle you are standing in throwing its own color across it.'
    ]
  },
  {
    version: '0.40.0', date: '2026-09-13', title: 'Your thumb can move',
    notes: [
      'The d-pad holds on when your thumb drifts. A key is held until you lift it, even if your hand slides off the edge of it mid-dig.',
      'Slide from one key to the next without lifting and the ship follows.',
      'Every fade, slide and press in the game runs on the same four speeds and the same curve.'
    ]
  },
  {
    version: '0.39.0', date: '2026-09-13', title: 'A hull older than the halls',
    notes: [
      'A new ship: a sealed, faceted hull of pale worn stone with a single teal light running along its seams, the same teal an Anchor gives off when you light it, because it is the same hands that made both.',
      'It is advanced and it is very old. One flank plate is struck out of line and has never been re-seated, two of its panels have gone dark, and the surface is pitted rather than rusted.'
    ]
  }
];
