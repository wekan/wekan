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
