# Platforms

Newest WeKan at these platforms:

- [Install](https://wekan.fi/install/)
- [Upgrade WeKan](https://wekan.fi/upgrade/)
- [Docs](https://wekan.fi/docs/)
- [Mac ChangeLog](https://github.com/wekan/wekan/wiki/Mac)
- Older releases: [2026-08](old-CHANGELOG/2026/08.md),
  [2026-07](old-CHANGELOG/2026/07.md), [2026-06](old-CHANGELOG/2026/06.md),
  [2026-05](old-CHANGELOG/2026/05.md), [2026-04](old-CHANGELOG/2026/04.md),
  [2026-03](old-CHANGELOG/2026/03.md), [2026-02](old-CHANGELOG/2026/02.md),
  [2026-01](old-CHANGELOG/2026/01.md), [2025](old-CHANGELOG/2025.md),
  [2024](old-CHANGELOG/2024.md), [2023](old-CHANGELOG/2023.md),
  [2022](old-CHANGELOG/2022.md), [2021](old-CHANGELOG/2021.md),
  [2020](old-CHANGELOG/2020.md), [2019](old-CHANGELOG/2019.md),
  [2018](old-CHANGELOG/2018.md), [2017](old-CHANGELOG/2017.md),
  [2016](old-CHANGELOG/2016.md), [2015](old-CHANGELOG/2015.md)

<details>
<summary>Version</summary>

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

# TODO Later

<details>
<summary>Carried to a future release.</summary>

Investigated but not finished, with findings
recorded for whoever picks them up next. Entries that have since been FIXED are
removed from this list as they are handled (their fixes carry `Fixes #NNNN` and
close on push): e.g. #4560/#4419/#4158 (LDAP, in the startup-upgrade
batch), #4825/#4897 (All Boards/OAuth2 data), #4822 (maximized card
position), #3826
(subtask drag reorder), #5282/#5547 (mergebox/features batch), #3453/#3199/#3843
(linked-card/archive/comment attachments), #4593 (late-joining team member board
membership) and #3037 (REST card board-move).

Checked against GitHub on 2026-07-28 and removed as no longer open: issues
\#3138, \#3252, \#3276, \#3378, \#3748, \#3828, \#4055, \#4774, \#5149 and
\#6511. The "already correct in the current code" category went with them - it
held only issues \#4774 and \#4055, and both are closed now.

</details>

<details>
<summary>Designed and written down, not built - one feature across several places, where half of it would be worse than none.</summary>

**Requested By and Assigned By become people.** They are free TEXT today, and
should keep that field AND gain member fields of the same kind Assignees has - a
user picked from a popup, shown as an avatar or initials - on the card, in both
exports and through every import. The shape is written down in
[Requested-Assigned-By.md](docs/Features/Cards/Requested-Assigned-By.md):
mirror `assignees` exactly (`requesters`, `assigners` as `[String]`, named after
what WeKan already calls them internally), keep the two strings beside them, and
give Members, Assignees, Requested By and Assigned By ONE template - they are
the same control written four times. The avatar itself needs nothing new: it is
`+userAvatar` in a `.member` box, which is what the board sidebar, the cards,
Admin Panel / People and Admin Panel / Problems all already use. Not started
because it is one feature across five places - schema, the card, the picker
popups, both exports and the import round trip - and half of it landed is worse
than none of it: a card would show a person that an export drops.

</details>

<details>
<summary>Need specific infrastructure / a running server stack we cannot reproduce here (left for environment owners).</summary>

[#5707](https://github.com/wekan/wekan/issues/5707) (board invitation email
never arrives - the reporter's own title says environment specific, and the send
path needs a real SMTP server to tell a WeKan defect from a rejected or
silently-dropped message; the code that composes and sends it is worth reading
against a live log rather than guessed at),
[#3318](https://github.com/wekan/wekan/issues/3318) (outgoing webhooks from a
Sandstorm grain require a user-granted Powerbox network capability and a
Node-24-compatible bridge implementation; direct HTTP is intentionally blocked
by the grain sandbox), [#6548](https://github.com/wekan/wekan/issues/6548) (LDAP
debug output not visible inside an LXC container — needs that container and an
Active Directory to see what is logged and what is not),
[#6549](https://github.com/wekan/wekan/issues/6549) (OAuth2 through
Rocket.Chat's G Suite SAML app: WeKan logs in only when the Rocket.Chat session
already exists — the behaviour is on the identity-provider side, and reproducing
it needs that whole chain), [#6552](https://github.com/wekan/wekan/issues/6552)
(raise the file-descriptor limit for Caddy in the snap — snapcraft has no
per-app ulimit key and snapd owns the systemd unit, so this needs a snapd
feature or a wrapper change verified on a real snap install).

</details>

<details>
<summary>Need the running app to reproduce/verify (runtime UI or publication/mergebox state), not unit-testable here.</summary>

[#6541](https://github.com/wekan/wekan/issues/6541) (users disappear from the
Users collection while their id stays on the board, WeKan 6.09 / MongoDB 3.2 —
nothing in the server log and no webhook, so there is no path to follow in the
code; the deletion helpers since gained the cleanup that removes a user from
every board they were on, so a repeat today would leave no orphan ids, but the
disappearance itself has no reproduction),
[#1942](https://github.com/wekan/wekan/issues/1942) (a card linked from board A
into board B shows a blank view / freezes when the viewer has no rights on board
A — the linked-card open resolves the real card the viewer cannot see; needs a
runtime permission + reactive-close-on-no-access fix verified live),
[#6509](https://github.com/wekan/wekan/issues/6509) — which is a request to TEST
FerretDB v1 on MySQL, MariaDB and SAP HANA, and is mostly answered: the
conformance harness (`./build.sh` → Tests → All databases) runs one catalogue of
100 queries against every backend with an image for the machine, and **MariaDB
now answers identically to SQLite on 98 of them**, the two exceptions being the
`$slice` / `$elemMatch` projections that NO backend implements. Getting there
took a dozen fixes in wekan/FerretDB — MySQL answered `Error 1064` to every
filtered query, deletes deleted nothing, `DROP INDEX` was PostgreSQL's spelling,
`collStats` was not valid SQL, and MariaDB has neither the `->` operator nor a
JSON type to cast to. **MySQL's confirming run is still pending** (its container
lost a port race on the last run, since fixed) and **SAP HANA is untested**: its
image needs a licence acceptance and a machine with the memory for it.

</details>

<details>
<summary>In-progress dev work carried forward (FerretDB v1 fork backend parity — not an issue, recorded so the next session can resume).</summary>

declared-index usability across the PostgreSQL / MySQL / MariaDB / SAP HANA
backends. DONE: range (`$gt/$gte/$lt/$lte`) and `$in` pushdown are implemented
and unit-tested on sqlite/postgresql/mysql/hana; the external-DB snap launcher
(`wekan-ferretdb-handler` / `wekan-ferretdb-url`) is in; `ROADMAP.md` +
`docs/pushdown.md` are updated; the OpLog `ts` index is now created best-effort
in each backend's `collectionCreate` (postgresql btree
`(((_jsonb->>'ts')::numeric))`, mysql functional
`((CAST(_ferretdb_sjson->>'$.ts' AS DECIMAL(65,10))))` with a **MariaDB
fallback** to a `STORED` generated column on that CAST + a column index since
MariaDB has no functional key parts, hana a DocStore index) with a descriptive
WARN log on failure; and the **MariaDB-vs-mysql-backend assessment is done**
(MariaDB speaks the MySQL wire protocol and the backend does not gate on
vendor/version — the `json` column, `->`/`->>`/`JSON_CONTAINS`/`JSON_TYPE`, the
generated-`STORED` index workaround, `EXPLAIN FORMAT=JSON` and
`information_schema` all work on MariaDB 10.2+; the functional ts index was the
one concrete break, now fixed; every pushdown is a superset with an in-Go
re-filter so results stay correct regardless). VERIFICATION BOUNDARY / NEXT: the
sandbox can only run/EXPLAIN the SQLite backend, so the maintainer must confirm
on live PostgreSQL / MySQL / MariaDB / SAP HANA that the range pushdown
expression MATCHES the indexed expression and the optimizer actually USES the
index (today the mysql pushdown compares `col->'$.ts'` while the index is on
`CAST(col->>'$.ts' AS DECIMAL)`, so the pushdown likely needs to emit the same
CAST), plus whether MariaDB's `JSON_TYPE` returns the same
`INTEGER`/`DOUBLE`/`DECIMAL` tokens — all correctness-neutral (only
selectivity), verifiable only with live `EXPLAIN` on each engine.

</details>

<details>
<summary>Feature requests / behaviour-by-design rather than bugs.</summary>

[#2204](https://github.com/wekan/wekan/issues/2204) (restrict permanent delete
to the Admin role), [#5081](https://github.com/wekan/wekan/issues/5081)
(redesign the owner/member/assignee avatar layout on mini cards — a UI proposal;
@xet7 asked for a PR), [#1213](https://github.com/wekan/wekan/issues/1213)
(copy-card resets comment authorship/date — the visible card items are
activities recorded as the copying user at copy time; changing this is a design
decision @xet7 raised, not a clear bug),
[#5323](https://github.com/wekan/wekan/issues/5323) (notification/webhook
reminder on a card's due date with a per-board offset — labelled Feature; the
built-in due-date reminder already exists (`NOTIFY_DUE_DAYS_BEFORE_AND_AFTER`,
improved in #3192), so the remaining ask is the per-board offset UI + a webhook
reminder, a feature).

</details>

<details>
<summary>Carried from a fix that went as far as it could without a new dependency.</summary>

[#6586](https://github.com/wekan/wekan/issues/6586) has two parts left. The PDF
export now writes Windows-1252, which covers the Western European letters the
report was about and transliterates the rest of the Latin script - but a
Cyrillic, Greek, Hebrew, Arabic or CJK board still exports as `?`, because the
base-14 PDF fonts have no glyphs for them. Fixing that means EMBEDDING a Unicode
font: a TrueType binary in the repository (DejaVu Sans is about half a
megabyte), plus glyph-id mapping, a widths array and a ToUnicode CMap in the
writer. That is a dependency decision rather than a bug fix. The same issue also
asks for the markdown-flavoured export to be offered as a `.md` file in its own
right, which is a new export format, not a change to this one.

An upgrade report by email has one more: after a 6.09 to 10.85 dump-and-restore,
one board that has attachments loads forever - "it only loads and shows nothing:
no cards, nothing but the loading animation" - while every other board on the
same instance is fine. The attached `snap logs wekan.mongodb` is mongod startup
only, with no errors in it, so there is nothing yet to point at; it needs that
board's data, or the browser console and the WeKan (not mongod) log while it
hangs.

</details>

<details>
<summary>Needs a maintainer decision on the intended contract (partly already works).</summary>

[#4912](https://github.com/wekan/wekan/issues/4912) (a global `act-editCard`
webhook — card title/description edits ALREADY reach the global webhook via
`Activities.after.insert` as `act-a-changedTitle` / `act-a-changedDescription`
from #3619/#5482; a single consolidated `act-editCard` action needs a decision
on which fields count and whether it supplements or replaces the existing
per-field events, to avoid duplicate webhook deliveries),
[#6580](https://github.com/wekan/wekan/issues/6580) (CHANGELOG.md is 43,748
lines and 2.02 MB, over the size at which GitHub refuses to render it — its
Blame tab answers *"we can't show files that are this big"* and the file view
truncates. Splitting it by year was tried and abandoned: git records no move,
so a plain `git blame` on a per-year file credits every line to the commit that
split it, and only `git blame -C` reaches the real history — which editors do
not pass by default. That traded working local blame on eleven years of entries
for a smaller file, and local blame is worth more. Reverting a split does not
undo it either: the restored lines blame to the revert, so the only clean way
back is to not land it. Any fix needs a way to shrink the file that keeps `git
blame` working with no flag — or a decision that the trade is acceptable after
all),
.

</details>

<details>
<summary>Deferred pending a security decision.</summary>

Making WeKan's eight custom URL schemes (`file:`, `thunderlink:`,
`cbthunderlink:`, `onenote:`, `aodroplink:`, `abasurl:`, `conisio:`,
`mailspring:`) actually CLICKABLE — the ask in
[#3218](https://github.com/wekan/wekan/issues/3218). They are registered with
markdown-it so they are recognised, and two filters then remove the link:
markdown-it's own `validateLink` refuses `file:` (with `javascript:`,
`vbscript:` and `data:`), and the viewer's DOMPurify allows only
http/https/ftp/ftps/mailto/tel/callto/cid/xmpp hrefs. So the schemes have never
produced a link, and #6588 showed that their only observable effect was a crash.
Enabling them means relaxing both filters for schemes whose whole purpose is to
launch a local application from a link somebody else may have written into a
card — a decision for xet7, not a side effect of a crash fix.


Syntax/color highlighting for code blocks in the card viewer (`+viewer`; the
copy-to-clipboard half of #5149, which asked for both, is done and that issue is
closed). It IS
possible — set MarkdownIt's `highlight` option with a highlighter (e.g.
`highlight.js`) and ship a theme — BUT the viewer's DOMPurify
(`packages/markdown/src/secureDOMPurify.js`) deliberately strips EVERY `class`
and `id` attribute (in `FORBID_ATTR` plus a hook, "for CSS injection" safety),
so a highlighter's `<span class="hljs-...">` output would have its classes
removed and NO colour would survive. Enabling it therefore requires carefully
relaxing the sanitizer to allow a TIGHT allowlist of `hljs-*` / `language-*`
classes on `<span>` inside `pre>code` only, which is a security trade-off xet7
has not decided on yet (adds a dependency + loosens the XSS sanitizer + needs a
browser build to verify).

</details>

# Upcoming WeKan ® release

**In short:** **all supported non-English translations are complete** across
boards and cards, workflows, import/export, search, administration, security,
recovery, file and cloud storage, data safety, backups and migrations. All
Boards Table view now has a compact, themed controls row, and Admin Panel
reports show complete, actionable data and controls.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

and fixes the following bugs:

**Top header** - compact actions leave room for one-row controls.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8af89a687">Keep the top Add Board button square</a>. Thanks to xet7.</summary>

The icon-only Add Board action is now a fixed 28-by-28-pixel square matching
the shared quick-access button height. It no longer grows into all spare header
space, so neighbouring controls remain on one row whenever their actual widths
fit. A regression test locks the equal dimensions, zero padding and non-growing
flex contract to prevent the formerly ten-button-wide hit area from returning.

</details>

**All Boards** - Table view uses one compact, themed controls row.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/438477c92">Compact All Boards table controls</a>. Thanks to xet7.</summary>

The Table view now places Add Board beside search and pagination instead of on
an otherwise empty row below the pane title. The action uses the same white
text and theme-accent fill as the shared table controls, while the transparent
background reset remains scoped to the Lists view's add-board tile. Regression
coverage protects the compact structure, the Templates label and both button
styles.

</details>

**Cards** - title-bar controls follow each card's contrast color.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ebb35af50">Match card chrome to title color</a>. Thanks to xet7.</summary>

Opened-card collapse, close, maximize/minimize, menu, drag, zoom and display-mode
controls now inherit the same computed contrast color as the card title in all
interaction states. Minicard titles, menus and drag handles use that same color;
light palette colors now use the same black text as their opened cards, while
dark colors retain white text. Custom hex cards follow their calculated color
without duplicating the palette. Regression coverage checks every header control
and both light and dark minicard families.

</details>

**Swimlanes** - header controls follow the title contrast color.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa8c3959c">Match swimlane controls to title color</a>. Thanks to xet7.</summary>

The collapse caret, hamburger menu and add button now inherit the swimlane
header's computed title color in both their normal and hover states. Named dark
swimlanes and custom hex colors therefore show white controls with a white
title, while light swimlanes keep dark controls with their dark title. A source
regression test covers all three visible controls and rejects hard-coded color
overrides.

</details>

**Admin Panel** - reports show complete, actionable data and controls.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5d32a5cc">Restore legacy Offices login history</a>. Thanks to xet7.</summary>

Offices now reconstructs its person-first rows from the legacy address-side
login tally when no newer per-user tallies exist. Upgrading therefore no longer
hides all previously recorded offices until every user logs in again. Counts,
IPv4, IPv6, proxy location, timestamps and deleted-account names are preserved
without inventing user IDs or geography, with regression coverage for both
storage generations.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cde94d0b1">Filter Boards Report by permission</a>. Thanks to xet7.</summary>

Boards Report now has an All, Public and Private permission dropdown. Search,
row publication, count and pagination share one validated server-side selector,
so changing the filter resets to the first page and cannot leave stale rows or
an incorrect page count. Source and browser tests cover both permission values
and reject unsupported direct-call values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/99b1801e8">Gate and audit Files Report permanent deletion</a>. Thanks to xet7.</summary>

The Files Report shows its permanent-delete icon only to a Global Admin while
the Admin Panel permanent-delete setting is enabled, and the server enforces
both gates against direct method calls. Every successful, failed or unauthorized
attempt records the actor, addresses, available location, attachment ID,
sanitized filename and card ID in Problems / Recovery. The same audit notice is
shown above Files Report and Recovery.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2248c012c">Add card-style previews to Files Report</a>. Thanks to xet7.</summary>

Each Files Report row now starts with the opened-card attachment controls: an
image thumbnail or file-type tile, preview action and sanitized download action.
Preview opens the existing attachment viewer and its previous/next slideshow is
limited to the report page currently displayed, excluding unrelated files that
happen to be cached. Source and browser regression tests cover rendering,
filename safety, preview opening and download naming.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37b7eb06a">Show wrapping names in Admin Panel user cells</a>. Thanks to xet7.</summary>

Single-user columns now show the username beside the fixed-size avatar instead
of hiding it in a mouse-only tooltip. Long names wrap inside their own cell
without squeezing the avatar or crossing into adjacent columns. The common
table component applies this to Impersonation, Security and every other Admin
Panel table, and the complete shared table, row, template and menu test suites
verify the Admin Panel layouts.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa68600bb">Show origin context in all Problems event reports</a>. Thanks to xet7.</summary>

Recovery rows now store and display IPv4, IPv6 and the location supplied by a
trusted proxy. Events created through DDP now use the same proxy-aware address
and location extraction as HTTP and REST events, so Security, Speed, Tests,
CPU, Database and Filesystem-integrity reports no longer lose their available
origin context. Regression tests cover both transports and the Recovery schema,
writer and table.

</details>

and improves the translations:

**All remaining languages** - every supported non-English locale is complete.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2880c4e6">Complete all remaining translations</a>. Thanks to xet7.</summary>

Akan, Aragonese, Aymara, Bislama, Corsican, Friulian, Hawaiian, Kashubian,
Latin, Ladin, Luganda, Luxembourgish, Maltese, Neapolitan, Papiamento, Quechua,
Romansh, Aromanian, Sardinian, Shona, Sicilian, Silesian, Tagalog, Tatar, Tok
Pisin, Tongan, Tsonga, Tswana, Upper Sorbian, Urdu and Wolaytta now cover every
actionable source string.
Language-specific tests require zero English placeholders and preserve all
format tokens and HTML structure. The global fill report is now zero, the
wrong-script audit is clean and human Transifex translations remain preferred.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cae1d48b">Enforce translation completeness globally</a>. Thanks to xet7.</summary>

A repository-wide regression gate now verifies all 234 non-English locale files
against English for exact keys, key order and every underscore-delimited or
percent-prefixed placeholder. Its first run restored the required `%{value}`
token without replacing surrounding human prose in 36 locale tags, separated
joined card/list placeholders in three Chinese locales and restored Wolaytta's
key order. The actionable backlog, wrong-script audit and human-preference
checks remain clean.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c37b7c77">Retire the completed translation backlog</a>. Thanks to xet7.</summary>

The finished translation work is no longer presented as future work in TODO
Later, and the README now derives the same 234 essentially complete non-English
locales that the registry test counts from the data files. The resumable work
history is preserved in Git, while Upcoming states the current zero-backlog
result.

</details>

**Albanian** - activity history and workspace navigation.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/47b560ccd">Translate first Albanian backlog batch</a>. Thanks to xet7.</summary>

Fifty activity, checklist, board-selection and workspace strings are now in
Albanian, with every `%s` and `__name__`-style placeholder preserved exactly.
Regression coverage prevents the translated batch from returning to English and
checks the complete token inventory. The backlog is now 78,120 actionable values
across 36 whole-file-sized locales; all 198 near-complete locale files have no
actionable gaps.

The same change teaches the fill report that `Server` is an invariant technical
loanword. This keeps the documented, valid Bosnian spelling instead of changing
it to Croatian `Poslužitelj` merely to satisfy a counter.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88c7edcaa">Continue Albanian translation backlog</a>. Thanks to xet7.</summary>

Two more 50-value Albanian batches add Home-board, list sizing, keyboard,
swimlane, administration, archive, attachment and board-background strings.
Their regression inventory now covers all first 150 values and every replaceable
token. This leaves 78,020 actionable values across 36 second-tier languages.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/674abb4ff">Translate Albanian board and card views</a>. Thanks to xet7.</summary>

The fourth 50-value Albanian batch adds desktop/mobile and zoom modes, calendar
navigation, archive warnings, card details, voting, board backgrounds and member
summaries. Locale-wide regression coverage checks every translated Albanian
value's replaceable tokens and pins the remaining actionable count at 1,915.
The repository-wide backlog is now 77,970 values across 36 languages.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa447f0ab">Translate Albanian dialogs and appearance</a>. Thanks to xet7.</summary>

Two 50-value batches add Albanian voting, Planning Poker, dependencies,
organization and team dialogs, import windows, themes, fonts, permissions and
imported-user mapping. The locale-wide token audit and representative regression
assertions now cover the first 300 actionable values. This leaves 77,870 values
across 36 languages.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1605063bd">Translate Albanian roles and custom fields</a>. Thanks to xet7.</summary>

The seventh and eighth 50-value Albanian batches add card aging, navigation,
colors, restricted roles, deletion confirmations, clipboard actions, templates
and custom fields. Ninety-eight values required translation; `indigo` and
`magenta` remain correct international color names and are now classified as
invariant instead of recurring as false gaps across languages. This leaves
77,700 actionable values across 36 languages, including 1,715 in Albanian.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ecfdfbbef">Translate Albanian email exports and filters</a>. Thanks to xet7.</summary>

The ninth and tenth 50-value Albanian batches add profile and date editing,
account emails, validation errors, card PDF and Excel exports, sorting and card
filters. Ninety-nine values required translation; `Email` is now treated as the
valid international technical loanword it is, removing fourteen false gaps from
the repository-wide report. This leaves 77,586 actionable values across 36
languages, including 1,615 in Albanian.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/86e3716dd">Translate Albanian import workflows</a>. Thanks to xet7.</summary>

The eleventh and twelfth 50-value Albanian batches add advanced filters,
inactive and imported members, Kanboard, Deck, OpenProject, Asana, ZenKit, Jira,
Excel and WeKan import guidance, safe Trello ZIP errors, Trello API progress and
member mapping. The importer placeholders and command examples remain intact.
This leaves 77,486 actionable values across 36 languages, including 1,515 in
Albanian.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/71021503a">Translate Albanian roles and account controls</a>. Thanks to xet7.</summary>

The twenty-third and twenty-fourth 50-value Albanian batches add account and
layout controls, due-reminder activity, organization, team and user dialogs,
notifications, role permissions, weekdays, status and linked-card safeguards.
All one hundred values required translation. Regression coverage pins the full
mention-event token set and representative role and weekday wording. This leaves
77,006 actionable values across 36 languages, including 916 in Albanian.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6bd9f6fae">Translate Albanian shared views and search</a>. Thanks to xet7.</summary>

The twenty-fifth and twenty-sixth 50-value Albanian batches add domain-scoped
shared templates, My Cards and Due Cards views, global search result messages,
operators and predicates. All one hundred values required translation. Search
operator names stay single words for parser compatibility, and tests retain all
result-count tokens. This leaves 76,906 actionable values across 36 languages,
including 816 in Albanian.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3ed2cd5e">Translate Albanian search help and dependencies</a>. Thanks to xet7.</summary>

The twenty-seventh and twenty-eighth 50-value Albanian batches add global-search
validation, paging and complete operator instructions, board and card sorting,
stickers, card dependencies, dependency import, board backgrounds and locations.
All one hundred values required translation. Tests retain every search token,
HTML example tag, dependency count and image-size placeholder. This leaves
76,806 actionable values across 36 languages, including 716 in Albanian.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8cf11e4a4">Translate Albanian reports and support</a>. Thanks to xet7.</summary>

The twenty-ninth and thirtieth 50-value Albanian batches add map selection,
server troubleshooting, string templates, Admin Panel problem reports, office
and API usage, recovery status, wait indicators, destructive safeguards and
support requests. All one hundred values required translation. Tests retain the
shell commands, configuration names, IP protocol labels and string-template
placeholder. This leaves 76,706 actionable values across 36 languages,
including 616 in Albanian.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f48675db">Translate Albanian attachment administration</a>. Thanks to xet7.</summary>

The thirty-first and thirty-second 50-value Albanian batches add invitations,
Node memory metrics, organization administration, legal notices, checklist and
attachment actions, storage moves and repair, file statistics and MongoDB
compaction guidance. All one hundred values required translation. Tests retain
Node, GridFS, S3, MongoDB and Meteor where they identify concrete technologies.
This leaves 76,606 actionable values across 36 languages, including 516 in
Albanian.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/990dad824">Translate Albanian accessibility and scheduled jobs</a>. Thanks to xet7.</summary>

The thirty-third and thirty-fourth 50-value Albanian batches add board-status
summaries, upload rules, custom translations, checklist display, support and
accessibility settings, account-lockout controls, Admin Panel people filters,
scheduled jobs, attachment paths and scheduled board operations. All one
hundred values required translation. Tests retain the `__workspaces__` token
and the ISO, PDF, JSON and API technology names. This leaves 76,506 actionable
values across 36 languages, including 416 in Albanian.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c5af08f2">Translate Albanian migration and security settings</a>. Thanks to xet7.</summary>

The thirty-fifth and thirty-sixth 50-value Albanian batches add scheduled-job
results, filesystem and cloud-storage settings, MongoDB/FerretDB and Sandstorm
migration guidance, card-loading modes, safe rich-text display controls,
import/export restrictions, user anonymization and backups. All one hundred
values required translation. Tests retain `__db__`, HTML tags, database and
cloud-service names and environment-variable examples. This leaves 76,406
actionable values across 36 languages, including 316 in Albanian.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9055e4fa5">Translate Albanian backup and cloud storage settings</a>. Thanks to xet7.</summary>

The thirty-seventh and thirty-eighth 50-value Albanian batches add backup
scheduling and restoration, GCS, Azure and S3 setup guidance, connection tests,
attachment-storage migrations, scheduled board operations and minicard list
settings. All one hundred values required translation. Tests retain HTML tags,
cloud-console labels, environment-variable names and storage technologies. This
leaves 76,306 actionable values across 36 languages, including 216 in Albanian.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85fdcaadc">Translate Albanian board integrity migrations</a>. Thanks to xet7.</summary>

The thirty-ninth and fortieth 50-value Albanian batches add board-integrity
checks, duplicate-list cleanup, lost-card restoration, file and avatar URL
repair, migration confirmations and progress steps, CPU and memory statistics,
job queues and filesystem migration. All one hundred values required
translation. Tests retain database field names and technical storage terms.
This leaves 76,206 actionable values across 36 languages, including 116 in
Albanian.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/15494a909">Complete Albanian translation backlog</a>. Thanks to xet7.</summary>

The final 116 Albanian values add storage-migration controls, throttling and
monitoring, repository accounts, login failures, Admin Panel problem fields,
broken-card repairs and scoped imports. Albanian now has zero actionable
English placeholders. Locale-wide tests retain every replaceable token and HTML
tag, including repair counts and global-search examples. This leaves 76,090
actionable values across 35 whole-file-sized languages.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58c79fe87">Start Southern Sotho translation backlog</a>. Thanks to xet7.</summary>

The first 50-value Southern Sotho batch adds detailed card movements, member
changes, activity history, checklist actions and workspace navigation. All
values required translation. New locale-wide regression coverage retains every
replaceable token and HTML tag and pins the remaining Southern Sotho count at
2,074. This leaves 76,040 actionable values across 35 languages.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/74aa1e7d0">Translate Southern Sotho board layout controls</a>. Thanks to xet7.</summary>

The second 50-value Southern Sotho batch adds workspace deletion, multi-board
selection, Home-board settings, list widths, keyboard shortcuts, swimlane
heights and card-addition controls. All values required translation. Tests
retain activity placeholders and representative board-layout terminology. This
leaves 75,990 actionable values across 35 languages, including 2,024 in
Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f8781cd9">Translate Southern Sotho roles and weekdays</a>. Thanks to xet7.</summary>

The twenty-fourth 50-value Southern Sotho batch adds multi-card windows,
Enter-key editing, organization, team and user dialogs, notification read
states, board role permissions and weekdays. All values required translation.
Tests retain Shift, Ctrl and Cmd keyboard combinations and pin assigned-role and
weekday wording. This leaves 74,890 actionable values across 35 languages,
including 924 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/78a9c63f6">Translate Southern Sotho shared views and search</a>. Thanks to xet7.</summary>

The twenty-fifth 50-value Southern Sotho batch adds linked-card deletion safety,
checklist display, shared templates and domains and My Cards, Due Cards and
global search views. All values required translation. Tests retain the domain
example and restriction and every missing board, swimlane and list token. This
leaves 74,840 actionable values across 35 languages, including 874 in Southern
Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c2fbdd14">Translate Tswana card export and filters</a>. Thanks to xet7.</summary>

The eleventh 50-value Tswana batch adds account conflicts, board and card
export, selectable Excel fields and attachment details, list sorting and date,
label and member filters. All values required translation, with low confidence
in some grammar pending human refinement. Tests retain PDF and Excel names and
board, list, swimlane and tomorrow terminology. This leaves 66,894 actionable
values across 31 languages, including 1,624 in Tswana.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a8cfa096">Translate Tswana account email and validation</a>. Thanks to xet7.</summary>

The tenth 50-value Tswana batch adds custom-field and permanent-delete options,
profiles, WIP controls, account enrollment, invitation, password-reset and
verification email and board, JSON, CSV, TSV, import and linked-card errors. All
values required translation, with low confidence in some grammar pending human
refinement. Tests retain all email placeholders and data format names. This
leaves 66,944 actionable values across 31 languages, including 1,674 in Tswana.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27f2f26aa">Translate Tswana permissions and custom fields</a>. Thanks to xet7.</summary>

The ninth 50-value Tswana batch adds board roles, destructive checklist and
subtask confirmation, clipboard links, multi-card JSON templates and
custom-field creation, colors, currency and dropdowns. All values required
translation, with low confidence in some grammar pending human refinement.
Tests retain swimlane terminology and prove the localized JSON example parses.
This leaves 66,994 actionable values across 31 languages, including 1,724 in
Tswana.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32e0b5da7">Translate Tswana navigation and colors</a>. Thanks to xet7.</summary>

The eighth 50-value Tswana batch adds starring, automatic list width, card
aging, keyboard movement, accessible dialog and content navigation and board
colors. All values required translation, including descriptive replacements
for two apparent English color loanwords, with low confidence in some
terminology pending human refinement. Tests retain aging tiers, archive and
core color terms. This leaves 67,044 actionable values across 31 languages,
including 1,774 in Tswana.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a20099e25">Translate Tswana member mapping and appearance</a>. Thanks to xet7.</summary>

The seventh 50-value Tswana batch adds member and import dialogs, safe mapping
of virtual members to real accounts, board themes, fonts, text colors, avatars,
language and permissions. All values required translation, with low confidence
in some grammar pending human refinement. Tests retain CAS, numeric font
preview and swimlane, organization and permission terminology. This leaves
67,094 actionable values across 31 languages, including 1,824 in Tswana.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06bfed394">Translate Tswana card dialogs and voting</a>. Thanks to xet7.</summary>

The sixth 50-value Tswana batch adds card members, attachments and custom
fields, voting and Planning Poker and dependency, organization, team, domain
and import dialogs. All values required translation, with low confidence in
some grammar pending human refinement. Tests retain Planning Poker and core
swimlane and organization terminology. This leaves 67,144 actionable values
across 31 languages, including 1,874 in Tswana.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73107aee3">Translate Tswana board views and archives</a>. Thanks to xet7.</summary>

The fifth 50-value Tswana batch adds public-board details, board drag and drop,
appearance, mobile and desktop views, zoom, calendar navigation and destructive
card, list and swimlane archive guidance. All values required translation, with
low confidence in some grammar pending human refinement. Tests retain HTML,
workspace, zoom and comment placeholders. This leaves 67,194 actionable values
across 31 languages, including 1,924 in Tswana.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf879f701">Translate Tswana archive and board display settings</a>. Thanks to xet7.</summary>

The fourth 50-value Tswana batch adds administration announcements, offline
recovery, board, list and swimlane archives, templates, attachment deletion,
background images and board member and assignee display. All values required
translation, with low confidence in some grammar pending human refinement.
Tests retain count and size placeholders, HTML and URL syntax. This leaves
67,244 actionable values across 31 languages, including 1,974 in Tswana.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7965f8561">Translate Tswana board sizing controls</a>. Thanks to xet7.</summary>

The third 50-value Tswana batch adds workspace deletion and bulk board actions,
Home board selection, list width and swimlane height controls, keyboard
shortcuts and checklist conversion. All values required translation, with low
confidence in some grammar pending human refinement. Tests retain date
placeholders, pixel and width limits and card terminology. This leaves 67,294
actionable values across 31 languages, including 2,024 in Tswana.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/426d051e6">Translate Tswana activity and workspaces</a>. Thanks to xet7.</summary>

The second 50-value Tswana batch adds card movement and restoration, concise
activity messages, checklist operations, received and start dates and workspace
creation and editing. All values required translation, with low confidence in
some grammar pending human refinement. Tests retain every movement and import
placeholder and workspace and markdown terminology. This leaves 67,344
actionable values across 31 languages, including 2,074 in Tswana.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/83b3c18dd">Translate Tswana board activity basics</a>. Thanks to xet7.</summary>

The first 50-value Tswana batch adds title, description, deletion, comment,
attachment, label, checklist, custom-field, archive and import activity. All
values required translation, with low confidence in some grammar pending human
refinement. A new locale-wide regression verifies HTML and placeholder
inventories and core board terminology. This leaves 67,394 actionable values
across 31 languages, including 2,124 in Tswana.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8fefb4b7">Complete Tigre translations</a>. Thanks to xet7.</summary>

The final 24-value Tigre batch adds CPU and security-event columns,
filesystem-integrity reporting, scoped export and WeKan JSON/ZIP import. All
values required translation, with low confidence in some terminology pending
human refinement. Tests retain IP protocol, format, search and result
placeholders and now require zero remaining Tigre values. This leaves 67,444
actionable values across 31 languages.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9415ea5a">Translate Tigre repository and repair status</a>. Thanks to xet7.</summary>

The forty-third 50-value Tigre batch adds system totals, repository account and
upload flows, authentication failures, Admin Panel progress and broken-card and
list repair results. All values required translation, with low confidence in
some terminology pending human refinement. Tests retain OTP, CPU and every
repair count placeholder. This leaves 67,468 actionable values across 32
languages, including 24 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0217715b9">Translate Tigre migration scheduling controls</a>. Thanks to xet7.</summary>

The forty-second 50-value Tigre batch adds migration queue, concurrency,
resource thresholds, batch timing, background progress and attachment storage
distribution controls. All values required translation, with low confidence in
some terminology pending human refinement. Tests retain batch ranges, CPU
percentage and millisecond limits. This leaves 67,518 actionable values across
32 languages, including 74 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/588aa1308">Translate Tigre migration steps and metrics</a>. Thanks to xet7.</summary>

The forty-first 50-value Tigre batch adds board conversion and repair steps,
cleanup, CPU and duration metrics, scan intervals and filesystem and GridFS
monitoring. All values required translation, with low confidence in some
terminology pending human refinement. Tests retain card, ID and CPU terms. This
leaves 67,568 actionable values across 32 languages, including 124 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9961480b">Translate Tigre board integrity migrations</a>. Thanks to xet7.</summary>

The fortieth 50-value Tigre batch adds comprehensive board integrity checks,
duplicate-list cleanup, lost-card and archive restoration, file URL repair and
migration progress. All values required translation, with low confidence in
some terminology pending human refinement. Tests retain swimlane and list IDs,
URL syntax and destructive confirmation prompts. This leaves 67,618 actionable
values across 32 languages, including 174 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68c542b06">Translate Tigre storage migration controls</a>. Thanks to xet7.</summary>

The thirty-ninth 50-value Tigre batch adds cloud connection tests, Azure and
GCS attachment moves, GridFS and S3 configuration and pausable, resumable and
stoppable migrations. All values required translation, with low confidence in
some terminology pending human refinement. Tests retain MongoDB GridFS, region
and SSL/TLS syntax. This leaves 67,668 actionable values across 32 languages,
including 224 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c0cdbf8fe">Translate Tigre cloud backup settings</a>. Thanks to xet7.</summary>

The thirty-eighth 50-value Tigre batch adds instance and organization backup
scope, schedules and restore modes and complete GCS, S3 and Azure configuration
paths. All values required translation, with low confidence in some terminology
pending human refinement. Tests retain time syntax, JSON field and cloud access
key names. This leaves 67,718 actionable values across 32 languages, including
274 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d05c3eb2c">Translate Tigre data safety controls</a>. Thanks to xet7.</summary>

The thirty-seventh 50-value Tigre batch adds Sandstorm migration cleanup,
adaptive card loading and security controls for plain-text links and code,
import/export, identity anonymization, activity, notifications and backups. All
values required translation, with low confidence in some terminology pending
human refinement. Tests retain loading variables, hidden HTML syntax and cloud
storage names. This leaves 67,768 actionable values across 32 languages,
including 324 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/51efa5380">Translate Tigre scheduled migrations and storage</a>. Thanks to xet7.</summary>

The thirty-sixth 50-value Tigre batch adds scheduled board operations and
migration recovery, filesystem, S3 and Azure storage and bidirectional MongoDB
and FerretDB migration guidance. All values required translation, with low
confidence in some terminology pending human refinement. Tests retain storage
product names, the database placeholder and migration environment variable.
This leaves 67,818 actionable values across 32 languages, including 374 in
Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/791154c2c">Translate Tigre accessibility and login protection</a>. Thanks to xet7.</summary>

The thirty-fifth 50-value Tigre batch adds support and accessibility content,
brute-force login protection and user unlocking, scheduled jobs, attachment
storage paths and board archive and backup scheduling. All values required
translation, with low confidence in some terminology pending human refinement.
Tests retain password, seconds and attachment terms. This leaves 67,868
actionable values across 32 languages, including 424 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24091262a">Translate Tigre board status and support settings</a>. Thanks to xet7.</summary>

The thirty-fourth 50-value Tigre batch adds board time status, upload progress,
file and avatar limits, PDF fallback, workspace dragging, custom translations,
ZIP board import, checklist display and support settings. All values required
translation, with low confidence in some terminology pending human refinement.
Tests retain the workspace placeholder and PDF, JSON and ZIP format names. This
leaves 67,918 actionable values across 32 languages, including 474 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a7185eac">Translate Tigre attachment storage maintenance</a>. Thanks to xet7.</summary>

The thirty-third 50-value Tigre batch adds attachment and avatar moves between
the filesystem, GridFS and S3, location repair, storage statistics and MongoDB
compaction guidance. All values required translation, with low confidence in
some terminology pending human refinement. Tests retain the storage, MongoDB,
oplog and Meteor terms. This leaves 67,968 actionable values across 32
languages, including 524 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb54eb4c3">Translate Tigre teams and checklist actions</a>. Thanks to xet7.</summary>

The thirty-second 50-value Tigre batch adds help requests, team and organization
membership, invitations, Node memory metrics, legal notices and checklist move,
copy and multiline-item actions. All values required translation, with low
confidence in some terminology pending human refinement. Tests retain Node and
malloc terms, the legal URL and item equality syntax. This leaves 68,018
actionable values across 32 languages, including 574 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6e24714b2">Translate Tigre recovery and ticket reports</a>. Thanks to xet7.</summary>

The thirty-first 50-value Tigre batch adds office login details, REST API and
automatic recovery reporting, recovery maintenance, swimlane copying, wait
spinners, protected organization deletion, tickets and change history. All
values required translation, with low confidence in some terminology pending
human refinement. Tests retain REST API configuration and MongoDB names. This
leaves 68,068 actionable values across 32 languages, including 624 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c88a759f">Translate Tigre maps and problem reports</a>. Thanks to xet7.</summary>

The thirtieth 50-value Tigre batch adds map coordinates and detection, server
troubleshooting, swimlane movement, string templates and Admin Panel file,
security, speed, test, database, impersonation, recovery and office reports.
All values required translation, with low confidence in some terminology
pending human refinement. Tests retain template placeholders, literal support
commands and IP protocol names. This leaves 68,118 actionable values across 32
languages, including 674 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/edcd38772">Translate Tigre dependencies and backgrounds</a>. Thanks to xet7.</summary>

The twenty-ninth 50-value Tigre batch adds board and card sorting, completion,
stickers, typed card dependencies and JSON/SVG import, board backgrounds and
map locations. All values required translation, with low confidence in some
terminology pending human refinement. Tests retain import counts, the upload
size placeholder and dependency format names. This leaves 68,168 actionable
values across 32 languages, including 724 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9de47e1be">Translate Tigre search instructions</a>. Thanks to xet7.</summary>

The twenty-eighth 50-value Tigre batch adds search validation, pagination and
the complete operator, status, existence, sorting and combination guide. All
values required translation, with low confidence in some explanatory grammar
pending human refinement. Tests retain the full existence-query placeholder
inventory and literal AND and OR syntax. This leaves 68,218 actionable values
across 32 languages, including 774 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4bbb0aa38">Translate Tigre search operators</a>. Thanks to xet7.</summary>

The twenty-seventh 50-value Tigre batch adds missing-result messages, card
result counts and global-search operators and predicates for boards, people,
dates, content and attachments. All values required translation, with low
confidence in some terminology pending human refinement. Tests retain every
result placeholder and enforce single-token multiword search operators. This
leaves 68,268 actionable values across 32 languages, including 824 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9573cd667">Translate Tigre shared views and search</a>. Thanks to xet7.</summary>

The twenty-sixth 50-value Tigre batch adds linked-card deletion safety,
checklist display, tasks, domains and shared templates and My Cards, Due Cards
and global search views. All values required translation, with low confidence
in some grammar pending human refinement. Tests retain the domain example,
search emphasis, format placeholder and missing board terminology. This leaves
68,318 actionable values across 32 languages, including 874 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/70fed7d8a">Translate Tigre roles and editor settings</a>. Thanks to xet7.</summary>

The twenty-fifth 50-value Tigre batch adds multi-card and Enter-key editing,
organization, team and user dialogs, notification filters, board-role rights,
weekday names and recent activity metadata. All values required translation,
with low confidence in some grammar pending human refinement. Tests retain the
editor key combinations and complete ordered weekday set. This leaves 68,368
actionable values across 32 languages, including 924 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8fb8f5ce">Translate Tigre account and due date settings</a>. Thanks to xet7.</summary>

The twenty-fourth 50-value Tigre batch adds logo and card display settings,
custom HTML placement, authentication errors, board duplication, destructive
account confirmations, card positioning and due-date activity and reminders.
All values required translation, with low confidence in some grammar pending
human refinement. Tests retain HTML structure and all activity placeholders.
This leaves 68,418 actionable values across 32 languages, including 974 in
Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c140f4d86">Translate Tigre rule details and site settings</a>. Thanks to xet7.</summary>

The twenty-third 50-value Tigre batch adds detailed automation actions, card
creation and movement, checklist and swimlane fields, date updates, card links,
authentication and custom HTML, JSON manifest and asset-link settings. All
values required translation, with low confidence in some grammar pending human
refinement. Tests retain the comma-separated item example and HTML and JSON
format names. This leaves 68,468 actionable values across 32 languages,
including 1,024 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c15229795">Translate Tigre automation rule actions</a>. Thanks to xet7.</summary>

The twenty-second 50-value Tigre batch adds automation-rule label, member,
attachment and checklist conditions and card movement, archive, color, member,
checklist and email actions. All values required translation, with low
confidence in some grammar pending human refinement. Tests retain the archive,
all-member removal and relative list-bottom actions. This leaves 68,518
actionable values across 32 languages, including 1,074 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1459dda2d">Translate Tigre scheduled automation rules</a>. Thanks to xet7.</summary>

The twenty-first 50-value Tigre batch adds visual n8n and Node-RED workflow
imports, scheduled and button triggers, due-date timing, relative dates and
sorting and completion actions. All values required translation, with low
confidence in some explanatory grammar pending human refinement. Tests retain
workflow product names, the count placeholder, weekday range and literal
schedule variable. This leaves 68,568 actionable values across 32 languages,
including 1,124 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f32cc7bf2">Translate Tigre automation rule basics</a>. Thanks to xet7.</summary>

The twentieth 50-value Tigre batch adds label and custom-field activity,
automation rule editing and workflow views, basic card triggers and JSON, CSV
and Trello Butler rule import/export. All values required translation, with low
confidence in some explanatory grammar pending human refinement. Tests retain
format and time placeholders and every import format name. This leaves 68,618
actionable values across 32 languages, including 1,174 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/97f966d6e">Translate Tigre card and subtask settings</a>. Thanks to xet7.</summary>

The nineteenth 50-value Tigre batch adds received and end dates, permanent
board and notification deletion, duplicate-list cleanup, subtask destinations,
minicard fields and parent-card paths. All values required translation, with
low confidence in some explanatory grammar pending human refinement. Tests
retain the board placeholder, checklist fractions, irreversible warning and
parent-card term. This leaves 68,668 actionable values across 32 languages,
including 1,224 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3be9d1b87">Translate Tigre system and organization settings</a>. Thanks to xet7.</summary>

The eighteenth 50-value Tigre batch adds Node, Meteor, FerretDB and operating
system diagnostics, reactivity and DDP modes, card field display and
organization tenancy, domains and administration. All values required
translation, with low confidence in some explanatory grammar pending human
refinement. Tests retain environment variables, protocols, host examples and
technical product names. This leaves 68,718 actionable values across 32
languages, including 1,274 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ecba7527a">Translate Tigre limits and webhooks</a>. Thanks to xet7.</summary>

The seventeenth 50-value Tigre batch adds WIP failures, attachment and API
transfer limits, registration, SMTP invitation emails and outgoing webhooks.
All values required translation, with low confidence in some explanatory
grammar pending human refinement. Tests retain WIP, API, SMTP and TLS names and
every invitation placeholder. This leaves 68,768 actionable values across 32
languages, including 1,324 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5baa94b07">Translate Tigre tracking and branding settings</a>. Thanks to xet7.</summary>

The sixteenth 50-value Tigre batch adds default and starred boards, spent and
overtime tracking, numbered assignee and label shortcuts, uploads, custom logos
and URL schemes, watching and welcome templates. All values required
translation, with low confidence in some explanatory grammar pending human
refinement. Tests retain numeric ranges, logo height, URL and WIP terms. This
leaves 68,818 actionable values across 32 languages, including 1,374 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30087db9d">Translate Tigre access and shortcut controls</a>. Thanks to xet7.</summary>

The fifteenth 50-value Tigre batch adds watched and participating notifications,
private and public access descriptions, member removal, unsaved-description
rescue, search and keyboard shortcuts. All values required translation, with
low confidence in some explanatory grammar pending human refinement. Tests
retain HTML and member placeholders, WeKan, Sandstorm, Google, Enter and WIP
terms. This leaves 68,868 actionable values across 32 languages, including
1,424 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/159495be2">Translate Tigre list and selection controls</a>. Thanks to xet7.</summary>

The fourteenth 50-value Tigre batch adds label deletion, leaving boards,
archiving and moving list cards, user, team and organization settings,
multi-selection and board roles. All values required translation, with low
confidence in some explanatory grammar pending human refinement. Tests retain
the board-title token, archive menu path, Excel CSV/TSV names and established
swimlane plural. This leaves 68,918 actionable values across 32 languages,
including 1,474 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92dc21d53">Translate Tigre Trello import controls</a>. Thanks to xet7.</summary>

The thirteenth 50-value Tigre batch adds safe Trello ZIP validation, workspace
placement, saved API credentials, selection, cancellation, resumption, results
and member mapping. All values required translation, with low confidence in
some explanatory grammar pending human refinement. Tests retain the Trello API
URL and token, irreversible cancellation warning and four-digit year example.
This leaves 68,968 actionable values across 32 languages, including 1,524 in
Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ce455503d">Translate Tigre advanced filters and imports</a>. Thanks to xet7.</summary>

The twelfth 50-value Tigre batch adds advanced filter syntax, member state and
impersonation, and detailed Kanboard, Deck, OpenProject, Asana, ZenKit, Trello,
Jira, Excel and WeKan import instructions. All values required translation,
with low confidence in some explanatory grammar pending human refinement.
Tests retain operators, escapes, regex, endpoints, placeholders, file formats
and API names. This leaves 69,018 actionable values across 32 languages,
including 1,574 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7c9b9982">Translate Tigre export and filter controls</a>. Thanks to xet7.</summary>

The eleventh 50-value Tigre batch adds account conflicts, card exports with
attachment metadata and disk-space checks, list sorting and date, label and
member filters. All values required translation, with low confidence in some
longer field descriptions pending human refinement. Tests retain PDF and Excel
names, the established swimlane term and today and tomorrow distinctions. This
leaves 69,068 actionable values across 32 languages, including 1,624 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76ddeaf58">Translate Tigre email and validation messages</a>. Thanks to xet7.</summary>

The tenth 50-value Tigre batch adds permanent deletion, WIP settings, account
and invitation emails, board authorization errors and JSON, CSV, TSV and import
validation. All values required translation, with low confidence in some longer
explanatory grammar pending human refinement. Tests retain every email
placeholder and technical format name. This leaves 69,118 actionable values
across 32 languages, including 1,674 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/42af574e2">Translate Tigre roles and custom fields</a>. Thanks to xet7.</summary>

The ninth 50-value Tigre batch adds comment and read-only roles, deletion
confirmations, clipboard actions, multi-card JSON examples and custom-field
types. All values required translation, with low confidence in some explanatory
grammar pending human refinement. Tests parse the translated JSON example,
retain its exact keys and preserve the Enter key and final basic colors. This
leaves 69,168 actionable values across 32 languages, including 1,724 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d6662e77b">Translate Tigre navigation and colors</a>. Thanks to xet7.</summary>

The eighth 50-value Tigre batch adds starring, automatic list widths, card
aging, keyboard movement and accessible dialog navigation, followed by board
color names. All values required translation, with low confidence in some
compound color names pending human refinement. Tests retain all three aging
tiers and representative basic color terms. This leaves 69,218 actionable
values across 32 languages, including 1,774 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73ef66b32">Translate Tigre member and theme settings</a>. Thanks to xet7.</summary>

The seventh 50-value Tigre batch adds member mapping, linked items, themes,
fonts, text colors, language and permission dialogs. All values required
translation, with low confidence in some longer explanatory grammar pending
human refinement. Tests retain CAS, preview digits, the established swimlane
and language terms and user-search meaning. This leaves 69,268 actionable
values across 32 languages, including 1,824 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f9ee353e">Translate Tigre voting and import controls</a>. Thanks to xet7.</summary>

The sixth 50-value Tigre batch adds voting and Planning Poker, card
dependencies, board organizations and teams, backgrounds, domains and scoped
import/export dialogs. All values required translation, with low confidence in
some longer explanatory grammar pending human refinement. Tests retain Planning
Poker and the established organization, team and swimlane terms. This leaves
69,318 actionable values across 32 languages, including 1,874 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/496bc0c11">Translate Tigre board views and archives</a>. Thanks to xet7.</summary>

The fifth 50-value Tigre batch adds public-board markup, drag instructions,
desktop and mobile views, zoom and calendar controls, archive guidance and card
metadata editing. All values required translation, with low confidence in some
longer explanatory grammar pending human refinement. Tests retain HTML markup,
workspace and comment placeholders, zoom bounds and mode names. This leaves
69,368 actionable values across 32 languages, including 1,924 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cd1bdb51">Translate Tigre archive and board settings</a>. Thanks to xet7.</summary>

The fourth 50-value Tigre batch adds administrator roles and announcements,
archives, templates, attachment deletion, board backgrounds and member views.
All values required translation, with low confidence in some longer explanatory
grammar pending human refinement. Tests retain plural counters, avatar size,
URL and star tokens and the private-board HTML markup. This leaves 69,418
actionable values across 32 languages, including 1,974 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be650df43">Translate Tigre board layout settings</a>. Thanks to xet7.</summary>

The third 50-value Tigre batch adds multi-board selection, home boards,
personal and shared list widths, swimlane heights and checklist controls. All
values required translation, with low confidence in some longer explanatory
grammar pending human refinement. Tests retain the date placeholders, numeric
width limit, pixel units and the established card conversion phrase. This
leaves 69,468 actionable values across 32 languages, including 2,024 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/110b9c051">Translate Tigre activity and workspace terms</a>. Thanks to xet7.</summary>

The second 50-value Tigre batch adds card movement and restoration, checklist
activity and workspace management. All values required translation, with low
confidence in some complex activity grammar pending human refinement. Tests
retain every movement and checklist placeholder, all three import format
tokens, and the established workspace and markdown terms. This leaves 69,518
actionable values across 32 languages, including 2,074 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/759f1a173">Start Tigre activity translations</a>. Thanks to xet7.</summary>

The first 50-value Tigre batch adds board, card, attachment, label, checklist
and comment activity messages. All values required translation. The wording
uses the locale's established Tigre terms, with low confidence in some complex
activity grammar pending human refinement. Tests retain every format and
underscore placeholder and the locale-wide HTML tag inventory. This leaves
69,568 actionable values across 32 languages, including 2,124 in Tigre.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52a390a43">Complete Tigrinya translations</a>. Thanks to xet7.</summary>

The final 24-value Tigrinya batch adds CPU and security-event fields and scoped
WeKan import/export instructions. All values required translation, completing
Tigrinya. Tests retain IP, IPv4 and IPv6 names, the search operator placeholder
and its literal `<number>` tokens, file extensions and importer product names.
This leaves 69,618 actionable values across 32 languages.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd06e638d">Translate Tigrinya repository and repair reports</a>. Thanks to xet7.</summary>

The forty-third 50-value Tigrinya batch adds repository accounts, login
failures, Problems summaries, active repairs and broken-card recovery results.
All values required translation. Tests retain OTP, API and CPU names and every
repair-result placeholder. This leaves 69,642 actionable values across 33
languages, including 24 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/820968cc2">Translate Tigrinya migration job controls</a>. Thanks to xet7.</summary>

The forty-second 50-value Tigrinya batch adds migration job queues, attachment
storage moves, CPU-aware batching, timing, pausing and monitoring controls. All
values required translation. Tests retain CPU percentages, millisecond ranges,
GridFS and S3 names and background-continuation semantics. This leaves 69,692
actionable values across 33 languages, including 74 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b09c323e8">Translate Tigrinya migration monitoring</a>. Thanks to xet7.</summary>

The forty-first 50-value Tigrinya batch adds individual board-repair steps,
conversion progress, scheduled intervals, CPU usage and filesystem and GridFS
monitoring. All values required translation. Tests retain the URL, CPU and
GridFS technical names and the one-time conversion guarantee. This leaves
69,742 actionable values across 33 languages, including 124 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b7cfb4bb7">Translate Tigrinya board migration repairs</a>. Thanks to xet7.</summary>

The fortieth 50-value Tigrinya batch adds board integrity migrations for lost
cards, missing and duplicate lists, archived items and attachment URLs, along
with progress and confirmation text. All values required translation. Tests
retain the `swimlaneId`, `listId`, URL and storage-backend terms and the
irreversible-action warning. This leaves 69,792 actionable values across 33
languages, including 174 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae98dcada">Translate Tigrinya cloud migration controls</a>. Thanks to xet7.</summary>

The thirty-ninth 50-value Tigrinya batch adds cloud connection tests, Azure and
GCS attachment destinations, GridFS and S3 settings, migration lifecycle and
scheduled board operations. All values required translation. Tests retain
MongoDB GridFS, CollectionFS, AWS region, S3 and SSL/TLS semantics. This leaves
69,842 actionable values across 33 languages, including 224 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac3909d85">Translate Tigrinya backup and cloud storage</a>. Thanks to xet7.</summary>

The thirty-eighth 50-value Tigrinya batch adds instance and organization
backups, schedules and restore modes and GCS, S3 and Azure credentials and
console guidance. All values required translation. Tests retain time and day
formats, provider and product names, the service-account role and JSON paths.
This leaves 69,892 actionable values across 33 languages, including 274 in
Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a66c523a9">Translate Tigrinya data safety settings</a>. Thanks to xet7.</summary>

The thirty-seventh 50-value Tigrinya batch adds Sandstorm migration cleanup,
automatic and lazy card loading, safe plain-text rendering, import/export and
avatar restrictions, identity anonymization, activity and watch controls and
streamed backups. All values required translation. Tests retain environment
variables, HTML syntax, anonymized names and backup paths and providers. This
leaves 69,942 actionable values across 33 languages, including 324 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/77845676c">Translate Tigrinya scheduled migrations</a>. Thanks to xet7.</summary>

The thirty-sixth 50-value Tigrinya batch adds scheduled board cleanup and
backup, job lifecycle and migration recovery, filesystem, S3 and Azure storage
and MongoDB/FerretDB text-data migration. All values required translation.
Tests retain storage providers, endpoints, environment variables, Snap command
and database placeholder. This leaves 69,992 actionable values across 33
languages, including 374 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f5d6c511">Translate Tigrinya accessibility and lockout settings</a>. Thanks to xet7.</summary>

The thirty-fifth 50-value Tigrinya batch adds support and accessibility pages,
brute-force lockout policy and user controls, Admin Panel people filters,
scheduled jobs, attachment and avatar paths and board archive scheduling. All
values required translation. Tests cover the attack, password, unlock, storage
path and successful-schedule terms. This leaves 70,042 actionable values across
33 languages, including 424 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df3a7f3b3">Translate Tigrinya board and support settings</a>. Thanks to xet7.</summary>

The thirty-fourth 50-value Tigrinya batch adds file metadata, board time
status, upload limits, PDF preview, workspace drag assignment, custom
translations, checklist folding, ZIP board imports and support-page controls.
All values required translation. Tests retain workspace, PDF, ISO 8601 and
JSON/ZIP identifiers. This leaves 70,092 actionable values across 33 languages,
including 474 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3234e26f1">Translate Tigrinya attachment storage controls</a>. Thanks to xet7.</summary>

The thirty-third 50-value Tigrinya batch adds attachment movement among the
filesystem, GridFS and S3, location repair, default storage, progress controls,
file statistics and MongoDB Compact maintenance. All values required
translation. Tests retain storage names and replica-set, oplog and Meteor
semantics. This leaves 70,142 actionable values across 33 languages, including
524 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a1e476593">Translate Tigrinya memory and checklist controls</a>. Thanks to xet7.</summary>

The thirty-second 50-value Tigrinya batch adds requests, team and organization
assignment, invitation domains, Node heap and memory metrics, legal notices,
checklist movement and line-to-item conversion and subtask actions. All values
required translation. Tests retain malloc and URL terms and checklist item
semantics. This leaves 70,192 actionable values across 33 languages, including
574 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b4792cef9">Translate Tigrinya recovery and ticket reports</a>. Thanks to xet7.</summary>

The thirty-first 50-value Tigrinya batch adds office login details, REST API
usage, automatic recovery events and maintenance, wait spinners, organization
and team deletion safeguards, tickets and history changes. All values required
translation. Tests retain REST API, `WITH_API=true`, MongoDB and database and
history terminology. This leaves 70,242 actionable values across 33 languages,
including 624 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb6acdf6d">Translate Tigrinya maps and problem reports</a>. Thanks to xet7.</summary>

The thirtieth 50-value Tigrinya batch adds location detection, map providers,
server-error diagnostics, card sorting, string templates, invisible-filename
filtering and Admin Panel problem, security, speed, recovery and office reports.
All values required translation. Tests retain shell commands, template tokens,
HTML entities and IP versions. This leaves 70,292 actionable values across 33
languages, including 674 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93a643aaa">Translate Tigrinya dependencies and backgrounds</a>. Thanks to xet7.</summary>

The twenty-ninth 50-value Tigrinya batch adds board sorting, card completion,
stickers, dependency relations and JSON/SVG import, board backgrounds and card
locations. All values required translation. Tests retain sort arrows, import
formats and counts and the background-size placeholder. This leaves 70,342
actionable values across 33 languages, including 724 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/246305caf">Translate Tigrinya global search instructions</a>. Thanks to xet7.</summary>

The twenty-eighth 50-value Tigrinya batch adds search validation, paging and
the full operator, status, existence, sorting and date-period instructions.
All values required translation. Tests preserve every embedded search token,
example query, markup tag and OR/AND combination. This leaves 70,392 actionable
values across 33 languages, including 774 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc9ca3f85">Translate Tigrinya global search terms</a>. Thanks to xet7.</summary>

The twenty-seventh 50-value Tigrinya batch adds missing-result diagnostics,
card-result counts and global search operators and predicates for boards,
people, dates, metadata and content. All values required translation. Tests
preserve result placeholders and ensure each single-token search term remains
free of spaces for colon syntax. This leaves 70,442 actionable values across
33 languages, including 824 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aac61c73c">Translate Tigrinya shared and due card views</a>. Thanks to xet7.</summary>

The twenty-sixth 50-value Tigrinya batch adds linked-card deletion safety,
checklist display, shared templates and domains and My Cards, Due Cards and
global search views. All values required translation. Tests retain the domain
example and restriction and every missing board, swimlane and list token. This
leaves 70,492 actionable values across 33 languages, including 874 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ebfcaecb">Translate Tigrinya editor and role settings</a>. Thanks to xet7.</summary>

The twenty-fifth 50-value Tigrinya batch adds resizable menus, Enter-to-submit,
multi-window cards, organization, team and user dialogs, notification cleanup,
board-role permissions and weekdays. All values required translation. Tests
retain the Enter key combinations, Admin Panel meaning, assigned-only status
and week endpoints. This leaves 70,542 actionable values across 33 languages,
including 924 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/debafc69e">Translate Tigrinya dates and deletion warnings</a>. Thanks to xet7.</summary>

The twenty-fourth 50-value Tigrinya batch adds custom body HTML, authentication
errors, board duplication, swimlane deletion, card placement, due reminders,
comment mentions, account, team and organization deletion and drag settings.
All values required translation. Tests preserve body tags and every date and
comment placeholder. This leaves 70,592 actionable values across 33 languages,
including 974 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f860decb3">Translate Tigrinya rule details and manifests</a>. Thanks to xet7.</summary>

The twenty-third 50-value Tigrinya batch adds remaining card movement, email,
archive, member and checklist actions, checklist item syntax, date-field
updates, authentication and custom HTML and JSON manifest settings. All values
required translation. Tests retain comma-separated examples and HTML, JSON and
assetlinks.json identifiers. This leaves 70,642 actionable values across 33
languages, including 1,024 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d326f7e1">Translate Tigrinya automation actions</a>. Thanks to xet7.</summary>

The twenty-second 50-value Tigrinya batch adds automation condition fragments,
label, member, attachment and checklist triggers, archive restoration, card
movement, color, checklist and email actions. All values required translation.
Tests cover archive, checklist, member removal, email and list-relative movement
terminology. This leaves 70,692 actionable values across 33 languages,
including 1,074 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/111be85dd">Translate Tigrinya scheduled automation rules</a>. Thanks to xet7.</summary>

The twenty-first 50-value Tigrinya batch adds visual n8n and Node-RED workflow
imports, scheduled and button triggers, due-date conditions, list sorting,
completion actions and relative dates. All values required translation. Tests
preserve the unmapped count, integration names, weekday range and trigger/action
terminology. This leaves 70,742 actionable values across 33 languages,
including 1,124 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e0715a37e">Translate Tigrinya automation rule basics</a>. Thanks to xet7.</summary>

The twentieth 50-value Tigrinya batch adds label and custom-field activity,
automation rule editing, workflow construction, card and member triggers and
JSON, CSV and Trello Butler rule exchange. All values required translation.
Tests preserve activity format tokens, scheduled time and imported-rule
placeholders and technical format names. This leaves 70,792 actionable values
across 33 languages, including 1,174 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b8ba0802">Translate Tigrinya card and subtask settings</a>. Thanks to xet7.</summary>

The nineteenth 50-value Tigrinya batch adds received and end dates, permanent
board and notification deletion warnings, duplicate-list cleanup, subtask
destinations and minicard display controls. All values required translation.
Tests preserve the board placeholder, irreversible warning, checklist count
format and parent/source terminology. This leaves 70,842 actionable values
across 33 languages, including 1,224 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b78e4c6e">Translate Tigrinya system and organization settings</a>. Thanks to xet7.</summary>

The eighteenth 50-value Tigrinya batch adds Node, Meteor, FerretDB and operating
system details, time units, custom-field display, board visibility, shared
templates, multitenant domains and organization administrators. All values
required translation. Tests retain runtime variables, example domains and
the multitenancy flag; the script audit keeps interface prose in Ethiopic.
This leaves 70,892 actionable values across 33 languages, including 1,274 in
Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8cfc0c2b6">Translate Tigrinya limits and webhooks</a>. Thanks to xet7.</summary>

The seventeenth 50-value Tigrinya batch adds WIP failures, attachment and API
transfer limits, avatar blocking, registration, SMTP invitations and outgoing
webhooks. All values required translation. Tests preserve invitation
placeholders and API, SMTP, TLS and Webhook terms; the script audit also keeps
every interface value in the Ethiopic script. This leaves 70,942 actionable
values across 33 languages, including 1,324 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd246241d">Translate Tigrinya tracking and branding</a>. Thanks to xet7.</summary>

The sixteenth 50-value Tigrinya batch adds default and starred boards, spent
and overtime tracking, assignee and label shortcuts, uploads, custom logos and
URL schemes, welcome content and template swimlanes. All values required
translation. Tests retain numeric shortcut ranges, logo height and URL Scheme
and WIP terminology. This leaves 70,992 actionable values across 33 languages,
including 1,374 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b311837d3">Translate Tigrinya privacy and shortcuts</a>. Thanks to xet7.</summary>

The fifteenth 50-value Tigrinya batch adds notification participation,
private/public board guidance, member removal, unsaved-description recovery,
search, WIP limits and keyboard shortcuts. All values required translation.
Tests preserve the login link, member identity placeholders and WeKan and
Sandstorm product names. This leaves 71,042 actionable values across 33
languages, including 1,424 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/55cd75cff">Translate Tigrinya archive and selection controls</a>. Thanks to xet7.</summary>

The fourteenth 50-value Tigrinya batch adds label deletion, leaving boards,
card and list archiving, organization and team settings, selection movement,
muting and normal-role permissions. All values required translation. Tests
preserve label and board placeholders, archive-menu typography and CSV/TSV
identifiers. This leaves 71,092 actionable values across 33 languages,
including 1,474 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aab9606a5">Translate Tigrinya Trello import controls</a>. Thanks to xet7.</summary>

The thirteenth 50-value Tigrinya batch adds safe ZIP failures, Trello API
credentials, workspace and board selection, resumable and cancellable imports,
member mapping, version checks and date validation. All values required
translation. Tests retain the API-key URL, irreversible-delete warning and
four-digit year example. This leaves 71,142 actionable values across 33
languages, including 1,524 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8d96b275">Translate Tigrinya filters and imports</a>. Thanks to xet7.</summary>

The twelfth 50-value Tigrinya batch adds assignee and custom-field filters,
advanced filter syntax, imported-member states and Kanboard, Deck, OpenProject,
Asana, ZenKit, Trello, Jira, Excel and WeKan import guidance. All values
required translation. Tests preserve issue-source placeholders, filter
operators and technical import identifiers. This leaves 71,192 actionable
values across 33 languages, including 1,574 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1691ceb99">Translate Tigrinya exports and filters</a>. Thanks to xet7.</summary>

The eleventh 50-value Tigrinya batch adds user and organization errors, card
PDF and Excel exports, attachment metadata, disk-space failures, list sorting
and date, label and member filters. All values required translation. Tests
cover PDF and Excel names, board/list/swimlane export fields and the
empty-member filter. This leaves 71,242 actionable values across 33 languages,
including 1,624 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14618261a">Translate Tigrinya email and error messages</a>. Thanks to xet7.</summary>

The tenth 50-value Tigrinya batch adds field and profile editing, WIP limits,
email invitations and account verification, board authorization errors and
import validation failures. All values required translation. Tests preserve
every email placeholder and cover JSON, CSV, TSV and WeKan names. This leaves
71,292 actionable values across 33 languages, including 1,674 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c577996d3">Translate Tigrinya roles and custom fields</a>. Thanks to xet7.</summary>

The ninth 50-value Tigrinya batch adds comment-only, assigned-only, read-only
and worker roles, checklist deletion and list moves, clipboard actions,
multi-card JSON templates and custom-field types. All values required
translation. Tests parse the translated three-card JSON example and cover
read-only, swimlane movement and currency terminology. This leaves 71,342
actionable values across 33 languages, including 1,724 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c981e04bc">Translate Tigrinya card aging and colors</a>. Thanks to xet7.</summary>

The eighth 50-value Tigrinya batch adds starring, automatic list widths,
clipboard drag/drop, three-tier card aging, keyboard card/list movement,
accessible dialog controls and 23 colors. All values required translation.
Tests retain tier numbers and cover automatic width, heavy aging and
representative dark-green and sky colors. This leaves 71,392 actionable values
across 33 languages, including 1,774 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d0a40098">Translate Tigrinya member mapping and themes</a>. Thanks to xet7.</summary>

The seventh 50-value Tigrinya batch adds member and sticker dialogs, archive
restoration, CAS, linked cards/boards, imported-member mapping, themes, fonts,
text colors, avatar deletion, languages and permissions. All values required
translation. Tests retain CAS and digits and cover linked cards, permission-safe
mapping and language changes. This leaves 71,442 actionable values across 33
languages, including 1,824 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e1420b15">Translate Tigrinya voting and import dialogs</a>. Thanks to xet7.</summary>

The sixth 50-value Tigrinya batch adds card membership, voting and Planning
Poker, dependency, organization/team/domain, avatar/background and checklist,
swimlane, list, card and board import dialogs. All values required translation.
Tests retain Planning Poker and cover supporters, opponents, dependencies and
representative checklist and board import terms. This leaves 71,492 actionable
values across 33 languages, including 1,874 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3db2aa4c6">Translate Tigrinya board views and card dates</a>. Thanks to xet7.</summary>

The fifth 50-value Tigrinya batch adds public boards, drag assignment, board
appearance/watch/view controls, mobile/desktop modes, zoom, calendar and table
views, archive guidance, card dates and card-field editing. All values required
translation. Tests retain public-board HTML, workspace and comment tokens and
zoom limits and cover mobile and due-date terminology. This leaves 71,542
actionable values across 33 languages, including 1,924 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14e601d6e">Translate Tigrinya archives and board settings</a>. Thanks to xet7.</summary>

The fourth 50-value Tigrinya batch adds administration, announcements, offline
reconnection, board/list/swimlane archives, templates, attachment deletion,
background images and board member and assignee display. All values required
translation. Tests retain count, avatar-size, star and URL tokens and private
board HTML tags and cover archive terminology. This leaves 71,592 actionable
values across 33 languages, including 1,974 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bca47dfc9">Translate Tigrinya workspace and sizing controls</a>. Thanks to xet7.</summary>

The third 50-value Tigrinya batch adds workspace deletion, multi-board and Home
selection, card dates, list widths, keyboard shortcuts, swimlane heights and
checklist/card controls. All values required translation. Tests retain date
tokens and numeric width constraints and cover Admin Panel, pixels, fixed list
width and checklist-to-card terminology. This leaves 71,642 actionable values
across 33 languages, including 2,024 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8789ab298">Translate Tigrinya activity and workspace strings</a>. Thanks to xet7.</summary>

The second 50-value Tigrinya batch adds card movement and restoration,
checklist and comment activities, received/start dates and workspace management.
All values required translation. Tests retain every old/new board, list,
swimlane and checklist token, positional import tokens and the markdown name.
This leaves 71,692 actionable values across 33 languages, including 2,074 in
Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c58b4e4bc">Start Tigrinya activity translations</a>. Thanks to xet7.</summary>

The first 50-value Tigrinya batch adds title, description, comment, attachment,
subtask, label, checklist, custom-field, archive and import activities plus
organization/team membership restrictions. All values required translation. A
new locale-wide regression test preserves every placeholder and HTML tag and
checks representative organization, team and activity terms. This leaves
71,742 actionable values across 33 languages, including 2,124 in Tigrinya.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/35b133cb6">Complete Tajik translations</a>. Thanks to xet7.</summary>

The final 24-value Tajik batch adds CPU load, security-event fields, filesystem
integrity and scoped WeKan import/export controls. All values required
translation. Tests retain IP/IPv4/IPv6, JSON/ZIP, Trello/Jira/CSV/Excel and
search-number syntax and now require zero actionable Tajik values. Tajik is
complete, leaving 71,792 actionable values across 33 languages.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c9cc9196c">Translate Tajik repositories and problem repairs</a>. Thanks to xet7.</summary>

The forty-third 50-value Tajik batch adds system resources, repository account
and upload controls, login errors, Admin Panel problem status and broken-card
and list/swimlane repairs. All values required translation. Tests retain OTP,
API and CPU names and every fixed, unfixable, restored and remaining count
placeholder. This left 71,816 actionable values across 34 languages, including
24 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2d7f9988">Translate Tajik migration controls and limits</a>. Thanks to xet7.</summary>

The forty-second 50-value Tajik batch adds job queues, attachment migration
targets, CPU/batch/delay limits, resumable migration status and monitoring,
schedules and minicard list/checklist display. All values required translation.
Tests retain GridFS, S3 and CPU names, numeric ranges and background
continuation meaning. This leaves 71,866 actionable values across 34 languages,
including 74 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/180b25778">Translate Tajik migration steps and monitoring</a>. Thanks to xet7.</summary>

The forty-first 50-value Tajik batch adds individual board-repair steps,
one-time conversion status, CPU and duration diagnostics, scheduled intervals,
filesystem/GridFS statistics and export monitoring. All values required
translation. Tests retain URL, ID, CPU and GridFS names and cover orphan-card
repair, time intervals and minicard list visibility. This leaves 71,916
actionable values across 34 languages, including 124 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0c999ec6">Translate Tajik board repair migrations</a>. Thanks to xet7.</summary>

The fortieth 50-value Tajik batch adds board integrity checks and migrations for
duplicate lists, lost cards, archived items, missing lists and broken avatar and
file URLs plus progress reporting. All values required translation. Tests retain
swimlaneId, listId, URL and ID names and cover comprehensive migration and
current-step reporting. This leaves 71,966 actionable values across 34
languages, including 174 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19f68f485">Translate Tajik cloud migrations and monitoring</a>. Thanks to xet7.</summary>

The thirty-ninth 50-value Tajik batch adds cloud connection tests, Azure/GCS
attachment moves, GridFS configuration, migration lifecycle controls, S3
credentials, scheduled board operations and attachment monitoring. All values
required translation. Tests retain Azure, GCS, MongoDB GridFS, CollectionFS,
AWS/MinIO, region and SSL/TLS terms. This leaves 72,016 actionable values across
34 languages, including 224 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d0e6ab0d">Translate Tajik cloud backup settings</a>. Thanks to xet7.</summary>

The thirty-eighth 50-value Tajik batch adds instance/organization backup scope,
schedules and restore modes plus GCS, S3 and Azure credential and console-path
guidance. All values required translation. Tests retain HH:MM, JSON, account
fields and the Google, AWS, MinIO, Cloudflare, Backblaze, Wasabi and
DigitalOcean product names. This leaves 72,066 actionable values across 34
languages, including 274 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b0edbd71">Translate Tajik security and backup features</a>. Thanks to xet7.</summary>

The thirty-seventh 50-value Tajik batch adds Sandstorm migration cleanup, lazy
card loading, plain-text link and code security, import/export and activity
disablement, user anonymization and streamed backups. All values required
translation. Tests retain HTML examples, environment variables, product names
and backup paths and cover the migration and security descriptions. This leaves
72,116 actionable values across 34 languages, including 324 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca7eb1e18">Translate Tajik scheduled migrations and storage</a>. Thanks to xet7.</summary>

The thirty-sixth 50-value Tajik batch adds scheduled board operations and
migration retry controls, filesystem and S3/MinIO/AWS/Azure storage and MongoDB
to FerretDB v1 database migration. All values required translation. Tests
retain storage product names, ports and environment variables and the target
database token. This leaves 72,166 actionable values across 34 languages,
including 374 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2be6e58a3">Translate Tajik accessibility and lockout settings</a>. Thanks to xet7.</summary>

The thirty-fifth 50-value Tajik batch adds support and accessibility content,
brute-force lockout policy and user controls, scheduled jobs, attachment/avatar
paths and board archive and backup scheduling. All values required translation.
Tests cover accessibility, brute-force protection, locked and inactive users,
attachment storage and successful archive scheduling. This leaves 72,216
actionable values across 34 languages, including 424 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b549fbf8">Translate Tajik file and support settings</a>. Thanks to xet7.</summary>

The thirty-fourth 50-value Tajik batch adds board status, upload progress,
file/avatar limits, PDF fallback, workspace dragging, custom translation
management, checklist folding and support settings. All values required
translation. Tests retain the workspace token and PDF, ISO 8601, ZIP and JSON
names and cover time totals and support enablement. This leaves 72,266
actionable values across 34 languages, including 474 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3328d949">Translate Tajik attachment storage management</a>. Thanks to xet7.</summary>

The thirty-third 50-value Tajik batch adds attachment movement among the
filesystem, GridFS and S3, location repair, default storage, progress and file
counts plus MongoDB Compact guidance. All values required translation. Tests
retain GridFS, S3, ID, MongoDB, Compact, oplog and Meteor names and cover repair
and resume actions. This leaves 72,316 actionable values across 34 languages,
including 524 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d68aa5abc">Translate Tajik memory and checklist settings</a>. Thanks to xet7.</summary>

The thirty-second 50-value Tajik batch adds help requests, team and organization
assignment, Node heap and memory diagnostics, legal notices and checklist move,
copy and line-splitting actions. All values required translation. Tests retain
Node, malloc, RSS and URL names and cover checklist movement and the line-to-item
relationship. This leaves 72,366 actionable values across 34 languages,
including 574 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b57294427">Translate Tajik recovery and ticket reports</a>. Thanks to xet7.</summary>

The thirty-first 50-value Tajik batch adds office login and REST API statistics,
automatic recovery events and maintenance, swimlane copying, wait-spinner
styles, organization/team deletion guards and ticket status and history. All
values required translation. Tests retain REST API, WITH_API, MongoDB and
spinner names and cover recovery severity and ticket numbering. This leaves
72,416 actionable values across 34 languages, including 624 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c7229ffd">Translate Tajik locations and admin reports</a>. Thanks to xet7.</summary>

The thirtieth 50-value Tajik batch adds map locations, server-error commands,
activity sorting, swimlane moves, string templates and Admin Panel problem,
security, speed, CPU, database, impersonation, recovery and office reports. All
values required translation. Tests retain snap/Docker commands, the template
token and space entities and IPv4/IPv6 names. This leaves 72,466 actionable
values across 34 languages, including 674 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46be6abab">Translate Tajik dependencies and backgrounds</a>. Thanks to xet7.</summary>

The twenty-ninth 50-value Tajik batch adds board and card sorting, completion,
stickers, card-dependency types and JSON/SVG import plus board backgrounds and
card locations. All values required translation. Tests retain sort arrows,
dependency formats, imported/unmatched counts and the background size token and
cover representative relation and location terms. This leaves 72,516
actionable values across 34 languages, including 724 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd31fb073">Translate Tajik global search instructions</a>. Thanks to xet7.</summary>

The twenty-eighth 50-value Tajik batch adds global-search validation,
pagination, operator syntax and help for board, list, user, organization, date,
state, presence, sorting and limits. All values required translation. Tests
retain operator/value placeholders, pseudo-HTML search examples and the full
presence and date-predicate inventories. This leaves 72,566 actionable values
across 34 languages, including 774 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dbee45246">Translate Tajik search operators and results</a>. Thanks to xet7.</summary>

The twenty-seventh 50-value Tajik batch adds missing-object and result counts,
global-search operators and date, state, attachment and checklist predicates.
All values required translation. Tests retain all result and lookup
placeholders, verify representative vocabulary and ensure compound operator
names contain no spaces. This leaves 72,616 actionable values across 34
languages, including 824 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f431557ed">Translate Tajik templates and card views</a>. Thanks to xet7.</summary>

The twenty-sixth 50-value Tajik batch adds linked-card deletion safety,
checklist display, domains and shared templates plus My Cards, Due Cards and
global-search views. All values required translation. Tests retain the domain
example, emphasized view labels and board, swimlane and list lookup tokens. This
leaves 72,666 actionable values across 34 languages, including 874 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fdf603db7">Translate Tajik roles and interface preferences</a>. Thanks to xet7.</summary>

The twenty-fifth 50-value Tajik batch adds multi-card windows, Enter-key editor
behavior, organization/team/user dialogs, notification filters, rename and
board-role permissions, weekdays and ownership status. All values required
translation. Tests retain the keyboard combinations and cover Admin Panel,
assigned-only visibility and weekday terms. This leaves 72,716 actionable
values across 34 languages, including 924 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/897c96e2e">Translate Tajik reminders and interface settings</a>. Thanks to xet7.</summary>

The twenty-fourth 50-value Tajik batch adds authentication display, board and
swimlane duplication and deletion, received/start/end/due activities and
reminders, mentions, account deletion and drag-handle settings. All values
required translation. Tests retain custom body HTML tags and every activity
placeholder and cover OIDC and desktop drag-handle terms. This leaves 72,766
actionable values across 34 languages, including 974 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c79df975b">Translate Tajik rule actions and customization</a>. Thanks to xet7.</summary>

The twenty-third 50-value Tajik batch adds rule actions for email, archive,
labels, members, checklists, swimlanes, dates and linked cards plus
authentication, custom head tags, web manifests and asset links. All values
required translation. Tests retain comma-separated checklist examples and
HTML/JSON names and cover archive, authentication and customization terms. This
leaves 72,816 actionable values across 34 languages, including 1,024 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/947bd129e">Translate Tajik rule conditions and actions</a>. Thanks to xet7.</summary>

The twenty-second 50-value Tajik batch adds automation conditions for boards,
lists, labels, members, attachments and checklists plus archive, move, color,
member, checklist and email actions. All values required translation. Tests
cover filtering, archive restoration, all-member removal, rule details and
representative card movement. This leaves 72,866 actionable values across 34
languages, including 1,074 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/db55e651e">Translate Tajik scheduled automation rules</a>. Thanks to xet7.</summary>

The twenty-first 50-value Tajik batch adds visual workflow import from n8n and
Node-RED, scheduled and button triggers, due-date conditions, list sorting,
relative dates and time units. All values required translation. Tests retain
the unmapped-line count placeholder, product names, weekday range and
representative scheduling and trigger terms. This leaves 72,916 actionable
values across 34 languages, including 1,124 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ecebda966">Translate Tajik rules and activities</a>. Thanks to xet7.</summary>

The twentieth 50-value Tajik batch adds label, attachment and custom-field
activities plus automation-rule creation, workflow editing, triggers and
JSON/CSV and Trello Butler import and export. All values required translation.
Tests retain positional activity tokens, scheduled-time and imported-count
placeholders and representative rule and workflow terms. This leaves 72,966
actionable values across 34 languages, including 1,174 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18e45958e">Translate Tajik cards and subtasks</a>. Thanks to xet7.</summary>

The nineteenth 50-value Tajik batch adds received and end dates, card and
selection colors, permanent board and notification deletion, duplicate-list
cleanup, subtask destinations and minicard fields. All values required
translation. Tests retain the subtask board placeholder, checklist fractions
and representative person, deletion, subtask and parent-card terms. This leaves
73,016 actionable values across 34 languages, including 1,224 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/83eea7bbc">Translate Tajik system and organization settings</a>. Thanks to xet7.</summary>

The eighteenth 50-value Tajik batch adds runtime versions, database commits,
reactivity and DDP details, operating-system statistics, custom-field display,
account visibility and organization and team administration settings. All
values required translation. Tests retain technical product and environment
names, the multitenancy example and representative system, field and
organization terms. This leaves 73,066 actionable values across 34 languages,
including 1,274 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/77fa9ca82">Translate Tajik transfer limits and webhooks</a>. Thanks to xet7.</summary>

The seventeenth 50-value Tajik batch adds WIP overflow, attachment and API
transfer limits, avatar upload blocking, registration, SMTP and TLS settings and
test mail and outgoing and bidirectional webhooks. All values required
translation. Tests retain API, SMTP and TLS names, every registration-invite
placeholder and representative database and webhook terms. This leaves 73,116
actionable values across 34 languages, including 1,324 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c487639dc">Translate Tajik uploads and templates</a>. Thanks to xet7.</summary>

The sixteenth 50-value Tajik batch adds default and starred boards, time and
overtime tracking, assignee and label shortcuts, uploads, custom logo, help and
URL settings, welcome-board content and card, list and board templates. All
values required translation. Tests retain shortcut ranges, upload completion,
logo height and URL terminology. This leaves 73,166 actionable values across 34
languages, including 1,374 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/65b0124a2">Translate Tajik notifications and shortcuts</a>. Thanks to xet7.</summary>

The fifteenth 50-value Tajik batch adds participation and watch notifications,
private-page login, board visibility, previews, member removal with Sandstorm
access warning, description rescue, search, WIP and keyboard shortcuts. All
values required translation. Tests retain login markup, member placeholders and
the WeKan/Sandstorm access boundary. This leaves 73,216 actionable values across
34 languages, including 1,424 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6ceb25958">Translate Tajik selection and roles</a>. Thanks to xet7.</summary>

The fourteenth 50-value Tajik batch adds label deletion, last-administrator
protection, leaving a board, list-card archiving and movement, user, team and
organization settings, Excel CSV/TSV import, multi-selection, muted watching and
normal roles. All values required translation. Tests retain label and board
placeholders, format names and representative menu and role terms. This leaves
73,266 actionable values across 34 languages, including 1,474 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73e165cac">Translate Tajik Trello import controls</a>. Thanks to xet7.</summary>

The thirteenth 50-value Tajik batch adds Trello ZIP safety limits, workspace
placement, API-key multi-board imports with cancel, resume and deletion paths,
member mapping and version and date validation. All values required translation.
Tests retain the Trello key URL and API name, unmapped-member fallback and
four-digit year example. This leaves 73,316 actionable values across 34
languages, including 1,524 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ad70ab7c">Translate Tajik filters and board imports</a>. Thanks to xet7.</summary>

The twelfth 50-value Tajik batch adds assignee and custom-field filters,
advanced filter syntax, imported-member status and board imports from Kanboard,
NextCloud Deck, OpenProject, issue trackers, Asana, ZenKit, Trello, Jira, Excel
and WeKan. All values required translation. Tests retain the regex example,
source placeholders, automationRules, XLSX and API names. This leaves 73,366
actionable values across 34 languages, including 1,574 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ae57c4d2">Translate Tajik exports and filters</a>. Thanks to xet7.</summary>

The eleventh 50-value Tajik batch adds user, organization, team and email
errors, card PDF and Excel exports with disk-space handling, list sorting and
date, label and member filters. All values required translation. Tests retain
the PDF and Excel names, disk-space error and representative overdue and empty
member filters. This leaves 73,416 actionable values across 34 languages,
including 1,624 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b51550795">Translate Tajik emails and validation</a>. Thanks to xet7.</summary>

The tenth 50-value Tajik batch adds permanent deletion, custom-field text,
profile, WIP, dates and notifications, account enrollment, invitation, password
reset and email verification and board, JSON, CSV/TSV, import and linked-card
errors. All values required translation. Tests retain all email placeholders and
the data format and WeKan names. This leaves 73,466 actionable values across 34
languages, including 1,674 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6a2c8d4c5">Translate Tajik roles and custom fields</a>. Thanks to xet7.</summary>

The ninth 50-value Tajik batch adds comment-only, assigned-only, read-only and
worker roles, subtask and checklist deletion, list movement, clipboard links,
linked-card and list copying and custom-field creation, deletion and types. All
values required translation. Tests retain the list movement meaning and parse
the translated three-card JSON template. This leaves 73,516 actionable values
across 34 languages, including 1,724 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/191a9745e">Translate Tajik card aging and colors</a>. Thanks to xet7.</summary>

The eighth 50-value Tajik batch adds starring, automatic list widths, clipboard
and drag-and-drop input, three-tier card aging, keyboard movement, accessible
close and skip controls and 23 color names. All values required translation.
Tests retain the aging tier count and distinguish representative dark-green and
sky color names. This leaves 73,566 actionable values across 34 languages,
including 1,774 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/97b7bed78">Translate Tajik member mapping and themes</a>. Thanks to xet7.</summary>

The seventh 50-value Tajik batch adds member, sticker, restore and rule windows,
linked cards and boards, safe imported-member mapping, themes, fonts, text
colors, avatars, language and permissions. All values required translation.
Tests retain CAS, the font-preview digits and linked-card and mapping-permission
language. This leaves 73,616 actionable values across 34 languages, including
1,824 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/23f66942f">Translate Tajik voting and imports</a>. Thanks to xet7.</summary>

The sixth 50-value Tajik batch adds card membership, voting, Planning Poker,
card archiving and actions, dependencies, organizations, teams, backgrounds,
duplicate lists, accounts, domains and checklist, swimlane, list, card and board
imports. All values required translation. Tests retain opposing vote terms,
Planning Poker, dependency and checklist-export language. This leaves 73,666
actionable values across 34 languages, including 1,874 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2acbb9c39">Translate Tajik board views and archives</a>. Thanks to xet7.</summary>

The fifth 50-value Tajik batch adds public boards, board opening and workspace
assignment, backgrounds, visibility, watch and views, mobile/desktop mode,
zooming, calendar and table views and card, list and swimlane archive warnings.
All values required translation. Tests retain privacy markup, the workspace
placeholder, zoom limits, comment count and mobile terminology. This leaves
73,716 actionable values across 34 languages, including 1,924 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/619f6dd5b">Translate Tajik administration and archives</a>. Thanks to xet7.</summary>

The fourth 50-value Tajik batch adds member and administrator roles, system
announcements, public boards, offline recovery, archives, templates, attachment
deletion, automatic watching, backgrounds and board member and assignee display.
All values required translation. Tests retain count, size and star placeholders,
the background URL and privacy markup. This leaves 73,766 actionable values
across 34 languages, including 1,974 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2435b471">Translate Tajik board layout controls</a>. Thanks to xet7.</summary>

The third 50-value Tajik batch adds workspace deletion, multi-board selection,
the home board, list widths, keyboard shortcuts, swimlane height and checklist,
cover, label and member additions. All values required translation. Tests retain
date placeholders, the minimum list width, pixel units and representative fixed
width and checklist-to-card language. This leaves 73,816 actionable values
across 34 languages, including 2,024 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d5e64e40">Translate Tajik activities and workspaces</a>. Thanks to xet7.</summary>

The second 50-value Tajik batch adds card movement and restoration, generic
activity phrases, checklist activity and workspace and subworkspace management.
All values required translation. Tests retain both old and new movement
locations, checklist activity placeholders and the markdown icon format. This
leaves 73,866 actionable values across 34 languages, including 2,074 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a6029967">Start complete Tajik translations</a>. Thanks to xet7.</summary>

The first 50-value Tajik batch adds acceptance, title and description changes,
organization and team membership, comment replies, due-date changes and board,
card, swimlane, attachment, subtask, label, checklist, comment, custom-field,
archive and import activity logs. All values required translation. A new test
audits locale-wide placeholder and HTML inventories and representative activity
tokens and terminology. This leaves 73,916 actionable values across 34
languages, including 2,124 in Tajik.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/34157960f">Complete Southern Sotho translations</a>. Thanks to xet7.</summary>

The final 24-value Southern Sotho batch adds CPU load, security-event fields,
filesystem integrity and scoped board import and export. All values required
translation. Tests now require the locale to have zero actionable placeholders
and retain IP version names, the global-search placeholder and tags, parser-safe
operator spelling and import product and format names. This leaves 73,966
actionable values across 34 languages; Southern Sotho is complete.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc595ceab">Translate Southern Sotho accounts and repairs</a>. Thanks to xet7.</summary>

The forty-second 50-value Southern Sotho batch adds system resources,
repository accounts and uploads, OTP and login errors, the Admin Panel Problems
summary and broken-card and list-swimlane repair results. All values required
translation. Tests retain API and CPU names, the username length and every
repair-result placeholder. This leaves 73,990 actionable values across 35
languages, including 24 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18023794b">Translate Southern Sotho migration monitoring</a>. Thanks to xet7.</summary>

The forty-first 50-value Southern Sotho batch adds job queues, attachment
migration destinations, batch size, CPU and delay controls, migration logs,
markers and controls, monitoring export and refresh and mini-card list and
checklist display. All values required translation. Tests retain every numeric
limit and representative background-process and mini-card language. This leaves
74,040 actionable values across 35 languages, including 74 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52bc5af9c">Translate Southern Sotho migration steps</a>. Thanks to xet7.</summary>

The fortieth 50-value Southern Sotho batch adds board-structure migration and
repair steps, old-job cleanup, board conversion, CPU and duration metrics,
scheduled intervals and filesystem and GridFS attachment monitoring. All values
required translation. Tests retain URL, ID, CPU and GridFS names and a numeric
schedule interval. This leaves 74,090 actionable values across 35 languages,
including 124 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0b57eea0">Translate Southern Sotho board repairs</a>. Thanks to xet7.</summary>

The thirty-ninth 50-value Southern Sotho batch adds attachment settings and
automatic, board and comprehensive migrations, duplicate-list removal, lost and
archived item restoration, missing-list repair and avatar and file URL repair.
All values required translation. Tests retain swimlaneId, listId and URL syntax
and the all-items restoration warning. This leaves 74,140 actionable values
across 35 languages, including 174 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9062aa2d">Translate Southern Sotho storage migrations</a>. Thanks to xet7.</summary>

The thirty-eighth 50-value Southern Sotho batch adds cloud connection tests,
Azure, GCS and GridFS attachment storage, migration controls, S3 credentials and
TLS, scheduled board operations and attachment migration and monitoring. All
values required translation. Tests retain the storage product names, region,
CollectionFS and SSL/TLS syntax. This leaves 74,190 actionable values across 35
languages, including 224 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5160a9b23">Translate Southern Sotho cloud backups</a>. Thanks to xet7.</summary>

The thirty-seventh 50-value Southern Sotho batch adds instance and organization
backup scope, scheduling and restore modes and Google Cloud, AWS/S3 and Azure
storage credentials and console directions. All values required translation.
Tests retain time syntax, JSON credential fields, IAM paths and the supported
cloud-provider names. This leaves 74,240 actionable values across 35 languages,
including 274 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/274c6e295">Translate Southern Sotho security and backups</a>. Thanks to xet7.</summary>

The thirty-sixth 50-value Southern Sotho batch adds Sandstorm migration and raw
database cleanup, lazy card loading, plain-text link and code rendering,
import/export, avatar, activity, notification and watch controls and backups.
All values required translation. Tests retain migration paths, card-loading
variables, HTML and JavaScript examples and backup paths and storage names. This
leaves 74,290 actionable values across 35 languages, including 324 in Southern
Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3094dc52d">Translate Southern Sotho jobs and migrations</a>. Thanks to xet7.</summary>

The thirty-fifth 50-value Southern Sotho batch adds board backup and cleanup,
scheduled-job and migration controls, filesystem storage, S3 and Azure settings
and MongoDB/FerretDB database migration. All values required translation. Tests
retain the database placeholder, URLs, ports and environment variables and the
MinIO, S3 and AWS names. This leaves 74,340 actionable values across 35
languages, including 374 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/759a68d8b">Translate Southern Sotho access and lockout settings</a>. Thanks to xet7.</summary>

The thirty-fourth 50-value Southern Sotho batch adds support and accessibility
content, brute-force login protection and unlock controls, people-status
filters, scheduled jobs, attachment and avatar paths and board archive and
backup scheduling. All values required translation. Tests cover accessibility,
attack and password language, unlocking and stored file paths. This leaves
74,390 actionable values across 35 languages, including 424 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/404b9b56a">Translate Southern Sotho board status and support</a>. Thanks to xet7.</summary>

The thirty-third 50-value Southern Sotho batch adds file metadata, board status
and time totals, upload progress and limits, board dragging, custom translation
management, subtask and checklist display and support-page settings. All values
required translation. Tests retain the workspace placeholder and PDF, ISO 8601,
ZIP and JSON format names. This leaves 74,440 actionable values across 35
languages, including 474 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1015980a3">Translate Southern Sotho attachment storage</a>. Thanks to xet7.</summary>

The thirty-second 50-value Southern Sotho batch adds attachment moves among the
filesystem, GridFS and S3, attachment-location repair, avatar scope, storage
defaults and statistics and MongoDB Compact operations. All values required
translation. Tests retain GridFS IDs and the MongoDB, Compact, replica, oplog
and Meteor maintenance terms. This leaves 74,490 actionable values across 35
languages, including 524 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be085449b">Translate Southern Sotho teams and checklists</a>. Thanks to xet7.</summary>

The thirty-first 50-value Southern Sotho batch adds request and card details,
team and organization membership, invitation results, Node heap and memory
metrics, legal notices and checklist and subtask actions. All values required
translation. Tests retain email-domain terminology, Node and malloc metric
names, the legal-notice URL and checklist-input syntax. This leaves 74,540
actionable values across 35 languages, including 574 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/434e5c2ae">Translate Southern Sotho recovery and support</a>. Thanks to xet7.</summary>

The thirtieth 50-value Southern Sotho batch adds office and API report details,
recovery events and maintenance, swimlane copying, wait-spinner styles, card
sizing, organization and team deletion warnings and support-ticket states and
history. All values required translation. Tests retain REST API,
`WITH_API=true` and MongoDB technical terms and representative swimlane and
history values. This leaves 74,590 actionable values across 35 languages,
including 624 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b171fa4bb">Translate Southern Sotho reports and maps</a>. Thanks to xet7.</summary>

The twenty-ninth 50-value Southern Sotho batch adds location and map handling,
server-error troubleshooting, sorting and board activities, custom-field string
templates and the Admin Panel file, security, speed, test, CPU, database,
impersonation, recovery and office reports. All values required translation.
Tests retain the format placeholder, spacing entities, diagnostic commands and
IPv4/IPv6 terms. This leaves 74,640 actionable values across 35 languages,
including 674 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df539e5aa">Translate Southern Sotho dependencies and locations</a>. Thanks to xet7.</summary>

The twenty-eighth 50-value Southern Sotho batch adds board and card sorting,
completion, stickers, card dependencies and JSON/SVG import, board backgrounds
and locations. All values required translation. Tests retain imported and
unmatched counts, the background size token and dependency file formats. This
leaves 74,690 actionable values across 35 languages, including 724 in Southern
Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2aead270">Translate Southern Sotho global search operators</a>. Thanks to xet7.</summary>

The twenty-sixth 50-value Southern Sotho batch adds missing board, swimlane,
list, label, user, organization and team results and global-search operators and
predicates. All values required translation. Tests retain result-count tokens
and ensure parser-facing compound operators remain single words. This leaves
74,790 actionable values across 35 languages, including 824 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6445d8fa">Translate Southern Sotho search instructions</a>. Thanks to xet7.</summary>

The twenty-seventh 50-value Southern Sotho batch adds global-search validation,
paging and complete operator guidance for boards, lists, members,
organizations, dates, statuses, field presence, sorting and limits. All values
required translation. Locale-wide tests retain every operator token and HTML
example tag, with focused checks for number errors and period predicates. This
leaves 74,740 actionable values across 35 languages, including 774 in Southern
Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b430fa06a">Translate Southern Sotho events and interface settings</a>. Thanks to xet7.</summary>

The twenty-third 50-value Southern Sotho batch adds custom body HTML, LDAP and
OIDC settings, board duplication, swimlane and account deletion, date changes,
due reminders, user mentions and minicard and drag-handle controls. All values
required translation. Tests retain body tags and every date and mention token.
This leaves 74,940 actionable values across 35 languages, including 974 in
Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2dfb136e2">Translate Southern Sotho scheduled automation</a>. Thanks to xet7.</summary>

The twentieth 50-value Southern Sotho batch adds n8n and Node-RED workflow
imports, scheduled and button triggers, due-date conditions, list sorting,
completion changes and relative times. All values required translation. Tests
retain workflow product names and the unmapped-line count token. This leaves
75,090 actionable values across 35 languages, including 1,124 in Southern
Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6043122a7">Translate Southern Sotho automation actions</a>. Thanks to xet7.</summary>

The twenty-first 50-value Southern Sotho batch adds composable rule phrases for
cards, lists, labels, members, attachments and checklists and movement,
restoration, color, selection and email actions. All values required
translation. Tests pin representative archive, membership, email and list
movement wording. This leaves 75,040 actionable values across 35 languages,
including 1,074 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dfc631420">Translate Southern Sotho automation and web metadata</a>. Thanks to xet7.</summary>

The twenty-second 50-value Southern Sotho batch adds card, member, checklist,
swimlane and date rule actions, authentication and custom HTML head tags, web
manifests and `assetlinks.json`. All values required translation. Tests retain
the comma-separated item format and JSON, HTML and asset filename terminology.
This leaves 74,990 actionable values across 35 languages, including 1,024 in
Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/43982c8e3">Translate Southern Sotho administration and archives</a>. Thanks to xet7.</summary>

The third 50-value Southern Sotho batch adds administrator permissions,
announcements, offline recovery guidance, archive and template controls,
attachments, board backgrounds and member and assignee summaries. All values
required translation. Tests retain count and avatar-size placeholders and the
private-board HTML emphasis. This leaves 75,940 actionable values across 35
languages, including 1,974 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3732219e5">Translate Southern Sotho board views and archives</a>. Thanks to xet7.</summary>

The fourth 50-value Southern Sotho batch adds public-board guidance, workspace
dragging, appearance and visibility controls, desktop and mobile modes, zoom,
calendar and statistics views, archive safeguards and card editing. All values
required translation. Tests retain the workspace and comment placeholders and
public-board HTML emphasis. This leaves 75,890 actionable values across 35
languages, including 1,924 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f86de6255">Translate Southern Sotho voting and imports</a>. Thanks to xet7.</summary>

The fifth 50-value Southern Sotho batch adds card membership and dates, voting,
Planning Poker, dependencies, organizations, teams, backgrounds, account and
domain dialogs and checklist, swimlane, list, card and board imports. All values
required translation. Tests retain product terminology and representative
voting and export wording. This leaves 75,840 actionable values across 35
languages, including 1,874 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/203d9f2b5">Translate Southern Sotho member and appearance dialogs</a>. Thanks to xet7.</summary>

The sixth 50-value Southern Sotho batch adds member, sticker and restoration
dialogs, linked cards, safe imported-user mapping, themes, fonts, text colors,
avatars, language and permission controls. All values required translation.
Tests pin linked-card terminology, permission guidance and the font-preview
digits. This leaves 75,790 actionable values across 35 languages, including
1,824 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92d54efa1">Translate Southern Sotho navigation and colors</a>. Thanks to xet7.</summary>

The seventh 50-value Southern Sotho batch adds starring, automatic list width,
card aging, card and list movement, accessible dialog navigation, board closure
and the color palette. All values required translation. Tests pin aging tiers
and representative compound color names. This leaves 75,740 actionable values
across 35 languages, including 1,774 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a3adf7e1f">Translate Southern Sotho roles and custom fields</a>. Thanks to xet7.</summary>

The eighth 50-value Southern Sotho batch adds comment-only, read-only and worker
roles, deletion safeguards, clipboard actions, card linking and copying,
template and label creation and custom-field types and options. All values
required translation. Tests prove that the translated multi-card JSON example
remains parseable and pin representative role and currency terms. This leaves
75,690 actionable values across 35 languages, including 1,724 in Southern
Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bef4a46c7">Translate Southern Sotho system and organization settings</a>. Thanks to xet7.</summary>

The seventeenth 50-value Southern Sotho batch adds Node, Meteor, FerretDB,
database, reactivity, DDP and operating-system information, card-field display
and organization multitenancy, domains and administrator boundaries. All values
required translation. Tests retain environment-variable and configuration
names. This leaves 75,240 actionable values across 35 languages, including
1,274 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/916960c8b">Translate Southern Sotho card and subtask settings</a>. Thanks to xet7.</summary>

The eighteenth 50-value Southern Sotho batch adds received and end dates, color
selection, board and notification deletion safeguards, subtask destinations,
minicard detail settings and parent and source board relationships. All values
required translation. Tests retain the board token and pin checklist-count and
parent-card wording. This leaves 75,190 actionable values across 35 languages,
including 1,224 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e36fd9233">Translate Southern Sotho automation builder</a>. Thanks to xet7.</summary>

The nineteenth 50-value Southern Sotho batch adds label, attachment and custom
field activities and the automation rule builder, triggers, daily scheduling
and JSON, CSV and Trello Butler import and export. All values required
translation. Tests retain positional, time and count tokens and product names.
This leaves 75,140 actionable values across 35 languages, including 1,174 in
Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f03c0ff85">Translate Southern Sotho Trello import controls</a>. Thanks to xet7.</summary>

The twelfth 50-value Southern Sotho batch adds safe Trello ZIP paths, direct API
imports, destination workspaces, job cancellation and resumption, imported
member mapping, version checks and date validation. All values required
translation. Tests retain the API URL and product names and pin the four-digit
year guidance. This leaves 75,490 actionable values across 35 languages,
including 1,524 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c63f9afb0">Translate Southern Sotho list and selection controls</a>. Thanks to xet7.</summary>

The thirteenth 50-value Southern Sotho batch adds label deletion, last-admin and
leave-board safeguards, list archiving and movement, user, team and organization
settings, card imports, login, multi-selection, muted watching and role modes.
All values are translated; an English `Menu` placeholder was corrected directly
rather than accepted as Southern Sotho. Tests retain count and board-title
tokens. This leaves 75,440 actionable values across 35 languages, including
1,474 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d4099479">Translate Southern Sotho access and shortcuts</a>. Thanks to xet7.</summary>

The fourteenth 50-value Southern Sotho batch adds notifications, private and
public visibility, image previews, member removal, Sandstorm access guidance,
unsaved-description rescue, search, WIP controls and keyboard shortcuts. All
values required translation. Tests retain the login-link HTML and its `%s`
token and every member-removal token. This leaves 75,390 actionable values
across 35 languages, including 1,424 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d6ce2c2c0">Translate Southern Sotho tracking and branding</a>. Thanks to xet7.</summary>

The fifteenth 50-value Southern Sotho batch adds default and starred boards,
spent and overtime tracking, assignee and label shortcuts, file and avatar
uploads, custom logos and URL schemes, watching, welcome content and template
swimlanes. All values required translation. Tests pin numeric shortcut and logo
height limits and representative upload and welcome wording. This leaves 75,340
actionable values across 35 languages, including 1,374 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a9dfb3a4">Translate Southern Sotho transfer and webhook settings</a>. Thanks to xet7.</summary>

The sixteenth 50-value Southern Sotho batch adds WIP warnings, attachment and
API transfer limits, avatar upload blocking, registration, SMTP/TLS, invitation
email, authorization errors, webhooks and database labels. All values required
translation. Tests retain every invitation token and protocol name. This leaves
75,290 actionable values across 35 languages, including 1,324 in Southern
Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7372a6749">Translate Southern Sotho email and validation</a>. Thanks to xet7.</summary>

The ninth 50-value Southern Sotho batch adds custom text and dates, permanent
deletion, WIP limits, profiles, enrollment, invitation, password-reset and
verification email templates and board, JSON, CSV/TSV and linked-card errors.
All values required translation. Tests retain every email token and technical
format and product name. This leaves 75,640 actionable values across 35
languages, including 1,674 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a1546ddf9">Translate Southern Sotho exports and filters</a>. Thanks to xet7.</summary>

The tenth 50-value Southern Sotho batch adds user, organization, team and email
errors, card PDF and Excel exports, attachment metadata, disk-space failures,
list sorting and date, label and member filters. All values required
translation. Tests retain export-format names and pin representative account
and overdue-filter wording. This leaves 75,590 actionable values across 35
languages, including 1,624 in Southern Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b83db49f">Translate Southern Sotho filters and board imports</a>. Thanks to xet7.</summary>

The eleventh 50-value Southern Sotho batch adds assignee and custom-field
filters, advanced filter syntax and Kanboard, Deck, OpenProject, issue, Asana,
ZenKit, Trello, CSV/TSV, Jira, Excel and WeKan imports, including ZIP failure
guidance. All values required translation. Tests retain source placeholders,
regular expressions, automation field names and API terminology. This leaves
75,540 actionable values across 35 languages, including 1,574 in Southern
Sotho.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31ebe4eca">Translate Albanian automation actions</a>. Thanks to xet7.</summary>

The twenty-first and twenty-second 50-value Albanian batches add rule conditions
and actions for cards, labels, members, attachments and checklists, generated
rule descriptions, date fields, authentication and custom web metadata. All one
hundred values required translation. Regression coverage now audits both
replaceable tokens and HTML tags across the entire Albanian locale. This leaves
77,106 actionable values across 36 languages, including 1,016 in Albanian.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d8caf91a">Translate Albanian automation builder</a>. Thanks to xet7.</summary>

The nineteenth and twentieth 50-value Albanian batches add the visual rule
builder, card and checklist triggers, JSON, CSV and Trello Butler interchange,
n8n and Node-RED workflow imports, schedules, due-date conditions, rule buttons,
sorting and relative dates. All one hundred values required translation. Tests
retain every `__time__` and `__count__` token plus the workflow product names.
This leaves 77,206 actionable values across 36 languages, including 1,116 in
Albanian.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5aaf204f7">Translate Albanian board navigation</a>. Thanks to xet7.</summary>

The thirteenth and fourteenth 50-value Albanian batches add list and swimlane
actions, bulk selection, board roles, notifications, privacy, archive recovery,
keyboard shortcuts and navigation. Ninety-eight values required translation;
`Normal` and `Private` are correct Albanian forms.

Loanword exceptions are now locale-specific. Albanian `Email`, `indigo` and
`magenta`, and Bosnian `Server`, no longer hide genuinely untranslated values in
other languages. That stricter audit restores eighteen real gaps, so after the
new translations the authoritative backlog is 77,506 values across 36 languages,
including 1,416 in Albanian.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ba4ec57a">Translate Albanian uploads and system settings</a>. Thanks to xet7.</summary>

The fifteenth and sixteenth 50-value Albanian batches add time tracking,
uploads, custom branding, welcome templates, WIP and attachment limits,
registration, SMTP invitations, webhooks and runtime database information. All
one hundred values required translation. Tests retain invitation placeholders
and environment-variable names. This leaves 77,406 actionable values across 36
languages, including 1,316 in Albanian.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/78f687014">Translate Albanian organization and card settings</a>. Thanks to xet7.</summary>

The seventeenth and eighteenth 50-value Albanian batches add DDP and operating
system diagnostics, custom-field display, account visibility, organization and
team tenancy, card dates, destructive safeguards, subtask placement, minicard
fields and label activity. All one hundred values required translation. Tests
retain `MULTITENANCY=true`, `__board__` and every activity `%s` token. This
leaves 77,306 actionable values across 36 languages, including 1,216 in
Albanian.

</details>

# v11.53 2026-09-06 WeKan ® release

**In short:** **Amiga-safe filenames** are sanitized before upload and whenever
they are displayed or downloaded, retain content-correct application extensions,
and avoid truncating through brackets. Existing stored names are corrected lazily
when read. **Problems reports** retain available usernames, separate IPv4/IPv6
addresses, and proxy-provided country and city context. Security regression tests
also avoid embedding incomplete sanitizer examples.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code
scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/596d99fc4">Remove incomplete sanitizer test doubles</a>. Thanks to GitHub CodeQL and xet7.</summary>

The import/export boundary regression test no longer demonstrates a partial
regular-expression sanitizer that handled only one URL scheme and complete HTML
tags. Its deterministic observation callback now proves that HTML and
`javascript:`, `vbscript:` and `data:` payloads reach the sanitizer boundary,
while the production callback remains DOMPurify. This resolves CodeQL alerts
448 and 449 without creating a misleading sanitizer example. The findings were
confined to test code and exposed no runtime path, so there is no attributable
security event to report in Admin Panel Problems or researcher to add to the
Hall of Fame.

</details>

**Files and problem reporting** - Portable names and attributable diagnostics.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/829d2a6c7">Enforce Amiga-safe filenames on every read</a>. Thanks to xet7.</summary>

One common filename boundary now sanitizes names before upload and whenever a
name is displayed, archived or downloaded. It preserves the content-derived
extension inside the classic Amiga FFS 30-character limit and removes an
incomplete bracketed suffix instead of producing names such as
`Online Gantt 20260905 (1.gantt`. The maintained JavaScript `file-type` detector
handles binary magic bytes before the bounded libmagic/text fallback; Online
Gantt JSON retains its application-owned `.gantt` extension. Existing attachment
metadata is corrected only when an authorized read needs it, not by an eager
database-wide rename.

The common Problems fold now fills available usernames and obtains trusted,
proxy-aware request addresses for all report streams. IPv4 and IPv6 remain
separate, while available Cloudflare and other supported proxy/CDN headers add a
display-only country flag, city, region and coordinates. DDP lockout reports now
forward their known username, source address and headers instead of showing an
empty actor beside “locked one address.” Location never participates in a
security decision.

</details>

# v11.52 2026-09-06 WeKan ® release

**In short:** **Release builds** create the Windows single EXE on Windows, sync
variant repositories without replacing their workflows, and leave bounded,
named diagnostics for every workflow failure. **Build menus** return immediately
after completed commands while keeping real menu and argument prompts.
**Mobile regression coverage** follows the header and drag-handle structure.
**Security coverage** accounts for all 94 Hall of Fame names, blocks
SheetColorBleed CSS injection, reports attributable ScannerBleed and integrity
attempts, and prevents weak FerretDB password hashes.
**Verified recovery** checks and restores FerretDB SQLite snapshots or retained
MongoDB source, preserves failed requests for retry, verifies history and stored
files, and schedules non-urgent checksum work during sustained low CPU usage.
**Import/export security** shares DOMPurify validation across transports and
resumes Trello jobs.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code
scanning:

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/bd29823d">Stop creating SCRAM-SHA-1 credentials</a>. Thanks to GitHub CodeQL and xet7.</summary>

New FerretDB users and password changes now create only salted,
15,000-iteration PBKDF2-SHA-256 credentials. An explicit SCRAM-SHA-1 request is
rejected, and the MD5 password-preparation function is removed instead of being
hidden behind an ineffective CodeQL annotation, resolving alert 46 (CWE-327,
CWE-328 and CWE-916). Existing stored SCRAM-SHA-1 credentials remain readable
only for authentication, so an administrator can migrate a legacy account by
changing its password. Positive SHA-256 creation/update tests and negative
SHA-1 creation/update tests pass with the full FerretDB unit, vet and SQLite/TLS
integration suites.

</details>

**Safeguards** - Security, recovery, build and mobile regression protections.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/71ad5447a">Secure and resume import/export operations</a>. Thanks to xet7.</summary>

One common server boundary now validates and clones imported and exported object
graphs, removes prototype-pollution keys and accessors, rejects cycles and
resource-limit abuse, normalizes invalid scalars, strips secret fields from
exports, and sends active markup, script URLs and CSS payloads through WeKan's
existing DOMPurify sanitizer. UI/DDP, REST, streamed ZIP, Excel-cell and live
Trello imports use it, as do canonical and external-format exports. Rejected and
sanitized attempts report their source, affected paths, user and address when
available in Admin Panel Problems → Security. CSV/TSV formula escaping remains
enabled for every row.

Live Trello imports now use atomic expiring leases with an in-flight heartbeat,
reclaim unfinished jobs on startup, and adopt a board whose durable import
activity proves that its side effect completed before a crash. Requests have
timeouts and response-size limits, retry transient HTTP 408/425/429/5xx and
honour `Retry-After`; SSRF verdicts remain non-retryable. Positive and negative
regression tests cover the common boundary, every transport connection,
prototype pollution, accessors, cycles, limits, DOM sanitization, spreadsheet
formula prefixes, restart reclaim, idempotency, leases, retries and timeouts.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/69db6a372">Sanitize streamed board exports</a>. Thanks to xet7.</summary>

The constant-memory JSON exporter now applies the same shared validation,
DOMPurify and secret-removal boundary separately to the board, every streamed
collection document, attachment metadata and user. Attachment bytes remain a
direct base64 stream, avoiding both executable interpretation and unbounded
memory use. Regression coverage prevents this large-board export path from
bypassing the common security boundary.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1eb273bf1">Make workflow failures diagnosable</a>. Thanks to xet7.</summary>

Every directly executed GitHub Actions job now has a timeout, including the
smaller Docker, Flatpak, chart, dependency-review and repair workflows. A stuck
external service or command therefore ends as a bounded timeout instead of
requiring an unexplained manual cancellation.

A repository-wide regression test checks every active workflow: shell commands
must have a descriptive step name, explicit nonzero exits must print a nearby
`::error::`, every job must be time-bounded, and `continue-on-error` jobs must
still print their final result. This keeps both fatal and deliberately tolerated
failures visible in the Actions log.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0bce2330a">Fix Windows and variant release builds</a>. Thanks to xet7.</summary>

The Windows single-EXE manifest now normalizes the backslash-separated member
names printed by Windows `tar`, so executables, native addons and startup files
are included instead of producing an empty C array. An empty manifest fails with
its cause before compilation. Regression coverage checks both Windows paths and
the fail-closed behavior.

Ondra and Gantt repository synchronization now retains each variant's own Actions
workflows instead of copying WeKan's release workflows. Their existing Contents
token can therefore push ordinary source updates without the unrelated GitHub PAT
`workflow` scope, and the variants cannot accidentally run the main release flow.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e54b123c1">Validate XLSX sheet colors before CSS serialization</a>. Thanks to rbbjinioeq and xet7.</summary>

An XLSX workbook's unvalidated sheet-tab color was interpolated into the
viewer's complete `style.cssText`. A board member could append CSS declarations,
cover another authorized member's attachment preview and trigger a CSS resource
request when that member opened the workbook (SheetColorBleed,
GHSA-crq2-phg8-4xvg; CWE-79 and CWE-116). No script execution, response reading,
credential access or authenticated state change was demonstrated.

The vendored viewer now accepts only canonical `#RRGGBB` immediately before the
CSS serialization boundary. Regression coverage retains a valid color and rejects
the disclosure payload, short/alpha/named colors, non-hex input and empty values.
The security inventory and Hall of Fame now account for all 94 published names.

The same change resolves CodeQL alert 447 in a release-version test by comparing
the exact expected Dockerfile string instead of constructing a partly escaped
regular expression. That alert did not reach application runtime or untrusted data.
SheetColorBleed is normalized during an ordinary preview rather than refused, so
there is no attributable attack-only event to report in Problems → Security; logging
the preview would falsely identify the viewer rather than the workbook uploader.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/506c2697a">Add verified recovery and low-load integrity audits</a>. Thanks to xet7.</summary>

FerretDB launch paths now integrity-check SQLite before opening it, create staged,
compressed and SHA-256-verified snapshots in the same data directory, check free
space, restore latest then previous verified generations, and re-run a retained
MongoDB migration when no snapshot survives. Snapshot manifests retain byte/hash
change evidence, and every outcome reaches Problems → Recovery.

New change-history rows form a SHA-256 predecessor chain. Restore, undo and redo
refuse changed, missing or forked history and report the available row, board,
username and address evidence in Problems → Security. A low-load background audit
also checks whole chains. Regression tests prove there is no direct client
publication, REST mutation API or collection write permission for history.

The existing signed attachment/avatar inventory now also scans registered logs and
recovery generations. Missing or changed files report expected and observed sizes
and checksums in Problems → Security. CPU-intensive background audits wait for
consecutive low samples, recheck load between paced operations and defer when the
quiet window ends. Problems → Speed shows rolling minimum, average, maximum, sample
count and lowest-load time so the chosen maintenance window is visible.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1cb52ee21">Build menus exit immediately after completed commands</a>. Thanks to xet7.</summary>

`build.sh` silently waited for Enter after a release command, and `build.bat`
displayed an acknowledgement pause after release scripts, release commands,
command-list output and a missing-Bash error. Those waits did not monitor the
command or the remote release; they only consumed an extra line or keystroke.

Both scripts now exit to the shell or command prompt as soon as a selected
process finishes. They wait for terminal input only while displaying a menu or
a visible question that collects a real command argument. Focused regression
coverage checks the prompt and exit control flow in both scripts.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bfac4c842">Mobile layout regressions test the current header and subpixel alignment</a>. Thanks to xet7.</summary>

The full test run still expected Mobile Mode to copy list names into the top
header, even though that switcher was removed to keep the header height and
other swimlanes stable. Another static check searched for the drag handle only
inside a removed coarse-pointer media query instead of the mode-based rule used
by every browser.

Those checks now pin the current structure. The Firefox browser test also
accepts less than half a CSS pixel of glyph-centre rounding; it had failed on a
0.0083-pixel difference while Chromium and WebKit passed. A real positioning
regression of half a pixel or more still fails.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/90158d501">Audit security coverage and recovery failure reporting</a>. Thanks to xet7.</summary>

The Hall of Fame audit had been looking only in an obsolete companion-repository
location, so it silently skipped the real `.tools/wekan.fi` catalog. The security
regression inventory also stopped at 62 vulnerabilities. It now accounts for all
93 published names: 71 have named regression coverage and the remaining 22 older
fixes are explicit gaps. Scanner command injection payloads have focused positive
and negative coverage, and rejected scanner filenames appear as ScannerBleed in
Admin Panel → Problems → Security. Response-only protections remain deliberately
silent where normal use cannot be distinguished from an attack.

All three FerretDB launch paths previously ignored a failed backup or restore
copy, reported success anyway, and removed a failed restore request. They now
report `backup-failed`, `restore-failed` or `manual-required` in Admin Panel →
Problems → Recovery, never claim that a failed copy succeeded, and retain failed
restore requests for the next restart. The recovery documentation now separates
implemented automatic mitigation from operator-requested text-database restore
and records the remaining portable integrity-check gap instead of describing an
unused decision function as production automation.

</details>

**Developer documentation** - recovery and data-transfer guarantees have an
explicit implementation contract and format inventory.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/175eea981">Design restart-safe durable operations</a>. Thanks to xet7.</summary>

The Problems documentation now defines persistent operation records, bounded
leases, checkpoints, idempotency keys, startup reclaim, cancellation and
terminal failure reporting for background work. It also specifies
rate-limit-aware retries and the evidence each recovery outcome must retain,
making the remaining implementation work distinguishable from completed
automatic recovery. The Problems index links the new contract.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5154939a4">Design complete restart-safe import and export</a>. Thanks to xet7.</summary>

The import/export documentation inventories WeKan, Trello, Jira, Kanboard,
Nextcloud Deck, OpenProject, GitHub, GitLab, Gitea, Forgejo, Asana and Zenkit
formats against their maintained APIs. It defines per-format field coverage,
explicit loss accounting, restart checkpoints, stable source identities,
idempotent writes, attachment streaming, external-service timeouts and
`Retry-After` handling.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f06794343">Design shared import/export sanitization</a>. Thanks to xet7.</summary>

Every structured transfer now has one documented trust boundary for structural
validation, prototype-key rejection, resource limits, DOMPurify cleanup,
secret removal and spreadsheet-formula neutralization. The contract requires
both sanitized and blocked attempts to retain attributable evidence in Problems
→ Security and requires every new adapter to reuse the shared boundary.

</details>

# v11.51 2026-09-05 WeKan ® release

**In short:** **Windows single EXE builds** now run their packer on Windows and
generate the native launcher's required header. **Release version updates** now
publish Meteor from its canonical build pin and stop before publishing if any
release-critical version remains stale. **Git mirror updates** also work from
WeKan's documented Linux, macOS and Windows checkout locations, keep every related
clone below the active checkout's ignored `.tools` directory, and update existing
mirrors on repeat runs.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4fae0377e">Windows single EXE builds generate the native launcher's required header</a>. Thanks to xet7.</summary>

The packer's command-line entry check constructed a `file://` URL by joining a
prefix to the resolved script path. That happened to match Node's module URL on
POSIX, but a Windows drive-letter path produced a different URL. The packer then
silently exited successfully without generating `wekan-real-files.h`, and the C
compiler failed because that header did not exist.

The entry check now uses Node's platform-aware path-to-file-URL conversion. Its
regression test requires that conversion and rejects the Windows-incompatible
hand-built URL, alongside the existing manifest, generated-header and workflow
checks.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ca13e2fa">Website releases publish Meteor from the version the build actually uses</a>. Thanks to xet7.</summary>

WeKan v11.50 was built from `.meteor/release`, which contained
`METEOR@3.5.2-rc.0`, but `wekan.fi/version.txt` reported `3.5.2-beta.0`. The
website generator did not read the build pin; it read a duplicated
`METEOR_RELEASE` value in `Dockerfile`, and that copy had not changed when Meteor
advanced from beta to release candidate.

The manifest now reads `.meteor/release` directly, while every release bump also
synchronizes Docker's runtime metadata from that canonical file. Current Docker
metadata is corrected to `3.5.2-rc.0`. Regression coverage deliberately gives the
generator a stale beta Dockerfile beside an rc Meteor pin and verifies both
`version.txt` and the install page publish the rc version.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2bb456be">The release workflow rejects every stale release-critical version</a>. Thanks to xet7.</summary>

`release-all.yml` previously trusted that `version.sh` had found and rewritten every
copy before committing the bump. A missed pattern could therefore pass silently and
be consumed later by one platform or the website. The bump job now runs one shared,
read-only consistency gate before its commit step. It verifies the WeKan version in
`package.json`, both package-lock roots, Docker, Snap, Stacker and Sandstorm; every
Snap bundle URL; and Docker's Meteor metadata against `.meteor/release`.

Each mismatch produces a named Actions error and stops the workflow before the bump
is pushed or any publishing job starts. Positive coverage runs the verifier against
the current checkout, while negative fixtures prove that stale Snap and Meteor
values fail the release.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/509662948">Git mirror updates work from the documented Linux, macOS and Windows checkouts</a>. Thanks to xet7.</summary>

The Unix mirror script used a quoted `~/repos/wekan` path, whose tilde could not
expand, and kept the entire update workflow inside the condition that created
`.tools`; after the directory existed, later runs did nothing. It now derives the
active checkout from the script location, working at `~/repos/wekan` on Linux and
`~/Documents/repos/wekan` on macOS, and always keeps the GitLab and Codeberg mirror
clones below that checkout's ignored `.tools` directory. Existing clones are updated
on every run, and a missing `upstream` remote is added safely.

The matching Windows batch script uses
`%USERPROFILE%\Downloads\repos\wekan\.tools`, checks every Git operation and performs
the same clone, pull, upstream fetch, merge and push sequence. Non-network regression
coverage pins all three checkout roots, both mirror destinations, repeat-run updates
and the absence of the quoted-tilde fault. These remain human-run publishing scripts;
the tests inspect them without contacting a remote.

</details>

# v11.50 2026-09-05 WeKan ® release

**In short:** **Undo** stops being position-only: it now reads a new universal
**change history** covering every card group, and **History** is a new view on
it, opened from the card, list and swimlane menus. Opening it for real found and
fixed a blank table, a row that could not be selected, a panel sized for a menu,
and a **Restore** that handed back the version before the one picked. **Copying
a list** now copies its cards, which an unbound swimlane turned into an empty
copy, and **Admin Panel / Problems** can put back swimlane bindings an older
repair cleared. The **contribution rules** now say which role commits where.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following SECURITY ISSUES:

**Code scanning alerts #442-#446** - CSS string escaping and regular-expression
denial of service.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8aed6a984">Escape OOXML font names and parse the language registry in linear time</a>. Thanks to GitHub CodeQL and xet7.</summary>

The vendored OOXML viewer wrapped document-provided font-family names in CSS
quotes and escaped quote characters, but did not escape existing backslashes
first. A backslash immediately before a quote could therefore consume the added
escape and alter where the CSS string ended. The serializer now escapes
backslashes before quotes, matching the safe serializers already present in the
same runtime. A regression test pins their order.

Four test suites parsed `languages.js` with expressions whose repeated escaped-
character alternatives could backtrack inefficiently. They now share a strict
line-by-line parser using fixed delimiters and `JSON.parse`, with positive,
malformed-input and one-million-character-name coverage. This closes GitHub
CodeQL alerts #442, #443, #444, #445 and #446.

</details>

**Serving attachments** - which files WeKan hands to a browser, and how.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b87082b3d">A file WeKan refuses to serve is no longer served by Meteor-Files instead</a>. Thanks to xet7.</summary>

A Playwright spec found this, and it found more than it was asking about. *stored
HTML is forced to a safe download on the original Meteor-Files route* expected
`application/octet-stream` and got `text/html`, status 200 - a stored HTML
attachment served inline, which is the stored XSS that
`models/lib/fileResponseSafety.js` exists to prevent.

That policy module is correct. It was never reached. Meteor-Files calls the
storage strategy's `interceptDownload`, and a FALSE return means *not handled,
serve it yourself* - so Meteor-Files served the file from its stored path, with
its stored Content-Type, and none of WeKan's headers.

What makes that a bypass rather than a harmless fallback is why the strategy
declines: `getReadStream()` returns nothing when the file cannot be resolved
INSIDE the storage root, the containment check of
[GHSA-4mxf-m8pq-xc9p](https://github.com/wekan/wekan/security/advisories/GHSA-4mxf-m8pq-xc9p).
So `false` means *this is not a file WeKan may serve*, and handing that same
file to a server with no containment check of its own answers the refusal with
the file.

All three strategies answer 404 and claim the request now, and so does the
abstract base, whose body was EMPTY - returning undefined, which Meteor-Files
reads exactly as it reads false, so a strategy that forgot to override it failed
open too. A file that is genuinely absent gets the same 404 it would have got
anyway.

It is deliberately not logged to Admin Panel / Problems: the same path is taken
by an attachment deleted while a link to it survived, which is ordinary use, and
`interceptDownload` cannot tell the two apart.

</details>

and adds the following new features:

**Undo** - what pressing Ctrl+Z can actually put back.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc4110e6f">Dragging a card is recorded, so undoing it does something</a>. Thanks to xet7.</summary>

`Ctrl+Z` after dragging a card did nothing, and never had.
[#6478](https://github.com/wekan/wekan/issues/6478) found that every
`trackChange` call site guarded on `typeof UserPositionHistory !== 'undefined'`
against a bare identifier no file imported — it is an ES-module default export,
not a global, so the guard was always false and nothing was recorded. The fix
was applied to the list path and not to the card path, which kept the dead
guard. List moves became undoable, card moves did not, and
`docs/Features/Login/Undo/Undo.md` said card moves were *"already present (now
actually runs)"* the whole time.

The import has to be lazy and inside the call: `models/userPositionHistory.js`
imports `models/cards.js`, so a top-level import would be a cycle and could
leave the binding undefined depending on evaluation order — most likely why
that file was skipped rather than fixed. The guard is gone from the list path
too; it was harmless there, but it is the shape that turns recording off when
the block is copied somewhere without the import, which is how the card path
stayed dead.

`tests/undoRecordsWhatItClaims.test.cjs` matters more than the fix, because
undo fails **silently** — nothing throws when a change is not recorded, the
user just presses Ctrl+Z and nothing happens. It finds the recording sites
rather than listing them and fails when one cannot reach the collection, when
one reintroduces the assumed-global guard, when recording is not wrapped so it
can never fail the move it records, and when a type is recorded that `undo()`
cannot handle. It also pins the reverse gap — `swimlane`, `checklist` and
`checklistItem` have full `undo()` cases that nothing records — so that stays a
known follow-up rather than a surprise.

Undo.md now says plainly what is recorded (list moves, list soft-delete and
restore, card moves) and what is not: a description, a checklist title, labels,
members and dates are written straight to the document with no previous state
kept, so there is nothing to restore them from.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/898643eea">The universal change history is built, and Ctrl+Z reads it instead of positions alone</a>. Thanks to xet7.</summary>

Phase 1 of the design in
`docs/Features/Reports/History/History.md`, plus the write half of phase 2.

**The store.** `models/changeHistory.js` is the append-only collection: one row
per change, carrying every container id it sits inside — `boardId`,
`swimlaneId`, `listId`, `cardId` — so a container scope is a plain equality
rather than a join the database cannot do. That is what lets a swimlane's
history include its lists' and cards' rows.

It imports **no other model**, deliberately. Its predecessor imports Cards,
Lists, Swimlanes and Checklists so its `undo()` can write to them, and that is
exactly why `models/cards.js` could not import it, guarded on an assumed global
instead, and recorded nothing for years. A collection that entities must import
cannot import entities. Applying a change back to a document therefore lives in
`server/models/changeHistory.js`, which nothing imports and which may import
anything.

**The rules are pure.** `models/lib/changeHistoryQuery.js` holds the
scope-to-selector translation, the search and the selection normalisation, with
no Meteor and no database — because that is where this feature is either right
or quietly wrong. A scope resolving to the wrong id column shows one board's
history under another board's menu; a selection that does not normalise its
input restores the wrong rows. Both are silent. Among the tests: an unknown or
half-given scope is REFUSED rather than widened into a selector that matches
everything.

**Undo is now the whole history.** `changeHistory.undoLast`/`redoLast` replace
the position-only methods, with the keyboard bindings and the tested
`pickUndo`/`pickRedo` rule unchanged. One rule covers every change type instead
of a case per action: undo applies `previousContent`, redo applies
`newContent`. A restore goes through the same setters an ordinary edit uses, so
validation, hooks and Activities still run, and is itself recorded twice — once
attributed to whoever made the change being restored, once to whoever pressed
Restore.

Recorded so far: **card description edits** (the previous text is read BEFORE
the write, since afterwards the old value is gone), **card moves**, **list
moves**, and **list soft-delete/restore**, which is what makes undoing a
deleted list work. `changeHistory` is in the snap's `MERGE_COLLECTIONS`, so a
row written on the database copy that is not served is not stranded there.

Not built: the History popup, table, contributor avatars, Restore button and
menu items, and recording for the remaining card groups. The methods those
screens need exist and are tested; nothing calls them yet. Both design
documents now say which half is which — the last time one of them claimed more
than the code did, the gap survived for months.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1fe46c604">Every card group is recorded, and History is one table opened from every menu</a>. Thanks to xet7.</summary>

Phases 3, 5 and 6 of the design, and the viewer of phase 2.

**Recording everything, from one place.** §5 suggests *"a thin, central choke
point ... avoids sprinkling calls everywhere"*, and
`server/models/changeHistoryHooks.js` is that: an `after.update` hook per
collection that diffs the changed fields, plus insert/remove for the
sub-entities. Cards, lists, swimlanes, checklists, checklist items and
comments are covered across every group the design names.

The advantage over editing twenty setters is not brevity, it is **coverage**:
the REST API, the CSV and Trello importers and the rules engine all write
through the collection and none call the client setters, so a per-setter
rollout would have recorded a description edited in the interface and silently
missed the same edit made over the API.

What a hook must not do is record too much, so
`models/lib/changeHistoryGroups.js` is a table rather than a rule.
`modifiedAt` and `dateLastActivity` change on nearly every write and would
bury the changes a person actually made; and the four fields of a move only
mean anything together — reported separately, one drag becomes four rows and
undo puts back a quarter of it. Moves and the list soft delete therefore record
themselves, as one change each.

**One table, every scope.** §7a: *"there is ONE implementation, parametrised by
scope"*. `client/components/history/historyTable` is that one — contributor
pane, search, pagination, row selection, Restore and RTL — and the card, list
and swimlane menus each open it with a different scope. Adding History to a
menu is a menu item and a two-line handler, exactly as the design promises.
`tests/historyOneTemplate.test.cjs` walks every `.jade` under `client/` and
fails if a second History table is ever defined, because six copies of a table
drift: one gets RTL and the others do not, one gets the search fixed and the
others keep the bug.

Two things the interface needed that were nearly wrong. The scope has to
travel as `dataContextIfCurrentDataIsUndefined`, because `Popup.open`'s second
argument is *options* — a bare object there is ignored, and the popup would
open on the menu's own data context and show the wrong history. And a popup
without a title key renders with no header and so no close button; this one
reuses the existing `history` key rather than adding another.

**Four new words** — Removed, Edited, Moved, Restored — because the Action
column is the one a reader must understand. *Added* the app already had, and
every other label reuses the word the card view already uses for that section,
so a group reads as Description or Labels in the language the card beside it
speaks. That kept this to four keys across 197 locales instead of twenty-six.

Not verified live: there was no Meteor runtime available for this work, so
none of it has been opened in a browser. The design asks for each phase to be
verified live before the next; both documents now say plainly that this has not
happened, and the interface in particular should be treated as unproven.

</details>

**The History panel** - the table every menu opens, and what a running server
said about it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/77dd5f253">The design document says what was actually opened, and what still has not been</a>. Thanks to xet7.</summary>

[History.md](docs/Features/Reports/History/History.md) still said none of this
had been exercised in a running WeKan, which stopped being true the moment it
was. It now records what was done in a browser rather than what was likely: the
card, list and swimlane menus each opening the table with their own scope
reaching the template, search narrowing it and reporting no results for a term
nothing matched, a contributor's avatar filtering to that person, and 32 rows
paging 1 / 2 with the remainder in sequence.

Nothing new was found in that pass, and that is recorded as plainly as the four
faults the first one found - because *"it shares a template with something that
works"* is the reasoning those four faults survived.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92b5ce861">History works when it is opened, which is four faults later than it looked</a>. Thanks to xet7.</summary>

The entry above says this was written with no Meteor runtime available and
should be treated as unproven. It has now been opened, and the pass found four
things, three of them fatal to the feature. None was visible in the source, and
every one of them looks completely ordinary in a diff.

**The table was blank.** `{{#each row in rows}}` binds `row` as a NAME and
leaves the data context alone - unlike `{{#each rows}}`, which replaces it - so
`{{_id}}`, `{{contentSummary}}` and the rest resolved against the OUTER context.
Nothing errors: the table drew one row of four empty cells and a checkbox with
no id. The contributor pane had the same bug. Every field now goes through its
loop variable.

**The row could not be selected.** WeKan hides every bare checkbox app-wide -
`forms.css`: `[type="checkbox"] { display: none }` - and draws `.materialCheckBox`
divs instead, so the real one here rendered 0x0. The row was visible, could
never be ticked, and Restore stayed disabled with nothing that could enable it.

**The panel was 380px wide.** That is a popup's default, and it left 129px for
the contributor pane and 201px for a four-column table: the search box was
squeezed to 32px and one row had to be scrolled sideways to be read. History is
the same shape as the export panels - two panes, opened from a menu at the edge
of the screen - so it joins them in `popup.css` and in the full-width list in
`client/lib/popupOffset.js`, which is the other half that decides where a panel
is put. The rows also scroll in a wrapper now instead of in the table itself:
`display: block` on a `<table>` stops the cells sharing column widths, so the
header and the rows under it drift apart.

**And a restore was recorded twice** - the one fault that is a correct decision
with a consequence. [History.md](docs/Features/Reports/History/History.md) §8.2
says a restore re-applies content through the SAME setters an ordinary edit
uses, so validation, hooks and Activities all still run. The field-diffing
`after.update` hook is one of those hooks, so it saw the restore's own write and
recorded it, leaving an *Edited* row nobody made above the *Restored* row
describing the same write. Recording, and only recording, is switched off for
the duration of the applier - as an `AsyncLocalStorage` scope rather than a
module-level flag, because the server handles several requests at once and a
shared boolean set during one user's restore would have silently swallowed
another user's edit landing in the same window.

Verified rather than reasoned about, in a browser against a running server:
a card renamed through the UI recorded one row with the right group and both
values; the card, list and swimlane menus each opened the table with their own
scope reaching the template; Restore put the title back and left exactly two
rows; search narrowed the table and said *no results* for a term nothing
matched; a contributor's avatar filtered to that person; and with 32 rows the
footer read *1 / 2*, the second page held the remaining seven in sequence, and
the *next* arrow disabled itself there.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/05d644f67">The History panel leaves the same gap below it as above it</a>. Thanks to xet7.</summary>

The panel was pinned 10px below the top of the window and then stopped wherever
its contents ended, so a two-row table sat in the top eighth of the screen with
the rest of it blank. It now ends 10px above the bottom of the window: measured
at 1280x720, 10px on all four sides, a 700px panel, the same in RTL.

Three separate rules were needed, and each was found by measuring rather than by
reading the file:

- **A height.** `popupOffset.js` already sent a max-height of the right size,
  and a maximum alone lets a short table stay short.
- **No margin.** The base `.pop-over` adds `margin-top: 6px` as the little gap
  between a menu and the button that opened it. These panels are not hung off a
  button - they are pinned to the viewport's own 10px gutter - so the margin was
  added to a position that was already final. Every full-width panel sat 16px
  from the top while its own comment said 10, and on History, which now states a
  height, it pushed 6px past the bottom as well: 16px above against 4px below.
  The export panels have the same contract and lose it too.
- **Fixed positioning.** Every other popup is absolute in DOCUMENT coordinates,
  which is right for a menu that should travel with its button and wrong for a
  box sized from the viewport. Opened on a page scrolled 53px down and then
  scrolled back, the panel stayed 63px below the window with 43px of itself past
  the bottom. It is positioned from the viewport now, the way the Admin edit
  popups already are.

The height then had to reach the table or the blank space would only have moved
indoors, so the wrappers between the shell and the template pass it down, the
rows take what the controls leave, and they scroll inside the panel instead of
being capped at `55vh`. With 40 rows the panel stays 700px and the table scrolls
within it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/982a9473d">And it fills the screen at phone widths, so the scrollbar is at the foot there too</a>. Thanks to xet7.</summary>

Above 801px the panel already ended the same 10px from the bottom that it
starts from the top. Below that, where every popup becomes a full-screen sheet,
it did not: the horizontal scrollbar sat halfway up the panel with blank space
beneath it, because nothing carried the sheet's height down to the rows.

Measured at 375x812, three things were wrong, and each of them is invisible in
a diff:

- **The chain was desktop-only.** The rules passing the height from the shell to
  the template were written inside `@media (min-width: 801px)` - backwards,
  since above that width the panel is given a height directly and below it the
  sheet is the only thing that needs the help.
- **The percentages had nothing to resolve against.** `.content-container`
  stopped at 588px, capped by `max-height: calc(70vh + 20px)`, whose usual
  override does not reach a sheet; `.content` collapsed to 10px, its
  `height: calc(100% - 20px)` resolving to the padding alone. The chain is flex
  now, which needs no parent height.
- **Two caps ate the edges.** `max-height: 90vh` left a tenth of the screen
  empty under the sheet, and the `*` reset being content-box put the 1px border
  outside the stated height - 10px above against 8px below.

Verified in a browser at 375x812, 768x1024, 886x711 and 1280x720: under 801px
the sheet fills the screen, above it the gaps are 10px on all four sides, and
in every one the scrollbar is at the foot of the panel.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c14b5a92">A scrollbar with nothing to scroll, and a band of empty space above the search box</a>. Thanks to xet7.</summary>

Both faults were inside the panel, which is why measuring its frame found
neither - the gaps around it were right the whole time.

**The empty band.** `.content-container` holds the popup STACK, one entry per
open menu, with the ones you are not looking at collapsed by
`.content.no-height { height: 0 }`. Making the container a flex column turned
those into flex items and the growth rule reached all of them: `flex: 1 1 auto`
says grow, and `height: 0` is only the basis it grows from. The card menu
History was opened over stayed in the layout and took 336px of a 925px window.

**The scrollbar.** `width: 100%` on the table was wrong at both ends, in
opposite directions. Wide: WeKan's global `table, td, th` rule gives the table a
`border-inline-start: 1px` - the vertical lines between columns - and the `*`
reset being content-box added it outside the 100%. Columns summing to 993.047 in
993.047 of space, border box 994.047: one pixel of nothing, drawing a bar across
the foot of the panel at every width the table fitted. Narrow: the table stayed
at 100% while its columns needed 436px, so they spilled out of it and the scroll
box - which measures the table, not its spill - offered a 1px bar to reach
171px of content. It is `width: max-content` with `min-width: 100%` now, so the
table grows to what the columns want and fills the panel when they want less.

The 10px gutter stays desktop-only: below 801px, and in mobile mode at any
width, a popup is a full-screen sheet flush to all four edges. The height chain
is deliberately not in a media query, for the opposite reason - the sheet still
has to pass its height down, or the scrollbar ends up halfway up the panel
again. Measured in desktop mode at 886x711: 10px on all four sides, no
horizontal scrollbar, 65px above the search box - the header and nothing else.
At 375x812: edge to edge, with 169px of real horizontal scrolling.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4286186a9">Restore puts back the version you picked, not the one before it</a>. Thanks to xet7.</summary>

Reported as *"when I try to restore card description from card history, it
restores wrong history, that I did not select"* - and the selection was never
wrong. The server restored exactly the row whose checkbox was ticked. It applied
the wrong half of it.

A row carries two contents, before and after. The table shows the AFTER -
[History.md](docs/Features/Reports/History/History.md) §7: the content column
holds *"the new text"* - and Restore applied the BEFORE, because it reused the
undo path. So choosing the row that displayed the description you wanted handed
you the description from the row above it, and choosing rows one after another
walked backwards through the history instead of moving through it.

Restore has a direction of its own now, and the rule is one sentence: the row a
reader picks and the value they get are the same thing. Undo is deliberately the
other way round - `Ctrl+Z` reverses your own last change - and is unchanged. The
two agree only when the row you pick happens to be the last one, which is why
this survived the first live pass: the title restored there WAS the most recent
change, so both directions gave the same answer.

The rows a restore appends were wrong in the same way - they repeated the
restored row's own before and after, which describes a different change. The
live value is read before the write now and recorded as what was displaced.

Verified against a running server with three description versions, FIRST,
SECOND, THIRD, and THIRD current: picking the row showing FIRST set the
description to FIRST and logged THIRD → FIRST, then picking SECOND set it to
SECOND and logged FIRST → SECOND. Before this, picking FIRST emptied the
description.

</details>

and fixes the following bugs:

**API usage report** - recording calls after their responses finish.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd668f6b8">API usage counts now pass EventLog schema validation</a>. Thanks to xet7.</summary>

The API middleware accumulated calls correctly, but every timed flush failed
with `api is not allowed by the schema in eventlog updateAsync`. Its summary
identity writes `api` and `apiUserId`, and the shared fold writes the normalized
`ipv4` or `ipv6` address, while the attached EventLog schema declared none of
those fields. Collection2 rejected the upsert selector at `api`, so the report
could never receive a row. All four fields are now declared. Regression coverage
checks every API/fold field against the schema so another report column cannot
be wired end to end yet rejected only when its first live event arrives.

</details>

**Minicards** - what dragging the card title does.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c9896ef9">The minicard title drags the card or drag-scrolls the board</a>. Thanks to xet7.</summary>

Direct title editing on the minicard intercepted the largest natural drag
surface. It is now commented out. With drag handles disabled, dragging the
title moves the minicard along with the rest of the card. With drag handles
enabled, only the handle moves the card, while dragging the title pans the
board. Card sorting continues to work in both modes: a browser regression drags
the title with handles disabled and the visible handle with them enabled, then
checks the persisted card order. Focused negative coverage also ensures the
title does not become an inline-editor trigger again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b03743ac">The minicard drag handle no longer has a grey background</a>. Thanks to xet7.</summary>

On touch devices the enlarged drag target looked like a separate grey button.
Its background is now transparent, leaving only the drag icon visible, while
the target remains directly below the minicard menu and keeps its full
finger-sized area. The focused regression test pins the transparent background,
the menu-and-handle ordering, the shared trailing edge and the absence of the
old grey or tinted background.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c2702d9e">The minicard drag icon lines up below its menu</a>. Thanks to xet7.</summary>

The touch target was in the correct trailing-edge column, but Font Awesome's
four-way arrow has uneven side bearings and made the visible icon look too far
toward the edge. The glyph now moves inward independently while its 44-pixel
touch target stays in place. The handle also explicitly suppresses borders and
shadows and gives its transparent background priority, preventing a mobile rule
from drawing a grey block below the icon. The focused regression test covers
the logical, RTL-safe alignment and every background layer.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e48c969fa">Mobile Mode uses one aligned minicard control column in every browser</a>. Thanks to xet7.</summary>

The enlarged, aligned menu-and-handle column was restricted to coarse pointers.
A desktop browser switched with **Toggle between Desktop and Mobile Mode** has a
mouse pointer, so it kept the compact desktop drag handle and placed its center
farther toward the minicard edge than the menu center. Mobile Mode now owns the
layout regardless of pointer type: both controls have the same trailing inset
and width, which gives them exactly the same horizontal center on phone and
desktop browsers and mirrors the column in RTL. Desktop Mode retains its compact
handle. The regression test calculates and compares the two centers and rejects
any pointer-type media query that could split the explicit mode again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/418d53aa7">iPhone Safari no longer paints the minicard drag target grey</a>. Thanks to xet7.</summary>

iPhone Safari still drew a grey rectangle over the full drag target in Mobile
Mode even though its CSS background was transparent; Desktop Mode's compact
handle did not expose the problem. The Mobile Mode target now inherits the
minicard's actual background, so it blends into white, coloured and hovered
cards, and explicitly disables WebKit's tap highlight. Its pseudo-elements,
border and shadow are also pinned to paint nothing. The icon, aligned control
column and 44-pixel touch target are unchanged. Regression coverage keeps these
Safari-specific paint guards scoped to Mobile Mode.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7dde0db3">Mobile card and swimlane drag handles now keep their desktop alignment</a>. Thanks to xet7.</summary>

The Mobile Mode minicard arrow was shifted six pixels away from the shared
menu-and-handle control center. Mobile font scaling enlarged that error, leaving the
arrow visibly to the side of the menu bars even though their touch targets had equal
width. The shift is gone, so both glyph centers have the same x coordinate in every
browser and direction. Swimlanes also no longer substitute a larger, separately
positioned handle on touch devices; one compact logical-position handle is shared by
Desktop and Mobile Modes on every device. A live Chromium regression compares the
actual glyph centers and verifies the swimlane handle's x coordinate is unchanged
when switching modes. Focused positive and negative source tests reject either
device-specific positioning variant.

</details>

**Swimlanes** - which swimlane a list belongs to, and what travels with it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c002bc2c1">Opening a Mobile Mode list no longer empties the other swimlanes</a>. Thanks to xet7.</summary>

Mobile Mode stored one globally selected list, and every swimlane guarded its
compact list rows with `unless currentList`. Opening **List 1 at Swimlane 2**
therefore expanded that list correctly but hid every list in Swimlanes 1 and 3.
The guard now asks whether the selected list belongs to *this* swimlane: its own
swimlane renders the expanded list while every other swimlane retains its
compact rows. Board-wide lists still expand in every swimlane by design. A live
Chromium regression against the port-3000 application seeds two swimlanes,
opens the second one's list and verifies the first one's list remains visible;
focused positive and negative source tests pin the template scope as well.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7968f522d">Opening a Mobile Mode list no longer resizes lists in other swimlanes</a>. Thanks to xet7.</summary>

The compact list rows in every swimlane consulted the board's global selected-list
state when choosing their header controls. Opening **List 1 at Swimlane 2** therefore
made the still-visible rows in Swimlanes 1 and 3 switch to the expanded header shape,
changing their height even though neither swimlane had been selected. A list header
now switches shape only when its own ID is selected, so every other swimlane keeps
the same controls and row heights. The live Chromium regression records every compact
row height before opening the second swimlane's list and verifies the dimensions are
unchanged afterward; focused positive and negative source coverage pins the ID scope.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb2dec9dd">Opening a Mobile Mode list no longer enlarges the top header</a>. Thanks to xet7.</summary>

Selecting **List 1 at Swimlane 2** inserted the names of every board list into the
quick-access header. On a narrow screen that list navigation consumed another row,
made the blue top bar taller and moved the board content down. Mobile Mode already
presents every list as a selectable row inside its swimlane, so the duplicate header
list has been removed. The live Chromium regression verifies that the selected list's
name is absent from the top bar and that the bar has exactly the same height before
and after the list opens; focused negative coverage prevents the conditional list
from returning to the header template.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/97fcf364c">Copying a list copies its cards, into a new list</a>. Thanks to xet7.</summary>

`List.copy(boardId, swimlaneId)` carried both of the faults the `List.move`
fix in v11.49 removes, and the copy was the more visible of the two: it
produced an empty list.

```
const oldSwimlaneId = this.swimlaneId || null;
...
const cards = await ReactiveCache.getCards({
  swimlaneId: oldSwimlaneId, listId: oldId, archived: false });
```

A list that is not bound to a swimlane - an empty or missing `swimlaneId`,
which is what every list on a board predating per-swimlane lists still has,
and what [#6515](https://github.com/wekan/wekan/issues/6515) left behind on
boards opened before it - turns that into `swimlaneId: null`, so the
selector asks for cards that have NO swimlane. The cards of such a list
carry the real `swimlaneId`s of the swimlanes they are in, so it matched
nothing and the copy came out with no cards at all. Even for a bound list
the filter could only ever remove cards that are in the list being copied.
A list is the unit of a copy, so every card in it travels, exactly as in
`List.move`.

The second fault is the [#6670](https://github.com/wekan/wekan/issues/6670)
shape exactly. `copy()` searched the target board for a list with this title
to reuse, without first asking whether the target board IS this list's own
board - and on a same-board copy that search finds THIS LIST. `_id` became
the original, so the "copy" wrote the cards back into the source list,
doubling them, and returned the source list's id, which
`POST /api/boards/:boardId/lists/:listId/copy` then repositioned: the user
asked to copy a list and got the original moved with twice the cards.
Reusing a same-titled list is only meaningful across boards, so a same-board
copy is now always a new list, the way `Swimlane.copy` already creates one.

Fixing the first fault raises a question that could not come up while the
copy was empty: where the cards land. The REST endpoint's own default is a
copy on the same board with no `toSwimlaneId`, and pinning every card to
"no swimlane" would dump the cards of three swimlanes into none - so when no
swimlane is asked for and the copy stays on the same board, each card keeps
the swimlane it is in and the duplicate looks like the original. Across
boards it cannot: the source card's `swimlaneId` belongs to the OTHER board
and would arrive orphaned, so those cards take the copy's own swimlane.

The decision lives in `models/lib/listCopyPlan.js`, the twin of
`models/lib/listMovePlan.js`, where it is unit-tested without a database;
`models/lists.js` applies it. `tests/listCopySwimlane.test.cjs` pins the
same-board copy and the copy of a board-wide list, and its negative tests
require that the card selector never scopes by swimlane, that a same-board
copy is never a merge even when a same-titled list exists, that a
cross-board copy never keeps a `swimlaneId` from the source board, and that
`models/lists.js` compares the boards before it looks a list up by title.

`tests/listMoveSwimlane.test.cjs` is corrected while its sibling is written:
two of its source scans took their offsets from the un-stripped file and
sliced the comment-stripped one, which worked by accident and slid off
`List.move` as soon as anything above it changed. Both offsets and the slice
now come from the same string, and every assertion is kept.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/290cdc6a4">Admin Panel / Problems can put back the swimlane a list lost</a>. Thanks to TawsTm and xet7.</summary>

Boards opened under the versions before
[#6515](https://github.com/wekan/wekan/issues/6515) had every per-swimlane
list un-bound automatically: the board data-repair treated any list with a
`swimlaneId` as [#6484](https://github.com/wekan/wekan/issues/6484)
corruption and cleared it, and a per-swimlane list is indistinguishable from
a corrupted board-wide one at the data level. #6515 stopped it, but nothing
put the bindings back, so those lists still render under every swimlane and
deleting one from a swimlane deletes the only list document there is.

The old value turns out to be recoverable rather than guessable. The
clearing went through `Lists.direct.updateAsync`, which bypasses collection
hooks, so it only ever touched the list document - while the binding each
list was CREATED with is recorded in a different collection:

```
// models/lists.js - Lists.after.insert -> trackOriginalPosition()
originalSwimlaneId: this.swimlaneId || null,
if (!existingHistory) { PositionHistory.insertAsync(document); }
```

That insert is insert-ONLY, written once at creation and never overwritten,
so it survived untouched for every list created since list position tracking
landed in October 2025.

Admin Panel / Problems / Summary now detects this the way it detects broken
cards - *Lists missing their swimlane N*, with a Restore button beside it -
and restoring puts each list back in the swimlane its own record names.
Every rule in it is a reason to SKIP, because here doing nothing is better
than doing something wrong: a list that already has a `swimlaneId` is never
touched, so the repair is idempotent and cannot undo a binding an admin has
set by hand since; a list with no record, or one recorded as board-wide,
stays board-wide; and a swimlane that has since been deleted is not
resurrected, nor is one on another board accepted, because either would hide
the list in every swimlane rather than show it in one.

Nothing is inferred from the cards, and a test pins that the planner cannot
grow a use for them. Inference is the obvious idea and it is wrong: on a
board whose second swimlane is new every card is still in the first one, so
it would bind every list to swimlane 1 and hide them from the others - which
is #6484 again, the bug the clearing existed to fix.

Detection is read-only and swallows its own errors, since the Problems page
polls it every thirty seconds and a detection that throws would take the
other problems on that page with it. The repair writes `swimlaneId` and
nothing else, through `.direct`, one update per swimlane rather than one per
list.

</details>

and states the rules a contribution is judged by:

**Contributing** - who commits where, and who gets named for the work.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f72f361bb">The instruction files say where the WeKan checkout is on each operating system</a>. Thanks to xet7.</summary>

"The WeKan repo" meant "wherever you happen to be", and an agent given a task
in the wrong directory had nothing to check itself against. It is a fixed place
per operating system now - `~/repos/wekan` on Linux, `~/Documents/repos/wekan`
on macOS, `Downloads\repos\wekan` on Windows - along with the companion
repositories under `.tools/`, each on its own default branch, which is not
always called `main`.

This commit also said that commits go directly on `main`, full stop, which is
true of the maintainer and wrong for everybody else. The entry below is the
correction, in this same release: a contributor works on a branch in their own
fork and opens a pull request. The rule as it stands is the two-role table, not
this half of it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c87397267">The contribution rules say which role commits on which branch, and where the checkout is</a>. Thanks to xet7.</summary>

Two things an agent had to infer, and could infer wrongly. WHICH BRANCH: the
maintainer commits **directly on `main`** - never a feature branch, never a
pull request - and a contributor works on **a branch in their own fork and
opens a pull request**, never committing to `main`. Both halves are given
their reason, because a rule with a reason survives a tool that offers
something else: `releases/release-all.sh` cuts a release from whatever is on
`main`, so work parked on a branch misses it; and nobody but the maintainer
commits to `main` in wekan/wekan, so a change from anyone else arrives as a
pull request, which is also the only place it can be discussed first.

WHERE: the checkout is at a fixed place per operating system -
`~/repos/wekan` on Linux, `~/Documents/repos/wekan` on macOS,
`Downloads\repos\wekan` on Windows - so "the WeKan repo" no longer means
"wherever you happen to be".

The never-push boundary is unchanged and covers both roles: an AI makes the
local commit and stops, whether that commit is on `main` or on a
contributor's branch. Pushing it, opening the pull request and every release
step are the human's.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac1867036">An AI is credited when it is the contributor, and never when it only helped one</a>. Thanks to xet7.</summary>

*Never attribute a commit to an AI* was one rule where there are two, and it
gave the wrong answer to half the cases it met. The test is whether a person
is behind the change:

- **A human's AI is invisible.** The maintainer or a contributor using an
  assistant is the author; the tool appears nowhere - no `Co-Authored-By:`
  trailer, no *Generated with*, no model name in the commit, the pull-request
  body or the CHANGELOG.
- **An AI that raised the pull request itself is the contributor, and is
  named.** GitHub CodeQL filing a fix for something it found, Copilot
  Autofix, Dependabot: nobody wrote those, so crediting a human would be
  false and crediting nobody would leave the change unattributed.

So the same word - *Copilot* - is forbidden in one commit and required in
another, and the files now say which is which. The second half is not new
practice: the dependency sections have always closed with
`Thanks to dependabot.` and the Hall of Fame has always named GitHub CodeQL
as a reporter. Those were the rule being followed without being written down.
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) carries the same rule in its own
plain register, since it is where a contributor looks first.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bbfc139b7">The maintainer's AI is credited on the sponsors page, and only there</a>. Thanks to xet7.</summary>

Saying a human's AI is *invisible* read as "never acknowledged anywhere", and
a rule that omits its own exception invites somebody to add the credit back
where it was removed from. It is acknowledged, once, at
[wekan.fi/sponsors](https://wekan.fi/sponsors), under *"AI donated by. All
code and PRs verified by xet7"*, where Claude, Codex and GitHub Copilot are
listed alongside the people and companies that donate hosting, servers,
grants and testing.

That is the whole of the credit, and it is where it is because attributing it
per commit put the same fact on thousands of lines and drowned out the humans
the entries exist to name. Acknowledging it anywhere else is not extra
politeness; it undoes that.

</details>

and has the following developer-tooling fixes:

**The build tree** - which directory a build writes to, and what is not source.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80c0f6875">build.sh raises the open-file limit, so mongod does not abort mid test run</a>. Thanks to xet7.</summary>

A full Playwright run died thirteen minutes in, and every spec after it reported
`MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:3001` - which reads
like the test database was never started. It was. It started, said what was
wrong with it in the same breath, and was ignored: *Soft rlimits for open file
descriptors too low, currentValue 256, recommendedMinimum 64000*. Thirteen
minutes later it ran out of them and WiredTiger panicked.

macOS starts a shell with a soft limit of 256, so every run of the browser
suites was a race between finishing and running out of descriptors, with the
cause landing 10,000 lines away in a different log. `ensure_open_files` runs on
every invocation beside the inotify check. It needs no root - the hard limit is
normally unlimited - and it sets the SOFT limit only, because plain `ulimit -n`
sets both and lowering a hard limit is irreversible.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f611ac222">Three permanently red test suites now pass, two of them macOS faults</a>. Thanks to xet7.</summary>

Each was a different fault rather than a stale assertion.

`database-autopick` restores MongoDB's data-file mtimes with `stat -c %Y` and
`touch -d @EPOCH`, which are GNU. On macOS the stat fails, every file is skipped
by the `|| continue` beside it, and the restore returns having done nothing -
silently, and only there. It tries the BSD spelling now.

`provenance-table.sh` opened with `shopt -s nullglob globstar`, and globstar
arrived in bash 4 while macOS ships bash 3.2 as `/bin/bash`: the shopt failed
and `set -e` took the script with it. The default file list is a single `find`
now. Then the empty case failed too, because bash 3.2 calls an empty array an
unbound variable under `set -u` where 4.4 does not.

`fill-translations.mjs --list` was TRUNCATED whenever stdout was a pipe: it
prints 128 KB with `console.log` and then calls `process.exit`, which cuts off
whatever has not drained. A pipe delivered 65,510 bytes - valid-looking JSON
stopping mid-key, with status 0. Redirecting to a file worked, because that is
synchronous, so this only bit anything reading the output programmatically -
including the translation workflow itself.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f532f3046">The last two red suites: a missing utility, and a count of another repository</a>. Thanks to xet7.</summary>

`bundle-smoke-boot.sh` runs the bundle under `timeout`, which is GNU coreutils
and is not on macOS. It died with *timeout: command not found* and exit 127 -
which the script's own checks then read as *the bundle exited without reaching
its database*, reporting a startup failure for a missing utility. It uses
timeout, or gtimeout, or a shell fallback now.

The Hall of Fame comparison demanded at least 50 `*bleed` directories in the
wekan.fi checkout as a sanity check. That number counts what was published when
the line was written, so a checkout two months old has fewer and the suite went
red over the state of another repository. A stale checkout cannot cause a false
failure there - it only makes the check smaller - so what it asks now is whether
the directory is the Hall of Fame at all.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bdb3b1588">Attachments are readable again when the storage root is a symlink</a>. Thanks to xet7.</summary>

`FileStoreStrategyFilesystem` builds its candidate paths by joining names onto
the storage root AS WRITTEN, then checked each one against that root with every
symlink RESOLVED. Those are the same string only when nothing in the path is a
symlink. On macOS `os.tmpdir()` is `/var/folders/...`, a symlink to
`/private/var/folders/...`, so every candidate failed containment before it was
looked at. A deployment whose data directory is a symlink has the same fault on
Linux.

The security property is untouched, because it was never the lexical check that
carried it: what a caller must not do is reach a file outside the root, and that
is decided by resolving the candidate and requiring the result to be inside the
resolved root.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80c0f6875">build.sh raises the open-file limit, so mongod does not abort mid test run</a>. Thanks to xet7.</summary>

A full Playwright run died thirteen minutes in, and every spec after it
reported `MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:3001` -
which reads like the test database was never started. It was. It started, said
what was wrong with it in the same breath, and was ignored:

```
"Soft rlimits for open file descriptors too low"
currentValue: 256, recommendedMinimum: 64000
```

Thirteen minutes later it ran out of them - *Too many open files* accepting
connections, then `opendir` on its own journal, then `WT_PANIC: WiredTiger
library panic` and `Abort trap: 6`. macOS starts a shell with a soft limit of
256, `build.sh` never raised it, and so every run of the browser suites was a
race between finishing and running out of descriptors, with the cause landing
10,000 lines away in a different log in a form that points at the wrong thing.

`ensure_open_files` runs on every invocation beside the inotify check, for the
same reason: a limit that is too low breaks a later step with an error that
does not name it. Unlike that one it needs no root - the hard limit is normally
unlimited, so the process raises its own soft limit and mongod, the bundle
server and the browsers inherit it. It sets the SOFT limit explicitly, because
plain `ulimit -n` sets both and lowering a hard limit is irreversible; and it
clamps to the hard limit and steps down from there, because asking for more
fails outright rather than clamping.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b28c793f">Commit links in this file are repointed when a rebase makes them stale</a>. Thanks to xet7.</summary>

A rebase rewrites hashes, and every `<summary>` here carries one in its `href`.
The links that had gone stale were repointed, which is the same repair
`build.sh`'s pull and push both run - a stale link is not a local annoyance,
it is a 404 for everyone who opens the release notes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9dc2c5cf9">The History table formats dates with the helper WeKan actually has</a>. Thanks to xet7.</summary>

The new table opened with `import moment from 'moment'`, and that one line
broke the client build outright:

```
ERROR in ./client/components/history/historyTable.js
  x Module not found: Can't resolve 'moment'
```

moment was removed from WeKan and replaced with native `Date` helpers -
`imports/i18n/moment.js` says so in its first line - so it is not a dependency
and nothing resolves it. The import is now `formatDateTime` from
`/imports/lib/dateUtils`, which is what the rest of the app already uses.

What is worth keeping from this is how it was found. The line is the most
ordinary-looking one in the file, and no amount of rereading the diff would
have shown it, because what was wrong was somewhere else entirely: the
dependency list. `tests/importsResolve.test.cjs` now resolves every bare
import in `client/`, `models/`, `imports/` and `server/` against the real
`node_modules`, which is the same question the bundler asks and takes under a
second instead of a two-minute build. It also pins that moment stays gone, and
that the set of packages imported without being declared in `package.json` -
`body-parser` and `mime-types`, both of which predate this - cannot grow.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7290ed036">Every ignore file agrees on what is not source, and the two build directories are explained</a>. Thanks to xet7.</summary>

There are two build directories one character apart, and nothing said which
was which. `_build/` is rspack's **handoff**: it compiles the app into
`_build/main-prod/` and Meteor then reads `server-meteor.js` and
`client-meteor.js` from there as the application's main modules, so ignoring
it does not tidy anything - it fails the build with `Could not find mainModule
for 'os' architecture`. `.build/` is the opposite, the finished bundle
`meteor build .build --directory` writes. Both are now described where
somebody meets them: the headers of `build.sh` and `build.bat`,
`Directory-Structure.md`, `Build-from-source.md`, `Meteor-bundle.md`,
`Build-and-Create-Pull-Request.md`, and this file's two AI instruction files.

The ignore files had drifted apart from each other in the meantime, so each
was brought to the same answer: `_build` reached `.dockerignore`,
`.eslintignore` and `.prettierignore`, which had never heard of it and were
linting and shipping a bundled copy of the app. `.meteorignore` gained the
trees that are not application source at all - `docs/`, `meta/`,
`old-CHANGELOG/`, `openapi/`, the packaging directories, `releases/`,
`scripts/`, `tools/`, `.github/` and the editor and tooling directories -
after checking, rather than assuming, that nothing under `client/`, `server/`,
`models/`, `imports/`, `config/` or `packages/` imports from any of them.
Meteor takes one file watcher per directory it does not ignore, from a
per-user limit shared with every editor on the machine, and that limit is what
`.tools/` was added for in the first place.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66e8420be">Ignoring .build does not silence Meteor's warning about it, and no longer says it does</a>. Thanks to xet7.</summary>

The comment added beside `/.build/` claimed the entry was this warning
answered:

```
WARNING: The output directory is under your source tree.
         Your generated files may get interpreted as source code!
```

The very next build printed it again. The warning is a path comparison on the
output **argument**, made before any file is written - `tools/cli/commands.js`
asks whether `pathRelative(appDir, outputPath)` starts with `..` and prints it
when it does not. No ignore file is consulted and none can reach it; silencing
it would mean building outside the tree, which `build.sh`, `build.bat` and the
release workflows would all have to agree on.

The entry is still worth having, for the second half of the same sentence:
without it the next `meteor run` walks a whole bundled copy of the app. That
is what the comment says now. `tests/meteorignoreScanScope.test.cjs` pins both
directions - `_build` must not be ignored, `.build` must be - and fails if the
false claim comes back.

</details>

and improves release automation:

**Variant repositories** - one authoritative source and two compatibility names.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/abdd9750c">Update Ondra and Gantt repositories as a required release job</a>. Thanks to xet7.</summary>

The compatibility snaps published successfully while their GitHub repositories
stayed stale because repository synchronization was an optional step inside a
`continue-on-error` architecture matrix. A missing or insufficient repository
token could skip or fail that step without failing the release.

A reusable workflow now updates both repositories from the release tag as its
own required job. Its shared preparation script copies only committed WeKan
source and preserves each variant's Snap, npm, GHCR, Quay and Docker Hub package
identities. Fixture tests cover both variants, reject dirty targets and prove
that ignored local files do not enter the synchronized repositories. Snap
publication remains independent of repository synchronization.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c44b5af36">Keep Dependabot updates in WeKan instead of its release mirrors</a>. Thanks to xet7.</summary>

Synchronizing the complete source tree also copied WeKan's Dependabot
configuration into `wekan-ondra` and `wekan-gantt-gpl`. Both mirrors then opened
duplicate dependency PRs against snapshots that later synchronization replaces.
The preparation step now removes both supported Dependabot configuration
filenames. Dependency changes remain reviewed and tested once in `wekan/wekan`
and reach each compatibility repository through the normal sync. Positive and
negative fixture coverage pins the exclusion for both variants.

</details>

**Test suite** - full runs inspect source rather than generated copies.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/87896365a">Keep source scans out of builds and exercise minicard links through the UI</a>. Thanks to xet7.</summary>

The complete test run found two scanners walking generated `.build-*` bundles:
one mistook bundled history calls for source without imports, while the security
map had not yet associated nine published vulnerability names with their
existing regression suites. Build variants are now excluded and the suites name
the disclosures they cover.

The minicard markdown-link browser test also called the module-scoped
`ReactiveCache` identifier as if it were a browser global, failing in Chromium
and Firefox before testing the link. It now creates the markdown title through
the real card editor, closes the card and verifies that the minicard link opens
without restoring inline title editing.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e5831f16b">Keep consistency checks aligned with release helpers and security names</a>. Thanks to xet7.</summary>

The complete test rerun found four consistency failures rather than application
failures. The new variant preparation helper now has its documented workflow-only
menu exemption, and the variant design explicitly retains historical Docker tags
without claiming that new variant images are published. Upcoming entries are
grouped by their actual areas.

The security inventory previously used substring matching, so naming
`CookieTokenBleed` made it falsely conclude that the unrelated `TokenBleed` gap
had acquired coverage. Vulnerability names now require non-alphanumeric
boundaries. The four suites that failed in the complete run pass together.

</details>

and improves documentation:

**Outgoing email documentation** - current configuration and readable Markdown.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e28081911">Remove visible Liquid tags from email troubleshooting</a>. Thanks to xet7.</summary>

The email troubleshooting document wrapped its entire contents in Liquid
`raw` tags to protect one literal template placeholder. GitHub's normal
Markdown view displayed those tags as document text. The example now uses a
fixed escaped regular-expression literal, which still replaces every exact
placeholder without presenting Liquid syntax to a Pages build. Tests pin the
rendering boundary and positive and negative replacement behavior.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1af5ceae2">Email troubleshooting starts with the Admin Panel provider choices</a>. Thanks to xet7.</summary>

The email troubleshooting page still said email could only be configured with
`MAIL_URL`, and the Admin Panel page described its live provider fields as
commented out. Both now lead with **Admin Panel / People / E-mail** and the
**Enable below email settings** opt-in. They explain that administrators can
choose custom SMTP or the built-in Gmail, Outlook 365, Proton, SendGrid,
Mailgun, Postmark, Resend and AWS SES options, while leaving the switch disabled
continues to use `MAIL_URL` and `MAIL_FROM`. The general webserver settings page
points to the same two choices.

</details>

and improves the translations:

**Bosnian** - a language file that was almost entirely English.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bdb3b1588">2175 untranslated strings become one</a>. Thanks to xet7.</summary>

Croatian and Serbian are complete and Bosnian is the same Štokavian standard, so
Croatian is the base with the documented Bosnian forms applied - *sedmica* for
*tjedan*, *nivo* for *razina*, *server* for *poslužitelj*, *tok* for *tijek*,
*hiljada* for *tisuća*, *historija* for *povijest*, and *tačka/tačno* for
*točka/točno*. 29 strings needed one; the rest are identical in both standards.

Two substitutions were REVERTED after reading the output, which is the part worth
keeping: *poveznica* → *link* produced "iz ove linkove" and "iz bilo koje
linkove na kartu", because *poveznice* is both nominative plural and genitive
singular and one rule cannot be both. *Poveznica* is good Bosnian, so it stays -
a correct word left alone beats a more idiomatic one put in the wrong case. The
same blindness left "Najviša nivo", a feminine adjective on a masculine noun.

The last ten were translated directly. The one that remains is *Server*, spelled
that way in Bosnian too - the tool counts a translation identical to its source
as missing, which is its limit rather than a gap.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.49 2026-09-04 WeKan ® release

**In short:** the **single Windows EXE** stops running WeKan out of a
closed-source virtual filesystem, and stops unpacking the bundle instead. It
carries the published win64 ZIP as a checksummed payload, unpacks only the
fifteen or so files Windows itself must open, and **mounts the remaining
~39,000 in the server process**. That ends the crash loop 11.48 shipped with,
cuts the download from 690 MB to about 232 MB, and turns a damaged copy into a
clear message rather than a restarting server. **bundle-trim** drops the native
prebuilds no bundle can open; **moving a list to a swimlane** now binds it there
instead of silently doing nothing; and **Admin Panel / Problems** can put back
the swimlane bindings an older automatic repair cleared.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following bugs:

**The single Windows EXE** - what the one downloadable file is made of, what it
checks before it starts WeKan, and how little of it ever reaches the disk.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a12cc8142e40393bd6ca105627a8574ab21a66ba">It carries a checksummed copy of the win64 ZIP instead of a virtual filesystem</a>. Thanks to xet7.</summary>

`WeKan-11.48-win64.exe` died on every start, restarted, and died again:

```
...\accounts-password\node_modules\bcrypt\promises.js:1
MZ......  !.L.!This program cannot be run in DOS mode.
SyntaxError: Invalid or unexpected token
    at Object.<anonymous> (...\bcrypt\bcrypt.js:6:18)
```

Both published files were correct. `wekan-11.48-win64.zip` holds the real
1123-byte `promises.js`, and so did the EXE: in its packed image
`bcrypt.node` (195584 bytes) is entry `0x5c9c` and `promises.js` is
`0x5c9d`, stored back to back, each with the right bytes at the offset its
own record gives. What was wrong was the READ. Enigma Virtual Box served
all 44,401 bundle files from a virtual filesystem inside the EXE, and once
Node.js had loaded the native addon out of it (`bcrypt.js` line 2), the
next read - `require('./promises')` on line 6, the blob immediately after
that addon - came back as the addon's own PE bytes.

So that packer is gone. The EXE is now the compiled launcher with the
published ZIP appended to it and an 80-byte trailer saying where that
payload starts, how long it is, its SHA-256 and which WeKan it is. The
download drops from 690 MB to about 232 MB, because the payload is the
compressed ZIP rather than an uncompressed image, and a damaged copy - a
truncated download, a half-written file - now stops at the checksum with
the expected and actual hashes and a line saying to download it again,
instead of reaching Node.js as a crash loop.

Its release smoke test is why a broken EXE was published at all.
`start-wekan.bat` restarts WeKan every three seconds when it exits, and the
smoke test polled `http://localhost:8080/sign-in` for three minutes: an EXE
that crashed on nine starts out of ten still answered inside that window,
and the job went green. It now starts the EXE twice - the run that unpacks
and the run that must find its files already there - and fails if either
log contains `WeKan exited; restarting` or `SyntaxError`. It also no longer
trips over PowerShell's read-only `$pid` while freeing the ports FerretDB
needs.

`tests/windowsSingleExe.test.cjs` pins the trailer format from both ends -
every `TRAILER_*` the launcher defines must equal the constant
`releases/append-windows-payload.mjs` exports under that name - round-trips
a packed file through pack and verify, and requires a flipped byte, a
truncated payload, a missing trailer and an over-long version to be
refused. A negative test reads every file under `.github/workflows` and
`releases` and fails on any Enigma Virtual Box download, console or `.evb`
project, so that virtual filesystem cannot come back through a second
packing path.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/35cf025f0738fedd1f5d7c83b48254388a3e44cc">It reads the bundle from inside itself instead of unpacking 39,035 files</a>. Thanks to xet7.</summary>

Replacing the packer left the EXE writing its whole bundle - 39,035 files,
685 MB - beside itself on the first run. It does not any more.

Only what cannot be virtual is unpacked, and the reason is the same in
every case: something other than WeKan's own module loader has to open it.
`node.exe` and `ferretdb.exe` are separate processes, so Windows needs a
real path to start one; `.node` addons are loaded with `LoadLibrary`, same
reason; `main.js` is the entry Node resolves before any hook could see it;
`start-wekan.bat` is read by `cmd.exe`; and `wekan-vfs.cjs` is read by
`node --require` before anything is mounted. `main.js` also `chdir()`s into
`programs/server`, and a working directory is a kernel concept no hook can
answer, so that one directory is created for real. That is about thirty
files out of 39,035, and the list is computed from the archive rather than
written by hand, so a bundle that gains an addon or a database tool cannot
silently lose it.

The mount is `releases/single-exe/wekan-vfs.cjs`, and it needs two
mechanisms because Node needs both. `module.registerHooks()` answers
`require`: the CJS loader resolves through internal C++ bindings, so
patching `fs` cannot make `require` see a virtual file, and `Module._stat`
is captured as a module-local inside `Module._findPath`, so replacing it
does nothing either. Resolution is therefore reimplemented, and checked
against Node's own answer for every package in a real bundle - 1407 package
directories and 1865 bare specifiers, all matching. `fs` patching covers
everything that is not a module: Meteor's `boot.js` reads `program.json`
and every server package with `fs.readFileSync` and runs them through
`vm.runInThisContext`, and `webapp` serves the client files with
`fs.createReadStream`. Below both sits one more: Meteor's `runtime.js`
hands reify a resolver that calls `Module._resolveFilename` directly, which
`registerHooks` never sees.

Two traps are worth naming because both were hit here. A `.node` addon must
be resolved with NO format declared - saying `commonjs` for one makes Node
compile the binary as JavaScript and die with *SyntaxError: Invalid or
unexpected token* on its own header, which is the 11.48 crash reproduced
from the other side. And a directory that exists both really and in the
archive has to merge the two listings, or `wekan-app/programs/server` would
list the two unpacked files and hide the entire server.

This was verified by running it, not by reading it. With 23 real files on
disk and 38,931 served from the ZIP, WeKan boots, connects to FerretDB and
answers 200 on `/sign-in` and on its 6.9 MB client bundle.
`tests/bundleArchiveVfs.test.cjs` builds a small archive and pins the three
things that have to stay right - the ZIP reader, the resolution and the
declared format - including the two traps above, and the release smoke test
now counts what reached the disk, so a change that quietly went back to
unpacking everything fails the job instead of passing it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c048f7ece">It drops the native prebuilds the target platform can never open</a>. Thanks to xet7.</summary>

`bcrypt` and `argon2` (Meteor's `accounts-password`) each ship one
`prebuilds/<platform>-<arch>/` directory per platform they support: 21
native binaries in every WeKan bundle, of which exactly one is ever opened.
Their loader is `node-gyp-build`, and its `resolve()` reads a single
directory - `readdirSync('prebuilds')`, filtered by `matchTuple(platform,
arch)` with `platform` and `arch` from `os.platform()` and `os.arch()`.

That is the same argument `releases/bundle-trim.mjs` already makes about
uWebSockets.js, so it is the same code path. `--trim-prebuilds` keeps the
directories `node-gyp-build` would match and drops the rest, using that
loader's own tuple parsing - multi-arch names such as `darwin-x64+arm64`
included - and keeps both libc flavours of the target, because glibc versus
musl is decided at runtime and not here.

Three things make it safe rather than merely smaller. It is off by default
and refuses to run without an explicit `--platform` and `--arch`, since the
defaults are linux/x64 and a Windows or macOS bundle trimmed with those
would lose the only addon it can load - the fault the single EXE was just
fixed for. `build-amd64` deliberately does not pass it, because every other
bundle WeKan ships is that bundle repacked and trimming there would take
the prebuilds away from architectures not yet built; each final
per-platform job passes its own target. And every decision is made before
anything is deleted, so a package whose prebuilds cannot be reasoned about
is left whole rather than half-trimmed - which is how `bare-fs`,
`bare-path` and `bare-url` were found, shipping `prebuilds/` of `.bare`
files for the Bare runtime. Those are left untouched, and say so.

On the mac-arm64 bundle 19 of the 21 go and the two for `darwin-arm64`
stay. For the single Windows EXE it takes the files that have to be
unpacked from 33 down to about fifteen.

</details>

**Swimlanes** - which swimlane a list belongs to, and whether that can be set.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb5339075">Moving a list to a swimlane binds it to that swimlane</a>. Thanks to TawsTm and xet7.</summary>

Moving a list to another swimlane on the same board did nothing at all. The
list kept its empty `swimlaneId`, so it went on rendering under every
swimlane, and deleting "the one in the second swimlane" deleted the only
list document there was. A board backup showed the empty `swimlaneId` on
lists that the report describes.

`List.move(boardId, swimlaneId)` asked *does the target board already have
a list with this name?* without first asking whether the target board IS
this list's board:

```
const boardList = await ReactiveCache.getList({
  boardId, title: this.title, archived: false });
if (boardList) { ...merge, never writes a swimlaneId... }
else           { ...insert a new list WITH the swimlaneId... }
```

On a same-board move that search finds THIS LIST, so the merge branch ran -
and the merge branch is the one branch that never writes a `swimlaneId`.
The chosen swimlane was discarded every time, which is also why the binding
could not be put back by hand.

Merging is only meaningful across boards; on the same board a move is a
re-bind, and that is what it does now. The decision lives in
`models/lib/listMovePlan.js`, where it is unit-tested, and `models/lists.js`
applies it: same board re-binds this list, another board with the name
already taken merges the cards into that list, another board creates it
there and binds it. An empty `swimlaneId` remains a deliberate un-bind back
to board-wide, which is still a legitimate layout, and `moveList` now
refuses a swimlane that is not on the board the list is moving to.

The same branch also called `card.move(boardId, this._id, boardList._id)`.
`Card.move`'s second argument is a `swimlaneId`, so this set every card's
`swimlaneId` to a LIST id - a swimlane that does not exist - and those cards
became the orphaned cards the board-open repair has to rescue. The cards
were selected as `this.cards(swimlaneId)` as well, filtering the SOURCE
list's cards by a `swimlaneId` belonging to the TARGET board, which on a
cross-board move matches nothing and left every card behind. Both are gone:
a list's own cards travel with it, into the chosen swimlane. A negative test
scans `models/lists.js` for any `card.move()` whose second argument is not a
swimlane, so the argument order cannot go wrong at another call site.

This does not restore bindings already lost. Boards opened under the
versions before [#6515](https://github.com/wekan/wekan/issues/6515) had
every list un-bound automatically, and which swimlane each list belonged to
is not recoverable from the data - a list's cards can be spread across
several swimlanes, and on a board whose second swimlane is new they are all
in the first, so guessing would bind every list to one swimlane and hide it
from the others. With this fix the binding can at least be set again from
Move List.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.48 2026-09-04 WeKan ® release

**In short:** WeKan begins the measured **Less Code** programme by consolidating
ordinary board-theme CSS, compacting the lazy language registry, sharing
bounded pagination, unifying board-read authorization, sharing the board import
pipeline and deleting retired CollectionFS models. The completed programme
removes 1,880 maintained or tracked disabled lines with regression coverage,
and the **browser regression suite** now shares file storage reliably and
switches board views through the UI. The **first header bar** and opened-card
**Custom Fields** controls are also cleaner and more compact.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release improves the following user interface controls:

**The first header bar** - cleaner compact controls make their state clear.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0bf5b7bdae4f90a450fa54e6256b377450b5abcd">Remove the Starred controls' outline</a>. Thanks to xet7.</summary>

The Starred dropdown and current-page star remain adjacent as one logical
group, but no longer carry a white border. Clean Light also leaves the group
borderless instead of replacing that outline with a dark one. Header and theme
tests cover both appearances.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/72d7c0884eb7d81e5d873230a10ce03597fce8c7">Remove the Mobile/Desktop toggle's frame</a>. Thanks to xet7.</summary>

The mode toggle now sits directly on the header with a transparent background
and no black border. Its icons inherit a readable header colour while the
selected mode retains its accent treatment.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f6d73035684f0319728cf4d9337393bf22fec86">Keep the selected mode icon white</a>. Thanks to xet7.</summary>

Both the Mobile and Desktop active states explicitly make their icon container
and Font Awesome glyph white, so board themes cannot replace the selected
mode's contrast colour through inheritance.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a935f84adf7830b5274209869c2667ff4790cea8">Show only the current Mobile/Desktop mode icon</a>. Thanks to xet7.</summary>

Mobile mode now shows only the phone and Desktop mode only the monitor. The
toggle keeps its white active glyph and theme-accent chip without spending
header width on the inactive choice.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b64bada4e875661f24d8d627771bf82414d8064">Align Add Board four pixels higher</a>. Thanks to xet7.</summary>

The whole top-bar Add Board link, including its clickable area, moves upward by
four pixels to align its plus icon with the surrounding controls. Board-template
selection remains unchanged and covered.

</details>

**Opened cards** - Custom Fields shows one quiet layout icon beside its menu.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f7ca17916a6cca075475504c4835e3399fe0f63f">Remove the Custom Fields layout selector's frame</a>. Thanks to xet7.</summary>

The selector's outer button no longer has a white fill or dark edge. Its layout
state and persisted grid-versus-list behaviour remain unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50efbd496fbeb82609431f4f745cbaf6bb30963a">Show one Custom Fields layout icon</a>. Thanks to xet7.</summary>

Table mode renders only its table icon and list mode only its list icon. The
former blue active background and white glyph styling are removed while the
same button continues to switch and persist the layout.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d582fc055df3f151e9fd2b6f828d0bce810502d">Match the Custom Fields layout and menu icon colours</a>. Thanks to xet7.</summary>

The current layout icon uses the same grey as the adjacent Custom Fields menu
button and, like that button, becomes black on hover. Regression coverage keeps
section-title colours separate from this control.

</details>

and improves the following developer tooling:

**Board themes** - solid themes share structure while special designs stay explicit.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd10392306c014f8a3a6ecd6ac34fd55c6ed456b">Share ordinary board-theme CSS</a>. Thanks to xet7.</summary>

Ten solid-colour themes now publish palette values through CSS custom properties
and use one structural rule set. Gradient, image, Relax, Dark, Apple Glass
Pastel, Modern and Clean themes remain explicit where their behaviour differs.
Regression tests verify every palette role and every themed surface; the source
stylesheet is 444 lines and 17,878 bytes smaller.

</details>

**Language loading** - compact metadata preserves every lazy language bundle.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a3bc8155d27728f470a39765dd1eb65d666c3588">Compact the lazy language registry</a>. Thanks to xet7.</summary>

The registry now separates one-line language metadata from its literal dynamic
import map. All 245 keys, locale tags, native names, directions and file paths
remain unchanged, and each translation remains its own lazy split point. New
guards reject duplicate tags and mismatches between metadata and loaders; the
registry is 1,214 lines smaller.

</details>

**Pagination** - one bounded movement rule serves board and administration views.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb0e347865bae598e7446e0bdc8a8f04c4afbac1">Share bounded page movement</a>. Thanks to xet7.</summary>

All Boards and the Admin Panel's reports, event streams, offices and People
views now use one primitive for previous and next movement. It clamps deleted
or stale pages and both ends of the result set consistently. Unit and consumer
tests cover the boundaries, invalid movement and every migrated view.

</details>

**Board authorization** - DDP, HTTP and methods share one board-read policy.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8c867b3383fd21eabdbd258a36e52365c013756">Share board read authorization</a>. Thanks to xet7.</summary>

Public, private, non-member and missing-board decisions are now identical in
card and legacy-attachment publications, attachment download routes and
position-history methods. Each transport retains its own error response. The
legacy attachment publication also permits anonymous public-board reads just
as the HTTP routes do, and the maintained source is 31 lines smaller.

</details>

**Board imports** - source adapters share ordered persistence and ID mapping.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b7115335228ecb68422833500b74b15f5574beb">Share the board import pipeline</a>. Thanks to xet7.</summary>

WeKan JSON and Trello imports now run their normalized stages through one
pipeline, which carries the created board ID and safely defaults missing
optional collections. A shared entity writer owns insertion, timestamp updates
and old-to-new ID recording where the formats use the same mechanics. Adapter
tests preserve their distinct ordering and malformed-input behavior.

</details>

**Retired models** - unreachable CollectionFS implementations no longer remain as source.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e37717d07c9d10a94df360fe9bc6bbc1a6479efc">Remove disabled CollectionFS models</a>. Thanks to xet7.</summary>

Two `.disabled` model files had no imports, startup registration, template
references or package entry and could never load as JavaScript. Their 148 lines
are removed while the active legacy attachment readers and migration paths stay
in place. All 709 Node suites, a production build and a development startup
passed after the removal.

</details>

**Browser regression tests** - containers and the app share test files without
publication races.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe35153ec76091d60d7fef298b9de1dcfe656e82">Make file and board-view browser tests deterministic</a>. Thanks to xet7.</summary>

The bundled test server now keeps its writable files below the shared checkout
and mounts that exact directory into each Playwright container. The attachment
response-policy test therefore writes where the server reads even when Docker
is reached across a Flatpak boundary. The Board Statistics test uses the real
view switcher instead of racing a direct database update against the user
publication. Both regressions pass on Chromium, Firefox and WebKit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8de8ca564d1a5ee872118e1b4b425c7c284b607">Isolate report rows and await reactive list widths</a>. Thanks to xet7.</summary>

The Files Report test now gives every browser run unique attachment IDs and a
shared filename marker, then searches for that marker before checking all five
sanitized names. Rows left by another browser can no longer push an assertion
onto the next page. The fixed-list-width test also polls until the published
profile value reaches the rendered lists instead of sampling their initial
width during WebKit's reactive update.

</details>

and updates the following documentation:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3cbdcc28a">Document the completed Less Code programme</a>. Thanks to xet7.</summary>

The Less Code design document now records the plan, implementation, measurements
and verification results for all six completed phases. It also explains why a
wholesale Jade-to-Svelte rewrite is not itself a code-reduction strategy.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.47 2026-09-03 WeKan ® release

**In short:** WeKan adds lazy, read-only **DOCX, XLSX and PPTX previews** with
strict download, archive and image limits while keeping Office content inactive.
The viewer implementation, workers and WebAssembly parsers stay outside ordinary
browser loads and are fetched only when a matching attachment opens.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release adds the following new feature:

**Attachment viewer** - previews modern Office documents without activating their
content or loading the viewer on ordinary board visits.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b527894001c1375aab395203cd74292556e9c8c3">DOCX, XLSX and PPTX attachments open in a guarded viewer</a>. Thanks to yukiyokotani and xet7.</summary>

The minimal vendored fork retains only the three browser viewer graphs, their
WebAssembly parsers and render workers. Node, MCP, editor, website, development
tooling and unused optional entry points are excluded, and the retained package
has no install scripts or dependencies.

Each format is dynamically imported only when a matching attachment opens. The
production build confirms that viewer implementations, workers and WASM remain
separate lazy assets instead of entering the initial browser bundle. Office files
also remain download-only at the server response boundary.

Authenticated attachment bytes are read through a bounded stream and rejected
above 32 MiB even when `Content-Length` is absent or false. Parsing runs in worker
mode with 32 MiB per-entry, 96 MiB expanded-package, 2,048-entry and 64 MiB decoded
image budgets. Hyperlinks and remote Google Fonts are disabled, and navigation or
closing the overlay aborts downloads and destroys viewer resources. Positive,
negative and UI tests cover recognition, disguised and legacy formats, limits,
lazy imports, retained assets and cleanup.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.46 2026-09-03 WeKan ® release

**In short:** WeKan advances to **Meteor 3.5.2-rc.0**, aligning MongoDB
integration, accounts, DDP, compilers, Rspack and TypeScript with the
release-candidate platform.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release updates the following dependency:

- **Meteor 3.5.2-beta.0 → 3.5.2-rc.0** — advances the framework and its accounts,
  Babel, DDP, ECMAScript, minifier, MongoDB, npm-mongo, Rspack, tools-core and
  TypeScript packages to their release candidates, and updates
  [`@meteorjs/rspack` to 2.2.0-beta.1](https://github.com/wekan/wekan/commit/c7c8592eb584448112bb122003cddfec4e66fe42).
  Thanks to Meteor developers and xet7.

Thanks to Meteor developers and xet7.

# v11.45 2026-09-03 WeKan ® release

**In short:** WeKan updates **qs** to 6.16.0 throughout both the browser-side Node
compatibility layer and the Rspack development-server dependency tree. The update
closes two denial-of-service advisories while retaining the existing API, and also
tightens array-limit enforcement, cycle detection, buffer checks and serialization.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release updates the following dependency:

- **qs 6.15.3 → 6.16.0** — query-string parsing and serialization in the
  browser-side Node compatibility stubs. The update enforces array limits on comma
  groups, preserves cycle detection for empty arrays with own properties, safely
  handles non-callable buffer constructors and corrects filtered dates and encoded
  top-level dotted keys.
- [**Express and body-parser use qs 6.16.0**](https://github.com/wekan/wekan/commit/b5f55584d1d2be7336abe3793c9207015b506cb0) — a scoped override moves Rspack's
  development-server dependency tree past
  [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx)
  and [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g).
  The resulting installed tree deduplicates every affected consumer onto 6.16.0,
  and `npm audit` reports zero vulnerabilities. Thanks to xet7.

Thanks to dependabot and xet7.

# v11.44 2026-09-02 WeKan ® release

**In short:** **Isolated testing on Fedora and Ubuntu Asahi** can now keep the
complete stack inside a dedicated ARM64 KVM guest. **FerretDB** retains its
protocol-required SCRAM-SHA-1 compatibility exception and moves its builds,
dependencies, MongoDB driver and gRPC tooling to Go 1.27-era versions. The **MongoDB
Database Tools** build follows current upstream development and refreshes Go and all
compatible dependencies for every commit-specific snapshot.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release improves developer tooling:

**KVM sandboxes** - complete ARM64 test stacks stay behind a dedicated guest
boundary.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c379584ec">Fedora Asahi gains a dedicated ARM64 KVM test environment</a>. Thanks to xet7.</summary>

The guide keeps the full WeKan and FerretDB stack on a guest-owned disk behind
KVM, libvirt NAT, SELinux sVirt and a local-only display, without forwarding
host files, credentials, Docker, devices or clipboard integration. Host-side
helpers install the Fedora virtualization stack, stage verified ARM64 media in
libvirt's protected image directory, create a conservatively sized VM, start
its local console and request a bounded graceful shutdown without ever forcing
power off. Shell syntax checks cover all three lifecycle scripts.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02776d20b">Ubuntu Asahi gains the same isolated KVM workflow</a>. Thanks to xet7.</summary>

The Fedora files now live in their own `AsahiFedora` directory, while a parallel
`AsahiUbuntu` guide and executable lifecycle helpers install Ubuntu's native
QEMU, libvirt and AArch64 UEFI packages. The Ubuntu VM retains the same KVM,
NAT, local-display and guest-owned-storage boundary, stages installation media
where AppArmor permits system libvirt to read it, and shares no host directory,
agent, Docker socket, device or clipboard channel.

</details>

and updates the bundled database tooling:

**FerretDB** - guarded authentication compatibility and current dependencies.

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/70f5445e">The required SCRAM-SHA-1 digest keeps its scoped CodeQL exception</a>. Thanks to GitHub CodeQL and xet7.</summary>

MongoDB's legacy SCRAM-SHA-1 protocol requires MD5 password preparation before its
salted PBKDF2-SHA-1 derivation. Replacing that operation would reject compatible
credentials rather than strengthen them, so the query-specific CodeQL and LGTM
annotations are restored on that operation alone. A source regression keeps both
annotations attached to the single digest, MongoDB-generated positive vectors retain
interoperability coverage, and invalid salt and authentication cases remain covered.
New deployments should use SCRAM-SHA-256.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/16066af4">Update dependencies and complete the Go 1.27 migration</a>. Thanks to dependabot and xet7.</summary>

FerretDB's runtime, integration, tools and database-image dependency sets now move
together with Go 1.27.0. The maintained wire library replaces removed document
iteration, message-section decoding and logging interfaces while retaining MongoDB
document sequences and IEEE-754 NaN handling. The MongoDB database image, Citus,
OpenTelemetry, SAP HANA driver and resolved indirect dependencies are updated at the
same time.

The test-event decoder accepts Go 1.27's new fields without accepting unknown input,
and all root, integration, release and container build paths use the same Go version.
Unit tests, vet, race-enabled tools tests, SQLite/TLS integration tests and a binary
containing the SQLite, PostgreSQL, MySQL and HANA handlers passed.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/448d31fb">Refresh the MongoDB v2 driver and gRPC dependencies</a>. Thanks to dependabot and xet7.</summary>

The runtime and integration module graphs update the indirect MongoDB v2 driver from
2.2.2 to 2.4.2, while the tools graph updates gRPC from 1.83.0 to 1.83.1. Module
checksums verify and the complete unit, vet and SQLite/TLS integration pipeline passes
with the refreshed dependency graphs.

</details>

**MongoDB Database Tools** - current source, toolchain and dependencies.

<details>
<summary><a href="https://github.com/wekan/mongo-tools-patches/commit/dbe8878">Build current upstream master with newest Go and dependencies</a>. Thanks to xet7.</summary>

The Database Tools build now clones current upstream `master`, including fixes not yet
present in a release, instead of resolving the newest `100.x` tag. Each source snapshot
gets a `master-SHORT-COMMIT-HASH` release identity, while the full commit remains
embedded in every binary and linked from its provenance notes, so fill-in builds cannot
mix assets from different upstream revisions.

The workflows install the newest stable Go, upgrade every compatible direct and
transitive dependency used by the complete package graph, tidy the modules and
regenerate `vendor/` before cross-compiling. Offline coverage checks ref selection,
commit-derived identities, dependency steps, patch integrity and all 136 tool/target
combinations. A real current-master preparation and focused options, `mongodump` and
`mongorestore` tests pass with Go 1.27.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.43 2026-09-01 WeKan ® release

**In short:** **Email delivery** can now use custom SMTP or any Nodemailer
well-known service from the Admin Panel while stored passwords remain strictly
server-side. Existing `MAIL_URL` configuration remains the default until the
administrator explicitly enables the new settings.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release adds the following new feature:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/395f10e03">Configure Nodemailer services in the Admin Panel</a>. Thanks to xet7.</summary>

Admin Panel / People / Email now offers an explicit opt-in switch, custom SMTP
and every well-known service bundled with Nodemailer, including Gmail,
Outlook365, SendGrid, Mailgun, Postmark and the AWS SES regions. Each service
keeps its own settings. Passwords are saved and consumed only on the server;
the admin-only publication exposes merely whether one exists, and a blank
password keeps the stored secret.

Positive and negative transport tests cover custom SMTP, named services,
`MAIL_URL` fallback and non-admin rejection. A browser regression covers the
form and verifies that the password never reaches the client's settings
collection.

</details>

and fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b875537d">Persist and browser-test the Admin Panel email settings</a>. Thanks to xet7.</summary>

The settings schema now retains the selected service, its non-secret fields and
the server-only password map. The Email pane owns its admin-only publication,
so it receives the safe password-present flag whether it is rendered from
People or Settings.

Playwright token login now reuses an already loaded page and its authenticated
Meteor connection. It performs a full reload only when changing away from a
different logged-in user, eliminating the repeated development-bundle loads
that left `waitForMeteor` waiting until the test timeout.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v11.42 2026-09-01 WeKan ® release

**In short:** **Persistent sessions** now remain valid with FerretDB when login
tokens are matched through nested arrays. Cross-database conformance protects
the corrected logical OR behavior on every available backend.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/a7c9441b">Persistent login-token lookup works through nested arrays</a>. Thanks to jeremy-arsia and xet7.</summary>

FerretDB's SQLite query optimization translated a logical OR into SQL when
every branch appeared safe, but its direct dotted JSON accessor could not
follow a path through the `loginTokens` array. It discarded the matching user
before the Mongo-compatible filter ran, so HttpOnly cookie refresh returned
`invalid_cookie` and logged the user out shortly after login. Logical OR filters
with dotted paths now remain in the authoritative Go matcher, while safe scalar
OR queries keep their optimized SQL path. Positive collection coverage
reproduces the nested-token lookup and a negative builder test prevents the
unsafe pushdown.

</details>

and improves developer tooling:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f1793294b">Every available database verifies logical OR matching through dotted arrays</a>. Thanks to jeremy-arsia and xet7.</summary>

The shared FerretDB conformance catalogue now reproduces the nested-array query
from FerretDB issue 17 instead of testing dotted paths and logical OR only in
isolation. The current arm64 run built FerretDB from commit `a7c9441b` and ran
all 103 cases on SQLite, PostgreSQL, MySQL and MariaDB. Every backend answered
every case identically with no errors. SAP HANA remains the script's explicit
opt-in backend and has no arm64 image, so it could not run on this machine.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.41 2026-09-01 WeKan ® release

**In short:** **MimeBleed** attachment defenses now reject an additional stored
XSS syntax and fail closed on every storage backend, including legacy records
with executable metadata. **All Boards** sorting now changes immediately and
persists reliably, while **FerretDB** avoids a multi-gigabyte allocation that
could cause high CPU, connection resets and database crashes. Multi-user
browser coverage also keeps simultaneous sessions genuinely independent.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following CRITICAL SECURITY ISSUE of
[MimeBleed](https://wekan.fi/hall-of-fame/mimebleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8e7b704d">Attachment content is fail-closed on every storage path</a>. Thanks to avrlab233 and xet7.</summary>

Slash-separated tags with unquoted event handlers could bypass the markup
sniff, filesystem-destination uploads skipped the validation applied during
storage migration, and Meteor-Files could serve executable stored metadata
inline from its original route. Upload validation now recognizes those handler
and JavaScript-URI forms for every destination. Filesystem, GridFS and cloud
downloads share one response policy that forces HTML, SVG, XML and JavaScript
types or filenames to an opaque attachment with `nosniff`, frame denial and a
sandboxed CSP. Rejected uploads remain visible as MimeBleed events in Admin
Panel → Problems; ordinary file views are transformed safely rather than logged
because the response path cannot distinguish an attack from a legitimate view.
Mocha covers the reported payload and negative samples, Node coverage pins all
storage shapes, and Chromium, Firefox and WebKit exercise the full download
route.

</details>

and fixes the following bugs:

**All Boards** - sorting uses one reactive choice from the popup through the
rendered board grid.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8dddeafa">The chosen board order takes effect immediately and remains selected</a>. Thanks to jullbo and xet7.</summary>

The profile was updated on the server, but the popup, pagination and board grid
continued reading a current-user document that was not guaranteed to be
republished after the click. The chosen mode now has an immediate reactive
client value, is shared by every sorting consumer, and rolls back if persistence
fails. Browser coverage verifies both visible A→Z ordering and the stored profile
choice, including the selected state when the popup is reopened.

</details>

**FerretDB** - sorted queries allocate memory for real results instead of a
wire-protocol sentinel limit.

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/69ae0522">Effectively unlimited sorted queries no longer reserve gigabytes up front</a>. Thanks to jeremy-arsia, Heart1010 and xet7.</summary>

A client's ordinary sorted find can express no practical limit as
`2147483647`. FerretDB used that number as a Go slice's initial capacity and
could immediately request about 16 GiB, causing high CPU, out-of-memory crashes,
connection resets and temporarily missing boards while the database restarted.
The bounded top-k heap now starts small and grows only for documents that exist.
A maximum-limit regression test verifies correct ordering without the eager
allocation, while the finite-limit test keeps the bounded behavior covered.

</details>

and improves developer tooling:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f8f9845a">Simultaneous browser users keep independent sessions</a>. Thanks to xet7.</summary>

The multi-user stability test opened both users in one browser context, where
Meteor's origin-scoped resume token necessarily made the second login replace
the first. It now uses a separate context per user, matching real independent
sessions and removing the false timeout while still verifying both board views.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.40 2026-09-01 WeKan ® release

**In short:** **Board views** now change their content together with the menu,
scope every card to its containing swimlane, and persist board favorites through
the server. Lists, Calendar, Gantt, Table and Statistics therefore replace the
Swimlanes layout immediately, while shared lists keep their cards and counts in
the lane where each copy is rendered. **Full-stack testing** now keeps
authenticated navigation stable and reaches host Docker from Flatpak.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following bugs:

**Board views** - content switches safely while reactive templates are replaced.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9c5028ae">Board content follows view changes and cards stay in their containing swimlane</a>. Thanks to hmeunier95 and xet7.</summary>

The view menu used the pending reactive choice, but every content-layout helper
independently read the previous profile value, leaving Swimlanes visible for
Lists, Calendar, Gantt, Table and Statistics selections. Both now use one
source. Card rendering and counts also resolve the containing swimlane
explicitly instead of relying on relative Jade context that could become
undefined and remove swimlane scoping. Finally, all favorite controls persist
through the authenticated server method instead of rollback-prone direct client
updates. Regression coverage checks all six layouts, positive card/count scope
and the absence of direct favorite writes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c35ecee4">Destroyed swimlanes no longer initialize deferred drag-and-drop</a>. Thanks to xet7.</summary>

A view change can destroy a swimlane before its deferred sortable setup runs.
The callback then tried to select elements from a removed Blaze DOM range and
raised a page-level error even though the new view rendered successfully.
Deferred swimlane and list-group setup now exits after destruction. Source
coverage pins both guards, and the complete browser matrix verifies all board
views without the removed-range exception.

</details>

and improves developer tooling:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c35ecee4">Browser and database conformance runs stay reliable in the development sandbox</a>. Thanks to xet7.</summary>

Authenticated browser tests now navigate through the live Meteor application,
wait for application readiness before inspecting verification state, and retry
a card click when a subscription replaces its DOM after refresh. Database
conformance routes Docker commands through the host when invoked from Flatpak.
The complete sequential run passed all WeKan and FerretDB stages; SQLite,
PostgreSQL, MySQL and MariaDB answered all 102 conformance cases identically.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.
