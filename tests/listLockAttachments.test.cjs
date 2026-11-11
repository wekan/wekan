'use strict';
// ListLockAttachBleed (sibling of ListLockBleed, GHSA-4734-8vrg-8j3w): a board
// admin can refuse a role write access in one list (#4527, roleExceptions).
// The attachment API's upload, delete, copy and move asked only for board
// write access and the assigned-only check, so a normal member the list
// refused still added and removed files on that list's cards.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { exceptionFor } = require('../models/lib/listPermissions');

// mayWriteInCardList itself, with its two lookups stubbed: the list and the
// card's board come from the arguments, the decision is listPermissions.js's.
function loadGuard({ lists, boards = {}, records }) {
  const src = read('server/lib/assignedOnlyAttachments.js');
  const start = src.indexOf('export async function mayWriteInCardList(');
  assert.ok(start >= 0, 'mayWriteInCardList is defined');
  const body = src.slice(start).replace('export async function', 'async function');
  const listException = async (userId, board, listId, capability) => {
    const list = lists[listId];
    if (!board || !list || list.boardId !== board._id) return undefined;
    return exceptionFor(board, list, userId, capability);
  };
  const stubRequire = name => {
    if (name === '/server/lib/listPermissionGate') return { listException };
    if (name === '/server/lib/securityLog') return { record: entry => records.push(entry) };
    throw new Error(`unexpected require ${name}`);
  };
  const ReactiveCache = { getBoard: async id => boards[id] || null };
  // eslint-disable-next-line no-new-func
  return new Function('require', 'ReactiveCache', `${body}\nreturn mayWriteInCardList;`)(stubRequire, ReactiveCache);
}

// The reporter's board: Bob, an active normal member of a private board.
const board = { _id: 'board-a', permission: 'private', allowsAttachments: true,
  members: [{ userId: 'bob', isActive: true }, { userId: 'admin', isActive: true, isAdmin: true }] };
const lists = {
  'list-locked': { _id: 'list-locked', boardId: 'board-a', roleExceptions: { normal: { write: false } } },
  'list-open': { _id: 'list-open', boardId: 'board-a' },
  'list-granted': { _id: 'list-granted', boardId: 'board-a', roleExceptions: { normal: { write: true } } },
};
const locked = { _id: 'card-b', boardId: 'board-a', listId: 'list-locked', userId: 'owner' };
const open = { _id: 'card-c', boardId: 'board-a', listId: 'list-open', userId: 'owner' };

test('the reporter\'s case: a list refusing the normal role refuses its attachment writes', async () => {
  const records = [];
  const guard = loadGuard({ lists, records });
  for (const source of ['attachment-api:upload', 'attachment-api:delete', 'attachment-api:copy', 'attachment-api:move',
    'attachment-method:upload', 'attachment-method:delete', 'attachment-method:copy', 'attachment-method:move']) {
    assert.strictEqual(await guard(board, 'bob', locked, source), false, source);
  }
  assert.strictEqual(records.length, 8, 'each refusal is recorded');
  assert.ok(records.every(r => r.key === 'authz.list-locked-attachment' && r.action === 'blocked' && r.userId === 'bob'));
  assert.deepStrictEqual(records.map(r => r.source).slice(0, 2), ['attachment-api:upload', 'attachment-api:delete']);
});

test('negative: what the list does not refuse is not refused, and records nothing', async () => {
  const records = [];
  const guard = loadGuard({ lists, records });
  assert.strictEqual(await guard(board, 'bob', open, 'attachment-api:upload'), true, 'a list without an exception');
  assert.strictEqual(await guard(board, 'bob', { ...locked, listId: 'list-granted' }, 'attachment-api:upload'), true,
    'a list granting write: the board checks beside it still decide');
  assert.strictEqual(await guard(board, 'admin', locked, 'attachment-api:delete'), true, 'a board admin, whom no exception binds');
  assert.strictEqual(await guard(board, 'bob', null, 'attachment-api:delete'), true, 'a board-level file has no list');
  assert.deepStrictEqual(records, []);
});

