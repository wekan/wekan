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
const friulian = readLocale('fur');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[0-9$]*[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'fur',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Friulian value stays translated');

assert.deepEqual(Object.keys(friulian), Object.keys(english),
  'Friulian key order follows the English source');
for (const [key, value] of Object.entries(friulian)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(friulian.board, 'Taule');
assert.equal(friulian.card, 'Cjarte');
assert.equal(friulian.settings, 'Impostazions');
assert.equal(friulian.activities, 'Ativitâts');
assert.equal(friulian['enable-permanent-delete'],
  'Abilite la eliminazion definitive pal aministradôr globâl');
assert.deepEqual(tokens(friulian['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(friulian['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);

console.log('friulianTranslationProgress: complete locale passed');
