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
compose file. Both services use the versioned WeKan image; the database service
runs its bundled `/build/ferretdb`, not the app entrypoint.

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

Inspect the result and verify that the selected WeKan image has the executable
`/build/ferretdb`, Node, and the modern MongoDB driver under the bundle's
`programs/server` tree. The helper copies the Docker CLI from `docker:27.5.1-cli`;
verify it can communicate with Docker on each supported UCS version.

Publish the tested helper image to the registry referenced by `component/preinst`,
or arrange for Univention to mirror it. If the registry changes, update **both**
image references in `preinst` as well as the image references in `compose` and the
helper's `WEKAN_IMAGE` build argument. The portal cannot perform the migration
until the helper image exists and is pullable by the UCS host.

Keep tags fixed per UCS release. For a release after 12.28, update `compose`,
`preinst`, and the helper Dockerfile together, rebuild the helper, then test that
release. Do not replace these pins with `latest` during a database migration.

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
  `wekan-db` run for this app. `wekan-db` must run `/build/ferretdb`; neither
  `wekan-ucs-migration` nor `wekan-ucs-migration-db` may remain.
- Exercise rollback on the test VM using the saved rendered compose and retained
  MongoDB directory. Record the steps for the UCS version being released.

Local validation so far covers shell/JavaScript syntax and isolated mocked-Docker
regression tests. **No real Docker image build, UCS portal upgrade, database copy,
LDAP/browser test or reboot test has been run in this development environment.**
Do not approve the production release on the strength of the mocked tests alone.

### 4. Finish release automation before relying on it

The `ucs` job already exists in
[release-all.yml](../../../.github/workflows/release-all.yml), but it is incomplete:

- Its tag replacement matches the old `wekan-wekan:` image name, not the new
  GHCR references. It must update the app and migration-helper versions together.
- It does not build or publish `wekan-ucs-migration`.
- It calls `univention/releases/fetch.sh`, which is absent from the companion
  repository. Fetch the official Provider Portal CLI using a valid helper/path.
- It only prints an intended upload; it does **not** execute it. Implement app
  version creation and the explicit file uploads using the real UCS section and
  app identifier, for example `5.2/wekan=12.28` if that is the tested target.
- The job has `continue-on-error: true`; a successful overall GitHub release does
  not prove a UCS version was published or accepted.

Configure `UNIVENTION_APP_PROVIDER_USER` and `UNIVENTION_APP_PROVIDER_PASSWORD` in
GitHub Actions, and give `WEKAN_REPO_TOKEN` access to `wekan/univention`. Configure
registry publishing credentials for the helper if the chosen release mechanism
needs them. `UNIVENTION_REGISTRY_AUTH` is needed only if your publishing arrangement
requires authenticated writes to Univention's registry. Do not commit credentials.

Get the official CLI and account-specific upload commands from the
[Provider Portal upload documentation](https://docs.software-univention.de/app-center/5.2/en/lifecycle.html#app-provider-portal-upload-interface).
First release manually through the Test App Center if necessary; automation is
not a substitute for migration acceptance testing.

### 5. Obtain release approval and verify availability

After the VM upgrade and rollback tests pass, approve the tested app version in
the Provider Portal and coordinate Univention's approval/mirroring. Verify that
an ordinary production UCS installation offers the new version and that its
Upgrade action performs the migration automatically. Until then, describe 12.28
as the **prepared UCS upgrade**, not as already available in the production catalog.

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
