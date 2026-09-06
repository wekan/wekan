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
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 1624,
  'the first ten Southern Sotho batches stay resolved');

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
assert.deepEqual(tags(sesotho['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  sesotho['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.deepEqual(tokens(sesotho['card-comments-title']), ['%s']);
assert.equal(sesotho['mobile-mode'], 'Mokgwa wa selefouno');
assert.equal(sesotho['positiveVoteMembersPopup-title'], 'Batsehetsi');
assert.equal(sesotho['vote-question'], 'Potso ya kgetho');
assert.match(sesotho['poker-delete-pop'], /Planning Poker/);
assert.equal(sesotho['exportChecklistPopup-title'],
  'Ntsha lenane la tlhahlobo');
assert.equal(sesotho['cardType-linkedCard'], 'Karete e hoketsweng');
assert.match(sesotho['map-to-existing-user-desc'], /ditumello/);
assert.match(sesotho['font-preview-text'], /0123456789/);
assert.equal(sesotho['changeLanguagePopup-title'], 'Fetola puo');
assert.equal(sesotho['auto-list-width'], 'Bophara bo iketsang ba lenane');
assert.match(sesotho['card-aging-tier3'], /Mokgahlelo wa 3/);
assert.equal(sesotho['color-darkgreen'], 'botala bo lefifi');
assert.equal(sesotho['color-sky'], 'bolou ba lehodimo');
assert.equal(sesotho['read-only'], 'Ho bala feela');
assert.equal(sesotho['confirm-move-list-to-swimlane'],
  'Fallisetsa lenane lena le dikarete tsohle tsa lona tseleng e nngwe?');
assert.equal(JSON.parse(sesotho['copyManyCardsPopup-format']).length, 3);
assert.equal(sesotho['custom-field-currency'], 'Tjhelete');
assert.deepEqual(tokens(sesotho['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(sesotho['email-resetPassword-text']),
  ['__url__', '__user__']);
assert.match(sesotho['error-json-schema'], /JSON/);
assert.match(sesotho['error-import-empty-board'], /WeKan/);
assert.equal(sesotho['error-user-notAllowSelf'], 'O ke ke wa imema ka bowena');
assert.match(sesotho['export-card-excel-no-disk-space'], /Excel/);
assert.equal(sesotho['filter-overdue'], 'E fetilwe ke nako');
assert.equal(sesotho['filter-no-member'], 'Ha ho setho');

console.log('southernSothoTranslationProgress: first ten batches passed');
