'use strict';
// Decided 2026-11-18 (TODO.md): a list that refuses a role write access (#4527)
// also refuses that role's deleting, archiving, restoring and moving of the
// list, and deleting, archiving and moving a swimlane that holds cards in it -
// those do the same to the cards. Board admins are never restricted. Before,
// these were board structure, gated by board write access alone.
// Run: node --test tests/listLockStructure.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { exceptionFor } = require('../models/lib/listPermissions');

class MeteorError extends Error { constructor(error, reason) { super(reason || error); this.error = error; } }

function loadGate({ lists, cards, records = [] }) {
  const src = read('server/lib/listPermissionGate.js').replace(/^import .*$/gm, '').replace(/^export async function/gm, 'async function');
  const distinct = rows => ({ distinct: async (field, q) => [...new Set(rows
    .filter(r => Object.entries(q).every(([k, v]) => r[k] === v)).map(r => r[field]))] });
  const Lists = { findOneAsync: async id => lists[id] || null, rawCollection: () => distinct(Object.values(lists)) };
  const Cards = { rawCollection: () => distinct(cards) };
  const req = name => {
    if (name === '/models/lib/listPermissions') return { exceptionFor };
    if (name === '/server/lib/securityLog') return { record: e => records.push(e) };
    if (name === 'meteor/meteor') return { Meteor: { Error: MeteorError } };
    throw new Error(name);
  };
  const allow = () => true;
  // eslint-disable-next-line no-new-func
  return new Function('require', 'Lists', 'Cards', 'allowIsBoardMemberWithWriteAccess', 'allowIsBoardMemberCommentOnly',
    `${src}\nreturn { swimlaneRefusingListIds, assertSwimlaneListsWritable, assertSwimlaneListsNotRefused };`)(req, Lists, Cards, allow, allow);
}

const board = { _id: 'b', permission: 'private',
  members: [{ userId: 'owner', isActive: true, isAdmin: true }, { userId: 'member', isActive: true }] };
const lists = {
  locked: { _id: 'locked', boardId: 'b', roleExceptions: { normal: { write: false } } },
  open: { _id: 'open', boardId: 'b' },
  boundLocked: { _id: 'boundLocked', boardId: 'b', swimlaneId: 'empty-lane', roleExceptions: { normal: { write: false } } },
};
const cards = [
  { _id: 'c1', boardId: 'b', swimlaneId: 'lane', listId: 'locked' },
  { _id: 'c2', boardId: 'b', swimlaneId: 'lane', listId: 'open' },
  { _id: 'c3', boardId: 'b', swimlaneId: 'open-lane', listId: 'open' },
];

test('a swimlane with cards in a refusing list, or a refusing list bound to it, is refused', async () => {
  const records = [];
  const gate = loadGate({ lists, cards, records });
  assert.deepStrictEqual(await gate.swimlaneRefusingListIds('member', board, 'lane'), ['locked']);
  assert.deepStrictEqual(await gate.swimlaneRefusingListIds('member', board, 'empty-lane'), ['boundLocked']);
  await assert.rejects(gate.assertSwimlaneListsWritable('member', board, 'lane'), e => e.error === 'not-authorized');
  await assert.rejects(gate.assertSwimlaneListsNotRefused('member', board, 'lane', 'rest:swimlane-delete'), e => e.statusCode === 403);
  assert.deepStrictEqual(records.map(r => [r.key, r.source]), [['authz.list-locked', 'rest:swimlane-delete']]);
});

test('negative: an open swimlane, the board admin and a missing swimlane pass', async () => {
  const gate = loadGate({ lists, cards });
  assert.deepStrictEqual(await gate.swimlaneRefusingListIds('member', board, 'open-lane'), []);
  assert.deepStrictEqual(await gate.swimlaneRefusingListIds('owner', board, 'lane'), []);
  assert.deepStrictEqual(await gate.swimlaneRefusingListIds('member', board, ''), []);
  await gate.assertSwimlaneListsWritable('owner', board, 'lane');
});

function before(body, guard, write, name) {
  const g = body.indexOf(guard), w = body.indexOf(write);
  assert.ok(g >= 0 && w >= 0 && g < w, `${name}: ${guard} before ${write}`);
}

test('every list and swimlane path asks before it writes', () => {
  const listsSrc = read('server/models/lists.js');
  const method = name => listsSrc.slice(listsSrc.indexOf(`async ${name}(`), listsSrc.indexOf('\n  },', listsSrc.indexOf(`async ${name}(`)));
  before(method("'lists.softRemove'"), 'assertListsWritable(', 'softRemoveList(', 'lists.softRemove');
  before(method("'lists.restore'"), 'assertListsWritable(', 'restoreModifier()', 'lists.restore');
  before(method('moveList'), 'assertListsWritable(', 'Lists.updateAsync(', 'moveList');
  for (const [route, write, source] of [
    ["delete('/api/boards/:boardId/lists/:listId'", 'softRemoveList(', 'rest:list-delete'],
    ["post('/api/boards/:boardId/lists/:listId/archive'", 'list.archive()', 'rest:list-archive'],
    ["post('/api/boards/:boardId/lists/:listId/unarchive'", 'list.restore()', 'rest:list-unarchive'],
    ["'/api/boards/:boardId/lists/:listId/move'", 'Lists.direct.updateAsync(', 'rest:list-move'],
  ]) {
    const at = listsSrc.indexOf(route);
    assert.ok(at >= 0, route);
    const next = listsSrc.indexOf('WebApp.handlers.', at + route.length);
    const body = listsSrc.slice(at, next < 0 ? undefined : next);
    before(body, `'${source}'`, write, route);
  }
  const lanes = read('server/models/swimlanes.js');
  const del = lanes.slice(lanes.indexOf("delete('/api/boards/:boardId/swimlanes/:swimlaneId'"));
  before(del, "assertSwimlaneListsNotRefused(", 'Swimlanes.removeAsync(', 'REST swimlane delete');
  const pub = read('server/publications/swimlanes.js');
  before(pub.slice(pub.indexOf('async moveSwimlane(')), 'assertSwimlaneListsWritable(', 'swimlane.move(', 'moveSwimlane');
});

test('client writes are refused the same way, and the menu does not offer them', () => {
  const rules = read('server/listPermissions.js');
  assert.match(rules, /Lists\.deny\(\{\s*async update\(userId, doc, fieldNames\) \{\s*if \(!fieldNames\.some\(field => LIST_CARD_FIELDS\.includes\(field\)\)\) return false;/);
  assert.match(rules, /Swimlanes\.deny\(\{[\s\S]*?swimlaneRefusingListIds\(/);
  const menu = read('client/components/lists/listHeader.jade');
  assert.match(menu, /if mayWriteList\n\s+li\n\s+a\.js-archive-list-cards/);
  assert.match(menu, /if mayWriteList\n\s+hr\n\s+ul\.pop-over-list\n\s+li\n\s+a\.js-close-list/);
});

test('negative: renaming, recolouring and reordering a list are not refused', () => {
  const rules = read('server/listPermissions.js');
  const fields = /const LIST_CARD_FIELDS = \[([^\]]*)\]/.exec(rules)[1];
  for (const field of ['title', 'color', 'sort', 'wipLimit']) assert.ok(!fields.includes(`'${field}'`), field);
  assert.ok(!/const SWIMLANE_CARD_FIELDS = \[[^\]]*'(title|sort|color)'/.test(rules));
});
