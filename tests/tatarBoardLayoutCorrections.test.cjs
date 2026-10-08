'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tt.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["no-boards-selected", "select-only-one-board", "selected-label", "set-selected-starred", "set-selected-unstarred", "set-selected-home", "unset-selected-home", "home-board-badge", "home-board-empty", "home-board-remove", "home-board-remove-confirm", "activity-dueDate", "activity-endDate", "add-card-to-top-of-list", "add-card-to-bottom-of-list", "setListWidthPopup-title", "set-list-width", "set-list-width-value", "list-width-shared-note", "list-width-personal-note", "personal-list-width", "personal-list-width-description", "fixed-list-width", "click-to-enable-fixed-list-width", "click-to-disable-fixed-list-width", "fixed-list-width-note", "keyboard-shortcuts-enabled", "keyboard-shortcuts-disabled", "setSwimlaneHeightPopup-title", "set-swimlane-height", "set-swimlane-height-value", "swimlane-height-error-message", "add-subtask", "add-existing-card-as-subtask-empty", "add-checklist", "close-add-checklist-item", "close-edit-checklist-item", "convertChecklistItemToCardPopup-title", "add-cover", "add-after-list", "added", "admin", "admin-desc", "admin-announcement", "admin-announcement-active", "admin-announcement-title", "all-boards-hide", "public-boards", "and-n-other-card", "and-n-other-card_plural", "apply", "app-is-offline", "app-try-reconnect", "archive-board-confirm", "archive-list", "archive-swimlane", "archive-selection", "archiveBoardPopup-title", "archived-items", "archived-boards", "restore-board", "no-archived-boards", "archives", "assign-member", "attached", "attachment-delete-pop", "attachmentDeletePopup-title", "auto-watch", "avatar-too-big", "board-change-color", "board-change-background-image", "board-background-image-url", "add-background-image", "remove-background-image", "show-at-all-boards-page", "board-info-on-my-boards", "boardInfoOnMyBoardsPopup-title", "boardInfoOnMyBoards-title", "show-card-counter-per-list", "show-board_members-avatar", "board_members", "card_members", "board_assignees", "card_assignees", "board-nb-stars", "board-not-found", "board-private-info", "board-public-info", "board-drag-drop-reorder-or-click-open", "board-open-and-move-between-remaining-and-workspaces", "boardChangeColorPopup-title", "changeColorPopup-title", "changeFontPopup-title", "boardChangeBackgroundImagePopup-title", "allBoardsChangeColorPopup-title", "allBoardsChangeBackgroundImagePopup-title", "boardChangeTitlePopup-title", "boardChangeVisibilityPopup-title", "boardChangeWatchPopup-title", "boardChangeViewPopup-title", "board-view", "desktop-mode", "mobile-mode", "mobile-desktop-toggle", "zoom-in", "zoom-out", "zoom-level", "enter-zoom-level", "board-view-cal", "board-view-multiboard-cal", "board-view-collapse", "board-view-gantt", "board-view-table", "board-view-stats", "bucket-example", "calendar-previous-month-label", "calendar-next-month-label", "card-archived", "board-archived", "card-comments-title", "card-delete-notice", "card-delete-pop", "card-delete-suggest-archive", "card-archive-pop", "card-archive-suggest-cancel", "list-archive-pop", "list-archive-suggest", "listArchivePopup-title", "swimlane-archive-pop", "swimlane-archive-suggest", "swimlaneArchivePopup-title", "card-due", "card-due-on", "due-days-overdue", "card-spent", "card-edit-attachments", "card-edit-custom-fields", "card-edit-labels", "card-edit-members", "card-labels-title", "card-members-title", "card-start-on", "cardAttachmentsPopup-title", "cardCustomField-datePopup-title", "cardCustomFieldsPopup-title", "cardStartVotingPopup-title", "positiveVoteMembersPopup-title", "negativeVoteMembersPopup-title", "card-edit-voting", "editVoteEndDatePopup-title", "allowNonBoardMembers", "vote-question", "vote-public", "vote-for-it", "vote-against", "deleteVotePopup-title", "vote-delete-pop", "cardStartPlanningPokerPopup-title", "card-edit-planning-poker", "editPokerEndDatePopup-title", "poker-question", "poker-finish", "poker-result-votes", "poker-result-who", "poker-replay", "set-estimation", "deletePokerPopup-title", "poker-delete-pop", "cardArchivePopup-title", "cardDetailsActionsPopup-title", "cardDependenciesPopup-title", "cardDependencyIconPopup-title", "dependencyLinePopup-title", "importDependenciesPopup-title", "addBoardOrgPopup-title", "removeBoardOrgPopup-title", "removeBoardTeamPopup-title", "adminChangeAvatarPopup-title", "boardBackgroundsPopup-title", "deleteBoardBackgroundPopup-title", "deleteDuplicateListsPopup-title", "userDeletePopup-title", "userAnonymizePopup-title", "addBoardDomainPopup-title", "removeBoardDomainPopup-title", "mapImportedMemberPopup-title", "exportChecklistPopup-title", "importSwimlanePopup-title", "importListPopup-title", "importCardPopup-title", "importBoardIntoPopup-title", "cardStickersPopup-title", "invitePeoplePopup-title", "listsortPopup-title", "listWidthErrorPopup-title", "restoreArchivedCardToListPopup-title", "restoreArchivedListToSwimlanePopup-title", "rulesImportExportPopup-title", "swimlaneHeightErrorPopup-title", "bookmarksPopup-title"];
test('Tatar board layout corrections preserve keys and placeholders',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0400-\u04ff]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(locale[key],/\u0433\u0435\u043d\u0438\u0448\u043b\u0438\u043a|\u0441\u0435\u0447\u0438\u043b|\u0441\u0440\u04e9\u0445\u0441\u04d9\u0442/i,key);
 }
});
test('Tatar layout controls preserve personal scope, switch polarity and dimensions',()=>{
 assert.equal(locale['setListWidthPopup-title'],locale['set-list-width']);
 assert.equal(locale['setSwimlaneHeightPopup-title'],locale['set-swimlane-height']);
 assert.match(locale['set-list-width-value'],/\u043a\u0438\u04a3\u043b\u0435\u0433\u0435/);
 assert.match(locale['set-swimlane-height-value'],/\u0431\u0438\u0435\u043a\u043b\u0435\u0433\u0435/);
 for(const key of ['list-width-personal-note','fixed-list-width-note']) assert.match(locale[key],/\u0441\u0435\u0437\u043d\u0435\u04a3 \u04e9\u0447\u0435\u043d \u0433\u0435\u043d\u04d9/);
 assert.match(locale['home-board-remove-confirm'],/\u0431\u0435\u0442\u0435\u0440\u0435\u043b\u043c\u0438/);
 assert.notEqual(locale['keyboard-shortcuts-enabled'],locale['keyboard-shortcuts-disabled']);
 assert.notEqual(locale['click-to-enable-fixed-list-width'],locale['click-to-disable-fixed-list-width']);
 for(const kind of ['dueDate','endDate']) assert.match(locale['activity-'+kind],/^%s \u0438\u0442\u0435\u043f %s/);
});


