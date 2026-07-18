# Dev: WeKan for Nextcloud — building, publishing to the App Store, and integrations

What must be added to the WeKan GitHub repos so that WeKan's GitHub Actions can build a
**Nextcloud-deployable** WeKan (using WeKan's existing Docker image), how to **publish it
to the Nextcloud App Store**, and what **integrations** are possible (local AI, Deck,
SSO, email, …).

WeKan already publishes public Docker images from release-all.yml's `docker` job —
`wekanteam/wekan`, `quay.io/wekan/wekan`, `ghcr.io/wekan/wekan` — and already ships OIDC
support (`packages/wekan-oidc/`), both of which the Nextcloud paths below build on.

## Remaining steps

> **Status:** the `nextcloud` job **is already wired into `release-all.yml`** — guarded, it
> skips with a `::notice::` until the items below are done, so it never breaks a release.

1. **Create the ExApp repo `wekan/nextcloud`**: `appinfo/info.xml` with the
   `<external-app>` block, the Node **AppAPI-handshake wrapper** (`/heartbeat`, `/enabled`,
   `/init`, `AUTHORIZATION-APP-API` → WeKan user mapping), and a `Dockerfile` (WeKan +
   embedded FerretDB SQLite). See §A1–A3.
2. **Get the app signing certificate**: generate a key + CSR, PR the CSR to
   `nextcloud/app-certificate-requests`, receive `wekan.crt`; then **register** the app at
   `apps.nextcloud.com/developer/apps/new`. See §B2–B3.
3. **Add secrets** `NEXTCLOUD_APP_PRIVATE_KEY`, `NEXTCLOUD_APP_PUBLIC_CRT`,
   `NEXTCLOUD_APPSTORE_TOKEN`; **extend `WEKAN_REPO_TOKEN`** to `wekan/nextcloud`.
4. **Require HaRP** deploy daemon + Nextcloud 30/31+ (WebSocket/DDP) in the app docs; the
   old proxy/Docker-Socket-Proxy can't carry WeKan's realtime.
5. Test-deploy the ExApp on a Nextcloud + HaRP instance: OIDC login, DDP realtime,
   attachments, and an AI `taskprocessing` call.

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

### A1. A new repo: `wekan/nextcloud` (the ExApp)
An ExApp is a Nextcloud app folder + a container:

```
wekan-exapp/
├── appinfo/
│   └── info.xml          # metadata + <external-app> (docker image + routes)
├── ex_app/
│   ├── lib/              # the AppAPI-handshake wrapper (Node) — see A2
│   └── src/              # optional Vue frontend (adds a WeKan TopMenu entry)
└── Dockerfile            # builds the ExApp image (wrapper + WeKan + DB)
```

`appinfo/info.xml` — the distinguishing `<external-app>` block (scopes were removed in
AppAPI 3.2.0; access is per-route via `access_level`):

```xml
<external-app>
    <docker-install>
        <registry>ghcr.io</registry>
        <image>wekan/wekan-exapp</image>
        <image-tag>v10.00</image-tag>
    </docker-install>
    <routes>
        <route>
            <url>.*</url>
            <verb>GET,POST,PUT,DELETE</verb>
            <access_level>USER</access_level>          <!-- PUBLIC | USER | ADMIN -->
            <headers_to_exclude>[]</headers_to_exclude>
            <bruteforce_protection>[401]</bruteforce_protection>
        </route>
    </routes>
</external-app>
```

### A2. The AppAPI-handshake wrapper (the real work — there is no Node ExApp SDK)
On deploy, AppAPI injects env vars (`APP_SECRET`, `APP_ID`, `APP_PORT`, `APP_HOST`,
`NEXTCLOUD_URL`, `APP_PERSISTENT_STORAGE`, …) and drives a lifecycle the container **must**
implement. Add a small Node/Express service (a sidecar, or routes fronting WeKan) that:

1. Serves **`GET /heartbeat`** → `{"status":"ok"}` (unauthenticated; polled up to ~90 s).
2. Handles **`PUT /enabled?enabled=1|0`** → registers/removes the WeKan menu entry,
   returns `{"error":""}`.
3. Optionally **`POST /init`** → returns `{}` immediately, then reports progress `1..100`
   via `PUT /ocs/v1.php/apps/app_api/ex-app/status`.
4. Binds WeKan on `APP_PORT`/`APP_HOST`, stores data under `APP_PERSISTENT_STORAGE`.
5. Trusts Nextcloud-proxied requests via the shared-secret headers
   (`AUTHORIZATION-APP-API` = `base64(userid:secret)`, `EX-APP-ID`, `EX-APP-VERSION`,
   `AA-VERSION`) and **maps the Nextcloud `userid` to a WeKan user** (JIT-provision).
6. To call back into Nextcloud, sends the same `AUTHORIZATION-APP-API` header.

Mirror the contract from the Python skeleton (`nextcloud/app-skeleton-python`) and the
Authentication/Deployment docs (§B). `nc_py_api` supplies this for Python; **Node has no
official SDK**, so it's a small custom service.

### A3. Two hard constraints for WeKan specifically
- **WebSockets/DDP:** WeKan's realtime uses DDP over WebSockets. The **old** AppAPI proxy
  did **not** support WebSockets — you must use the **HaRP** deploy daemon (Nextcloud
  30/31+), which routes directly to the ExApp and supports WebSockets. (The classic
  **Docker Socket Proxy** daemon is deprecated, slated for removal in Nextcloud 35.)
- **Database:** AppAPI deploys a **single image**. WeKan's DB (FerretDB v1 SQLite, or
  MongoDB) must be **bundled inside the ExApp image** (embedded `WEKAN_DB=ferretdb`, as
  the snap does) or provided as an external service the wrapper points at — it can't be a
  second compose service the way UCS does it. Embedding **FerretDB v1 SQLite** (from
  [wekan/FerretDB](https://github.com/wekan/FerretDB)) with data under
  `APP_PERSISTENT_STORAGE` is the clean fit.

### A4. `release-all.yml` — a new `nextcloud` job
After the `docker` job publishes the WeKan image, add a job that:
1. Checks out `wekan/nextcloud` (uses `WEKAN_REPO_TOKEN`).
2. Builds & pushes the **ExApp image** (`ghcr.io/wekan/wekan-exapp:v<version>`) — wrapper
   + WeKan bundle + embedded FerretDB.
3. Regenerates `appinfo/info.xml` with the new `<image-tag>` and `<version>`.
4. **Signs and uploads** the app release to the App Store (§B4).

### A5. Secrets/keys to add (`wekan/wekan`)
| Secret | New/existing | What it is |
|---|---|---|
| `NEXTCLOUD_APP_PRIVATE_KEY` | **new** | The app signing **private key** (`APP_ID.key`) |
| `NEXTCLOUD_APP_PUBLIC_CRT` | **new** | The Nextcloud-issued **certificate** (`APP_ID.crt`) |
| `NEXTCLOUD_APPSTORE_TOKEN` | **new** | App Store developer API token (upload releases) |
| `WEKAN_REPO_TOKEN` | **extend** | Add `wekan/nextcloud` to its repo scope |
| `GHCR_AUTH`/`DOCKERHUB_AUTH` | existing | Already push WeKan images; reuse for the ExApp image |

---

## B. Publishing an app to the Nextcloud App Store (files, build, publish, docs)

Same store (apps.nextcloud.com) for both tracks; an ExApp just adds the `<external-app>`
block and references a container image instead of shipping PHP.

### B1. Files to create
- **`appinfo/info.xml`** — mandatory: `<id>` (= folder name), `<name lang="en">`,
  `<description lang="en">` (Markdown ok), `<version>` (semver), `<licence>` (SPDX,
  British spelling), `<author>`, `<bugs>` (tracker URL),
  `<dependencies><nextcloud min-version="30" max-version="35"/></dependencies>`.
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

- [ ] New repo `wekan/nextcloud` (ExApp): `appinfo/info.xml` + `<external-app>`, Node
      AppAPI-handshake wrapper, Dockerfile (WeKan + embedded FerretDB SQLite)
- [ ] Obtain the app **signing certificate** (PR to `nextcloud/app-certificate-requests`)
      and **register** the app at apps.nextcloud.com
- [ ] Add secrets `NEXTCLOUD_APP_PRIVATE_KEY`, `NEXTCLOUD_APP_PUBLIC_CRT`,
      `NEXTCLOUD_APPSTORE_TOKEN`; extend `WEKAN_REPO_TOKEN` to `wekan/nextcloud`
- [ ] `release-all.yml`: add the `nextcloud` job (build ExApp image → regenerate
      info.xml → sign → `POST /api/v1/apps/releases`)
- [ ] Require **HaRP** deploy daemon (WebSocket/DDP) and Nextcloud 30/31+ in the docs
- [ ] (Integrations) Document/point WeKan OIDC at Nextcloud `oidc` provider (SSO);
      optionally add Task Processing AI calls and a Deck sync bridge
- [ ] Test: deploy the ExApp on a Nextcloud + HaRP instance; verify login (OIDC),
      realtime (DDP over WebSocket), attachments, and an AI summarize call

## See also

- [UCS.md](UCS.md) — the same "Docker WeKan on a platform + migration" pattern for Univention.
- [Snap-Ondra-Gantt.md](Snap-Ondra-Gantt.md) — the "push to a downstream repo + publish from release-all.yml" pattern.
- [OS/Linux.md](OS/Linux.md) — Docker/Snap/Flatpak in the broader Linux update picture.
