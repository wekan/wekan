'use strict';

// What a Worker may write on a card, and nothing else.
//
// wekan/wekan#3189: "User with Worker permission can't assignee card if it has
// been assigned to someone else before" - and in fact could not assign themselves
// at all. The card appeared to change and then snapped back, which is what a
// server-side rejection of an optimistic write looks like.
//
// The role's own description, in the board schema, is "move card, assign himself
// to card and comment". The capability table
// (models/lib/boardRoleCapabilities.js) gives it `write: false`, and card moves
// and assignee changes are both card UPDATES - so the one role defined by two
// specific writes was allowed neither. The client already builds the UI for it:
// the assignee popup shows a Worker exactly one name, their own. The server threw
// the write away.
//
// Widening `write` to true is not the fix - that would hand a Worker every field
// of every card, which is the opposite of what the role is. What was missing is a
// FIELD-LEVEL policy, so here it is, as a pure function over the update itself:
//
//   MOVE          $set of listId / swimlaneId / sort, plus the bookkeeping fields
//                 a move writes with them (dateLastActivity, modifiedAt).
//   SELF-ASSIGN   $addToSet or $pull of `assignees` with EXACTLY the worker's own
//                 user id.
//
// Everything else is refused, and the refusal is the default: an update is
// allowed only when every operator and every field in it is one of the above. A
// modifier this does not recognise - $unset, $rename, a raw replacement document,
// an operator added by a future MongoDB - is not allowed, so a new way to write a
// field cannot quietly become a Worker capability.
//
// DELIBERATELY NOT INCLUDED:
//   * boardId. "Move card" here means within the board a Worker is a member of;
//     moving a card to ANOTHER board is a different act, and the cross-board deny
//     rule (GHSA-gm7v-pc38-53jr) has its own opinion about it.
//   * assigning anybody else, or unassigning somebody else. A Worker may add and
//     remove their own name and no other, which is exactly "assign himself".
//   * members (the other people-on-a-card field). The role says assignee.
//
// Pure and dependency-free: server/permissions/cards.js applies it, and
// tests/workerCardWrite.test.cjs exercises it on its own.

// The fields a card move writes.
const MOVE_FIELDS = new Set([
  'listId',
  'swimlaneId',
  'sort',
  // Written alongside a move by the client and by Cards.before.update.
  'dateLastActivity',
  'modifiedAt',
]);

// The array a Worker may put their own name into, and take it out of again.
const SELF_FIELD = 'assignees';

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

// Does this operator's payload only touch fields a Worker may move?
function moveOnly(payload) {
  if (!isPlainObject(payload)) return false;
  const keys = Object.keys(payload);
  if (keys.length === 0) return false;
  return keys.every(field => MOVE_FIELDS.has(field));
}

// Does this $addToSet / $pull payload name only the worker's OWN id on
// `assignees`? `{ assignees: 'me' }` is the shape the client writes
// (Card.assignAssignee / unassignAssignee); `{ assignees: { $each: [...] } }` and
// every other qualifier are refused rather than unpicked.
function selfAssignOnly(payload, userId) {
  if (!isPlainObject(payload)) return false;
  const keys = Object.keys(payload);
  if (keys.length !== 1 || keys[0] !== SELF_FIELD) return false;
  return payload[SELF_FIELD] === userId;
}

// May a Worker perform this card update?
//   userId    the worker
//   modifier  the update modifier, as the allow rule receives it
function workerMayUpdateCard(userId, modifier) {
  if (!userId || !isPlainObject(modifier)) return false;
  const operators = Object.keys(modifier);
  if (operators.length === 0) return false;

  // A modifier with no operator at all is a whole-document replacement, which
  // rewrites every field there is.
  if (operators.some(op => op.charAt(0) !== '$')) return false;

  let sawSomething = false;
  for (const op of operators) {
    const payload = modifier[op];
    if (op === '$set') {
      if (!moveOnly(payload)) return false;
      sawSomething = true;
      continue;
    }
    if (op === '$addToSet' || op === '$pull') {
      if (!selfAssignOnly(payload, userId)) return false;
      sawSomething = true;
      continue;
    }
    // Any other operator: not a move, not a self-assignment.
    return false;
  }
  return sawSomething;
}

// The fields this policy can ever allow, for the documentation and the tests to
// read rather than restate.
const WORKER_WRITABLE_FIELDS = [...MOVE_FIELDS, SELF_FIELD];

module.exports = {
  workerMayUpdateCard,
  WORKER_WRITABLE_FIELDS,
  MOVE_FIELDS,
  SELF_FIELD,
};
