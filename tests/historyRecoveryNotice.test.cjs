'use strict';

// Keyboard undo/redo recovery made visible (client/lib/historyKeyRecovery.js,
// client/components/main/historyRecoveryNotice.*). Run: node tests/historyRecoveryNotice.test.cjs
// The request logic itself is tests/historyKeyRequest.test.cjs; the Chromium
// case is tests/playwright/specs/history-recovery-notice.e2e.js.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const keyboard = read('client/lib/keyboard.js');
assert.match(keyboard, /\.catch\(\(\) => \{\}\)\.then\(\(\) => refreshPendingHistoryRequest\(storage\)\);/,
  'every keystroke updates the notice, answered or not');
const notice = read('client/components/main/historyRecoveryNotice.js');
assert.match(notice, /await undoRedoLast\(request\.direction\);/, 'Try again repeats the waiting direction, so its own ID is resent');
assert.match(notice, /request\.boardId !== Session\.get\('currentBoard'\)\) return null;/, 'only on its own board');
assert.match(notice, /forgetPendingHistoryRequest\(\);/);
const recovery = read('client/lib/historyKeyRecovery.js');
assert.match(recovery, /writeStoredRequest\(storage, null\);\s*refreshPendingHistoryRequest\(storage\);/);
const layouts = read('client/components/main/layouts.jade');
const defaultLayout = layouts.slice(layouts.indexOf('template(name="defaultLayout")'));
assert.match(defaultLayout.slice(0, 300), /\+historyRecoveryNotice/);
assert.equal((layouts.match(/\+historyRecoveryNotice/g) || []).length, 1, 'mounted once, in the board layout');
assert.match(read('client/features/main.js'), /import '\/client\/components\/main\/historyRecoveryNotice\.js';/);
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
for (const key of ['history-request-pending-undo', 'history-request-pending-redo', 'history-request-hint',
  'history-request-retry', 'history-request-forget']) assert.ok(en[key], key);
for (const file of ['client/lib/keyboard.js', 'client/lib/historyKeyRecovery.js', 'client/components/main/historyRecoveryNotice.js']) {
  execFileSync(process.execPath, ['--input-type=module', '--check'], { input: read(file) });
}
console.log('  ok - an unanswered undo/redo is shown on its board, retried with its own ID or forgotten');

// Retry acts only for someone who may write on the board (undoRedoLast returns
// early otherwise), so it is enabled only then: right after a reload the notice
// showed before the board's members arrived, and a Retry clicked in that window
// was dropped without a word (history-recovery-notice.e2e.js, Firefox).
{
  const jade = read('client/components/main/historyRecoveryNotice.jade');
  assert.match(jade, /button\.primary\.js-history-retry\(type="button" disabled=retryDisabled\)/);
  assert.match(notice, /retryDisabled\(\) \{\n\s+return Template\.instance\(\)\.busy\.get\(\) \|\| !Utils\.canModifyBoard\(\);/);
  assert.match(keyboard, /export function undoRedoLast\(direction\) \{\n\s+const boardId = Session\.get\('currentBoard'\);\n\s+if \(!boardId \|\| !Utils\.canModifyBoard\(\)\) \{/,
    'the guard Retry mirrors');
  // Negative: Forget needs no permission and stays usable; Retry is not left
  // gated on busy alone.
  assert.match(jade, /button\.js-history-forget\(type="button" disabled=busy\)/);
  assert.doesNotMatch(jade, /js-history-retry\(type="button" disabled=busy\)/);
  console.log('  ok - Retry is enabled only once the board lets this person write on it');
}
