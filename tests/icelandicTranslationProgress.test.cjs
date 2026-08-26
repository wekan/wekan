const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'is'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1467);

const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const icelandic = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/is.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(/__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)].map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(icelandic)) {
  if (value !== english[key]) assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(icelandic.accept, 'Samþykkja');
assert.deepEqual(tokens(icelandic['act-addChecklistItem']),
  ['__board__', '__card__', '__checklistItem__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(icelandic['act-createBoard'], 'bjó til töflu __board__');
assert.match(icelandic['act-addAttachment'], /viðhengi/);
assert.deepEqual(tokens(icelandic['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.equal(icelandic['allboards.workspaces'], 'Vinnusvæði');
assert.equal(icelandic['workspace-settings'], 'Stillingar vinnusvæðis');
assert.equal(icelandic['home-board-badge'],
  'Heimatafla (opnast eftir innskráningu)');
assert.equal(icelandic['set-list-width-value'], 'Breidd lista (dílar)');
assert.equal(icelandic['add-checklist'], 'Bæta við gátlista');
assert.deepEqual(tokens(icelandic['and-n-other-card']), ['__count__']);
assert.equal(icelandic['board-not-found'], 'Tafla fannst ekki');
assert.deepEqual(tags(icelandic['board-private-info']), ['</strong>', '<strong>']);
assert.deepEqual(tags(icelandic['board-public-info']), ['</strong>', '<strong>']);
assert.deepEqual(tokens(icelandic['board-open-and-move-between-remaining-and-workspaces']),
  ['__workspaces__']);
assert.equal(icelandic['card-due'], 'Skilafrestur');
assert.match(icelandic['card-edit-planning-poker'], /Planning Poker/);
assert.equal(icelandic['addBoardOrgPopup-title'], 'Bæta við stofnun');
assert.equal(icelandic['importSwimlanePopup-title'], 'Flytja inn sundbraut');
assert.equal(icelandic['userPopup-title'], 'Meðlimur');
assert.equal(icelandic['map-to-existing-user-no-results'],
  'Engir samsvarandi notendur fundust.');
assert.equal(icelandic['changePermissionsPopup-title'], 'Breyta heimildum');
assert.equal(icelandic['auto-list-width'], 'Sjálfvirk listabreidd');
assert.equal(icelandic['move-card-up'], 'Færa spjald upp');
assert.equal(icelandic['color-sky'], 'himinblár');
assert.equal(icelandic['comment-only'], 'Aðeins athugasemdir');
assert.equal(icelandic['copy-link-to-clipboard'], 'Afrita tengil á klemmuspjald');
assert.equal(icelandic['custom-field-number'], 'Tala');
assert.equal(icelandic['custom-field-text'], 'Texti');
assert.deepEqual(tokens(icelandic['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.equal(icelandic['error-list-doesNotExist'], 'Þessi listi er ekki til');
assert.equal(icelandic['export-card'], 'Flytja spjald út');
assert.equal(icelandic['filter-due-tomorrow'], 'Skil á morgun');
assert.equal(icelandic['filter-assignee-label'], 'Sía eftir ábyrgðaraðila');
assert.deepEqual(tokens(icelandic['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.equal(icelandic['import-trello-zip-too-large'],
  '.zip-skráin er of stór til innflutnings.');
assert.equal(icelandic['trello-import-progress'], 'Framvinda innflutnings');
assert.equal(icelandic['label-default'], '%s merki (sjálfgefið)');
assert.deepEqual(tokens(icelandic['label-default']), ['%s']);
assert.deepEqual(tokens(icelandic['leave-board-pop']), ['__boardTitle__']);
assert.equal(icelandic['multi-selection'], 'Fjölval');
assert.equal(icelandic['no-archived-swimlanes'], 'Engar sundbrautir í safni.');
