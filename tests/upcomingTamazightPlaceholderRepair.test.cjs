'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const translated = read('zgh');
const pattern = /__[^\s]+?__|%(?:\d+\$)?[A-Za-z]/g;
const inventory = value => (value.match(pattern) || []).sort();
for (const [key, source] of Object.entries(english)) {
  assert.deepStrictEqual(inventory(translated[key] || ''), inventory(source),
    `zgh:${key} changed a placeholder`);
}
const repairedKeys = ['act-addAttachment', 'act-removeChecklistItem',
  'act-setCustomField', 'globalSearch-instructions-operator-has'];
const repaired = repairedKeys.map(key => translated[key]).join('\n');
assert.match(repaired, /Takarḍa|takarḍa|tabdart|tafelwit|asenqed/);
assert.doesNotMatch(repaired, /[\u0600-\u06ff]|a édité|dans la|__(?:مرفق|بطاقة|قائمة|لوحة)__/u);
console.log('upcomingTamazightPlaceholderRepair: 2 tests passed');

assert.strictEqual(translated.or, 'ⵏⵖ');
const header = fs.readFileSync(path.join(ROOT, 'client/components/main/header.jade'), 'utf8');
assert.match(header, /sidebar-open.*{{_ 'or'}}.*sidebar-close/);
const toggleTitle = `${translated['sidebar-open']} ${translated.or} ${translated['sidebar-close']}`;
assert.match(toggleTitle, / ⵏⵖ /);
assert.doesNotMatch(toggleTitle, /\bou\b/);
console.log('Tamazight sidebar alternatives use the native conjunction');

const boardControls = {
  'add-swimlane': 'ⵔⵏⵓ ⴰⴱⵔⵉⴷ',
  'r-add-swimlane': 'ⵔⵏⵓ ⴰⴱⵔⵉⴷ',
  'listActionPopup-title': 'ⵜⵉⴳⴰⵡⵉⵏ ⵏ ⵜⵍⴳⴰⵎⵜ',
  'swimlaneActionPopup-title': 'ⵜⵉⴳⴰⵡⵉⵏ ⵏ ⵓⴱⵔⵉⴷ',
};
for (const [key, value] of Object.entries(boardControls)) {
  assert.strictEqual(translated[key], value);
  assert.doesNotMatch(translated[key], /Ajouter|Actions|couloir|[\u0600-\u06ff]/u);
}
assert.notStrictEqual(translated['listActionPopup-title'], translated['swimlaneActionPopup-title']);
console.log('Tamazight board controls preserve distinct add/action and list/lane meanings');

for (const key of ['default', 'defaultdefault', 'font-size-default']) {
  assert.strictEqual(translated[key], 'ⵙ ⵓⵡⵏⵓⵍ');
  assert.doesNotMatch(translated[key], /Défaut|Default|ⴰⵎⵣⵡⴰⵔⵓ/u);
}
console.log('Tamazight Default values replace French without changing to First');

assert.strictEqual(translated['export-card-excel-fields'], 'ⵙⵜⵉ ⵉⴳⵔⴰⵏ ⵍⵍⵉ ⵔⴰ ⵜⵙⵙⵓⴼⵖⴷ ⵖⵔ Excel:');
assert.doesNotMatch(translated['export-card-excel-fields'], /Sélectionnez|champs|inclure|export Excel/);
console.log('Tamazight Excel prompt retains choosing fields, export destination and colon');

assert.strictEqual(translated['operator-debug-invalid'], '%s: ⴰⵣⴰⵍ ⵏ debug ⵓⵔ ⵉⵣⵔⵉ');
assert.deepStrictEqual(inventory(translated['operator-debug-invalid']), ['%s']);
assert.doesNotMatch(translated['operator-debug-invalid'], /prédicat|valide|ⵉⵎⵏⵏⵉ/);
assert.notStrictEqual(translated['operator-debug-invalid'], translated['operator-has-invalid']);
const querySource = fs.readFileSync(path.join(ROOT, 'config/query-classes.js'), 'utf8');
assert.match(querySource, /operator === OPERATOR_DEBUG[\s\S]*?predicateTranslations\[OPERATOR_DEBUG\]\[value\][\s\S]*?operator-debug-invalid/);
console.log('Tamazight debug error preserves catalogue-value meaning and positional token');

assert.strictEqual(translated.OS_Freemem, 'OS: ⵜⴰⴽⴰⵜⵓⵜ ⵜⴰⵎⵛⵉⵅⵜ');
assert.notStrictEqual(translated.OS_Freemem, translated.OS_Totalmem);
assert.doesNotMatch(translated.OS_Freemem, /[\u0600-\u06ff]|ⵎⴰⵕⵕⴰ/u);
const statisticsSource = fs.readFileSync(path.join(ROOT, 'server/statistics.js'), 'utf8');
assert.match(statisticsSource, /freemem: os\.freemem\(\)/);
console.log('Tamazight free memory remains distinct from total system memory');

assert.strictEqual(translated.OS_Release, 'OS: ⵜⵓⵏⵖⵉⵍⵜ');
assert.strictEqual(translated.OS_Type, 'OS: ⴰⵏⴰⵡ');
assert.strictEqual(translated.type, 'ⴰⵏⴰⵡ');
for (const key of ['OS_Release', 'OS_Type', 'type']) assert.doesNotMatch(translated[key], /[\u0600-\u06ff]/u);
assert.notStrictEqual(translated.OS_Release, translated.OS_Type);
assert.match(statisticsSource, /release: os\.release\(\)/);
assert.match(statisticsSource, /type: os\.type\(\)/);
console.log('Tamazight OS release and type remain separate metrics');

assert.strictEqual(translated.OS_Arch, 'OS: ⵜⴰⵎⵙⴷⴰⴳⵜ');
assert.doesNotMatch(translated.OS_Arch, /[\u0600-\u06ff]/u);
assert.notStrictEqual(translated.OS_Arch, translated.OS_Type);
assert.notStrictEqual(translated.OS_Arch, translated.OS_Platform);
assert.match(statisticsSource, /arch: os\.arch\(\)/);
const informationTemplate = fs.readFileSync(path.join(ROOT,
  'client/components/settings/informationBody.jade'), 'utf8');
assert.match(informationTemplate, /OS_Arch[^\n]*\n\s+td {{statistics\.os\.arch}}/);
console.log('Tamazight architecture remains distinct from OS type and platform');

