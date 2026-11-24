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
| WeKan | The help button's Playwright spec; the test build that runs out of memory; wrong-language words in some locales; laws and standards WP-4 onwards; accessibility; the docs folders | The Dependabot and CodeQL alerts of ferretdb-test, hx, minio-metadata and trello-attachments-downloader; Dependabot off in 16 repositories; the dev-only glob 13 |
| [gitea-patches](https://github.com/wekan/gitea-patches/blob/main/TODO.md) | 90 new upstream Gitea strings not yet in Finnish | Run "Migrate all Gitea to backups" with `--dry-run` first |
| [omi](https://github.com/wekan/omi/blob/main/TODO.md) | Delete and import not yet run on a real Gitea folder or against the real GitHub; the import has no reactions, review comments, LFS, Actions or fork branches | Stop and back up Gitea before the first real write |
| [welite](https://github.com/wekan/welite/blob/main/TODO.md) | WeKan data folders: no zip archives, GridFS or object-storage downloads, avatars or cross-target builds yet; retro-browser acceptance | - |
| [weddy](https://github.com/wekan/weddy/blob/main/TODO.md) | 20 of WeKan's 174 templates in Go; attachments' Office preview and WebP thumbnails; more of WeKan's specs; Firefox and WebKit; netbsd/arm64 | Its "For the maintainer (on GitHub)" items |
| [caddy-ferretdb-plugin](https://github.com/wekan/caddy-ferretdb-plugin/blob/main/TODO.md) | The Windows SQLite URI fix, checked on Linux only | Ignore the otel update in Dependabot |
| [caddy-wekan-plugin](https://github.com/wekan/caddy-wekan-plugin/blob/main/TODO.md) | Weddy behind WeKan's newest settings; the Windows fixes, checked on Linux only | Ignore the otel update in Dependabot |
| [node-patches](https://github.com/wekan/node-patches/blob/main/TODO.md) | The clone retry, until the next Release All | - |
| [wekango](https://github.com/wekan/wekango/blob/main/TODO.md) | The Windows and macOS fixes, checked on Linux only | Confirm the mongo-tools notice review |
| [weror](https://github.com/wekan/weror/blob/main/TODO.md) | - | Decide on the demo account that takes any password |
| [wekan.fi](https://github.com/wekan/wekan.fi/blob/main/TODO.md) | - | - |
| [wekan-meteor3-html4](https://github.com/wekan/wekan-meteor3-html4/blob/main/TODO.md) | Left out for now | - |
| wena | aros-i386 without AHI audio | Rerun Release all for haiku-amd64; Release desktop's linux-armel and linux-mips64le |
| wepica | Left out: too old | - |

## In progress

Work being done now. Each item moves to the `# Upcoming WeKan ® release`
section of `CHANGELOG-big.md`, and to the docs, when it is committed.

- The help button (?): its Playwright spec `feature-help.e2e.js` has not been
  run yet. The button, its texts and their translations into every language
  are released (v13.28).
- The Meteor test build (`meteor test --full-app`) ran out of memory before
  any test started after the help texts grew every locale file; the release
  build (`meteor build`) still works. To find out why and fix it, then run
  the Shop, webhooks and Admin Panel addresses server tests, and their
  Playwright specs in Firefox and WebKit.
- Wrong-language and wrong-meaning words seen by the help-text translators,
  to correct now that the help texts are translated: Latvian (`lv`) has
  Lithuanian words; Estonian (`et-EE`) calls a board "juhatus" (a company's
  management board) in "Board Settings" and "Board View"; Aromanian (`rup`)
  and Sicilian (`scn`) have Italian menu names; Northern Sami (`se`) has two
  Finnish values; Shona (`sn`) has half-English menu names; Brazilian
  Portuguese (`pt-BR`) calls an assignee "Administrador"; Somali (`so`) calls
  card recurrence an automatic reset; Pashto and Sindhi (`ps`, `sd`) have odd
  "Check Version" and "WIP Limit Groups" terms; Serbian (`sr`) uses списи,
  предмет and Управа for board, card and Admin Panel; Macedonian (`mk`) has
  Bulgarian values (Хора, Наблюдавай, Имейл, Описание, Разпределена от,
  Поискан от); Luxembourgish (`lb`) is partly German; Punjabi and Odia (`pa`,
  `or_IN`) call a swimlane "swimming"; Maltese (`mt`) has "Bord Ara" for
  Board View. Seen by the 2026-11-24 translators: Venetian (`ve-CC`) has
  Zulu "export" and "log in" values, Vietnamese (`vi-VN`) has the Malay
  "Sejarah" for history, and Tagalog (`tl`) and Waray (`wa-RR`) have odd
  "log in" values; Neapolitan and Sicilian (`nap`, `scn`) have the Italian
  "Accedi" and "Esporta", and Luxembourgish "Board importieren".
- The docs folders keep their main page as `README.md` instead of a page named
  after the folder, and `docs/Features/README.md` holds the website's feature
  overview. Every topic in one folder at the `docs/Features/` level: the
  `General/` level goes, its folders move up into the same-named folders, and
  the folders of `# Moved` stubs are removed, with every link updated.
- Everything about accessibility in one folder, `docs/Features/Accessibility/`
  (from `General/Accessibility/` and the Admin Panel's Accessibility page).
- Accessibility: every missing WCAG 2.2 AA feature added, and the accessibility
  tests extended to every page, popup and Admin Panel pane - axe with the WCAG
  2.2 rules, keyboard-only use, visible focus, 200 % zoom and 320 px reflow,
  target size, reduced motion and every theme's contrast - run through build.sh.
- Laws and standards - GDPR, NIS2, ISO 27001, HIPAA and the others - checked
  against what WeKan already has (`docs/Compliance/`). WP-1 to WP-8 and
  WP-14 are done. Next: security.txt, the support period and an SBOM (WP-9),
  CSV exports and one's own login history (WP-10), a data-access log (WP-11),
  the Compliance pane (WP-12) and WCAG 2.2 (WP-13).
- Found while documenting, to fix: the Recovery pane's rule email text
  (`rule-email-recovery-description`) still says "This report does not retry
  or cancel delivery", though Review, Resend, Mark as sent and Drop exist since
  2026-09-30. The sentence is in every locale, so the fix is a translation
  batch: the corrected sentence in each language.

## For the maintainer: needs a person, not code

- Dependabot alerts to work through, now that it is on (security download of
  2026-11-24 00:30): ferretdb-test 93 (1 critical, 30 high), hx 69 (1
  critical, 23 high), minio-metadata 39 (6 critical, 8 high) and
  trello-attachments-downloader 6 (2 high, pyinstaller). nekan has 1 high its
  Dependabot does not list as open (zod below 4.6.6, GHSA-mrhx-c7xc-m3w5).
- ferretdb-test: Dependabot's npm update in `/node-deno-bun` fails (2026-11-23
  22:22): the patched decode-uri-component would take minio from 7.1.3 back to
  7.0.26, and uuid cannot be raised while its dependents still ask for a
  vulnerable one. Raise minio and the packages that pin uuid by hand.
- hx: 4 high CodeQL alerts, all in copied or generated files under
  `prototypes/` - js/xss and js/incomplete-url-scheme-check in a copy of
  `htmx.js` (fullmoon), and two js/redos in the built `ui/html5/build/html5/
  Main.js`. Update the htmx copy and rebuild Main.js rather than editing them.
- trello-attachments-downloader: push its `main` (the workflow permissions
  that close its two CodeQL alerts are committed there). Its release workflow
  also still uses `actions/upload-artifact@v1` and `download-artifact@v1`,
  which GitHub has retired, so a release tag fails at those steps.
- Dependabot is still off (403) in 16 repositories: migratemongo,
  minio-express, waxe, we, webhook, wedos, wekan-aws, wekan-gantt-gpl,
  wekan-ondra, wekan-openstore, wekan-openstore2, wekan-prometheus-exporter,
  wekan-sandstorm-meteor3, wekan-test-alpha, wekanstudio and wodello. Of those,
  we and wekan-sandstorm-meteor3 have a medium Babel advisory
  (GHSA-968p-4wvh-cqc8, @babel/helpers and @babel/runtime below 7.26.10).
- caddy-ferretdb-plugin and caddy-wekan-plugin: Dependabot's
  go.opentelemetry.io/otel/sdk/log update fails on every scheduled run, as it
  cannot resolve their local `replace` (the version is already on main); an
  ignore rule for it in their `.github/dependabot.yml` would stop that.
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
