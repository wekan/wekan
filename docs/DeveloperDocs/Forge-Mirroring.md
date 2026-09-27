# WeKan forge mirroring

The build Tools mirror option opens the eight-action menu for sync, source and
active mirror selection, online checks, missing-data checks, exit, organization-wide synchronization and organization management. GitHub is
the default source; GitLab and SourceForge are default destinations. The Codeberg entry stays
commented out in `releases/mirror.sh`; saved settings cannot re-enable it while
that registry entry is commented out.
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

### First-run Git clones

The human-run mirror command creates missing repositories beneath the WeKan
checkout's `.tools` directory, independent of the current working directory.
On macOS, a checkout at `~/Documents/repos/wekan` uses:

- `.tools/wekan-github`: a source working clone containing the source refs.
- `.tools/wekan-gitlab` and `.tools/wekan-sourceforge`: destination working
  checkouts, created after their initial synchronization and reused thereafter.

Mirror ref fetches use the source clone rather than the main WeKan working
checkout. Existing destination checkouts retain their dirty-tree and branch
checks. Cloning does not imply a forced update of any destination refs.