const troubleshooting = translated['server-error-troubleshooting'];
const commands = value => [...value.matchAll(/`([^`]+)`/g)].map(match => match[1]);
assert.deepStrictEqual(commands(troubleshooting), commands(english['server-error-troubleshooting']));
assert.strictEqual(troubleshooting.split('\n').length, 3);
assert.match(troubleshooting.split('\n')[0], /ⴰⵣⵏ.*ⴰⵣⴳⴰⵍ.*ⵓⵎⴰⴽⴽⴰⵢ ⴰⵙⵏⵎⴰⵍⴰⵢ/);
assert.match(troubleshooting.split('\n')[1], /ⵓⵙⵔⵓⵙ.*snap.*`sudo snap logs wekan\.wekan`/);
assert.match(troubleshooting.split('\n')[2], /ⵓⵙⵔⵓⵙ.*Docker.*`sudo docker logs wekan-app`/);
assert.doesNotMatch(troubleshooting, /Merci|soumettre|erreur|serveur|installation|lancer|[\u0600-\u06ff]/u);
const searchTemplate = fs.readFileSync(path.join(ROOT,
  'client/components/main/globalSearch.jade'), 'utf8');
assert.match(searchTemplate, /{{_ 'server-error-troubleshooting' }}/);
console.log('Tamazight troubleshooting preserves exact commands and distinct installation instructions');

assert.strictEqual(translated['listArchivePopup-title'], `${translated['archive-list']}?`);
assert.strictEqual(translated['restore-board'], `${translated.restore} ⵜⴰⴼⵍⵡⵉⵜ`);
assert.doesNotMatch(translated['listArchivePopup-title'], /Archiver|liste/);
assert.doesNotMatch(translated['restore-board'], /[\u0600-\u06ff]/u);
assert.notStrictEqual(translated['restore-board'], translated['archive-board']);
const archiveSource = fs.readFileSync(path.join(ROOT,
  'client/components/boards/boardArchive.js'), 'utf8');
assert.match(archiveSource, /click \.js-restore-board[\s\S]*?await board\.restore\(\)/);
console.log('Tamazight archive question and board restoration remain distinct actions');

const lockedMessage = translated['account-locked'];
assert.match(lockedMessage, /ⵓⵎⵉⴹⴰⵏ.*ⵢⴰⵜ ⵜⵉⵣⵉ.*ⵓⴽⵛⵛⵓⵎ.*ⵜⵓⴳⵜⵜ ⵏ ⵜⵉⴽⴽⴰⵍ/);
assert.match(lockedMessage, /ⴰⵔⵎ ⴷⴰⵖ ⴷⴼⴼⵉⵔ\.$/);
assert.doesNotMatch(lockedMessage, /compte|verrouillé|connexion|échouées|[\u0600-\u06ff]/u);
assert.notStrictEqual(lockedMessage, translated['accounts-lockout-user-locked']);
console.log('Tamazight temporary lockout retains reason, time limit and retry instruction');

const lockedUsersInfo = translated['accounts-lockout-locked-users-info'];
assert.match(lockedUsersInfo, /^ⵉⵏⵙⵙⵎⵔⵙⵏ ⵜⵜⵓⴳⴷⵍⵏⵉⵏ ⵖⵉⵍⴰ/);
assert.match(lockedUsersInfo, /ⵎⵉⵏⵣⵉ.*ⵓⵔ ⵢⴰⵍⵍⴼⵓⵙ ⵓⴽⵛⵛⵓⵎ.*ⵜⵓⴳⵜⵜ ⵏ ⵜⵉⴽⴽⴰⵍ$/);
assert.doesNotMatch(lockedUsersInfo, /Utilisateurs|verrouillés|tentatives|connexion|[\u0600-\u06ff]/u);
assert.notStrictEqual(lockedUsersInfo, translated['accounts-lockout-no-locked-users']);
assert.notStrictEqual(lockedUsersInfo, translated['account-locked']);
console.log('Tamazight locked-users description retains plural subject, current state and login-failure reason');

assert.strictEqual(translated['accounts-lockout-remaining-time'], 'ⴰⴽⵓⴷ ⵍⵍⵉ ⵉⵇⵇⵉⵎⵏ');
assert.doesNotMatch(translated['accounts-lockout-remaining-time'], /Temps|restant|[\u0600-\u06ff]/u);
for (const key of ['accounts-lockout-period', 'accounts-lockout-failure-window']) {
  assert.notStrictEqual(translated['accounts-lockout-remaining-time'], translated[key]);
}
console.log('Tamazight remaining time stays distinct from lockout period and failure window');

assert.strictEqual(english['close-board-pop'], 'You can restore the board from “Archive” on the All Boards page.');
for (const file of fs.readdirSync(path.join(ROOT, 'imports/i18n/data'))) {
  if (/^en-.*\.i18n\.json$/.test(file)) {
    assert.strictEqual(read(file.replace('.i18n.json', ''))['close-board-pop'], english['close-board-pop']);
  }
}
const archiveGuidance = translated['close-board-pop'];
assert.match(archiveGuidance, /ⵜⵙⵙⵓⴽⵏⴷ ⵜⴰⴼⵍⵡⵉⵜ/);
assert.ok(archiveGuidance.includes(`«${translated.archives}»`));
assert.ok(archiveGuidance.includes(`«${translated['all-boards']}»`));
assert.doesNotMatch(archiveGuidance, /Vous|tableau|bouton|entête|ⵜⴰⵢⵢⴰⵡⵜ|[\u0600-\u06ff]/u);
const boardListSource = fs.readFileSync(path.join(ROOT, 'client/components/boards/boardsList.js'), 'utf8');
assert.match(boardListSource, /archive: { icon: 'fa-archive', labelKey: 'archives'/);
console.log('Archive guidance names the current All Boards archive location in English and Tamazight');

const migrationDescription = JSON.parse(fs.readFileSync(path.join(ROOT, 'imports/i18n/data/zgh.i18n.json'), 'utf8'))['comprehensive-board-migration-description'];
assert.doesNotMatch(migrationDescription, /Effectue|vérifications|tableau|[\u0600-\u06ff]/);
for (const term of ['ⵉⵙⵙⵉⴷⴻⴷ','ⵉⵙⵙⵓⴽⵏ','ⵜⴰⵢⴰⵏⵜ ⵏ ⵜⵎⵓⵛⴰ','ⵜⵉⵍⴳⴰⵎⵉⵏ','ⵜⵉⵎⵔⵙⵉ','ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ','ⵜⵓⵚⴽⵉⵡⵜ','ⵉⴱⵔⴷⴰⵏ']) assert.ok(migrationDescription.includes(term), term);

assert.ok(migrationDescription.includes("ⴰⵏⵎⴰⵍⴰ ⵏ ⵜⵉⵍⴳⴰⵎⵉⵏ"));
assert.doesNotMatch(migrationDescription, /ⴰⵙⴰⵙⵜⵡⴰ/);

const osUptimeLabel = translated.OS_Uptime;
assert.doesNotMatch(osUptimeLabel, /[\u0600-\u06ff]|ⵓⵙⴽⴽⵉ/);
assert.match(osUptimeLabel, /ⴰⴽⵓⴷ.*ⵙⴳ ⵓⵙⵏⵜⵉ ⵏ ⵜⵉⵙⵏⵙⵉ/);
const uptimeStatisticsSource = fs.readFileSync(path.join(ROOT, 'server/statistics.js'), 'utf8');
assert.match(uptimeStatisticsSource, /uptime: os\.uptime\(\)/);
const uptimeInfoTemplate = fs.readFileSync(path.join(ROOT, 'client/components/settings/informationBody.jade'), 'utf8');
assert.match(uptimeInfoTemplate, /th {{_ 'OS_Uptime'}}\n\s+td {{humanReadableTime statistics\.os\.uptime}}/);

const dueReminderEndings = { 'act-almostdue': 'ⴰⵔ ⵉⵜⵜⴰⴷⵙ', 'act-duenow': 'ⵉⴳⴰ ⵖⵉⵍⴰ', 'act-pastdue': 'ⵉⵣⵔⵉ' };
for (const [key, ending] of Object.entries(dueReminderEndings)) {
 const value = translated[key];
 assert.ok(value.startsWith('ⵉⵙⵙⴽⵯⵜⵉ'));
 assert.ok(value.endsWith(ending));
 assert.doesNotMatch(value, /rappelle|échéance|approche|passée/);
 assert.deepStrictEqual(value.match(/__[A-Za-z]+__/g).sort(), ['__card__','__timeValue__']);
}
assert.strictEqual(new Set(Object.keys(dueReminderEndings).map(k => translated[k])).size, 3);

assert.match(translated['muted-info'], /^ⵓⵔ ⵙⴰⵔ/);
assert.match(translated['muted-info'], /ⵜⴼⵍⵡⵉⵜ ⴰⴷ/);
assert.match(translated['tracking-info'], /ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ.*ⴰⵎⵙⵏⴼⵍⵓⵍ ⵏⵖ ⴰⴳⵎⴰⵎ/);
for (const key of ['muted-info','tracking-info']) assert.doesNotMatch(translated[key], /Vous|notifié|modification|[\u0600-\u06ff]/);
assert.notStrictEqual(translated['muted-info'], translated['watching-info']);
assert.notStrictEqual(translated['tracking-info'], translated['watching-info']);
const watchMenuSource = fs.readFileSync(path.join(ROOT, 'client/components/boards/boardHeader.jade'), 'utf8');
for (const key of ['muted-info','tracking-info']) assert.ok(watchMenuSource.includes("{{_ '" + key + "'}}"));

assert.equal(translated['notify-participate'], translated['tracking-info']);
assert.match(translated['notify-participate'], /ⴰⵎⵙⵏⴼⵍⵓⵍ ⵏⵖ ⴰⴳⵎⴰⵎ/);
assert.match(translated['notify-watch'], /ⵜⴼⵍⵡⵉⵏ, ⵜⵉⵍⴳⴰⵎⵉⵏ ⵏⵖ ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ/);
assert.match(translated['notify-watch'], /ⵜⵎⵎⵓⵜⵔⴷ/);
assert.doesNotMatch(translated['notify-watch'], /ⴰⵎⵙⵏⴼⵍⵓⵍ|ⴰⴳⵎⴰⵎ|Recevoir/);
assert.notEqual(translated['notify-watch'], translated['notify-participate']);

const wipGuidance = translated['wipLimitErrorPopup-dialog-pt2'];
assert.match(wipGuidance, /ⵙⵎⵓⵜⵜⵉ.*ⵙⴳ ⵜⵍⴳⴰⵎⵜ ⴰⴷ ⵏⵖ ⵙⵙⵉⵎⵖⵓⵔ ⴰⵡⵜⵜⵓ WIP/);
assert.doesNotMatch(wipGuidance, /ⴽⴽⵙ|Veuillez|enlever/);
assert.match(fs.readFileSync(path.join(ROOT, 'client/components/lists/listHeader.jade'), 'utf8'),
  /template\(name="wipLimitErrorPopup"\)[\s\S]*?wipLimitErrorPopup-dialog-pt2/);

assert.equal(translated.description, 'ⴰⴳⵍⴰⵎ');
assert.notEqual(translated.description, translated.summary);
assert.match(translated['copyManyCardsPopup-instructions'], /ⵉⵣⵡⵍⵏ ⴷ ⵉⴳⵍⴰⵎⵏ.*ⵔⴰⴷ ⵜⵙⵏⵓⵍⴼⵓⴷ.*JSON/);
for (const example of JSON.parse(translated['copyManyCardsPopup-format'])) {
  assert.deepEqual(Object.keys(example), ['title', 'description']);
  assert.match(example.description, /^ⴰⴳⵍⴰⵎ/);
  assert.doesNotMatch(example.description, /ⴰⵙⴳⵣⵍ/);
}

assert.equal(translated['description-on-minicard'], 'ⴰⴳⵍⴰⵎ ⵖⴼ ⵜⴽⴰⵕⴹⴰ ⵜⴰⵎⵥⵢⴰⵏⵜ');
assert.equal(translated['addmore-detail'], 'ⵔⵏⵓ ⴰⴳⵍⴰⵎ ⵙ ⵓⴳⴳⴰⵔ ⵏ ⵉⴼⵔⵓⵔⵉⵜⵏ');
assert.equal(translated.summary, 'ⴰⵙⴳⵣⵍ');
for (const key of ['description', 'description-on-minicard', 'addmore-detail', 'copyManyCardsPopup-instructions', 'copyManyCardsPopup-format']) {
  assert.doesNotMatch(translated[key], /ⴰⵙⴳⵣⵍ/, `${key}: description is distinct from summary`);
}

assert.match(translated['fix-missing-lists-migration-description'],
  /^ⵉⵚⵓⵕ ⴷ ⵉⵙⵙⵓⴽⵏ.*ⵓⵔ ⵍⵍⵉⵏⵜ ⵏⵖ.*ⵜⵓⵚⴽⵉⵡⵜ ⵏ ⵜⴼⵍⵡⵉⵜ/);
assert.doesNotMatch(translated['fix-missing-lists-migration-description'], /Détecte|répare|corrompues/);

const missingListConfirmation = translated['run-fix-missing-lists-migration-confirm'];
assert.equal(missingListConfirmation, `ⵔⴰⴷ ${translated['fix-missing-lists-migration-description']} ⵉⵙ ⵜⵅⵙⴷ ⴰⴷ ⵜⴹⴼⵔⴷ?`);
assert.doesNotMatch(missingListConfirmation, /Cette|opération|Continuer/);
assert.notEqual(missingListConfirmation, translated['fix-missing-lists-migration-description']);

const duplicateListConfirmation = translated['delete-duplicate-lists-confirm'];
assert.match(duplicateListConfirmation, /^ⵉⵙ ⵏⵉⵜ.*\? ⵔⴰⴷ ⵜⵜⵓⴽⴽⵙⵏⵜ/);
assert.match(duplicateListConfirmation, /ⵜⵉⵍⴳⴰⵎⵉⵏ ⴰⴽⴽ ⵉⵜⵜⵓⵢⴰⵍⵙⵏ.*ⵢⴰⵏ ⵢⵉⵙⵎ ⴷ ⵓⵔ.*ⵜⴽⴰⵕⴹⴰ/);
assert.doesNotMatch(duplicateListConfirmation, /Êtes|supprimera|aucune carte/);

const emptyDuplicateDescription = translated['delete-duplicate-empty-lists-migration-description'];
assert.match(emptyDuplicateDescription, /^ⵉⴽⴽⵙ ⵙ ⵜⵏⴼⵔⵓⵜ/);
assert.match(emptyDuplicateDescription, /ⵉⴽⴽⵙ ⵖⴰⵙ.*ⵓⵔ.*ⵜⴰⴽⴰⵕⴹⴰ ⴷ ⵜⵍⵍⴰ ⵜⴰⵍⴳⴰⵎⵜ ⵢⴰⴹⵏ.*ⵢⴰⵏ ⵢⵉⵣⵡⵍ.*ⵍⵍⴰⵏⵜ ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ/);
assert.doesNotMatch(emptyDuplicateDescription, /Supprime|uniquement|ⵏⵖ/);
assert.notEqual(emptyDuplicateDescription, translated['delete-duplicate-lists-confirm']);

const emptyDuplicateConfirmation = translated['run-delete-duplicate-empty-lists-migration-confirm'];
assert.match(emptyDuplicateConfirmation, /^1\. ⵔⴰⴷ ⵉⵙⵏⴼⵍ.*ⵖⵔ ⵜⵉⵍⴳⴰⵎⵉⵏ ⵏ ⴽⵓ ⴰⴱⵔⵉⴷ\. 2\. ⵔⴰⴷ ⵉⴽⴽⵙ ⵖⴰⵙ/);
assert.match(emptyDuplicateConfirmation, /ⵓⵔ.*ⵜⴰⴽⴰⵕⴹⴰ ⴷ ⵜⵍⵍⴰ ⵜⴰⵍⴳⴰⵎⵜ ⵢⴰⴹⵏ.*ⵢⴰⵏ ⵢⵉⵣⵡⵍ.*ⵍⵍⴰⵏⵜ ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ/);
assert.match(emptyDuplicateConfirmation, /ⵉⵙ ⵜⵅⵙⴷ ⴰⴷ ⵜⴹⴼⵔⴷ\?$/);
assert.doesNotMatch(emptyDuplicateConfirmation, /Cette|partagées|Continuer/);

// An unsaved description warning must retain possession and negative save status.
assert.equal(translated['unsaved-description'], 'ⵖⵓⵔⴽ ⴰⴳⵍⴰⵎ ⵓⵔⵜⴰ ⵉⵜⵜⵡⴰⵃⴹⴰ');
assert.doesNotMatch(translated['unsaved-description'], /[\u0600-\u06ff]/);
assert.notEqual(translated['unsaved-description'], translated.description);
assert.match(fs.readFileSync(path.join(ROOT, 'client/components/cards/cardDetails.jade'), 'utf8'), /{{_ 'unsaved-description'}}/);

const recoveryPrompt = translated['rescue-card-description-dialogue'];
assert.match(recoveryPrompt, /^ⵉⵙ ⵜⵅⵙⴷ ⴰⴷ ⵜⵙⵏⴼⵍⴷ ⴰⴳⵍⴰⵎ ⴰⵎⵉⵔⴰⵏ.*ⵙ ⵉⵙⵏⴼⵍⵏ ⵏⵏⴽ\?$/);
assert.doesNotMatch(recoveryPrompt, /Réécrire|courante|changements/);
assert.notEqual(recoveryPrompt, translated['unsaved-description']);
assert.match(fs.readFileSync(path.join(ROOT, 'client/components/cards/cardDetails.js'), 'utf8'), /confirm\(TAPi18n\.__\('rescue-card-description-dialogue'\)\)[\s\S]*?currentCard\.setDescription\(currentDescription\.value\)/);

assert.match(translated['migrations-description'], /^ⵙⵙⵉⴷⴻⴷ ⴷ ⵙⵙⵓⴽⵏ ⵜⴰⵢⴰⵏⵜ ⵏ ⵜⵎⵓⵛⴰ ⵏ ⵜⴼⵍⵡⵉⵜ ⴰⴷ\./);
assert.match(translated['migrations-description'], /ⴽⵓ ⴰⵙⵎⵓⵜⵜⵢ ⵉⵣⵎⵔ ⴰⴷ ⵉⵜⵜⵓⵙⴽⵔ ⵙ ⵉⵎⴰⵏ ⵏⵏⵙ\.$/);
assert.doesNotMatch(translated['migrations-description'], /Exécute|vérifications|individuellement/);
assert.notEqual(translated['migrations-description'], translated['comprehensive-board-migration-description']);

assert.equal(translated['r-items-check'], 'ⴰⴼⵔⴷⵉⵙ ⵏ ⵜⵍⴳⴰⵎⵜ ⵏ ⵜⵎⵏⵥⵉⵜ');
assert.match(translated['r-checklist-note'], /^ⵜⴰⵎⴰⵡⵜ: ⴰⵔⵓ ⵉⴼⵔⴷⵉⵙⵏ.*ⵙ ⵜⵉⵙⴽⵔⵉⵏ ⴳⵔⴰⵙⵏ\.$/);
assert.doesNotMatch(translated['r-checklist-note'] + translated['r-items-check'], /Note|virgules|Élément/);
assert.match(fs.readFileSync(path.join(ROOT, 'client/components/rules/actions/checklistActions.jade'), 'utf8'), /{{_'r-checklist-note'}}/);

assert.equal(translated['r-card'], 'ⵜⴰⴽⴰⵕⴹⴰ');
assert.equal(translated['r-item'], 'ⴰⴼⵔⴷⵉⵙ');
assert.equal(translated['r-d-add-label'], translated['r-add'] + ' ' + translated['r-label']);
assert.notEqual(translated['r-d-add-label'], translated['r-d-remove-label']);
assert.doesNotMatch(translated['r-card'] + translated['r-item'] + translated['r-d-add-label'], /carte|élément|Ajouter/);

assert.equal(translated["r-its-list"], "ⵜⴰⵍⴳⴰⵎⵜ ⵏⵏⵙ");
assert.equal(translated["r-in-list"], "ⴳ ⵜⵍⴳⴰⵎⵜ");
assert.equal(translated["r-in-swimlane"], "ⴳ ⵓⴱⵔⵉⴷ");
assert.equal(translated["r-d-add-member"], "ⵔⵏⵓ ⴰⴳⵎⴰⵎ");
assert.equal(translated["r-d-remove-member"], "ⴽⴽⵙ ⴰⴳⵎⴰⵎ");
assert.equal(translated["r-d-check-of-list"], "ⵏ ⵜⵍⴳⴰⵎⵜ ⵏ ⵜⵎⵏⵥⵉⵜ");
assert.equal(translated["r-with-items"], "ⵙ ⵉⴼⵔⴷⵉⵙⵏ");
assert.equal(translated["r-swimlane-name"], "ⵉⵙⵎ ⵏ ⵓⴱⵔⵉⴷ");
assert.notEqual(translated['r-in-list'], translated['r-in-swimlane']);
assert.notEqual(translated['r-d-add-member'], translated['r-d-remove-member']);
assert.doesNotMatch([translated["r-its-list"],translated["r-in-list"],translated["r-in-swimlane"],translated["r-d-add-member"],translated["r-d-remove-member"],translated["r-d-check-of-list"],translated["r-with-items"],translated["r-swimlane-name"]].join(' '), /liste|couloir|Ajouter|Supprimer|checklist|avec/);

assert.match(translated['rescue-card-description'], /^ⵙⵙⴽⵏ ⴰⵎⵙⴰⵡⴰⵍ ⵏ ⵓⵙⵙⵓⴽⵏ ⴷⴰⵜ ⴰⴷ ⵜⵔⴳⵍⴷ/);
assert.match(translated['rescue-card-description'], /ⴰⴳⵍⴰⵎ ⵏ ⵜⴽⴰⵕⴹⴰ ⵓⵔⵜⴰ ⵉⵜⵜⵡⴰⵃⴹⴰ$/);
assert.doesNotMatch(translated['rescue-card-description'], /Afficher|dialogue|fermer/);
assert.match(fs.readFileSync(path.join(ROOT, 'client/components/users/userHeader.jade'), 'utf8'), /span {{_ 'rescue-card-description'}}/);

assert.match(translated['restore-lost-cards-nothing-to-restore'], /^ⵓⵔ ⵍⵍⵉⵏ ⵉⴱⵔⴷⴰⵏ ⵏⵖ ⵜⵉⵍⴳⴰⵎⵉⵏ ⵏⵖ ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ/);
assert.match(translated['restore-lost-cards-nothing-to-restore'], /ⵉⵎⴰⴽⵓⵍⵏ ⵉ ⵓⵙⵙⵓⴽⵏ\.$/);
assert.doesNotMatch(translated['restore-lost-cards-nothing-to-restore'], /Aucun|perdu|restaurer/);

for (const key of ['vote-delete-pop', 'card-delete-notice']) {
  assert.match(translated[key], /^ⵓⵔ ⵜⵣⵎⵔⴷ ⴰⴷ ⵜⵔⴰⵔⴷ ⴷ ⴰⵢⴰ\./);
  assert.match(translated[key], /ⵔⴰⴷ ⵜⵜⵓⴽⴽⵙⵏⵜ ⵜⵉⴳⴰⵡⵉⵏ ⴰⴽⴽⵯ/);
  assert.doesNotMatch(translated[key], /suppression|définitive|[\u0600-\u06ff]/);
}
assert.match(translated['vote-delete-pop'], /ⵏ ⵡⴰⵙⵜⴰⵢ ⴰⴷ\.$/);
assert.match(translated['card-delete-notice'], /ⵏ ⵜⴽⴰⵕⴹⴰ ⴰⴷ\.$/);
assert.notEqual(translated['vote-delete-pop'], translated['card-delete-notice']);

for (const key of ['card-delete-pop', 'swimlane-delete-pop']) {
  assert.match(translated[key], /^ⵔⴰⴷ ⵜⵜⵓⴽⴽⵙⵏⵜ ⵜⵉⴳⴰⵡⵉⵏ ⴰⴽⴽⵯ ⵙⴳ ⵜⵍⴳⴰⵎⵜ ⵏ ⵜⵉⴳⴰⵡⵉⵏ/);
  assert.match(translated[key], /ⵓⵔ ⵜⵣⵎⵔⴷ ⴰⴷ ⵜⵔⴰⵔⴷ ⴷ ⴰⵢⴰ\.$/);
  assert.doesNotMatch(translated[key], /Toutes|irréversible|[\u0600-\u06ff]/);
}
assert.match(translated['card-delete-pop'], /ⵜⵔⵥⵎⴷ ⵜⴰⴽⴰⵕⴹⴰ ⴷⴰⵖ/);
assert.match(translated['swimlane-delete-pop'], /ⵜⵙⵙⵓⴽⵏⴷ ⴰⴱⵔⵉⴷ/);

assert.equal(translated['r-update'], 'ⴰⵙⴷⵖⵉ');
assert.doesNotMatch(translated['r-update'], /تحديث|Update/);

assert.equal(translated["r-check"], "ⵕⵛⵎ");
assert.equal(translated["r-uncheck"], "ⴽⴽⵙ ⵜⴰⵎⴰⵜⴰⵔⵜ");
assert.equal(translated["r-check-all"], "ⵕⵛⵎ ⴰⴽⴽⵯ");
assert.equal(translated["r-uncheck-all"], "ⴽⴽⵙ ⵜⵉⵎⵉⵜⴰⵔ ⴰⴽⴽⵯ");
assert.equal(translated["r-d-check-one"], "ⵕⵛⵎ ⴰⴼⵔⴷⵉⵙ");
assert.equal(translated["r-d-uncheck-one"], "ⴽⴽⵙ ⵜⴰⵎⴰⵜⴰⵔⵜ ⵙⴳ ⵓⴼⵔⴷⵉⵙ");
assert.equal(translated["r-d-check-all"], "ⵕⵛⵎ ⵉⴼⵔⴷⵉⵙⵏ ⴰⴽⴽⵯ ⵏ ⵜⵍⴳⴰⵎⵜ");
assert.equal(translated["r-d-uncheck-all"], "ⴽⴽⵙ ⵜⵉⵎⵉⵜⴰⵔ ⵙⴳ ⵉⴼⵔⴷⵉⵙⵏ ⴰⴽⴽⵯ ⵏ ⵜⵍⴳⴰⵎⵜ");
assert.notEqual(translated['r-check'], translated['r-uncheck']);
assert.notEqual(translated['r-check'], translated['r-check-all']);

assert.match(translated['quick-access-description'], /^ⵔⵏⵓ ⵉⵜⵔⵉ ⵉ ⵜⴰⴼⵍⵡⵉⵜ/);
assert.match(translated['quick-access-description'], /ⴰⴼⴰⴷ ⴰⴷ ⵜⵔⵏⵓⴷ ⴰⵙⴰⵏⴼ ⴷⴰ\.$/);
assert.doesNotMatch(translated['quick-access-description'], /[\u0600-\u06ff]/);
assert.match(fs.readFileSync(path.join(ROOT, 'client/components/main/header.jade'), 'utf8'), /li.no-items-message {{_ 'quick-access-description'}}/);

assert.equal(translated['multi-selection'], 'ⴰⵙⵜⴰⵢ ⴰⴳⴳⵓⵜ');
assert.match(translated['toggle-labels'], /^ⵔⵏⵓ ⵏⵖ ⴽⴽⵙ ⵉⵔⵛⵓⵎⵏ 1-9 ⵏ ⵜⴽⴰⵕⴹⴰ/);
assert.match(translated['toggle-labels'], /ⴰⵙⵜⴰⵢ ⴰⴳⴳⵓⵜ ⴰⵔ ⵉⵔⵏⵓ ⵉⵔⵛⵓⵎⵏ 1-9/);
assert.equal((translated['toggle-labels'].match(/1-9/g) || []).length, 2);
assert.doesNotMatch(translated['toggle-labels'] + translated['multi-selection'], /Bascule|étiquettes|[\u0600-\u06ff]/);

assert.match(translated['toggle-assignees'], /^ⵔⵏⵓ ⵏⵖ ⴽⴽⵙ/);
assert.ok(translated['toggle-assignees'].includes(translated.assignees));
assert.match(translated['toggle-assignees'], /1-9 ⵉ ⵜⴽⴰⵕⴹⴰ/);
assert.match(translated['toggle-assignees'], /ⵓⵏⵎⴰⵍⴰ ⵏ ⵓⵔⵏⵓ ⵖⵔ ⵜⴼⵍⵡⵉⵜ/);
assert.doesNotMatch(translated['toggle-assignees'], /[\u0600-\u06ff]/);

// Trigger state labels stay distinct from imperative checklist actions.
assert.strictEqual(translated['r-checked'], 'ⵙ ⵜⵎⴰⵜⴰⵔⵜ');
assert.strictEqual(translated['r-unchecked'], 'ⴱⵍⴰ ⵜⴰⵎⴰⵜⴰⵔⵜ');
assert.notStrictEqual(translated['r-checked'], translated['r-check']);
assert.notStrictEqual(translated['r-unchecked'], translated['r-uncheck']);
assert.doesNotMatch(translated['r-checked'] + translated['r-unchecked'], /Coché|Décoché|[\u0600-\u06ff]/u);
const checklistTriggers = fs.readFileSync(path.join(ROOT,
  'client/components/rules/triggers/checklistTriggers.jade'), 'utf8');
assert.match(checklistTriggers, /option\(value="checked"\).*r-checked/);
assert.match(checklistTriggers, /option\(value="unchecked"\).*r-unchecked/);

assert.strictEqual(translated['r-move-card-to'], 'ⵙⵎⵓⵜⵜⵉ ⵜⴰⴽⴰⵕⴹⴰ ⵖⵔ');
assert.strictEqual(translated['r-create-card'], 'ⵙⵏⵓⵍⴼⵓ ⵜⴰⴽⴰⵕⴹⴰ ⵜⴰⵎⴰⵢⵏⵓⵜ');
assert.doesNotMatch(translated['r-move-card-to'] + translated['r-create-card'], /Déplacer|Créer|[\u0600-\u06ff]/u);
const boardActionTemplate = fs.readFileSync(path.join(ROOT,
  'client/components/rules/actions/boardActions.jade'), 'utf8');
assert.match(boardActionTemplate, /r-move-card-to/);
assert.match(boardActionTemplate, /r-create-card/);

const pokerWarning = translated['poker-delete-pop'];
assert.ok(pokerWarning.startsWith(translated['card-delete-notice'].split('. ')[0] + '. '));
assert.match(pokerWarning, /ⵜⵉⴳⴰⵡⵉⵏ ⴰⴽⴽⵯ ⵏ Planning Poker ⴰⴷ/);
assert.doesNotMatch(pokerWarning, /La suppression|Vous perdrez|[\u0600-\u06ff]/u);
const pokerTemplate = fs.readFileSync(path.join(ROOT,
  'client/components/cards/cardDetails.jade'), 'utf8');
assert.match(pokerTemplate, /template\(name="deletePokerPopup"\)\s+p.*poker-delete-pop/);

const labelWarning = translated['label-delete-pop'];
assert.ok(labelWarning.startsWith(translated['card-delete-notice'].split('. ')[0] + '. '));
assert.match(labelWarning, /ⵓⵔⵛⵓⵎ ⴰⴷ ⵙⴳ ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ ⴰⴽⴽⵯ/);
assert.match(labelWarning, /\. ⵔⴰⴷ ⵉⵜⵜⵓⴽⴽⵙ ⵓⵎⵣⵔⵓⵢ ⵏⵏⵙ\./);
assert.doesNotMatch(labelWarning, /[\u0600-\u06ff]/u);
const labelTemplate = fs.readFileSync(path.join(ROOT,
  'client/components/cards/labels.jade'), 'utf8');
assert.match(labelTemplate, /template\(name="deleteLabelPopup"\)\s+p.*label-delete-pop/);

assert.strictEqual(translated['keyboard-shortcuts'], 'ⵉⵙⵓⵏⴰⴼ ⵏ ⵜⵏⴰⵙⵜ');
assert.match(translated['keyboard-shortcuts-enabled'], /ⵜⵜⵓⵙⵙⵔⴼⵓⵏ\. ⴽⵍⵉⴽⵉ.*ⵜⵙⵙⵏⵙⴷ/);
assert.match(translated['keyboard-shortcuts-disabled'], /ⵜⵜⵓⵙⵙⵏⵙⵏ\. ⴽⵍⵉⴽⵉ.*ⵜⵙⵙⵔⴼⵓⴷ/);
for (const key of ['keyboard-shortcuts', 'keyboard-shortcuts-enabled', 'keyboard-shortcuts-disabled']) {
  assert.doesNotMatch(translated[key], /[\u0600-\u06ff]/u);
  assert.ok(translated[key].startsWith(translated['keyboard-shortcuts']));
}
const sidebarTemplate = fs.readFileSync(path.join(ROOT,
  'client/components/sidebar/sidebar.jade'), 'utf8');
assert.match(sidebarTemplate, /isKeyboardShortcuts.*keyboard-shortcuts-enabled.*else.*keyboard-shortcuts-disabled/);

const pdfWarning = translated['preview-pdf-not-supported'];
assert.match(pdfWarning, /ⴰⵎⴰⵜⵜⵉⵡ ⵏⵏⴽ ⵓⵔ ⵉⵣⵎⵔ/);
assert.ok(pdfWarning.includes(translated.preview + ' ⵏ PDF'));
assert.match(pdfWarning, /ⴰⵔⵎ ⴰⴷ ⵜⴰⴳⵎⴷ ⴰⴼⴰⵢⵍⵓ ⴳ ⵓⴷⵖⴰⵔ ⵏ ⴰⵢⴰ/);
assert.doesNotMatch(pdfWarning, /[\u0600-\u06ff]/u);

const adminWarning = translated['last-admin-desc'];
assert.match(adminWarning, /ⵓⵔ ⵜⵣⵎⵔⴷ ⴰⴷ ⵜⵙⵏⴼⵍⴷ/);
assert.ok(adminWarning.includes(translated.roles));
assert.match(adminWarning, /ⵢⴰⵏ ⵓⵎⵙⵙⵓⴳⵓⵔ ⵏⵖ ⵓⴳⴳⴰⵔ/);
assert.doesNotMatch(adminWarning, /[\u0600-\u06ff]/u);
assert.match(sidebarTemplate, /if isLastAdmin\s+hr\s+p.*last-admin-desc/);

const importWarning = translated['import-board-instruction-about-errors'];
assert.match(importWarning, /ⵉⵖ ⵍⵍⴰⵏⵜ ⵜⵉⵣⴳⴰⵍ/);
assert.match(importWarning, /ⴰⵜⴰⴼ ⵉⵎⵓⵔⵙ ⵓⵙⴽⵛⵓⵎ/);
assert.ok(importWarning.includes('«' + translated['all-boards'] + '»'));
assert.doesNotMatch(importWarning, /Si une erreur|Tous les tableaux|[\u0600-\u06ff]/u);
const importTemplate = fs.readFileSync(path.join(ROOT,
 'client/components/import/import.jade'), 'utf8');
assert.match(importTemplate, /import-board-instruction-about-errors/);

assert.strictEqual(translated.watching, 'ⴰⵎⴰⵜⵔ');
const watchWarning = translated['error-watch-disabled'];
assert.match(watchWarning, /ⵉⵙⵙⵏⵙⵉ ⵓⵎⵙⵙⵓⴳⵓⵔ/);
assert.match(watchWarning, /ⴰⵎⴰⵜⵔ ⵏ ⵜⴼⵍⵡⵉⵏ ⴷ ⵜⴽⴰⵕⴹⵉⵡⵉⵏ/);
assert.doesNotMatch(watchWarning + translated.watching, /Le suivi|[\u0600-\u06ff]/u);
const watchMethod = fs.readFileSync(path.join(ROOT,
 'server/notifications/watch.js'), 'utf8');
assert.match(watchMethod, /getFeatureFlags\(\).disableWatch[\s\S]*?throw new Meteor.Error\('error-watch-disabled'\)/);

const caseHint = translated['globalSearch-instructions-notes-4'];
assert.match(caseHint, /ⴰⵔⵣⵣⵓ ⵏ ⵓⴹⵕⵉⵚ ⵓⵔ ⵉⵙⵏⴰⵃⵢⴰ/);
assert.match(caseHint, /ⵉⵙⴽⴽⵉⵍⵏ ⵉⵎⵇⵇⵔⴰⵏⵏ ⴷ ⵉⵎⵥⵥⵢⴰⵏⵏ \(A\/a\)/);
assert.doesNotMatch(caseHint, /Les recherches|[\u0600-\u06ff]/u);

const fileWarning = translated['invalid-file'];
assert.match(fileWarning, /ⵉⵖ ⵓⵔ ⵉⴽⵏⵉ ⵉⵙⵎ ⵏ ⵓⴼⴰⵢⵍⵓ/);
assert.match(fileWarning, /ⵉⵜⵜⵓⵙⵙⵔ ⵓⵙⴽⵜⵔ ⵏⵖ ⵓⵙⵏⴼⵍ ⵏ ⵉⵙⵎ/);
assert.doesNotMatch(fileWarning, /[\u0600-\u06ff]|ⴰⵏⴽⵔⵓⴼ/u);

assert.strictEqual(translated['import-show-user-mapping'], 'ⵙⵙⵉⴷⴻⴷ ⴰⵣⴷⴰⵢ ⵏ ⵢⵉⴳⵎⴰⵎⵏ');
assert.doesNotMatch(translated['import-show-user-mapping'], /Contrôler|ⵙⵙⵉⴷⴷ|[\u0600-\u06ff]/u);

// Checklist compound uses the independently attested verification noun.
for (const [key, value] of Object.entries(translated)) {
  assert.ok(!value.includes('ⵏ ⵓⵙⵙⵉⴷⴷ'), key + ' retained unsupported checking noun');
}
assert.strictEqual(translated.checklist, 'ⵜⴰⵍⴳⴰⵎⵜ ⵏ ⵜⵎⵏⵥⵉⵜ');

const csvHint = translated['import-board-instruction-csv'];
assert.match(csvHint, /^ⵙⵍⵖ ⴰⵜⵉⴳⵏ ⵏⵏⴽ/);
assert.match(csvHint, /ⵜⵉⵙⴽⵔⵉⵏ \(CSV\) ⵏⵖ ⵙ ⵉⵙⴽⴽⵉⵍⵏ Tab \(TSV\)/);
assert.doesNotMatch(csvHint, /Déposez|virgules|[\u0600-\u06ff]/u);

assert.strictEqual(translated['custom-head-tags-enabled'], 'ⵙⵙⵔⴼⵓ ⵉⵔⵛⵓⵎⵏ ⵉⵥⵍⵉⵏ ⵏ head (HTML)');
assert.doesNotMatch(translated['custom-head-tags-enabled'], /Activer|balises|[\u0600-\u06ff]/u);

assert.strictEqual(translated["custom-manifest-enabled"], "ⵙⵙⵔⴼⵓ web manifest ⵉⵥⵍⵉⵏ");

assert.strictEqual(translated["custom-head-manifest-content"], "ⴰⴽⵜⵜⵓⵔ ⵏ web manifest ⵉⵥⵍⵉⵏ (JSON)");
assert.doesNotMatch(translated['custom-head-manifest-content'], /Contenu|personnalisé|[\u0600-\u06ff]/u);

assert.strictEqual(translated["legalNotice"], "ⵜⵓⵙⵎⵉⵔⵜ ⵜⴰⵣⵔⴼⴰⵏⵜ");

assert.strictEqual(translated["custom-legal-notice-link-url"], "URL ⵏ ⵜⴰⵙⵏⴰ ⵏ ⵜⵓⵙⵎⵉⵔⵜ ⵜⴰⵣⵔⴼⴰⵏⵜ ⵜⵉⵥⵍⵉⵏ");
assert.doesNotMatch(translated.legalNotice + translated['custom-legal-notice-link-url'], /mentions|légales|[\u0600-\u06ff]/u);

assert.strictEqual(translated["no-cards-found"], "ⵓⵔ ⵜⵜⵓⵢⴰⴼⵏⵜ ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ");

assert.strictEqual(translated["dueCards-noResults-title"], "ⵓⵔ ⵜⵜⵓⵢⴰⴼⵏⵜ ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ ⵙ ⵓⵙⴰⴽⵓⴷ ⴰⵎⴳⴳⴰⵔⵓ");

assert.strictEqual(translated["dueCards-noResults-description"], "ⵓⵔ ⴷⴰⵔⴽ ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ ⵙ ⵓⵙⴰⴽⵓⴷ ⴰⵎⴳⴳⴰⵔⵓ ⴷⵖⵉ.");
assert.doesNotMatch(translated['dueCards-noResults-description'], /Vous|échéance|[\u0600-\u06ff]/u);

assert.strictEqual(translated["auto-watch"], "ⵎⴰⵜⵔ ⵜⵉⴼⵍⵡⵉⵏ ⵙ ⵓⵡⵔⵎⴰⵏ ⵉⵖ ⵜⵜⵓⵙⵏⵓⵍⴼⴰⵏⵜ.");
assert.doesNotMatch(translated['auto-watch'], /[\u0600-\u06ff]/u);

assert.strictEqual(translated["export-card-field-people"], "ⵎⵉⴷⴷⵏ (ⴰⵎⵙⵏⴼⵍⵓⵍ, ⴱⴰⴱ ⵏ ⵜⴽⴰⵕⴹⴰ, ⵉⴳⵎⴰⵎⵏ, ⵉⴼⴳⴰⵏⵏ ⵉ ⵎⵉ ⵜⵜⵓⴼⴽⴰⵏⵜ ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ)");
assert.doesNotMatch(translated['export-card-field-people'], /Personnes|Propriétaire|Intervenants|[\u0600-\u06ff]/u);

assert.strictEqual(translated["mobile-mode"], "ⵜⴰⵍⵖⴰ Mobile");

assert.strictEqual(translated["desktop-mode"], "ⵜⴰⵍⵖⴰ Desktop");

assert.strictEqual(translated["mobile-desktop-toggle"], "ⵙⵏⴼⵍ ⴳⵔ ⵜⴰⵍⵖⴰ Mobile ⴷ ⵜⴰⵍⵖⴰ Desktop");
assert.doesNotMatch(translated['mobile-desktop-toggle'], /Basculer|bureau|[\u0600-\u06ff]/u);

assert.strictEqual(translated["r-board-note"], "ⵜⵉⵏⵥⵉ: ⴰⵊⵊ ⵉⴳⵔ ⴷ ⵉⵍⵎ ⵉ ⵓⵎⵙⴰⵙⴰ ⴰⴽⴷ ⴽⵓ ⴰⵣⴰⵍ ⴰⵎⵔⴷⵓ.");
assert.doesNotMatch(translated['r-board-note'], /[\u0600-\u06ff]|ⴰⵛⴰⵏⴰ|ⵜⴰⵎⵏⵢⵓⴳⴰⵔⵜ/u);

assert.strictEqual(translated["attachment-delete-pop"], "ⵔⴰⴷ ⵉⵜⵜⵓⴽⴽⵙ ⵓⴼⴰⵢⵍⵓ ⵢⵔⵏⴰⵏ ⵙ ⵓⵎⵖⵍⴰⵍ. ⵓⵔ ⵜⵣⵎⵔⴷ ⴰⴷ ⵜⵔⴰⵔⴷ ⴷ ⴰⵢⴰ.");
assert.doesNotMatch(translated['attachment-delete-pop'], /[\u0600-\u06ff]|ⵜⴰⵍⵓⴼⵜ/u);

assert.strictEqual(translated["delete-linked-card-before-this-card"], "ⵓⵔ ⵜⵣⵎⵔⴷ ⴰⴷ ⵜⴽⴽⵙⴷ ⵜⴰⴽⴰⵕⴹⴰ ⴰⴷ ⴷⴰⵜ ⴰⴷ ⵜⴽⴽⵙⴷ ⵜⴰⴽⴰⵕⴹⴰ ⵉⵣⴷⵉⵏ ⵏⵏⴰ ⴷⴰⵔⵙ");
assert.doesNotMatch(translated['delete-linked-card-before-this-card'], /Vous|supprimer|[\u0600-\u06ff]/u);

assert.strictEqual(translated["delete-linked-cards-before-this-list"], "ⵓⵔ ⵜⵣⵎⵔⴷ ⴰⴷ ⵜⴽⴽⵙⴷ ⵜⴰⵍⴳⴰⵎⵜ ⴰⴷ ⴷⴰⵜ ⴰⴷ ⵜⴽⴽⵙⴷ ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ ⵉⵣⴷⵉⵏ ⵏⵏⴰ ⵣⴷⵉⵏⵜ ⴰⴽⴷ ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ ⴳ ⵜⴰⵍⴳⴰⵎⵜ ⴰⴷ.");
assert.doesNotMatch(translated['delete-linked-cards-before-this-list'], /Vous|supprimer|pointent|[\u0600-\u06ff]/u);

assert.strictEqual(translated["page-maybe-private"], "ⴰⵜⴰⴼ ⵜⴰⵙⵏⴰ ⴰⴷ ⵜⴳⴰ ⵜⵓⵙⵍⵉⴳⵜ. ⴰⵜⴰⴼ ⵜⵣⵎⵔⴷ ⴰⴷ ⵜⵜ ⵜⵥⵕⴷ ⵉⵖ <a href='%s'>ⵜⴽⵛⵎⴷ</a>.");
assert.doesNotMatch(translated['page-maybe-private'], /[\u0600-\u06ff]/u);

assert.strictEqual(translated["paste-or-dragdrop"], "ⵉ ⵓⵙⵍⴰⵖ, ⵏⵖ ⴽⵔⵉⵔⵓ ⴷ ⵙⵜⵓⵜⵜⵉ ⴰⴼⴰⵢⵍⵓ ⵏ ⵜⵡⵍⴰⴼⵜ ⴷⴰ (ⵜⴰⵡⵍⴰⴼⵜ ⴽⴰⵏ)");
assert.doesNotMatch(translated['paste-or-dragdrop'], /coller|glissez|seulement|[\u0600-\u06ff]/u);

assert.strictEqual(translated["calendar-system-islamic-rgsa"], "ⴰⵙⵎⵍⵓⵙⵙⴰⵏ ⵏ ⵍⵉⵙⵍⴰⵎ (Saudi Arabia, ⴰⵣⵍⴰⵎ ⵏ ⵡⴰⵢⵢⵓⵔ)");
assert.doesNotMatch(translated['calendar-system-islamic-rgsa'], /^Islamic \(Saudi Arabia\)$/);

assert.strictEqual(translated["remove-member-pop"], "ⴽⴽⵙ __name__ (__username__) ⵙⴳ __boardTitle__? ⵔⴰⴷ ⵉⵜⵜⵓⴽⴽⵙ ⵓⴳⵎⴰⵎ ⵙⴳ ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ ⴰⴽⴽⵯ ⴳ ⵜⴼⵍⵡⵉⵜ ⴰⴷ. ⵔⴰⴷ ⵜⵜⵓⵙⵉⴼⴹ ⵜⴰⵏⵖⵎⵉⵙⵜ ⵉ ⵓⴳⵎⴰⵎ.");
assert.doesNotMatch(translated['remove-member-pop'], /[\u0600-\u06ff]/u);

assert.strictEqual(translated["list-delete-pop"], "ⵔⴰⴷ ⵜⵜⵓⴽⴽⵙⵏⵜ ⵜⵉⴳⴰⵡⵉⵏ ⴰⴽⴽⵯ ⵙⴳ ⵜⵍⴳⴰⵎⵜ ⵏ ⵜⵉⴳⴰⵡⵉⵏ. ⵓⵔ ⵜⵣⵎⵔⴷ ⴰⴷ ⵜⵔⵥⵎⴷ ⵜⴰⵍⴳⴰⵎⵜ ⴷⴰⵖ. ⵓⵔ ⵜⵣⵎⵔⴷ ⴰⴷ ⵜⵔⴰⵔⴷ ⴷ ⴰⵢⴰ.");
assert.doesNotMatch(translated['list-delete-pop'], /Toutes|récupérer|[\u0600-\u06ff]/u);

assert.strictEqual(translated.owner, 'ⴱⴰⴱ ⵏ ⵜⴽⴰⵕⴹⴰ');
assert.doesNotMatch(translated.owner, /Propriétaire|[\u0600-\u06ff]/u);
assert.ok(translated['export-card-field-people'].includes(translated.owner));
console.log('Tamazight owner heading agrees with the card-owner export field');

assert.strictEqual(translated['smtp-tls'], 'ⴰⵙⵎⵔⵙ ⵏ TLS');
assert.strictEqual(translated['email-smtp-test-subject'], 'ⵉⵎⴰⵢⵍ ⵏ ⵓⴽⴰⵢⴰⴷ SMTP');
for (const key of ['smtp-tls', 'email-smtp-test-subject']) {
  assert.doesNotMatch(translated[key], /[\u0600-\u06ff]|E-mail de test|ال سي/u);
}
assert.ok(translated['smtp-tls-description'].includes(translated['smtp-tls']));
assert.ok(translated['send-smtp-test'].includes('ⵉⵎⴰⵢⵍ ⵏ ⵓⴽⴰⵢⴰⴷ'));
console.log('Tamazight SMTP labels retain protocol identifiers and existing terminology');

assert.strictEqual(translated['smtp-port'], 'Port SMTP');
assert.strictEqual(translated['smtp-port-description'], 'Port ⵍⵍⵉ ⵉⵙⵙⵎⵔⵙ ⵓⵎⴰⴽⴽⴰⵢ ⴰⵙⵏⵎⴰⵍⴰⵢ SMTP ⵏⴽ ⵉ ⵓⵣⵏ ⵏ ⵜⵉⵎⵢⴰⵣⴰⵏⵉⵏ ⵜⵉⵍⵉⴽⵟⵕⵓⵏⵉⵜⵉⵏ.');
assert.doesNotMatch(translated['smtp-port-description'], /Le port|[\u0600-\u06ff]|ⴰⴼⵜⴰⵙ/u);
assert.ok(translated['smtp-port-description'].includes('ⵉ ⵓⵣⵏ'));
console.log('Tamazight SMTP port description preserves outgoing-mail purpose');

assert.strictEqual(translated['show-desktop-drag-handles'], 'ⵙⵙⴽⵏ ⵜⵉⵇⴱⴱⵉⴹⵉⵏ ⵏ ⵓⴽⵔⵉⵔⵓ ⴳ Desktop');
assert.doesNotMatch(translated['show-desktop-drag-handles'], /Voir les|bureau|[\u0600-\u06ff]/u);
console.log('Tamazight drag-handle label distinguishes Desktop mode and drag purpose');

for (const [suffix, verb] of [['created', 'ⵜⵜⵓⵙⵏⵓⵍⴼⴰⵏⵜ'], ['modified', 'ⵜⵜⵓⵙⵙⵏⴼⵍⵏⵜ']]) {
  const key = 'globalSearch-instructions-operator-' + suffix;
  assert.strictEqual(translated[key], '`__operator_' + suffix + '__:<n>` - ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ ⵍⵍⵉ ' + verb + ' ⴳ *<n>* ⵏ ⵡⵓⵙⵙⴰⵏ ⵉⵎⴳⴳⵓⵔⴰ');
  assert.doesNotMatch(translated[key], /cartes|jours|[\u0600-\u06ff]/u);
}
console.log('Tamazight creation and modification hints preserve distinct operators and recent-day bounds');

assert.strictEqual(translated["globalSearch-instructions-operator-due"], "`__operator_due__:<n>` - ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ ⵙ ⵓⵙⴰⴽⵓⴷ ⴰⵎⴳⴳⴰⵔⵓ ⴰⵔ *<n>* ⵏ ⵡⵓⵙⵙⴰⵏ ⵙⴳ ⴷⵖⵉ.\n`__operator_due__:__predicate_overdue__` ⵉⵙⵙⴽⵏ ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ ⴰⴽⴽⵯ ⵙ ⵓⵙⴰⴽⵓⴷ ⴰⵎⴳⴳⴰⵔⵓ ⴷⴰⵜ ⵏ ⴷⵖⵉ.");
assert.doesNotMatch(translated['globalSearch-instructions-operator-due'], /cartes|jours|[\u0600-\u06ff]/u);
assert.strictEqual((translated['globalSearch-instructions-operator-due'].match(/`/g) || []).length, 4);
console.log('Tamazight due hint preserves numeric and overdue examples separately');

