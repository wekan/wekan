# Admin Panel implementation validation

Audit against the September 2026 source. The 48 pane routes are defined by
[adminUrls.js](../../../models/lib/adminUrls.js). A visible menu entry alone
is not proof that its action works: the table identifies its implementation
and the boundaries of this validation.

## Findings and fixes

Scheduled backups registered jobs but the shared scheduler was never started.
The daily expression was also rejected by the bundled scheduler parser and
produced a partial first-of-month schedule; daily backups now use its supported
time expression and refuse parser errors.
The old whole-instance archive excluded attachment/avatar metadata and GridFS
collections; restore also suppressed database write failures. The repair starts
the scheduler, includes all application collections with BSON types and indexes,
and streams selected attachment/avatar versions through their storage readers.
Export and restore use Meteor's own BSON driver to avoid incompatible BSON
objects between driver versions. A versioned manifest verifies payload hashes before restore and file metadata
is rebased to the destination storage path. Failed jobs report errors.

The Backup form now reloads its saved file selections and destination, validates
schedules and displays save/list errors. A complete backup requires all three
content selections and Whole instance scope. Organization backups deliberately
exclude global accounts/settings and are not full-instance backups.

## Evidence and limits

- Source inspection follows menu templates, event handlers, server methods,
  publications and permissions. No active pane is an empty placeholder.
- All 70 focused Node regression suites pass and exercise settings, administration,
  permissions, storage policy, reports and backup scheduling.
- Nine real FerretDB round-trip and failure checks pass, covering accounts, BSON values, dotted GridFS
  collections, indexes, empty collections, relocated file bytes, add-missing
  behavior and rejected corrupt/incomplete backups.
- The browser suite exercises the actual timer, backup/restore controls and
  file downloads, rejects non-admin backup operations, and visits every pane.
  Visiting a pane proves rendering; it does not prove every possible action.
- Another 21 Chromium checks pass for user management, report filters, mail
  setting persistence and secret masking, instrumentation and office locations.
- External LDAP/OAuth/SMTP accounts, S3/Azure/GCS endpoints, device PWA installation,
  MongoDB compaction and a two-database migration require their own live-service
  tests. Their implementations exist; this audit does not claim those
  deployments were exercised.

The old unused `attachmentSettings` template and its obsolete S3 handler names
are not reachable from the current Admin Panel menu. Current storage panes use
`testAttachmentCloudConnection` and `updateAttachmentStorageSettings`.

## Settings

| Pane / URL slug | Implementation | Behavior and limits |
| --- | --- | --- |
| Version (`version`) | [informationBody.js](../../../client/components/settings/informationBody.js) | Live version/runtime information; read-only. |
| Visibility (`visibility`) | [tableVisibilityModeSettings.js](../../../models/tableVisibilityModeSettings.js) | Saved visibility, branding and date defaults; server permissions apply. |
| Announcement (`announcement`) | [announcements.js](../../../models/announcements.js) | Saved banner content and visibility; rendered through announcement controls. |
| Accessibility (`accessibility`) | [accessibilitySettings.js](../../../models/accessibilitySettings.js) | Saved accessibility content and configuration. |
| Translation (`translation`) | [translation.js](../../../server/models/translation.js) | Add/edit/delete custom translation records with administrator checks. |
| PWA (`pwa`) | [settingBody.js](../../../client/components/settings/settingBody.js) | Saved head/manifest/assetlinks configuration; device installation requires a device check. |
| Global Webhooks (`global-webhooks`) | [outgoing.js](../../../server/notifications/outgoing.js) | Global integration configuration and event delivery; endpoint delivery requires a configured receiver. |

## People

| Pane / URL slug | Implementation | Behavior and limits |
| --- | --- | --- |
| Login (`login`) | [settings.js](../../../server/models/settings.js) | LDAP/OAuth/passwordless controls and server authentication guards; external identity providers need credentials and a test directory. |
| E-mail (`email`) | [settings.js](../../../server/models/settings.js) | Mail service settings, secret masking and test-email method; delivery needs a configured SMTP/provider account. |
| Notifications (`notifications`) | [settings.js](../../../server/models/settings.js) | Site defaults through setAdminNotifyDefault; used by notification resolution. |
| Domains (`domains`) | [peopleBody.js](../../../client/components/settings/peopleBody.js) | Server-backed domain membership counts, search and pagination. |
| Organizations (`organizations`) | [tenant.js](../../../server/methods/tenant.js) | Organization membership, tenant fields and administrator scope. |
| Teams (`teams`) | [team.js](../../../models/team.js) | Team records and membership operations; scoped server permissions. |
| People (`people`) | [users.js](../../../server/models/users.js) | Create/edit, roles, password/email operations, impersonation and removal. |
| Locked Users (`locked-users`) | [lockedUsers.js](../../../server/methods/lockedUsers.js) | Locked-account listing and administrator unlock methods. |
| Roles (`roles`) | [inviteToBoardRolesSettings.js](../../../models/inviteToBoardRolesSettings.js) | Invitation-role defaults and per-role settings. |
| Shared Templates (`shared-templates`) | [users.js](../../../server/models/users.js) | Shared-template administration with tenant boundaries. |

## Attachments

