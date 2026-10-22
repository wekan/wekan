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

</details>

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

# v12.40 2026-10-14 WeKan ® release

**In short:** **email to card** arrives on every platform, through provider
webhooks, **IMAP** mailboxes or a **Sandstorm** grain's own address, which
also sends WeKan's email; **bounces** from **Amazon SES** and eight other
sending services are handled in the Admin Panel. Two new board views show a
board as a Gmail-like **Email** mailbox and as a Slack-like **Chat**. A board
can be **exported to Trello** with its **swimlanes** kept as labels, and a grain
reaches Trello through the **Powerbox**. **Single-file WeKan** is one
executable per platform, with a menu to update, back up and start at boot.
**FreeBSD** Bun bundles, the **Launchpad snap** and the **Mac apps** step are
fixed, and many languages are filled and corrected.

This release adds the following new features:

**Trello** - import and export, on every WeKan platform.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88d00e02f1">Export a board to Trello, and bring its swimlanes back on import</a>. Thanks to xet7.</summary>

**Board Settings → Export → Trello** creates the board in Trello through its
API with the saved key and token: labels, lists, cards with their dates and
labels, checklists, comments (starting with their author and time) and
attachment files; archived lists and cards are archived there too. It runs as
a server job from the board export, with the same access check, and lists
anything Trello refused. Trello has no swimlanes, so each swimlane becomes a
label named `Swimlane: <title>` on its cards: the free Swimlanes by Blue Cat
Power-Up groups Trello cards into rows by label, and every WeKan Trello import
(JSON, `.zip` and the live API import) turns those labels back into swimlanes.
`tests/trelloExportPlan.test.cjs` covers the mapping and the round trip, and
`tests/trelloApiExport.test.cjs` runs the export against a fake Trello API.

</details>

**Sandstorm** - reaching outside services from a grain.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88d00e02f1">A grain reaches Trello through the Sandstorm Powerbox</a>. Thanks to xet7.</summary>

A grain has no network of its own. **Allow access to Trello** on the Trello
import page and in the export opens the Powerbox for `https://api.trello.com/1`,
the way the Sandstorm WordPress app reaches wordpress.org for plugin updates.
The access token is kept per user on the server, never sent to a browser, and
ends when the user loses access to the grain. Trello's REST calls go through
the bridge proxy; files uploaded to Trello cannot be (Trello needs a header the
proxy keeps for itself), so the import counts them as left out.
`tests/sandstormApiEgress.test.mjs` checks the Powerbox descriptor, the claim
and the proxied requests against a fake bridge, and `tests/relayBleed.test.cjs`
that no download leaves a grain. Not yet tried in a live Sandstorm grain.

</details>

**Email** - email into cards, set up in Notification Settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/988b177e59">An email to your board address becomes a card, on every platform</a>. Thanks to xet7.</summary>

Each member has a private address for each board, `board+<token>@<domain>`;
**New address** replaces it. The subject is the title, the body is the
description (quoted replies left out, HTML as text) under a From line, and the
attachments are attached, no SVG, as for uploads. The card is the address
member's, never the From address's, and they must still have write access when
the email arrives; a reply to a card's conversation (`In-Reply-To` /
`References`) becomes a comment on it. **Notification Settings** at three
levels: the Admin Panel turns it on and is the only place for the domain, the
webhook secret and the IMAP mailboxes with their passwords, which never leave
the server; a board admin turns the board on and picks its list and swimlane;
board and member choose which parts of an email are used. Mail arrives by
`POST /api/inbound-email` (Mailgun, SendGrid, Postmark, forms, multipart, raw
MIME), by IMAP (imapflow and mailparser, one replica polling under a database
lease), or on **Sandstorm** at the grain's own address, read from its Maildir,
with a member's board token in the subject; a grain also sends WeKan's email
through Sandstorm, as it has no network. Unknown addresses, wrong secrets and
floods show in Admin Panel → Problems. See
[Email to card](docs/Features/Email/Email-To-Card.md);
`tests/emailToCard.test.cjs` covers the settings, the payloads, the capnp email
and the guards.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/79ac301675">Bounces are handled in the Admin Panel, with Amazon SES, and mail problems are in Problems</a>. Thanks to xet7.</summary>

Email that comes back no longer lands in the administrator's own inbox.
Admin Panel → E-mail → Bounces sorts it into hard bounces (a mistyped invited
address), soft bounces, automatic replies and spam complaints, each with
actions done after a count, as listmonk and Discourse do it: list it, stop
emailing the address, tell who invited it, delete the invitation, or ignore.
A list of the addresses that bounced lets an admin clear one to email it
again. Amazon SES Bounce and Complaint notifications, and mail SES receives,
arrive through SNS at `/api/inbound-email/ses`; they are checked against
Amazon's signing certificate and accepted only from the topics the Admin Panel
lists. Delivery status notifications and out-of-office replies that arrive by
IMAP, webhook or Sandstorm count as bounces too, and never become cards.
Admin Panel → Problems → Email shows what went wrong sending or receiving:
- a refused or unreachable send;
- an IMAP mailbox that cannot be read (never with its password);
- an unreadable email;
- an email for a board that no longer takes email.

