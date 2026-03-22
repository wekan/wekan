// ============================================================================
// WeKan Server Entry Point (Rspack)
// All server-side code must be reachable from this file.
// ============================================================================

// ----------------------------------------------------------------------------
// 1. Collection helpers shim (must load before models)
// ----------------------------------------------------------------------------
import '/imports/collectionHelpers';
import '/imports/lib/collectionHelpers';

// SimpleSchema global — previously provided by aldeed:simple-schema package
import SimpleSchema from 'meteor/aldeed:simple-schema';
global.SimpleSchema = SimpleSchema;

// Register collection2 schema extensions that were built-in in older versions
SimpleSchema.extendOptions(['denyUpdate', 'denyInsert']);

// ----------------------------------------------------------------------------
// 2. Shared imports (i18n, utilities, reactive cache)
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

// ----------------------------------------------------------------------------
// 3. Models — shared collections (loaded on both client and server)
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

// Models — server-only exporters
import '/models/csvCreator';
import '/models/export';
import '/models/exportExcel';
import '/models/exportExcelCard';
import '/models/exportPDF';
import '/models/exporter';

// Models — server-only importers
import '/models/import';
import '/models/trelloCreator';
import '/models/wekanCreator';
import '/models/wekanmapper';

// Models — lib (shared helpers)
import '/models/lib/attachmentBackwardCompatibility';
import '/models/lib/attachmentStoreStrategy';
import '/models/lib/attachmentUrlValidation';
import '/models/lib/fileStoreStrategy';
import '/models/lib/fsHooks/createOnAfterUpload';
import '/models/lib/grid/createBucket';
import '/models/lib/grid/createObjectId';
import '/models/lib/httpStream';
import '/models/lib/meteorMongoIntegration';
import '/models/lib/mongodbConnectionManager';
import '/models/lib/mongodbDriverManager';
import '/models/lib/universalUrlGenerator';
import '/models/lib/userStorageHelpers';

// Models — server-only sub-modules
import '/models/server/createWorkbook';
import '/models/server/ExporterCardPDF';
import '/models/server/ExporterExcelCard';
import '/models/server/ExporterExcel';
import '/models/server/metrics';

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
// 5. Server — core startup & configuration
// ----------------------------------------------------------------------------
import '/server/00checkStartup';
import '/server/accounts-common';
import '/server/accounts-lockout-config';
import '/server/authentication';
import '/server/cors';
import '/server/header-login';
import '/server/max-image-pixel';
import '/server/max-size';
import '/server/mongodb-driver-startup';
import '/server/policy';
import '/server/richer-editor-setting-helper';
import '/server/saml';
import '/server/spinner';
import '/server/statistics';

// ----------------------------------------------------------------------------
// 6. Server — attachment handling
// ----------------------------------------------------------------------------
import '/server/attachmentApi';
import '/server/attachmentMigration';
import '/server/attachmentMigrationStatus';
import '/server/boardMigrationDetector';

// ----------------------------------------------------------------------------
// 7. Server — cron & migration
// ----------------------------------------------------------------------------
import '/server/cronJobStorage';
import '/server/cronMigrationManager';

// ----------------------------------------------------------------------------
// 8. Server — webhooks
// ----------------------------------------------------------------------------
import '/server/card-opened-webhook';

// ----------------------------------------------------------------------------
// 9. Server — import helpers
// ----------------------------------------------------------------------------
import '/server/import-users-for-methods';

// ----------------------------------------------------------------------------
// 10. Server — lib (utilities, sanitizers, guards)
// ----------------------------------------------------------------------------
import '/server/lib/customHeadRender';
import '/server/lib/emailLocalization';
import '/server/lib/importer';
import '/server/lib/inputSanitizer';
import '/server/lib/ssrfGuard';
import '/server/lib/utils';

// ----------------------------------------------------------------------------
// 11. Server — methods
// ----------------------------------------------------------------------------
import '/server/methods/fixDuplicateLists';
import '/server/methods/lockedUsers';
import '/server/methods/lockoutSettings';
import '/server/methods/positionHistory';

// ----------------------------------------------------------------------------
// 12. Server — migrations
// ----------------------------------------------------------------------------
import '/server/migrations/comprehensiveBoardMigration';
import '/server/migrations/deleteDuplicateEmptyLists';
import '/server/migrations/ensureValidSwimlaneIds';
import '/server/migrations/fixAllFileUrls';
import '/server/migrations/fixAvatarUrls';
import '/server/migrations/fixMissingListsMigration';
import '/server/migrations/migrateAttachments';
import '/server/migrations/restoreAllArchived';
import '/server/migrations/restoreLostCards';

// ----------------------------------------------------------------------------
// 13. Server — notifications
// ----------------------------------------------------------------------------
import '/server/notifications/email';
import '/server/notifications/notifications';
import '/server/notifications/outgoing';
import '/server/notifications/profile';
import '/server/notifications/watch';

// ----------------------------------------------------------------------------
// 14. Server — publications
// ----------------------------------------------------------------------------
import '/server/publications/accessibilitySettings';
import '/server/publications/accountSettings';
import '/server/publications/activities';
import '/server/publications/announcements';
import '/server/publications/attachmentMigrationStatus';
import '/server/publications/attachments';
import '/server/publications/avatars';
import '/server/publications/boards';
import '/server/publications/cards';
import '/server/publications/cronJobs';
import '/server/publications/cronMigrationStatus';
import '/server/publications/customUI';
import '/server/publications/lockoutSettings';
import '/server/publications/migrationProgress';
import '/server/publications/notifications';
import '/server/publications/org';
import '/server/publications/people';
import '/server/publications/rules';
import '/server/publications/settings';
import '/server/publications/swimlanes';
import '/server/publications/tableVisibilityModeSettings';
import '/server/publications/team';
import '/server/publications/translation';
import '/server/publications/unsavedEdits';
import '/server/publications/userDesktopDragHandles';
import '/server/publications/userGreyIcons';
import '/server/publications/users';

// ----------------------------------------------------------------------------
// 15. Server — routes (REST API, file serving)
// ----------------------------------------------------------------------------
import '/server/routes/attachmentApi';
import '/server/routes/avatarServer';
import '/server/routes/customHeadAssets';
import '/server/routes/legacyAttachments';
import '/server/routes/universalFileServer';

// ----------------------------------------------------------------------------
// 16. Server — rules engine
// ----------------------------------------------------------------------------
import '/server/rulesHelper';
import '/server/triggersDef';

// ----------------------------------------------------------------------------
// 17. Sandstorm integration
// ----------------------------------------------------------------------------
import '/sandstorm';
