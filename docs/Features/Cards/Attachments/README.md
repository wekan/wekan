# Attachments and File Storage

## What it is

A card can carry files: documents, images, videos, logs, archives. WeKan stores
these card attachments, and also user avatars and board background images,
using a pluggable storage backend, managed from **Admin Panel / Attachments**.
Clicking an attachment opens it in the card's slideshow, which reads only
what is on the screen, so even a file of gigabytes opens at once. Old
attachments can be removed automatically for storage limits and data
minimisation.

## Read more

- [Email attachment](https://en.wikipedia.org/wiki/Email_attachment) on
  Wikipedia - the same idea, a file carried along with a message, here with a
  card.
- The storages: [MongoDB GridFS](https://www.mongodb.com/docs/manual/core/gridfs/),
  [Meteor-Files](https://github.com/veliovgroup/Meteor-Files) (the library
  WeKan stores files with), [Amazon S3](https://en.wikipedia.org/wiki/Amazon_S3)
  and [MinIO](https://en.wikipedia.org/wiki/MinIO),
  [Microsoft Azure](https://en.wikipedia.org/wiki/Microsoft_Azure),
  [Google Cloud Storage](https://en.wikipedia.org/wiki/Google_Cloud_Storage),
  [WebDAV](https://en.wikipedia.org/wiki/WebDAV) and
  [Nextcloud](https://en.wikipedia.org/wiki/Nextcloud).
- The slideshow: [Byte serving](https://en.wikipedia.org/wiki/Byte_serving)
  (HTTP Range requests), [ZIP](https://en.wikipedia.org/wiki/ZIP_(file_format)),
  [tar](https://en.wikipedia.org/wiki/Tar_(computing)),
  [iCalendar](https://en.wikipedia.org/wiki/ICalendar),
  [Compound File Binary Format](https://en.wikipedia.org/wiki/Compound_File_Binary_Format)
  (Outlook `.msg`), [OpenDocument](https://en.wikipedia.org/wiki/OpenDocument),
  [Office Open XML](https://en.wikipedia.org/wiki/Office_Open_XML),
  [Markdown](https://en.wikipedia.org/wiki/Markdown),
  [CSV](https://en.wikipedia.org/wiki/Comma-separated_values),
  [highlight.js](https://highlightjs.org/) and [PDF.js](https://mozilla.github.io/pdf.js/).
- [SVG](https://en.wikipedia.org/wiki/SVG) and
  [Content Security Policy](https://en.wikipedia.org/wiki/Content_Security_Policy) -
  why an SVG or HTML file is sanitized or sandboxed.
- [Data retention](https://en.wikipedia.org/wiki/Data_retention) and the
  [General Data Protection Regulation](https://en.wikipedia.org/wiki/General_Data_Protection_Regulation) -
  why attachments can be removed after a time.
- In WeKan: [Attached cards](Attached-Cards.md),
  [Searching inside attachments](Attachment-Search-And-Integrity.md),
  [Card Cover Image](../Cover/README.md).

## How to use it

**Adding an attachment to a card:**

1. Open the card. In its **Attachments** section click **+** (**Add
   Attachment**).
2. Choose **Computer** to pick files (several at once), **Clipboard or drag &
   drop** to paste or drop an image, **Attach card** to attach another card
   ([Attached cards](Attached-Cards.md)), or **Drawing** to draw a new picture
   that is saved as an SVG attachment.
3. The upload rules - the maximum file size and the allowed file types, when
   the administrator has set them - are shown under these choices.
4. On an attachment, **Download**, **Rename**, **Delete** and **Attachment
   Actions** (its hamburger) are beside it. For an image, Attachment Actions
   has **Add cover image to minicard** / **Remove cover image from minicard**,
   and for a board admin also the board background image.

**Viewing it:** click the attachment. It opens in the slideshow; the arrows
go to the previous and next attachment (see "The slideshow" below).

**Choosing where files are stored (site administrator):**

1. Open **Admin Panel / Attachments**.
2. Under **Default Save Storage**, choose where new files are written and
   **Save**.
3. Each storage pane - **MongoDB GridFS Storage**, **Filesystem Storage**,
   **S3/MinIO Storage**, **Azure Blob Storage**, **Google Cloud Storage**,
   **WebDAV (Nextcloud Files)** - has **Read** / **Enabled** toggles; the cloud
   ones have their settings fields and **Test cloud connection**.
4. **Calculate file counts** in a pane counts the attachments and avatars
   stored there.

**Moving files (site administrator):** **Admin Panel / Attachments / Move
Attachment**: choose what to move (attachments, avatars or both), the source
and the destination, and click **Move all attachments**. **Repair file
locations** below it fixes records whose stored location no longer matches
where the bytes are.

**Limits (site administrator):** **Admin Panel / Attachments / Limits** sets
the upload and download maximum file size for attachments and for the API,
and can block avatar uploads.

**Retention (site administrator):** **Admin Panel / Attachments / Retention**
(see "Retention" below).

## How the numbers are calculated

- **Slideshow reading** (`client/lib/attachmentWindow.js`): a file is read in
  256 KB chunks (`CHUNK_BYTES`), at most 16 of them kept in the browser
  (`CACHE_CHUNKS`); a text row ends at a newline or at every 4096 bytes
  (`MAX_ROW_BYTES`); the scroll height is capped at 8,000,000 pixels, and
  beyond that the scrollbar position is the fraction of the file.
- **Markdown** is formatted up to 256 KB and **JSON** pretty-printed up to
  256 KB; **Word, Excel and PowerPoint** are read whole up to 32 MB
  (`client/lib/attachmentPreviewSource.js`, `client/lib/officeAttachmentViewer.js`).
- **Server conversion** of `.msg` and OpenDocument
  (`server/lib/attachmentPreviewStore.js`): read in 64 KB ranges
  (`BLOCK_BYTES`), at most 512 MB of rows per preview (`MAX_PREVIEW_BYTES`), a
  repeated spreadsheet row written at most 100,000 times (`MAX_ROW_REPEAT`),
  two conversions at a time (`MAX_CONCURRENT`).
- **Document text for search** (`server/lib/documentGif.js`): at most 32 MiB of
  source (`DOCUMENT_MAX_BYTES`), 200 pages or parts (`DOCUMENT_MAX_PAGES`), 2 MiB
  of text (`DOCUMENT_MAX_TEXT`), 2,048 archive entries and 96 MiB of expanded
  OOXML data; a search answers at most 50 results, needs at least 2 characters
  and reads at most 200, and each result snippet is 240 characters, from 80
  before the match.
- **API transfers** are capped at 64 MiB whatever the Limits say
  (`HARD_MAX_API_FILE_BYTES`, `server/lib/attachmentApiAccess.js`).
- **Retention** (`models/lib/attachmentRetention.js`): days are whole numbers
  from 1 to 36,500, anything else is off; an attachment expires when its upload
  date is at least that many days (of 24 hours) ago, and in `card-inactive`
  mode also its card's `dateLastActivity`; at most 1000 attachments per step per
  night by default (`ATTACHMENTS_RETENTION_MAX_PER_RUN`, at most 100,000). The
  job runs at 03:45.
- **File counts** in each storage pane are counts of the attachment and avatar
  records stored in that storage.

## How it works in WeKan

### Storage backends

The following backends are supported:

- **Filesystem** (the default) — files stored on disk next to the database.
- **MongoDB GridFS** (Meteor-Files) — files stored inside MongoDB.
- **Legacy CollectionFS GridFS** — read/write support for files created by older
  WeKan versions, so they remain visible after upgrading.
- **Cloud storage** — S3 (and S3-compatible such as MinIO), Azure Blob, and Google
  Cloud Storage.
- **WebDAV** — Nextcloud Files or any WebDAV server
  ([models/lib/webdavStorage.js](../../../../models/lib/webdavStorage.js)).

Each backend has Read / Enabled toggles in Admin Panel / Attachments. The cloud
backends (S3, Azure, Google Cloud Storage) have self-documenting fields and a "Test
connection" button (**Test cloud connection**).

The storage strategy that writes and reads each file is
[models/lib/attachmentStoreStrategy.js](../../../../models/lib/attachmentStoreStrategy.js),
with its names in
[models/lib/fileStoreConstants.js](../../../../models/lib/fileStoreConstants.js),
the cloud ones in [models/lib/cloudStorage.js](../../../../models/lib/cloudStorage.js)
and the legacy one in
[models/lib/collectionFsStore.js](../../../../models/lib/collectionFsStore.js).
The collection is `attachments` ([models/attachments.js](../../../../models/attachments.js),
[models/attachments.server.js](../../../../models/attachments.server.js)), and
files are served by
[server/routes/universalFileServer.js](../../../../server/routes/universalFileServer.js)
after the board-access check, the download block and size limit, and the
storage's Read flag. The Admin Panel page is
[client/components/settings/attachments.jade](../../../../client/components/settings/attachments.jade).

### Moving / migrating files between backends

**Admin Panel / Attachments / Move Files** (also "Move Attachment") can move
attachments and avatars from **any source to any destination** across Filesystem,
Meteor-Files GridFS, Cloud (S3 / Azure / GCS) and legacy CollectionFS GridFS. There
is also a "Repair file locations" button to fix records whose stored location no
longer matches where the bytes actually are
([server/attachmentBulkMove.js](../../../../server/attachmentBulkMove.js)).

You can also calculate file counts per backend and run a MongoDB compact from this
page (**Run MongoDB Compact**, in the GridFS pane).

### SVG uploads

Uploaded SVG images are **sanitized** (rather than rejected), so SVGs are safe to use
as attachments and avatars. The sanitizer is a streaming tokenizer
([models/lib/svgSanitizer.js](../../../../models/lib/svgSanitizer.js)): it works
on an SVG of any size, on upload, on validation and on every serve.

### Searching inside attachments

Filter, Search and Search All Boards also find the text inside attachments,
and every attachment's content is checked against its SHA-256 when it is
read: [Searching inside attachments, and checking that they are unchanged](Attachment-Search-And-Integrity.md).

### The slideshow: which files are shown, and how much is read

Clicking an attachment opens it in the card's slideshow (also from **Admin
Panel / Files**, the board's version control view and the history table). A
file is shown directly when its type is one of these; any other file is a
download. **Only what is on the screen is read, and only that is in the
page**: there is no row or size limit, and a file of gigabytes costs a
screenful.

| Files | Shown as | What is read |
|---|---|---|
| Images, PDF, video, audio | the browser's own viewer | video, audio and PDF through HTTP Range requests, by the browser |
| Text, logs, `.txt` and other `text/*` | text rows | HTTP Range requests for the rows on the screen |
| CSV, TSV | a table with its header pinned | the same |
| Source code (JavaScript, TypeScript, Python, Go, Rust, Java, C, C++, C#, PHP, SQL, shell, CSS, HTML and XML source, ...) and JSON | coloured by highlight.js, as text - an HTML or SVG source file is shown, never run | the same; JSON of up to 256 KB is pretty-printed |
| Markdown (`.md`) | formatted, by the same viewer as a card description, with all of its settings, up to 256 KB; larger, as its text | one request up to 256 KB; Range requests above |
| ZIP | its file names | the end of the archive and its central directory, through Range requests, as far as scrolled - never an entry; ZIP64 too |
| tar, tar.gz, `.tgz` | its file names | read in order as far as scrolled (infinite scroll), as compressed data cannot be read from its middle |
| iCalendar (`.ics`) | its events and tasks as a table | read in order as far as scrolled |
| Outlook `.msg` | sender, recipients, subject, date, attachment names, then the text | converted once on the server, then rows on the screen (below) |
| OpenDocument text, spreadsheets and presentations (`.odt`, `.ods`, `.odp`) | headings, paragraphs, sheets and slides as rows | converted once on the server, then rows on the screen (below) |
| Word, Excel, PowerPoint (`.docx`, `.xlsx`, `.pptx`) | laid out by the Office viewer | read whole, up to 32 MB |

**How the scrollbar works.** For the files read by Range requests the
scrollbar is the whole file: dragged to the middle it shows the middle (the
byte at that fraction of the file), scrolled a little it moves row by row,
and at its end is the last row. A row ends at a newline, or at every 4096
bytes of a longer line - so a 50 MB line of minified JSON is many rows - and
never splits a character. The browser keeps at most sixteen 256 KB chunks of
a file ([client/lib/attachmentWindow.js](../../../../client/lib/attachmentWindow.js)).
A legacy CollectionFS attachment, which the server sends whole, is read only
up to the rows wanted.

**Files whose content is scattered through them** - an Outlook `.msg` (a
Compound File: a little file system of sectors) and an OpenDocument (a ZIP
whose text is a compressed `content.xml`) - cannot be read a row at a time as
they are. The first time one is opened, the server converts it **once, a
piece at a time**: it reads the original from its own storage (file system,
GridFS or a cloud backend) in 64 KB byte ranges, never whole; of a `.msg` it
keeps only the sector tables and streams the text, never reading an
attachment's data; of an OpenDocument it reads only `content.xml`, inflating
and parsing it as a stream. What it finds is written as **rows with an
index** - one JSON object a line, and where each line starts - so the
slideshow knows how many rows there are (the scrollbar is exact) and fetches
the index entries and rows on the screen through Range requests
([server/lib/attachmentPreviewStore.js](../../../../server/lib/attachmentPreviewStore.js),
[client/lib/attachmentRecords.js](../../../../client/lib/attachmentRecords.js)).

- The converted preview is served at
  `/cdn/storage/attachments/<id>/preview-meta`, `preview-index` and
  `preview-rows`, after every check the original has: board access, the
  download block and size limit, and the storage's Read flag. It is sent as
  `application/octet-stream` with `nosniff` and a sandboxing
  Content-Security-Policy.
- It is a cache, kept in `attachment-previews/` beside `attachments/` under the
  files root (`WRITABLE_PATH`), named by the attachment and what it is (size,
  upload time, storage path): made again when the file changes, and removed
  with the attachment. Two conversions run at a time; a preview half written
  is never served.
- The server's disk is guarded: one preview takes at most 512 MB, and a
  spreadsheet row repeated more than 100,000 times is written that many times.
  A preview that reaches the limit ends with a `⋯` row.

**Everything a file contains reaches the page as text**, never as markup:
names in an archive, CSV cells, calendar items, mail text, document
paragraphs. The exceptions are highlight.js's output, which is escaped text in
`<span class="hljs-...">` sanitized down to exactly that, and Markdown, which
goes through the card viewer's own sanitizer.

**Known limits of reading a screen at a time.** Code is coloured a row at a
time, so a multi-line comment or string may be coloured as code on its later
rows; a CSV value with a newline inside quotes shows as two rows.

The viewers are [client/lib/attachmentRichViewer.js](../../../../client/lib/attachmentRichViewer.js),
[client/lib/zipAttachmentViewer.js](../../../../client/lib/zipAttachmentViewer.js)
and [client/lib/officeAttachmentViewer.js](../../../../client/lib/officeAttachmentViewer.js);
the card's attachment list and slideshow are
[client/components/cards/attachments.jade](../../../../client/components/cards/attachments.jade)
and [attachments.js](../../../../client/components/cards/attachments.js).

### Searchable text of PDF and Office documents

The text of a PDF, DOCX, XLSX or PPTX attachment is extracted on the server
for search only ([server/lib/documentGif.js](../../../../server/lib/documentGif.js),
`indexDocumentText`). The document itself is shown from the original file:
PDF by the browser's own PDF viewer, DOCX/XLSX/PPTX by the Office viewer
(`@wekan/office-open-xml-viewer`) in the browser.

*Changed since this page was first written:* the first preview of these
files used to be produced on the server as an HTML4-compatible page with
stored GIF images (PDF pages as images, XLSX sheets as HTML tables, per-page
text as escaped JSON). That was replaced on 2026-09-10 by the full-featured
Office viewer and the native PDF preview; the server now makes no images and
no HTML for them, only the search text.

The extraction is bounded to 32 MiB of source data, 200 logical pages, 2 MiB
of text, 2,048 archive entries and 96 MiB of expanded OOXML data. Existing
board-read authorization and the configured attachment download limits apply
before any conversion. Text is extracted as Unicode plain text with
formatting, XML, HTML, formulas and control characters removed. It is kept in
the unpublished `documentPreviews.searchText` field, used by
`searchAttachmentDocumentText`; searches are board-scoped (an assigned-only
member searches only their own cards' documents), permission checked,
regex-escaped and capped at 50 results.

The extraction stack is deliberately small and contains no GPL dependency:
its PDF.js (`pdfjs-dist`) is Apache-2.0 and `fflate` is MIT. PDF.js runs with
`isEvalSupported: false`, and the pinned package ranges include the fixes for
the PDF.js arbitrary-JavaScript advisory and the fflate ZIP64
denial-of-service advisory. LibreOffice, Ghostscript, a headless browser and
OCR/Tesseract are not installed.

### Retention: removing old attachments automatically

For storage limits and data-minimisation (GDPR) policies, WeKan can remove card
attachments after a set time. Everything is **off unless configured**, and runs
once a night at 03:45 ([server/attachmentRetention.js](../../../../server/attachmentRetention.js),
rules in [models/lib/attachmentRetention.js](../../../../models/lib/attachmentRetention.js)).

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

### Tests

`tests/attachmentWindow.test.cjs`, `tests/attachmentPreviewStore.test.cjs`,
`tests/attachmentRichViewer.test.cjs`, `tests/zipAttachmentViewer.test.cjs`,
`tests/officeAttachmentViewer.test.cjs`, `tests/attachmentRetention.test.cjs`,
`tests/attachmentRepair.test.cjs`, `tests/attachmentUploadPolicy.test.cjs`,
`tests/attachmentSoftDelete.test.cjs` and the other `tests/attachment*.test.cjs`;
`server/lib/tests/attachmentApi.tests.js`; and the browser tests
`tests/playwright/specs/attachment-rich-preview.e2e.js`,
`attachment-range-streaming.e2e.js`, `attachment-thumbnail.e2e.js`,
`attachment-upload-rename.e2e.js`, `admin-attachment-preview.e2e.js`,
`admin-attachment-retention.e2e.js` and `svg-attachment.e2e.js`.

## Related

- [Rclone: store attachments to cloud storage like S3, MinIO, etc.](../../../Backup/Rclone/Rclone.md)
- [Card Cover Image](../Cover/README.md)
- [Board Background Images](../../Board-Sidebar/Board-Settings/Background-Image.md)
- [Backup and Restore](../../../Backup/Backup.md)

## Commits

 - [Outlook .msg and OpenDocument converted once, a piece at a time, into rows read a screen at a time](https://github.com/wekan/wekan/commit/cd74045a9f453527c6f6eea2ba36bd75c3f955ac)
 - [the slideshow reads only what is on the screen, with no row or size limit](https://github.com/wekan/wekan/commit/d6652f19b748aaf5fac0bf68fb3588b10ba63907)
 - [the slideshow shows Markdown, CSV, code, iCalendar, Outlook .msg, tar and OpenDocument](https://github.com/wekan/wekan/commit/6d842a5e2fe7242ade92ca19e2ce5a4f9081485d)
 - [docs: which files the slideshow shows and how much is read](https://github.com/wekan/wekan/commit/53c0fbeba0aee9b4f0da335bd3dd22ed5546e97e)
 - [one copy of the API limits, headers and downloads](https://github.com/wekan/wekan/commit/27c3716f3d150fb63ab07b2c476cc8c7279196ed)
 - [attachments in S3 can be encrypted at rest](https://github.com/wekan/wekan/commit/482c2c29f47a5279c43e0033547e35da5013e8d5)
 - [SVG of any size sanitized whole, streaming, on upload, validation and every serve](https://github.com/wekan/wekan/commit/e7485598388d505c7f3990a3444bcea49f022155)
 - [Drawing from Add attachment, saved as SVG](https://github.com/wekan/wekan/commit/54726264d3d0bcdbdc94a20f75996f094c4dd2f6)
 - [retention: delete card attachments after N days, purge deleted ones after M days](https://github.com/wekan/wekan/commit/dcf91e4471814d765c148d1402865089f6e3ad21)
 - [WebDAV attachment storage for Nextcloud Files and any WebDAV server](https://github.com/wekan/wekan/commit/42340817523e2e62cc55cbd31982bc2eada1a858)
 - [stream files moved to or from the old CollectionFS storage](https://github.com/wekan/wekan/commit/cd054f99640509718cd9b24eee047ac635a0f80b)
 - [ZIP contents previewed from cards and the Files Report](https://github.com/wekan/wekan/commit/2016d15f2aeec51d12e74d05aa179dbe121a8780)
 - [full-featured DOCX/XLSX/PPTX viewer and native PDF preview restored](https://github.com/wekan/wekan/commit/373980ac8a37eb830539b01ffc12dfb0c0a53e18)
 - [searchable document previews generated on the server](https://github.com/wekan/wekan/commit/818b57421f60532f12f366fbf8f9d9cec33c00a1)
 - [safe Office attachment previews](https://github.com/wekan/wekan/commit/b527894001c1375aab395203cd74292556e9c8c3)
 - [attachment migration keeps a binary two records share](https://github.com/wekan/wekan/commit/146a5184d90028b3ccf917069b3007ef520fcb59)
 - [move any storage to any storage, legacy CollectionFS as a storage, repair file locations](https://github.com/wekan/wekan/commit/a86a087915aac9d204e157b1a698091c079e04e6)
 - [Move Attachment fixed to move files instead of doing nothing or crashing](https://github.com/wekan/wekan/commit/d30803276d6d06db44f65ee1fb583cc11aac8b7b)
 - [AttachmentMigrationBleed security fix](https://github.com/wekan/wekan/commit/053bf1dfb76ef230db162c64a6ed50ebedf67eee)
 - [attachment migration in the Admin Panel uses less CPU](https://github.com/wekan/wekan/commit/d59683eff1267ff87a6aef9ae36c7aebbe10eaa1)
 - [files stored to S3, first version](https://github.com/wekan/wekan/commit/21e2eabd607cc7fccbce8ed8562d886ab54fee68)
 - [storage strategies split into file store strategy classes](https://github.com/wekan/wekan/commit/883beba9edc4f3b0fa78538814a7e5d2ff07b2c3)
 - [moving attachments to other storages](https://github.com/wekan/wekan/commit/44fd652b0593b3806a59b2e16ddc198149923aff)
 - [attachments uploaded with Meteor-Files](https://github.com/wekan/wekan/commit/05c53ca01d71a01a608c9ae345475abd67c9939b)
