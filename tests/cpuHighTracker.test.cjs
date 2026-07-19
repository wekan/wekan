'use strict';

// High-CPU episode tracker (models/lib/cpuHighTracker.js): turns a stream of CPU%
// samples into ONLY start/end events for sustained high-CPU periods, with
// hysteresis so it never floods the Admin Panel → Problems → CPU usage report.
//
// Run: node tests/cpuHighTracker.test.cjs

const assert = require('assert');
const { HighCpuTracker } = require('../models/lib/cpuHighTracker.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cpuHighTracker:');

check('emits START only after enterSamples consecutive high samples', () => {
  const t = new HighCpuTracker({ highPct: 85, lowPct: 70, enterSamples: 3, exitSamples: 3 });
  assert.strictEqual(t.update(90, 1).event, null);
  assert.strictEqual(t.update(90, 2).event, null);
  const r = t.update(90, 3);
  assert.strictEqual(r.event, 'start');
  assert.strictEqual(r.pct, 90);
  assert.strictEqual(t.isHigh(), true);
});

check('a dip below high resets the enter counter (no premature start)', () => {
  const t = new HighCpuTracker({ enterSamples: 3 });
  t.update(90, 1); t.update(90, 2);
  assert.strictEqual(t.update(50, 3).event, null); // reset
  assert.strictEqual(t.update(90, 4).event, null);
  assert.strictEqual(t.update(90, 5).event, null);
  assert.strictEqual(t.update(90, 6).event, 'start');
});

check('emits END only after exitSamples below lowPct, with duration + peak', () => {
  const t = new HighCpuTracker({ highPct: 85, lowPct: 70, enterSamples: 1, exitSamples: 3 });
  assert.strictEqual(t.update(90, 100).event, 'start');
  assert.strictEqual(t.update(95, 101).event, null); // peak rises
  assert.strictEqual(t.update(60, 102).event, null);
  assert.strictEqual(t.update(60, 103).event, null);
  const end = t.update(60, 104);
  assert.strictEqual(end.event, 'end');
  assert.strictEqual(end.startedAt, 100);
  assert.strictEqual(end.durationMs, 4);
  assert.strictEqual(end.peak, 95);
  assert.strictEqual(t.isHigh(), false);
});

check('NEGATIVE: hovering around the threshold never flaps (hysteresis)', () => {
  const t = new HighCpuTracker({ highPct: 85, lowPct: 70, enterSamples: 3, exitSamples: 3 });
  const events = [];
  [85, 60, 85, 60, 85, 60, 85, 60].forEach((pct, i) => {
    const r = t.update(pct, i);
    if (r.event) events.push(r.event);
  });
  assert.deepStrictEqual(events, []);
});

check('a value between low and high keeps the high state (no end below high but above low)', () => {
  const t = new HighCpuTracker({ highPct: 85, lowPct: 70, enterSamples: 1, exitSamples: 2 });
  assert.strictEqual(t.update(90, 1).event, 'start');
  assert.strictEqual(t.update(75, 2).event, null); // below high, above low -> stays high
  assert.strictEqual(t.update(75, 3).event, null);
  assert.strictEqual(t.isHigh(), true);
  assert.strictEqual(t.update(60, 4).event, null);
  assert.strictEqual(t.update(60, 5).event, 'end');
});

console.log(`\ncpuHighTracker: ${passed} checks passed`);
