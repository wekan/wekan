// ============================================================================
// WeKan → FerretDB CPU governor bridge.
// ----------------------------------------------------------------------------
// When WeKan detects that the host CPU is high (WeKan and FerretDB share the
// machine), it asks FerretDB — via the general `throttle` command added to the
// bundled FerretDB v1 fork — (1) what it is doing (a running command count = how
// busy it is) and (2) to slow down for a while (pause a few ms before each
// command, lowering FerretDB's CPU use). The throttle self-expires on the FerretDB
// side, so a WeKan crash can never leave FerretDB permanently slow.
//
// Robustness:
//   - every call has a short TIMEOUT, so a busy/unresponsive FerretDB never blocks
//     WeKan's monitor;
//   - a failed/timed-out call starts a COOLDOWN during which WeKan does NOT ask
//     again, letting FerretDB recover instead of being hammered;
//   - "command not found" (plain MongoDB / older FerretDB) is remembered as
//     permanently unsupported so we stop trying entirely.
//
// Best-effort and server-only: never throws.
// ============================================================================

import { MongoInternals } from 'meteor/mongo';

const COMMAND_TIMEOUT_MS = intEnv('WEKAN_FERRETDB_TIMEOUT_MS', 2000);   // per-call timeout
const COOLDOWN_MS = intEnv('WEKAN_FERRETDB_COOLDOWN_MS', 60000);        // back-off after a failure

function intEnv(name, fallback) {
  const n = parseInt(process.env[name], 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// null = unknown (try once); true = supported; false = permanently unsupported
// (plain MongoDB / no such command).
let supported = null;
let cooldownUntil = 0; // epoch ms; while now < this, do not ask (let FerretDB recover)
let unavailable = false; // last attempt failed/timed out (drives recovery logging)

function rawDb() {
  try {
    return MongoInternals.defaultRemoteCollectionDriver()?.mongo?.db || null;
  } catch (e) {
    return null;
  }
}

// Resolve to the command result, or a marker object on timeout/error, never rejecting.
function withTimeout(promise, ms) {
  return new Promise(resolve => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) { done = true; resolve({ __timeout: true }); }
    }, ms);
    Promise.resolve(promise).then(
      v => { if (!done) { done = true; clearTimeout(timer); resolve(v); } },
      e => { if (!done) { done = true; clearTimeout(timer); resolve({ __error: e }); } },
    );
  });
}

function looksLikeNoSuchCommand(err) {
  const m = (err && (err.codeName || err.message)) || '';
  return /CommandNotFound|no such command|unknown command|not.*recognized/i.test(String(m));
}

// Ask FerretDB to slow down for durationMs (pausing slowDownMs before each command)
// and report its activity. Returns the response object, or null when we did not get
// an answer (unsupported, in cooldown, timed out, or errored). Never throws.
async function requestThrottle(slowDownMs, durationMs) {
  if (supported === false) return null;
  if (Date.now() < cooldownUntil) return null; // backing off — let FerretDB recover

  const db = rawDb();
  if (!db || typeof db.command !== 'function') return null;

  const res = await withTimeout(db.command({
    throttle: 1,
    slowDownMs: Math.max(0, Math.round(slowDownMs) || 0),
    durationMs: Math.max(0, Math.round(durationMs) || 0),
    // Server-side cap too, in case the driver honours it.
    maxTimeMS: COMMAND_TIMEOUT_MS,
  }), COMMAND_TIMEOUT_MS);

  if (res && res.__timeout) {
    // FerretDB did not answer in time (likely too busy). Back off; do not hammer it.
    cooldownUntil = Date.now() + COOLDOWN_MS;
    unavailable = true;
    return null;
  }

  if (res && res.__error) {
    if (looksLikeNoSuchCommand(res.__error)) {
      supported = false; // plain MongoDB / older FerretDB — stop trying forever
      return null;
    }
    // Transient error (network/driver) — back off and retry after the cooldown.
    cooldownUntil = Date.now() + COOLDOWN_MS;
    unavailable = true;
    if (process.env.DEBUG === 'true') {
      console.warn('ferretdbGovernor: throttle error, backing off:', res.__error && res.__error.message);
    }
    return null;
  }

  supported = true;
  unavailable = false;
  return res || null;
}

// Ask FerretDB to slow down. Returns the response or null (see requestThrottle).
export function slowDownFerretDb(slowDownMs, durationMs) {
  return requestThrottle(slowDownMs, durationMs);
}

// Ask FerretDB to resume full speed immediately (throttle off). Returns response or null.
export function resumeFerretDb() {
  return requestThrottle(0, 0);
}

// Whether FerretDB is known to support the governor (null until first attempt).
export function ferretDbGovernorSupported() {
  return supported;
}

// True while WeKan is backing off from an unresponsive FerretDB (in cooldown).
export function ferretDbInCooldown() {
  return Date.now() < cooldownUntil;
}

// True if the last attempt failed/timed out (cleared once FerretDB answers again).
export function ferretDbUnavailable() {
  return unavailable;
}

export default {
  slowDownFerretDb, resumeFerretDb, ferretDbGovernorSupported, ferretDbInCooldown, ferretDbUnavailable,
};
