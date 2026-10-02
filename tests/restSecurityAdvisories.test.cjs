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
  "WebApp.handlers.put(\n  '/api/boards/:boardId/cards/:cardId/comments/:commentId'",
);
assert.match(commentCreate, /allowIsBoardMemberCommentOnly/);
assert.doesNotMatch(commentCreate, /Authentication\.checkBoardAccess/);

// The comment EDIT route (added after CommentBleed, GHSA-pqr4-rxgp-hv2m): it
// requires board membership AND runs the same author-or-admin object check
// restCommentDeleteAcl.test.cjs pins for DELETE - membership alone is not
// enough to edit somebody else's comment either.
const commentEdit = route(
  comments,
  "WebApp.handlers.put(\n  '/api/boards/:boardId/cards/:cardId/comments/:commentId'",
  "WebApp.handlers.delete(\n  '/api/boards/:boardId/cards/:cardId/comments/:commentId'",
);
assert.match(commentEdit, /Authentication\.checkBoardAccess/);
assert.match(commentEdit, /assertCanMutateComment/);

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
// c3caf87a1 replaced Accounts._insertLoginToken with insertActiveLoginToken
// (server/lib/activeUser.js), which refuses to mint a token for a disabled
// account in the same update that pushes it. The audit-first order is what
// this guard is about, so it now looks for the new call - and both needles
// must be FOUND, because a missing one (indexOf -1) would otherwise make the
// ordering check pass or fail for the wrong reason.
const auditAt = tokenCreate.indexOf('ImpersonatedUsers.insertAsync');
const tokenAt = tokenCreate.indexOf(
  "require('/server/lib/activeUser').insertActiveLoginToken(",
);
assert.ok(auditAt >= 0, 'the impersonation audit record is written');
assert.ok(tokenAt >= 0, 'the impersonation token goes through insertActiveLoginToken');
assert.ok(
  auditAt < tokenAt,
  'the audit record must be written before the impersonation token',
);
// Negative: no raw insert that would skip the disabled-account check.
assert.doesNotMatch(tokenCreate, /Accounts\._insertLoginToken\(/);

for (const source of [boards, users]) {
  assert.doesNotMatch(source, /sendJsonResult\(res, \{ code: 200, data: error \}\)/);
  assert.doesNotMatch(source, /data: \{ error: error\.(?:reason|message)/);
}

console.log('  ok - REST security advisory authorization and response guards');

// OwnerBleed, DDP sibling (2026-10-02): a client board insert could carry its
// own members list, naming somebody else as admin. Refused, and recorded.
{
  const perms = read('server/permissions/boards.js');
  const deny = perms.slice(perms.indexOf('Boards.deny({'), perms.indexOf('Boards.allow({'));
  assert.match(deny, /async insert\(userId, doc\) \{[\s\S]*?doc\.members\.some\(member => !member \|\| member\.userId !== userId\)[\s\S]*?key: 'authz\.board-owner'[\s\S]*?return true;/);
  assert.match(read('models/lib/securityCategories.js'), /'authz\.board-owner':\s*\{[^}]*bleed: 'OwnerBleed'/);
  console.log('  ok - OwnerBleed DDP sibling: client board inserts name only their creator');
}

// ErrorBleed, siblings (2026-10-02): lists, cards counts, org, team, settings,
// attachment storage settings, rules and dependencies answered a refused
// request with HTTP 200 - or the raw error object - instead of the shared
// publicErrorData(). Now nowhere in the server does.
{
  const walk = dir => fs.readdirSync(path.join(__dirname, '..', dir), { withFileTypes: true }).flatMap(e => {
    if (e.name === 'tests' || e.name.startsWith('_build') || e.name === 'node_modules') return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(rel) : (rel.endsWith('.js') ? [rel] : []);
  });
  const offenders = ['server', 'models'].flatMap(walk)
    .filter(file => /sendJsonResult\(res, \{[^}]*?\bdata:\s*(error|err|e)\b/.test(read(file)));
  assert.deepStrictEqual(offenders, [], 'a REST error answers through publicErrorData()');
  console.log('  ok - ErrorBleed siblings: no REST handler answers with a raw error');
}

// Authentication helpers fail closed (2026-10-02): `admin === undefined` let a
// null from the cache pass as an admin, and `userId === undefined` let a null
// user id through checkUserId.
{
  const auth = read('server/authentication.js');
  assert.doesNotMatch(auth, /admin === undefined/);
  assert.match(auth, /async checkUserId\(userId\) \{\s*if \(!userId\) \{/);
  assert.match(auth, /checkLoggedIn\(userId\) \{\s*if \(!userId\) \{/);
  assert.doesNotMatch(auth, /userId === undefined/);
  console.log('  ok - authentication helpers refuse a null admin or user id');
}
