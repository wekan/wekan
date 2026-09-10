'use strict';

// #1037 ("Roadmap for REST-API features"): the REST API had full CRUD for most
// resources, but two had a gap where GET/POST/DELETE existed and PUT did not -
// so editing one meant deleting and re-creating it (losing its id, timestamps
// and, for a checklist, its items):
//
//   PUT /api/boards/:boardId/cards/:cardId/checklists/:checklistId
//     -> rename a checklist (title only)
//   PUT /api/boards/:boardId/cards/:cardId/comments/:commentId
//     -> edit a comment's text, reusing the same
//        assertCanMutateComment/canary rule the DELETE handler already applies
//
// These are source-pattern tests, matching how the rest of this REST surface
// is pinned in tests/restApiIdorBatch.test.cjs: no running server is needed,
// so the checks are on the registered route, its auth check, its lookup, and
// its response shape.
//
// Run: node tests/restApiEditGaps.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const checklists = read('server/models/checklists.js');
const cardComments = read('server/models/cardComments.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('restApiEditGaps:');

// Body of the handler registered for `method` at `route`, up to the next
// WebApp.handlers registration (mirrors tests/restApiIdorBatch.test.cjs).
function handler(source, method, route) {
  const at = source.indexOf(`WebApp.handlers.${method}(\n  '${route}'`);
  const flat = at === -1 ? source.indexOf(`WebApp.handlers.${method}('${route}'`) : at;
  assert.ok(flat !== -1, `handler not found: ${method} ${route}`);
  const next = source.indexOf('WebApp.handlers.', flat + 20);
  return source.slice(flat, next === -1 ? source.length : next);
}

// ── PUT checklist (rename) ─────────────────────────────────────────────────
test('a PUT route exists for a single checklist', () => {
  const body = handler(checklists, 'put', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId');
  assert.ok(body.length > 0);
});

test('it requires board write access, like the DELETE next to it', () => {
  const body = handler(checklists, 'put', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId');
  assert.ok(/checkBoardWriteAccess\(req\.userId, paramBoardId\)/.test(body));
});

test('it 404s when the card is not on the authorised board', () => {
  const body = handler(checklists, 'put', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId');
  assert.ok(/getCard\(\{\s*_id: paramCardId,\s*boardId: paramBoardId,?\s*\}\)/.test(body));
  assert.ok(/code: 404/.test(body));
});

test('it 404s when the checklist is not on that card (not a bare _id lookup)', () => {
  const body = handler(checklists, 'put', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId');
  assert.ok(/getChecklist\(\{\s*_id: paramChecklistId,\s*cardId: paramCardId,?\s*\}\)/.test(body));
});

test('it rejects a missing/blank title with 400 instead of storing it (negative)', () => {
  const body = handler(checklists, 'put', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId');
  assert.ok(/req\.body\.title\.trim\(\) === ''/.test(body));
  assert.ok(/code: 400/.test(body));
});

test('only title is written - the update only sets what was validated (negative)', () => {
  const body = handler(checklists, 'put', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId');
  assert.ok(/\$set: \{ title: req\.body\.title \}/.test(body));
  assert.ok(!/hideCheckedChecklistItems/.test(body), 'no other field is accepted here (negative)');
});

test('it answers the checklist id, not the whole document', () => {
  const body = handler(checklists, 'put', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId');
  assert.ok(/data: \{\s*_id: paramChecklistId,?\s*\}/.test(body));
});

// ── PUT comment (edit) ──────────────────────────────────────────────────────
test('a PUT route exists for a single comment', () => {
  const body = handler(cardComments, 'put', '/api/boards/:boardId/cards/:cardId/comments/:commentId');
  assert.ok(body.length > 0);
});

test('it validates the comment body the same way POST does', () => {
  const put = handler(cardComments, 'put', '/api/boards/:boardId/cards/:cardId/comments/:commentId');
  const post = handler(cardComments, 'post', '/api/boards/:boardId/cards/:cardId/comments');
  assert.ok(/validateCommentBody\(req\.body\)/.test(put));
  assert.ok(/validateCommentBody\(req\.body\)/.test(post));
});

test('it 404s on a comment that is not on the authorised card/board (not a bare _id lookup)', () => {
  const body = handler(cardComments, 'put', '/api/boards/:boardId/cards/:cardId/comments/:commentId');
  assert.ok(/getCardComment\(\{\s*_id: paramCommentId,\s*cardId: paramCardId,\s*boardId: paramBoardId,?\s*\}\)/.test(body));
});

test('editing somebody else\'s comment goes through assertCanMutateComment, exactly like DELETE', () => {
  const put = handler(cardComments, 'put', '/api/boards/:boardId/cards/:cardId/comments/:commentId');
  const del = handler(cardComments, 'delete', '/api/boards/:boardId/cards/:cardId/comments/:commentId');
  for (const body of [put, del]) {
    assert.ok(/if \(comment\.userId && comment\.userId !== req\.userId\) \{/.test(body));
    assert.ok(/await assertCanMutateComment\(req\.userId, comment\);/.test(body));
  }
});

test('a foreign edit trips its own canary, distinct from the foreign-delete one', () => {
  const put = handler(cardComments, 'put', '/api/boards/:boardId/cards/:cardId/comments/:commentId');
  const del = handler(cardComments, 'delete', '/api/boards/:boardId/cards/:cardId/comments/:commentId');
  assert.ok(/tripCanary\('comment\.foreign-edit', \{ req, userId: req\.userId \}\)/.test(put));
  assert.ok(/tripCanary\('comment\.foreign-delete', \{ req, userId: req\.userId \}\)/.test(del));
});

test('it updates the text field only, via .direct (no re-trigger of the collection hook)', () => {
  const body = handler(cardComments, 'put', '/api/boards/:boardId/cards/:cardId/comments/:commentId');
  assert.ok(/CardComments\.direct\.updateAsync\(/.test(body));
  assert.ok(/\$set: \{ text: validation\.comment \}/.test(body));
});

test('it records its own editComment activity (since .direct bypassed the hook)', () => {
  const body = handler(cardComments, 'put', '/api/boards/:boardId/cards/:cardId/comments/:commentId');
  assert.ok(/activityType: 'editComment'/.test(body));
});

console.log(`\nrestApiEditGaps: ${passed} tests passed`);
