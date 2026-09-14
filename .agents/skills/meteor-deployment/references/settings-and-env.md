# `settings.json` and environment variables

## Loading

```bash
# dev
meteor run --settings settings.json
meteor test --settings settings.json --driver-package meteortesting:mocha

# production
METEOR_SETTINGS="$(cat settings.json)" node bundle/main.js
```

`METEOR_SETTINGS` is the canonical production path. The bundled
`bundle/main.js` reads it and writes `Meteor.settings`.

Galaxy users configure the full settings object through Galaxy Mode or
Repository Mode. Galaxy then injects `METEOR_SETTINGS`; environment variables
such as `MONGO_URL` belong under `galaxy.meteor.com.env`. See
[`galaxy.md`](galaxy.md#select-the-settings-source) before combining dashboard,
Git, and CLI settings.

## Reading

```javascript
import { Meteor } from "meteor/meteor";

Meteor.settings.stripeSecretKey;     // server-only key
Meteor.settings.public.appName;      // shipped to the client
```

Anything under `public` reaches the client. Everything else stays on the
server.

## Environment variables

| Var                | Default      | Notes                                          |
|--------------------|--------------|------------------------------------------------|
| `ROOT_URL`         | required     | External URL. Required for OAuth, absoluteUrl. |
| `MONGO_URL`        | required     | `mongodb://...` or `mongodb+srv://...`.        |
| `MONGO_OPLOG_URL`  | optional     | Mongo replica oplog URL.                       |
| `PORT`             | 3000         |                                                |
| `BIND_IP`          | 0.0.0.0      | Listen interface.                              |
| `METEOR_SETTINGS`  | optional     | JSON blob; merged into `Meteor.settings`.      |
| `MAIL_URL`         | optional     | SMTP URL: `smtp://user:pass@host:587`.         |
| `NODE_ENV`         | `development` in dev | Set to `production` for prod builds.   |

Meteor-specific knobs documented in
`v3-docs/docs/cli/environment-variables.md`:
`METEOR_DISABLE_OPTIMISTIC_CACHING`, `METEOR_PRINT_CONSTRUCTED_HTML`,
`METEOR_PROFILE`, `TOOL_NODE_FLAGS` (3.4.1+), `METEOR_LOCAL_DIR`,
`METEOR_IGNORE`.

## Mongo connection strings

- Local: `mongodb://localhost:27017/myapp`
- Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/myapp?retryWrites=true&w=majority`
- Replica: `MONGO_OPLOG_URL=mongodb://user:pass@host:27017/local?replicaSet=rs0&authSource=admin`

On Meteor 3.0 through 3.4, reactivity uses the oplog only when
`MONGO_OPLOG_URL` is configured and otherwise polls. Meteor 3.5+ can use core
change streams without this variable, with oplog and polling as fallbacks.
Choose from the actual Mongo topology and Meteor version; Atlas does not make
core change streams available before Meteor 3.5.

## Secrets

Do not commit production secrets to `settings.json`. Build the file at
deploy time from a secret store:

```bash
jq -n --arg key "$STRIPE_SECRET_KEY" \
  '{stripeSecretKey: $key, public: {stripePublishableKey: env.STRIPE_PK}}' \
  > settings.json

METEOR_SETTINGS="$(cat settings.json)" node bundle/main.js
```

Or pass values as separate env vars and read them with
`process.env.<NAME>` in startup code.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/cli/environment-variables.md
