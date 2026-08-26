const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'jv'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1517);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const javanese = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/jv.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(javanese)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(javanese.accept, 'Tampani');
assert.deepEqual(tokens(javanese['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(javanese['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(javanese['act-addAttachment'], /lampiran/);
assert.match(javanese['act-createBoard'], /papan/);
assert.deepEqual(tokens(javanese['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.equal(javanese['allboards.workspaces'], 'Ruang kerja');
assert.equal(javanese['workspace-settings'], 'Setelan Ruang Kerja');
assert.equal(javanese['home-board-badge'],
  'Papan Ngarep (dibukak sawise mlebu)');
assert.match(javanese['list-width-error-message'], /270/);
assert.equal(javanese['add-checklist'], 'Tambah Dhaptar Priksa');
assert.deepEqual(tokens(javanese['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(javanese['board-private-info']),
  ['</strong>', '<strong>']);
assert.equal(javanese['board-not-found'], 'Papan ora ditemokake');
assert.deepEqual(tags(javanese['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  javanese['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.equal(javanese['card-due'], 'Tenggat');
assert.match(javanese['card-edit-planning-poker'], /Planning Poker/);
assert.equal(javanese['addBoardOrgPopup-title'], 'Tambah Organisasi');
assert.equal(javanese['importSwimlanePopup-title'], 'Impor swimlane');
assert.equal(javanese['userPopup-title'], 'Anggota');
assert.equal(javanese['map-to-existing-user-no-results'],
  'Ora ana pangguna sing cocog.');
assert.match(javanese['font-preview-text'], /0123456789/);
assert.equal(javanese['auto-list-width'], 'Ambane dhaptar otomatis');
assert.equal(javanese['move-card-up'], 'Pindhah kertu munggah');
assert.equal(javanese['color-red'], 'abang');
assert.equal(javanese['read-only'], 'Mung Waca');
assert.equal(javanese.worker, 'Buruh');
assert.equal(javanese['custom-field-number'], 'Wilangan');
assert.equal(javanese['date-format'], 'Format Tanggal');
assert.deepEqual(tokens(javanese['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.equal(javanese['error-list-doesNotExist'], 'Dhaptar iki ora ana');
assert.equal(javanese['export-card-pdf'], 'Ekspor kertu menyang PDF');
assert.equal(javanese['filter-due-tomorrow'], 'Tenggat sesuk');
assert.equal(javanese['filter-no-member'], 'Tanpa anggota');
assert.equal(javanese['advanced-filter-label'], 'Saringan Lanjut');
assert.deepEqual(tokens(javanese['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.equal(javanese['import-trello-failed'], 'Impor saka Trello gagal.');
assert.match(javanese['trello-api-key'], /https:\/\/trello.com\/app-key/);
assert.equal(javanese['importMapMembersAddPopup-title'], 'Pilih anggota');
assert.deepEqual(tokens(javanese['label-default']), ['%s']);
