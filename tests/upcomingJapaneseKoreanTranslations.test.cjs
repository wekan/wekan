// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'imports', 'i18n', 'data');
const read = code => JSON.parse(
  fs.readFileSync(path.join(DATA, code + '.i18n.json'), 'utf8'),
);
const en = read('en');
const japanese = ['ja', 'ja-JP', 'ja-HI'];
const korean = ['ko', 'ko-KR'];
const reportKeys = [
  'officeReportTitle', 'office-report-desc', 'office-logins',
  'office-first-seen', 'office-last-seen', 'office-shared',
  'office-no-results', 'api-report-desc', 'api-calls',
  'api-first-called', 'api-last-called', 'api-no-calls',
];

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('all Japanese and Korean tags translate every report placeholder', () => {
  for (const code of [...japanese, ...korean]) {
    const lang = read(code);
    for (const key of reportKeys) {
      assert.equal(typeof lang[key], 'string', code + ' lacks ' + key);
      assert.notEqual(lang[key], en[key], code + ' leaves ' + key + ' in English');
    }
  }
});

test('each family keeps its established script and login vocabulary', () => {
  for (const code of japanese) {
    assert.equal(read(code).officeReportTitle, 'ログイン場所');
  }
  for (const code of korean) {
    assert.equal(read(code).officeReportTitle, '로그인 위치');
  }
});

test('technical tokens remain recognizable in every translated description', () => {
  for (const code of [...japanese, ...korean]) {
    const lang = read(code);
    assert.match(lang['office-report-desc'], /IPv4/);
    assert.match(lang['office-report-desc'], /IPv6/);
    assert.match(lang['api-report-desc'], /REST API/);
    assert.match(lang['api-no-calls'], /REST API/);
    assert.match(lang['api-no-calls'], /WITH_API=true/);
  }
});

test('universal API labels remain unchanged', () => {
  for (const code of [...japanese, ...korean]) {
    const lang = read(code);
    assert.equal(lang.apiReportTitle, 'API');
    assert.equal(lang['api-endpoint'], 'API');
  }
});

console.log('\nupcomingJapaneseKoreanTranslations: ' + passed + ' tests passed');

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const { execFileSync } = require('node:child_process');
  const root = path.resolve(DATA, '../../..');
  for (const code of japanese) {
    const locale = read(code);
    assert.deepStrictEqual(Object.keys(locale), Object.keys(en), code);
    for (const key of Object.keys(en)) {
      assert.deepStrictEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
      'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after']) {
      assert.notStrictEqual(locale[key], en[key], `${code}:${key} remains English`);
      assert.match(locale[key], /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u, `${code}:${key}`);
    }
    assert.strictEqual(locale['blockly-LOGIC_BOOLEAN_TRUE'], '真');
    assert.strictEqual(locale['blockly-LOGIC_BOOLEAN_FALSE'], '偽');
    assert.strictEqual(locale['blockly-LOGIC_NULL'], 'null');
    assert.deepStrictEqual(JSON.parse(execFileSync(process.execPath,
      ['releases/translations/fill-translations.mjs', '--completed-catalog', '--list', code],
      { cwd: root, encoding: 'utf8' })), {});
  }
  for (const code of ['ja', 'ja-JP']) {
    const data = read(code);
    assert.deepStrictEqual(JSON.parse(execFileSync(process.execPath,
      ['releases/translations/fill-translations.mjs', '--list', code],
      { cwd: root, encoding: 'utf8' })), {});
    assert.match(data['custom-field-links-hint'], /両方のカードで名前と種類が同じ/);
    assert.match(data['custom-field-links-hint'], /片方のカードにしかないフィールドは変更されません/);
    assert.match(data['custom-field-link-inactive'], /両方のカードを編集できなく.*アーカイブ/);
    assert.match(data['custom-field-link-both'], /双方向.*どちらのカード/);
    assert.match(data['custom-field-link-send'], /一方向.*メインのカード/);
    assert.match(data['field-link-not-allowed'], /両方のカードを編集する権限/);
    assert.strictEqual(data['import-members-mode-me'], '全員を自分に置き換える');
    assert.match(data['import-many-boards-hint'], /メンバーの対応付けなし/);
    assert.match(data['import-many-boards-hint'], /zip 自体が1つのエクスポート.*1つのボードになります/);
    assert.match(data['export-all-boards-hint'], /エクスポート権限.*ブック.*\.zip/);
    assert.match(data['webhook-payload-description'], /継承した設定を維持/);
    assert.match(data['notification-delivery-quiet'], /終了するまで待機/);
    assert.match(data['r-wrike-workflow-note'], /CompletedまたはCancelled.*完了.*ActiveまたはDeferred.*未完了/);
    for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) {
      assert.ok(data['r-wrike-workflow-note'].includes(literal), literal);
    }
    assert.ok(data['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
    assert.notStrictEqual(data['subtask-mark-done'], data['subtask-mark-not-done']);
    assert.match(data['interrupted-import-description'], /元ファイルは保存されないため.*続行できません/);
    assert.match(data['interrupted-import-description'], /後から追加されたものも含めて削除/);
    assert.match(data['interrupted-import-keep-confirm'], /何も削除されず/);
    assert.match(data['interrupted-import-discard-confirm'], /すべての内容が完全に削除/);
    assert.match(data['stuck-sync-operation-discard-confirm'], /適用済みの変更は保持され.*残りは書き込まれません/);
    assert.match(data['scrum-import-into-board-hint'], /重複作成されません/);
    assert.match(data['sync-planning-hint'], /初回の同期で計画が削除されることはありません/);
    assert.match(data['scrum-history-checkpoint-hint'], /ほかの人が.*変更していない場合にのみ/);
    assert.match(data['scrum-history-checkpoint-hint'], /レコードは変更しません/);
    for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(data['import-board-instruction-orgmode'].includes(literal), literal);
    for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(data['ldap-sync-now-nothing'].includes(literal), literal);
    assert.ok(data['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  }
  console.log('Japanese source order, tokens, localized prose and completeness verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
