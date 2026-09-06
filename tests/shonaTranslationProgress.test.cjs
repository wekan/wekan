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
const shona = readLocale('sn');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%\d+\$[A-Za-z]|%\{[A-Za-z0-9]+\}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'sn',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Shona value stays translated');

for (const [key, value] of Object.entries(shona)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(shona.accept, 'gamuchira');
assert.match(shona['enable-permanent-delete'], /dzima zvachose/);
assert.match(shona['enable-permanent-delete-description'], /hakudzimi chinhu/);
assert.equal(shona['select-none'], 'Usasarudza chinhu');
assert.deepEqual(tokens(shona['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);

console.log('shonaTranslationProgress: complete locale passed');
