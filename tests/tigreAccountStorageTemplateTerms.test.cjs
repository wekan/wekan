'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const locale = code =>
  JSON.parse(
    fs.readFileSync(
      path.join(root, 'imports/i18n/data', code + '.i18n.json'),
      'utf8',
    ),
  );
const tigre = locale('tig');
const tigrinya = locale('ti');
const reviewed = {
  'imported-member-no-account': 'ዝኣተወ ኣባል — ገና ዝሰማማዕ ሕሳብ የለን',
  'if-you-already-have-an-account': 'ድሮ ሕሳብ እንተለካ',
  'azure-account-key': 'መፍትሕ ሕሳብ',
  'azure-connection-string-description':
    "ኣማራጺ፦ ኣብ ክንዲ ስሜትን መፍትሕን ሕሳብ ምሉእ ሰንሰለት ምትእስሳር ተጠቐም።",
  'gcs-credentials': 'መረጋገጺታት ሕሳብ ኣገልግሎት (JSON)',
  'azure-account-name-description': 'ስሜት ሕሳብ Azure Storageኻ።',
  'already-account': 'ድሮ ሕሳብ ኣለካ? እቶ',
  'account-created': 'ሕሳብ ተፈጢሩ! ሕጂ ክትኣቱ ትኽእል።',
  'default-save-storage': 'ነባሪ መክዘን ምዕቃብ',
  'default-save-storage-saved': 'ነባሪ መክዘን ምዕቃብ ተዓቂቡ',
  'backup-storage': 'ናብ መክዘን ዓቅብ',
  'cloud-settings-saved': 'ቅንብራት መክዘን ተዓቂቦም',
  'attachment-storage-settings': 'ቅንብራት መክዘን',
  'list-templates-swimlane': 'ሞደላት ዝርዝር',
  'email-templates-title': 'ኢመይል ሞደላት',
  'org-shared-templates': 'ዝተኻፈሉ ሞደላት',
  'team-shared-templates': 'ዝተኻፈሉ ሞደላት',
};

for (const [key, value] of Object.entries(reviewed)) {
  assert.equal(tigre[key], value, key + ': exact reviewed Tigre value');
  assert.notEqual(tigre[key], tigrinya[key], key + ': Tigrinya seed removed');
}
assert.match(tigre['azure-account-name-description'], /ስሜት ሕሳብ/);
assert.doesNotMatch(tigre['azure-account-name-description'], /ስም መለያ/);
console.log(
  'Tigre account, storage and template terms: ' + Object.keys(reviewed).length,
);
