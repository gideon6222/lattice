/* campaign-model.mjs - the ladder, played end to end on the pure layer.

   Round seventeen, AA. Every probe this repo had was written for an older game:
   econ.mjs still believed the world was 13 columns wide, the secrets probe
   walked straight through barriers, and longplay.mjs predates the gates and
   has never lit more than one Anchor. So nothing measured how long a tier of
   the ladder takes, and every retune after it would have argued with memory.

   This plays the whole campaign from nothing, with the shipping generator,
   prices, fuel, heat, caps and gates: mine, sell, buy, go and get whatever
   the ladder offers next, and write down when each thing happened.

   ---------- the model ----------

   A trip is: fly across the surface to a column, go straight down it (cutting
   what is not already cut, flying what is), optionally work a corridor at the
   bottom, climb, fly home, sell. It is priced before it is taken, and a trip
   that would run the tank dry or the hull out is never taken - so this cannot
   die, and every minute it reports is a FLOOR. It never hesitates, never
   explores, and always knows where everything is. A player will be slower.

   What it goes and gets, cheapest trip first: a buried device crate, an
   Anchor it can stand beside, a core whose tier is ready, the Vault. When no
   such trip is affordable it mines for money instead, at the depth that pays
   best per second, and buys the cheapest rung the shelf will sell.

   A barrier is a wall because `blockAt` says so: nothing here knows where the
   gates are except to aim at a core. That is the test `campaign.test.mjs`
   pins - a probe that could fly through a closed barrier would measure a game
   that does not exist. */

