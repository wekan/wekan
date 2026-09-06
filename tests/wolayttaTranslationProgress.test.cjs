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
