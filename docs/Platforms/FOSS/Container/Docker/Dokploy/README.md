# WeKan on Dokploy

[Dokploy](https://dokploy.com) (Apache-2.0) is a self-hosted PaaS that deploys Docker
Compose apps. Its one-click templates live in
[Dokploy/templates](https://github.com/Dokploy/templates), default branch `canary`.
WeKan is not there yet (checked 2026-10-11: no `wekan` in `blueprints/`, and no PR).

## The template

[`blueprints/wekan/`](blueprints/wekan/) here is the complete folder to add to
`Dokploy/templates`, plus the logo:

| File | What it is |
| --- | --- |
| [`docker-compose.yml`](blueprints/wekan/docker-compose.yml) | One container: WeKan with its bundled FerretDB v1 on SQLite (`WEKAN_DB=ferretdb`), everything under the named volume `/data` |
| [`template.toml`](blueprints/wekan/template.toml) | A generated domain routed to port 8080, and `ROOT_URL` set from it |
| [`meta.json`](blueprints/wekan/meta.json) | Name, version, description, links, tags; `version` = the image tag |
| `wekan.svg` | Copy [meta/icons/wekan-150.svg](../../../../../../meta/icons/wekan-150.svg) to it |

Dokploy's rules, and how the template meets them:

- No `ports`, `container_name` or `networks` (CI rejects them): it uses `expose: [8080]`
  and the default network.
- A pinned image, never `latest`: `ghcr.io/wekan/wekan:v12.29`. Use the newest tag that
  exists on the registry when opening the PR; a GitHub release can exist before its image.
- A named volume, not the `../files/...` bind pattern: the image's `/data` belongs to the
  image's `wekan` user, and a named volume inherits that owner; a bind mount would be
  created root-owned and WeKan could not write to it.
- No root `meta.json`: each template has its own `blueprints/<id>/meta.json`, and the
  root one is generated at build time.
- A healthcheck with the image's own Node.js (`curl` is not in the image). It accepts any
  answer below 500 from `/`, and the image's recovery page answers 503 until the database
  is ready.

## How it was tested

In a shallow clone of `Dokploy/templates` under `.tools/tmp`, with the folder above
copied to `blueprints/wekan/`, Dokploy's own three validators all pass:

```bash
node build-scripts/generate-meta.js --check            # 569 templates validated
cd build-scripts && npm ci
npx tsx validate-docker-compose.ts --file ../blueprints/wekan/docker-compose.yml --verbose
npx tsx validate-template.ts --dir ../blueprints/wekan --verbose
```

They run without Docker. What they cannot check - that WeKan starts in a Dokploy
instance - is the step below that has not been done.

## The pull request

1. Fork `Dokploy/templates`, branch from `canary`, add `blueprints/wekan/` with the four
   files above, and run the three validators.
2. Test it in a real Dokploy instance: every PR gets a preview deployment. Copy the
   template's Base64 there, then in Dokploy *Compose service → Advanced → Import → paste
   → Deploy*. The template says why: "Any PR that has not been tested by the contributor
   will be closed."
3. Title in the conventional style the repository uses: `feat: add WeKan template`.
4. Fill in the PR template's checklist (README read, tested in my instance) and add a
   screenshot of WeKan running.

Updates afterwards are manual: bump `version` in `meta.json` and the image tag in
`docker-compose.yml` together.

## What is missing

See the table in [docs/Platforms/Platforms.md](../../../../Platforms.md#possible-additional-platforms).
