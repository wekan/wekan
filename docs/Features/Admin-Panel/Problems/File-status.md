# File status checks

Files, Filesystem integrity and Recovery have read-only check buttons above the
pane contents. Only administrators can start, cancel or read a scan. There is
one active scan per server process; switching panes shows the same progress and
result. Results stay in server memory until the next scan or process restart.
Download status summary saves the report as JSON, including its coverage limits.

- **Check files and history** compares attachment/avatar metadata with storage,
  inspects local content, and looks for recovery evidence. It checks headers
  across the inventory first, then uses the remaining budget for full hashes.
- **Check file types and extensions** includes content detection and compares
  detected MIME types/extensions with the original name and version metadata.
  It also performs the inventory/history checks so mismatches have context.
- **Check missing and untracked files** performs the metadata, filesystem,
  history and GridFS inventory checks without reading file contents.

The checks never rename, repair, delete or recreate a file, edit metadata,
restore history, move storage, or reset an integrity baseline.

## Checks and evidence

The report identifies missing names, extensions, MIME types, sizes, paths,
version entries, storage flags and parent-card/board references. A file can
exist even when its upload metadata is incomplete. That is reported separately
from a missing binary. Such gaps can follow an interrupted upload, failed MIME
inspection, an import, or another failed finalization step; a gap alone does not
prove which operation failed.

Local inventories cover configured attachment/avatar directories, their temporary
upload directory, known legacy collection/upload directories and recognizable
legacy migration files directly under WRITABLE_PATH. The report records current
and canonical directory paths, inaccessible roots, permissions/read failures,
symlinks (not followed), non-regular files and files changed during inspection.
An inaccessible/missing mount remains a possible cause, not proof of deletion.

Checks compare sizes, MIME types, filename extensions, version extension fields,
recorded SHA-256 values and existing integrity baselines. They detect duplicate
references, duplicate content and files without a live database reference.
Recent untracked files may still be uploading or migrating. Unknown types stay
unknown; extension suggestions are evidence for review, not automatic renames.

Undo/change history includes attachment removals, restores, renames and undone
changes when recorded. Activity and recovery events provide additional context.
The report correlates historical names and paths, identifiers in stored names,
and matching hashes with possible moved/renamed files. Matching names alone are
ambiguous. Matching hashes establish matching content, not who moved it or why.
No history entry does not prove that an action never occurred. Filesystem edits,
old imports, disabled/pruned history and failed operations may leave no history.

GridFS checks cover file-record references, lengths, unreferenced file records,
chunk counts/sequences, and chunks without a file record. Configured cloud/GridFS
objects can also be sampled through the existing read strategy, with a timeout.
Missing configuration never falls back to a local file and reports remote success.

## Limits and interpretation

A scan is a changing snapshot, not a database/filesystem transaction. Repeat
checks after uploads or migrations stop before deciding what happened. Partial
inventories can produce candidate orphans; they are never deletion instructions.

Defaults per scan: two minutes, 20,000 records per collection (20,000 versions),
50,000 directory/chunk entries, 20,000 history rows per stream, 12 directory
levels, 64 KiB per type header, 32 MiB per full local checksum read, 256 MiB of content
reads, and 500 displayed findings.
Counts continue beyond the displayed sample. Limits, cancellation and failures
are explicit; skipped content is not classified as verified. Remote reads use
at most 64 KiB with a five-second timeout. ZIP containers whose Office/OpenDocument
subtype cannot be confirmed are reported as inconclusive rather than assigned
a supposedly corrected `.zip` extension. A 30-second cooldown prevents repeated
starts. On multi-process deployments, each process has its own scan state.

This cannot cover every possible failure: encrypted/unknown formats, files
outside known directories, unavailable mounts, remote bucket objects without
metadata, legacy CollectionFS buckets, backup contents, filesystem journals and
removed history require separate investigation. Remote payload checksums and
GridFS chunk payload integrity are not fully verified. Integrity baseline
signatures are handled by the existing Filesystem integrity scanner; this
read-only comparison does not replace it. No scan can reconstruct evidence
that was never saved or recover bytes absent from accessible storage/backups.

Reports contain administrator-only filenames, paths and identifiers. Review
that information before sharing a downloaded report.

MIME checks use the shared [native and portable libmagic detector](../../../DeveloperDocs/File-type-detection.md),
including the bundled engine/database when the system `file` command is missing.

## Verification

Five focused Node suites pass, including positive/negative metadata, history,
filesystem/GridFS, header/checksum budget, MIME alias, authorization and
single-scan tests. Two browser scenarios pass sequentially in each of Chromium,
Firefox and WebKit against the source development server: incomplete upload
metadata with summary download/non-admin rejection, and a real PNG with a wrong
extension/MIME type whose file and record remain unchanged. The header-first
content checks were rerun in all three browsers. Verification used Linux arm64;
live cloud credentials, native Windows and a production deployment were not used.
