'use strict';
(async () => {

// #6765: archiving a list archived only the list document for every list that
// is not a template list, so its cards kept `archived: false` and stayed
// visible in the Lists, Table and Calendar views. Now the server archives the
// list's cards with it and restores exactly those on restore - the rule #2292
// gave swimlanes (models/lib/swimlaneArchive.js), applied in one hook that
// every archive path reaches. Run: node tests/archiveListCards.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { cardsToArchiveWithSwimlane: toArchive, cardsToRestoreWithSwimlane: toRestore } =
  await import('../models/lib/swimlaneArchive.js');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const listArchivedAt = new Date('2026-10-14T10:00:00Z');
const earlier = new Date('2026-10-01T10:00:00Z');

test('archiving a list archives its unarchived cards', () => {
  const cards = [{ _id: 'a', archived: false }, { _id: 'b' }, { _id: 'c', archived: true, archivedAt: earlier }];
  assert.deepStrictEqual(toArchive(cards).map(c => c._id), ['a', 'b']);
});

test('restoring restores the cards archived WITH the list', () => {
  // The hook gives them the list's own archivedAt, so they compare equal.
  const cards = [
    { _id: 'a', archived: true, archivedAt: listArchivedAt },
    { _id: 'b', archived: true, archivedAt: listArchivedAt },
  ];
  assert.deepStrictEqual(toRestore(cards, listArchivedAt).map(c => c._id), ['a', 'b']);
});

test('negative: a card archived on its own before the list stays archived', () => {
  const cards = [
    { _id: 'mine', archived: true, archivedAt: earlier },
    { _id: 'with-list', archived: true, archivedAt: listArchivedAt },
  ];
  assert.deepStrictEqual(toRestore(cards, listArchivedAt).map(c => c._id), ['with-list']);
});

test('negative: a list with no archive time restores no cards', () => {
  assert.deepStrictEqual(toRestore([{ _id: 'x', archived: true, archivedAt: earlier }], undefined), []);
});

test('the server hook does it for every list, on the archived field', () => {
  const src = read('server/models/lists.js');
  const at = src.indexOf('// #6765:');
  assert.ok(at > 0, 'the #6765 hook is there');
  const hook = src.slice(at, src.indexOf("WebApp.handlers.get('/api/boards/:boardId/lists'", at));
  assert.match(hook, /Lists\.after\.update\(async \(userId, doc, fieldNames\) => \{\n\s*if \(!fieldNames\.includes\('archived'\)\) return;/);
  assert.doesNotMatch(hook, /isTemplateList/, 'not only template lists');
  assert.match(hook, /toArchive\(cards\)[\s\S]*card\.archive\(\)/);
  assert.match(hook, /toRestore\(cards, doc\.archivedAt\)[\s\S]*card\.restore\(\)/);
  // Not the server clock against a time the browser may have stamped.
  assert.match(hook, /Cards\.direct\.updateAsync\(\{ _id: \{ \$in: archived\.map\(card => card\._id\) \} \},\s*\{ \$set: \{ archivedAt \} \}/);
});

test('negative: the archive paths do not bypass the hook', () => {
  // Every list archive is an update of `archived` through the hooked
  // collection, never a direct write that would skip the cascade.
  for (const rel of ['models/lists.js', 'server/models/lists.js']) {
    assert.doesNotMatch(read(rel), /Lists\.direct\.updateAsync\([^)]*\$set: \{ archived: (true|false)/, rel);
  }
});

console.log(`archiveListCards: ${passed} tests passed`);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
