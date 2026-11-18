'use strict';
// ListLockBulkBleed (GHSA-83w9-74mx-7v83): a board admin can refuse a role
// write access in one list (#4527, roleExceptions). The REST bulk delete and
// bulk label routes take their cards from the BODY, so no URL names a list and
// neither asked one; and the Meteor methods archiveSelectedCards, copyCard and
// createLinkedCard write from server code, past the Cards allow/deny rules that
// apply the exception to client writes. A normal member the list refused could
// still delete, archive and relabel its cards and put new ones in it.
// Run: node --test tests/listLockBulkBleed.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { exceptionFor } = require('../models/lib/listPermissions');

class MeteorError extends Error {
  constructor(error, reason) { super(reason || error); this.error = error; this.reason = reason; }
}

// server/lib/listPermissionGate.js itself, with its two imports stubbed.
function loadGate({ lists, records }) {
  const src = read('server/lib/listPermissionGate.js')
    .replace(/^import .*$/gm, '')
    .replace(/^export async function/gm, 'async function');
  const Lists = { findOneAsync: async id => lists[id] || null };
  const stubRequire = name => {
    if (name === '/models/lib/listPermissions') return { exceptionFor };
    if (name === '/server/lib/securityLog') return { record: entry => records.push(entry) };
    if (name === 'meteor/meteor') return { Meteor: { Error: MeteorError } };
    throw new Error(`unexpected require ${name}`);
  };
  const allowWrite = (userId, board) => !!(board && board.members.some(m => m.userId === userId && m.isActive));
  // eslint-disable-next-line no-new-func
  return new Function('require', 'Lists', 'allowIsBoardMemberWithWriteAccess', 'allowIsBoardMemberCommentOnly',
    `${src}\nreturn { assertCardListsNotRefused, assertListsWritable, assertListNotRefused };`)(
    stubRequire, Lists, allowWrite, allowWrite);
}

// The reporter's board: the attacker is an active normal member, the owner the
// board admin, and "Locked List" refuses normal.write.
const board = { _id: 'board', permission: 'private',
  members: [{ userId: 'owner', isActive: true, isAdmin: true }, { userId: 'attacker', isActive: true }] };
const lists = {
  locked: { _id: 'locked', boardId: 'board', roleExceptions: { normal: { write: false } } },
  open: { _id: 'open', boardId: 'board' },
  granted: { _id: 'granted', boardId: 'board', roleExceptions: { normal: { write: true } } },
  elsewhere: { _id: 'elsewhere', boardId: 'other-board', roleExceptions: { normal: { write: false } } },
};
const card = listId => ({ _id: `card-${listId}`, boardId: 'board', listId });

test('the reporter\'s bulk delete and bulk labels: a locked list refuses the whole request', async () => {
  const records = [];
  const gate = loadGate({ lists, records });
  for (const source of ['rest:cards/bulk-delete', 'rest:cards/labels']) {
    await assert.rejects(gate.assertCardListsNotRefused('attacker', board, [card('open'), card('locked')], 'write', source),
      error => error.statusCode === 403);
  }
  assert.deepStrictEqual(records.map(r => [r.key, r.action, r.source, r.userId]), [
    ['authz.list-locked-bulk', 'blocked', 'rest:cards/bulk-delete', 'attacker'],
    ['authz.list-locked-bulk', 'blocked', 'rest:cards/labels', 'attacker'],
  ]);
});

test('the reporter\'s archive, copy and link: a locked list refuses the method, unrecorded', async () => {
  const records = [];
  const gate = loadGate({ lists, records });
  await assert.rejects(gate.assertListsWritable('attacker', board, ['open', 'locked']),
    error => error.error === 'not-authorized');
  // Copy Card and Multi-Selection reach these in ordinary use: not an attempt.
  assert.deepStrictEqual(records, []);
});

