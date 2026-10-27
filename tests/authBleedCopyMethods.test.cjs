'use strict';

// AuthBleed sub-findings (reported by Qiulin Deng against WeKan v9.08, fixed
// in v9.09 2026-05-07, commit 62c01725f9): six Meteor methods that copied or
// created board content checked nothing about WHO was calling them.
//
//   CopyBoardBleed    copyBoard - an unauthenticated caller cloned an entire
//                     private board, and the `properties` argument let them set
//                     the copy's members / permission afterwards.
//   CopyCardBleed     copyCard - an unauthenticated caller cloned a victim's
//                     private card into a board of their own.
//   CopyListBleed     copyList - a logged-in non-member cloned a victim's
//                     private list (and its cards) into their own board.
//   CopySwimlaneBleed copySwimlane - an unauthenticated caller cloned a
//                     victim's private swimlane with its lists and cards.
//   DueDateBleed      createCardWithDueDate - a logged-in non-member inserted
//                     cards into another user's private board.
//   MoveListBleed     moveList - a logged-in non-member moved (and so archived)
//                     a victim's private list: destructive partial changes.
//
// The fix: every one of them refuses an unauthenticated caller, requires
// membership (and, for anything it changes, write access) on the SOURCE board,
// and write access on the DESTINATION board - before anything is written.
// copyBoard now requires board admin (matching POST /api/boards/:id/copy), and
// only title/sort/type/card selection may be set on the copy
// (models/lib/boardCopyProperties.js, CopyIdentityBleed).
//
// The TEST runs each real method body against stub collections and checks the
// reporter's attacks are refused with no write reached, while the owner's own
// copy still goes through (so the harness is not vacuous). The NEGATIVE TEST
// lists every Meteor method and REST route in the tree that copies, moves or
// clones, and requires each to refuse before its first write - so a new
// copy/move method has to be added here, i.e. checked, to pass.
//
// Admin Panel / Problems: copyList, moveList and moveSwimlane refuse through
// requireBoardMutation, which records 'authz.mutation'. copyBoard, copyCard,
// copySwimlane and createCardWithDueDate record 'authz.copy' (AuthBleed) for
// a signed-out caller, and createCardWithDueDate - which no WeKan client
// calls - for any refusal. Their membership refusals are not recorded: a
// template or a stale dialog reaches them in ordinary use, and a
// high-severity record would disable that user's login.
// Run: node tests/authBleedCopyMethods.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const pending = [];
const test = (name, fn) => pending.push([name, fn]);

const { memberCan } = require(path.join(root, 'models/lib/boardRoleCapabilities'));
const boardCopyProps = require(path.join(root, 'models/lib/boardCopyProperties'));

// ---- harness ---------------------------------------------------------------

class MeteorError extends Error {
  constructor(error, reason) { super(reason || error); this.error = error; }
}
const Meteor = { Error: MeteorError, isServer: true };
const check = () => {};
const Match = { OneOf: () => null, Optional: () => null, Maybe: () => null };

// Real requireBoardMutation, with its securityLog require captured.
const recorded = [];
const guardSrc = read('models/lib/boardMutationGuard.js');
const requireBoardMutation = new Function('require', 'module',
  `${guardSrc}\nreturn module.exports.requireBoardMutation;`)(
  name => {
    if (name === './boardRoleCapabilities') return { memberCan };
    if (name === '/server/lib/securityLog') return { record: e => recorded.push(e) };
    throw new Error(`unexpected require ${name}`);
  }, { exports: {} });

// server/lib/utils.js, same definitions.
const allowIsBoardMember = (userId, board) => board && board.hasMember(userId);
const allowIsBoardMemberWithWriteAccess = (userId, board) => !!(board && memberCan(board, userId, 'write'));

let writes;
const wrote = what => (...args) => { writes.push(what); return 'new-id'; };

