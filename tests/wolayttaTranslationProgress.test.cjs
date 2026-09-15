const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const readLocale = code => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${code}.i18n.json`),
  'utf8',
));
const english = readLocale('en');
const wolaytta = readLocale('wal');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%\d*\$?[A-Za-z]|%\{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'wal',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Wolaytta value stays translated');

for (const [key, value] of Object.entries(wolaytta)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(wolaytta.board, 'Bookkiya');
assert.equal(wolaytta.card, 'Kaardiya');
assert.equal(wolaytta.list, 'Mazgabaa');
assert.equal(wolaytta.save, 'Naaga');
assert.equal(wolaytta.yes, 'Ee');
assert.deepEqual(tokens(wolaytta['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(wolaytta['activity-changedTitle']), ['%s', '%s']);
assert.equal(JSON.parse(wolaytta['copyManyCardsPopup-format']).length, 3);
assert.match(wolaytta['enable-permanent-delete'], /Wolayttatto/);

console.log('wolayttaTranslationProgress: complete locale passed');

const repairedCalendarLocale = JSON.parse(require('node:fs').readFileSync(require('node:path').resolve(__dirname, '../imports/i18n/data/wal.i18n.json'), 'utf8'));
for (const key of ['calendar','board-view-cal']) assert.equal(repairedCalendarLocale[key], 'Wodiyaa qoodaa');
assert.equal(repairedCalendarLocale['board-view-multiboard-cal'], 'Wodiyaa qoodaa (Ubba bookkiyata)');
assert.equal(repairedCalendarLocale['export-ical-feed'], 'Wodiyaa qoodaa (iCal)');
for (const key of ['calendar','board-view-cal','board-view-multiboard-cal','export-ical-feed']) assert.doesNotMatch(repairedCalendarLocale[key], /Wolayttatto: Calendar/);

assert.equal(wolaytta['calendar-system-ethiopic'], 'Toophphiya wodiyaa qoodaa');
assert.equal(wolaytta['calendar-system-ethioaa'], 'Toophphiya wodiyaa qoodaa (Amete Alem)');
assert.notEqual(wolaytta['calendar-system-ethioaa'], wolaytta['calendar-system-ethiopic']);
assert.doesNotMatch(wolaytta['calendar-system-ethioaa'] + wolaytta['calendar-system-ethiopic'], /Ethiopic/);

assert.equal(wolaytta['calendar-system-dangi'], 'Dangi wodiyaa qoodaa');
assert.equal(wolaytta['calendar-system-roc'], 'Minguo wodiyaa qoodaa');
assert.notEqual(wolaytta['calendar-system-dangi'], wolaytta['calendar-system-roc']);
assert.doesNotMatch(wolaytta['calendar-system-dangi'] + wolaytta['calendar-system-roc'], /Korean|Republic of China/);

assert.equal(wolaytta['calendar-system-islamic'], 'Hijri wodiyaa qoodaa');
assert.equal(wolaytta['calendar-system-islamic-umalqura'], 'Hijri wodiyaa qoodaa (Umm al-Qura)');
assert.notEqual(wolaytta['calendar-system-islamic'], wolaytta['calendar-system-islamic-umalqura']);
assert.doesNotMatch(wolaytta['calendar-system-islamic'] + wolaytta['calendar-system-islamic-umalqura'], /Islamic/);

assert.equal(wolaytta['calendar-system'], 'Wodiyaa qoodaa maaraa (gallassaa bessiyoogaa)');
assert.notEqual(wolaytta['calendar-system'], wolaytta.calendar);
assert.doesNotMatch(wolaytta['calendar-system'], /Kalendar|görünüşü/);
assert.match(require('node:fs').readFileSync(require('node:path').join(root, 'client/components/users/userHeader.jade'), 'utf8'), /{{_ 'calendar-system'}}/);

const remainingCalendarLabels = {
  'calendar-system-jalali': 'Jalali wodiyaa qoodaa (Persiyaa)',
  'calendar-system-buddhist': 'Buddhistiyaa wodiyaa qoodaa',
  'calendar-system-chinese': 'Chaaynaa wodiyaa qoodaa',
  'calendar-system-coptic': 'Qophiya wodiyaa qoodaa',
  'calendar-system-hebrew': 'Ibraawistta wodiyaa qoodaa',
  'calendar-system-indian': 'Indiyaa kawotettaa wodiyaa qoodaa',
  'calendar-system-islamic-civil':
    'Hijri wodiyaa qoodaa (qoodettiya, kawotettaa doomethaa)',
  'calendar-system-islamic-rgsa':
    'Hijri wodiyaa qoodaa (Saudi Arabia, aginaa be7aa)',
  'calendar-system-islamic-tbla':
    'Hijri wodiyaa qoodaa (qoodettiya, xoolliyaa doomethaa)',
  'calendar-system-japanese': 'Jaappaaniyaa wodiyaa qoodaa',
};
for (const [key, value] of Object.entries(remainingCalendarLabels)) {
  assert.equal(wolaytta[key], value, key);
  assert.doesNotMatch(value,
    /^Buddhist$|^Chinese$|^Coptic$|^Hebrew$|^Indian national$|^Islamic|^Japanese$/,
    key);
}
assert.notEqual(wolaytta['calendar-system-islamic-civil'],
  wolaytta['calendar-system-islamic-tbla']);
assert.match(wolaytta['calendar-system-islamic-civil'],
  /qoodettiya.*kawotettaa doomethaa/);
assert.match(wolaytta['calendar-system-islamic-tbla'],
  /qoodettiya.*xoolliyaa doomethaa/);
assert.match(wolaytta['calendar-system-islamic-rgsa'], /aginaa be7aa/);
const calendarSystemsSource = fs.readFileSync(
  path.join(root, 'imports/lib/calendarSystems.js'), 'utf8');
for (const key of Object.keys(remainingCalendarLabels)) {
  const id = key.slice('calendar-system-'.length);
  assert.match(calendarSystemsSource, new RegExp(`'${id}'`), key);
}
