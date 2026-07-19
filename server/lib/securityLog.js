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

function insert(doc) {
  try {
    const p = EventLog.insertAsync(doc);
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch (e) {
    if (process.env.DEBUG === 'true') console.warn('securityLog insert failed:', e && e.message);
  }
}

// Record one security event. Never throws. Pass a catalog `key` (see
// models/lib/securityCategories) and/or explicit fields; explicit wins.
export function record(evt = {}) {
  try {
    const base = evt.key ? categoryFor(evt.key) : {};
    const m = { ...base, ...evt };
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
    insert(doc);
  } catch (e) {
    if (process.env.DEBUG === 'true') console.warn('securityLog.record failed:', e && e.message);
  }
}

export default { record };
