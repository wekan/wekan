'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/kl.i18n.json')));
assert.equal(data['calendar-system'], 'Ullorsiutit aaqqissuussaanerat (ullunik takutitsineq)');
assert.doesNotMatch(data['calendar-system'], /görünüşü|Kalendar sistem/);
console.log('greenlandicCalendarLanguage: calendar arrangement/date display localized; Azerbaijani seed rejected');
