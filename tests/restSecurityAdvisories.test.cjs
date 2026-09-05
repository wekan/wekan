'use strict';

// Regression coverage for ChecklistWriteBleed, CommentWriteBleed, RoleBleed,
// OwnerBleed, TokenAuditBleed and ErrorBleed.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const route = (source, start, end) => {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.notStrictEqual(from, -1, `route start not found: ${start}`);
  assert.notStrictEqual(to, -1, `route end not found after: ${start}`);
  return source.slice(from, to);
};

const cards = read('server/models/cards.js');
const checklists = read('server/models/checklists.js');
const items = read('server/models/checklistItems.js');
const comments = read('server/models/cardComments.js');
const boards = read('server/models/boards.js');
const users = read('server/models/users.js');

for (const section of [
  route(cards,
    "WebApp.handlers.post('/api/boards/:boardId/lists/:listId/cards'",
    "WebApp.handlers.post(\n  '/api/boards/:boardId/lists/:listId/cards/bulk'"),
  route(cards,
    "WebApp.handlers.post(\n  '/api/boards/:boardId/lists/:listId/cards/bulk'",
    "WebApp.handlers.get('/api/boards/:boardId/cards_count'"),
]) {
  assert.match(section, /allowIsBoardMemberWithWriteAccess/);
  assert.doesNotMatch(section, /allowIsBoardMemberCommentOnly/);
}

for (const section of [
  route(checklists,
    "WebApp.handlers.post(\n  '/api/boards/:boardId/cards/:cardId/checklists'",
    "WebApp.handlers.delete(\n  '/api/boards/:boardId/cards/:cardId/checklists/:checklistId'"),
  route(checklists,
    "WebApp.handlers.delete(\n  '/api/boards/:boardId/cards/:cardId/checklists/:checklistId'",
    '\n);\n'),
  route(items,
    "WebApp.handlers.post(\n  '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items'",
    "WebApp.handlers.put(\n  '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId'"),
  route(items,
    "WebApp.handlers.put(\n  '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId'",
    "WebApp.handlers.delete(\n  '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId'"),
  route(items,
    "WebApp.handlers.delete(\n  '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId'",
    '\n);\n'),
]) {
  assert.match(section, /await Authentication\.checkBoardWriteAccess/);
  assert.doesNotMatch(section, /Authentication\.checkBoardAccess/);
}

const commentCreate = route(
  comments,
  "WebApp.handlers.post('/api/boards/:boardId/cards/:cardId/comments'",
  "WebApp.handlers.delete(\n  '/api/boards/:boardId/cards/:cardId/comments/:commentId'",
);
assert.match(commentCreate, /allowIsBoardMemberCommentOnly/);
assert.doesNotMatch(commentCreate, /Authentication\.checkBoardAccess/);

const boardCreate = route(
  boards,
  "WebApp.handlers.post('/api/boards'",
  '/**\n * @operation import_board',
);
assert.match(boardCreate, /userId: req\.userId/);
assert.doesNotMatch(boardCreate, /req\.body\.owner/);

const userCreate = route(
  users,
  "WebApp.handlers.post('/api/users/'",
  "WebApp.handlers.delete('/api/users/:userId'",
);
assert.match(userCreate, /const id = await Accounts\.createUser/);
assert.doesNotMatch(userCreate, /code: 200, data: error/);

const tokenCreate = route(
  users,
  "WebApp.handlers.post('/api/createtoken/:userId'",
  "WebApp.handlers.post('/api/deletetoken'",
);
assert.match(tokenCreate, /A reason is required/);
assert.match(tokenCreate, /await ImpersonatedUsers\.insertAsync/);
assert.ok(
  tokenCreate.indexOf('ImpersonatedUsers.insertAsync') <
    tokenCreate.indexOf('Accounts._insertLoginToken'),
  'the audit record must be written before the impersonation token',
);

for (const source of [boards, users]) {
  assert.doesNotMatch(source, /sendJsonResult\(res, \{ code: 200, data: error \}\)/);
  assert.doesNotMatch(source, /data: \{ error: error\.(?:reason|message)/);
}

console.log('  ok - REST security advisory authorization and response guards');
