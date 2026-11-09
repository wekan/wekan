import Lists from '/models/lists';
import { allowIsBoardMemberWithWriteAccess, allowIsBoardMemberCommentOnly } from '/server/lib/utils';

// #4527: the server half of per-list exceptions (models/lib/listPermissions.js
// decides). No side effects, so linkedCardPermission.js and the allow/deny
// rules in server/listPermissions.js can both import it.
const { exceptionFor } = require('/models/lib/listPermissions');

/** The list's exception for this user: true, false, or undefined (the board decides). */
export async function listException(userId, board, listId, capability) {
  if (!userId || !board || typeof listId !== 'string' || !listId) return undefined;
  const list = await Lists.findOneAsync(listId, { fields: { roleExceptions: 1, boardId: 1 } });
  // A list on another board has no say here; that board's own rules decide.
  if (!list || list.boardId !== board._id) return undefined;
  return exceptionFor(board, list, userId, capability);
}

/** May this user add, edit or remove cards in this list? */
export async function canWriteInList(userId, board, listId) {
  const exception = await listException(userId, board, listId, 'write');
  if (exception !== undefined) return exception;
  return allowIsBoardMemberWithWriteAccess(userId, board);
}

/** May this user comment on cards in this list? */
export async function canCommentInList(userId, board, listId) {
  const exception = await listException(userId, board, listId, 'comment');
  if (exception !== undefined) return exception;
  return allowIsBoardMemberCommentOnly(userId, board);
}

/**
 * The REST API's half: a list that refuses this user's role refuses the API
 * too (403), so a restriction cannot be stepped round with a token. A list's
 * GRANT does not open the API to a role the board does not let write.
 *
 * ListLockBleed (GHSA-4734-8vrg-8j3w): the checklist and checklist-item routes
 * did not ask, so a member a list refused still wrote its cards' checklists
 * over REST. Every REST write that names a card asks now
 * (tests/listPermissions.test.cjs), and the refusal is recorded in Admin
 * Panel -> Problems: no screen offers such a write, so it is an attempt.
 */
export async function assertListNotRefused(userId, board, listId, capability = 'write', source = 'rest:list-locked') {
  if ((await listException(userId, board, listId, capability)) !== false) return;
  try {
    require('/server/lib/securityLog').record({ key: 'authz.list-locked', action: 'blocked', source, userId,
      detail: `A REST ${capability} in a list whose exception refuses the caller's role.` });
  } catch (e) { /* logging must never break the guard */ }
  const { Meteor } = require('meteor/meteor');
  const error = new Meteor.Error('Forbidden', 'Forbidden');
  error.statusCode = 403;
  throw error;
}
