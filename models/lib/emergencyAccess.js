'use strict';

// Emergency access (docs/Compliance/README.md P3; [HIPAA] § 164.312(a)(2)(ii)
// emergency access procedure): an administrator who impersonates an account
// for an emergency says so, with a note, and every other administrator is
// told at once by e-mail - so a break-glass use is never quiet. The
// impersonation is kept in impersonatedUsers with reason 'emergency' and the
// note, beside the Audit log's own row (Admin Panel / Problems /
// Impersonation Report lists both kinds).
//
// Pure: tests/emergencyAccess.test.cjs.

const MAX_NOTE = 500;

// The record of one impersonation.
function impersonationRecord(adminId, userId, options) {
  const emergency = !!(options && options.emergency === true);
  const note = emergency ? String((options && options.note) || '').trim().slice(0, MAX_NOTE) : '';
  return {
    adminId,
    userId,
    reason: emergency ? 'emergency' : 'clickedImpersonate',
    ...(note ? { note } : {}),
  };
}

// Who is told: every other administrator who can sign in, with an address.
function notifiedAdmins(admins, actorId) {
  return (admins || []).filter(a => a && a._id !== actorId && a.isAdmin === true && a.loginDisabled !== true
    && Array.isArray(a.emails) && a.emails[0] && a.emails[0].address);
}

module.exports = { MAX_NOTE, impersonationRecord, notifiedAdmins };
