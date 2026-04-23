// ============================================================================
// WeKan Server — All Imports
// Loaded by server/main.js after bootstrap (collectionHelpers) completes.
// ============================================================================

// ****IMPORTANT**** Initialize upload directories BEFORE models are loaded
// This ensures ostrio:files can create necessary directories without permission errors
import '/server/initializeDirs';

// ----------------------------------------------------------------------------
// 0. API middleware & auth routes (must register before model routes)
// ----------------------------------------------------------------------------
import '/server/apiMiddleware';
import '/server/apiAuthRoutes';

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

// ----------------------------------------------------------------------------
// 2. Models — shared collections + server-only extensions
// ----------------------------------------------------------------------------
import '/imports/startup/shared-models';
import '/models/attachments.server';
import '/models/avatars.server';
import '/models/fileValidation';

// ----------------------------------------------------------------------------
// 3. Shared runtime services
// ----------------------------------------------------------------------------
import '/imports/reactiveCache';

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
import '/models/lib/universalUrlGenerator';
import '/models/lib/userStorageHelpers';

// Models — server-only sub-modules
import '/models/server/createWorkbook';
import '/models/server/ExporterCardPDF';
import '/models/server/ExporterExcelCard';
import '/models/server/ExporterExcel';
import '/models/server/metrics';
import '/server/models/actions';
import '/server/models/activities';
import '/server/models/attachmentStorageSettings';
import '/server/models/boards';
import '/server/models/cards';
import '/server/models/cardComments';
import '/server/models/checklistItems';
import '/server/models/checklists';
import '/server/models/collectionBootstrap';
import '/server/models/customFields';
import '/server/models/integrations';
import '/server/models/lists';
import '/server/models/org';
import '/server/models/settings';
import '/server/models/swimlanes';
import '/server/models/team';
import '/server/models/translation';
import '/server/models/users';
import '/server/models/userPositionHistory';

// ----------------------------------------------------------------------------
// 4. Config (shared)
// ----------------------------------------------------------------------------
import '/config/accounts';
import '/config/const';
import '/config/models';
import '/config/query-classes';
// router.js is client-only (FlowRouter route actions use client-only modules)
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
import '/server/policy';
import '/server/richer-editor-setting-helper';
import '/server/saml';
import '/server/spinner';
import '/server/statistics';

// ----------------------------------------------------------------------------
// 5. Server — attachment handling
// ----------------------------------------------------------------------------
import '/server/attachmentApi';
import '/server/attachmentMigration';
import '/server/attachmentMigrationStatus';
import '/server/boardMigrationDetector';

// ----------------------------------------------------------------------------
// 6. Server — cron & migration
// ----------------------------------------------------------------------------
import '/server/cronJobStorage';
import '/server/cronMigrationManager';

// ----------------------------------------------------------------------------
// 7. Server — webhooks
// ----------------------------------------------------------------------------
import '/server/card-opened-webhook';
import '/server/cron/syncedCron';

// ----------------------------------------------------------------------------
// 8. Server — import helpers
// ----------------------------------------------------------------------------
import '/server/import-users-for-methods';

// ----------------------------------------------------------------------------
// 9. Server — lib (utilities, sanitizers, guards)
// ----------------------------------------------------------------------------
import '/server/lib/customHeadRender';
import '/server/lib/emailLocalization';
import '/server/lib/importer';
import '/server/lib/inputSanitizer';
import '/server/lib/ssrfGuard';
import '/server/lib/utils';

// ----------------------------------------------------------------------------
// 10. Server — methods
// ----------------------------------------------------------------------------
import '/server/methods/fixDuplicateLists';
import '/server/methods/lockedUsers';
import '/server/methods/lockoutSettings';
import '/server/methods/positionHistory';

// ----------------------------------------------------------------------------
// 11. Server — migrations
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
// 12. Server — notifications
// ----------------------------------------------------------------------------
import '/server/notifications/email';
import '/server/notifications/notifications';
import '/server/notifications/outgoing';
import '/server/notifications/profile';
import '/server/notifications/watch';

// ----------------------------------------------------------------------------
// 13. Server — publications
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
// 14. Server — routes (REST API, file serving)
// ----------------------------------------------------------------------------
import '/server/routes/attachmentApi';
import '/server/routes/avatarServer';
import '/server/routes/customHeadAssets';
import '/server/routes/legacyAttachments';
import '/server/routes/universalFileServer';

// ----------------------------------------------------------------------------
// 15. Server — rules engine
// ----------------------------------------------------------------------------
import '/server/rulesHelper';
import '/server/triggersDef';

// ----------------------------------------------------------------------------
// 16. Server — collection permissions (allow/deny rules)
// ----------------------------------------------------------------------------
import '/server/permissions/accessibilitySettings';
import '/server/permissions/accountSettings';
import '/server/permissions/actions';
import '/server/permissions/announcements';
import '/server/permissions/attachments';
import '/server/permissions/avatars';
import '/server/permissions/boards';
import '/server/permissions/cardCommentReactions';
import '/server/permissions/cardComments';
import '/server/permissions/cards';
import '/server/permissions/checklistItems';
import '/server/permissions/checklists';
import '/server/permissions/customFields';
import '/server/permissions/integrations';
import '/server/permissions/invitationCodes';
import '/server/permissions/lists';
import '/server/permissions/lockoutSettings';
import '/server/permissions/org';
import '/server/permissions/rules';
import '/server/permissions/settings';
import '/server/permissions/swimlanes';
import '/server/permissions/tableVisibilityModeSettings';
import '/server/permissions/team';
import '/server/permissions/translation';
import '/server/permissions/triggers';
import '/server/permissions/unsavedEdits';
import '/server/permissions/userPositionHistory';
import '/server/permissions/users';

// ----------------------------------------------------------------------------
// 17. Sandstorm integration
// ----------------------------------------------------------------------------
import '/sandstorm';
