'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/kl.i18n.json')));
assert.equal(data['calendar-system'], 'Ullorsiutit aaqqissuussaanerat (ullunik takutitsineq)');
assert.doesNotMatch(data['calendar-system'], /görünüşü|Kalendar sistem/);
console.log('greenlandicCalendarLanguage: calendar arrangement/date display localized; Azerbaijani seed rejected');

// Adapted Greenlandic calendar phrase; structural checks do not prove fluency.
assert.equal(data['calendar-system-buddhist'], 'Buddhasiortut ullorsiutaat');
assert.notEqual(data['calendar-system-buddhist'], 'Buddhist');
assert.notEqual(data['calendar-system-buddhist'], data['calendar-system-hebrew']);

// Native national/India/calendar vocabulary is preserved in the adapted label.
assert.equal(data['calendar-system-indian'], 'Indiap nuna tamakkerlugu ullorsiutaa');
assert.doesNotMatch(data['calendar-system-indian'], /Indian national/);
assert.notEqual(data['calendar-system-indian'], data['calendar-system-buddhist']);
