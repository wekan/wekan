'use strict';

// How long WeKan keeps the records that had no limit an operator could set
// (docs/Compliance/README.md WP-7; [GDPR] Art. 5(1)(e) storage limitation,
// [HIPAA] § 164.316(b)(2)(i) for audit records). Each is a number of days from
// an environment variable, read the same way here and swept once a day:
//
//   ADMIN_AUDIT_RETENTION_DAYS       the administrators' audit log
//                                    (server/adminAudit.js); 365 by default, as
//                                    before; 0 keeps it - a HIPAA deployment
//                                    sets 2190 or more.
//   ACTIVITIES_RETENTION_DAYS        board activity rows
//                                    (server/lib/activitiesRetention.js); off
//                                    (0) by default, so nothing changes until
//                                    an operator asks. The change history of a
//                                    card (changeHistory) is never touched.
//   WORKLOAD_ABSENCE_RETENTION_DAYS  workload absences that ENDED that many
//                                    days ago (server/lib/workloadAbsenceRetention.js);
//                                    off (0) by default.
//
// And one switch: WORKLOAD_ABSENCE_TYPE_RECORDED=false stores every new absence
// as "other", so no sick leave - health data, [GDPR] Art. 9 - is recorded at
// all; the person is still shown as not available.
//
// Pure: tests/retentionSettings.test.cjs.

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 36500;

const { AUDIT_KEEP_DAYS } = require('./adminAudit');

const KNOBS = Object.freeze({
  ADMIN_AUDIT_RETENTION_DAYS: { default: AUDIT_KEEP_DAYS, collection: 'adminAuditLog' },
  ACTIVITIES_RETENTION_DAYS: { default: 0, collection: 'activities' },
  WORKLOAD_ABSENCE_RETENTION_DAYS: { default: 0, collection: 'workloadAbsences' },
});

// The days a knob is set to: a whole number from 0 to 36500, or its default.
function retentionDays(name, env = process.env) {
  const knob = KNOBS[name];
  if (!knob) throw new Error(`unknown retention setting ${name}`);
  const raw = env && env[name];
  if (raw === undefined || raw === null || String(raw).trim() === '') return knob.default;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n <= MAX_DAYS ? n : knob.default;
}

// The moment before which a row goes, or null when the knob keeps everything.
function cutoffDate(days, now = Date.now()) {
  return days > 0 ? new Date(now - days * DAY_MS) : null;
}

// The same as a YYYY-MM-DD day, for absences, whose dates are days.
function cutoffDay(days, now = Date.now()) {
  const date = cutoffDate(days, now);
  return date ? date.toISOString().slice(0, 10) : null;
}

function absenceTypeRecorded(env = process.env) {
  return String((env && env.WORKLOAD_ABSENCE_TYPE_RECORDED) || '').trim().toLowerCase() !== 'false';
}

// The type an absence is stored with.
function storedAbsenceType(type, env = process.env) {
  return absenceTypeRecorded(env) ? type : 'other';
}

module.exports = { KNOBS, MAX_DAYS, retentionDays, cutoffDate, cutoffDay, absenceTypeRecorded, storedAbsenceType };
