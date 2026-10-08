// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const readLocale = code => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${code}.i18n.json`),
  'utf8',
));
const english = readLocale('en');
const aromanian = readLocale('rup');
const { translationTokens: tokens } = require('../releases/translations/placeholder-tokens.mjs');
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--completed-catalog', '--list',
  'rup',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'Aromanian completed baseline has no regressed English placeholders');
assert.deepEqual(Object.keys(aromanian), Object.keys(english),
  'Aromanian keys retain English source order');

for (const [key, value] of Object.entries(aromanian)) {
  assert.equal(typeof value, 'string', `${key}: Aromanian value is text`);
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

// Preserve newer local Aromanian forms: Cunia lists aprochi among accept synonyms
// https://dixionline.net/index.php?inputWord=dixescu
assert.equal(aromanian.accept, 'Aprochi');
assert.equal(aromanian.cancel, 'Anuleadzã');
assert.equal(aromanian.search, 'Caftu');
assert.equal(aromanian.board, 'Tabelã');
assert.equal(aromanian.card, 'Cartã');
assert.equal(aromanian.password, 'Zbor di intrari');
assert.deepEqual(tokens(aromanian['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);

console.log('aromanianTranslationProgress: historical baseline and source inventories passed');

assert.equal(aromanian['color-magenta'], 'arosh-vinjit',
  'magenta uses the locale-established Aromanian red-violet components');
assert.notEqual(aromanian['color-magenta'], english['color-magenta'],
  'magenta is no longer an English placeholder');
assert.match(aromanian['color-magenta'], new RegExp(
  `^${aromanian['color-red']}-${aromanian['color-purple']}$`),
  'magenta stays composed from the current red and purple labels');

const scrumLabelBatch = [
  "board-view-product-backlog",
  "board-view-sprints",
  "board-view-sprint-report",
  "board-view-velocity",
  "scrum-settings",
  "scrum-product-owner",
  "scrum-master",
  "scrum-developers",
  "scrum-working-days",
  "scrum-enabled",
  "scrum-product-goal",
  "scrum-definition-of-done",
  "scrum-estimate-source",
  "scrum-estimate-unit",
  "scrum-completion-policy",
  "scrum-source-poker",
  "scrum-source-customField",
  "scrum-policy-dueComplete",
  "scrum-policy-doneLists",
  "scrum-sprints",
  "scrum-sprint",
  "scrum-start-sprint",
  "scrum-close-sprint",
  "scrum-cancel-sprint",
  "scrum-rollover-sprint",
  "scrum-cancel-reason",
  "scrum-product-backlog",
  "scrum-edit-sprint",
  "scrum-sprint-goal",
  "scrum-capacity",
  "scrum-new-sprint",
  "scrum-releases",
  "scrum-release",
  "scrum-release-scope",
  "scrum-select-sprint",
  "scrum-backlog",
  "scrum-estimate",
  "scrum-backlog-rank",
  "scrum-issue-type",
  "scrum-acceptance-criteria",
  "scrum-events",
  "scrum-event-kind",
  "scrum-timebox",
  "scrum-notes",
  "scrum-event-planning",
  "scrum-event-daily",
  "scrum-event-review",
  "scrum-event-retrospective",
  "scrum-committed",
  "scrum-completed",
  "scrum-added",
  "scrum-removed",
  "scrum-incomplete",
  "scrum-total",
  "scrum-state-planned",
  "scrum-state-active",
  "scrum-state-closed",
  "scrum-state-cancelled",
  "scrum-unknown-estimate",
  "scrum-past-sprints",
  "scrum-list-category",
  "scrum-swimlane-purpose",
  "scrum-category-backlog",
  "scrum-category-todo",
  "scrum-category-doing",
  "scrum-category-done",
  "scrum-state-released",
  "scrum-released-at",
  "scrum-follow-up-cards",
  "scrum-import-reference-omitted",
  "scrum-resume-close",
  "scrum-daily-truncated",
  "scrum-observed-scope"
];
for (const key of scrumLabelBatch) {
  assert.ok(aromanian[key]?.trim(), key);
  assert.notEqual(aromanian[key], english[key], key);
  assert.ok(!/[\u0400-\u04ff]/u.test(aromanian[key]), `${key}: no Cyrillic lookalikes`);
}
assert.equal(aromanian['board-view-product-backlog'], aromanian['scrum-product-backlog']);
assert.equal(aromanian['board-view-sprints'], aromanian['scrum-sprints']);
assert.equal(aromanian['scrum-category-done'], aromanian['scrum-completed']);
assert.notEqual(aromanian['scrum-completed'], aromanian['scrum-incomplete']);
assert.equal(new Set(['planned','active','closed','cancelled','released']
  .map(state => aromanian[`scrum-state-${state}`])).size, 5);
assert.equal(new Set(['start','close','cancel']
  .map(action => aromanian[`scrum-${action}-sprint`])).size, 3);
assert.match(aromanian['scrum-total'], /__count__.*__estimate__.*__unknown__/);
assert.match(aromanian['scrum-daily-truncated'], /366/);
assert.match(aromanian['scrum-timebox'], /minuti/);

for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
  assert.ok(aromanian[key]?.trim(), key);
  assert.notEqual(aromanian[key], english[key], `${key}: Scrum prose remains English`);
}
for (const key of ['scrum-daily-observations-help','scrum-daily-observations-export-help']) {
  assert.match(aromanian[key], /UTC/);
  assert.match(aromanian[key], /[Dd]zãlili cari lipsescu nu suntu bãgati/);
  assert.match(aromanian[key], /nu scriu cafi alãxiri/);
  assert.match(aromanian[key], /nicunuscuti nu suntu zero/);
}
assert.match(aromanian['scrum-report-help'], /unitãtsili sh-regulili.*idhii/);
assert.match(aromanian['scrum-confirm-cancel'], /armãn ligati.*pãnã/);
assert.match(aromanian['scrum-confirm-close'], /nibitisiti.*destinatsia aleasã/);
assert.match(aromanian['scrum-history-checkpoint-hint'], /nitsi un altu nu alãxi/);
assert.match(aromanian['scrum-history-checkpoint-hint'], /nu alãxeashti nitsi un registru/);
assert.notEqual(aromanian['scrum-history-checkpoint-rollback'],
  aromanian['scrum-history-checkpoint-discard']);
assert.deepEqual(tokens(aromanian['scrum-history-checkpoint-counts']),
  ['__applied__','__conflicted__','__pending__','__total__']);

const recoveryBatch = [
  "email-failure-smtp-temporary",
  "email-failure-smtp-rejected",
  "email-failure-smtp-authentication",
  "email-failure-smtp-configuration",
  "email-failure-recipient-unavailable",
  "email-failure-delivery-unconfirmed",
  "email-failure-acknowledgement-failed",
  "email-failure-delivery-failed",
  "email-failure-retry-limit",
  "activity-recovery-heading",
  "activity-recovery-description",
  "activity-recovery-empty",
  "activity-recovery-unavailable",
  "activity-recovery-retry",
  "activity-recovery-retrying",
  "activity-recovery-status-pending",
  "activity-recovery-status-preparing",
  "activity-recovery-status-processing",
  "activity-recovery-status-missing",
  "activity-recovery-status-changed",
  "activity-recovery-status-invalid",
  "activity-recovery-status-inconsistent",
  "activity-recovery-busy",
  "activity-recovery-denied",
  "activity-recovery-source-unavailable",
  "activity-recovery-disabled",
  "activity-recovery-failed",
  "activity-recovery-pause",
  "activity-recovery-resume",
  "activity-recovery-paused",
  "activity-recovery-control-conflict",
  "activity-recovery-control-failed",
  "activity-recovery-status-cancelled",
  "activity-recovery-cancel",
  "activity-recovery-cancel-confirm",
  "rule-email-recovery-unavailable"
];
for (const key of recoveryBatch) {
  assert.ok(aromanian[key]?.trim(), key);
  assert.notEqual(aromanian[key], english[key], key);
}
assert.match(aromanian['email-failure-smtp-temporary'], /temporar/);
assert.match(aromanian['email-failure-smtp-rejected'], /permanent/);
assert.match(aromanian['activity-recovery-description'], /nu adarã vãrnãoarã iara/);
assert.match(aromanian['activity-recovery-source-unavailable'], /Nu s-adarã iara nitsiva/);
assert.match(aromanian['activity-recovery-failed'], /Lucrul tsi ashteaptã fu pãstrat/);
assert.match(aromanian['activity-recovery-cancel-confirm'], /nu poati s-continueadzã iara/);
assert.match(aromanian['activity-recovery-cancel-confirm'], /nu s-toarnã nãpoi/);
assert.equal(new Set(['pause','resume','cancel'].map(action =>
  aromanian[`activity-recovery-${action}`])).size, 3);

for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
  assert.ok(aromanian[key]?.trim(), key);
  assert.notEqual(aromanian[key], english[key], `${key}: Sync prose remains English`);
}
assert.match(aromanian['sync-conflict-hint'], /Nu s-trimeati nitsiva la sistemul di sursã/);
assert.match(aromanian['sync-conflict-review-complete'], /lista întreagã nu fu pornit/);
assert.match(aromanian['sync-conflict-archive-hint'], /Subcartili nu s-alãxescu/);
assert.match(aromanian['sync-conflict-creation-hint'], /uzeadzã idhea cartã di înlocuiri/);
assert.match(aromanian['sync-preview-truncated'], /100/);
assert.match(aromanian['sync-source-truncated'], /100 cãlji/);
assert.match(aromanian['sync-report-retention'], /20.*30 dzãli/);
assert.match(aromanian['sync-report-partial'], /nu continuã sh-nu disfacu/);
assert.match(aromanian['sync-recovery-description'], /nu potu s-continuã icã s-disfacã/);
for (const key of ['sync-estimate-field-hint','sync-time-estimate-hint']) {
  assert.match(aromanian[key], /lipsescu nu s-liau în seamã/);
  assert.match(aromanian[key], /null explicit scoati/);
}
assert.match(aromanian['sync-time-estimate-hint'], /exact un cãmpu/);
assert.equal(aromanian['sync-report-completed'], aromanian['scrum-completed']);

const controlsBatch = [
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
  "card-field-visibility",
  "card-field-visibility-desc",
  "blockly-ALT_KEY",
  "blockly-BACKSPACE_KEY",
  "blockly-CAPS_LOCK_KEY",
  "blockly-COMMAND_KEY",
  "blockly-CONTROL_KEY",
  "blockly-END_KEY",
  "blockly-ENTER_KEY",
  "blockly-ESCAPE",
  "blockly-HOME_KEY",
  "blockly-INSERT_KEY",
  "blockly-LISTS_SORT_TYPE_NUMERIC",
  "blockly-MATH_ADDITION_SYMBOL_ARIA",
  "blockly-MATH_SUBTRACTION_SYMBOL_ARIA",
  "blockly-OPTION_KEY",
  "blockly-PAGE_DOWN_KEY",
  "blockly-PAGE_UP_KEY",
  "blockly-PAUSE_KEY",
  "blockly-SHIFT_KEY",
  "blockly-TAB_KEY",
  "blockly-UNNAMED_KEY",
  "login-setting-env-only"
];
for (const key of controlsBatch) {
  assert.ok(aromanian[key]?.trim(), key);
  assert.notEqual(aromanian[key], english[key], key);
}
for (const key of ['external-link-rules-description','external-link-identifier-aliases']) {
  assert.deepEqual(aromanian[key].match(/\{(?:number|identifier)\}/g),
    english[key].match(/\{(?:number|identifier)\}/g), key);
}
assert.ok(aromanian['external-link-rules-description'].includes(
  '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
assert.ok(aromanian['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS',
  'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
  assert.ok(aromanian['ldap-sync-now-nothing'].includes(name), name);
}
assert.notEqual(aromanian['r-moved-forward'], aromanian['r-moved-back']);
assert.notEqual(aromanian['blockly-PAGE_UP_KEY'], aromanian['blockly-PAGE_DOWN_KEY']);
assert.match(aromanian['read-only-field'], /cafi membru vidi.*mash administratorlji/);
assert.match(aromanian['card-field-visibility-desc'], /Nu s-alãxescu dati di cartã/);
assert.match(aromanian['login-setting-env-only'], /Mash mediul a serverului/);

assert.match(aromanian['sync-planning-hint'], /ninti dupã ID-lu di sursã, dapoi dupã numã/);
assert.match(aromanian['sync-planning-hint'], /prota Sync nu scoati vãrnãoarã planificarea/);

for (const key of Object.keys(english).filter(key => key.startsWith('stuck-sync-operation-'))) {
  assert.ok(aromanian[key]?.trim(), key);
  assert.notEqual(aromanian[key], english[key], key);
}
assert.match(aromanian['stuck-sync-operation-description'], /Sync tsi yini comparã lista cu sursa a ei iara/);
assert.match(aromanian['stuck-sync-operation-discard-confirm'], /Alãxirili aplicati dza armãn/);
assert.match(aromanian['stuck-sync-operation-discard-confirm'], /nu s-scriu vãrnãoarã/);
assert.match(aromanian['stuck-sync-operation-replayable-now'], /nu poati s-hibã scoasã/);
assert.match(aromanian['stuck-sync-operation-replayable'], /nu fu scoasã/);
assert.match(aromanian['stuck-sync-operation-truncated'], /50 cama veclji/);

const repairedItalianValues = {
  "editCardStartDatePopup-title": "Cambia data di inizio",
  "editCardDueDatePopup-title": "Cambia data di scadenza",
  "editCustomFieldPopup-title": "Modifica campo",
  "addReactionPopup-title": "Aggiungi reazione",
  "editCardSpentTimePopup-title": "Cambia tempo trascorso",
  "editLabelPopup-title": "Modifica etichetta",
  "editNotificationPopup-title": "Modifica notifiche",
  "editProfilePopup-title": "Modifica profilo",
  "email-invalid": "Email non valida",
  "email-invite": "Invita via email",
  "email-invite-subject": "__inviter__ ti ha inviato un invito",
  "push-invite-title": "__inviter__ ti ha inviato un invito",
  "error-list-doesNotExist": "Questa lista non esiste",
  "error-user-doesNotExist": "Questo utente non esiste",
  "export-ical-feed": "Calendario (iCal)",
  "export-card": "Esporta scheda",
  "export-card-pdf": "Esporta scheda in PDF",
  "export-card-subtasks": "Sotto-compiti",
  "exportCardPopup-title": "Esporta scheda",
  "remove-sort": "Rimuovi l'ordinamento",
  "list-sort-by": "Ordina lista per:",
  "list-label-modifiedAt": "Orario ultimo accesso",
  "list-label-title": "Nome della lista",
  "list-label-sort": "Il tuo ordine manuale",
  "filter-cards": "Filtra schede o liste",
  "filter-dates-label": "Filtra per data",
  "filter-no-due-date": "Senza data scadenza",
  "filter-due-this-week": "Scade questa settimana",
  "list-filter-label": "Filtra lista per titolo",
  "filter-clear": "Pulisci filtri",
  "filter-no-label": "Nessuna etichetta",
  "filter-member-label": "Filtra secondo il membro",
  "filter-no-member": "Nessun membro",
  "filter-creator-label": "Filtra secondo Creatore",
  "filter-no-assignee": "Nessun assegnatario",
  "filter-show-archive": "Mostra liste archiviate",
  "filter-hide-empty": "Nascondi liste vuote",
  "filter-on": "Il filtro è attivo",
  "filter-to-selection": "Filtra selezione",
  "advanced-filter-label": "Filtro avanzato",
  "fullname": "Nome completo",
  "show-activities": "Mostra Attività",
  "impersonate-user": "Impersona utente",
  "import-board": "Importa bacheca",
  "import-board-c": "Importa bacheca",
  "completed": "Completato/a",
  "keyboard-shortcuts": "Scorciatoie da tastiera"
};
for (const [key, italian] of Object.entries(repairedItalianValues)) {
  assert.notEqual(aromanian[key], italian, `${key}: Italian seed must not return`);
  assert.notEqual(aromanian[key], english[key], `${key}: do not replace Italian with English`);
}
assert.equal(aromanian.completed, aromanian['scrum-completed']);
assert.equal(aromanian['email-invite-subject'], aromanian['push-invite-title']);
assert.deepEqual(tokens(aromanian['email-invite-subject']), ['__inviter__']);
assert.match(aromanian['export-card-pdf'], /PDF/);
assert.match(aromanian['export-ical-feed'], /iCal/);
assert.notEqual(aromanian['filter-show-archive'], aromanian['filter-hide-empty']);

const repairedItalianBoardControls = {
  "import-map-members": "Mappatura dei membri",
  "importMapMembersAddPopup-title": "Scegli membro",
  "invalid-date": "Data non valida",
  "invalid-time": "Tempo non valido",
  "invalid-user": "Utente non valido",
  "label-create": "Crea etichetta",
  "label-default": "%s etichetta (default)",
  "leave-board": "Abbandona bacheca",
  "leaveBoardPopup-title": "Abbandonare la bacheca?",
  "link-card": "Link a questa scheda",
  "set-color-list": "Imposta colore",
  "settingsUserPopup-title": "Impostazioni utente",
  "settingsTeamPopup-title": "Impostazioni team",
  "swimlaneActionPopup-title": "Azioni swimlane",
  "swimlaneAddPopup-title": "Aggiungi swimlane sotto",
  "listImportCardsTsvPopup-title": "Importa CSV/TSV di Excel",
  "link-list": "Link a questa lista",
  "moveCardToBottom-title": "Sposta in fondo",
  "moveCardToTop-title": "Sposta in cima",
  "multi-selection": "Selezione multipla",
  "multi-selection-label": "Selezionare etichetta",
  "multi-selection-member": "Selezionare membro",
  "my-boards": "Le mie bacheche",
  "page-not-found": "Pagina non trovata.",
  "remove-from-board": "Rimuovi dalla bacheca",
  "remove-label": "Rimuovi etichetta",
  "listDeletePopup-title": "Eliminare lista?",
  "remove-member": "Rimuovi utente",
  "remove-member-from-card": "Rimuovi dalla scheda",
  "removeMemberPopup-title": "Rimuovere membro?",
  "select-color": "Scegli un colore",
  "select-board": "Seleziona bacheca",
  "shortcut-autocomplete-emoji": "Autocompletamento emoji",
  "shortcut-autocomplete-members": "Autocompletamento membri",
  "shortcut-clear-filters": "Pulisci tutti i filtri"
};
for (const [key, italian] of Object.entries(repairedItalianBoardControls)) {
  assert.notEqual(aromanian[key], italian, `${key}: Italian seed must not return`);
  assert.notEqual(aromanian[key], english[key], `${key}: English is not a correction`);
}
assert.deepEqual(tokens(aromanian['label-default']), ['%s']);
assert.match(aromanian['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.notEqual(aromanian['moveCardToBottom-title'], aromanian['moveCardToTop-title']);
assert.notEqual(aromanian['remove-member-from-card'], aromanian['remove-from-board']);
assert.match(aromanian['listDeletePopup-title'], /Ashteardzi/);

const repairedItalianAccountControls = {
  "shortcut-filter-my-cards": "Filtra le mie schede",
  "sidebar-close": "Chiudi sidebar",
  "signupPopup-title": "Crea un account",
  "starred-boards": "Bacheche preferite",
  "this-board": "questa bacheca",
  "this-card": "questa scheda",
  "spent-time-hours": "Tempo trascorso (ore)",
  "overtime-hours": "Overtime (ore)",
  "has-overtime-cards": "Ci sono schede scadute",
  "unassign-member": "Rimuovi membro",
  "upload-avatar": "Carica un avatar",
  "uploaded-avatar": "Avatar caricato",
  "import-usernames": "Importa username",
  "watching": "Stai seguendo",
  "welcome-board": "Bacheca di benvenuto",
  "card-templates-swimlane": "Template schede",
  "list-templates-swimlane": "Template liste",
  "board-templates-swimlane": "Template bacheche",
  "registration": "Registrazione",
  "invite-people": "Invita persone",
  "to-boards": "Alla/e bacheca/e",
  "email-addresses": "Indirizzi email",
  "invitation-code": "Codice d'invito",
  "email-invite-register-subject": "__inviter__ ti ha inviato un invito",
  "email-smtp-test-subject": "E-Mail di test SMTP",
  "outgoing-webhooks": "Webhook in uscita",
  "bidirectional-webhooks": "Webhook a due vie",
  "outgoingWebhooksPopup-title": "Webhook in uscita",
  "boardCardTitlePopup-title": "Filtro per titolo scheda",
  "disable-webhook": "Disattiva questo webhook",
  "global-webhook": "Webhook globali",
  "new-outgoing-webhook": "Nuovo webhook in uscita",
  "no-name": "(Sconosciuto)",
  "Node_version": "Versione Node",
  "Meteor_version": "Versione Meteor"
};
for (const [key, italian] of Object.entries(repairedItalianAccountControls)) {
  assert.notEqual(aromanian[key], italian, `${key}: Italian seed must not return`);
  assert.notEqual(aromanian[key], english[key], `${key}: English is not a correction`);
}
assert.equal(aromanian['email-invite-register-subject'], aromanian['email-invite-subject']);
assert.match(aromanian['email-smtp-test-subject'], /SMTP/);
assert.match(aromanian.Node_version, /Node/);
assert.match(aromanian.Meteor_version, /Meteor/);
assert.match(aromanian['has-overtime-cards'], /timpu pisti limitã/);
assert.match(aromanian['overtime-hours'], /oari/);
assert.notEqual(aromanian['outgoing-webhooks'], aromanian['bidirectional-webhooks']);
assert.equal(aromanian['outgoing-webhooks'], aromanian['outgoingWebhooksPopup-title']);

const repairedItalianAdminControls = {
  "OS_Arch": "Architettura SO",
  "OS_Cpus": "Numero CPU SO",
  "OS_Freemem": "Memoria libera SO",
  "OS_Loadavg": "Carico medio SO",
  "OS_Platform": "Piattaforma SO",
  "OS_Release": "Versione di rilascio SO",
  "OS_Totalmem": "Memoria totale SO",
  "OS_Uptime": "Tempo di attività del SO",
  "tableVisibilityMode": "Visibilità bacheche",
  "modifiedAt": "Modificato il",
  "editCardReceivedDatePopup-title": "Cambia data ricezione",
  "editCardEndDatePopup-title": "Cambia data finale",
  "setCardColorPopup-title": "Imposta il colore",
  "setCardActionsColorPopup-title": "Scegli un colore",
  "setSwimlaneColorPopup-title": "Scegli un colore",
  "setListColorPopup-title": "Scegli un colore",
  "boardDeletePopup-title": "Eliminare la bacheca?",
  "delete-board": "Elimina bacheca",
  "card-settings": "Impostazioni scheda",
  "boardCardSettingsPopup-title": "Impostazioni scheda",
  "prefix-with-parent": "Prefisso con genitore",
  "subtext-with-parent": "Sotto-testo con genitore",
  "parent-card": "Scheda genitore",
  "source-board": "Bacheca d'origine",
  "no-parent": "Non mostrare i genitori",
  "activity-added-label-card": "aggiunta etichetta '%s'",
  "activity-delete-attach-card": "cancella un allegato",
  "r-add-trigger": "Aggiungi trigger",
  "r-add-action": "Aggiungi azione",
  "r-board-rules": "Regole della bacheca",
  "r-add-rule": "Aggiungi regola",
  "r-view-rule": "Visualizza regola",
  "r-delete-rule": "Elimina regola",
  "r-new-rule-name": "Titolo nuova regola"
};
for (const [key, italian] of Object.entries(repairedItalianAdminControls)) {
  assert.notEqual(aromanian[key], italian, `${key}: Italian seed must not return`);
  assert.notEqual(aromanian[key], english[key], `${key}: English is not a correction`);
}
assert.deepEqual(tokens(aromanian['activity-added-label-card']), ['%s']);
assert.match(aromanian['activity-delete-attach-card'], /ashtearsi/);
assert.match(aromanian['delete-board'], /Ashteardzi/);
assert.equal(aromanian['card-settings'], aromanian['boardCardSettingsPopup-title']);
assert.equal(new Set(['setCardActionsColorPopup-title','setSwimlaneColorPopup-title',
  'setListColorPopup-title'].map(key => aromanian[key])).size, 1);
assert.notEqual(aromanian.OS_Freemem, aromanian.OS_Totalmem);
assert.match(aromanian.OS_Cpus, /CPU/);

assert.match(aromanian['scrum-import-into-board-hint'], /nu s-duplicã vãrnãoarã/);
assert.match(aromanian['scrum-import-into-board-hint'], /dupã ID icã dupã numirlu sh-titlul/);
assert.match(aromanian['scrum-import-card-on-another-board'], /lãsatã nialãxitã/);
assert.match(aromanian['scrum-import-sprint-finished'], /nu fu mutatã/);

const repairedItalianRuleControls = {
  "r-no-rules": "Nessuna regola",
  "r-when-a-card": "Quando una scheda",
  "r-is-moved": "viene spostata",
  "set-filter": "Imposta un filtro",
  "r-moved-from": "Spostato/a da",
  "r-archived": "Spostato/a nell'archivio",
  "r-when-the-label": "Quando l'etichetta viene",
  "r-when-a-member": "Quando un membro viene",
  "r-when-the-member": "Quando un membro viene",
  "r-when-a-attach": "Quando un allegato",
  "r-when-a-checklist": "Quando una checklist è",
  "r-when-the-checklist": "Quando la checklist",
  "r-made-incomplete": "Rendi incompleto",
  "r-move-card-to": "Sposta scheda a",
  "r-top-of": "Al di sopra di",
  "r-bottom-of": "Al di sotto di",
  "r-unarchive": "Ripristina dall'archivio",
  "r-set-color": "Imposta il colore",
  "r-check-all": "Seleziona tutti",
  "r-uncheck-all": "Togli la spunta a tutti",
  "r-items-check": "Elementi della checklist",
  "r-uncheck": "Togli la spunta",
  "r-of-checklist": "della checklist",
  "r-send-email": "Invia un'e-mail",
  "r-rule-details": "Dettagli della regola",
  "r-d-add-label": "Aggiungi etichetta",
  "r-d-remove-label": "Rimuovi etichetta",
  "r-create-card": "Crea una nuova scheda",
  "r-in-swimlane": "nella swimlane",
  "r-d-add-member": "Aggiungi membro",
  "r-d-remove-member": "Rimuovi membro",
  "r-d-remove-all-member": "Rimuovi tutti i membri",
  "r-d-check-one": "Seleziona elemento",
  "r-d-uncheck-one": "Deseleziona elemento",
  "r-d-check-of-list": "della checklist"
};
for (const [key, italian] of Object.entries(repairedItalianRuleControls)) {
  assert.notEqual(aromanian[key], italian, `${key}: Italian seed must not return`);
  assert.notEqual(aromanian[key], english[key], `${key}: English is not a correction`);
}
assert.notEqual(aromanian['r-top-of'], aromanian['r-bottom-of']);
assert.notEqual(aromanian['r-check-all'], aromanian['r-uncheck-all']);
assert.notEqual(aromanian['r-d-check-one'], aromanian['r-d-uncheck-one']);
assert.equal(aromanian['r-of-checklist'], aromanian['r-d-check-of-list']);
assert.match(aromanian['r-made-incomplete'], /Fãcut nibitisit/);

const repairedItalianSearchControls = {
  "r-d-add-checklist": "Aggiungi checklist",
  "r-d-remove-checklist": "Rimuovi checklist",
  "r-add-checklist": "Aggiungi checklist",
  "r-add-swimlane": "Aggiungi swimlane",
  "r-swimlane-name": "nome swimlane",
  "r-to-current-datetime": "a data/ora corrente",
  "r-remove-value-from": "Rimuovi valore da",
  "authentication-method": "Metodo di autenticazione",
  "authentication-type": "Tipo di autenticazione",
  "hide-logo": "Nascondi il logo",
  "error-undefined": "Qualcosa è andato storto",
  "duplicate-board": "Duplica bacheca",
  "team-number": "Il numero di squadre è:",
  "people-number": "Il numero di persone è:",
  "swimlaneDeletePopup-title": "Eliminare la swimlane?",
  "restore-all": "Ripristina tutto",
  "delete-all": "Elimina tutto",
  "previous_as": "l'ultima volta è stata",
  "a-dueAt": "scadenza modificata in",
  "act-newDue": "__list__/__card__ ha un 1° sollecito [__board__]",
  "show-on-card": "Mostra sulla scheda",
  "editOrgPopup-title": "Modifica Organizzazione",
  "newOrgPopup-title": "Nuova Organizzazione",
  "editTeamPopup-title": "Modifica team",
  "editUserPopup-title": "Modifica utente",
  "filter-by-unread": "Filtra per non letto",
  "mark-all-as-read": "Segna tutto come letto",
  "allow-rename": "Consenti Rinomina",
  "allowRenamePopup-title": "Consenti Rinomina",
  "last-modified-at": "Ultima modifica il",
  "last-activity": "Ultima attività",
  "displayName": "Nome da visualizzare",
  "shortName": "Nome abbreviato",
  "myCardsViewChange-title": "Vista mie schede",
  "myCardsViewChangePopup-title": "Vista mie schede",
  "list-title-not-found": "Lista '%s' non trovata.",
  "team-name-not-found": "Team '%s' non trovato.",
  "no-cards-found": "Nessuna scheda trovata",
  "one-card-found": "Una scheda trovata",
  "n-cards-found": "%s scheda trovata",
  "n-n-of-n-cards-found": "__start__-__end__ di __total__ schede trovate",
  "operator-unknown-error": "%s non è un operatore",
  "next-page": "Pagina successiva",
  "previous-page": "Pagina precedente",
  "globalSearch-instructions-heading": "Istruzioni ricerca",
  "globalSearch-instructions-operators": "Operatori disponibili:",
  "globalSearch-instructions-status-archived": "`__predicate_archived__` - schede archiviate",
  "link-to-search": "Link a questa ricerca"
};
for (const [key, italian] of Object.entries(repairedItalianSearchControls)) {
  assert.notEqual(aromanian[key], italian, `${key}: Italian seed must not return`);
  assert.notEqual(aromanian[key], english[key], `${key}: English is not a correction`);
  assert.deepEqual(tokens(aromanian[key]), tokens(english[key]), `${key}: preserve variables`);
}
assert.equal(aromanian['r-add-checklist'], aromanian['add-checklist']);
assert.equal(aromanian['r-d-add-checklist'], aromanian['add-checklist']);
assert.equal(aromanian['r-add-swimlane'], aromanian['add-swimlane']);
assert.equal(aromanian['allow-rename'], aromanian['allowRenamePopup-title']);
assert.equal(aromanian['myCardsViewChange-title'], aromanian['myCardsViewChangePopup-title']);
assert.notEqual(aromanian['restore-all'], aromanian['delete-all']);
assert.notEqual(aromanian['next-page'], aromanian['previous-page']);
assert.match(aromanian['act-newDue'], /prota/);
assert.match(aromanian['globalSearch-instructions-status-archived'], /`__predicate_archived__`/);

const repairedMixedLanguageActions = {
  "myCardsSortChange-title": "Ordina le mie schede...",
  "myCardsSortChangePopup-title": "Ordina le mie schede...",
  "myCardsSortChange-choice-dueat": "Per data di scadenza",
  "dueCards-title": "Schede in scadenza",
  "dueCardsViewChange-choice-all": "Tutti gli utenti",
  "label-colors": "Colori etichette",
  "label-names": "Nomi etichette",
  "archived-at": "archiviata il",
  "sort-cards": "Ordina schede",
  "sort-is-on": "Ordinamento attivo",
  "cardsSortPopup-title": "Ordina schede",
  "server-error": "Errore server",
  "move-swimlane": "Sposta swimlane",
  "moveSwimlanePopup-title": "Sposta swimlane",
  "creator-on-minicard": "Creatore su minicard",
  "impersonation-admin": "Amministratore",
  "copy-swimlane": "Copia swimlane",
  "copySwimlanePopup-title": "Copia swimlane",
  "maximize-card": "Massimizza scheda",
  "minimize-card": "Minimizza scheda",
  "carbon-copy": "Copia Conoscenza (Cc:)",
  "ticket-number": "Numero ticket",
  "help-request": "Richiesta aiuto",
  "editCardSortOrderPopup-title": "Modifica ordinamento",
  "cardDetailsPopup-title": "Dettagli scheda",
  "add-teams": "Aggiungi team",
  "filter-card-title-label": "Filtra per titolo scheda",
  "add-organizations": "Aggiunta organizzazioni",
  "legalNotice": "Informazioni legali",
  "checklistActionsPopup-title": "Azioni checklist",
  "moveChecklist": "Sposta checklist",
  "moveChecklistPopup-title": "Sposta checklist",
  "originOrder": "ordine originale",
  "copyChecklist": "Copia checklist",
  "copyChecklistPopup-title": "Copia checklist",
  "attachmentActionsPopup-title": "Azioni allegato",
  "attachment-move-storage-s3": "Sposta allegato su S3",
  "attachment-move": "Muovi allegato",
  "version-name": "Versione-Nome",
  "board-title": "Titolo bacheca",
  "board-status": "Stato della bacheca",
  "board-status-time-spent-total": "Tempo totale impiegato",
  "board-status-overtime-cards": "Schede in straordinario",
  "uploading": "Caricamento in corso",
  "remaining_time": "Tempo rimanente",
  "password-again": "Password (di nuovo)",
  "if-you-already-have-an-account": "Se hai già un account",
  "minicardDetailsActionsPopup-title": "Dettagli scheda",
  "Mongo_sessions_count": "Numero sessioni Mongo",
  "drag-board": "Muovi la bacheca",
  "translation-text": "Testo della traduzione",
  "convert-to-markdown": "Converti in markdown",
  "uncollapse": "Non collassare",
  "accessibility": "Accessibilità",
  "accessibility-title": "Titolo di accessibilità",
  "accounts-lockout-locked-users": "Utenti bloccati",
  "accounts-lockout-failed-attempts": "Tentativi Falliti",
  "accounts-lockout-remaining-time": "Tempo Rimanente",
  "accounts-lockout-user-locked": "L'utente è bloccato",
  "admin-people-filter-all": "Tutti gli utenti",
  "admin-people-filter-locked": "Solo utenti bloccati",
  "admin-people-active-status": "Status Attivo",
  "accounts-lockout-unlock-all": "Sblocca Tutti",
  "blockly-MATH_ATAN2_TITLE": "atan2 di X:%1 Y:%2",
  "overtime": "Tiempo excesivo"
};
for (const [key, previous] of Object.entries(repairedMixedLanguageActions)) {
  assert.notEqual(aromanian[key], previous, `${key}: wrong-language seed must not return`);
  assert.notEqual(aromanian[key], english[key], `${key}: English is not a correction`);
  assert.deepEqual(tokens(aromanian[key]), tokens(english[key]), `${key}: preserve variables`);
}
for (const [action, popup] of [
  ['myCardsSortChange-title', 'myCardsSortChangePopup-title'],
  ['sort-cards', 'cardsSortPopup-title'],
  ['move-swimlane', 'moveSwimlanePopup-title'],
  ['copy-swimlane', 'copySwimlanePopup-title'],
  ['moveChecklist', 'moveChecklistPopup-title'],
  ['copyChecklist', 'copyChecklistPopup-title'],
  ['cardDetailsPopup-title', 'minicardDetailsActionsPopup-title'],
  ['remaining_time', 'accounts-lockout-remaining-time'],
  ['dueCardsViewChange-choice-all', 'admin-people-filter-all'],
]) assert.equal(aromanian[action], aromanian[popup], `${action}: consistent shared label`);
assert.notEqual(aromanian['maximize-card'], aromanian['minimize-card']);
assert.notEqual(aromanian['copyChecklist'], aromanian['moveChecklist']);
assert.notEqual(aromanian['copy-swimlane'], aromanian['move-swimlane']);
assert.match(aromanian['admin-people-filter-locked'], /^Mash /);
assert.match(aromanian['accounts-lockout-unlock-all'], /tuts$/);
assert.match(aromanian['attachment-move-storage-s3'], /S3$/);
assert.match(aromanian['carbon-copy'], /\(Cc:\)/);
assert.match(aromanian['blockly-MATH_ATAN2_TITLE'], /^atan2 .*X:%1 .*Y:%2$/);

const interruptedImportKeys = Object.keys(english).filter(key => key.startsWith('interrupted-import-'));
assert.equal(interruptedImportKeys.length, 25);
for (const key of interruptedImportKeys) {
  assert.notEqual(aromanian[key], english[key], `${key}: translate recovery prose`);
  assert.deepEqual(tokens(aromanian[key]), tokens(english[key]), `${key}: retain recovery variables`);
}
assert.match(aromanian['interrupted-import-description'], /nu poati s-continueadz/);
assert.match(aromanian['interrupted-import-description'], /fisierlu di surs/);
assert.match(aromanian['interrupted-import-keep-confirm'], /Nu s-scoati tsiva/);
assert.match(aromanian['interrupted-import-discard-confirm'], /ti totna/);
assert.match(aromanian['interrupted-import-truncated'], /mash atseali 50 ma veclji/);
assert.match(aromanian['interrupted-import-foreign-board'], /nu fu al/);
assert.match(aromanian['interrupted-import-state-discarding'], /di nao/);
