The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v12.75 2026-10-30 WeKan ® release

Changing a password signs the account out in every other browser,
and now a test proves it in two real browsers.

[All changes in v12.75](CHANGELOG-big.md#v1275-2026-10-30-wekan--release)

# v12.74 2026-10-30 WeKan ® release

**Caddy** and **FerretDB**, the Go servers WeKan ships, no longer
open MPTCP listeners, which Linux kernel bug **CVE-2026-98432** is reachable
through. The real fix is a patched host kernel.

[All changes in v12.74](CHANGELOG-big.md#v1274-2026-10-30-wekan--release)

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
