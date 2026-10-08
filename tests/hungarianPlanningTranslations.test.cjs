// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
const currentKeys = [
  "board-announcement",
  "board-announcement-enabled",
  "cards-use-list-color",
  "import-board-instruction-opml",
  "import-board-instruction-orgmode",
  "import-board-instruction-todoist",
  "external-link-rules",
  "external-link-rules-description",
  "external-link-identifier-aliases",
  "read-only-field",
  "r-moved-forward",
  "r-moved-back",
  "r-assignee",
  "r-add-actinguser-assignee",
  "r-remove-all-assignees",
  "ldap-sync-now",
  "ldap-sync-now-done",
  "ldap-sync-now-error",
  "ldap-sync-now-nothing",
  "oauth-providers-allowed-email-domains",
  "login-setting-env-only",
  "stuck-sync-operation-heading",
  "stuck-sync-operation-description",
  "stuck-sync-operation-list",
  "stuck-sync-operation-progress",
  "stuck-sync-operation-reason",
  "stuck-sync-operation-applied",
  "stuck-sync-operation-reason-scope-changed",
  "stuck-sync-operation-reason-access-denied",
  "stuck-sync-operation-reason-trigger-unknown",
  "stuck-sync-operation-reason-intent-missing",
  "stuck-sync-operation-reason-unknown",
  "stuck-sync-operation-replayable-now",
  "stuck-sync-operation-discard",
  "stuck-sync-operation-discard-confirm",
  "stuck-sync-operation-refresh",
  "stuck-sync-operation-empty",
  "stuck-sync-operation-truncated",
  "stuck-sync-operation-unavailable",
  "stuck-sync-operation-missing",
  "stuck-sync-operation-not-stuck",
  "stuck-sync-operation-replayable",
  "stuck-sync-operation-busy",
  "stuck-sync-operation-failed"
];

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = read('en'), hu = read('hu');
  assert.match(hu['scrum-import-into-board-hint'], /soha nem duplikálódnak/);
  assert.match(hu['scrum-import-card-on-another-board'], /változatlan maradt/);
  assert.match(hu['sync-planning-hint'], /először a forrásbeli azonosító, majd a név/);
  assert.match(hu['sync-planning-hint'], /Az első szinkronizálás soha nem távolítja el a tervezést/);

  assert.deepEqual(Object.keys(hu), Object.keys(en));
  for (const key of Object.keys(en)) {
    assert.deepEqual(translationTokens(hu[key]), translationTokens(en[key]), key);
    if (/^(filter-recency-|filter-date-range-|filter-column-age|filter-preset|notification-activity-|auto-archive-|due-reminder-)/.test(key)) {
      assert.ok(hu[key]?.trim(), key);
      assert.notEqual(hu[key], en[key], key);
    }
  }
  for (const key of ['r-trigger-vars-hint', 'r-vars-people-hint']) {
    assert.notEqual(hu[key], en[key], key);
    assert.deepEqual(hu[key].match(/\{[^{}]+\}/g), en[key].match(/\{[^{}]+\}/g), key);
  }
  assert.deepEqual(hu['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g),
    en['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g));
  assert.match(hu['advanced-filter-card-dates-hint'], /@endAt = none/);
  assert.match(hu['filter-column-age-hint'], /nem nullázza/);
  assert.match(hu['instance-desc'], /be nem jelentkezett személyeknek soha/);
  assert.match(hu['instance-desc'], /Csak a táblához hozzáadott személyek/);
  assert.match(hu['board-instance-info'], /<strong>minden bejelentkezett felhasználó<\/strong>/);
  assert.match(hu['notification-activity-description'], /@említések mindig megérkeznek/);
  assert.match(hu['auto-archive-hint'], /óránként.*sablonok soha.*hagyja üresen/);
  assert.notEqual(hu['dependency-type-duplicates'], hu['dependency-type-is-duplicated-by']);
  for (const scheme of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) {
    assert.equal(hu['automatic-linked-url-schemes-hint'].split(scheme).length - 1, 1, scheme);
  }
  for (const key of Object.keys(en).filter(key => key.startsWith('scrum-'))) {
    if (['scrum-master', 'scrum-sprint'].includes(key)) continue;
    assert.ok(hu[key]?.trim(), key);
    assert.notEqual(hu[key], en[key], key);
  }
  assert.match(hu['scrum-report-help'], /nem nulla értékű becslések/);
  assert.match(hu['scrum-daily-observations-help'], /nem rögzítenek minden változást/);
  assert.match(hu['scrum-confirm-cancel'], /hozzárendelve maradnak/);
  assert.match(hu['scrum-added'], /sprint feladataihoz/);
  assert.match(hu['scrum-removed'], /sprint feladatai közül/);
  assert.notEqual(hu['scrum-category-todo'], hu['scrum-category-done']);
  for (const key of Object.keys(en).filter(key => /^(sync-|email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-)/.test(key))) {
    assert.ok(hu[key]?.trim(), key);
    assert.notEqual(hu[key], en[key], key);
  }
  assert.match(hu['sync-conflict-hint'], /Semmi nem kerül elküldésre a forrásrendszerbe/);
  assert.match(hu['activity-recovery-cancel-confirm'], /Ezek nem folytathatók/);
  assert.match(hu['email-recovery-confirm-cancel'], /új üzenetek megmaradnak/);
  assert.match(hu['sync-time-estimate-hint'], /kifejezett null pedig törli/);
  assert.notEqual(hu['move-selection-before'], hu['move-selection-after']);
  const inventory = spawnSync(process.execPath,
    ['releases/translations/fill-translations.mjs', '--completed-catalog', '--list', 'hu'],
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.equal(inventory.status, 0, inventory.stderr);
  assert.deepEqual(JSON.parse(inventory.stdout), {});
  for (const key of Object.keys(en).filter(key => key.startsWith('interrupted-import-'))) {
    assert.ok(hu[key]?.trim(), key);
    assert.notEqual(hu[key], en[key], `${key}: translate import recovery`);
  }
  assert.match(hu['interrupted-import-description'], /nem folytatható/);
  assert.match(hu['interrupted-import-description'], /beleértve az azóta hozzáadott elemeket is/);
  assert.match(hu['interrupted-import-keep-confirm'], /Semmi sem törlődik/);
  assert.match(hu['interrupted-import-discard-confirm'], /véglegesen törlődik/);
  assert.match(hu['interrupted-import-truncated'], /50 legrégebbi/);
  assert.match(hu['interrupted-import-foreign-board'], /nem módosult/);
  assert.match(hu['interrupted-import-state-discarding'], /törölje újra/);
  for (const key of currentKeys) {
    assert.ok(hu[key]?.trim(), key);
    assert.notEqual(hu[key], en[key], `${key}: translate current prose`);
  }
  for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
    assert.ok(hu['ldap-sync-now-nothing'].includes(name), name);
  }
  assert.match(hu['stuck-sync-operation-description'], /újra összehasonlítja a listát a forrásával/);
  assert.match(hu['stuck-sync-operation-discard-confirm'], /alkalmazott módosítások megmaradnak/);
  assert.match(hu['stuck-sync-operation-discard-confirm'], /soha nem lesz kiírva/);
  assert.match(hu['stuck-sync-operation-replayable-now'], /nem vethető el/);
  assert.match(hu['stuck-sync-operation-replayable'], /nem lett elvetve/);
  assert.match(hu['stuck-sync-operation-truncated'], /50 legrégebbi/);
  assert.match(hu['login-setting-env-only'], /csak a kiszolgálói környezet/);
  assert.match(hu['login-setting-env-only'], /csak olvashatóként/);
  assert.notEqual(hu['r-moved-forward'], hu['r-moved-back']);
  for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
    assert.ok(hu['import-board-instruction-orgmode'].includes(literal), literal);
  }
  for (const literal of ['@labels', 'p1', 'p3', 'CSV']) {
    assert.ok(hu['import-board-instruction-todoist'].includes(literal), literal);
  }
  for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) {
    assert.ok(hu['external-link-rules-description'].includes(literal), literal);
  }
  assert.ok(hu['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  console.log('Hungarian source keys, tokens, planning and recovery warning meanings verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
