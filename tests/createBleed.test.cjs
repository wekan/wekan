'use strict';

// CreateBleed (GHSA-qcfm-2g4w-wqcc), #4475: "Only admins can create boards"
// (Admin Panel -> Settings -> Visibility,
// tableVisibilityMode-boardCreationAdminOnly) was checked only inside
// createBoardWithInitialSwimlanes. A non-admin still created boards by a
// client Boards.insert (Boards.allow.insert approves any signed-in user),
// POST /api/boards and both board import routes - the report - and, found
// with it, importBoard, cloneBoard, copyBoard, POST /api/boards/:boardId/copy
// and createBoardFromCard.
//
//  * the decision (models/lib/boardCreationPolicy.js), as arithmetic, with the
//    reporter's case exactly;
//  * the guard (server/lib/boardCreationGuard.js), run for real in a vm:
//    refused, recorded in Admin Panel -> Problems, a 403 for REST;
//  * the REAL deny rule of server/permissions/boards.js against the
//    reporter's console insert;
//  * negative: every path in the tree that makes a working board for a user
//    asks the guard, and nothing else reads the setting.
// Run: node tests/createBleed.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { boardCreationAllowed } = require('../models/lib/boardCreationPolicy');
const { categoryFor } = require('../models/lib/securityCategories');

test('the decision: with the setting on, only an admin creates a working board', () => {
  // The report: an admin turns the setting on; user u is not an admin.
  assert.equal(boardCreationAllowed({ adminOnly: true, isAdmin: false, type: 'board' }), false);
  assert.equal(boardCreationAllowed({ adminOnly: true, isAdmin: undefined }), false, 'no type is a working board');
  assert.equal(boardCreationAllowed({ adminOnly: true, isAdmin: 'true', type: 'board' }), false, 'only isAdmin === true counts');
  assert.equal(boardCreationAllowed({ adminOnly: true, isAdmin: false, type: 'template-container' }), false);
  // Allowed: an admin, the setting off, and a member's own board template.
  assert.equal(boardCreationAllowed({ adminOnly: true, isAdmin: true, type: 'board' }), true);
  assert.equal(boardCreationAllowed({ adminOnly: false, isAdmin: false, type: 'board' }), true);
  assert.equal(boardCreationAllowed({ adminOnly: undefined, isAdmin: false }), true, 'no setting document is off');
  assert.equal(boardCreationAllowed({ adminOnly: true, isAdmin: false, type: 'template-board' }), true);
});

// server/lib/boardCreationGuard.js, its imports stubbed.
function loadGuard({ adminOnly, user }) {
  const recorded = [];
  const exports = {};
  const src = read('server/lib/boardCreationGuard.js')
    .replace(/^import \{ Meteor \} from .*$/m, '')
    .replace(/^import \{ ReactiveCache \} from .*$/m, '')
    .replace(/^import TableVisibilityModeSettings from .*$/m, '')
    .replace(/^export async function /gm, 'exports.$fn = async function ')
    .replace(/exports\.\$fn = async function (\w+)/g, 'exports.$1 = async function $1');
  assert.ok(!/^import /m.test(src), 'every import of the guard is stubbed');
  class MeteorError extends Error { constructor(error, reason) { super(reason); this.error = error; this.reason = reason; } }
  vm.runInNewContext(src, {
    exports, console,
    Meteor: { Error: MeteorError },
    ReactiveCache: { getUser: async id => (user && user._id === id ? user : null) },
    TableVisibilityModeSettings: {
      findOneAsync: async id => (id === 'tableVisibilityMode-boardCreationAdminOnly' && adminOnly !== undefined ? { booleanValue: adminOnly } : null),
    },
    require: spec => {
      if (spec === '/server/lib/securityLog') return { record: evt => recorded.push(evt) };
      if (spec === '/models/lib/boardCreationPolicy') return require('../models/lib/boardCreationPolicy');
      throw new Error(`unexpected require ${spec}`);
    },
  });
  return { ...exports, recorded };
}

test('the guard refuses a non-admin, records it, and answers REST with 403', async () => {
  const g = loadGuard({ adminOnly: true, user: { _id: 'u', isAdmin: false } });
  await assert.rejects(g.assertMayCreateBoard('u', { source: 'rest:POST /api/boards', type: 'board' }), error => {
    assert.equal(error.error, 'not-authorized');
    assert.equal(error.statusCode, 403, 'a REST route answers 403, not 500');
    return true;
  });
  assert.equal(await g.mayCreateBoard('u', { source: 'ddp:boards.insert' }), false);
  assert.equal(g.recorded.length, 2);
  for (const evt of g.recorded) {
    assert.equal(evt.key, 'authz.board-creation');
    assert.equal(evt.action, 'blocked');
    assert.equal(evt.userId, 'u');
  }
  assert.deepEqual(g.recorded.map(e => e.source), ['rest:POST /api/boards', 'ddp:boards.insert']);
});

