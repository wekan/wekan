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
// Best-effort and server-only: any error (plain MongoDB, older FerretDB without
// the command, missing driver) is swallowed and remembered so we stop trying.
// ============================================================================

import { MongoInternals } from 'meteor/mongo';

// null = unknown (try once), true/false = whether FerretDB supports the throttle command.
let supported = null;

function rawDb() {
  try {
    return MongoInternals.defaultRemoteCollectionDriver()?.mongo?.db || null;
  } catch (e) {
    return null;
  }
}

// Ask FerretDB to slow down for durationMs (pausing slowDownMs before each
// command) and report its activity. Returns the response object, or null when the
// database is not a FerretDB that supports the command. Never throws.
async function requestThrottle(slowDownMs, durationMs) {
  if (supported === false) return null;
  const db = rawDb();
  if (!db || typeof db.command !== 'function') return null;
  try {
    const res = await db.command({
      throttle: 1,
      slowDownMs: Math.max(0, Math.round(slowDownMs) || 0),
      durationMs: Math.max(0, Math.round(durationMs) || 0),
    });
    supported = true;
    return res || null;
  } catch (e) {
    // CommandNotFound / not FerretDB / driver gone — remember and stop trying.
    supported = false;
    if (process.env.DEBUG === 'true') {
      console.warn('ferretdbGovernor: throttle command unavailable:', e && e.message);
    }
    return null;
  }
}

// Ask FerretDB to slow down. Returns { throttled, slowDownMs, durationMs,
// commandsProcessed } or null.
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

export default { slowDownFerretDb, resumeFerretDb, ferretDbGovernorSupported };
