'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = read('en'), uk = read('uk');
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
  console.log('Ukrainian source keys, tokens, planning and recovery warning meanings verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
