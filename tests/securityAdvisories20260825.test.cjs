'use strict';

// Regression wiring for the six private advisories received on 2026-08-25.
// Run: node tests/securityAdvisories20260825.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const code = rel => read(rel)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const publications = code('server/publications/users.js');
const users = code('server/models/users.js');
const historyPermission = code('server/permissions/userPositionHistory.js');
const historyModel = code('models/userPositionHistory.js');
const historyMethods = code('server/models/userPositionHistory.js');
const cas = code('packages/wekan-accounts-cas/cas_server.js');

test('user-miniprofile rejects logged-out subscriptions', () => {
  const body = publications.match(
    /Meteor\.publish\('user-miniprofile',[\s\S]*?\n\}\);/,
  )[0];
  assert.ok(/if \(!this\.userId\)[\s\S]*?this\.ready\(\)/.test(body));
  assert.ok(/tripCanary\('user\.miniprofile-without-login'/.test(body));
});

test('user-search treats metacharacters literally and returns public identity only', () => {
  const body = publications.match(
    /Meteor\.publish\('user-search',[\s\S]*?\n\}\);/,
  )[0];
  assert.ok(/new RegExp\(escapeForRegex\(searchTerm\), 'i'\)/.test(body));
  for (const sensitive of [
    'emails.address',
    'isAdmin',
    'loginDisabled',
    'authenticationMethod',
    'teams',
    'orgs',
  ]) {
    assert.ok(!body.includes(sensitive), sensitive + ' must not be published');
  }
  assert.ok(/type: 'subscription', name: 'user-search'/.test(publications));
});

test('board-authorized searchUsers also escapes and throttles its query', () => {
  assert.ok(/new RegExp\(escapeForRegex\(query\), 'i'\)/.test(users));
  assert.ok(/type: 'method', name: 'searchUsers'/.test(users));
  assert.ok(!/new RegExp\(query, 'i'\)/.test(users));
});

test('history insertion requires membership on current and previous boards', () => {
  assert.ok(/async insert\(userId, doc\)/.test(historyPermission));
  assert.ok(/findOneAsync\(doc\.boardId\)/.test(historyPermission));
  assert.ok(/previousBoard\.hasMember\(userId\)/.test(historyPermission));
  assert.ok(/tripCanary\('history\.cross-board'/.test(historyPermission));
  assert.ok(/update\(userId\)[\s\S]*?return tripCanary\('history\.cross-board'/.test(
    historyPermission,
  ));
});

test('history undo rechecks source visibility and destination membership', () => {
  assert.ok(/requireBoardVisible\(this\.userId, history\.boardId\)/.test(historyMethods));
  assert.ok(/destinationBoard\.hasMember\(userId\)/.test(historyModel));
  assert.ok(/throw new Meteor\.Error\([\s\S]*?'not-authorized'/.test(historyModel));
  assert.ok(/tripCanary\([\s\S]*?'history\.cross-board'/.test(historyModel));
});

test('every subtask export query carries its board boundary', () => {
  const expectations = new Map([
    ['models/exporter.js', [
      /boardId: card\.boardId,[\s\S]*?parentId: card\._id/,
      /\{ boardId, parentId: \{ \$in: cardIds \} \}/,
    ]],
    ['models/server/ExporterExcelBoard.js', [
      /\{ boardId: this\._boardId, parentId: \{ \$in: cardIds \} \}/,
    ]],
    ['models/server/ExporterCardPDF.js', [
      /\{ boardId: this\._boardId, parentId: this\._cardId \}/,
      /\{ boardId: this\._boardId, parentId: \{ \$in: cardIds \} \}/,
    ]],
    ['models/server/ExporterExcelCard.js', [
      /\{ boardId: this\._boardId, parentId: this\._cardId \}/,
    ]],
  ]);
  for (const [rel, patterns] of expectations) {
    const src = code(rel);
    for (const pattern of patterns) assert.ok(pattern.test(src), rel);
  }
});

test('CAS refuses implicit linking and marks newly created CAS accounts', () => {
  assert.ok(/authenticationMethod: 'cas'/.test(cas));
  assert.ok(/user\.authenticationMethod === 'cas'/.test(cas));
  assert.ok(/CAS_MERGE_EXISTING_USERS/.test(cas));
  assert.ok(/'cas-account-conflict'/.test(cas));
  assert.ok(/tripCanary\('cas\.account-conflict'/.test(cas));
});

console.log('\nsecurityAdvisories20260825: all ' + passed + ' tests passed');
