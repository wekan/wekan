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
const settingsJade = read('client/components/settings/adminProblems.jade');

test('Admin Panel uses an audited server method for the permanent-delete toggle', () => {
  assert.match(
    settingsClient,
    /field === 'enablePermanentDelete'[\s\S]*?Meteor\.call\('setPermanentDeleteEnabled', !setting\[field\]/,
  );
  assert.match(settingsServer, /async setPermanentDeleteEnabled\(enabled\)/);
  assert.match(settingsServer, /check\(enabled, Boolean\)/);
  assert.match(settingsServer, /user\?\.isAdmin !== true/);
});

test('Delete explains the Recovery audit trail below its existing guidance', () => {
  assert.match(
    settingsClient,
    /permanentDeleteRecoveryDescription\(\) \{\s*return PERMANENT_DELETE_RECOVERY_DESCRIPTION/,
  );
  assert.match(
    settingsJade,
    /p\.description \{\{_ 'enable-permanent-delete-description'\}\}\s+p\.description \{\{permanentDeleteRecoveryDescription\}\}/,
  );
  assert.match(
    settingsClient,
    /additionalDesc: PERMANENT_DELETE_RECOVERY_DESCRIPTION/,
    'Delete and Recovery use the same description',
  );
});

test('a changed setting logs the username and enabled or disabled state', () => {
  const at = settingsServer.indexOf('async setPermanentDeleteEnabled(enabled)');
  const body = settingsServer.slice(at, settingsServer.indexOf('\n  },', at));

  assert.ok(
    body.indexOf('Settings.updateAsync') < body.indexOf('recordRecoveryAudit({'),
    'only a successful stored change is logged',
  );
  assert.match(body, /user\?\.username \|\| user\?\._id/);
  assert.match(body, /enabled \? 'enabled' : 'disabled'/);
  assert.match(body, /PERMANENT_DELETE_SETTING_CHANGED/);
  assert.match(body, /if \(\(setting\.enablePermanentDelete === true\) === enabled\) return enabled/,
    'a no-op does not create a misleading change event');
});

test('each successfully deleted board logs actor, board ID and title', () => {
  const at = boardsServer.indexOf('async permanentlyDeleteArchivedBoards(boardIds)');
  const body = boardsServer.slice(at, boardsServer.indexOf('\n  },', at));

  assert.ok(
    body.indexOf('await Boards.removeAsync(board._id)') < body.indexOf('await recordRecoveryAudit({'),
    'a failed removal cannot be logged as successful',
  );
  assert.match(body, /user\?\.username \|\| user\?\._id/);
  assert.match(body, /BOARD_PERMANENTLY_DELETED/);
  assert.match(body, /board \$\{board\._id\} titled \$\{JSON\.stringify\(board\.title \|\| ''\)\}/);
});

test('unauthorized and failed attempts are logged with actor, address, and requested boards', () => {
  const helper = read('server/lib/recoveryAudit.js');
  assert.match(helper, /resolveClientKey\(\{[\s\S]*?HTTP_FORWARDED_COUNT/,
    'the audit uses the shared trusted-proxy address resolver');
  assert.match(helper, /classifyAddress\(rawAddress\)/);
  for (const field of ['userId', 'username', 'ipv4', 'ipv6', 'boardIds', 'boardTitles']) {
    assert.match(helper, new RegExp(`${field}:`), `${field} is recorded`);
  }

  const boardAt = boardsServer.indexOf('async permanentlyDeleteArchivedBoards(boardIds)');
  const boardBody = boardsServer.slice(boardAt, boardsServer.indexOf('\n  },', boardAt));
  assert.ok(boardBody.indexOf('check(boardIds, [String])')
    < boardBody.indexOf('await ReactiveCache.getUser'),
  'argument validation precedes the async actor lookup');
  assert.match(boardBody, /catch \(error\)[\s\S]*?done: false[\s\S]*?boards: attemptedBoards/);

  const settingAt = settingsServer.indexOf('async setPermanentDeleteEnabled(enabled)');
  const settingBody = settingsServer.slice(settingAt, settingsServer.indexOf('\n  },', settingAt));
  assert.match(settingBody, /catch \(error\)[\s\S]*?done: false/);
});

test('Recovery stores Boolean Done and deleted-data state', () => {
  for (const field of ['done', 'deletedData']) {
    assert.match(recoveryModel, new RegExp(`${field}: \\{[\\s\\S]*?type: Boolean`));
  }
  assert.match(recoveryModel, /done: opts\.done !== false/);
  assert.match(recoveryModel, /deletedData: opts\.deletedData === true/);
});

test('Done is the first Recovery column with success, failure, and deletion icons', () => {
  const admin = read('client/components/settings/adminProblems.js');
  const tableModel = read('models/lib/tablePage.js');
  const tableJade = read('client/components/settings/tablePage.jade');
  const tableCss = read('client/components/settings/tablePage.css');
  const at = admin.lastIndexOf("'report-recovery':");
  const body = admin.slice(at, admin.indexOf('\n  },', at));
  const columnsAt = body.indexOf('columns: [');
  assert.match(body.slice(columnsAt, columnsAt + 100), /labelKey: 'done'/);
  assert.match(body, /fa-check table-page-status-done/);
  assert.match(body, /fa-exclamation-triangle table-page-status-failed/);
  assert.match(body, /fa-trash table-page-status-deleted/);
  assert.match(tableModel, /icons: typeof column\.icons === 'function'/);
  assert.match(tableJade, /if icons\.length[\s\S]*?each icons[\s\S]*?i\.fa/);
  assert.match(tableCss, /table-page-status-done[\s\S]*?#2e7d32/);
  assert.match(tableCss, /table-page-status-failed[\s\S]*?#c62828/);
  assert.match(tableCss, /table-page-status-deleted[\s\S]*?#d6a100/);
});

test('Recovery declares stable event types for both audit actions', () => {
  assert.match(recoveryModel, /PERMANENT_DELETE_SETTING_CHANGED: 'permanent-delete-setting-changed'/);
  assert.match(recoveryModel, /BOARD_PERMANENTLY_DELETED: 'board-permanently-deleted'/);
});
