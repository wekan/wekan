'use strict';

// models/lib/ramHighTracker.js - the pure half of the RAM-usage monitor
// (docs/Features/Admin-Panel/Problems/RAM-usage.md): /proc/meminfo parsing, the
// used percentages, and the start/end episode tracker.
//
// Run: node tests/ramHighTracker.test.cjs

const assert = require('assert');
const { parseMeminfo, memoryUsage, HighRamTracker } = require('../models/lib/ramHighTracker.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const GiB = 1024 ** 3;
const MEMINFO = [
  'MemTotal:        8388608 kB',
  'MemFree:          524288 kB',
  'MemAvailable:    3145728 kB',
  'SwapTotal:       2097152 kB',
  'SwapFree:        1572864 kB',
  'HugePages_Total:       0',
].join('\n');

console.log('ramHighTracker:');

test('meminfo is read in bytes, including a line without a unit', () => {
  const m = parseMeminfo(MEMINFO);
  assert.strictEqual(m.MemTotal, 8 * GiB);
  assert.strictEqual(m.MemAvailable, 3 * GiB);
  assert.strictEqual(m.HugePages_Total, 0);
  assert.deepStrictEqual(parseMeminfo(''), {});
  assert.deepStrictEqual(parseMeminfo(undefined), {});
});

test('RAM counts the reclaimable cache as available, not just MemFree', () => {
  const u = memoryUsage({ totalmem: 8 * GiB, freemem: 0.5 * GiB, meminfo: parseMeminfo(MEMINFO) });
  assert.strictEqual(u.ramPct, 63, '(8 - 3) / 8, not (8 - 0.5) / 8');
  assert.strictEqual(u.swapPct, 25);
  assert.strictEqual(u.swapUsed, 0.5 * GiB);
});

test('without /proc/meminfo, Node\'s numbers, and no swap (negative)', () => {
  const u = memoryUsage({ totalmem: 4 * GiB, freemem: GiB, meminfo: {} });
  assert.strictEqual(u.ramPct, 75);
  assert.strictEqual(u.swapPct, null);
  const noSwap = memoryUsage({ totalmem: 4 * GiB, freemem: GiB,
    meminfo: { MemTotal: 4 * GiB, MemAvailable: GiB, SwapTotal: 0, SwapFree: 0 } });
  assert.strictEqual(noSwap.swapPct, null, 'zero swap is "no swap", not 0% or NaN');
  assert.strictEqual(memoryUsage({ totalmem: 0, freemem: 0 }).ramPct, null, 'a zero total gives no percentage');
});

test('a high period starts after N samples of high RAM, and ends after N calm ones', () => {
  const t = new HighRamTracker({ highPct: 90, lowPct: 80, swapHighPct: 25, enterSamples: 3, exitSamples: 2 });
  assert.strictEqual(t.update({ ramPct: 95, swapPct: null }, 1).event, null);
  assert.strictEqual(t.update({ ramPct: 95, swapPct: null }, 2).event, null);
  const start = t.update({ ramPct: 92, swapPct: null }, 3);
  assert.deepStrictEqual(start, { event: 'start', at: 3, ramPct: 92, swapPct: null });
  t.update({ ramPct: 97, swapPct: 10 }, 4);
  assert.strictEqual(t.update({ ramPct: 70, swapPct: 0 }, 5).event, null);
  const end = t.update({ ramPct: 70, swapPct: 0 }, 6);
  assert.deepStrictEqual(end, { event: 'end', at: 6, startedAt: 3, durationMs: 3, peakRam: 97, peakSwap: 10 });
  assert.strictEqual(t.isHigh(), false);
});

// 2026-11-19: this used to be "swap use alone starts a period". A developer
// laptop with many programs open - RAM 52%, swap 60% - was reported as "high
// RAM usage started (>= 90%)" with high severity, as RamBleed. Idle pages in
// swap while RAM is free are not pressure; swap counts when RAM is tight too.
test('negative: swap use alone, with RAM free, is not memory pressure', () => {
  const t = new HighRamTracker({ enterSamples: 1, exitSamples: 1 });
  for (const [i, sample] of [{ ramPct: 52, swapPct: 60 }, { ramPct: 79, swapPct: 100 }, { ramPct: 50, swapPct: 30 }].entries()) {
    assert.strictEqual(t.update(sample, i).event, null, JSON.stringify(sample));
  }
  assert.strictEqual(t.isHigh(), false);
});

test('swap while RAM is tight starts a period, and it ends when RAM is back', () => {
  const t = new HighRamTracker({ highPct: 90, lowPct: 80, swapHighPct: 25, enterSamples: 1, exitSamples: 1 });
  assert.strictEqual(t.update({ ramPct: 85, swapPct: 30 }, 1).event, 'start');
  assert.strictEqual(t.update({ ramPct: 85, swapPct: 30 }, 2).event, null, 'still tight: not over');
  // RAM back under the low mark ends it, even with pages still in swap.
  assert.strictEqual(t.update({ ramPct: 60, swapPct: 30 }, 3).event, 'end');
});

test('the monitor says what started a period, and only RAM near full is high severity', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'server/lib/ramMonitor.js'), 'utf8');
  assert.match(src, /`RAM >= \$\{HIGH_PCT\}%`/);
  assert.match(src, /`swap >= \$\{SWAP_HIGH_PCT\}% with RAM >= \$\{LOW_PCT\}%`/);
  assert.match(src, /severity: sample\.ramPct >= 95 \? 'high' : 'medium',/);
  assert.doesNotMatch(src, /\(>= \$\{HIGH_PCT\}%\): \$\{describe/, 'no fixed ">= 90%" for a swap start');
});

test('a value hovering between low and high does not flap (negative)', () => {
  const t = new HighRamTracker({ highPct: 90, lowPct: 80, enterSamples: 2, exitSamples: 2 });
  const events = [];
  for (const [i, v] of [91, 89, 91, 89, 91, 91, 85, 89, 85, 79, 79].entries()) {
    const r = t.update({ ramPct: v, swapPct: null }, i);
    if (r.event) events.push(r.event);
  }
  assert.deepStrictEqual(events, ['start', 'end'], 'one period, not several');
});

console.log(`\nramHighTracker: ${passed} tests passed`);
