# UCS portal upgrades: WeKan 6.09 to WeKan 12.28 and later

The target is an **automatic upgrade from the UCS App Center portal**. An
administrator selects **Upgrade** for WeKan; no separate migration command should
be necessary. WeKan 6.09's MongoDB data moves to **FerretDB v1 with SQLite**, and
CollectionFS/GridFS attachments and avatars move to the **filesystem**.

**Status: implementation prepared, not published or validated on UCS yet.**
The app definition is in the separate [wekan/univention repository](https://github.com/wekan/univention),
checked out locally at `.tools/univention`. The initial target is **12.28**.
“Newest” means the newest version published and approved in the UCS App Center;
a new upstream WeKan release does not automatically become a UCS release.

After upgrade, normal start/restart runs exactly two containers:

| Service | Container | Process |
| --- | --- | --- |
| `wekan` | `wekan-app` | WeKan, initially 12.28 |
| `wekandb` | `wekan-db` | FerretDB v1, SQLite handler |

No MongoDB, migration worker, or third database container belongs in the installed
compose file. The app uses the versioned WeKan image. The database uses the dedicated
`ghcr.io/wekan/ferretdb` image, pinned by version tag, with its `/ferretdb` entrypoint.
Univention mirrors these source images into its registry when publishing: the
service/repository name `wekan-wekandb` does not mean the new image runs MongoDB.

## What has been prepared

In `wekan/univention`:

- `component/compose`: two services, retained UCS ROOT_URL/LDAP/mail templates,
  polling reactivity, persistent filesystem storage, and a migration completion
  gate before the application starts.
- `component/preinst`: host-side App Center hook. Pulls the images before downtime,
  stops the old app, saves a MongoDB dump and rendered configuration, migrates and
  verifies the copy, and removes the temporary containers before returning success.
  Failure returns nonzero to cancel the upgrade and restarts the old app if it was
  running. The old MongoDB directory is never overwritten or deleted.
- `component/migration/`: one-shot helper image, legacy-compatible importer, source
  tool wrappers and strict completion/file checks. `mongo` and `mongoexport` run
  inside the original database container using `docker exec`; a modern driver
  connects only to FerretDB. No intermediate MongoDB version upgrade is needed.
  The temporary database uses the same pinned GHCR FerretDB image as the final
  compose service.
- `component/inst` and `component/test`: use the app's MongoDB driver to access
  FerretDB instead of expecting a Mongo shell in `wekan-db`.
- `component/compose-6.09`: original template retained for reference/rollback.
- `tests/migration.test.mjs`: isolated tests for upgrade sequencing, failures,
  retry handling, file verification and the two-service deployment.

The helper is temporary. It needs the Docker socket to run the original database's
read tools; **the installed WeKan and FerretDB containers never mount that socket**.
The migration rejects partial success, truncated files, unresolved CollectionFS
records, unconverted GridFS references and missing attachment files. Files already
stored externally by a customized 6.09 installation need a separate recovery plan;
the automatic path here is for MongoDB-stored attachments.

## Remaining steps for the maintainer

### Writable storage layout

UCS sets `WRITABLE_PATH=/data` in both the app and migration helper. The helper
uses that variable for its file output, verification, status and completion marker:

- `${WRITABLE_PATH}/files/attachments`: migrated attachment files.
- `${WRITABLE_PATH}/files/avatars`: migrated avatar files.
- `${WRITABLE_PATH}/files/db`: FerretDB SQLite files, mounted as `/state` inside
  the separate database container.

These directories persist on the UCS host beneath
`/var/lib/univention-appcenter/apps/wekan/data/ferretdb/files/`.
The migration and final database containers mount the same `files/db` directory.
Changing the container-side writable path requires updating both the app and
helper environment and their volume destinations, plus the startup marker check;
changing only the app environment would leave the migrated file paths pointing
to the old location.

### 1. Publish the companion changes and build the helper

Commit/push the prepared `wekan/univention` changes from its default branch,
`master`, and the documentation from `wekan/wekan`'s `main`. These are separate
repositories; a WeKan commit does not include files under `.tools/univention`.
Publishing commands in this document are for the human maintainer.

On a Docker build machine, from the `wekan/univention` root:

```sh
docker pull ghcr.io/wekan/wekan:v12.28
docker build --pull -f component/migration/Dockerfile \
  -t ghcr.io/wekan/wekan-ucs-migration:v12.28 .
```

Inspect the result and verify that the selected WeKan image has Node and the
modern MongoDB driver under the bundle's `programs/server` tree. The selected
FerretDB image must use the SQLite handler and `/ferretdb` entrypoint, with UID
1000 owning its `/state` mount. `preinst` gives that UID ownership of
`ferretdb/files/db/`; app-owned attachment directories keep the WeKan image's UID.
The helper copies the Docker CLI from `docker:27.5.1-cli`;
verify it can communicate with Docker on each supported UCS version.

Publish the tested helper image to the registry referenced by `component/preinst`,
or let the new `ucs.yml` job build/publish it automatically after adding the
configuration below. The normal app and database images are mirrored by
Univention from the references in `compose`. The one-shot helper is not a compose
service, so arrange its mirroring separately if UCS cannot pull from GHCR. If
registries change, update `image`, `dbimage` and `helper` in `preinst`, the two
compose image references and the helper's `WEKAN_IMAGE` build argument. The portal cannot perform the migration
until the helper image exists and is pullable by the UCS host.

Keep version tags fixed per UCS release. `releases/ucs-release.py` prepares the
versioned compose, preinst and helper Dockerfile together. It retains every image
history comment and adds the replaced active image as another comment. The
workflow resolves the latest published stable release of the **wekan/FerretDB**
fork at run time and sets `UCS_FERRETDB_IMAGE` to its full GHCR version tag. Do not use
upstream `ghcr.io/ferretdb/ferretdb:2`: that is a different PostgreSQL backend.

### 2. Register the app version and scripts in the Provider Portal

Use the App Provider account that owns `wekan`. Create the new app version from
6.09 in the target UCS section. Select supported UCS versions/architectures only
after testing; the old `meta/wekan_20190520122559.ini` is historical metadata,
not a ready-to-publish 12.28 definition.

Upload/register these files for the **new** version:

| File | Provider Portal purpose |
| --- | --- |
| `component/compose` | UCR-template Docker Compose file; main service `wekan` |
| `component/preinst` | Script called before installation/upgrade |
| `component/inst` | Join script |
| `component/uinst` | Unjoin script |
| `component/test` | Test script run after installation |
| `component/README_EN`, `component/README_DE` | Administrator information |

The migration helper's files are inside its image; they are not separate App Center
hooks. Do not upload `compose-6.09` as the new compose file. Do not enable an
inherited `store_data` script that requires the old application to remain running:
the prepared `preinst` deliberately leaves it stopped to prevent post-copy writes.

Confirm with Univention that a long-running `preinst` is supported for the largest
expected databases, including the timeout and progress handling. Check that the
remaining upgrade lifecycle accepts the stopped old main container. These are
**release blockers to test**, not assumptions already verified here.

UCS substitutes `@%@...@%@` and `@!@...@!@` in the compose template. Do not run the
raw template through Docker Compose; validate the rendered file on UCS. See the
[UCS configuration and upgrade-hook documentation](https://docs.software-univention.de/app-center/5.2/en/configurations.html).

### 3. Test the actual portal upgrade on a disposable UCS VM

Take a VM snapshot, install 6.09, and seed representative data before enabling the
[Test App Center](https://docs.software-univention.de/app-center/5.2/en/lifecycle.html#test-app-center).
Use the portal's **Upgrade** action, not only a direct invocation of `preinst`.

- Verify boards, lists, swimlanes, cards, comments, users and permissions. Let the
  new app complete its normal schema migrations on first startup.
- Download pre-upgrade attachments and compare their hashes after migration.
  Include images, PDFs, non-ASCII filenames, large and empty files, CollectionFS
  attachments, Meteor-Files GridFS versions, avatars and card covers. Open/download
  them in the browser, and upload a new file after upgrading.
- Test activated LDAP users, Domain Admin membership, rejected inactive users,
  the local administrator, ROOT_URL `/wekan`, WebSockets and mail settings.
- Test a fresh install and a later upgrade from the migrated release. Neither
  should try to import the old MongoDB again.
- Test missing source, failed image pull, dump failure, insufficient disk space,
  truncated GridFS chunks, interrupted worker and a retry after the old app has
  accepted new writes. Failure must appear in the portal and must not start an
  empty new app. Retries must take a new snapshot, not reuse stale copied data.
- Restart WeKan through UCS, then reboot the VM. Verify only `wekan-app` and
  `wekan-db` run for this app. `wekan-db` must run `/ferretdb`; neither
  `wekan-ucs-migration` nor `wekan-ucs-migration-db` may remain.
- Exercise rollback on the test VM using the saved rendered compose and retained
  MongoDB directory. Record the steps for the UCS version being released.

Local validation so far covers shell/JavaScript syntax and isolated mocked-Docker
regression tests. **No real Docker image build, UCS portal upgrade, database copy,
LDAP/browser test or reboot test has been run in this development environment.**
Do not approve the production release on the strength of the mocked tests alone.

### 4. Configure the standalone UCS publisher

[ucs.yml](../../../.github/workflows/ucs.yml) runs only when started separately
with `workflow_dispatch`. Neither `release-all.yml` nor `release-all-missing.yml`
invokes it. After the selected WeKan release and Docker image exist, a human
maintainer starts it from GitHub Actions **Run workflow** or with:

```sh
gh workflow run ucs.yml
```

Leave the **version** input empty to use the latest published stable release of
`wekan/wekan`. To retry a specific WeKan release, provide its numeric version,
for example `gh workflow run ucs.yml -f version=12.28`. FerretDB is resolved from
the latest published stable release of `wekan/FerretDB` on every run, matching
the fork used by this repository's build scripts. Both images use explicit tags,
and the workflow pulls them before uploading a portal draft; an unavailable
image fails the run rather than silently falling back to an older image.

`UCS_FERRETDB_IMAGE` is now an environment variable computed for that run, not a
repository Actions variable to maintain. An existing repository value such as
`v1.92.0` is ignored. The workflow does not modify repository variables.
`UCS_TARGET_UCS` keeps its existing meaning and value: the destination UCS
section. The portal target combines that section with the resolved WeKan version.
The selected image versions appear in the run summary.


Add these **repository Actions secrets** in `wekan/wekan`:

| Secret | Value |
| --- | --- |
| `UNIVENTION_APP_PROVIDER_USER` | Account with access to the `wekan` app |
| `UNIVENTION_APP_PROVIDER_PASSWORD` | That account's Provider Portal password |
| `GHCR_AUTH` | Existing base64-encoded `username:token`, permitted to publish `ghcr.io/wekan/wekan-ucs-migration` |

Add these **repository Actions variables** (not secrets):

| Variable | Value |
| --- | --- |
| `UCS_SOURCE_APP` | Existing portal version to copy, including UCS section, for example `4.4/wekan=6.09`; use the exact version displayed by the portal |
| `UCS_TARGET_UCS` | Tested destination section, for example `5.2` |


`WEKAN_REPO_TOKEN` is no longer required for UCS: the companion checkout is public
and the job does not push git changes. The new versioned definition is kept in
the portal and a workflow artifact. Keep the companion template's version history
current when adopting it for subsequent releases.

The standalone job checks the selected upstream release, reads the Provider Portal
catalog, and leaves a **published** version unchanged. For a missing version it
copies `UCS_SOURCE_APP`; for an existing draft it resumes uploading. It prepares
versioned files, verifies the source app/database images are pullable, builds only
a missing helper image, and uploads the explicit compose/hooks/README file list
using the official CLI. The compose and preinst are read back and compared with
the submitted files. Authentication/network/read-back errors fail visibly; they
are not treated as a missing version or a successful upload.

If required configuration is absent, the job reports **not configured** and skips.
Once configured, a failure is visible in the standalone UCS workflow. To retry,
run `ucs.yml` again with the same version; existing drafts are resumed and
published versions are left unchanged. The WeKan release image must already
exist; this job does not rebuild the main WeKan Docker image.

The CLI is downloaded from Univention using this repository's `releases/fetch.sh`.
It is called with its actual `--noninteractive` and `--pwdfile` options. Secrets
stay in a private temporary file; app-definition JSON is not printed to logs.
These commands have offline regression coverage but still require a first
credentialed Test App Center upload to confirm the account's metadata and the
portal's compose/preinst read-back fields. No portal writes were performed during
development.

**Upload is not production approval.** The job prepares the Provider Portal
version. UCS VM testing, image mirroring, provider approval and Univention approval
remain human/provider steps before users see it in production. See the
[Provider Portal upload documentation](https://docs.software-univention.de/app-center/5.2/en/lifecycle.html#app-provider-portal-upload-interface).

### 5. Obtain release approval and verify availability

After the VM upgrade and rollback tests pass, approve the tested app version in
the Provider Portal and coordinate Univention's approval/mirroring. Verify that
an ordinary production UCS installation offers the new version and that its
Upgrade action performs the migration automatically. Until then, describe 12.28
as the **prepared UCS upgrade**, not as already available in the production catalog.

## Checked image identities

On 2026-10-11, the public registry metadata for
`docker.software-univention.de/wekan-wekandb:6.09-ucs1` reported
`MONGO_MAJOR=3.2`, **`MONGO_VERSION=3.2.21`**, and command `mongod`.
Its manifest digest was
`sha256:c854131fa9b0b046dfe271fc03bf5c3c236da35749d2ccfa979ff3238a1d8140`.
This was checked from the
[UCS registry manifest](https://docker.software-univention.de/v2/wekan-wekandb/manifests/6.09-ucs1),
not inferred from the WeKan version number. No database binary was executed here.

The GHCR **wekan/FerretDB** image selected for the new template uses the version tag
`ghcr.io/wekan/ferretdb:v1.92.0`. The public registry confirmed that this tag
resolves to the previously selected image. Compose and the migration hook use
the tag; the previous digest remains only in the compose image history.
Its registry configuration confirms `/ferretdb`, user `ferretdb:ferretdb`, handler
`sqlite` and the default `/state` storage directory. The fork's Docker build uses
UID 1000. The root WeKan `docker-compose.yml` currently uses the same fork through
a Debian container that downloads its release binary; it does **not** currently
pull a GHCR database image. UCS instead uses the dedicated, mirrorable GHCR image.
All historical image comments in `component/compose` are retained.

## Storage, retry and rollback reference

All paths below are under `/var/lib/univention-appcenter/apps/wekan/data/`:

| Path | Purpose |
| --- | --- |
| `db/` | Original MongoDB data; retained, never mounted by the new compose |
| `dump/ucs-<timestamp>-<pid>/` | MongoDB dump, old rendered compose, container configuration |
| `ferretdb/files/db/` | Active FerretDB SQLite data |
| `ferretdb/files/attachments/` | Migrated attachment files |
| `ferretdb/files/avatars/` | Migrated avatar files |
| `ferretdb/.ucs-migration-complete` | Gate allowing the new application to start |
| `ferretdb/ucs-migration-status.json` | Migration result and diagnostics |
| `ferretdb-before-<timestamp>-<pid>/` | Previous attempt retained when retrying 6.09 upgrade |

Keep backups private: they contain user data, password hashes and LDAP/mail
configuration. Back up the active SQLite database and attachment/avatar directories
as one consistent set, preferably while the two services are stopped. Never copy
SQLite alone and assume it contains the attachment binaries.

A failed migration cancels the upgrade and restarts the old app when possible.
Failure later in the App Center lifecycle may require UCS recovery: stop the new
services, restore the saved old app definition through UCS, and use the original
MongoDB data with the old image. Changes made on the new app after cutover are
not present in the old database. Do not delete either copy during investigation.
Do not create the completion marker by hand to bypass a failed migration.

See the [UCS user guide](../../Platforms/FOSS/Container/UCS/README.md).
