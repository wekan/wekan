const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'iu'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1917);

const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const inuktitut = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/iu.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(/__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)].map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(inuktitut)) {
  if (value !== english[key]) assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(inuktitut.accept, 'ᐊᖏᖅᐸᕋ');
assert.equal(inuktitut.board, 'ᐊᓪᓚᕕᒃ');
assert.equal(inuktitut.card, 'ᐊᓪᓚᖅᓯᒪᔪᖅ');
assert.equal(inuktitut.list, 'ᑎᑎᖅᑲᓕᐊᖅ');
assert.equal(inuktitut.swimlane, 'ᐊᖅᑯᑎ');
assert.deepEqual(tokens(inuktitut['act-addChecklistItem']),
  ['__board__', '__card__', '__checklistItem__', '__checklist__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(inuktitut['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(inuktitut['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.equal(inuktitut['allboards.workspaces'], 'ᐱᓕᕆᕖᑦ');
assert.equal(inuktitut['workspace-settings'], 'ᐱᓕᕆᕕᐅᑉ ᐋᖅᑭᒃᓯᒪᓂᖏᑦ');
assert.equal(inuktitut['home-board-badge'],
  'ᐊᖏᕐᕋᒥ ᐊᓪᓚᕕᒃ (ᐃᓯᕐᓂᐅᑉ ᑭᖑᓂᐊᒍᑦ ᒪᑐᐃᖅᑐᖅ)');
assert.equal(inuktitut['set-list-width-value'],
  'ᑎᑎᖅᑲᓕᐊᑉ ᓴᓂᒧᑦ ᐊᖏᓂᖓ (pixels)');
assert.equal(inuktitut['add-checklist'], 'ᓇᓗᓇᐃᖅᓯᕕᒻᒥᒃ ᐃᓚᓯᓗᑎᑦ');
assert.deepEqual(tokens(inuktitut['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(inuktitut['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(inuktitut['board-private-info']), ['</strong>', '<strong>']);
assert.equal(inuktitut['board-not-found'], 'ᐊᓪᓚᕕᒃ ᓇᓂᔭᐅᖏᑦᑐᖅ');
assert.deepEqual(tags(inuktitut['board-public-info']), ['</strong>', '<strong>']);
assert.deepEqual(tokens(inuktitut['board-open-and-move-between-remaining-and-workspaces']),
  ['__workspaces__']);
assert.equal(inuktitut['card-due'], 'ᐱᔭᕇᕐᕕᐅᔪᒃᓴᖅ');
