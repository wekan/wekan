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
const luganda = readLocale('lg');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%\d+\$[A-Za-z]|%[A-Za-z]|%\{[^}]+\}|\{\{[^}]+\}\}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'lg',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Luganda value stays translated');

for (const [key, value] of Object.entries(luganda)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(luganda.accept, 'Kkiriza');
assert.equal(luganda.activities, 'Emirimu');
assert.equal(luganda['all-boards'], 'Embaawo zonna');
assert.equal(luganda.save, 'Tereka');
assert.equal(luganda.location, 'Ekifo');
assert.match(luganda['due-date-changes'], /ennaku ey'ekkomo/);
assert.deepEqual(tokens(luganda['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(luganda['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.match(luganda['error-user-notSameOrgOrTeam'], /Ekitongole.*Tiimu/);

console.log('lugandaTranslationProgress: complete locale passed');
