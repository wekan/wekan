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
mailboxes read a message at a time; WeKan's own .zip and Trello's package use
the same upload, limit and disk check. This is the rest.

- Uploaded JSON is built from the file a chunk at a time
  (`server/lib/streamJson.js`) and a Mattermost export read a line at a time;
  the other text formats are read as one text up to 256 MB. Still read in the
  page and sent whole: Jira (its own creator asks about the people from the
  document in the page) and CSV / TSV (its columns are mapped in the page).
  Move those to the upload too, with their mapping steps asked from the
  server.
- Export: WeKan's own JSON export is written to the response as it is
  collected (`buildStream`), and the .mbox and .enex exports a page of 500
  cards at a time (`streamExternalExport`); the other tools' formats are still
  built whole in memory and then sent. Most of them refer from one row to
  another - a subtask to its parent, a card to its position or to an id
  numbered across the board (Todoist, TickTick, ClickUp, Pivotal, Redmine,
  Quire and the rest) - so a page cannot be written without the others: they
  need a first pass over the board for those references, then the rows a page
  at a time.
