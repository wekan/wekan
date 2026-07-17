'use strict';

// Pure helper for the POST /users/logout REST endpoint (issue #1437: "Old
// tokens are not replaced or set invalid"). Extracted so the request
// validation / Mongo-update planning is unit-testable in plain Node without
// Meteor (mirrors models/lib/restLabel.js and models/lib/boardSortReorder.js).
//
// #1437: the REST API has always had POST /users/login (which mints a new
// resume login token on every call) but never a logout, so tokens acquired
// via the API could not be invalidated — they simply piled up in
// services.resume.loginTokens until their ~90 day expiry ("I have probably
// created 50+ valid tokens recently"). A leaked token therefore stayed valid
// with no server-side way to revoke it short of editing the database.
//
// buildLogoutPlan validates the (already-authenticated) request and yields a
// definite outcome for the route handler:
//   - { ok: true, all, selector, modifier }  -> caller runs
//       Meteor.users.updateAsync(selector, modifier) and reports success.
//   - { ok: false, status, error, reason }   -> caller sends that JSON error.
//
// Two modes:
//   - default: revoke ONLY the token presented in the Authorization header
//     ($pull of its hashed form) — other sessions (e.g. the browser GUI)
//     stay logged in;
//   - { "all": true } in the request body: revoke EVERY resume token of the
//     user ("logout everywhere"), cleaning up any accumulated/leaked tokens.

// Truthy spellings accepted for the `all` flag. Body parsing may deliver a
// boolean (JSON body) or a string (urlencoded body), so accept both.
function wantsAllSessions(rawAll) {
  if (rawAll === true) return true;
  if (typeof rawAll === 'string') {
    const s = rawAll.trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
  }
  if (rawAll === 1) return true;
  return false;
}

function buildLogoutPlan(request) {
  const { userId, hashedToken, all } =
    request && typeof request === 'object' ? request : {};
  if (typeof userId !== 'string' || userId.length === 0) {
    return {
      ok: false,
      status: 401,
      error: 'unauthorized',
      reason:
        'You must be logged in to log out. Send your token as an Authorization: Bearer header.',
    };
  }

  const everywhere = wantsAllSessions(all);

  if (everywhere) {
    return {
      ok: true,
      all: true,
      selector: { _id: userId },
      modifier: { $set: { 'services.resume.loginTokens': [] } },
    };
  }

  if (typeof hashedToken !== 'string' || hashedToken.length === 0) {
    return {
      ok: false,
      status: 401,
      error: 'unauthorized',
      reason: 'No login token found on the request.',
    };
  }

  return {
    ok: true,
    all: false,
    selector: { _id: userId },
    modifier: { $pull: { 'services.resume.loginTokens': { hashedToken } } },
  };
}

module.exports = {
  buildLogoutPlan,
  wantsAllSessions,
};
