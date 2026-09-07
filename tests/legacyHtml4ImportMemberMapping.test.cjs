'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { membersFromImport } = require('../models/lib/importMembers');

const read = relative => fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('legacyHtml4ImportMemberMapping:');

test('one pure extractor is shared by every mappable importer', () => {
  assert.deepEqual(membersFromImport('trello', { members: [
    { id: 't1', username: 'alice', fullName: 'Alice' },
    { id: 't1', username: 'duplicate' },
  ] }), [{ id: 't1', username: 'alice', fullName: 'Alice' }]);
  assert.deepEqual(membersFromImport('wekan', {
    members: [{ userId: 'w1' }, { userId: 'missing' }],
    users: [{ _id: 'w1', username: 'bob', profile: { fullname: 'Bob' } }],
  }), [{ id: 'w1', username: 'bob', fullName: 'Bob' }]);
  assert.deepEqual(membersFromImport('csv', [
    ['Title', 'Members'], ['Card', 'alice bob alice'],
  ]).map(member => member.id), ['alice', 'bob']);
  assert.deepEqual(membersFromImport('jira', { issues: [{ fields: { assignee: {
    accountId: 'j1', name: 'jane', displayName: 'Jane',
  } } }] })[0], { id: 'j1', username: 'jane', fullName: 'Jane' });
  assert.deepEqual(membersFromImport('kanboard', { tasks: [{
    owner_id: 7, owner_username: 'kai', owner_name: 'Kai',
  }] })[0], { id: '7', username: 'kai', fullName: 'Kai' });
  assert.deepEqual(membersFromImport('github', {}), []);
  assert.deepEqual(membersFromImport('trello', { members: [{
    id: '__proto__', username: 'unsafe',
  }] }), [], 'prototype-polluting mapping keys are never staged');
  for (const mapper of ['trello', 'wekan', 'csv', 'jira', 'kanboard']) {
    assert.match(read(`client/components/import/${mapper}MembersMapper.js`),
      /membersFromImport/);
  }
});

test('draft is sanitized, bounded, session-bound and consumed once', () => {
  const imports = read('server/lib/legacyHtml4Imports.js');
  const sessions = read('server/lib/legacyHtml4Session.js');
  assert.match(imports, /secureTransfer\(document/);
  assert.match(imports, /membersFromImport\(source, pruned\)/);
  assert.match(imports, /crypto\.randomBytes\(16\)/);
  assert.match(sessions, /storeLegacyHtml4ImportDraft/);
  assert.match(sessions, /_id: session\._id, userId: session\.userId, counter: session\.counter/);
  assert.match(sessions, /'importDraft\.id': draftId/);
  assert.match(sessions, /\$unset: \{ importDraft: '' \}/);
  assert.match(sessions, /returnDocument: 'before'/);
});

test('final mapping accepts only staged positions and existing exact usernames', () => {
  const imports = read('server/lib/legacyHtml4Imports.js');
  const middleware = read('server/legacyHtml4.js');
  assert.match(middleware, /consumeLegacyHtml4ImportDraft\(session, requestFields\.importDraftId\)/);
  assert.match(middleware, /tripCanary\('legacy-html4\.import-draft'/);
  assert.match(middleware, /missing, foreign or replayed HTML4 import draft/);
  assert.match(middleware, /draft\?\.members\?\.map\(\(member, index\)/);
  assert.match(imports, /Meteor\.users\.find\(\{ username: \{ \$in: unique \} \}/);
  assert.match(imports, /unique\.some\(username => !byUsername\.has\(username\)\)/);
  assert.match(imports, /const membersMapping = Object\.create\(null\)/);
  assert.match(imports, /membersMapping\[member\.id\] = byUsername\.get\(username\)/);
});

test('HTML4 mapping form has labelled native controls and two explicit outcomes', () => {
  const pages = read('server/lib/legacyHtml4Pages.js');
  const renderer = read('imports/lib/legacyHtml4.js');
  assert.match(pages, /legend: tr\(translate, 'import-map-members'/);
  assert.match(pages, /name: `memberMap\$\{index\}`/);
  assert.match(pages, /value: 'finish-board-import'/);
  assert.match(pages, /value: 'finish-board-import-without-mapping'/);
  assert.match(renderer, /<label for="\$\{escapeHtml\(id\)\}">/);
  assert.match(renderer, /cell\.submitActions\.map/);
});

console.log(`\n${passed} tests passed`);
