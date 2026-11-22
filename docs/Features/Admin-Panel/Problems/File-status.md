# File status checks

## What it is

Three read-only check buttons that compare what the database says about every
attachment and avatar with what is really in storage. They find files whose
upload metadata is incomplete, files whose type does not match their name,
missing files, files nobody references, and the history that may explain how
a file moved or disappeared. The checks never change a file or a record: they
are evidence for an administrator to review.

## Read more

- [File format](https://en.wikipedia.org/wiki/File_format) and
  [Media type (MIME type)](https://en.wikipedia.org/wiki/Media_type) - what a
  file type and a MIME type are.
- [file (command)](https://en.wikipedia.org/wiki/File_(command)) - the libmagic
  content detection WeKan uses, see also
  [File type detection](../../../DeveloperDocs/File-type-detection.md).
- [SHA-2](https://en.wikipedia.org/wiki/SHA-2) - the SHA-256 checksums that are
  compared.
- [GridFS](https://www.mongodb.com/docs/manual/core/gridfs/) - how files and
  chunks are kept in the database.
- WeKan: [Filesystem integrity](Filesystem-integrity.md),
  [Recovery](Recovery.md), [Problems](README.md).

## How to use it

1. Sign in as a site administrator and open **Admin Panel → Problems**.
2. Open **Files Report**, **Filesystem integrity** or **Recovery**. The same
   buttons are above the pane contents on all three; switching panes shows the
   same progress and result.
3. Press one of:
   - **Check files and history** - compares attachment/avatar metadata with
     storage, inspects local content and looks for recovery evidence. It checks
     headers across the inventory first, then uses the remaining budget for
     full hashes.
   - **Check file types and extensions** - adds content detection and compares
     detected MIME types/extensions with the original name and version
     metadata. It also performs the inventory/history checks so mismatches have
     context.
   - **Check missing and untracked files** - the metadata, filesystem, history
     and GridFS inventory checks without reading file contents.
4. While a check runs, **Cancel check** stops it.
5. When it has finished, read the counts, **Coverage and limitations**,
   **Storage directories** and **Findings (bounded sample; full counts above)**.
6. **Download status summary** saves the report as JSON, including its
   coverage limits. Review it before sharing: it contains administrator-only
   filenames, paths and identifiers.

Only administrators can start, cancel or read a scan. There is one active scan
per server process. Results stay in server memory until the next scan or
process restart.

The checks never rename, repair, delete or recreate a file, edit metadata,
restore history, move storage, or reset an integrity baseline.

## How the numbers are calculated

The limits are `LIMITS` in
[server/lib/fileStatusAudit.js](../../../../server/lib/fileStatusAudit.js) and
the constants in
[server/methods/fileStatusAudit.js](../../../../server/methods/fileStatusAudit.js):

| Limit | Value |
| --- | --- |
| Time per scan | 2 minutes (120,000 ms) |
| Records per collection | 100,000 |
| File versions | 250,000 |
| Directory and GridFS chunk entries | 50,000 |
| History rows per stream | 20,000 |
| Directory depth | 12 levels |
| Type header read per file | 64 KiB |
| One full local checksum read | 32 MiB |
| All content reads together | 256 MiB |
| Displayed findings | 500 |
| Remote (GridFS/S3/Azure/GCS) read | at most 64 KiB, with a 5-second timeout |
| Cooldown between two scans | 30 seconds |

- Each finding adds 1 to its kind's count in the totals, whether or not it is
  listed. Counts continue beyond the displayed sample.
- The 500 listed rows are shared fairly between kinds: when the list is full,
  a kind with fewer listed rows takes the place of the last row of the kind
  with the most, so one kind cannot fill the whole list and hide the others.
  Every kind still has its whole count in the totals.
- Bytes read are summed per scan; a read that would pass the 256 MiB budget is
  not done, and the report says the results are partial.
- When a limit is reached the scan state is `partial`; a cancel is
  `cancelled`; a failure is `failed`. Skipped content is not classified as
  verified.

## How it works in WeKan

- [server/methods/fileStatusAudit.js](../../../../server/methods/fileStatusAudit.js)
  has the methods `startFileStatusAudit(mode)` (`all`, `types` or
  `inventory`), `getFileStatusAudit` and `cancelFileStatusAudit`. Each checks
  that the caller `isAdmin`. A start while a scan runs returns the running one;
  a start within 30 seconds of the last one is refused (`scan-cooldown`).
- [server/lib/fileStatusAudit.js](../../../../server/lib/fileStatusAudit.js)
  does the read-only inventory (`auditFiles`).
- Content types are detected with `file-type` and then the shared
  [native and portable libmagic detector](../../../DeveloperDocs/File-type-detection.md)
  ([models/lib/mimeDetection.js](../../../../models/lib/mimeDetection.js)),
  including the bundled engine/database when the system `file` command is
  missing.
- The buttons are the `fileStatusAudit` template in
  [client/components/settings/adminProblems.jade](../../../../client/components/settings/adminProblems.jade),
  shown on the `report-files`, `report-integrity` and `report-recovery` panes.

**Checks and evidence.** The report identifies missing names, extensions, MIME
types, sizes, paths, version entries, storage flags and parent-card/board
references. A file can exist even when its upload metadata is incomplete. That
is reported separately from a missing binary. Such gaps can follow an
interrupted upload, failed MIME inspection, an import, or another failed
finalization step; a gap alone does not prove which operation failed.

Local inventories cover configured attachment/avatar directories, their
temporary upload directory, known legacy collection/upload directories and
recognizable legacy migration files directly under WRITABLE_PATH. The report
records current and canonical directory paths, inaccessible roots,
permissions/read failures, symlinks (not followed), non-regular files and files
changed during inspection. An inaccessible/missing mount remains a possible
cause, not proof of deletion.

Checks compare sizes, MIME types, filename extensions, version extension
fields, recorded SHA-256 values and existing integrity baselines. They detect
duplicate references, duplicate content and files without a live database
reference. Recent untracked files may still be uploading or migrating. Unknown
types stay unknown; extension suggestions are evidence for review, not
automatic renames. ZIP containers whose Office/OpenDocument subtype cannot be
confirmed are reported as inconclusive rather than assigned a supposedly
corrected `.zip` extension.

Undo/change history includes attachment removals, restores, renames and undone
changes when recorded. Activity and recovery events provide additional context.
The report correlates historical names and paths, identifiers in stored names,
and matching hashes with possible moved/renamed files. Matching names alone are
ambiguous. Matching hashes establish matching content, not who moved it or why.
No history entry does not prove that an action never occurred. Filesystem
edits, old imports, disabled/pruned history and failed operations may leave no
history.

GridFS checks cover file-record references, lengths, unreferenced file records,
chunk counts/sequences, and chunks without a file record. Configured
cloud/GridFS objects can also be sampled through the existing read strategy,
with a timeout. Missing configuration never falls back to a local file and
reports remote success.

**Limits and interpretation.** A scan is a changing snapshot, not a
database/filesystem transaction. Repeat checks after uploads or migrations stop
before deciding what happened. Partial inventories can produce candidate
orphans; they are never deletion instructions. Limits, cancellation and
failures are explicit. On multi-process deployments, each process has its own
scan state.

This cannot cover every possible failure: encrypted/unknown formats, files
outside known directories, unavailable mounts, remote bucket objects without
metadata, legacy CollectionFS buckets, backup contents, filesystem journals and
removed history require separate investigation. Remote payload checksums and
GridFS chunk payload integrity are not fully verified. Integrity baseline
signatures are handled by the existing Filesystem integrity scanner; this
read-only comparison does not replace it. No scan can reconstruct evidence
that was never saved or recover bytes absent from accessible storage/backups.

**Tests.**
[tests/fileStatusAudit.test.cjs](../../../../tests/fileStatusAudit.test.cjs),
[tests/fileStatusAuditMethods.test.cjs](../../../../tests/fileStatusAuditMethods.test.cjs),
[tests/portableMimeDetection.test.cjs](../../../../tests/portableMimeDetection.test.cjs)
and the browser test
[tests/playwright/specs/file-status-audit.e2e.js](../../../../tests/playwright/specs/file-status-audit.e2e.js).

## Verification

Five focused Node suites pass, including positive/negative metadata, history,
filesystem/GridFS, header/checksum budget, MIME alias, authorization and
single-scan tests. Two browser scenarios pass sequentially in each of Chromium,
Firefox and WebKit against the source development server: incomplete upload
metadata with summary download/non-admin rejection, and a real PNG with a wrong
extension/MIME type whose file and record remain unchanged. The header-first
content checks were rerun in all three browsers. Verification used Linux arm64;
live cloud credentials, native Windows and a production deployment were not
used.

## Commits

- [One kind of finding no longer fills the whole list and hides the others](https://github.com/wekan/wekan/commit/35ba67ee699e8485fef66d57a5ded89bc3dd75e2)
 - [Clearer file scan wording](https://github.com/wekan/wekan/commit/d43968d888a7f40f9940b318dcd9c4f99edf95bc)
 - [Full MIME detection on every server platform](https://github.com/wekan/wekan/commit/a990e7f2027a4d8063d2ddeea67bdce825717ba0)
 - [The read-only file status checks in Admin Panel / Problems](https://github.com/wekan/wekan/commit/1f5cb0d13476083e7d9cb67481d8d6bfb9bf7095)
