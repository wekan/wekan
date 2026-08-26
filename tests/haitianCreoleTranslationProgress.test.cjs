const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ht'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1517);

const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const creole = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/ht.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(/__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)].map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(creole)) {
  if (value !== english[key]) assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(creole.accept, 'Aksepte');
assert.match(creole['act-createBoard'], /tablo/i);
assert.match(creole['act-createCard'], /kat/i);
assert.deepEqual(tokens(creole['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(creole['act-moveCard']),
  ['__board__', '__card__', '__list__', '__oldList__', '__oldSwimlane__', '__swimlane__']);
assert.equal(creole['allboards.workspaces'], 'Espas travay');
assert.equal(creole['home-board-badge'], 'Tablo Akèy (ouvri apre koneksyon)');
assert.equal(creole['set-list-width-value'], 'Lajè lis (piksèl)');
assert.deepEqual(tokens(creole['and-n-other-card']), ['__count__']);
assert.deepEqual(tags(creole['board-private-info']), ['</strong>', '<strong>']);
assert.equal(creole['board-not-found'], 'Tablo pa jwenn');
assert.deepEqual(tags(creole['board-public-info']), ['</strong>', '<strong>']);
assert.deepEqual(tokens(creole['board-open-and-move-between-remaining-and-workspaces']),
  ['__workspaces__']);
assert.equal(creole['card-due'], 'Dat limit');
assert.equal(creole['vote-for-it'], 'pou li');
assert.match(creole['card-edit-planning-poker'], /Planning Poker/);
assert.equal(creole['importSwimlanePopup-title'], 'Enpòte kouloir');
assert.equal(creole['userPopup-title'], 'Manm');
assert.equal(creole['map-to-existing-user-no-results'],
  'Pa jwenn okenn itilizatè ki koresponn.');
assert.equal(creole['changePermissionsPopup-title'], 'Chanje otorizasyon');
assert.equal(creole['auto-list-width'], 'Lajè otomatik lis');
assert.equal(creole['move-card-up'], 'Deplase kat anlè');
assert.equal(creole['color-sky'], 'ble syèl');
assert.equal(creole['comment-only'], 'Kòmantè sèlman');
assert.equal(creole['copy-link-to-clipboard'], 'Kopye lyen nan papye-presse');
assert.equal(creole['custom-field-number'], 'Nimewo');
assert.equal(creole['custom-field-text'], 'Tèks');
assert.deepEqual(tokens(creole['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.equal(creole['error-list-doesNotExist'], 'Lis sa a pa egziste');
assert.equal(creole['export-card'], 'Ekspòte kat');
assert.equal(creole['filter-overdue'], 'Anreta');
assert.equal(creole['filter-no-member'], 'San manm');
assert.equal(creole['filter-assignee-label'], 'Filtre pa moun ki asiyen');
assert.deepEqual(tokens(creole['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.equal(creole['import-trello-zip-too-many-files'],
  '.zip la gen twòp fichye pou enpòte.');
assert.equal(creole['trello-import-progress'], 'Pwogrè enpòtasyon');
assert.equal(creole['invalid-year'],
  'Ane pa valab. Tanpri tape tout kat chif yo, pa egzanp 2026.');
assert.deepEqual(tokens(creole['label-default']), ['%s']);
