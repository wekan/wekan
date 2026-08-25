'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { buildCopiedComment } = require('../models/lib/copiedComment');

const createdAt = new Date('2017-01-02T03:04:05.000Z');
const modifiedAt = new Date('2017-01-03T03:04:05.000Z');
const source = {
  _id: 'old-comment', boardId: 'old-board', cardId: 'old-card',
  userId: 'original-author', text: 'Earlier conversation', createdAt, modifiedAt,
};
const copy = buildCopiedComment(source, 'new-card', 'new-board');

assert.deepStrictEqual(copy, {
  boardId: 'new-board', cardId: 'new-card', userId: 'original-author',
  text: 'Earlier conversation', createdAt, modifiedAt,
});
assert.strictEqual(source._id, 'old-comment');
assert.strictEqual(source.boardId, 'old-board');
assert.strictEqual(source.cardId, 'old-card');
assert.strictEqual(buildCopiedComment(null, 'c', 'b'), null);
assert.strictEqual(buildCopiedComment(source, '', 'b'), null);

const model = fs.readFileSync(path.join(__dirname, '../models/cardComments.js'), 'utf8');
assert.ok(model.includes('CardComments.direct.insertAsync(copy, { getAutoValues: false })'));

console.log('copiedComment: 8 checks passed');
