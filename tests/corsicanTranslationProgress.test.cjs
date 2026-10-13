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
  /__[A-Za-z0-9_]+__|%(?:\d+\$)?[A-Za-z]|%\d+|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
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

const workspaceCorrectionKeys = ["activity-receivedDate", "activity-startDate", "activity-dueDate", "activity-endDate", "allboards.add-subworkspace", "allboards.add-subworkspace-prompt", "workspace-settings", "workspaceActionsPopup-title", "allboards.delete-workspace-confirm-check", "multi-selection-active", "archive-permanent-delete-disabled-hint", "no-boards-selected", "selected-label", "set-selected-starred", "set-selected-unstarred", "set-selected-home", "unset-selected-home", "home-board-badge", "home-board-empty", "home-board-remove-confirm", "add-template", "setListWidthPopup-title", "set-list-width", "personal-list-width", "setSwimlaneHeightPopup-title", "set-swimlane-height", "set-swimlane-height-value", "swimlane-height-error-message", "add-swimlane", "add-subtask", "add-existing-card-as-subtask-empty", "addExistingSubtaskPopup-title", "add-checklist", "convertChecklistItemToCardPopup-title", "convertChecklistItemToSubtask-title", "checklistItem-linked-subtask", "add-cover"];
for (const key of workspaceCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Impostazioni|Clicca|Selezionate|Imposta|Impostare|deve essere|Nessuna|Converti|immagine|sotto-compito|sottutask)\b/, key);
}
assert.match(corsican['home-board-empty'], /una sola tavula.*dopu a cunnessione/);
assert.match(corsican['home-board-remove-confirm'], /tavula stessa ùn hè micca squassata/);
assert.match(corsican['no-boards-selected'], /Ùn avete sceltu nisuna tavula/);
assert.match(corsican['set-selected-starred'], /Aghjunghje.*preferite/);
assert.match(corsican['set-selected-unstarred'], /Caccià.*preferite/);
assert.match(corsican['swimlane-height-error-message'], /numeru interu pusitivu/);
assert.match(corsican['archive-permanent-delete-disabled-hint'], /amministratore glubale.*marcatu.*buttone Squassà diventerà visibile/);

const displayCorrectionKeys = ["add-after-list", "admin-announcement", "all-boards-hide", "public-boards", "board-creation-admin-only", "app-is-offline", "app-try-reconnect", "archive-list", "archive-swimlane", "archive-selection", "archiveBoardPopup-title", "archived-boards", "no-archived-boards", "template-container", "add-template-container", "assign-member", "attached", "attachment-delete-pop", "auto-watch", "show-at-all-boards-page", "board-info-on-my-boards", "boardInfoOnMyBoardsPopup-title", "boardInfoOnMyBoards-title", "show-card-counter-per-list", "board-not-found", "board-drag-drop-reorder-or-click-open", "board-open-and-move-between-remaining-and-workspaces"];
for (const key of displayCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Dopo|Annunci|Impostazioni|attendere|Aggiornare|Move|nell|Spostare|Nessuna|Contenitore|Assegna|allegatu|Segui|numero|non trovata|Trascina|Clicca|quatretti)\b/, key);
}
assert.match(corsican['app-is-offline'], /Attualizà a pagina causerà una perdita di dati.*servore.*piantatu/);
assert.match(corsican['attachment-delete-pop'], /permanente.*Ùn si pò annullà/);
assert.match(corsican['board-creation-admin-only'], /Solu l’amministratori.*tavule/);
assert.match(corsican['auto-watch'], /automaticamente.*quand’elle sò create/);
assert.match(corsican['board-drag-drop-reorder-or-click-open'], /riurdinà.*Cliccate.*apre la/);
assert.match(corsican['board-open-and-move-between-remaining-and-workspaces'], /maniglia di trascinamentu.*__workspaces__.*barra laterale/);

const viewCorrectionKeys = ["boardChangeColorPopup-title", "changeColorPopup-title", "changeFontPopup-title", "allBoardsChangeColorPopup-title", "boardChangeTitlePopup-title", "boardChangeVisibilityPopup-title", "boardChangeWatchPopup-title", "desktop-mode", "mobile-mode", "zoom-in", "zoom-out", "zoom-level", "board-view-cal", "board-view-multiboard-cal", "board-view-swimlanes", "board-view-collapse", "board-view-gantt", "board-view-timeline-hint", "board-view-timeline-showing", "cardRestoreToTimelinePopup-title", "board-view-timeline-restore-confirm", "board-view-group-by-assignee", "roadmap-no-cards", "roadmap-empty-no-custom-fields", "calendar-system-gregorian", "calendar-system-iso8601"];
for (const key of viewCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Cambia|Rinomina|Modalità|Ingrandisci|Riduci|Livello|Calendario|Corsie|Comprimi|scheda|cancellatu)\b/, key);
}
assert.equal(corsican['board-view-gantt'], 'Gantt');
assert.match(corsican['boardChangeWatchPopup-title'], /seguitu/);
assert.doesNotMatch(corsican['boardChangeWatchPopup-title'], /nutificazioni/);
assert.match(corsican['board-view-timeline-restore-confirm'], /titulu.*discrizzione.*lista.*etichette.*membri.*data di scadenza.*Nunda hè squassatu/);
assert.match(corsican['board-view-timeline-showing'], /à a data di/);
assert.match(corsican['calendar-system-iso8601'], /gregorianu.*simane ISO 8601/);
assert.match(corsican['roadmap-empty-no-custom-fields'], /"Version" o "Release"/);

const cardCorrectionKeys = ["card-delete-notice", "card-delete-pop", "card-archive-pop", "list-archive-pop", "listArchivePopup-title", "swimlane-archive-pop", "swimlaneArchivePopup-title", "card-due-on", "card-spent", "card-edit-attachments", "card-labels-title", "card-members-title", "card-start-on", "cardAttachmentsPopup-title", "cardCustomField-datePopup-title", "cardStartVotingPopup-title", "positiveVoteMembersPopup-title", "vote-question", "vote-against", "cardStartPlanningPokerPopup-title", "poker-question", "poker-one", "poker-two", "poker-three", "poker-five", "poker-eight", "poker-thirteen", "poker-twenty", "poker-forty", "poker-oneHundred", "poker-unsure", "poker-finish", "poker-result-who", "poker-replay", "set-estimation", "poker-delete-pop", "cardArchivePopup-title", "cardDetailsActionsPopup-title", "addBoardTeamPopup-title", "removeBoardTeamPopup-title", "adminChangeAvatarPopup-title", "boardBackgroundsPopup-title", "deleteBoardBackgroundPopup-title", "userDeletePopup-title", "addBoardDomainPopup-title", "removeBoardDomainPopup-title", "mapImportedMemberPopup-title"];
for (const key of cardCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Archiviare|Tempo|trascorso|allegati|Cambia|Allega|Avvia|Favorevoli|Domanda|contro|Imposta|Perderai|Sfondi|sfondo|dominio|Associa)\b/, key);
}
for (const key of ['poker-question','poker-one','poker-two','poker-three','poker-five','poker-eight','poker-thirteen','poker-twenty','poker-forty','poker-oneHundred','poker-unsure']) {
  assert.equal(corsican[key], english[key], key);
  assert.doesNotMatch(corsican[key], /In corsu/);
}
assert.match(corsican['card-delete-pop'], /Tutte l’azzioni.*ùn puderete più apre torna.*Ùn si pò annullà/);
assert.match(corsican['poker-delete-pop'], /permanente.*tutte l’azzioni/);
for (const key of ['card-archive-pop','list-archive-pop','swimlane-archive-pop']) assert.match(corsican[key], /ùn serà più visibile.*dopu l’archiviazione/);

const profileCorrectionKeys = ["exportChecklistPopup-title", "restoreArchivedListToSwimlanePopup-title", "rulesImportExportPopup-title", "swimlaneHeightErrorPopup-title", "cardTemplatePopup-title", "invitePeoplePopup-title", "listsortPopup-title", "cardType-linkedBoard", "change-avatar", "change-color", "map-to-existing-user", "map-to-existing-user-desc", "map-to-existing-user-not-member", "map-to-existing-user-none", "change-settings", "theme-category-flat", "theme-category-clear", "theme-category-dark", "change-font", "font", "font-size", "font-size-default", "font-size-smaller", "font-size-small", "font-size-largest", "text-color", "text-background-color", "cardTextNoteEditPopup-title", "changeAvatarPopup-title", "changeLanguagePopup-title", "changeSettingsPopup-title", "click-to-star", "click-to-unstar", "click-to-disable-auto-width", "clipboard", "card-aging", "card-aging-days", "card-aging-tier1"];
for (const key of profileCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Spurtà la checklist|swimlane|regole|template|Cambia|Associa|Scegli|impostazioni|Piatto|Chiaro|Scuro|Carattere|Predefinito|piccolo|Piccolo|Grandissimo|testo|Clicca|Invecchiamento|sbiadimento)\b/, key);
}
assert.match(corsican['map-to-existing-user-desc'], /carte.*cummenti.*attività.*rolu propiu.*ùn pò.*mai dà più permessi/);
assert.match(corsican['map-to-existing-user-not-member'], /ùn hè ancu membru/);
assert.match(corsican['click-to-disable-auto-width'], /hè attivata.*disattivà la/);
assert.match(corsican['click-to-star'], /aghjunghje.*preferite/);
assert.match(corsican['click-to-unstar'], /caccià.*preferite/);
assert.match(corsican['card-aging-tier1'], /Livellu 1.*ghjorni d’inattività/);

