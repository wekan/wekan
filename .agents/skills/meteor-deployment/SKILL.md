---
name: meteor-deployment
description: >
  Use when deploying a Meteor 3 application. Triggers on meteor build,
  meteor deploy, Galaxy Push to Deploy, Galaxy Mode, Repository Mode,
  DEPLOY_HOSTNAME, Docker, Kubernetes, settings.json, METEOR_SETTINGS,
  MONGO_URL, MONGO_OPLOG_URL, ROOT_URL, PORT, HTTP_FORWARDED_COUNT,
  NODE_OPTIONS, health checks, pre-deploy commands, hot code push,
  --architecture os.linux.x86_64, --server-only, or a deployed Node.js
  version mismatch. Use this skill when the user asks about shipping the app,
  asks about production config, or asks about containerizing. For Cordova
  Android/iOS artifacts, signing, and native HCP compatibility use
  meteor-native; this skill owns the backend deployment.
metadata:
  author: meteor
  kind: knowledge
  meteor: ">=3.0"
  area: ops
  tagline: "Ship Meteor 3 apps to production (meteor build, Galaxy, Docker/Kubernetes, settings.json, env vars, Node version matching)."
  bundle: ["ops"]
  docs_synced_at: "2026-08-26"
license: MIT
---

# Meteor deployment

`meteor build` produces a self-contained Node bundle that runs anywhere
the matching Node.js version runs. Galaxy is the first-party host;
Docker / Kubernetes / SSH-to-a-Node-host all work too.

For Android/iOS artifacts and native HCP compatibility, use `meteor-native`.
Check actual native configuration as well as compatibility hashes: permission
or other native configuration changes can require a new binary with an
unchanged hash.

Match the Node version to the bundled Meteor Node:

| Meteor | Node major |
|---|---|
| 3.0 | 20 |
| 3.1 through 3.4 | 22 |
| 3.5+ | 24 |

Mismatch causes runtime errors. Run `meteor node -v` to confirm.

## Decision flow

1. Galaxy? Choose Git Push to Deploy or the Meteor CLI. Configure Galaxy's
   settings source, build hooks, health checks, and domains from
   `references/galaxy.md`.
2. Docker / Kubernetes? `meteor build --directory ./build --server-only`
   skips platform-specific mobile artifacts. Use
   `--architecture os.linux.x86_64` for a cross-build.
3. SSH to a Node host? Same `meteor build`, scp the bundle, install prod
   deps under `bundle/programs/server`, run `node main.js`.
4. Vercel / Netlify / serverless? Not supported. Meteor needs a
   long-lived Node process with a WebSocket.

## Required environment

| Var               | Purpose                                                      |
|-------------------|--------------------------------------------------------------|
| `ROOT_URL`        | Absolute external URL (e.g. `https://app.example.com`).      |
| `MONGO_URL`       | `mongodb://...` connection string.                           |
| `MONGO_OPLOG_URL` | Optional Mongo replica oplog URL.                       |
| `PORT`            | Listen port. Default 3000.                                   |
| `BIND_IP`         | Network interface. Default 0.0.0.0.                          |
| `METEOR_SETTINGS` | JSON; populates `Meteor.settings`.                           |
| `MAIL_URL`        | SMTP for `Email.send` and account emails.                    |

`ROOT_URL` is the external URL the browser sees, not the cluster-internal
service URL. OAuth redirects, `Meteor.absoluteUrl`, and CSP all rely on
it.

On Meteor 3.0 through 3.4, configure `MONGO_OPLOG_URL` for oplog-backed
reactivity; without it, Meteor polls. Meteor 3.5+ can use core change streams
without that variable and falls back to oplog or polling when needed. Atlas
hosting alone does not add core change-stream support to an older Meteor app.

## `settings.json`

```json
{
  "public": { "appName": "My App", "stripePublishableKey": "pk_live_..." },
  "stripeSecretKey": "sk_live_...",
  "oauthSecretKey": "16-byte-base64==",
  "mailgun": { "apiKey": "..." }
}
```

Top-level keys: server only. `public` subtree: shipped to the client.

Load:

```bash
# dev
meteor run --settings settings.json

# production
METEOR_SETTINGS=$(cat settings.json) node bundle/main.js
```

## Galaxy

Choose one deployment path:

| Path | Use when | Trigger |
|---|---|---|
| Push to Deploy | Galaxy should build a connected GitHub or Bitbucket branch. | Every push to the selected branch. |
| Meteor CLI | A person or CI pipeline controls each upload. | `meteor deploy <app-name>`. |

For a Free app, pass a simple app name, not a custom domain:

```bash
meteor login
meteor deploy myapp --free --settings settings.json

DEPLOY_HOSTNAME=eu-west-1.galaxy-deploy.meteor.com \
  meteor deploy myapp --plan essentials --settings settings.json
```

Galaxy assigns a `myapp.sandbox.galaxycloud.app` hostname on Free or a
regional `myapp.<region>.galaxycloud.app` hostname on paid plans. Add custom
domains in the dashboard. The active primary domain controls `ROOT_URL`.

Galaxy injects `PORT`, `ROOT_URL`, and `METEOR_SETTINGS`. Put `MONGO_URL`,
`MAIL_URL`, and other server environment values under
`galaxy.meteor.com.env` in the Galaxy settings JSON. Do not assume a CLI
`--settings` file overrides Repository Mode.

See `references/galaxy.md` for settings modes, Push to Deploy builds,
zero-downtime rollout and rollback, proxies, Mongo TLS, memory, and custom
base images.

## Docker

See `references/docker.md` for a working multi-stage Dockerfile. Build
the bundle in one stage, install server deps and run in a smaller one.
`--server-only` skips platform-specific mobile application builds, but it
does not omit the browser client or create an API-only bundle. Meteor still
builds the `web.cordova` client target used for hot code push.

## Hot code push

`autoupdate` provides production hot code push. It detects a new client
version over DDP, applies stylesheet-only changes without reloading when
possible, and otherwise performs a full browser reload. Remove `autoupdate`
from `.meteor/packages` to disable HCP.

`hot-module-replacement` is different. It replaces accepted JavaScript
modules during development and falls back to HCP when a module cannot accept
the update. HMR is disabled in production and on unsupported web
architectures. There is no `Meteor.disableClientResourceFetch` switch in the
current public API.

## Anti-patterns

- Commit `settings.json` with production secrets. Use a CI secret store
  or env vars; load with `METEOR_SETTINGS=$(cat ...)` at startup.
- Set `ROOT_URL` to the internal Kubernetes service URL. Use the
  external HTTPS URL or OAuth redirects and `Meteor.absoluteUrl` break.
- Run a Node version that does not match the bundled Meteor Node. Always
  check `meteor node -v`.
- Build on the wrong architecture. M-series Mac developers building for
  x86_64 Linux must pass `--architecture os.linux.x86_64`.
- Commit Galaxy settings with credentials or expect Repository Mode to read a
  CLI `--settings` file. Keep secrets in Galaxy Mode or a secret store.
- Hardcode Galaxy's port, load-balancer IP, or regional DNS target. Read
  `$PORT` and copy current network values from the app dashboard.
- Bundle the source tree into the Docker image alongside the built
  bundle. Use multi-stage; the runtime image holds only `bundle/`.

## See also

- `references/settings-and-env.md`
- `references/galaxy.md`
- `references/docker.md`
- `references/eval-cases.md`
