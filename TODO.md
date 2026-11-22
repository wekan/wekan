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

- Cloud Admin: only with the server's `CLOUD=<domain>` environment variable,
  never set from the browser or the API; Admin Panel / Cloud for the
  CloudAdmin; only it may connect to other MongoDB databases; customers sign
  in with the password of their own WeKan, checked against its database;
  their support chat and tickets as WeKan boards; the addresses a CloudAdmin
  may sign in from; no REST API there for users who are not signed in.
- Every setting that turns something off is refused on the server too, not
  only hidden in the browser - first of them, a disabled password login.
- Every feature page under `docs/Features/` in one shape: what it is, read
  more, how to use it, how its numbers are calculated, how it works, and its
  commits.
- The docs folders keep their main page as `README.md` instead of a page named
  after the folder, and `docs/Features/README.md` holds the website's feature
  overview. Every topic in one folder at the `docs/Features/` level: the
  `General/` level goes, its folders move up into the same-named folders, and
  the folders of `# Moved` stubs are removed, with every link updated.
- The compliance reports move to `docs/Compliance/`, and accessibility gets a
  top-level folder of its own, `docs/Accessibility/`.
- Accessibility: every missing WCAG 2.2 AA feature added, and the accessibility
  tests extended to every page, popup and Admin Panel pane - axe with the WCAG
  2.2 rules, keyboard-only use, visible focus, 200 % zoom and 320 px reflow,
  target size, reduced motion and every theme's contrast - run through build.sh.
- Laws and standards - GDPR, NIS2, ISO 27001, HIPAA and the others - checked
  against what WeKan already has; what is missing is added where it belongs in
  the menus: a complete admin audit log, retention for login and address data,
  a personal-data inventory, complete erasure, a personal-data export, legal
  pages with accepted versions, and the rest of the gap analysis.
- Board View Shop: the products on a board's cards as a web shop, which a
  public board can show instead of the kanban as Website can, with Board
  Settings / Shop choosing the payment methods WeKan already has.
- Found while documenting, to fix: the per-address login delay is never
  applied; Broken Cards counts unknown card types in its list but not in the
  Summary or its repair; the database, integrity and mail streams have no name
  in the Summary; the Recovery pane's text says it does not retry or cancel;
  the attachment retention form allows a larger per-run number than the
  retention applies.

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