assert.strictEqual(translated['accounts-lockout-locked-users'], 'ⵉⵏⵙⵙⵎⵔⵙⵏ ⵜⵜⵓⴳⴷⵍⵏⵉⵏ');
assert.ok(translated['accounts-lockout-locked-users-info'].startsWith(translated['accounts-lockout-locked-users']));
assert.doesNotMatch(translated['accounts-lockout-locked-users'], /Utilisateurs|verrouillés|[\u0600-\u06ff]/u);
console.log('Tamazight locked-users navigation label matches its plural description');

assert.strictEqual(translated['accounts-lockout-failed-attempts'], 'ⵜⵉⵙⵉⵔⴰⵎ ⵙ ⵉⵣⴳⴰⵍⵏ');
assert.doesNotMatch(translated['accounts-lockout-failed-attempts'], /Tentatives|échec|[\u0600-\u06ff]|ⵜⴰⵙⵉⵖⵜ|ⴰⵎⵚⵉⵕⵉⴹ|ⴰⵏⵏⴳⵣⵉ/u);
assert.ok(translated['accounts-lockout-failures-before'].startsWith('ⵉⵣⴳⴰⵍⵏ'));
console.log('Tamazight failed-attempt label uses plural trials and existing failure terminology');

assert.strictEqual(translated['accounts-lockout-settings'], 'ⵜⵉⵙⵖⴰⵍ ⵏ ⵓⴼⵔⴰⴳ ⵙⴳ brute force');
assert.strictEqual(translated['accounts-lockout-settings-updated'], 'ⵜⵜⵓⵙⴷⵖⵉⵏⵜ ' + translated['accounts-lockout-settings']);
for (const key of ['accounts-lockout-settings', 'accounts-lockout-settings-updated']) {
 assert.doesNotMatch(translated[key], /Paramètres|paramètres|mis à jour|[\u0600-\u06ff]|ⴰⴷⵡⴰⵙ/u);
}
console.log('Tamazight brute-force heading and update confirmation retain distinct meanings');

