// ============================================================================
// WeKan CPU monitor + governor (Admin Panel → Problems → CPU usage).
// ----------------------------------------------------------------------------
// 1. MONITOR: samples system-wide CPU usage on an interval and records only the
//    START and END of each sustained high-CPU period to the 'cpu' event stream,
//    with what WeKan was doing at the time (so a flood of rows never happens).
// 2. GOVERNOR: exposes isHighCpu() and pauseIfBusy() so long batch operations
//    (attachment migrations, the existing-file extension corrector, …) can slow
//    down and yield the CPU to other software when the machine is already busy.
//
// System-wide CPU% is measured from os.cpus() idle/total deltas, so it includes
// WeKan, FerretDB and every other process — which is exactly the "is the machine
// overloaded" signal we care about. Best-effort and never throws.
// ============================================================================

import { Meteor } from 'meteor/meteor';
import os from 'os';
const { HighCpuTracker } = require('/models/lib/cpuHighTracker');

// Tunables (env-overridable).
const INTERVAL_MS = intEnv('WEKAN_CPU_SAMPLE_INTERVAL_MS', 5000);
const HIGH_PCT = intEnv('WEKAN_CPU_HIGH_PERCENT', 85);
const LOW_PCT = intEnv('WEKAN_CPU_LOW_PERCENT', 70);
const ENTER_SAMPLES = intEnv('WEKAN_CPU_HIGH_SAMPLES', 3);
const EXIT_SAMPLES = intEnv('WEKAN_CPU_LOW_SAMPLES', 3);
const PAUSE_MS = intEnv('WEKAN_CPU_PAUSE_MS', 200);
const ENABLED = String(process.env.WEKAN_CPU_MONITOR || 'true').toLowerCase() !== 'false';

function intEnv(name, fallback) {
  const n = parseInt(process.env[name], 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

const tracker = new HighCpuTracker({
  highPct: HIGH_PCT, lowPct: LOW_PCT, enterSamples: ENTER_SAMPLES, exitSamples: EXIT_SAMPLES,
});

let lastCpu = null;      // { idle, total } snapshot for the next delta
let lastPct = 0;         // most recent system CPU%
let currentActivity = '';// coarse "what WeKan is doing" label set by hot operations

// Aggregate idle/total jiffies across all cores.
function cpuTotals() {
  const cpus = os.cpus() || [];
  let idle = 0;
  let total = 0;
  for (const c of cpus) {
    const t = c.times;
    idle += t.idle;
    total += t.user + t.nice + t.sys + t.idle + t.irq;
  }
  return { idle, total, cores: cpus.length };
}

// System CPU% since the previous sample (0..100). First call returns 0 (no delta).
function sampleCpuPercent() {
  const now = cpuTotals();
  if (!lastCpu) { lastCpu = now; return 0; }
  const idleDelta = now.idle - lastCpu.idle;
  const totalDelta = now.total - lastCpu.total;
  lastCpu = now;
  if (totalDelta <= 0) return lastPct;
  const pct = Math.max(0, Math.min(100, 100 * (1 - idleDelta / totalDelta)));
  return Math.round(pct);
}

// Register what WeKan is currently doing, shown in the high-CPU report row. Call
// setActivity('label') before a heavy operation and setActivity('') after.
export function setActivity(label) {
  currentActivity = String(label || '');
}

// True when the system is currently in a sustained high-CPU period.
export function isHighCpu() {
  return tracker.isHigh();
}

// Await a short pause when the CPU is busy (else resolve immediately), so a long
// loop yields time to other software. Never throws.
export function pauseIfBusy(ms) {
  if (!tracker.isHigh()) return Promise.resolve();
  const delay = Number.isFinite(ms) ? ms : PAUSE_MS;
  return new Promise(resolve => setTimeout(resolve, delay));
}

function activitySnapshot(pct, load, cores) {
  const parts = [
    `system CPU ${pct}%`,
    `load ${load.map(n => n.toFixed(2)).join('/')}`,
    `${cores} cores`,
  ];
  if (currentActivity) parts.push(`WeKan: ${currentActivity}`);
  return parts.join(', ');
}

if (Meteor.isServer && ENABLED) {
  Meteor.startup(() => {
    // Prime the first delta so the first real sample is meaningful.
    lastCpu = cpuTotals();
    const { record } = require('/server/lib/cpuLog');

    Meteor.setInterval(() => {
      try {
        const pct = sampleCpuPercent();
        lastPct = pct;
        const load = os.loadavg();
        const cores = (os.cpus() || []).length;
        const now = Date.now();
        const res = tracker.update(pct, now);
        if (res.event === 'start') {
          record({
            action: 'detected',
            severity: pct >= 95 ? 'high' : 'medium',
            detail: `high CPU usage started (>= ${HIGH_PCT}%): ${activitySnapshot(pct, load, cores)}`,
          });
        } else if (res.event === 'end') {
          const secs = Math.round((res.durationMs || 0) / 1000);
          record({
            action: 'remediated',
            severity: 'info',
            at: new Date(now),
            detail: `high CPU usage ended after ${secs}s (peak ${res.peak}%, back under ${LOW_PCT}%): ` +
              activitySnapshot(pct, load, cores),
          });
        }
      } catch (e) {
        if (process.env.DEBUG === 'true') console.warn('cpuMonitor sample failed:', e && e.message);
      }
    }, INTERVAL_MS);
  });
}

export default { isHighCpu, pauseIfBusy, setActivity };
