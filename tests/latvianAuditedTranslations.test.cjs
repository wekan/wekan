'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const i18next = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const root = path.resolve(__dirname, '..');
const lv = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/lv.i18n.json'), 'utf8'));
const records = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json'), 'utf8')).filter(row => row.locale === 'lv');
assert.ok(records.length >= 403,
  'retain the 402 wording corrections and earlier JSON example repair');
assert.equal(new Set(records.map(row => row.key)).size, records.length,
  'later semantic repairs keep one correction record per key');
for (const row of records) assert.equal(row.after, lv[row.key], row.key);
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

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  assert.deepEqual(Object.keys(lv), Object.keys(en));
  for (const key of Object.keys(en)) assert.deepEqual(translationTokens(lv[key]), translationTokens(en[key]), key);
  assert.deepEqual(JSON.parse(require('node:child_process').execFileSync(process.execPath,
    ['releases/translations/fill-translations.mjs', '--list', 'lv'], { cwd: root, encoding: 'utf8' })), {});
  assert.match(lv['custom-field-links-hint'], /vienādu nosaukumu un tipu abās kartiņās/);
  assert.match(lv['custom-field-links-hint'], /tikai vienā kartiņā, paliek nemainīti/);
  assert.match(lv['custom-field-link-inactive'], /vairs nevar rediģēt abas kartiņas.*arhivēta/);
  assert.match(lv['custom-field-link-both'], /Abos virzienos.*jebkurā kartiņā/);
  assert.match(lv['custom-field-link-send'], /Vienā virzienā.*galveno kartiņu/);
  assert.match(lv['field-link-not-allowed'], /rediģēt abas kartiņas/);
  assert.equal(lv['import-members-mode-me'], 'Aizstāt visus ar manu lietotāja kontu');
  assert.match(lv['import-many-boards-hint'], /bez dalībnieku piesaistes/);
  assert.match(lv['import-many-boards-hint'], /pats par sevi ir viens eksports.*ir viens dēlis/);
  assert.match(lv['export-all-boards-hint'], /varat eksportēt.*darbgrāmata.*\.zip/);
  assert.match(lv['webhook-payload-description'], /saglabā mantoto iestatījumu/);
  assert.match(lv['notification-delivery-quiet'], /gaidīt, līdz tās beidzas/);
  assert.match(lv['r-wrike-workflow-note'], /kā pabeigtu.*Completed.*Cancelled.*kā nepabeigtu.*Active.*Deferred/);
  for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) assert.ok(lv['r-wrike-workflow-note'].includes(literal));
  assert.ok(lv['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
  assert.match(lv['subtask-mark-done'], /kā pabeigtu$/);
  assert.match(lv['subtask-mark-not-done'], /kā nepabeigtu$/);
  assert.equal(lv['notification-delivery-part-list'], 'Saraksts');
  assert.equal(lv['notification-delivery-part-swimlane'], 'Josla');
  for (const key of ['custom-field-links-hint', 'csv-mapping-description', 'import-many-boards-hint']) {
    assert.doesNotMatch(lv[key], /kortelė|kortelės|sąraš|vartotoj|pavadinim/iu, key);
  }
  console.log('Latvian current catalog, exact tokens and link/import/notification semantics pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
