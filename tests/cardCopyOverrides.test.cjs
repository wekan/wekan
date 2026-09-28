'use strict';
const assert = require('node:assert/strict');
const { cardWithCopyOverrides } = require('../models/lib/cardCopyOverrides');
class Card { copy() { return this._id; } }
const source = Object.freeze(Object.assign(new Card(), { _id: 'source', boardId: 'source-board', title: 'Original', description: 'Original text', sort: 4 }));
const copy = cardWithCopyOverrides(source, { title: 'New', description: '' });
assert.ok(copy instanceof Card);
assert.equal(copy.copy(), 'source');
assert.equal(copy.boardId, 'source-board');
assert.equal(copy.title, 'New');
assert.equal(copy.description, '');
copy.sort = 10;
assert.equal(source.sort, 4);
assert.equal(source.title, 'Original');
assert.equal(source.description, 'Original text');
assert.equal(cardWithCopyOverrides(source, {}).title, source.title);
for (const key of ['_id', 'boardId', 'listId', 'swimlaneId', 'parentId', 'linkedId', 'type', 'copy', 'getSort', 'constructor', '__proto__', 'customFields', 'scrum', 'assignees', 'sort', 'archived']) {
  assert.throws(() => cardWithCopyOverrides(source, { [key]: 'forged' }), /Invalid card copy overrides/);
}
for (const invalid of [null, [], 1, 'text', new Date(), Object.create(null), Object.create({ title: 'inherited' }),
  { title: undefined }, { description: null }, { title: {} }, { title: 'OK', _id: 'forged' }]) {
  assert.throws(() => cardWithCopyOverrides(source, invalid), /Invalid card copy overrides/);
}
console.log('cardCopyOverrides: text-only input, identity, prototype and source isolation passed');

// Scan maintained application sources, never the generated duplicate _build tree.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
function scan(directory) {
  for (const item of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) scan(file);
    else if (file.endsWith('.js')) {
      assert.doesNotMatch(fs.readFileSync(path.join(root, file), 'utf8'),
        /Object\.assign\(\s*(?:card|sourceCard)\s*,\s*(?:mergeCardValues|overrides)\b/,
        `${file}: caller overrides must not replace a source card's identity or methods`);
    }
  }
}
for (const directory of ['client', 'models', 'server']) scan(directory);
const method = fs.readFileSync(path.join(root, 'server/models/cards.js'), 'utf8').split('  async copyCard(')[1].split('  async saveCardAsTemplate(')[0];
assert.ok(method.indexOf('cardWithCopyOverrides(card, mergeCardValues)') < method.indexOf('copy.copy('));
assert.match(method, /authz\.card-copy-overrides/);
assert.equal(require('../models/lib/securityCategories').categoryFor('authz.card-copy-overrides').bleed, 'CopyIdentityBleed');
for (const [values, securityAttempt] of [[{ _id: 'foreign' }, true], [{ title: 42 }, false], [{ description: null }, false]]) {
  try { cardWithCopyOverrides(source, values); assert.fail('must reject'); }
  catch (error) { assert.equal(error.securityAttempt, securityAttempt); }
}
