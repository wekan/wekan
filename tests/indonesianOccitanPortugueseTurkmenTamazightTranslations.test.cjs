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

assert.equal(locales.zgh['smtp-tls-description'],
  'ⵙⵙⵔⴼⵓ ⴰⵙⵎⵔⵙ ⵏ TLS ⵉ ⵓⵎⴰⴽⴽⴰⵢ ⴰⵙⵏⵎⴰⵍⴰⵢ SMTP');
assert.doesNotMatch(locales.zgh['smtp-tls-description'], /[\u0600-\u06ff]/);
assert.deepEqual(locales.zgh['smtp-tls-description'].match(/TLS|SMTP/g), ['TLS', 'SMTP']);
assert.ok(locales.zgh['smtp-tls-description'].startsWith('ⵙⵙⵔⴼⵓ '));

assert.equal(locales.zgh['private-desc'], "ⵜⴰⴼⵍⵡⵉⵜ ⴰⴷ ⵜⴳⴰ ⵜⵓⵙⵍⵉⴳⵜ. ⵉⴳⵎⴰⵎⵏ ⵏ ⵜⴼⵍⵡⵉⵜ ⵖⴰⵙ ⴰⴷ ⵉⵣⵎⵔⵏ ⴰⴷ ⵜⵜ ⵥⵕⵏ ⴷ ⴰⴷ ⵜⵜ ⵙⵏⴼⵍⵏ.");
assert.doesNotMatch(locales.zgh['private-desc'], /[\u0600-\u06ff]/);
assert.match(locales.zgh['private-desc'], /ⵜⵓⵙⵍⵉⴳⵜ/);
assert.match(locales.zgh['private-desc'], /ⵉⴳⵎⴰⵎⵏ.*ⵖⴰⵙ/);
assert.match(locales.zgh['private-desc'], /ⵥⵕⵏ.*ⴷ.*ⵙⵏⴼⵍⵏ/);

const assetlinksLabels = {
  'custom-assetlinks-enabled': 'ⵙⵙⵔⴼⵓ assetlinks.json ⵉⵥⵍⵉⵏ',
  'custom-assetlinks-content': 'ⴰⴽⵜⵜⵓⵔ ⵏ assetlinks.json ⵉⵥⵍⵉⵏ (JSON)'
};
for (const [key, value] of Object.entries(assetlinksLabels)) {
  assert.equal(locales.zgh[key], value);
  assert.deepEqual(value.match(/assetlinks\.json/g), ['assetlinks.json']);
  assert.doesNotMatch(value, /Activer|Contenu|personnalisé/);
}
assert.ok(locales.zgh['custom-assetlinks-enabled'].startsWith('ⵙⵙⵔⴼⵓ '));
assert.ok(locales.zgh['custom-assetlinks-content'].startsWith('ⴰⴽⵜⵜⵓⵔ '));
assert.match(locales.zgh['custom-assetlinks-content'], /\(JSON\)$/);
assert.doesNotMatch(locales.zgh['custom-assetlinks-enabled'], /\(JSON\)/);

assert.equal(locales.zgh['enable-wip-limit'], 'ⵙⵙⵔⴼⵓ ⴰⵡⵜⵜⵓ WIP');
assert.deepEqual(locales.zgh['enable-wip-limit'].match(/WIP/g), ['WIP']);
assert.doesNotMatch(locales.zgh['enable-wip-limit'], /Activer|limite/);

assert.equal(locales.zgh['custom-product-name'], 'ⵉⵙⵎ ⵏ ⵓⵢⴰⴼⵓ ⵉⵥⵍⵉⵏ');
assert.match(locales.zgh['custom-product-name'], /ⵓⵢⴰⴼⵓ/);
assert.doesNotMatch(locales.zgh['custom-product-name'], /Nom|personnalisé/);

assert.equal(locales.zgh['show-parent-in-minicard'], 'ⵙⵙⴽⵏ ⴰⵎⴰⵔⴰⵡ ⴳ ⵜⴽⴰⵕⴹⴰ ⵜⴰⵎⵥⵢⴰⵏⵜ:');
assert.doesNotMatch(locales.zgh['show-parent-in-minicard'], /Voir|parente|mini-carte/);
assert.match(locales.zgh['show-parent-in-minicard'], /ⵜⴰⵎⵥⵢⴰⵏⵜ:$/);

