// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = read('en'), ru = read('ru');
  for (const code of ['ru', 'ru_RU', 'ru-UA']) {
    const data = read(code);
    assert.deepEqual(Object.keys(data), Object.keys(en), code);
    for (const key of Object.keys(en)) {
      assert.deepEqual(translationTokens(data[key]), translationTokens(en[key]), `${code}:${key}`);
      if (/^(interrupted-import-|stuck-sync-operation-|ldap-sync-now)/.test(key)) {
        assert.notEqual(data[key], en[key], `${code}:${key}`);
        assert.match(data[key], /[А-Яа-яЁё]/, `${code}:${key}`);
      }
    }
    assert.match(data['interrupted-import-description'], /невозможно продолжить/);
    assert.match(data['interrupted-import-description'], /включая всё добавленное с тех пор/);
    assert.match(data['interrupted-import-keep-confirm'], /Ничего не удаляется/);
    assert.match(data['interrupted-import-discard-confirm'], /удалены навсегда/);
    assert.match(data['interrupted-import-foreign-board'], /она не изменена/);
    assert.match(data['interrupted-import-truncated'], /50 самых старых/);
    assert.match(data['stuck-sync-operation-description'], /уже применённые изменения сохраняются/);
    assert.match(data['stuck-sync-operation-description'], /никогда не записываются/);
    assert.match(data['stuck-sync-operation-replayable-now'], /нельзя отбросить/);
    assert.match(data['stuck-sync-operation-replayable'], /не была отброшена/);
    assert.match(data['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS/);
    assert.match(data['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED/);
    assert.ok(data['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
    assert.ok(data['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
    assert.match(data['r-moved-forward'], /вперёд/);
    assert.match(data['r-moved-back'], /назад/);
    assert.match(data['login-origin-mismatch'], /ROOT_URL/);
  }
  for (const code of ['ru', 'ru_RU', 'ru-UA']) {
    const data = read(code);
    assert.match(data['scrum-import-into-board-hint'], /не дублируются/);
    assert.match(data['scrum-import-card-on-another-board'], /оставлена без изменений/);
    assert.match(data['sync-planning-hint'], /сначала по ID в источнике, затем по названию/);
    assert.match(data['sync-planning-hint'], /Первая синхронизация никогда не удаляет планирование/);
    assert.match(data['scrum-history-checkpoint-hint'], /не менял никто другой/);
    assert.match(data['scrum-history-checkpoint-hint'], /не меняет записи/);
    assert.match(data['scrum-history-checkpoint-discard-confirm'], /уже записала/);
    for (const key of Object.keys(en).filter(key => key.startsWith('scrum-import-') || key.startsWith('sync-planning-'))) {
      assert.notEqual(data[key], en[key], `${code}:${key}`);
      assert.deepEqual(translationTokens(data[key]), translationTokens(en[key]), `${code}:${key}`);
    }
  }
  assert.deepEqual(Object.keys(ru), Object.keys(en));
  for (const key of Object.keys(en)) {
    assert.deepEqual(translationTokens(ru[key]), translationTokens(en[key]), key);
    if (/^(filter-recency-|filter-date-range-|filter-column-age|filter-preset|notification-activity-|auto-archive-|due-reminder-|import-report-)/.test(key)) {
      assert.ok(ru[key]?.trim(), key);
      assert.notEqual(ru[key], en[key], key);
      assert.match(ru[key], /[А-Яа-яЁё]/, key);
    }
  }
  for (const key of ['r-trigger-vars-hint', 'r-vars-people-hint']) {
    assert.notEqual(ru[key], en[key], key);
    assert.deepEqual(ru[key].match(/\{[^{}]+\}/g), en[key].match(/\{[^{}]+\}/g), key);
  }
  assert.deepEqual(ru['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g),
    en['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g));
  assert.match(ru['advanced-filter-card-dates-hint'], /@endAt = none/);
  assert.match(ru['filter-column-age-hint'], /не обнуляет/);
  assert.match(ru['instance-desc'], /никогда не показывается/);
  assert.match(ru['instance-desc'], /только люди, добавленные на доску/);
  assert.match(ru['board-instance-info'], /<strong>всем пользователям, вошедшим в систему<\/strong>/);
  assert.match(ru['notification-activity-description'], /@упоминания приходят всегда/);
  assert.match(ru['auto-archive-hint'], /каждый час.*шаблоны никогда.*Оставьте пустым/);
  assert.match(ru['import-report-description'], /Доска создана.*не удалось перенести/);
  assert.notEqual(ru['dependency-type-duplicates'], ru['dependency-type-is-duplicated-by']);
  for (const scheme of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) {
    assert.equal(ru['automatic-linked-url-schemes-hint'].split(scheme).length - 1, 1, scheme);
  }
  for (const key of Object.keys(en).filter(key => key.startsWith('scrum-'))) {
    assert.ok(ru[key]?.trim(), key);
    assert.notEqual(ru[key], en[key], key);
    assert.match(ru[key], /[А-Яа-яЁё]/, key);
  }
  assert.match(ru['scrum-report-help'], /это не нулевые оценки/);
  assert.match(ru['scrum-daily-observations-help'], /не фиксируют каждое изменение/);
  assert.match(ru['scrum-confirm-cancel'], /останутся назначенными/);
  assert.notEqual(ru['scrum-category-todo'], ru['scrum-category-done']);
  assert.equal(ru['blockly-CONTEXT_MENU_KEY'], '≣ Меню');
  for (const key of Object.keys(en).filter(key => key.startsWith('sync-'))) {
    assert.ok(ru[key]?.trim(), key);
    assert.notEqual(ru[key], en[key], key);
    assert.match(ru[key], /[А-Яа-яЁё]/, key);
  }
  assert.match(ru['sync-conflict-hint'], /В исходную систему ничего не отправляется/);
  assert.match(ru['sync-report-partial'], /не возобновляют и не отменяют/);
  assert.match(ru['sync-time-estimate-hint'], /явное null очищает/);
  assert.match(ru['sync-conflict-detach-hint'], /содержимое останется/);
  for (const key of Object.keys(en).filter(key => /^(email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-)/.test(key))) {
    assert.ok(ru[key]?.trim(), key);
    assert.notEqual(ru[key], en[key], key);
    assert.match(ru[key], /[А-Яа-яЁё]/, key);
  }
  assert.match(ru['activity-recovery-cancel-confirm'], /нельзя будет возобновить/);
  assert.match(ru['email-recovery-confirm-cancel'], /Новые сообщения.*сохранятся/);
  assert.notEqual(ru['move-selection-before'], ru['move-selection-after']);
  const inventory = spawnSync(process.execPath,
    ['releases/translations/fill-translations.mjs', '--completed-catalog', '--list', 'ru'],
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.equal(inventory.status, 0, inventory.stderr);
  assert.deepEqual(JSON.parse(inventory.stdout), {});
  console.log('Russian source keys, tokens, planning and recovery warning meanings verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
