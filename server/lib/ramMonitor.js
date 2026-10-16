// ============================================================================
// WeKan RAM-usage monitor (Admin Panel → Problems → RAM usage).
// docs/Features/Admin-Panel/Problems/RAM-usage.md
// ----------------------------------------------------------------------------
// Samples system-wide memory and swap on an interval and records only the
// START and END of each sustained high-usage period to the 'ram' event stream,
// with WeKan's own memory and what it was doing. Observe-and-report only:
// nothing is slowed down or freed. Best-effort and never throws; without
// /proc/meminfo (not Linux) it uses what Node reports and has no swap.
// ============================================================================

import { Meteor } from 'meteor/meteor';
import os from 'os';
import fs from 'fs';
const { intEnv } = require('/models/lib/intEnv');
const { parseMeminfo, memoryUsage, HighRamTracker } = require('/models/lib/ramHighTracker');

const ENABLED = String(process.env.WEKAN_RAM_MONITOR || 'true').toLowerCase() !== 'false';
const INTERVAL_MS = Math.max(1000, intEnv('WEKAN_RAM_SAMPLE_INTERVAL_MS', 5000));
const HIGH_PCT = intEnv('WEKAN_RAM_HIGH_PERCENT', 90);
const LOW_PCT = intEnv('WEKAN_RAM_LOW_PERCENT', 80);
const SWAP_HIGH_PCT = intEnv('WEKAN_SWAP_HIGH_PERCENT', 25);
const ENTER_SAMPLES = Math.max(1, intEnv('WEKAN_RAM_HIGH_SAMPLES', 3));
const EXIT_SAMPLES = Math.max(1, intEnv('WEKAN_RAM_LOW_SAMPLES', 3));

const tracker = new HighRamTracker({
  highPct: HIGH_PCT, lowPct: LOW_PCT, swapHighPct: SWAP_HIGH_PCT,
  enterSamples: ENTER_SAMPLES, exitSamples: EXIT_SAMPLES,
});

let last = null;

function readMeminfo() {
  try {
    return parseMeminfo(fs.readFileSync('/proc/meminfo', 'utf8'));
  } catch (e) {
    return {};
  }
}

export function sampleMemory() {
  return memoryUsage({ totalmem: os.totalmem(), freemem: os.freemem(), meminfo: readMeminfo() });
}

const gb = bytes => (bytes / (1024 ** 3)).toFixed(1);

function describe(sample) {
  const parts = [`RAM ${gb(sample.ramUsed)}/${gb(sample.ramTotal)} GB (${sample.ramPct}%)`];
  parts.push(sample.swapPct == null
    ? 'no swap'
    : `swap ${gb(sample.swapUsed)}/${gb(sample.swapTotal)} GB (${sample.swapPct}%)`);
  parts.push(`WeKan RSS ${gb(process.memoryUsage().rss)} GB`);
  try {
    const { currentActivityLabel } = require('/server/lib/cpuMonitor');
    const activity = currentActivityLabel();
    if (activity) parts.push(`WeKan: ${activity}`);
  } catch (e) { /* the CPU monitor is optional */ }
  return parts.join(', ');
}

// For Admin Panel → Problems → RAM usage: the latest sample, and whether a
// high period is open. Reads module state; with the monitor off it samples now.
export function getCurrentMemory() {
  const sample = ENABLED && last ? last : sampleMemory();
  return { ...sample, high: tracker.isHigh(), highPercent: HIGH_PCT, swapHighPercent: SWAP_HIGH_PCT, monitored: ENABLED };
}

if (Meteor.isServer && ENABLED) {
  Meteor.startup(() => {
    const { record } = require('/server/lib/ramLog');
    Meteor.setInterval(() => {
      try {
        const sample = sampleMemory();
        if (sample.ramPct == null) return;
        last = sample;
        const now = Date.now();
        const res = tracker.update(sample, now);
        if (res.event === 'start') {
          record({
            action: 'detected',
            severity: sample.ramPct >= 95 || (sample.swapPct != null && sample.swapPct >= SWAP_HIGH_PCT) ? 'high' : 'medium',
            detail: `high RAM usage started (>= ${HIGH_PCT}%): ${describe(sample)}`,
          });
        } else if (res.event === 'end') {
          const secs = Math.round((res.durationMs || 0) / 1000);
          const peakSwap = res.peakSwap == null ? '' : `, peak swap ${res.peakSwap}%`;
          record({
            action: 'remediated',
            severity: 'info',
            at: new Date(now),
            detail: `high RAM usage ended after ${secs}s (peak RAM ${res.peakRam}%${peakSwap}, back under ${LOW_PCT}%): ${describe(sample)}`,
          });
        }
      } catch (e) {
        if (process.env.DEBUG === 'true') console.warn('ramMonitor sample failed:', e && e.message);
      }
    }, INTERVAL_MS);
  });
}

export default { getCurrentMemory, sampleMemory };
