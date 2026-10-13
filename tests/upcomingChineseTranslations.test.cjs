// Guard full current Simplified Chinese coverage and preserve other Chinese families.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'imports', 'i18n', 'data');
const read = code => JSON.parse(
  fs.readFileSync(path.join(DATA, `${code}.i18n.json`), 'utf8'),
);
const en = read('en');
const simplified = ['cmn', 'wuu-Hans', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh', 'zh_SG'];
const traditional = ['yue_CN', 'zh-HK', 'zh-Hant', 'zh-TW'];
const reportKeys = [
  'officeReportTitle',
  'office-report-desc',
  'office-logins',
  'office-first-seen',
  'office-last-seen',
  'office-shared',
  'office-no-results',
  'api-report-desc',
  'api-calls',
  'api-first-called',
  'api-last-called',
  'api-no-calls',
];

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('all Chinese tags translate every Office and API report placeholder', () => {
  for (const code of [...simplified, ...traditional]) {
    const lang = read(code);
    for (const key of reportKeys) {
      assert.equal(typeof lang[key], 'string', `${code} lacks ${key}`);
      assert.notEqual(lang[key], en[key], `${code} leaves ${key} in English`);
    }
  }
});

test('simplified and traditional tags use their established scripts', () => {
  for (const code of simplified) {
    assert.match(read(code).officeReportTitle, /办公/, `${code} must use simplified script`);
    assert.doesNotMatch(read(code).officeReportTitle, /辦公/, `${code} must not use traditional script`);
  }
  for (const code of traditional) {
    assert.match(read(code).officeReportTitle, /辦公/, `${code} must use traditional script`);
    assert.doesNotMatch(read(code).officeReportTitle, /办公/, `${code} must not use simplified script`);
  }
});

test('technical tokens remain recognizable in translated report prose', () => {
  for (const code of [...simplified, ...traditional]) {
    const lang = read(code);
    assert.match(lang['office-report-desc'], /IPv4/);
    assert.match(lang['office-report-desc'], /IPv6/);
    assert.match(lang['api-report-desc'], /REST API/);
    assert.match(lang['api-no-calls'], /REST API/);
    assert.match(lang['api-no-calls'], /WITH_API=true/);
  }
});

test('universal API labels remain universal rather than receiving invented prose', () => {
  for (const code of [...simplified, ...traditional]) {
    const lang = read(code);
    assert.equal(lang.apiReportTitle, 'API');
    assert.equal(lang['api-endpoint'], 'API');
  }
});

console.log(`\nupcomingChineseTranslations: ${passed} tests passed`);

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const { execFileSync } = require('node:child_process');
  const root = path.resolve(DATA, '../../..');
  for (const code of ['zh', 'zh-CN', 'zh-Hans', 'zh-GB', 'zh_SG', 'cmn']) {
    const locale = read(code);
    assert.deepStrictEqual(Object.keys(locale), Object.keys(en), code);
    for (const key of Object.keys(en)) {
      assert.deepStrictEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
      'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after',
      'blockly-WORKSPACE_SEARCH_INPUT_LABEL']) {
      assert.notStrictEqual(locale[key], en[key], `${code}:${key} remains English`);
      assert.match(locale[key], /\p{Script=Han}/u, `${code}:${key}`);
    }
    assert.match(locale['filter-preset-save'], /保存.*筛选/);
    assert.doesNotMatch(locale['filter-preset-save'], /儲存|篩選/);
    assert.notStrictEqual(locale['move-selection-before'], locale['move-selection-after']);
    assert.deepStrictEqual(JSON.parse(execFileSync(process.execPath,
      ['releases/translations/fill-translations.mjs', '--list', code],
      { cwd: root, encoding: 'utf8' })), {});
  }
  console.log('Simplified Chinese source order, tokens, script and completeness verified');
})().catch(error => { console.error(error); process.exitCode = 1; });

