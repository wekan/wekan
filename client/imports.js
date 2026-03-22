// ============================================================================
// WeKan Client — All Imports
// Loaded by client/main.js after bootstrap (collectionHelpers) completes.
// ============================================================================

// ----------------------------------------------------------------------------
// 1. Shared imports (i18n, utilities, reactive cache)
// ----------------------------------------------------------------------------
import '/imports/i18n/index';
import '/imports/i18n/accounts';
import '/imports/i18n/blaze';
import '/imports/i18n/languages';
import '/imports/i18n/moment';
import '/imports/i18n/tap';
import '/imports/lib/customHeadDefaults';
import '/imports/lib/dateUtils';
import '/imports/lib/secureDOMPurify';
import '/imports/reactiveCache';
import '/imports/attachmentMigrationClient';
import '/imports/cronMigrationClient';

// ----------------------------------------------------------------------------
// 3. Models (shared collections — client-safe only, skip server-only exporters/importers)
// ----------------------------------------------------------------------------
import '/models/accessibilitySettings';
import '/models/accountSettings';
import '/models/actions';
import '/models/activities';
import '/models/announcements';
import '/models/attachments';
import '/models/attachmentStorageSettings';
import '/models/avatars';
import '/models/boards';
import '/models/cardCommentReactions';
import '/models/cardComments';
import '/models/cards';
import '/models/checklistItems';
import '/models/checklists';
import '/models/counters';
import '/models/customFields';
import '/models/fileValidation';
import '/models/impersonatedUsers';
import '/models/integrations';
import '/models/invitationCodes';
import '/models/lists';
import '/models/lockoutSettings';
import '/models/org';
import '/models/orgUser';
import '/models/positionHistory';
import '/models/presences';
import '/models/rules';
import '/models/runOnServer';
import '/models/settings';
import '/models/swimlanes';
import '/models/tableVisibilityModeSettings';
import '/models/team';
import '/models/translation';
import '/models/triggers';
import '/models/unsavedEdits';
import '/models/userPositionHistory';
import '/models/usersessiondata';
import '/models/users';
import '/models/watchable';

// Models — lib (shared helpers)
import '/models/lib/attachmentBackwardCompatibility';
import '/models/lib/attachmentStoreStrategy';
import '/models/lib/attachmentUrlValidation';
import '/models/lib/fileStoreStrategy';
import '/models/lib/httpStream';
import '/models/lib/meteorMongoIntegration';
import '/models/lib/mongodbConnectionManager';
import '/models/lib/mongodbDriverManager';
import '/models/lib/universalUrlGenerator';
import '/models/lib/userStorageHelpers';

// ----------------------------------------------------------------------------
// 4. Config (shared)
// ----------------------------------------------------------------------------
import '/config/accounts';
import '/config/const';
import '/config/models';
import '/config/query-classes';
import '/config/router';
import '/config/search-const';

// ----------------------------------------------------------------------------
// 5. Client library files
// ----------------------------------------------------------------------------
import '/client/lib/accessibility';
import '/client/lib/attachmentMigrationManager';
import '/client/lib/autofocus';
import '/client/lib/boardConverter';
import '/client/lib/boardMultiSelection';
import '/client/lib/cardSearch';
import '/client/lib/cssEvents';
import '/client/lib/currentCard';
import '/client/lib/customFields';
import '/client/lib/datepicker';
import '/client/lib/dialogWithBoardSwimlaneList';
import '/client/lib/dialogWithBoardSwimlaneListCard';
import '/client/lib/dropImage';
import '/client/lib/escapeActions';
import '/client/lib/exportHTML';
import '/client/lib/filter';
import '/client/lib/fixDuplicateLists';
import '/client/lib/i18n';
import '/client/lib/infiniteScrolling';
import '/client/lib/inlinedform';
import '/client/lib/jquery-ui';
import '/client/lib/keyboard';
import '/client/lib/localStorageValidator';
import '/client/lib/modal';
import '/client/lib/multiSelection';
import '/client/lib/originalPositionHelpers';
import '/client/lib/pasteImage';
import '/client/lib/popup';
import '/client/lib/secureDOMPurify';
import '/client/lib/spinner';
import '/client/lib/textComplete';
import '/client/lib/unsavedEdits';
import '/client/lib/uploadProgressManager';
import '/client/lib/utils';

