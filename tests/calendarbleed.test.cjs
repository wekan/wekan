'use strict';

// CalendarBleed — GHSA-fpm6-r5fg-2mrg, CWE-863.
// `importIcsToBoard` creates cards, but its DDP authorization used membership
// plus !hasReadOnly(). Comment-only and Worker roles therefore passed even
// though the canonical role policy denies them write access. The REST sibling
// already asked the shared write-capability helper.
// Run: node tests/calendarbleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { roleCan } = require('../models/lib/boardRoleCapabilities');

const source = fs.readFileSync(
  path.resolve(__dirname, '../server/methods/icsImport.js'), 'utf8');
const method = source.slice(
  source.indexOf('async importIcsToBoard('),
  source.indexOf('\n  },\n});', source.indexOf('async importIcsToBoard(')),
);

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('calendarbleed:');

test('the DDP import uses the canonical write-access decision', () => {
  assert.match(method,
    /!allowIsBoardMemberWithWriteAccess\(this\.userId, board\)/);
});

test('the authorization runs before any card import', () => {
  const authorization = method.indexOf('allowIsBoardMemberWithWriteAccess');
  const importCall = method.indexOf('importIcsCards(');
  assert.ok(authorization > -1 && authorization < importCall);
});

test('Comment Only and Only Assigned Comment cannot import cards', () => {
  assert.strictEqual(roleCan('comment-only', 'write'), false);
  assert.strictEqual(roleCan('comment-assigned-only', 'write'), false);
});

test('Worker, Read Only and Only Assigned Read cannot import cards', () => {
  assert.strictEqual(roleCan('worker', 'write'), false);
  assert.strictEqual(roleCan('read-only', 'write'), false);
  assert.strictEqual(roleCan('read-assigned-only', 'write'), false);
});

test('negative: legitimate writing roles retain ICS import access', () => {
  for (const role of ['board-admin', 'normal', 'normal-assigned-only', 'no-comments']) {
    assert.strictEqual(roleCan(role, 'write'), true, role);
  }
});

test('negative: no bespoke membership or read-only policy remains', () => {
  assert.ok(!method.includes('.hasMember('));
  assert.ok(!method.includes('.hasReadOnly('));
});

test('DDP and REST use the same helper', () => {
  assert.strictEqual(
    (source.match(/allowIsBoardMemberWithWriteAccess\(/g) || []).length,
    2,
  );
});

test('a denied import is visible in Admin Panel Problems', () => {
  assert.match(method,
    /tripCanary\('calendar\.import-without-write', \{ userId: this\.userId \}\)/);
});

console.log(`\ncalendarbleed: ${passed} tests passed`);
