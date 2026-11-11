'use strict';

// #6892: the scans the database-problems page reported on a large instance -
// a user looked up by LDAP id at every login and sync pass, an entity's own
// History and the integrity check's lookups by hash - each get an index,
// created at startup like every other one. The negatives check the selectors
// the indexes are for are still the ones the code makes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('a user is found by LDAP id through a sparse index', () => {
  const users = read('server/models/users.js');
  assert.match(users, /ensureIndex\(Users, \{ 'services\.ldap\.id': 1 \}, \{ sparse: true \}\)/);
  assert.match(read('packages/wekan-ldap/server/loginHandler.js'), /'services\.ldap\.id':/, 'the login looks a user up by it (negative)');
});

test('an entity\'s History and a hash have indexes', () => {
  const history = read('server/models/changeHistory.js');
  assert.match(history, /ensureIndex\(ChangeHistory, \{ entityType: 1, entityId: 1, createdAt: -1 \}\)/);
  assert.match(history, /ensureIndex\(ChangeHistory, \{ integrityHash: 1 \}\)/);
  assert.match(history, /Meteor\.startup\(async \(\) => \{/, 'at startup');
});

test('cards are found by assignee and member across boards', () => {
  const cards = read('models/cards.js');
  for (const key of ['{ assignees: 1 }', '{ members: 1 }']) assert.ok(cards.includes(`ensureIndex(Cards, ${key})`), key);
});
