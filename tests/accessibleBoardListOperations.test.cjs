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
const userPublications = read('server/publications/users.js');
const html5Boards = read('client/components/boards/boardsList.js');

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

test('creation and copy share one server boundary and reject caller-controlled board fields', () => {
  const publications = read('server/publications/boards.js');
  assert.match(service, /createAccessibleBoardWithInitialSwimlanes/);
  assert.match(service, /new Set\(\[\s*'title', 'slug', 'permission', 'type', 'migrationVersion', 'swimlanes'/);
  assert.match(service, /creation tried to set a protected board field/);
  assert.match(service, /TableVisibilityModeSettings\.findOneAsync/);
  assert.match(service, /\['private', 'public'\]\.includes\(requestedPermission\)/);
  assert.match(service, /slug: getSlug\(title\) \|\| 'board'/);
  assert.match(service, /\['board', 'template-container'\]\.includes\(type\)/);
  assert.match(service, /copyAccessibleBoard/);
  assert.match(service, /if \(!board\.hasAdmin\(userId\)\)/);
  assert.match(service, /typeof properties\.title === 'string'/);
  assert.match(service, /Number\.isFinite\(properties\.sort\)/);
  assert.match(service, /new Set\(\['sort', 'title', 'type'\]\)/);
  assert.match(service, /Object\.keys\(properties\)\.some/);
  assert.match(service, /copy tried to set a protected board field/);
  assert.match(boardMethods, /createAccessibleBoardWithInitialSwimlanes\(this\.userId/);
  assert.match(publications, /copyAccessibleBoard\(this\.userId, boardId, properties\)/);
  assert.match(request, /createAccessibleBoardWithInitialSwimlanes\(session\.userId/);
  assert.match(request, /copyAccessibleBoard\(session\.userId, boardId/);
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
  assert.match(pages, /legacyOperation: 'create-board'/);
  assert.match(pages, /legacyOperation: 'confirm-copy-board'/);
  assert.match(pages, /legacyOperation: 'copy-board'/);
  assert.match(pages, /confirmBoardCopy === board\._id/);
});

test('Workspace assignment binds a visible live board to the authenticated user tree', () => {
  assert.match(service, /async function setAccessibleBoardWorkspace/);
  assert.match(service, /visibleBoardAndUser\(userId, boardId\)/);
  assert.match(service, /board\.archived === true \|\| board\.type !== 'board'/);
  assert.match(service, /findNode\(user\.profile\?\.boardWorkspacesTree \|\| \[\], target\)/);
  assert.match(service, /assignment targeted an unknown workspace/);
  assert.match(service, /delete assignments\[board\._id\]/);
  assert.match(userMethods, /setAccessibleBoardWorkspace\(this\.userId, boardId, spaceId\)/);
  assert.match(userMethods, /setAccessibleBoardWorkspace\(this\.userId, boardId, ''\)/);
  assert.match(request, /setAccessibleBoardWorkspace\(/);
  assert.match(pages, /legacyOperation: 'set-board-workspace'/);
  assert.match(pages, /profile\.boardWorkspaceAssignments\?\.\[board\._id\]/);
  assert.match(userPublications, /Meteor\.publish\('user-board-workspaces'/);
  assert.match(userPublications, /\{ _id: this\.userId \}/);
  assert.doesNotMatch(userPublications,
    /publish\('user-board-workspaces', function \([^)]/);
  assert.match(userPublications, /'profile\.boardWorkspacesTree': 1/);
  assert.match(userPublications, /'profile\.boardWorkspaceAssignments': 1/);
  assert.match(html5Boards, /this\.subscribe\('user-board-workspaces'\)/);
});
