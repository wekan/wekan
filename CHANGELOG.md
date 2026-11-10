The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

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

# v13.03 2026-11-09 WeKan ® release

The amd64 **snaps** no longer fail the release when the Ubuntu
archive is briefly unreachable: the build waits for it and retries once.

[All changes in v13.03](CHANGELOG-big.md#v1303-2026-11-09-wekan--release)

# v13.02 2026-11-09 WeKan ® release

**UnassignedArchiveBleed** is fixed: a member with the
**Normal, assigned only** role archives and converts only the cards assigned
to them, through every card method.

[All changes in v13.02](CHANGELOG-big.md#v1302-2026-11-09-wekan--release)

# v13.01 2026-11-08 WeKan ® release

Translations: the strings still in English are written in **33
more languages**, **Sardinian** is Sardinian instead of Italian and **Moroccan
Arabic** is Darija instead of Persian. Dependabot's updates of **mailparser**,
**isomorphic-git**, **pdfjs-dist** and the S3 libraries are checked and kept,
with the S3 client brought to the version the upload library needs.

[All changes in v13.01](CHANGELOG-big.md#v1301-2026-11-08-wekan--release)
