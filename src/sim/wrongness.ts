/* The one wrongness colour. Round seventeen, AE.

   Fable's review of the ladder: the barrier, the core, the scars and the pip
   were four violets from four files, so the eye never learned that they were
   one thing. The research names the fix - one colour that means one thing,
   and nothing else ever wears it - and this is where it is defined.

   What takes it, and only these: the core's light, the scar a broken Anchor
   leaves, the pip that says a core is open, and the lift band in a gate's
   room. Everything else that wants violet uses its own violet. A test greps
   the whole of src and index.html for this value and allows it here only. */
export const WRONGNESS = 0x8a5ad0;

const R = (WRONGNESS >> 16) & 255, G = (WRONGNESS >> 8) & 255, B = WRONGNESS & 255;

/* As CSS, for the canvas map and the flashes. */
export const wrongCss = (alpha = 1) => 'rgba(' + R + ',' + G + ',' + B + ',' + alpha + ')';
export const wrongHex = '#' + WRONGNESS.toString(16).padStart(6, '0');

/* Darker by a fraction 0..1: each tier's core is darker than the last. */
export function wrongDarker(k: number): number {
  const f = Math.max(0, Math.min(1, 1 - k));
  return (Math.round(R * f) << 16) | (Math.round(G * f) << 8) | Math.round(B * f);
}

/* How a core that has appeared looks, by tier: darker, stronger, and more
   alive - a wider, faster pulse and more of the rock around it taken dark.
   Pure so the test can pin "darker and more alive tier by tier" as numbers
   rather than as an adjective; barrier.ts draws it. */
export function coreLook(t: number) {
  return {
    color: wrongDarker(0.16 * t),
    intensity: 16 + 6 * t,
    pulse: 0.18 + 0.16 * t,
    rate: 1.4 + 0.9 * t,
    dimRadius: 4 + 2 * t,
    dim: 0.22 + 0.14 * t
  };
}
