'use strict';

// wekan/wekan#3249 (maintainer decision 2026-09-29): semi-open boards. A board's
// `permission` is one of three:
//
//   'private'  - only its active members (and org/team/domain shares) read it;
//   'instance' - every signed-in user of this WeKan reads it, and it is never
//                in an unauthenticated response: not on the anonymous Public
//                page, not in link previews, not over REST without a token;
//   'public'   - anybody reads it, signed in or not.
//
// Reading is all 'instance' grants: editing still needs membership, exactly as
// on a public board. This module is the one statement of that rule; it is pure
// so tests/boardPermission.test.cjs checks it directly.

const BOARD_PERMISSIONS = ['private', 'instance', 'public'];

// May somebody read this board without being one of its members?
// `signedIn` is whether the caller is an authenticated user.
function readableWithoutMembership(permission, signedIn) {
  if (permission === 'public') return true;
  if (permission === 'instance') return !!signedIn;
  return false;
}

// The Mongo clauses for boards readable without membership - the counterpart
// of readableWithoutMembership() for queries.
function withoutMembershipSelectors(signedIn) {
  return signedIn ? [{ permission: 'public' }, { permission: 'instance' }] : [{ permission: 'public' }];
}

// Anything but private. Admin Panel → Settings → Visibility "private boards
// only" refuses both open kinds.
function isOpenPermission(permission) {
  return permission === 'public' || permission === 'instance';
}

module.exports = { BOARD_PERMISSIONS, readableWithoutMembership, withoutMembershipSelectors, isOpenPermission };
