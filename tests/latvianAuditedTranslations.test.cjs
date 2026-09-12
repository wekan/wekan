'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const i18next = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const root = path.resolve(__dirname, '..');
const lv = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/lv.i18n.json'), 'utf8'));
const records = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json'), 'utf8')).filter(row => row.locale === 'lv');
assert.equal(records.length, 403, '402 wording corrections plus the earlier JSON example repair');
for (const row of records) assert.doesNotMatch(row.after, /pridė|kortelės|sąrašo|vartotoj|jungtis/i, row.key);
assert.equal(lv['custom-field-stringtemplate-format'], 'Formāts (izmantojiet %{value} kā vietturi)');
assert.match(lv['globalSearch-instructions-notes-2'], /\*VAI\*/);
assert.match(lv['globalSearch-instructions-notes-3'], /\*UN\*/);
(async () => {
  const translator = i18next.createInstance().use(sprintf);
  await translator.init({ lng: 'lv', fallbackLng: false, keySeparator: false,
    resources: { lv: { translation: lv } }, postProcess: ['sprintf'] });
  for (const [key, dateType] of [
    ['activity-dueDate', 'izpildes termiņu'], ['activity-endDate', 'beigu datumu'],
    ['activity-receivedDate', 'saņemšanas datumu'], ['activity-startDate', 'sākuma datumu'],
  ]) {
    const rendered = translator.t(key, { sprintf: ['DATE_SENTINEL', 'CARD_SENTINEL'] });
    assert.equal(rendered, `mainīja ${dateType} uz DATE_SENTINEL kartītei CARD_SENTINEL`, 'date and card arguments retain their actual call order');
  }
  console.log('latvianAuditedTranslations: audited vocabulary, intact template code, Boolean search meaning and real sprintf argument order passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
