// Guard all current Traditional Chinese strings, including pending source keys.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root,
  `imports/i18n/data/${code}.i18n.json`), 'utf8'));

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const english = read('en');
  for (const code of ['zh-Hant', 'zh-TW', 'zh-HK']) {
    const locale = read(code);
    assert.deepEqual(Object.keys(locale), Object.keys(english), code);
    for (const key of Object.keys(english)) {
      assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
      'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after']) {
      assert.notEqual(locale[key], english[key], `${code}:${key} remains English`);
      assert.match(locale[key], /\p{Script=Han}/u, `${code}:${key}`);
    }
    assert.match(locale['filter-preset-save'], /儲存.*篩選/);
    assert.doesNotMatch(locale['filter-preset-save'], /储存|筛选/);
    assert.equal(locale['blockly-ENTER_KEY'], 'Enter');
    assert.notEqual(locale['move-selection-before'], locale['move-selection-after']);
    assert.deepEqual(JSON.parse(execFileSync(process.execPath,
      ['releases/translations/fill-translations.mjs', '--list', code],
      { cwd: root, encoding: 'utf8' })), {});
  }
  console.log('Traditional Chinese locales: source order, tokens, traditional script and completeness verified');
})().catch(error => { console.error(error); process.exitCode = 1; });

for (const code of ['zh-Hant', 'zh-TW', 'zh-HK']) {
  const locale = read(code);
  assert.match(locale['custom-field-links-hint'], /名稱和類型相同的自訂欄位/);
  assert.match(locale['custom-field-links-hint'], /僅存在於一張卡片上的欄位保持不變/);
  assert.match(locale['custom-field-link-inactive'], /已無法編輯兩張卡片.*已封存/);
  assert.match(locale['custom-field-link-both'], /雙向.*任一卡片/);
  assert.match(locale['custom-field-link-send'], /單向.*主要卡片/);
  assert.match(locale['field-link-not-allowed'], /有權編輯兩張卡片/);
  assert.equal(locale['import-members-mode-me'], '全部替換為我的使用者帳號');
  assert.match(locale['import-many-boards-hint'], /不進行成員對應/);
  assert.match(locale['import-many-boards-hint'], /本身就是一次匯出.*則它是一個看板/);
  assert.match(locale['export-all-boards-hint'], /你有權匯出.*一個活頁簿.*\.zip/);
  assert.match(locale['webhook-payload-description'], /保留繼承的設定/);
  assert.match(locale['notification-delivery-quiet'], /等到結束後再傳送/);
  assert.match(locale['r-wrike-workflow-note'], /Completed.*Cancelled.*已完成.*Active.*Deferred.*未完成/);
  for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) assert.ok(locale['r-wrike-workflow-note'].includes(literal));
  assert.ok(locale['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
  assert.match(locale['subtask-mark-done'], /已完成$/);
  assert.match(locale['subtask-mark-not-done'], /未完成$/);
  assert.equal(locale['notification-delivery-part-list'], '清單');
  assert.equal(locale['notification-delivery-part-swimlane'], '泳道');
  for (const name of ['taiga', 'vikunja']) assert.match(locale[`import-board-instruction-${name}`], /不匯入附件/);
  assert.match(locale['import-board-instruction-redmine'], /匯出前將 My account 中的語言設為英語/);
  assert.match(locale['import-board-instruction-businessmap'], /Title, Column, Lane, Owner, Deadline/);
  assert.match(locale['import-board-instruction-plane'], /不含描述和附件.*不會匯入/);
  assert.match(locale['import-board-instruction-kanri'], /只匯入第一個看板/);
  assert.match(locale['import-board-instruction-teamwork'], /--、## 或 >> 表示再深一層/);
  assert.match(locale['import-board-instruction-pivotal'], /迭代週期會成為衝刺/);
  for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(locale['import-board-instruction-orgmode'].includes(literal));
  assert.ok(locale['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.ok(locale['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(locale['ldap-sync-now-nothing'].includes(literal));
  assert.match(locale['sync-planning-hint'], /首次同步絕不會移除規劃/);
  assert.match(locale['sync-planning-hint'], /此看板上的規劃變更會保留/);
  assert.match(locale['stuck-sync-operation-description'], /已經套用的變更會保留/);
  assert.match(locale['stuck-sync-operation-description'], /其餘已儲存的變更絕不會寫入/);
  assert.match(locale['stuck-sync-operation-reason-access-denied'], /整個清單的寫入權限/);
  for (const key of ['stuck-sync-operation-replayable-now', 'stuck-sync-operation-not-stuck']) assert.match(locale[key], /不能捨棄/);
  assert.match(locale['stuck-sync-operation-replayable'], /未將其捨棄/);
  assert.match(locale['stuck-sync-operation-busy'], /此清單正在同步/);
  assert.match(locale['interrupted-import-description'], /不保留來源檔案，無法繼續匯入/);
  assert.match(locale['interrupted-import-description'], /此後新增的任何內容/);
  assert.match(locale['interrupted-import-keep-confirm'], /不會移除任何內容/);
  assert.match(locale['interrupted-import-discard-confirm'], /全部內容將被永久移除/);
  assert.match(locale['interrupted-import-foreign-board'], /不是由此匯入建立的，因此未作變更/);
  for (const key of ['stuck-sync-operation-truncated', 'interrupted-import-truncated']) assert.match(locale[key], /最早的 50/);
  assert.match(locale['scrum-import-into-board-hint'], /絕不會重複建立/);
  assert.match(locale['scrum-import-into-board-hint'], /不相符的卡片會被列出並保持不變/);
  assert.match(locale['scrum-history-checkpoint-hint'], /沒有其他人變更這些記錄時才可用/);
  assert.match(locale['scrum-history-checkpoint-hint'], /不變更任何記錄/);
  assert.match(locale['interrupted-import-scrum-busy'], /仍在寫入或復原中/);
  assert.doesNotMatch(locale['custom-field-links-hint'], /名称|类型|字段|变更/);
  assert.doesNotMatch(locale['interrupted-import-description'], /导入|文件|服务器/);
}
console.log('Traditional Chinese import, recovery, notification and Scrum meanings pass in all three catalogs');