| Pane / URL slug | Implementation | Behavior and limits |
| --- | --- | --- |
| Backup (`backup`) | [backup.js](../../../server/methods/backup.js) | Repaired: scheduler startup, full database/file archive, checksums, portable paths and error handling. See Backup.md. |
| Move Attachment (`move`) | [attachmentBulkMove.js](../../../server/attachmentBulkMove.js) | Persisted move jobs, progress, pause/resume/cancel and location repair. Cloud endpoints require live-service tests. |
| Default Save Storage (`default-save-storage`) | [attachmentStorageSettings.js](../../../server/models/attachmentStorageSettings.js) | Validates backend and persists default for new files. |
| Limits (`limits`) | [attachmentStorageSettings.js](../../../server/models/attachmentStorageSettings.js) | Saves size/blocking policies used by upload/download routes. |
| MongoDB GridFS Storage (`gridfs`) | [fileStoreStrategy.js](../../../models/lib/fileStoreStrategy.js) | Native GridFS read/write and metadata statistics; compaction requires actual MongoDB, not SQLite. |
| Filesystem Storage (`filesystem`) | [fileStoreStrategy.js](../../../models/lib/fileStoreStrategy.js) | Filesystem read/write strategies and metadata statistics. |
| S3/MinIO Storage (`s3`) | [cloudStorage.js](../../../models/lib/cloudStorage.js) | Real S3 adapter, connection test and secret-preserving settings; configured live storage not exercised here. |
| Azure Blob Storage (`azure`) | [cloudStorage.js](../../../models/lib/cloudStorage.js) | Real Azure adapter and connection test; configured live storage not exercised here. |
| Google Cloud Storage (`gcs`) | [cloudStorage.js](../../../models/lib/cloudStorage.js) | Real GCS adapter and connection test; configured live storage not exercised here. |
| Database migration (`database-migration`) | [migrateTextDatabase.js](../../../server/methods/migrateTextDatabase.js) | Migration process/status and verification; needs source and destination databases for an end-to-end migration. |

## Problems

| Pane / URL slug | Implementation | Behavior and limits |
| --- | --- | --- |
| Summary (`summary`) | [systemStatus.js](../../../server/methods/systemStatus.js) | Actual startup/login checks, active migrations and problem streams. |
| Security (`security`) | [settings.js](../../../models/settings.js) | Rich-text and import/export policies, enforced by renderers and server guards. |
| Delete (`delete`) | [settings.js](../../../server/models/settings.js) | Explicit administrator permanent-delete setting; purge remains a separate action. |
| Notifications (`notifications`) | [settings.js](../../../models/settings.js) | Activity, notification and watching switches; separate from delivery preferences. |
| Security Report (`security-report`) | [eventlog.js](../../../models/eventlog.js) | Recorded security events, search, detail and acknowledgement. |
| Impersonation Report (`impersonation`) | [impersonationReport.js](../../../server/publications/impersonationReport.js) | Scoped event publication and counts. |
| Performance (`performance`) | [adminProblems.js](../../../client/components/settings/adminProblems.js) | Persisted performance options; card loading uses the active loading policy. |
| Speed (`speed`) | [eventlog.js](../../../models/eventlog.js) | Recorded speed events; no events is a valid empty report. |
| Tests (`tests`) | [eventlog.js](../../../models/eventlog.js) | Recorded test results; opening the pane does not run every repository test. |
| CPU usage (`cpu`) | [systemStatus.js](../../../server/methods/systemStatus.js) | CPU detail and recorded governor events. |
| Instrumentation (`instrumentation`) | [instrumentationReport.js](../../../server/methods/instrumentationReport.js) | Local Meteor operation counters; no external telemetry upload. |
| Broken Cards (`broken-cards`) | [repairBrokenCards.js](../../../server/methods/repairBrokenCards.js) | Broken-card repair and reports, with administrator checks. |
| Files (`files`) | [fileStatusAudit.js](../../../server/methods/fileStatusAudit.js) | Read-only file/status/type/history scans and report data. |
| Rules (`rules`) | [rules.js](../../../server/publications/rules.js) | Rules report subscriptions, search and pagination. |
| Boards (`boards`) | [boards.js](../../../server/publications/boards.js) | Board report with server-side visibility filtering. |
| Cards (`cards`) | [cards.js](../../../server/publications/cards.js) | Card report with server-side counts and pagination. |
| Recovery (`recovery`) | [recovery.js](../../../server/recovery.js) | Recorded maintenance/recovery events and actions; actual corruption recovery is a separate destructive scenario. |
| Offices (`office`) | [loginOffices.js](../../../server/methods/loginOffices.js) | People/address counts, location summaries and IPv4/IPv6 evidence. |
| API (`api`) | [eventlog.js](../../../models/eventlog.js) | Recorded REST endpoint usage and actors. |
| Database problems (`database`) | [databaseProblems.js](../../../server/lib/databaseProblems.js) | Database event ingestion/classification and problem reporting. |
| Filesystem integrity (`integrity`) | [fileIntegrityScan.js](../../../server/lib/fileIntegrityScan.js) | Integrity scans/baselines plus file-status audit; scans report their coverage limits. |

## Reproduce the checks

Run the focused Node suites with `node tests/run-node-suites.cjs` and the
relevant suite-name filters. The database integration test is
[fullBackup.test.cjs](../../../tests/integration/fullBackup.test.cjs): set
`WEKAN_BACKUP_TEST_MONGO_URL` to an isolated MongoDB/FerretDB instance. It creates
and deletes only fresh randomly named test databases.

The browser checks are in
[admin-full-backup.e2e.js](../../../tests/playwright/specs/admin-full-backup.e2e.js).
Use an isolated app and database, set `WEKAN_BASE_URL`, `WEKAN_MONGO_URL` and
`WEKAN_BACKUP_TEST_FILES_ROOT` to that app's local `files` directory, then run
that spec with the repository Playwright configuration. The backup test restores
all collections in that test instance; never point it at a working installation.

See [Backup](Attachments/Backup.md) for supported procedures and limitations.
