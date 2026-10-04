export const MAX_ALONE: number;
export const MAX_BESIDE: number;
export function cpuBudget(threads: number, others: number): number;
export function affinityMask(threads: number, n: number): bigint;
export function otherGates(env?: Record<string, string | undefined>): number;
export function applyCpuCap(): number | null;