test('negative: the guard lets an admin, a template and an instance without the setting through, unrecorded', async () => {
  const admin = loadGuard({ adminOnly: true, user: { _id: 'a', isAdmin: true } });
  await admin.assertMayCreateBoard('a', { source: 's', type: 'board' });
  assert.equal(await admin.mayCreateBoard('a', { source: 's' }), true);
  const member = loadGuard({ adminOnly: true, user: { _id: 'u', isAdmin: false } });
  assert.equal(await member.mayCreateBoard('u', { source: 's', type: 'template-board' }), true);
  const off = loadGuard({ adminOnly: false, user: { _id: 'u', isAdmin: false } });
  await off.assertMayCreateBoard('u', { source: 's', type: 'board' });
  const unset = loadGuard({ adminOnly: undefined, user: { _id: 'u', isAdmin: false } });
  assert.equal(await unset.mayCreateBoard('u', { source: 's' }), true);
  assert.equal(admin.recorded.length + member.recorded.length + off.recorded.length + unset.recorded.length, 0,
    'only a refusal is an attempt; ordinary creation is not logged');
});

test('the reporter\'s console insert is refused by the real deny rule; a template insert is not', async () => {
  const denies = [];
  const src = read('server/permissions/boards.js')
    .replace(/^import Boards from .*$/m, '')
    .replace(/^import TableVisibilityModeSettings from .*$/m, 'const TableVisibilityModeSettings = { findOneAsync: async () => null };')
    .replace(/^import \{ findWhere, where \} from .*$/m, 'const where = () => []; const findWhere = () => undefined;')
    .replace(/^import \{[^}]*\} from '\/server\/lib\/utils';$/m,
      'const allowIsBoardAdminOrSiteAdmin = () => true; const canUpdateBoardSort = () => false; const canUpdateBoardSameWidthValue = () => false;')
    .replace(/^import \{[^}]*\} from '\/server\/lib\/subtaskDepositAccess';$/m,
      'const canWriteSubtaskDeposit = async () => true; const recordSubtaskDepositDenial = () => {};')
    .replace(/^import \{ mayCreateBoard \} from '\/server\/lib\/boardCreationGuard';$/m, '');
  assert.ok(!/^import /m.test(src), 'every import of server/permissions/boards.js is stubbed');
  const guard = loadGuard({ adminOnly: true, user: { _id: 'u', isAdmin: false } });
  vm.runInNewContext(src, {
    Boards: { deny: rules => denies.push(rules), allow: () => {} }, console,
    mayCreateBoard: guard.mayCreateBoard,
    require: spec => require(path.join(ROOT, spec)),
  });
  const refused = async doc => {
    for (const rules of denies) if (rules.insert && await rules.insert('u', doc)) return true;
    return false;
  };
  // Boards.insert({ title: 'x', permission: 'private' }) from the report.
  assert.equal(await refused({ title: 'x', permission: 'private' }), true);
  assert.equal(await refused({ title: 'x', permission: 'private', type: 'board' }), true);
  assert.equal(guard.recorded[0].source, 'ddp:boards.insert');
  // The one insert the client makes: a board template in the Templates board.
  assert.equal(await refused({ title: 't', permission: 'private', type: 'template-board' }), false);
});

