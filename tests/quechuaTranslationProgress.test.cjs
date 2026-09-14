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
const quechua = readLocale('qu');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'qu',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Quechua value stays translated');

assert.deepEqual(Object.keys(quechua), Object.keys(english),
  'Quechua keys and their order match English');
for (const [key, value] of Object.entries(quechua)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(quechua.accept, 'Kay willaymi: Chaskiy');
assert.equal(quechua.settings, 'Allichaykuna');
// Chilean Ministry of Education, native Cusco Collao dictionary (2019), p. 18.
assert.equal(quechua.calendar, 'Watanqillqa');
for (const [key, name] of [['calendar-system-dangi', 'Dangi'],
  ['calendar-system-roc', 'Minguo'], ['calendar-system-islamic', 'Hijri']]) {
  assert.equal(quechua[key], `${name} Watanqillqa`);
  assert.doesNotMatch(quechua[key], /Intiwatana|Islamic tabular/);
}
assert.doesNotMatch(quechua.calendar, /Calendart|Kay willaymi|Intiwatana/);
assert.equal(quechua.day, 'P’unchay');
assert.equal(quechua['every-1-day'], 'Sapa p’unchay');
for (const key of ['day', 'every-1-day']) {
  assert.doesNotMatch(quechua[key], /Kay willaymi|Everyta|[Dd]ayta/);
}
for (const file of ['client/components/boards/boardBody.js',
  'client/components/boards/multiboardCalendarView.js']) {
  assert.match(fs.readFileSync(path.join(root, file), 'utf8'),
    /day: t\('day', 'Day'\)/, 'calendar toolbar uses the translated day label');
}
assert.match(quechua['act-deleteCard'], /Qullusqa Tarjeta/);
assert.deepEqual(tokens(quechua['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);

console.log('quechuaTranslationProgress: complete locale passed');

assert.equal(quechua["calendar-system-gregorian"], "Gregoriano Watanqillqa");
assert.equal(quechua["calendar-system-buddhist"], "Budista Watanqillqa");
assert.equal(quechua["calendar-system-chinese"], "Chino Watanqillqa");
assert.equal(quechua["calendar-system-coptic"], "Copto Watanqillqa");
assert.equal(quechua["calendar-system-ethioaa"], "Etíope Amete Alem Watanqillqa");
assert.equal(quechua["calendar-system-ethiopic"], "Etiope Watanqillqa");
assert.equal(quechua["calendar-system-hebrew"], "Hebreo Watanqillqa");
assert.equal(quechua["calendar-system-japanese"], "Japones Watanqillqa");
assert.equal(quechua["calendar-system-islamic-umalqura"], "Hijri Watanqillqa (Umm al-Qura)");
for (const key of ["calendar-system-gregorian", "calendar-system-buddhist", "calendar-system-chinese", "calendar-system-coptic", "calendar-system-ethioaa", "calendar-system-ethiopic", "calendar-system-hebrew", "calendar-system-japanese", "calendar-system-islamic-umalqura"]) assert.doesNotMatch(quechua[key], /Intiwatana/);

assert.equal(quechua["calendar-system-jalali"], "Jalali Watanqillqa (Persa)");
assert.equal(quechua["calendar-system-iso8601"], "Gregoriano Watanqillqa (ISO 8601 simanakuna)");
assert.equal(quechua["week"], "Simana");
assert.doesNotMatch(quechua.week, /Kay willaymi/);
assert.match(quechua['calendar-system-iso8601'], /^Gregoriano.*ISO 8601 simanakuna/);
assert.match(quechua['calendar-system-jalali'], /^Jalali/);

assert.equal(quechua['calendar-system'], 'Watanqillqa llika (p’unchay rikuchiy)');
assert.doesNotMatch(quechua['calendar-system'], /Intiwatana/);
assert.match(quechua['calendar-system'], /llika.*p’unchay rikuchiy/);

// Unicode CLDR: tabular Thursday epoch is one Julian day before civil Friday.
for (const [variant, epoch] of [['civil', '622-07-16'], ['tbla', '622-07-15']]) {
  const value = quechua[`calendar-system-islamic-${variant}`];
  assert.equal(value, `Hijri Watanqillqa (tawla yupay; qallariy: ${epoch}, Juliano)`);
  assert.doesNotMatch(value, /Intiwatana|Islamic tabular|epoca civil/);
  assert.deepEqual(tokens(value), tokens(english[`calendar-system-islamic-${variant}`]));
}
assert.notEqual(quechua['calendar-system-islamic-civil'],
  quechua['calendar-system-islamic-tbla'], 'distinct epochs must not collapse');

assert.equal(quechua['calendar-system-islamic-rgsa'],
  'Hijri Watanqillqa (Arabia Saudita, killa qhawarisqa)');
assert.doesNotMatch(quechua['calendar-system-islamic-rgsa'], /Intiwatana|tawla yupay|622-07/);
for (const [key, value] of Object.entries(quechua).filter(([key]) => key.startsWith('calendar-system'))) {
  assert.doesNotMatch(value, /Intiwatana/, `${key}: a calendar is not a clock`);
}
