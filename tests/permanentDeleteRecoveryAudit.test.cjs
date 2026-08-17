'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const settingsServer = read('server/models/settings.js');
const settingsClient = read('client/components/settings/adminProblems.js');
const boardsServer = read('server/models/boards.js');
const recoveryModel = read('models/recoveryEvents.js');

test('Admin Panel uses an audited server method for the permanent-delete toggle', () => {
  assert.match(
    settingsClient,
    /field === 'enablePermanentDelete'[\s\S]*?Meteor\.call\('setPermanentDeleteEnabled', !setting\[field\]/,
  );
  assert.match(settingsServer, /async setPermanentDeleteEnabled\(enabled\)/);
  assert.match(settingsServer, /check\(enabled, Boolean\)/);
  assert.match(settingsServer, /user\?\.isAdmin !== true/);
});

test('a changed setting logs the username and enabled or disabled state', () => {
  const at = settingsServer.indexOf('async setPermanentDeleteEnabled(enabled)');
  const body = settingsServer.slice(at, settingsServer.indexOf('\n  },', at));

  assert.ok(
    body.indexOf('Settings.updateAsync') < body.indexOf('RecoveryEvents.record'),
    'only a successful stored change is logged',
  );
  assert.match(body, /user\.username \|\| user\._id/);
  assert.match(body, /enabled \? 'enabled' : 'disabled'/);
  assert.match(body, /PERMANENT_DELETE_SETTING_CHANGED/);
  assert.match(body, /if \(\(setting\.enablePermanentDelete === true\) === enabled\) return enabled/,
    'a no-op does not create a misleading change event');
});

test('each successfully deleted board logs actor, board ID and title', () => {
  const at = boardsServer.indexOf('async permanentlyDeleteArchivedBoards(boardIds)');
  const body = boardsServer.slice(at, boardsServer.indexOf('\n  },', at));

  assert.ok(
    body.indexOf('await Boards.removeAsync(board._id)') < body.indexOf('await RecoveryEvents.record'),
    'a failed removal cannot be logged as successful',
  );
  assert.match(body, /user\.username \|\| user\._id/);
  assert.match(body, /BOARD_PERMANENTLY_DELETED/);
  assert.match(body, /board \$\{board\._id\} titled \$\{JSON\.stringify\(board\.title \|\| ''\)\}/);
});

test('Recovery declares stable event types for both audit actions', () => {
  assert.match(recoveryModel, /PERMANENT_DELETE_SETTING_CHANGED: 'permanent-delete-setting-changed'/);
  assert.match(recoveryModel, /BOARD_PERMANENTLY_DELETED: 'board-permanently-deleted'/);
});
