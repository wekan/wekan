// Guard both current Ukrainian catalogs and warning meanings.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = read('en'), uk = read('uk');
  assert.match(uk['scrum-import-into-board-hint'], /не дублюються/);
  assert.match(uk['scrum-import-card-on-another-board'], /залишена без змін/);
  assert.match(uk['sync-planning-hint'], /спочатку за ID у джерелі, потім за назвою/);
  assert.match(uk['sync-planning-hint'], /Перша синхронізація ніколи не видаляє планування/);
  assert.deepEqual(Object.keys(uk), Object.keys(en));
  for (const key of Object.keys(en)) {
    assert.deepEqual(translationTokens(uk[key]), translationTokens(en[key]), key);
    if (/^(filter-recency-|filter-date-range-|filter-column-age|filter-preset|notification-activity-|auto-archive-|due-reminder-)/.test(key)) {
      assert.ok(uk[key]?.trim(), key);
      assert.notEqual(uk[key], en[key], key);
      assert.match(uk[key], /[А-Яа-яІіЇїЄєҐґ]/, key);
      assert.doesNotMatch(uk[key], /[ыэъЫЭЪ]/, key);
    }
  }
  for (const key of ['r-trigger-vars-hint', 'r-vars-people-hint']) {
    assert.notEqual(uk[key], en[key], key);
    assert.deepEqual(uk[key].match(/\{[^{}]+\}/g), en[key].match(/\{[^{}]+\}/g), key);
  }
  assert.deepEqual(uk['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g),
    en['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g));
  assert.match(uk['advanced-filter-card-dates-hint'], /@endAt = none/);
  assert.match(uk['filter-column-age-hint'], /не обнуляє/);
  assert.match(uk['instance-desc'], /ніколи не показується/);
  assert.match(uk['instance-desc'], /лише люди, додані до дошки/);
  assert.match(uk['board-instance-info'], /<strong>всіх користувачів, які ввійшли в систему<\/strong>/);
  assert.match(uk['notification-activity-description'], /@згадки надходять завжди/);
  assert.match(uk['auto-archive-hint'], /щогодини.*шаблони ніколи.*Залиште порожнім/);
  assert.notEqual(uk['dependency-type-duplicates'], uk['dependency-type-is-duplicated-by']);
  for (const scheme of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) {
    assert.equal(uk['automatic-linked-url-schemes-hint'].split(scheme).length - 1, 1, scheme);
  }
  for (const key of Object.keys(en).filter(key => key.startsWith('scrum-') || key.startsWith('import-report-'))) {
    assert.ok(uk[key]?.trim(), key);
    assert.notEqual(uk[key], en[key], key);
    assert.match(uk[key], /[А-Яа-яІіЇїЄєҐґ]/, key);
    assert.doesNotMatch(uk[key], /[ыэъЫЭЪ]/, key);
  }
  assert.match(uk['scrum-report-help'], /не є нульовими оцінками/);
  assert.match(uk['scrum-daily-observations-help'], /не фіксують кожну зміну/);
  assert.match(uk['scrum-confirm-cancel'], /залишаться призначеними/);
  assert.match(uk['import-report-description'], /Дошку створено.*не вдалося перенести/);
  assert.notEqual(uk['scrum-category-todo'], uk['scrum-category-done']);
  assert.equal(uk['blockly-SPACE_KEY'], 'Пробіл');
  for (const key of Object.keys(en).filter(key => /^(sync-|email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-)/.test(key))) {
    assert.ok(uk[key]?.trim(), key);
    assert.notEqual(uk[key], en[key], key);
    assert.match(uk[key], /[А-Яа-яІіЇїЄєҐґ]/, key);
    assert.doesNotMatch(uk[key], /[ыэъЫЭЪ]/, key);
  }
  assert.match(uk['sync-conflict-hint'], /нічого не надсилається/);
  for (const key of Object.keys(en).filter(key => /^(interrupted-import-|stuck-sync-operation-|ldap-sync-now)/.test(key))) {
    assert.notEqual(uk[key], en[key], key);
    assert.match(uk[key], /[А-Яа-яІіЇїЄєҐґ]/, key);
    assert.doesNotMatch(uk[key], /[ыэъЫЭЪ]/, key);
  }
  assert.match(uk['interrupted-import-description'], /неможливо продовжити/);
  assert.match(uk['interrupted-import-description'], /включно з усім, що додали відтоді/);
  assert.match(uk['interrupted-import-keep-confirm'], /Нічого не видаляється/);
  assert.match(uk['interrupted-import-discard-confirm'], /видалено назавжди/);
  assert.match(uk['interrupted-import-foreign-board'], /її не змінено/);
  assert.match(uk['interrupted-import-truncated'], /50 найстаріших/);
  assert.match(uk['stuck-sync-operation-description'], /уже застосовані зміни зберігаються/);
  assert.match(uk['stuck-sync-operation-description'], /ніколи не записуються/);
  assert.match(uk['stuck-sync-operation-replayable-now'], /не можна відкинути/);
  assert.match(uk['stuck-sync-operation-replayable'], /не було відкинуто/);
  assert.match(uk['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS/);
  assert.match(uk['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED/);
  assert.ok(uk['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.ok(uk['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  assert.match(uk['r-moved-forward'], /вперед/);
  assert.match(uk['r-moved-back'], /назад/);
  assert.match(uk['login-origin-mismatch'], /ROOT_URL/);
  assert.match(uk['activity-recovery-cancel-confirm'], /не можна буде відновити/);
  assert.match(uk['email-recovery-confirm-cancel'], /Нові повідомлення.*буде збережено/);
  assert.match(uk['sync-time-estimate-hint'], /явне null очищує/);
  assert.notEqual(uk['move-selection-before'], uk['move-selection-after']);
  assert.equal(uk['blockly-CONTEXT_MENU_KEY'], '≣ Меню');
  const inventory = spawnSync(process.execPath,
    ['releases/translations/fill-translations.mjs', '--list', 'uk'],
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.equal(inventory.status, 0, inventory.stderr);
  assert.deepEqual(JSON.parse(inventory.stdout), {});
  const regional = read('uk-UA');
  const regionalKeys = ["board-announcement", "board-announcement-enabled", "cards-use-list-color", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "read-only-field", "r-moved-forward", "r-moved-back", "r-assignee", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "scrum-release-scope", "scrum-releases-select-help", "scrum-import-into-board", "scrum-import-into-board-hint", "scrum-import-preview", "scrum-import-choose-file", "scrum-import-invalid-file", "scrum-import-preview-sprints", "scrum-import-preview-releases", "scrum-import-preview-cards", "scrum-import-preview-nothing", "scrum-import-into-board-done", "scrum-import-card-not-matched", "scrum-import-card-ambiguous", "scrum-import-card-on-another-board", "scrum-import-record-ambiguous", "scrum-import-record-not-imported", "scrum-import-sprint-finished", "sync-planning-sprint", "sync-planning-releases", "sync-planning-fields", "sync-planning-hint", "stuck-sync-operation-heading", "stuck-sync-operation-description", "stuck-sync-operation-list", "stuck-sync-operation-progress", "stuck-sync-operation-reason", "stuck-sync-operation-applied", "stuck-sync-operation-reason-scope-changed", "stuck-sync-operation-reason-access-denied", "stuck-sync-operation-reason-trigger-unknown", "stuck-sync-operation-reason-intent-missing", "stuck-sync-operation-reason-unknown", "stuck-sync-operation-replayable-now", "stuck-sync-operation-discard", "stuck-sync-operation-discard-confirm", "stuck-sync-operation-refresh", "stuck-sync-operation-empty", "stuck-sync-operation-truncated", "stuck-sync-operation-unavailable", "stuck-sync-operation-missing", "stuck-sync-operation-not-stuck", "stuck-sync-operation-replayable", "stuck-sync-operation-busy", "stuck-sync-operation-failed", "interrupted-import-heading", "interrupted-import-description", "interrupted-import-board", "interrupted-import-progress", "interrupted-import-created", "interrupted-import-source", "interrupted-import-state-stopped", "interrupted-import-state-failed", "interrupted-import-state-discarding", "interrupted-import-scrum", "interrupted-import-counts", "interrupted-import-no-board", "interrupted-import-keep", "interrupted-import-discard", "interrupted-import-keep-confirm", "interrupted-import-discard-confirm", "interrupted-import-refresh", "interrupted-import-empty", "interrupted-import-truncated", "interrupted-import-unavailable", "interrupted-import-missing", "interrupted-import-not-interrupted", "interrupted-import-foreign-board", "interrupted-import-scrum-busy", "interrupted-import-failed", "scrum-history-checkpoint-stuck", "scrum-history-checkpoint-counts", "scrum-history-checkpoint-hint", "scrum-history-checkpoint-rollback", "scrum-history-checkpoint-discard", "scrum-history-checkpoint-discard-confirm", "scrum-history-checkpoint-ask-admin"];
  for (const key of regionalKeys) {
    assert.ok(regional[key]?.trim(), key);
    assert.notEqual(regional[key], en[key], key);
    assert.deepEqual(translationTokens(regional[key]), translationTokens(en[key]), key);
    assert.match(regional[key], /[А-Яа-яІіЇїЄєҐґ]/, key);
    assert.doesNotMatch(regional[key], /[ыэъЫЭЪ]/, key);
  }
  assert.match(regional['read-only-field'], /змінювати.*лише адміністратори дошки/);
  assert.match(regional['scrum-import-into-board-hint'], /не дублюються/);
  assert.match(regional['scrum-import-card-on-another-board'], /залишена без змін/);
  assert.match(regional['sync-planning-hint'], /Перша синхронізація ніколи не видаляє планування/);
  assert.match(regional['stuck-sync-operation-description'], /уже застосовані зміни зберігаються/);
  assert.match(regional['stuck-sync-operation-description'], /ніколи не записуються/);
  assert.match(regional['stuck-sync-operation-replayable-now'], /не можна відкинути/);
  assert.match(regional['interrupted-import-description'], /неможливо продовжити/);
  assert.match(regional['interrupted-import-description'], /включно з усім, що додали відтоді/);
  assert.match(regional['interrupted-import-keep-confirm'], /Нічого не видаляється/);
  assert.match(regional['interrupted-import-discard-confirm'], /видалено назавжди/);
  assert.match(regional['interrupted-import-foreign-board'], /її не змінено/);
  assert.match(regional['scrum-history-checkpoint-hint'], /лише тоді.*не змінював ніхто інший/);
  for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
    assert.ok(regional['ldap-sync-now-nothing'].includes(literal), literal);
  }
  assert.ok(regional['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.ok(regional['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  for (const code of ['uk', 'uk-UA']) {
    const data = read(code);
    assert.deepEqual(Object.keys(data), Object.keys(en), code);
    for (const key of Object.keys(en)) assert.deepEqual(translationTokens(data[key]), translationTokens(en[key]), `${code}:${key}`);
    const current = spawnSync(process.execPath,
      ['releases/translations/fill-translations.mjs', '--list', code],
      { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
    assert.equal(current.status, 0, current.stderr);
    assert.deepEqual(JSON.parse(current.stdout), {}, code);
    assert.match(data['custom-field-links-hint'], /однаковими назвою й типом на обох картках/);
    assert.match(data['custom-field-links-hint'], /лише на одній картці, залишаються без змін/);
    assert.match(data['custom-field-link-inactive'], /не може редагувати обидві картки.*архівовано/);
    assert.match(data['custom-field-link-both'], /обидва боки.*будь-якій картці/);
    assert.match(data['custom-field-link-send'], /один бік.*головну картку/);
    assert.match(data['field-link-not-allowed'], /редагувати обидві картки/);
    assert.equal(data['import-members-mode-me'], 'Замінити їх усіх на мене');
    assert.match(data['import-many-boards-hint'], /без зіставлення учасників/);
    assert.match(data['import-many-boards-hint'], /сам є одним експортом.*є однією дошкою/);
    assert.match(data['export-all-boards-hint'], /можете експортувати.*одна книга.*\.zip/);
    assert.match(data['webhook-payload-description'], /зберігає успадковане налаштування/);
    assert.match(data['notification-delivery-quiet'], /чекати до їх завершення/);
    assert.match(data['r-wrike-workflow-note'], /як завершену.*Completed.*Cancelled.*як незавершену.*Active.*Deferred/);
    for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) {
      assert.ok(data['r-wrike-workflow-note'].includes(literal), literal);
    }
    assert.ok(data['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
    assert.notEqual(data['subtask-mark-done'], data['subtask-mark-not-done']);
  }
  console.log('Ukrainian source keys, tokens, planning and recovery warning meanings verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
