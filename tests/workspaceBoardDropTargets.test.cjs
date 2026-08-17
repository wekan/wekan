'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const js = fs.readFileSync(
  path.join(__dirname, '..', 'client/components/boards/boardsList.js'),
  'utf8',
);

test('a Workspace drag carries a source marker readable during dragover', () => {
  assert.match(js, /const DRAG_FROM_WORKSPACE = 'application\/x-board-from-workspace'/);
  assert.match(
    js,
    /selectedWorkspaceIdVar\.get\(\)[\s\S]*?setData\(DRAG_FROM_WORKSPACE, '1'\)/,
  );
  assert.match(js, /function isDragFromWorkspace\(evt\)[\s\S]*?dataTransfer\.types/);
});

test('Workspace drags highlight Starred and Archive as green valid targets', () => {
  assert.match(
    js,
    /\(fromRemaining \|\| fromWorkspace\)[\s\S]*?type === 'starred' \|\| type === 'archive'/,
  );
  assert.match(js, /classList\.add\('board-drag-hint'\)/);
});

test('a Workspace drop on Starred adds only missing stars without moving boards', () => {
  const start = js.indexOf("  'drop .js-select-menu'(evt)");
  const body = js.slice(start, js.indexOf('\n  },', start));
  const starred = body.slice(body.indexOf("if (menuType === 'starred')"));

  assert.match(starred, /isDragFromRemainingOrWorkspace\(evt\)/);
  assert.match(starred, /!user\.hasStarred\(boardId\)/);
  assert.match(starred, /Meteor\.call\('toggleBoardStar', boardId\)/);
  assert.ok(
    starred.indexOf('return;') < starred.indexOf("Meteor.call('unassignBoardFromWorkspace'"),
    'a Starred drop must return before workspace unassignment',
  );
});

test('a Workspace drop on Archive uses confirmation and archives every board', () => {
  const start = js.indexOf("  'drop .js-open-archived-board'(evt)");
  const body = js.slice(start, js.indexOf("  'click .js-unstar-bookmark'", start));

  assert.match(body, /confirm\(TAPi18n\.__\('archive-board-confirm'\)\)/);
  assert.match(body, /boardIds\.forEach/);
  assert.match(body, /Meteor\.call\('archiveBoard', boardId/);
});
