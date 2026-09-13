# WeKan forge mirroring

The build Tools mirror option opens the eight-action menu for sync, source and
active mirror selection, online checks, missing-data checks, exit, organization-wide synchronization and organization management. GitHub is
the default source; GitLab, Codeberg and SourceForge are default destinations.
Choices persist in `.tools/mirror/settings.txt`; any of these forges can be the
source. Both Unix and Windows delegate to per-destination scripts. Their shared engine also retains
issue/release metadata, attachments, binaries and source archives under
`.tools/mirror`, preserving removed and replaced files with timestamped old names.

See [the mirror design and operating instructions](../../releases/mirror.md)
for preview/apply commands, the file layout, restart behavior, credentials,
API support and verification limits. Organization settings persist in
`.tools/mirror/organizations.json`; archives use
`.tools/mirror/<host>/<organization>/<repository>/`. Enabled organization wikis
and portable Projects V2 data are included. Linked media/files/webpage HTML are
archived per comment, with offline HTML and CSV indexes.
