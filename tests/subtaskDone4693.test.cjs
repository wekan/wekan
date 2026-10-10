'use strict';

// #4693 "Tick off the request to add subtasks": tick a subtask done in the
// parent card's Subtasks list, and show done/total in the section heading.
// Pure logic (models/lib/subtaskDone.js) plus source guards for the method,
// the UI and the minicard badge.
// Run: node tests/subtaskDone4693.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const s = require('../models/lib/subtaskDone.js');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- What "done" is --------------------------------------------------------

test('a subtask is done when marked complete (dueComplete) or archived', () => {
  assert.equal(s.isSubtaskDone({ dueComplete: true, archived: false }), true);
  assert.equal(s.isSubtaskDone({ dueComplete: false, archived: true }), true);
  assert.equal(s.isSubtaskDone({ dueComplete: true, archived: true }), true);
});

test('NEGATIVE: an open subtask, a truthy non-boolean, an end date or nothing is not done', () => {
  assert.equal(s.isSubtaskDone({ dueComplete: false, archived: false }), false);
  assert.equal(s.isSubtaskDone({ dueComplete: 'true', archived: 1 }), false);
  assert.equal(s.isSubtaskDone({ endAt: new Date() }), false, 'an end date is not completion (#4050)');
  assert.equal(s.isSubtaskDone(null), false);
  assert.equal(s.isSubtaskDone(undefined), false);
});

test('the Mongo selector matches exactly what isSubtaskDone accepts', () => {
  const sel = s.subtaskDoneSelector();
  const matches = doc => sel.$or.some(clause => Object.entries(clause).every(([k, v]) => doc[k] === v));
  const docs = [{}, { archived: true }, { dueComplete: true }, { archived: false, dueComplete: false },
    { archived: true, dueComplete: true }, { dueComplete: 'true' }];
  for (const doc of docs) assert.equal(matches(doc), s.isSubtaskDone(doc), JSON.stringify(doc));
});

// --- The heading count -----------------------------------------------------

test('summary and label count done of total, and say nothing with no subtasks', () => {
  const subtasks = [{ dueComplete: true }, { archived: true }, { dueComplete: false }, null];
  assert.deepEqual(s.subtaskDoneSummary(subtasks), { done: 2, total: 3 }, 'a missing entry is not a subtask');
  assert.equal(s.subtaskDoneCountLabel(subtasks), '2/3');
  assert.equal(s.subtaskDoneCountLabel([{ dueComplete: true }]), '1/1', 'the issue\'s screenshot: 1/1');
  assert.equal(s.subtaskDoneCountLabel([{ dueComplete: false }]), '0/1');
  assert.equal(s.subtaskDoneCountLabel([]), null);
  assert.equal(s.subtaskDoneCountLabel(undefined), null);
});

// --- Who may tick ----------------------------------------------------------

const subtask = { _id: 'sub', parentId: 'p', assignees: ['u2'], archived: false };
const allowed = { userId: 'u1', parentCardId: 'p', subtask, canEdit: true, assignedOnly: false };

test('a user who may edit the subtask may tick it, under its primary or another parent', () => {
  assert.equal(s.subtaskDoneDenial(allowed), null);
  assert.equal(s.subtaskDoneDenial({ ...allowed, parentCardId: 'q',
    subtask: { ...subtask, parentIds: ['p', 'q'] } }), null, '#3626: a second parent');
  assert.equal(s.subtaskDoneDenial({ ...allowed, userId: 'u2', assignedOnly: true }), null,
    'an assigned-only member, on a subtask assigned to them');
});

test('NEGATIVE: no user, no edit right, or assigned-only on someone else\'s subtask is refused', () => {
  assert.equal(s.subtaskDoneDenial({ ...allowed, userId: null }), 'not-authorized');
  assert.equal(s.subtaskDoneDenial({ ...allowed, canEdit: false }), 'not-authorized',
    'comment-only, read-only, worker and non-members have no write capability');
  assert.equal(s.subtaskDoneDenial({ ...allowed, canEdit: 'yes' }), 'not-authorized', 'only a real true');
  assert.equal(s.subtaskDoneDenial({ ...allowed, assignedOnly: true }), 'not-authorized');
});

test('NEGATIVE: a missing card, a card that is not this parent\'s subtask, a linked board, an archived subtask', () => {
  assert.equal(s.subtaskDoneDenial({ ...allowed, subtask: null }), 'not-found');
  assert.equal(s.subtaskDoneDenial({ ...allowed, parentCardId: '' }), 'not-found');
  assert.equal(s.subtaskDoneDenial({ ...allowed, parentCardId: 'other' }), 'not-a-subtask');
  assert.equal(s.subtaskDoneDenial({ ...allowed, subtask: { ...subtask, type: 'cardType-linkedBoard' } }), 'not-a-subtask');
  assert.equal(s.subtaskDoneDenial({ ...allowed, subtask: { ...subtask, archived: true } }), 'subtask-archived');
});

