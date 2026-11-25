The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v13.31 2026-11-25 WeKan ® release

A person can **download everything WeKan holds about them**
and **be erased everywhere**; an operator publishes a **privacy notice, terms
and imprint**, can **require accepting them**, and limits how long records are
kept. Administrators **export their lists as CSV**, see **who downloaded what**,
check a **Compliance** checklist; the pages pass **WCAG 2.2 AA** checks, and
every
release carries a **CycloneDX SBOM**, with **security.txt** from the security
contact. **Problems / Summary** groups **sign-in refusals by reason** with the
fix for each, the **delay after a wrong password** is applied at last, the
**Docker image is distroless**, and the server tests pass again.

[All changes in v13.31](CHANGELOG-big.md#v1331-2026-11-25-wekan--release)

# v13.30 2026-11-23 WeKan ® release

The **wekan-ondra** and **wekan-gantt-gpl** snaps are published on
every architecture the wekan snap has, on all four channels, and each **Snap
Store page** shows what is new in the newest release. **Time tracking**
works again on imported cards whose spent time was stored empty, and the
**Admin Panel recovery list** no longer fills up with old cancelled
notifications.

[All changes in v13.30](CHANGELOG-big.md#v1330-2026-11-23-wekan--release)

# v13.29 2026-11-23 WeKan ® release

**EVERYTHING** tests now run one stage and one worker at a time by
default, so a full test run no longer runs the machine out of RAM; the
two-worker mode stays available when asked for.

[All changes in v13.29](CHANGELOG-big.md#v1329-2026-11-23-wekan--release)

# v13.28 2026-11-23 WeKan ® release

A board can be a **Shop** with invoices and order email, the
**Admin Panel** can be
limited to chosen addresses, all **webhooks** can be turned off at once, the
**Cloud Panel** exists only in a
Cloud Admin container with the `CLOUD` variable (**CloudPanelBleed**), a forged
bounce report can no longer stop email (**BounceBleed**), and every setting that
turns something off is **refused on the server**. The **audit log**, **sign-in
address retention** and a **personal-data inventory** begin the missing law and
standard features, and every **feature page** of the docs has one shape.

[All changes in v13.28](CHANGELOG-big.md#v1328-2026-11-23-wekan--release)

# v13.27 2026-11-22 WeKan ® release

**CodeQL** alert #611 is fixed: the **autolink rules** find the
links already in a card's text in linear time, so a description built of
thousands of brackets no longer takes seconds to render.

[All changes in v13.27](CHANGELOG-big.md#v1327-2026-11-22-wekan--release)
