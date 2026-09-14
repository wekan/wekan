const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const languages = ['id', 'oc', 'pt-BR', 'tk_TM', 'zgh'];
const locales = {};
for (const language of languages) {
  const result = spawnSync(process.execPath, [fillScript, '--list', language], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
}
const cards = JSON.parse(locales.id['copyManyCardsPopup-format']);
assert.equal(cards.length, 3);
assert.equal(cards[0].title, 'Judul kartu pertama');
assert.equal(locales.oc['select-none'], 'Seleccionar pas res');
assert.equal(locales['pt-BR'].backup, 'Cópia de segurança');
assert.equal(locales.tk_TM['select-none'], 'Hiç birini saýlama');
assert.match(locales.zgh['globalSearch-instructions-operator-number'], /__operator_number__:<number>.*<number>/);
for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}

assert.equal(locales.zgh.change, 'ⵙⵏⴼⵍ');
assert.equal(locales.zgh.change, locales.zgh.edit);
assert.doesNotMatch(locales.zgh.change, /Modifier/);

for (const [key, value] of Object.entries({register:'ⵙⵏⵓⵍⴼⵓ ⴰⵎⵉⴹⴰⵏ',log:'ⵉⵣⵎⵎⵉⵎⵏ',summary:'ⴰⵙⴳⵣⵍ'})) {
 assert.equal(locales.zgh[key], value);
 assert.doesNotMatch(locales.zgh[key], /enregistrer|Journal|ⴰⴳⵣⵓⵎ/);
}
assert.notEqual(locales.zgh.summary, locales.zgh.history);

assert.equal(locales.zgh['calendar-system-buddhist'], 'ⴰⵙⵎⵍⵓⵙⵙⴰⵏ ⴰⴱⵓⴷⴷⵉ');
assert.doesNotMatch(locales.zgh['calendar-system-buddhist'], /Buddhist/);
assert.notEqual(locales.zgh['calendar-system-buddhist'], locales.zgh['calendar-system-islamic']);

assert.equal(locales.zgh['calendar-system-hebrew'], 'ⴰⵙⵎⵍⵓⵙⵙⴰⵏ ⴰⵄⵉⴱⵔⵉ');
assert.doesNotMatch(locales.zgh['calendar-system-hebrew'], /Hebrew/);
assert.notEqual(locales.zgh['calendar-system-hebrew'], locales.zgh['calendar-system-buddhist']);

assert.equal(locales.zgh['calendar-system-indian'], 'ⴰⵙⵎⵍⵓⵙⵙⴰⵏ ⴰⵏⴰⵎⵓⵔ ⵏ ⵍⵀⵉⵏⴷ');
assert.match(locales.zgh['calendar-system-indian'], /ⴰⵏⴰⵎⵓⵔ/);
assert.doesNotMatch(locales.zgh['calendar-system-indian'], /Indian national/);
assert.notEqual(locales.zgh['calendar-system-indian'], locales.zgh['calendar-system-chinese']);

for (const key of ["r-name", "r-sort-name"]) {
  assert.equal(locales.zgh[key], "ⵉⵙⵎ");
  assert.doesNotMatch(locales.zgh[key], /nom|name/i);
}

const oneUnitIntervals = {
  'every-1-day': 'ⴽⵓ ⴰⵙⵙ',
  'every-1-hour': 'ⴽⵓ ⵜⴰⵙⵔⴰⴳⵜ',
  'every-1-minute': 'ⴽⵓ ⵜⵓⵙⴷⵉⴷⵜ',
};
for (const [key, value] of Object.entries(oneUnitIntervals)) {
  assert.equal(locales.zgh[key], value);
  assert.doesNotMatch(locales.zgh[key], /Tous|Toutes|jours|heures|minutes/);
}
assert.equal(new Set(Object.keys(oneUnitIntervals).map(key => locales.zgh[key])).size, 3);
const numericIntervals = {
  'every-5-minutes': 'ⴽⵓ 5 ⵏ ⵜⵓⵙⴷⵉⴷⵉⵏ',
  'every-10-minutes': 'ⴽⵓ 10 ⵏ ⵜⵓⵙⴷⵉⴷⵉⵏ',
  'every-30-minutes': 'ⴽⵓ 30 ⵏ ⵜⵓⵙⴷⵉⴷⵉⵏ',
  'every-6-hours': 'ⴽⵓ 6 ⵏ ⵜⵙⵔⴰⴳⵉⵏ',
};
for (const [key, value] of Object.entries(numericIntervals)) {
  assert.equal(locales.zgh[key], value);
  assert.doesNotMatch(locales.zgh[key], /Toutes|minutes|heures/);
  assert.equal(locales.zgh[key].match(/\d+/)[0], key.split('-')[1]);
}
assert.equal(new Set(Object.values(numericIntervals)).size, 4);
assert.equal(locales.zgh['r-w-every-day-at'], 'ⴽⵓ ⴰⵙⵙ ⴳ __time__');
assert.deepEqual(locales.zgh['r-w-every-day-at'].match(/__[a-z]+__/g), ['__time__']);
assert.doesNotMatch(locales.zgh['r-w-every-day-at'], /ⴽⵓⵍ|ⴷⴻⴳ|Every|Tous/);
assert.equal(locales.zgh['r-w-every-day-at'].replace('__time__', '09:00'),
  'ⴽⵓ ⴰⵙⵙ ⴳ 09:00');
assert.equal(locales.zgh['migration-progress-note'],
  'ⴳⴳⴰⵏⵉ ⴽⵓⴷ ⴰⵔ ⵏⵙⵎⵓⵜⵜⵓⵢ ⵜⴰⴼⵍⵡⵉⵜ ⵏⵏⴽ ⵖⵔ ⵜⵓⵚⴽⵉⵡⵜ ⵜⴰⵎⴳⴳⴰⵔⵓⵜ...');
assert.doesNotMatch(locales.zgh['migration-progress-note'],
  /Veuillez|patienter|migration de votre|dernière structure/);
assert.equal(locales.zgh['step-fix-orphaned-cards'],
  'ⵙⵙⴰⵖⴷ ⵜⵉⴽⴰⵔⴹⵉⵡⵉⵏ ⵜⵉⴳⵓⵊⵉⵍⵉⵏ');
assert.doesNotMatch(locales.zgh['step-fix-orphaned-cards'], /Corriger|cartes|orphelines/);
