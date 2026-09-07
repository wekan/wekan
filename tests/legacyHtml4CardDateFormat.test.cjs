'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const service = read('server/lib/memberDateFormat.js');
const method = read('server/models/users.js');
const route = read('server/legacyHtml4.js');
const page = read('server/lib/legacyHtml4Pages.js');
const jade = read('client/components/cards/cardDetails.js');
const users = read('models/users.js');
const preferencePublication = read('server/publications/userDesktopDragHandles.js');

assert.match(service, /MEMBER_DATE_FORMATS = \['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'\]/);
assert.match(service, /MEMBER_DATE_FORMATS\.includes\(dateFormat\)/);
assert.match(service, /source: 'memberDateFormat'/);
assert.match(method, /setMemberDateFormat\(this\.userId, dateFormat/);
assert.match(route, /legacyOperation === 'set-card-date-format'/);
assert.match(page, /legacyOperation: 'set-card-date-format'/);
assert.match(jade, /isDateFormat\(format\)[\s\S]*?const currentUser = Meteor\.user\(\)/);
assert.match(users, /Users\.safeFields = \{[\s\S]*?'profile\.dateFormat': 1/);
assert.match(preferencePublication, /'profile\.dateFormat': 1/);
for (const key of ['date-format-yyyy-mm-dd', 'date-format-dd-mm-yyyy',
  'date-format-mm-dd-yyyy']) assert.ok(page.includes(key));
console.log('legacyHtml4CardDateFormat: shared validated card preference passed');
