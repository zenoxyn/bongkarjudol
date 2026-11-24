import test from 'node:test';
import assert from 'node:assert/strict';
import {
  accumulateFreeSpinPayouts,
  estimateSpinDurationMs,
  getMaxAffordableBet,
  getSpinTimingProfile,
  stepAllowedBet,
} from './simulatorControls.ts';

test('Normal mode spin timing stays within 3 to 4 seconds', () => {
  const noWinMs = estimateSpinDurationMs(false, { winSteps: 0, tumbleTransitions: 0 });
  const singleTumbleMs = estimateSpinDurationMs(false, { winSteps: 1, tumbleTransitions: 1 });
  assert.ok(noWinMs >= 3000 && noWinMs <= 4000, `Expected 3000..4000ms, got ${noWinMs}`);
  assert.ok(
    singleTumbleMs >= 3000 && singleTumbleMs <= 4000,
    `Expected 3000..4000ms, got ${singleTumbleMs}`
  );
});

test('Fast mode spin timing stays within 0.5 to 1.5 seconds', () => {
  const noWinMs = estimateSpinDurationMs(true, { winSteps: 0, tumbleTransitions: 0 });
  const singleTumbleMs = estimateSpinDurationMs(true, { winSteps: 1, tumbleTransitions: 1 });
  assert.ok(noWinMs >= 500 && noWinMs <= 1500, `Expected 500..1500ms, got ${noWinMs}`);
  assert.ok(
    singleTumbleMs >= 500 && singleTumbleMs <= 1500,
    `Expected 500..1500ms, got ${singleTumbleMs}`
  );
});

test('Free spin timing stays within 2 to 2.5 seconds regardless of fastMode', () => {
  const noWinNormal = estimateSpinDurationMs(false, {
    winSteps: 0,
    tumbleTransitions: 0,
    isFreeSpin: true,
  });
  const winFastFlag = estimateSpinDurationMs(true, {
    winSteps: 1,
    tumbleTransitions: 0,
    isFreeSpin: true,
  });
  assert.ok(
    noWinNormal >= 2000 && noWinNormal <= 2500,
    `Expected 2000..2500ms, got ${noWinNormal}`
  );
  assert.ok(
    winFastFlag >= 2000 && winFastFlag <= 2500,
    `Expected 2000..2500ms, got ${winFastFlag}`
  );
});

test('accumulateFreeSpinPayouts sums array payouts cleanly', () => {
  const step1 = accumulateFreeSpinPayouts([20]);
  assert.equal(step1.total, 20);
  assert.equal(step1.winningCount, 1);

  const step3 = accumulateFreeSpinPayouts([20, 0, 45.6]);
  assert.equal(step3.total, 65.6);
  assert.equal(step3.winningCount, 2);
  assert.deepEqual(step3.payouts, [20, 0, 45.6]);
});

test('getSpinTimingProfile returns distinct tick speeds for normal vs fast mode', () => {
  const normal = getSpinTimingProfile(false);
  const fast = getSpinTimingProfile(true);
  assert.ok(normal.minSpinMs > fast.minSpinMs);
  assert.ok(normal.colStopIntervalMs > fast.colStopIntervalMs);
});

test('stepAllowedBet steps cleanly across ALLOWED_BETS and respects balance', () => {
  assert.equal(stepAllowedBet(20, 1, 1000), 30);
  assert.equal(stepAllowedBet(20, -1, 1000), 10);
  assert.equal(stepAllowedBet(10, -1, 1000), 10);
  assert.equal(stepAllowedBet(100, 1, 1000), 100);
  assert.equal(stepAllowedBet(40, 1, 45), 40);
  assert.equal(getMaxAffordableBet(1000), 100);
  assert.equal(getMaxAffordableBet(55), 50);
  assert.equal(getMaxAffordableBet(10), 10);
});
