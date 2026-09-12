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
  for (const [key, phrase] of [['activity-endDate', 'датумот на завршување'],
    ['activity-receivedDate', 'датумот на прием'], ['activity-startDate', 'датумот на почеток']]) {
    assert.equal(translator.t(key, { sprintf: ['DATE', 'CARD'] }), `го промени ${phrase} во DATE на картата CARD`);
  }
  assert.match(data['admin-people-filter-inactive'], /Неактивни/);
  assert.doesNotMatch(data['admin-people-user-active'], /платном|платен/);
  assert.equal(translator.t('activity-checklist-uncompleted', { sprintf: ['CHECKLIST', 'CARD'] }),
    'го поништи завршувањето на списокот за проверка CHECKLIST на CARD');
  assert.match(data['act-newDue'], /првата потсетница/);
  assert.match(data['act-removeChecklist'], /го отстрани списокот за проверка/);
  assert.doesNotMatch(data['act-removeChecklist'], /елемент|ставка/);
  assert.match(data['act-atUserComment'], /ве спомена/);
  assert.match(data['globalSearch-instructions-notes-2'], /\*ИЛИ\*/);
  assert.match(data['globalSearch-instructions-notes-3'], /\*И\*/);
  assert.match(data['globalSearch-instructions-notes-4'], /не разликуваат мали и големи букви/);
  assert.match(data['globalSearch-instructions-notes-3'], /`__operator_list__:Available __operator_label__:red`/);
  assert.match(data['globalSearch-instructions-operator-at'], /`__operator_user_abbrev__username`/);
  assert.match(data['globalSearch-instructions-operator-has'], /`has:-due`/);
  assert.doesNotMatch(data['globalSearch-instructions-operator-has'], /има:-/);
  assert.match(data['globalSearch-instructions-operator-label'], /бојата .* или името/);
  assert.match(data['globalSearch-instructions-status-ended'], /со датум на завршување/);
  assert.doesNotMatch(data['globalSearch-instructions-status-ended'], /окончани|завршени карти/);
  assert.match(data['globalSearch-instructions-status-private'], /само во приватни табли/);
  assert.match(data['globalSearch-instructions-status-public'], /само во јавни табли/);
  assert.match(data['hideCheckedChecklistItems'], /означените ставки/);
  assert.equal(data.list, 'Список');
  assert.equal(data.swimlane, 'Лента');
  console.log('macedonianAuditedTranslations: actual date and label rendering, checklist removal meaning and native labels passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
