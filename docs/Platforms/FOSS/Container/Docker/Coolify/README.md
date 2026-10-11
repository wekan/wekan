# WeKan on Coolify

[Coolify](https://coolify.io) (Apache-2.0) is a self-hosted PaaS. Its one-click services
are Compose files in [coollabsio/coolify](https://github.com/coollabsio/coolify) under
`templates/compose/`, with logos in `public/svgs/`. WeKan is not there yet (checked
2026-10-11: no file, logo, issue or PR mentions it).

## The template

[`templates/compose/wekan.yaml`](templates/compose/wekan.yaml) is the file to add, and
[meta/icons/wekan-150.svg](../../../../../../meta/icons/wekan-150.svg) is copied to
`public/svgs/wekan.svg`.

- The comment header is what Coolify's generator reads: `documentation`, `slogan`,
  `category`, `tags`, `logo` and `port`. `port: 8080` is required, because the proxy
  cannot find the port by itself.
- `SERVICE_URL_WEKAN_8080` makes Coolify generate the public URL and route it to port
  8080, and `ROOT_URL=${SERVICE_URL_WEKAN}` hands that URL to WeKan.
- `WEKAN_DB=ferretdb` runs WeKan with its bundled FerretDB v1 on SQLite, so one container
  is the whole app; the named volume `wekan-data:/data` keeps its database, attachments
  and avatars.
- No `container_name`, `restart` or networks: Coolify adds them.
- A pinned image (`ghcr.io/wekan/wekan:v12.29`), and a healthcheck with the image's own
  Node.js.
- `templates/service-templates*.json` must NOT be in the PR: Coolify's PR check closes a
  PR that touches them, and maintainers regenerate them.

## How it was tested

Coolify has no validator that runs without its Laravel stack. The template was checked
against the rules its docs and its PR-quality workflow enforce (header keys, port, a
pinned tag, no `container_name`/`restart`/networks, the `SERVICE_URL` variable named
after the service and port, a named volume, a healthcheck, a trailing newline) - see the
platform test in [docs/Platforms/Platforms.md](../../../../Platforms.md#possible-additional-platforms).
It has not been started in a Coolify instance.

## The pull request

Coolify's rules, from `content/docs/contribute/service.mdx` in
[coolify-docs](https://github.com/coollabsio/coolify-docs) and `CONTRIBUTING.md`:

1. Eligibility: the project needs at least 1,000 GitHub stars - WeKan has them.
2. Open a Discussion in *service-template-requests* first: CONTRIBUTING asks every PR to
   reference an Issue or Discussion.
3. Test from a fresh *Docker Compose Empty* resource in a local Coolify, pasting the
   template, and confirm WeKan starts and the URL opens it.
4. A matching docs PR in `coollabsio/coolify-docs` is required before the template is
   merged: `content/docs/services/wekan.mdx` (frontmatter `title`, `description`,
   `category`), the logo under `public/images/services`, then `bun run generate:services`.
   Link it from the template PR.
5. The template PR: title `feat(service): add wekan`, against `main`, with the category
   *Adding new one click service* ticked (Coolify's bot moves such PRs to `main`), a
   screenshot, the testing steps, and the contributor agreement left intact. The PR
   template also asks whether AI tools were used; whoever opens the PR answers that.

Updates afterwards are manual PRs that bump the image tag.

## What is missing

See the table in [docs/Platforms/Platforms.md](../../../../Platforms.md#possible-additional-platforms).
