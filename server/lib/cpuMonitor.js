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
const FERRET_SLOWDOWN_MS = intEnv('WEKAN_FERRETDB_SLOWDOWN_MS', 5);         // first FerretDB delay
const FERRET_SLOWDOWN_MAX_MS = intEnv('WEKAN_FERRETDB_SLOWDOWN_MAX_MS', 200); // escalation cap
// Recovery target: while the system stays at/above this, keep increasing the
// FerretDB delay; once it drops below, there is enough headroom for other
// processes and we stop escalating. Defaults to the leave-high threshold.
const CPU_TARGET_PCT = intEnv('WEKAN_CPU_TARGET_PERCENT', LOW_PCT);
// Minimum gap between calls to FerretDB, so the CPU-usage log is not flooded and an
// already-busy FerretDB is not hammered. WeKan still samples CPU every INTERVAL_MS
// (a cheap local read); it just talks to FerretDB at most this often. FerretDB
// self-regulates on its own between WeKan's calls.
const FERRET_ASK_MIN_INTERVAL_MS = intEnv('WEKAN_FERRETDB_ASK_INTERVAL_MS', 30000);
// FerretDB process-CPU watch. System-wide CPU% hides a single process pegging a few
// cores on a many-core host: FerretDB at 300% (3 cores) is only 75% system-wide on a
// 4-core box, so it never crosses HIGH_PCT and "Problems / CPU usage" stayed empty
// even though FerretDB was the problem (#6480). When system CPU is in a WATCH band
// (elevated but below HIGH), WeKan asks FerretDB for its own process CPU% (a pure
// status read — slowDownMs 0, so it does NOT slow FerretDB down and cannot make an
// already-slow board load worse) and, if FerretDB alone is pegging cores, records a
// start/end episode attributing the CPU to FerretDB regardless of the host-wide %.
const FERRET_WATCH_PCT = intEnv('WEKAN_FERRETDB_WATCH_PERCENT', 60);
const FERRET_PROC_HIGH_PCT = intEnv('WEKAN_FERRETDB_PROC_HIGH_PERCENT', 150);
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

let ferretGovernActive = false;  // true once FerretDB has been asked to slow down
let ferretSlowdownMs = 0;        // current per-command delay requested of FerretDB
let ferretTargetReached = false; // CPU has dropped below the headroom target once
let ferretCapWarned = false;     // the "max delay not enough" line was written once
let lastFerretAskAt = 0;         // epoch ms of the last call to FerretDB (rate-limit)
let ferretUnavailableLogged = false; // "not responding, backing off" written once
let ferretUnavailableSince = null;   // Date when FerretDB became unresponsive

// FerretDB process-CPU watch bookkeeping (independent of the system-wide high period).
let ferretProcHigh = false;          // FerretDB process CPU is currently over the bar
let ferretProcHighSince = null;      // when it went over
let lastFerretWatchAt = 0;           // epoch ms of the last watch-band status read

// The throttle window we request must outlive the gap between our (rate-limited)
// asks, so the throttle stays in effect between them.
const FERRET_ASK_DURATION_MS = Math.max(INTERVAL_MS * 3, FERRET_ASK_MIN_INTERVAL_MS * 2);

function resetPeriodMitigation() {
  periodPauseCount = 0;
  periodPausedMs = 0;
  periodActivity = currentActivity;
  mitigationLogged = false;
  mitigationStartPct = null;
  minPctAfterMitigation = null;
  ferretGovernActive = false;
  ferretSlowdownMs = 0;
  ferretTargetReached = false;
  ferretCapWarned = false;
  lastFerretAskAt = 0;
  // NOTE: ferretUnavailableLogged / ferretUnavailableSince are intentionally NOT
  // reset here — a FerretDB outage can span multiple high-CPU periods, and we want
  // the recovery row to report the full start→end span.
}

// Format a timestamp for the log (UTC, second precision).
function fmtAt(d) {
  try { return new Date(d).toISOString().replace('T', ' ').slice(0, 19); } catch (e) { return String(d); }
}

