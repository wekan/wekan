'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'imports/i18n/data');
const read = code => JSON.parse(fs.readFileSync(path.join(dir,
  `${code}.i18n.json`), 'utf8'));
const english = read('en');
const key = 'list-width-error-message';
assert.equal(english[key],
  'List width must be a whole number of at least 200 pixels');
const cases = [
  { prefix: 'de', files: 4,
    value: 'Die Breite der Liste muss eine ganze Zahl von mindestens 200 Pixeln sein.',
    words: /ganze Zahl.*mindestens 200 Pixeln/u },
  { prefix: 'es', files: 9,
    value: 'El ancho de la lista debe ser un número entero de al menos 200 píxeles.',
    words: /número entero.*al menos 200 píxeles/u },
  { prefix: 'fr', files: 5,
    value: "La largeur de la liste doit être un nombre entier d'au moins 200 pixels.",
    words: /nombre entier.*au moins 200 pixels/u },
  { prefix: 'it', files: 1,
    value: 'La larghezza della lista deve essere un numero intero di almeno 200 pixel.',
    words: /numero intero.*almeno 200 pixel/u },
  { prefix: 'pt-BR', files: 1,
    value: 'A largura da lista deve ser um número inteiro de pelo menos 200 pixels.',
    words: /número inteiro.*pelo menos 200 pixels/u },
  { prefix: 'pt-OTHER', files: 3,
    value: 'A largura da lista tem de ser um número inteiro de pelo menos 200 pixels.',
    words: /número inteiro.*pelo menos 200 pixels/u },
];
const ledger = JSON.parse(fs.readFileSync(path.join(root,
  'releases/translations/audited-corrections.json'), 'utf8'));
let total = 0;
for (const group of cases) {
  const codes = fs.readdirSync(dir).filter(file => {
    const code = file.replace(/\.i18n\.json$/, '');
    if (!file.endsWith('.i18n.json')) return false;
    if (group.prefix === 'pt-OTHER')
      return code === 'pt' || code === 'pt-PT' || code === 'pt_PT';
    if (group.prefix === 'pt-BR') return code === 'pt-BR';
    if (group.prefix === 'it') return code === 'it';
    return code === group.prefix || code.startsWith(`${group.prefix}-`) ||
      code.startsWith(`${group.prefix}_`);
  }).map(file => file.replace(/\.i18n\.json$/, ''));
  assert.equal(codes.length, group.files, group.prefix);
  for (const code of codes) {
    const data = read(code);
    assert.equal(data[key], group.value, code);
    assert.match(data[key], group.words, `${code}: integer and inclusive rule`);
    assert.doesNotMatch(data[key], /270|größer|mayor|supérieur|maggiore|maior/u,
      `${code}: stale strict rule removed`);
    const rows = ledger.filter(row => row.locale === code && row.key === key);
    assert.equal(rows.length, 1, `${code}: one correction record`);
    assert.equal(rows[0].after, data[key]);
    assert.match(rows[0].before, /270/u);
    total++;
  }
}
assert.equal(total, 23);
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'es', fallbackLng: false,
    resources: { es: { translation: read('es') } } });
  assert.equal(i18n.t(key), cases[1].value);
  console.log(`${total} Romance/Germanic list-width rules and runtime pass.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
