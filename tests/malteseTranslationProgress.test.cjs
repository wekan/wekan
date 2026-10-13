// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const readLocale = code => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${code}.i18n.json`),
  'utf8',
));
const english = readLocale('en');
const maltese = readLocale('mt');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--completed-catalog', '--list',
  'mt',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Maltese value stays translated');

for (const [key, value] of Object.entries(maltese)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(maltese.accept, 'Aċċetta');
assert.equal(maltese.actions, 'Azzjonijiet');
assert.equal(maltese['allboards.workspaces'], 'Spazji tax-xogħol');
assert.equal(maltese['color-black'], 'iswed');
assert.equal(maltese['color-red'], 'aħmar');
assert.equal(maltese['color-white'], 'abjad');
assert.deepEqual(tokens(maltese['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(maltese['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);

console.log('malteseTranslationProgress: earlier catalog and locale-wide token checks passed');

for (const key of Object.keys(english).filter(k => /^(csv-mapping-|import-members-mode-|invalid-import-mapping$)/.test(k))) {
  assert.notEqual(maltese[key], english[key], key);
  assert.deepEqual(tokens(maltese[key]), tokens(english[key]), key);
}
assert.match(maltese['import-members-mode-placeholder'], /bl-ismijiet tagħhom stess.*utenti reali aktar tard/);
assert.match(maltese['import-members-mode-map'], /utent eżistenti għal kull/);
assert.match(maltese['import-members-mode-me'], /kollha jirrappreżentaw lili/);
assert.match(maltese['csv-mapping-list-missing'], /lista waħda.*kull karta/);
assert.match(maltese['csv-mapping-list-required'], /jew agħżel il-kolonna/);
assert.match(maltese['csv-mapping-skipped-sheets'], /ma jiġux importati/);
assert.match(maltese['invalid-import-mapping'], /ma jaqbilx mal-fajl/);
