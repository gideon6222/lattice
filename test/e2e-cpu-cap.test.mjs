import test from 'node:test';
import assert from 'node:assert/strict';
import { cpuBudget, affinityMask, MAX_ALONE, MAX_BESIDE } from '../tools/e2e-cpu-cap.mjs';

test('the browser gets at most MAX_BESIDE CPUs while other gates run', () => {
  assert.equal(cpuBudget(16, 1), MAX_BESIDE);
  assert.equal(cpuBudget(16, 4), MAX_BESIDE);
});

test('alone it gets MAX_ALONE, and never more than half a small PC', () => {
  assert.equal(cpuBudget(16, 0), MAX_ALONE);
  assert.equal(cpuBudget(8, 0), 4);
  assert.equal(cpuBudget(2, 0), 1);
  assert.equal(cpuBudget(1, 3), 1);
});

test('the mask is the top n CPUs', () => {
  assert.equal(affinityMask(16, 2), 0xC000n);
  assert.equal(affinityMask(16, 6), 0xFC00n);
  assert.equal(affinityMask(8, 1), 0x80n);
});