assert.strictEqual(translated["accounts-lockout-info"], "ⵜⵉⵙⵖⴰⵍ ⴰⴷ ⵉ ⵓⵙⵏⴰⵎ ⵏ ⵓⴼⵔⴰⴳ ⵏ ⵜⵉⵙⵉⵔⴰⵎ ⵏ ⵓⴽⵛⵛⵓⵎ ⵙⴳ ⴰⵣⵣⴰⵖⵏ ⵏ brute force.");
assert.doesNotMatch(translated['accounts-lockout-info'], /Ces paramètres|tentatives|protégés|[\u0600-\u06ff]|ⵜⴰⵏⴹⴰⴼⵜ|ⴰⴷⵡⴰⵙ/u);
assert.ok(translated['accounts-lockout-info'].includes('ⵜⵉⵙⵉⵔⴰⵎ ⵏ ⵓⴽⵛⵛⵓⵎ'));
console.log('Tamazight lockout explanation retains login-attempt scope and brute-force attacks');

assert.strictEqual(translated["Node_heap_total_heap_size"], "ⴰⴳⵓⴷⵉ ⵏ Node: ⵜⴰⵎⵓⵜⵜⵔⵜ ⵏ ⵓⵇⵓⴷⴷⵉ ⵏ ⵓⴳⵓⴷⵉ");

