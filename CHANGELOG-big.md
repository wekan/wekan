# Status

<details>
<summary>More status info</summary>

https://wekan.fi/status/

What is not done yet, and why, is in [TODO.md](TODO.md).

</details>

<details>
<summary>Newest WeKan at these platforms</summary>

- [Install](https://wekan.fi/install/)
- [Upgrade WeKan](https://wekan.fi/upgrade/)
- [Docs](https://wekan.fi/docs/)
- [Mac ChangeLog](https://github.com/wekan/wekan/wiki/Mac)
- Older releases: [2026-10](old-CHANGELOG/2026/10.md),
  [2026-10 part 2](old-CHANGELOG/2026/10-part2.md),
  [2026-10 part 3](old-CHANGELOG/2026/10-part3.md),
  [2026-10 part 4](old-CHANGELOG/2026/10-part4.md),
  [2026-10 part 5](old-CHANGELOG/2026/10-part5.md),
  [2026-10 part 6](old-CHANGELOG/2026/10-part6.md),
  [2026-10 part 7](old-CHANGELOG/2026/10-part7.md),
  [2026-10 part 8](old-CHANGELOG/2026/10-part8.md),
  [2026-09](old-CHANGELOG/2026/09.md),
  [2026-09 part 2](old-CHANGELOG/2026/09-part2.md),
  [2026-09 part 3](old-CHANGELOG/2026/09-part3.md),
  [2026-09 part 4](old-CHANGELOG/2026/09-part4.md),
  [2026-09 part 5](old-CHANGELOG/2026/09-part5.md),
  [2026-09 part 6](old-CHANGELOG/2026/09-part6.md),
  [2026-08](old-CHANGELOG/2026/08.md),
  [2026-08 part 2](old-CHANGELOG/2026/08-part2.md),
  [2026-08 part 3](old-CHANGELOG/2026/08-part3.md),
  [2026-08 part 4](old-CHANGELOG/2026/08-part4.md),
  [2026-07](old-CHANGELOG/2026/07.md),
  [2026-07 part 2](old-CHANGELOG/2026/07-part2.md),
  [2026-06](old-CHANGELOG/2026/06.md), [2026-05](old-CHANGELOG/2026/05.md),
  [2026-04](old-CHANGELOG/2026/04.md), [2026-03](old-CHANGELOG/2026/03.md),
  [2026-02](old-CHANGELOG/2026/02.md), [2026-01](old-CHANGELOG/2026/01.md),
  [2025](old-CHANGELOG/2025.md), [2024](old-CHANGELOG/2024.md),
  [2023](old-CHANGELOG/2023.md), [2022](old-CHANGELOG/2022.md),
  [2021](old-CHANGELOG/2021.md), [2020](old-CHANGELOG/2020.md),
  [2019](old-CHANGELOG/2019.md), [2018](old-CHANGELOG/2018.md),
  [2017](old-CHANGELOG/2017.md), [2016](old-CHANGELOG/2016.md),
  [2015](old-CHANGELOG/2015.md)

</details>

<details>
<summary>Databases</summary>

Which databases WeKan supports
([docs/Databases/Supported.md](docs/Databases/Supported.md)):

- FerretDB v1 with SQLite: the default on every platform - bundle, Docker, Snap
  and Kubernetes.
- FerretDB v1 with PostgreSQL: works. With MySQL or MariaDB: experimental. With
  SAP HANA: experimental, amd64 only.
- FerretDB 2 with PostgreSQL/DocumentDB: not tested.
- MongoDB 6, 7, 8 and 9: the query conformance catalogue answers the same on
  6.0.28, 7.0.43, 8.0.32 and 9.0.2. WeKan's Mocha tests and dev server run on
  Meteor's bundled MongoDB 8.0.29, and docker-compose-mongodb-v7.yml runs WeKan
  on MongoDB 7.
- MongoDB refuses to start on Linux kernels 6.19 to 7.0.13 (Ubuntu 26.04
  included) until MongoDB 8.0.35 or 9.0.4 or kernel 7.0.14; FerretDB is not
  affected.
- MongoDB 3.x to 5.x: not tested with current WeKan; only to dump an old
  database and restore it into a supported one.

</details>

<details>
<summary>Version</summary>

- Version numbers v11.33, v11.54, v11.57, v11.59 and v11.61 do not exist: a bug
  in `releases/release-all.sh` measured the version step from the two newest
  CHANGELOG headings instead of always advancing by one, so once a prepared-
  but-never-published release had its heading removed rather than renamed back
  to `# Upcoming WeKan ® release`, the resulting gap was read as the new normal
  cadence and re-applied on every later release, repeatedly skipping a number.
  Fixed to a fixed +1 step; nothing was lost, these numbers were simply never
  used.
- WeKan 8.75 and newer uses Meteor 3.5
- WeKan 8.43 upgraded to Meteor 3.x, huge thanks to harryadel:
  - https://harryadel.com/dev-diary-24/
  - https://harryadel.com/dev-diary-25/
  - https://harryadel.com/dev-diary-26/
- WeKan 8.00-8.24 used Colorful Unicode Emoji Icons, versions before and after
  use mostly Font Awesome 4.7 icons.
- WeKan 8.00-8.06 had wrong raw database directory setting
  /var/snap/wekan/common/wekan and some cards were not visible, it was fixed at
  WeKan 8.07 where database directory is back to /var/snap/wekan/common and all
  cards are visible.

</details>

# v13.30 2026-11-23 WeKan ® release

**In short:** The **wekan-ondra** and **wekan-gantt-gpl** snaps are published on
every architecture the wekan snap has, on all four channels, and each **Snap
Store page** shows what is new in the newest release. **Time tracking**
works again on imported cards whose spent time was stored empty, and the
**Admin Panel recovery list** no longer fills up with old cancelled
notifications.

This release adds the following new features:

**Snap** - the two older snap names on every architecture, and what is new on
the store pages.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d041debbe98895e074d6c2889c96f3317188185d">wekan-ondra and wekan-gantt-gpl on every architecture wekan has, on all channels</a>. Thanks to xet7.</summary>

The two variants had amd64 and arm64 only: the `snap-variants` job builds those
natively, and `snap-launchpad`, the only builder of armhf, ppc64el, s390x and
riscv64, built only the `wekan` name. Each `snap-launchpad` leg now makes both
variants from the wekan snap it just built (`releases/snap-rename.sh` changes
the name and title, nothing else), releases them to stable, candidate, beta
and edge, and attaches them to the GitHub Release. Push Snap to Store fills in
each missing architecture of a variant from the release's wekan snap, instead
of only when a release has no variant at all. Release All Missing expects them
from v13.30 on, not for older releases: completing an older one after a newer
one would upload an older version as the highest revision and take stable
back to it. i386 stays without a snap: only core18 still has an i386 base.
`tests/snapVariantsAllArches.test.cjs` runs the new download step against a
fake release.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fada1fac12f369f49c0eb92ab1c0958f89163e70">The Snap Store pages show what is new in the newest release</a>. Thanks to xet7.</summary>

The Snap Store has no API for a revision's own changelog - the dashboard's "Add
changelog" is a web form only. So Push Snap to Store puts "What's new in WeKan
v<version>", the release's In short paragraph linking its changes at the tag,
at the top of the wekan, wekan-ondra and wekan-gantt-gpl listings with
`snapcraft upload-metadata` and the existing `SNAP_AUTH`. The page text is kept
in `releases/snap-listing/<snap>.md`; edit it there. wekan's feature list alone
is 4047 of the 4096 bytes a description may have, so it is cut at whole lines
and ends with a link to the whole file. The title, summary, license and icon go
back as the store has them. Only for the newest release, and a failure does not
fail the push. `tests/snapListingWhatsNew.test.cjs` runs the update with fake
tools.

</details>

and fixes the following bugs:

**Time tracking** - logging time on imported cards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c54e70f777d06cb6b44d1083382b933e36bac67b">Time can be logged on imported cards whose spent time was stored as null</a>. Thanks to Raymond-Voogt and xet7.</summary>

The board import stored `spentTime: card.spentTime || null`, and MongoDB and
FerretDB both refuse the `$inc` that logs time on a null, so every such card
failed with "Cannot apply $inc to a value of non-numeric type" - 429,620 cards
on the server that reported it ([#6940](https://github.com/wekan/wekan/issues/6940)).
The WeKan and CSV importers now store a Number. The Cards and Boards
`before.update` hooks turn an `$inc` of a stored non-number into the `$set` of
the sum (`models/lib/spentTime.js`) - not the update pipeline the report
suggested, which FerretDB v1, Minimongo and allow/deny refuse. The startup step
`spenttime-null-repair` resets the nulls already stored to 0. Checked against
FerretDB: the bare `$inc` and the pipeline are both refused, the hook's `$set`
and the repair work. `tests/spentTimeNullSafe.test.cjs` pins the helper, the
importers and that nothing in the tree writes a null spentTime again.

</details>

**The Admin Panel** - its activity-notification recovery list.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c2602fcd8670379343b92f1d2cd768cd45672b59">The recovery list shows cancelled notifications only while they are recent</a>. Thanks to Raymond-Voogt and xet7.</summary>

A cancelled activity notification is a permanent receipt, kept so a delayed
writer cannot recreate its payload, and the recovery report listed every one
ever written. With expired notifications cancelled automatically, the list grew
into dozens of pages of old rows that hid the recoverable ones
([#6941](https://github.com/wekan/wekan/issues/6941)). Pending notifications are
always listed; cancelled receipts only while their activity is newer than
`ACTIVITY_NOTIFICATION_RECOVERY_CANCELLED_DAYS` (default 14, `0` lists none).
Only the list is shortened, no receipt is removed.
`tests/activityNotificationRecoveryRetention.test.cjs` pins the selector and
that the report stays read-only; the integration suite runs it on a database.

</details>

and has the following developer-facing changes:

**Security tooling** - the Hall of Fame against the published advisories, and
the advisories in the security download.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/75b5e38df95ca640384e089914220adb5739b193">OidcRaceBleed is accounted for, and every Hall of Fame update fills in missing GHSAs and CVEs</a>. Thanks to meifukun and xet7.</summary>

GHSA-6944-p22h-3qpx, the OIDC login race of meifukun's report, was published
with no Hall of Fame row; its fix was already in v9.97
([#4897](https://github.com/wekan/wekan/issues/4897)), and the row is on
wekan.fi now. The security inventories count it, guarded by
`tests/oidcLoginStateIsolation.test.cjs`, and OIDCBleed now maps to the test
that guards it. CLAUDE.md and AGENTS.md: every Hall of Fame update compares the
published advisories with it - a GHSA without a row gets one, an assigned CVE
replaces "CVE requested", an advisory that is not public is named.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b0c9ef955c091ed86065663e3ef5ab41e686cb47">The security download saves the Advisory Database, dependency advisories and the organization's advisories</a>. Thanks to xet7.</summary>

`releases/sec/download-github-security.sh` now also writes each GHSA's entry in
the global GitHub Advisory Database, the reviewed advisories that affect the
exact package versions of the dependency graph, and every advisory of the
organization in one list. `--no-advisories` skips them.
`tests/securityDownloadScript.test.cjs` runs it against a stand-in `gh`.

</details>

**Maintainer instructions** - CLAUDE.md and AGENTS.md, for keeping TODO.md and
the Hall of Fame current.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3153d750480f3f31bcf4b9eadce81170a9ed5ef7">Every TODO.md update checks every item for being done, and done items leave it</a>. Thanks to xet7.</summary>

An item is checked against the code, git, the issue and the store, not its
wording: done and not released moves to the Upcoming section, done and
released is removed, partly done is shortened. A published security advisory
leaves TODO.md whole, the wait for its CVE number too. The first run removed
five items already done and released in v13.28 and v13.29.

</details>

- [The published advisories are read to the last page when the Hall of Fame is compared with them](https://github.com/wekan/wekan/commit/1e1970d6bf5232cdf312d53fbc51f5d0482337c3). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.29 2026-11-23 WeKan ® release

**In short:** **EVERYTHING** tests now run one stage and one worker at a time by
default, so a full test run no longer runs the machine out of RAM; the
two-worker mode stays available when asked for.

This release has the following developer-facing changes:

**Running all tests** - EVERYTHING one by one by default, two workers only when
asked for.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4dde05662ff82a5d2f959feeaa29f0d87ec67660">The Tests menu has EVERYTHING one by one as option 1 and EVERYTHING two-worker as option 2</a>. Thanks to xet7.</summary>

`build.sh` and `build.bat` list the one-by-one run first, so the option picked
most often is the one that does not exhaust memory. The guards that pin the
menu's order, `tests/buildScriptParity.test.cjs` and
`tests/dbConformanceWiring.test.cjs`, follow, with the reason.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5471f416e1fa539f872a53ebfa2a54df646dd549">A bare --run-everything runs one stage and one worker at a time</a>. Thanks to xet7.</summary>

Two Playwright workers per browser ran the machine out of RAM, so a bare
`./build.sh --run-everything`, `build.bat --run-everything` and
`releases/run-everything.sh` now default to one by one. The two-worker mode is
still there when it is named. `tests/buildScriptParity.test.cjs` pins the
default in all three.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.28 2026-11-23 WeKan ® release

**In short:** A board can be a **Shop** with invoices and order email, the
**Admin Panel** can be
limited to chosen addresses, all **webhooks** can be turned off at once, the
**Cloud Panel** exists only in a
Cloud Admin container with the `CLOUD` variable (**CloudPanelBleed**), a forged
bounce report can no longer stop email (**BounceBleed**), and every setting that
turns something off is **refused on the server**. The **audit log**, **sign-in
address retention** and a **personal-data inventory** begin the missing law and
standard features, and every **feature page** of the docs has one shape.

This release fixes the following CRITICAL SECURITY ISSUES:

**[BounceBleed](https://wekan.fi/hall-of-fame/bouncebleed/)** - a forged
bounce report stopped email to any address.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/81ca7b868bfc9c06f3246fe988981b0f87158ffe">A forged bounce report no longer stops email to any address</a>. Thanks to crypto-nidh and xet7.</summary>

POST `/api/inbound-email` needs no secret by default, and every email it got
was first checked for being a delivery status notification: one forged DSN
naming any address was recorded as a hard bounce, which stops every email
WeKan sends there - invitations, notifications, password resets - and only an
administrator could undo it ([GHSA-7w85-38ph-c96v](https://github.com/wekan/wekan/security/advisories/GHSA-7w85-38ph-c96v),
also filed as GHSA-2wcc-f289-3r95 and GHSA-735h-p955-fwxp). A bounce is now
recorded only from a transport that proves who sent it: the webhook with its
secret configured and matched, SES after its SNS signature is checked, an IMAP
mailbox WeKan signs in to, and the Sandstorm grain mailbox. Elsewhere it is
refused with 403, makes no card or comment, and shows in Admin Panel /
Problems as BounceBleed. `tests/bounceBleed.test.cjs` requires every receiver
to say whether it may carry a bounce and nothing to record one around the
gate; `inboundEmailRoute.tests.js` posts the advisory's DSN over HTTP.

</details>

**[CloudPanelBleed](https://wekan.fi/hall-of-fame/cloudpanelbleed/)** - any
WeKan administrator could make the server connect to internal MongoDB servers.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac856dd38fc7cadd5d09a74d3f85a03585d4b3cd">The Cloud Panel exists only with the server's CLOUD variable, with its Cloud Admins, customer login and support boards</a>. Thanks to xet7.</summary>

Any site administrator of any WeKan - also a customer's own container, where
the customer is the administrator - could set the Cloud Panel Domain from the
browser and save a customer domain with a MongoDB host and credentials of
their choosing, which the server then connected to. Now the panel exists only
when the server has `CLOUD=<its domain>`; it cannot be set or changed from the
browser or the API, a stored value has no effect, and every Cloud Panel method
and the one place that connects to a given database refuse without it, shown
in Admin Panel / Problems. The Cloud Admins are that container's
administrators, in Admin Panel / Cloud, and may be limited to chosen IPv4 and
IPv6 addresses. A customer signs in with the password of their own WeKan,
checked against its database, and sees their invoices, support chat and
tickets - a WeKan board per domain where they are Comment only.
`tests/cloudPanelGate.test.cjs` fails when any `MongoClient` is built from
given data outside the gate. [Docs](docs/Features/Admin-Panel/Cloud-Panel.md).

</details>

- [No REST API at the Cloud Panel's address for a request without a login](https://github.com/wekan/wekan/commit/ed7aa2264209e1f0a40ba7f28b41c06de5bf37d6). Thanks to xet7.
- [A customer signs in as username_customerdomain, so one username can be a customer at many domains](https://github.com/wekan/wekan/commit/bdaad563ac68ce3ec6f558b99a970c90e6a2b13f). Thanks to xet7.

**Settings that turn something off** - refused on the server, not only hidden
in the browser.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24be123ee56ac546037be77ee01f7766d4688fe3">Password login disabled and forgot password disabled are refused on the server</a>. Thanks to xet7.</summary>

`PASSWORD_LOGIN_ENABLED=false` only hid the form: a DDP or REST password login
still worked. Now every password-service sign-in, `POST /users/login` and
Meteor's `forgotPassword` are refused (LDAP keeps its own login), and the
attempt is shown in Admin Panel / Problems. A follow-up refuses the request
before any lookup, so the answer no longer told a right password from a wrong
one. [Docs](docs/Features/Admin-Panel/Settings-Enforced-On-Server.md).

</details>

- [The login method refuses a password request before any lookup while password login is off](https://github.com/wekan/wekan/commit/47fc873e1d3e65d64fef31049d8bb77bc218d508). Thanks to xet7.
- [Own account deletion and username change follow their settings on the server, and the last admin stays](https://github.com/wekan/wekan/commit/57a24eb8ba321198ecee62df53fddc9b53d0b1d9). Thanks to xet7.
- [An unticked feature of Admin Panel / Settings / Features is refused on the server](https://github.com/wekan/wekan/commit/68dcfd14fef672cc025cae3bc84385a24dcceacb). Thanks to xet7.
- [Disable all import also refuses the Trello API, iCalendar and Scrum transfer imports](https://github.com/wekan/wekan/commit/c5b3b597e8f07e9c58ae9664563de9dd37ed6a0f). Thanks to xet7.

and adds the following new features:

**The attachment slideshow** - more kinds of files, and only what is on the
screen is read.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d842a5e2fe7242ade92ca19e2ce5a4f9081485d">The attachment slideshow shows Markdown, CSV, code, iCalendar, Outlook .msg, tar and OpenDocument files</a>. Thanks to xet7.</summary>

The slideshow showed images, PDF, video, audio, plain text, ZIP listings and
docx/xlsx/pptx. It now also shows, with viewers loaded only when such a file
is opened (`client/lib/attachmentRichViewer.js`):

- Markdown (`.md`) formatted, through WeKan's own `+viewer`, so an attached
  file follows every setting a card description does;
- CSV and TSV as a table (papaparse), the first 1000 rows;
- source code and JSON coloured by highlight.js - an HTML or SVG source file is
  shown as text, never run;
- iCalendar (`.ics`) events and tasks, with WeKan's iCalendar reader;
- Outlook `.msg` headers, text and attachment names, with WeKan's reader;
- tar, tar.gz and `.tgz` file names (fflate, with an inflate limit and header
  checksums);
- OpenDocument text, spreadsheets and presentations (`.odt`, `.ods`, `.odp`)
  as headings, paragraphs and tables.

Everything a file contains reaches the page as text. Whether a file opens is
now one answer, `attachmentCanPreview`, shared by the card, the board's version
control view and the history table, whose own copy of the list had lost ZIP.
`tests/attachmentRichViewer.test.cjs` drives each viewer in jsdom, with
negative tests for binary files, refused downloads, gzip bombs, damaged tar
headers and oversized OpenDocument content; `attachment-rich-preview.e2e.js`
opens each kind in Chromium and checks that nothing in the files ran.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d6652f19b748aaf5fac0bf68fb3588b10ba63907">The slideshow reads only what is on the screen, with no row or size limit</a>. Thanks to xet7.</summary>

The text-like viewers read a whole file (up to 32 MB) and showed at most 1000
rows or 2048 names. Now only what is on the screen is fetched and only that is
in the page (`client/lib/attachmentWindow.js`). Text, logs, CSV/TSV, code, and
JSON and Markdown larger than 256 KB are read through HTTP Range requests: the
scrollbar is the whole file, so dragged to the middle it shows the middle and at
its end the last row. ZIP lists its names from the central directory, ZIP64 too,
without downloading an entry. tar and tar.gz, iCalendar and OpenDocument are
read
in order as far as they are scrolled - infinite scroll downwards - as compressed
data cannot be read from its middle; an OpenDocument's `content.xml` is the only
part read. In Chromium, `attachment-rich-preview.e2e.js` opens a 150,000-row CSV
and
finds only ranges fetched and only a screenful of rows in the page.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd74045a9f453527c6f6eea2ba36bd75c3f955ac">Outlook .msg and OpenDocument are converted once, a piece at a time, into rows read a screen at a time</a>. Thanks to xet7.</summary>

Their content is scattered through the file - a Compound File's sectors, a
ZIP's compressed `content.xml` - so they cannot be read a row at a time as they
are. The first time one is opened, the server reads it from its own storage in
64 KB byte ranges, never whole (of a `.msg` only the sector tables; an
attachment's data never), and writes what it finds as rows with an index in
`attachment-previews/` under the files root
(`server/lib/attachmentPreviewStore.js`).
The slideshow fetches only the rows on the screen, and its scrollbar is exactly
the rows. The parts are served at `/cdn/storage/attachments/<id>/preview-meta`,
`-index` and `-rows` after every check the original has; one preview takes at
most 512 MB of disk, and it is removed with the attachment.

</details>

**Attachments** - searchable inside, and checked against their content.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b335c5df0718e10f064706de293237926de196d1">Each gets a SHA-256 and plain search text, checked on every read and searched by Filter, Search and Search All Boards</a>. Thanks to xet7.</summary>

When it is added - or, for an older one, when it is first read whole - an
attachment gets `contentHash` (SHA-256, size, time) and its plain search text
with the time it was made: text, Markdown, CSV, code, JSON, HTML and e-mail as
text, PDF and Office through the document extractor, `.msg` and OpenDocument
from their slideshow rows. Its "Added" card history row carries the hash. A
whole read hashes the bytes on their way out: a missing hash is stored, a hash
the card history knows (an earlier version an undo or restore brought back)
gets a new hash and search text, and anything else is a warning in Admin Panel
/ Problems. Filter, the board's Search and Search All Boards find a card by its
live attachments' text, never sent to the browser.
`attachment-content-search.e2e.js` finds a file three ways, changes it on disk
and reads it. [Docs](docs/Features/Cards/Attachments/Attachment-Search-And-Integrity.md).

</details>

**The card details window** - its width.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9372148915cff7824b64e06fca337d696e51e3df">It remembers the width each user drags it to, and an admin sets the default as a percentage</a>. Thanks to rmb82 and xet7.</summary>

[\#6939](https://github.com/wekan/wekan/issues/6939): every card opened at
520px however often it was widened. The dragged width is now kept per user -
the profile, or a cookie for a reader who is not signed in - and Reset width in
the card menu or a double-click on the handle forgets it. Admin Panel /
Settings / Appearance / Card details default width is a percentage of the
browser window, 30 to 95, at least 520px. The card opened as a popup takes the
same width; mobile and maximized cards do not. A resize that ended with the
mouse outside the card closed it; it no longer does.
`card-details-width.e2e.js` drags the real handle in Chromium.
[Docs](docs/Features/Cards/Card-Details-Width.md).

</details>

**Hosting** - the Meteor 3 Docker scripts, and the Cloud Admin container.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b530f5c1a42aceb803adb02b4ae3d44f652a7005">One menu, build.sh, for every script - run here or on a server over SSH</a>. Thanks to xet7.</summary>

`docs/Platforms/FOSS/Container/Docker/Meteor3/build.sh` lists every script of
the directory in groups and asks each one's parameters. Its `settings.ini`
names the server - a host of `~/.ssh/config` such as `c2` - and the directory on
it; with a server set, the scripts are copied there and run over `ssh -t`, so
the machine the menu runs on keeps no passwords.
`tests/meteor3BuildMenu.test.cjs`
plays the server with a fake ssh.

</details>

- [CLOUD on every platform: the Dockerfile, start-wekan, every docker-compose file and the Snap](https://github.com/wekan/wekan/commit/f4439cb285562ed3c4cca3439b41a664fdec86c4). Thanks to xet7.

**Shop** - a board's cards as a web shop.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04436a739da5d0f1c5326253c4c92310c4fdb983">Board View / Shop: the products on the cards as a web shop, with a cart and a checkout</a>. Thanks to xet7.</summary>

A card in a list on sale whose price custom field holds a number is a product,
its labels are the categories. A visitor fills a cart and orders; the order is
a card on a private Orders board, numbered `ORD-<year>-<number>`, with the
lines, totals with VAT, the payment method and its reference. A public board
can show the Shop instead of the kanban, as it can show the Website.
[Docs](docs/Features/Board-Header/Board-Views/Shop.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/493af449982c808b11e4d9e3ff138c635e05cc2a">Board Settings / Shop: open the shop, map the cards to products, choose the Orders list and the payment methods</a>. Thanks to xet7.</summary>

The payment methods are the ones Budget and billing already has - SEPA QR, bank
barcodes, Swish, Pix, UPI, PayPal.me, crypto addresses, cash and the rest - with
the QR code or barcode made for the order's total. No card gateway or outside
account is added. [Docs](docs/Features/Board-Sidebar/Board-Settings/Shop.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8892734fa987d89c0f455464dfdf7def84488850">Every Shop setting is enforced on the server, and refused attempts are in Admin Panel / Problems</a>. Thanks to xet7.</summary>

Only a board admin saves the settings, and the Orders list must be on a private
board they also administer. An order's prices come from the cards, never from
the browser; a changed price or stock refuses the order, and orders are rate
limited per connection, address and shop.

</details>

- [Products, cart, totals and orders computed from the cards](https://github.com/wekan/wekan/commit/0aa3d0b9d67330670e51bb118dae44fa40eaca8a). Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7b48bce2f106e97a8cb2e4343a2544b59023887">An order is also a Budget and billing invoice, the buyer gets a confirmation email, and a board copy closes its shop</a>. Thanks to xet7.</summary>

With Budget and billing on, an order becomes an invoice numbered as billing
numbers them, with the order's payment reference, and the order card names it;
an order that fails takes the invoice and the stock back with it. The buyer is
sent the order, its totals and how to pay in their own language, which a Board
Settings / Shop tick can turn off; a failed send is in Admin Panel / Problems
and never fails the order. A copied board's shop is closed and has no Orders
list, so it cannot send orders to the original's.

</details>

**The Admin Panel** - who may use it, and the webhooks.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f1226454209424d534326e499918a7e26206d74">Allowed addresses: from any other address the admin pages and the admin REST API refuse</a>. Thanks to xet7.</summary>

Admin Panel / Settings / Privacy and security takes IPv4 and IPv6 addresses
and ranges. From any other address a site administrator is an ordinary member
on the server: every admin method, publication and REST API answer refuses,
their own boards keep working, and the attempt is in Admin Panel / Problems.
A list without the saver's own address is refused, and
`ADMIN_PANEL_ALLOWED_IP_ADDRESSES` on the server wins over it (`any` turns it
off) as the way back in. [Docs](docs/Features/Admin-Panel/Admin-Panel-Allowed-Addresses.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2b40f64df9eb4a7e3e4655e2b2fc646f72a2e3f">Turn off all webhooks: the server sends none and refuses to add or change one</a>. Thanks to xet7.</summary>

One tick in Admin Panel / Settings / Features. Board, global, two-way, Sync,
login and bot webhooks send nothing, adding or changing one is refused from the
browser and the REST API and shown in Admin Panel / Problems, and the stored
webhooks stay for when the tick is taken off. Queued notifications wait and are
sent then. ntfy, CalDAV and the email-to-card address are not webhooks and stay.

</details>

- [Every webhook screen is hidden while they are turned off](https://github.com/wekan/wekan/commit/c90bbbcd30feaf0861ef25e241050ade0728381c). Thanks to xet7.
- [Problems / All webhooks: every webhook, its board, owner and contents, with secrets masked](https://github.com/wekan/wekan/commit/df16bc55de63cbd35bab15276e6259da9bf958eb). Thanks to xet7.

**Laws and standards** - what GDPR, NIS2, ISO 27001 and the others need, added
where WeKan lacked it. [Gap analysis](docs/Compliance/README.md).

<details>
<summary><a href="https://github.com/wekan/wekan/commit/377a7b3abc87257a6a9a11dc468cbd1a556e6b24">Audit log: the Admin Panel's own collection writes and user anonymisation are recorded</a>. Thanks to xet7.</summary>

The Admin Panel saved settings, announcements, translations and the access
settings through Meteor's collection methods, which the audit log did not see.
Those writes, and anonymising a user, are now recorded with who did it and when.

</details>

- [Audit log: Account settings and the table visibility modes too](https://github.com/wekan/wekan/commit/94c598dd6bacca3fb0e52b079bdd6da1a94fd18a). Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02baa650feef415248abe055f9284881e48483f5">Sign-in addresses expire: LOGIN_ADDRESS_RETENTION_DAYS, default 365 days</a>. Thanks to xet7.</summary>

The addresses an account signed in from, the accounts behind an address and the
short-password logins were capped in number but kept forever. Once a day an
entry last used before the limit is removed; an address in use stays, and 0
keeps everything as before.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bfd83d09b606b5fce72f2d4f3fa673f00227dd87">Personal-data inventory: every collection classified, with a generated Data-Inventory.md</a>. Thanks to xet7.</summary>

All 185 collections, 128 holding personal data, each with its categories,
purpose, retention and what erasure does to it. A test fails when a new
collection is not classified, and lists the collections erasure does not
clean yet, for the complete erasure that comes next.
[Inventory](docs/Compliance/Data-Inventory.md).

</details>

- [Compliance: rows 2.1 and 2.2 point at the personal-data inventory](https://github.com/wekan/wekan/commit/70769674d6b1775ab83adc5270f194aefc5d0bf3). Thanks to xet7.

and fixes the following bugs:

**Import** - a .zip as a new board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7cd22f94ca17a5702fa7f0c81e439c2df03cebc">A .zip that becomes a new board, and a Trello API import, run as the importing user</a>. Thanks to xet7.</summary>

POST `/api/import/zip?newBoard=1` - All Boards / Import of a WeKan .zip, and
"Import many boards" - answered 500 for every archive that named people:
`trackImport()` starts the import at once, and only the await of its promise
was inside the importer's method context, so `Meteor.userId()` threw. The
Trello API import job had no context at all. Both now start inside it;
`tests/importZipUserContext.test.cjs` requires that of every caller, and
`gitea-backup-wekan-import.e2e.js` imports a .zip as a new board.

</details>

**Sign-in** - Sign in with Apple.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dfbd1a6d187d4a0f1552b3694e3cc29891735d3b">Sign in with Apple: response_mode=form_post, and the claims read from the ID token</a>. Thanks to xet7.</summary>

Apple has no userinfo endpoint, its access token is opaque, and it requires
`response_mode=form_post` for the name and email scopes; WeKan decoded the
access token and sent no response mode. Now Apple's address reads the claims
from the ID token and sends form_post (`OAUTH2_RESPONSE_MODE` and
`OAUTH2_CLAIMS_IN_ID_TOKEN` for other providers); a setup made from the old
docs keeps working. Not yet tried against Apple's servers.

</details>

**Boards and cards** - found while documenting the features.

- [The calendar offers a day click and a drag only to who may write on the board](https://github.com/wekan/wekan/commit/705f12e754166d6c74bd3cb047180463f811bbe4). Thanks to xet7.
- [Changing only a label's due date is saved](https://github.com/wekan/wekan/commit/64ed51246720fe154fe70e384dc791f2bbb2914c). Thanks to xet7.
- [The card count shows from more than N cards, the permanent delete hint names Settings / Delete in every language](https://github.com/wekan/wekan/commit/80b70100bb08671497495705b0c1b5387506b7eb). Thanks to xet7.

**Metrics** - the /metrics address allowlist.

- [The allowlist is read under the name every platform sets](https://github.com/wekan/wekan/commit/22bfe054bbbdf18b0e05aea95961ae68af325203). Thanks to xet7.
- [Both allowlist names are read where the environment check sees them](https://github.com/wekan/wekan/commit/db43260918fc7978c86ee39ff1017e01977b15c8). Thanks to xet7.

and has the following developer-facing changes:

**The security download** - `releases/sec/download-github-security.sh` and its
build logs.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/689d53815215e47d90da767911f7fc578c2e9c05">The newest build logs too, to fix failing builds from the files</a>. Thanks to xet7.</summary>

Per repository, `<datetime>/builds/` now holds the newest GitHub Actions runs
and, for every workflow whose newest finished run failed, each failed job's
log and its last 200 lines; SUMMARY.md lists the failing workflows first, with
their failed jobs and steps. `--builds N` looks at the N newest runs, 0 at
none.

</details>

- [A build log the log endpoint refuses is read through gh run view, and why it failed is kept](https://github.com/wekan/wekan/commit/4599e34518a20da55a996e6da9b93a69f9293fa1). Thanks to xet7.

**Tests** - guards that followed the changes above.

- [The Meteor 3 menu's fake ssh gets the server directory from the environment](https://github.com/wekan/wekan/commit/3c6427cbfd590ae9f7d19568220e172f06d66fde). Thanks to xet7.
- [BounceBleed is a guarded Hall of Fame vulnerability](https://github.com/wekan/wekan/commit/e5bfcf0d531a769ce8a13bf263b81f6d980a2c62). Thanks to crypto-nidh and xet7.

- [CloudPanelBleed is a guarded Hall of Fame vulnerability](https://github.com/wekan/wekan/commit/3690697c567ece0e2fda8ae2cc406fa5342c2d7e). Thanks to xet7.
- [Playwright: settings enforced on the server, called from the page the way the hidden button would](https://github.com/wekan/wekan/commit/94c0ee643748cfaa4264f327346d281288d5681a). Thanks to xet7.
- [Mocha: the feature gate test turns the admin preview off for itself](https://github.com/wekan/wekan/commit/f6dcb7aadeedd0ac46e63ca66d61008d71775376). Thanks to xet7.
- [The suites the earlier fixes broke: the hint's tests, the calendar guard, the OIDC quirks, tag stripping](https://github.com/wekan/wekan/commit/4364c7d0084800a0abfda06499b3a2e47d4b4420). Thanks to xet7.
- [Starred pages: the comment says what toggling does](https://github.com/wekan/wekan/commit/2dbc2a30bec2bbc86a47ca72da1cff079e0f4325). Thanks to xet7.

- [Shop: tests of the products, the prices, the settings and the orders, and of what is refused](https://github.com/wekan/wekan/commit/0d74e6ec25a8d7f976cbb69f1a5c34763036cf25). Thanks to xet7.
- [Shop: a product tile strips tags until none is left](https://github.com/wekan/wekan/commit/3a4e8899573ce745f4ed0d49afde3e646ae06c86). Thanks to xet7.
- [Shop test: the Problems keys are escaped whole when matched](https://github.com/wekan/wekan/commit/f5181faf779aef0db4da7e51e580094556de0554). Thanks to xet7.
- [Personal-data inventory: table cells escape backslashes, and the shared-description guard knows it only names collections](https://github.com/wekan/wekan/commit/bad1407412c37dae2a94880eead4a66e8454c863). Thanks to xet7.
- [Personal-data inventory: its generator is in the build-script guard, and the scan escapes a whole name](https://github.com/wekan/wekan/commit/e039e1716ae6f70193bda5cd4e7e70edb5f4ca22). Thanks to xet7.

- [Shop tests: the invoice, the confirmation email and the board copy, and what each must never do](https://github.com/wekan/wekan/commit/1083b52a3602219a8adda299ddcb0e1820a9ec5e). Thanks to xet7.

and has the following documentation:

**Feature pages** - every page under `docs/Features/` in one shape: what it
is, read more, how to use it, how its numbers are calculated, how it works,
and its commits; checked against the code, which corrected many pages.

- [Import / Export guides and notes](https://github.com/wekan/wekan/commit/99ab728ff98562f60ad8bf4c8890c75e96da81ec). Thanks to xet7.
- [Import / Export index, List sync and recovery](https://github.com/wekan/wekan/commit/4c86108dcb58a79aeba8dc0dc80d8b00a3635b8e). Thanks to xet7.
- [Outgoing Webhooks](https://github.com/wekan/wekan/commit/85c057de8c1d73b9e6c5c7d2a1291c35175f1ab1). Thanks to xet7.
- [Card and Board View settings, Archive, Labels, Filter and Members](https://github.com/wekan/wekan/commit/8f5a091b222eca0e21b85b6e45525e8033cfb57f). Thanks to xet7.
- [Card actions](https://github.com/wekan/wekan/commit/942d1f022c83f32a667a51e73400dcc94725457a). Thanks to xet7.
- [Board Settings](https://github.com/wekan/wekan/commit/9e01b2db1aa25d68f4948d7a6e71977d5188c64d). Thanks to xet7.
- [Card features](https://github.com/wekan/wekan/commit/bfa07485182a7188210ad190784821abe3d2cb71). Thanks to xet7.
- [General: Translations](https://github.com/wekan/wekan/commit/681927309e81917c86aba4a3824361cfacab340b). Thanks to xet7.
- [General: Translations: the review and audit notes keep their content and get their commits](https://github.com/wekan/wekan/commit/e16e698b5c284d4818132f194f7c3ffc33584c71). Thanks to xet7.
- [Card attachments, custom fields and dates](https://github.com/wekan/wekan/commit/3e6a5fdf5e35e41317b21596b6ebedebee3f9f2a). Thanks to xet7.
- [Admin Panel index, URLs, validation, Who sees what and Attachments](https://github.com/wekan/wekan/commit/75f02d9c32b0253600729d9ca2094ad8d22b135b). Thanks to xet7.
- [Cards](https://github.com/wekan/wekan/commit/407ad71e28c819358eb36997dec88d4879bbd9b5). Thanks to xet7.
- [General: Email](https://github.com/wekan/wekan/commit/a65fe52a2dd678cdd0593b395b84b528de813eaa). Thanks to xet7.
- [General: Accessibility](https://github.com/wekan/wekan/commit/17fdad790a980b2fb248a19b061e7b95a67d976d). Thanks to xet7.
- [General: Theme](https://github.com/wekan/wekan/commit/6bb55652ece420f6fec567a71897f066ccb90c06). Thanks to xet7.
- [Import / Export formats Super-Productivity to monday-com](https://github.com/wekan/wekan/commit/f4264cf7a9de67e84b1b38ad9ee5c3f0ccea4598). Thanks to xet7.
- [Import / Export formats Microsoft-To-Do to Slack](https://github.com/wekan/wekan/commit/6e7cd35edaa37d329e79f5fa0cf831d4fbf4d006). Thanks to xet7.
- [Import / Export formats Google-Tasks to Microsoft-Teams](https://github.com/wekan/wekan/commit/bea184b2ea337039880403ce7ff14f7cd618d983). Thanks to xet7.
- [Import / Export formats Asana to Google-Takeout](https://github.com/wekan/wekan/commit/80b45a4c58c63c1caba0da110d257373316806d8). Thanks to xet7.
- [General: the editor, Markdown, dependencies, filenames and drag and drop: what each is, how to use it, how its numbers are calculated, how it works, and its commits](https://github.com/wekan/wekan/commit/688760a4029e95ab114a6c2fa2b3cf32cab29739). Thanks to xet7.
- [Login Page](https://github.com/wekan/wekan/commit/124b61f286a9cfacdab74be89889b12a309f4bd0). Thanks to xet7.
- [Login Page](https://github.com/wekan/wekan/commit/2f9fb01ff16e2c53d199ddc46f7a95f1601f1137). Thanks to xet7.
- [Admin Panel / Settings](https://github.com/wekan/wekan/commit/90e1da878d8100113f4cffd1435a425f427c8a7e). Thanks to xet7.
- [Member Settings](https://github.com/wekan/wekan/commit/87a283cb291fa424e6834b8275fa1ef94ee3188e). Thanks to xet7.
- [Features index and the menu audits: what the index is, how to use it, and the commits](https://github.com/wekan/wekan/commit/49666d2abbd7e570e2a7ea26c954c03cb4ff71f2). Thanks to xet7.
- [Billing: what the feature is, how to use it, how its numbers are calculated, how it works, and its commits](https://github.com/wekan/wekan/commit/150a470e580f1acdd2e32161d1f7b6772c75efe8). Thanks to xet7.
- [Workload: what the feature is, how to use it, how its numbers are calculated, how it works, and its commits](https://github.com/wekan/wekan/commit/910239b53faeb29199da5c2982c197ca9306d106). Thanks to xet7.
- [Board header and board views](https://github.com/wekan/wekan/commit/9e97f5119dff091f816ca9ef1ffab0567bcd1c74). Thanks to xet7.
- [Admin Panel / People](https://github.com/wekan/wekan/commit/c9b297d9766c9cc55384e62627f6c3282fe86b72). Thanks to xet7.
- [Login Page](https://github.com/wekan/wekan/commit/74717ea829228f6761f5d67c014c5b0085606ae8). Thanks to xet7.
- [Admin Panel / Problems](https://github.com/wekan/wekan/commit/acd6c500e5348c5c80b61b46dcf588aed24347d6). Thanks to xet7.
- [General: History, Undo, the Table Page, Multi-Selection, links and notifications: what each is, how to use it, how its numbers are calculated, how it works, and its commits](https://github.com/wekan/wekan/commit/a8d9e271fe530d7a2a806f2c10ca189a1d261ade). Thanks to xet7.
- [Header bar](https://github.com/wekan/wekan/commit/a28cd22db784e74aad1df09f9eb700ce5a77ea42). Thanks to xet7.
- [All Boards](https://github.com/wekan/wekan/commit/601c04504e0180cc293c2a5c85cff94e69eacf0d). Thanks to xet7.
- [Rules](https://github.com/wekan/wekan/commit/174debbeeaa19cc2f78037991e7826fb5cd711cd). Thanks to xet7.
- [Board views](https://github.com/wekan/wekan/commit/33a3e2f8a3fa6677f8327519f1b82a40f03cb462). Thanks to xet7.
- [Scrum](https://github.com/wekan/wekan/commit/698b65b94ae8d39a3b6ff04fc99a3e072f242871). Thanks to xet7.
- [Board charts](https://github.com/wekan/wekan/commit/193baae902e726794f6ccd37c76f7f312b77a4c3). Thanks to xet7.
- [Admin Panel / Problems, API to Durable operations](https://github.com/wekan/wekan/commit/89af889874eddacd43c396b0b068863b46fb55ef). Thanks to xet7.
- [Admin Panel / Problems (Files to Performance)](https://github.com/wekan/wekan/commit/c66af0e134cff5e0f43df7b16c05db4d4b257b2f). Thanks to xet7.
- [Lists](https://github.com/wekan/wekan/commit/4a016735cbf1be7db6e9c02b05b623567bf43913). Thanks to xet7.
- [General](https://github.com/wekan/wekan/commit/d89485879323e8c2d64b4472880f6cab3714df05). Thanks to xet7.
- [Pages](https://github.com/wekan/wekan/commit/70d767208d58d39a6c0de7fb28858f1932e9c68e). Thanks to xet7.
- [Swimlanes](https://github.com/wekan/wekan/commit/77dc56591d16a0be7cb1fd9580cd3f8cf4d8e103). Thanks to xet7.

**Laws, standards and the new features** - and the pages of this release.

- [Shop: the order as a Budget and billing invoice, the confirmation email, and a board copy](https://github.com/wekan/wekan/commit/9d44b3f3e2290cdcd3009028f784ba38007ae870). Thanks to xet7.
- [Admin Panel allowed addresses](https://github.com/wekan/wekan/commit/030a9e4a295df0ba444590b3e62dcf89facc22ee). Thanks to xet7.
- [Turn off all webhooks, and Admin Panel / Problems / All webhooks](https://github.com/wekan/wekan/commit/6fbbb83cd26500d9e943c6ffee65bb22b6639358). Thanks to xet7.
- [Shop: in the feature list, the newest features, and the commits that built it](https://github.com/wekan/wekan/commit/9e8bdc5381f4b5f5c959c711cfd72dc4524bf91e). Thanks to xet7.
- [Compliance - laws and standards against what WeKan has, with the official sources](https://github.com/wekan/wekan/commit/98b8a76bca3f919a7c0d1c011c96ba2357355d8e). Thanks to xet7.
- [Settings enforced on the server - what each disabling setting refuses, and what is display only and why](https://github.com/wekan/wekan/commit/7377724b6bd88f4b9e684bf9d46d6b09885c753b). Thanks to xet7.
- [the Cloud Panel with CLOUD=<its domain>, its Cloud Admins, customer login, support boards, allowed addresses and no REST API](https://github.com/wekan/wekan/commit/2beb52cea864098923fd05977480931fbe84eb42). Thanks to xet7.
- [Docs: the attachment slideshow - which files are shown, and how much is read](https://github.com/wekan/wekan/commit/53c0fbeba0aee9b4f0da335bd3dd22ed5546e97e). Thanks to xet7.
- [README: attachment search and integrity, the slideshow, the card details width](https://github.com/wekan/wekan/commit/d7af7a3a665ee006bc0cb9188311c1274152ea3a). Thanks to xet7.

and updates the following translations:

**Card details width** - its four new strings.

**Languages updated:** 245 languages.

- [Card details width in every language](https://github.com/wekan/wekan/commit/9372148915cff7824b64e06fca337d696e51e3df). Thanks to xet7.

**Cloud Panel** - its new strings.

**Languages updated:** 246 languages.

- [The Cloud Panel's new strings in every language](https://github.com/wekan/wekan/commit/04c5b399aa51002c4d819a8d8d57263adee6496c). Thanks to xet7.
- [The Cloud Panel's support board in Bosnian and Tigre](https://github.com/wekan/wekan/commit/55ed7065ff84bd9e59db3ae35691c37ca412656a). Thanks to xet7.

**Shop** - its new strings.

**Languages updated:** 232 languages.

- [The Shop's 38 new strings in every language](https://github.com/wekan/wekan/commit/136fdebf969071d371b94c5b7646b10fb43a925a). Thanks to xet7.
- [The Shop's confirmation email and its setting in every language](https://github.com/wekan/wekan/commit/9f22d02b5dd5cb734a241c591a39b7eab98fd13f). Thanks to xet7.

**The Admin Panel** - its allowed addresses and the webhook switch.

**Languages updated:** 244 languages.

- [Allowed addresses in every language](https://github.com/wekan/wekan/commit/7f1226454209424d534326e499918a7e26206d74). Thanks to xet7.
- [Turn off all webhooks and the All webhooks report in every language](https://github.com/wekan/wekan/commit/cdf4da3d8d383d41835b371a8e9251fef1b6b99f). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.27 2026-11-22 WeKan ® release

**In short:** **CodeQL** alert #611 is fixed: the **autolink rules** find the
links already in a card's text in linear time, so a description built of
thousands of brackets no longer takes seconds to render.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/25e9d02517afe3b3334a6b6e6329dc29e343ff62">Alert #611: autolink rules find existing links in linear time</a>. Thanks to GitHub CodeQL and xet7.</summary>

`npm-packages/autolink/externalLinkRules.js` found the markdown links and
`href` values it must not rewrite with `/\[[^\]\n]*\]\([^)\n]*\)/g` and
`/href\s*=\s*("[^"]*"|'[^']*')/gi`. Both restart at every `[` (or `href="`)
and read to the end each time, so card text is quadratic work: 200,000 `[`
took 25 seconds (js/polynomial-redos, CWE-1333). One hand-written scan now
finds the same spans, with every "next `]`, `)` or quote" position computed
once. An admin's rule whose token starts with `{number}` had the same shape
on a long run of digits, and now starts only where a run begins.

`tests/externalLinkRules.test.cjs` fuzzes 3,000 texts against the two old
expressions to show the spans are unchanged, and times text built to make
them quadratic. The negative test finds no such span pattern in any autolink
module and times the other autolinks on the same text. Nothing is logged to
Admin Panel → Problems: long text is ordinary input, so there is no attempt
to tell apart from use.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.26 2026-11-22 WeKan ® release

**In short:** New **Workload and capacity**, **Budget and billing** and **Cloud
Panel** pages: hours against working time, each board's cost and margin with
**expenses**, **fees**, **quotes** and **invoices** in **PDF**, **Excel** and
**e-invoice**, and many customer domains merged into one WeKan. WordPress,
Ghost, Blogger and static sites import and export under **Website**, and a
public board can show itself as a **website**. The **Venda** and **Klingon**
translations hold only their own language, the move and copy pickers show names
without numbers (#6135), and unused code is removed.

This release adds the following new features:

**Workload and capacity** - hours against each person's working time, across
boards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/165dfa3c1676f6069d456ead021fa0db69f92e22">Workload and capacity page: load per person and week, with absences, holidays and allocations</a>. Thanks to xet7.</summary>

User menu → Workload and capacity (`/workload`) shows, week by week, the
estimated hours (a new card field, set beside the time spent) and Scrum story
points of the cards assigned to each person, across every board the viewer is
an active member of, against that person's working time: hours per week, work
percent and working days, less absences and public holidays. A week over
100 % is red. A board's admins allocate a share of a member's time to the
board for a period, or a role before anybody is named (a placeholder row).
The server computes the report; public boards and assigned-only boards are
left out, and somebody else's absence is dates only. Admin Panel → Features
turns it off. `tests/workload.test.cjs` and `tests/workloadAccess.test.cjs`
pin the rules and who may do what, and a Playwright spec drives the page. See
[Workload](docs/Features/Workload/Workload.md).

</details>

**Budget and billing** - what a board's work costs, and invoices of it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/604b3dbe84c17d11af722826741866c8953e91b3">Hourly rates, a budget against cost and forecast, and invoices of the hours spent</a>. Thanks to xet7.</summary>

User menu → Budget and billing (`/billing`), for a board's admins: hourly
rates per member and a board default, a budget of money and/or hours, and
the cost of the time spent, the work still to do and the forecast against it,
in red when over. Invoices bill the billable hours not invoiced yet (a card
can be marked not billable), numbered per year, with the statuses draft,
sent, paid and void; they print alone and download as CSV. Money is integer
cents; only board admins and site administrators see it; nothing is
published. `tests/billing.test.cjs`, `tests/billingAccess.test.cjs` and a
Playwright spec pin it. See [Billing](docs/Features/Billing/Billing.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/13b0d5fe37d5ff73e109e06a4fdc21418497e273">Time by day, invoices of a period, payment codes, PDF, SVG, Excel and e-invoice</a>. Thanks to xet7.</summary>

A card's Time popup lists its time by day - the day, the hours, who logged
them, a note - and Log time adds an entry on a day. The card's total stays
what the timers, the REST API, the imports and the reports read; whenever it
changes the server records the difference as an entry of that day. An
invoice covers a period: the billable entries of it that are on no invoice
yet, per card and person, at that person's rate, so nothing is billed twice;
voiding or crediting frees them. Payment codes follow their published
standards and are checked against the standards' own examples: SEPA EPC QR,
the Finnish bank barcode (Code 128 C), Finnish and ISO 11649 RF references,
the Swiss QR-bill, Swish, Pix, UPI, Bitcoin BIP 21, PayPal.me and payment
links. An invoice downloads as PDF, SVG, Excel, CSV and a UBL 2.1 Peppol BIS
Billing 3.0 e-invoice, with QR codes and barcode as vectors. Also: the
invoicer's details, VAT and reverse charge, due dates and penalty interest,
payments, partial payment and overdue, and credit notes. Nothing is sent to
any payment service. `tests/timeEntries.test.cjs`,
`tests/paymentCodes.test.cjs`, `tests/ublInvoice.test.cjs`,
`tests/invoiceFiles.test.cjs` and the billing suites pin it, and the
Playwright spec invoices a period and downloads the PDF and SVG.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37bc16e1e5f4c5f248e7aca9a779e4fc5cc5d8d2">Amounts in each currency's own decimals, and payment codes of more countries</a>. Thanks to xet7.</summary>

Money had been kept in cents for every currency, so 1000 JPY was 100000 and
1.500 KWD could not be written. `models/lib/currencies.js` now holds the ISO
4217 minor unit of each currency - none for JPY, KRW, VND, CLP and ISK,
three for KWD, BHD, JOD, OMR, TND, IQD and LYD - and rates, budgets,
payments and every invoice file use it. New payment methods, each from its
published specification: PromptPay, PayNow, VietQR and FPS as EMVCo QR codes,
Czech SPAYD, Polish ZBP, Hungarian MNB, Serbian NBS IPS, Danish FI +71, and
Ethereum and Litecoin; each requires the currency it is for. References add
the Belgian structured +++ reference, the Norwegian KID and the Swedish OCR.
`tests/regionalPaymentCodes.test.cjs` checks them against the standards'
examples and billing in JPY and KWD.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d88662d69c212650a7ed5d0ab82d69262a2c6690">Expenses, fixed fees and retainers, approving time, cost rates and margin, and quotes</a>. Thanks to xet7.</summary>

What a professional services automation system has besides time and
invoices. Expenses - travel, materials, a subcontractor - with a markup, on
a card and a person, spend the budget and go on the next invoice once. Fixed
fees are billed once from their day and retainers every month to their end;
a board can be a fixed price that bills no time. With approval on, only time
a board admin approved is invoiced, and the card's Time popup shows the
decision. A cost per hour gives the board its cost, unbilled work and margin.
Quotes price the work still to do, and accepting one can make it the budget.
Invoices and quotes fill in the board's customer. `tests/billing.test.cjs`,
`tests/billingAccess.test.cjs`, `tests/invoiceFiles.test.cjs` and
`tests/ublInvoice.test.cjs` pin it, and a Playwright spec drives it.

</details>

**Workload and capacity** - utilization and skills.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d88662d69c212650a7ed5d0ab82d69262a2c6690">Billable utilization against a target, and placeholders that list who has the skill</a>. Thanks to xet7.</summary>

Under each person, the billable hours they logged against the hours they
had, red under their own target. Skills with levels 1 to 5 are part of a
person's working time; a placeholder that needs a skill lists the people
with it at that level or better, the most free hours first.
`tests/workload.test.cjs` and `tests/workloadAccess.test.cjs` pin it.

</details>

**Cloud Panel** - hosting many WeKan customer domains from one place.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/240f0dad935cba56618346fa0781ac1e72159af6">Customer domains, their databases, CloudFlare, Caddy, invoices and chat, and many WeKans merged into one</a>. Thanks to xet7.</summary>

Admin Panel / People / Cloud names the Cloud Panel Domain and its
SuperAdmin, as Weddy's Cloud Panel does. At that domain, `/cloud` keeps the
customer domains in a table: each has its own WeKan container and MongoDB
database, or shares this WeKan as an Organization claiming the domain.
Import into this WeKan merges a domain's own database into this one, its
accounts matched by e-mail address, so ten containers and ten databases
become one of each. The SuperAdmin records the hosting invoices, which each
customer sees with whether and when they were paid; a chat per domain takes
earlier Rocket.Chat and SandChat conversations. CloudFlare DNS records and
Caddy routes are written from the table. The panel answers only at its own
domain; passwords and the CloudFlare token never reach a browser.
`tests/cloudPanel.test.cjs` and `tests/cloudPanelAccess.test.cjs` pin it.
See [Cloud Panel](docs/Features/Admin-Panel/Cloud-Panel.md).

</details>

**Website** - websites as boards, and boards as websites.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2e8549032ea4b44e90a96eb53a4e1941f53a5261">Import and export WordPress, Ghost, Blogger, static and HTML sites; the board as a website</a>. Thanks to xet7.</summary>

A new Website group in Import and Export reads and writes WordPress's WXR
and REST JSON, Ghost, Blogger, a Markdown site of Hugo, Jekyll, Eleventy or
Astro, a plain HTML site or Medium's export, and reads Substack's. Pages
and posts become cards by status, with their content as Markdown, labels,
comments and images. Board View / Website shows the board as that website,
built from its own cards and attachments, and a public board can open in
it, so visitors see the site at the board's address. No script of a site
reaches a card, and none of a card reaches an exported site.
`tests/websiteFormat.test.cjs` and a Playwright spec pin it. See
[Website](docs/Features/Board-Sidebar/Board-Settings/Import-Export/Website/Website.md).

</details>

- [The comment-stripping loop and the script checks as the code guards read them](https://github.com/wekan/wekan/commit/fcc8f19fe41a3b73e6d6ce8290e3450338bf7d14). Thanks to xet7.

and fixes the following bugs:

**Budget and billing, Workload and the Cloud Panel** - faults their own tests
found, on a real database and in the browser.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d88662d69c212650a7ed5d0ab82d69262a2c6690">Crediting an invoice works on a real database</a>. Thanks to xet7.</summary>

The invoice schema allowed draft, sent, paid and void but not credited, so
the credit note's update of the invoice was refused by collection2; the
tests ran on in-memory collections that check no schema. A test now reads
the schemas and requires every status, line kind and decision the server
writes to be one of them.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d88662d69c212650a7ed5d0ab82d69262a2c6690">The workload report uses each person's own working time</a>. Thanks to xet7.</summary>

`capacityOf` validated the stored document, with its `_id` and `userId`, as
if it were a form; the unknown fields failed it, and the report fell back to
37.5 hours a week for everybody. It now reads only the capacity's own fields.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1032b472f3264e82c1cb860e59ebda3719f374ef">Saves show their result, the Cloud Panel's forms render and invoice PDFs print</a>. Thanks to xet7.</summary>

Running the pages' Chromium specs through `build.sh` found five faults. Budget
and billing read the current template data inside a promise, where there is
none, so nothing refreshed after a save; it uses its own instance's data, and
refreshes only the saved board without the spinner and without running into
the rate limit of the board list. Workload's refresh showed the spinner that
replaces the capacity form, so its "saved" note never stayed; the spinner is
for the first load only. The Cloud Panel passed functions to its forms as
`done=done`, which Spacebars calls, so the forms got a result instead and did
not render. The app-wide form styles hid the checkboxes of all three pages.
And pdfkit looked for its standard font in the bundle and failed; it is given
the bundled font. `tests/templateDataInPromise`, `spacebarsFunctionArgs` and
`nativeCheckboxesShown` find each shape anywhere in the client.

</details>

**Website** - the board shown as a website at its public address.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd7836e99cd93b7bd01d71845ceebffa1701cb9d">A visitor who never chose a view sees the board's own default view</a>. Thanks to xet7.</summary>

The browser's fallback, Swimlanes, was handed to the view resolver as if the
visitor had chosen it, so a public board set to Website showed its kanban to
everybody. Only a view somebody chose overrides the board's default now;
`tests/boardViewSettings` pins it.

</details>

**Attachments** - the attachment REST API.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b3a1ba762c5d05f12ad6a1a6d4d7747c3f076e29">Copy and move answer a JSON body again</a>. Thanks to xet7.</summary>

`express.json()` in `server/apiMiddleware.js` reads a JSON body before any
route runs, and the attachment routes then waited for a request end that had
already happened; copy and move answered only at their 30-second timeout. The
parsed body is handed to the routes' own listeners.
`tests/attachmentApiParsedBody` fails when a server file waits for a body a
parser may already have read.

</details>

**Checklists** - copying one to another card.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/131260b5bc531f7cbd6eb691ecd582a4d00e6d6f">Copy Checklist copies again</a>. Thanks to xet7.</summary>

A copy carried the author's `userId`, which the insert hook stores but neither
schema has, and the server refused it, so Done did nothing. The copy builders
leave it out, and `tests/checklistTemplateCopy` requires every field of a copy
to be in its schema.

</details>

**Menus and accessibility** - group headings and the Board View menu.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91fea6e50df62a0faa13f22fe6f17d5ab633f5da">Group headings are readable and the Board View menu fits the window</a>. Thanks to xet7.</summary>

The Import list's and the Board View menu's group headings had 4.48:1
contrast where small text needs 4.5:1; they are darker. Long option menus are
up to 1200px wide, four columns on a 1280px screen, so the grouped Board View
menu no longer runs below a 720px-high window. Two browser tests follow
renamed labels: "Memory usage", and Taiga's Blocked on the card's flow field.

</details>

**Move and copy pickers** - how boards, swimlanes and lists are named in them.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc5bf3c25edef7063f5bbf706611944719e06473">Board, swimlane and list options show the name without a number in front</a>. Thanks to mimZD and xet7.</summary>

Issue [#6135](https://github.com/wekan/wekan/issues/6135) was closed by
[an earlier fix](https://github.com/wekan/wekan/commit/fe4d2a56f2ab1f147faa683980bdbbe3b7593268),
which took the "3. " prefix out of the card move/copy popups and added a
`boardOptionLabel()` helper that nothing called. The list move/copy picker, the
multi-selection move/copy picker, the
add-list position select and the restore-from-archive pickers kept
`{{add @index 1}}. {{title}}`, so a board whose name starts with a digit was
still hard to read there and typing a name's first letter did not jump to it.
They now show the name alone; the unused helper and the Blaze helpers `add`
and `increment`, which only those numbers used, are removed.
`tests/optionLabelsStartWithName.test.cjs` pins the pickers to their names and
fails on any option in the tree whose label starts with an index number.

</details>

**Brute-force lockout** - when it is configured in Meteor.settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f9fc2e9573b0854eec90b37147861a8293a1566">The lockout starts when Meteor.settings configures it</a>. Thanks to xet7.</summary>

The wekan-accounts-lockout README documents
`Meteor.settings['accounts-lockout'].knownUsers` and `.unknownUsers` as objects
that override the configured values. Both counters applied them with
`settings.forEach(function ...)`: an object has no `forEach`, and in a function
callback `this` is undefined, so with either shape `startup()` threw before it
hooked into Accounts, and nothing awaited it to notice. The two counters now
share `src/lockoutSettings.js`, which merges a plain-object override and
checks the values once; `tests/lockoutSettings.test.cjs` runs the README's
settings. This is a configuration that never worked rather than an attempt
anyone made, so there is nothing to record in Admin Panel → Problems.

</details>

and removes code nothing used, and shares code that was copied:

**Code nothing loads** - files, helpers and copies outside the app's import
graph.

- [popup.jade at the repository root and migrations/009_fix_v795_due_dates.js, which nothing loaded, are removed](https://github.com/wekan/wekan/commit/b8734a8630742aad33633d0e24320c993a3a3976). Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/23c81e0b6c0a5c4a2ce0ddd846936b304fb24ec1">Tests drive the code the app runs, not copies of it that nothing loads</a>. Thanks to xet7.</summary>

Ten modules were reached only from tests. The copies are gone and their
tests read what runs: the OAuth2 client-secret JWT is the wekan-oidc package
file, the #5439 scrollbar rules are read from `list.css`, the
`createListAfter` check pattern is read from `server/models/lists.js` and run
by Meteor's `check` rules, the #5910 comment search is read from the
publication, and the #6081 counter's unused helper is removed. The checklist
hide helpers and the subtask picker checks are now called by the app, and five
re-export files only tests imported are removed.

</details>

**Shared code** - one copy of what several files had written out.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb4a01393987107dd656edfd6bc104372a31a493">Collection schemas share one createdAt and one modifiedAt autoValue</a>. Thanks to xet7.</summary>

34 schema files wrote the same two functions 65 times in five spellings. They
are `createdAtAutoValue` and `modifiedAtAutoValue` in
`models/lib/schemaTimestamps.js`; `tests/schemaTimestamps.test.cjs` runs both in
SimpleSchema's insert, upsert, update and validation contexts and fails when a
schema writes one out by hand again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb0df61e7f9681379491dc45431b7373271e7614">The autolinks are one package, shared by the app and the markdown package</a>. Thanks to xet7.</summary>

The markdown package cannot import app code, so it carried its own copies of
the #3069, #1463 and #2453 autolinks, kept in step by tests that compared the
source text. They are now `@wekanteam/autolink` in `npm-packages/autolink`, a
`file:` dependency both load. An older, unused third sanitizer config,
`client/lib/secureDOMPurify.js`, is removed as well.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27c3716f3d150fb63ab07b2c476cc8c7279196ed">Attachment APIs, file routes and storage strategies share what they had copied</a>. Thanks to xet7.</summary>

The size limits and board write check of the attachment methods and REST
routes are `server/lib/attachmentApiAccess.js`; the Content-Disposition
functions of the file routes are `server/lib/contentDisposition.js`; the three
storage strategies' download handler is the base class's, still failing closed
with a 404; and Attachments and Avatars read an upload's id and name with
`uploadNameParts()`. The AssignedBleed and fail-closed tests now read the
shared code and fail if an API or a strategy brings its own copy back.

</details>

- [A swimlane titled Default is shown by one function instead of five copies](https://github.com/wekan/wekan/commit/c1a89b98fdaf115204f245b89fd665f498969357). Thanks to xet7.

and updates the documentation:

- [README and docs name Workload and capacity, Budget and billing, the Cloud Panel and Website](https://github.com/wekan/wekan/commit/2ba61536176a29ed853d0a99867f29a7e18a30a1):
  the README's feature list, the feature index by menu and Newest features.
  Thanks to xet7.

and improves the following translations:

**Translations** - each locale in its own language.

**Languages updated:** Venda, Klingon, Aymara, Setswana, Luxembourgish, Sindhi,
Northern Sami, Hawaiian, Sardinian, Sinhala.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c039243a12508ab9a4e16ec8734349b7464c70e0">English behind a label replaced by translations in eight languages</a>. Thanks to xet7.</summary>

646 values were the English source with a word of the language in front of
it - "Aymar aruna: Actions" 480 times in Aymara, "Tshedimosetso: ..." 116
times in Setswana, a few in Luxembourgish, Sindhi, Northern Sami, Hawaiian,
Sardinian and Sinhala. Each is now translated into the language of its
file. `tests/prefixedEnglishValues.test.cjs` reads every value of every
locale and fails on that shape.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae081a430c317f49c7ca3a22e4d06ffa12864a2a">Venda and Klingon translations hold only Venda and Klingon</a>. Thanks to xet7.</summary>

The Venda file had been seeded partly from Zulu and Xhosa and used Venda
"thutha" (moving house) for delete; the Klingon file had French, German and
English. Every value of both was reviewed against the English source: 579
Venda and 401 Klingon values are rewritten in their own language, with one
word for each recurring term. `tests/vendaKlingonOwnLanguage.test.cjs` fails if
another language comes back.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.25 2026-11-21 WeKan ® release

**In short:** **CodeQL** alerts #605-#610 in the **OneNote** and **Sandstorm
grain** formats are fixed: comments in imported HTML are removed to a fixed
point, SandChat user ids come from a cryptographic generator, and the guards
that missed these shapes now find them anywhere in the tree.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

**Imported HTML** - how the OneNote and WordPress readers remove what is not
text.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f5e4f3f14adb42af5eb486fb393ec143833e392">Alert #606: a OneNote page's comments cannot splice a script back together</a>. Thanks to GitHub CodeQL and xet7.</summary>

`models/lib/onenoteApiFormat.js` removed `<head>`, `<style>` and `<script>`
in a loop, and only then comments, declarations and processing instructions,
once each. So `<scr<!---->ipt>alert(1)</scr<!---->ipt>` became a script after
the element loop had finished, and `alert(1)` reached the card as text
(CWE-116).
All four removals are now one loop to a fixed point.
`tests/onenoteApiImport.test.cjs` imports that page and a comment spliced from
two halves and gets only the page's text. The negative case is an ordinary page
with an escaped `&lt;!--`, which keeps all of its text.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cc4a494185bcb947a4195830887c2bf72a0a98e0">Alerts #609 and #610: a OneNote page's removals are one replace, as CodeQL needs</a>. Thanks to GitHub CodeQL and xet7.</summary>

The fix for #606 above looped the four removals to a fixed point, but as a
chain, `x = x.replace(A).replace(B)`. CodeQL exempts a removal only when its
own result flows back into it, so the value between two removals still
counted as unsanitized ("may still contain `<!--`", "`<script`"); four
assignments in a row were no better, checked with CodeQL 2.27.5. The patterns
are now one regex of alternatives in the loop, which CodeQL reports nothing
for. A declaration is `<![^<>]*>`, so it cannot swallow the start of a comment
after a stray `<!-` - the splice test caught that. The guard
`tests/tagStrippingFixedPoint.test.cjs` had accepted the chain; it now accepts
only `prev = x;` and one `x = x.replace(...);` in the loop, flags the old
OneNote lines exactly, and has fixtures for a chain, several assignments and
one replace of alternatives.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f5e4f3f14adb42af5eb486fb393ec143833e392">Alert #607: a WordPress post's comments are removed until none is left</a>. Thanks to GitHub CodeQL and xet7.</summary>

The WordPress grain reader in `models/lib/sandstorm/grainApps.js` removed
`<!-- ... -->` once, so `<!-<!-- x -->- y -->` was a comment again. It now
loops to a fixed point, and `tests/sandstormGrain.test.cjs` imports a post
that opens with that comment. `tests/tagStrippingFixedPoint.test.cjs` now
refuses a one-pass comment or `<!...>` strip in any tracked file, and its
detector fixtures show a one-pass strip caught and a loop accepted. Both alerts
are about import parsing, where no attempt can be told apart from an odd
document, so neither is recorded in Admin Panel → Problems.

</details>

**Sandstorm grain export** - what WeKan writes into the grains it exports.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f5e4f3f14adb42af5eb486fb393ec143833e392">Alert #605: SandChat user ids come from Web Crypto, not Math.random</a>. Thanks to GitHub CodeQL and xet7.</summary>

A SandChat grain's `users.uid` identifies a user, and it was 32 hex digits
from `Math.random()`, whose output predicts the rest of it (CWE-338). It now
comes from `crypto.getRandomValues` in `models/lib/sandstorm/randomHex.js`,
two hex digits per byte, so there is no modulo bias. The test reads the uids
back from two exports: 32 hex digits each, none repeated. The negative test
refuses `Math.random` anywhere in the Sandstorm grain code. Admin Panel →
Problems has nothing to record: this changes what an export contains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f5e4f3f14adb42af5eb486fb393ec143833e392">Alert #608: the EtherCalc header has no replace of a newline with itself</a>. Thanks to GitHub CodeQL and xet7.</summary>

The SocialCalc save header ended with `.replace(/\n$/, '\n')`, which does
nothing (CWE-116). It is removed, and the test pins the exact header with its
one newline before the first part. `tests/noIdentityReplacement.test.cjs`
missed this shape because it did not accept `\n`-style escapes in a pattern.
It now compares them as the characters they are, and its negative samples
check that removing a newline, or turning CRLF into LF, is not reported.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.24 2026-11-21 WeKan ® release

**In short:** Six more of **Microsoft**'s tools are imported and exported under
the Microsoft heading: **Azure DevOps Boards**, **Microsoft Lists**,
**Microsoft Project** (XML), **Outlook** (.msg in, .eml out), **Teams** and
**OneNote**, the last two also fetched from Microsoft Graph. **Sandstorm** grain
backups of twelve apps are imported and nine exported, and **Vietnamese** no
longer shows Malay text.

This release adds the following new features:

**Microsoft** - six tools of Microsoft's, each read from what it exports and
written as what it imports, with tests and the instruction in every language.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01e88410cd7440b26c5f845d98ae058f93c16a85">Azure DevOps Boards: a query's CSV is imported, and a board exports as its CSV import</a>. Thanks to xet7.</summary>

Board Column (or State) becomes the lists and Board Lane the swimlanes; a tree
query's Title 1, Title 2, ... columns become parent and child cards,
`Name <address>` people the owner, regional dates are read day first when they
have
to be, and the other columns become custom fields. The export is the file
**Import from CSV** reads: new work items whose type and State come from a
label and a list named after the built-in processes' types and states.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01e88410cd7440b26c5f845d98ae058f93c16a85">Microsoft Lists: a list's CSV is imported, and a board exports as a CSV Lists makes a list of</a>. Thanks to xet7.</summary>

The Status (or Progress) column - the one a list's board view groups by -
becomes the lists, with the items' people (also SharePoint's `;#` form), dates,
tags and the other columns as custom fields. SharePoint's own columns are
reported. The export is the CSV **New list → From CSV** reads.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01e88410cd7440b26c5f845d98ae058f93c16a85">Microsoft Project: its XML plan is imported, and a board exports as a plan Project opens</a>. Thanks to xet7.</summary>

MSPDI XML: summary tasks become swimlanes, tasks cards in Not started, In
progress or Completed, with dates, notes, resources, subtasks and predecessors.
A small XML reader of WeKan's own reads it and never resolves a DTD or an
entity; the negative test feeds it an external entity and gets the text back
unexpanded.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01e88410cd7440b26c5f845d98ae058f93c16a85">Outlook: .msg files are imported as mail, and a board exports as .eml files</a>. Thanks to xet7.</summary>

The Compound File Binary format and the message's properties are read without
a library - subject, sender, recipients, time, ids, body and attachments - and
go through the mail import, so replies join their thread in Board View / Email.
A `.zip` of `.msg` and `.eml` files is read too. Tested with `.msg` files
written by a Compound File writer in the test, and checked against files saved
by Outlook.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01e88410cd7440b26c5f845d98ae058f93c16a85">Teams: chats and channels are fetched from Microsoft Graph or read from an export</a>. Thanks to xet7.</summary>

Graph chat messages, the Teams Export API's file and the personal export's
`.tar` become cards in Board View / Chat, the messages and replies their
comments, with files as links and reactions. A board exports as Teams chats of
Graph chat messages, which the migration API takes and WeKan reads back.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01e88410cd7440b26c5f845d98ae058f93c16a85">OneNote: a notebook is fetched from Microsoft Graph, and a board exports as OneNote pages</a>. Thanks to xet7.</summary>

Sections become lists and pages cards, with the page's text, its to-do boxes as
a checklist and subpages as subtasks. The export is a `.zip` of pages in the
XHTML Graph's create page takes, with `onenote.json` that WeKan reads back.
Both Graph clients refuse a next link that leaves graph.microsoft.com, and
have live tests in `releases/live-tests/`.

</details>

**Sandstorm** - the grain backups of Sandstorm apps, read and written in
each app's own storage, under a heading of their own.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f3f6cc5a83df1b91a40d6afae261a74cf5b6507">Sandstorm grain backups are imported, and for nine apps exported as a grain Sandstorm restores</a>. Thanks to xet7.</summary>

A grain backup's metadata, a GrainInfo Cap'n Proto message, is read and
written without a Cap'n Proto library, and each app's data is read from its
own storage: WeKan's FerretDB SQLite, Prioritize's JSON, Yet Another TODO list's
and SandChat's SQLite, μTodo's bitcask log, EtherCalc's SocialCalc sheets,
Radicale's calendar and address book, Davros' files and Hacker CMS's Jekyll
site, all of them also written back; Gogs' issues and WordPress's posts and
pages are imported only, as their grains are whole installations. Rocket.Chat,
Text Editor, SandForms and Piwik keep their data in MongoDB's or MySQL's own
files: such a grain is refused with that reason, and a grain of another app
than the one chosen says which app it is. The readers were run on real grains
of every app; `tests/sandstormGrain.test.cjs` makes its own.

</details>

- [EtherCalc's escaping is one pass, and Hacker CMS's title pattern allows end-tag attributes](https://github.com/wekan/wekan/commit/c28f6de37891cb25197651a9bef1a60bd0012e4a). Thanks to xet7.

and fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/20c67216fe627eedc72a02c3536aef8024aabb8c">Outlook and OneNote exports: the files are written after the export boundary</a>. Thanks to xet7.</summary>

The export boundary passes every string that looks like markup through the
HTML sanitizer, and both exports wrote their files before it: the OneNote pages
lost their `<html>`, `<head>`, `<title>` and `<meta>`, and an `.eml` file's
`Message-ID: <...@wekan.invalid>` read as a tag and was removed. The
formatters now return plain values and the files are written from the checked
values, as Vikunja's archive is; the negative tests, which run the export
through the boundary with a sanitizer that removes every tag, fail with the
previous code.

</details>

and the following translation:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02b101ad88f7f845212b280d037b6a12e7a88c37">Vietnamese: comments and 282 other strings are Vietnamese, not Malay</a>. Thanks to xet7.</summary>

vi and vi-VN were partly seeded with Malay and Indonesian - "Komen" for
Comments, "Hapus komen?", the colours, Planning Poker, the minicard settings,
the Node heap statistics, the e-mail templates and more. They are Vietnamese
now, with the words the files already use. `tests/vietnameseNotMalay.test.cjs`
fails on a Malay or Indonesian word in either file and on a placeholder that
differs from English.

</details>

and updates the documentation:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f022b8af6615b8b5ee9e0c968cdbc64c73112bb">README and feature docs list what WeKan has now, by its menus</a>. Thanks to xet7.</summary>

The README's import and export lists follow the headings of the Import page
and the Export menu, its Board Views the Board View menu's six headings; the
feature docs' newest features, the Import / Export overview, Board Settings and
the docs index have the new tools and the current counts - 78 import sources
and some sixty export formats.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.23 2026-11-20 WeKan ® release

**In short:** The **Import** page and the **Export** menu list a company's
products under the company's name: **37signals**, **Atlassian**, **Google** and
**Microsoft**.

This release adds the following new feature:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa28e3fba81f3f5eafc8cb7044133cc330e12b80">Import and Export list a company's products under the company's name</a>. Thanks to xet7.</summary>

A company with more than one product has a heading of its own right after
WeKan: 37signals (Basecamp, Fizzy), Atlassian (Trello, Jira), Google (Takeout,
Tasks, Keep) and Microsoft (Planner, To Do, Excel, GitHub). Under it the
products drop the company's name, so it reads Planner rather than Microsoft
Planner. A company with one product stays under the heading of its kind. The
table is `models/lib/toolGroups.js`, shared by both pages;
`tests/toolGroups.test.cjs` pins the headings, the shortened names, and that no
company group heads a single product.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.22 2026-11-20 WeKan ® release

**In short:** Repeating tasks of **Taskwarrior**, **Microsoft To Do**,
**Todoist**, **TickTick**, **Tasks.org**, **Vikunja**, **Super Productivity**,
**iCalendar**, **Org mode** and **Obsidian Kanban** now repeat in WeKan, and
their exports write the repeat back. **Release All**
builds and pushes **wekan**, **wekan-ondra** and **wekan-gantt-gpl** to every
Snap Store channel, and **Release All Missing** adds what a release lacks,
snaps included. A **WeKan board** imported from its own export keeps all of
its Board Settings and card fields, and **Rocket.Chat** and **Fizzy** are
imported and exported.

This release adds the following new features:

**Import and Export** - repeating tasks, the rest of an Org heading, and every
column of a table.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24ac6b2bd2e55323fa1c6e52eb53ff3291fc80fb">A daily, weekly or monthly repeat becomes the card's recurrence, and is exported back</a>. Thanks to xet7.</summary>

WeKan cards can repeat daily, weekly or monthly, but no import set it and no
export wrote it: seven formats reported a repeat as lost and imported the task
once. `models/lib/recurrenceMap.js` reads iCalendar and TickTick RRULEs,
Taskwarrior `recur`, Org repeaters, Obsidian's and Todoist's "every week" and
Microsoft To Do patterns, and keeps a rule only when it is exactly daily,
weekly or monthly; every two weeks, yearly or a count stays in the import loss
report. An imported repeating card counts its last occurrence from the import,
so the recurrence job does not copy every card at once; of Taskwarrior's
instances only the newest open one repeats. The exports write it back
(Taskwarrior, Org mode, Obsidian Kanban, TickTick, the iCal feed), and the WeKan
JSON import keeps it. `tests/recurrenceMap.test.cjs`, with negative tests.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/878e53f418c2416796b5af00876ada7cc87a4161">Tasks.org, Vikunja and Super Productivity repeats become the card's recurrence too</a>. Thanks to xet7.</summary>

The Tasks.org RRULE and Vikunja's repeat_after (a day, a week) or repeat_mode
1 (monthly) are imported and written back; a Super Productivity task's repeat
config of every 1 day, week or month is imported. Other rules, and the repeat
of a finished task, stay in the import loss report. Google Tasks' API has no
repeat to read.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/55c3f574f4d0ba3fce3e507679b8c9d467feea46">Org mode keeps every property, uses :ID: as the card's reference and LOGBOOK clocks as its spent time</a>. Thanks to xet7.</summary>

Only :CREATED: was read from a heading's property drawer; the other
properties and the :LOGBOOK: drawer were dropped without a word in the import
loss report. Every other property is now a custom field, written back as a
property on export, and the closed CLOCK lines add up to the spent time. An
open clock, a malformed property line and any other drawer are reported.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b9fa791a82da0bcaa01e5b04f8e711c011580db">CSV, TSV and Excel imports keep every column, a column with no card field as a text custom field</a>. Thanks to xet7.</summary>

A column the header guess had no field for was imported only when ticked in
the mapping step, and dropped without a word otherwise - always for a REST
import. Every other named column now becomes a text custom field of its name,
ticked by default on the page; WeKan's own Number, Last activity and Voting
columns are not.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/95b88095c45bf582a2fdc3056cf5030f0b61e57a">OPML keeps created, category, links and an outliner's own attributes</a>. Thanks to xet7.</summary>

A card outline's created date, its categories, a link and any attribute of
the outliner's own (OmniOutliner's columns) were dropped or only reported.
Now they are the creation date, labels, a link in the description and custom
fields; the export writes created and the labels as category. An attribute of
a list or a checklist item is reported.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3be07b147b46bcbe42f64da1170eda5fafcfe2ad">Leo keeps a card's creation date in its node id, both ways, and reports plugin data</a>. Thanks to xet7.</summary>

Leo stamps a node's id with the time it was made, and WeKan read it only as a
key and wrote ids without a time. The import now takes the creation date from
the id and the export writes it there; a Leo plugin's own data on a node is
reported instead of dropped.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/10caa20b094beae76ce941e609c7f130e6dd7d5f">Markdown reads and writes #tags, due dates and indented checkboxes as labels, due dates and checklists</a>. Thanks to xet7.</summary>

The import kept only a card's title, done mark and indented text, and the
export wrote no labels, dates or checklists. #tag words, Obsidian Kanban's
@{day} @@{time}, Obsidian Tasks' 📅 and todo.txt's due: are now labels and the
due date, and indented checkboxes the checklist, both ways.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f467e31d176a2be66cfffecd87d9ac9938ff0d93">Slack, Mattermost, Telegram and Discord reactions become the imported comments' reactions</a>. Thanks to xet7.</summary>

Every reaction in a chat export was dropped without a word. An emoji, or a
Slack or Mattermost shortcode, is now kept as the comment's reaction for each
person mapped to a WeKan user; the loss report counts the reactions of people
not mapped and those of an emoji WeKan cannot store, such as a server's own
emoji or a skin tone.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1122e49ca96930ac19f0431b514f68f7716da45a">Chat imports keep threads: a reply is a reply to the comment of the message it answers</a>. Thanks to xet7.</summary>

Slack, Mattermost, Telegram and Discord say which message a reply answers,
and the import made each reply a comment of its own. It is now a reply to that
comment, one level deep as WeKan's replies are; a reply to a message that is
not in the file stays a comment marked "↳".

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/28891103f6bec2d51e1dd1531103235d95a1a70c">Kanboard keeps its task recurrence, estimate, score, reference and external links, both ways</a>. Thanks to xet7.</summary>

WeKan's card recurrence was modelled on Kanboard's, and the import ignored it.
A repeat every 1 day, 7 days or 1 month now makes the card repeat, the
estimate, score and reference are custom fields, and external links are lines
of the description; the export writes them back.

</details>

- [Nextcloud Deck labels keep their colors instead of coming in black](https://github.com/wekan/wekan/commit/22d000b9136b11a4f8030d0e5d42e77518a70f64). Thanks to xet7.
- [OpenProject imports remaining time and exports spent time, which a round trip lost](https://github.com/wekan/wekan/commit/9bd503a71b22cfcf46c6e75e159c5bf0f5417331). Thanks to xet7.
- [ClickUp and GitLab exports write spent time, which their imports read and a round trip lost](https://github.com/wekan/wekan/commit/14afc74adbb6659ee3a8f57ebe84999b439557c6). Thanks to xet7.
<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a02de4b5b398018bbe2076d98cba10b01639e5a">Exports are held to what their imports read back; Asana time, Deck done ticks, Kanboard colors survive</a>. Thanks to xet7.</summary>

A new test exports a card with every field set in 32 formats, reads the file
back and holds each format to what it keeps of dates, spent time, the done
tick, recurrence, people, custom fields and color. It found Asana's time
tracking read and written by neither side, Deck's done tick lost without an
end date, and Kanboard colors not written; all three are fixed.

</details>

- [Asana's html_notes, approval states and comment likes come across](https://github.com/wekan/wekan/commit/57a657445ef63cc979530f04585227d778c01845). Thanks to xet7.
- [Planka 2 custom fields and stopwatch time come across](https://github.com/wekan/wekan/commit/0d65eec4f2f36ba6df3b0fcf2d26aa023a02fa75). Thanks to xet7.
- [Imported subtasks keep their due date and person on the checklist item (Google Tasks, KanbanFlow)](https://github.com/wekan/wekan/commit/cf6f67e789ac404866d4b51591820570850baaa3). Thanks to xet7.
- [Basecamp card steps keep their due date and assignee](https://github.com/wekan/wekan/commit/a72b29726821301db304b4120bcc21566650202a). Thanks to xet7.
- [Notion relations between rows of an export become "related to" dependencies](https://github.com/wekan/wekan/commit/f546ff238345dd267e568d75ce1fe25bf4fdbbb7). Thanks to xet7.
- [ClickUp custom field columns come across both ways, and the task link is kept](https://github.com/wekan/wekan/commit/60f569afe679ffcf6bdfe36f16d4d2bb42f07502). Thanks to xet7.
- [Todoist and TickTick imports report a column they do not write, instead of dropping it](https://github.com/wekan/wekan/commit/c72a05d11a7527a0b0cb1855de8609de4217faa2). Thanks to xet7.
- [Taiga's blocked state is the card's Blocked flow field, both ways](https://github.com/wekan/wekan/commit/ab884547f44913cb5269b8248e6301b4983a43c0). Thanks to xet7.
- [Linear cycles become Scrum sprints and project milestones Scrum releases](https://github.com/wekan/wekan/commit/75694ac644d71016b092c0543a62fb63aef817ee). Thanks to xet7.
- [Telegram and Discord imports bring their message files from a zipped export folder](https://github.com/wekan/wekan/commit/828ca63713b0a034c9e1c436341cd60435c01443). Thanks to xet7.
- [Slack import downloads the messages' files with a Slack token, from Slack's file host only](https://github.com/wekan/wekan/commit/dd8242b82ffe97bb760471a3677550632d72a4d8). Thanks to xet7.
- [Super Productivity export writes a repeating card's repeat config, so it repeats there too](https://github.com/wekan/wekan/commit/35f3f6c9dbec5de87e1181956ed7bf71c30a2f12). Thanks to xet7.
- [GitHub, Gitea and Forgejo keep an issue's dates, people and Gitea's time estimate, both ways](https://github.com/wekan/wekan/commit/efeb55f57a903a80ab7b6ee124a87f9ce39bdf00). Thanks to xet7.
- [GitHub's issue type is kept as a "type:" label](https://github.com/wekan/wekan/commit/9ceb4dbf55ecb2518c64d449b9d6d06703b961a9). Thanks to xet7.
- [GitLab issue health status and incident severity are kept as labels](https://github.com/wekan/wekan/commit/c916b154731084d1a9e7674852575a205ff68a66). Thanks to xet7.
- [Planner imports read the newer "Export as Excel" column names too](https://github.com/wekan/wekan/commit/d3aa34e7b8f5d579fabb0e4df9f06710493fd1f2). Thanks to xet7.
- [GitHub, Gitea, Forgejo and GitLab imports count reactions in the loss report, which are counts without who reacted](https://github.com/wekan/wekan/commit/1b9ec7b9a1ba12f83969379ec059dd9bd5ec5c3a). Thanks to xet7.

**Rocket.Chat and Fizzy** - two more tools, imported and exported.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dffbafd30fd16978dbae49a4e0d576bb1ff017ec">Rocket.Chat exports are imported for the Chat view, and a board exports for its CSV importer</a>. Thanks to xet7.</summary>

Read from Rocket.Chat's source: "Download my data" as JSON is a .zip of
`channels.json` and a message file per room with the files under `assets/`;
one room's `.json` and the .zip its CSV importer reads are imported too. A room
is a card in Channels, Groups, Direct messages or Omnichannel, its messages the
comments, its files the attachments; system messages and missing files are
counted. The export writes `users.csv`, `channels.csv` and a `messages.csv` per
card, with no header rows and names Rocket.Chat accepts.
`tests/chatExportFormats.test.cjs` reads both zips and round-trips the export.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dffbafd30fd16978dbae49a4e0d576bb1ff017ec">Fizzy's account and personal data exports are imported, and a board exports as its account export</a>. Thanks to xet7.</summary>

Read from Fizzy's source (37signals). A Fizzy board is a swimlane, its columns
lists between Maybe?, Not now and Done; tags, assignees, steps, comments,
golden cards and files come along, drafts and reactions are counted. The
export is `data/<table>/<id>.json` with every column Fizzy's account import
requires, base36 UUIDv7 ids and only users of the export, so Fizzy reads it
back. `tests/fizzyFormat.test.cjs` checks those columns and round-trips it; the
Playwright round trip sends it through the server.

</details>

and fixes the following bugs:

**WeKan import** - a board exported and imported back.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c640c5c376526f6550873b757fa6b68511c63d42">A WeKan board imported from its own export keeps every Board Settings choice and every card field</a>. Thanks to xet7.</summary>

The export writes the whole board and its cards, and the import wrote 32 of
the 210 board fields and about 30 of the 87 card fields: every Board Settings
choice came back at its default, and cards lost their flow fields, votes,
planning poker, stickers, locations, drawings and more. They are all written
now, users mapped to the new board's; access and inbound email are left to
the new board's admin, and a value the schema refuses is reported.
`tests/wekanCardFields.test.cjs` holds the lists to the schemas.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24b6b9b0247bf1cda039faec6dba9298f9115116">It also keeps the lists' WIP limits and policies, checklist settings, custom field access and comment replies</a>. Thanks to xet7.</summary>

A list lost its WIP limit, flow policy and split, a swimlane its height, a
checklist its hide settings and reset schedule, an item its assignee, a reply
its comment - and a custom field its "admin only" and "read only", which left
it open to everyone on the imported board. All of them come back now; a list
role exception is kept only where it restricts a role.

</details>

- [Templates stay templates: a WeKan template board, card, list or swimlane imports as one](https://github.com/wekan/wekan/commit/a4359731b1bed397e1616dd8289b0d437f8e7243). Thanks to xet7.

and has the following developer-facing changes:

**Snap packages** - all three snap names, on every channel.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc0a1ad049f19fd8557dfde81e2de948b601f999">Release All ends by pushing all three snaps of its release; Release All Missing makes and pushes the missing ones</a>. Thanks to xet7.</summary>

Push Snap to Store failed for v13.20: snap-variants never attached
wekan-ondra and wekan-gantt-gpl to the GitHub Release, a store-side "Error
checking upload uniqueness" was waited on for two hours instead of uploaded
again, and the workflow took "the latest release", the previous one. Now
snap-variants attaches its snaps, `releases/snap-store-push.sh` retries store
failures and fails at once on any other refusal, and Release All calls Push
Snap to Store for the tag it released. Release All Missing lists the snaps as
release assets, makes a missing variant from the release's own wekan snap
(`releases/snap-rename.sh`, name and title only), pushes the release's snaps,
and with no version starts one run per incomplete release.
`tests/snapStorePush.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ce646dc937689f4ff84049e3af9b73ebeff9ef07">Push Snap to Store releases what the store already has, each channel on its own, and uploads a file once</a>. Thanks to xet7.</summary>

snapcraft 9 renamed list-revisions to revisions, so the push never found the
revision the store already had and uploaded the same file again and again,
answered "Error checking upload uniqueness". It now reads the store's
revisions, releases one it has instead of uploading, uploads a file once,
releases to each channel on its own so one refusal does not stop the others,
and also releases the newest revision of every architecture the store holds.
A revision held for the store's manual review ("ReviewQueued") is reported
with how to ask for the review. Release All and Release All Missing run the
same steps.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.21 2026-11-20 WeKan ® release

**In short:** Twelve new **Board View reports** - Created vs. Resolved, Net
Flow, Time in List and more - and **grouped menus**: the Board View menu, the
Import and Export lists and the list, card and swimlane menus have headings.
WeKan imports **mail**, **calendars**, **chats** and **notes**, and large files
are **streamed to disk** within the free space or an Admin Panel limit. Menu
entries that did nothing now work. Cards get the **Kanban and Scrum flow
fields** Blocked, Class of service, MoSCoW and WSJF, lists their **policies**,
the board menu a **standup timer** and a **retrospective board**, every export
is **written a page at a time**, and **InviteBleed** is closed for the old
invitation codes too.

This release fixes the following CRITICAL SECURITY ISSUE of [InviteBleed](https://wekan.fi/hall-of-fame/invitebleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4fad2a9000403ae92069060eb3a4b6b53e67f658">Old six-digit invitation codes are refused, and the sign-up form is throttled</a>. Thanks to meifukun and xet7.</summary>

[GHSA-rg85-qx5c-qx67](https://github.com/wekan/wekan/security/advisories/GHSA-rg85-qx5c-qx67)
reported the invitation code brute force again. The 128-bit code of the first
fix was in place, but an invitation made before it, and not used yet, kept its
guessable six-digit code and was still accepted - a re-invite even mailed that
code again. A code shorter than the 22 characters of a 128-bit code is now
refused at sign-up and replaced by a strong one on a re-invite. The throttle was
on `createUser`, which a client is refused anyway, while the sign-up form calls
`ATCreateUserServer`: that method now takes 10 attempts a minute per address,
and each refusal is counted in Admin Panel / Problems under InviteBleed. The
same report's OIDC race
([GHSA-6944-p22h-3qpx](https://github.com/wekan/wekan/security/advisories/GHSA-6944-p22h-3qpx))
and stale impersonation export
([GHSA-j4x8-689m-h4hv](https://github.com/wekan/wekan/security/advisories/GHSA-j4x8-689m-h4hv))
were checked against the current code and were already fixed.
`tests/securityMeifukun.test.cjs` pins both places a code is looked up, sweeps
for any lookup without the strength check, and drives the throttle's Problems
record; `tests/invitationCodeEmail.test.cjs` refuses six-digit and malformed
codes and checks that a re-invite replaces them.

</details>

and adds the following new features:

**Import and Export** - mail, calendars, chats and notes, each into the view it
is for.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ccfa6cf362e9b1eb812804d38e4d85653c5b0b0a">Import mail, calendars, chats and notes, and export .mbox, .enex and Mattermost files</a>. Thanks to xet7.</summary>

The Import page reads nine more kinds of export. **Mail** (an .mbox from
Thunderbird, Apple Mail, mutt or Gmail, or one .eml) becomes cards of Board
View / Email, one per conversation, the replies its comments and Gmail labels
its labels. An **iCalendar** .ics puts tasks into To Do, In Progress, Done or
Cancelled by their status and events into Events, with their dates. A **Google
Takeout** .zip is one board with a swimlane per product - Mail, Tasks, Keep,
Calendar, Google Chat - recognised by content, since Takeout names its folders
in the account's language. **Slack**, **Mattermost**, **Telegram**,
**WhatsApp** and **Discord** (DiscordChatExporter) exports become channels whose
messages are comments, for Board View / Chat. **Evernote** .enex notes keep
their to-dos as checklists, tags as labels and reminders as due dates. The
Export menu writes a board as an .mbox, an .enex and a Mattermost bulk import
file, each read back by the same import. MIME and ENEX are decoded on the
server (mailparser, htmlparser2), the zips under the zip-bomb guards of the
other zip imports, and an imported Message-ID survives the import sanitizer so
a later reply joins its thread. The nine instructions are translated into every
language. `tests/mailFormat.test.cjs`, `icalendarFormat`, `chatExportFormats`,
`enexFormat` and `googleTakeoutFormat` run each format both ways with its
negative cases; `tests/playwright/specs/import-mail-chat-notes.e2e.js` imports
through the page and reads the result in the Email and Chat views.

</details>

**Board View reports** - twelve more reports, each with the export bar at its
top like the other charts.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63b5e089f5113960f22fc3d72e3dce3ae86981e2">Created vs. Resolved, Net Flow, Time in List, Average Age, Throughput Run, Due Date Performance and six more</a>. Thanks to xet7.</summary>

Added after comparing WeKan's charts with the reports of Jira, Azure DevOps,
Nave, ActionableAgile and the Flow Framework: Created vs. Resolved, Net Flow,
Time in List, Average Age, Throughput Run Chart and Due Date Performance under
Kanban flow; Release Burndown and Epic Progress under Scrum; Workload,
Distribution, Dependency Map and Activity Heatmap under Overview. Each draws a
Chart.js chart over its data table, and its PDF and Excel export write that
table. The calculations are pure (`models/lib/boardReports.js`) and answer one
shape, so the view and both exports read every report the same way. A member
who may see only their assigned cards gets none of them.
`tests/boardReports.test.cjs` checks each report's numbers from known cards,
including a dependency cycle and an empty release;
`tests/playwright/specs/board-reports.e2e.js` opens each from the menu and
downloads its PDF and Excel.

</details>

**Menus** - grouped under headings, as the Admin Panel is.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/257835733b0ec5d950fac6feb2e13c589219bb9d">The Board View menu and the Import and Export lists are grouped under headings</a>. Thanks to xet7.</summary>

The Board View menu and Board Settings / Board View show the views in six
groups - Board, Calendar and time, Scrum, Kanban flow, Overview, and
Communication and code - with the board's own order inside each. The Import
page and the Export menu list the other tools under the same headings from one
table (`models/lib/toolGroups.js`): Kanban and project tools, Issue trackers and
version control, Task and to-do apps, Spreadsheets and tables, Text and
outlines, Mail, calendars, chats and notes, and Fetched from a service.
`tests/boardViewMenu.test.cjs`, `tests/toolGroups.test.cjs` and
`tests/playwright/specs/board-view-groups.e2e.js` check the groups and their
order.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977">The list, card and swimlane menus are grouped under headings</a>. Thanks to xet7.</summary>

Share and history, Export and import, Add, Watch, Edit or Appearance,
Settings, Move and copy, and Archive. No entry moved or changed its
condition; each heading sits inside its group's condition, so a member who sees
none of a group sees no heading, and a heading is not clickable. The two header
bars keep their layout. `tests/menuGroupHeadings.test.cjs` and
`tests/playwright/specs/menu-group-headings.e2e.js`.

</details>

**Large files** - imports streamed to the disk, within its free space.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32c24ed84e9d6c8080e89bdd4097f87a3b0b4b04">Import page uploads stream to the server's disk, checked against the free space and an Admin Panel limit</a>. Thanks to xet7.</summary>

A chosen file is POSTed to `/api/import/upload/:source` and written to
`WRITABLE_PATH/import-uploads` a part at a time, instead of being read in the
browser and sent whole through the import method. Before the first byte the
announced size is checked against Admin Panel / Settings / Security **Largest
import** (empty: no limit) and against the free space less a reserve, and the
space again every 64 MB; a refused or interrupted upload leaves no file. Zip
exports are opened from the disk and mailboxes read a message at a time, also
inside a Google Takeout zip. `tests/importUpload.test.cjs` covers the limit,
the full disk before and during the upload and an interrupted one;
`tests/playwright/specs/import-mail-chat-notes.e2e.js` refuses a file over the
limit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b1c7ce7bb430834e024d7684734f7586a07b007">WeKan and Trello .zip imports use the same limit and disk check; .mbox and .enex export a page at a time</a>. Thanks to xet7.</summary>

The WeKan .zip and Trello package routes had caps of their own (5 GB, and
200 MB with 1 GB unpacked); they now use the shared receiver, so the limit is
the administrator's or the free disk space. The .mbox and .enex exports are
written 500 cards at a time, waiting for the socket, rather than built whole in
memory.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/640e4925935e3842e00a864057b083b6dc386031">Uploaded JSON is parsed from the file a chunk at a time; a Mattermost export a line at a time</a>. Thanks to xet7.</summary>

A JavaScript string cannot be longer than about 512 MB, so `readFile` and
`JSON.parse` could not read a larger uploaded export at all.
`server/lib/streamJson.js` builds the value as the file is read: every escape
and surrogate pair, chunk boundaries anywhere, the same value and refusals as
`JSON.parse`, a `__proto__` key as an own property, nesting bounded.
`tests/streamJson.test.cjs` compares it with `JSON.parse` on 500 random
documents in random chunks.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60bbf69164766746718c1792f228b6f2809cd715">Jira and CSV / TSV files are uploaded too; their people and columns are read on the server</a>. Thanks to xet7.</summary>

They were the last files the page read itself and sent whole. A Jira file's
people for the map-members step, and a CSV / TSV file's header, sample rows,
guessed mapping and people, now come from the server's reading of the upload
(`csvUploadPreview`, `csvUploadPeople`); each reads only the sender's own
upload, signed in and while import is enabled. `tests/csvUpload.test.cjs` and
`tests/playwright/specs/csv-upload.e2e.js`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2cbbe510457940b6db26c90b45307a6c539a0e7">Ten more exports are written a page of cards at a time</a>. Thanks to xet7.</summary>

Todoist, TickTick, ClickUp, MeisterTask, Linear, Pivotal, Redmine, Quire and
Taskwarrior exports, with todo.txt, are written 500 cards at a time instead
of as one string. What a row refers to on another page - a parent's number,
a section, a counted column - comes from a light first pass that reads no
descriptions and no comment text (`models/lib/exportPaging.js`).
`tests/exportPaging.test.cjs` checks that the pages together are byte for byte
the whole file, for every page size.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ce40b56abdf5b166f523dab98a14414907809b1f">The Markdown, Obsidian, OPML and Org mode outlines and the Notion CSV are written a page at a time</a>. Thanks to xet7.</summary>

The outlines come list by list in the board's order, each list's heading
opened before its first card and closed after its last wherever a page ends,
and a list with no cards in its place. Every page's board and list titles now
pass the export boundary, as the whole export's do. Markdown and Obsidian write
a list title once, where two lists of one name used to repeat their cards under
both.
`tests/exportPaging.test.cjs` and the 173 round trips of
`import-export-format-audit.e2e.js`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1261ef5fb9f233e60352ee28a8e4e16eb44a4c7">Leo outlines are written a page at a time too</a>. Thanks to xet7.</summary>

Leo's outline holds only titles and checklists, which the light first pass
already has, so the first page writes it whole and each page then writes its
own cards' texts after it, under the same node numbers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bad71f9a1e80f54472c87eb8605d5a4206185ea4">Focalboard and Mattermost exports are written a page at a time</a>. Thanks to xet7.</summary>

Their heads - Focalboard's board options, Mattermost's channels and users - are
named over the whole board from the light first pass and written on the first
page; each page then writes its own cards' records.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f293ae4076092a387505b1909053cd66a62441c8">Trello, Jira, Asana, Zenkit, OpenProject, GitHub, Gitea, Forgejo and GitLab exports are written a page at a time</a>. Thanks to xet7.</summary>

Each is one JSON document whose cards are one array: the first page writes the
document around it, and every page its own cards into it. Every part passes the
export boundary and the admin-only field redaction, as a whole document does.
Jira's issue keys and OpenProject's numbers are counted over the whole board,
so a card refers to one on another page. The import/export audit (173) and the
admin-only custom field specs (12) pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21c64e092d8b067a9416a09a92c0ca1424b9da26">Deck and Kanri exports are written a page at a time, each list around its cards</a>. Thanks to xet7.</summary>

The pages come list by list, and each list is opened at its first card and
closed after its last. A Deck card is in the stack of its own list by id, where
two lists of one name each carried the other's cards, and Kanri's cards of no
list are one column, where each made a column of its own.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4666bb60f42acbc2b774c1657171636b7b900767">Nullboard exports are written a page at a time too</a>. Thanks to xet7.</summary>

Its lists, the board's and one per title of a list that is not exported, are
found over the whole board, and each is written around its notes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2257442a855ce930cc3ae3a4a5b9fdb16555aa8">Teamwork and Planner workbooks are streamed a page at a time</a>. Thanks to xet7.</summary>

They are written by ExcelJS's streaming workbook writer, each row as it comes,
instead of a whole workbook in memory. Teamwork's task tree is planned over the
whole board, so each page writes its cards at their depth.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/db9c06dc5eb5d5ff76867431f969da67eb3b0676">monday.com, Businessmap and Wrike workbooks are streamed a page at a time too</a>. Thanks to xet7.</summary>

Every workbook export is now written a row at a time. The columns any card
fills, Businessmap's parents and Wrike's lane folders and keys are found over
the whole board first, so every page writes its own rows in their place.

</details>

**Cards** - Kanban and Scrum flow fields, each one hidden until a board shows
it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0071dde0f36bb7c8582073a2c072159e15f41ceb">Blocked with a reason, Class of service with Expedite's WIP limit, MoSCoW and WSJF on cards</a>. Thanks to xet7.</summary>

Four practices other Kanban and Scrum tools have, offline and with no AI
(docs/Features/Cards/Flow-Fields.md). **Blocked** keeps why, who and since
when, and puts a red badge on the minicard. **Class of service** is Standard,
Fixed date, Expedite or Intangible, and only one open card of a board can be
Expedite. **MoSCoW** is Must, Should, Could or Won't have. **WSJF** divides
the cost of delay by the job size. Each is a row of Board Settings / Card, off
until a board turns it on, and an Admin Panel card field that hides it on every
board. Only the `setCardFlow` method writes them, checking the card edit right
and the values. `tests/cardFlow.test.cjs` and
`tests/playwright/specs/card-flow-fields.e2e.js`.

</details>

**Lists** - the Kanban policies of a board's lists, and the Scrum Definition
of Ready.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ac7b916c08bb139f1090d4e87b8319aed08d324">List policies, a commitment point, a WIP limit per person and the Definition of Ready</a>. Thanks to xet7.</summary>

A list can carry its own **policy** - when a card may come in and when it is
done there - written from the list menu and shown as a gavel at its header. A
board can name its **commitment point**, the list from which work is committed
to, flagged at that list. A **WIP limit per person** makes an opened card name
each of its people holding more open cards than the limit. All three are off
until a board admin turns them on in Board Settings / List, and each is an
Admin Panel feature that hides it on every board
(docs/Features/Lists/Flow-Policies.md). The Scrum settings get a **Definition
of Ready** beside the Definition of Done, both now readable by every member in
the Scrum views. `tests/boardFlowPolicies.test.cjs`,
`tests/playwright/specs/list-flow-policies.e2e.js` and
`scrum-definition-of-ready.e2e.js`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/524946c1bf14ada5660ffde987574b8129c47732">The list policy popup asks the board's write capability</a>. Thanks to xet7.</summary>

Its edit check called each role helper as an optional call, which the
role-helper guard reads as a bare reference; it asks
`Utils.currentUserCan('write')`, as the server's Lists allow rule does.

</details>

**Scrum meetings** - a standup timer and a retrospective board, in the board
menu.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f7a4e210f0e90005bba662e7ac418b403ffa2ba">Daily standup timer and retrospective board</a>. Thanks to xet7.</summary>

**Daily standup** lists the board's members in a shuffled order and gives each
the same timebox, set in the Scrum settings, counted down and red once over.
**Retrospective board** makes a new private board with the lists Start doing,
Stop doing, Keep doing and Action items, through the same server path as Add
Board. Both are in the board menu for every member, each turned off per board
in its Scrum settings and for the instance in Admin Panel / Features
(docs/Features/Scrum/Meetings.md). `tests/scrumMeetings.test.cjs` and
`tests/playwright/specs/scrum-meetings.e2e.js`.

</details>

**Split lists** - Doing and Done in one list.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd5c207006ac1c3ac605b4689860b47205a18d80">A list split into Doing and Done</a>. Thanks to xet7.</summary>

A card of a split list marked **Done here** waits, dimmed and edged green, to be
pulled into the next list, and the list header counts Doing and Done. The mark
belongs to the list it was made in, so a card moved on is in Doing again. A
board admin allows split lists in Board Settings / List and splits a list from
its menu; Admin Panel / Features / Split lists hides it everywhere.
`tests/boardFlowPolicies.test.cjs` and
`tests/playwright/specs/list-flow-policies.e2e.js`.

</details>

**Import and Export coverage** - what each tool's files carry, tool by tool.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cde21a7651262efe00147228ea57cf67d8fdc004">The Trello export imports back, with its checklists, comments and members</a>. Thanks to xet7.</summary>

It wrote no card's last activity date or position, which the Trello import
checks for, so no Trello export imported back; its checklists and comments were
empty. Now the checklists, the comments and the board's people come along, and
`trello-export-round-trip.e2e.js` exports a board and imports it back.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c20c7296a8cd6ee2232b9cda99c20f719a2794a2">The Trello export carries the custom fields, and a Trello number field imports as a number</a>. Thanks to xet7.</summary>

One Trello field per custom field name, typed by its values, and each card's
values as Trello writes them. Trello writes a number as text, so its import now
stores a number field's value as a number.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba31f2b592f9db1de8dabaf0ea20d3bdcf4553eb">GitHub, Gitea and Forgejo exports carry the comments</a>. Thanks to xet7.</summary>

As the embedded comments the issues import reads, so an exported board imports
back with them.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ac8b802c5a6be6bfebdb4d3303625a8e1cf3484">The Trello export carries the archived cards and lists, as closed ones</a>. Thanks to xet7.</summary>

As Trello's own export does, and the import reads them back archived. Every
other format still exports the open cards, and no format a deleted one.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8330fb090c885c9d8ea015ed896c34a9b6cf251">A Trello .zip export carries the attachment files and imports back with them</a>. Thanks to xet7.</summary>

Board Settings / Export / Trello .zip writes the Trello board JSON beside each
card's attachments as files, streamed from storage, and the Trello .zip import
brings the files back with their cards, byte for byte.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d613a00030a7827d4d6318c50d6feb5d80d008ce">Jira and Taskwarrior exports carry the card dependencies</a>. Thanks to xet7.</summary>

As Jira issue links and Taskwarrior's depends, which their imports read back.
The round trip of every export now checks dependencies too: Jira, Kanboard,
Taskwarrior and Redmine keep them.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c0b3d9013d68ae4ac787655183233935766c5997">The .mbox export carries the card labels, as Gmail labels</a>. Thanks to xet7.</summary>

The mail import reads X-Gmail-Labels, so labels now come back. The round trip
of every export also checks labels and due dates.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c9da13b63e6f1fea86cb30b604093a8a120bcf53">Asana, OpenProject, Obsidian and Wrike exports carry the card dependencies</a>. Thanks to xet7.</summary>

Each import read what a task waits for and no export wrote it; now each does,
in its own format. Eight formats keep dependencies through an export and import.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd34f44460838cfacd10c678d6349f9cc5fd90a0">The Vikunja export is streamed a page at a time, and carries the dependencies</a>. Thanks to xet7.</summary>

Its .zip was built whole; now data.json is written a page of cards at a time,
numbered over the whole board, and a task's dependencies are Vikunja's blocked
relations. The round trip of every export includes Vikunja and keeps all six.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6187806cf1006bb0f00d27d5e72af9147027f0a9">The Super Productivity export is written a page at a time</a>. Thanks to xet7.</summary>

The backup is made over the whole board on every page, and each page writes
only its own cards' tasks, with their notes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9f85b51695be62df106f9c823645b10988a9a13a">The Taiga export is written a page at a time: every export now is</a>. Thanks to xet7.</summary>

The project is made over the whole board on every page, and each page writes
only its own cards' epics, stories, tasks and issues, with their text; the
tasks made of checklist items come on the last page.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df92d8de63fa332d9d287c9c97e72ac5596c0f5c">Every export WeKan also imports is round-tripped, each held to what its file keeps</a>. Thanks to xet7.</summary>

One spec exports a board in each of the 41 formats WeKan both writes and reads
and imports it back; every one brings the card back, and a table holds each to
what its file keeps of the description, the checklist and the comment.

</details>

and fixes the following bugs:

**Trello import** - a file with no members.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1be2d2131714d023a22a6ffc0a94de651dc7f4e">A Trello file with no members imports instead of doing nothing</a>. Thanks to xet7.</summary>

The member mapper read the file's members list without checking it was there,
so a board nobody else was on threw in the browser and the Import buttons did
nothing. No members is nobody to map.

</details>

**Member menu** - Edit Profile and Support do what their settings say.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/42959d02f1ea7b87512439415a9ea8187cd4e19b">Edit Profile saves a member's own new username when Username change is allowed</a>. Thanks to xet7.</summary>

With Admin Panel / People / Login **Username change** allowed, a member's new
username was not saved and the popup closed as if it had: `setUsername` wrote
only for a site admin. It now follows `setEmail` beside it - an admin renames
any account, a member their own when the setting allows it - and anything else
is refused with `not-authorized` instead of returning quietly.
`setUsernameAndEmail` needs both changes allowed.
`tests/selfUsernameChange.test.cjs` runs the methods with the collections
stubbed; `tests/playwright/specs/45-profile-email.e2e.js` saves one through the
popup and is refused for another account and with the setting off.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0ccf182001e64d1949b1cec94604cecf08537338">A signed-out visitor sees a Public Support page, and no text of one that is not</a>. Thanks to xet7.</summary>

The `/support` route sent every signed-out visitor to sign-in, so the page's
**Public** setting did nothing and the "only for logged-in users" text was
never shown - while the page's text was sent to every signed-out subscriber of
the settings publication anyway. The route is open, and a visitor who is not
signed in receives the text only when the page is Public. The support popup the
menu no longer opened is removed. `tests/supportPageSignedOut.test.cjs` and
`tests/playwright/specs/support-page-signed-out.e2e.js` check both cases,
including that the text is not in the browser.

</details>

**Card menu** - who sees which entry.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60c25690dfc2072509f0e1075e905984cb733f5f">Create board from this card is shown to members who can edit the card</a>. Thanks to xet7.</summary>

The entry sat under `unless canModifyCard`, so exactly the members the
`createBoardFromCard` method lets convert a card never saw it. It was in both
branches when it was added; a later refactor kept only that one. It is now
with the card menu's other write entries, not for Workers, when board creation
is allowed. `tests/createBoardFromCardMethod.test.cjs` checks the entry's
conditions in the template, and
`tests/playwright/specs/create-board-from-card-menu.e2e.js` that an editor sees
it and a read-only member does not.

</details>

**Board menu** - an entry that had no way in.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b00e2c81333032063bad33092181cc917911384f">All Boards Settings is back in the board menu, below Date, for board admins</a>. Thanks to xet7.</summary>

The entry was commented out for the "icons random dance"
([#4214](https://github.com/wekan/wekan/issues/4214)), which left its popup -
card counters and member avatars on All Boards, card aging, auto-archive and
personal list widths - with no way in. The All Boards tiles now read one fetch
of `getAllBoardsTileData` instead of reactive cursors, so the loop cannot
return. `tests/boardMenuOrder.test.cjs` pins its place and its board-admin
guard; `tests/playwright/specs/all-boards-settings-menu.e2e.js` opens it and
saves a row.

</details>

**Shared templates** - one choice for the whole instance, and the targets that
it allows.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c0339ccc592ceb3f14f5339db864b2e63004ca98">The group kinds to share templates with are an instance setting, and the targets appear</a>. Thanks to xet7.</summary>

Which group kinds Admin Panel / People / Shared templates allows came from the
browser's localStorage, so it differed per browser and was empty for everyone
but the admin who ticked it. It is `Settings.sharedTemplatesScopes` now,
published to every client, and an admin's earlier ticks are carried over once.
The All Boards / Templates targets were empty for everyone anyway:
`getMyShareableGroups` did not await the user, and read the groups from a
Promise. `tests/sharedTemplatesScopesSetting.test.cjs` and
`tests/playwright/specs/26-shared-templates.e2e.js` check the setting, and that
a user in another browser gets the targets.

</details>

**Sandstorm** - notifications of comments.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a24e3a49a9bb4ce64cc692d4ce75c2cbbed0a9aa">Comment activity notifications await the card, comment and board</a>. Thanks to xet7.</summary>

The Sandstorm activity notifier read the card, the comment and the board from
`ReactiveCache` without `await`. On the server those are Promises, so
`comment.text.match` threw on every comment activity and a card's members were
never found. `tests/serverReactiveCacheAwaited.test.cjs` sweeps `server/` for
any other unawaited result kept in a variable.

</details>

and has the following developer-facing changes:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49dbdbb6d62d10dbcfd7b9f922221f76ba04c875">Push Snap to Store releases the release's snaps to every Snap Store channel</a>. Thanks to xet7.</summary>

On v13.20 every build was green and the snaps were on the GitHub release, but
the Snap Store kept the old version: the store kept the uploads in processing
and never released them. The new workflow runs after every release, and by
hand for any tag: it releases each wekan, wekan-ondra and wekan-gantt-gpl snap
of the release to stable, candidate, beta and edge - a revision the store
already has without uploading it again, a new one after its upload - and fails
when a snap still did not reach a channel. `tests/snapStorePush.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4da72ff72ddbe51370bd94ceb19a96b1c540ed5">The shared templates spec runs its tests in order and waits for the reset</a>. Thanks to xet7.</summary>

The scopes are one instance setting now, so the spec's tests run serially,
wait until the page shows the reset the test server sees at its next database
poll, and find each template link inside its own group.

</details>

- [v12.49 is kept in old-CHANGELOG/2026/10.md, where the changelog's size budget moved it](https://github.com/wekan/wekan/commit/3a1d6701554b95bd594828b36021bb187ea565b1). Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/11992ac951278a22d376d079e7dfe0347112b04e">The built server bundle is checked with node --check; the streamed export no longer stops the server starting</a>. Thanks to xet7.</summary>

A parameter of the page-at-a-time export was named like a const in its
function's body, so the server bundle did not load; no node suite loads that
ES module, so all of them passed. `tests/serverBundleSyntax.test.cjs` now
checks the built bundle whenever a build is there. The fault never reached a
release.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/905f60a1ea15aa240a65c83d32ba505d6608b6d6">UI specs: Release Burndown gets a release to show; the upload limit test signs in by the login cookie</a>. Thanks to xet7.</summary>

The reports spec seeds a Scrum release; the limit test POSTs with the HttpOnly
login cookie, as the page's own upload does, and checks the warning names the
limit.

</details>

and updates the following documentation:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c277c4d187e59f3e32e1ce1cc04900009a8e047">The docs follow the menus and cover this release's features; README lists what WeKan has</a>. Thanks to xet7.</summary>

Scrum meetings moved under Board Settings, where they are turned on. The
Board Settings Card, List and Scrum pages name the flow fields, list
policies, Definition of Ready, standup and retrospective settings, and Admin
Panel / Settings / Features the new Kanban and Scrum features. Docs that still
said Settings / Visibility / Features name the pane where they are now.
Newest-Features.md has a November 2026 guide, and README.md and the
wekan.fi docs page list the reports, the flow features, the mail, calendar and
chat imports and the paged exports. The docs link and menu suites pass.

</details>

and improves the following translations:

**Languages updated:** 245 languages.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1732bd3a598e7e2828a4596ec4b60765759003f">Locale files that held another language get their own</a>. Thanks to xet7.</summary>

Values in another language than their locale's tag are replaced with the tag's
language: Northern Sami seeded in Finnish, Veps in Venda, Maltese sentences in
Italian, Northern Ndebele in Shona, Uzbek in Latin letters in the Arabic-script
file, Wolaytta in Ethiopic script, Tsonga in Swati, Luganda in Swahili, the
Armenian "board" and the Vietnamese "history". Words correct in both languages
are kept. Low confidence: the chart and metric names in Veps, Wolaytta, Tsonga,
Luganda and Northern Sami.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v13.20 2026-11-19 WeKan ® release

**In short:** The **REST API** card lists of a list and of a swimlane now carry
what a syncing client needs - when a card changed, its labels, members and
custom field values - so syncing a board needs no request per card. **build.sh**
and **build.bat** can run a single **Playwright** spec.

This release adds the following new features:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/97809cbb3373400992766826aa49349cf89539b7">REST API: the card lists of a list and of a swimlane carry modifiedAt, labelIds, members and customFields</a>. Thanks to rmb82 and xet7.</summary>

`GET /api/boards/:boardId/lists/:listId/cards` and
`GET /api/boards/:boardId/swimlanes/:swimlaneId/cards` returned only the
title, description, placement, dates, assignees and sort of each card. A client
keeping a copy of a dozen boards ([#6928](https://github.com/wekan/wekan/issues/6928))
had to GET every card on its own to learn its labels, members or custom field
values, or whether it had changed. Each item now also has `modifiedAt`,
`dateLastActivity`, `labelIds`, `members` and `customFields`
(`[{ _id, value }]`), and both routes build it in
`models/lib/restCardListItem.js`, so they stay alike. The board access check
is the same and there is no extra query. An admin-only custom field's value is
still `null` for a member who is not a board admin, through the same
redaction as the single-card GET. Each item carries its `boardId` so that
redaction is scoped to this board, and an admin of it still reads a field
shared with other boards. `tests/restCardListFields.test.cjs` pins the fields,
that nothing else of the card is added, and the concealment;
`tests/playwright/specs/rest-card-list-fields.e2e.js` checks both routes
against a running server, as a board admin and as a member.

</details>

and adds the following developer tooling:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1d6ad77c0c0c687b74d930b9d361d422891ccb8">build.sh and build.bat: Tests -> Playwright single spec runs one spec on the browsers you choose</a>. Thanks to xet7.</summary>

Running one Playwright spec used to mean starting a server by hand and calling
Playwright with the right environment, or running a whole suite. The new Tests
menu option, and `./build.sh --playwright-spec <spec>
[chromium|firefox|webkit|all]
[title filter]`, find the spec by its file name or a part of it. A WeKan
already answering on `:3000` is used as it is. Otherwise a fresh bundle is built
and the test server started the way the whole-suite runs start it, and stopped
afterwards, so a single spec does not pass or fail on a stale bundle. Each
browser runs natively when it can launch and in the Playwright container when
it cannot; Chromium in the VSCodium Flatpak on arm64 runs natively. Logs go to
`.tools/log/test-playwright-spec/<datetime>/`.
`tests/playwrightSingleSpec.test.cjs` checks how a spec is found, that a wrong
spec or browser is refused before anything is built, and that both menus start
and stop the same server.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v13.19 2026-11-19 WeKan ® release

**In short:** **Release builds** no longer fail when the **Snap Store** is slow
to process an upload, or when a **Termux** or **BSD** package mirror has a bad
minute.

This release fixes the following bugs:

**Release builds** - an outside service having a slow moment no longer fails a
target.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d49922a6da63e6b71c18521dcb630eb7559a698d">Snap uploads wait a bounded time for the store, and package mirrors are retried</a>. Thanks to xet7.</summary>

In the v13.18 release run, every wekan and wekan-gantt-gpl snap uploaded and
then sat in the Snap Store's "Status: processing" for hours. `snapcraft upload`
polls that with no limit of its own, so GitHub cancelled the jobs at their
`timeout-minutes` (2 hours native, 6 hours Launchpad) and reported a failed
release. The wekan-ondra snaps, in the same run, were processed in five
minutes. `releases/snap-upload-retry.sh` now gives one upload 30 minutes
(`SNAP_UPLOAD_PROCESSING_BUDGET`). A revision the store has accepted is not
uploaded again: the channels were sent with it, so the store releases it itself
when processing finishes, and the job says so in a warning and in its summary.
An upload cut off before the store accepted it is retried.

Bun android-arm64 died on a Termux mirror mid-sync ("File has unexpected size
... Mirror sync in progress?"), and Bun freebsd-x64 on a FreeBSD package mirror
that was briefly unreachable ("No route to host"). The Termux installs of the
Bun and Android bundles, and single-file's i386 libraries, now go through
`releases/apt-install.sh`, which waits a mirror out. It now also works in
Termux, which has no sudo and keeps apt under its own prefix. Every FreeBSD,
OpenBSD and NetBSD VM `prepare` retries its package install five times, and
says that the mirror is down when it gives up.

`tests/snapUploadProcessingBudget.test.cjs` runs the upload script against a
fake snapcraft: one that is still processing, one cut off before the store
accepted it, and the normal and refused cases. It also checks that no workflow
uploads around the script. `tests/vmPrepareRetry.test.cjs` checks the retry
loop in every VM `prepare`, and that it gives up after its last attempt.
`tests/releaseAptInstall.test.cjs` covers Termux mode and now checks every
workflow for a bare `apt-get`.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v13.18 2026-11-19 WeKan ® release

**In short:** **Admin Panel / Problems** says what its numbers count - "New
problems: 1" and "Checks with findings: 8 / 31", in every language - and a
report row's address, location and user always belong to the same occurrence.

This release fixes the following bugs:

**Admin Panel / Problems / Summary** - its counts read as sentences in every
language.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c92cf3298bef9ec1199bef5edb48bd334b5fb21">New problems and Data health checks say what they count</a>. Thanks to xet7.</summary>

"1 new problems" glued a number to a plural label, and Data health's
"Last Run: ... - 8/31" did not say that 8 of 31 checks found something. Each is
now one sentence with its numbers as placeholders, `new-problems-count` and
`data-health-checks-found`, translated into all 244 locales; new keys rather
than changed ones, so a Transifex pull does not bring the old wording back. The
menu's "Memory Usage" is "Memory usage" like CPU usage and Disk usage, and
broken translations of it are corrected: Aymara had an English wrapper, Latvian
had Lithuanian, and Dutch, Frisian, Tagalog, Tswana, Yoruba and Hawaiian were
split or in the wrong word order. `tests/problemsSummaryLabels.test.cjs` pins
the placeholders and key order in every locale, and that no bare number is
glued to a label any more.

</details>

**Admin Panel / Problems reports** - who and where in a row belong together.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80fb1c65fc0a19c1a8f970ea4873fd690188acd8">A row's address, location and user describe one occurrence, not several</a>. Thanks to xet7.</summary>

A summary row keeps the latest occurrence's username, address, location and
detail, but a field the newest occurrence did not carry stayed from an older
one: `summaryUpdate` dropped the other address family only from `$set`, so the
database kept the old value. Security Report showed a German IPv4 as
"Vancouver, CA" - the location of another person's IPv6 beside it - and
JamBleed's "gerald" beside a lockout of account trottola. The newest occurrence
now replaces all the latest fields, and `$unset` clears the ones it does not
carry, in `server/lib/eventLogFold.js` and in the in-memory fold the legacy
migration uses. Existing rows are right from their next occurrence on.
`tests/eventLogSummary.test.cjs` pins both, and that no update sends an empty
`$unset`.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v13.17 2026-11-19 WeKan ® release

**In short:** The **Admin Panel** answers one question per tab: Settings gains
**Appearance**, **Features**, **Feature profiles**, Security, Activities and
notifications, and Delete, Problems keeps only what is going wrong, and every
old
address redirects. The docs now have a page for every menu entry, and cards of
an archived swimlane no longer appear in the first swimlane.

This release adds the following new features:

**The Admin Panel** - one question per tab, and docs that follow the menus.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1a053d059191640a63a22ab553c0b0c6b833d8d">Settings gains Appearance, Features, Feature profiles, Security, Activities and Delete</a>. Thanks to xet7.</summary>

Who sees and may use what was spread over three tabs: the feature switches and
profiles sat in Settings / Visibility beside the logo, and Security, Delete and
Notifications sat in Problems among the reports. Visibility is Appearance now,
Features and Feature profiles are panes of their own, the three settings moved
to Settings, Problems is Summary, Backup and the reports, and every old address
redirects. People, Teams and Organizations show the feature profile that
applies. `tests/adminPanelStructure.test.cjs` and
`admin-panel-structure.e2e.js` cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8fd080bc8ece74157e5f2e9e436fa2dafe76348">The docs have a page for every menu entry, laid out like the menus</a>. Thanks to xet7.</summary>

Every Admin Panel pane, the member menu, the board header, Board Settings, the
All Boards left menu and the list, swimlane and card menus now have pages,
written from the code, and `Who-Sees-What.md` explains which layer decides what
is shown and what is allowed. What documenting them found is in TODO.md.

</details>

and fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d9c8c1250d42c9c55d469d28384a14e59975eee">Cards of an archived swimlane stay hidden with the Archive sidebar closed</a>. Thanks to sro-lbohn, hmeunier95 and xet7.</summary>

[#6927](https://github.com/wekan/wekan/issues/6927), a regression of #6659: on a
board migrated from an old WeKan, cards of an archived swimlane appeared in the
first swimlane and vanished while the Archive was open, because the client
could only exclude archived swimlanes it had loaded. Their ids are now
published on their own and excluded; the cards themselves are not changed.
`tests/archivedSwimlaneCards6927.test.cjs` and
`archived-swimlane-cards-6927.e2e.js` cover it.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.16 2026-11-19 WeKan ® release

**In short:** **ListLockBulkBleed** is fixed, and a list that refuses a role
now also refuses that role's bulk writes, dependency lines, rule actions and
changes to the list or swimlane itself. Administrators can give chosen users,
teams and organizations a smaller WeKan with opt-in **feature profiles**. A
server no longer runs out of memory in the hourly **History integrity audit**,
**scheduled rules** can create cards again, and **Card Excel export** and
clearing a card's text work again.

This release fixes the following CRITICAL SECURITY ISSUE of [ListLockBulkBleed](https://wekan.fi/hall-of-fame/listlockbulkbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba3d94390ba724344a2d5cfe50e9dee3cc6f8d89">Bulk REST card writes and server-side card writes ask the list's role exception</a>. Thanks to immanuwell and xet7.</summary>

[GHSA-83w9-74mx-7v83](https://github.com/wekan/wekan/security/advisories/GHSA-83w9-74mx-7v83),
CWE-863. A board admin can refuse a role write access in one list (#4527).
`DELETE /api/boards/:boardId/cards/bulk` and
`POST /api/boards/:boardId/cards/labels` take their cards from the body, so no
URL names a list, and asked only for board write access; the methods
`archiveSelectedCards`, `copyCard` and `createLinkedCard` write from server
code, past the Cards allow/deny rules. A normal member the list refused could
permanently delete its cards in one request, relabel and archive them, and copy
or link new cards into it.

The bulk routes now read every card and ask each list before the first write:
any refusal is a 403 and nothing changes, and each removal and relabel is keyed
on the list that was checked. The refusal shows in Admin Panel / Problems as
ListLockBulkBleed (`authz.list-locked-bulk`, medium, never disables). The
methods answer `not-authorized` and are not recorded, because Copy Card and
Multi-Selection reach them in ordinary use. The same shape was fixed in twelve
more paths: converting a card to a board, adding a subtask,
`createCardWithDueDate`, the iCalendar import, sending and receiving board
email, creating a version-control issue, moving board objects, History and
position-history undo and redo, renaming an attachment, the scoped import and a
card's rule button. Dependency lines keep their own board-wide rule.
`tests/listLockBulkBleed.test.cjs` runs the gate on the reporter's board and
pins every path; `tests/playwright/specs/list-lock-bulk.e2e.js` replays the
proof of concept.

</details>

and adds the following new feature:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc21b0b177dc8f8902efa39d0f89c8b041c7cf2d">Feature profiles hide features from the users, teams and organizations an administrator chooses</a>. Thanks to mimZD and xet7.</summary>

[#6837](https://github.com/wekan/wekan/issues/6837): Admin Panel / Settings /
Visibility / Features gains feature profiles - a name, the optional features it
hides, and the users, teams and organizations it applies to. It is strictly
opt-in: a user with no profile sees everything, a profile only hides and changes
no data or permission, and the member menu tells the user which profile hides
how many features, so nothing looks missing. Every place that hides a disabled
feature follows it. The new strings are in every language.
`tests/featureProfiles.test.cjs` and `feature-profiles.e2e.js` cover it.

</details>

and fixes the following bugs:

**Per-list role exceptions** - what else a list that refuses a role refuses,
as decided after ListLockBulkBleed.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/da6d9d39b8bd209006fc02fe735f1c277a2be693">Dependency lines follow the card's list</a>. Thanks to xet7.</summary>

A dependency line is stored on its source card, but it followed only the
board-wide dependency rule, so a role a list refused could still add, change and
remove lines on that list's cards. Now the methods answer `not-authorized`, the
REST dependency routes answer 403 recorded as ListLockBleed, and the import
skips such lines; board and site admins are not restricted.
`tests/listLockDependencies.test.cjs` and `tests/listPermissions.test.cjs` pin
it, and `list-lock-bulk.e2e.js` replays it over REST.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3202a1d7ac1027b41af5a5dfbe03893ccbc89c36">Deleting, archiving or moving a list or swimlane follows the list</a>. Thanks to xet7.</summary>

These do the same to the cards in them, yet were gated by board write access
alone. A list that refuses a role now also refuses that role deleting,
restoring, archiving or moving it, and deleting, archiving or moving a swimlane
holding its cards - on DDP, REST (403, recorded as ListLockBleed) and client
writes alike. The list menu no longer offers its archive actions there.
Renaming and reordering stay allowed, and board admins are never restricted.
`tests/listLockStructure.test.cjs` pins it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee24453dcb5d9ed8af5c07b848cbd5bd8979ae28">A rule action into a refusing list is skipped, and the rest of the rule runs</a>. Thanks to xet7.</summary>

A rule's move, archive, create-card, copy, link and list actions checked only
board write access. Each now asks the lists it writes in as the user who
triggered the rule; a refusing list skips that action and shows in Admin Panel /
Problems as ListLockRule (detected, low), since a rule meeting a locked list is
not an attack. `tests/listLockRules.test.cjs` pins it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0f36819610e6d0aa9c170340f8421c1b7fc2bbe">List Sync's rule replay skips such an action too</a>. Thanks to xet7.</summary>

The journaled List Sync replay still wrote with board write access only. Each of
its list-writing runners now decides before saving its command, records a
durable skip and lets the rest of the plan run; a replay reads the saved skip,
so it never re-decides and never skips a half-finished action.
`tests/listSyncRuleListSkip.test.cjs` pins it.

</details>

**Server memory and timed jobs** - what runs on its own, every hour.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cfd9a62466a64b58d514d46c3c6560f003704523">Swap alone is not high RAM usage, and resource monitors are not named like vulnerabilities</a>. Thanks to xet7.</summary>

A laptop with many programs open showed "RamBleed, high: high RAM usage started
(>= 90%)" at RAM 52% and swap 60%: swap at 25% started a period by itself. Swap
now counts only while RAM is also tight, the row says what started it, and only
RAM near full is high severity. The RAM, CPU, disk and speed rows are named for
what happened (HighRamUsage, HighCpuUsage, HighDiskUsage, SlowRequest) without a
CWE, and old rows are renamed at startup. `tests/ramHighTracker.test.cjs` and
`tests/resourceStreamNames.test.cjs` cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7459c5bde66ea22966526a7179eede62b5233f0e">The History integrity audit streams each board instead of loading it whole</a>. Thanks to xet7.</summary>

A production server died twice with "JavaScript heap out of memory", 42 and 74
seconds after the hourly History integrity audit started, both times in its
first run after a restart. The audit fetched each board's whole History - every
row with its full previous and new content - into memory. It now streams each
board through a cursor and keeps only hashes and small summaries; the findings
are the same, in the same order. `tests/historyIntegrityStreaming.test.cjs`
compares both on forked, tampered and orphaned chains and fails if a board is
fetched whole.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f23695cc1bf6447fb38693ea8fe2e1ce4ab51f8f">Scheduled rules act as the board's admin, so a created card has an author</a>. Thanks to xet7.</summary>

Every run of a scheduled rule with a "create card" action failed with "User ID
is required in cards insertAsync". Scheduled rules, auto-archive and attachment
retention acted as `board.createdBy`, but boards have no such field, so they ran
as nobody. They now act as the board's first active admin
(`models/lib/boardActor.js`), and the rule's new card names its author.
`tests/boardActor.test.cjs` scans the tree so nothing reads `board.createdBy`
again.

</details>

**Cards** - exporting a card, and clearing its text.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/997c6d88ad4c67850831aa99de1f874765c90a41">Card Excel export works with only Description or only Labels selected</a>. Thanks to AhmedLukman and xet7.</summary>

The card Excel exporter loads the board, list and swimlane only when the
selected fields need them, and passes `null` for the rest. The shared card
document builder defaulted them with `board = {}`, which applies only to
`undefined`, so it read `.title` of `null` and the download ended in "Export
failed". The titles are optional now (`board?.title || ''`), which also covers
a PDF card export of a card with no swimlane.
`tests/cardExportDocument.test.cjs`
fails on the old code with that TypeError, and
`tests/playwright/specs/card-excel-field-selection.e2e.js` downloads both
workbooks from the real route and checks that each holds only its own field.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c59c751547aa36fabda088eed4cfd7b8ce6b37e4">REST card update can clear a card title</a>. Thanks to AhmedLukman and xet7.</summary>

`PUT` with `{"title":""}` answered 404 and kept the old title, because the
handler read the title by truthiness. An empty title is a value now, a title
that is not a string is a 400 before anything is written, and
[an update that matches no card](https://github.com/wekan/wekan/commit/79a98822cbe6f1aaa0da0ad2646c7b2cb4fb2726)
is a 404 again. `tests/restCardSort.test.cjs` and
`tests/playwright/specs/rest-card-title.e2e.js` cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aacb2fd4d68c4873bd01685dceee172c24e48379">A cleared card title or description can be undone and redone</a>. Thanks to AhmedLukman and xet7.</summary>

Clearing a value is an edit kept in History, not a deletion, so it is
restorable whatever Admin Panel / Problems / Delete says. Undo already put the
old text back, but redo and Restore of the clearing threw: collection2 removes
`''` from `$set` and then refuses the empty modifier. History, the card details,
the board description and the REST card update now write `''` as it is, and a
REST title of only spaces no longer fails with a 500.
`tests/emptyStringClearWrites.test.cjs` and
`tests/playwright/specs/card-clear-undo-redo.e2e.js` cover it.

</details>

and has the following developer-facing changes:

**Card Excel export** - the browser test for the fix above.

- [A Playwright spec drives the card Excel export with one field selected](https://github.com/wekan/wekan/commit/320a3ca8672b6a70867baa0c3f657d3a5eb53536).
  Thanks to AhmedLukman and xet7.

**Node test suites** - a sandbox that resolves its helpers.

- [The attachment cleanup test resolves the Playwright helpers' own requires](https://github.com/wekan/wekan/commit/74dd0b705e21ecb4723dcb8a6055c7edc5aae9aa).
  Thanks to xet7.

**WeLite REST API** - the upstream REST specs, run against the native WeLite
target as well.

- [Ownership selection](https://github.com/wekan/wekan/commit/049b628a0310a33026de423a590a6c33489d5b41). Thanks to xet7.
- [Card title edits](https://github.com/wekan/wekan/commit/22dae19a64325695a17dd90ea7f4675ffeecfbed). Thanks to xet7.
- [Board card sorting](https://github.com/wekan/wekan/commit/5f06b28aef680d2682e7fa4e965a0e797b502214). Thanks to xet7.
- [Archive and restore](https://github.com/wekan/wekan/commit/11fc468ff77f9126b97d1eca72de9c2d90314022). Thanks to xet7.
- [Subtasks](https://github.com/wekan/wekan/commit/db3f489ab27f672c9d1ab4db5feaf3a116eba928). Thanks to xet7.
- [Overtime](https://github.com/wekan/wekan/commit/2033c177ce452f59bc6cb9d3d07a6566169ed015). Thanks to xet7.
- [People features](https://github.com/wekan/wekan/commit/72ee1c8b231896586086ac7067ea6dd96135506c). Thanks to xet7.
- [User update](https://github.com/wekan/wekan/commit/e4115e68905f4b9a2d521a749a9fe77dde322aa9). Thanks to xet7.
- [Checklists](https://github.com/wekan/wekan/commit/ede46c7a9873f20864a77eeda7cb5007762824ff). Thanks to xet7.
- [Write-route scope](https://github.com/wekan/wekan/commit/399a8defec10165e1cf7fa18faa5113d5bb7176f). Thanks to xet7.
- [Assignment removal](https://github.com/wekan/wekan/commit/8abb9504bb1f714873419f7b481650d758294ef7). Thanks to xet7.
- [Dropdown item rename](https://github.com/wekan/wekan/commit/b8fd94a7e70bf65e85b8d06b491e4d3d13e3a9ec). Thanks to xet7.
- [Dropdown item deletion](https://github.com/wekan/wekan/commit/f1adc7982eca4aebf8831403f6b4bd219cec51b9). Thanks to xet7.
- [Custom-field lifecycle](https://github.com/wekan/wekan/commit/6bf2d53d756e59f494ea50587f62bc467afb7b77). Thanks to xet7.
- [Webhook settings](https://github.com/wekan/wekan/commit/f34fee658206ab4d90583f58746067793f10d12a). Thanks to xet7.
- [Native Playwright credentials are seeded before an API token is used](https://github.com/wekan/wekan/commit/a9059b7b155aaea4bf9ccb1647a492bab251bb10).
  Thanks to xet7.

**WeLite attachments** - the attachment workflows in the native browser.

- [The upstream card attachment cascade spec](https://github.com/wekan/wekan/commit/26e27f62c4b6b9e2bcd1e10623de7dd3e0b31b5e). Thanks to xet7.
- [Attachment rename, and a missing form token is refused](https://github.com/wekan/wekan/commit/7c3b798a1d0ff6e26b6afa8f49c3359a73ba526a). Thanks to xet7.
- [Direct attachment removal in Chromium](https://github.com/wekan/wekan/commit/c060c6d2db51b2fc22fab72dadecd90ab173bd8f). Thanks to xet7.
- [The Version Control Attachments workflow](https://github.com/wekan/wekan/commit/b6bc2b200ce7545ca43b2f6b3a3ac39874227812). Thanks to xet7.
- [The Finnish attachment preview](https://github.com/wekan/wekan/commit/c5344761d856cf5234e5a12ccc61f336c6a9a0e8). Thanks to xet7.
- [The cascade spec reuses its browser session](https://github.com/wekan/wekan/commit/bd6b00c5f437237a3cab8bf7d51172d948e45462). Thanks to xet7.
- [The attachment browser workflow gets the time it needs](https://github.com/wekan/wekan/commit/333928f123f9dd061042c8b18b0e44663dc76d04). Thanks to xet7.

**WeLite boards and sessions** - export links and session revocation.

- [Both export links on the board](https://github.com/wekan/wekan/commit/075e6dbe730291543c8a384ce58429167976741c). Thanks to xet7.
- [Revoking one browser session](https://github.com/wekan/wekan/commit/e30c439fa7f4e82bb2f4f949513aa1fcc4287953). Thanks to xet7.

**WeLite right-to-left captions** - Arabic table captions read in their own
direction.

- [People table captions](https://github.com/wekan/wekan/commit/f1fe22ac16254fa3d7f14df6c09dd3f250c7d61a). Thanks to xet7.
- [Regional Arabic People table captions](https://github.com/wekan/wekan/commit/8c1152f23468e76d07c964b5f1358900372c8248). Thanks to xet7.
- [Arabic webhook field captions](https://github.com/wekan/wekan/commit/6f7292cffdfb42a7accf4955735bbd8a43d4472a). Thanks to xet7.
- [Regional Arabic attachment captions](https://github.com/wekan/wekan/commit/ba9504d6db8dbd2adf8e72b98cb10c991a379cda). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.15 2026-11-18 WeKan ® release

**In short:** **RaceBleed** is fixed: deleting a card while somebody moves it
to another board no longer destroys its checklists, comments and attachments
while the card itself survives there, and a member deleting a card that was
just moved keeps their account. REST handlers now answer **404, not 500**, for
a swimlane, user or board that is not there.

This release fixes the following CRITICAL SECURITY ISSUE of [RaceBleed](https://wekan.fi/hall-of-fame/racebleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7a496c9cfd8f30e5bda16515eedeaa2ec80dc65">A card's children are destroyed only for a card whose own removal happened</a>. Thanks to xingmuse and xet7.</summary>

[GHSA-3vjg-3p4q-8fwh](https://github.com/wekan/wekan/security/advisories/GHSA-3vjg-3p4q-8fwh),
CWE-367. The REST card delete looked the card up on the board the caller was
authorised for, destroyed its checklists, checklist items, comments,
attachments and subcards by card id, and removed the card itself last, keyed
on that board and list. A move to another board landing in between left the
card alive on a board the deleter cannot read, stripped of every child, with
both requests answering 200. Every hooked removal had the same shape:
collection-hooks runs `Cards.before.remove`, where the cascade was, and then
removes by the caller's original selector - a swimlane, a delete batch, a
parent - which a moved card no longer matches. The custom-field link clean-up
did the same to the cards linked to it.

The card document is now the claim (`models/lib/claimedCardRemoval.js`): the
single and bulk REST deletes remove the card first and destroy its children
only when that removal matched, and the hooked removals cascade from
`Cards.after.remove`, only for a card that is really gone. A list deletion
removes a card only while it is still in that list, and the REST board move
that loses to a delete is a 404 instead of a 500.

A delete that lost the race, or arrived after the card was moved away from
the named board, is refused and shows in Admin Panel / Problems as RaceBleed
(`authz.card-delete-race`, medium). It never disables the account: a stale
view is not an attack, and PurgeBleed's critical record used to disable a
member who deleted a card somebody had just moved.
`tests/claimedCardRemoval.test.cjs` replays the reported race and scans
`server/` for any cascade before or without the card's removal;
`tests/playwright/specs/race-bleed.e2e.js` races twelve moves against
deletes and checks that a surviving card always keeps its checklist.

</details>

and fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/baaeea27e3dc6083b5d6a39d5b44a4e6d26ca088">REST API: a handler's not-found error is a 404, not a 500</a>. Thanks to xet7.</summary>

`httpStatusForError` knew only `NotFound`, while about two hundred throw sites
spell it Meteor's way - `not-found`, `board-not-found`, `user-not-found` and
the rest. So deleting a missing swimlane, or adding a board member nobody is
called, answered 500 "Internal server error" on a real server, though the
unit test, which stubs the helper, saw the 404. Any name that is or ends in
`not-found` is now a 404 with its message; anything unknown is still a 500
carrying no detail. `tests/restNotFoundStatus.test.cjs` runs the real helper
and fails on a spelling it would not map.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.14 2026-11-16 WeKan ® release

**In short:** a **checklist folded on a minicard** stays folded, and every
profile preference survives a reconnect. The **card shortcuts** open only their
popup, **one shared list header row** really hides the other swimlanes'
headers, and the editors no longer show "comment-placeholder" after the
**i18next 27** update. **Deleting a card** keeps its attachments recoverable.

This release fixes the following bugs:

**Minicards** - folding a checklist, and the preferences it is stored with.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b05972c4c88e108526c85ad3598867d781395e98">A checklist folded on a minicard stays folded: no publication sends the current user a partial profile</a>. Thanks to mimZD and xet7.</summary>

The fold was stored, and half a second later the checklist unfolded again
([#6919](https://github.com/wekan/wekan/issues/6919)). DDP merges only
top-level fields, and Meteor re-runs named subscriptions before the accounts
publication of the whole profile on every login, a reconnect included.
`userDesktopDragHandles` and ten other publications sent the current user a
few `profile` fields; when one won, the client's profile shrank to them until a
reload and every preference in it went back to its default -
[#6691](https://github.com/wekan/wekan/issues/6691) had found the same for the
board view. The drag-handle preference is now published under its own field,
and the others leave the current user out (`server/lib/notCurrentUser.js`).
`tests/noNarrowProfileForCurrentUser6919.test.cjs` finds every such query; the
browser spec folds checklists in Persian after a page load and a reconnect, and
24 of 24 reconnect runs pass where 4 of 24 unfolded before.

</details>

**Keyboard shortcuts** - what `d`, Shift+M and Shift+C open.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/138f727ebbfc30d395fbcfa18ca244e58abe91d7">Card shortcuts open only their popup, next to the minicard or the card menu</a>. Thanks to mimZD and xet7.</summary>

On a hovered minicard, `d`, Shift+M and Shift+C opened the card first, and
Move / Copy went through the card's hamburger menu as well
([#6924](https://github.com/wekan/wekan/issues/6924)). Now only the Due date,
Move card or Copy card popup opens, next to the minicard, and the card stays
closed; on an opened card Move / Copy no longer show the menu first.
`client/lib/cardShortcutPopup.js` allows exactly what a click on the rendered
control would, and `tests/cardShortcutPopup.test.cjs` ties each rule to that
template condition; the browser specs check a non-admin and disabled shortcuts
open nothing.

</details>

**Swimlanes** - one shared list header row.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/39ee1d9512ef0c5c5aec94fe9842c00c7b00da1d">One shared list header row hides the other swimlanes' list headers</a>. Thanks to mimZD and xet7.</summary>

The hiding rule was a plain `display: none`, which loses to the desktop list
header layout's `display: block !important`, so every swimlane kept its headers
and the setting's own browser spec failed. It is `!important` now and outranks
those rules; `tests/sharedListRow6902.test.cjs` checks that against every
`!important` header display rule in the client CSS.

</details>

**Translations** - what a string that is empty on purpose shows.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/79676b3790e4b69fc43e61dcd4379eabe389fae0">An empty translation shows nothing, not its key: no "comment-placeholder" in the editor</a>. Thanks to brlin-tw and xet7.</summary>

i18next 27 ([#6915](https://github.com/wekan/wekan/pull/6915), in v13.13)
changed `returnEmptyString` to default false, so an empty translation falls
back like a missing one - and since the English value is empty too, to its
key. v13.13's notes said it would fall back to English; that was wrong. The
description and comment editors showed the text "comment-placeholder"
([#6921](https://github.com/wekan/wekan/issues/6921)), and eight Blockly
suffixes showed their keys. `TAPi18n.init()` sets `returnEmptyString: true`
again; no language has an empty value where English has text, so nothing that
should fall back to English goes blank. lld, lb, haw and sc had text for the
empty English source and are empty like the other languages.
`tests/i18nEmptyString.test.cjs` runs the real `__()` with the options read
from `tap.js`, and fails without the fix on i18next 27.1.1; the mocha suite and
the description editor's Playwright spec check the placeholder is empty.

</details>

**Attachments** - what happens to the files when a card is deleted or an upload
is renamed.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7875220470de22f8ca5e5488ed58fe4b1c00f11d">Deleting a card soft-deletes its attachments, so they and their history can be restored</a>. Thanks to AhmedLukman and xet7.</summary>

Removing a card looked for attachments by a top-level `cardId`, which normal
attachments do not have - they keep it in `meta.cardId` - so they stayed in
the active listings. They now go through the same recoverable deletion as the
attachment menu and the API: the bytes stay, the history row and the
deleteAttachment activity are written, and the files leave the active lists.
Legacy records with a top-level `cardId` keep the hard purge.
`tests/cardAttachmentCascade.test.cjs` covers single and bulk REST deletion,
refused requests and already deleted files.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1051265fc893fe11abb3d5f447387b560f5ea98a">A browser test deletes a card with attachments through More, Delete and its confirmation</a>. Thanks to AhmedLukman and xet7.</summary>

`tests/playwright/specs/rest-card-attachment-cascade.e2e.js` uploads
attachments in the browser, deletes their card from the card menu and checks
the deletion markers, the history, the active list, the kept bytes and the
other card's attachments.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/628a69c0861c20fbcb612b182ef70b7899b739fa">A renamed upload keeps its file paths consistent before it is validated</a>. Thanks to AhmedLukman and xet7.</summary>

When an upload's name was corrected to match its real file type, the paths
were written to the database without waiting, and the in-memory file object
kept the old ones, so the next write could put the old path back and the
validator read a path that no longer existed. `rename()` now updates the
original and version paths in memory and in the record, including the
top-level path the validator reads, and the upload hooks and the
file-extension migration wait for it. `tests/attachmentRenamePaths.test.cjs`
and `attachment-upload-rename.e2e.js` cover failures, ordering, the original
bytes and the card display.

</details>

and hardens the following security check:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/040d853c8e7c0092db264527497a7dd8878dc248">RedirectBleed: a direct client write of an avatar URL follows the avatar dialog's rule</a>. Thanks to meifukun and xet7.</summary>

meifukun's five reports from July, fixed then
([RedirectBleed](https://wekan.fi/hall-of-fame/redirectbleed/),
[SourceBleed](https://wekan.fi/hall-of-fame/sourcebleed/),
[LiveBleed](https://wekan.fi/hall-of-fame/livebleed/),
[CasRaceBleed](https://wekan.fi/hall-of-fame/casbleed/),
[MetricsBleed](https://wekan.fi/hall-of-fame/metricsbleed/)), arrived as
GitHub security advisories and were checked again against the current code:
all five are fixed, and `tests/securityMeifukun.test.cjs` pins each. One gap
was found: `setAvatarUrl` refuses `javascript:`, `file:` and the rest, but the
Users allow rule permits every `profile.*` field, so a browser-console
`Users.update` stored what the method refuses. It was not exploitable - the
URL is shown only as an image and fetched only through `fetchSafe` - but the
rule is now `models/lib/avatarUrlScheme.js`, shared by both avatar methods and
a Users deny rule that records the refused write in Admin Panel / Problems.
`tests/avatarUrlDirectWrite.test.cjs` covers every way to write the field and
checks no client code writes it directly.

</details>

and has the following developer-facing fixes:

- [The FreeBSD bundle guard follows dependabot's freebsd-vm 1.6.0, which node-patches now uses too](https://github.com/wekan/wekan/commit/5ec3aaf85f4edb605a7180593486c5edd24ac713).
  Thanks to xet7.
- [build.sh's source test mode starts again: meteor/package/main imports resolve](https://github.com/wekan/wekan/commit/495a6faa634841f5fbb50fc1dd535d42f1c57a52).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.13 2026-11-15 WeKan ® release

**In short:** **Copy Checklist** and the other destination pickers list the
cards of a large board again: a board that loads its cards lazily used to leave
the card dropdown empty. Dependabot's updates, among them **i18next 27** and
the **mongodb** driver 7.8.0, are kept.

This release fixes the following bugs:

**Destination pickers** - choosing a card on another board, whatever that
board's size.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e46d7a2376ebfa413cec15843d8b7fc374fe63e0">The card dropdown lists the cards of a board that loads lazily</a>. Thanks to ChrisMagnuson and xet7.</summary>

Copy Checklist's card dropdown stayed empty for a board with more cards than
the lazy-loading threshold (Card loading `auto` above 500 cards, or `lazy`),
however long one waited ([#6917](https://github.com/wekan/wekan/issues/6917)).
The pickers read the chosen board's cards from the `board` publication, which
ships no cards for a lazy board, and a picker opens no list that would fetch
its own window. A new `destinationCards` publication ships the titles and
places of one list's cards in one swimlane, or of the whole board for the
parent-card picker, whatever the card-loading mode. It is scoped like the
other card publications: the board must be readable, and an assigned-only
member gets only the cards assigned to them.

Copy / Move checklist, Copy checklist from a template card, Move / Copy card,
Link card and the parent-card picker use it. Done waits until the chosen
list's cards are there, a remembered card is checked against them rather than
against the board, and the open board's Filter no longer empties the
destination list. `tests/destinationCards6917.test.cjs` runs the publication
on a 1,144-card board, an assigned-only member, an unreadable board and bad
arguments, and the dialog with a lazy destination;
`tests/playwright/specs/copy-checklist-lazy-destination.e2e.js` copies a
checklist to such a board.

</details>

and updates the following dependencies:

- **mongodb 7.7.0 → 7.8.0** — the server's database driver
  ([#6914](https://github.com/wekan/wekan/pull/6914)).
- **i18next 26.5.11 → 27.1.1** — translations
  ([#6915](https://github.com/wekan/wekan/pull/6915)). 27 changes defaults
  WeKan does not rely on: it sets `fallbackLng` and `cleanCode` itself, turns
  escaping off and registers sprintf on its own instance. An empty translation
  now falls back to English instead of showing nothing.
- **sanitize-html 2.18.1 → 2.18.2** — HTML sanitizing
  ([#6916](https://github.com/wekan/wekan/pull/6916)).
- **puppeteer 25.15.0 → 25.17.0** and **@typescript-eslint/parser 8.72.1 →
  8.72.2** — tooling ([#6909](https://github.com/wekan/wekan/pull/6909),
  [#6913](https://github.com/wekan/wekan/pull/6913)).
- **@playwright/test 1.64.1 → 1.65.0** in tests/playwright — the browser tests
  ([#6911](https://github.com/wekan/wekan/pull/6911)).
- **softprops/action-gh-release 3.0.3 → 3.0.4**, **docker/login-action 4.7.0
  → 4.8.0**, **azure/setup-helm 5.0.1 → 5.1.0** and **vmactions/freebsd-vm
  1.5.9 → 1.6.0** — CI ([#6912](https://github.com/wekan/wekan/pull/6912),
  [#6910](https://github.com/wekan/wekan/pull/6910),
  [#6908](https://github.com/wekan/wekan/pull/6908),
  [#6907](https://github.com/wekan/wekan/pull/6907)).

Thanks to dependabot.

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.12 2026-11-14 WeKan ® release

**In short:** WeKan is updated to **Meteor 3.6.1**, whose DDP server refuses
malformed messages without stalling the connection. **One shared list header
row** now shows the same lists in every swimlane, scrolling together, and
**Shift+M** and **Shift+C** open Move Card and Copy Card. Those popups
remember the swimlane and list, not only the board. The embedded-engine
benchmark takes **OpenTelemetry 1.47.0** for a Dependabot alert. A **REST
API** write that changes nothing answers 404, and a card deletion naming the
wrong list no longer strips the card's checklists (**ListLockBleed**).

This release fixes the following CRITICAL SECURITY ISSUE of [ListLockBleed](https://wekan.fi/hall-of-fame/listlockbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4c0d3e8820520dc7b1cef5b27e9e3e516a67158">A card deletion naming another list no longer strips the card's checklists and comments</a>. Thanks to xet7.</summary>

A follow-up to [ListLockBleed](https://wekan.fi/hall-of-fame/listlockbleed/),
[GHSA-4734-8vrg-8j3w](https://github.com/wekan/wekan/security/advisories/GHSA-4734-8vrg-8j3w),
found while checking the REST deletions. `DELETE
/api/boards/:boardId/lists/:listId/cards/:cardId` found the card by board
alone, removed its checklists, checklist items, comments and attachments, and
only then removed the card by board AND list. With the wrong list id the card
stayed, emptied, and the reply was 200. Only the list in the URL was asked
whether the caller may write, so a member a list refuses could strip the cards
of that list by naming one they may write. The card now has to be in the named
list, its own list is asked as well, and the refusal shows in Admin Panel /
Problems as `authz.list-locked`. `tests/restWriteRoutes404.test.cjs` runs the
handler on both cases and requires the list check before anything is removed,
and `tests/playwright/specs/rest-write-routes-404.e2e.js` checks that the
checklist survives against a running server.

</details>

and adds the following new features:

**Keyboard shortcuts** - the opened card's actions from the keyboard.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8508c150159a160b13b45505065ff788171a777a">Shift+M opens Move Card and Shift+C opens Copy Card</a>. Thanks to mimZD and xet7.</summary>

They act on the opened card, or on the hovered or selected minicard, which is
opened first, as the `d` due date shortcut does. They click the card's menu and
then its Move Card or Copy Card item, so the menu's permissions decide: Move
Card for board admins, Copy Card for everyone who is not a Worker, and a menu
without the item is closed again. Shift keeps them apart from `m` (assign
yourself) and `c` (archive). The shortcut list names them with the already
translated popup titles. User-defined shortcuts, also asked in
[#6904](https://github.com/wekan/wekan/issues/6904), are not part of this.
`tests/cardMenuKeyboardShortcut.test.cjs` drives the DOM logic, and
`tests/playwright/specs/move-copy-keyboard-shortcut-6904.e2e.js` presses the
keys, with shortcuts off, while typing, and as a non-admin member.

</details>

**The Swimlanes view** - swimlanes that share their lists.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67321dcb6c071e1d9572fb79eb344349178d274b">One shared list header row shows the same lists in every swimlane, scrolling together</a>. Thanks to mimZD and xet7.</summary>

The setting only hid the list headers of every swimlane but the first, while
each swimlane kept lists of its own: a new swimlane showed no lists, and each
scrolled sideways alone. With it on, every swimlane now shows all of the
board's lists under the one header row, as swimlanes were before lists belonged
to one, and the swimlanes scroll sideways together. Each list still holds the
cards of the swimlane it is shown in. Nothing is written to a list or a card, so
on a board whose swimlanes have different lists, turning the setting off shows
each swimlane's own lists again. While it is on, a list dropped under another
swimlane is reordered, never moved there with its cards.
`tests/sharedListRow6902.test.cjs` and
`tests/playwright/specs/shared-list-row-6902.e2e.js` cover it, with the setting
on and off.

</details>

and updates the following dependencies:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed5a5349416b4e6374b2c19db480b64a7793a25c">Updated to Meteor 3.6.1</a>. Thanks to xet7.</summary>

`meteor update --release METEOR@3.6.1` refused it: Meteor 3.6.1 pins
`ddp-server@~3.6.1`, and WeKan's local fork of ddp-server was `3.6.0_1`. Of
WeKan's six Meteor package forks only ddp-server changed in 3.6.1, so its fixes
are rebased onto the fork, now `3.6.1_1`: a non-string unsubscription or ping
id is refused, and a protocol handler that throws synchronously is contained.
The packages 3.6.1 bumps (accounts-base, accounts-express, accounts-password,
minimongo, mongo, webapp) are updated. WeKan configures OAuth services on the
server only, so 3.6.1's restriction on client-side configuration does not
affect it. `tests/meteor353SecurityFixes.test.cjs` checks that the fork carries
the 3.6.1 fixes and not the older code.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0566bf6ec8b40d5af0ff317babfced7072424d57">The Docker image and the Bun build use Meteor 3.6.1</a>. Thanks to xet7.</summary>

The Dockerfile's `METEOR_RELEASE` is `METEOR@3.6.1`. The Bun build refused
every release but 3.6; its patch applies unchanged to 3.6.1, so 3.6.1 is
accepted, pinned to its commit.

</details>

- [OpenTelemetry 1.42.0 → 1.47.0 and klauspost/compress 1.18.7 → 1.20.2 in the Go module of the embedded-engine benchmark](https://github.com/wekan/wekan/commit/e0eb6c64dbd976f2195563c59f169e8129855a34).
  Dependabot alert \#189: attribute values made of U+FFFD runes bypassed
  OpenTelemetry's AttributeValueLengthLimit. govulncheck then reported
  GO-2026-6865 in klauspost/compress. A test holds every `go.mod` at or above
  these floors.

Thanks to dependabot.

and fixes the following bugs:

**Move and Copy card** - where their popups open.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b47ec81a72aab1ab8d04addb8fe41b7e0181841">They open on the swimlane and list chosen last time, not only the board</a>. Thanks to mimZD and xet7.</summary>

The remembered swimlane and list were checked right after subscribing to the
remembered board. For another board than the open one, its swimlanes and lists
had not arrived yet, so both were reset to the first. That check now waits for
the board's documents, and falls back to the first swimlane and list only when
a remembered one is really gone. The same picker serves Move, Copy, Link to
board, Copy many and Convert checklist item to card.
`tests/moveCopyRemembersDestination6901.test.cjs` runs the real dialog classes
with the board arriving later, and
`tests/playwright/specs/move-copy-remembers-destination-6901.e2e.js` opens the
popups.

</details>

**The Swimlanes view** - the swimlane resize line.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d5109b4b9d7f77205e6ba8fd2c581a9c4720ff9">The resize line reaches the right edge of a swimlane scrolled to the right</a>. Thanks to mimZD and xet7.</summary>

The swimlane-height resize handle sits in the swimlane that scrolls its row of
lists sideways, so it moved with the lists, and after scrolling right by some
distance the line stopped that far short of the right edge. It now follows the
swimlane's scroll, in right-to-left boards too.
`tests/swimlaneResizeHandleScroll6903.test.cjs` and
`tests/playwright/specs/swimlane-resize-handle-scroll-6903.e2e.js` measure it.

</details>

**The REST API** - a write that changes nothing answers 404, not 200.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2733c8ba65342dfb0bdfbbddff03f366ac8756b5">Deleting a missing or another board's custom field answers 404</a>. Thanks to AhmedLukman and xet7.</summary>

`DELETE /api/boards/:boardId/custom-fields/:customFieldId` answered 200 for a
custom field that did not exist, was on another board or was already deleted,
because the removal matched nothing and the reply did not check. It now answers
a JSON 404 when the board-scoped removal removes nothing. A real deletion still
answers 200 and its `before.remove` hook still clears the field's values from
the board's cards and its activities. `tests/restCustomFieldDelete.test.cjs`
and `tests/playwright/specs/rest-custom-field-delete.e2e.js` cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cefb6771cbde23a468526448256f182309c49bdd">Deleting a missing dropdown item of a custom field answers 404</a>. Thanks to AhmedLukman and xet7.</summary>

`DELETE` of a custom field's `dropdown-items/:dropdownItemId` answered 200
even when the custom field had no such item, because `$pull` of an absent item
still matched the field. The update now also requires the item
to be in `settings.dropdownItems`, so a missing item, a missing field or one
on another board matches nothing and answers a JSON 404, while the other items
stay. `tests/restDropdownItemDelete.test.cjs` and
`tests/playwright/specs/rest-dropdown-item-delete.e2e.js` cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4c0d3e8820520dc7b1cef5b27e9e3e516a67158">The other deletions and updates of a record that is not there answer 404 too</a>. Thanks to xet7.</summary>

The two entries above, and the integrations of #6900, had siblings that
answered 200 for a change that changed nothing: deleting a swimlane, a list
(also an already deleted one), a card, a card dependency or a board domain
that is not there; renaming a missing custom field (even with an empty body),
adding dropdown items to one, or renaming a dropdown item it does not have;
updating a dependency the card does not have; adding or removing a member of a
board that does not exist, a user that does not exist, or a user who is not a
member; and deleting the tokens of a user that does not exist. Each now looks
the record up on its board first and answers a JSON 404, and removing a
board's last admin, which the board keeps, answers 409. Member removal also
deactivates the active entry of a user listed twice, not the first entry. An
unknown token of a real user still answers 200: revoking makes sure it is
gone. `tests/restWriteRoutes404.test.cjs` runs each handler with the record
missing and present, and fails for any REST write in `server/` whose path
names a record and that has no 404; `DELETE /api/boards/:boardId` was already
right, because the board check answers 404 first.
`tests/playwright/specs/rest-write-routes-404.e2e.js` replays them against a
running server.

</details>

and has the following developer-tooling fixes:

**Meteor skills** - the agent notes for installing Meteor.

- [The npm fallback install works with npm 12](https://github.com/wekan/wekan/commit/58273d2bf8d43bcd6a4ef36cbe657668db1569aa). Thanks to xet7.

**Node test suites** - tests that depended on the machine.

- [The npmRetry test passes with a localized bash](https://github.com/wekan/wekan/commit/e95596c3b0c7a71f235bcb16ba2b703c41fc648e). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.11 2026-11-13 WeKan ® release

**In short:** The **file-integrity scan** stops reporting attachments and
avatars that WeKan deleted itself as missing, which had buried real
**StorageBleed** findings under thousands of false ones. The recurring-checklist
reset no longer scans every **checklist** on each tick. In the **REST API**, a
refused custom-field update changes nothing, ownership transfer takes only the
boards the user administers, and deleting a missing integration answers 404.

This release fixes the following bugs:

**The file-integrity scan** - what it counts as a missing file.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec05ff008928c390b11fec225c564f2dd209ec7f">Files WeKan deleted or moved itself are no longer reported missing</a>. Thanks to Raymond-Voogt and xet7.</summary>

The daily scan keeps one baseline per stored file and reports a baseline whose
file is gone as a StorageBleed. Nothing removed a baseline, so every attachment
the retention purge deleted and every avatar a user deleted was reported on
every run from then on; one finding was folded 1,164 times. The baseline is now
forgotten in Attachments and Avatars `onAfterRemove`, for every version path.
That is the retention purge's path: Meteor-Files unlinks the files itself after
that hook, without going through the store strategy. It is also forgotten in
the filesystem strategy's `unlink()` and, for the old path, in `rename()`. A
file that vanishes any other way keeps its baseline and is still reported.
Baselines orphaned before this fix stay until removed, as
[#6898](https://github.com/wekan/wekan/issues/6898) describes.
`tests/integrityBaselineForgottenOnDelete.test.cjs` fails on a delete or rename
in the filesystem strategy that does not forget its baseline, and
`tests/playwright/specs/integrity-baseline-on-delete.e2e.js` deletes an avatar
in the UI.

</details>

**Database indexes** - the queries the background jobs make.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c37575f1faff4e8ca518c7eae0ba7e50d05c1fae">The recurring-checklist reset reads only recurring checklists</a>. Thanks to Raymond-Voogt and xet7.</summary>

The reset cron asks for every checklist with a `resetInterval` on each tick,
and with no index that read the whole collection (about 45,000 documents on the
reporting instance), shown as a collection scan on Admin Panel / Problems. A
partial index on `resetInterval`, like the one recurring cards got, holds only
the recurring checklists. `tests/checklistResetIndex.test.cjs` pins the index
and a selector that can use it.

</details>

**The REST API** - custom fields, ownership transfer and integrations.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a81ec6ecdfea8a0b0709d7c0cd463cfd051ca80f">A refused custom-field update leaves the whole field unchanged</a>. Thanks to AhmedLukman and xet7.</summary>

`PUT /api/boards/:boardId/custom-fields/:customFieldId` wrote each property
with its own update, so a refused `type` or `settings` left the name and flags
sent before it already saved. The properties are now saved in one board-scoped
update that the schema accepts or refuses as a whole. Authorization, the field
allowlist and the reply are unchanged. `tests/restCustomFieldUpdate.test.cjs`
and `tests/playwright/specs/rest-custom-field-update.e2e.js` cover both.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b4db92a1b97eae43770e56082012073d87c4c9a">Ownership transfer takes only the boards the user administers</a>. Thanks to AhmedLukman and xet7.</summary>

`takeOwnership` selected boards where the user was a member and somebody, not
necessarily the user, was an administrator. The user and the administrator flag
are now matched on the same member, so a board where the user is an ordinary
member is left as it is. `tests/restOwnershipSelection.test.cjs` and
`tests/playwright/specs/rest-ownership-selection.e2e.js` cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab685a7f6fe0450a31b9150a14b17b909933c86f">Deleting a missing or another board's integration answers 404</a>. Thanks to AhmedLukman and xet7.</summary>

`DELETE /api/boards/:boardId/integrations/:intId` answered 200 for an
integration that did not exist, was on another board or was already deleted,
because the removal matched nothing and the reply did not check. It now looks
the integration up on that board first, after the board-admin check, like PUT
and the activities routes, and answers the same JSON 404. Server errors still
answer 500. `tests/restIntegrationWriteRoutes404.test.cjs` and
`tests/playwright/specs/rest-integration-update.e2e.js` cover it, including
the board's webhook settings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8e25952aa6b244b76891c3fa3cdc1779d35a78f">Ownership transfer finishes before it replies, and a deleted account leaves the board when removed</a>. Thanks to xet7.</summary>

`takeOwnership` called the async `changeOwnership()` without `await`, so the
reply was sent before the board changed and a failed update was an unhandled
rejection behind a 200. `Boards.removeMember` tested
`!ReactiveCache.getUser(id)`, which on the server is a Promise and always
truthy. Because of that, the branch that removes a member whose account was
deleted never ran there, and that member only lingered as inactive. Both
calls are awaited now. `tests/reactiveCacheNegatedAwait.test.cjs` fails on any
negated un-awaited `ReactiveCache` lookup in `server/` or `models/`.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.10 2026-11-13 WeKan ® release

**In short:** The release's **Snap Store** credential check bounds each
snapcraft install attempt, so a Snap Store that hangs no longer stops a release.

This release has the following developer-tooling fix:

**Release builds** - the snap jobs.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/560ff74a79f8c998bd0aa4fd63664155eecd5f28">Every snapcraft install attempt is bounded, and snap-auth-check has room for all five</a>. Thanks to xet7.</summary>

In the v13.09 release the Snap Store failed snap-auth-check's first two
snapcraft install attempts and then let the third hang with no output, until
the job's 10-minute timeout cancelled it - the retry never got its remaining
turns. Each `snap install snapcraft` in the release workflow now runs under
`timeout 180`, an attempt cut short is aborted (`snap abort --last=install`)
so the next one does not meet snapd's change still in progress, and
snap-auth-check's job timeout is 25 minutes, enough for all five attempts.
`tests/snapAuthPreflight.test.cjs` fails on an unbounded install, a retry
without the abort, or a job timeout that cannot hold five attempts.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.09 2026-11-12 WeKan ® release

**In short:** The release's **Snap Store** credential check retries installing
snapcraft, so one Snap Store timeout no longer stops a release.

This release has the following developer-tooling fix:

**Release builds** - the snap jobs.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/534646347c4b6467f539cb01171487d27fc7ddc7">snap-auth-check retries installing snapcraft, as the snap build job does</a>. Thanks to xet7.</summary>

The v13.08 release stopped in snap-auth-check before it asked the Snap Store
anything: the one `snap install snapcraft` timed out reaching api.snapcraft.io,
while the snap build job already retried five times. The check retries the
same way now, and when every attempt fails it says the store did not answer
rather than that SNAP_AUTH is wrong. `tests/snapAuthPreflight.test.cjs` fails on
any snapcraft install in any workflow without the retry.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.08 2026-11-12 WeKan ® release

**In short:** The **REST API** creates a card under the **parent** it is given,
and a refused **integration URL** no longer leaves the other fields of the same
update written. The **single-file** WeKan for **32-bit ARM** builds again, with
an i386 Node.js of the exact version its bundle embeds. A **GitHub CodeQL**
alert in the security alert download script is fixed.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed19817433e14ef4f8cb7d9623f5d8b84a1794ff">The security alert download summary carries no secret scanning field, and kept secrets are owner-only</a>. Thanks to GitHub CodeQL and xet7.</summary>

Code scanning alert #604 (`py/clear-text-storage-sensitive-data`, CWE-312):
`releases/sec/download_github_security.py` wrote a secret scanning alert's type
name into `SUMMARY.md`. That was the type of the secret, not the secret, but
`SUMMARY.md` is never redacted, so it now names only the kind of finding and
points at `secret-scanning/`. With `--include-secret-values` the files that hold
the secrets are created readable by their owner only.
`tests/securityDownloadScript.test.cjs` pins both, and that no secret scanning
field reaches the summary. This is a maintainer tool, not WeKan's server, so
there is no attempt for Admin Panel → Problems to record.

</details>

and fixes the following bugs:

**The REST API** - creating cards and updating integrations.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/552950ed637d6ddeb486322e3c08dd61dbfc13dc">A card created with a parentId is created under that parent</a>. Thanks to AhmedLukman and xet7.</summary>

`POST /api/boards/:boardId/lists/:listId/cards` read `parentId` from the URL
parameters, which that route does not have, so the parent in the request body
was ignored: it was never stored, and the visibility check for the parent
(GHSA-jvv9-498p-hxrg) never saw it. It is read from the body now, as the bulk
endpoint does. A parentId that is not a string is refused with 400, and a parent
on a board the caller cannot see is still refused and recorded under
ParentBleed. `tests/restCardParent.test.cjs` and
`tests/playwright/specs/rest-card-parent.e2e.js` cover a stored parent, the
subtask it renders as, an empty parent and the refused requests.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1418cb8480e0ca13ccecc54290b16c36d40f82a6">An integration update with a refused URL changes nothing</a>. Thanks to AhmedLukman and xet7.</summary>

`PUT /api/boards/:boardId/integrations/:intId` wrote `enabled` and `title`
before it checked the new URL against the SSRF rules (GHSA-hc3x-hq3m-663q), so a
request whose URL was refused with 400 had already changed those two fields. The
URL is validated first now, like the delivery settings, and a refused request
leaves the integration as it was. `tests/restIntegrationUpdate.test.cjs` and its
Playwright spec pin the order.

</details>

and has the following developer-tooling fixes:

**Release builds** - the single-file executables.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c35c672ffb398b68be22f257087db28738eb4701">The 32-bit host Node.js of a single file is its bundle's exact version</a>. Thanks to xet7.</summary>

The v13.07 single files for armhf, armv6 and armv7 stopped on "The bundle's
Node.js is v26.13.0 but this is v26.13.1". A 32-bit target's SEA blob is
written by a 32-bit Node.js, and `.github/workflows/single-file.yml` borrowed
the i386 bundle's. Each bundle takes the newest Node.js of the pinned major its
platform has, so i386 had v26.13.1 while 32-bit ARM had v26.13.0. The host is
now resolved with `releases/resolve-node-source.sh` at the target bundle's exact
version, checked against its published SHA256, and refused unless it reports
that version. `tests/singleFile.test.cjs` pins all three, and that the host is
never taken from another platform's bundle.

</details>

**Browser tests** - what a spec may rely on from the database.

- [list-sync-estimate's checkbox test no longer depends on the order an index returns](https://github.com/wekan/wekan/commit/af76406d127568b45b0e76659160a8821cdf00a2) -
  it expected an unsorted find of activities in insertion order, which
  activities' cardId/createdAt index returns newest first. Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.07 2026-11-12 WeKan ® release

**In short:** **ListLockAttachBleed** is fixed: when a list refuses a role
write access, that refusal now also holds for the attachment API's upload,
delete, copy and move. **CodeQL** alerts #602 and #603 in the tests are fixed,
**fast-xml-parser** is updated to 5.12.0, spent time reads as a **duration**,
the **indexes** that LDAP, card member and History queries need are added, and
Admin Panel → Problems can **Clear** resolved problems, which also age out.

This release fixes the following CRITICAL SECURITY ISSUE of [ListLockAttachBleed](https://wekan.fi/hall-of-fame/listlockattachbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7bb3e13ba9">A list that refuses a role write access refuses its attachment API writes too</a>. Thanks to Furkan Derse and xet7.</summary>

[ListLockAttachBleed](https://wekan.fi/hall-of-fame/listlockattachbleed/),
reported by email, its GitHub security advisory awaited. A board admin can
refuse a role write access in one list (#4527). The card screen, the card and
checklist routes ([ListLockBleed](https://wekan.fi/hall-of-fame/listlockbleed/))
and the interface's own attachment upload and delete applied that refusal, but
the attachment API's upload, delete, copy and move, over REST and DDP, asked
only for board write access and the assigned-only rule. A normal member the
list refused could therefore still add and remove files on its cards. Every
attachment write that names a card now asks that card's list as well, a move
both the card it takes the file from and the one it puts it on, and the
refusal shows in Admin Panel / Problems. `tests/listLockAttachments.test.cjs`
runs the guard on the reported case and fails on any attachment write in the
tree without the list check beside it, and
`tests/playwright/specs/list-lock-attachments.e2e.js` replays the writes
against a running server.

</details>

and fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b65b713a0f7b537efbe7c25bb2a8b454e88d1ad">Alerts #602 and #603: no test hands a path to a shell at all</a>. Thanks to GitHub CodeQL and xet7.</summary>

The fix for #601 passed the paths to `bash -c` as arguments rather than
pasting them into the script, but that still hands a temporary path to a
shell, and CodeQL flagged the two umask tests in
`tests/releaseDownloads.test.cjs` again. They no longer use a shell: `fetch.sh`
runs as bash's program with its arguments, the umask is set on the test's
process and put back, and `chmod +x` is `fs.chmodSync`. The macOS sandbox test
runs its probes as programs the same way. The guard now refuses any value
given to a shell's `-c` script as an argument, and found one more test doing
it. The findings were in tests, not in WeKan, so there is no attempt to show in
Admin Panel → Problems.

</details>

and adds the following new features:

**The Admin Panel** - Problems, and getting rid of the ones that are handled.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fefabbf113">Problems has a Clear button, and resolved problems age out on their own</a>. Thanks to Raymond-Voogt and xet7.</summary>

The problem streams were append-only, and Acknowledge only reset the "new"
count, so a problem fixed long ago stayed in the table and buried the ones
that are live now. Clear, beside Acknowledge, calls the admin-only
`clearEventLog`, which deletes the checked streams' events up to now and
stamps the acknowledgement. Anything that happens after the click shows as a
new problem again, and an unknown stream in the list clears nothing. A daily
sweep, claimed once per installation, deletes events older than
`EVENTLOG_RETENTION_DAYS` (default 90, `0` keeps them forever); a recurring
problem's folded row keeps a recent date, so it stays. The setting is listed
on every platform and in the Helm chart, and the button is translated to
every language. `tests/eventLogClearAndRetention.test.cjs` runs Clear and the
sweep on an in-memory log, including a non-admin and an unknown stream, and
`tests/playwright/specs/problems-clear.e2e.js` clears one stream in the UI.

</details>

and updates the following dependencies:

- [**fast-xml-parser 5.11.2 → 5.12.0**](https://github.com/wekan/wekan/commit/a76a19058ac896651ccd30311c36d48ee7f47b86) — Dependabot
  alert #188: with `stopNodes`, an unterminated stop node made it rescan the
  rest of the input from every `<`, O(n²) CPU; 5.12.0 stops at the first
  failed scan. Brought in by the Azure and Google Cloud storage clients. The
  test runs the alert's input and pins that no lockfile resolves an older
  version. Thanks to dependabot.

and fixes the following bugs:

**Cards** - how spent time is shown.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e8e8039ff">Spent time is shown as a duration, not decimal hours</a>. Thanks to brlin-tw and xet7.</summary>

A card's spent time showed as decimal hours, such as 12.58 for 12 hours and
35 minutes, which reads as twelve hours and fifty-eight minutes. The badge now
shows `12h35m`, drops the units that are zero and shows `0s` for none, and its
tooltip keeps the rounded hours. The formatter is
`models/lib/spentTimeFormat.js`; `tests/spentTimeFormat.test.cjs` pins it and
`tests/playwright/specs/spent-time-format.e2e.js` checks the badge. A
follow-up imports it the way `cardTime.js` imports its other helpers.

</details>

**The REST API** - logging out a token.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd59a8ff70">POST /api/deletetoken waits for the token to be deleted before answering</a>. Thanks to AhmedLukman and xet7.</summary>

`Accounts.destroyToken` was not awaited, so the route answered success before
the token was gone, and a failed database write never reached its error
handler. It is awaited now. `tests/restTokenRevocation.test.cjs` covers a slow
and a failed deletion, authorization and session isolation, and
`tests/playwright/specs/rest-token-revocation.e2e.js` logs a browser out with
it.

</details>

**Database indexes** - the queries that scanned whole collections.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8dc77a89d8">Indexes for the LDAP id, cards' assignees and members, and History by entity and hash</a>. Thanks to Raymond-Voogt and xet7.</summary>

An LDAP login looked the user up by `services.ldap.id`, a member's cards were
found by `assignees` and `members`, and the card history by entity and by
integrity hash, all without an index, so each scanned its whole collection on
a large installation. They have indexes now, the LDAP one sparse.
`tests/cardQueryIndexes.test.cjs` and `tests/ldapAndHistoryIndexes.test.cjs`
pin them.

</details>

and adds the following developer tool:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/801f8956fe813a5da0264abf660c18363d2d3bc2">releases/sec downloads a GitHub organization's Security and quality alerts with gh</a>. Thanks to xet7.</summary>

`releases/sec/download-github-security.sh wekan` saves every repository's
Dependabot, code scanning, secret scanning and security advisory alerts to
`.tools/log/sec/<organization>/<repository>/<YYYY-MM-DD_HH-MM-SS>/`, a
directory per kind with a file per alert and a `SUMMARY.md` of the open ones.
It runs the GitHub CLI outside the editor's sandbox, where `gh` and its login
are, so the alerts can be read and fixed from the files inside it. A kind
GitHub does not answer is recorded with its reason, a secret scanning alert's
secret is redacted unless asked for, and a name that is not a GitHub name is
refused before it becomes a path. The test runs it against a stand-in `gh`;
see `releases/sec/README.md`.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.06 2026-11-11 WeKan ® release

**In short:** **CodeQL** alert #601 in a test is fixed, with two more tests
that had the same fault. A card's **overtime** set through the REST API is
saved where WeKan reads it, and cards that lost it before are repaired at
startup. Card **members and assignees** whose account was deleted can be removed
and added without an error, and clearing a card **date** no longer passes as a
date set to the rules, the due date count and the activity feed.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d482856e03129d13c6e171a1503db60d81ab5166">Alert #601: no path is quoted into a bash -c script in the tests</a>. Thanks to GitHub CodeQL and xet7.</summary>

CodeQL flagged a shell command built from environment values (CWE-78, CWE-88)
in `tests/npmRetry.test.cjs`, whose `bash -c` script pasted a temporary path
and a checkout path into its text with `JSON.stringify` - JSON's quotes are not
the shell's, so a path with `$(`, a backtick or `$` would change the command.
The paths now go in through the environment. The guard written for alerts #549
and #550 only knew `source "${path}"`; it now refuses any value quoted into a
`-c` script across the tests, and found the same fault in
`tests/releaseDownloads.test.cjs` and `tests/macosSandbox.test.cjs`, fixed as
arguments. The finding was in tests, not in WeKan, so there is no attempt to
show in Admin Panel → Problems.

</details>

and fixes the following bugs:

**Card overtime** - what the REST API stores, and what it stored before.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f74ef4c40d85f9f6b91b8f4ecfc7372f67d32100">A REST card update saves isOverTime as the isOvertime WeKan reads</a>. Thanks to AhmedLukman.</summary>

A PUT with `{"isOverTime": true}` answered 200 and changed nothing anyone saw:
the handler wrote `isOverTime`, while the schema and the UI use `isOvertime`.
The request keeps its spelling and the validated value is stored in
`isOvertime`. Browser tests cover JSON and form updates, the stored value, a
REST read, the open card, a reload, and refused requests, and the unit test
pins the stored field name.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/569756b66c0fc3e3c41aba93fa8311994c6fa754">An isOverTime stored before that fix becomes isOvertime at startup</a>. Thanks to AhmedLukman and xet7.</summary>

Every overtime set through the API since `b895e61237` was stored under the
field nothing reads. The `card-overtime-field` schema upgrade step folds it
into `isOvertime` where the card has none, keeps the value the UI already shows
where it has both, and removes the stray field - version-gated and idempotent
like the steps beside it. Tests pin the fold, the precedence and a second pass
finding nothing; as negatives, no work on cards without the field, and no
server code writing `isOverTime` into a card.

</details>

**Card members and assignees** - people whose account is gone.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e9d1cb6305a4a36f9cb890c7f5babb66ab4f43c">A member or assignee whose account is gone can be removed</a>. Thanks to AhmedLukman.</summary>

Removing a card member or assignee whose user account no longer exists read
`user.username` of nobody and answered HTTP 500, so the stale id could never
be removed. Both removal hooks now look the name up safely and still record
the removed id. Unit tests run the real hooks, and browser tests cover stale,
missing, repeated and normal removals with their authentication and scope
checks.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32590ee7ab89b41ca6f764a58ec0f43d56d48ab8">Adding a member or assignee whose account is gone no longer throws either</a>. Thanks to AhmedLukman and xet7.</summary>

The joining halves of the same two hooks had the same read. The REST route
checks the user before adding, but a client update, a copied or imported card,
or a rule can still add such an id. Both now record the join with the id and
no username. Tests run the real hooks, and a tree-wide test finds no
`const x = user.field;` straight after a user lookup without a guard.

</details>

**Card dates** - what clearing a date records.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50334816caf227237124b007c53a467c8f6919f5">Clearing a card date no longer passes through the timing hook as a date set</a>. Thanks to xet7.</summary>

The hook that records `a-dueAt` and the other date activities read
`modifier.$set[field]` for every date update, but clearing a date sends only a
`$unset`: without a `$set` the hook threw, and with one beside it an `a-dueAt`
without a value was written - counted as a due date change (#6081), matched by
the "date set or changed" rule triggers (#2474) and shown as an empty date in
the activity feed. Now a date set records its value, a date cleared records
only the date it had - as a rule's removeDate does, and as the board timeline
rewinds - and clearing a date the card does not have records nothing. The rules
skip a cleared date, and the feed shows only the date it had. Tests run the real
hook with a set, a `$unset` alone and a `$unset` beside a `$set`, and a
tree-wide test finds no `modifier.$set[...]` read that assumes the `$set` is
there.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.05 2026-11-10 WeKan ® release

**In short:** WeKan is updated to **Meteor 3.6**. The **Android** bundles
build again, after v13.04's npm retry broke their install, and the **Super
Productivity** export no longer fails for a board with a card whose list is
archived.

This release updates the following dependencies:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0fbef8936fa2524d21048669e4c41be15e4e3f38">Updated to Meteor 3.6</a>. Thanks to xet7.</summary>

From 3.6-rc.1. `meteor update` refused it, because WeKan's forks of six Meteor
packages in `packages/` declared 3.6-rc.1's versions, and a local package
overrides the release's. Meteor 3.6 changed those six only in their version
line, so each fork now declares 3.6's version with its `_1` wrap number. The
Dockerfile builds with Meteor 3.6, and the Bun build's patch applies unchanged
to it as `meteor-3.6.patch`. WeKan builds with Meteor 3.6, and the node suites
pass.

</details>

and fixes the following bugs:

**Release builds** - what the release workflow builds.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d08f658deae3b8369b75f1c54371ad8c1cf9367d">The Android bundles build again: npm-retry.sh is given Android's node and npm</a>. Thanks to xet7.</summary>

v13.04's four Android bundle jobs all failed with "environment: node: unbound
variable". v13.04 sent the Android npm installs through
`releases/npm-retry.sh` by the name of `build-bundle.sh`'s own `npm` shell
function. `npm-retry.sh` is a new bash with `set -u`: the exported function
reached it, but the `$node` and `$npm_cli` it reads did not, so it failed before
npm ran. The two installs now give `npm-retry.sh` the program itself, still
retried on a network error. `tests/npmRetry.test.cjs` fails when any
`releases/` script gives `npm-retry.sh` one of its own shell functions, and
reproduces the failure.

</details>

**Exports** - a board in another tool's format.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b4fe0e7376194c498219a0b496340a94020098a">The Super Productivity export no longer fails on a card whose list is archived</a>. Thanks to xet7.</summary>

A card whose list is archived is collected with an empty list title. The
Super Productivity formatter tagged that card with a tag that did not exist, so
the export threw "Cannot read properties of undefined (reading 'taskIds')" and
the whole board's export failed. That list is now "Untitled", for its tag and
its panel alike, so the panel shows its cards and every tag a task names
exists. `tests/superProductivityFormat.test.cjs` fails with that error on the
old formatter. It was found while checking Weddy's Super Productivity export
against WeKan's formatter.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.04 2026-11-09 WeKan ® release

**In short:** **ListLockBleed** is fixed: when a list refuses a role write
access, that refusal now also holds for the checklist and checklist-item REST
routes. The **Sandstorm** and **Android** bundles retry their npm install when
github.com is briefly unavailable.

This release fixes the following CRITICAL SECURITY ISSUE of [ListLockBleed](https://wekan.fi/hall-of-fame/listlockbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/214b20e7ad">A list that refuses a role write access refuses its checklist REST writes too</a>. Thanks to tsurutanmen and xet7.</summary>

[ListLockBleed](https://wekan.fi/hall-of-fame/listlockbleed/),
[GHSA-4734-8vrg-8j3w](https://github.com/wekan/wekan/security/advisories/GHSA-4734-8vrg-8j3w).
A board admin can refuse a role write access in one list (#4527). The card
and comment REST routes and the DDP checklist writes applied that refusal,
but the six checklist and checklist-item REST routes asked only the board. A
member the list refused could therefore still create, rename, tick and delete
the checklists of its cards with an API token. Those routes now ask the
card's list and answer 403, and the refusal shows in Admin Panel / Problems.
`tests/listPermissions.test.cjs` fails for any REST write route of the tree
that names a card without asking its list. And
`tests/playwright/specs/list-lock-checklists.e2e.js` replays the six writes
against a running server.

</details>

and fixes the following bugs:

**Release builds** - what the release workflow does when a download fails.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3f12b5659">The Sandstorm and Android bundles retry their npm install through a GitHub outage</a>. Thanks to xet7.</summary>

v13.03's Sandstorm .spk failed with "npm error 504 Gateway Time-out" for
github.com's `meteor/node-source-map-support` tarball: the same kind of
outage `releases/npm-retry.sh` has retried since v10.86. That install in
`releases/sandstorm-slim-spk.sh`, and the Android bundle's server and sharp
installs, ran npm without it, because `tests/npmRetry.test.cjs` read only
`release-all.yml`. All three go through the retry now. The test follows
every `releases/` script a workflow runs and fails on a bare npm install in
any of them.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.03 2026-11-09 WeKan ® release

**In short:** The amd64 **snaps** no longer fail the release when the Ubuntu
archive is briefly unreachable: the build waits for it and retries once.

This release fixes the following bugs:

**Release builds** - what the release workflow does when a build fails.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7ace18af8">The amd64 snaps wait out an Ubuntu archive outage instead of failing</a>. Thanks to xet7.</summary>

v13.02's native amd64 snap and both amd64 snap variants failed within eight
minutes of each other with "Failed to refresh package list: failed to run apt
update" while Snapcraft installed build-packages; the arm64 snaps, served by
`ports.ubuntu.com`, built. `releases/snap-refresh-managed-apt.py` recovered
only a stale `.deb` 404, so the one guarded retry never ran. It now also
recognises a failed apt update in the managed build instance, retries
`apt-get update` there with a 30/60/120/240 s backoff, and lets the Snapcraft
retry run only once the archive answers; a longer outage stays fatal. It
prints apt's own error lines first, so a failing job says why apt failed.
`tests/snap-managed-apt.py` pins the recovery, its bound, and that unrelated
failures are still refused.

</details>

and has the following developer-tooling fix:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cc84a07cd">The security regression inventory counts UnassignedArchiveBleed as guarded</a>. Thanks to tsurutanmen and xet7.</summary>

`tests/securityRegressionCoverage.test.cjs` failed once the Hall of Fame
published UnassignedArchiveBleed, because its inventory did not have the name.
It is guarded now by `tests/assignedCardMethods.test.cjs` and
`tests/playwright/specs/assigned-card-methods.e2e.js`, which name it.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.02 2026-11-09 WeKan ® release

**In short:** **UnassignedArchiveBleed** is fixed: a member with the
**Normal, assigned only** role archives and converts only the cards assigned
to them, through every card method.

This release fixes the following CRITICAL SECURITY ISSUE of [UnassignedArchiveBleed](https://wekan.fi/hall-of-fame/unassignedarchivebleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1513b2e98c">An assigned-only member archives and converts only the cards assigned to them</a>. Thanks to tsurutanmen and xet7.</summary>

[UnassignedArchiveBleed](https://wekan.fi/hall-of-fame/unassignedarchivebleed/),
[GHSA-6xqf-jh8x-4wxc](https://github.com/wekan/wekan/security/advisories/GHSA-6xqf-jh8x-4wxc).
The DDP methods `archiveSelectedCards` and `createBoardFromCard` asked only
for the board's write capability, which the Normal, assigned only role has, so
such a member who knew a card's id archived any card of the board - and its
subtasks - and turned any card into a linked-board card. Both now also ask
the card, as `copyCard` does; a selection is checked whole before the first
card is archived. A refusal is shown in Admin Panel / Problems.
`tests/assignedCardMethods.test.cjs` fails for any server method that takes a
card id and decides by the board's write access alone.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.01 2026-11-08 WeKan ® release

**In short:** Translations: the strings still in English are written in **33
more languages**, **Sardinian** is Sardinian instead of Italian and **Moroccan
Arabic** is Darija instead of Persian. Dependabot's updates of **mailparser**,
**isomorphic-git**, **pdfjs-dist** and the S3 libraries are checked and kept,
with the S3 client brought to the version the upload library needs.

This release updates the following dependencies:

- **mailparser 3.12.4 → 3.14.2** — inbound email and bounces; it brings
  nodemailer 10.3.1, libmime 5.6.4 and @zone-eu/mailsplit 5.4.30, the same
  authors' packages ([#6886](https://github.com/wekan/wekan/pull/6886)).
- **isomorphic-git 1.44.8 → 1.44.10** — the GitHub wiki sync; reads commit and
  tag headers the way git does ([#6885](https://github.com/wekan/wekan/pull/6885)).
- **@aws-sdk/lib-storage 3.1155.0 → 3.1161.0** — S3 uploads
  ([#6884](https://github.com/wekan/wekan/pull/6884)); it needs the
  client-s3 below.
- **filesize 11.0.28 → 11.0.30** — file sizes shown
  ([#6883](https://github.com/wekan/wekan/pull/6883)).
- **pdfjs-dist 6.4.299 → 6.5.438** — PDF previews
  ([#6882](https://github.com/wekan/wekan/pull/6882)).
- **mongodb 7.7.0 → 7.8.0** in tests/playwright — the browser tests' seeding
  only ([#6880](https://github.com/wekan/wekan/pull/6880)).
- **helm/chart-releaser-action 1.8.0 → 1.9.0** and **vmactions/netbsd-vm
  1.5.2 → 1.5.3** — CI, each still pinned to the commit its tag names
  ([#6881](https://github.com/wekan/wekan/pull/6881),
  [#6879](https://github.com/wekan/wekan/pull/6879)).

Each was checked before it was kept: every package's integrity matches its
lockfile entry, none has an install script, the action pins are the commits of
their tags, and the new versions add no network calls or telemetry.

Thanks to dependabot.

- **@aws-sdk/client-s3 3.1159.0 → 3.1161.0** - [the version @aws-sdk/lib-storage 3.1161.0 requires as a peer](https://github.com/wekan/wekan/commit/e33b3f26d3db1f15fcea20542c6143d142e84f65); tests/dependencySecurityUpdates.test.cjs caught the mismatch, and only AWS SDK packages changed version. Thanks to xet7.

and updates the following translations:

**Languages updated:** 31 languages.

**Every string in the language** - what was still English, or another language.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1211221a0fe35a9be4b41ef2954935df1c71e62a">The strings still in English, written in 33 more languages</a>. Thanks to xet7.</summary>

Every value still equal to English was written in the locale's language from
its existing translations and kanban terms; only English placeholders were
filled, human translations were not touched and every `__x__` and `%s` is
English's. The commit names the languages written with low confidence.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1d3beb12d62f245ca8f044e5d389e4edb950b92">Sardinian is Sardinian, not Italian</a>. Thanks to xet7.</summary>

1772 values of `sc.i18n.json` were Italian or Italian/Sardinian mixtures; the
locale tag is authoritative, so they are Sardinian now.
`tests/sardinianTranslationProgress.test.cjs` scans every value for words only
Italian has, and proves the scan catches the old strings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe0e187fa0907cf77017e7029eeabdb2450ef1f1">Moroccan Arabic is Darija, not Persian</a>. Thanks to xet7.</summary>

374 values of `ary.i18n.json` were Persian, Persian words in Arabic text, or
English left in. `tests/moroccanArabicNotPersian.test.cjs` scans every value for
words only Persian has, pins repaired values and checks every placeholder.

</details>

and has the following developer-facing changes:

- [Companion repositories are found in .tools/w, .tools/xet7 and .tools/Secretchronicles](https://github.com/wekan/wekan/commit/11bed267889c77ffc6651e858a6eb6ec1e4c83a1). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.00 2026-11-07 WeKan ® release

**In short:** **CreateBleed** is fixed: "Only admins can create boards" now
holds on every path that creates a board - the browser console, the REST API,
imports, copies, clones and cards - not only on the Add Board form. The **REST
API documentation** spells the name **WeKan**, so the API pages published on
wekan.fi pass its brand-spelling check again.

This release fixes the following CRITICAL SECURITY ISSUE of [CreateBleed](https://wekan.fi/hall-of-fame/createbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c1f6088f4">Only admins create boards on every path, not only through Add Board</a>. Thanks to tsurutanmen and xet7.</summary>

[CreateBleed](https://wekan.fi/hall-of-fame/createbleed/),
[GHSA-qcfm-2g4w-wqcc](https://github.com/wekan/wekan/security/advisories/GHSA-qcfm-2g4w-wqcc).
Admin Panel / Settings / Visibility / "Only admins can create boards"
([#4475](https://github.com/wekan/wekan/issues/4475)) was checked only inside
`createBoardWithInitialSwimlanes`, the Add Board form. A user who is not an
admin still created working boards with a console `Boards.insert` - the
board collection's allow rule approves any signed-in user - with
`POST /api/boards` and with both board import routes, as reported, and also
with `importBoard`, `cloneBoard`, `copyBoard`, `POST /api/boards/:boardId/copy`
and `createBoardFromCard`. The boards belonged to their creator; no other
user's data was read or changed.

One decision (`models/lib/boardCreationPolicy.js`) and one guard
(`server/lib/boardCreationGuard.js`) are now asked by every one of those paths
before they write, and by a new `Boards.deny` insert rule. A board template
stays every member's own, and boards WeKan makes by itself - a user's
Templates board, a board's subtasks board - are not user creations. A refused
REST call answers 403. A refusal is recorded in Admin Panel / Problems as
CreateBleed (`authz.board-creation`, low, CWE-863, never disables the
account), and Duplicate and "Create board from card" are hidden like Add
Board, so only a client bypassing the interface reaches it.
`tests/createBleed.test.cjs` drives the decision, the guard and the real deny
rule against the reporter's console insert, and fails if any path that creates
a board for a user does not ask the guard, or if anything else reads the
setting; `tests/playwright/specs/createbleed-board-creation-admin-only.e2e.js`
replays the report against a running server.

</details>

and fixes the following documentation bugs:

**REST API documentation** - the name is WeKan in the API reference, from the
generator to the page wekan.fi publishes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d5fe63fc4">The REST API documentation spells the name WeKan</a>. Thanks to xet7.</summary>

The header of `openapi/generate_openapi.py` and the JSDoc of six models said
"Wekan REST API", "extend Wekan", "a production Wekan server" and "in the
Wekan board", so every `public/api/wekan.yml` and the API pages built from it
said Wekan too, and the v12.95, v12.96 and v12.97 pages on wekan.fi failed its
`tests/brand-spelling.test.cjs`. The generator, the model comments and
`wekan.yml` now say WeKan. `tests/openapiBrandSpelling.test.cjs` checks the
generated file, the generator header and every model JSDoc block, and fails on
the files before this change.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0275363043">The built API page says WeKan, so the v12.99 page on wekan.fi does too</a>. Thanks to xet7.</summary>

The v12.99 version bump rebuilt `public/api/wekan.html` with the generator from
before the fix, and `releases/release-website.sh` copies that file to wekan.fi
as `api/v12.99/index.html`. Its visible text and the JSON Redoc rebuilds the
page from now say WeKan, and `tests/openapiBrandSpelling.test.cjs` checks the
built page as well.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.99 2026-11-06 WeKan ® release

**In short:** The **mac-arm64** release bundle builds again: its job asked for
GitHub's retired **macos-14** runner and was cancelled in the v12.98 release
run. The **weba** instructions now live in the weba repository itself.

This release fixes the following release build bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e4483b1a9">The mac-arm64 bundle is built on macos-15, because GitHub retired macos-14</a>. Thanks to xet7.</summary>

In the v12.98 release run, build-mac-arm64 was cancelled with "The
configuration 'macos-14-arm64-us-default' is not supported", so v12.98 has no
mac-arm64 bundle. The job now runs on `macos-15`, which is Apple Silicon too
and is what `mac.yml` already uses. `tests/workflowRunnerLabels.test.cjs` lists
`macos-14` as retired, so no workflow can ask for it again, and checks that
build-mac-arm64 asks for a current Apple Silicon runner.

</details>

and has the following developer documentation change:

- [The weba instructions moved from AGENTS.md and CLAUDE.md into the weba repository](https://github.com/wekan/wekan/commit/b4cb989391).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.98 2026-11-06 WeKan ® release

**In short:** **GroupLinkBleed** is fixed: a board admin can no longer skip the
board methods by writing the board directly, to attach an organization or team
they do not belong to or to add a member past the invitation checks.
**Public board CSV and TSV exports** honour the selected columns, and the REST
**card archive, restore and custom-field** endpoints answer an unmatched card
with a JSON 404 instead of 500, and a REST **card update** can set sort 0, turn
overtime off and clear a description. The **notifications drawer** gets its
attachments again, and the developer instructions cover the **weba** Gambas
companion repository.

This release fixes the following CRITICAL SECURITY ISSUE of [GroupLinkBleed](https://wekan.fi/hall-of-fame/grouplinkbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3458004ec">Board admins can no longer attach foreign teams or add members by direct board writes</a>. Thanks to bhaswanthc and xet7.</summary>

[GroupLinkBleed](https://wekan.fi/hall-of-fame/grouplinkbleed/),
[GHSA-v544-rmr5-38gx](https://github.com/wekan/wekan/security/advisories/GHSA-v544-rmr5-38gx).
The board allow rule lets a board admin update any field, and two checks lived
only in Meteor methods: adding only the organizations and teams the admin
belongs to ([#5141](https://github.com/wekan/wekan/issues/5141)), and the
invitation's checks, including the same organization/team policy
([#6116](https://github.com/wekan/wekan/issues/6116)). A client writing the
board over DDP skipped both, so a whole team could be given an attacker's
board and any user added to it. Client writes naming `orgs`, `teams` or
`domains`, and client updates that add or reactivate a member, are now
refused and shown in Admin Panel / Problems; role changes and removals still
pass. `tests/groupLinkBleed.test.cjs` runs the real deny rules and fails if a
method-guarded board field is client-writable.

</details>

and fixes the following bugs:

**Exports** - the CSV and TSV columns a public board exports.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4762bed8c1">Public board CSV and TSV exports honour the selected fields</a>. Thanks to AhmedLukman and xet7.</summary>

On a public board the CSV and TSV export ignored `fields=` and wrote all 20
columns, while a private board wrote only the selected ones (PR
[#6875](https://github.com/wekan/wekan/pull/6875)). The validated selection is
now parsed once, before the public/private branch, so both get the same
columns; a missing, empty or unrecognised selection still exports all of them,
and the export guards are unchanged. `tests/publicCsvExportFields.test.cjs`
drives the route for comma, semicolon and tab, and a Playwright spec checks the
export menu's checkboxes on a public board.

</details>

**REST API** - what the card endpoints accept, and answer when no card matches.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b33c7d7ba">Card archive and restore answer a JSON 404 for an unmatched card instead of 500</a>. Thanks to AhmedLukman and xet7.</summary>

`POST …/cards/:cardId/archive` and `…/unarchive` threw `Meteor.Error(404)`
when no card matched the board, list, id and archive state. A WebApp handler is
a plain connect handler, so that reached the client as HTTP 500 (PR
[#6876](https://github.com/wekan/wekan/pull/6876)). They now answer through
`sendJsonResult` with `{ error: 'Card not found' }` and 404, writing nothing.
`tests/restCardArchive.test.cjs` and a Playwright spec cover a missing card,
the wrong list, the wrong board, the wrong state and refused callers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b0a71ba57b">A card update can set sort to 0</a>. Thanks to AhmedLukman and xet7.</summary>

`PUT …/cards/:cardId` with `{ "sort": 0 }` answered 404 and left the card
where it was, because the handler read `sort` by truthiness (PR
[#6877](https://github.com/wekan/wekan/pull/6877)). It now writes any sort that
is present. `tests/restCardSort.test.cjs` and a Playwright spec check 0, other
numbers, form-encoded `'0'`, an omitted sort and refused callers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b895e61237">A card update checks sort, isOverTime and description, so false and empty work</a>. Thanks to AhmedLukman and xet7.</summary>

Writing `sort` whenever it is present would also have written `null`, `''` or
`'abc'` as the card's position, and the same handler read `isOverTime` and
`description` by truthiness, so overtime could not be turned off and a
description could not be cleared. `parseCardScalarFields()` decides all three
by presence before the first write: sort a finite number, isOverTime a boolean
(`'true'`/`'false'` from a form too), description a string or `null` to clear.
Anything else is a 400 and the card is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d5f660c27">The card custom-field update answers a JSON 404 for an unmatched card instead of 500</a>. Thanks to AhmedLukman and xet7.</summary>

`POST …/cards/:cardId/customFields/:customFieldId` had the same
`throw new Meteor.Error(404)` as the archive endpoints, and now answers the
same JSON 404. `tests/restHandlerNotFound.test.cjs` drives it for a matching,
missing, wrong-list, wrong-board and archived card, and scans every
`WebApp.handlers` route in the tree so no REST handler answers not-found by
throwing again.

</details>

**Notifications** - what the notifications drawer receives.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/adb73fd8ee">The notifications drawer receives its attachments again, without a server exception</a>. Thanks to xet7.</summary>

Every `notificationAttachments` subscription failed with `Publish function can
only return a Cursor or an array of Cursors`: Attachments is an ostrio:files
FilesCollection, and the publication returned its FilesCursor instead of the
Mongo cursor it wraps. It now returns `.cursor`, as every other attachment
publication does. `tests/publishFilesCursor.test.cjs` runs the publication and
scans every publishing file so no attachment or avatar cursor query is
published without it.

</details>

and has the following developer-facing changes:

**Tests** - guards that had drifted from the code they pin.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68b575637d">Three client guards follow the code they pin again</a>. Thanks to xet7.</summary>

`sidebarBelowHeader`, `maximizedCardPosition` and `titleClickToEdit` read
source that the full screen button, the phone-below-header rule and the
Pointer Events drag had since moved. The behaviour had not changed; the guards
now read the new places, `titleClickToEdit` calls `cardHeaderPress()` from
`models/lib/windowDrag.js`, and each still fails when its behaviour is removed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/081690875d">The real single executable test says why it cannot run on a kernel with large pages</a>. Thanks to xet7.</summary>

`--build-sea` injects the SEA blob with LIEF, which adds 4 KiB-aligned
segments; a Linux kernel with 16 KiB or 64 KiB pages cannot map them, and the
executable dies with SIGSEGV - a one-line `console.log` SEA does too. The test
failed there as `null !== 0`; it is now skipped on such a kernel with that
reason. Release builders have 4 KiB pages and still run it.

</details>

**Developer instructions** - what an assistant working in this repository is
told.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ef7a57ce4">AGENTS.md and CLAUDE.md describe the weba companion repository</a>. Thanks to xet7.</summary>

`.tools/weba` is the separate `wekan/weba` repository, a Gambas Web UI Kanban
with SQLite by default. The instructions say where its project, forms, browser
reports and database modules are, that WeKan's author, local-commit and no-push
rules apply there too, how to compile and run it with `gbc3`/`gbx3` from the
local Gambas under `.tools/bin/gambas3`, how its tests run on a copy of the
database, and to keep its SQL portable across Gambas database drivers.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.97 2026-11-06 WeKan ® release

**In short:** `build.sh` and the `releases/` scripts now work on **Arch Linux**
and **Omarchy**, and the release builds no longer lose the **OpenBSD arm64
bundle** to a smoke test that left WeKan running, or the **s390x snap** to
Launchpad outages that were counted as build failures.

This release fixes the following release build bugs:

**Release builds** - bundles and snaps that built correctly but failed the job.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b46f155fa3">The BSD smoke test stops WeKan and FerretDB and removes its files before returning</a>. Thanks to xet7.</summary>

v12.96 openbsd-arm64: `releases/bsd/smoke.sh` returned OK with WeKan and
FerretDB still running, because `start-wekan.sh` runs its TERM trap only after
the foreground node exits. FerretDB then removed `wekan.sqlite-wal` and `-shm`
while the VM's copyback rsync walked the workspace, and rsync exit 24 failed a
bundle that had built and started. The smoke test now stops both, waits until
they are gone and deletes its work directory. `tests/bsdBundles.test.cjs`
runs it against a launcher of `start-wekan.sh`'s shape and fails if a process
or a smoke-test file is left behind.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b46f155fa3">Launchpad outages seen only in snapcraft's execution log earn snap retries</a>. Thanks to xet7.</summary>

v12.96 s390x: all three attempts met Launchpad's `HTTP Error 503` /
`Error: Timeout`, but snapcraft printed only its last exception, "Could not
find repository at path ...", so the outage was counted as three WeKan
failures. `infra_failure()` now reads this attempt's snapcraft execution logs
too, and counts the "You do not have permission to create refs/" push refusal
from the half-created repository. `tests/snapLaunchpadInfraRetry.test.cjs`
pins both, and its negatives an earlier attempt's log and one with no outage.

</details>

and has the following developer-tooling fix:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c61a1b7f41">build.sh and releases scripts work on Arch Linux and Omarchy</a>. Thanks to xet7.</summary>

Omarchy is Arch with Hyprland: pacman, the Arch repositories and yay for the
AUR. `releases/ensure-tools.sh` names it and the other Arch derivatives
explicitly. Packages are installed with `pacman -S --needed` instead of the
unsupported `-Sy` partial upgrade; a full `-Syu` runs only on a never-synced
pacman or with `WEKAN_PACMAN_SYU=1`, and a failed install says to update first
(`omarchy-update` on Omarchy). 7zip replaces Arch's retired p7zip, snapcraft
gets snapd from the AUR with yay or paru, the SSH server menu entries use
`sshd.service` outside Debian/Ubuntu, and Playwright's browser libraries come
from pacman (or dnf) instead of the apt-only `--with-deps`, with WebKit in the
Playwright Docker image on Arch. `tests/archOmarchyScripts.test.cjs` drives
the helpers offline, and its negative test fails if any shell script does a
`pacman -Sy` partial upgrade or installs p7zip.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.96 2026-11-05 WeKan ® release

**In short:** The release **bundle starts again**: v12.95's build stopped on
boot because the **nodemailer** 10 raised inside Meteor's email package no
longer had the files that package was built against.

This release fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a21b074d4">The bundle starts again, with nodemailer 10 inside Meteor's email package</a>. Thanks to xet7.</summary>

v12.95 raised the nodemailer in `meteor/email` from 8.0.3 to 10.3.1, and
nodemailer 10 moved `lib/` to `dist/cjs/`. `packages/email.js`, compiled
against 8.0.3, links `lib/nodemailer.js` and `lib/well-known/index.js` and
`Npm.require`s `lib/mail-composer` by path, so build-amd64 failed its smoke
boot. `releases/bundle-npm-security-bumps.json` now shims nodemailer as it
already shims uuid 11: `lib/nodemailer.js` and every `lib/<name>` directory the
exports map lists are written back, forwarding to `dist/cjs`, with a
`lib/package.json` marking them CommonJS because nodemailer is `"type":
"module"`. A fresh local bundle taken through build-amd64's install, bump, trim
and prune steps passes `releases/bundle-smoke-boot.sh`.
`tests/bundleNpmSecurityBumps.test.cjs` requires the recorded paths through the
shim, checks every exported `lib/<name>`, and fails without the CommonJS marker.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.95 2026-11-05 WeKan ® release

**In short:** **Continuous backup** now runs on one server at a time, with a
lease, when WeKan has several servers. Missing-board **exports** and REST
updates of missing **integrations**, **users**, **organizations** and **teams**
answer 404 instead of 200, the **minicard** shows a picked Requested by and
Assigned by, a card stops offering the attachment "+" when uploads are blocked,
and the Docker image's **nodemailer**, **body-parser**, **qs**, **uuid** and
**postcss-selector-parser** are raised past the advisories a Grype scan found.

This release fixes the following bugs:

**Exports** - what the export routes answer when something is wrong.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c0d666ffa">Missing-board exports return 404, and an over-long export token returns 400</a>. Thanks to AhmedLukman and xet7.</summary>

The board Excel export answered a missing board with HTTP 200 and only the text
`Board not found` (PR #6869). The two PDF export routes had the same fault, and
the Excel and PDF routes answered an over-long auth token with 200 as well,
while `export.js` already used 404 and 400. All of them now choose their status
the same way.

`tests/exportErrorStatuses.test.cjs` scans every `models/export*.js` route for a
text answer without a status, so the fault cannot return anywhere there; the
PR's route and browser tests stay.

</details>

**Continuous backup** - which server streams it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/880ec2d707">Only one server streams it at a time, holding a lease</a>. Thanks to Raymond-Voogt and xet7.</summary>

With several WeKan servers on one database, every server applied the continuous
backup setting, so
each of them tailed the oplog and wrote its own archives into the same target
directory
(\#6861). The leader now holds a lease, one `continuousBackupLease` document
with its id and an
expiry. Taking it is one atomic operation, the leader renews it every 15 seconds
and it lapses after
45, so another server takes over within a minute when the leader stops, and a
server that loses the
lease stops its stream. Startup, saving the settings and a change saved on
another server converge
through that loop; a restore or a fetch from the cloud takes the lease and waits
one renewal so it
is the only writer. One server is always its own leader.

Checked against the real driver on FerretDB (SQLite): 24 clients at once give
exactly one leader, and
renewal, expiry, the old leader losing the lease and release behave.
`tests/continuousBackupLease.test.cjs`
pins the same and the wiring.

</details>

**Attachments** - what a card offers when the administrator blocked uploads.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8b3579117">A card no longer offers the attachment "+" when uploads are blocked for the whole site</a>. Thanks to Raymond-Voogt and xet7.</summary>

Admin Panel / Attachments / Transfer limits already has "Attachments upload" and
"API upload" set to
Blocked, and the server refuses on every path: the upload pipeline,
`api.attachment.upload` and
`.copy`, and the `/api/attachment` upload, upload-background and copy routes.
The card still showed
the "+" button and accepted a drop or paste for an upload that would then be
refused. It now asks
the server one boolean, at most once a minute, and hides both. No second setting
was added
(\#6870 proposed a `disableAttachments`), so nothing can disagree with what the
server enforces.

`tests/attachmentUploadPolicy.test.cjs` pins the client, the method, the server
enforcement it relies
on, and that no `disableAttachments` setting exists.

The method was not imported at first, so the call failed and the "+" stayed;
[a follow-up](https://github.com/wekan/wekan/commit/3aaa46fdae) loads it, and
`tests/serverModulesLoaded.test.cjs` now passes.

</details>

**REST API** - what the integration, user, organization and team update routes
answer for something that is not there.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6012521ccc">An integration update for a missing or wrong-board integration returns 404</a>. Thanks to AhmedLukman and xet7.</summary>

`PUT /api/boards/:boardId/integrations/:intId` answered 200 with the requested
id when no
integration matched that id and board (PR #6871). The two activities routes
(`POST` and `DELETE`
`.../activities`) updated nothing and answered 200 with `data: null`. All three
now look the
integration up on that board after board-admin authorization and answer the JSON
404 the `GET`
route already uses, before validating or writing anything.

`tests/restIntegrationWriteRoutes404.test.cjs` pins, for the whole file, that
every handler that
updates an integration looks it up first and only after authorization; the PR's
route and browser
tests stay.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3edc56170">An update of a missing user returns 404</a>. Thanks to AhmedLukman and xet7.</summary>

`PUT /api/users/:userId` answered 200 with no data when no user had that id,
for every action (PR #6873). After the admin check it now answers a JSON 404
`User not found` before taking ownership, disabling or enabling a login.
`tests/restUserUpdate.test.cjs` runs the handler for every action against a
missing user, and checks that authorization still comes first, that
self-disable stays a no-op and that a database failure stays a safe 500;
`tests/playwright/specs/rest-user-update.e2e.js` drives it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d44349ab6">A feature update of a missing organization or team returns 404</a>. Thanks to AhmedLukman and xet7.</summary>

`PUT /api/admin/orgs/:orgId/features` and `PUT
/api/admin/teams/:teamId/features`
answered 200 with `data: undefined` when there was no such organization or team
(PR #6874). They now answer a JSON 404 `Organization not found` / `Team not
found`. `tests/restPeopleFeatures.test.cjs` runs both handlers for missing and
existing records, empty bodies, denied authorization and database failures;
`tests/playwright/specs/rest-people-features.e2e.js` checks the Admin Panel /
People feature checkboxes.

</details>

**The minicard** - who requested and who assigned a card.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22e5df55d7">Requested by and Assigned by show when a member was picked, with one icon per field everywhere</a>. Thanks to mueschel and xet7.</summary>

The opened card's + button picks board members into `requesters` /
`assigners`, and the free-text name is optional, but the minicard drew only the
free text: a requester picked the usual way never showed although Show on
Minicard was on (#6872). The minicard now shows the picked members as avatars
beside any typed name. Card Settings also had the icons swapped - a head with a
plus for Requested by and a cart for Assigned by - and now uses the cart and
user-plus that the opened card and the minicard use.
`tests/minicardRequestedAssignedBy6872.test.cjs` pins the avatars, the
either-or condition and one icon per field, and fails on a minicard block gated
on the free text alone;
`tests/playwright/specs/minicard-requested-by-6872.e2e.js`
drives it.

</details>

and updates the following dependencies:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dad03959d9">nodemailer 10.3.1, body-parser 1.20.9 and 2.4.0, qs 6.16.1, uuid 11.1.1 and postcss-selector-parser 6.1.5 in the bundle</a>. Thanks to the Grype scan reporter and xet7.</summary>

A Grype scan of the image found High and Medium advisories in packages that
Meteor's own packages carry inside `programs/server/npm/node_modules/meteor/`,
where `package.json` and its `overrides` cannot reach.
`releases/bump-bundle-npm-deps.mjs` raises them after `meteor build`.

- **nodemailer 8.0.11 to 10.3.1** (GHSA-2x7j-588g-ccc2, GHSA-v53p-9fqp-m79j,
  GHSA-p6gq-j5cr-w38f and the rest fixed in 10.1.4 or later). It was listed as
  not fixable because the fix is a new major. `meteor/email` only calls
  `createTransport`, the `stream` plugin hook, `nodemailer/lib/well-known` and
  `nodemailer/lib/mail-composer`, and all four were run against 10.3.1 through
  the bundle's own package specifiers.
- **body-parser 1.20.6 and 1.20.8 to 1.20.9, and 2.3.0 to 2.4.0**
  (GHSA-27r3-jxmh-p828). A minimum may now be written `body-parser@2`, which
  applies to copies of that major only, so each major is raised inside itself.
- **qs to 6.16.1** (GHSA-6pq8-jhm2-2vcw) and **postcss-selector-parser 6.1.4 to
  6.1.5** (GHSA-rj75-hqrm-r3gf).
- **uuid 8.3.2 and 9.0.1 to 11.1.1** (GHSA-w5hq-g745-h8pq). uuid 11 moved its
  entry point from `dist/index.js` to `dist/cjs/index.js`, which killed the
  server on boot the one time it was tried. The bumper now writes the old
  `dist/index.js` back as `export * from './esm/index.js'`: it is an ES module
  because uuid is `"type": "module"`, and Node 26 `require()`s it.

glob 14 and minimatch 11 were already in `package.json`; the scanned image
predates them. The runtime image installs no compiler (`gcc-14-base` is Debian's
one-file package), so the multi-stage build the report asks for is already how
it is built. Run against a copy of the published image's bundle, the bumper
raised all of the above and every raised copy loaded.

**This release's bundle did not start.** "Every raised copy loaded" was checked
by loading each package, not by booting the bundle: nodemailer 10 moved `lib/`
to `dist/cjs/`, Meteor's `email` package still links the `lib/` paths of 8.0.3,
and build-amd64 failed its smoke boot with "Cannot find module
.../meteor/email/node_modules/nodemailer/lib/nodemailer.js". The fix is in the
next release.
`tests/bundleNpmSecurityBumps.test.cjs` pins the minimums, the per-major
rule and the shim, and runs the bumper with `--dry-run` on a bundle of
body-parser, uuid and nodemailer copies at, below and above their minimums.

</details>

and has the following documentation change:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/016b4bf3bd">Only maintainer mode commits directly and updates changelogs, and a pull request has one feature or fix</a>. Thanks to xet7.</summary>

CLAUDE.md and AGENTS.md now say that a pull request contributor, to wekan/wekan
or to the maintainer's repositories under `.tools/`, sends each feature or fix
as its own pull request with only related changes in it, and changes no
changelog. The maintainer, or an agent working as the maintainer, writes the
entry after merging, when there is a commit to link.
`tests/changelogFormat.test.cjs` checks both files.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.94 2026-11-04 WeKan ® release

**In short:** On an iPad the **opened card covers the header bar** instead of
sitting
behind it, and the speed test measures where the time goes when a WeKan board is
opened, on FerretDB and on MongoDB.

This release fixes the following bugs:

**Opened cards** - where a card opens.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efaf94242e">On a phone in desktop mode the opened card starts below the header bar</a>. Thanks to xet7.</summary>

The header wraps to several rows on a phone, far taller than the 8px the
floating card docks at, so the card's top row was among the header's rows and
was only seen by dragging it down. Below 801px a card without an inline top,
popup cards included, now starts at `--wekan-header-height` + 8px. A dragged
place is an inline top, so it is kept when the finger is lifted.
`tests/cardBelowHeaderOnPhone.test.cjs` pins the rule and that it never
matches a dragged card.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/006d24502c">The opened card covers the header bar on an iPad instead of sitting behind it</a>. Thanks to xet7.</summary>

On iPad Chrome (and Safari) the opened card's top row - the collapse caret, the
card
number, the menu, maximize and X - was behind the header bar, although the
card's
`z-index` is 2001 and the header's 1000. iOS WebKit makes every scrolling
element
(`#content`, the board wrapper) a stacking context of its own, so the card's
`z-index`
is compared only inside it, and the header bar, itself a stacking context, is
painted
over all of it. While a card is open the header bar is now at the level of the
content,
which comes after it in the page and paints over it; with no card open it keeps
its
own level. A browser spec makes the same trap with `isolation: isolate` on
`#content`
and the board wrapper and shows the card over the header, open and collapsed,
with its
close button reachable, in Chromium and WebKit; without the rule it fails as the
screenshot shows. `tests/cardOverHeaderStacking.test.cjs` pins the rule and its
selector. An iPad is the final check.

</details>

and has the following documentation change:

**Database speed test** - how fast the databases answer WeKan's queries.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3621413d6f">The speed test measures where the time goes when a WeKan board is opened, on FerretDB and on MongoDB</a>. Thanks to Raymond-Voogt and xet7.</summary>

`docs/Databases/FerretDB/1/SpeedTest/app` opens a board of 200, 2,000 and 5,000
cards in
Chromium on WeKan with FerretDB (SQLite) and with MongoDB 8, and profiles the
Meteor
server (Node inspector) and FerretDB (pprof). Two runs each. The Meteor server
uses
0.1-0.5 s of CPU, the same on both, and its DDP server is 1% of that; the
browser gets
the same ~210 KB at every size. A 5,000-card board takes FerretDB 400-600 ms
longer to
open (first card +42-48%), a small board only 70-100 ms, and FerretDB spends
about 4 s
of CPU on it, 39% in the SQLite engine and 34% filtering in Go what it read. So
a
backend rewritten in another language would save part of a fraction of a second,
while
the part that scales with the board is the database layer. The README says what
was not
measured: a production build, the browser's own time, and which query sends the
`aggregate`. `tests/boardOpenProfile.test.cjs` pins the analysis of the profile
and what
the README claims.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.93 2026-11-04 WeKan ® release

**In short:** The database **speed test** has a new small-scale result, ordered
from fastest to slowest with how many times slower each database is, and two
more databases: **pgrust** (PostgreSQL in Rust) and **TiDB**. Noria, YugabyteDB
and CockroachDB were looked at and cannot be used, for reasons the README gives.

This release adds the following new features:

**Database speed test** - how fast the databases answer WeKan's queries.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46c0ad43e8">Results.md is a quick small-scale run, fastest first, with how many times slower each is</a>. Thanks to Raymond-Voogt and xet7.</summary>

The speed test was only ever run at twice a production WeKan, which takes hours.
`WEKAN_SPEEDTEST_SCALE=0.05` is 1/20 of one and the whole run takes under half
an
hour. Results.md opens with an **At a glance** table: rank, the total of all
queries, and **how many times slower** than the fastest database, for the
average
user and for the slowest one (the biggest board or the busiest user). Every
table
is ordered by its own numbers, so the slowest-user table can rank differently,
the
loading table is ordered by the whole load time, and the header says the real
data
size and the real operating system (it said "twice a production WeKan" and
"Linux" whatever was measured). `tests/dbSpeedTest.test.cjs` pins the ranks, the
ratios, the per-table order and the header, with a negative test for each.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46c0ad43e8">The speed test includes pgrust, PostgreSQL rewritten in Rust</a>. Thanks to Raymond-Voogt and xet7.</summary>

[pgrust](https://github.com/malisper/pgrust) v0.4-beta is wire compatible with
PostgreSQL 18, so FerretDB's PostgreSQL handler uses it unchanged, and it gives
the
same answers as MongoDB. It is **not faster** than PostgreSQL for WeKan's
queries
(174 ms against 145 ms in total), and creating WeKan's 47 indexes takes 38 s
against 1 s. In the conformance run it is opt-in (`WEKAN_CONFORMANCE_PGRUST=1`).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f576a0cca9">The speed test includes TiDB, and the README says which other databases cannot run FerretDB and why</a>. Thanks to Raymond-Voogt and xet7.</summary>

TiDB 7.5 (Apache-2.0, MySQL protocol, one process on its own storage) runs
FerretDB's MySQL handler and gives the same answers as MongoDB, after one change
in FerretDB: its metadata table's generated columns are `VIRTUAL`, because TiDB
refuses `ALTER TABLE ... ADD COLUMN ... STORED`. Opt-in in the conformance run
(`WEKAN_CONFORMANCE_TIDB=1`). Noria has no JSON type, triggers or generated
columns, which the MySQL handler needs; YugabyteDB refuses a `CREATE INDEX` on a
`jsonb` expression, which every FerretDB v1 PostgreSQL index is; CockroachDB is
under a proprietary licence. The README's **Other databases tried** has the
reasons.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c44876beb">The speed test includes Dolt, and VersionHistory tests what version history would give undo and redo</a>. Thanks to Raymond-Voogt and xet7.</summary>

[Dolt](https://github.com/dolthub/dolt) (git for data, MySQL protocol) runs under
FerretDB's existing MySQL handler and gives the same answers, but is by far the
slowest: 20,470 ms in total, 1,230x MongoDB, because every query over cards is a
2.8 s whole-table scan. `docs/Databases/FerretDB/1/VersionHistory` drives
WeKan-shaped changes through FerretDB onto Dolt and through the REST API of
TerminusDB. Dolt makes a commit per FerretDB write for +0.4 ms, undoes and
redoes
with `DOLT_REVERT` and reads any earlier state with `AS OF`, but names the SQL
user and not the WeKan user, and cannot restore one field of a document that
changed again (a conflict). TerminusDB records the author and message of every
commit and restores one field while later changes stay, but speaks neither the
MongoDB protocol nor SQL. WeKan's own History remains the undo; Dolt would be a
backup and audit layer under it. ClickHouse and StarRocks were tried with the
MySQL handler and need a handler of their own, which has not been written.
`tests/versionHistoryExperiment.test.cjs` and `tests/dbSpeedTest.test.cjs` pin
the
scripts and the findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96d56ecc6c">Go databases that could be linked into FerretDB were compared with its SQLite: none is faster where it counts</a>. Thanks to Raymond-Voogt and xet7.</summary>

`docs/Databases/FerretDB/1/SpeedTest/embedded` is a Go module of its own (pure
Go,
no cgo) that loads the speed test's cards into SQLite set up as FerretDB sets it
and into Pebble, Badger, bbolt, BuntDB, Nutsdb and Clover, and asks each the
questions WeKan asks of cards, at 15,377 and 153,768 cards. Every engine must
give
the right counts first. A board's cards take the same time on every engine that
is
not slower, because decoding the JSON dominates; the key-value stores win single
reads and writes by microseconds that a FerretDB call hides, and would make the
handler do in Go what SQL does in SQLite. Pebble is 12x slower on fetching a
board, Clover 90-190x slower in total, and bbolt with its default fsync 100-160x
slower on writes. The README accounts for every entry of the awesome-go
databases section. `tests/embeddedEnginesBench.test.cjs` pins the export, the
engines, the SQLite setup and the conclusion.

</details>

**The header bar** - what sits beside the logo.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f25957dcf3">A full screen button to the right of the logo in the header bar</a>. Thanks to xet7.</summary>

A button puts the whole page in full screen and takes it out again with the
Fullscreen API, in iPad Safari, desktop browsers and Android browsers. Its label
is the existing Maximize, so no language file changes. It is drawn only where
the
browser offers the API and the page may use it: iPhone Safari does not have it
for pages (use Add to Home Screen, the manifest says `display: standalone`), and
neither does a page in an iframe without `allowfullscreen`. The icon follows the
browser's own events, so leaving with Esc is understood.
`tests/fullscreenButton.test.cjs`
drives the pure part with fake documents, including a refusal, and
`tests/playwright/specs/header-fullscreen.e2e.js` checks the position, the
label,
entering, leaving, Esc and the negative case in Chromium and WebKit.

</details>

and updates the following dependencies:

- **minimatch 10.2.6 → 11.0.4** in the `npm-packages/exceljs` and vendored
  `jade` lockfiles ([GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249),
  Dependabot alerts \#180 and \#182), through overrides on `readdir-glob`,
  `glob` 13 and
  `test-exclude`, as the root lockfile has; a test reads every
  `package-lock.json`.
- **klauspost/compress 1.18.0 → 1.18.7**, **golang.org/x/net 0.23.0 → 0.62.0**,
  **golang.org/x/text 0.14.0 → 0.43.0**, **golang/glog 1.0.0 → 1.2.4** and
  **OpenTelemetry 1.41.0 → 1.42.0** in the Go module of the embedded-engine
  benchmark (Dependabot alerts \#183-\#187; `govulncheck` reports none). A test
  holds
  every `go.mod` at or above these floors.

Thanks to dependabot.

and fixes the following bugs:

**Opened cards** - where a card opens.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84b0480aa8">A card opened as a popup covers the header bars instead of opening below them</a>. Thanks to xet7.</summary>

On an iPad, a card opened from the Roadmap view (and from search results and the
table view) opened below the top header, and collapsed it was a bar floating
over
the swimlane. A card opened as a popup got the generic wide-layout rule
`top: 97px` and `z-index: 30`, because the desktop-mode rules that dock an
opened
card at the top skip a popup, while the popup wrapper rule in the same file says
it must cover the header bars. It now docks at `top: 8px` with `z-index: 2001`
in
the wide layout; mobile mode keeps its full-window rule. This was reproduced in
Chromium and in WebKit with an iPad profile; whether it is the whole of what an
iPad shows is for the iPad to say.
`tests/cardPopupOverHeader.test.cjs` pins the rule and
`tests/playwright/specs/card-popup-over-header.e2e.js` shows the card over the
header, open and collapsed, and fails without the fix (top 97 against a header
88
high).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b05673200">The opened card and every popup move under a finger, on an iPad</a>. Thanks to xet7.</summary>

On an iPad the opened card did not move when dragged from the collapse caret,
the
space beside it, the card number, or the drag handle, while the page behind it
scrolled. The card window was moved by mouse events only, which a finger does
not
send while it moves, and its drag areas did not say `touch-action: none`, so the
browser took the gesture for a scroll. It is moved by Pointer Events now: the
header row or the handle starts the drag; a link or button in the row (the
caret,
close, the menu) still does its job when tapped and moves the window when
dragged,
without also collapsing or closing; the title still edits when tapped; and with
drag handles on only the handle moves it. The card number is above the title's
edit
zone, so it drags too. The window is kept within reach, and `touch-action: none`
is
on the card header, its handle and every popup's title bar and handle, so popups
move by finger as well.
`tests/windowDragTouch.test.cjs` pins the decisions and the wiring, and
`tests/playwright/specs/card-window-touch-drag.e2e.js` drags with a real touch
from
each place with handles on and off, taps the caret, drags with a mouse and moves
a
popup; the finger tests fail without the fix. Tested in Chromium; an iPad is the
final check.

</details>

and has the following documentation change:

**Database speed test** - what was improved, and what was tried and was not.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d05a42a5af">The speed test README lists the improvements since the last run, and what did not help</a>. Thanks to Raymond-Voogt and xet7.</summary>

SQLite sorts in the database and stores JSONB, PostgreSQL answers membership
from a GIN index and pushes down `$or`, `$elemMatch` and `$and`, MySQL and
MariaDB read through their indexes with multikey side tables, and WeKan no
longer scans whole collections every hour or at every start of every server. The
small run found one more: **PostgreSQL planned from no statistics** until
autovacuum analyzed a freshly indexed table, so a Due Cards query took 407 ms
and
84 ms after; FerretDB now analyzes the table when its indexes are created (the
PostgreSQL row went from 454 to 145 ms, and from last place to eighth). A
profile of Due Cards on SQLite found another: a membership test made SQLite turn
the whole `members` array into JSON text and parse it again for every row, and
reading it from the column instead cut the visible-boards query from 26 to 16 ms
(All Boards 6.9 → 4.9 and 5.9 → 3.9 ms, Due Cards 54.5 → 43.9 ms, the SQLite
total 82.7 → 68.3 ms) with identical answers. Tried and
not kept, with the numbers: sorting in the database on PostgreSQL (52 ms against
38-49 ms decoded in Go) and `ANALYZE TABLE` on MySQL and MariaDB (no change).

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.92 2026-11-03 WeKan ® release

**In short:** A missing **REST checklist** answers a JSON 404 instead of an
empty 500.

This release fixes the following bugs:

**REST API** - answers for things that are not there.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d231df56fc">A missing checklist, or one under another card, answers a JSON 404 instead of an empty 500</a>. Thanks to AhmedLukman and xet7.</summary>

[\#6867](https://github.com/wekan/wekan/pull/6867). `GET
/api/boards/:boardId/cards/:cardId/checklists/:checklistId` answered `500` with
no body when the checklist did not exist or belonged to another card. It now
answers `404` with `Checklist not found or does not belong to the specified
card`, the text the update and delete routes already use; the board-access check
and the parent-card check are unchanged. `tests/restChecklistGet.test.cjs`
drives
the registered handler (found, missing, another card, another board, access
denied, and a failing lookup that must not become a false 404) and
`tests/playwright/specs/rest-checklist-not-found.e2e.js` reads the checklist
over REST and after a page reload.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.91 2026-11-03 WeKan ® release

**In short:** A **GitHub CodeQL** finding in a test is fixed, and the guard
against
replacing text with itself now also sees patterns with a `^` or `$` anchor.

This release has the following developer-tooling fix:

**Code scanning** - the tests that guard the tree.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62da564a1e">A test no longer replaces getLabel with itself, and the identity-replacement guard knows anchored patterns</a>. Thanks to GitHub CodeQL and xet7.</summary>

Code scanning alert #600 (`js/identity-replacement`, CWE-116):
`tests/boardLabelLookup.test.cjs` cut the `getLabel` method out of
`models/boards.js` and then ran `.replace(/^getLabel/, 'getLabel')` on it, which
does nothing because the slice already starts at `getLabel`. The line is gone.
`tests/noIdentityReplacement.test.cjs` skipped every regular expression with an
anchor, so it could not see the shape; a leading `^` or a trailing `$` over
plain characters is now compared like any other, with samples of both for the
guard to detect and the existing samples that must not be reported.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.90 2026-11-03 WeKan ® release

**In short:** The login page can have its own **background color**, Member
Settings
has a per-member switch, **Show focus outline**, to hide the blue focus ring,
and
**Escape closes the add-list composer**.

This release adds the following new features:

**Member Settings** - what each member can set for themselves.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/144777ae6b">Change Settings has Show focus outline, to hide the blue focus ring for yourself</a>. Thanks to mimZD and xet7.</summary>

[\#6755](https://github.com/wekan/wekan/issues/6755). The blue ring WeKan draws
round the focused control is an accessibility feature (WCAG 2.4.7) and stays on
by
default, but it also shows after a click on a minicard, and a member asked
whether
it can be turned off. Change Settings now has **Show focus outline**, ticked
while
the ring shows. Unticking it stores `profile.hideFocusOutline` for the signed-in
member (a method that takes no user id from the client) and puts a class on the
page that hides the outline and its halo for that member only; field borders and
the colour a button takes on focus stay. The label is translated into every
language file; the translations of these were written without a native speaker
and
are the least certain: Akan, Aymara, Bambara, Tibetan, Breton, Cherokee,
Dzongkha,
Ewe, Fulah, Fijian, Guarani, Manx, Hausa, Hawaiian, Igbo, Inuktitut,
Kalaallisut,
Kashmiri, Cornish, Luganda, Ladin, Nahuatl, Neapolitan, Northern Ndebele,
Northern
Sotho, Chichewa, Oromo, Quechua, Kirundi, Aromanian, Kinyarwanda, Northern Sami,
Samoan, Shona, Swati, Southern Sotho, Tigrinya, Tigre, Klingon, Tswana, Tongan,
Tsonga, Venda, Volapük, Walamo, Wolof, Xhosa and Tamazight.
`tests/hideFocusOutline6755.test.cjs` and
`tests/playwright/specs/hide-focus-outline-6755.e2e.js` pin it, including that
one
member hiding the ring does not hide it for another.

</details>

**The login page** - how the sign-in page and the support page look.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6b27764452">Admin Panel / Lay-out has a Login page background color, and the login text and the support page have a readable layout</a>. Thanks to Raymond-Voogt and xet7.</summary>

[\#6866](https://github.com/wekan/wekan/issues/6866). The login page stayed
grey whatever the Admin Panel said: the custom HTML fields only render after
sign-in and the text below the login logo is sanitised. The new setting
`loginBackgroundColor` takes a hex colour only (`#rgb` or `#rrggbb`); anything
else means "not set", so the value in the CSS custom property can never carry
CSS of its own. The text under the logo is white on a dark colour and black on a
light one. It is put on the page only while the sign-in layout is shown and
removed when it closes. The support page was text flush against the window edge
with no headings: it is now a centred white column of at most 860px, and the
text under the login logo gets the same column without a card of its own, both
with sized bold headings and space between paragraphs. The label is translated
into every language file. `tests/loginBackground6866.test.cjs` pins the colour
decision, that nothing but the validated value reaches the page, and the layout.

</details>

and fixes the following bugs:

**Lists** - the add-list composer.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f4b5025a7b">Escape closes the inline add-list composer</a>. Thanks to mimZD and xet7.</summary>

[\#6865](https://github.com/wekan/wekan/issues/6865). The composer that opens after
a list (or in an empty swimlane) stays open once a list is created, so several
can
be added, and only its X closed it: Escape did nothing. Escape now closes it,
with
the same reset as the X, at the level of an inlined form, and a click elsewhere
still does not. `tests/addListEscape6865.test.cjs` and
`tests/playwright/specs/add-list-escape-6865.e2e.js` pin it before and after a
list
is created.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.89 2026-11-03 WeKan ® release

**In short:** Keyboard **shortcuts run once on a non-Latin keyboard**: `d` no
longer opens the Due date popup and closes it again on a Farsi layout.

This release fixes the following bugs:

**Keyboard shortcuts** - what a key does on each layout.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0110e84ce5">A shortcut runs once on a Farsi, Cyrillic or other non-Latin keyboard</a>. Thanks to mimZD and xet7.</summary>

[\#6840](https://github.com/wekan/wekan/issues/6840). `d` opened the Due date
popup and closed it at a glance, "sometimes", for a reporter whose keyboard was
Farsi. `client/lib/keyboard.js` re-dispatched every key typed on another script
as its Latin key, a leftover from Mousetrap, which read the typed character.
hotkeys-js, which replaced it, resolves a key from `event.code` and `keyCode`
and so already ran the shortcut for the physical d key on any layout; the copy
ran
every shortcut a second time, the due date editor opened and the repeat clicked
the
same control again, closing it. The same doubling was behind Shift+D on a Latin
keyboard (#6750). The re-dispatch is gone. `tests/keyboardNonLatinOnce.test.cjs`
pins that no handler turns a typed character back into a key, and reads
hotkeys-js's own rule; `tests/playwright/specs/keyboard-nonlatin-once.e2e.js`
sends
real key events for Latin, Farsi and Cyrillic and counts one run each.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.88 2026-11-03 WeKan ® release

**In short:** **Every board theme** and **every color a member chooses** is
readable: the dark themes' **Card Settings**, popups and sidebars, the header of
eight themes, and a custom accent, text or label color made legible. A padded
**REST label** name no longer creates a second label.

This release fixes the following bugs:

**Dark themes** - cleandark, moderndark, dark and exodark.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6b10e3592">Card Settings, popups, sidebars and the quiet text are readable in the dark themes</a>. Thanks to Samunosuke and xet7.</summary>

[\#6863](https://github.com/wekan/wekan/issues/6863). Card Settings drew white
text on light grey blocks (1.07:1 in cleandark); popup items, the board
sidebar's Keyboard shortcuts row, "Add custom field" and its sister buttons and
the sidebar's labels were black on dark (1.18 to 2.19:1); and a list header's
`!important` light grey beat each theme's own and left its light text on it
(1.09:1 in moderndark, 1.27:1 in exodark). Part of it was new: the accessibility
audit made the quiet text greys dark for every theme, so the dark themes showed
dark grey on dark; the rest was older, rules that never followed the dark
themes. The quiet text is now a variable, `#595959` on the light themes and a
light grey where the surface is dark (cleandark, moderndark, and dark and
exodark on the board, the card and the sidebar); Card Settings' sections, its
muted text, the popup items, the quiet buttons, the shortcuts row, the sidebar
labels, dark's swimlane header and moderndark's selected minicard and primary
buttons follow the theme; and the list header's `!important` is gone.
`tests/playwright/specs/46-axe-theme-contrast.e2e.js` runs axe-core's colour
contrast rule on the four themes (the board, the sidebar, Card Settings, an
opened card and the custom fields popup) and finds nothing;
`tests/darkThemeContrast6863.test.cjs` pins each rule. The header colours of
relax, nephritis and modern, and a few lines of clearblue and cleanlight, are
still below 4.5 and are listed in the accessibility audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b2114cd0f">Every board theme, and every color a member chooses, is readable</a>. Thanks to Samunosuke and xet7.</summary>

[\#6863](https://github.com/wekan/wekan/issues/6863) asked to check the other
themes too, and the same scan was run on all 25. White text on the accent was
2.1 to 4.3:1 in nephritis, pumpkin, moderatepink, strongcyan, limegreen, relax,
corteza and modern, and their dark, hover and emphasis shades were as low: the
accents are darkened, with the same hue, until white text and the header's
`#f2f2f2` labels read at 4.5:1, and the hover and selected shades follow
(limegreen
is a forest green now, strongcyan a teal: white at 4.5:1 cannot be had on a
bright
accent). The colour-slide themes that end in the same colours read too. The
filter sidebar's headings (`#808080`, in every theme), the clear themes' quiet
text and cleanlight's add-dependency link are darker. No colour contrast failure
is left on the board, the sidebars, Card Settings, an opened card and its popups
in any theme. axe-core cannot measure text over a gradient, so the six
colour-slide headers are not covered by it.

A color a member chooses is one half of a pair, and the other half is worked out
(`models/lib/contrastColor.js`). A custom theme accent, or the two ends of a
custom
slide, is darkened under the header's white text until it reads, and the
picker's
preview shows the color that will be drawn. The text color from Member Settings
is
moved, with its hue, until it reads at 4.5:1 on the surfaces of the theme in
use,
says so when it changed, and no longer reaches the header bars, labels and
primary
buttons, which sit on a color of their own (`#626262` was 1.18:1 on the blue
header). A dependency line is drawn at 3:1 against the surface. Kanri's tag text
is the better of dark and light, which the brightness test it replaces was not.
A
custom label, card, list or swimlane color already derived its text, black or
white, and that is now pinned at 4.5:1 for every color.
`tests/playwright/specs/46-axe-theme-contrast.e2e.js` scans every theme and four
colors that do not read; `tests/customColorContrast.test.cjs` pins the rules.

</details>

**REST API** - board labels.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0426c7741a">A padded label name finds the stored label instead of creating another</a>. Thanks to AhmedLukman and xet7.</summary>

[\#6864](https://github.com/wekan/wekan/pull/6864). A label is looked up by name
and color before one is added, and the lookup compared the name as it was sent
while the schema stores it trimmed, so a padded " Bug " missed the stored "Bug"
and every repeat of the request created another label with the same name and
color. The pull request trimmed the name in the REST builder; the lookup is
shared
by the card's label form, the importers and the list sync, so it trims too, and
a
legacy label stored with padding is still found. A different color, letter case
or inner space stays a different label. `tests/boardLabelLookup.test.cjs` pins
it.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.87 2026-11-03 WeKan ® release

**In short:** A **REST API** "get one" that finds nothing answers **404**
instead of 200 with an empty body.

This release fixes the following bugs:

**REST API** - what a request for one item answers when there is none.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ded34dfdd">A single-item GET that finds nothing answers 404, not an empty 200</a>. Thanks to AhmedLukman and xet7.</summary>

[\#6862](https://github.com/wekan/wekan/pull/6862). The scoped card GET
(`/api/boards/:boardId/lists/:listId/cards/:cardId`) sent HTTP 200 with no body
for a missing, wrong-list, wrong-board or archived card, which a client cannot
tell from a card with nothing in it. The pull request fixed that one route; the
same shape was in the list, swimlane, custom field, comment and integration
GETs, and the user GET threw a TypeError for an unknown name, which reached the
caller as a server error. Each now answers 404 ("Card not found", "List not
found" and so on). The board check stays first in each, so someone with no
access gets the same answer for an existing and a missing id. The global card
GET, which finds a card by id alone, already answered 404.
`tests/restSingleItem404.test.cjs` runs every one of these routes from its own
source with a cache that finds nothing, something, and a stranger, and fails if
any single-item GET route under server/ has no not-found branch.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.86 2026-11-02 WeKan ® release

**In short:** The daily **notification cleanup** and the **file integrity
audit**
run once for the whole installation, not once per server.

This release fixes the following bugs:

**Database load** - work that every server of a cluster repeated.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e28465964">The notification cleanup and the file integrity audit run once, not on every server</a>. Thanks to Raymond-Voogt and xet7.</summary>

[\#6861](https://github.com/wekan/wekan/issues/6861). The notification cleanup
ran at every start and daily on every server, reading and rewriting the same
18,000 users 24 times at a rollout, and a notification another server added
between a read and its write was lost. A run now claims a document per job and
day in the dailyJobRuns collection (a duplicate key means another server has
it), and the timer looks hourly for an unclaimed day, so the cleanup still
happens daily when no server restarts. The file integrity audit read its last
run, checked it, and then wrote it, so two servers whose hourly check fell at
the same moment both scanned every file; one atomic update, matching only while
the last run is older than the interval, now claims the run. Continuous backup
has no leader and every server writes its own stream into the same directory;
that needs a lease, which is not built, so the documentation now says it is for
one server, and item 3 of the issue stays open. `tests/dailyClaim.test.cjs`
pins the claims with 24 servers at once, that other database errors are not
swallowed, and that neither job runs unclaimed.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.85 2026-11-02 WeKan ® release

**In short:** The findings of the **accessibility audit** are fixed in the
default theme: header and label **colour contrast**, names that contain the
visible text, named form fields, card section headings that are real buttons,
and landmarks and headings on every page. axe-core now finds no violation on
22 pages. A cleared database connection pool is reported as a lost connection.

This release fixes the following bugs:

**Accessibility** - what an automated axe-core scan of the default theme found
(see Audit.md in docs/Features/General/Accessibility).

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8bcc4817d">axe-core finds no violation on 22 pages of the default theme</a>. Thanks to xet7.</summary>

The audit of 2026-11-02 found, on seven pages, colour contrast of the header
bars and the labels (WCAG 1.4.3), a Label in Name mismatch on the Starred menu,
the user menu and the avatars (2.5.3), form fields without a name (4.1.2),
headings that were buttons holding other controls (4.1.2), and missing
landmarks and headings. Each is fixed, and the scan, now on 22 pages (the
signed-out ones, All Boards and its lists, the other pages, the Admin Panel, a
board and an opened card), finds nothing.

The default theme's blue is `#2573a7` instead of `#2980b9` everywhere the
stylesheets, the accent table and the colour picker name it, so white and the
`#f2f2f2` button labels reach 5.14 and 4.59. The label colours green, red, sky,
magenta and gray and the Global search list chips have black text. The quiet
greys `#8c8c8c` and `#727479`, the "no items" text and the grey board tiles
are darker. The Starred menu, the user menu link and an avatar drawn as initials
have those letters or numbers in their accessible name. The Pomodoro field and
the comment, description and edit-comment editors have a name (the editor takes
a `labelKey`). A section heading of the card details is an `h3` holding a real
`button` with `aria-expanded`; the section menu and the layout toggle are
beside the button, and Enter, Space and a click on the heading still fold the
section. The sign-in and register form is the `main` landmark, its title is the
level-one heading and the empty logo `h1` is a spacer; every other page's title
in the header bar is the level-one heading, Activity, Import and Bookmarks have
one, and the shortcuts list can be reached by keyboard.

`tests/accessibilityAuditFixes.test.cjs` pins each fault by its shape (contrast
ratios are computed from the stylesheets), and
`tests/playwright/specs/45-axe-accessibility.e2e.js` runs axe-core on the pages
and fails on any violation. Other board colours and themes, the phone width,
dark mode, popups, and the views not scanned still need the same check.

</details>

**Database problems** - how Admin Panel -> Problems and the startup read the
database.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/abc23a7eda">A cleared connection pool is a lost connection, and the board key backfill uses the key index</a>. Thanks to Raymond-Voogt and xet7.</summary>

[\#6860](https://github.com/wekan/wekan/issues/6860). While a MongoDB pod
restarted, a method's "Connection pool for <host> was cleared" reached Admin
Panel -> Problems as "did not match its schema": collection2 wraps a failed
write as "ValidationError: Failed validation" plus the driver's text, so the
class name PoolClearedError was gone, and the host in the text is a replica set
member's name (wekan-mongodb-0.wekan-mongodb-internal in a StatefulSet) that
MONGO_URL does not list, so the "getaddrinfo ENOTFOUND" behind it did not count
as the database's. The text itself is now a lost connection, for the Problems
page and for both startup guards, and a message about a pool setting is not.
The board key backfill looked for boards without a key with an `$or` that
included an exists-false branch, a scan of every board at every start of every
server (32,600 boards in the report); `key: null` already matches a missing
field, so one `$in` on the `key` index finds the same boards, and the same
selector still guards the writes, so a key a board admin set meanwhile is never
replaced. `tests/databaseErrorsWrappedCause.test.cjs` and
`tests/boardKeyBackfill.test.cjs` pin both, and that no exists-false branch on
`key` is left.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.84 2026-11-02 WeKan ® release

**In short:** GitHub code scanning's **code-quality** findings are fixed: a
promise formatted as text, undeclared globals, an upload that hung on an
unreadable file, and the lint around them. `npm run lint:promises`
now finds promises that are not awaited or handled.

This release fixes the following bugs:

**Code quality** - findings of GitHub code scanning.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/582a22c291">The real faults among the code-quality findings, and the lint around them</a>. Thanks to GitHub CodeQL and xet7.</summary>

A card's original-position description formatted a promise, because it did
not await the history it reads. The attachment swipe distances and two
drag-scroll locals were undeclared globals. A file that cannot be read during
a GridFS upload now unlinks itself instead of leaving the upload open, since
`pipe()` does not pass a read error on. `api.py` called `exit()`, which is
missing when the site module is not loaded, and its usage branch never
exited; it uses `sys.exit()`. A rules test redefined a property and a
security-log test kept an unreachable branch. Besides these: 31 missing
semicolons, unused imports in the card details, the exporters and the
attachment API, unused Python imports, and a comment on each empty except
clause. The list-sync scanner test cut its source at the last
`Meteor.startup`, which the index startup of the schema-scan fix had moved;
it now cuts at the first one after the scanner. Two unhandled rejections are
caught as well: the instance-editing
hook's board lookup and the service worker registration.
`tests/codeqlFindingsRegression.test.cjs` pins the shape of each fault.
Findings in vendored bundles (the Office viewer, Jade, capnp-es, exceljs)
and style-only ones are left as they are.

</details>

and has the following developer-tooling fixes:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f1d2a497bc">npm run lint:promises finds promises that are not awaited, handled or marked void</a>. Thanks to xet7.</summary>

GitHub code scanning's "Missing await" finding was a real fault in
`models/cards.js` (a description formatted a promise), and a plain ESLint
cannot see that kind of mistake because it does not know which calls return a
promise. `npm run lint:promises` runs typescript-eslint's
`no-floating-promises` and `no-misused-promises` over `models/lib`,
`server/lib` and `imports/lib`, with the type information read from
`tsconfig.lint.json`; the code stays JavaScript and nothing is type-checked.
The eleven findings were promises that already catch their own errors, now
marked `void`, and three checks that used a promise as a boolean.
`tests/promiseLint.test.cjs` keeps the configuration in place and the tree
clean.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.83 2026-11-02 WeKan ® release

**In short:** An **LDAP** login with a reused login name no longer opens the
previous owner's account, and existing accounts record their directory
identifier.

This release fixes the following bugs:

**LDAP** - matching a directory entry to a WeKan account at login, import and
background sync.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e91c14cd9a">A reused login name no longer opens the previous owner's account</a>. Thanks to Raymond-Voogt and xet7.</summary>

[\#6859](https://github.com/wekan/wekan/issues/6859). The login looked for the
account by the entry's unique identifier, then by username, then with
LDAP_EMAIL_MATCH_ENABLE by e-mail, and the last two did not check whether the
account already belonged to another directory entry. When a directory gave a
deleted employee's sAMAccountName to a new colleague, the new colleague logged
into the old account and saw its boards, cards and comments; two entries
sharing an e-mail address did the same, and so did the import with
LDAP_MERGE_EXISTING_USERS. An account that records an identifier of the same
attribute with a different value is now refused at login ("LDAP
authentication failed") and skipped by the import. An account without an
identifier, with an identifier of another attribute, or with an identifier
without its attribute (made before \#4654) is still accepted, so switching
LDAP_UNIQUE_IDENTIFIER_FIELD to objectGUID locks nobody out. When that field is
empty the identifier is the login name itself, so a reused name cannot be
detected: set it to objectGUID or entryUUID.

Three more faults in the same matching are fixed. An existing account never
recorded services.ldap.id and its attribute (only a new account did), so
accounts from before \#4654 never got an attribute and a changed
LDAP_UNIQUE_IDENTIFIER_FIELD never took effect; the login and the sync now
record both. LDAP_EMAIL_MATCH_REQUIRE looked the user up with _id equal to the
username, which never matches a random id, so every existing user's login
tried to create the account again; it uses the username. The background sync
bound an account without an identifier to the first of several entries with
its name; it now skips that account, neither updating nor disabling it.
`tests/ldapAccountBinding.test.cjs` pins each of these, and that no lookup by
_id equal to the username is left in the package and no name or e-mail match
reaches the login without the check. A refused login is not recorded in
Admin Panel -> Problems: the LDAP package cannot reach the application's
security log, and the new colleague who is refused is not an attacker.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.82 2026-11-02 WeKan ® release

**In short:** A card moved to another board, restored from the archive or given
a number no longer takes a **card number** another card on that board has.

This release fixes the following bugs:

**Card numbers** - the number each card has on its board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e68938698c">A moved, restored or renumbered card cannot take a number another card has</a>. Thanks to Raymond-Voogt and xet7.</summary>

[\#6858](https://github.com/wekan/wekan/issues/6858). Follow-up to
[\#6815](https://github.com/wekan/wekan/issues/6815), which checked the number
of every new card. A card also enters a board's numbering through an update: a
move to another board, where the browser computed the number from the
destination cards it had loaded, usually none, so the card got 1 or another
low number already taken; a restore from the archive, since an archived card
may share its number with an open one; and a number set by the REST API or an
import. Three card numbers used by more than one open card showed up again in
Admin Panel -> Problems -> Data health two days after the renumbering. A
before-update hook now does what the insert hook does: a number another card
on that board has is replaced by a fresh one from the board's counter, after
raising the counter to the board's highest number; a free number is kept and
the counter raised past it. The card itself never counts as taken, and
ordinary edits, moves within a board, archiving and cards without a number
are left alone. `tests/cardNumberUnique6815.test.cjs` pins which updates are
checked, the move, the restore and the free numbers.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.81 2026-11-02 WeKan ® release

**In short:** The **database health** probe reports a finding once, not once
per server.

This release fixes the following bugs:

**Database health** - the probe behind Admin Panel -> Problems -> Database.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/114e9ecd5a">One server probes the database per period, so a finding is reported once</a>. Thanks to Raymond-Voogt and xet7.</summary>

[\#6857](https://github.com/wekan/wekan/issues/6857). Every server read the
same MongoDB log and counters every five minutes and recorded each finding
itself, so one collection scan became up to 24 identical rows with 24
replicas - more than 400 warnings over 68 pages in the report. A probe now
claims the period in one shared document (collection databaseHealthProbe);
only the server that gets it probes, a duplicate key means another server has
it. The state that compares one probe with the next - log lines seen, the
scanned-documents counter, uptime, restarts, latencies - lives in that
document, so the next probe on whichever server continues where the last one
stopped. A server without the claim still checks its own data directory, and
a claim that cannot be made at all does not stop the probe.
`tests/databaseHealthProbeClaim.test.cjs` pins the claim, the shared state
and that each finding is reported once.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.80 2026-11-02 WeKan ® release

**In short:** **minimatch** is updated to 11.0.4 for GHSA-g3hv-75wg-m249, a
glob pattern that used up CPU and memory.

This release updates the following dependencies:

- **minimatch 10.2.6 → 11.0.4** — Dependabot alerts #180 and #182,
  [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
  (CVE-2026-118764, CWE-405, moderate): before 11.0.1 a crafted glob pattern
  made it grow its glob parts without bound and compare them pairwise, using
  up CPU and memory. It came in through archiver, typescript-eslint and
  Babel's CLI; all of them now use 11.0.4, and
  `tests/minimatchGlobparts.test.cjs` fails if a 10.x copy returns
  ([commit](https://github.com/wekan/wekan/commit/a3630d96ce)).
  Thanks to dependabot.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.79 2026-11-02 WeKan ® release

**In short:** A cluster of servers runs the **schema re-check** and the
**due-date reminders** once, and a slow-query warning says which query it is.
The site **announcement** shows on Home and All
Boards too. The **date picker** popup shows the year and has year, month and
day drop-downs under the calendar. The **macOS sandbox** for VSCodium no longer
asks for a keychain, starts from the checkout, and can carry a **Claude Code**
token so its login sticks.

This release fixes the following bugs:

**Database load** - work that every server of a cluster repeated.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d42369e96a">The schema re-check and the due-date reminders run once, not on every server</a>. Thanks to Raymond-Voogt and xet7.</summary>

[\#6855](https://github.com/wekan/wekan/issues/6855). With 24 replicas on one
database every start of every server re-checked the schema, reading 1.1
million cards several times, and each server sent its own due-date reminder
for every card. The re-check now claims a run in the migration collection, so
one server does it and the others skip; a claim older than 2 hours, from a
server killed mid-run, is taken over. A run that leaves work it cannot do
(an attachment whose file is gone) is retried once a day instead of at every
start, and a clean run clears that. The daily reminder scan is claimed per day
in the dueReminderRuns collection, so the first server scans and the rest get
a duplicate key and skip. A partial index on lists serves the 15-minute list
sync scan, and a sparse index on boards.dueReminderDays the due-date lookup.
`tests/schemaUpgradeSteps.test.cjs` and `tests/dueScanClaim.test.cjs` pin the
claims, the stale takeover, the daily retry and that the scheduler claims
before it scans.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc79de8c57">A collection-scan row names the command, the operators per field and the queryHash</a>. Thanks to Raymond-Voogt and xet7.</summary>

[\#6856](https://github.com/wekan/wekan/issues/6856). Admin Panel -> Problems
-> Database named only the collection and the filtered fields, for example
"wekan.lists (filter on archived,syncSource.enabled,syncSource.type)", which
does not say which query it is, and a slow getMore read "filter on nothing".
The row now shows the command (find, distinct, aggregate, ...), for a getMore
the query it continues, each field with the operators used on it - for example
`archived:$exists` or `$nor[sort:$gte$lte]` - and MongoDB's queryHash, so
the query can be found in the code and with explain(). Values never reach the
row. `tests/databaseHealthScans.test.cjs` pins the shape, the queryHash, the
getMore origin and that no value leaks.

</details>

**Announcement** - the site announcement of Admin Panel -> Announcement.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64b5762020">The announcement shows on Home and on every All Boards list</a>. Thanks to titver968 and xet7.</summary>

[\#6854](https://github.com/wekan/wekan/issues/6854). The banner waited
for the user to be a member of the current board, and Home, Remaining, Starred,
Templates and the other All Boards pages have no current board, so it showed
only on boards. It now shows to every signed-in user on those pages, and to the
members of the open board on a board page; a visitor who is not signed in still
does not see it (#1281).
`tests/announcementAudience.test.cjs` pins the rule and that no membership test
of a current board is left in front of the banner.

</details>

**Date picker** - the calendar in the Received, Start, Due and End date popups.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45c291b406">The calendar heading shows the year as well as the month</a>. Thanks to brlin-tw and xet7.</summary>

[\#6853](https://github.com/wekan/wekan/issues/6853). The popup calendar
heading named only the month, so after the arrows had moved past December
there was no sign of which year was shown; the selected date beside it does
not change when the month does. The heading now reads for example "January
2027", in every calendar system. `tests/calendarPickerControls.test.cjs` pins
the year in the heading and that no picker mode leaves it out again, and the
Playwright date display spec expects it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dcaa316a01">Any year by number, and month and day drop-downs, under the calendar</a>. Thanks to brlin-tw and xet7.</summary>

[\\#6853](https://github.com/wekan/wekan/issues/6853). The heading above the
calendar now shows only the month and the year, no longer the YYYY-MM-DD of
the selected day. Under the calendar are three controls: a year field, where
any whole year can be typed or stepped to - thousands of years back or ahead,
0 being 1 BC and -2999 3000 BC, as far as a date reaches (about 275,000 years
either side of 1970) - a drop-down of the months of that year, and one of the
days of that month. A pick selects the date and shows its month; Enter in the
year field applies the year instead of saving the popup, and a value that is
not a year puts the field back. The months and days are read from the calendar
system in use, so they hold for the Islamic, Hebrew, Japanese and every other
system, including leap months and a short thirteenth month. A day that the new
month lacks falls to its last day. Calendars whose eras restart or switch the
count (Japanese, ROC, Coptic, Ethiopic) refuse a year no number can name.
`tests/calendarDropdowns.test.cjs` checks ten calendar systems and that no
date text is left in the heading.

</details>

and has the following developer-tooling fixes:

**The macOS sandbox** - running VSCodium and Claude Code in the sandbox on a
Mac.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c58b2896d1">VSCodium no longer asks for a keychain in the macOS sandbox</a>. Thanks to xet7.</summary>

The sandbox refuses `~/Library/Keychains`, so VSCodium's secret storage asked
for a keychain to keep "VSCodium Key" in, with a "Reset To Defaults" button
that would have replaced the login keychain. `sandbox.sh` now starts VSCodium
with `--use-mock-keychain`, so the real Keychain is never touched. The README
explains the price: extension secrets in `.tools/vscodium/user-data` are only
obfuscated. `tests/macosSandbox.test.cjs` covers the sandbox script.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21c94ce098">Claude Code stays signed in inside the macOS sandbox, and the sandbox starts in the checkout</a>. Thanks to xet7.</summary>

Claude Code keeps its login in the Keychain, which the sandbox cannot reach.
`sandbox.sh --claude-token` now saves a token from `claude setup-token` to
`.tools/secrets/claude-oauth-token` (read from the clipboard, line breaks
joined, a cut-short token refused) and passes it as `CLAUDE_CODE_OAUTH_TOKEN`,
with onboarding marked done and the extension's login prompt off. The script
also changes to the checkout first, because Finder starts it in the home
directory, which the sandbox refuses ("EPERM: process.cwd failed"), and starts
VSCodium with `nohup` so closing the launcher's Terminal does not close it.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.78 2026-11-02 WeKan ® release

**In short:** **CrossBoardExportBleed** and **UnassignedAttachBleed** are
fixed: a checklist scope stays on its board, every export obeys Disable all
export and Anonymize export users, and an assigned-only member changes
attachments only on their own cards. **SAML** logins use **node-saml 5.2.0**,
and **continuous backup** no longer misses a change made right after it starts.
**Keyboard shortcuts** keep working after a popup closes, and the Rules page has
a way back to the board.

This release fixes the following CRITICAL SECURITY ISSUES:

**Exports** - what a board export may contain, and whether it runs at all.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be6727607c">A checklist scope stays on its board, and every export obeys Disable all export and Anonymize export users</a>. Thanks to ccsimplyspolit and xet7.</summary>

[CrossBoardExportBleed](https://wekan.fi/hall-of-fame/crossboardexportbleed/),
[GHSA-8885-xrq4-j47h](https://github.com/wekan/wekan/security/advisories/GHSA-8885-xrq4-j47h).
A board export scoped with `?checklistId=` streamed a checklist of another,
even private, board with its items and creator; it is now bound to the
exported board's cards. The streaming CSV/TSV export ignored Disable all
export and Anonymize export users, and so did the Excel, PDF, chart, calendar
and external-format exports: every export route now refuses with 403 when
export is disabled, and every exporter that names people anonymizes. Refusals
are shown in Admin Panel / Problems.

</details>

**Attachments** - who may add or delete a card's files through the API.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/532a96da11">An assigned-only member adds and deletes attachments only on cards assigned to them</a>. Thanks to Javier García Herrera and xet7.</summary>

[UnassignedAttachBleed](https://wekan.fi/hall-of-fame/unassignedattachbleed/),
[GHSA-w26g-rc43-q6cm](https://github.com/wekan/wekan/security/advisories/GHSA-w26g-rc43-q6cm).
A member with the Normal, assigned only role whose card assignment was removed
kept the card and attachment ids, and `POST /api/attachment/upload` and
`DELETE /api/attachment/delete/:id` still added a file to that card and
soft-deleted its existing one: both asked only for board write access. The
DDP methods, and copy and move onto a target card, had the same gap. All
eight handlers now apply the card rule the ordinary card Delete used, and a
refusal is shown in Admin Panel / Problems.
`tests/unassignedAttachBleed.test.cjs`
fails if any attachment API write lacks it.

</details>

and updates the following dependencies:

- **isomorphic-git 1.44.3 → 1.44.8** — the GitHub wiki sync
  ([#6846](https://github.com/wekan/wekan/pull/6846)).
- **@node-saml/node-saml 5.1.0 → 5.2.0** — SAML; see the fix below, without
  which it changed nothing that runs ([#6850](https://github.com/wekan/wekan/pull/6850)).
- **@typescript-eslint/eslint-plugin 8.72.0 → 8.72.1** — lint only
  ([#6849](https://github.com/wekan/wekan/pull/6849)).
- **@rspack/dev-server 2.2.1 → 2.2.2** — development server only
  ([#6848](https://github.com/wekan/wekan/pull/6848)).
- **mailparser 3.12.2 → 3.12.4** — inbound email and bounces
  ([#6845](https://github.com/wekan/wekan/pull/6845)).
- **i18next 26.5.4 → 26.5.11** — translations
  ([#6847](https://github.com/wekan/wekan/pull/6847)).
- **@aws-sdk/client-s3 3.1155.0 → 3.1159.0** — S3 backups; see the
  @smithy/core fix below ([#6844](https://github.com/wekan/wekan/pull/6844)).
- **imapflow 2.8.0 → 2.9.1** — the IMAP mailbox
  ([#6842](https://github.com/wekan/wekan/pull/6842)).
- **glob 13.0.6 → 14.0.3** — no WeKan code loads it: it is only the target of
  an `archiver-utils` override that archiver 8 no longer needs; @babel/cli and
  rimraf keep their own copies ([#6851](https://github.com/wekan/wekan/pull/6851)).
- **helm/chart-releaser-action 1.7.0 → 1.8.0** and **docker/login-action 4.6.0
  → 4.7.0** — CI, each still pinned to the commit its tag names
  ([#6843](https://github.com/wekan/wekan/pull/6843),
  [#6841](https://github.com/wekan/wekan/pull/6841)).

Thanks to dependabot.

and fixes the following bugs:

**Dependencies** - what the updates above did, and did not, change.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c50f38e25">SAML logins are verified by node-saml 5.2.0, as package.json says</a>. Thanks to xet7.</summary>

The bump changed the app's `package.json`, but a login is verified by the
`wekan-accounts-saml` package's own copy, still pinned to 5.1.0 - so nothing
that runs changed. 5.2.0 rejects a message with more than one Issuer, checks
`idpIssuer`, rejects a `RelayState` that is not the signed one, and checks a
POST LogoutResponse's status and issuer. The package pins 5.2.0 now, and
`samlLogin.test.cjs` requires both to name the same version. A login
roundtrip with the package's copy logs in a signed Response and a signed
Assertion, and refuses a changed NameID, another key, an unsigned response and
an answer to a request WeKan never made.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/338afc15f8">@smithy/core 3.38.1, the AWS SDK's logger redaction fix</a>. Thanks to xet7.</summary>

The S3 SDK bump resolved `@smithy/core` 3.37.0, deprecated for a bug that
passed sensitive fields nested in lists or maps unredacted to a custom logger
([aws-sdk-js-v3#8393](https://github.com/aws/aws-sdk-js-v3/issues/8393));
3.36.2 before it had the bug too. WeKan's only AWS client, the S3 backup,
passes no logger, so nothing leaked. Updated in the lockfile only, one
package; the telemetry gate (`releases/check-telemetry.py`), which had failed
on the deprecation note's new github.com link, passes again. The ten updates
add no package, install script, network host or telemetry, and every tarball
matches its lockfile hash.

</details>

**Continuous backup** - what it sees right after it starts.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8cbe2605fe">Files are watched before the first scan, and a macOS start catches up once</a>. Thanks to xet7.</summary>

The file engine scanned its sources first and only then started watching, so
a change made between the two waited for the next scan, five minutes by
default. macOS FSEvents also delivers nothing for a moment after a watcher is
created. The watchers start first now, sharing one queue with the scan so a
change is recorded once, and on macOS one catch-up scan runs two seconds after
the start; Linux's inotify needs none. A new test with a silent watcher pins
the order, the macOS catch-up and that Linux runs no second scan.

</details>

**Single-file builds** - signing and the start/backup commands.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d4f4caa2f">A macOS build is signed whatever its target is called, and start/backup return once WeKan runs</a>. Thanks to xet7.</summary>

Only a target named mac or darwin was ad-hoc signed, so a Mach-O built under
another label had the signature its injected archive invalidated, and macOS
killed it before it printed anything. Every Mach-O output is signed now, read
from the file's magic number. `start --background` and `backup` returned
before WeKan wrote its pid file, so a `stop` right after them said WeKan was
not running and left it running; both wait now until the pid file names the
process they started. `singleFile.test.cjs` passes 24 of 24, the real single
executable included.

</details>

**Release builds** - the bundles each platform downloads.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24a7270b7f">Android bundles start again: npm 12 runs argon2's and bcrypt's install scripts</a>. Thanks to xet7.</summary>

npm 12 lets only declared dependencies run install scripts, and the rebuild
directories declared none, so argon2 and bcrypt were never compiled. Prebuilds
hid it everywhere except Android, whose bundles crash-looped on "No native build
was found for platform=android". Each rebuild directory now declares the
reviewed installers it holds, and the Android build loads both before starting
WeKan.

</details>

**Filters** - the filter sidebar's date ranges.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5f5ad2338">A refused date range says why in the form, so Clear still works in Firefox</a>. Thanks to xet7.</summary>

A reversed card date or card movement range was reported with the browser's
validation bubble, which Firefox opens over the Apply and Clear buttons and
which took every click on them: the range could not be cleared. The end date
is still marked invalid, and the reason is a `role="alert"` line in the form;
editing the range or Clear takes it back.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ad13db5ef">The date-range forms are checked by WeKan, not refused by WebKit after Clear</a>. Thanks to xet7.</summary>

After Clear, WebKit kept a half-edited date in the From field and silently
refused the next submit, so a new range never applied. Both forms are
`novalidate` now; WeKan's own check already marks a refused range and says
why.

</details>

**History recovery** - an undo or redo that is still waiting for the server.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96845f6f4b">Retry is enabled only once the board lets this person write on it</a>. Thanks to xet7.</summary>

After a reload the notice showed before the board and its members arrived,
and a Retry clicked then did nothing and the notice stayed. Retry is disabled
until it can act; Forget stays usable.

</details>

**Keyboard shortcuts** - when a focused button or link lets them through.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba0de93f79">Shortcuts keep working after a click on a minicard or a closed popup</a>. Thanks to mimZD and xet7.</summary>

The shortcut filter refused every key while a link or button had the focus.
The minicard is itself a link, so clicking its date badge or menu left it
focused, and closing a popup returns focus to its opener: hovering a card and
pressing d did nothing until a reload. A focused control now keeps only its
own keys - Enter, Space for a button, the arrows for a tab - and every other
key is a shortcut again ([#6755](https://github.com/wekan/wekan/issues/6755)).

</details>

**Rules** - the way back from the Rules page.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/34d9817110">The Rules page has a Back to the board</a>. Thanks to mimZD and xet7.</summary>

The page lost its Back with its old sidebar, and only the trigger, action and
rule details pages kept one, to the rules list. The list and its Workflow,
Bots, Blocks and History views now link back to the board; the three
sub-pages keep only their own Back ([#6852](https://github.com/wekan/wekan/issues/6852)).

</details>

**Sign-in** - the error shown on the sign-in page.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a2fef4dc7">Login errors are rendered from template state, so a redraw of the form keeps them</a>. Thanks to xet7.</summary>

The error region sits inside the form's loading switch, and an error written
into it was lost whenever that part of the form was drawn again. The template
now renders the message as escaped text from a reactive value. The SAML error
test also waits for the finished form before it clicks.

</details>

**Whiteboard** - how its lines are drawn.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/40f60582b7">A line is drawn at its own width, not the whiteboard's 800</a>. Thanks to xet7.</summary>

The line's `stroke-width=width` found the template's `width` helper - the
drawing's width - before the line's own field, so every line was drawn 800
wide, one black shape over the whole whiteboard. The lines use `strokeWidth`
now, and a test fails if any of their fields shares a helper's name.

</details>

and has the following developer-tooling fixes:

**The whole-suite run** - EVERYTHING, on a Mac and in a sandboxed editor.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16103f9ad2">The test database is kept in .tools/, not beside the checkout</a>. Thanks to xet7.</summary>

`build.sh` and `build.bat` put the :3001 test database in the checkout's
parent directory, the one thing a test run wrote outside the repository, and a
sandboxed editor could not create it. It is `.tools/mongodb-test-<port>` now;
`toolsDirOnly.test.cjs` pins it in both scripts.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f948bf438">On macOS the Playwright container uses Docker's bridge network, not the host network</a>. Thanks to xet7.</summary>

Firefox tests waited the full 60 seconds for a page whose document never
came. Docker Desktop's host network lost about one connection in 75 to
`host.docker.internal` (8 of 600 connects never completed), while the bridge
network lost none in 1000. Nothing there needs the host network on macOS, so
the container uses the bridge network; Linux keeps the host network.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9e48a909d">The list-sync specs' mock servers are reachable from WeKan when the browsers run in Docker on macOS</a>. Thanks to xet7.</summary>

WeKan fetched from mock Jira and GitLab servers on the container's loopback,
which Docker Desktop keeps from the host. build.sh already forwarded the test
SMTP port into the container; it now forwards a small pool of ports the same
way, and those specs take one of them.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ffe207e191">The Docker test proxy dials the host again when a connect is never answered</a>. Thanks to xet7.</summary>

On the bridge network too, Docker Desktop's gateway now and then left one
connect to the host unanswered through nine retransmits while the next went
straight through. The proxy reads nothing from the browser until a connection
is up, drops a dial that has not connected in 1.5 seconds and dials again, up
to five times, so no byte is lost or sent twice.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a1f7a14a9">The Playwright container sees the repo and the files root at their own host paths</a>. Thanks to xet7.</summary>

Specs and the server share files by path. With the repository mounted at
`/repo`, the continuous backup tests gave the server a key file it could not
find and looked for a stream it wrote elsewhere. Both are mounted at their
host paths now, so a path names the same file on both sides.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6bec88266">The phone invitation tile is measured in one layout with its buttons</a>. Thanks to xet7.</summary>

Measured one at a time, the tile and its buttons were taken from two layouts:
Firefox drew the row above the board list in between and moved the tile down
29 pixels. They are measured together now, and the test still fails when the
tile clips its buttons, the original #6488 bug.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f5eb4ecf61">The Mac smoke test asks libproc, not ps, whether a process group still lives</a>. Thanks to xet7.</summary>

When macOS refuses to signal a group of zombies, the smoke test asked `ps`
whether a member was alive, and a Mac that does not let the build run `ps`
failed a correct app. On macOS it asks the kernel through `proc_listpids` and
`proc_pidinfo` now, starting no process; elsewhere it uses `ps` as before.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/897376ba54">The button theme test checks the Board Settings that still have action buttons</a>. Thanks to xet7.</summary>

Card Settings has had no column actions since card actions moved into each
section's own menu, so the test failed on Card in every theme. Swimlane and
List are checked in all four themes, and the test says why Card is not.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5e3325e87">Card Settings section order waits for the published board before reading the card</a>. Thanks to xet7.</summary>

The test writes the board straight to the database and reloads. The board
publication's cursor has `limit: 1`, so on the standalone test MongoDB it
polls and a reload could get the old board for up to ten seconds. The test
waits for the published board, up to 15 seconds, before it reads the card.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89b64966c6">The password minimum specs wait until the server has the policy they wrote</a>. Thanks to xet7.</summary>

The specs write the password policy straight into the settings document, and
on the standalone test MongoDB the server's settings observer polls, so for up
to ten seconds it still enforced the old policy. `untilServerHas()` asks
`getPasswordPolicy` until the server has it, then reloads the sign-up form; 6
of 6 with two workers.

</details>

**Browser tests** - specs that read the page before it had settled, in Firefox.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dbf07aadf9">The activity recovery report is searched again until no worker lease covers it</a>. Thanks to xet7.</summary>

The report is a snapshot, and the live recovery worker's short lease could
make it show a seeded orphan as being delivered. The test searches again
until the snapshot falls between leases.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9188843369">The checklist drag tests drag once the opened card's rows hold still</a>. Thanks to xet7.</summary>

Sections drawn above the checklist moved its rows 50 pixels between measuring
and releasing, so the release opened an item's editor or dropped it in the
wrong place.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0cea141702">The duplicate relation picker is opened once the card has opened</a>. Thanks to xet7.</summary>

A picker opened while the card was still opening was closed again when the
card settled.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0403e27c62">The notification delivery sections are opened until they stay open</a>. Thanks to xet7.</summary>

The language arriving after the click drew the popup again with its sections
closed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2042fd5102">The Blocks drag test grabs the block's body, not its edge</a>. Thanks to xet7.</summary>

A Khmer label overflows its block in Firefox, and the first point found was
the block's outline, where a press drags nothing.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a1f8584ee">The board view popup is opened until it stays open for the Product Backlog</a>. Thanks to xet7.</summary>

The language arriving after the click drew the header again and closed the
popup.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efe0e9287c">A language switch is waited for, and WebKit does not freeze on asking for a push subscription</a>. Thanks to xet7.</summary>

A spec that switched language and clicked at once clicked into the redraw
that followed, which closed its popup; every page of the test context now
waits until it shows the new language. Playwright's WebKit froze the page on
asking for a push subscription, which Member Notification Settings does on
opening; there the page answers that it has none.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c8c254dc5">The viewport matrix cleans up only what it seeded</a>. Thanks to xet7.</summary>

The matrix is Chromium-only. In Firefox and WebKit its setup never ran, but
its cleanup did, and failed every viewport.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f241681e80">Background notification recovery checks its own mail</a>. Thanks to xet7.</summary>

The shared SMTP sink had caught another worker's mail first.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c71c875649">The custom field settings popup is opened until its Create button shows</a>. Thanks to xet7.</summary>

The opened card was still drawing and closed the popup again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a9c3f21d2">The drawing surface's width is waited for</a>. Thanks to xet7.</summary>

The element's layout follows its viewBox a frame later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8ed3e0fd0">The bulk export popup is opened until it stays</a>. Thanks to xet7.</summary>

All Boards was still drawing after the route changed, in all five Haitian
Creole tests.

</details>

**Test coverage** - October changes that had no test of their own.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/148d18d456">Server changes are tested: OpenSSL 4 decrypt refusal, the Scrum rollover lease, the backup catch-up scan</a>. Thanks to xet7.</summary>

Each with a negative test, and the lease with a tree-wide one: every lease
field is written only by its claim.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/79c40407d1">Admin Panel pane titles, audit log alignment, storage help, Data health and card reports are tested</a>. Thanks to xet7.</summary>

Unit and negative tests, and a Chromium browser test of the titles, the
right-to-left audit log, the storage help shown once and Data health's own
"Never".

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/121f37be91">The drawing refit, Due Cards scope, dependency import counts and SAML's one Issuer are tested</a>. Thanks to xet7.</summary>

A signed SAML Response with two Issuers is refused in the browser, which
node-saml 5.1.0 accepted; an assigned-only member's Due Cards show only their
own cards.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ccb465c3f">The keyboard shortcut browser test focuses the minicard link itself</a>. Thanks to mimZD and xet7.</summary>

Chromium does not leave the focus on the minicard after its menu is closed,
so the test makes the reported state directly; it passes in Chromium and
WebKit.

</details>

**The source-loaded server** - starting WeKan from source for development.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/15877dd1bc">A local package fork that a prebuilt package implies is loaded first</a>. Thanks to xet7.</summary>

The source server stopped at "isopack dynamic-import not yet loaded". It now
gets past that, and still stops later on "Cannot find module
'meteor/accounts-base'"; the browser tests ran against the bundle server.

</details>

**The changelog** - its guards between releases.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/05cc2460ea">The short changelog guard holds between releases too, when there is no Upcoming section yet</a>. Thanks to xet7.</summary>

`changelogShort.test.cjs` assumed an Upcoming section was always there, so it
failed right after every release, before anything new was written. With none
it checks that the newest release comes first and that nothing links an
Upcoming that does not exist.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.77 2026-10-31 WeKan ® release

**In short:** Two **node test guards** follow the movable popups and the date
picker of v12.76.

This release has the following developer-tooling fix:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ff2c0ed7f6">The date-popup guards follow movable popups and the date picker's empty cells</a>. Thanks to xet7.</summary>

`calendarPopupResize.test.cjs` asserted that a popup without a date editor does
not drag, and `calendarTodayMarker.test.cjs` picked a month's days with
`filter(Boolean)`. Both described v12.76 before it changed on purpose: every
popup drags by its title bar, or by its handle alone with drag handles on, and
an empty picker cell is an object with its own `_id`. Both are pinned instead.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.76 2026-10-31 WeKan ® release

**In short:** Security features: a **password policy** with an optional
breached-password check, **Admin Panel / Problems / Password length**,
**compulsory two-factor authentication**, sign-out of **idle sessions** and of
every session after a password change, an **audit log** of what administrators
did, **HSTS**, a cross-site request guard, and **S3 encryption at rest**.
**Sign-up** works again; the date picker has **Today**, the whole card title
edits and **every popup can be moved**; and an old **Sandstorm** grain migrated
from MongoDB 3 shows its boards again.

This release adds the following security features:

**Signing in** - which passwords are accepted and which are reported, who must
have a second factor, and when sessions end.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7abe9910a">New passwords have a minimum length, and a breached one can be refused</a>. Thanks to xet7.</summary>

`PASSWORD_MIN_LENGTH` (default 8) and `PASSWORD_CHECK_PWNED` (off by default),
in Admin Panel / People / Login and on every platform. The browser sends a
password to Meteor hashed, so the server checks every password that reaches it
as text - Admin Panel Set password and Add user, `POST /users/register` - and
the sign-up, Change Password, reset and enrolment forms check in the browser.
Signing in is never checked, so an existing shorter password keeps working
until it is changed. A breached password is found with Have I Been Pwned's
k-anonymity range API: only 5 hex digits of the SHA-1 leave WeKan, and an
unreachable service never refuses a password. A refused password is ordinary
use, not an attack, so it is not recorded in Admin Panel / Problems.
`tests/passwordPolicy.test.cjs` checks every place a password reaches the
server as text, and that nothing else sets one without the check.

</details>

- [The breached-password check computes its lookup digest once, with Web Crypto, in browser and server; it is never stored (CodeQL \#599)](https://github.com/wekan/wekan/commit/f406d46fe7).
  Thanks to GitHub CodeQL and xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c99aa7f845">Admin Panel / Problems / Password length lists who signs in with a too short password</a>. Thanks to xet7.</summary>

The minimum above was enforced as soon as it existed. Now `PASSWORD_MIN_LENGTH`
(default 8) is the length below which a sign-in is REPORTED, and the new
`PASSWORD_MIN_LENGTH_ENFORCE` (off by default) makes it a rule: a shorter new
password is refused, and an account that signs in with an older shorter one
sees only "Change your password" until it has a long enough one. Signing in is
never refused, so nobody is locked out by a minimum set after their password.
LDAP, OAuth2, OIDC, SAML, CAS and Sandstorm passwords are their provider's, and
are neither reported nor asked. Meteor sends a password hashed, so the browser
that typed it says "it was short" after signing in - never the password or its
length. The page has both settings and one row per account: username, first and
last such login, the latest IPv4 and IPv6 address with flag and city when a CDN
says where it is, the count and when it was fixed, filtered Too short (default),
Fixed or All. Node suites `passwordPolicy`, `passwordChangeRequired` and
`shortPasswordLogins`; Playwright `password-length-report` changes each setting
on the page and checks what it does, in Chromium and WebKit.
[Password length](docs/Features/Admin-Panel/Problems/Password-length.md).

</details>

- [The Password length pane names itself in the title bar, like every other Admin Panel pane](https://github.com/wekan/wekan/commit/85af731c1b).
  Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c99aa7f845">Changing one's own password signs every session of the account out, this one too</a>. Thanks to xet7.</summary>

Meteor's Change Password kept the session that changed it, and a reset link
signed the reset in. Now Member Settings, the forced change and a reset link
all end every session of the account, and only the new password signs in
again; the browser goes to the sign-in page as soon as it is signed out, since
the server closes the connection before the answer can arrive. An
administrator's Set password already signed everything out.
`password-change-other-sessions.e2e.js` changes it in one of two browsers:
both are signed out, the old password is refused and the new one signs in.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7abe9910a">Two-factor authentication can be made compulsory, for administrators or for everybody</a>. Thanks to xet7.</summary>

`REQUIRE_2FA`: `off` (default), `admins` or `all`. It covers the accounts that
sign in with a WeKan password; LDAP, OAuth2, SAML, CAS and Sandstorm accounts
sign in through an identity provider and are never asked. Such an account can
still sign in - it has to, to enrol - and sees only the set-up until it has
2FA. Until then the server refuses every method and publication but signing in
and enrolling, HTTP routes do not accept its login and the REST API gives it no
token; once required, 2FA cannot be switched off. An account between signing
in and enrolling is ordinary use, so nothing is recorded in Problems.
`tests/requireTwoFactor.test.cjs` runs the real wrappers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/41173f0f6b">A browser session is signed out after LOGOUT_IDLE_MINUTES without activity</a>. Thanks to xet7.</summary>

`LOGOUT_WITH_TIMER` ends a login at a deadline however busy its user is; nothing
ended a session somebody walked away from. The browser now reports a key press,
click, touch or scroll at most once a minute, the server keeps the time per
login token in `idleSessions`, and once a minute every token idle past the
limit is removed, which signs its connections out. A tab that reconnects by
itself - a laptop waking up - is not activity, and REST API tokens are never
removed. The time is kept beside the user rather than on the token, because
updating one element of the token array needs the positional `$` operator,
which not every database WeKan runs on supports. `tests/idleLogout.test.cjs`.

</details>

**HTTP** - what every response tells the browser, and which requests are
accepted only from WeKan's own pages.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4993242c5f">Strict-Transport-Security on every response of an HTTPS site</a>. Thanks to xet7.</summary>

Without HSTS, a link typed as plain HTTP or a downgrade on a hostile network
could strip TLS from the next visit unless the reverse proxy added the header.
It is now sent whenever `ROOT_URL` is https: 180 days, this host only.
`HSTS_MAX_AGE`, `HSTS_INCLUDE_SUBDOMAINS` and `HSTS_PRELOAD` change it; 0 stops
it, and preload is sent only with includeSubDomains and at least a year. Every
response also carries `X-Content-Type-Options: nosniff` and
`Referrer-Policy: strict-origin-when-cross-origin`. A header has no attempt to
record. `tests/securityHeaders.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48a2e97ea3">A state-changing request that logs in only with the cookie must come from WeKan itself</a>. Thanks to xet7.</summary>

`POST /import-trello` and other routes accept the login cookie as the login.
The cookie is SameSite=Strict, which keeps it off a cross-site request in
today's browsers; this is the second line, for older browsers, same-site
sibling hosts and routes added later. A POST, PUT, PATCH or DELETE whose only
login is the cookie must carry an Origin, or Referer, naming `ROOT_URL`'s host
or the Host / X-Forwarded-Host it was sent to - on Sandstorm, the grain's own
host. A refusal is recorded in Admin Panel / Problems as
`csrf.cross-site-cookie` and never blocks the account whose cookie it was.
`tests/crossSiteRequest.test.cjs` also fails when a route registers a handler
that runs before the guard.

</details>

**The Admin Panel** - a record of what administrators changed.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d5b832499">People / Audit log shows what site administrators did</a>. Thanks to xet7.</summary>

Nothing recorded who set somebody's password, made somebody an admin, changed
a login setting or restored a backup. Every call of those administrative
methods by a site administrator is now kept for a year, one document each:
when, who, the action, its outcome - a refused call too - its arguments and
the address. A password or a secret never reaches the trail: credential-named
keys, password arguments by position and passwords inside URLs are replaced by
`[redacted]`. An administrator editing cards is not in it, and a trail that
cannot be written never changes what the method did.
`tests/adminAudit.test.cjs`.

</details>

- [The audit log has its own URL, /admin/people/audit-log, a title, and right-to-left alignment](https://github.com/wekan/wekan/commit/2017f2871f).
  Thanks to xet7.

**Attachments** - where the files are kept, and how.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/482c2c29f4">Files and backups in S3 can be encrypted at rest</a>. Thanks to xet7.</summary>

Admin Panel / Attachments / S3 / Server-side encryption: SSE-S3 (AES256) or
SSE-KMS, with a KMS key or the account's default. S3 encrypts each object as it
is written and decrypts it for WeKan on read, so reads, range requests and
moves are unchanged; every upload, renamed object and backup written to S3
carries it. On the filesystem, encryption at rest stays with the disk or volume
(LUKS, an encrypted cloud volume): exports, PDF, thumbnails, virus scans,
backups and WebDAV all read the stored files directly.
`tests/s3Encryption.test.cjs`.

</details>

and adds the following new features:

**Dates** - choosing a date in a date popup.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc21c901f4">The date picker has a Today button, back to today's month from wherever the arrows went</a>. Thanks to mimZD and xet7.</summary>

The board Calendar view and Calendar mode already had Today; the date picker
of every date popup had only « ‹ › ». Today shows today's month and focuses
today, and changes nothing until a day is clicked and saved. Testing it found a
picker bug that was already there: a month navigated back to was drawn wrong -
October as "29, empty, 30, empty", without its 31st - because Blaze matched the
weeks and days, which had no `_id`, by position. Every week and cell has one
now. `calendarPickerControls.test.cjs` and `calendar-today-marker.e2e.js`,
which checks every day of the month in order after Today.

</details>

**The opened card and popups** - editing a card's title, and moving windows.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22a12dc7f8">The whole card title edits; the window and every popup move by their bar or drag handle</a>. Thanks to mimZD and xet7.</summary>

The title was split like a minicard's: the leading half edited and the
trailing half dragged the window, so a click on the right of the title did not
edit. All of it edits now. With drag handles off the window is moved from the
empty space of its header row above the title, between the collapse caret and
the menu; with them on, by the drag handle alone. Every popup moves the same
way - by its title bar, or its handle alone - where only four kinds moved
before, and a drag no longer makes a popup placed from the right edge, or one
with a margin, jump as it begins. `card-title-edit-and-move-6839.e2e.js` in
Chromium and WebKit.

</details>

**Member Settings** - Change Settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ffd5cbd2ad">Change Settings: icons in a column on the first line, compact wrapped lines, rows divided</a>. Thanks to mimZD and xet7.</summary>

Its settings are sentences, and most wrap; on the shared popup list each line
was 33px high with the icon centred between them and nothing between one
setting and the next. Each row is an icon column, the words and the check mark
now, the icon on the first line, a wrapped line an ordinary line high, and a
rule between rows. `change-settings-popup-6835.e2e.js` in Persian and English.

</details>

and fixes the following bugs:

**The d shortcut** - opening the Due date editor from the keyboard.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b1403ca7af">d opens the Due date editor of a card that is still being opened, and it stays open</a>. Thanks to mimZD and xet7.</summary>

On a slower server a card's details render a few hundred milliseconds after
the click that opens it, and `d` pressed in that moment found no Due date
control and did nothing; only the hovered-minicard path waited. Both wait now
for that card's control. The card details also closed their card's popup when
merely rendered again, so a popup could open and shut at once; they close it
now only when the card is closed or another card opened. The Playwright test
emulates a 300 ms connection, and fails on the code before this change.

</details>

- [Typing d in the card title types at the end of the title in WebKit too](https://github.com/wekan/wekan/commit/73c21dfe3e).
  Thanks to xet7.

**Minicards** - what a minicard shows, and where.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf4b48df09">A due date uses the minicard's width instead of three lines beside an empty strip</a>. Thanks to mimZD and xet7.</summary>

The dates row reserved 84px at its trailing edge - a third of a narrow card -
for nothing, and a due date with its "1 day left" was broken over three lines.
It reserves the drag handle's 24px now. The rest of
[#6834](https://github.com/wekan/wekan/issues/6834) is in TODO Later.
`minicard-dates-width-6834.e2e.js` in English and Persian.

</details>

- [A card-button rule is a button on the minicard: Board Settings / Card, Card buttons, Show on Minicard, since v12.16, now with a test](https://github.com/wekan/wekan/commit/429fdc5319).
  Thanks to mimZD and xet7.

**Signing up** - registering a new account with the sign-up form.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/508484ef1e">Registering no longer answers Internal server error, and signs the new user in</a>. Thanks to xet7.</summary>

The REQUIRE_2FA wrapper of every method and publication, and the Audit log's
wrapper of the administrators' methods, awaited before calling the handler -
even with REQUIRE_2FA off. audit-argument-checks asks synchronously, the moment
a handler returns, whether check() saw every argument, so the handler's own
check() came too late: sign-up answered "Internal server error" while the
account was created anyway (the next try said it already existed), and the
starredPublicBoards and translation publications failed for everybody. A
wrapper now calls the handler at once when it needs no lookup, and hands the
audit over when it must await (`server/lib/argumentChecks.js`).
`tests/wrappedHandlerArgumentChecks.test.cjs` runs both wrappers under a model
of the audit, and the sign-up Playwright test registers - with no mail server
configured - and checks that the new user is signed in.

</details>

**Upgrading old data** - documents from old WeKan versions are brought to the
current structure at startup, so nothing that is in the database stays hidden.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ab0afdc93">Boards from before the templates feature are shown on All Boards again</a>. Thanks to xet7.</summary>

A Sandstorm grain migrated from MongoDB 3 to FerretDB copied every document -
1 board, 31 cards, 8 lists - and then showed an empty All Boards page. Boards,
swimlanes, lists and cards made before the templates feature have no `type`:
the schemas fill it on insert only. All Boards publishes `type: 'board'` and
the card queries ask for `cardType-card`, and a missing field matches neither.
The new `type-defaults-backfill` startup step sets the schema default where
`type` is missing, null or empty, and never changes an explicit type such as
a template or a linked card. `tests/schemaUpgradeSteps.test.cjs` upgrades the
grain's shape and checks that typed documents are left alone.

The same log showed `merge-per-swimlane-lists FAILED ... missing schema for key
"swimlaneId"`: FerretDB's SQLite `distinct` could not read documents without
the fields it asked for. That is fixed in the FerretDB fork (Upcoming FerretDB
release), which the next bundle includes.

</details>

**Snap** - backing up, restoring and repairing a snap from the host's shell.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b5c855820">Backup and restore instructions find mongodump and mongorestore on AlmaLinux, Rocky Linux and Fedora</a>. Thanks to Group-Deed and xet7.</summary>

snapd keeps the snaps in `/var/lib/snapd/snap` on Fedora, RHEL, AlmaLinux,
Rocky Linux, CentOS Stream and Arch Linux, which have no `/snap`. The
instructions exported `/snap/wekan/current/bin` and its `lib/x86_64-linux-gnu`,
so restoring a backup on Rocky Linux failed until both were found by hand, and
only Arch had a note - for the library path alone. Every instruction now picks
the directory with one `S=` line and the CPU's library directory with
`$(uname -m)`, so arm64 works too. `database-role`, `database-compare` and
`database-merge`, which can be run from a host shell, find the snap in either
place. `tests/snapPathElLinux.test.cjs` fails on an export of a `/snap`-only
path in any document and on a script that falls back to `/snap` alone.

</details>

and has the following developer-tooling fixes:

**The build log** - what a build from build.sh and build.bat writes while it
runs, and how much of it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6551062492">EVERYTHING builds without the per-require module trace, so it no longer fills the disk</a>. Thanks to xet7.</summary>

The build's `NODE_DEBUG=module` trace wrote over 12 GB in the first half hour
of an EVERYTHING run on macOS - twice, through tee - and slowed the build it
traced, so the run would fill the disk before it reached the tests. A build
from the `build.sh` menu still traces by default; `WEKAN_BUILD_TRACE_MODULES=0`
turns it off, and EVERYTHING sets that unless the caller asked for `1`. The
other build diagnostics (resolver commands, npm verbose, `METEOR_PROFILE`) are
unchanged. `tests/buildCommandOutput.test.cjs` checks that a menu build still
traces and that nothing exports the module trace unconditionally.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a13e927bc">Every build traces module resolution only when WEKAN_BUILD_TRACE_MODULES=1 asks for it</a>. Thanks to xet7.</summary>

Turning the trace off for EVERYTHING alone was not enough: a dev build from the
menu wrote 1.1 GB, three million lines, in its first three minutes. So the
trace is now opt-in in `build.sh` and `build.bat` alike, and the diagnostics
line says whether it is on and how to turn it on. The entry above describes
the menu default as it was then. `tests/buildCommandOutput.test.cjs` pins the
opt-in in both scripts, and fails on a trace turned on by default or
unconditionally.

</details>

**Meteor in .tools** - starting the Meteor that build.sh and build.bat keep in
the repository's own tools directory.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9a118c83b2">Meteor starts with one springboard instead of springboarding forever</a>. Thanks to xet7.</summary>

A build from the menu printed `uname -p` and `sysctl hw.cpu64bit_capable` over
and over and never reached its first package. With `METEOR_WAREHOUSE_DIR` set
and no `SANDBOX`, Meteor takes the running tool to be wherever the warehouse's
`meteor` link points - 3.5.4, the release it was installed with - so with
`.meteor/release` at 3.6-rc.1 every start springboarded to 3.6.0-rc.1, found
itself the wrong tool again and springboarded again: 28 times in 20 seconds of
`meteor --version`. The 1.1 GB build log above was the same loop, its module
trace printed again on every exec. `releases/tools-env.sh` and `tools-env.bat`
now set `SANDBOX=true` beside the warehouse, as Meteor's own self-test does,
and so do the Nextcloud test scripts and the dev-source runner.
`tests/meteorSpringboardLoop.test.cjs` checks both scripts, fails on any file
that sets the warehouse without `SANDBOX`, and runs the installed Meteor to
count its springboards.

</details>

and updates the following documentation:

- [Security settings: every hardening option of a WeKan site on one page](https://github.com/wekan/wekan/commit/302b47db6f).
  Thanks to xet7.
- [Admin Panel / People / Audit log: what it records and what it never does](https://github.com/wekan/wekan/commit/f165a24192).
  Thanks to xet7.

and updates the following translations:

**Languages updated:** 234 languages.

**Password length** - the strings of Admin Panel / Problems / Password length
and of the Change your password dialog.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f9379ac86">The 18 new password-length strings in every language</a>. Thanks to xet7.</summary>

Each string is in the language and script its locale tag names, with the terms
the file already uses for password, account, save and sign in, and `__min__`
kept exactly; only those 18 keys changed in each file. The commit lists the
languages written with low confidence, for a speaker to correct on Transifex.

</details>

**Security features** - the strings of the password policy, two-factor, the
audit log and S3 encryption.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de23dece66">The 16 new security strings in every language, and Frisian two-factor text that was Dutch</a>. Thanks to xet7.</summary>

Each string is in the language and script its locale tag names, with the terms
the file already uses for password, account, attachment, backup and two-factor
authentication, and `__min__` kept exactly. fy and fy-NL had Dutch two-factor
strings, now Frisian (`tests/frisianTwoFactorLanguage.test.cjs`); Tigre spells
storage መክዘን, not Tigrinya's መኽዘን. The commit lists the languages written
with low confidence, for a speaker to correct on Transifex.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.75 2026-10-30 WeKan ® release

**In short:** Changing a password signs the account out in every other browser,
and now a test proves it in two real browsers.

This release adds the following security regression test:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc9a7bb1ac">A changed password signs the account out in every other browser</a>. Thanks to xet7.</summary>

A report described a session that stayed signed in on a second browser after
the password was changed on the first. WeKan does not do that: Member Settings
/ Change Password is Meteor's changePassword, which removes every login token
but the changing session's, the admin's Set password and a password reset
remove them all, and a session whose token is gone is closed.
`password-change-other-sessions.e2e.js` runs the report in two browsers - the
other one is signed out within seconds, stays signed out after a reload, and
only the new password works - three times in Chromium and in WebKit.
`tests/passwordChangeSessions.test.cjs` pins those paths and fails on a password
change that keeps the other sessions.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.74 2026-10-30 WeKan ® release

**In short:** **Caddy** and **FerretDB**, the Go servers WeKan ships, no longer
open MPTCP listeners, which Linux kernel bug **CVE-2026-98432** is reachable
through. The real fix is a patched host kernel.

This release has the following security hardening:

**Go servers** - Caddy and FerretDB, and the kernel bug behind their listeners.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9751b65d4">Caddy and FerretDB run with no MPTCP listener (CVE-2026-98432)</a>. Thanks to xet7.</summary>

CVE-2026-98432 is a Linux kernel use-after-free in IPv4 TCP connection
handling, shown to give remote code execution through an MPTCP listener, and
since Go 1.24 every Linux listen socket of a Go program is MPTCP by default.
Every place WeKan starts Caddy or FerretDB sets `GODEBUG=multipathtcp=0`: the
snap, the Docker entrypoint, the bundle launcher, every docker-compose FerretDB
and the Sandstorm grain. Caddy needs no rebuild, because Go reads `GODEBUG` at
start, and wekan/FerretDB now builds with `godebug multipathtcp=0` too. An
operator's own `multipathtcp` setting is kept. Checked on Linux: a Go server's
default listener uses MPTCP, and with the setting it does not.
`tests/goMptcpOff.test.cjs` pins every launcher. This is a kernel bug, not
WeKan's, so there is no attempt to show in Admin Panel → Problems; upgrade the
host kernel.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.73 2026-10-30 WeKan ® release

**In short:** **CHANGELOG.md** is now short: the In short of the upcoming
release and of the five newest releases, in plain Markdown. The status and every
change of each release are in **CHANGELOG-big.md**, which is the one that is
written. **CodeQL** alert #598 in the Sandstorm host test is fixed, and the
release script pulls before releasing, so a moved main no longer stops it.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fcd995095d">Alert #598: the Sandstorm host test names no host but sandstorm.org</a>. Thanks to GitHub CodeQL and xet7.</summary>

CodeQL flagged incomplete URL substring sanitization (CWE-20) in
`tests/sandstormOrgHosts.test.cjs`, which picked the files to check by whether
they contained the old Sandstorm host name as a substring. The test no longer
names that host at all: it finds every Sandstorm host on a top-level domain
other than `org` by its shape, written as a URL, so property paths, file names
and the domains reserved for tests are not taken for hosts. Run against the
files from before the switch to sandstorm.org, it finds the 13 old hosts. The
finding was in a test, not in WeKan, so there is no attempt to show in Admin
Panel → Problems.

</details>

and has the following developer-tooling changes:

**Publishing a release** - how the release script reaches GitHub.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e372016826">Release All pulls before releasing, and pulls and retries when its push is refused</a>. Thanks to xet7.</summary>

v12.73 was prepared on a main that origin had moved past: the release bot's
v12.72 version bump had landed meanwhile. The push of "Prepare v12.73 release"
was refused and the script stopped before dispatching the workflow, so no
release ran and no tag was made. `release-all.sh` now runs build.sh's git pull
before it chooses the version or renames anything, and pushes with build.sh's
git push, which pulls and pushes once more when origin moved meanwhile. If the
push still does not finish, it says the workflow was not dispatched and how to
dispatch it. `tests/releaseUpcomingPreflight.test.cjs` pins the order.

</details>

**Release history** - which file is written, and which is read.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f1c0db247a">CHANGELOG.md is the In short of the five newest releases, written from CHANGELOG-big.md</a>. Thanks to xet7.</summary>

The changelog is `CHANGELOG-big.md` now, renamed in a commit of its own
(`61e838df46`) so its history follows it: `# Status`, `# Upcoming` and every
release in full. The release tooling, the release workflow and its notes'
link, the commit-link repair, the archive and the tests use it.
`CHANGELOG.md` is generated from it by `releases/changelog-short.mjs`: no
Status or Upcoming, only each of the five newest releases' In short and a link
to its full section, with no `<details>` or `<summary>` and only Markdown
links. `release-all.sh` regenerates it in the release commit, the Sandstorm App
Market shows it, and `tests/changelogShort.test.cjs` fails when it is not what
the generator writes. CLAUDE.md and AGENTS.md describe both files.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1af642069c">The short CHANGELOG.md starts with the upcoming release's In short</a>. Thanks to xet7.</summary>

What was about to be released was only in `CHANGELOG-big.md`. The short file
now starts with the unreleased `# Upcoming WeKan ® release` - its In short and
a link to its full section - with the five newest releases below it; right
after a release, when there is no Upcoming yet, none is invented. CLAUDE.md and
AGENTS.md say what "update wekan changelog" does to both files.
`tests/changelogShort.test.cjs` pins it.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.72 2026-10-30 WeKan ® release

**In short:** A card link can no longer launch an operating-system handler with
a code-execution history, such as **ms-msdt** (Follina) or **telnet**, even if
an administrator lists it, and an attempt to write one shows in **Admin Panel →
Problems**. The **Apache** guide follows the 2024 Confusion Attacks, and the
Sandstorm store build publishes to **both app markets**.

This release has the following security hardening:

**Card links** - which custom URL schemes may become clickable.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b4e5f90afb">A card link never launches an OS handler with a code-execution history, even when listed</a>. Thanks to xet7.</summary>

Custom URL schemes link only when Admin Panel → Features → URL lists them, and
never `javascript:` or another scheme that runs code in the page. A listed
operating-system handler was linked, though, and some have a public
code-execution history: `ms-msdt` (Follina, CVE-2022-30190), `search-ms`,
`search`, `ms-officecmd`, `ms-appinstaller`, `ms-cxh`, `ms-cxh-full` and
`telnet`, the last step of a 2026 browser full chain. They are never linked now,
by the app and by the markdown package, and a click on one does nothing. A card,
comment or checklist that adds a link to one shows in Admin Panel → Problems as
HandlerLink, with who wrote it. The Visibility docs say what a listed `file:`
does on Windows. `tests/urlSchemeAllowlist.test.cjs` and
`custom-url-schemes.e2e.js` (Chromium and WebKit) pin it.

</details>

**Apache** - the reverse proxy guide.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a97c8bd86">The Apache guide asks for httpd 2.4.60 and builds no proxy target from the request</a>. Thanks to xet7.</summary>

Checked against the 2024 Confusion Attacks on Apache httpd (CVE-2024-38472 to
CVE-2024-38477 and CVE-2024-39573, fixed in 2.4.60). The examples passed the
WebSocket with `ProxyPassMatch` and `$1`, a request capture in a proxy target,
and the sub-URL one never matched its WebSocket at all. Both use
`ProxyPass ... upgrade=websocket` now, and a new section lists what not to add.
Verified with Apache 2.4.67 in front of a WebSocket server, at `/` and at
`/wekan`; `tests/apacheReverseProxy.test.cjs` pins it.

</details>

and has the following developer-tooling fixes:

**Sandstorm** - publishing the Sandstorm package, and how its app market listing
looks.

- [The store build publishes WeKan to both Sandstorm app markets](https://github.com/wekan/wekan/commit/10851cd3f4),
  apps.sandstorm.org and apps.sandstorm.io. Thanks to ocdtrekkie.
- [Fix the publish command's argument order](https://github.com/wekan/wekan/commit/2c1fc39f61).
  Thanks to ocdtrekkie and xet7.
- [The sandstorm.org host test allows that publish step](https://github.com/wekan/wekan/commit/55b71ce19e),
  and checks both markets are published to. Thanks to xet7.
- [New board view screenshots for the Sandstorm app market listing](https://github.com/wekan/wekan/commit/a086323a1f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.71 2026-10-30 WeKan ® release

**In short:** The **Sandstorm** build installs Sandstorm from
**install.sandstorm.org**, as the Sandstorm workflows already did, and the
docs link sandstorm.org. The Hall of Fame guards read every vulnerability name
now that each one links to its own page.

This release has the following developer-tooling fixes:

**Releases** - where the Sandstorm build gets Sandstorm.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca2dc5fae5">The Sandstorm build installs Sandstorm from install.sandstorm.org</a>. Thanks to xet7.</summary>

v12.69's Sandstorm build stopped because the certificate of
install.sandstorm.io had expired. The Release All job fetches the installer
from install.sandstorm.org, as the standalone Sandstorm workflows already did,
and so does `releases/install-sandstorm.sh`. That installer downloads Sandstorm
from dl.sandstorm.org and sets up a development server at local.sandstorm.org,
so the docs and code comments link sandstorm.org too, each address checked;
only the demo stays on sandstorm.io, which has no sandstorm.org name.
`tests/sandstormOrgHosts.test.cjs` keeps it that way.

</details>

**Tests** - the guards that compare WeKan's security tests with the Hall of
Fame.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/43c4d41877">The Hall of Fame guards read a linked vulnerability name too</a>. Thanks to xet7.</summary>

The two suites that compare WeKan's security tests with the Hall of Fame read
only names without a link, so the four whose names already linked to their
pages - ImportPlacementBleed, SamlSubjectBleed, StampBleed and UploadBleed -
were never checked. On wekan.fi every name is now a link; the suites read it,
and list those four as guarded by the tests that name them.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.70 2026-10-29 WeKan ® release

**In short:** The **AppImages** and the **Launchpad** snaps build again: their
FerretDB and mongo-tools are readable by every user, and the snap source
carries what its downloads need. **Continuous backup** names a changed
encrypted file as changed with **OpenSSL 4**, and the release and test tooling
runs on macOS and reports a bad certificate as one.

This release fixes the following bugs:

**Continuous backup** - restoring an encrypted backup file.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ffe49dd2fd">A changed encrypted file is reported as changed, also with OpenSSL 4</a>. Thanks to xet7.</summary>

A Node.js linked to OpenSSL 4 reports an AES-GCM tag mismatch as
`ERR_OSSL_BAD_DECRYPT` ("bad decrypt"), where OpenSSL 3 says "Unsupported state
or unable to authenticate data". `decryptFile()` matched only the second, so
with OpenSSL 4 a changed backup file or a wrong key surfaced as a raw OpenSSL
error instead of "An encrypted backup file has changed or the key is wrong".
Both are recognised, and the partial output is still removed.
`tests/continuousBackupEncryption.test.cjs` passes with OpenSSL 4.1.0 and
3.5.9.

</details>

and has the following developer-tooling fixes:

**Releases** - the AppImages, the Launchpad snaps, the Bun assets and what a
failed download says.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dfdadaa8ca">The AppImages are built again: FerretDB and mongo-tools are readable by every user</a>. Thanks to xet7.</summary>

`releases/fetch.sh` downloaded into a `mktemp` file and moved it into place,
so every download kept mktemp's 0600, and the bundled `ferretdb` and
`mongo-tools` were 0711 after `chmod +x`. Since that day's appimagetool
refuses such a file - a user other than the owner gets "Permission denied" -
all six v12.69 AppImages failed. A download gets the mode its umask gives a
new file, and the AppDir is made `a+rX` before it is packed;
`tests/releaseDownloads.test.cjs` fails on the old `fetch.sh` with 711.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a1f2c006b4">The Launchpad snap source carries the tools-env.sh that fetch.sh needs</a>. Thanks to xet7.</summary>

Only the files the snap recipe reads are uploaded to Launchpad, and the list
had `releases/fetch.sh` without the `releases/tools-env.sh` it sources. In the
armhf build the caddy part's `fetch.sh` had no `TMPDIR`, and curl got an empty
`-o` seven times, with pauses of up to 480 s, before it was called an outage.
The file is uploaded, `tools-env.sh` makes `.tools/tmp` in such a tree, and
`fetch.sh` stops at once without a temporary file or when curl cannot start.
`tests/releaseSnapLaunchpadFlatten.test.cjs` requires every `releases/` file a
listed script uses to be listed. s390x had failed on Launchpad itself: even a
new build answered "Could not find repository at path".

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6bbb4d39bc">A download whose TLS certificate cannot be verified is named as that, not as an outage</a>. Thanks to xet7.</summary>

v12.69's Sandstorm build stopped because the certificate of
install.sandstorm.io expired that day, and `fetch.sh` reported "The server is
having an outage" for curl's exit 60. It now says the certificate could not be
verified and that only that server's owner can fix it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2dcccf0d4a">The Bun release assets build with Python 3.9, which macOS ships as python3</a>. Thanks to xet7.</summary>

`hashlib.file_digest` is Python 3.11+ and `Path.write_text(newline=)` is
3.10+, so `releases/bun/assets.py` stopped with AttributeError and TypeError on
macOS's python3 3.9. It hashes in chunks and writes the LF-only `.sha256sum`
through `open(newline='\n')`; `tests/bun-release.py` still pins LF on every
platform and that neither newer call comes back.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48a8937ff0">A snap attempt finds its own Launchpad build log by name, not only by mtime</a>. Thanks to xet7.</summary>

Whether a build log belonged to the current attempt was decided by `-nt`
against the attempt's marker alone. bash 3.2 compares whole seconds, so a log
written in the marker's second was not "newer": it was neither printed nor
checked for a Launchpad infrastructure failure. `this_attempts_log()` counts a
log whose name did not exist when the attempt started, or one rewritten after
the marker, and an earlier attempt's untouched log still does not count.
`tests/snapLaunchpadInfraRetry.test.cjs` covers all three cases.

</details>

**Tests** - the suites that need process listings and sandbox-exec on macOS,
and three that tested the wrong row, too early or the old layout.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf266fb4da">DB conformance recognises a live run where ps is not allowed</a>. Thanks to xet7.</summary>

Inside a sandboxed macOS app `ps` fails with "operation not permitted", so
every live conformance run looked dead and a second run would remove its
containers. `command_line_of()` falls back to `pgrep -lf`, which still works
there, and `tests/dbConformanceStaleContainers.test.cjs` pins the fallback.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5534c8830c">The macOS suites run inside the sandboxed editor too</a>. Thanks to xet7.</summary>

`tests/mac-smoke-app.py` checked with `ps` that a killed descendant was gone;
it waits for `os.kill(pid, 0)` to find it gone and uses `ps` only to tell a
zombie from a live process. `tests/macosSandbox.test.cjs` skips its live
`sandbox-exec` check only when even an `(allow default)` profile cannot be
applied, which is the case inside the sandbox it tests.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d06b468629">ReplyBleed's mocha test counts the attempt in every ReplyBleed row</a>. Thanks to xet7.</summary>

ReplyBleed is one Admin Panel → Problems row per source, and the webhook's
source is the client address, so in a test database that persists between
runs the test's `findOne` read the bounce test's row, whose count the spoofed
reply never moves. It sums the count over all ReplyBleed rows, as
`emailBounces.tests.js` already does.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e4b83d2274">The keyboard card move test waits for the reset sorts to reach the client</a>. Thanks to xet7.</summary>

The test reset three cards to sort 0 in the database and waited only for id
order on the page, which the old sorts already gave one time in six, so the
move was sometimes computed from stale values and failed one run in three. It
waits for the client's own copy of the three cards.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/856a32968b">The board drag settings test opens Card's Draggable table in its section hamburger</a>. Thanks to xet7.</summary>

Since Board Settings / Card became the card's Card Settings, its Draggable
table is in the Card section's hamburger, and the test failed in every
language waiting for it in the popup. It opens Card as the cog menu does, as
`board-settings-columns.e2e.js` already does.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.69 2026-10-29 WeKan ® release

**In short:** **ImportPlacementBleed** is fixed: an import is placed only on its
own board. **Invite via Email** adds the invited new user again, instead of
the first user of the database. The **OpenBSD** bundle starts again, and
**History** works on **FerretDB**: date custom field changes are recorded there,
and the database migration says when documents did not arrive.

This release fixes the following CRITICAL SECURITY ISSUE of [ImportPlacementBleed](https://wekan.fi/hall-of-fame/importplacementbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d6d481fcb">An import into a board is placed only beside that board's own list, swimlane or card</a>. Thanks to Zachariah Mithani (AploSec) and xet7.</summary>

The scoped importer, reached by `POST /api/import/zip` and the `importScoped`
method, authorized the import on `boardId` alone. The `listId` and
`swimlaneId` beside it were written onto the new cards as given, and a `cardId`
was looked up with no board, so a writer of board A could create cards on A
whose list and swimlane were board B's, and probe whether a card id existed on
a board they cannot see. Before anything is written, the list, swimlane and
card are now looked up together with the board's id; an id of another board is
refused (400 over REST, `error-import-placement` from the method), with the
same answer for a foreign card and a missing one. A refusal is shown in Admin
Panel → Problems as ImportPlacementBleed, without blocking the account, since
an import menu left open while its list moved can reach it.
`tests/importPlacementBleed.test.cjs` pins the decision, the check before every
write and a negative scan for a target id used without the board;
`security-import-placement.e2e.js` runs the reporter's attack by both routes
and fails on the previous code.

</details>

and fixes the following bugs:

**Board members** - who an invitation adds to a board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8556459f97">Invite via Email adds the invited new user, not the first user of the database</a>. Thanks to momosari and xet7.</summary>

Meteor 3's server `Accounts.createUser` is `createUserAsync`, and
`inviteUserToBoard` called it without `await`. The new user's id was a Promise,
which `findOneAsync` read as the empty selector `{}`, so it returned the FIRST
user - usually the site administrator - who was added to the board and got the
invitee's language and invited boards
([#6831](https://github.com/wekan/wekan/issues/6831)). It happened on any
database, not only FerretDB. `createUser` and `sendEnrollmentEmail` are awaited,
the user found must be the one just created, and every server `ReactiveCache`
getter now refuses a Promise as its id or selector, so a missing `await` fails
loudly instead of picking the first document.
`tests/inviteNewUserByEmail.test.cjs`
pins the guard, the reporter's case and that no server file calls an async
Accounts API without `await`; `invite-member-email-case.e2e.js` invites a new
address and checks that exactly that account joined - it fails on the previous
code.

</details>

**Bundles** - starting WeKan on the BSDs.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec6cf66bff">The OpenBSD bundle starts again, start-wekan.sh takes only a number from sysctl</a>. Thanks to xet7.</summary>

OpenBSD's `sysctl` prints nothing and exits 0 for a name it does not have, so
`sysctl -n hw.memsize || sysctl -n hw.physmem` stopped at the empty
`hw.memsize`, and `$(( / 1048576 ))` ended `start-wekan.sh` before WeKan
answered (the v12.68 BSD bundles job). Both `start-wekan.sh` copies now try
`hw.memsize`, `hw.physmem64` (NetBSD, whose `hw.physmem` is 32-bit) and
`hw.physmem` in turn and take the first numeric answer.
`tests/macosShellPortability.test.cjs` runs those lines against fake OpenBSD,
NetBSD and macOS `sysctl`s, and shows the old chain failing on the OpenBSD one.

</details>

**History on FerretDB** - what the History of a card keeps, and what the
database migration copies.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01968fc637">Date custom field changes are recorded on FerretDB, and the migration reports refused documents</a>. Thanks to vijlautens and xet7.</summary>

A History row of a date-valued custom field held `datePaths` as an array of
path arrays, `[["3","value"]]`. FerretDB v1 does not store an array inside an
array, so on FerretDB the change was not recorded, and the text database
migration to FerretDB dropped those rows while it swallowed the per-document
error and still reported success
([#6832](https://github.com/wekan/wekan/issues/6832)). Each path is now a JSON
string, `'["3","value"]'`; rows already written in the array form on MongoDB
still restore, and the migration to FerretDB rewrites them to strings. The
migration counts every document the target refuses and ends as failed, with the
count per collection and the first error. `tests/changeHistoryGroups.test.cjs`
pins the string form, the legacy restore, the rewrite with no array left inside
an array, and that a refused document is counted before success;
`history-nested-dates.e2e.js` checks the stored row.

</details>

and has the following release-tooling fix:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/99d9958e39">Release all missing builds the missing assets even when the rerun of failed jobs fails again</a>. Thanks to xet7.</summary>

The planner needed `recover`, so one job failing again in the rerun of the full
release skipped the planner and every build after it. For v12.68 the rerun
failed on four Launchpad snaps (503 / timeout) and on the OpenBSD bundle, whose
`start-wekan.sh` fault is in the tagged code and so in every rerun of it. The
planner now runs unless the run is cancelled, each job after it checks the
planner's own result, and `recover` stays red and names the jobs that failed
again. `tests/retryFailedRelease.test.py` pins both.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.68 2026-10-29 WeKan ® release

**In short:** **Card Settings**, in Board Settings / Card, becomes two panes of
checklists - the minicard's and the card's - with a checkbox per section and
the board's custom fields as items, and the opened card and the minicard
follow its sections and order; every opened card shows every field its board
allows, empty or not. WeKan moves to **Meteor 3.6-rc.1**, keeping its own
security additions to Meteor's packages. **Data health** in Admin Panel /
Problems can now clean up custom fields whose boards were all deleted, and
empty fields no longer show **Scrum** sections on boards that have Scrum
turned off.

This release adds the following new features:

**Card Settings** - one set of checklists for what cards and minicards show,
on the opened card and in Board Settings / Card alike.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c0ec28e82f">Card Settings on the opened card, its sections as checklists</a>. Thanks to xet7.</summary>

The opened card's "+ Add" is now **Card Settings**, and it no longer opens the
Board Settings / Card popup: the button and everything below it are replaced
by Card Settings itself until the X beside its title puts the card back. Under
the title, **Show** chooses Show on Minicard or Show on Card, and the sections
(Card, Date, Time, ... Comments) are drawn like checklists - the section is
the checklist's title, its rows the items, each checkbox the board-wide Show
on Card or Show on Minicard of that field. A row's hamburger holds On this
card and Show empty; a section's holds Select all / Select none, its card
actions and, for Card, Show empty fields, Ask for a reason and the Draggable
table. Sections and rows drag like checklists and their items; a section's
order is the board's new `cardSettingsSectionOrder`. Sections collapse, kept
per user. Board Settings / Card is still the popup. Design:
[Card Settings](docs/Features/Cards/Card-Settings.md).
`tests/cardSettingsOnCard.test.cjs` and `card-add-fields.e2e.js` pin it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52de57c844">Board Settings / Card shows the same checklists as the opened card, by the same templates</a>. Thanks to xet7.</summary>

Board Settings / Card had its own layout - a left menu of sections and a pane
of two lists with column headings. It now draws the opened card's Card
Settings itself, with no card: Show on Minicard / Show on Card, the sections
as checklists and the same hamburgers; only On this card is left out, and the
popup's header is the title and X. It is 600px wide instead of 1200px. With
drag handles on, a row or section is dragged only by its handle and the rest
scrolls the page; with them off, by its icon and name. A row dropped on
another section goes back and nothing is saved. Testing both open at once
found three faults, now fixed: their Show radios were one group, Select all
could act on the other one, and switching Show could put a click on the
neighbouring row. Docs:
[Card Settings](docs/Features/Cards/Card-Settings.md).
`tests/cardSettingsOnCard.test.cjs` compares the templates and
`card-add-fields.e2e.js` the two views, row by row, and the drag rules.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5adfc1b9db">A space between a checkbox and its label, on the rows and in the hamburgers</a>. Thanks to xet7.</summary>

A checkbox touched its label on the rows of Card Settings and in their
hamburgers' popups. Both now have a space's width between them. A tick is
drawn rotated and reached past its box, so left to right it is drawn a little
further left: a ticked box keeps the same space and its label does not move.
`card-add-fields.e2e.js` measures it, ticked and unticked.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e5bc58105">A checkbox per section, every field always shown, Card Settings only in Board Settings</a>. Thanks to xet7.</summary>

The opened card has no Card Settings button any more; Card Settings is Board
Settings / Card. A card shows every field its board shows on cards, empty or
not, so On this card, Show empty and Show empty fields are gone. Each section
has a checkbox before its title that hides the whole section on the chosen
side - the card or the minicard - while its rows keep their ticks. A section
with one row is one line, and a hamburger is drawn only when it holds
something. Custom Fields lists the board's custom fields as items, reordered
by drag and drop, with a + under them that creates one. Card actions stay in
the card's own section hamburgers. See
[Card Settings](docs/Features/Cards/Card-Settings.md).
`tests/cardSettingsSectionShown.test.cjs`,
`tests/cardSettingsCustomFields.test.cjs` and `card-add-fields.e2e.js` pin it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c9742e09d">Hamburger menus open on top of Card Settings, next to their button</a>. Thanks to xet7.</summary>

A hamburger of Card Settings opened its menu in Card Settings' place, and
Card Settings disappeared until the back arrow. Its menus and forms - a custom
field's edit form, the + under Custom Fields - now open as a layer on top of
Card Settings, next to their button, Card Settings still visible under it.
Their X, their button again, a press elsewhere or Escape closes them. A layer
opens toward the middle of Card Settings, so the + form no longer ran out of
its left side. `tests/popupLayer.test.cjs` and `card-add-fields.e2e.js` pin it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2bd5d1180a">Two panes; the card and the minicard follow Card Settings' order; menus open inline</a>. Thanks to xet7.</summary>

The opened card and the minicard now draw Card Settings' sections in Card
Settings' order, each section's fields in its rows' order, so dragging a
section or a row there moves it on the card or the minicard; the order is per
side, and a default board's card starts with Labels. Every section of the card
has the same heading, Voting and Planning Poker included. Card Settings shows
the minicard's pane and the card's side by side, each folding and scrolling on
its own, with a splitter between them to change their widths, stacked when
narrow; the Show radio is gone and the corner grip resizes the popup. A
hamburger's content opens under its line instead of in a popup, the hamburger
showing it is open, which replaces the layers of the entry above.
`card-settings-sections-order.e2e.js` and the new node tests pin it.

</details>

and updates the following dependencies:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/120f484a30">Meteor 3.6-rc.1, with WeKan's six Meteor package forks rebased onto it</a>. Thanks to xet7.</summary>

[Meteor 3.6-rc.1](https://forums.meteor.com/t/meteor-3-6-rc-1-rspack-2-x-native-typescript-node-js-26-pnpm-monorepos-instrumentation-pwas-and-a-friendlier-cli/64773/18)
carries the security fixes of Meteor 3.5.3 and 3.5.4. `meteor update
--release 3.6-rc.1` first failed with "No version of shell-server satisfies
all constraints": WeKan's forks of allow-deny, ddp-server, dynamic-import,
facebook-oauth, google-oauth and shell-server in `packages/`, made because
3.6-rc.0 lacked the 3.5.3 fixes, were pinned to rc.0's versions. They were not
deleted, because rc.1 still lacks what is WeKan's own in them: the Admin Panel
/ Problems reports of refused attempts, and the crypto-RNG keys of
dynamic-import and meteor shell (rc.1 still uses `Math.random()`). Each fork
is now rc.1's package with WeKan's changes merged onto it three-way, versioned
rc.1's `_1`. The experimental Bun build's Meteor patch applies unchanged to
rc.1 and is renamed for it; the Dockerfile's `METEOR_RELEASE` follows. See
[Meteor 3.5.3 security fixes](docs/Security/Meteor-3.5.3-Security-Fixes-2026-10-22.md).
`tests/meteor353SecurityFixes.test.cjs` and `meteorForkRandomKeys.test.cjs`
pin the forks, and `meteor-353-security.e2e.js` passes on rc.1.

</details>

and fixes the following bugs:

**The opened card** - its sections show only what the board allows.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a224b3cea">Show empty fields shows no Scrum section the board has turned off</a>. Thanks to jullbo and xet7.</summary>

With Board Settings / Card's "Show empty fields" on (since v12.66), every
opened card showed the "Scrum settings" heading and its sections although
Board Settings / Scrum had none of its fields turned on
([#6830](https://github.com/wekan/wekan/issues/6830)). The Scrum fields are
the card's only sections with no board flag in the template, and the card's
section list asked only whether the card shows the field - which Show empty
fields, Show empty and On this card answer yes. A Scrum section now needs the
board's Scrum visibility first, as Members, Vote and Poker already did; a
turned-on Scrum field is still shown empty.
`tests/scrumSectionsShowEmpty6830.test.cjs` pins the rule and that no other
client code decides a Scrum section by the card alone, and
`card-add-fields.e2e.js` checks the card.

</details>

**Data health** - Admin Panel / Problems' checks of custom fields.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9dc3fc3f31">Custom fields whose boards were all deleted get their own check</a>. Thanks to Raymond-Voogt and xet7.</summary>

"Custom fields listing a board that does not exist" also counted fields whose
boards were ALL deleted, which its Repair skips on purpose, since removing the
dead boards would leave the field on no board. The count could therefore never
go down: one instance showed 510 fields and "Repaired: 0" after every click
([#6829](https://github.com/wekan/wekan/issues/6829)). Those fields now have a
check of their own, "Custom fields whose boards were all deleted", whose
Repair deletes the definitions after the confirming second click. No existing
board shows them; a value a card on a live board still holds is left alone and
stays listed under "Cards with values for a custom field that is not on their
board". The old check counts only fields with a live board left, so its Repair
brings it to zero. `tests/dataHealth6818.test.cjs` pins both checks, the
confirmation, and that live fields and card values are not touched.

</details>

and fixes the following translation:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/81e6988491">Southern Sotho: dikarolo, not masimo, for data fields</a>. Thanks to xet7.</summary>

**Languages updated:** Southern Sotho.

Three Southern Sotho strings called a data field "masimo", which means farm
fields: Show empty fields, the fields of a cron schedule, and the webhook's
optional fields. They now use "dikarolo", the word the file already uses for
card and custom fields. `sesotho-popup-titles.e2e.js` caught the first; the
other two are low confidence.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.67 2026-10-28 WeKan ® release

**In short:** a list's **Add card** form closes once the card is added, unless
**Member Settings** keeps it open for the next one. And the v12.66 release build
is whole again: the **emulated-CPU Linux bundles** and **win32**, **FreeBSD**,
**OpenBSD**, the **Mac app**, the **Sandstorm** .spk, the **Ondra** and **Gantt
GPL** snaps and the **Bun** bundles had failed to build or to start - most
because build scripts had moved their files into `.tools/` and some callers had
not.

This release adds the following new features:

**Add card** - a list's form for new cards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/70de255333">The form closes after the card is added, unless Member Settings keeps it open</a>. Thanks to brlin-tw and xet7.</summary>

The form stayed open after every card for the next one, which
[#6827](https://github.com/wekan/wekan/issues/6827) found unexpected. It now
closes once the card - or every card of a multi-line paste - is added. Member
Settings / Change Settings has a new switch, **Keep the Add card form open
after adding a card**, off by default, for typing several cards in a row. The
form is closed after the last title rather than at submit, because the paste
loop still reads the form between titles, and a failed add keeps the form and
its text. The two new strings are translated into every language, many with
low confidence (listed in the commit). `tests/keepAddCardFormOpen6827.test.cjs`
and `keep-add-card-form-open-6827.e2e.js` pin both settings, a paste and a
failure.

</details>

and fixes the following bugs:

**Linux bundles for emulated CPUs** - armhf, armv6, armv7, i386, ppc64le,
riscv64 and s390x, and win32 built from the i386 one.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/427d212627">The container that installs their Node.js gets .tools/tmp as its /tmp again</a>. Thanks to xet7.</summary>

`install-node-for-arch.sh` refuses to run without `TMPDIR`, because a
container's own `/tmp` is a small part of its writable layer.
`releases/repack-bundle-for-arch.sh` mounts this checkout's `.tools/tmp` there
and sets it; the release workflow's own `docker run` did not, so every
emulated arch stopped at "TMPDIR must be the mounted .tools/tmp" in v12.66,
and win32, which builds from the i386 bundle's Node.js, had nothing to build
with. The step now mounts `.tools/tmp/repack-<arch>-tmp` as `/tmp`.

</details>

**FreeBSD, OpenBSD and the Mac app** - bundles started by `start-wekan.sh`
where there is no `/proc`.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/290e525b46">start-wekan.sh starts WeKan again where there is no /proc</a>. Thanks to xet7.</summary>

Since the macOS shell-script work, the memory budget read `/proc/meminfo` with
no fallback. `awk` fails where there is no `/proc`, and under `set -eu` an
assignment from a failed substitution ends the script without a word - so in
v12.66 the FreeBSD and OpenBSD bundles and the Mac app never started WeKan,
with an empty log. The read has its `|| true` again and `sysctl` gives the
memory. `tests/macosShellPortability.test.cjs` runs those lines under `set
-eu` without `/proc` and requires a number, with the unguarded line as the
negative case, and fails on any `set -e` script whose `/proc` read in `$(...)`
has no fallback.

</details>

**Sandstorm** - the .spk and the meteor-spk toolchain it is packed with.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f68b130f15">meteor-spk is assembled where the .spk is packed from, in .tools</a>. Thanks to xet7.</summary>

`sandstorm-src/build-deps.sh` still assembled `meteor-spk.deps` in
`~/projects/meteor-spk`, and the workflows put that on PATH, while
`releases/sandstorm-slim-spk.sh` looked in `.tools/projects/meteor-spk`: "no
meteor-spk.deps", and the v12.66 .spk did not pack. `build-deps.sh` now uses
the same `.tools` directory, as do the Sandstorm, Sandstorm store and
meteor-spk workflows. `tests/toolsDirOnly.test.cjs` scans `sandstorm-src/`
too, and fails on a workflow that names `~/projects`.

</details>

**Snaps** - the Ondra and Gantt GPL variants, built from a copy of the tree.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d24598ce25">A copy of the source tree without .git gets its own .tools/tmp</a>. Thanks to xet7.</summary>

`releases/tools-env.sh` made `.tools/tmp` only in a git checkout, so that
scripts mounted alone into a container do not make a `/.tools` there. The
variant snaps build from a copy without `.git`, so no `TMPDIR` was found and
every `fetch.sh` in `snapcraft.yaml` stopped at "TMPDIR: unbound variable" -
which v12.66 reported as the Caddy download failing. A tree with
`package.json` beside `releases/tools-env.sh` counts as a source tree.
`tests/toolsDirOnly.test.cjs` checks such a copy, and `releases/` alone as the
negative case, where no `.tools/` is made and no `TMPDIR` is invented.

</details>

**Bun bundles** - their Linux smoke tests.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1167cbd3b0">The smoke-test MongoDB starts on a 6.19+ kernel, and Chromium is found</a>. Thanks to xet7.</summary>

linux-x64: `mongo:8` refused to start on the runner's newer kernel ("Linux
kernel versions 6.19 and newer has a known incompatibility"); the smoke test
pins `mongo:9.0.4`, which recognises Ubuntu kernels that have the fix
([Supported databases](docs/Databases/Supported.md)). linux-arm64: Chromium
was installed into `~/.cache/ms-playwright` while the build looked in
`.tools/ms-playwright`; the install step now uses the same path.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bce686ce46">Its guard pins mongo:9.0.4, not the mongo:8 that stopped starting</a>. Thanks to xet7.</summary>

`tests/bunSmokeMongo.test.cjs` required the workflow to run `mongo:8`, the
floating tag that refused to start on the runner's kernel. It now requires
`mongo:9.0.4`, and fails if `mongo:8` comes back.

</details>

and updates the following documentation:

- [WeKan vs Trello vs Jira says when WeKan added each feature it listed as missing](https://github.com/wekan/wekan/commit/cbdff47edb).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.
