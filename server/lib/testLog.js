// ============================================================================
// WeKan test-failure logger  (docs/Security/Remediation/WeKan.md §9b)
// ----------------------------------------------------------------------------
// Logs "anything that would fail some existing WeKan test": one document per
// FAILING test (passing tests are not logged) in the existing WeKan database
// (models/eventLog.js, stream:'tests') via a normal Meteor JavaScript query.
// Surfaced in Admin Panel → Reports → Tests. Best-effort, never throws.
// Server-only.
// ============================================================================

import EventLog from '/models/eventLog';
const { sanitizeDetail } = require('/models/lib/securityLogFormat');

// Record one FAILING test. Never throws.
//   recordFailure({ suite:'unit', test:'tests/foo.test.cjs:does X', message:'expected a to equal b' })
export function recordFailure(evt = {}) {
  try {
    const sev = { security: 'high', e2e: 'low', unit: 'medium' }[evt.suite] || 'medium';
    const doc = {
      stream: 'tests',
      at: new Date(),
      severity: evt.severity || sev,
      category: evt.category || 'test-failure',
      bleed: evt.bleed || 'TestBleed',
      action: evt.action || 'failed',
      source: evt.test || evt.source || evt.suite || 'test',
      cwe: '',
      detail: sanitizeDetail(evt.message || evt.detail),
    };
    const p = EventLog.insertAsync(doc);
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch (e) {
    if (process.env.DEBUG === 'true') console.warn('testLog.recordFailure failed:', e && e.message);
  }
}

export default { recordFailure };