// ----------------------------------------------------------------------------
// 6. Client config
// ----------------------------------------------------------------------------
import '/client/config/blazeHelpers';
import '/client/config/gecko-fix';

// ----------------------------------------------------------------------------
// 7. Client components — Jade templates & JS logic
//    Import both .jade (template) and .js (logic) for each component.
//    Jade-only files (no matching .js) are also imported.
// ----------------------------------------------------------------------------

// --- Activities ---
import '/client/components/activities/activities.jade';
import '/client/components/activities/activities.js';
import '/client/components/activities/activities.css';
import '/client/components/activities/comments.jade';
import '/client/components/activities/comments.js';
import '/client/components/activities/comments.css';

// --- Board Conversion Progress ---
import '/client/components/boardConversionProgress.jade';
import '/client/components/boardConversionProgress.js';
import '/client/components/boardConversionProgress.css';

// --- Boards ---
import '/client/components/boards/boardArchive.jade';
import '/client/components/boards/boardArchive.js';
import '/client/components/boards/boardBody.jade';
import '/client/components/boards/boardBody.js';
import '/client/components/boards/boardBody.css';
import '/client/components/boards/boardColors.css';
import '/client/components/boards/boardHeader.jade';
import '/client/components/boards/boardHeader.js';
import '/client/components/boards/boardHeader.css';
import '/client/components/boards/boardsList.jade';
import '/client/components/boards/boardsList.js';
import '/client/components/boards/boardsList.css';
import '/client/components/boards/calendarView.css';
import '/client/components/boards/miniboard.jade';
import '/client/components/boards/originalPositionsView.jade';
import '/client/components/boards/originalPositionsView.js';
import '/client/components/boards/originalPositionsView.css';

// --- Cards ---
import '/client/components/cards/attachments.jade';
import '/client/components/cards/attachments.js';
import '/client/components/cards/attachments.css';
import '/client/components/cards/cardCustomFields.jade';
import '/client/components/cards/cardCustomFields.js';
import '/client/components/cards/cardDate.jade';
import '/client/components/cards/cardDate.js';
import '/client/components/cards/cardDate.css';
import '/client/components/cards/cardDescription.jade';
import '/client/components/cards/cardDescription.js';
import '/client/components/cards/cardDescription.css';
import '/client/components/cards/cardDetails.jade';
import '/client/components/cards/cardDetails.js';
import '/client/components/cards/cardDetails.css';
import '/client/components/cards/cardTime.jade';
import '/client/components/cards/cardTime.js';
import '/client/components/cards/cardTime.css';
import '/client/components/cards/checklists.jade';
import '/client/components/cards/checklists.js';
import '/client/components/cards/checklists.css';
import '/client/components/cards/inlinedCardDescription.jade';
import '/client/components/cards/labels.jade';
import '/client/components/cards/labels.js';
import '/client/components/cards/labels.css';
import '/client/components/cards/minicard.jade';
import '/client/components/cards/minicard.js';
import '/client/components/cards/minicard.css';
import '/client/components/cards/resultCard.jade';
import '/client/components/cards/resultCard.js';
import '/client/components/cards/resultCard.css';
import '/client/components/cards/subtasks.jade';
import '/client/components/cards/subtasks.js';
import '/client/components/cards/subtasks.css';

// --- Common ---
import '/client/components/common/originalPosition.jade';
import '/client/components/common/originalPosition.js';
import '/client/components/common/originalPosition.css';

// --- Forms ---
import '/client/components/forms/datepicker.jade';
import '/client/components/forms/datepicker.js';
import '/client/components/forms/datepicker.css';
import '/client/components/forms/forms.css';
import '/client/components/forms/inlinedform.jade';

// --- Gantt ---
import '/client/components/gantt/gantt.jade';
import '/client/components/gantt/gantt.js';
import '/client/components/gantt/gantt.css';
import '/client/components/gantt/ganttCard.jade';
import '/client/components/gantt/ganttCard.js';
import '/client/components/gantt/ganttCard.css';

