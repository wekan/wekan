'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = read('en'), uk = read('uk');
  // Scrum and recovery sections are still pending in this locale.
  assert.deepEqual(Object.keys(uk), Object.keys(en).filter(key => key in uk));
  for (const key of Object.keys(en)) {
    if (key in uk) assert.deepEqual(translationTokens(uk[key]), translationTokens(en[key]), key);
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
  console.log('Ukrainian filter and preference prose preserves tokens and restrictions');
})().catch(error => { console.error(error); process.exitCode = 1; });
