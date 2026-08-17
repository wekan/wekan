'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(
  path.join(root, 'client/components/boards/boardsList.js'),
  'utf8',
);

test('a Remaining drag carries a source marker readable during dragover', () => {
  assert.match(js, /const DRAG_FROM_REMAINING = 'application\/x-board-from-remaining'/);
  assert.match(
    js,
    /selectedMenu\.get\(\) === SECTION_REMAINING[\s\S]*?setData\(DRAG_FROM_REMAINING, '1'\)/,
  );
  assert.match(js, /function isDragFromRemaining\(evt\)[\s\S]*?dataTransfer\.types/);
});

test('Starred and Archive receive the same green hint as other valid targets', () => {
  assert.match(
    js,
    /fromRemaining && \(type === 'starred' \|\| type === 'archive'\)/,
  );
  assert.match(js, /classList\.add\('board-drag-hint'\)/);
});

test('dropping on Starred only adds missing stars and does not move boards', () => {
  const start = js.indexOf("  'drop .js-select-menu'(evt)");
  const body = js.slice(start, js.indexOf('\n  },', start));
  const starred = body.slice(body.indexOf("if (menuType === 'starred')"));

  assert.match(starred, /if \(!isDragFromRemaining\(evt\)\) return/);
  assert.match(starred, /!user\.hasStarred\(boardId\)/);
  assert.match(starred, /Meteor\.call\('toggleBoardStar', boardId\)/);
  assert.ok(
    starred.indexOf('return;') < starred.indexOf("Meteor.call('unassignBoardFromWorkspace'"),
    'a Starred drop must not remove the board from Remaining',
  );
});

test('dropping on Archive keeps the confirmed multi-board archive path', () => {
  const start = js.indexOf("  'drop .js-open-archived-board'(evt)");
  const body = js.slice(start, js.indexOf("  'click .js-unstar-bookmark'", start));

  assert.match(body, /confirm\(TAPi18n\.__\('archive-board-confirm'\)\)/);
  assert.match(body, /boardIds\.forEach/);
  assert.match(body, /Meteor\.call\('archiveBoard', boardId/);
});
