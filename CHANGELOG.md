The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v12.82 2026-11-02 WeKan ® release

A card moved to another board, restored from the archive or given
a number no longer takes a **card number** another card on that board has.

[All changes in v12.82](CHANGELOG-big.md#v1282-2026-11-02-wekan--release)

# v12.81 2026-11-02 WeKan ® release

The **database health** probe reports a finding once, not once
per server.

[All changes in v12.81](CHANGELOG-big.md#v1281-2026-11-02-wekan--release)

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
