'use strict';

// Who may download whose personal-data export (WP-5). Pure, so the decision
// is tested on its own (tests/personalDataExport.test.cjs).
//
// A person: their own, always - the right of access is not a setting.
// An administrator: any account's, as well - recorded in the Audit log.
// Nobody else, and nobody signed out or disabled.

const ID = /^[A-Za-z0-9]{1,64}$/;

function decideExportTarget(requester, wantedUserId) {
  if (!requester || !requester._id || requester.loginDisabled) {
    return { allowed: false, code: 401, error: 'not-authorized' };
  }
  if (!wantedUserId || wantedUserId === requester._id) {
    return { allowed: true, self: true, userId: requester._id };
  }
  if (!ID.test(wantedUserId)) return { allowed: false, code: 400, error: 'invalid-user-id' };
  if (requester.isAdmin !== true) return { allowed: false, code: 403, error: 'not-authorized' };
  return { allowed: true, self: false, userId: wantedUserId };
}

module.exports = { decideExportTarget };
