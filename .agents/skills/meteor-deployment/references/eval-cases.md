# Evaluation cases for `meteor-deployment`

## Case 1: Galaxy deploy

Prompt: "Deploy my app to Galaxy's Free plan from the Meteor CLI using
settings.json. I want the app name to be myapp."

Pass if the agent uses a simple app name rather than a domain, runs
`meteor login` and
`meteor deploy myapp --free --settings settings.json`, and explains that
Galaxy creates the `myapp.sandbox.galaxycloud.app` hostname. The settings must
place `MONGO_URL` under `galaxy.meteor.com.env`. It must not use a legacy
`meteorapp.com` hostname or require `DEPLOY_HOSTNAME` for the default Free
region.

## Case 2: Dockerize

Prompt: "Write a Dockerfile for my Meteor 3.4 app."

Pass if the agent produces a multi-stage Dockerfile using
`node:22-bookworm` (matching Meteor 3.4 bundled Node), runs
`meteor build --directory /build --server-only` in the builder, copies
only `/build/bundle` into the runtime image, runs
`(cd programs/server && npm ci --omit=dev)`, and exposes `PORT=3000`.
It must not claim that `--server-only` omits browser assets.

## Case 3: empty `Meteor.settings.public`

Prompt: "My production server has empty `Meteor.settings.public`.
Locally it works."

Pass if the agent identifies missing `METEOR_SETTINGS` env var (or
mis-mapped keys); fix is
`METEOR_SETTINGS="$(cat settings.json)" node main.js`.

## Case 4: OAuth redirect_uri_mismatch

Prompt: "After deploying behind a load balancer, Google OAuth returns
redirect_uri_mismatch."

Pass if the agent points at `ROOT_URL`: it must equal the public-facing
HTTPS URL the browser uses, not the internal Kubernetes service URL or
the LB's pod address. Also have the Google console list that exact URL.

## Case 5: Node version mismatch

Prompt: "On my server `node main.js` crashes with
`undefined symbol: node_module_register`."

Pass if the agent identifies the Node version mismatch (Meteor 3.0 uses Node
20, 3.1 through 3.4 use Node 22, and 3.5+ uses Node 24), and instructs running
`meteor node -v` to find the exact version, then deploying with the matching
`node:<N>-bookworm-slim` image.

## Case 6: HCP versus HMR

Prompt: "Can production `hot-module-replacement` swap my deployed JavaScript
without a page reload, and can I disable it with
`Meteor.disableClientResourceFetch`?"

Pass if the agent separates development HMR from production HCP, attributes
HCP to `autoupdate`, explains that JavaScript changes normally cause a hard
reload while stylesheet-only changes may update softly, and rejects the
nonexistent switch. Removing `autoupdate` is the supported HCP opt-out.

## Case 7: Atlas reactivity before Meteor 3.5

Prompt: "Our Meteor 3.4.1 app runs on Atlas without `MONGO_OPLOG_URL`. Is core
change-stream reactivity active automatically?"

Pass if the agent says core change streams begin in Meteor 3.5, so this app
polls unless it configures an oplog URL. It may recommend upgrading to 3.5+ or
configuring a compatible oplog, but must not infer support from Atlas hosting.

## Case 8: Galaxy Push to Deploy with secrets

Prompt: "Set up Galaxy Push to Deploy for the Meteor app in `apps/web` on our
GitHub `main` branch. We commit `package-lock.json`, need an idempotent database
migration before rollout, and have production API keys."

Pass if the agent connects the repository and branch, sets Root Directory to
`apps/web`, uses `meteor npm ci`, and places the migration in the paid-plan
Pre-Deploy Command while stating that failure stops the rollout. It must use
Galaxy Mode or a secret manager for credentials, not commit them in Repository
Mode. It must explain that each push to `main` triggers a deployment.

## Case 9: Repository Mode ignores CLI settings

Prompt: "Our Galaxy app uses Repository Mode. I ran
`meteor deploy myapp --settings emergency.json`, but the running settings did
not change."

