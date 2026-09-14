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

assert.equal(translated['r-items-check'], 'ⴰⴼⵔⴷⵉⵙ ⵏ ⵜⵍⴳⴰⵎⵜ ⵏ ⵓⵙⵙⵉⴷⴷ');
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
assert.equal(translated["r-d-check-of-list"], "ⵏ ⵜⵍⴳⴰⵎⵜ ⵏ ⵓⵙⵙⵉⴷⴷ");
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
