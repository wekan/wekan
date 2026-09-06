'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('comment creation binds the card, board, role and assigned scope', () => {
  const source = read('server/lib/accessibleCommentOperations.js');
  assert.match(source, /assignedOnlyCardScope\(board, userId\)/);
  assert.match(source, /_id: String\(cardId \|\| ''\), boardId: board\._id, deletedAt: null/);
  assert.match(source, /allowIsBoardMemberCommentOnly\(userId, board\)/);
  assert.match(source, /MAX_COMMENT_LENGTH = 1024 \* 1024/);
  assert.match(source, /CardComments\.findOneAsync\(\{ _id: parentId, boardId, cardId \}\)/);
  assert.match(source, /CardComments\.insertAsync\(\{ boardId, cardId, text, userId, parentId \}\)/);
});

test('comment editing and deletion bind object ownership before mutation', () => {
  const source = read('server/lib/accessibleCommentOperations.js');
  assert.match(source, /_id: String\(input\?\.commentId \|\| ''\), boardId, cardId/);
  assert.match(source, /await assertCanMutateComment\(userId, comment\)/);
  assert.match(source, /tripCanary\('comment\.foreign-delete'/);
  assert.match(source, /CardComments\.updateAsync\(\{ _id: comment\._id, boardId: comment\.boardId,\s*cardId: comment\.cardId \}/);
  assert.match(source, /CardComments\.removeAsync\(\{\s*_id: comment\._id, boardId: comment\.boardId, cardId: comment\.cardId/);
});

test('HTML5 and HTML4 call the same acknowledged comment methods', () => {
  const methods = read('server/models/cardComments.js');
  const client = read('client/components/activities/comments.js');
  const legacy = read('server/legacyHtml4.js');
  for (const operation of ['createAccessibleComment', 'updateAccessibleComment',
    'removeAccessibleComment']) {
    assert.match(methods, new RegExp(`async ${operation}\\(input\\)`));
    assert.match(client, new RegExp(`Meteor\\.callAsync\\('${operation}'`));
    assert.match(legacy, new RegExp(`${operation}\\(session\\.userId`));
  }
  assert.doesNotMatch(client, /^\s*(?:await\s+)?CardComments\.(?:insert|update|remove)\(/m);
});
