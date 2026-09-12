'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const i18next = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/sk.i18n.json'), 'utf8'));
(async () => {
  const { repairProgress } = await import('../releases/translations/audit-progress.mjs');
  assert.equal(repairProgress().pendingByLocale.sk, undefined, 'Slovak audit queue complete');
  assert.match(data['calendar-system-islamic-rgsa'], /pozorovanie Mesiaca/);
  assert.match(data['calendar-system-islamic-tbla'], /tabuľkový, astronomická epocha/);
  assert.match(data['server-error-troubleshooting'], /`sudo snap logs wekan.wekan`/);
  assert.match(data['server-error-troubleshooting'], /`sudo docker logs wekan-app`/);
  const translator = i18next.createInstance().use(sprintf);
  await translator.init({ lng: 'sk', fallbackLng: false, keySeparator: false,
    resources: { sk: { translation: data } }, postProcess: ['sprintf'] });
  for (const [key, meaning] of [
    ['activity-dueDate', 'termín dokončenia'], ['activity-endDate', 'dátum ukončenia'],
    ['activity-receivedDate', 'dátum prijatia'], ['activity-startDate', 'dátum začiatku'],
  ]) assert.equal(translator.t(key, { sprintf: ['DATE_SENTINEL', 'CARD_SENTINEL'] }),
    `zmenil(a) ${meaning} na DATE_SENTINEL na karte CARD_SENTINEL`);
  assert.equal(translator.t('activity-checked-item', { sprintf: ['ITEM', 'CHECKLIST', 'CARD'] }),
    'zaškrtol(a) ITEM v kontrolnom zozname CHECKLIST na karte CARD');
  assert.equal(translator.t('activity-unchecked-item', { sprintf: ['ITEM', 'CHECKLIST', 'CARD'] }),
    'zrušil(a) zaškrtnutie ITEM v kontrolnom zozname CHECKLIST na karte CARD');
  assert.match(data['globalSearch-instructions-status-ended'], /dátumom ukončenia/);
  assert.match(data['globalSearch-instructions-operator-user'], /členom.*zodpovednou osobou/);
  assert.match(data['import-board-instruction-trello'], /«Menu», potom «More», «Print and Export», «Export JSON»/);
  assert.match(data['import-board-instruction-csv'], /CSV.*TSV/);
  assert.match(data['globalSearch-instructions-notes-2'], /\*ALEBO\*/);
  assert.match(data['globalSearch-instructions-notes-3'], /\*A\*/);
  assert.match(data['globalSearch-instructions-notes-4'], /nerozlišuje veľké a malé písmená/);
  assert.match(data['globalSearch-instructions-description'], /`__operator_list__:"To Review"`/);
  assert.match(data['globalSearch-instructions-operator-has'], /`has:-due`/);
  assert.match(data['custom-field-stringtemplate-format'], /%\{value\}/);
  assert.match(data['custom-field-stringtemplate-separator'], /&#32;.*&nbsp;/);
  for (const card of JSON.parse(data['copyManyCardsPopup-format'])) {
    assert.deepEqual(Object.keys(card), ['title', 'description']);
    assert.match(card.title, /Názov/);
    assert.match(card.description, /Popis/);
  }
  assert.match(data['card-delete-pop'], /nebude možné znovu otvoriť/);
  assert.match(data['board-delete-notice'], /Vymazanie je trvalé/);
  assert.match(data['activity-checklist-uncompleted'], /zrušil\(a\) dokončenie/);
  const records = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json'), 'utf8'));
  for (const row of records.filter(row => row.locale === 'sk')) {
    assert.doesNotMatch(row.after, /[řěů]|\bpřidal|\bsloupc|\buživatel/i, row.key);
  }
  console.log('slovakAuditedTranslations: Slovak vocabulary, checklist action meaning and real sprintf date/card order passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