// --- Import ---
import '/client/components/import/import.jade';
import '/client/components/import/import.js';
import '/client/components/import/import.css';
import '/client/components/import/csvMembersMapper.js';
import '/client/components/import/trelloMembersMapper.js';
import '/client/components/import/wekanMembersMapper.js';

// --- Lib ---
import '/client/components/lib/basicTabs.jade';
import '/client/components/lib/basicTabs.js';

// --- Lists ---
import '/client/components/lists/list.jade';
import '/client/components/lists/list.js';
import '/client/components/lists/list.css';
import '/client/components/lists/listBody.jade';
import '/client/components/lists/listBody.js';
import '/client/components/lists/listHeader.jade';
import '/client/components/lists/listHeader.js';
import '/client/components/lists/minilist.jade';

// --- Main ---
import '/client/components/main/accessibility.jade';
import '/client/components/main/accessibility.js';
import '/client/components/main/accessibility.css';
import '/client/components/main/bookmarks.jade';
import '/client/components/main/bookmarks.js';
import '/client/components/main/brokenCards.jade';
import '/client/components/main/brokenCards.js';
import '/client/components/main/brokenCards.css';
import '/client/components/main/dueCards.jade';
import '/client/components/main/dueCards.js';
import '/client/components/main/dueCards.css';
import '/client/components/main/editor.jade';
import '/client/components/main/editor.js';
import '/client/components/main/editor.css';
import '/client/components/main/fonts.css';
import '/client/components/main/globalSearch.jade';
import '/client/components/main/globalSearch.js';
import '/client/components/main/globalSearch.css';
import '/client/components/main/header.jade';
import '/client/components/main/header.js';
import '/client/components/main/header.css';
import '/client/components/main/keyboardShortcuts.jade';
import '/client/components/main/keyboardShortcuts.css';
import '/client/components/main/layouts.jade';
import '/client/components/main/layouts.js';
import '/client/components/main/layouts.css';
import '/client/components/main/myCards.jade';
import '/client/components/main/myCards.js';
import '/client/components/main/myCards.css';
import '/client/components/main/popup.tpl.jade';
import '/client/components/main/popup.js';
import '/client/components/main/popup.css';
import '/client/components/main/spinner.jade';
import '/client/components/main/spinner.js';
import '/client/components/main/spinner_bounce.jade';
import '/client/components/main/spinner_bounce.css';
import '/client/components/main/spinner_cube.jade';
import '/client/components/main/spinner_cube.css';
import '/client/components/main/spinner_cube_grid.jade';
import '/client/components/main/spinner_cube_grid.css';
import '/client/components/main/spinner_dot.jade';
import '/client/components/main/spinner_dot.css';
import '/client/components/main/spinner_double_bounce.jade';
import '/client/components/main/spinner_double_bounce.css';
import '/client/components/main/spinner_rotateplane.jade';
import '/client/components/main/spinner_rotateplane.css';
import '/client/components/main/spinner_scaleout.jade';
import '/client/components/main/spinner_scaleout.css';
import '/client/components/main/spinner_wave.jade';
import '/client/components/main/spinner_wave.css';
import '/client/components/main/support.jade';
import '/client/components/main/support.js';

// --- Notifications ---
import '/client/components/notifications/notification.jade';
import '/client/components/notifications/notification.js';
import '/client/components/notifications/notification.css';
import '/client/components/notifications/notificationIcon.jade';
import '/client/components/notifications/notifications.jade';
import '/client/components/notifications/notifications.js';
import '/client/components/notifications/notifications.css';
import '/client/components/notifications/notificationsDrawer.jade';
import '/client/components/notifications/notificationsDrawer.js';
import '/client/components/notifications/notificationsDrawer.css';

