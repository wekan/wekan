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

assert.equal(data['calendar-system-coptic'], 'Qaammatisiutit (Coptic)');
assert.notEqual(data['calendar-system-coptic'], 'Coptic');
assert.notEqual(data['calendar-system-coptic'], data['calendar-system-ethiopic']);

assert.equal(data['calendar-system-islamic-rgsa'], 'Qaammatisiutit Hijri (Saudi Arabia, qaammatip takuneqarnera)');
assert.doesNotMatch(data['calendar-system-islamic-rgsa'], /^Islamic/);
assert.notEqual(data['calendar-system-islamic-rgsa'], data['calendar-system-islamic-umalqura']);

assert.equal(data['calendar-system-islamic-civil'], 'Qaammatisiutit Hijri (tabelit tunngavigalugit, aallartiffik: tallimanngorneq)');
assert.doesNotMatch(data['calendar-system-islamic-civil'], /Islamic|tabular|civil epoch|astronomical epoch/);

assert.equal(data['calendar-system-islamic-tbla'], 'Qaammatisiutit Hijri (tabelit tunngavigalugit, ulloriarsiornerup aallartiffia: sisamanngorneq)');
assert.doesNotMatch(data['calendar-system-islamic-tbla'], /Islamic|tabular|civil epoch|astronomical epoch/);

assert.notEqual(data['calendar-system-islamic-civil'], data['calendar-system-islamic-tbla']);