assert.equal(locales.zgh['smtp-host-description'], 'ⴰⵏⵙⴰ ⵏ ⵓⵎⴰⴽⴽⴰⵢ ⴰⵙⵏⵎⴰⵍⴰⵢ SMTP ⵍⵍⵉ ⵉⵙⵙⵓⴳⵓⵔⵏ ⵜⵉⵎⵢⴰⵣⴰⵏⵉⵏ ⵜⵉⵍⵉⴽⵟⵕⵓⵏⵉⵜⵉⵏ ⵏⴽ.');
assert.deepEqual(locales.zgh['smtp-host-description'].match(/SMTP/g), ['SMTP']);
assert.match(locales.zgh['smtp-host-description'], /^ⴰⵏⵙⴰ ⵏ ⵓⵎⴰⴽⴽⴰⵢ/);
assert.match(locales.zgh['smtp-host-description'], /ⵜⵉⵎⵢⴰⵣⴰⵏⵉⵏ.*ⵏⴽ/);
assert.doesNotMatch(locales.zgh['smtp-host-description'], /L'adresse|serveur|mails|^ⴰⵏⵙⴰ ⴰⵍⵉⴽⵟⵕⵓⵏⵉ/);

assert.equal(locales.zgh['smtp-host'], 'ⴰⵎⴰⴽⴽⴰⵢ ⴰⵙⵏⵎⴰⵍⴰⵢ SMTP');
assert.deepEqual(locales.zgh['smtp-host'].match(/SMTP/g), ['SMTP']);
assert.doesNotMatch(locales.zgh['smtp-host'], /[\u0600-\u06ff]/);

assert.equal(locales.zgh['just-invited'], 'ⴰⵙⵉⴳⵔ ⴰⵎⴰⵢⵏⵓ ⵉⴽ ⵙ ⵜⴼⵍⵡⵉⵜ ⴰⴷ');
assert.doesNotMatch(locales.zgh['just-invited'], /Vous venez|invité/);
assert.notEqual(locales.zgh['just-invited'], locales.zgh['not-accepted-yet']);

assert.equal(locales.zgh['support-page-enabled'], 'ⵜⴰⵙⵏⴰ ⵏ ⵜⵡⵉⵙⵉ ⵜⵜⵢⴰⵙⵙⵔⴼⵓ');
assert.doesNotMatch(locales.zgh['support-page-enabled'], /Page|assistance|activée/);
assert.match(locales.zgh['support-page-enabled'], /ⵜⵡⵉⵙⵉ/);

assert.equal(locales.zgh['now-activities-of-all-boards-are-hidden'], 'ⵖⵉⵍⴰⴷ ⴼⴼⵔⵏⵜ ⵜⵉⴳⴰⵡⵉⵏ ⴰⴽⴽⵯ ⵏ ⵜⴼⵍⵡⵉⵏ ⴰⴽⴽⵯ');
assert.deepEqual(locales.zgh['now-activities-of-all-boards-are-hidden'].match(/ⴰⴽⴽⵯ/g), ['ⴰⴽⴽⵯ', 'ⴰⴽⴽⵯ']);
assert.doesNotMatch(locales.zgh['now-activities-of-all-boards-are-hidden'], /[\u0600-\u06ff]/);

assert.equal(locales.zgh.tableVisibilityMode, 'ⵜⴰⵏⵏⴰⵢⵜ ⵏ ⵜⴼⵍⵡⵉⵏ');
assert.ok(locales.zgh['tableVisibilityMode-allowPrivateOnly'].startsWith(locales.zgh.tableVisibilityMode + ': '));
assert.match(locales.zgh['tableVisibilityMode-allowPrivateOnly'], /ⵙⴱⴰⵔⵅ ⵖⴰⵙ.*ⵜⵓⵙⵍⵉⴳⵉⵏ/);
assert.doesNotMatch(locales.zgh['tableVisibilityMode-allowPrivateOnly'], /Visibilité|autoriser|privés/);

assert.equal(locales.zgh['show-cards-minimum-count'], 'ⵙⵙⴽⵏ ⴰⵎⴹⴰⵏ ⵏ ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ ⵉⵖ ⴳ ⵜⵍⴳⴰⵎⵜ ⵉⵍⵍⴰ ⵓⴳⴳⴰⵔ ⵏ');
assert.match(locales.zgh['show-cards-minimum-count'], /ⵉⵖ.*ⵓⴳⴳⴰⵔ ⵏ$/);
assert.doesNotMatch(locales.zgh['show-cards-minimum-count'], /[\u0600-\u06ff]/);

// Field totals must remain aggregates, not field counts or prose summaries.
assert.match(locales.zgh['showSum-field-on-list'], /ⵜⴰⵎⵓⵜⵜⵔⵜ.*ⵢⵉⴳⵔⴰⵏ.*ⵓⴼⵍⵍⴰ.*ⵜⵍⴳⴰⵎⵜ/);
assert.doesNotMatch(locales.zgh['showSum-field-on-list'], /Afficher|total des champs|ⴰⵎⴹⴰⵏ|ⴰⵙⴳⵣⵍ/);

// Rule destinations retain opposite positions and the following genitive.
assert.equal(locales.zgh['r-top-of'], 'ⴰⴼⵍⵍⴰ ⵏ');
assert.equal(locales.zgh['r-bottom-of'], 'ⴰⴱⵔⴰⵡ ⵏ');
assert.notEqual(locales.zgh['r-top-of'], locales.zgh['r-bottom-of']);
for (const key of ['r-top-of', 'r-bottom-of']) assert.doesNotMatch(locales.zgh[key], /En haut|En bas/);

// Numeric-field sum tooltip retains the display selection and location.
assert.match(locales.zgh['sum-of-number-fields'], /ⵜⴰⵎⵓⵜⵜⵔⵜ.*ⵢⵉⴳⵔⴰⵏ ⵉⵥⵍⵉⵏ.*ⵉⵎⴹⴰⵏⵏ.*ⵜⵜⵢⴰⵕⵛⵎⵏ.*ⵓⵙⴽⴰⵏ.*ⵓⴼⵍⵍⴰ.*ⵜⵍⴳⴰⵎⵜ/);
assert.doesNotMatch(locales.zgh['sum-of-number-fields'], /ⴰⵥⴰⵢⵏ|ⵓⵙⴰⴽⴰ|ⴰⵙⴳⵣⵍ/);

// The actor is rendered separately; %s names the created custom field.
assert.match(locales.zgh['activity-customfield-created'], /^ⵉⵙⵏⵓⵍⴼⴰ ⵉⴳⵔ ⵉⵥⵍⵉⵏ %s$/);
assert.doesNotMatch(locales.zgh['activity-customfield-created'], /[\u0600-\u06ff]/);
assert.equal((locales.zgh['activity-customfield-created'].match(/%s/g) || []).length, 1);

// Exceeded WIP is greater than the user-defined limit, not equal to it.
assert.match(locales.zgh['wipLimitErrorPopup-dialog-pt1'], /ⴰⵎⴹⴰⵏ.*ⵜⵎⵙⴽⵉⵔⵉⵏ.*ⵜⵍⴳⴰⵎⵜ ⴰⴷ.*ⵓⴳⴳⴰⵔ ⵏ ⵓⵡⵜⵜⵓ WIP.*ⵜⵙⵏⵎⵍⴷ/);
assert.doesNotMatch(locales.zgh['wipLimitErrorPopup-dialog-pt1'], /Le nombre|supérieur|définie/);

// WIP value setting is an imperative maximum, not the exceedance warning.
assert.match(locales.zgh['set-wip-limit-value'], /^ⵙⵏⵎⵍ ⴰⵡⵜⵜⵓ.*ⵡⵓⵣⵣⵓⵔ.*ⵓⵎⴹⴰⵏ.*ⵜⵎⵙⴽⵉⵔⵉⵏ.*ⵜⵍⴳⴰⵎⵜ ⴰⴷ$/);
assert.doesNotMatch(locales.zgh['set-wip-limit-value'], /Définit|maximale|ⵓⴳⴳⴰⵔ/);

// Primary entry 12346 supplies both singular and plural error forms.
assert.equal(locales.zgh.error, 'ⵜⴰⵣⴳⵍⵜ');
assert.equal(locales.zgh.errors, 'ⵜⵉⵣⴳⵍⵉⵏ');
assert.doesNotMatch(locales.zgh.errors, /ⵉⵣⴳⴰⵍⵏ/);

assert.equal(locales.zgh['cron-migration-errors'], 'ⵜⵉⵣⴳⵍⵉⵏ ⵏ ⵓⵙⵎⵓⵜⵜⵢ');
assert.equal(locales.zgh['cron-clear-errors'], 'ⵎⵃⵓ ⵜⵉⵣⴳⵍⵉⵏ ⴰⴽⴽⵯ');
for (const key of ['cron-migration-errors', 'cron-clear-errors']) assert.doesNotMatch(locales.zgh[key], /ⵉⵣⴳⴰⵍⵏ|ⵚⵚⴼⴹ/);

// Clearing confirmation retains all errors and the successful qualifier.
assert.match(locales.zgh['cron-errors-cleared'], /^ⵎⵃⴰⵏⵜ ⵜⵉⵣⴳⵍⵉⵏ ⴰⴽⴽⵯ ⵙ ⵓⵎⵓⵔⵙ\.$/);
assert.doesNotMatch(locales.zgh['cron-errors-cleared'], /ⵉⵣⴳⴰⵍⵏ|ⵜⵜⵓⵙⴼⴹⵏ/);

assert.equal(locales.zgh.optional, 'ⴰⵔⵓⵛⵛⵉⵍ');
assert.doesNotMatch(locales.zgh.optional, /[\u0600-\u06ff]/);

assert.equal(locales.zgh['webhook-token'], 'Token (ⴰⵔⵓⵛⵛⵉⵍ ⵉ ⵓⵙⵖⵣⵏ)');
assert.doesNotMatch(locales.zgh['webhook-token'], /Jeton|optionnel|authentification/);

for (const key of ['set-wip-limit-value', 'wipLimitErrorPopup-dialog-pt1']) {
 assert.match(locales.zgh[key], /ⵜⵎⵙⴽⵉⵔⵉⵏ/);
 assert.doesNotMatch(locales.zgh[key], /ⵜⵡⵓⵔⵉⵡⵉⵏ|ⵜⵎⵙⴽⴰⵔ/);
}

assert.equal(locales.zgh.task, 'ⵜⴰⵎⵙⴽⵉⵔⵜ');
assert.equal(locales.zgh.subtasks, locales.zgh['export-card-subtasks']);
for (const key of ['add-subtask', 'subtasks', 'export-card-subtasks', 'show-subtasks-field']) {
 assert.match(locales.zgh[key], /ⵎⵙⴽⵉⵔ.*ⴷⴷⴰⵡ ⵏ ⵜⵎⵙⴽⵉⵔⵜ/);
 assert.doesNotMatch(locales.zgh[key], /ⵜⵡⵓⵔⵉ|Tâche|ⵜⵎⵙⴽⴰⵔ/);
}
assert.match(locales.zgh['show-subtasks-field'], /^ⵙⴽⵏ ⵉⴳⵔ/);
assert.match(locales.zgh['add-subtask'], /^ⵔⵏⵓ/);

assert.equal(locales.zgh['default-subtasks-board'], locales.zgh.subtasks + ' ⵉ ⵜⴼⵍⵡⵉⵜ __board__');
assert.doesNotMatch(locales.zgh['default-subtasks-board'], /Sous-tâches|tableau/);
assert.equal(locales.zgh['deposit-subtasks-board'], 'ⵙⵙⵔⵙ ' + locales.zgh.subtasks + ' ⴳ ⵜⴼⵍⵡⵉⵜ ⴰⴷ:');

assert.match(locales.zgh['deposit-subtasks-list'], /^ⵜⴰⵍⴳⴰⵎⵜ ⵏ ⵡⴰⵡⴰⴹ.*ⵜⵎⵙⴽⵉⵔⵉⵏ.*ⴷⴷⴰⵡ.*ⵔⵙⴰⵏⵜ ⵖⵉ:$/);
assert.doesNotMatch(locales.zgh['deposit-subtasks-list'], /Liste|destination|déposées/);

assert.equal(locales.zgh['custom-field-currency'], 'ⴰⴷⵔⵉⵎ ⴰⵏⵣⵎⴰⵔ');
assert.doesNotMatch(locales.zgh['custom-field-currency'], /[\u0600-\u06ff]/);

assert.equal(locales.zgh['custom-field-currency-option'], 'ⵉⵏⵉⴳⵍ ⵏ ⵓⴷⵔⵉⵎ ⴰⵏⵣⵎⴰⵔ');
assert.doesNotMatch(locales.zgh['custom-field-currency-option'], /Code|devise/);

assert.equal(locales.zgh['color-black'], 'ⴰⴱⵔⴽⴰⵏ');
assert.doesNotMatch(locales.zgh['color-black'], /[A-Za-z\u0600-\u06ff]/);

assert.equal(locales.zgh['color-blue'], 'ⴰⵏⵉⵍⵉ');
assert.doesNotMatch(locales.zgh['color-blue'], /[A-Za-z\u0600-\u06ff]/);

assert.equal(locales.zgh['color-green'], 'ⴰⵣⴳⵣⴰ');
assert.doesNotMatch(locales.zgh['color-green'], /[A-Za-z\u0600-\u06ff]/);

assert.equal(locales.zgh['color-red'], 'ⴰⵣⴳⴳⵯⴰⵖ');
assert.doesNotMatch(locales.zgh['color-red'], /[A-Za-z\u0600-\u06ff]/);

assert.equal(locales.zgh['color-white'], 'ⴰⵎⵍⵍⴰⵍ');
assert.doesNotMatch(locales.zgh['color-white'], /[A-Za-z\u0600-\u06ff]/);

assert.equal(locales.zgh['color-yellow'], 'ⴰⵡⵔⴰⵖ');
assert.doesNotMatch(locales.zgh['color-yellow'], /[A-Za-z\u0600-\u06ff]/);

assert.notEqual(locales.zgh['color-blue'], locales.zgh['color-green']);

assert.equal(locales.zgh['poker-finish'], 'ⵙⵎⴷ');
assert.equal(locales.zgh['poker-replay'], 'ⴰⵍⵙ');
assert.doesNotMatch(locales.zgh['poker-finish'] + locales.zgh['poker-replay'], /Finir|Rejouer/);

assert.match(locales.zgh['swimlane-height-error-message'], /^ⵉⵅⵚⵚⴰ.*ⵉⵊⴳⵉⵍ.*ⵓⴱⵔⵉⴷ.*ⴰⵎⴹⴰⵏ ⵓⵎⵎⵉⴷ ⵓⵎⵏⵉⴳ$/);
assert.doesNotMatch(locales.zgh['swimlane-height-error-message'], /[\u0600-\u06ff]|ⵉⵙⵎⴷⵏ/);

assert.equal(locales.zgh['comprehensive-board-migration'], 'ⴰⵙⵎⵓⵜⵜⵢ ⵉⵙⵎⴷⵏ ⵏ ⵜⴼⵍⵡⵉⵜ');
assert.doesNotMatch(locales.zgh['comprehensive-board-migration'], /Migration|complète|ⴰⵎⴰⴹⵍⴰⵏ|ⴰⵎⴽⵜⵓⵔ/);

assert.equal(locales.zgh['step-convert-shared-lists'], 'ⵙⵙⵏⴼⵍ ⵜⵉⵍⴳⴰⵎⵉⵏ ⵍⵍⵉ ⵙⵙⵓⵔⵏⵜ');
assert.doesNotMatch(locales.zgh['step-convert-shared-lists'], /Convertir|partagées|ⵙⵍⵎ|ⴱⴹⵓ/);

assert.equal(locales.zgh.duration, 'ⴰⵣⵎⵣ');
assert.equal(locales.zgh['estimated-time-remaining'], 'ⴰⵙⵓⵜⴳ ⵏ ⵓⵣⵎⵣ ⵍⵍⵉ ⵇⵇⵉⵎⵏ');
assert.doesNotMatch(locales.zgh.duration + locales.zgh['estimated-time-remaining'], /Durée|Temps|restant|estimé/);

assert.equal(locales.zgh['admin-people-user-active'], 'ⴰⵏⵙⵙⵎⵔⵙ: ⵉⵥⵡⵕ – ⴽⵍⵉⴽⵉ ⴰⴼⴰⴷ ⴰⴷ ⵜ ⵜⵙⵙⵏⵙⴷ');
assert.doesNotMatch(locales.zgh['admin-people-user-active'], /utilisateur|Cliquer|ⴰⵎⵖⵍⴰⵍ/);

assert.equal(locales.zgh['admin-people-user-inactive'], 'ⴰⵏⵙⵙⵎⵔⵙ: ⵓⵔ ⵉⵥⵡⵉⵕ – ⴽⵍⵉⴽⵉ ⴰⴼⴰⴷ ⴰⴷ ⵜ ⵜⵙⵙⵔⴼⵓⴷ');
assert.doesNotMatch(locales.zgh['admin-people-user-inactive'], /utilisateur|Cliquer|ⴰⵎⵖⵍⴰⵍ/);

assert.doesNotMatch(locales.zgh['admin-people-user-active'], /ⵜⵙⵙⵔⴼⵓⴷ/);
assert.doesNotMatch(locales.zgh['admin-people-user-inactive'], /ⵜⵙⵙⵏⵙⴷ/);

assert.equal(locales.zgh['auto-list-width'], 'ⴰⴼⵍⵜⴰⵙ ⴰⵡⵓⵔⵎⴰⵏ ⵏ ⵜⵍⴳⴰⵎⵜ');
assert.doesNotMatch(locales.zgh['auto-list-width'], /[\u0600-\u06ff]/);

assert.equal(locales.zgh['click-to-disable-auto-width'], 'ⴰⴼⵍⵜⴰⵙ ⴰⵡⵓⵔⵎⴰⵏ ⵏ ⵜⵍⴳⴰⵎⵜ: ⵉⵥⵡⵕ – ⴽⵍⵉⴽⵉ ⴰⴼⴰⴷ ⴰⴷ ⵜ ⵜⵙⵙⵏⵙⴷ');
assert.doesNotMatch(locales.zgh['click-to-disable-auto-width'], /[\u0600-\u06ff]/);

assert.equal(locales.zgh['click-to-enable-auto-width'], 'ⴰⴼⵍⵜⴰⵙ ⴰⵡⵓⵔⵎⴰⵏ ⵏ ⵜⵍⴳⴰⵎⵜ: ⵓⵔ ⵉⵥⵡⵉⵕ – ⴽⵍⵉⴽⵉ ⴰⴼⴰⴷ ⴰⴷ ⵜ ⵜⵙⵙⵔⴼⵓⴷ');
assert.doesNotMatch(locales.zgh['click-to-enable-auto-width'], /[\u0600-\u06ff]/);

assert.doesNotMatch(locales.zgh['click-to-disable-auto-width'], /ⵜⵙⵙⵔⴼⵓⴷ/);
assert.doesNotMatch(locales.zgh['click-to-enable-auto-width'], /ⵜⵙⵙⵏⵙⴷ/);

assert.equal(locales.zgh.domain, 'ⵜⴰⵖⵓⵍⵜ');
assert.doesNotMatch(locales.zgh.domain, /ⵜⴰⵎⵏⴰⴹⵜ/);

assert.match(locales.zgh['operator-limit-invalid'], /^%s: ⴰⵡⵜⵜⵓ ⵓⵔ ⵉⵙⵖⵣⵏ\./);
assert.match(locales.zgh['operator-limit-invalid'], /ⵉⵅⵚⵚⴰ.*ⴰⵎⴹⴰⵏ ⵓⵎⵎⵉⴷ ⵓⵎⵏⵉⴳ/);
assert.doesNotMatch(locales.zgh['operator-limit-invalid'], /valide|entier|ⴰⵏⴽⵔⵓⴼ/);

assert.equal(locales.zgh['restore-lost-cards-migration'], 'ⵙⵙⵓⴽⵏ ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ ⵜⵉⵎⵏⵉⴷⵉⵏ');
assert.doesNotMatch(locales.zgh['restore-lost-cards-migration'], /Restaurer|perdues|ⴰⵇⵕⴹⴰⵛ|ⴰⵎⵏⵏⵓⵔⵉ/);

assert.equal(locales.zgh.autoAddUsersWithDomainName, 'ⵔⵏⵓ ⵙ ⵓⵡⵔⵎⴰⵏ ⵉⵏⵙⵙⵎⵔⴰⵙ ⵍⵍⵉ ⵖⵓⵔⵙⵏ ⵉⵙⵎ ⵏ ⵜⵖⵓⵍⵜ');
assert.doesNotMatch(locales.zgh.autoAddUsersWithDomainName, /[\u0600-\u06ff]|ⵜⴰⵎⵏⴰⴹⵜ/);

assert.equal(locales.zgh.accept, 'ⵇⴱⵍ');
assert.equal(locales.zgh['not-accepted-yet'], 'ⴰⵙⵉⴳⵔ ⵓⵔ ⵜⴰ ⵉⵜⵜⵓⵇⴱⵉⵍ');
assert.doesNotMatch(locales.zgh.accept + locales.zgh['not-accepted-yet'], /[\u0600-\u06ff]|acceptée|ⵙⵙⵉⴷⵏ|ⵙⵙⵍⵖⴷ/);

for (const style of ['Cube-Grid', 'Double-Bounce', 'Rotateplane', 'Scaleout']) {
  assert.equal(locales.zgh[style], `ⴰⵏⵎⵎⴰⵍ ⵏ ⵓⴳⴰⵏⵉ (${style})`);
  assert.doesNotMatch(locales.zgh[style], /Icône|attente|ⵓⵍⵓⵎ|ⵜⴰⴹⵓⵜ/);
}

for (const key of ['r-df-start-at', 'predicate-start']) assert.equal(locales.zgh[key], locales.zgh['card-start']);
for (const key of ['r-df-end-at', 'predicate-end']) assert.equal(locales.zgh[key], locales.zgh['card-end']);
assert.notEqual(locales.zgh['predicate-start'], locales.zgh['predicate-end']);

assert.equal(locales.zgh['export-card-field-dates'], 'ⵉⵙⴰⴽⵓⴷⵏ (ⴰⵙⵏⴼⵍⵓⵍ, ⵉⵎⵉⵥ, ⵜⵓⴷⴷⵎⴰ, ⴰⵙⴰⴽⵓⴷ ⴰⵎⴳⴳⴰⵔⵓ, ⵜⵉⴳⵉⵔⴰ)');
assert.equal(locales.zgh['operator-created'], 'ⴰⵙⵏⴼⵍⵓⵍ');
assert.equal(locales.zgh['predicate-created'], locales.zgh['operator-created']);
assert.doesNotMatch(locales.zgh['export-card-field-dates'], /Création|Réception|Début|Échéance|Fin/);

assert.equal(locales.zgh['card-received'], 'ⵉⵎⵉⵥ');
assert.equal(locales.zgh['r-df-received-at'], locales.zgh['card-received']);
assert.equal(locales.zgh['card-due'], locales.zgh['due-date']);
assert.notEqual(locales.zgh['card-due'], locales.zgh['card-received']);
assert.doesNotMatch(locales.zgh['card-due'] + locales.zgh['card-received'], /[\u0600-\u06ff]|Reçue/);

for (const key of ['act-a-receivedAt', 'a-receivedAt']) {
  assert.match(locales.zgh[key], /ⴰⴽⵓⴷ ⵏ ⵉⵎⵉⵥ ⵖⵔ/);
  assert.doesNotMatch(locales.zgh[key], /ⵜⵔⵎⵙⵜ/);
}
assert.match(locales.zgh['act-a-receivedAt'], /__timeValue__.*__timeOldValue__/);