// --- Rules ---
import '/client/components/rules/ruleDetails.jade';
import '/client/components/rules/ruleDetails.js';
import '/client/components/rules/rulesActions.jade';
import '/client/components/rules/rulesActions.js';
import '/client/components/rules/rulesList.jade';
import '/client/components/rules/rulesList.js';
import '/client/components/rules/rulesMain.jade';
import '/client/components/rules/rulesMain.js';
import '/client/components/rules/rulesTriggers.jade';
import '/client/components/rules/rulesTriggers.js';
import '/client/components/rules/rules.css';
import '/client/components/rules/actions/boardActions.jade';
import '/client/components/rules/actions/boardActions.js';
import '/client/components/rules/actions/cardActions.jade';
import '/client/components/rules/actions/cardActions.js';
import '/client/components/rules/actions/checklistActions.jade';
import '/client/components/rules/actions/checklistActions.js';
import '/client/components/rules/actions/mailActions.jade';
import '/client/components/rules/actions/mailActions.js';
import '/client/components/rules/triggers/boardTriggers.jade';
import '/client/components/rules/triggers/boardTriggers.js';
import '/client/components/rules/triggers/cardTriggers.jade';
import '/client/components/rules/triggers/cardTriggers.js';
import '/client/components/rules/triggers/checklistTriggers.jade';
import '/client/components/rules/triggers/checklistTriggers.js';

// --- Settings ---
import '/client/components/settings/adminReports.jade';
import '/client/components/settings/adminReports.js';
import '/client/components/settings/attachments.jade';
import '/client/components/settings/attachments.js';
import '/client/components/settings/attachments.css';
import '/client/components/settings/attachmentSettings.jade';
import '/client/components/settings/connectionMethod.jade';
import '/client/components/settings/connectionMethod.js';
import '/client/components/settings/cronSettings.jade';
import '/client/components/settings/cronSettings.css';
import '/client/components/settings/informationBody.jade';
import '/client/components/settings/informationBody.js';
import '/client/components/settings/invitationCode.jade';
import '/client/components/settings/invitationCode.js';
import '/client/components/settings/lockedUsersBody.js';
import '/client/components/settings/lockedUsersBody.css';
import '/client/components/settings/migrationProgress.jade';
import '/client/components/settings/migrationProgress.js';
import '/client/components/settings/migrationProgress.css';
import '/client/components/settings/peopleBody.jade';
import '/client/components/settings/peopleBody.js';
import '/client/components/settings/peopleBody.css';
import '/client/components/settings/settingBody.jade';
import '/client/components/settings/settingBody.js';
import '/client/components/settings/settingBody.css';
import '/client/components/settings/settingHeader.jade';
import '/client/components/settings/settingHeader.js';
import '/client/components/settings/settingHeader.css';
import '/client/components/settings/translationBody.jade';
import '/client/components/settings/translationBody.js';
import '/client/components/settings/translationBody.css';

// --- Sidebar ---
import '/client/components/sidebar/sidebar.jade';
import '/client/components/sidebar/sidebar.js';
import '/client/components/sidebar/sidebar.css';
import '/client/components/sidebar/sidebarArchives.jade';
import '/client/components/sidebar/sidebarArchives.js';
import '/client/components/sidebar/sidebarCustomFields.jade';
import '/client/components/sidebar/sidebarCustomFields.js';
import '/client/components/sidebar/sidebarFilters.jade';
import '/client/components/sidebar/sidebarFilters.js';
import '/client/components/sidebar/sidebarSearches.jade';
import '/client/components/sidebar/sidebarSearches.js';
import '/client/components/sidebar/sidebarSearches.css';

// --- Swimlanes ---
import '/client/components/swimlanes/swimlaneHeader.jade';
import '/client/components/swimlanes/swimlaneHeader.js';
import '/client/components/swimlanes/swimlanes.jade';
import '/client/components/swimlanes/swimlanes.js';
import '/client/components/swimlanes/swimlanes.css';
import '/client/components/swimlanes/miniswimlane.jade';

// --- Unicode Icons ---
import '/client/components/unicode-icons.js';
import '/client/components/unicode-icons.css';

// --- Users ---
import '/client/components/users/passwordInput.jade';
import '/client/components/users/passwordInput.js';
import '/client/components/users/userAvatar.jade';
import '/client/components/users/userAvatar.js';
import '/client/components/users/userAvatar.css';
import '/client/components/users/userForm.css';
import '/client/components/users/userHeader.jade';
import '/client/components/users/userHeader.js';

// ----------------------------------------------------------------------------
// 8. Startup (must load last — registers service worker, sets up subscriptions)
// ----------------------------------------------------------------------------
import '/client/00-startup';
