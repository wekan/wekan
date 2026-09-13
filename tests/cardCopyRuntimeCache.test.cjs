"use strict";
(async () => {
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'models/cards.js'), 'utf8');
const copyBody = source.slice(source.indexOf('  async copy(boardId, swimlaneId, listId, cardIdMap = null) {'), source.indexOf('\n  async link('));
const linkStart = source.indexOf('  async link(');
const linkBody = source.slice(linkStart, source.indexOf('\n  list()', linkStart));
const { normalizeDependencies } = await import('../models/metadata/dependencies.js');
const { filterCopiedLabelIds } = await import('../server/lib/cardCopyHelpers.js');
const { buildCopiedSubtaskFields } = await import('../models/lib/subtaskCopy.js');
async function exercise({ sameBoard = false, cache = true, fail = false, withChildren = false, cardIdMap = null } = {}) {
  const original = {
    _id: 'original', boardId: 'source', swimlaneId: 'old-swimlane', listId: 'old-list',
    title: 'Template', labelIds: ['source-label'],
    customFields: [{ _id: 'source-field', value: 'kept' }],
    cardDependencies: [{ cardId: 'destination-card', type: 'related' }, { cardId: 'missing-card', type: 'related' }],
    ...(cache ? { __id: 'original' } : {}),
    async mapCustomFieldsToBoard() { return [{ _id: 'destination-field', value: 'kept' }]; },
  };
  Object.defineProperty(original, 'mapCustomFieldsToBoard', { enumerable: false });
  const before = JSON.stringify(original);
  const inserted = [], children = [];
  const boardId = sameBoard ? 'source' : 'destination';
  const Cards = { async insertAsync(document) {
    assert.equal(Object.hasOwn(document, '__id'), false, 'runtime cache must not reach schema validation');
    assert.equal(Object.hasOwn(document, '_id'), false, 'copies require a new document ID');
    if (fail) throw new Error('insert rejected');
    inserted.push(structuredClone(document)); return `new-${inserted.length}`;
  } };
  const ReactiveCache = {
    getCard: async id => id === original._id ? original : id === 'destination-card' ? { boardId } : null,
    getBoard: async id => ({ _id: id, labels: [{ _id: id === 'source' ? 'source-label' : 'destination-label', name: 'Shared' }], async getNextCardNumber() { return 7; } }),
    getChecklists: async query => withChildren && query.cardId === 'original' ? [{ async copy(id) { children.push(['checklist', id]); } }] : [],
    getCards: async () => withChildren ? [{ _id: 'child', __id: 'child', boardId: 'source', parentId: 'original', title: 'Child' }] : [],
    getCardComments: async () => withChildren ? [{ async copy(id, target) { children.push(['comment', id, target]); } }] : [],
  };
  const copy = new Function('ReactiveCache', 'Cards', 'Meteor', 'filterCopiedLabelIds', 'normalizeDependencies', 'require',
    `return ({${copyBody}}).copy;`)(ReactiveCache, Cards, { isServer: false }, filterCopiedLabelIds, normalizeDependencies,
      specifier => { assert.equal(specifier, './lib/subtaskCopy'); return { buildCopiedSubtaskFields }; });
  if (fail) await assert.rejects(copy.call(original, boardId, 'new-swimlane', 'new-list', cardIdMap), /insert rejected/);
  else assert.equal(await copy.call(original, boardId, 'new-swimlane', 'new-list', cardIdMap), 'new-1');
  assert.equal(JSON.stringify(original), before, 'successful and rejected copies must preserve the source card');
  if (!fail) {
    assert.equal(inserted[0].boardId, boardId);
    assert.equal(inserted[0].listId, 'new-list');
    assert.equal(inserted[0].swimlaneId, 'new-swimlane');
    assert.equal(inserted[0].cardNumber, 7);
    assert.equal(inserted[0].labelIds[0], sameBoard ? 'source-label' : 'destination-label');
    assert.equal(inserted[0].customFields[0]._id, sameBoard ? 'source-field' : 'destination-field');
    assert.equal(inserted[0].cardDependencies.length, cardIdMap ? 2 : 1);
    if (withChildren) {
      assert.equal(inserted[1].parentId, 'new-1'); assert.equal(inserted[1].boardId, boardId);
      assert.deepEqual(children, [['checklist', 'new-1'], ['comment', 'new-1', boardId]]);
    }
  }
}
await exercise({ withChildren: true });
await exercise({ sameBoard: true, cache: false });
await exercise({ fail: true });
const map = {}; await exercise({ cardIdMap: map }); assert.equal(map.original, 'new-1');
const linked = { _id: 'original', __id: 'original', boardId: 'source', title: 'Source', labelIds: ['label'] };
const beforeLink = JSON.stringify(linked);
const link = new Function('Cards', `return ({${linkBody}}).link;`)({ async insertAsync(document) {
  assert.equal(Object.hasOwn(document, '__id'), false); assert.equal(Object.hasOwn(document, '_id'), false);
  assert.equal(document.linkedId, 'original'); assert.equal(document.type, 'cardType-linkedCard');
  assert.equal(document.boardId, 'destination'); return 'linked';
} });
assert.equal(await link.call(linked, 'destination', 'swimlane', 'list'), 'linked');
assert.equal(JSON.stringify(linked), beforeLink);
console.log('card copy cache: 5 cases pass, including cross-board children, same-board copies, rejected inserts and linked cards');
})().catch(error => { console.error(error); process.exitCode = 1; });
