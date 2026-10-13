// Check the full filtered inventory, including pending feature strings.
// This does not certify fluency or cover exempt prose.
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
const corsican = readLocale('co');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'co',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Corsican value stays translated');

assert.deepEqual(Object.keys(corsican), Object.keys(english),
  'Corsican key inventory and order match English');
for (const [key, value] of Object.entries(corsican)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(corsican.add, 'Aghjunghje');
assert.equal(corsican.board, 'Tavula');
assert.equal(corsican.card, 'Carta');
assert.equal(corsican.delete, 'Squassà');
assert.equal(corsican.save, 'Arregistrà');
assert.match(corsican['board-members-same-org-only'], /urganizazione/i);
assert.deepEqual(tokens(corsican['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(corsican['activity-changedTitle']), ['%s', '%s']);



// Newer linked-card features are outside the historical completed-catalog gate.
const cardLinkKeys = Object.keys(english).filter(key => /^(?:attach-card(?:-|$)|attachCardPopup-title$|attached-card-unavailable$|detach-card$|custom-field-link|custom-field-unlink$|field-link-|cardCustomFieldLinksPopup-title$)/.test(key));
assert.equal(cardLinkKeys.length, 30);
for (const key of cardLinkKeys) {
  assert.notEqual(corsican[key], english[key], `${key}: no English fallback`);
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
}
assert.match(corsican['custom-field-links-hint'], /listessu nome è tippu/);
assert.match(corsican['custom-field-links-hint'], /una sola carta fermanu senza cambiamentu/);
assert.match(corsican['custom-field-link-both'], /duie direzzioni/);
assert.match(corsican['custom-field-link-send'], /una sola direzzione.*carta principale/);
assert.match(corsican['custom-field-link-sends'], /sta carta.*quella carta/);
assert.match(corsican['custom-field-link-receives'], /quella carta.*sta carta/);
assert.match(corsican['field-link-not-allowed'], /mudificà e duie carte/);
assert.doesNotMatch(corsican['field-link-not-allowed'], /vede e duie carte/);
assert.match(corsican['custom-field-link-inactive'], /ùn pò più mudificà.*archiviata/);
assert.match(corsican['attach-card-not-found'], /nisuna carta chì pudete vede/);
assert.match(corsican['field-link-self'], /ùn pò micca.*ella stessa/);
assert.match(corsican['field-link-archived'], /archiviata ùn pò micca/);



const recoveryKeys = Object.keys(english).filter(key => /^(stuck-sync-operation-|interrupted-import-)/.test(key));
assert.equal(recoveryKeys.length, 48);
for (const key of recoveryKeys) {
  assert.notEqual(corsican[key], english[key], `${key}: recovery message translated`);
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
}
assert.match(corsican['stuck-sync-operation-description'], /cambiamenti digià appiicati fermanu/);
assert.match(corsican['stuck-sync-operation-description'], /ùn seranu mai scritti/);
assert.match(corsican['stuck-sync-operation-description'], /paragunerà torna a lista cù a so fonte/);
assert.match(corsican['stuck-sync-operation-replayable'], /ùn hè micca stata abbandunata/);
assert.match(corsican['stuck-sync-operation-not-stuck'], /ùn pò micca esse abbandunata/);
assert.match(corsican['interrupted-import-description'], /schedariu fonte ùn hè micca cunservatu/);
assert.match(corsican['interrupted-import-description'], /ancu ciò chì ci hè statu aghjuntu dopu/);
assert.match(corsican['interrupted-import-keep-confirm'], /Nunda hè squassatu/);
assert.doesNotMatch(corsican['interrupted-import-keep-confirm'], /squassati definitivamente/);
assert.match(corsican['interrupted-import-discard-confirm'], /tuttu ciò ch'ella cuntene sò squassati definitivamente/);
assert.match(corsican['interrupted-import-foreign-board'], /ùn hè micca stata mudificata/);



const notificationKeys = Object.keys(english).filter(key => /^(webhook-payload-|webhook-hide-identity$|webhook-someone$|notification-delivery-|notification-group-)/.test(key));
assert.ok(notificationKeys.length >= 39);
for (const key of notificationKeys) {
  assert.notEqual(corsican[key], english[key], `${key}: notification message translated`);
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
}
assert.match(corsican['webhook-payload-description'], /paràmetru ereditatu/);
assert.match(corsican['webhook-payload-description'], /s'ellu ùn hè definitu nunda.*sempre mandatu/);
assert.match(corsican['webhook-payload-field-standard'], /WEBHOOKS_ATTRIBUTES/);
assert.match(corsican['webhook-hide-identity'], /Ùn mette micca u mo nome/);
assert.match(corsican['notification-delivery-quiet'], /aspittà ch'elle finiscanu/);
assert.doesNotMatch(corsican['notification-delivery-quiet'], /squassà|abbandunà/);
assert.match(corsican['notification-delivery-grouping-all'], /un solu messagiu/);
assert.match(corsican['notification-delivery-grouping-none'], /separatamente/);
assert.match(corsican['notification-delivery-schedule-daily'], /Una volta à ghjornu/);

console.log('corsicanTranslationProgress: historical catalog and translated feature checks passed');

const controlKeys = ["board-announcement", "board-announcement-enabled", "board-view-calendar-mode", "cards-use-list-color", "import-members-mode-heading", "import-members-mode-map", "import-members-mode-placeholder", "import-members-mode-me", "csv-mapping-title", "csv-mapping-description", "csv-mapping-not-in-file", "csv-mapping-column-number", "csv-mapping-list-missing", "csv-mapping-list-name", "csv-mapping-custom-fields", "csv-mapping-boards", "csv-mapping-skipped-sheets", "csv-mapping-title-required", "csv-mapping-list-required", "invalid-import-mapping", "import-many-boards", "import-many-boards-hint", "import-one-board-per-project", "import-one-board-per-project-hint", "import-many-progress", "import-many-results-heading", "import-many-imported", "export-all-boards", "export-selected-boards", "export-all-boards-hint", "exportAllBoardsPopup-title", "exportToTrelloPopup-title", "trello-export-desc", "trello-export-include-attachments", "trello-export-start", "trello-export-open-board", "trello-export-warnings", "sandstorm-trello-access-needed", "sandstorm-allow-trello-access", "sandstorm-trello-access-granted", "sandstorm-forget-access", "sandstorm-trello-save-label", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "read-only-field", "r-wrike-workflow", "r-wrike-workflow-note", "r-export-wrike-workflow", "r-import-wrike-workflow", "r-import-wrike-workflow-done", "r-moved-forward", "r-moved-back", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "import-file-label", "subtask-mark-done", "subtask-mark-not-done", "subtask-done-no-permission", "login-setting-env-only"];
for (const key of controlKeys) {
  assert.notEqual(corsican[key], english[key], key);
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
}
for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) assert.ok(corsican['external-link-rules-description'].includes(literal));
for (const literal of ['Active', 'Completed', 'Deferred', 'Cancelled', 'GET /workflows', 'JSON']) assert.ok(corsican['r-wrike-workflow-note'].includes(literal));
for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(corsican['ldap-sync-now-nothing'].includes(literal));
assert.match(corsican['trello-export-desc'], /Swimlane: …/);
assert.match(corsican['import-members-mode-placeholder'], /utilizatori pruvisori cù i so nomi.*utilizatori veri più tardi/);
assert.match(corsican['csv-mapping-description'], /curregite quelle sbagliate.*micca in u schedariu/);
assert.match(corsican['import-many-boards-hint'], /senza associu di i membri/);
assert.match(corsican['import-many-boards-hint'], /una sola espurtazione.*una sola tavula/);
assert.match(corsican['export-all-boards-hint'], /chì pudete espurtà.*Excel.*fogliu.*altru furmatu.*\.zip/);
assert.match(corsican['sandstorm-trello-access-needed'], /ùn hà micca accessu propiu.*prima/);
assert.match(corsican['trello-export-warnings'], /Ùn hè statu pussibule/);
assert.match(corsican['r-wrike-workflow-note'], /compia.*Completed o Cancelled.*micca compia.*Active o Deferred/);
assert.match(corsican['r-wrike-workflow-note'], /ùn ponu micca esse espurtate/);
assert.match(corsican['read-only-field'], /ogni membru vede.*solu l'amministratori/);
assert.match(corsican['login-setting-env-only'], /Solu l'ambiente di u servore.*sola lettura/);
assert.match(corsican['oauth-providers-allowed-email-domains'], /virgule; viotu permette tutti/);
assert.match(corsican['subtask-mark-not-done'], /micca compiu/);
assert.doesNotMatch(corsican['subtask-mark-done'], /micca/);
assert.match(corsican['subtask-done-no-permission'], /Ùn pudete micca cambià/);

for (const format of ['opml','orgmode','meistertask','obsidian','linear','ticktick','clickup','nullboard','kanri','pivotal','tasksorg','monday','superproductivity','taiga','vikunja','quire','wrike','teamwork','businessmap','redmine','notion','plane']) {
  const key = 'import-board-instruction-' + format;
  assert.notEqual(corsican[key], english[key], key);
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
}
for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(corsican['import-board-instruction-orgmode'].includes(literal));
for (const literal of ['Tasklist', 'Task', 'Description', 'Assign to', 'Start date', 'Due date', 'Priority', 'Estimated time', 'Tags', 'Status', '--', '##', '>>']) assert.ok(corsican['import-board-instruction-teamwork'].includes(literal));
for (const format of ['nullboard','kanri']) assert.match(corsican['import-board-instruction-' + format], /solu a prima tavula hè impurtata/);
for (const format of ['taiga','vikunja']) assert.match(corsican['import-board-instruction-' + format], /appicci ùn sò micca impurtati/);
assert.match(corsican['import-board-instruction-taiga'], /epiche è e richieste anu i so curridori distinti/);
assert.match(corsican['import-board-instruction-vikunja'], /percentuale di compimentu è statu compiu diventanu campi persunalizati/);
assert.match(corsican['import-board-instruction-quire'], /cummenti è l'appicci ùn sò micca in u CSV/);
assert.match(corsican['import-board-instruction-notion'], /rilazioni, imagine è appicci ùn sò micca impurtati/);
assert.match(corsican['import-board-instruction-plane'], /ùn cuntene nè discrizzioni nè appicci/);
assert.match(corsican['import-board-instruction-businessmap'], /rinumate prima a linea d'intestazione in inglese/);
assert.match(corsican['import-board-instruction-redmine'], /English in My account prima d'espurtà/);

const activityCorrectionKeys = ["activity-changedDescription", "activity-added", "activity-archived", "activity-attached", "activity-created", "activity-changedListTitle", "activity-excluded", "activity-imported", "activity-imported-board", "activity-joined", "activity-on", "activity-sent", "activity-unjoined", "activity-subtask-added", "activity-checked-item", "activity-unchecked-item", "activity-checklist-added", "activity-checklist-item-added", "activity-checklist-item-removed", "activity-checked-item-card", "activity-unchecked-item-card", "activity-checklist-completed-card"];
for (const key of activityCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /modificata|spostato|creato|rinominata|escluso|importato|inviato|abbandonato|sottocompito|selezionata|disattivato|elemento|è stato|deselezionato|completata|controllo/, key);
}
assert.equal(corsican['activity-created'], 'hà creatu %s');
assert.equal(corsican['activity-subtask-added'], 'hà aghjuntu un sottucompitu à %s');
assert.doesNotMatch(corsican['activity-subtask-added'], /1%s/);
assert.match(corsican['activity-checked-item'], /hà marcatu/);
assert.match(corsican['activity-unchecked-item'], /hà cacciatu a marca/);
assert.match(corsican['activity-checklist-item-added'], /à '%s' in %s/);
assert.match(corsican['activity-checklist-item-removed'], /da '%s' in %s/);

const notificationCorrectionKeys = ["act-deleteCard", "act-removeSwimlane", "act-addAttachment", "act-deleteAttachment", "act-addSubtask", "act-addLabel", "act-addedLabel", "act-removeLabel", "act-removedLabel", "act-addChecklist", "act-addChecklistItem", "act-removeChecklist", "act-removeChecklistItem", "act-checkedItem", "act-uncheckedItem", "act-completeChecklist", "act-uncompleteChecklist", "act-addComment", "act-editComment", "act-deleteComment", "act-createSwimlane", "act-createCard", "act-createCustomField", "act-deleteCustomField", "act-setCustomField", "act-createList", "act-addBoardMember", "act-archivedCard", "act-archivedList", "act-archivedSwimlane", "act-importBoard", "act-importCard", "act-importList", "act-joinMember", "act-moveCard", "act-moveCardToOtherBoard", "act-removeBoardMember", "act-restoredCard", "act-unjoinMember"];
for (const key of notificationCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  const prose = corsican[key].replace(/__[A-Za-z0-9_]+__/g, '');
  assert.doesNotMatch(prose, /\b(?:alla|dalla|swimlane|swim lane|allegatu|sottotask|Rimossa|rimossa|controllo|elemento|attivato|disattivato|completata|creato|campo|personalizzato|Corsia|importato|importata|spostata|ripristinata)\b/, key);
}
assert.match(corsican['act-moveCard'], /da a lista __oldList__.*à a lista __list__/);
assert.match(corsican['act-moveCardToOtherBoard'], /__oldBoard__.*à a lista __list__.*__board__/);
assert.match(corsican['act-removeChecklistItem'], /__checkList__/);
assert.match(corsican['act-uncheckedItem'], /cacciatu a marca/);
assert.match(corsican['act-uncompleteChecklist'], /micca compia/);
assert.doesNotMatch(corsican['act-completeChecklist'], /micca/);
assert.match(corsican['act-deleteCustomField'], /squassatu u campu persunalizatu/);
assert.match(corsican['act-addAttachment'], /appicciu/);

const permissionCorrectionKeys = ["board-members-same-org-only", "board-members-same-team-only", "comment-in-reply-to", "comment-reply", "restrict-comment-editing", "error-user-notSameOrgOrTeam", "subtasks", "subtaskDeletePopup-title", "subtaskActionsPopup-title", "task", "card-delete-suggest-archive", "card-edit-custom-fields", "cardCustomFieldsPopup-title", "map-to-existing-user-search", "add-card-to-top-of-list", "add-card-to-bottom-of-list", "list-width-shared-note", "personal-list-width-description", "close-add-checklist-item", "close-edit-checklist-item", "admin-desc", "attachmentDeletePopup-title", "show-board_members-avatar", "board_assignees", "card_assignees", "card-archive-suggest-cancel", "list-archive-suggest", "swimlane-archive-suggest", "allowNonBoardMembers", "deleteVotePopup-title", "userAnonymizePopup-title", "deleteAvatarPopup-title", "comment-only-desc", "deleteCommentPopup-title", "read-only-desc", "read-assigned-only-desc", "checklistDeletePopup-title"];
for (const key of permissionCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Puoi|Può|gli|dallo|dalla|alla|Eliminare|modificare|personalizzati|Compito|Sotto-compiti|assegnatari|registrati|importazione)\b/, key);
}
assert.match(corsican['restrict-comment-editing'], /Impedisce.*amministratori.*mudificà o squassà.*altri utilizatori/);
assert.match(corsican['read-only-desc'], /Ùn pò micca mudificà/);
assert.match(corsican['read-assigned-only-desc'], /Solu e carte assignate.*Ùn pò micca mudificà/);
assert.match(corsican['comment-only-desc'], /solu cummentà/);
assert.match(corsican['allowNonBoardMembers'], /cunnessi/);
assert.doesNotMatch(corsican['allowNonBoardMembers'], /arregistrati/);
assert.equal(corsican['userAnonymizePopup-title'], 'Anonimizà u contu');
assert.match(corsican['card-delete-suggest-archive'], /archiviu.*cunservà a so attività/);
assert.match(corsican['personal-list-width-description'], /attivu.*ogni utilizatore.*disattivu.*spartute cù tutti/);
assert.equal(corsican.subtasks, 'Sottucompiti');

const boardCorrectionKeys = ["allboards.delete-workspace-confirm", "list-width-personal-note", "fixed-list-width-note", "archive-board-confirm", "card_members", "board-private-info", "board-public-info", "card-archived", "board-archived", "card-comments-title", "map-to-existing-user-no-results", "delete-avatar-confirm", "comment-delete", "no-comments", "confirm-checklist-item-delete-popup", "checklistItemDeletePopup-title", "custom-color", "custom-field-delete-pop", "deleteCustomFieldPopup-title", "deleteLabelPopup-title", "email-invite-text", "push-invite-text", "error-board-doesNotExist", "error-import-empty-board", "error-list-doesNotExist", "error-linked-card-not-allowed", "export-card-excel-no-disk-space", "filter-no-member", "filter-no-assignee", "filter-on-desc", "import-board-instruction-zenkit", "import-board-instruction-jira", "import-board-instruction-excel"];
for (const key of boardCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.deepEqual(tags(corsican[key]), tags(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Sei sicuro|Questa|Nessun|Puoi|Impossibile|Eliminare|personalizzato|Caro|Incolla|Scegli|esportazione|contiene|collegare|spostata)\b/, key);
}
assert.match(corsican['board-private-info'], /serà <strong>privata<\/strong>/);
assert.match(corsican['board-public-info'], /serà <strong>publica<\/strong>/);
assert.match(corsican['custom-field-delete-pop'], /Ùn si pò annullà.*tutte e carte.*cronulugia serà distrutta/);
assert.match(corsican['error-linked-card-not-allowed'], /solu una carta nurmale.*inaccessibili/);
assert.match(corsican['error-import-empty-board'], /versione attuale.*novu schedariu/);
for (const literal of ['GET /rest/api/3/search/jql?jql=project=KEY&fields=*all&expand=names,schema', 'nextPageToken', '"issues"', '"automationRules"']) assert.ok(corsican['import-board-instruction-jira'].includes(literal));
assert.match(corsican['import-board-instruction-jira'], /senza fields.*solu l’identificatori/);
assert.match(corsican['import-board-instruction-jira'], /tutte e pagine.*ogni pagina/);
assert.match(corsican['import-board-instruction-excel'], /Ogni fogliu cù una linea d’intestazione diventa una tavula/);
assert.equal(corsican['email-invite-text'], corsican['push-invite-text']);

const filterCorrectionKeys = ["advanced-filter-description", "import-trello-json-file-hint", "import-trello-zip-no-boards", "import-trello-parent-workspace", "trello-list-workspaces", "trello-api-credentials-saved", "just-invited", "leave-board-pop", "list-archive-cards-pop", "list-delete-suggest-archive", "normal-desc", "private-desc", "public-desc", "remove-from-board", "listDeletePopup-title", "remove-member-from-card", "sandstorm-remove-member-warning", "search-cards", "shortcut-add-self", "shortcut-assign-self"];
for (const key of filterCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Puoi|Sei sicuro|Questa|Nessun|dalla|alla|modificare|personalizzati|salvati|reinserirli)\b/, key);
}
assert.match(corsican['normal-desc'], /Ùn pò micca cambià i paràmetri/);
assert.match(corsican['private-desc'], /Solu e persone aghjunte.*vede la è mudificà la/);
assert.match(corsican['public-desc'], /visibile à tutti.*Google.*Solu e persone aghjunte.*mudificà la/);
assert.match(corsican['sandstorm-remove-member-warning'], /Ùn revoca micca l’accessu.*Revucate dinù/);
assert.match(corsican['leave-board-pop'], /tutte e carte/);
assert.match(corsican['list-delete-suggest-archive'], /cunservà a so attività/);
assert.match(corsican['import-trello-json-file-hint'], /chjave API è u gettone.*appicci.*fondu.*avatar/);

const settingsCorrectionKeys = ["unset-default-board-title", "starred-boards-description", "toggle-assignees", "go-to-board", "avatars-upload-blocked-description", "showSum-field-on-list", "boardDeletePopup-title", "delete-all-notifications-confirm", "delete-duplicate-lists-confirm", "r-schedule-on-date", "r-remove-all", "r-d-move-to-top-gen", "r-d-move-to-top-spec", "r-d-move-to-bottom-gen", "r-d-move-to-bottom-spec", "r-d-check-all", "r-checklist-note", "custom-head-tags-enabled", "custom-manifest-enabled", "custom-assetlinks-enabled", "add-custom-html-after-body-start", "duplicate-board-confirm", "swimlaneDeletePopup-title", "delete-user-confirm-popup", "delete-team-confirm-popup"];
for (const key of settingsCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.deepEqual(tags(corsican[key]), tags(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Questa|Sei sicuro|gli|alla|dalla|personalizzato|personalizzati|Eliminare|impostazione|Muovi)\b/, key);
}
assert.match(corsican['delete-duplicate-lists-confirm'], /listessu nome è ùn cuntenenu nisuna carta/);
assert.match(corsican['delete-all-notifications-confirm'], /tutte e nutificazioni.*ùn pò micca esse annullata/);
for (const key of ['delete-user-confirm-popup','delete-team-confirm-popup']) assert.match(corsican[key], /Ùn si pò annullà/);
assert.match(corsican['r-d-move-to-top-gen'], /in cima à a so lista/);
assert.match(corsican['r-d-move-to-bottom-gen'], /in fondu à a so lista/);
assert.match(corsican['r-checklist-note'], /separati da virgule/);
assert.match(corsican['avatars-upload-blocked-description'], /novi avatar.*sincrunizati.*attivati di manera predefinita/);
assert.match(corsican['custom-assetlinks-enabled'], /assetlinks\.json/);

const adminCorrectionKeys = ["delete-org-confirm-popup", "submit-on-enter", "allow-invite-to-board", "roles-status-invite", "roles-status-write", "roles-status-empty", "remove-domain-from-board", "no-items-message", "shared-templates-info", "dueCardsViewChange-choice-all", "globalSearch-instructions-notes-3", "import-dependencies-parse-error", "location-detect-none", "created-at-newest-first", "delete-org-warning-message", "delete-team-warning-message", "remove-team-from-table", "remove-organization-from-board", "custom-legal-notice-link-url", "move-all-attachments-to-fs", "move-all-attachments-to-gridfs", "move-all-attachments-to-s3", "move-all-attachments-of-board-to-fs", "move-all-attachments-of-board-to-gridfs", "move-all-attachments-of-board-to-s3"];
for (const key of adminCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Sei sicuro|gli|dalla|alla|Impossibile|Nessun|personalizzato|allegati|ruolo|Creare)\b/, key);
}
for (const key of ['delete-org-warning-message','delete-team-warning-message']) assert.match(corsican[key], /Ùn si pò squassà.*almenu un utilizatore ne face parte/);
assert.match(corsican['shared-templates-info'], /unu o parechji ambiti.*tavula Mudelli micca viota/);
assert.match(corsican['globalSearch-instructions-notes-3'], /\*AND\*.*tutti l’operatori sfarenti/);
assert.ok(corsican['globalSearch-instructions-notes-3'].includes('`__operator_list__:Available __operator_label__:red`'));
for (const backend of ['gridfs','s3']) {
  const literal = backend === 'gridfs' ? 'GridFS' : 'S3';
  assert.ok(corsican['move-all-attachments-to-' + backend].endsWith(literal));
  assert.match(corsican['move-all-attachments-of-board-to-' + backend], /di a tavula/);
}

const storageCorrectionKeys = ["move-all-attachments", "attachment-repair-locations-description", "mongodb-compact-description", "import-board-zip", "hideCheckedChecklistItems", "hideAllChecklistItems", "support-info-only-for-logged-in-users", "accounts-lockout-confirm-unlock", "accounts-lockout-confirm-unlock-all", "accounts-lockout-show-locked-users", "admin-people-filter-all", "accounts-lockout-all-users-unlocked", "board-archive-failed", "board-backup-failed", "board-cleanup-failed", "cron-job-delete-confirm", "cron-errors-cleared", "s3-force-path-style-description", "database-migration-confirm", "sandstorm-migration-description", "sandstorm-delete-raw-mongodb-description", "sandstorm-delete-raw-mongodb-confirm", "disable-import-avatars-description", "disable-export-avatars-description", "anonymize-import-users"];
for (const key of storageCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:gli|alla|dalla|Impossibile|Sei sicuro|Vuoi|Questa operazione|vengono|viene|abilitato)\b/, key);
}
assert.match(corsican['mongodb-compact-description'], /ùn si riduce micca automaticamente.*solu dopu avè compiu/);
assert.match(corsican['database-migration-confirm'], /ùn sò micca affettati.*destinazione deve esse in funzione/);
for (const literal of ['MongoDB 3','FerretDB v1 (SQLite)','files/attachments','files/avatars']) assert.ok(corsican['sandstorm-migration-description'].includes(literal));
for (const key of ['sandstorm-delete-raw-mongodb-description','sandstorm-delete-raw-mongodb-confirm']) assert.match(corsican[key], /FerretDB.*Ùn si pò annullà/);
assert.match(corsican['disable-import-avatars-description'], /LDAP, OIDC\/OAuth2.*altri dati sò sempre impurtati.*solu l’avatar.*disattivatu/);
assert.match(corsican['disable-export-avatars-description'], /altri dati sò sempre espurtati.*solu l’avatar.*disattivatu/);
assert.notEqual(corsican.hideCheckedChecklistItems, corsican.hideAllChecklistItems);

const repairCorrectionKeys = ["anonymize-export-users", "anonymize-account", "disable-watch-description", "s3-endpoint-menu-path", "cloud-settings-save-failed", "restore-lost-cards-migration-description", "restore-all-archived-migration", "restore-all-archived-migration-description", "fix-avatar-urls-migration-description", "fix-all-file-urls-migration", "fix-all-file-urls-migration-description", "migrations-admin-only", "no-issues-found", "run-restore-lost-cards-migration-confirm", "run-restore-all-archived-migration-confirm", "run-fix-avatar-urls-migration-confirm", "run-fix-all-file-urls-migration-confirm", "migration-progress-note", "conversion-info-text", "no-new-problems"];
for (const key of repairCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:gli|alla|dalla|Impossibile|Nessun|Questa|Puoi|viene|Verranno|Continuare)\b/, key);
}
assert.equal(corsican['anonymize-account'], 'Anonimizà u contu');
assert.match(corsican['disable-watch-description'], /ùn ponu micca abbunassi.*ogni prova.*ricusata.*disattivatu/);
for (const key of ['restore-lost-cards-migration-description','run-restore-lost-cards-migration-confirm']) for (const literal of ['Lost Cards','swimlaneId','listId']) assert.ok(corsican[key].includes(literal));
assert.match(corsican['run-restore-lost-cards-migration-confirm'], /Solu l’elementi micca archiviati/);
assert.match(corsican['run-restore-all-archived-migration-confirm'], /TUTTI.*archiviate.*Ùn si pò annullà facilmente/);
assert.match(corsican['migrations-admin-only'], /Solu l’amministratori di a tavula/);
assert.match(corsican['conversion-info-text'], /una sola volta per tavula.*cuntinuà.*nurmalmente/);
for (const literal of ['AWS','MinIO','Cloudflare R2','Backblaze B2','Wasabi','DigitalOcean Spaces']) assert.ok(corsican['s3-endpoint-menu-path'].includes(literal));
