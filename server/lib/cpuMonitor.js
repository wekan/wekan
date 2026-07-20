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
const FERRET_SLOWDOWN_MS = intEnv('WEKAN_FERRETDB_SLOWDOWN_MS', 5);
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

// Per-high-period mitigation bookkeeping (reset on each 'start'). Tracks whether
// the governor actually slowed anything down, and whether that visibly lowered CPU.
let periodPauseCount = 0;        // how many times pauseIfBusy() paused this period
let periodPausedMs = 0;          // total governor pause time this period
let periodActivity = '';         // what WeKan was doing when the period started
let mitigationLogged = false;    // the "mitigation taken" row was written once
let mitigationStartPct = null;   // CPU% at the moment slowing-down began
let minPctAfterMitigation = null;// lowest CPU% seen after slowing-down began

let ferretGovernActive = false; // true once FerretDB has been asked to slow down

function resetPeriodMitigation() {
  periodPauseCount = 0;
  periodPausedMs = 0;
  periodActivity = currentActivity;
  mitigationLogged = false;
  mitigationStartPct = null;
  minPctAfterMitigation = null;
  ferretGovernActive = false;
}

// Ask FerretDB what it is doing and to slow down, and log its response on its own
// 'cpu' row. Fire-and-forget (async, best-effort); does nothing on plain MongoDB or
// an older FerretDB without the throttle command.
function governFerretStart(pct) {
  try {
    const { slowDownFerretDb } = require('/server/lib/ferretdbGovernor');
    const { record } = require('/server/lib/cpuLog');
    Promise.resolve(slowDownFerretDb(FERRET_SLOWDOWN_MS, INTERVAL_MS * 3)).then(resp => {
      if (!resp) return; // not a FerretDB with governor support
      ferretGovernActive = true;
      record({
        action: 'rate-limited',
        severity: 'info',
        detail: `high CPU (${pct}%): asked FerretDB to slow down (${resp.slowDownMs}ms before each command ` +
          `for ${Math.round((resp.durationMs || 0) / 1000)}s to yield CPU). FerretDB activity: ` +
          `${resp.commandsProcessed} commands processed so far (higher = busier). FerretDB throttled: ${resp.throttled}.`,
      });
    }).catch(() => {});
  } catch (e) { /* best effort */ }
}

// Keep FerretDB's self-expiring throttle alive while CPU stays high (silent).
function governFerretRenew() {
  if (!ferretGovernActive) return;
  try {
    const { slowDownFerretDb } = require('/server/lib/ferretdbGovernor');
    Promise.resolve(slowDownFerretDb(FERRET_SLOWDOWN_MS, INTERVAL_MS * 3)).catch(() => {});
  } catch (e) { /* best effort */ }
}

// Ask FerretDB to resume full speed when the high-CPU period ends.
function governFerretEnd() {
  if (!ferretGovernActive) return;
  ferretGovernActive = false;
  try {
    const { resumeFerretDb } = require('/server/lib/ferretdbGovernor');
    Promise.resolve(resumeFerretDb()).catch(() => {});
  } catch (e) { /* best effort */ }
}

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
  // Count the mitigation so the report can say what was done and whether it helped.
  periodPauseCount += 1;
  periodPausedMs += delay;
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

// Describe, for the 'end' row, what automatic mitigation was applied during the
// high-CPU period and whether it visibly helped (did CPU drop after slowing down).
function mitigationSummary() {
  if (!mitigationLogged) {
    return 'automatic mitigation: none applied (no governed WeKan operation was running to slow down)';
  }
  const start = mitigationStartPct == null ? 0 : mitigationStartPct;
  const low = minPctAfterMitigation == null ? start : minPctAfterMitigation;
  const dropped = Math.max(0, start - low);
  const helped = dropped >= 10; // a ≥10-point drop is treated as a noticeable effect
  const secs = Math.round(periodPausedMs / 1000);
  return `automatic mitigation: slowed down "${periodActivity || 'WeKan operations'}" ` +
    `(paused ${periodPauseCount} times, ${secs}s total). After slowing down, CPU went ${start}% → ${low}% — ` +
    (helped ? `noticeably lower (about -${dropped} points)` : 'not noticeably lower');
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
          resetPeriodMitigation();
          record({
            action: 'detected',
            severity: pct >= 95 ? 'high' : 'medium',
            detail: `high CPU usage started (>= ${HIGH_PCT}%): ${activitySnapshot(pct, load, cores)}`,
          });
          // Ask FerretDB (the other big CPU user on this host) what it is doing and
          // to slow down; the response is logged on its own row.
          governFerretStart(pct);
        } else if (res.event === 'end') {
          const secs = Math.round((res.durationMs || 0) / 1000);
          const askedFerret = ferretGovernActive;
          governFerretEnd(); // ask FerretDB to resume full speed
          record({
            action: 'remediated',
            severity: 'info',
            at: new Date(now),
            detail: `high CPU usage ended after ${secs}s (peak ${res.peak}%, back under ${LOW_PCT}%): ` +
              activitySnapshot(pct, load, cores) + ' | ' + mitigationSummary() +
              (askedFerret ? ' | asked FerretDB to resume normal speed' : ''),
          });
        }

        // While high: once the governor has actually slowed something down, write a
        // single "automatic mitigation taken" row, then track whether CPU drops.
        if (tracker.isHigh()) {
          if (!mitigationLogged && periodPauseCount > 0) {
            mitigationLogged = true;
            mitigationStartPct = pct;
            minPctAfterMitigation = pct;
            const what = periodActivity || currentActivity || 'WeKan operations';
            record({
              action: 'rate-limited',
              severity: 'info',
              detail: `automatic mitigation: slowing down "${what}" — pausing ${PAUSE_MS}ms between steps to ` +
                `yield the CPU (this also lowers FerretDB query load). CPU at slow-down start: ${pct}%.`,
            });
          } else if (mitigationLogged && pct < minPctAfterMitigation) {
            minPctAfterMitigation = pct;
          }
          // Keep FerretDB's self-expiring throttle alive for the whole high period.
          governFerretRenew();
        }
      } catch (e) {
        if (process.env.DEBUG === 'true') console.warn('cpuMonitor sample failed:', e && e.message);
      }
    }, INTERVAL_MS);
  });
}

export default { isHighCpu, pauseIfBusy, setActivity };
