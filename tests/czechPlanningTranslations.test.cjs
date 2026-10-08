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
  const en = read('en'), cs = read('cs');
  assert.deepEqual(Object.keys(cs), Object.keys(en));
  for (const key of Object.keys(en)) {
    assert.deepEqual(translationTokens(cs[key]), translationTokens(en[key]), key);
    if (/^(filter-recency-|filter-date-range-|filter-column-age|filter-preset|scrum-)/.test(key)
      && !['scrum-master', 'scrum-sprint'].includes(key)) {
      assert.ok(cs[key]?.trim(), key);
      assert.notEqual(cs[key], en[key], key);
    }
  }
  for (const key of ['r-trigger-vars-hint', 'r-vars-people-hint']) {
    assert.notEqual(cs[key], en[key], key);
    assert.deepEqual(cs[key].match(/\{[^{}]+\}/g), en[key].match(/\{[^{}]+\}/g), key);
  }
  assert.deepEqual(cs['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g),
    en['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g));
  assert.match(cs['advanced-filter-card-dates-hint'], /@endAt = none/);
  assert.match(cs['sync-planning-hint'], /První synchronizace nikdy neodstraňuje plánování/);
  assert.match(cs['scrum-import-card-on-another-board'], /zůstala beze změny/);
  assert.match(cs['scrum-import-into-board-hint'], /nikdy se neduplikují/);
  assert.match(cs['scrum-report-help'], /nejsou to nulové odhady/);
  assert.match(cs['scrum-daily-observations-help'], /nezaznamenávají každou změnu/);
  assert.match(cs['filter-column-age-hint'], /Úprava karty nevynuluje/);
  assert.match(cs['instance-desc'], /Nepřihlášeným se nikdy nezobrazuje/);
  assert.match(cs['instance-desc'], /pouze lidé přidaní k tablu/);
  assert.match(cs['board-instance-info'], /<strong>všechny přihlášené uživatele<\/strong>/);
  for (const scheme of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) {
    assert.equal(cs['automatic-linked-url-schemes-hint'].split(scheme).length - 1, 1, scheme);
  }
  for (const key of Object.keys(en).filter(key => /^(sync-|email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-)/.test(key))) {
    assert.ok(cs[key]?.trim(), key);
    assert.notEqual(cs[key], en[key], key);
  }
  assert.match(cs['sync-conflict-hint'], /Do zdrojového systému se nic neposílá/);
  assert.match(cs['activity-recovery-cancel-confirm'], /Nelze je znovu obnovit/);
  assert.match(cs['email-recovery-confirm-cancel'], /Nové zprávy.*zůstanou zachovány/);
  assert.notEqual(cs['move-selection-before'], cs['move-selection-after']);
  assert.equal(cs['blockly-SPACE_KEY'], 'Mezerník');
  assert.equal(cs['blockly-LOGIC_TERNARY_CONDITION'], 'podmínka');
  const inventory = spawnSync(process.execPath,
    ['releases/translations/fill-translations.mjs', '--completed-catalog', '--list', 'cs'],
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.equal(inventory.status, 0, inventory.stderr);
  assert.deepEqual(JSON.parse(inventory.stdout), {});
  for (const key of Object.keys(en).filter(key => key.startsWith('interrupted-import-'))) {
    assert.ok(cs[key]?.trim(), key);
    assert.notEqual(cs[key], en[key], `${key}: translate import recovery`);
  }
  assert.match(cs['interrupted-import-description'], /nelze pokračovat/);
  assert.match(cs['interrupted-import-description'], /včetně všeho, co bylo přidáno později/);
  assert.match(cs['interrupted-import-keep-confirm'], /Nic se neodstraní/);
  assert.match(cs['interrupted-import-discard-confirm'], /trvale odstraněny/);
  assert.match(cs['interrupted-import-truncated'], /50 nejstarších/);
  assert.match(cs['interrupted-import-foreign-board'], /nebylo změněno/);
  assert.match(cs['interrupted-import-state-discarding'], /opětovným odstraněním/);
  for (const key of currentKeys) {
    assert.ok(cs[key]?.trim(), key);
    assert.notEqual(cs[key], en[key], `${key}: translate current prose`);
  }
  for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
    assert.ok(cs['ldap-sync-now-nothing'].includes(name), name);
  }
  assert.match(cs['stuck-sync-operation-description'], /znovu porovná seznam s jeho zdrojem/);
  assert.match(cs['stuck-sync-operation-discard-confirm'], /provedené změny se zachovají/);
  assert.match(cs['stuck-sync-operation-discard-confirm'], /nikdy nezapíší/);
  assert.match(cs['stuck-sync-operation-replayable-now'], /nelze zahodit/);
  assert.match(cs['stuck-sync-operation-replayable'], /nebyla zahozena/);
  assert.match(cs['stuck-sync-operation-truncated'], /50 nejstarších/);
  assert.notEqual(cs['r-moved-forward'], cs['r-moved-back']);
  for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
    assert.ok(cs['import-board-instruction-orgmode'].includes(literal), literal);
  }
  for (const literal of ['@labels', 'p1', 'p3', 'CSV']) {
    assert.ok(cs['import-board-instruction-todoist'].includes(literal), literal);
  }
  for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) {
    assert.ok(cs['external-link-rules-description'].includes(literal), literal);
  }
  assert.ok(cs['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  console.log('Czech source keys, tokens, planning and recovery warning meanings verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
