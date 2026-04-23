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
import '/models/attachmentMigrationStatus';
import '/imports/cronMigrationClient';

// ----------------------------------------------------------------------------
// 3. Shared models/collections
// ----------------------------------------------------------------------------
import '/imports/startup/shared-models';

// ----------------------------------------------------------------------------
// 4. Shared runtime services
// ----------------------------------------------------------------------------
import '/imports/reactiveCache';

// ----------------------------------------------------------------------------
// 5. Config (shared)
// ----------------------------------------------------------------------------
import '/config/accounts';
import '/config/const';
import '/config/models';
import '/config/query-classes';
import '/config/router';
import '/config/search-const';

// ----------------------------------------------------------------------------
// 6. Client library files
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
import '/client/lib/jquery-ui';
import '/client/lib/localStorageValidator';
import '/client/lib/modal';
import '/client/lib/multiSelection';
import '/client/lib/originalPositionHelpers';
import '/client/lib/pasteImage';
import '/client/lib/secureDOMPurify';
import '/client/lib/spinner';
import '/client/lib/textComplete';
import '/client/lib/unsavedEdits';
import '/client/lib/uploadProgressManager';
import '/client/lib/utils';

// ----------------------------------------------------------------------------
// 7. Client config
// ----------------------------------------------------------------------------
import '/client/config/blazeHelpers';
import '/client/config/gecko-fix';

// ----------------------------------------------------------------------------
// 8. Client features
//    Each feature entry owns its template/logic/style ordering.
// ----------------------------------------------------------------------------
import '/client/features/forms';
import '/client/features/main';
import '/client/features/settings';
import '/client/features/sidebar';
import '/client/features/users';
import '/client/features/activities';
import '/client/features/boardConversion';
import '/client/features/gantt';
import '/client/features/boards';
import '/client/features/cards';
import '/client/features/common';
import '/client/features/importing';
import '/client/features/libComponents';
import '/client/features/lists';
import '/client/features/notifications';
import '/client/features/rules';
import '/client/features/swimlanes';
import '/client/features/unicodeIcons';

// ----------------------------------------------------------------------------
// 8. Startup (must load last — registers service worker, sets up subscriptions)
// ----------------------------------------------------------------------------
import '/client/00-startup';
