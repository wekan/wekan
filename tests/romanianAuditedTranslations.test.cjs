// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const i18next = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const records = read('releases/translations/audited-corrections.json');
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
  "stuck-sync-operation-failed",
  "scrum-release-scope",
  "scrum-releases-select-help",
  "scrum-import-into-board",
  "scrum-import-into-board-hint",
  "scrum-import-preview",
  "scrum-import-choose-file",
  "scrum-import-invalid-file",
  "scrum-import-preview-sprints",
  "scrum-import-preview-releases",
  "scrum-import-preview-cards",
  "scrum-import-preview-nothing",
  "scrum-import-into-board-done",
  "scrum-import-card-not-matched",
  "scrum-import-card-ambiguous",
  "scrum-import-card-on-another-board",
  "scrum-import-record-ambiguous",
  "scrum-import-record-not-imported",
  "scrum-import-sprint-finished",
  "sync-planning-sprint",
  "sync-planning-releases",
  "sync-planning-fields",
  "sync-planning-hint",
  "scrum-history-checkpoint-stuck",
  "scrum-history-checkpoint-counts",
  "scrum-history-checkpoint-hint",
  "scrum-history-checkpoint-rollback",
  "scrum-history-checkpoint-discard",
  "scrum-history-checkpoint-discard-confirm",
  "scrum-history-checkpoint-ask-admin"
];

