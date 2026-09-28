'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { formatStringTemplate: format } = require('../models/lib/customFieldStringTemplate');

test('existing values, case-insensitive tokens, blank filtering and separators remain supported', () => {
  assert.equal(format(['one', '', ' ', 'two'], '%{VALUE}', ', '), 'one, two');
  assert.equal(format(null, '%{value}'), '');
  assert.equal(format([null, 42, 'x'], '%{value}'), 'x');
  assert.equal(format(['x'], undefined), '');
});
test('public context fields and the issue spelling resolve per item', () => {
  const context = { 'card.title': 'Card', 'board.title': 'Board', 'list.title': 'List', 'swimlane.title': 'Lane' };
  assert.equal(format(['a', 'b'], '%{card.title}/{%board.title}/%{LIST.TITLE}/{%swimlane.title}:%{value}', ';', context),
    'Card/Board/List/Lane:a;Card/Board/List/Lane:b');
});
test('URL parameters encode spaces, Unicode, delimiters and replacement metacharacters', () => {
  const value = 'Ö & # ? / $&';
  const context = { 'card.title': 'Card & title' };
  assert.equal(format([value], 'https://example.org/?v=%{value|urlencode}&c=%{card.title|urlencode}', '', context),
    `https://example.org/?v=${encodeURIComponent(value)}&c=Card%20%26%20title`);
  assert.equal(format(['\ud800'], '%{value|urlencode}'), '%{value|urlencode}');
});
test('unknown, missing and arbitrary object paths remain literal', () => {
  const text = '%{card.secret} %{constructor} %{card.title.toUpperCase()} %{swimlane.title} %{value|eval} %{value|urlencode|eval}';
  assert.equal(format(['x'], text, '', { 'card.secret': 'secret' }), text);
  assert.equal(format(['x'], '%{card.title}', '', Object.create({ 'card.title': 'inherited' })), '%{card.title}');
});
test('inserted values are not interpreted again', () => {
  assert.equal(format(['%{card.title} $&'], '%{value} / %{card.title}', '', { 'card.title': '%{value}' }),
    '%{card.title} $& / %{value}');
});
test('existing regex JSON supports flags, captures, numeric replacement and quantifiers', () => {
  assert.equal(format(['aaaBB'], '${"regex":"(a{2,3})","flags":"gi","replace":"[$1]"}'), '[aaa]BB');
  assert.equal(format(['abc'], '${"regex":"abc","replace":"123"}'), '123');
  assert.equal(format(['a"b'], '${"regex":"a\\"b","replace":"ok"}'), 'ok');
});
test('bad regex definitions stay visible without breaking the card', () => {
  for (const spec of ['${"regex":"[","replace":"x"}', '${"regex":"a","flags":"bad","replace":"b"}',
    '${"regex":"a"}', '${bad}', '${"regex":2,"replace":"b"}']) {
    assert.equal(format(['a'], spec), spec);
  }
});

test('linked context cursors project only titles and constrain each placement to its source board', async () => {
  const fs = require('node:fs');
  const vm = require('node:vm');
  const source = fs.readFileSync(require('node:path').join(__dirname, '../server/publications/boards.js'), 'utf8');
  const start = source.indexOf('// Linked cards (cardType-linkedCard)');
  const block = source.slice(source.indexOf('{', start), source.indexOf('// Source-board display metadata', start)).trim().replace(/,$/, '');
  const calls = [];
  let visible = [];
  const cursor = vm.runInNewContext(`(${block})`, {
    isArchived: false,
    visibleLinkedCardIds: async () => visible,
    ReactiveCache: Object.fromEntries(['getCards', 'getLists', 'getSwimlanes'].map(name => [name,
      async (...args) => { calls.push({ name, args: JSON.parse(JSON.stringify(args)) }); return 'cursor'; }])),
  });
  assert.equal(await cursor.find({ _id: 'viewer-board' }), null);
  assert.deepEqual(calls, []);
  visible = ['allowed-source'];
  assert.equal(await cursor.find({ _id: 'viewer-board' }), 'cursor');
  assert.deepEqual(calls.shift(), { name: 'getCards', args: [{ _id: { $in: visible }, archived: false }, {}, true] });
  for (const [i, field, name] of [[0, 'listId', 'getLists'], [1, 'swimlaneId', 'getSwimlanes']]) {
    assert.equal(await cursor.children[i].find({ boardId: 'source' }), null);
    assert.equal(await cursor.children[i].find({ boardId: 'source', [field]: 'forged-foreign-id' }), 'cursor');
    assert.deepEqual(calls.shift(), { name, args: [
      { _id: 'forged-foreign-id', boardId: 'source' }, { fields: { title: 1, boardId: 1 } }, true,
    ] });
  }
});
