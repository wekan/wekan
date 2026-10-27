'use strict';

// StampBleed (found reviewing the patch for #6813): a checklist, checklist
// item or text note inserted on one's OWN card - which the insert allow rules
// check - could carry ANOTHER board's id, which the server kept and the board
// publication publishes by; and an item could name another card's checklist,
// which draws it. A write into a private board one is not a member of. The
// server now takes boardId from the card on insert, and refuses and records
// the forged insert (Admin Panel / Problems, StampBleed).
// Run: node tests/stampBleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const pending = [];
const test = (name, fn) => pending.push([name, fn]);

// The real deny function, run against stubs.
const src = read('server/lib/cardChildStamp.js');
const body = src.slice(src.indexOf('export async function denyForgedCardChildInsert('), src.indexOf('// StampBleed, attachments:'))
  .replace('export async function', 'async function');
const cards = { mine: { boardId: 'own' }, victim: { boardId: 'private' } };
const checklists = { myList: { cardId: 'mine' }, victimList: { cardId: 'victim' } };
const recorded = [];
const make = new Function('Cards', 'Checklists', 'require', `${body}\nreturn denyForgedCardChildInsert;`);
const deny = make(
  { findOneAsync: async id => cards[id] || null },
  { findOneAsync: async id => checklists[id] || null },
  name => { assert.strictEqual(name, '/server/lib/securityLog'); return { record: evt => recorded.push(evt) }; },
);

test('the attack: own card, another board\'s id - refused and recorded as StampBleed', async () => {
  recorded.length = 0;
  for (const [doc, opts] of [
    [{ cardId: 'mine', boardId: 'private', title: 'x' }, { source: 'ddp:checklist-insert' }],
    [{ cardId: 'mine', boardId: 'private', text: 'x' }, { source: 'ddp:card-text-note-insert' }],
    [{ cardId: 'mine', boardId: 'private', checklistId: 'myList' }, { source: 'ddp:checklist-item-insert', checklist: true }],
  ]) assert.strictEqual(await deny(doc, opts), true, opts.source);
  assert.strictEqual(recorded.length, 3);
  for (const evt of recorded) {
    assert.strictEqual(evt.key, 'authz.card-child-stamp');
    assert.strictEqual(evt.action, 'blocked');
  }
});

test('the attack: an item on one\'s own card into another card\'s checklist - refused', async () => {
  recorded.length = 0;
  assert.strictEqual(await deny({ cardId: 'mine', checklistId: 'victimList' }, { source: 's', checklist: true }), true);
  assert.strictEqual(await deny({ cardId: 'mine', checklistId: 'gone' }, { source: 's', checklist: true }), true, 'an unknown checklist too');
  assert.strictEqual(await deny({ cardId: 'mine' }, { source: 's', checklist: true }), true, 'and none');
  assert.strictEqual(recorded.length, 3);
});

test('negative: what WeKan\'s own client sends is not refused, and not recorded', async () => {
  recorded.length = 0;
  // Checklists and items without a boardId, a text note with its card's.
  assert.strictEqual(await deny({ cardId: 'mine', title: 'Steps' }, { source: 's' }), false);
  assert.strictEqual(await deny({ cardId: 'mine', checklistId: 'myList' }, { source: 's', checklist: true }), false);
  assert.strictEqual(await deny({ cardId: 'mine', boardId: 'own', text: 'n' }, { source: 's' }), false);
  // A missing card is the allow rule's to refuse - nothing to attribute here.
  assert.strictEqual(await deny({ cardId: 'gone', boardId: 'private' }, { source: 's' }), false);
  assert.strictEqual(recorded.length, 0, 'ordinary use is never logged');
});

test('attachments: a direct insert on one\'s own card with another board\'s meta.boardId - refused', async () => {
  const a = src.slice(src.indexOf('export async function denyForgedAttachmentInsert(')).replace('export async function', 'async function');
  const denyAttachment = new Function('Cards', 'require', `${a}\nreturn denyForgedAttachmentInsert;`)(
    { findOneAsync: async id => cards[id] || null },
    () => ({ record: evt => recorded.push(evt) }),
  );
  recorded.length = 0;
  assert.strictEqual(await denyAttachment({ meta: { cardId: 'mine', boardId: 'private' } }, { source: 's' }), true);
  assert.strictEqual(recorded.length, 1);
  assert.strictEqual(recorded[0].key, 'authz.card-child-stamp');
  // Negative: its own board, none, or a board-level image - not this rule's.
  for (const meta of [{ cardId: 'mine', boardId: 'own' }, { cardId: 'mine' }, { boardId: 'private', source: 'board-background' }]) {
    assert.strictEqual(await denyAttachment({ meta }, { source: 's' }), false, JSON.stringify(meta));
  }
  assert.strictEqual(recorded.length, 1);
});

