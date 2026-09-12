'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const i18next = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const records = read('releases/translations/audited-corrections.json');
(async () => {
  for (const locale of ['ro', 'ro-RO']) {
    const data = read(`imports/i18n/data/${locale}.i18n.json`);
    const repaired = records.filter(row => row.locale === locale);
    assert.ok(repaired.length >= 414, `${locale}: reviewed Romanian activity and instruction batches`);
    for (const row of repaired) assert.doesNotMatch(row.after, /\bbachec[ah]|\bsched[ae]\b|\butenti\b|\baggiunt[ao]\b|\bnell[ao]\b/i, row.key);
    assert.equal(data.board, 'Panou');
    assert.equal(data.card, 'Card');
    assert.equal(data.checklist, 'Listă de verificare');
    assert.match(data['globalSearch-instructions-notes-2'], /\*SAU\*/);
    assert.match(data['globalSearch-instructions-notes-3'], /\*ȘI\*/);
    assert.match(data['globalSearch-instructions-notes-3'], /`__operator_list__:Available __operator_label__:red`/);
    assert.match(data['globalSearch-instructions-description'], /`__operator_list__:"To Review"`/);
    for (const card of JSON.parse(data['copyManyCardsPopup-format'])) {
      assert.deepEqual(Object.keys(card), ['title', 'description']);
      assert.match(card.title, /Titlul/);
      assert.match(card.description, /Descrierea/);
    }
    assert.match(data['map-to-existing-user-desc'], /nu poate acorda mai multe permisiuni/);
    assert.match(data['activity-checklist-uncompleted-card'], /anulat finalizarea/);
    assert.match(data['calendar-system-islamic-rgsa'], /Arabia Saudită, observarea lunii/);
    assert.match(data['calendar-system-islamic-tbla'], /tabular, epocă astronomică/);
    assert.match(data['import-board-instruction-trello'], /«Menu», apoi «More», «Print and Export», «Export JSON»/);
    const source = read('imports/i18n/data/en.i18n.json')['advanced-filter-description'];
    for (const example of ["Field1 == Value1", "'Field 1' == 'Value 1'", "Field1 == I\\'m",
      'F1 == V1 || F1 == V2', 'F1 == V1 && ( F2 == V2 || F2 == V3 )', 'F1 == /Tes.*/i']) {
      assert.ok(source.includes(example), 'example matches actual source syntax');
      assert.ok(data['advanced-filter-description'].includes(example), `${locale}: executable example preserved`);
    }
    const { repairProgress } = await import('../releases/translations/audit-progress.mjs');
    const progress = repairProgress();
    assert.equal(progress.pendingByLocale[locale] || 0, 0, 'all Romanian audit findings resolved');
    const translator = i18next.createInstance().use(sprintf);
    await translator.init({ lng: locale, fallbackLng: false, keySeparator: false,
      resources: { [locale]: { translation: data } }, postProcess: ['sprintf'] });
    for (const [key, phrase] of [
      ['activity-dueDate', 'termenul'], ['activity-endDate', 'data de încheiere'],
      ['activity-receivedDate', 'data de primire'], ['activity-startDate', 'data de început'],
    ]) assert.equal(translator.t(key, { sprintf: ['DATE_SENTINEL', 'CARD_SENTINEL'] }),
      `a modificat ${phrase} în DATE_SENTINEL pentru CARD_SENTINEL`, 'date argument precedes card argument');
    assert.equal(translator.t('activity-added-label', { sprintf: ['LABEL_SENTINEL', 'CARD_SENTINEL'] }),
      'a adăugat eticheta «LABEL_SENTINEL» la CARD_SENTINEL');
    assert.equal(translator.t('activity-subtask-added', { sprintf: ['CARD_SENTINEL'] }),
      'a adăugat o subsarcină la CARD_SENTINEL', 'no stray literal digit before the card argument');
    assert.equal(translator.t('activity-checklist-item-added', { sprintf: ['CHECKLIST_SENTINEL', 'CARD_SENTINEL'] }),
      'a adăugat un element în lista de verificare «CHECKLIST_SENTINEL» de pe CARD_SENTINEL');
  }
  console.log('romanianAuditedTranslations: native kanban labels, absence of Italian seed words and real sprintf argument order passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
