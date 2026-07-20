# Attachments and File Storage

WeKan stores card attachments, user avatars and board background images using a
pluggable storage backend, managed from **Admin Panel / Attachments**.

## Storage backends

The following backends are supported:

- **Filesystem** (the default) — files stored on disk next to the database.
- **MongoDB GridFS** (Meteor-Files) — files stored inside MongoDB.
- **Legacy CollectionFS GridFS** — read/write support for files created by older
  WeKan versions, so they remain visible after upgrading.
- **Cloud storage** — S3 (and S3-compatible such as MinIO), Azure Blob, and Google
  Cloud Storage.

Each backend has Read / Enabled toggles in Admin Panel / Attachments. The cloud
backends (S3, Azure, Google Cloud Storage) have self-documenting fields and a "Test
connection" button.

## Moving / migrating files between backends

**Admin Panel / Attachments / Move Files** (also "Move Attachment") can move
attachments and avatars from **any source to any destination** across Filesystem,
Meteor-Files GridFS, Cloud (S3 / Azure / GCS) and legacy CollectionFS GridFS. There
is also a "Repair file locations" button to fix records whose stored location no
longer matches where the bytes actually are.

You can also calculate file counts per backend and run a MongoDB compact from this
page.

## SVG uploads

Uploaded SVG images are **sanitized** (rather than rejected), so SVGs are safe to use
as attachments and avatars.

## Related

- [Rclone: store attachments to cloud storage like S3, MinIO, etc.](../../../Backup/Rclone/Rclone.md)
- [Card Cover Image](../Cover/Cover.md)
- [Board Background Images](../../Board/Board-Backgrounds/Board-Backgrounds.md)
- [Backup and Restore](../../../Backup/Backup.md)
