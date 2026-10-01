'use strict';
// #6732: dependencies - who may see and edit which layer, and how imports
// combine (models/lib/dependencyAccess.js), plus guards that the app uses it.
// Run: node tests/dependencyAccess.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const A = require('../models/lib/dependencyAccess');
const { normalizeDependency } = (() => {
  // models/metadata/dependencies.js is an ES module; load its pure helpers.
  const src = fs.readFileSync(path.join(__dirname, '../models/metadata/dependencies.js'), 'utf8')
    .replace(/^export /gm, '');
  return new Function(`${src}; return { normalizeDependency };`)();
})();
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const member = (userId, role = {}) => ({ userId, isActive: true, ...role });
const board = (members, extra = {}) => ({ _id: 'b', permission: 'private', members, ...extra });
const card = (id, extra = {}) => ({ _id: id, boardId: 'b', archived: false, assignees: [], ...extra });

test('roles that may edit OR move cards may edit Board Dependencies', () => {
  const roles = [
    [{ isAdmin: true }, true], [{}, true], [{ isWorker: true }, true], [{ isNormalAssignedOnly: true }, true],
    [{ isCommentOnly: true }, false], [{ isCommentAssignedOnly: true }, false], [{ isNoComments: true }, true],
    [{ isReadOnly: true }, false], [{ isReadAssignedOnly: true }, false],
  ];
  for (const [role, allowed] of roles) {
    assert.equal(A.canEditBoardDependencies(board([member('u', role)]), 'u'), allowed, JSON.stringify(role));
  }
  assert.equal(A.canEditBoardDependencies(board([member('u', { isActive: false })]), 'u'), false, 'an inactive member (negative)');
  assert.equal(A.canEditBoardDependencies(board([]), 'u'), false, 'a non-member (negative)');
  assert.equal(A.canEditBoardDependencies(board([], { permission: 'public' }), 'u'), false,
    'viewing a public board is not editing it (negative)');
});

test('anyone who can view a board may see its dependencies; assigned-only members see their cards', () => {
  assert.equal(A.canViewBoard(board([], { permission: 'public' }), 'stranger'), true, 'the reported public-board case');
  assert.equal(A.canViewBoard(board([member('u', { isReadOnly: true })]), 'u'), true);
  assert.equal(A.canViewBoard(board([]), 'stranger'), false, 'a private board (negative)');
  assert.equal(A.canViewBoard(board([], { permission: 'public', archived: true }), 'u'), false);
  const assigned = board([member('u', { isNormalAssignedOnly: true })]);
  assert.equal(A.canSeeCard(assigned, 'u', card('mine', { assignees: ['u'] })), true);
  assert.equal(A.canSeeCard(assigned, 'u', card('other')), false, 'not assigned (negative)');
  assert.equal(A.canEditCardDependency(assigned, 'u', card('mine', { assignees: ['u'] }), card('other')), false,
    'both ends must be cards they can see (negative)');
  assert.equal(A.canEditCardDependency(assigned, 'u', card('mine', { assignees: ['u'] }), card('too', { assignees: ['u'] })), true);
  assert.equal(A.canSeeCard(board([member('u')]), 'u', card('x', { boardId: 'other' })), false, 'another board (negative)');
  assert.equal(A.canSeeCard(board([member('u')]), 'u', card('x', { archived: true })), false, 'archived (negative)');
});

test('My Dependencies are normalized: valid, unique, never a card to itself', () => {
  const list = A.normalizeMyDependencies([
    { boardId: 'b', cardId: 'a', targetCardId: 'c', type: 'blocks' },
    { boardId: 'b', cardId: 'a', targetCardId: 'c', type: 'fixes' },
    { boardId: 'b', cardId: 'a', targetCardId: 'a' },
    { boardId: 'b', cardId: '', targetCardId: 'c' },
    null, 'junk',
    { boardId: 'b', cardId: 'c', targetCardId: 'a', extra: 'dropped' },
  ], normalizeDependency);
  assert.deepEqual(list.map(row => [row.cardId, row.targetCardId, row.type]), [['a', 'c', 'blocks'], ['c', 'a', 'related-to']]);
  assert.ok(list.every(row => Object.keys(row).sort().join(',') === 'boardId,cardId,color,icon,targetCardId,type'));
  assert.equal(A.MY_DEPENDENCIES_MAX, 5000);
});