test('Tatar common controls preserve empty results, form actions and loading warning',()=>{
 assert.match(locale['add-existing-card-as-subtask-empty'],/\u0442\u0430\u0431\u044b\u043b\u043c\u0430\u0434\u044b/);
 assert.notEqual(locale['close-add-checklist-item'],locale['close-edit-checklist-item']);
 assert.equal(locale['add-checklist'],locale['r-add-checklist']);
 assert.equal(locale['and-n-other-card'],locale['and-n-other-card_plural']);
 assert.match(locale['app-is-offline'],/\u043c\u04d9\u0433\u044a\u043b\u04af\u043c\u0430\u0442 \u044e\u0433\u0430\u043b\u0443\u0433\u0430/);
 assert.match(locale['app-is-offline'],/\u0442\u0443\u043a\u0442\u0430\u043c\u0430\u0433\u0430\u043d\u044b\u043d/);
 assert.notEqual(locale['archive-list'],locale['archive-swimlane']);
 assert.match(locale['admin'],/^\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440$/);
});


test('Tatar archive and board controls preserve deletion, visibility and member scope',()=>{
 assert.equal(locale['archives'],locale['archived-items']);
 assert.match(locale['no-archived-boards'],/\u044e\u043a/);
 assert.match(locale['attachment-delete-pop'],/\u043a\u0438\u0440\u0435 \u043a\u0430\u0439\u0442\u0430\u0440\u044b\u043f \u0431\u0443\u043b\u043c\u044b\u0439/);
 assert.notEqual(locale['attachment-delete-pop'],locale['attachment-soft-delete-pop']);
 assert.equal(locale['board-info-on-my-boards'],locale['boardInfoOnMyBoardsPopup-title']);
 assert.equal(locale['board-info-on-my-boards'],locale['boardInfoOnMyBoards-title']);
 for(const visibility of ['private','public']) assert.match(locale['board-'+visibility+'-info'],/<strong>[^<]+<\/strong>/);
 assert.notEqual(locale['board-private-info'],locale['board-public-info']);
 assert.equal(new Set(['board_members','card_members','board_assignees','card_assignees'].map(key=>locale[key])).size,4);
 assert.notEqual(locale['add-background-image'],locale['remove-background-image']);
});


