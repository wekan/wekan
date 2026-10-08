// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
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
const akan = readLocale('ak');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--completed-catalog', '--list',
  'ak',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Akan value stays translated');

for (const [key, value] of Object.entries(akan)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(akan.accept, 'Gye tom');
assert.equal(akan.cancel, 'Gyae');
assert.equal(akan.save, 'Sie');
assert.match(akan['act-deleteCard'], /pepaae kaad/);
assert.deepEqual(tokens(akan['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
// The organization noun now occurs inside the sentence, in lowercase.
assert.match(akan['board-members-same-org-only'], /ahyehyɛde/i);
assert.match(akan['due-date-changes'], /Awiei da/);

console.log('akanTranslationProgress: complete locale passed');
