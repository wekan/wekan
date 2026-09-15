'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${name}.i18n.json`), 'utf8'));
const en = read('en');
const zgh = read('zgh');
assert.equal(en['email-address'], 'Email Address');
assert.equal(zgh['email-address'], 'ⴰⵏⵙⴰ ⵏ ⵉⵎⴰⵢⵍ');
assert.notEqual(zgh['email-address'], 'Adresse de courriel');
assert.notEqual(zgh['email-address'], zgh.email, 'address qualifier is retained');
const sidebar = fs.readFileSync(path.join(root, 'client/components/sidebar/sidebar.jade'), 'utf8');
assert.match(sidebar, /placeholder="{{_ 'email-address'}}"/);
console.log('zghEmailAddressNativeTerm: native address-and-email placeholder verified');