test('Tatar board view controls preserve aliases, zoom limits and mode distinctions',()=>{
 assert.equal(locale['boardChangeViewPopup-title'],locale['board-view']);
 for(const key of ['boardChangeBackgroundImagePopup-title','allBoardsChangeBackgroundImagePopup-title']) assert.equal(locale[key],locale['board-change-background-image']);
 for(const key of ['changeColorPopup-title','allBoardsChangeColorPopup-title']) assert.equal(locale[key],locale['board-change-color']);
 assert.ok(locale['enter-zoom-level'].includes('50-300%'));
 assert.notEqual(locale['zoom-in'],locale['zoom-out']);
 assert.notEqual(locale['desktop-mode'],locale['mobile-mode']);
 assert.notEqual(locale['board-view-cal'],locale['board-view-multiboard-cal']);
 assert.match(locale['board-view-stats'],/^\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430$/);
 for(const key of ['board-view-gantt-frappe','board-view-gantt-dhtmlx']) assert.equal(locale[key],english[key]);
});


test('Tatar card archive guidance preserves restoration and permanent deletion distinctions',()=>{
 assert.notEqual(locale['calendar-previous-month-label'],locale['calendar-next-month-label']);
 for(const key of ['card-archive-pop','list-archive-pop','swimlane-archive-pop']) assert.match(locale[key],/\u043a\u04af\u0440\u0435\u043d\u043c\u04d9\u044f\u0447\u04d9\u043a/);
 for(const key of ['card-archive-suggest-cancel','list-archive-suggest','swimlane-archive-suggest']) assert.match(locale[key],/\u0442\u043e\u0440\u0433\u044b\u0437\u0430 \u0430\u043b\u0430\u0441\u044b\u0437/);
 assert.match(locale['card-delete-pop'],/\u043a\u0438\u0440\u0435 \u043a\u0430\u0439\u0442\u0430\u0440\u044b\u043f \u0431\u0443\u043b\u043c\u044b\u0439/);
 assert.match(locale['due-days-overdue'],/\u0441\u043e\u04a3\u0433\u0430 \u043a\u0430\u043b\u0433\u0430\u043d/);
 assert.notEqual(locale['card-due-on'],locale['card-start-on']);
 assert.equal(new Set(['attachments','custom-fields','labels','members'].map(kind=>locale['card-edit-'+kind])).size,4);
});


test('Tatar voting keeps numeric options exact and distinguishes support from opposition',()=>{
 for(const key of ['one','two','three','five','eight','thirteen','twenty','forty','oneHundred','unsure']) assert.equal(locale['poker-'+key],english['poker-'+key]);
 assert.notEqual(locale['vote-for-it'],locale['vote-against']);
 assert.notEqual(locale['positiveVoteMembersPopup-title'],locale['negativeVoteMembersPopup-title']);
 assert.equal(locale['cardCustomFieldsPopup-title'],locale['card-edit-custom-fields']);
 for(const key of ['vote-delete-pop','poker-delete-pop']) assert.match(locale[key],/\u0411\u0435\u0442\u0435\u0440\u04af \u0434\u0430\u0438\u043c\u0438/);
 assert.match(locale['allowNonBoardMembers'],/\u041a\u0435\u0440\u0433\u04d9\u043d \u0431\u0430\u0440\u043b\u044b\u043a/);
 assert.match(locale['poker-result-votes'],/^\u0422\u0430\u0432\u044b\u0448\u043b\u0430\u0440$/);
});


test('Tatar popup labels preserve account actions and restoration targets',()=>{
 assert.notEqual(locale['userDeletePopup-title'],locale['userAnonymizePopup-title']);
 assert.match(locale['userAnonymizePopup-title'],/\u0430\u043d\u043e\u043d\u0438\u043c\u043b\u0430\u0448\u0442\u044b\u0440\u0443/);
 assert.match(locale['addBoardOrgPopup-title'],/^\u041e\u0435\u0448\u043c\u0430/);
 assert.notEqual(locale['addBoardDomainPopup-title'],locale['removeBoardDomainPopup-title']);
 assert.notEqual(locale['restoreArchivedCardToListPopup-title'],locale['restoreArchivedListToSwimlanePopup-title']);
 assert.equal(locale['listsortPopup-title'],locale['r-sort-list']);
 assert.equal(locale['deleteBoardBackgroundPopup-title'],locale['remove-background-image']);
 assert.match(locale['listWidthErrorPopup-title'],/\u043a\u0438\u04a3\u043b\u0435\u0433\u0435/);
 assert.match(locale['swimlaneHeightErrorPopup-title'],/\u0431\u0438\u0435\u043a\u043b\u0435\u0433\u0435/);
 assert.equal(new Set(['importSwimlanePopup-title','importListPopup-title','importCardPopup-title','importBoardIntoPopup-title'].map(key=>locale[key])).size,4);
});