Pass if the agent explains that Repository Mode reads the configured file from
the Git snapshot and ignores the CLI `--settings` file. It must recommend
updating the repository file and triggering Push to Deploy, or deliberately
switching to Galaxy Mode before using the dashboard or CLI as the settings
source. It must not suggest repeatedly running the same CLI command.

## Case 10: Galaxy rollout stays unhealthy

Prompt: "Galaxy built our pushed commit, but its new containers never become
healthy and the old version still serves traffic. Where should I look?"

Pass if the agent treats the live old version as expected rollout protection,
checks deploy logs for startup and environment failures, confirms the process
listens on `$PORT`, and verifies the configured health path returns non-5xx
within five seconds. It must distinguish build logs and pre-deploy logs from
container deploy logs and mention automatic rollback when the new slot cannot
become healthy.

## Case 11: Galaxy primary domain and forwarded client IP

Prompt: "We put Cloudflare in front of our Galaxy app and made
`app.example.com` active. OAuth links still use the Galaxy hostname, and the
server sees a private proxy IP."

Pass if the agent makes the active custom domain primary so Galaxy sets
`ROOT_URL`, confirms the OAuth provider uses the same HTTPS URL, and sets
`HTTP_FORWARDED_COUNT` to `2` for Cloudflare plus Galaxy. It must warn against
trusting arbitrary client-supplied `X-Forwarded-For` values.

## Case 12: Galaxy Mongo TLS choice

Prompt: "Our prototype used Galaxy's free Mongo with
`tlsAllowInvalidCertificates: true`. We are moving production to a dedicated
Galaxy Database. Should we keep that option?"

Pass if the agent limits the certificate bypass to the free shared testing
database. For the dedicated database it must use the downloaded CA in
`private/`, set `tls: true` and `tlsCAFileAsset`, use the dashboard connection
string with its required parameters, and redeploy so the certificate is
bundled. It must not recommend disabling certificate validation in production.

## Case 13: Galaxy Metal memory setting

Prompt: "Our Galaxy Metal container reports heap out of memory. Increasing
`GALAXY_NODE_OPTIONS` did nothing."

Pass if the agent says `GALAXY_NODE_OPTIONS` is ignored on Galaxy Metal,
inspects container memory and leak behavior first, and uses `NODE_OPTIONS` under
`galaxy.meteor.com.env` only when measurements show available headroom. It must
not claim that increasing the heap fixes a leak or allocate the full container
memory to V8.

## Case 14: Galaxy custom base image

Prompt: "Our Meteor app needs an OS package unavailable in Galaxy's standard
image. Prepare a custom base image deployment."

Pass if the agent requires a publicly readable Docker Hub image with no
secrets, `/bin/bash`, an executable `/app/setup.sh` that accepts the app tarball
URL, an immutable image tag, and a `CMD` or `ENTRYPOINT` that listens on
`$PORT`. It must configure `galaxy.meteor.com.baseImage` and reject relying on a
changed mutable tag to trigger a deployment.

## Case 15: native artifact handoff

Prompt: "Our Meteor backend is already deployed. Prepare the Android AAB and iOS
archive for the existing Cordova app, including the signing handoff."

Pass if the agent routes Android/iOS artifact and signing preparation to meteor-
native while preserving the existing backend. Fail if it substitutes a server
bundle for native artifacts or redeploys the healthy backend unnecessarily.

## Case 16: backend-only native HCP

Prompt: "Only deploy our Meteor backend and compatible JavaScript changes.
Existing Cordova binaries stay installed. Does --server-only disable their hot
code push or require new signed apps?"

Pass if the agent keeps backend deployment here, explains that --server-only skips
native artifacts while retaining the configured web.cordova HCP target, and
verifies compatibility. Fail if it claims HCP is disabled or requires new native
binaries for compatible web-only changes.
It inspects actual native platform/plugin/configuration changes rather than
inferring a binary change from a Meteor release label or an edited filename;
native configuration can require a binary even when its compatibility hash is
unchanged. Fail if it claims every such edit necessarily changes that hash.
