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
feature or a wrapper change verified on a real snap install),
[#5758](https://github.com/wekan/wekan/issues/5758) (Windows SSO via Kerberos/
NTLM through `node-expose-sspi`: a Windows-only native Node addon exposing the
Win32 SSPI API — needs a Windows host, node-gyp/MSVC build tools, an Active
Directory domain, and a real SSPI handshake to build or verify at all; it also
sits directly in the authentication path, where a wrong implementation done
without that environment is a security risk rather than a convenience. The
maintainer's own comment on the issue already flags Node 20 compatibility
doubts and asks for a Windows/AD-experienced contributor).

</details>

<details>
<summary>Need the running app to reproduce/verify (runtime UI or publication/mergebox state), not unit-testable here.</summary>

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
reminder, a feature; [#4278](https://github.com/wekan/wekan/issues/4278) asks
for the same reminder as a rule action, which needs a scheduled/deferred
trigger the rule engine does not have today — every existing trigger fires on
an immediate event, not a future point in time),
[#4294](https://github.com/wekan/wekan/issues/4294) (rule actions should
support a limited set of variables, e.g. assigning a card to its creator by
default — every action field is a literal value today; resolving one from
the triggering event needs a small templating layer in
`server/rulesHelper.js`'s action runner, a new kind of field),
[#4294](https://github.com/wekan/wekan/issues/4294) (a rule should be able to
combine multiple triggers/actions instead of one of each — `models/rules.js`
ties a rule to exactly one `triggerId`/`actionId`; supporting several is a
schema change, not a UI fix, and needs a decision on how a multi-trigger rule
matches: any trigger, or all of them; [#2953](https://github.com/wekan/wekan/issues/2953)
asks for the same thing),
[#4160](https://github.com/wekan/wekan/issues/4160) (rule "move card" action
has Copy/Link siblings requested — the copy/link-card flow used by the manual
card menu is a different code path from `server/rulesHelper.js`'s action
runner; wiring it in as a new rule action is a real feature, not a small
addition),
[#3235](https://github.com/wekan/wekan/issues/3235) (rule action to copy a
card to another board and list — same underlying gap as #4160, plus needs a
board/list picker in the rule-action UI),
[#3948](https://github.com/wekan/wekan/issues/3948) (rule email action should
support attachments — `client/components/rules/actions/mailActions.js` and
its server-side sender only handle a plain templated body today; attaching a
card's files means streaming them through the mailer, a scope change to the
existing action, not a bug),
[#3195](https://github.com/wekan/wekan/issues/3195) (rule action/trigger
values should be able to reference a custom field's value — today's action
and trigger value inputs are plain literals; resolving a per-board custom
field by id needs the same kind of templating layer as the #4294 variables
ask above, plus a custom-field picker in the rule UI),
[#2698](https://github.com/wekan/wekan/issues/2698) (sync rules with GitLab —
a third-party integration needing a GitLab API credential and webhook
endpoint, environment/infrastructure this sandbox cannot stand up or verify),
[#3815](https://github.com/wekan/wekan/issues/3815) (more variables in rule
email/string templates — `{username}` and a direct card link landed for
\#3304/\#3301, but the request is open-ended about which further fields
(board/list/swimlane name, custom fields) should be addressable; needs the
same templating-layer decision as the #4294 variables ask above),
[#4790](https://github.com/wekan/wekan/issues/4790) (a sprawling "User
Filter" wishlist - the reporter's own words are "I'm kind of confused" about
whether it is one feature or several; it bundles per-org/team/board label
expansion, granular board roles, LDAP-group-driven auto-labeling and
permission inheritance, none of which is a filter change - needs it split
into separate, concretely-scoped issues before any one part is buildable),
[#2044](https://github.com/wekan/wekan/issues/2044) (an AND/OR toggle for
the whole filter panel - today every active filter field is combined with
implicit AND, and the fields within one SetFilter with OR; switching that
per-panel, or per-field, is a real change to `Filter._getMongoSelector()`'s
selector-building shape, not an additive filter, and needs a decision on
what the toggle should scope: the whole panel, or one field at a time),
[#1915](https://github.com/wekan/wekan/issues/1915) (hide cards by a date -
largely already covered by the existing `Filter.dueAt` past/today/tomorrow/
this-week/next-week/no-date states; the remaining gap is filtering by
`createdAt`/`receivedAt`/`endAt` rather than only `dueAt`, which needs a
decision on whether to generalize `DateFilter` to a chosen date FIELD or add
one `DateFilter` per date field, since today's UI hard-codes "due date"),
[#1871](https://github.com/wekan/wekan/issues/1871) (filter subtasks by
their parent card - subtasks are cards linked via `parentId`, and no
existing `SetFilter` targets that relation; needs a decision on UI: a
parent-card picker in the sidebar, versus a `parent:<title>` token in the
existing advanced/text filter),
[#1499](https://github.com/wekan/wekan/issues/1499) (hide old/done tasks -
overlaps `Filter.dueAt.past()` and the existing Swimlane/List "Done"
concept; the open part is a rolling "older than N days" cutoff, which
`DateFilter` has no relative-N-days state for today, only fixed
day/week/no-date buckets),
[#935](https://github.com/wekan/wekan/issues/935) (filter cards by date or
tag - dated 2017; labels are already filterable and `Filter.dueAt` covers
due-date ranges, but "moved on a specific date" would need a per-activity
date filter, not a card-field one, since a card has no single "last moved"
field today),
[#3361](https://github.com/wekan/wekan/issues/3361) (a filter for the
Calendar/Multi Board Calendar view - whether the sidebar `Filter` already
scopes what those views draw needs checking against the LIVE calendar
rendering, which is runtime UI state this sandbox cannot verify by reading
source alone).

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
[#2509](https://github.com/wekan/wekan/issues/2509) (a "customized card
style" - the report is a single line plus a screenshot with areas marked in
blue that is not accessible from here, and it names no concrete visual
property (text colour, border, font, per-card background, ...). @xet7's own
comment on the issue already flagged this: a new Image field for Custom
Fields, Custom Field layout options, or a Custom CSS feature "are not in
Wekan yet." None of those exist today either, so building something now
would still be a guess at what the blue markup meant. Meanwhile a large
share of "customize how a card looks" already has real, present answers:
board background colour/image, per-board/per-user label colours, and, from
this release, the minicard title/collapse caret, opt-in comments on the
minicard, a checkbox custom field's tick/cross icon, per-board default label
text visibility, and custom-field sort order. Needs the maintainer either to
describe the screenshot's blue markup or to pick which additional visual
property should become the customizable one before this can be scoped),
[#3275](https://github.com/wekan/wekan/issues/3275) (generate thumbnails for
image attachments, referencing Meteor-Files' image-processing documentation, so
minicard covers and the attachment list preview a smaller resized image instead
of the full original. Confirmed NOT built: `models/attachments.js`,
`models/attachments.server.js`, `client/components/cards/minicard.jade` and
`client/components/cards/attachments.jade` still read `cover.link('original')` /
`{{link}}` with no other version, and the client override of `Attachments.link`
(`models/attachments.js`) ignores its `version` argument entirely, always
resolving through `generateUniversalAttachmentUrl` to `/cdn/storage/attachments/
<fileId>` with no version selector. `sharp` IS already a project dependency
(used today for GIF handling in `server/lib/imageGif.js`), so the image-
processing half is not the blocker. What is missing is the plumbing around it:
`server/routes/universalFileServer.js` serves a single stored file per
attachment ID with no version query parameter, and attachment storage spans
four independently-implemented backends (filesystem, GridFS, S3/Azure/GCS, each
its own `FileStoreStrategy` in `models/lib/fileStoreStrategy.js` /
`attachmentStoreStrategy.js`) that would each need to persist and serve a second
"thumbnail" version safely alongside the original. Building that end-to-end
touches the same `Attachments.onAfterUpload` hook and upload/serving routes that
concurrent MIME-validation work (#3274) was editing live in this same session,
so it needs a maintainer decision on the URL/version contract (a `?v=thumbnail`
query parameter vs. a distinct route, and whether older attachments get a
backfill or only fall back to the original) before it is safe to build without
colliding with that other in-flight change),
[#3249](https://github.com/wekan/wekan/issues/3249) ("semi-open" boards -
visible to every logged-in user but excluded from search-engine indexing.
WeKan's `permission` field is only `public`/`private` today
(`models/boards.js`); there is no `noindex`/robots concept anywhere in the
codebase. A third tier is more than a flag: it changes what the Public
Boards page, the board publication's visibility selector
(`models/lib/boardVisibilitySelectors.js`) and the sitemap/robots routing
all mean by "public", and needs a decision on the exact rule - e.g. any
logged-in user vs. only this instance's users, and whether search engines
are kept out via `robots.txt`/`noindex` meta or by the board simply never
appearing in an unauthenticated response - before it is worth adding as a
third `permission` value alongside `public`/`private`),
[#3256](https://github.com/wekan/wekan/issues/3256) (requests an
image-coordinate-based "hot area" marker visualization - upload a background
image, overlay a grid, place clickable card markers on it - a new data model
and rendering mode outside WeKan's existing list/swimlane structure; needs a
scope decision before implementation),
[#3626](https://github.com/wekan/wekan/issues/3626) (a card as a subtask of
MULTIPLE parents - today `parentId` (`models/cards.js`) is a single field, and
every ancestor walk (`setParentId`'s #3328 cycle guard, `parentList`,
`parentString`, the subtask completion counter) assumes exactly one parent;
turning that into an array or a separate join changes the shape all of them
read, so it needs a deliberate design decision rather than a quick patch. The
other two parts of #3626 are done: the completed/total subtask counter was
already correct (pinned by the #4050 work), and picking an EXISTING card as a
subtask from the parent card's own UI is now built.),
[#2460](https://github.com/wekan/wekan/issues/2460) (SQRL login - the report
is a single comment-free link to https://www.grc.com/sqrl from 2019. SQRL has
no official Meteor/Node package, unlike accounts-2fa (#3058); confirmed no
`sqrl` dependency exists in `package.json`. Supporting it would mean
implementing SQRL's own custom Ed25519-based handshake protocol - not
OAuth2/OIDC, which WeKan already supports generically via
`accounts-oidc`/similar - either from scratch or via a third-party library,
and no well-maintained, actively-updated, MIT/copyfree-licensed Node.js SQRL
library is known to exist that a Meteor server integration could trust.
Hand-rolling an authentication protocol's cryptography is exactly the
security-critical work that should not be freshly written without extensive
review. SQRL's real-world adoption peaked around 2013-2016 and has not grown
since this issue was filed; WebAuthn/FIDO2 passkeys are the passwordless
standard that gained the adoption SQRL did not. Needs a maintainer decision
on whether this remains worth pursuing before any implementation is
attempted.),
[#2713](https://github.com/wekan/wekan/issues/2713) (attaching a card's
actual FILE attachments to the email a rule sends, not just its
title/description/link - every WeKan email today goes through
`server/rulesHelper.js`'s `Email.sendAsync`/`EmailLocalization.sendEmail`
call sites, which take `{ to, from, subject, text }` with no `attachments`
parameter anywhere in this codebase; no other WeKan email path attaches a
file either. Wiring a real attachment through needs the mailer wrapper
itself to grow attachment support and code to read the file back out of
whichever of the four storage backends
(`models/lib/fileStoreStrategy.js`/`attachmentStoreStrategy.js`:
filesystem, GridFS, S3/Azure/GCS) holds it - mailer-level scope past what a
single rule action should take on alone, and needs a maintainer decision on
size limits/backend coverage before it is built.).

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

<details>
<summary>Import/export: more formats, and the six existing ones brought up to full field fidelity.</summary>

docs/Features/ImportExport/Format-Coverage.md is the design contract for every
import/export format. Trello, the canonical WeKan zip, CSV/TSV, XLSX and PDF/
HTML/SVG already meet it, each with real code and tests. GitHub/Gitea/Forgejo
was brought up to it this round (second assignee, milestone, state reason,
comments, an `unsupported` loss report). Six formats in
models/lib/externalParsers.js / externalExporters.js are still the thin,
intentionally best-effort stub each got when the shared import/export
plumbing (validation boundary, checkpoints, one import page) landed: Jira
(no ADF description, no custom fields, no pagination), Kanboard (no
subtasks/comments), NextCloud Deck (no ACL/attachments/comments), OpenProject
(no hierarchy/relations/watchers/custom fields), Asana (no
subtasks/dependencies/stories/custom-field values) and Zenkit (no hierarchy/
members/item-level custom fields, no loss report). Each needs its own
fixture/spec pass, the way GitHub just got one - not a shared shallow bump.

Additional formats named but not yet researched or built: the Leo literate
editor's `.leo` outline format, and whatever else other kanban/outline tools
use for import/export that WeKan does not read or write yet. Each new format
costs roughly what Markdown (this round's new format) cost: a parser, a
formatter, tests, UI wiring in the import picker and export menu, and - since
every user-visible string needs one - a new translated string across all 234
locale files, not just an English placeholder (tests/allTranslationCompleteness.test.cjs
enforces that). Not attempted as a batch; take them one at a time, following
the Markdown commit as the template.

</details>
</details>

# Upcoming WeKan ® release

**In short:** this release adds **Frappe Gantt**, **DHTMLX Gantt** and
**Chart.js**-drawn report charts as new Board View pages, restores the
full-featured **document preview** viewer, hardens the **HttpOnly login
cookie**, and adds opt-in **two-factor authentication**. The **minicard**
title moved to the top with a collapse caret, new **Group by Assignee**,
**Bigboard** and **Multi Board Calendar** views join checklist bulk-editing, **Clone Board**
card-skipping, Admin Panel People filtered **by Team**, **Rules** title
validation and assignee triggers, and an **Admin only** custom-field flag
that hides a field's value from non-admin board members.

This release adds the following new features:

**Notification Settings** - one place to turn tray/email notifications on or off.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bde66a5c7ddba955c7e6583304a1ca7274aaf8f4">Add a 3-tier Notification Settings popup to Member Settings, Board Settings and Admin Panel / People</a>. Thanks to xet7.</summary>

Whether a notification reaches the in-app tray or an email was previously
all-or-nothing: `Notifications.notify` fanned out to every subscribed
service (`profile` for the tray, `email` for mail) with no way to turn
either off. This adds a "Notification Settings" entry - right below Email
in Admin Panel / People, and matching entries in Board Settings and Member
Settings - all three opening the same reusable
`notificationSettingsPopup` template.

Precedence follows the theme override pattern already used elsewhere:
Admin Panel default, then Board override, then the member's own override,
each optional/nullable so an unset level falls through to the next. The
resolution itself is a small pure function,
`resolveNotificationSetting()` in `models/lib/notificationSettings.js`,
unit-tested for every precedence case
(`tests/notificationSettingsResolution.test.cjs`).
`server/notifications/profile.js` and `server/notifications/email.js` now
call it before adding to the tray or buffering an email, so a disabled
service is genuinely skipped, not only hidden in the popup.

</details>

**Board reports** - the Gantt view and the 10 board report chart views.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e5e4c97154f5ecf940958504c65f1159cf0b7165">Frappe Gantt and DHTMLX Gantt added as their own Board View pages; report charts now draw with Chart.js</a>. Thanks to xet7.</summary>

Three full-featured, permissively-licensed charting libraries replace the
plain CSS bars used so far, chosen for a copyfree license and a minimal,
auditable dependency tree over feature richness:
[Frappe Gantt](https://github.com/frappe/gantt) (MIT, zero runtime
dependencies, ~15 KB gzipped), [DHTMLX Gantt Community Edition](https://dhtmlx.com/docs/products/dhtmlxGantt/)
(genuinely MIT as of v10 - verified against the LICENSE.md text inside the
published package, not just the npm license field, since
[#2870](https://github.com/wekan/wekan/issues/2870) rejected an earlier
DHTMLX Gantt proposal in 2020 for being GPL), and
[Chart.js](https://www.chartjs.org/) (MIT, one dependency - `@kurkle/color`,
also MIT). All three are loaded with a dynamic `import()` so their code
only reaches the browser when the relevant view is actually opened, never
on every page load.

WeKan's own hand-rolled Gantt view (the week-grid table) is kept exactly as
it is. Frappe Gantt and DHTMLX Gantt are each their own separate Board View
menu entry and page - like every other view (Swimlanes, List, Calendar,
Statistics, ...), picking one shows only that view, rather than stacking a
second Gantt below the first on the same page. Both draw the same
start/due/end task set from the board's cards, open a card on click, and
export to PDF/Excel through the existing `gantt` chart export route rather
than a second pipeline for identical data. DHTMLX Gantt is a page-wide
singleton (`gantt`, not a class instantiated per container, unlike Frappe
Gantt), so it is torn down with `destructor()` on every re-render and
template destroy rather than merely cleared. The 10 board report chart
views draw a Chart.js bar chart instead of a stack of CSS-width divs,
reusing the same data normalization and the same per-chart export route
unchanged - only the rendering changed.

frappe-gantt's package.json `exports` map has no `./dist/frappe-gantt.css`
subpath (only a `style` CONDITION on `.`), which `meteor build` caught
immediately: "Package subpath './dist/frappe-gantt.css' is not defined by
exports". Its CSS is vendored verbatim into `frappeGanttLib.css` instead and
loaded statically, the same way `gantt.css`/`ganttCard.css` already are.
`dhtmlx-gantt` has no `exports` map at all, so its CSS needed no such
workaround.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17aa92e90aa97bee086f2efb6ecd6e50d7ab5ef9">Calendar, Frappe Gantt and DHTMLX Gantt now show all four card dates, and dragging a bar reschedules the card</a>. Thanks to xet7.</summary>

The Calendar view drew a Start/End interval bar and a separate Due marker,
but Received never got a marker at all, and a card whose Start fell
outside the visible window got no End marker either. `cardsReceivedInBetween`/
`cardsEndInBetween` (mirroring the existing `cardsDueInBetween`) give
Received and End their own labeled events, so all four of WeKan's card
dates are visible on the Calendar.

Frappe Gantt and DHTMLX Gantt each only ever drew a single bar per card
(Start-or-Received to Due-or-End), silently dropping whichever date lost
that fallback. Both now track which underlying field each bar edge
actually represents and show all four dates - Frappe in its click popup,
DHTMLX in its hover tooltip - so Received/End stay visible even when the
bar itself only spans Start/Due.

Compared against [Kanboard](https://kanboard.org/)'s Gantt
(`kanboard/plugin-gantt`, MIT) for feature parity: both WeKan Gantt
alternatives now support drag-to-move and drag-to-resize, persisted back to
the correct field (`card.setStart`/`setDue`/`setReceived`/`setEnd` - the
same calls the Calendar's own drag handlers already use), gated on the same
board-write capability as the rest of WeKan rather than offered to users
the server would refuse. Kanboard has no dependency arrows, view-mode
switching or export; nothing to match there.

</details>

**Minicard** - the card as drawn on the board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ce1cbf6fff2301bf5a0847d509a40049a349fb3f">The minicard title moved to the top, and gained a whole-card collapse caret</a>. Thanks to xet7.</summary>

The title used to render after the dates/cover/upload-progress block. It
now renders first, right after the drag handle and details-menu button, so
it stays visible regardless of collapse state.

A caret at the minicard's top-left corner - the same caret-down/caret-right
convention already used for list, swimlane and per-checklist folding, with
the same accessibility attributes as the per-checklist caret on the
minicard itself - collapses everything except the caret and title: dates,
cover, upload progress, labels, custom fields, assignees/members,
checklists, badges, description, list name and parent-task prefix/subtext.
The details-menu button and the optional drag handle stay reachable either
way. State persists the same way list collapse already does - a Session
cache, then `profile.collapsedCards` on the user document - deliberately
with no anonymous/cookie fallback, since a public board can have far more
cards than lists.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e7a648464416b981a9062dc8aecd975f45a656c">Show a card's comments directly on the minicard, opt-in</a>. Thanks to Meeques and xet7.</summary>

Board Settings / Card gets a new "Comments on minicard" row, following the
same allowsX/allowsXOnMinicard pattern already used by Received date and
every other Card Settings toggle. It is opt-in and OFF by default, so
existing boards are unaffected.

When enabled, the minicard shows up to 3 of the card's most recent
comments, each truncated to 140 characters, reusing the same `comments()`
card helper the existing comment-count badge already calls - no new
subscription, so boards that do not use this pay no extra cost. A "more"
affordance appears when there are more comments than shown or one got
truncated; it relies on the minicard already being a link to the full card
rather than adding a second, in-place "expand all comments" interaction -
display only, with no reply/edit capability from the minicard itself.
Useful for classroom/at-a-glance use, per the original request.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/694f26bf756f44249eb6120912e0db5ba15bf97e">Highlight a minicard when it has comments the user has not seen yet</a>. Thanks to H4usi and xet7.</summary>

There was no way to tell at a glance which cards had new comments since the
user last looked. Searched for an existing "last viewed"/"unread" tracking
mechanism to reuse first - `models/cards.js`, `models/cardComments.js` and
`models/watchable.js` only track board-level watching, and the closest
per-user, per-card shape already in WeKan is `profile.collapsedCardSections`
on the Users document, used for fold state - so this follows it: a new
`profile.cardLastViews` map (cardId -> Date), set by
`Template.cardDetails.onCreated` whenever the user opens a card, the same
existing open trigger the fold state itself does not need to touch.

Whether a card counts as unread is a pure, unit-tested decision
(`models/lib/unreadComments.js`): a comment created after that timestamp
flags it, and so does any comment at all on a card that was never opened -
there is nothing to compare against yet. A card with zero comments is never
flagged. The minicard applies a `minicard-unread-comments` class - an inset
ring plus a left-edge stripe rather than a background fill, so it stays
visible against every label swatch and board color a minicard can already
have - and a tooltip naming it, and opening the card clears it immediately.

</details>

**Time tracking** - the Time board view.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/070a1ad10bdf9a5ad64f2ee7346ff05e8392f7d9">The Time view now reports hours by assignee/card, and exports to PDF/Excel like every other chart view</a>. Thanks to xet7.</summary>

[#812](https://github.com/wekan/wekan/issues/812)'s 39-comment thread
repeatedly asked for external timesheet integrations (Kimai, Harvest,
Titra) that were never resourced - the maintainer's own 2021 comment
quotes a ~1000 EUR / 4-month estimate for a Kimai sync, shelved shortly
after. What the thread DID converge on that fits inside WeKan itself:
"reporting total hours by resource and task type" (the issue's own words),
and export - both added here without any external service.

The Time view now shows, alongside its existing 3-row summary kept exactly
as it was, an hours-by-assignee breakdown (summing each card's logged time
per assignee, not counting cards) and an hours-by-card breakdown, scoped to
non-archived cards. `time` is registered as a real chart key alongside
Dashboard/Burndown/Gantt/etc., so it exports to PDF/Excel through the exact
same `/api/boards/:boardId/charts/:chartKey/export*` routes every other
board report chart already uses, rather than a second export pipeline just
for Time.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8eee59e6f4445c0bfd1d49378cabf10b256ebb5">Added a Flowtime session - start, tally interruptions and stop, feeding the same Spent Time total</a>. Thanks to xet7.</summary>

[#3919](https://github.com/wekan/wekan/issues/3919) asked for Flowtime as an
alternative to Pomodoro: unlike Pomodoro's fixed 25-minute work/break cycle,
Flowtime has no fixed interval - you start a session and keep going as long
as you are in flow, tally interruptions as they happen without stopping the
clock, and stop the session when the flow naturally ends. Per the issue's
own "related to Timetracking #812", this integrates with the existing
manual time-entry popup (`cardTime.js`/`models/cards.js`
`setSpentTime()`/`setIsOvertime()`) rather than tracking a second,
disconnected total.

A new card-detail block (`cardFlowtime.js`/`.jade`/`.css`) offers Start
Flow, a live elapsed-time readout that ticks every second, the running
interruption count, Add Interruption and Stop Flow, gated on
`Utils.canModifyCard()`. The in-progress session
(`flowStartAt`/`flowInterruptions`/`flowUserId`) is persisted on the card
itself rather than in Session/localStorage, so a page reload does not lose
it. Stopping the session computes its duration and ADDS it, in hours, into
the card's existing `spentTime` field through the same `setSpentTime()`
helper the manual popup already calls, then clears the session fields -
Flowtime feeds the one Spent Time total the card already had, it does not
keep a separate one.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/74e4248ee9e936b51654e1a1781305b1ab963392">Added a Pomodoro timer, alongside Flowtime, with its own fixed work/break cycle</a>. Thanks to xet7.</summary>

[#4862](https://github.com/wekan/wekan/issues/4862) asked for a Pomodoro
timer, the classic FIXED-interval technique this project's own Flowtime
feature (above) deliberately does the opposite of: a 25-minute work
interval, then a break (5 minutes, or a longer 15-minute break every 4th
completed work interval), rather than an open-ended session. It sits as
its own, separate block (`cardPomodoro.js`/`.jade`/`.css`, its own
`pomodoroStartAt`/`pomodoroPhase`/`pomodoroCount`/`pomodoroUserId` fields
and its own Start/Stop methods) alongside `cardFlowtime`'s block in
`cardDetails.jade`, not a rename or reuse of anything Flowtime added.

A configurable work-length input and Start Pomodoro button begin a work
interval; a live countdown (the same `Meteor.setInterval` idiom
`cardFlowtime.js` uses for its own elapsed-time readout) shows the
Work/Break phase and the completed-interval count. When a work interval's
countdown reaches zero, its duration is added, in hours, into the card's
existing `spentTime` field through the same `setSpentTime()` helper the
manual time-entry popup and Flowtime both already use, the completed count
increments, and the card switches to a break interval; a completed break
interval adds no time and returns to ready-to-start rather than
auto-starting the next work interval. Stop/Reset credits whatever elapsed
so far if stopped mid-work-interval (consistent with Flowtime's own
partial-session credit) and clears every Pomodoro field back to its
empty/null default.

</details>

**Member Settings** - the notification/editor toggles in the Member Settings popup.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6e36dcabe5ca01dadd106b066ec21b7f954d4dd7">Added an audio ding when a checklist item is checked off</a>. Thanks to C0rn3j and xet7.</summary>

[#5427](https://github.com/wekan/wekan/issues/5427) asked for a short sound
when a checklist task is checked off. An earlier attempt to bundle a
downloaded (Pixabay) sound file was rejected in the issue thread because its
license was not copyfree/MIT/BSD-compatible for WeKan to ship, so instead
`client/lib/checklistDingSound.js` synthesizes a short two-note chime with
the Web Audio API (`OscillatorNode` + a `GainNode` envelope) - no audio file,
no licensing question. Playback is wrapped in try/catch and guarded on
`window.AudioContext`/`webkitAudioContext` actually existing, so it can never
throw into the checklist toggle it is called from.

A new Member Settings toggle, `profile.checklistDingSound` (off by default,
the same shape as the existing `submitOnEnter`/`openManyCardsAtOnce`
preferences beside it), gates it. The ding only plays on the
unchecked-to-checked transition of `checklistItemDetail`'s toggle handler in
`client/components/cards/checklists.js` - never on uncheck, and never when
the preference is off.

</details>

**Checklists** - individual items inside a checklist.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7bf50deb42d0c293c7db053261bde0f96ef71bd">Individual checklist items can now have their own due date</a>. Thanks to DimDz and xet7.</summary>

[#4755](https://github.com/wekan/wekan/issues/4755) asked for due dates on
checklist items - only the card itself had one, so a deadline that belonged
to one step of a checklist had to be written into the item's title as text.
`ChecklistItems` gained an optional `dueAt` field, and `getDue`/`setDue`/
`unsetDue` helpers that mirror `Cards`' own due-date methods letter for
letter. Each item row now shows a small clock icon (or, once a due date is
set, a compact badge) that opens the same date/time-picker popup a card's own
due date uses - the badge markup (`dateBadgeBody`) and the popup form
(`editDateForm`) are reused as-is rather than adding a second date-picker, and
an item whose due date has passed turns red through the same `dueDateClass`
decision the card's due-date badges already use. No member-assignment was
added - the issue asked for due dates only - and no new translation key was
needed, since the popup title and badge tooltip reuse the existing card
due-date strings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bed9bce31227df8a6492e6f1a284ce9d28c01a29">A checklist's items can now be bulk-edited as one block of plain text</a>. Thanks to gerroon and xet7.</summary>

[#4218](https://github.com/wekan/wekan/issues/4218) asked for a checklist's
items to be editable as a single multi-line text block, one line per item,
rather than only through individual per-item HTML rows - so reordering,
copying between checklists/cards or a bulk rewording is paste/cut/type
instead of a click-drag or a click-edit-save per item. WeKan already let a
user paste multiple lines into the "add item" box to create several items at
once (the newline-becomes-item toggle); this adds the matching capability for
*editing* the items a checklist already has.

A new "Edit as text" entry on the checklist's actions menu (next to
Export/Import) opens a textarea pre-filled with the checklist's current
items, one per line, using the Markdown-checklist convention `[x] Done item`
/ `[ ] Todo item` for checked state - a plain line with no marker defaults to
unchecked, so text pasted in from elsewhere still works. Saving replaces the
item list with what was typed, in that order. The parsing and the
replace-plan are pure functions
(`models/lib/checklistItemsAsText.js`): a parsed line is matched against the
checklist's current items by UNCHANGED title text (consumed top-to-bottom, so
reordered duplicate-looking lines still pair 1:1); a match keeps that item's
existing document - only its `sort`/`isFinished` change - so any other
metadata on it, notably the #4755 due date above, survives an edit that
doesn't touch its text. Only a line with no remaining match becomes a new
item, and only an existing item whose text is gone from the new text is
removed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f4c5e68c989fac536f929d18e8650c6a8cca6d1">A template card's checklists can now be copied onto an already-existing card</a>. Thanks to Th0mas89 and xet7.</summary>

[#4017](https://github.com/wekan/wekan/issues/4017) asked for a checklist
template to be applicable to a card that already exists, not only at
card-creation time - WeKan had no such action on an existing card's
checklist section at all. A new "Copy Checklist From Template" button next
to "Add checklist" opens the same board/swimlane/list/card picker already
used by Move/Copy Checklist; picking a card (typically a template card, but
any card works) appends every one of ITS checklists - and their items - onto
the current card, after whatever checklists it already has. Existing
checklists are left untouched; nothing is overwritten.

The copy reuses `Checklists.copy()`, the same per-checklist helper
`Cards.copy()` and the existing "Copy Checklist" popup already use (fresh
ids, `.direct` inserts to skip the per-item activity-insert storm, correct
board re-homing), through a new `Checklists.copyAllFromCardToCard()` that
loops it over every checklist on the source card and places the copies
after the target's own. `copy()` gained an `options.resetChecked` flag so
copied items always arrive UNCHECKED regardless of the template's own
checked state - applying a template should never pre-check its target -
while every other caller (plain "Copy Checklist", card copy) keeps its
existing checked-state-preserving behaviour untouched.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/338e05b1ebf53e9ab3953541ef2f26a027f667aa">Dragging a checklist item onto a list creates a new card from its text</a>. Thanks to BenjamindeJong82 and xet7.</summary>

[#3294](https://github.com/wekan/wekan/issues/3294) asked for a checklist
item to become a card when dragged out onto a list, and to be marked done
when dropped onto a "Done"-style list instead. A checklist item was already
draggable through its own jQuery UI sortable (scoped to other checklists via
`connectWith: '.js-checklist-items'`), so dropping it anywhere else - a
list's own card column - always reverted with no effect at all.

The sortable's `stop` handler now checks, via `document.elementFromPoint` at
the drop coordinates, whether the release landed over a list's
`.js-minicards` card column rather than back inside a checklist. When it
does, a new card is created titled from the item's text, in that list (and
swimlane, resolved the same way `list.js`'s own card-drop handler resolves
it), through a pure `buildCardFromChecklistItem()` helper
(`models/lib/checklistItemToCard.js`) so what the new card looks like is
pinned by a test without a Meteor database. The original checklist item is
left completely untouched either way - the drag always reverts visually
(`sortable('cancel')`), since nothing needs to move within the checklist.

Scope decision: dropping ALWAYS creates a new card. The "mark done when
dropped on a Done-style list" half of the request is intentionally NOT
built - detecting that a list "means" Done would mean guessing from its
name or position, which is unreliable and would surprise users. That
capability is not actually missing: an item can already be marked done
directly via its own checkbox, and WeKan also already has a manual, explicit
"Convert to card" action for the same underlying card-creation case - this
drag gesture is a faster path to the same outcome, not a new concept.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73128dd7fc289406709c331ebed3c20180faf43d">A checklist can now automatically uncheck all its items on a daily, weekly or monthly schedule</a>. Thanks to travelg and xet7.</summary>

[#3818](https://github.com/wekan/wekan/issues/3818) asked for a Trello-like
daily checklist that resets itself, and
[#4729](https://github.com/wekan/wekan/issues/4729) asked for the same idea
on a longer, configurable schedule ("timed reset on boards") - both are the
same underlying feature, a checklist that periodically un-checks its own
items, so they are implemented together here.

`Checklists` gained an optional `resetInterval` (`'none'` by default, or
`'daily'`/`'weekly'`/`'monthly'`) and a `lastResetAt` timestamp, set from a
new "Automatic reset" entry on the checklist's own actions menu, next to
Move/Copy Checklist. Whether a checklist is due now is a pure, unit-tested
function (`models/lib/checklistResetSchedule.js`) that counts forward from
`lastResetAt` (or `createdAt`, before the first automatic reset) by the
chosen interval - monthly advances by a calendar month rather than a fixed
~30-day span, so a checklist reset on the 31st does not drift earlier every
few months.

The actual scan (`server/checklistResetSchedule.js`) reuses the
`quave:synced-cron` infrastructure `server/scheduledRules.js` already
registers its own job on, rather than adding a second scheduler: it runs
hourly, finds every checklist whose interval has come due, and unchecks
only that checklist's items with a single multi-update - not the per-item
`uncheck()` helper - so an automatic reset does not generate a per-item
activity for a change nobody made.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d43020212fbad1878d2ac646ec52850ffffe30f">Added "Check all items" / "Uncheck all items" to the checklist action menu</a>. Thanks to justinr1234 and xet7.</summary>

[#2473](https://github.com/wekan/wekan/issues/2473) asked for a bulk
check/uncheck action on a checklist, rather than clicking every item's own
checkbox by hand - #4218's "Edit as text" (above) only gave an indirect
workaround (select all, replace every `[ ]`/`[x]` marker, save).
`Checklists.checkAllItems()`/`uncheckAllItems()` already existed as model
helpers, used per-item by the Rules automation
(`server/rulesHelper.js`) but never exposed anywhere in the UI. Two new
entries on the checklist's own actions menu, next to "Automatic reset", now
call the same two helpers directly. The item-selection they share - which
items belong to THIS checklist, regardless of their current checked state -
is a pure function (`models/lib/checklistBulkCheck.js`) so "every item of
the checklist ends up checked/unchecked" and "another checklist's items are
left untouched" are both unit-tested without a database.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dbb7adb172f032554de0b3313b236a9aa7a82e8a">A checklist item can now be converted to a linked subtask, not just a plain card</a>. Thanks to javen9881 and xet7.</summary>

[#2422](https://github.com/wekan/wekan/issues/2422) asked for a checklist
item to become a subtask, with the link between them kept - distinct from
the pre-existing "Convert to card" action and the #3294 drag-to-card
gesture above, both of which only ever create a plain, standalone card with
no parentId and no reference back to the item.

A new "Convert to subtask" action, next to "Convert to card" on the item's
edit form, instead calls the same server-side `addSubtaskCard` method "Add
a new subtask" already uses, so the result is a real subtask of the current
card - the default subtasks board/list/swimlane and automatic custom fields
are resolved exactly the same way an ordinary subtask's are. The new
subtask's `_id` is then written to a new optional `linkedCardId` field on
the checklist item (`models/checklistItems.js`), and the item shows a small
"linked subtask" icon that opens the subtask on click.

Scope decision: this is a one-way, set-once reference recorded at
conversion time, not an ongoing bidirectional sync - checking the item does
not check the subtask, or vice versa. The original checklist item is never
deleted or mutated by this action, unlike a "replace item with card"
behaviour.

</details>

**Comments and activities** - a card's comment thread and its activity log.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/612be137639b3e0b44cb0c571356127378185517">Added a shareable permalink to each comment and activity</a>. Thanks to xet7.</summary>

[#4757](https://github.com/wekan/wekan/issues/4757) asked for a Trello-like
permalink: clicking a comment's or an activity's timestamp gives a
shareable link, and visiting that link loads the card and scrolls to and
highlights that specific comment or activity. The permalink is the card's
own URL (`models/lib/cardUrl.js`) plus a `#comment-<id>` or `#activity-<id>`
fragment - both comments and activities already carry a stable Mongo `_id`,
so no new id scheme was needed.

The timestamp is now a real `<a href>` to that URL, so a normal click
navigates there and right-click - copy link address works unmodified; a
small link icon beside it copies the same URL to the clipboard explicitly,
reusing the existing `copyTextToClipboard`/`showCopied` pattern already
used for card/list/swimlane links rather than a second implementation.
On the receiving end, the existing swimlane/list "reveal and scroll"
mechanism (`models/lib/revealBoardItem.js`, `client/lib/revealBoardItem.js`)
gained two more kinds, 'comment' and 'activity', fed from the URL hash
instead of a route param - a fresh load of a permalink, an in-page
`hashchange`, and the click handler itself all set the same Session value,
so the target briefly gets the same highlight outline a swimlane/list link
already produces.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab1f60d806524ee4b2f3432db9ea343df2ce281b">A comment's Reply link now caps threading at one level, grouped under its parent</a>. Thanks to FuXXz and xet7.</summary>

[#3011](https://github.com/wekan/wekan/issues/3011) asked for a comment to be
able to REPLY to another comment on the same card instead of every comment
landing in one flat chronological list. Comments already had an optional
`parentId` from an earlier MVP (#5907); what was missing was a cap on how
deep that nesting could go, and grouping replies under their parent in the
rendered list rather than leaving them interleaved by date.

Clicking Reply on a reply now attaches the new comment to that reply's own
parent - the original top-level comment - rather than nesting one level
deeper each time. `resolveParentId()` (`models/cardComments.js`) makes that
decision once, as a pure function with its own unit tests, and is applied
both when the client opens the composer (so the "In reply to ..." banner
already names the flattened target) and again in a
`CardComments.before.insert` hook on the server, so the one-level cap holds
regardless of how a comment is inserted.

Replies now render directly under their top-level parent instead of
interleaved by date with unrelated comments:
`groupCommentsByThread()` (`imports/lib/commentThreading.js`) reorders the
already-sorted flat list the `comments` template used before, with no
schema or query change. The composer's reply banner reuses the existing,
already fully translated `comment-in-reply-to` string plus the parent
comment's author name for its "Replying to ..." indicator, rather than
adding a new i18n key that would need translating across every locale file
for a small wording difference.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d4a47db2">A pasted link to another WeKan card now shows that card's title, not the raw URL</a>. Thanks to justinr1234 and xet7.</summary>

[#2453](https://github.com/wekan/wekan/issues/2453) asked for a card URL
pasted into a description or comment - copied straight from the address
bar, e.g. `.../b/<boardId>/<slug>/<cardId>` - to render with the target
card's title visible, rather than as a raw, unlabeled link.
`models/lib/cardUrlAutolink.js` is a pure parser/rewriter, mirroring the
`#3069` external-tracker autolinker's shape: it finds a WeKan card URL
(optionally carrying the `#comment-`/`#activity-` fragment `#4757`
added) in free text and, when it is not already inside a markdown/HTML
link, replaces it with `[title](url)` for a caller-supplied title
resolver - falling back to the bare URL when the resolver has nothing to
say.

The rendering pipeline (`packages/markdown/src/template-integration.js`)
runs it just before `markdown-it`'s own render, resolving titles through
`Markdown.resolveCardTitle`, a plain function
`client/components/main/editor.js` wires up at startup to
`ReactiveCache.getCard(cardId)`. That lookup is itself a reactive
dependency of the markdown helper's own render, so the link text updates
automatically if the target card is renamed afterwards. It resolves to
nothing - leaving the URL as plain text, not an error - for a card this
client's Minimongo does not have: deleted, or on a board the current
viewer cannot see, since Minimongo is already scoped to what the viewer
is subscribed to and needed no separate permission check here.

This is rendering only: a pasted plain URL is relabeled where it is
found. It does not add a new `[[card link]]` insertion syntax - that is
a different feature.

</details>

**Board filters** - the sidebar Filter panel and how a board can be opened already filtered.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/963b01ff5ba7edb9d0aacfbbce2b2647a578124d">A board can now be opened pre-filtered from its URL, e.g. ?assignee=johndoe</a>. Thanks to thrademaker and xet7.</summary>

[#4540](https://github.com/wekan/wekan/issues/4540) asked for a board's filter
state to be driven by URL query parameters, so a link - for instance one
embedded in an iframe in another tool - can open a board pre-filtered rather
than requiring the viewer to set the filter by hand every time.

`?assignee=johndoe`, `?member=janedoe` (both accept a comma-separated list of
usernames) and `?label=urgent` (by label name, case-insensitive) are read once
the board's subscription becomes ready
(`client/components/boards/boardBody.js`'s `applyQueryParamFilters`, guarded
to run once per board load) and applied through the existing sidebar `Filter`
object's own API - `Filter.assignees.add()`/`Filter.members.add()`/
`Filter.labelIds.add()` - the same calls the Filter sidebar UI itself makes,
so no new filtering engine was added. Usernames are resolved to member/assignee
ids and label names to label ids by a small pure module,
`client/lib/filterQueryParams.js`, covered by
`tests/filterQueryParams4540.test.cjs`. This only reads the query params once
on load; it deliberately does not sync the URL back as filters are changed
afterwards from the sidebar.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b13a5af330d0617d4cbd7b19c05eb4c97b90a62e">A label filter chip now cycles include -> exclude -> clear instead of only include -> clear</a>. Thanks to bennyandresen and xet7.</summary>

[#2886](https://github.com/wekan/wekan/issues/2886) asked for a third state on
the label filter: clicking an unfiltered label used to only ever filter FOR
it, and clicking it again cleared the filter, with no way to filter AGAINST
a label. `Filter.labelIds` now has a companion `Filter.excludedLabelIds` set
(the same `SetFilter` shape), and a new `Filter.toggleLabelFilter(labelId)`
cycles a click through not-filtered -> included -> excluded -> not-filtered
again. `Filter._getMongoSelector()` merges the exclusion into the existing
`labelIds` selector as `{$in, $nin}` rather than a selector key nothing
reads, so a card carrying an excluded label is filtered out even when it
also carries an included one - exclusion wins over inclusion - and a
filter with only an exclusion (no included label) still works on its own.

The sidebar's label chip shows a struck-through name plus a "no entry" icon
for the excluded state, alongside the existing checkmark used for the
included state. Scoped to labels only, matching the issue's exact wording -
members, due dates and the other filter chips keep their existing two-state
toggle for now; the same three-state cycle could be added to them later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02cc79928">Confirmed opening a card to edit it does not reset an active board filter</a>. Thanks to PhilSnider and xet7.</summary>

[#2335](https://github.com/wekan/wekan/issues/2335) reported that opening a
card while a board Filter is active resets the filter, forcing it to be
reapplied. Reading the current code: `Filter`
(`client/lib/filter.js`) is a plain module-level singleton, not keyed by
route or `Session`, and opening/closing a card
(`client/components/cards/cardDetails.js`) is a FlowRouter navigation that
never calls `Filter.reset()` or any other filter-clearing method - it only
calls `Filter.addException()`, to keep an affected card visible despite the
active filter. The only three `Filter.reset()` call sites anywhere in the
client are explicit user actions unrelated to card open: the "clear filter"
button, the sidebar "clear all" button, and the `x` hotkey.

So the filter does not reset today. What can look like a reset is a
different, correct behavior: the filtered card list is reactive, so editing
the open card can change a field the active filter matches on (for example
removing the very label being filtered on), and the card legitimately drops
out of the filtered view - that is the filter working as designed, not a
bug resetting it.

`tests/filterPersistsOnCardOpen2335.test.cjs` pins this: no card-open/close
code path calls `Filter.reset()`/clear, and every `Filter.reset()` call
site in `client/` and `imports/` remains one of the three known, explicit
actions - so a future change that adds a fourth, especially one reachable
from card open/close, fails this test.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/REPLACE_HASH">A card can now be filtered by who created it</a>. Thanks to lukasz-krawczyk and xet7.</summary>

[#3681](https://github.com/wekan/wekan/issues/3681) asked to see who created
a card without relying on system messages, and its title was later broadened
to "Filter by Creator". `Filter.userId` (`client/lib/filter.js`) is a new
`SetFilter`, the exact same shape/API `Filter.members`/`Filter.assignees`
already use, keyed to match `models/cards.js`'s own name for the card-author
field (`userId` - "should probably be called `authorId`", per its own
long-standing comment) rather than inventing a `creatorId` alias, so
`Filter._getMongoSelector()` needed no special-casing. A new "Filter by
creator" section in the sidebar (`sidebarFilters.jade`/`.js`) lists the
board's active members exactly like the existing Member/Assignee sections
and toggles `Filter.userId` the same way. `tests/creatorFilter3681.test.cjs`
drives the real `Filter` object end to end, through the mongo selector it
produces.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/REPLACE_HASH">A filter now survives moving from one board to another, instead of being cleared on every hop</a>. Thanks to jarohen-oc and xet7.</summary>

[#1751](https://github.com/wekan/wekan/issues/1751) asked for filters to stay
active across boards - the reporter's own use case is "only show my user's
cards", i.e. a member/assignee/creator filter by user id, which means the
same thing on every board since user ids are global. `config/router.js`'s
board route used to call `Filter.reset()` (clearing everything) whenever the
target board differed from the current one. It now calls a new
`Filter.resetBoardScoped()` (`client/lib/filter.js`) instead, which only
clears the filters whose values are scoped to the board being left - labels,
excluded labels, custom fields, dependency types and the advanced/list text
filters, all ids or text that mean nothing, or the wrong thing, on a
different board - and leaves member/assignee/creator/due-date/title filters
in place. The sidebar's own "Clear filters" button and every other route
(All Boards, Archive, Public, …) still call the original `reset()`
unchanged. `tests/filterPersistsAcrossBoards1751.test.cjs` pins both halves
plus the router wiring itself.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/REPLACE_HASH">Confirmed two more open filter requests were already implemented, and pinned them with regression tests</a>. Thanks to Sh0g0-1758 and blaisep and xet7.</summary>

Checking the remaining open `Feature:Filters`-labeled issues against the
current source (per the "fix open issues" process) found two already done,
neither part of today's earlier filter work:
[#567](https://github.com/wekan/wekan/issues/567) ("Hide empty lists when
filtering items in a board") is `Filter.hideEmpty`, wired end to end
(`sidebarFilters.jade`/`.js`, consumed by
`client/components/swimlanes/swimlanes.js`); and
[#2035](https://github.com/wekan/wekan/issues/2035) ("extended Filter
feature that will list up archived cards and cards in archived lists") is
`Filter.archive`, whose sidebar toggle re-subscribes to the board with the
archived flag set rather than only filtering client-side. Neither had a
regression test pinning that the wiring stays intact;
`tests/filterAlreadyFixedIssues.test.cjs` now reads the actual source for
both and fails if either toggle, handler or consumer disappears.

</details>

**Board views** - the Board View menu and its pages.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8dad0d0506f89e3c54ee98099c182bdec71acc5d">Added a "Group by Assignee" board view for team-meeting-friendly overviews</a>. Thanks to xet7.</summary>

[#4688](https://github.com/wekan/wekan/issues/4688) asked for cards grouped
by assignee, clustered under each assignee's name as a heading, for a
read-only overview well suited to a team stand-up.

A card with several assignees appears under each; a card with none falls
into "No assignee". The grouping reuses the same
`NO_ASSIGNEE_GROUP`/`translateGroupLabel` fold the Dashboard and Time
views already use (`models/lib/chartCalculations.js`), generalized into
`computeCardsByAssigneeGroup`, which returns the grouped cards themselves
rather than a count/hours total. Wired end to end like every other board
view: a "Group by Assignee" Board View menu entry, an
`isViewGroupByAssignee()` helper/`boardBody.jade` branch, the
`client/lib/utils.js` whitelist, the `profile.boardView` schema and a
tooltip-name-map entry. Each card row is a simple title + due date +
overtime marker, deliberately not a minicard re-render, so the view stays
lightweight for a board with many cards; clicking a card navigates to it
like any other view, and there is no drag-and-drop or export - this is
scoped as a read-only overview, not a second way to work the board.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5323fdbce67e2cdfe19a00f2d776c283d45bc2d9">Added a "Bigboard" board view showing every board at once</a>. Thanks to Jieiku and xet7.</summary>

[#4223](https://github.com/wekan/wekan/issues/4223) asked for
[Kanboard](https://kanboard.org/)'s BigBoard plugin
(`kanboard_plugin_bigboard`): every board the user belongs to, stacked on
one scrollable page, each drawn as its own mini kanban board - no manual
setup, automatic from board membership.

Added right after Dashboard in the Board View menu, wired the same way as
every other view (menu entry, `isViewBigboard()` helper/`boardBody.jade`
branch, the `client/lib/utils.js` whitelists, the `profile.boardView`
schema and a tooltip-name-map entry). Unlike the other 19 views, which all
draw the single currently open board, Bigboard queries every board the
current user is a member of with the same selector the All Boards page
uses, subscribes each one's lists/swimlanes/cards through the existing
`board` composite publication, and renders each as its own section
reusing the existing `listsGroup`/`list`/card templates - so editing,
dragging and opening a card behave exactly as on a normal board page,
with no new rendering or drag-and-drop code of its own.

Stacking several boards' lists on one page exposed a bug the single-board
case could never trigger: list drag-and-drop connects through a plain
`'.js-swimlane, .js-lists'` jQuery UI sortable selector, which would let a
list be dragged out of one board's section into another's now that more
than one board's lists share a page. Added a `data-board-id` attribute to
the swimlane/`listsGroup` root elements and a `connectWithSelector()`
helper (`client/components/swimlanes/swimlanes.js`) that scopes the
connect selector to the dragged list's own board id when one is present;
an ordinary single-board view still has exactly one board id on the page,
so its drag-and-drop is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac7822aa26f4a78f6c056803039847c1516a7ef4">A card can now be dragged from one board's list into a different board's list in the Bigboard view</a>. Thanks to Science4583 and xet7.</summary>

[#3298](https://github.com/wekan/wekan/issues/3298) asked to view several
boards at once with drag-and-drop between them; Bigboard already covers
"several boards at once", and list-level dragging was deliberately kept
scoped to within one board when it was added, so the one part still
missing was dragging a CARD across the boundary between two boards' lists.

The card sortable's `connectWith: '.js-minicards:not(.js-list-full)'`
selector in `client/components/lists/list.js` already connects across
every board shown on the page - only the LIST sortable was scoped by
board (`connectWithSelector()`, above). What stopped a cross-board card
drop from landing correctly was the drop handler resolving the
destination board from `Utils.getCurrentBoard()` - the board the page
happens to be routed to - instead of from the list actually dropped into.
On an ordinary single-board page those are the same board, so this never
showed; in Bigboard they can differ, and the card silently moved onto the
wrong board.

The destination boardId is now read from the dropped-into list's own
`boardId` (`listData.boardId`), exactly as the analogous list-to-swimlane
move in `swimlanes.js` already does with `list.boardId`, and passed to
every `card.move()` call the stop handler makes. `Card.move()` already
fully supported a boardId change (label/member/custom-field remapping,
cross-board dependency cleanup) and the server's `denyCrossBoardMove`
already authorizes only when the caller can write to the destination
board, so no model or permission change was needed - the fix is entirely
in which board the client asked to move the card to.
`tests/listCardCrossBoardMove.test.cjs` pins the destination-board and
default-swimlane resolution and negatively asserts `card.move()` is never
called with the route's `currentBoard._id` directly.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c15b56f6e3db5b52e43ceaf238dfac30ab7fb6d">Added a "Multi Board Calendar" board view showing every board's dates on one calendar</a>. Thanks to justinr1234 and xet7.</summary>

[#2469](https://github.com/wekan/wekan/issues/2469) referenced
[Planyway](https://planyway.com/)'s multi-board calendar overlay for
Trello: a calendar showing due/start/end/received dates for cards across
every board the user belongs to, not just the currently open board - the
same "aggregate across all my boards" idea #4223's Bigboard added above,
rendered as a calendar instead of a stack of mini kanban boards.

Added right after Calendar in the Board View menu, wired the same way as
every other view (menu entry, `isViewMultiboardCalendar()` helper/
`boardBody.jade` branch, the `client/lib/utils.js` whitelists, the
`profile.boardView` schema and a tooltip-name-map entry). It is a
composition of two already-built pieces rather than a new calendar
implementation: the single-board Calendar view's own FullCalendar
rendering (`+fullcalendar`, `calendarView.css`) is reused as-is, fed by
Bigboard's exact all-boards membership query
(`multiboardCalendarView.js`'s `multiboardCalendarQuery()`, copied from
`bigboardView.js`'s `bigboardQuery()`) instead of the single current
board, subscribing each visible board's `board` composite the same way
Bigboard does. Every event is prefixed with its board's title (`[Board
title] Card title`) so entries from different boards stay distinguishable
on the merged calendar, and clicking an event still navigates to that
card on its own board, exactly like the single-board Calendar view.

Cross-board drag-to-reschedule is deliberately out of scope for this
pass - a dragged event's card is not necessarily on the currently open
board, and moving its date needs more care than the single-board
Calendar's `eventDrop`/`eventResize`/`select` handlers give it, so this
view is read-only (`editable: false`, `selectable: false`) and the
single-board Calendar view's own drag-to-reschedule is untouched.
`tests/boardViewMenu.test.cjs` pins the menu entry, icon, click handler,
helper/template branch, schema value, tooltip and template/stylesheet
registration the same way it already does for Bigboard.

</details>

**All Boards** - the overview and its Clone Board action.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4876eca3bf1db91d45970b1b4e888b6e16083ab">Clone Board can now skip copying cards</a>. Thanks to e-gaulue and xet7.</summary>

[#4726](https://github.com/wekan/wekan/issues/4726) asked for a way to
clone a board as a structural template - swimlanes, lists, labels, custom
fields and settings - without also duplicating every card onto the copy.

The Clone Board action (the per-board "Clone" tile, previously a plain
`confirm()` dialog) now opens a small popup with a "Without cards"
checkbox. Checking it sends a `withoutCards` flag through the `copyBoard`
Meteor method into `Boards.helpers().copy()` and
`Swimlanes.helpers().copy()`, which skip only the one loop that actually
creates card copies; everything else in the copy chain (swimlanes, lists,
labels, custom field definitions, rules/actions/triggers, integrations)
already becomes a no-op with zero cards and needed no change. Leaving the
checkbox unchecked reproduces today's clone exactly.
`tests/cloneBoardWithoutCards.test.cjs` pins the flag's default, the
single gated card-copy call site (and that no second, unguarded one
exists), the method's handling of the flag, and the client popup/checkbox
wiring - plus that the new `clone-board-without-cards` translation key
exists in English and every locale.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5fbbbeca9237ee19a3e94ddf65de30ce45c05fab">A board template can now be marked as the default, applied automatically when creating a board</a>. Thanks to Jieiku and xet7.</summary>

[#4205](https://github.com/wekan/wekan/issues/4205) asked for a way to
"just type a name for my new board and click create" instead of having to
reopen the "Template" picker (the `/` link on the Create Board form) and
pick a template by hand every time.

Each row of that picker (a "Board Templates" card, shown via
`Template.searchElementPopup`) now has a star icon beside it. Clicking the
star marks/unmarks that template as the user's default
(`profile.defaultBoardTemplateId`/`-BoardId`, both unset by default, so
nothing changes for anyone who never sets one) without also applying the
template - the rest of the row still does that, unchanged. Marking a
default goes through a new `toggleDefaultBoardTemplate` method that only
accepts a live, unarchived linked-board card from the caller's own
templates board.

Creating a board with the plain "type a name and click Create" flow now
checks for a default and, when set, applies it by calling the exact same
`copyBoard` method the manual picker already uses - not a second,
hand-written copy of the board-copying logic - before falling back to the
original blank-board path. Deleting the underlying template board clears it
as anyone's default, so board creation cannot fail against a dead board id.
`tests/defaultBoardTemplate.test.cjs` pins the schema, the toggle method's
validation and its cleanup on template deletion, that board creation reuses
the one `copyBoard` call site instead of a second one, and that an unset
default leaves board creation unchanged.

</details>

**The Admin Panel** - People, the account list under Login → People.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0297f52c4ba4beb47a60fb2c4d5798696c8c9af1">People can now be filtered by Team</a>. Thanks to hesco and xet7.</summary>

[#4510](https://github.com/wekan/wekan/issues/4510): an admin whose
instance had grown to 19 users across 6 teams had only the existing Show
filter (All/Locked/Active/Inactive/Admin) and the free-text search box to
narrow the People list - neither could show just one team's members.

A user's team membership already lives in their own `teams` array
(`models/users.js`, each entry `{ teamId, teamDisplayName }`), the same
field the Team membership popups already read and write. The People
pane's shared controls row gets a second dropdown, Team, next to Show,
built from every team (`ReactiveCache.getTeams({})`, not just the current
page of the paginated Teams table) and matched against `teams.teamId` the
same way Show already narrows the query. Both dropdowns share the
`.js-table-page-filter` class the shared table page already renders one
of per filter; a `data-filter` attribute distinguishes which one changed.
`tests/peopleTeamFilter.test.cjs` pins the new ReactiveVar, the query
predicate, the second filter entry and its options source, the
data-filter routing in the change handler, and that every locale has a
real (non-English) translation of the two new labels.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/520b2e412ecba03c44a0a7ffcf8da5264a65aa77">People now shows each account's last-active time and an online-now badge</a>. Thanks to eccaw and xet7.</summary>

[#3678](https://github.com/wekan/wekan/issues/3678) asked for a way to see
- and log out - inactive accounts; [#3734](https://github.com/wekan/wekan/issues/3734)
asked for the same thing from the other side, an API or log of active users
and how long they have been active. Both come down to the same missing
fact: WeKan had a `lastConnectionDate` field on the user schema already,
but the only code that ever wrote it was a commented-out, env-gated block
in `server/publications/users.js`, so no account's last-active time was
ever actually recorded.

`server/lastActiveOnLogin.js` now stamps `lastConnectionDate` on every
successful login via `Accounts.onLogin`, the same fire-and-forget pattern
`loginTallyOnLogin.js` and `avatarLocalizationOnLogin.js` already use so a
failure in one cannot affect the others. An open client session refreshes
it every two minutes through a new `usersHeartbeat` Meteor method
(`server/methods/lastActiveHeartbeat.js`, called from
`client/lastActiveHeartbeat.js`), which only ever updates the caller's own
`this.userId` - a periodic timestamp, not a websocket/real-time presence
system, which both issues' actual questions ("who is active, and for how
long") did not need.

People's table gets a "Last active" column showing that timestamp, with a
green online-now badge when it falls within five minutes
(`models/lib/lastActive.js`'s `isRecentlyActive`, pure arithmetic so it is
unit-testable without a server). `tests/lastActive.test.cjs` pins the
recency threshold at its boundary, a future timestamp (clock skew) never
reading as online, the login hook's shape, and that the heartbeat method
can only ever touch its own caller's document. The two new labels are
translated into 203 locales; the remainder keep the English source as the
explicit untranslated-everywhere placeholder.

WeKan already has a per-address login lockout
(`packages/wekan-accounts-lockout`, Admin Panel → Locked users) for the
enforcement half of #3678 ("how do I stop a stuck session"); this change
is deliberately visibility only and does not add a new logout-inactive-
users mechanism on top of it.

</details>

**Admin Panel / Settings / Visibility** - the instance-wide toggles under this pane.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52972b3e4cacdc451e5840709f505e98db285913">Board creation can now be restricted to admins only</a>. Thanks to belf88 and xet7.</summary>

[#4475](https://github.com/wekan/wekan/issues/4475): there was no way for an
admin to stop other user accounts from creating new boards - every signed-in
user could always make one, no matter what the instance's policy was meant
to be.

A new checkbox, "Only admins can create boards"
(`tableVisibilityMode-boardCreationAdminOnly`), sits beside the existing
"Public boards" toggle in Admin Panel → Settings → Visibility, following
the exact same `TableVisibilityModeSettings` pattern: a collection document
seeded off by default in `server/models/collectionBootstrap.js`, a jade
checkbox and reactive helper in `settingBody.jade`/`settingBody.js`, and a
write in that section's own Save handler. The enforcement is server-side,
in `createBoardWithInitialSwimlanes` (`server/models/boards.js`): the
method now rejects the call with `not-authorized` when the setting is on
and the caller is not `isAdmin === true`, before the board is inserted -
not only when the client UI happens to hide the button. A shared
`client/lib/boardCreationAllowed.js` helper hides the top-bar "+" and the
All Boards "Add board" tile for a restricted user as a convenience, but
nothing security-relevant depends on the client agreeing.

A full per-user allow/deny override was intentionally left out of this
pass - it would need its own schema field and a People/Admin Panel UI to
flip it per account, which is a larger change than this issue's core
request to forbid board creation instance-wide. The global toggle covers
that request on its own.

`tests/boardCreationAdminOnly.test.cjs` pins the default-off setting, the
checkbox/handler wiring, that the server-side admin check runs before the
insert, the shared client helper backing every entry point, the new
`board-creation-admin-only` translation key sitting right after its
sibling in every locale file, and - as a negative test - that no other
`Boards.insertAsync` call site exists outside the two already-known and
deliberately ungated ones (the per-user Templates container and
`createBoardFromCard`).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5323fdbce67e2cdfe19a00f2d776c283d45bc2d9">An admin can now customize the Private/Public board description text</a>. Thanks to Meeques and xet7.</summary>

[#4421](https://github.com/wekan/wekan/issues/4421): the text shown under
Private/Public in the board visibility popup and the create-board popup was
hardcoded to the `private-desc`/`public-desc` i18n strings, which assume
"Public" means public on the internet. An org that uses "Public" to mean
"public within our organization" had no way to say so - the reporter's own
words were "public does not mean that boards can be found on google".

Two free-text fields, "Custom private description" and "Custom public
description", were added to Admin Panel → Settings → Visibility (All
Boards group), stored as `Settings.customPrivateBoardDesc` /
`customPublicBoardDesc` (both default to `""`). `boardVisibilityList`'s
`privateDesc`/`publicDesc` helpers (`client/components/boards/boardHeader.js`)
now render the admin's text when it is set, falling back to the existing
i18n text unchanged when it is empty - so any instance that has not touched
the new setting sees byte-identical behavior to before. The fallback logic
itself is a small pure function, `imports/i18n/lib/visibilityDesc.js`, kept
free of any Meteor/Blaze import so it is unit-testable on its own.

`tests/visibilityDesc.test.cjs` pins the fallback (unset, empty and
whitespace-only custom text all fall back to the i18n default; a real
custom value is used verbatim and trimmed) and that an admin who never
touches the setting gets the exact pre-existing text.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/521cb4e332db486682588e77f226b89efa698a49">Card text can now autolink bare "#1234"-style tokens to an external issue tracker</a>. Thanks to grandinj and xet7.</summary>

[#3069](https://github.com/wekan/wekan/issues/3069): a bare `#1234`-style
reference typed into a card description or comment stayed plain text, so an
instance whose team tracks issues in Jira, GitHub or Bugzilla elsewhere had
no way to jump straight there, the way the Mattermost autolink plugin does.

A new "External Issue Tracker Autolink" group under Admin Panel → Settings →
Visibility takes a token prefix (commonly `#`) and a URL template containing
the literal `{number}` (e.g. `https://issues.example.com/browse/PROJ-{number}`).
When both are set, every matching bare token found in card text is rendered
as a link to that URL, with the digits substituted in. Leaving either field
empty keeps the feature off, which is also the default.

WeKan does not autolink bare `#NNNN` to its own cards anywhere - confirmed by
reading the whole markdown pipeline and every client template before adding
this - so there was nothing internal to collide with. The feature stays safe
regardless of that: it is opt-in, and it never rewrites a token that already
sits inside an existing markdown link target or an `href="..."` attribute, so
a future internal card-number link could not be double-linked by this either.

The matching/URL-building logic lives once, as a pure function,
`models/lib/externalLinkAutolink.js`. The markdown renderer
(`packages/markdown/src/template-integration.js`) cannot import app code, so
it carries a small mirror of the same algorithm, fed the two configured
strings through a `ReactiveVar` bridge the same way the existing "always show
code as plain text" setting already is, kept in sync by
`client/components/main/editor.js`. `server/publications/settings.js`
publishes the two new fields, without which the admin form would always
render empty and "Save" would look like it did nothing.

`tests/externalLinkAutolink.test.cjs` covers the pure function directly
(matching, URL building, the no-op-when-unconfigured guard, the
already-linked collision guard), the settings/publication/bridge wiring, and
- by source inspection - that no internal `#NNNN`-to-card autolinker exists
anywhere in the tree, which is the precondition the whole design leans on.

</details>

**Card detail actions** - the hamburger menu opened from an open card.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17c6d8d9b90e0fcef66177d94c18b15bec62adbf">A card can now create and link to a brand-new board in one step</a>. Thanks to Xilef11 and xet7.</summary>

[#4495](https://github.com/wekan/wekan/issues/4495): linking a card to a
board already worked, but only in two steps - create the board first, then
come back and use the existing "Link to board" action
(`client/components/lists/listBody.js`'s `Template.linkCardPopup`, opened
from a list's add-card composer) to find it.

A new, separate action sits beside it in the card's own hamburger menu,
"Create board from this card". It prompts for the new board's title
(defaulting to the card's own title), creates the board the same way
board creation normally does (an admin member, a default swimlane), and
then sets on the SAME card exactly the two fields the existing "link to a
whole board" flow sets - `type: 'cardType-linkedBoard'` and
`linkedId: <the new board>` - so opening the card now opens the sub-board,
without ever leaving the card. The new server method,
`createBoardFromCard` (`server/models/cards.js`), refuses to convert a
card that is already a link or a template, and checks write access on the
card's own board before creating anything.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b1a90239b5b2b10f1184a251888190ac89d2484">A "Link to board" action lets a card be mirrored onto a different, existing board in one click</a>. Thanks to HT-Marley and xet7.</summary>

[#4281](https://github.com/wekan/wekan/issues/4281): a user working across
several project boards plus a personal overview board wanted a card to
also appear, linked rather than copied or moved, on another board -
without switching boards and re-adding it by hand. This is distinct from
[#4495](https://github.com/wekan/wekan/issues/4495) above (which links a
card to a BRAND-NEW board created on the spot): here the target board
already exists and is picked from a list.

The linked-card data model already existed
(`Cards.helpers().link(boardId, swimlaneId, listId)`, `models/cards.js`,
setting `type: 'cardType-linkedCard'` and `linkedId` on a copy of the
card), and so did the board/swimlane/list chooser Move card and Copy card
already use (`cardDestinationPicker`). Neither was reachable from the
card's own hamburger menu for this purpose. A new "Link to board" entry
sits next to "Move card"/"Copy card", opening a `linkCardToBoardPopup`
that reuses the same picker and, on Done, calls the existing `card.link()`
- creating the mirror on the chosen board without moving, copying or
otherwise mutating the original card.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/79dfd596f190c88eea1225259dba13846f266068">Move card can now leave a linked card behind at the card's original spot</a>. Thanks to superlou and xet7.</summary>

[#2719](https://github.com/wekan/wekan/issues/2719): a personal task board
whose tasks get moved onto project boards for team visibility lost the
personal-board trail once a card moved away - there was no way to still
track it from where it used to be. Move card's dialog
(`client/components/cards/cardDetails.jade`'s `moveCardPopup`) gains an
opt-in checkbox, "Leave a link at the original location", next to the
existing board/swimlane/list picker. Unchecked - the default - a move
behaves exactly as before.

Checked, `moveCardPopup`'s `setDone` (`client/components/cards/cardDetails.js`)
captures the card's board/swimlane/list before calling the existing
`card.move()`, then, once the move has completed, calls the existing
`card.link()` - the same [#4281](https://github.com/wekan/wekan/issues/4281)
linked-card mirror mechanism above - with those captured values, leaving a
`cardType-linkedCard` mirror pointing at the (now moved) card at the
original spot. No new linking mechanism was added; Move and Link are
simply chained.

</details>

**Custom fields** - the board's custom-field definitions and how they display.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c6901f3a9eda2efd7e53c85d262add49fb53135">A board's custom fields can now be reordered by drag-and-drop, instead of always sorting alphabetically</a>. Thanks to huma2000 and xet7.</summary>

[#4165](https://github.com/wekan/wekan/issues/4165): custom fields always
rendered alphabetically by name, both in the Board Settings sidebar list and
on a card, with no way to change it - users worked around it by prefixing
names with numbers.

Added an optional numeric `sort` to the CustomFields schema
(`models/customFields.js`); a field created before it existed has none and
keeps sorting by name as a fallback. The Board Settings sidebar list
(`client/components/sidebar/sidebarCustomFields.jade`/`.js`) gets a drag
handle and a jQuery-ui sortable, mirroring the card-labels popup's own
reordering (`client/components/cards/labels.js`) rather than Lists'
fractional-index drag, which is built for a long, frequently-reordered
column of cards. Dropping recomputes sequential `sort` values with
`computeSortIndexMapping()`, the same pure helper the All Boards page
already uses for its own drag-reorder (`models/lib/boardSortReorder.js`), so
no new reordering logic was added. A newly created field defaults to the end
of the board's current list rather than jumping to the top.
`models/lib/customFieldsWD.js` - the shared matcher both the card detail
view and the card's custom-fields popup get their order from - now sorts by
`sort` ascending instead of by name.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5700f5c395f1f30ec69042562ac427aadc1d10e">A new "Dropdown (multi-select)" custom field type lets a card pick several options, not just one</a>. Thanks to huma2000 and xet7.</summary>

[#4166](https://github.com/wekan/wekan/issues/4166): the existing "Dropdown"
custom field type only ever let a card store ONE chosen option from its
list. Added a second type, `dropdownMultiSelect`
(`models/customFields.js`), that reuses the exact same
`settings.dropdownItems` option-list definition mechanism and Board
Settings editing UI the single-select dropdown already has
(`client/components/sidebar/sidebarCustomFields.js`/`.jade`) - an admin
defines the available options once, the same way, for either type; only
the type picker and a shared "is this a dropdown-like type" check needed
touching.

On a card, the new type stores an ARRAY of selected item ids instead of a
scalar, and renders as a checkbox list rather than a `<select multiple>`
(`client/components/cards/cardCustomFields.js`/`.jade`), matching the
toggle-checkbox interaction already used elsewhere in the app.
`models/lib/customFieldsWD.js`'s `resolveTrueValue()` now resolves a
multi-select's array of ids to the matching item NAMES, comma-joined, so
every existing reader of a dropdown's `trueValue` - the minicard badge,
board filters - shows the new type correctly without further changes. The
CSV, PDF and Excel exporters, and `csvCreator`'s CSV header/definition
parsing, resolve the array of ids the same way the single-select dropdown
already resolves its one id, joining the resolved names for display.

The single-select dropdown's own behavior, storage shape and rendering are
unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4de77a4a5b377ffa8ce8111a9d85c9bdc7cf78c0">The list header's numeric custom-field sum badge is now scoped to the swimlane row it is drawn in</a>. Thanks to ccollins0601 and xet7.</summary>

[#3319](https://github.com/wekan/wekan/issues/3319) asked for a numeric
custom field (e.g. "story points") to be totalled per list and/or per
swimlane, for velocity tracking alongside the existing WIP-limit card count.
That was already possible: a numeric custom field's Board Settings sidebar
panel has a "show sum at top of list" toggle
(`models/customFields.js`'s `showSumAtTopOfList`), and when set, the list
header already drew a "∑ n" badge next to the card-count badge
(`client/components/lists/listHeader.jade`'s `numberFieldsSum`/
`hasNumberFieldsSum` helpers). Two gaps remained:

- the sum was always computed over the WHOLE list, even though a board-wide
  list renders once per swimlane row in Swimlanes view (the same list
  document, one row per swimlane) - so a shared list's badge reported the
  entire list's total under every swimlane row instead of that row's own
  cards, unlike the adjacent card-count badge, which is already scoped to
  the rendered row via `cardsCount(containerSwimlaneId)`.
  `numberFieldsSum` now takes the same `containerSwimlaneId` argument,
  passed from the template exactly like `cardsCount` already is, and adds it
  to the `Cards` selector the same way.
- the referenced `sum-of-number-fields` i18n key (the badge's tooltip) had
  never actually been added to `en.i18n.json` or any other locale file,
  so the tooltip silently fell back to showing the raw key. Added it to
  `en.i18n.json` and filled a real translation into the other 245 locale
  files.

The sum arithmetic itself (walk a list of cards, skip a card missing the
field or holding a null/non-numeric value, parse a numeric-looking string)
is pulled out of the Blaze helper into a small Meteor-free pure function,
`sumCustomFieldValues()` in the new `models/lib/customFieldsSum.js`, with
`tests/customFieldsSum.test.cjs` covering a plain sum, several flagged
fields summed together, numeric strings, missing/null values, non-numeric
strings, and an empty card list.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/453b309c76c1c6d34d7d48e4d48c47f18d40f0a7">The list header's custom-field summary badge now also shows min/max and a date-field range</a>. Thanks to rlach and xet7.</summary>

[#2075](https://github.com/wekan/wekan/issues/2075) asked for a broader
list-level custom-field summary than the sum #3319 above already added: a
count of cards that have the field set at all, min/max for a number field,
and a range for a date field. This extends that SAME mechanism - the same
per-field "show sum at top of list" checkbox, the same badge next to the
card count - instead of adding a second field-selection setting or a second
badge location.

`models/lib/customFieldsSum.js` gains two more pure functions alongside the
existing `sumCustomFieldValues()`, which is untouched: `numberFieldStats()`
(sum/min/max and how many of the cards have ANY of the flagged number
field(s) set, out of the total, reusing the exact same numeric-parsing
rules as the sum) and `dateFieldRange()` (earliest/latest value among the
cards for a flagged date-type field, plus the same count/total). A
date-custom-field value is read as a `Date`, an ISO string or a millisecond
timestamp; an unparseable value is skipped rather than corrupting the
range, the same policy the sum already applies to a non-numeric value.

`client/components/lists/listHeader.js` factors the "which flagged fields
of this type, which of the list's (swimlane-scoped) cards" lookup that
`numberFieldsSum`/`hasNumberFieldsSum` already did into two small shared
functions, then adds `numberFieldsSumTooltip()` (the existing "∑ N" badge's
tooltip now reads "…(min–max, N/total)" when there is a range to show) and
`hasDateFieldsRange()`/`dateFieldsRangeLabel()`/`dateFieldsRangeTooltip()`
for a date-type field flagged the same way, rendered as an earliest–latest
badge instead of a sum - summing dates has no meaning. The min/max/count
detail is deliberately wordless (`(5–20, 3/8)`) so it needs no new
translatable label and stays a hover-level detail rather than a third
always-visible number cluttering the list header; only the date-range
badge itself needed one new i18n key, `date-range-of-fields`, mirroring
the existing `sum-of-number-fields` tooltip label. Added to `en.i18n.json`
and to all 245 other locale files.

`tests/customFieldsSum.test.cjs` adds a regression test proving
`sumCustomFieldValues()`'s own result is unaffected by any of this, plus
coverage for `numberFieldStats()` (min/max, several flagged fields
combined, the card-count-with-a-value figure, a non-numeric value ignored,
an empty card list) and `dateFieldRange()` (earliest/latest, `Date` and
ISO-string values, the count figure, an unparseable value ignored rather
than corrupting the range, and an empty card list).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df96ee03ca4a54722e5cc4d92c897b5d3425563e">A checkbox custom field's minicard value is now a tick/cross icon, not a bare square</a>. Thanks to CarloRampini and xet7.</summary>

[#3142](https://github.com/wekan/wekan/issues/3142) asked to "display
read-only values like true/false and yes/no with icons" on the minicard
instead of text, specifically for a boolean/checkbox custom field. The
minicard already rendered a bare `.materialCheckBox` square for this type
rather than plain text, but it carried no true/false distinction at a
glance and did not match the other minicard badge icons, which are Font
Awesome glyphs.

`client/components/cards/minicard.jade`'s `checkbox`-type branch (both the
labelled and the no-label full-width layout) now renders `fa-check-circle`
when the field's value is true and `fa-times-circle` when it is false,
colored green/red in `client/components/cards/minicard.css`, with a title
tooltip using the existing `yes`/`no` i18n keys - no new translation keys
were needed. Every other custom field type (text, number, currency, date,
dropdown, multi-select, stringtemplate) and the full card-detail checkbox
editor (`client/components/cards/cardCustomFields.jade`, still a real
checkbox input) are unchanged.
`tests/minicardCustomFieldCheckboxIcon.test.cjs` pins the icon markup, that
the old bare-square/plain-text rendering is gone for `checkbox`
specifically, that the other types keep their own rendering, and that the
card-detail editor is untouched.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76dcb6575aebd8f597ceb56b6bcc3edc02237251">An "Admin only" custom field definition hides its value from non-admin board members entirely</a>. Thanks to CarloRampini and xet7.</summary>

[#3141](https://github.com/wekan/wekan/issues/3141) asked for a custom field
usable for technical/integration metadata (API keys, script data) that only
a board admin can see or edit - invisible to an ordinary board member, not
just hidden behind a permission a client could still read.

Added `adminOnly` (boolean, default `false`) to the CustomFields schema
(`models/customFields.js`), toggled from a new checkbox in the custom-field
definition editor (`client/components/sidebar/sidebarCustomFields.js`/
`.jade`) that only renders for a board admin. `models/lib/customFieldsWD.js`
gets a small pure `filterAdminOnlyDefinitions()` helper, and
`models/cards.js`'s `customFieldsWD()` - the one shared helper both the card
detail view and the minicard render their custom fields from - calls it
before matching a value to its definition, so a non-admin's rendered result
never contains the field at all, on either surface. The card's own "assign a
custom field" popup list (`client/components/cards/cardCustomFields.js`)
reuses the same helper so the field's name does not leak there either.

The gate is enforced server-side, not just hidden in the UI: the
`CustomFields.allow` insert/update rules
(`server/permissions/customFields.js`) require `board.hasAdmin(userId)`
specifically to set or create with `adminOnly`, on top of the write-access
check every other field edit already requires, so a non-admin write-access
board member cannot grant themselves the flag. Setting the VALUE is checked
in three places: a new `Cards.deny` rule
(`server/permissions/cards.js`) rejects a direct client write of
`customFields.<index>.value` on an admin-only field (the path text/number/
dropdown/stringtemplate fields use), and the dedicated
`setCardCustomFieldCheckbox`/`setCardCustomFieldCurrency` Meteor methods
(`server/models/cards.js`) check it themselves, since a method body running
on the server bypasses `allow`/`deny` entirely.

`tests/adminOnlyCustomField3141.test.cjs` covers the schema default, that a
non-admin's `filterAdminOnlyDefinitions()`/`customFieldsWD()` result never
contains the admin-only field's id or value while a board admin's does, that
a field predating this change (no `adminOnly` key) is never hidden, and that
every server-side gate (the two `allow` rules, the `deny` rule, and both
value-setting methods) is present and checks `board.hasAdmin()`.

</details>

**Minicard and card detail dates** - the received/start/due/end date badges
shown on the minicard and in an open card.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb761c7f10f89b78eed3ceaf385f741de577ad2c">An opt-in Jalali (Persian/Solar Hijri) calendar display for card dates</a>. Thanks to mimZD and xet7.</summary>

[#4335](https://github.com/wekan/wekan/issues/4335) asked for Jalali dates
on the minicard, at least as a preview. Dates stay stored as Gregorian
`Date` objects everywhere - this adds a per-user, display-only toggle
(`profile.calendarSystem`, `allowedValues: ['gregorian', 'jalali']`,
default `gregorian`) that renders the minicard and card detail
received/start/due/end dates - and the vote/poker end dates, which share
the same template - in the Jalali calendar when set to `jalali`. The
toggle sits in Member Settings next to "Set day of the week start", saved
through the same `Meteor.call`/`localStorage` pattern already used there
for the other per-user display preferences.

The Gregorian↔Jalali conversion (`imports/lib/jalaliDate.js`) is a
from-scratch implementation of the standard, widely published
astronomical/tabular Jalali algorithm plus the standard Fliegel & Van
Flandern Julian Day Number conversion - not copied from any single
licensed source - so no new npm dependency or license question is
introduced. It is exercised against three independently verifiable
reference dates (2026-03-21 = 1405-01-01, Nowruz; 1979-02-11 = 1357-11-22;
2000-01-01 = 1378-10-11), round-trips through the reverse conversion, and
stays internally consistent day to day across the Nowruz year rollover
(`tests/jalaliDate.test.cjs`).

Deliberately out of scope for this pass: date-picker INPUT widgets, date
storage, and due-date reminder/notification logic are untouched and stay
Gregorian - only the rendered display text changes, and only for users who
opt in.

</details>

**Public Boards** - the overview and its search.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc91db9e27ef59b1facb187486cac74a38c38ad8">A public board card's own page now carries Open Graph meta tags, so pasting its link elsewhere renders a preview</a>. Thanks to yelloff and xet7.</summary>

[#3456](https://github.com/wekan/wekan/issues/3456) asked for a WeKan card
link pasted into Discourse to "onebox" the way a YouTube or GitHub link
already does there. Discourse's generic-page-preview oneboxer (and every
other og:-aware unfurler - Slack, Discord, Mastodon, ...) needs nothing
WeKan-specific for that: it renders a card automatically from standard Open
Graph meta tags in the target page's `<head>`, so this stays a
standards-based fix rather than a Discourse-specific oEmbed endpoint.

A connect middleware (`server/routes/cardOgTags.js`) matches the card route
`/b/:boardId/:slug/:cardId`, looks the card and its board up, and - only
when `board.isPublic()` - sets `request.dynamicHead` with `og:title`,
`og:description` (truncated), `og:url` and `og:image` (the card's cover,
when it has one) before Meteor's own SPA boilerplate serves the page.
`dynamicHead` is the same per-request head-injection point Meteor's WebApp
boilerplate generator already supports, used here the way
`server/routes/customHeadAssets.js` already injects other head content. A
private board's card is untouched: the gate is `board.isPublic()`, checked
before anything about the card is read, so an anonymous unfurl request
against a private card gets the normal, unmodified page - no title,
description or image leak. The gating/rendering logic lives in
`server/lib/cardOgTags.js` as a small Meteor-free module, covered by
`tests/cardOgTags.test.cjs`: a public card gets all four tags (or three,
when it has no cover), a private board's card and a missing card/board get
none, and an object with no `isPublic()` method fails closed rather than
open.

</details>

**Board Settings** - the Card Settings sidebar panel, and how its choices apply.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/520b2e412ecba03c44a0a7ffcf8da5264a65aa77">Whether a minicard shows label text is now a per-board default, with a per-user override</a>. Thanks to Meeques and xet7.</summary>

[#4256](https://github.com/wekan/wekan/issues/4256): whether a minicard's
labels show their TEXT (coloured words) or only the coloured bars was a
single setting applying to a user across every board
(`profile.hiddenMinicardLabelText`), with no way for a board to pick its own
default the way every other Card Settings row already can.

Adds `Boards.showLabelText` (Board Settings / Card, right above the
existing personal row), defaulting to `true` so an existing board with
nothing stored still shows text exactly as before. The personal row now
OVERRIDES that board default rather than being the only setting: it shows
whether it is following the board or has been overridden, with a "use board
default" reset link, mirroring how Member Settings / Change Color shows and
resets the existing global theme override
(`profile.globalThemeColor`). The resolution order - per-user override wins,
then the board's own setting, then the historical default - is a pure
function (`models/lib/labelTextVisibility.js`) shared by
`client/lib/minicardLabelText.js`, so the decision is made in exactly one
place; `tests/labelTextVisibility.test.cjs` pins all three cases plus the
migration-safety case that an existing board or user with nothing stored
sees no behaviour change. A logged-out reader of a public board keeps the
old localStorage-only toggle, now falling back to the board's own setting.

[#2561](https://github.com/wekan/wekan/issues/2561) asked for the same
thing under a different description - a board-level toggle to hide label
text on minicards and leave only the colour bars, like Trello - and is
fully covered by this same `Boards.showLabelText` setting; no separate
change was needed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/131514d6140479aaa8de925774fe226814f507f3">The opened card's Description, Custom Fields, Labels, Dates and Members sections can now be reordered</a>. Thanks to mimZD and xet7.</summary>

[#4448](https://github.com/wekan/wekan/issues/4448) asked for Description to
be movable earlier among a card's fields (e.g. third) with Custom Fields
rendering after it, rather than the card detail view's previous fixed
sequence.

Boards now store a `cardFieldOrder` array; a new pure module,
`models/lib/cardFieldOrder.js`, resolves it against the historical default
order (`labels, dates, members, customFields, description`), dropping any
unknown key and filling in any section missing from a stale or partial
stored value, so a section can never be duplicated or silently dropped from
the card. `cardDetails.jade` now renders these five sections from that
resolved order via an `each` loop, each one now its own template
(`cardFieldSectionLabels`, `...Dates`, `...Members`, `...CustomFields`,
`...Description`) rather than inlined at a fixed spot. Dependencies+Sort
stay a fixed appendage right after Members, and Vote+Poker stay one right
after Custom Fields, so a board that never touches the new setting renders
byte-for-byte what it always has. Checklists, Attachments and Activity are
left out of this pass - they sit in their own flex/right-column layout
further down the template, and reordering them was not needed for the
issue's ask and would add layout risk this environment could not verify
visually.

Board Settings / Card Settings gets a new "Card field order" list with
up/down buttons per row (`client/components/sidebar/sidebar.jade`,
`sidebar.js`) rather than a drag-and-drop library: this codebase's existing
jQuery-ui-sortable usages (list/swimlane/board reordering) are heavier
drag-and-drop over board layout, not a simple settings list, so buttons are
the simpler, safer mechanism here. `tests/cardFieldOrder.test.cjs` pins the
default order, that description can move to third with custom fields after
it, that unknown/duplicate/missing keys are always resolved to a complete
and valid order, the up/down move helper's boundaries, and that
`cardDetails.jade` renders these sections from the order-driven loop rather
than a hardcoded sequence.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de4a95474">A minicard can now show its swimlane's name in List view</a>. Thanks to JB_Pollard and xet7.</summary>

[#2426](https://github.com/wekan/wekan/issues/2426): in List view, unlike
Swimlanes view, a card's swimlane membership was not visible on its
minicard at all.

Adds a board-wide `Boards.allowsSwimlaneNameOnMinicard` toggle, defaulting
to `false` so existing boards see no change, with a new Card Settings row
(`client/components/sidebar/sidebar.jade`, `sidebar.js`) following the same
row pattern as "Show lists". There is no "Show on Card" equivalent - the
opened card already shows its swimlane via its own picker - so the row's
first column stays empty, the same shape as the existing "List title" row.
When enabled, the minicard renders a small, unobtrusive label at its bottom
(`client/components/cards/minicard.jade`), styled like the existing list-name
label, resolving the swimlane reactively via
`ReactiveCache.getSwimlane(card.swimlaneId)` - the same reactive per-card
lookup pattern already used elsewhere on the minicard.
`tests/minicardSwimlaneNameOnMinicard.test.cjs` pins the new field defaulting
to `false`, the Card Settings row toggling it, and the minicard only
rendering the label when the board flag is set.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3158b87c57ee564567b0d18f5a3a93f0ba9f4f2b">A board admin can now hide the "Time spent" badge on the card and minicard</a>. Thanks to matrixes and xet7.</summary>

[#2530](https://github.com/wekan/wekan/issues/2530): the "Time spent" field
was reachable only through the card's hamburger/context menu, and there was
no way to control whether the card detail view and minicard showed it once
logged.

Adds `Boards.allowsSpentTime` / `allowsSpentTimeOnMinicard`, both defaulting
to `true` - the card detail view and minicard already rendered the
accumulated spent-time badge (and its overtime indicator) unconditionally
whenever a card had logged time, so a `true` default keeps every existing
board's display unchanged - with a new Card Settings row
(`client/components/sidebar/sidebar.jade`, `sidebar.js`) following the same
"Show on card"/"Show on minicard" two-column pattern as
`allowsReceivedDate`/`allowsReceivedDateOnMinicard`. Turning either off now
lets an admin hide the badge from the card detail view or the minicard
respectively. `tests/spentTimeCardSettings.test.cjs` pins both fields
defaulting to `true`, the Card Settings row and its toggle handlers, and
that the card detail view and minicard only render the badge when the
corresponding flag is set.

</details>

**Rules (IFTTT)** - the triggers and card actions a rule can run.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9b36629a">Added "assignee added to card" / "assignee removed from card" rule triggers</a>. Thanks to HayWo and xet7.</summary>

[#3390](https://github.com/wekan/wekan/issues/3390): Rules already triggered
on a MEMBER being added to or removed from a card (`joinMember`/
`unjoinMember`, `server/triggersDef.js`). `assignees` is a separate card
field from `members` (`models/cards.js`), and its `joinAssignee`/
`unjoinAssignee` activities were already recorded for the activity feed, but
nothing wired them to the rule engine, so "when an assignee is added/
removed" could not be built.

Two new `server/triggersDef.js` entries (`joinAssignee`/`unjoinAssignee`,
the same `boardId`/`username`/`userId` matching shape as the member
triggers) plug directly into the existing generic rule matcher - no new
engine code needed. The card-triggers Add Rule UI
(`client/components/rules/triggers/cardTriggers.jade`/`.js`) gets matching
"when a/the assignee is added/removed" blocks, and the drag-and-drop
workflow palette (`rulesWorkflow.js`) gets the matching chips, mirroring the
member trigger's UI exactly. `tests/rulesAssigneeTrigger.test.cjs` pins the
trigger registration and matching (including that it does not fire on the
sibling member activity, or vice versa), the UI wiring, and that every
locale file has the four new i18n keys translated and in place.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c97bbac854f0504376cc3be5f0d99627c4f403d">Added a "Remove all labels" rule action</a>. Thanks to basketball00011 and xet7.</summary>

[#3432](https://github.com/wekan/wekan/issues/3432): the existing per-label
"add label X" / "remove label X" card actions
(`models/cards.js` `addLabel`/`removeLabel`, wired in
`server/rulesHelper.js` and the label dropdown in
`client/components/rules/actions/cardActions.jade`/`.js`) only ever
touched one label at a time, so clearing every label from a card needed
one "remove label" action per label in the rule.

`Card.removeAllLabels()` sets `labelIds` to an empty array in a single
update (a card with no labels is a no-op), and a new "Remove all labels"
rule action (`actionType: 'removeAllLabels'`, with no label-selection
sub-field, unlike the existing per-label actions) calls it from a new
dropdown entry next to the existing label actions, mirroring how the
existing "Remove all members" action is wired.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8a6de1c89331e5786a10ee28abdd9eb9d49ddc8">Added a "card matches advanced filter" rule trigger, reusing the Filter sidebar's own matching code</a>. Thanks to signalcodec and xet7.</summary>

[#3092](https://github.com/wekan/wekan/issues/3092): every existing rule
trigger only ever tests one simple condition (a label added, a member
added, ...), while the board's Filter sidebar already has a much richer
"Advanced Filter" criteria language - labels, custom fields, comparisons,
and `and`/`or`/`not`. There was no way to fire a rule from that richer
language at all.

The command-array -> Mongo selector algorithm that used to live only
inside `client/lib/filter.js`'s `AdvancedFilter` class now lives once, in
`/imports/lib/advancedFilter.js` (`advancedFilterCommandsToSelector`/
`advancedFilterStringToSelector`, plus the custom-field/dropdown/date
resolvers factored out into `buildAdvancedFilterResolversFromCustomFields`).
The sidebar class was refactored to call the shared function instead of
keeping its own copy of the parser - no behaviour change there.
`server/lib/advancedFilterMatch.js` calls the exact same shared function on
the server: it pre-fetches the board's custom fields once (Meteor 3
collections are async server-side, so the resolvers are built from a plain
snapshot rather than backed live by `ReactiveCache` the way the client's
are), then checks the built selector against the real Cards collection
(`Cards.findOneAsync({ ...selector, _id })`) - the same Mongo/FerretDB
query engine the client's minimongo mirrors, so "does this card match" is
answered identically in both places.

`server/rulesHelper.js`'s `findMatchingRules()` evaluates
`advancedFilterTrigger` triggers alongside the existing `TriggersDef`-driven
ones, on every activity that carries a card. Rules only ever fire from real
Activities (never on every raw write), so the new trigger follows the same
once-per-meaningful-change discipline every other trigger already has,
rather than re-evaluating on every database write. The trigger's UI
(`client/components/rules/triggers/cardTriggers.jade`/`.js`) reuses the
sidebar's advanced-filter text syntax directly, in a new "When a card
matches the advanced filter" trigger row - a scoped-down but
literally-the-same-language integration rather than a parallel UI.
`tests/ruleAdvancedFilterTrigger.test.cjs` pins a source-pattern negative
test that no other file redeclares the parser/selector-builder, that both
call sites import the one shared implementation, representative
advanced-filter combinations (`=`, `&&`, `||`, `!`) building the expected
selector, the server resolvers matching custom field names/dropdown values
the same way the client's do, and fire/no-fire behaviour as a card's custom
field value crosses into a stored filter's threshold.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8a6de1c89331e5786a10ee28abdd9eb9d49ddc8">A rule's trigger/action can now be edited in place, and its "send email" action includes the card's description too</a>. Thanks to kabi178 and xet7.</summary>

[#2713](https://github.com/wekan/wekan/issues/2713) asked for two things.

Editing a rule used to mean deleting it and rebuilding it from scratch,
losing its position and its identity. The rule row's toolbar gets a second
"Edit trigger/action" button next to the existing title-rename pencil,
opening the same trigger/action wizard used to create a rule, pre-filled
with the rule's current title. A new server method, `rules.updateRule`
(`server/rulesButton.js`), mirrors `rules.createRule`'s authorization and
RuleBleed cross-board destination checks but REPLACES the existing
trigger/action documents in place (a full-document update by their
existing `_id`, not a remove-then-insert), so the rule keeps its own
`_id`, and its trigger/action keep theirs, across an edit. Every
action-template click handler that used to call `rules.createRule` or
insert `Triggers`/`Actions`/`Rules` directly now goes through one shared
helper, `client/components/rules/rulesSaveHelper.js`, which picks create
vs. update based on whether the wizard was opened to edit an existing
rule.

The "send an email" rule action already appended the card's title and a
direct link to it automatically ([#3301](https://github.com/wekan/wekan/issues/3301)),
even when the user's own template used none of the `{card}`/`{cardLink}`
tokens; it did not do the same for the card's description.
`server/rulesHelper.js` now appends a "Description: ..." line to the
footer alongside the existing title/link lines.

Actually attaching the card's FILE attachments to the outgoing email is
larger, mailer-level scope and is deferred - see TODO Later above.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29488f8d52a0c3a94f9b4218910e0764908d26a2">Added "due/start/end/received date changed" rule triggers</a>. Thanks to justinr1234 and xet7.</summary>

[#2474](https://github.com/wekan/wekan/issues/2474): there was no way to
fire a rule when a card's due, start, end or received date was set or
changed - only the label/member/assignee/checklist/attachment style
triggers existed for that kind of field.

`models/cards.js`'s `setDue`/`setStart`/`setEnd`/`setReceived` already go
through `server/models/cards.js`'s `Cards.before.update` timing-field
hook, which logs an `a-dueAt`/`a-startAt`/`a-endAt`/`a-receivedAt`
activity on every SET (the same activity the due-date-change-count
feature, [#6081](https://github.com/wekan/wekan/issues/6081), already
reads - it only ever fires from a real value, never from
`unsetDue`/`unsetStart`/`unsetEnd`/`unsetReceived`'s `$unset`). Four new
`server/triggersDef.js` entries, keyed by those exact activityTypes and
matching on `boardId`/`userId`, plug the existing activity straight into
the generic rule matcher - no new detection mechanism. The card-triggers
Add Rule UI (`client/components/rules/triggers/cardTriggers.jade`/`.js`)
gets four matching "When the due/start/end/received date is set or
changed" rows. Comparing a date against a threshold (e.g. "due within N
days") is a separate, larger feature and is not part of this change.
`tests/rulesDateFieldTrigger.test.cjs` pins the trigger registration, the
existing hook it reuses, fire/no-fire matching (including that the four
date fields never cross-fire on each other or on an unrelated activity),
the UI wiring, and that every locale file has the four new i18n keys
translated and in place.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f79e8791420b696d098c9342a98db9cdd04c140">The "add member" rule action can now add whoever triggered the rule, not just a fixed member</a>. Thanks to arisjr and xet7.</summary>

[#2522](https://github.com/wekan/wekan/issues/2522): the "add member" card
action only ever stored one specific, pre-chosen board member, so "when a
card moves to list X, add whoever just moved it as a member" could not be
built - there was no way for the action to mean "the person who just did
the triggering action" instead of a fixed name.

The action gets a second button, "Add the user who triggered this rule as
a member", that saves the same `addMember` action with a sentinel
`username` (`RULE_ACTING_USER_SENTINEL`, `models/lib/ruleActingUser.js`)
instead of a fixed one. At execution time `server/rulesHelper.js` resolves
that sentinel to `activity.userId` through `resolveActingUserId()` - the
exact same acting-user source `buildRuleVars()` already resolves for the
`{username}` template variable ([#3304](https://github.com/wekan/wekan/issues/3304)/[#3301](https://github.com/wekan/wekan/issues/3301)),
reused rather than reimplemented, and then calls the same
`card.assignMember()` the fixed-member path already uses. The ordinary
fixed-member "add member" action is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b42034171">Added a "card title/description contains {value}" rule trigger</a>. Thanks to sfahrenholz and xet7.</summary>

[#2194](https://github.com/wekan/wekan/issues/2194) asked for a text-search
rule condition combinable with other triggers (e.g. "card added to Backlog
AND contains 'Patch'"). WeKan's rules stay single-trigger/single-condition
today - combining several conditions in one rule with AND was already looked
at and explicitly deferred by [#4294](https://github.com/wekan/wekan/issues/4294)
(see TODO Later) - so this adds ONE new standalone trigger type instead: "when
a card's title or description contains {value}", the same scope-down the
[#3092](https://github.com/wekan/wekan/issues/3092) advanced-filter trigger
used.

The user types a substring when building the rule; a new pure module,
`models/lib/ruleTextContainsMatch.js` (`textContainsMatch`/
`cardTextContainsMatch`), does a case-insensitive substring test against the
card's CURRENT title/description. `server/rulesHelper.js` evaluates it the
same way it already evaluates the advanced-filter trigger - not through the
generic `TriggersDef` exact/wildcard matcher, since a substring match isn't
one - re-reading the card on the activities that actually change its
matched text: card creation, and the `a-changedTitle`/`a-changedDescription`
activities `server/models/cards.js` already logs for the outgoing-webhook
hook (issues [#3619](https://github.com/wekan/wekan/issues/3619)/
[#5482](https://github.com/wekan/wekan/issues/5482)). The card-triggers Add
Rule UI (`client/components/rules/triggers/cardTriggers.jade`/`.js`) gets a
matching "When a card's title or description contains" row with a text
input, mirroring the advanced-filter trigger's own text-input row.
`tests/rulesTextContainsTrigger.test.cjs` pins the pure match function
(case-insensitive, title, description, no match, no crash on a missing
card/field), the trigger registration, the `rulesHelper.js` wiring, the UI
wiring, and the new i18n keys. Full AND-combination of several conditions in
one rule remains out of scope and stays tracked under TODO Later's #4294
entry.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e9279987">Added a way to temporarily disable a rule without deleting it</a>. Thanks to sfahrenholz and xet7.</summary>

[#2322](https://github.com/wekan/wekan/issues/2322): the only way to stop a
rule from firing used to be deleting it, which threw away its
trigger/action configuration for good - re-creating the same automation
meant rebuilding it from scratch.

Adds an `enabled` Boolean field to the Rules schema (`models/rules.js`),
defaulting to `true` so every rule that existed before this field keeps
firing exactly as before. A new `rules.setEnabled` server method
(`server/rulesButton.js`) flips only that flag - it never touches the
rule's Trigger/Action documents or its own title/triggerId/actionId. The
rules list (`client/components/rules/rulesList.jade`/`.js`) gets a toggle
button next to the existing edit/delete actions, and
`RulesHelper.findMatchingRules()` (`server/rulesHelper.js`) skips any rule
whose `enabled` is explicitly `false`, so a disabled rule's configuration
stays fully intact and ready to re-enable, just never evaluated while off.
`tests/ruleEnabledToggle.test.cjs` pins the schema default, the
`rules.setEnabled` method (authorization, that it only `$set`s `enabled`,
and never touches Triggers/Actions), the skip check in
`findMatchingRules()`, and the UI wiring, plus logic-level coverage that a
pre-existing rule with no `enabled` field still fires, a disabled rule does
not, and re-enabling restores firing with the same trigger/action ids.

</details>

**Quick-add card** - the composer at the bottom of a list.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc699ab43b379081755022ee4d5aa63d19f61039">A "[LabelName] " prefix in the quick-add-card title now applies (and creates) that label</a>. Thanks to mattdm and xet7.</summary>

[#3986](https://github.com/wekan/wekan/issues/3986): bulk-entering cards
through the quick-add composer had no way to label them without opening
each card afterward. Typing a title that starts with a bracketed label
name, e.g. "[Fedora] Do a thing", now creates the card titled "Do a
thing" with the "Fedora" label applied - matching an existing board label
by name case-insensitively, or creating one (with the same default-color
pick the "Add label" popup uses) when no label with that name exists yet.

Only a single bracket prefix at the very start of the title is parsed -
an empty bracket, nested brackets, or a bracket with nothing left after
it (e.g. "[Fedora]" alone) is left as literal title text rather than
misread as the syntax. The parsing and label-resolution logic is a pure
module, `models/lib/quickAddCardLabel.js`
(`parseQuickAddCardLabel`/`findExistingLabelIdByName`/
`pickDefaultLabelColor`), wired into `addCard` in
`client/components/lists/listBody.js`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc699ab43b379081755022ee4d5aa63d19f61039">A "More options" panel sets description, due date and assignees at creation, in one notification</a>. Thanks to Side2005 and xet7.</summary>

[#3967](https://github.com/wekan/wekan/issues/3967): quick-add only took a
title, so filling in a card's description, due date and assignee right
after creating it meant one `Cards.update` per field - and
`server/models/activities.js` sends a watcher-notification e-mail for
every `Activities` document, so each of those edits fired its own e-mail
on top of the "card created" one.

A "More options" link next to the composer's controls reveals a
description textarea, a due-date picker and the board's member list
(reused as an assignee checklist) before the card is created. Filling
any of them in adds `description`/`dueAt`/`assignees` onto the SAME
object passed to `Cards.insert` in `addCard`
(`client/components/lists/listBody.js`) - not a follow-up `Cards.update`
- so `server/models/cards.js`'s `Cards.after.insert` hook still only ever
inserts the ONE `createCard` activity it always did, and watchers get a
single, complete notification. A card added without opening "More
options" behaves exactly as before.

Batching the notifications generated by editing an *already-created*
card one field at a time (the reporter's "N further emails" case) is a
separate, larger change to the notification pipeline itself and is not
part of this fix.

</details>

**The member menu** - My Cards, My Due Cards and the pages beside them.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9dd6b05b">A "My Attachments" page lists every attachment the user has uploaded, across every board</a>. Thanks to Jieiku and xet7.</summary>

[#3461](https://github.com/wekan/wekan/issues/3461): the member menu already
had My Cards and My Due Cards, each its own entry and its own page listing
cards across every board the user belongs to. My Attachments is a third,
identical sibling - added right after My Due Cards
(`client/components/users/userHeader.jade`) - listing every attachment the
CURRENT user has uploaded (not everybody's, just theirs), grouped board >
swimlane > list > card the same way My Cards is, with the same "open the
card in place" popup click handler My Cards' `.js-minicard` uses (#3640) so
opening one never navigates away from the list.

The new `myAttachments` publication (`server/publications/cards.js`) filters
by both the uploader and board visibility, reusing the same
`boardVisibilitySelectors()` the All Boards list and the `board` publication
already use (GHSA-gwc4-fw7p-gw58) rather than writing that rule a third
time - so an attachment on a board the user cannot see is never published,
even if its `userId` field somehow still names them. The query shape is a
small pure module, `models/lib/myAttachmentsQuery.js`, unit-tested without a
database.

</details>

**Subtasks** - the Subtasks section on a card.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27f5051be">Add an existing card as a subtask directly from the parent card's Subtasks section</a>. Thanks to ikomhoog and xet7.</summary>

[#3626](https://github.com/wekan/wekan/issues/3626) asked for three things.
The completed/total subtask counter was already correct (pinned by the
earlier #4050 work), and letting one card be a subtask of several parents
at once is a genuine data-model change - `parentId` (`models/cards.js`) is
a single field today, and every ancestor walk assumes exactly one parent -
deferred to TODO Later above for a deliberate design decision. This is the
third, buildable part: a way to add an EXISTING card as a subtask, instead
of only being able to create a brand-new one.

A new "Add existing card as subtask" trigger sits next to "Add a new
subtask" and opens a search popup scoped to the current card's own board,
excluding the card itself, cards already parented to it, and anything that
is already an ancestor of it - `setParentId`'s #3328 cycle guard would
refuse those anyway, so they are filtered out before the user can pick
them. Selecting a result calls the exact existing `card.setParentId(...)`
method, the same re-parenting call every other site in the codebase uses,
so no new card is created and no other field of the picked card changes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/632a107f3">An "Inherit parent's labels" checkbox optionally copies the parent card's labels onto a new subtask</a>. Thanks to MelBourbon and xet7.</summary>

[#2184](https://github.com/wekan/wekan/issues/2184): a subtask always
started with no labels, so a label that should obviously apply to it too -
the same colour-coded category as its parent - had to be re-applied by
hand every time.

The "Add a new subtask" popup gets an "Inherit parent's labels" checkbox,
default UNCHECKED so the existing behaviour (a subtask starts with no
labels) is unchanged unless it is used. When checked, the parent card's
CURRENT `labelIds` are copied onto the new subtask as part of the same
`addSubtaskCard` server method call that creates it
(`server/models/cards.js`), via a small pure helper,
`computeSubtaskLabelIds` (`models/lib/subtaskLabelInheritance.js`), kept
separate so it is unit-tested without a database. This is deliberately a
ONE-TIME copy taken at creation time, not an ongoing sync: a later change
to the parent's labels does not retroactively touch a subtask already
created, which the test pins directly.

</details>

**Lists** - a list's own header and the List hamburger/action menu.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5605e08dd">A board-wide toggle keeps every list's header pinned while its cards scroll underneath it</a>. Thanks to JFa-Orkis and xet7.</summary>

[#3847](https://github.com/wekan/wekan/issues/3847): a list's title,
WIP-limit badge and hamburger menu scrolling away with the cards
"interfere with readability" once a list is long enough to scroll.

`.list-header` already sits BEFORE `.list-body` (the cards' own scrolling
box, `overflow-y: scroll`) as a flex sibling rather than a child of it, so
it does not scroll away with the cards in the ordinary bounded-height board
layout. A new `Boards.stickyListHeaders` field (default `false`, unchanged
behaviour) additionally sets `position: sticky` on `.list-header` when on,
so the header also stays pinned in any layout where `.list` itself turns
out to be the actual scrolling ancestor. The setting is board-wide rather
than per-list - freezing one list's header while its neighbours scrolled
normally would look inconsistent - but the toggle itself is offered from
each List's own hamburger/action menu (`listActionPopup`, next to "Set WIP
Limit"), per the maintainer's instruction, for discoverability rather than
scope: flipping it from one list affects every list on the board.

</details>

**Labels** - the label popup opened from a card's Labels button and Board Settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1af1d7ad3fcadbaeca0a52ef473552a775849f02">A label can now carry its own optional due date, so it doubles as a "milestone"</a>. Thanks to locnide and xet7.</summary>

[#2802](https://github.com/wekan/wekan/issues/2802) asked for "Milestones": a
board-level tag with a due date, and the ability to view/filter cards by
milestone. A whole new Milestone object - its own collection, CRUD UI and
filter integration - would duplicate what labels already do, so instead
labels themselves gained one optional field: `labels.$.dueAt` in
`models/boards.js`, nullable and unset by default, so every existing label
and board is completely unaffected.

The existing label create/edit popup
(`client/components/cards/labels.js`/`.jade`, the same popup used for a
label's name and color) gained a "Due Date" date input, wired through
`Boards.addLabel`/`editLabel`'s new trailing `dueAt` argument;
`editLabel` explicitly `$unset`s it when the field is cleared rather than
leaving a stale value. When set, the labels list (the same popup that lists
a board's labels for editing) shows the date next to the label as a small,
muted badge - the safe minimum requested, rather than new minicard real
estate that risks visual clutter.

A "milestone" is then just a label named e.g. "Sprint 1" with a due date:
filtering cards by that label - already supported by WeKan's existing label
filter - is the milestone filter the issue asked for, with no new filter UI.

</details>

**Sign-in** - the username/password login form and the member menu's account
settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0eaa97230">Added opt-in per-user TOTP two-factor authentication, via Meteor's own accounts-2fa</a>. Thanks to r0bbie and xet7.</summary>

[#3058](https://github.com/wekan/wekan/issues/3058) asked for two-factor
authentication on WeKan's own username/password login, not through a
third-party OAuth provider. Added Meteor's official `accounts-2fa` package
(MIT, part of the `meteor/meteor` monorepo, the same publisher as
`accounts-password` already in use) rather than hand-rolling TOTP -
`Accounts.generate2faActivationQrCode`/`enableUser2fa`/`disableUser2fa`/
`has2faEnabled` do all secret generation and code verification.

A new "Two-Factor Authentication" entry in the member menu shows a QR code
and a manual-entry secret, then confirms with a 6-digit code to finish
enabling; a "Disable" action turns it off. On the sign-in form, a password
login that comes back with accounts-2fa's documented `no-2fa-code` error
now shows a second "enter your 6-digit code" step instead of a generic
failure, and resubmits with `Meteor.loginWithPasswordAnd2faCode` -
accounts-2fa's own login method for this case, rather than any
WeKan-side TOTP check. `wekan-accounts-lockout` already anticipated this:
its `loginFailureDecision.js` already treated `no-2fa-code` as a
non-countable step, so a 2FA login is never mistaken for a brute-force
attempt. Scope is opt-in per-user TOTP only, as asked - no backup codes,
SMS or admin-enforced 2FA in this pass.

</details>

**Calendar export** - a subscribable feed of a board's card dates for outside calendar apps.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a49e9d70aa744944b3fdbb5d96ac8fb50033547d">Add a per-board iCal (.ics) export feed</a>. Thanks to xet7.</summary>

[#2836](https://github.com/wekan/wekan/issues/2836) ("CalDAV or iCal
Support") asked specifically about calendar EXPORT/SYNC, not the in-app
Calendar view [#808](https://github.com/wekan/wekan/issues/808) already
added - and the codebase had a one-way .ics IMPORT
([#6323](https://github.com/wekan/wekan/issues/6323)) but no export
direction at all. A new `GET /api/boards/:boardId/calendar.ics` route
streams a subscribable, read-only iCalendar feed of a board's cards - one
VEVENT per Received / Start-End span / Due date, the same four dates the
Calendar view already draws - authenticated the same way every other
export route is (a public board needs no token; a private one takes
`?authToken=` or a logged-in session) and scoped/authorized through the
same `Exporter.canExport()`/`_scopedCardSelector()` every other export
uses. The board Export popup gets a new "iCal" link built through the
existing `exportUrl()` table, so it carries the same authToken handling as
every other format. This is EXPORT only, one-way and read-only: full CalDAV
is a stateful two-way sync protocol with its own server, which is a much
larger feature than a dates feed, and is out of scope here - every calendar
client that can "subscribe to a URL" reads a plain .ics feed directly, no
CalDAV needed.

</details>

**Board invitations** - inviting a user to a board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d1b2915ef1973e2b1d13219ef03dddb0d140727">Inviting a user to a board now also sends a push notification, not just email</a>. Thanks to CondensedTea and xet7.</summary>

[#3136](https://github.com/wekan/wekan/issues/3136): `inviteUserToBoard`
(`server/models/users.js`) only ever sent an invitation email. Board
membership/watcher changes already fan out through
`Notifications.notify(user, title, description, params)` - the same helper
`server/models/activities.js` calls for card assignment, due dates, mentions
and every other activity-driven notification, reaching both the email
service and the in-app notification bell - but an invite itself never went
through it. `inviteUserToBoard` now also calls
`Notifications.notify(user, 'push-invite-title', 'push-invite-text', params)`
right after the email is sent, reusing the exact same helper and the same
`params` already built for the email - no new push infrastructure. It is
guarded by `!isNewUser`: a brand-new invitee created from an email address
with no matching WeKan account has no established notification target yet,
so they stay email-only, exactly as before, with no error.

</details>

**Card sorting** - the board's "Sort" popup, which orders every list's cards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd935f7242addd8a15195b7ae7a0ce7afd95a213">Add an optional "Sort by votes" mode that floats highly-voted cards to the top</a>. Thanks to xet7.</summary>

[#3050](https://github.com/wekan/wekan/issues/3050) asked for a way to bring
a list's highest-voted cards to the top without dragging them there by
hand. The board's existing "Sort" popup already offers due date, title and
created date - the one alternate-sort mechanism WeKan has for cards - so
"Sort by votes" is a new entry there rather than a separate per-list
toggle or a new multi-criteria picker.

Vote score (positive votes minus negative votes) is not a real Mongo
field, so it cannot be expressed as a Mongo sort spec the way due
date/title/created date are. `{ votes: -1 }` is used as a marker only:
`cardsWithLimit()` (`client/components/lists/listBody.js`) recognizes it,
fetches the window in the underlying manual `sort` order, and re-sorts the
resulting array in JS by vote score - a pure DISPLAY-order change. The
manual `sort` field on each card is never touched, so switching the mode
back off (or the plain "Sort" reset) restores the exact manual drag order.

`models/lib/voteSortCards.js` extracts the comparator as a plain,
Meteor-free module so the scoring and ordering rules are unit-testable:
highest vote score first, a card with no votes scores 0 and sorts last,
and ties (including two zero-vote cards) keep their relative manual-sort
order via a stable sort.

</details>

**Lists** - a list's own header and Board Settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/187a3df1ce3377aba2a522cad4977900460355f0">Add a WIP limit shared across several lists together (WIP limit groups)</a>. Thanks to aviertio and xet7.</summary>

[#2489](https://github.com/wekan/wekan/issues/2489) asked for a WIP limit
that covers several columns together - e.g. three middle "in progress"
columns that may never hold more than 10 cards between them - on top of
the per-list limit WeKan already has (`models/lists.js` `wipLimit`).
`Boards.wipLimitGroups` adds a small board-level array of
`{ _id, name, listIds, limit, enabled }` groups, managed from a new "WIP
Limit Groups" panel in Board Settings (Swimlane/List/Card/WIP Limit
Groups, the same settings-popup pattern the other three already use),
where two or more of the board's lists are picked to share one combined
numeric limit.

`models/lib/wipLimitGroupDecision.js` is the pure arithmetic this reuses
everywhere the decision is needed: `combinedWipLimitGroupCount` sums the
current card count across a group's member lists,
`isWipLimitGroupExceeded` mirrors the per-list "exceeded" threshold
(`value < count`, the same strict comparison `exceededWipLimit` already
used), and `isListInExceededWipLimitGroup` answers whether a given list
belongs to any group currently over its own shared limit - independent
of that list's own individual `wipLimit`, so a group's total is never
confused with what any one member list's own limit says.

The list header shows the group being over limit with the exact same
`.highlight` red-text styling the per-list WIP counter already uses
(`client/components/lists/list.css`), not a second visual language: every
list that belongs to an exceeded group gets its title highlighted, so it
is clear at a glance which lists are part of the over-limit group, not
only the one list that happens to be over on its own.

</details>

**Lists** - a list's own header and Board Settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/187a3df1ce3377aba2a522cad4977900460355f0">Add a WIP limit shared across several lists together (WIP limit groups)</a>. Thanks to aviertio and xet7.</summary>

[#2489](https://github.com/wekan/wekan/issues/2489) asked for a WIP limit
that covers several columns together - e.g. three middle "in progress"
columns that may never hold more than 10 cards between them - on top of
the per-list limit WeKan already has (`models/lists.js` `wipLimit`).
`Boards.wipLimitGroups` adds a small board-level array of
`{ _id, name, listIds, limit, enabled }` groups, managed from a new "WIP
Limit Groups" panel in Board Settings (Swimlane/List/Card/WIP Limit
Groups, the same settings-popup pattern the other three already use),
where two or more of the board's lists are picked to share one combined
numeric limit.

`models/lib/wipLimitGroupDecision.js` is the pure arithmetic this reuses
everywhere the decision is needed: `combinedWipLimitGroupCount` sums the
current card count across a group's member lists,
`isWipLimitGroupExceeded` mirrors the per-list "exceeded" threshold
(`value < count`, the same strict comparison `exceededWipLimit` already
used), and `isListInExceededWipLimitGroup` answers whether a given list
belongs to any group currently over its own shared limit - independent
of that list's own individual `wipLimit`, so a group's total is never
confused with what any one member list's own limit says.

The list header shows the group being over limit with the exact same
`.highlight` red-text styling the per-list WIP counter already uses
(`client/components/lists/list.css`), not a second visual language: every
list that belongs to an exceeded group gets its title highlighted, so it
is clear at a glance which lists are part of the over-limit group, not
only the one list that happens to be over on its own.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c7524db05a492e04b047e7523b916ccfb9df0c6">Add an "apply to whole swimlane" quick-select to WIP limit groups</a>. Thanks to bhueck and xet7.</summary>

[#2380](https://github.com/wekan/wekan/issues/2380) asked for a WIP limit on
a whole SWIMLANE - a cap on the total cards across all of that swimlane's
lists combined - distinct from the per-list `wipLimit` and from the
cross-list WIP limit groups just above (#2489). A WeKan list already carries
an optional `swimlaneId` (`models/lists.js`) when it was created for one
specific swimlane, so that swimlane's own lists are exactly a WIP limit
group's `listIds` in the same `{ _id, name, listIds, limit, enabled }` shape
\#2489 already added - no separate counting or enforcement was built.

The "WIP Limit Groups" panel's "Add WIP limit group" form gets a swimlane
picker and an "Apply to swimlane" button
(`client/components/sidebar/sidebar.jade`/`.js`). Choosing a swimlane and
clicking it checks exactly the boxes of that swimlane's own lists, using the
new `listIdsForSwimlane` helper
(`models/lib/wipLimitGroupDecision.js`) - the combined count and the
"exceeded" decision are then the exact same `combinedWipLimitGroupCount` /
`isWipLimitGroupExceeded` functions #2489 already uses, so a swimlane's
shared limit is enforced and displayed identically to any other WIP limit
group, and is independent of any single member list's own individual
`wipLimit`.

`tests/swimlaneWipLimitGroup.test.cjs` covers `listIdsForSwimlane`
(including a list with no `swimlaneId`, i.e. one shared across every
swimlane, correctly staying out of any one swimlane's membership) and the
combined-count/over-limit decision for a swimlane's lists, proving it stays
correct even when one member list has its own, much higher, individual
`wipLimit`.

</details>

**Comments and activities** - a card's comment thread and its activity log.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c7524db05a492e04b047e7523b916ccfb9df0c6">Reply to a notification email, and the reply becomes a comment on the card</a>. Thanks to vasyugan and xet7.</summary>

[#2414](https://github.com/wekan/wekan/issues/2414) asked for Trello's
reply-by-email: reply to a WeKan notification email, and the reply shows up
as a comment. WeKan only ever SENDS email - there was no infrastructure to
RECEIVE it, and building a full IMAP-polling mail client is real operational
complexity (a running mailbox, credentials, a polling loop) most self-hosters
do not want. This is deliberately the smaller, webhook-based half instead: a
new `POST /api/inbound-email` that a mail provider's inbound-parse webhook
(Mailgun Routes, SendGrid Inbound Parse, Postmark inbound) calls with the
parsed reply, documented with provider-side setup steps in
`docs/Features/Email/Reply-By-Email.md`.

Every outbound notification email's `Reply-To` now carries
`reply+<cardId>-<hmac>@<domain>` (`server/lib/inboundEmailReplyToken.js`),
the HMAC keyed by a server-only `INBOUND_EMAIL_HMAC_SECRET` so the token
cannot be forged or guessed from a card id alone. The webhook verifies it
with a constant-time comparison, resolves the target card, strips the
reply's quoted text with a heuristic covering the common "On ... wrote:",
`>`-quoted and Outlook-style markers (`server/lib/inboundEmailQuoteStrip.js`),
matches the sender's From address to an existing WeKan user
(`server/lib/inboundEmailUserMatch.js`), and inserts a `CardComments`
document. **No matching user means the reply is rejected outright - it is
never turned into an anonymous comment.**

The endpoint is unauthenticated by design (a mail provider calls it, not a
logged-in WeKan user), so the HMAC token is the only guard standing between
an arbitrary POST and a new comment. Every rejection - a bad/forged/expired
token, a card the token points at that no longer exists, or a sender address
matching no account - is recorded through `server/lib/securityLog` under a
new `authn.inbound-email` catalog key (`models/lib/securityCategories.js`),
wrapped so logging can never break the guard, so repeated forged or
unmatched attempts show up in Admin Panel → Problems.

Both `INBOUND_EMAIL_HMAC_SECRET` and `INBOUND_EMAIL_DOMAIN` are opt-in; with
either unset (the default) no `Reply-To` is added at all and every existing
install is unaffected. Because notification emails are batched into one
digest per user, a digest covering several cards can only carry a single
`Reply-To`, so a reply lands on the MOST RECENTLY notified card in that
digest - a documented limitation of combining batching with a single
Reply-To header, not a bug.

</details>

**The due-date badge** - the card detail and minicard badge showing a
card's due date.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67f1c7c56">The due-date badge now shows a countdown, not just the raw date</a>. Thanks to javen9881 and xet7.</summary>

The badge only ever showed the formatted due date, even though its own
hover title already read "Due on ...", giving no sense of urgency without
opening the card. `dueCountdown()` (`client/lib/dueDateColor.js`) is a
pure day-count helper - comparing the due date's calendar day against
"now"'s, so a card due later today reads "Due today" rather than "0 days
left" - sharing its "now" comparison with the existing `dueDateClass()`
so the countdown and the badge's colour coding always agree.
`cardDate.js`'s new `dueCountdownText()` turns it into translated text,
and both the card-detail and minicard due-date badges now show it in
their visible text and their hover title, e.g. "Jun 15 (3 days left)" /
"Jun 15 (2 days overdue)" / "Jun 15 (Due today)". A due date that already
has an end date set (the card is done) keeps just the plain date - there
is nothing left to count down. The received/start/end date badges are
untouched; they draw from the same shared markup template but keep their
own `showDate()`/`showTitle()`.

</details>

**Card templates** - creating a template from an existing board element.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc25eee1b">The card menu gained "Save as Template", the reverse of inserting a card from a template</a>. Thanks to andresmanelli and xet7.</summary>

[#2209](https://github.com/wekan/wekan/issues/2209) (a follow-up to #2165's
original template-feature checklist) asked for "create template from
element" - creating a template directly from an existing board/list/card,
rather than only building one from scratch. WeKan already let a user
insert a card FROM a template (the existing searchElementPopup flow), but
nothing did the reverse.

The card menu now offers "Save as Template" beside "Copy Card", posting to
a new `saveCardAsTemplate` server method that copies the card into the
user's own "Card Templates" swimlane - creating the personal Templates
board on first use, exactly as the existing default-board-template flow
already does - and marks the copy `type: 'template-card'` so it behaves
as a template rather than an ordinary card. The lazy per-user Templates
board creation used to live only inline in the `ensureTemplatesBoard`
Meteor method; it is now exported as `ensureTemplatesBoardForUserId`
(`server/models/users.js`) so the new method calls it directly server-side
instead of duplicating the board/swimlane setup.

\#2209's other two sub-items were checked rather than built: "cards don't
appear in swimlanes if the general swimlane is deleted" ([#1959](https://github.com/wekan/wekan/issues/1959))
already has thorough startup-rescue coverage in the "swimlane-structure"
step of `server/lib/schemaUpgradeSteps.js`, with regression tests in
`tests/schemaUpgradeSteps.test.cjs`; "templated users" was explicitly out
of scope per the issue's own text.

</details>

and fixes the following bugs:

**Board reports** - the Dashboard and the 10 board report chart views.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b33e2e1bebb4e1e82d43f180eaa20e3474ddd323">The Dashboard's "none" group label is now translated; a chart canvas that could render invisible now always renders</a>. Thanks to xet7.</summary>

The Dashboard view's By Assignee/By Label bars grouped a card with no
assignee or label under the literal English word "none" - untranslated in
every language, on the live chart, the data table, and the PDF/Excel
export alike. Two sentinel keys (`NO_ASSIGNEE_GROUP`/`NO_LABEL_GROUP`) plus
a shared `translateGroupLabel()` replace it with a real "No assignee"/"No
label", translated into all 245 locales directly (not left as English
placeholders), everywhere that group label is rendered.

Also fixes a board report chart (reported: Burndown) rendering its export
buttons and table but no visible chart: the `<canvas>` only exists in the
DOM once loading finishes and Blaze's jade conditional switches to its
"else" branch - a sibling reactive change driven by the SAME data update
the chart-building code also depends on, with no guaranteed ordering
between the two. The very first successful data load could run before
Blaze patched the DOM, silently finding no canvas and never building a
chart, with nothing to trigger a retry afterward. The canvas lookup is now
deferred with `Tracker.afterFlush` so it always runs after the DOM has
actually been patched.

Also removes three dead `<link>` tags in `gantt.jade` pointing at
`gantt.css`/`ganttCard.css`/`boardCharts.css`'s raw source path - all three
are already loaded through the normal bundler import, and the runtime
`<link>` to the unserved source path 404'd as `text/html`, pure console
noise on every Gantt page load.

</details>

**Document preview** - opening a PDF/DOCX/XLSX/PPTX attachment on a card.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/373980ac8a37eb830539b01ffc12dfb0c0a53e18">The full-featured DOCX/XLSX/PPTX viewer and native PDF preview are back</a>. Thanks to xet7.</summary>

The minimal server-rendered GIF-slideshow preview (introduced this week to
cut dependency weight) turned out to fail outright whenever its own
rasterization dependency chain (`pdf-to-img` -> `pdfjs-dist`'s optional
`@napi-rs/canvas`) was missing or misresolved a worker path under the
bundled server - three separate 415 fixes landed for it in a single day.
Rather than keep chasing that dependency chain, the previous full-featured
viewer is restored instead: `office-open-xml-viewer` (MIT-licensed,
canvas-based, zero runtime dependencies) renders DOCX/XLSX/PPTX client-side
exactly as it did before, and PDF goes back to the browser's own native
`<embed>` viewer - simpler, zero extra dependencies, and gets the browser's
own zoom/search/print for free. The server-side full-text search this week's
change also introduced is kept: `server/lib/documentGif.js` now does nothing
but extract plain text for the search index (`indexDocumentText`, triggered
in the background from `Attachments.onAfterUpload`) - no rendering, no HTML,
no page images - so `pdf-to-img` and `@napi-rs/canvas` are dropped entirely
(nothing rasterizes a PDF page server-side any more) while `pdfjs-dist`
stays, now as a direct dependency, for its text-only extraction. Searching
attachment contents from the card search box keeps working exactly as
before.

Every PDF upload initially logged "Document search indexing failed:
TypeError: textDocument.destroy is not a function" and left that PDF
unsearchable: `pdfjs-dist`'s `getDocument()` returns a loading task, and
`destroy()` lives on THAT, not on the `PDFDocumentProxy` its `.promise`
resolves to. Also silenced "Ensure that the standardFontDataUrl API
parameter is provided" on every PDF by pointing `standardFontDataUrl`/
`cMapUrl` at `pdfjs-dist`'s own bundled font-metric and CJK character-map
files instead of falling back to an approximation each time. Verified
end-to-end against a real uploaded PDF.

</details>

**Login persistence** - the HttpOnly session cookie that keeps a login across browser restarts.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e18c824d5950acf94e6fccd51f5c54dcbbcd09f">The HttpOnly login cookie now always gets a fallback expiry</a>. Thanks to markusst1982 and xet7.</summary>

The native `useHttpOnlyCookies` resume flow only attaches `Expires`/`Max-Age`
to `meteor_login_token` when it can match the freshly issued token back to a
stored resume token in the database at the exact moment the cookie is
written. When that lookup misses, the cookie was written with no expiry at
all, so the browser treats it as a plain session cookie and drops it the
moment the browser closes - silently downgrading the configured 90-day login
into a same-session-only one. `http.ServerResponse.prototype.setHeader` is
now patched to guarantee a fallback expiry, decided by a pure, tested helper
(`server/lib/loginCookieExpiry.js`), whenever a `Set-Cookie` header for that
cookie carries neither directive. This hardens the failure mode that best
matches [#6684](https://github.com/wekan/wekan/issues/6684), which stays
open pending confirmation from a live browser-restart reproduction.

</details>

**Labels popup** - the popup opened from a card's Labels button.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/780f0b9115054e3163fe7ce006927e5ae5abb1df">The Labels popup no longer stays open after leaving a card, or applies to the wrong card</a>. Thanks to rmb82 and xet7.</summary>

The Labels popup (`client/lib/popup.js`'s global `Popup` singleton) was never
closed when a card's details view was closed or swapped for another card -
Blaze just destroys the `cardDetails` template instance, and nothing called
`Popup.close()`/`back()` in response. So the popup stayed visible after
leaving card A, and opening Labels again on card B pushed a new stack entry
on top of the stale one instead of replacing it, leaving the old entry
(still bound to card A's data) rendered alongside the new one and able to
keep toggling labels on the wrong card.

`Popup.open()` now resets its stack when a fresh popup (not a sub-popup
opened from within the popup that is already showing) is opened while a
previous popup is still open. `Template.cardDetails` remembers which card it
was opened for and, on destroy, closes `Popup` if it is still showing that
same card's data at the base of its stack - so closing or switching a card
dismisses its own popup without touching an unrelated one.

</details>

**Swimlanes** - a board-wide list shown once per swimlane row.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6fd8e787e8ca0ee7e850f7c94d429d11253680a1">A board-wide list's collapse state no longer bleeds into every other swimlane's row of it</a>. Thanks to xet7.</summary>

A list with no swimlaneId of its own (shared/pre-migration) renders once
per swimlane in Swimlanes view - the same list document, one row per
swimlane. Collapsing/expanding it was a single Session/profile key keyed
only by the list's `_id`, so collapsing the list in swimlane 1's row also
collapsed swimlane 2's row of the very same list.
`Utils.getListCollapseState`/`setListCollapseState` now take an optional
swimlaneId and fold it into the storage key
(`${list._id}:${swimlaneId}`) - a bare list id, used outside Swimlanes view,
is unchanged, so existing stored state still applies exactly as before.
Every read/write site resolves it via the same `containerSwimlaneId`
pattern already used to scope that list's cards per swimlane, walking up
the enclosing Blaze data contexts.

Archive is unaffected by this: a list's archive/restore already scopes to
its own `_id`, and a board-wide list archived from one swimlane correctly
disappears from every swimlane's row of it - because it IS the one shared
list document, not a different one.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/520b9f56f">#3847's sticky list headers now also stay pinned while scrolling in the Swimlanes view</a>. Thanks to mikesutton and xet7.</summary>

[#2805](https://github.com/wekan/wekan/issues/2805): with `Boards.stickyListHeaders`
turned on (the #3847 toggle), a list's title still scrolled out of view
while scrolling down through several swimlane rows in the Swimlanes view -
the same toggle worked correctly in the default single-swimlane layout.

`position: sticky` only pins an element within its NEAREST ancestor that is
itself a CSS scroll container. `.swimlane`'s unconditional `overflow: auto`
made every swimlane row its own scroll container on both axes, so
`.list.list-sticky-header .list-header`'s sticky rule stuck within that
row's own box instead of reaching the real, page-level vertical scroll on
`.board-wrapper .board-canvas`. Since `.swimlane` itself never scrolls
internally in ordinary use - `.list` is already `height: 100%` of it, and
each list's own `.list-body` carries its card overflow - the row simply
moved out from under a header "stuck" to a box with nothing to scroll.

`.swimlane` keeps `overflow-x: auto`, still needed for a row of lists wider
than the viewport, but no longer captures the vertical axis
(`overflow-y: visible`), so the ancestor search continues up to
`.board-canvas` and the header pins against the real page scroll instead.
No second sticky-header mechanism was added; #3847's single
`stickyListHeaders` toggle and its `.list.list-sticky-header .list-header`
CSS rule are reused unchanged.

</details>

**Outgoing webhooks** - the global and per-board webhook that posts card activity out.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/691b096fafdd099da697aac895673683f36e3793">Confirmed the global webhook already fires when a card is edited, and pinned it with a regression test</a>. Thanks to Rishats and xet7.</summary>

[#4912](https://github.com/wekan/wekan/issues/4912) asked for an `act-editCard`
action on the global webhook so card edits could be tracked, same as other
card operations already were. Reading the current code shows this is already
the case: `server/models/cards.js` logs an `Activities` entry for title
changes (`a-changedTitle`, from the #3619 fix), description changes
(`a-changedDescription`, from the #5482 fix) and due/start/end/received date
changes, and `server/models/activities.js`'s `Activities.after.insert` hook
turns every logged activity into `act-${activityType}` and dispatches it to
any enabled integration on the card's own board OR the special global-webhook
id, filtered by `activities: { $in: [description, 'all'] }`. So editing a
card's title, description or dates already reaches a globally configured
webhook today, under those activity names. No code change was needed; a
source-pattern regression test (`tests/globalWebhookEditCardActivity.test.cjs`)
now pins this path so it cannot silently regress.

</details>

**Admin Panel** - the "Invite People" form under Accounts settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b2ca9962ba30a83ea4f831f44ccf05d2c7bb1d24">The Admin Panel's "Invite People" form now shows whether the invitation email actually sent</a>. Thanks to Rayene123 and xet7.</summary>

This form's `sendInvitation` call used a callback with an empty parameter
list, so it ignored both the error and the result - an admin who hit a
mail-send failure (for example the server's mail transport not being
configured, which `sendInvitationEmail` already reports as a descriptive
`Meteor.Error('email-fail', ...)`) saw nothing at all: the Send button
just stopped spinning either way, matching the silent "sending email
failed" confusion reported in
[#5707](https://github.com/wekan/wekan/issues/5707). The member "Invite
People" popup (`userHeader.js`) already surfaced this via a red/green
`#invite-people-infos` message, so `settingBody.js` now does the same:
it reads the callback's error argument and writes the same success/error
message into a matching `#invite-people-infos` element added to
`settingBody.jade`.

</details>

**User deletion** - the self-delete and admin-delete methods, and what they leave behind.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7bf50deb42d0c293c7db053261bde0f96ef71bd">Confirmed deleting a user already prunes their board/card references</a>. Thanks to unowen1939 and xet7.</summary>

[#6541](https://github.com/wekan/wekan/issues/6541) reported "users
disappearing": a board kept referencing a deleted user's id in its
members/assignees after the user document itself was gone, with no error
and no webhook. Reading the current `removeUser` method in
`server/models/users.js` (both the self-delete and admin-delete paths) shows
it already fires the same `Users.after.remove` hook that was added for
[#1289](https://github.com/wekan/wekan/issues/1289), which prunes the
deleted id out of boards, cards, lists and avatars via
`models/lib/userDeletionCleanup.js`. No code change was needed; the existing
regression test `tests/userDeletionCleanup.test.cjs` now documents that it
also covers this report.

</details>

**Rules (IFTTT)** - creating a rule, and its title.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52972b3e4cacdc451e5840709f505e98db285913">Clicking "Add Rule" with an empty title now shows a validation message instead of doing nothing</a>. Thanks to xeruf and xet7.</summary>

[#4294](https://github.com/wekan/wekan/issues/4294) described the rules
wizard as clunky: the "Add Rule" button visibly reacted to a click with an
empty title field, but nothing happened next, with no explanation why. The
field is now highlighted and a validation message appears instead of the
silent no-op.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52972b3e4cacdc451e5840709f505e98db285913">A rule created with no title now gets a sensible default composed from its trigger and action</a>. Thanks to xeruf and xet7.</summary>

Also from [#4294](https://github.com/wekan/wekan/issues/4294): once a
trigger and an action are chosen, `models/rules.js`'s `title` schema
generates a default like "When a card is added to list Doing, then set due
date" from the trigger/action's own human-readable descriptions (the same
strings the "View rule" details page already shows), via a new pure,
unit-tested helper, `models/lib/generateDefaultRuleTitle.js`. This applies
to every path that creates a rule - the classic wizard, the
`rules.createRule` server method, and the workflow canvas - so a rule is
never left unnamed; it can still be renamed afterwards with the rules
list's existing inline rename.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e643f0da71db3555f50c031a9fd532b092656d2f">The "send an email" rule action now links the card, and supports {card}/{cardLink}/{list}/{board}/{member} tokens</a>. Thanks to vossilius and ivan-paleo and xet7.</summary>

[#3301](https://github.com/wekan/wekan/issues/3301) and
[#3304](https://github.com/wekan/wekan/issues/3304) reported the same gap:
the email a "send an email" rule action sends carried no reference at all
to the card that triggered it - no title, no direct link, and no way to
pull in the list, board or the relevant member. `performAction()` already
built a `ruleVars` map and substituted `{name}` tokens in the email
subject/body (added for [#2475](https://github.com/wekan/wekan/issues/2475)),
so this extends that existing mechanism rather than building a new one:
`{cardLink}` resolves through `Card.absoluteUrl()`
(`models/lib/cardUrl.js`), the same helper card activity notification
emails already use, and `{member}` resolves the activity's relevant member
(who was added/removed/etc.), falling back to the acting user. `{card}`,
`{list}` and `{board}` are short aliases of the existing
cardname/listname/boardname variables. A new hint line next to the email
fields (`r-email-vars-hint`, translated to every locale) documents the
tokens directly in the rule-action UI. Independently of any template the
user configures, the card's title and link are now always appended to the
sent email body, so a rule set up before this change - with no tokens at
all - still gets a usable link.

`substituteVars()` moved out of `server/rulesHelper.js` into a new pure
`models/lib/ruleVarsSubstitute.js`, the way `models/lib/cardUrl.js` next to
it already is, so `tests/ruleEmailVars.test.cjs` can unit test token
substitution directly (including case-insensitivity, unknown tokens left
as literal text rather than crashing, and malformed braces not mistaken
for a token) alongside the automatic card-link footer and the translated
hint text.

</details>

**Subtasks** - the minicard's "N/M subtasks" completion badge.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2bc82f9ff5feee560f0fb8ee79a5210cf06f5658">Confirmed the subtask completion badge already counts archived subtasks correctly</a>. Thanks to ufalke and xet7.</summary>

[#4050](https://github.com/wekan/wekan/issues/4050) reported the minicard's
subtask badge stuck at "0/n" no matter how many subtasks were finished, and
expected giving a subtask an End Date to make it count. Reading the current
`models/cards.js` shows the counter itself is correct: `subtasksFinishedCount()`
counts subtasks with `archived: true` (the numerator), `allSubtasksCount()`
counts every subtask regardless of archived state (the denominator), and
`Card.archive()` - the actual way a subtask is finished - sets that flag and
recurses into its own children, correctly moving the badge from "0/n" toward
"n/n". `setEnd(endAt)` only ever writes `{ endAt }` and never touches
`archived`, by design: an end date is a due-date field, not a completion flag,
so setting one alone leaves the badge unchanged. No code change was needed;
`tests/subtaskCompletionCounter4050.test.cjs` now pins the numerator/denominator
source and both the archived-subtasks and end-date-only cases so this cannot
silently regress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4de77a4a5">An archived subtask now stays in the card's subtask list, shown as completed, with a toggle to hide it</a>. Thanks to Somantiq and xet7.</summary>

[#3409](https://github.com/wekan/wekan/issues/3409) reported that archiving
a subtask - the action that already moves the badge above from "0/n"
toward "n/n" - made it vanish from the parent card's own subtask list
instead of showing as completed, unlike a checked checklist item, which
stays visible with a struck-through, dimmed look. Reading
`client/components/cards/subtasks.jade` confirmed the list was built from
`currentCard.subtasks()`, and `models/cards.js`'s `subtasks()` queries
`{ archived: false }`, so an archived subtask was filtered out of the
query entirely.

The list now reads from `allSubtasks()` (no `archived` filter) through a
new `visibleSubtasks()` template helper in `subtasks.js`, so an archived
subtask stays in the list by default and is marked with an `is-completed`
class - a strikethrough title and a green checkmark icon, the same "done"
treatment `subtasks-item .item-title.is-checked` already gives a checked
checklist item. A "Hide completed subtasks" toggle above the list flips a
client-side `ReactiveVar` that filters archived subtasks back out for
anyone who wants the shorter list; it is a per-viewing preference of the
list, not card data, so no new `Cards` schema field was needed.
`tests/subtaskArchivedVisibility3409.test.cjs` pins the query change, the
completed styling, the toggle's wiring end-to-end, and that the #4050
counter logic above is untouched.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9aaecba8b1cf1a4219131cac14a66fb393d931af">Confirmed a newly-created subtask already lands in the parent card's own swimlane</a>. Thanks to savin-msk and xet7.</summary>

[#2732](https://github.com/wekan/wekan/issues/2732) asked that a subtask land
in the same swimlane as its parent card instead of some other or default one.
Reading `server/models/cards.js`'s `addSubtaskCard` method shows this is
already the case: a new subtask is not simply inserted onto the parent's own
board, it goes to a dedicated default subtasks board/list (see
[#3868](https://github.com/wekan/wekan/issues/3868)/[#5788](https://github.com/wekan/wekan/issues/5788)/[#2256](https://github.com/wekan/wekan/issues/2256)),
so its `swimlaneId` can never literally equal the parent's - swimlanes are
scoped to a single board. The method already resolves the correct swimlane on
that destination board by TITLE instead: it reads the parent card's own
swimlane, reuses the swimlane on the target board whose title matches it, and
only falls back to the target board's default swimlane when no such swimlane
exists there yet. No code change was needed;
`tests/subtaskSwimlaneInheritance2732.test.cjs` now pins the parent-swimlane
lookup, the title-matching reuse, the default-swimlane fallback branch, and
that the inserted card carries the resolved `swimlaneId`, so this cannot
silently regress.

</details>

**My Cards** - the cross-board "cards assigned to/watched by me" list.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7db5429b">Clicking a card in My Cards now opens it in the popup instead of navigating away to its board</a>. Thanks to javen9881 and xet7.</summary>

[#3640](https://github.com/wekan/wekan/issues/3640) reported that clicking a
card in My Cards - which lists cards from many boards on one page - followed a
plain `<a href="board-url">` link and navigated the whole browser to that
card's own board, losing the user's place in the My Cards list. Reading
`client/components/main/myCards.jade`/`.js` confirmed the bug was still
present: the card link carried no click handler at all.

Fixed by reusing the mechanism the app already uses to open a card from other
cross-board contexts - global search results
(`client/components/cards/resultCard.js`) and the Board Table view's Edit link
(`client/components/boards/tableView.js`): intercept the click, subscribe the
`popupCardData` publication for that card, set the `popupCardId`/
`popupCardBoardId` Session variables, and open the shared `cardDetails` popup
in place. The link keeps its `href`, so middle-click/ctrl-click and a no-JS
fallback still work.
`tests/myCardsInlineCardPopup.test.cjs` pins the click handler's
`preventDefault()`, the popup-opening call sequence, and that it matches the
same shape used by `resultCard.js` and `tableView.js`.

</details>

**Admin Panel and Public Boards** - inviting people, deleting a user, and viewing a public board while logged out.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ccd70f45">Pinned Admin Panel invite/delete people and logged-out public board viewing with regression tests</a>. Thanks to Cupara and xet7.</summary>

[#3310](https://github.com/wekan/wekan/issues/3310) (2020) asked for three
things. Reading the current code shows all three are already there, in some
cases in a stronger form than what was asked for: Admin Panel -> Settings'
"Invite via Email" (`settingBody.js`, `sendInvitation`) already generates and
mails a per-invitee invitation code rather than a single static one an admin
would have had to hand out; Admin Panel -> People already deletes a user
account - a row's "more settings" link opens the settingsUser popup, whose
`#deleteButton` calls the `removeUser` server method; and a public board's own
URL (`/b/:id`, `/b/:id/:slug`) carries no sign-in requirement in the router,
and the board publication's visibility selector already matches
`{ permission: 'public' }` for a subscriber with no `userId` at all
(`models/lib/boardVisibilitySelectors.js`). No code change was needed;
`tests/issue3310FeatureRequests.test.cjs` now pins all three so they cannot
silently regress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d9282359e27a0e396daa50e1951d40430d005b6">A global Admin Panel admin can now edit or delete any board, even one none of whose members are left</a>. Thanks to relikd and xet7.</summary>

[#3249](https://github.com/wekan/wekan/issues/3249): a board created by a
user who later left the organization - or was removed as an admin - ended
up with nobody able to touch it, not even through the Admin Panel: renaming
it, changing its description/visibility, adding a label, removing a member
or archiving/deleting it all went through the board's own `Boards.allow`
`update`/`remove` rule, which only checked `board.hasAdmin(userId)` against
that board's own member list. `inviteUserToBoard` already bypassed this for
a global site admin (`user.isAdmin`); the whole-board update/remove rule did
not, so an orphaned board's settings and membership were permanently stuck.

`server/lib/utils.js` gets `isBoardAdminOrSiteAdmin` (a small pure decision
function) and the async `allowIsBoardAdminOrSiteAdmin` wrapper that looks up
the caller's global `isAdmin` flag; `server/permissions/boards.js`'s
`update`/`remove` rules now use it instead of the board-only
`allowIsBoardAdmin`. The bypass is scoped to that one rule only - the
narrower `rules`/`actions`/`triggers`/`cardComments` allow rules
deliberately keep the board-only check, which a negative test pins so the
wider bypass cannot spread there by accident.

Two related asks from the same report turned out to already be covered:
permanently deleting a board (as opposed to only archiving it) already
exists as the Global-Admin-only, feature-flag-gated "Archive -> permanent
delete" action added for [#6643](https://github.com/wekan/wekan/issues/6643)
(`permanentlyDeleteArchivedBoards`, `server/models/boards.js`), which never
required board membership in the first place; and Teams/Organizations
already auto-grant board access, including to a member who joins the team
*after* it was added to the board ([#4593](https://github.com/wekan/wekan/issues/4593),
`models/lib/teamBoardMemberSync.js`). The report's third ask - a "semi-open"
board tier visible to every logged-in user but excluded from search-engine
indexing - is a real gap (WeKan's `permission` field is only
`public`/`private`, with no noindex concept anywhere), but changes what
"public" means across the Public Boards page, the visibility selector and
sitemap/robots routing, so it needs a maintainer decision on the exact rule
before it is built; see TODO Later.

</details>

- [Confirmed #2413 ("Site admins to see all boards and change any board
  permissions") is the same request as #3249 and is already resolved by the
  fix above; annotated the regression test accordingly](https://github.com/wekan/wekan/commit/677c60fb2).
  Thanks to JackNWeems and xet7.

**Checklists** - individual items inside a checklist.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af847bd08">A Worker can now check/uncheck a checklist item, without gaining edit or delete</a>. Thanks to mweiss237 and xet7.</summary>

[#3307](https://github.com/wekan/wekan/issues/3307): a board member with the
Worker role could not check or uncheck a checklist item at all - the checkbox
was gated behind the same `canModifyCard`/`write` check that also gates
editing and deleting an item, both on the client
(`client/components/cards/checklists.jade` never drew a clickable box) and on
the server (the `ChecklistItems.allow().update()` rule refused the write).

Widening `write` for Worker was not the fix - that would also hand Workers
edit and delete, which the reporter explicitly did not want. Instead this
gives checking/unchecking its own, narrower, field-level capability, the same
shape as the existing move/self-assign carve-out for cards
(`models/lib/workerCardWrite.js`, #3189):
`models/lib/workerChecklistItemToggle.js` allows a Worker to `$set isFinished`
and nothing else on a checklist item, enforced in
`server/permissions/checklistItems.js`. The client mirrors it with
`Utils.canCheckChecklistItem` / a `canCheckChecklistItem` Blaze helper, so the
checkbox is drawn under that helper while the rest of the row - title edit,
drag handle, due-date edit, delete - still requires the full write
capability a Normal member has.

</details>

**Custom fields** - the board's custom-field definitions and how they display.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf2fa4179">An auto-create custom field now shows on every quick-added card, not only the first one</a>. Thanks to coleyon and xet7.</summary>

[#2392](https://github.com/wekan/wekan/issues/2392): a custom field with
"Auto create field to all cards" (or "Always on card") and "Show field
label on minicard" enabled applied correctly to the first card created
through a list's quick-add form, but not to any card created after it in
the same session.

`client/components/lists/listBody.js`'s `addCardForm` computed the
board's automatic custom fields exactly once, inline in `onCreated`, and
reused that same value for every submission. The form's own `reset()` -
meant to clear "More options", labels and members between cards - set
that list back to `[]` unconditionally instead of recomputing it, so any
reset between two cards silently dropped the automatic field starting
with the second one. `onCreated` and `reset()` now share one
`automaticCustomFieldsForCurrentBoard()` helper that recomputes the
field list from the board's current custom-field definitions every time,
so it is (re)applied consistently rather than only once per form
lifetime. A regression test creates three cards in sequence and asserts
the automatic field is attached to all three, not just the first.

</details>

**Attachment uploads** - the attachment/avatar upload pipeline, both the
filesystem and cloud storage backends.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b03e77de">A file's real content is now checked against its declared type, and a spoofed upload is rejected</a>. Thanks to blaggacao and xet7.</summary>

[#3274](https://github.com/wekan/wekan/issues/3274): uploads were validated
against their client-declared MIME type/extension, but nothing compared that
declared type against the file's REAL content, so an executable renamed with
an image extension and a spoofed `image/jpeg` Content-Type (e.g. an `.exe`
renamed to `.jpg`) uploaded as if it were a genuine image.

Adds `models/lib/uploadContentMismatch.js`, a pure decision module (no
server, no filesystem) that flags only a MEANINGFUL, dangerous mismatch:
content that magic-byte-sniffs as an executable (Windows PE, ELF, Mach-O,
MSI, JAR/APK, ...) or a shell/batch script, while the declared type claims
to be an image, document, audio, video, plain text or archive. It
deliberately leaves compatible textual differences alone (`text/plain` vs
`text/csv`) and does not flag an executable that is honestly declared as
one - the existing allow-list already governs whether executables are
permitted at all - so a legitimate upload is never broken by a false
positive.

`models/fileValidation.js`'s `isFileValid()` - the single choke point
already shared by `models/attachments.server.js` and
`models/avatars.server.js` - now sniffs the file's real type with the
`file-type` package (MIT, already a dependency, used the same way for
extension correction in `models/lib/fileTypeCorrection.js`) and rejects a
dangerous mismatch before the file reaches its storage backend. A blocked
attempt is logged to Admin Panel -> Problems under the existing `file.mime`
security-log key (CWE-434, MimeBleed), wrapped so a logging failure can
never break the guard itself.

`tests/uploadContentMismatch.test.cjs` unit-tests the pure decision function
directly: positive cases for legitimate uploads of each declared type
(image, PDF, compatible textual mismatch, an honestly-declared executable),
negative cases for a Windows PE `.exe`, an ELF binary and a Mach-O binary
each disguised with an image/document type, and a shell/batch script
disguised the same way, plus a codebase-wide search proving no other
module re-implements its own bypassing magic-byte check and that both
upload paths (attachments, avatars) go through the same guard.

This is hardening, not a critical/remote-code-execution fix on its own: a
rejected, deleted stored file never executes on the WeKan server merely by
being stored, so it stays a normal bug-fix/security-hardening entry rather
than a CRITICAL SECURITY ISSUE.

</details>

**Board search** - the sidebar search box and the per-list quick search.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/475f14c4a">It now also matches text inside card comments, not just title/description/custom fields</a>. Thanks to javiloncho and xet7.</summary>

Board.searchCards() (the sidebar search and the per-list quick search) only
matched a card's title, description and custom fields; global search already
matched comment text, but the board-scoped search did not, so a card whose
only match was in a comment never turned up. `matchingCommentCardIds()` was
added to `models/lib/cardSearch.js`: given the board's comments and the
search term it returns the card ids whose comment text matches, reusing the
same case-insensitive matching rule as the rest of the search, and
`Board.searchCards()` now ORs those card ids into its existing query.
`tests/cardSearch.test.cjs` covers a comment-only match, a non-match, and
case-insensitivity.

</details>

**Notification emails** - the HTML-formatted card/board activity notification email.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6da4ebe9652f42e8923aa24afc52eb4885f7b51">A card/board URL in an HTML notification email is now a real clickable link</a>. Thanks to papimla and xet7.</summary>

The HTML-formatted notification email (`server/notifications/email.js`,
`htmlEnabled` gated on `RICHER_CARD_COMMENT_EDITOR`) built its body from the
same plain-text line used for the non-HTML email - actor, translated
description, then the card/board's absolute URL - and merely escaped and
`<br/>`-ified the whole thing. That left the URL sitting as bare text a
mail client might happen to auto-link, not a real `<a href>` the way every
other part of the HTML email is markup. `buildHtmlNotificationLine()`
(`models/lib/emailNotificationSafety.js`) now builds the HTML body
directly: the actor name and translated description are still escaped
exactly as before (this is the same code path MailTitleBleed hardened, so
that stays unchanged), and the URL is wrapped in
`<a href="...">...</a>` - itself escaped before going into both the href
attribute and the link text, so neither an HTML-active title nor a
malicious URL can break out of the tag. The plain-text (non-`htmlEnabled`)
email is untouched and still sends the bare URL as text, which is correct
there.

</details>

**Card dates** - the Received/Start/Due/End date popup shared by every date field, a vote and a planning poker end date, and a date custom field.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fdc84e2e6">The time field now accepts an hour alone, and an empty time defaults to midnight instead of being rejected</a>. Thanks to fakaki and xet7.</summary>

`<input type="time">` only ever reports a complete `HH:mm` value to
JavaScript - typing just the hour ("13") and moving on leaves the browser's
own `.value` empty, so the popup could not tell "13" typed from nothing
typed at all, and the digits the user entered were silently thrown away.
The date popup's shared time field
(`client/components/forms/datepicker.jade`, one `editDateForm` used by
Received/Start/Due/End, vote end, poker end and date custom fields alike)
is now a plain text input instead, so a partially typed time actually
reaches the parser.

`parseTimeInput()` (`imports/lib/datePickerTime.js`) is the new shared,
pure parser: an hour alone ("13", "7"), with or without am/pm ("1pm",
"11:30 PM"), normalizes to that hour at `:00`; a blank field parses as
`00:00`; the existing `HH:mm` format is unaffected; anything else (letters,
an hour above 23, a minute above 59, a 12-hour hour outside 1-12) is still
rejected exactly as before. `client/lib/datepicker.js`'s `change` and
`submit` handlers on the shared form both call it, so due, start, end and
received dates, vote/poker end dates and date custom fields all get the
same looser input the same way. The submitted-empty-field behavior added
for [#1502](https://github.com/wekan/wekan/issues/1502) - falling back to
the popup's own configured default time (17:00 for due dates, "now" for
received/start/end) rather than always midnight - is unchanged; the new
midnight default is `parseTimeInput`'s own contract for callers that ask it
to parse an actually-empty string directly.

</details>

**Template sharing** - the picker opened by the card/list/swimlane/board "from template" buttons.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07f6cda95e56c36fb38fa1a95e9ddeb1e60d661e">The template picker now also searches a template board shared by another member, not only the user's own</a>. Thanks to ADDAH-temp and xet7.</summary>

[#2684](https://github.com/wekan/wekan/issues/2684) asked to let a team
share board/card templates with other members, not just the creator. A
template-container board is a regular board with a special `type`, so it
already gets normal board membership - adding another user as a board
member of a template board is the existing, generic sharing mechanism,
exactly like sharing any other board, and
`server/publications/boards.js`'s `boardTemplates` publication already
lists any template-container board a user is a member of, not only ones
they personally created (it is scoped through the same
`boardVisibilitySelectors()` every other board-visibility check uses).

The actual gap was narrower: the "apply a template" picker
(`Template.searchElementPopup` in `client/components/lists/listBody.js`)
was hard-wired to only the current user's own
`profile.templatesBoardId`, so a template board shared by another member
never showed up there even though it already appeared in the All Boards
"Templates" view. The picker now also subscribes to `boardTemplates` and
offers any OTHER template-container board the user is a member of, via a
new dropdown that defaults to the user's own template board exactly as
before.

</details>

**Card description and comments** - the markdown rendered from a card's description and comment text.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0aa1702c0">A "- [ ] Task" / "- [x] Done" checklist line now renders as a real checkbox, not literal HTML text</a>. Thanks to rodrigocipriani and xet7.</summary>

[#2419](https://github.com/wekan/wekan/issues/2419) (2019): writing GFM
task-list syntax in a card description showed the reader
`<input disable="" type="checkbox"/> Task` as plain text instead of a
checkbox. WeKan's markdown renderer
(`packages/markdown/src/template-integration.js`) is plain `markdown-it`
with no task-list extension, so it never emitted an `<input>` element in
the first place, and `packages/markdown/src/secureDOMPurify.js`'s
sanitizer also listed `input` in `FORBID_TAGS` - so even a raw `<input>`
typed directly into the text would have been stripped.

A small `markdown-it` core rule, added after the emoji/math plugins,
detects the leading `[ ]`/`[x]`/`[X]` marker on a list item's first line
and replaces it with a disabled `<input type="checkbox">` (checked to
match `x`/`X`); everything else about the line renders exactly as before.
`secureDOMPurify.js` now allows `input` through, but only in the exact
shape this renderer emits: `uponSanitizeElement`/`uponSanitizeAttribute`
hooks reject any `type` other than `checkbox` and any `input` carrying a
`name`, `value`, `form` or `formaction` attribute, so a card cannot smuggle
in a live text/password field or a form control - `form` itself stays
forbidden.

The checkbox renders correctly and reflects the source accurately, but is
deliberately left **disabled** (not clickable): toggling it would mean
mapping a click on rendered HTML back to the exact byte offset inside the
card's raw markdown source and saving the edit, which is a materially
larger, separate feature from fixing the "renders as literal text" bug
this issue reported. `tests/markdownTaskListCheckbox.test.cjs` renders
`- [ ] Task` / `- [x] Done` through the real plugin and asserts an
unchecked/checked `<input type="checkbox">` is produced, that a plain
bullet list and ordinary inline markdown are unaffected, and that
`secureDOMPurify.js` still allows the tag through restricted to
checkbox-only.

</details>

**Archive sidebar** - the sidebar tab that lists archived cards, lists and swimlanes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c77c86bb">An archived card now opens in the full card-detail popup, with a Restore action of its own</a>. Thanks to therampageradoagent and xet7.</summary>

[#1504](https://github.com/wekan/wekan/issues/1504): the Archive sidebar's
card tab drew each archived card with the same narrow shared minicard every
other list uses, but clicking it did nothing - `sidebarArchives.js` had no
`.js-minicard` click handler at all, so the only way to see more than the
minicard's own cramped preview was the separate Restore/Delete text links
beside it.

Clicking an archived card now opens the SAME full card-detail popup
(`cardDetailsPopup` / `Template.cardDetails`) a normal board card opens -
full width and height, every field, all the normal card-detail
functionality - reusing the exact `popupCardId`/`popupCardBoardId` +
`Popup.open('cardDetails')` mechanism `myCards.js` and `resultCard.js`
already use for their own cross-context minicards, rather than building a
parallel "archived card preview" component.

That full view had nowhere to put the card back once it was open: its
action menu hid "Archive" while a card was already archived, but offered no
opposite action. Both copies of the action menu (the `canModifyCard` one and
the read-only one) now show a "Restore" entry in exactly that place,
calling the same `card.restore()` mutation the Archive sidebar's own
Restore link already uses, with the same target-list fallback popup
(`restoreArchivedCardToListPopup`) for a card whose list was itself archived
or deleted, so `canBeRestored()` is never asked about a missing list.

`tests/archiveSidebarFullCardDetails.test.cjs` pins the click handler to the
shared `cardDetails` popup template rather than a bespoke preview, checks
both action-menu copies gained the Restore entry where Archive used to be
the only option, and confirms the Restore action reuses the existing
`card.restore()` call and target-list fallback popup.

</details>

and has the following documentation improvement:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/87c1e82ec7d2b9579fd3255a0a9cfc7a702ef38c">Added an example Authelia OAuth2/OIDC configuration alongside the existing Keycloak and Zitadel ones</a>. Thanks to tamaskan and xet7.</summary>

[#4210](https://github.com/wekan/wekan/issues/4210) asked for example
settings to log into Wekan through [Authelia](https://www.authelia.com/), a
self-hosted authentication/SSO server that speaks OIDC. Added
`docs/Features/Login/Authelia.md` with Snap and Docker settings mapped to
Authelia's own OIDC endpoints (`authorization_endpoint`, `token_endpoint`
and `userinfo_endpoint`, all under `/api/oidc/`, per Authelia's OpenID
Connect documentation), in the same format already used for Keycloak and
Zitadel, including a note that Authelia does not yet implement OpenID
Connect RP-Initiated Logout so `OAUTH2_LOGOUT_ENDPOINT` should stay unset
for it. Linked from `docs/README.md`'s Login Auth list and the provider
list in `docs/Features/Login/OAuth2.md`, and added the matching commented
`OAUTH2_*` example block to `docker-compose.yml` and every other
`docker-compose-*.yml` variant that carries the OAuth2 provider examples,
keeping their `wekan` service identical.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9c046dd2eba0ea6e0ef8bd535e4bf0078d30288">Added a Using WeKan for Scrum guide mapping stories, story points, checklists and sprints onto existing features</a>. Thanks to lonix1 and xet7.</summary>

[#3087](https://github.com/wekan/wekan/issues/3087) asked, as a question
rather than a feature request, how to run a basic Scrum process on WeKan:
cards as user stories with a story-points field, checklists for acceptance
tests, a board per sprint, and a separate planning/backlog board. All of
that is already possible, so instead of new code this adds
`docs/Features/Cards/Scrum.md` confirming the mapping against WeKan's
actual current features - including the numeric custom field's "show sum
at top of list" badge (`models/customFields.js`'s `showSumAtTopOfList`,
already scoped per swimlane) as a way to total story points per
list/sprint - and linked from `docs/README.md`'s features list.

</details>

**Notification emails** - the activity-notification email's subject line.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ad4613099">Covered that a card activity's email subject already includes the board and card name</a>. Thanks to Logicbloke and xet7.</summary>

[#1408](https://github.com/wekan/wekan/issues/1408) asked that a
card-activity notification email's subject include the board/card name
(e.g. `[Board Name] Card Title`) instead of a generic subject, so email
clients like Gmail thread notifications per card rather than lumping every
notification together. Reading the current code
(`server/models/activities.js`, `server/lib/activityNotificationTitle.js`,
`server/notifications/email.js`) shows this is already the DEFAULT,
unconditional behavior on every install: any activity with a `cardId` sets
`title = ACTIVITY_NOTIFICATION_TITLE.CARD`, which
`formatActivityNotificationTitle()` renders as `[Board] Card`, and
`server/notifications/email.js` builds the email subject from exactly that
value before any admin configuration is considered. The optional
admin-customizable subject template added for
[#2022](https://github.com/wekan/wekan/issues/2022) (Admin Panel -> Email
Templates, `activityEmailSubjectTemplate`) only REPLACES this default when
an admin explicitly sets it - it is not required to get a per-card subject.
`tests/notificationEmailSubjectFormat.test.cjs` adds regression coverage
for the default: it drives `formatActivityNotificationTitle()` directly for
a representative card activity and asserts the subject contains both the
board and card name in the `[Board] Card` shape, asserts it is not a
generic constant, confirms every `activity.cardId` branch tags itself with
the card-title layout, and confirms the admin template only overrides the
already-board/card-aware default rather than being needed for it.

</details>

and has the following developer-tooling improvement:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2e752c1e9">Extracted the OIDC RP-Initiated Logout URL builder into a pure, tested helper</a>. Thanks to Dzordzu and xet7.</summary>

[#2905](https://github.com/wekan/wekan/issues/2905) asked for Single Logout
(SLO): logging out of Wekan should also end the identity provider's own SSO
session for OIDC/OAuth2 providers that support RP-Initiated Logout (Keycloak's
`/realms/<realm>/protocol/openid-connect/logout`, for example), via an
optional `OAUTH2_LOGOUT_ENDPOINT` env var. This was already built for
[#6158](https://github.com/wekan/wekan/issues/6158) -
`getOauthLogoutUrl()` in `server/models/settings.js`, wired into
`config/accounts.js`'s `onLogoutHook()`, documented in
[Keycloak.md](https://github.com/wekan/wekan/blob/main/docs/Features/Login/Keycloak/Keycloak.md)
and the `docker-compose.yml` OAuth2 example blocks - so #2905 needed no new
feature. When `OAUTH2_LOGOUT_ENDPOINT` is unset (the default), logout is
unchanged.

Its URL-building logic lived inline in the Meteor method with no direct test
coverage. Extracted it to `server/lib/oauthLogoutUrl.js`'s pure
`buildOauthLogoutUrl()` (endpoint/serverUrl/clientId/redirectUri in, the
end_session URL out, following the OpenID Connect RP-Initiated Logout 1.0
spec's `post_logout_redirect_uri`/`client_id` params), mirroring
`server/lib/ldapPasswordLoginGuard.js`'s plain-Node testable style.
`getOauthLogoutUrl()` now calls it; behavior is unchanged. Added
`tests/oauthLogoutUrl.test.cjs`, covering the default no-op, a Keycloak-shaped
path endpoint resolved against `OAUTH2_SERVER_URL`, an absolute endpoint, an
endpoint that already carries a query string, and percent-encoding of the
redirect URI.

</details>

and closes the following already-fixed issue:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ef7f4a07">Confirm #2498 (linked card's minicard cover) stays fixed</a>. Thanks to javen9881 and xet7.</summary>

[#2498](https://github.com/wekan/wekan/issues/2498): a card that links to
another board's card ("Link to board") does not show that linked card's
cover image on its own minicard. `client/components/cards/minicard.js`'s
`cover()` helper used to read `this.coverId` directly, and a linked card
(`type: 'cardType-linkedCard'`) has no `coverId` of its own - it is a
placeholder whose real content lives on the card `linkedId` points at - so
the cover never rendered.

This is the same fault as [#5666](https://github.com/wekan/wekan/issues/5666)
("Minicard connection without images"), already fixed by commit 9ef7f4a07:
`models/lib/linkedCardCover.js`'s `resolveCoverId()` hops a linked card to
the real card via `getCard(this.linkedId)` and reads its `coverId`,
mirroring how `getTitle`/`getDue`/the other linked-card getters already
resolve through `linkedId`. `tests/linkedCardCover.test.cjs` (8 checks,
still passing against current source) is a pure-Node regression guard
covering both directions: a linked card resolves to the real card's cover,
a plain card keeps using its own, a stray `coverId` on the placeholder is
ignored in favor of the real card's, and an unloaded/missing real card
returns no cover instead of throwing. No new code change was needed here;
the issue is closed with a pointer to where it was already fixed.

</details>

and adds a GDPR-friendlier alternative to deleting an account:

**Member Settings and Admin Panel / People** - anonymizing an account.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac4b7e75f">Anonymize an account, self-service or admin-triggered, instead of deleting it</a>. Thanks to Akuket and xet7.</summary>

[#2731](https://github.com/wekan/wekan/issues/2731): the only way to leave no
personal data behind was Delete Account, which also hard-deletes the Users
document and prunes every board/card/comment reference to it - losing
attribution and history entirely, which is more than GDPR requires and more
than some users want to lose.

`anonymizeUser` (`server/models/users.js`, its decision and update-shape logic
split into `models/lib/userAnonymization.js` the same way removeUser's cleanup
plan already lives in `models/lib/userDeletionCleanup.js`) overwrites the
username, full name, email address and avatar with an anonymized placeholder
and sets `loginDisabled: true` - the same flag `server/authentication.js`'s
`validateLoginAttempt` already gates login on - so the account can no longer
log in. It does NOT prune or touch a single board/card/comment/activity
reference: those keep pointing at the same `userId`, which now simply
resolves to the anonymized name, keeping the account's past activity
structurally intact.

Callable both by the account owner on themselves (a new "Anonymize account"
button next to Delete in the Edit Profile popup,
`client/components/users/userHeader.jade`/`.js`) and by an admin on any other
user (next to the existing delete action in Admin Panel → People,
`client/components/settings/peopleBody.jade`/`.js`), each behind its own
irreversible-warning confirmation popup matching the existing delete
confirmation's pattern. The last remaining administrator cannot be
anonymized, mirroring removeUser's same guard.

No Admin Panel → Problems entry was added: that log is for attempts an
attacker controls, and there is no attacker here - anonymizing is a
privileged action an admin takes on purpose, or a member acting on their own
account. WeKan has no general admin-action audit log to hook into
(`server/lib/recoveryAudit.js` is board-deletion-specific); the audit trail
for this action is the new `anonymized`/`anonymizedAt` fields persisted on
the Users document itself and visible in Admin Panel → People.

`tests/userAnonymization.test.cjs` is a pure-Node regression guard (no
Meteor) covering: PII fields are scrubbed and `loginDisabled` is set; the
update never touches a reference-shaped field (`members`, `assignees`,
`watchers`, `boardId`, …) - the negative test distinguishing this from
removeUser's pruning; the same predicate `server/authentication.js` uses
denies login afterward; both the self-service and admin-triggered paths are
allowed; and a non-admin cannot anonymize another user, nor can the last
administrator be anonymized.

</details>

and adds Sign in with Apple login support:

**OAuth2/OIDC login** - the generic provider client Keycloak, Authelia and now Apple share.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/517bee3f0">Server-signed JWT client secret for OAuth2, enabling Sign in with Apple</a>. Thanks to xet7.</summary>

[#2458](https://github.com/wekan/wekan/issues/2458) asked for "Sign in with
Apple". Apple's login is OIDC-compatible, so it works through Wekan's existing
generic OAuth2/OIDC client - except its "client secret" is not a static
string like Keycloak's or Authelia's: it must be a short-lived JWT the server
signs itself (ES256), using a private key downloaded once from Apple's
developer portal.

`models/lib/oauth2ClientSecretJwt.js` mints that JWT using only Node's
built-in `crypto` module - no new dependency, since ES256 signing with
IEEE-P1363 signature encoding (the format a JWT requires) has been supported
since Node 12. It is opt-in via a new `OAUTH2_SECRET_JWT_KEY_PATH` env var
(plus `OAUTH2_SECRET_JWT_ISSUER`/`_KEY_ID`/`_AUDIENCE`/`_SUBJECT`/
`_EXPIRES_IN`); when unset (the default, and every existing provider's
configuration), `packages/wekan-oidc/oidc_server.js` falls back to the static
`OAUTH2_SECRET` exactly as before, so Keycloak, Authelia and every other
provider are unaffected.

Apple's other quirk - it returns the user's name only on the very first
authorization, never again - needs no special-casing: `Accounts.onCreateUser`
(`server/models/users.js`) already copies the OIDC fullname/email claims into
the user's `profile` only once, at account creation, and never overwrites
them on later logins (Meteor's `updateOrCreateUserFromExternalService` only
touches `services.oidc.*` for a returning user, not `profile.*`).

`docs/Features/Login/Apple.md` documents Apple's fixed endpoints
(`https://appleid.apple.com/auth/authorize`/`/auth/token`) and the new env
vars, in the same format as the Keycloak/Authelia docs, and is linked from
`docs/Features/Login/OAuth2.md`'s provider list.
`tests/oauth2ClientSecretJwt.test.cjs` is a pure-Node regression guard
covering the minted JWT's header/claims shape, that its ES256 signature
verifies against the matching public key and fails against another key, and
the negative case: with the new env vars unset, no JWT is generated and the
static-secret path is untouched.

</details>

and has the following developer-tooling fix:

**Multi-select actions** - the checkbox multi-select sidebar's action bar.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02e028276">Add regression coverage confirming Move/Copy selection already works across boards</a>. Thanks to gerroon and xet7.</summary>

[#2155](https://github.com/wekan/wekan/issues/2155) asked to move/copy several
selected cards to a different board at once, through an explicit action
rather than drag-and-drop. That action already exists: WeKan's checkbox
multi-select sidebar (`client/components/sidebar/sidebarFilters.jade`/`.js`)
has had "Move selection" and "Copy selection" buttons since
`82db0800e` ("Move/Copy selection and Move/Copy swimlane: one dialog each,
not two."), each opening the same board/swimlane/list destination picker used
throughout the app (`selectionDestinationPicker`). The board `<select>` lists
every board the user is a member of - not only the current one - and Done
walks the whole selection in order, calling `card.move()` for Move or
`copyCard` + `.move()` for Copy, so it already covers the cross-board case
this issue asked for. This is distinct from
[#3298](https://github.com/wekan/wekan/issues/3298), which is about
drag-and-drop specifically inside the Bigboard view.

`tests/cardMultiSelectionMoveCopyToBoard.test.cjs` is a pure-Node source-read
regression guard pinning: the Move/Copy selection buttons and popups exist;
the board picker queries every board the user belongs to rather than
filtering to the current board; the shared Done handler iterates the full,
selection-scoped card list (`MultiSelection.getMongoSelector()`) rather than
a subset; Move applies `card.move()` with the chosen board/swimlane/list/sort
position; and Copy creates the new card on the destination board first and
moves that new card into place, never the original - with a negative case
confirming a failed copy is skipped rather than falling through to touch an
unrelated card.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c7524db05a492e04b047e7523b916ccfb9df0c6">Add a one-click "Archive all cards in this list" entry to the List menu</a>. Thanks to bkiehle and xet7.</summary>

[#3383](https://github.com/wekan/wekan/issues/3383) asked for a button that
archives every card of a single list at once, instead of moving them to
Archive one at a time. The checkbox multi-select sidebar already reaches
this indirectly - "Select all cards in this list" from the List hamburger
menu, then "Archive selection" from the sidebar - but that is two menus for
one outcome, so the List hamburger menu (`listActionPopup`,
`client/components/lists/listHeader.jade`/`.js`) gets its own
"Archive all cards in this list" entry next to the existing "Select all
cards in this list" one. It reuses the exact same card-id scoping ("Select
all cards" above: the current swimlane in Swimlanes board view, the whole
list otherwise) and hands the list off to the SAME server method the
sidebar's "Archive selection" button already calls -
`archiveSelectedCards(boardId, cardIds)` in `server/models/cards.js`, added
for [#6608](https://github.com/wekan/wekan/issues/6608) - so no new
archiving logic was written, only a second caller of the existing one,
behind a confirmation popup (`listArchiveCardsPopup`) in the same
confirm-then-act shape "Archive list" (the list itself, not its cards)
already uses. The `list-archive-cards`/`list-archive-cards-pop` translation
strings already existed in every locale file - added ahead of the feature -
so this commit only had to wire them up.

`tests/listArchiveAllCards3383.test.cjs` is a pure-Node source-read
regression guard pinning: the menu entry and its confirmation popup exist;
the click handler is gated behind `Popup.afterConfirm('listArchiveCards', …)`;
the scoping matches "Select all cards" exactly; the handler calls the shared
`archiveSelectedCards` method rather than looping `card.archive()` or
`Cards.update` itself; an empty list never reaches the server call; the
server still defines exactly one `archiveSelectedCards` method (no
duplicate); and every locale file already carries both translation keys.

</details>

and closes the following already-fixed issue:

**Lists and swimlanes** - linking directly to one of them.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8ad1b61d">Confirm #1089 ("Link to this list") stays fixed</a>. Thanks to xet7.</summary>

[#1089](https://github.com/wekan/wekan/issues/1089) asked for "Link to
this list", and reported the same fault #6459 later named exactly: the
list-more popup's link box read the nonexistent `{{ rootUrl }}` template
helper, so the box was always empty - there was no working list link,
and no swimlane link at all.

Already fixed by commit e755b60b3 ("Link to a swimlane or a list, the
way you can link to a card."): `models/lib/boardItemUrl.js` builds a
real relative path for each, `List#absoluteUrl`/`Swimlane#absoluteUrl`
resolve it through `Meteor.absoluteUrl()`, and
`listHeader.js`/`swimlaneHeader.js`'s copy-link handlers call it -
confirmed by reading the current code, not just the commit history.
`tests/listSwimlaneLinkRootUrlIssue1089.test.cjs` is a pure-Node
regression guard pinning both directions: the list and swimlane
copy-link paths use the real `Meteor.absoluteUrl()` API, and (negative)
no `.jade` template or `.js` helper anywhere in `client/` still
references a bare/broken `rootUrl` - either the exact string #1089
reported or a `rootUrl` template helper, which never existed and was
the bug. No new code change was needed here; the issue is closed with a
pointer to where it was already fixed.

</details>

Thanks to above GitHub users for their contributions and translators for
their translations.

# v11.68 2026-09-10 WeKan ® release

**In short:** the **Board View menu**'s nine report charts - Dashboard,
Burndown, Burnup, Cumulative Flow, Control Chart, Lead/Cycle Time, Flow
Efficiency, Throughput Histogram and WIP Run - are implemented, computed from
the current board's own cards, lists and activity history. Every chart page,
and the **Gantt** view, gain **Export to PDF** and **Export to Excel**
buttons matching the existing card/board export look.

This release adds the following feature:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3abc1078c">Implement the 10 board report charts and Gantt/chart PDF+Excel export</a>. Thanks to xet7.</summary>

The Board View menu's Dashboard, Burndown, Burnup, Cumulative Flow, Control
Chart, Lead/Cycle Time, Flow Efficiency, Throughput Histogram and WIP Run
entries opened a plain "not implemented yet" page. Each now computes and
renders its chart from this board's own Cards/Lists/Activities, per
docs/Features/Reports/charts.tsv's calculation descriptions - plain HTML/CSS
bars and a data table, no new charting dependency.

Every chart page, and the Gantt view, gets Export to PDF / Export to Excel
buttons that reuse the existing card/board export renderers (the PDF line/bar
builder, the Excel workbook styling) through the same public-board /
authToken / logged-in-user auth gate every other export route already uses.

Completion date is `card.endAt || card.archivedAt` (WeKan has no dedicated
"Done" list flag); WIP Run's limit line only draws when a list's own WIP
limit is enabled (no invented board-level schema); Flow Efficiency's "active"
time is `card.spentTime` (WeKan does not track per-list queue time). Each
deviation from charts.tsv is documented where the calculation is.

`models/lib/chartCalculations.js` (20 tests), `models/lib/chartExportRows.js`
(8 tests) and the export routes' auth shape (10 tests) are covered by new
regression tests; `tests/boardViewMenu.test.cjs` is updated for the now-real
views. Not verified: actual Blaze rendering and generated PDF/XLSX bytes (no
browser/Meteor runtime available) - matched syntactically against the
existing statsView/timeView views and exporters instead.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v11.67 2026-09-10 WeKan ® release

**In short:** **Board export to .zip (with attachments)** answered a bare 500
error on every request; the archiver dependency's v8 API change was missed in
one of the two places WeKan builds a zip on the server. Issue #6681 (OIDC
redirect-style login loop) is confirmed already fixed and closed.

This release fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c04e5314">Board export to .zip (with attachments) answered a bare 500 error</a>. Thanks to xet7.</summary>

`models/server/ExporterZip.js` still called the archiver package the v7 way -
`const archiver = require('archiver'); archiver('zip', {...})`. archiver@8
(package.json pins `^8.0.0`) is ESM-only and exports classes - `{ Archiver,
ZipArchive, TarArchive, JsonArchive }` - with no callable default, so that
call threw `TypeError: archiver is not a function` synchronously, before the
`exportZip` route (models/export.js) had written any response header.
`safeRoute` (server/apiMiddleware.js) then answered a bare 500 with no
board-specific detail - every "export board -> .zip (with attachments)"
request, for every board, since archiver was bumped to v8.

`server/methods/backup.js` hit the identical break earlier and already fixed
it with `import { ZipArchive } from 'archiver'; new ZipArchive({...})`;
`ExporterZip.js` was the one call site that was missed. Fixed the same way.
`tests/exportZipArchiverApi.test.cjs` pins the correct API shape, that the
dead factory call is gone, and scans every server-side source file so a
second call site cannot reintroduce the same break unnoticed.

</details>

and closes the following already-fixed issue:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3a217186">Confirm #6681 (OIDC redirect-style login loop) stays fixed</a>. Thanks to Alishara and xet7.</summary>

The reporter's `DEBUG=true` server log (getToken/getUserInfo repeating six
times in under twenty seconds, each with a fresh access token) is the same
signature the fix for #6681 already targets: `oauth2-login-style: redirect`
with `oidc-redirection-enabled: true`, `Template.userFormsLayout.onCreated`
re-firing the auto-redirect on the identity provider's bounce-back render
before the prior login had finished. That was fixed by commit 89682c251
("Fix OIDC auto-redirect looping until the provider rate-limits it"), which
landed before v11.62 - several releases before this one - so a build the
reporter's log shows as v11.60 predates the fix, and the fix has not been
touched since. `tests/oidcAutoRedirectLoop.test.cjs` (6 checks) still
passes against current source, confirming the one-shot sessionStorage flag
still gates the auto-redirect and is still cleared on both login success
and failure. No new code change was needed; the issue is closed with a
pointer to where it was already fixed, and the reporter is asked to upgrade
to v11.62 or newer.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v11.66 2026-09-09 WeKan ® release

**In short:** the companion build repositories under `.tools/` move forward:
**node-patches** gets release-run diagnostics and a real PowerPC startup
check, **mongo-tools-patches** now tracks upstream `master` (not a tagged
release) with a Go 1.27 toolchain and expands to forty-three targets
including Android ARM64, and **mongosh-patches** drops telemetry and fixes
startup in a homeless container user. No WeKan application code changed.

This release updates the following bundled build tooling:

**Node.js (node-patches)** - release-run diagnostics and a real PowerPC startup check.

<details>
<summary><a href="https://github.com/wekan/node-patches/commit/985eed7">Warn when a platform's binary is missing from a completed release run</a>. Thanks to xet7.</summary>

A transient runner DNS glitch could fail just the upload step for one
platform while its build and checksum succeeded, and the run still finished
green with that platform quietly missing from the release. The "attach to
the release" step now compares the platforms actually present in `dist/`
against the full expected set and emits a `::warning::` naming whatever is
missing, pointing at `release-all-missing.yml` to build the gap - instead of
requiring someone to notice by comparing sixteen build jobs' logs by hand.

</details>

<details>
<summary><a href="https://github.com/wekan/node-patches/commit/875b4bb">Build PowerPC target snapshots and reject Node runtime startup failures</a>. Thanks to xet7.</summary>

The released PowerPC binary reported its version but aborted while
initializing V8. Real target snapshot tools are now built under QEMU, as for
s390x, and both platforms' artifacts are rejected unless JavaScript,
separate V8 contexts, crypto and compression actually execute - the gate
reproduces the released failure and passes with official same-version Node.

</details>

**MongoDB Database Tools (mongo-tools-patches)** - upstream `master` tracking, Android ARM64, and a wider target matrix.

<details>
<summary><a href="https://github.com/wekan/mongo-tools-patches/commit/18b9af9">Build every currently supported native Go target</a>. Thanks to xet7.</summary>

Release All expands from seventeen to forty-two OS/CPU targets after
compiling current upstream master with Go 1.27 across Go's native
command-line platforms, adding AIX, DragonFly BSD, NetBSD, OpenBSD, all
FreeBSD CPUs, and Linux MIPS and big-endian PowerPC. Illumos, Solaris and
Plan 9 are excluded because current upstream source does not compile there.

</details>

<details>
<summary><a href="https://github.com/wekan/mongo-tools-patches/commit/d341c92">Add the Android ARM64 command-line target</a>. Thanks to xet7.</summary>

The CGO-free upstream tools compile for Android arm64, expanding the
canonical registry to forty-three targets and 344 possible binaries. Other
Android architectures still require external CGO linking; iOS and
WebAssembly do not produce equivalent standalone command-line programs.

</details>

<details>
<summary><a href="https://github.com/wekan/mongo-tools-patches/commit/4fa0b90">Allow the expanded tools matrix to finish</a>. Thanks to xet7.</summary>

Both full and missing-only workflows now allow three hours for the expanded
forty-two target build instead of the former seventeen-target one-hour
limit, so adding platforms cannot create a predictably cancelled release.

</details>

<details>
<summary><a href="https://github.com/wekan/mongo-tools-patches/commit/1700c01">Document that mongo-tools has no telemetry, and pin it against upstream</a>. Thanks to xet7.</summary>

Upstream `mongodb/mongo-tools` was checked for an analytics client, a
phone-home reporter, or a telemetry/DO_NOT_TRACK flag of its own, the same
way wekan/mongosh-patches and this fork's FerretDB were checked before
their telemetry was patched out - there is none. `tests/no-telemetry-upstream.sh`
re-checks this against the current upstream ref so a future release that
adds real telemetry is caught here instead of silently missed.

</details>

**mongosh (mongosh-patches)** - telemetry removed, and startup fixed in a homeless container user.

<details>
<summary><a href="https://github.com/wekan/mongosh-patches/commit/e042127">Remove telemetry and fix startup errors in a homeless container user</a>. Thanks to xet7.</summary>

The bundled analytics sink is now unconditionally a no-op, so no telemetry
HTTP request is ever made regardless of the configured endpoint, and the
native machine-id lookup that only existed to key telemetry throttle state
is dropped. The startup banner says this fork does not collect or send
anything. The same patch fixes mongosh running inside `ghcr.io/wekan/ferretdb`
as its default non-root user, which has no `/etc/passwd` entry: config/log/
history storage now falls back to a writable directory under the OS temp
dir when the home directory is not writable, instead of failing with
`EACCES ... mkdir '/nonexistent'` and "Could not open history file" on
every session.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v11.65 2026-09-09 WeKan ® release

**In short:** Four security advisories against **Attachments/Avatars**
(ostrio:files) are fixed: a **critical** path-traversal arbitrary file
write via the attachment upload `namingFunction`, a **critical**
unauthenticated DDP method that could wipe every attachment or avatar on
the instance, and two **high** missing-authorization bugs that let an
anonymous caller download any avatar (a missing `protected` callback,
and an unauthenticated legacy-avatar route). The **AppImage** no longer
mounts itself under a possibly-small `/tmp`, relocating to
`WRITABLE_PATH/app` instead.

This release fixes the following CRITICAL SECURITY ISSUES:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9947e0138">Unauthenticated Arbitrary File Write via Path Traversal in Attachment Upload namingFunction</a>. Thanks to xet7.</summary>

Attachments overrode ostrio:files' `sanitize()` to an identity function
and used the client-supplied `fileId` verbatim as the on-disk file name
in `namingFunction`, so an anonymous upload with
`fileId: "../../../../tmp/pwn"` could write attacker-controlled content
anywhere the WeKan process can write - including overwriting bundle
modules for remote code execution. `sanitize()` is restored to the same
whitelist `models/avatars.js` already used for the same tokens (file
DISPLAY names are untouched - they go through a separate, unrelated
sanitizer in `onBeforeUpload`), and `namingFunction` now also validates
the sanitized `fileId` against the ObjectId shape WeKan itself generates,
regenerating a fresh one rather than trusting it. A blocked attempt is
recorded through the shared security log
(`authz.upload-path`/[UploadPathBleed](https://wekan.fi/hall-of-fame/uploadpathbleed/)),
so Admin Panel / Problems shows it happened.
`tests/attachmentAvatarSecurityAdvisories.test.cjs` pins both the
restored sanitizer and the fileId validation, with the advisory's own PoC
string as a negative case.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9947e0138">Unauthenticated DDP Methods Allow Instance-Wide Deletion of Attachments and Avatars</a>. Thanks to xet7.</summary>

ostrio:files registers its own `_FilesCollectionRemove_<collection>` DDP
method, gated only by `allowClientCode` and never routed through
`Attachments.allow`/`Avatars.allow` - those only gate the ordinary Mongo
`.remove()` call, not the library's own method. Attachments had no
`onBeforeRemove` at all, and Avatars' unconditionally returned `true`
(it existed only to clear the removed avatar's owner's
`profile.avatarUrl`), so any anonymous DDP connection could call either
method with selector `{}` and delete every attachment (database record
and physical file) or every avatar on the instance. Both now require
`this.userId` and check every file the selector actually matches:
attachments need the caller's board-write access on that file's card/
board, avatars need ownership of that avatar or site-admin status (the
existing admin "delete another user's avatar" flow keeps working). A
blocked attempt is recorded through a new
`authz.file-remove`/[WipeBleed](https://wekan.fi/hall-of-fame/wipebleed/)
catalog key. `tests/attachmentAvatarSecurityAdvisories.test.cjs` pins
both hooks and that an empty/non-matching selector is refused outright
rather than treated as nothing to check.

</details>

and fixes the following bugs:

**Avatars** - anonymous access to files nothing should have exposed.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9947e0138">Add the protected callback the download library needs to gate them</a>. Thanks to xet7.</summary>

Unlike Attachments, Avatars never set `protected`, so ostrio:files' own
library-native download route - whose `_checkAccess` defaults to
allowing everything when `protected` is unset - served any avatar to any
anonymous caller, entirely bypassing WeKan's own `isAuthorizedForAvatar`
check. `Avatars.protected` now mirrors `Attachments.protected`: an
authenticated caller may always view an avatar; an anonymous one only
when the avatar's owner is a member of a public board. A denied
anonymous download is recorded under a new
`authz.avatar-protected`/[PortraitBleed](https://wekan.fi/hall-of-fame/portraitbleed/)
catalog key.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9947e0138">serveLegacyAvatar Serves Legacy CollectionFS Avatars Without Any Authentication</a>. Thanks to xet7.</summary>

Both routes in `server/routes/avatarServer.js` that fall back to reading
a legacy CollectionFS avatar in place streamed it to any caller who knew
its old `cfs.avatars.filerecord` id - one of the two
(`/cfs/files/avatars`) with no authentication check at all. Both now
require a signed-in caller (`isLegacyAvatarAuthorized`): legacy records
carry no owner/board link that could be safely checked for the
public-board exemption current avatars get, so this is a deliberately
narrower rule rather than reusing that exemption on an unverifiable
claim. The `/cfs/files/avatars` route's redirect fallback for
already-migrated avatars is untouched, so an anonymous public-board
viewer still sees those normally - only the legacy read-in-place path
now requires a login. A denied attempt is recorded under a new
`authz.legacy-avatar`/[RelicAvatarBleed](https://wekan.fi/hall-of-fame/relicavatarbleed/)
catalog key.
`tests/attachmentAvatarSecurityAdvisories.test.cjs` pins both call sites
and the negative case that the redirect still works unauthenticated.

</details>

and fixes the following bug:

**AppImage** - its own mount filling up a small /tmp.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5adc030bd">Relocate the AppImage's own mount from /tmp to WRITABLE_PATH/app</a>. Thanks to xet7.</summary>

checkmk warned `/tmp/.mount_wekan.OhaGOG ... 100% used` because the
AppImage runtime's own read-only squashfs mount landed on a small `/tmp`
- a squashfs mount always reports itself as 100% used regardless of
size, so this was really "`/tmp` is too small for the AppImage", not a
leak. The runtime mounts itself under
`$TMPDIR/.mount_<name>.<random>` (defaulting to `/tmp`) before `AppRun`
ever runs, so the very first launch's mount cannot be redirected from
inside `AppRun`. `AppRun` now re-execs itself once per launch with
`TMPDIR` set to `WRITABLE_PATH/app` when the caller has not already
chosen a `TMPDIR`, so every launch from then on mounts there instead -
and, on that same first launch, sweeps out any of WeKan's own orphaned
`.mount_*ekan*` directories left in `/tmp` by an earlier, uncleanly
killed run (checked against `/proc/mounts`, so a live one is never
touched). AppImage-only: no other WeKan platform mounts itself this way,
so Docker, snap, the `.deb` and the bundle zip are untouched.
`tests/appImageRuntime.test.cjs` pins the relocation, its
once-per-launch/explicit-`TMPDIR` guards, and that only orphaned mounts
are removed.

</details>

and has the following developer-tooling fixes:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f197f4bd">Fix #3823 e2e test for the Show on Minicard -> Board Settings/Card move</a>. Thanks to xet7.</summary>

The test still clicked the minicard's own "Show on Minicard" menu entry
(`.js-show-on-minicard`), which no longer exists after the Board
Settings / Card move earlier in this release: the checkbox
(`.js-field-has-creator-on-minicard`) and its behavior are unchanged, so
the test now opens it from Board Settings / Card, reached from the
board's cog menu, instead.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/b2e1ce4b">Update hardcoded SQLite version/source-id pins to 3.53.4</a>. Thanks to xet7.</summary>

The `modernc.org/sqlite` bump (1.57.0 → 1.58.0, from the earlier
"ferretdb" dependabot group update) embeds a newer SQLite release
(3.53.3 → 3.53.4), which three tests pinned by exact string: `TestDefaults`
in `internal/backends/sqlite/metadata/pool/pool_test.go`
(`sqlite_version()`/`sqlite_source_id()`), and the `BackendVersion` checks
in `internal/backends/backend_test.go` and
`internal/backends/sqlite/metadata/registry_test.go`. The dependency bump
is the intended change; the guards are updated to match it.

</details>

Thanks to above GitHub users for their contributions and translators for
their translations.

# v11.64 2026-09-09 WeKan ® release

**In short:** **Resizable list width and swimlane height are back.** v11.62
had replaced per-user/per-list drag-resize width and the "Set width"/"Set
swimlane height" popups with a hardcoded 240px for every list; that is
reverted at the maintainer's request. Board Settings also gains three
grouped sections (**#6680**): **Swimlane** and **List**, with board-wide
resize-lock and **"same width for all lists"** admin toggles, and
**Card**, where Minicard/Card settings move back from their own menus.
**FerretDB v1** now stores Infinity/-Infinity doubles like real MongoDB,
patches a High-severity gRPC-Go DoS advisory, and keeps its dependencies
current.

This release reverts the following change:

**List and swimlane resizing** - restoring the popups and drag handles v11.62 removed.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59bed92f3">Revert "Hardcode list width to 240px and remove the width/height set-value popups"</a>. Thanks to xet7.</summary>

This reverts commit 8614949580a8824be8c189ab3c7e5869d36f6e9b in full: the
per-user/per-list resizable list width (drag-resize handle, the "Set
width" list-menu popup, the board-settings "Personal list width" sidebar
toggle, and the auto-width mode) and the "Set swimlane height" popup are
restored, along with their schema fields, Meteor methods and tests
(`tests/listWidthPopupLayout.test.cjs` and
`tests/playwright/specs/38-fixed-list-width.e2e.js`, both un-deleted). No
commit since v11.62 touched these files, so the revert applied cleanly
with no follow-up fixes needed.

</details>

and adds the following feature:

**The top header** - board-wide resize locks and a shared list width.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c48be8e6">Add board-wide list-width/swimlane-height resize locks (#6680)</a>. Thanks to Hallsie and xet7.</summary>

Three independent toggles, right of the drag-handles toggle, board admins
only: a list-width resize lock (left-right arrow plus the same allowed/
denied check/ban icon pair `.js-toggle-desktop-drag-handles` already uses),
a swimlane-height resize lock (up-down arrow, same check/ban pair), and a
board-wide "same width for all lists" (same pair again, over a static
columns icon) - the existing per-user Set Width popup's fixed-width mode,
now settable for the whole board so it applies to every viewer, overriding
their personal choice while it is on. Enabling/disabling a toggle is
admin-only on the server (`server/permissions/boards.js`'s default rule);
dragging the shared same-width value itself is allowed for any board
member with write access, through a new sole-field `Boards.allow` rule
shaped exactly like the existing board-drag-reorder rule, so a
lower-privilege member can never smuggle another board field into that
update. The swimlane-height handle also HIDES entirely while its lock is
on - not just refusing the drag - the same way the list-width handle
already hides for its own lock, so a locked handle does not still draw the
blue drag-height line on hover. `tests/listSwimlaneResizeLock.test.cjs`
pins the schema, the header wiring, the permission-rule shape, and that
each resize handle actually checks (and hides for) its lock.

</details>

and fixes the following bug:

**Collapsed lists** - the rotated title was not centered across the column width.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c543a3909">Keep a collapsed list's title near the caret, only centered horizontally</a>. Thanks to xet7.</summary>

The desktop rule that actually wins (`.list.list-collapsed:not(.mobile-view)
...`, more specific than the plain one) had `text-align: start`, leaving
the vertical text flush to one edge of the 30px column instead of centered
across it - the plain/mobile-view rule already had `text-align: center`
and was never broken. An earlier attempt at this fix also made both rule
sets grow to fill and center across the WHOLE (often 540px) collapsed
column, which moved the title far from the collapse-toggle/drag-handle at
the top (.tools/collapse2.png) - that was reverted back to how it shipped;
"centered" meant horizontally, not down the whole column.
`tests/collapsedListTitleCentered.test.cjs` pins the `text-align` fix and
negatively pins that neither rule set grows/centers across the full column
height.

</details>

and adds the following feature:

**The top header** - a collapse button for its own icons.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1b01924e">Add a header-icons collapse toggle beside the board title (#6680 follow-up)</a>. Thanks to xet7.</summary>

A single button, right after the board title, that hides every icon from
the mobile/desktop toggle through the notification bell: mobile/desktop
mode, drag-handles toggle, the three board-wide resize-lock icons, the
starred-boards group, create-board, the board/all-boards header buttons,
the view menu, the Admin Panel tabs, and notifications. Purely a
per-viewer display preference (a plain Session var, the same shape as
`mobileMode()` right beside it), not a board setting like the resize
locks. Every icon in that range gets a shared
`.js-header-collapsible-icon` marker class; the template inclusions that
cannot carry a class of their own are each wrapped in a `span` that stays
`display: contents` outside the collapsed state, so introducing it does
not change how those icons behave as flex items when nothing is
collapsed. `tests/headerIconsCollapse.test.cjs` pins the button's
position, the Session-var shape, that every icon in the range is marked
and nothing outside it is, and both CSS rules.

</details>

and fixes the following bug:

**Collapsed lists** - the rotated title's x-position did not match the caret above it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/afb6bc5cf">Fix collapsed list title x-position not matching the caret above it</a>. Thanks to xet7.</summary>

Centering the title horizontally (above) was not enough: it still sat
~13px right of the collapse-toggle caret (.tools/collapse3.png). Root
cause was an unrelated, generic `.list-header .list-header-name` rule that
sets `min-width: 56px` for ordinary (non-collapsed) list headings.
`min-width` is a separate property from `width`, so it survives the
cascade even where a more specific collapsed-list rule wins on `width`
itself - it silently clamped the rotated title's box to 56px regardless
of the 30px collapsed column, since the final used width is
`clamp(min-width, width, max-width)`. Fixed by overriding `min-width`
back to `0` in every collapsed-title `h2.list-header-name` rule: the
plain/mobile-view rule, the desktop `:not(.mobile-view)` rule, and its
three `@media (min-width: 768/1024/1200px)` duplicates. Verified with a
Playwright measurement of the caret's and title's horizontal centers
matching after the fix; `tests/collapsedListTitleCentered.test.cjs` pins
that every one of those rules cancels the clamp, and that the generic
56px rule this works around still exists (so the test does not go stale
if that rule is ever removed).

</details>

and reorganizes the following board settings:

**Board Settings** - Swimlane, List and Card, grouped together.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2606ab56b">Move swimlane/list resize settings and card settings into Board Settings</a>. Thanks to xet7.</summary>

The list-width and swimlane-height resize-lock toggles and the board-wide
"same width for all lists" toggle, header icons since #6680, move into
**Board Settings / Swimlane** and **Board Settings / List** instead - with
the rest of a board's settings, reached from the board's cog menu, rather
than living as icons in the header. Minicard and Card settings (the
shared table of two dozen display settings) move back into **Board
Settings / Card**: they had been split across the card's own menu ("Show
on Card") and the minicard's own menu ("Show on Minicard"), one column of
the same table each. Both menu entries, their wrapper popups, and the
`cardMenuSource` module that only existed to tell those two menus apart
are removed; the shared settings table itself is unchanged, now opened
directly from Board Settings with both columns shown side by side.
Swimlane and List stay board-admin only, the same restriction the resize
locks already had; Card is open to any board member, matching who could
reach it before - a non-admin still gets the one PERSONAL row in that
table ("Labels text") rather than the admin-only rows, the same fallback
`showOnMinicardPopup` used to give them. All three reuse existing,
already-translated words ("Swimlane", "List", "Card"/"Card Settings") via
`Popup.open`'s `titleKey`, rather than adding new `*Popup-title` keys that
would need translating into 147 languages. The group sits between two
`<hr>` rules in Board Settings, as its own section.
`tests/boardSettingsSwimlaneListCard.test.cjs` pins the new layout and the
personal-row fallback.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9138f6f86">Restore the Show on Card/Minicard/Description column headings, on Card</a>. Thanks to xet7.</summary>

The column headings above the settings table were removed once (commit
02025aa6c) because the popup used to flow its rows into several
side-by-side columns whenever only Card or only Minicard was shown, so
the heading sat above the first of those columns and read as if it named
that one alone. Board Settings / Card always shows both columns in a
single list of rows now, so that ambiguity is gone, and the heading is
back: "Show on Card" / "Show on Minicard" / "Description", reusing the
same already-translated keys as before. It is an ordinary
`.card-settings-row` this time, not the old separate
`.card-settings-grid`/sticky-header markup, so the same CSS that hides a
column for the still-supported `side="card"`/`"minicard"` case hides the
matching heading with it, and `personalOnly` (what a non-admin gets)
hides the whole heading along with every other non-personal row.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8c8ed63a">Remove the duplicate hr above Move Board to Archive</a>. Thanks to xet7.</summary>

The Swimlane/List/Card group's own closing `hr` and the Archive Board
group's opening `hr` sat back to back, drawing two rules where one was
enough.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/13ca5e08a">On Card, the Show on Minicard column reads left of Show on Card</a>. Thanks to xet7.</summary>

CSS `order` on the grid items, not a markup change: column 1 (card) and
column 2 (minicard) keep their original DOM order, so the
show-card-only/show-minicard-only `nth-child` hiding rules still target
the right element regardless of side. Only the visual position of the two
swaps; Description (column 3) gets an explicit order too, so it is not
pulled in front by the `order: 0` an unordered item would otherwise
share.

</details>

and fixes the following bugs:

**Edit Custom Fields popup** - a rule with nothing above it to separate.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/250adfe9a">No rule above Add when there are no custom fields yet</a>. Thanks to xet7.</summary>

The `hr` between the field list and "Add custom field" was unconditional,
so a board with no custom field yet drew a rule with an empty list above
it - two lines doing the work of an empty one. It is now conditional on
`board.customFields.length`.

</details>

**List Actions and Swimlane Actions** - two menu entries for things a drag already does.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4374502a4">Hide List Actions / Set width and Swimlane Actions / Set Swimlane height</a>. Thanks to xet7.</summary>

Both are still reachable by dragging the resize handle (unless Board
Settings / List or Board Settings / Swimlane has locked that), and the
board-wide fixed-width value now lives in Board Settings / List - a menu
entry for the same thing was a second place to look for it. The
underlying popups (`setListWidthPopup`, `setSwimlaneHeightPopup`) are
untouched, only the menu entries that opened them are removed. Removing
"Set width" left its own group empty, so the group (and its enclosing
`hr`) is removed entirely; removing "Set Swimlane height" left "Select
color" as the only row of its group, so that group's `hr` moves inside
the same admin-only check as the color entry itself, rather than leaving
a dangling `hr` (or an empty list) for a non-admin.

</details>

and updates the following FerretDB v1 dependencies and fixes:

**FerretDB v1** - infinity-value storage, a gRPC security fix, and current dependencies.

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/7bbc88c8">Allow storing Infinity/-Infinity doubles, matching MongoDB</a>. Thanks to xet7.</summary>

`mongorestore` restoring a wekan `cards` collection with a `sort:
-Infinity` value failed one document with `invalid value: { "sort": -Inf
} (infinity values are not allowed)`, even though real MongoDB stores
+Inf/-Inf doubles without complaint. The root cause was one level down
from that check: sjson (the JSON-based encoding documents are stored as)
already special-cased NaN as the string `"NaN"` because Go's
`encoding/json` cannot marshal NaN/Inf floats directly, but never did the
same for Infinity, so document validation rejected it outright rather
than hand the storage layer a value it could not round-trip. Infinity is
now encoded the same way NaN already was, and the document-validation
rejection - along with the matching restriction on a `$mul` that
overflows to infinity - is removed now that storage supports it. Unit
and integration tests cover the insert/read/update round-trip against a
live server.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/3df0ce7b">Bump tools/go.mod's indirect grpc-go to 1.83.2 (GHSA-2v4p-qf9q-27wj)</a>. Thanks to xet7.</summary>

Dependabot alert 47: a gRPC-Go server configured with
`xds.NewGRPCServer()` crashes (High severity, Denial of Service) on a
crafted request missing both the `:authority` and `Host` headers,
affecting `google.golang.org/grpc` >= 1.83.0, < 1.83.2. The root module
and `integration/go.mod` were already on the patched 1.83.2, but
`tools/go.mod` - a separate module pulling grpc in indirectly through
`golang.org/x/pkgsite` - was missed and stayed on the vulnerable 1.83.1.
`go mod verify` and `go list -m all` both succeed with the updated graph.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/1e23af3f">Sync integration/go.mod after the ferretdb dependency-group bump</a>. Thanks to xet7.</summary>

The "ferretdb" dependency-group update brought the root module's
`go.mod`/`go.sum` current, but left `integration`'s pointing at the old
indirect-dependency versions, so `go build ./integration/...` failed with
"updates to go.mod needed; to update it: go mod tidy". Running it there
brings both modules back in sync.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/d4f75f6a">Update gRPC to 1.83.2 in the root and integration modules</a>. Thanks to dependabot and xet7.</summary>

`google.golang.org/grpc` moves from 1.83.1 to 1.83.2 in both the root
module and `integration`. Module checksums verify and the affected
packages build.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/8e62741d">Update the mongo and golang build images</a>. Thanks to dependabot and xet7.</summary>

The `mongo` image used by `build/deps` moves from 8.3.8 to 8.3.9, and the
`golang` image used by `build/ferretdb` moves from 1.27.0 to 1.27.1.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/c3a5df81">Update the "ferretdb" dependency group</a>. Thanks to dependabot and xet7.</summary>

Seven updates: `github.com/SAP/go-hdb` (1.18.2 → 1.18.3),
`github.com/go-sql-driver/mysql` (1.10.0 → 1.10.1),
`github.com/prometheus/client_model` (0.6.2 → 0.6.3),
`github.com/prometheus/common` (0.70.1 → 0.71.0), `golang.org/x/crypto`
(0.55.0 → 0.56.0), `golang.org/x/sys` (0.47.0 → 0.48.0) and
`modernc.org/sqlite` (1.57.0 → 1.58.0, pulling in newer
`modernc.org/libc`/`modernc.org/memory`). Module checksums verify and a
binary containing the SQLite, PostgreSQL, MySQL and HANA handlers builds
successfully.

</details>

# v11.63 2026-09-08 WeKan ® release

**In short:** `releases/release-all.sh` no longer skips version numbers: its
version step is now a fixed **+1**, fixing a bug where a single unpublished,
deleted release heading made the script measure and re-apply the resulting
gap forever, silently skipping v11.57, v11.59 and v11.61 (and, earlier,
v11.33 and v11.54). **CHANGELOG.md** no longer carries an empty Upcoming
placeholder between releases, and each release's binaries table moves from
right under the summary to its own **Binaries in these bundles** section at
the end. The **Docker Hub/Quay.io registry-overview sync** added earlier is
removed again: it needed rights the release credentials do not have, and
the maintainer updates both overviews manually now.

This release fixes the following developer-tooling bug:

**`releases/release-all.sh`** - the version-number step between releases.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96157ef41">Stop release-all.sh from inheriting and widening a version-number gap</a>. Thanks to xet7.</summary>

The next release version used to be computed by MEASURING the gap between
the two newest `# vNN.MM` headings in CHANGELOG.md and re-applying that same
gap, rather than always advancing by one. That is fine as long as every
gap between two headings is really 1 - but it is not self-correcting: if a
release number was ever prepared and then never published, and its
CHANGELOG section was deleted outright instead of renamed back to `#
Upcoming WeKan ® release` (the correct recovery for a release that never
published, per this script's own header comment), the two headings left
behind were 2 apart. The script read that as "the cadence is +2 now",
applied +2 to get the next number, and did the same again next time -
turning one incident into a permanent, ever-repeating habit of skipping a
number. That is exactly how v11.56 -> v11.58 -> v11.60 -> v11.62 happened,
silently skipping v11.57, v11.59 and v11.61 (v11.33 and v11.54 were
skipped by the same bug earlier). The step is now a fixed +1 with no
history lookup, and the other code path (resuming an already-renamed
release) now hard-fails instead of printing "proceeding anyway" when the
newest heading is not exactly +1 from the previous one, so a future gap is
caught before it can be built on rather than silently accepted and
repeated. `tests/releaseAllVersionStep.test.cjs` pins the fixed +1 step
and the hard failure.

</details>

and the following developer-tooling changes:

**CHANGELOG.md** - the empty Upcoming placeholder, and where the binaries table sits.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/83fa2d341">Stop leaving an empty Upcoming placeholder, move the binaries table to the end</a>. Thanks to xet7.</summary>

CHANGELOG.md no longer carries an empty `# Upcoming WeKan ® release` section
with an `**In short:** nothing here yet.` placeholder between releases.
`release-all.sh` used to auto-create one immediately after renaming a
release (via the now-deleted `releases/changelog-open-next.mjs`), so the
file always had a section that said nothing until the first real entry
replaced it. Add the section yourself, by hand, the moment there is a real
entry for it, using the skeleton at
`docs/DeveloperDocs/Changelog-Upcoming-Template.md`. What actually prevents
an entry from landing inside an already-published release -
`tests/changelogEntriesBelongToTheirRelease.test.cjs` asking git which
commits a release contains - never depended on the placeholder existing
first, so removing it costs nothing. Also reorders each release section:
the binaries table used to sit right under the `**In short:**` summary; it
now comes LAST, under its own `**Binaries in these bundles:**` label, after
every content subsection and right before the closing "Thanks to above
GitHub users" line - reference material, not the second thing a reader
sees.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c1b8a4ca">Remove the Docker Hub/Quay.io registry-overview sync</a>. Thanks to xet7.</summary>

v11.62's `release-all.yml` run had already shown this step to be a
liability rather than a convenience: `DOCKERHUB_AUTH`/`QUAY_AUTH` are
scoped for `docker login`/image push, and neither registry grants a
push-scoped token the rights a repository-description write needs, so the
step failed with 403 even though the image itself published fine (fixed to
a `::warning::` rather than a job failure in the previous commit, still in
this same Upcoming section). The maintainer now updates both registries'
overviews by hand, so the step - and its
`tests/dockerRegistryOverviewSync.test.cjs` - are removed entirely rather
than kept working. The identical step is removed from the companion
FerretDB fork's `docker.yml` in the same commit round.

</details>

# v11.62 2026-09-08 WeKan ® release

**In short:** this release adds **test-menu.sh** and a **Markdown**
import/export format, and gives the **GitHub/Gitea/Forgejo issue importer**
loss-reporting instead of silently dropping fields. The **Board View menu**
is reordered and gains placeholder pages for ten not-yet-built views plus a
new **Time** view. The **Board Table** and **Calendar** view toolbars are
rethemed, regrouped and properly centered. Several bugs are fixed:
dependency lines and collapsed lists bleeding past a resized swimlane, a
list's collapse caret sitting in the wrong place, an **OIDC redirect
login loop**, a **Windows single-EXE** CI smoke test failing silently,
and **list width is now a single hardcoded 240px** for every list on
every board, with the redundant "Set width"/"Set swimlane height" popups
removed.

This release adds the following developer-tooling feature:

**Feature testing** - one menu to run and verify WeKan's own features.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1218cd281">Add test-menu.sh and checked-in example inputs for docs/Features</a>. Thanks to xet7.</summary>

test-menu.sh mirrors the docs/Features menu structure and runs the actual
WeKan code for each feature: a dedicated runner for Login (a real REST
username/password round trip) and ImportExport/PDF (create a board, export
it, check the PDF header), and a generic fallback that matches a feature
against this repo's own automated tests by filename. Every feature run
writes output.txt/result.txt/run.log under .tools/test-menu/&lt;timestamp&gt;/,
mirroring the docs/Features path, and never leaves an empty or missing
result. The example INPUT for a feature is checked into the repository next
to its documentation instead - docs/Features/&lt;path&gt;/example-input.txt - so
test-menu.sh only ever reads it, never writes into docs/Features.

</details>

and adds the following Board View feature:

**Board View menu** - its order, icons and the views it opens.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/876b0a2c1">Reorder the Board View menu and add its not-yet-built views</a>. Thanks to xet7.</summary>

New order top to bottom: Swimlanes, Lists, Table, Calendar, Time,
Statistics, Dashboard, Burndown, Burnup, Cumulative Flow, Control, Cycle
Time, Flow Efficiency, Gantt, Lead Time, Throughput Histogram, WIP Run -
each with its own font-awesome icon. The ten views with no implementation
yet get a real grey page titled like their menu entry instead of a menu
item that opens nothing. "Time spent summary" moves out of Statistics into
its own new Time view. models/users.js's profile.boardView schema and
boardHeader.js's tooltip name map both had to learn every new view or
switching to one silently failed (the server rejected it with a 400, or
the tooltip fell back to a generic label); tests/boardViewMenu.test.cjs now
checks the menu, the schema and the tooltip map against the same view list.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14136a5b0">Group the Board View menu with separators and mark unfinished views</a>. Thanks to xet7.</summary>

`<hr>` separators, matching the right sidebar's own hr-separated groups:
one between Table and Calendar, one between Time and Statistics. The nine
views with no implementation behind them yet (Burndown, Burnup, Cumulative
Flow, Control, Cycle Time, Flow Efficiency, Lead Time, Throughput
Histogram, WIP Run) show a hardcoded "(Name)" label instead of a
translated one - translating them as if they were finished feature names,
like every other entry, would not say in any language that the view
behind them is just a grey placeholder page. Dashboard is left translated;
it is not on the maintainer's list of nine.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02449c0d0">Move Gantt between Statistics and Dashboard, mark Dashboard unfinished</a>. Thanks to xet7.</summary>

Gantt moves next to Dashboard, with its own `<hr>` separator, matching the
menu's existing grouping. Dashboard now carries the same hardcoded,
untranslated "(Dashboard)" label the other nine not-yet-built views
already had - the earlier entry above left it translated by oversight,
which said the view was finished when it is a placeholder page like the
rest of them.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a5e74972d">Translate the Board View menu's "not implemented yet" labels</a>. Thanks to xet7.</summary>

The two entries above hardcoded the English word itself inside the
parentheses, so on an otherwise fully translated menu these ten entries
read as a leftover bug rather than a "coming soon" marker - the page each
one opens was already correctly translated, since its own title uses the
same key. The literal parentheses are what say "not implemented yet"; the
word inside them is now translated like every other entry, through the
exact key the placeholder page's title uses.

</details>

and fixes the following bugs:

**CHANGELOG.md formatting.**

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f35d5225">Fix a wrapped changelog summary line</a>. Thanks to xet7.</summary>

A `<summary>` line must be on one line - a wrapped one renders its second
line as literal text instead of part of the link. changelogFormat.test.cjs
already checked this; it was failing before this fix.

</details>

**Calendar view** - the toolbar.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e0e03e200">Move all Calendar view toolbar buttons to the right of the title</a>. Thanks to xet7.</summary>

Today/Previous/Next were their own group under the title, with the
Day/Week/Month view toggles in a third, CENTER group that pushed
everything onto a second row. All the buttons now sit together in one
group on the right of the title, which stays alone on the left and is
vertically centered against them - WeKan's global heading margin
otherwise offset the title from that row.

</details>

**Login** - OIDC redirect-style auto-login.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89682c251">Fix OIDC auto-redirect looping until the provider rate-limits it</a>. Thanks to Alishara and xet7.</summary>

With `oauth2-login-style: redirect` and `OIDC_REDIRECTION_ENABLED`, the
browser looped between WeKan and the identity provider until the provider
started rate-limiting the repeated `/authorize` requests. The auto-redirect
fired unconditionally on every render of the sign-in page; Meteor's
redirect-style OAuth has no dedicated callback route, so the identity
provider's callback bounces the browser back to that same page, racing the
asynchronous login completion - and a bounce-back render that still looked
"not logged in yet" fired a brand new redirect straight back to the
provider, forever. Fixed with a one-shot flag that survives the round trip
and is cleared on login success/failure, so a later logout can still
auto-redirect again.

</details>

**Swimlanes** - resizing one shorter.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24199bb1d">Fix dependency lines and collapsed lists bleeding past a resized swimlane</a>. Thanks to xet7.</summary>

Two independent causes: `.swimlane.swimlane-resizing` forced
`overflow: visible !important` for the whole drag, so a collapsed list (a
fixed 540px tall) kept painting past a swimlane being dragged shorter, on
top of the swimlane below it - now `hidden`. And the dependency-line ("red
string") overlay only ever redrew on scroll or a window resize, never on a
swimlane's own height changing, so a line kept stale coordinates from
before the resize; it now recomputes on every height change and refuses to
draw to/from a card with no on-screen area left once every clipping
ancestor is accounted for - a line between two cards in the SAME shrunk
swimlane disappears with the card, while one genuinely crossing into a
different, still-visible swimlane is unaffected.

</details>

**Lists** - the collapse caret, list width, and swimlane height.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f56a3344">Move an expanded list's collapse caret to its header's top corner</a>. Thanks to xet7.</summary>

The caret rendered as a plain in-flow sibling before the title, on the row
with the card count and the +/menu icons - visually unrelated to either.
Nesting it inside the title heading was tried first and reverted: that
heading opens the rename form on click, so the caret's click bubbled up
and opened that instead of collapsing the list. Fixed by floating the
caret to the START of the header's top line, the same line the hamburger
menu already floats to the END of, so it lands level with that menu at the
header's top corner - the left edge for LTR, the right for RTL.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04d909b7a">Stack "Same width for all lists" below "Auto list width"</a>. Thanks to xet7.</summary>

Both are `a` toggles in the "Set width" popup with no display rule of
their own, so the browser default (inline) put them side by side on one
crowded line instead of stacked rows like the rest of the popup.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/861494958">Hardcode list width to 240px and remove the width/height set-value popups</a>. Thanks to xet7.</summary>

List width is now a single hardcoded constant (240px) applied to every
list on every board for every viewer. This replaces the model built up
over several past releases - a personal per-user width, a per-list shared
width, a viewer-toggled "same width for all lists" mode and a
viewer-toggled auto-width mode. All of it - the "Set width" list-menu
popup just above, the board-settings "Personal list width" sidebar toggle,
the drag-resize handle, and every schema field and Meteor method behind
them - is removed rather than left dead. The "Set swimlane height" menu
popup goes too, as a redundant text-input alternative to the working
drag-resize handle from the swimlane-resize fix above; that drag handle
itself is untouched. models/wekanCreator.js was still mapping the removed
board fields on WeKan JSON import, which would have failed schema
validation on any import; fixed as part of the same change.

</details>

**Board Table view** - its toolbar: the pagination buttons, two toggle
button tooltips, and vertical alignment.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d89c086a">Theme Board Table view's pagination buttons like the Search button</a>. Thanks to xet7.</summary>

The prev/next page buttons were plain white with a grey border, unlike
the blue "Search" button right next to them in the same control row - the
two read as different UI families instead of one toolbar.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7b6b9d519">Add descriptive tooltips to the Board Table view toggle buttons</a>. Thanks to xet7.</summary>

The "wrap card titles" and "group by swimlane" toggle buttons had bare
one-word tooltips that said neither what clicking them does nor which of
the two states is currently on. Each now has a state-aware
tooltip/aria-label, translated into every locale.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/663a5a1cc">Vertically center the Board Table view toolbar's controls</a>. Thanks to xet7.</summary>

The search input, Search button, pagination buttons and the two toggle
buttons sit in one flex row with align-items: center - but a flex child
never shrinks below its own content's minimum height no matter what the
container measures, so the Search button's bold label pushed it visibly
taller/lower than the search input beside it. Every control now shares
one explicit border-box height, so there is nothing left for
align-items: center to fail to center.

</details>

and adds the following import/export improvements:

**Import/export formats** - see docs/Features/ImportExport/Format-Coverage.md.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/237b4f3f8">Add Markdown import/export and give GitHub-style import loss reporting</a>. Thanks to xet7.</summary>

The GitHub/Gitea/Forgejo issue importer mapped only a title, description,
one assignee and a due date, silently dropping everything else. It now also
carries a second-and-later assignee, a milestone title, a non-"completed"
state reason and embedded comments, and returns an `unsupported` list of
what it genuinely could not place. Markdown is a new import/export format:
the "## List name" / "- [ ]"/"- [x]" task-list convention several
markdown-kanban tools use (Obsidian Kanban and similar) - a plain bulleted
list with no checkboxes still imports as open cards. The export route
serves plain `text/markdown` rather than JSON, since the point is a file
readable/editable directly or opened by another markdown-kanban tool.

</details>

and has the following developer-tooling fix:

**GitHub Actions** - the Windows single-EXE build.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b34b036eb">Fix the Windows single-EXE smoke test failing with no error message</a>. Thanks to xet7.</summary>

A downloaded run's logs (.tools/wekan10) showed the smoke test's success
message print, immediately followed by "Process completed with exit code
1" - no thrown error anywhere in between. `taskkill.exe` (unlike a
PowerShell cmdlet) sets `$LASTEXITCODE`, which `$ErrorActionPreference`
does not touch, and `pwsh -Command` exits with whatever `$LASTEXITCODE`
last held when the script itself never calls `exit`. `taskkill /IM
ferretdb.exe` finding no matching process - a normal, harmless outcome by
the second smoke-test run - was the LAST external command the whole step
ran, so its "no such process" exit code alone failed the step. The same
latent bug was in the "Free ports used by the packaged EXE" step's
cleanup loop too; both now reset `$LASTEXITCODE` after every `taskkill`
whose own exit code the workflow does not check.

</details>

and adds the following developer-tooling feature:

**Docker releases** - keeping the registry overview pages in sync.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/395aa2b40">Sync the Docker Hub and Quay.io repository overviews from README.md on release</a>. Thanks to xet7.</summary>

Docker Hub and Quay.io each show a long-form "overview"/description on the
repository page, separate from the image tags, and neither registry updates
it on its own - it silently drifts from what README.md actually documents
unless something pushes it. release-all.yml's docker job now adds a step,
after the multi-arch image is built, pushed and verified, that reads
README.md and syncs it: to Docker Hub via its login-for-JWT-then-PATCH
`full_description` API, and to Quay.io via its `PUT
/api/v1/repository/{repo}` `description` API, reusing the same
DOCKERHUB_AUTH/QUAY_AUTH secrets already decoded for `docker login`. GHCR
needs no such call: a package linked to a GitHub repository (as
ghcr.io/wekan/wekan is) already shows that repository's own README
automatically. Each registry is synced independently, the same way the
image push already tolerates one registry failing without blocking the
others, and no token or JWT is ever echoed. The companion FerretDB fork's
own `docker.yml` gained the identical step for wekanteam/ferretdb and
quay.io/wekan/ferretdb. tests/dockerRegistryOverviewSync.test.cjs pins the
new step's endpoints, request bodies, ordering and the
no-plaintext-secrets rule.

</details>

and fixes the following:

**Release consistency and the Statistics view test** - after the Meteor 3.5.2
upgrade and the Time view split.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7419ba9a">Fix Dockerfile's Meteor release pin after the 3.5.2 upgrade</a>. Thanks to xet7.</summary>

`.meteor/release` was bumped to `METEOR@3.5.2`, but Dockerfile's own
`METEOR_RELEASE` still said `METEOR@3.5.2-rc.0`, so
`tests/releaseVersionConsistency.test.cjs` failed with a version mismatch.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5abcb5f2f">Fix Statistics view test for the Time-view split</a>. Thanks to xet7.</summary>

Time spent summary moved out of the Statistics view into its own Time
view, leaving statsView.jade with one `.stats-view-table` section (board
status) instead of two. The Playwright test still expected 2 tables and
failed on every browser; updated to expect 1.

</details>

Thanks to above GitHub users for their contributions and translators for
their translations.

# v11.60 2026-09-08 WeKan ® release

**In short:** **Logos and board backgrounds accept an external image URL again**,
reverting the previous release's switch to upload-only, server-converted GIF
storage, and a new **`test-menu.sh`** gives the repository an interactive test
menu shaped exactly like `docs/Features`.

This release reverts the following change:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f07e2e69b">Revert branding and board background images to external URLs</a>. Thanks to xet7.</summary>

The previous release replaced the login logo, top-left corner logo and board
background URL fields with upload-only controls that convert every image to
GIF on the server. This reverts that: the Admin Panel and Organization
branding fields, and the board Change Background Image popup, accept a direct
external image URL again, alongside the existing upload option. Trello and
WeKan JSON imports may again carry an external background URL onto the
imported board. Tests updated to match the restored fields and behavior.

</details>

and has the following developer-tooling addition:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3085e32fe">Add test-menu.sh, a docs/Features-shaped interactive test menu</a>. Thanks to xet7.</summary>

`./test-menu.sh` builds its menu and submenus live from `docs/Features`, so
they can never drift from it: a folder is a submenu, a folder with no
subfolders of its own is a runnable leaf, menu 1 always runs every feature at
once, and 0 goes back (or exits, at the top). Login and ImportExport/PDF are
wired to real WeKan server code from this checkout - a REST username/password
login round trip and a board create-then-export-PDF call - reusing an
already-running WeKan or starting the precompiled `.build/bundle` if one
exists. Every other leaf falls back to running this repository's own matching
`tests/*.test.cjs`, a real, working way to exercise a feature that has no
dedicated runner yet. Each run's starting command, log and any produced files
(the exported PDF, login/board API responses) are saved under
`.tools/test-menu/YYYY-MM-DD_HH-MM-SS/`, mirrored into the same subfolders as
`docs/Features`.

</details>

# v11.58 2026-09-07 WeKan ® release

Now that builds have been fixed, new release with those fixes included.
Fixed are builds of FerretDB, node-patches, mongo-tools-patces and mongosh-patches.

# v11.56 2026-09-07 WeKan ® release

**In short:** repair test assumptions for generated artifacts, current Finnish
translations, bounded report labels and HTTP/HTTPS session cookies. Application
behavior is unchanged; all 790 Node suites and 15 targeted browser checks pass.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/793f760ea">Fix alltests fixtures and HTTP cookie assertions</a>. Thanks to xet7.</summary>

The September 7 alltests run failed on generated Playwright artifacts, changed
Finnish wording, long fixture labels and an HTTPS-only cookie expectation on
its HTTP test origin. Exclude generated test output, keep localization boundary
checks independent of translator wording, shorten report markers and supply
valid attachment versions. Verify the named login cookie is HttpOnly and hidden
from JavaScript on both transports, and require Secure when the origin is HTTPS.

All 790 Node suites pass. The three affected browser cases pass Chromium,
Firefox and WebKit on HTTP and Chromium and Firefox on the live HTTPS origin
(15 targeted checks). The original Mocha, import, E2E, database-conformance and
FerretDB stages were already successful; application source did not change.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.55 2026-09-07 WeKan ® release

**In short:** **Legacy HTML4 is reverted**, restoring the standard Meteor browser
interface. Local branding images, searchable document previews, browser lazy
loading, translation updates and the session-upgrade fix remain. Meteor tests
compile, and authentication forms follow keyboard order. Swimlane and card
controls regain their previous colors, and upgraded sessions retain their profile
without a duplicate login.

This release reverts Legacy HTML4 and retains the following changes:

**Browser interface** - standard Meteor pages and deferred browser code.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f8990bcc">Restore independent swimlane and card control colors</a>. Thanks to Alishara and xet7.</summary>

Revert the client styling from the swimlane title-color matching change and the
card title-color matching change. Swimlane controls again use neutral gray and
darker hover colors, and card controls regain their previous styling. Remove the
shared card-control class and the added light-card title overrides.

Updated source guards cover the restored colors and retained card palette.
Four live checks in Chromium and Firefox verify swimlane normal/hover colors and
card controls on colored backgrounds at [testi.wekan.fi](https://testi.wekan.fi).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f82d985e">Keep upgraded session profiles without a duplicate login</a>. Thanks to Alishara and xet7.</summary>

The earlier session-upgrade repair repeated a token login that Accounts had
already started. Live DDP diagnostics reproduced the remaining symptoms of
[#6677](https://github.com/wekan/wekan/issues/6677): the user ID remained logged
in, but rebuilding subscriptions cleared the published profile. The saved
profile in the database was unchanged. This is separate from control CSS.

Move the existing credential and expiry into Accounts' memory store, remove its
old persistent copy, synchronize the token poll and let the native validated
endpoint set the HttpOnly cookie. Do not repeat the initial login. Cookie-only
clients continue using the native cookie resume.

Unit scenarios cover completed and pending initial logins and cookie-only
startup. The extended live regression checks the name, loaded avatar and theme
past the three-second poll, edits the name and theme, favorites the board,
switches to list view and verifies persistence after a cookie-only reload.
Both Chromium and Firefox pass this regression and the private-board refresh
check. Native Edge, AD authentication and WebKit were not exercised.

The Upcoming coverage audit ran all Node suites: 858 checks passed, with the
same two pre-existing failures for an undocumented test-results directory and
Finnish rule-description wording. All three targeted color/session suites pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/828fc2d7186f485ce3df056849442f9cdcf5828d">Revert Legacy HTML4</a>. Thanks to xet7.</summary>

Remove the Legacy HTML4 and Legacy Omi progressive browser interface, its
cookieless sessions, page controllers, assets and parity refactors. Page requests
again use the standard Meteor interface and the previous browser operations.
The HTML4 design documents, paused-work backlog and feature tests are removed.

Intervening translation updates, backup screenshots, session-upgrade repairs,
cryptographic test identifiers, local image storage, searchable document previews
and browser lazy loading remain. Shared GIF utilities now live in an independent
image module so the retained image features have no HTML4 dependency.

The Node suite run and targeted reruns pass apart from two failures reproduced
with the previous code: an undocumented existing test-results directory and a
Finnish rule-description expectation. Five new interface and image checks pass;
121 changed application modules parse and their 1,001 local imports resolve.
Live validation at [testi.wekan.fi](https://testi.wekan.fi) passes eight checks in Chromium and
Firefox: standard sign-in, JavaScript-disabled responses, member board loading
and non-member denial. WebKit cannot launch with the available system libraries.
Existing suites cover the retained Upcoming features, session repair, build fix,
keyboard navigation and email documentation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1b262d29">Lazy-load browser export code and share its ZIP implementation</a>. Thanks to xet7.</summary>

HTML export and its ZIP writer now load only after the HTML Export action is
clicked. The direct JSZip dependency is removed; export uses the same small MIT
`fflate` implementation as server-side document conversion, while ZIP imports
continue through the bounded streaming server route. Gantt no longer imports an
unused Markdown parser, and attachment UI no longer loads BSON merely to create
or display an identifier. Tests keep the feature boundary dynamic, prevent the
duplicate ZIP library from returning, and cover the import/export paths.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cda021ba2">Share the streaming ZIP reader with Trello imports</a>. Thanks to xet7.</summary>

Trello package import no longer relies on an undeclared JSZip copy. It uses the
same server-side `unzipper` reader as the bounded backup and scoped-import paths,
while retaining path, entry-count, expanded-size and per-file limits. This leaves
`fflate` as the small lazy browser/document ZIP implementation and `unzipper` as
the server reader for large streamed input.

</details>

**Sign in and sign up** - keyboard order and session continuity.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9f47f00cf">Keep profiles and preferences through session upgrades</a>. Thanks to Alishara and xet7.</summary>

Upgrading from v11.39 no longer replaces the browser's existing resume-token
store before that token has migrated to the new HttpOnly cookie flow. The
three-second Accounts token poll therefore cannot log out the restored user and
remove their reactive name, avatar, theme, favorites and board-view settings.

Static positive and negative coverage pins the migration order and forbids
direct token writes. A Chromium regression recreates the old local-token state,
checks the profile and board view, and remains logged in beyond the poll window.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9fb3d91d9">Fix authentication form keyboard navigation</a>. Thanks to xet7.</summary>

Tab now moves directly from each sign-in or sign-up writing field to the next
one below it without stopping on a show/hide-password control. The controls
remain available by pointer and assistive technology. Native Enter submission
remains active in the bottom field. Source and three-browser tests cover the
positive field order, the skipped controls, failed-login submission and
successful account creation.

</details>

**Images and attachments** - local images and searchable document previews.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/818b57421">Store searchable document text and GIF attachment previews</a>. Thanks to xet7.</summary>

PDF, DOCX, XLSX and PPTX previews are now generated on the server and cached in
Default Storage. Plain Unicode text is stored without formatting in a separate
unpublished `searchText` field, displayed as selectable text, and exposed to a
board-authorized attachment-text search method. Embedded document images and PDF
page imagery are converted to GIF; page controls browse the combined lightweight
representation.

Source bytes, decoded text, page count, archive entries and expanded OOXML data are
all bounded. ZIP entries are streamed, malformed images do not suppress readable
text, generated data is tied to the original checksum, and every manifest, image
and search request repeats board-read authorization. The small conversion stack is
MIT and Apache-2.0 only; no GPL, LibreOffice, Ghostscript, browser runtime or OCR
dependency is added. Tests cover the storage split, authorization, regex escaping,
selectable safe rendering, GIF routes, size limits, licenses and vulnerable-version
exclusions. Sharp is updated to 0.35.4 so untrusted image decoding also receives the
current libvips security fixes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b9080bad">Store branding and board background images locally as GIF</a>. Thanks to xet7.</summary>

Admin Panel instance and Organization branding now offers image upload controls
instead of editable external image URL fields. Every upload is authorized, bounded,
decoded and converted to GIF on the server before it is written to Admin Panel /
Attachments / Default Storage. Direct REST and tenant-setting writes cannot restore
an arbitrary image source URL. The separately configured logo click destination is
unchanged.

At startup, existing external login logos, header logos and board backgrounds are
downloaded through the SSRF-safe fetcher, converted to GIF and atomically replaced
with internal URLs. A failed legacy download is removed immediately from client-
visible data and retained only in an unpublished retry queue for the next startup.
Board Settings likewise offers only upload, unset and the stored-background list;
new board backgrounds pass through a board-admin-checked GIF conversion method.
Offline imports no longer activate third-party background URLs. Regression coverage
checks authorization, input limits, SSRF-safe migration, Default Storage selection,
GIF-only output, response hardening, hidden URL write paths, board-background upload
and import behavior.

</details>

**Tests and build** - compilation and secure test identifiers.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/713ac69ace550f6a0d696a2f3e67d4c924cdc3d5">Verify the restored browser interface over HTTPS</a>. Thanks to xet7.</summary>

Playwright readiness selects HTTPS for a public HTTPS test URL. The board
non-member regression waits for the rendered denial and absence of the canvas,
so the development server's persistent SockJS polling cannot cause a false
network-idle timeout. The HTTPS guard and eight live Chromium/Firefox checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e83304d4">Use cryptographic randomness throughout Playwright tests</a>. Thanks to xet7.</summary>

All Playwright fixture usernames, addresses, object identifiers and run markers
now come from one Node `crypto.randomBytes` helper instead of `Math.random`.
This resolves CodeQL alerts 450 through 522 and prevents predictable randomness
from becoming normalized in tests that exercise authentication and authorization
boundaries.

A source regression scans every Playwright helper and specification, requires
the shared helper to remain CSPRNG-backed and refuses any executable
`Math.random()` call. The retained files pass JavaScript syntax checks; the removed HTML4 browser
specifications no longer form part of this coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e80c92f1e">Fix the Meteor client test bundle</a>. Thanks to xet7.</summary>

The isomorphic change-history integrity helper now computes synchronous SHA-256
without importing Node `crypto`, so client tests no longer pull in
`crypto-browserify` and fail on its unresolved `vm` and `stream` modules. Test
vectors compare the implementation with Node's SHA-256, and the compiled client
source map is free of the former dependency chain. The language-loading test
now checks i18next state without a dynamic `require` warning. Test-run signal
handlers disarm themselves before cleanup, preventing repeated Ctrl-C presses
from recursively restarting port cleanup.

</details>

**Documentation** - deployment email configuration.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9161c20b3">Document Admin Panel email configuration</a>. Thanks to xet7.</summary>

Snap help, every current Docker Compose example, Unix and Windows start scripts,
and the VirtualBox launcher now explain above `MAIL_URL` that enabling **Enable
below email settings** at Admin Panel / People / Email reveals the additional
email sending options. A regression check keeps that guidance present and in
the correct order across every deployment example.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v11.54 2026-09-06 WeKan ® release

**In short:** **all supported non-English translations are complete** across
boards and cards, workflows, import/export, search, administration, security,
recovery, file and cloud storage, data safety, backups and migrations. All
Boards Table view now has a compact, themed controls row, and Admin Panel
reports show complete, actionable data and controls.

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

**Board rules** - details follow the interface language and bulk actions use the
same themed button style as rule actions.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aef1f02fe">Translate stored rule details on display</a>. Thanks to xet7.</summary>

Rule Details now translates legacy trigger and action descriptions from their
stored creation language into the current interface language. Whole action
phrases use their natural translation before composable rule fragments are
considered, while usernames and unknown imported prose remain unchanged. The
Finnish actor fragment is corrected from `mennessä` to `tekijänä`. Regression
coverage includes the archived-card trigger, moving a card to the top of its
list, embedded username text, empty descriptions and unknown imported values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a20728ed7">Theme Board Rules toolbar actions</a>. Thanks to xet7.</summary>

Select all, unselect all, delete selected and export selected now use the same
shared primary-button theme contract as View rule. Their resting, hover, focus
and active colors therefore follow the selected theme together instead of the
toolbar falling through to the generic button colors. Regression coverage
checks all four actions against the shared View-rule style and rejects
conflicting semantic color classes.

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
