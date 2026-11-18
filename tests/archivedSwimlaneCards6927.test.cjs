'use strict';
// #6927 (regression of #6659): on a board whose archived swimlane still holds
// unarchived cards - archived before #2292 archived cards with their swimlane,
// e.g. a board migrated from WeKan 6.09 - those cards appeared in the first
// swimlane, and vanished while the Archive sidebar was open. The client's
// first-swimlane orphan rule could only exclude swimlanes in its cache, and
// archived swimlanes reach the cache only with the Archive sidebar. Now the
// board's archived swimlane ids are published on their own
// (boardArchivedSwimlaneIds) and the rule excludes them.
// Run: node --test tests/archivedSwimlaneCards6927.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { withArchivedSwimlanes } = require('../models/lib/archivedSwimlaneIds');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
// The first-swimlane selector is { swimlaneId: { $nin: others } } (or the
// swimlane's own id): does this card match it?
const matches = (selector, card) => {
  const clause = selector.swimlaneId;
  if (clause && typeof clause === 'object' && Array.isArray(clause.$nin)) return !clause.$nin.includes(card.swimlaneId);
  return clause === undefined || clause === card.swimlaneId;
};

test('the reporter\'s board: a card of an archived swimlane the cache does not hold stays hidden', async () => {
  const { listCardsSelector, otherSwimlaneIdsForFirstActive } = await import('../models/lib/swimlaneFilter.js');
  // Archive sidebar closed: only the active swimlanes are in the cache.
  const cache = [{ _id: 'first', archived: false }, { _id: 'second', archived: false }];
  const card = { _id: 'c', listId: 'l', swimlaneId: 'old-archived', archived: false };
  const before = listCardsSelector('l', 'first', otherSwimlaneIdsForFirstActive(cache, 'first'));
  assert.strictEqual(matches(before, card), true, 'the bug: it surfaced in the first swimlane');
  const after = listCardsSelector('l', 'first', otherSwimlaneIdsForFirstActive(withArchivedSwimlanes(cache, ['old-archived']), 'first'));
  assert.strictEqual(matches(after, card), false, 'with the archived ids it stays with its swimlane');
});

test('negative: a real orphan still surfaces, and an archived swimlane never becomes the first', async () => {
  const { listCardsSelector, otherSwimlaneIdsForFirstActive } = await import('../models/lib/swimlaneFilter.js');
  const cache = [{ _id: 'first', archived: false }, { _id: 'second', archived: false }];
  const swimlanes = withArchivedSwimlanes(cache, ['old-archived']);
  const sel = listCardsSelector('l', 'first', otherSwimlaneIdsForFirstActive(swimlanes, 'first'));
  assert.strictEqual(matches(sel, { swimlaneId: 'deleted-swimlane' }), true, 'a card of a deleted swimlane is an orphan');
  assert.strictEqual(matches(sel, { swimlaneId: 'first' }), true);
  assert.strictEqual(matches(sel, { swimlaneId: 'second' }), false);
  // The pseudo entries are archived and appended: the first active stays 'first'.
  assert.strictEqual(otherSwimlaneIdsForFirstActive(withArchivedSwimlanes([], ['a']), 'a'), undefined);
  assert.deepStrictEqual(withArchivedSwimlanes(cache, ['first', 'x']).map(s => s._id), ['first', 'second', 'x'], 'no duplicates');
  assert.deepStrictEqual(withArchivedSwimlanes(null, undefined), []);
});

test('the board\'s archived swimlane ids are published, read-checked, and used by the orphan rule', () => {
  const pub = read('server/publications/archivedSwimlaneIds.js');
  assert.match(pub, /Meteor\.publish\('boardArchivedSwimlaneIds'/);
  assert.match(pub, /if \(!canReadBoard\(this\.userId, board\)\) return this\.ready\(\);/);
  assert.match(pub, /Swimlanes\.find\(\{ boardId, archived: true \}, \{ fields: \{ _id: 1 \} \}\)/);
  assert.match(read('server/imports.js'), /import '\/server\/publications\/archivedSwimlaneIds';/);
  const lists = read('models/lists.js');
  assert.match(lists, /otherSwimlaneIdsForFirstActive\(withArchivedSwimlanes\(swimlanes, archivedSwimlaneIdsOf\(this\.boardId\)\), swimlaneId\)/);
  assert.match(read('client/components/lists/listBody.js'), /if \(list\.boardId\) tpl\.subscribe\('boardArchivedSwimlaneIds', list\.boardId\);/);
});
