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
const sesotho = readLocale('st');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'st',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 1974,
  'the first three Southern Sotho batches stay resolved');

for (const [key, value] of Object.entries(sesotho)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.deepEqual(tokens(sesotho['act-moveCard']),
  ['__board__', '__card__', '__list__', '__oldList__', '__oldSwimlane__',
    '__swimlane__']);
assert.deepEqual(tokens(sesotho['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(sesotho['allboards.workspaces'], 'Dibaka tsa mosebetsi');
assert.equal(sesotho.actions, 'Diketso');
assert.equal(sesotho['allboards.workspace-color'], 'Mmala');
assert.deepEqual(tokens(sesotho['activity-dueDate']), ['%s', '%s']);
assert.equal(sesotho['fixed-list-width'],
  'Bophara bo tshwanang bakeng sa manane ohle');
assert.equal(sesotho['add-members'], 'Eketsa ditho');
assert.deepEqual(tokens(sesotho['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(sesotho['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(sesotho['board-private-info']),
  ['</strong>', '<strong>']);
assert.equal(sesotho['board-not-found'], 'Boto ha e a fumanwa');

console.log('southernSothoTranslationProgress: first three batches passed');