const navigationCorrectionKeys = ["card-aging-tier2", "card-aging-tier3", "move-card-up", "move-card-down", "move-list-left", "move-list-right", "close-dialog", "go-back", "modal-title", "close-board-pop", "color-black", "color-crimson", "color-darkgreen", "color-gold", "color-gray", "color-indigo", "color-mistyrose", "color-navy", "color-orange", "color-paleturquoise", "color-peachpuff", "color-red", "color-saddlebrown", "color-silver", "color-sky", "color-slateblue", "color-white", "color-yellow", "unset-color", "comment-placeholder", "comment-assigned-only", "comment-assigned-only-desc", "no-comments-desc", "read-only", "read-assigned-only", "worker", "worker-desc", "confirm-move-list-to-swimlane", "copy-card-link-to-clipboard", "copy-link-to-clipboard", "copy-text-to-clipboard", "linkCardPopup-title", "save-card-as-template", "copyManyCardsPopup-title", "copyManyCardsPopup-instructions", "createTemplateContainerPopup-title", "createCustomField"];
for (const key of navigationCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Livello|sbiadimento|dopo|numero|Potrai|ripristinare|cliccando|nell|nero|rosso|bianco|giallo|arancione|grigio|argento|assegnato|assegnate|Sono|Può|Lavoratore|spostare|commentare|negli|testo|template|molte|formato|campo)\b/, key);
}
assert.equal(corsican['comment-placeholder'], '');
assert.match(corsican['comment-assigned-only-desc'], /Solu e carte assignate sò visibili.*Pò solu cummentà/);
assert.match(corsican['no-comments-desc'], /Ùn pò micca vede/);
assert.match(corsican['worker-desc'], /Pò solu spustà.*assignà si.*cummentà/);
assert.match(corsican['confirm-move-list-to-swimlane'], /sta lista.*tutte e so carte.*l’altra corsia/);
assert.match(corsican['close-board-pop'], /Archiviu.*Tutte e tavule/);
assert.match(corsican['move-card-up'], /in sù$/);
assert.match(corsican['move-card-down'], /in ghjò$/);
assert.match(corsican['move-list-left'], /à manca$/);
assert.match(corsican['move-list-right'], /à diritta$/);
assert.equal(corsican['color-red'], 'rossu');
assert.equal(corsican['color-white'], 'biancu');
assert.equal(corsican['color-yellow'], 'ghjallu');

const accountCorrectionKeys = ["createCustomFieldPopup-title", "custom-field-dropdown", "custom-field-dropdown-none", "custom-field-dropdown-unknown", "custom-field-dropdownMultiSelect", "custom-field-number", "custom-field-text", "date-format", "decline", "default-avatar", "enable-permanent-delete", "enable-permanent-delete-description", "disambiguateMultiMemberPopup-title", "discard", "edit-profile", "edit-wip-limit", "editCardStartDatePopup-title", "editCardDueDatePopup-title", "editCustomFieldPopup-title", "editCardSpentTimePopup-title", "editNotificationPopup-title", "editProfilePopup-title", "email-enrollAccount-text", "email-fail", "email-fail-text", "email-invalid", "email-invite", "email-invite-subject", "push-invite-title", "email-resetPassword-subject", "email-resetPassword-text", "email-sent", "email-verifyEmail-text", "enable-vertical-scrollbars", "error-board-notAdmin", "error-board-notAMember", "error-watch-disabled", "error-notAllowed", "error-json-schema", "error-csv-schema", "error-user-disabled", "error-user-doesNotExist", "error-user-notCreated", "error-username-taken", "error-orgname-taken", "error-teamname-taken", "export-board-without-attachments", "export-ical-feed", "user-can-not-export-excel", "export-card-excel-fields", "export-card-subtasks", "export-card-field-board-info", "export-card-attachment-type", "export-card-attachment-uploaded-by", "export-card-attachment-uploaded-at", "export-card-attachment-image-previews", "export-card-excel-free", "export-card-excel-needed", "user-can-not-export-card-to-pdf", "user-can-not-export-card-to-excel", "sorted", "remove-sort"];
for (const key of accountCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:campo|sconosciuto|Numero|Testo|Formato|predefinito|Consenti|agli|contenuti|contrassegnati|impostazione|Disambiguare|profilo|Cambia|tempo|trascorso|Ciao|iniziare|utilizzare|clicca|seguente|Invio|fallito|inviato|ripristinare|tua|Devi|essere|questa|poterlo|Il|tuo|disabilitato|creato|già|preso|allegati|Caricato|immagini|libero|necessario|ordinamento)\b/, key);
}
assert.match(corsican['enable-permanent-delete-description'], /amministratori glubali.*definitivamente.*marcati cum’è squassati.*ùn squassa nunda da per sè/);
assert.match(corsican['error-board-notAdmin'], /amministratore di sta tavula/);
assert.match(corsican['error-board-notAMember'], /membru di sta tavula/);
assert.match(corsican['error-notAllowed'], /rolu.*ùn permette micca/);
assert.match(corsican['email-resetPassword-text'], /ristabilisce.*parolla d’intrata/);
assert.match(corsican['email-verifyEmail-text'], /verificà l’indirizzu.*vostru contu/);
assert.equal(corsican['email-invite-subject'], corsican['push-invite-title']);
for (const key of ['email-enrollAccount-text','email-resetPassword-text','email-verifyEmail-text']) {
  assert.equal(corsican[key].split('\n\n').length, english[key].split('\n\n').length, key);
}
assert.match(corsican['error-csv-schema'], /virgule.*tabulazioni.*ùn cuntenenu micca/);
for (const format of ['pdf','excel']) assert.match(corsican[`user-can-not-export-card-to-${format}`], /ùn pò micca espurtà/);

const filterImportCorrectionKeys = ["list-sort-by", "list-label-modifiedAt", "list-label-sort", "list-label-short-title", "filter-cards", "filter-dates-label", "filter-due-this-week", "list-filter-label", "filter-clear", "filter-no-label", "filter-member-label", "filter-creator-label", "filter-hide-empty", "filter-on", "filter-to-selection", "other-filters-label", "advanced-filter-label", "fullname", "imported-member-no-account", "inactive-member", "impersonate-user", "import-board-instruction-kanboard", "import-board-instruction-deck", "import-board-instruction-openproject", "import-board-instruction-issues", "import-board-instruction-focalboard", "import-board-instruction-todoist", "import-board-instruction-planner"];
for (const key of filterImportCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Ordina|Orario|ultimo|Il|tuo|Pulisci|Nessuna|secondo|vuote|filtro|avanzato|completo|importato|nessun|corrispondente|ancora|inattivo|Impersona|oggetto|riportano|ciascuno|Gli|raggruppate|Chiuse|allegati)\b/, key);
}
assert.equal(corsican['list-label-short-title'], '(N)');
assert.match(corsican['filter-no-label'], /Nisuna etichetta/);
assert.match(corsican['imported-member-no-account'], /ancu nisun contu/);
for (const literal of ['columns','column_name','tasks','title','description','swimlane_name','date_due','owner','tags']) assert.ok(corsican['import-board-instruction-kanboard'].includes(literal), literal);
assert.match(corsican['import-board-instruction-openproject'], /GET \/api\/v3\/work_packages/);
assert.match(corsican['import-board-instruction-focalboard'], /cù o senza.*linea di versione.*cummenti sò cunservati.*appicci ùn sò micca impurtati/);
assert.match(corsican['import-board-instruction-todoist'], /Manage data > Export as CSV/);
assert.doesNotMatch(corsican['import-board-instruction-todoist'], /Export as a template/);
assert.match(corsican['import-board-instruction-todoist'], /sottucompiti.*lista di cuntrollu.*note.*cummenti.*@labels.*p1 à p3/);
assert.match(corsican['import-board-instruction-planner'], /Export as Excel.*classicu: Export plan to Excel/);
assert.match(corsican['import-board-instruction-planner'], /\.xlsx.*persone assignate.*date.*etichette.*lista di cuntrollu.*discrizzione.*Progress, Priority è Completed By.*campi persunalizati/);

const trelloCorrectionKeys = ["import-board-instruction-trello", "import-board-instruction-wekan", "import-board-instruction-about-errors", "import-without-mapping-members", "import-json-file", "import-attachments-zip", "import-trello-zip-file-hint", "import-trello-zip-progress", "import-timeout", "import-trello-zip-too-many-files", "import-trello-zip-file-too-large", "import-trello-zip-unsafe-path", "import-trello-workspace", "import-trello-workspace-placeholder", "trello-api-import", "trello-api-import-desc", "trello-parent-workspace-top", "trello-import-selected", "trello-importing", "trello-api-credentials-required", "trello-export-include-attachments", "trello-select-boards", "select-all", "select-none", "unselect-all", "trello-import-progress", "trello-cancel", "trello-cancel-delete", "trello-cancel-delete-confirm", "trello-resume", "trello-delete-imported", "trello-clear-job", "trello-import-errors", "copy-to-clipboard", "import-map-members", "import-members-map", "import-members-map-note", "import-user-select", "importMapMembersAddPopup-title", "check-version", "invalid-date", "invalid-time", "invalid-user"];
for (const key of trelloCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Nella|tua|poi|testo|scaricato|quando|qualche|comunque|mappare|seguito|Oppure|allegati|facoltativo|uno|loro|sottocartelle|vengono|attendere|richiesto|interrotta|troppo|potrebbe|contiene|troppi|importato|interno|rifiutato|personale|viene|creato|chiave|tuoi|quindi|Livello|superiore|selezionate|almeno|importare|tutto|nulla|Annullare|eliminare|processo|operazione|Riprendi|Cancella|negli|Mappatura|dei|verranno|assegnati|Scegli|Controlla|valido)\b/, key);
}
assert.match(corsican['import-timeout'], /hè stata piantata.*Pruvate torna.*troppu grande.*basa di dati.*occupata/);
assert.match(corsican['import-trello-zip-file-hint'], /unu o parechji.*sottucartulari.*Tutte e tavule sò impurtate/);
assert.match(corsican['import-trello-zip-unsafe-path'], /micca sicuri.*ricusatu/);
assert.match(corsican['trello-cancel-delete-confirm'], /digià impurtate da stu travagliu.*Ùn si pò annullà/);
assert.match(corsican['import-members-map-note'], /micca assuciati.*assignati.*utilizatore attuale/);
assert.match(corsican['trello-select-boards'], /almenu una tavula/);
assert.match(corsican['import-trello-workspace-placeholder'], /creatu s’ellu ùn esiste micca/);
assert.match(corsican['trello-api-credentials-required'], /à tempu.*chjave API.*gettone/);
assert.match(corsican['import-board-instruction-about-errors'], /qualchì volta.*quantunque.*Tutte e tavule/);

