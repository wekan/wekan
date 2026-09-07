# Admin Panel / Attachments

Where files live, how big they may be, moving them between storages, and backups. One
heading per menu entry, in menu order. **Backup** is first and is the pane that
opens; arriving there also asks once whether a backup is already running, so an
in-progress backup shows its status.

## Backup

Take a backup now — attachments, avatars and the database, each a checkbox — choose
where it is written, and schedule it (daily, weekly on a chosen day, or monthly on a
chosen date, at a chosen time). **List backups** shows what exists; a backup can be
restored, either adding only what is missing or replacing.

A restored archive is checked entry by entry: an entry that resolves outside the
directory it belongs in is skipped and reported, never written (ZipBleed).

### Scope: the whole instance, or one Organization

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

## Move attachment

Move attachments and/or avatars between storages: choose the scope (attachments,
avatars, both), the source (all, or one specific storage) and the destination. The
last move is reported, and **Repair file locations** re-scans files whose recorded
location no longer matches where they actually are.

## Default save storage

Which storage new files go to.

## Limits

Upload and download size limits, for attachments and for the API, each with a unit;
and whether avatar uploads are blocked entirely.

## MongoDB GridFS storage · Filesystem storage · S3 / MinIO storage · Azure Blob Storage · Google Cloud Storage

One pane per backend, each with its own read / write switches and its own settings —
paths for the filesystem, bucket and credentials for S3 / MinIO, account and
container for Azure, bucket and service-account permissions for GCS. Every pane says
which environment variable or console path each field corresponds to.

## Database migration

The MongoDB ↔ FerretDB v1 (SQLite) text-data migration, with the progress dashboard.
See [Problems / Migrations](../Problems/Migrations.md).

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
- [Attachment migration system](../../ImportExport/Attachment/Attachment-Migration-System.md)

## The panes, in menu order

Every pane of this tab, in the order the menu shows them. The slug is what
the address uses: `/admin/attachments/<slug>`.

| Menu path | URL slug | Page |
| --- | --- | --- |
| Attachments / Backup | `backup` | — |
| Attachments / Move Attachment | `move` | — |
| Attachments / Default Save Storage | `default-save-storage` | — |
| Attachments / Limits | `limits` | — |
| Attachments / MongoDB GridFS Storage | `gridfs` | — |
| Attachments / Filesystem Storage | `filesystem` | — |
| Attachments / S3/MinIO Storage | `s3` | — |
| Attachments / Azure Blob Storage | `azure` | — |
| Attachments / Google Cloud Storage | `gcs` | — |
| Attachments / Database migration | `database-migration` | — |

10 of these 10 panes has no page of its own yet. A dash is a
gap to fill, not a pane that does nothing - what the pane shows is described in
this README until somebody writes it up.