// Handle a FerretDB response (or the lack of one). On no answer, log ONCE that we
// are backing off (noting the start time); on the answer after an outage, log the
// full unresponsive span (start → end) plus the current CPU and FerretDB status.
// Returns true if FerretDB answered.
function handleFerretResponse(resp, pct, record) {
  const gov = require('/server/lib/ferretdbGovernor');
  if (!resp) {
    if (gov.ferretDbUnavailable() && !ferretUnavailableLogged) {
      ferretUnavailableLogged = true;
      ferretUnavailableSince = new Date(); // note WHEN the outage started
      record({
        action: 'detected',
        severity: 'medium',
        at: ferretUnavailableSince,
        detail: `FerretDB became unresponsive (CPU ${pct}%) — WeKan is backing off and will re-check ` +
          `when it recovers (FerretDB self-regulates its own CPU in the meantime).`,
      });
    }
    return false;
  }
  if (ferretUnavailableLogged) {
    // Recovered: report the full unresponsive span (start → end) and what FerretDB
    // had been doing while we could not reach it.
    const since = ferretUnavailableSince;
    const secs = since ? Math.round((Date.now() - since.getTime()) / 1000) : 0;
    const span = since ? `unresponsive ${fmtAt(since)} → ${fmtAt(new Date())} (${secs}s)` : 'recovered';
    const summary = resp.operationsSummary ? `; busiest operations: ${resp.operationsSummary}` : '';
    ferretUnavailableLogged = false;
    ferretUnavailableSince = null;
    record({
      action: 'remediated',
      severity: 'info',
      detail: `FerretDB responded again (CPU ${pct}%): ${span}. ${resp.commandsProcessed} commands ` +
        `processed total; FerretDB process CPU ${resp.processCpuPercent || 0}% (100% = one core); ` +
        `self-regulating at ${resp.autoSlowDownMs || 0}ms/op (its own host CPU reading ` +
        `${resp.hostCpuPercent || 0}%)${summary}.`,
    });
  }
  return true;
}

// Ask FerretDB what it is doing and to slow down (the FIRST, smallest delay), and
// log its response on its own 'cpu' row. Fire-and-forget (async, best-effort); does
// nothing on plain MongoDB or an older FerretDB without the throttle command.
function governFerretStart(pct) {
  try {
    const { slowDownFerretDb } = require('/server/lib/ferretdbGovernor');
    const { record } = require('/server/lib/cpuLog');
    ferretSlowdownMs = FERRET_SLOWDOWN_MS;
    lastFerretAskAt = Date.now();
    Promise.resolve(slowDownFerretDb(ferretSlowdownMs, FERRET_ASK_DURATION_MS)).then(resp => {
      if (!handleFerretResponse(resp, pct, record)) return;
      ferretGovernActive = true;
      record({
        action: 'rate-limited',
        severity: 'info',
        detail: `high CPU (${pct}%): asked FerretDB to slow down (${resp.slowDownMs}ms before each command ` +
          `to yield CPU). FerretDB activity: ${resp.commandsProcessed} commands processed (higher = busier); ` +
          `FerretDB process CPU ${resp.processCpuPercent || 0}% (100% = one core); self-regulating at ` +
          `${resp.autoSlowDownMs || 0}ms/op (its own host CPU reading ${resp.hostCpuPercent || 0}%).`,
      });
    }).catch(() => {});
  } catch (e) { /* best effort */ }
}

// Adaptive feedback, RATE-LIMITED so the log is not flooded and a busy FerretDB is
// not hammered: at most once per FERRET_ASK_MIN_INTERVAL_MS (and never while backing
// off), increase the delay FerretDB adds between operations until the system CPU
// drops below the headroom target, then hold. If even the maximum delay does not
// free enough CPU, that is logged too (FerretDB was not the cause).
function governFerretAdjust(pct) {
  if (!ferretGovernActive) return;
  try {
    const gov = require('/server/lib/ferretdbGovernor');
    const { record } = require('/server/lib/cpuLog');

    if (gov.ferretDbInCooldown()) return;                          // backing off — do not ask
    if (Date.now() - lastFerretAskAt < FERRET_ASK_MIN_INTERVAL_MS) return; // not too often
    lastFerretAskAt = Date.now();

    // Decide the next requested delay (escalate / warn-at-cap / headroom-reached).
    let logEvent = null;
    if (pct >= CPU_TARGET_PCT) {
      const next = Math.min(FERRET_SLOWDOWN_MAX_MS, Math.max(1, ferretSlowdownMs) * 2);
      if (next > ferretSlowdownMs) {
        const prev = ferretSlowdownMs;
        ferretSlowdownMs = next;
        logEvent = { action: 'rate-limited', severity: 'info',
          detail: `CPU still ${pct}% (target < ${CPU_TARGET_PCT}%): increased FerretDB slow-down ` +
            `${prev}ms → ${ferretSlowdownMs}ms between operations to free more CPU for other processes.` };
      } else if (!ferretCapWarned) {
        ferretCapWarned = true;
        logEvent = { action: 'detected', severity: 'medium',
          detail: `CPU still ${pct}% at FerretDB's maximum slow-down (${ferretSlowdownMs}ms/op): ` +
            `slowing FerretDB did not free enough CPU — the load is (partly) elsewhere.` };
      }
    } else if (!ferretTargetReached) {
      ferretTargetReached = true;
      logEvent = { action: 'remediated', severity: 'info',
        detail: `CPU dropped to ${pct}% (< target ${CPU_TARGET_PCT}%) after slowing FerretDB to ` +
          `${ferretSlowdownMs}ms/op — enough CPU is now free for other processes.` };
    }

    Promise.resolve(gov.slowDownFerretDb(ferretSlowdownMs, FERRET_ASK_DURATION_MS)).then(resp => {
      if (!handleFerretResponse(resp, pct, record)) return;
      if (logEvent) record(logEvent);
    }).catch(() => {});
  } catch (e) { /* best effort */ }
}

