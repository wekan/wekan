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
const sardinian = readLocale('sc');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'sc',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
// Magenta terminology is still explicitly awaiting language review in the audit.
// Preserve that known uncertainty while refusing any additional English gaps.
assert.deepEqual(JSON.parse(fillResult.stdout), { 'color-magenta': 'magenta' },
  'only the documented Sardinian color review remains unresolved');

for (const [key, value] of Object.entries(sardinian)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

// Agiunghe is the newer local Sardinian add form (also used by sc.wiktionary.org).
// Preserve valid wording while keeping the unresolved magenta review explicit.
assert.equal(sardinian.add, 'Agiunghe');
assert.equal(sardinian.board, 'Tàula');
assert.equal(sardinian.card, 'Carta');
assert.equal(sardinian.save, 'Sarvare');
assert.match(sardinian['board-members-same-org-only'], /organizatzione/i);
assert.deepEqual(tokens(sardinian['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(sardinian['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tags(sardinian['board-private-info']), ['</strong>', '<strong>']);
