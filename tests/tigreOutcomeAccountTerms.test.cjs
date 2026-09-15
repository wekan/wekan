const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const locale = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
const tigre = locale('tig');
const tigrinya = locale('ti');
const reviewed = {
  "sandstorm-migration-failed": "ፈሽለ",
  "cloud-connection-failed": "ምትእስሳር ፈሽለ",
  "account-creation-failed": "ሕሳብ ምፍጣር ፈሽለ",
  "import-scoped-failed": "ምእታው ፈሽለ",
  "ldap-test-connection-success": "ርክብ ተዐወተ",
  "sandstorm-migration-success": "ተዐወተ",
  "cloud-connection-success": "ምትእስሳር ተዐወተ",
  "registration": "ተስጂል",
  "predicate-private": "ብሕት"
};
for (const [key, value] of Object.entries(reviewed)) {
  assert.equal(tigre[key], value, key + ': exact reviewed Tigre value');
  assert.notEqual(tigre[key], tigrinya[key], key + ': Tigrinya seed removed');
}
for (const key of ["sandstorm-migration-failed","cloud-connection-failed","account-creation-failed","import-scoped-failed"]) assert.match(tigre[key], /ፈሽለ/, key + ': Failed form');
for (const key of ["ldap-test-connection-success","sandstorm-migration-success","cloud-connection-success"]) assert.match(tigre[key], /ተዐወተ/, key + ': Success form');
assert.equal(tigre.registration, 'ተስጂል');
assert.equal(tigre['predicate-private'], 'ብሕት');
console.log('Tigre outcome and account terms: ' + Object.keys(reviewed).length);
