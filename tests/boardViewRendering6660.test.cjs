'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const boardBody = fs.readFileSync('client/components/boards/boardBody.js', 'utf8');
const listBody = fs.readFileSync('client/components/lists/listBody.js', 'utf8');
const listBodyJade = fs.readFileSync('client/components/lists/listBody.jade', 'utf8');
const boardHeader = fs.readFileSync('client/components/boards/boardHeader.js', 'utf8');
const bookmarks = fs.readFileSync('client/components/main/bookmarks.js', 'utf8');

for (const view of [
  'swimlanes',
  'lists',
  'cal',
  'gantt',
  'table',
  'stats',
]) {
  assert.match(
    boardBody,
    new RegExp(`return Utils\\.boardView\\(\\) === 'board-view-${view}'`),
    `${view} content uses the same reactive view source as the menu`,
  );
}

const viewHelpers = boardBody.slice(
  boardBody.indexOf('isViewSwimlanes() {'),
  boardBody.indexOf('hasSwimlanes() {'),
);
assert.doesNotMatch(
  viewHelpers,
  /currentUser\.profile|localStorage/,
  'content helpers do not bypass the pending reactive view',
);

assert.match(listBody, /containerSwimlaneId\(\) \{[\s\S]*?Template\.parentData\(depth\)/);
assert.match(listBodyJade, /cardsWithLimit \(idOrNull containerSwimlaneId\)/);
assert.doesNotMatch(listBodyJade, /idOrNull \.\.\/\.\.\/_id/,
  'card scoping no longer depends on fragile relative Jade data traversal');

assert.match(boardHeader, /Meteor\.callAsync\('toggleBoardStar'/);
assert.match(bookmarks, /Meteor\.callAsync\('toggleBoardStar'/);
assert.doesNotMatch(`${boardHeader}\n${bookmarks}`, /\.toggleBoardStar\(/,
  'favorite controls do not make rollback-prone direct client collection writes');

console.log('boardViewRendering6660: content, swimlane and favorite wiring passed');
