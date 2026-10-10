// Guard both full current Korean catalogs and warning meanings.
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
  for (const code of ['ko', 'ko-KR']) {
    const locale = read(code);
    assert.deepEqual(Object.keys(locale), Object.keys(english), code);
    for (const key of Object.keys(english)) {
      assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
      'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after']) {
      assert.notEqual(locale[key], english[key], `${code}:${key} remains English`);
      assert.match(locale[key], /\p{Script=Hangul}/u, `${code}:${key}`);
    }
    assert.match(locale['custom-field-links-hint'], /두 카드에서 이름과 유형이 같은/);
    assert.match(locale['custom-field-links-hint'], /한 카드에만 있는 항목은 변경되지 않습니다/);
    assert.match(locale['custom-field-link-inactive'], /두 카드를 모두 편집할 수 없거나.*보관 처리/);
    assert.match(locale['custom-field-link-both'], /양방향.*어느 카드/);
    assert.match(locale['custom-field-link-send'], /단방향.*주 카드/);
    assert.match(locale['field-link-not-allowed'], /두 카드를 모두 편집/);
    assert.equal(locale['import-members-mode-me'], '모두 나로 바꾸기');
    assert.match(locale['import-many-boards-hint'], /구성원 연결 없이/);
    assert.match(locale['import-many-boards-hint'], /그 자체가 하나의 내보내기.*하나의 보드가 됩니다/);
    assert.match(locale['export-all-boards-hint'], /내보낼 수 있는.*통합 문서.*\.zip/);
    assert.match(locale['webhook-payload-description'], /상속된 설정을 유지/);
    assert.match(locale['notification-delivery-quiet'], /끝날 때까지 대기/);
    assert.match(locale['r-wrike-workflow-note'], /Completed 또는 Cancelled.*완료로.*Active 또는 Deferred.*미완료로/);
    assert.match(locale['interrupted-import-description'], /원본 파일을 보관하지 않으므로.*계속할 수 없습니다/);
    assert.match(locale['interrupted-import-description'], /나중에 추가된 내용까지 포함하여 삭제/);
    assert.match(locale['interrupted-import-keep-confirm'], /아무것도 삭제되지 않으며/);
    assert.match(locale['interrupted-import-discard-confirm'], /모든 내용이 영구적으로 삭제/);
    assert.match(locale['stuck-sync-operation-discard-confirm'], /이미 적용된 변경은 유지되고 나머지는 기록되지 않습니다/);
    assert.match(locale['scrum-import-into-board-hint'], /중복 생성되지 않습니다/);
    assert.match(locale['sync-planning-hint'], /첫 동기화에서는 계획을 삭제하지 않습니다/);
    assert.match(locale['scrum-history-checkpoint-hint'], /다른 사람이.*변경하지 않은 경우에만/);
    assert.match(locale['scrum-history-checkpoint-hint'], /기록은 변경하지 않습니다/);
    for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) assert.ok(locale['r-wrike-workflow-note'].includes(literal), literal);
    for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(locale['import-board-instruction-orgmode'].includes(literal), literal);
    for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(locale['ldap-sync-now-nothing'].includes(literal), literal);
    assert.ok(locale['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
    assert.ok(locale['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
    assert.notEqual(locale['subtask-mark-done'], locale['subtask-mark-not-done']);
    assert.notEqual(locale['move-selection-before'], locale['move-selection-after']);
    assert.equal(locale['blockly-MATH_TRIG_COS'], 'cos');
    assert.deepEqual(JSON.parse(execFileSync(process.execPath,
      ['releases/translations/fill-translations.mjs', '--list', code],
      { cwd: root, encoding: 'utf8' })), {});
  }
  console.log('Korean locales: source order, tokens, Korean prose and completion verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