function board(_id, members) {
  return {
    _id, title: _id, members,
    hasMember(u) { return members.some(m => m.userId === u && m.isActive); },
    hasAdmin(u) { return members.some(m => m.userId === u && m.isActive && m.isAdmin); },
    copy: wrote(`board.copy:${_id}`),
  };
}
const boards = {
  victim: board('victim', [{ userId: 'victim', isActive: true, isAdmin: true }]),
  mine: board('mine', [{ userId: 'attacker', isActive: true, isAdmin: true }]),
  // The attacker is a read-only member here: may see, may not change.
  shared: board('shared', [
    { userId: 'victim', isActive: true, isAdmin: true },
    { userId: 'attacker', isActive: true, isAdmin: false, isReadOnly: true },
  ]),
};
const doc = (kind, boardId) => ({
  _id: `${kind}-${boardId}`, boardId, title: kind, type: kind, assignees: [],
  copy: wrote(`${kind}.copy:${boardId}`), move: wrote(`${kind}.move:${boardId}`),
  archive: wrote(`${kind}.archive:${boardId}`), getSort: async () => 0,
});
const byId = (kind, id) => {
  const boardId = String(id).replace(`${kind}-`, '');
  return boards[boardId] ? doc(kind, boardId) : null;
};
const ReactiveCache = {
  getBoard: async id => boards[id] || null,
  getCard: async id => byId('card', id),
  getList: async q => (typeof q === 'string' ? byId('list', q) : null),
  getLists: async () => [],
  getSwimlane: async id => byId('swimlane', id),
  getCards: async () => [],
};
const Boards = { findOneAsync: async id => boards[id] || null };
const Cards = { insertAsync: wrote('Cards.insertAsync') };
const Lists = { insertAsync: wrote('Lists.insertAsync'), updateAsync: wrote('Lists.updateAsync') };
// What the methods require after the guards: pass-through stubs.
const requireStub = name => {
  if (name === '/models/lib/boardCardScope') return { mayCopyFromBoard: () => true };
  if (name === '/models/lib/boardCopyProperties') return boardCopyProps;
  if (name === '/server/lib/securityLog') return { record: e => recorded.push(e) };
  if (name === '/server/lib/adminOnlyCustomFields') return { assertFieldWrite: async () => {} };
  if (name === '/models/lib/cardCopyOverrides') return { cardWithCopyOverrides: card => card };
  if (name === '/server/lib/cardCopyDestination') return { requireCardCopyDestination: async () => {} };
  if (name === '/models/lib/scrumCopy') return { copiedScrumMetadata: () => ({}) };
  throw new Error(`unexpected require ${name}`);
};

// Extract `  async NAME(...) { ... },` from a Meteor.methods block.
function methodSource(file, name) {
  const src = read(file);
  const start = src.indexOf(`  async ${name}(`);
  assert.ok(start >= 0, `${name} not found in ${file}`);
  const end = src.indexOf('\n  },\n', start);
  return src.slice(start, end + 4);
}
function loadMethod(file, name) {
  const body = methodSource(file, name).replace(`async ${name}(`, `async function ${name}(`);
  return new Function('check', 'Match', 'Meteor', 'Boards', 'ReactiveCache', 'Cards', 'Lists',
    'require', 'allowIsBoardMember', 'allowIsBoardMemberWithWriteAccess', 'requireBoardMutation',
    'normalizeBoardCopyOptions', `return ${body.trim().replace(/,$/, '')};`)(
    check, Match, Meteor, Boards, ReactiveCache, Cards, Lists, requireStub,
    allowIsBoardMember, allowIsBoardMemberWithWriteAccess, requireBoardMutation, o => o);
}

async function refused(fn, userId, args, expectedError = 'not-authorized') {
  writes = [];
  let error;
  try { await fn.apply({ userId }, args); } catch (e) { error = e; }
  assert.ok(error, `expected a refusal for ${userId} ${JSON.stringify(args)}`);
  assert.strictEqual(error.error, expectedError, `${error.stack}`);
  assert.deepStrictEqual(writes, [], 'nothing may be written before the refusal');
}
async function allowed(fn, userId, args) {
  writes = [];
  await fn.apply({ userId }, args);
  assert.ok(writes.length > 0, 'the legitimate call must reach its write');
}

const copyCard = loadMethod('server/models/cards.js', 'copyCard');
const createCardWithDueDate = loadMethod('server/models/cards.js', 'createCardWithDueDate');
const copyList = loadMethod('server/models/lists.js', 'copyList');
const moveList = loadMethod('server/models/lists.js', 'moveList');
const copySwimlane = loadMethod('server/publications/swimlanes.js', 'copySwimlane');
const moveSwimlane = loadMethod('server/publications/swimlanes.js', 'moveSwimlane');
const copyBoard = loadMethod('server/publications/boards.js', 'copyBoard');

// ---- TEST: the reported attacks --------------------------------------------

