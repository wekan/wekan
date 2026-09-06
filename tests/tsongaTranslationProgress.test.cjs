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
const tsonga = readLocale('ts');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'ts',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every Xitsonga string is translated');

for (const [key, value] of Object.entries(tsonga)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(tsonga.accept, 'amukela');
assert.equal(tsonga.add, 'Engetela');
assert.equal(tsonga.activities, 'Mintirho');
assert.equal(tsonga['history-change-removed'], 'Susiwile');
assert.match(tsonga['enable-permanent-delete'], /Mulawuri wa Misava/);
assert.deepEqual(tokens(tsonga['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);
assert.deepEqual(tokens(tsonga['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.doesNotThrow(() => JSON.parse(tsonga['copyManyCardsPopup-format']));

console.log('tsongaTranslationProgress: all strings translated');
