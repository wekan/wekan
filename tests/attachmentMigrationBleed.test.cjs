'use strict';

// AttachmentMigrationBleed (SnowBleed finding 7, Joshua Rogers of Aisle
// Research, fixed in v8.21, commit 053bf1dfb7): the attachmentMigration.*
// Meteor methods ran for ANY logged-in user against ANY board - start a
// migration of somebody else's board, read its progress and its unconverted
// attachments. The fix: migrateBoardAttachments needs a board admin or a site
// admin, the three reads need a board the caller can see.
//
// The same shape - a board migration method with a login check alone - lived
// on in three siblings (found by this audit): deleteDuplicateEmptyLists.getStatus
// returned every list id and title of a private board with card counts, and
// its .needsMigration, fixAllFileUrls.needsMigration and
// fixAvatarUrls.needsMigration answered for any board. They now go through
// server/lib/migrationBoardAccess.js, which refuses and records the attempt
// (Admin Panel / Problems, key authz.migration-board).
//
//   * the test runs the REAL method bodies and the REAL helper against stubs;
//   * the negative test sweeps every migration / repair method file and fails
//     on a method with no board or admin check at all.
// Run: node tests/attachmentMigrationBleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const pending = [];
const test = (name, fn) => pending.push([name, fn]);

// Board objects with the REAL isVisibleBy / isActiveMember / hasAdmin.
const { readableWithoutMembership } = require('../models/lib/boardPermission');
function boardProto() {
  const src = read('models/boards.js');
  const cut = name => {
    const i = src.indexOf(`\n  ${name}(`);
    assert.notStrictEqual(i, -1, `models/boards.js: ${name}() not found`);
    return src.slice(i, src.indexOf('\n  },', i) + 4);
  };
  const findWhere = (arr, props) => arr && arr.find(item => Object.keys(props).every(k => item[k] === props[k]));
  return new Function('readableWithoutMembership', 'findWhere',
    `return {${cut('isVisibleBy')},${cut('isActiveMember')},${cut('hasAdmin')}};`)(readableWithoutMembership, findWhere);
}
const proto = boardProto();
const BOARDS = {
  priv: Object.assign(Object.create(proto), { _id: 'priv', permission: 'private', members: [
    { userId: 'owner', isActive: true, isAdmin: true },
    { userId: 'member', isActive: true, isAdmin: false },
  ] }),
};
const USERS = { siteadmin: { _id: 'siteadmin', isAdmin: true } };
const ReactiveCache = {
  getBoard: async id => BOARDS[typeof id === 'string' ? id : id._id] || null,
  getUser: async id => USERS[id] || { _id: id },
};
class MeteorError extends Error { constructor(error, reason) { super(reason || error); this.error = error; } }

const recorded = [];
const requireStub = name => {
  assert.strictEqual(name, '/server/lib/securityLog');
  return { record: evt => recorded.push(evt) };
};

// The helper the three sibling migrations now call.
const helperSrc = read('server/lib/migrationBoardAccess.js');
const assertMigrationBoardVisible = new Function('Meteor', 'ReactiveCache', 'require',
  `${helperSrc.replace(/^import .*$/gm, '').replace('export async function', 'async function')}
return assertMigrationBoardVisible;`)({ Error: MeteorError }, ReactiveCache, requireStub);

// The real attachmentMigration Meteor.methods block.
function attachmentMethods() {
  const src = read('server/attachmentMigration.js');
  const start = src.indexOf('Meteor.methods({');
  const block = src.slice(start, src.indexOf('\n});', start) + 4);
  let methods;
  const service = {
    migrateBoardAttachments: async () => 'migrated',
    getMigrationProgress: async () => ({ unconvertedAttachments: [] }),
    getUnconvertedAttachments: async () => [{ _id: 'a1', path: '/srv/files/a1' }],
    isBoardMigrated: () => true,
  };
  new Function('Meteor', 'check', 'ReactiveCache', 'attachmentMigrationService', block)(
    { methods: m => { methods = m; }, Error: MeteorError }, () => {}, ReactiveCache, service);
  return methods;
}
const methods = attachmentMethods();
const call = (name, userId, ...args) => methods[name].apply({ userId }, args);
const refused = async p => { try { await p; return false; } catch (e) { return e.error === 'not-authorized'; } };

test('attachmentMigration: a non-member is refused by every method of a private board', async () => {
  for (const name of Object.keys(methods)) {
    assert.ok(await refused(call(name, 'stranger', 'priv')), `${name} answered a non-member`);
    assert.ok(await refused(call(name, null, 'priv')), `${name} answered anonymously`);
  }
});

test('attachmentMigration: migrating needs a board admin or site admin, reading a member', async () => {
  assert.ok(await refused(call('attachmentMigration.migrateBoardAttachments', 'member', 'priv')),
    'a plain member started a migration');
  assert.strictEqual(await call('attachmentMigration.migrateBoardAttachments', 'owner', 'priv'), 'migrated');
  assert.strictEqual(await call('attachmentMigration.migrateBoardAttachments', 'siteadmin', 'priv'), 'migrated');
  assert.strictEqual(await call('attachmentMigration.isBoardMigrated', 'member', 'priv'), true);
  assert.deepStrictEqual(await call('attachmentMigration.getUnconvertedAttachments', 'member', 'priv'), [{ _id: 'a1' }]);
});

