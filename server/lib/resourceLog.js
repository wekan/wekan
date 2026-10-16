// ============================================================================
// The event logger of the resource monitors (Admin Panel → Problems → CPU, RAM
// and Disk usage). Each records ONLY the START and END of a sustained
// high-usage period - two rows per episode, never a stream - as documents in
// the existing WeKan database (models/eventLog.js) through a normal Meteor
// query, so it works the same on FerretDB and MongoDB. Best-effort, never
// throws. cpuLog.js, ramLog.js and diskLog.js are this with their stream.
// ============================================================================

import EventLog from '/models/eventLog';
const { sanitizeDetail } = require('/models/lib/securityLogFormat');

export function resourceRecorder(defaults) {
  return function record(evt = {}) {
    try {
      const doc = {
        stream: defaults.stream,
        at: evt.at instanceof Date ? evt.at : new Date(),
        severity: evt.severity || 'medium',
        category: evt.category || defaults.category,
        bleed: evt.bleed || defaults.bleed,
        action: evt.action || 'detected',
        source: evt.source || defaults.source,
        cwe: evt.cwe || 'CWE-400',
        detail: sanitizeDetail(evt.detail),
      };
      const p = EventLog.insertAsync(doc);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {
      if (process.env.DEBUG === 'true') console.warn(`${defaults.stream} log record failed:`, e && e.message);
    }
  };
}
