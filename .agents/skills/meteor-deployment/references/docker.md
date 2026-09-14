# Docker

## Multi-stage Dockerfile

```dockerfile
# --- build stage ---------------------------------------------------------
FROM node:22-bookworm AS builder

# Build deps for native npm packages (sharp, sqlite, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ git ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

# Install Meteor for the build
RUN curl -sSL https://install.meteor.com/ | sh

WORKDIR /app
COPY . .

RUN meteor npm ci
RUN meteor build --directory /build --server-only

# --- runtime stage -------------------------------------------------------
FROM node:22-bookworm-slim

WORKDIR /app
COPY --from=builder /build/bundle ./

# Install only production deps inside the bundle
RUN (cd programs/server && npm ci --omit=dev)

ENV PORT=3000
EXPOSE 3000

CMD ["node", "main.js"]
```

This sample targets Meteor 3.1 through 3.4. Match both `node:` tags to the
bundled Node major: Meteor 3.0 uses Node 20, 3.1 through 3.4 use Node 22,
and 3.5+ uses Node 24. Run `meteor node -v` to verify the exact version. On
M-series Macs targeting x86_64 Linux, add
`--architecture os.linux.x86_64` to `meteor build`.

`--server-only` skips platform-specific mobile application artifacts. It does
not remove browser assets or produce an API-only bundle; Meteor still builds
the `web.cordova` target used for hot code push. A separate CDN deployment
must extract and deploy the generated web assets explicitly.

## Build and run

```bash
docker build -t my-app:latest .

docker run --rm -p 3000:3000 \
  -e ROOT_URL=https://app.example.com \
  -e MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/myapp \
  -e METEOR_SETTINGS="$(cat settings.json)" \
  my-app:latest
```

## Native deps

If a native dep (`sharp`, `canvas`, `sqlite3`) fails inside the runtime
image, copy its prebuilt binaries from the builder rather than
recompiling:

```dockerfile
COPY --from=builder /app/node_modules/sharp ./programs/server/node_modules/sharp
```

For workers shipped by transitive logging deps (for example, `thread-stream`
from `pino`),
see the `meteor-modern-build-stack` skill: when using rspack, route the
dep through `Meteor.compileWithMeteor`.

## Healthcheck

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
```

Meteor returns 200 on `/` once the server is ready.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/tutorials/deployment/deployment.md