test('CopyCardBleed: copyCard refuses anonymous, non-member source and read-only destination', async () => {
  const args = dest => ['card-victim', dest, 'swimlane-mine', 'list-mine', false, {}];
  await refused(copyCard, null, args('mine'));
  await refused(copyCard, 'attacker', args('mine'));
  await refused(copyCard, 'attacker', ['card-mine', 'victim', 's', 'l', false, {}]);
  await refused(copyCard, 'attacker', ['card-mine', 'shared', 's', 'l', false, {}]);
  await allowed(copyCard, 'attacker', ['card-mine', 'mine', 's', 'l', false, {}]);
});

test('CopyBoardBleed: copyBoard refuses anonymous and non-admin callers, and members/permission on the copy', async () => {
  await refused(copyBoard, null, ['victim', {}]);
  await refused(copyBoard, 'attacker', ['victim', {}]);
  await refused(copyBoard, 'attacker', ['shared', {}]);
  // Post-copy permission tampering: the copy's members and visibility are not
  // the caller's to set - refused before copying, and recorded.
  recorded.length = 0;
  await refused(copyBoard, 'attacker',
    ['mine', { members: [{ userId: 'x', isAdmin: true, isActive: true }], permission: 'public' }],
    'invalid-copy-properties');
  assert.strictEqual(recorded.length, 1);
  assert.strictEqual(recorded[0].key, 'authz.board-copy-overrides');
  await allowed(copyBoard, 'attacker', ['mine', { title: 'Copy' }]);
});

test('CopyListBleed: copyList refuses anonymous, non-member source and non-writable destination', async () => {
  await refused(copyList, null, ['list-victim', 'mine', 's', 'Copy', null, null]);
  recorded.length = 0;
  await refused(copyList, 'attacker', ['list-victim', 'mine', 's', 'Copy', null, null]);
  assert.ok(recorded.some(e => e.key === 'authz.mutation'), 'the refusal is visible in Problems');
  await refused(copyList, 'attacker', ['list-mine', 'victim', 's', 'Copy', null, null]);
  await refused(copyList, 'attacker', ['list-mine', 'shared', 's', 'Copy', null, null]);
  await allowed(copyList, 'attacker', ['list-mine', 'mine', 's', 'Copy', null, null]);
});

test('CopySwimlaneBleed: copySwimlane (and moveSwimlane) refuse anonymous, non-member source and destination', async () => {
  for (const fn of [copySwimlane, moveSwimlane]) {
    await refused(fn, null, ['swimlane-victim', 'mine', null, 'below', '']);
    await refused(fn, 'attacker', ['swimlane-victim', 'mine', null, 'below', '']);
    await refused(fn, 'attacker', ['swimlane-mine', 'victim', null, 'below', '']);
    await refused(fn, 'attacker', ['swimlane-mine', 'shared', null, 'below', '']);
    await allowed(fn, 'attacker', ['swimlane-mine', 'mine', null, 'below', '']);
  }
  // Moving removes from the source, so read-only membership is not enough.
  await refused(moveSwimlane, 'attacker', ['swimlane-shared', 'mine', null, 'below', '']);
});

test('DueDateBleed: createCardWithDueDate refuses anonymous, non-member and read-only destinations', async () => {
  const due = new Date();
  await refused(createCardWithDueDate, null, ['victim', 'l', 'pwned', due, 's']);
  await refused(createCardWithDueDate, 'attacker', ['victim', 'l', 'pwned', due, 's']);
  await refused(createCardWithDueDate, 'attacker', ['shared', 'l', 'pwned', due, 's']);
  await refused(createCardWithDueDate, 'attacker', ['nonexistent', 'l', 'pwned', due, 's'], 'not-found');
  await allowed(createCardWithDueDate, 'attacker', ['mine', 'l', 'mine', due, 's']);
});

test('Problems: an attempt no WeKan client can make is recorded as AuthBleed', async () => {
  const card = ['card-mine', 'mine', 's', 'l', false, {}];
  for (const [fn, args, source] of [
    [copyBoard, ['victim', {}], 'method:copyBoard'],
    [copyCard, card, 'method:copyCard'],
    [copySwimlane, ['swimlane-victim', 'mine'], 'method:copySwimlane'],
    [createCardWithDueDate, ['victim', 'l', 'pwned', new Date(), 's'], 'method:createCardWithDueDate'],
  ]) {
    recorded.length = 0;
    await refused(fn, null, args);
    assert.deepStrictEqual(recorded.map(e => [e.key, e.action, e.source]), [['authz.copy', 'blocked', source]]);
    assert.strictEqual(recorded[0].userId, undefined, 'signed out: nobody to block');
  }
  // createCardWithDueDate has no WeKan client, so a signed-in refusal is an
  // attempt too - and it names the account.
  recorded.length = 0;
  await refused(createCardWithDueDate, 'attacker', ['victim', 'l', 'pwned', new Date(), 's']);
  assert.deepStrictEqual(recorded.map(e => [e.key, e.userId]), [['authz.copy', 'attacker']]);
  const { categoryFor } = require(path.join(root, 'models/lib/securityCategories'));
  assert.strictEqual(categoryFor('authz.copy').bleed, 'AuthBleed');
});

