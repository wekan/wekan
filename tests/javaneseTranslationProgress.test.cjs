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
assert.equal(Object.keys(remaining).length, 717);

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
assert.deepEqual(tokens(javanese['leave-board-pop']), ['__boardTitle__']);
assert.equal(javanese.calendar, 'Tanggalan');
assert.equal(javanese['multi-selection'], 'Pilihan Akeh');
assert.deepEqual(tokens(javanese['page-maybe-private']), ['%s']);
assert.deepEqual(tags(javanese['page-maybe-private']),
  ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(javanese['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.equal(javanese.team, 'Tim Kerja');
assert.equal(javanese['upload-completed'], 'Unggahan rampung');
assert.equal(javanese['welcome-board'], 'Papan Sugeng Rawuh');
assert.equal(javanese['attachment-limit-mode-unlimited'], 'Tanpa wates');
assert.deepEqual(tokens(javanese['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.equal(javanese.Database, 'Basis data');
assert.match(javanese.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.equal(javanese.OS_Cpus, 'Cacah CPU OS');
assert.match(javanese['org-domains-description'], /MULTITENANCY=true/);
assert.deepEqual(tokens(javanese['default-subtasks-board']), ['__board__']);
assert.equal(javanese['attachment-count'], 'Cacah lampiran');
assert.deepEqual(tokens(javanese['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(javanese['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(javanese['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(javanese['r-import-done']), ['__count__']);
assert.deepEqual(tokens(javanese['r-import-unmapped']), ['__count__']);
assert.equal(javanese['r-schedule-weekday'], 'Saben dina kerja (Sen–Jum)');
assert.equal(javanese['r-mark-complete'], 'Tandhani kertu rampung');
assert.equal(javanese['r-unarchive'], 'Balekake saka Arsip');
assert.equal(javanese['r-check-all'], 'Centhang kabeh');
assert.equal(javanese['r-d-move-to-top-gen'],
  'Pindhah kertu menyang ndhuwur dhaptare');
assert.equal(javanese['r-create-card'], 'Gawe kertu anyar');
assert.match(javanese['r-items-list'], /item1,item2,item3/);
assert.equal(javanese['custom-head-manifest-content'],
  'Isi manifest web kustom (JSON)');
assert.deepEqual(tags(javanese['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tokens(javanese['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(javanese['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.match(javanese['submit-on-enter-description'], /Shift\+Enter/);
assert.equal(javanese['roles-status-sees-assigned'], 'Mung sing ditugasake');
assert.equal(javanese.monday, 'Senin');
assert.equal(javanese['create-task'], 'Gawe Tugas');
assert.equal(javanese['globalSearchViewChange-choice-me'], 'Kertu kula');
assert.deepEqual(tokens(javanese['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(javanese['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(javanese['operator-board'], 'papan');
assert.equal(javanese['predicate-overdue'], 'kliwat-tenggat');
assert.deepEqual(tokens(javanese['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tags(javanese['globalSearch-instructions-operator-board']),
  ['<title>', '<title>']);
assert.deepEqual(tokens(javanese['globalSearch-instructions-operator-has']),
  ['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
    '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
    '__predicate_end__', '__predicate_member__', '__predicate_start__']);
assert.deepEqual(tokens(javanese['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(javanese['background-too-big']), ['{{size}}']);
assert.equal(javanese['location-open-map'], 'Bukak ing peta');
