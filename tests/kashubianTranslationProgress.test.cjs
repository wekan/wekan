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
const kashubian = readLocale('csb');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%\d+\$[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'csb',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Kashubian value stays translated');
assert.deepEqual(Object.keys(kashubian), Object.keys(english),
  'Kashubian keys retain English source order');

for (const [key, value] of Object.entries(kashubian)) {
  assert.equal(typeof value, 'string', `${key}: Kashubian value is text`);
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(kashubian.accept, 'Przëjimnij');
assert.match(kashubian['board-title'], /tôblëcë/);
assert.match(kashubian['delete-board'], /Rëmôj tôblëcã/);
assert.match(kashubian.settings, /Ùstôwë/);
assert.deepEqual(tokens(kashubian['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(kashubian['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);

console.log('kashubianTranslationProgress: complete locale passed');
