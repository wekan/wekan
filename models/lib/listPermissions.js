'use strict';

// Per-list permission exceptions (#4527, decided 2026-10-14: on top of the
// role matrix). A board admin can say, for one list, that a role may - or may
// not - edit or comment there, whatever the board says. The issue's example: a
// read-only board with one list where everybody signed in may add and comment.
//
// list.roleExceptions = { <role>: { write?: Boolean, comment?: Boolean } }
//   <role> is a built-in role key ('normal', 'read-only', ...), a custom role
//   ('custom:<id>'), or 'signed-in' - any signed-in user who is not a member,
//   on an open ('instance' or 'public') board. A missing value is the board's.
//
// A board admin is never restricted by an exception (they set them). Moving a
// card follows `write` (a move is an edit of both lists). Board settings are
// never granted here. Pure: tests/listPermissions.test.cjs.
const { memberRoleOf, memberCan } = require('./boardRoleCapabilities');

const LIST_CAPABILITIES = ['write', 'comment'];
const SIGNED_IN = 'signed-in';

function roleIn(board, userId) {
  if (!userId || !board || !Array.isArray(board.members)) return null;
  const entry = board.members.find(m => m && m.userId === userId);
  if (entry) return entry.isActive === true ? memberRoleOf(entry) : null; // removed: no role at all
  const open = board.permission === 'instance' || board.permission === 'public';
  return open ? SIGNED_IN : null;
}

/** The exception a list makes for this user's role and capability: true, false or undefined. */
function exceptionFor(board, list, userId, capability) {
  if (!list || !list.roleExceptions || typeof list.roleExceptions !== 'object') return undefined;
  const role = roleIn(board, userId);
  if (!role || role === 'board-admin') return undefined;
  const entry = list.roleExceptions[role];
  const cap = capability === 'moveCard' ? 'write' : capability;
  return entry && typeof entry[cap] === 'boolean' ? entry[cap] : undefined;
}

/**
 * May this user do it in this list? The list's exception for their role, if it
 * has one for this capability; otherwise what the board allows (memberCan).
 */
function listCan(board, list, userId, capability) {
  if (!userId || !board) return false;
  if (capability !== 'write' && capability !== 'comment' && capability !== 'moveCard') {
    return memberCan(board, userId, capability);
  }
  const exception = exceptionFor(board, list, userId, capability);
  if (exception !== undefined) return exception;
  return memberCan(board, userId, capability);
}

/** An exceptions object to save, cleaned: known capabilities, booleans only. */
function cleanExceptions(input) {
  const out = {};
  if (!input || typeof input !== 'object') return out;
  for (const [role, caps] of Object.entries(input)) {
    if (typeof role !== 'string' || !role || role === 'board-admin' || role.length > 100) continue;
    if (!/^(custom:[A-Za-z0-9_-]+|signed-in|[a-z-]+)$/.test(role)) continue;
    const entry = {};
    for (const cap of LIST_CAPABILITIES) {
      if (caps && typeof caps[cap] === 'boolean') entry[cap] = caps[cap];
    }
    if (Object.keys(entry).length) out[role] = entry;
  }
  return out;
}

module.exports = { LIST_CAPABILITIES, SIGNED_IN, roleIn, exceptionFor, listCan, cleanExceptions };
