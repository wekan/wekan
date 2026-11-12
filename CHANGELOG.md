The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v13.08 2026-11-12 WeKan ® release

The **REST API** creates a card under the **parent** it is given,
and a refused **integration URL** no longer leaves the other fields of the same
update written. The **single-file** WeKan for **32-bit ARM** builds again, with
an i386 Node.js of the exact version its bundle embeds. A **GitHub CodeQL**
alert in the security alert download script is fixed.

[All changes in v13.08](CHANGELOG-big.md#v1308-2026-11-12-wekan--release)

# v13.07 2026-11-12 WeKan ® release

**ListLockAttachBleed** is fixed: when a list refuses a role
write access, that refusal now also holds for the attachment API's upload,
delete, copy and move. **CodeQL** alerts #602 and #603 in the tests are fixed,
**fast-xml-parser** is updated to 5.12.0, spent time reads as a **duration**,
the **indexes** that LDAP, card member and History queries need are added, and
Admin Panel → Problems can **Clear** resolved problems, which also age out.

[All changes in v13.07](CHANGELOG-big.md#v1307-2026-11-12-wekan--release)

# v13.06 2026-11-11 WeKan ® release

**CodeQL** alert #601 in a test is fixed, with two more tests
that had the same fault. A card's **overtime** set through the REST API is
saved where WeKan reads it, and cards that lost it before are repaired at
startup. Card **members and assignees** whose account was deleted can be removed
and added without an error, and clearing a card **date** no longer passes as a
date set to the rules, the due date count and the activity feed.

[All changes in v13.06](CHANGELOG-big.md#v1306-2026-11-11-wekan--release)

# v13.05 2026-11-10 WeKan ® release

WeKan is updated to **Meteor 3.6**. The **Android** bundles
build again, after v13.04's npm retry broke their install, and the **Super
Productivity** export no longer fails for a board with a card whose list is
archived.

[All changes in v13.05](CHANGELOG-big.md#v1305-2026-11-10-wekan--release)

# v13.04 2026-11-09 WeKan ® release

**ListLockBleed** is fixed: when a list refuses a role write
access, that refusal now also holds for the checklist and checklist-item REST
routes. The **Sandstorm** and **Android** bundles retry their npm install when
github.com is briefly unavailable.

[All changes in v13.04](CHANGELOG-big.md#v1304-2026-11-09-wekan--release)