assert.strictEqual(translated["Node_heap_used_heap_size"], "ⴰⴳⵓⴷⵉ ⵏ Node: ⴰⵇⵓⴷⴷⵉ ⵏ ⵓⴳⵓⴷⵉ ⵉⵜⵜⵓⵙⵙⵎⵔⵙⵏ");
for (const key of ['Node_heap_total_heap_size', 'Node_heap_used_heap_size']) {
 assert.doesNotMatch(translated[key], /Tas de|taille|[\u0600-\u06ff]/u);
}
assert.notStrictEqual(translated.Node_heap_total_heap_size, translated.Node_heap_used_heap_size);
console.log('Tamazight total and used heap labels remain distinct');

assert.strictEqual(translated.Node_heap_heap_size_limit, "ⴰⴳⵓⴷⵉ ⵏ Node: ⵜⵉⴳⴳⵓⵎⵔⴰ ⵏ ⵓⵇⵓⴷⴷⵉ ⵏ ⵓⴳⵓⴷⵉ");
assert.doesNotMatch(translated.Node_heap_heap_size_limit, /Tas de|limite de|[\u0600-\u06ff]|ⵜⴰⴽⵜⵓⵜ/u);
assert.notStrictEqual(translated.Node_heap_heap_size_limit, translated.Node_heap_total_heap_size);
assert.notStrictEqual(translated.Node_heap_heap_size_limit, translated.Node_heap_used_heap_size);
console.log('Tamazight heap limit stays distinct from total and used size');