test('negative: a refusal ordinary use reaches is not recorded, so it cannot disable a login', async () => {
  // A member who is not admin of a (default) template board, or a stale Copy
  // Card / Copy Swimlane dialog, reaches these in ordinary use; an
  // authz.copy record names the account at high severity, which disables
  // its login.
  for (const [fn, args] of [
    [copyBoard, ['shared', {}]],
    [copyCard, ['card-victim', 'mine', 's', 'l', false, {}]],
    [copySwimlane, ['swimlane-victim', 'mine']],
  ]) {
    recorded.length = 0;
    await refused(fn, 'attacker', args);
    assert.deepStrictEqual(recorded.filter(e => e.key === 'authz.copy'), [], fn.name);
  }
});

test('MoveListBleed: moveList refuses before any move or archive of a victim list', async () => {
  await refused(moveList, null, ['list-victim', 'mine', '', null, null, null]);
  recorded.length = 0;
  await refused(moveList, 'attacker', ['list-victim', 'mine', '', null, null, null]);
  assert.ok(recorded.some(e => e.key === 'authz.mutation' && /moveList:source/.test(e.source)));
  // A read-only member may not move a list out (that archives it at the source).
  await refused(moveList, 'attacker', ['list-shared', 'mine', '', null, null, null]);
  await refused(moveList, 'attacker', ['list-mine', 'victim', '', null, null, null]);
  await allowed(moveList, 'attacker', ['list-mine', 'mine', '', null, null, null]);
});

// ---- NEGATIVE TEST: the shape nowhere else ---------------------------------

const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
  const rel = path.join(dir, e.name);
  if (e.isDirectory()) return /^(node_modules|_build|\.build|tests?)$/.test(e.name) ? [] : walk(rel);
  return /\.js$/.test(e.name) && !/\.tests?\.js$/.test(e.name) ? [rel] : [];
});
const sources = [...walk('server'), ...walk('models')];

