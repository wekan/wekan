The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v12.80 2026-11-02 WeKan ® release

**minimatch** is updated to 11.0.4 for GHSA-g3hv-75wg-m249, a
glob pattern that used up CPU and memory.

[All changes in v12.80](CHANGELOG-big.md#v1280-2026-11-02-wekan--release)

# v12.79 2026-11-02 WeKan ® release

A cluster of servers runs the **schema re-check** and the
**due-date reminders** once, and a slow-query warning says which query it is.
The site **announcement** shows on Home and All
Boards too. The **date picker** popup shows the year and has year, month and
day drop-downs under the calendar. The **macOS sandbox** for VSCodium no longer
asks for a keychain, starts from the checkout, and can carry a **Claude Code**
token so its login sticks.

[All changes in v12.79](CHANGELOG-big.md#v1279-2026-11-02-wekan--release)

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
