'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const service = read('server/lib/accessibleBoardListOperations.js');
const request = read('server/legacyHtml4.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const boardMethods = read('server/models/boards.js');
const userMethods = read('server/models/users.js');

test('star and Home operations bind authenticated users to visible boards', () => {
  assert.match(service, /if \(!userId\) throw new Meteor\.Error\('not-logged-in'/);
  assert.match(service, /Boards\.findOneAsync\(String\(boardId \|\| ''\)\)/);
  assert.match(service, /board\.isVisibleBy\(user\)/);
  assert.match(service, /starredBoards\.includes\(boardId\)/);
  assert.match(service, /board\.archived === true \|\| board\.type !== 'board'/);
  assert.match(service, /profile\?\.defaultBoardId === boardId/);
});

test('archive and restore retain board-admin and global-admin authorization', () => {
  assert.match(service, /ReactiveCache\.getBoard\(String\(boardId \|\| ''\)\)/);
  assert.match(service, /!board\.hasAdmin\(userId\) && !user\?\.isAdmin/);
  assert.match(service, /if \(archived\) await board\.archive\(\)/);
  assert.match(service, /else await board\.restore\(\)/);
  assert.match(service, /tripCanary\('board-list\.cross-scope'/);
  assert.match(service, /throw new Meteor\.Error\('error-board-notAdmin'\)/);
});

test('Meteor and HTML4 controllers use the same operations', () => {
  assert.match(userMethods, /toggleAccessibleBoardStar\(this\.userId, boardId\)/);
  assert.match(userMethods, /toggleAccessibleDefaultBoard\(this\.userId, boardId\)/);
  assert.match(boardMethods, /setAccessibleBoardArchived\(this\.userId, boardId, true\)/);
  assert.match(boardMethods, /setAccessibleBoardArchived\(this\.userId, boardId, false\)/);
  for (const operation of ['toggleAccessibleBoardStar', 'toggleAccessibleDefaultBoard',
    'setAccessibleBoardArchived']) assert.match(request, new RegExp(operation));
});

test('HTML4 All Boards exposes textual state and confirms archive', () => {
  for (const operation of ['toggle-board-star', 'toggle-default-board',
    'confirm-archive-board', 'archive-board', 'restore-board']) {
    assert.match(pages, new RegExp(`legacyOperation: '${operation}'`));
  }
  assert.match(pages, /profile\.starredBoards/);
  assert.match(pages, /profile\.defaultBoardId/);
  assert.match(pages, /currentUser\?\.isAdmin \|\| board\.hasAdmin\(userId\)/);
  assert.match(pages, /confirmBoardArchive === board\._id/);
});
