'use strict';

// #4527: per-list exceptions on top of the role matrix (decided 2026-10-14).
// A board admin may say, for one list, that a role may - or may not - edit or
// comment there. The issue's own example is the first test: a read-only board
// with one list where everybody signed in may add and comment.
// Run: node tests/listPermissions.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { listCan, exceptionFor, cleanExceptions, roleIn, SIGNED_IN } = require('../models/lib/listPermissions');

const board = over => ({
  _id: 'b',
  permission: 'public',
  members: [
    { userId: 'admin', isActive: true, isAdmin: true },
    { userId: 'normal', isActive: true },
    { userId: 'reader', isActive: true, isReadOnly: true },
    { userId: 'gone', isActive: false },
  ],
  ...over,
});
const list = roleExceptions => ({ _id: 'l', boardId: 'b', roleExceptions });

test('the issue: a read-only board with one list everybody signed in may use', () => {
  const ideas = list({ 'read-only': { write: true, comment: true }, [SIGNED_IN]: { write: true, comment: true } });
  for (const cap of ['write', 'comment', 'moveCard']) {
    assert.equal(listCan(board(), ideas, 'reader', cap), true, `reader ${cap}`);
    assert.equal(listCan(board(), ideas, 'stranger', cap), true, `signed-in ${cap}`);
  }
  // Every other list stays read-only for them.
  assert.equal(listCan(board(), list(undefined), 'reader', 'write'), false);
  assert.equal(listCan(board(), list(undefined), 'stranger', 'write'), false);
});

test('a list may refuse what the board allows (negative)', () => {
  const approved = list({ normal: { write: false, comment: false } });
  assert.equal(listCan(board(), approved, 'normal', 'write'), false);
  assert.equal(listCan(board(), approved, 'normal', 'comment'), false);
  assert.equal(listCan(board(), approved, 'normal', 'moveCard'), false, 'a move is an edit of the list');
});

test('what an exception never changes (negative)', () => {
  const all = list({ normal: { write: false }, [SIGNED_IN]: { write: true }, 'read-only': { write: true } });
  assert.equal(listCan(board(), all, 'admin', 'write'), true, 'a board admin is never restricted');
  assert.equal(listCan(board(), all, 'gone', 'write'), false, 'a removed member stays removed');
  assert.equal(listCan(board({ permission: 'private' }), all, 'stranger', 'write'), false, 'signed-in only on an open board');
  assert.equal(listCan(board(), all, null, 'write'), false, 'nobody signed in');
  assert.equal(listCan(board(), all, 'reader', 'manageBoard'), false, 'board settings are not a list capability');
  assert.equal(roleIn(board(), 'gone'), null);
});

test('a capability the list does not mention is the board\'s', () => {
  const commentOnly = list({ 'read-only': { comment: true } });
  assert.equal(exceptionFor(board(), commentOnly, 'reader', 'write'), undefined);
  assert.equal(listCan(board(), commentOnly, 'reader', 'write'), false);
  assert.equal(listCan(board(), commentOnly, 'reader', 'comment'), true);
  assert.equal(listCan(board(), commentOnly, 'normal', 'write'), true);
});

test('saving cleans what was sent: known roles and capabilities, booleans only', () => {
  assert.deepEqual(cleanExceptions({
    normal: { write: false, comment: 'yes', delete: true },
    'board-admin': { write: false },
    'custom:abc_1': { comment: true },
    'signed-in': { write: true },
    '$where': { write: true },
    'Bad Role': { write: true },
    worker: {},
  }), { normal: { write: false }, 'custom:abc_1': { comment: true }, 'signed-in': { write: true } });
  assert.deepEqual(cleanExceptions(null), {});
  assert.deepEqual(cleanExceptions('normal'), {});
});

// --- Every way a card or a comment is written asks the list ----------------

