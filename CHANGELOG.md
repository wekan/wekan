The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v12.88 2026-11-03 WeKan ® release

**Every board theme** and **every color a member chooses** is
readable: the dark themes' **Card Settings**, popups and sidebars, the header of
eight themes, and a custom accent, text or label color made legible. A padded
**REST label** name no longer creates a second label.

[All changes in v12.88](CHANGELOG-big.md#v1288-2026-11-03-wekan--release)

# v12.87 2026-11-03 WeKan ® release

A **REST API** "get one" that finds nothing answers **404**
instead of 200 with an empty body.

[All changes in v12.87](CHANGELOG-big.md#v1287-2026-11-03-wekan--release)

# v12.86 2026-11-02 WeKan ® release

The daily **notification cleanup** and the **file integrity
audit**
run once for the whole installation, not once per server.

[All changes in v12.86](CHANGELOG-big.md#v1286-2026-11-02-wekan--release)

# v12.85 2026-11-02 WeKan ® release

The findings of the **accessibility audit** are fixed in the
default theme: header and label **colour contrast**, names that contain the
visible text, named form fields, card section headings that are real buttons,
and landmarks and headings on every page. axe-core now finds no violation on
22 pages. A cleared database connection pool is reported as a lost connection.

[All changes in v12.85](CHANGELOG-big.md#v1285-2026-11-02-wekan--release)

# v12.84 2026-11-02 WeKan ® release

GitHub code scanning's **code-quality** findings are fixed: a
promise formatted as text, undeclared globals, an upload that hung on an
unreadable file, and the lint around them. `npm run lint:promises`
now finds promises that are not awaited or handled.

[All changes in v12.84](CHANGELOG-big.md#v1284-2026-11-02-wekan--release)
