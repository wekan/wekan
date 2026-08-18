'use strict';

// wekan/wekan#3189: "User with Worker permission can't assignee card if it has
// been assigned to someone else before."
//   1. a Normal member adds an assignee to a card, then removes them
//   2. a Worker tries to assign the card to themselves
//   3. the card shows the PREVIOUS user again
// Run: node tests/workerCardWrite.test.cjs
//
// Step 3 is what a rejected optimistic write looks like: the client applied the
// change, the server refused it, and Minimongo put the old value back. The Worker
// could not assign themselves at all - with or without a previous assignee.
//
// The role's own description, in the board schema, is "move card, assign himself
// to card and comment". The capability table gave it `write: false`, and both a
// move and an assignee change are card UPDATES - so the role defined by two
// specific writes was allowed neither. The client had already built the UI: the
// assignee popup shows a Worker exactly one name, their own.
//
// Widening `write` to true would hand a Worker every field of every card, which
// is the opposite of what the role is. What was missing is a FIELD-LEVEL policy -
// this one - and its default is refusal: an update is allowed only when every
// operator and every field in it is one a Worker may write.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const {
  workerMayUpdateCard,
  WORKER_WRITABLE_FIELDS,
} = require('../models/lib/workerCardWrite.js');
const { memberCan } = require('../models/lib/boardRoleCapabilities.js');

const ME = 'worker-user-id';
const SOMEBODY_ELSE = 'other-user-id';

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('workerCardWrite:');

// ── what a Worker may do ────────────────────────────────────────────────────
test('a Worker may assign themselves - the reported case', () => {
  assert.strictEqual(workerMayUpdateCard(ME, { $addToSet: { assignees: ME } }), true);
});

test('and unassign themselves again', () => {
  assert.strictEqual(workerMayUpdateCard(ME, { $pull: { assignees: ME } }), true);
});

test('a previous assignee changes nothing about it', () => {
  // The report blamed the previous assignee, and it was a red herring: the write
  // was refused whatever the card already held. The modifier is the same either
  // way, which is why this policy reads only the modifier.
  assert.strictEqual(workerMayUpdateCard(ME, { $addToSet: { assignees: ME } }), true);
});

test('a Worker may move a card, which is the other half of the role', () => {
  assert.strictEqual(workerMayUpdateCard(ME, { $set: { listId: 'list-2' } }), true);
  assert.strictEqual(workerMayUpdateCard(ME, { $set: { swimlaneId: 's-2', sort: 3 } }), true);
  assert.strictEqual(
    workerMayUpdateCard(ME, { $set: { listId: 'l', swimlaneId: 's', sort: 1, dateLastActivity: new Date(), modifiedAt: new Date() } }),
    true, 'with the bookkeeping fields a move writes alongside');
});

// ── what a Worker may NOT do ────────────────────────────────────────────────
test('a Worker may not assign anybody else (negative)', () => {
  assert.strictEqual(workerMayUpdateCard(ME, { $addToSet: { assignees: SOMEBODY_ELSE } }), false);
  assert.strictEqual(workerMayUpdateCard(ME, { $pull: { assignees: SOMEBODY_ELSE } }), false,
    'and may not remove somebody else either - "assign himself" is the whole of it');
});

test('a Worker may not edit the card (negative)', () => {
  for (const modifier of [
    { $set: { title: 'rewritten' } },
    { $set: { description: 'rewritten' } },
    { $set: { listId: 'l', title: 'sneaked in' } },   // a move with a passenger
    { $set: { archived: true } },
    { $set: { boardId: 'another-board' } },           // that is not a "move" here
    { $addToSet: { labelIds: 'label-1' } },
    { $addToSet: { members: ME } },                   // members is not assignees
    { $unset: { dueAt: '' } },
    { $inc: { sort: 1 } },
    { $rename: { title: 'titel' } },
  ]) {
    assert.strictEqual(workerMayUpdateCard(ME, modifier), false,
      `allowed: ${JSON.stringify(modifier)}`);
  }
});

test('a whole-document replacement is refused (negative)', () => {
  // No operator at all replaces every field there is - the widest write in the
  // API, and the one an attacker reaches for first.
  assert.strictEqual(workerMayUpdateCard(ME, { title: 'x', listId: 'l' }), false);
  assert.strictEqual(workerMayUpdateCard(ME, {}), false, 'and an empty modifier does nothing');
});