// Ask FerretDB to resume full speed when the high-CPU period ends.
function governFerretEnd() {
  if (!ferretGovernActive) return;
  ferretGovernActive = false;
  ferretSlowdownMs = 0;
  try {
    const { resumeFerretDb } = require('/server/lib/ferretdbGovernor');
    Promise.resolve(resumeFerretDb()).catch(() => {});
  } catch (e) { /* best effort */ }
}

// Watch for FerretDB monopolising a few cores while the host-wide % stays under the
// HIGH threshold (the many-core blind spot behind "Problems shows nothing"). Runs only
// OUTSIDE a system-wide high period, rate-limited, as a PURE STATUS read (slowDownMs 0
// — it never throttles FerretDB, so it cannot make an already-slow board load worse).
// Opens a start episode when FerretDB's own process CPU crosses the bar and closes it
// on recovery. Best-effort; no-op on plain MongoDB / older FerretDB.
function governFerretProcWatch(pct, load, cores) {
  try {
    if (Date.now() - lastFerretWatchAt < FERRET_ASK_MIN_INTERVAL_MS) return;
    lastFerretWatchAt = Date.now();
    const gov = require('/server/lib/ferretdbGovernor');
    const { record } = require('/server/lib/cpuLog');
    if (typeof gov.ferretDbInCooldown === 'function' && gov.ferretDbInCooldown()) return;

    // Pure status read: slowDownMs 0 / durationMs 0 => FerretDB is NOT slowed down.
    Promise.resolve(gov.slowDownFerretDb(0, 0)).then(resp => {
      if (!resp) return;
      const proc = Number(resp.processCpuPercent) || 0;
      if (proc >= FERRET_PROC_HIGH_PCT) {
        if (!ferretProcHigh) {
          ferretProcHigh = true;
          ferretProcHighSince = new Date();
          const summary = resp.operationsSummary ? `; busiest operations: ${resp.operationsSummary}` : '';
          record({
            action: 'detected',
            severity: proc >= cores * 90 ? 'high' : 'medium',
            at: ferretProcHighSince,
            detail: `FerretDB is using ${proc}% CPU (100% = one core; this host has ${cores} cores) while ` +
              `host-wide CPU is only ${pct}% — FerretDB alone is monopolising the machine, which the ` +
              `host-wide percentage hides. ${resp.commandsProcessed} commands processed total` + summary +
              `. FerretDB self-regulates at ${resp.autoSlowDownMs || 0}ms/op.`,
          });
        }
      } else if (ferretProcHigh) {
        ferretProcHigh = false;
        const since = ferretProcHighSince;
        const secs = since ? Math.round((Date.now() - since.getTime()) / 1000) : 0;
        const span = since ? ` (${fmtAt(since)} → ${fmtAt(new Date())}, ${secs}s)` : '';
        ferretProcHighSince = null;
        record({
          action: 'remediated',
          severity: 'info',
          detail: `FerretDB process CPU back to ${proc}% (host-wide ${pct}%)${span}.`,
        });
      }
    }).catch(() => {});
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
          // Adaptive: increase FerretDB's per-operation delay until CPU drops below
          // the headroom target, then hold; also renews the self-expiring throttle.
          governFerretAdjust(pct);
        } else if (pct >= FERRET_WATCH_PCT || ferretProcHigh) {
          // Not a system-wide high period, but the host is busy enough that FerretDB
          // might be monopolising a few cores (invisible in the host-wide %). Check its
          // own process CPU — and keep checking while an episode is open so it is closed
          // when FerretDB calms down.
          governFerretProcWatch(pct, load, cores);
        }
      } catch (e) {
        if (process.env.DEBUG === 'true') console.warn('cpuMonitor sample failed:', e && e.message);
      }
    }, INTERVAL_MS);
  });
}

export default { isHighCpu, pauseIfBusy, setActivity };
