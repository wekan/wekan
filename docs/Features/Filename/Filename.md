# Design: Safe filename handling (display, upload, and existing files)

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

## 1. Requirements

### Display (everywhere a filename is shown: card attachments, admin Files report, download headers)

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

### Upload (attachments and avatars, all storage backends)

6. **Reject exploit filenames** — a name that itself looks like an exploit (HTML/script markup, an
   XML doctype/entity, template injection, php/asp tags, `javascript:`/`data:` URIs, inline event
   handlers, null bytes, path traversal) is refused.
7. **Strip invisible characters** from the stored name. If that empties the name, **generate a name
   from the detected type** (`image.png`, `spreadsheet.xls`, `document.docx`, …).
8. **Correct the extension** to match the **real detected file type** (content sniff via the `file`
   command + `mime-types`), so double-clicking the downloaded file opens the right application. A
   PNG named `foo` or `foo.txt` becomes `foo.png`; a correct `.jpg` for `image/jpeg` is kept.
9. **Cap the length** to a portable maximum — **30 characters** (classic **Amiga OS FFS** limit),
   preserving the extension — so the name can be stored on / restored to any filesystem. Not as
   tight as DOS 8.3.
10. **Detect and sanitize known exploits in the file content** before the file is promoted to the
    default storage (filesystem final location, S3, GridFS…): strip JavaScript and XML-loop
    DOCTYPE/ENTITY constructs from SVG uploads **in place at the staging location**, and only then
    move to final storage. **Delete the temporary file after** it has been stored.
11. **Reject known virus test files** (EICAR) — harmless but blocked like real malware.
12. **Enough-disk-space check** before writing to filesystem storage, with **small-RAM streaming**;
    when free-space info is unavailable (sandbox / remote backend), fall back to chunked streaming
    and, on **any** write error, **stop immediately and remove the partial** output (source left
    intact).

### Existing files (already uploaded before these rules existed)

13. **Show the correct extension** — detect the real type by streaming only a **small header** of
    the file from its storage backend to `WRITABLE_PATH/files/temp`, running `file` on it, then
    **deleting the temp file**. Reuses the same streaming approach as attachment migration/move, as
    **one general function**. Surfaced as an admin-triggerable, **bounded** batch corrector.
14. **Remove exploits before showing** — when an existing file is served, sanitize it **on the fly**
    straight from storage: sniff the **start** of the stream to detect the type and whether it
    begins like a dangerous markup document (e.g. the start of an XML-loop tag `<!DOCTYPE`/
    `<!ENTITY`); if so, sanitize the (small) document; otherwise stream every byte through unchanged.

### Migrations (attachment/avatar moves between storage backends)

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

## 2. The general functions (single sources of truth)

| Function | Module | Used by |
| --- | --- | --- |
| `cleanFileName(name)` | `imports/lib/fileNameDisplay.js` | `{{cleanFilename}}` / `{{downloadFilename}}`, upload sanitize, viewer title |
| `sanitizeDownloadFileName(name)` | `imports/lib/fileNameDisplay.js` | download `Content-Disposition` in both file servers |
| `sanitizeUploadFileName(name, mime)` | `models/lib/uploadFileName.js` | attachment + avatar `onAfterUpload`, existing-file corrector |
| `filenameLooksLikeExploit(name)` | `models/lib/uploadFileName.js` | `isFileValid`, `onAfterUpload` |
| `sanitizeUploadedFileExploits(fileObj)` | `models/lib/sanitizeUploadedFile.js` | attachment + avatar `onAfterUpload` (SVG JS/XML-loop strip) |
| `looksLikeMalwareTestFile(text)` | `models/fileValidation.js` | `isFileValid` (EICAR) |
| `detectStoredFileMime` / `correctedNameForStoredFile` | `models/lib/fileTypeCorrection.js` | `onAfterUpload`, existing-file corrector |
| `finalizeStoredFileName` (detect type + fix ext/length + number collisions) | `models/lib/fileTypeCorrection.js` | `moveToStorage` (migrations) |
| `hasEnoughDiskSpace(dir, bytes)` | `models/lib/diskSpace.js` | `moveToStorage` |
| `createServeSanitizer(name)` | `models/lib/serveFileSanitizer.js` | `httpStreamOutput` (single download choke point) |

## 3. Data flow

**Upload** (`Attachments.onAfterUpload` / `Avatars.onAfterUpload`): sanitize file-content exploits in
place → reject exploit-looking filename → detect real MIME (small header → temp → `file` → delete
temp) → `sanitizeUploadFileName` (decode + fold homoglyphs + strip invisible/exploit + fix extension
+ cap length) → `rename` if changed → `isFileValid` (dangerous-content scan, EICAR, size, external
scanner) → `moveToStorage` (disk-space check + streaming + partial cleanup; deletes the staging
source after the write is confirmed).

**Display**: `cleanFileName` via the global helpers — no server round-trip, no stored mutation.

**Serve existing file** (`httpStreamOutput`): read stream from storage → `createServeSanitizer`
(sniff start; sanitize only if dangerous, else pass through) → HTTP response.

**Correct existing extensions** (`correctFileExtensions.run`, admin-only, bounded): for each file →
`correctedNameForStoredFile` (general detector) → `rename` if changed.

## 3a. Admin Panel → Problems logging

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

## 4. Security notes

- Display sanitization is **defense in depth**, not the only boundary — Blaze escaping, the download
  `Content-Disposition` sanitizer, SVG CSP headers, and the upload content scan remain.
- `file` detection uses **`execFile`** (argv array, no shell), so a hostile filename cannot inject a
  command.
- Serve-time sanitization **bounds buffering** (small text only); large files stream unchanged.
- Homoglyph folding is intentionally conservative (Latin-majority base only) to avoid corrupting
  legitimate non-Latin filenames.

## 5. Tests

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
