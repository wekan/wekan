# Admin Panel / Attachments

## What it is

The Attachments tab of the Admin Panel says where files live, how big they may
be, how they move between storages, and how they are backed up. Attachments are
the files added to cards; avatars are the users' pictures; both can be kept in
the filesystem, in MongoDB GridFS or in cloud storage (S3/MinIO, Azure Blob,
Google Cloud Storage, WebDAV). One heading per menu entry below, in menu order.
**Backup** is first and is the pane that opens; arriving there also asks once
whether a backup is already running, so an in-progress backup shows its status.

## Read more

- [Backup](https://en.wikipedia.org/wiki/Backup) and
  [Point-in-time recovery](https://en.wikipedia.org/wiki/Point-in-time_recovery)
  on Wikipedia.
- [Object storage](https://en.wikipedia.org/wiki/Object_storage),
  [Amazon S3](https://en.wikipedia.org/wiki/Amazon_S3) and
  [WebDAV](https://en.wikipedia.org/wiki/WebDAV) on Wikipedia.
- [GridFS](https://www.mongodb.com/docs/manual/core/gridfs/) in the MongoDB
  manual, and [Meteor-Files](https://github.com/veliovgroup/Meteor-Files), the
  file library WeKan stores attachments with.
- [Data retention](https://en.wikipedia.org/wiki/Data_retention) on Wikipedia.
- WeKan: [Backup and restore](../../../Backup/Backup.md),
  [Continuous backup](../../../Backup/Continuous-Backup.md) and
  [Attachments (cards)](../../Cards/Attachments/Attachments.md).

## How to use it

Open your member menu (top right) → **Admin Panel** → **Attachments**, then pick
a pane from the left menu. Every pane has its own address,
`/admin/attachments/<slug>` (the table at the end). A site admin sees every
pane; an Organization's own admin sees only **Backup**, scoped to their
Organizations. On Sandstorm, **Database migration** is not in the menu.

### Backup

See [Backup.md](Backup.md) for screenshots, restore steps and coverage limits.

Take a backup now — attachments, avatars and the database, each a checkbox — choose
where it is written, and schedule it (daily, weekly on a chosen day, or monthly on a
chosen day from 1 to 28, at a chosen time). **List backups** shows what exists; a backup can be
restored, either adding only what is missing or replacing.

A restored archive is checked entry by entry: an entry that resolves outside the
directory it belongs in is skipped and reported, never written (ZipBleed).

#### Scope: the whole instance, or one Organization

**Backup scope** chooses what is backed up. A site admin sees *Whole instance* plus
every Organization; an Organization's own admin sees only the Organizations they
administer, and cannot take an instance backup.

An Organization's backup holds its boards and everything on them — lists, swimlanes,
cards, comments, checklists, custom fields, activities, rules, integrations — and the
attachments those boards use. It does **not** hold user accounts, the instance
settings, or the Organization and Team documents themselves: those are shared by every
Organization, so they belong to the instance backup.

Restoring an Organization's backup only ever writes to boards that Organization owns.
Board ids the archive claims but the Organization does not own are dropped, every
document is checked against what is left, and "replace all" replaces that
Organization's documents rather than everyone's. An Organization's admin can never
restore an instance backup, because it contains every Organization.

Instance archives are written to `<files>/backup/YYYY/MM/DD/HH_MM_SS/backup.zip` and an
Organization's to `<files>/backup/org/<orgId>/…`, so the list shows only the archives
you may restore. See
[Design / Multitenancy](../../../Design/Multitenancy/Multitenancy.md) (D.8).

The **schedule** is instance-wide, and stays with the site admin: one cron, one archive
of everything.

### Continuous backup

Beside Backup: where Backup makes a whole archive at intervals, this streams every
change - database, attachments, avatars and logs - to a directory within seconds,
so a restore can return to any moment. Site administrators only. The settings
(target directory, what to include, the database engine, intervals and retention),
the status, the restore points and the restore are described in
[Continuous-Backup.md](../../../Backup/Continuous-Backup.md).

### Move attachment

Move attachments and/or avatars between storages: choose the scope (attachments,
avatars, both), the source (all, or one specific storage) and the destination. The
last move is reported, and **Repair file locations** re-scans files whose recorded
location no longer matches where they actually are.

### Default save storage

Which storage new files go to.

### Limits

Upload and download size limits, for attachments and for the API, each with a unit;
and whether avatar uploads are blocked entirely.

### Retention

Delete card attachments after a number of days, optionally only on cards nobody
works on any more, and remove deleted attachments for good after another number
of days. Each field overrides its environment variable (`ATTACHMENTS_RETENTION_*`,
and `ATTACHMENTS_PURGE_DELETED_AFTER_DAYS` for the purge); an empty field falls
back to it. Off unless set. See
[Attachments.md](../../Cards/Attachments/Attachments.md#retention-removing-old-attachments-automatically).

### MongoDB GridFS storage · Filesystem storage · S3 / MinIO storage · Azure Blob Storage · Google Cloud Storage · WebDAV

One pane per backend, each with its own read / write switches and its own settings —
paths for the filesystem, bucket and credentials for S3 / MinIO, account and
container for Azure, bucket and service-account permissions for GCS, and for WebDAV
(Nextcloud Files, ownCloud or any WebDAV server) the folder address, a user and an
app password made for WeKan. Every pane says which environment variable or console
path each field corresponds to.

### Database migration

The MongoDB ↔ FerretDB v1 (SQLite) text-data migration, with the progress dashboard.
See [Problems / Migrations](../Problems/Migrations.md).

## How the numbers are calculated

- **Limits** - each size limit is stored in bytes; the unit beside it (GB, MB or
  bytes) only converts what is shown: 1 MB = 1024 × 1024 bytes and
  1 GB = 1024 × 1024 × 1024 bytes
  ([client/components/settings/attachments.js](../../../../client/components/settings/attachments.js)).
  0 means no limit of its own. A new settings document takes its starting
  values from `ATTACHMENTS_UPLOAD_MAX_SIZE`, `ATTACHMENT_API_MAX_UPLOAD_BYTES`
  and `ATTACHMENT_API_MAX_DOWNLOAD_BYTES`, else 0
  ([server/models/attachmentStorageSettings.js](../../../../server/models/attachmentStorageSettings.js)).
- **Retention** - from
  [models/lib/attachmentRetention.js](../../../../models/lib/attachmentRetention.js)
  and the form's fields in
  [models/lib/authConfigCatalog.js](../../../../models/lib/authConfigCatalog.js):
  - *Delete after* (`ATTACHMENTS_RETENTION_DAYS`) and *Purge deleted after*
    (`ATTACHMENTS_PURGE_DELETED_AFTER_DAYS`) are whole days from 1 to 36500;
    anything else is 0, which is off. An attachment is expired when it was
    uploaded at least that many days ago (24 hours a day), and in the
    `card-inactive` mode also its card has had no activity for that long.
  - The mode is `uploaded` unless `card-inactive` is chosen.
  - *Dry run* (`ATTACHMENTS_RETENTION_DRY_RUN`) is on for `true`, `1`, `yes`
    or `on`.
  - *At most per run* (`ATTACHMENTS_RETENTION_MAX_PER_RUN`) defaults to 1000.
    The form accepts up to 1,000,000, but the job itself caps the value at
    100,000.
- **Backup** - the schedule, overdue rule, history and `BACKUP_KEEP_DAYS` are
  on [Backup.md](Backup.md#how-the-numbers-are-calculated).
- **Storage panes** - **Calculate file counts** counts the files of each kind
  (attachments, avatars) in each storage, CollectionFS and Meteor-Files
  included; the GridFS count is only of files really stored in GridFS.

## How it works in WeKan

- **Client:** [client/components/settings/attachments.jade](../../../../client/components/settings/attachments.jade)
  and [attachments.js](../../../../client/components/settings/attachments.js):
  `attachmentsMenu()` builds the left menu, drops the Sandstorm-hidden panes
  ([models/lib/sandstormSlim.js](../../../../models/lib/sandstormSlim.js)) and,
  for an Organization admin, keeps only Backup
  (`tenantAdminAttachmentsMenu` in
  [models/lib/tenantAdmin.js](../../../../models/lib/tenantAdmin.js)).
- **Settings document:** `AttachmentStorageSettings`
  ([models/attachmentStorageSettings.js](../../../../models/attachmentStorageSettings.js),
  [server/models/attachmentStorageSettings.js](../../../../server/models/attachmentStorageSettings.js)) -
  default storage, `limitSettings`, the backends' read/write switches and
  their settings; secrets are kept when the field is left blank.
- **Backends:** [models/lib/fileStoreStrategy.js](../../../../models/lib/fileStoreStrategy.js)
  (filesystem and GridFS), [models/lib/cloudStorage.js](../../../../models/lib/cloudStorage.js)
  (S3, Azure, GCS) and [server/lib/webdavAdapter.js](../../../../server/lib/webdavAdapter.js).
- **Move attachment:** [server/attachmentBulkMove.js](../../../../server/attachmentBulkMove.js).
- **Retention:** the nightly job [server/attachmentRetention.js](../../../../server/attachmentRetention.js).
- **Backup:** [server/methods/backup.js](../../../../server/methods/backup.js);
  continuous backup: [server/continuousBackup.js](../../../../server/continuousBackup.js).
- **Database migration:** [server/methods/migrateTextDatabase.js](../../../../server/methods/migrateTextDatabase.js).
- **URLs:** the slugs are in [models/lib/adminUrls.js](../../../../models/lib/adminUrls.js),
  and [tests/adminPanelDocsMatchMenu.test.cjs](../../../../tests/adminPanelDocsMatchMenu.test.cjs)
  checks the table at the end of this page against it.
- **Tests:** [tests/attachmentRetention.test.cjs](../../../../tests/attachmentRetention.test.cjs),
  [tests/webdavStorage.test.cjs](../../../../tests/webdavStorage.test.cjs),
  [tests/attachmentStoragePath.test.cjs](../../../../tests/attachmentStoragePath.test.cjs),
  [tests/tenantBackup.test.cjs](../../../../tests/tenantBackup.test.cjs),
  [tests/continuousBackup.test.cjs](../../../../tests/continuousBackup.test.cjs)
  and the browser specs
  [admin-attachment-retention.e2e.js](../../../../tests/playwright/specs/admin-attachment-retention.e2e.js),
  [admin-continuous-backup.e2e.js](../../../../tests/playwright/specs/admin-continuous-backup.e2e.js)
  and [admin-full-backup.e2e.js](../../../../tests/playwright/specs/admin-full-backup.e2e.js).

## Sandstorm — removed from the menu

There is no Sandstorm pane any more. It only had content inside a Sandstorm grain —
the MongoDB 3 → FerretDB migration status, disk usage per storage, and a button that
deleted the raw MongoDB 3 files to reclaim grain disk. Compacting the MongoDB
database frees that space as well, so WeKan does not offer to delete raw database
files. The pane, its menu entry, its helpers and its handler are commented out in
`client/components/settings/attachments.jade` and `.js`.

The grain migration itself is unchanged: it runs in `sandstorm-src/start.js` before
the app boots — see
[Sandstorm migration](../../../Platforms/FOSS/Container/Sandstorm/Meteor3/Migration.md).

## Related

- [Attachments (cards)](../../Cards/Attachments/Attachments.md) — what a user sees.
- [Attachment migration system](../../Board-Sidebar/Board-Settings/Import-Export/Attachment/Attachment-Migration-System.md)

## The panes, in menu order

Every pane of this tab, in the order the menu shows them. The slug is what
the address uses: `/admin/attachments/<slug>`.

| Menu path | URL slug | Page |
| --- | --- | --- |
| Attachments / Backup | `backup` | [Backup.md](Backup.md) |
| Attachments / Continuous backup | `continuous-backup` | [Continuous-Backup.md](../../../Backup/Continuous-Backup.md) |
| Attachments / Move Attachment | `move` | — |
| Attachments / Default Save Storage | `default-save-storage` | — |
| Attachments / Limits | `limits` | — |
| Attachments / Retention | `retention` | [Attachments.md](../../Cards/Attachments/Attachments.md) |
| Attachments / MongoDB GridFS Storage | `gridfs` | — |
| Attachments / Filesystem Storage | `filesystem` | — |
| Attachments / S3/MinIO Storage | `s3` | — |
| Attachments / Azure Blob Storage | `azure` | — |
| Attachments / Google Cloud Storage | `gcs` | — |
| Attachments / WebDAV (Nextcloud Files) | `webdav` | — |
| Attachments / Database migration | `database-migration` | — |

10 of these 13 panes has no page of its own yet. A dash is a
gap to fill, not a pane that does nothing - what the pane shows is described in
this README until somebody writes it up.

## Commits

 - [Attachments, avatars and backups in S3 can be encrypted at rest](https://github.com/wekan/wekan/commit/482c2c29f47a5279c43e0033547e35da5013e8d5)
 - [Backup status and history, and old local backups pruned](https://github.com/wekan/wekan/commit/06b7ce994ad193357a20fc6a036060ea04c83947)
 - [Retention: delete card attachments after N days, purge deleted ones after M days](https://github.com/wekan/wekan/commit/dcf91e4471814d765c148d1402865089f6e3ad21)
 - [WebDAV attachment storage, for Nextcloud Files or any WebDAV server](https://github.com/wekan/wekan/commit/42340817523e2e62cc55cbd31982bc2eada1a858)
 - [Files moved to or from the old CollectionFS storage are streamed](https://github.com/wekan/wekan/commit/cd054f99640509718cd9b24eee047ac635a0f80b)
 - [Continuous backup: encryption at rest and cloud upload](https://github.com/wekan/wekan/commit/5ef5757c716cfa33ff30154a1baa1cd66c1b822c)
 - [Continuous backup pane: stream every change, restore to a moment](https://github.com/wekan/wekan/commit/6b9bc496b1b56a54b40f5403341272c33770561a)
 - [Scheduled full-instance backups fixed and the Admin Panel validated](https://github.com/wekan/wekan/commit/58d8563637d1a9badcf2ff5cf0ea6793d7b7d1eb)
 - [Attachment migration keeps a binary two records share](https://github.com/wekan/wekan/commit/146a5184d90028b3ccf917069b3007ef520fcb59)
 - [A URL for every left-menu entry](https://github.com/wekan/wekan/commit/841479774e12c34337712ef26d2b808b49dc4bfc)
 - [The Sandstorm pane is commented out](https://github.com/wekan/wekan/commit/eba25459a33218cb0da97f53e399f96d21f39073)
 - [The page opens on Backup, its first menu entry](https://github.com/wekan/wekan/commit/a9680fa3d3ab3b76ab34865af8622010828c7924)
 - [Organization backups and the Backup-only menu for an Organization admin](https://github.com/wekan/wekan/commit/36b899b9d643fd428613fa8e7197bafc192a42db)
 - [The side menu is rendered from the shared left menu](https://github.com/wekan/wekan/commit/1c1aefbd16c2be4a21d5a9f339f618da01bdb2b4)
 - [Attachments missing after the MongoDB to FerretDB migration fixed](https://github.com/wekan/wekan/commit/65bf215cbe747e0d5ad2f713aaa73bd558b0163d)
 - [Scheduled backups of attachments, avatars and data, with list and restore](https://github.com/wekan/wekan/commit/c7c8a200ff551f979fe6eeb30266d7c435cd7fa4)
 - [Database migration between MongoDB and FerretDB v1 (SQLite), both directions](https://github.com/wekan/wekan/commit/84fee7b660e365d900e1ac355d97fcccf3debc25)
 - [A setting to block avatar uploads](https://github.com/wekan/wekan/commit/8e2dacd856cef46728f0341eeafcb03fd0f453fa)
 - [Move Attachment moves attachments and avatars from any storage to any storage](https://github.com/wekan/wekan/commit/d30803276d6d06db44f65ee1fb583cc11aac8b7b)
 - [Attachment storage options moved from the board to the Admin Panel](https://github.com/wekan/wekan/commit/fc92b342ceedcf38dbd614a0f7b50d6dc2b22eb8)
