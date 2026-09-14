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
assert.equal(locales.zgh.server, 'ⴰⵎⴰⴽⴽⴰⵢ ⴰⵙⵏⵎⴰⵍⴰⵢ');
assert.doesNotMatch(locales.zgh.server, /Serveur|Server/);
assert.equal(locales.zgh['oidc-button-text'], 'ⵙⵏⴼⵍ ⴰⴹⵕⵉⵚ ⵏ ⵜⴳⵎⵎⵓⵜ OIDC');
assert.doesNotMatch(locales.zgh['oidc-button-text'],
  /Personnaliser|texte du bouton|ⵜⴰⵔⵃⵙⵉⵜ|ⵜⵉⵎⵉⵙⵜ/);
assert.equal(locales.zgh['oidc-button-text'].match(/OIDC/g).length, 1);
assert.equal(locales.zgh.pastdue, 'ⴰⴽⵓⴷ ⴰⵎⴳⴳⴰⵔⵓ ⴰⴷ %s ⵉⵣⵔⵉ');
assert.deepEqual(locales.zgh.pastdue.match(/%[a-z]/g), ['%s']);
assert.doesNotMatch(locales.zgh.pastdue, /La date|échéance|est passée|%d/);
assert.equal(locales.zgh['operator-has-invalid'], 'ⵜⵉⵎⵏⵥⵉⵜ ⵏ ⵉⵍⵉ %s ⵓⵔ ⵜⴽⵏⵉ');
assert.deepEqual(locales.zgh['operator-has-invalid'].match(/%[a-z]/g), ['%s']);
assert.doesNotMatch(locales.zgh['operator-has-invalid'], /n'est pas|existence valide|ⴰⵏⴽⵔⵓⴼ/);
assert.notEqual(locales.zgh['operator-has-invalid'], locales.zgh['operator-debug-invalid']);

assert.equal(locales.zgh['subtext-with-parent'], 'ⴰⴷⵓⵣⵡⵍ ⴰⴽⴷ ⵓⵎⴰⵔⴰⵡ');
assert.doesNotMatch(locales.zgh['subtext-with-parent'], /Sous-titre|parent|chemin/);
assert.notEqual(locales.zgh['subtext-with-parent'], locales.zgh['subtext-with-full-path']);

assert.equal(locales.zgh['subtext-with-full-path'], 'ⴰⴷⵓⵣⵡⵍ ⴰⴽⴷ ⵓⴱⵔⵉⴷ ⴰⴽⴽⵯ');
assert.doesNotMatch(locales.zgh['subtext-with-full-path'], /Sous-titre|chemin|complet|ⵓⵎⴰⵔⴰⵡ/);
assert.ok(locales.zgh['subtext-with-full-path'].endsWith('ⴰⴽⴽⵯ'));

const parentPrefixes = {
  'prefix-with-full-path': 'ⴰⵣⵡⵉⵔ ⴰⴽⴷ ⵓⴱⵔⵉⴷ ⴰⴽⴽⵯ',
  'prefix-with-parent': 'ⴰⵣⵡⵉⵔ ⴰⴽⴷ ⵓⵎⴰⵔⴰⵡ',
};
for (const [key, value] of Object.entries(parentPrefixes)) {
  assert.equal(locales.zgh[key], value);
  assert.doesNotMatch(locales.zgh[key], /Préfixer|chemin|parent|ⴰⴷⵓⵣⵡⵍ/);
  assert.notEqual(locales.zgh[key], locales.zgh[key.replace('prefix-', 'subtext-')]);
}
assert.notEqual(locales.zgh['prefix-with-full-path'], locales.zgh['prefix-with-parent']);

const selectedCardLabels = {
  "move-selection": "ⵙⵎⵓⵜⵜⵉ ⴰⴼⵔⴰⵏ",
  "moveSelectionPopup-title": "ⵙⵎⵓⵜⵜⵉ ⴰⴼⵔⴰⵏ",
  "copy-selection": "ⵙⵙⵏⵖⵍ ⴰⴼⵔⴰⵏ",
  "copySelectionPopup-title": "ⵙⵙⵏⵖⵍ ⴰⴼⵔⴰⵏ",
  "selection-color": "ⴰⴽⵍⵓ ⵏ ⵓⴼⵔⴰⵏ"
};
for (const [key, value] of Object.entries(selectedCardLabels)) {
  assert.equal(locales.zgh[key], value);
  assert.doesNotMatch(locales.zgh[key], /Déplacer|Copier|sélection|Couleur/);
}
assert.equal(locales.zgh['move-selection'], locales.zgh['moveSelectionPopup-title']);
assert.equal(locales.zgh['copy-selection'], locales.zgh['copySelectionPopup-title']);
assert.notEqual(locales.zgh['move-selection'], locales.zgh['copy-selection']);

assert.equal(locales.zgh['change-card-parent'], 'ⵙⵙⵏⴼⵍ ⴰⵎⴰⵔⴰⵡ ⵏ ⵜⴽⴰⵔⴹⴰ');
assert.equal(locales.zgh['show-on-card'], 'ⵙⵙⴽⵏ ⴳ ⵜⴽⴰⵔⴹⴰ');
assert.doesNotMatch(locales.zgh['change-card-parent'], /Changer|parent|carte/);
assert.doesNotMatch(locales.zgh['show-on-card'], /Afficher|sur|Card/);
assert.notEqual(locales.zgh['change-card-parent'], locales.zgh['parent-card']);

const authenticationLabels = {
  "authentication-method": "ⵜⴰⵔⵔⴰⵢⵜ ⵏ ⵓⵙⵖⵣⵏ",
  "authentication-type": "ⴰⵏⴰⵡ ⵏ ⵓⵙⵖⵣⵏ",
  "default-authentication-method": "ⵜⴰⵔⵔⴰⵢⵜ ⵏ ⵓⵙⵖⵣⵏ ⵙ ⵓⵡⵏⵓⵍ",
  "display-authentication-method": "ⵙⴽⵏ ⵜⴰⵔⵔⴰⵢⵜ ⵏ ⵓⵙⵖⵣⵏ"
};
for (const [key, value] of Object.entries(authenticationLabels)) {
  assert.equal(locales.zgh[key], value);
  assert.doesNotMatch(locales.zgh[key], /ⵓⵙⵙⵜⴱ|Authentification/);
  assert.equal((locales.zgh[key].match(/ⵓⵙⵖⵣⵏ/g) || []).length, 1);
}
assert.equal(new Set(Object.values(authenticationLabels)).size, 4);

assert.equal(locales.zgh['step-analyze-board-structure'],
  'ⴰⵙⴼⵙⵉ ⵏ ⵜⵓⵚⴽⵉⵡⵜ ⵏ ⵜⴼⵍⵡⵉⵜ');
assert.doesNotMatch(locales.zgh['step-analyze-board-structure'], /ⵙⵍⴹ|ⵜⴰⵎⵚⵓⴽⵜ|Analyser|Structure/);
assert.notEqual(locales.zgh['step-analyze-board-structure'], locales.zgh['migration-progress-note']);

assert.equal(locales.zgh.almostdue, 'ⴰⴽⵓⴷ ⴰⵎⴳⴳⴰⵔⵓ ⴰⴷ %s ⴰⵔ ⵉⵜⵜⴰⴷⵙ');
assert.deepEqual(locales.zgh.almostdue.match(/%s/g), ['%s']);
assert.doesNotMatch(locales.zgh.almostdue, /échéance|approche|ⵉⵣⵔⵉ/);
assert.notEqual(locales.zgh.almostdue, locales.zgh.pastdue);

const swimlaneHeightLabels = {
  "set-swimlane-height": "ⵙⵔⵙ ⵜⵉⵖⵣⵉ ⵏ ⵓⴱⵔⵉⴷ",
  "setSwimlaneHeightPopup-title": "ⵙⵔⵙ ⵜⵉⵖⵣⵉ ⵏ ⵓⴱⵔⵉⴷ",
  "set-swimlane-height-value": "ⵜⵉⵖⵣⵉ ⵏ ⵓⴱⵔⵉⴷ (px)"
};
for (const [key, value] of Object.entries(swimlaneHeightLabels)) {
  assert.equal(locales.zgh[key], value);
  assert.doesNotMatch(locales.zgh[key], /[\u0600-\u06ff]/);
}
assert.equal(locales.zgh['set-swimlane-height'], locales.zgh['setSwimlaneHeightPopup-title']);
assert.match(locales.zgh['set-swimlane-height-value'], /\(px\)$/);
