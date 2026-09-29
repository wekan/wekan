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
  const inventory = spawnSync(process.execPath,
    ['releases/translations/fill-translations.mjs', '--list', 'id'], { cwd: root, encoding: 'utf8' });
  assert.equal(inventory.status, 0, inventory.stderr);
  assert.deepEqual(JSON.parse(inventory.stdout), {});
  // This suite covers the new batch and selected Malay-seeded labels.
  // The remaining older Indonesian strings still require a vocabulary audit.
  console.log('Indonesian source keys, tokens, new prose and corrected basic labels verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
