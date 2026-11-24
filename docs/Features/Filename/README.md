# Design: Safe filename handling (display, upload, and existing files)

## What it is

Every file name WeKan shows, stores or serves is made safe and readable by the
same small set of functions: invisible and look-alike characters, markup and
other exploits are removed, a wrong extension is corrected to the real file
type, and the name is kept short enough for any file system. The file content
is cleaned of known exploits too, and the EICAR virus test file is refused.

## Read more

- [Filename](https://en.wikipedia.org/wiki/Filename),
  [Unicode equivalence](https://en.wikipedia.org/wiki/Unicode_equivalence)
  (NFKC), [IDN homograph attack](https://en.wikipedia.org/wiki/IDN_homograph_attack),
  [Billion laughs attack](https://en.wikipedia.org/wiki/Billion_laughs_attack),
  [Directory traversal attack](https://en.wikipedia.org/wiki/Directory_traversal_attack),
  [EICAR test file](https://en.wikipedia.org/wiki/EICAR_test_file) and
  [Amiga Fast File System](https://en.wikipedia.org/wiki/Amiga_Fast_File_System)
  on Wikipedia.
- [file-type](https://github.com/sindresorhus/file-type), the type detector.
- WeKan pages: [Admin Panel](../Admin-Panel/README.md) (Problems and
  the Files report).

## How to use it

There is nothing to switch on; it always applies.

1. Upload a file to a card (or an avatar). A name with invisible characters, a
   wrong extension or more than 30 characters is stored corrected; a name that
   looks like an exploit, or an EICAR file, is refused.
2. Open or download any file: the name shown and the download name are the
   clean name, and an old file whose stored name was never corrected is
   corrected the first time the server reads it.
3. As an admin, see each correction in Admin Panel → Problems (Security
   report, `action: sanitized`) with who uploaded it, why and where.

## How the numbers are calculated

- **Name length:** at most 30 characters, the extension kept
  (`MAX_AMIGA_FILENAME_CHARS` in
  [imports/lib/fileNameDisplay.js](../../../imports/lib/fileNameDisplay.js)).
- **Type detection** reads the first 64 KiB of a stored file (`HEADER_BYTES` in
  [models/lib/fileTypeCorrection.js](../../../models/lib/fileTypeCorrection.js)).
- **Serving an existing file** sniffs the first 8192 bytes; a file that begins
  like dangerous markup is buffered and cleaned only up to 8 MiB, larger ones
  stream unchanged (`SNIFF_BYTES`, `MAX_SANITIZE_BYTES` in
  [models/lib/serveFileSanitizer.js](../../../models/lib/serveFileSanitizer.js)).
  An SVG is served through the streaming SVG sanitizer of
  [server/lib/svgResponse.js](../../../server/lib/svgResponse.js), whatever
  its size.
- **Disk space:** a write needs the file's size plus a 16 MiB margin free
  (`hasEnoughDiskSpace()` in [models/lib/diskSpace.js](../../../models/lib/diskSpace.js));
  unknown free space is allowed.
- **Collisions** in a storage move get `-1`, `-2`, ... appended.
- **Look-alike folding** applies only when the name without its extension is
  mostly Latin letters.

## How it works in WeKan

Status: **Implemented** · Owner: xet7 · Related: `models/attachments.server.js`,
`models/avatars.server.js`, `models/fileValidation.js`, `models/lib/fileStoreStrategy.js`,
`imports/lib/fileNameDisplay.js`

This document specifies one unified subsystem for **safe filenames** in WeKan. It has three
sides — **display**, **upload**, and **existing files** — that share the same small set of
general functions so a filename is treated identically everywhere it is shown, stored, or served.

The motivation is concrete: a user was helped who could not open downloaded files by
double-clicking because the files had the **wrong extension**; the extension had to be detected and
fixed by hand. On top of that, filenames are an attack surface (invisible characters, right-to-left
bidi spoofing, homoglyph typosquatting, HTML/JS/XML markup, XML-loop "billion laughs", path
traversal, oversized names, and even harmless-but-must-block virus test files). This subsystem
handles all of that automatically.

### 1. Requirements

#### Display (everywhere a filename is shown: card attachments, admin Files report, download headers)

1. **URL-decode** percent-encoded names when they decode cleanly.
2. **Normalize to generally-used characters** — Unicode **NFKC** (fold fullwidth `ＡＢＣ`,
   ligatures, circled forms, …) plus **confusable-homoglyph folding**: characters from other
   scripts that imitate ASCII (Cyrillic `а`, Greek `ο`, …) are folded to the ASCII letter they
   imitate, so **typosquatting** names like `pаypal.exe` are shown as `paypal.exe`. Folding is
   applied only inside a **predominantly-Latin** name (measured on the base, excluding the
   extension), so a genuine non-Latin filename (all-Cyrillic, all-Greek, CJK, …) is preserved.
3. **Remove invisible / control / bidi characters** (C0/C1, NBSP, soft hyphen, zero-width, bidi
   overrides, BOM, interlinear).
4. **Remove exploit markup** — HTML/XML tags (incl. `<script>`, `<svg>`, `<!DOCTYPE>`, `<!ENTITY>`),
   php/asp processing instructions, CDATA, template-injection payloads, and dangerous URI schemes —
   so the shown name is always plain, readable text. (Blaze `{{ }}` also HTML-escapes; this removes
   the markup **text** as well.)
5. This is **one general function** — `cleanFileName()` — surfaced as global Blaze helpers
   `{{cleanFilename}}` (display) and `{{downloadFilename}}` (download, never empty) and used by card
   attachments, the admin Files report, and the server download `Content-Disposition` header.

The earlier iterations of this feature (a whole-red string; then a red warning triangle + inline
per-character Unicode descriptions; then a server-side "invisible-only" filter with a toggle button
and legend) were **removed**. There is no filter, warning, or description UI — every filename is
just always shown clean.

#### Upload (attachments and avatars, all storage backends)

6. **Reject exploit filenames** — a name that itself looks like an exploit (HTML/script markup, an
   XML doctype/entity, template injection, php/asp tags, `javascript:`/`data:` URIs, inline event
   handlers, null bytes, path traversal) is refused.
7. **Strip invisible characters** from the stored name. If that empties the name, **generate a name
   from the detected type** (`image.png`, `spreadsheet.xls`, `document.docx`, …).
8. **Correct the extension** to match the **real detected file type** (magic-byte sniff via the
   maintained JavaScript `file-type` dependency, with bounded libmagic/text-format fallback), so
   double-clicking the downloaded file opens the right application. A
   PNG named `foo` or `foo.txt` becomes `foo.png`; a correct `.jpg` for `image/jpeg` is kept.
   Application-owned text containers remain application-owned: Online Gantt JSON keeps `.gantt`
   rather than being degraded to generic `.json`.
9. **Cap the length** to a portable maximum — **30 characters** (classic **Amiga OS FFS** limit),
   preserving the extension — so the name can be stored on / restored to any filesystem. A cut
   through `(copy)`, `[version]` or `{variant}` removes the incomplete bracketed suffix instead of
   leaving an unmatched bracket. Not as tight as DOS 8.3.
10. **Detect and sanitize known exploits in the file content** before the file is promoted to the
    default storage (filesystem final location, S3, GridFS…): strip JavaScript and XML-loop
    DOCTYPE/ENTITY constructs from SVG uploads **in place at the staging location**, and only then
    move to final storage. **Delete the temporary file after** it has been stored.
11. **Reject known virus test files** (EICAR) — harmless but blocked like real malware.
12. **Enough-disk-space check** before writing to filesystem storage, with **small-RAM streaming**;
    when free-space info is unavailable (sandbox / remote backend), fall back to chunked streaming
    and, on **any** write error, **stop immediately and remove the partial** output (source left
    intact).

#### Existing files (already uploaded before these rules existed)

13. **Show and download a compliant name lazily** — every read first applies the common sanitizer
    and 30-character rule. A server read/download also streams only a **small header** from the
    storage backend, detects its real type, corrects the extension, and persists that corrected
    metadata at that point. There is no eager startup-wide rename. The temporary header is always
    deleted. The admin-triggered bounded corrector remains available for an explicit audit.
14. **Remove exploits before showing** — when an existing file is served, sanitize it **on the fly**
    straight from storage: sniff the **start** of the stream to detect the type and whether it
    begins like a dangerous markup document (e.g. the start of an XML-loop tag `<!DOCTYPE`/
    `<!ENTITY`); if so, sanitize the (small) document; otherwise stream every byte through unchanged.

#### Migrations (attachment/avatar moves between storage backends)

15. **Fix + sanitize the filename with the same general function** and **save the corrected name at
    the destination** storage: detect the real file type and correct the extension, strip
    invisible/exploit characters, fold homoglyphs, and cap the length.
16. **Sanitize known exploits from the content** (SVG JavaScript / XML loops) so the sanitized bytes
    are what get written to the destination.
17. **Number same-name / different-content collisions** — if a destination name is already taken by a
    file with a **different size or date**, append an increasing `-N` (`document.pdf`,
    `document-1.pdf`, …); a same-content file keeps the shared name.

   (`Attachments.insertAsync`-based migrations — the old CollectionFS→Meteor-Files path — run through
   `onAfterUpload`, so they get 6–11 automatically; the storage-move path `moveToStorage` /
   `copyFile` implements 15–17 directly.)

### 2. The general functions (single sources of truth)

| Function | Module | Used by |
| --- | --- | --- |
| `cleanFileName(name)` / `truncateAmigaFileName(name)` | `imports/lib/fileNameDisplay.js` | every displayed/downloaded name and upload sanitize |
| `sanitizeDownloadFileName(name)` | `imports/lib/fileNameDisplay.js` | download `Content-Disposition` in both file servers |
| `sanitizeUploadFileName(name, mime)` | `models/lib/uploadFileName.js` | attachment + avatar `onAfterUpload`, existing-file corrector |
| `filenameLooksLikeExploit(name)` | `models/lib/uploadFileName.js` | `isFileValid`, `onAfterUpload` |
| `sanitizeUploadedFileExploits(fileObj)` | `models/lib/sanitizeUploadedFile.js` | attachment + avatar `onAfterUpload` (SVG JS/XML-loop strip) |
| `looksLikeMalwareTestFile(text)` | `models/fileValidation.js` | `isFileValid` (EICAR) |
| `detectStoredFileMime` / `correctedNameForStoredFile` | `models/lib/fileTypeCorrection.js` | `onAfterUpload`, existing-file corrector |
| `finalizeStoredFileName` (detect type + fix ext/length + number collisions) | `models/lib/fileTypeCorrection.js` | `moveToStorage` (migrations) |
| `hasEnoughDiskSpace(dir, bytes)` | `models/lib/diskSpace.js` | `moveToStorage` |
| `createServeSanitizer(name)` | `models/lib/serveFileSanitizer.js` | `httpStreamOutput` (single download choke point) |

### 3. Data flow

**Upload** (`Attachments.onAfterUpload` / `Avatars.onAfterUpload`): sanitize file-content exploits in
place → reject exploit-looking filename → detect real MIME (small header → temp → `file` → delete
temp) → `sanitizeUploadFileName` (decode + fold homoglyphs + strip invisible/exploit + fix extension
+ cap length) → `rename` if changed → `isFileValid` (dangerous-content scan, EICAR, size, external
scanner) → `moveToStorage` (disk-space check + streaming + partial cleanup; deletes the staging
source after the write is confirmed).

**Display**: `cleanFileName` via the global helpers immediately sanitizes and applies the Amiga
limit. The first server read additionally detects content and lazily corrects stored name metadata,
so subsequent reactive displays and every download use the same correct extension.

**Serve existing file** (`httpStreamOutput`): read stream from storage → `createServeSanitizer`
(sniff start; sanitize only if dangerous, else pass through) → HTTP response.

**Correct existing extensions** (`correctFileExtensions.run`, admin-only, bounded): for each file →
`correctedNameForStoredFile` (general detector) → `rename` if changed.

### 3a. Admin Panel → Problems logging

Every time a filename or file **required sanitization** — on upload, migration, the
existing-file corrector, or viewing/serving — it is recorded to the **Security**
event stream (`action:'sanitized'`), the same log the `action:'blocked'` upload
rejections already use. Each row carries:

- **when** — the event timestamp (`at`);
- **who** — the original uploader (`userId`), shown as a clickable username column
  in the report;
- **for what reason** — the precise reasons from `sanitizationReasons()`: URL-encoded
  name, invisible characters, **typosquatting (look-alike characters)**, the specific
  **exploit kind** (`JavaScript code`, `XML code`, **`XML loop (billion laughs)`**,
  server-side PHP/ASP, template injection, HTML code), **wrong file type**
  (`.txt → .png`), **filename too long**, or empty-name-generated;
- **the filename** — `"from" → "to"`;
- **where** — board › swimlane › list › card, plus the board's **organization(s)**
  and **team(s)** (`server/lib/fileContext.js`).

Catalog keys: `file.sanitize` (name), `file.content` (content exploit removed),
`file.malware` (EICAR). Logging is best-effort and never breaks the upload/view path.

### 4. Security notes

- Display sanitization is **defense in depth**, not the only boundary — Blaze escaping, the download
  `Content-Disposition` sanitizer, SVG CSP headers, and the upload content scan remain.
- `file-type` receives a generated temporary path, never the hostile display name. Its result is a
  best-effort content hint, not malware validation. The bounded libmagic fallback uses **`execFile`**
  (argv array, no shell), so a hostile filename cannot inject a command.
- Serve-time sanitization **bounds buffering** (small text only); large files stream unchanged.
- Homoglyph folding is intentionally conservative (Latin-majority base only) to avoid corrupting
  legitimate non-Latin filenames.

### 5. Tests

- `tests/fileNameDisplay.test.cjs` — `cleanFileName` (decode, NFKC, homoglyph folding, invisible +
  exploit removal, non-Latin preservation), `sanitizeDownloadFileName`, and wiring guards.
- `tests/uploadFileName.test.cjs` — `sanitizeUploadFileName` (append/replace/keep extension, empty →
  type name, homoglyph + invisible strip, length cap) and `filenameLooksLikeExploit` positive +
  negative.
- `tests/diskSpace.test.cjs` — unknown-free-space → permissive; known → compares need + margin.
- `tests/fileTypeCorrection.test.cjs` — bounded header streaming + partial-temp cleanup on error.
- `tests/fileHardeningGuards.test.cjs` — source guards for the upload/serve wiring, EICAR, disk-space
  precheck + partial cleanup, and the serve-time XML-loop sniff.
- `tests/playwright/specs/41-admin-newest-features.e2e.js` — Files report shows clean names (decoded,
  homoglyphs folded, invisible/exploit removed); no filter/warning/legend.

## Commits

 - [Every fixed vulnerability still fixed, siblings closed](https://github.com/wekan/wekan/commit/ebcd02be6fd4ccaeabf9f905b985b97dd891886d)
 - [SVG of any size sanitized whole, streaming, on upload, validation and serve](https://github.com/wekan/wekan/commit/e7485598388d505c7f3990a3444bcea49f022155)
 - [FileNameBleed: a percent-encoded name is not an exploit](https://github.com/wekan/wekan/commit/c7c541ccc53802accd358f44c753b912bbb136f1)
 - [Full MIME detection across server platforms](https://github.com/wekan/wekan/commit/a990e7f2027a4d8063d2ddeea67bdce825717ba0)
 - [Amiga-safe filenames on every read](https://github.com/wekan/wekan/commit/829d2a6c741a69c0fbd1a6e9ae2dd80f377a33bd)
 - [Uploaded JFIF names become JPEG](https://github.com/wekan/wekan/commit/518a4d2fec487fef91f66224a9be8fc5f94e7527)
 - [An attachment stuck as .bin](https://github.com/wekan/wekan/commit/a712db94737d6f1e49c7d773e2cc004911f39a80)
 - [CodeQL multi-character sanitization fix](https://github.com/wekan/wekan/commit/e7159d337355417b8768ff7dee51a05e3211ebb5)
 - [Log every filename and content sanitization to Problems](https://github.com/wekan/wekan/commit/fdb683892d11ec1ab2b2c75fa865ac2abea6bfe4)
 - [Safe filename handling: display, upload, existing files, migrations](https://github.com/wekan/wekan/commit/81dbecfb8719ff99dac367e9921e44282c8b3ded)
 - [Reusable safe filename and clean download names](https://github.com/wekan/wekan/commit/626d956ecce0505358703a6dbc4fbfb171d0d0fe)
 - [Files report: invisible characters named inline](https://github.com/wekan/wekan/commit/fccc4a739886af6e3ac78104235c744f18182f52)
 - [Files report: decode URL-encoded names and flag invisible characters](https://github.com/wekan/wekan/commit/0a4c2ed412619a10530330f2f42cd0ce00edab64)
