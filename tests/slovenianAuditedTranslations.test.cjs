'use strict';
const assert = require('node:assert/strict');
for (const locale of ['sl', 'sl_SI']) {
  const data = require(`../imports/i18n/data/${locale}.i18n.json`);
  const english = require('../imports/i18n/data/en.i18n.json');
  const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
  const correctedControls = ["allboards.starred", "allboards.remaining", "allboards.workspaces", "allboards.add-workspace", "allboards.add-workspace-prompt", "allboards.add-subworkspace", "allboards.add-subworkspace-prompt", "allboards.edit-workspace-name", "addWorkspacePopup-title", "add-template", "add-card-to-top-of-list", "add-card-to-bottom-of-list", "convertChecklistItemToCardPopup-title", "add-cover", "add-after-list", "template-container", "board-change-background-image", "board-background-image-url", "remove-background-image", "board_members", "allBoardsChangeBackgroundImagePopup-title", "zoom-level", "enter-zoom-level", "board-view-gantt", "board-view-table", "calendar-previous-month-label", "calendar-next-month-label", "due-today", "positiveVoteMembersPopup-title", "negativeVoteMembersPopup-title", "vote-question", "card-edit-planning-poker", "poker-question", "poker-finish", "poker-result-votes", "poker-result-who", "poker-replay", "set-estimation", "cardArchivePopup-title", "deleteAvatarPopup-title", "close-card", "color-indigo", "color-magenta", "comments", "comment-assigned-only", "deleteCommentPopup-title", "read-only", "read-assigned-only", "copy-text-to-clipboard", "copyManyCardsPopup-title", "custom-field-currency-option", "date-format", "addReactionPopup-title", "email-address", "export-card", "export-card-attachment-size", "exportCardPopup-title", "sorted", "remove-sort", "filter-dates-label", "filter-no-due-date", "filter-overdue", "filter-due-today", "filter-due-tomorrow", "filter-labels-label"];
  for (const key of correctedControls) {
    assert.doesNotMatch(data[key], /[\u0400-\u04ff]/, `${locale}:${key}`);
    assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), `${locale}:${key}`);
  }
  assert.match(data['allboards.workspaces'], /Delovni prostori/);
  assert.match(data['allboards.add-subworkspace'], /podrejeni delovni prostor/);
  assert.match(data['add-card-to-top-of-list'], /vrh seznama/);
  assert.match(data['add-card-to-bottom-of-list'], /dno seznama/);
  assert.equal(data['board-view-table'], 'Tabela');
  assert.equal(data['board-view-gantt'], 'Ganttov diagram');
  assert.match(data['comment-assigned-only'], /Komentirajo.*samo dodeljeni/);
  assert.match(data['read-assigned-only'], /Berejo.*samo dodeljeni/);
  assert.equal(data['email-address'], 'E-poštni naslov');
  assert.equal(data['filter-due-today'], 'Rok danes');
  assert.equal(data['filter-due-tomorrow'], 'Rok jutri');
  assert.match(data['enter-zoom-level'], /50-300%/);
  const correctedSettings = ["filter-assignee-label", "filter-creator-label", "filter-custom-fields-label", "other-filters-label", "show-activities", "settingsUserPopup-title", "settingsTeamPopup-title", "settingsOrgPopup-title", "listImportCardsTsvPopup-title", "gantt", "copySelectionPopup-title", "selection-color", "multi-selection-member", "normal-assigned-only", "remove-cover", "select-board", "shortcut-add-self", "shortcut-toggle-filterbar", "shortcut-toggle-searchbar", "uploading-files", "upload-failed", "upload-completed", "import-usernames", "smtp-host", "email-templates-invite-subject", "email-templates-activity-subject", "tableVisibilityMode", "modifiedAt", "setSelectionColorPopup-title", "delete-all-notifications", "minicard-settings", "boardMinicardSettingsPopup-title", "description-on-minicard", "cover-attachment-on-minicard", "badge-attachment-on-minicard", "r-board", "r-trigger", "r-action", "team-number", "above-selected-card", "below-selected-card", "show-on-minicard", "editOrgPopup-title", "newOrgPopup-title", "editTeamPopup-title", "newTeamPopup-title", "notifications", "view-all", "filter-by-unread", "mark-all-as-read", "remove-all-read", "allow-rename", "allowRenamePopup-title", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "status", "owner", "last-modified-at", "last-activity", "voting", "archived", "task", "create-task", "ok", "organizations"];
  for (const key of correctedSettings) {
    assert.doesNotMatch(data[key], /[\u0400-\u04ff]/, `${locale}:${key}`);
    assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), `${locale}:${key}`);
  }
  assert.equal(data['settingsUserPopup-title'], 'Uporabniške nastavitve');
  assert.equal(data['settingsTeamPopup-title'], 'Nastavitve ekipe');
  assert.equal(data['settingsOrgPopup-title'], 'Nastavitve organizacije');
  assert.match(data['upload-failed'], /ni uspelo/);
  assert.match(data['upload-completed'], /je končano/);
  assert.match(data['filter-by-unread'], /neprebranih/);
  assert.match(data['mark-all-as-read'], /vse kot prebrano/);
  assert.match(data['remove-all-read'], /Odstrani vse prebrano/);
  assert.equal(data.monday, 'Ponedeljek');
  assert.equal(data.thursday, 'Četrtek');
  assert.equal(data.sunday, 'Nedelja');
  assert.equal(data['above-selected-card'], 'Nad izbrano kartico');
  assert.equal(data['below-selected-card'], 'Pod izbrano kartico');
  assert.equal(data['team-number'], 'Število ekip je: ');
  assert.match(data['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
  const correctedSearch = ["teams", "displayName", "shortName", "person", "my-attachments", "list", "myCardsViewChange-title", "myCardsViewChange-choice-table", "myCardsSortChange-choice-dueat", "dueCards-title", "dueCardsViewChange-title", "dueCardsViewChangePopup-title", "dueCardsViewChange-choice-me", "dueCardsViewChange-choice-all", "globalSearch-title", "n-n-of-n-cards-found", "operator-board", "operator-board-abbrev", "operator-swimlane", "operator-swimlane-abbrev", "operator-list-abbrev", "operator-user", "operator-member-abbrev", "operator-assignee", "operator-assignee-abbrev", "operator-creator", "operator-status", "operator-created", "operator-modified", "operator-sort", "operator-comment", "operator-has", "operator-limit", "operator-debug", "operator-org", "operator-team", "operator-description", "operator-attachment-text", "predicate-archived", "predicate-open", "predicate-ended", "predicate-all", "predicate-overdue", "predicate-week", "predicate-month", "predicate-quarter", "predicate-year", "predicate-modified", "predicate-created", "predicate-attachment", "predicate-description", "predicate-assignee", "predicate-public", "predicate-private", "predicate-selector", "predicate-projection", "operator-unknown-error", "operator-status-invalid", "next-page", "previous-page", "heading-notes", "globalSearch-instructions-status-archived", "link-to-search", "excel-font", "label-colors", "label-names", "archived-at", "sort-cards", "sort-is-on", "cardsSortPopup-title", "due-date", "server-error", "title-alphabetically", "links-heading", "move-swimlane"];
  for (const key of correctedSearch) {
    assert.doesNotMatch(data[key], /[\u0400-\u04ff]/, `${locale}:${key}`);
    assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), `${locale}:${key}`);
  }
  const aliases = Object.keys(english).filter(key => /^operator-.*-abbrev$/.test(key)).map(key => data[key]);
  assert.equal(new Set(aliases).size, aliases.length, 'unique Slovenian search aliases');
  assert.equal(data['operator-board'], 'tabla');
  assert.equal(data['operator-swimlane'], 'steza');
  assert.equal(data['operator-user'], 'uporabnik');
  assert.equal(data['operator-creator'], 'ustvarjalec');
  assert.equal(data['predicate-public'], 'javno');
  assert.equal(data['predicate-private'], 'zasebno');
  assert.equal(data['next-page'], 'Naslednja stran');
  assert.equal(data['previous-page'], 'Prejšnja stran');
  assert.equal(data['excel-font'], 'Arial');
  assert.equal(data['server-error'], 'Napaka strežnika');
  const correctedDetails = ["moveSwimlanePopup-title", "custom-field-stringtemplate", "creator", "creator-on-minicard", "reports", "boardsReportTitle", "copy-swimlane", "copySwimlanePopup-title", "wait-spinner", "Bounce", "Cube", "Dot", "Scaleout", "Wave", "maximize-card", "minimize-card", "subject", "details", "carbon-copy", "ticket", "tickets", "ticket-number", "open", "pending", "closed", "resolved", "cancelled", "history", "request", "requests", "help-request", "cardDetailsPopup-title", "add-teams", "confirm-btn", "add-organizations", "legalNotice", "copied", "moveChecklist", "moveChecklistPopup-title", "newLineNewItem", "originOrder", "copyChecklist", "copyChecklistPopup-title", "copyChecklistFromTemplate", "copyChecklistFromTemplatePopup-title", "card-show-lists", "attachment-move", "move-progress-pause", "path", "version-name", "size", "storage", "action", "board-title", "uploading", "remaining_time", "speed", "progress", "password-again", "register", "forgot-password", "minicardDetailsActionsPopup-title", "Mongo_sessions_count", "allowed-avatar-filetypes", "drag-board", "newTranslationPopup-title", "editTranslationPopup-title", "translation", "translation-text", "uncollapse"];
  for (const key of correctedDetails) {
    assert.doesNotMatch(data[key], /[\u0400-\u04ff]/, `${locale}:${key}`);
    assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), `${locale}:${key}`);
  }
  assert.equal(data.creator, 'Ustvarjalec');
  assert.equal(data.reports, 'Poročila');
  assert.match(data['copy-swimlane'], /Kopiraj plavalno stezo/);
  assert.match(data['moveSwimlanePopup-title'], /Premakni plavalno stezo/);
  assert.equal(data.closed, 'Zaprto');
  assert.equal(data.resolved, 'Rešeno');
  assert.equal(data.cancelled, 'Preklicano');
  assert.equal(data['carbon-copy'], 'Kopija (Cc:)');
  assert.match(data.moveChecklist, /Premakni kontrolni seznam/);
  assert.match(data.copyChecklist, /Kopiraj kontrolni seznam/);
  assert.match(data.copyChecklistFromTemplate, /iz predloge/);
  assert.match(data['password-again'], /Geslo/);
  assert.equal(data.Mongo_sessions_count, 'Število sej Mongo');
  assert.match(data.Bounce, /odskakovanjem/);
  assert.match(data.Wave, /valovanjem/);
  const correctedAdmin = ["support", "supportPopup-title", "support-title", "support-content", "accessibility-title", "accessibility-content", "accounts-lockout-locked-users", "accounts-lockout-failed-attempts", "accounts-lockout-remaining-time", "accounts-lockout-user-locked", "accounts-lockout-status", "admin-people-filter-show", "admin-people-active-status", "accounts-lockout-unlock-all", "add-cron-job", "attachments-path", "board-operations", "cron-jobs", "cron-error-severity", "cron-error-message", "cron-error-details", "cron-retry-failed", "complete", "idle", "sandstorm-storage-item", "anonymized-user", "features-notifications", "all-migrations", "select-migration", "pause", "stop", "migration-progress", "migration-status", "mongodb-gridfs-storage", "pause-all-migrations", "s3-access-key", "s3-connection-failed", "s3-endpoint", "s3-minio-storage", "s3-port-description", "s3-secret-key", "s3-secret-key-placeholder", "s3-secret-key-required", "s3-settings-saved", "save-s3-settings", "schedule-board-archive", "schedule-board-cleanup", "start-all-migrations", "stop-all-migrations", "test-s3-connection", "writable-path", "add-job", "attachment-settings", "automatic-migration", "back-to-settings", "board-migration", "card-show-lists-on-minicard", "comprehensive-board-migration", "lost-cards", "lost-cards-list", "migration-needed", "migration-complete", "migration-running", "migration-failed", "migrations", "no-issues-found", "run-migration", "migration-progress-overall", "migration-progress-status", "migration-progress-details", "steps", "view", "has-swimlanes", "step-analyze-board-structure", "step-validate-migration", "step-analyze-lists", "step-update-cards", "step-finalize", "step-restore-cards", "cleanup"];
  for (const key of correctedAdmin) {
    assert.doesNotMatch(data[key], /[\u0400-\u04ff]/, `${locale}:${key}`);
    assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), `${locale}:${key}`);
  }
  assert.equal(data.support, 'Podpora');
  assert.match(data['accounts-lockout-user-locked'], /je zaklenjen/);
  assert.equal(data['accounts-lockout-unlock-all'], 'Odkleni vse');
  assert.equal(data['s3-access-key'], 'Dostopni ključ S3');
  assert.equal(data['s3-secret-key'], 'Skrivni ključ S3');
  assert.match(data['s3-port-description'], /Številka vrat/);
  assert.equal(data['pause-all-migrations'], 'Začasno ustavi vse migracije');
  assert.equal(data['start-all-migrations'], 'Zaženi vse migracije');
  assert.equal(data['stop-all-migrations'], 'Ustavi vse migracije');
  assert.equal(data['migration-failed'], 'Migracija ni uspela');
  assert.equal(data['migration-complete'], 'Končano');
  assert.equal(data['step-restore-cards'], 'Obnovi kartice');
  assert.match(data['mongodb-gridfs-storage'], /MongoDB GridFS/);
  const correctedMonitoring = ["cleanup-old-jobs", "converting-board", "cpu-cores", "cpu-usage", "current-action", "database-migrations", "days-old", "duration", "errors", "every-1-day", "every-1-hour", "every-1-minute", "every-10-minutes", "every-30-minutes", "every-5-minutes", "every-6-hours", "export-monitoring", "filesystem-attachments", "filesystem-storage", "force-board-scan", "gridfs-size", "idle-migration", "job-description", "job-details", "job-name", "job-queue", "last-run", "max-concurrent", "memory-usage", "migration-batch-size", "migration-delay-ms", "migration-detector", "migration-log", "migration-markers", "migration-resumed", "migration-steps", "next", "next-run", "operation-type", "overall-progress", "page", "pause-migration", "previous", "refresh", "resume-migration", "run-once", "s3-size", "scanning-status", "schedule", "showing", "start-test-operation", "start-time", "step-progress", "stop-migration", "storage-distribution", "system-resources", "total-operations", "total-size", "unmigrated-boards", "weight", "cron", "current-step", "confirm", "problems-status-title", "wip-limit-group-select-swimlane", "wip-limit-group-apply-swimlane", "board-view-aging-wip", "board-view-size-cycle-time", "flow-age-days", "flow-p85", "flow-samples", "flow-episodes", "flow-history-days", "flow-size-source", "flow-size", "flow-details", "flow-note-agingWip", "flow-note-blockerAnalysis", "flow-note-monteCarlo", "flow-note-sizeCycleTime", "time-adjustment-note"];
  for (const key of correctedMonitoring) {
    assert.doesNotMatch(data[key], /[\u0400-\u04ff]/, `${locale}:${key}`);
    assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), `${locale}:${key}`);
  }
  assert.equal(data['memory-usage'], 'Poraba pomnilnika');
  assert.match(data['migration-delay-ms'], /\(ms\)/);
  assert.equal(data['resume-migration'], 'Nadaljuj migracijo');
  assert.equal(data['stop-migration'], 'Ustavi migracijo');
  assert.match(data['flow-note-agingWip'], /85.*vsaj pet/);
  assert.match(data['flow-note-agingWip'], /čas neznan/);
  assert.match(data['flow-note-blockerAnalysis'], /Prekrivajoči se vzroki se štejejo ločeno/);
  assert.match(data['flow-note-monteCarlo'], /2\.000.*UTC.*brez dokončanih/);
  assert.match(data['flow-note-monteCarlo'], /ni jamstvo.*3\.650/);
  assert.match(data['flow-note-monteCarlo'], /Brez dokončanih postavk ni napovedi/);
  assert.match(data['flow-note-sizeCycleTime'], /Manjkajoče ocene in neveljavni datumi se izpustijo/);
  assert.match(data['flow-note-sizeCycleTime'], /začetek manjka.*ustvarjanja.*konec manjka.*arhiviranja/);
  assert.match(data['time-adjustment-note'], /niso posamezne delovne seje/);
  assert.match(data['time-adjustment-note'], /Negativne vrednosti so popravki/);
  assert.equal(data.board, 'Tabla');
  for (const key of Object.keys(english).filter(key => /^(scrum-import-|sync-planning-|scrum-history-checkpoint-|ldap-sync-now)/.test(key))) {
    assert.notEqual(data[key], english[key], `${locale}:${key}`);
    assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), `${locale}:${key}`);
  }
  assert.match(data['scrum-import-into-board-hint'], /nikoli ne podvojijo/);
  assert.match(data['scrum-import-card-on-another-board'], /ostala nespremenjena/);
  assert.match(data['scrum-import-sprint-finished'], /ni bila premaknjena/);
  assert.match(data['sync-planning-hint'], /najprej po ID-ju v viru, nato po imenu/);
  assert.match(data['sync-planning-hint'], /prva sinhronizacija pa nikoli ne odstrani/);
  assert.match(data['scrum-history-checkpoint-hint'], /ni spremenil nihče drug/);
  assert.match(data['scrum-history-checkpoint-hint'], /noben zapis pa se ne spremeni/);
  assert.match(data['scrum-history-checkpoint-discard-confirm'], /že zapisala/);
  assert.match(data['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS/);
  assert.match(data['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED/);
  assert.ok(data['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.ok(data['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  assert.match(data['r-moved-forward'], /naprej/);
  assert.match(data['r-moved-back'], /nazaj/);
  assert.match(data['login-origin-mismatch'], /ROOT_URL/);
  assert.match(data['login-setting-env-only'], /samo strežniško okolje/);
  for (const key of Object.keys(english).filter(key => key.startsWith('stuck-sync-operation-'))) {
    assert.notEqual(data[key], english[key], `${locale}:${key}`);
    assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), `${locale}:${key}`);
  }
  assert.match(data['stuck-sync-operation-description'], /že uveljavljene spremembe ostanejo/);
  assert.match(data['stuck-sync-operation-description'], /preostale shranjene spremembe se nikoli ne zapišejo/);
  assert.match(data['stuck-sync-operation-discard-confirm'], /že uveljavila, ostanejo/);
  assert.match(data['stuck-sync-operation-replayable-now'], /ni mogoče zavreči/);
  assert.match(data['stuck-sync-operation-replayable'], /ni bila zavržena/);
  assert.match(data['stuck-sync-operation-truncated'], /50 najstarejših/);
  assert.match(data['stuck-sync-operation-reason-access-denied'], /nima več pravice do pisanja/);
  assert.equal(data.swimlane, 'Plavalna steza');
  for (const key of Object.keys(english).filter(key => key.startsWith('interrupted-import-'))) {
    assert.notEqual(data[key], english[key], `${locale}:${key}`);
    assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), `${locale}:${key}`);
    assert.doesNotMatch(data[key], /[\u0400-\u04ff]/, `${locale}:${key}`);
  }
  assert.match(data['interrupted-import-description'], /ni mogoče nadaljevati/);
  assert.match(data['interrupted-import-description'], /vključno z vsem, kar je bilo dodano pozneje/);
  assert.match(data['interrupted-import-keep-confirm'], /Nič se ne odstrani/);
  assert.match(data['interrupted-import-discard-confirm'], /trajno odstranita/);
  assert.match(data['interrupted-import-foreign-board'], /ni bila spremenjena/);
  assert.match(data['interrupted-import-truncated'], /50 najstarejših/);
  for (const key of ['Cube-Grid', 'Double-Bounce', 'MongoDB_storage_engine', 'Node_heap_does_zap_garbage', 'Node_heap_heap_size_limit', 'Node_heap_malloced_memory', 'Node_heap_number_of_detached_contexts', 'Node_heap_number_of_native_contexts']) assert.doesNotMatch(data[key], /[А-Яа-яЁё]/);
  assert.match(data['Double-Bounce'], /dvojnim odskakovanjem/);
  assert.doesNotMatch(data['Double-Bounce'], /tri pike/);
  assert.match(data['Node_heap_does_zap_garbage'], /bitnim vzorcem/);
  assert.doesNotMatch(data['Node_heap_does_zap_garbage'], /zbiranje smeti/);
  assert.match(data['Node_heap_malloced_memory'], /funkcijo malloc/);
  assert.match(data['Node_heap_number_of_detached_contexts'], /ločenih kontekstov/);
  assert.match(data['Node_heap_number_of_native_contexts'], /izvornih kontekstov/);
  assert.match(data.Node_memory_usage_rss, /rezidentnega nabora/);
  assert.doesNotMatch(data.Node_memory_usage_rss, /nastavljena vrednost/);
  assert.match(data.Node_heap_total_heap_size_executable, /izvršljivo kodo/);
  assert.match(data.Node_heap_peak_malloced_memory, /največja količina.*malloc/);
  assert.equal(data.Reactivity_mode, 'Način reaktivnosti (changeStreams / oplog / polling)');
  assert.match(data['accessibility-info-not-added-yet'], /dostopnosti še niso dodane/);
  assert.match(data['accessibility-page-enabled'], /je omogočena/);
  assert.match(data['accounts-lockout-confirm-unlock-all'], /vse zaklenjene uporabnike/);
  assert.match(data['accounts-lockout-failure-window'], /neuspelih poskusov \(sekunde\)/);
  assert.match(data['accounts-lockout-failures-before'], /pred zaklepanjem/);
  assert.match(data['accounts-lockout-info'], /napadi z grobo silo/);
  assert.doesNotMatch(data['accounts-lockout-info'], /lozinkef/);
  assert.equal(data.MongoDB_storage_engine, 'Shranjevalni pogon MongoDB');
  assert.match(data['vote-public'], /kdo je glasoval za kaj/);
  assert.doesNotMatch(data['vote-public'], /rezultate javnega/);

  assert.match(data['toggle-assignees'], /1-9.*vrstnem redu dodajanja na tablo/);
  assert.match(data['toggle-labels'], /1-9.*Večkratna izbira doda oznake 1-9/);
  for (const key of ['user-can-not-export-card-to-pdf', 'user-can-not-export-excel']) assert.match(data[key], /Uporabnik ne more izvoziti/);
  assert.match(data['vote-delete-pop'], /Brisanje je trajno.*vsa dejanja.*glasovanjem/);

  assert.match(data['support-info-only-for-logged-in-users'], /samo prijavljenim uporabnikom/);
  assert.match(data['support-page-enabled'], /je omogočena/);
  assert.doesNotMatch(data['support-page-enabled'], /potrebujem/);
  assert.match(data['swimlane-height-error-message'], /pozitivno celo število/);
  assert.match(data['tableVisibilityMode-allowPrivateOnly'], /samo zasebne table/);

  assert.match(data['step-delete-duplicate-empty-lists'], /podvojene prazne sezname/);
  assert.match(data['step-ensure-per-swimlane-lists'], /posamezne steze/);
  assert.match(data['step-fix-orphaned-cards'], /osirotele kartice/);
  assert.doesNotMatch(data['step-fix-orphaned-cards'], /zavržene|odstranjene/);
  assert.notEqual(data['step-restore-lists'], data['step-restore-swimlanes']);

  assert.match(data['showSum-field-on-list'], /vsoto polj na vrhu seznama/);
  assert.doesNotMatch(data['showSum-field-on-list'], /število polj/);
  assert.match(data['show-card-counter-per-list'], /število kartic na seznam/);
  for (const key of ['show-list-on-minicard', 'showChecklistAtMinicard']) assert.match(data[key], /mini kartici/);
  assert.match(data['show-board_members-avatar'], /avatarje članov table/);

  assert.match(data['search-cards'], /naslovih kartic in seznamov, opisih.*poljih po meri na tej tabli/);
  assert.match(data['server-error-troubleshooting'], /`sudo snap logs wekan.wekan`/);
  assert.match(data['server-error-troubleshooting'], /`sudo docker logs wekan-app`/);
  assert.match(data['set-swimlane-height-value'], /slikovne pike/);
  assert.equal(data['set-swimlane-height'], data['setSwimlaneHeightPopup-title']);

  assert.match(data['s3-enabled-description'], /AWS S3 ali MinIO.*shranjevanje datotek/);
  assert.match(data['s3-endpoint-description'], /URL.*s3.amazonaws.com ali minio.example.com/);
  assert.match(data['s3-region-description'], /us-east-1/);
  assert.match(data['s3-ssl-enabled-description'], /SSL\/TLS.*povezave s S3/);
  assert.doesNotMatch(data['s3-ssl-enabled-description'], /Amazon/);
  assert.match(data['schedule-board-backup'], /varnostno kopiranje table/);

  assert.match(data['run-delete-duplicate-empty-lists-migration-confirm'], /najprej.*posamezne steze.*nato.*enakim naslovom.*vsebuje kartice.*samo odvečni prazni/);
  assert.match(data['run-restore-all-archived-migration-confirm'], /VSE arhivirane steze, sezname in kartice.*samodejno.*ni mogoče zlahka razveljaviti/);
  assert.match(data['run-restore-lost-cards-migration-confirm'], /swimlaneId ali listId.*samo na nearhivirane postavke/);
  assert.doesNotMatch(data['s3-attachments'], /Amazon|oblak/);

  assert.match(data['restore-all-archived-migration-description'], /vse arhivirane steze, sezname in kartice.*swimlaneId ali listId.*vidne/);
  assert.match(data['restore-lost-cards-migration-description'], /kartice in sezname.*swimlaneId ali listId.*Ustvari stezo »Lost Cards«.*znova vidne/);
  assert.match(data['restore-lost-cards-nothing-to-restore'], /stez, seznamov ali kartic/);
  assert.match(data['rescue-card-description-dialogue'], /Prepišem trenutni opis.*vašimi spremembami/);
  assert.match(data['run-comprehensive-migration-confirm'], /celovitosti podatkov table.*nekaj trenutkov.*nadaljevati/);

  for (const key of ['read-assigned-only-desc', 'read-only-desc']) assert.match(data[key], /Ne more urejati/);
  assert.match(data['read-assigned-only-desc'], /samo dodeljene kartice/);
  assert.match(data['poker-delete-pop'], /Brisanje je trajno.*vsa dejanja/);
  assert.match(data['remove-labels-multiselect'], /odstrani oznake 1-9/);
  assert.match(data['r-board-note'], /polje prazno.*vsako možno vrednostjo/);
  assert.match(data['preview-pdf-not-supported'], /predogleda PDF.*prenesti/);

  assert.equal(data['no-comments-desc'], 'Ne more videti komentarjev.');
  assert.match(data['normal-assigned-only-desc'], /samo dodeljene kartice.*običajni uporabnik/);
  assert.match(data['notify-participate'], /ustvarjalec ali član/);
  assert.match(data['operator-debug-invalid'], /predikat za razhroščevanje/);
  assert.match(data['operator-limit-invalid'], /pozitivno celo število/);

  assert.match(data['multi-selection-active'], /potrditvena polja.*izbiro tabel/);
  assert.equal(data['myCardsSortChange-choice-board'], 'Po tabli');
  assert.equal(data['myCardsSortChange-title'], data['myCardsSortChangePopup-title']);
  assert.notEqual(data['myCardsViewChangePopup-title'], data['myCardsSortChangePopup-title']);
  assert.match(data.newlineBecomesNewChecklistItemOriginOrder, /Vsaka vrstica.*kontrolnega seznama.*izvirnem vrstnem redu/);
  assert.equal(data['no-assignee'], data['filter-no-assignee']);

  assert.match(data['migrations-admin-only'], /samo skrbniki table/);
  assert.match(data['migrations-description'], /celovitosti podatkov te table.*Vsako selitev.*posebej/);
  for (const backend of ['fs', 'gridfs', 's3']) {
    assert.match(data[`move-all-attachments-of-board-to-${backend}`], /vse priponke table/);
    assert.match(data[`move-all-attachments-to-${backend}`], /vse priponke v/);
    assert.doesNotMatch(data[`move-all-attachments-to-${backend}`], /table/);
  }
  for (const key of ['move-all-attachments-of-board-to-s3', 'move-all-attachments-to-s3']) assert.doesNotMatch(data[key], /Amazon|oblak/);

  assert.match(data['migration-info-text'], /enkrat.*zmogljivost sistema.*ozadju.*zaprete brskalnik/);
  assert.match(data['migration-warning-text'], /ne zapirajte brskalnika.*ozadju.*traja dlje/);
  assert.match(data['migration-progress-note'], /tablo na najnovejšo strukturo/);
  assert.match(data['migration-stop-confirm'], /vse selitve/);
  assert.match(data['migration-paused'], /začasno ustavljene/);
  assert.doesNotMatch(data['migration-stopped'], /začasno/);
  for (const key of ['migration-pause-failed', 'migration-resume-failed', 'migration-start-failed', 'migration-stop-failed']) assert.match(data[key], /ni uspe/);

  assert.match(data['migration-cpu-threshold-description'], /Začasno ustavi.*preseže.*\(10-90\)/);
  assert.doesNotMatch(data['migration-cpu-threshold-description'], /doseže/);
  assert.match(data['migration-batch-size-description'], /priponk.*vsakem paketu.*\(1-100\)/);
  assert.match(data['migration-delay-ms-description'], /med paketi v milisekundah.*\(100-10000\)/);
  for (const key of ['max-avatar-filesize', 'max-upload-filesize']) assert.match(data[key], /v bajtih/);
  assert.doesNotMatch(data['migrate-all-to-s3'], /Amazon|oblak/);

  assert.match(data['import-board-zip'], /\.zip.*JSON tabel.*podmapami.*priponke/);
  assert.match(data['import-members-map-note'], /Nepreslikani člani.*trenutnemu uporabniku/);
  assert.match(data['keyboard-shortcuts-disabled'], /onemogočene.*Kliknite.*omogočite/);
  assert.match(data['keyboard-shortcuts-enabled'], /so omogočene.*Kliknite.*onemogočite/);
  for (const key of ['invite-people-error', 'invite-people-success']) assert.match(data[key], /registracijo/);
  assert.match(data['label-color-not-found'], /Barva oznake %s/);

  assert.match(data['globalSearch-instructions-status-ended'], /z datumom konca/);
  assert.doesNotMatch(data['globalSearch-instructions-status-ended'], /dokončane/);
  assert.match(data['globalSearch-instructions-status-private'], /samo na zasebnih tablah/);
  assert.match(data['globalSearch-instructions-status-public'], /samo na javnih tablah/);
  assert.doesNotMatch(data['globalSearch-instructions-status-public'], /internet/);
  assert.match(data['globalSearch-instructions-status-all'], /arhivirane in nearhivirane/);
  assert.match(data['globalSearch-instructions-operator-user'], /član ali zadolženi uporabnik/);
  assert.notEqual(data.hideAllChecklistItems, data.hideCheckedChecklistItems);
  assert.match(data.hideCheckedChecklistItems, /označene postavke/);

  assert.match(data['globalSearch-instructions-operator-has'], /`has:-due`.*brez roka/);
  assert.match(data['globalSearch-instructions-operator-label'], /\*<color>\* ali \*<name>\*/);
  assert.match(data['globalSearch-instructions-operator-due'], /največ.*pretečenim rokom/);
  for (const key of ['globalSearch-instructions-operator-created', 'globalSearch-instructions-operator-modified']) assert.match(data[key], /največ/);
  for (const key of ['globalSearch-instructions-operator-org', 'globalSearch-instructions-operator-team']) assert.match(data[key], /kartice na tabli, dodeljeni/);
  assert.match(data['globalSearch-instructions-operator-limit'], /pozitivno celo število.*na stran/);
  assert.match(data['globalSearch-instructions-operator-sort'], /padajoče.*`-`/);

  assert.match(data['fix-all-file-urls-migration-description'], /vseh datotečnih priponk.*pravilno zaledje.*poškodovane sklice/);
  assert.match(data['fix-avatar-urls-migration-description'], /članov table.*pravilno zaledje.*poškodovane sklice/);
  assert.match(data['globalSearch-instructions-notes-2'], /logičnim \*ALI\*.*katerega koli/);
  assert.match(data['globalSearch-instructions-notes-3'], /logičnim \*IN\*.*vse različne/);
  assert.match(data['globalSearch-instructions-notes-5'], /Privzeto.*ne preiskujejo/);
  assert.match(data['globalSearch-instructions-description'], /`list:Blocked`.*`__operator_list__:"To Review"`/);

  assert.match(data['dueCardsViewChange-choice-all-description'], /vse nedokončane kartice.*\*roka\*.*uporabnik dovoljenje/);
  assert.match(data['editVoteEndDatePopup-title'], /datum konca glasovanja/);
  assert.match(data['editPokerEndDatePopup-title'], /datum konca glasovanja.*pokru načrtovanja/);
  assert.match(data['filter-due-next-week'], /naslednji teden/);
  assert.match(data['filter-due-this-week'], /ta teden/);
  assert.notEqual(data['filter-due-next-week'], data['filter-due-this-week']);
  assert.match(data['error-csv-schema'], /CSV.*vejicami.*TSV.*tabulatorji.*pravilni obliki/);

  assert.match(data['custom-field-stringtemplate-separator'], /&#32;.*&nbsp;/);
  assert.match(data['custom-top-left-corner-logo-height'], /Privzeto: 27/);
  assert.match(data['delete-duplicate-empty-lists-migration-description'], /nimajo kartic IN.*enakim naslovom.*vsebuje kartice/);
  for (const key of ['delete-all-notifications-confirm', 'delete-org-confirm-popup', 'delete-team-confirm-popup', 'delete-translation-confirm-popup']) assert.match(data[key], /ni mogoče razveljaviti/);
  for (const key of ['delete-org-warning-message', 'delete-team-warning-message']) assert.match(data[key], /ni mogoče izbrisati.*vsaj en uporabnik/);
  assert.match(data['delete-linked-cards-before-this-list'], /najprej.*povezanih kartic.*kažejo na kartice na tem seznamu/);

  assert.match(data['conversion-info-text'], /enkrat na tablo.*izboljša zmogljivost.*še naprej uporabljate/);
  assert.match(data['created-at-newest-first'], /ustvarjanja.*najnovejše/);
  assert.match(data['created-at-oldest-first'], /ustvarjanja.*najstarejše/);
  assert.match(data['cron-no-errors'], /za prikaz/);
  assert.doesNotMatch(data['cron-no-errors'], /nikoli|zgodile/);
  assert.match(data['cron-no-failed-migrations'], /neuspelih selitev.*ponovni poskus/);
  assert.match(data['cron-no-paused-migrations'], /začasno ustavljenih selitev.*nadaljevanje/);
  assert.match(data['custom-field-stringtemplate-format'], /%\{value\}/);
  assert.doesNotMatch(data['custom-field-stringtemplate-format'], /%\{вредност\}/);

  for (const action of ['archive', 'backup', 'cleanup']) {
    assert.match(data[`board-${action}-failed`], /Načrtovanje.*ni uspelo/);
    assert.match(data[`board-${action}-scheduled`], /uspešno načrtovano/);
  }
  assert.match(data['comment-assigned-only-desc'], /samo dodeljene kartice.*samo komentira/);
  assert.match(data['comment-not-found'], /Kartica s komentarjem/);
  assert.match(data['card-sorting-by-number-on-minicard'], /mini kartici/);
  assert.notEqual(data['checklistDeletePopup-title'], data['checklistItemDeletePopup-title']);
  assert.match(data['checklistItemDeletePopup-title'], /postavko/);
  assert.doesNotMatch(data['bucket-example'], /2025|delovod/);
  for (const key of ['azure-account-key-menu-path', 'azure-connection-string-menu-path']) assert.match(data[key], /vaš račun.*key1/);

  assert.match(data['admin-desc'], /odstranjuje člane.*nastavitve table.*dejavnosti/);
  for (const key of ['admin-people-filter-inactive', 'admin-people-user-active', 'admin-people-user-inactive']) assert.doesNotMatch(data[key], /плат|plač|sodelovan/);
  assert.match(data['admin-people-user-active'], /aktiven.*deaktivacijo/);
  assert.match(data['admin-people-user-inactive'], /neaktiven.*aktivacijo/);
  assert.match(data.allowNonBoardMembers, /vsem prijavljenim uporabnikom/);
  assert.doesNotMatch(data.allowNonBoardMembers, /glas|član/);
  assert.match(data['automatic-linked-url-schemes'], /Sheme URL.*Ena shema URL na vrstico/);
  assert.doesNotMatch(data['attachment-move-storage-s3'], /Amazon|oblak/);
  assert.match(data['always-field-on-card'], /vse kartice/);
  assert.match(data['automatically-field-on-card'], /nove kartice/);

}
console.log('slovenianAuditedTranslations: both locales, spinner and memory meanings passed');

(async () => {
  for (const locale of ['sl', 'sl_SI']) {
    const data = require(`../imports/i18n/data/${locale}.i18n.json`);
    assert.match(data['accounts-lockout-known-users'], /pravilno uporabniško ime, napačno geslo/);
    assert.match(data['accounts-lockout-unknown-users'], /neobstoječe uporabniško ime/);
    assert.match(data['accounts-lockout-period'], /\(sekunde\)/);
    assert.match(data['accounts-lockout-show-locked-users'], /samo zaklenjene uporabnike/);
    assert.match(data['accounts-lockout-user-unlocked'], /uspešno odklenjen/);
    const translator = require('i18next').createInstance().use(require('i18next-sprintf-postprocessor'));
    await translator.init({ lng: locale, fallbackLng: false, keySeparator: false, interpolation: { prefix: '__', suffix: '__', escapeValue: false }, resources: { [locale]: { translation: data } }, postProcess: ['sprintf'] });
    for (const [key, date] of [['activity-endDate', 'konca'], ['activity-receivedDate', 'prejema'], ['activity-startDate', 'začetka']]) assert.equal(translator.t(key, { sprintf: ['DATE', 'CARD'] }), `je spremenil datum ${date} na DATE za kartico CARD`);
    assert.equal(translator.t('activity-dueDate', { sprintf: ['DATE', 'CARD'] }), 'je spremenil rok na DATE za kartico CARD');
    assert.equal(translator.t('operator-number-expected', { operator: 'OP', value: 'TEXT' }), "Operator OP je pričakoval število, prejel pa 'TEXT'");
    assert.equal(data['act-completeChecklist'], data['activity-checklist-completed-card']);
    assert.match(data['act-completeChecklist'], /dokončal kontrolni seznam/);
    assert.doesNotMatch(data['act-completeChecklist'], /završio|provjere/);
    assert.equal(translator.t('act-atUserComment', { card: 'CARD', comment: 'COMMENT', list: 'LIST', swimlane: 'LANE', board: 'BOARD' }), 'vas je omenil na kartici CARD: COMMENT na seznamu LIST v stezi LANE na tabli BOARD');
  }
  console.log('slovenianAuditedTranslations: credential distinctions, seconds and real mention rendering passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