const boardMemberCorrectionKeys = ["joined", "keyboard-shortcuts", "label-default", "label-delete-pop", "label-text-overridden", "label-text-override", "leave-board", "leaveBoardPopup-title", "link-card", "linkCardToBoardPopup-title", "linkCardToNewBoard", "createBoardFromCardPopup-title", "list-archive-cards", "listArchiveCardsPopup-title", "list-move-cards", "list-select-cards", "set-color-list", "settingsUserPopup-title", "settingsTeamPopup-title", "settingsOrgPopup-title", "orgAdminsPopup-title", "swimlaneActionPopup-title", "swimlaneAddPopup-title", "link-list", "calendar", "gantt", "log-in", "loginPopup-title", "move-selection", "copy-selection", "moveListPopup-title", "moveCardToBottom-title", "moveCardToTop-title", "moveSelectionPopup-title", "copySelectionPopup-title", "selection-color", "multi-selection", "multi-selection-label", "multi-selection-member", "muted", "muted-info", "my-boards", "no-archived-cards", "no-archived-lists", "no-archived-swimlanes", "normal-assigned-only", "normal-assigned-only-desc", "notify-participate", "notify-watch", "page-not-found", "paste-or-dragdrop", "participating"];
for (const key of boardMemberCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:unito|Scorciatoie|Non|potrai|tornare|indietro|Procedendo|rimuoverai|questa|distruggerai|sua|Abbandonare|scheda|schede|Imposta|Impostazioni|dell|Azioni|swimlane|sotto|Calendario|Accedi|selezionati|fondo|Selezione|Selezionare|Silenziato|sarai|notificato|modifiche|mie|sono|assegnate|come|Ricevi|aggiornamenti|qualsiasi|partecipi|seguendo|trovata|incollare|oppure|rilascia|immagine|immagini|Partecipando)\b/, key);
}
assert.equal(corsican.gantt, 'Gantt');
assert.match(corsican['label-delete-pop'], /Ùn si pò annullà.*tutte e carte.*cronulugia serà distrutta/);
assert.doesNotMatch(corsican['label-text-overridden'], /annulatu/);
assert.match(corsican['normal-assigned-only-desc'], /Solu e carte assignate sò visibili.*mudificà.*utilizatore nurmale/);
assert.match(corsican['muted-info'], /Ùn riceverete mai.*nutificazioni/);
assert.match(corsican['notify-participate'], /creatore o membru/);
assert.match(corsican['notify-watch'], /tavule, liste o carte chì seguitate/);
assert.match(corsican['moveCardToBottom-title'], /in fondu$/);
assert.match(corsican['moveCardToTop-title'], /in cima$/);
for (const key of ['multi-selection-label','multi-selection-member']) assert.match(corsican[key], /per a selezzione$/);
assert.match(corsican['paste-or-dragdrop'], /solu imagine/);

const membershipSettingsCorrectionKeys = ["custom-private-desc", "custom-private-desc-placeholder", "custom-public-desc", "custom-public-desc-placeholder", "quick-access-description", "remove-member", "remove-member-pop", "removeMemberPopup-title", "rename-board", "rescue-card-description", "rescue-card-description-dialogue", "rules", "select-color", "set-wip-limit-value", "shortcut-autocomplete-emoji", "shortcut-autocomplete-members", "shortcut-clear-filters", "shortcut-close-dialog", "shortcut-filter-my-cards", "shortcut-show-shortcuts", "shortcut-toggle-filterbar", "shortcut-toggle-searchbar", "shortcut-toggle-sidebar", "show-cards-minimum-count", "sidebar-open", "sidebar-close", "signupPopup-title", "star-board-title", "set-default-board-title", "subscribe", "team", "this-board", "this-card", "spent-time-hours", "overtime-hours", "overtime", "flow-interruptions", "pomodoro", "pomodoro-completed", "has-overtime-cards", "has-spenttime-cards", "toggle-labels"];
for (const key of membershipSettingsCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:aggiungere|scorciatoia|questa|Rimuovere|sarà|Riceveranno|Rinomina|salvataggio|chiudere|descrizioni|salvate|Sovrascrivere|tue|modifiche|Regole|Scegli|massimo|numero|Autocompletamento|Pulisci|mie|scorciatoie|dei|contatore|contiene|Clicca|stellare|mostrata|inizio|tua|aprire|dopo|Iscriviti|Gruppo|Tempo|trascorso|Straordinario|compiuti|sono|scadute|impiegato|Attiva|disattiva|aggiunge)\b/, key);
}
assert.match(corsican['remove-member-pop'], /tutte e carte.*Riceverà una nutificazione/);
assert.match(corsican['rescue-card-description'], /prima di chjode.*ùn hè micca arregistrata/);
assert.match(corsican['rescue-card-description-dialogue'], /Rimpiazzà.*attuale.*vostri cambiamenti/);
for (const key of ['custom-private-desc-placeholder','custom-public-desc-placeholder']) assert.match(corsican[key], /Lascià viotu.*predefinita/);
assert.match(corsican['show-cards-minimum-count'], /più di$/);
assert.match(corsican['has-overtime-cards'], /tempu supplementare/);
assert.doesNotMatch(corsican['has-overtime-cards'], /scadut/);
assert.equal(corsican.pomodoro, 'Pomodoro');
assert.match(corsican['toggle-labels'], /Attivà\/disattivà.*1-9.*selezzione multipla aghjunghje.*1-9/);

const uploadLimitCorrectionKeys = ["tracking", "tracking-info", "type", "unassign-member", "unsaved-description", "uploaded-avatar", "uploading-files", "upload-failed", "upload-completed", "import-usernames", "view-it", "warn-list-archived", "watching", "watching-info", "welcome-board", "welcome-swimlane", "welcome-list2", "card-templates-swimlane", "list-templates-swimlane", "board-templates-swimlane", "what-to-do", "wipLimitErrorPopup-dialog-pt2", "attachment-transfer-limits-title", "attachment-transfer-limits-description", "attachment-transfer-limits-saved", "attachment-transfer-limits-save-failed", "attachment-transfer-limits-invalid-value", "attachment-upload-limit-label", "attachment-download-limit-label", "api-upload-limit-label", "api-download-limit-label", "attachment-limit-mode-unlimited", "attachment-limit-mode-max-size", "attachment-limit-mode-blocked", "attachment-limit-unit-gb", "attachment-limit-unit-mb", "attachment-limit-unit-bytes", "invite", "invite-people", "to-boards", "smtp-tls-description", "smtp-port"];
for (const key of uploadLimitCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Monitoraggio|Sarai|notificato|modifiche|alle|quali|sei|Tipo|Hai|salvata|caricato|corso|riuscito|completato|username|Visualizza|attenzione|questa|Stai|seguendo|benvenuto|Traguardo|Template|Cosa|vuoi|fare|alcuni|dei|fuori|oppure|imposta|alto|allegati|Configura|download|Il|del|trasferimento|lato|Inserite|Illimitato|Bloccato|Alla|supporto)\b/, key);
}
assert.match(corsican['tracking-info'], /creatore o membru/);
assert.match(corsican['watching-info'], /tutti i cambiamenti.*sta tavula/);
assert.match(corsican['unassign-member'], /assignazione/);
assert.match(corsican['wipLimitErrorPopup-dialog-pt2'], /fora di sta lista, o.*limita WIP più alta/);
assert.match(corsican['attachment-transfer-limits-description'], /caricamenti.*scaricate.*memoria tampone.*API.*limiti di sicurità distinti.*servitore/);
for (const key of ['attachment-upload-limit-label','api-upload-limit-label']) assert.match(corsican[key], /caricamentu/);
for (const key of ['attachment-download-limit-label','api-download-limit-label']) assert.match(corsican[key], /scaricata/);
for (const suffix of ['gb','mb','bytes']) assert.equal(corsican[`attachment-limit-unit-${suffix}`], english[`attachment-limit-unit-${suffix}`]);
assert.match(corsican['attachment-transfer-limits-invalid-value'], /pusitivu è validu/);

