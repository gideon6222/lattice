/* The Pressure Seal and the Resonance Tip: the gas feat's gift and the
   hard-rock feat's gift. Progression round, BE.

   Both answer something the player has just done enough of to have met. The
   Seal is a hull ring that takes the sting out of gas and, at its third rung,
   vents it so it does not soak into the heat. The Tip gives the drill a verb in
   hard rock: a strike cracks the cell behind it, so what took a long cut takes
   fewer strikes. Four rungs each, no rung a wall.

   Pure: the caller multiplies its own numbers by these. */

export const SEAL_MAX = 4;
export const TIP_MAX = 4;

/* What a gas pocket's hull damage is multiplied by. */
const SEAL_TAKE = [1, 0.8, 0.65, 0.5, 0.35];
export const sealTake = (level: number) => SEAL_TAKE[Math.max(0, Math.min(SEAL_MAX, Math.floor(level || 0)))];

/* What the heat-soak spike from gas is multiplied by: from the third rung the
   ship vents the gas and carries none of it. */
export const SEAL_VENTS_AT = 3;
export const sealSoak = (level: number) => ((level || 0) >= SEAL_VENTS_AT ? 0 : 1);

/* The share of a hard cell's work left to do. The fourth rung is the half the
   design names: a vein in hard rock opens in half the strikes. */
const TIP_WORK = [1, 0.85, 0.7, 0.6, 0.5];
export const TIP_FROM = 5;
export const tipWork = (level: number, hard: number) =>
  hard >= TIP_FROM && isFinite(hard) ? TIP_WORK[Math.max(0, Math.min(TIP_MAX, Math.floor(level || 0)))] : 1;
