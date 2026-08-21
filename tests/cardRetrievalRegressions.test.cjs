'use strict';

// Regressions reported in #6619 and #6620.
// Run: node tests/cardRetrievalRegressions.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const comments = read('server/models/cardComments.js');
const dialog = read('client/lib/dialogWithBoardSwimlaneList.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const getComments = comments.slice(
  comments.indexOf("WebApp.handlers.get('/api/boards/:boardId/cards/:cardId/comments'"),
  comments.indexOf("WebApp.handlers.get(\n  '/api/boards/:boardId/cards/:cardId/comments/:commentId'"),
);

console.log('cardRetrievalRegressions:');

test('REST comments validate that the card belongs to the requested board', () => {
  assert.match(getComments,
    /getCard\(\{\s*_id: paramCardId,\s*boardId: paramBoardId,\s*\}\)/);
  assert.match(getComments, /if \(!card\) \{[\s\S]*code: 404[\s\S]*return;/);
});

test('REST comments follow the authoritative cardId, including legacy rows', () => {
  assert.match(getComments, /getCardComments\(\{\s*cardId: paramCardId,\s*\}\)/);
  const query = getComments.match(/getCardComments\(\{([\s\S]*?)\}\)/)[1];
  assert.ok(!query.includes('boardId'), 'stale denormalized boardId is not a filter');
});

test('negative: access to one board cannot expose a card from another board', () => {
  const access = getComments.indexOf('checkBoardAccess(req.userId, paramBoardId)');
  const card = getComments.indexOf('getCard({');
  const commentsQuery = getComments.indexOf('getCardComments({');
  assert.ok(access > -1 && access < card && card < commentsQuery,
    'membership and card ownership are checked before comments are queried');
});

test('global lists are offered for every selected swimlane', () => {
  assert.match(dialog,
    /selector\.swimlaneId = \{ \$in: \[swimlaneId, null, ''\] \};/);
});

test('negative: another swimlane owned list is not offered', () => {
  assert.ok(!/selector\.swimlaneId = swimlaneId;/.test(dialog));
  assert.ok(!/getDefaultSwimline/.test(
    dialog.slice(dialog.indexOf('getListsForBoardSwimlane'),
      dialog.indexOf('isDialogOptionBoardId'))),
  'global-list behavior is not conditional on the default swimlane');
});

console.log(`\ncardRetrievalRegressions: ${passed} tests passed`);
