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
  const en = read('en'), sk = read('sk');
  assert.deepEqual(Object.keys(sk), Object.keys(en));
  for (const key of Object.keys(en)) {
    assert.deepEqual(translationTokens(sk[key]), translationTokens(en[key]), key);
    if (/^(filter-recency-|filter-date-range-|filter-column-age|filter-preset|scrum-)/.test(key)
      && key !== 'scrum-master') {
      assert.ok(sk[key]?.trim(), key);
      assert.notEqual(sk[key], en[key], key);
    }
  }
  for (const key of ['r-trigger-vars-hint', 'r-vars-people-hint']) {
    assert.notEqual(sk[key], en[key], key);
    assert.deepEqual(sk[key].match(/\{[^{}]+\}/g), en[key].match(/\{[^{}]+\}/g), key);
  }
  assert.deepEqual(sk['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g),
    en['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g));
  assert.match(sk['advanced-filter-card-dates-hint'], /@endAt = none/);
  assert.match(sk['sync-planning-hint'], /Prvá synchronizácia nikdy neodstraňuje plánovanie/);
  assert.match(sk['scrum-import-card-on-another-board'], /zostala bez zmeny/);
  assert.match(sk['scrum-import-into-board-hint'], /nikdy sa neduplikujú/);
  assert.match(sk['scrum-report-help'], /nie sú to nulové odhady/);
  assert.match(sk['scrum-daily-observations-help'], /nezaznamenávajú každú zmenu/);
  assert.match(sk['filter-column-age-hint'], /Úprava karty nevynuluje/);
  assert.match(sk['instance-desc'], /Neprihláseným sa nikdy nezobrazuje/);
  assert.match(sk['instance-desc'], /iba ľudia pridaní na nástenku/);
  assert.match(sk['board-instance-info'], /<strong>všetkých prihlásených používateľov<\/strong>/);
  assert.equal(sk['scrum-sprint'], 'Šprint');
  assert.notEqual(sk['scrum-category-todo'], sk['scrum-category-done']);
  for (const scheme of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) {
    assert.equal(sk['automatic-linked-url-schemes-hint'].split(scheme).length - 1, 1, scheme);
  }
  for (const key of Object.keys(en).filter(key => /^(sync-|email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-|notification-activity-)/.test(key))) {
    assert.ok(sk[key]?.trim(), key);
    assert.notEqual(sk[key], en[key], key);
  }
  assert.match(sk['sync-conflict-hint'], /Do zdrojového systému sa nič neposiela/);
  assert.match(sk['activity-recovery-cancel-confirm'], /Nedá sa znova obnoviť/);
  assert.match(sk['email-recovery-confirm-cancel'], /Nové správy.*zostanú zachované/);
  assert.match(sk['notification-activity-description'], /Pripomenutia termínov a @zmienky prichádzajú vždy/);
  assert.notEqual(sk['move-selection-before'], sk['move-selection-after']);
  assert.equal(sk['blockly-LOGIC_TERNARY_CONDITION'], 'podmienka');
  const inventory = spawnSync(process.execPath,
    ['releases/translations/fill-translations.mjs', '--completed-catalog', '--list', 'sk'],
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.equal(inventory.status, 0, inventory.stderr);
  assert.deepEqual(JSON.parse(inventory.stdout), {});
  for (const key of Object.keys(en).filter(key => key.startsWith('interrupted-import-'))) {
    assert.ok(sk[key]?.trim(), key);
    assert.notEqual(sk[key], en[key], `${key}: translate import recovery`);
  }
  assert.match(sk['interrupted-import-description'], /nemožno pokračovať/);
  assert.match(sk['interrupted-import-description'], /vrátane všetkého, čo bolo pridané neskôr/);
  assert.match(sk['interrupted-import-keep-confirm'], /Nič sa neodstráni/);
  assert.match(sk['interrupted-import-discard-confirm'], /natrvalo odstránené/);
  assert.match(sk['interrupted-import-truncated'], /50 najstarších/);
  assert.match(sk['interrupted-import-foreign-board'], /nebola zmenená/);
  assert.match(sk['interrupted-import-state-discarding'], /opätovným odstránením/);
  for (const key of currentKeys) {
    assert.ok(sk[key]?.trim(), key);
    assert.notEqual(sk[key], en[key], `${key}: translate current prose`);
  }
  for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
    assert.ok(sk['ldap-sync-now-nothing'].includes(name), name);
  }
  assert.match(sk['stuck-sync-operation-description'], /znova porovná zoznam s jeho zdrojom/);
  assert.match(sk['stuck-sync-operation-discard-confirm'], /vykonané zmeny sa zachovajú/);
  assert.match(sk['stuck-sync-operation-discard-confirm'], /nikdy nezapíšu/);
  assert.match(sk['stuck-sync-operation-replayable-now'], /nemožno zahodiť/);
  assert.match(sk['stuck-sync-operation-replayable'], /nebola zahodená/);
  assert.match(sk['stuck-sync-operation-truncated'], /50 najstarších/);
  assert.notEqual(sk['r-moved-forward'], sk['r-moved-back']);
  for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
    assert.ok(sk['import-board-instruction-orgmode'].includes(literal), literal);
  }
  for (const literal of ['@labels', 'p1', 'p3', 'CSV']) {
    assert.ok(sk['import-board-instruction-todoist'].includes(literal), literal);
  }
  for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) {
    assert.ok(sk['external-link-rules-description'].includes(literal), literal);
  }
  assert.ok(sk['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  console.log('Slovak source keys, tokens, notification and recovery warning meanings verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