(async () => {
  const { spawnSync } = require('node:child_process');
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const english = read('imports/i18n/data/en.i18n.json');
  for (const locale of ['ro', 'ro-RO']) {
    const data = read(`imports/i18n/data/${locale}.i18n.json`);
    assert.deepEqual(Object.keys(data), Object.keys(english), locale);
    assert.match(data['scrum-import-into-board-hint'], /niciodată duplicate/);
    assert.match(data['scrum-import-into-board-hint'], /ID sau după numărul cardului și titlu/);
    assert.match(data['scrum-import-card-on-another-board'], /lăsat neschimbat/);
    assert.match(data['scrum-import-sprint-finished'], /nu a fost mutat/);
    assert.match(data['sync-planning-hint'], /mai întâi după ID-ul din sursă, apoi după nume/);
    assert.match(data['sync-planning-hint'], /prima sincronizare nu elimină niciodată/);
    assert.match(data['scrum-history-checkpoint-hint'], /numai dacă nimeni altcineva nu/);
    assert.match(data['scrum-history-checkpoint-hint'], /fără a modifica nicio înregistrare/);
    assert.match(data['scrum-history-checkpoint-discard-confirm'], /deja scrise/);
    assert.match(data['scrum-releases-select-help'], /mai multor versiuni/);
    assert.match(data['scrum-releases-select-help'], /toate versiunile/);
    assert.match(data['scrum-releases-select-help'], /Ctrl.*Cmd/);

    for (const key of currentKeys) {
      assert.ok(data[key]?.trim(), key);
      assert.notEqual(data[key], english[key], `${locale}:${key}: translate current prose`);
    }
    for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
      assert.ok(data['ldap-sync-now-nothing'].includes(name), name);
    }
    assert.match(data['stuck-sync-operation-description'], /compară din nou lista cu sursa sa/);
    assert.match(data['stuck-sync-operation-discard-confirm'], /deja aplicate se păstrează/);
    assert.match(data['stuck-sync-operation-discard-confirm'], /nu vor fi scrise niciodată/);
    assert.match(data['stuck-sync-operation-replayable-now'], /nu poate fi abandonată/);
    assert.match(data['stuck-sync-operation-replayable'], /nu a fost abandonată/);
    assert.match(data['stuck-sync-operation-truncated'], /cele mai vechi 50/);
    assert.match(data['login-setting-env-only'], /numai de mediul serverului/);
    assert.match(data['login-setting-env-only'], /doar pentru citire/);
    assert.notEqual(data['r-moved-forward'], data['r-moved-back']);
    for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
      assert.ok(data['import-board-instruction-orgmode'].includes(literal), literal);
    }
    for (const literal of ['@labels', 'p1', 'p3', 'CSV']) {
      assert.ok(data['import-board-instruction-todoist'].includes(literal), literal);
    }
    for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) {
      assert.ok(data['external-link-rules-description'].includes(literal), literal);
    }
    assert.ok(data['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));

    for (const key of Object.keys(english).filter(key => key.startsWith('interrupted-import-'))) {
      assert.ok(data[key]?.trim(), key);
      assert.notEqual(data[key], english[key], `${locale}:${key}: translate import recovery`);
    }
    assert.match(data['interrupted-import-description'], /nu poate fi reluat/);
    assert.match(data['interrupted-import-description'], /inclusiv elementele adăugate ulterior/);
    assert.match(data['interrupted-import-keep-confirm'], /Nu se elimină nimic/);
    assert.match(data['interrupted-import-discard-confirm'], /eliminate definitiv/);
    assert.match(data['interrupted-import-truncated'], /cele mai vechi 50/);
    assert.match(data['interrupted-import-foreign-board'], /nu a fost modificat/);
    assert.match(data['interrupted-import-state-discarding'], /ștergeți din nou/);

    for (const key of Object.keys(english)) {
      assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), `${locale}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
      'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after', 'draggable']) {
      assert.ok(data[key]?.trim(), key);
      assert.notEqual(data[key], english[key], `${locale}:${key}`);
    }
    assert.equal(data['move-selection-before'], 'Înainte');
    assert.equal(data['move-selection-after'], 'După');
    assert.match(data['scrum-report-help'], /nu sunt estimări de zero/);
    assert.match(data['sync-conflict-hint'], /Nu se trimite nimic/);
    assert.match(data['activity-recovery-cancel-confirm'], /Nu mai poate fi reluată/);
    const inventory = spawnSync(process.execPath,
      ['releases/translations/fill-translations.mjs', '--completed-catalog', '--list', locale], { cwd: root, encoding: 'utf8' });
    assert.equal(inventory.status, 0, inventory.stderr);
    assert.deepEqual(JSON.parse(inventory.stdout), {});
    const repaired = records.filter(row => row.locale === locale);
    assert.ok(repaired.length >= 414, `${locale}: reviewed Romanian activity and instruction batches`);
    for (const row of repaired) assert.doesNotMatch(row.after, /\bbachec[ah]|\bsched[ae]\b|\butenti\b|\baggiunt[ao]\b|\bnell[ao]\b/i, row.key);
    assert.equal(data.board, 'Panou');
    assert.equal(data.card, 'Card');
    assert.equal(data.checklist, 'Listă de verificare');
    assert.match(data['globalSearch-instructions-notes-2'], /\*SAU\*/);
    assert.match(data['globalSearch-instructions-notes-3'], /\*ȘI\*/);
    assert.match(data['globalSearch-instructions-notes-3'], /`__operator_list__:Available __operator_label__:red`/);
    assert.match(data['globalSearch-instructions-description'], /`__operator_list__:"To Review"`/);
    for (const card of JSON.parse(data['copyManyCardsPopup-format'])) {
      assert.deepEqual(Object.keys(card), ['title', 'description']);
      assert.match(card.title, /Titlul/);
      assert.match(card.description, /Descrierea/);
    }
    assert.match(data['map-to-existing-user-desc'], /nu poate acorda mai multe permisiuni/);
    assert.match(data['activity-checklist-uncompleted-card'], /anulat finalizarea/);
    assert.match(data['calendar-system-islamic-rgsa'], /Arabia Saudită, observarea lunii/);
    assert.match(data['calendar-system-islamic-tbla'], /tabular, epocă astronomică/);
    assert.match(data['import-board-instruction-trello'], /«Menu», apoi «More», «Print and Export», «Export JSON»/);
    const source = read('imports/i18n/data/en.i18n.json')['advanced-filter-description'];
    for (const example of ["Field1 == Value1", "'Field 1' == 'Value 1'", "Field1 == I\\'m",
      'F1 == V1 || F1 == V2', 'F1 == V1 && ( F2 == V2 || F2 == V3 )', 'F1 == /Tes.*/i']) {
      assert.ok(source.includes(example), 'example matches actual source syntax');
      assert.ok(data['advanced-filter-description'].includes(example), `${locale}: executable example preserved`);
    }
    const { repairProgress } = await import('../releases/translations/audit-progress.mjs');
    const progress = repairProgress();
    assert.equal(progress.pendingByLocale[locale] || 0, 0, 'all Romanian audit findings resolved');
    const translator = i18next.createInstance().use(sprintf);
    await translator.init({ lng: locale, fallbackLng: false, keySeparator: false,
      resources: { [locale]: { translation: data } }, postProcess: ['sprintf'] });
    for (const [key, phrase] of [
      ['activity-dueDate', 'termenul'], ['activity-endDate', 'data de încheiere'],
      ['activity-receivedDate', 'data de primire'], ['activity-startDate', 'data de început'],
    ]) assert.equal(translator.t(key, { sprintf: ['DATE_SENTINEL', 'CARD_SENTINEL'] }),
      `a modificat ${phrase} în DATE_SENTINEL pentru CARD_SENTINEL`, 'date argument precedes card argument');
    assert.equal(translator.t('activity-added-label', { sprintf: ['LABEL_SENTINEL', 'CARD_SENTINEL'] }),
      'a adăugat eticheta «LABEL_SENTINEL» la CARD_SENTINEL');
    assert.equal(translator.t('activity-subtask-added', { sprintf: ['CARD_SENTINEL'] }),
      'a adăugat o subsarcină la CARD_SENTINEL', 'no stray literal digit before the card argument');
    assert.equal(translator.t('activity-checklist-item-added', { sprintf: ['CHECKLIST_SENTINEL', 'CARD_SENTINEL'] }),
      'a adăugat un element în lista de verificare «CHECKLIST_SENTINEL» de pe CARD_SENTINEL');
  }
  console.log('romanianAuditedTranslations: native kanban labels, absence of Italian seed words and real sprintf argument order passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
