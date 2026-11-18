// ============================================================================
// The event logger of the resource monitors (Admin Panel → Problems → CPU, RAM
// and Disk usage). Each records ONLY the START and END of a sustained
// high-usage period - two rows per episode, never a stream - as documents in
// the existing WeKan database (models/eventLog.js) through a normal Meteor
// query, so it works the same on FerretDB and MongoDB. Best-effort, never
// throws. cpuLog.js, ramLog.js and diskLog.js are this with their stream.
// ============================================================================

import { Meteor } from 'meteor/meteor';
import EventLog from '/models/eventLog';
const { sanitizeDetail } = require('/models/lib/securityLogFormat');

// A resource monitor reports how busy the machine is, not a vulnerability. Its
// rows were named like the Hall of Fame entries - RamBleed, CpuBleed, DiskBleed,
// with CWE-400 - and a laptop with many programs open read as an attack
// (2026-11-19). They are named for what happened now, carry no CWE, and the
// rows already stored under the old name are renamed once, at startup.
export function renameLegacyRows(stream, from, to) {
  if (!from || from === to) return Promise.resolve();
  return EventLog.rawCollection().updateMany({ stream, bleed: from }, { $set: { bleed: to }, $unset: { cwe: '' } })
    .catch(() => {});
}

export function resourceRecorder(defaults) {
  if (Meteor.isServer) Meteor.startup(() => { renameLegacyRows(defaults.stream, defaults.legacyBleed, defaults.bleed); });
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
        ...(evt.cwe ? { cwe: evt.cwe } : {}),
        detail: sanitizeDetail(evt.detail),
      };
      const p = EventLog.insertAsync(doc);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {
      if (process.env.DEBUG === 'true') console.warn(`${defaults.stream} log record failed:`, e && e.message);
    }
  };
}
