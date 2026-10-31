# Status

<details>
<summary>More status info</summary>

https://wekan.fi/status/

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

<details>
<summary>TODO Later</summary>

<details>
<summary>Carried to a future release.</summary>

What is not built yet, checked against the code on 2026-10-17: nothing. The
helpers that need no AI and the whiteboard are built and in the Upcoming
release. New work that cannot be done here is added below by category, with
its reason.

</details>

<details>
<summary>Need the running app to reproduce/verify</summary>

- The browser test fixes of 2026-10-27 are not verified in a browser yet: the
  second EVERYTHING run was stopped during its build, before any browser
  stage. The first run's Chromium stage reached 3212 of 3703 tests, and every
  failure it reported is fixed in the source; Firefox, the database
  conformance runs and FerretDB's own suites did not run. Run `./build.sh`'s
  EVERYTHING option again. The stopped build had started reinstalling
  `node_modules`, so a clean install comes first.
- The WebKit stage cannot run in the Flatpak sandbox: MiniBrowser needs its
  own sandbox, and turning that off is not allowed there. Run it on a host.
- [#6834](https://github.com/wekan/wekan/issues/6834) (the minicard due date is fixed; the board header bar wrapping to a second row and the list header icons under the card count did not reproduce on the current code at the same window width, in Persian, with the card count on - which WeKan release and browser zoom showed them is asked; wrapping the header rather than hiding buttons is by design)

</details>

<details>
<summary>Needs a maintainer decision on the intended contract</summary>

- [#6837](https://github.com/wekan/wekan/issues/6837) (a Simple and an Advanced mode, or profiles an administrator defines and assigns, to hide features from new users: which features each mode or profile shows, who chooses it, and how it relates to the existing per-board Board Settings / Card and Show on Minicard switches and the Admin Panel feature toggles)

</details>

</details>

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

# v12.66 2026-10-28 WeKan ® release

**In short:** two CRITICAL security fixes: **UploadBleed** - attachment uploads
were not authorized at all - and **StampBleed**, and a **FrameBleed** follow-up.
**Card Settings** opens on Card, with **Show empty fields**, a **Show empty**
column, **Select all** / **Select none** and **drag and drop** lists. A card
opened from its link no longer vanishes behind a **reverse proxy**; minicards
show only filled custom fields, lost cards reappear, card numbers stay unique, a
[label] title prefix is opt-in, Problems gets a nightly **Data health** scan,
**database load** on many-pod installations drops, and the **API's JSON
uploads** and the site logo are stored again.

This release fixes the following CRITICAL SECURITY ISSUES:

**Attachments, checklists and text notes** - what a client may put on a card,
and into which board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/51111e1958">An attachment upload is authorized: signed in, and allowed to edit the card or write the board</a>. Thanks to xet7.</summary>

[UploadBleed](https://wekan.fi/hall-of-fame/uploadbleed/): Meteor-Files' upload
pipeline stores an attachment with a server-side insert, past the allow rules,
and its only hook cleaned the file name. Anyone, signed in or not, could put a
file on any card of any board - published to its members with an activity and
notifications - and the admin's switch blocking uploads was skipped too. Every
chunk is authorized on the server now, and a card attachment's board, list and
swimlane are its card's. Attempts are recorded in Admin Panel / Problems;
`tests/uploadBleed.test.cjs` drives the decision and fails on any
FilesCollection whose upload is not checked on the server.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/51111e1958">Nothing inserted on one's own card can carry another board's id or checklist</a>. Thanks to xet7.</summary>

[StampBleed](https://wekan.fi/hall-of-fame/stampbleed/): checklists, checklist
items, text notes and attachments are published by the board id they carry,
which the server kept as the client sent it, while the insert was checked on
the card only - so a document on one's own card could be stamped with a private
board's id, and a checklist item drawn in that board's checklist. The board is
taken from the card on insert
([with the #6813 fix](https://github.com/wekan/wekan/commit/4bd6a7f088)),
and a forged insert is refused and recorded in Admin Panel / Problems. Found
reviewing the contributed patch for
[#6813](https://github.com/wekan/wekan/issues/6813), which would have relied on
the stamp. `tests/stampBleed.test.cjs` fails on any card child without an
insert board check.

</details>

**Earlier fixes, regression audit** - every fixed vulnerability checked again,
and the same mistakes found elsewhere closed.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ebcd02be6f">Siblings of six fixed vulnerabilities closed; every earlier fix is still in place</a>. Thanks to xet7.</summary>

Every Hall of Fame vulnerability without a test naming it was checked against
the current source; none had been reverted. The same mistakes were found again
and closed: [FloppyBleed](https://wekan.fi/hall-of-fame/floppybleed/) - an
upgrade step could copy any server file into an attachment by its stored name;
[FilePathBleed](https://wekan.fi/hall-of-fame/filebleed/) - a top-level
`path` let a client point an attachment at any file to delete or read;
[MoveStorageBleed](https://wekan.fi/hall-of-fame/snowbleed/) - anybody
who could see a board could delete its attachments through validation;
[IntegrationBleed](https://wekan.fi/hall-of-fame/integrationbleed/) - the REST
reads gave webhook URLs to every member;
[AttachmentMigrationBleed](https://wekan.fi/hall-of-fame/snowbleed/) - migration
methods answered about any board;
[LegacyAttachBleed](https://wekan.fi/hall-of-fame/legacyattachbleed/) and
[MimeStorageBleed](https://wekan.fi/hall-of-fame/mimebleed/) - more
script types and handler forms are served safely. Attempts are recorded in
Admin Panel / Problems where they can be attributed. 128 of 137 published
vulnerabilities now have a named regression test
(`tests/securityRegressionCoverage.test.cjs`).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8a1106782">A 304 Not Modified no longer replaces a stored file's own Content-Security-Policy</a>. Thanks to xet7.</summary>

[FrameBleed](https://wekan.fi/hall-of-fame/framebleed/) follow-up, found by the
browser test of SVG attachments: files are served `private, no-cache`, so every
later view revalidates and gets a 304, and a browser updates the stored
response's headers with the 304's. The app-wide `frame-ancestors 'self'` of the
FrameBleed restore therefore replaced a file's own policy - an SVG's
`default-src 'none'` and `sandbox` - from the second view on. The SVG stayed
sanitized, so a layer of defence was lost rather than script allowed. The
framing headers are left off a 304 now; `tests/frameBleed.test.cjs` pins it and
fails on any other handler that sets a CSP for every response. Not recorded in
Problems: it fires on ordinary revalidation, not on an attempt.

</details>

and adds the following new features:

**Board Settings / Card** - the fields every card of a board shows from the
start.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80b936223f">Show when empty: the fields every card of the board shows even while they are empty</a>. Thanks to jullbo and xet7.</summary>

[#6806](https://github.com/wekan/wekan/issues/6806): since an opened card shows
only the fields it has data in, a board where nearly every card gets labels, a
due date and a checklist needed + Add, the section and On this card on each new
card before a field could be filled in. A new column of Board Settings / Card -
and of + Add, the same popup - made a ticked field count like data, on every
card. It became Always show in the next entry.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b54525abbe">Always show, for every field: the description, attachments and comments are its default ticks</a>. Thanks to jullbo and xet7.</summary>

The column is **Always show** and covers every per-card field. The description,
attachments and comments were always shown by a fixed list; now they are the
default of the board's `cardFieldsAlwaysShown`, so a board that never set it
shows them as before, and unticked they are shown when the card has a
description, an attachment or a comment, like any other field. On this card
still hides an always-shown field from one card, and Show on Card off still
hides it from all. It is a board admin's setting.
`tests/cardFieldsAlwaysShown6806.test.cjs` pins the default, unticking the
four, the storage and the column, and fails on any caller that does not pass
the board; `card-add-fields.e2e.js` ticks Due date and unticks Comments in the
browser.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1aa9df6075">Card Settings opens on Card, Show empty fields for the board, and the column is Show empty</a>. Thanks to jullbo and xet7.</summary>

Card Settings opens on its topmost entry, Card - also from + Add, which opened
on the first section of fields. Under the Card pane's title, **Show empty
fields** (the board's `showEmptyCardFields`, off by default): ticked, every card
of the board shows all its fields, the empty ones too, and the Show empty
columns are hidden - by CSS only, so their ticks stay saved and come back as
they were. The Always show column is called **Show empty**, stored as before.
`tests/cardFieldsAlwaysShown6806.test.cjs` and `card-add-fields.e2e.js` cover
it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8a15b514f">Card Settings: Select all and Select none per column, headings aligned with their cells, labels whole</a>. Thanks to xet7.</summary>

Under each column heading of every pane - On this card, Show on Minicard, Show
on Card, Show empty - **Select all** and **Select none** set that column for the
open section's rows at once, for who may change that column; a personal row
(Labels text, List title) is left as it is. The headings drifted left of their
cells and the labels were cut: the heading line had a smaller font, and the
columns are in em. The font is on the headings now, every heading and cell
starts at its column's start, and the popup is up to 1200px wide.
`tests/cardSettingsSelectAllAligned.test.cjs` and `card-add-fields.e2e.js` pin
it, the latter measuring the headings, cells and labels.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37b3c8f599">Card Settings: Ask for a reason matches Show empty fields, and the select buttons match Draggable's</a>. Thanks to xet7.</summary>

Ask for a reason when moving cards was a Font Awesome square a few pixels off
Show empty fields above it; it is the same animated checkbox now, in the same
place, read reactively from the board. Select all and Select none under the
columns' headings were links; they are the Draggable table's buttons, white
text on the theme's colour. `tests/cardSettingsSelectAllAligned.test.cjs` pins
both, and `card-add-fields.e2e.js` measures the checkboxes and compares the
buttons' colours.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8224852de1">Card Settings: a Show on Card and a Show on Minicard list per section, reordered by drag and drop again</a>. Thanks to xet7.</summary>

The order arrows of 2026-10-25 could follow only one side's order, and their
number was the field's place among all of that side's fields: an arrow often
changed the number while nothing visibly moved. Each section has the two lists
again, each in its own order and reordered by drag and drop, as since
2026-10-02 - Show on Card with On this card and Show empty beside each row, and
Show on Minicard. Up and Down on a focused row move it one row in its list.
`tests/cardSettingsCoverage.test.cjs` runs the drop's placement against the
real layout; `settings-drag-reorder.e2e.js` drags both lists.

</details>

**Add card** - what a typed or pasted title becomes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f89c8f8030">[Text] at the start of a new card's title becomes a label only when turned on in Member Settings</a>. Thanks to jullbo and xet7.</summary>

[#6810](https://github.com/wekan/wekan/issues/6810): since #3986 a title starting
with [Text] lost the prefix and got the label Text, created when the board had
none - for everybody, without a hint - so titles pasted from ticket systems and
mails ([EXTERNAL] ...) changed and filled boards with labels. It is a Member
Settings switch now, off by default; who wants #3986's behaviour turns it on.
`tests/titleBracketLabel6810.test.cjs` and `title-bracket-label-6810.e2e.js`
cover both states.

</details>

**Admin Panel / Problems** - what in the database points at nothing, and what
it reads far too much of.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9cf523f9e">Data health: a nightly scan of broken references, with repairs</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6818](https://github.com/wekan/wekan/issues/6818): Problems now lists cards on
a missing or another board's list or swimlane, ghost and duplicate board
members, boards with no active admin, custom field values and boards that no
longer exist, orphan checklist items and dangling subtasks or linked cards. The
scan runs nightly when the CPU is low, claimed so one pod scans at a time. A
repair that moves data runs the same upgrade steps as an upgrade; one that
deletes asks twice and the server refuses it unconfirmed. Repairs use `$pull`
or guarded updates, so a concurrent edit is not lost, and a member dedupe keeps
the admin entry. `tests/dataHealth6818.test.cjs` pins it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b87858baaf">Database: queries without an index and a high read rate are reported</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6826](https://github.com/wekan/wekan/issues/6826): a 10 GB collection scanned
three times per search and an hourly job reading every card were visible only
in MongoDB's own log. The 5-minute database probe now adds
`db.collection-scan`, the "Slow query" lines where a query read a whole
collection of at least 10,000 documents, grouped by collection and the field
names filtered on, never values; and `db.scan-rate`, over 50,000 documents
read per second between two probes. Without the `getLog` privilege, and on
FerretDB, the log check is skipped. Both rows are in
[Storage Requirements](docs/Databases/MongoDB/Storage-Requirements.md);
`tests/databaseHealthScans.test.cjs` pins them.

</details>

and fixes the following bugs:

**Board Settings / Card** - a field ticked Show on Card but empty, and the
Draggable
table's checkboxes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66ee2d12f3">A ticked Draggable checkbox is a checkbox, not a dot</a>. Thanks to mimZD and xet7.</summary>

[#6820](https://github.com/wekan/wekan/issues/6820): the Draggable table
brought its native checkboxes back but kept the 9px 14px padding forms.css
gives every input, so a ticked 16px box left the browser about 2px to draw
in. The WIP limit groups popup and task-list checkboxes in a description had
the same fault. `tests/nativeCheckboxPadding6820.test.cjs` fails on any
stylesheet that brings back a native checkbox with that padding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ccc67ddf68">Show on Card and an empty field: Show empty fields, Show empty or On this card show it</a>. Thanks to mimZD and xet7.</summary>

[#6817](https://github.com/wekan/wekan/issues/6817): on v12.65 a Due date ticked
in Show on Card was not shown on a card without one. Show on Card says what a
card can show; an opened card shows a field when it has data. An empty one is
shown by Card Settings / Card's Show empty fields, the Show empty column, or +
Add / On this card, all in this release.
`tests/showOnCardEmptyField6817.test.cjs`
pins the reporter's board through each.

</details>

**Admin Panel / Attachments** - the Retention page.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6f7d226ca">The Google Cloud Storage key help is shown once</a>. Thanks to xet7.</summary>

A leftover copy of the key's description, from before the English and
translated pairs, showed the same sentence twice under the field.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e998651ea">A storage setting's English description is not shown twice</a>. Thanks to xet7.</summary>

Each storage setting shows its description and menu path in English and in
the user's language, and the English was typed into the template a second
time: in English, and wherever a translation is missing, the same sentence
stood twice. The English comes from en.i18n.json now, and the translation is
shown only when it differs.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2799eb900f">Retention shows readable labels, choice names and the default of an empty variable</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6819](https://github.com/wekan/wekan/issues/6819): the page showed only
variable names, the raw choices, and Default () when a variable was set but
empty, as a Helm chart or docker-compose file does. Fields have translated
labels with the variable name beside them, help lines and choice names, and an
empty variable shows its default. From the reporter's patch;
`tests/attachmentRetentionLabels6819.test.cjs`.

</details>

**Opened card** - a card opened from its link.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7ed3ca7c5c">A card opened from its link stays open when the connection comes back while the page loads</a>. Thanks to brlin-tw and xet7.</summary>

[#6808](https://github.com/wekan/wekan/issues/6808): behind a reverse proxy the
DDP connection can drop and come back while a card's link loads; a
subscription re-run before the resumed login answered with nothing, the card
left Minimongo for a moment, and the close-on-removal of #3114 closed it and
went to the board's address. The window now waits while the subscription,
connection or login is settling, then asks the server - the 'card'
publication's own rule - and closes only on its no. A card really deleted,
archived or moved still closes. `tests/openCardClose6808.test.cjs` pins it and
fails on any close on Minimongo's word alone; the browser test drops and
restores the connection.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/036ac4f56b">A card deleted elsewhere while open also leaves the card's address</a>. Thanks to brlin-tw and xet7.</summary>

The browser test of [#6808](https://github.com/wekan/wekan/issues/6808) found
the other half: when the card window was already gone - the card deleted in
another tab - the check that asks the server ran inside the window's own
autorun, which was stopped with it, so the address stayed on the deleted card.
The check now runs outside the window and also from its teardown, and
`tests/openCardClose6808.test.cjs` pins both.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8f9103c336">It stays visible after Maximize and Minimize, or Collapse</a>. Thanks to xet7.</summary>

The class that keeps the window unpainted until it is placed beside its
minicard was a static class removed by hand. Blaze writes a tag's static
classes again whenever its class attribute changes, so maximizing and
minimizing, or collapsing, left the card open but invisible. It is a reactive
class now, off for good once placed; `tests/cardDetailsPlacement.test.cjs`
fails on a static one.

</details>

**Minicard** - its custom fields.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a24da2a039">Only the custom fields that have a value, as before</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6811](https://github.com/wekan/wekan/issues/6811): the rewrite of the
minicard's sections dropped the check of 2019, so every field a card carries -
also the ones added empty by Automatically on card / Always on card - was drawn
as an empty row. An empty, blank or unset value is not drawn; 0 and an unticked
checkbox are values. The opened card is unchanged. From the reporter's patch;
`tests/minicardFilledCustomFields6811.test.cjs` and its browser test.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f6fd560817">After the upgrade, Show on card custom fields stay on the minicards</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6812](https://github.com/wekan/wekan/issues/6812): custom fields on minicards
became an opt-in Board Settings / Card switch with false written into every
board, so fields marked Show on card vanished from minicards. A once-ever
upgrade step turns the switch on for each board that has such a field; a board
turned off later stays off. From the reporter's patch, with its three tests in
`tests/schemaUpgradeSteps.test.cjs`.

</details>

**Date popups** - Save without picking a day.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f5aab875b">Save without picking a day saves today instead of Invalid date</a>. Thanks to brlin-tw and xet7.</summary>

[#6809](https://github.com/wekan/wekan/issues/6809): a date popup of a card
without that date opens the calendar on today, marks it and names it in the
heading, but its date field was empty, so Save answered Invalid date. The form
starts from today now, and Save saves today at the popup's default time. A
card's own date is kept, and an emptied field is still refused.
`tests/datePickerToday6809.test.cjs` and a browser test.

</details>

**Checklists** - a drag on one's own board, and deleting a checklist.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4bd6a7f088">Dragging a checklist item on one's own board is no longer reported as a cross-board attack</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6813](https://github.com/wekan/wekan/issues/6813): a drag sets cardId and
checklistId to where the item already is, and for a comment-only member or a
Worker their own board is one they cannot write to, so ChecklistBleed's canary
named them as attackers in Admin Panel / Problems. The board the item is on is
no destination now - the board of its source card, which the allow rule decides
on, not the item's own boardId as the reporter's patch read it: insert kept a
boardId the client sent, and a forged one would have let an item onto a victim
card. Checklists, checklist items and text notes take boardId from their card
on insert always. A move to another unwritable board is still denied and
reported. `tests/checklistSameBoardCanary6813.test.cjs` runs the real deny
functions, the forged boardId included.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/742996dcce">Deleting a checklist deletes its items</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6816](https://github.com/wekan/wekan/issues/6816): every way to delete a
checklist - the card, the REST API, a rule - removed only the checklist, and its
items stayed behind pointing nowhere (2335 of them in one production database).
The checklist's items are removed with it now, as deleting a card already
removes its children. Items orphaned before are left for the administrator.
From the reporter's patch; `tests/checklistDeleteItems6816.test.cjs` and a
browser test.

</details>

**Cards** - their numbers, and cards moved to another board long ago.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2908f34e7">Their numbers stay unique: the server checks the number a browser sends</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6815](https://github.com/wekan/wekan/issues/6815): a card added in the browser
brought the number the browser computed from the cards in its view, so with
lazy loading numbers were reissued (842 duplicates in one production database).
The server replaces a number another card on the board has, and raises the
counter to a free one it did not issue - seeding a new counter from the board's
highest number, which the reporter's patch skipped. Existing duplicates are not
renumbered. `tests/cardNumberUnique6815.test.cjs` runs the real hook.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32031c64c4">Moved to another board before #5874, they are shown again</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6814](https://github.com/wekan/wekan/issues/6814): a card moved before the
\#5874 fix could still point at a list of the board it left, and was shown
nowhere (706 such cards in one production database). An upgrade step gives each
its board's first unarchived list, or a Rescued Data list. It runs before
swimlane-structure, so a card left on the old board's swimlane gets one of its
board in the same pass. From the reporter's patch, with three tests in
`tests/schemaUpgradeSteps.test.cjs`.

</details>

**Add card** - the due date hint.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f852cb7032">The due date hint follows the board's switch while the form is open</a>. Thanks to xet7.</summary>

The hint was recomputed only on typing, so turning Due date from title off in
Board Settings / Card left a hint already shown. `tests/titleDueDate.test.cjs`
pins it.

</details>

**Editors** - the first keys typed into a form.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/69a8bae0c6">Text typed right after a form opens is no longer selected and replaced</a>. Thanks to xet7.</summary>

50 ms after an inlined form opens it focuses the field and selects what it
holds, so the first key replaces a title being edited. Text typed in those
50 ms was selected too, and Enter for a new line left only a line break. The
selection is skipped once the field has changed;
`tests/inlinedFormSingleOpen.test.cjs` pins it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c0f408a00">Autofocus no longer takes the keyboard from a field being typed in</a>. Thanks to xet7.</summary>

Whenever a re-render added a field marked autofocus, the last one on the
page was focused and its text selected 50ms later - also while somebody was
typing elsewhere. On the import page that moved the attachment token into the
pasted Jira export, replacing it. Only a field just added is focused now, and
never away from a field being typed in.

</details>

**Board visibility** - the Private and Public choices.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/437da1d9c7">The Private and Public descriptions are shown again</a>. Thanks to xet7.</summary>

The helper handed the translation function over unbound, so it threw and
both descriptions were an empty line in every language since custom
descriptions came to Admin Panel / Settings / Visibility.
`tests/visibilityDesc.test.cjs` fails on any unbound one in the tree.

</details>

**Drawing** - the size of a new drawing.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2929b61c85">A new drawing fills the window it is shown in, also once maximized</a>. Thanks to xet7.</summary>

A new drawing was fitted to the popup before it was maximized and kept that
size. It is refitted whenever its room changes, until it is zoomed or resized
by hand.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb614743fd">Maximized, a drawing takes the window, and opened at the right it is not cut off</a>. Thanks to xet7.</summary>

The refit above was right, but a maximized drawing was still drawn 784px
wide: popup.css kept the older design's 800 x 500 shape and overrode the
drawing's own size. That rule is gone. Opened from the card's menu at the
right of the window, the Drawing popup also grew past the window's edge,
cutting off Save; a movable popup that grows is now kept inside the window.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58751aa339">The Drawing popup is as wide as its drawing, so nothing in it is cut off</a>. Thanks to xet7.</summary>

The fix above was not the whole story: measured in the rebuilt app, the
popup never grew. Every popup is at most 380px wide, the 820px drawing
overflowed inside it and the popup clipped the larger pen sizes and Save. The
Drawing popup is now up to 860px wide, so the rule that keeps a growing popup
inside the window has a size change to act on.

</details>

**Apple Glass Pastel** - muted text on light glass.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9679aaf636">Muted text is darker, readable on every light surface</a>. Thanks to xet7.</summary>

The theme's quiet text, `#6b7280`, was 4.51:1 on `#f7f7f7` and 4.44:1 on the
tinted card header, at or under the 4.5:1 it needs; `#4b5563` is about 7:1.
The opened card and sidebar contrast tests now wait for the theme before they
measure, as the header test does.

</details>

**Linked cards** - the fields a linked card shows.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1f5a7b8220">A linked card shows the fields and member avatars its source card has</a>. Thanks to xet7.</summary>

Which fields a card shows is decided from its data, and a linked card has no
data of its own: members, labels and dates live on the source card. The choice
counted the linked card's own empty fields, so its members' avatars were hidden
after a reload. The data and counts now come from the source card, while the
Show on Card choices stay those of the board the card is opened on.
`tests/linkedCardShownFields.test.cjs` pins it.

</details>

**Search** - board search and Global Search.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c2edd6752">Board search highlights one result at a time</a>. Thanks to xet7.</summary>

Enter steps to the next card found, and each step added its highlight without
removing the previous one, so two cards were marked at once. The previous
highlight is now removed first.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/125e1659f8">Cards with attachments are found again, by has:attachment and by file name</a>. Thanks to xet7.</summary>

Global Search looked attachments up by a top-level `cardId`, but an attachment
records its card in `meta.cardId`, so has:attachment and a file name search
found nothing; has:-attachment and has:-checklist matched the same cards as
their positive forms. Both now read `meta.cardId`, skip deleted attachments and
honour the negation. `tests/searchHasAttachmentPredicate.test.cjs` pins it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dad16609c9">Board search finds the text as typed, not as a regular expression</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6822](https://github.com/wekan/wekan/issues/6822): the sidebar search, the
link-card popup, the list, swimlane and board pickers and the import member
search compiled the typed term as a regular expression, so "C++", "(2026)" or
"[x" threw and showed nothing, and "." matched any character. They match the
text literally now, still ignoring case, like every server-side search; the
Advanced Filter's `/regex/` syntax is unchanged.
`tests/searchLiteralTerm.test.cjs` fails on any client or model file that
compiles a raw term again.

</details>

**Activities** - what a new card records.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f3b211b37">A new issue and a linked card made over REST record "created" once, not twice</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6823](https://github.com/wekan/wekan/issues/6823): Version Control's New issue
and the REST route that creates a linked card inserted through the collection,
whose hook already records the activity, and then recorded it again, so
watchers got two notifications and two emails. The extra calls are gone, and
the hook names the card's author when it runs outside a method, so the REST
card keeps its author. `tests/noDoubleCreateActivity.test.cjs` fails on any
explicit record after a hooked insert.

</details>

**Database load** - background jobs and searches on a large installation with
many pods.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d481bffdfe">The History audit and the position-history cleanup run once per installation</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6821](https://github.com/wekan/wekan/issues/6821): both were per-process
timers, so 24 pods read the whole History 24 times an hour and asked one query
per board membership - 148,660 - 24 times a day to trim nothing. Both are
SyncedCron jobs now, one pod per scheduled time, waiting for a quiet CPU. The
cleanup visits only the user/board pairs over 1000 entries and keeps the same
newest 1000. `tests/positionHistoryCleanup.test.cjs` checks it against the old
result.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2be842351b">Search sessions are indexed, and everybody's stale sessions are removed</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6824](https://github.com/wekan/wekan/issues/6824): every global search and
card report scanned the whole `sessiondata` collection three times, and only
the searching user's own day-old sessions were ever removed - one instance held
4,751 sessions, 10 GB. It has indexes on `{ userId, sessionId }` and
`modifiedAt` now, and sessions older than a day are removed for everybody.
`tests/searchSessionIndexes.test.cjs` pins it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9440d503e">The hourly recurring-card job no longer reads every card</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6825](https://github.com/wekan/wekan/issues/6825): with no index on
`recurrenceInterval`, the job was a full scan - 1.1 million cards, 1.1 s every
hour on one instance. A partial index holds only the cards that recur.
`tests/recurrenceIndex.test.cjs` pins it.

</details>

**Attachments** - files stored by the API, the site logo, and a validated move.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7505a4fef">The API's JSON uploads and copies, and the site logo, are stored again</a>. Thanks to xet7.</summary>

The JSON branches of REST upload, upload-background and copy, their
Meteor-method twins and Admin Panel's site logo upload called
`Attachments.insertAsync`, which Meteor-Files has only on the client, so each
failed with "is not a function". They use `writeAsync` now, whose after-upload
hook also validates the file and moves it to the default or copy storage.
`tests/attachmentApiServerWrite.test.cjs` fails on any server-side
`insertAsync` of a Meteor-Files collection.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3e80af1ac">Validate and move to storage moves the file again</a>. Thanks to xet7.</summary>

The method moved the file by calling `moveAttachmentToStorage` from
`Meteor.defer`, where there is no user, so that method's login check refused
every move. All its checks are made before the defer, so the deferred step moves
the file itself, as the upload path does. `tests/moveStorageBleed.test.cjs`
fails on any deferred or timed callback that calls a Meteor method.

</details>

**REST API** - where a new card goes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c355926767">A new card's list and swimlane must belong to the board in the URL</a>. Thanks to xet7.</summary>

POST cards and POST cards/bulk wrote another board's list or swimlane onto a
new card, which then showed on neither board - the #6572 shape the PUT route
already refuses. Both answer 400 naming the field now, the bulk route per entry.
`tests/restCardPlacement.test.cjs` fails on any REST handler that inserts a
card without the check.

</details>

**Lists** - who sets a WIP limit.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a40c4495d4">A WIP limit is set by a board admin, on every path</a>. Thanks to xet7.</summary>

The WIP limit methods required a board admin, but a member with write access
could still set `wipLimit` with a plain list update or REST PUT. A deny rule and
a REST admin check apply the methods' rule everywhere; title, color and starred
stay with write access. `tests/wipLimitAdminOnly.test.cjs` runs the real deny
rule.

</details>

**Admin Panel / Problems** - AuthBleed attempts, and Data health's wording.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/314c153c9b">AuthBleed attempts are recorded</a>. Thanks to xet7.</summary>

[AuthBleed](https://wekan.fi/hall-of-fame/authbleed/): `copyBoard`, `copyCard`,
`copySwimlane` and `createCardWithDueDate` refused without a trace. A
signed-out caller of any of them, and any refusal of `createCardWithDueDate`,
which no WeKan client calls, is recorded as `authz.copy` now. Membership
refusals of the copy dialogs are not: a template or a stale dialog reaches them
in ordinary use, and a high-severity record would disable that login.
`tests/authBleedCopyMethods.test.cjs` pins both.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/77956c98ed">Data health's "Never" has a key of its own</a>. Thanks to xet7.</summary>

The status line reused List Sync's "never synced" key. `data-health-never-run`
is filled in every locale from that locale's existing translation of the same
English word, and a Transifex translation still replaces it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/35ba67ee69">File status lists every kind of finding, not 500 rows of one</a>. Thanks to xet7.</summary>

The report lists 500 findings and counts the rest, first come first served:
14358 integrity baseline move candidates took every row, and the wrong file
extension a type check is run to find was only a number in the totals. A
kind with fewer rows listed now takes the place of one from the kind with the
most. `tests/fileStatusAudit.test.cjs` pins it.

</details>

and has the following developer-facing changes:

**Tests** - guards and specs that read the wrong thing.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c40503a2b">Three Firefox specs wait for what they test, and drag inside the window</a>. Thanks to xet7.</summary>

The search phrases spec searched before the browser had the setting it had
just written, the Card Settings column spec counted a pane that had not
rendered yet, and the drawing spec dragged a corner handle past the window's
edge, which Firefox does not deliver.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21b2da9ad2">The title heading colour guard reads the heading block itself</a>. Thanks to xet7.</summary>

`tests/boardViewTitleViewer.test.cjs` read from the last comment of
`minicard.css` and `cardDetails.css` to the end of the file, so it passed only
while the rules after the heading sizes set no colour, and failed once the Card
kind check mark of v12.65 was appended with its own. It now reads the heading
block and still fails on a colour there.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2dfdf77c2b">The Card Settings drag and drop spec turns drag handles on for its user</a>. Thanks to xet7.</summary>

The fixture's user has an `id`, not an `_id`, so `setHandles(user._id, ...)`
matched no user and the handle half of `settings-drag-reorder.e2e.js` never had
drag handles on.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8788458a87">The browser specs' boards show every field, as the specs were written for</a>. Thanks to xet7.</summary>

With Show empty fields off by default, a new board hides a card's empty
fields, and the specs that open a card to add a checklist or a date found no
button to click. The seeded board turns Show empty fields on; the Card Settings
spec, which tests the switch itself, turns it off again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/00cf8f0958">The shared-template language specs read the description where it is</a>. Thanks to xet7.</summary>

The Corsican and Southern Sotho specs looked for the description and the hint
inside the scope checkbox list; both are its siblings in `.templates-settings`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6241be9053">The specs add a first checklist with the title line's +, where #6796 put it</a>. Thanks to xet7.</summary>

The bottom add checklist link appears only once a card has a checklist, so
every spec adding a first checklist failed, and 12-checklists skipped its
checks silently.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a4197f228f">The Card Settings specs open the section a row is in, and pick the list by its side</a>. Thanks to xet7.</summary>

The popup draws only the open section's rows, each once per list.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/978af29b33">The language specs read the option values, tabs, addresses and texts the app has</a>. Thanks to xet7.</summary>

Corsican, Haitian, Scottish Gaelic, Latin, Malagasy and Irish specs; a plain
member is not shown the Rules editor at all, and the server still refuses
their rule writes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8f65adff2">Specs follow deliberate changes, and their fake SMTP server waits for its port</a>. Thanks to xet7.</summary>

LinkedWriteBleed over REST is refused and recorded without disabling the
account (#6798); notification intents are seeded recent, past the expiry of
\#6768; an invite mail goes to a running SMTP sink, and a sink waits for a busy
port.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/13d3a74b3f">The S3 settings spec expects both of its translated Save buttons</a>. Thanks to xet7.</summary>

The S3 pane has had two Save buttons since \#6465, one under the Enabled and
Read switches and one after the connection fields; the spec matched one.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a656baea3">The Scrum, Sesotho and drag reorder specs read one list per side, and open the SMTP fields first</a>. Thanks to xet7.</summary>

Card Settings draws each row once per list and leaves the minicard list head
empty; the Date section starts with the fixed Mark as complete row; the SMTP
host field is shown only while email settings are on and SMTP is chosen.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02bb0814c3">linkedWritePolicy and webhookBleed read the code as it is now</a>. Thanks to xet7.</summary>

One sliced up to a line the double-activity fix removed and so read the rest of
the file; the other pinned copyBoard's signed-out refusal as one line, which now
records an AuthBleed attempt first. Both keep their assertions.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8d7b01334">The Card Settings both-sides and Scrum title specs follow the current Card Settings</a>. Thanks to xet7.</summary>

Six rows have no minicard side by design, which one spec read as missing; the
other read the pane title before Card Settings, which opens on Card now, had
switched to Scrum. Both failed in the Chromium stage of a full run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cbf9d2f843">The UploadBleed and StampBleed specs do the legitimate case first, and check the block</a>. Thanks to xet7.</summary>

The attempt came first, and a signed-in account that attempts a
vulnerability is blocked and signed out - so the legitimate upload and
checklist that followed ran signed out and were refused. Each spec now does
the legitimate case first and checks that the attempt blocked the account.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f72fcd7f9">The Move and Copy Card helpers wait for the destination picker before reading it</a>. Thanks to xet7.</summary>

Asked while the popup was still rendering, the helper saw no boards select
and moved the card within its own board; #6793's Move Card spec then waited
for a board change that never came.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9549388dd0">The smaller font preset is measured on the Card Settings heading text</a>. Thanks to xet7.</summary>

The headings' smaller font was moved from their line to their text, so the
em-sized columns stay aligned with their cells; the spec still measured the
line.

</details>


**.tools/ and the editor sandboxes** - every file the scripts write stays in the
checkout, and VSCodium can be confined to it on Linux, macOS and Windows.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aeff4900df">Every file the scripts write stays in .tools/: temporary files, downloads, Meteor, Node.js, npm</a>. Thanks to xet7.</summary>

They wrote to `/tmp`, `/var/folders`, `~/Downloads` or `~/Lataukset`,
`~/.meteor`, `~/.nvm`, `~/.npm`, `/usr/local` and into `~/.zshrc`. Now
`releases/tools-env.sh` keeps temporary files, downloads, release zips,
Meteor, Node.js, the npm cache and Go in `.tools/`, and puts those tools on
`PATH` without touching a shell rc file. Every `mktemp` names `.tools/tmp`,
because macOS's ignores `TMPDIR` otherwise. Containers get `.tools/tmp` as
their `/tmp`, verified with MariaDB's temporary tables.
`tests/toolsDirOnly.test.cjs` keeps it so.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e79ec61bcc">build.bat and the releases\ batch files keep every file in .tools\ too</a>. Thanks to xet7.</summary>

`releases\tools-env.bat` does on Windows what `tools-env.sh` does, and
`build.bat` unpacks the Dockerfile's Node.js from nodejs.org's zip into
`.tools`, verified against `SHASUMS256.txt`, instead of a system-wide
Chocolatey install. Meteor goes into `.tools\.meteor`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/42ed50413f">macOS: VSCodium under sandbox-exec, reaching only ~/Documents/repos/wekan</a>. Thanks to xet7.</summary>

The macOS counterpart of the Linux Flatpak sandbox:
`docs/Security/Sandboxes/macOS/sandbox.sh` refuses the home directory,
`~/.ssh`, other users and other disks, and opens only the checkout.
VSCodium's settings, `HOME` and temporary files are kept in `.tools`.
Verified on macOS 27 with VSCodium running inside. The README explains the
design, including why Chromium's own sandbox is off.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6ac70c4cdd">Windows: VSCodium in Windows Sandbox, seeing only Downloads\repos\wekan</a>. Thanks to xet7.</summary>

`docs/Security/Sandboxes/Windows/sandbox.bat` starts a disposable Hyper-V
Windows Sandbox in which the checkout is the only mapped folder. VSCodium
and PortableGit are downloaded once into `.tools`, each verified before it
is unpacked. Not run on Windows yet; the README says what to check.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8af1e8aec8">mirror.sh uses the WeKan checkout as the source, not a second clone</a>. Thanks to xet7.</summary>

Syncing wekan/wekan cloned all of GitHub's 500 MB into
`.tools/wekan-github`, although that is this checkout. The source's
branches and tags are fetched into it under a private namespace instead,
which took 1.7 seconds, and deleted after the push. Only the destination
mirrors are cloned.

</details>

**Helm chart** - the chart's settings reference and its memory.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9994e82bae">values.yaml's settings reference is generated from docker-compose.yml</a>. Thanks to xet7.</summary>

Copied by hand once, the chart's commented reference of every WeKan setting
had fallen 74 settings behind. `releases/charts-values-reference.mjs`
regenerates it, `release-charts.sh` runs it on every chart release, and a
comment after a value no longer becomes part of it. In wekan/charts the
WeKan pod now requests 512 MiB and is limited to 2 GiB, as #6606 had asked:
the old 1 GiB gave a heap WeKan crash-looped in.

</details>

**macOS** - the scripts and tests, run on a Mac with bash 3.2 and BSD tools.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96ad680cd4">The release scripts find the checkout on every system</a>. Thanks to xet7.</summary>

They hard-coded Linux's `~/repos/wekan`, so on a Mac, where the checkout is
`~/Documents/repos/wekan`, they changed into nothing or a stale copy. Each finds
the checkout from its own location now, and the download folder is `Lataukset`
only where it exists. `tests/repoLocationPerOs.test.cjs` pins the three places.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9927adcb44">Companion repositories are read from .tools/ only, never from ../w/</a>. Thanks to xet7.</summary>

The Hall of Fame tests, the Helm chart scripts and the Docker cleanup still fell
back to an old `../w/` beside the repository; a stale `../w/wekan.fi` failed a
test with markup the site no longer has. `tests/noLegacySiblingRepos.test.cjs`
keeps `../w/` from coming back.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/283e51eac0">The root and releases/ shell scripts run on macOS too</a>. Thanks to xet7.</summary>

Every script was checked with macOS's bash 3.2 and for GNU-only options: an
associative array, an empty array under `set -u`, a broken `find-replace.sh`,
`sha256sum`, `nproc`, GNU `sed -i`, `ln -sfT`, `stat -c` and `ip` each have a
portable form or a fallback. `tests/macosShellPortability.test.cjs` parses every
bash script with bash 3.2 and fails when one of these shapes comes back.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa1bb293f9">The UCS migration hook locks without flock, and the Nextcloud package is packed without GNU tar</a>. Thanks to xet7.</summary>

Without `flock` the UCS hook takes the same lock with perl's `flock()` on its
file descriptor. `releases/nextcloud-pack.sh` packs the ExApp under its app id
with options GNU tar and bsdtar share, and keeps macOS's `._*` files out;
the release workflow and its test use it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1f9ada5599">No /proc: conformance runs keep each other's containers, and the start scripts see the real memory</a>. Thanks to xet7.</summary>

On a Mac `db-conformance.sh` saw every live run as dead and removed its
containers; it reads the command line with `ps` there. `start-wekan.sh` and the
bundle's start script assumed 2 GiB and now ask `sysctl`, and the speed monitor
shows the load average.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/43e09631c4">A Node.js without single executable applications is named, not run</a>. Thanks to xet7.</summary>

Homebrew's Node.js is built without them, and the single-file build stopped with
a bare exit 9. It says what to do now, and its tests skip that build and expect
the host's own arch rather than x64.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0ed8fb20f2">strip-node.sh is exercised on a real Mach-O</a>. Thanks to xet7.</summary>

On a Mac the ELF fixture is a Mach-O, so those cases skip, and a new case checks
that the local symbols go, the exported one stays and the binary is re-signed
and runs.

</details>

and updates the following documentation:

- [Show empty fields of Card Settings, the \[label\] title switch of Member Settings, and Data health repairs](https://github.com/wekan/wekan/commit/30e960e129).
  Thanks to xet7.

and updates the following translations:

**Languages updated:** 232 languages.

**Board Settings / Card** - the Show empty and Show empty fields headings.

- [Show empty and Show empty fields in every language](https://github.com/wekan/wekan/commit/1aa9df6075).
  Thanks to xet7.

**Member Settings** - the [label] switch of Add card.

- [Turn \[label\] at the start of a new card title into a label, in every language](https://github.com/wekan/wekan/commit/f89c8f8030).
  Thanks to xet7.
- [Tigre and Tsonga wording of the switch](https://github.com/wekan/wekan/commit/595e26cfa8).
  Thanks to xet7.

**Admin Panel / Attachments** - the Retention help line.

- [Tigre card noun in the Retention help line](https://github.com/wekan/wekan/commit/c7145402af).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.65 2026-10-25 WeKan ® release

**In short:** an **opened card** shows only the fields it has, with **+ Add**
for the rest. **Drawing** works with a pen on the whole window - from Add Card
and Add attachment, saved as SVG, with an eraser, palm rejection and a lasso
that moves, resizes, groups and layers lines - and **SVG** is an image again,
sanitized whole at any size, streaming, on upload and on every serve.
**FerretDB** answers WeKan's queries in the database on every backend, and
**SQLite** stores documents as JSONB. **Right-to-left** checkboxes and list
resizing are fixed.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a90576bafa">The speed test report escapes a backslash before the pipe in a table cell</a>. Thanks to GitHub CodeQL and xet7.</summary>

CodeQL alerts #593, #594 and #595 (`js/incomplete-sanitization`):
`docs/Databases/FerretDB/1/SpeedTest/report.cjs` escaped `|` as `\|` in
Markdown table cells but not a backslash, so a value ending in one turned the
added backslash into a literal one and its pipe split the cell. One `mdCell()`
escapes the backslash first, then the pipe, and a line break becomes a space;
the database's name and the query's title now go through it too.
`tests/speedTestReportCells.test.cjs` checks that no value can add a column to
its row, and that nothing in the tree escapes a pipe without the backslash. The
report is built from local results, so there is no attempt to record in
Admin Panel / Problems.

</details>

and adds the following new features:

**Opened card** - only the fields a card has, and "+ Add" for the rest.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6fe0a7ef94">An opened card shows only the fields it has data in, and + Add under the cover adds the rest</a>. Thanks to xet7.</summary>

An opened card shows the fields it has data in, plus its description,
attachments and comments - empty or not - and its cover when it has one.
"+ Add", under the cover, opens the Admin Panel's own left menu and pane: the
sections (Date, Members, Scrum settings, ...) on the left, their fields from
Board Settings / Card on the right, each with a checkbox that shows or hides
the field on this card. Board Settings / Card still decides what a card can
show. The design is
[Card fields](https://github.com/wekan/wekan/blob/main/docs/Features/Cards/Card-Fields.md);
`tests/cardShownFields.test.cjs` and
`tests/playwright/specs/card-add-fields.e2e.js` cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4f528159b">Cover on by default, a new drawing is the cover, no empty Similar cards or Custom Fields, and a better + Add popup</a>. Thanks to xet7.</summary>

The opened card's cover image is on by default; a once-ever upgrade step turns
it on for boards created while it was opt-in, and a board turned off later
stays off. A new drawing becomes the card's cover. There is one separator line
under "+ Add": the Sort group drew its rule for fields the card did not show.
Similar cards and Custom Fields are shown only when there is something in
them. The "+ Add" popup moves by its title bar (the drag handle of every
movable popup is shown only while drag handles are on), maximizes, is wide
and high enough for its labels and menu, and only a clicked checkbox animates.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d80b07bed">A maximized card has its comments in the right column</a>. Thanks to xet7.</summary>

The comments section is its own template, in the left column of the opened
card and, when the card is maximized, at the top of the right one beside the
fields.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/20e2273c07">Board Settings / Card and + Add are one popup, with sections in a left menu</a>. Thanks to xet7.</summary>

Board Settings / Card is the Admin Panel's left menu and pane, and the opened
card's "+ Add" opens the same popup for that card. Every row is in one section;
each line has, in reading order, On this card (from a card), Show on Minicard,
Show on Card and the field, each side with its checkbox, its position and up
and down arrows. A row's name leaves out its section's ("Sprint", not "Scrum
settings: Sprint"). "On this card" is new in every language.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f20f24201">Five card actions are in the hamburger of the section they act on</a>. Thanks to xet7.</summary>

They left the card's actions menu: on the opened card each is in the hamburger
of the section it acts on - the Scrum fields the card shows are one Scrum
settings section with Card kind in its hamburger - and in Card Settings they
are at the top of that section's pane. `tests/cardSectionActions.test.cjs`
fails for a hamburger whose items are not in Card Settings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/65621f44cc">The card actions menu in a new order, as one list</a>. Thanks to xet7.</summary>

Move Card, Copy Card, Save as Template, Copy Template to Many Cards, Card
recurrence, Move to Top, Move to Bottom, Watch, Star; Set color, Drawing; Copy
link to clipboard, Link to board, QR code, History, Export, Import, Move Card to
Archive, More. Each item keeps the permission it had.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c69f3fe25a">Card Settings: Card first, Subtasks and Planning Poker sections, settings in their pane</a>. Thanks to xet7.</summary>

The first entry is Card, with the move-reason question, Draggable and the
card's own rows. Subtask settings, Edit custom fields, Change spent time, Card
kind, Edit voting and Edit Planning Poker are forms at the top of their pane
instead of popups; saved there, Card Settings stays open.

</details>

- [Card Settings: the pane's columns line up, and an inline form's buttons no longer push the rows aside](https://github.com/wekan/wekan/commit/ede0d68b27).
  Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f33987931f">Card Settings / Custom Fields: Create Field and Link fields are forms in the pane</a>. Thanks to xet7.</summary>

Under Edit custom fields, the pane has the two forms its buttons opened: Create
Field (also from Board Settings, for a board admin) and Link fields to another
card. A field saved there empties the form for the next one and Card Settings
stays open; opened as their own popup they step back when saved, as before.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca53019d96">Card kind shows which kind is selected</a>. Thanks to xet7.</summary>

In Card Settings / Scrum settings and in the Card kind popup the selected kind
has a check mark at the end of its line and is bold, and the list is a
radiogroup with `aria-checked`. Before, it only had an `is-active` class that
nothing styled. `tests/cardKinds.test.cjs` pins the mark on each kind.

</details>

**Drawing** - handwriting and sketching on a card, with a pen too
([#6802](https://github.com/wekan/wekan/issues/6802)).

<details>
<summary><a href="https://github.com/wekan/wekan/commit/54726264d3">A new drawing from Add Card and Add attachment, on the whole window, saved as SVG</a>. Thanks to mimZD and xet7.</summary>

Add attachment / Drawing, and Add Card's new Drawing button - shown while the
composer adds one card: the card is added, opened and drawn on - open a new
drawing on the whole window, saved as an SVG attachment of the card, its lines
kept for editing. The eraser takes away the lines it touches, and palm rejection
keeps a hand resting on a tablet from drawing once a pen has. A lasso tool is
not part of it. `tests/cardDrawingPen.test.cjs` and
`tests/playwright/specs/card-drawing-pen.e2e.js`; described in
[Drawing.md](docs/Features/Cards/Drawing.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c11976a2e1">The Drawing popup moves by its title bar or a drag handle, and maximizes</a>. Thanks to mimZD and xet7.</summary>

Like the opened card: dragged by its title bar or the handle beside it, with the
card's maximize / minimize button. Minimizing puts it back where it was, a
maximized popup stays put, the drawing keeps its shape so the pen lands under
the
pointer, and a popup left maximized opens maximized again. Drag to move,
Maximize
and Minimize are in every language.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4bea319239">Board Settings / Card calls the Whiteboard row Drawing</a>. Thanks to mimZD and xet7.</summary>

The row that shows or hides the Drawing popup's Open as whiteboard button is
named after the card menu's Drawing, with its existing translations.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c26e1bcd0">A lasso selects lines to move, resize, group and ungroup, and to change their layer</a>. Thanks to mimZD and xet7.</summary>

Issue #6802 suggested a lasso for selecting and moving things. A loop drawn with
it
selects every line wholly inside, and a grouped line brings its whole group.
The selection moves from inside its box, stopping at the edge; resizes from
its corner handle, line widths to the nearest allowed one; groups and
ungroups, the group saved with the drawing; and goes to the front, the back,
or one layer up or down. Undo now steps back through every change.
`tests/cardDrawingLasso.test.cjs` and
`tests/playwright/specs/card-drawing-lasso.e2e.js` cover each step, with
every locale translated.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5d027a6f2">The whole window to draw on, growing from its corner, zoom, any color, and Save above the drawing</a>. Thanks to xet7.</summary>

The drawing area takes all the room the popup has instead of a fixed 800 x 500:
a handle at its corner makes it larger, or smaller without cutting a line, and
the magnifier zooms it. Clicking a color opens a color wheel, a brightness
slider and the HTML color code; custom colors are added to the palette, and
the eyedropper picks a color from the screen (or the drawing). Save is above
the drawing, and Add Card's Drawing is in Search / Template / Drawing / More
options. `tests/cardDrawingCanvasColors.test.cjs` and
`tests/playwright/specs/card-drawing-canvas.e2e.js` cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91c12ebcce">Custom colors are kept with the account when signed in, in the browser otherwise</a>. Thanks to xet7.</summary>

The custom colors added to the palette are stored in the user's profile
(`profile.drawingColors`, the `setDrawingColors` method), so they follow the
user to every browser. Only `#rrggbb` codes are stored, each once, at most 16,
and nobody who is not signed in can store any. Drawing on a public board
without signing in keeps them in that browser.

</details>

**SVG images** - an image like any other again, made safe where it is served.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0afb1336db">SVG is uploaded and shown as an image: an attachment, a cover, a board background, an avatar</a>. Thanks to xet7.</summary>

SVG uploads were refused, and every SVG served as a download, after
JVN#74210258. Every uploaded SVG was already sanitized before it is stored - no
script, event handler, `javascript:` URI, `foreignObject` or XML loop - so they
are allowed again. Every route that serves a file now sanitizes an SVG whole
again before sending it, under a Content-Security-Policy with no script and
`sandbox`, so it runs nothing even opened directly. Removed active markup is
logged to Admin Panel / Problems.
`tests/svgServing.test.cjs` also fails when a serving route skips this, and
`tests/playwright/specs/svg-attachment.e2e.js` uploads one and uses it as a
cover and a board background.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e748559838">An SVG of any size is sanitized whole, streaming, on upload, on validation and when served</a>. Thanks to xet7.</summary>

The sanitizer was a set of regular expressions over the whole file: it read
the file into memory, missed an entity-encoded `&#106;avascript:`, saw nothing
in UTF-16, and the serve path sent anything over 8 MB as an unsanitized
download while validation rejected every SVG over its 1 MB scan. A streaming
tokenizer, `models/lib/svgSanitizer.js`, replaces it everywhere: script,
foreignObject, iframe/object/embed, SMIL set/animate, event handlers,
script URIs after decoding references, dangerous CSS, DOCTYPE/ENTITY and
processing instructions are removed wherever they are, however the file is
split into chunks. `tests/svgSanitizerStreaming.test.cjs` splits a hostile SVG
at every byte offset, and sanitizes a 132 MB file with payloads at the start,
middle and end in about 3 s with 38 MB of memory.

</details>

and has the following database speed improvements:

**FerretDB** - WeKan's queries answered in the database instead of in Go, on
every database FerretDB supports; measured with the speed test in
[docs/Databases/FerretDB/1/SpeedTest](docs/Databases/FerretDB/1/SpeedTest).

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/ea7951d7">SQLite stores documents as SQLite JSONB, and an existing database is converted once</a>. Thanks to xet7.</summary>

Every filter, sort key, index and multikey trigger parsed a document's JSON text
again. Documents are now kept in SQLite's binary JSONB and turned back into the
same text in Go ([the reader](https://github.com/wekan/FerretDB/commit/6e725c9b)). On 61,507 cards due cards went
from 1,003 to 519 ms, All Boards from 95 to 42 ms, search from 12.6 to 5.2 ms
and creating the 44 indexes from 107 to 70 s; nothing got slower.

**At the first start with this FerretDB, an existing SQLite database is
converted**, table by table, each in one transaction: 204,212 documents took
81 s, and the file grows until SQLite reuses the freed pages. A table whose
conversion fails stays text and keeps working. **After it, an older WeKan or
FerretDB cannot read the database**, so take a backup before upgrading if a
downgrade may be needed.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/5be94bb7">PostgreSQL answers $and, $or and $elemMatch, and membership tests through a GIN index</a>. Thanks to xet7.</summary>

[An array's GIN index](https://github.com/wekan/FerretDB/commit/9c06c788) answers `members.userId`, [a top-level
`$and`](https://github.com/wekan/FerretDB/commit/555273c1) no longer reads the whole table, and an `$or` and an
`$elemMatch` are conditions in the database. All Boards count went from 8-9 s to
11 ms for a typical user on twice the production data, and due cards from 2,031
to 815 ms on 61,507 cards.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/dbc7d65d">MySQL and MariaDB use their indexes, and adding them takes minutes instead of tens of minutes</a>. Thanks to xet7.</summary>

A card by `_id` went from 3.4 s to 1.8 ms on MySQL, and adding the 44 indexes
from
20 minutes to 3. [Multikey side tables](https://github.com/wekan/FerretDB/commit/a2caced7) answer membership tests,
[an `$or` of `_id` sets is one `UNION ALL`](https://github.com/wekan/FerretDB/commit/c7b0a1c8) - All Boards with a
starred board 900 ms to 6 ms on MySQL and 5.7 s to 7 ms on MariaDB - and
[`$and`, `$or`, `$elemMatch` and a long `$in`](https://github.com/wekan/FerretDB/commit/df43d76d) are answered in the
database: due cards 1,957 to 750 ms on MySQL. MariaDB, whose JSON is text,
keeps what an index answers.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/19311038">SQLite sorts in the database</a>. Thanks to xet7.</summary>

A sorted query no longer reads and keeps every match in Go to return a few: the
ten newest of 30,000 users allocate 2.6 MB instead of 264 MB, and the first
batch of an unlimited sort comes 30% sooner ([each key read once](https://github.com/wekan/FerretDB/commit/34b02dbe)).

</details>

and updates the following dependencies:

- **fast-uri 3.1.8 → 3.1.9** and **undici 7.30.0 → 7.30.1** — [the npm
  group](https://github.com/wekan/wekan/pull/6804).
- **actions/setup-python 7.0.0 → 7.1.0** — [in
  bun.yml](https://github.com/wekan/wekan/pull/6803).

Thanks to dependabot.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31332bfed4">@azure/msal-node 6.0.1 → 7.1.1 by an npm override, for GHSA-xcx6-jx8p-x3h5</a>. Thanks to xet7.</summary>

`npm audit` reported two high severity issues: msal-node below 7.1.0 may
disclose authorization code flow parameters to an attacker-controlled endpoint
([GHSA-xcx6-jx8p-x3h5](https://github.com/advisories/GHSA-xcx6-jx8p-x3h5)). It
comes through the Azure Blob storage adapter's `@azure/identity`, whose newest
release still asks for msal-node 6, so `npm audit fix --force` changed nothing.
`package.json` overrides it; 7's only breaking change is one `@azure/identity`
does not use, and a token request still reaches Microsoft Entra. WeKan's Azure
Blob storage signs in with `DefaultAzureCredential`, not the authorization code
flow. `npm audit` finds 0 vulnerabilities, and `tests/msalNodeAdvisory.test.cjs`
fails if a vulnerable copy is locked again.

</details>

and fixes the following bugs:

**Right-to-left languages** - checkboxes and list resizing work the way they do
left-to-right.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6bb926af19">A checked checkbox sits on its own square, not beside it</a>. Thanks to mimZD and xet7.</summary>

[#6786](https://github.com/wekan/wekan/issues/6786): after its first fix the tick
was a check mark right-to-left, but it was still placed with
`inset-inline-start`/`margin-inline-end`, which a right-to-left page flips: the
narrowed, rotated box started at the square's right edge and was pushed further
right, outside its box. It is placed with `left`/`margin-right` now, like its
borders, so it lands on the square in the same place as left-to-right and the
label does not move; the import page keeps its label gap on the reading side.
`tests/rtlCheckMark.test.cjs` fails on any tick placed logically, and the
Playwright spec measures the tick on its square in both directions.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80208a7141">Resizing a list follows the pointer instead of moving the other way</a>. Thanks to mimZD and xet7.</summary>

[#6801](https://github.com/wekan/wekan/issues/6801): a list's resize handle is on
its inline end, which is its left edge right-to-left, but the new width was the
start width plus the pointer's movement - so dragging the handle out of the list
narrowed it and dragging it in widened it. The movement is now counted with the
list's own direction, as the board sidebar and the left menus already did.
`tests/rtlListResize.test.cjs` pins it and fails when any width resizer does not
flip right-to-left; a Playwright spec drags the handle out and back in, in both
directions.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37024aa9f9">The comment form's avatar is inside the card</a>. Thanks to mimZD and xet7.</summary>

[#6805](https://github.com/wekan/wekan/issues/6805): the comment form kept 38px
free for the writer's avatar with a physical left margin, but drew the avatar at
the reading start, so right-to-left it was outside the card. The room is
`margin-inline` now, and the other margins of the comments are logical too.
`tests/commentFormRtl6805.test.cjs` fails on any left- or right-only margin or
padding in `comments.css`.

</details>

**Notifications** - what the server log says when one is not delivered.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf7520f972">A notification that is not delivered says which check failed</a>. Thanks to xet7.</summary>

"Activity notification delivery incomplete; pending intent retained" filled
the server log, one line for nearly every activity, and never said why: the
error was dropped. That line, and the recovery and cleanup ones, now carry the
failure's code, such as `activity-notification-intent-invalid` or `sync-busy`.
Any other error gives only its name and code, never its message, which can
contain an address or a card title. `tests/notificationFailureReason.test.cjs`
fails when a notification failure line drops its reason again.

</details>

and has the following developer-facing changes:

**Database tests** - the conformance catalogue and the speed test.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9fa734853">Conformance checks indexed equality, array membership and mixed-type sorting</a>. Thanks to xet7.</summary>

Three cases for what FerretDB now answers from indexes or in the database: an
equality or `$in` on an indexed field (inside an array, a value differing only
by case, special characters, numbers, a long string), membership in an indexed
array of documents in every shape the array can take and after writes, and a
sort over every simple type with ties, null and missing fields, with and
without a limit, then with an array and a document among the values.
[A later commit](https://github.com/wekan/wekan/commit/494cbee598) adds both
inside an `$and`, as the due cards query sends them. SQLite, PostgreSQL, MySQL
and MariaDB answer all 114 cases as MongoDB 8 does.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18878f6f29">Conformance checks the $or, $elemMatch and long $in shapes FerretDB now answers in the database</a>. Thanks to xet7.</summary>

The visible boards and the due cards of the `dueCards` publication - an `$or`
of the open permissions and a membership `$elemMatch`, and an `$or` of array
fields inside an `$and` - and an `$in` longer than the 32 values FerretDB's
MySQL backend compares with JSON functions, with negatives that must stay in Go.
SQLite, PostgreSQL, MySQL and MariaDB answer all 115 cases as MongoDB 8.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d2b64273b">db-conformance.sh no longer removes the containers of a run that is still going</a>. Thanks to xet7.</summary>

At start it removed every `wekan-conformance-db-*` container and network as
left behind by an interrupted run, including those of a run still in
progress: a speed test beside a conformance run lost its MySQL in the middle of
Due Cards ("connection refused") and its MariaDB while loading. Containers and
networks now carry the process id of their run as a label, and one whose run is
alive is kept; one without the label, of a run that ended, or whose process id
now belongs to something else is removed as before.
`tests/dbConformanceStaleContainers.test.cjs` runs the script's own functions
against a fake docker.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e81d17da80">New speed test results for SQLite, PostgreSQL, MySQL and MariaDB</a>. Thanks to xet7.</summary>

The four FerretDB v1 backends again, at twice the production data, after the
MySQL/MariaDB index reads, their multikey side tables, PostgreSQL's GIN
membership index and SQLite sorting in the database; every database returned
the same data as MongoDB. All Boards count went from 8-9 s to 159 ms on
PostgreSQL and from 9.4 s to 1.1 s on MySQL, and adding the 44 indexes takes
172 s on MySQL and 901 s on MariaDB instead of 20 and 40 minutes. The fixes for
the People page on SQLite, All Boards with a starred board on MySQL/MariaDB and
Due Cards' `$and` came after this run.

</details>

**Tests** - guards that had fallen behind a deliberate change.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/132fecbfd8">The import page guard pins the checked tick's physical margins from the first right-to-left fix</a>. Thanks to mimZD and xet7.</summary>

`tests/importPage.test.cjs` still required the checked box's label gap to be
`margin-inline-end`, which the [#6786](https://github.com/wekan/wekan/issues/6786)
fix changed on purpose. It now pins `margin-right` with the right-to-left rule
that moves the gap to the left, and the unchecked box's logical gap.

</details>

and updates the following translations:

**Languages updated:** Romanian, Standard Moroccan Tamazight, Tigre, Urdu.

**Wrong languages** - each locale in the language its tag names.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3dead539b">Romanian, Tamazight and Urdu in their own languages</a>. Thanks to xet7.</summary>

About 160 Romanian values were Italian, with some Spanish and French; about
330 Tamazight values were Arabic, or Kabyle and French in Latin letters, now
in Tifinagh; and most of the Urdu file was English spelled letter by letter in
Urdu script ("منتقل کو توپ" - توپ is a cannon - for Move to Top), now natural
Urdu. Search keywords in these locales are one word, as the query parser reads
them. `tests/wrongLanguageCorrections20261025.test.cjs` pins the languages,
the placeholders and the keywords.

</details>

**Other** - one more translation fix.

- [Tigre: the import size message uses the attested plural for files](https://github.com/wekan/wekan/commit/52bcd74efa).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.64 2026-10-24 WeKan ® release

**In short:** a **database speed test** times the common WeKan queries on every
database WeKan runs on, with twice a production WeKan of data, and checks they
all answer the same; its findings made **FerretDB** several times faster and
stopped MariaDB losing edits. Every platform runs the prebuilt
**ferretdb-sqlite**
FerretDB, the **Sandstorm .spk** carries only what a grain runs, and every build
loads **collection2** before the models.

This release adds the following new features:

**Sandstorm** - a smaller .spk, built from what a grain actually uses.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e413cd4720">The .spk leaves out every login method but Sandstorm's, and FerretDB's other database handlers</a>. Thanks to xet7.</summary>

A grain has one login (Sandstorm's), one database (FerretDB on SQLite) and one
mailbox (the grain's own address), but the .spk carried every login package
WeKan has and a FerretDB with the PostgreSQL, MySQL and SAP HANA handlers.
`releases/sandstorm-slim-spk.sh`, now used by `sandstorm.yml` and
`release-all.yml`, builds with a package profile
(`releases/sandstorm-slim.mjs`) that drops accounts-password, 2FA,
passwordless, lockout, OAuth2/OIDC, CAS, LDAP, SAML and the seven social logins
for that one build. It always trims the bundle for a linux/x64 sockjs grain,
verifies none of those packages got in and packs with `spk pack`.
`sandstorm-src/build-deps.sh` builds FerretDB from source with
`ferretdb_no_postgresql,ferretdb_no_mysql`. Under Sandstorm the Admin Panel
hides the login panes, Database migration, the IMAP/webhook mail settings and
the password fields, and the REST password login answers `sandstorm-sso-only`.
Against wekan-12.63-sandstorm.spk the file is 3.8 MiB (2.1 %) smaller and
unpacks 26.7 MiB smaller. Docker, Snap and the bundles are unchanged. (The
FerretDB source build was replaced by the prebuilt SQLite-only binary, see
FerretDB below.)
`tests/sandstormSlim.test.cjs` and
`tests/playwright/specs/sandstorm-slim.e2e.js` pin it. Design:
[Smaller-wekan-spk.md](docs/Platforms/FOSS/Container/Sandstorm/Smaller-wekan-spk.md).

</details>

**FerretDB** - every platform takes the smaller SQLite-only build, prebuilt.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89da0e5be7">Every platform runs the prebuilt SQLite-only ferretdb-sqlite binary from wekan/FerretDB</a>. Thanks to xet7.</summary>

wekan/FerretDB now releases `ferretdb-sqlite-<arch>` beside `ferretdb-<arch>`:
the same FerretDB with only the SQLite handler, about 5 MB smaller, and also
as the `ferretdb-sqlite` image. `releases/ferretdb-asset.sh` chooses for every
download: the newest release that has `ferretdb-sqlite-<arch>`, and until one
does, the full `ferretdb-<arch>` of the newest release, which has the SQLite
handler too. The log says which one was taken. It verifies the download
against its `.sha256sum` and gives the tag, URL and checksum to the provenance
table. All bundle jobs of `release-all.yml`, `release-all-missing.yml`,
`bsd.yml`, the preflight and the local release bundle use it, so the Docker
images, snap, AppImage, Flatpak, macOS and Windows packages get it too. No
workflow builds FerretDB: the Sandstorm deps download the same binary. The
default `docker-compose.yml` downloads `ferretdb-sqlite-<arch>`
(`FERRETDB_BINARY`); the PostgreSQL, MySQL, MariaDB and SAP HANA compose files
keep the full binary. `tests/ferretdbSqliteAsset.test.cjs` pins it. See
[FerretDB v1](docs/Databases/FerretDB/1/README.md).

</details>

**Databases** - how fast each database answers WeKan, and whether the same.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/70485c38df">A database speed test: the common WeKan queries on every database, twice a production WeKan of data</a>. Thanks to xet7.</summary>

`docs/Databases/FerretDB/1/SpeedTest/speedtest.sh` (build.sh / build.bat ->
Tests -> Database speed test) loads 30,116 users, 92,306 boards, 221,038 lists,
222,546 swimlanes and 615,070 cards - twice a production WeKan, skewed like a
real one - with WeKan's own indexes into SQLite, PostgreSQL, MySQL and MariaDB
through FerretDB v1, MongoDB 6, 7, 8 and 9 and FerretDB 2, one at a time, and
times 18 queries as WeKan builds them. `Results.md` ranks the databases fastest
first, and the run fails when any answer or stored write differs from MongoDB's.
MongoDB 9 was fastest; FerretDB + SQLite, after the FerretDB fixes it led to
(below), came next. The README says what was found, what was improved and what
could still be: sorting in the database, multikey indexes beyond SQLite,
MySQL/MariaDB reads through their index columns, SQLite's JSONB.

</details>

and fixes the following bugs:

**Due Cards** - what the page reads to find them.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c64b3a3b1d">The page reads only the ids and members of the boards it may show</a>. Thanks to xet7.</summary>

The publication fetched every board the user may see - every public board of
the instance among them, whole - to read two fields, and wrapped its board list
in an `$or` that neither MongoDB nor FerretDB could use an index for. It asks
for
`_id` and `members` only, and with no assigned-only board uses a plain `boardId`
list; an assigned-only board still shows only the user's assigned cards. With
FerretDB's fixes, Due Cards on FerretDB + SQLite went from 34 s to 12.8 s on the
speed test. `tests/dbSpeedTest.test.cjs` checks both board scopes.

</details>

**FerretDB 2** - the compose file that runs WeKan on it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9e1e90131">Its compose file starts with the current DocumentDB image</a>. Thanks to xet7.</summary>

`ghcr.io/ferretdb/postgres-documentdb:17` installs `pg_cron`, which may only be
created in the database named `postgres`; with `POSTGRES_DB: ferretdb` the
DocumentDB extension failed to install and the database never started.
`docker-compose-ferretdb-v2-postgresql.yml` uses `postgres` now - found when the
speed test started FerretDB 2 from that file's images.

</details>

**Collections** - which attachSchema the models get.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2699f4deea">Collection2 is loaded before the models, so every write is cleaned and given its defaults</a>. Thanks to xet7.</summary>

Collection2's attachSchema is in its lazy main module, which only
aldeed:schema-index loads, with an async `Collection2.load()`. The models
attached their schemas with whichever attachSchema existed first: collection2's,
or the bare shim in `imports/collectionHelpers.js`, which never cleans a write.
The full build happened to load collection2 first. The smaller Sandstorm build
reached the models sooner, so a new board's swimlane was stored without
`archived`, `sort` and `type`, and the board opened empty. `server/main.js` now
loads `meteor/aldeed:collection2/main` before the models in every build.
Without accounts-password the server also no longer stops on
`Accounts.emailTemplates` (`server/lib/accountsEmailTemplates.js`) or on
useraccounts' "at least one account service". `tests/sandstormSlim.test.cjs`
and the board, list and card test in `sandstorm-slim.e2e.js` pin it.

</details>

and has the following developer-tooling fix:

- [The Sandstorm package-import guard escapes the whole package name in its pattern](https://github.com/wekan/wekan/commit/f1e447dd36). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.63 2026-10-22 WeKan ® release

**In short:** copying a card, linking it to another board or making one from a
**card template** no longer fails when the card carries values of another
board's **custom fields**, and no longer records AdminFieldBleed against the
user who tried.

This release fixes the following bugs:

**Custom fields** - which values a card brings to the board it is copied or
linked to.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63ebdb9072">Copying or linking a card carries only the custom field values of its new board</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6800](https://github.com/wekan/wekan/issues/6800): a card made from a card
template, linked from another board or copied - and each subtask copied with it
- took its whole customFields array along: values of another board's fields,
of deleted fields, and entries with no field id. The admin-only field guard
could not match those to a field of the new board, refused the whole card and
recorded AdminFieldBleed against the user. Copy, subtask copy and link now keep
only values of fields defined on the destination board; an admin-only value of
that board is kept, so the guard still decides it.
`tests/copyForeignCustomFields.test.cjs` fails on the code before the fix.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.62 2026-10-22 WeKan ® release

**In short:** an opened card is **decluttered** - add buttons on their title's
line, a compact attachment list with its upload rules in the upload popup, and
two new **Show on Card** rows for attachment previews and details - and
**Board Settings / Card** spreads into columns to fit the screen, with rows
dragged by handle, icon or label. List moves no longer raise false
**HistoryIntegrity** reports, refused edits no longer **disable accounts**, and
a
restarting database is no longer a **crash**.

This release adds the following new features:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c520ef382">A decluttered opened card, a compact attachment list, and Card Settings that fits the screen</a>. Thanks to mueschel and xet7.</summary>

[#6796](https://github.com/wekan/wekan/issues/6796): an opened card gave most
of its height to controls with nothing in them. A field's add button now sits
on its title's line; Requested and Assigned By put their two buttons side by
side; the checklist controls share a line. Attachments: the upload rules are in
the upload popup instead of above every list, "+" is a small button, a file
with nothing to preview gets a small file button, and the name has a line of
its own. Two new Board Settings / Card / Show on Card rows, **Attachments:
Preview** and **Attachments: Details**, are on by default.

Board Settings / Card is a centred panel as wide (up to 1800px) and tall as
the window, and each list spreads into as many columns as fit, read top to
bottom: on 1920x1080 nothing scrolls. Its rows are dragged by the handle, the
icon or the label with drag handles on, and by the icon or the label with them
off; before, only the handle dragged, and only vertically. A Node test and a
Playwright spec cover the layout, the new rows and every drag case.

</details>

and fixes the following bugs:

**History** - the checksum every change history row carries.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76f9d41bf4">A list move with no swimlane no longer fails its own history checksum</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6797](https://github.com/wekan/wekan/issues/6797): Admin Panel / Problems /
Security showed HistoryIntegrity (critical) 81,833 times. A list bound to no
one swimlane has `swimlaneId: ''`; the legacy history append hashed the row
with '' and stored it through collection2's default clean, which turned it into
null, so every such move failed its own checksum. It now inserts as the
stored-chain path does, and rows already stored that way verify - null for ''
only in the id and label fields, so any real change still fails.
`tests/historyEmptyStringChecksum.test.cjs` fails on the code before the fix.

</details>


**Admin Panel / Problems** - which events disable an account or are reported as
a crash.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/425b4ddea7">An ordinary refused edit on one's own board no longer disables the account</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6798](https://github.com/wekan/wekan/issues/6798): four accounts on one
instance were disabled in three days. A Worker's allowed card move or checklist
tick was first refused by the general card check, which recorded
LinkedWriteBleed (high, blocked) and disabled the Worker; a read-only or
comment-only member whose screen still offered an edit was disabled the same
way. The Worker rules now ask without recording first and record only a change
still refused, and `authz.linked-write` is still recorded but no longer
disables an account. `tests/workerNoSelfBlock.test.cjs` runs both rules from
their source.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f37204b1c3">A MongoDB pod restarting is a lost connection, not a critical crash</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6799](https://github.com/wekan/wekan/issues/6799): while a MongoDB pod
restarted in Kubernetes, its name did not resolve and nine critical CrashBleed
events were recorded although WeKan kept running. `getaddrinfo ENOTFOUND` and
`EAI_AGAIN` for the database's own host (from MONGO_URL and MONGO_OPLOG_URL) are
now a lost connection, transient at startup and at run time - another host
that does not resolve is still not a database problem - and the crash recorder
skips what is transient. `tests/databaseDnsRestart.test.cjs` runs the guards
and the recorder's own listeners.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.61 2026-10-22 WeKan ® release

**In short:** WeKan's npm dependencies move to their newest versions, among
them **Blockly 13.4**, whose new toolbox search is translated into every
language, and **imapflow**, **mailparser**, **pdfjs-dist** and
**isomorphic-git**, which now have tests that run them the way WeKan does. The
**core26 snap** gets the Caddy part the main snap already had, a language saved
as **ca@valencia** shows Valencian, and **Admin Panel / Problems** stops
re-reporting list indexes and calling a lost connection a schema bug.

This release updates the following dependencies:

- [The small npm updates](https://github.com/wekan/wekan/commit/8a00898252):
  `@aws-sdk/*` 3.1155.0, `@fastify/busboy` 3.2.4, `@tweedegolf/sab-adapter-*`,
  `blockly` 13.4.0, `dompurify` 3.4.17, `file-type` 22.2.0, `filesize`
  11.0.28, `i18next` 26.5.4, `meteor-node-stubs` 1.2.32, `wasmagic` 1.0.12,
  and for development `@rspack/core` 2.2.9, `@typescript-eslint/*` 8.72.0 and
  `puppeteer` 25.15.0. Thanks to xet7.
- [imapflow 2.8.0, mailparser 3.12.2, pdfjs-dist 6.4.299, isomorphic-git
  1.44.3 and pretty-ms 10](https://github.com/wekan/wekan/commit/189adaee52),
  each with a test that runs it as WeKan does: the IMAP poller against
  WeKan's fake IMAP server, attachment text search on a PDF, and the GitHub
  wiki import's history reading. Thanks to xet7.
- [vmactions/openbsd-vm 1.4.9 and actions/setup-node v7.1.0](https://github.com/wekan/wekan/commit/92001bcfd9);
  the BSD bundles are still built on OpenBSD 7.8. Thanks to xet7.

and fixes the following bugs:

**Admin Panel / Problems** - what a database message is reported as, and how
often.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/058a2dcbce">List sort indexes are made from key objects, so they are no longer re-created at every start</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6794](https://github.com/wekan/wekan/issues/6794): "Created the missing index
"-modifiedAt" on lists" came back at every start, from every pod. The list
sort options were passed to `ensureIndex` as strings, so lists got indexes on
fields literally named "-modifiedAt", "-title" and "-sort", and the "is it
there already?" check compared a string with an index key object, which never
matched. Startup now ensures one index per sort field and drops the three
stray ones; `ensureIndex` turns a string key into the key it means.
`tests/listSortIndexes.test.cjs` uses the reporter's real index list, runs
`ensureIndex` itself against a fake collection, and fails on any call in the
tree whose key is not an index key object.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9e680d4b2">A lost database connection inside a validation error is a connection problem, not a schema bug</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6795](https://github.com/wekan/wekan/issues/6795): while MongoDB restarted,
"ValidationError: Failed validation Socket 'connect' timed out" was reported as
an empty required field and a WeKan bug, and treated as fatal at startup.
collection2 wraps whatever failed during validation, so the schema rule now
yields to a lost connection, timeout, lock or too many connections in the same
message, and the MongoDB driver's own network, server-selection, pool and
not-primary errors are connection problems. The test runs both startup guards'
own decision on the reported error and on every wrapped transient cause.

</details>

**Snap** - the Caddy reverse proxy part of the core26 snap.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ad5999bc7">The core26 snap gets the fixed Caddy part, and both snaps fall back to Caddy 2.11.7</a>. Thanks to xet7.</summary>

`snapcraft-core26.yaml` still had the Caddy part `snapcraft.yaml` had before
v10.71: the version from `api.github.com`, whose 403 to a busy CI runner ended
the part under pipefail before its 2.8.4 fallback ran; a plain curl with no
retry; and a default Caddyfile that proxied to port 3000, where WeKan does not
listen when Caddy is on. Both snaps build from `snap-src`, so core26 now has
the main snap's part, and both pin 2.11.7 as the fallback.
`tests/releaseSnapArches.test.cjs` read `snapcraft.yaml` only, which is how
the copy was missed; it now checks every `snapcraft*.yaml` and the
Caddyfile's port.

</details>

**Languages** - which language a saved setting selects.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6a37160bc8">A language saved as ca@valencia shows Valencian, not English</a>. Thanks to xet7.</summary>

The Valencian file is `ca@valencia.i18n.json` but its registry tag is
`ca-valencia`, and the resolver treated only `_` as `-`, so a profile saved
as the file's name stayed in English. Both resolvers now compare through one
`normalizeLanguageTag`, and `tests/browserLanguageFallback.test.cjs` requires
every locale file name to resolve to a registry language.

</details>

and has the following translation updates:

**Blockly toolbox search** - the five texts Blockly 13.4 adds, in every
language.

**Languages updated:** 230 languages.

- [Toolbox search, in every locale](https://github.com/wekan/wekan/commit/8a00898252),
  written from each file's own words for "block" and "search", with `%1`
  kept. Corrected while there: Polish "Szukaj blokad" (search for
  blockades) from Blockly's catalog, a stray "(1)" in Arabic, English mixed
  into Odia's "no results", and Telugu's literal `null` that the importer
  had replaced. The commit lists the languages translated with low
  confidence, for a speaker to correct. Thanks to translators and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.60 2026-10-22 WeKan ® release

**In short:** **sanitize-html 2.18.1** fixes a stack overflow that nested
`<iframe>` tags caused in WeKan's import and export sanitizer, and a failed
import or export no longer **disables the account** of whoever ran it unless it
was an attempt. The forked Meteor **dynamic-import** and **meteor shell** keys
come from the crypto RNG.

This release fixes the following CRITICAL SECURITY ISSUES:

**Imports and exports** - what nested `<iframe>` did to the sanitizer, and who
a failure is blamed on.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96ed9ad202">sanitize-html 2.18.1: nested iframes no longer crash imports and exports, or lock out who ran them</a>. Thanks to xet7.</summary>

sanitize-html 2.18.0 re-sanitized the fallback of a discarded `<iframe>` with
no recursion limit
([GHSA-c9rx-x947-fp3h](https://github.com/advisories/GHSA-c9rx-x947-fp3h),
CWE-674). WeKan's server sanitizer (`server/lib/inputSanitizer.js`) discards
every tag, so it took that path: a few kilobytes of nested `<iframe>` threw
`RangeError: Maximum call stack size exceeded` in `secureTransfer`, which
sanitizes every import and export. `secureTransfer` records a throw as a high
"blocked" event naming the user, and that disables the account, so a card
planted with the payload locked out the next member who exported the board.
2.18.1 bounds the recursion and keeps `nestingLimit` across it; it also drops
the `deepmerge` dependency.

[The tests](https://github.com/wekan/wekan/commit/d89bcab8e0):
`tests/sanitizeHtmlNestedIframe.test.cjs` runs WeKan's own `sanitizeInput`
options on three nested-iframe payloads and checks the installed and locked
versions; with 2.18.0 it fails with the same `RangeError`. Its negative test
fails if anything else imports sanitize-html. The Playwright spec exports and
imports a board holding the payload and checks that nobody is locked out.
Nothing is refused, so there is no Admin Panel → Problems key.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/567f99227b">A failed import or export disables an account only when it was an attempt</a>. Thanks to xet7.</summary>

`secureTransfer` recorded every throw as a high "blocked" event naming the
user, and that disables the account - so sanitize-html 2.18.0's crash, or any
other library fault, locked out whoever happened to run the import or export.
The transfer boundary now marks its own refusals (a cycle, a non-plain object,
a size limit), and only those are recorded as blocked: high, and medium for a
size limit, as before. Anything else shows in Admin Panel → Problems as
ImportExportFailure: detected, still naming whose import or export it was, and
never blocking an account.

`tests/transferFailure.test.cjs` drives real boundary refusals and a sanitizer
that throws through the account-blocking decision itself, and fails with the
old `secureTransfer`. It also fails if the boundary throws a plain `Error` or
anything other than `secureTransfer` calls it.

</details>

and fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6efd39a70e">The dynamic-import and meteor shell keys come from the crypto RNG</a>. Thanks to GitHub CodeQL and xet7.</summary>

Alert 591 (js/insecure-randomness, CWE-338), in WeKan's fork of Meteor's
`dynamic-import`: the key that lets a request read the SERVER's dynamic modules
(`?key=` on `/__meteor__/dynamic-import/fetch`) came from `Math.random()`,
whose state can be recovered from earlier outputs, and was compared with
`===`. `meteor shell`'s connection key, which runs code in the server process,
was made and compared the same way. Meteor 3.5.3 and 3.6-rc.0 both have this.

Both now come from `crypto.randomBytes` (160 and 128 bits) and are compared
with `crypto.timingSafeEqual`. `tests/meteorForkRandomKeys.test.cjs` runs both,
and fails on any `Math.random()` in the forks and on a key, secret, token,
nonce, salt, password or code made from `Math.random()` anywhere in the tree. A
wrong key is not recorded in Admin Panel → Problems: another WeKan instance
behind the same load balancer legitimately sends its own.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.59 2026-10-22 WeKan ® release

**In short:** WeKan carries **Meteor 3.5.3's six security fixes** - DDP,
allow/deny, dynamic import, Google and Facebook login, and meteor shell - on
Meteor 3.6-rc.0, which does not have them yet. **Release recovery** no longer
stops on a passing GitHub API error, and **Cancel workflow** is kept able to
stop every release workflow.

This release fixes the following CRITICAL SECURITY ISSUES:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e0189bc53b">Meteor 3.5.3's six security fixes on Meteor 3.6-rc.0</a>. Thanks to Meteor developers, Vext Labs and xet7.</summary>

Meteor published the same six fixes as 3.3.3, 3.4.2 and 3.5.3
([announcement](https://forums.meteor.com/t/meteor-security-releases-3-3-3-3-4-2-and-3-5-3/64836)).
3.6-rc.0, which WeKan runs, does not have them: its tag is behind 3.5.3 by
exactly the 15 security commits. Going back to 3.5.3 would also mean Node.js
24 and Rspack 1, so WeKan carries 3.6-rc.0's `allow-deny`, `ddp-server`,
`dynamic-import`, `facebook-oauth`, `google-oauth` and `shell-server` in
`packages/` with Meteor's 3.5.3 patch applied unchanged:

- DDP: a message named `__proto__`, `toString` or not a string, and an async
  handler that rejected, crashed the server.
- allow/deny: a top-level `__proto__` in an update was missing from the field
  list the validators saw.
- dynamic `import()`: requests are bounded in size (413) and complexity (400).
- Google and Facebook direct-token login: a token issued to another
  application was accepted. Identity now comes from the provider, and a
  Facebook verification error no longer carries the app secret.
- `meteor shell`: its history and compile cache are private.
- Deploy discovery is in `meteor-tool`, which an app cannot replace. WeKan is
  never deployed with `meteor deploy`, and a test keeps it so.

Refused attempts show in Admin Panel → Problems as Meteor DDP, Meteor
allow-deny, Meteor dynamic-import and Meteor OAuth, and none disables an
account. `tests/meteor353SecurityFixes.test.cjs` runs each fix's own code and
searches the tree for the shape of each fault; every check fails on the unfixed
packages, and the suite fails when `.meteor/release` moves on, because a fork
would silently keep 3.6-rc.0's code. The Playwright spec sends each attack to
a running WeKan built with the forks. See
[Meteor 3.5.3 security fixes](docs/Security/Meteor-3.5.3-Security-Fixes-2026-10-22.md).

</details>

and has the following release-tooling fixes:

**Release workflows** - how a release run recovers from GitHub errors, and how
it stops when cancelled.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e304e1948a">Release recovery waits out GitHub API errors instead of dying on one</a>. Thanks to xet7.</summary>

The Recover job of Release All missing died on one HTTP 502 from the GitHub
API while `gh run watch --exit-status` listed the rerun's jobs, so its plan
and every build after it were skipped. `releases/retry-failed-release.py` now
polls `gh run view`, retries up to ten API errors in a row, waits for the new
attempt instead of reading the old attempt's failure, and stops only on the
rerun's own conclusion. `tests/retryFailedRelease.test.py` pins the 502, a
failed rerun, a lasting outage and the stale attempt, and that `gh run watch`
is gone.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94e1749977">Every workflow's jobs that run after a cancel end on their own</a>. Thanks to xet7.</summary>

Cancel workflow does not cancel a job whose `if:` is still true, and
`always()` is true in a cancelled run. `tests/releaseCancelSafeJobs.test.cjs`
checked only `release-all.yml`; it now fails on a job on `always()` in any
workflow that is a reusable-workflow call or has no timeout of 60 minutes or
less. Every such job today is a short report and is bounded. node-patches had
eleven five-hour resume stages called this way, and Cancel workflow did not
stop them.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.58 2026-10-21 WeKan ® release

**In short:** an existing board can be **saved as a board template**, large
**Jira** exports import instead of failing, and **comments** stay with a card
moved to another board. A **GitHub CodeQL** alert in a test is fixed.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e18794fa46">The invite-by-email test escapes the address completely, and a partial escape is found anywhere</a>. Thanks to GitHub CodeQL and xet7.</summary>

Alert 590: the #6788 e2e put the stored address into a `$regex` with only `.`
escaped, so a backslash in the address could cancel the escape. It now uses
escape-string-regexp, the module the server matches addresses with.
`tests/incompleteEscaping.test.cjs` knew only single-character patterns; it now
also reports a character class without a backslash replaced by a backslash
escape, and found this line before it was fixed. It is a test, so nothing is
recorded in Admin Panel → Problems.

</details>

and adds the following new feature:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14a43da557">Board menu / Save as Template turns an existing board into a board template</a>. Thanks to xet7.</summary>

Asked on IRC ([#6792](https://github.com/wekan/wekan/issues/6792)): a board
template could only be built inside the Templates board. Save as Template
copies the board - swimlanes, lists, cards, labels and custom fields - as a
template board, private with the creator as its one member, and adds the linked
card in the user's Templates / Board Templates swimlane that makes it a
template; the copy opens. Board admins only, as Copy Board, and not offered on
a board that already is a template. The entry reuses the card's own "Save as
Template" words. `tests/largeImportAndBoardTemplate.test.cjs` pins the guards
and the linked card, and a Playwright spec saves a board from the menu and
checks a non-admin and a template board are refused.

</details>

and fixes the following bugs:

**Import** - a large file imports instead of failing halfway or with an
internal error.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14a43da557">A Jira export of hundreds of issues imports, and a file too large says so</a>. Thanks to xet7.</summary>

From IRC ([#6792](https://github.com/wekan/wekan/issues/6792)): a Jira import of
25 issues worked and one of 858 failed. The import boundary refused documents
over 250,000 values, and a Jira search export carries some 250 per issue even
without comments, so it stopped at under 1,000 issues. The refusal was a plain
Error, "Internal server error" on the import page. The cap is now four million
values, a file over it is refused as "The file is too large to import at
once", and the import deadline is `WEKAN_IMPORT_TIMEOUT_MS` plus half a second
per record, on the server and in the page's watchdog alike. The test imports
the 858-issue shape that the old cap refused.

</details>

**Moving cards** - what belongs to a card goes with it to another board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/696b5b073f">Comments stay with a card moved to another board, and do not reappear only when it moves back</a>. Thanks to fabiosalles and xet7.</summary>

The board publication finds a board's comments, comment reactions, text notes,
checklists, checklist items and attachments by the board id each row carries
(#6480), but a card that changed board re-homed only its checklists and items.
Its comments were still published to the board it left. Attachments followed
only when the move ran on the server, never for a drag in the browser, and the
REST card move skipped the hooks entirely. Now one list,
`models/lib/cardChildrenBoard.js`, names every such collection, and one helper
re-homes them from the move hook, the REST move and the durable rule move. The
startup schema upgrade step `card-children-boardid` moves rows that a move
already left behind to their card's board.
`tests/cardChildrenFollowMove.test.cjs` pins the list and fails on any move
path that skips the helper, and a Playwright spec moves a commented card with
the Move Card popup and by REST.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.57 2026-10-20 WeKan ® release

**In short:** attachments can be **deleted after a set time** and deleted ones
**purged**, every **backup** is recorded with failures and overdue runs shown,
and the newest features' settings are on **every platform** and in the **Admin
Panel**. Adding a board member by email works whatever the letter case, and the
**Security report** stops crying wolf.

This release adds the following new features:

**Attachments and backups** - how long files and backups are kept, and whether
the backups worked.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dcf91e4471">Attachment retention: delete card attachments after N days, purge deleted ones after M days</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6789](https://github.com/wekan/wekan/issues/6789): off unless configured, a
nightly job deletes card attachments older than `ATTACHMENTS_RETENTION_DAYS`
through the card's own restorable Delete, optionally only on inactive cards.
`ATTACHMENTS_PURGE_DELETED_AFTER_DAYS` then removes them for good, file
included, from every storage backend. There are also dry-run and per-night
cap settings. All five are in **Admin Panel / Attachments / Retention** and on
every platform. `tests/attachmentRetention.test.cjs` and a UI spec cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06b7ce994a">Backup status: every run recorded, failures and overdue backups shown, old backups pruned</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6790](https://github.com/wekan/wekan/issues/6790): a backup's result lived only
in the memory of the server that ran it, so after a restart, or on another pod,
nobody could tell whether last night's backup worked. Every run is now recorded
for 400 days. Admin Panel / Problems / Backup shows the last success, the last
failure, the next run and the history. Problems / Summary and `/metrics` report
failed and overdue backups. `BACKUP_KEEP_DAYS`, also in Admin Panel /
Attachments / Backup, prunes old local backups and always keeps the newest.
`tests/backupRuns.test.cjs` covers it.

</details>

**Admin Panel settings** - the newest features' environment variables.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/718fdb5dac">The newest features' settings are on every release platform and in the Admin Panel</a>. Thanks to xet7.</summary>

An audit found 30 variables new since v12.00. The Email to card limits, the
login-cookie limit and Windows SSO are now Admin Panel settings. Those and the
per-process switches are listed in the Dockerfile, docker-compose, start-wekan
and the snap; none had been. `tests/envVarCoverage.test.cjs` now fails for any
variable read that is neither an Admin Panel setting nor environment-only with
a stated reason.

</details>

and fixes the following bugs:

**Board members** - adding a colleague to a board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/193fb449bd">Adding a board member by email works in any letter case, and search finds colleagues past five matches</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6788](https://github.com/wekan/wekan/issues/6788): LDAP and OIDC store an
address as the directory spells it, and the invite matched it exactly, so
"jan.jansen@example.com" found nobody and WeKan tried to create a new account.
The match is now case-insensitive, anchored and escaped. The member search read
five users before filtering out disabled accounts and other organizations, so a
colleague could be hidden; it filters first now. A test of the source and a
UI spec cover both (`tests/inviteMemberEmailCase.test.cjs`).

</details>

**Admin Panel / Problems / Security** - reports that named an attack or a
tampering where there was none, and labels it showed in English.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f3ec0afa3">History rows are hashed as stored, so an unset value is not tampering</a>. Thanks to xet7.</summary>

HistoryIntegrity reported "checksum-mismatch", critical, 89472 times, on a row
nobody had touched. Meteor stores rows with `ignoreUndefined`, so a content
value like `deletedAt: list.deletedAt` (unset) is dropped when stored, and the
row's hash, which still covered it, failed every audit. Rows are now hashed as
stored. Rows written before this verify by re-adding exactly the keys the
other side of the change has. A changed or removed real value still fails.
`tests/changeHistoryIntegrity.test.cjs` stores rows through BSON as the
driver does.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7c541ccc5">FileNameBleed: a percent-encoded name is not an exploit, and opening a file is not an upload</a>. Thanks to xet7.</summary>

Opening a board of 2019 photos with Cyrillic names tripped "uploaded a
filename carrying an exploit pattern; URL-encoded name". Percent-encoding is
how browsers and older WeKan store any non-ASCII name. It is no longer a
dangerous reason. Path traversal and null bytes are now named from the
decoded name, so an encoded `../` still trips the path-traversal canary. A
name repaired while a file is read never trips the upload canary.
`tests/filenameCanaryReasons.test.cjs` covers both directions.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52f127c0a5">A clean file-integrity scan is no longer a StorageBleed event</a>. Thanks to xet7.</summary>

The background scan reported its own summary ("0 changed, 0 with no record
saying why") on every run, 41 times. The summary is recorded only beside the
changed or missing files it sums up; a clean run goes to the server log.
`tests/fileIntegrity.test.cjs` pins it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a23306c2e">Locations from Cloudflare keep their letters: Dinkelsbühl, not DinkelsbÃ¼hl</a>. Thanks to xet7.</summary>

Cloudflare sends the city as UTF-8 bytes and Node reads header values as
Latin-1. A value that is valid UTF-8 as bytes is now read as UTF-8; genuine
Latin-1 and percent-encoded names are unchanged. `tests/geoHeadersUtf8.test.cjs`
includes a real HTTP request.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d703965c4">IPv6 location and Instrumentation are translated</a>. Thanks to xet7.</summary>

The IPv6 location column is the translated "location" plus " (IPv6)", and the
Instrumentation report has a title key, translated into every language
(French: "Instrumentation logicielle"). Several translations are
low-confidence and listed in the commit.

</details>

**Release builds** - jobs that v12.56 lost to infrastructure rather than to
WeKan.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/294a9016d3">Bun bundles wait for their smoke-test MongoDB, and replace a lost one</a>. Thanks to xet7.</summary>

v12.56's Bun linux-x64 bundle stopped with "Topology is closed": nothing
listened on the smoke-test database's port. The container had been started
with `--rm` and never checked, so its log was gone too. `bun.yml` now waits
until it answers a ping, and prints its log if it does not. `build-target.sh`
checks again before starting WeKan, with the new `releases/bun/wait-mongo.mjs`;
a lost database is shown and replaced once. `tests/bunSmokeMongo.test.cjs`
covers it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/727e96e527">Launchpad snaps retry an outage there for longer, not three strikes</a>. Thanks to xet7.</summary>

v12.56's ppc64el snap gave up after 20 minutes of a five-hour budget. The
builder lost TLS while cloning our source, and the next two attempts, a minute
apart, met Launchpad's HTTP 503. An attempt that fails on Launchpad
infrastructure now earns another, up to six, after a growing pause. Other
failures keep three attempts. `tests/snapLaunchpadInfraRetry.test.cjs` runs
the workflow's own check against logs shaped like v12.56's, and against the
negatives. Its git-error pattern says `RPC failed;` rather than naming curl
([follow-up](https://github.com/wekan/wekan/commit/363cd22916)), as the
downloads guard requires.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.56 2026-10-20 WeKan ® release

**In short:** accounts nobody uses can be **disabled after a set number of
days**, from the Admin Panel or the environment, and **LDAP background sync**
disables what the directory disabled. Admin Panel / People shows everyone's
**Last active**, check marks are check marks in **right-to-left** languages,
and **restored list swimlanes** survive the next upgrade.

This release adds the following new features:

**People** - who uses WeKan, and what happens to accounts nobody does.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b933a69cd4">Inactive accounts can be disabled; LDAP sync honours its search filter; everyone's Last active is shown</a>. Thanks to Raymond-Voogt and xet7.</summary>

- [#6783](https://github.com/wekan/wekan/issues/6783): Admin Panel / People
  showed "Last active" as "-" for every user but the administrator, because
  the `people` publication did not carry `lastConnectionDate`. The table's own
  row projection left it out too, which the UI test found
  ([the table's half](https://github.com/wekan/wekan/commit/c4376f92a5)).
- [#6784](https://github.com/wekan/wekan/issues/6784):
  `USERS_DISABLE_INACTIVE_AFTER_DAYS` disables, once a night, accounts unused
  for that many days, and revokes their logins.
  - Admins are never disabled.
  - An account with no recorded activity starts its count on the first run,
    not from when it was created.
  - Re-enabling an account restarts its count.
  - The setting is in **Admin Panel / People / Login** as well as in every
    platform's settings. It is read each night, so a change there needs no
    restart.
- [#6785](https://github.com/wekan/wekan/issues/6785): LDAP background sync
  looked users up without `LDAP_USER_SEARCH_FILTER`. An account the filter
  excludes, such as one disabled in Active Directory, could not log in but was
  still found: it was never disabled, and a manual disable was undone on the
  next sync. The filter is now part of the lookup, and an account disabled for
  inactivity is not re-enabled by the sync.

From the patch by Raymond-Voogt. `tests/inactiveUsers.test.cjs`,
`tests/ldapBackgroundSync.test.cjs`, `tests/ldapUserIdFilter.test.cjs`,
`tests/authConfigCatalog.test.cjs` and
`inactive-users-last-active.e2e.js` cover it.

</details>

and fixes the following bugs:

**Right-to-left languages** - how a checked checkbox looks.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b4bcded492">A checked checkbox shows a check mark in right-to-left languages too</a>. Thanks to mimZD and xet7.</summary>

[#6786](https://github.com/wekan/wekan/issues/6786): the tick is a box rotated
40 degrees and drawn by its bottom and side borders. The side was
`border-inline-end`, which a right-to-left page puts on the left, so the tick
opened the other way. All 25 rules that draw a tick now use `border-right`.
`tests/rtlCheckMark.test.cjs` fails if any checked state in `client/` draws
one with a logical border, and `rtl-check-mark.e2e.js` compares both
directions.

</details>

**Admin Panel / Problems** - repairs that stay repaired.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3469f84c78">Restored list swimlanes stay restored after a WeKan upgrade</a>. Thanks to mimZD and xet7.</summary>

[#6787](https://github.com/wekan/wekan/issues/6787): after every new release,
the startup upgrade's `merge-per-swimlane-lists` step, written for v7.98-era
damage, un-bound every list on a board with two lists of one title, the lists
"Lists missing their swimlane" -> Restore had bound included. So the count
came back the same after each upgrade. A list bound to the swimlane it was
created in, with all its cards there, is now left alone. Press Restore once
more after upgrading. `tests/schemaUpgradeSteps.test.cjs` covers the issue's
board and two negatives.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.55 2026-10-18 WeKan ® release

**In short:** the **32-bit ARM single files** are injected outside the 32-bit
Node.js that ran out of memory doing it, and each **musl AppImage** is built
once, under a name of its own.

This release fixes the following bugs:

**Release builds** - single files and AppImages that v12.54 built broken,
twice, or not at all.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29dfe94886">A 32-bit ARM single file's blob is injected in a 64-bit process</a>. Thanks to xet7.</summary>

v12.54's retry did not help: armv7 failed with `std::bad_alloc` on all three
attempts. A 32-bit target's blob must be written by a 32-bit Node.js, and
`--build-sea` also injects it with LIEF in that process, which does not have
the address space for it. The i386 Node.js now writes only the blob
(`--experimental-sea-config`), and `releases/single-file/sea-inject-elf.py`
injects it with LIEF 1.0.0, the version Node.js vendors, step for step as
`--build-sea` does. The result is byte-identical to `--build-sea`'s, for a
non-PIE x64 Node.js and the PIE node-armv7. win32 and 64-bit targets are
unchanged, and the retry is gone. `tests/singleFileSeaInject.test.cjs`
compares the two outputs byte for byte where LIEF is available.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2cbb038719">Each musl AppImage is built once, and every AppImage job has its own name</a>. Thanks to xet7.</summary>

The glibc AppImages call built the musl rows too, so "AppImage x86_64" and
"AppImage aarch64" ran twice. Their logs then collided in the run's log
archive and asked to be overwritten when it was unpacked. That call now builds
only the glibc four, the job is named `AppImage x86_64-musl` and so on, and
each run checks only its own AppImages are attached. The musl run had warned
that the glibc ones were missing. `tests/muslBundles.test.cjs` checks that the
names are unique and that each row is built by one call.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.54 2026-10-18 WeKan ® release

**In short:** the **Android** bundles, the **x86_64 musl AppImage** and the
**armhf single file**, which v12.53 could not build or start, build again.

This release fixes the following bugs:

**Release builds** - bundles that v12.53 built broken or not at all.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/519869b561">Android bundles preload termux-exec, so bcrypt's install script runs</a>. Thanks to xet7.</summary>

Every Android bundle of v12.53 stopped in `npm-rebuild.js` with "sh: 1:
node-gyp-build: not found". Termux has no `/usr/bin/env`, so a
`#!/usr/bin/env node` script runs only through termux-exec, an `LD_PRELOAD`
library that Termux's `login` exports, and the workflow starts bash without
`login`. `releases/android/build-bundle.sh` now exports it the way `login`
does. `tests/androidBundles.test.cjs` pins it before `npm install`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa0c03437c">A single file's --build-sea is tried again when it runs out of memory</a>. Thanks to xet7.</summary>

The armhf single file of v12.53 failed with `std::bad_alloc`. A 32-bit target
is injected by the 32-bit i386 Node.js, and the executable, the 180 MiB
archive and LIEF's copies of both come near its 4 GiB address space: armv7
and armv6, with the same archive and host, built in the same run. `buildSea()`
retries up to three times on `std::bad_alloc` only.
`tests/singleFileSeaInject.test.cjs` covers the retry and that no other
failure is retried.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df5560ad51">musl bundles carry every library their Node.js needs, libatomic too</a>. Thanks to xet7.</summary>

Every x86_64 musl AppImage of v12.53 did not start in a bare Alpine: "Error
loading shared library libatomic.so.1". `node-runtime` held only libstdc++
and libgcc_s, and the build container had libatomic through g++. The musl
build now copies every `NEEDED` library of `bundle/node` except musl's libc,
and `AppImage.yml` checks each is there before packing.
`tests/muslBundles.test.cjs` pins both.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.53 2026-10-18 WeKan ® release

**In short:** moving a card with an **outgoing webhook** no longer disables
the mover's account as **HookBleed**, and a security refusal that says it
blocks nobody (**RedirectBleed**, **LiveBleed**, **IntegrationBleed**) now
really does not.

This release fixes the following bugs:

**Outgoing webhooks** - a card move delivered to a webhook is the server's own,
and costs nobody their account.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b01c233269">Moving a card with an outgoing webhook is no HookBleed and keeps the mover's account</a>. Thanks to do4me and xet7.</summary>

[#6782](https://github.com/wekan/wekan/issues/6782): the activity hook sent
webhooks through `Meteor.call('outgoingWebhooks')`, and that method took a
call without `this.connection` to be the server's own. Meteor gives a
server-side `Meteor.call` the user and connection of the method it runs in,
and a card moved in a browser runs in that browser's method. The server's own
`act-moveCard` delivery was therefore taken for a client forging one. It was
logged as HookBleed, and the mover's account was disabled.

- The server now delivers through `deliverActivityWebhook()`, a function that
  no client can call. It reads the integration again and names the
  activity's actor. The method accepts only the card-opened notification, as
  it already did for clients.
- A server delivery no longer needs the actor to be a member of the hook's
  board. That check had also stopped global webhooks and activities with no
  method behind them, such as REST and timers.
- `securityLog.record()` passed neither the catalog key nor `blocksAccount`
  to the block decision. Every high-severity refusal therefore disabled the
  account it named: a hook refused for its own internal address disabled the
  mover too, and the existing `blocksAccount: false` of RedirectBleed and
  LiveBleed never applied. Both reach the decision now, and `ssrf.webhook`
  is `blocksAccount: false`, because the mover did not write the hook's URL.

`tests/hookBleedServerDelivery.test.cjs` covers:

- a card move delivered with nothing logged, also in an inherited context;
- a forged call, still refused, logged and blocking;
- the card-opened notification;
- failing and internal hooks that block nobody, through `record()` itself;
- a scan of the whole tree that no server code calls a method gated on
  `this.connection` from inside a client's method.

`hook-bleed.e2e.js` moves a card in the Move dialog with a webhook enabled.
An account disabled by this before the upgrade is enabled again in Admin
Panel / People.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.52 2026-10-18 WeKan ® release

**In short:** the release builds that failed in v12.51 work again: the
**Android** bundles, the **musl AppImages** and the **i386** and
**freebsd-x64** single files. Nine dependency updates, among them
**qrcode-generator 2** and **actions/download-artifact 8**, were checked
against how WeKan uses them.

This release updates the following dependencies:

- **qrcode-generator 1.4.4 → 2.0.4** — [the SQRL sign-in QR
  code](https://github.com/wekan/wekan/pull/6775); now ES module and CommonJS
  builds, and the SVG of WeKan's call is byte for byte the same.
- **temml 0.13.5 → 0.14.0** — [math in
  Markdown](https://github.com/wekan/wekan/pull/6777); WeKan's
  `renderToString` options give the same output for formulas, errors and
  `\href`.
- **i18next 26.4.2 → 26.4.5** — [the translation
  library](https://github.com/wekan/wekan/pull/6779).
- **@swc/core 1.16.13 → 1.16.18** — [the compiler of the
  build](https://github.com/wekan/wekan/pull/6778).
- **@rspack/cli 2.2.8 → 2.2.9** — [the bundler's command
  line](https://github.com/wekan/wekan/pull/6773).
- **@playwright/test 1.63.0 → 1.64.1** — [the browser
  tests](https://github.com/wekan/wekan/pull/6776).
- **actions/download-artifact 7.0.0 → 8.0.2** — [in five
  workflows](https://github.com/wekan/wekan/pull/6774); a hash mismatch now
  fails the download, and every artifact WeKan uploads is still a zip.
- **actions/setup-python 6.3.0 → 7.0.0** — [in
  bun.yml](https://github.com/wekan/wekan/pull/6780); the removed `pip-install`
  input was not used.
- **vmactions/freebsd-vm 1.5.5 → 1.5.9** — [in
  bsd.yml](https://github.com/wekan/wekan/pull/6781), the version bun.yml
  already uses.

Thanks to dependabot.

and fixes the following bugs:

**Release builds** - the Android, musl and single-file builds of v12.51, and
the guards of the dependency updates.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53729d47f5">The guards follow freebsd-vm 1.5.9 and qrcode-generator 2.0.4</a>. Thanks to dependabot and xet7.</summary>

Two tests stopped at the merged updates. `tests/bsdBundles.test.cjs` pinned
`bsd.yml`'s FreeBSD VM action to its old commit, because the VM that builds
the bundle's native modules must be the one that built node-freebsd-x64. It
now reads the pin and requires wekan/node-patches to use the same commit, and
node-patches now does. `tests/sqrl.test.cjs` required qrcode-generator 1.4.4
exactly, and now requires an exact version.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0670cc65a3">Android bundles: the checkout belongs to Termux's user, so npm may chmod</a>. Thanks to xet7.</summary>

Every Android bundle of v12.51 stopped with EPERM. npm chmods each package's
bin when it installs (`uuid/dist/bin/uuid`), and only a file's owner may
chmod it, so making the bind mount writable to everyone (`a+rwX`) was not
enough. `android.yml` now reads the uid of Termux's user from the image,
chowns the checkout to it before the rebuild, and takes it back before
packaging. If it cannot read the uid, it stops the job.
`tests/androidBundles.test.cjs` pins the order and the negative case.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bce305029a">musl bundles carry libstdc++ and libgcc_s, so their Node.js starts on a bare Alpine</a>. Thanks to xet7.</summary>

Every musl AppImage of v12.51 died at once in Alpine with "Error relocating
.../bundle/node: _ZTVN10__cxxabiv117__class_type_infoE: symbol not found".
The musl Node.js is linked against GCC's C++ runtime. The Alpine that
`musl.yml` builds in had it installed, and a user's Alpine does not. The
bundle's `node-runtime` now holds that Alpine's `libstdc++.so.6` and
`libgcc_s.so.1`, with a license notice. `start-wekan.sh` puts them on the
library path, as it does with libatomic, and the AppImage workflow requires
both files in a musl bundle. Its smoke test still adds only curl to Alpine,
so `tests/muslBundles.test.cjs` would catch this fault again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c316616ef8">Single files: a Node.js that LIEF cannot inject is skipped with the reason, not failed</a>. Thanks to xet7.</summary>

The v12.51 i386 single file stopped with `std::bad_alloc`, and the
freebsd-x64 one with "Failed to relocate ELF program headers". Node.js
injects the archive with LIEF:

- The i386 Node.js is a PIE with 1,524 R_386_32 relocations, which LIEF does
  not adjust. postject, which uses the same LIEF, "succeeds" and leaves a
  broken binary.
- The FreeBSD Node.js is a non-PIE with two bss-like segments.

`releases/single-file/sea-inject.mjs` detects both from the ELF before
anything is built. `build.mjs` then exits 3 with the reason, which
`single-file.yml` turns into a notice. wekan/node-patches now builds the
i386 Node.js as a non-PIE and the FreeBSD one as a PIE, so both single files
come back with its next release. A target that was not built leaves a
one-line artifact saying why, so its Start job no longer logs "Artifact not
found" errors. `tests/singleFileSeaInject.test.cjs` checks both cases on
synthetic ELF files, and its negative cases let through what LIEF does
inject.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.51 2026-10-17 WeKan ® release

**In short:** eleven **helpers that need no AI** - features other kanban
apps sell as AI, done here with plain code: a **due date from the title**,
**similar cards**, **rule suggestions**, a board **Summary**, **Since your last
visit**, **At risk**, **suggested members**, a **forecast done date**, a
**checklist from the description**, **action items** and **search phrases**.
A card's drawing also opens as a **whiteboard** that several people draw on
at once, and **Apple Glass Pastel** is now Liquid Glass. Each can be hidden
per board or for the whole WeKan. A **CodeQL** alert in a test is fixed.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6090be4dfd">Alert #588: a test removes template declarations to a fixed point</a>. Thanks to GitHub CodeQL and xet7.</summary>

js/incomplete-multi-character-sanitization in
tests/templatesAreRendered.test.cjs: one replace each removed template
declarations and Template.<name>.helpers/onCreated/... from the source the
test scans, so removing one could splice its neighbours into another. Both
now repeat until nothing changes, as for alerts #545 and #570-#582, and
tests/tagStrippingFixedPoint.test.cjs now also finds a multi-character removal
of an on<Capital> name outside such a loop anywhere in the tree. A test's
source scan, never run on user input, so nothing reaches Admin Panel ->
Problems.

</details>

and adds the following new features:

**Helpers that need no AI** - computed from the board's own data, hidden like
every other optional part, and translated in every language.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8267d704e">A due date typed at the end of a card title becomes its due date</a>. Thanks to xet7.</summary>

"Call the printer tomorrow 14:00", "Soita huomenna klo 14", "friday 9:30",
"in 3 days" or "23.10." at the end of a new card's title gives the card that
due date, and the words leave the title. The words come from the browser's
own Intl tables (relative days, weekdays, the language's date order and the
word before a time), so every language works without a word list, and English
works in every language. Only the end of the title is read, a time alone needs
a colon, a day word or am/pm, and "Release 1.2" is never a date. A hint under
the field shows the date and its x keeps the words; the opened card's title
reads it only when the title changed. Board Settings / Card row *Due date
from title*. models/lib/titleDueDate.js; tests/titleDueDate.test.cjs checks
eleven languages, the negatives and every WeKan language tag, and
assist-due-from-title.e2e.js the form, the x, the board switch and the
opened card.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8267d704e">Similar cards and possible duplicates while adding a card and on the opened card</a>. Thanks to xet7.</summary>

Letter triples and the Dice coefficient - letter pairs for scripts written
without spaces - rank the board's open cards against the title being typed or
the opened card's title and description. The add-card form lists up to three,
marking one 80 % alike or more as a possible duplicate; the opened card has a
Similar cards section. The method cards.similar reads through
server/lib/assistGate.js: a board the caller may read, the board's switch and
the Admin Panel's, and for an assigned-only member only the cards assigned to
them. tests/similarCards.test.cjs and assist-similar-cards.e2e.js, with the
assigned-only and switched-off negatives.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2211b24119">Rules suggests rules from what people keep doing by hand</a>. Thanks to xet7.</summary>

When the same person does one thing to a card and within two minutes
another, the pair is counted once per card; seen on three cards in 30 days it
is offered above the rule list - moved to a list then a label, a member or
archive, and so on. A pair a rule already does is not offered. Create goes
through rules.createRule with the trigger and action the wizard builds, and
Dismiss hides one for that admin on that board. Board admins only, and
Admin Panel / Settings / Visibility / Features has a Rule suggestions tick.
tests/ruleSuggestions.test.cjs and assist-rule-suggestions.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/083c863fb7">Board menu: Summary, what each person did in the last day or week</a>. Thanks to xet7.</summary>

Per person: done (marked complete, given an end date, archived or moved into
the last list), moved, added, commented, and what they have overdue now -
from the activities and History, only the cards the reader may see. Copy as
text gives Markdown with card links. An Admin Panel / Settings / Visibility /
Features tick. tests/boardSummary.test.cjs and assist-board-summary.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/083c863fb7">Board menu: Since your last visit, with how many changes</a>. Thanks to xet7.</summary>

What others changed since the visit before this one, grouped by card. Opening
a board remembers the visit in profile.boardVisits (500 boards at most) even
while the feature is hidden; a board never opened shows its last seven days.
tests/sinceLastVisit.test.cjs and assist-since-last-visit.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/083c863fb7">At risk: a triangle on the minicard and the reasons in the opened card</a>. Thanks to xet7.</summary>

A weighted score: overdue 3, due within two days with less than half the
checklist done 2, blocked by an open card 2, idle 14 days in a middle list
2, moved back twice 1 (the opened card counts those). 3 or more is at risk;
a complete card never is. models/lib/cardRisk.js; tests/cardRisk.test.cjs and
assist-at-risk.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/083c863fb7">Suggested members in the Members and Assignees popups</a>. Thanks to xet7.</summary>

Up to three active board members, by points from the board's open cards that
share this card's labels (2 each), list (1) and swimlane (1); people already
on the card are skipped. A Show on Card row only, the one row with no
minicard side. tests/memberSuggestions.test.cjs and
assist-suggested-members-forecast.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/083c863fb7">Forecast done date for one card, 50 % and 85 %</a>. Thanks to xet7.</summary>

From the cycle times of the board's cards finished in 180 days, counting only
those that took at least as long as this card has been open; fewer than five
say so. The server sends the times once per board, numbers only, scoped by
role. On the opened card's dates, and on the minicard when a board turns that
side on. tests/cardForecast.test.cjs and the e2e above.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3cb089b8ca">Checklists: From description makes a checklist or subtasks from its list</a>. Thanks to xet7.</summary>

The description's list lines - "- ", "* ", "+ ", "1. ", "1) " and task boxes,
never inside a code block - are previewed, then made into a checklist ticked
where the line was [x], or into subtasks through addSubtaskCard. The
description is not changed. tests/descriptionListItems.test.cjs and
assist-from-text.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3cb089b8ca">Cards from the action items of a comment or a description</a>. Thanks to xet7.</summary>

"TODO: ...", "- [ ] ..." and "@user ..." lines become cards at the top of the
card's list, each linking back to the card, with the mentioned user as member
when they are an active board member - a mention of anybody else stays in the
title. On the comment's line, and in the card menu for the description.
tests/actionItems.test.cjs and assist-from-text.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3cb089b8ca">Global search understands plain phrases such as my overdue cards</a>. Thanks to xet7.</summary>

Ten phrases in the reader's language, and in English everywhere, run as the
search operators in the reader's language; the page shows the query it ran,
and a query that already has an operator is never rewritten. An Admin Panel /
Settings / Visibility / Features tick. tests/searchPhrases.test.cjs and
assist-search-phrases.e2e.js.

</details>

**Apple Glass Pastel** - the theme as Apple's Liquid Glass, readable everywhere.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c49f7f51b">Liquid Glass surfaces, and every text and icon measured readable</a>. Thanks to xet7.</summary>

Header bars, swimlanes, lists, minicards, the opened card, the sidebar and
popups are frosted glass over the pastel mesh: a translucent fill, blur and
saturation, a rim of light brightest on top, a diagonal sheen and larger
corners. The header bars are glass instead of solid blue, with dark text;
blue stays for the primary action and what is active. Reduce transparency
gets near-opaque surfaces. theme-appleglasspastel-contrast.e2e.js measures
every text and icon against the pixels really behind it, to WCAG AA, on the
board, card, sidebar, board menu and All Boards at laptop and phone size; it
found white header text and icons, the forced-white hamburger, grey sidebar
headings and icons, and a white hovered menu row, all fixed.

</details>

**Whiteboard** - a card's drawing full screen, for several people at once.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/390007e380">A card's drawing opens as a whiteboard that several people draw on at once</a>. Thanks to xet7.</summary>

Card menu -> Drawing -> Open as whiteboard: the drawing under the header bar,
over the opened card, with the drawing's and Red Strings' own colours, widths,
Undo, Clear and Save picture, scaled to the screen. Each line is one atomic
$push with its id and author, carried to everyone by the card's publication;
Undo and Clear take away only one's own lines, Save picture writes only the
PNG. Who may draw is who may edit the card. A Board Settings / Card row.
tests/whiteboard.test.cjs, and whiteboard.e2e.js draws from two browsers at
the same moment.

</details>

and improves the documentation:

- [docs/Features: guides for the eleven helpers that need no AI, filed by menu](https://github.com/wekan/wekan/commit/e76f12bcdd),
  and TODO Later lists them. Thanks to xet7.
- [docs/Features: Cards / Whiteboard](https://github.com/wekan/wekan/commit/d9bb7b4f4f). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.50 2026-10-17 WeKan ® release

**In short:** a **LockoutBleed** follow-up loads the web login's timing
equalizer, which was finished but never imported. Admin Panel / Problems gains
**Memory Usage** and **Disk usage** reports, and the board menu **Original
positions**. Cloning, calendars, notification attachments and failed-call
messages work as they should. Removing **duplicated and unreachable code**
leaves the app over 1,700 lines smaller even with the new reports, and
**docs/Features is filed by the WeKan menus**.

This release fixes the following CRITICAL SECURITY ISSUE of [LockoutBleed](https://wekan.fi/hall-of-fame/lockoutbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f3a61df0c">The web login no longer tells by its response time whether a username exists</a>. Thanks to xet7.</summary>

[GHSA-2g94-9x3m-hv37](https://github.com/wekan/wekan/security/advisories/GHSA-2g94-9x3m-hv37)
follow-up: `package.json` sets `meteor.mainModule`, so the server runs only
what an import chain from `server/main.js` reaches, and
`server/loginTimingNormalization.js` - the DDP `login` half of the timing fix -
was never imported. The REST login was equalized; the web login was not. It
is loaded now. Nothing is refused by it, so there is nothing to record in Admin
Panel → Problems; the lockout itself still records under LockoutBleed.
`tests/serverModulesLoaded.test.cjs` fails when any server module that
registers a login handler, methods, publications, a route, a startup hook or
a job is not reached.

</details>

and adds the following new features:

**Admin Panel / Problems** - what the machine is short of.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b8a33022b">Instrumentation shows the whole picture as one bar per area of WeKan</a>. Thanks to xet7.</summary>

Instead of up to 200 rows on 11 pages, the page opens with one bar per area -
Settings, Login, People, Boards, Cards and the rest - showing its calls, the
share that failed and the average duration; clicking an area filters the table
to it. All of WeKan's 614 methods and publications are grouped and tested.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6a3d98736">Memory Usage and Disk usage reports, beside CPU usage</a>. Thanks to xet7.</summary>

The two pages were designs no code carried out. Each monitor records only the
start and the end of a sustained high-usage period: memory from MemAvailable
and swap, and each filesystem WeKan writes to - files, uploads and the snap's
data - once per device. A live line sits above the rows, the labels use keys
every language already translates, and the settings are `WEKAN_RAM_*`,
`WEKAN_SWAP_HIGH_PERCENT` and `WEKAN_DISK_*`. Observe and report only.

</details>

**Admin Panel / Settings** - Shared labels.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c3e80240a">Shared labels pick their colour with the board labels' picker</a>. Thanks to xet7.</summary>

The dropdown of colour names is gone: each row has the palette swatches and the
custom colour wheel of a board label, one shared template for both, and each
swatch is the size it is on an opened card at every window width.

</details>

**Boards** - what happened to a board's swimlanes, lists and cards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9e28a8fbb">Board menu: Original positions, where each swimlane, list and card was put</a>. Thanks to xet7.</summary>

The positions were recorded on creation and shown by nothing. The right sidebar
lists them by the names they have now, marks what has moved and shows the
title each was made with. The server shows each reader only what they may see.
One new key, translated into every language.

</details>

and fixes the following bugs:

**Cards** - features that were saved but never acted on.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f3a61df0c">A card's Recurrence setting recurs, and the snap's offline pages show the product name</a>. Thanks to xet7.</summary>

`server/cardRecurrenceSchedule.js`, the hourly job behind a card's Recurrence
setting, and `server/productNameCache.js`, the Admin Panel product name for the
pages the snap shows while the database is down, were never imported, so the
setting was saved and nothing recurred. Both are loaded with the timing fix
above.

</details>

**Notifications and labels** - what the drawer receives, and what the pages
say.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/262f9194fc">Notification attachments show, and six labels no longer show their translation key</a>. Thanks to xet7.</summary>

The notifications drawer subscribed to `notificationsAttachments` while the
server publishes `notificationAttachments`, so the subscription never became
ready. Six template keys did not exist: the sidebar filter's Due group, the
Scrum sprint form, the Jira estimate field, the passkey trash icon and two
webhook URL fields showed `dueAt`, `end`, `no-cards`, `custom-field`, `remove`
and `URL`. They use existing keys now. Two tests check every subscription
against every publication and every template key against `en.i18n.json`.

</details>

**Board views** - cloning, the calendars, and what a visitor or a viewer is
offered.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e29641111">Cloning a board through the cloneBoard method works again</a>. Thanks to xet7.</summary>

`getMembersToMap` is async, and `cloneBoard` called `.forEach` on the Promise it
returned, so every clone through that method stopped with an error; the board
menu clones with `copyBoard` and was not affected. A test resolves every
variable assigned from an async function, file by file, and fails when it is
used as a value without `await`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a896f3ed8c">A visitor's Product Backlog, Sprints, Sprint Report or Velocity view stays chosen</a>. Thanks to xet7.</summary>

Without an account the browser keeps the board view, and `client/lib/utils.js`
stored it from one hand-written list of views but read it back through another
that lacked the four Scrum views, so they opened as Swimlanes. Both ask
`BOARD_VIEWS` now, which removes the two lists.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0fff9d4828">Calendars leave archived cards out, and Timeline offers Restore only to those who may</a>. Thanks to xet7.</summary>

Every calendar showed archived cards once the Archive sidebar had loaded them.
Timeline's restore was offered to every viewer and a refusal vanished. A Table
swimlane row spanned a fixed 11 columns. Map showed the raw "upload-failed".
25 alerts fell back to their own English sentence; they report the error in the
reader's language through one helper, and a test keeps new ones from falling
back to English.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/483f3cd538">The file integrity scan waits for a quiet CPU again</a>. Thanks to xet7.</summary>

It asked the CPU monitor for a function it never had, so its CPU check was
always NaN and the hourly scan never skipped a busy hour. A test checks every
named import of an app module against what that module exports.

</details>

**Screen sizes** - the new UI on a phone, the iPhone Duo, a tablet, a laptop and
a 55" touchscreen, upright and on its side.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e34a488617">Header, Admin Panel menu and tables, and the Table view fit every screen size</a>. Thanks to xet7.</summary>

A browser test opens the new pages at ten sizes and checks that icons and texts
are on screen and visible, that nothing scrolls the page sideways, that every
table column can be reached and read, and that dragscroll pans by mouse and by
finger. It found the iPhone header's hamburger past the right edge, bullets and
dashes in the Admin Panel menu on a phone, Admin table columns too narrow to
read on a phone and an upright iPad, the Table view's toggles drawn white on
white, and its columns cut off on an upright iPad. Each is fixed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0242249a1c">The iPhone Duo, open and closed, at its real resolution</a>. Thanks to xet7.</summary>

The foldable in the screen-size test is the iPhone Duo now, instead of a
Galaxy Fold standing in for it: Apple's 1878 x 2670 and 1398 x 2034 pixel
displays, 626 x 890 and 466 x 678 CSS pixels at 3x, each upright and on its
side.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85ab1b79a3">"or Template or link a list from another board" has its space again</a>. Thanks to xet7.</summary>

The add-list form read "Templateor": in its flex row each alternative is a
flex item, which drops the space its text starts with; the gap is a margin
now. Every dev-server start also printed a Jade warning for editor.jade; a
test compiles every template with the build's own compiler and fails on any
warning.

</details>

and has the following developer-facing changes:

**Less code to maintain** - copies that decided nothing, and code nothing
reached.

- [Remove files nothing loads, and point their tests at the code that runs](https://github.com/wekan/wekan/commit/70dcc2a134).
  Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7dc5399dc7">Remove code a second copy replaced, and templates nothing draws</a>. Thanks to xet7.</summary>

Twelve card member methods and two user helpers were defined twice in one
object literal, where only the last copy runs. An Admin Panel attachment
settings pane that no menu opened, a dozen templates nothing drew, and CSS
blocks repeated word for word went with them. Two tests fail on a key defined
twice in an object literal and on a template nothing draws.

</details>

- [The list and its header share the fixed list width helpers](https://github.com/wekan/wekan/commit/73e815b4f4).
  Thanks to xet7.
- [The board's organization and team pickers share one state helper](https://github.com/wekan/wekan/commit/a6aa3fdfb7).
  Thanks to xet7.
- [Each card date is described once for its card and minicard badge](https://github.com/wekan/wekan/commit/9a73bf9173).
  Thanks to xet7.
- [One list drag-and-drop setup for a swimlane and the Lists view](https://github.com/wekan/wekan/commit/d444a76af2).
  Thanks to xet7.
- [The Calendar and Multi Board Calendar views share their calendar options](https://github.com/wekan/wekan/commit/5908fab5de).
  Thanks to xet7.

and updates the following documentation:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b7589737f5">docs/Features is filed the way the WeKan menus are, with the code behind each entry</a>. Thanks to xet7.</summary>

Guides sit under the menu they are used from: Header-Bar, All-Boards, Pages,
Board-Header, Board-Sidebar, Rules, Swimlanes, Lists, Cards, Member-Settings,
Admin-Panel and Login-Page, with shared topics in General. Each area has a
README mapping its menu entries to guides and to the template or module that
implements them; Board View lists all 40 views, of which five have no guide of
their own yet. Old paths that released changelogs link keep a forwarding page.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/11babe27f2">Snap keys, the setting guide and Docker examples match this WeKan</a>. Thanks to xet7.</summary>

Three `snap set` lines named keys the snap does not have, which snapd stores
without a word; a test checks every one in the docs against
`snap-src/bin/config`. The guide to adding a setting follows the real config,
help and Admin Panel catalog. The LDAP and Traefik examples ran MongoDB 3.2 and
4.0 with the removed `--smallfiles` and 2018 WeKan images.

</details>

- [Guides for the Table, Calendar Mode, Time, Timeline and Map views](https://github.com/wekan/wekan/commit/c046afa807).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.49 2026-10-16 WeKan ® release

**In short:** an **AssignedBleed** follow-up makes **board role permissions
apply to every board view** and API: an assigned-only member sees and changes
only the cards assigned to them, in the **Email View**, the Chat view, linked
cards, notifications, counts and REST alike.

This release fixes the following CRITICAL SECURITY ISSUE of [AssignedBleed](https://wekan.fi/hall-of-fame/assignedbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b2ed17e6b">Board role permissions apply to every board view and every path to a card</a>. Thanks to crypto-nidh, binary-lover and xet7.</summary>

[GHSA-r4gm-mjj9-g3x8](https://github.com/wekan/wekan/security/advisories/GHSA-r4gm-mjj9-g3x8):
the Board Email View checked only that the reader was a board member, so an
assigned-only member read the title and body of every card in a list or label,
and their counts. An audit of every path to a card found the same shape in the
board publication's parent and linked cards, All Boards counts, linked boards'
activities, the Chat view, notifications, position history and REST - and in
writes: the role's `write` let such a member change, comment on, move or watch
any card by id. Each now asks the card. REST writes refuse assigned-only
members, as REST reads already did. Attempts no view would make show as
AssignedBleed in Admin Panel → Problems; a test fails when any server path
serving card data has no role rule.

</details>

and updates the following documentation:

- [Board roles: how a role applies to every board view, the API and every write](https://github.com/wekan/wekan/commit/63117b61d9).
  Thanks to xet7.
- [Custom roles from the Admin Panel apply in every board view as built-in roles do, verified for every combination](https://github.com/wekan/wekan/commit/1020cd7e86).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.48 2026-10-15 WeKan ® release

**In short:** an **AssignedBleed** follow-up keeps assigned-only members to
their own cards' files and document text on every remaining read path, and the
**release workflows** are hardened against injection. The **Windows** and
**NetBSD** bundles build again: the release scripts read their files as UTF-8 on
every runner, and the NetBSD build finds pkgsrc's Python. **LDAP background
sync** imports new users again and keeps the interval it is given, and every
**Caddyfile** example is **Caddy 2**, so the snap no longer renames a Caddyfile
copied from the docs.

This release fixes the following CRITICAL SECURITY ISSUE of [AssignedBleed](https://wekan.fi/hall-of-fame/assignedbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f3428db8e">Assigned-only members get only their own cards' files and document text</a>. Thanks to crypto-nidh and xet7.</summary>

[GHSA-3cgr-47wm-9cc9](https://github.com/wekan/wekan/security/advisories/GHSA-3cgr-47wm-9cc9):
an assigned-only member sees only the cards assigned to them, but six read
paths asked only for board membership. Both file downloads, the
`Attachments.protected` check and the legacy download route served any card's
file. The document search returned other cards' extracted text with their ids,
the legacy attachment publication listed every legacy file of the board, and a
linked list showed every card of its source list. Each now applies the
assigned-only rule. A refused download, or a subscription to another card's
legacy files, shows as AssignedBleed in Admin Panel → Problems; searching and
viewing a linked list are ordinary use and are narrowed without a record. The
board's background and map image stay readable to every member. A test fails
when any file serving attachment or document data lacks the rule.

</details>

and fixes the following SECURITY ISSUES found by Qlty code scanning:

**Release workflows** - the GitHub Actions that build and publish every release.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f7cc63cde">No expressions in scripts, every action pinned, and write access only where it is used</a>. Thanks to Qlty and xet7.</summary>

A `${{ ... }}` pasted into a `run:` script is expanded before the shell sees it,
so a crafted input, tag or output became shell code: 251 such values now reach
their scripts through `env:`. Every action is pinned to a commit with its
version in a comment. Six workflows granted write to every job; they grant read
and each job that writes says so. Checkouts no longer keep the token, except in
the jobs that push. `tests/workflowHardening.test.cjs` fails on any of the four
and runs zizmor when installed. Build tooling only, so there is no attempt to
record in Admin Panel → Problems.

</details>

**Python scripts and tests** - the bandit findings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee2a657977">The LDAP photo hash says it is not for security, and a downloaded zip is checked before extracting</a>. Thanks to Qlty and xet7.</summary>

The LDAP sync script's MD5 only notices a changed photo, and says so. The
Nextcloud test bootstrap checks every member of the WeKan zip lands inside its
target before extracting. The other three were test code: a fixture password
is passed as a variable, and an `exec` of the repository's own script and a
fake `/tmp` path are marked with their reasons.

</details>

and fixes the following bugs:

**Bundle builds** - the Windows and NetBSD bundles of v12.47.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/11f97d016e">The Windows bundles build again: release scripts read their files as UTF-8</a>. Thanks to xet7.</summary>

All three Windows bundles of v12.47 stopped at the risk audit, which named a
file that had not changed. The audit read its baseline in the runner's own
encoding - cp1252 on Windows - so a URL ending in "…" no longer matched. Every
text read and write in the release scripts now names UTF-8, and a test fails on
any that does not.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa62479245">The NetBSD bundle builds again: node-gyp finds pkgsrc's Python</a>. Thanks to xet7.</summary>

pkgsrc installs Python as `python3.13` only, so compiling argon2 stopped with
"You need to install the latest version of Python". The build now hands node-gyp
the versioned interpreter when there is no `python3`.

</details>

**LDAP background sync** - which users it imports, and how often it runs.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a944be1817">It imports new users again and keeps the sync interval it is given</a>. Thanks to tromlet and xet7.</summary>

The import searched `(uid=\2a)` and found nobody: it asked for every user with
the string `*`, and the escaping added for login names on 2026-09-27 made that
a literal asterisk. Only an internal value a login cannot send is the wildcard
now, so a typed `*` is still escaped.

The interval in milliseconds became a later.js calendar rule that only works
when it divides the hour: 2 hours and 1 day synced hourly, 90 seconds every
minute, and 3600 every 4 seconds. Each interval now becomes one later keeps
exactly, or the nearest one with a warning, and one under a minute is warned
about as probably seconds. Tests reproduce the reported filter and check the
spacing of every interval with the real later.js.

</details>

**The snap's Caddy** - the Caddyfiles it ships and the ones the docs show.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37d2397603">Caddyfile examples are Caddy 2, and Caddy proxies to where WeKan listens</a>. Thanks to Group-Deed and xet7.</summary>

The snap moves a Caddyfile that Caddy 2 cannot read to `Caddyfile.v1.bak-<n>`
on every start, and 19 examples in the docs were Caddy v1 (`proxy / ...
websocket transparent`, `browse`, `fastcgi`, `tls self_signed`), so a file
copied from the snap install page was renamed each time it was put back. All
are Caddy 2 now and pass `caddy adapt`, as do the Docker Caddyfile and
Caddy.md's systemd unit.

The default the migration writes proxied to port 3000, where nothing of WeKan
listens in the snap. Both templates now read `port` and `caddy-bind-port` from
the snap settings. A test fails on Caddy v1 syntax anywhere and, with a Caddy
2 binary, adapts all 30 Caddyfiles.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.47 2026-10-15 WeKan ® release

**In short:** **Jira List Sync works from a Sandstorm grain** and the **Jira
import brings closed sprints**. Imports from **Jira, Deck, OpenProject, Asana
and GitLab** bring their **attachment files**, a board that fails to load says
so, and an **LDAP sync interval in milliseconds** no longer stops WeKan. **Every
language** is translated, Blockly included, and TODO Later is empty.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de95789e45">No live test logs anything from a login</a>. Thanks to GitHub CodeQL and xet7.</summary>

CodeQL alert #586 (clear-text logging): the Basecamp live test logged the
account id read from its environment. Planka's address and the GitLab test's
address and project path went into the log the same way. Every live test now
logs fixed words, and `tests/liveTestsNoSecretLogs.test.cjs` fails on any log
line of any live test that interpolates a value from a login. These are
human-run scripts, not the server, so there is no attempt to record in Admin
Panel → Problems.

</details>

and adds the following new features:

**Jira** - List Sync from a Sandstorm grain, and closed sprints in the import.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1dc5b82369">List Sync works from a Sandstorm grain</a>. Thanks to xet7.</summary>

It was recorded as impossible, because the bridge proxy takes the
Authorization header Jira needs. Sandstorm's HTTP driver keeps the sign-in in
the grant instead: in the Powerbox, connect to any address and enter
`https://EMAIL:API-TOKEN@your-site.atlassian.net`, and Sandstorm adds it to
every request; WeKan never sees it. The Powerbox request asks for Basic
authentication, and the List Sync popup says what to enter. Not run in a real
grain here.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cc0b8c60ba">The import brings closed sprints, rebuilt from the issues</a>. Thanks to xet7.</summary>

Jira's sprint report has no documented API, so a closed sprint was reported
and skipped. It is imported as closed now, its start and close snapshots
rebuilt from each issue's Sprint field, status and resolution at the sprint's
dates - from the change history when the export has `expand=changelog`, from
the issues as they are now otherwise - and marked partial. A closed sprint
with no dates is still reported. Not run against a live Jira here.

</details>

**Import** - attachment files that exports name but do not carry.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/51238ed8ad">Jira, Deck, OpenProject, Asana and GitLab imports bring their attachment files</a>. Thanks to xet7.</summary>

Their exports name attachments without the files, so the files were reported
as lost. Under **Attachment files** the import page asks for the service's
address and sign-in, and each file is downloaded from the service's documented
endpoint: Jira's attachment content, Deck's attachment API, OpenProject's
`downloadLocation`, Asana's `download_url`, and GitLab's project uploads API
for a private project. The sign-in goes with that one import, only to the
address typed, and is never stored or logged; every download goes through
the import's SSRF guard. A file that cannot be fetched is on the loss report.
Zenkit is left out: it publishes no way to download a file. Not run against
the live services here.

</details>

**Version Control view** - its Attachments tab.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/132b341b8d">Attachments have the card's controls and open in the viewer</a>. Thanks to xet7.</summary>

The Attachments tab listed each file as a link to a new browser tab. A click on
a file now views it in the card's attachment viewer, next and previous walking
the tab's files, and each file has the opened card's controls: view, download,
rename, delete and the cover / background menu, for the same members.

</details>

and fixes the following bugs:

**LDAP** - the background sync interval.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7dfd942ff6">A sync interval in milliseconds no longer stops WeKan</a>. Thanks to B2RN, tromlet and xet7.</summary>

The docs give LDAP_BACKGROUND_SYNC_INTERVAL in milliseconds, but the number
reached later.js's text parser, which threw "string.toLowerCase is not a
function" from a timer, and the snap stopped and restarted in a loop. A quoted
value such as 'every 1 mins' from a compose file never ran at all
([#2354](https://github.com/wekan/wekan/issues/2354)); the same crash on Snap 12.46
with LDAP sign-in is [#6771](https://github.com/wekan/wekan/issues/6771). Milliseconds and later.js
text both work now, with or without quotes; an unreadable value is logged and
the default is used, and nothing a setting holds can throw.

</details>

**Attachments** - renaming.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/515e63d322">Renaming a migrated attachment keeps its extension</a>. Thanks to xet7.</summary>

The rename popup appended extensionWithDot, which a migrated attachment can
lack, so a file became "nameundefined"; it falls back to the extension. Found
by running the new browser tests, which pass against a local server.

</details>

**Board loading** - a board restored from an old WeKan.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31615d7f98">A board that fails to load says so, and 6.09 attachments no longer break covers</a>. Thanks to xet7.</summary>

After a 6.09 to 10.85 restore, one board with attachments showed only the
loading animation. The board page waited forever when its publication stopped
with an error; it now says the board could not be loaded and points at the
server log, which names the cause. The client also took a pending legacy
lookup for a found attachment, which broke a 6.09 card's cover, and the legacy
attachments publication threw on a record whose type was not text. The board
itself was not reproduced: that needs its data.

</details>

**Archive** - restoring cards into lists that are full.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9edbcc858">Restore into a full list asks for another list instead of doing nothing</a>. Thanks to jullbo and xet7.</summary>

Restoring an archived card whose list had reached a hard WIP limit did nothing
at all, and Restore all skipped such cards silently
([#6772](https://github.com/wekan/wekan/issues/6772)). Restore now asks which
list to restore it to, offering only lists with room, and Restore all says how
many cards it left out. A list already over its hard limit blocks too, which the
old check let through; a soft limit still only warns.

</details>

**Search in the Email view and Public Boards** - results of the search typed.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49344f32f4">A search shows its own results, never the previous search's</a>. Thanks to xet7.</summary>

Both views subscribe in an autorun, so a new search starts before the old one
stops, and both sent their page's ids in one shared document: while both
existed, the older search's rows won, and a search for something that matches
nothing could still list the last search's card. Each search now has its own
page index, keyed the same way on the server and the client, and the view reads
only its own. Found running the Email view's browser test against the
production bundle.

</details>

**Chat view** - opening cards and folding panes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/230badf48e">A card from any board opens in the middle, and folded panes keep their carets</a>. Thanks to xet7.</summary>

A card clicked in the channel tree took the member to its board; it opens in
the middle pane now, with its conversation, from any board the member may
read. Folding Channels or Comments left only an icon; the double caret stays.

</details>

and has the following developer-facing fixes:

- [Two guards follow the Chat view and the live-test log fixes](https://github.com/wekan/wekan/commit/71b862c28c):
  the Chat comment check is on the card's board, and the live-test guard
  escapes every RegExp metacharacter. Thanks to xet7.
- [The Email and Chat browser specs pass against the production bundle](https://github.com/wekan/wekan/commit/160110d1b3):
  Compose's mail is caught by the local mail sink the other mail specs use, and
  the Chat spec waits for the sign-in after a reload. Thanks to xet7.
- [Every node suite passes again](https://github.com/wekan/wekan/commit/75534b5f1a):
  the thirteen translation guards that failed before this release, fixed in
  the locale where the locale was wrong (Bislama, Uzbek, Romansh, Tigre,
  Wolaytta, Tamazight) and in the guard where it was stale. Thanks to xet7.

and updates the following translations:

**Languages updated:** 82 languages.

**Every language** - the last of the backlog, Blockly's editor included.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c6a94c734">The remaining strings of 82 languages are translated</a>. Thanks to xet7.</summary>

About 46,000 values still equal to English, Blockly's editor messages
included, in the 82 languages that had them - Klingon, Tamazight, Volapük,
Cherokee, Inuktitut, Wolaytta and the rest - translated directly from each
language's existing wording, in three more commits -
[20 more languages](https://github.com/wekan/wekan/commit/d698d6a1d6),
[12 more](https://github.com/wekan/wekan/commit/7cbbec8836) and [the last English strings](https://github.com/wekan/wekan/commit/d085a30f2d), which also
translates key names and Blockly's math terms the way established locales do.
Placeholders were checked against English and only English placeholders were
filled; a speaker's Transifex translation replaces any of them, and the
commits name the low-confidence ones. What stays equal to English is the
language's own word, or in Blockly an operating system or a key label.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f4126b9514">Attachment files on the import page and a board that failed to load, in every language</a>. Thanks to xet7.</summary>

The five new strings of this release.

</details>

and tidies the backlog:

- [Close the built issues and keep only unbuilt work in TODO Later](https://github.com/wekan/wekan/commit/707021fee2):
  #5758, #2698, #337 and #2208 are closed, also where they are not yet
  tested live. Thanks to nikalasmd, ndarilek and xet7.
- [Close #4790: User Filter is covered by what WeKan has](https://github.com/wekan/wekan/commit/0d68c3536b):
  organizations and teams, LDAP group sync, board sharing and custom roles.
  Thanks to xet7.
- [No speaker review and no undocumented formats in TODO Later](https://github.com/wekan/wekan/commit/aad7e1414a).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.46 2026-10-14 WeKan ® release

**In short:** Accounts can be locked to **SQRL**, Windows domains can sign in
with **Windows single sign-on**, **List Sync writes back to GitLab**, and boards
import straight from **Planka, Microsoft To Do, KanbanFlow, Basecamp, Google
Tasks and Google Keep**. The **Chat view** lists every conversation with unread
counts, and titles render as **Markdown** in more views. Two changes at once
no longer fork a board's **History**, and large sprint undo is faster.
**Bosnian** says Tabla
for board throughout, and **Tsonga** has its own word for the Archive.

This release adds the following new features:

**Signing in** - accounts locked to SQRL, and Windows domain sign-in.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a539429fce">SQRL's sqrlonly and hardlock lock an account to SQRL</a>. Thanks to xet7.</summary>

The member's SQRL client sends both options with every sign-in, and WeKan
follows the latest. sqrlonly refuses every other way of signing in - password,
OIDC, LDAP, SAML, CAS, passkey, Nextcloud, the REST `/users/login` and header
login. hardlock sends no password-reset e-mail (answering as if it did),
refuses a reset link sent before, and refuses the member's own e-mail change.
Disabling SQRL from the client, the admin switching SQRL off, and an admin's
own changes are the ways back. `tests/sqrl.test.cjs` drives both through the
protocol with a real Ed25519 client and lists every file that mints a login
token, so a new one cannot skip the check.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a594a58117">Windows single sign-on with Kerberos or NTLM</a>. Thanks to nikalasmd and xet7.</summary>

[#5758](https://github.com/wekan/wekan/issues/5758). On Windows, with
`WINDOWS_SSO_ENABLED=true` and node-expose-sspi installed in the bundle,
"Sign in with Windows" runs the browser's Negotiate handshake, and a one-time
token signs the page in through the ordinary login checks. Only the domains in
`WINDOWS_SSO_DOMAINS` are let in (empty means nobody), and a same-named local
account is taken over only with `WINDOWS_SSO_MERGE_EXISTING_USERS=true`. Built
without a Windows domain to test against: the decisions are tested in
`tests/windowsSso.test.cjs`, the handshake is not, and
[WindowsSSO.md](docs/Features/Login/WindowsSSO.md) says how to set it up.

</details>

**List Sync** - writing back to the tracker.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d6c1d6fce1">WeKan's changes are written back to GitLab</a>. Thanks to gotjoshua and xet7.</summary>

Part of [#2698](https://github.com/wekan/wekan/issues/2698). A GitLab list's
Sync option "Write changes back to GitLab", off by default: every run first
sends titles and descriptions edited in WeKan (never over a conflict),
comments as notes, archiving as closing and restoring as reopening, then reads
GitLab. Only what happens after it was switched on is sent, each write is
fenced by the list's Sync reservation, and a refused write is shown in the
popup while the read sync goes on. `tests/listSyncWriteBack.test.cjs` and a
Meteor test against a fake GitLab cover it; build.sh / build.bat → Tests →
Live tests runs it against gitlab.com with the mirror's glab login.

</details>

**Import** - boards fetched from other services' APIs.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46e30f01e4">Planka, Microsoft To Do, KanbanFlow, Basecamp, Google Tasks and Google Keep import from their APIs</a>. Thanks to xet7.</summary>

On the import page each asks for what its service needs, lists what that
account can import and fetches it; the credentials are used for that call
only and never stored. The fetched JSON imports like a pasted export,
through the service's parser and the members step. Every request goes
through the SSRF guard (an administrator can allow a private host with
`API_IMPORT_ALLOWED_PRIVATE_HOSTS`). Each service has its tests, a docs
page, and a read-only live test in build.sh / build.bat → Tests → Live
tests, not run here.

</details>

**Chat view** - every conversation, folded by workspace, board, swimlane and
list.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ee3e83793">Channels are the cards with a conversation on every board, with unread counts</a>. Thanks to xet7.</summary>

The tree holds workspaces, boards, swimlanes, lists and the cards that have
messages; boards without any are under Other boards until their first
message. Each level has a caret before its icon (mirrored right to left)
and slides open; a board folds instead of leaving the view. Every level
shows what this member has not read, every name renders as Markdown, and
only what the member may read is sent.

</details>

and makes the following faster:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e671c7034">Batch undo and redo of a large sprint is 2.6 times faster</a>. Thanks to xet7.</summary>

Undoing a 10,500-card sprint close took 282 s and redoing it 578 s, about
thirty database round trips a card. A History row's records are now read in
one query per type, with one ownership check before and one after the read,
and every write is still fenced right before it. The 10,500-card test went
from 14 min 27 s to 6 min 7 s; `tests/scrumHistoryWriteState.test.cjs` pins
the bracketed read and that every write stays fenced.

</details>

and fixes the following bugs:

**History** - one board, two changes at once.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66dd9b0938">Two changes saved at the same moment no longer fork a board's History chain</a>. Thanks to xet7.</summary>

The legacy append read the newest row and inserted after it in two steps,
so two changes at once named the same previous row: Admin Panel → Problems
called it critical HistoryIntegrity tampering, 89,062 times, and undo was
refused for both rows. A board's appends now take turns and link after the
chain's tip. The hourly audit reports each finding once, board by board,
and a fork of two intact rows saved within a minute is reported as a
writer race, not tampering. Existing forks stay as they are.

</details>

**Board views** - titles and activity that showed raw text.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5481268558">The email view renders its subjects and previews as Markdown</a>. Thanks to xet7.</summary>

"# Demo card :thumbsup:" and "**Markdown**" showed as text. Subject and
preview go through the viewer like every card title, the preview cut at a
line end instead of inside a link, and two lines of it shown.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2cc6b93ed9">Version Control, the activity feed and the email list render titles as Markdown</a>. Thanks to xet7.</summary>

Issues, labels, milestones, wiki pages, the feed's cards and boards, and
the email folders render through inlineViewer, with the Admin Panel's
security settings; clickable titles are spans with role=link, since a
rendered link cannot sit inside a link.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f12b718d81">The activity feed names the checklist, item, lists and people it is about</a>. Thanks to xet7.</summary>

It filled only the card, list and board, so it showed `__checklistItem__`,
`__oldList__` and the like, and raw names for ten kinds of activity that had
no sentence at all. Every name is filled now - never a field's value, a
comment only for a member who may read comments - and those ten have
sentences, translated, in the notifications too.

</details>

and has the following documentation:

- [How WeKan, Rocket.Chat and a G Suite SAML login chain together](https://github.com/wekan/wekan/commit/03b83c14c1):
  the redirect login style, Rocket.Chat's and Google's settings, and the
  direct alternatives, in OAuth2.md. Fixes
  [#6549](https://github.com/wekan/wekan/issues/6549). Thanks to timmy-mac and
  xet7.

and has the following developer-tooling fix:

- [oauthProviders follows the translated login-error list](https://github.com/wekan/wekan/commit/b38532ed72):
  the SQRL refusals joined the conflict in one list of translated codes.
  Thanks to xet7.
- [Three guards follow the History fork and GitLab write-back fixes](https://github.com/wekan/wekan/commit/5fee137f01):
  Sync admission pins the tip walk, the write-back's read is not named
  fetch, and the new card field is in the e-mail inventory. Thanks to xet7.
- [Three more guards follow the importers and the feed](https://github.com/wekan/wekan/commit/a6a1d3c1a6):
  the feed's stylesheet is imported, two importers strip tags to a fixed
  point, and a guard escapes every special character. Thanks to xet7.

and fixes the following translations:

**Languages updated:** Bosnian, Tsonga, Croatian.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0502261090">Bosnian says Tabla for board, and Tsonga keeps the Archive apart from storage</a>. Thanks to xet7.</summary>

Bosnian used both ploča and tabla for a board; every board string uses tabla
now, with ploča left only for the dashboard and the Admin Panel, and the board
search abbreviation is tb. Tsonga's Archive is "vuhlayiselo bya swa khale",
while storage stays "vuhlayiselo". Bosnian and Croatian translate S3 port.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.45 2026-10-14 WeKan ® release

**In short:** **Sync and rule notifications** are delivered again with the clear
e-mail layout, and the **musl**, **Android**, **FreeBSD**, **Windows
single-file** and **Bun** builds that stopped publishing in v12.41 build again.
**Latvian**, **Tsonga** and **Bosnian** are translated where they were
Lithuanian, filler or Serbian, and the attachment viewer's picture gets **alt
text**.

This release fixes the following bugs:

**Notifications and accessibility** - Sync notifications, and an image name.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e85eaa3ad3">Sync and rule notifications are planned again with the clear e-mail layout</a>. Thanks to xet7.</summary>

v12.44 made the clear HTML layout the default for notification e-mail, and
with it every e-mail job carries its plain-text part. The Sync notification
plan accepted exactly seven job fields, so it refused every plan, and a rule or
Sync run's notifications failed with `sync-notification-plan-invalid`. It now
takes what the e-mail outbox takes, checked the same way, and
`tests/syncNotificationPlan.test.cjs` pins that the two lists are the same.

</details>

- [The attachment viewer's picture has alt text](https://github.com/wekan/wekan/commit/a530a3c673):
  "Preview" until a picture opens, then the file's name; a guard fails on any
  image without alt. Part of #337. Thanks to ndarilek and xet7.

**Release builds** - the platforms v12.41 to v12.44 did not publish.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5331e06199">musl and Android bundles give sharp its platform package where it is</a>. Thanks to xet7.</summary>

sharp is an application package, under programs/server/npm, but its glibc
platform packages were removed from programs/server/node_modules and the musl
ones never arrived, so "Cannot find module 'sharp'" ended the musl builds.
platform-native-packages.mjs now takes --libc musl. Android builds sharp from
source in its own directory, falls back to WebAssembly with a warning, and no
longer stops at "chmod: Operation not permitted" in Termux.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d23746441">The FreeBSD bundles start</a>. Thanks to xet7.</summary>

The launcher ran every binary through cpu-exec, a Linux #!/bin/bash script, and
FreeBSD has no /bin/bash: "cpu-exec: not found". It is used only on Linux with a
/bin/bash, and the BSD bundles drop it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0966a90d39">The Windows single files start</a>. Thanks to xet7.</summary>

Node.js mounts the archive at `\\.\NUL\vfs`, which Meteor's path conversion
turned into a C: path, so the server stopped with "Cannot find module 'denque'";
the single file carries a patched mini-files.js that keeps device and UNC paths.
A 32-bit single file is built by a 32-bit Node.js now, because the SEA blob
stores its lengths as size_t: win32 found no archive, and i386 and 32-bit ARM
had the same fault unseen.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/41399b7518">The Bun FreeBSD and Windows bundles build</a>. Thanks to xet7.</summary>

FreeBSD packages libvips 8.18.6 and sharp 0.35.5 asked for 8.18.7; a
patch-release gap is accepted with a notice. A CDN HTTP 500 is retried, and the
checksum files are LF on every platform.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ce3d4310d5">The Docker image copy to Quay retries a dropped connection</a>. Thanks to xet7.</summary>

An HTTP/2 stream reset failed the copy; a transport error is retried up to four
times, and a refusal still fails at once.

</details>

and fixes the following translations:

**Languages updated:** Latvian, Tsonga, Bosnian, Macedonian, Persian, Cantonese,
Occitan, Aromanian.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e0649b0cfb">Latvian is Latvian, and wrong words are gone wherever they were</a>. Thanks to xet7.</summary>

The first half shipped in v12.44 with Updated translations: Spanish Save is
Guardar, the Bosnian file is in Latin script and Romanian's Italian words are
Romanian. This finishes it: 225 Lithuanian values in the Latvian file are
Latvian, in the file's own words, and the same wrong words are replaced under
every key - Macedonian Настройки, the Persian settings typo, Cantonese 依戀 in
the attachment search operator and Occitan "mot de Santa-Clara" for password.
`tests/wrongLanguageCorrections20261014.test.cjs` fails on any Lithuanian left
in the Latvian file and checks its placeholders.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac2410fead">Tsonga, Bosnian and Aromanian are translated where they were filler or Serbian</a>. Thanks to xet7.</summary>

Tsonga had 618 values of the filler "Hi Xitsonga: mhaka" and 831 more padded
with a repeated "mhaka" wherever its generator had no word; all are translated
now. The Bosnian values that were Serbian are ijekavian Bosnian, with the
file's own words for board, card and list, and Aromanian's "Calendario" is
"Calendar". The test fails on any filler, padding or ekavian form left.

</details>

and has the following developer-tooling fix:

- [problemsMenuOrder and sandstormWebhookEgress follow two v12.43 changes](https://github.com/wekan/wekan/commit/c11fd215c4):
  the recovery list's toolbar actions are not menu panes, and webhooks to a
  site admin's internal hosts are not fetchSafe's. Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.44 2026-10-14 WeKan ® release

**In short:** sign in with a **passkey** or **SQRL**, and **log out
everywhere**. **Browser push**, an **activity feed** and **ntfy** bring
notifications anywhere, and webhooks **direct-message** on **Mattermost**. Card
descriptions are **edited together, live**; cards can be **drawn on**, be
**Stories** or **Tasks**, and mark **unread changes**. Boards get **column
sets**, **linked lists** and a **Table view** that adds and drags cards, and
**All Boards** gives each team a tab. **Nextcloud** gets **CalDAV** sync and
**WebDAV** storage, public boards join the **fediverse**, and two **CodeQL**
alerts are fixed.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/587efab82b">Two CodeQL alerts in a test, and every test pattern of the same shapes</a>. Thanks to GitHub CodeQL and xet7.</summary>

CodeQL alerts #584 (bad HTML filtering regexp) and #585 (incomplete regular
expression for hostnames), both in `tests/accountEmailHtml.test.cjs`: it
checked that the e-mail layout escapes markup with `/<img|<script|<b>/`, which
a `<SCRIPT>` passes, and made the reset address into a RegExp. It now lists
every tag of the output in any letter case and allows only the layout's own
`div`, `p`, `a` and `br`, and compares the address as text. The renderer was
already escaping them.

Both are pinned as shapes across the tree in
`tests/securityAlerts20261012.test.cjs`, which found more: a case-sensitive
`<script>` pattern in `jsWebLabels.test.cjs`, a path spliced into generated
code in `singleFile.test.cjs`, and twelve test patterns with a host name's dot
unescaped. These are in tests, so there is no attempt at runtime to record in
Admin Panel → Problems.

</details>

and adds the following new features:

**Sign-in** - how members sign in and out, and who is told.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63ef900d56">Passkey login, and Log out everywhere</a>. Thanks to xet7.</summary>

Member Settings / Passkeys adds a passkey on this device under a name and
removes one; the sign-in page has "Sign in with a passkey", with no user name
needed. Verification is @simplewebauthn/server (pinned) against ROOT_URL's host
and origin, with a single-use challenge that expires in five minutes and a
signature counter that must move forward. Passkeys are never published. Log out
everywhere ends every session of the account, this one too.
`tests/passkeys.test.cjs` signs with a software authenticator and refuses
another key, origin, challenge or a counter that went back; a Meteor runtime
test checks the server loads. [Passkeys](docs/Features/Login/Passkeys.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ea256dd772">A login and registration webhook in the Admin Panel, off by default</a>. Thanks to KrunalDholakiya and xet7.</summary>

Admin Panel / Settings / Global Webhooks tells one address when somebody logs
in or an account is made, only for the ticked events. It carries the event,
the user name and the time; the email, IP address, full name and sign-in
method only when ticked. It is sent after the login, through the SSRF guard,
and is never published. `tests/accountWebhook.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c940b3e301">Sign in with SQRL, from a phone or a computer</a>. Thanks to xet7.</summary>

[SQRL](https://www.grc.com/sqrl/sqrl.htm) signs in with a SQRL app or client
instead of a password, after a site admin turns it on (Admin Panel → Settings →
Visibility → Features, off by default). A member adds their identity once in
Member Settings → SQRL; the sign-in page then shows a `sqrl://` link and its QR
code and signs in by itself when the client has answered. WeKan keeps only the
identity's public keys, never published and not writable from the client.

Every nut is random and used once, each request must carry the server's
previous reply unchanged, and every request is checked with Ed25519 (Node.js's
own `crypto`). An unknown identity can neither make an account nor sign in;
disable, enable, remove and rekey follow the protocol, the last three only
with the rescue code's unlock key. `tests/sqrl.test.cjs` drives the real
handler with a software SQRL client, forged signatures, replays and altered
replies included, and `server/lib/tests/sqrl.tests.js` adds an identity and
signs in through the running server. Documented in
[SQRL.md](docs/Features/Login/SQRL.md).

</details>

**Notifications** - where they arrive and how they look.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d873af70e8">ntfy phone notifications, per member</a>. Thanks to xet7.</summary>

Member Settings / Notification Settings takes a member's ntfy topic address
and token; each notification they get also arrives in the ntfy app, with a tap
opening the card. JSON publishing, through the SSRF guard, best effort, and the
topic is never published. `tests/ntfy.test.cjs`,
[ntfy](docs/Features/Notifications/ntfy.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/058677e078">E-mails in the clear HTML layout by default</a>. Thanks to Meeques and xet7.</summary>

Notification e-mail defaults to the clearly arranged layout of \#5171, classic
one choice away; account e-mails (reset password, verify, new account,
invitations) get an HTML part built from the same translated text, everything
escaped and only http(s) linked. `tests/accountEmailHtml.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/349d6dc5e6">Webhooks can also direct-message the card's people on Mattermost</a>. Thanks to xet7.</summary>

A webhook's new tick sends each message about a card to its members and
assignees as `@username`, never to whoever made the change, at most 50.
`tests/mattermostDirectMessages.test.cjs`,
[Mattermost](docs/Features/Webhooks/Chat/Mattermost.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a5ae3e205">Browser push notifications, per device</a>. Thanks to saurabharch, hingerl and xet7.</summary>

Member Settings → Notification Settings → Browser notifications on this
device: every notification the member gets also pops up from that browser,
even with WeKan closed, and a click opens the card. web-push 3.6.7 (pinned)
sends it with this WeKan's own VAPID keys. A subscription is accepted only over
https and only at the push services browsers use, checked when saved and
before every send. Not offered on Sandstorm.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/656af74b2c">An activity feed across all of a member's boards</a>. Thanks to xet7.</summary>

Member menu → Activity on all my boards lists what happened on every board the
member sees, newest first, 50 at a time, in the sentences the notifications
use. It never carries a field's value, follows the assigned-only rule, and is
empty when the Admin Panel turns activities off. `tests/activityFeed.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3321926ab">Webhooks: pick which activities a webhook is sent</a>. Thanks to xet7.</summary>

The webhook form gets "Send this webhook:" with Every activity and a tick per
kind of activity - the groups notifications are muted by. Nothing ticked stays
"all", so a webhook never silently gets nothing.
`tests/webhookActivityPicker.test.cjs`.

</details>

**Rules** - who sees them, and who their e-mails go to.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f4a3690256">Board members can be shown the Rules, read-only</a>. Thanks to justinr1234 and xet7.</summary>

An Admin Panel option, off by default, lets board admins tick "Show these
Rules to board members, read-only"; members then read the rules list and
details with no control that changes them. Without both ticks only admins see
the Rules page. `tests/rulesReadOnly.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/75e260966b">Pick board members for a rule e-mail's To field</a>. Thanks to chenghongxi and xet7.</summary>

A member picker with autocomplete adds `@username`, which becomes that member's
current address when the rule runs; free addresses still work, and a name of
somebody outside the board is dropped. `tests/ruleEmailMembers.test.cjs`.

</details>

**Boards** - subtasks, teams and leaving a board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/740c3920eb">Board Settings / Subtasks picks the swimlane new subtasks land in</a>. Thanks to BjoernLudwig and xet7.</summary>

Beside the landing list; unset keeps the parent's swimlane title, else the
default. `tests/subtaskLandingSwimlane.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1acc9f2b9f">Leaving a board that came through a team hides it, restorably</a>. Thanks to LaureHades and xet7.</summary>

Such a board goes into the member's hidden list, out of All Boards, and Member
Settings / Hidden boards restores it; the team membership is untouched.
`tests/hiddenBoards.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed2649f702">A board admin may add only the organizations and teams they belong to</a>. Thanks to chrisi51 and xet7.</summary>

Site admins may add any; links already on a board stay, and removing is always
allowed. The pickers offer only the admin's own groups.
`tests/boardGroupLinks.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2fd3993538">A linked whole list: a live mirror of another board's list</a>. Thanks to javen9881 and xet7.</summary>

The add-list form can link a list from another board: its cards appear live
and stay the source board's cards, under its rules, and a card typed into the
mirror is added to the source list only for somebody who may write there. The
cards are published only to a subscriber who sees both boards. No self links,
archived or foreign lists, or mirrors of mirrors. `tests/linkedList.test.cjs`.

</details>

**Cards and checklists** - kinds of card, subtasks from other boards, and
who does each checklist item.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d77882c3b">Story and Task cards, with custom fields of their own</a>. Thanks to nightwind27 and xet7.</summary>

Card menu / Card kind makes a card a Story or a Task, with a badge on the
minicard. A custom field limited to a kind is added to a card when it gets
that kind and shown only on cards of it. `tests/cardKinds.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9af50ff07">An existing card from another board as a subtask</a>. Thanks to TiibCD and xet7.</summary>

The existing-card picker gets a board picker; another board's card is
attached on the server, which checks write access to both boards and loops
through every parent. `tests/crossBoardSubtasks.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7ca1489279">A person responsible for each checklist item, and dated items in the calendar and Gantt</a>. Thanks to martinbruno90 and xet7.</summary>

Each item gets a responsible board member. Items with a due date appear in
the calendar and both Gantt views as "card: item"; moving one moves only the
item's date. `tests/checklistItemSchedule.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9138e85091">Edit a card description together, live</a>. Thanks to dalareo and xet7.</summary>

Everybody with a card's description open edits one shared Yjs document, so two
people typing at once both keep what they typed instead of the later Save
replacing the earlier. The editor stays the Markdown textarea, with the caret
kept where it was; Save writes the description as before. The document is
published only to people who may edit the card, merged with a conditional
write, size-limited and rate-limited, and started again when the description
changes some other way. yjs 13.6.33 (pinned). `tests/sharedDescription.test.cjs`
runs the real Yjs.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c772769c0e">Draw or write by hand on a card, saved as PNG and SVG</a>. Thanks to aleroot and xet7.</summary>

Card menu → Drawing: draw with a mouse, pen or finger, undo and clear. The
strokes stay on the card so the drawing can be edited later, and a PNG is
uploaded as an attachment; Download as SVG builds the SVG from the strokes.
Only numbers and the allowed colours and widths reach the SVG.
`tests/cardDrawing.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8690a26f5">Cards changed since a member last opened them are marked</a>. Thanks to Lacour20, martinpospech and xet7.</summary>

Member Settings → Mark cards changed since I last opened them, off by default:
a minicard gets a blue edge when its fields, checklists, attachments or
comments changed after the member last opened it. Turning it on does not mark
every old card, and the member's own edits do not mark it.
`tests/unreadChanges.test.cjs`.

</details>

**Board views** - the Table and Swimlanes views.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a566dc9ac">The Table view adds cards, and moves them by dragging a row onto another</a>. Thanks to guakamole and xet7.</summary>

An add row under the table takes a title, list and swimlane, checked on the
server; dropping a row puts its card just before the target card.
`tests/tableViewDrop.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d95bda245">One shared, sticky list header row for all swimlanes</a>. Thanks to mikesutton and xet7.</summary>

A Board Settings / Swimlane setting, off by default: the first swimlane's list
headers stay at the top, through the existing sticky rule, and the others are
not repeated. `tests/sharedListHeaders.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03d0144538">Column sets: the same cards in several named sets of columns</a>. Thanks to kentonv and xet7.</summary>

A new board view. A board keeps named column sets - say Completion, Priority,
Milestone - and every card is in one column of each set. Dragging a card moves
it only within the shown set, and each card shows its columns in the other sets
as coloured labels. Board admins make the sets; the Admin Panel can turn the
view off. Documented in [Column-Sets.md](docs/Features/Board/Column-Sets.md).

</details>

**All Boards** - finding boards among many.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/000bc1c490">Boards grouped by first character, organization, team and board label</a>. Thanks to xet7.</summary>

A facet bar shows each group with its count, and a click shows only that
group. Board labels are the member's own, applied to every board whose name
includes some text. `tests/allBoardsFacets.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d04b8444a6">A tab per organization and team, where their admins manage members</a>. Thanks to xet7.</summary>

The left menu of All Boards gets a tab for each organization and team the
member is in, with its boards and its members. The group's admins and site
admins add and remove members there; a group that comes from LDAP or another
directory is read-only, because WeKan never writes directory groups back.
`tests/groupMembers.test.cjs`.

</details>

**Platforms** - phones, Sandstorm and free JavaScript.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52b0ea0d81">Share to WeKan from other Android apps</a>. Thanks to memeplex and xet7.</summary>

The manifest's share target opens "Add to WeKan": pick a board and list and
what was shared becomes a card. The server checks the right to write in that
list. `tests/shareTarget.test.cjs`,
[Android](docs/Platforms/FOSS/OS/Android.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1d806de2c">On Sandstorm, Copy card URL shares the card through Sandstorm</a>. Thanks to AlexanderZobkov and xet7.</summary>

It opens Sandstorm's Share Access dialog for the card's page, whose link opens
the grain there; elsewhere it copies as before. `tests/sandstormShare.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/631a7fdfe2">LibreJS license information for the browser bundle</a>. Thanks to alexgleason and xet7.</summary>

`/jslicense.html` is a JS Web Labels table of the scripts actually served, and
every page links it with `rel="jslicense"`. `tests/jsWebLabels.test.cjs`.

</details>

**Nextcloud and the fediverse** - calendars, files and followers outside WeKan.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c76f3e2e98">CalDAV: card due dates in Nextcloud Calendar or any CalDAV calendar</a>. Thanks to scriptPilot and xet7.</summary>

Board Settings → Date → Calendar sync: each card with a due date is one event
in the chosen calendar, removed when the due date goes, and a due date moved in
the calendar comes back to the card every 15 minutes. The calendar's password
is never published and only a board admin sees the link; requests go through
the SSRF guard. `tests/caldavSync.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4234081752">WebDAV attachment storage: Nextcloud Files or any WebDAV server</a>. Thanks to scriptPilot and xet7.</summary>

Admin Panel → Attachments → WebDAV (Nextcloud Files), beside S3, Azure and
Google Cloud Storage, with the same switches, connection test, default storage
and Move Attachment. The password is a secret field like the others, and
redirects are refused. With CalDAV this completes #687; the Nextcloud ExApp is
built by `.github/workflows/nextcloud.yml`. `tests/webdavStorage.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf633b9c72">ActivityPub: a public board can be followed from Mastodon</a>. Thanks to ASLLR and xet7.</summary>

Admin Panel → Settings → Visibility → Features → ActivityPub, off by default:
each public board is an actor, `@board-<id>` at this WeKan, and its new card
activity reaches its followers as signed Notes. It is read-only - only signed
Follow and Undo Follow are acted on - and a private board is never an actor.
Outgoing requests go through the SSRF guard. `tests/activityPub.test.cjs`.

</details>


and fixes the following bugs:

**Speed** - finding a card's subtasks.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c6c0c6021">Finding subtasks no longer scans every card</a>. Thanks to Raymond-Voogt and xet7.</summary>

Subtasks of several parents are found with `{ $or: [{ parentId }, { parentIds }]
}`,
and only `parentId` had an index - a `$or` uses indexes only when every branch
has one, so removing, copying and exporting cards scanned the whole collection.
`parentIds` has its own index now, and `tests/cardQueryIndexes.test.cjs`
requires
an index for every branch of every subtask `$or`.

</details>

**Startup** - a schema WeKan could not start with.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3966fa6b9">Story and Task cards no longer stop WeKan at startup</a>. Thanks to xet7.</summary>

The unreleased Story and Task commit declared `cardKinds` as `type: [String]`,
which the schema library refuses at startup. It is `type: Array` with a
`cardKinds.$` entry, and `tests/cardKinds.test.cjs` pins the form.

</details>

**Accessibility** - screen readers.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d71c6f925">Every icon-only link and button has a name for screen readers</a>. Thanks to ndarilek and xet7.</summary>

21 controls showed only an icon and had no name: the drag handles, the inline
forms' close buttons, a card's date buttons, the notification drawer, History's
previous and next and others. Each has a translated title, which becomes its
`aria-label`, and `tests/iconOnlyControlLabels.test.cjs` scans every template
for an unnamed icon-only control. Part of #337.

</details>

and has the following developer-tooling and translation changes:

- [The new strings translated in all 234 locales](https://github.com/wekan/wekan/commit/fdc52787e1). Thanks to xet7.
- [The Mattermost, Share to WeKan, passkey and hidden board strings translated](https://github.com/wekan/wekan/commit/5409e059ae). Thanks to xet7.
- [The risk baseline allows the Sandstorm share helper's addresses](https://github.com/wekan/wekan/commit/a4727e6764). Thanks to xet7.
- [The cross-board subtask, checklist owner, shared header, facet and card kind strings translated](https://github.com/wekan/wekan/commit/946f032883). Thanks to xet7.
- [The push, linked-list, column-set, drawing and team-tab strings translated](https://github.com/wekan/wekan/commit/2b84e6b616). Thanks to xet7.
- [The ActivityPub, CalDAV and WebDAV strings, translated](https://github.com/wekan/wekan/commit/2c9df4db88). Thanks to xet7.
- [The SQRL strings translated](https://github.com/wekan/wekan/commit/b0e47537e0). Thanks to xet7.
- [A test pins the issue's own example of keeping #label and @member](https://github.com/wekan/wekan/commit/cd4c4ad9ce), which shipped in v12.43. Thanks to biji and xet7.
- [A guard skips every rspack output directory, not only _build](https://github.com/wekan/wekan/commit/5f2dd80f41). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.43 2026-10-14 WeKan ® release

**In short:** **Bots** hand cards to external runners such as an AI agent, a
CI job or a script, as kanbots does, with no rights of their own. Board search
**reveals each card it finds** on the board, lists **sort by label order**, and
a Member Settings switch **keeps #label and @member** in new card titles.
Webhooks may reach **internal hosts** a site admin lists, the activity
notification **recovery list drains**, and the **FreeBSD** bundle runs as a
service.

This release adds the following new features:

**Bots** - external runners a board hands cards to.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aa48a2b71d">Board Settings / Bots: hand cards to an AI agent, CI job or script, as kanbots does</a>. Thanks to xet7.</summary>

Board Settings → **Bots**, below Workflow view, is the Rules page's view for
bots, laid out like kanbots in the board's theme. The rail lists the bots,
the live runs and their activity. The board's lists are the columns, each
card showing its run's state, its current step and the answers to the bot's
question. The drawer shows the card's thread, **Hand to bot**, **Stop** and a
reply box. A bot has no rights of its own. WeKan only sends to it: a dispatch
goes through the outgoing-webhook queue, behind the SSRF guard and signed,
and a bot receives no board activity. The runner works on the board through
WeKan's REST API with its own user's role, and reports at one route that
needs write access. Board admins only: in the view, or with the new Rule
action **Hand the card to bot**. See [Bots](docs/Features/Automation/Bots.md).
Tests: `tests/botRuns.test.cjs` and `server/lib/tests/bots.tests.js`.

</details>

**Search** - finding a card on the board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c239177cd8">Board search shows each card found on the board, and Enter steps to the next</a>. Thanks to rlach and xet7.</summary>

A result opened from the board search is also scrolled into the middle of
the board and highlighted for a moment. Enter again in the search box steps
to the next card found, wrapping round, with "2 of 7" under the box, as
finding on a page works. Shift+Enter or the arrows beside the count step back
([previous](https://github.com/wekan/wekan/commit/7dd484f8c2)). A list found is
revealed the same way. Tests:
`tests/revealOnBoard.test.cjs` (jsdom), and a Playwright spec in
`tests/playwright/specs/04-search.e2e.js`.

</details>

**Labels and avatars** - order and recognition at a glance.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cba618e2f9">Sort a list by the board's label order</a>. Thanks to mnantel and xet7.</summary>

Board admins move a label up or down when editing it, and Sort cards has
**Label order**: a card comes where its first label comes, and cards without
labels come last. It is a display order only, like Sort by votes: it never
changes the dragged order. `tests/labelOrder.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c56c03d202">Minicard avatars in the order people were added, each with its own colour</a>. Thanks to HolgerGH and xet7.</summary>

The minicard floated each avatar to the end of its row, which drew them
reversed: the first person added, whom a team treats as responsible, came
last. They are a wrapping row in added order now, still right-aligned, as
issue \#5081 asked. Each person's initials avatar has a lasting colour of
their own, readable at WCAG AA, and the tooltip names them.
`tests/avatarColor.test.cjs`.

</details>

**Webhooks** - where they may go.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b4d2604e61">Outgoing webhooks may reach the internal hosts a site admin lists</a>. Thanks to xet7.</summary>

Admin Panel → Settings → Global Webhooks → **Internal destinations** lists
hosts on WeKan's own network that outgoing webhooks may reach: a Node-RED, a
chat server, a Matrix hookshot. Each entry is a name or an address, with a
port to allow only that port. It is empty by default. Only site
administrators read and change it, through methods, and it is never
published, so a board member still cannot point a webhook inward. A listed
host is called without following redirects; everything else stays behind
the SSRF guard. `tests/internalWebhookHosts.test.cjs`.

</details>

**Documentation** - how-tos the decided issues asked for.

- [Bitbucket login through the generic OAuth2 settings](https://github.com/wekan/wekan/commit/f715e95b40), checked against the OIDC code. Thanks to thuanpq and xet7.
- [Matrix notifications through an outgoing webhook and matrix-hookshot, no bot](https://github.com/wekan/wekan/commit/dff0856585). Thanks to killua-eu and xet7.
- [RFID tags moving cards through the REST API](https://github.com/wekan/wekan/commit/c47fe98ab0). Thanks to xet7.
- [WeKan on current Rancher with the Helm chart](https://github.com/wekan/wekan/commit/28477b5a85). Thanks to Dreampie and xet7.

**Member Settings** - how a new card's title is typed.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6b2938e1c">Keep #label and @member in a new card's title, as a Member Settings switch</a>. Thanks to biji and xet7.</summary>

Picking a label with `#` or a member with `@` while typing a new card's title
gave the card that label or member and removed the text from the title. Member
Settings → **Keep #label and @member in new card titles** keeps the text as
well, for those who read the title as a sentence. It is off by default, so
nothing changes unless a user turns it on. `models/lib/titleTags.js` decides
what stays; `tests/titleTags.test.cjs` checks both settings, a label known
only by its colour, and that nothing like `@undefined` is ever left. The two
strings are in every locale
([translations](https://github.com/wekan/wekan/commit/8fd04f9984)).

</details>

**Platforms** - where WeKan runs.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9a29dbd8b7">The FreeBSD bundle runs as a service, with an rc.d script</a>. Thanks to xet7.</summary>

`bundle/rc.d/wekan` in the FreeBSD bundle runs the bundle's own
`start-wekan.sh` - the bundled Node.js and FerretDB on SQLite - under
`daemon(8)` as an unprivileged user, set up in `rc.conf`: `wekan_enable`,
`wekan_port`, `wekan_root_url`, `wekan_data`, `wekan_env`. `service wekan
stop` stops FerretDB with WeKan. The FreeBSD bundle job fails without it.
[FreeBSD](docs/Platforms/FOSS/OS/FreeBSD.md) has the install steps and an
outline of a ports Makefile to propose to FreeBSD.
`tests/freebsdRcScript.test.cjs`.

</details>

and fixes the following bugs:

**Notifications and background jobs** - large instances.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e0317a9ff3">The activity notification recovery list drains, and old entries expire</a>. Thanks to Raymond-Voogt and xet7.</summary>

The recovery scan retried every pending notification each round. One that
can never be delivered failed every time and stayed forever: its activity
was deleted or changed, a recipient lost access, or its plan had nothing or
too much to send. After a ten-minute grace such a notification is now
cancelled through the administrator's own cancellation, as the system.
Pending notifications older than `ACTIVITY_NOTIFICATION_MAX_AGE_DAYS` (7)
expire. Admin Panel → Problems gets **Retry all** and **Cancel older…**.
`tests/activityNotificationExpiry.test.cjs` and a runtime test.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e0317a9ff3">synced-cron's per-minute running-job lookup uses an index</a>. Thanks to Raymond-Voogt and xet7.</summary>

`{ name, finishedAt: { $exists: false } }`, asked every minute per job and
instance, scanned the whole `cronJobs` history: synced-cron indexes only
`{ intendedAt, name }` and the TTL. `{ name, finishedAt }` is created at
startup. `tests/syncedCronIndex.test.cjs` and a runtime test that checks the
plan.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.42 2026-10-14 WeKan ® release

**In short:** a new **Version Control** board view shows a board as a
**GitHub** or **Gitea** issue tracker, with releases, a **wiki** and history
with undo, and a whole **GitHub organization** imports into it, its **GitHub
Actions** as Rules. Optional **Trello**, **Jira**, **GitHub** and **Gitea**
compatible APIs let their clients use WeKan as a backend. Old boards get their
keys in one pass, list sync keeps issue details current, any board view can be
a **read-only public view**, and WeKan has **Android** bundles.

This release adds the following new features:

**Board views** - a repository's issue tracker as a view, and which views the
public sees.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/326d9bbf61">Version Control: the board as a GitHub or Gitea issue tracker</a>. Thanks to xet7.</summary>

Board → View → **Version Control**, in the board's own theme. A card is an
issue: open, or closed when archived, in a list named *Closed*, *Done*,
*Resolved*, *Merged* or *Wontfix*, or closed upstream. The issue number is
the upstream one of an imported issue, else the card number. The board's
labels are labels, and labels with a due date and the importers'
`milestone:` labels are milestones, with progress bars. Comments are the
conversation, attachments the files. The search box takes GitHub's words:
`is:open`, `label:`, `-label:`, `milestone:`, `author:`, `assignee:@me`,
`no:label` and `sort:`. **New issue**, **Close** and **Reopen** write through
the ordinary collections, so the **History** tab (the board's history table)
shows them and **Restore** undoes them. A synced issue is closed in its
tracker. **Import** opens the GitHub, GitLab, Gitea and Forgejo importers, and
each synced list has a **Sync now** button. Visitors see it read-only. Tested
by `tests/versionControlView.test.cjs`. See
[Version Control view](docs/Features/Board/Version-Control-View.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/326d9bbf61">A public board's public views are for the public; its members keep theirs</a>. Thanks to xet7.</summary>

Board Settings → Board View's *Show on* and *Default on Public Board* now
apply to the people looking who are not members: visitors who are not logged
in, and logged-in users who are not on the board. The board's members get the
*Private* columns. So a public board can open read-only in Version Control,
Email, Chat or any other view for the world, and list only the views chosen
for it, while its members keep every view. Before, a public board's members
had the public menu too. `boardViewAudience` in
`models/lib/boardViewSettings.js`; `tests/boardViewSettings.test.cjs` covers
visitors, non-members, former members and members.

</details>

**Import and sync** - what an issue tracker's issues bring with them.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/326d9bbf61">GitHub, GitLab, Gitea and Forgejo issues bring their files</a>. Thanks to xet7.</summary>

The files an issue or its comments link or carry become card attachments in
Admin Panel → Attachments → Default Storage. These are GitHub
`user-attachments` and `user-images` links, GitLab `/uploads/` links, and
Gitea and Forgejo assets and `/attachments/<uuid>` links, at most 50 per
issue. Each one is downloaded through the import's SSRF guard, which checks
every redirect hop, and the upload checks its type and size. One that cannot
be fetched is on the import's loss report. Ordinary links are not files.
`models/lib/issueAttachments.js`; `tests/issueAttachments.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/326d9bbf61">List sync can bring each issue's comments, labels, state and files</a>. Thanks to xet7.</summary>

A new Sync option for GitHub, GitLab, Gitea and Forgejo, off by default.
Comments come from one paged repository-wide list (GitHub and Gitea), or
from each issue's notes (GitLab). They are keyed by the tracker's comment id,
and an edit upstream updates them. A label sync added and the issue lost is
taken off, and labels added in WeKan stay. Each file is downloaded once. It
runs after a successful sync as a step of its own, so a failure is shown and
retried and never undoes the title and description sync. Gitea issues are
fetched with `type=issues`. A rate-limited answer is waited out once when it
frees up within a minute; otherwise the run ends with the time to try again.
`tests/listSyncIssueDetails.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/935e68dfdd">A whole GitHub organization imports, each repository as its own board</a>. Thanks to xet7.</summary>

Import → GitHub → **Import a whole GitHub organization**: every repository of
an organization or user becomes a board named `owner/repository`, opening in
Version Control. Issues go through the ordinary `importBoard`, run as the
person who started the job, with their comments, labels and files. Releases
are cards in a *Releases* list, with their files attached only when chosen.
`.github/workflows` files become Rules. Each wiki is read from its git
repository with isomorphic-git (1.42.4, pinned), with every request through
the SSRF guard and only to github.com. A page is a card in the *Wiki* list:
its `[[links]]` point at the linked pages' cards and are attached to them,
and each commit that changed it is a dated edit in the card's history, so
**Restore** brings back an older version. Version Control gains **Releases**
and **Wiki** tabs, the wiki laid out as on GitHub. The job shows progress, can
be cancelled, pauses on a restart and stops at a rate limit. The token is
kept in memory only. Tests: `tests/githubOrgImport.test.cjs`,
`tests/githubWiki.test.cjs` and `tests/workflowYaml.test.cjs`, the last
checking 52 real workflow files against js-yaml.

</details>

**Rules** - what GitHub Actions workflows needed, for everyone.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/935e68dfdd">GitHub Actions workflows become Rules; Rules gain comments, cron and descriptions</a>. Thanks to xet7.</summary>

Issue events become triggers. Label, close, reopen, comment, assign and
create steps become actions, from the well-known actions or from `gh issue`
commands, and `actions/stale` becomes an aging rule. A build, test or script
is never run: such a workflow is a disabled rule with its YAML as its
description. For this, WeKan's Rules gain several parts, available to every
board:

- a **commented on** trigger;
- an **add comment** action, written as the person whose change ran the rule
  and only where they may comment;
- **cron schedules** in UTC (`models/lib/cronSchedule.js`);
- a rule **description**, shown on the rule.

Tests: `tests/githubActionsRules.test.cjs`, `tests/cronSchedule.test.cjs` and
`tests/ruleCommentCron.test.cjs`.

</details>

**Optional APIs** - other trackers' clients, with WeKan as their backend.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/86ec72fade">Trello, Jira, GitHub and Gitea compatible APIs, off until an admin ticks them</a>. Thanks to xet7.</summary>

Admin Panel → Settings → Visibility → **Optional APIs** turns on REST APIs
in Trello's, Jira's, GitHub's and Gitea's shape (#4930), each described with
the address a client uses. None has rights of its own: each translates a
request into the matching request to WeKan's own REST API, made with the
caller's WeKan token, so every WeKan permission applies unchanged. An API that
is not ticked answers 404, and `WITH_API` turns them all off. Trello covers
members, boards, lists, cards, labels, comments and checklists. In Jira a
board is a project (the board key), a card is an issue (`DEV-7`), lists are
statuses, and simple JQL works. In GitHub and Gitea a board is a repository and
a card an issue, open or closed as in Version Control. Deleting archives. See
[Optional APIs](docs/API/Optional-APIs.md). `tests/optionalApis.test.cjs`
fails if any of them writes past WeKan's REST API.
`server/lib/tests/compatApi.tests.js` runs them over real HTTP.

</details>

**Cards** - opening a card on a phone.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/326d9bbf61">A QR code of the card's link in the card menu</a>. Thanks to xet7.</summary>

Card menu → **QR code** shows the card's link as a QR code, to open the card
on a phone or tablet. It is drawn in the browser by WeKan's own encoder
(`models/lib/qrCode.js`: byte mode, level M, versions 1–10), so the link is
sent to no QR service. `tests/qrCode.test.cjs` checks the encoder module for
module against qrcode-svg, which Meteor's accounts-2fa ships, and checks that
no outside QR service is used anywhere.

</details>

**Platforms** - where WeKan runs.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8d9cb2565">Android bundles for Termux, for all four Android CPUs</a>. Thanks to xet7.</summary>

Every release that has wekan/node-patches' Android Node.js also has
`wekan-<version>-android-arm64.zip`, `-x64`, `-armv7` and `-x86`, with
FerretDB. Each is the release's Linux bundle rebuilt inside Termux's own
image with that Node.js, checked against its SHA256: every native addon is
built for it, and sharp against Termux's libvips. Before it is published,
each addon's architecture is checked, sharp must load, and the bundle must
start and answer HTTP 200. A CPU whose Android Node.js is not published yet
is skipped and builds by itself once it is. `tests/androidBundles.test.cjs`
covers the build and the workflow. See [Android](docs/Platforms/FOSS/OS/Android.md).

</details>

and fixes the following bugs:

**Board keys** - how old boards get theirs.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d0378f33c2">Old boards get their keys in one pass, in seconds rather than hours</a>. Thanks to Raymond-Voogt and xet7.</summary>

v12.41 gave each board without a key one at startup by re-reading every key
of the instance per board. It also counted up from 2 again for every board
sharing a title. That is quadratic: on 32,500 boards it ran for hours of slow
queries. Now the keys in use are read once, the new ones are planned in
memory, linearly, and written in batches, each only where the board still has
no key. A single new board reads only the keys that could collide with it,
through a new index. Tests: `tests/boardKeyBackfill.test.cjs` (32,500 boards
planned well under a second) and `server/lib/tests/boardKeys.tests.js`.

</details>

**Rules** - when a rule runs.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/935e68dfdd">A disabled rule no longer runs on a schedule or from its button</a>. Thanks to xet7.</summary>

Turning a rule off (#2322) stopped it only for card events: the scheduler and
the rule's button ran it anyway, because neither looked at `enabled`. Both
check it now. Imported GitHub Actions workflows rely on this, since a
workflow that is code is imported disabled. Pinned by
`tests/ruleCommentCron.test.cjs`.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.41 2026-10-14 WeKan ® release

**In short:** **custom board roles**, **per-list permissions** and boards
**every signed-in user may edit**; board **keys** (`DEV-7`) and **shared
labels**; WeKan serves **HTTPS** itself; **Bun single files** and **musl
bundles and AppImages** for Alpine; on **Sandstorm**, webhooks and list sync
leave through the Powerbox and the REST API takes a grain API key. Seventeen
locale files that held **another
language**, and six full of machine-fill prefixes, are rewritten in their
own, and fourteen **GitHub CodeQL** alerts are fixed.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2352f1f44f">HTML tags are removed until none are left, and no input is spliced into a pattern</a>. Thanks to GitHub CodeQL and xet7.</summary>

- **#570, #571:** an HTML-only email became card text with one pass of each
  removal, so a script element spliced together by removing an inner one
  survived, and its contents reached the card. Both removals now run until
  nothing changes.
- **#574:** the single file's settings writer put the setting name into a
  regular expression. A setting must be an environment variable name and is
  compared literally, and a value must be one line. The kept-versions reader
  now reads file names literally too.
- **#572, #573, #575-#580:** tests escaped only some characters, or matched
  example hostnames with unescaped dots; they compare literally or escape
  fully now.

`tests/tagStrippingFixedPoint.test.cjs` now also catches the `<[^>]+>`
spelling it missed, which also found the search-index text of Office
documents: never rendered, so recorded as such. `tests/emailToCard.test.cjs`
fails on the old code. Nothing here is an attempt the server refuses at run
time, so no Admin Panel / Problems key is added.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/167ccf9e2d">An email's HTML becomes text in one pass, with no pattern to take apart</a>. Thanks to GitHub CodeQL and xet7.</summary>

CodeQL alerts #581 and #582 were raised on the fix above: email to card
still removed `<script>` elements and tags with regular expressions, looped
to a fixed point through a helper that CodeQL does not follow. `htmlToText`
in `models/lib/emailToCard.js` now walks the characters once. A tag is
dropped whole, a script, style or head element goes with what is in it (also
unclosed), an unfinished tag is not kept as text, and a `<` that does not
start a tag stays text - except right before another `<`, where it would
read as a tag once the next one is gone. `tests/emailToCard.test.cjs` covers
those cases, and `tests/tagStrippingFixedPoint.test.cjs` no longer accepts a
fixed-point helper and now also catches a whole element removed by pattern,
in every file. Nearly every HTML email has a `<style>`, so a removed element
is ordinary use, not an attempt: no Admin Panel / Problems key is added.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73fcfb8545">No HTTP response sends the request back, tests included</a>. Thanks to GitHub CodeQL and xet7.</summary>

CodeQL alert #583: the HTTPS test's server answered with the request's own
URL in the body, the shape of reflected cross-site scripting. It now names
the page by comparison. `tests/noReflectedRequest.test.cjs` keeps the shape
out of every file. Test code only, so no Admin Panel / Problems key is added.

</details>

and adds the following new features:

**Board roles** - who may do what on a board, and where a membership comes from.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50bb989eb8">Custom board roles, built in the Admin Panel from what a member may do</a>. Thanks to xet7.</summary>

In Admin Panel / People / Roles a site admin builds named roles from five
capabilities: sees all cards, comments, edits, moves cards, invites. A board
admin then gives one to a member in the same popup as the built-in roles.
Board admin stays a built-in role. Every check asks the capability table,
which answers from the custom role. The member's built-in flags carry the
strongest built-in role that grants nothing more, so code reading a flag
never grants more, and a deleted role leaves exactly that. This holds for
every combination, which `tests/customBoardRoles.test.cjs` checks.
Invitations, REST reads, imports and member mapping follow it. The comment
form, reactions and chat now ask the comment capability, so a No comments
member is no longer offered reactions the server refuses. The new strings are
translated in all 234 languages, and the Roles Status table gains a Move cards
column. See [Board roles](docs/Features/Members/Roles.md#custom-roles).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50bb989eb8">A membership that came through a team or organization leaves with it</a>. Thanks to mfnalex and xet7.</summary>

Joining a team already added its boards; leaving it now takes away the
memberships it gave, and only those. Each records where it came from
(`grantedBy`), so a direct membership is never touched and a board admin is
kept. A board admin's own add or removal is final. This covers user edits,
LDAP, OIDC, the board sidebar, and organizations that propagate their
members. `tests/groupBoardMembership.test.cjs` covers the decisions, and a
runtime test joins, leaves and rejoins a team against a real database.

</details>

**Outgoing requests** - webhooks and downloads.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/78957e14cb">Outgoing webhooks go through an HTTP proxy, with the SSRF checks kept</a>. Thanks to gbarre and xet7.</summary>

`HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` work for every outgoing request
(on the snap: `http-proxy`, `https-proxy`, `no-proxy`). The destination is
still resolved and checked first, and the proxy is given that checked
address, never the name: an `http://` request goes in absolute form, an
`https://` one through a `CONNECT` tunnel, with TLS still checked against the
real name. A destination the guard refuses never reaches the proxy.
`tests/outboundProxy.test.cjs` runs a real proxy on loopback. See
[Proxy](docs/Features/Webhooks/Proxy.md).

</details>

**Who may edit where** - boards open to every signed-in user, and lists with
rules of their own.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7595727917">A board can let every signed-in user edit it, when the Admin Panel allows it</a>. Thanks to Meeques and xet7.</summary>

Admin Panel / Settings / Visibility gains "Allow boards that every signed-in
user may edit", off by default. With it on, a board admin of a public board
or one open to every signed-in user can turn it on for that board in the
visibility popup. A signed-in non-member may then comment, edit and move
cards like a Normal member - never change the board - and their first edit
makes them a Normal member, so every change stays attributed. A member keeps
their own role, a member a board admin removed stays removed, and rules,
webhooks, inbound email and list sync never act with a non-member's rights.
Board-wide settings such as list width and sticky headers stay members-only.
`tests/instanceEditing.test.cjs` and a runtime test cover it. See
[Visibility](docs/Features/Admin-Panel/Settings/Visibility.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7595727917">Lists can allow or refuse editing and commenting per role</a>. Thanks to Meeques and xet7.</summary>

The list menu gains List permissions, for board admins: for each role -
built-in, custom, and on an open board everyone signed in - Edit and Comment
are as on the board, allowed, or not allowed in this list. The issue's
example works: a read-only board with one list where everybody may add cards
and comment. A board admin is never restricted, and a removed member stays
removed. The server applies it to every card, checklist, attachment and
comment write and to moves into the list, and the REST API honours a list's
refusal on every per-list card route. Only the board admin method writes the
setting; a direct write is refused and shown in Admin Panel / Problems.
`tests/listPermissions.test.cjs` and a runtime test cover it. See
[List permissions](docs/Features/Board/List-Permissions.md).

</details>

**Boards and cards** - keys, card numbers and labels shared between boards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7595727917">Every board has a key, and card numbers show as KEY-7</a>. Thanks to justinr1234 and xet7.</summary>

A key is 2-10 capital letters and digits, unique in the instance, suggested
from the board's title (Development Team: DT) and set for every existing
board at startup. A board admin can change it in the rename popup. Cards show
`DEV-7` instead of `#7`, and searching for `DEV-7` finds that card. The
per-board numbers themselves are unchanged, so nothing is renumbered.
`tests/boardKey.test.cjs` and a runtime test cover it. See
[Board key](docs/Features/Board/Boards/Board-Key.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7595727917">Shared labels for every board, an organization's boards or a team's</a>. Thanks to tiFabGrinch, ejlkemper and xet7.</summary>

Admin Panel / Labels keeps labels shared by every board, or by the boards of
one organization or team. A board offers them in its labels popup beside its
own, and using one copies it to the board linked to the shared label, so
renaming it or changing its colour in the Admin Panel changes it everywhere
it is used. Deleting a shared label leaves it on those boards as their own.
Only labels a member's own organizations and teams share are sent to them.
`tests/sharedLabels.test.cjs` and a runtime test cover it. See
[Shared labels](docs/Features/Board/Shared-Labels.md).

</details>

**Servers** - running WeKan without a proxy in front of it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1bf7a62cab">WeKan serves HTTPS itself, when a certificate is configured</a>. Thanks to 68040 and xet7.</summary>

With `HTTPS_PORT`, `HTTPS_CERT_FILE` and `HTTPS_KEY_FILE` set (a path or
the PEM itself), WeKan also listens for HTTPS, on the same app, and
`HTTPS_REDIRECT=true` sends plain-HTTP requests there. Without them nothing
changes, and a proxy such as Caddy stays the recommendation for production.
The snap has `https-port`, `https-cert-file`, `https-key-file` and
`https-redirect`. `tests/httpsServer.test.cjs` makes a real TLS connection.
See [HTTPS without a proxy](docs/Platforms/Webserver/HTTPS-without-proxy.md).

</details>

**Platforms** - more ways to run WeKan.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b1e58094f4">Bun single files: one executable per Bun platform, musl included</a>. Thanks to xet7.</summary>

Each Bun bundle also comes as one executable:
`wekan-<version>-bun-<target>-single-file` for Linux x64 and arm64 (glibc
and musl, so Alpine too), macOS and Windows. It is the published bundle ZIP,
unchanged, inside that bundle's own Bun, built on the platform itself, so the
runtime is the one the bundle was tested with. The first start unpacks the
bundle once into a cache directory, without a second Bun, and every start
runs it with the executable itself as Bun. Like the Bun bundle it needs
`MONGO_URL` and `ROOT_URL`. Its ZIP reader refuses any entry or link that
would land outside the cache directory. Before it is published each file is
checked: it names itself, refuses to start without a database, unpacks once
and loads every native addon of the bundle. `tests/bunSingleFile.test.cjs`
covers the reader and its refusals. See
[Single file](docs/Platforms/Single-File.md#bun-single-files).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a1d2994c1c">musl bundles and AppImages for Alpine and the other musl systems</a>. Thanks to xet7.</summary>

Every release also has `wekan-<version>-linux-x64-musl.zip` and
`-linux-arm64-musl.zip`, with FerretDB, and the AppImages
`WeKan-<version>-x86_64-musl` and `-aarch64-musl`. Each is the release's
Linux bundle rebuilt inside Alpine on a runner of its CPU: the musl Node.js of
the same version, checked against its SHA256, and every native addon
compiled against musl. Before it is published, each addon's architecture is
checked, sharp must load, and the bundle must start and answer HTTP 200; the
AppImages are started inside Alpine too. `tests/muslBundles.test.cjs`
covers the build and the workflows. See [Alpine](docs/Platforms/FOSS/OS/Alpine.md).

</details>

**Sandstorm** - reaching out of a grain, and into it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2cc0b59a51">Outgoing webhooks leave a grain through the Powerbox</a>. Thanks to xet7.</summary>

A grain has no network but the bridge proxy, so a webhook was never sent.
Each saved webhook now offers "Allow this grain to reach this address", which
opens the Powerbox for exactly that address; once approved, the webhook goes
through the bridge with that grant. The grant belongs to the destination, not
to a person, and is approved as the address's parent path so the bridge
delivers to the exact address. Off Sandstorm nothing changes: every sender
still goes through the SSRF guard. `tests/sandstormWebhookEgress.test.cjs`
runs it against a fake bridge proxy. See
[Powerbox](docs/Platforms/FOSS/Container/Sandstorm/Powerbox-External-APIs.md#outgoing-webhooks).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2cc0b59a51">The REST API works with a Sandstorm API key</a>. Thanks to xet7.</summary>

A Sandstorm API key keeps the Authorization header for itself, so WeKan saw
no user. In a grain the bridge says who is calling, and WeKan now acts as
that user - only in a grain, only for an account that exists and is enabled,
and a key without the participate permission reads only. Off Sandstorm the
`X-Sandstorm-*` headers are never believed.
`tests/sandstormApiIdentity.test.cjs`
covers both sides.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d53b4da799">List sync from GitHub, GitLab, Gitea and Forgejo works in a grain</a>. Thanks to xet7.</summary>

A board member who may write saves a list's sync source and allows the grain
to reach that tracker's API in the Powerbox; the periodic sync then goes
through the bridge with that grant, which belongs to the tracker, so no one
needs to be signed in. GitLab's token is sent as `private_token`, because the
bridge drops `PRIVATE-TOKEN`, so private GitLab projects sync too; GitHub,
Gitea and Forgejo sync public repositories, whose token headers cannot pass
the bridge. Jira signs in only with an `Authorization` header, which the
bridge replaces, so it is refused in a grain with that reason. Off Sandstorm
nothing changes. `tests/sandstormSyncEgress.test.cjs` runs it against a fake
bridge proxy. See [Powerbox](docs/Platforms/FOSS/Container/Sandstorm/Powerbox-External-APIs.md#list-sync).

</details>

and closes the following already-done feature request:

- [Each member chooses how often email notifications come: never, periodically or instantly](https://github.com/wekan/wekan/commit/3f88fb39a5).
  Thanks to saurabharch and xet7.

and fixes the following bugs:

**Lists and swimlanes** - what goes with a list, and where it is shown.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a3797dbf6">Archiving a list archives its cards, and restoring it brings them back</a>. Thanks to Raymond-Voogt and xet7.</summary>

Only template lists archived their cards, so archiving any other list left
its cards visible in the Lists, Table and Calendar views. The server now
archives the cards of every list with it, whichever way it is archived - the
list menu, the Archive sidebar, the REST API - and restoring the list
restores exactly those cards, the rule #2292 gave swimlanes. A card that was
archived on its own stays archived. Cards archived with the list get the
list's own archive time, so a browser clock that differs from the server's
cannot keep them from coming back. `tests/archiveListCards.test.cjs` and a
runtime test cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ebf2a019a6">Lists missing their swimlane counts only lists that lost it, and Restore never hides cards</a>. Thanks to Raymond-Voogt and xet7.</summary>

Admin Panel / Problems counted every board-wide list whose history recorded
the swimlane it was created in, so lists made since the automatic
un-binding stopped (#6515, in v10.31) were counted too, and Restore would
have bound them there, hiding the cards they hold in other swimlanes. Now a
list created after v10.31 is never offered, and a list with any card in
another swimlane is never restored. A list that really lost its binding is
still restored. `tests/listSwimlaneRestore.test.cjs` and a runtime test
cover both rules.

</details>

**Board roles** - helpers that read a role.

- [Five role helpers that answered the same for everybody: Import never offered, rule controls for every member, the last admin not protected, OIDC default-board roles](https://github.com/wekan/wekan/commit/548834c4ee).
  Thanks to xet7.

and fixes the following build bug:

- [The OpenBSD bundles are built on OpenBSD 7.8, where Node.js 26 now builds](https://github.com/wekan/wekan/commit/209e3b0c47).
  Thanks to xet7.

and updates the following documentation:

- [Outgoing webhooks to Node-RED, and why an internal address is refused](https://github.com/wekan/wekan/commit/a0de507143).
  Thanks to yeurplc and xet7.
- [Uberspace 7: install, the update script, and email on one environment line](https://github.com/wekan/wekan/commit/a0de507143).
  Thanks to jeyca and xet7.

and updates the following translations:

**Languages that held another language** - each locale file now says what its
tag says.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3c92273ae">Hong Kong Chinese in Traditional characters, and Flemish in Dutch</a>. Thanks to xet7.</summary>

Hong Kong Chinese had 90 values in Simplified Chinese; they are now
Traditional. Flemish held 158 values in about a dozen other languages, Venda
and Vietnamese among them, and they are now Flemish, with its 225 values
still in English filled too.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba6d0014f7">Locale files that held another language are rewritten in their own</a>. Thanks to xet7.</summary>

Romanian held Italian, French and Spanish; Aromanian, Ladin, Romansh and
Venetian held Italian; Galician held Portuguese, Acehnese Malay, Venda Zulu,
Slovak Czech and Polish, Upper Sorbian Czech, Volapük Esperanto and Bislama
Tok Pisin, and Uzbek in Arabic script was half Latin script. Each is now in
its own language. Machine-fill prefixes and notes ("Faka-Tonga:", "Kay
willaymi:", "Wolayttatto:", "WeKan:" and others) are gone from Tongan,
Quechua, Wolaytta, Upper Sorbian, Aragonese, Friulian and Luganda. Chinese
no longer calls a board a wooden plank, and List actions no longer reads as
"list the actions" in seven languages. Values already reviewed - pinned by a
test, corrected by an audit, or quoted by another string - are kept.
`tests/wrongLanguageLocales.test.cjs` keeps the old languages and prefixes
out and checks every placeholder against English. Native speakers are asked
to review these languages.

</details>

**Igbo** - notification, integration, workflow and recovery settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/238354f6a54a234c9db1cf88a9436d15087c6ba0">Translate Igbo notification delivery and integration settings</a>. Thanks to xet7.</summary>

Translate 42 notification and integration strings, preserving grouping,
schedules, quiet hours, inherited webhook settings, identity omission and
literal link-rule syntax. Direct technical wording needs fluent review.

Both translation and guarded-correction suites pass with 30,943 corrections.
All 21 human-preference checks pass; 38,430 existing Chinese values are
unchanged.
One notification browser case passes syntax and discovery; execution is pending.
All-language translation and semantic verification remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/daac3ead0dceb451bdb69970cc5b19678d17ce6d">Translate Igbo workflow and permission controls</a>. Thanks to xet7.</summary>

Translate 19 workflow, directory-sync and permission messages, preserving
Wrike status behavior, environment identifiers and subtask completion choices.
Technical prose is lower confidence and needs fluent review.

Both translation and guarded-correction suites pass with 30,962 corrections.
All 21 human-preference checks pass; 38,430 existing Chinese values are
unchanged.
Three browser cases pass syntax and discovery; execution remains pending.
Igbo has 69 detected placeholders left. All-language semantic review is
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c5391fb98d3619308aa2ba3328f47db870e5655">Translate Igbo stopped list sync recovery messages</a>. Thanks to xet7.</summary>

Translate 18 recovery messages, preserving applied changes, discarded pending
writes, replay restrictions and the oldest-50 display limit. Recovery prose
needs fluent review.

Both translation and guarded-correction suites pass with 30,980 corrections.
All 21 human-preference checks pass; 38,430 existing Chinese values are
unchanged.
One browser case passes syntax and discovery; execution remains pending.
All-language translation and semantic verification remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c25ce78b94d65d3a7fd4540bdb065443a6c6dbd">Translate Igbo interrupted import recovery messages</a>. Thanks to xet7.</summary>

Translate 21 messages, preserving permanent deletion, retained partial boards,
source-file limitations, untouched foreign boards and recovery limits.
Direct recovery prose needs fluent review.

Both translation and guarded-correction suites pass with 31,001 corrections.
All 21 human-preference checks pass; existing Chinese values are unchanged
(38,430 checked). One browser case passes syntax and discovery; execution is
pending. All-language translation and semantic verification remain unfinished.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.
