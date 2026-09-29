'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = read('en'), ru = read('ru');
  // Synchronization and recovery sections remain pending in this locale.
  assert.deepEqual(Object.keys(ru), Object.keys(en).filter(key => key in ru));
  for (const key of Object.keys(en)) {
    if (key in ru) assert.deepEqual(translationTokens(ru[key]), translationTokens(en[key]), key);
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
  console.log('Russian filters, Scrum and preferences preserve tokens and restrictions');
})().catch(error => { console.error(error); process.exitCode = 1; });
