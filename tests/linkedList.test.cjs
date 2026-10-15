'use strict';

// #2809: a linked whole list - a live mirror of another board's list,
// editable by whoever may write the source board.
// Run: node tests/linkedList.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { isLinkedList, linkedListCardsSelector, validLink } = require('../models/lib/linkedList.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const linked = { _id: 'L', boardId: 'B', linkedBoardId: 'S', linkedListId: 'SL' };

// Positive.
assert.equal(isLinkedList(linked), true);
assert.deepEqual(linkedListCardsSelector(linked, { swimlaneId: 'w1', firstSwimlaneId: 'w1' }), { boardId: 'S', listId: 'SL', archived: false });
assert.deepEqual(linkedListCardsSelector(linked, {}), { boardId: 'S', listId: 'SL', archived: false }, 'the Lists view');
assert.equal(validLink({ boardId: 'B', sourceBoardId: 'S', sourceListId: 'SL', sourceList: { boardId: 'S' } }), true);
console.log('  ok - the source list\'s cards, once');

// Negative.
assert.deepEqual(linkedListCardsSelector(linked, { swimlaneId: 'w2', firstSwimlaneId: 'w1' }), { _id: { $in: [] } }, 'not repeated in other swimlanes');
assert.equal(linkedListCardsSelector({ _id: 'x' }), null, 'an ordinary list');
for (const bad of [
  { boardId: 'B', sourceBoardId: 'B', sourceListId: 'x', sourceList: { boardId: 'B' } },
  { boardId: 'B', sourceBoardId: 'S', sourceListId: 'SL', sourceList: { boardId: 'OTHER' } },
  { boardId: 'B', sourceBoardId: 'S', sourceListId: 'SL', sourceList: { boardId: 'S', archived: true } },
  { boardId: 'B', sourceBoardId: 'S', sourceListId: 'SL', sourceList: { boardId: 'S', linkedBoardId: 'T', linkedListId: 'TL' } },
  { boardId: 'B', sourceBoardId: 'S', sourceListId: 'SL', sourceList: null },
]) assert.equal(validLink(bad), false, JSON.stringify(bad));
console.log('  ok - no self link, foreign or archived list, or a mirror of a mirror');

// Server: both boards visible to see it; the source's write right to add to it.
const server = read('server/linkedLists.js');
assert.ok(server.includes('const source = await visibleBoard(this.userId, list.linkedBoardId);') &&
  server.includes('if (!(await visibleBoard(this.userId, list.boardId)) || !source) return this.ready();'),
  'the cards only to a subscriber who sees both boards');
// ...and of the source board only the cards they see there (GHSA-3cgr-47wm-9cc9).
assert.ok(server.includes('...(assignedOnlyCardScope(source, this.userId) || {}) }, { limit: 1000 })'),
  'an assigned-only member of the source board gets their own cards');
assert.match(server, /if \(!\(await canWriteInList\(this\.userId, source, sourceList\._id\)\)\) throw new Meteor\.Error\('not-authorized'\);/);
assert.match(server, /if \(!board \|\| board\.archived \|\| !allowIsBoardMemberWithWriteAccess\(this\.userId, board\)\) throw/);
assert.match(server, /if \(!validLink\(\{ \.\.\.input, sourceList \}\)\) throw new Meteor\.Error\('linked-list-invalid'\);/);
assert.match(read('models/lists.js'), /linkedBoardId: \{[\s\S]{0,300}type: String,\s*optional: true,/);
const body = read('client/components/lists/listBody.js');
assert.match(body, /if \(isLinkedList\(list\)\) \{\s*tpl\.subscribe\('linkedListCards', list\._id\);/);
assert.match(body, /if \(data\.linkedListId\) \{\s*await Meteor\.callAsync\('addCardToLinkedList', data\._id, title\);/);
assert.match(read('client/components/swimlanes/swimlanes.jade'), /a\.js-link-list \{\{_ 'link-list-from-board'\}\}/);
console.log('  ok - visibility of both boards, the source board\'s write rule, the UI');
console.log('\nlinkedList: all tests passed');
