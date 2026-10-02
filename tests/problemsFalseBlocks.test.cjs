'use strict';

// Admin Panel -> Problems is also an enforcement point: a 'blocked' record of
// high or critical severity that names a userId DISABLES that account
// (server/lib/blockOnSecurityEvent.js). An audit (2026-10-02) found records on
// paths ordinary users reach, so legitimate users lost their accounts:
//   - authz.card-member: a client writing back a card's assignees that still
//     list a removed member;
//   - History restore after the user was demoted (HistoryScopeBleed is a
//     deliberate omission);
//   - export by an assigned-only member, who reaches the export menus;
//   - a large but legitimate import hitting a size limit;
//   - a Trello import whose board links to an internal host (ssrf.attachment),
//     an identity provider serving avatars from one (ssrf.redirect), a cached
//     older client sending an upload file id (authz.upload-path);
//   - a REST client writing a card back with the parent it already had.
// Each now records only the attempt, or does not block. This pins all of them.
// Run: node tests/problemsFalseBlocks.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

function shouldBlock() {
  const catalog = {};
  // eslint-disable-next-line no-new-func
  new Function('exports', `${read('models/lib/securityCategories.js').replace(/^export \{[^}]*\};?\s*$/m, '')}\nexports.categoryFor = categoryFor;`)(catalog);
  const src = read('server/lib/blockOnSecurityEvent.js').replace(/^import [^\n]*\n/gm, '')
    .replace(/^const \{ categoryFor \} = require[^\n]*\n/m, '').replace(/^export /gm, '');
  const lib = {};
  // eslint-disable-next-line no-new-func
  new Function('exports', 'Meteor', 'categoryFor', `${src}\nexports.shouldBlockAccount = shouldBlockAccount;`)(lib, {}, catalog.categoryFor);
  return lib.shouldBlockAccount;
}

test('keys reached by innocent users never disable an account', () => {
  const block = shouldBlock();
  for (const key of ['ssrf.attachment', 'ssrf.redirect', 'authz.upload-path', 'brute.lockout']) {
    assert.equal(block({ key, action: 'blocked', userId: 'u' }), false, key);
  }
  // A real attempt key still does (negative).
  assert.equal(block({ key: 'authz.repoint', action: 'blocked', userId: 'u' }), true);
});

test('a former member in a card\'s assignees is dropped without a record; a stranger is recorded', async () => {
  const src = read('server/models/cards.js');
  const start = src.indexOf('async function assignableOnBoard(');
  const fn = src.slice(start, src.indexOf('\n}\n', start) + 2);
  const records = [];
  const context = vm.createContext({ canAssignCardMember: (board, id) => board.members.some(m => m.userId === id && m.isActive),
    require: () => ({ record: r => records.push(r) }), Array });
  vm.runInContext(`${fn}\nthis.assignableOnBoard = assignableOnBoard;`, context);
  const board = { _id: 'b', members: [{ userId: 'active', isActive: true }, { userId: 'former', isActive: false }] };
  assert.deepEqual([...await context.assignableOnBoard(board, ['active', 'former'])], ['active']);
  assert.equal(records.length, 0, 'a removed member written back is not an attempt');
  assert.deepEqual([...await context.assignableOnBoard(board, ['active', 'stranger'])], ['active']);
  assert.equal(records.length, 1);
  assert.match(records[0].detail, /stranger/);
});

test('history restore, exports, imports and unchanged parents record only attempts', () => {
  assert.match(read('server/lib/historyReadScope.js'), /canEditCardOrLinkedCard\(userId, card, board, \{ recordDenial: false \}\)/);
  for (const file of ['models/export.js', 'models/exportCharts.js']) {
    assert.match(read(file), /if \(board && user && board\.isVisibleBy\(user\)\) return;/, file);
  }
  const transfer = read('server/lib/secureTransfer.js');
  assert.match(transfer, /const limitOnly = \/limit exceeded\/\.test/);
  assert.match(transfer, /severity: limitOnly \? 'medium' : 'high',/);
  const cards = read('server/models/cards.js');
  assert.match(cards, /if \(req\.body\.parentId !== beforeEdit\.parentId\) \{\s*await assertParentCardIsVisible/);
  assert.match(cards, /if \(!beforeEdit\) \{\s*sendJsonResult\(res, \{ code: 404/);
});
