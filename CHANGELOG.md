The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v12.78 2026-11-02 WeKan ® release

**CrossBoardExportBleed** and **UnassignedAttachBleed** are
fixed: a checklist scope stays on its board, every export obeys Disable all
export and Anonymize export users, and an assigned-only member changes
attachments only on their own cards. **SAML** logins use **node-saml 5.2.0**,
and **continuous backup** no longer misses a change made right after it starts.
**Keyboard shortcuts** keep working after a popup closes, and the Rules page has
a way back to the board.

[All changes in v12.78](CHANGELOG-big.md#v1278-2026-11-02-wekan--release)

# v12.77 2026-10-31 WeKan ® release

Two **node test guards** follow the movable popups and the date
picker of v12.76.

[All changes in v12.77](CHANGELOG-big.md#v1277-2026-10-31-wekan--release)

# v12.76 2026-10-31 WeKan ® release

Security features: a **password policy** with an optional
breached-password check, **Admin Panel / Problems / Password length**,
**compulsory two-factor authentication**, sign-out of **idle sessions** and of
every session after a password change, an **audit log** of what administrators
did, **HSTS**, a cross-site request guard, and **S3 encryption at rest**.
**Sign-up** works again; the date picker has **Today**, the whole card title
edits and **every popup can be moved**; and an old **Sandstorm** grain migrated
from MongoDB 3 shows its boards again.

[All changes in v12.76](CHANGELOG-big.md#v1276-2026-10-31-wekan--release)

# v12.75 2026-10-30 WeKan ® release

Changing a password signs the account out in every other browser,
and now a test proves it in two real browsers.

[All changes in v12.75](CHANGELOG-big.md#v1275-2026-10-30-wekan--release)

# v12.74 2026-10-30 WeKan ® release

**Caddy** and **FerretDB**, the Go servers WeKan ships, no longer
open MPTCP listeners, which Linux kernel bug **CVE-2026-98432** is reachable
through. The real fix is a patched host kernel.

[All changes in v12.74](CHANGELOG-big.md#v1274-2026-10-30-wekan--release)
