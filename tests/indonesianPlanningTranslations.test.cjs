// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = read('en'), id = read('id');
  assert.deepEqual(Object.keys(id), Object.keys(en));
  for (const key of Object.keys(en)) {
    assert.deepEqual(translationTokens(id[key]), translationTokens(en[key]), key);
  }
  for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
    'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
    'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after', 'draggable']) {
    assert.ok(id[key]?.trim(), key);
    assert.notEqual(id[key], en[key], key);
    assert.doesNotMatch(id[key], /\b(?:kad|senarai|tetapan|akaun)\b/i, key);
  }
  assert.equal(id.card, 'Kartu');
  assert.equal(id.list, 'Daftar');
  assert.equal(id['my-cards'], 'Kartu Saya');
  assert.equal(id.displayName, 'Nama Tampilan');
  assert.equal(id.website, 'Situs Web');
  assert.equal(id['myCardsViewChange-choice-table'], 'Tabel');
  assert.equal(id['move-selection-before'], 'Sebelum');
  assert.equal(id['move-selection-after'], 'Sesudah');
  assert.match(id['scrum-report-help'], /bukan estimasi nol/);
  assert.match(id['sync-conflict-hint'], /Tidak ada yang dikirim ke sistem sumber/);
  assert.match(id['activity-recovery-cancel-confirm'], /tidak dapat dilanjutkan/);
  for (const [key, value] of Object.entries(id)) {
    assert.doesNotMatch(value, /\b(?:kad|senarai|tetapan|akaun|arkib|papar|paparan|sahaja|tiada|ditemui|semula|lalai|sesawang|jadual|ubahsuai|disekat|kebenaran|sila|pautan|fail|baharu|emel|tarikh|kerana|padam|katalaluan|ralat|butang|tajuk|penerangan|ruangan|ahli|pasukan|tapis|mengikut|nombor|dayakan|didayakan|pelayan|semasa|menghantar|berjaya|kekal|kandungan|carian|capaian|suapan|maklumbalas|togol|muatnaik|seterusnya|kemaskini)\b/i, key);
  }
  assert.match(id['read-only-desc'], /Tidak dapat menyunting/);
  assert.match(id['read-assigned-only-desc'], /Hanya kartu yang ditugaskan/);
  assert.match(id['custom-field-delete-pop'], /tidak dapat diurungkan/);
  assert.match(id['globalSearch-instructions-notes-4'], /tidak membedakan huruf besar dan kecil/);
  assert.match(id['enable-vertical-scrollbars'], /vertikal/);
  assert.match(id['keyboard-shortcuts-enabled'], /diaktifkan/);
  assert.match(id['keyboard-shortcuts-disabled'], /dinonaktifkan/);
  assert.notEqual(id['keyboard-shortcuts-enabled'], id['keyboard-shortcuts-disabled']);
  assert.match(id['r-d-move-to-top-spec'], /atas daftar/);
  assert.match(id['r-d-move-to-bottom-spec'], /bawah daftar/);
  assert.notEqual(id['r-d-move-to-top-spec'], id['r-d-move-to-bottom-spec']);
  assert.match(id['flow-note-agingWip'], /persentil ke-85.*lima/);
  assert.match(id['flow-note-sizeCycleTime'], /tanggal yang tidak valid diabaikan/);
  assert.equal(id['poker-eight'], en['poker-eight']);
  assert.equal(id['poker-oneHundred'], en['poker-oneHundred']);
  assert.equal(id.hours, 'jam');
  assert.equal(id['assigned-by'], 'Ditugaskan Oleh');
  assert.match(id['board-archived'], /^Papan/);
  assert.doesNotMatch(id['board-archived'], /Kartu/);
  assert.equal(id['board-private-info'], 'Papan ini akan bersifat <strong>pribadi</strong>.');
  assert.equal(id['board-public-info'], 'Papan ini akan bersifat <strong>publik</strong>.');
  assert.match(id['list-move-cards'], /dalam daftar ini/);
  assert.doesNotMatch(id['list-move-cards'], /ke daftar ini/);
  assert.match(id['filter-due-tomorrow'], /Jatuh tempo besok/);
  assert.match(id['time-adjustment-note'], /bukan sesi kerja individual.*Nilai negatif adalah koreksi/);
  assert.match(id['time-adjustment-note'], /tidak tercatat tidak dapat dikaitkan/);
  assert.match(id['email-invite-subject'], /__inviter__ mengirimkan undangan/);
  for (const key of ['cardStartPlanningPokerPopup-title', 'card-edit-planning-poker',
    'poker-question', 'deletePokerPopup-title']) {
    assert.match(id[key], /perencanaan/i, key);
    assert.doesNotMatch(id[key], /perancangan/i, key);
  }
  const inventory = spawnSync(process.execPath,
    ['releases/translations/fill-translations.mjs', '--completed-catalog', '--list', 'id'], { cwd: root, encoding: 'utf8' });
  assert.equal(inventory.status, 0, inventory.stderr);
  assert.deepEqual(JSON.parse(inventory.stdout), {});
  // Vocabulary guards cover reviewed Malay seed words; they do not prove
  // fluency or replace review of the remaining shared-script vocabulary.
  console.log('Indonesian source keys, tokens, new prose and corrected basic labels verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
