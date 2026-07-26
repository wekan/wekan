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

## Sandstorm

Sandstorm only: the MongoDB 3 → FerretDB migration status, disk usage per storage
(raw MongoDB, FerretDB, attachments, avatars), and — when raw MongoDB data is still
present — deleting it to reclaim the space.

## Related

- [Attachments (cards)](../../Cards/Attachments/Attachments.md) — what a user sees.
- [Attachment migration system](../../../ImportExport/Attachment-Migration-System.md)
