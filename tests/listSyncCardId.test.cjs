'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { listSyncCardId } = require('../server/lib/listSyncCardId');

test('Sync creation identity is stable and isolates lists, sources and issues', () => {
  const id = listSyncCardId('list', 'source', 'issue');
  assert.equal(listSyncCardId('list', 'source', 'issue'), id);
  assert.match(id, /^sync-[a-f0-9]{64}$/);
  for (const tuple of [['other', 'source', 'issue'], ['list', 'other', 'issue'],
    ['list', 'source', 'other'], ['list:source', 'issue', ''],
    ['list', 'source:issue', '']]) {
    assert.notEqual(listSyncCardId(...tuple), id);
  }
  assert.notEqual(listSyncCardId('a', 'b:c', 'd'), listSyncCardId('a:b', 'c', 'd'));
  assert.equal(listSyncCardId('list', 'source', 123), listSyncCardId('list', 'source', '123'));
});
