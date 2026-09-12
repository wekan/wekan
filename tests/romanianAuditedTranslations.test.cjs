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
    assert.ok(repaired.length >= 80, `${locale}: first reviewed Romanian batch`);
    for (const row of repaired) assert.doesNotMatch(row.after, /\bbachec[ah]|\bsched[ae]\b|\butenti\b|\baggiunt[ao]\b|\bnell[ao]\b/i, row.key);
    assert.equal(data.board, 'Panou');
    assert.equal(data.card, 'Card');
    assert.equal(data.checklist, 'Listă de verificare');
    const translator = i18next.createInstance().use(sprintf);
    await translator.init({ lng: locale, fallbackLng: false, keySeparator: false,
      resources: { [locale]: { translation: data } }, postProcess: ['sprintf'] });
    assert.equal(translator.t('activity-added-label', { sprintf: ['LABEL_SENTINEL', 'CARD_SENTINEL'] }),
      'a adăugat eticheta «LABEL_SENTINEL» la CARD_SENTINEL');
    assert.equal(translator.t('activity-subtask-added', { sprintf: ['CARD_SENTINEL'] }),
      'a adăugat o subsarcină la CARD_SENTINEL', 'no stray literal digit before the card argument');
    assert.equal(translator.t('activity-checklist-item-added', { sprintf: ['CHECKLIST_SENTINEL', 'CARD_SENTINEL'] }),
      'a adăugat un element în lista de verificare «CHECKLIST_SENTINEL» de pe CARD_SENTINEL');
  }
  console.log('romanianAuditedTranslations: native kanban labels, absence of Italian seed words and real sprintf argument order passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
