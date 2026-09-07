'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const page = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');
const api = read('server/trelloApiImport.js');

test('HTML4 exposes every modern Trello API operation through Meteor methods', () => {
  for (const operation of [
    'trello-save-credentials', 'trello-delete-credentials', 'trello-list-workspaces',
    'trello-start-import', 'trello-resume-import', 'trello-cancel-import',
    'trello-request-cancel-delete', 'trello-confirm-cancel-delete', 'trello-clear-job',
  ]) assert.ok(route.includes(operation) && page.includes(operation), `missing ${operation}`);
  for (const method of [
    'saveTrelloCredentials', 'deleteTrelloCredentials', 'trelloListWorkspaces',
    'trelloStartImport', 'trelloResumeImport', 'trelloCancelImport', 'trelloClearImportJob',
  ]) assert.ok(route.includes(`'${method}'`), `HTML4 does not call ${method}`);
});

test('credentials remain write-only, bounded and are never copied into selection fields', () => {
  assert.match(page, /type: 'password', name: 'trelloApiToken'/);
  assert.doesNotMatch(page, /trelloApiToken[^\n]+value:/);
  assert.doesNotMatch(page, /fields: \{[^}]*trelloApi(?:Key|Token)/);
  assert.match(api, /MAX_TRELLO_KEY_LENGTH = 500/);
  assert.match(api, /MAX_TRELLO_TOKEN_LENGTH = 2000/);
  assert.match(api, /trello-api-credentials-invalid/);
});

test('board, local workspace and persisted job identities are server bounded', () => {
  assert.match(api, /TRELLO_BOARD_ID = \^?\/\^\[a-f0-9\]\{24\}/i);
  assert.match(api, /new Set\(boardIds\)\.size !== boardIds\.length/);
  assert.match(api, /findNodeById\(user\?\.profile\?\.boardWorkspacesTree/);
  assert.match(page, /TrelloImportJobs\.findOneAsync\(\{ userId \}/);
  assert.match(api, /job\.userId !== this\.userId/);
  assert.match(route, /requestFields\.confirmed !== 'true'/);
  assert.match(route, /source: 'legacyHtml4:trello-api-import'/);
  assert.match(route, /protectedErrors\.has\(errorKey\)/);
  assert.match(route, /severity: serious \? 'high' : 'medium'/);
});

test('the HTML4 controls are labelled native fields in source and Tab order', () => {
  assert.match(page, /id: 'trello-api-credentials'/);
  assert.match(page, /id: 'trello-api-board-selection'/);
  assert.match(page, /type: 'select', name: 'parentWorkspaceNodeId'/);
  assert.match(page, /type: 'checkbox', name: 'trelloBoardIds'/);
  assert.match(page, /id: 'trello-confirm-delete-imported'/);
});
