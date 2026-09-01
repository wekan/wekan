#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const {
  PERSONAL_INBOX_TITLE,
  personalInboxResourceIds,
  normalizeCaptureUrl,
  isOwnedPersonalInbox,
  isPersonalInboxCard,
} = require('../models/lib/personalInbox');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('resources are deterministic and hidden as a helper board', () => {
  assert.deepEqual(personalInboxResourceIds('owner-1'), {
    boardId: 'personal-inbox-owner-1',
    listId: 'personal-inbox-list-owner-1',
    swimlaneId: 'personal-inbox-swimlane-owner-1',
  });
  assert.match(PERSONAL_INBOX_TITLE, /^\^.*\^$/);
});

test('capture URLs accept only credential-free http(s)', () => {
  assert.equal(normalizeCaptureUrl(' https://trello.com/c/example '), 'https://trello.com/c/example');
  assert.equal(normalizeCaptureUrl('http://example.test/a?q=1'), 'http://example.test/a?q=1');
  assert.equal(normalizeCaptureUrl(''), '');
  for (const unsafe of [
    'javascript:alert(1)',
    'file:///etc/passwd',
    'https://name:secret@example.test/',
    'not a url',
  ]) {
    assert.equal(normalizeCaptureUrl(unsafe), null, unsafe);
  }
});

test('negative: a different user never owns or reads another Inbox card', () => {
  const board = {
    _id: 'inbox-a',
    personalInboxOwnerId: 'owner-a',
    permission: 'private',
    members: [{ userId: 'owner-a', isActive: true }],
  };
  const card = { _id: 'card-a', boardId: 'inbox-a' };
  assert.equal(isOwnedPersonalInbox(board, 'owner-a'), true);
  assert.equal(isOwnedPersonalInbox(board, 'stranger'), false);
  assert.equal(isPersonalInboxCard(card, board, 'owner-a'), true);
  assert.equal(isPersonalInboxCard(card, board, 'stranger'), false);
  assert.equal(
    isOwnedPersonalInbox({ ...board, permission: 'public' }, 'owner-a'),
    false,
  );
});

test('server methods are user-derived and destination-write guarded', () => {
  const server = read('server/personalInbox.js');
  const cardPermissions = read('server/permissions/cards.js');
  const boardPermissions = read('server/permissions/boards.js');
  assert.match(server, /Meteor\.publish\('personalInbox', async function\(\)/);
  assert.match(server, /ownedInboxBoard\(this\.userId\)/);
  assert.doesNotMatch(server, /Meteor\.publish\('personalInbox', async function\(userId/);
  assert.match(server, /isPersonalInboxCard\(card, inboxBoard, this\.userId\)/);
  assert.match(server, /allowIsBoardMemberWithWriteAccess\(this\.userId, destinationBoard\)/);
  assert.match(server, /destinationListId[\s\S]*boardId: destinationBoardId/);
  assert.match(server, /Attachments\.collection\.updateAsync/);
  assert.match(cardPermissions, /touchesCaptureProvenance\(fieldNames\)/);
  assert.match(cardPermissions, /CAPTURE_PROVENANCE_FIELDS\.some/);
  assert.match(boardPermissions, /doc && doc\.personalInboxOwnerId/);
});

test('provenance schema and UI survive the move path', () => {
  const cards = read('models/cards.js');
  const server = read('server/personalInbox.js');
  const jade = read('client/components/main/personalInbox.jade');
  const cardDetails = read('client/components/cards/cardDetails.jade');
  for (const field of [
    'captureSourceType',
    'captureSourceUrl',
    'capturedAt',
    'capturedBy',
  ]) {
    assert.match(cards, new RegExp(`${field}:`));
    assert.match(server, new RegExp(`${field}`));
  }
  assert.doesNotMatch(server, /\$unset\s*:\s*\{[^}]*captureSource/s);
  assert.match(jade, /card\.captureSourceUrl/);
  assert.match(jade, /card\.capturedAt/);
  assert.match(cardDetails, /if captureSourceType/);
  assert.match(cardDetails, /href=captureSourceUrl/);
  assert.match(cardDetails, /captureDate/);
});

test('quick capture and both move affordances are product UI', () => {
  const jade = read('client/components/main/personalInbox.jade');
  const client = read('client/components/main/personalInbox.js');
  const css = read('client/components/main/personalInbox.css');
  const router = read('config/router.js');
  assert.match(router, /FlowRouter\.route\('\/inbox'/);
  assert.match(jade, /js-personal-inbox-title/);
  assert.match(jade, /js-personal-inbox-source-url/);
  assert.match(jade, /js-personal-inbox-description/);
  assert.match(jade, /js-personal-inbox-attachment/);
  assert.match(jade, /draggable="true"/);
  assert.match(client, /'drop \.js-personal-inbox-drop-target'/);
  assert.match(client, /Meteor\.callAsync\('personalInbox\.move'/);
  assert.match(css, /#content > \.personal-inbox-page\.wrapper[\s\S]*height: auto;/);
  assert.match(css, /#content > \.personal-inbox-page\.wrapper[\s\S]*overflow: visible;/);
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  not ok - ${name}`);
    console.error(error.stack || error);
  }
}

console.log(`\npersonalInbox: ${tests.length - failed}/${tests.length} passed`);
if (failed) process.exitCode = 1;
