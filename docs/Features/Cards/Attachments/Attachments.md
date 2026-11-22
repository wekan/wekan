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

## The slideshow: which files are shown, and how much is read

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
a file (`client/lib/attachmentWindow.js`). A legacy CollectionFS attachment,
which the server sends whole, is read only up to the rows wanted.

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
(`server/lib/attachmentPreviewStore.js`, `client/lib/attachmentRecords.js`).

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