const GUARD = /!this\.userId|requireBoardMutation\(|allowIsBoardMember(?:WithWriteAccess)?\(|\.hasMember\(|\.hasAdmin\(|userHasBoardWriteAccess\(|boardAccess\(|destination\(this\.userId|canExport\(|requireAdmin\(|\.isAdmin\b|check[A-Za-z]*Access\(|checkBoardAdmin\(/g;
const WRITE = /\.(copy|move|archive)\(|\b[A-Z]\w*\.(insert|update|remove|upsert)Async\(|\.direct\.|Meteor\.defer\(/;

// Every copy/move/clone method, with the number of guards it must pass before
// its first write. A method missing from this table fails: check it first.
const METHODS = {
  'server/publications/boards.js copyBoard': 2,          // login + board admin
  'server/models/cards.js copyCard': 3,                  // login + source member + destination write
  'server/models/cards.js createCardWithDueDate': 2,     // login + destination write
  'server/models/lists.js copyList': 3,
  'server/models/lists.js moveList': 3,
  'server/publications/swimlanes.js copySwimlane': 3,
  'server/publications/swimlanes.js moveSwimlane': 3,
  'server/models/checklists.js moveChecklist': 3,
  'server/moveBoardObjects.js moveBoardObjects': 2,      // boardAccess(source) + destination()->boardAccess
  'server/moveBoardObjects.js structuralMoveOptions': 2, // read-only: login + boardAccess(target)
  'server/attachmentApi.js api.attachment.copy': 3,
  'server/attachmentApi.js api.attachment.move': 3,
  'models/import.js cloneBoard': 2,                      // login + canExport
  'models/attachments.server.js moveAttachmentToStorage': 2, // login + site admin
  'models/attachments.server.js validateAttachmentAndMoveToStorage': 2,
  'server/attachmentBulkMove.js startBulkAttachmentMove': 1, // site admin
  'server/attachmentBulkMove.js pauseBulkAttachmentMove': 1,
  'server/attachmentBulkMove.js resumeBulkAttachmentMove': 1,
  'server/attachmentBulkMove.js cancelBulkAttachmentMove': 1,
  'server/models/users.js moveStarredPage': 1,           // the caller's own starred pages
};
// get/set...DialogOption(s) are user-document helpers for the caller's own
// remembered dialog choices (models/users.js), not board writes.
const isCopyMoveName = n => !/^(get|set)\w*DialogOptions?$/.test(n) && (/^(copy|move|clone|duplicate)/.test(n) ||
  /[a-z](Copy|Move|Clone|Duplicate)(?:[A-Z]|$)/.test(n) || /WithDueDate$/.test(n));

function bodyAt(src, at) {
  // Matching closing brace of the block whose '{' is at or after `at` (pass the
  // body's own brace: a default parameter such as `options = {}` comes first).
  let depth = 0;
  for (let i = src.indexOf('{', at); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(at, i + 1);
  }
  throw new Error('unbalanced');
}
const guardsBeforeWrite = body => {
  const w = body.search(WRITE);
  const head = w < 0 ? body : body.slice(0, w);
  return (head.match(GUARD) || []).length;
};

test('every copy/move/clone Meteor method refuses before its first write', () => {
  const found = [];
  for (const file of sources) {
    const src = read(file);
    if (!src.includes('Meteor.methods')) continue;
    for (const m of src.matchAll(/^ {2,4}(?:async )?'?([\w.]+)'?\s*\([^)]*\)\s*\{/gm)) {
      if (!isCopyMoveName(m[1].split('.').pop())) continue;
      const id = `${file} ${m[1]}`;
      found.push(id);
      assert.ok(Object.prototype.hasOwnProperty.call(METHODS, id),
        `${id} copies/moves board content and is not checked here - verify it refuses anonymous, ` +
        'source non-member and destination non-writer callers, then add it to METHODS');
      const n = guardsBeforeWrite(bodyAt(src, m.index + m[0].length - 1));
      assert.ok(n >= METHODS[id], `${id}: ${n} guard(s) before its first write, expected ${METHODS[id]}`);
    }
  }
  assert.deepStrictEqual(found.sort(), Object.keys(METHODS).sort(), 'METHODS lists a method that no longer exists');
});

test('every REST copy/move route checks the source AND the destination board before writing', () => {
  const routes = [];
  for (const file of sources) {
    const src = read(file);
    for (const m of src.matchAll(/WebApp\.(?:handlers|connectHandlers)\.(?:post|put)\(\s*'([^']*\/(?:copy|move|clone|duplicate))'/g)) {
      const body = bodyAt(src, src.indexOf('function', m.index));
      const n = guardsBeforeWrite(body);
      const twoBoards = /toBoardId/.test(body);
      routes.push(m[1]);
      assert.ok(n >= (twoBoards ? 2 : 1),
        `${file} ${m[1]}: ${n} access check(s) before writing, expected ${twoBoards ? 2 : 1}`);
    }
  }
  for (const r of ['/api/boards/:boardId/copy', '/api/boards/:boardId/lists/:listId/copy',
    '/api/boards/:boardId/lists/:listId/move', '/api/boards/:boardId/swimlanes/:swimlaneId/copy',
    '/api/boards/:boardId/swimlanes/:swimlaneId/move', '/api/boards/:boardId/lists/:listId/cards/:cardId/copy']) {
    assert.ok(routes.includes(r), `route ${r} not found - the scan no longer sees it`);
  }
});

test('copyBoard does not let the caller choose members or permission of the copy', () => {
  for (const field of ['members', 'permission', '_id', 'archived']) {
    assert.throws(() => boardCopyProps.boardCopyProperties({ [field]: 'x' }),
      e => e.securityAttempt === true, `${field} must be refused as an attempt`);
  }
  assert.doesNotThrow(() => boardCopyProps.boardCopyProperties({ title: 't', sort: 1, type: 'board', withoutCards: true }));
});

(async () => {
  let failed = 0;
  for (const [name, fn] of pending) {
    try { await fn(); console.log(`  ok   ${name}`); }
    catch (e) { failed++; console.log(`  FAIL ${name}\n${e.stack}`); }
  }
  console.log(`\n${pending.length - failed}/${pending.length} passed`);
  if (failed) process.exit(1);
})();
