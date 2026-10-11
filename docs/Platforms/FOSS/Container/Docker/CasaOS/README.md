# WeKan on ZimaOS and CasaOS

[ZimaOS and CasaOS](https://github.com/IceWhaleTech/CasaOS-AppStore) (Apache-2.0) share
one app store: Compose files in `IceWhaleTech/CasaOS-AppStore` under `Apps/`, in its v2
format. WeKan is not there yet (checked 2026-10-11: no `wekan` anywhere in the repo, and
no kanban app at all).

## The app

[`Apps/WeKan/docker-compose.yml`](Apps/WeKan/docker-compose.yml) is the folder to add.
In the v2 format all metadata is the top-level `x-casaos` block of the Compose file;
there is no separate metadata file. Files in the folder:

| File | Required | Source |
| --- | --- | --- |
| `docker-compose.yml` | yes | here |
| `icon.svg` | yes | copy [meta/icons/wekan-150.svg](../../../../../../meta/icons/wekan-150.svg) |
| `thumbnail.png` (784x442), `screenshot-1.png` ... (1280x720) | no | still to be made |

What the file does, and why:

- One container: WeKan with its bundled FerretDB v1 on SQLite (`WEKAN_DB=ferretdb`); its
  database, attachments and avatars are under `/DATA/AppData/$AppID/data`, the store's
  usual bind mount.
- `user: "0:0"`: Docker creates that bind-mounted directory owned by root, and the image's
  own `wekan` user could not write to it.
- Web UI on port `10880`; `port_map` is that port, as a string.
- `x-casaos.id` is `fi.wekan.wekan` (reverse-domain, as the store requires), category
  `Productivity`, architectures `amd64` and `arm64`.
- `ROOT_URL` must be the address the device is opened at, which the store cannot know, so
  it defaults to localhost and the `tips.before_install` text tells the user to set it.

## How it was tested

With the store's own tools, in a shallow clone under `.tools/tmp` and a Python venv, in a
mini store holding only the root `store-config.json`, `supported-languages.json` and
`Apps/WeKan` (with `icon.svg`):

```bash
# from the mini store directory
python -I <clone>/.github/actions/validate-compose/scripts/validate_compose.py \
  --app-path WeKan --report-json report.json --skip-compose-config
# status success, 0 issues

python -I build_appstore.py --source <mini store> --output dist \
  --base-url https://example.invalid/store --cache-file size.json \
  --digest-cache-file digest.json --report-json build.json
# status success, 1/1 apps built, 0 warnings, 0 errors
```

(`build_appstore.py` comes from `IceWhaleTech/build-appstore-action`, which
`scripts/build_dist.sh` fetches.) The build checked both declared architectures against
the live registry and pinned the image per architecture, for example
`ghcr.io/wekan/wekan:v12.29@sha256:a544a5a7...` for amd64. Not run:
`docker compose config -q` (needs Docker), and installing it on a real ZimaOS or CasaOS.

## The pull request

The store has no PR template. Its CONTRIBUTING asks to fork, work in a branch, test, run
`./scripts/build_dist.sh`, and say in the PR whether it is a new app, what changed and how
it was validated. Merged PRs are titled in conventional style, so: `feat: add WeKan app`,
with the sections recent new-app PRs used - Type of Change (New App), App Information
(name, app ID `fi.wekan.wekan`, category, developer, repo, architectures, port 10880),
Summary, Added Files, Validation (the commands above, and an install on a real device).

Updates afterwards are manual PRs that bump the image tag, `version`, `update_at` and
`release_notes`; the store has no update bot.

## What is missing

See the table in [docs/Design/Autoupdate/Platforms.md](../../../../../Design/Autoupdate/Platforms.md#possible-additional-platforms).