export function makeCampaign(H) {
  const g = H.g;
  const S = H.S;
  const START = H.START_X;

  function reset() {
    H.setWorld(0);
    for (const k of Object.keys(g.up)) g.up[k] = 0;
    g.credits = 0; g.relics = []; g.relicsTaken = [];
    g.ground = H.newGround();
    g.cargo = {}; g.weight = 0; g.dug = new Set(); g.stock = {};
    g.found = []; g.best.depth = 0;
    g.px = START; g.pd = -1;
    g.hull = S.hullCap();
  }

  const wall = (x, d) => {
    const b = H.blockAt(x, d);
    return !!b && !b.ghost && b.hard === Infinity;
  };

  function heatAt(x, d) {
    const t = H.traitAt(x, Math.max(0, d));
    const line = H.heatDepth(g.planet, t);
    return { line, span: H.coreM() - line, rise: t.soak || 1 };
  }

  /* One trip, priced. `stopAt` is the depth to stand at; `corridor` works the
     seam at the bottom until the hold is full or the tank reaches its reserve.
     Nothing is committed: the caller does that with `commit`. */
  function price(x, stopAt, corridor, extra = []) {
    let t = 0, fuel = S.fuelCap(), hull = S.hullCap(), soak = 0;
    const cap = S.cargoCap();
    const cargo = {}; let weight = 0;
    const cut = [];
    const finds = [], caches = [];
    const speed = S.speed();
    const move = (secs) => { t += secs; fuel -= H.FUEL_PER_MOVE * secs * S.fuelUse(); };
    const heat = (cx, d, secs) => {
      const h = heatAt(cx, d);
      soak = H.soakAfter(soak, d, secs, h.rise, h.line);
      hull -= H.heatDamagePerSecond(d, S.shield(), soak, h.line, h.span) * S.heatTake() * secs;
    };
    const take = (cx, d) => {
      const b = H.blockAt(cx, d);
      if (!b) { move(1 / speed); heat(cx, d, 1 / speed); return true; }
      if (b.hard === Infinity && !b.ghost) return false;
      if (b.ghost) { move(1 / speed); return true; }
      const secs = (b.hard * H.DIG_BASE) / S.drill();
      t += secs; fuel -= H.fuelPerCell(b.hard) * S.cellFuel() * S.fuelUse();
      heat(cx, d, secs);
      if (b.find) finds.push(b.find);
      if (b.cache) caches.push([cx, d]);
      if (b.value != null && H.DEF[b.id] && weight + b.wt <= cap) {
        cargo[b.id] = (cargo[b.id] || 0) + 1; weight += b.wt;
      }
      cut.push(cx + ',' + d);
      return true;
    };

    /* Straight down x, or - when something permanent is in the way (an Anchor's
       scar, a sealed hall's skin) - straight down a column beside it and then
       across at the bottom, which is how a player goes round a plug. */
    let route = null;
    for (const off of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5]) {
      const c = x + off;
      if (c < 0 || c >= H.W) continue;
      const cells = [];
      for (let d = 0; d <= stopAt; d++) cells.push([c, d]);
      for (let cx = c; cx !== x; cx += Math.sign(x - c)) cells.push([cx + Math.sign(x - c), stopAt]);
      if (!cells.some(([cx, d]) => wall(cx, d))) { route = { c, cells }; break; }
    }
    let blockedAt = -1;
    if (!route) {
      for (let d = 0; d <= stopAt; d++) if (wall(x, d)) { blockedAt = d; break; }
      if (blockedAt < 0) blockedAt = stopAt;
    } else {
      move(Math.abs(route.c - START) / speed);
      for (const [cx, d] of route.cells) {
        take(cx, d);
        if (fuel <= 0 || hull <= 0) break;
      }
    }
    if (blockedAt < 0 && corridor) {
      const reserve = () => (stopAt / speed + Math.abs(x - START) / speed) * H.FUEL_PER_MOVE * S.fuelUse() * 1.35;
      let off = 1, side = 1;
      while (weight < cap && fuel > reserve() && hull > 0 && off < 30) {
        const cx = x + off * side;
        if (cx < 0 || cx >= H.W) { side = -side; if (side === 1) off++; continue; }
        if (!take(cx, stopAt)) break;
        side = -side; if (side === 1) off++;
      }
    }
    /* A tour: from the first stop on to more stops, cutting across then down
       - the way a player digs from one glowing pocket to the next rather than
       flying home between them. */
    let lastX = x, lastD = stopAt;
    for (const [ex, ed] of extra) {
      if (blockedAt >= 0) break;
      const cells = [];
      for (let cx = lastX; cx !== ex; cx += Math.sign(ex - lastX)) cells.push([cx + Math.sign(ex - lastX), lastD]);
      for (let cd = lastD; cd !== ed; cd += Math.sign(ed - lastD)) cells.push([ex, cd + Math.sign(ed - lastD)]);
      if (cells.some(([cx, cd]) => wall(cx, cd))) { blockedAt = ed; break; }
      for (const [cx, cd] of cells) take(cx, cd);
      lastX = ex; lastD = ed;
    }
    move(lastD / speed + Math.abs(lastX - START) / speed + (route && !extra.length ? Math.abs(route.c - x) / speed : 0));
    const ok = blockedAt < 0 && fuel > 0 && hull > 0;
    return { ok, blockedAt, t, fuel, hull, cargo, weight, cut, finds, caches };
  }

  function commit(trip) {
    for (const k of trip.cut) g.dug.add(k);
    for (const f of trip.finds) {
      if (!g.found.includes(f.key)) g.found.push(f.key);
      g.up[f.key] = Math.max(g.up[f.key] || 0, 1);
    }
    for (const [cx, cd] of trip.caches) {
      const p = H.cachePrize(cx, cd);
      if (p.kind === 'mineral') g.stock[p.id] = (g.stock[p.id] || 0) + p.n;
      else if (p.kind === 'credits') g.credits += p.n;
    }
    g.cargo = trip.cargo; g.weight = trip.weight;
    g.px = START; g.pd = -1;
    /* As `sell()` does since round seventeen (AK): money is sold, keys are
       banked and never sold. */
    const value = Math.round(H.salePayout(H.haulValue()) * S.saleBonus());
    for (const k in trip.cargo) if (H.isKey(k)) g.stock[k] = (g.stock[k] || 0) + trip.cargo[k];
    g.cargo = {}; g.weight = 0;
    g.credits += value;
    return value;
  }

  const PRIORITY = ['cool', 'tank', 'drill', 'hull', 'thrust', 'laser'];
  /* What each rung was last waiting on before it was bought: its credits, or
     its key. Round seventeen, AK's receipt: keys should hold back the rungs
     past each gate, and credits should still hold back the rest. */
  const waiting = {};
  const waitedOn = { credits: 0, key: 0 };
  function noteWaits() {
    for (const u of H.shelfStock(g.best.depth, g.found)) {
      const lvl = g.up[u.key] || 0;
      if (lvl >= Math.min(u.max, H.levelCap(u, g.best.depth))) continue;
      const needKey = [H.matCost(u, lvl), H.capstoneCost(u, lvl)].some((m) => m && (g.stock[m.id] || 0) < m.need);
      const needCred = H.costOf(u, lvl) > g.credits;
      if (needKey && !needCred) waiting[u.key + lvl] = 'key';
      else if (needCred && !needKey) waiting[u.key + lvl] = 'credits';
    }
  }
  function buyAll() {
    const bought = [];
    for (;;) {
      const owned = (u) => g.up[u.key] || 0;
      const shelf = H.shelfStock(g.best.depth, g.found).filter((u) => {
        const lvl = owned(u);
        if (lvl >= Math.min(u.max, H.levelCap(u, g.best.depth))) return false;
        if (H.costOf(u, lvl) > g.credits) return false;
        return [H.matCost(u, lvl), H.capstoneCost(u, lvl)].every((m) => !m || (g.stock[m.id] || 0) >= m.need);
      });
      if (!shelf.length) return bought;
      /* Reach first, then comfort. With keys scarce (round seventeen, AK) the
         cheapest-first policy spent the probe's first emerald on the hold and
         the scanner and never on the tank that was blocking the next Anchor -
         the same mistake no player makes twice. Within a priority, cheapest. */
      const rank = (u) => { const i = PRIORITY.indexOf(u.key); return i < 0 ? PRIORITY.length : i; };
      const u = shelf.sort((a, b) => rank(a) - rank(b) || H.costOf(a, owned(a)) - H.costOf(b, owned(b)))[0];
      const lvl = owned(u);
      const w = waiting[u.key + lvl];
      if (w) waitedOn[w]++;
      const mc = H.matCost(u, lvl);
      if (mc) g.stock[mc.id] -= mc.need;
      const cap = H.capstoneCost(u, lvl);
      if (cap) g.stock[cap.id] -= cap.need;
      g.credits -= H.costOf(u, lvl);
      g.up[u.key] = lvl + 1;
      bought.push(u.key + ' ' + (lvl + 1));
    }
  }

  /* Everything the ladder offers right now, as places to stand. */
  function goals() {
    const out = [];
    for (const [k, f] of H.findCells()) {
      if (g.found.includes(f.key)) continue;
      const i = k.indexOf(',');
      out.push({ kind: 'device', what: f.key, x: +k.slice(0, i), d: +k.slice(i + 1) - 1 });
    }
    for (let r = 0; r < H.ANCHOR_COUNT; r++) {
      if (g.ground.lit.includes(r)) continue;
      const a = H.anchorAt(r);
      out.push({ kind: 'anchor', what: r, x: a.x, d: a.d - 1 });
    }
    for (let t = 0; t < H.GATE_COUNT; t++) {
      if (g.ground.gates.includes(t) || !H.gateReady(t, g.ground.lit)) continue;
      out.push({ kind: 'core', what: t, x: H.coreColumn(t), d: H.gateDepth(t) - 1 });
    }
    /* A pocket of a key some rung is waiting on (round seventeen, AL): a
       player hunts the pocket the Survey and the sensors point at rather than
       mining a row and hoping. The six nearest the pad, so the goal list does
       not grow with the world. */
    const want = wantedKeys();
    const ks = [];
    for (const pk of H.keyPockets(g.planet).pockets) {
      if (!want[pk.id]) continue;
      const [x, d] = pk.cells[0];
      if (g.dug.has(x + ',' + d)) continue;
      /* A pocket a room or a gate was stamped over is not a key in the world. */
      const b = H.blockAt(x, d);
      if (!b || b.id !== pk.id) continue;
      ks.push({ kind: 'key', what: pk.id, x, d, far: Math.abs(x - START) + d });
    }
    ks.sort((a, b) => a.far - b.far);
    /* Each pocket goal carries up to two more wanted pockets near it, so a
       trip is a short tour rather than one cell and home. */
    for (const k of ks.slice(0, 6)) {
      const then = [];
      let cx = k.x, cd = k.d;
      for (const o of ks) {
        if (o === k || then.length >= 2) continue;
        if (Math.abs(o.x - cx) + Math.abs(o.d - cd) <= 8) { then.push([o.x, o.d]); cx = o.x; cd = o.d; }
      }
      out.push({ ...k, then });
    }
    if (H.vaultOpen(g.ground.gates) && !g.won) {
      out.push({ kind: 'vault', what: 0, x: H.VAULT_CORE_X, d: H.VAULT_CORE_D - 1 });
    }
    return out;
  }

  function arrive(goal) {
    if (goal.kind === 'anchor') H.lightAnchor(g.ground, goal.what);
    else if (goal.kind === 'core') {
      H.openGate(g.ground.gates, goal.what);
      /* Breaking a core is flying into the gate's own cell, so the deepest
         metre reached is the gate's - without this the shelf never stepped,
         because the probe stood one metre above every barrier it opened. */
      g.best.depth = Math.max(g.best.depth, H.gateDepth(goal.what));
    }
    else if (goal.kind === 'vault') g.won = true;
    else if (goal.kind === 'device' && !g.found.includes(goal.what)) {
      g.found.push(goal.what); g.up[goal.what] = Math.max(g.up[goal.what] || 0, 1);
    }
  }

  /* Where to mine: a handful of shafts spread across the world, each reused
     the way a player reuses a shaft already cut, at whichever column and depth
     pays best per second of what the ship can reach and survive right now.
     One fixed shaft was the probe's first stall: it ran two columns from the
     pad, straight into Rustmoor's scar at 42 m, and mined an empty column for
     eighty runs - a policy bug that looked exactly like a balance problem. */
  const MINE_XS = [-24, -16, -8, 2, 10, 18, 26].map((o) => START + o).filter((x) => x >= 1 && x < H.W - 1);
  /* The keys some rung on the shelf is waiting for right now - a rung the cap
     allows, whose credits are in reach or close, held back by a key. Round
     seventeen, AK: keys never sell, so a probe that mined for credits alone
     sat on 280,000 of them unable to buy a tank level for want of two emerald.
     A player hunts the key, so the probe values a wanted key well above its
     weight in money. */
  const KEY_WANT = 4000;
  /* What stops the nearest goal: out of fuel wants the tank, cooked by the
     heat wants the rig and the plating. Set each run from the goal trips that
     failed, so the hunt is for the fix a player would reach for. */
  let needLines = ['tank', 'cool', 'drill'];
  function wantedKeys() {
    const want = {};
    for (const u of H.shelfStock(g.best.depth, g.found)) {
      /* Only the lines that fix what is stopping the next goal. A player
         hunts a key for the tank that reaches the next Anchor, not for the
         magnet; the rest are bought when keys turn up. */
      if (!needLines.includes(u.key)) continue;
      const lvl = g.up[u.key] || 0;
      if (lvl >= Math.min(u.max, H.levelCap(u, g.best.depth))) continue;
      /* Only once the credits are in the bank: a key for a rung you cannot
         pay for yet is a key you fetch and then sit on. */
      if (H.costOf(u, lvl) > g.credits) continue;
      for (const m of [H.matCost(u, lvl), H.capstoneCost(u, lvl)]) {
        if (m && (g.stock[m.id] || 0) < m.need) want[m.id] = true;
      }
    }
    return want;
  }
  function bestMine() {
    let best = null;
    const want = wantedKeys();
    /* And a shaft down the middle of each wanted key's home region, the way a
       player reads the Survey map (round seventeen, AL: keys live in pockets,
       most of them in one home region, not wherever the ladder rolled them). */
    const cols = MINE_XS.slice();
    for (const p of H.KEY_PLANS) {
      if (!want[p.id]) continue;
      const home = H.keyHome(p, g.planet);
      const span = H.W / H.REGION_COLS;
      cols.push(Math.round((home % H.REGION_COLS + 0.5) * span));
    }
    for (const mx of cols) {
      for (let d = 6; d < H.WORLD_DEPTH; d += 6) {
        const trip = price(mx, d, true);
        if (trip.blockedAt >= 0) break;
        if (!trip.ok) continue;
        const saved = { cargo: g.cargo, weight: g.weight };
        g.cargo = trip.cargo; g.weight = trip.weight; g.px = START; g.pd = -1;
        let value = H.salePayout(H.haulValue());
        g.cargo = saved.cargo; g.weight = saved.weight;
        for (const k in trip.cargo) if (want[k]) value += trip.cargo[k] * KEY_WANT;
        const rate = value / Math.max(1, trip.t);
        if (!best || rate > best.rate) best = { d, trip, rate };
      }
    }
    return best;
  }

  function play({ maxRuns = 600, stallRuns = 80 } = {}) {
    reset();
    const log = [];
    let runs = 0, secs = 0, sinceProgress = 0;
    const tierStart = [{ run: 0, secs: 0 }];
    const tiers = [];
    const note = (what, extra = {}) => log.push({ run: runs, min: +(secs / 60).toFixed(1), what, ...extra });

    while (runs < maxRuns && !g.won) {
      /* The cheapest reachable goal, if any trip to one is survivable. */
      let pick = null, nearestFail = null;
      for (const goal of goals()) {
        const trip = price(goal.x, goal.d, false, goal.then || []);
        if (!trip.ok) {
          if (goal.kind !== 'key' && trip.blockedAt < 0 && (!nearestFail || trip.t < nearestFail.t)) nearestFail = trip;
          continue;
        }
        if (!pick || trip.t < pick.trip.t) pick = { goal, trip };
      }
      if (nearestFail) needLines = nearestFail.fuel <= 0 ? ['tank', 'drill'] : ['cool', 'hull'];
      let trip, label;
      if (pick) { trip = pick.trip; label = pick.goal; }
      else {
        const m = bestMine();
        if (!m) { note('stalled: no survivable trip at all'); break; }
        trip = m.trip; label = { kind: 'mine', d: m.d };
      }
      runs++; secs += trip.t;
      const depthReached = label.kind === 'mine' ? label.d : label.d;
      g.best.depth = Math.max(g.best.depth, depthReached);
      commit(trip);
      if (label.kind === 'key') {
        note('key ' + label.what + ' at ' + (label.d) + ' m');
      } else if (label.kind !== 'mine') {
        arrive(label);
        note(label.kind + ' ' + (label.kind === 'anchor' ? H.regionName(label.what) : label.what) + ' at ' + (label.d + 1) + ' m');
        sinceProgress = 0;
        if (label.kind === 'core' || label.kind === 'vault') {
          const s = tierStart[tierStart.length - 1];
          tiers.push({
            tier: tiers.length,
            ends: label.kind === 'core' ? 'gate ' + label.what + ' opens' : 'the Vault',
            runs: runs - s.run,
            minutes: +((secs - s.secs) / 60).toFixed(1),
            atMinute: +(secs / 60).toFixed(1),
            credits: g.credits,
            drill: g.up.drill, tank: g.up.tank, cool: g.up.cool, hull: g.up.hull,
            waitedOnCredits: waitedOn.credits, waitedOnKeys: waitedOn.key
          });
          waitedOn.credits = 0; waitedOn.key = 0;
          tierStart.push({ run: runs, secs });
        }
      } else sinceProgress++;
      noteWaits();
      const bought = buyAll();
      if (bought.length) sinceProgress = 0;
      if (sinceProgress > stallRuns) { note('stalled: ' + stallRuns + ' runs with nothing new'); break; }
    }
    return {
      won: !!g.won, runs, minutes: +(secs / 60).toFixed(1), tiers, log,
      gates: g.ground.gates.slice(), lit: g.ground.lit.length, found: g.found.slice()
    };
  }

  return { reset, wall, price, play };
}
