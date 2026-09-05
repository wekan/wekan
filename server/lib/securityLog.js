// ============================================================================
// WeKan security event logger  (design: docs/Security/Remediation/WeKan.md)
// ----------------------------------------------------------------------------
// Single choke point every runtime security guard funnels through when it
// BLOCKS, SANITIZES or REMEDIATES a request (SSRF rejection, XSS scheme drop,
// forged-XFF ignore, export-authz denial, invite rate-limit, attachment/avatar
// upload rejection or sanitization, …).
//
// Records one document into the EXISTING WeKan database via a normal Meteor
// JavaScript query (models/eventLog.js, stream:'security'). No new files/DBs, so
// it works the same on FerretDB and MongoDB. BEST-EFFORT and NEVER throws into the
// caller: the insert is fire-and-forget and any error is swallowed. Server-only.
// ============================================================================

import EventLog from '/models/eventLog';
const { categoryFor } = require('/models/lib/securityCategories');
const { sanitizeDetail } = require('/models/lib/securityLogFormat');
import { foldEventFireAndForget } from '/server/lib/eventLogFold';
import { blockAccountForSecurityEvent } from '/server/lib/blockOnSecurityEvent';
import { currentReportRequest } from '/server/lib/requestReportContext';
const { resolveClientKey } = require('/server/lib/loginAttemptThrottle');
const { locationFromHeaders } = require('/models/lib/geoHeaders');

// ONE ROW PER PROBLEM, not per event (models/lib/eventLogSummary.js).
//
// A guard on a path an attacker controls fires as fast as they can send, so a
// row per event grows the database with the attack and buries the one line that
// mattered under ten thousand identical ones. The row carries `count` and the
// window `firstAt` … `at` instead, and the actor fields describe the most recent
// occurrence.
//
// Still fire-and-forget and still never throws into the caller: recording that a
// guard fired must never be able to stop it firing.
// ONE ROW PER PROBLEM, not per event: server/lib/eventLogFold.js does the
// folding, shared with the speed and test loggers. A guard on a path an attacker
// controls fires as fast as they can send, so a row per event grows the database
// with the attack and buries the one line that mattered under ten thousand
// identical ones. The row carries `count`, the window `firstAt` … `at`, and a
// per-actor tally read out as `username1 25, 100.100.100.100 30`.
function insert(doc) {
  foldEventFireAndForget(doc, 'securityLog');
  // A logged-in account that attempted a vulnerability loses that account - see
  // server/lib/blockOnSecurityEvent.js for why the ACCOUNT and never the
  // address. Fire-and-forget like the fold: the guard already refused the
  // operation, and the consequence must not be able to break the refusal.
  try {
    const p = blockAccountForSecurityEvent(doc);
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch (e) { /* blocking must never break the guard */ }
}

// Record one security event. Never throws. Pass a catalog `key` (see
// models/lib/securityCategories) and/or explicit fields; explicit wins.
export function record(evt = {}) {
  try {
    const base = evt.key ? categoryFor(evt.key) : {};
    const m = { ...base, ...evt };
    const req = m.req || m.request || currentReportRequest();
    if (req) {
      if (!m.userId && req.userId) m.userId = req.userId;
      if (!m.ip) {
        m.ip = resolveClientKey({
          headers: req.headers,
          socketAddress: (req.socket && req.socket.remoteAddress)
            || (req.connection && req.connection.remoteAddress),
          forwardedCount: process.env.HTTP_FORWARDED_COUNT,
        });
      }
      if (!m.location) m.location = locationFromHeaders(req.headers);
    }
    if ((!m.userId || !m.ip) && typeof DDP !== 'undefined'
      && DDP._CurrentMethodInvocation) {
      const invocation = DDP._CurrentMethodInvocation.get();
      if (invocation) {
        if (!m.userId && invocation.userId) m.userId = invocation.userId;
        if (!m.ip && invocation.connection) {
          m.ip = invocation.connection.clientAddress;
        }
      }
    }
    const doc = {
      stream: 'security',
      at: new Date(),
      severity: m.severity || 'info',
      category: m.category || 'unknown',
      bleed: m.bleed || 'Generic',
      action: m.action || 'detected',
      source: m.source || '',
      cwe: m.cwe || '',
      detail: sanitizeDetail(m.detail),
    };
    if (m.userId || m.userid) doc.userId = String(m.userId || m.userid);
    // WHO and FROM WHERE (docs/Security/Remediation/WeKan.md §12). Both are
    // optional: a guard that fires on an unauthenticated request has no
    // username, and one that fires outside a request context has no address.
    // Truncated here as well as sanitized, because both are attacker-influenced
    // strings - a username can be chosen at registration and an XFF header is
    // whatever was sent.
    if (m.username) doc.username = String(m.username).slice(0, 100);
    if (m.ip) doc.ip = String(m.ip).slice(0, 64);
    if (m.location) doc.location = m.location;
    // How many attempts this row stands for; 1 unless a canary is flushing a
    // window's summary.
    const count = Number(m.count);
    doc.count = Number.isFinite(count) && count > 0 ? Math.floor(count) : 1;
    insert(doc);
  } catch (e) {
    if (process.env.DEBUG === 'true') console.warn('securityLog.record failed:', e && e.message);
  }
}

export default { record };