test('negative: what the list does not refuse still goes through', async () => {
  const records = [];
  const gate = loadGate({ lists, records });
  const cards = [card('open'), card('granted'), { _id: 'no-list', boardId: 'board' }];
  await gate.assertCardListsNotRefused('attacker', board, cards, 'write', 'rest:cards/labels');
  await gate.assertListsWritable('attacker', board, ['open', 'granted', '', undefined]);
  // The board admin is never restricted by an exception.
  await gate.assertCardListsNotRefused('owner', board, [card('locked')], 'write', 'rest:cards/bulk-delete');
  await gate.assertListsWritable('owner', board, ['locked']);
  // A list on another board has no say on this one.
  await gate.assertListsWritable('attacker', board, ['elsewhere']);
  await gate.assertCardListsNotRefused('attacker', board, [], 'write', 'rest:cards/labels');
  assert.deepStrictEqual(records, []);
});

// The source of one handler or method, up to the next one.
function section(src, marker) {
  const at = src.indexOf(marker);
  assert.ok(at >= 0, `missing ${marker}`);
  const ends = ['\nWebApp.handlers.', '\n  async ', '\nasync function ', '\nfunction ']
    .map(end => src.indexOf(end, at + marker.length)).filter(i => i > 0);
  return src.slice(at, Math.min(...ends, src.length));
}

function before(body, guard, write, name) {
  const g = body.indexOf(guard);
  const w = body.indexOf(write);
  assert.ok(g >= 0, `${name} asks the list (${guard})`);
  assert.ok(w >= 0, `${name} still writes with ${write}`);
  assert.ok(g < w, `${name} asks the list before it writes`);
}

test('each reported path asks the list before its first write', () => {
  const src = read('server/models/cards.js');
  const bulkDelete = section(src, "WebApp.handlers.delete('/api/boards/:boardId/cards/bulk'");
  before(bulkDelete, 'assertCardListsNotRefused(', 'removeClaimedCard(', 'DELETE cards/bulk');
  assert.match(bulkDelete, /selector: \{ boardId: paramBoardId, listId: card\.listId \}/,
    'the removal is keyed on the list that was checked');
  const labels = section(src, "WebApp.handlers.post('/api/boards/:boardId/cards/labels'");
  assert.match(labels, /fields: \{[^}]*listId: 1/, 'the label query reads each card\'s list');
  before(labels, 'assertCardListsNotRefused(', 'Cards.direct.updateAsync(', 'POST cards/labels');
  assert.match(labels, /listId: card\.listId, archived: false/, 'the relabel is keyed on the list that was checked');
  before(section(src, '  async archiveSelectedCards('), 'assertListsWritable(', '.archive()', 'archiveSelectedCards');
  before(section(src, '  async copyCard('), 'assertListsWritable(', 'copy.copy(', 'copyCard');
  before(section(src, 'async function createLinkedCardFor('), 'assertListsWritable(', 'Cards.insertAsync(', 'createLinkedCard');
});

// The same shape beyond the report: every other server path that writes a card
// in, or into, a list on board-level rights alone. [file, where it starts,
// the list check, the first write it must precede].
const SIBLINGS = [
  ['server/models/cards.js', '  async createBoardFromCard(', 'assertListsWritable(', 'Cards.updateAsync('],
  ['server/models/cards.js', '  async addSubtaskCard(', 'assertListsWritable(', 'Cards.insertAsync('],
  ['server/models/cards.js', '  async createCardWithDueDate(', "listException(this.userId, destBoard, listId, 'write')", 'Cards.insertAsync('],
  ['server/methods/icsImport.js', 'async function importIcsCards(', 'assertListsWritable(', 'Cards.insertAsync('],
  ['server/methods/icsImport.js', "'/api/boards/:boardId/swimlanes/:swimlaneId/lists/:listId/ics'", 'assertListNotRefused(', 'importIcsCards('],
  ['server/emailView.js', '  async sendBoardEmail(', 'assertListsWritable(', 'Email.sendAsync('],
  ['server/emailToCard.js', 'export async function receiveBoardEmail(', 'listRefuses(thread.listId)', 'addEmailComment('],
  ['server/emailToCard.js', "  const { list, swimlane } = await placement(", 'listRefuses(list._id)', 'Cards.direct.insertAsync('],
  ['server/versionControlView.js', '  async vcsCreateIssue(', 'assertListsWritable(', 'Cards.insertAsync('],
  ['server/moveBoardObjects.js', '  async moveBoardObjects(', 'assertListsWritable(this.userId, sourceBoard, sourceListIds)', '.move('],
  ['server/models/changeHistory.js', 'async function applyRow(', 'assertRowListsWritable(', 'applier(row, content)'],
  ['models/userPositionHistory.js', '  async assertApplicable(', 'assertListsWritable(', 'tripCanary('],
  ['models/attachments.server.js', '  async renameAttachment(', 'assertListsWritable(', 'await rename(fileObj'],
  ['models/server/scopedImporter.js', '  async _importCards(', 'assertListsWritable(', 'Cards.direct.insertAsync('],
  ['server/rulesButton.js', "  async 'rules.runButton'(", 'assertListsWritable(', 'RulesHelper.performAction('],
];

