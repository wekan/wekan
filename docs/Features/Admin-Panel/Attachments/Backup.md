# Admin Panel / Attachments / Backup

## What it is

Admin Panel / Attachments / Backup takes a backup archive of this WeKan now or
on a schedule: the database text data, the attachments and the avatars, each a
checkbox. A site admin backs up the whole instance; an Organization's admin
backs up only that Organization's boards. The archives can be listed and
restored from the same pane.

Use [Backup and restore](../../../Backup/Backup.md) for the current illustrated
guide: immediate and scheduled backups, instance/Organization scope, storage
destinations, restore modes and coverage limits. It also explains how to copy
a complete stopped FerretDB/SQLite installation with users and attachments.

An Admin Panel archive, a raw database backup and a board export contain
different data. Choose the method and verify its restore before relying on it.

## Read more

- [Backup](https://en.wikipedia.org/wiki/Backup) on Wikipedia.
- [ZIP (file format)](https://en.wikipedia.org/wiki/ZIP_(file_format)) on
  Wikipedia - the archive format.
- [Cron](https://en.wikipedia.org/wiki/Cron) on Wikipedia - the idea behind the
  schedule.
- WeKan: [Backup and restore](../../../Backup/Backup.md),
  [Continuous backup](../../../Backup/Continuous-Backup.md),
  [Problems / Backup status](../Problems/README.md) and the
  [Attachments tab](README.md#backup).

## How to use it

**Take a backup now:**

1. Open your member menu (top right) → **Admin Panel** → **Attachments** →
   **Backup** (it is the pane that opens).
2. Under **Backup scope**, choose *Whole instance* or one Organization.
3. Tick what to include: **Attachments**, **Avatars**, **Data (text)**. A
   complete backup needs all three and *Whole instance*.
4. Choose **Save to storage**, then press **Backup now**. *Backup completed* is
   shown when it is done.

**Schedule backups:**

1. In **Scheduled backups**, choose a **Frequency**: Off, Daily, Weekly or
   Monthly.
2. For Weekly pick the day of the week, for Monthly the day of the month, and
   set the time.
3. Press **Save**.

**Restore:**

1. Press **List backups**.
2. Choose the **Restore** mode: *Add missing data only* or *Replace all data*,
   and restore the archive you want.

## How the numbers are calculated

From [models/lib/backupPaths.js](../../../../models/lib/backupPaths.js) and
[models/lib/backupRuns.js](../../../../models/lib/backupRuns.js):

- **Schedule time** - `HH:MM`, 00:00 to 23:59, default 04:00. Weekly defaults to
  Sunday. **Day of the month** is 1 to 28, so every month has that day.
- **Overdue** - a scheduled instance backup is overdue when its last success is
  older than the period plus a 2-hour grace: 26 hours for Daily, 7 days 2 hours
  for Weekly, 31 days 2 hours for Monthly.
- **A run still "running" after 24 hours** counts as failed (`STALE_RUNNING_MS`).
- **History** - run records older than 400 days are removed when a new run
  starts; the backup history (Problems / Backup) shows the 30 most recent.
- **BACKUP_KEEP_DAYS** - a whole number of days from 1 to 3650; anything else
  is 0, which keeps every backup. After a successful backup, local archives
  older than that many days are deleted.
- A scheduled backup that finds another backup still running is recorded as
  failed with "skipped: another backup was still running".

## How it works in WeKan

- **Client:** [client/components/settings/attachments.jade](../../../../client/components/settings/attachments.jade)
  and `attachments.js` beside it.
- **Server methods:** [server/methods/backup.js](../../../../server/methods/backup.js) -
  backup, list and restore, the `BackupSettings` schedule document
  (`_id: 'schedule'`) and the synced-cron job "WeKan Scheduled Backup". Site
  admins only for the whole instance; an Organization admin only for the
  Organizations they administer.
- **Whole-instance archive:** [server/lib/fullBackup.js](../../../../server/lib/fullBackup.js),
  a versioned BSON/file-stream format with a manifest of payload hashes.
- **Organization archive:** [models/lib/tenantBackup.js](../../../../models/lib/tenantBackup.js),
  which decides the collections and the ownership guard on restore.
- **Run history:** the `BackupRuns` collection, written by
  [server/lib/backupRuns.js](../../../../server/lib/backupRuns.js); pruning by
  [server/lib/backupPrune.js](../../../../server/lib/backupPrune.js).
- **Archive paths and ZipBleed guard:** `safeEntryPath` and
  `symlinkOnRestorePath` in `models/lib/backupPaths.js`.
- **Tests:** [tests/backupPaths.test.cjs](../../../../tests/backupPaths.test.cjs),
  [tests/backupRuns.test.cjs](../../../../tests/backupRuns.test.cjs),
  [tests/backupCron.test.cjs](../../../../tests/backupCron.test.cjs),
  [tests/backupValidation.test.cjs](../../../../tests/backupValidation.test.cjs),
  [tests/tenantBackup.test.cjs](../../../../tests/tenantBackup.test.cjs),
  [tests/zipbleed.test.cjs](../../../../tests/zipbleed.test.cjs),
  [tests/backupRestoreSymlink.test.cjs](../../../../tests/backupRestoreSymlink.test.cjs)
  and the browser spec
  [tests/playwright/specs/admin-full-backup.e2e.js](../../../../tests/playwright/specs/admin-full-backup.e2e.js).

## Commits

 - [Backups in S3 can be encrypted at rest](https://github.com/wekan/wekan/commit/482c2c29f47a5279c43e0033547e35da5013e8d5)
 - [Every backup run recorded, failures and overdue backups shown, old local backups pruned](https://github.com/wekan/wekan/commit/06b7ce994ad193357a20fc6a036060ea04c83947)
 - [Refuse to restore a backup file through a symlink](https://github.com/wekan/wekan/commit/0dd33ef806f974ee7666a324cd2d8853b76ae1a9)
 - [Scheduled full-instance backups start, and the archive holds every collection and file](https://github.com/wekan/wekan/commit/58d8563637d1a9badcf2ff5cf0ea6793d7b7d1eb)
 - [The schedule's day is picked from buttons](https://github.com/wekan/wekan/commit/7f01afdc20a61f946b8b0ee02d7a0b87e7bbbce1)
 - [Backup and restore of one Organization](https://github.com/wekan/wekan/commit/36b899b9d643fd428613fa8e7197bafc192a42db)
 - [ZipBleed: a restored archive cannot write outside the files directory](https://github.com/wekan/wekan/commit/f1c89548e05bb869f4ac8d55240b26ff96f23b19)
 - [The scheduled backup cron no longer crashes at server startup](https://github.com/wekan/wekan/commit/011c172c8ca844b33d45861acb1b34307cc6a1b2)
 - [Low-memory streaming archives with archiver and unzipper](https://github.com/wekan/wekan/commit/e39dcd4ebf19c4280cc8f48352e91b547c5ff673)
 - [Scheduled backups of attachments, avatars and data, with list and restore](https://github.com/wekan/wekan/commit/c7c8a200ff551f979fe6eeb30266d7c435cd7fa4)
