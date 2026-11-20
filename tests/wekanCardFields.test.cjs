'use strict';

// A WeKan board exported and imported back keeps every field of the current
// schema: the WeKan JSON export writes the whole board and card documents, and
// the import wrote 32 of 210 board fields and about 30 of 87 card fields -
// every Board Settings choice, the flow policies, a card's flow fields, votes,
// planning poker, stickers, locations and drawings came back as the defaults.
// This holds models/lib/wekanBoardFields.js and wekanCardFields.js to the
// schemas, so a field added to WeKan is either imported or named with the
// reason it is not.
// Run: node tests/wekanCardFields.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

// The top-level fields of a collection's schema.
function schemaFields(file) {
  const source = read(file);
  const start = source.indexOf('attachSchema(');
  const body = source.slice(start, source.indexOf('\n);', start));
  const fields = [...body.matchAll(/^ {4}([A-Za-z_]+): \{/gm)].map(m => m[1]);
  // Spread in from a helper (models/lib/notificationDelivery.js).
  for (const m of body.matchAll(/\.\.\.deliverySchemaFields\('([A-Za-z]+)'\)/g)) fields.push(m[1]);
  return [...new Set(fields)];
}

async function main() {
  const cardFields = await import('../models/lib/wekanCardFields.js');
  const boardFields = await import('../models/lib/wekanBoardFields.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };
  // What wekanCreator writes itself: a field it names outside the two helpers' imports.
  const creator = read('models/wekanCreator.js').replace(/^import .*$/gm, '');
  const scrum = read('server/lib/scrumTransferImport.js');
  const writtenByCreator = field => new RegExp(`\\b${field}\\b`).test(creator) || new RegExp(`\\b${field}\\b`).test(scrum);

  test('every card field is imported, or named with the reason it is not', () => {
    const special = ['flow', 'vote', 'poker', 'drawings', 'archivedAt'];
    const missing = schemaFields('models/cards.js').filter(field => !cardFields.COPIED.includes(field)
      && !special.includes(field) && !(field in cardFields.NOT_COPIED) && !writtenByCreator(field)
      && !cardFields.WRITTEN_ELSEWHERE.includes(field));
    // ...and those really are: the subtask pass writes the parents.
    assert.match(read('models/wekanCreator.js'), /\$set: parentFields\(parentsInNewBoard\)/);
    assert.deepEqual(missing, []);
  });

  test('every board field is imported, or named with the reason it is not', () => {
    const missing = schemaFields('models/boards.js').filter(field => !boardFields.BOARD_COPIED.includes(field)
      && !(field in boardFields.NOT_COPIED) && !writtenByCreator(field));
    assert.deepEqual(missing, []);
    // Negative: nothing is both copied and refused, and every listed field exists.
    const schema = new Set(schemaFields('models/boards.js'));
    assert.deepEqual(boardFields.BOARD_COPIED.filter(f => f in boardFields.NOT_COPIED), []);
    assert.deepEqual(boardFields.BOARD_COPIED.filter(f => !schema.has(f)), [], 'a copied board field the schema does not have');
    const cardSchema = new Set(schemaFields('models/cards.js'));
    assert.deepEqual(cardFields.COPIED.filter(f => !cardSchema.has(f)), [], 'a copied card field the schema does not have');
  });

  test('a card\'s flow fields, vote, poker, stickers and drawings come back, users mapped', () => {
    const out = cardFields.wekanCardFields({
      dueComplete: true, email: { direction: 'in', subject: 'Order', messageId: '<a@b>' },
      cardKind: 'bug', mapX: 0.4, mapY: 0.6, stickers: [{ icon: 'star', name: 'Star', highlight: true, position: 1 }],
      locations: [{ _id: 'l', name: 'HQ', latitude: 60.1, longitude: 24.9 }], listEnteredAt: '2026-11-01T10:00:00Z',
      shownFields: ['dueAt'], columnSetValues: { set1: 'col2' }, archived: true, archivedAt: '2026-11-02T00:00:00Z',
      flow: { blocked: true, blockedReason: 'Waiting for parts', blockedBy: 'old1', blockedAt: '2026-11-03T00:00:00Z', classOfService: 'expedite', moscow: 'must', wsjf: 12 },
      vote: { question: 'Ship it?', positive: ['old1', 'gone'], negative: ['old2'], end: '2026-12-01T00:00:00Z', public: true },
      poker: { question: true, three: ['old1'], eight: ['old2', 'gone'], estimation: 5 },
      drawings: [{ _id: 'd1', strokes: [[1, 2]], width: 10, height: 10, pngAttachmentId: 'a-old' }, { _id: 'd2', strokes: [], pngAttachmentId: 'a-lost' }],
    }, { members: { old1: 'new1', old2: 'new2' }, attachmentIds: { 'a-old': 'a-new' } });
    assert.equal(out.cardKind, 'bug');
    assert.equal(out.dueComplete, true);
    assert.deepEqual(out.email, { direction: 'in', subject: 'Order', messageId: '<a@b>' });
    assert.deepEqual(out.stickers, [{ icon: 'star', name: 'Star', highlight: true, position: 1 }]);
    assert.deepEqual(out.columnSetValues, { set1: 'col2' });
    assert.equal(out.listEnteredAt.toISOString(), '2026-11-01T10:00:00.000Z');
    assert.equal(out.archivedAt.toISOString(), '2026-11-02T00:00:00.000Z');
    assert.deepEqual({ ...out.flow, blockedAt: out.flow.blockedAt.toISOString() }, { blocked: true, blockedReason: 'Waiting for parts',
      blockedBy: 'new1', blockedAt: '2026-11-03T00:00:00.000Z', classOfService: 'expedite', moscow: 'must', wsjf: 12 });
    assert.deepEqual(out.vote.positive, ['new1']);
    assert.deepEqual(out.vote.negative, ['new2']);
    assert.equal(out.vote.end.toISOString(), '2026-12-01T00:00:00.000Z');
    assert.deepEqual([out.poker.three, out.poker.eight, out.poker.one, out.poker.estimation], [['new1'], ['new2'], [], 5]);
    assert.deepEqual(out.drawings.map(d => d.pngAttachmentId), ['a-new', undefined], 'a PNG whose attachment did not come is dropped');
  });

  test('negative: running timers, trash and sync state, and other boards\' ids are not imported', () => {
    const out = cardFields.wekanCardFields({ deletedAt: new Date(), pomodoroStartAt: new Date(), syncExternalId: 'x', linkedId: 'other',
      flowStartAt: new Date(), customFieldLinks: [{ cardId: 'c', mode: 'both', userId: 'u' }], archivedAt: '2026-11-02T00:00:00Z',
      flow: { blocked: true, blockedBy: 'stranger' } });
    assert.deepEqual(Object.keys(out), ['flow'], 'archivedAt only for an archived card');
    assert.equal(out.flow.blockedBy, undefined, 'a user not on the board is not who blocked it');
  });

  test('Board Settings come back, lists remapped; negative: access and inbound mail are not set by a file', () => {
    const out = boardFields.wekanBoardFields({
      allowsBlockedOnCard: true, allowsListPolicies: true, personWipLimit: 3, commitmentListId: 'L2', cardFieldOrder: ['dueAt', 'labels'],
      boardViewSettings: { 'board-view-table': { showOnPublic: false } }, columnSets: [{ _id: 's', name: 'S', columns: [] }],
      wipLimitGroups: [{ _id: 'g', name: 'Dev', listIds: ['L1', 'L9'], limit: 5, enabled: true }, { _id: 'h', name: 'Gone', listIds: ['L9'] }],
      archived: false, archivedAt: '2026-01-01T00:00:00Z', announcement: { enabled: true, body: 'Hi', updatedAt: '2026-11-01T00:00:00Z' },
      allowsInstanceEditing: true, orgs: [{ orgId: 'o' }], teams: [{ teamId: 't' }], domains: ['example.com'],
      emailToCard: { enabled: true, listId: 'L1' }, subtasksDefaultBoardId: 'other', mapImageAttachmentId: 'a',
    }, boardFields.BOARD_COPIED, { lists: { L1: 'N1', L2: 'N2' } });
    assert.equal(out.allowsBlockedOnCard, true);
    assert.equal(out.personWipLimit, 3);
    assert.equal(out.commitmentListId, 'N2');
    assert.deepEqual(out.cardFieldOrder, ['dueAt', 'labels']);
    assert.deepEqual(out.wipLimitGroups, [{ _id: 'g', name: 'Dev', listIds: ['N1'], limit: 5, enabled: true }]);
    assert.equal(out.announcement.updatedAt.toISOString(), '2026-11-01T00:00:00.000Z');
    assert.equal(out.archivedAt, undefined, 'a board that is not archived has no archive date');
    for (const field of ['allowsInstanceEditing', 'orgs', 'teams', 'domains', 'emailToCard', 'subtasksDefaultBoardId', 'mapImageAttachmentId']) {
      assert.equal(out[field], undefined, field);
    }
    const unmapped = boardFields.wekanBoardFields({ commitmentListId: 'L9' }, boardFields.BOARD_COPIED, { lists: {} });
    assert.equal(unmapped.commitmentListId, undefined, 'a list that did not come is no commitment point');
  });

  test('the WeKan import writes them, settings once the lists exist, and reports what the schema refuses', () => {
    const src = read('models/wekanCreator.js');
    assert.match(src, /Object\.assign\(cardToCreate, wekanCardFields\(card, \{ members: this\.members, attachmentIds: this\.attachmentIds \}\)\);/);
    const stages = src.slice(src.indexOf('return runImportPipeline(this, board, ['));
    assert.ok(stages.indexOf("'createLists'") < stages.indexOf("'createBoardSettings'"), 'after the lists');
    assert.ok(stages.indexOf("'createSwimlanes'") < stages.indexOf("'createBoardSettings'"));
    assert.ok(stages.indexOf("'createBoardSettings'") < stages.indexOf("'createCards'"));
    assert.match(src, /reason: `Board Settings \$\{field\} is not a value this WeKan accepts/);
    assert.match(src, /\{ method: 'recordLosses' \},\n\s+\]\);/);
    assert.match(src, /recordImportLosses\(\{ source: 'wekan', unsupported: this\.losses/);
  });

  console.log(`wekanCardFields: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