test('siblings: the helper refuses and records a board the caller cannot see', async () => {
  recorded.length = 0;
  for (const userId of ['stranger', null]) {
    let error;
    try { await assertMigrationBoardVisible(userId, 'priv', 'ddp:x'); } catch (e) { error = e; }
    assert.ok(error && error.error === 'not-authorized', `refused ${userId}`);
  }
  let error;
  try { await assertMigrationBoardVisible('stranger', 'gone', 'ddp:x'); } catch (e) { error = e; }
  assert.ok(error, 'an unknown board is refused too');
  assert.strictEqual(recorded.length, 2, 'the two signed-in attempts are recorded; anonymous is refused before');
  for (const evt of recorded) {
    assert.strictEqual(evt.key, 'authz.migration-board');
    assert.strictEqual(evt.action, 'blocked');
  }
  const { CATALOG } = require('../models/lib/securityCategories');
  assert.strictEqual(CATALOG['authz.migration-board'].bleed, 'AttachmentMigrationBleed');
});

test('siblings: negative - a member is answered and nothing is recorded', async () => {
  recorded.length = 0;
  assert.strictEqual(await assertMigrationBoardVisible('member', 'priv', 'ddp:x'), BOARDS.priv);
  assert.strictEqual(recorded.length, 0, 'ordinary use is never logged');
});

test('siblings: each of the four methods checks the board before it answers', () => {
  for (const [file, names] of [
    ['server/migrations/deleteDuplicateEmptyLists.js', ['deleteDuplicateEmptyLists.needsMigration', 'deleteDuplicateEmptyLists.getStatus']],
    ['server/migrations/fixAllFileUrls.js', ['fixAllFileUrls.needsMigration']],
    ['server/migrations/fixAvatarUrls.js', ['fixAvatarUrls.needsMigration']],
  ]) {
    const src = read(file);
    for (const name of names) {
      const at = src.indexOf(`async '${name}'(boardId) {`);
      assert.notStrictEqual(at, -1, `${file}: ${name}`);
      const body = src.slice(at, src.indexOf('\n  }', at));
      const guard = body.indexOf(`await assertMigrationBoardVisible(this.userId, boardId, 'ddp:${name}');`);
      assert.ok(guard > 0 && guard < body.indexOf('return await'), `${name}: guard before the answer`);
    }
  }
});

// --- negative, whole tree ----------------------------------------------------
const GUARD = /isVisibleBy|hasAdmin|hasMember|assertMigrationBoardVisible|requireBoardAccess|requireAdmin|\.isAdmin\b|isAdmin: true/;
function methodFiles() {
  const out = ['server/attachmentMigration.js'];
  for (const dir of ['server/migrations', 'server/methods']) {
    for (const f of fs.readdirSync(path.join(ROOT, dir))) {
      if (f.endsWith('.js') && (dir === 'server/migrations' || /migrat|fix|repair/i.test(f))) out.push(`${dir}/${f}`);
    }
  }
  return out;
}
function methodsOf(src) {
  const found = [];
  let at = 0;
  while ((at = src.indexOf('Meteor.methods({', at)) >= 0) {
    let end = src.indexOf('\n});', at);
    if (end < 0) end = src.indexOf('\n  });', at);
    if (end < 0) end = src.length;
    const block = src.slice(at, end);
    // A method is the shallowest `name(args) {` of the block - an `if (...) {`
    // inside one is deeper, and is not a method.
    const all = [...block.matchAll(/\n( {2,4})(?:async\s+)?'?([\w.]+)'?\s*\(([^)]*)\)\s*\{/g)]
      .filter(m => !['if', 'for', 'while', 'switch', 'catch', 'function'].includes(m[2]));
    const indent = Math.min(...all.map(m => m[1].length));
    for (const m of all.filter(x => x[1].length === indent)) {
      const close = block.indexOf(`\n${m[1]}}`, m.index + 1);
      found.push({ name: m[2], body: block.slice(m.index, close < 0 ? undefined : close) });
    }
    at = end + 1;
  }
  return found;
}

test('negative, whole tree: every migration / repair method checks a board or an admin', () => {
  const unguarded = [];
  let count = 0;
  for (const file of methodFiles()) {
    for (const { name, body } of methodsOf(read(file))) {
      count += 1;
      if (!GUARD.test(body)) unguarded.push(`${file}: ${name}`);
    }
  }
  assert.ok(count >= 20, `the sweep must see the migration methods (${count})`);
  assert.deepStrictEqual(unguarded, [], 'these answer for any board with a login check alone');
});

test('the sweep would catch the reported shape (negative of the negative)', () => {
  const vulnerable = `Meteor.methods({
  async 'x.getStatus'(boardId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    return await service.getStatus(boardId);
  }
});`;
  const [m] = methodsOf(vulnerable);
  assert.ok(m && !GUARD.test(m.body));
});

(async () => {
  for (const [name, fn] of pending) { await fn(); console.log('  ok -', name); }
  console.log(`\nattachmentMigrationBleed: ${pending.length} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
