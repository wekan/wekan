The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# Upcoming WeKan ® release

**CHANGELOG.md** is now short: the In short of the five newest
releases, in plain Markdown. Everything else - the status, the upcoming release
and every change of each release - is in **CHANGELOG-big.md**, which is the one
that is written.

[All changes so far](CHANGELOG-big.md#upcoming-wekan--release)

# v12.72 2026-10-30 WeKan ® release

A card link can no longer launch an operating-system handler with
a code-execution history, such as **ms-msdt** (Follina) or **telnet**, even if
an administrator lists it, and an attempt to write one shows in **Admin Panel →
Problems**. The **Apache** guide follows the 2024 Confusion Attacks, and the
Sandstorm store build publishes to **both app markets**.

[All changes in v12.72](CHANGELOG-big.md#v1272-2026-10-30-wekan--release)

# v12.71 2026-10-30 WeKan ® release

The **Sandstorm** build installs Sandstorm from
**install.sandstorm.org**, as the Sandstorm workflows already did, and the
docs link sandstorm.org. The Hall of Fame guards read every vulnerability name
now that each one links to its own page.

[All changes in v12.71](CHANGELOG-big.md#v1271-2026-10-30-wekan--release)

# v12.70 2026-10-29 WeKan ® release

The **AppImages** and the **Launchpad** snaps build again: their
FerretDB and mongo-tools are readable by every user, and the snap source
carries what its downloads need. **Continuous backup** names a changed
encrypted file as changed with **OpenSSL 4**, and the release and test tooling
runs on macOS and reports a bad certificate as one.

[All changes in v12.70](CHANGELOG-big.md#v1270-2026-10-29-wekan--release)

# v12.69 2026-10-29 WeKan ® release

**ImportPlacementBleed** is fixed: an import is placed only on its
own board. **Invite via Email** adds the invited new user again, instead of
the first user of the database. The **OpenBSD** bundle starts again, and
**History** works on **FerretDB**: date custom field changes are recorded there,
and the database migration says when documents did not arrive.

[All changes in v12.69](CHANGELOG-big.md#v1269-2026-10-29-wekan--release)

# v12.68 2026-10-29 WeKan ® release

**Card Settings**, in Board Settings / Card, becomes two panes of
checklists - the minicard's and the card's - with a checkbox per section and
the board's custom fields as items, and the opened card and the minicard
follow its sections and order; every opened card shows every field its board
allows, empty or not. WeKan moves to **Meteor 3.6-rc.1**, keeping its own
security additions to Meteor's packages. **Data health** in Admin Panel /
Problems can now clean up custom fields whose boards were all deleted, and
empty fields no longer show **Scrum** sections on boards that have Scrum
turned off.

[All changes in v12.68](CHANGELOG-big.md#v1268-2026-10-29-wekan--release)
