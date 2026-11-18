The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# Upcoming WeKan ® release

The **Admin Panel** answers one question per tab: Settings gains
**Appearance**, **Features**, **Feature profiles**, Security, Activities and
notifications, and Delete, Problems keeps only what is going wrong, and every
old
address redirects. The docs now have a page for every menu entry, and cards of
an archived swimlane no longer appear in the first swimlane.

[All changes so far](CHANGELOG-big.md#upcoming-wekan--release)

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

# v13.14 2026-11-16 WeKan ® release

a **checklist folded on a minicard** stays folded, and every
profile preference survives a reconnect. The **card shortcuts** open only their
popup, **one shared list header row** really hides the other swimlanes'
headers, and the editors no longer show "comment-placeholder" after the
**i18next 27** update. **Deleting a card** keeps its attachments recoverable.

[All changes in v13.14](CHANGELOG-big.md#v1314-2026-11-16-wekan--release)

# v13.13 2026-11-15 WeKan ® release

**Copy Checklist** and the other destination pickers list the
cards of a large board again: a board that loads its cards lazily used to leave
the card dropdown empty. Dependabot's updates, among them **i18next 27** and
the **mongodb** driver 7.8.0, are kept.

[All changes in v13.13](CHANGELOG-big.md#v1313-2026-11-15-wekan--release)

# v13.12 2026-11-14 WeKan ® release

WeKan is updated to **Meteor 3.6.1**, whose DDP server refuses
malformed messages without stalling the connection. **One shared list header
row** now shows the same lists in every swimlane, scrolling together, and
**Shift+M** and **Shift+C** open Move Card and Copy Card. Those popups
remember the swimlane and list, not only the board. The embedded-engine
benchmark takes **OpenTelemetry 1.47.0** for a Dependabot alert. A **REST
API** write that changes nothing answers 404, and a card deletion naming the
wrong list no longer strips the card's checklists (**ListLockBleed**).

[All changes in v13.12](CHANGELOG-big.md#v1312-2026-11-14-wekan--release)
