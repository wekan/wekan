'use strict';

// #6813: dragging a checklist item within its own card sets cardId and
// checklistId to where the item already is; for a comment-only member or a
// Worker their own board is "a board they cannot write to", so the ordinary
// drag tripped ChecklistBleed's cross-board canary and named them in Admin
// Panel / Problems as an attacker. The board the document is already on is
// not a destination now - and that board is its SOURCE CARD's board, the one
// the allow rule decides on, never the document's own boardId, which a client
// could set on insert (the reporter's patch read doc.boardId: an item on the
// attacker's card carrying the victim board's id would have passed as
// "staying" while moved onto a victim card).
// Run: node tests/checklistSameBoardCanary6813.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
const pending = [];
function test(name, fn) { pending.push([name, fn]); }

// The real functions of server/lib/utils.js, run against stubs.
const utils = read('server/lib/utils.js');
const slice = (from, to) => utils.slice(utils.indexOf(from), utils.indexOf(to, utils.indexOf(from) + 1));
const src = [
  slice('async function denyMoveToUnwritableBoard(', '\n}\n') + '\n}\n',
  slice('export async function sourceBoardOfCardChild(', '\n}\n') + '\n}\n',
  slice('export async function denyCrossBoardMoveByCard(', '\n}\n') + '\n}\n',
  slice('export async function denyCrossBoardMoveByChecklistItem(', '\n}\n') + '\n}\n',
].join('\n').replace(/export async function/g, 'async function');

const boards = {
  own: { writers: ['writer'] },         // the commenter's own board: they cannot write
  victim: { writers: ['victimOwner'] },
  attacker: { writers: ['commenter', 'writer'] },
};
const cards = { ownCard: { boardId: 'own' }, victimCard: { boardId: 'victim' }, attackerCard: { boardId: 'attacker' } };
const checklists = { ownChecklist: { cardId: 'ownCard' }, victimChecklist: { cardId: 'victimCard' } };
const make = new Function('Boards', 'Cards', 'Checklists', 'allowIsBoardMemberWithWriteAccess',
  `${src}\nreturn { denyMoveToUnwritableBoard, sourceBoardOfCardChild, denyCrossBoardMoveByCard, denyCrossBoardMoveByChecklistItem };`);
const f = make(
  { findOneAsync: async id => boards[id] || null },
  { findOneAsync: async id => cards[id] || null },
  { findOneAsync: async id => checklists[id] || null },
  (userId, board) => Boolean(board && board.writers.includes(userId)),
);

test('the reporter\'s drag: a commenter reordering items on their own card is no cross-board move', async () => {
  const doc = { cardId: 'ownCard', checklistId: 'ownChecklist' };
  const source = await f.sourceBoardOfCardChild(doc);
  assert.strictEqual(source, 'own');
  assert.strictEqual(await f.denyCrossBoardMoveByChecklistItem('commenter', { $set: { cardId: 'ownCard', checklistId: 'ownChecklist' } }, source), false);
  assert.strictEqual(await f.denyCrossBoardMoveByCard('commenter', { $set: { cardId: 'ownCard' } }, source), false, 'a checklist or text note too');
});

test('negative: a move off the board to one the caller cannot write to is still denied', async () => {
  const source = await f.sourceBoardOfCardChild({ cardId: 'attackerCard' });
  assert.strictEqual(await f.denyCrossBoardMoveByChecklistItem('commenter', { $set: { checklistId: 'victimChecklist' } }, source), true);
  assert.strictEqual(await f.denyCrossBoardMoveByChecklistItem('commenter', { $set: { cardId: 'victimCard' } }, source), true);
  assert.strictEqual(await f.denyCrossBoardMoveByCard('commenter', { $set: { boardId: 'victim' } }, source), true);
});