test('the three collections refuse it, and the server stamps the card\'s board on insert', () => {
  for (const [file, coll, source, checklist] of [
    ['server/permissions/checklists.js', 'Checklists', 'ddp:checklist-insert', false],
    ['server/permissions/checklistItems.js', 'ChecklistItems', 'ddp:checklist-item-insert', true],
    ['server/permissions/cardTextNotes.js', 'CardTextNotes', 'ddp:card-text-note-insert', false],
  ]) {
    const s = read(file);
    assert.ok(s.includes(`${coll}.deny({\n  async insert(userId, doc) {\n    return await denyForgedCardChildInsert(doc, { source: '${source}'${checklist ? ', checklist: true' : ''} });`), file);
  }
  for (const [file, coll] of [['server/models/checklistItems.js', 'ChecklistItems'], ['server/models/checklists.js', 'Checklists']]) {
    const hook = read(file).slice(read(file).indexOf(`${coll}.before.insert(`));
    assert.match(hook, /^[^]*?if \(doc\.cardId\) \{\n\s+const card = await ReactiveCache\.getCard\(doc\.cardId\);\n\s+if \(card\) \{\n\s+doc\.boardId = card\.boardId;/);
  }
  assert.match(read('models/cardTextNotes.js'), /CardTextNotes\.before\.insert\(async \(userId, doc\) => \{\n\s+if \(!doc\.cardId\) return;\n\s+const card = await ReactiveCache\.getCard\(doc\.cardId\);\n\s+if \(card && card\.boardId\) doc\.boardId = card\.boardId;/);
});

test('the catalog names it as the Hall of Fame does', () => {
  const cat = read('models/lib/securityCategories.js');
  assert.match(cat, /'authz\.card-child-stamp': \{ category: 'authz', bleed: 'StampBleed', severity: 'high', cwe: 'CWE-639' \},/);
  // Wrapped so logging can never break the guard.
  assert.match(src, /try \{\n\s+require\('\/server\/lib\/securityLog'\)\.record\(\{[\s\S]*?\}\);\n\s+\} catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
});

test('negative: every card-child collection checks the board on insert, not only these three', () => {
  // models/lib/cardChildrenBoard.js lists what follows a card: each must tie
  // its board to its card when a client inserts it.
  const { CARD_CHILD_COLLECTIONS } = require('../models/lib/cardChildrenBoard.js');
  const guard = {
    CardComments: () => /commentCardMatchesBoard\(card, doc\.cardId, doc\.boardId\)/.test(read('server/permissions/cardComments.js')),
    // A reaction is authorized by the board it is stamped with (its allow rule
    // reads doc.boardId), so the stamp is what is checked - and RepointBleed
    // keeps it there.
    CardCommentReactions: () => /allowIsBoardMemberCommentOnly\(userId, await Boards\.findOneAsync\(doc\.boardId\)\)/.test(read('server/permissions/cardCommentReactions.js')),
    CardTextNotes: () => read('server/permissions/cardTextNotes.js').includes('denyForgedCardChildInsert'),
    Checklists: () => read('server/permissions/checklists.js').includes('denyForgedCardChildInsert'),
    ChecklistItems: () => read('server/permissions/checklistItems.js').includes('denyForgedCardChildInsert'),
    // A direct insert is refused here; an upload is authorized and stamped by
    // models/attachments.server.js (tests/uploadBleed.test.cjs).
    Attachments: () => read('server/permissions/attachments.js').includes("denyForgedAttachmentInsert(fileObj, { source: 'ddp:attachment-insert' })")
      && read('models/attachments.server.js').includes('file.meta = { ...meta, ...decision.stamp };'),
  };
  for (const child of CARD_CHILD_COLLECTIONS) {
    assert.ok(guard[child.model], `${child.model}: a card child with no insert board check listed here`);
    assert.ok(guard[child.model](), `${child.model}: its insert board check is gone`);
  }
});

(async () => {
  let passed = 0;
  console.log('stampBleed:');
  for (const [name, fn] of pending) { await fn(); passed += 1; console.log('  ok -', name); }
  console.log(`stampBleed: ${passed} passed`);
})().catch(e => { console.error(e); process.exit(1); });
