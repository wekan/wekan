'use strict';

// CopyIdentityBleed for boards (models/lib/boardCopyProperties.js).
// Run: node tests/boardCopyProperties.test.cjs
//
// copyBoard assigned every caller-supplied property onto the source board
// object, including _id. board.copy() loads the source lists, cards and
// children by this._id, so a board admin could pass another board's _id and
// duplicate a private board they cannot see. Only title, sort, type and the
// card selection are accepted now, on a separate object.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { boardCopyProperties, boardWithCopyProperties } = require('../models/lib/boardCopyProperties.js');

// Supported properties, exactly as the four client callers send them.
assert.deepEqual(boardCopyProperties({ sort: 3, type: 'board', title: 'Copy' }), { sort: 3, type: 'board', title: 'Copy' });
assert.deepEqual(boardCopyProperties({ sort: 0, type: 'board', title: undefined, withoutCards: true }),
  { sort: 0, type: 'board', withoutCards: true }, 'an undefined title is simply absent');
assert.deepEqual(boardCopyProperties({ copyOptions: { cards: false } }), { copyOptions: { cards: false } });
assert.deepEqual(boardCopyProperties({}), {});

// Negative: any field outside the contract is refused as an attempt.
for (const bad of [{ _id: 'other-board' }, { members: [] }, { permission: 'public' }, { title: 'x', _id: 'y' },
  { slug: 'x' }, { boardId: 'x' }, { constructor: 'x' }]) {
  assert.throws(() => boardCopyProperties(bad), error => error.securityAttempt === true, JSON.stringify(bad));
}
// A wrong type on a supported field is an input error, not an attack.
for (const bad of [{ title: 42 }, { sort: '1' }, { sort: null }, { sort: Infinity }, { type: 'invalid' }, { withoutCards: 'false' }]) {
  assert.throws(() => boardCopyProperties(bad), error => error.securityAttempt === false, JSON.stringify(bad));
}
for (const bad of [null, 'x', [], Object.create({ _id: 'inherited' })]) {
  assert.throws(() => boardCopyProperties(bad), error => error.securityAttempt === false);
}

// The copy is a separate object: the source keeps its identity and methods.
class Board { copy() { return this._id; } }
const source = Object.assign(new Board(), { _id: 'source', title: 'Original' });
const copy = boardWithCopyProperties(source, { title: 'Renamed', withoutCards: true, copyOptions: {} });
assert.equal(copy._id, 'source');
assert.equal(copy.title, 'Renamed');
assert.equal(copy.copy(), 'source', 'methods still work on the copy');
assert.equal(source.title, 'Original', 'the source board is not changed');
assert.equal(copy.withoutCards, undefined);

// The method and the REST route use it, and nothing assigns caller input onto
// the source board any more.
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const method = read('server/publications/boards.js');
const body = method.slice(method.indexOf('async copyBoard('), method.indexOf('async boardStatus('))
  .replace(/^\s*\/\/.*$/gm, '');
assert.match(body, /values = boardCopyProperties\(properties\)/);
assert.match(body, /key: 'authz\.board-copy-overrides'/);
assert.match(body, /catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
assert.match(body, /copy\.copy\(/);
assert.doesNotMatch(body, /board\[key\] = /, 'caller properties are never assigned onto the source board');
assert.doesNotMatch(body, /\bboard\.copy\(/, 'the source board object is never the one copied');
const rest = read('server/models/boards.js');
const route = rest.slice(rest.indexOf("'/api/boards/:boardId/copy'"), rest.indexOf("'/api/boards/:boardId/members/:memberId'"));
assert.match(route, /typeof req\.body\?\.title === 'string'/);
assert.doesNotMatch(route, /board\.title = req\.body/);
assert.match(read('models/lib/securityCategories.js'),
  /'authz\.board-copy-overrides': \{ category: 'authz', bleed: 'CopyIdentityBleed', severity: 'high'/);

console.log('  ok - board copy accepts only title, sort, type and card selection');