const organizationControlCorrectionKeys = ["smtp-tls", "email-templates-title", "invitation-code", "email-invite-register-subject", "email-invite-register-text", "email-smtp-test-subject", "outgoing-webhooks", "bidirectional-webhooks", "outgoingWebhooksPopup-title", "boardCardTitlePopup-title", "disable-webhook", "global-webhook", "new-outgoing-webhook", "no-name", "package", "Meteor", "Node", "Database_type", "Database_commit", "MongoDB_Oplog_enabled", "OS_Cpus", "OS_Loadavg", "OS_Release", "OS_Type", "OS_Uptime", "seconds", "show-field-on-card", "automatically-field-on-card", "always-field-on-card", "showLabel-field-on-card", "accounts-allowEmailChange", "accounts-allowUserNameChange", "tableVisibilityMode-allowPrivateOnly", "createdAt", "modifiedAt", "verified", "active-team", "org-shared-templates", "org-propagate-members-to-boards", "org-tenant", "org-domains", "org-domains-description", "error-org-domain-taken", "org-admins", "org-admins-description", "org-admin", "team-shared-templates", "team-propagate-members-to-boards", "card-received-on", "card-end-on", "editCardReceivedDatePopup-title", "editCardEndDatePopup-title", "setCardColorPopup-title", "setSelectionColorPopup-title", "setCardActionsColorPopup-title", "setSwimlaneColorPopup-title", "setListColorPopup-title", "assigned-by", "requested-by", "card-sorting-by-number", "board-delete-notice", "delete-board-confirm-popup"];
for (const key of organizationControlCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Supporto|inviato|Gentile|invitato|partecipare|questa|collaborare|favore|segui|collegamento|qui|Il|tuo|uscita|due|Filtro|Disattiva|Sconosciuto|Pacchetto|Tipo|del|abilitato|Numero|Carico|rilascio|Tempo|Visualizza|campo|alle|nuove|minischeda|Permetti|Consenti|Creato|Verificato|condivisi|Propaga|come|viene|virgole|esempio|richiesta|sostituisce|Lasciare|vuoto|Quel|dominio|appartiene|già|possono|nient|concedere|intero|sito|gestire|Cambia|Imposta|Scegli|Assegnato|Richiesto|Ordinamento|numero|eliminazione|azioni|associate|andranno|perse|saranno|rimosse|sarai|recuperare|contenuto|annullabile)\b/, key);
}
assert.equal(corsican.Meteor, 'Meteor');
assert.equal(corsican.Node, 'Node');
assert.match(corsican['email-invite-register-text'], /__url__.*\n\nU vostru codice d’invitu hè: __icode__/);
assert.match(corsican['org-domains-description'], /a\.example\.com, kanban\.example\.org.*MULTITENANCY=true.*Lasciate viotu/);
assert.match(corsican['org-admins-description'], /persone.*copie di salvezza.*nunda altru.*Ùn ponu mai.*Admin.*nè gestisce un amministratore di u situ/);
assert.match(corsican['delete-board-confirm-popup'], /liste.*carte.*etichette.*attività.*ùn puderete micca ricuperà.*Ùn si pò annullà/);
assert.match(corsican['automatically-field-on-card'], /carte nove$/);
assert.match(corsican['always-field-on-card'], /tutte e carte$/);

const hierarchyRuleCorrectionKeys = ["delete-all-notifications", "default-subtasks-board", "default", "defaultdefault", "card-settings", "boardCardSettingsPopup-title", "card-field-order-move-up", "card-field-order-move-down", "deposit-subtasks-board", "show-parent-in-minicard", "description-on-minicard", "badge-attachment-on-minicard", "card-sorting-by-number-on-minicard", "checklist-count-on-minicard", "attachment-count", "cover-image", "prefix-with-full-path", "prefix-with-parent", "subtext-with-full-path", "subtext-with-parent", "change-card-parent", "parent-card", "no-parent", "activity-added-label", "activity-removed-label", "activity-delete-attach", "activity-added-label-card", "activity-delete-attach-card", "r-rule", "r-add-trigger", "r-add-action", "r-board-rules", "r-add-rule", "r-view-rule", "r-delete-rule", "r-new-rule-name", "r-no-rules", "r-select-all", "r-unselect-all", "r-delete-selected", "r-export-selected", "r-edit-rule", "r-edit-rule-trigger-action"];
for (const key of hierarchyRuleCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Sottocompiti|Predefinito|Impostazioni|Sposta|insù|ingiù|Deposita|sotto|questa|genirotri|minischeda|Conteggio|allegati|minicard|viene|ordinata|numero|Numero|Immagine|copertina|Prefisso|percorso|completo|genitore|Sottotesto|Cambia|mostrare|genitori|ha|allegatu|cancella|Regola|azione|Regole|regola|Visualizza|Nessuna|tutto|Deseleziona|selezionati|Attivatore|Azione)\b/, key);
}
assert.match(corsican['card-field-order-move-up'], /in sù$/);
assert.match(corsican['card-field-order-move-down'], /in ghjò$/);
assert.match(corsican['checklist-count-on-minicard'], /\(0\/0\).*minicarta/);
assert.match(corsican['prefix-with-full-path'], /percorsu sanu/);
assert.match(corsican['subtext-with-parent'], /carta parente/);
for (const key of ['activity-added-label','activity-removed-label','activity-delete-attach','activity-added-label-card','activity-delete-attach-card']) assert.match(corsican[key], /^hà /);
assert.match(corsican['activity-delete-attach-card'], /squassatu un appicciu/);
assert.match(corsican['r-edit-rule-trigger-action'], /attivatore.*azzione/);

const workflowControlCorrectionKeys = ["r-workflow-view", "r-when", "r-workflow-help", "r-drop-trigger", "r-drop-action", "r-w-card-created", "r-w-card-archived", "r-w-card-unarchived", "r-w-label-added", "r-w-member-added", "r-w-member-removed", "r-w-assignee-added", "r-w-assignee-removed", "r-w-checklist-added", "r-w-attachment-added", "r-w-every-day-at", "r-export-json", "r-export-csv", "r-import-json", "r-import-csv", "r-import-trello", "r-import-done", "r-import-trello-note", "r-all-boards", "r-import-workflow", "r-workflow-format", "r-format-auto", "r-import-workflow-note", "r-set-scheduled-triggers", "r-schedule-type", "r-schedule-at-time", "r-schedule-on-day", "r-of-cards-in-list", "r-when-due", "r-due-is-set", "r-due-soon", "r-due-overdue", "r-days-after", "r-when-card-in-list", "r-card-button", "r-board-button", "r-button-label", "r-run", "r-sort-list", "r-mark-complete", "r-mark-incomplete", "r-move-all-cards", "r-unit-minutes", "r-action", "r-when-a-card", "r-is", "r-is-moved", "r-added-to", "r-attachment-added-to", "r-the-board", "set-filter", "r-moved-to", "r-moved-from"];
for (const key of workflowControlCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Quando|Trascina|trigger|azione|costruttore|poi|regola|cambiare|rilascia|qui|viene|ripristinata|Viene|allegatu|alle|regole|quanto|possibile|Importate|esportazioni|contengono|dei|comandi|sottoinsieme|righe|mappate|vengono|segnalate|Formato|Rilevamento|automatico|esportato|riconosciuti|sono|mappati|segnalati|Ripeti|del|impostata|scaduta|dopo|Pulsante|pulsante|Esegui|Ordina|Contrassegna|come|completata|minuto|Azione|spostata|Imposta|filtro|Spostato)\b/, key);
}
assert.match(corsican['r-workflow-help'], /attivatore.*azzione.*regula esistente.*cambià/);
assert.match(corsican['r-import-trello-note'], /ùn cuntenenu micca.*Butler.*parte supportata.*micca cunvertite sò signalate/);
assert.match(corsican['r-import-workflow-note'], /n8n o Node-RED.*ricunnisciuti.*regule WeKan.*micca cunvertiti sò signalati/);
assert.match(corsican['r-mark-complete'], /cum’è compia$/);
assert.match(corsican['r-mark-incomplete'], /cum’è micca compia$/);
assert.match(corsican['r-w-card-unarchived'], /ristabilita da l’archiviu/);
assert.match(corsican['r-moved-to'], /à$/);
assert.match(corsican['r-moved-from'], /da$/);
assert.match(corsican['r-days-after'], /dopu$/);

const triggerFragmentCorrectionKeys = ["r-archived", "r-unarchived", "r-when-the-label", "r-when-a-member", "r-when-the-member", "r-when-a-assignee", "r-when-the-assignee", "r-when-a-attach", "r-when-a-card-matches-advanced-filter", "r-when-a-due-date-changed", "r-when-a-start-date-changed", "r-when-a-end-date-changed", "r-when-a-received-date-changed", "r-when-a-checklist", "r-when-the-checklist", "r-completed", "r-made-incomplete", "r-when-a-item", "r-when-the-item", "r-checked", "r-unchecked", "r-move-card-to", "r-top-of", "r-bottom-of", "r-its-list", "r-unarchive", "r-assignee", "r-set-color", "r-checklist", "r-check-all", "r-uncheck-all", "r-items-check", "r-check", "r-uncheck", "r-item", "r-of-checklist", "r-send-email", "r-to", "r-subject", "r-rule-details"];
for (const key of triggerFragmentCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Spostato|Ripristinato|Quando|viene|Assignatu|allegatu|scheda|checklist|Completato|Rendi|incompleto|elemento|Selezionato|Deselezionato|Al|sopra|sotto|sua|assegnatario|Imposta|controllo|Togli|spunta|Invia|fino|oggetto|regola)\b/, key);
}
for (const key of ['r-when-a-due-date-changed','r-when-a-start-date-changed','r-when-a-end-date-changed','r-when-a-received-date-changed']) {
  assert.match(corsican[key], /^Quandu.*hè definita o cambiata$/);
}
assert.match(corsican['r-when-a-assignee'], /^Quandu una persona assignata hè$/);
assert.match(corsican['r-when-the-assignee'], /^Quandu a persona assignata$/);
assert.equal(corsican['r-checked'], 'Marcatu');
assert.equal(corsican['r-unchecked'], 'Micca marcatu');
assert.match(corsican['r-made-incomplete'], /micca compiu/);
assert.equal(corsican['r-to'], 'à');
assert.equal(corsican['r-top-of'], 'In cima à');
assert.equal(corsican['r-bottom-of'], 'In fondu à');