test('qualifiers on the assignee write are refused rather than unpicked (negative)', () => {
  // `{ $each: [me] }` is the same intent, but $each takes a LIST, and a policy
  // that starts unpicking list shapes is a policy with a hole in it. The client
  // never writes this; refusing it costs nothing.
  assert.strictEqual(workerMayUpdateCard(ME, { $addToSet: { assignees: { $each: [ME] } } }), false);
  assert.strictEqual(workerMayUpdateCard(ME, { $pull: { assignees: { $in: [ME] } } }), false);
  assert.strictEqual(workerMayUpdateCard(ME, { $addToSet: { assignees: ME, members: ME } }), false,
    'and a second field alongside it is a second write');
});

test('junk never becomes permission (negative)', () => {
  for (const junk of [null, undefined, 0, '', 'string', [], [{ $set: {} }]]) {
    assert.strictEqual(workerMayUpdateCard(ME, junk), false, `allowed: ${JSON.stringify(junk)}`);
  }
  assert.strictEqual(workerMayUpdateCard(null, { $addToSet: { assignees: null } }), false,
    'no user id: nothing is "your own name"');
  assert.strictEqual(workerMayUpdateCard(undefined, { $addToSet: { assignees: undefined } }), false);
});

test('the writable set is small, and says so', () => {
  assert.deepStrictEqual([...WORKER_WRITABLE_FIELDS].sort(),
    ['assignees', 'dateLastActivity', 'listId', 'modifiedAt', 'sort', 'swimlaneId'],
    'every addition to this list is a decision about what a Worker may change');
});

// ── the roles table and the wiring ──────────────────────────────────────────
test('the capability table gives a Worker moveCard and still refuses write', () => {
  const board = role => [{ userId: ME, isActive: true, ...role }];
  assert.strictEqual(memberCan(board({ isWorker: true }), ME, 'moveCard'), true);
  assert.strictEqual(memberCan(board({ isWorker: true }), ME, 'write'), false,
    'a Worker is not "can edit cards", and this fix does not make it one');
  assert.strictEqual(memberCan(board({ isCommentOnly: true }), ME, 'moveCard'), false);
  assert.strictEqual(memberCan(board({ isReadOnly: true }), ME, 'moveCard'), false);
  assert.strictEqual(memberCan(board({}), ME, 'moveCard'), true, 'a normal member still moves cards');
  assert.strictEqual(memberCan(board({ isAdmin: true }), ME, 'moveCard'), true);
});

test('the server reads the modifier, and only reaches the policy for a Worker', () => {
  const permissions = read('server/permissions/cards.js');
  assert.ok(/canUpdateCard = async function\(userId, doc, fields, modifier\)/.test(permissions),
    'the allow rule has to pass the modifier through, or there is nothing to judge');
  assert.ok(/async update\(userId, doc, fields, modifier\)/.test(permissions),
    'including at the call site Meteor invokes');
  const body = permissions.slice(permissions.indexOf('export const canUpdateCard'),
    permissions.indexOf('Cards.allow('));
  const writeAt = body.indexOf('canEditCardOrLinkedCard');
  const workerAt = body.indexOf('workerMayUpdateCard');
  assert.ok(writeAt !== -1 && workerAt > writeAt,
    'direct or delegated write access is still the first question; the Worker policy only answers '
    + 'for somebody who does NOT have it');
  assert.ok(/hasWorker\(userId\)/.test(body),
    'and only for an actual Worker on THAT board');
  assert.ok(body.indexOf('vote') < writeAt && body.indexOf('poker') < writeAt,
    'the vote/poker canaries still fire before any of this');
});

test('the client offers exactly what the server allows', () => {
  const utils = read('client/lib/utils.js');
  assert.ok(/canMoveCard\(\) \{\s*\n\s*return Utils\.currentUserCan\('moveCard'\)/.test(utils),
    'the drag handle asks for the capability a Worker has, not for write');
  const jade = read('client/components/cards/cardDetails.jade');
  const popup = jade.slice(jade.indexOf('template(name="cardAssigneesPopup")'),
    jade.indexOf('template(name="cardAssigneePopup")'));
  assert.ok(/if currentUser\.isWorker/.test(popup) && /currentUser\._id/.test(popup),
    'the assignee popup shows a Worker their own name only - it always did, and '
    + 'that is the UI whose write the server used to throw away');
});

console.log(`\nworkerCardWrite: ${passed} tests passed`);
