/* The close stack: one way every panel opens, so Android back closes the top one.

   Round seventeen, AB. A fullscreen PWA with nothing pushed onto history leaves
   the app on back, and this game pushed nothing: back over the shop, the map or
   a card closed the game. Every panel now registers here as it opens, and back
   closes the topmost and nothing else. On the bare HUD back falls through and
   leaves, which is what back means there.

   ---------- why the history is allowed to run ahead of the stack ----------

   Closing a panel with its own button does NOT pop history. `history.back()` is
   asynchronous, and the game chains cards (an Anchor breaks, then the planet
   answers, then the centre opens): the next card's push would land while the
   last close's back was still in flight, and Chrome is free to cancel one or
   the other. So a button close leaves its entry behind as DEBT, the next open
   reuses that debt instead of pushing, and a back that pops a debt entry with
   nothing open keeps going until it falls through. History never grows past the
   deepest the stack has been, and nothing here ever races a traversal it made.

   CloseWatcher is the newer primitive for this, but it can be closed by the
   browser without a user gesture, and an open android-browser-helper report
   says a TWA and an installed PWA disagree about back; plain history is the one
   both agree on. */

type Entry = { id: string; close: () => void };

const stack: Entry[] = [];
/* Entries this module has pushed that are still in the history. */
let pushed = 0;

export function panelOpened(id: string, close: () => void): void {
  const at = stack.findIndex((e) => e.id === id);
  if (at >= 0) { stack[at].close = close; return; }
  stack.push({ id, close });
  if (pushed < stack.length) {
    history.pushState({ lattice: id }, '');
    pushed++;
  }
}

/* A panel's own button closed it. Nothing to do to history (see above). */
export function panelClosed(id: string): void {
  const at = stack.findIndex((e) => e.id === id);
  if (at >= 0) stack.splice(at, 1);
}

export const openPanels = (): string[] => stack.map((e) => e.id);

/* Whatever entry the back popped - the top panel's own or a debt left by a
   button close - it closes the top panel if there is one. With nothing open it
   was meant for whatever is behind the game, so it keeps going until the debt
   is spent and it falls through. */
window.addEventListener('popstate', () => {
  pushed = Math.max(0, pushed - 1);
  const top = stack.pop();
  if (top) { top.close(); return; }
  history.back();
});