assert.strictEqual(translated["Node_heap_malloced_memory"], "ⴰⴳⵓⴷⵉ ⵏ Node: ⵜⵉⵎⴽⵜⵉⵜ ⵙ malloc");

assert.strictEqual(translated["Node_heap_peak_malloced_memory"], "ⴰⴳⵓⴷⵉ ⵏ Node: ⴰⵎⵓⵣⵣⵓⵔ ⵏ ⵜⵎⴽⵜⵉⵜ ⵙ malloc");
for (const key of ['Node_heap_malloced_memory', 'Node_heap_peak_malloced_memory']) {
 assert.doesNotMatch(translated[key], /Tas de|mémoire|allouée|[\u0600-\u06ff]|ⴰⴷⵔⴰⵔ/u);
 assert.ok(translated[key].endsWith('ⵙ malloc'));
}
assert.notStrictEqual(translated.Node_heap_malloced_memory, translated.Node_heap_peak_malloced_memory);
console.log('Tamazight malloc memory and peak labels retain allocation identifier and distinct maximum');

assert.strictEqual(translated["Node_heap_total_available_size"], "ⴰⴳⵓⴷⵉ ⵏ Node: ⵜⴰⵎⵓⵜⵜⵔⵜ ⵏ ⵓⵇⵓⴷⴷⵉ ⵍⵍⵉ ⵉⵜⵜⵙⴰⵍⴰⵏ");