test('the server applies the list to card and comment writes, both ways', () => {
  const rules = read('server/listPermissions.js');
  assert.match(rules, /Cards\.allow\(\{[\s\S]*listException\([\s\S]*=== true/, 'a list grant adds card writes');
  assert.match(rules, /Cards\.deny\(\{[\s\S]*insert[\s\S]*update[\s\S]*remove[\s\S]*=== false/, 'a list refusal takes them away');
  assert.match(rules, /modifier\.\$set\.listId[\s\S]*'moveCard'/, 'a move needs the destination list too');
  assert.match(rules, /CardComments\.allow\(\{[\s\S]*CardComments\.deny\(\{/, 'comments both ways');
  assert.match(rules, /allowIsBoardAdminOrSiteAdmin\(this\.userId, board\)/, 'only a board admin sets them');
  // Methods, checklists, attachments and text notes all go through this one.
  assert.match(read('server/lib/linkedCardPermission.js'),
    /listException\(userId, sourceBoard, card\.listId, 'write'\);\n\s*if \(listRule !== undefined\) return listRule;/);
});

test('a list\'s exceptions are written only by the method (negative)', () => {
  const rules = read('server/listPermissions.js');
  assert.match(rules, /Lists\.deny\(\{[\s\S]*fieldNames\.includes\('roleExceptions'\)[\s\S]*tripCanaryDeny\('list\.role-exceptions-direct'/);
  assert.match(rules, /doc\.roleExceptions === undefined[\s\S]*tripCanaryDeny\('list\.role-exceptions-direct'/, 'nor set on insert');
  // No other server file writes the field.
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== 'tests') walk(rel); continue; }
      if (!/\.js$/.test(entry.name) || rel === path.join('server', 'listPermissions.js')) continue;
      if (/\$set:\s*\{[^}]*roleExceptions/.test(read(rel))) offenders.push(rel);
    }
  };
  walk('server');
  walk('models');
  assert.deepEqual(offenders, []);
});

test('the REST API honours a list\'s refusal on every per-list card route', () => {
  const src = read('server/models/cards.js');
  const writeRoutes = [...src.matchAll(/WebApp\.handlers\.(post|put|delete)\(\s*'(\/api\/boards\/:boardId\/lists\/:listId\/cards[^']*)'/g)];
  assert.ok(writeRoutes.length >= 4, 'the per-list card routes are found');
  for (const match of writeRoutes) {
    const next = src.indexOf('WebApp.handlers.', match.index + 1);
    let body = src.slice(match.index, next < 0 ? undefined : next);
    // A route that hands the request to a shared function is checked there.
    const delegate = /await (\w+)\(req, res\b/.exec(body);
    if (delegate) {
      const start = src.indexOf(`async function ${delegate[1]}(`);
      assert.ok(start >= 0, `${delegate[1]} is defined`);
      body = src.slice(start, src.indexOf('\n}\n', start));
    }
    assert.match(body, /assertListNotRefused\(/, `${match[1]} ${match[2]}`);
  }
  assert.match(read('server/models/cardComments.js'), /canCommentInList\(req\.userId, board, card\.listId\)/, 'comments too');
});

// ListLockBleed (GHSA-4734-8vrg-8j3w): the checklist and checklist-item REST
// routes asked only the board, so a member a list refused still wrote its
// cards' checklists with a token. Not one route at a time: EVERY REST write in
// the tree that names a card must ask the list - or be named here, with why.
test('negative: every REST write that names a card asks the list (ListLockBleed)', () => {
  const unrelated = {
    // A comment's edit and deletion follow the comment's own rule (its author,
    // or a board admin: assertCanMutateComment), on DDP as over REST; a list's
    // comment refusal stops NEW comments, which the POST route asks.
    'PUT /api/boards/:boardId/cards/:cardId/comments/:commentId': 'comment rule',
    'DELETE /api/boards/:boardId/cards/:cardId/comments/:commentId': 'comment rule',
    // Dependency lines have their own board-wide rule (canEditBoardDependencies),
    // the same on DDP (setBoardDependency) as over REST.
    'POST /api/boards/:boardId/cards/:cardId/dependencies': 'dependency rule',
    'PUT /api/boards/:boardId/cards/:cardId/dependencies/:targetId': 'dependency rule',
    'DELETE /api/boards/:boardId/cards/:cardId/dependencies/:targetId': 'dependency rule',
    // A bot runner's report of its own run, written to BotRuns, not the card.
    'POST /api/boards/:boardId/cards/:cardId/bot-runs/:runId': 'bot run report',
  };
  const found = [], missing = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (!['tests', 'node_modules'].includes(entry.name)) walk(rel); continue; }
      if (!/\.js$/.test(entry.name)) continue;
      const src = read(rel);
      for (const m of src.matchAll(/WebApp\.handlers\.(post|put|delete|patch)\(\s*['"`]([^'"`]*:cardId[^'"`]*)['"`]/g)) {
        const route = `${m[1].toUpperCase()} ${m[2]}`;
        found.push(route);
        const next = src.indexOf('WebApp.handlers.', m.index + 1);
        let body = src.slice(m.index, next < 0 ? undefined : next);
        const delegate = /await (\w+)\(req, res\b/.exec(body);
        if (delegate) {
          const start = src.indexOf(`async function ${delegate[1]}(`);
          if (start >= 0) body += src.slice(start, src.indexOf('\n}\n', start));
        }
        if (!/assertListNotRefused\(|canWriteInList\(|canCommentInList\(/.test(body) && !unrelated[route]) missing.push(`${route} (${rel})`);
      }
    }
  };
  walk('server');
  walk('models');
  assert.ok(found.length >= 20, `the REST card write routes are found (${found.length})`);
  for (const route of ['POST /api/boards/:boardId/cards/:cardId/checklists', 'PUT /api/boards/:boardId/cards/:cardId/checklists/:checklistId',
    'DELETE /api/boards/:boardId/cards/:cardId/checklists/:checklistId', 'POST /api/boards/:boardId/cards/:cardId/checklists/:checklistId/items',
    'PUT /api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId',
    'DELETE /api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId']) {
    assert.ok(found.includes(route), `${route} is scanned`);
  }
  assert.deepEqual(missing, []);
  // The exceptions are real routes: a renamed one must be looked at again.
  for (const route of Object.keys(unrelated)) assert.ok(found.includes(route), `${route} still exists`);
});

test('the refusal is recorded in Admin Panel -> Problems, and never breaks the guard (ListLockBleed)', () => {
  const gate = read('server/lib/listPermissionGate.js');
  const fn = gate.slice(gate.indexOf('export async function assertListNotRefused('));
  assert.match(fn, /record\(\{ key: 'authz\.list-locked', action: 'blocked'/);
  assert.match(fn, /catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
  // Recorded only on the refusal: after the early return of an allowed write.
  assert.ok(fn.indexOf("!== false) return;") < fn.indexOf('record('), 'an allowed write records nothing');
  const { categoryFor } = require('../models/lib/securityCategories');
  const cat = categoryFor('authz.list-locked');
  assert.equal(cat.bleed, 'ListLockBleed');
  assert.equal(cat.severity, 'medium', 'recorded, never disables the account');
});

test('the client offers what the list allows', () => {
  const utils = read('client/lib/utils.js');
  assert.match(utils, /canModifyCard\([\s\S]*?return Utils\.currentUserCanInList\('write', card, board\);/);
  assert.match(utils, /listCan\(board, list, Meteor\.userId\(\), capability\)/);
  assert.match(read('client/config/blazeHelpers.js'), /registerHelper\('canComment', \(\) => Utils\.currentUserCanInList\('comment'\)\)/);
  // The popup is offered to board admins only, in the list menu.
  const header = read('client/components/lists/listHeader.jade');
  const adminBlock = header.slice(header.indexOf('if currentUser.isBoardAdmin\n          ul.pop-over-list\n            li\n              a.js-set-wip-limit'));
  assert.match(adminBlock.slice(0, 600), /a\.js-list-permissions/);
  assert.match(read('client/components/lists/listHeader.js'), /'click \.js-list-permissions': Popup\.open\('listPermissions'\)/);
});

test('the canary for a direct write is catalogued (Admin Panel -> Problems)', () => {
  const { canaryFor } = require('../models/lib/canaryTokens');
  assert.equal(canaryFor('list.role-exceptions-direct').known, true);
  assert.match(read('models/lists.js'), /roleExceptions: \{[\s\S]*?blackbox: true/);
});