test('every sibling path asks the list before its first write', () => {
  for (const [file, start, guard, write] of SIBLINGS) {
    const src = read(file);
    const at = src.indexOf(start);
    assert.ok(at >= 0, `${file}: ${start}`);
    const body = src.slice(at, at + 12000);
    before(body, guard, write, `${file} ${start.trim()}`);
  }
  // Undo and redo name the list the card moves to, on that card's own board.
  const position = read('models/userPositionHistory.js');
  assert.match(position, /assertApplicable\(\[this\.entityType === 'card' \? this\.previousBoardId : null\],\s*this\.entityType === 'card' \? this\.previousListId : null\)/);
  assert.match(position, /assertApplicable\(\[this\.entityType === 'card' \? this\.newBoardId : null\],\s*this\.entityType === 'card' \? this\.newListId : null\)/);
  // History's undo of a move judges the list on the board the row puts it on.
  assert.match(read('server/models/changeHistory.js'), /const boardId = content\.boardId \|\| card\.boardId;/);
});

// The shape, wherever it is: a REST card route whose URL names no list and no
// card takes its cards from the body - so it has to ask every card's list.
test('negative: every REST card write without :listId or :cardId asks each card\'s list', () => {
  const files = ['server/models/cards.js', 'server/models/checklists.js', 'server/models/checklistItems.js',
    'server/models/customFields.js', 'server/attachmentApi.js', 'server/routes/attachmentApi.js'];
  const found = [];
  for (const file of files) {
    if (!fs.existsSync(path.join(ROOT, file))) continue;
    const src = read(file);
    for (const m of src.matchAll(/WebApp\.handlers\.(post|put|delete|patch)\(\s*['"`](\/api\/boards\/:boardId\/cards[^'"`]*)['"`]/g)) {
      if (/:listId|:cardId/.test(m[2])) continue;
      const next = src.indexOf('WebApp.handlers.', m.index + 1);
      const body = src.slice(m.index, next > 0 ? next : src.length);
      found.push(m[2]);
      assert.match(body, /assertCardListsNotRefused\(|assertListNotRefused\(/, `${m[1].toUpperCase()} ${m[2]} asks each card's list`);
    }
  }
  assert.ok(found.includes('/api/boards/:boardId/cards/bulk') && found.includes('/api/boards/:boardId/cards/labels'), found.join(', '));
});

test('the REST refusal is recorded in Admin Panel -> Problems, and never breaks the guard', () => {
  const gate = read('server/lib/listPermissionGate.js');
  const bulk = section(gate, 'export async function assertCardListsNotRefused(');
  assert.match(bulk, /key: 'authz\.list-locked-bulk', action: 'blocked'/);
  assert.match(bulk, /catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
  // The methods' refusal is reachable from the UI, so it records nothing.
  assert.doesNotMatch(section(gate, 'export async function assertListsWritable('), /securityLog/);
  const catalog = read('models/lib/securityCategories.js');
  assert.match(catalog, /'authz\.list-locked-bulk': \{ category: 'authz', bleed: 'ListLockBulkBleed', severity: 'medium', cwe: 'CWE-863' \}/);
});