// Each path that makes a new working board for a user, and what it must say.
const PATHS = [
  ['server/models/boards.js', /async createBoardWithInitialSwimlanes\(/, /assertMayCreateBoard\(this\.userId, \{ source: 'createBoardWithInitialSwimlanes', type \}\)/],
  ['server/models/boards.js', /WebApp\.handlers\.post\('\/api\/boards', /, /assertMayCreateBoard\(req\.userId, \{ source: 'rest:POST \/api\/boards'/],
  ['server/models/boards.js', /WebApp\.handlers\.post\('\/api\/boards\/:boardId\/copy', /, /assertMayCreateBoard\(req\.userId, \{ source: 'rest:POST \/api\/boards\/:boardId\/copy'/],
  ['server/permissions/boards.js', /  async insert\(userId, doc\) \{/, /mayCreateBoard\(userId, \{ source: 'ddp:boards\.insert', type: doc\.type \}\)/],
  ['models/import.js', /async importBoard\(/, /assertMayCreateBoardOnServer\(this\.userId, 'method:importBoard'\)/],
  ['models/import.js', /async cloneBoard\(/, /assertMayCreateBoardOnServer\(this\.userId, 'method:cloneBoard'\)/],
  ['server/publications/boards.js', /async copyBoard\(/, /assertMayCreateBoard\(this\.userId, \{ source: 'method:copyBoard'/],
  ['server/models/cards.js', /async createBoardFromCard\(/, /assertMayCreateBoard\(this\.userId, \{ source: 'method:createBoardFromCard'/],
];

// The body of the function or handler that starts at `start`: up to the next
// top-level method, handler or Boards.deny/allow block.
function bodyAt(text, start) {
  const at = text.search(start);
  assert.notEqual(at, -1, `${start} not found`);
  const rest = text.slice(at + 1);
  const next = rest.search(/\n(?:  async \w+\(|WebApp\.handlers\.|Boards\.(?:deny|allow)\(|\}\);\n)/);
  return text.slice(at, at + 1 + (next === -1 ? rest.length : next));
}

test('every path that makes a working board asks the guard before it writes', () => {
  for (const [file, start, call] of PATHS) {
    const body = bodyAt(read(file), start);
    assert.match(body, call, `${file}: ${start}`);
  }
  // The REST import routes reach importBoard, which asks.
  const boardsJs = read('server/models/boards.js');
  for (const route of ["'/api/boards/import'", "'/api/boards/import/:source'"]) {
    const body = bodyAt(boardsJs, new RegExp(`WebApp\\.handlers\\.post\\(${route.replace(/[/:]/g, m => `\\${m}`)}, `));
    assert.match(body, /Meteor\.callAsync\('importBoard'/, `${route} imports through importBoard`);
  }
  // models/import.js's helper really calls the guard on the server.
  assert.match(read('models/import.js'), /async function assertMayCreateBoardOnServer\(userId, source\) \{\s*if \(!Meteor\.isServer\) return;\s*const \{ assertMayCreateBoard \} = require\('\/server\/lib\/boardCreationGuard'\);\s*await assertMayCreateBoard\(userId, \{ source, type: 'board' \}\);/);
});

// Files that make boards WeKan creates by itself, or the shared copy and
// import machinery the guarded paths above call. A NEW Boards.insert
// elsewhere must either ask the guard or be added here with its reason.
const SYSTEM_CREATORS = {
  'server/models/users.js': 'the Templates container a user gets at sign-up (ensureTemplatesBoardForUserId)',
  'models/boards.js': 'Board.copy(), called by the guarded copyBoard, REST copy and the template-only saveBoardAsTemplate; and getDefaultSubtasksBoardAsync, a board\'s own subtasks board',
  'models/csvCreator.js': 'an import creator, reached through the guarded importBoard',
  'models/kanboardCreator.js': 'an import creator, reached through the guarded importBoard',
  'models/jiraCreator.js': 'an import creator, reached through the guarded importBoard',
};

function sources(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (['node_modules', '.tools', '.build', '.meteor', '.git', 'tests', 'packages'].includes(entry.name) || entry.name.startsWith('_build')) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) sources(rel, out);
    else if (/\.js$/.test(entry.name)) out.push(rel);
  }
  return out;
}

test('negative: no other server code creates a board without the guard', () => {
  const files = [...sources('server'), ...sources('models')];
  const unguarded = [];
  for (const file of files) {
    const text = read(file);
    if (!/Boards\.(?:direct\.)?insert(?:Async)?\(/.test(text)) continue;
    if (/assertMayCreateBoard|mayCreateBoard/.test(text)) continue;
    if (SYSTEM_CREATORS[file]) continue;
    unguarded.push(file);
  }
  assert.deepEqual(unguarded, [],
    'these files insert boards with no CreateBleed guard and no reason in SYSTEM_CREATORS');
});

test('negative: the setting is read in one place on the server, the guard', () => {
  const readers = [...sources('server'), ...sources('models')]
    // In code, not in a comment that names it.
    .filter(file => /tableVisibilityMode-boardCreationAdminOnly/.test(read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')))
    .filter(file => file !== 'server/models/collectionBootstrap.js'); // creates the setting's document
  assert.deepEqual(readers, ['server/lib/boardCreationGuard.js']);
});

test('the refusal is in Admin Panel -> Problems under CreateBleed, and blocks no account', () => {
  const cat = categoryFor('authz.board-creation');
  assert.equal(cat.bleed, 'CreateBleed');
  assert.equal(cat.cwe, 'CWE-863');
  assert.equal(cat.blocksAccount, false, 'a tab opened before the switch is no attacker');
});

test('the UI offers no new-board control to a non-admin while it is on', () => {
  const helper = read('client/lib/boardCreationAllowed.js');
  assert.match(helper, /Template\.registerHelper\('boardCreationAllowed', \(\) => boardCreationAllowed\(\)\)/);
  assert.match(read('client/components/boards/allBoardsSidebar.jade'),
    /if boardCreationAllowed\n\s+a\.sidebar-btn\.js-duplicate-selected-boards/);
  assert.match(read('client/components/cards/cardDetails.jade'),
    /if boardCreationAllowed\n\s+li\n\s+a\.js-create-board-from-card/);
});
