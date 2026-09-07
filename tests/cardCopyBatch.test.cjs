'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  MAX_BATCH_CARDS,
  normalizeCardCopyBatch,
} = require('../models/lib/cardCopyBatch');

test('normalizes only bounded title and optional description entries', () => {
  assert.deepEqual(normalizeCardCopyBatch(
    '[{"title":" First ","description":"Body"},{"title":"Second"}]',
  ), [{ title: 'First', description: 'Body' }, { title: 'Second' }]);
});

for (const [name, value] of [
  ['invalid JSON', '['],
  ['non-array', '{}'],
  ['empty array', '[]'],
  ['unknown fields', '[{"title":"Card","boardId":"foreign"}]'],
  ['empty title', '[{"title":"  "}]'],
  ['control characters', '[{"title":"bad\\u0000title"}]'],
  ['non-string description', '[{"title":"Card","description":7}]'],
]) test(`rejects ${name}`, () => assert.throws(
  () => normalizeCardCopyBatch(value), /card-copy-batch/,
));

test('rejects card count and byte-size amplification', () => {
  assert.throws(() => normalizeCardCopyBatch(Array.from(
    { length: MAX_BATCH_CARDS + 1 }, (_, index) => ({ title: `Card ${index}` }),
  )), /card-copy-batch/);
  assert.throws(() => normalizeCardCopyBatch(' '.repeat(256 * 1024 + 1)),
    /card-copy-batch-too-large/);
});

test('HTML5 and HTML4 call one server-side batch operation', () => {
  const root = path.join(__dirname, '..');
  const service = fs.readFileSync(path.join(root, 'server/lib/accessibleCardOperations.js'), 'utf8');
  const methods = fs.readFileSync(path.join(root, 'server/models/cards.js'), 'utf8');
  const client = fs.readFileSync(path.join(root, 'client/components/cards/cardDetails.js'), 'utf8');
  const route = fs.readFileSync(path.join(root, 'server/legacyHtml4.js'), 'utf8');
  const page = fs.readFileSync(path.join(root, 'server/lib/legacyHtml4Pages.js'), 'utf8');
  assert.match(service, /async function copyManyAccessibleCards/);
  assert.match(service, /normalizeCardCopyBatch\(input\?\.copies\)/);
  assert.match(service, /\['top', 'below'\]\.includes\(position\)/);
  assert.match(methods, /async copyManyAccessibleCards\(input\)/);
  assert.match(client, /Meteor\.callAsync\('copyManyAccessibleCards'/);
  assert.match(route, /legacyOperation === 'copy-many-cards'/);
  assert.match(page, /titleName: 'cardCopies'/);
  assert.match(page, /titleRows: 8/);
});
