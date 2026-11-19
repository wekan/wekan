The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v13.19 2026-11-19 WeKan ® release

**Release builds** no longer fail when the **Snap Store** is slow
to process an upload, or when a **Termux** or **BSD** package mirror has a bad
minute.

[All changes in v13.19](CHANGELOG-big.md#v1319-2026-11-19-wekan--release)

# v13.18 2026-11-19 WeKan ® release

**Admin Panel / Problems** says what its numbers count - "New
problems: 1" and "Checks with findings: 8 / 31", in every language - and a
report row's address, location and user always belong to the same occurrence.

[All changes in v13.18](CHANGELOG-big.md#v1318-2026-11-19-wekan--release)

# v13.17 2026-11-19 WeKan ® release

The **Admin Panel** answers one question per tab: Settings gains
**Appearance**, **Features**, **Feature profiles**, Security, Activities and
notifications, and Delete, Problems keeps only what is going wrong, and every
old
address redirects. The docs now have a page for every menu entry, and cards of
an archived swimlane no longer appear in the first swimlane.

[All changes in v13.17](CHANGELOG-big.md#v1317-2026-11-19-wekan--release)

# v13.16 2026-11-19 WeKan ® release

**ListLockBulkBleed** is fixed, and a list that refuses a role
now also refuses that role's bulk writes, dependency lines, rule actions and
changes to the list or swimlane itself. Administrators can give chosen users,
teams and organizations a smaller WeKan with opt-in **feature profiles**. A
server no longer runs out of memory in the hourly **History integrity audit**,
**scheduled rules** can create cards again, and **Card Excel export** and
clearing a card's text work again.

[All changes in v13.16](CHANGELOG-big.md#v1316-2026-11-19-wekan--release)

# v13.15 2026-11-18 WeKan ® release

**RaceBleed** is fixed: deleting a card while somebody moves it
to another board no longer destroys its checklists, comments and attachments
while the card itself survives there, and a member deleting a card that was
just moved keeps their account. REST handlers now answer **404, not 500**, for
a swimlane, user or board that is not there.

[All changes in v13.15](CHANGELOG-big.md#v1315-2026-11-18-wekan--release)
