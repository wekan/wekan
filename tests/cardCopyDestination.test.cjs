'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validCardCopyDestination: valid } = require('../models/lib/cardCopyDestination');
const board = { _id: 'b' };
const lane = { _id: 'lane', boardId: 'b' };
const list = { _id: 'list', boardId: 'b' };
assert.equal(valid('b', 'lane', 'list', board, lane, list), true);
assert.equal(valid('b', 'lane', 'list', board, lane, { ...list, swimlaneId: '' }), true);
assert.equal(valid('b', 'lane', 'list', board, { ...lane, archived: true }, { ...list, archived: true }), true);
for (const records of [[{ ...board, deletedAt: new Date() }, lane, list], [board, { ...lane, deletedAt: new Date() }, list], [board, lane, { ...list, deletedAt: new Date() }]]) {
  assert.equal(valid('b', 'lane', 'list', ...records), false);
}
for (const bad of [undefined, null, {}, { _id: 'foreign' }]) {
  assert.equal(valid('b', 'lane', 'list', bad, lane, list), false);
  assert.equal(valid('b', 'lane', 'list', board, bad, list), false);
  assert.equal(valid('b', 'lane', 'list', board, lane, bad), false);
}
assert.equal(valid('b', 'lane', 'list', board, { ...lane, boardId: 'foreign' }, list), false);
assert.equal(valid('b', 'lane', 'list', board, lane, { ...list, boardId: 'foreign' }), false);
for (const invalid of ['', null, undefined, 1, {}, { $ne: null }, []]) {
  assert.equal(valid(invalid, 'lane', 'list', board, lane, list), false);
  assert.equal(valid('b', invalid, 'list', board, lane, list), false);
  assert.equal(valid('b', 'lane', invalid, board, lane, list), false);
}
const root = path.join(__dirname, '..');
const model = fs.readFileSync(path.join(root, 'models/cards.js'), 'utf8').split('  async copy(')[1].split('  async link(')[0];
assert.match(model, /requireCardCopyDestination\(boardId, swimlaneId, listId\)/);
assert.ok(model.indexOf('requireCardCopyDestination(') < model.indexOf('const oldId'));
for (const mutation of ['getNextCardNumber(', 'mapCustomFieldsToBoard', 'Cards.insertAsync(', 'copyFile(', 'ch.copy(']) {
  assert.ok(model.indexOf(mutation) > model.indexOf('requireCardCopyDestination('), mutation);
}
const method = fs.readFileSync(path.join(root, 'server/models/cards.js'), 'utf8').split('  async copyCard(')[1].split('  async saveCardAsTemplate(')[0];
assert.match(method, /requireCardCopyDestination\(boardId, swimlaneId, listId\)/);
assert.ok(method.indexOf('requireCardCopyDestination(') < method.indexOf('copy.getSort('));
console.log('cardCopyDestination: placement, shared lists, archived containers, invalid IDs and pre-write guards pass');
