'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pages = read('server/lib/legacyHtml4Pages.js');
const imports = read('server/lib/legacyHtml4Imports.js');
const route = read('server/legacyHtml4.js');
const multipart = read('server/lib/legacyHtml4Multipart.js');

test('Trello HTML4 forms preserve one bounded workspace name through every import path', () => {
  assert.match(pages, /name: 'importWorkspaceName'.*maxlength: 100/);
  assert.ok(pages.match(/importWorkspaceName: workspaceName/g).length >= 3);
  assert.ok(route.match(/workspaceName: requestFields\.importWorkspaceName/g).length >= 2);
  assert.match(multipart, /'importWorkspaceName'/);
  assert.match(route, /members: draft\.members, workspaceName: draft\.workspaceName/);
});

test('workspace assignment is server-side, exact-user scoped and follows successful creation', () => {
  assert.match(imports, /const MAX_WORKSPACE_NAME_LENGTH = 100/);
  assert.match(imports, /source !== 'trello'/);
  assert.match(imports, /\[\\u0000-\\u001f\\u007f\]/);
  assert.match(imports, /Meteor\.users\.findOneAsync\(userId/);
  assert.match(imports, /Meteor\.callAsync\('createWorkspace'/);
  assert.match(imports, /Meteor\.callAsync\('assignBoardToWorkspace'/);
  assert.match(imports, /DDP\._CurrentMethodInvocation\.withValue/);
});

test('single JSON, mapped JSON and multi-board ZIP all assign the requested workspace', () => {
  assert.match(imports, /workspaceName: normalizedWorkspace/);
  assert.match(imports, /draft\.workspaceName/);
  assert.match(imports, /assignImportedBoardsToWorkspace\(userId, boardIds, normalizedWorkspace\)/);
});
