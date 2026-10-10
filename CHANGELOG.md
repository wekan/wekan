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

What is not done yet, and why, checked against the code on 2026-10-08.
Finished work is in Upcoming and old-CHANGELOG/; the dated development logs
that used to sit here are in git history.

**Needs infrastructure or credentials:** Jira closed sprints and their
commitment snapshots (the Jira Software sprint report API); live SMTP
interoperability with external mail providers (rule email was tested against
local SMTP only); the full matrix of Firefox on macOS, WebKit, mobile, full
FerretDB and live identity providers.

**Properties of the backends, not steps left undone:** cards, History,
activities and effects are coordinated by the write-ahead journal and replay,
not by a transaction - FerretDB v1 has no multi-document transactions, so a
snapshot is a sequence of reads and a card write already in flight cannot be
fenced. SMTP delivery is at least once. History dates already flattened to
strings, and legacy notifications already dismissed, cannot be reconstructed.

**Waiting on the maintainer:** filing the
[#4790](https://github.com/wekan/wekan/issues/4790) split prepared in
[User-Filter-4790-Split.md](docs/Features/User-Filter-4790-Split.md), which is
a publishing step.

</details>

<details>
<summary>Translation work in progress: remaining new strings in all languages.</summary>

Status checked on 2026-10-10. Translation work has resumed, including keys
previously held for Transifex. Completed work is recorded in Upcoming.

- The current `node releases/translations/fill-translations.mjs --missing`
  report counts **29,735 untranslated locale/string values in 42 languages**.
  It excludes **383 source keys tracked separately as pending Transifex**.
  A separate short-prose audit flags 1,681 candidates across 183 locales.
  The two notification At/To labels now have translations in all non-English locales;
  shared native words may equal English, so these require individual review.
  Exact Blockly OS brands and compact math/code symbols no longer inflate
  the prose backlog. Counts are a snapshot; they do not establish the quality
  or language of other values.
  Earlier Xhosa completion checks predate the newer pending strings. The
  current broad run still exposes English placeholders in several catalogs;
  see the dated audit results. Empty reports do not establish fluency.
- Placeholder inventories match English across all 246 locale paths. Fill now
  rejects damaged token batches before writing. Both card-field visibility
  keys are translated in 181 non-English paths; 53 paths still need them.
  Catalog key order and 21 human-preference checks pass. Browser execution
  and the remaining translation work are open.
- The 13 activity-notification preference keys have no empty or exact
  English-placeholder values in all 234 non-English locale paths and have left
  the pending queue. Provisional wording still needs language review.
- Automatic-archiving and date-filter messages now have non-English values in
  all 234 non-English locale paths. Continue the remaining feature families and
  the language-quality audit; coverage does not establish fluent wording.
- Hawaiian's current fill list is now empty, including pending keys. The work
  fills 936 English values and repairs eight malformed custom-field strings.
  Seventeen physical key legends are retained as exact-value exceptions.
  Whole-Blockly coverage includes short prose omitted from the report. This
  establishes placeholder coverage, not fluency: specialist wording and the
  older malformed-seed audit still need review. Five selected Hawaiian browser
  flows are registered and syntax-checked; execution remains unverified.
- Lithuanian and Yiddish each fill 112 current English values, including short
  delivery labels. Their full current fill lists are empty. Twelve malformed
  Lithuanian labels/activity messages and 40 Yiddish customization
  mistranslations
  are corrected separately. Four linked-field and notification UI cases are
  registered and syntax-checked; execution and broader language review remain
  open.
- Wu and Xhosa each fill 112 current English values, including short delivery
  labels; both full current fill lists are empty. Four Xhosa field/lane labels
  are corrected. Broader semantic review remains open, and the four selected
  browser cases are discovered and syntax-checked but not executed.
- Both Zulu catalogs fill 112 English values each, including short delivery
  labels. Their current fill lists are empty; specialist wording and broader
  semantic review remain open. Four localized browser cases are registered
  and syntax-checked, with execution still unverified.
- Papiamento fills 112 current English values, including short delivery labels.
  Its full current fill list is empty; five mixed-Spanish permission and search
  descriptions are also corrected. All 303 selected translation/Blockly suites
  pass, while technical wording and the wider semantic audit remain open.
  Three localized browser cases are discovered and
  syntax-checked; execution remains unverified.
- The short daily-send-time and quiet-hours-end labels are now translated in
  151 more locale paths (149 JSON files and two existing aliases). All other
  translations are preserved. The same two labels remain English in 75
  non-English paths, which still need direct translation. Eight representative
  browser cases are registered; execution and regional wording review remain open.
- Fill English placeholders in every language, including minority and
  constructed languages. Audit mixed-language and wrong-language seed text, and
  review provisional wording with speakers when available. Preserve
  correct-language human translations, source key order, exact placeholders,
  technical identifiers and query examples. Use direct translation and
  dictionary research, not an external translation service.
- Keep regression and human-preference checks passing. Passing tests does not
  establish translation completeness or fluency; rerun relevant checks for each
  batch and the broad suite before declaring all-language work complete.
- The three Admin Panel login-setting keys added on 2026-10-05 now have
  translations in all 234 non-English locale paths. English variants retain
  English. They have left the pending queue; full key-order and placeholder
  checks pass. All 237 translation suites pass. Minority-language compounds
  remain provisional, with terminology sources and mixed-language findings in
  [the audit notes](docs/Features/Translations/Audit.md).
  Browser scenarios for Finnish, Arabic and Japanese are syntax-checked but
  await Playwright and a running application. Continue the other pending keys
  and larger catalogs; this batch does not complete the all-language work.

</details>

<details>
<summary>Blockly translation work resumed; remaining languages and review.</summary>

Previously paused for release on 2026-09-27 and 2026-10-08; resumed on
2026-10-10 at the maintainer's request to translate all remaining strings.
Hawaiian now has no untranslated Blockly prose under its whole-catalog gate;
physical key legends, notation, URLs and platform names remain literal.
Specialist wording and other incomplete catalogs are still open.
Gujarati Blockly prose and Blocks-editor messages now have placeholder coverage;
the remaining catalogs and terminology review are now in progress.
The editable Blocks view
remains available. All 696 Blockly messages have WeKan message-key coverage,
but translation into every WeKan language is unfinished.

The latest completed batch covers hi, hi-IN, ta, kn, bn, ne and ur; the prior
batch covers fur, lld, rm and rup. Earlier completed batches are recorded in
Upcoming. Gujarati (gu-IN) has completed prose filling after resumption, with
specialist terminology still pending native review. Marathi
(mr), Malayalam (ml), Punjabi (pa), Sinhala (si) and Telugu (te-IN) were not
started in the interrupted assignment.
Additional language catalogs remain incomplete, including minority and
constructed languages. Completed low-confidence terminology still needs
native-speaker review; structural validation does not establish fluency.

Pause checkpoint: 246 locale files pass Blockly message coverage, source key
order and placeholder checks. The refreshed read-only report finds 62,562
prose-like English-identical values, with 116 catalogs above 50. Gujarati has
27 report matches; explicit regression exceptions cover retained notation,
platform brands and printed key names. Seven catalog checks, 21 preservation
checks and the Gujarati Chromium drag/edit/save/menu scenario last passed.
These are triage counts, not exact missing-translation counts: keycap names,
brands, mathematical terms, cognates and regional copies are included.
Run `node releases/translations/import-blockly.cjs --report` to refresh them.
Preserve correct human translations and all source placeholders on resumption.
No external translation service or remote translation upload was used.

</details>

<details>
<summary>Local translation repairs and validation paused; review remains.</summary>

Wrong-language and wrong-meaning repairs resumed at the maintainer's request
after the 2026-09-27 Transifex download. The first reviewed batch corrects 487
locale/key pairs and retains valid downloaded translations. The broader
semantic audit remains in progress; filling untranslated strings in every
language resumed on 2026-10-07; the dated pause below is historical.
See the [download review](docs/Features/Translations/Transifex-2026-09-27.md).
The dated findings below remain historical checkpoints, not proof of global
translation completion.

Resumed at the maintainer's request on 2026-09-13, beginning with Klingon.
As of 2026-09-16, all 20,081 original findings are classified:
15,880 corrected, 4,201 reviewed and retained, and zero restored or
pending. The correction inventory records 22,302 exact before/after
values, including repairs outside the original findings. This closes
the original flagged queue; broader wrong-language, low-confidence
wording and browser review remain unfinished.
Global completeness and terminology review remains separate from the
original queue.

All 361 originally flagged Klingon findings are repaired. The broader review
of 829
German-identical Klingon values repaired all 829, including the mistaken
German cron label, which now uses the actual tool name Cron.
The original Standard Moroccan Tamazight, Inuktitut and Veps queues are
classified. Silesian database terminology, Tigre calendar wording and
unflagged values still need language-specific review. Low-confidence
wording and browser rendering remain unverified.
The latest committed Tamazight card/list URL repair is 1cf93f7e52
(2026-09-15); its two exact correction records bring the ledger to
22,302. The zgh file still has 102 Arabic-script values awaiting
semantic classification. The translation working tree was clean at
this 2026-09-16 interruption checkpoint; no remote upload occurred.
Kashmiri reference review 0db69cf6c (2026-09-14) identifies provisional
civil wording and unresolved sighting/tabular/epoch terminology; no values
changed.

[Translation audit status](docs/Features/Translations/Audit.md) is the short
resume record; [detailed evidence](docs/Features/Translations/Audit-Evidence.md)
retains the categorized findings. Not all wrong translations originated on
Transifex: the evidence includes 4,061 pulled changes and 16,020 additional
local findings, and Bosnian errors predate the pull. No remote uploads were
performed. Preserve correct translations and source placeholders during repairs.
The requested organization, linked-file/static-archive and rate-limit mirror
changes are implemented in local commit 02383521a; translation repairs have
resumed.
Latest translation fix/review is 3b4941c34 (2026-09-14): Valencian error
count corrected and nine completion labels retained against historical
percentage and finished-state badge contexts. Broader verification stays open.
Of 611 restored Danish values reviewed, 606 are retained and five repaired.
Latest unchanged-value reviews are 944243917 and ed9be5431 (2026-09-14),
retaining 156 correct Danish storage, migration and monitoring/account labels.
Ambiguous
export and Complete wording remains open. Requested wekansec21 security
repairs are
prioritized while remaining translation review stays open.
Archive provenance follow-up fbe388603 (2026-09-14) directly inspects the
native Archives du Maroc logo in a university PDF, corroborating the noun
beyond indexed evidence. Nine records updated; no values/counts changed.
Full kanban labels remain low confidence.
Logo provenance follow-up 89f36d41f (2026-09-14) applies the dictionary's
cross-variety preface to two earlier URL records. Native caption evidence
remains separate; full labels stay low confidence. No values/counts changed.
Conversion review ecae7d919 (2026-09-14) distinguishes native Return/date-back
from the proposed checklist Become verb; confidence remains low and the
original-order variant is repaired in 996cc65c7 with low-confidence
candidates. No values/counts changed.
Checklist completion evidence follow-ups 9de9f2c15 and 4139001a3 distinguish
legal supplementation from directly attested software Complete Login. Past
actor form and full checklist grammar remain low confidence. Values/counts
unchanged.
Start spelling follow-up 2219d5358 distinguishes plain Begin/Start from
emphatic Share/Divide in indexed IRCAM entries; direct PDF and full command
verification remain open. No values or counts changed.
Subtask terminology finding 92f69f58d is repaired in 23c82a5c1. Full
hierarchical phrases remain low confidence; added-subtask activity is repaired
in b26d1ddc1, and Linked Subtask in af33f6640. Full wording needs review.
Bambara calendar follow-up 5610dff52 confirms current CLDR lacks native
Hijri variant names; Era vocabulary does not establish reference-date
Epoch. Both tabular calendar labels remain pending.

Node regressions resolved on 2026-09-13: the original audit ran 986 suites
with 19 failures. After the recorded source and guard repairs and one new
regression suite, the final full run completed **987 suites, zero failures**.
Calendar/date-popup, OAuth2, correction/review, progress and mocked upload
checks pass. Sardinian magenta remains an explicit language-review item;
the completeness guard permits only that exact known pending value.

The first complete EVERYTHING run passed Meteor, Node, import, Node E2E,
all three browsers, four database conformance runs and FerretDB tests.
The second EVERYTHING run passed #6691 in all three browsers, but Chromium
board-export popup readiness remains unresolved; the Fossil menu check is fixed.
Live external identity-provider validation and fluent-speaker translation review
remain outstanding. The latest full Node run passes **1,010 suites, zero
failures**, including
mirror-script and offline archive checks; no
remote mirror or translation upload was executed.


Field-sum terminology review (2026-09-14): the list sum display remains
pending. Addition-operation and sum-of-money references do not establish
the resulting numeric field sum; no count or operation was substituted.


Reference review 7b9e343b6 (2026-09-14) corrects source attribution in 98
Tamazight records: CNAM MC£ is Tuareg and MC is Mokrane Chemim, not
Central Moroccan dialect labels. Affected terminology needs renewed review.

Silesian database follow-up 45d98c94f (2026-09-14) corroborates regional
human usage of the shared database term. The raw-file qualifier and full
label remain pending; translation counts are unchanged.

Authentication reference review 9bcb5e162 (2026-09-14) directly verifies
MC£ (Tuareg) in the dictionary where the search index renders MCF. Do not
accept that candidate as Moroccan proof; authentication labels remain
under review with unchanged counts.

</details>

<details>
<summary>Need specific infrastructure / a running server stack we cannot reproduce here (left for environment owners).</summary>

[#3318](https://github.com/wekan/wekan/issues/3318) (outgoing webhooks from a
Sandstorm grain require a user-granted Powerbox network capability and a
Node-24-compatible bridge implementation; direct HTTP is intentionally blocked
by the grain sandbox),
[#6549](https://github.com/wekan/wekan/issues/6549) (OAuth2 through
Rocket.Chat's G Suite SAML app: WeKan logs in only when the Rocket.Chat session
already exists — the behaviour is on the identity-provider side, and reproducing
it needs that whole chain),
[#5758](https://github.com/wekan/wekan/issues/5758) (Windows SSO via Kerberos/
NTLM through `node-expose-sspi`: a Windows-only native Node addon exposing the
Win32 SSPI API — needs a Windows host, node-gyp/MSVC build tools, an Active
Directory domain, and a real SSPI handshake to build or verify at all; it also
sits directly in the authentication path, where a wrong implementation done
without that environment is a security risk rather than a convenience. The
maintainer's own comment on the issue already flags Node 20 compatibility
doubts and asks for a Windows/AD-experienced contributor).
UCS (Univention App Center) and the Nextcloud ExApp take their settings from
their own repositories,
not this one: whether the login variables added on 2026-10-05 (the 14 missing
ones, `LDAP_GROUP_FILTER_NESTED` and the `*_FILE` secrets) are offered there is
not checked; with the Admin Panel overrides, those installs can set them in
People either way.

</details>

<details>
<summary>Pending affected-data or database-backend verification.</summary>

[#6692](https://github.com/wekan/wekan/issues/6692#issuecomment-5811473169)
(the invitation account-block and anonymous metadata-subscription defects are
fixed; the separate HistoryIntegrity checksum mismatch needs the affected
stored row and predecessor to reproduce. Do not regenerate hashes to hide it.
See [investigation notes](docs/DeveloperDocs/LDAP-6692.md)).

</details>

<details>
<summary>FerretDB v1 fork backend parity: SAP HANA verification remains.</summary>

Range and `$in` pushdown, the external-database snap launcher and the OpLog
`ts` index in each backend's `collectionCreate` are in wekan/FerretDB. The
live check the previous entry asked for was done on 2026-09-29 against MySQL
9.7, MariaDB 12.3 and PostgreSQL 18 (see Upcoming): the pushed range did not
match the index on any of them, and the assumption that this was only a
selectivity question was wrong for MySQL, whose `UNSIGNED INTEGER` JSON type
made its range pushdown drop documents. Both are fixed and verified with
EXPLAIN and the conformance catalogue. What remains of
[#6509](https://github.com/wekan/wekan/issues/6509) is SAP HANA: its DocStore
index and range pushdown need a live HANA, which needs an amd64 machine, a
licence and about 16 GB of memory.

</details>

<details>
<summary>Feature requests / behaviour-by-design rather than bugs.</summary>

The #4790 split is prepared and waits for the maintainer to file it (see
"Waiting on the maintainer" above).

[#2698](https://github.com/wekan/wekan/issues/2698) (GitLab integration: one-way
List Sync from GitLab issues existed, and on 2026-09-30 the GitLab importer and
Sync source reached the format contract - assignees, dates, milestone,
iteration, weight, time, comments, links and the issue link (see Upcoming).
Writing changes back to GitLab, `#number` linking and embedding need a GitLab
server and API credentials to build and verify, which this environment does
not have).

</details>

<details>
<summary>Attachment-board upgrade report needs affected data or runtime logs.</summary>

An upgrade report by email: after a 6.09 to 10.85 dump-and-restore,
one board that has attachments loads forever - "it only loads and shows nothing:
no cards, nothing but the loading animation" - while every other board on the
same instance is fine. The attached `snap logs wekan.mongodb` is mongod startup
only, with no errors in it, so there is nothing yet to point at; it needs that
board's data, or the browser console and the WeKan (not mongod) log while it
hangs.

</details>

<details>
<summary>Needs a maintainer decision on the intended contract (partly already works).</summary>

The coordinated History chain (server/lib/storedHistoryChain.js) is switched
on per board only by the offline releases/recover-history-writer.cjs, with
every writer stopped. Decided on 2026-10-08: that stays the only switch. An
online switch would need proof that no older server still writes History the
legacy way, and a server older than the writer heartbeat cannot be seen at
all, so it is not offered.

[#2460](https://github.com/wekan/wekan/issues/2460) (SQRL login - the
report is a single comment-free link to https://www.grc.com/sqrl from 2019.
SQRL has no official Meteor/Node package, unlike accounts-2fa (#3058);
confirmed no `sqrl` dependency exists in `package.json`. Supporting it would
mean implementing SQRL's own custom Ed25519-based handshake protocol - not
OAuth2/OIDC, which WeKan already supports generically via
`accounts-oidc`/similar - either from scratch or via a third-party library, and
no well-maintained, actively-updated, MIT/copyfree-licensed Node.js SQRL
library is known to exist that a Meteor server integration could trust.
Hand-rolling an authentication protocol's cryptography is exactly the
security-critical work that should not be freshly written without extensive
review. SQRL's real-world adoption peaked around 2013-2016 and has not grown
since this issue was filed; WebAuthn/FIDO2 passkeys are the passwordless
standard that gained the adoption SQRL did not. Decided on 2026-10-03: kept
open as it is, with no implementation attempted.).

</details>

<details>
<summary>Import/export: attachment contents, Zenkit, and formats not read yet.</summary>

docs/Features/ImportExport/Format-Coverage.md is the contract every format is
held to, and every importer and exporter now meets it, with a loss report in
Problems → Recovery and on the import page. Left open:

- Attachment CONTENTS from the JSON sources (Jira, Deck, OpenProject, Asana,
  Zenkit, GitHub/GitLab): their exports carry attachment metadata only, so the
  bytes need live API connectors with credentials.
- Zenkit's native single-file export is unverified: Zenkit publishes no schema.
- Formats WeKan does not read or write yet. On 2026-10-08 twenty-one tools were
  added (see Upcoming) and the export formats of about forty were researched.
  Left: tools with no export file, only an API - Planka (its JSON export was
  never merged), Microsoft To Do, KanbanFlow, Basecamp, Taskcafe - which need
  live credentials to build and verify an importer against; Restyaboard, whose
  CSV export is a closed paid app with undocumented columns; YouTrack, Airtable
  and Leantime, whose CSV headers are undocumented or localized; and Things 3,
  whose export is its SQLite database. Each is taken one at a time.

Deck sharing rules are not imported by design: an import never grants access.

</details>

<details>
<summary>Continuous backup: what it leaves to the administrator, and why.</summary>

Admin Panel / Attachments / Continuous backup (see Upcoming,
docs/Backup/Continuous-Backup.md) encrypts at rest, uploads to S3/MinIO, Azure
or GCS, and applies a restored SQLite file on the next restart (built on
2026-10-03). Still open: the upload was tested against a directory-backed
remote and an adapter stand-in, not a live S3, Azure or GCS account, which
this environment does not have. The Docker Compose files run
FerretDB with an oplog since 2026-10-03; FerretDB releases up to v1.86.0 do not
record a dropped collection, which WeKan never does while it runs. The browser
tests ran in Chromium and WebKit; Firefox cannot launch on the macOS machine
used.

</details>

</details>

# v12.26 2026-10-10 WeKan ® release

**In short:** Boards now import from and export to twenty more tools, among
them **Microsoft Planner**, **monday.com**, **ClickUp**, **Linear** and
**Notion**, many boards at once, and imports, exports and the REST API
**stream attachments**. Cards gain **attached cards**, **linked custom
fields** and **subtask checkboxes**, boards a Trello-style **Calendar Mode**,
and e-mail, the tray and webhooks can each choose their **content, grouping
and schedule**. WeKan moves to **Meteor 3.6-rc.0**, and seven **GitHub
CodeQL** alerts and the **brace-expansion** advisories are fixed.
Translations are updated in 172 languages.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

**Imported Markdown links** - a link from an import file stays one link.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ec6d9af18">A link title or URL in an import file can no longer end its link early</a>. Thanks to GitHub CodeQL and xet7.</summary>

Alert 555: the Plane importer escaped `[` and `]` in a link title but not the
backslash, so a title ending in `\` ran on into the URL, and it passed the URL
through `encodeURIComponent`, which leaves `(` and `)` alone - a `)` in the URL
ended the link and the rest became a second link to another address. ClickUp,
Super Productivity and Vikunja wrote links the same way. All four now use
`models/lib/markdownLink.js`, which escapes the title and percent-encodes what
ends a destination. It is the content of an imported file, not an attempt
against WeKan, so nothing is recorded in Admin Panel → Problems.
`tests/securityAlerts20261010.test.cjs` renders the links with markdown-it and
checks no other importer escapes the old way.

</details>

**ExcelJS** - the copy WeKan now carries in `npm-packages/exceljs`.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ec6d9af18">Sheet names are read in linear time, and the manual test pages pin their CDN script</a>. Thanks to GitHub CodeQL and xet7.</summary>

Alert 556: `colCache.decodeEx` split a sheet name from a reference with a
regular expression that backtracks on long text, which a workbook being read
controls; it is now read in one pass, giving the same results. Alerts 557 and
558: the browser test pages loaded babel-polyfill from cdnjs without Subresource
Integrity; they now carry its hash. The same change is in the @wekanteam/exceljs
fork. The tests compare the new reader with the old expression and check that
no tracked page loads an outside script without integrity.

</details>

**Tests** - a line that looked like a guard and did nothing.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ec6d9af18">The import and export docs test escapes headings, and identity replacements are found in regex form too</a>. Thanks to GitHub CodeQL and xet7.</summary>

Alert 554: `replace(/ /g, ' ')` replaced a space with itself where an escape for
a regular expression was meant. `tests/noIdentityReplacement.test.cjs` only
looked at string patterns and listed `replace(/-/g, '-')` as fine; it now
reports a regular expression of plain characters replaced with the same text,
and found this line before it was fixed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb04a832ba">The security alerts test shows the old link escaping as its output, not as code</a>. Thanks to GitHub CodeQL and xet7.</summary>

Alert 559: the test written for alert 555 re-ran the old, incomplete escaping
to show that it let a URL end a link early, and code scanning reported that
code. The test now holds the Markdown the old code wrote and still checks it
renders as two links, and the check that no code escapes links that way now
reads `tests/` too.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eefc66185b">A Scrum test escapes a helper name completely, and incomplete escaping is found anywhere</a>. Thanks to GitHub CodeQL and xet7.</summary>

Alert 560: tests/scrumViewHelpers.test.cjs put a helper name into a regular
expression with only `$` escaped. It now escapes every special character, and
`tests/incompleteEscaping.test.cjs` finds a backslash escape that does not also
escape the backslash in any WeKan source or test, including inside a template
literal's interpolation, where this one was.

</details>

and adds the following new features:

**Import and export** - twenty-one more tools, each a round trip where the tool
can read its own file back (Plane, which has no file import, is import only),
matched by the tool's own column and field names.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7ef5b875fa">Microsoft Planner: the Excel workbook its Export plan to Excel writes</a>. Thanks to xet7.</summary>

Buckets become lists and tasks cards, with assignees, Created By as Requested
by, the four dates, the checklist, labels, and Progress, Priority and Completed
By as custom fields. Columns are matched by name; dates written in the
exporting user's locale are read day/month or month/day for the whole file.
Export writes the same workbook. The layout follows a real export, the MIT test
data of the plannr package in `tests/fixtures/planner/`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/804c7183a2">MeisterTask: its project CSV, in its export and its import shape</a>. Thanks to xet7.</summary>

Sections become lists, with notes, due and created dates, the assignee, tags,
completed and archived tasks. Export writes MeisterTask's import shape, which it
reads back. Columns without a documented shape are reported.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/435461f939">Obsidian Kanban: the plugin's own board file</a>. Thanks to xet7.</summary>

Follows the plugin's parser and writer: lanes with their card limit (now a WIP
limit), tags, @{dates}, the Tasks plugin's dates and priority, Dataview fields,
body task lists as checklists, Complete lanes and the Archive. Imported columns
can now carry a WIP limit, also Kanboard's own task_limit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb7cbc66e6">Linear: its CSV export, read as its own CSV importer reads it</a>. Thanks to xet7.</summary>

Statuses become lists and teams swimlanes; priority names, labels joined by
", ", the formula guard, the parent issue, estimate, project and cycle are kept.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46f026ddb6">TickTick: its backup CSV, versions 7.1 and 7.2</a>. Thanks to xet7.</summary>

Each TickTick list becomes a swimlane and its columns lists, with the ▫/▪
checklist, tags, dates (an all-day date stays on its day in the task's time
zone), status, priority and subtasks.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e7911a2d0">ClickUp: its workspace export and Spreadsheets importer CSV</a>. Thanks to xet7.</summary>

Statuses become lists, ClickUp lists swimlanes and the Space the board title,
with subtasks, assignees, tags, dates in milliseconds or ISO, time, priority and
attachments as links. Undocumented Checklists and Comments cells are reported.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2725f7a2aa">Nullboard: its .nbx board files, checked as Nullboard checks them</a>. Thanks to xet7.</summary>

Notes split into title and description; a raw note keeps a raw label. Export
writes one board Nullboard imports, with checklists as [ ] / [x] lines.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eec53eb322">Kanri: its board and all-data JSON exports</a>. Thanks to xet7.</summary>

Columns, cards, due date and its done flag, tasks as a checklist, tags with
their colors and Kanri's card colors. Imported labels now keep a source's label
color instead of always being black.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2e5fd9530e">Pivotal Tracker: the stories CSV that remains after its shutdown</a>. Thanks to xet7.</summary>

Repeated columns are collected in order, Current State becomes lists in
Tracker's workflow order, iterations Scrum sprints, Estimate the Scrum estimate,
comments keep their author and date, tasks a checklist and #id blockers
blocked-by links.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68b2cceb19">Tasks.org: its backup JSON, restorable back into Tasks.org</a>. Thanks to xet7.</summary>

Lists, tasks, tags, priority, the all-day/timed date rule, completion, time,
comments and subtasks as subtask cards. Export uses stable ids, so a second
restore skips tasks Tasks.org already has.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ceaad80f4">monday.com: the workbook its Export board to Excel writes</a>. Thanks to xet7.</summary>

Column titles are matched by meaning: Status lists, groups swimlanes, people,
dates, timeline, tags; other columns become custom fields, updates comments and
subitems subtasks. Export writes the flat table monday's own import reads.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b7e515dba6">Super Productivity: its backup JSON, at crossModelVersion 4.5</a>. Thanks to xet7.</summary>

Projects become swimlanes and lists follow its default Kanban states; sub-tasks,
tags, notes, dates, time spent, estimate, priority and archived tasks are kept.
Export is checked against Super Productivity's own validation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd6a8ce019">Taiga: the project dump its export writes and load_dump reads</a>. Thanks to xet7.</summary>

User story statuses become lists and Taiga swimlanes swimlanes; tasks become
subtask cards, epics and issues get swimlanes of their own, tag colors become
label colors and open milestones Scrum sprints. Export writes every key Taiga's
exporter writes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8e73adf48">Vikunja: its data export zip, in both bucket layouts</a>. Thanks to xet7.</summary>

The first kanban view's buckets become lists, several projects swimlanes, HTML
descriptions text with TipTap task lists as checklists, and relations parent
cards and dependencies. The zip is opened on the server under size and inflate
limits; export writes the same zip.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/979edf4c3b">Quire: the CSV its Import CSV reads and its Export CSV writes</a>. Thanks to xet7.</summary>

Columns are matched by header name in any order, and the task hierarchy is read
in all three ways Quire writes it: a Parent column, ID columns by depth, and an
ID path such as "#6, #8". Statuses become lists, Assignee the owner, Tag labels
and Priority a custom field; Duration, Estimate, Time log and Successors are
reported. Export writes the import columns with cards numbered #1 and onward.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/063365e8b9">Wrike: its Excel import template and official sample</a>. Thanks to xet7.</summary>

Wrike documents the columns of its import, not its export, so that template is
what is read and written. Folder rows become swimlanes, Status the lists, Parent
Task the parent card, Assigned To the owner and assignees, and Depends On a
blocked-by dependency. Export writes the list as a Wrike custom status in a
workflow named after the board (see the Wrike workflow entry below).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7aa90f7a00">Teamwork.com: the Excel template of its task import</a>. Thanks to xet7.</summary>

The ten documented columns, from Tasklist to Status. Task lists become lists, a
"-", "#" or ">" before a task name makes it a subtask of the task above, and
Estimated time is read in every form the article shows (25, 01:30, 1h 15m). An
.xls file is refused with a request to save it as .xlsx.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/edb808e266">Businessmap (Kanbanize): its Advanced Search Excel export and import tool</a>. Thanks to xet7.</summary>

Header names are matched in English in any order; a header in another account
language is refused with that explanation. Column becomes lists and Lane
swimlanes, Owner and Co-Owners the owner and assignees, Color the card color,
and Priority, Size, Type and Card ID custom fields, so an export imported back
into Businessmap updates the same cards.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c9ffd63d4">Redmine: its issues CSV, and the columns of its own importer</a>. Thanks to xet7.</summary>

Read as Redmine's csv.rb writes it, with a comma or semicolon separator and the
issue id first. Statuses become lists, projects swimlanes and trackers labels;
Parent task and Related issues ("Blocked by #12, Precedes (3 days) #9") become
parent cards and dependencies. Headers are matched by Redmine's English labels,
so a file in another language is refused with a request to export in English.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b7d3274780">Notion: its Markdown and CSV export zip, or one database CSV</a>. Thanks to xet7.</summary>

The zip is opened on the server under size limits, the database's full _all.csv
is preferred over the exported view, and each row's page body becomes the card
description. A Status column (else a select-like one) becomes the lists, and the
choice is said in the import report. Export writes a database CSV that Notion's
CSV import reads.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d21a263393">Plane: its issue export zip of CSV, JSON or XLSX, import only</a>. Thanks to xet7.</summary>

Read as Plane's export task and IssueExportSerializer write it. States become
lists, projects swimlanes, and parents, labels, dates, links and comments keep
their places; priority, estimate, cycles and modules become custom fields. The
XLSX variant writes its links and comments as Python text, which is reported
rather than guessed at. Plane has no file import to export to.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a78b4aa744">Wrike: custom workflow statuses in Excel, and workflows as lists and rules</a>. Thanks to xet7.</summary>

The Wrike Excel export now writes the workflow columns of Wrike's import help
article: Workflow (named after the board), Status (the list's status group) and
Custom Status (the list). Wrike applies a custom status only when that workflow
exists, so the board's lists are also exported as one, in the JSON of Wrike's
GET /workflows. That JSON is Wrike's only workflow exchange format. A list's
group comes from its "moved here, mark complete or incomplete" rule, else from
its name. In Rules > Import / Export, a pasted Wrike workflow adds the missing
lists and the rules that close and reopen a card as Wrike's status groups do.
Importing twice adds nothing. Wrike's own automation rules have no export,
import or API, so they cannot be carried over.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7858d84e12">Many boards at once: import many files or a whole app, export every board</a>. Thanks to xet7.</summary>

Every import source takes several export files, or one .zip of them, each
becoming its own board, and the import page lists what each became. One board
per project makes each swimlane an import would create - a tool's project,
folder or list - its own board, so an export of a whole app (Vikunja, Plane,
Kanri's all data) imports as many boards, as a Trello .zip does. Export all
boards, on the All Boards sidebar or for selected boards, downloads every
board in one format: Excel as one workbook with a sheet per board named after
it, the others as a .zip with a file per board. api.py gains importboardsfrom
and exportallboards.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73db241bd4">Every import asks who the file's people become: chosen users, placeholders or you</a>. Thanks to xet7.</summary>

The import page asks once, for every source: pick an existing user for each
person of the file, keep them as placeholder users that carry their own
username and name and cannot log in, to map to real users later, or make them
all the person importing. Every importer reads the same choice. The tools
imported through the generalized importer used to drop people nobody mapped;
they now get placeholders too, and their people are offered for mapping as
the server's parser reads them. A WeKan .zip imported as a new board streams
its attachments into storage instead of holding them in memory, held only to
the Admin Panel's upload limit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/86652c8718">CSV, TSV and Excel imports ask which column is which, and read WeKan's own Excel export</a>. Thanks to xet7.</summary>

Before importing, the page shows each card field with the file's column for
it, pre-filled from the header names in any language, and asks for what is
missing: a file with no list column gets one named list instead of one list
per row. Owner, swimlane, received date, parent card, spent time and archived
are applied. A workbook is read sheet by sheet with its header found where
WeKan's export puts it, so WeKan's own Excel export imports, and a workbook
with a board per sheet imports as many boards.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c80a656901">One description of every import source, one file chooser and one way to read a file</a>. Thanks to xet7.</summary>

models/lib/importSources.js describes each source once - its files, whether
it can be pasted, what its file is sent as and which importer makes the
board - and the import page, Import many boards and the tests of api.py read
it. The page's branch per source and its four file choosers became one path
and one chooser, so every source can be chosen as a file, not only pasted.

</details>

**Cards** - other cards and their fields, and subtasks, from the card itself.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32fa89fdc3">Attach a card to a card, as Trello's card attachments, and import them from Trello</a>. Thanks to ricardoboss and xet7.</summary>

A card's Attachments section has Attach card: find a card of the board by its
title, or paste a card link from any board you can read. The attached card is
shown with its title, board and list and opens that card; the x removes it.
Attaching needs the right to edit the card, only a card you can read can be
attached, and a viewer who cannot read an attached card does not see its
title. A Trello attachment that links to a card of the same export becomes an
attached card; the WeKan JSON export keeps them. A
[follow-up](https://github.com/wekan/wekan/commit/8215191197) gave the Attach
card popup its title and close button. See
[Attached cards](docs/Features/Cards/Attachments/Attached-Cards.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/746c097c9a">Link the custom fields of two cards, so a change on one is carried to the other</a>. Thanks to MarcusDger and xet7.</summary>

The Custom Fields menu links a card to another one, both ways or one way, for
example each worker's card sending to a main card on another board. Fields
match by name and type, dropdowns by item name, and fields on one card only
stay there. A carried value is written as the link's creator, recorded in
History, and only while that user may still read and edit both cards; admin-
only fields never take part, and a loop guard stops echoes and rings. See
[Linked custom fields](docs/Features/Cards/CustomFields/Linked-Custom-Fields.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a713154d70">Tick subtasks done from the parent card's Subtasks list, with done/total in its heading</a>. Thanks to zhoujunhaohao and xet7.</summary>

Each subtask row has a checkbox that marks the subtask card complete, and the
heading shows "Subtasks (1/3)". Done means marked complete or archived, which
the minicard badge and Hide completed subtasks now count too. The edit right
is checked on the subtask itself, which may be on another board; an assigned-
only member ticks only subtasks assigned to them.

</details>

**Board views** - Trello's calendar.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f133ddbba1">Calendar Mode, Trello's calendar, below Calendar in the view menu</a>. Thanks to tripledee and xet7.</summary>

A month or a week from the user's first day of the week, each card on the day
it is due with its labels and whole title, the day's cards in the board's own
order, and the board Filter applied. A card opens with a click. A saved Board
View menu order from before Calendar Mode gets it in its default place.

</details>

**Notifications** - what e-mail, the tray and webhooks contain, and when.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab785acd1e">Choose what e-mail, the tray and webhooks contain, and group and schedule them</a>. Thanks to HaKePlan, Meeques and xet7.</summary>

The Notifications popup at Admin Panel, board and Member Settings scope, and
each one-way webhook's form, set per channel: the content (for webhooks the
text and which property groups are sent, now with checklist, list and board
names, before/after values and links; for e-mail and the tray the classic
sentence or a clear layout with the board as a link and the actor and card in
bold), the grouping (per event, card, board or all) and the schedule
(immediately, every 5 minutes to 24 hours, or daily, with quiet hours). The
most specific setting wins, the defaults keep today's behaviour, and a member
can leave their name out of webhooks. Grouped webhooks and e-mail go through
durable queues; values of admin-only custom fields reach only board admins in
e-mail and tray, and never a webhook. See
[Notification delivery](docs/Features/Notifications/Notification-Delivery.md).

</details>

and updates the following dependencies:

- **brace-expansion 5.0.6 → 5.0.12** — brace expansion for glob patterns; six
  denial-of-service advisories (Dependabot alerts 137-142), in the vendored
  ExcelJS and the vendored jade's dev tools
  ([the update](https://github.com/wekan/wekan/commit/5ec6d9af18)).
  Thanks to dependabot.
- **Meteor 3.6-beta.3 → 3.6-rc.0** — the release candidate of Meteor 3.6,
  with every core package at its rc360.0 version
  ([the update](https://github.com/wekan/wekan/commit/51023baa0c)).
  Thanks to xet7.
- **@meteorjs/rspack 3.0.0-beta.3 → 3.0.0-rc.0** — the rspack bundler
  integration that goes with Meteor 3.6-rc.0
  ([the update](https://github.com/wekan/wekan/commit/d5c59211c0)).
  Thanks to xet7.
- **@wekanteam/meteor-reactive-cache 1.0.8 → 1.0.9** — its own dependencies
  updated, Babel CLI 8 among them, and its stale lockfile removed
  ([1.0.9](https://github.com/wekan/wekan/commit/7f8627590b), [the dependencies](https://github.com/wekan/wekan/commit/1bdc171f0f)).
  Thanks to xet7.

and fixes the following bugs:

**Keyboard shortcuts** - on for new users, and d without opening the card.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04a4f628e1">On for new users, and d opens a hovered card's due date</a>. Thanks to mimZD and xet7.</summary>

The users schema stored keyboard shortcuts as off for every new user while the
code means them on, so a new account had to switch them off and on again. With
no card opened, d on a hovered or selected minicard now opens that card and
its Due date editor. A test pins every profile setting's stored default to the
default its code reads.

</details>

**Date popup** - today stands out on every board theme.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b7ba1e2075">Today is filled green, on every board colour theme</a>. Thanks to mimZD and xet7.</summary>

The ring drawn in the day button's own colour was hard to see on themes whose
day buttons are already a strong colour, such as purple. Today now has its own
green fill with white text over every theme, the custom theme colour
included, and keeps the ring and underline; today and selected keeps a green
outline. Checked in the browser on the wisteria, dark and appleglasspastel
themes.

</details>

**Card details** - the description and the code in it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0495b8729d">Copying a code block in a card description no longer opens a new tab</a>. Thanks to carl-unique and xet7.</summary>

The copy button of a code block is a link inside the card viewer. It copied the
text, but the click went on to the viewer's link handler, which opens every link
in a new tab - here the board again. The button now keeps its click to itself,
and the viewer no longer opens a link to a place on the page in a new tab.
`tests/copyCodeBlock.test.cjs` pins both, and
`tests/playwright/specs/viewer-copy-code.e2e.js` clicks the button and checks
that no tab opens and the text is copied.

</details>

**Boards** - what sits on a board and its page.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c23891dfff">A board announcement can be dismissed again: the board no longer lies over it</a>. Thanks to xet7.</summary>

The board canvas filled its wrapper from the top, over the announcement
banner, so the swimlane header took the clicks meant for its close button.
While a banner shows, the board now starts below it. The browser test checks
the button is the element at its own place before dismissing it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8834cecea9">All Boards has Export all boards in its header bar</a>. Thanks to xet7.</summary>

It was only in the All Boards sidebar's home view, which nothing opens since
the page lost its hamburger - reachable through Search and the back arrow
alone. It is now a button beside Search, opening the same popup.

</details>

**Scrum** - planning shown and imported where it is asked for.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6ec8773937">Release names on cards, the import-into-board preview and the import report show again</a>. Thanks to xet7.</summary>

A card put into a release created after the names were cached showed
"Release:" with no name; an ID the cache lacks now asks again, throttled. The
import-into-board preview never appeared and the import report showed every
loss line empty, because their helpers were registered on another template;
tests/scrumViewHelpers.test.cjs checks each Scrum template has its own.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b723c111e">A transferred card that is only on its source board is reported as not matched</a>. Thanks to xet7.</summary>

Every unmatched card of the file's own board was reported as belonging to
another board, so "not matched" was all but unreachable for the usual
board-to-board transfer. Cards of a third board are still reported as another
board's and never written.

</details>

**Sync rules** - a durable rule does what the ordinary action does.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1de4a1fe6">A stored rule that copies or moves a card to another board brings its labels as Card.copy does</a>. Thanks to xet7.</summary>

Since #1759 a label the other board lacks is created there when the actor is
its admin, but the durable copy, move and move-all still dropped it, so they
were no longer the ordinary copy or move. They now plan the same labels, saved
in the command so a replay creates none twice; in a move-all a label created
for one card is the next card's. A mover who is not that board's admin still
drops the label.

</details>

**Large boards** - a board of thousands of cards opens and closes cards fast
on a server with 8 GB of RAM.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d56bb34490">Card close from 4 s to 0.1 s on a 4,000-card board; only visible data loads</a>. Thanks to markusst1982 and xet7.</summary>

The client cache queued a stop callback per helper re-run and asked Tracker
for dependents on every check; opening a card re-ran about 7,700 computations
because avatars, mentions and headers read the whole user and every minicard
depended on one board-wide index. Those now read only what they show, and the
indexes are per card. The lazy card window keeps only ids and sort keys and
sends comment text only when minicards show it; reactions and legacy
attachments come with the opened card. Downloads honour Range requests and
cloud uploads stream. In the FerretDB fork, dotted-path filters such as
meta.cardId reach SQLite instead of scanning whole collections. On the seeded
board, loading went from 17.6 s to 6.2 s and FerretDB's memory from 724 MB to
280 MB. See docs/Features/Admin-Panel/Problems/Large-Boards.md.

</details>

**Memory** - attachments and pictures stream instead of being held whole, so
large boards fit a small server
([#6745](https://github.com/wekan/wekan/issues/6745)).

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd75f8c476">A Trello .zip import streams from a temporary file, and its attachments into storage</a>. Thanks to markusst1982 and xet7.</summary>

The route read the whole upload into memory, opened the zip from that buffer
and read each attachment whole to put it on the board JSON as base64. The
upload is now written to a temporary file as it arrives, and each attachment
streams from its entry into storage, counted against the same zip limits
(server/lib/boundedZipEntry.js). Only the board JSON files are held in memory.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/627592cd7f">Export all boards as WeKan JSON writes each board into its zip entry piece by piece</a>. Thanks to markusst1982 and xet7.</summary>

Every board was built whole, every attachment as base64 inside it, before it
was added to the .zip. Each board is now written by the streaming exporter the
single board export uses, paced by the response, so memory holds a chunk at a
time instead of a board.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/719194741a">A cloned board's attachments stream from the source storage into the copy</a>. Thanks to markusst1982 and xet7.</summary>

Cloning built the board's whole export with every attachment as base64. The
export is now built without file data, and each attachment streams from the
source board's storage when the importer reaches it, held to the upload limit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ddc025c24d">Live Trello import streams each attachment from Trello into storage as its card is made</a>. Thanks to markusst1982 and xet7.</summary>

Every uploaded attachment was downloaded first, each read whole, and kept on
the board as base64. Each is now downloaded when its card is made and streamed
into storage, through fetchSafe's new stream mode with the same URL, credential,
redirect and size checks.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd054f9964">Moving files to or from the old CollectionFS storage streams them</a>. Thanks to markusst1982 and xet7.</summary>

Admin Panel > Attachments > Move read each file whole into memory in both
directions. Both now pipe chunk by chunk, a failed copy leaves no half file,
and a missing binary still names the attachment.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85a226433c">The REST API uploads and downloads attachments and backgrounds as the file itself</a>. Thanks to markusst1982 and xet7.</summary>

Every file was carried as base64 inside JSON, so the file and its base64 copy
were in memory at once. An upload whose body is the file now streams into
storage, and ?raw=1 on a download streams it out, with the same checks and the
API limits counted as the bytes flow. api.py uses the raw form; see
docs/API/Attachments.md.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52b86ef753">The PDF exports read each picture when it is drawn and are written to disk, not memory</a>. Thanks to markusst1982 and xet7.</summary>

The card and board PDF exports read every picture before making the document
and built the whole PDF in memory. Each picture is now read when its row is
drawn, and the document is written to a temporary file and sent from there;
the base-font fallback still takes over when the Unicode PDF fails.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b1841b7525">The card and board Excel exports are written as they are drawn, each picture read when written</a>. Thanks to markusst1982 and xet7.</summary>

Both read every picture into memory and wrote the workbook at the end. They
now write to the response through createWorkbookWriter, and the board export
writes each card's rows out once the card is drawn. With the fixed
@wekanteam/exceljs streaming writer (archiver 8 support and pictures on a
streaming sheet, made in the fork) each picture is opened only when it is
written, one at a time. That release (4.7.4) is now carried in
npm-packages/exceljs, so these exports stream; an older exceljs would take the
buffered writer as before. tests/excelExport.test.cjs pins both paths and, when
.tools/exceljs is checked out, runs the fork.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7be1ed082">Streamed attachments are stored again, and a Trello .zip brings its files</a>. Thanks to xet7.</summary>

The streaming above handed Meteor-Files 3's addFile a callback it never
calls - addFile is async - so every streamed attachment waited forever: .zip
imports, clones, REST raw uploads and storage moves stopped at their first
file. It now awaits the result. TrelloCreator also dropped the zip entry each
attachment was matched to, so a Trello .zip fell back to downloading Trello's
login-only URLs; it keeps it now. A file record without versions answers 404,
not 500.

</details>

**Import and export** - faults found while documenting every format.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8834cecea9">The Planner, Wrike, monday.com, Teamwork.com and Businessmap exports work again</a>. Thanks to xet7.</summary>

They answered 500: the shared renderer required each workbook writer through
a variable, which the bundler cannot resolve. Each is a literal require now,
and a test refuses a require by expression anywhere in server or model code.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62eb9c5c29">An OPML export holds its cards: text exports are made from checked values</a>. Thanks to xet7.</summary>

The export boundary sanitized every finished export as HTML, which stripped
OPML's <outline> tags with the card titles in them and logged every text
format's own tags as unsafe markup. A text export is now made from the board's
values passed through the boundary; JSON is checked as before.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cee923dbe">An imported person is named as the file names them</a>. Thanks to xet7.</summary>

A person first seen without a name - Taiga's owner given as an e-mail address
- kept the address as their placeholder's name although a comment named them.
A later name now replaces a name that is only the address, never a real one.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7858d84e12">A WeKan .zip export imports as a new board, and api.py handles every format</a>. Thanks to xet7.</summary>

The All Boards import page refused a WeKan .zip in the browser; it is now
unpacked on the server with its attachments, up to 512 MB of them. Kanri's
all-data export read only its first board and now reads them all. api.py sent
every file as JSON and wrote binary exports as text; it now sends each source
as the import page does and fetches Excel, PDF, CSV and TSV from their routes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7858d84e12">Trello Butler rules, the HTML export, Tasks.org time spent and Deck done fixed</a>. Thanks to xet7.</summary>

An imported Butler rule kept its list name in lowercase, so it never fired on
a list with capitals. The HTML export read the board JSON link off the export
popup, which no longer has it, and stopped there. The Tasks.org export left
out time spent, and a Nextcloud Deck card marked done through its API lost
that. Each is pinned by tests/importExportCodeFixes.test.cjs.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/594867bab7">Kanboard task links import as parent cards and dependencies; GitHub comments as comments</a>. Thanks to xet7.</summary>

Kanboard links were only reported as losses. Child and parent links now make
the parent card, and blocks, duplicates, fixes and relates to make
dependencies, the two rows Kanboard stores for one link becoming one; the
export writes them back. GitHub, Gitea and Forgejo embedded comments went into
the card description and now become card comments with their author and date.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73db241bd4">The Jira, Todoist and Planner import instructions name the current API and menus</a>. Thanks to xet7.</summary>

Jira's issue search is now GET /rest/api/3/search/jql with fields=*all, paged
by nextPageToken; Todoist exports with Manage data > Export as CSV; Planner
with Export as Excel. The endpoint is updated in every locale, as a code
literal; the rest of the translated texts still name the old menus until
they are translated again.

</details>

and has the following developer-facing changes:

**Design** - a report to decide teams and organizations from.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4758908725">A design report on organizations, teams and their hierarchy</a>. Thanks to xet7.</summary>

[docs/Design/TeamsOrganizations.md](docs/Design/TeamsOrganizations.md): what
the open issues ask for, what the code does today and the defects found
reading it, how other software manages and syncs groups from LDAP, SAML, OIDC
and SCIM, and options for WeKan, with the decisions left open.

</details>

**npm packages** - the @wekanteam packages are part of this repository now.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd6fe3ef1e">ExcelJS 4.7.4 is carried in npm-packages/exceljs</a>. Thanks to xet7.</summary>

The @wekanteam/exceljs release with the streaming writer fix (archiver 8, and
pictures on a streaming sheet) was published to npm but could not yet be
installed from there, so WeKan takes it from `npm-packages/exceljs` with a
`file:` dependency. That is what lets the card and board Excel exports stream.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9f29a41740">The other @wekanteam npm packages are carried in npm-packages too</a>. Thanks to xet7.</summary>

dragscroll, html-to-markdown, meteor-globals and meteor-reactive-cache are now
in `npm-packages/` and installed with `file:` dependencies, so a build does not
depend on their npm releases and a fix to one ships with WeKan.

</details>

**Tests** - test code held to the rules the source is.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/650849f98d">Release metadata, the source audit and a title-link guard follow Meteor 3.6-rc.0 and #6753</a>. Thanks to xet7.</summary>

The Dockerfile and snapcraft still named Meteor 3.6-beta, eight npm funding
links new to package-lock.json are allowed exactly, and the title-click guard
reads the viewer's link handler whole instead of a fixed window.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cee923dbe">The import browser tests follow the people choice</a>. Thanks to xet7.</summary>

A comment by a file's person is now by their placeholder user, its text as
written, so the tests check that rather than a "name: " prefix. The ClickUp
CSV quotes its cell with a comma, and the Planner test matches "Task 2"
exactly.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/adb46489a7">The view tests read the board's own view</a>. Thanks to xet7.</summary>

Since #4906 a view chosen on a board is saved for that board; two specs still
waited for the shared view and timed out in every browser.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e9c313f03">The localized Blocks test right-clicks a block beside its label</a>. Thanks to xet7.</summary>

In 13 locales with tall or wide glyphs the label covered the click point and
Firefox gave it the right-click.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/207072476b">The SAML popup test asks for the popup</a>. Thanks to xet7.</summary>

SAML logs in by full-page redirect by default; the popup test never chose
the popup, so its page navigated away.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ff8f82b40d">The Vikunja export test strips tags to a fixed point</a>. Thanks to xet7.</summary>

The test's stand-in sanitizer removed tags in one pass, the shape
`tests/tagStrippingFixedPoint.test.cjs` keeps out of the tree (CodeQL
js/incomplete-multi-character-sanitization). It now loops until nothing changes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f163a8000">A browser test for the import page's choice of who a file's people become</a>. Thanks to xet7.</summary>

The Playwright spec takes each of the three answers. "Make them all me" puts the
person importing on every card and makes no placeholder. Placeholders keep the
original name, cannot log in and join the board inactive. Choosing existing
users lists the file's people to map, and one left unmapped becomes a
placeholder.

</details>

**Releases** - what a release needs from the Upcoming section.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c0942ff56">Everything under the Upcoming heading is optional</a>. Thanks to xet7.</summary>

releases/release-all.sh stopped when the Upcoming section had no entries, no
In short summary, or a Translations group without its Languages updated line,
and releases/release-notes.sh failed on the same in the workflow, after the
tag. Now only the Upcoming heading is required, since it becomes the new
version; a missing part is a warning and is left out of the release notes.
tests/releaseUpcomingPreflight.test.cjs and
tests/releaseTranslationSummary.test.cjs pin both the warnings and the cases
that still stop.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5029b65382">CHANGELOG.md stays under GitHub's 500 KiB Markdown limit, so GitHub shows it</a>. Thanks to xet7.</summary>

At 2.1 MB GitHub showed "we can't show files that are this big right now" for
CHANGELOG.md: it renders Markdown up to 500 KiB, shows plain text above that,
and nothing above about 2 MB. releases/changelog-archive.mjs now keeps the
newest releases that fit in 450,000 bytes and moves the rest to
old-CHANGELOG/<year>/<MM>.md, a busy month split into parts that each render.
release-all.sh runs it after every release; no release section was changed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed4a3a86a1">A spread in a schema no longer stops the API docs, and so the release</a>. Thanks to xet7.</summary>

The v12.26 release stopped in its bump job: openapi/generate_openapi.py read
the key of every schema property, and notification delivery builds part of
four schemas with a spread, which has none. A spread is now documented as one
optional object named by the helper's first string argument,
notificationDelivery on all four. tests/openapiSchemaSpread.test.cjs runs the
whole generator.

</details>

- [A Translations group may give the count of its languages when there are too many to list](https://github.com/wekan/wekan/commit/3ec85c82d6).
  Thanks to xet7.

and documents the supported formats:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ea4d09678">List every import and export format in one page, linked from the README</a>. Thanks to xet7.</summary>

docs/Features/ImportExport/External-Tools.md listed ten tools while WeKan
reads and writes more than fifty. It now lists them all, grouped by kind: where
in each tool to get the file, what WeKan writes back, and what is not supported
yet and why. A test fails when the import page or the export menu names a
format the page does not.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7858d84e12">A directory per format, with the steps and the details for each</a>. Thanks to xet7.</summary>

docs/Features/ImportExport has a page for each of the 48 formats: how to
import and export it, one board and many, the shape the tool documents and
where it was read, what is kept and what the loss report lists, the REST API,
and the code and tests. Each format's details moved there from
Format-Coverage.md, which is now the index and the shared contract.

</details>

and improves translations:

**Translations** - continued language coverage and corrections.

**Languages updated:** 172 languages.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b2867896fb">Translate card links and import mapping</a>. Thanks to xet7.</summary>

Fill 61 Hawaiian English placeholders and repair eight malformed custom-field
strings. Regression checks preserve source tokens, link directions and
permission
requirements. The existing linked-fields browser scenario now covers Hawaiian
labels and hidden-card rejection; discovery passes, but execution awaits a
running app. Technical wording remains low confidence pending speaker review.

All 246 catalogs pass key-order and placeholder checks; 21 preservation checks
and 14 Blockly suites pass. The broad translation run passes 297 of 302 suites;
five completion gates expose new untranslated keys in other catalogs. Their
assertions remain intact, and the outstanding work is recorded in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e373cfb7a2">Translate imports, notifications and Blockly controls</a>. Thanks to xet7.</summary>

Fill 169 more Hawaiian English values, including 22 import instructions,
notification timing, webhook identity, LDAP and visibility messages, and
Blockly color, loop and editor controls. Keep external commands, file names,
column headers and all source placeholders intact. Tests distinguish loop
conditions, check import exclusions and protect existing translations.

All 19 targeted suites, 21 preservation checks and all-catalog key/token checks
pass. The 25 selected Hawaiian browser scenarios are discovered; execution
awaits a running application. Programming compounds and longer sentences remain
low confidence pending speaker review. The Hawaiian fill list still has 709
entries, and the wider all-language work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/714129c68f">Translate Blockly inputs, lists and logic</a>. Thanks to xet7.</summary>

Fill 186 more Hawaiian values, including short labels and list aliases that
ordinary fill reports omit. Translate keyboard navigation, accessibility labels,
list operations and Boolean controls. Whole-family regression checks preserve
copy semantics, read/remove distinctions, first/last indexing, strict/inclusive
comparisons and source placeholders.

All 19 targeted suites, 21 preservation checks and 246 catalog key/token checks
pass. The Hawaiian browser scenario is registered but has not been executed.
Specialist wording remains low confidence pending speaker review. Hawaiian still
has 536 entries in its full fill list, and all-language work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18bb105f91">Translate Blockly math and procedure messages</a>. Thanks to xet7.</summary>

Fill 171 Hawaiian values for mathematical operations, functions, variables,
screen-reader controls and navigation. Keep mathematical notation, numeric
bounds and placeholders intact. Regression checks distinguish random-number
bounds, logarithm bases, function output and screen-reader states.

All 19 targeted suites, 21 preservation checks and 246 catalog key/token checks
pass. Browser execution remains unverified. Mathematical and programming
terminology remains low confidence pending fluent-speaker review, with research
sources recorded in the translation audit. Hawaiian still has 365 entries in
its full fill list; the all-language goal remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe1a734523">Complete current Hawaiian placeholder coverage</a>. Thanks to xet7.</summary>

Translate 349 remaining values for Blockly text and workspace controls, Scrum
planning, Sync and recovery. Retain 17 exact physical keyboard legends. The
current Hawaiian fill list is empty, including pending keys, and regression
checks cover short Blockly prose omitted from the ordinary report. Existing
translations and all source placeholders are preserved.

The translation/Blockly run passes 297 of 302 suites; five existing gates in
other locales still report untranslated keys. All 21 preservation checks and
246 catalog key/token checks pass. Five selected Hawaiian browser scenarios
are discovered and syntax-checked; execution remains unverified. Specialist
wording is low confidence, and the older malformed-text audit remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d587d6c27">Translate current Lithuanian and Yiddish strings</a>. Thanks to xet7.</summary>

Fill 112 English values in each locale, including short delivery labels omitted
from the fill report. Correct 12 malformed Lithuanian card/activity strings and
40 Yiddish customization mistranslations. Preserve placeholders and executable
filter examples. Both current fill lists are empty; broader language review
remains open. The short-prose audit now includes capitalized At/To labels.

The translation/Blockly run passes 299 of 303 suites, resolving the shared
Breton/Lithuanian/Yiddish failure. Four other current-fill gates still fail.
All 246 catalog inventories, 21 preservation checks and nine short-prose audit
checks pass. Four localized browser scenarios are discovered and syntax-checked;
execution remains unverified. Yiddish technical wording remains low confidence;
dictionary references and the remaining work are recorded in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d91dfdfe87">Translate current Wu and Xhosa strings</a>. Thanks to xet7.</summary>

Fill 112 English values in each locale for card links, imports, exports,
notifications, Wrike workflows and subtask completion, including short At/To
labels. Correct four Xhosa field/lane labels separately. Both full current
fill lists are empty. Existing translations and exact source tokens are
preserved; broader terminology review remains open.

The translation/Blockly run passes 301 of 303 suites, resolving Wu and Xhosa
completion failures; Papiamento and Venda/Zulu still report untranslated keys.
All 246 catalog key/token inventories and 21 preservation checks pass. Four
localized browser scenarios are syntax-checked and discovered; execution
remains unverified without a local app. Technical wording remains low
confidence pending speaker review; sources are recorded in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c87837d19d">Translate current Zulu strings and clarify imported identities</a>. Thanks to xet7.</summary>

Fill 112 English values in each Zulu catalog for card links, imports, exports,
notifications, Wrike workflows and subtask completion, including short delivery
labels. Both current fill lists are empty. Clarify one Xhosa import label so
it describes replacing imported people with the current user. Preserve existing
Zulu translations, exact source placeholders and API identifiers.

The translation/Blockly run passes 302 of 303 suites; Papiamento still reports
untranslated keys. All 246 catalog inventories and 21 preservation checks pass,
as do targeted Zulu and Xhosa tests. Seven localized browser scenarios are
syntax-checked and discovered; execution remains unverified. Longer technical
sentences remain low confidence pending speaker review, with terminology
sources and remaining work recorded in the audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b25cadef3e">Translate current Papiamento strings and repair mixed-language guidance</a>. Thanks to xet7.</summary>

Fill 112 English values for card links, imports, exports, notifications, Wrike
workflows and subtask completion, including short delivery labels. Correct five
mixed-Spanish permission and search descriptions, preserving role limits and
site-admin restrictions. The full current fill list is empty; all other existing
translations and exact source placeholders are preserved.

All 303 translation/Blockly suites pass. After the final wording corrections,
three targeted Papiamento/audit suites pass again. All 246 catalog key/token
inventories and 21 preservation checks pass. Three browser scenarios are
syntax-checked and discovered; execution remains unverified. Longer technical
wording remains low confidence pending speaker review. The all-language backlog
and older semantic audit remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5fc636117">Translate remaining current Italian strings</a>. Thanks to xet7.</summary>

Fill 110 English placeholders for attached cards, linked custom fields, imports
and exports, member mapping, webhooks, notifications, Wrike workflows and
subtask completion. The full current Italian fill list is empty. Preserve
existing translations, exact placeholders and parsed constants. Regressions
check edit permissions, field direction, member replacement, ZIP handling,
quiet hours and workflow completion rules. Longer technical wording remains
provisional pending speaker review.

All 304 translation/Blockly suites, 246 catalog inventories and 21 preservation
checks pass. Three representative browser cases pass syntax and discovery;
execution remains unverified because the local app and browser dependencies
are unavailable. The wider all-language backlog and semantic audit remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bda8d389e8">Translate remaining current Norwegian Bokmål and Danish strings</a>. Thanks to xet7.</summary>

Fill 110 English placeholders per catalog, 220 values in total, for attached
cards, linked fields, imports and exports, member mapping, webhooks,
notifications, Wrike workflows and subtask completion. Both full current fill
lists are empty. Preserve existing translations, exact source tokens and
workflow literals. Regressions cover edit permissions, link direction, member
replacement, ZIP import behavior, quiet hours and workflow completion rules.
Longer technical wording remains provisional pending speaker review.

All 304 translation/Blockly suites, 246 catalog key/token inventories and
21 preservation checks pass. Six representative browser scenarios pass syntax
and discovery; execution remains unverified because the local app and browser
dependencies are unavailable. The ordinary backlog remains 29,735 values in
42 locales because these fills were pending source strings excluded from that
report. The wider all-language work and semantic audit remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b71d83ce7e">Translate remaining current Finnish and Swedish strings</a>. Thanks to xet7.</summary>

Fill 110 English placeholders in each language, 220 values in total, for linked
cards and custom fields, imports and exports, member mapping, webhooks,
notifications, Wrike workflows and subtask completion. Both full current fill
lists are empty. Existing translations, exact source placeholders and workflow
literals are preserved. Regression checks cover edit permissions, propagation
direction, member replacement, ZIP handling, notification timing and Wrike
completion rules. Longer technical wording remains provisional pending review.

All 304 translation/Blockly suites, 246 catalog key/token inventories and
21 preservation checks pass. Six representative Finnish/Swedish browser cases
pass syntax and discovery; execution remains unverified because the local app
and browser dependencies are unavailable. The ordinary backlog remains 29,735
values in 42 locales because these fills were pending strings excluded from
that report. The wider all-language and semantic-review work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a5db842c0e">Translate the remaining current Esperanto strings</a>. Thanks to xet7.</summary>

Fill 227 English placeholders for attached cards, linked fields, 22 import
formats, member mapping, CSV columns, multiple-board imports and exports,
webhooks, notifications, Wrike workflows, LDAP, Scrum planning and recovery.
The full current Esperanto fill list is empty. Existing translations, exact
placeholders, external menu names and parsed literals are preserved. Recovery
messages distinguish preserving applied changes from permanently deleting a
partial board and its later additions. Longer technical wording remains
provisional pending speaker review.

All 304 translation/Blockly suites, 246 catalog inventories and 21 preservation
checks pass. Three representative Esperanto browser scenarios pass syntax and
discovery; execution remains unverified because the local app and browser
system dependencies are unavailable. The 29,735-value ordinary backlog in
42 locales excludes these pending strings and remains open, along with the
wider semantic audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/306b5dc927">Complete notification time labels in every non-English locale</a>. Thanks to xet7.</summary>

Translate 150 remaining English values in 75 catalogs. Daily send-time and
quiet-hours-end labels now have translations in all 234 non-English locale
paths. Preserve every other value and all English variants. Respect the
legacy Venetian, Veps, Venda, Waray and Walloon tags and Arabic-script Uzbek.
Minority-language phrasing remains provisional; lexical references and
low-confidence languages are recorded in the translation audit and commit.

All 304 translation/Blockly suites, 246 catalog key/token inventories and
21 preservation checks pass. Eight added representative browser cases pass
syntax and discovery checks; execution requires the unavailable local app.
The short-prose queue falls to 1,681 candidates in 183 locales. The wider
29,735-value ordinary backlog, pending feature strings and semantic audit
remain open; this completes only the two time-label keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/065b0e0ec3">Translate short notification time labels across 151 locale paths</a>. Thanks to xet7.</summary>

Translate daily send-time and quiet-hours-end labels in 149 JSON files,
covering 151 locale paths through two existing aliases. Preserve all other
translations and every English variant. These labels identify time inputs,
not message recipients. The two labels remain untranslated in 75 non-English
locale paths, which remain part of the all-language work.

All 304 translation/Blockly suites, 246 catalog key/token inventories and
21 preservation checks pass. Eight representative browser cases pass syntax
and discovery checks; browser execution remains unverified. Regional wording
remains provisional, particularly Amharic, Khmer, Burmese, Malagasy and Uyghur;
lexical references and remaining work are recorded in the translation audit.

</details>

- [The README counts 164 catalogs over 90% translated, after the new English strings](https://github.com/wekan/wekan/commit/93e83ec536).
  Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd14753712">The new import and export strings reach every language file</a>. Thanks to translators and xet7.</summary>

The Transifex pull added the strings of many-board import and export, export all
boards and the people choice to all 243 language files, in English until they
are translated there.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6b936b7dde">Refresh translation coverage after Xhosa fill</a>. Thanks to xet7.</summary>

Update measured README coverage to 191 catalogs and add a full-current-fill
regression gate for Xhosa. All 333 translation-related suites pass; the new gate
passes separately. Refresh TODO counts to 30,443 ordinary untranslated values in
43 languages. Language-quality review and the remaining translation work stay
open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ce7d915850">Complete current Xhosa translation fill</a>. Thanks to xet7.</summary>

Fill the final seven Xhosa import instructions. The current fill list is empty.
Tests preserve header requirements, hierarchy markers and data exclusions. All
three targeted suites and 21 preservation checks pass. Specialized wording needs
speaker review; browser execution and the wider translation backlog remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be4c6e4b7c">Translate Xhosa task and board import instructions</a>. Thanks to xet7.</summary>

Fill nine Xhosa import instructions. Tests retain commands, first-board limits,
completion dates and attachment exclusions. All three targeted suites and 21
preservation checks pass. Seven import instructions remain; specialized wording
needs speaker review and browser execution is outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de41ca91d4">Translate Xhosa outline and planning import instructions</a>. Thanks to xet7.</summary>

Fill eight Xhosa import instructions. Tests preserve commands, field names,
variables and import mappings. All three targeted suites and 21 preservation
checks pass. Sixteen import instructions remain; specialized wording needs
speaker review and browser execution is outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/597a6a5ff4">Complete Xhosa Blockly text and workspace translations</a>. Thanks to xet7.</summary>

Fill the remaining 70 Xhosa Blockly messages. Tests preserve count/search
variables, composed-message whitespace and keyboard labels. Both targeted suites
and all 21 preservation checks pass. Import instructions remain untranslated;
specialized wording needs speaker review and browser execution is outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/200611eaac">Translate Xhosa Blockly shortcuts and text controls</a>. Thanks to xet7.</summary>

Fill 40 Xhosa shortcut and text-control messages. Tests preserve variables,
keyboard labels, indexing direction and copy semantics. Both targeted suites and
all 21 preservation checks pass. Specialized wording needs speaker review;
browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e34dbda38a">Translate Xhosa Blockly accessibility and shortcuts</a>. Thanks to xet7.</summary>

Fill 40 Xhosa procedure-input, accessibility and shortcut messages. Tests
preserve
variables, screen-reader states and navigation distinctions. Both targeted
suites
and all 21 preservation checks pass. Specialized wording needs speaker review;
browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a31bdc1bfe">Translate Xhosa Blockly editor and procedures</a>. Thanks to xet7.</summary>

Fill 35 Xhosa editor and procedure messages. Tests retain keyboard labels,
function variables, output distinctions and placement warnings. Both targeted
suites and all 21 preservation checks pass. Specialized wording needs speaker
review; browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/abbcd6f77d">Translate Xhosa Blockly mathematical functions</a>. Thanks to xet7.</summary>

Fill 30 Xhosa mathematical-function messages. Tests preserve notation, rounding
directions and degrees-versus-radians instructions. Both targeted suites and all
21 preservation checks pass. Specialized wording needs speaker review; browser
execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94d5407ccd">Translate Xhosa Blockly numeric tests and statistics</a>. Thanks to xet7.</summary>

Fill 35 Xhosa numeric and statistics messages. Tests preserve variables, sign
and prime distinctions, and random-number bounds. Both targeted suites and all
21 preservation checks pass. Specialized wording needs speaker review; browser
execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a2c397755">Translate Xhosa Blockly logic and arithmetic</a>. Thanks to xet7.</summary>

Fill 30 Xhosa logic and arithmetic messages. Tests preserve variables,
constants,
coordinate limits and inclusive bounds, and check logical distinctions. Both
targeted suites and all 21 preservation checks pass. Specialized wording needs
speaker review; browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9ad418fd9">Translate Xhosa Blockly list editing and comparisons</a>. Thanks to xet7.</summary>

Fill 35 Xhosa list-editing, sorting and comparison messages. Tests preserve sort
variables, copy semantics and strict versus inclusive comparisons. Both targeted
suites and all 21 preservation checks pass. Specialized wording needs speaker
review; browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b67c91bde5">Translate Xhosa Blockly list retrieval and removal</a>. Thanks to xet7.</summary>

Fill 40 Xhosa list-operation messages. Tests preserve variables, distinguish
retrieval from removal and retain copy semantics. Both targeted suites and all
21 preservation checks pass. Specialized wording needs speaker review; browser
execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/86026ab08e">Translate Xhosa Blockly navigation and list creation</a>. Thanks to xet7.</summary>

Fill 40 Xhosa input, navigation and list creation messages. Tests preserve
keyboard variables, coordinates and empty-list semantics, and check consistent
position labels. Both targeted suites and all 21 preservation checks pass.
Specialized wording needs speaker review; browser execution and remaining
translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a759d0927">Translate Xhosa Blockly input and accessibility labels</a>. Thanks to xet7.</summary>

Fill 40 Xhosa input, keyboard help and accessibility labels. Tests retain
variables and distinguish actions, positions and division operands. Both
targeted
suites and all 21 preservation checks pass. Specialized wording needs speaker
review; browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1210db0bbc">Translate Xhosa Blockly conditions and editor actions</a>. Thanks to xet7.</summary>

Fill 45 Xhosa messages for conditions, loops, editor actions and bitmap labels.
Tests preserve variables and keyboard labels, distinguish conditions and
actions,
and render coordinates and deletion counts. Both targeted suites and all 21
preservation checks pass. Specialized wording needs speaker review; browser
execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59fb4bb980">Translate Xhosa Blockly colors and loop controls</a>. Thanks to xet7.</summary>

Fill 36 Xhosa messages for Blockly and the read-only server setting. Tests
preserve percent variables, keyboard labels, numeric limits and loop
restrictions.
Both targeted suites and all 21 preservation checks pass. Specialized wording
needs speaker review; browser execution and remaining translations are
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c7fad659b">Translate Xhosa interrupted imports and history recovery</a>. Thanks to xet7.</summary>

Fill 35 Xhosa messages for interrupted imports and Scrum history recovery.
Tests preserve variables, render counts and retain deletion and rollback
warnings.
Both targeted suites and all 21 preservation checks pass. Specialized wording
needs speaker review; browser execution and remaining translations are
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84951459e6">Translate Xhosa recovery controls and stuck sync operations</a>. Thanks to xet7.</summary>

Fill 40 Xhosa messages for notification controls and stuck list sync operations.
Tests retain count variables, pause/cancel distinctions, discard consequences
and
record limits. Both targeted suites and all 21 preservation checks pass.
Specialized wording needs speaker review; browser execution and remaining
translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f893a2dce">Translate Xhosa diagnostics and notification failures</a>. Thanks to xet7.</summary>

Fill 35 Xhosa messages for sync diagnostics, Jira estimates, planning and
notification failures. Tests retain null handling, planning restrictions, access
requirements and retry warnings. Both targeted suites and all 21 preservation
checks pass. Specialized wording needs speaker review; browser execution and
remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e925fba96c">Translate Xhosa sync reports and omissions</a>. Thanks to xet7.</summary>

Fill 24 Xhosa messages for omitted fields, source comparisons and recent sync
reports. Tests retain report limits, hidden values and partial-failure warnings.
Both targeted suites and all 21 preservation checks pass. Specialized wording
needs speaker review; browser execution and remaining translations are
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3f641754f">Translate Xhosa sync conflicts and preview actions</a>. Thanks to xet7.</summary>

Fill 20 Xhosa messages. Tests retain preservation guarantees, replacement reuse
and preview prerequisites. Both targeted suites and all 21 preservation checks
pass. Specialized wording needs speaker review; browser execution and remaining
translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/116d2f58b7">Translate Xhosa planning imports and previews</a>. Thanks to xet7.</summary>

Fill 22 Xhosa messages. Tests preserve reference and count variables, preview
rendering and unchanged-card and no-source-write warnings. Both targeted suites
and all 21 preservation checks pass. Specialized wording needs speaker review;
browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7612460d73">Translate Xhosa sprint states and observations</a>. Thanks to xet7.</summary>

Fill 24 Xhosa messages. Tests preserve references, UTC, report limits and
close/cancel behavior. Both targeted suites and all 21 preservation checks pass.
Specialized wording needs speaker review; browser execution and remaining
translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/400fb9e276">Translate Xhosa sprint reports and events</a>. Thanks to xet7.</summary>

Fill 30 Xhosa messages. Tests retain summary variables, keyboard names, unknown
estimates and report comparison restrictions. Both targeted suites and all 21
preservation checks pass. Specialized wording needs speaker review;
browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5ac9ced64">Translate Xhosa planning settings</a>. Thanks to xet7.</summary>

Fill 30 Xhosa planning labels. Tests preserve sprint-action distinctions,
unfinished-work wording and consistent view labels. Both targeted suites and
all 21 preservation checks pass. Specialized terminology needs speaker review;
browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7258355abf">Translate Xhosa board and rule settings</a>. Thanks to xet7.</summary>

Fill 29 Xhosa placeholders. Tests preserve percent and brace variables, URL
examples, LDAP identifiers, permissions and rule-editor restrictions. Both
targeted suites and all 21 preservation checks pass. Specialized wording needs
speaker review; browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2f8c08caa">Complete current Zulu fill and refresh coverage count</a>. Thanks to xet7.</summary>

Translate keyboard labels while retaining key legends, correct the monday.com
possessive and verify both Zulu fill lists are empty. Three targeted suites and
21 preservation checks pass. The broad run found one stale README count among
333 suites; update it to 190 and verify the failing suite passes. Refresh TODO
backlog counts. Language quality, browser review and other locales remain
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/956932e01a">Translate final Zulu import instruction group</a>. Thanks to xet7.</summary>

Fill seven instructions per Zulu catalog. Tests preserve commands, columns,
hierarchy markers, English-header requirements and excluded-data warnings.
All three targeted suites and 21 preservation checks pass. Specialized
terminology
needs speaker review; browser execution and remaining translations are
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2cf65610d4">Translate middle Zulu import instruction group</a>. Thanks to xet7.</summary>

Fill nine instructions per Zulu catalog, preserving commands and formats.
Tests cover first-board selection, archives and attachment exclusions. All three
targeted suites and 21 preservation checks pass. Specialized terminology needs
speaker review; browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3305076c3b">Translate first Zulu import instruction group</a>. Thanks to xet7.</summary>

Fill eight import instructions per Zulu catalog, preserving commands and
formats.
Tests cover completion dates, archived cards and swimlane mapping. All three
targeted suites and 21 preservation checks pass. Specialized terminology needs
speaker review; browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dbb9c5e5b1">Translate Zulu recovery decisions and history checkpoints</a>. Thanks to xet7.</summary>

Fill 22 messages per Zulu catalog. Tests preserve checkpoint variables, deletion
warnings, foreign-board protection, rollback restrictions and read-only
semantics.
Both targeted suites and all 21 preservation checks pass. Specialized
terminology
needs speaker review; browser execution and remaining translations are
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6e019d9299">Translate Zulu interrupted-import messages</a>. Thanks to xet7.</summary>

Fill 25 messages per Zulu catalog. Tests retain count and stage variables,
replayability, applied-change preservation and deletion warnings. Both targeted
suites and all 21 preservation checks pass. Specialized terminology needs
speaker review; browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6dc4df5e0a">Translate Zulu notification controls and stuck sync messages</a>. Thanks to xet7.</summary>

Fill 25 recovery messages per Zulu catalog. Tests preserve progress variables,
cancellation warnings, pending work and already-applied-change guarantees.
Both targeted suites and all 21 preservation checks pass. Specialized
terminology
needs speaker review; browser execution and remaining translations are
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/578a802281">Translate Zulu mail and notification recovery messages</a>. Thanks to xet7.</summary>

Fill 25 messages per Zulu catalog. Tests cover retry warnings, null semantics,
source matching and activity preservation. Both targeted suites and all 21
preservation checks pass. Specialized terminology needs speaker review;
browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e31f01a785">Translate Zulu sync reports and diagnostics</a>. Thanks to xet7.</summary>

Fill 30 messages per Zulu catalog. Tests retain report limits, incomplete-run
warnings, permissions, missing-versus-null semantics and SMTP categories. Both
targeted suites and all 21 preservation checks pass. Specialized terminology
needs speaker review; browser execution and remaining translations are
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd36346f35">Translate Zulu sync recovery and previews</a>. Thanks to xet7.</summary>

Fill 25 messages per Zulu catalog. Tests cover content preservation, unchanged
subcards, replacement reuse and preview limits. Both targeted suites and all
21 preservation checks pass. Specialized terminology needs speaker review;
browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a294e929c6">Translate Zulu planning imports and observations</a>. Thanks to xet7.</summary>

Fill 35 messages per Zulu catalog. Tests preserve variables and report caveats,
render preview counts and check unchanged-card and no-source-write instructions.
Both targeted suites and all 21 preservation checks pass. Specialized
terminology
needs speaker review; browser execution and remaining translations are
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/191406347f">Translate Zulu sprint planning and reports</a>. Thanks to xet7.</summary>

Fill 50 messages per Zulu catalog. Tests preserve summary variables and check
unknown estimates, partial reports, rollover and cancellation behavior. Both
targeted suites and all 21 preservation checks pass. Specialized terminology
needs speaker review; browser execution and remaining translations are
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a5dfe1e3d">Translate Zulu link rules and planning settings</a>. Thanks to xet7.</summary>

Fill 38 application messages per Zulu catalog. Tests preserve brace variables,
URL examples, permissions, conflict instructions and sprint-action distinctions.
Both targeted suites and all 21 preservation checks pass. Specialized
terminology
needs speaker review; browser execution and remaining translations are
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45bc8254f0">Translate Zulu statistics and trigonometry messages</a>. Thanks to xet7.</summary>

Fill 27 mathematical messages per Zulu catalog. Tests preserve function symbols,
coordinate variables, statistical distinctions, logarithm base and angle units.
Both targeted suites and all 21 preservation checks pass. Specialized
terminology
needs speaker review; browser execution and remaining translations are
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1fcaf906cf">Translate Zulu number properties and powers</a>. Thanks to xet7.</summary>

Fill 26 mathematical strings per Zulu catalog, preserving constants and
formulas.
Tests cover parity, rounding directions and sign distinctions. Both targeted
suites and all 21 preservation checks pass. Specialized terminology needs
speaker review; browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e471744e18">Translate Zulu keyboard navigation and screen-reader messages</a>. Thanks to xet7.</summary>

Fill 50 messages per Zulu catalog, preserving shortcut variables. Tests cover
rendered shortcuts, movement directions, cancel/finish and screen-reader
toggles.
Both targeted suites and all 21 preservation checks pass. Specialized
terminology
needs speaker review; browser execution and remaining translations are
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02850b72df">Translate Zulu Blockly input accessibility labels</a>. Thanks to xet7.</summary>

Translate 51 labels per Zulu catalog. Preserve variables and coordinate names.
Tests cover paired input distinctions and rendered input numbers. Both targeted
suites and all 21 preservation checks pass. Specialized terminology needs
speaker review; browser execution and remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/abe868f48b">Translate Zulu variable and workspace messages</a>. Thanks to xet7.</summary>

Fill 58 strings per Zulu catalog. Preserve variables, shortcuts and
joined-phrase
spacing. Tests render variable conflicts and workspace counts and check
consistent
conditional labels. Both targeted suites and all 21 preservation checks pass.
Specialized terminology needs speaker review; browser execution and remaining
translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc86e817ef">Translate Zulu Blockly text operations</a>. Thanks to xet7.</summary>

Fill 55 strings per Zulu catalog. Preserve variables and grammar suffixes.
Tests cover replacement order, trimming direction, text length and missing
matches. Both targeted suites and all 21 preservation checks pass. Specialized
terminology needs speaker review; browser execution and remaining translations
are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca55854277">Translate Zulu Blockly procedure controls</a>. Thanks to xet7.</summary>

Translate 24 strings per Zulu catalog. Check function output, disabled
definitions,
function-only restrictions and rendered variables. The preceding broad run
passed
333 suites; both targeted suites and all 21 preservation checks pass after this
batch. Refresh the TODO backlog counts. Specialized terms need speaker review;
browser execution and the remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/71d5e27802">Translate Zulu Blockly logic and basic arithmetic</a>. Thanks to xet7.</summary>

Fill 59 strings per Zulu catalog, preserving variables and mathematical symbols.
Tests cover logic distinctions, numeric bounds, ternary labels and rendered
substitutions. Both targeted suites and all 21 preservation checks pass.
Specialized terminology needs speaker review; browser execution and remaining
translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab1a7a8171">Translate Zulu Blockly list operations</a>. Thanks to xet7.</summary>

Fill 75 list-operation strings in each Zulu catalog. Preserve numbered variables
and configuration values. Tests cover retrieval/removal distinctions, sorting
and rendered substitutions. Both targeted suites and all 21 preservation checks
pass. Specialized terminology needs speaker review; browser execution and the
remaining translations are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ccd6277314">Translate Zulu Blockly editor and accessibility labels</a>. Thanks to xet7.</summary>

Translate 50 more strings in each Zulu catalog, preserving percent variables.
Tests cover rendered deletion confirmations, bitmap coordinates and true/false
loop conditions. Both targeted suites and all 21 preservation checks pass.
Specialized terminology needs speaker review; browser execution and the wider
translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0774342c12">Translate Zulu board settings and Blockly controls</a>. Thanks to xet7.</summary>

Fill 52 English strings in each of zu and zu-ZA, preserving variables and LDAP
setting names. Regression checks cover rendered substitutions, permission and
loop restrictions, and RGB bounds. Both targeted suites and all 21 preservation
checks pass. Specialized programming terminology is low confidence and needs
speaker review; browser execution and the remaining translations are
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4bf0f430d2">Translate Albanian import instructions</a>. Thanks to xet7.</summary>

Translate all 21 newer import instructions, preserving commands, column names,
extensions, hierarchy markers and variables. Regression checks cover excluded
data, first-board selection, completion dates and task hierarchy. Import and
whole-catalog placeholder suites and all 21 preservation checks pass. The
current
Albanian fill list is empty; language auditing, browser review and the wider
translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62f3021f5a">Translate remaining Afrikaans import instructions</a>. Thanks to xet7.</summary>

Translate Quire, Wrike, Teamwork.com, Businessmap, Redmine, Notion and Plane
instructions, completing the newer group of 21. Preserve commands, column names,
extensions, hierarchy markers and variables. Regression checks cover excluded
data, English headers and task hierarchy. Import and placeholder suites and all
21 preservation checks pass. The current fill list is empty; language quality,
browser review and the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/13b1df58cc">Translate six further Afrikaans import instructions</a>. Thanks to xet7.</summary>

Translate instructions for Pivotal Tracker, Tasks.org, monday.com, Super
Productivity, Taiga and Vikunja. Preserve commands, extensions and variables.
Regression checks cover excluded attachments, completion dates, comments and
archives. Import and placeholder suites and all 21 preservation checks pass.
Remaining translations, language auditing and browser review are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c1e84323f">Translate first Afrikaans import instruction group</a>. Thanks to xet7.</summary>

Translate eight instructions while preserving commands, extensions and
variables.
Regression checks cover completion, archives, first-board selection and
swimlanes.
The broad run after Galician corrections passed all 333 translation-related
suites;
import and whole-catalog placeholder checks pass after this Afrikaans batch.
Preservation checks pass. Remaining translations, language auditing and browser
review are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/35a643cb6e">Translate Galician interrupted-import and history recovery</a>. Thanks to xet7.</summary>

Translate 68 values across two catalogs for interrupted imports, Scrum history
recovery and server-only login settings. Preserve counters and reference
variables.
Regression checks cover permanent deletion, non-destructive keep, foreign-board
preservation, conflict blocking and rollback restrictions. Both relevant suites
and all 21 preservation checks pass. Both current fill lists are empty; language
auditing, browser review and the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19b1c2d879">Translate Galician synchronization recovery</a>. Thanks to xet7.</summary>

Translate 42 values across two catalogs for stalled-sync explanations, reasons,
counters and controls. Preserve exact variables. Regression checks cover
retained
applied changes, unwritten pending changes, access loss and discard
restrictions.
Both relevant suites and all 21 preservation checks pass. Remaining
translations,
language auditing and browser review are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2e922f7828">Translate Galician planning results</a>. Thanks to xet7.</summary>

Translate 34 values across two catalogs for Scrum import results, reference
warnings, planning synchronization and the stalled-sync heading. Preserve
counters
and reference variables. Regression checks cover invalid JSON, unchanged cards,
source matching and first-sync behavior. Both relevant suites and all 21
preservation checks pass. Remaining translations, language auditing and browser
review are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1643efb120">Translate Galician settings and planning controls</a>. Thanks to xet7.</summary>

Translate 40 values across two catalogs for link rules, read-only fields,
automation, LDAP, provider restrictions and initial Scrum import controls.
Preserve variables, link syntax and configuration names. Regression checks cover
access restrictions, import behavior and empty domain settings. Both relevant
suites and all 21 preservation checks pass. Remaining translations, language
auditing and browser review are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f28e0ee74d">Translate remaining Galician import instructions</a>. Thanks to xet7.</summary>

Translate 14 values across two catalogs for Quire, Wrike, Teamwork.com,
Businessmap, Redmine, Notion and Plane, completing the newer group of 21
imports.
Preserve commands, columns, extensions, hierarchy markers and variables.
Regression
checks cover excluded data, English headers and task hierarchy. Three relevant
suites and all 21 preservation checks pass. Remaining translations, language
auditing and browser review are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37efcb8f8b">Translate six further Galician import instructions</a>. Thanks to xet7.</summary>

Translate 12 values across two catalogs for Pivotal Tracker, Tasks.org,
monday.com,
Super Productivity, Taiga and Vikunja. Preserve commands, extensions and
variables.
Regression checks cover excluded attachments, completion dates, comments,
archives
and sprints. Three relevant suites and all 21 preservation checks pass.
Remaining
translations, language auditing and browser review are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/877eca8186">Correct shared mixed-language Galician terminology</a>. Thanks to xet7.</summary>

Correct 106 values across both Galician catalogs for activity, Home, card
actions,
Trello, automation and loading. Record audited corrections and preserve
variables.
Restore the single-board Home limit and remove an unsupported loading-default
claim. Three relevant suites and all 21 preservation checks pass. Further
language
auditing, remaining translations and browser review are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e3209d27f">Correct further Portuguese terminology in Galician regional strings</a>. Thanks to xet7.</summary>

Replace 93 Portuguese values with reviewed Galician wording for board/card
actions, search, automation, accounts and migration controls. Record audited
corrections and preserve exact variables. Regression checks cover native terms,
action direction, completion states and password mismatch. Three relevant suites
and all 21 preservation checks pass. Further corrections, remaining translations
and browser review are outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd6bd0df11">Correct Portuguese labels in the Galician regional catalog</a>. Thanks to xet7.</summary>

Replace 33 Portuguese labels and messages with reviewed Galician wording for
board and card controls, archives, exports and password reset. Record each
change
in the audited correction ledger. Regression checks reject Portuguese wording
and preserve exact variables. Three relevant suites and all 21 preservation
checks pass. Further language corrections, translations and browser review
remain
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/521cb051f5">Translate Galician announcements and initial imports</a>. Thanks to xet7.</summary>

Translate 28 values across two catalogs for announcements, list colors, outline
imports and eight newer import instructions. Preserve commands, format keywords,
extensions and variables. Regression checks cover hierarchy, completion,
first-board selection, archives and swimlane mappings. Three relevant suites and
all 21 preservation checks pass. Remaining translations, wrong-language regional
labels and browser review remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e65c495bc9">Translate Catalan and Valencian recovery results</a>. Thanks to xet7.</summary>

Translate 84 values across three catalogs for interrupted-import results, Scrum
history recovery and server-only login settings. Preserve counters, references
and regional wording. Regression checks cover keep and discard warnings,
foreign-board preservation, conflict blocking and rollback restrictions. Four
relevant suites and all 21 preservation checks pass. All three current fill
lists
are empty; browser review and the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c491f18bb">Translate Catalan and Valencian recovery controls</a>. Thanks to xet7.</summary>

Translate 66 values across three catalogs for stalled-sync reasons and controls
and the interrupted-import explanation. Preserve variables and regional wording.
Regression checks cover access and discard restrictions, retained applied
changes,
unwritten pending changes and deletion of partial boards including later
additions.
Four relevant suites and all 21 preservation checks pass. Browser review and the
wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/47b7094306">Translate Catalan and Valencian planning results</a>. Thanks to xet7.</summary>

Translate 60 values across three catalogs for Scrum import results, reference
warnings, planning synchronization and initial stalled-sync recovery text.
Preserve counters and reference variables. Regression checks cover matching,
unchanged cards, first-sync behavior and applied versus pending changes. Four
relevant suites and all 21 preservation checks pass. Browser review and the
wider
translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dca5008ba9">Translate Catalan and Valencian settings and planning</a>. Thanks to xet7.</summary>

Translate 75 values across three catalogs for board settings, link rules,
automation, LDAP, provider restrictions and initial Scrum import controls.
Preserve variables, link syntax and configuration names. Regression checks cover
access restrictions, import behavior and empty domain settings. Four relevant
suites and all 21 preservation checks pass. Browser review and the wider
translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/72f614759f">Translate Catalan and Valencian outline imports</a>. Thanks to xet7.</summary>

Translate OPML, Org mode and Todoist instructions in three catalogs, replacing
nine English values. Preserve format keywords, commands, variables, label syntax
and priority identifiers. Regression checks cover completion, hierarchy,
subtasks
and note-to-comment mapping. Import and placeholder suites and all 21
preservation
checks pass. Browser review and the wider translation backlog remain
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a54cfdb01">Translate remaining Catalan and Valencian import instructions</a>. Thanks to xet7.</summary>

Translate the remaining 13 instructions in three catalogs, replacing 39 English
values and completing this group of 21. Preserve commands, column names,
extensions, hierarchy markers, variables and regional wording. Regression checks
cover excluded data, English headers, task hierarchy and archives. Import and
placeholder suites and all 21 preservation checks pass. Older import
instructions,
browser review and the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22c4f03f82">Translate first Catalan and Valencian import instructions</a>. Thanks to xet7.</summary>

Translate eight instructions in three catalogs, replacing 24 English values.
Preserve commands, extensions, variables and regional wording. Regression checks
cover first-board selection, completion dates, archives and swimlane mappings.
Import and placeholder suites and all 21 preservation checks pass. Remaining
instructions, browser review and the wider translation backlog remain
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/260875da30">Translate remaining Russian import instructions</a>. Thanks to xet7.</summary>

Translate the remaining 13 instructions across four Russian locale paths,
replacing 39 stored English values and completing this group of 21. Preserve the
shared alias, commands, column names, extensions, hierarchy markers and
variables.
Regression checks cover excluded data, English headers, task hierarchy and
archives. Import and placeholder suites and all 21 preservation checks pass.
Browser review and the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd9084b716">Translate first Russian import instruction group</a>. Thanks to xet7.</summary>

Translate eight instructions across four Russian locale paths, replacing 24
stored English values and preserving the shared catalog alias. Preserve
commands,
extensions and variables. Regression checks cover first-board selection,
completion dates, archives and swimlane mappings. Import and placeholder suites
and all 21 preservation checks pass. Remaining instructions, browser review and
the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dee430763a">Fill Ukrainian regional planning and recovery translations</a>. Thanks to xet7.</summary>

Fill 94 English regional values using reviewed Ukrainian translations for board
settings, automation, LDAP, Scrum planning and recovery. Preserve existing
regional
translations, variables, configuration names and link-rule examples. Regional
regression checks cover recovery consequences and restrictions. Four relevant
suites and all 21 preservation checks pass. Browser review and the wider
translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2e49f8871">Translate Ukrainian regional outline import instructions</a>. Thanks to xet7.</summary>

Fill the remaining OPML, Org mode and Todoist instructions in uk-UA using the
existing Ukrainian translations, preserving commands, variables and format
names.
Regression checks cover hierarchy, completion and note-to-comment mappings.
All 333 translation-related suites pass in 128 seconds, and all 21 preservation
checks pass. Both Ukrainian catalogs have no exact English import instructions;
the wider translation backlog and browser review remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b0f492ce1e">Translate remaining Ukrainian import instructions</a>. Thanks to xet7.</summary>

Translate the remaining 13 instructions in both Ukrainian catalogs, replacing
26 English values and completing all 21 in this group. Preserve commands, column
names, extensions, hierarchy markers and variables. Regression checks cover
excluded data, English headers, task hierarchy and archived tasks. Import and
placeholder suites and all 21 preservation checks pass. Browser review and the
wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3d66f4688">Translate first Ukrainian import instruction group</a>. Thanks to xet7.</summary>

Translate eight instructions in both Ukrainian catalogs, replacing 16 English
values. Preserve commands, extensions and variables. Regression checks cover
first-board selection, completed-task dates, archives and swimlane mappings.
Import-instruction and placeholder suites and all 21 preservation checks pass.
The remaining instructions, browser review and the wider translation backlog
remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d82b3b812">Translate Lithuanian import instructions</a>. Thanks to xet7.</summary>

Translate all 21 Lithuanian instructions in this import group. Preserve
commands,
column names, extensions, hierarchy markers and variables. Regression checks
cover first-board selection, completed-task dates, archives, swimlane mappings,
excluded data, English headers and task hierarchy. Import-instruction and
placeholder suites and all 21 preservation checks pass. Browser review and the
wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18b30dea23">Translate Latvian import instructions</a>. Thanks to xet7.</summary>

Translate all 21 Latvian instructions in this import group. Preserve commands,
column names, extensions, hierarchy markers and variables. Regression checks
cover first-board selection, completed-task dates, archives, swimlane mappings,
excluded data, English headers and task hierarchy. Import-instruction and
placeholder suites and all 21 preservation checks pass. Browser review and the
wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6f202a2b8">Translate Estonian import instructions</a>. Thanks to xet7.</summary>

Translate all 21 Estonian instructions in this import group. Preserve commands,
column names, extensions, hierarchy markers and variables. Regression checks
cover first-board selection, completed-task dates, archives, swimlane mappings,
excluded data, English headers and task hierarchy. Import-instruction and
placeholder suites and all 21 preservation checks pass. Browser review and the
wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/848345e329">Translate remaining Bosnian import instructions</a>. Thanks to xet7.</summary>

Translate the remaining 13 Bosnian import instructions, completing all 21 in
this group. Preserve commands, column names, extensions, hierarchy markers and
variables. Regression checks cover excluded data, English headers, task
hierarchy
and archived tasks. Import-instruction and placeholder suites and all 21
translation-preservation checks pass. Browser review and the wider translation
backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/515b7d85ed">Translate first Bosnian import instructions</a>. Thanks to xet7.</summary>

Translate eight Bosnian import instructions, preserving commands, extensions and
variables. Regression checks cover first-board selection, completion dates,
archived cards and swimlane mappings. Translation, placeholder and preservation
checks pass; remaining Bosnian instructions, browser review and the wider
translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2fda0df675">Translate remaining Serbian import instructions</a>. Thanks to xet7.</summary>

Translate the remaining 13 Serbian instructions in Cyrillic, completing all 21
import instructions there. Preserve commands, columns, variables and import
limitations. Regression checks cover excluded data, English headers, hierarchy
and archived tasks. Translation, placeholder and preservation checks pass;
browser
review and the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5307ed5d7">Translate first Serbian import instructions</a>. Thanks to xet7.</summary>

Translate eight Serbian import instructions in Cyrillic, preserving commands,
extensions and variables. Regression checks cover first-board selection,
completion
dates, archived cards and swimlane mappings. Translation, placeholder and
preservation checks pass; remaining Serbian instructions, browser review and the
wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5402befdc6">Translate remaining Slovenian import instructions</a>. Thanks to xet7.</summary>

Translate the remaining 13 instructions in both Slovenian catalogs, completing
all
21 import instructions there. Preserve commands, columns, variables and import
limitations. Regression checks cover excluded data, English headers, hierarchy
and archived tasks. Translation, placeholder and preservation checks pass;
browser
review and the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bafb8ec764">Translate first Slovenian import instructions</a>. Thanks to xet7.</summary>

Translate eight import instructions in both Slovenian catalogs, preserving
commands, extensions and variables. Regression checks cover first-board
selection,
completion dates, archived cards and swimlane mappings. Translation, placeholder
and preservation checks pass; remaining Slovenian instructions, browser review
and
the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8484038c8c">Translate Croatian import instructions</a>. Thanks to xet7.</summary>

Translate 21 Croatian import instructions, preserving commands, columns,
variables
and import limitations. Regression checks cover first-board selection,
completion
dates, excluded data, English headers, hierarchy and archived cards. Focused
checks
and the broader selection of 333 translation suites pass. The refreshed audit
records the remaining translation backlog; browser review remains outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f92c673b11">Translate remaining Bulgarian import instructions</a>. Thanks to xet7.</summary>

Translate the remaining 13 Bulgarian instructions, completing all 21 import
instructions there. Preserve commands, columns, variables and import
limitations.
Regression checks cover excluded data, English headers, hierarchy and archived
tasks. Translation, placeholder, completion and preservation checks pass;
browser
review and the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/28c73fbedd">Translate first Bulgarian import instructions</a>. Thanks to xet7.</summary>

Translate eight Bulgarian import instructions, preserving commands, extensions
and
variables. Regression checks cover first-board selection, completion dates,
archived cards and swimlane mappings. Translation, placeholder, completion and
preservation checks pass; remaining Bulgarian instructions, browser review and
the
wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0310aaa4b">Translate remaining Vietnamese import instructions</a>. Thanks to xet7.</summary>

Translate the remaining 13 instructions in both Vietnamese catalogs, completing
all 21 import instructions there. Preserve commands, columns, variables and
import
limitations. Regression checks cover excluded data, English headers, hierarchy
and
archived tasks. Translation, placeholder, completion and preservation checks
pass;
browser review and the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9331c78da8">Translate first Vietnamese import instructions</a>. Thanks to xet7.</summary>

Translate eight instructions in both Vietnamese catalogs, preserving commands,
extensions and variables. Regression checks cover first-board selection,
completion
dates, archived cards and swimlane mappings. Translation, placeholder,
completion
and preservation checks pass; remaining Vietnamese instructions, browser review
and the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be9c5be485">Translate remaining Malay import instructions</a>. Thanks to xet7.</summary>

Translate the remaining 13 instructions in both Malay catalogs, completing all
21 import instructions there. Preserve commands, columns, variables and import
limitations. Regression checks cover excluded data, English headers, hierarchy
and archived tasks. Translation, placeholder and preservation checks pass;
browser
review and the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bebeec9b39">Translate first Malay import instructions</a>. Thanks to xet7.</summary>

Translate eight import instructions in both Malay catalogs, preserving commands,
extensions and variables. Regression checks cover first-board selection,
completion
dates, archived cards and swimlane mappings. Translation, placeholder and
preservation checks pass; remaining Malay instructions, browser review and the
wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/42d5d92611">Translate remaining Indonesian import instructions</a>. Thanks to xet7.</summary>

Translate the remaining 13 Indonesian instructions, completing all 21 import
instructions there. Preserve commands, columns, variables and import
limitations.
Regression checks cover excluded data, English headers, hierarchy and archived
tasks. Translation, placeholder and preservation checks pass; browser review and
the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e23797cecf">Translate first Indonesian import instructions</a>. Thanks to xet7.</summary>

Translate eight Indonesian import instructions, preserving commands, extensions
and variables. Regression checks cover first-board selection, completion dates,
archived cards and swimlane mappings. Translation, placeholder and preservation
checks pass; remaining Indonesian instructions, browser review and the wider
translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/712b45a103">Translate remaining Korean import instructions</a>. Thanks to xet7.</summary>

Translate the remaining 13 instructions in both Korean catalogs, completing all
21 import instructions there. Preserve commands, columns, variables and import
limitations. Regression checks cover excluded data, English headers, hierarchy
and archived tasks. Translation, placeholder and preservation checks pass;
browser
review and the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8673bef810">Translate first Korean import instructions</a>. Thanks to xet7.</summary>

Translate eight import instructions in both Korean catalogs, preserving
commands,
extensions and variables. Regression checks cover first-board selection,
completion
dates, archived cards and swimlane mappings. Translation, placeholder and
preservation checks pass; remaining Korean instructions, browser review and the
wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7ca8c0f12d">Translate remaining Hiragana import instructions</a>. Thanks to xet7.</summary>

Translate the remaining 13 instructions in ja-HI, completing all 21 import
instructions there. Preserve commands, columns, variables and import
limitations.
Regression checks enforce Hiragana prose and cover excluded data, English
headers,
hierarchy and archived tasks. Translation, placeholder and preservation checks
pass; browser review and the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1e2652cf8">Translate first Hiragana import instructions</a>. Thanks to xet7.</summary>

Translate eight instructions in ja-HI, preserving commands, extensions and
variables. Regression checks enforce Hiragana prose and cover first-board
selection, completion dates and archived cards. Translation, placeholder and
preservation checks pass; remaining Hiragana instructions, browser review and
the
wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80b30b3b13">Translate remaining Japanese import instructions</a>. Thanks to xet7.</summary>

Translate the remaining 13 instructions in ja and ja-JP, completing all 21
import
instructions there. Preserve commands, columns, variables and import
limitations.
Regression checks cover excluded data, English headers, hierarchy and archived
tasks. Translation, placeholder and preservation checks pass; Hiragana wording,
browser review and the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c2bbe874c">Translate first Japanese import instructions</a>. Thanks to xet7.</summary>

Translate eight instructions in ja and ja-JP, preserving commands, extensions
and
variables. Regression checks cover first-board selection, completion dates,
archived cards and swimlane mappings. Translation, placeholder and preservation
checks pass; remaining Japanese instructions, Hiragana wording, browser review
and
the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c09588c385">Translate remaining Greek import instructions</a>. Thanks to xet7.</summary>

Translate the remaining 13 import instructions in both Greek catalogs,
completing
all 21 instructions there. Preserve commands, columns, variables and import
limitations. Regression checks cover excluded data, English headers, hierarchy
and archived tasks. Translation, placeholder and preservation checks pass;
browser
review and the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49e95666ee">Translate first Greek import instructions</a>. Thanks to xet7.</summary>

Translate eight import instructions in both Greek catalogs, preserving commands,
extensions and variables. Regression checks cover first-board selection,
completion
dates, archived cards and swimlane mappings. Translation, placeholder and
preservation checks pass; remaining Greek instructions, browser review and the
wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4399632332">Translate Turkish import instructions</a>. Thanks to xet7.</summary>

Translate 21 Turkish import instructions, preserving commands, column names,
variables and import limitations. Regression checks cover first-board selection,
excluded data, English headers, completion dates and archived tasks.
Translation,
placeholder and preservation checks pass; browser review and the wider
translation
backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f76a63197c">Translate Hungarian import instructions</a>. Thanks to xet7.</summary>

Translate 21 Hungarian import instructions, preserving commands, column names,
variables and import limitations. Regression checks cover first-board selection,
excluded data, English headers, completion dates and archived tasks.
Translation,
placeholder and preservation checks pass; browser review and the wider
translation
backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/617e347ebe">Translate Romanian import instructions</a>. Thanks to xet7.</summary>

Translate 21 import instructions in both Romanian catalogs, preserving commands,
column names, variables and import limitations. Regression checks cover
first-board
selection, excluded data, English headers, completion dates and archived tasks.
Translation, placeholder and preservation checks pass; browser review and the
wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2bc47e2d02">Translate Slovak import instructions</a>. Thanks to xet7.</summary>

Translate 21 Slovak import instructions, preserving commands, column names,
variables and import limitations. Regression checks cover first-board selection,
excluded data, English headers, completion dates and archived tasks.
Translation,
placeholder and preservation checks pass; browser review and the wider
translation
backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e71fa762a1">Translate Czech import instructions</a>. Thanks to xet7.</summary>

Translate 21 import instructions in both Czech catalogs, preserving commands,
column names, variables and import limitations. Regression checks cover
first-board
selection, excluded data, English headers, completion dates and archived tasks.
Translation, placeholder and preservation checks pass; browser review and the
wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5256aa752d">Translate Polish import instructions</a>. Thanks to xet7.</summary>

Translate 21 import instructions in both Polish catalogs, preserving commands,
column names, variables and import limitations. Regression checks cover
first-board
selection, excluded data, English headers, completion dates and archived tasks.
Translation, placeholder and preservation checks pass; browser review and the
wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f308b39b22">Translate Norwegian Bokmål import instructions</a>. Thanks to xet7.</summary>

Translate 21 Norwegian Bokmål import instructions, preserving literal commands,
column names, variables and import limitations. Regression checks cover
first-board
selection, excluded data, English headers, completion dates and archived tasks.
Translation, placeholder and preservation checks pass; browser review and the
wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62761d0b72">Translate Danish import instructions</a>. Thanks to xet7.</summary>

Translate 21 Danish import instructions, preserving literal commands, column
names,
variables and import limitations. Regression checks cover first-board selection,
excluded data, English headers, completion dates and archived tasks.
Translation,
placeholder and preservation checks pass; browser review and the wider
translation
backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c701c44abf">Translate Swedish import instructions</a>. Thanks to xet7.</summary>

Translate 21 Swedish import instructions while preserving commands, column
names,
variables and import limitations. Regression checks cover first-board selection,
excluded data, English headers, completion dates and archived tasks.
Translation,
placeholder and preservation checks pass; browser review and the wider
translation
backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f73ae5a179">Translate Dutch import instructions</a>. Thanks to xet7.</summary>

Translate 21 import instructions in both Dutch catalogs, preserving literal
commands, variables, column names and import limitations. Regression coverage
checks first-board selection, excluded data, English headers, completed-task
dates
and archived tasks. Translation, placeholder and preservation checks pass;
browser
review and the wider translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b2c47268a">Translate Italian import instructions</a>. Thanks to xet7.</summary>

Translate all 21 Italian import instructions, preserving commands, column names,
extensions, hierarchy markers and variables. Regression checks cover first-board
selection, excluded data, English headers and archived tasks. Translation and
placeholder suites pass; browser review and the wider translation backlog remain
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a846a7961f">Finish import instructions in four Portuguese catalogs</a>. Thanks to xet7.</summary>

Translate 52 more values, completing all 21 import instructions in these
catalogs.
Preserve regional terms, commands, columns, extensions and hierarchy markers;
check excluded data, English headers and archived tasks. Import-instruction and
placeholder suites and all 21 preservation checks pass. The wider backlog
remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/69f5721790">Translate eight import instructions in four Portuguese catalogs</a>. Thanks to xet7.</summary>

Fill 32 values with regional terminology and preserved commands, extensions and
variables. Check first-board selection, completion dates and archived cards.
Import-instruction and placeholder suites and all 21 preservation checks pass.
The remaining Portuguese instructions and wider translation backlog remain
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/771127e70b">Finish import instructions in nine Spanish catalogs</a>. Thanks to xet7.</summary>

Translate 117 more values, completing all 21 import instructions in these
catalogs.
Preserve commands, columns, extensions and hierarchy markers; check excluded
data,
English header requirements and archived tasks. Import-instruction and
placeholder
suites and all 21 preservation checks pass. The wider translation backlog
remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6de5319b8b">Translate eight import instructions in nine Spanish catalogs</a>. Thanks to xet7.</summary>

Fill 72 values with preserved commands, extensions and variables. Regression
checks
cover first-board selection, completion dates, archived cards and import
mappings.
Import-instruction and placeholder suites and all 21 preservation checks pass.
The remaining Spanish instructions and wider translation backlog remain
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7d52e278f3">Finish import instructions in five French catalogs</a>. Thanks to xet7.</summary>

Translate 65 more values, completing all 21 import instructions in these
catalogs.
Preserve commands, columns, extensions and hierarchy markers; check excluded
data,
English header requirements and archived tasks. Import-instruction and
placeholder
suites and all 21 preservation checks pass. The wider translation backlog
remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/034eea1a80">Translate eight import instructions in five French catalogs</a>. Thanks to xet7.</summary>

Fill 40 values while preserving product commands, extensions and variables.
Regression checks cover first-board selection, archived cards and completion
dates.
Import-instruction and placeholder suites and all 21 preservation checks pass.
The remaining French import instructions and wider translation backlog remain
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cafca6bf33">Translate 21 import instructions in four German catalogs</a>. Thanks to xet7.</summary>

Fill 84 values while preserving product commands, extensions, columns and
hierarchy
markers. Regression checks cover variables, first-board selection, archived and
completed tasks and excluded data. Import-instruction and placeholder suites and
all 21 preservation checks pass. The wider translation backlog remains
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/260b4946e6">Translate Cherokee warning and verify every non-English warning catalog</a>. Thanks to xet7.</summary>

Finish the remaining English sign-in warning and discover all 234 non-English
catalog paths in its regression test. Reject missing and empty values, and check
exact variables, address roles, ROOT_URL and substitution. Warning and
placeholder
suites and all 21 preservation checks pass. Cherokee prose has low confidence
and
needs native review. The wider translation backlog remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/204bb32c1d">Translate Tamazight and Inuktitut sign-in warnings</a>. Thanks to xet7.</summary>

Preserve address variables and ROOT_URL, with checks for Tifinagh and Canadian
Aboriginal syllabics. Warning coverage includes 206 paths; warning and
placeholder
suites and all 21 preservation checks pass. These translations have lower
confidence
and need native review. The Cherokee warning and wider translation backlog
remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8fc5a2b440">Translate Tigre and Wolaytta warnings and correct three Wolaytta labels</a>. Thanks to xet7.</summary>

Preserve address variables and ROOT_URL in two warnings and replace three
prefixed
English labels. Warning coverage includes 204 paths; warning, placeholder and
correction-ledger suites and all 21 preservation checks pass. These translations
have low confidence and need native review. Three English warning paths and the
wider translation backlog remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d4e5fd2dc">Translate Greenlandic and Nahuatl warnings and verify translation regressions</a>. Thanks to xet7.</summary>

Preserve repeated address variables and ROOT_URL in two warnings. Warning
coverage
includes 202 paths. All 333 selected translation-related Node suites and all 21
preservation checks pass. These translations have lower confidence and need
native
review. Five English warning paths and the wider translation backlog remain
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3faee05c50">Translate Veps, Volapük and Klingon sign-in warnings</a>. Thanks to xet7.</summary>

Preserve repeated address variables and ROOT_URL in three warnings. Warning
coverage includes 200 catalog paths. Warning and placeholder suites and all 21
preservation checks pass. These translations have lower confidence and need
native
review. Seven English warning paths and the wider translation backlog remain
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9df171db32">Translate Arabic-script Uzbek and Kashmiri warnings and correct three Uzbek labels</a>. Thanks to xet7.</summary>

Preserve address variables and ROOT_URL in two warnings, and replace
Latin-script
text in three Arabic-script Uzbek labels. Warning coverage includes 197 paths;
warning, placeholder and correction-ledger suites and all 21 preservation checks
pass. These translations have lower confidence and need native review. Ten
English
warning paths and the wider translation backlog remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7acb9ad77f">Translate Tibetan, Dzongkha and Tigrinya sign-in warnings</a>. Thanks to xet7.</summary>

Preserve repeated address variables and ROOT_URL in three warnings, with
separate
Tibetan and Dzongkha prose. Warning coverage includes 195 catalog paths. Warning
and placeholder suites and all 21 preservation checks pass. These translations
have lower confidence and need native review. There are 12 English warning paths
and a wider unfinished translation backlog.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efb1c9a7e4">Translate Bambara, Ewe and Fulah sign-in warnings</a>. Thanks to xet7.</summary>

Preserve repeated address variables and ROOT_URL in three warnings. Warning
coverage includes 192 catalog paths. Warning and placeholder suites and all 21
preservation checks pass. These translations have lower confidence and need
native
review. There are 15 English warning paths and a wider unfinished translation
backlog.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1dbf7a2f2e">Translate Acehnese, Aymara, Guarani and Quechua warnings and correct five labels</a>. Thanks to xet7.</summary>

Preserve repeated address variables and ROOT_URL in four warnings. Remove
language
prefixes and English text from five Aymara/Quechua labels. Warning coverage
includes
189 paths; warning, placeholder and correction-ledger suites and all 21
preservation
checks pass. These translations have lower confidence and need native review.
There are 18 English warning paths and a wider unfinished translation backlog.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4fd868561d">Translate Buryat, Chuvash and Sakha sign-in warnings</a>. Thanks to xet7.</summary>

Preserve repeated address variables and ROOT_URL in three more warnings. Warning
coverage includes 185 catalog paths. Warning and placeholder suites and all 21
preservation checks pass. These translations have lower confidence and need
native
review. There are 22 English warning paths and a wider unfinished translation
backlog.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ecb67d1a0">Translate Oromo, Luganda, Wolof and Akan sign-in warnings</a>. Thanks to xet7.</summary>

Preserve repeated address variables and ROOT_URL in four more warnings. Warning
coverage includes 182 catalog paths. Warning and placeholder suites and all 21
preservation checks pass. These translations have lower confidence and need
native
review. There are 25 English warning paths and a wider unfinished translation
backlog.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7b76269efa">Translate Flemish, Northern Sámi, Manx and Cornish sign-in warnings</a>. Thanks to xet7.</summary>

Preserve address variables and ROOT_URL in four more warnings. Warning coverage
includes 178 catalog paths. Warning and placeholder suites and all 21
preservation
checks pass. Northern Sámi, Manx and Cornish prose has lower confidence and
needs
native review. There are 29 English warning paths and a wider unfinished
translation
backlog; browser review has not been run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f47eebcc4">Translate sign-in warnings in Moroccan Arabic, Hiragana, Walloon, Waray and Venetian</a>. Thanks to xet7.</summary>

Preserve both address variables and ROOT_URL in five more warnings, using the
registered languages of legacy locale identifiers. Warning coverage includes 174
catalog paths and checks Hiragana script. Warning and placeholder suites and all
21 preservation checks pass. These translations have lower confidence and need
native review; 33 warning paths and the wider translation backlog remain
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efcdceb0b2">Translate southern African warnings and correct the Venda sign-in label</a>. Thanks to xet7.</summary>

Add Northern Sotho, Ndebele, Swati, Tsonga and Venda warnings. Replace the Zulu
login label in Venda and preserve the distinct Venetian and Veps catalogs.
Warning tests now cover 169 paths. Warning, placeholder and audited-correction
suites and all 21 preservation checks pass. The prose has lower confidence and
needs native review. This warning still has 38 English paths; browser review
and the wider all-language backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab218dc5ce">Translate five Pacific sign-in warnings</a>. Thanks to xet7.</summary>

Add Māori, Hawaiian, Samoan, Tongan and Fijian warning translations.
Tests now cover 164 paths, checking repeated variables, address order and
ROOT_URL.
Warning and placeholder suites and all 21 preservation checks pass. Hawaiian,
Samoan, Tongan and Fijian prose has lower confidence and needs native review.
This warning still has 43 English paths; browser review and the wider backlog
remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5cfd2010f8">Correct Aromanian and Latin sign-in labels</a>. Thanks to xet7.</summary>

Replace French “Connexion” with Aromanian “Intrari” and remove the “Latine:”
prefix from the Latin label. Record both corrections in the audit ledger.
The warning and audited-correction suites pass, including token preservation,
key order and protection of newer translations.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2c52f5efd">Translate five Romance and Latin sign-in warnings</a>. Thanks to xet7.</summary>

Add Friulian, Romansh, Ladin, Aromanian and Latin warning translations.
Tests now cover 159 paths, checking repeated variables, address order and
ROOT_URL.
Warning and placeholder suites and all 21 preservation checks pass. These
translations have lower confidence and need native review. This warning still
has 48 English catalog paths; browser review and the wider backlog remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50d9ba91ad">Translate five additional Indic sign-in warnings</a>. Thanks to xet7.</summary>

Add Assamese, Odia, Maithili, Bhojpuri and Konkani warning translations.
Tests now cover 154 paths, checking repeated variables, address order and
ROOT_URL.
Warning and placeholder suites and all 21 preservation checks pass. These
translations have lower confidence and need native review. This warning still
has 53 English catalog paths; browser review and the wider backlog remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ae7e40076">Translate five regional European sign-in warnings</a>. Thanks to xet7.</summary>

Add Breton, Kashubian, Upper Sorbian, Silesian and Faroese warning translations.
Tests now cover 149 paths, checking repeated variables, address order and
ROOT_URL.
Warning and placeholder suites and all 21 preservation checks pass. These
translations have lower confidence and need native review. This warning still
has 58 English catalog paths; browser review and the wider backlog remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/28c61baefc">Translate regional Romance sign-in warnings</a>. Thanks to xet7.</summary>

Add Aragonese, Asturian, Sardinian, Sicilian and Neapolitan warning
translations.
Tests now cover 144 paths, checking repeated variables, address order and
ROOT_URL.
Warning and placeholder suites and all 21 preservation checks pass. These
translations have lower confidence and need native review. This warning still
has 63 English catalog paths; browser review and the wider backlog remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c0e538a582">Translate five additional African sign-in warnings</a>. Thanks to xet7.</summary>

Add Kinyarwanda, Kirundi, Chichewa, Sesotho and Setswana warning translations.
Tests now cover 139 paths, checking repeated address variables, rendering order
and ROOT_URL. Warning and placeholder suites and all 21 preservation checks
pass.
These translations have lower confidence and need native review. Browser review
and the wider all-language backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45f9929be3">Translate additional African sign-in warnings</a>. Thanks to xet7.</summary>

Add six warning values for Yoruba, Igbo, Shona, Zulu and Xhosa catalogs.
Warning tests now cover 134 paths, checking repeated address variables,
rendering order and ROOT_URL. Warning and placeholder suites and all 21
preservation checks pass. These translations have lower confidence and need
native review. Browser review and the wider all-language backlog remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/533c3b9f56">Translate Tatar, Bashkir, Tajik and Turkmen sign-in warnings</a>. Thanks to xet7.</summary>

Add four warning translations with exact variables and locale scripts preserved.
Warning tests now cover 128 catalog paths, checking repeated address variables,
rendering order and ROOT_URL. Warning and placeholder suites and all 21
preservation checks pass. These translations have lower confidence and need
native review. Browser review and the wider all-language backlog remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9008e2674d">Translate Sindhi, Pashto, Kurdish and Uyghur sign-in warnings</a>. Thanks to xet7.</summary>

Add five warning translations with their locale scripts preserved. Warning tests
now cover 124 catalog paths, checking repeated variables, address order and
ROOT_URL. Warning and placeholder suites and all 21 preservation checks pass.
These translations have lower confidence and need native review. Right-to-left
browser rendering and the wider all-language backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b5d08b94b2">Translate Amharic, Burmese, Khmer and Pacific sign-in warnings</a>. Thanks to xet7.</summary>

Translate six physical catalog values covering seven paths through the preserved
Khmer regional symlink. Warning tests now cover 119 paths, checking repeated
variables, address order, ROOT_URL and the shared Khmer value. Warning and
placeholder suites and all 21 preservation checks pass. Amharic and Pacific
prose has lower confidence and needs native review. Browser checks and the wider
all-language backlog remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b4347dbac">Translate the sign-in address warning in five more languages</a>. Thanks to xet7.</summary>

Add Javanese, Haitian Creole, Malagasy, Somali and Hausa warning translations.
Regression tests now check 112 catalogs for repeated address variables,
rendering
order and ROOT_URL. Warning and placeholder suites and all 21 preservation
checks pass. Malagasy, Somali and Hausa prose has lower confidence and needs
native review. Browser review and the wider all-language backlog remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c0e2b0138">Translate Celtic and western European sign-in warnings</a>. Thanks to xet7.</summary>

Add ten warning translations. Regression tests now check 107 catalogs for exact
repeated address variables, rendering order and ROOT_URL. Warning and
placeholder
suites and all 21 preservation checks pass. Regional prose has lower confidence
and needs native review. Browser review and the wider all-language backlog
remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09991df86c">Translate Central Asian and Caucasian sign-in warnings</a>. Thanks to xet7.</summary>

Add 11 warning translations in Mongolian, Kazakh, Kyrgyz, Uzbek, Azerbaijani,
Georgian and Armenian catalogs. Regression tests now check 97 catalogs for
repeated address variables, rendering order and ROOT_URL. Warning and
placeholder
suites and all 21 preservation checks pass. Native and browser review, the Uzbek
Arabic-script warning and the wider all-language backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91ca8cdcb8">Translate the sign-in address warning in 15 more catalogs</a>. Thanks to xet7.</summary>

Add Catalan, Valencian, Galician, Basque, Esperanto, Thai, Swahili, Tagalog,
Mandarin/Chinese variant and Cantonese warning translations. The regression
suite
now checks 86 catalogs for repeated address variables, rendering order and the
literal ROOT_URL key. Warning and placeholder suites and all 21 preservation
checks pass. Native and browser review and the wider all-language backlog
remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/39626be9b0">Translate the sign-in address warning in South Asian languages</a>. Thanks to xet7.</summary>

Add 13 translated catalog values. The warning regression suite now checks 71
catalogs for repeated expected and actual address variables, rendering order
and the literal ROOT_URL key. The warning and placeholder suites and all 21
preservation checks pass. Native review, complex-script and right-to-left
browser rendering, and the wider all-language backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94ab6a2168">Translate the sign-in address warning in 32 more catalogs</a>. Thanks to xet7.</summary>

Extend regional coverage and add Arabic, Persian, Hebrew and Ukrainian wording.
The warning regression suite now checks 58 catalogs for repeated expected and
actual address variables, rendering order and the literal ROOT_URL key. The
warning and placeholder suites and all 21 preservation checks pass. Native
review, right-to-left browser rendering and the wider all-language backlog
remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/928efb3d3e">Translate the sign-in address warning in 26 locales</a>. Thanks to xet7.</summary>

Translate the external sign-in origin mismatch warning in 26 locale catalogs.
Preserve both occurrences of each expected and actual address variable and the
literal ROOT_URL configuration key. Regression tests verify variable
inventories,
rendering order and repeated address substitution. The targeted warning and
placeholder suites and all 21 preservation checks pass. Native review, browser
checks and the wider all-language backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9f5e08aae">Translate remaining Finnish import and sign-in prose</a>. Thanks to xet7.</summary>

Translate 13 import instructions and the sign-in origin mismatch warning.
Preserve commands, hierarchy markers, omitted-data warnings and repeated address
variables. The fill tool now reports zero Finnish placeholders within its scope.
Import regression tests, placeholder tests and all 21 preservation checks pass.
Native review, browser checks, short-word review and the wider all-language
translation backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a79b9f811a">Translate seven import formats in Wu, Papiamento and Yiddish</a>. Thanks to xet7.</summary>

Translate 21 instructions for Quire, Wrike, Teamwork.com, Businessmap, Redmine,
Notion and Plane. Preserve commands, column names, hierarchy markers, file
extensions and warnings about omitted data. All three failures from the
332-suite
translation run pass on targeted rerun, as do the expanded import-instruction
suite, placeholder suite and all 21 preservation checks. Native review, browser
checks and the wider all-language backlog remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73622c9539">Translate eight Finnish import instructions</a>. Thanks to xet7.</summary>

Translate instructions for Planner, MeisterTask, Obsidian, Linear, TickTick,
ClickUp, Nullboard and Kanri. Preserve product commands, file extensions,
first-board limits, archived-card mapping and completion dates. The registered
import-instruction suite and all 21 preservation checks pass. A full scan
verifies
exact placeholder inventories for 988,920 values across 246 catalog paths.
Native review, browser checks and the remaining translations are still
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6b08c3d3dd">Translate Kashubian Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 values, preserving exact variables, keyboard names and count roles.
Regression checks distinguish rollback from keeping records and preserve
planning.
The completed translation batches, placeholder and language wiring suites now
all
pass, as do focused checks and all 21 preservation checks. Recovery prose has
lower
confidence and needs native review. These checks cover registered batches;
browser
checks and the remaining all-language translations are still outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/10a3a73023">Translate Scottish Gaelic Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 values, preserving exact variables, keyboard names and count roles.
Regression checks distinguish rollback from keeping records and preserve
planning.
Focused checks, placeholder and language wiring suites, and all 21 preservation
checks pass. The completion suite still finds an untranslated Kashubian release
label. Recovery prose has lower confidence and needs native review. Browser
checks
and the remaining all-language translations are still outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4611b60670">Translate Welsh Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 62 values in Welsh and British Welsh, preserving exact variables,
keyboard names and count roles. Regression checks distinguish rollback from
keeping records and preserve planning. Focused checks, placeholder and language
wiring suites, and all 21 preservation checks pass. The completion suite still
finds an untranslated Scottish Gaelic release label. Native review, browser
checks and the remaining all-language translations are still outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4fee733285">Translate Basque Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 Basque values, preserving variables, keyboard names and count
roles.
Regression checks distinguish rollback from keeping records and preserve
planning.
Focused checks, placeholder and language wiring suites, and all 21 preservation
checks pass. The completion suite still finds an untranslated Welsh release
label.
Native review, browser checks and the remaining all-language translations are
still outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e54dda91c">Translate Breton Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 Breton values, preserving variables, keyboard names and count
roles.
Regression checks distinguish rollback from keeping records and preserve
planning.
Focused checks, placeholder and language wiring suites, and all 21 preservation
checks pass. The completion suite still finds an untranslated Basque release
label.
Recovery prose has lower confidence and needs native review. Browser checks and
the remaining all-language translations are still outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5d4735e5b">Translate Occitan Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 Occitan values with exact variables, keyboard names and count
roles.
Add checks for preserving planning and distinguishing rollback from keeping
records.
Focused checks, placeholder and language wiring suites, and all 21 preservation
checks pass. The completion suite still finds an untranslated Breton release
label.
Recovery prose has lower confidence and needs native review. Browser checks and
completion of the remaining languages are still outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a1aea15a2c">Translate Asturian Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 values, preserving placeholders, count roles, keyboard names and
recovery choices. Placeholder and language-wiring suites, focused Asturian
checks
and all 21 preservation checks pass. The large completion suite now reaches
untranslated Occitan release text. Recovery prose has lower confidence and needs
native review; browser checks and the remaining backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b1156bcefa">Translate Aragonese Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 values, preserving placeholders, count roles, keyboard names and
recovery choices. Placeholder and language-wiring suites, focused Aragonese
checks
and all 21 preservation checks pass. The large completion suite now reaches
untranslated Asturian release text. Recovery prose has lower confidence and
needs
native review; browser checks and the remaining backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07341319f3">Translate Neapolitan Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 values, preserving placeholders, count roles, keyboard names and
recovery choices. Placeholder and language-wiring suites, focused Neapolitan
checks
and all 21 preservation checks pass. The large completion suite now reaches
untranslated Aragonese release text. Recovery prose has lower confidence and
needs
native review; browser checks and the remaining backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85621c368c">Translate Sicilian Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 values, preserving placeholders, count roles, keyboard names and
recovery choices. Placeholder and language-wiring suites, focused Sicilian
checks
and all 21 preservation checks pass. The large completion suite now reaches
untranslated Neapolitan release text. Recovery prose has lower confidence and
needs
native review; browser checks and the remaining backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/157995c7d5">Translate Sardinian Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 values, preserving placeholders, count roles, keyboard names and
recovery choices. Placeholder and language-wiring suites, focused Sardinian
checks
and all 21 preservation checks pass. The large completion suite now reaches
untranslated Sicilian release text. Recovery prose has lower confidence and
needs
native review; browser checks and the remaining backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae77f3f3b0">Translate Corsican Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 values, preserving placeholders, count roles, keyboard names and
recovery choices. Placeholder and language-wiring suites, focused Corsican
checks
and all 21 preservation checks pass. The large completion suite now reaches
untranslated Sardinian release text. Recovery prose has lower confidence and
needs
native review; browser checks and the remaining backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b629778b0a">Translate Irish Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 values, preserving placeholders, count roles, keyboard names and
recovery choices. Placeholder and language-wiring suites, focused Irish checks
and
all 21 preservation checks pass. The large completion suite now reaches
untranslated
Corsican release text. Recovery wording has lower confidence and needs native
review;
browser checks and the remaining all-language backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63b56e9a3b">Translate Kannada Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 values, preserving placeholders, count roles, keyboard names and
recovery choices. Placeholder and language-wiring suites, focused Kannada checks
and all 21 preservation checks pass. The large completion suite now reaches
untranslated Irish release text. Native review, browser checks and the remaining
all-language backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cc864f1520">Translate Gujarati Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 values, preserving placeholders, count roles, keyboard names and
recovery choices. Placeholder and language-wiring suites, focused Gujarati
checks
and all 21 preservation checks pass. The large completion suite now reaches
untranslated Kannada planning text. Native review, browser checks and the
remaining
all-language backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/420d1aeabc">Translate Thai Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 values, preserving placeholders, count roles, keyboard names and
recovery choices. Placeholder and language-wiring suites, focused Thai checks
and
all 21 preservation checks pass. The large completion suite now reaches
untranslated
Gujarati release text. Native review, browser checks and the remaining
all-language
backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/20603cf77d">Translate Urdu Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 values, preserving placeholders, reordered count roles, keyboard
names
and recovery choices. Placeholder and language-wiring suites, focused Urdu
checks
and all 21 preservation checks pass. The large completion suite now reaches
untranslated Thai release text. Native review, right-to-left browser checks and
the remaining all-language backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c5dbdba52">Translate Nepali Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 values, preserving placeholders, reordered count roles, keyboard
names
and recovery choices. Placeholder and language-wiring suites, focused Nepali
checks
and all 21 preservation checks pass. The large completion suite now reaches
untranslated Urdu release text. Native review, browser checks and the remaining
all-language backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb648cd0be">Translate Tamil Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 values, preserving placeholders, reordered count roles, keyboard
names
and recovery choices. Placeholder and language-wiring suites, focused Tamil
checks
and all 21 preservation checks pass. The large completion suite now reaches
untranslated Nepali release text. Native review, browser checks and the
remaining
all-language backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b9e8bdcce">Translate Bengali Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 31 values, preserving placeholders, reordered count roles, keyboard
names,
import matching outcomes and recovery choices. Placeholder and language-wiring
suites, focused Bengali checks and all 21 preservation checks pass. The large
completion suite now reaches untranslated Tamil release text. Native review,
browser checks and the remaining all-language backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/473b565285">Translate Hindi Scrum planning and recovery messages</a>. Thanks to xet7.</summary>

Translate 62 values across both Hindi catalogs, preserving placeholders, count
roles, keyboard names, matching errors and rollback/keep-board distinctions.
Placeholder and language-wiring suites, focused Hindi checks and all 21
preservation
checks pass. The large completion suite now reaches untranslated Bengali release
text. Native review, browser checks and the remaining backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d68bd56cb">Translate Malay and Indonesian Scrum planning and recovery</a>. Thanks to xet7.</summary>

Translate 93 values across three catalogs. Preserve placeholders, keyboard
names,
matching errors, recovery choices and the rule that a first sync never removes
planning. Placeholder and language-wiring suites, focused batch checks and all
21
preservation checks pass. The large completion suite now reaches untranslated
Hindi
planning text. Native review, browser checks and the remaining backlog are
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0c89ad318">Translate Persian Scrum import and recovery messages</a>. Thanks to xet7.</summary>

Translate 56 values across both Persian catalogs, preserving variable
inventories,
keyboard names, matching failures and rollback/keep-board distinctions.
Placeholder
and language-wiring suites plus all 21 preservation checks pass. The large
completion
suite advances beyond Persian to untranslated Malay release text. Native review,
browser checks and the remaining all-language translation backlog are
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e39aa19360">Translate Hebrew Scrum imports and recovery; refresh coverage count</a>. Thanks to xet7.</summary>

Translate 56 values across both Hebrew catalogs, preserving variables, keyboard
names, multi-release selection and rollback/keep-board distinctions. Correct the
README coverage figure to 188 catalogs above 90 percent non-English text.
Language
wiring, placeholder checks, focused Hebrew checks and 21 preservation checks
pass.
The large completion suite now reaches untranslated Persian release text;
remaining
translations, native review and browser validation are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/42797d6418">Translate Super Productivity, Taiga and Vikunja imports</a>. Thanks to xet7.</summary>

Translate nine instructions in Wu Chinese, Papiamento and Yiddish. Preserve menu
commands, filenames, archive behavior and attachment exclusions. All five
affected
Node suites and 21 human-translation preservation checks pass. Native review,
browser validation and the remaining all-language translation backlog are
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68601cb89f">Translate Bengali, Kannada and Nepali short interface labels</a>. Thanks to xet7.</summary>

Translate 12 labels for sort criteria, rule actors, email recipients and the
current-user due-card filter. Distinguish the two meanings of English by using
their actual interface roles. Three focused Node suites and 21 human-translation
preservation checks pass. Native review, browser validation and the remaining
all-language translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f31971c4b">Translate short Mongolian Blockly labels</a>. Thanks to xet7.</summary>

Translate 14 short English control, list, procedure and pixel-state labels. Keep
indexed movement roles, list position markers and equivalent block labels
intact.
Four focused Node suites and all 21 human-translation preservation checks pass.
Composed labels need native review; browser/screen-reader validation and the
wider
all-language translation backlog remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/464ae965ed">Translate Tasks.org and monday.com imports in three languages</a>. Thanks to xet7.</summary>

Translate six instructions in Wu Chinese, Papiamento and Yiddish, retaining menu
commands, file extensions, completion dates and import field mappings. All five
affected Node suites and 21 human-translation preservation checks pass. Broader
Node verification is still running. Native review, browser validation and the
remaining all-language translation backlog are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/77002d3ef6">Translate seven import formats in Wu, Papiamento and Yiddish</a>. Thanks to xet7.</summary>

Translate 21 instructions for Obsidian, Linear, TickTick, ClickUp, Nullboard,
Kanri
and Pivotal Tracker. Preserve menu labels, file extensions, archive behavior and
first-board-only imports. Instruction and catalog-wide placeholder suites pass,
as do all 21 human-translation preservation checks. Three catalog-completeness
suites now fail on a concurrently added Tasks.org instruction. Native review,
browser validation and the remaining all-language translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85fad588e2">Translate short Punjabi, Swahili and Uzbek Blockly labels</a>. Thanks to xet7.</summary>

Translate 62 English values across five catalogs, retaining indexed movement
arguments, list position markers, equivalent procedure labels and distinct pixel
states. Four focused Node suites and 21 human-translation preservation checks
pass.
Composed labels need native review; browser/screen-reader tests were not run.
The remaining all-language translation backlog is still unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8be1815560">Translate short Marathi, Malayalam and Telugu Blockly labels</a>. Thanks to xet7.</summary>

Translate 31 English labels while preserving indexed input/context arguments,
conditional and procedure aliases, and distinct pixel states. Four focused Node
suites and all 21 human-translation preservation checks pass. Composed labels
need
native review; browser and screen-reader validation were not run. Translation
work across the remaining languages is still unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09c9ce2915">Translate short Czech, Japanese and Chinese labels</a>. Thanks to xet7.</summary>

Translate 14 values across 12 locale paths. Distinguish Czech rule actors from
sort
criteria, translate Japanese or and preserve reordered Chinese movement
arguments.
Five focused suites and 21 human-preference checks pass, including Chinese
translation
protection. Browser/screen-reader validation was not run; wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c07736a824">Translate short Blockly labels in Yiddish and Papiamento</a>. Thanks to xet7.</summary>

Translate 29 labels, preserving indexed movement roles and equivalent
control-flow
and procedure forms. Four focused suites and 21 human-preference checks pass.
Papiamento wording needs native review; browser/screen-reader tests were not
run,
and all-language translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7b7f419f00">Translate short Blockly labels in Finnish, German and French</a>. Thanks to xet7.</summary>

Translate 20 movement-announcement and pixel-state values across ten locale
paths.
Preserve indexed input/context roles, including Finnish word order. Four focused
suites
and all 21 human-preference checks pass. Screen-reader/browser validation was
not run;
the all-language translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f462841831">Translate MeisterTask import instructions in Wu, Papiamento and Yiddish</a>. Thanks to xet7.</summary>

Translate the new instruction, preserving menu labels, CSV format, section/task
mapping
and completion dates. Five focused suites and all 21 human-preference checks
pass,
including the three completeness suites previously blocked by this new source
string.
Wording needs native review; browser tests were not run and wider translation
work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24e73687c9">Translate Planner import instructions in Wu, Papiamento and Yiddish</a>. Thanks to xet7.</summary>

Translate the new Planner instruction in three languages, preserving menu and
field
names and the .xlsx extension. Distinguish Planner groups from storage buckets.
The literal/mapping regression passes. Three completeness suites passed before
the next
MeisterTask source addition and now flag that new string. Native review and
wider
translation work remain unfinished; browser tests were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e17d58820d">Expose short untranslated prose for locale review</a>. Thanks to xet7.</summary>

Add a read-only audit for short English UI words hidden by the fill tool's
invariant
filter. The working catalog has 1,907 candidates across 198 locale files; shared
words
still require language-specific review. Preserve arguments and exclude technical
notation.
Both regression tests pass. The all-language translation work remains
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07a09ca77d">Translate remaining English Wu Blockly labels</a>. Thanks to xet7.</summary>

Translate 15 Blockly labels omitted from the missing-string report. Preserve
indexed
movement arguments and consistent control-flow and procedure labels.
Three focused suites, 37 Blockly checks and 21 human-preference checks pass. Wu
wording
needs native review; browser tests were not run and wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e3a2a4f4c">Restore complete Wu flow report explanations</a>. Thanks to xet7.</summary>

Correct 39 Wu values, replacing abbreviated analytics fragments with complete
wording.
Preserve forecast limitations, missing-history behavior, date fallbacks and
correction scope.
Three focused suites and all 21 human-preference checks pass. Statistical
wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/72b11e7fe2">Correct Wu import, WIP group and sync instructions</a>. Thanks to xet7.</summary>

Correct 24 Wu values, restoring WIP group meanings and project examples.
Preserve
search syntax, file extensions, item variables and the synchronization interval.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/736dac75d9">Correct Wu account messages and repair result counts</a>. Thanks to xet7.</summary>

Correct 22 Wu values, preserving repair-result count variables and username
minimums.
Restore Cron and status labels and clarify the missing-board repair limitation.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8b8afd73f">Correct Wu job controls and migration ranges</a>. Thanks to xet7.</summary>

Correct 26 Wu values, restoring task and board meanings. Preserve batch, CPU and
delay
ranges, their units and background migration behavior when the browser closes.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92c494d492">Correct Wu monitoring and repeat interval labels</a>. Thanks to xet7.</summary>

Correct 30 Wu values, restoring elapsed-day, completion and monitoring meanings.
Preserve numeric intervals, GridFS and once-per-board conversion instructions.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d7d096229">Correct Wu repair prompts and migration field names</a>. Thanks to xet7.</summary>

Correct 28 Wu values, restoring exact field-name case and migration status
meanings.
Preserve recovery scope, cleanup order and the difficult-undo warning.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d80d26740e">Correct Wu storage and scheduled task meanings</a>. Thanks to xet7.</summary>

Correct 32 Wu values, preserving storage examples and scheduled board-operation
scope.
Clarify both conditions required for removing duplicate empty lists.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/881899ee4a">Correct Wu cloud setup and migration statuses</a>. Thanks to xet7.</summary>

Correct 24 Wu values, preserving cloud menu paths, product names and credential
alternatives. Distinguish migration progress, success, failure and stop scope.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a0460e755">Correct Wu anonymization and cloud storage help</a>. Thanks to xet7.</summary>

Correct 19 Wu values, preserving anonymization examples, field names, cloud
console
labels, credential fallbacks and the once-only secret-key display warning.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b37c643b17">Correct Wu settings help and anonymization warning</a>. Thanks to xet7.</summary>

Correct 20 Wu values, including stale loading help and an account-anonymization
warning
that incorrectly described export. Preserve configuration names and rendering
examples.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/202684210a">Correct Wu storage and database migration help</a>. Thanks to xet7.</summary>

Correct 17 Wu values, preserving database URLs, settings, commands, file paths
and
migration target variables. Keep migration prerequisites and
irreversible-deletion warnings.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3c45288a7">Correct Wu account and scheduled-job wording</a>. Thanks to xet7.</summary>

Correct 43 Wu values, clarifying account enablement and scheduled board
operations.
Distinguish absent paused migrations from an inability to resume them.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf69929f30">Correct Wu Markdown, recurrence and lockout wording</a>. Thanks to xet7.</summary>

Correct 28 Wu values, preserving format names and distinguishing card recurrence
from
checklist reset. Clarify login-failure counts and single/all-user unlock scope.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5bf865dd39">Correct Wu storage, progress and workspace wording</a>. Thanks to xet7.</summary>

Correct 25 Wu values, restoring path, upload-progress and board-ID meanings.
Preserve
workspace variables, storage product names and compaction instruction order.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f136811382">Correct Wu diagnostics, checklist and storage meanings</a>. Thanks to xet7.</summary>

Correct 45 Wu values, restoring Node, board and checklist-order meanings.
Preserve
storage names and distinguish all attachments from a board's attachments.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bdff13b866">Correct Wu animation and invitation wording</a>. Thanks to xet7.</summary>

Correct 18 Wu values, checking animation meanings against their CSS. Clarify
team
removal and invitation permissions; preserve placeholders and the Cc
abbreviation.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b4fd5d9f6">Correct Wu report, template and creator wording</a>. Thanks to xet7.</summary>

Correct 21 Wu values, including administrator and card-creator roles. Preserve
template
variables, HTML space entities, API configuration and report aggregation
meanings.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8d6041ca4">Correct Wu dependency, map and server instructions</a>. Thanks to xet7.</summary>

Correct 17 Wu values, preserving dependency counts, background size and log
commands.
Restore Snap as the installation product name. Add regression checks and refresh
audit records.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df966f107c">Correct Wu search-logic help translations</a>. Thanks to xet7.</summary>

Correct fifteen Wu search-help values. Preserve predicate variables, code
examples,
OR/AND semantics, negation, descending-sort syntax and positive page limits.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0ea8f7c6fd">Correct Wu search-help translations</a>. Thanks to xet7.</summary>

Correct sixteen Wu search-help values. Preserve operator placeholders, literal
examples and arguments while clarifying member, container and date-interval
scope.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ab081b960">Correct Wu search-predicate translations</a>. Thanks to xet7.</summary>

Correct seventeen Wu search-predicate and validation values. Preserve
operator/value
variables, percent placeholders, calendar-quarter meaning and positive-integer
limits.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c890e36ab9">Correct Wu search-result and operator translations</a>. Thanks to xet7.</summary>

Correct twenty-seven Wu search-result and operator values. Preserve
placeholders,
range/total roles and source search abbreviations; restore domain-specific
meanings.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/199e533493">Correct Wu shared-template and card-view translations</a>. Thanks to xet7.</summary>

Correct twenty-two Wu shared-template and card-view values. Preserve variables,
authorized-board scope, incomplete due cards and member-or-assignee
restrictions.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e696cc805e">Correct Wu calendar and domain translations</a>. Thanks to xet7.</summary>

Correct fifteen Wu weekday, status, checklist and domain values. Preserve
variables,
linked-card deletion prerequisites and domain-validation examples and
restrictions.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19b36056dc">Correct Wu notification-control and role translations</a>. Thanks to xet7.</summary>

Correct thirteen Wu display, notification and role values. Preserve variables,
read/unread actions, assigned-card scope and the global-administrator exception.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76665c8a84">Correct Wu reminders and card-control translations</a>. Thanks to xet7.</summary>

Correct nineteen Wu reminder, deletion and card-control values. Preserve named
variables, deadline meanings, deletion warnings and multiple-window behavior.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7deea150f7">Correct Wu date and placement translations</a>. Thanks to xet7.</summary>

Correct twenty-two Wu copying, deletion, date-activity and placement values.
Preserve
old/new date variables, deadline meanings and opposite placement directions.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76a68a3c8a">Correct Wu login and configuration literals</a>. Thanks to xet7.</summary>

Correct sixteen Wu login and configuration values. Preserve variables,
environment
names, one-time code behavior, CAS protocol naming and HTML insertion positions.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa956fdbc8">Correct Wu rule-field action translations</a>. Thanks to xet7.</summary>

Correct twenty Wu rule-action and configuration values. Preserve variables,
checkbox actions, empty-field matching, delimiters and environment-setting
precedence.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7563d81d24">Correct Wu checklist and movement-action translations</a>. Thanks to xet7.</summary>

Correct eighteen Wu rule-action fragments. Preserve variables, checkbox actions,
current-versus-selected list scope, any-trigger semantics and action order.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1795e650a1">Correct Wu rule-condition translations</a>. Thanks to xet7.</summary>

Correct twenty-four Wu rule-condition and action fragments. Preserve variables,
date-set/change alternatives, opposite checklist actions and membership scope.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5bf8f7493b">Correct Wu rule movement and completion translations</a>. Thanks to xet7.</summary>

Correct eighteen Wu rule fragments. Preserve variables, movement and completion
meanings, all-card scope, N-day duration and dates relative to now.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64513444e5">Correct Wu rule-import and schedule translations</a>. Thanks to xet7.</summary>

Correct eighteen Wu rule-import and schedule values. Preserve count variables,
product names, unsupported-rule reporting and Monday–Friday schedule scope.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49af179c15">Correct Wu rule-trigger translations</a>. Thanks to xet7.</summary>

Correct twenty-one Wu rule-trigger and workflow values. Preserve time variables,
JSON/CSV literals and opposite added/removed and archived/restored events.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84180373a0">Correct Wu parent-card and positional activity translations</a>. Thanks to xet7.</summary>

Correct twenty-two Wu minicard, parent-card and activity values. Restore
positional
label, field, value and owner roles while preserving source token inventories.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a35c59529">Correct Wu organization and deletion translations</a>. Thanks to xet7.</summary>

Correct twenty-two Wu organization, deletion and subtask-setting values.
Preserve
variables, administrator limits, duplicate-list conditions and deletion
warnings.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ff8985d1bd">Correct Wu administration and field-scope translations</a>. Thanks to xet7.</summary>

Correct nineteen Wu administration, custom-field and organization values.
Preserve
variables, product names, field scope and multitenancy configuration literals.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3511aa9f18">Correct Wu limits and mail-setting translations</a>. Thanks to xet7.</summary>

Correct twenty-four Wu limits, invitation and mail-setting values. Preserve
variables, template braces, avatar defaults and separate API buffering limits.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bcdd7f3f1c">Correct Wu tracking and link translations</a>. Thanks to xet7.</summary>

Correct eighteen Wu time-tracking, shortcut, watching and link values. Preserve
variables, shortcut ranges, opposite label actions and link-disable conditions.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8077105cbd">Correct Wu shortcuts and starred-item translations</a>. Thanks to xet7.</summary>

Correct twenty-five Wu shortcut, threshold and starred-item values. Preserve
variables, assignment direction, time units and opposite default-board actions.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ab39fc863">Correct Wu visibility and member-removal translations</a>. Thanks to xet7.</summary>

Correct twenty-four Wu visibility, profile, removal and unsaved-description
values.
Preserve variables, login markup, access restrictions and member notification
scope.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3a7f4f6ed">Correct Wu selection and notification translations</a>. Thanks to xet7.</summary>

Correct twenty-seven Wu selection, membership and notification values. Preserve
variables, selected-item scope, assigned-card visibility and ordinary editing
limits.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9aea43a6d9">Correct Wu member and list-operation translations</a>. Thanks to xet7.</summary>

Correct twenty-six Wu member, role and list-operation values. Preserve
variables,
last-administrator protection and the distinction between archiving and
deletion.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efbc4911e2">Correct Wu Trello import translations</a>. Thanks to xet7.</summary>

Correct twenty-five Wu Trello import and cancellation values. Preserve technical
literals, credential requirements, ZIP failure distinctions and deletion scope.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53273cb4d3">Correct Wu import-instruction translations</a>. Thanks to xet7.</summary>

Correct nineteen Wu import labels and instructions. Preserve API paths, schema
keys, variables, Markdown examples, spreadsheet headers and mapping behavior.
Four focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/74ea292fc6">Correct Wu sorting and filter translations</a>. Thanks to xet7.</summary>

Correct twenty-seven Wu sorting, filtering and navigation values. Preserve
literal
filter examples, variables and the distinction between creators and assignees.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e526e8b3d6">Correct Wu error and export translations</a>. Thanks to xet7.</summary>

Correct thirty Wu import-error, account and export values. Preserve technical
literals, linked-card restrictions and empty-board recovery instructions.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6057034cd">Correct Wu email and field-message translations</a>. Thanks to xet7.</summary>

Correct twenty-five Wu field, email, invitation and access messages. Preserve
named variables, technical literals, role restrictions and deletion-setting
scope.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0ac16de9d">Correct Wu permissions and copying translations</a>. Thanks to xet7.</summary>

Correct twenty-three Wu permissions, confirmation, clipboard and import values.
Preserve variables, JSON property names, access limits and field-history
deletion.
Four focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/855127fa63">Correct Wu color and comment-role translations</a>. Thanks to xet7.</summary>

Correct twenty Wu archive-navigation, color and comment-role values. Preserve
variables, assigned-card restrictions and the All Boards archive location.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e0b7ac722b">Correct Wu member search and toggle translations</a>. Thanks to xet7.</summary>

Correct twenty Wu search, font, avatar, toggle and card-aging values. Preserve
variables, preview digits, opposite actions and three idle-day fading levels.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/034d1aa8d4">Correct Wu planning and card dialog translations</a>. Thanks to xet7.</summary>

Correct nineteen Wu planning, card and account dialog values. Preserve
variables,
numeric planning choices and the imported-member permission limit during
mapping.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a2f48aff0">Correct Wu voting and archive translations</a>. Thanks to xet7.</summary>

Correct seventeen Wu archive, card and voting values. Preserve overdue
variables,
card membership scope and the difference between archiving and permanent
deletion.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91be958efb">Correct Wu timeline and card lifecycle translations</a>. Thanks to xet7.</summary>

Correct twenty-two Wu timeline, calendar and card lifecycle values. Preserve
variables, restoration fields and the difference between deletion and archiving.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0da6bfb61b">Correct Wu board visibility and membership translations</a>. Thanks to xet7.</summary>

Correct twenty Wu board, assignment, visibility and view strings. Preserve HTML
and variables, and distinguish current-card assignments from all-card
assignments.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5c1884f3c">Correct Wu archive and attachment translations</a>. Thanks to xet7.</summary>

Correct thirty Wu archive, attachment, loading and board-setting values.
Preserve
count and size variables, recoverable removal and permanent-deletion meanings.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/00c07df43e">Correct Wu checklist and member translations</a>. Thanks to xet7.</summary>

Correct eighteen Wu checklist, membership and administrator strings, including
matching cards, completed addition, list placement and announcement activation.
Three focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee28656601">Correct Wu list width and shortcut settings</a>. Thanks to xet7.</summary>

Correct eleven Wu settings strings, including personal and shared width scope,
all-list resizing, card placement and opposite shortcut toggle actions.
Four focused suites and all 21 human-preference checks pass. Wu wording needs
native review; browser tests were not run and the wider translation work
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/865db11a14">Correct Wu workspace and home-board instructions</a>. Thanks to xet7.</summary>

Correct 15 values, restoring the single-board restriction and preserving removal
warnings and date roles. Three focused suites and 21 human-preference checks
pass.
Wu prose is lower confidence and needs native review. No browser session was
run.
The broader language audit remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/51e3e8b375">Correct Wu checklist roles and Markdown label</a>. Thanks to xet7.</summary>

Correct eight activity and workspace values, preserving placeholder roles and
restoring the Markdown format name. Three focused suites and 21 human-preference
checks pass. Wu prose is lower confidence and needs native review. No browser
session was run. The broader language audit remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc8a66d6ab">Correct Wu activity summary argument roles</a>. Thanks to xet7.</summary>

Correct 25 activity summaries to Wu, repairing positional placeholder roles in
import, removal and checklist messages. Update audit records. Three focused
suites
and 21 human-preference checks pass. Wording is lower confidence and needs
native
review. No browser session was run. The broader language audit remains
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f41d4ca7a">Correct Wu board activity wording</a>. Thanks to xet7.</summary>

Replace 24 Mandarin-like or malformed activity messages with Wu wording,
preserving
source tokens and updating exact-value audit records. Three focused suites and
21 human-preference checks pass. Wording is lower confidence and needs native
review. No browser session was run. The broader language audit remains
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f5c1697d6">Correct Wu activity language and title argument order</a>. Thanks to xet7.</summary>

Replace 26 Mandarin-like activity and permission messages with Wu wording,
preserving tokens and correcting title-argument order. Refresh exact-value audit
records. Three focused suites and 21 human-preference checks pass. Wording is
lower confidence and needs native review. No browser session was run. Work
remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16ef038d8b">Complete current Wu translation fill list</a>. Thanks to xet7.</summary>

Translate the final 33 recovery and environment-setting strings. The full
current
Wu fill list is empty. Three focused suites and 21 human-preference checks pass.
Wu wording is lower confidence and needs native review. No browser session was
run. Older Mandarin-like passages and other languages remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7564f2a073">Translate Wu Sync planning and interrupted operations</a>. Thanks to xet7.</summary>

Translate 25 planning and recovery messages, preserving variables and checking
matching order, retained changes and replayability. Three focused suites and
21 human-preference checks pass. Wu wording is lower confidence and needs native
review. No browser session was run. Remaining translations are unfinished.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.25 2026-10-08 WeKan ® release

**In short:** Sign-in through **Google**, **OAuth2/OIDC**, **SAML** and **CAS**
now leaves for the identity provider and comes back in the same window by
default, instead of a popup that a provider could cut off so the login never
finished; a refused login says why on the sign-in page. The **Caddy** and
**Sandstorm** hosting docs send every container the visitor's real address.

This release changes the following defaults:

**Login** - how the sign-in page reaches an identity provider.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ad51a03731">Every provider login uses a full-page redirect by default instead of a popup</a>. Thanks to xet7.</summary>

OAUTH2_LOGIN_STYLE, OAUTH_PROVIDERS_LOGIN_STYLE (Google, GitHub and the
others), the SAML profiles and CAS opened a popup by default. A provider's
sign-in page can send Cross-Origin-Opener-Policy, which makes the popup look
closed at once: the login was tried before the provider answered, and the user
was back on the sign-in page with no error. Popups are also blocked in iframes
and on some phones. All four now redirect unless set to popup. CAS could not
finish a redirect login at all, as nothing completed it on return, and its
sign-in call passed the wrong arguments; both are fixed, and its redirect page
escapes the address it echoes. A refused redirect login now shows its error on
the sign-in page. Verified with the local identity-provider suite against a
fresh bundle: 31 of 31 with Chromium. `tests/loginRedirectDefault.test.cjs`.

</details>

and improves the hosting documentation:

**Caddy and Sandstorm** - the proxy headers a WeKan container and Sandstorm
receive.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88d3285f29">Caddy sends each WeKan container and Sandstorm the visitor's real address</a>. Thanks to xet7.</summary>

Behind CloudFlare, the production Caddyfile of the Meteor 3 Docker docs left
the forwarded headers to Caddy's defaults, so WeKan saw one shared address for
everybody: all users shared the login cookie refresh limit, which signed them
out at busy times and sent a Google login back to the sign-in page. Caddy now
trusts only CloudFlare's own ranges for CF-Connecting-IP, every WeKan site
sends X-Forwarded-Proto https and the visitor's address through one shared
snippet, the container template sets HTTP_FORWARDED_COUNT=1, and Sandstorm
gets X-Real-IP set rather than passed through. Validated with caddy adapt and
a live Caddy.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ccf7625d38">Translate Wu rule editor and Scrum imports</a>. Thanks to xet7.</summary>

Translate 30 rule and import messages, preserving placeholders and checking
permissions, matching and unchanged cards. Three focused translation suites and
21 human-preference checks pass. Wu wording is lower confidence and needs native
review. No browser session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76a45e9ce5">Complete current Wu Blockly translation fill list</a>. Thanks to xet7.</summary>

Translate 32 workspace and alias messages. The full current Wu fill list has no
Blockly entries. Four focused suites and 21 human-preference checks pass.
Wu wording is lower confidence and needs native review. No browser or
screen-reader
session was run. Other strings and older Mandarin-like passages remain
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ea7eaa769d">Translate Wu Blockly text values and variables</a>. Thanks to xet7.</summary>

Translate 35 text and variable messages, preserving placeholders and checking
replacement order, whitespace and variable types. Four focused translation
suites
and 21 human-preference checks pass. Wu wording is lower confidence and needs
native review. No browser or screen-reader session was run. Work is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/889c5d84a9">Translate Wu Blockly text positions</a>. Thanks to xet7.</summary>

Translate 30 text messages, preserving variables and checking letter case,
copied
text and indexing from either end. Four focused translation suites and
21 human-preference checks pass. Wu wording is lower confidence and needs native
review. No browser or screen-reader session was run. Work remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4226317591">Translate Wu Blockly keyboard shortcuts</a>. Thanks to xet7.</summary>

Translate 37 shortcut and key labels, preserving key names and checking
directions,
navigation pairs and focus destinations. Four focused translation suites and
21 human-preference checks pass. Wu wording is lower confidence and needs native
review. No browser or screen-reader session was run. Work remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f6d83cebb3">Translate Wu Blockly procedures and accessibility modes</a>. Thanks to xet7.</summary>

Translate 30 procedure and accessibility messages, preserving variables and
checking outputs, scope and screen-reader transitions. Four focused suites and
21 human-preference checks pass. Wu wording is lower confidence and needs native
review. No browser or screen-reader session was run. Work remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb5ad6de61">Translate Wu Blockly trigonometry and workspace</a>. Thanks to xet7.</summary>

Translate 30 trigonometry, workspace and key messages, preserving variables and
checking angle units, inverse functions and variable types. Four focused suites
and 21 human-preference checks pass. Wu wording is lower confidence and needs
native review. No browser or screen-reader session was run. Work is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e25c024618">Translate Wu Blockly rounding and unary math</a>. Thanks to xet7.</summary>

Translate 30 math messages, preserving variables and literals and checking
random
bounds, rounding directions and logarithm bases. Four focused translation suites
and 21 human-preference checks pass. Wu wording is lower confidence and needs
native review. No browser or screen-reader session was run. Work is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/211c99607d">Translate Wu Blockly number properties and statistics</a>. Thanks to xet7.</summary>

Translate 30 number-property and statistics messages, preserving variables and
checking inclusive bounds and distinct statistical terms. Four focused suites
and
21 human-preference checks pass. Wu wording is lower confidence and needs native
review. No browser or screen-reader session was run. Work remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e7b39e89a">Translate Wu Blockly logic and arithmetic</a>. Thanks to xet7.</summary>

Translate 30 logic, arithmetic and constant messages, preserving variables and
mathematical literals and checking negation and bounds. Four focused suites and
21 human-preference checks pass. Wu wording is lower confidence and needs native
review. No browser or screen-reader session was run. Work remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5fe338f83d">Translate Wu Blockly sorting and logic</a>. Thanks to xet7.</summary>

Translate 30 list and comparison messages, preserving variables and checking
sort
directions, case sensitivity and comparison semantics. Four focused suites and
21 human-preference checks pass. Wu wording is lower confidence and needs native
review. No browser or screen-reader session was run. Work remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ecc9ea6fe">Translate Wu Blockly list positions and removal</a>. Thanks to xet7.</summary>

Translate 30 list messages, preserving variables and checking removal return
behavior, indexing and copying semantics. Four focused translation suites and
21 human-preference checks pass. Wu wording is lower confidence and needs native
review. No browser or screen-reader session was run. Work remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5cae76ce91">Translate Wu Blockly navigation and list retrieval</a>. Thanks to xet7.</summary>

Translate 35 input, keyboard-navigation and list messages, preserving variables
and checking movement and retrieval semantics. Four focused translation suites
and
21 human-preference checks pass. Wu wording is lower confidence and needs native
review. No browser or screen-reader session was run. Work remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d7bf4d56b">Translate Wu Blockly input roles</a>. Thanks to xet7.</summary>

Translate 40 input labels, preserving variables and checking input positions,
arithmetic operands and count versus value. Four focused translation suites and
21 human-preference checks pass. Wu wording is lower confidence and needs native
review. No browser or screen-reader session was run. Work remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31b86d4178">Translate Wu Blockly fields and accessibility</a>. Thanks to xet7.</summary>

Translate 30 field, key, icon and input messages, preserving variables and key
names and checking bitmap roles and opposite actions. Four focused suites and
21 human-preference checks pass. Wu wording is lower confidence and needs native
review. No browser or screen-reader session was run. Work remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e13249115e">Translate Wu Blockly loops and editing</a>. Thanks to xet7.</summary>

Translate 35 loop, condition, copy, deletion and enable/disable messages,
preserving
variables and checking opposite conditions and actions. Four focused translation
suites and 21 human-preference checks pass. Wu wording is lower confidence and
needs native review. No browser session was run. Remaining work is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7410bfc2db">Translate Wu imports and Blockly controls</a>. Thanks to xet7.</summary>

Translate 35 import, login, keyboard, color and control-flow messages,
preserving
variables, literal names and numeric limits. Five focused translation suites and
21 human-preference checks pass. Wu wording is lower confidence and needs native
review. No browser session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1dfef78d90">Translate Wu board and LDAP settings</a>. Thanks to xet7.</summary>

Translate 17 settings and rule strings, preserving variables, link templates and
configuration names. Three focused suites and 21 human-preference checks pass.
Wu wording is lower confidence and needs native review; older Mandarin-like
passages still need auditing. No browser session was run. Work remains
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc7ff85bfa">Complete current Papiamento translation fill list</a>. Thanks to xet7.</summary>

Translate the final 49 recovery, import, history and environment-setting
strings.
The current full Papiamento fill list is empty; other languages remain
unfinished.
Three focused translation suites and 21 human-preference checks pass.
Specialized wording is lower confidence and needs native review. No browser
session was run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a53247e68">Translate Papiamento notification recovery</a>. Thanks to xet7.</summary>

Translate 30 notification-recovery and interrupted-Sync messages, preserving
variables and checking recovery states, cancellation and retained changes.
Three focused translation suites and 21 human-preference checks pass.
Specialized wording is lower confidence and needs native review. No browser
session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7b62fbbdd6">Translate Papiamento Sync outcomes and mail failures</a>. Thanks to xet7.</summary>

Translate 35 Sync, estimate, planning, mail-failure and activity messages,
preserving variables and checking failure states, null values and retry
behavior.
Three focused translation suites and 21 human-preference checks pass.
Specialized wording is lower confidence and needs native review. No browser
session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd576b6355">Translate Papiamento Sync previews and source reports</a>. Thanks to xet7.</summary>

Translate 30 replacement, preview and source-report messages, preserving
variables
and checking replacement reuse, omitted values and report limits.
Three focused translation suites and 21 human-preference checks pass.
Specialized wording is lower confidence and needs native review. No browser
session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/487e0b16e1">Translate Papiamento import previews and Sync conflicts</a>. Thanks to xet7.</summary>

Translate 30 import-preview and Sync-conflict messages, preserving variables and
checking ambiguity, local versus source choices and retained card content.
Three focused translation suites and 21 human-preference checks pass.
Specialized wording is lower confidence and needs native review. No browser
session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eff57a7ea0">Translate Papiamento Scrum reports and observations</a>. Thanks to xet7.</summary>

Translate 45 Scrum event, state, report and daily-observation messages,
preserving
variables, UTC and observation limits and checking report and sprint semantics.
Three focused translation suites and 21 human-preference checks pass.
Specialized wording is lower confidence and needs native review. No browser
session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f64302d59">Translate Papiamento imports and Scrum planning</a>. Thanks to xet7.</summary>

Translate 45 import instructions and Scrum planning labels, preserving format
keywords, application names, priority syntax and keyboard names.
Four focused translation suites and 21 human-preference checks pass.
Specialized wording is lower confidence and needs native review. No browser
session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9fffd1cb8b">Translate Papiamento board settings and rules</a>. Thanks to xet7.</summary>

Translate 30 board, link-rule, assignment, LDAP, login and block-editor strings,
preserving placeholders, link templates, URLs and configuration names.
Four focused translation suites and 21 human-preference checks pass.
Specialized wording is lower confidence and needs native review. No browser
session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed5d5895b8">Complete current Papiamento Blockly translations</a>. Thanks to xet7.</summary>

Translate 44 variable, workspace, search and alias messages. The current full
fill
list has no Blockly entries; other Papiamento translations remain unfinished.
Four focused translation suites and 21 human-preference checks pass.
Specialized wording is lower confidence and needs native review. No browser or
screen-reader session was run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57b32d6d15">Translate Papiamento Blockly text operations</a>. Thanks to xet7.</summary>

Translate 53 text-operation labels and explanations, preserving variables and
checking text positions, letter case, trimming sides and replacement semantics.
Four focused translation suites and 21 human-preference checks pass.
Specialized wording is lower confidence and needs native review. No browser or
screen-reader session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef911475c0">Translate Papiamento Blockly keyboard shortcuts</a>. Thanks to xet7.</summary>

Translate 41 shortcut and key labels, preserving variables and key names and
checking opposite directions, navigation and movement actions.
Four focused translation suites and 21 human-preference checks pass.
Specialized wording is lower confidence and needs native review. No browser or
screen-reader session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0ae625d8a4">Translate Papiamento Blockly procedures and accessibility modes</a>. Thanks to xet7.</summary>

Translate 28 English procedure, variable and accessibility messages. Preserve
variables; check return values, disabled definitions, rename scope and opposite
screen-reader transitions. Four focused translation suites and 21
human-preference
checks pass. Specialized wording is lower confidence and needs native review.
No browser or screen-reader session was run. Remaining translations are
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5180e1cfb8">Translate Papiamento Blockly trigonometry and workspace</a>. Thanks to xet7.</summary>

Translate 42 English math, variable and workspace messages. Preserve variables,
key names and bases; check angle units, inverse functions and page directions.
Four focused translation suites and 21 human-preference checks pass. Specialized
wording is lower confidence and needs native review. No browser or screen-reader
session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/665c3a17bc">Translate Papiamento Blockly statistics and rounding</a>. Thanks to xet7.</summary>

Translate 32 English math messages. Preserve variables and bases; check random
endpoints, rounding directions and statistical distinctions. Four focused
translation suites and 21 human-preference checks pass. Specialized wording is
lower confidence and needs native review. No browser or screen-reader session
was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09ca8d5909">Translate Papiamento Blockly arithmetic messages</a>. Thanks to xet7.</summary>

Translate 30 English arithmetic messages. Preserve variables, constants, numeric
bounds and notation; check inclusive limits, angle units and number properties.
Four focused translation suites and 21 human-preference checks pass. Specialized
wording is lower confidence and needs native review. No browser or screen-reader
session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b83235800">Translate Papiamento Blockly logic messages</a>. Thanks to xet7.</summary>

Translate 25 English logic messages. Preserve variables and null; check
comparison
boundaries, equality, both/at-least-one inputs, negation and conditional labels.
Four focused translation suites and 21 human-preference checks pass. Specialized
wording is lower confidence and needs native review. No browser or screen-reader
session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/684a5cdb00">Translate Papiamento Blockly list mutation and sorting</a>. Thanks to xet7.</summary>

Translate 42 English list messages. Preserve variables and index markers; check
insertion versus replacement, copies, missing-item results, positions and
sorting.
Four focused translation suites and 21 human-preference checks pass. Specialized
wording is lower confidence and needs native review. No browser or screen-reader
session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30e950f79c">Translate Papiamento Blockly navigation and retrieval</a>. Thanks to xet7.</summary>

Translate 34 English navigation and list messages. Preserve variables; check
retrieval, removal and combined operations, empty-list length and movement
confirmation. Four focused translation suites and 21 human-preference checks
pass. Specialized wording is lower confidence and needs native review. No
browser
or screen-reader session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cae863f672">Translate Papiamento Blockly input roles</a>. Thanks to xet7.</summary>

Translate 44 English list, numeric and text input labels. Preserve variables and
coordinate letters; check positions, loop bounds and division operand roles.
Four focused translation suites and 21 human-preference checks pass. Specialized
wording is lower confidence and needs native review. No browser or screen-reader
session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0b3406e13">Translate Papiamento Blockly fields and icons</a>. Thanks to xet7.</summary>

Translate 35 English field, input, keyboard and icon messages. Preserve numbered
variables and key names; check opposite actions, pixel states, row/column order
and input roles. Four focused translation suites and 21 human-preference checks
pass. Specialized wording is lower confidence and needs native review. No
browser
or screen-reader session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04f20bc654">Translate Papiamento Blockly loops and deletion</a>. Thanks to xet7.</summary>

Translate 35 English loop, condition and editing messages. Preserve numbered
variables; check opposite conditions, fallback branches, loop bounds and
deletion
counts. Four focused translation suites and 21 human-preference checks pass.
Specialized wording is lower confidence and needs native review. No browser or
screen-reader session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46816ff9b5">Translate Papiamento Blockly editing and color messages</a>. Thanks to xet7.</summary>

Translate 30 English Blockly messages. Preserve numbered variables, key names
and
numeric bounds; use the shared placeholder parser in the locale test and clarify
its historical baseline. Four focused translation suites and 21 human-preference
checks pass. Specialized wording is lower confidence and needs native review.
No browser or screen-reader session was run. Remaining translations are
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3eb64a2c19">Translate remaining Yiddish import and history recovery messages</a>. Thanks to xet7.</summary>

Translate 33 remaining English fill-list entries. Check deletion scope, retained
boards, rollback conflicts and read-only settings. The current full Yiddish fill
list is empty. Three focused translation suites and 21 human-preference checks
pass. Specialized wording is lower confidence and needs native review. No
browser
or screen-reader session was run. Broader vocabulary review and translations in
other languages remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c18527c022">Translate Yiddish List Sync recovery messages</a>. Thanks to xet7.</summary>

Translate 23 English recovery messages. Preserve counters; check retained
applied
changes, unwritten pending changes, whole-list access, replayable-operation
protection and the oldest-50 limit. Three focused translation suites and 21
human-preference checks pass. Specialized wording is lower confidence and needs
native review. No browser or screen-reader session was run. Remaining
translations
are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80fdbfff7a">Translate Yiddish activity notification recovery</a>. Thanks to xet7.</summary>

Translate 23 English activity-recovery and rule-email messages. Check retained
work, unavailable source activities, revoked access and permanent cancellation
without recalling queued mail or delivered notifications. Three focused
translation
suites and 21 human-preference checks pass. Specialized wording is lower
confidence
and needs native review. No browser or screen-reader session was run. Remaining
translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d02ac276a">Translate Yiddish Sync planning and notification diagnostics</a>. Thanks to xet7.</summary>

Translate 30 English Sync, mail-failure and activity-recovery messages. Preserve
variables and literals; check missing/null values, matching, first-sync planning
retention, retries and temporary/permanent failures. Three focused translation
suites and 21 human-preference checks pass. Specialized wording is lower
confidence
and needs native review. No browser or screen-reader session was run. Remaining
translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/26a63bf7c5">Translate Yiddish Sync source and run reports</a>. Thanks to xet7.</summary>

Translate 25 English source-field and run-report messages. Check display and
retention limits, hidden values, possible partial changes and reports that do
not resume or undo runs. Three focused translation suites and 21
human-preference
checks pass. Specialized wording is lower confidence and needs native review.
No browser or screen-reader session was run. Remaining translations are
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9527ce88c">Translate Yiddish Sync conflicts and preview</a>. Thanks to xet7.</summary>

Translate 25 English conflict and preview messages. Check retained content,
unchanged source data and subcards, limited-review scope and replacement reuse.
Three focused translation suites and 21 human-preference checks pass.
Specialized
wording is lower confidence and needs native review. No browser or screen-reader
session was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe18e6aaeb">Translate Yiddish Scrum imports and observations</a>. Thanks to xet7.</summary>

Translate 35 English Scrum import, observation and partial-report messages.
Preserve counters and references; check observation limits, unknown estimates,
duplicate prevention and unchanged foreign-board cards. Three focused
translation
suites and 21 human-preference checks pass. Specialized wording is lower
confidence
and needs native review. No browser or screen-reader session was run. Remaining
translation work is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b51991d93b">Translate Yiddish sprint planning and reports</a>. Thanks to xet7.</summary>

Translate 45 English Scrum planning, release and reporting messages. Preserve
counters and shortcuts; check unknown estimates versus zero, comparison units,
release removal scope, sprint states and close/cancel outcomes. Three focused
translation suites and 21 human-preference checks pass. Specialized Scrum
wording
is lower confidence and needs native review. No browser or screen-reader session
was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6da6a7fec">Translate Yiddish rule validation and Scrum settings</a>. Thanks to xet7.</summary>

Translate 30 English rule-editor and Scrum labels. Check exact trigger/action
limits, reload-before-save conflicts, administrator permissions and distinct
completion policies. Four focused translation suites and 21 human-preference
checks pass. Specialized Scrum wording is lower confidence and needs native
review. No browser or screen-reader session was run. Remaining translations
are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a1265408c6">Translate Yiddish imports and settings messages</a>. Thanks to xet7.</summary>

Translate 23 English board, import, link-rule, LDAP and login messages. Preserve
variables, import syntax, configuration names and examples; check movement
directions, read-only permissions and empty-domain behavior. Four focused
translation suites and 21 human-preference checks pass. Specialized wording is
lower confidence and needs native review. No browser or screen-reader session
was run. Remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80e6c6982e">Finish Yiddish Blockly search and legacy label translations</a>. Thanks to xet7.</summary>

Translate the last 20 English Blockly fill-list entries in Yiddish. Preserve
search variables and shortcuts; check navigation and legacy-label consistency.
No Blockly entries remain in the full Yiddish fill list. Four focused
translation
suites and 21 human-preference checks pass. Specialized wording is lower
confidence
and needs native review. No browser or screen-reader session was run. Other
Yiddish messages and the wider translation backlog remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ad1f9bd95">Translate Yiddish Blockly text values and workspace counts</a>. Thanks to xet7.</summary>

Translate 45 English text, variable and workspace messages. Preserve variables
and joined announcement spacing; check trimming directions, copied results,
replacement scope and zero/one/many counts. Four focused translation suites and
21 human-preference checks pass. Specialized wording is lower confidence and
needs native review. No browser or screen-reader session was run. Remaining
translation work is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62e6109cab">Translate Yiddish Blockly text position messages</a>. Thanks to xet7.</summary>

Translate 45 English text and navigation messages. Preserve variables and index
markers; check scrolling directions, letter cases, first/last and end-relative
positions, copying and missing-text results. Four focused translation suites and
21 human-preference checks pass. Specialized wording is lower confidence and
needs native review. No browser or screen-reader session was run. Remaining
translation work is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8408baacc1">Translate Yiddish Blockly shortcuts and accessibility</a>. Thanks to xet7.</summary>

Translate 45 English procedure, shortcut and screen-reader messages. Preserve
variables; check directional pairs, abort/finish actions, function scope and
opposite screen-reader state transitions. Four focused translation suites and
21 human-preference checks pass. Specialized wording is lower confidence and
needs native review. No browser or screen-reader session was run. Remaining
translation work is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/919c0f46ea">Translate Yiddish Blockly functions and trigonometry</a>. Thanks to xet7.</summary>

Translate 45 English function, variable, navigation and trigonometry messages.
Preserve variables and key names; check angle units, inverse functions, return
values, disabled definitions and page direction. Four focused translation suites
and 21 human-preference checks pass. Specialized wording is lower confidence and
needs native review. No browser or screen-reader session was run. Remaining
translation work is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89421b54b9">Translate Yiddish Blockly statistics and rounding</a>. Thanks to xet7.</summary>

Translate 45 English math messages, preserving variables and notation. Check
random-number endpoints, rounding directions, minimum/maximum, statistical
operations and sign inversion. Four focused translation suites and 21
human-preference checks pass. Specialized mathematical wording is lower
confidence
and needs native review. No browser or screen-reader session was run.
Remaining translation work is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc67a1295e">Translate Yiddish Blockly comparisons and arithmetic</a>. Thanks to xet7.</summary>

Translate 45 English logic and arithmetic messages. Preserve variables and
mathematical notation; check strict/inclusive comparisons, both/either
conditions,
inclusive bounds and angle units. Four focused translation suites and 21
human-preference checks pass. Specialized mathematical wording is lower
confidence
and needs native review. No browser or screen-reader session was run.
Remaining translation work is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e6ec95241">Translate Yiddish Blockly list mutation and logic</a>. Thanks to xet7.</summary>

Translate 45 English list and logic messages, preserving variables and index
markers. Check insertion versus replacement, operations on copies, missing-item
results and Boolean values. Four focused translation suites and 21
human-preference
checks pass. Specialized programming wording is lower confidence and needs
native
review. No browser or screen-reader session was run. Remaining translations
are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e4dfedb616">Translate Yiddish Blockly navigation and list messages</a>. Thanks to xet7.</summary>

Translate 50 English text-input, keyboard-navigation and list messages. Preserve
variables and position markers; distinguish retrieval, removal and combined
operations, first/last positions and copy/cut hints. Four focused translation
suites and 21 human-preference checks pass. Specialized programming wording is
lower confidence and needs native review. No browser or screen-reader session
was run. Remaining translation work is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1e46548b2">Translate Yiddish Blockly field and input labels</a>. Thanks to xet7.</summary>

Translate 65 English field, input, keyboard and icon labels. Preserve variables,
coordinate letters and key names; check row/column order, start/end positions
and opening/closing actions. Four focused translation suites and 21
human-preference checks pass. Specialized programming wording is lower
confidence
and needs native review. No browser or screen-reader session was run.
Remaining translation work is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3e393860a">Translate Yiddish Blockly control messages</a>. Thanks to xet7.</summary>

Translate 65 English Blockly messages for colors, loops, conditions, keyboard
labels and deletion prompts. Preserve numbered variables and numeric bounds;
check forbidden deletion, loop-only use and opposite loop conditions. Four
focused translation suites and 21 human-preference checks pass. Specialized
programming wording is lower confidence and needs native review. No browser or
screen-reader session was run. Remaining translation work is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/798aab05fd">Translate Afrikaans planning and settings messages</a>. Thanks to xet7.</summary>

Translate 51 English messages in each Afrikaans catalog (102 values), covering
planning, imports, link rules and settings. Preserve variables and technical
examples, with regression checks for first-sync retention and conflict recovery.
Both current fill lists are empty. Four focused translation suites and 21
human-preference checks pass. No browser or screen-reader session was run.
Broader vocabulary review and translations in other languages are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c2a42d0a4b">Translate Afrikaans interrupted import recovery messages</a>. Thanks to xet7.</summary>

Translate 25 English import recovery messages in both Afrikaans catalogs
(50 values). Preserve variables and terminology; check deletion of later
additions, retaining partial data, foreign-board protection and Scrum recovery.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f24679213d">Translate Afrikaans List Sync recovery messages</a>. Thanks to xet7.</summary>

Translate 23 English recovery messages in both Afrikaans catalogs (46 values).
Preserve counters and existing terminology, with checks for retained changes,
unwritten changes, revoked access, replayability and the oldest-50 limit.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dab22934dd">Translate Icelandic planning and settings messages</a>. Thanks to xet7.</summary>

Translate 51 English messages for planning, imports, link rules, settings and
Scrum recovery. Preserve variables, import syntax and configuration literals;
check retention, conflict recovery and read-only settings. The fill list is
empty.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and translations in other languages are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9eb05f7b76">Translate Icelandic interrupted import recovery messages</a>. Thanks to xet7.</summary>

Translate 25 English import recovery messages into Icelandic. Preserve variables
and existing terminology; check deletion of later additions, retaining partial
data, foreign-board protection, Scrum recovery and the oldest-50 limit.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0811c1a54b">Translate Icelandic List Sync recovery messages</a>. Thanks to xet7.</summary>

Translate 23 English recovery messages into Icelandic. Preserve counters and
existing terminology, with checks for retained changes, unwritten changes,
revoked access, replayable operations and the oldest-50 display limit.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64babf0506">Translate Albanian planning and settings messages</a>. Thanks to xet7.</summary>

Translate 51 English messages for planning, imports, link rules, settings and
Scrum recovery. Preserve variables, import syntax and configuration literals;
check retention, conflict recovery and read-only settings. The fill list is
empty.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and translations in other languages are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/465366cb58">Translate Albanian interrupted import recovery messages</a>. Thanks to xet7.</summary>

Translate 25 English import recovery messages into Albanian. Preserve variables
and existing terminology; check deletion of later additions, retaining partial
data, foreign-board protection, Scrum recovery and the oldest-50 limit.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efdce09e90">Translate Albanian List Sync recovery messages</a>. Thanks to xet7.</summary>

Translate 23 English recovery messages into Albanian. Preserve counters and
existing terminology; check retained changes, unwritten changes, revoked access
and replayability. Clarify that the older test reports a historical baseline.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4cd73669d">Translate Belarusian planning and settings messages</a>. Thanks to xet7.</summary>

Translate 51 English messages for planning, imports, link rules, settings and
Scrum recovery. Preserve variables, import syntax and configuration literals;
check retention, conflict recovery and read-only settings. The fill list is
empty.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and translations in other languages are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f5bb20772d">Translate Belarusian interrupted import recovery messages</a>. Thanks to xet7.</summary>

Translate 25 English import recovery messages into Belarusian. Preserve
variables
and existing terminology; check deletion of later additions, retaining partial
data, foreign-board protection, Scrum recovery and the oldest-50 limit.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/da560a776e">Translate Belarusian List Sync recovery messages</a>. Thanks to xet7.</summary>

Translate 23 English recovery messages into Belarusian. Preserve counters and
existing terminology, with checks for retained changes, unwritten changes,
revoked access, replayable operations and the oldest-50 display limit.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bda123a348">Recognize native Upper Sorbian minimum labels</a>. Thanks to xet7.</summary>

Recognize the existing minimum labels for numeric bounds and the list operator
as native Upper Sorbian. Scope the exception to exact locale, key and source
value; other locales and later English prose remain reportable.

Four focused translation suites and 21 human-preference checks pass.
Language evidence is recorded in the translation audit. No screen-reader
session was run; remaining translations and vocabulary review are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9a0ddb5d7">Recognize native Silesian and Upper Sorbian mathematical labels</a>. Thanks to xet7.</summary>

Recognize the existing plus/minus accessibility labels as native words in
Silesian and Upper Sorbian. Scope the exception to exact locale, key and source
value; other locales, prose and unverified minimum labels remain reportable.

Four focused translation suites and 21 human-preference checks pass.
Language references are recorded in the translation audit. No screen-reader
session was run; remaining translations and vocabulary review are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04ebc07f34">Translate Serbian planning and settings messages</a>. Thanks to xet7.</summary>

Translate 51 English messages for planning, imports, link rules, settings and
Scrum recovery. Preserve variables, import syntax and configuration literals;
check retention, conflict recovery and read-only settings. The fill list is
empty.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and translations in other languages are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dbc4bdb2ce">Translate Serbian interrupted import recovery messages</a>. Thanks to xet7.</summary>

Translate 25 English import recovery messages into Serbian. Preserve variables
and existing terminology; check deletion of later additions, retaining partial
data, foreign-board protection, Scrum recovery and the oldest-50 limit.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29285219e6">Translate Serbian List Sync recovery messages</a>. Thanks to xet7.</summary>

Translate 23 English recovery messages into Serbian. Preserve counters and
existing terminology, with checks for retained changes, unwritten changes,
revoked access, replayable operations and the oldest-50 display limit.

All 298 translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/26554c3975">Translate Macedonian planning and settings messages</a>. Thanks to xet7.</summary>

Translate 51 English messages for planning, imports, link rules, settings and
Scrum recovery. Preserve variables, import syntax and configuration literals;
check retention, conflict recovery and read-only settings. The fill list is
empty.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and translations in other languages are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32a1670b03">Translate Macedonian List Sync recovery messages</a>. Thanks to xet7.</summary>

Translate 23 English recovery messages into Macedonian. Preserve counters and
board/list terminology, with checks for retained changes, unwritten changes,
revoked access, replayable operations and the oldest-50 display limit.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ff83bf51d">Translate Macedonian interrupted import recovery messages</a>. Thanks to xet7.</summary>

Translate 25 English import recovery messages into Macedonian. Preserve
variables
and existing terminology; check deletion of later additions, retaining a partial
board, foreign-board protection, Scrum recovery and the oldest-50 limit.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a86e699ad8">Translate Bosnian planning and settings messages</a>. Thanks to xet7.</summary>

Translate 51 English messages for planning, imports, link rules, settings and
Scrum recovery. Preserve variables, import syntax and configuration literals;
check retention, conflict recovery and read-only settings. The fill list is
empty.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and translations in other languages are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/220394061d">Translate Bosnian interrupted import recovery messages</a>. Thanks to xet7.</summary>

Translate 25 English import recovery messages into Bosnian. Preserve variables
and existing terminology; check deletion of later additions, retaining a partial
board, foreign-board protection, Scrum recovery and the oldest-50 limit.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dcf55cecbe">Translate Bosnian List Sync recovery messages</a>. Thanks to xet7.</summary>

Translate 23 English recovery messages into Bosnian. Preserve counters and
board/list terminology, with checks for retained changes, unwritten changes,
revoked access, replayable operations and the oldest-50 display limit.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/41115d4633">Translate Croatian planning and settings messages</a>. Thanks to xet7.</summary>

Translate 51 English messages for planning, imports, link rules, settings and
Scrum recovery. Preserve variables, import syntax and configuration literals;
check retention, conflict recovery and read-only settings. The fill list is
empty.

Five focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and translations in other languages are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f4e758ede0">Translate Croatian List Sync recovery messages</a>. Thanks to xet7.</summary>

Translate 23 English recovery messages into Croatian. Preserve counters and
explain retained changes, discarded pending changes, revoked access, replayable
operations and the oldest-50 limit, with regression coverage for each
distinction.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb9b6e442e">Correct Croatian monitoring and flow explanations</a>. Thanks to xet7.</summary>

Correct 66 Cyrillic-containing values in jobs, monitoring, flow explanations
and time adjustments. Preserve variables and technical names. Check forecast
limits, missing history, sample thresholds and correction semantics.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further vocabulary review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/47fb6b7d5a">Correct Croatian migration and storage translations</a>. Thanks to xet7.</summary>

Replace 80 Serbian values with Croatian. Cover migrations, S3 storage,
monitoring and schedules. Preserve variables and product names, with checks
for credential types, migration outcomes, export actions and schedule intervals.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further wrong-language review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3292273b5d">Correct Croatian administration and support translations</a>. Thanks to xet7.</summary>

Replace 75 Serbian values with Croatian. Cover request states, checklists,
attachments, accounts, support, accessibility and scheduled jobs. Preserve
variables and Mongo, with regression checks for opposite actions and outcomes.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further wrong-language review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/83510c32db">Correct Croatian search predicates and report translations</a>. Thanks to xet7.</summary>

Correct 65 Serbian values in search predicates, pagination, reports, sorting
and wait indicators. Restore the Arial font literal, preserve Cc and variables,
and check searchable tokens and distinctions between states and actions.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further wrong-language review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/97d0483ca8">Correct Croatian search and notification translations</a>. Thanks to xet7.</summary>

Replace 80 Serbian values with Croatian. Cover search, notifications, weekdays,
organizations, assignments and card views. Preserve variables and unique search
abbreviations; test operator syntax and distinctions between actions and roles.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further wrong-language review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e629bbf57">Correct Croatian rule actions and triggers</a>. Thanks to xet7.</summary>

Replace 80 Serbian values with Croatian. Cover rule triggers, actions,
checklists, dates and layout controls. Preserve variables and comma-separated
examples, with regression checks for opposite actions and date meanings.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further wrong-language review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9dee3f53da">Correct Croatian card settings and rule translations</a>. Thanks to xet7.</summary>

Replace 70 Serbian values with Croatian. Cover system labels, card settings,
deletion notices, activity messages and rules. Preserve source variables, with
regression checks for deletion, label actions, parent paths and rule controls.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further wrong-language review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a463241478">Correct Croatian sidebar and email settings translations</a>. Thanks to xet7.</summary>

Replace 75 Serbian values with Croatian. Cover sidebars, uploads, time labels,
SMTP, email templates, webhooks and system labels. Preserve variables and
technical names, with regression checks for action and message distinctions.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further wrong-language review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/332f6524ea">Correct Croatian filters and archive translations</a>. Thanks to xet7.</summary>

Replace 70 Serbian values with Croatian. Cover filters, imports, archive
guidance, settings, selection controls and shortcuts. Preserve variables,
format names and distinctions between copying, moving and assignment.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further wrong-language review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7ee6ee455e">Correct Croatian permissions and email translations</a>. Thanks to xet7.</summary>

Replace 65 Serbian values with Croatian, covering permissions, email, errors,
exports, sorting and date filters. Restore literal date-format patterns and
preserve source variables and restricted-permission meanings.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further wrong-language review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46c4274729">Correct Croatian workspace and board controls</a>. Thanks to xet7.</summary>

Replace 70 Serbian values with Croatian. Cover activity messages, workspaces,
board controls, visibility, voting, colors and comment permissions. Preserve
variables, HTML emphasis and the numeric zoom range.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further wrong-language review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b42a35dc2c">Translate Croatian import recovery and correct core labels</a>. Thanks to xet7.</summary>

Fill 25 interrupted-import messages and replace Serbian board and swimlane
labels with Croatian, for 27 corrected values. Preserve source variables
and recovery choices, including permanent deletion and unrelated boards.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further wrong-language review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2228f212d0">Translate Slovenian controls and planning</a>. Thanks to xet7.</summary>

Fill 51 messages in each Slovenian catalog, for 102 values. Cover controls,
import guidance, LDAP, login settings, planning imports and history recovery.
Preserve variables, literal examples, matching priority and recovery choices.

Five focused translation suites and 21 human-preference checks pass.
Both current Slovenian fill lists are empty. No browser or screen-reader session
was run; other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1603813d9d">Translate Slovenian stalled synchronization recovery</a>. Thanks to xet7.</summary>

Fill 23 messages in each Slovenian catalog, for 46 values. Preserve variables,
retained applied changes, unwritten pending changes and recovery choices.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Remaining translations and
broader linguistic review are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/552c154307">Correct Slovenian monitoring and flow translations</a>. Thanks to xet7.</summary>

Replace 81 Serbian values in each Slovenian catalog, for 162 corrections.
Cover monitoring, migrations and flow-analysis explanations. Preserve variables,
time units, numeric limits and caveats about history and forecasts.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Remaining translations and
linguistic review of Latin-script text are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04e6c6f0b2">Correct Slovenian administration and migration translations</a>. Thanks to xet7.</summary>

Replace 80 Serbian values in each Slovenian catalog, for 160 corrections.
Cover support, account locks, storage, scheduled jobs and migrations.
Preserve variables and distinguish credentials and pause/start/stop actions.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further wrong-language review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1019dd7970">Correct Slovenian card details and upload translations</a>. Thanks to xet7.</summary>

Replace 70 Serbian values in each Slovenian catalog, for 140 corrections.
Cover card details, ticket states, checklists, uploads and translation controls.
Preserve variables and Cc notation, and distinguish copying from moving.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further wrong-language review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1750705857">Correct Slovenian search and card view translations</a>. Thanks to xet7.</summary>

Replace 75 Serbian values in each Slovenian catalog, for 150 corrections.
Cover search operators, predicates, card views, sorting and related labels.
Preserve variables, restore Arial and verify unique search abbreviations.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further wrong-language review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eebff1cdfc">Correct Slovenian settings and notification translations</a>. Thanks to xet7.</summary>

Replace 70 Serbian values in each Slovenian catalog, for 140 corrections.
Cover filters, settings, uploads, notifications, weekdays and task labels,
preserving variables, format names and count-label spacing.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further wrong-language review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c55b838ac">Correct Slovenian workspace and board controls</a>. Thanks to xet7.</summary>

Replace 65 Serbian values in each Slovenian catalog, for 130 corrections.
Cover workspaces, board controls, views, voting, comments, export and date
filters while preserving variables and the zoom range.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Further wrong-language review
and remaining translations are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/841a5aaeda">Translate Slovenian import recovery and correct core labels</a>. Thanks to xet7.</summary>

Fill 25 interrupted-import messages in each Slovenian catalog and replace
Serbian board and swimlane labels with Slovenian, for 54 corrected values.
Preserve variables and recovery choices, including permanent deletion.

Four focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Remaining translations and
further wrong-language review are unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a9629d4f7">Translate Bulgarian controls and planning</a>. Thanks to xet7.</summary>

Fill 51 messages covering controls, import guidance, LDAP, login settings,
planning imports and history recovery. Preserve variables, literal examples,
matching priority, non-duplication and recovery choices.

Four focused translation suites and 21 human-preference checks pass.
The current Bulgarian fill list is empty. No browser or screen-reader session
was run; other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae15d9657f">Translate Bulgarian import and synchronization recovery</a>. Thanks to xet7.</summary>

Fill 48 recovery messages, preserving source variables, existing translations,
permanent deletion warnings and retention of changes already applied.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Remaining Bulgarian messages,
other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03839e6225">Translate Lithuanian controls and planning</a>. Thanks to xet7.</summary>

Fill 51 messages covering controls, import guidance, LDAP, login settings,
planning imports and history recovery. Preserve variables, literal examples,
matching priority, non-duplication and recovery choices.

Four focused translation suites and 21 human-preference checks pass.
The current Lithuanian fill list is empty. No browser or screen-reader session
was run; other languages and linguistic review remain unfinished.

</details>

# v12.24 2026-10-08 WeKan ® release

**In short:** The login settings left open in October are finished:
**header login** is environment-only, **automatic logout** works again,
**LDAP** gets an honest Test connection and Sync now, and **secrets from
files** cover database, mail and S3. Boards import and export as **Todoist**,
**OPML** and **Org mode**, **rules** can set assignees, **webhooks** name the
people they are about, and **OAuth providers** can be limited to email
domains. **Scrum** planning syncs from Jira and GitLab and imports into an
existing board, and an **interrupted import** can be kept or discarded.
Seventeen long-open requests were closed as already implemented.

This release adds the following new features:

**Import and export** - three more formats, each a round trip with a loss
report for what the other tool has no place for.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee0806b4c0">Translate Manx release and stuck Sync recovery messages</a>. Thanks to xet7.</summary>

- Translate 25 pending messages, preserving release selection, applied/total
  counters, discard consequences and oldest-first limits. Manx now has no
  reported placeholders; older language defects still require review.
- Three relevant suites pass. Complete wording remains low-confidence pending
  fluent review. Browser and screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8378a4c706">Translate remaining reported Manx controls and guidance</a>. Thanks to xet7.</summary>

- Translate 47 messages, preserving import syntax, environment names, report
  limits and named variables. The ordinary Manx backlog is cleared; 25 newly
  added pending messages and older language quality remain under review.
- Four relevant suites pass. Complete grammar remains low-confidence pending
  fluent review. Browser and screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30013762c3">Translate Manx Sync conflicts and diagnostic reports</a>. Thanks to xet7.</summary>

- Translate 63 messages while preserving source/local distinctions, missing/null
  behavior, retention limits and reports that cannot resume or undo changes.
- Three relevant suites pass. Sync terminology and full grammar remain
  low-confidence pending fluent review. Browser and screen-reader sessions
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0691f5589d">Translate Manx notification delivery and recovery messages</a>. Thanks to xet7.</summary>

- Translate 36 messages while preserving temporary/permanent rejection,
  missing/changed activities, pause/cancel distinctions and non-recall warnings.
- Three relevant suites pass. Delivery terminology and full grammar remain
  low-confidence pending fluent review. Browser and screen-reader sessions
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e54ad20004">Translate Manx Scrum planning labels and states</a>. Thanks to xet7.</summary>

- Translate 71 planning, estimate, event, state and report labels/messages.
  Preserve named variables, time units and distinct completion/cancellation
  states. Extend the Manx suite to use the shared placeholder scanner.
- Three relevant suites pass. Scrum terminology and grammar remain
  low-confidence
  pending fluent review. Browser and screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1d3de6691">Restore Asana and OpenProject import literals</a>. Thanks to xet7.</summary>

- Repair 16 messages in 11 locale files, restoring the data property and API
  endpoints. Extend catalog-wide literal checks to ten import formats while
  accepting valid grammatical affixes around filenames and commands.
- Three relevant suites and 21 human-preference checks pass. Mixed-language
  prose and untranslated messages remain under review. Browser sessions were
  not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/416aedc706">Restore import example identifiers across locales</a>. Thanks to xet7.</summary>

- Repair 73 Kanboard, Deck, ZenKit and Jira import messages in 25 locale files.
  Restore case-sensitive field names and API paths, preserving surrounding
  prose and valid quotation styles. Test these literals across every locale.
- All 322 translation/i18n suites pass, including positive and negative checks
  for localized typography and damaged identifiers. Other import formats and
  mixed-language prose remain under review. Browser sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e33df4be4c">Repair Bislama import instructions and literal examples</a>. Thanks to xet7.</summary>

- Correct 13 mixed-language import instructions and translate OPML and Org mode
  help. Restore JSON field names and the Jira endpoint while preserving format
  syntax, menu actions and interpolation variables.
- Three relevant suites pass. A broader literal scan found 103 candidate entries
  in 45 locale files; some are valid quotation variants, others need repair.
  Full prose remains provisional; browser sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c082ec6e5">Replace remaining Bislama artificial English wrappers</a>. Thanks to xet7.</summary>

- Correct 236 storage, migration, backup and report values. Preserve provider
  identifiers, time units, simulation limits, uncertainty and counting rules.
  The explicit “Tok blong sistem:” queue is empty; other mixed-language text
  and damaged technical examples still require review.
- Three relevant suites pass, including the catalog-wide token inventory.
  Statistical terminology and complete technical prose remain low-confidence.
  Browser and screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d332e18edb">Correct Bislama search syntax and report translations</a>. Thanks to xet7.</summary>

- Correct 76 artificial English wrappers and 12 search labels/messages.
  Use valid one-word query operators, preserve portable abbreviations and
  verify quoted values, missing fields and invalid input with the real parser.
  The remaining wrapper queue contains 236 values.
- Four relevant suites pass, including catalog-wide placeholders and parser
  execution. Technical compounds remain provisional pending fluent review.
  Browser and screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1eabb367e7">Boards import and export as Todoist project templates (CSV)</a>. Thanks to xet7.</summary>

Sections become lists, tasks cards, indented sub-tasks a checklist and notes
comments. `@label` words and priorities p1-p3 become labels, RESPONSIBLE the
owner, and DATE and DEADLINE the start and due dates. Recurring dates in
words, durations and orphan rows are reported. Export writes Todoist's own
columns and `view_style=board` row. `tests/todoistCsv.test.cjs` covers quoted
fields, the round trip and the negatives; a Playwright case imports through
the page.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6c8f85518">Boards import and export as OPML outlines from Workflowy, Dynalist, Logseq and others</a>. Thanks to xet7.</summary>

Top-level outlines become lists, their children cards with `_note` as the
description, and deeper outlines checklists; a completed item is marked done.
Like the Leo outline the XML is parsed on the server only, never resolving
DTDs or external entities. `tests/opmlOutline.test.cjs` includes an external
entity and a node bomb among its negatives; a Playwright case imports through
the page.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/711303af32">Boards import and export as Org mode outlines</a>. Thanks to xet7.</summary>

Level-1 headings become lists and level-2 headings cards, keeping TODO
keywords (including custom `#+TODO` ones), priorities, tags, SCHEDULED,
DEADLINE and CLOSED, and turning checkboxes and deeper headings into
checklists. Timestamps have no zone in Org and are read as UTC; repeaters are
reported. `tests/orgMode.test.cjs` covers custom keywords, localized day names
and the round trip; a Playwright case imports through the page.

</details>

**Rules** - the two parts of making rules less clunky that were still open.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f735eba194">A rule can set and clear assignees, and needs no title</a>. Thanks to xeruf and xet7.</summary>

Add and Remove assignee actions take a username, a `{creator}` style token,
the user who triggered the rule, or every assignee, and are durable through
Sync like the member actions - so a new card can be assigned to its creator,
as [#4294](https://github.com/wekan/wekan/issues/4294) asked. A rule added
without a title is named after its trigger and action and renamed in place.
This also fixed "Remove all members from the card", which iterated the
assignees while removing members, so it removed only people who were both;
its guards now read `models/cards.js` instead of assuming the field. A
Playwright case creates an untitled rule and a card that gets its creator as
assignee.

</details>

- [A rule can fire when a card moves forward to a later list or back to an earlier one](https://github.com/wekan/wekan/commit/eac524380f). Thanks to rlach and xet7.

**Scrum** - planning a card across releases, and bringing planning in from
elsewhere.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/958e9e13f3">GitLab, OpenProject and Asana imports bring their sprints and releases</a>. Thanks to xet7.</summary>

Only Jira imports created Scrum planning. GitLab iterations and milestones,
OpenProject versions and sprints, and Asana milestone tasks now become sprints
and releases with their dates and state, through the same journaled stage as
Jira, so an interrupted import is recovered the same way; OpenProject story
points become the estimate field. Trello has none, and its Power-Up data is
counted in the loss report. What an export cannot prove - a finished sprint,
a bad date, an unknown state - is reported, never invented. GitLab and
OpenProject exports write the planning back.
`tests/externalScrumPlanning.test.cjs`
covers each source and the negatives.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/727ceedd01">A card can be in more than one release</a>. Thanks to xet7.</summary>

A card had one release, so Jira import kept only an issue's first fix version
and Jira export wrote none. Releases are now a list, with the old single
field kept as its first entry so older readers still see one; existing cards
are read the same way and move to the list on their next Scrum save. Every
release must belong to the board. Copies and moves link each release by name,
the native transfer and Jira import and export carry them all, Board View /
Sprints shows each release's cards and progress, and the Product Backlog and
card details pick several. `tests/scrumMultipleReleases.test.cjs` fails if any
code reads the single field directly.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c06bf8d0e9">List Sync brings an issue's sprint and releases into Scrum planning</a>. Thanks to xet7.</summary>

While Scrum is enabled on the board, List Sync from Jira or GitLab carries an
issue's sprint and fix versions or milestones into the card's planning. A
missing sprint or release is created with the source's dates; an existing one
is matched by its source ID, then by name. A local planning change stays until
the source changes that issue's planning, and a first Sync never removes
planning. The writes go through the durable Sync journal.
`tests/listSyncPlanning.test.cjs` covers matching, creation and the
negatives; a Meteor test and a Playwright spec drive it end to end. It has not
been verified against live Jira or GitLab.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef54907836">Scrum planning can be imported into a board that already exists</a>. Thanks to xet7.</summary>

Every Scrum import created a new board. A board administrator can now import
a wekan-scrum-2 transfer or a WeKan board export into the current board from
the Sprints view, with a Preview that writes nothing. Sprints and releases are
matched by ID, then provenance, then a name unique on both sides, and the rest
are created once, so a second import of the same file changes nothing. Cards
are only matched, never created; unmatched, ambiguous and other boards' cards
are reported. The writes use the journaled Scrum import stage and are one
Scrum History change. `tests/scrumTransferMerge.test.cjs` covers it.

</details>

**Sync and recovery** - what an administrator can do about a stuck Sync.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8fac5e85c">An interrupted board import can be kept or discarded in Recovery</a>. Thanks to xet7.</summary>

An import that stopped halfway left a partial board nothing recorded. Every
board import, copy, Trello zip and Trello API import now records its run,
with the new board's id, before the first write, and the board carries the
run's id. A heartbeat keeps the run alive; a scan flags a stopped or failed
run once in Admin Panel → Problems → Recovery, where an administrator keeps
the partial board or discards it. Discard removes only the board stamped with
that run, through the board's own removal, and is refused while its Scrum
stage is busy. Resume is deliberately not offered, because the source file is
not kept: import it again. `tests/importRuns.test.cjs` covers both decisions
and the refusals.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb69750b17">A List Sync operation that can never be replayed can be discarded in Recovery</a>. Thanks to xet7.</summary>

When a list was removed, recreated or reconfigured, or its actor lost write
access, its saved Sync operation failed every minute with a console line and
blocked that list's Sync. It is now marked once in Admin Panel → Problems →
Recovery, a blocked manual Sync says why, and an administrator can discard it
while the replay checks still fail. The discard holds the list's Sync lease,
records one decision and writes no card; a retry or a second administrator
only finishes it. `tests/listSyncStuck.test.cjs` covers the refusals and a
second discard; a Playwright case drives the Recovery page.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ad9813c09">A Scrum undo or redo stuck on a conflict can be rolled back or discarded</a>. Thanks to xet7.</summary>

Such a checkpoint blocked every Scrum edit on its board for good, as only its
author could retry it and every retry failed the same way. A board
administrator now sees it in the History recovery notice and can roll it
back, when nobody changed its records since, or keep the board as it is;
either way is recorded in Recovery, a repeat is a no-op, and
`releases/recover-scrum-history.cjs` does the same offline. A checkpoint not
stuck on a conflict stays its author's to retry.

</details>

**Custom fields** - who may change a field's value.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/87ae8895c3">A custom field can be read-only: every member sees it, only board admins set it</a>. Thanks to CarloRampini and xet7.</summary>

For a score or a value computed elsewhere
([#3143](https://github.com/wekan/wekan/issues/3143)). The card offers editing
only to board admins, and the server refuses anybody else through the same
write guard as admin-only fields, so the REST API and rules acting as an admin
still set it.

</details>

**Webhooks** - what an outgoing webhook says about an event.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f413c12eb">An outgoing webhook names the list, board, swimlane, card link and the person assigned</a>. Thanks to chrisi51 and xet7.</summary>

The payload carried mostly ids, and for an assignment it said who assigned
but not who was assigned. The default payload now also has `list`, `board`,
`swimlane` and `url`, `member` and `memberUsername` for joining or leaving a
card, and `assignee`, `assigneeUsername` and `assigneeId` for an assignment
([#3297](https://github.com/wekan/wekan/issues/3297)), so a chat integration
can message that person. `WEBHOOKS_ATTRIBUTES` still replaces the list.

</details>

**People and lists** - two small requests that only needed doing.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b426f9cfa8">A user without an avatar can be shown one from DEFAULT_AVATAR_URL</a>. Thanks to jLouzado and xet7.</summary>

An environment-only URL template - an intranet photo server or a
Gravatar-style service - with `{username}`, `{userId}`, `{emailMd5}` or
`{emailSha256}` replaced ([#824](https://github.com/wekan/wekan/issues/824)).
The browser is redirected there; the server fetches nothing. An uploaded
avatar always wins, and the initials come back when the image does not load.

</details>

- [Accounts created by an OAuth2/OIDC login can join a default organization, OAUTH2_DEFAULT_ORGANIZATION](https://github.com/wekan/wekan/commit/dfcd115ff3). Thanks to vasyugan and xet7.
- [A card moved or copied to another board brings its labels, created there when the mover is that board's admin](https://github.com/wekan/wekan/commit/125e0960eb). Thanks to d3dbit and xet7.
- [A board view chosen on a board stays on that board instead of changing every board](https://github.com/wekan/wekan/commit/80fb317fda). Thanks to DimDz, Meeques and xet7.
- [A list can colour the cards that have no colour of their own, so cards change colour as they move](https://github.com/wekan/wekan/commit/998a9cc336). Thanks to C0rn3j and xet7.
- [Each board can have an announcement of its own, shown to its members until dismissed](https://github.com/wekan/wekan/commit/7ccd987eb1). Thanks to TiibCD and xet7.
- [References like [TK:1223] link to other tools through rules with {identifier} and abbreviations](https://github.com/wekan/wekan/commit/ed993fef84). Thanks to rzoss and xet7.
- [Lists can be archived and restored through the REST API](https://github.com/wekan/wekan/commit/0a80496acf). Thanks to stevekiss and xet7.

and hardens the login settings:

**Admin Panel / People** - the login settings the 2026-10-05 work left open,
each now doing what its name says.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7628504f1">Header login is set by the environment only, and shown read-only in the Admin Panel</a>. Thanks to xet7.</summary>

With `HEADER_LOGIN_ID` and `HEADER_LOGIN_TRUSTED_IPS` set, a proxy at a
trusted address signs in as anyone it names. Since the 2026-10-05 Admin Panel
work a site administrator could switch that on from People / Header login, so
a stolen administrator session was enough to open every account. The six
`HEADER_LOGIN_*` settings now come from the environment only: a value stored
in the Admin Panel by an earlier version is ignored, the pane shows the values
in effect read-only with no Save button, and a save sent by hand is refused
and shown in Admin Panel → Problems as ProxyBleed. Every other login section
stays overridable. `tests/authConfigCatalog.test.cjs` pins the resolution, the
refusal and that only this section is environment-only; the Playwright spec
`admin-login-env-overrides` drives the read-only pane and the refused save.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d27f4be4d">LDAP Test connection without a service account searches the base DN before saying success</a>. Thanks to xet7.</summary>

ldapts opens its socket lazily, and Test connection bound only when
`LDAP_AUTHENTIFICATION` was set, so without a service account no operation
ran and it reported success even for a host that does not resolve. It now
does an anonymous base-scope search of `LDAP_BASEDN`, reading no attributes,
and shows the directory's own error when that fails; without a base DN it says
nothing could be tested. `tests/ldapTestConnectionProbe.test.cjs` pins the
decision and runs the search with the shipped ldapts against a port where
nothing listens. A login against a real directory was not run here.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/95147fc999">LDAP has a Sync now button that runs the background sync once</a>. Thanks to xet7.</summary>

`ldap_sync_now` was never loaded, so no button could call it, and it imported
every directory user regardless of the sync settings. It now runs the
background sync once with `LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS` and
`LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED` as they are set, for an
active site administrator only, and shares one run at a time with the
scheduled job. `tests/ldapSyncNow.test.cjs` pins it and fails when any other
wekan-ldap methods file is left unloaded; the Playwright spec
`admin-login-env-overrides` drives the button. A sync against a real directory
was not run here.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1d1a04790">Automatic logout with LOGOUT_WITH_TIMER and the LOGOUT_* settings works again</a>. Thanks to xet7.</summary>

The platforms offered `LOGOUT_WITH_TIMER`, `LOGOUT_IN`, `LOGOUT_ON_HOURS` and
`LOGOUT_ON_MINUTES` since 2018, but the code that read them went with the job
queue it ran on. A login now ends `LOGOUT_IN` days after it was made, or at
`LOGOUT_ON_HOURS`:`LOGOUT_ON_MINUTES` server time; once a minute the server
removes the expired login tokens in one query and the browsers using them are
signed out. All four are overridable in Admin Panel / People / Login. An
unusable combination signs nobody out and the log says why.
`tests/logoutTimer.test.cjs` checks the one-query cutoff against each login's
deadline over two years of logins in three time zones; the Playwright spec
`admin-login-env-overrides` drives it from the Admin Panel.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/71cd2aed05">MONGO_URL_FILE, MAIL_URL_FILE and S3_SECRET_KEY_FILE replace three secret files nothing read</a>. Thanks to xet7.</summary>

`MAIL_SERVICE_PASSWORD_FILE`, `MONGO_PASSWORD_FILE` and `S3_SECRET_FILE` were
offered on every platform and read by nothing ([#5724](https://github.com/wekan/wekan/issues/5724)).
`MONGO_URL_FILE` holds the whole database URL and is read by the Docker
entrypoint, the snap and both start scripts, because Meteor connects before
WeKan's code runs; an unreadable file stops the start rather than falling back
to a default database, and the snap log no longer prints a password written
in `MONGO_URL`. `MAIL_URL_FILE` and `S3_SECRET_KEY_FILE` are read by the
server at start. The dead names are gone from every platform, and a warning
names the replacement when one is still set. `tests/envSecretFiles.test.cjs`
runs the entrypoint's block for real and fails if any platform offers a
retired name again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe60911408">OAuth login providers can be restricted to email domains</a>. Thanks to jakubgs and xet7.</summary>

Google, GitHub and the other Meteor login providers let anyone with an
account there sign in ([#1904](https://github.com/wekan/wekan/issues/1904)).
`OAUTH_PROVIDERS_ALLOWED_EMAIL_DOMAINS`, or its field under Admin Panel /
People / OAuth login providers, restricts them with the same rule as
`OAUTH2_ALLOWED_EMAIL_DOMAINS`, before an account is created and on every
later login. A provider that sends no email is refused while it is set.

</details>

and fixes the following bugs:

**Addresses** - which address WeKan's links and sign-in use when ROOT_URL is
not the one people opened.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f2e81e01b">Copied links use the address WeKan was opened at, not the snap's 127.0.0.1</a>. Thanks to n8willis and xet7.</summary>

The snap's default ROOT_URL is 127.0.0.1, and every link built in the browser
- Copy link of a card, list or swimlane, comment permalinks - read it, so a
browser that opened WeKan by the machine's name copied a link nobody else
could follow. When ROOT_URL is loopback and the page is not, the browser now
builds those links from the page's own address, keeping ROOT_URL's path. A
real ROOT_URL still wins, and emails keep ROOT_URL: `snap set wekan
root-url=...` is still the setting for them. `tests/browserRootUrl.test.cjs`
covers both directions.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4fc4f19f02">The sign-in page says why a Google login keeps returning to it</a>. Thanks to xet7.</summary>

Signing in with Google returned to the sign-in page every time, with no
error, when WeKan was opened at another address than ROOT_URL: the provider
returns to ROOT_URL, and the login secret is left in that address's browser
storage, where the sign-in page cannot read it. The provider accepts only its
registered address, so the page cannot repair this; when a provider login is
offered at another address, it now names both and says what to change.
`tests/loginOriginMismatch.test.cjs` covers each kind of difference and the
cases where nothing is shown.

</details>

**People and teams** - who belongs where after a login.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29bca6f757">A login merged into an existing account keeps that account's boards</a>. Thanks to xet7.</summary>

Merging an OIDC or OAuth login into an existing account removes that user
and lets Meteor insert it again under the same id. The removal ran the
account-deletion cleanup, which took the user off every board, card and team
and deleted their avatar. It now removes without the hooks.
`tests/mergedUserKeepsBoards.test.cjs` fails if any code removes an account
through the hooks and then returns it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d560e2fcf8">LDAP- and OIDC-synced team members become members of the team's boards</a>. Thanks to xet7.</summary>

The login providers' group syncs added the team to the user with a plain
push, skipping the board membership an Admin Panel team change grants
(#4593), so such users could see the team's boards but not work on them. Both
now run the same board sync; a test fails if any code adds a team without it.

</details>

**Subtasks** - where a new subtask lands.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/42c9a396e2">A subtask lands in the list its main board chose on the deposit board</a>. Thanks to TiibCD and xet7.</summary>

The choice made in Board Settings / Subtasks was ignored, and a deposit
board that itself sends subtasks elsewhere gave its subtasks a list of a third
board. Several boards sharing one deposit board can now each land their
subtasks in their own list ([#1781](https://github.com/wekan/wekan/issues/1781)).

</details>

**Admin Panel / Layout** - what the custom head settings put on the page.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c3db838ac">Custom head meta tags reach the page, as meta elements only</a>. Thanks to xet7.</summary>

The field was saved but never rendered. It is now, when custom head tags are
enabled, keeping only `<meta>` elements and dropping scripts, styles and the
`http-equiv` refresh and set-cookie that would act on every visitor.

</details>

and has the following developer-facing fixes:

- [The receipt collections are pinned to the minimal form the 90-day retention decision asks for](https://github.com/wekan/wekan/commit/c0c424657e). Thanks to xet7.
- [The card-field visibility writer guard counts only writes, not a read projection](https://github.com/wekan/wekan/commit/a9dc8faa98). Thanks to xet7.
- [The release risk baseline knows the format specification links](https://github.com/wekan/wekan/commit/49353db813). Thanks to xet7.

and closes these issues, which were already implemented:

Where each one is in the code:
[Issues-Already-Implemented-2026-10-08.md](docs/DeveloperDocs/Issues-Already-Implemented-2026-10-08.md).

- [Auto add user name to a moved card, done by a rule](https://github.com/wekan/wekan/commit/e27ca445d5). Thanks to xet7.
- [Receive notifications from other users only](https://github.com/wekan/wekan/commit/595f6aaed6). Thanks to gpelouze and xet7.
- [Move lists to a different board](https://github.com/wekan/wekan/commit/f7879e95e6). Thanks to h0jeZvgoxFepBQ2C and xet7.
- [Use the EXIF orientation of uploaded pictures](https://github.com/wekan/wekan/commit/1fbb9f4011). Thanks to CWempe and xet7.
- [Smart search of cards](https://github.com/wekan/wekan/commit/f94cb41c00). Thanks to usmcamp0811 and xet7.
- [Resend verification or change the verified flag](https://github.com/wekan/wekan/commit/0f85328f15). Thanks to lucg71 and xet7.
- [Hide subtask boards on All Boards](https://github.com/wekan/wekan/commit/78899b673f). Thanks to nmd3 and xet7.
- [Progress charts and work statistics for each board](https://github.com/wekan/wekan/commit/939aa8a95e). Thanks to xet7.
- [Mini date field](https://github.com/wekan/wekan/commit/fcbd268d43). Thanks to gerroon and xet7.
- [Edit rules, and send a card with its content and attachments by email](https://github.com/wekan/wekan/commit/054c6e091d). Thanks to kabi178 and xet7.
- [Notification mail template](https://github.com/wekan/wekan/commit/dd410a3a8b). Thanks to hingerlanton and xet7.
- [Auth0 redirect to the full-screen login page](https://github.com/wekan/wekan/commit/948020275b). Thanks to xet7.
- [Common WIP limit for several columns](https://github.com/wekan/wekan/commit/61ad1272bb). Thanks to aviertio and xet7.
- [All Boards drag and drop, and colour](https://github.com/wekan/wekan/commit/0a8c38f395). Thanks to compumatter and xet7.
- [Master dashboard like Kanboard's Bigboard plugin](https://github.com/wekan/wekan/commit/d10fe621be). Thanks to Jieiku and xet7.
- [Move a checklist from one card to another card](https://github.com/wekan/wekan/commit/9158772a61). Thanks to qiutian00 and xet7.
- [Restrict the WeKan port to loopback](https://github.com/wekan/wekan/commit/68bdd70a51). Thanks to galletl and xet7.

and improves translations and their validation:

**Languages updated:** Afrikaans, Akan, Albanian, Amharic, Arabic, Aragonese,
Armenian, Assamese, Asturian, Azerbaijani, Bashkir, Basque, Belarusian,
Bengali, Bhojpuri, Bislama, Bosnian, Breton, Bulgarian, Burmese, Cantonese,
Catalan, Chinese, Corsican, Croatian, Czech, Danish, Dutch, Esperanto,
Estonian, Faroese, French, Galician, Georgian, German, Greek, Gujarati, Haitian
Creole, Hausa, Hebrew, Hindi, Hungarian, Icelandic, Igbo, Indonesian, Irish,
Japanese, Javanese, Kannada, Kazakh, Khmer, Konkani, Korean, Kurmanji Kurdish,
Kyrgyz, Latin, Latvian, Lithuanian, Luxembourgish, Macedonian, Maithili,
Malagasy, Malay, Malayalam, Maltese, Marathi, Mongolian, Māori, Nepali,
Northern Sotho, Norwegian Bokmål, Occitan, Odia, Pashto, Persian, Polish,
Portuguese, Punjabi, Romanian, Romansh, Russian, Sardinian, Scottish Gaelic,
Serbian, Sicilian, Sindhi, Sinhala, Slovak, Slovenian, Somali, Sorani Kurdish,
Spanish, Swahili, Tagalog, Tajik, Tamil, Tatar, Telugu, Thai, Tok Pisin,
Turkish, Turkmen, Ukrainian, Urdu, Uyghur, Uzbek, Vietnamese, Waray, Welsh,
West Frisian, Wu Chinese, Yiddish, Yoruba.



































































































































<details>
<summary><a href="https://github.com/wekan/wekan/commit/faf6725f9a">Translate Lithuanian import and synchronization recovery</a>. Thanks to xet7.</summary>

Fill 48 recovery messages, preserving source variables, existing translations,
permanent deletion warnings and retention of changes already applied.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Remaining Lithuanian messages,
other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be43a70825">Translate Latvian controls and planning</a>. Thanks to xet7.</summary>

Fill 51 messages covering controls, import guidance, LDAP, login settings,
planning imports and history recovery. Preserve variables, literal examples,
matching priority, non-duplication and recovery decisions.

Four focused translation suites and 21 human-preference checks pass.
The current Latvian fill list is empty. No browser or screen-reader session
was run; other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef9af80034">Translate Latvian import and synchronization recovery</a>. Thanks to xet7.</summary>

Fill 48 recovery messages, preserving variables, existing translations,
permanent deletion warnings and retention of changes already applied.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Remaining Latvian messages,
other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27998c617a">Translate Estonian controls and recovery</a>. Thanks to xet7.</summary>

Fill 70 messages covering controls, import guidance, LDAP, login settings,
stalled synchronization and interrupted imports. Preserve variables, literal
examples, existing localized values and recovery decisions.

Four focused translation suites and 21 human-preference checks pass.
The current Estonian fill list is empty. No browser or screen-reader session
was run; other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24912011f5">Translate Russian controls and recovery</a>. Thanks to xet7.</summary>

Fill 236 values across three Russian catalogs, covering controls, import
guidance, LDAP, login address errors, planning and recovery. Preserve variables,
literal examples, existing localized values and recovery decisions.

Four focused translation suites and 21 human-preference checks pass.
All three current Russian fill lists are empty. No browser or screen-reader
session was run; other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b3ea17c28">Translate Ukrainian controls and import recovery</a>. Thanks to xet7.</summary>

Fill 69 messages covering controls, import guidance, LDAP, login address
errors, stalled synchronization and interrupted imports. Preserve variables,
literal examples and the distinction between deletion and retaining applied
changes when discarding a synchronization operation.

Four focused translation suites and 21 human-preference checks pass.
The current Ukrainian fill list is empty. No browser or screen-reader
session was run; other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c458610f62">Translate Greek controls and planning recovery</a>. Thanks to xet7.</summary>

Fill 98 messages in each Greek catalog, for 196 values. Cover controls,
import guidance, LDAP, login address errors, Scrum planning and recovery.
Preserve variables, literal examples, matching priority and recovery choices.

Five focused translation suites and 21 human-preference checks pass.
Both current Greek fill lists are empty. No browser or screen-reader
session was run; other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02ee6a37c9">Translate Turkish planning imports and history recovery</a>. Thanks to xet7.</summary>

Fill 29 messages covering release selection, planning imports, planning
synchronization and conflicted history recovery. Preserve variables,
matching priority, non-duplication and recovery choices.

Three focused translation suites and 21 human-preference checks pass.
The current Turkish fill list is empty. No browser or screen-reader session
was run; other languages and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9b2601c30">Translate Turkish controls and synchronization recovery</a>. Thanks to xet7.</summary>

Fill 44 messages covering board controls, import guidance, assignment, LDAP,
OAuth, login address errors and stalled synchronization. Preserve variables,
literal examples and the distinction between cancellation and retaining
changes already applied.

Four focused translation suites and 21 human-preference checks pass. The
preceding full run passed all 322 translation suites. No browser or
screen-reader session was run; broader translation work remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16bfc9ebab">Translate Turkish interrupted import recovery</a>. Thanks to xet7.</summary>

Fill 25 interrupted-import messages. Preserve source variables, permanent
removal warnings, retention without deletion, the separate Scrum recovery
checkpoint and protection of unrelated boards.

Turkish, global placeholder and translation audit suites pass, together
with 21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e3ae95014">Translate Romanian planning imports and history recovery</a>. Thanks to xet7.</summary>

Fill 29 messages in each Romanian catalog for release selection, planning
imports, Sync planning and history recovery. Preserve source variables,
matching priority, unchanged cards and recovery decisions.

Romanian, global placeholder and translation audit suites pass, together
with 21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b67435dd6d">Translate Romanian controls and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 44 messages in each Romanian catalog for board controls, link rules,
import formats, assignment actions, LDAP, OAuth, server-only login settings
and stuck Sync recovery. Preserve source variables, configuration names and
the distinction between retained applied changes and discarded pending changes.

Romanian, global placeholder, import-format and translation audit suites
pass, together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09a5b44862">Translate Romanian interrupted import recovery</a>. Thanks to xet7.</summary>

Fill 25 interrupted-import messages in each Romanian catalog. Preserve
source variables, permanent removal warnings, retention without deletion,
the separate Scrum recovery checkpoint and protection of unrelated boards.

Romanian, global placeholder and translation audit suites pass, together
with 21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2108d855ca">Translate Hungarian controls and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 44 messages for board controls, link rules, import formats, assignment
actions, LDAP, OAuth, server-only login settings and stuck Sync recovery.
Preserve source variables, configuration names and the distinction between
retained applied changes and discarded pending changes.

Hungarian, global placeholder, import-format and translation audit suites
pass, together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56600a495a">Translate Hungarian interrupted import recovery</a>. Thanks to xet7.</summary>

Fill 25 interrupted-import messages. Preserve source variables, permanent
removal warnings, retention without deletion, the separate Scrum recovery
checkpoint and protection of unrelated boards.

Hungarian, global placeholder and translation audit suites pass, together
with 21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66b6c6cf7d">Translate Slovak controls and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 43 messages for board controls, link rules, import formats, assignment
actions, LDAP, OAuth and stuck Sync recovery. Preserve source variables,
configuration names and the distinction between retained applied changes
and discarded pending changes.

Slovak, global placeholder, import-format and translation audit suites pass,
together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6079856b93">Translate Slovak interrupted import recovery</a>. Thanks to xet7.</summary>

Fill 25 interrupted-import messages. Preserve source variables, permanent
removal warnings, retention without deletion, the separate Scrum recovery
checkpoint and protection of unrelated boards.

Slovak, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb9850aa9d">Translate Czech controls and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 43 messages for board controls, link rules, import formats, assignment
actions, LDAP, OAuth and stuck Sync recovery. Preserve source variables,
configuration names and the distinction between retained applied changes
and discarded pending changes.

Czech, global placeholder, import-format and translation audit suites pass,
together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cff7c86fc">Translate Czech interrupted import recovery</a>. Thanks to xet7.</summary>

Fill 25 interrupted-import messages. Preserve source variables, permanent
removal warnings, retention without deletion, the separate Scrum recovery
checkpoint and protection of unrelated boards.

Czech, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49e8be5cd1">Translate Polish planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages for board controls, link rules, planning imports, Sync and
import/history recovery. Preserve source variables, literal examples,
matching priority and permanent-removal warnings.

Polish, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8cdd39385f">Translate Polish import guidance and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 36 messages for import formats, assignment actions, LDAP, OAuth,
release selection and stuck Sync recovery. Preserve source variables,
configuration names and the distinction between retained applied changes
and discarded pending changes.

Polish, global placeholder, import-format and translation audit suites pass,
together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e25bf4ec94">Translate Finnish planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages for board controls, link rules, planning imports, Sync and
import/history recovery. Preserve source variables, literal examples,
matching priority and permanent-removal warnings.

Finnish, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1918d37067">Translate Norwegian Bokmal planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages for board controls, link rules, planning imports, Sync and
import/history recovery. Preserve source variables, literal examples,
matching priority and permanent-removal warnings.

Bokmal, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/28d3785914">Translate Norwegian Bokmal import guidance and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 36 messages for import formats, assignment actions, LDAP, OAuth,
release selection and stuck Sync recovery. Preserve source variables,
configuration names and the distinction between retained applied changes
and discarded pending changes.

Bokmal, global placeholder, import-format and translation audit suites pass,
together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9da06c16a4">Translate Danish planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages for board controls, link rules, planning imports, Sync and
import/history recovery. Preserve source variables, literal examples,
matching priority and permanent-removal warnings.

Danish, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd886e99fc">Translate Danish import guidance and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 36 messages for import formats, assignment actions, LDAP, OAuth,
release selection and stuck Sync recovery. Preserve source variables,
configuration names and the distinction between retained applied changes
and discarded pending changes.

Danish, global placeholder, import-format and translation audit suites pass,
together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e00407123e">Translate Swedish planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages for board controls, link rules, planning imports, Sync and
import/history recovery. Preserve source variables, literal examples,
matching priority and permanent-removal warnings.

Swedish, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/36e11d85fd">Translate Swedish import guidance and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 36 messages for import formats, assignment actions, LDAP, OAuth,
release selection and stuck Sync recovery. Preserve source variables,
configuration names and the distinction between retained applied changes
and discarded pending changes.

Swedish, global placeholder, import-format and translation audit suites
pass, together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d54be51d9c">Translate Dutch planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages in each Dutch catalog for board controls, link rules,
planning imports, Sync and import/history recovery. Preserve source
variables, literal examples, matching priority and permanent-removal warnings.

Dutch, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/78a076e317">Translate Dutch import guidance and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 36 messages in each Dutch catalog for import formats, assignment
actions, LDAP, OAuth, release selection and stuck Sync recovery. Preserve
source variables, configuration names, format syntax and the distinction
between retained applied changes and discarded pending changes.

Dutch, global placeholder, import-format and translation audit suites pass,
together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c4066ce8f">Translate Portuguese import guidance and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 36 messages in each of four Portuguese catalogs for import formats,
assignment actions, LDAP, OAuth, release selection and stuck Sync recovery.
Preserve regional wording, source variables, configuration names and the
distinction between retained applied changes and discarded pending changes.

Portuguese, global placeholder, import-format and translation audit suites
pass, together with 21 human-preference checks. No browser or screen-reader
session was run. Broader translation and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ea258e866d">Translate Portuguese planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages in each of four Portuguese catalogs, preserving existing
localized values and Brazilian terminology. Cover board controls, link
rules, planning imports, Sync and import/history recovery. Preserve source
variables, literal examples, matching priority and permanent-removal warnings.

Portuguese, global placeholder and translation audit suites pass, together
with 21 human-preference checks. No browser or screen-reader session was run.
Other untranslated messages and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f47f6b3c65">Translate Spanish import guidance and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 36 messages in each of nine Spanish catalogs for import formats,
assignment rules, LDAP, OAuth, release selection and stuck Sync recovery.
Preserve source variables, configuration names, format syntax and the
distinction between retained applied changes and discarded pending changes.

Spanish, global placeholder, import-format and translation audit suites pass,
together with 21 human-preference checks. No browser or screen-reader session
was run. Broader translation and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/afafc47bf0">Translate Spanish planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages in each of nine Spanish catalogs, preserving existing
localized values and shared planning terminology. Cover board controls,
link rules, planning imports, Sync and import/history recovery. Preserve
variables, literal examples, matching priority and permanent-deletion warnings.

Spanish, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Newer untranslated messages and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9687307660">Translate Italian planning and recovery messages</a>. Thanks to xet7.</summary>

Fill 97 current messages for board controls, import formats, LDAP, OAuth,
planning and recovery. Preserve existing localized values, source variables,
literal examples, matching priority and distinctions between retaining
applied changes and discarding pending ones.

Italian, global placeholder, import-format and translation audit suites pass,
together with 21 human-preference checks. The fill tool reports no remaining
English placeholders in Italian. No browser or screen-reader session was run;
other locales and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9b585135d">Translate German planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages in each of four German catalogs, preserving existing
localized values and Swiss spelling. Cover board controls, link rules,
planning imports, Sync and import/history recovery. Preserve source
variables, literal examples, matching priority and permanent-removal warnings.

German, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other locale translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93c380310f">Translate French planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages in each of the five French catalogs, preserving existing
localized values. Cover board controls, link rules, planning imports, Sync,
interrupted imports and conflicted history recovery. Preserve variables,
literal examples, source matching priority and permanent-discard warnings.

French, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other locale translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cc7ff1c856">Translate Aromanian import recovery and repair mixed-language controls</a>. Thanks to xet7.</summary>

Translate 25 interrupted-import messages and replace 65 Italian or Spanish
card, checklist, attachment, board and account labels. Preserve source
variables, recovery decisions, permanent-discard warnings, shared dialog
wording and opposite actions. New phrasing remains low-confidence pending
fluent review.

Aromanian, global placeholder and translation audit suites pass. The fill
tool reports no remaining English placeholders in Aromanian; broader
wrong-language review and other locale translations remain unfinished.
No browser or screen-reader session was run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd90691e00">Correct Italian-seeded Aromanian search and organization labels</a>. Thanks to xet7.</summary>

Replace 48 wrong-language search, organization, rule and card labels.
Preserve result-count variables, reminder variables, predicate syntax,
shared labels and opposite actions. New wording remains low-confidence
pending fluent review.

Aromanian, global placeholder and translation audit suites pass. No browser
or screen-reader session was run. Broader translation work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cca57e46b5">Correct Italian-seeded Aromanian rule-builder labels</a>. Thanks to xet7.</summary>

Replace 35 wrong-language conditions, actions and fragments. Preserve
check/uncheck and top/bottom distinctions, shared checklist wording and
past-state meaning. New phrasing remains low-confidence pending fluent review.

Aromanian, global placeholder and translation audit suites pass. No browser
or screen-reader session was run. Further linguistic review and translation
work remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f4a96b8c0">Translate Northern Sotho planning imports and repair locale suites</a>. Thanks to xet7.</summary>

Translate 20 messages and extend the Scrum inventory to 127 while retaining
per-key translation and token checks. Preserve matching priority,
non-duplication and first-sync protection of planning. Full new wording
remains low-confidence pending fluent review.

All 322 translation suites pass after these repairs, including global
placeholder checks. All 21 human-preference checks also pass. No browser or
screen-reader session was run; the all-language
translation and linguistic review work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/38e8f1d4bc">Translate Maori planning imports and repair locale suites</a>. Thanks to xet7.</summary>

Translate 20 messages and extend the Scrum inventory to 127 while retaining
per-key translation and token checks. Preserve matching priority,
non-duplication and first-sync protection of planning. Full new wording
remains low-confidence pending fluent review.

Both Maori suites, global placeholder and translation audit checks pass.
Two failures from the latest broad run still need repair. No browser or
screen-reader session was run; the all-language work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50a2d2fce1">Translate Somali planning imports and repair locale suites</a>. Thanks to xet7.</summary>

Translate 20 messages and extend the Scrum inventory to 127 while retaining
per-key translation and token checks. Preserve matching priority,
non-duplication and first-sync protection of planning. Full new wording
remains low-confidence pending fluent review.

Both Somali suites, global placeholder and translation audit checks pass.
Four failures from the latest broad run still need repair. No browser or
screen-reader session was run; the all-language work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb846b6ca0">Translate Tok Pisin planning imports and repair locale suites</a>. Thanks to xet7.</summary>

Translate 20 messages and extend the Scrum inventory to 127 without weakening
per-key translation and token checks. Preserve matching priority,
non-duplication and first-sync protection of planning. Full new wording
remains low-confidence pending fluent review.

Both Tok Pisin suites, global placeholder and translation audit checks pass.
Six failures from the latest broad run still need repair. No browser or
screen-reader session was run; the all-language work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f06dd84b40">Translate Ukrainian Scrum import and Sync planning messages</a>. Thanks to xet7.</summary>

Translate 20 messages and restore the Ukrainian planning suite. Preserve
counters, matching priority, non-duplication, unchanged foreign-board cards
and first-sync protection of existing planning.

Ukrainian, global placeholder and translation audit suites pass. Eight
failures from the latest broad run still need repair. No browser or
screen-reader session was run; the all-language work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27fe2c86ed">Translate Estonian Scrum import and Sync planning messages</a>. Thanks to xet7.</summary>

Translate 20 messages and restore the Estonian planning suite. Preserve
counters, matching priority, non-duplication, unchanged foreign-board cards
and first-sync protection of existing planning.

Estonian, global placeholder and translation audit suites pass. Nine failures
from the latest broad run still need repair. No browser or screen-reader
session was run; the all-language work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ae3852099">Repair planning translations and Aromanian system labels</a>. Thanks to xet7.</summary>

Translate 116 planning messages across Aromanian, Czech, Slovak, Hungarian
and two Russian catalogs; correct 34 Italian-seeded Aromanian system and rule
labels. Preserve counters, matching priority, non-duplication and protection
of existing planning. New Aromanian wording remains low-confidence pending
fluent review.

Seven targeted translation suites pass, including global placeholder checks.
Ten failures from the latest broad run still need repair. No browser or
screen-reader session was run; the all-language work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94209a2764">Correct Italian-seeded Aromanian account and webhook labels</a>. Thanks to xet7.</summary>

Replace 35 wrong-language values in account, invitation, template, time and
webhook controls. Preserve overtime meaning, hour units, invitation variables
and technical names; distinguish outgoing and two-way webhooks. Full new
wording remains low-confidence pending fluent review.

Aromanian, global placeholder and translation audit suites pass. No browser
or screen-reader session was run. Further language review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cfc5edcbdb">Correct Italian-seeded Aromanian board controls</a>. Thanks to xet7.</summary>

Replace 35 wrong-language values in board/member actions, movement, selection,
validation and keyboard help. Preserve the label variable and Excel CSV/TSV
name; cover opposite movement directions and card/board removal scope.
Full new wording remains low-confidence pending fluent review.

Aromanian, global placeholder and translation audit suites pass. No browser
or screen-reader session was run. Further language review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7ff39eba6">Replace Italian-seeded Aromanian dialogs and filters</a>. Thanks to xet7.</summary>

Correct 47 wrong-language values in dialogs, invitations, export controls and
filters. Preserve invitation variables and PDF/iCal names; add regression
checks against restoring the Italian text or replacing it with English.
New Aromanian phrasing remains low-confidence pending fluent review.

Aromanian, global placeholder and translation audit suites pass. No browser
or screen-reader session was run. Further Italian-seed candidates and other
languages remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76b35e70c6">Translate Aromanian stuck Sync recovery messages</a>. Thanks to xet7.</summary>

Translate 23 messages, preserving applied changes, the unwritten remainder,
replay eligibility and oldest-50 ordering. New wording remains low-confidence
pending fluent review. The reported English-placeholder queue is empty;
older mixed-language values and skipped short strings still need review.

Aromanian, global placeholder and translation audit suites pass. No browser
or screen-reader session was run. The all-language translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e251e53ac">Translate Aromanian imports, controls and Sync planning</a>. Thanks to xet7.</summary>

Translate 47 messages, preserving import syntax, link-rule variables and
examples, configuration identifiers and physical keyboard legends. Cover
read-only fields, unchanged card data and Sync source-ID matching priority
and its first-run protection of existing planning. New wording remains
low-confidence pending fluent review.

Aromanian, global placeholder, import literal and translation audit suites
pass. No browser or screen-reader session was run. Other untranslated and
wrong-language values remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/43a7b0246e">Translate Aromanian Sync choices and diagnostics</a>. Thanks to xet7.</summary>

Translate 63 conflict, preview, report and estimate messages. Preserve local
and source scope, unchanged subcards, replacement reuse, report limits,
missing-versus-null values and the single matching time-field requirement.
New wording remains low-confidence pending fluent review.

Aromanian, global placeholder and translation audit suites pass, along with
21 human-preference checks. No browser or screen-reader session was run.
Other untranslated and wrong-language values remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a050566954">Translate Aromanian notification recovery messages</a>. Thanks to xet7.</summary>

Translate 36 mail failure and activity-notification recovery messages.
Preserve temporary/permanent rejection, retained pending work, the prohibition
on recreating activities and irreversible cancellation. New wording remains
low-confidence pending fluent review.

Aromanian, global placeholder and translation audit suites pass, along with
21 human-preference checks. No browser or screen-reader session was run.
Other untranslated and wrong-language values remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f73ce87d54">Translate remaining Aromanian Scrum instructions</a>. Thanks to xet7.</summary>

Translate 20 instructions and recovery messages, preserving unknown estimates,
UTC sampling, cancelled-sprint membership and rollback eligibility. Cover all
current Scrum keys and the reporting/recovery distinctions alongside the
source variable inventory. Full wording remains low-confidence pending fluent
review.

Aromanian, global placeholder and translation audit suites pass. No browser
or screen-reader session was run. Other untranslated and wrong-language
values remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4eec94b7c8">Translate Aromanian Scrum labels and reporting controls</a>. Thanks to xet7.</summary>

Translate 73 labels, actions, states and short reports. Preserve counters,
reference variables, minute units and the 366-observation limit. Extend
regression coverage for shared labels and distinct lifecycle states and use
the shared Unicode-aware token scanner. New terminology and phrasing remain
low-confidence pending fluent review.

Aromanian, global placeholder and translation audit suites pass, as do 21
human-preference checks. No browser or screen-reader session was run.
Untranslated messages and older wrong-language values still require work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b0fde93ef">Translate new Scrum messages and repair four locale suites</a>. Thanks to xet7.</summary>

Translate 36 release-selection and recovery messages in Māori, Northern Sotho,
Somali and Tok Pisin. Update the expected Scrum inventory from 102 to 111 while
retaining per-key translation and token checks. Cover keyboard legends,
distinct rollback and retain actions, and all four recovery counters.
Full new wording remains low-confidence pending fluent review.

All 322 translation suites pass after these repairs, including the global
placeholder checks. The 21 human-preference checks also pass. No browser or
screen-reader session was run.
Other translation and linguistic review work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/478fcc07f0">Translate pending imports and recovery messages in German locales</a>. Thanks to xet7.</summary>

Translate 144 values across four German catalogs, preserving Swiss spelling,
source variables, import syntax and configuration identifiers. Extend German
regression coverage for recovery consequences and multiple-release selection.
Focused German, global placeholder, import literal and audit checks pass,
along with 21 human-preference checks. No browser session was run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/362a43fa43">Translate new planning messages exposed by regression tests</a>. Thanks to xet7.</summary>

Translate 63 release-selection and Scrum recovery values in Czech, Slovak,
Hungarian, two Russian catalogs, Ukrainian and Estonian. Six planning suites
pass again without weakened assertions; global placeholder checks also pass.
The full 322-suite run exposed ten failures before these repairs. Four other
Scrum translation suites still need new translations and inventory updates.
The all-language translation and linguistic review work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/20cae59763">Translate pending imports and recovery messages in French locales</a>. Thanks to xet7.</summary>

Translate 180 values across the five French catalogs for imports, assignment,
LDAP, login, release selection and stuck List Sync recovery. Preserve variables,
configuration names and import syntax. Regression checks cover retained applied
changes, the unwritten remainder, replay eligibility and multiple releases.

The French suite, catalog-wide placeholder and import literal checks,
translation audit suite and 21 human-preference checks pass. No browser or
screen-reader session was run. Other translation and linguistic review work
remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bffc32f899">Translate pending Finnish import and Sync recovery messages</a>. Thanks to xet7.</summary>

Translate 36 pending messages for imports, assignment rules, LDAP, login,
release selection and stuck List Sync operations. Preserve variables,
configuration names and import syntax. Recovery warnings retain applied
changes and explain that remaining saved changes are never written.

The Finnish regression suite, catalog-wide placeholder and import literal
checks, translation audit suite and 21 human-preference checks pass.
No browser or screen-reader session was run. Translation work for other
languages and review of older linguistic defects continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e00df9be7">Correct Bislama display, weekday and report translations</a>. Thanks to xet7.</summary>

- Replace 76 artificial English wrappers while preserving template variables,
  import counts, separators and font names. 312 older wrappers remain;
  search operators still require a parser-aware review.
- Three relevant suites pass, including the catalog-wide placeholder check.
  Software compounds remain provisional pending fluent review. Browser and
  screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4607ee49c">Correct Bislama navigation, diagnostics and rule labels</a>. Thanks to xet7.</summary>

- Replace 145 artificial English wrappers and translate new Todoist import
  guidance. Preserve runtime identifiers, units, protocol names, scheduling
  directions, check states and source variables. 388 older wrappers remain.
- Three relevant suites pass, including the catalog-wide placeholder inventory.
  Full software compounds remain provisional pending fluent review. Browser
  and screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e882ed8901">Correct 120 Bislama entries containing English wrappers</a>. Thanks to xet7.</summary>

- Replace artificial English wrappers in board, font, color, voting and filter
  labels. Restore numeric choices, date formats and compact sort labels exactly.
  The older wrapper queue falls from 653 to 533 values, outside the fill report.
- Three relevant suites pass, including the catalog-wide placeholder inventory.
  Fine color descriptions and software compounds remain provisional pending
  fluent review. Browser and screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d787085c30">Translate remaining reported Bislama messages and short controls</a>. Thanks to xet7.</summary>

- Translate 224 workspace, Scrum, Sync and notification-recovery messages
  plus ten short Blockly labels skipped by the fill report. Preserve variables,
  report limits, missing/null distinctions and cancellation consequences.
- Three relevant suites pass, including the catalog-wide placeholder check.
  The Bislama fill report is empty, but 653 older values with the artificial
  “Tok blong sistem:” prefix still require language correction. Technical
  compounds remain provisional. Browser and screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/74e4048f32">Translate Bislama functions, navigation and text operations</a>. Thanks to xet7.</summary>

- Translate 175 Blockly messages for mathematical operations, functions,
  variables, keyboard navigation, screen-reader controls and text operations.
  Preserve result behavior, angle units, opposite states, replacement scope,
  whitespace rules and numbered substitutions.
- Three relevant suites pass, including the catalog-wide placeholder check.
  Browser and screen-reader sessions were not run. Mathematical loanwords
  and complete software phrases remain provisional pending fluent review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5501cf17ae">Translate Bislama lists, logic and mathematics</a>. Thanks to xet7.</summary>

- Translate 156 labels and messages, including four LDAP notices and the
  short OR label. Preserve exact source tokens and environment identifiers,
  list copy/removal semantics, logical conditions and random-number bounds.
- Five relevant regression suites pass, including the catalog-wide token
  inventory. Browser and screen-reader sessions were not run. Statistical
  terminology and complete Bislama software phrases remain provisional.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59e67383ec">Translate Bislama controls and read-only login guidance</a>. Thanks to xet7.</summary>

- Translate 116 Bislama Blockly labels, including the short bitmap-on label,
  and 62 environment-only login notices visible through 63 locale paths.
  Preserve bitmap states, operand roles, placeholder order and read-only scope.
- All 321 translation/i18n suites and 21 human-preference checks pass.
  Browser and screen-reader sessions were not run; Bislama software compounds
  remain provisional and the broader translation audit continues.
- This shared-checkout commit also contains catalog additions being staged by
  the concurrent login-settings workflow. Their English placeholders remain
  tracked for translation; no unrelated implementation code was included.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58ce223329">Translate more card-field help and Bislama blocks</a>. Thanks to xet7.</summary>

- Add 74 translations across 16 locales and correct three Bislama color
  wrappers. Preserve field hiding/restoration semantics, color ranges,
  variable-deletion restrictions and Blockly loop/conditional behavior.
- Preserve exact placeholders, including numbered Blockly arguments. Keep
  Bislama's native red label without exempting English sentences or other
  locales. Tests cover both valid terms and changed-source rejection.
- The 37 relevant suites, the additional invariant suite and 21 human-preference
  checks pass. Script and translated rendering checks cover the card fields.
  Browser and screen-reader sessions were not run. Provisional wording and the
  remaining mixed-language/translation audit stay open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ec8138130">Translate remaining keyboard labels in six locales</a>. Thanks to xet7.</summary>

- Fill 119 keyboard and card-field strings in Akan, Māori, Northern Sotho,
  Somali, Tok Pisin and Waray. Their full fill reports now contain no remaining
  placeholders; this measures coverage rather than fluency.
- Preserve recognizable physical keys, opposite navigation directions,
  card-field hiding scope and exact source variables. Existing translations
  are retained. All 31 relevant suites and 21 human-preference checks pass.
- New software wording is provisional, especially in Akan, Northern Sotho and
  Waray. Terminology sources are recorded in the translation audit. Browser
  and screen-reader sessions were not run; the broader translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e503945ef1">Report locale text coverage accurately</a>. Thanks to xet7.</summary>

The README now reports 182 of 234 locale catalogs with non-English text for
more than 90 percent of source keys. This replaces the stale count of 171
and the stronger, unverified claim that those translations are essentially
complete. The source-derived language-wiring check retains the exact numeric
assertion and requires the wording to distinguish coverage from quality.

Validation: all six language-wiring checks pass. The other 21 additional
locale, notification-language and Transifex suites passed in the related run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ce7549bcf">Translate more card-field visibility help</a>. Thanks to xet7.</summary>

- Fill 44 values in 22 further locale paths, bringing this message pair to
  153 translated non-English paths. Preserve hiding scope, stored data and
  settings, restoration and each board's own field order.
- All 30 relevant suites pass, including full catalog placeholder inventories
  and translated-text rendering. Browser tests were not run.
- Breton, Faroese, Romansh, Sardinian, Scottish Gaelic and Sicilian drafts need
  fluent-speaker review. Terminology references and remaining work are recorded
  in the translation audit. No external translation service was used.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07a33f5d5f">Protect translation variables and restore catalog coverage</a>. Thanks to xet7.</summary>

- Verify the English token inventory across all 246 locale paths, including
  non-Latin renamed tokens, positional arguments and repeated variables.
  Reject invalid fill batches atomically while preserving existing translations.
- Restore the two missing card-field settings keys in source order and add
  240 translated values. English fallback remains visible for unfinished
  locales.
- Keep exact OS brands and compact Blockly math/code symbols out of the prose
  backlog without exempting help text or accessibility labels.
- Reconcile four superseded audit records and accept the Akan organization noun
  in its current sentence case. Preserve literal JSON example property names.
- Validation: 321 translation/i18n suites and 21 human-preference checks pass,
  including catalog rendering and negative fill fixtures. Browser tests were
  not run. Remaining translation work and fluent-speaker review stay open.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.