for (const code of ['cmn', 'zh', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh_SG']) {
  const locale = read(code);
  assert.match(locale['custom-field-links-hint'], /名称和类型相同/);
  assert.match(locale['custom-field-links-hint'], /仅存在于一张卡片上的字段保持不变/);
  assert.match(locale['custom-field-link-inactive'], /已无法编辑两张卡片.*已归档/);
  assert.match(locale['custom-field-link-both'], /双向.*任一卡片/);
  assert.match(locale['custom-field-link-send'], /单向.*主卡片/);
  assert.match(locale['field-link-not-allowed'], /有权编辑两张卡片/);
  assert.equal(locale['import-members-mode-me'], '全部替换为我的用户账户');
  assert.match(locale['import-many-boards-hint'], /不进行成员映射/);
  assert.match(locale['import-many-boards-hint'], /本身就是一次导出.*则它是一个看板/);
  assert.match(locale['export-all-boards-hint'], /你有权导出.*一个工作簿.*\.zip/);
  assert.match(locale['webhook-payload-description'], /保留继承的设置/);
  assert.match(locale['notification-delivery-quiet'], /等到结束后再发送/);
  assert.match(locale['r-wrike-workflow-note'], /Completed.*Cancelled.*已完成.*Active.*Deferred.*未完成/);
  for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) assert.ok(locale['r-wrike-workflow-note'].includes(literal));
  assert.ok(locale['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
  assert.match(locale['subtask-mark-done'], /已完成$/);
  assert.match(locale['subtask-mark-not-done'], /未完成$/);
  assert.equal(locale['notification-delivery-part-list'], '列表');
  assert.equal(locale['notification-delivery-part-swimlane'], '泳道');
  for (const name of ['taiga', 'vikunja']) assert.match(locale[`import-board-instruction-${name}`], /不导入附件/);
  assert.match(locale['import-board-instruction-redmine'], /导出前将 My account 中的语言设为英语/);
  assert.match(locale['import-board-instruction-businessmap'], /Title, Column, Lane, Owner, Deadline/);
  assert.match(locale['import-board-instruction-plane'], /不含描述和附件.*不会导入/);
  assert.match(locale['import-board-instruction-kanri'], /只导入第一个看板/);
  assert.match(locale['import-board-instruction-teamwork'], /--、## 或 >> 表示再深一层/);
  for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(locale['import-board-instruction-orgmode'].includes(literal));
  assert.ok(locale['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.ok(locale['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(locale['ldap-sync-now-nothing'].includes(literal));
  assert.match(locale['sync-planning-hint'], /首次同步绝不会移除规划/);
  assert.match(locale['stuck-sync-operation-description'], /已经应用的更改会保留/);
  assert.match(locale['stuck-sync-operation-description'], /其余已保存的更改绝不会写入/);
  assert.match(locale['stuck-sync-operation-reason-access-denied'], /整个列表的写入权限/);
  for (const key of ['stuck-sync-operation-replayable-now', 'stuck-sync-operation-not-stuck']) assert.match(locale[key], /不能丢弃/);
  assert.match(locale['stuck-sync-operation-replayable'], /未将其丢弃/);
  assert.match(locale['stuck-sync-operation-busy'], /此列表正在同步/);
  assert.match(locale['interrupted-import-description'], /不保留源文件，无法继续导入/);
  assert.match(locale['interrupted-import-description'], /此后添加的任何内容/);
  assert.match(locale['interrupted-import-keep-confirm'], /不会移除任何内容/);
  assert.match(locale['interrupted-import-discard-confirm'], /全部内容将被永久移除/);
  assert.match(locale['interrupted-import-foreign-board'], /不是由此导入创建的，因此未作更改/);
  for (const key of ['stuck-sync-operation-truncated', 'interrupted-import-truncated']) assert.match(locale[key], /最早的 50/);
  assert.match(locale['scrum-import-into-board-hint'], /绝不会重复创建/);
  assert.match(locale['scrum-import-into-board-hint'], /不匹配的卡片会被列出并保持不变/);
  assert.match(locale['scrum-history-checkpoint-hint'], /没有其他人更改这些记录时才可用/);
  assert.match(locale['scrum-history-checkpoint-hint'], /不更改任何记录/);
  assert.match(locale['interrupted-import-scrum-busy'], /仍在写入或恢复中/);
  assert.doesNotMatch(locale['custom-field-links-hint'], /欄位|變更|關聯/);
  assert.doesNotMatch(locale['interrupted-import-description'], /匯入|檔案|伺服器/);
}
console.log('Simplified Chinese import, recovery, notification and Scrum meanings pass in all six catalogs');

// Newly added Trello strings only: keep the round-trip marker literal, and
// distinguish missing network permission from access that is already granted.
for (const code of ['cmn', 'zh', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh_SG', 'zh-HK', 'zh-Hant', 'zh-TW']) {
  const locale = read(code);
  const trad = ['zh-HK', 'zh-Hant', 'zh-TW'].includes(code);
  for (const key of ['exportToTrelloPopup-title', 'trello-export-desc',
    'trello-export-include-attachments', 'trello-export-start', 'trello-export-open-board',
    'trello-export-warnings', 'sandstorm-trello-access-needed', 'sandstorm-allow-trello-access',
    'sandstorm-trello-access-granted', 'sandstorm-forget-access', 'sandstorm-trello-save-label']) {
    assert.notEqual(locale[key], en[key], `${code}:${key}`);
    assert.match(locale[key], /\p{Script=Han}/u, `${code}:${key}`);
  }
  assert.ok(locale['trello-export-desc'].includes('Swimlane: …'), code);
  assert.match(locale['trello-export-desc'], trad ? /API 金鑰和權杖/ : /API 密钥和令牌/);
  assert.match(locale['trello-export-desc'], trad ? /還原為泳道/ : /还原为泳道/);
  assert.match(locale['trello-export-warnings'], trad ? /部分內容無法匯出/ : /部分内容未能导出/);
  assert.match(locale['sandstorm-trello-access-needed'], trad ? /無法存取網際網路.*請先允許/ : /无法访问互联网.*请先允许/);
  assert.match(locale['sandstorm-trello-access-granted'], trad ? /已獲准存取/ : /已获准访问/);
  assert.notEqual(locale['sandstorm-trello-access-needed'], locale['sandstorm-trello-access-granted']);
  assert.match(locale['trello-export-start'], trad ? /匯出/ : /导出/);
  assert.doesNotMatch(locale['trello-export-start'], trad ? /導入|导入|導出/ : /导入|匯出/);
}