const authenticationDateCorrectionKeys = ["r-d-send-email", "r-d-send-email-to", "r-d-send-email-subject", "r-d-archive", "r-d-unarchive", "r-in-swimlane", "r-d-check-one", "r-d-uncheck-one", "r-d-check-of-list", "r-d-add-checklist", "r-d-remove-checklist", "r-add-checklist", "r-add-swimlane", "r-swimlane-name", "r-when-a-card-is-moved", "r-set", "r-update", "r-datefield", "r-df-start-at", "r-to-current-datetime", "r-link-card", "ldap", "ldap-test-connection-error", "sign-in-with", "passwordless-hint", "passwordless-sign-in", "oauth2", "cas", "authentication-method", "authentication-type", "settings-group-url", "settings-group-logo", "hide-logo", "board-member-list", "error-undefined", "display-authentication-method", "duplicate-board", "cloneBoardPopup-title", "team-number", "people-number", "swimlane-delete-pop", "restore-all", "delete-all", "previous_as", "act-a-endAt", "act-a-startAt", "act-a-receivedAt", "a-dueAt", "a-endAt", "a-startAt", "a-receivedAt", "above-selected-card", "above-selected-swimlane", "below-selected-card", "below-selected-swimlane", "left-of-list", "right-of-list", "duenow", "act-newDue"];
for (const key of authenticationDateCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /\b(?:Invia|fino|oggetto|swimlane|elemento|Deseleziona|checklist|Quando|viene|spostata|Imposta|Aggiorna|campo|inizio|Collega|fallita|Accedi|Richiede|uscita|Metodo|autenticazione|Tipo|dei|Qualcosa è|andato|storto|metodo|Duplica|tutto|orario|finale|iniziale|ricezione|precedentemente|modificata|selezionata|sinistra|destra|sollecito)\b/, key);
}
assert.match(corsican['passwordless-hint'], /MAIL_URL.*PASSWORDLESS_ENABLED/);
for (const key of ['ldap','oauth2','cas','settings-group-url','settings-group-logo']) assert.equal(corsican[key], english[key]);
for (const key of ['act-a-endAt','act-a-startAt','act-a-receivedAt']) assert.match(corsican[key], /à __timeValue__ da \(__timeOldValue__\)/);
assert.match(corsican['swimlane-delete-pop'], /filu d’attività.*ùn puderete micca ricuperà.*Ùn si pò annullà/);
assert.match(corsican['left-of-list'], /^À manca/);
assert.match(corsican['right-of-list'], /^À diritta/);
assert.match(corsican['above-selected-card'], /^Sopra/);
assert.match(corsican['below-selected-card'], /^Sottu/);
assert.match(corsican['duenow'], /%s hè oghje$/);
assert.match(corsican['act-newDue'], /primu ramintamentu di scadenza/);

const memberPreferenceCorrectionKeys = ["act-atUserComment", "accounts-allowUserDelete", "hide-minicard-label-text", "show-desktop-drag-handles", "lock-swimlane-height-resize", "same-width-for-all-lists", "toggle-header-icons-collapsed", "open-many-cards-at-once", "open-many-cards-at-once-description", "submit-on-enter-description", "show-on-minicard", "editTeamPopup-title", "newTeamPopup-title", "notifications", "notification-settings-popup-description", "help", "filter-by-unread", "mark-all-as-read", "remove-all-read", "allow-rename", "allowRenamePopup-title", "roles", "roles-info", "roles-status", "roles-status-desc", "roles-status-role", "roles-status-sees", "roles-status-manage", "roles-status-sees-assigned", "start-day-of-week", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "status", "owner", "last-modified-at", "delete-linked-card-before-this-card", "delete-linked-cards-before-this-list", "hide-checked-items", "hide-finished-checklist"];
for (const key of memberPreferenceCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /ti ha menzionato|Permetti agli|Ogni carta su cui|premendo Enter|Filtra per non letto|Segna tutto come letto|Scegli quali ruoli|Sola lettura: segue|Imposta l'inizio|Lunedì|Martedì|Mercoledì|Giovedì|Venerdì|Sabato|Domenica|Non puoi eliminare/, key);
}
assert.match(corsican['roles-info'], /amministratori glubali.*sempre tutti i diritti.*ùn ponu micca esse limitati/);
assert.match(corsican['roles-status-desc'], /Solu lettura.*prima d’arregistrà/);
assert.match(corsican['open-many-cards-at-once-description'], /so finestra.*disattivata.*chjode quella chì era aperta/);
for (const literal of ['Enter', 'Shift+Enter', 'Ctrl/Cmd+Enter']) assert.ok(corsican['submit-on-enter-description'].includes(literal));
assert.match(corsican['submit-on-enter-description'], /attivatu.*Enter arregistra.*disattivatu.*Ctrl\/Cmd\+Enter arregistra è Enter inserisce/);
assert.match(corsican['delete-linked-cards-before-this-list'], /Ùn pudete micca.*prima d’avè.*carte ligate.*sta lista/);
assert.deepEqual(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(k => corsican[k]), ['Luni','Marti','Mercuri','Ghjovi','Vennari','Sabbatu','Dumenica']);

const searchTemplateCorrectionKeys = ["create-task", "domain", "add-domain", "share-template-with", "drag-template-here-to-share", "shared-templates", "shared-templates-select-scope", "displayName", "shortName", "autoAddUsersWithDomainName", "website", "my-attachments", "context-separator", "myCardsViewChange-title", "myCardsViewChangePopup-title", "myCardsSortChange-title", "myCardsSortChangePopup-title", "dueCardsViewChange-choice-me", "dueCardsViewChange-choice-all-description", "globalSearchViewChange-title", "globalSearchViewChangePopup-title", "globalSearchViewChange-choice-me", "globalSearchViewChange-choice-all", "globalSearchViewChange-choice-all-description", "dueCards-noResults-title", "dueCards-noResults-description", "board-title-not-found", "swimlane-title-not-found", "list-title-not-found", "label-color-not-found", "comment-not-found", "org-name-not-found", "team-name-not-found", "no-cards-found", "one-card-found", "n-cards-found", "n-n-of-n-cards-found", "operator-board-abbrev", "operator-swimlane-abbrev", "operator-list-abbrev", "operator-label-abbrev", "operator-user-abbrev", "operator-member-abbrev", "operator-assignee", "operator-assignee-abbrev", "operator-status", "operator-created"];
for (const key of searchTemplateCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /Creà compito|Condividi template|Trascina qui|template condivisi|Nome da visualizzare|nome di dominio|Sito web|Vista mie carte|Ordina le mie carte|Visualizza tutte le carte|per cui hai i permessi|Nessuna carta|Al momento non hai|non trovat|contenenti il testo|In corsu:/, key);
}
assert.match(corsican['dueCardsViewChange-choice-all-description'], /micca compie.*scadenza.*hà u permessu/);
assert.match(corsican['globalSearchViewChange-choice-all-description'], /avete u permessu.*membru o persona assignata/);
assert.match(corsican['shared-templates-select-scope'], /Urganizazioni, Squadre o Duminii/);
assert.match(corsican['n-cards-found'], /%s carte truvate/);
assert.equal(corsican['context-separator'], '/');
for (const suffix of ['board','swimlane','list','label','user','member','assignee']) assert.equal(corsican[`operator-${suffix}-abbrev`], english[`operator-${suffix}-abbrev`]);

const searchHelpCorrectionKeys = ["operator-sort", "operator-has", "operator-customfield", "operator-attachment-text", "operator-checklist-text", "predicate-archived", "predicate-open", "predicate-ended", "predicate-all", "predicate-overdue", "predicate-year", "predicate-created", "predicate-attachment", "predicate-checklist", "predicate-start", "predicate-assignee", "operator-unknown-error", "globalSearch-instructions-heading", "globalSearch-instructions-description", "globalSearch-instructions-operators", "globalSearch-instructions-operator-board", "globalSearch-instructions-operator-list", "globalSearch-instructions-operator-swimlane", "globalSearch-instructions-operator-comment", "globalSearch-instructions-operator-label", "globalSearch-instructions-operator-user", "globalSearch-instructions-operator-member", "globalSearch-instructions-operator-assignee", "globalSearch-instructions-operator-creator", "globalSearch-instructions-operator-org", "globalSearch-instructions-operator-team", "globalSearch-instructions-operator-due", "globalSearch-instructions-operator-created", "globalSearch-instructions-operator-modified", "globalSearch-instructions-status-all", "globalSearch-instructions-status-ended", "globalSearch-instructions-status-public"];
for (const key of searchHelpCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /possiede|personalizzato|controllo|archiviato|aperto\/a|assegnatario|Per affinare|correspondenti|corrispondenti|carte dove|ghjorni fa o prima|soltanto/, key);
}
for (const key of ['globalSearch-instructions-operator-created', 'globalSearch-instructions-operator-modified']) assert.match(corsican[key], /ghjorni fà o menu$/);
assert.match(corsican['globalSearch-instructions-description'], /`list:Blocked`/);
assert.match(corsican['globalSearch-instructions-description'], /`__operator_list__:"To Review"`/);

const remainingSearchControlKeys = ["globalSearch-instructions-status-private", "globalSearch-instructions-operator-has", "globalSearch-instructions-operator-sort", "globalSearch-instructions-operator-limit", "globalSearch-instructions-notes-2", "globalSearch-instructions-notes-3-2", "globalSearch-instructions-notes-4", "globalSearch-instructions-notes-5", "link-to-search", "excel-font", "number", "label-colors", "label-names", "archived-at", "sort-cards", "sort-boards", "sort-is-on", "cardsSortPopup-title", "due-complete", "add-sticker", "remove-sticker", "drag-to-connect", "dependency-type", "dependency-type-related-to", "dependency-type-is-blocked-by", "dependency-type-is-fixed-by", "filter-dependencies-label", "import-dependencies-placeholder", "import-dependencies-empty", "board-backgrounds", "boardBackgrounds-title", "upload-background", "set-as-active", "location", "add-location", "cardLocationsPopup-title", "location-name", "location-address", "location-detect", "location-detect-done", "location-open-map-at", "map-region-usa", "map-region-asia", "server-error", "title-alphabetically", "links-heading", "now-activities-of-all-boards-are-hidden", "move-swimlane", "moveSwimlanePopup-title", "custom-field-stringtemplate"];
for (const key of remainingSearchControlKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /In corsu:|soltanto|dove|è uno|vengono|possono essere|Per impostazione|Ordina |Ordinamento|Trascina per|collegare|È bloccata|Oppure incolla|fornisci almeno|Imposta come|Indirizzo|compilati qui|sono nascoste|Move swimlane/, key);
}
for (const key of ['excel-font', 'map-region-usa', 'map-region-asia']) assert.equal(corsican[key], english[key]);
assert.match(corsican['globalSearch-instructions-operator-has'], /`has:-due`.*senza data di scadenza/);
assert.match(corsican['globalSearch-instructions-notes-2'], /\*OR\*.*almenu una/);
assert.match(corsican['globalSearch-instructions-notes-4'], /ùn distinguenu micca.*maiuscule.*minuscule/);
assert.match(corsican['import-dependencies-empty'], /tavula.*almenu una linea/);