assert.strictEqual(translated["Node_heap_total_heap_size_executable"], "ⴰⴳⵓⴷⵉ ⵏ Node: ⵜⴰⵎⵓⵜⵜⵔⵜ ⵏ ⵓⵇⵓⴷⴷⵉ ⵏ ⵓⴳⵓⴷⵉ ⵉ ⵓⵣⵣⴳⵉⵔ");
for (const key of ['Node_heap_total_available_size', 'Node_heap_total_heap_size_executable']) {
 assert.doesNotMatch(translated[key], /Tas de|taille totale|disponible|exécutable|[\u0600-\u06ff]/u);
 assert.notStrictEqual(translated[key], translated.Node_heap_total_heap_size);
}
console.log('Tamazight available and executable heap labels stay distinct from total heap');

assert.strictEqual(translated.Node_heap_does_zap_garbage, "ⴰⴳⵓⴷⵉ ⵏ Node: ⴰⵙⵎⵔⵙ ⵏ does_zap_garbage");
assert.doesNotMatch(translated.Node_heap_does_zap_garbage, /Tas de|Utilise|option|[\u0600-\u06ff]/u);
assert.ok(translated.Node_heap_does_zap_garbage.endsWith('does_zap_garbage'));
console.log('Tamazight garbage diagnostic retains its literal flag identifier');

