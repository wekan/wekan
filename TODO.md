# TODO

What is not done yet in WeKan, with the reason it is not done. This used to be
the TODO Later block inside `# Status` of `CHANGELOG-big.md`; it lives here so
the changelog only says what changed.

- An item here is NOT done, so it thanks nobody and links no commit. Link the
  issue when there is one: `[#NNNN](https://github.com/wekan/wekan/issues/NNNN)`
  and a one-line reason.
- When an item is done, REMOVE it from this file and write its entry in the
  `# Upcoming WeKan ® release` section of `CHANGELOG-big.md`, linking the commit.
  A fixed item never stays here.
- An investigated issue that cannot be fixed or verified here is added under
  the category that says why. An emptied category is removed.

`tests/todoFile.test.cjs` checks this shape.

**Where things are** (2026-11-24). Each repository's own TODO.md has the
details; WeKan's are below.

| Repository | In progress, or not verified yet | Needs a person |
| --- | --- | --- |
| WeKan | - | The Firefox and WebKit stages, on a host; push the security fixes of ferretdb-test, hx, minio-metadata, trello-attachments-downloader and the caddy plugins; Dependabot off in 16 repositories; the dev-only glob 13 |
| [gitea-patches](https://github.com/wekan/gitea-patches/blob/main/TODO.md) | 90 new upstream Gitea strings not yet in Finnish | Run "Migrate all Gitea to backups" with `--dry-run` first |
| [omi](https://github.com/wekan/omi/blob/main/TODO.md) | Delete and import not yet run on a real Gitea folder or against the real GitHub; the import has no reactions, review comments, LFS, Actions or fork branches | Stop and back up Gitea before the first real write |
| [welite](https://github.com/wekan/welite/blob/main/TODO.md) | WeKan data folders: no zip archives, GridFS or object-storage downloads, avatars or cross-target builds yet; retro-browser acceptance | - |
| [weddy](https://github.com/wekan/weddy/blob/main/TODO.md) | 20 of WeKan's 174 templates in Go; attachments' Office preview and WebP thumbnails; more of WeKan's specs; Firefox and WebKit; netbsd/arm64 | Its "For the maintainer (on GitHub)" items |
| [caddy-ferretdb-plugin](https://github.com/wekan/caddy-ferretdb-plugin/blob/main/TODO.md) | The Windows SQLite URI fix, checked on Linux only | Push the otel ignore rule |
| [caddy-wekan-plugin](https://github.com/wekan/caddy-wekan-plugin/blob/main/TODO.md) | Weddy behind WeKan's newest settings; the Windows fixes, checked on Linux only | Push the otel ignore rule |
| [node-patches](https://github.com/wekan/node-patches/blob/main/TODO.md) | The clone retry, until the next Release All | - |
| [wekango](https://github.com/wekan/wekango/blob/main/TODO.md) | The Windows and macOS fixes, checked on Linux only | Confirm the mongo-tools notice review |
| [weror](https://github.com/wekan/weror/blob/main/TODO.md) | - | Decide on the demo account that takes any password |
| [wekan.fi](https://github.com/wekan/wekan.fi/blob/main/TODO.md) | - | - |
| [wekan-meteor3-html4](https://github.com/wekan/wekan-meteor3-html4/blob/main/TODO.md) | Left out for now | - |
| wena | aros-i386 without AHI audio | Rerun Release all for haiku-amd64; Release desktop's linux-armel and linux-mips64le |
| wepica | Left out: too old | - |

## For the maintainer: needs a person, not code

- Push the security fixes committed locally on 2026-11-24, which close every
  open Dependabot and CodeQL alert of the newest download once GitHub
  re-scans: ferretdb-test (93, `a3b3058`), minio-metadata (5, `1ce090d`), hx
  (47 Dependabot and 4 CodeQL, `02e5451` to `8f4699e` - htmx kept at 2.0.11, as
  4.x drops the `htmx:afterOnLoad` event the fullmoon board uses) and
  trello-attachments-downloader (6, and current upload/download-artifact,
  `9c65a9f`). hx's two htmx CodeQL alerts may come back on the new copy, as
  htmx still parses HTML and checks `javascript:` the same way: dismiss them as
  vendored code if they do. nekan has 1 high its Dependabot does not list as
  open (zod below 4.6.6, GHSA-mrhx-c7xc-m3w5).
- Dependabot is still off (403) in 16 repositories: migratemongo,
  minio-express, waxe, we, webhook, wedos, wekan-aws, wekan-gantt-gpl,
  wekan-ondra, wekan-openstore, wekan-openstore2, wekan-prometheus-exporter,
  wekan-sandstorm-meteor3, wekan-test-alpha, wekanstudio and wodello. Of those,
  we and wekan-sandstorm-meteor3 have a medium Babel advisory
  (GHSA-968p-4wvh-cqc8, @babel/helpers and @babel/runtime below 7.26.10).
- caddy-ferretdb-plugin and caddy-wekan-plugin: push the `.github/dependabot.yml`
  that ignores go.opentelemetry.io/otel/sdk/log, whose update fails on every run
  (`42c839f`, `cdab5e43`).
- wena: rerun Release all for haiku-amd64 (the Haiku VM never answered SSH);
  aros-i386 needs SDL's AHI audio driver off for i386, whose AROS toolchain has
  no AHI headers - not cloned or built here, as there is no Docker. Its
  "Release desktop" also failed (2026-10-03, not run since): linux-armel and
  linux-mips64le stopped with exit code 125 in their Docker emulation step.
- weror: decide whether the demo account `user@demo.test` may sign in with any
  password, as its tests ask; restored as tested, and a risk if weror is
  public.
- wekango: confirm the review of the new mongo-tools license notices (only
  permissive attributions changed).

## Needs a maintainer decision on the intended contract


- WeKan's dev-only `glob` 13.0.6 under `@babel/cli`, which builds the vendored
  `npm-packages/`, is in the range of GHSA-3g3m-2fjr-6pw4 (medium,
  CVE-2026-118773: 9.0.0 to 14.0.1). The bundle's own `glob` is 14.0.3, which
  is patched. `@babel/cli` 8.0.6 asks for `^13.0.0`, and the advisory names no
  patched 13 (13.0.7 is inside its range), so the fix is an override to glob
  14 - a major version over what `@babel/cli` asks for - or waiting for a
  `@babel/cli` that takes 14.

## Repositories left out, and why

- wepica: too old; its failing Dependabot runs are not fixed (decided
  2026-11-22).
- wekan-meteor3-html4: left out for now (decided 2026-11-22). Its failing
  Dependency Review needs the dependency graph turned on in its settings; its
  own TODO.md says so.
- sandstorm-io/sandstorm under `.tools/sandstorm`: somebody else's project,
  cloned for reference only.

## Need the running app to reproduce/verify

- The WebKit stage cannot run in the Flatpak sandbox: MiniBrowser needs its own
  sandbox, and turning that off is not allowed there. Run it on a host.
- Firefox cannot run in the Flatpak sandbox either: Playwright's Firefox 159
  needs NSS 3.126, newer than the runtime's, and with a newer NSS supplied it
  still crashes, as its own sandbox cannot create a user namespace there -
  the same as WebKit, and turning that sandbox off is not allowed. Run the Firefox stage on a host -
  in particular the Shop, webhooks, Admin Panel addresses and accessibility
  (47) specs, which pass in Chromium.

## Need accounts on the tools, or a running copy of one

The import/export review asked on 2026-11-20 (everything each tool with a
WeKan import or export can hold comes across, whole or in part) went through
every parser and formatter against the export format its header documents.
What it found is fixed and released; the round trips are held
by `tests/playwright/specs/export-import-round-trip.e2e.js` (41 formats, the
description, checklist, comment, dependency, label and due date) and
`tests/exportRoundTripFields.test.cjs` (32 formats in plain Node: start and
creation dates, spent time, the done tick, recurrence, people, custom fields,
color, Blocked), and a WeKan board's every field by
`tests/wekanCardFields.test.cjs`. What is left needs what this checkout does
not have:

- Each tool's newest release, checked with a real export file of it: Planner,
  Wrike, Teamwork, Businessmap, MeisterTask, Quire and Jira - the
  proprietary ones, whose current export is only seen with an account
  (Planner's newer Status, Task title and Assignments columns are read, as
  Microsoft's help page names them; a real file would confirm their exact
  spelling). The parsers follow
  the formats the tools document and report what they do not read, so a new
  field shows up in the import's loss report; checking for one needs an
  account on each tool. (Checked against their current source on 2026-11-20:
  Plane's IssueExportSerializer, Kanri's kanban-types.d.ts, Obsidian Kanban's
  markers, Nullboard's board object, and Gitea's (and Forgejo's) Issue
  struct, whose created_at, closed_at and time_estimate are read now;
  GitHub's REST issue, whose issue type is read now; GitLab's Issues API v4,
  whose health status and incident severity are read now. Redmine and
  monday.com import every column they do not name as a custom field, so a
  column a new release adds comes across without a change. Focalboard's archive
  format is frozen: Mattermost stopped merging changes to Focalboard and
  Boards in September 2023.
  Pivotal Tracker was shut down in 2025, so there is no newer release.
  Linear's open-source importer, @linear/import, declares the columns the
  parser reads.)
