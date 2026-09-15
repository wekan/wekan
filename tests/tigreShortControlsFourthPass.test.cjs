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
const ti = read('ti');
const reviewed = {
  'activity-on': 'ዲብ %s',
  'removeBoardDomainPopup-title': 'ዶሜይን አግዕዞ',
  casSignIn: 'ብ CAS እተው',
  samlSignIn: 'ብ SAML እተው',
  'sign-in-with': 'ብ%s እተው',
  'passwordless-sign-in': 'ብኮድ እተው',
  'font-size-largest': 'ዝዓበየ ክሎም',
  'unselect-all': 'ክሎም ምርጫ ኣልዕል',
  'r-unselect-all': 'ክሎም ምርጫ ኣልዕል',
  'listDeletePopup-title': 'ዝርዝር ይምሳሕ?',
  'ldap-test-connection-error': 'ርክብ ፈሽለ: %s',
  'mongodb-compact-error': 'Compact ፈሽለ፦',
  'list-sync-now-error': 'ምስምማዕ ፈሽለ: %s',
  'org-number': "ዐደድ መነዘማት፦ ",
  'team-number': 'ዐደድ ፈሪቃት፦ ',
  'people-number': 'ዐደድ ሰባት፦ ',
};
for (const [key, value] of Object.entries(reviewed)) {
  assert.equal(tigre[key], value, key + ': reviewed Tigre value');
  assert.notEqual(tigre[key], ti[key], key + ': Tigrinya seed removed');
}
assert.match(tigre['activity-on'], /%s/);
assert.match(tigre['ldap-test-connection-error'], /%s/);
assert.match(tigre['list-sync-now-error'], /%s/);
console.log('Tigre fourth short-control pass: ' + Object.keys(reviewed).length);
