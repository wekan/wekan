'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = read('en'), pl = read('pl');
  assert.deepEqual(Object.keys(pl), Object.keys(en));
  for (const key of Object.keys(en)) {
    assert.deepEqual(translationTokens(pl[key]), translationTokens(en[key]), key);
  }
  for (const key of ['filter-column-age-hint', 'scrum-report-help', 'sync-preview-saved',
    'email-recovery-description', 'activity-recovery-cancel-confirm', 'saml-login-not-started',
    'instance-desc', 'r-trigger-vars-hint', 'r-vars-people-hint']) {
    assert.ok(pl[key]?.trim(), key);
    assert.notEqual(pl[key], en[key], key);
  }
  for (const key of ['r-trigger-vars-hint', 'r-vars-people-hint']) {
    assert.deepEqual(pl[key].match(/\{[^{}]+\}/g), en[key].match(/\{[^{}]+\}/g), key);
  }
  assert.deepEqual(pl['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g),
    en['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g));
  assert.match(pl['advanced-filter-card-dates-hint'], /@endAt = none/);
  assert.match(pl['scrum-report-help'], /nie są oszacowaniami zerowymi/);
  assert.match(pl['sync-conflict-hint'], /Nic nie jest wysyłane do systemu źródłowego/);
  assert.match(pl['activity-recovery-cancel-confirm'], /Nie będzie można ich wznowić/);
  assert.match(pl['email-recovery-confirm-cancel'], /Nowe wiadomości.*zostaną zachowane/);
  assert.match(pl['instance-desc'], /osobom niezalogowanym/);
  assert.match(pl['instance-desc'], /Edytować mogą tylko osoby dodane do tablicy/);
  assert.match(pl['board-instance-info'], /<strong>każdego zalogowanego użytkownika<\/strong>/);
  assert.equal(pl['move-selection-before'], 'Przed');
  assert.equal(pl['move-selection-after'], 'Po');
  assert.notEqual(pl['move-selection-before'], pl['move-selection-after']);
  for (const key of ['blockly-MATH_ADDITION_SYMBOL_ARIA', 'blockly-MATH_SUBTRACTION_SYMBOL_ARIA',
    'blockly-INPUT_LABEL_NUMBER_MIN', 'blockly-ENTER_KEY', 'scrum-master']) {
    assert.equal(pl[key], en[key], key + ': reviewed shared term');
  }
  const inventory = spawnSync(process.execPath,
    ['releases/translations/fill-translations.mjs', '--list', 'pl'], { cwd: root, encoding: 'utf8' });
  assert.equal(inventory.status, 0, inventory.stderr);
  assert.deepEqual(JSON.parse(inventory.stdout), {});
  console.log('Polish translation coverage, source order, syntax and warning meanings verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