test('negative: an item whose own boardId names the victim board is still denied - the source is its card\'s board', async () => {
  const forged = { cardId: 'attackerCard', boardId: 'victim' };
  const source = await f.sourceBoardOfCardChild(forged);
  assert.strictEqual(source, 'attacker', 'never the document\'s own boardId');
  assert.strictEqual(await f.denyCrossBoardMoveByChecklistItem('commenter', { $set: { cardId: 'victimCard', checklistId: 'victimChecklist' } }, source), true);
});

test('negative: unknown destinations and a missing source still fail closed', async () => {
  assert.strictEqual(await f.denyCrossBoardMoveByChecklistItem('commenter', { $set: { checklistId: 'nope' } }, 'own'), true);
  assert.strictEqual(await f.denyCrossBoardMoveByCard('commenter', { $set: { cardId: 'nope' } }, 'own'), true);
  assert.strictEqual(await f.sourceBoardOfCardChild({ cardId: 'gone' }), null);
  assert.strictEqual(await f.denyCrossBoardMoveByCard('commenter', { $set: { cardId: 'victimCard' } }, null), true);
  assert.strictEqual(await f.denyMoveToUnwritableBoard('commenter', 'victim', ''), true, 'an empty source skips nothing');
});

test('the three deny rules pass the source card\'s board, and nothing passes a document\'s own boardId', () => {
  for (const [file, fn, key] of [
    ['server/permissions/checklistItems.js', 'denyCrossBoardMoveByChecklistItem', 'checklist-item'],
    ['server/permissions/checklists.js', 'denyCrossBoardMoveByCard', 'checklist'],
    ['server/permissions/cardTextNotes.js', 'denyCrossBoardMoveByCard', 'cardTextNote'],
  ]) {
    const s = read(file);
    assert.ok(s.includes(`if (!(await ${fn}(userId, modifier, await sourceBoardOfCardChild(doc)))) return false;\n    return tripCanaryDeny('${key}.cross-board-move', { userId });\n  },\n  fetch: ['cardId'],`), file);
  }
  // The shape, anywhere on the server: no cross-board deny fed a document's boardId.
  const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return ['node_modules', 'tests'].includes(e.name) ? [] : walk(rel);
    return /\.js$/.test(e.name) ? [rel] : [];
  });
  for (const file of [...walk('server'), ...walk('models')]) {
    assert.ok(!/denyCrossBoardMoveBy\w+\([^)]*doc\s*&&\s*doc\.boardId|denyCrossBoardMoveBy\w+\([^)]*doc\.boardId/.test(read(file)), `${file}: a deny fed doc.boardId`);
  }
});

test('on insert the board is always the card\'s, not the client\'s', () => {
  for (const [file, coll] of [['server/models/checklistItems.js', 'ChecklistItems'], ['server/models/checklists.js', 'Checklists']]) {
    const s = read(file);
    const hook = s.slice(s.indexOf(`${coll}.before.insert(`), s.indexOf('});', s.indexOf(`${coll}.before.insert(`)));
    assert.match(hook, /if \(doc\.cardId\) \{\n\s+const card = await ReactiveCache\.getCard\(doc\.cardId\);\n\s+if \(card\) \{\n\s+doc\.boardId = card\.boardId;/, file);
    assert.ok(!/!doc\.boardId/.test(hook), `negative: ${file} no longer keeps a client's boardId`);
  }
  assert.match(read('models/cardTextNotes.js'), /if \(Meteor\.isServer\) \{\n\s+CardTextNotes\.before\.insert\(async \(userId, doc\) => \{\n\s+if \(!doc\.cardId\) return;\n\s+const card = await ReactiveCache\.getCard\(doc\.cardId\);\n\s+if \(card && card\.boardId\) doc\.boardId = card\.boardId;/);
});

(async () => {
  console.log('checklistSameBoardCanary6813:');
  for (const [name, fn] of pending) { await fn(); passed += 1; console.log('  ok -', name); }
  console.log(`checklistSameBoardCanary6813: ${passed} passed`);
})().catch(e => { console.error(e); process.exit(1); });
