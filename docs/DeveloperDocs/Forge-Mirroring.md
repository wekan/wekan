# WeKan forge mirroring

The build Tools mirror option runs the per-destination scripts for active
GitLab, Codeberg and SourceForge mirrors. Their shared engine also retains
issue/release metadata, attachments, binaries and source archives under
`.tools/mirror`, preserving removed and replaced files with timestamped old names.

See [the mirror design and operating instructions](../../releases/mirror.md)
for preview/apply commands, the file layout, restart behavior, credentials,
API support and verification limits. Projects and wiki are excluded.
