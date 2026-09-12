'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const i18next = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/mk.i18n.json'), 'utf8'));
(async () => {
  const translator = i18next.createInstance().use(sprintf);
  await translator.init({ lng: 'mk', fallbackLng: false, keySeparator: false,
    interpolation: { prefix: '__', suffix: '__', escapeValue: false },
    resources: { mk: { translation: data } }, postProcess: ['sprintf'] });
  assert.equal(translator.t('act-a-endAt', { timeValue: 'NEW_TIME', timeOldValue: 'OLD_TIME' }),
    'го промени времето на завршување во NEW_TIME од (OLD_TIME)');
  assert.equal(translator.t('activity-added-label', { sprintf: ['LABEL', 'CARD'] }),
    'додаде ознака «LABEL» на CARD');
  assert.equal(translator.t('activity-dueDate', { sprintf: ['DATE', 'CARD'] }),
    'го промени рокот во DATE на картата CARD');
  assert.equal(translator.t('activity-checklist-uncompleted', { sprintf: ['CHECKLIST', 'CARD'] }),
    'го поништи завршувањето на списокот за проверка CHECKLIST на CARD');
  assert.match(data['act-newDue'], /првата потсетница/);
  assert.match(data['act-removeChecklist'], /го отстрани списокот за проверка/);
  assert.doesNotMatch(data['act-removeChecklist'], /елемент|ставка/);
  assert.match(data['act-atUserComment'], /ве спомена/);
  assert.equal(data.list, 'Список');
  assert.equal(data.swimlane, 'Лента');
  console.log('macedonianAuditedTranslations: actual date and label rendering, checklist removal meaning and native labels passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