assert.strictEqual(translated["Node_heap_number_of_native_contexts"], "ⴰⴳⵓⴷⵉ ⵏ Node: ⵓⵟⵟⵓⵏ ⵏ ⵉⵎⵏⴰⴹⵏ (native)");

assert.strictEqual(translated["Node_heap_number_of_detached_contexts"], "ⴰⴳⵓⴷⵉ ⵏ Node: ⵓⵟⵟⵓⵏ ⵏ ⵉⵎⵏⴰⴹⵏ (detached)");
for (const q of ['native', 'detached']) {
 const value = translated['Node_heap_number_of_' + q + '_contexts'];
 assert.doesNotMatch(value, /Tas de|nombre de|[\u0600-\u06ff]|ⴰⵕⵚⵍⵉ/u);
 assert.ok(value.endsWith('(' + q + ')'));
}
console.log('Tamazight context-count labels preserve distinct V8 qualifiers');

assert.strictEqual(translated.Node_heap_total_physical_size, "ⴰⴳⵓⴷⵉ ⵏ Node: ⵜⴰⵎⵓⵜⵜⵔⵜ ⵏ ⵓⵇⵓⴷⴷⵉ ⴰⴽⵎⴰⵎ");
assert.doesNotMatch(translated.Node_heap_total_physical_size, /Tas de|taille totale|physique|[\u0600-\u06ff]|ⴰⴷⵡⴰⵙ/u);
assert.notStrictEqual(translated.Node_heap_total_physical_size, translated.Node_heap_total_heap_size);
console.log('Tamazight physical heap size stays distinct from total heap size');

assert.strictEqual(translated["custom-top-left-corner-logo-image-url"], "URL ⵏ ⵜⵡⵍⴰⴼⵜ ⵏ ⵓⵍⵓⴳⵓ ⵉⵥⵍⵉⵏ ⴳ ⵜⵖⵎⵔⵜ ⵏ ⵓⴼⵍⵍⴰ ⵖⵔ ⵓⵥⵍⵎⴰⴹ");

assert.strictEqual(translated["custom-top-left-corner-logo-link-url"], "URL ⵏ ⵓⵙⵖⵏ ⵏ ⵓⵍⵓⴳⵓ ⵉⵥⵍⵉⵏ ⴳ ⵜⵖⵎⵔⵜ ⵏ ⵓⴼⵍⵍⴰ ⵖⵔ ⵓⵥⵍⵎⴰⴹ");
for (const q of ['image', 'link']) {
 assert.doesNotMatch(translated['custom-top-left-corner-logo-' + q + '-url'], /supérieur gauche|personnalisé|[\u0600-\u06ff]/u);
}
assert.notStrictEqual(translated['custom-top-left-corner-logo-image-url'], translated['custom-top-left-corner-logo-link-url']);
console.log('Tamazight top-left logo labels retain image and link distinction');

assert.strictEqual(translated["hide-logo"], "ⴼⴼⵔ ⵍⵓⴳⵓ");

assert.strictEqual(translated["header-logo-title"], "ⴰⵖⵓⵍ ⵖⵔ ⵜⴰⵙⵏⴰ ⵏ ⵜⴼⵍⵡⵉⵏ ⵏⴽ.");

assert.strictEqual(translated["custom-top-left-corner-logo-height"], "ⵜⴰⵖⵣⵉ ⵏ ⵓⵍⵓⴳⵓ ⵉⵥⵍⵉⵏ ⴳ ⵜⵖⵎⵔⵜ ⵏ ⵓⴼⵍⵍⴰ ⵖⵔ ⵓⵥⵍⵎⴰⴹ. ⵙ ⵓⵡⵏⵓⵍ: 27");
for (const key of ['hide-logo', 'header-logo-title', 'custom-top-left-corner-logo-height']) {
 assert.doesNotMatch(translated[key], /Cacher|Hauteur|Défaut|[\u0600-\u06ff]/u);
}
assert.ok(translated['custom-top-left-corner-logo-height'].endsWith(': 27'));
console.log('Tamazight logo labels preserve hide, board-page return and default height');

assert.strictEqual(translated["error-json-schema"], "ⵉⵙⴼⴽⴰ JSON ⵏⴽ ⵓⵔ ⴷⴰⵔⵙⵏ ⵉⵏⵖⵎⵉⵙⵏ ⵉⴽⵏⴰⵏ ⴳ format ⵉⴽⵏⴰⵏ.");
assert.doesNotMatch(translated['error-json-schema'], /Vos données|contiennent|appropriée|[\u0600-\u06ff]/u);
assert.ok(translated['error-json-schema'].includes('JSON'));
console.log('Tamazight JSON schema warning retains data and information/format scope');

assert.strictEqual(translated["error-csv-schema"], "ⵉⵙⴼⴽⴰ CSV (ⴰⵜⵉⴳⵏ ⵉⵜⵜⵓⴱⴹⴰⵏ ⵙ ⵜⵉⵙⴽⵔⵉⵏ)/TSV (ⴰⵜⵉⴳⵏ ⵉⵜⵜⵓⴱⴹⴰⵏ ⵙ ⵉⵙⴽⴽⵉⵍⵏ Tab) ⵏⴽ ⵓⵔ ⴷⴰⵔⵙⵏ ⵉⵏⵖⵎⵉⵙⵏ ⵉⴽⵏⴰⵏ ⴳ format ⵉⴽⵏⴰⵏ.");
assert.doesNotMatch(translated['error-csv-schema'], /[\u0600-\u06ff]/u);
for (const token of ['CSV', 'TSV', 'ⵜⵉⵙⴽⵔⵉⵏ', 'Tab', 'format']) assert.ok(translated['error-csv-schema'].includes(token));
console.log('Tamazight CSV schema warning retains comma and Tab explanations');

assert.strictEqual(translated["act-newDue"], "__list__/__card__ ⴷⴰⵔⵙ ⴰⵙⴽⵜⵉ ⴰⵎⵣⵡⴰⵔⵓ ⵏ ⵓⵙⴰⴽⵓⴷ ⴰⵎⴳⴳⴰⵔⵓ [__board__]");
assert.doesNotMatch(translated["act-newDue"], /rappel|échéance|[\u0600-\u06ff]/u);
assert.ok(translated["act-newDue"].includes("ⴰⵙⴽⵜⵉ ⴰⵎⵣⵡⴰⵔⵓ"));
console.log("Tamazight first due reminder preserves named activity tokens");

assert.strictEqual(translated.Node_memory_usage_heap_used, "ⴰⵙⵎⵔⵙ ⵏ ⵜⵎⴽⵜⵉⵜ ⵏ Node: ⵜⵉⵎⴽⵜⵉⵜ ⵉⵜⵜⵓⵙⵙⵎⵔⵙⵏ ⵙ ⵜⵉⴷⵜ");
assert.doesNotMatch(translated.Node_memory_usage_heap_used, /Utilisation|mémoire|[\u0600-\u06ff]/u);
assert.notStrictEqual(translated.Node_memory_usage_heap_used, translated.Node_memory_usage_rss);

assert.strictEqual(translated.Node_memory_usage_rss, "ⴰⵙⵎⵔⵙ ⵏ ⵜⵎⴽⵜⵉⵜ ⵏ Node: ⴰⵇⵓⴷⴷⵉ ⵏ RSS");
assert.doesNotMatch(translated.Node_memory_usage_rss, /Utilisation|mémoire|résident|[\u0600-\u06ff]/u);
assert.ok(translated.Node_memory_usage_rss.endsWith("RSS"));
assert.notStrictEqual(translated.Node_memory_usage_rss, translated.Node_memory_usage_heap_used);
