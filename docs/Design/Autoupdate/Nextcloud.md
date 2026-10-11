# Dev: WeKan for Nextcloud — building, publishing to the App Store, and integrations

What must be added to the WeKan GitHub repos so that WeKan's GitHub Actions can build a
**Nextcloud-deployable** WeKan (using WeKan's existing Docker image), how to **publish it
to the Nextcloud App Store**, and what **integrations** are possible (local AI, Deck,
SSO, email, …).

WeKan already publishes public Docker images from release-all.yml's `docker` job —
`wekanteam/wekan`, `quay.io/wekan/wekan`, `ghcr.io/wekan/wekan` — and already ships OIDC
support (`packages/wekan-oidc/`), both of which the Nextcloud paths below build on.

## Remaining steps

> **Status:** the ExApp implementation is now in `wekan/nextcloud` (local checkout
> `.tools/nextcloud`), with opt-in Nextcloud authentication in WeKan. Local HTTP,
> WebSocket, lifecycle and account-isolation tests pass. Docker builds and a live
> Nextcloud/HaRP deployment have not yet been verified. The standalone
> [nextcloud.yml](../../../.github/workflows/nextcloud.yml) runs only manually.

1. **Publish a new WeKan image containing this integration.** The ExApp Dockerfile
   and workflow require `/build/nextcloud-exapp-capability.json` and the bundled
   FerretDB binary. An older image cannot acquire the Meteor authentication code
   merely by wrapping it. Then publish the companion repository changes.
2. **Test the image with Nextcloud 32–35, AppAPI and HaRP.** Verify two users,
   explicit administrator IDs, private boards, WebSocket reconnect, attachments,
   avatars, disable/re-enable, restart, volume-preserving upgrade and restore.
   Support for that version range is declared but still needs live validation.
3. **Get the app signing certificate** for app ID `wekan`, register it with the
   App Store, and add `NEXTCLOUD_APP_PRIVATE_KEY`, `NEXTCLOUD_APP_PUBLIC_CRT`,
   `NEXTCLOUD_APPSTORE_TOKEN`, `GHCR_AUTH`, and `WEKAN_REPO_TOKEN` with read access
   to `wekan/nextcloud`.
4. **Run `nextcloud.yml` separately** with the published WeKan version. It tests
   the companion, builds amd64/arm64 ExApp images, signs the archive and submits it.
   Neither `release-all.yml` nor `release-all-missing.yml` calls this workflow.

**How to add a secret:** GitHub → the `wekan/wekan` repo → **Settings → Secrets and
variables → Actions → New repository secret**; or `gh secret set NAME --repo wekan/wekan`
(paste the value) / `gh secret set NAME --repo wekan/wekan < file`. For the private key:
`gh secret set NEXTCLOUD_APP_PRIVATE_KEY --repo wekan/wekan < ~/.nextcloud/certificates/wekan.key`.

---

## 0. Two ways to ship on Nextcloud — and which one fits WeKan

| Track | What it is | Runtime | Fits WeKan? |
|---|---|---|---|
| **Classic App Store app** | PHP app running **inside** the Nextcloud process | Nextcloud PHP | ❌ WeKan is Meteor/Node — can't run in PHP |
| **External App (ExApp) via AppAPI** | App backend runs as an **external Docker container**, managed by Nextcloud's **AppAPI** and a **Deploy Daemon** | any language / Docker | ✅ **This is WeKan's path** — it already has a Docker image |

**Key reality check:** AppAPI is **not a generic reverse proxy**. WeKan's current image
**will not deploy as-is** — the container must implement the **AppAPI handshake**. So
"use the WeKan Docker image at Nextcloud" means: build a thin **ExApp wrapper** around it,
add an `appinfo/info.xml` with an `<external-app>` block, and publish that to the App
Store (the image lives in a registry the app references).

---

## A. Building WeKan for Nextcloud (what to add to the repos)

### A1. Companion repository implementation

`.tools/nextcloud` is the checkout of `wekan/nextcloud`:

```text
appinfo/info.xml       App Store metadata, USER routes and admin-ID setting
ex_app/gateway.mjs     AppAPI lifecycle, navigation, authenticated HTTP/WebSocket proxy
ex_app/start.mjs       persistent storage, privilege drop, HaRP and process supervision
Dockerfile            selected WeKan image plus the HaRP FRP client
tests/gateway.test.mjs HTTP/WebSocket, authentication and lifecycle regression tests
README.md             build, pre-store installation, storage and validation steps
```

The metadata requires Nextcloud 32–35 and a HaRP deploy daemon. `NEXTCLOUD_ADMIN_USERS`
is a JSON array of exact Nextcloud IDs, for example `["admin"]`. Empty means no
WeKan site administrators. A first visitor does not automatically become an admin. Set
`WEKAN_PUBLIC_URL` to the browser-visible HaRP URL ending in `/exapps/wekan/` if
the deploy daemon's `NEXTCLOUD_URL` is only an internal callback address.

### A2. Nextcloud sign-in and lifecycle

The gateway checks AppAPI's shared-secret headers on HTTP and WebSocket requests.
It replaces incoming identity headers with a signature made using a random key
known only to the gateway and the child WeKan process. WeKan's opt-in
`server/nextcloud.js` login handler reads the identity from the DDP connection,
not from user-supplied login arguments. Resume tokens cannot switch to another
Nextcloud user's account. Accounts are isolated by Nextcloud URL and user ID;
no username/email matching is used. The normal disabled-user check still applies.
HTTP file requests use the same identity. Other WeKan deployments are unaffected
unless `NEXTCLOUD_EXAPP=true` is explicitly set.

`GET /heartbeat` responds immediately while the app starts. System-authenticated
`POST /init` reports progress to `/ocs/v1.php/apps/app_api/ex-app/status` once
WeKan's capability/health endpoint is ready. `PUT /enabled` registers/removes the
menu and its navigation script; disabling also closes active WebSocket tunnels.
The menu opens the WeKan app through HaRP under `/exapps/wekan/`.

All app routes require a Nextcloud user. Anonymous WeKan sharing outside
Nextcloud is not available through this package. OIDC is still an option for a
separately hosted WeKan, but is not required for this ExApp's sign-in.

### A3. Container and persistent SQLite storage

One AppAPI container contains three supervised services: the gateway, WeKan and
FerretDB v1 SQLite. It uses the FerretDB binary already included in the selected
WeKan image. WeKan and FerretDB listen only on loopback ports. An FRP child is
started for HaRP tunnel mode; direct-connect mode uses `APP_HOST`/`APP_PORT`.
The launcher initializes volume ownership as root, then drops to the WeKan UID.
No Docker socket mount or privileged container is required.

`WRITABLE_PATH=$APP_PERSISTENT_STORAGE/wekan`, with sibling directories
`files/db`, `files/attachments`, and `files/avatars`. Keep the whole persistent
volume across upgrades. Back it up with the container stopped and verify restore.
This package installs a new instance; migration from another WeKan deployment is
not automatic. SQLite recovery procedures for other packaging formats are not
invoked by this launcher.

The old Docker Socket Proxy path is not supported: WeKan needs HaRP WebSockets.
See the companion README for `occ app_api:app:register` test-install instructions.

### A4. Standalone `nextcloud.yml` publishing workflow

[nextcloud.yml](../../../.github/workflows/nextcloud.yml) is started separately
from GitHub Actions **Run workflow** or the command below, after the selected
WeKan release and Docker image exist. To retry a failed publication, run it again
with the same version:

```sh
gh workflow run nextcloud.yml -f version=12.28
```

The standalone job checks the upstream GitHub release and App Store catalog, skips an
already-published app version, and builds only a missing versioned ExApp image.
Metadata uses a three-part app version (`12.28.0` for WeKan `12.28`) and image tag
`v12.28`. An existing release tarball is reused instead of overwritten. Git
metadata and temporary files are excluded from new tarballs; the signing key is
stored outside the package and cleaned up afterward. The certificate verifies
the signature before the App Store request. A rejected request fails the job.

Neither the companion branch nor the image's `latest` tag is changed: completing
an older release must not roll back a newer version. The signing certificate must
already be registered with the App Store; the workflow does not register or
replace certificates. No live signing/publication was exercised during the
implementation; live Nextcloud deployment validation and credentials remain required.

### A5. Secrets/keys to add (`wekan/wekan`)
| Secret | New/existing | What it is |
|---|---|---|
| `NEXTCLOUD_APP_PRIVATE_KEY` | **new** | The app signing **private key** (`APP_ID.key`) |
| `NEXTCLOUD_APP_PUBLIC_CRT` | **new** | The Nextcloud-issued **certificate** (`APP_ID.crt`) |
| `NEXTCLOUD_APPSTORE_TOKEN` | **new** | App Store developer API token (upload releases) |
| `WEKAN_REPO_TOKEN` | **extend** | Add `wekan/nextcloud` to its repo scope |
| `GHCR_AUTH` | existing | Base64-encoded `username:token` permitted to publish the ExApp image to GHCR |

---

## B. Publishing an app to the Nextcloud App Store (files, build, publish, docs)

Same store (apps.nextcloud.com) for both tracks; an ExApp just adds the `<external-app>`
block and references a container image instead of shipping PHP.

### B1. Files to create
- **`appinfo/info.xml`** — mandatory: `<id>` (= folder name), `<name lang="en">`,
  `<description lang="en">` (Markdown ok), `<version>` (semver), `<licence>` (SPDX,
  British spelling), `<author>`, `<bugs>` (tracker URL),
  `<dependencies><nextcloud min-version="32" max-version="35"/></dependencies>`.
  Optional: `<summary>`, `<category>` (e.g. `organization`, `tools`, `integration`,
  `workflow`, `ai`), `<screenshot>` (HTTPS), `<website>`, `<repository>`, `<donation>`.
  For an ExApp, add the `<external-app>` block (§A1).
- **ExApp only:** `ex_app/` (backend + optional Vue frontend) and a **`Dockerfile`**.

### B2. Get a signing certificate (one-time)
```sh
mkdir -p ~/.nextcloud/certificates && cd ~/.nextcloud/certificates
openssl req -nodes -newkey rsa:4096 -keyout APP_ID.key -out APP_ID.csr -subj "/CN=APP_ID"
```
Submit `APP_ID.csr` as a PR to **`nextcloud/app-certificate-requests`**; when merged you
receive `APP_ID.crt`.

### B3. Register the app
At `https://apps.nextcloud.com/developer/apps/new`, providing the public cert and a
signature over the app id:
```sh
echo -n "APP_ID" | openssl dgst -sha512 -sign ~/.nextcloud/certificates/APP_ID.key | openssl base64
```

### B4. Build, sign, and upload a release
1. Package the app folder as `.tar.gz` (must contain `appinfo/info.xml`). **`krankerl`**
   automates packaging/signing.
2. Sign the tarball:
   ```sh
   openssl dgst -sha512 -sign ~/.nextcloud/certificates/APP_ID.key app.tar.gz | openssl base64
   ```
3. Upload — the store **fetches a download URL** (not a multipart upload):
   ```
   POST https://apps.nextcloud.com/api/v1/apps/releases
   { "download": "https://…/app.tar.gz", "signature": "<base64>", "nightly": false }
   ```
   A pre-release id in the version (e.g. `-alpha.1`) → **beta** channel; `nightly:true` →
   **nightly**.
4. **CI:** the documented GitHub Actions path uses **`R0Wi/nextcloud-appstore-push-action`**
   with secrets `APP_PRIVATE_KEY`, `APP_PUBLIC_CRT`, `APPSTORE_TOKEN` (community
   alternative: `skjnldsv/publish-nextcloud-app`).

### B5. Documentation (verified)
| Topic | URL |
|---|---|
| AppAPI & External Apps (admin) | https://docs.nextcloud.com/server/latest/admin_manual/exapps_management/AppAPIAndExternalApps.html |
| Managing Deploy Daemons | https://docs.nextcloud.com/server/latest/admin_manual/exapps_management/ManagingDeployDaemons.html |
| Deploy Configurations (HaRP/DSP) | https://docs.nextcloud.com/server/latest/admin_manual/exapps_management/DeployConfigurations.html |
| ExApp Overview (dev) | https://docs.nextcloud.com/server/latest/developer_manual/exapp_development/development_overview/ExAppOverview.html |
| Deployment (`/heartbeat`, `/init`, env vars) | https://docs.nextcloud.com/server/latest/developer_manual/exapp_development/tech_details/Deployment.html |
| Authentication (`AUTHORIZATION-APP-API`) | https://docs.nextcloud.com/server/latest/developer_manual/exapp_development/tech_details/Authentication.html |
| Routes (`info.xml <routes>`) | https://docs.nextcloud.com/server/latest/developer_manual/exapp_development/tech_details/api/routes.html |
| AppAPI source | https://github.com/nextcloud/app_api |
| HaRP daemon | https://github.com/nextcloud/HaRP |
| Python skeleton ExApp | https://github.com/nextcloud/app-skeleton-python |
| nc_py_api (Python framework) | https://github.com/cloud-py-api/nc_py_api |
| App Store Developer Guide | https://nextcloudappstore.readthedocs.io/en/latest/developer.html |
| Code signing | https://docs.nextcloud.com/server/latest/developer_manual/app_publishing_maintenance/code_signing.html |
| Publishing rules | https://docs.nextcloud.com/server/latest/developer_manual/app_publishing_maintenance/publishing.html |
| Release automation (GitHub Actions) | https://docs.nextcloud.com/server/latest/developer_manual/app_publishing_maintenance/release_automation.html |
| krankerl CLI | https://github.com/ChristophWurst/krankerl |
| app-certificate-requests | https://github.com/nextcloud/app-certificate-requests |
| Release upload API | https://apps.nextcloud.com/api/v1/apps/releases |

---

## C. Integrations possible on the Nextcloud platform

Two integration modes, and the distinction matters:

- **WeKan as an outbound OCS API client** (works today, WeKan stays external, no ExApp
  needed): AI, Deck, Provisioning, WebDAV/CalDAV.
- **In-Nextcloud UI surfaces** (need a companion app / ExApp running inside Nextcloud):
  Dashboard, Unified Search, Notifications, Talk bots, Flow.

### C1. Using Nextcloud local AI in WeKan — **achievable today, no ExApp required**
Since Nextcloud 30, the **Task Processing API** is the single unified AI entry point
(it supersedes the old Text Processing / Text-To-Image / Speech-To-Text APIs). It is
exposed over **OCS**, so WeKan's server can call it as an authenticated client:

```
POST /ocs/v2.php/taskprocessing/schedule
Headers: OCS-APIRequest: true ; Basic auth (user + app password)
Body: {"type":"core:text2text:summary","input":{...},"appId":"wekan"}
```
then poll for the result. The model runs **on the Nextcloud side** via a backend:
- **`llm2`** — fully local LLMs via llama.cpp (any GGUF model); rates **Green** on
  Nextcloud's Ethical AI rating.
- **`integration_openai`** — any OpenAI-compatible engine (**LocalAI**, Ollama, vLLM…).
- **Context Chat** — RAG over the user's Nextcloud files.

Useful task types for cards: `core:text2text` (draft a description), `…:summary`
(summarize comments), `…:headline` (suggest a title), `…:translate`.

> WeKan does **not** need to be an ExApp to *use* the AI — it only needs an app-password
> and OCS. (Registering as an ExApp AI *provider* is a different, much larger thing and
> is not required here.)

### C2. Integration matrix

| Feature | Nextcloud mechanism | How WeKan uses it | Doc |
|---|---|---|---|
| **Local AI** | Task Processing API over OCS (`/ocs/v2.php/taskprocessing/schedule`), backend llm2/LocalAI | WeKan server summarizes/generates/translates card text | https://docs.nextcloud.com/server/stable/developer_manual/client_apis/OCS/ocs-taskprocessing-api.html |
| **Kanban interop (Deck)** | Deck REST/OCS API `/ocs/v2.php/apps/deck/api/v1.0/` | Import/sync Deck boards↔WeKan (Deck stacks→WeKan lists, cards→cards) | https://deck.readthedocs.io/en/latest/API/ |
| **SSO / login** | `user_oidc` (NC as OIDC client) or the `oidc` provider app (NC as IdP); LDAP; SAML | **WeKan already has OIDC** (`packages/wekan-oidc/`) — point it at Nextcloud's `oidc` provider for zero-code SSO | https://github.com/nextcloud/user_oidc |
| **User/group provisioning** | OCS Provisioning API `/ocs/v1.php/cloud/users` | Mirror Nextcloud users/groups into WeKan (JIT alongside OIDC) | https://docs.nextcloud.com/server/stable/admin_manual/configuration_user/user_provisioning_api.html |
| **Embed WeKan in NC UI** | **External Sites** app (iframe menu entry) | Add a "WeKan" top-menu item loading WeKan in an iframe (relax WeKan's `X-Frame-Options`/CSP for the NC origin) | https://docs.nextcloud.com/server/stable/admin_manual/configuration_server/external_sites.html |
| **Files** | WebDAV `/remote.php/dav/files/USER/` | Attach/pull Nextcloud files onto cards | https://docs.nextcloud.com/server/stable/developer_manual/client_apis/WebDAV/index.html |
| **Calendar / due dates** | CalDAV `/remote.php/dav/` | Publish card due dates as a CalDAV calendar | https://docs.nextcloud.com/server/stable/developer_manual/client_apis/WebDAV/index.html |
| **Email** | Nextcloud **Mail** app (IMAP/SMTP client) + server SMTP | WeKan sends its own SMTP mail; NC Mail is a separate mailbox, not a relay WeKan drives | https://apps.nextcloud.com/apps/mail |
| **Dashboard / Search / Notifications / Talk bots / Flow** | Dashboard widget, Unified Search, Notifications, Talk bot, Flow APIs | Require an in-Nextcloud **companion app/ExApp** — not reachable from external WeKan by REST alone | https://docs.nextcloud.com/server/stable/developer_manual/ |

**Honest caveats:** SSO (OIDC) is the strongest, zero-code win. AI, Deck, Provisioning,
WebDAV/CalDAV work from external WeKan via REST. A Deck↔WeKan bridge is feasible but must
be built (none is maintained). Dashboard/Search/Notifications/Talk/Flow assume code
running *inside* Nextcloud.

---

## D. Comparison: kanban / project software for Nextcloud

| App | Type | Kanban features | API | AI | License | URL |
|---|---|---|---|---|---|---|
| **Deck** | Built-in native (PHP) | Full: boards, stacks, cards, labels, due dates, assignees, checklists, attachments, comments, sharing | Deck REST/OCS API; CalDAV for dates | Yes (in-platform Assistant/Task Processing) | AGPL-3.0 | https://apps.nextcloud.com/apps/deck |
| **Nextcloud Tables** | Built-in native | Kanban-*ish* views over a no-code database; not true drag-drop stacks | Tables REST API v1/v2 | Via platform Assistant | AGPL-3.0 | https://apps.nextcloud.com/apps/tables |
| **WeKan** | External (Meteor/Node) / ExApp | Full Trello-like: swimlanes, WIP limits, custom fields, rules, subtasks, templates — richer boards than Deck | Own REST API; consumes NC OCS APIs as a client | Can call NC Task Processing API as an OCS client (§C1) | MIT | https://github.com/wekan/wekan |
| Kanboard / Planka / Focalboard | External | Full kanban, own stacks | Own APIs | varies | varies (OSS) | integrate via SSO/iframe only |

**Bottom line:** **Deck is the only native, first-party kanban** for Nextcloud. Tables
offers board-like views but is a database app. Everything genuinely kanban (WeKan,
Kanboard, Planka, Focalboard) is a **separate app** that *integrates with* Nextcloud
(SSO/OIDC, iframe embed, OCS calls) rather than running as a native NC app.

---

## E. Checklist

- [x] Companion implementation `wekan/nextcloud` (ExApp): `appinfo/info.xml` + `<external-app>`, Node
      AppAPI-handshake wrapper, Dockerfile (WeKan + embedded FerretDB SQLite)
- [ ] Obtain the app **signing certificate** (PR to `nextcloud/app-certificate-requests`)
      and **register** the app at apps.nextcloud.com
- [ ] Add secrets `NEXTCLOUD_APP_PRIVATE_KEY`, `NEXTCLOUD_APP_PUBLIC_CRT`,
      `NEXTCLOUD_APPSTORE_TOKEN`; extend `WEKAN_REPO_TOKEN` to `wekan/nextcloud`
- [ ] Run `nextcloud.yml` separately for the selected published WeKan version
      (build ExApp image → regenerate info.xml → sign → `POST /api/v1/apps/releases`)
- [x] Require **HaRP** deploy daemon (WebSocket/DDP) and Nextcloud 32–35 in the docs
- [ ] (Integrations) Document/point WeKan OIDC at Nextcloud `oidc` provider (SSO);
      optionally add Task Processing AI calls and a Deck sync bridge
- [ ] Test: deploy the ExApp on a Nextcloud + HaRP instance; verify Nextcloud sign-in,
      realtime (DDP over WebSocket), attachments, avatars, restart and volume retention

## See also

- [UCS.md](UCS.md) — the same "Docker WeKan on a platform + migration" pattern for Univention.
- [Snap-Ondra-Gantt.md](Snap-Ondra-Gantt.md) — the "push to a downstream repo + publish from release-all.yml" pattern.
- [OS/Linux.md](OS/Linux.md) — Docker/Snap/Flatpak in the broader Linux update picture.

## Local and deployment validation

Run the main repository's `tests/nextcloudIdentity.test.cjs` and
`tests/nextcloudLogin.test.cjs`, plus the companion's `tests/gateway.test.mjs`.
The latter uses real local HTTP and WebSocket connections against a test backend.
It is not a live Meteor, FerretDB or Nextcloud test.

For the registered browser suite, save a signed-in **test** Nextcloud session as a
Playwright storage-state file outside git, then run from `tests/playwright`:

```sh
WEKAN_BASE_URL=https://cloud.example \
WEKAN_NEXTCLOUD_URL=https://cloud.example/exapps/wekan/ \
WEKAN_NEXTCLOUD_STORAGE_STATE=/private/path/nextcloud-session.json \
npx playwright test specs/nextcloud.e2e.js --project=chromium
```

Keep that state private; it contains a Nextcloud session. The browser suite checks
sign-in, WebSocket connectivity, reconnect, reload and anonymous-session denial.
Manual deployment checks for files, admin privileges, upgrades and backup restore
remain required. AI, Deck and calendar integrations in section C are possibilities,
not features implemented by this ExApp.
