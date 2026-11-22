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

## In progress

Work being done now. Each item moves to the `# Upcoming WeKan ® release`
section of `CHANGELOG-big.md`, and to the docs, when it is committed.

- A help button (?) at the top of every feature's place, mirrored for
  right-to-left languages, opening "What is it?" and "How it works?" for that
  feature as plain text without links, in every language. Done: the button,
  the popup, 161 places and the English texts. Translating the 323
  descriptions: 176 of the 232 non-English locales are done (2026-11-22),
  the rest are being translated, a few languages at a time. Not yet run: the
  Playwright spec `feature-help.e2e.js`.
- The Meteor test build (`meteor test --full-app`) ran out of memory before
  any test started after the help texts grew every locale file; the release
  build (`meteor build`) still works. To find out why and fix it, then run
  the Shop, webhooks and Admin Panel addresses server tests, and their
  Playwright specs in Firefox and WebKit.
- The changelog entries for what landed since the last changelog update:
  ListLockMoveBleed, the help button, the Shop's Product line kind, the
  Meteor 3 hosting localhost limit, the Omi and WeLite translation keys, and
  the translation rule for the prototypes.
- The Latvian catalog (`lv`) has Lithuanian words in it: to be replaced with
  Latvian once the help-text translators are done with that file.
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
  against what WeKan already has (`docs/Compliance/`). Done: the complete admin
  audit log (WP-1), retention of sign-in addresses (WP-2) and the
  personal-data inventory (WP-3). Next: complete erasure (WP-4, the 40
  collections the inventory lists), a personal-data export (WP-5), legal pages
  with accepted versions (WP-6), then WP-7 to WP-14.
- Found while documenting, to fix: the per-address login delay is never
  applied; Broken Cards counts unknown card types in its list but not in the
  Summary or its repair; the database, integrity and mail streams have no name
  in the Summary; the Recovery pane's text says it does not retry or cancel;
  the attachment retention form allows a larger per-run number than the
  retention applies.

## For the maintainer: needs a person, not code

- Push `main` here and in the `.tools/w/` repositories with local commits:
  gitea-patches, omi, welite, wekan.fi, charts and caddy-wekan-plugin.
- [GHSA-394w-8q99-q4qx](https://github.com/wekan/wekan/security/advisories/GHSA-394w-8q99-q4qx)
  (ListLockMoveBleed) and
  [GHSA-7w85-38ph-c96v](https://github.com/wekan/wekan/security/advisories/GHSA-7w85-38ph-c96v)
  (BounceBleed): fixed in Upcoming; after the release, request the CVEs and
  publish the advisories. The Hall of Fame says "CVE requested" for both.
- The Snap Store push of v13.27 failed and waits for the Store's manual review
  ([#6929](https://github.com/wekan/wekan/issues/6929)); nothing to change in
  the code.
- Dependabot pull requests and alerts to close by hand: the
  go.opentelemetry.io/otel/sdk/log update in caddy-ferretdb-plugin and
  caddy-wekan-plugin (Dependabot cannot resolve their local `replace`, and the
  version is already on main), weror's rack-3.1.21 branch (main has rack
  3.2.9), nekan alert 207 and caddy-gitea-plugin alerts 1, 2, 4, 18, 24, 25
  and 37.
- wekan-meteor3-html4: turn on the dependency graph (Settings, Security
  analysis), then rebase its Dependabot pull request; its Dependency Review
  cannot run without it.
- wena: rerun Release all for haiku-amd64 (the Haiku VM never answered SSH);
  aros-i386 needs SDL's AHI audio driver off for i386, whose AROS toolchain has
  no AHI headers - not cloned or built here, as there is no Docker.
- wekan.fi: rerun "Deploy static content to Pages", which failed with a 500
  from GitHub's Pages API after its checks passed.
- weror: decide whether the demo account `user@demo.test` may sign in with any
  password, as its tests ask; restored as tested, and a risk if weror is
  public.
- wekango: confirm the review of the new mongo-tools license notices (only
  permissive attributions changed).

## Repositories left out, and why

- wepica: too old; its failing Dependabot runs are not fixed (decided
  2026-11-22).
- sandstorm-io/sandstorm under `.tools/sandstorm`: somebody else's project,
  cloned for reference only.

## Need the running app to reproduce/verify

- The WebKit stage cannot run in the Flatpak sandbox: MiniBrowser needs its own
  sandbox, and turning that off is not allowed there. Run it on a host.

## Need accounts on the tools, or a running copy of one

The import/export review asked on 2026-11-20 (everything each tool with a
WeKan import or export can hold comes across, whole or in part) went through
every parser and formatter against the export format its header documents.
What it found is fixed and in the Upcoming release; the round trips are held
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
