The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v13.11 2026-11-13 WeKan ® release

The **file-integrity scan** stops reporting attachments and
avatars that WeKan deleted itself as missing, which had buried real
**StorageBleed** findings under thousands of false ones. The recurring-checklist
reset no longer scans every **checklist** on each tick. In the **REST API**, a
refused custom-field update changes nothing, ownership transfer takes only the
boards the user administers, and deleting a missing integration answers 404.

[All changes in v13.11](CHANGELOG-big.md#v1311-2026-11-13-wekan--release)

# v13.10 2026-11-13 WeKan ® release

The release's **Snap Store** credential check bounds each
snapcraft install attempt, so a Snap Store that hangs no longer stops a release.

[All changes in v13.10](CHANGELOG-big.md#v1310-2026-11-13-wekan--release)

# v13.09 2026-11-12 WeKan ® release

The release's **Snap Store** credential check retries installing
snapcraft, so one Snap Store timeout no longer stops a release.

[All changes in v13.09](CHANGELOG-big.md#v1309-2026-11-12-wekan--release)

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
