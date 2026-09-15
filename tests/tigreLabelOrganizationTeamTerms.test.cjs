const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const locale = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
const tigre = locale('tig');
const tigrinya = locale('ti');
const reviewed = {
  "deleteLabelPopup-title": "እሻረት ይደምሰስ?",
  "filter-labels-label": "ብእሻረት ኣጻሪ",
  "filter-label-excluded": "ነዚ እሻረት ምግላል",
  "label-default": "እሻረት %s (ነባሪ)",
  "r-d-add-label": "እሻረት ወስኽ",
  "label-not-found": "እሻረት '%s' ኣይተረኽበን።",
  "label-color-not-found": "ሕብር እሻረት %s ኣይተረኽበን።",
  "label-colors": "ሕብርታት እሻረት",
  "label-names": "አስማይ እሻረት",
  "removeBoardOrgPopup-title": "መነዘመት ኣውጽእ",
  "org-tenant": "ብዙሕ ተኻራዪ፦ እዚ መነዘመት ከም ተኻራዪ",
  "org-name-not-found": "መነዘመት '%s' ኣይተረኽበን።",
  "removeBoardTeamPopup-title": "ፈሪቅ ኣውጽእ"
};
for (const [key, value] of Object.entries(reviewed)) {
  assert.equal(tigre[key], value, key + ': exact reviewed Tigre value');
  assert.notEqual(tigre[key], tigrinya[key], key + ': Tigrinya seed removed');
}
for (const key of ["deleteLabelPopup-title","filter-labels-label","filter-label-excluded","label-default","r-d-add-label","label-not-found","label-color-not-found","label-colors","label-names"]) assert.match(tigre[key], /እሻረት/, key + ': Label term');
for (const key of ["removeBoardOrgPopup-title","org-tenant","org-name-not-found"]) assert.match(tigre[key], /መነዘመት/, key + ': Organization term');
assert.match(tigre['removeBoardTeamPopup-title'], /ፈሪቅ/, 'Team term');
for (const key of ['cardDependencyIconPopup-title','custom-field-checkbox','external-link-pattern-prefix','dependency-icon']) assert.equal(tigre[key], tigrinya[key], key + ': excluded semantic sense');
console.log('Tigre label organization team terms: ' + Object.keys(reviewed).length);
