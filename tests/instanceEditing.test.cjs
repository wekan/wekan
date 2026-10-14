'use strict';

// #4575: a board every signed-in user may edit. Only when Admin Panel allows
// it, only on an open board ('instance' or 'public') whose admin turned it on;
// a non-member then may write, comment and move like a Normal member - never
// manage the board - and their first edit makes them one. A member keeps their
// own role, a removed member stays removed, and background automation (rules,
// webhooks, inbound email, list sync) is never given a non-member's rights.
// Run: node tests/instanceEditing.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const caps = require('../models/lib/boardRoleCapabilities');

const board = over => ({ permission: 'instance', allowsInstanceEditing: true, members: [{ userId: 'm', isActive: true, isReadOnly: true }], ...over });

test('a non-member edits like a Normal member, and only then', () => {
  caps.setInstanceEditingLookup(() => true);
  try {
    for (const cap of ['write', 'comment', 'moveCard']) assert.equal(caps.memberCan(board(), 'stranger', cap), true, cap);
    assert.equal(caps.memberCan(board(), 'stranger', 'manageBoard'), false, 'never the board itself');
    assert.equal(caps.memberCan(board({ permission: 'public' }), 'stranger', 'write'), true);
    // Negative, each condition alone:
    assert.equal(caps.memberCan(board({ permission: 'private' }), 'stranger', 'write'), false, 'a private board');
    assert.equal(caps.memberCan(board({ allowsInstanceEditing: false }), 'stranger', 'write'), false, 'the board did not turn it on');
    assert.equal(caps.memberCan(board({ archived: true }), 'stranger', 'write'), false, 'an archived board');
    assert.equal(caps.memberCan(board(), null, 'write'), false, 'not signed in');
    assert.equal(caps.memberCan(board().members, 'stranger', 'write'), false, 'given only the members: no board settings, no grant');
    assert.equal(caps.memberCan(board(), 'm', 'write'), false, 'a member keeps their own role (read-only here)');
    assert.equal(caps.memberCan(board({ members: [{ userId: 'gone', isActive: false }] }), 'gone', 'write'), false,
      'a member a board admin removed stays removed');
  } finally {
    caps.setInstanceEditingLookup(null);
  }
  assert.equal(caps.memberCan(board(), 'stranger', 'write'), false, 'Admin Panel did not allow it');
});

test('interactive checks pass the board; background automation passes only members', () => {
  for (const [file, re] of [
    ['server/lib/utils.js', /memberCan\(board, userId, 'write'\)/],
    ['server/lib/utils.js', /memberCan\(board, userId, 'comment'\)/],
    ['client/lib/utils.js', /memberCan\(board, userId, capability\)/],
    ['models/lib/boardMutationGuard.js', /memberCan\(board, userId, 'write'\)/],
  ]) assert.match(read(file), re, file);
  for (const file of ['server/notifications/storedRulePlans.js', 'server/notifications/storedWebhooks.js', 'server/lib/inboundEmailUserMatch.js',
    'server/lib/listSyncApplication.js', 'server/lib/syncWebhookAccess.js', 'models/importZip.js']) {
    assert.doesNotMatch(read(file), /memberCan\(board, /, `${file}: automation never gets a non-member's rights`);
  }
});

test('the first edit joins; Admin Panel and the board each have their switch, off by default', () => {
  const join = read('server/instanceEditing.js');
  assert.match(join, /if \(!board \|\| !instanceEditable\(board\)\) return;/);
  assert.match(join, /await board\.addMember\(userId\);/);
  assert.match(read('server/models/collectionBootstrap.js'), /\{ _id: 'tableVisibilityMode-allowInstanceEditing' \},\n\s+\{ \$setOnInsert: \{ booleanValue: false/);
  assert.match(read('client/components/settings/settingBody.jade'), /#accounts-allowInstanceEditing/);
  assert.match(read('client/components/boards/boardHeader.jade'), /js-toggle-instance-editing/);
  assert.match(read('models/boards.js'), /allowsInstanceEditing: \{/);
});
