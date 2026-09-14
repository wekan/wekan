# Galaxy deployment

Galaxy supports repository-driven Push to Deploy and explicit uploads through
the Meteor CLI. Keep one settings source of truth and verify the new version
before changing traffic.

## Choose the deployment path

| Path | Configure | Deployment behavior |
|---|---|---|
| Push to Deploy | Connect GitHub or Bitbucket, select the repository and branch, then set the Meteor root directory and build options. | Every push to the selected branch creates and deploys a version. Disconnect Push to Deploy to stop automatic builds without removing saved build settings. |
| Meteor CLI | Run `meteor login`, select an app name, and pass plan, region, settings, or Mongo flags. | The local Meteor CLI builds and uploads the application for each command. |

Free CLI deployments use a simple app name:

```bash
meteor deploy myapp --free --settings settings.json
```

A domain-form target requests a custom domain and requires a paid plan. Let
Galaxy create `myapp.sandbox.galaxycloud.app` for Free. Paid apps receive a
regional `myapp.<region>.galaxycloud.app` hostname.

Choose a paid region with `DEPLOY_HOSTNAME`:

```bash
DEPLOY_HOSTNAME=eu-west-1.galaxy-deploy.meteor.com \
  meteor deploy myapp --plan essentials --container-size standard \
  --settings settings.json
```

Supported region hosts are `us-east-1`, `eu-west-1`, and
`ap-southeast-2` under `galaxy-deploy.meteor.com`. Free apps deploy in US East.
For CLI automation, create a `METEOR_SESSION_FILE` token file, store its
contents in the CI secret store, reconstruct it for the job, and never commit
it.

```bash
METEOR_SESSION_FILE=token.json meteor login
METEOR_SESSION_FILE=token.json meteor deploy myapp --settings settings.json
```

## Select the settings source

Galaxy consumes one complete settings object:

```json
{
  "galaxy.meteor.com": {
    "env": {
      "MONGO_URL": "mongodb://...",
      "MAIL_URL": "smtp://..."
    }
  },
  "private": {
    "stripeKey": "sk_live_xxx"
  },
  "public": {
    "appName": "My App"
  }
}
```

| Mode | Source of truth | Update rule |
|---|---|---|
| Galaxy Mode | Encrypted JSON stored in Galaxy. Recommended when settings contain secrets. | Dashboard and Meteor CLI write the same store. `meteor deploy --settings` replaces the stored JSON, so the last write wins. Save dashboard edits, then Deploy to apply them. |
| Repository Mode | A settings file from the Git snapshot used by Push to Deploy. Use only for non-sensitive configuration. | Update the configured relative path in Git and push. Galaxy ignores a CLI `--settings` file while this mode is active. |

The Galaxy editor accepts at most 1 MB. Values under
`galaxy.meteor.com.env` become `process.env` variables. `private` is
server-only through `Meteor.settings.private`; `public` is sent to browsers.
Commit a placeholder `settings.example.json`, not credentials. If a secret was
committed, rotate it and remove it from Git history.

## Configure the Push to Deploy build

| Field | Decision |
|---|---|
| Root Directory | Set the path relative to the repository root, such as `apps/web`, when the Meteor app is in a monorepo. |
| Install Command | Default is `meteor npm install`. Use `meteor npm ci` when a committed `package-lock.json` is authoritative. |
| Pre-Deploy Command | Paid plans only. Runs after the build with private-network and environment access. Use it for idempotent migrations. A nonzero exit stops the deployment before new containers go live. |
| Health Check Path | Defaults to `/` and must start with `/`. Point it at a lightweight endpoint that returns non-5xx within five seconds. |
| Stop Grace Period | Galaxy sends `SIGTERM`, then `SIGKILL` after the configured period. Default is 5 seconds and paid plans can raise it to 600. Bound shutdown work by `METEOR_SIGTERM_GRACE_PERIOD_SECONDS`. |

Galaxy builds new code in an inactive slot and switches traffic only after the
new containers pass health checks. New containers receive up to ten minutes to
become healthy. If they do not, Galaxy keeps or restores the previous version.
Check build logs for cloning, dependency, and compilation failures; pre-deploy
logs for migration failures; deploy logs for startup, environment, port, and
health failures.

Galaxy assigns `PORT` dynamically. Do not hardcode 3000 in a custom entrypoint.
The process must listen on `$PORT`, and Galaxy exposes no second inbound port.

## Operate and roll back

A code push creates a version and a deployment. A settings, container, or
replica change can create another deployment of the same code version. Diagnose
them separately:

| Symptom | First evidence |
|---|---|
| Repository build failed | Build logs for clone access, install, dependency, or compilation errors. Reproduce with `meteor build` locally. |
| Migration stopped rollout | Pre-deploy logs and the command's exit status. The previous deployment stays live. |
| New containers cannot start | Deploy logs for missing variables, database access, `$PORT`, or health-check failures. |
| Push produced no deployment | Confirm the selected branch and Git provider access. For Bitbucket, verify the workspace webhook was registered. |
| Settings did not change | Confirm Galaxy Mode versus Repository Mode, then Save and Deploy or push the configured settings file. |

