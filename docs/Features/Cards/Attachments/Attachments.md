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

## Searchable document previews

The first preview of a PDF, DOCX, XLSX or PPTX attachment is produced on the
server as an HTML4-compatible page with stored GIF images. PDF pages therefore
no longer depend on a browser PDF plug-in. It is bounded to 32 MiB of source
data, 200 logical pages, 2 MiB of text,
2,048 archive entries and 96 MiB of expanded OOXML data. Existing board-read
authorization and the configured attachment download limits apply before any
conversion.

Text is extracted as Unicode plain text with formatting, XML, HTML, formulas and
control characters removed. Per-page text is returned as escaped JSON and inserted
with `textContent`, so it remains selectable and copyable without becoming markup.
A separate unpublished `documentPreviews.searchText` field contains the normalized
plain text used by `searchAttachmentDocumentText`; searches are board-scoped,
permission checked, regex-escaped and capped at 50 results.

XLSX sheets become HTML tables. The renderer preserves cell text, bold and
italic text, foreground and background colours, and horizontal alignment while
discarding formulas and all unrecognized markup or styles.

Images embedded in OOXML, and PDF page imagery needed to preserve the document's
visual content, are decoded and converted to GIF on the server. Generated versions
are stored alongside the attachment in the backend chosen by **Admin Panel /
Attachments / Default Storage** and reused while the original attachment checksum
and size remain unchanged. A malformed embedded image does not hide extractable
text.

The conversion stack is deliberately small and contains no GPL dependency:
`pdf-to-img` is MIT, its PDF.js dependency is Apache-2.0, `fflate` is MIT, and Sharp
is Apache-2.0. The pinned package ranges include the fixes for the PDF.js arbitrary-
JavaScript advisory and the fflate ZIP64 denial-of-service advisory. LibreOffice,
Ghostscript, a headless browser and OCR/Tesseract are not installed.

## Retention: removing old attachments automatically

For storage limits and data-minimisation (GDPR) policies, WeKan can remove card
attachments after a set time. Everything is **off unless configured**, and runs
once a night at 03:45 (`server/attachmentRetention.js`, rules in
`models/lib/attachmentRetention.js`).

Each setting is an environment variable, and **Admin Panel / Attachments /
Retention** (`/admin/attachments/retention`) overrides each one: a value set
there wins, an empty field falls back to the variable, and the page shows which
is in effect. The job reads them on every run, so a change needs no restart.

| Setting | Meaning |
|---|---|
| `ATTACHMENTS_RETENTION_DAYS` | Delete card attachments older than this many days. This is the same delete as the card's own **Delete**: the attachment disappears from the card, is no longer a cover, and the card history shows the removal with **Restore**. Empty or `0` = off. |
| `ATTACHMENTS_RETENTION_MODE` | `uploaded` (default): by upload date only. `card-inactive`: also only when the card has had no activity (`dateLastActivity`) for as many days, so attachments on cards people still work on are kept. |
| `ATTACHMENTS_PURGE_DELETED_AFTER_DAYS` | Remove for good, **file included**, attachments that were deleted - by retention or by a person - at least this many days ago. Only this step frees storage; afterwards Restore is no longer possible. Works for every storage backend. Empty or `0` = off. |
| `ATTACHMENTS_RETENTION_DRY_RUN` | `true`: change nothing, only log what each step would delete or purge, with counts and bytes. Recommended for the first nights. |
| `ATTACHMENTS_RETENTION_MAX_PER_RUN` | Attachments per step per night (default `1000`), so a first run on a large instance is spread over several nights. |

Never touched: board backgrounds and other attachments without a card,
attachments on template boards and template cards, and attachments whose upload
date is unknown. The delete is recorded as the board's creator, like
auto-archive.

Example: delete after two years, keep deleted files 30 days for Restore:

```
ATTACHMENTS_RETENTION_DAYS=730
ATTACHMENTS_PURGE_DELETED_AFTER_DAYS=30
```

Legacy CollectionFS files (`cfs_gridfs.*` in MongoDB, from WeKan before
Meteor-Files) are not handled here: move them to a current storage first in
**Admin Panel / Attachments**, after which they are ordinary attachments.

## Related

- [Rclone: store attachments to cloud storage like S3, MinIO, etc.](../../../Backup/Rclone/Rclone.md)
- [Card Cover Image](../Cover/Cover.md)
- [Board Background Images](../../Board-Sidebar/Board-Settings/Background-Image.md)
- [Backup and Restore](../../../Backup/Backup.md)
