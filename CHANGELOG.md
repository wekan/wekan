The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v12.98 2026-11-06 WeKan ® release

**GroupLinkBleed** is fixed: a board admin can no longer skip the
board methods by writing the board directly, to attach an organization or team
they do not belong to or to add a member past the invitation checks.
**Public board CSV and TSV exports** honour the selected columns, and the REST
**card archive, restore and custom-field** endpoints answer an unmatched card
with a JSON 404 instead of 500, and a REST **card update** can set sort 0, turn
overtime off and clear a description. The **notifications drawer** gets its
attachments again, and the developer instructions cover the **weba** Gambas
companion repository.

[All changes in v12.98](CHANGELOG-big.md#v1298-2026-11-06-wekan--release)

# v12.97 2026-11-06 WeKan ® release

`build.sh` and the `releases/` scripts now work on **Arch Linux**
and **Omarchy**, and the release builds no longer lose the **OpenBSD arm64
bundle** to a smoke test that left WeKan running, or the **s390x snap** to
Launchpad outages that were counted as build failures.

[All changes in v12.97](CHANGELOG-big.md#v1297-2026-11-06-wekan--release)

# v12.96 2026-11-05 WeKan ® release

The release **bundle starts again**: v12.95's build stopped on
boot because the **nodemailer** 10 raised inside Meteor's email package no
longer had the files that package was built against.

[All changes in v12.96](CHANGELOG-big.md#v1296-2026-11-05-wekan--release)

# v12.95 2026-11-05 WeKan ® release

**Continuous backup** now runs on one server at a time, with a
lease, when WeKan has several servers. Missing-board **exports** and REST
updates of missing **integrations**, **users**, **organizations** and **teams**
answer 404 instead of 200, the **minicard** shows a picked Requested by and
Assigned by, a card stops offering the attachment "+" when uploads are blocked,
and the Docker image's **nodemailer**, **body-parser**, **qs**, **uuid** and
**postcss-selector-parser** are raised past the advisories a Grype scan found.

[All changes in v12.95](CHANGELOG-big.md#v1295-2026-11-05-wekan--release)

# v12.94 2026-11-04 WeKan ® release

On an iPad the **opened card covers the header bar** instead of
sitting
behind it, and the speed test measures where the time goes when a WeKan board is
opened, on FerretDB and on MongoDB.

[All changes in v12.94](CHANGELOG-big.md#v1294-2026-11-04-wekan--release)
