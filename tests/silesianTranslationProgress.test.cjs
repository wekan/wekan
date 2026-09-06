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
const silesian = readLocale('szl');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'szl',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Silesian value stays translated');

for (const [key, value] of Object.entries(silesian)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(silesian.accept, 'Akceptuj');
assert.equal(silesian.cancel, 'Pociep');
assert.equal(silesian.save, 'Spamiyntać');
assert.match(silesian['allboards.workspaces'], /roboty/);
assert.match(silesian['board-members-same-org-only'], /czōnkōw.*Ôrganizacyje/i);
assert.match(silesian['activity-changedTitle'], /%s.*%s/);
assert.match(silesian['act-deleteCard'],
  /__card__.*__list__.*__swimlane__.*__board__/);
assert.equal(silesian['board-public-info'],
  'Ta tabula bydzie <strong>publicznŏ</strong>.');

console.log('silesianTranslationProgress: complete locale passed');
