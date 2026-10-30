The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v12.73 2026-10-30 WeKan ® release

**CHANGELOG.md** is now short: the In short of the upcoming
release and of the five newest releases, in plain Markdown. The status and every
change of each release are in **CHANGELOG-big.md**, which is the one that is
written. **CodeQL** alert #598 in the Sandstorm host test is fixed, and the
release script pulls before releasing, so a moved main no longer stops it.

[All changes in v12.73](CHANGELOG-big.md#v1273-2026-10-30-wekan--release)

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
