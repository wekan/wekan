# Dev: releasing WeKan to Univention Corporate Server (UCS) from release-all.yml

Based on [docs/Platforms/FOSS/UCS/UCS.md](../../Platforms/FOSS/UCS/UCS.md) and the
[wekan/univention](https://github.com/wekan/univention) app repo.

Goal: from `wekan/wekan`'s **release-all.yml**, also release the **Docker-based UCS App
Center app** for the newest UCS, so UCS users **upgrade from their Update Center**. The
new release must move the app off **WeKan 6.09 + MongoDB 3.x** onto **WeKan 10.x +
FerretDB v1 (SQLite)** (from [wekan/FerretDB](https://github.com/wekan/FerretDB)),
**automatically migrating** the MongoDB 3.x data to FerretDB and the attachments/avatars
to the **filesystem** during the upgrade.

This document lists **what must be added to the WeKan GitHub repos** (secrets, files,
workflow jobs) to make that happen.

## Remaining steps

> **Status:** the `ucs` job **is already wired into `release-all.yml`** — guarded, it skips
> with a `::notice::` until the items below are done. It currently only **bumps the image
> tag** and uploads; the MongoDB 3.x → FerretDB SQLite compose + migration hook still need
> to be written (§2–§4).

1. **Univention App Provider account** with the `wekan` app assigned; get the
   `univention-appcenter-control` CLI (App Provider self-service).
2. **Add secrets** `UNIVENTION_APP_PROVIDER_USER` and `UNIVENTION_APP_PROVIDER_PASSWORD`
   (see "How to add a secret" below). Optionally `UNIVENTION_REGISTRY_AUTH` only if you
   push images yourself instead of letting the App Provider mirror the public image.
3. **Extend `WEKAN_REPO_TOKEN`** to have write access to `wekan/univention`.
4. **Write the FerretDB migration** in `wekan/univention`: the new `component/compose`
   (FerretDB SQLite + `data/files` volume), the migration lifecycle step wrapping the two
   existing `.mjs` scripts, and fix `component/inst` (the MongoDB `mongo` shell is gone
   under FerretDB). See §2–§4.
5. **Finish the upload command** in the `ucs` job — the `univention-appcenter-control
   upload` app-version id / file arguments depend on your App Provider account.
6. Test the upgrade on a UCS VM (6.09/MongoDB 3.x → 10.x/FerretDB): boards, attachments,
   avatars, LDAP login must survive; confirm the new version appears in the Update Center.

**How to add a secret:** GitHub → the `wekan/wekan` repo → **Settings → Secrets and
variables → Actions → New repository secret**; or `gh secret set NAME --repo wekan/wekan`
(paste the value) / `gh secret set NAME --repo wekan/wekan < file`.

---

## 1. How the UCS app works today (baseline)

The [wekan/univention](https://github.com/wekan/univention) repo is the **UCS App
Center app definition** (not the WeKan source). Key files:

- `component/compose` — Docker **Compose v2** with two services:
  - `wekandb`: `docker.software-univention.de/wekan-wekandb:<ver>` running
    `mongod --smallfiles --oplogSize 128` (**old MongoDB 3.x**), data volume
    `/var/lib/univention-appcenter/apps/wekan/data/db`.
  - `wekan`: `docker.software-univention.de/wekan-wekan:<ver>`, `MONGO_URL=mongodb://wekandb:27017/wekan`,
    `ROOT_URL=https://<fqdn>/wekan`, and the full **LDAP** env block wired to UCS LDAP
    (`DEFAULT_AUTHENTICATION_METHOD=ldap`, cert/UCR templating via `@%@…@%@` / `@!@…@!@`).
- `component/inst` — the **join script**: registers the service, writes the Apache
  reverse-proxy vhost (`/wekan` + the sockjs websocket rule), creates `wekan-admin`, and
  seeds default settings via `docker exec -i wekan-db mongo`.
- `component/uinst` — uninstall/unjoin.
- `meta/wekan.meta`, `meta/wekan_*.ini` — App Center metadata (ID `wekan`, categories,
  description) and the versioned `.ini`.
- `meta/*.svg`, `meta/thumbnail_*.png` — logos/screenshots.
- `component/{all,amd64,i386}/Packages*`, `Release*` — the apt component repo metadata.

**Publishing today** is manual: images are copied into Univention's registry
`docker.software-univention.de/` and the app is submitted via the **Univention App
Provider** portal (the maintainer, xet7, did this for the current version).

The WeKan **Docker image** itself is already built and pushed by release-all.yml's
`docker` job (Docker Hub / Quay / GHCR); the migration tooling already exists in the
WeKan bundle:

- [`snap-src/bin/migrate-mongo3-to-ferretdb.mjs`](../../../snap-src/bin/migrate-mongo3-to-ferretdb.mjs)
  — reads a **MongoDB 3.2** DB with the legacy `mongoexport` (the modern driver can't
  connect to 3.2) and inserts into a running **FerretDB**; reassembles CollectionFS
  **GridFS** attachments/avatars straight to the filesystem.
- [`snap-src/bin/migrate-gridfs-to-fs.mjs`](../../../snap-src/bin/migrate-gridfs-to-fs.mjs)
  — moves any remaining GridFS binaries from FerretDB to
  `files/attachments/` + `files/avatars/` and rewrites the path fields.

So the pieces exist — this task is **wiring them into an automatic UCS upgrade**.

---

## 2. Target architecture (WeKan 10.x on UCS)

Replace the two-container MongoDB app with a **FerretDB v1 SQLite** app + filesystem
storage. New `component/compose` (sketch — carries over the whole LDAP/ROOT_URL block
unchanged, only the DB and storage change):

```yaml
version: '2'
services:
  ferretdb:
    image: docker.software-univention.de/wekan-ferretdb:<wekan-version>   # FerretDB v1, SQLite handler
    container_name: wekan-db
    restart: always
    environment:
      - FERRETDB_HANDLER=sqlite
      - FERRETDB_SQLITE_URL=file:/data/db/
    expose: [ "27017" ]
    volumes:
      - /var/lib/univention-appcenter/apps/wekan/data/db:/data/db     # SQLite files

  wekan:
    image: docker.software-univention.de/wekan-wekan:<wekan-version>   # WeKan 10.x
    container_name: wekan-app
    restart: always
    ports: [ "8080:8080" ]
    environment:
      - WRITABLE_PATH=/data
      - MONGO_URL=mongodb://wekandb:27017/wekan       # points at FerretDB
      - ROOT_URL=https://@%@hostname@%@.@%@domainname@%@/wekan
      # … the entire existing LDAP_* / MAIL_* / WITH_API block, unchanged …
    volumes:
      - /var/lib/univention-appcenter/apps/wekan/data/files:/data/files   # attachments + avatars on FS
```

Notes:
- **FerretDB v1 SQLite** speaks the MongoDB wire protocol, so WeKan still uses
  `MONGO_URL`; only the backend container changes. (Alternatively run WeKan with
  `WEKAN_DB=ferretdb` embedded, as the snap does — but a small sidecar keeps the compose
  shape and volume layout closest to today's.)
- **Attachments/avatars → filesystem** via the `data/files` volume (`WRITABLE_PATH`),
  matching what `migrate-gridfs-to-fs.mjs` writes.
- The WeKan image for UCS must contain the **FerretDB v1 binary** (from
  [wekan/FerretDB](https://github.com/wekan/FerretDB) releases, `ferretdb-amd64`) and the
  two migration `.mjs` scripts, OR they live in a dedicated **migration image** (below).

---

## 3. The automatic migration on upgrade (MongoDB 3.x → FerretDB SQLite)

UCS Docker App Center apps support **lifecycle scripts** in the app definition:
`update_available`, `preinst`, `store_data`, `restore_data_before_setup`,
`restore_data_after_setup`, `setup`, `inst` (join), `uinst`. The migration runs as a
one-shot during the version upgrade, before the new `wekan` container serves traffic:

1. **`store_data`** (old version) — already keeps the MongoDB 3.x data at
   `…/apps/wekan/data/db`.
2. **`restore_data_after_setup`** or a dedicated **migration container** (new version):
   1. Start a **temporary MongoDB 3.x** container bound to the old `data/db`
      (`SRC_PORT`), read-only.
   2. Start **FerretDB v1 SQLite** on the new `data/db` (empty).
   3. Run `migrate-mongo3-to-ferretdb.mjs` with
      `MONGO_BIN_DIR`=legacy mongoexport, `SRC_PORT`, `SRC_DB=wekan`,
      `TARGET_MONGO_URL=mongodb://127.0.0.1:<ferretdb-port>/wekan`,
      `FILES_DIR=…/data/files` → text + GridFS files migrated; progress served on
      `MIGRATION_PORT`.
   4. Run `migrate-gridfs-to-fs.mjs` (`SOURCE_MONGO_URL`=FerretDB, `WRITABLE_PATH=…/data`)
      to move any remaining GridFS binaries to `files/attachments` + `files/avatars`.
   5. On success, **stop and discard** the temporary MongoDB container; keep the old
      `data/db.mongo/` as a backup for one release (safety), then prune.
3. **New compose starts** WeKan 10.x + FerretDB SQLite. WeKan's own **schema migrations**
   run on first boot (the migration scripts intentionally leave schema as-is).

Because the migration reuses the exact scripts the snap already ships, the UCS path
should be a thin wrapper (a `migrate` shell entrypoint that sets the env above and calls
the two `.mjs` in order) — package it as a **`wekan-migrate` image** referenced only by
the upgrade step, or bake it into the WeKan image.

---

## 4. What to add to the WeKan GitHub repos

### 4a. `wekan/univention` (the app definition)
- New **`component/compose`** (FerretDB SQLite + `data/files`, §2).
- **Lifecycle/migration scripts**: a `restore_data_after_setup` (or `update_available` +
  a migration container) implementing §3, plus the `migrate` wrapper that calls the two
  `.mjs` scripts.
- Updated **`meta/wekan_<newstamp>.ini`** / `meta/wekan.meta` (new version, "requires
  data migration" note, min UCS version).
- Update **`component/inst`**: the default-settings seeding currently does
  `docker exec -i wekan-db mongo …` — MongoDB 3.x `mongo` shell is gone under FerretDB;
  replace with a `mongosh`/FerretDB-compatible call or a WeKan REST/settings call.

### 4b. `wekan/wekan` (`release-all.yml`)
Add a **`ucs`** job (after the `docker` job that publishes the WeKan image) that:
1. Checks out `wekan/univention` (using `WEKAN_REPO_TOKEN`, see §5).
2. Regenerates `component/compose` and the `.ini` with the **new release version** and
   the new image tags (FerretDB SQLite + files volume).
3. Commits/pushes those to `wekan/univention`.
4. **Publishes to the Univention App Provider** with `univention-appcenter-control`
   (upload the app version + component + logos), authenticating with the App Provider
   credentials (§5). Univention then mirrors the referenced public WeKan/FerretDB Docker
   images into `docker.software-univention.de/` and the new version appears in users'
   **App Center / Update Center**.

### 4c. `wekan/FerretDB`
- Ensure a **FerretDB v1 binary/image** for the UCS arch (amd64 at least) is published on
  each release (`ferretdb-amd64` already is) so §2's `ferretdb` image / the WeKan image's
  embedded binary can be built from it.

---

## 5. GitHub secrets / keys to add (`wekan/wekan`)

| Secret | New or existing | What it is | Why |
|---|---|---|---|
| **`UNIVENTION_APP_PROVIDER_USER`** | **new** | Univention App Provider account (email/username) | Authenticate `univention-appcenter-control` to upload the app version. |
| **`UNIVENTION_APP_PROVIDER_PASSWORD`** | **new** | App Provider password or API token | Same. |
| **`UNIVENTION_REGISTRY_AUTH`** | **new, only if pushing images yourself** | Credentials for `docker.software-univention.de` | Only if you push WeKan/FerretDB images directly instead of letting the App Provider mirror public images. Usually **not needed** — Univention mirrors public Docker Hub/GHCR images at ingestion. |
| **`WEKAN_REPO_TOKEN`** | **extend existing** | GitHub PAT with write to other `wekan/*` repos | Add `wekan/univention` to its scope so the `ucs` job can push the regenerated compose/meta. |

No new Docker Hub/Quay/GHCR secrets are needed — the WeKan image is already published by
the existing `docker` job (`DOCKERHUB_AUTH`/`QUAY_AUTH`/`GHCR_AUTH`), and Univention pulls
the public image.

> **App Provider access:** the account must be a registered **Univention App Provider**
> with the `wekan` app assigned. `univention-appcenter-control` (from the
> `univention-appcenter-dev` tools) is the CLI that uploads app versions; get it and the
> account from https://www.univention.com/products/univention-app-center/ (App Provider
> self-service).

---

## 6. Migration env → script mapping (reference)

| Step | Script | Key env |
|---|---|---|
| Mongo 3.x → FerretDB (text + GridFS) | `migrate-mongo3-to-ferretdb.mjs` | `MONGO_BIN_DIR`, `MONGO_LIB`, `SRC_PORT`, `SRC_DB=wekan`, `TARGET_MONGO_URL`, `FILES_DIR`, `MIGRATION_PORT` |
| Remaining GridFS → filesystem | `migrate-gridfs-to-fs.mjs` | `SOURCE_MONGO_URL` (FerretDB), `WRITABLE_PATH` (→ `files/attachments`, `files/avatars`) |

Both are re-runnable/idempotent (skip files already at destination), so a retried upgrade
is safe.

---

## 7. Checklist

- [ ] Register/obtain a **Univention App Provider** account with the `wekan` app assigned
- [ ] Add secrets `UNIVENTION_APP_PROVIDER_USER` / `UNIVENTION_APP_PROVIDER_PASSWORD`
      (and `UNIVENTION_REGISTRY_AUTH` only if pushing images yourself)
- [ ] Extend `WEKAN_REPO_TOKEN` scope to include `wekan/univention`
- [ ] `wekan/FerretDB`: publish the FerretDB v1 SQLite binary/image per release (done for amd64)
- [ ] `wekan/univention`: new FerretDB-SQLite `component/compose` + `data/files` volume
- [ ] `wekan/univention`: migration lifecycle step wrapping the two `.mjs` scripts (§3)
- [ ] `wekan/univention`: fix `component/inst` default-settings seeding (no MongoDB `mongo` shell)
- [ ] `release-all.yml`: add the `ucs` job (regenerate + push app, upload via
      `univention-appcenter-control`) (§4b)
- [ ] Test upgrade on a UCS VM: WeKan 6.09/MongoDB 3.x → 10.x/FerretDB; verify boards,
      attachments, avatars, and LDAP login survive
- [ ] Confirm the new version appears in the UCS **App Center / Update Center**

## See also

- [docs/Platforms/FOSS/UCS/UCS.md](../../Platforms/FOSS/UCS/UCS.md) — the user-facing UCS page.
- [Snap-Core.md](Forks/Snap-Core.md) — the snap build that already runs the same MongoDB→FerretDB migration.
- [Snap-Ondra-Gantt.md](Snap-Ondra-Gantt.md) — the same "push to a downstream repo + publish"
  pattern for variant snaps.
- [Linux.md](OS/Linux.md) — Docker in the broader Linux update picture.
