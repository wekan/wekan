// Guard both full current Malay catalogs and warning meanings.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
for (const language of ['ms-MY', 'ms']) {
  const result = spawnSync(process.execPath, [fillScript, '--list', language], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  const locale = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
  const cards = JSON.parse(locale['copyManyCardsPopup-format']);
  assert.equal(cards.length, 3);
  assert.equal(cards[0].title, 'Tajuk kad pertama');
  assert.equal(locale['select-none'], 'Jangan pilih apa-apa');
  assert.equal(locale.status, 'Keadaan');
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const read = code => JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${code}.i18n.json`), 'utf8'));
  const en = read('en');
  for (const code of ['ms', 'ms-MY']) {
    const data = read(code);
    assert.deepEqual(Object.keys(data), Object.keys(en), code);
    for (const key of Object.keys(en)) assert.deepEqual(translationTokens(data[key]), translationTokens(en[key]), `${code}:${key}`);
    assert.match(data['custom-field-links-hint'], /nama dan jenis yang sama pada kedua-dua kad/);
    assert.match(data['custom-field-links-hint'], /hanya ada pada satu kad dibiarkan tanpa perubahan/);
    assert.match(data['custom-field-link-inactive'], /tidak lagi boleh menyunting kedua-dua kad.*diarkibkan/);
    assert.match(data['custom-field-link-both'], /Dua hala.*mana-mana kad/);
    assert.match(data['custom-field-link-send'], /Sehala.*kad utama/);
    assert.match(data['field-link-not-allowed'], /menyunting kedua-dua kad/);
    assert.equal(data['import-members-mode-me'], 'Gantikan semuanya dengan saya');
    assert.match(data['import-many-boards-hint'], /tanpa pemetaan ahli/);
    assert.match(data['import-many-boards-hint'], /satu eksport lengkap.*menjadi satu papan/);
    assert.match(data['export-all-boards-hint'], /boleh anda eksport.*buku kerja.*\.zip/);
    assert.match(data['webhook-payload-description'], /mengekalkan tetapan yang diwarisi/);
    assert.match(data['notification-delivery-quiet'], /tunggu sehingga tamat/);
    assert.match(data['r-wrike-workflow-note'], /sebagai selesai.*Completed.*Cancelled.*belum selesai.*Active.*Deferred/);
    assert.match(data['interrupted-import-description'], /tidak boleh diteruskan kerana fail sumbernya tidak disimpan/);
    assert.match(data['interrupted-import-description'], /termasuk apa-apa yang ditambah selepas itu/);
    assert.match(data['interrupted-import-keep-confirm'], /Tiada apa-apa dipadam/);
    assert.match(data['interrupted-import-discard-confirm'], /seluruh kandungannya dipadam secara kekal/);
    assert.match(data['stuck-sync-operation-discard-confirm'], /telah digunakan dikekalkan.*tidak akan ditulis/);
    assert.match(data['stuck-sync-operation-replayable-now'], /tidak boleh dibuang/);
    assert.match(data['login-setting-env-only'], /hanya ditentukan oleh persekitaran pelayan.*baca sahaja/);
    for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) assert.ok(data['r-wrike-workflow-note'].includes(literal), literal);
    for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(data['import-board-instruction-orgmode'].includes(literal), literal);
    for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(data['ldap-sync-now-nothing'].includes(literal), literal);
    assert.ok(data['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
    assert.ok(data['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
    assert.notEqual(data['subtask-mark-done'], data['subtask-mark-not-done']);
  }
  console.log('Malay: full current catalogs, tokens, field directions and recovery meanings pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