The inbound endpoints no longer need `WITH_API`. Runtime tests run WeKan's own
transports against local SMTP and IMAP servers, a real Maildir and signed SNS
messages. They found the server bundle's nodemailer import that broke every
parsed email, and the Chat view's drag and drop and right-to-left faults, which
are fixed here. See [Bounces](docs/Features/Email/Bounces.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57e05c4304">Bounces from Mailgun, SendGrid, Postmark, Brevo, Mailjet, SparkPost, Mandrill and Resend</a>. Thanks to xet7.</summary>

Besides Amazon SES, WeKan takes the bounce and spam-complaint webhooks of the
other common sending services at `/api/inbound-email/bounces/<service>`. Each
request is checked the way that service signs it:

- Mailgun: HMAC-SHA256;
- SendGrid: an ECDSA signature over the raw body;
- Mandrill: HMAC-SHA1 over the address and fields;
- Resend: a Svix signature;
- Postmark, Brevo, Mailjet and SparkPost, which do not sign: a password in the
  webhook address (Basic auth or `?secret=`).

Each service's events become WeKan's hard, soft, automatic-reply and complaint
bounces, so the same rules act on them. Bounces → Other sending services turns
a service on with its key or password, which is never shown back. A forged
request is refused and logged under Problems → Security. Mail systems without a
webhook are still handled by reading their bounce emails over IMAP.
`tests/emailBounce.test.cjs` checks every payload and signature, and the
runtime test posts to each endpoint over HTTP.

</details>

**BSD** - WeKan on FreeBSD, OpenBSD and NetBSD.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1cbd7df31f">A Node.js bundle for FreeBSD, and the bundles for OpenBSD and NetBSD ready</a>. Thanks to xet7.</summary>

`.github/workflows/bsd.yml`, called by Release All, takes the release's amd64
bundle and adds the BSD's Node.js (wekan/node-patches) and FerretDB. It then
compiles the native modules inside a VM of that BSD, starts the bundle there
with its own `start-wekan.sh`, and attaches the zip once it answers HTTP 200.
FreeBSD x64 builds now. OpenBSD amd64/arm64 and NetBSD amd64 build
automatically once node-patches publishes their Node.js, which it now builds
from the OS packagers' own patch sets. Where each BSD stands, and which patches
exist for it, is in [BSD](docs/Platforms/FOSS/OS/BSD.md).
`tests/bsdBundles.test.cjs` covers the targets, the skip when a BSD has no
Node.js yet, the checksum checks, and runs the start test itself both against a
launcher that dies and one that answers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58f8b67904">Each platform's existing Node.js patches are listed; OpenBSD and NetBSD build settings</a>. Thanks to xet7.</summary>

The BSD page lists the patch sets FreeBSD ports, OpenBSD ports, pkgsrc and
DragonFly's DeltaPorts keep for Node.js, and what WeKan does with each. It also
covers Bun, sharp/libvips, bcrypt and FerretDB on every BSD, and how to install
on OpenBSD (under `/usr/local`, which is mounted `wxallowed`) and on NetBSD
(`paxctl`). The OpenBSD bundle job mounts its workspace `wxallowed`, and the
NetBSD job compiles native modules with pkgsrc's GCC 14.
`tests/bsdBundles.test.cjs` covers the targets, the workflow and the start
test.

</details>

**Single-file WeKan** - all of WeKan in one executable per platform, its data
in wekan-files beside it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31e569a18e">One executable per platform, with a menu to update, change version, back up and start at boot</a>. Thanks to xet7.</summary>

Each platform's published bundle becomes a Node.js single executable whose ZIP
Node.js 26.11 reads as a virtual file system, without unpacking it. Only
FerretDB is copied out, once and checksum-verified, to `wekan-files/bin`.
Everything WeKan writes goes in `wekan-files` beside the executable, which
`WRITABLE_PATH` points at: `attachments`, `db`, `backup` and the rest. A
`WRITABLE_PATH` named `wekan-files` is now a files root in WeKan itself
(`models/lib/filesRoot.js`, now used everywhere the rule was copied).

Started in a terminal, it shows a menu: start and stop, status, version info as
Admin Panel / Version shows it, update to the newest release or change to any
other (verified, backed up first, the old one kept), backup to
`wekan-files/backup/YYYY-MM-DD_HH-MM-SS`, run at boot (systemd, launchd, Task
Scheduler, cron, Termux:Boot), the log and settings. Every entry is also a
command. Starting runs the `start-wekan.sh` loop.

Meteor's `main.js` changes directory into the bundle, which no operating system
can do inside a virtual file system, so the server keeps a virtual working
directory. Node.js 26.11.1 breaks `fs.writev` and `fs.readv` while one is
mounted, so those are rebuilt on `fs.write` and `fs.read`.

`single-file.yml` builds every platform with a bundle, starts it where GitHub
has a runner, and attaches what started. Tested here by building a real
executable from a stand-in bundle (`tests/singleFile.test.cjs`, 20 tests), and
with the v12.39 amd64 bundle: WeKan answered in 24 s, and 20 browser tests
passed, including `tests/playwright/specs/single-file.e2e.js`. See
[Single-file WeKan](docs/Platforms/Single-File.md).

</details>

**Board views** - the board as a mailbox and as a chat.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ddb33d21d0">Email view: the board as a Gmail-like mailbox</a>. Thanks to xet7.</summary>

The Inbox is the list email to card puts new cards in; Sent and All mail
follow the cards' email; the board's lists are folders and its labels are
Gmail labels, coloured on each message. The messages are the shared table
page, newest first and paged on the server. A message opens as the card popup,
its comments the conversation. Compose and Reply send From the member's own
board address, so the answer comes back to this board and, by `In-Reply-To`,
to the same card as a comment; on Sandstorm the grain's address carries the
board token in the subject. See [Email view](docs/Features/Board/Email-View.md);
`tests/emailView.test.cjs` covers the folders, the search, header injection and
the wiring.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ddb33d21d0">Chat view: the board as a Slack or Rocket.Chat workspace</a>. Thanks to xet7.</summary>

A tree of Workspaces, boards, swimlanes, lists and cards as channels; the
selected card in the middle; its comments as chat beside it, Enter to send.
Left to right it is tree | card | chat, mirrored in a right-to-left language.
Each pane folds, the borders between them drag (or move with the arrow keys),
and widths and folds are saved on the member's profile. Swimlanes, lists,
cards, workspaces and boards reorder by drag and drop through the same paths
as on the board and All Boards. See [Chat view](docs/Features/Board/Chat-View.md);
`tests/chatView.test.cjs` covers the layout, both directions, the tree and the
drop rules.

</details>

and fixes the following build bugs:

**Release builds** - jobs that skipped or gave up on work that had succeeded.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ccff887734">The Mac apps, Windows EXE, Docker image and snap checks find published assets</a>. Thanks to xet7.</summary>

Both v12.39 Mac apps were skipped although their bundles were attached:
`gh release view … | grep -q` let grep exit at the first match while gh was
still writing, gh got SIGPIPE, `pipefail` failed the pipeline, and the job said
the bundle was not published - green, with two notices. Four other checks had
the same shape. Each now reads the asset list whole before matching it.
`tests/releaseAssetCheckNoSigpipe.test.cjs` reproduces the failure and fails if
any workflow pipes `gh` or `curl` into `grep -q` again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/121bf673a5">A Launchpad snap build is waited for through network blips</a>. Thanks to xet7.</summary>

The v12.39 armhf, s390x and riscv64 builds ran on Launchpad, but the runner's
connection to its API dropped or a poll hung, and snapcraft ended each attempt
as "Network is unreachable" or "Timed out waiting for build" - three blips
failed each job. A failed build-state poll is now retried for up to 30
minutes; other errors and the workflow's own deadline are unchanged.
`tests/releaseSnapcraftCompat.test.cjs` covers the retries and their limits.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/13c9bd27d5">FreeBSD Bun bundles build Sharp natively</a>. Thanks to xet7.</summary>

Both FreeBSD jobs stopped at `native check: sharp`: Sharp's only FreeBSD
prebuilt is WebAssembly with Worker threads, and under Bun on FreeBSD the first
image operation never returned, while the same build works under Bun on Linux.
Sharp is now compiled against the system libvips, as on Android, and the
FreeBSD VM installs `vips`. FreeBSD ships libvips 8.18.6 and Sharp asks for
8.18.7, so the next FreeBSD run shows whether it compiles.
`tests/bunSharpSourceBuild.test.cjs` covers which targets build Sharp from
source, and that the FreeBSD VM installs `vips`.

</details>

and updates the following translations:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67d1ad324f">Translate shared UI labels and repair seeded terminology</a>. Thanks to xet7.</summary>

Fill 3,129 English values and repair 167 seeded values across 130
locale paths. Notification delivery, Blockly, Scrum and recovery reuse
reviewed same-language labels. Fifteen completed keys leave the pending queue.
Existing correct-language text and human-verified `zh` catalogs stay intact.

All 307 translation/Blockly suites and 21 human-preference checks pass.
Source tokens match across all 246 catalogs. Expanded notification browser
coverage registers 125 Chromium tests; execution still needs a running app.
[Terminology evidence and review limits](docs/Features/Translations/Shared-Labels-2026-10-13.md)
record provisional wording. The wider language audit and current filtered
fill inventory remain in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/012ee1eb0c">Fill the remaining Bengali feature strings</a>. Thanks to xet7.</summary>

Translate 182 English placeholders for linked cards and fields, import
formats and mapping, notifications, webhooks, LDAP, Wrike and recovery.
Existing Bengali translations remain unchanged. The current fill list is
empty, including pending keys; broader wording review remains unfinished.

Regression coverage checks permissions, import exclusions, recovery warnings,
exact source placeholders and runtime interpolation. Three focused suites
pass. Four Bengali browser cases register for linked fields, notification
settings and both recovery views; execution still needs a running app.
Longer technical wording remains provisional pending speaker review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f263dd0b8d">Fill Marathi feature and settings prose; expose hidden review candidates</a>. Thanks to xet7.</summary>

Translate 212 current placeholders and 55 English settings, rule and keyboard
labels hidden by the fill report's exemptions. Existing Marathi translations
remain unchanged. Product names, keyboard legends and source tokens are kept.
The new read-only audit exposes product-prefixed prose and generic labels;
its candidates need individual review, and do not override verified `zh` text.

Marathi and shared-label tests cover permissions, import exclusions, recovery
warnings, Scrum conflicts, settings states and runtime interpolation. The
supplemental audit and Scrum recovery suites pass. Eight Marathi browser cases
register, including storage settings and Scrum rollback/conflict controls;
execution needs a rebuilt running app. The Marathi fill and supplemental
queues are empty, but broader language-quality review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e10d0aa1d">Translate storage settings in four languages and repair mixed Tagalog instructions</a>. Thanks to xet7.</summary>

Fill 100 English MongoDB and S3 values in Bengali, Icelandic, Tagalog and
Albanian. Repair 15 mixed English/Tagalog instructions, preserving AWS menu
labels, endpoint examples and the warning that the secret key is shown once.
Other translations and all existing human-verified `zh` wording stay intact.

Locale, correction-ledger, supplemental audit and runtime checks pass. Storage
settings browser coverage registers six locales, including the translated
secret-key guidance; execution needs a running rebuilt app. The supplemental
queue falls to 4,021 candidates, which still need individual language review.
Longer software wording remains provisional pending speaker review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49b1e07a48">Fill storage settings in eight more languages</a>. Thanks to xet7.</summary>

Translate 200 English MongoDB and S3 values in Nepali, Kannada, Malayalam,
Javanese, Kazakh, Kyrgyz, Tajik and Somali, using each catalog's existing
terminology. Existing translations and verified `zh` wording stay intact.
Enabled/disabled, success/failure, required-key and endpoint meanings are
covered alongside exact source tokens and runtime rendering.

All 13 relevant suites pass. Storage-settings browser coverage registers 14
locales; execution needs a running rebuilt app. The supplemental queue falls
to 3,821 candidates. Complete software compounds remain provisional pending
speaker review, and the wider translation audit is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9384c350fa">Fill Nepali feature strings and add missing Chinese Trello labels</a>. Thanks to xet7.</summary>

Translate 193 Nepali placeholders for linked fields, import formats, recovery,
notifications, settings and Trello. Add eleven new Trello/Sandstorm strings
in each of nine Chinese catalog paths, preserving every earlier Chinese
value. The [Marathi follow-up](https://github.com/wekan/wekan/commit/66bd077c36)
adds the same eleven new strings and extends checks for Bengali wording
supplied concurrently. Existing non-English values remain unchanged.

Eight focused suites and 21 human-preference checks pass. Exact source-token
inventories and key order match across 1,019,178 locale/key pairs. Tests check
permissions, destructive consequences, import exclusions and Trello's literal
`Swimlane: …` marker. Thirteen export-dialog browser cases and four Nepali
feature cases register; execution needs a running rebuilt app. Empty fill
reports do not establish whole-catalog fluency. Broader review stays open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5de70e0399">Fill Tamil feature strings and correct calendar spelling</a>. Thanks to xet7.</summary>

Translate 193 current placeholders for linked fields, import formats,
notifications, recovery and Trello, plus the Bytes label hidden by an
exemption. Correct four existing calendar labels, recording the exact
before/after values in the correction ledger. Other existing translations
and all verified Chinese wording stay unchanged.

Four relevant suites and 21 human-preference checks pass. Source key order
and exact tokens match across all 246 catalogs. Tests check permissions,
import exclusions, permanent removal versus keeping data, source literals
and runtime substitution. Six Tamil browser cases register, including
calendar labels; execution needs a running rebuilt app. The current Tamil
fill list is empty, but broader wording review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a7eba3e4e">Fill Thai feature strings and the byte unit label</a>. Thanks to xet7.</summary>

Translate 193 current placeholders for linked fields, import formats,
notifications, recovery and Trello, plus the exempt Bytes label. All previous
non-English Thai values and verified Chinese wording remain unchanged.

Three focused suites and 21 human-preference checks pass. Exact source tokens
and key order match across all 246 catalogs. Tests cover permission direction,
import exclusions, irreversible removal versus keeping data, technical
identifiers and runtime substitution. Five Thai browser cases register;
execution needs a running rebuilt app. The current fill list is empty, but
whole-catalog semantic review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/10c4cc3bfa">Fill Kannada feature strings and remove a redundant rule linking verb</a>. Thanks to xet7.</summary>

Translate 193 feature placeholders and nine labels hidden by exemptions,
including units, regions and short rule text. All existing non-English
Kannada values and verified Chinese wording remain unchanged. Rule rows omit
an extra linking verb before Kannada action phrases that already contain a
verb; progress counts use `1 / 10` in the existing fixed-order layout.

Five relevant suites and 21 human-preference checks pass. Tests cover
language-tag boundaries, preservation of other languages, import exclusions,
permissions, recovery consequences, exact source tokens and runtime values.
Six Kannada browser cases register, including rule rows and saved descriptions;
execution needs a running rebuilt app. The fill list and short-prose queue
are empty, but complete sentence grammar and broader wording review stay open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/762bb1df85">Fill Urdu feature strings and extend right-to-left browser coverage</a>. Thanks to xet7.</summary>

Translate 193 current placeholders for linked fields, import formats,
notifications, recovery and Trello. Existing non-English Urdu text and
verified Chinese wording remain unchanged. Literal API names, column
headers, format markers and placeholders are preserved.

Three focused suites, seven static RTL checks and 21 human-preference
checks pass. Source tokens and key order match across all 246 catalogs.
Ten Urdu browser cases register for feature flows, page direction, visible
text and mirrored placement; execution needs a running rebuilt app. The
current fill list is empty, but whole-catalog wording review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0ae7f04e55">Fill Malayalam feature strings and remove a redundant rule linking verb</a>. Thanks to xet7.</summary>

Translate 223 feature placeholders and thirteen exempt labels, including
Scrum import, synchronization and recovery. Existing non-English Malayalam
values and verified Chinese wording stay unchanged. Rule rows omit a separate
linking verb before action phrases that already contain their verb; progress
counts retain numerator/denominator order.

Six focused suites and 21 human-preference checks pass. Tests cover matched
versus unmatched planning, first-sync preservation, conflicts, irreversible
removal, permissions, source literals and runtime counts. Exact tokens and
key order match across all 246 catalogs. Nine Malayalam browser cases
register, including Scrum rollback, conflict and member restrictions;
execution needs a running rebuilt app. The fill and short-prose queues are
empty, but whole-catalog grammar and wording review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30a92983f5">Correct Azerbaijani board and assigned-person terminology</a>. Thanks to xet7.</summary>

Repair 38 values in each of the three Azerbaijani catalogs. Kanban boards
use `lövhə` instead of the word for a council; assignee labels describe the
person assigned. Fix the card-to-board command, public-visibility text and
invitation wording. Notification predicates fit the actor prefix, and all
query literals, placeholders and HTML emphasis remain intact.

Both terminology and correction-ledger suites pass; the ledger now verifies
24,953 exact repairs and preservation of newer reviewed text. All 21
human-preference checks pass. Three browser cases register for board creation
labels, visibility explanations and assigning a card; execution still needs a
running rebuilt app. Existing Chinese wording is unchanged. Azerbaijani's
remaining feature placeholders and broader language review stay open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d8a48c4d8">Fill Azerbaijani feature, recovery and accessibility strings</a>. Thanks to xet7.</summary>

Fill 223 feature placeholders and seven exempt labels in each of `az`,
`az-AZ` and `az-LA`, preserving every existing non-English value. Translate
linked fields, import formats, Trello export, notifications, Scrum planning
and recovery warnings. Storage labels and Blockly accessibility text are
translated too; fixed progress layouts use numerator/denominator notation.

Four focused suites and 21 human-preference checks pass. All 246 catalogs
retain exact source key order and placeholders. Thirty browser cases register
for the three variants, covering feature flows, Scrum recovery, storage and
Blockly; execution needs a running rebuilt app. Full Azerbaijani fill reports
are empty, but broader wording and grammar review remain open. Existing
Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6825f00ac7">Fill Latin Uzbek feature and recovery translations</a>. Thanks to xet7.</summary>

Fill 223 feature placeholders, the Bytes label and fourteen Blockly key
names in each of `uz`, `uz-UZ` and `uz-LA`, 714 values total. Translate
linked fields, importer instructions, notifications, Trello export, Scrum
planning and recovery warnings. Localized keyboard descriptions retain the
physical key legends in parentheses. Existing non-English values are kept.

Four focused suites and 21 human-preference checks pass. All 246 catalogs
retain source key order and placeholders. Twenty-seven browser cases register
for feature flows, Scrum recovery and Blockly in the three variants;
execution still needs a running rebuilt app. Full Latin Uzbek fill reports
are empty. Older terminology, composed grammar and the Arabic-script catalog
remain under review. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c10d035c2">Correct Uzbek assigned-person labels and time-history explanation</a>. Thanks to xet7.</summary>

Repair thirteen values in each Latin Uzbek catalog. Assignee labels name
the person assigned instead of the assigning party, including card dialogs,
search guidance and export fields. Restore the complete time-history note:
edits are grouped by the editor, are not individual work sessions, negative
values are corrections, and earlier unrecorded time cannot be attributed.

The terminology suite and all 24,992 correction-ledger entries pass,
alongside 21 human-preference checks. Six browser cases register for assigning
a card and reading the time-history note; execution needs a rebuilt app.
Unrelated translations and existing Chinese text are unchanged. Composed rule
grammar, Arabic-script Uzbek and broader wording review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3fe68ad266">Restore complete time-history explanations in 54 catalogs</a>. Thanks to xet7.</summary>

Replace abbreviated symbol-only notes with the full explanation in Nordic,
German, French, Spanish, Portuguese, Italian, Dutch, Polish, Czech, Russian,
Ukrainian, Turkish, Azerbaijani, Hungarian, Romanian, Greek, Malay, Vietnamese,
Japanese and Korean catalogs. Changes are grouped by the person editing the
total, not individual work sessions. Negative values are corrections, and
previously unrecorded time cannot be attributed to anyone.

The meaning tests and all 25,046 correction-ledger entries pass, alongside
21 human-preference checks. The existing browser flow now registers in these
54 locales plus English, exercising corrections, rejected negative totals,
report text and exports; it has not run against a rebuilt app. Existing
Chinese wording is unchanged. Other time-history translations remain under
review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44d8210a69">Restore time-history meaning in 48 more catalogs</a>. Thanks to xet7.</summary>

Replace abbreviated explanations in 43 more translated catalogs and five
English regional files. Restore all four source distinctions about the
editor, separate work sessions, negative corrections and unrecorded time.
Remove mixed-language fragments from Latvian, Bosnian and Macedonian notes;
existing full explanations and verified Chinese wording are preserved.

The shared meaning tests now cover 102 catalogs, and the full ledger passes
with 25,094 corrections. All 21 human-preference checks pass. The browser
flow registers in 103 locales including English, checks RTL page direction
where needed, and uses the registered Valencian language tag. Execution
against a rebuilt app and the remaining language reviews are still pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6aa8490d0">Complete time-history explanations in 23 more catalogs</a>. Thanks to xet7.</summary>

Replace abbreviated notes in Belarusian, Assamese, Odia, Punjabi, Sinhala,
Javanese, Haitian Creole, Frisian, Luxembourgish, Latin, Faroese, Welsh,
Irish, Scottish Gaelic, Occitan, Asturian, Aragonese, Corsican, Sardinian,
Sicilian and Tajik catalogs, including the selected regional files. Preserve
all four source distinctions about edits to totals and attribution.

The shared tests cover 125 explanations; all 25,117 correction-ledger entries
and 21 human-preference checks pass. The browser flow registers 126 cases
including English but has not run against a rebuilt app. Some regional
technical wording is provisional pending fluent review. Existing Chinese
text and unrelated translations remain unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f84a8e3a83">Verify new Chinese email-to-card translations</a>. Thanks to xet7.</summary>

Review all 49 new strings in nine Chinese catalogs, covering 441 values.
Check identity and write-permission warnings, secret retention, invalidated
addresses, and the distinction between marking mail read and deleting it.
All 37,287 earlier values remain unchanged; this review adds tests without
rewriting the translations being developed with the email feature.

Two focused suites and 21 human-preference checks pass. Eighteen browser
cases register for board destinations and administrator mailbox controls;
they have not run against a rebuilt app. The tests explicitly skip on
branches without the email feature's source strings. All nine semantic
cases ran without skips against the current working tree.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/021d016f5d">Restore time-history explanations in eight more catalogs</a>. Thanks to xet7.</summary>

Replace abbreviated notes in Kurmanji, Sorani, Pashto, Sindhi, Uyghur,
Hausa, Somali and Japanese Hiragana. State that changes are grouped by
editor, are not individual work sessions, may be negative corrections,
and cannot attribute earlier unrecorded time. Use Hiragana for that
Japanese variant and its registered language tag in browser coverage.

Three suites verify 133 explanations, 25,125 recorded corrections and
unchanged acceptances. All 21 human-preference checks pass. The browser
suite registers 134 language cases and three other cases, with RTL
checks extended to the newly covered scripts; execution remains pending.
The seven non-Japanese technical translations are provisional pending
fluent review. Existing Chinese wording is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a7fa67d94">Complete time-history explanations in Khmer and six more languages</a>. Thanks to xet7.</summary>

Restore the four source meanings in Khmer and both regional catalog paths,
Burmese, Amharic, Yiddish, Bhojpuri, Maithili and Konkani. Preserve the Khmer
symlink, use its registered browser language tag, and extend the browser
RTL check to Yiddish. Technical prose remains provisional for fluent review.

Three suites pass, covering 142 explanations and all 25,134 correction
records, together with unchanged acceptances. All 21 human-preference
checks pass. The browser suite registers 143 language cases and three
other cases; execution remains pending. Existing Chinese text is unchanged,
and concurrent new email/chat translations are preserved.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60528034c1">Translate Maltese attached cards and linked custom fields</a>. Thanks to xet7.</summary>

Fill 30 English placeholders for attaching cards and linking custom fields.
Explain which fields match, how changes flow in each direction, when a link
is paused, and why both cards must be editable. Translate hidden-card,
self-link, archive and limit errors. Existing translated values are retained.

All three semantic checks and 21 human-preference checks pass. The existing
attachment and custom-field-link browser flows now include Maltese, with
positive and negative cases. Both register, but could not run because the
local test app refuses connections. Maltese still has 193 filtered English
placeholders; full wording review remains open. Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57a10d1ac9">Translate Maltese recovery decisions and warnings</a>. Thanks to xet7.</summary>

Fill 46 English messages for interrupted imports, stopped list
synchronizations and Scrum history recovery. Distinguish retained changes,
unwritten changes, permanent board deletion and restoring previous records.
Preserve placeholder tokens and existing translations.

Three Maltese suites and 21 human-preference checks pass. Five browser
recovery cases register, covering administrator actions, conflicts and
ordinary members; execution remains pending. Maltese has 147 filtered
placeholders left. The older progress test now reports its actual earlier
catalog scope instead of claiming the whole locale is complete. Existing
Chinese values remain unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e6b6340df">Translate Maltese notification delivery and planning sync</a>. Thanks to xet7.</summary>

Fill 43 English messages for webhook contents and identity, notification
grouping, schedules, quiet hours and Scrum planning synchronization. Retain
inherited settings, delayed delivery, source-ID matching, local planning
changes and the non-destructive first-sync guarantee.

Four Maltese suites and 21 human-preference checks pass. Two browser cases
register for member notification settings and planning synchronization;
execution remains pending. Maltese has 104 filtered English values left.
Existing Maltese translations and Chinese text remain unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0c5c03cb1">Translate Maltese import mapping controls</a>. Thanks to xet7.</summary>

Fill 16 messages for imported people and CSV columns. Distinguish existing
users, named placeholders and the person importing. Explain absent fields,
skipped sheets and the single destination list when no list column exists.

Four Maltese suites and 21 human-preference checks pass. Two existing
browser flows now include Maltese, covering person mapping and missing-list
validation; they register but have not run. Only English placeholders were
changed. Maltese has 88 remaining; existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c87fcb37ec">Translate Maltese Scrum import and subtask controls</a>. Thanks to xet7.</summary>

Fill 20 messages for Scrum transfer previews, matching failures, release
selection and subtask completion. Keep unmatched cards unchanged, avoid
duplicating planning, and distinguish finished sprints and permission errors.

Four Maltese suites and 21 human-preference checks pass. Three browser cases
register for Scrum import, subtask completion and comment-only restrictions;
execution remains pending. Maltese has 68 filtered placeholders left.
Earlier translations and protected Chinese values remain unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bbe5b139d2">Translate Maltese batch import and export guidance</a>. Thanks to xet7.</summary>

Fill 23 messages for multiple-board imports, workbook and ZIP exports,
Trello export and Sandstorm access. Preserve the single-export ZIP exception,
export permissions, omitted member mapping and the literal Swimlane label.

Four Maltese suites and 21 human-preference checks pass. The Maltese Trello
export-dialog case registers without submitting credentials or contacting
Trello; execution remains pending. Maltese has 45 filtered placeholders left.
Existing translated values and Chinese text remain unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ce113b5a50">Translate Maltese settings and workflow rules</a>. Thanks to xet7.</summary>

Fill 23 messages for board controls, link patterns, Wrike workflows, LDAP
synchronization and login restrictions. Preserve literal examples, status
names, endpoints and configuration variables, including their spelling.

Four Maltese suites and 21 human-preference checks pass. Calendar, Wrike
workflow and LDAP browser cases register in Maltese; execution remains
pending. The remaining 22 Maltese placeholders are import-format guidance.
Earlier translations and protected Chinese values remain unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f26aaac01e">Complete Maltese import-format instructions</a>. Thanks to xet7.</summary>

Translate the final 22 filtered Maltese placeholders, covering import-format
instructions and their limitations. Retain literal field names, menu names,
syntax and the warnings about omitted data and first-board-only imports.
The full filtered Maltese fill report is now empty after 223 feature fills.

Four Maltese suites and 21 human-preference checks pass. Twenty-two browser
instruction cases register with the local Playwright runner; they have not
run against a rebuilt app. The full current inventory is now checked instead
of the earlier catalog snapshot. Broader wording and exempt-string review
remain open, as does work in other languages. Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d5ae79420">Translate Maltese prose hidden by fill-report exemptions</a>. Thanks to xet7.</summary>

Repair 38 English storage descriptions, field labels and short rule terms
excluded from the normal fill report. Preserve product names, endpoint
examples, placeholders and already translated values. Record exact
before/after values so newer translations cannot be overwritten.

Five suites and 21 human-preference checks pass, including all 25,172
correction records. The Maltese storage-settings browser case registers but
has not run. The extra short-prose queue is empty; the exempt-prose queue
retains Bytes, Logo and the Alt key legend. Broader composed-rule grammar
and other languages remain under review. Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4f4e465f2">Translate Swahili card links and recovery decisions</a>. Thanks to xet7.</summary>

Fill 76 English placeholders for attached cards, linked custom fields,
interrupted imports, stopped list synchronization and Scrum recovery.
Preserve matching rules, edit permissions, change direction and the
differences between keeping data and permanently removing imported boards.

Both Swahili suites and 21 human-preference checks pass. Seven browser
cases register, covering normal actions, permissions and recovery conflicts;
execution remains pending. Swahili has 147 filtered placeholders left.
Existing translated values and protected Chinese text remain unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/387b88c959">Translate Swahili notification, mapping and Scrum controls</a>. Thanks to xet7.</summary>

Fill 79 English messages for notification grouping and schedules, webhook
privacy, planning synchronization, imported people, CSV mapping, Scrum
transfers and subtask completion. Preserve quiet hours, first-sync safeguards,
unmatched cards, permission refusals and literal tokens.

Both Swahili suites and 21 human-preference checks pass. Seven additional
browser cases register across six existing flows; execution remains pending.
Swahili has 68 filtered placeholders left. Existing translated values and
protected Chinese text remain unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e02fd383b5">Translate Swahili export guidance and settings</a>. Thanks to xet7.</summary>

Fill 46 messages for multiple-board import/export, Trello and Sandstorm,
board controls, link patterns, Wrike workflows, LDAP and login restrictions.
Keep literal examples and configuration names, archive exceptions, export
permissions and unsupported-operation warnings.

Both Swahili suites and 21 human-preference checks pass. Four additional
browser cases register for Trello, calendar mode, Wrike and LDAP; execution
remains pending. Swahili has 22 import-format placeholders left. Existing
translated values and protected Chinese text remain unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d963a78bf4">Complete Swahili import-format instructions</a>. Thanks to xet7.</summary>

Translate the remaining 22 import-format instructions, preserving literal
headers, file syntax, first-board limits and warnings about omitted data.
Both Swahili suites and 21 human-preference checks pass; all 4,232 keys
retain the source token inventories. The shared Maltese/Swahili browser
suite registers 44 cases; application execution remains pending.

Swahili's full filtered placeholder report is empty. Exempt strings and
broader wording review remain unfinished. Existing Swahili translations
and all 38,079 protected Chinese values remain unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cdb2405e93">Translate Corsican card attachments and linked fields</a>. Thanks to xet7.</summary>

Fill 30 English messages for attached cards and linked custom fields.
Retain propagation direction, edit-permission requirements, archived-card
restrictions and warnings about inaccessible cards. The Corsican suite and
21 human-preference checks pass; two browser cases register but have not
run against the application.

Corsican has 163 filtered placeholders left. Regional wording and older
mixed-language text still need review. Prior translations and all protected
Chinese values remain unchanged by this batch.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef77f5a3f3">Translate Corsican synchronization and import recovery</a>. Thanks to xet7.</summary>

Fill 37 messages explaining interrupted synchronization and board imports.
Preserve warnings about changes already applied, unrecorded source files,
permanent deletion and later additions to partial boards. Tests cover all
48 recovery strings, including the previously translated controls.

The Corsican suite and 21 human-preference checks pass. Two browser cases
register; application execution and fluent wording review remain pending.
Corsican has 126 filtered placeholders left. Existing translated values and
protected Chinese text remain unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/877a3a7e81">Translate Corsican notification delivery and webhooks</a>. Thanks to xet7.</summary>

Fill 39 messages for webhook payloads, identity omission, notification
layout, grouping and scheduling. Preserve inherited defaults, technical
field names, quiet-hour waiting and placeholder tokens.

The Corsican suite and 21 human-preference checks pass. The settings
browser case registers for Corsican; application execution and fluent
wording review remain pending. Corsican has 87 filtered placeholders left.
Prior translations and protected Chinese values remain unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/342e479ed9">Translate Corsican import, export and board controls</a>. Thanks to xet7.</summary>

Fill 65 messages for CSV mapping, imported people, batch import/export,
Trello and Sandstorm, board controls, Wrike rules, LDAP and login settings.
Preserve technical literals, archive exceptions, permission requirements
and warnings about unsupported operations.

The Corsican suite and 21 human-preference checks pass. Eight browser
cases register across seven workflows; runtime execution remains pending.
Corsican has 22 import-format placeholders left. Prior translations and
protected Chinese values remain unchanged; broader language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9198e84b39">Complete Corsican import-format instructions</a>. Thanks to xet7.</summary>

Translate 22 import instructions, preserving format syntax, column names,
first-board limits and warnings about omitted data. The Corsican suite now
checks the full filtered inventory, which is empty; older mixed-language
text and exempt prose still need review.

The translation suite and 21 human-preference checks pass. The shared
importer browser suite registers 66 cases across Corsican, Maltese and
Swahili; runtime execution remains pending. Prior translations and all
protected Chinese values remain unchanged by this batch.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3c22d9e92">Correct mixed Italian wording in Corsican activity messages</a>. Thanks to xet7.</summary>

Replace 22 mixed-language activity messages with Corsican and remove a
stray digit before the subtask placeholder. Preserve source tokens and
distinguish adding, removing, checking and unchecking items.

The Corsican suite, full correction-ledger suite and 21 human-preference
checks pass. Card-creation history now has a registered Corsican browser
case; runtime execution remains pending. Protected Chinese values remain
unchanged, and broader Corsican wording review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f7e256b997">Correct Corsican activity notification wording</a>. Thanks to xet7.</summary>

Replace 39 mixed-language notification values with Corsican attachment,
checklist, custom-field, membership and card-movement wording. Preserve
source placeholders, including their case, and movement direction.

The Corsican suite, full repair-ledger suite and 21 human-preference checks
pass. A notification-drawer browser case registers but has not run against
the application. Existing protected Chinese values remain unchanged;
broader language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/724fd0730d">Correct Corsican permissions and board controls</a>. Thanks to xet7.</summary>

Repair 37 mixed-language values for membership, comments, roles, subtasks,
archives and board controls. Correct the account-anonymization title and
retain the distinction between logged-in users and registered users.

The Corsican suite, full repair-ledger suite and 21 human-preference checks
pass. All 4,265 source keys have matching Corsican placeholder inventories.
The subtask browser cases register with the corrected heading assertion;
application execution remains pending. Protected Chinese values are unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d07120761b">Correct Corsican board warnings and import guidance</a>. Thanks to xet7.</summary>

Repair 33 mixed-language board, deletion, invitation and filter messages.
Restore Jira pagination and required-field instructions and Excel mapping
and per-sheet behavior. Preserve irreversible-deletion warnings and HTML.

The Corsican suite, repair-ledger suite and 21 human-preference checks pass.
The importer browser suite registers 69 cases, including three new Corsican
formats; execution remains pending. Protected Chinese values are unchanged,
and broader language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7a4eb0ffd">Correct Corsican filter help and access guidance</a>. Thanks to xet7.</summary>

Repair 20 mixed-language values for advanced filters, Trello, archives,
board visibility and access. Restore exact filter examples and retain the
warning that removing a member in WeKan does not revoke Sandstorm access.

Three translation suites and 21 human-preference checks pass. The filter
help browser case registers; application execution remains pending.
Protected Chinese values remain unchanged. Broader language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f4e5519c87">Correct Corsican settings, rules and deletion confirmations</a>. Thanks to xet7.</summary>

Repair 25 mixed-language values for board preferences, avatars, rule actions,
custom web settings and deletion. Preserve duplicate-list conditions,
movement direction, technical literals and irreversible-action warnings.

The Corsican suite, repair-ledger suite and 21 human-preference checks pass.
A delete-all notification browser case registers and checks cancellation;
application execution remains pending. Protected Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e10d606b5">Correct Corsican administrative and storage wording</a>. Thanks to xet7.</summary>

Repair 25 mixed-language values for roles, shared templates, organization
and team membership, search guidance and attachment storage. Preserve
nonempty-template eligibility, deletion refusal and storage destinations.

The Corsican suite, full repair-ledger suite and 21 human-preference checks
pass. A shared-template browser case registers; execution remains pending.
Existing protected Chinese values are unchanged. Broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/78d684e364">Correct Corsican storage migration and avatar guidance</a>. Thanks to xet7.</summary>

Repair 25 mixed-language values for storage repair, database migration,
Sandstorm cleanup, avatars, account unlocking and scheduled operations.
Preserve migration prerequisites, retained data and irreversible warnings.

The Corsican suite, full repair-ledger suite and 21 human-preference checks
pass. The S3 settings browser case registers for Corsican; execution remains
pending. Protected Chinese values are unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7c43eeb4b">Correct Corsican repair and recovery guidance</a>. Thanks to xet7.</summary>

Repair 20 mixed-language values for account anonymization, watching,
recovery migrations and storage. Preserve non-archived versus all-archived
scope, administrator requirements, literal identifiers and undo warnings.

The Corsican suite, full repair-ledger suite and 21 human-preference checks
pass. The registered S3 browser case now checks endpoint guidance; execution
remains pending. Protected Chinese text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9869b00d25">Correct Corsican workspace and card controls</a>. Thanks to xet7.</summary>

Repair 37 mixed-language workspace, selection, date-activity, layout and
subtask values. Preserve the one-board Home limit, opening after login,
nondeletion warning and positive-integer height requirement.

The Corsican suite, full repair-ledger suite and 21 human-preference checks
pass. Registered subtask browser cases include the corrected add control;
runtime execution remains pending. Protected Chinese values are unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b1c1c68040">Correct Corsican board display and attachment warnings</a>. Thanks to xet7.</summary>

Repair 27 mixed-language board, archive, template and attachment messages.
Preserve the offline data-loss warning, administrator-only board creation,
permanent attachment deletion and board-reordering instructions.

The Corsican suite, full repair-ledger suite and 21 human-preference checks
pass. The template-container browser case registers; runtime execution is
pending. Protected Chinese values are unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b61c0df17f">Correct Corsican board views and timeline wording</a>. Thanks to xet7.</summary>

Repair 26 menu, view, timeline and calendar values. Remove an unrelated
in-progress prefix from Gantt and restore the Gregorian calendar and ISO
week meaning. Timeline restoration retains every field and the no-deletion
warning.

The Corsican suite, full repair-ledger suite and 21 human-preference checks
pass. A calendar-settings browser case registers; runtime execution remains
pending. Protected Chinese values are unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a63e83ec5e">Correct Corsican card controls and Planning Poker scores</a>. Thanks to xet7.</summary>

Repair 47 card, archive, voting and account values. Remove unrelated
in-progress prefixes from Planning Poker's name and all numeric/unknown
scores. Retain permanent-deletion warnings and archive visibility behavior.

The Corsican suite, full repair-ledger suite and 21 human-preference checks
pass. A Planning Poker browser case registers; runtime execution remains
pending. Protected Chinese text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18278cce84">Correct Corsican profile and appearance controls</a>. Thanks to xet7.</summary>

Repair 38 profile, import-member mapping, font, theme and card-aging values.
Keep imported roles and permission limits, favorite toggle direction,
automatic width and inactivity thresholds explicit.

The Corsican suite, full repair-ledger suite and 21 human-preference checks
pass. A font-controls browser case registers; runtime execution remains
pending. Existing Chinese text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dbaa663280">Correct Corsican navigation, colors and role permissions</a>. Thanks to xet7.</summary>

Repair 47 navigation, color, role and template controls. Restore the empty
comment placeholder, movement directions, board recovery location and
comment-only/worker permission limits. Specialized color shade wording
remains open to native-speaker refinement.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
The existing color-rule browser test now includes Corsican; its runtime
execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f89cd92e3">Correct Corsican fields, account messages and export controls</a>. Thanks to xet7.</summary>

Repair 62 field, date, account, permission and export values. Preserve
email placeholders and distinct enrollment, reset and verification actions.
Clarify that enabling permanent deletion does not itself delete content.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
A custom-field browser case registers; runtime execution remains pending.
Existing Chinese text is unchanged; broader language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b9c88ba25">Correct Corsican filters and importer guidance</a>. Thanks to xet7.</summary>

Repair 28 filter, member and importer values, including older English
Todoist and Planner instructions. Keep the current export-menu paths,
import mappings, literal field names and attachment exclusions.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
Six importer browser cases register; runtime execution remains pending.
Existing Chinese text is unchanged; broader language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b03a4afca6">Correct Corsican Trello imports and cancellation messages</a>. Thanks to xet7.</summary>

Repair 43 import, workspace, member-mapping and cancellation values. Keep
ZIP size/count/path errors distinct and limit irreversible deletion to
boards imported by the current job. Preserve optional workspace placement.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
A Trello import browser case registers; runtime execution remains pending.
Existing Chinese text is unchanged; broader language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01e3a9542e">Correct Corsican board, archive and member controls</a>. Thanks to xet7.</summary>

Repair 52 board, selection, archive and member values. Distinguish personal
overrides from cancellation, remove an unrelated Gantt prefix, and retain
assigned-only visibility, notification conditions and deletion warnings.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
An archive-tab browser case registers; runtime execution remains pending.
Existing Chinese text is unchanged; broader language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f2e4740ab">Correct Corsican settings, shortcuts and membership messages</a>. Thanks to xet7.</summary>

Repair 42 settings, shortcut, membership and time-tracking values. Keep
member-removal notifications, unsaved-description recovery and overtime
distinct from overdue dates. Preserve the Pomodoro technique name.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
A shortcuts browser case registers; runtime execution remains pending.
Existing Chinese text is unchanged; broader language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84e25df892">Correct Corsican uploads and attachment limits</a>. Thanks to xet7.</summary>

Repair 42 upload, template, notification and attachment-limit values.
Preserve upload/download directions, separate API buffering safety limits
and WIP recovery choices. Restore GB, MB and Bytes without extra prefixes.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
An attachment-limit browser case registers; runtime execution remains
pending. Existing Chinese text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1eb90ef43f">Correct Corsican invitations and organization administration</a>. Thanks to xet7.</summary>

Repair 62 email, system, field and organization values. Preserve invitation
tokens, tenant-routing configuration, organization-admin permission limits
and permanent board deletion warnings. Restore Meteor and Node names.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
The field-controls browser case gains creation-scope labels; runtime
execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6ad1329613">Correct Corsican card hierarchy, activities and rules</a>. Thanks to xet7.</summary>

Repair 43 hierarchy, minicard, activity and rule values. Retain parent-card
relationships, full paths, movement direction, checklist counts and exact
activity placeholders.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
An empty-rules-page browser case registers; runtime execution remains
pending. Existing Chinese text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c787355da">Correct Corsican automation workflows and scheduling</a>. Thanks to xet7.</summary>

Repair 58 workflow, trigger, scheduling and action values. Retain Butler
and visual-workflow import limitations, unmapped-node reporting, movement
direction and complete/incomplete distinctions.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
A workflow-builder browser case registers; runtime execution remains
pending. Existing Chinese text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed0c2c3ffc">Correct Corsican date triggers and automation actions</a>. Thanks to xet7.</summary>

Repair 40 trigger and action values. Restore both initial setting and later
changes in date conditions, full assignee conditions, checklist negations
and movement/email destinations.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
A date-trigger browser case registers; runtime execution remains pending.
Existing Chinese text is unchanged; broader language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2b4ea8984">Correct Corsican rule summaries, login settings and date activities</a>. Thanks to xet7.</summary>

Repair 59 rule, authentication, activity and placement values. Preserve
login prerequisites, old/new date placeholders, deletion warnings and
movement direction. Restore technical names without unrelated prefixes.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
A passwordless-settings browser case registers; runtime execution remains
pending. Existing Chinese text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0343ff48a0">Correct Corsican preferences, roles and weekdays</a>. Thanks to xet7.</summary>

Repair 44 member-preference, notification, role and calendar values. Keep
editor shortcuts, global-admin rights, role previews before saving and
linked-card deletion ordering. Replace Italian weekday names.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
A member-preference browser case registers; runtime execution remains
pending. Existing Chinese text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/930fd9fe2b">Correct Corsican templates and search results</a>. Thanks to xet7.</summary>

Repair 47 template, search and result-count values. Preserve authorized-board
scope and member-or-assignee restrictions, and restore search abbreviations
without unrelated prefixes.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
The shared-template browser case gains scope-hint coverage; runtime execution
remains pending. Existing Chinese text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d017d184dc">Correct Corsican search keywords and instructions</a>. Thanks to xet7.</summary>

Repair 37 search values, preserving executable examples and the meaning of
created or modified within the last N days. Translated existence checks
retain positive and negative forms.

The Corsican, repair-ledger and actual-parser suites pass, along with 21
human-preference checks. An overdue-search browser case is registered;
runtime execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5fce837d4e">Correct Corsican search help and dependency controls</a>. Thanks to xet7.</summary>

Repair 50 search, dependency, background and map-control values. Preserve
OR/AND guidance, absence checks and descending-sort syntax. Restore Arial
and region names without invented language prefixes.

The Corsican, repair-ledger and actual-parser suites pass, along with 21
human-preference checks. Search-help browser coverage is registered;
runtime execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c96e8b59e">Correct Corsican report and ticket translations</a>. Thanks to xet7.</summary>

Repair 63 report, recovery, ticket and display-control values. Preserve
login grouping, API aggregation, recovery operations and technical literals.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
Recovery-report browser coverage is registered; runtime execution remains
pending. Existing Chinese text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/588e39a31e">Correct Corsican checklist and storage translations</a>. Thanks to xet7.</summary>

Repair 53 checklist, attachment-storage and status values. Preserve item
ordering, storage product names, Compact replica ordering and the distinction
between overtime and overdue deadlines.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
Default-storage browser coverage is registered; runtime execution remains
pending. Existing Chinese text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cb558de5f">Correct Corsican recurrence and account settings</a>. Thanks to xet7.</summary>

Repair 46 upload, recurrence, support and lockout values. Distinguish card
recurrence from reset, and wrong passwords from nonexistent usernames.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
Lockout-settings browser coverage is registered; runtime execution remains
pending. Existing Chinese text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8c5783f41">Correct Corsican scheduling and migration translations</a>. Thanks to xet7.</summary>

Repair 49 scheduling, storage and database-migration values. Preserve product
names, migration prerequisites, file exclusions and configuration commands.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
Migration-help browser coverage is registered; runtime execution remains
pending. Existing Chinese text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf03f236b5">Correct Corsican feature and backup guidance</a>. Thanks to xet7.</summary>

Repair 42 feature and backup values. Restore automatic card-loading guidance
and the account-anonymization confirmation, which wrongly described export.
Preserve irreversible account changes, retained history and backup scope.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
Two help-text browser cases are registered; runtime execution is unavailable
because the local app is not running. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56dd1cbf08">Correct Corsican restore and cloud-storage translations</a>. Thanks to xet7.</summary>

Repair 51 restore, cloud-storage and migration values. Preserve credential
alternatives, provider menu labels, restore destinations and migration states.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
Cloud-help browser coverage is registered; runtime execution remains pending.
Existing Chinese text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f4d12f7b0f">Correct Corsican board-migration and progress translations</a>. Thanks to xet7.</summary>

Repair 55 migration, repair and progress values. Preserve duplicate-empty-list
conditions, shared-list conversion ordering and independent repair actions.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
Browser validation remains pending. Existing Chinese text is unchanged;
broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1cc3c49cd">Correct Corsican monitoring and job-control translations</a>. Thanks to xet7.</summary>

Repair 52 monitoring, scheduling and migration-control values. Preserve
numeric limits, background behavior and literal storage product names.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
Browser validation remains pending. Existing Chinese text is unchanged;
broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/105eb49d8c">Correct Corsican account, report and import wording</a>. Thanks to xet7.</summary>

Repair 45 account, report and scoped-import values. Preserve repair limits,
acknowledgement scope, import/export choices and card-number search syntax.

The Corsican, repair-ledger and actual-parser suites pass, along with 21
human-preference checks. Conditional report-help browser coverage is
registered; runtime execution remains pending. Existing Chinese text is
unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b73b3a0b9">Restore full Corsican flow-analysis explanations</a>. Thanks to xet7.</summary>

Repair 47 flow-analysis, WIP-group and authentication values. Replace
abbreviated substitutes with forecast assumptions, missing-history behavior
and date fallbacks. Statistical terminology needs native review.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
Five chart-help browser cases are registered; runtime execution remains
pending. Existing Chinese text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b753e316d">Review Corsican Blockly strings and preserve keyboard legends</a>. Thanks to xet7.</summary>

Review Blockly accessibility, control-flow and list strings. Correct eight
keyboard legends and a map example, and check numbered placeholder identity
and multiplicity throughout the Corsican catalog.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
The existing map browser suite now includes Corsican; runtime execution
remains pending. Existing Chinese text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d22052060">Review Corsican Blockly math and text operations</a>. Thanks to xet7.</summary>

Review the remaining Blockly operations and following Scrum labels. Correct
eight keyboard, shortcut and sorting values; verify logical and mathematical
distinctions while preserving the existing translated prose.

The Corsican and repair-ledger suites and 21 human-preference checks pass.
The existing Blockly interaction suite now includes Corsican; runtime
execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e88d2ebc11">Complete the source-ordered Corsican catalog review</a>. Thanks to xet7.</summary>

Review the final 440 strings and correct five Italian recovery and email
attachment labels. Preserve existing warnings about partial imports, sync
recovery and private email addresses. The review now reaches all 4,270 keys;
it does not certify native fluency or complete the all-language audit.

The Corsican and repair-ledger checks and 21 human-preference checks pass.
Recovery-button browser assertions pass syntax and discovery checks; runtime
execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6a5484608">Translate Southern Sotho card attachments and linked fields</a>. Thanks to xet7.</summary>

Fill 34 English placeholders for attached cards, linked custom fields,
board announcements, calendar mode and inherited card colours. Preserve
link direction, matching field names and types, and edit permissions.

Translation regression checks and 21 human-preference checks pass. The
two existing card-interaction browser cases now include Southern Sotho;
syntax and discovery pass, but runtime execution remains pending. Existing
Chinese text is unchanged. Translation work across languages continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/42d5187bf6">Translate Southern Sotho import instructions</a>. Thanks to xet7.</summary>

Translate instructions for 22 import formats, preserving menu and column
names, file extensions, field mappings and exclusions. Regression checks
cover first-board selection, English headers and omitted attachments.

The translation suite and 21 human-preference checks pass. All 22 import-help
browser cases register for Southern Sotho and pass syntax checks; runtime
execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d33245d26b">Translate Southern Sotho import and webhook controls</a>. Thanks to xet7.</summary>

Fill 55 placeholders for people and CSV mapping, batch import/export,
Trello access, link rules and webhook payloads. Preserve substitution
tokens, interchange markers, inherited settings and permission limits.

Translation checks and 21 human-preference checks pass. CSV validation and
member-mapping browser cases now include Southern Sotho; syntax and discovery
pass, but runtime execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c10778dac">Translate Southern Sotho notification and automation settings</a>. Thanks to xet7.</summary>

Fill 46 placeholders for delivery timing and grouping, Wrike workflow
states, LDAP sync, field visibility and subtask completion. Preserve
permission limits, environment names and replacement tokens.

Translation checks and 21 human-preference checks pass. Notification and
subtask browser cases include Southern Sotho, with a negative permission
case; syntax and discovery pass, but runtime execution remains pending.
Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73e233a13b">Translate Southern Sotho Blockly editor and control flow</a>. Thanks to xet7.</summary>

Translate 75 editor, accessibility, colour and control-flow strings. Keep
18 physical keyboard legends with exact-value exemptions. Check numbered
placeholders, break/continue, while/until and colour bounds. Descriptive
programming terminology has lower confidence and needs native review.

Translation checks and 21 human-preference checks pass. The existing
Southern Sotho Blockly browser case passes syntax and discovery checks;
runtime execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c9fdb2f34c">Translate Southern Sotho Blockly accessibility and lists</a>. Thanks to xet7.</summary>

Fill 110 input-label, keyboard-navigation and list-operation placeholders.
Checks distinguish get/remove, first/last, dividend/divisor, copy semantics
and not-found behavior. Programming terminology still needs native review.

Translation checks and 21 human-preference checks pass. The existing
Southern Sotho Blockly browser case passes syntax and discovery checks;
runtime execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb193ebb80">Translate Southern Sotho Blockly logic and mathematics</a>. Thanks to xet7.</summary>

Fill 90 list-sorting, logic, arithmetic and statistics placeholders.
Checks retain AND/OR, strict/inclusive comparisons, negation, sorting a
copy, numeric bounds and constants. Statistical and trigonometric
terminology remains lower confidence pending native review.

Translation checks and 21 human-preference checks pass. The existing
Southern Sotho Blockly browser case passes syntax and discovery checks;
runtime execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b54fe95288">Translate Southern Sotho Blockly procedures and math controls</a>. Thanks to xet7.</summary>

Fill 95 math, procedure, accessibility and shortcut placeholders. Checks
retain random bounds, degrees rather than radians, return values, disabled
definitions and screen-reader toggles. Technical terms need native review.

Translation checks and 21 human-preference checks pass. The existing
Southern Sotho Blockly browser case passes syntax and discovery checks;
runtime execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6740c17a0">Translate Southern Sotho Blockly text and rule-editor messages</a>. Thanks to xet7.</summary>

Fill 115 text, shortcut, workspace and rule-editor placeholders. Preserve
index direction, missing results, replacement scope, search keys and rule
constraints. A full-inventory check finds no non-exempt English Blockly
placeholders; descriptive terminology still needs native review.

Translation checks and 21 human-preference checks pass. The existing
Southern Sotho Blockly browser case passes syntax and discovery checks;
runtime execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59b761f444">Translate Southern Sotho Scrum planning and reports</a>. Thanks to xet7.</summary>

Fill 75 planning, sprint, release and report placeholders. Preserve
cancellation and rollover behavior, partial reports, unknown estimates
and daily first-observation caveats. Scrum terms need native review.

Translation checks and 21 human-preference checks pass. The backlog paging
browser case now includes Southern Sotho; syntax and discovery pass, but
runtime execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1128608ba5">Translate Southern Sotho Scrum import and sync guidance</a>. Thanks to xet7.</summary>

Fill 50 import, conflict and preview placeholders. Preserve unchanged
unmatched cards, source read-only behavior, assigned-card review scope,
local-copy preservation and replacement reuse on retries.

Translation checks and 21 human-preference checks pass. The Scrum import
browser case now includes Southern Sotho; syntax and discovery pass, but
runtime execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b7fb228486">Translate Southern Sotho sync diagnostics and planning</a>. Thanks to xet7.</summary>

Fill 45 source-report, retention, estimate-mapping, email-failure and
planning placeholders. Preserve missing-versus-null handling, access
requirements and warnings that reports cannot resume or undo changes.

Translation checks and 21 human-preference checks pass. The sync-planning
browser case now includes Southern Sotho; syntax and discovery pass, but
runtime execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80df25497d">Fill remaining Southern Sotho recovery translations</a>. Thanks to xet7.</summary>

Translate 72 recovery placeholders and add a full-inventory no-placeholder
gate. Retain permanent-cancellation warnings, partial-import deletion,
already-applied sync changes and guarded Scrum rollback behavior.

Translation checks and 21 human-preference checks pass. Six recovery browser
cases pass syntax and discovery; runtime execution remains pending. Existing
Chinese text is unchanged. Zero English placeholders does not certify fluency;
native review and the all-language objective remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef05274b3c">Repair Southern Sotho activity and control meanings</a>. Thanks to xet7.</summary>

Review the first 220 strings. Correct four meaning errors: reversed title
arguments, automatic template application, a positive-integer height
constraint and matching-card search scope. Preserve valid existing wording.

Translation and repair-ledger suites and 21 human-preference checks pass.
The activity browser case gains Southern Sotho argument-order assertions;
syntax and discovery pass, but runtime execution remains pending. Chinese
text is unchanged; broader review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/397ea42870">Repair Southern Sotho board and card control meanings</a>. Thanks to xet7.</summary>

Review the next 235 strings and correct nine meanings: size limits,
historical timestamps, grouping, pulse, unread comments, due dates,
account anonymization and labels. Preserve valid existing text.

Translation and repair-ledger suites and 21 human-preference checks pass.
A read-only popup-title browser case passes syntax and discovery; runtime
execution remains pending. Existing Chinese text is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e69d2c7311">Correct Southern Sotho archive help and template terminology</a>. Thanks to xet7.</summary>

Reviewed source keys 455–589, preserving valid translations. Archive restoration
now points to All Boards instead of the obsolete home-page header. The Worker
role names a person, and Save as Template no longer says save as a picture.

Southern Sotho and repair-ledger suites pass with 26,890 guarded corrections;
all 21 human-preference checks pass. Archive-help browser coverage passes syntax
and discovery checks; runtime execution remains pending. All 38,430 existing
Chinese values are preserved. Southern Sotho has no remaining non-exempt English
placeholders; semantic review and the all-language translation work continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44cc4c30ee">Repair Southern Sotho filter syntax and import guidance</a>. Thanks to xet7.</summary>

Reviewed source keys 590–813 and corrected five values. Advanced-filter help
preserves the literal escaped apostrophe example and identifies single quotes.
Markdown help includes plain bullet lists importing as open cards. Excel export
messages describe unused disk space rather than free-of-charge space, and custom
fields use data terminology rather than agricultural fields.

Southern Sotho and repair-ledger suites pass with 26,895 guarded corrections;
all 21 human-preference checks pass. Two browser cases cover filter examples and
Markdown help; syntax and discovery pass, with runtime execution pending.
All 38,430 existing Chinese values are preserved. The remaining semantic review
and all-language translation work continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/126aaebb91">Translate stale Southern Sotho import instructions</a>. Thanks to xet7.</summary>

Reviewed source keys 814–929 and corrected six values. Todoist and Planner help
contained older English instructions, which differ from current English and
therefore escaped the exact-match placeholder inventory. Both now use Southern
Sotho with the source menu names preserved. Jira help includes fields,
pagination
and page-combination options; Excel help includes column mapping and one board
per sheet with a header. Taskwarrior and Focalboard labels no longer say
letters.

Southern Sotho and repair-ledger suites pass with 26,901 guarded corrections;
all 21 human-preference checks pass. Six import-help browser cases pass syntax
and discovery checks; runtime execution remains pending. All 38,430 existing
Chinese values are preserved. Zero exact-match English placeholders is not proof
of a fully translated catalog; semantic review and all-language work continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b7942b661">Correct Southern Sotho labels and visibility controls</a>. Thanks to xet7.</summary>

Reviewed source keys 930–1129 and corrected nine values. Labels no longer say
letters. Card linking no longer specifies the current board, and creating a
board identifies the source card. Public visibility is a state rather than
an instruction to publish. Custom public/private descriptions and their
empty-value fallback guidance are clarified, along with the message shown
when no items have been starred.

Southern Sotho and repair-ledger suites pass with 26,910 guarded corrections;
all 21 human-preference checks pass. Card-link browser coverage passes syntax
and discovery checks; runtime execution remains pending. All 38,430 existing
Chinese values are preserved. Semantic review and all-language work continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8cb58645cb">Clarify Southern Sotho link and email settings</a>. Thanks to xet7.</summary>

Reviewed source keys 1130–1279 and corrected ten values. URL schemes are made
clickable, not clicked automatically. External tracker guidance now describes
automatic links and disabling them by leaving either field empty; its URL is
a template rather than a picture. The transfer limit explicitly exceeds zero.
Email template labels distinguish invitation and activity-notification
subjects and bodies.

Southern Sotho and repair-ledger suites pass with 26,920 guarded corrections;
all 21 human-preference checks pass. Email-settings browser coverage passes
syntax and discovery checks; runtime execution remains pending. All 38,430
existing Chinese values are preserved. All-language translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/12b380b74d">Translate Southern Sotho database status and field ordering</a>. Thanks to xet7.</summary>

Reviewed source keys 1280–1416 and corrected six values. MongoDB status
labels now translate compatible version, storage engine and enabled Oplog.
Card-field ordering no longer refers to agricultural fields; movement labels
identify up and down.

Southern Sotho and repair-ledger suites pass with 26,926 guarded corrections;
all 21 human-preference checks pass. Card-settings browser coverage passes
syntax and discovery; runtime execution remains pending. All 38,430 existing
Chinese values are preserved. Broad MongoDB/S3/Azure prefix exemptions in the
placeholder inventory still hide untranslated prose; all-language work and
repairing that inventory gap remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d223f4fd53">Expose untranslated storage prose and fill Southern Sotho labels</a>. Thanks to xet7.</summary>

The translation inventory now exempts exact MongoDB, S3 and Azure Blob product
names instead of every string beginning with those names. Descriptive status,
credential and storage messages left in English are now reported. Filled 22
Southern Sotho storage strings, preserving provider names and example hosts.
The corrected filtered backlog is 29,110 strings across 77 languages, with
379 pending-Transifex source keys reported separately.

Southern Sotho, technical-name exemption and five Corsican/Maltese suites pass;
all 21 human-preference checks pass. S3 settings browser coverage passes syntax
and discovery; runtime execution remains pending. All 38,430 existing Chinese
values are preserved. Translation and semantic-review work remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9dc53b66f9">Correct Southern Sotho automation conditions and labels</a>. Thanks to xet7.</summary>

Reviewed source keys 1417–1589 and corrected 13 values. Date triggers include
both setting and changing a date. Auto-detect no longer says learn, and the
remove-labels action no longer refers to goals. Rule states, toggle controls
and assignee conditions are clarified; short English fragments are translated.

Southern Sotho and repair-ledger suites pass with 26,939 guarded corrections;
all 21 human-preference checks pass. Workflow-import browser coverage passes
syntax and discovery; runtime execution remains pending. All 38,430 existing
Chinese values are preserved. The short-string inventory exemption still
needs review; all-language translation work remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/15643364b0">Count short translation phrases and fill Southern Sotho words</a>. Thanks to xet7.</summary>

The translation inventory no longer exempts every string with fewer than
three letters. Exact key/value exemptions preserve reviewed symbols, units
and abbreviations while exposing short words and Blockly phrases. Filled 20
Southern Sotho strings, including control words, counting phrases and the
personal due-card filter. The inventory now reports 30,557 candidate strings
across 135 languages; valid shared words still require locale-specific review.

Seven translation and inventory suites pass, with all 21 human-preference
checks. Personal-filter browser coverage passes syntax and discovery;
runtime execution remains pending. All 38,430 existing Chinese values are
preserved. All-language translation and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/08871f2aa6">Clarify Southern Sotho configuration and visibility guidance</a>. Thanks to xet7.</summary>

Reviewed source keys 1590–1844 and corrected seven values. Rule variables refer
to data fields, and OAuth help clarifies local-setting precedence, server
storage and never displaying the secret. Public/private controls refer to
boards and distinguish defaults from showing fields. The header-toggle hint
includes its mobile/desktop notification behavior.

Southern Sotho and repair-ledger suites pass with 26,946 guarded corrections;
all 21 human-preference checks pass. OAuth browser coverage passes syntax and
discovery; runtime execution remains pending. All 38,430 existing Chinese
values are preserved. All-language translation work remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19cc07f1ed">Correct Southern Sotho template and table guidance</a>. Thanks to xet7.</summary>

Reviewed source keys 1845–1989 and corrected five values. Shared-template
help specifies users with nonempty template boards. My Attachments uses
clear word order; table grouping identifies swimlanes rather than rows.
Search-limit validation requires an integer greater than zero rather than
a good integer.

Southern Sotho and repair-ledger suites pass with 26,951 guarded corrections;
all 21 human-preference checks pass. Shared-template browser coverage passes
syntax and discovery; runtime execution remains pending. All 38,430 existing
Chinese values are preserved. All-language work remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d50db7b0bc">Clarify Southern Sotho numeric search constraints</a>. Thanks to xet7.</summary>

Reviewed source keys 1990–2134 and corrected three values. Search help now
expresses positive and negative integers as greater than or less than zero,
rather than good or bad numbers. The background-image warning identifies
the maximum allowed size. Search operators, examples and tokens are preserved.

Southern Sotho and repair-ledger suites pass with 26,954 guarded corrections;
all 21 human-preference checks pass. Search-help browser coverage passes
syntax and discovery; runtime execution remains pending. All 38,430 existing
Chinese values are preserved. All-language translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/26090b467a">Clarify Southern Sotho report metrics and checklist templates</a>. Thanks to xet7.</summary>

Reviewed source keys 2135–2349 and corrected five values. Recovery severity
identifies seriousness rather than pain. Checklist copying specifies a template
as its source. The custom-translation count identifies strings, and remaining
time refers to the due date rather than an end date.

Southern Sotho and repair-ledger suites pass with 26,959 guarded corrections;
all 21 human-preference checks pass. Checklist-copy browser coverage passes
syntax and discovery; runtime execution remains pending. All 38,430 existing
Chinese values are preserved. All-language translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9479f0b07">Distinguish Southern Sotho reset and recurrence controls</a>. Thanks to xet7.</summary>

Reviewed source keys 2350–2479 and corrected eight values. Automatic checklist
reset and card recurrence use distinct labels and off options. Last activity
identifies when the user was active, and migration severity describes
seriousness rather than pain.

Southern Sotho and repair-ledger suites pass with 26,967 guarded corrections;
all 21 human-preference checks pass. Card-recurrence browser coverage passes
syntax and discovery; runtime execution remains pending. All 38,430 existing
Chinese values are preserved. All-language translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/77c1437808">Restore Southern Sotho account anonymization warning</a>. Thanks to xet7.</summary>

Reviewed source keys 2480–2599 and corrected four values. Account anonymization
no longer displays the unrelated export-anonymization description. Its warning
explains permanent identity replacement, avatar removal, disabled login,
retained history and no undo. Backup scope identifies the whole WeKan
installation rather than an example, preserving organization boundaries.

Southern Sotho and repair-ledger suites pass with 26,971 guarded corrections;
all 21 human-preference checks pass. Confirmation-dialog browser coverage
passes syntax and discovery; runtime execution remains pending. All 38,430
existing Chinese values are preserved. All-language work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a14536c444">Clarify Southern Sotho storage and migration translations</a>. Thanks to xet7.</summary>

Translate S3 endpoint and region prose, distinguish archived records from saved
records, and describe orphaned cards by missing list or swimlane links rather
than ownership. Seven guarded repairs extend the historical review through
source key 2839. Other valid wording and existing Chinese values are preserved.

The Southern Sotho and repair-ledger suites pass, as do all 21 human-preference
checks. The S3 settings browser case checks the translated hints; syntax and
discovery pass, while browser runtime execution remains pending. All-language
translation and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/77f401cdee">Correct Southern Sotho WIP group and field-summary labels</a>. Thanks to xet7.</summary>

Nine guarded repairs distinguish WIP groups from enabling a limit, preserve the
swimlane target, and identify API connection points, problem severity and
custom-field sums and date ranges. Historical review reaches source key 2999;
all-language translation and semantic review remain unfinished.

Both translation suites and all 21 preservation checks pass. Existing Chinese
values remain unchanged. The WIP dialog browser case passes syntax and discovery
checks; browser runtime execution remains pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2bc93bdfde">Restore Southern Sotho analytics explanations and sync labels</a>. Thanks to xet7.</summary>

Replace abbreviated chart notes with full explanations of missing history,
forecast uncertainty, simulation limits and cycle-time fallbacks. Time
adjustment
help distinguishes corrections from work sessions. Sync and credential labels
identify synchronization and login credentials. This adds 54 guarded repairs;
statistical terminology still benefits from native-speaker review.

Both translation suites and all 21 preservation checks pass. Seven browser cases
pass syntax and discovery checks; runtime execution remains pending. Existing
Chinese values remain unchanged. Historical review reaches source key 3169;
all-language translation and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0056f57d79">Clarify Southern Sotho Blockly angles and movement</a>. Thanks to xet7.</summary>

Six guarded repairs translate inverse tangent, clarify angular degrees and
correct the up/down movement instructions. Historical review through source
key 3729 preserves valid loop, list, logic and text operations and placeholders.

The repair-ledger and Southern Sotho suites pass, with old angle-wording
assertions updated. All 21 preservation checks pass and existing Chinese values
remain unchanged. The existing Southern Sotho Blockly browser case passes syntax
and discovery; runtime execution remains pending. All-language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d74dfa66f">Correct Southern Sotho Scrum estimate and progress labels</a>. Thanks to xet7.</summary>

Distinguish an estimate from size and translate the remaining English sprint
term in rollover progress. Historical review reaches source key 4069, preserving
sync conflict rules and email/recovery warnings. All-language work continues.

Both translation suites and all 21 preservation checks pass. Existing Chinese
values remain unchanged. The extended backlog browser case checks the estimate
heading; syntax and discovery pass, while runtime execution remains pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94f4cf2409">Correct Southern Sotho email instructions and limits</a>. Thanks to xet7.</summary>

Eight guarded repairs clarify message content, labels, disabled addresses,
recipient limits and the SES sending address. Mixed English in email help is
translated. The historical review reaches the end of the current 4,270-key
catalog; native-speaker verification and all-language work remain unfinished.

Both translation suites and all 21 preservation checks pass. Existing Chinese
values remain unchanged. The new email-settings browser case passes syntax and
discovery; runtime remains pending. The refreshed inventory contains 30,557
English-equal candidates across 135 languages, requiring contextual review;
379 source keys pending Transifex are tracked separately.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6b97949c4a">Translate short labels and S3 fields in 22 locales</a>. Thanks to xet7.</summary>

Fill 52 English placeholders in S3 labels, Blockly announcements and controls,
Japanese alternatives and Belarusian negation. Valid shared words such as
Spanish No and Dutch is remain intact. Existing Chinese values are unchanged.

The two focused suites and all 21 preservation checks pass. Nineteen S3/Blockly
browser cases pass syntax and discovery; runtime execution remains pending.
The filtered queue is now 30,505 candidates across 122 languages, with 379
pending Transifex source keys tracked separately. All-language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8685cab6a7">Translate short rule labels in six languages</a>. Thanks to xet7.</summary>

Fill 40 English placeholders in Bengali, Nepali, Hungarian, Icelandic, Albanian
and Tagalog. Numeric counts use a slash where the template cannot accommodate
inflected word order. Correct a Tagalog Blockly range endpoint from from to to.
Existing Chinese values and valid shared words remain unchanged.

Three focused suites and all 21 preservation checks pass. Six added Blockly
browser cases pass syntax and discovery; runtime remains pending. The filtered
queue is 30,465 candidates across 116 languages, with 379 pending Transifex
source keys tracked separately. All-language semantic review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e554efcaf">Translate short Blockly controls in ten locales</a>. Thanks to xet7.</summary>

Fill 126 English file values for Georgian, Khmer, Latin, Tatar, Javanese,
Kazakh, Tajik and Shona. The Khmer locale alias makes these 140 locale entries.
Conditions, actions, pixel states, range endpoints and procedure labels retain
their placeholders and consistent aliases. Existing Chinese values are
unchanged.

Both focused suites and all 21 preservation checks pass. Ten Blockly browser
cases pass syntax and discovery; runtime remains pending. The filtered queue is
30,325 candidates across 109 locales, plus 379 pending Transifex source keys.
All-language semantic review and native-speaker refinement remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/abf6ab4137">Translate short rules in Javanese, Kazakh, Tajik and Somali</a>. Thanks to xet7.</summary>

Fill 40 English placeholders for sorting, actors, recipients, self-selection,
counts and Somali Blockly conditions/actions. Existing translations, including
Chinese values, remain unchanged. Full rule-sentence grammar still needs review.

Both focused suites and all 21 preservation checks pass. The four existing
Blockly browser cases pass syntax and discovery; runtime remains pending. The
filtered queue is 30,285 candidates across 105 locales, with 379 pending
Transifex source keys tracked separately. All-language verification continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/90ed19f207">Translate Latin card attachments and field links</a>. Thanks to xet7.</summary>

Fill 34 pending English strings for card attachments, field links, announcements
and colour inheritance. Repair two older card-link labels with language-name
prefixes and incorrect inflection. Existing Chinese values remain unchanged.

Both translation suites and all 21 preservation checks pass. The added
attachment
and field-link browser cases pass syntax and discovery; runtime remains pending.
Latin still has 189 English placeholders among keys marked pending Transifex,
which are excluded from the filtered inventory. All-language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec0e77480e">Translate Latin import guides and repair Trello instructions</a>. Thanks to xet7.</summary>

Translate twelve pending guides from OPML through monday.com and repair mixed
English in the Trello guide. Preserve literal source menus, file extensions,
hierarchy mappings, completion dates and first-board limits.

Both translation suites and all 21 preservation checks pass. Thirteen browser
cases pass syntax and discovery; runtime remains pending. Existing Chinese
values are unchanged. Latin has 177 English placeholders left; all-language
translation and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d76a58ff8">Translate ten more Latin import guides</a>. Thanks to xet7.</summary>

Translate guides for Super Productivity, Taiga, Vikunja, Quire, Wrike, Teamwork,
Businessmap, Redmine, Notion and Plane. Preserve omitted-data warnings, required
English columns, nested-task markers, archive state and file choices.

The Latin suite and all 21 preservation checks pass. All 23 Latin import browser
cases pass syntax and discovery; runtime remains pending. Existing Chinese
values are unchanged. Latin has 167 English placeholders left; all-language
translation and semantic verification remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f71d68317">Translate Latin import mapping and export controls</a>. Thanks to xet7.</summary>

Fill 35 pending strings for member mapping, CSV columns, multiple-board imports,
board exports and Trello access. Preserve ZIP boundaries, field placeholders,
export permissions and the literal Swimlane label used for round trips.

The Latin suite and all 21 preservation checks pass. The added Trello dialog
case passes syntax and discovery; runtime remains pending. Existing Chinese
values are unchanged. Latin has 132 English placeholders left; all-language
translation and semantic verification remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/08eb3aabba">Translate Latin notification, webhook and link settings</a>. Thanks to xet7.</summary>

Fill 46 pending strings for webhook contents and identity, notification layout,
grouping, scheduling and quiet hours, external-link rules, Sandstorm access and
read-only fields. Preserve configuration names, variables and literal examples.

The Latin suite and all 21 preservation checks pass. The added notification
settings browser case passes syntax and discovery; runtime remains pending.
Existing Chinese values are unchanged. Latin has 86 English placeholders left;
all-language translation and semantic verification remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1212eb97c7">Translate Latin workflow and Scrum import messages</a>. Thanks to xet7.</summary>

Fill 35 pending strings for Wrike workflows, LDAP synchronization, OAuth
domains,
subtasks and Scrum imports. Repair the preview and history labels. Preserve
configuration names, import matching rules and restrictions on moving cards.

The Latin and repair-ledger suites and all 21 preservation checks pass. The
added Scrum browser case passes syntax and discovery; runtime remains pending.
Existing Chinese values are unchanged. Latin has 51 English placeholders left;
all-language translation and semantic verification remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc4ea4984b">Translate Latin synchronization and recovery messages</a>. Thanks to xet7.</summary>

Fill 51 pending strings for planning synchronization, stuck list operations,
interrupted imports, Scrum history recovery and environment-only settings.
Tests preserve matching precedence, retained changes, permanent deletion and
restrictions on recovery actions.

The Latin suite and all 21 preservation checks pass. Five added browser cases
pass syntax and discovery; runtime remains pending. Existing Chinese values
are unchanged. Latin has no English-equal placeholders left in the fill report,
but older mixed-language strings and all-language verification remain
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e254be892">Repair mixed-language Latin activity messages</a>. Thanks to xet7.</summary>

Repair 65 prefixed messages for activity history, card moves, comments,
checklist
completion and board membership restrictions. Preserve title argument order,
source and destination, opposite checklist states and comment permissions.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The Latin card-history browser case passes syntax and discovery; runtime remains
pending. Existing Chinese values are unchanged. Review found 2,321 prefixed
Latin strings before these repairs; 2,256 remain. All-language translation and
semantic verification remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/51421f5384">Repair Latin checklist and workspace translations</a>. Thanks to xet7.</summary>

Repair 60 mixed-language strings for checklist activity, dates, workspaces,
board selection and Home controls. Keep the valid Latin word Color through an
exact-source exception that does not hide changed English prose.

The Latin, correction-ledger and technical-exception suites pass, as do all 21
preservation checks. The workspace browser case passes syntax and discovery;
runtime remains pending. Existing Chinese values are unchanged. There remain
2,196 Latin values containing the old language prefix; all-language translation
and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f6f05040ae">Repair Latin sizing and archive controls</a>. Thanks to xet7.</summary>

Repair 55 mixed-language strings for list widths, swimlane height, keyboard
shortcuts, administrator controls, archiving and attachment deletion. Tests
preserve personal/shared scope, toggle direction and data-loss warnings.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The keyboard toggle browser case passes syntax and discovery; runtime remains
pending. Existing Chinese values are unchanged. There remain 2,141 Latin values
containing the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57534c06e9">Repair Latin board appearance and view labels</a>. Thanks to xet7.</summary>

Repair 44 mixed-language strings for board backgrounds, visibility, members,
assignees, zoom and view controls. Preserve private/public markup, current-card
versus board-wide scope, placeholders and the zoom range.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The calendar-menu browser case passes syntax and discovery; runtime remains
pending. Existing Chinese values are unchanged. There remain 2,097 Latin values
containing the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3ea074216">Repair Latin card archive and voting messages</a>. Thanks to xet7.</summary>

Repair 40 mixed-language strings for card archives, deletion, editing and
voting.
Preserve reversible archiving versus permanent deletion, activity retention,
member scope and voting roles. Retain Gantt as a technical name.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The archive-confirmation browser case passes syntax and discovery; runtime
remains pending. Existing Chinese values are unchanged. There remain 2,057 Latin
values containing the old language prefix; all-language review is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c55d0f589">Repair Latin voting and Planning Poker labels</a>. Thanks to xet7.</summary>

Repair 45 prefixed strings for voting, Planning Poker and popup actions. Restore
numeric poker choices and correct the account-anonymization label, which wrongly
referred to importing users. Preserve permanent-deletion warnings and vote
roles.

The Latin and guarded-correction suites and all 21 preservation checks pass.
Two voting browser cases pass syntax and discovery; runtime remains pending.
Existing Chinese values are unchanged. There remain 2,012 Latin values
containing
the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e336c5a13">Repair Latin member mapping and appearance labels</a>. Thanks to xet7.</summary>

Repair 40 mixed-language strings for imports, member mapping, themes and fonts.
Preserve imported-role permission limits, transferred content and all-user
search
scope. Correct the Clear theme category, previously translated as a command.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The font-popup browser case passes syntax and discovery; runtime remains
pending.
Existing Chinese values are unchanged. There remain 1,972 Latin values
containing
the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/35d2caec77">Repair Latin font and card aging controls</a>. Thanks to xet7.</summary>

Repair 35 mixed-language strings for font previews and sizes, avatars, stars,
automatic widths, card fading and movement. Preserve size distinctions, idle-day
thresholds, fading intensity, toggle actions and movement directions.

The Latin and guarded-correction suites and all 21 preservation checks pass.
Extended font-popup browser coverage passes syntax and discovery; runtime
remains
pending. Existing Chinese values are unchanged. There remain 1,937 Latin values
containing the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30024f1e66">Repair Latin colors and navigation labels</a>. Thanks to xet7.</summary>

Repair 32 prefixed strings, including all 25 color labels, close/back controls
and the skip link. Update the stale restoration message to point to Archive
on All Boards. Less common shade descriptions still need linguistic review.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The skip-link browser case passes syntax and discovery; runtime remains pending.
Existing Chinese values are unchanged. There remain 1,905 Latin values
containing
the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b890bbe16">Repair Latin role and comment controls</a>. Thanks to xet7.</summary>

Repair 30 prefixed strings for roles, comment visibility, deletion and copying.
Preserve assigned-card limits, read-only restrictions, worker actions and moving
all cards with a list. Restore the intentionally empty comment placeholder.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The comment-editor browser case passes syntax and discovery; runtime remains
pending. Existing Chinese values are unchanged. There remain 1,875 Latin values
containing the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c5f1c6ad4">Repair Latin custom fields and account email messages</a>. Thanks to xet7.</summary>

Repair 50 prefixed strings for custom fields, deletion settings, editing and
account emails. Restore date-format tokens and email paragraphs. Preserve field
history deletion and the warning that enabling permanent deletion deletes
nothing.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The custom-field browser case passes syntax and discovery; runtime remains
pending. Existing Chinese values are unchanged. There remain 1,825 Latin values
containing the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/737e8cd4d0">Repair Latin account emails and import errors</a>. Thanks to xet7.</summary>

Repair 25 mixed-language strings for invitations, password reset, email
verification, permissions and imports. Preserve email variables and paragraphs,
linked-card restrictions and instructions to re-export an empty board export.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The malformed-JSON browser case passes syntax and discovery; runtime remains
pending. Existing Chinese values are unchanged. There remain 1,800 Latin values
containing the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/855b54d55a">Repair Latin export labels and name collision errors</a>. Thanks to xet7.</summary>

Repair 30 prefixed strings for export options, duplicate-name errors and
sorting.
Preserve denied export actions, date fields, uploader/time distinctions and
available versus required disk space.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The export-popup browser case passes syntax and discovery; runtime remains
pending. Existing Chinese values are unchanged. There remain 1,770 Latin values
containing the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9860c8a248">Repair Latin sorting and filter controls</a>. Thanks to xet7.</summary>

Repair 30 prefixed strings for sorting, date periods, missing-value filters and
member/assignee/creator filters. Preserve archive visibility and hiding empty
lists, and remove a duplicated language prefix from the creator filter.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The date-filter browser case passes syntax and discovery; runtime remains
pending. Existing Chinese values are unchanged. There remain 1,740 Latin values
containing the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f26a7e7a9">Repair Latin advanced filter and import instructions</a>. Thanks to xet7.</summary>

Repair 30 mixed-language strings, including advanced-filter examples and import
guides. Update stale Jira pagination and required-field guidance and Excel
column-mapping and per-sheet behavior. Preserve literal operators and examples.

The Latin and guarded-correction suites and all 21 preservation checks pass.
Nine added import browser cases pass syntax and discovery; runtime remains
pending. Existing Chinese values are unchanged. There remain 1,710 Latin values
containing the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2e641f3fb7">Repair Latin Trello import messages</a>. Thanks to xet7.</summary>

Repair 40 prefixed strings for Trello JSON/ZIP imports, workspaces, credentials
and progress controls. Preserve archive limits, optional settings and the scope
of cancelling and deleting boards already imported by a job.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The Trello input-label browser case passes syntax and discovery; runtime remains
pending. Existing Chinese values are unchanged. There remain 1,670 Latin values
containing the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0225b90529">Repair Latin member mapping and validation messages</a>. Thanks to xet7.</summary>

Repair 25 prefixed strings for member mapping, statuses, validation and labels.
Preserve assignment to the current user for unmapped members, four-digit years,
irreversible label deletion and the last-administrator restriction.

The Latin and guarded-correction suites and all 21 preservation checks pass.
Extended shortcut browser coverage passes syntax and discovery; runtime remains
pending. Existing Chinese values are unchanged. There remain 1,645 Latin values
containing the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5cb027f4c4">Repair Latin list actions and board departure messages</a>. Thanks to xet7.</summary>

Repair 30 prefixed strings for leaving boards, list actions, settings and
navigation. Preserve removal from all board cards, permanent list deletion,
activity retention through archiving and move/copy distinctions.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The list-warning browser case passes syntax and discovery; runtime remains
pending. Existing Chinese values are unchanged. There remain 1,615 Latin values
containing the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48a62a615e">Repair Latin visibility and notification descriptions</a>. Thanks to xet7.</summary>

Repair 30 prefixed strings for selection, archives, roles, notifications and
board visibility. Preserve public viewing versus member editing, assigned-card
limits and notification scope, including muting all board changes.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The Latin archive-tab browser case passes syntax and discovery; runtime remains
pending. Existing Chinese values are unchanged. There remain 1,585 Latin values
containing the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f256bce30">Repair Latin member removal and shortcut messages</a>. Thanks to xet7.</summary>

Repair 30 prefixed strings for member removal, descriptions, search, WIP limits
and shortcuts. Preserve removal notifications and the warning that hiding a
member in WeKan does not revoke Sandstorm access. Distinguish joining from
assignment.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The shortcut-page browser case passes syntax and discovery; runtime remains
pending. Existing Chinese values are unchanged. There remain 1,555 Latin values
containing the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/42ab802edd">Repair Latin sidebar and tracking controls</a>. Thanks to xet7.</summary>

Repair 30 prefixed strings for sidebar controls, starred/default boards, time
labels, tracking and shortcuts. Preserve stopping automatic board opening,
shortcut ranges and the difference between adding labels and removing them.

The Latin and guarded-correction suites and all 21 preservation checks pass.
Extended shortcut-page coverage passes syntax and discovery; runtime remains
pending. Existing Chinese values are unchanged. There remain 1,525 Latin values
containing the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7842c44d16">Repair Latin upload and WIP messages</a>. Thanks to xet7.</summary>

Repair 30 prefixed strings for uploads, logo settings, welcome content,
templates
and limits. Distinguish upload failure from completion, image URLs from link
URLs,
and both recovery choices when a list exceeds its WIP limit.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The WIP-warning browser case passes syntax and discovery; runtime remains
pending.
Existing Chinese values are unchanged. There remain 1,495 Latin values
containing
the old language prefix; all-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49dc81ea2b">Repair Latin transfer limits and SMTP messages</a>. Thanks to xet7.</summary>

Repair 40 prefixed strings for transfer limits, avatars, registration, SMTP and
invitations. Preserve upload/download directions, separate server safety caps,
literal units, invitation variables and email paragraphs.

The Latin and guarded-correction suites and all 21 preservation checks pass.
The Latin attachment-limit browser case passes syntax and discovery; runtime
remains pending. Existing Chinese values are unchanged. There remain 1,455 Latin
values containing the old language prefix; all-language review remains
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0dda250d79">Repair Latin webhook and system information labels</a>. Thanks to xet7.</summary>

Repair 30 prefixed labels for webhooks, notification layout and system
information.
Preserve product names, runtime modes and environment-variable identifiers,
while
translating surrounding labels and distinguishing webhook directions.

The Latin and guarded-correction suites and all 21 preservation checks pass.
Existing Latin notification-layout browser coverage passes syntax and discovery;
runtime remains pending. Existing Chinese values are unchanged. There remain
1,425 Latin values containing the old language prefix; all-language review is
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8a09add9c">Repair Latin field policies and system metrics</a>. Thanks to xet7.</summary>

Repair 30 prefixed labels for system metrics, custom fields, account settings
and
organizations. Preserve free/total memory, new/all-card scope, private-only
visibility and membership synchronization direction.

The Latin and guarded-correction suites and all 21 preservation checks pass.
Extended custom-field browser coverage passes syntax and discovery; runtime
remains pending. Existing Chinese values are unchanged. There remain 1,395 Latin
values containing the old language prefix; all-language review remains
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7729efb8e0">Repair Latin organization permissions and tenant labels</a>. Thanks to xet7.</summary>

- Replace 25 mixed-language organization, membership, date and color entries
  with
  Latin. Keep the tenant configuration requirement and organization-admin limits
  explicit, and distinguish received/end dates and selection colors.
- Latin and guarded-correction suites pass with 28,014 corrections; all 21
  human-preference checks pass and 38,430 existing Chinese values are preserved.
  Added organization-admin browser coverage passes syntax and discovery;
  browser execution remains pending.
- Translation review continues: 1,370 Latin values still contain the legacy
  “Latine:” prefix. Unprefixed values and other languages still need review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0da6274347">Repair Latin deletion warnings and subtask settings</a>. Thanks to xet7.</summary>

- Translate 40 mixed-language deletion warnings, subtask settings, minicard
  labels
  and activity messages. Preserve permanent deletion, empty duplicate-list
  scope,
  full ancestry versus immediate parent, and message placeholders.
- Latin and guarded-correction suites pass with 28,054 corrections; all 21
  human-preference checks pass and 38,430 existing Chinese values are preserved.
  The added duplicate-list warning browser check passes syntax and discovery;
  browser execution remains pending.
- Translation review remains unfinished: 1,330 Latin values contain the legacy
  “Latine:” prefix, and unprefixed values and other languages still need review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6150377ef5">Repair Latin rule builder and activity translations</a>. Thanks to xet7.</summary>

- Translate 40 mixed-language rule controls and activity messages. Preserve
  trigger/action distinctions, archive restoration, import/export direction,
  selected-rule scope and placeholders.
- Latin and guarded-correction suites pass with 28,094 corrections; all 21
  human-preference checks pass and 38,430 existing Chinese values are preserved.
  Workflow-builder browser coverage now includes Latin; syntax and discovery
  pass, but browser execution remains pending.
- Review remains unfinished: 1,290 Latin values contain the legacy “Latine:”
  prefix. Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1f11631552">Repair Latin rule import and scheduling translations</a>. Thanks to xet7.</summary>

- Translate 30 mixed-language import and scheduling entries, retaining partial
  conversion limits, unmapped-item reports, weekday boundaries and due-date
  states.
- Latin and guarded-correction suites pass with 28,124 corrections; all 21
  human-preference checks pass and 38,430 existing Chinese values are preserved.
  Added import-dialog browser coverage passes syntax and discovery; browser
  execution remains pending.
- Review remains unfinished: 1,260 Latin values contain the legacy “Latine:”
  prefix. Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e94c5e2a0">Repair Latin rule action and duration labels</a>. Thanks to xet7.</summary>

- Translate 24 mixed-language rule controls, preserving complete/incomplete
  actions, before/after offsets, relative dates, duration units and all-card
  scope.
- Latin and guarded-correction suites pass with 28,148 corrections; all 21
  human-preference checks pass and 38,430 existing Chinese values are preserved.
  Added workflow-toolbox browser coverage passes syntax and discovery; runtime
  execution remains pending.
- Review remains unfinished: 1,236 Latin values contain the legacy “Latine:”
  prefix. Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/61a2f68df0">Repair Latin rule trigger sentences and linking verbs</a>. Thanks to xet7.</summary>

- Repair 36 Latin trigger entries, including three unprefixed assignee/date
  translations. Use finite predicates and omit the extra linking verb in Latin
  rule rows; retain initial date setting as well as later changes.
- Translation, guarded-correction and shared grammar suites pass with 28,184
  corrections. All 21 human-preference checks pass; 38,430 existing Chinese
  values
  are preserved. Browser coverage for rule rows and saved descriptions includes
  Latin; syntax and discovery pass, runtime remains pending.
- Review remains unfinished: 1,203 Latin values contain the legacy “Latine:”
  prefix. Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd921c8fef">Repair Latin rule actions and saved descriptions</a>. Thanks to xet7.</summary>

- Translate 50 action fragments and descriptions, preserving movement direction,
  checklist polarity, membership scope and archive restoration. Recognize the
  exact shared Latin imperative “Remove” without exempting longer English prose.
- Latin, guarded-correction and shared-word tests pass with 28,234 corrections.
  All 21 human-preference checks pass; 38,430 existing Chinese values are
  preserved.
  Added movement-control browser coverage passes syntax and discovery; browser
  execution remains pending.
- Review remains unfinished: 1,153 Latin values contain the legacy “Latine:”
  prefix. Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c59113bebf">Repair Latin rule hints and branding settings</a>. Thanks to xet7.</summary>

- Translate 40 mixed-language rule hints, date controls and branding settings.
  Preserve wildcard matching, comma-separated checklist input, date
  distinctions,
  authentication names, JSON filenames and HTML tags.
- Latin and guarded-correction suites pass with 28,274 corrections. All 21
  human-preference checks pass; 38,430 existing Chinese values are preserved.
  Added checklist-instructions browser coverage passes syntax and discovery;
  browser execution remains pending.
- Review remains unfinished: 1,113 Latin values contain the legacy “Latine:”
  prefix. Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d0676f4a76">Repair Latin authentication and date activity labels</a>. Thanks to xet7.</summary>

- Translate 30 mixed-language authentication, deletion and date activity
  entries.
  Preserve irreversible swimlane deletion, old/new date placeholders and
  distinct
  above/below/left/right placement labels.
- Latin and guarded-correction suites pass with 28,304 corrections. All 21
  human-preference checks pass; 38,430 existing Chinese values are preserved.
  Added swimlane-warning browser coverage passes syntax and discovery; browser
  execution remains pending.
- Review remains unfinished: 1,083 Latin values contain the legacy “Latine:”
  prefix. Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee4ce8a1eb">Repair Latin reminders and preference descriptions</a>. Thanks to xet7.</summary>

- Translate 35 mixed-language reminders, deletion confirmations and preferences.
  Preserve due-state distinctions, self-account scope, keyboard combinations,
  enabled/disabled behavior and read/unread actions.
- Latin and guarded-correction suites pass with 28,339 corrections. All 21
  human-preference checks pass; 38,430 existing Chinese values are preserved.
  Added preferences browser coverage passes syntax and discovery; browser
  execution remains pending.
- Review remains unfinished: 1,048 Latin values contain the legacy “Latine:”
  prefix. Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/61480096ba">Repair Latin role explanations and weekday labels</a>. Thanks to xet7.</summary>

- Translate 35 mixed-language role, weekday and deletion entries. Preserve
  global-admin rights, unsaved role previews, assigned-only visibility and
  linked-card deletion prerequisites.
- Latin and guarded-correction suites pass with 28,374 corrections. All 21
  human-preference checks pass; 38,430 existing Chinese values are preserved.
  Added role-settings browser coverage passes syntax and discovery; browser
  execution remains pending.
- Review remains unfinished: 1,013 Latin values contain the legacy “Latine:”
  prefix. Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/13f06820f7">Repair Latin template sharing and card view translations</a>. Thanks to xet7.</summary>

- Translate 40 mixed-language shared-template, domain and card-view entries.
  Preserve nonempty-template filtering, sharing scopes, domain examples and
  access-controlled incomplete due-card views.
- Latin and guarded-correction suites pass with 28,414 corrections. All 21
  human-preference checks pass; 38,430 existing Chinese values are preserved.
  Added template-settings browser coverage passes syntax and discovery; browser
  execution remains pending.
- Review remains unfinished: 973 Latin values contain the legacy “Latine:”
  prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb3da6ac52">Repair Latin search messages and operator names</a>. Thanks to xet7.</summary>

- Translate 48 mixed-language search entries, preserving access boundaries,
  member/assignee scope and placeholders. Use distinct Latin operator names
  while
  retaining shorthand aliases and checking parser registration.
- Latin and guarded-correction suites pass with 28,462 corrections. All 21
  human-preference checks pass; 38,430 existing Chinese values are preserved.
  Added title-search browser coverage passes syntax and discovery; browser
  execution remains pending.
- Review remains unfinished: 925 Latin values contain the legacy “Latine:”
  prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3ea440a31">Repair Latin search predicates and introductory help</a>. Thanks to xet7.</summary>

- Translate 40 mixed-language predicates, validation messages and help entries.
  Preserve positive-integer constraints and placeholders, localize the list
  example, and retain the exact shared word “selector”.
- Latin, guarded-correction and shared-word suites pass with 28,502 corrections.
  All 21 human-preference checks pass; 38,430 existing Chinese values are
  preserved.
  Added overdue-search browser coverage passes syntax and discovery; browser
  execution remains pending.
- Review remains unfinished: 885 Latin values contain the legacy “Latine:”
  prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30c12e510c">Repair Latin search instructions and examples</a>. Thanks to xet7.</summary>

- Translate 32 mixed-language entries, explaining OR/AND, absent-field searches,
  descending order, date ranges and archive defaults. Preserve query
  placeholders
  and localize user, absence and card-number examples.
- Latin and guarded-correction suites pass with 28,534 corrections. All 21
  human-preference checks pass; 38,430 existing Chinese values are preserved.
  Added search-help browser coverage passes syntax and discovery; browser
  execution remains pending.
- Review remains unfinished: 853 Latin values contain the legacy “Latine:”
  prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/959bfbcedc">Repair Latin sorting and dependency translations</a>. Thanks to xet7.</summary>

- Translate 37 mixed-language sorting, completion and dependency entries.
  Preserve relationship direction, import formats and unmatched counts, and
  retain
  the exact shared Latin word “Color”.
- Latin, guarded-correction and shared-word suites pass with 28,571 corrections.
  All 21 human-preference checks pass; 38,430 existing Chinese values are
  preserved.
  Added dependency-picker browser coverage passes syntax and discovery; browser
  execution remains pending.
- Review remains unfinished: 816 Latin values contain the legacy “Latine:”
  prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/08c7d5314b">Repair Latin location and background translations</a>. Thanks to xet7.</summary>

- Translate 30 mixed-language location, background and server-error entries.
  Preserve coordinate distinctions, size placeholders, literal troubleshooting
  commands and sorting direction; retain the shared place name “Asia”.
- Latin, guarded-correction and shared-word suites pass with 28,601 corrections.
  All 21 human-preference checks pass; 38,430 existing Chinese values are
  preserved.
  Added location-detection browser coverage passes syntax and discovery; browser
  execution remains pending.
- Review remains unfinished: 786 Latin values contain the legacy “Latine:”
  prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd9d654aae">Repair Latin string template and report translations</a>. Thanks to xet7.</summary>

- Translate 30 mixed-language field and report entries. Preserve substitution
  tokens, space entities, invisible-filename filtering, impersonation roles and
  successful-login reporting scope.
- Latin and guarded-correction suites pass with 28,631 corrections. All 21
  human-preference checks pass; 38,430 existing Chinese values are preserved.
  Extended custom-field browser coverage passes syntax and discovery; browser
  execution remains pending.
- Review remains unfinished: 756 Latin values contain the legacy “Latine:”
  prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c0204e23e">Repair Latin office API and recovery reports</a>. Thanks to xet7.</summary>

- Translate 25 mixed-language reporting entries. Preserve first/last
  observations,
  API aggregation and configuration, recovery actions and automatic
  continuation.
- Latin and guarded-correction suites pass with 28,656 corrections. All 21
  human-preference checks pass; 38,430 existing Chinese values are preserved.
  Added office-report browser coverage passes syntax and discovery; browser
  execution remains pending.
- Review remains unfinished: 731 Latin values contain the legacy “Latine:”
  prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5df2e188cc">Repair Latin waiting indicators and ticket labels</a>. Thanks to xet7.</summary>

- Translate 30 mixed-language controls and messages, preserving deletion
  prerequisites, Cc syntax, distinct window actions, ticket states and history
  actions.
- Latin and guarded-correction suites pass with 28,686 corrections. All 21
  human-preference checks pass; 38,430 existing Chinese values are preserved.
  Added card-window browser coverage passes syntax and discovery; browser
  execution remains pending.
- Review remains unfinished: 701 Latin values contain the legacy “Latine:”
  prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2dd8c45cab">Repair Latin invitation and Node memory translations</a>. Thanks to xet7.</summary>

- Translate 35 mixed-language invitation, organization and memory entries.
  Preserve registration conditions, allocated/used/peak memory distinctions and
  diagnostic overwrite semantics. Retain the shared Latin imperative “Remove”.
- Latin, guarded-correction and shared-word suites pass with 28,721 corrections.
  All 21 human-preference checks pass; 38,430 existing Chinese values are
  preserved.
  Added memory-label browser coverage passes syntax and discovery; browser
  execution remains pending.
- Review remains unfinished: 666 Latin values contain the legacy “Latine:”
  prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a83a794b12">Repair Latin checklist and attachment action translations</a>. Thanks to xet7.</summary>

- Translate 32 mixed-language checklist, attachment and notification entries.
  Preserve copying versus moving, board-wide scope, destination names and
  original item order. Correct the legal-notice link's case in its sentence.
- Three translation suites and all 21 human-preference checks pass; all 38,430
  existing Chinese values are preserved. Checklist browser coverage passes
  syntax and discovery; browser execution remains pending.
- Review remains unfinished: 634 Latin values contain the legacy prefix.
  Unprefixed values and other languages still need semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/104480b6cc">Repair Latin storage and attachment repair translations</a>. Thanks to xet7.</summary>

- Translate 44 storage, repair and progress entries. Preserve technical names,
  read-enabled storage scope, actual file location and distinct repair results.
  Retain “Resume” as a Latin imperative with an exact shared-word exception.
- Three translation suites and 21 human-preference checks pass; all 38,430
  existing Chinese values are preserved. Storage browser coverage passes syntax
  and discovery; execution remains pending.
- Translation review remains unfinished: 590 Latin values contain the legacy
  prefix. Unprefixed values and other languages still need semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5002df4c9d">Repair Latin maintenance and account translations</a>. Thanks to xet7.</summary>

- Translate 44 maintenance, account and custom-translation entries. Preserve
  operation ordering, upload units, irreversible deletion, checklist scopes
  and workspace placeholders.
- Three translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Maintenance browser coverage passes syntax and
  discovery; execution remains pending.
- Review remains unfinished: 546 Latin values contain the legacy prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/08137b1d4a">Repair Latin support and lockout translations</a>. Thanks to xet7.</summary>

- Translate 50 support, accessibility, lockout and scheduling entries. Preserve
  login restrictions, known/unknown user distinctions, timing units and the
  direction of activation controls. Retain the Latin word “Status”.
- Three translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Extended lockout browser coverage passes syntax and
  discovery; execution remains pending.
- Review remains unfinished: 496 Latin values contain the legacy prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8cf28c4464">Repair Latin scheduling and cloud storage translations</a>. Thanks to xet7.</summary>

- Translate 52 scheduling and cloud storage entries. Preserve scheduling versus
  completion, failed versus paused migrations, optional connection credentials
  and literal service names.
- Three translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Azure browser coverage passes syntax and discovery;
  execution remains pending.
- Review remains unfinished: 444 Latin values contain the legacy prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e949142731">Repair Latin migration and card loading translations</a>. Thanks to xet7.</summary>

- Translate 26 migration and loading entries. Preserve database prerequisites,
  commands, paths, environment variables, irreversible-deletion warnings and
  experimental lazy-loading limitations.
- Three translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Migration browser coverage passes syntax and
  discovery; execution remains pending.
- Review remains unfinished: 418 Latin values contain the legacy prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/386fbba5ec">Repair Latin security setting translations</a>. Thanks to xet7.</summary>

- Translate 26 security entries. Preserve disabled defaults, import/export
  enforcement, anonymization effects, activity/notification distinctions and
  literal code examples.
- Three translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Security browser coverage passes syntax and
  discovery;
  execution remains pending.
- Review remains unfinished: 392 Latin values contain the legacy prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6bfdbc9179">Repair Latin backup scope and credential translations</a>. Thanks to xet7.</summary>

- Translate 35 backup and credential entries. Preserve organization-only restore
  boundaries, missing-only versus replacement modes, schedule formats and
  credential fallback behavior.
- Three translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Backup browser coverage passes syntax and discovery;
  execution remains pending.
- Review remains unfinished: 357 Latin values contain the legacy prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efbff09543">Repair Latin cloud configuration guidance</a>. Thanks to xet7.</summary>

- Translate 29 cloud guidance entries. Preserve literal console labels,
  credential identifiers, one-time secret display and alternative setup paths.
- Three translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Extended Azure browser coverage passes syntax and
  discovery; execution remains pending.
- Review remains unfinished: 328 Latin values contain the legacy prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9f565bdb7">Repair Latin migration status and S3 translations</a>. Thanks to xet7.</summary>

- Translate 44 migration-state and S3 entries. Preserve pause/stop distinctions,
  progress and result states, access/secret keys, endpoint examples and SSL/TLS.
- Three translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. S3 browser coverage passes syntax and discovery;
  execution remains pending.
- Review remains unfinished: 284 Latin values contain the legacy prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c32f58834">Repair Latin board migration translations</a>. Thanks to xet7.</summary>

- Translate 44 board-migration and storage-action entries. Preserve
  duplicate-list
  conditions, restoration scope, field identifiers and administrator
  restrictions.
- Three translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Filesystem browser coverage passes syntax and
  discovery; execution remains pending.
- Review remains unfinished: 240 Latin values contain the legacy prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7991925d05">Repair Latin migration confirmations and progress labels</a>. Thanks to xet7.</summary>

- Translate 40 migration entries. Preserve action ordering, archived-item
  exclusions, restoration warnings and distinct progress stages.
- Three translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Migration-template browser coverage passes syntax
  and discovery; execution remains pending.
- Review remains unfinished: 200 Latin values contain the legacy prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2e4f49297e">Repair Latin monitoring and conversion progress translations</a>. Thanks to xet7.</summary>

- Translate 65 monitoring and progress entries. Preserve numeric bounds, units,
  interval values, background continuation and continued board use.
- Three translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Progress/conversion browser coverage passes syntax
  and discovery; execution remains pending.
- Review remains unfinished: 135 Latin values contain the legacy prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f0bbb9a34">Repair Latin status, account and repair-result translations</a>. Thanks to xet7.</summary>

- Translate 70 status and account entries. Preserve temporary lockout,
  required credentials, minimum username length and repair-result counters.
- Three translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Problem-summary browser coverage passes syntax and
  discovery; execution remains pending.
- Review remains unfinished: 65 Latin values contain the legacy prefix.
  Unprefixed values and other languages still require semantic review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1e8c955e3">Repair remaining prefixed Latin report translations</a>. Thanks to xet7.</summary>

- Translate 65 report and flow-analysis entries, preserving thresholds,
  forecast caveats, historical limitations and import scope. Add a catalog-wide
  regression check against the legacy translation prefix.
- Three translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Five flow-report browser tests pass syntax and
  discovery; execution remains pending.
- No Latin values contain the legacy prefix. Review remains unfinished:
  unprefixed English import instructions and other languages still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96e2c6f620">Translate stale Latin Todoist and Planner import guidance</a>. Thanks to xet7.</summary>

- Replace two unprefixed English instructions with Latin matching the current
  source guidance. Preserve literal menu labels and imported field mappings.
- Three translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Both import browser tests pass syntax and discovery;
  execution remains pending.
- All-language review remains unfinished: the current inventory reports 30,285
  missing values across 105 languages, excluding 379 pending keys. Semantic
  review is also required because stale English can differ from today's source.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/db56686e35">Preserve reviewed shared words in translation inventory</a>. Thanks to xet7.</summary>

- Recognize 16 valid shared words across 14 Spanish, Italian, Dutch and
  Afrikaans
  locales without changing their translations. Match locale, key and exact
  source value so longer English phrases remain translatable.
- Three focused suites and 21 human-preference checks pass, including Dutch
  catalog coverage and negative tests for changed source text and other locales.
- The inventory now reports 30,269 missing values across 91 languages, excluding
  379 pending keys. This removes false positives; all-language translation and
  semantic verification remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ac5621e64">Translate Haitian Creole linked cards and storage controls</a>. Thanks to xet7.</summary>

- Translate 66 linked-card, announcement, storage and rule-fragment entries.
  Preserve permission checks, field matching, link directions and secret/access
  key distinctions. Repair the existing Haitian catalog regression failures.
- Haitian catalog and guarded-correction suites pass. All 21 human-preference
  checks pass, and existing Chinese values remain unchanged. Linked-field
  browser
  coverage passes syntax and discovery; execution remains pending.
- Newer Haitian import instructions and other languages still need translation
  and semantic review. The all-language objective remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80e756b223">Translate Haitian Creole outline and task import guides</a>. Thanks to xet7.</summary>

- Translate nine import guides and the card-color hint. Preserve literal menu
  labels, hierarchy mappings, completion states and first-board-only limits.
- Haitian catalog and guarded-correction suites pass, along with 21
  human-preference checks. Existing Chinese values remain unchanged. Nine import
  browser cases pass syntax and discovery; execution remains pending.
- Further Haitian strings and other languages still need translation and
  semantic review. The all-language objective remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e26b9f041b">Translate Haitian Creole project import guides</a>. Thanks to xet7.</summary>

- Translate nine project-import guides, retaining attachment exclusions,
  archived/completed states, nested-task markers and custom-field mappings.
- Haitian catalog and guarded-correction suites pass, along with 21
  human-preference checks. Existing Chinese values remain unchanged. Eighteen
  Haitian import browser cases pass discovery; runtime remains pending.
- Correct spreadsheet input assertions for monday.com, Wrike and Teamwork.
  Further translations and all-language semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a79388c894">Translate Haitian Creole import mapping controls</a>. Thanks to xet7.</summary>

- Translate 15 import-guide and mapping entries. Preserve English-header
  requirements, data exclusions, fallback columns and user-mapping alternatives.
- Haitian catalog and guarded-correction suites pass, along with 21
  human-preference checks. Existing Chinese values remain unchanged. Four new
  import browser cases pass syntax and discovery; execution remains pending.
- Correct Businessmap's spreadsheet input assertion. Further translations and
  all-language semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7687970a9d">Translate Haitian Creole bulk import and export controls</a>. Thanks to xet7.</summary>

- Translate 20 mapping, multi-board import and export entries. Retain member
  mapping limits, project boundaries, Excel/ZIP layouts and placeholders.
- Haitian catalog and guarded-correction suites pass, along with 21
  human-preference checks. Existing Chinese values remain unchanged. The bulk
  export browser test passes syntax and discovery; execution remains pending.
- Further translations and all-language semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/38e2004f8e">Translate Haitian integration and notification settings</a>. Thanks to xet7.</summary>

- Translate 49 integration and notification messages. Preserve link-rule
  syntax, webhook inheritance, identity hiding, grouping and delivery schedules.
- Haitian catalog and guarded-correction suites pass, with 21 human-preference
  checks. Existing Chinese values remain unchanged. The Haitian notification
  browser case passes syntax and discovery; execution remains pending.
- The refreshed inventory still lists 30,236 missing values across 91 languages,
  excluding pending keys. All-language translation and semantic review continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c8c00546d">Translate Haitian workflow and planning messages</a>. Thanks to xet7.</summary>

- Translate 45 administration, workflow, Blockly and Scrum entries. Preserve
  permissions, completion groups, planning matching rules and placeholders.
- Haitian catalog and guarded-correction suites pass, with 21 human-preference
  checks. Existing Chinese values remain unchanged. Two subtask browser cases
  cover editing and denied access; syntax and discovery pass, runtime is
  pending.
- Further translations and all-language semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/940aee620b">Translate Haitian planning sync and recovery messages</a>. Thanks to xet7.</summary>

- Translate 48 planning-sync and recovery entries. Preserve source matching,
  retained changes, permanent-deletion warnings and restrictions on resuming.
- Haitian catalog and guarded-correction suites pass, with 21 human-preference
  checks. Existing Chinese values remain unchanged. Three planning/recovery
  browser cases pass syntax and discovery; runtime execution remains pending.
- Further translations and all-language semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eca6c80825">Finish Haitian English placeholders and repair stale import guides</a>. Thanks to xet7.</summary>

- Translate eight remaining current placeholders and two stale-English import
  guides. The current Haitian placeholder inventory is empty, including pending
  keys; semantic correctness still requires review beyond that count.
- Preserve Scrum recovery permissions and data-retention choices. Add current
  catalog coverage and browser cases for recovery, LDAP and import guides.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Six browser cases pass syntax and discovery;
  execution remains pending. All-language translation and review continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bcdf935521">Correct Haitian attachment and rule terminology</a>. Thanks to xet7.</summary>

- Correct 81 existing translations: attachment terminology, checkbox actions,
  date-initialization triggers and assignee grammar. Preserve deletion warnings,
  storage details and placeholders. Update tests that encoded the old wording.
- Haitian catalog and guarded-correction suites pass, with 21 human-preference
  checks. Existing Chinese values remain unchanged. Rule-builder and attachment
  browser cases pass syntax and discovery; execution remains pending.
- These errors existed despite an empty English-placeholder inventory.
  All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5dd13b7808">Unify Haitian subtask and checklist terminology</a>. Thanks to xet7.</summary>

- Correct 30 card-control, activity and settings entries. Use consistent subtask
  and checklist terms, restore matching and template-copy meanings, and repair
  an article in the attachment-removal prompt without changing retention.
- Haitian catalog and guarded-correction suites pass, with 21 human-preference
  checks. Existing Chinese values remain unchanged. Subtask browser cases pass
  syntax and discovery; runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6227e6b908">Replace French calendar labels in Haitian Creole</a>. Thanks to xet7.</summary>

- Replace 14 French calendar labels and correct six core-interface entries.
  Preserve calendar variants, ISO weeks and national-calendar meaning; repair
  roadmap, account-anonymization, historical-snapshot and assignee wording.
- Haitian catalog and guarded-correction suites pass, with 21 human-preference
  checks. Existing Chinese values remain unchanged. The calendar-selector
  browser case passes syntax and discovery; runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/08b5bbf36f">Correct Haitian upload direction and archive guidance</a>. Thanks to xet7.</summary>

- Correct ten upload and control labels. Distinguish uploading from downloading,
  point archive restoration to All Boards, and clarify dropdown, template and
  creator-filter terminology while preserving administrator permissions.
- Haitian catalog and guarded-correction suites pass, with 21 human-preference
  checks. Existing Chinese values remain unchanged. The map-upload browser case
  passes syntax and discovery; runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7346d6a58">Correct Haitian visibility and email settings wording</a>. Thanks to xet7.</summary>

- Repair 14 settings strings: SMTP host, clickable URL schemes, starred
  swimlanes, visibility-description defaults and invitation/activity templates.
  Preserve empty-field fallback and external-link disabling behavior.
- Haitian catalog and guarded-correction suites pass, with 21 human-preference
  checks. Existing Chinese values remain unchanged. The email-settings browser
  case passes syntax and discovery; runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/54c2af0993">Correct Haitian administration and notification precedence</a>. Thanks to xet7.</summary>

- Correct 14 hostname, permission, notification and interface labels. Explain
  settings overrides rather than cancellations, preserve tenant prerequisites
  and administrator boundaries, and restore the full header-toggle description.
- Haitian catalog and guarded-correction suites pass, with 21 human-preference
  checks. Existing Chinese values remain unchanged. The notification browser
  case checks precedence wording; syntax and discovery pass, runtime is pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c5571248e">Correct Haitian due-card scope and attachment search terms</a>. Thanks to xet7.</summary>

- Correct nine labels: Due Cards includes future deadlines, My Attachments is
  not narrowed to cards, and attachment search tokens use the corrected term.
  Table-view swimlane labels now use consistent terminology.
- Translation suites and production-parser checks pass, including attachment
  presence, absence and invalid predicates. All 21 human-preference checks pass;
  existing Chinese values remain unchanged. Browser syntax and discovery pass,
  runtime remains pending. All-language translation and semantic review
  continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/95f0938b36">Distinguish Haitian card recurrence from checklist reset</a>. Thanks to xet7.</summary>

- Correct eight labels. Card recurrence is separate from automatic checklist
  unchecking; checking all items explicitly sets check marks. Known-account
  help identifies users recognized by the system with incorrect passwords.
- Haitian catalog and guarded-correction suites pass, with 21 human-preference
  checks. Existing Chinese values remain unchanged. The popup browser case
  passes syntax and discovery; runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cdcbe1e430">Repair Haitian account anonymization warning</a>. Thanks to xet7.</summary>

- Replace export-anonymization text incorrectly used for account anonymization.
  Explain permanent identity replacement, avatar removal, disabled login and
  retained board/card/comment history; correct the action label too.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. The confirmation browser case checks consequences
  without confirming the action; syntax and discovery pass, runtime is pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9bc9a3fe7e">Correct Haitian backup and credential terminology</a>. Thanks to xet7.</summary>

- Correct eight storage-help entries. Distinguish authentication credentials,
  settings and directories; preserve key-length requirements, restore warnings,
  backup paths and provider permission labels.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. The cloud-settings browser case passes syntax and
  discovery; runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dcb7064e49">Correct Haitian WIP groups and numeric summary labels</a>. Thanks to xet7.</summary>

- Correct six labels: distinguish WIP groups from enabling limits, identify
  optional group names and swimlane selection, and describe numeric value sums
  instead of field counts for fields selected to appear above a list.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Two browser cases check group labels and numeric
  totals with hidden fields excluded; syntax and discovery pass, runtime is
  pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a4cf08d65">Restore Haitian analytics explanations and report labels</a>. Thanks to xet7.</summary>

- Correct 39 entries. Replace shorthand with complete analytics methodology:
  missing history, overlapping blockers, forecast uncertainty and date
  fallbacks.
  Clarify report labels, movement reasons and the never-synced state.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Six browser cases cover report help and time
  adjustments; syntax and discovery pass, runtime execution is pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4063ccbbc8">Update Haitian import and synchronization guidance</a>. Thanks to xet7.</summary>

- Correct four entries: restore Jira pagination and required query fields,
  Excel column mapping and separate worksheet boards; replace French preview
  wording and clarify external tracking in list synchronization help.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Import, Scrum and sync browser coverage passes
  syntax and discovery; runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50955434aa">Clarify Haitian card actions and bounce thresholds</a>. Thanks to xet7.</summary>

- Correct four entries: identify the card used to create a board, avoid implying
  a fixed destination when linking, explain version lookup failure and describe
  configured bounce thresholds.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Card-action and bounce-help browser cases pass syntax
  and discovery; runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7d10b098f8">Translate Malagasy linked-card and storage messages</a>. Thanks to xet7.</summary>

- Fill 67 English placeholders: linked-card controls, custom-field directions
  and permissions, announcements, calendar mode, color inheritance, storage
  settings and rule connectors.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Four browser cases cover card links, announcements
  and S3 credentials; syntax and discovery pass, runtime execution is pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/211c67ad11">Translate Malagasy outline and task import guides</a>. Thanks to xet7.</summary>

- Translate ten guides for OPML, Org mode, MeisterTask, Obsidian, Linear,
  TickTick, ClickUp, Nullboard, Kanri and Pivotal Tracker. Preserve hierarchy
  mappings, completion dates, first-board limits and literal format/menu names.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Ten browser cases pass syntax and discovery;
  runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b3eaaf9f4e">Translate Malagasy project import guidance</a>. Thanks to xet7.</summary>

- Translate twelve guides for Tasks.org, monday.com, Super Productivity, Taiga,
  Vikunja, Quire, Wrike, Teamwork, Businessmap, Redmine, Notion and Plane.
  Preserve omission warnings, English column requirements and task nesting.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. All 22 translated import-guide browser cases pass
  syntax and discovery; runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef60786045">Translate Malagasy bulk import and export choices</a>. Thanks to xet7.</summary>

- Translate 35 messages for member and column mapping, bulk transfer layouts,
  Trello export and Sandstorm access. Preserve archive scope, placeholders,
  export permissions and the literal Swimlane label used for round trips.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Member-choice and bulk-export browser cases pass
  syntax and discovery; runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/519e99e4f3">Translate Malagasy integrations and notification delivery</a>. Thanks to xet7.</summary>

- Translate 45 integration and delivery messages. Preserve link-rule syntax,
  inherited webhook defaults, identity-hiding choices, notification grouping,
  delivery schedules and waiting until quiet hours end.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. The notification-settings browser case passes
  syntax and discovery; runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c09c273d4">Translate Malagasy workflow and administration messages</a>. Thanks to xet7.</summary>

- Translate 25 entries covering Wrike workflows, LDAP synchronization, OAuth
  domain restrictions, subtask permissions and Blockly fragments. Preserve
  workflow status mappings, configuration identifiers and placeholders.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Subtask and LDAP browser cases pass syntax and
  discovery; runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/36647667e6">Translate Malagasy Scrum planning transfer messages</a>. Thanks to xet7.</summary>

- Translate 21 messages for release selection, Scrum imports and planning sync.
  Preserve matching order, preview counts, unchanged unmatched cards and the
  safeguards for local planning changes and first synchronization.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Scrum import and planning-sync browser cases pass
  syntax and discovery; runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8422cc349c">Translate Malagasy stopped sync recovery messages</a>. Thanks to xet7.</summary>

- Translate 18 recovery messages. Explain retained applied changes, abandoned
  remaining writes, lost write access and why replayable operations cannot be
  discarded; preserve the oldest-50 display limit.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. The sync-recovery browser case passes syntax and
  discovery; runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef2e446d98">Translate Malagasy import and Scrum recovery messages</a>. Thanks to xet7.</summary>

- Translate 29 recovery and settings messages, preserving permanent deletion,
  retained records and rollback restrictions. The full Malagasy catalog now
  has no detected English placeholders; semantic review remains unfinished.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Four recovery browser cases pass syntax and
  discovery; runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e518992bb">Repair stale Malagasy import guidance</a>. Thanks to xet7.</summary>

- Replace old English Todoist and Planner guides that escaped placeholder
  detection. Restore Jira pagination and Excel worksheet mapping, and correct
  CSV delimiter wording. Five guides now follow the current English source.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Five browser cases pass syntax and discovery;
  runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01204a94f0">Restore Malagasy account warning and report explanations</a>. Thanks to xet7.</summary>

- Correct eight entries. Account anonymization now explains permanent identity
  replacement, disabled login and retained history. Five report notes restore
  missing-data rules, forecast uncertainty and methodological limits.
- Translation suites and 21 human-preference checks pass. Existing Chinese
  values remain unchanged. Six browser cases pass syntax and discovery;
  runtime execution remains pending.
- All-language semantic review and remaining translations continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6d688867cc8a24795be7d9125cac8cfb44825ab">Correct Malagasy report labels and WIP group terminology</a>. Thanks to xet7.</summary>

Correct 35 translations for numeric value sums, WIP groups, swimlane selection,
report measures and forecasts. Preserve the distinctions between open episodes,
confidence levels, minimum capacity and cycle duration.

The Malagasy catalog and guarded-correction suites pass with 30,220 audited
corrections. All 21 human-preference checks pass; 38,430 existing Chinese values
remain unchanged. Eight browser cases pass syntax and discovery checks; browser
runtime remains pending. Malagasy and all-language semantic review remain
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd274fb3126e15cac7093b85a1fa485dc403eb3d">Correct Malagasy recurrence and time-adjustment explanations</a>. Thanks to xet7.</summary>

Correct 14 scheduling and time-report translations. Card recurrence is no longer
described as resetting a card. Date triggers retain both setting and changing a
date, and time adjustments explain attribution limits and negative corrections.
Restore Gregorian ISO week information and clarify reminder input limits.

The Malagasy catalog and guarded-correction suites pass with 30,234 audited
corrections. All 21 human-preference checks pass, and 38,430 existing Chinese
values remain unchanged. Two new browser cases pass syntax and discovery;
runtime remains pending. All-language semantic review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7ec01cb14e2521c98da803ca3384066a7b399ad6">Distinguish Malagasy storage credentials from permissions</a>. Thanks to xet7.</summary>

Correct three Google Cloud and backup help strings that confused authentication
credentials with access permissions. Preserve optional key-file and default
credential fallback choices.

Translation suites pass with 30,237 audited corrections, as do all 21
human-preference checks. All 38,430 existing Chinese values remain unchanged.
The new browser case passes syntax and discovery; runtime remains pending.
All-language semantic review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aaaa3391bc0b0f7ab3e359d7406853f3460e0356">Restore Malagasy action and status label meaning</a>. Thanks to xet7.</summary>

Correct four labels for optional move reasons, requesting reasons, failed
version checks and header-icon toggling. Replace shorthand with explicit action
and status descriptions.

Translation suites pass with 30,241 audited corrections, as do all 21
human-preference checks. All 38,430 existing Chinese values remain unchanged.
The new browser case passes syntax and discovery; runtime remains pending.
All-language translation and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f71a482f02942f2a41967e0b8037e2eaaaa4cb8e">Translate Irish card links and remaining legacy storage labels</a>. Thanks to xet7.</summary>

Translate 67 English placeholders for attached cards, linked custom fields,
announcements, calendar mode, list colours, storage settings and rule
connectors.
Retain link direction, permission requirements and access/secret-key
distinctions.

The Irish catalog and guarded-correction suites pass with 30,308 audited
corrections. The older completed-catalog placeholder gate passes; newer feature
strings and semantic review remain unfinished. All 21 human-preference checks
pass, and 38,430 existing Chinese values remain unchanged. Four browser cases
pass syntax and discovery; runtime remains pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6be0ca89dc1f51a932ce2d47dcb4623dbbf82c22">Translate ten Irish import guides</a>. Thanks to xet7.</summary>

Translate OPML, Org mode, MeisterTask, Obsidian, Linear, TickTick, ClickUp,
Nullboard, Kanri and Pivotal Tracker import instructions. Preserve field
mapping,
completed items, format keywords and first-board-only limitations.

The Irish catalog and guarded-correction suites pass with 30,318 audited
corrections. All 21 human-preference checks pass; 38,430 existing Chinese values
remain unchanged. Ten browser cases pass syntax and discovery; runtime remains
pending. Irish and all-language translation and semantic review remain
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc97a96117452f461fd9300b399c68255aa96263">Translate twelve more Irish import guides</a>. Thanks to xet7.</summary>

Translate Tasks.org, monday.com, Super Productivity, Taiga, Vikunja, Quire,
Wrike, Teamwork, Businessmap, Redmine, Notion and Plane import instructions.
Keep required English column names, nested-task markers, field mappings and
warnings about content missing from exports explicit.

The Irish catalog and guarded-correction suites pass with 30,330 audited
corrections. All 21 human-preference checks pass; 38,430 existing Chinese values
remain unchanged. All 22 Irish import-help browser cases pass syntax and
discovery; runtime remains pending. All-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c92a11f39b6b4121efe30a406db424bea5da069">Translate Irish import and export controls</a>. Thanks to xet7.</summary>

Translate 38 controls for user matching, column mapping, bulk imports and
exports, Trello export and Sandstorm access. Preserve placeholder-user choices,
ZIP handling, workbook layout and the Trello round-trip label format.

The Irish catalog and guarded-correction suites pass with 30,368 audited
corrections. All 21 human-preference checks pass; 38,430 existing Chinese values
remain unchanged. Two browser cases pass syntax and discovery; runtime remains
pending. Irish still has 99 detected placeholders including pending-Transifex
keys. All-language translation and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b3a554e74895440cc40cffd25ff2c6fbd01efce0">Translate Irish integration and notification controls</a>. Thanks to xet7.</summary>

Translate 42 strings for external-link rules, webhook content, notification
layout, grouping, schedules and quiet hours. Preserve literal template tokens,
link examples and inherited-setting behaviour.

The Irish catalog and guarded-correction suites pass with 30,410 audited
corrections. All 21 human-preference checks pass; 38,430 existing Chinese values
remain unchanged. The notification browser case passes syntax and discovery;
runtime remains pending. All-language translation and semantic review remain
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ccf484c6d3d7a6992c3d80c5b59e0c4c8b8e9b1">Translate Irish workflow and permission messages</a>. Thanks to xet7.</summary>

Translate 19 strings for read-only fields, Wrike workflows, rule actions, LDAP
sync, provider email-domain restrictions and subtask completion. Preserve status
transitions, setting names, empty-domain behaviour and authorization limits.

The Irish catalog and guarded-correction suites pass with 30,429 audited
corrections. All 21 human-preference checks pass; 38,430 existing Chinese values
remain unchanged. Three browser cases pass syntax and discovery; runtime remains
pending. All-language translation and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee99da3ddf342077ba4ed126e853cea443fadcdb">Translate Irish recovery messages and close the placeholder gap</a>. Thanks to xet7.</summary>

Translate 38 messages for stopped list syncs, interrupted board imports and
server-only login settings. Keep retained changes, permanent partial-board
deletion, missing source files and recovery restrictions explicit.

The Irish catalog and guarded-correction suites pass with 30,467 audited
corrections. The full Irish placeholder check now finds no entries, including
pending keys; semantic review remains unfinished. All 21 human-preference checks
pass, and 38,430 existing Chinese values remain unchanged. Two browser cases
pass syntax and discovery; runtime remains pending. All-language work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e4d4b2125c250d724a41baa11ed33b8aabaabe95">Correct Irish action meanings and stale import guidance</a>. Thanks to xet7.</summary>

Correct eight strings: translate stale English Todoist and Planner guides,
distinguish card recurrence from resetting, restore optional move reasons, and
remove the implication that permanent anonymization uses temporary values.

The Irish catalog and guarded-correction suites pass with 30,475 audited
corrections. All 21 human-preference checks pass; 38,430 existing Chinese values
remain unchanged. Five browser cases pass syntax and discovery; runtime remains
pending. These stale passages show why zero placeholders does not establish
complete translation. Irish and all-language semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7676469d0e4ed9c8c6c97bf70918889d61276f2e">Restore complete Irish analytics explanations</a>. Thanks to xet7.</summary>

Correct eleven report strings. Replace shorthand with full explanations of
missing history, overlapping blockers, forecast uncertainty, minimum samples
and date fallbacks. Correct five report titles and the report-loading error.

The Irish catalog and guarded-correction suites pass with 30,486 audited
corrections. All 21 human-preference checks pass; 38,430 existing Chinese values
remain unchanged. Five browser cases pass syntax and discovery; runtime remains
pending. Irish and all-language semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/36579f0e7c9ef7ad5cd3438832656e40972554bf">Clarify Irish report metrics and numeric summary labels</a>. Thanks to xet7.</summary>

Correct 24 labels for report quantities, confidence, open episodes, minimum
capacity and moving-range values. Clarify the numeric value sum and applying a
WIP group to a swimlane.

The Irish catalog and guarded-correction suites pass with 30,510 audited
corrections. All 21 human-preference checks pass; 38,430 existing Chinese values
remain unchanged. Six browser cases pass syntax and discovery; runtime remains
pending. Irish and all-language semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/301fd32e09242dcfccd19eb5270e9f5c34763fe7">Correct Irish date triggers and card-link actions</a>. Thanks to xet7.</summary>

Correct seven labels. Date triggers retain setting as well as changing dates,
the ISO calendar names ISO weeks, and card-link actions distinguish the
destination board from creating a board from the current card.

The Irish catalog and guarded-correction suites pass with 30,517 audited
corrections. All 21 human-preference checks pass; 38,430 existing Chinese values
remain unchanged. The card-action browser case passes syntax and discovery;
runtime remains pending. All-language semantic review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32ae43650c794c52709d8a55043eca26aef28164">Restore omitted Irish import and header help details</a>. Thanks to xet7.</summary>

Correct three strings. Jira help now includes required fields and pagination;
Excel help explains per-sheet boards and column mapping. Restore the header
icon toggle's mobile/desktop and notification scope.

The Irish catalog and guarded-correction suites pass with 30,520 audited
corrections. All 21 human-preference checks pass; 38,430 existing Chinese values
remain unchanged. Five browser cases pass syntax and discovery; runtime remains
pending. All-language semantic review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/503d439ddcfd3408d3a8b97fa6f1c9ad859cc05e">Correct Irish rule subjects and omit duplicated linking verbs</a>. Thanks to xet7.</summary>

Correct six Irish card and assignee rule labels. Extend the existing grammar
helper to omit a second linking verb after Irish temporal clauses that already
contain one. Preserve the behavior of other languages.

The Irish catalog, guarded-correction and rule-grammar suites pass with 30,526
audited corrections. All 21 human-preference checks pass; 38,430 existing
Chinese
values remain unchanged. The browser case for rule rows and saved descriptions
passes syntax and discovery; runtime remains pending. Full semantic review
remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f5f5d0d332e8dd5cc68bbaaa597ef1dec4c7805">Translate Scottish Gaelic attachment and legacy storage messages</a>. Thanks to xet7.</summary>

Translate 41 English placeholders for attached cards, storage labels and rule
connectors. Preserve inaccessible-card and self-attachment restrictions and
access/secret-key distinctions. Technical storage wording is lower confidence
and needs fluent review.

The Scottish Gaelic catalog and guarded-correction suites pass with 30,567
audited corrections. All 21 human-preference checks pass; 38,430 existing
Chinese
values remain unchanged. Two browser cases pass syntax and discovery; runtime
remains pending. All-language translation and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f35ee57518af9f47f81009b223e6da626d5fed1">Translate Scottish Gaelic field links and board announcements</a>. Thanks to xet7.</summary>

Translate 26 strings for linked custom fields, announcements, calendar mode and
card colours. Preserve one-way/two-way directions, inaccessible cards, edit
permissions and paused-link conditions. Fluent review remains needed.

The Scottish Gaelic catalog and guarded-correction suites pass with 30,593
audited corrections. All 21 human-preference checks pass; 38,430 existing
Chinese
values remain unchanged. Two browser cases pass syntax and discovery; runtime
remains pending. All-language translation and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f86d9f3969dd756c907602dcd9a0a7edbe9498e">Translate ten Scottish Gaelic import guides</a>. Thanks to xet7.</summary>

Translate OPML, Org mode, MeisterTask, Obsidian, Linear, TickTick, ClickUp,
Nullboard, Kanri and Pivotal Tracker instructions. Retain hierarchy mappings,
completion dates, format keywords and first-board limits. Technical prose is
lower confidence and needs fluent review.

The Scottish Gaelic catalog and guarded-correction suites pass with 30,603
audited corrections. All 21 human-preference checks pass; 38,430 existing
Chinese
values remain unchanged. Ten browser cases pass syntax and discovery; runtime
remains pending. All-language translation and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5f86df1a3682185270864275074f5a567f46fd9">Translate twelve more Scottish Gaelic import guides</a>. Thanks to xet7.</summary>

Translate Tasks.org, monday.com, Super Productivity, Taiga, Vikunja, Quire,
Wrike, Teamwork, Businessmap, Redmine, Notion and Plane instructions. Retain
English-column requirements, nested-task markers and omitted-content warnings.
Technical prose is lower confidence and needs fluent review.

The Scottish Gaelic catalog and guarded-correction suites pass with 30,615
audited corrections. All 21 human-preference checks pass; 38,430 existing
Chinese
values remain unchanged. All 22 import-help browser cases for this locale pass
syntax and discovery; runtime remains pending. All-language work is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6a028b4327c07344d427e77173c60f48dc3638b0">Translate Scottish Gaelic import mapping and bulk export controls</a>. Thanks to xet7.</summary>

Translate 27 controls for user matching, column mapping, bulk imports and
exports. Preserve placeholder-user choices, single-export ZIP exceptions and
per-board workbook sheets. Technical prose needs fluent review.

The Scottish Gaelic catalog and guarded-correction suites pass with 30,642
audited corrections. All 21 human-preference checks pass; 38,430 existing
Chinese
values remain unchanged. Two browser cases pass syntax and discovery; runtime
remains pending. All-language translation and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9724c40077ed4376e4350caf7decfb178322881a">Translate Scottish Gaelic integration and notification controls</a>. Thanks to xet7.</summary>

Translate 53 strings for Trello export, Sandstorm access, link rules, webhook
content and notification delivery. Preserve literal placeholders, round-trip
labels, inherited settings, grouping and quiet-hour conditions. Technical prose
needs fluent review.

The Scottish Gaelic catalog and guarded-correction suites pass with 30,695
audited corrections. All 21 human-preference checks pass; 38,430 existing
Chinese
values remain unchanged. The notification browser case passes syntax and
discovery; runtime remains pending. All-language review remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73bdd4061b32668bfcb5a103b63e948a1471ed9c">Translate Scottish Gaelic workflow and permission messages</a>. Thanks to xet7.</summary>

Translate 19 strings for read-only fields, Wrike workflows, rule actions, LDAP,
provider domain restrictions and subtask completion. Preserve status
transitions,
setting names and authorization limits. Technical prose needs fluent review.

The Scottish Gaelic catalog and guarded-correction suites pass with 30,714
audited corrections. All 21 human-preference checks pass; 38,430 existing
Chinese
values remain unchanged. Three browser cases pass syntax and discovery; runtime
remains pending. All-language translation and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53be36536d77b68f9afc8c152b04f73ccc51faf0">Translate Scottish Gaelic recovery messages and close placeholder gap</a>. Thanks to xet7.</summary>

Translate 38 messages for stopped list syncs, interrupted imports and
server-only
settings. Preserve retained changes, permanent deletion and recovery limits.
Technical prose needs fluent review.

The Scottish Gaelic catalog and guarded-correction suites pass with 30,752
audited corrections. The full placeholder check now finds no entries, including
pending keys; semantic review remains unfinished. All 21 human-preference checks
pass, and 38,430 existing Chinese values remain unchanged. Two browser cases
pass syntax and discovery; runtime remains pending. All-language work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1fda1c4dd0177f099bfa523fe655443ba1539986">Correct Scottish Gaelic action meanings and stale import guides</a>. Thanks to xet7.</summary>

Translate two stale English Todoist and Planner guides and correct five labels
for card recurrence and optional move reasons. Technical prose needs fluent
review. Zero detected placeholders had not caught these errors.

Both catalog and guarded-correction suites pass with 30,759 audited corrections.
All 21 human-preference checks pass; 38,430 existing Chinese values are
unchanged.
Four browser cases pass syntax and discovery; execution remains pending.
All-language translation and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19f5807e041312a478a904fa49b0fe2b67284f5a">Clarify Scottish Gaelic date triggers and card linking</a>. Thanks to xet7.</summary>

Correct seven strings: include initial date setting in four rule triggers,
identify Gregorian ISO weeks, and distinguish linking to a destination board
from creating a board from a card. Direct wording needs fluent review.

Both catalog and guarded-correction suites pass with 30,766 audited corrections.
All 21 human-preference checks pass; 38,430 existing Chinese values are
unchanged.
Two browser cases pass syntax and discovery; execution remains pending.
All-language translation and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b46431477f8c69212b09c164fb04eec4a16c20e">Restore Scottish Gaelic report methodology and limits</a>. Thanks to xet7.</summary>

Replace five shorthand report notes with translated assumptions, sample limits,
missing-history handling and fallback dates. Clarify five headings and the
report error. Statistical terminology is lower confidence and needs fluent
review.

The catalog and guarded-correction checks pass with 30,777 audited corrections;
a test spelling assertion was corrected before the catalog rerun passed.
All 21 human-preference checks pass; 38,430 existing Chinese values are
unchanged.
Five browser cases pass syntax and discovery; execution remains pending.
All-language translation and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/999922d6a6bb6e9146ec3c0f96822bd3078148c2">Clarify Scottish Gaelic report controls and metric labels</a>. Thanks to xet7.</summary>

Correct 24 report labels for targets, estimates, historical samples and
statistical measures. Replace symbols with descriptive text. Specialist
terminology is lower confidence and needs fluent review.

Both catalog and guarded-correction suites pass with 30,801 audited corrections.
All 21 human-preference checks pass; 38,430 existing Chinese values are
unchanged.
Five report browser cases pass syntax and discovery, with target and size-field
assertions extended; execution remains pending. All-language review is
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/399e9a19d7bca4eec7e0c998074c363befb0827b">Restore Scottish Gaelic import instructions and header help</a>. Thanks to xet7.</summary>

Restore Jira pagination and required fields, Excel column mapping and separate
boards for each sheet, and the header notification-toggle explanation. Three
strings corrected; direct technical wording needs fluent review.

Both catalog and guarded-correction suites pass with 30,804 audited corrections.
All 21 human-preference checks pass; 38,430 existing Chinese values are
unchanged.
Four browser cases pass syntax and discovery; execution remains pending.
All-language translation and semantic verification remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e80dcf3ba6c08af1a42e2764cfd1982d4739323">Translate Igbo card attachment controls and storage identifier</a>. Thanks to xet7.</summary>

Translate nine strings for attaching and detaching cards, visibility, self-link
and count limits, and the S3 file identifier. Direct wording needs fluent
review.

Both translation and guarded-correction suites pass with 30,813 corrections.
All 21 human-preference checks pass; 38,430 existing Chinese values are
unchanged.
One attachment browser case passes syntax and discovery; execution is pending.
The refreshed filtered inventory still covers 87 languages, and pending keys
remain in scope. All-language translation and semantic review are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/77218ed315b1d34f8cddfc47eddd72b513f9bf69">Translate Igbo linked fields and board controls</a>. Thanks to xet7.</summary>

Translate 26 pending strings for linked-field directions, permissions, paused
links and board controls. Correct the custom-fields label, which repeated
culture. Direct technical wording needs fluent review.

Both translation and guarded-correction suites pass with 30,840 corrections.
All 21 human-preference checks pass; 38,430 existing Chinese values are
unchanged.
Two browser cases pass syntax and discovery; execution remains pending.
Igbo still has 191 detected placeholders including pending keys. All-language
translation and semantic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29282c6ddf04f0c39bf71bd085385b99eb2ab888">Translate ten Igbo import guides with format limits</a>. Thanks to xet7.</summary>

Translate OPML, Org mode, MeisterTask, Obsidian, Linear, TickTick, ClickUp,
Nullboard, Kanri and Pivotal Tracker guides. Preserve field mappings, completed
items, first-board limits and literal format identifiers. Longer technical
prose is lower confidence and needs fluent review.

Both translation and guarded-correction suites pass with 30,850 corrections.
All 21 human-preference checks pass; 38,430 existing Chinese values are
unchanged.
Ten browser cases pass syntax and discovery; execution remains pending.
All-language translation and semantic verification remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e8ebcd458266da9de3fdb95a75fd0d25e8eb2f4">Translate twelve more Igbo import guides</a>. Thanks to xet7.</summary>

Translate Tasks.org, monday.com, Super Productivity, Taiga, Vikunja, Quire,
Wrike, Teamwork, Businessmap, Redmine, Notion and Plane guides. Preserve import
exclusions, English-header requirements, subtask syntax and fallback mapping.
Technical prose is lower confidence and needs fluent review.

Both translation and guarded-correction suites pass with 30,862 corrections.
All 21 human-preference checks pass; 38,430 existing Chinese values are
unchanged.
The expanded 22-case Igbo import suite passes syntax and discovery; execution
remains pending. All-language translation and semantic review are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1cea7b89f1f6d5b344b8e4c2b9300ae5d1071dfc">Translate Igbo import mapping and bulk transfer controls</a>. Thanks to xet7.</summary>

Translate 24 member-mapping, column-mapping and bulk import/export strings.
Preserve placeholder-user choices, missing-column handling and the distinction
between single-board and multi-board ZIP files. Technical prose needs fluent
review.

Both translation and guarded-correction suites pass with 30,886 corrections.
All 21 human-preference checks pass; 38,430 existing Chinese values are
unchanged.
Two browser cases pass syntax and discovery; execution remains pending.
All-language translation and semantic verification remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93ef17b326fe51de9d8689e7a8454009147fd1b8">Translate Igbo Trello and Sandstorm transfer help</a>. Thanks to xet7.</summary>

Translate 15 transfer messages, retaining literal swimlane labels, access
requirements, partial-export warnings and selected-board export distinctions.
Direct technical wording needs fluent review.

Both translation and guarded-correction suites pass with 30,901 corrections.
All 21 human-preference checks pass; 38,430 existing Chinese values are
unchanged.
The Trello dialog browser case passes syntax and discovery; execution is
pending.
All-language translation and semantic verification remain unfinished.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.39 2026-10-13 WeKan ® release

**In short:** the Docker image's vulnerability scans on **Quay** and **Artifact
Hub** are cut down to what has no fix yet. The image no longer carries
**docker-cli** and its old Go, the bundled **FerretDB** and **MongoDB tools**
are built with **Go 1.27.2**, and eight npm packages inside Meteor's own
packages are raised to fixed releases. The **Android** and **FreeBSD** Bun
builds are fixed, the Docker job checks the bundle version again, and **SAML**
logs in users whose binding lacks the optional qualifiers.

This release fixes the following SECURITY ISSUES found by container image scanning:

**The Docker image** - what the image carries besides WeKan.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be2a4053be">It no longer installs docker-cli, whose Go 1.24 filled the scans</a>. Thanks to xet7.</summary>

Debian's `docker-cli` is a Go program built with Go 1.24.4, and its standard
library advisories were most of the Quay scan (about 60 entries per
architecture) and three of Artifact Hub's. Only the UCS migration used it, to
run `mongo` and `mongoexport` inside the old database container. Its wrappers
now run `releases/ucs-migration/docker-exec.mjs`, which talks to the Docker
Engine API over the mounted socket and keeps stdout, stderr and the exit
status apart exactly as `docker exec` did, with 125 when Docker refuses.
`tests/ucsDockerExec.test.mjs` drives it against a fake engine that splits
frames across reads, covers the refusals, and fails if the image installs a
Docker CLI again. It was not run against a live UCS host here.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/169670abd5">Eight npm packages inside Meteor's packages are raised to fixed releases</a>. Thanks to xet7.</summary>

Artifact Hub's scan found advisories in `browserslist` 4.28.4,
`baseline-browser-mapping` 2.10.40, `colord` 2.9.3, `svgo` 2.8.3 and
`source-map-js` 1.2.1 (meteor/minifier-css), `compression` 1.7.4 and `qs`
6.15.3 (meteor/webapp, meteor/oauth) and `lodash.template` 4.5.0
(aldeed:simple-schema), all fixed in the same major. Meteor pins those, so
`releases/bump-bundle-npm-deps.mjs` raises them in the built bundle. It now
also gives a bumped package its own copy of a dependency whose sibling is a
different version, so `compression` 1.8.2 runs with the `bytes`, `negotiator`
and `safe-buffer` it declares. On a copy of the real v12.38 bundle all eight
load, compression serves gzip and the bundle passes
`releases/bundle-smoke-boot.sh`. The `nodemailer` and `postcss-selector-parser`
fixes need a new major and are listed as not fixable, beside `uuid`.

</details>

**FerretDB and the MongoDB tools** - the Go programs bundled with WeKan.

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/b6880891">They are built with Go 1.27.2 and golang.org/x/net v0.60.0</a>. Thanks to xet7.</summary>

Both scans listed the Go 1.27.0 (`ferretdb`) and 1.27.1 (`mongo-tools`)
standard libraries and x/net v0.59.0, fixed in Go 1.27.2 and x/net 0.60.0.
[wekan/FerretDB](https://github.com/wekan/FerretDB/commit/b6880891) and
[wekan/mongo-tools-patches](https://github.com/wekan/mongo-tools-patches/commit/e4da9eb)
now build with them; rebuilt binaries embed go1.27.2 and x/net v0.60.0. The
FerretDB image also [takes Debian's security
updates](https://github.com/wekan/FerretDB/commit/3711b1cb) now, for the fixed
liblzma5. WeKan bundles them from their next releases.

</details>

None of these is an attempt anybody can make against a running WeKan - they
are what the image is built from - so nothing is recorded in Admin Panel →
Problems. The remaining Debian findings have no fixed package yet.

and fixes the following bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9949bca0b9">SAML logs in a binding that lacks the optional qualifiers</a>. Thanks to xet7.</summary>

A SAML binding stored with `issuer`, `nameID` and `nameIDFormat` but no
`nameQualifier` / `spNameQualifier` keys at all was not found by identity,
because a query for an empty string does not match a missing field. The user
was then found by username and refused as `account-already-bound-to-saml`,
shown as "SAML identity does not match this account". When the assertion's
qualifier is empty, a missing stored one now matches too, and the next login
writes both as empty strings so the record is exact from then on. A non-empty
qualifier on either side, and a missing issuer, still fail closed.
`tests/samlIdentityBinding.test.cjs` covers the login, the normalization and
those refusals, and the same queries were checked against a real FerretDB.

</details>

and fixes the following build bugs:

**Bun runtime bundles** - the per-target builds in bun.yml.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb12ea42c8">Android and FreeBSD build, and windows-arm64 no longer shows a false error</a>. Thanks to xet7.</summary>

Android: Termux's user does not own the bind-mounted bundle - the workflow
makes it writable for everyone - so `chmod` on `npm-rebuild-args.js` failed
with EPERM before a write that was allowed. A file is now chmodded only when
it is not writable already. FreeBSD: the final Bun native check was killed at
its three-minute deadline with no output, because its buffered console went
with it. It now writes each step unbuffered and exits explicitly, and the
supervisor tells a hung operation (a failure naming the step) from every
check passing and Bun then hanging on exit, a known FreeBSD deadlock
([oven-sh/bun#44595](https://github.com/oven-sh/bun/issues/44595)), which
passes with a warning. windows-arm64 built, passed and attached its bundle,
yet showed an error: the expected no-prebuilt-addon probe printed Bun's raw
`error:` line, which GitHub turns into an annotation; it is one plain line
now. `tests/bunTargetBuildFailures.test.cjs` covers each case, and the real
check passes under Bun 1.4.3 on Linux. Android and FreeBSD need their CI
runners to confirm.

</details>

**Release checks** - what the release workflow verifies and reports.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/163ebf260a">The Docker job checks the bundle version again</a>. Thanks to xet7.</summary>

The check looked for `"name":"wekan"` in `app.js`, but rspack keeps only the
`version` field the server reads, so every release skipped it with a warning.
It now also reads the one v-prefixed version-only module, and still only warns
when that is absent or ambiguous. A cancelled snap-launchpad job no longer
says it ran out of time: the v12.38 jobs were cancelled at 1h49m of a
360-minute cap while Launchpad sat in "Uploading".

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68c9f2bcd0">The build script parity guard passes again</a>. Thanks to xet7.</summary>

`tests/buildScriptParity.test.cjs` failed because the Bun target-build
scripts, which bun.yml runs on each target runner, and the UCS migration's
`docker-exec.mjs` are not `build.sh` menu entries. They are recorded as
internals with their reason, and all 1,820 node suites pass.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.38 2026-10-12 WeKan ® release

**In short:** a **GitHub CodeQL** alert on HTML end-tag patterns is fixed.
**SAML** says why it could not link an existing account and can find it by
email; **private favorites** show in the header popup, and a dragged **list**
shows clearly where it will land. **Bun** build fixes restore Android build
settings and stop native checks hanging, and **AppImage** packaging and the
**Helm chart** report find their release assets reliably.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/715eb2b826">End-tag patterns also match tags that carry attributes</a>. Thanks to GitHub CodeQL and xet7.</summary>

Alert 569: a test found a page's script with `<\/script\s*>`, but a browser
also ends a script at `</script foo="bar">` - a parse error it still renders -
so the pattern could miss the tag it was looking for. That test, the server
input sanitizer's `<style>` pattern and one more test now use
`<\/tag\b[^>]*>`. The sanitizer runs after sanitize-html has removed every tag,
so its pattern was defence in depth rather than an open hole, and none of these
is reachable as an attempt on a running WeKan, so nothing is recorded in Admin
Panel → Problems. `tests/securityAlerts20261012.test.cjs` now fails on the
loose end-tag shape for script, noscript, style, iframe, textarea and title
anywhere in the tree, and checks that the fixed pattern finds an end tag with
junk in it.

</details>

and fixes the following bugs:

**SAML** - linking a SAML login to an existing account.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9c75efe60">It says why an existing account could not be linked, and finds it by email</a>. Thanks to xet7.</summary>

Linking a SAML login to an existing account, for example one provisioned by
LDAP, refused with the same "SAML identity does not match this account" for
every reason - merging off, account already bound, no email, no
`email_verified=true`, email mismatch - and logged nothing. Each condition now
writes its own reason to the server log, and a missing `email` or
`email_verified` in the assertion is named on the sign-in page, because the fix
is in the IdP. The refusal itself is unchanged and fails closed. With
`SAML_MERGE_EXISTING_USERS=true`, a login name that IS the assertion's email
(an email NameID, or `SAML_LOCAL_PROFILE_MATCH_ATTRIBUTE=email`) also finds the
account by a verified email instead of trying to create a new user. The docs
and compose files now describe `email_verified`, the matching rules, and that
`SAML_ATTRIBUTES` is not used. `tests/samlIdentityBinding.test.cjs` drives the
login handler through every refusal and the email lookup, including negative
cases without merging, attestation or a verified local email. A live IdP was
not available to test against.

</details>

**The header bar** - the Favorites popup.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bcf2305448">Private starred boards show in the Favorites popup</a>. Thanks to Raymond-Voogt and xet7.</summary>

The `starredPublicBoards` publication sent only public and instance boards, so
a user whose favorites were all private boards saw "Make a board favorite" in
the popup. It now sends every starred board the user may see - public or
instance, or an active membership, organization, team or domain share -
through the same visibility builder as the other board publications, so a
revoked share or stale star still never brings a private board back.
`tests/publicBoardFavorites.test.cjs` covers the selector for private boards
and that every relationship clause requires `isActive`. The popup in a running
browser was not tested here.

</details>

**Board views** - dragging lists.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/205110e3a5">A dragged list shows clearly where it will land</a>. Thanks to mimZD and xet7.</summary>

The drop placeholder has no `--list-width`, so none of the list width rules
matched it, and it kept `flex-shrink: 1` with no content. In a swimlane wider
than the window, flexbox shrank it to a thin shadow between two lists. It now
never shrinks, all three list sortables give it the dragged list's width as
`min-width`, and it is drawn as a tinted, dashed drop area.
`tests/listDragPlaceholderVisible.test.cjs` pins the CSS and fails if any list
sortable in `client/` leaves out the `min-width`. The browser drag itself was
not run here.

</details>

and fixes the following build bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/929e3051d46ca267246fff4819fc2e62de05563f">Repair target builds and release asset checks</a>. Thanks to xet7.</summary>

The v12.37 Android Bun jobs lost their target variables when Termux cleared
Docker's environment. Pass them as command arguments after that boundary.
Sharp has no Android prebuilt addon, so install Termux libvips and compile
Sharp with its declared addon headers. Android users also need libvips at
runtime, as documented in the bundle instructions.

Both FreeBSD Bun jobs stalled after an addon dependency install. The following
load probe had no deadline. It now exits explicitly after loading, terminates
a stuck probe after 30 seconds, and falls back to source compilation. A Node
supervisor bounds the final native operation checks to three minutes; failed
checks still prevent packaging.

The i386 bundle was already attached when its AppImage job reported it absent.
Read the complete asset list before matching it, avoiding an early-closing
pipe, and distinguish API errors from a missing asset. The chart report uses
the available GitHub token and follows pagination links instead of guessing
pages; its pipeline now preserves a failed planner status. Expected database
errors and negative Mac smoke fixtures no longer emit CI error annotations.

Regression coverage exercises the failing boundaries directly:

- `tests/buildLogFixes.test.cjs` reproduces Termux's environment reset,
  checks complete AppImage asset responses and API failures, and terminates
  hung addon probes without accepting failed native checks.
- `tests/bunSharpSourceBuild.test.cjs` installs build headers from offline
  fixtures, removes stale native output and preserves compiler failures.
- `tests/backfill-charts-pagination.py` runs the actual chart planner against
  paginated responses, including more than nineteen pages, API errors and
  an unexpected pagination host.
- `tests/bunRelease.test.cjs` and `tests/macAppPackaging.test.cjs` verify that
  expected smoke failures do not annotate successful CI jobs as errors,
  while real failures retain their diagnostics.

Eleven targeted Node suites, six changelog suites, shell syntax checks and
workflow validation pass. A real Linux Bun bundle passes bcrypt and argon2
password checks, a Sharp image operation and the startup smoke gate.
Android and FreeBSD builds still require their CI environments; native
macOS archive validation is skipped on Linux. These are build-infrastructure
changes, with no application UI change requiring a browser test.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.37 2026-10-12 WeKan ® release

**In short:** **Bun** release builds explicitly install the compiler tools
needed to create the application bundle. A missing Rspack installation is
reported before compilation starts.

This release fixes the following bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d20a9e4a6c4f040037db13a767aeee6587666ed">Bun builds install Rspack before compiling</a>. Thanks to xet7.</summary>

The v12.36 ESM build stopped because Meteor could not find the configuration
inside `node_modules/@meteorjs/rspack`. The application's own configuration
was present, but Rspack is a development dependency. The locked npm install
now explicitly includes development and optional dependencies, including
native compiler packages, and checks for Rspack's configuration immediately.
Production npm settings can no longer omit these build tools.

`tests/bunRelease.test.cjs` runs an offline npm fixture that first reproduces
omitted build dependencies, then installs them with the workflow's flags.
It also verifies that the lockfile stays unchanged and the configuration
check runs before compilation. Bun packaging, release attachment tests and
workflow validation pass. A fresh local dependency install with production
omission settings and the corrected flags completed, followed by a successful
Meteor ESM build of the application. Full platform builds still require
GitHub Actions.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.36 2026-10-12 WeKan ® release

**In short:** The **Bun** release workflow fixes the installer failure that
blocked every platform build. The selected runtime stays consistent across
application compilation and platform downloads.

This release fixes the following bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f24448ebd11a4a49a334dc10f87f00846d84c41a">Bun setup accepts the selected runtime version</a>. Thanks to xet7.</summary>

The v12.35 ESM job passed `bun-v1.4.3` to `oven-sh/setup-bun`, which rejected
it as invalid semver before Meteor could build. The planner now emits a
separate `1.4.3` installer version while keeping the full release tag for
runtime downloads and provenance. All targets still use the same Bun release.

`tests/bun-release.py` verifies installer version conversion, retains the
original download tag, and rejects malformed and prerelease tags.
`tests/bunRelease.test.cjs` checks that the workflow sends each value to the
right consumer. Bun packaging, release attachment tests and workflow
validation pass. Full platform builds still need verification in GitHub
Actions; these checks cover the reported setup failure.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.35 2026-10-12 WeKan ® release

**In short:** The **Windows 32-bit** and **Windows ARM64** bundles build again,
and four **GitHub CodeQL** alerts are fixed, among them a pattern that could
stall the release build. Experimental **Bun** downloads arrive as **ZIP**
archives across its supported platforms, with automatic release attachments
and recovery of missing downloads.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/900267451c">Package scanning and generated code handle unsafe input</a>. Thanks to GitHub CodeQL and xet7.</summary>

Alert 565: the release script that prunes unused npm packages read package
names with a pattern that let `/` both separate and belong to path segments,
so a quoted `-/-/-/...` could be split in exponentially many ways, and one
real minified file took over two seconds by itself. A `/` now only separates.
Over all 23,812 files in node_modules it finds every package it found before,
and also `require('querystring-es3/')`, a form the old pattern missed and so
could have pruned. Alert 566: tests matched `<script>` case-sensitively, so a
check that sanitized output has no script would have let `<SCRIPT>` pass; four
now match any case. Alerts 567 and 568: a test wrote file paths into generated
JavaScript; it and four other tests now keep that code constant, and the i18n
loader the test drives refuses an asset name that is not a locale tag and
escapes the literal it writes. None is reachable on a running WeKan - a build
script and tests - so nothing is recorded in Admin Panel → Problems.
`tests/securityAlerts20261012.test.cjs` fails on these shapes anywhere in the
tree, and `tests/pruneUnreachableNpm.test.cjs` runs the attack string.

</details>

and adds the following release builds:

**Bun bundles** - an alternative server runtime, packaged for each supported
platform and attached to releases after validation.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d1db1c2340534fdf3f30b1aa2d8af3afcdfe9ca">Builds cover every supported OS and CPU</a>. Thanks to dupontbertrand and xet7.</summary>

`bun.yml` builds the selected release as Meteor ESM once, then rebuilds its
native dependencies for Linux (glibc and musl), macOS, Windows, FreeBSD and
Android, each on x64 and ARM64. Archives include Bun, and their names include
`bun`, the OS and CPU; each has a SHA256 checksum. Both release workflows call
it, and recovery skips complete archive/checksum pairs. Native hosted runners
and Alpine/Termux containers avoid CPU emulation where possible; FreeBSD
uses VMs. Fast compression and cached Meteor dependencies reduce build time.

Meteor's Bun support is still unmerged. An isolated, reviewed port of
[meteor/meteor#14751](https://github.com/meteor/meteor/pull/14751) to
3.6-rc.0 preserves WeKan's package pins; ordinary Node builds are unchanged.
These server bundles require an external database.
Native password/image checks and startup tests gate each target's upload.
Linux additionally checks HTTP, DDP and Chromium signup, board creation and
anonymous mutation rejection. The Linux x64 build and these browser checks
passed locally, along with ten upstream tests and thirty release-related
suites. Other target builds require GitHub Actions and were not run locally.
`tests/bunRelease.test.cjs` and `tests/bun-release.py` cover the target catalog,
asset names, missing checksums, rejected inputs and failed-build gates.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/05d45e219ffa56b1a7510862f1ca9839188bac15">Downloads use ZIP archives</a>. Thanks to xet7.</summary>

All Bun targets now attach `wekan-<version>-bun-<os>-<cpu>[-musl].zip`
and matching SHA256 checksums. Fast compression preserves executable permissions
and includes linked dependencies. Release recovery expects ZIP files even when
an older tar archive is present. Archive tests verify contents, permissions,
linked files and directories, checksums and recovery from the old format.

</details>

and fixes the following bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b34d36e8f5">The 32-bit and ARM64 Windows bundles find node-gyp again</a>. Thanks to xet7.</summary>

v12.34's build-win32 and build-win-arm64 stopped with "Cannot find module
...accounts-password/programs/server/node_modules/node-gyp/bin/node-gyp.js".
The jobs give `releases/compile-native-addons.mjs` the bundle as a relative
path, and node-gyp runs inside each package, where that relative path pointed
somewhere else. The path is made absolute first.
`tests/compileNativeAddons.test.cjs` now calls it the way the jobs do, with a
stand-in node-gyp that resolves paths as the real one does.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.34 2026-10-12 WeKan ® release

**In short:** On **Univention (UCS)**, avatars show again after an upgrade, and
an **LDAPS** server signed by a company CA is trusted again. **Sandstorm**
grains start faster, and the **32-bit ARM**, **Windows 32-bit** and **ARM64**
bundles build and run more reliably. Bundles, the **Docker image** and
**Launchpad** snap builds are smaller and quicker to make, with a stripped
**Node.js** and the **MongoDB Database Tools** as one program. Three **GitHub
CodeQL** alerts are fixed.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

**Regular expressions** - what goes into a pattern, and how it is escaped.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4caa929cfe">No pattern is built from an unescaped value, and no escape stops at the first match</a>. Thanks to GitHub CodeQL and xet7.</summary>

Alert 564: the release script that adds each platform's native packages
compiled its command-line platform and CPU into a regular expression, so the
caller chose part of the pattern. The package names are now compared as text.
The upload naming of attachments and avatars, the attachment rename popup and
`tools/mirror-menu.mjs` built a pattern from a file extension or a name the
same way; they compare literally now. Alert 563: a scoped package name had
only its first `/` encoded for the npm registry; every one is now, and
anything that is not a package name is refused. Seven tests escaped a pattern
the same first-only way, which let `- g+` pass a check meant for `g++`.
Alert 562: a test's app-id pattern backtracked exponentially on `0.0.0...`.
None of these is reachable as an attack on a running WeKan - a build
script's arguments, a test, and an extension Meteor-Files already limits to
letters, digits, `-`, `_` and `.` - so nothing is recorded in Admin Panel →
Problems. `tests/noUnescapedDynamicRegExp.test.cjs` parses every source file
and fails on a pattern built from an unescaped value unless the site is
listed with its reason, `tests/noIncompleteRegExpEscaping.test.cjs` fails on
any first-only escape, and the attack strings are run in
`tests/platformNativePackages.test.cjs` and `tests/platformTemplates.test.cjs`.

</details>

and fixes the following bugs:

**LDAP** - logging in through an LDAPS directory.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ab7d46714">An LDAPS server signed by a company certificate authority is trusted again</a>. Thanks to fvb-sb and xet7.</summary>

Since v12.15 WeKan verifies the LDAP server's certificate by default, and
Node.js verified it only against the Mozilla list it is built with. A company
root CA installed on the server with `update-ca-certificates` was unknown to
it, so after upgrading from v12.14 the snap refused LDAPS logins with
UNABLE_TO_VERIFY_LEAF_SIGNATURE. At startup WeKan now also trusts the
certificate authorities of the operating system, read the way Go programs read
them, including the bundle file a snap can still read when the per-CA links
point outside it. Verification is not relaxed: a CA the system does not have
is still refused, and Node's `--use-bundled-ca` keeps the old behaviour. A
refused certificate now says in the log and in Admin Panel's Test connection
what to do. `tests/systemCaCertificates6762.test.cjs` connects to a TLS server
signed by a test private CA, with and without that CA in the system bundle.

</details>

**Univention (UCS)** - WeKan served under /wekan, after an upgrade.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7514d6e175">Avatars show again, and lazily loaded code comes from the page's own address</a>. Thanks to xet7.</summary>

Every avatar was an empty circle, though Change Avatar showed the picture. The
stored address `/cdn/storage/avatars/<id>` was used as is, which on UCS is
outside WeKan's `/wekan` path, so the web server answered 404. Avatars are now
drawn under the path WeKan is served at, whatever host or path they were saved
with. A browser that opened WeKan by another address than `ROOT_URL` also
fetched part of WeKan's code from the `ROOT_URL` host, which it could not
reach; that code now comes from the page's own address. Links still use
`ROOT_URL`. `tests/avatarDisplayUrl.test.cjs` covers the stored address forms
and checks that no page draws a stored avatar address directly.

</details>

**Native modules in the bundles** - what each platform can load.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/628bb95619">32-bit ARM uses the WebAssembly sharp, and more platforms get the PDF text library</a>. Thanks to xet7.</summary>

v12.33 gave the armhf, armv7 and armv6 bundles sharp's native ARM package. Its
binaries are built for ARMv7 and ARMv8, so an ARMv6 board such as a Raspberry Pi
1 or Zero, and possibly some ARMv7 boards, can stop WeKan with an illegal
instruction the first time a thumbnail is made. 32-bit ARM now uses the
WebAssembly sharp, which runs on any CPU. Checking what the bundles carry also
showed that the PDF library needs `@napi-rs/canvas` to load at all, and only
Linux x64 had it. Bundles for Linux arm64 and riscv64, macOS and Windows x64
and ARM64 now get it, so PDF attachment text is indexed for search there too.
`tests/platformNativePackages.test.cjs` covers both.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/34a33f7b14">The Windows 32-bit and ARM64 bundles compile their sign-in modules again</a>. Thanks to xet7.</summary>

v12.33 published no win32 or win-arm64 zip: both jobs failed their native
module check. `bcrypt` and `argon2` have no prebuilt binary for 32-bit Windows,
and `argon2` has none for Windows ARM64, so they must be compiled. The jobs
left that to npm during the install, but npm 12 ignores `npm_config_arch` and
`npm_config_nodedir`, and blocks install scripts that `allowScripts` does not
list. `releases/compile-native-addons.mjs` now runs node-gyp itself with the
target CPU, and fails if no module comes out. With the real node-gyp 13,
`argon2` 0.44 and `bcrypt` 6, both compiled and hashed a password.
`tests/compileNativeAddons.test.cjs` covers the failure cases, and
`tests/win32BundleBuild.test.cjs` checks both jobs.

</details>

and improves Sandstorm startup and packaging:

**Sandstorm** - how fast a grain starts, and how much it unpacks.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bab0c13988">Reduce server bundle file count for Sandstorm extraction</a>. Thanks to mnutt and xet7.</summary>

Remove unused server copies of browser libraries and client-only Core-JS, plus
dependency type declarations. Keep the live server Core-JS polyfill, compiled
browser programs, executable TypeScript and migration tools. Expand dependency
analysis to include quoted specifiers, all server app chunks and
runtime/optional/peer dependencies; retain the policy veto and add a JSON audit.

The test SPK has 29,512 regular files instead of 44,472, a reduction of 14,960
(34%). With upstream Node stripping applied, its compressed size falls from
172.8 to 163.2 MiB. Local HTTP readiness remains 0.92 s; actual Sandstorm
extraction time on slow storage has not yet been measured.

Pruning, trimming and lazy-loading checks pass. Isolated packaged-runtime checks
cover XLSX/ZIP round trips, image rendering, PDF generation/text extraction and
SAML/LDAP dependencies. Browser and migration payloads compare byte-for-byte;
browser automation and a full legacy migration were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b8a4a234f">Defer SAML and LDAP dependencies until first use</a>. Thanks to mnutt and xet7.</summary>

Load SAML's protocol library only for configured SAML operations, the LDAP
client on connection, and username transliteration dictionaries only when
requested. Keep registration and authentication checks unchanged. A repeated
local production comparison reached HTTP readiness in 902 ms versus 974 ms with
lightweight timing enabled in both payloads. First use pays the deferred cost.

LDAP and SAML regression suites pass, including signed-response/replay checks
and deferred-loading coverage for disabled paths, first use, SAML caching and
STARTTLS options. Packaged dependency exports were checked using the shipped
Node binary. Browser automation was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3df146c164">Defer ZIP and Excel initialization until first use</a>. Thanks to mnutt and xet7.</summary>

Load archive dependencies when importing, exporting or restoring instead of at
server startup. This avoids Bluebird's eager diagnostic stacks and their costly
source-map processing. Keep lightweight Sandstorm launcher timing logs, but make
Meteor's detailed stack-based startup profiler opt-in. A rebuilt production
payload reached HTTP readiness in 1.38 s versus 2.90 s on the same persisted
test database with detailed profiling disabled in both; these are local
warm-cache measurements, not full browser load times. Source maps remain
enabled.

Fresh-process regression tests verify deferred loading, first-use workbook round
trips, invalid input and unchanged native Promise. Existing workbook, backup and
Sandstorm launcher tests pass; browser automation was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df1c240edd">Load server translations from private assets on demand</a>. Thanks to mnutt and xet7.</summary>

Keep non-English dictionaries out of the eager server script, reading each only
when requested. English remains embedded for startup fallback, all translation
contents are preserved, and browser dynamic imports are unchanged. The
production server script shrank from 129.6 MiB to 55.9 MiB; a local warm-cache
comparison reached HTTP readiness in 1.220 s versus 1.453 s with source maps
enabled.

Tests check every dictionary's contents, malformed input, server-only rule
selection, English fallback, and real Rspack first-use loading and caching.
Existing browser lazy-loading tests pass. Browser automation was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c26d75e31">Load server source maps only when formatting mapped stacks</a>. Thanks to mnutt and xet7.</summary>

Extract inline server maps into adjacent runtime JSON files, retaining their
contents and relative sourceMappingURL references without registering eager
Meteor manifest maps. About 51 MiB of base64 comments leave the startup scripts;
the app script shrinks from 55.9 MiB to 9.7 MiB. A repeated local production
comparison reached HTTP readiness in 1.003 s versus 1.225 s. Client scripts are
unchanged, and mapped error traces are preserved.

Tests verify identical mapped stacks with the packaged mapper, lazy reads,
read-only files, repeated trimming, invalid input and unchanged client scripts.
The bundle-trimming suite and signed-package startup smoke test pass. Docker
includes the extraction helper. Browser automation was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22d7d23118">Notify the waiting page immediately when WeKan is listening</a>. Thanks to mnutt and xet7.</summary>

Replace the normal five-second page refresh with a held readiness request. The
waiting-page process releases its listening socket, Meteor binds it, and the
launcher then signals the waiting process to answer HTTP 204. The browser keeps
its current URL and reloads immediately. The app also answers the readiness
endpoint after handoff, so disconnected requests can reconnect. A five-second
refresh remains for JavaScript-disabled clients; legacy migration dashboards
retain their separate progress-refresh behavior.

Actual production builds correct the earlier development-bundle extrapolation:
production embeds the large app inside app/app.js and does not incur the large
standalone .cjs Reify pass. Local production measurements reached HTTP readiness
in 3.25–3.73 seconds. An unpacked test SPK running as a read-only root with only
packaged libraries resumed in 3.32 seconds; the held response arrived 2 ms after
the listening marker. These are warm-host-cache measurements, not actual grain
or board-render timings. The profiling guide records build steps and boundaries.

HTTP tests exercise the real child-process handoff and retained connection;
waiting-page tests cover pending, successful, not-ready and disconnected
requests. The actual production readiness endpoint returned 204. Browser
automation was not run, as requested.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22d7d23118">Wait for the database listener instead of sleeping 1.5 seconds</a>. Thanks to mnutt and xet7.</summary>

The grain launcher checks FerretDB's loopback listener every 50 ms and starts
Meteor as soon as it accepts connections. It waits up to 30 seconds for a slow
database and fails if the listener never becomes available. Mongo's driver and
the application's database readiness hook still check protocol-level readiness;
the waiting page remains available through the handoff.

The same uncached local development bundle now listens in 2.51 seconds instead
of 3.96 seconds. Profiling attributes about another second to development source
maps requested by Bluebird's stack inspection. A temporary overlay matching
production's hidden-map setting reached 1.49 seconds; this is not a production
package benchmark and no source-map behavior was changed in the launcher.

Tests cover an already-listening database, a database slower than the old fixed
delay, timeout, packaging, fresh/resumed launcher integration and HTTP handoff.
No UI behavior changes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22d7d23118">Profile the Sandstorm server startup path locally</a>. Thanks to mnutt and xet7.</summary>

The grain manifest enables monotonic launcher milestones with process CPU
deltas; the local runner also enables Meteor's detailed startup profiler. The
local profiling runner uses the real memory wrapper, launcher, bundle and
FerretDB with the manifest environment; Bubblewrap maps isolated test data to
the normal grain paths. It does not need a Sandstorm service or simulate browser
identity and Cap'n Proto services.

Tests cover timing and CPU deltas, disabled diagnostics, environment
inheritance, packaging, and HTTP handoff. An opt-in local namespace integration
test runs the launchers twice with fixture payloads to check persistent test
data and milestone order. Actual local development-bundle runs also reached HTTP
readiness. The profiling guide explains timing boundaries, cache comparisons and
host I/O measurements; production grain performance still needs representative
data and storage. No browser behavior changes.

</details>

and speeds up the release builds:

**Release workflows** - building the image and the snaps.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c34e65403">The Docker image is built from the released bundles, not rebuilt under emulation</a>. Thanks to xet7.</summary>

The image build took 27 of the Docker job's 29 minutes, because it rebuilt each
bundle for seven platforms, six of them under QEMU. A first build stage now runs
on the build machine. It downloads each platform's released bundle, checks it
against the published checksum and checks that its Node.js binary is for that
CPU. The emulated stage only installs three runtime packages. The image's
Node.js is now the bundle's own, and no npm or compiler is in the image.
`tests/dockerImageFromBundle.test.cjs` checks the new build.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f60152d08">Launchpad snap builds get 1 MB of source, and no job clones unused history</a>. Thanks to xet7.</summary>

Each Launchpad snap build was sent the whole 237 MB repository, though it uses
only the recipe and a few scripts; it now gets those 1.1 MB. The snap, version
bump and release-tag jobs no longer clone the 447 MB history, and the Ondra and
Gantt sync no longer clones its target repositories' history. `release.yml`,
which ran on every push to look for Helm charts this repository does not have,
now runs only when `charts/` changes.

</details>

and makes the release files smaller:

**Bundled binaries** - what each bundle, image and snap carries.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3eb549058c">The bundled Node.js no longer carries its symbol table and debug data</a>. Thanks to xet7.</summary>

The Node.js executables from nodejs.org include the data a debugger reads:
linux-x64 and linux-arm64 Node.js 26 are 150 MB, and 117 and 115 MB without it.
`releases/strip-node.sh` removes it after the download has been checked against
its published checksum. It keeps the dynamic symbol table that bcrypt, argon2,
sharp and canvas load against, and refuses a result without it. A macOS node is
re-signed after stripping. FerretDB's own builds are likewise built without
symbols in wekan/FerretDB (57.7 to 40.3 MB), which bundles get with its next
release. `tests/stripNode.test.cjs` strips a real binary and checks what is
left.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44af4f3e72">The MongoDB Database Tools are one 15 MB program instead of eight taking 105 MB</a>. Thanks to xet7.</summary>

Each of mongodump, mongorestore and the other six carried its own copy of the
Go runtime and the MongoDB driver. wekan/mongo-tools-patches now publishes all
eight as one program, `mongo-tools`, and `releases/fetch-mongo-tools.sh` puts it
in every bundle with a small launcher per tool, so `mongodump` works as before
in bundles, snaps and on Windows. Until that release is published, the eight
separate tools are used. A bundle for a platform without tools no longer keeps
the amd64 ones. `tests/fetchMongoTools.test.cjs` checks the launchers, the
fallback, the checksum check and that nothing else downloads the tools.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/41bc82713e">Only the one-program mongo-tools is used, never the eight separate tools</a>. Thanks to xet7.</summary>

wekan/mongo-tools-patches now publishes only `mongo-tools-<platform>`: nine
binaries per platform had grown to 774 uploads a release, and GitHub's rate
limit stopped them part way. The fallback to the eight separate tools is
gone from `releases/fetch-mongo-tools.sh`, the local bundle build and the
release preflight, so every bundle, image and snap has the one program or no
tools, and the log says which. `tests/fetchMongoTools.test.cjs` serves a
release with only the separate tools and checks none is installed or even
requested, and fails on any script that builds such a download address.

</details>

and has the following developer-tooling fix:

- [The board permission guard accepts the commented-out Sandstorm migration it now finds](https://github.com/wekan/wekan/commit/8a78749061).
  Thanks to xet7.
- [The release scripts work with a GitHub CLI older than 2.48](https://github.com/wekan/wekan/commit/0516826f75),
  which has no `--slurp` and stopped the release. Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.33 2026-10-11 WeKan ® release

**In short:** **LDAP login on UCS** works again after the 12.32 upgrade, and
**Nextcloud sign-in** keeps its verified identity through WebSocket setup.
**Attachment thumbnails** work on every platform WeKan ships, not only Linux
amd64. The **Windows 32-bit** bundle, announced in v12.32 but not shipped,
builds now, the **ARM64** Windows bundle gets its missing sign-in module, and
every bundle job checks that its native modules are built for its platform and
CPU.

This release fixes the following bugs:

**Nextcloud** - sign-in and deployment regression tests.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91bfd08097">Sign-in survives SockJS header filtering, with live deployment tests</a>. Thanks to xet7.</summary>

SockJS removes custom headers before Meteor sees a connection, which discarded
Nextcloud's signed identity and prevented sign-in. The ExApp transport now
preserves a verified identity on its own upgrade socket, before that filtering.
Ordinary WeKan deployments do not install this hook.

`bash build.sh nextcloud-tests` builds current source and runs real Nextcloud
32–35, matching AppAPI, HaRP, WeKan and FerretDB SQLite under `.tools`. Browser
coverage includes three accounts, explicit administrators, private boards,
shared live edits, uploads, denied requests, resume-token isolation and account
disabling. Restart, an AppAPI upgrade to the source build, and full-volume
restore check the retained identity, board and downloaded file bytes. A `/cloud`
run exercises the real FRP Unix-socket tunnel with mutual TLS and rejects an
incorrect secret or TLS server name. All 40 browser checks passed. Docker
image and ARM64 execution still require deployment testing.

The [companion gateway fix](https://github.com/wekan/nextcloud/commit/f79f962)
keeps disabling effective after a failed menu removal and restart, and removes
ordinary Authorization credentials before proxying. Its 18 tests cover gateway
failures, process supervision, metadata and runtime isolation. Release tests
verify real signatures, tampering, existing-version retries and unsafe archive
members; the workflow now also packages its root directory under the app ID.

</details>

**UCS** - signing in after the App Center upgrade.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f0716fc74">LDAP login works after the UCS 12.32 upgrade</a>. Thanks to xet7.</summary>

The UCS app kept a 6.09 setting: WeKan's LDAP group filter on, with no group
named. WeKan 6.09 read that as "member of any group". Current WeKan refuses an
incomplete group filter, so every UCS user got "LDAP authentication failed",
and members of Domain Admins were no longer admins. UCS decides access with the
**WeKan activated** user setting, so the app in wekan/univention now turns the
group filter off and names groups by `cn`. `releases/ucs-release.py` refuses to
publish an app whose LDAP group settings WeKan would refuse at login.
`tests/ucsRelease.test.py` and `tests/ldapGroupFilterConfig.test.cjs` cover the
old and fixed settings. The UCS README gives a workaround for installations
that have already upgraded.

</details>

**Attachment thumbnails** - the image library on every platform.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/943bfd9197">Every bundle gets the sharp image library for its own platform and CPU</a>. Thanks to xet7.</summary>

Every bundle except Linux amd64 is made from the amd64 one, which had only
`sharp`'s Linux x64 binary. In the v12.32 zips for arm64, ppc64le, s390x,
riscv64, i386, armhf, armv7, armv6 and both macOS, and in the Docker images and
snaps made from them, thumbnails fell back to the full-size image. Each bundle
job now runs `releases/platform-native-packages.mjs` for its own target. It
adds that platform's `sharp` and libvips packages at the pinned versions,
checked against the npm registry's sha512. On Linux i386 and loong64, where
`sharp` publishes no binary, it uses `@img/sharp-wasm32`, now an optional
dependency in `package.json`. That fallback made thumbnails under Node 26
here. The script checks every native module's ELF, Mach-O or PE header for the
target. On the v12.32 zips it found the right packages for all Linux and macOS
bundles. `tests/sharpEveryPlatform.test.cjs` requires every bundle job to run
it.

**On 32-bit ARM this release can crash.** The armhf, armv7 and armv6 zips got
sharp's native ARM package, which is built for ARMv7 and ARMv8. On an ARMv6
board (Raspberry Pi 1, Zero), and possibly on some ARMv7 ones, making the first
thumbnail can stop WeKan with an illegal instruction. The fix is in the next
release: 32-bit ARM uses the WebAssembly sharp instead.

</details>

**Windows bundles** - what they build, and the native modules they ship.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df48ef2aeb">The win32 bundle builds, with its sign-in modules checked for 32-bit Windows</a>. Thanks to xet7.</summary>

v12.32 was the first release whose win32 job found its Node.js, and it failed
at the next step: `tar` in Git Bash reads the `D:` of the runner's temporary
directory as a remote host name. The job now gives `tar` only relative names
and node-gyp the Windows form of the path. The step after that had never run
either: `bcrypt` and `argon2` have no prebuilt 32-bit Windows binary, and
WeKan's sign-in cannot work without them. `releases/check-addon-arch.mjs` now
reads each shipped binary's header and fails the job unless both are built for
32-bit Windows. `tests/win32BundleBuild.test.cjs` checks the step, that no
Windows job gives `tar` such a path, and the checker on 32-bit, 64-bit and
Linux binaries.

**It was not built in v12.33 either.** The job got past the headers, but npm 12
compiled nothing for 32-bit Windows, so the addon check refused the bundle and
no win32 zip was published. The fix is in the next release.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b5e96ac682">Thumbnails work on Windows, and the ARM64 bundle can sign in</a>. Thanks to xet7.</summary>

Every Windows bundle is made from the Linux amd64 one, so `sharp`, which makes
attachment thumbnails, had only its Linux binary and fell back to full-size
images. Each Windows job now adds `@img/sharp-win32-<arch>` at the version
`sharp` pins, checked against the npm registry's sha512, and removes packages
built for other platforms. Checking the published v12.32 zips also showed that
the ARM64 zip had no ARM64 `argon2`, which sign-in imports with no fallback:
the job never told npm its target CPU, so nothing was compiled. It now does.
All three jobs check `bcrypt`, `argon2` and `sharp` before zipping.
`tests/platformNativePackages.test.cjs` (named `windowsNativePackages` in this
commit) covers the download, a tampered tarball and a path-traversal entry.

**The ARM64 part did not work in v12.33.** npm 12 ignores `npm_config_arch`,
so `argon2` was still not compiled for ARM64; the addon check refused the bundle
and no win-arm64 zip was published. The fix is in the next release.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.32 2026-10-11 WeKan ® release

**In short:** A dropped **card** no longer flickers by showing in both lists at
once, and the **Windows 32-bit** bundle is built again. **UCS upgrades** run
their migration from the ordinary WeKan image and can get every image from the
Univention registry alone. The platform docs are **reorganized** under
`docs/Platforms`, and their CPU table matches what **node-patches** and
**FerretDB** build.

This release fixes the following bugs:

**Card drag and drop** - what is shown between the drop and the saved move.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8323cc39c">A dropped card is no longer shown in both lists at once</a>. Thanks to mimZD and xet7.</summary>

The drop handler must call `sortable('cancel')`, which puts the dragged card
back at its source until Blaze re-renders the move. The drop preview filled the
target slot during that gap, but the card also stayed visible at its source,
so on a large board it was drawn twice until the source list caught up. That
is the flicker in the reporter's newest video on
[#6430](https://github.com/wekan/wekan/issues/6430). The card left at the
source is now hidden until Blaze removes or moves it. A reorder within one list
no longer jumps the card back to its old place first. A rejected move, or one
that does not arrive within 10 seconds, shows the card again where it is.
`tests/cardDropPreviewSource.test.cjs` covers these cases on a minimal DOM,
and `37-card-drag-sort.e2e.js` checks the source list during the drop.

</details>

**Windows bundles** - restore the 32-bit build.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24e5cc4300">The win32 bundle is built again</a>. Thanks to xet7.</summary>

wekan/node-patches publishes `node-win32.exe` with its checksum in
`node-win32.sha256sum` (without `.exe`), as the line `<hash> *node-win32.exe`.
The Node.js resolver looked only for `node-win32.exe.sha256sum` and an unmarked
name, so it reported that no Node.js existed for win32, and the win32 bundle job
skipped itself every release. It now also tries the sidecar without `.exe` and
accepts the `*` binary-mode marker. The downloaded binary was checked against
the published SHA256. `tests/releaseNodeSources.test.cjs` runs the checksum
matcher on real sidecar lines, and checks that a line for another file such as
`node-win32.lib` is never taken.

**It was not built in v12.32 after all.** This fix let the job find its Node.js,
and it then failed at its next step, unpacking the Node.js headers: no win32
zip was published. The fix for that is in the next release.

</details>

**UCS upgrades** - what the upgrade runs, and where it gets its images.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f4a8fa6c1">Bundle migration tools and use the target UCS registry images</a>. Thanks to xet7.</summary>

The 12.31 upgrade stopped before migration when the separate helper image
returned an authorization error. The ordinary WeKan Docker image now includes
its migration runtime and Docker client. The temporary worker explicitly runs
that command; normal WeKan startup and the two-service deployment stay intact.
The full release publishes these tools with the app image on all three
registries, and missing-release recovery retries its failed Docker job.

The generated preinst reads the target version's cached compose references and
tries those exact images first. Both images can therefore come solely from the
UCS registry, including its renamed tags. GHCR, Docker Hub and Quay provide
fallbacks for the pinned upstream versions. Pulls and a bundled-tools check run
before downtime; failure cancels the upgrade while retaining the original data.
The portal uploader checks anonymous availability, bundled tools and database
UID before writing a draft, and no longer builds a separate helper package.

Regression coverage includes UCS-only access, individual upstream fallbacks,
missing or ambiguous target metadata, failed downloads, missing tools, retries,
portal errors, cleanup and migration integrity. The 21 migration and 17 uploader
tests pass, as do the affected release and existing migration suites. No real
Docker build, UCS portal upgrade or browser/LDAP test ran in this environment.
A new WeKan release and UCS acceptance test are required; the already published
12.31 image does not contain these tools.

</details>

and has the following documentation updates:

**Platform docs** - where the platform pages live, and what is built.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b04b4b47c">The platform pages are reorganized under docs/Platforms</a>. Thanks to xet7.</summary>

The autoupdate design pages moved from `docs/Design/Autoupdate` to the
platform they describe: the per-OS pages to
`docs/Platforms/FOSS/OS/OS-future-alternatives`, the snap pages to
`Container/Snap`, UCS and Nextcloud to `Container/Docker`, and `Platforms.md`
to `docs/Platforms`. `docs/Platforms/FOSS/Cloud` was split between
`Container/Docker` and `FOSS/CloudFlare`, Friend and UCS moved under
`Container/Docker`, and Leo moved to `Features/ImportExport/Leo`. All links to
them were updated, in the docs, workflows, tests and on wekan.fi, and
`tests/docsLinksResolve.test.cjs` checks them.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ad51ec8eb">The CPU platform table matches the node-patches and FerretDB releases</a>. Thanks to xet7.</summary>

[Platforms.md](docs/Platforms/Platforms.md) now lists all 16
node-patches v26.11.1 targets and all 25 FerretDB v1.92.0 targets. Its table
of what is built matches the v12.30 and v12.31 release files and the
architectures of the Docker image: the armv7, armv6, Windows and macOS bundles
are included, loong64 is marked as not built, and the win32 fix above is
described. FreeBSD amd64 is listed as having both binaries now.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.31 2026-10-11 WeKan ® release

WeKan can be packaged as a Nextcloud External App with Nextcloud sign-in and
persistent FerretDB SQLite storage. The companion and publisher are implemented;
a real Docker build and Nextcloud/HaRP deployment still need validation before
production publication. Ready files document how WeKan can be added to
**ZimaOS**, **TrueNAS**, **Coolify**, **Dokploy** and the **AUR**.

This release adds the following feature and fixes:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a325cfe991">Nextcloud ExApp sign-in and persistent SQLite packaging</a>. Thanks to xet7.</summary>

The companion `wekan/nextcloud` provides AppAPI lifecycle endpoints, a
navigation entry, authenticated HTTP/WebSocket forwarding, HaRP support and
supervised WeKan/FerretDB processes in one container. Database, attachments and
avatars persist in the AppAPI volume. WeKan binds sign-in and resumed sessions
to the verified Nextcloud identity, keeps accounts separate by instance and user
ID, and assigns site-administrator rights only to explicitly configured users.

The standalone Nextcloud publisher checks for this authentication capability
before building amd64/arm64 images. Local tests cover signed identities,
concurrent account creation, cross-user resume refusal, disabled users, HTTP
file access, lifecycle callbacks and WebSocket forwarding. A real-deployment
browser suite is registered and syntax-checked, but was not run: Docker,
Nextcloud and HaRP are unavailable here. Signing credentials, registration and
live deployment checks remain documented in
`docs/Design/Autoupdate/Nextcloud.md`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c085a2d71">Fix Mac app smoke-test cleanup after successful startup</a>. Thanks to xet7.</summary>

Handle macOS process-group permission errors when only exited processes remain.
Inspect process state before ignoring the error, retain failures for live
processes, and print the app log even if cleanup fails. Regression tests cover
zombie groups, live permission failures, failed inspection and bounded shutdown.
The workflow now runs these tests on both Mac architectures. Local Linux tests
passed; the packaged app still needs a macOS workflow run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a1e97a18c4">Remove plaintext UCS provider password files (CodeQL alert 561)</a>. Thanks to xet7.</summary>

Pass the provider password to each CLI invocation through an anonymous stdin
pipe instead of writing a temporary credential file. Remove the password from
the child environment and retain redacted failure messages. Offline tests verify
repeated CLI authentication, no password file creation and failure redaction.
UCS/Nextcloud workflow checks pass; CodeQL and a credentialed portal run remain
for CI. No portal writes were performed during development.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c4c89e794">Fix Sandstorm port handoff after successful migration</a>. Thanks to xet7.</summary>

An old waiting-page process could deliver its exit callback after the blocking
migration had already started a replacement. That callback discarded the new
process reference, leaving port 4000 occupied when Meteor started and causing
`EADDRINUSE`. Only clear the reference when the exiting process still owns it.
A real-process regression reproduces the old failure and verifies that the
replacement exits before WeKan takes the port. All 20 focused Sandstorm checks
pass locally; a full grain upgrade was not run in this environment.

</details>

and has the following documentation:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb9c4c7044">Possible additional platforms, with ready files for five app stores and the AUR</a>. Thanks to xet7.</summary>

`docs/Design/Autoupdate/Platforms.md` opens with the open source platforms WeKan
is not on yet - checked in each catalog on 2026-10-11 - and, for each, what is
done and what is still missing. ZimaOS/CasaOS, TrueNAS, Coolify, Dokploy and the
Arch User Repository get the files their catalogs take and a README with the
pull request each expects, under `docs/Platforms/`. Each was tested with its
catalog's own tools where they run without the platform: CasaOS's validator and
store builder (1/1 built, both architectures pinned), the TrueNAS library
render, Dokploy's three validators, and Arch's `makepkg`, whose package started
WeKan and answered HTTP 200. `tests/platformTemplates.test.cjs` keeps the image
tag and the settings the same across them. None is submitted yet; the human
steps are listed.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.30 2026-10-11 WeKan ® release

**In short:** The **Import** page shows every source under "Import from:" at
once, in columns, when the window is wide enough. A **Sandstorm** grain shows
its please-wait page until WeKan is ready instead of an empty response, follows
the open board in its URL and title again, and its **Powerbox** button adds a
person to the open board. The **Windows** bundles no longer fail when
Chocolatey's package feed is down: they use the 7-Zip the build machine already
has.

This release adds the following new feature:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f44e52242c">The Import page shows every source under Import from: at once, in columns</a>. Thanks to xet7.</summary>

The source list was one row per line, so a wide window showed WeKan, Trello and
Jira and left the rest below the fold, beside a column of empty space. The
source list and the "What to include" list now flow into as many 200px columns
as fit (`columns: 200px`, a width rather than a count), so a phone keeps one
column, and a row never splits between two columns.
`tests/importPage.test.cjs` checks the column width and `break-inside: avoid`,
and fails if the lists go back to one column.

</details>

and fixes the following bugs:

**Sandstorm** - a grain that answers while it starts, a client that talks to the
Sandstorm shell again, and Powerbox invitations to a board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6e6b5d2e30">A Sandstorm grain shows its please-wait page until WeKan is ready, not an empty response</a>. Thanks to xet7.</summary>

The grain log reached `[repairBoardsOnStartup] done`, but the browser showed
`NS_ERROR_NET_EMPTY_RESPONSE`. `sandstorm-src/start.js` killed the please-wait
bridge on port 4000 and then loaded `main.js`, and Meteor 3 awaits every
`Meteor.startup` hook before it calls `listen`, so nothing answered on the port
for all of WeKan's startup. sandstorm-http-bridge got connection-refused, which
Sandstorm passes on as an empty response. Now the first `listen` on the app port
waits for the bridge process to exit and then binds, and the grain log says
`WeKan is listening on port 4000`. `tests/sandstormPortHandoff.test.cjs` runs
the real bridge and the handoff on a free port and checks the port answers 503
throughout startup and then WeKan's 200.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed5502edfa">The grain's browser code runs again, so the URL and title follow the board</a>. Thanks to xet7.</summary>

`sandstorm.js` was imported only by `server/imports.js` once `mainModule`
turned eager loading off, so its browser half never ran in a grain: the grain
URL and title stayed on the first page, the Powerbox picker could not open, and
the `isSandstorm` helper was undefined, so the email, password, logout and
avatar settings that Sandstorm handles itself were shown anyway. The server
half - which loads the Cap'n Proto bridge client and `node:net` - is now
`server/sandstorm.js`, and the client imports the shared `sandstorm.js`. Its
shell listener ignores messages that are not its own replies, instead of
throwing on every message another frame or extension posts.
`tests/sandstormClientHalf.test.cjs` checks both imports and fails when the
shared half picks up server-only code. Not yet tried in a live grain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed5502edfa">The Powerbox button is back and adds the person picked to the open board</a>. Thanks to xet7.</summary>

[#2405](https://github.com/wekan/wekan/issues/2405) removed the members
widget's Powerbox button because the identity it claimed was never attached to
a board, and node-capnp could not redeem it on Node 26 anyway. Redeeming works
again through `imports/sandstorm/bridgeClient.mjs`, and the button, shown only
in a grain and only to people who may invite, now passes the open board: the
claimed person is invited to it through `inviteUserToBoard`, with the member
picker's own checks - board membership, the Admin Panel's invite roles and the
organization and team restrictions. `tests/sandstormMultiBoardMembers.test.cjs`
pins the button, the board it passes, and that the claim adds members only
through `inviteUserToBoard`.

</details>

and has the following developer-tooling fix:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cb7e45b92">Windows bundles use the runner's 7-Zip instead of installing it from Chocolatey</a>. Thanks to xet7.</summary>

v12.29's build-win64 failed before building anything, in `choco install -y
7zip`: community.chocolatey.org answered `504 (Gateway Timeout)` and Chocolatey
could not resolve `7zip.install`. The windows-latest image already has 7-Zip in
`C:\Program Files\7-Zip`, so build-win64, build-win-arm64 and build-win32 use
it and put it on PATH for their later `7z` steps, falling back to Chocolatey,
retried five times, only on an image without it.
`tests/releaseWindows7zip.test.cjs` checks all three jobs and fails when any
workflow runs a bare `choco install` again.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.
