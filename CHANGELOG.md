The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v13.01 2026-11-08 WeKan ® release

Translations: the strings still in English are written in **33
more languages**, **Sardinian** is Sardinian instead of Italian and **Moroccan
Arabic** is Darija instead of Persian. Dependabot's updates of **mailparser**,
**isomorphic-git**, **pdfjs-dist** and the S3 libraries are checked and kept,
with the S3 client brought to the version the upload library needs.

[All changes in v13.01](CHANGELOG-big.md#v1301-2026-11-08-wekan--release)

# v13.00 2026-11-07 WeKan ® release

**CreateBleed** is fixed: "Only admins can create boards" now
holds on every path that creates a board - the browser console, the REST API,
imports, copies, clones and cards - not only on the Add Board form. The **REST
API documentation** spells the name **WeKan**, so the API pages published on
wekan.fi pass its brand-spelling check again.

[All changes in v13.00](CHANGELOG-big.md#v1300-2026-11-07-wekan--release)

# v12.99 2026-11-06 WeKan ® release

The **mac-arm64** release bundle builds again: its job asked for
GitHub's retired **macos-14** runner and was cancelled in the v12.98 release
run. The **weba** instructions now live in the weba repository itself.

[All changes in v12.99](CHANGELOG-big.md#v1299-2026-11-06-wekan--release)

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