test('an import combines: it adds only what is missing and keeps what is there', () => {
  const key = row => A.lineKey(row.boardId, row.cardId, row.targetCardId);
  const existing = [{ boardId: 'b', cardId: 'a', targetCardId: 'c', type: 'blocks' }];
  const incoming = [
    { boardId: 'b', cardId: 'a', targetCardId: 'c', type: 'fixes' },
    { boardId: 'b', cardId: 'c', targetCardId: 'a', type: 'fixes' },
    { boardId: 'b', cardId: 'c', targetCardId: 'a', type: 'blocks' },
  ];
  const { added, skipped } = A.mergeDependencyLines(existing, incoming, key);
  assert.deepEqual(added.map(row => [row.cardId, row.targetCardId, row.type]), [['c', 'a', 'fixes']]);
  assert.equal(skipped, 2, 'the line already there, and a repeat within the file');
  assert.equal(existing[0].type, 'blocks', 'an existing line is never overwritten (negative)');
});

test('the app reads the rule, and the board-wide toggle is gone', () => {
  const header = read('client/components/boards/boardHeader.jade');
  assert.doesNotMatch(header, /js-toggle-dependencies/);
  assert.doesNotMatch(read('client/components/boards/boardHeader.js'), /setShowDependencies/);
  assert.doesNotMatch(read('models/boards.js'), /setShowDependencies/);
  assert.match(read('client/components/boards/boardBody.jade'), /if showAnyDependencies\s+\+dependencyOverlay/);
  for (const file of ['client', 'models', 'server']) {
    // Nothing reads the old shared board flag to decide what anyone sees.
    const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
      ? (['tests', 'node_modules'].includes(entry.name) ? [] : walk(path.join(dir, entry.name))) : [path.join(dir, entry.name)]);
    for (const f of walk(path.join(root, file)).filter(f => /\.(js|jade)$/.test(f))) {
      const src = fs.readFileSync(f, 'utf8');
      assert.doesNotMatch(src, /board\.showDependencies|currentBoard\.showDependencies/, path.relative(root, f));
    }
  }
  // Member Settings: My, Board, Import, Export - at the very top.
  const menu = read('client/components/users/dependencyMenu.jade');
  const order = ['js-toggle-my-dependencies', 'js-toggle-board-dependencies', 'js-import-member-dependencies', 'js-export-member-dependencies']
    .map(cls => menu.indexOf(cls));
  assert.ok(order.every((at, i) => at > 0 && (i === 0 || at > order[i - 1])), 'in that order');
  const userHeader = read('client/components/users/userHeader.jade');
  const popup = userHeader.slice(userHeader.indexOf('template(name="memberMenuPopup")'));
  assert.ok(popup.indexOf('+memberDependencyMenuItems') < popup.indexOf('js-my-cards'), 'above everything else');
});

test('every write goes through the rule, and the client cannot write My Dependencies (negative)', () => {
  const server = read('server/models/dependencies.js');
  for (const method of ['setDependencyVisibility', 'setBoardDependency', 'removeBoardDependency', 'importBoardDependencies',
    'setMyDependency', 'removeMyDependency', 'importMyDependencies']) {
    assert.match(server, new RegExp(`async ${method}\\(`), method);
  }
  assert.doesNotMatch(server, /checkBoardWriteAccess/, 'the REST routes use the dependency rule');
  assert.equal((server.match(/await checkRestDependencyAccess\(/g) || []).length, 3, 'POST, PUT and DELETE');
  const importer = server.slice(server.indexOf('async importBoardDependencies'), server.indexOf('async setMyDependency'));
  assert.match(importer, /if \(present\) \{ skipped \+= 1; continue; \}/);
  assert.doesNotMatch(importer, /'cardDependencies\.\$\./,
    'an import never overwrites an existing line');
  const cards = read('models/cards.js');
  const helpers = cards.slice(cards.indexOf('  addDependency(targetCardId'), cards.indexOf('  getReceived() {'));
  assert.match(helpers, /Meteor\.callAsync\('setBoardDependency'/);
  assert.match(helpers, /Meteor\.callAsync\('removeBoardDependency'/);
  assert.doesNotMatch(helpers, /Cards\.updateAsync/, 'no direct card write left for dependencies');
  const users = read('models/users.js');
  const forbidden = users.slice(users.indexOf('USER_UPDATE_FORBIDDEN_PREFIXES'), users.indexOf('];', users.indexOf('USER_UPDATE_FORBIDDEN_PREFIXES')));
  assert.match(forbidden, /'profile\.myDependencies'/);
  for (const field of ['profile.showBoardDependencies', 'profile.showMyDependencies', 'profile.myDependencies']) {
    assert.ok(users.includes(`'${field}': {`), field);
  }
  // The docs describe the design.
  const doc = read('docs/Features/Editor/RedStrings/Board-And-My-Dependencies.md');
  for (const phrase of ['off by default', 'edit cards or move cards', 'An import combines; it never replaces']) {
    assert.ok(doc.includes(phrase), phrase);
  }
});