test('worker and comment/read roles have no write capability, so canEdit is false for them', () => {
  const { roleCan } = require('../models/lib/boardRoleCapabilities.js');
  for (const role of ['worker', 'comment-only', 'comment-assigned-only', 'read-only', 'read-assigned-only']) {
    assert.equal(roleCan(role, 'write'), false, role);
  }
  for (const role of ['board-admin', 'normal', 'normal-assigned-only', 'no-comments']) {
    assert.equal(roleCan(role, 'write'), true, role);
  }
});

// --- The server method -----------------------------------------------------

const method = read('server/lib/subtaskDoneMethod.js');

test('setSubtaskDone checks its arguments, the caller and the subtask edit right', () => {
  assert.match(method, /check\(parentCardId, String\)/);
  assert.match(method, /check\(subtaskId, String\)/);
  assert.match(method, /check\(done, Boolean\)/);
  assert.match(method, /if \(!userId\) throw new Meteor\.Error\('not-authorized'\)/);
  assert.match(method, /canEditCardOrLinkedCard\(userId, target, targetBoard\)/,
    'the edit right is checked on the SUBTASK (or its link source), not on the parent');
  assert.match(method, /canUserSeeBoard\(userId, parentCard\.boardId\)/);
  assert.match(method, /isAssignedOnlyMember\(subtaskBoard, userId\)/);
  assert.match(method, /subtaskDoneDenial\(/);
  assert.match(method, /\$set: \{ dueComplete: done \}/, 'the existing completion flag, no new field');
  assert.match(method, /setSubtaskDone\(parentCardId, subtaskId, done\)/);
  assert.match(read('server/models/cards.js'), /import '\/server\/lib\/subtaskDoneMethod';/, 'the method is loaded');
});

test('NEGATIVE: the method writes through the collection (History hook), never .direct or rawCollection', () => {
  assert.doesNotMatch(method, /\.direct\.|rawCollection\(/);
  assert.match(read('models/lib/changeHistoryGroups.js'), /dueComplete: 'dates'/,
    'History records a dueComplete change');
});

test('NEGATIVE: the client never writes dueComplete for a subtask directly', () => {
  const js = read('client/components/cards/subtasks.js');
  assert.doesNotMatch(js, /setDueComplete|dueComplete:\s*!/);
  assert.match(js, /Meteor\.callAsync\('setSubtaskDone', data\.parentCardId, subtask\._id, done\)/);
});

// --- The UI ----------------------------------------------------------------

test('each subtask row has a checkbox, live only for those who may tick it', () => {
  const jade = read('client/components/cards/subtasks.jade');
  assert.match(jade, /\+subtaskDetail\(subtask = subtask parentCardId = realCardId\)/);
  assert.match(jade, /if subtaskCanTick\n\s+a\.subtask-done-toggle\.js-toggle-subtask-done\(role="checkbox"/);
  assert.match(jade, /else\n\s+span\.subtask-done-toggle\.is-disabled\([^)]*aria-disabled="true"/,
    'everyone else sees the state, disabled, with no click handler class');
  assert.match(jade, /subtask-mark-done/);
  assert.match(jade, /subtask-mark-not-done/);
  const js = read('client/components/cards/subtasks.js');
  assert.match(js, /subtaskCanTick\(\) \{[\s\S]*?subtaskDoneDenial\(\{[\s\S]*?canEdit: !!board && Utils\.canModifyCard\(subtask\)/,
    'the client asks the same rule about the SUBTASK\'s board');
});

test('the Subtasks heading shows done/total', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  assert.match(jade, /\+cardSectionHeader\(section="subtasks"[^\n]*\n\s+count=subtaskDoneCount/);
  assert.match(read('client/components/cards/subtasks.js'), /Template\.registerHelper\('subtaskDoneCount'/);
});

test('the minicard badge counts the same done as the heading', () => {
  const cards = read('models/cards.js');
  const fn = cards.match(/subtasksFinished\(\) \{[\s\S]*?\n  \},/)[0];
  assert.match(fn, /\$or: \[\{ archived: true \}, \{ dueComplete: true \}\]/);
});

test('the new strings are in English only', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['subtask-mark-done', 'subtask-mark-not-done', 'subtask-done-no-permission']) {
    assert.equal(typeof en[key], 'string', key);
  }
});

console.log(`\n${passed} tests passed`);
