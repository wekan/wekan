# Backup

Admin Panel / Attachments / Backup creates, schedules, lists and restores streaming
ZIP backups. A backup can contain attachments, avatars and/or text data and can be
written to Filesystem, S3/MinIO, Azure Blob or Google Cloud Storage. The page reports
the current background phase, detail, result path and bounded error text.

A site administrator may back up the whole instance or one Organization and may set
the instance-wide daily, weekly or monthly schedule. An Organization administrator
sees only the Organizations they administer, can run their scoped backups on demand
and cannot see the instance-wide schedule or other Attachments panes. Archive listing
and restore repeat the same scope check, and restore derives its scope from the
archive path rather than trusting a submitted Organization id.

The HTML5 and Legacy HTML4 views call the same services. The HTML4 view uses labelled
native controls in natural keyboard order and signed HTTP POST actions, without
JavaScript or cookies. Restore requires an explicit confirmation and accepts only a
path returned by the caller's freshly scoped archive list. Content flags are strict
booleans; storage, frequency, time, weekday, month date and restore mode use fixed
allowlists. Unknown fields and invalid values are refused and rejected HTML4 actions
are reported in Admin Panel / Problems / Security.

Backups and restores remain background operations so a long archive does not hold an
HTTP request open. File and database contents stream rather than being buffered as a
whole in memory. See the parent [Attachments](README.md) page for archive layout and
tenant contents, and [Design / Multitenancy](../../../Design/Multitenancy/Multitenancy.md)
for the scope model.