test('the card\'s own board decides, not the board the caller named', async () => {
  const records = [];
  const other = { _id: 'board-z', permission: 'private', members: [{ userId: 'bob', isActive: true }] };
  const guard = loadGuard({ lists, boards: { 'board-a': board }, records });
  // Naming another board must not make the locked list "not this board's".
  assert.strictEqual(await guard(other, 'bob', locked, 'attachment-api:move'), false);
  assert.strictEqual(records.length, 1);
});

// Negative, tree-wide: the fault was a write path that asked the board and the
// card's assignment but not the list. Not one route at a time - every
// mayWriteCardAttachment call in the tree is paired with the list check under
// the same source, and every attachment API write asks.
test('negative: every attachment write that checks the card also asks its list', () => {
  const calls = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (!['tests', 'node_modules'].includes(entry.name)) walk(rel); continue; }
      if (!/\.js$/.test(entry.name) || rel === path.join('server', 'lib', 'assignedOnlyAttachments.js')) continue;
      const src = read(rel);
      for (const m of src.matchAll(/mayWriteCardAttachment\(\s*\w+,\s*[\w.]+,\s*\w+,\s*'([^']+)'\)/g)) {
        calls.push(m[1]);
        const near = src.slice(m.index, m.index + 600);
        assert.match(near, new RegExp(`await mayWriteInCardList\\(\\s*\\w+,\\s*[\\w.]+,\\s*\\w+,\\s*'${m[1]}'\\)`),
          `${rel}: ${m[1]} asks the card's list too`);
      }
    }
  };
  walk('server');
  walk('models');
  for (const kind of ['upload', 'delete', 'copy', 'move']) {
    assert.ok(calls.includes(`attachment-api:${kind}`), `REST ${kind} is scanned`);
    assert.ok(calls.includes(`attachment-method:${kind}`), `DDP ${kind} is scanned`);
  }
  // A move also takes the file off its source card: that card's list is asked.
  for (const [rel, source] of [['server/attachmentApi.js', 'attachment-method:move'], ['server/routes/attachmentApi.js', 'attachment-api:move']]) {
    assert.match(read(rel), new RegExp(`mayWriteInCardList\\(sourceBoard, [\\w.]+, moveSourceCard, '${source}'\\)`), `${rel}: the move's source list`);
  }
  // The UI's own attachment writes already ask the list, through the card
  // edit rule: Meteor-Files' upload hook and the soft delete and restore.
  assert.match(read('models/attachments.server.js'), /mayEditCard: Boolean\(card\) && await canEditCardOrLinkedCard\(/);
  assert.match(read('server/attachmentSoftDelete.js'), /if \(card\) return await canEditCardOrLinkedCard\(userId, card\);/);
  assert.match(read('server/lib/linkedCardPermission.js'), /listException\(userId, sourceBoard, card\.listId, 'write'\)/);
});

test('the refusal is in Admin Panel -> Problems, and logging never breaks the guard', () => {
  const src = read('server/lib/assignedOnlyAttachments.js');
  const fn = src.slice(src.indexOf('export async function mayWriteInCardList('));
  assert.match(fn, /record\(\{\s*key: 'authz\.list-locked-attachment', action: 'blocked'/);
  assert.match(fn, /catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
  assert.ok(fn.indexOf("!== false) return true;") < fn.indexOf('record('), 'an allowed write records nothing');
  const { categoryFor } = require('../models/lib/securityCategories');
  const cat = categoryFor('authz.list-locked-attachment');
  assert.strictEqual(cat.bleed, 'ListLockAttachBleed');
  assert.strictEqual(cat.severity, 'medium', 'recorded, never disables the account');
  assert.strictEqual(cat.cwe, 'CWE-863');
});