const reportTicketCorrectionKeys = ["custom-field-stringtemplate-separator", "creator-on-minicard", "filesReportTitle", "filename-invisible-legend", "reports", "securityReportTitle", "cpuReportTitle", "databaseReportTitle", "new-problems", "rulesReportTitle", "boardsReportTitle", "cardsReportTitle", "impersonation-user", "recoveryReportTitle", "office-report-desc", "office-location", "office-address", "office-logins", "office-first-seen", "office-last-seen", "office-shared", "office-no-results", "apiReportTitle", "api-report-desc", "api-endpoint", "api-calls", "api-first-called", "api-last-called", "recovery-report-desc", "recovery-event", "recovery-detail", "recovery-maintenance-title", "reason", "copy-swimlane", "copySwimlanePopup-title", "display-card-creator", "wait-spinner", "Bounce", "Cube", "Dot", "Wave", "maximize-card", "minimize-card", "subject", "details", "carbon-copy", "ticket", "tickets", "ticket-number", "pending", "closed", "resolved", "cancelled", "history-change-moved", "history-change-restored", "request", "requests", "help-request", "editCardSortOrderPopup-title", "cardDetailsPopup-title", "add-teams", "filter-card-title-label", "invite-people-error"];
for (const key of reportTicketCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /In corsu:|su minicard|Rosso: il|Utilizzo|nuovi problemi|Report regole|impersonificato|Ripristino|Da dove|vengono usati|mai una riga|dei dati|Spinner di attesa|Richiesta|Chiuso|Annullato|Ripristinato|Dettagli carta|invio di/, key);
}
for (const key of ['apiReportTitle', 'api-endpoint']) assert.equal(corsican[key], 'API');
assert.match(corsican['custom-field-stringtemplate-separator'], /&#32;.*&nbsp;/);
assert.match(corsican['office-report-desc'], /per persona.*IPv4.*IPv6.*paese.*cità.*cunnessioni riesciute/);
assert.match(corsican['api-report-desc'], /Una linea per contu.*puntu d’accessu.*mai una linea per dumanda/);
assert.match(corsican['recovery-report-desc'], /copie di salvezza.*risturazioni.*MongoDB.*riparazione autumatica/);
assert.match(corsican['carbon-copy'], /\(Cc:\)/);

const checklistStorageCorrectionKeys = ["add-organizations", "copied", "checklistActionsPopup-title", "moveChecklist", "moveChecklistPopup-title", "newlineBecomesNewChecklistItem", "newLineNewItem", "newlineBecomesNewChecklistItemOriginOrder", "copyChecklist", "copyChecklistPopup-title", "copyChecklistFromTemplate", "copyChecklistFromTemplatePopup-title", "attachmentActionsPopup-title", "attachment-move-storage-fs", "attachment-move-storage-gridfs", "attachment-move-storage-s3", "attachment-move", "move-storage-collectionfs", "move-storage-gridfs", "move-storage-fs", "move-storage-s3", "move-attachments-none-found", "attachment-last-move", "attachment-repair-locations", "attachment-repair-done", "attachment-repair-scanned", "attachment-repair-broken", "move-scope", "move-scope-both", "default-save-storage-description", "move-progress-resume", "calculate-file-counts", "stats-scope", "stats-collectionfs", "stats-mongo-files", "stats-count", "attachment-id", "mongodb-compact", "mongodb-compact-warning", "mongodb-compact-run", "mongodb-compact-running", "mongodb-compact-error", "path", "storage", "action", "board-status", "board-status-time-spent-total", "board-status-cards-with-time", "board-status-overtime-cards", "board-status-remaining-time-total", "uploading", "remaining_time", "progress"];
for (const key of checklistStorageCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /In corsu:|organizzazioni|Copiato|riga di testo|controllo|Azioni allegatu|Muovi allegatu|Ultimo spostamento|Non trovati|Riprendi|Calcola il|Conteggio|che può richiedere|vengono compattati|non riuscito|Tempo totale|tempo impiegato|in straordinario|in corso|Avanzamento/, key);
}
for (const key of ['move-storage-collectionfs', 'move-storage-gridfs', 'move-storage-s3', 'stats-collectionfs', 'stats-mongo-files', 'mongodb-compact']) assert.equal(corsican[key], english[key]);
assert.match(corsican['newlineBecomesNewChecklistItemOriginOrder'], /Ogni linea.*un elementu.*ordine originale/);
assert.match(corsican['move-attachments-none-found'], /d’origine sceltu.*nunda da spustà/);
assert.match(corsican['mongodb-compact-warning'], /bluccante.*secundarii.*prima.*po u primariu.*un solu nodu.*oplog.*solu u primariu/);
assert.match(corsican['default-save-storage-description'], /novi appicci caricati/);
assert.match(corsican['board-status-overtime-cards'], /tempu supplementariu/);
assert.doesNotMatch(corsican['board-status-overtime-cards'], /scadenza|scadut/);

const accountRecurrenceCorrectionKeys = ["password-again", "if-you-already-have-an-account", "minicardDetailsActionsPopup-title", "Mongo_sessions_count", "change-visibility", "max-upload-filesize", "allowed-upload-filetypes", "max-avatar-filesize", "allowed-avatar-filetypes", "invalid-file", "preview-pdf-not-supported", "drag-board", "drag-board-to-workspace", "newTranslationPopup-title", "translation", "text", "translation-text", "show-subtasks-field", "show-week-of-year", "convert-to-markdown", "collapse", "uncollapse", "card-recurrence-interval", "cardRecurrenceIntervalPopup-title", "card-recurrence-interval-none", "hideCompletedSubtasks", "support", "supportPopup-title", "support-info-not-added-yet", "support-title", "support-content", "accessibility-info-not-added-yet", "accounts-lockout-known-users", "accounts-lockout-unknown-users", "accounts-lockout-locked-users", "accounts-lockout-locked-users-info", "accounts-lockout-no-locked-users", "accounts-lockout-failed-attempts", "accounts-lockout-remaining-time", "accounts-lockout-user-unlocked", "accounts-lockout-user-locked", "accounts-lockout-click-to-unlock", "accounts-lockout-status", "admin-people-filter-locked", "admin-people-filter-inactive", "admin-people-active-status"];
for (const key of accountRecurrenceCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /Se hai già|Dettagli carta|Numero sessioni|Cambia visibilità|consentiti|non è valido|Il vostro dispositivo|Trascina la|traduzione personalizzata|sottoattività|dell.anno|Non collassare|Ripristinazione|sottumissioni|Supporto|Contenuto del|non sono ancora|Impostazioni|sconosciuti|bloccati|Al momento|Tentativi Falliti|Tempo Rimanente|è stato sbloccato|Clicca per sbloccare|Non Attivu/, key);
}
assert.match(corsican['invalid-file'], /caricamentu o u cambiamentu di nome hè annullatu/);
assert.match(corsican['show-week-of-year'], /ISO 8601/);
assert.match(corsican['card-recurrence-interval'], /Ricurrenza di a carta/);
assert.notEqual(corsican['card-recurrence-interval'], corsican['checklist-reset-interval']);
assert.match(corsican['card-recurrence-interval-none'], /ùn ripete micca a carta/);
assert.match(corsican['accounts-lockout-known-users'], /currettu.*parolla d’intrata sbagliata/);
assert.match(corsican['accounts-lockout-unknown-users'], /ùn esiste micca/);

const migrationScheduleCorrectionKeys = ["admin-people-user-active", "admin-people-user-inactive", "accounts-lockout-unlock-all", "add-cron-job", "add-cron-job-placeholder", "attachment-storage-configuration", "attachments-path", "attachments-path-description", "avatars-path", "avatars-path-description", "board-archive-scheduled", "board-backup-scheduled", "board-cleanup-scheduled", "cron-jobs", "cron-job-deleted", "cron-job-paused", "cron-job-resumed", "cron-job-started", "cron-error-details", "cron-migrations-resumed", "cron-migrations-retried", "complete", "idle", "filesystem-path-description", "filesystem-enabled-description", "storage-enabled", "s3-minio-storage-description", "s3-force-path-style", "azure-blob-storage", "azure-blob-storage-description", "azure-account-name", "azure-account-key", "azure-connection-string", "azure-connection-string-description", "gcs-storage", "gcs-storage-description", "database-migration", "database-migration-description", "sandstorm-migration-status", "sandstorm-migration-success", "sandstorm-migration-failed", "sandstorm-migration-pending", "sandstorm-storage-item", "sandstorm-disk-usage", "sandstorm-raw-mongodb", "sandstorm-delete-raw-mongodb", "sandstorm-raw-mongodb-deleted", "collections", "feature-views-table-desc"];
for (const key of migrationScheduleCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /In corsu:|clicca per|Sblocca Tutti|processo pianificato|Processo pianificato|Percorso|cù successo|messo in pausa|non riuscite|Completato|Inattivo|Usa il filesystem|Abilitato|Nome account|Chiave account|Stringa di connessione|Facoltativo: usa|del database|tutto tranne|deve essere|Stato di a|Non riuscita|Non ancora migrato|Utilizzo del|raccolte/, key);
}
for (const key of ['azure-blob-storage', 'azure-blob-storage-description', 'gcs-storage', 'gcs-storage-description']) assert.equal(corsican[key], english[key]);
for (const literal of ['mongodb://127.0.0.1:27018', 'mongodb://127.0.0.1:27019', 'WEKAN_FERRETDB_URL', 'WEKAN_MONGODB_URL', 'MONGO_URL', 'snap set wekan database=ferretdb', '=mongodb']) assert.ok(corsican['database-migration-description'].includes(literal), literal);
assert.match(corsican['database-migration-description'], /fora di l’appicci è di l’avatar.*fermanu.*in funzione è accessibile.*riavviate WeKan/);
assert.match(corsican['azure-connection-string-description'], /Facultativu.*invece di u nome.*chjave/);
assert.match(corsican['cron-job-paused'], /pausa/);
assert.match(corsican['cron-job-resumed'], /ripigliatu/);

