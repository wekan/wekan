// ============================================================================
// WeKan speed / performance event logger  (docs/Security/Remediation/WeKan.md §9)
// ----------------------------------------------------------------------------
// Records performance problems NOT auto-remediated (slow method/request,
// oversized publication, big board, repeated full scans) — and problems FerretDB
// reports back to WeKan — as documents in the existing WeKan database
// (models/eventLog.js, stream:'speed') via a normal Meteor JavaScript query.
// Best-effort, never throws. Server-only.
// ============================================================================

import EventLog from '/models/eventLog';
// One row per problem, not per event - see server/lib/eventLogFold.js.
import { foldEventFireAndForget } from '/server/lib/eventLogFold';
const { sanitizeDetail } = require('/models/lib/securityLogFormat');

// Record one performance event. Never throws.
//   record({ category:'slow-method', severity:'medium', source:'ddp.method:cardsLoad',
//            detail:'2.4s > 2s threshold' })
// FerretDB-reported problems use source 'ferretdb'/'sqlite.*' (WeKan saves them here).
export function record(evt = {}) {
  try {
    const doc = {
      stream: 'speed',
      at: new Date(),
      severity: evt.severity || 'low',
      category: evt.category || 'performance',
      bleed: evt.bleed || 'SlowBleed',
      action: evt.action || 'detected',
      source: evt.source || '',
      cwe: evt.cwe || '',
      detail: sanitizeDetail(evt.detail),
    };
    if (evt.userId || evt.userid) doc.userId = String(evt.userId || evt.userid);
    if (evt.username) doc.username = String(evt.username).slice(0, 100);
    if (evt.ip) doc.ip = String(evt.ip).slice(0, 64);
    if (evt.location) doc.location = evt.location;
    foldEventFireAndForget(doc, 'speedLog');
  } catch (e) {
    if (process.env.DEBUG === 'true') console.warn('speedLog.record failed:', e && e.message);
  }
}

export default { record };
