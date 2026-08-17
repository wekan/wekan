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
const css = fs.readFileSync(
  path.join(root, 'client/components/boards/boardsList.css'),
  'utf8',
);

function eventBody(name, nextName) {
  const start = js.indexOf(`  '${name}'(evt`);
  const end = js.indexOf(`  '${nextName}'`, start);
  assert.notEqual(start, -1, `${name} exists`);
  return js.slice(start, end);
}

test('an Archive multi-drag is identifiable during dragover', () => {
  assert.match(js, /const ARCHIVED_MULTI_BOARD_DRAG = 'application\/x-archived-board-multi'/);
  assert.match(
    js,
    /selectedMenu\.get\(\) === SECTION_ARCHIVE\s*&& BoardMultiSelection\.isActive\(\)[\s\S]*?setData\(ARCHIVED_MULTI_BOARD_DRAG, '1'\)/,
  );
  assert.match(js, /function isArchivedMultiBoardDrag\(evt\)[\s\S]*?dataTransfer\.types/);
});

test('Archive drags only hint Remaining and Workspaces; live sources can also hint Starred and Archive', () => {
  assert.match(js, /type === 'remaining'/);
  assert.match(js, /!archivedMulti && type === 'home'/);
  assert.match(js, /\(fromRemaining \|\| fromWorkspace\)[\s\S]*?\(type === 'starred' \|\| type === 'archive'\)/);
  assert.match(js, /querySelectorAll\('\.workspace-node'\)[\s\S]*?classList\.add\('board-drag-hint'\)/);
  assert.match(css, /board-drag-hint[\s\S]*?#4CAF50/);
});

test('Home and Archive refuse an archived multi-selection before accepting drop', () => {
  for (const [name, next] of [
    ['dragover .js-home-menu', 'dragleave .js-home-menu'],
    ['drop .js-home-menu', 'drop .js-select-menu'],
    ['dragover .js-open-archived-board', 'dragleave .js-open-archived-board'],
    ['drop .js-open-archived-board', 'click .js-unstar-bookmark'],
  ]) {
    const body = eventBody(name, next);
    assert.ok(
      body.indexOf('if (isArchivedMultiBoardDrag(evt)) return;') <
        body.indexOf('evt.preventDefault()'),
      `${name} must refuse before accepting the HTML5 drop`,
    );
  }
});

test('sharing targets refuse archived selections and generic sections accept Remaining or eligible Starred drops', () => {
  for (const [name, next] of [
    ['dragover .js-share-target', 'dragleave .js-share-target'],
    ['drop .js-share-target', 'dragstart .js-board'],
  ]) {
    const body = eventBody(name, next);
    assert.ok(
      body.indexOf('if (isArchivedMultiBoardDrag(evt)) return;') <
        body.indexOf('evt.preventDefault()'),
      `${name} must refuse an archived selection`,
    );
  }
  const generic = eventBody('dragover .js-select-menu', 'dragleave .js-select-menu');
  assert.match(generic, /menuType !== 'remaining'/);
  assert.match(generic, /menuType === 'starred' && isDragFromRemainingOrWorkspace\(evt\)/);
});

test('a Workspace drop restores archived boards and assigns them', () => {
  const body = eventBody('drop .workspace-node', 'dragover .js-select-menu');
  assert.match(body, /if \(board && board\.archived\) Meteor\.call\('restoreBoard', boardId\)/);
  assert.match(body, /Meteor\.call\('assignBoardToWorkspace', boardId, targetWorkspaceId\)/);
  assert.match(body, /if \(board && board\.archived\) Meteor\.call\('restoreBoard', boardData\)/);
});
