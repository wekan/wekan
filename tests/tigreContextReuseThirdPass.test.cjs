'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code =>
  JSON.parse(
    fs.readFileSync(
      path.join(root, 'imports/i18n/data', code + '.i18n.json'),
      'utf8',
    ),
  );
const tigre = read('tig');
const tigrinya = read('ti');
const reviewed = {
  'import-trello-zip-too-many-files':
    "እቲ .zip ንምእታው ኣዝዮም ብዙሓት ፋይላት ኣለዉዎ።",
  'uploading-files': "ፋይላት ይስቀሉ ኣለዉ",
  'email-addresses': 'ዕንዋንታት ኢመይል',
  visibility: 'ርእየት',
  'r-workflow-format': 'ሸክል',
  'custom-field-stringtemplate-format':
    'ሸክል (%{value} ከም መተካእታ ተጠቐም)',
  filesReportTitle: "ጸብጻብ ፋይላት",
  'office-first-seen': 'መበገሲት ዝተራእየሉ',
  'api-first-called': 'መበገሲት ዝተጸውዐሉ',
  'sandstorm-disk-usage': 'መትነፍዒት ዲስክ',
  'azure-container-description': "ፋይላት ዝዕቀቡሉ blob container።",
  'memory-usage': 'መትነፍዒት መዘክር',
};
for (const [key, value] of Object.entries(reviewed)) {
  assert.equal(tigre[key], value, key + ': reviewed Tigre value');
  if (['import-trello-zip-too-many-files', 'uploading-files',
    'filesReportTitle', 'azure-container-description'].includes(key)) {
    assert.equal(tigre[key], tigrinya[key],
      key + ': corpus-attested shared Tigre File plural');
  } else {
    assert.notEqual(tigre[key], tigrinya[key],
      key + ': Tigrinya seed removed');
  }
}
assert.match(tigre['custom-field-stringtemplate-format'], /%\{value\}/);
assert.match(tigre['import-trello-zip-too-many-files'], /\.zip/);
console.log('Tigre third context-reuse pass: ' + Object.keys(reviewed).length);
