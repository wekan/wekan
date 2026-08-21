'use strict';

// AssignedBleed — GHSA-f396-42fx-vr88, CWE-863.
// REST write authorization duplicated role flags and omitted Only Assigned
// Comment. The shared check and both attachment variants now read the canonical
// role capability table instead.
// Run: node tests/assignedbleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { roleCan } = require('../models/lib/boardRoleCapabilities');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const authentication = read('server/authentication.js');
const attachmentMethod = read('server/attachmentApi.js');
const attachmentRest = read('server/routes/attachmentApi.js');
const cards = read('server/models/cards.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const writeCheck = authentication.slice(
  authentication.indexOf('async checkBoardWriteAccess('),
  authentication.indexOf('// Helper function. Will throw an error if the user is not a board admin.'),
);

console.log('assignedbleed:');

test('Only Assigned Comment has no canonical write capability', () => {
  assert.strictEqual(roleCan('comment-assigned-only', 'write'), false);
});

test('the shared REST write check asks the canonical capability helper', () => {
  assert.match(writeCheck,
    /allowIsBoardMemberWithWriteAccess\(userId, board\)/);
});

test('negative: the shared check contains no hand-written role flags', () => {
  const executable = writeCheck
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  for (const flag of [
    'isNoComments', 'isCommentOnly', 'isCommentAssignedOnly', 'isWorker',
    'isReadOnly', 'isReadAssignedOnly',
  ]) {
    assert.ok(!executable.includes(flag), flag);
  }
});

test('all card mutation routes continue through the repaired shared check', () => {
  const calls = cards.match(/Authentication\.checkBoardWriteAccess\(/g) || [];
  assert.ok(calls.length >= 10, `found ${calls.length} card write checks`);
});

test('both attachment APIs use the canonical capability too', () => {
  for (const [name, source] of [
    ['Meteor attachment methods', attachmentMethod],
    ['REST attachment routes', attachmentRest],
  ]) {
    const helper = source.slice(
      source.indexOf('async function userHasBoardWriteAccess('),
      source.indexOf('\n}\n', source.indexOf('async function userHasBoardWriteAccess(')) + 2,
    );
    assert.match(helper, /allowIsBoardMemberWithWriteAccess\(userId, board\)/,
      name);
    assert.ok(!helper.includes('isCommentAssignedOnly'), name);
  }
});

test('denied shared and attachment writes trip the AssignedBleed canary', () => {
  assert.match(writeCheck,
    /tripCanary\('board\.write-without-capability', \{ userId \}\)/);
  for (const source of [attachmentMethod, attachmentRest]) {
    assert.match(source,
      /tripCanary\('board\.write-without-capability', \{ userId \}\)/);
  }
});

test('all non-writing roles are denied by the shared decision', () => {
  for (const role of [
    'comment-only', 'comment-assigned-only', 'worker', 'read-only',
    'read-assigned-only',
  ]) {
    assert.strictEqual(roleCan(role, 'write'), false, role);
  }
});

test('negative: legitimate writing roles retain REST write access', () => {
  for (const role of ['board-admin', 'normal', 'normal-assigned-only', 'no-comments']) {
    assert.strictEqual(roleCan(role, 'write'), true, role);
  }
});

console.log(`\nassignedbleed: ${passed} tests passed`);