const featureBackupCorrectionKeys = ["cards-loading-auto", "cards-loading-all", "cards-loading-lazy", "cards-loading-description", "cards-loading-lazy-note", "render-links-as-plain-text", "render-links-as-plain-text-description", "always-show-code-as-text", "always-show-code-as-text-description", "disable-all-import", "disable-all-import-description", "disable-all-export", "disable-all-export-description", "disable-import-avatars", "disable-export-avatars", "anonymize-import-users-description", "anonymize-export-users-description", "anonymize-account-confirm-popup", "features-notifications", "disable-activities", "disable-activities-description", "disable-notifications", "disable-notifications-description", "disable-watch", "backup-data", "backup-scope", "backup-scope-instance", "backup-scope-description", "backup-storage", "backup-now", "backup-done", "backup-schedule", "backup-frequency-off", "backup-frequency-daily", "backup-frequency-weekly", "backup-frequency-monthly", "backup-day-of-month", "backup-list", "backup-datetime", "backup-path"];
for (const key of featureBackupCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /Automatico|Tutte le carte|Come ogni tavula|Se abilitato|vengono|testo semplice|Nessuna identità|Il schedariu|La parola|Non viene|possono comunque|Ambito del|Intera istanza|Il ripristino|Esegui backup|Backup completato|Disattivato|Giornaliero|Settimanale|Mensile|Percorso/, key);
}
assert.match(corsican['cards-loading-description'], /autumaticamente.*soglia.*CARDS_LOADING \(all\/lazy\/auto\).*CARDS_LOADING_LAZY_THRESHOLD/);
assert.doesNotMatch(corsican['cards-loading-all'], /predefinit/);
assert.match(corsican['anonymize-account-confirm-popup'], /permanente.*nome d’utilizatore.*nome cumpletu.*indirizzu email.*caccia l’avatar.*disattiva a cunnessione.*cunservanu a so cronulugia.*Ùn si pò annullà/);
assert.doesNotMatch(corsican['anonymize-account-confirm-popup'], /espurtazione|espurtatu|user1/);
assert.match(corsican['backup-scope-description'], /nisun contu d’utilizatore.*nisun parametru d’istanza.*scrive solu.*appartenenu/);
for (const key of ['anonymize-import-users-description', 'anonymize-export-users-description']) { assert.ok(corsican[key].includes('user1, user2, ...')); assert.ok(corsican[key].includes('@username')); }
assert.ok(corsican['always-show-code-as-text-description'].includes('<!-- -->'));
assert.ok(corsican['render-links-as-plain-text-description'].includes('[label](url)'));

for (const key of ['backup-description', 'continuous-backup-description']) { assert.match(corsican[key], /appicci/); assert.doesNotMatch(corsican[key], /allegati/); }
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data']) assert.ok(corsican['backup-description'].includes(literal), literal);

const cloudRestoreCorrectionKeys = ["backup-restore-mode", "backup-restore-replace-all", "backup-restore-select-first", "backup-restore-confirm", "gcs-project-id", "gcs-key-filename", "gcs-key-filename-description", "gcs-credentials-description", "gcs-permissions-note", "azure-container-description", "gcs-bucket-description", "s3-access-key-menu-path", "s3-secret-key-menu-path", "gcs-key-filename-menu-path", "gcs-credentials-menu-path", "cloud-secret-none", "test-cloud-connection", "cloud-connection-success", "cloud-connection-failed", "cloud-settings-saved", "move-storage-azure", "move-storage-gcs", "attachment-move-storage-azure", "attachment-move-storage-gcs", "gridfs-enabled", "gridfs-disabled", "gridfs-enabled-description", "all-migrations", "migration-starting", "migration-stopping", "migration-paused", "migration-progress", "migration-started", "migration-status", "migration-stopped", "gridfs-move-collectionfs-note", "s3-access-key", "s3-bucket-description", "s3-connection-success", "s3-enabled", "s3-enabled-description", "s3-minio-storage", "s3-port", "s3-secret-key", "s3-settings-saved", "s3-ssl-enabled", "save-s3-settings", "schedule-board-archive", "schedule-board-backup", "schedule-board-cleanup", "test-s3-connection"];
for (const key of cloudRestoreCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /In corsu:|Modalità di ripristino|Sostituisci|dall.lista|ID progetto|Percorso|Facoltativo|Concedi|Il container|Il nome del|il tuo utilizatore|scegli il caso|Stessa schermata|il tuo account|non impostato|Prova la connessione|Connessione|Impostazioni|allegatu su|abilitato|Tutte le migrazioni|cù successo|Avanzamento|Stato di a|Nome del|Archiviazione|Pianifica /, key);
}
for (const key of ['move-storage-azure', 'move-storage-gcs']) assert.equal(corsican[key], english[key]);
assert.match(corsican['backup-restore-confirm'], /appicci.*avatar.*sistema di schedarii.*dati.*basa di dati.*modu sceltu/);
assert.match(corsican['gcs-credentials-description'], /Facultativu.*Lasciate viotu.*schedariu di chjave o i dati d’accessu predefiniti/);
for (const literal of ['New principals', 'client_email', 'Storage Object Admin', 'Grant access']) assert.ok(corsican['gcs-permissions-note'].includes(literal), literal);
assert.match(corsican['gcs-permissions-note'], /lettura è scrittura/);
assert.match(corsican['s3-secret-key-menu-path'], /una sola volta/);
assert.ok(corsican['s3-secret-key-menu-path'].includes('Download .csv'));
assert.ok(corsican['s3-access-key-menu-path'].includes('Application running outside AWS'));

const boardMigrationCorrectionKeys = ["writable-path", "writable-path-description", "add-job", "attachment-migration", "attachment-monitoring", "attachment-settings", "attachment-storage-settings", "back-to-settings", "card-show-lists-on-minicard", "comprehensive-board-migration", "comprehensive-board-migration-description", "delete-duplicate-empty-lists-migration", "delete-duplicate-empty-lists-migration-description", "lost-cards-list", "fix-missing-lists-migration", "fix-missing-lists-migration-description", "fix-avatar-urls-migration", "migration-complete", "migration-successful", "migration-failed", "migrations-description", "run-migration", "run-comprehensive-migration-confirm", "run-delete-duplicate-empty-lists-migration-confirm", "run-fix-missing-lists-migration-confirm", "restore-lost-cards-nothing-to-restore", "migration-progress-title", "migration-progress-overall", "migration-progress-current-step", "migration-progress-status", "migration-progress-details", "has-swimlanes", "step-analyze-board-structure", "step-fix-orphaned-cards", "step-convert-shared-lists", "step-ensure-per-swimlane-lists", "step-validate-migration", "step-fix-avatar-urls", "step-fix-attachment-urls", "step-analyze-lists", "step-update-cards", "step-finalize", "step-delete-duplicate-empty-lists", "step-ensure-lost-cards-swimlane", "step-restore-swimlanes", "step-fix-missing-ids", "step-scan-users", "step-scan-files", "step-fix-file-urls", "completed", "converting-board-description", "cpu-usage", "current-action", "database-migrations", "estimated-time-remaining"];
for (const key of boardMigrationCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /Percorso|processo|allegati|Impostazioni|Torna alle|minischeda|Esegue controlli|liste vuote|Rimuove|ripristinati|Correggi|Completato|cù successo|non riuscita|Esegui |Verranno|Verrà|Continuare|Nessuna swimlane|in corso|Avanzamento|Passaggio corrente|Analizza|Converti|Convalida|Aggiorna|Finalizza|Garantisci|Controllo|Correzione|Potrebbe|Utilizzo|Azione corrente|del database|Tempo stimato/, key);
}
assert.match(corsican['delete-duplicate-empty-lists-migration-description'], /senza carte È.*altra lista.*listessu titulu.*cuntene carte/);
assert.match(corsican['run-delete-duplicate-empty-lists-migration-confirm'], /Prima.*spartute.*per corsia.*po.*squassate.*listessu titulu.*cuntene carte/);
assert.match(corsican['migrations-description'], /Ogni migrazione.*individualmente/);
assert.match(corsican['comprehensive-board-migration-description'], /ordine di e liste.*pusizioni di e carte.*struttura di e corsie/);
assert.equal(corsican['step-delete-duplicate-empty-lists'], corsican['delete-duplicate-empty-lists-migration']);
assert.match(corsican['restore-lost-cards-nothing-to-restore'], /Nisuna corsia, lista o carta/);