Use Deploy Now to apply saved configuration without a code push. Use Versions >
Redeploy to roll back to a previous code snapshot. Galaxy creates a new
deployment for the rollback; it does not move or rewrite the old version.

## Domains and proxies

Galaxy provides TLS for its own hostnames and managed custom domains. Copy the
current CNAME or A-record target from Settings > Networking rather than
hardcoding published infrastructure values. Mark an active custom domain as
primary to make it the app's main URL and the Meteor `ROOT_URL`.

Galaxy's load balancer is one trusted proxy hop. Configure:

```json
{
  "galaxy.meteor.com": {
    "env": {
      "HTTP_FORWARDED_COUNT": "1"
    }
  }
}
```

Add one for each controlled proxy in front of Galaxy. With Cloudflare plus
Galaxy, use `2`. Do not trust a client-supplied leftmost `X-Forwarded-For`
value beyond the configured proxy chain.

Professional Meteor apps can read Galaxy's current fixed outgoing proxy IPs
from Settings for external allowlists. Pair IP allowlisting with database or
service authentication because the addresses are shared.

## MongoDB on Galaxy

The deployment-time Free MongoDB toggle is for testing and development. It
adds `MONGO_URL`, has no backups, and is tied to the app lifecycle. Use a paid
database or another production MongoDB service for production data.

Galaxy's free shared MongoDB requires its documented certificate bypass:

```json
{
  "packages": {
    "mongo": {
      "options": {
        "tlsAllowInvalidCertificates": true
      }
    }
  }
}
```

Do not carry that bypass to a dedicated database. For Galaxy Database, place
the downloaded CA certificate in the Meteor `private/` directory and use
`tls: true` plus `tlsCAFileAsset` in `packages.mongo.options`. Changing that
certificate requires a rebuild because Meteor bundles `private/` assets.

On Meteor 3.0 through 3.4, place a replica-set `MONGO_OPLOG_URL` under
`galaxy.meteor.com.env` for oplog-backed reactivity. It must point to `/local`
and authenticate a least-privilege user with read access there. Meteor 3.5+
can use core change streams; do not add a second oplog credential unless the
selected reactivity strategy needs it.

## Memory, replicas, and custom base images

Observe per-container CPU and memory before resizing or tuning. Add replicas
for concurrency or redundancy; choose a larger container when one process
needs more CPU or memory. Basic autoscaling on paid plans targets CPU. Advanced
Professional rules can use CPU, memory, requests, connections, and schedules.

Modern Node detects container limits. When measurements show heap pressure and
the container has headroom, set standard Node flags with:

```json
{
  "galaxy.meteor.com": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=1600"
    }
  }
}
```

`GALAXY_NODE_OPTIONS` belongs to the legacy runtime and is ignored on Galaxy
Metal. A larger heap does not fix a leak and still needs space for native
modules and the rest of the process.

Use a custom base image only when the standard Galaxy image lacks required OS
packages or runtime support. The image must:

- Be publicly readable from Docker Hub and contain no secrets.
- Include `/bin/bash` and an executable `/app/setup.sh` with a shell shebang.
- Accept the app tarball URL as the setup script's first argument.
- Use an immutable tag or Git SHA. Pushing a changed `latest` image does not
  deploy it.
- Start through `CMD` or `ENTRYPOINT` and listen on `$PORT`.

Set `galaxy.meteor.com.baseImage.repository` and `.tag` in the Galaxy settings
object. In Push to Deploy with Galaxy Mode, keep that block in the stored JSON.

## Sources

- [Deploy Meteor Apps](https://docs.galaxycloud.app/docs/apps/meteor/push-to-deploy)
- [Meteor CLI](https://docs.galaxycloud.app/docs/apps/meteor/cli)
- [Meteor Reference](https://docs.galaxycloud.app/docs/apps/meteor/meteor-reference)
- [Variables](https://docs.galaxycloud.app/docs/dashboard/apps/variables)
- [Settings](https://docs.galaxycloud.app/docs/dashboard/apps/settings)
- [Container Environment](https://docs.galaxycloud.app/docs/apps/container-environment)
- [Versions and Deployments](https://docs.galaxycloud.app/docs/apps/versions-deployments)
- [Custom Domains](https://docs.galaxycloud.app/docs/apps/custom-domains)
- [Memory Management](https://docs.galaxycloud.app/docs/apps/memory-management)
- [Custom Base Images](https://docs.galaxycloud.app/docs/apps/meteor/custom-base-images)
- [Secrets Management](https://docs.galaxycloud.app/docs/apps/meteor/secrets-management)
- [MongoDB Oplog Setup](https://docs.galaxycloud.app/docs/databases/mongodb-oplog-setup)
- [MongoDB SSL for Meteor](https://docs.galaxycloud.app/docs/databases/mongodb-ssl-meteor)
