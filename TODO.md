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

## Need the running app to reproduce/verify

- The WebKit stage cannot run in the Flatpak sandbox: MiniBrowser needs its own
  sandbox, and turning that off is not allowed there. Run it on a host.

## Import and Export of large files

Asked on 2026-11-20. A file chosen on the Import page for the generalized
importer's sources is now streamed to the server's disk a part at a time, with
the free space checked before and while it is written and the Admin Panel
limit (none: the free disk space) applied; zips are opened from the disk and
mailboxes read a message at a time, JSON built from the file a chunk at a
time, and Jira's people and CSV / TSV's columns read from the upload; WeKan's
own .zip and Trello's package use the same upload, limit and disk check. This
is the rest.

- Export: WeKan's own JSON export is written to the response as it is
  collected (`buildStream`); the .mbox, .enex, Todoist, TickTick, ClickUp,
  MeisterTask, Linear, Pivotal, Redmine, Quire, Taskwarrior and todo.txt
  exports a page of 500 cards at a time, the references across pages read in a
  light first pass (`models/lib/exportPaging.js`). Still built whole: the
  outlines grouped by list and nested (Markdown, Obsidian, Org mode, OPML, Leo,
  Notion), the formats that are one JSON document (Trello, Jira, Deck,
  OpenProject, GitHub and the others, Focalboard, Nullboard, Super
  Productivity, Kanri, Taiga, Vikunja, Mattermost) and the workbooks. Each of
  those needs its own writer of a document in parts.