const monitoringControlCorrectionKeys = ["every-1-minute", "export-monitoring", "filesystem-attachments", "filesystem-size", "filesystem-storage", "force-board-scan", "gridfs-attachments", "gridfs-storage", "hide-list-on-minicard", "job-description", "job-details", "job-name", "job-queue", "max-concurrent", "memory-usage", "migrate-all-to-filesystem", "migrate-all-to-gridfs", "migrate-all-to-s3", "migrated-attachments", "migration-batch-size", "migration-batch-size-description", "migration-cpu-threshold-description", "migration-delay-ms", "migration-info-text", "migration-log", "migration-resumed", "migration-steps", "next-run", "operation-type", "overall-progress", "refresh", "refresh-monitoring", "remaining-attachments", "resume-migration", "run-once", "s3-attachments", "s3-storage", "scanning-status", "show-list-on-minicard", "showChecklistAtMinicard", "showing", "start-test-operation", "start-time", "stop-migration", "storage-distribution", "total-attachments", "total-operations", "total-size", "unmigrated-boards", "weight", "current-step", "create-account"];
for (const key of monitoringControlCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /Ogni minuto|monitoraggio|Allegati|In corsu:|minischeda|del processo|dei processi|Massimo concorrenti|Utilizzo|Migra tutto|del batch|allegati|Metti in pausa|quando|vengono eseguite|Passaggi|Prossima|Tipo di|Avanzamento|Aggiorna|Riprendi|Esegui una|Stato di a|Visualizzazione|Avvia operazione|di inizio|Arresta la|di u storage|Totale|non migrate|Peso|Passaggio corrente|Creà account/, key);
}
for (const key of ['gridfs-storage', 's3-storage']) assert.equal(corsican[key], english[key]);
assert.match(corsican['migration-batch-size-description'], /ogni gruppu \(1-100\)/);
assert.match(corsican['migration-cpu-threshold-description'], /pausa.*CPU franca.*\(10-90\)/);
assert.match(corsican['migration-info-text'], /una sola volta.*cuntinueghja in fondu.*chjudite u navigatore/);
for (const [key, target] of [['migrate-all-to-gridfs', 'GridFS'], ['migrate-all-to-s3', 'S3']]) assert.ok(corsican[key].endsWith(target));
assert.match(corsican['migration-delay-ms'], /\(ms\)/);

const importStatusCorrectionKeys = ["available-repositories", "repositories", "repository", "repository-name", "last-modified", "create-repository", "upload-repository", "api-endpoints", "otp-required", "invalid-credentials", "username-password-required", "password-mismatch", "user-exists", "login", "login-allow", "file", "log", "logout", "server", "protocol", "summary", "problems-summary-help", "problems-status-title", "problems-in-progress-help", "repair-broken-cards", "repairing", "repair-broken-cards-done-unfixable", "cpu-usage-current", "cpu-load-average", "event-datetime", "event-action", "event-detail", "event-ip", "event-ipv4", "event-ipv6", "integrityReportTitle", "export-select-what-to-include", "export-card-details", "import-here-instruction", "import-not-wekan-export", "operator-number", "globalSearch-instructions-operator-number", "import-board-source", "import-parts-instruction", "import-wekan-file"];
for (const key of importStatusCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /Repository disponibili|dei sorgenti|del repository|Aggiorna|OTP richiesto|Username|non validi|sono obbligatori|non corrispondono|esiste già|Accesso|Documento|Registro|Elaboratore|Protocollo|Riepilogo|che hai esaminato|Queste migrazioni|Ripara le|in corso|non hanno|Utilizzo attuale|carico medio|Indirizzo|del schedariu system|cosa includere|Dettagli di a|qui un.esportazione|non è un.esportazione|il cui numero|Vengono importate|schedariu di esportazione/, key);
}
assert.match(corsican['repair-broken-cards-done-unfixable'], /__fixed__.*__unfixable__.*ùn anu micca tavula.*ùn ponu micca esse riparate autumaticamente/);
assert.match(corsican['problems-summary-help'], /Marcate.*esaminatu.*Cunfirmà.*zeru.*prublemi novi/);
assert.match(corsican['import-parts-instruction'], /Solu e parte marcate.*listessa scelta.*espurtazione/);
assert.match(corsican['import-here-instruction'], /\.json o \.zip/);
assert.equal(corsican['operator-number'], 'numeru');

const flowAnalyticsCorrectionKeys = ["twoFactorCode-invalid", "wip-limit-groups", "wip-limit-group-name-placeholder", "wip-limit-group-add", "wip-limit-group-select-swimlane", "wip-limit-group-apply-swimlane", "list-sync-credential-placeholder", "list-sync-now-error", "board-view-aging-wip", "board-view-blocker-analysis", "board-view-monte-carlo", "board-view-process-behavior", "board-view-size-cycle-time", "flow-unknown", "flow-age-days", "flow-p85", "flow-samples", "flow-signal", "flow-unusual", "flow-blocker", "flow-episodes", "flow-active", "flow-blocked-days", "flow-unknown-start", "flow-confidence", "flow-target-count", "flow-finish-days", "flow-finish-date", "flow-target-date", "flow-capacity", "flow-history-days", "flow-beyond-horizon", "flow-mean", "flow-moving-range", "flow-mr-mean", "flow-size-source", "flow-size", "flow-error", "flow-details", "flow-note-agingWip", "flow-note-blockerAnalysis", "flow-note-monteCarlo", "flow-note-processBehavior", "flow-note-sizeCycleTime", "move-reason", "ask-move-reason", "time-adjustments"];
for (const key of flowAnalyticsCorrectionKeys) {
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
  assert.doesNotMatch(corsican[key], /ci vole à piace|Attiva limite|tavula Corsia|parolla d.intesa|fallita|Invecchiamento|sconosciuto|È bloccata|Completato|Dettagli|In corsu: Planning/, key);
}
assert.match(corsican['wip-limit-groups'], /Gruppi.*WIP/);
assert.match(corsican['flow-note-agingWip'], /cinque sughjorni.*manca.*scunnisciutu/);
assert.match(corsican['flow-note-blockerAnalysis'], /squassate.*copie cunservate.*sovrapponenu.*separatamente/);
assert.match(corsican['flow-note-monteCarlo'], /2\.000.*UTC.*senza travagliu compiu.*coda superiore.*coda inferiore.*ùn hè micca una guaranzia.*3\.650.*Senza carte compie/);
assert.match(corsican['flow-note-processBehavior'], /Principiu.*creazione.*Fine.*archiviazione.*XmR.*dui compii validi/);
assert.match(corsican['flow-note-sizeCycleTime'], /Planning Poker.*numericu.*mancanti.*micca valide.*omesse.*creazione.*archiviazione/);
assert.match(corsican['move-reason'], /facultativa/);
assert.match(corsican['flow-error'], /Verificate i valori è pruvate torna/);

const blocklyKeyLegends = ["blockly-BACKSPACE_KEY", "blockly-CAPS_LOCK_KEY", "blockly-CONTROL_KEY", "blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-HOME_KEY", "blockly-INSERT_KEY"];
for (const key of blocklyKeyLegends) assert.equal(corsican[key], english[key], key);
assert.deepEqual(tokens('bloccu %1 dopu à %2; %1'), ['%1', '%1', '%2']);
assert.notDeepEqual(tokens('bloccu %1'), tokens('block %2'));
assert.notDeepEqual(tokens('bloccu %1'), tokens('block %1 %1'));
assert.match(corsican['map-view-empty'], /pianu internu d’un bastimentu/);
assert.doesNotMatch(corsican['map-view-empty'], /pianterrenu/);

for (const key of ["blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PAUSE_KEY", "blockly-SHIFT_KEY", "blockly-SPACE_KEY"]) assert.equal(corsican[key], english[key], key);
assert.match(corsican['blockly-LISTS_SORT_TOOLTIP'], /^Urdineghja.*copia/);
assert.doesNotMatch(corsican['blockly-LISTS_SORT_TOOLTIP'], /Ordina/);
for (const literal of ['Enter', 'Shift+Enter', 'Escape']) assert.ok(corsican['blockly-WORKSPACE_SEARCH_INPUT_LABEL'].includes(literal), literal);
assert.doesNotMatch(corsican['blockly-WORKSPACE_SEARCH_INPUT_LABEL'], /Entrata|Maiuscule/);
assert.match(corsican['blockly-MATH_RANDOM_FLOAT_TOOLTIP'], /0\.0 inclusu.*1\.0 esclusu/);
assert.match(corsican['blockly-MATH_RANDOM_INT_TOOLTIP'], /limiti.*inclusi/);
assert.match(corsican['blockly-LOGIC_OPERATION_TOOLTIP_AND'], /duie entrate sò vere/);
assert.match(corsican['blockly-LOGIC_OPERATION_TOOLTIP_OR'], /almenu una entrata hè vera/);
assert.notEqual(corsican['blockly-LOGIC_OPERATION_TOOLTIP_AND'], corsican['blockly-LOGIC_OPERATION_TOOLTIP_OR']);
for (const key of ['COS', 'SIN', 'TAN']) assert.match(corsican[`blockly-MATH_TRIG_TOOLTIP_${key}`], /gradi, micca in radianti/);

// Final source-ordered pass: recovery controls and email attachment labels.
const finalRecoveryLabels = {
  'stuck-sync-operation-progress': 'Avanzamentu',
  'stuck-sync-operation-reason': 'Mutivu',
  'stuck-sync-operation-refresh': 'Attualizà',
  'interrupted-import-refresh': 'Attualizà',
  'email-to-card-part-attachments': 'Appicci',
};
for (const [key, value] of Object.entries(finalRecoveryLabels)) {
  assert.equal(corsican[key], value);
  assert.doesNotMatch(corsican[key], /Avanzamento|Motivo|Aggiorna|Alligati/);
}
assert.match(corsican['stuck-sync-operation-description'], /digià appiicati fermanu.*ùn seranu mai scritti/);
assert.match(corsican['interrupted-import-description'], /ùn pò micca esse ripigliata.*schedariu fonte.*micca cunservatu/);
assert.match(corsican['interrupted-import-discard-confirm'], /tuttu.*squassati definitivamente/);
assert.match(corsican['history-request-hint'], /listessa dumanda.*ùn pò mai annullà un secondu/);
assert.match(corsican['email-to-card-address-private'], /quellu chì l[’']hà/);
assert.match(corsican['email-to-card-address-private'], /in u vostru nome/);
assert.match(corsican['email-view-too-many-recipients'], /À u più 20/);
