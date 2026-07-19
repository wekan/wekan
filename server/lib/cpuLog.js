// ============================================================================
// WeKan CPU-usage event logger (Admin Panel → Problems → CPU usage).
// ----------------------------------------------------------------------------
// Records ONLY the START and END of each sustained high-CPU period (not a
// continuous stream) as documents in the existing WeKan database
// (models/eventLog.js, stream:'cpu') via a normal Meteor JavaScript query — so it
// works identically on FerretDB and MongoDB. Best-effort, never throws.
// ============================================================================

import EventLog from '/models/eventLog';
const { sanitizeDetail } = require('/models/lib/securityLogFormat');

export function record(evt = {}) {
  try {
    const doc = {
      stream: 'cpu',
      at: evt.at instanceof Date ? evt.at : new Date(),
      severity: evt.severity || 'medium',
      category: evt.category || 'cpu',
      bleed: evt.bleed || 'CpuBleed',
      action: evt.action || 'detected',
      source: evt.source || 'cpuMonitor',
      cwe: evt.cwe || 'CWE-400',
      detail: sanitizeDetail(evt.detail),
    };
    const p = EventLog.insertAsync(doc);
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch (e) {
    if (process.env.DEBUG === 'true') console.warn('cpuLog.record failed:', e && e.message);
  }
}

export default { record };
