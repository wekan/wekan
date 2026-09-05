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
<summary>Fill the remaining untranslated strings directly, no external service</summary>

Not an issue, and recorded so the next session can pick it up without measuring
the ground again. Run this first — it is the status, and it is always current:

```
node releases/translations/fill-translations.mjs --status
```

**What is DONE.** The known cross-script and Latin-script mismatches are fixed.
Values written in another SCRIPT — `ko`/`ko-KR` (Japanese kana, then 80 more
of pure CJK each), `ka` (Russian), `hi`/`hi-IN` (Gujarati), `ta` (Telugu and
Devanagari): **5,542 values**. Values written in the LATIN alphabet inside a
language that does not use it — `el`/`el-GR` (Italian), `th` (Vietnamese),
`ar-DZ` (French), `ka` again (Turkish), `mn`, and a tail of small ones:
**3,174 more**. `node releases/translations/wrong-script.mjs --count` reports
**zero for both checks** across all 246 files. That proves script consistency,
not language consistency; `hi`, `ta`, `th` and `el` were written by looking the
words up rather than by native speakers, so a review remains welcome.

**Same-script repair is now in progress.** Comparing Mongolian with Russian
found **1,174 exact Cyrillic matches**. The archive/board, card, attachment,
checklist/subtask, filter and label batches replaced **176 Russian values** with
Mongolian and retained `Архив` and `Файл` as valid shared loanwords. **998
exact-match candidates remain to audit** in
coherent UI batches; equality is evidence of copying, but shared loanwords must
be reviewed rather than blindly replaced. A Transifex translation in the
correct language replaces a direct repair permanently.

**Placeholder repair is now measured repository-wide.** The first audit found
**1,346 keys across 120 locale files** whose underscore-delimited or
percent-prefixed token inventory differed from the same English key. Restoring
four Mongolian keys made that locale clean; **1,342 mismatched keys across 119
locale files remained**. The next batch repaired every locale with exactly one
mismatch: eleven keys across eleven files. **1,331 mismatched keys across 108
locale files remained**. The following tier repaired 34 counted mismatches and
four Welsh HTML placeholder remnants across seventeen files. **1,297 mismatched
keys across 91 locale files remained**. The next tier repaired 54 counted
mismatches plus a hidden Xhosa machine remnant across eighteen files. **1,243
mismatched keys across 73 locale files remained**. The following tier repaired
56 mismatches across fourteen files. **1,187 mismatched keys across 59 locale
files remained**. The coherent part of the five-mismatch tier repaired 55 keys
across eleven French, German and Hindi variants. **1,132 mismatched keys across
48 locale files remained**. Breton, Walloon, Wolof and Klingon then received
language-specific rewrites for their twenty mismatches inside wrongly seeded
French or German prose. **1,112 mismatched keys across 44 locale files remain**
for audited batches. The coherent part of the six-mismatch tier then repaired
60 logical locale values across ten Azerbaijani, Catalan and Russian tags (nine
tracked data files plus the `ru-RU` symlink alias). **1,052 mismatched keys
across 34 locale files remained**. Italian, Venda and Volapük then completed the
tier with eighteen more repairs, including language-specific rewrites of the
wrongly seeded Venda and Volapük prose. **1,034 mismatched keys across 31 locale
files remained**. A deterministic Transifex-marker pass then restored **1,208
numbered machine markers in 539 translated values across five files**, making
Igbo and Yoruba clean and reducing the counted backlog to **546 mismatched keys
across 29 locale files**. The remaining 32 Odia, Turkmen and Uyghur values then
completed those three locales, leaving **514 mismatched keys across 26 locale
files**. Acehnese, Indonesian, Turkish and Traditional Chinese then completed the
seven-mismatch tier, leaving **486 mismatched keys across 22 locale files**.
Latvian, Norwegian Bokmål, Occitan and Hong Kong Chinese then repaired 37 more
values, leaving **449 mismatched keys across 18 locale files**. Ten Afrikaans,
Romanian and Chinese family files then restored 145 values, leaving **304
mismatched keys across eight locale files**. Ukrainian, Estonian, Arabic-family
and Tamazight repairs completed the final 304 values. **The repository-wide
placeholder mismatch count is now zero.** The separate direct-fill report, now
excluding invariant values that require no translation, had **202,628 genuinely
untranslated values across 210 locale files**. Compact direct-fill batches have
since completed 28 locale files, leaving **202,139 genuinely untranslated values
across 182 locale files**. Portuguese, Thai, Venda, Zulu, Esperanto, Spanish and
Turkish batches then completed another 20 locale files, leaving **201,748
genuinely untranslated values across 162 locale files**. Hungarian, Latvian,
Basque and Uyghur then completed 84 more values, leaving **201,664 genuinely
untranslated values across 158 locale files**. Breton, Lithuanian and Yiddish
then completed 66 more values, leaving **201,598 genuinely untranslated values
across 155 locale files**. Galician, Xhosa, Swahili, Asturian, Welsh and Uzbek
then completed 268 more values, leaving **201,330 genuinely untranslated
values across 144 locale files**. Azerbaijani, Croatian, Polish, Slovak,
Estonian, Romanian and Walloon then completed 290 more values, leaving
**201,040 genuinely untranslated values across 133 locale files**. Indonesian,
Occitan, Brazilian Portuguese, Turkmen, Tamazight, Acehnese, Czech, Slovenian
and Volapük then completed 317 more values, leaving **200,723 genuinely
untranslated values across 122 locale files**. Valencian then completed 31
more values, leaving **200,692 genuinely untranslated values across 121 locale
files**. Walloon, Yoruba, Italian, Catalan and Klingon then completed 202 more
values, leaving **200,490 genuinely untranslated values across 115 locale
files**. Igbo, Swedish, Afrikaans, Malay, Danish and Norwegian Bokmål then
completed 304 more values, leaving **200,186 genuinely untranslated values
across 107 locale files**. Wolof, French, West Frisian and German then completed
656 more values, leaving **199,530 genuinely untranslated values across 95
locale files**. Dutch and Flemish then completed 205 more values, leaving
**199,325 genuinely untranslated values across 92 locale files**. The remaining
queue now consists of whole-file-sized locale fills. Forty-three 50-value
Amharic batches and a final 16-value batch translated all 2,166 values.
Forty-three 50-value Assamese batches and a final 16-value batch then
translated all 2,166 values, leaving **194,993 genuinely untranslated values
across 90 locale files**. Forty-three 50-value Bashkir batches and a final
16-value batch then translated all 2,166 values. Forty-three 50-value Bhojpuri
batches and a final 16-value batch then translated all 2,166 values, leaving
**190,661 genuinely untranslated values across 88 locale files**. Forty-three
50-value Bambara batches and a final 16-value batch then translated all 2,166
values, leaving **188,495 genuinely untranslated values across 87 locale
files**. Forty-three 50-value Bengali batches and a final 16-value batch then
translated all 2,166 values, leaving **186,329 genuinely untranslated values
across 86 locale files**. Forty-three 50-value Tibetan batches and a final
16-value batch then translated all 2,166 values. Forty-two 50-value Buryat
batches and a final 66-value batch then translated all 2,166 values. The first
forty-three 50-value Cherokee batches and a final 16-value batch then translated
all 2,166 Cherokee values. Forty-two 50-value Central Kurdish batches and a
final 66-value batch then translated all 2,166 Central Kurdish values. The first
forty-two 50-value Chuvash batches and a final 66-value batch then translated
all 2,166 Chuvash values, leaving **175,499 genuinely untranslated values across
81 locale files**. Forty-two 50-value Dzongkha batches and a final 66-value
batch then translated all 2,166 Dzongkha values. Forty-two 50-value Ewe batches
and a final 66-value batch then translated all 2,166 Ewe values. The first
forty-one 50-value Fulah batches, two 49-value batches and a final 17-value
batch then translated 2,165 actionable values. `Bucket` and `Log` are invariant
product terms that need no translation, completing Fulah. Forty-three 50-value
Fijian batches and a final 14-value batch then translated 2,164 actionable
values. `Menu`, `Log` and `Server` are invariant product terms, completing
Fijian. Thirteen 50-value Faroese batches, twenty-four 49-value batches, six
48-value batches and a final 51-value batch then translated all 2,166
actionable Faroese values. `Menu` and `Bucket` are invariant product terms,
completing Faroese. Forty-three 50-value Irish batches and a final 17-value batch
completed Irish. Forty-two 50-value Scottish Gaelic batches, one 49-value batch
and a final 17-value batch completed Scottish Gaelic. `Log` is an invariant
technical term. One new Sandstorm warning was then translated in both Galician
variants, Xhosa, Acehnese, both Afrikaans variants, Amharic, three Arabic
variants, Moroccan Arabic, Assamese, Asturian, three Azerbaijani variants,
Bashkir, Belarusian, Bulgarian, Bhojpuri, Bambara, Bengali and Tibetan. Breton,
Buryat, three Catalan variants, Cherokee, Central Kurdish, Mandarin and
both Czech variants followed, then Chuvash, both Welsh variants, Danish, four
German variants, Dzongkha, Ewe, both Greek variants, Esperanto and seven Spanish
variants. Base Spanish, Colombian Spanish, Estonian, Basque, both Persian
variants, Finnish and three French variants followed, then two more French
variants, both West Frisian variants, Gujarati, both Hebrew variants, both Hindi
variants and Croatian. Hungarian, Armenian, Indonesian, Igbo, Italian, three
Japanese variants, Georgian and Cambodian Khmer followed, then base Khmer, both
Korean variants, Lithuanian, Latvian, Macedonian, Mongolian, both Malay variants
and Norwegian Bokmål. Both Dutch variants, Occitan, Odia, Punjabi, both Polish
variants and three Portuguese variants followed. The underscored Portuguese
locale, both Romanian variants, four Russian variants,
Slovak and both Slovenian variants followed. Serbian, Swedish, Swahili, Tamil,
Telugu, Thai, Turkmen, Klingon, Turkish and Uyghur followed. The Klingon wording
is low confidence. Both Ukrainian variants, four Uzbek variants, three Venda
variants and Vietnamese for Vietnam followed. The Uzbek Arabic and Venda wording
is low confidence. Base Vietnamese, Flemish, Volapük, Wáray-Wáray, Walloon,
Wolof, Wu Chinese, Yiddish, Yoruba and Cantonese followed. The Volapük,
Wáray-Wáray, Walloon and Wolof wording is low confidence. Standard Moroccan
Tamazight, eight Chinese variants and South African Zulu followed. The Tamazight
wording is low confidence. Base Zulu followed. The first 50-value Guarani batch
then translated activity, member, comment and archive strings; the second added
card movement, checklist activity and workspace strings; the third added board
selection, Home-board, sizing and checklist controls. The fourth 50-value batch
added membership, administration, archive, background
and board-summary strings; the fifth added view, zoom, calendar, archive warning
and card-editing strings; the sixth added voting, Planning Poker, dependency and
import-dialog strings; the seventh added member mapping, theme, font and avatar
controls; the eighth added starring, automatic sizing, card aging, navigation
and color names; the ninth added role permissions, copy actions and custom-field
types; the tenth added email templates, permanent deletion, WIP and import-error
messages; the eleventh added card export, sorting and date/member filtering.
The twelfth added advanced filtering and board-import guidance for supported
services and file formats; the thirteenth added Trello API/ZIP progress, member
mapping and invitation strings; the fourteenth added archive, list movement,
multi-selection, board role and notification controls; the fifteenth added
privacy, member removal, search, rescue and keyboard-shortcut strings. The
Sandstorm warning wording is low confidence. The sixteenth added starring,
time tracking, upload, custom-logo, welcome-board and WIP warning strings. The
seventeenth added attachment/API limits, SMTP invitations, webhooks and
server-version labels. A 49-value eighteenth batch added database/OS metrics,
field display, visibility, organization, team and multitenancy strings;
`FerretDB commit` is an invariant technical label. A 49-value nineteenth batch
added card dates, deletion safeguards, subtask/card settings and parent-card
display. The twentieth 50-value batch added label/attachment activities and the
visual rule workflow, triggers, imports and exports. The twenty-first 50-value
batch added imported visual workflows, schedules, due-date triggers, rule
buttons, relative dates and rule units. The twenty-second 50-value batch added
rule grammar for card movement, labels, members, attachments, checklists and
email actions. The twenty-third 50-value batch added concrete rule actions,
date fields, authentication and custom HTML/manifest settings. The twenty-fourth
50-value batch added counters, layout positions, due-time notifications,
account deletion safeguards and resize controls. The twenty-fifth 50-value batch
added editor behavior, management dialogs, notification filters, board-role
permissions, weekdays and status labels. The twenty-sixth 50-value batch added
linked-card safeguards, shared templates, domain scopes, card views, global
search and missing-item messages. The twenty-seventh 50-value batch added
missing-result messages and Guarani search operators and predicates. The
twenty-eighth 50-value batch added search validation, paging and detailed
operator instructions. The twenty-ninth 50-value batch added sorting, completion,
stickers, card dependencies, board backgrounds and locations. The thirtieth
50-value batch added map detection, server troubleshooting, custom-field
templates, reports and office-login summaries. The thirty-first 50-value batch
added API and recovery reports, wait indicators, safeguards, tickets and request
statuses. The thirty-second 50-value batch added teams, organizations, Node
memory metrics, legal notices, checklist actions and attachment storage. The
thirty-third 50-value batch added bulk attachment movement, storage repair,
file statistics and MongoDB compaction guidance. The thirty-fourth 50-value
batch added board status, upload rules, custom translations, checklist display,
support and accessibility. The thirty-fifth 50-value batch added accessibility
content, login lockout protection, attachment paths and scheduled board
operations. The thirty-sixth 50-value batch added scheduled migration controls,
filesystem and cloud storage settings, database migration and Sandstorm status.
The thirty-seventh 50-value batch added Sandstorm cleanup, card-loading modes,
secure rendering, import/export privacy controls and backup scopes. The
thirty-eighth 50-value batch added backup schedules and restoration plus
S3, Azure and Google Cloud storage setup guidance. The thirty-ninth 50-value
batch added attachment storage targets, migration controls, S3 settings and
scheduled board operations. The fortieth 50-value batch added comprehensive
board repairs, lost-card recovery and migration progress steps. The forty-first
50-value batch added migration repair steps, board conversion,
CPU and storage metrics, schedules and job-queue labels. The forty-second
50-value batch added attachment migration controls, resource thresholds,
monitoring, progress and storage statistics. The forty-third 50-value batch
added repositories, account access, problem reporting, card repair and event
metrics. The final 18-value forty-fourth batch added event addresses, filesystem
integrity, scoped export and board-import guidance, completing all actionable
Guarani values; `FerretDB commit` remains an invariant technical label. This left
**158,253 genuinely untranslated values across 77 locale files**. The first
50-value Manx batch then added activity, deletion, comment, checklist, member
and archive strings. The second 50-value Manx batch added movement, checklist
activity and workspace strings. The third 50-value Manx batch added workspace
selection, Home-board, sizing and checklist controls. The fourth 50-value Manx
batch added administration, archives, backgrounds, board summaries and member
labels. The fifth 50-value Manx batch added visibility, views, zoom, calendar,
archive warnings and card editing. The sixth 50-value Manx batch added voting,
Planning Poker, dependencies and import-dialog strings. The seventh 50-value
Manx batch added member mapping, themes, fonts, avatars and permissions. The
eighth 50-value Manx batch added starring, automatic sizing, card aging,
navigation and color names. The ninth 50-value Manx batch added role
permissions, copy actions and custom-field types. The tenth 50-value Manx batch
added email templates, permanent deletion, WIP controls and import-error
messages. The eleventh 50-value Manx batch added card export, sorting and
date/member filtering. The twelfth 50-value Manx batch added advanced filtering
and board-import guidance for supported services and file formats. The
thirteenth 50-value Manx batch added Trello API/ZIP progress, member mapping
and invitation strings. The fourteenth 50-value Manx batch added archive, list
movement, multi-selection, board-role and notification controls. The fifteenth
50-value Manx batch added privacy, member removal, search, rescue
and keyboard-shortcut strings. The Sandstorm warning wording is low confidence.
The sixteenth 50-value Manx batch added starring, time tracking, upload,
custom-logo, welcome-board and WIP warning strings. The seventeenth 50-value
Manx batch added attachment/API limits, SMTP invitations, webhooks and
server-version labels. The eighteenth 50-value Manx batch added database/OS
metrics, field display, visibility, organization, team and multitenancy strings.
The nineteenth 50-value Manx batch added card dates, deletion safeguards,
subtask/card settings and parent-card display. The twentieth 50-value Manx batch
added label/attachment activities and the visual rule workflow, triggers,
imports and exports. The twenty-first 50-value Manx batch added imported visual
workflows, schedules, due-date triggers, rule buttons, relative dates and units.
The twenty-second 50-value Manx batch added rule grammar for card movement,
labels, members, attachments, checklists and email actions. The twenty-third
50-value Manx batch added concrete rule actions, date fields, authentication and
custom HTML/manifest settings. The twenty-fourth 50-value Manx batch added
member lists, custom HTML, due-time notifications, account deletion safeguards
and resize controls. The twenty-fifth 50-value Manx batch added editor behavior,
management dialogs, notification filters, board-role permissions, weekdays and
status labels. The twenty-sixth 50-value Manx batch added linked-card safeguards,
shared templates, domain scopes, card views, global search and missing-item
messages. The twenty-seventh 50-value Manx batch added missing-result messages
and Manx search operators and predicates. The twenty-eighth 50-value Manx batch
added search validation, paging and detailed operator instructions. The
twenty-ninth 50-value Manx batch added sorting, completion, stickers, card
dependencies, board backgrounds and locations. The thirtieth 50-value Manx
batch added map detection, server troubleshooting, custom-field templates,
reports and office-login summaries. The thirty-first 50-value Manx batch added
API and recovery reports, wait indicators, safeguards, tickets and request
statuses. The thirty-second 50-value Manx batch added teams, organizations, Node
memory metrics, legal notices, checklist actions and attachment storage. The
thirty-third 50-value Manx batch added bulk attachment movement, storage
repair, file statistics and MongoDB compaction guidance. This left **156,603 genuinely
untranslated values across 77 locale files**. The thirty-fourth 50-value Manx
batch added board status, upload rules, custom translations, checklist display,
support and accessibility. This left **156,553 genuinely untranslated values
across 77 locale files**. The thirty-fifth 50-value Manx batch added
accessibility content, login lockout protection, user status controls,
attachment paths and scheduled board operations. This left **156,503 genuinely
untranslated values across 77 locale files**. The thirty-sixth 50-value Manx
batch added scheduled-job controls, migration diagnostics, filesystem and cloud
storage settings, database migration and Sandstorm status. This left **156,453
genuinely untranslated values across 77 locale files**. The thirty-seventh
50-value Manx batch added Sandstorm cleanup, card-loading modes, secure
rendering, import/export privacy controls and backup scopes. This left
**156,403 genuinely untranslated values across 77 locale files**.
The thirty-eighth 20-value Manx batch added backup schedules, restoration
controls and initial Google Cloud storage labels. This left **156,383 genuinely
untranslated values across 77 locale files**.
The thirty-ninth 50-value Manx batch added cloud credentials guidance,
provider-specific storage paths, connection checks and migration controls. This
left **156,333 genuinely untranslated values across 77 locale files**.
The fortieth 50-value Manx batch added S3 settings, scheduled board operations,
attachment monitoring and board-data repair migrations. This left **156,283
genuinely untranslated values across 77 locale files**.
The forty-first 50-value Manx batch added board migration confirmations,
progress reporting and repair-step descriptions. This left **156,233 genuinely
untranslated values across 77 locale files**.
The forty-second 50-value Manx batch added resource monitoring, job schedules,
attachment storage migrations and throttling controls. This left **156,183
genuinely untranslated values across 77 locale files**.
The forty-third 50-value Manx batch added migration monitoring, pagination,
repository management and account-access errors. This left **156,133 genuinely
untranslated values across 77 locale files**.
The final 47-value Manx batch added account validation, problem diagnostics,
card repair reporting and scoped import/export instructions. Manx is now
complete, leaving **156,086 genuinely untranslated values across 77 locale
files**.
The warning-only follow-up translated eight newly exposed Scottish Gaelic,
Fulah, Faroese and Fijian interface terms. Those locales are complete again,
leaving **156,078 genuinely untranslated values across 73 locale files**.
The final low-confidence Guarani technical label translated `commit` while
retaining the FerretDB product name. Guarani is now complete, leaving
**156,077 genuinely untranslated values across 72 locale files**. The first
50-value Hausa batch added activity history, organization restrictions,
comments, checklists, labels and archive actions. This left **156,027 genuinely
untranslated values across 72 locale files**. The second 50-value Hausa batch
added movement history, activity summaries and workspace management. This left
**155,977 genuinely untranslated values across 72 locale files**. The third
50-value Hausa batch added board selection, Home boards, list sizing, keyboard
shortcuts and checklist controls. This left **155,927 genuinely untranslated
values across 72 locale files**. The fourth 50-value Hausa batch added
administration notices, archives, templates, background images, board-member
summaries and privacy labels. This left **155,877 genuinely untranslated values
across 72 locale files**. The fifth 50-value Hausa batch added public-board
guidance, display modes, calendars, archive safeguards and card editing. This
left **155,827 genuinely untranslated values across 72 locale files**.
The sixth 50-value Hausa batch added card membership, voting, Planning Poker,
dependencies, organization links and import dialogs. This left **155,777
genuinely untranslated values across 72 locale files**. The seventh 50-value
Hausa batch added member mapping, themes, fonts, avatars and permissions. This
left **155,727 genuinely untranslated values across 72 locale files**. The
eighth 50-value Hausa batch added starring, automatic widths, card aging,
keyboard movement, accessible dialogs and colors. This left **155,677 genuinely
untranslated values across 72 locale files**. The ninth 50-value Hausa batch
added board roles, deletion confirmations, clipboard actions, bulk card JSON
and custom fields. This left **155,627 genuinely untranslated values across 72
locale files**. The tenth 50-value Hausa batch added profile controls, email
templates, WIP settings and detailed permission and import errors. This left
**155,577 genuinely untranslated values across 72 locale files**. The eleventh
50-value Hausa batch added account conflicts, card exports, attachment metadata,
sorting and date/member filters. This left **155,527 genuinely untranslated
values across 72 locale files**. The twelfth 50-value Hausa batch added advanced
filters, imported-member handling and detailed Kanboard, Deck, OpenProject,
issue, Asana, ZenKit, Jira, Excel, WeKan and Trello imports. This left **155,477
genuinely untranslated values across 72 locale files**. The thirteenth 50-value
Hausa batch added Trello API and ZIP imports, cancellation and recovery,
member mapping, validation messages and label actions. This left **155,427
genuinely untranslated values across 72 locale files**. The fourteenth 50-value
Hausa batch added board departure, list archival, role settings, selection
tools, muted watching and membership states. This left **155,377 genuinely
untranslated values across 72 locale files**. The fifteenth 50-value Hausa batch
added watch notifications, visibility guidance, member removal, search, WIP
limits, keyboard shortcuts and default-board controls. This left **155,327
genuinely untranslated values across 72 locale files**. The sixteenth 50-value
Hausa batch added starred boards, time tracking, uploads, custom branding,
welcome templates and WIP-limit guidance. This left **155,277 genuinely
untranslated values across 72 locale files**. The seventeenth 50-value Hausa
batch added attachment and API limits, registration, SMTP invitations,
webhooks and runtime version labels. This left **155,227 genuinely untranslated
values across 72 locale files**. The eighteenth 50-value Hausa batch added
database and operating-system diagnostics, time units, custom-field display
settings, visibility labels and organization administration. This left
**155,177 genuinely untranslated values across 72 locale files**. The nineteenth
50-value Hausa batch added card dates and colors, deletion safeguards, subtask
and card settings, minicard display choices and parent-card paths. This left
**155,127 genuinely untranslated values across 72 locale files**. The twentieth
50-value Hausa batch added label and custom-field activity, visual rule editing,
card event triggers and JSON, CSV and Trello Butler rule transfers. This left
**155,077 genuinely untranslated values across 72 locale files**. The
twenty-first 50-value Hausa batch added visual-workflow imports, scheduled and
button triggers, due-date timing, list sorting, relative dates and rule grammar.
This left **155,027 genuinely untranslated values across 72 locale files**. The
twenty-second 50-value Hausa batch added rule grammar for card movement,
archives, labels, members, checklists and email actions. This left **154,977
genuinely untranslated values across 72 locale files**. The twenty-third
50-value Hausa batch added concrete rule actions, date fields, authentication
and custom HTML and manifest settings. This left **154,927 genuinely
untranslated values across 72 locale files**. The twenty-fourth 50-value Hausa
batch added member lists, custom HTML, authentication controls, destructive
safeguards, date reminders, selection placement and resize controls. This left
**154,877 genuinely untranslated values across 72 locale files**. The
twenty-fifth 50-value Hausa batch added multi-card editing, organization and
user dialogs, notification filters, board-role permissions, weekdays and status
labels. This left **154,827 genuinely untranslated values across 72 locale
files**. The twenty-sixth 50-value Hausa batch added linked-card safeguards,
shared templates, domain scopes, card views, global search and missing-item
messages. This left **154,777 genuinely untranslated values across 72 locale
files**. The twenty-seventh 50-value Hausa batch added missing-result messages
and Hausa search operators and predicates. This left **154,727 genuinely
untranslated values across 72 locale files**. The twenty-eighth 50-value Hausa
batch added search validation, paging and detailed operator instructions. This
left **154,677 genuinely untranslated values across 72 locale files**. The
twenty-ninth 50-value Hausa batch added sorting, completion, stickers, card
dependencies, board backgrounds and locations. This left **154,627 genuinely
untranslated values across 72 locale files**. The thirtieth 50-value Hausa batch
added map detection, server troubleshooting, custom-field templates, reports
and office-login summaries. This left **154,577 genuinely untranslated values
across 72 locale files**. The thirty-first 50-value Hausa batch added API and
recovery reports, wait indicators, safeguards, tickets and request statuses.
This left **154,527 genuinely untranslated values across 72 locale files**. The
thirty-second 50-value Hausa batch added teams, organizations, Node memory
metrics, legal notices, checklist actions and attachment storage. This left
**154,477 genuinely untranslated values across 72 locale files**. The
thirty-third 50-value Hausa batch added bulk attachment movement, storage
repair, file statistics and MongoDB compaction guidance. This left **154,427
genuinely untranslated values across 72 locale files**. The thirty-fourth
50-value Hausa batch added board status, upload rules, custom translations,
checklist display, support and accessibility. This left **154,377 genuinely
untranslated values across 72 locale files**. The thirty-fifth 50-value Hausa
batch added accessibility content, login lockout protection, user status
controls, attachment paths and scheduled board operations. This left **154,327
genuinely untranslated values across 72 locale files**. The thirty-sixth
50-value Hausa batch added scheduled-job controls, migration diagnostics,
filesystem and cloud storage settings, database migration and Sandstorm status.
This left **154,277 genuinely untranslated values across 72 locale files**. The
thirty-seventh 50-value Hausa batch added Sandstorm cleanup, card-loading modes,
secure rendering, import and export privacy controls and backup scopes. This
left **154,227 genuinely untranslated values across 72 locale files**. The
thirty-eighth 50-value Hausa batch added backup schedules, restoration controls,
cloud credentials, provider-specific paths and connection tests. This left
**154,177 genuinely untranslated values across 72 locale files**. The
thirty-ninth 50-value Hausa batch added GridFS and S3 settings, migration
controls, scheduled board operations and attachment monitoring. This left
**154,127 genuinely untranslated values across 72 locale files**. The fortieth
50-value Hausa batch added board-data integrity checks, lost-card and archived
item restoration, URL repair and migration progress. This left **154,077
genuinely untranslated values across 72 locale files**. The forty-first 50-value
Hausa batch added repair steps, board conversion, resource monitoring, job
schedules, attachment storage metrics and queue controls. This left **154,027
genuinely untranslated values across 72 locale files**. The forty-second
50-value Hausa batch added migration throttling, progress monitoring, resource
metrics and attachment statistics. This left **153,977 genuinely untranslated
values across 72 locale files**. The forty-third 50-value Hausa batch added
repository access, account validation, problem summaries, card repair, CPU
status and event fields. This left **153,927 genuinely untranslated values
across 72 locale files**. The final 17-value Hausa batch added network event
details, filesystem integrity, scoped import and export guidance and numeric
search instructions. Hausa is now complete, leaving **153,910 genuinely
untranslated values across 71 locale files**. The first 50-value Haitian Creole
batch added activity history, organization restrictions, comments, checklists,
labels and archive actions. This left **153,860 genuinely untranslated values
across 71 locale files**. The second 50-value Haitian Creole batch added card
movement, activity summaries and workspace management. This left **153,810
genuinely untranslated values across 71 locale files**. The third 50-value
Haitian Creole batch added workspace selection, Home boards, list sizing,
keyboard shortcuts and checklist controls. This left **153,760 genuinely
untranslated values across 71 locale files**. The fourth 50-value Haitian
Creole batch added administration notices, archives, templates, background
images, board-member summaries and privacy labels. This left **153,710
genuinely untranslated values across 71 locale files**. The fifth 50-value
Haitian Creole batch added public-board guidance, display modes, calendars,
archive safeguards and card editing. This left **153,660 genuinely untranslated
values across 71 locale files**. The sixth 50-value Haitian Creole batch added
card membership, voting, Planning Poker, dependencies, organization links and
import dialogs. This left **153,610 genuinely untranslated values across 71
locale files**. The seventh 50-value Haitian Creole batch added member dialogs,
linked items, imported-user mapping, themes, fonts and account preferences. This
left **153,560 genuinely untranslated values across 71 locale files**. The
eighth 50-value Haitian Creole batch added favorites, automatic list sizing,
card aging, movement controls, accessible dialogs and color names. This left
**153,510 genuinely untranslated values across 71 locale files**. The ninth
50-value Haitian Creole batch added restricted board roles, deletion warnings,
clipboard actions, bulk card copying and custom-field controls. This left
**153,460 genuinely untranslated values across 71 locale files**. The tenth
50-value Haitian Creole batch added profile editing, WIP limits, transactional
email, permanent deletion safeguards and import and permission errors. This left
**153,410 genuinely untranslated values across 71 locale files**. The eleventh
50-value Haitian Creole batch added account conflicts, card exports, attachment
metadata, list sorting and card filters. This left **153,360 genuinely
untranslated values across 71 locale files**. The twelfth 50-value Haitian
Creole batch added advanced filtering, activity and member states, multi-source
board imports and Trello archive diagnostics. This left **153,310 genuinely
untranslated values across 71 locale files**. The thirteenth 50-value Haitian
Creole batch added Trello API imports, job progress and cancellation, member
mapping, input validation and label controls. This left **153,260 genuinely
untranslated values across 71 locale files**. The fourteenth 50-value Haitian
Creole batch added board departure, list archiving, workspace settings,
multi-selection, archived-item states and notification roles. This left
**153,210 genuinely untranslated values across 71 locale files**. The fifteenth
50-value Haitian Creole batch added watch notifications, public and private page
guidance, member removal, search, keyboard shortcuts and sidebar controls. This
left **153,160 genuinely untranslated values across 71 locale files**. The
sixteenth 50-value Haitian Creole batch added favorites, time tracking, uploads,
custom branding, welcome templates and WIP-limit guidance. This left **153,110
genuinely untranslated values across 71 locale files**. The seventeenth
50-value Haitian Creole batch added attachment and API limits, registration,
SMTP invitations, webhooks and server-version labels. This left **153,060
genuinely untranslated values across 71 locale files**. The eighteenth 50-value
Haitian Creole batch added database and operating-system diagnostics, custom
field display, account controls and organization and team tenancy. This left
**153,010 genuinely untranslated values across 71 locale files**. The nineteenth
50-value Haitian Creole batch added card dates and colors, deletion safeguards,
subtask destinations, mini-card display and parent relationships. This left
**152,960 genuinely untranslated values across 71 locale files**. The twentieth
50-value Haitian Creole batch added label and custom-field activity, rule
editing, workflow triggers and rule import and export. This left **152,910
genuinely untranslated values across 71 locale files**. The twenty-first
50-value Haitian Creole batch added visual-workflow imports, scheduled and
button triggers, due-date conditions, list sorting and relative dates. This left
**152,860 genuinely untranslated values across 71 locale files**. The
twenty-second 50-value Haitian Creole batch added automation fragments for card
movement, labels, members, checklists, archive actions and email. This left
**152,810 genuinely untranslated values across 71 locale files**. The
twenty-third 50-value Haitian Creole batch added rule actions for cards,
checklists and dates, authentication labels, custom web metadata and layout
controls. This left **152,760 genuinely untranslated values across 71 locale
files**. The twenty-fourth 50-value Haitian Creole batch added member lists,
custom body HTML, authentication errors, date reminders, destructive account
warnings and resizable navigation. This left **152,710 genuinely untranslated
values across 71 locale files**. The twenty-fifth 50-value Haitian Creole batch
added multi-window cards, organization and user dialogs, notification states,
role permissions, weekdays and linked-card deletion guidance. This left
**152,660 genuinely untranslated values across 71 locale files**. The
twenty-sixth 50-value Haitian Creole batch added linked-list safeguards, shared
template domains, personal and due-card views, global search and missing-item
errors. This left **152,610 genuinely untranslated values across 71 locale
files**. The twenty-seventh 50-value Haitian Creole batch added search-result
counts plus board, user, date, attachment and checklist query operators and
predicates. This left **152,560 genuinely untranslated values across 71 locale
files**. The twenty-eighth 50-value Haitian Creole batch added search predicate
validation, pagination and detailed global-search operator documentation. This
left **152,510 genuinely untranslated values across 71 locale files**. The
twenty-ninth 50-value Haitian Creole batch added card and board sorting,
stickers, dependency visualization and imports, board backgrounds and card
locations. This left **152,460 genuinely untranslated values across 71 locale
files**. The thirtieth 50-value Haitian Creole batch added map locations,
server troubleshooting, board activity, string templates and administration
reports. This left **152,410 genuinely untranslated values across 71 locale
files**. The thirty-first 50-value Haitian Creole batch added office and API
reporting, database recovery, loading indicators, card sizing and support-ticket
states. This left **152,360 genuinely untranslated values across 71 locale
files**. The thirty-second 50-value Haitian Creole batch added team and
organization membership, Node memory diagnostics, legal notices, checklist
actions and attachment storage moves. This left **152,310 genuinely untranslated
values across 71 locale files**. The thirty-third 50-value Haitian Creole batch
added bulk attachment migration, storage repair, file statistics and MongoDB
compaction guidance. This left **152,260 genuinely untranslated values across
71 locale files**. The thirty-fourth 50-value Haitian Creole batch added board
status, upload policies, custom translations, checklist display and support and
accessibility pages. This left **152,210 genuinely untranslated values across 71
locale files**. The thirty-fifth 50-value Haitian Creole batch added brute-force
lockout controls, user-state filters, attachment paths and scheduled board
operations. This left **152,160 genuinely untranslated values across 71 locale
files**. The thirty-sixth 50-value Haitian Creole batch added scheduled-job and
migration recovery, filesystem and cloud storage, database migration and
Sandstorm migration status. This left **152,110 genuinely untranslated values
across 71 locale files**. The thirty-seventh 50-value Haitian Creole batch added
Sandstorm cleanup, adaptive card loading, safe rich-text rendering, import and
export privacy and streamed backups. This left **152,060 genuinely untranslated
values across 71 locale files**. The thirty-eighth 50-value Haitian Creole batch
added scheduled backups, restore modes, Google Cloud credentials, cloud-console
paths and connection diagnostics. This left **152,010 genuinely untranslated
values across 71 locale files**. The thirty-ninth 50-value Haitian Creole batch
added GridFS and S3 configuration, migration lifecycle controls, scheduled board
maintenance and attachment monitoring. This left **151,960 genuinely
untranslated values across 71 locale files**. The fortieth 50-value Haitian
Creole batch added comprehensive board repair, lost-card restoration, URL fixes,
migration confirmations and progress steps. This left **151,910 genuinely
untranslated values across 71 locale files**. The forty-first 50-value Haitian
Creole batch added repair-step progress, board conversion, CPU status, recurring
schedules and migration job monitoring. This left **151,860 genuinely
untranslated values across 71 locale files**. The forty-second 50-value Haitian
Creole batch added migration resource limits, background progress, monitoring
controls, attachment statistics and operation scheduling. This left **151,810
genuinely untranslated values across 71 locale files**. The forty-third 50-value
Haitian Creole batch added repository access, account validation, problem
summaries, card repair, CPU status and event fields. This left **151,760
genuinely untranslated values across 71 locale files**. The final 17-value
Haitian Creole batch added network event details, filesystem integrity, scoped
import and export guidance and numeric search instructions. Haitian Creole is
now complete, leaving **151,743 genuinely untranslated values across 70 locale
files**. The first 50-value Icelandic batch added activity history for titles,
organizations, comments, attachments, labels, checklists and archive actions.
This left **151,693 genuinely untranslated values across 70 locale files**. The
second 50-value Icelandic batch added card movement, compact activity summaries,
checklist history and workspace management. This left **151,643 genuinely
untranslated values across 70 locale files**. The third 50-value Icelandic batch
added workspace selection, Home boards, list sizing, keyboard shortcuts,
swimlane heights and checklist controls. This left **151,593 genuinely
untranslated values across 70 locale files**. The fourth 50-value Icelandic
batch added administration notices, archives, templates, background images,
board-member summaries and privacy labels. This left **151,543 genuinely
untranslated values across 70 locale files**. The fifth 50-value Icelandic batch
added public-board guidance, display modes, calendars, archive safeguards and
card editing. This left **151,493 genuinely untranslated values across 70 locale
files**. The sixth 50-value Icelandic batch added card membership, voting,
Planning Poker, dependencies, organization links and import dialogs. This left
**151,443 genuinely untranslated values across 70 locale files**. The seventh
50-value Icelandic batch added member dialogs, linked items, imported-user
mapping, themes, fonts and account preferences. This left **151,393 genuinely
untranslated values across 70 locale files**. The eighth 50-value Icelandic
batch added favorites, automatic list sizing, card aging, movement controls,
accessible dialogs and color names. This left **151,343 genuinely untranslated
values across 70 locale files**. The ninth 50-value Icelandic batch added
restricted board roles, deletion warnings, clipboard actions, bulk card copying
and custom-field controls. This left **151,293 genuinely untranslated values
across 70 locale files**. The tenth 50-value Icelandic batch added custom-field
types, profile controls, account email templates, WIP settings and validation
messages. This left **151,243 genuinely untranslated values across 70 locale
files**. The eleventh 50-value Icelandic batch added account validation, card
exports, attachment metadata, list sorting and date, label and member filters.
This left **151,193 genuinely untranslated values across 70 locale files**. The
twelfth 50-value Icelandic batch added advanced filtering, member states,
cross-platform board import guidance and Trello archive validation. This left
**151,143 genuinely untranslated values across 70 locale files**. The thirteenth
50-value Icelandic batch added Trello API and workspace imports, resumable job
controls, member mapping, input validation and label controls. This left
**151,093 genuinely untranslated values across 70 locale files**. The fourteenth
50-value Icelandic batch added board departure, list archiving, settings dialogs,
bulk selection, role descriptions and participation notifications. This left
**151,043 genuinely untranslated values across 70 locale files**. The fifteenth
50-value Icelandic batch added watch notifications, privacy explanations, member
removal, card-description recovery, search, WIP and keyboard-shortcut controls.
This left **150,993 genuinely untranslated values across 70 locale files**. The
sixteenth 50-value Icelandic batch added starring, time tracking, uploads,
custom branding, watch states, starter templates and WIP validation. This left
**150,943 genuinely untranslated values across 70 locale files**. The
seventeenth 50-value Icelandic batch added attachment and API limits,
registration invitations, SMTP configuration, webhooks and runtime version
labels. This left **150,893 genuinely untranslated values across 70 locale
files**. The eighteenth 50-value Icelandic batch added database and operating
system diagnostics, custom-field display, account visibility and organization
and team tenancy administration. This left **150,843 genuinely untranslated
values across 70 locale files**. The nineteenth 50-value Icelandic batch added
card lifecycle dates, destructive-action warnings, subtask placement, minicard
metadata, parent relationships and label activity. This left **150,793 genuinely
untranslated values across 70 locale files**. The twentieth 50-value Icelandic
batch added label and custom-field activity, visual rule building, event
triggers and JSON, CSV and Trello Butler rule exchange. This left **150,743
genuinely untranslated values across 70 locale files**. The twenty-first
50-value Icelandic batch added n8n and Node-RED workflow imports, scheduled and
button triggers, due-date conditions and list and card automation actions. This
left **150,693 genuinely untranslated values across 70 locale files**. The
twenty-second 50-value Icelandic batch added rule phrases for movement, labels,
members, attachments, checklists, archive restoration and email actions. This
left **150,643 genuinely untranslated values across 70 locale files**. The
twenty-third 50-value Icelandic batch added rule action details for cards,
checklists, swimlanes and dates plus authentication, custom HTML metadata and
layout controls. This left **150,593 genuinely untranslated values across 70
locale files**. The twenty-fourth 50-value Icelandic batch added authentication
display, board duplication, custom body HTML, lifecycle activity, due reminders,
deletion confirmations and resizable layout controls. This left **150,543
genuinely untranslated values across 70 locale files**. The twenty-fifth
50-value Icelandic batch added multi-card windows, editor submission, entity
dialogs, notification states, board-role permissions and weekday settings. This
left **150,493 genuinely untranslated values across 70 locale files**. The
twenty-sixth 50-value Icelandic batch added linked-list safeguards, tasks,
domain-scoped shared templates, personal and due-card views, global search and
missing-entity messages. This left **150,443 genuinely untranslated values
across 70 locale files**. The twenty-seventh 50-value Icelandic batch added
search-result counts, missing user, comment, organization and team messages and
localized search operators and predicates. This left **150,393 genuinely
untranslated values across 70 locale files**. The twenty-eighth 50-value
Icelandic batch added search predicate validation, pagination and complete
operator syntax, status, existence, sorting and date-search guidance. This left
**150,343 genuinely untranslated values across 70 locale files**. The
twenty-ninth 50-value Icelandic batch added board and card sorting, stickers,
card dependency editing and imports, board backgrounds and location entry. This
left **150,293 genuinely untranslated values across 70 locale files**. The
thirtieth 50-value Icelandic batch added map detection, server troubleshooting,
sorting, string templates, activity visibility and administration reports. This
left **150,243 genuinely untranslated values across 70 locale files**. The
thirty-first 50-value Icelandic batch added office and API metrics, recovery
status, swimlane copying, wait indicators, deletion safeguards and service-ticket
states. This left **150,193 genuinely untranslated values across 70 locale
files**. The thirty-second 50-value Icelandic batch added team and organization
assignment, Node heap diagnostics, legal notices, checklist transformations and
attachment storage movement. This left **150,143 genuinely untranslated values
across 70 locale files**. The thirty-third 50-value Icelandic batch added bulk
attachment and avatar movement, storage-location repair, file statistics,
storage defaults and MongoDB compaction guidance. This left **150,093 genuinely
untranslated values across 70 locale files**. The thirty-fourth 50-value
Icelandic batch added board timing, upload restrictions, PDF fallback, workspace
dragging, custom translations, checklist display and support and accessibility
pages. This left **150,043 genuinely untranslated values across 70 locale
files**. The thirty-fifth 50-value Icelandic batch added accessibility content,
brute-force lockout administration, scheduled jobs, attachment paths and
scheduled board maintenance. This left **149,993 genuinely untranslated values
across 70 locale files**. The thirty-sixth 50-value Icelandic batch added
scheduled-job and migration recovery, filesystem, S3 and Azure storage,
MongoDB–FerretDB transfer and Sandstorm migration status. This left **149,943
genuinely untranslated values across 70 locale files**. The thirty-seventh
50-value Icelandic batch added Sandstorm cleanup, adaptive card loading,
secure-text rendering, import and export privacy controls, watch suppression and
scoped backups. This left **149,893 genuinely untranslated values across 70
locale files**. The thirty-eighth 50-value Icelandic batch added scheduled
backups, restore modes, Google Cloud credentials, cloud-console paths and
connection diagnostics. This left **149,843 genuinely untranslated values
across 70 locale files**. The thirty-ninth 50-value Icelandic batch added GCS
and GridFS storage, migration lifecycle controls, S3 configuration, scheduled
board maintenance and attachment monitoring. This left **149,793 genuinely
untranslated values across 70 locale files**. The fortieth 50-value Icelandic
batch added comprehensive board repair, lost-card restoration, archive recovery,
URL fixes, migration confirmations and progress steps. This left **149,743
genuinely untranslated values across 70 locale files**. The forty-first 50-value
Icelandic batch added repair-step progress, board conversion, CPU status,
recurring schedules and migration job monitoring. This left **149,693 genuinely
untranslated values across 70 locale files**. The forty-second 50-value
Icelandic batch added migration resource limits, background progress, monitoring
controls, attachment statistics and operation scheduling. This left **149,643
genuinely untranslated values across 70 locale files**. The forty-third 50-value
Icelandic batch added repository access, account validation, problem summaries,
card repair, CPU status and event fields. This left **149,593 genuinely
untranslated values across 70 locale files**. The final 17-value Icelandic batch
added network event details, filesystem integrity, scoped import and export
guidance and numeric search instructions. Icelandic is now complete, leaving
**149,576 genuinely untranslated values across 69 locale files**. The first
50-value Inuktitut batch added activity history for boards, cards, lists,
swimlanes, attachments, labels, checklists and comments. This left **149,526
genuinely untranslated values across 69 locale files**. The second 50-value
Inuktitut batch added card movement, compact activity summaries, checklist
history and workspace management. This left **149,476 genuinely untranslated
values across 69 locale files**. The third 50-value Inuktitut batch added
workspace selection, Home boards, list sizing, keyboard shortcuts, swimlane
heights and checklist controls. This left **149,426 genuinely untranslated
values across 69 locale files**. The fourth 50-value Inuktitut batch added
administration notices, archives, templates, background images, board-member
summaries and privacy labels. This left **149,376 genuinely untranslated values
across 69 locale files**. The fifth 50-value Inuktitut batch added public-board
guidance, display modes, calendars, archive safeguards and card editing. This
left **149,326 genuinely untranslated values across 69 locale files**. The sixth
50-value Inuktitut batch added card membership, voting, Planning Poker,
dependencies, organization links and import dialogs. This left **149,276
genuinely untranslated values across 69 locale files**. The seventh 50-value
Inuktitut batch added member dialogs, linked items, imported-user mapping,
themes, fonts and account preferences. This left **149,226 genuinely
untranslated values across 69 locale files**. The eighth 50-value Inuktitut
batch added general settings, starred pages and boards, automatic list sizing,
card aging, movement controls, dialog accessibility and color names. This left
**149,176 genuinely untranslated values across 69 locale files**. The ninth
50-value Inuktitut batch added comment and read-only roles, deletion prompts,
clipboard actions, template copying and custom-field types. This left **149,126
genuinely untranslated values across 69 locale files**. The tenth 50-value
Inuktitut batch added profile and date editing, WIP controls, account emails,
permanent deletion and board-import validation errors. This left **149,076
genuinely untranslated values across 69 locale files**. The eleventh 50-value
Inuktitut batch added account-conflict errors, card exports, attachment fields,
list sorting and due-date, label and member filters. This left **149,026
genuinely untranslated values across 69 locale files**. The twelfth 50-value
Inuktitut batch added advanced filtering, activity visibility, imported-member
states and board-import guidance for supported sources and Trello ZIP files.
This left **148,976 genuinely untranslated values across 69 locale files**. The
thirteenth 50-value Inuktitut batch added Trello API credentials and progress,
import cancellation and cleanup, member mapping, date validation and labels.
This left **148,926 genuinely untranslated values across 69 locale files**. The
fourteenth 50-value Inuktitut batch added board departure, list archival and
deletion, settings dialogs, selection tools, archive states and normal roles.
This left **148,876 genuinely untranslated values across 69 locale files**. The
fifteenth 50-value Inuktitut batch added notifications, private and public page
guidance, member removal, search, WIP, keyboard shortcuts and default boards.
This left **148,826 genuinely untranslated values across 69 locale files**. The
sixteenth 50-value Inuktitut batch added starred boards, time tracking, file
uploads, custom branding, URL schemes, welcome templates and WIP errors. This
left **148,776 genuinely untranslated values across 69 locale files**. The
seventeenth 50-value Inuktitut batch added attachment and API limits,
registration invitations, SMTP settings, webhooks and system-version labels.
This left **148,726 genuinely untranslated values across 69 locale files**. The
eighteenth 50-value Inuktitut batch added system diagnostics, time units,
custom-field display, visibility and organization and team administration.
This left **148,676 genuinely untranslated values across 69 locale files**. The
nineteenth 50-value Inuktitut batch added card dates and colors, board deletion,
subtask settings, minicard fields, parent paths and label activity. This left
**148,626 genuinely untranslated values across 69 locale files**. The twentieth
50-value Inuktitut batch added activity phrases and the automation-rule editor,
triggers, workflow builder and JSON, CSV and Trello Butler interchange. This
left **148,576 genuinely untranslated values across 69 locale files**. The
twenty-first 50-value Inuktitut batch added visual-workflow import, scheduled
and due-date triggers, rule buttons, sorting, completion and relative dates.
This left **148,526 genuinely untranslated values across 69 locale files**. The
twenty-second 50-value Inuktitut batch added automation movement, archive,
label, member, checklist and email actions and their generated descriptions.
This left **148,476 genuinely untranslated values across 69 locale files**. The
twenty-third 50-value Inuktitut batch added remaining rule actions, card
creation, date fields, authentication labels and custom web metadata. This left
**148,426 genuinely untranslated values across 69 locale files**. The
twenty-fourth 50-value Inuktitut batch added authentication display, board and
swimlane controls, due reminders, mention activity and resize preferences. This
left **148,376 genuinely untranslated values across 69 locale files**. The
twenty-fifth 50-value Inuktitut batch added multi-card windows, organization,
team and user dialogs, notifications, role permissions and weekday settings.
This left **148,326 genuinely untranslated values across 69 locale files**. The
twenty-sixth 50-value Inuktitut batch added linked-list safeguards, domains,
shared templates, My Cards and due-card views, global search and missing items.
This left **148,276 genuinely untranslated values across 69 locale files**. The
twenty-seventh 50-value Inuktitut batch added search-result counts and localized
global-search operators and predicates for board, people, dates and content.
This left **148,226 genuinely untranslated values across 69 locale files**. The
twenty-eighth 50-value Inuktitut batch added search errors, pagination and the
full operator, status, sorting and combination instructions. This left
**148,176 genuinely untranslated values across 69 locale files**. The
twenty-ninth 50-value Inuktitut batch added sorting, card completion, stickers,
dependency relations and import, board backgrounds and location fields. This
left **148,126 genuinely untranslated values across 69 locale files**. The
thirtieth 50-value Inuktitut batch added map detection, server troubleshooting,
string templates and administration reports for files, security and offices.
This left **148,076 genuinely untranslated values across 69 locale files**. The
thirty-first 50-value Inuktitut batch added API and recovery reports, wait
spinners, destructive safeguards and support ticket states and details. This
left **148,026 genuinely untranslated values across 69 locale files**. The
thirty-second 50-value Inuktitut batch added team and organization assignment,
Node memory diagnostics, legal notices, checklist and attachment actions. This
left **147,976 genuinely untranslated values across 69 locale files**. The
thirty-third 50-value Inuktitut batch added attachment storage migration and
repair, storage statistics and MongoDB compaction guidance and status. This
left **147,926 genuinely untranslated values across 69 locale files**. The
thirty-fourth 50-value Inuktitut batch added board status, upload restrictions,
custom translations, checklist display and support and accessibility pages.
This left **147,876 genuinely untranslated values across 69 locale files**. The
thirty-fifth 50-value Inuktitut batch added login lockout controls, people
filters, scheduled jobs, attachment paths and scheduled board operations. This
left **147,826 genuinely untranslated values across 69 locale files**. The
thirty-sixth 50-value Inuktitut batch added scheduled migration controls,
filesystem and cloud storage, database migration and Sandstorm migration status.
This left **147,776 genuinely untranslated values across 69 locale files**.
The thirty-seventh 50-value Inuktitut batch added Sandstorm cleanup, card-loading
modes, safe rich-text rendering, import/export privacy controls and backups. This
left **147,726 genuinely untranslated values across 69 locale files**.
The thirty-eighth 50-value Inuktitut batch added scheduled backups, restore
modes, and Azure, S3 and Google Cloud storage setup and connection controls. This
left **147,676 genuinely untranslated values across 69 locale files**.
The thirty-ninth 50-value Inuktitut batch added GridFS and S3 storage controls,
migration lifecycle actions, scheduled board operations and attachment settings.
This left **147,626 genuinely untranslated values across 69 locale files**.
The fortieth 50-value Inuktitut batch added board-integrity migrations, lost-card
recovery, URL repair, migration confirmations and progress steps. This left
**147,576 genuinely untranslated values across 69 locale files**.
The forty-first 50-value Inuktitut batch added migration repair steps, board
conversion, scheduler intervals, resource monitoring and job details. This left
**147,526 genuinely untranslated values across 69 locale files**.
The forty-second 50-value Inuktitut batch added migration tuning, logs and
warnings, monitoring navigation, attachment totals and storage distribution.
This left **147,476 genuinely untranslated values across 69 locale files**.
The forty-third 50-value Inuktitut batch added repository accounts, login
validation, problem summaries, broken-card repair and event metadata. This left
**147,426 genuinely untranslated values across 69 locale files**.
The final 17-value Inuktitut batch added event network details, scoped
import/export instructions and number-search syntax, completing Inuktitut. This
left **147,409 genuinely untranslated values across 68 locale files**.
The first 50-value Javanese batch added activity history for boards, cards,
lists, swimlanes, labels, checklists, comments and attachments. This left
**147,359 genuinely untranslated values across 68 locale files**.
The second 50-value Javanese batch added movement history, concise activity
phrases, checklist history and workspace navigation and editing. This left
**147,309 genuinely untranslated values across 68 locale files**.
The third 50-value Javanese batch added workspace deletion, multi-board actions,
Home boards, list sizing, keyboard shortcuts and checklist creation. This left
**147,259 genuinely untranslated values across 68 locale files**.
The fourth 50-value Javanese batch added administration announcements, archives,
templates, attachments, board backgrounds and All Boards membership summaries.
This left **147,209 genuinely untranslated values across 68 locale files**.
The fifth 50-value Javanese batch added board views and zoom, public-board
guidance, archive safeguards, calendar navigation and card editing labels. This
left **147,159 genuinely untranslated values across 68 locale files**.
The sixth 50-value Javanese batch added voting, Planning Poker, card
dependencies, board organizations and teams, account actions and import dialogs.
This left **147,109 genuinely untranslated values across 68 locale files**.
The seventh 50-value Javanese batch added member mapping, linked cards, themes,
font previews and sizing, text colors, avatars, language and permission dialogs.
This left **147,059 genuinely untranslated values across 68 locale files**.
The eighth 50-value Javanese batch added starring, automatic list widths, card
aging, keyboard movement and navigation, dialogs and the board color palette.
This left **147,009 genuinely untranslated values across 68 locale files**.
The ninth 50-value Javanese batch added board roles, deletion confirmations,
clipboard actions, bulk template JSON and custom-field types and options. This
left **146,959 genuinely untranslated values across 68 locale files**.
The tenth 50-value Javanese batch added profile and WIP controls, localized
account email templates, board-role errors and structured import validation.
This left **146,909 genuinely untranslated values across 68 locale files**.
The eleventh 50-value Javanese batch added account conflicts, card PDF and Excel
exports, attachment metadata, list sorting and date, label and member filters.
This left **146,859 genuinely untranslated values across 68 locale files**.
The twelfth 50-value Javanese batch added advanced filtering, member state and
impersonation, multi-source board imports and Trello ZIP validation and progress.
This left **146,809 genuinely untranslated values across 68 locale files**.
The thirteenth 50-value Javanese batch added Trello API imports, cancellation and
recovery, member mapping, input validation, keyboard shortcuts and label actions.
This left **146,759 genuinely untranslated values across 68 locale files**.
The fourteenth 50-value Javanese batch added board departure, list archiving,
user, team and organization settings, multi-selection, roles and notifications.
This left **146,709 genuinely untranslated values across 68 locale files**.
The fifteenth 50-value Javanese batch added watched updates, private and public
pages, member removal, card rescue, search, WIP limits and keyboard shortcuts.
This left **146,659 genuinely untranslated values across 68 locale files**.
The sixteenth 50-value Javanese batch added tracking, time accounting, uploads,
custom logos and URLs, welcome and template boards and WIP-limit guidance. This
left **146,609 genuinely untranslated values across 68 locale files**.
The seventeenth 50-value Javanese batch added attachment and API limits,
registration and SMTP, invitation emails, webhooks and runtime version labels.
This left **146,559 genuinely untranslated values across 68 locale files**.
The eighteenth 50-value Javanese batch added runtime diagnostics, custom-field
display, account visibility and organization and team tenancy administration.
This left **146,509 genuinely untranslated values across 68 locale files**.
The nineteenth 50-value Javanese batch added received and end dates, destructive
board actions, subtask routing, minicard badges and parent-card presentation.
This left **146,459 genuinely untranslated values across 68 locale files**.
The twentieth 50-value Javanese batch added activity details and rule workflow
building, triggers, selection, and JSON, CSV and Trello Butler import and export.
This left **146,409 genuinely untranslated values across 68 locale files**.
The twenty-first 50-value Javanese batch added visual workflow imports,
scheduled and button triggers, due-date conditions, sorting and card actions.
This left **146,359 genuinely untranslated values across 68 locale files**.
The twenty-second 50-value Javanese batch added rule conditions for movement,
labels, members and checklists, plus archive, color, email and move actions. This
left **146,309 genuinely untranslated values across 68 locale files**.
The twenty-third 50-value Javanese batch added rule actions for cards,
checklists, dates and links, authentication, custom web metadata and layout.
This left **146,259 genuinely untranslated values across 68 locale files**.
The twenty-fourth 50-value Javanese batch added custom HTML and authentication,
due-date activity and reminders, destructive account actions and layout controls.
This left **146,209 genuinely untranslated values across 68 locale files**.
The twenty-fifth 50-value Javanese batch added multi-card editing, notifications,
rename and board-role permissions, weekdays, status and linked-card safeguards.
This left **146,159 genuinely untranslated values across 68 locale files**.
The twenty-sixth 50-value Javanese batch added shared templates and domains, My
Cards and Due Cards views, global search scopes and missing-resource messages.
This left **146,109 genuinely untranslated values across 68 locale files**.
The twenty-seventh 50-value Javanese batch added global-search result counts,
missing-resource diagnostics and localized search operators and predicates. This
left **146,059 genuinely untranslated values across 68 locale files**.
The twenty-eighth 50-value Javanese batch added global-search validation,
navigation and full operator, status, sorting, limit and combination guidance.
This left **146,009 genuinely untranslated values across 68 locale files**.
The twenty-ninth 50-value Javanese batch added sorting, card completion, stickers,
dependency relations and import, board backgrounds and location fields. This
left **145,959 genuinely untranslated values across 68 locale files**.
The thirtieth 50-value Javanese batch added map detection, server troubleshooting,
string templates and administration reports for files, security and offices.
This left **145,909 genuinely untranslated values across 68 locale files**.
The thirty-first 50-value Javanese batch added API and recovery reports, wait
spinners, destructive safeguards and support ticket states and details. This
left **145,859 genuinely untranslated values across 68 locale files**.
The thirty-second 50-value Javanese batch added team and organization assignment,
Node memory diagnostics, legal notices, checklist and attachment actions. This
left **145,809 genuinely untranslated values across 68 locale files**.
The thirty-third 50-value Javanese batch added attachment storage migration and
repair, storage statistics and MongoDB compaction guidance and status. This
left **145,759 genuinely untranslated values across 68 locale files**.
The thirty-fourth 50-value Javanese batch added board status, upload restrictions,
custom translations, checklist display and support and accessibility pages.
This left **145,709 genuinely untranslated values across 68 locale files**.
The thirty-fifth 50-value Javanese batch added login lockout controls, people
filters, scheduled jobs, attachment paths and scheduled board operations. This
left **145,659 genuinely untranslated values across 68 locale files**.
The thirty-sixth 50-value Javanese batch added scheduled migration controls,
filesystem and cloud storage, database migration and Sandstorm migration status.
This left **145,609 genuinely untranslated values across 68 locale files**.
The thirty-seventh 50-value Javanese batch added storage cleanup, card-loading
performance, security rendering, privacy controls and backups. This left
**145,559 genuinely untranslated values across 68 locale files**.
The thirty-eighth 50-value Javanese batch added scheduled backup restoration,
cloud credentials, provider setup paths and connection status. This left
**145,509 genuinely untranslated values across 68 locale files**.
The thirty-ninth 50-value Javanese batch added attachment storage, migration
controls, S3 setup and scheduled board operations. This left **145,459 genuinely
untranslated values across 68 locale files**.
The fortieth 50-value Javanese batch added board-integrity repair, lost-card
restoration, file URL fixes and migration progress. This left **145,409 genuinely
untranslated values across 68 locale files**.
The forty-first 50-value Javanese batch added migration steps, board conversion,
runtime metrics, filesystem monitoring and job queues. This left **145,359
genuinely untranslated values across 68 locale files**.
The forty-second 50-value Javanese batch added attachment migration tuning,
monitoring navigation, operation scheduling and system resources. This left
**145,309 genuinely untranslated values across 68 locale files**.
The forty-third 50-value Javanese batch added repository accounts, login errors,
problem repair status and system events. This left **145,259 genuinely
untranslated values across 68 locale files**.
The final 17-value Javanese batch added event details, integrity reporting and
scoped import and export guidance. Javanese is now complete, leaving **145,242
genuinely untranslated values across 67 locale files**.
The first 50-value Kazakh batch added board, card and checklist activity,
membership restrictions, comments and archiving. This left **145,192 genuinely
untranslated values across 67 locale files**.
The second 50-value Kazakh batch added movement history, concise activity text,
checklist events and workspace navigation. This left **145,142 genuinely
untranslated values across 67 locale files**.
The third 50-value Kazakh batch added workspace deletion, multi-board actions,
Home-board controls, list sizing and checklist editing. This left **145,092
genuinely untranslated values across 67 locale files**.
The fourth 50-value Kazakh batch added administration announcements, archives,
attachments, board appearance and member summaries. This left **145,042
genuinely untranslated values across 67 locale files**.
The fifth 50-value Kazakh batch added board views and zoom, public-board
navigation, archive guidance and card editing. This left **144,992 genuinely
untranslated values across 67 locale files**.
The sixth 50-value Kazakh batch added voting, Planning Poker, dependencies,
organizations and board-content imports. This left **144,942 genuinely
untranslated values across 67 locale files**.
The seventh 50-value Kazakh batch added member mapping, linked cards, themes,
fonts, avatars and permissions. This left **144,892 genuinely untranslated
values across 67 locale files**.
The eighth 50-value Kazakh batch added starring, automatic list widths, card
aging, accessible navigation and colors. This left **144,842 genuinely
untranslated values across 67 locale files**.
The ninth 50-value Kazakh batch added board roles, deletion confirmations,
clipboard actions, card templates and custom fields. This left **144,792
genuinely untranslated values across 67 locale files**.
The tenth 50-value Kazakh batch added profile and WIP controls, localized email,
board permissions and import validation errors. This left **144,742 genuinely
untranslated values across 67 locale files**.
The eleventh 50-value Kazakh batch added account conflicts, card PDF and Excel
exports, list sorting and date and member filters. This left **144,692 genuinely
untranslated values across 67 locale files**.
The twelfth 50-value Kazakh batch added advanced filtering, member state and
board imports from issue trackers, spreadsheets and Trello archives. This left
**144,642 genuinely untranslated values across 67 locale files**.
The thirteenth 50-value Kazakh batch added Trello API imports, cancellation and
resume controls, member mapping and input validation. This left **144,592
genuinely untranslated values across 67 locale files**.
The fourteenth 50-value Kazakh batch added board departure, list archiving,
settings, multi-card selection, roles and participation notifications. This left
**144,542 genuinely untranslated values across 67 locale files**.
The fifteenth 50-value Kazakh batch added watched updates, private and public
pages, member removal, search, WIP limits and keyboard shortcuts. This left
**144,492 genuinely untranslated values across 67 locale files**.
The sixteenth 50-value Kazakh batch added tracking, time accounting, uploads,
custom branding, starter templates and WIP warnings. This left **144,442
genuinely untranslated values across 67 locale files**.
The seventeenth 50-value Kazakh batch added attachment and API limits,
registration email, SMTP setup, webhooks and runtime versions. This left
**144,392 genuinely untranslated values across 67 locale files**.
The eighteenth 50-value Kazakh batch added runtime diagnostics, custom-field
display, account controls, tenancy domains and organization roles. This left
**144,342 genuinely untranslated values across 67 locale files**.
The nineteenth 50-value Kazakh batch added received and end dates, destructive
board controls, subtasks, minicard display and parent-card settings. This left
**144,292 genuinely untranslated values across 67 locale files**.
The twentieth 50-value Kazakh batch added activity details and rule workflow
creation, triggers, imports and exports. This left **144,242 genuinely
untranslated values across 67 locale files**.
The twenty-first 50-value Kazakh batch added visual workflow imports,
scheduled rules, due-date triggers, buttons and relative-date actions. This left
**144,192 genuinely untranslated values across 67 locale files**.
The twenty-second 50-value Kazakh batch added rule conditions for movement,
labels, members, checklists and email actions. This left **144,142 genuinely
untranslated values across 67 locale files**.
The twenty-third 50-value Kazakh batch added rule actions for cards,
checklists, dates and links plus authentication, manifests and layout. This left
**144,092 genuinely untranslated values across 67 locale files**.
The twenty-fourth 50-value Kazakh batch added custom HTML and authentication,
due-date reminders, destructive account controls and resizable UI. This left
**144,042 genuinely untranslated values across 67 locale files**.
The twenty-fifth 50-value Kazakh batch added multi-card editing, notifications,
board-role permissions, weekdays, ownership and voting. This left **143,992
genuinely untranslated values across 67 locale files**.
The twenty-sixth 50-value Kazakh batch added shared templates and domains, My
Cards, due-card views, global search and missing-item errors. This left
**143,942 genuinely untranslated values across 67 locale files**.
The twenty-seventh 50-value Kazakh batch added global-search result counts,
operators and date, status and content predicates. This left **143,892 genuinely
untranslated values across 67 locale files**.
The twenty-eighth 50-value Kazakh batch added global-search validation,
pagination, operator help, status scopes, sorting and search links. This left
**143,842 genuinely untranslated values across 67 locale files**.
The twenty-ninth 50-value Kazakh batch added sorting, card completion, stickers,
dependencies, board backgrounds and locations. This left **143,792 genuinely
untranslated values across 67 locale files**.
The thirtieth 50-value Kazakh batch added map detection, server troubleshooting,
custom string templates, diagnostics and office reports. This left **143,742
genuinely untranslated values across 67 locale files**.
The thirty-first 50-value Kazakh batch added API and recovery reports, wait
indicators, organization safety, tickets and help requests. This left **143,692
genuinely untranslated values across 67 locale files**.
The thirty-second 50-value Kazakh batch added team and organization assignment,
Node memory metrics, checklist actions and attachment storage moves. This left
**143,642 genuinely untranslated values across 67 locale files**.
The thirty-third 50-value Kazakh batch added attachment storage migration and
repair, storage statistics and MongoDB compaction guidance. This left **143,592
genuinely untranslated values across 67 locale files**.
The thirty-fourth 50-value Kazakh batch added board status, upload restrictions,
custom translations, checklist display and support and accessibility pages.
This left **143,542 genuinely untranslated values across 67 locale files**.
The thirty-fifth 50-value Kazakh batch added login lockout controls, people
filters, scheduled jobs, attachment paths and scheduled board operations. This
left **143,492 genuinely untranslated values across 67 locale files**.
The thirty-sixth 50-value Kazakh batch added scheduled migration controls,
filesystem and cloud storage, database migration and Sandstorm migration status.
This left **143,442 genuinely untranslated values across 67 locale files**.
The thirty-seventh 50-value Kazakh batch added storage cleanup, card-loading
performance, security rendering, privacy controls and backups. This left
**143,392 genuinely untranslated values across 67 locale files**.
The thirty-eighth 50-value Kazakh batch added scheduled backup restoration,
cloud credentials, provider setup paths and connection status. This left
**143,342 genuinely untranslated values across 67 locale files**.
The thirty-ninth 50-value Kazakh batch added attachment storage, migration
controls, S3 setup and scheduled board operations. This left **143,292 genuinely
untranslated values across 67 locale files**.
The fortieth 50-value Kazakh batch added board-integrity repair, lost-card
restoration, file URL fixes and migration progress. This left **143,242 genuinely
untranslated values across 67 locale files**.
The forty-first 50-value Kazakh batch added migration steps, board conversion,
runtime metrics, filesystem monitoring and job queues. This left **143,192
genuinely untranslated values across 67 locale files**.
The forty-second 50-value Kazakh batch added attachment migration tuning,
monitoring navigation, operation scheduling and system resources. This left
**143,142 genuinely untranslated values across 67 locale files**.
The forty-third 50-value Kazakh batch added repository accounts, login errors,
problem repair status and system events. This left **143,092 genuinely
untranslated values across 67 locale files**.
The final 17-value Kazakh batch added event details, integrity and scoped import
and export guidance. Kazakh is now complete, leaving **143,075 genuinely
untranslated values across 66 locale files**.
The first 50-value Greenlandic batch added board, card, checklist and comment
activity. This left **143,025 genuinely untranslated values across 66 locale
files**.
The second 50-value Greenlandic batch added movement history, concise activity
text and workspace navigation. This left **142,975 genuinely untranslated
values across 66 locale files**.
The third 50-value Greenlandic batch added workspace deletion, multi-board
actions, personal layout sizing and checklist controls. This left **142,925
genuinely untranslated values across 66 locale files**.
The fourth 50-value Greenlandic batch added administration announcements,
archives, board backgrounds, member display and private-board status. This left
**142,875 genuinely untranslated values across 66 locale files**.
The fifth 50-value Greenlandic batch added board views and zoom, public-board
navigation, archive guidance and card editing. This left **142,825 genuinely
untranslated values across 66 locale files**.
The sixth 50-value Greenlandic batch added voting, Planning Poker,
dependencies, organizations and import dialogs. This left **142,775 genuinely
untranslated values across 66 locale files**.
The seventh 50-value Greenlandic batch added member mapping, linked cards,
themes, fonts and permission dialogs. This left **142,725 genuinely
untranslated values across 66 locale files**.
The eighth 50-value Greenlandic batch added starring, automatic list widths,
card aging, navigation and colors. This left **142,675 genuinely untranslated
values across 66 locale files**.
The ninth 50-value Greenlandic batch added board roles, deletion confirmations,
copy actions and custom fields. This left **142,625 genuinely untranslated
values across 66 locale files**.
The tenth 50-value Greenlandic batch added profile and WIP controls, localized
email, permanent deletion and import errors. This left **142,575 genuinely
untranslated values across 66 locale files**.
The eleventh 50-value Greenlandic batch added account conflicts, card PDF and
Excel exports, sorting and date, label and member filters. This left **142,525
genuinely untranslated values across 66 locale files**.
The twelfth 50-value Greenlandic batch added advanced filtering, member state
and board imports from common project-management formats. This left **142,475
genuinely untranslated values across 66 locale files**.
The thirteenth 50-value Greenlandic batch added Trello API imports,
cancellation, member mapping, validation and keyboard navigation. This left
**142,425 genuinely untranslated values across 66 locale files**.
The fourteenth 50-value Greenlandic batch added board departure, list
archiving, settings, selection and notification roles. This left **142,375
genuinely untranslated values across 66 locale files**.
The fifteenth 50-value Greenlandic batch added watched updates, private and
public access, member removal, search and keyboard shortcuts. This left
**142,325 genuinely untranslated values across 66 locale files**.
The sixteenth 50-value Greenlandic batch added tracking, time accounting,
uploads, branding, welcome content and WIP validation. This left **142,275
genuinely untranslated values across 66 locale files**.
The seventeenth 50-value Greenlandic batch added attachment and API limits,
registration, SMTP invitations, webhooks and runtime versions. This left
**142,225 genuinely untranslated values across 66 locale files**.
The eighteenth 50-value Greenlandic batch added runtime diagnostics,
custom-field display, account controls and organization tenancy. This left
**142,175 genuinely untranslated values across 66 locale files**.
The nineteenth 50-value Greenlandic batch added received and end dates,
destructive confirmations, subtasks, card display and parent links. This left
**142,125 genuinely untranslated values across 66 locale files**.
The twentieth 50-value Greenlandic batch added activity details and rule
workflow triggers, actions, imports and exports. This left **142,075 genuinely
untranslated values across 66 locale files**.
The twenty-first 50-value Greenlandic batch added visual workflow imports,
scheduled and button triggers, due dates and list actions. This left **142,025
genuinely untranslated values across 66 locale files**.
The twenty-second 50-value Greenlandic batch added rule conditions for
movement, labels, members, checklists and email actions. This left **141,975
genuinely untranslated values across 66 locale files**.
The twenty-third 50-value Greenlandic batch added rule actions for cards,
members, checklists and dates plus authentication and web branding. This left
**141,925 genuinely untranslated values across 66 locale files**.
The twenty-fourth 50-value Greenlandic batch added custom HTML,
authentication, duplication, reminders, deletion and layout controls. This
left **141,875 genuinely untranslated values across 66 locale files**.
The twenty-fifth 50-value Greenlandic batch added multi-card editing,
notifications, board roles, weekdays and ownership. This left **141,825
genuinely untranslated values across 66 locale files**.
The twenty-sixth 50-value Greenlandic batch added shared templates and domains,
My Cards and due-card views, global search and missing-item errors. This left
**141,775 genuinely untranslated values across 66 locale files**.
The twenty-seventh 50-value Greenlandic batch added global-search result
counts, operators and date, state and content predicates. This left **141,725
genuinely untranslated values across 66 locale files**.
The twenty-eighth 50-value Greenlandic batch added global-search validation,
operator guidance, status filters, sorting and search notes. This left
**141,675 genuinely untranslated values across 66 locale files**.
The twenty-ninth 50-value Greenlandic batch added sorting, card completion,
stickers, dependencies, board backgrounds and locations. This left **141,625
genuinely untranslated values across 66 locale files**.
The thirtieth 50-value Greenlandic batch added map detection, server
troubleshooting, sorting, custom fields, reports and office activity. This left
**141,575 genuinely untranslated values across 66 locale files**.
The thirty-first 50-value Greenlandic batch added API and recovery reports,
wait indicators, support tickets and card details. This left **141,525
genuinely untranslated values across 66 locale files**.
The thirty-second 50-value Greenlandic batch added team and organization
assignment, runtime memory, legal notices, checklists and attachment storage.
This left **141,475 genuinely untranslated values across 66 locale files**.
The thirty-third 50-value Greenlandic batch added attachment storage migration,
location repair, progress metrics and MongoDB compaction. This left **141,425
genuinely untranslated values across 66 locale files**.
The thirty-fourth 50-value Greenlandic batch added board status, upload
restrictions, custom translations, checklist display, support and
accessibility. This left **141,375 genuinely untranslated values across 66
locale files**.
The thirty-fifth 50-value Greenlandic batch added login lockout controls,
people filtering, scheduled jobs and attachment paths. This left **141,325
genuinely untranslated values across 66 locale files**.
The thirty-sixth 50-value Greenlandic batch added scheduled migration controls,
filesystem and cloud storage, database migration and Sandstorm status. This
left **141,275 genuinely untranslated values across 66 locale files**.
The thirty-seventh 50-value Greenlandic batch added storage cleanup,
card-loading performance, security controls and backups. This left **141,225
genuinely untranslated values across 66 locale files**.
The thirty-eighth 50-value Greenlandic batch added scheduled backup restoration,
Google, S3 and Azure cloud configuration and connection tests. This left
**141,175 genuinely untranslated values across 66 locale files**.
The thirty-ninth 50-value Greenlandic batch added attachment storage,
migration controls, S3 setup and scheduled board operations. This left
**141,125 genuinely untranslated values across 66 locale files**.
The fortieth 50-value Greenlandic batch added board-integrity repair,
lost-card restoration, file URL fixes and migration progress. This left
**141,075 genuinely untranslated values across 66 locale files**.
The forty-first 50-value Greenlandic batch added migration steps, board
conversion, runtime metrics, filesystem monitoring and job queues. This left
**141,025 genuinely untranslated values across 66 locale files**.
The forty-second 50-value Greenlandic batch added migration tuning,
monitoring navigation, operation scheduling and system resources. This left
**140,975 genuinely untranslated values across 66 locale files**.
The forty-third 50-value Greenlandic batch added repository accounts, login
errors, problem repair status and system events. This left **140,925 genuinely
untranslated values across 66 locale files**.
The final 17-value Greenlandic batch added event details, integrity and scoped
import and export guidance. Greenlandic is now complete, leaving **140,908
genuinely untranslated values across 65 locale files**.
The first 50-value Kannada batch added board, card, checklist and comment
activity. This left **140,858 genuinely untranslated values across 65 locale
files**.
The second 50-value Kannada batch added movement, checklist activity and
workspace navigation. This left **140,808 genuinely untranslated values across
65 locale files**.
The third 25-value Kannada batch added board selection, Home board and list
layout controls. This left **140,783 genuinely untranslated values across 65
locale files**.
The fourth 50-value Kannada batch added list and swimlane sizing, member roles
and archive controls. This left **140,733 genuinely untranslated values across
65 locale files**.
The fifth 25-value Kannada batch added templates, attachments, backgrounds and
board-member display settings. This left **140,708 genuinely untranslated
values across 65 locale files**.
The sixth 50-value Kannada batch added board views, zoom, calendar and archive
guidance. This left **140,658 genuinely untranslated values across 65 locale
files**.
The seventh 25-value Kannada batch added card membership, voting and Planning
Poker controls. This left **140,633 genuinely untranslated values across 65
locale files**.
The eighth 50-value Kannada batch added popup titles, imports, dependencies and
imported-member mapping. This left **140,583 genuinely untranslated values
across 65 locale files**.
The ninth 25-value Kannada batch added theme, font, text color and profile
settings. This left **140,558 genuinely untranslated values across 65 locale
files**.
The tenth 50-value Kannada batch added navigation, card aging, list movement
and color names. This left **140,508 genuinely untranslated values across 65
locale files**.
The eleventh 25-value Kannada batch added board roles and deletion
confirmations. This left **140,483 genuinely untranslated values across 65
locale files**.
The twelfth 50-value Kannada batch added clipboard actions, custom fields,
profiles and enrollment email. This left **140,433 genuinely untranslated
values across 65 locale files**.
The thirteenth 25-value Kannada batch added account email and import and
permission errors. This left **140,408 genuinely untranslated values across 65
locale files**.
The fourteenth 50-value Kannada batch added account errors, card exports,
sorting and filters. This left **140,358 genuinely untranslated values across
65 locale files**.
The fifteenth 10-value Kannada batch added assignee, custom-field and archive
filters. This left **140,348 genuinely untranslated values across 65 locale
files**.
The sixteenth 25-value Kannada batch added advanced-filter guidance and board
import instructions. This left **140,323 genuinely untranslated values across
65 locale files**.
The seventeenth 25-value Kannada batch added Trello JSON, ZIP, workspace and API
import guidance. This left **140,298 genuinely untranslated values across 65
locale files**.
The eighteenth 50-value Kannada batch added Trello job controls, member mapping
and list actions. This left **140,248 genuinely untranslated values across 65
locale files**.
The nineteenth 25-value Kannada batch added settings dialogs, list recovery and
multi-selection controls. This left **140,223 genuinely untranslated values
across 65 locale files**.
The twentieth 50-value Kannada batch added notifications, board visibility,
member removal and keyboard actions. This left **140,173 genuinely untranslated
values across 65 locale files**.
The twenty-first 25-value Kannada batch added keyboard navigation, starred
boards and time tracking. This left **140,148 genuinely untranslated values
across 65 locale files**.
The twenty-second 50-value Kannada batch added tracking, branding, templates,
WIP errors and attachment limits. This left **140,098 genuinely untranslated
values across 65 locale files**.
The twenty-third 25-value Kannada batch added API limits, registration, SMTP
and invitation email. This left **140,073 genuinely untranslated values across
65 locale files**.
The twenty-fourth 50-value Kannada batch added webhooks, system information,
custom-field display and account settings. This left **140,023 genuinely
untranslated values across 65 locale files**.
The twenty-fifth 25-value Kannada batch added organization and team settings,
card dates and color controls. This left **139,998 genuinely untranslated
values across 65 locale files**.
The twenty-sixth 50-value Kannada batch added deletion, subtask, minicard,
parent-card and activity settings. This left **139,948 genuinely untranslated
values across 65 locale files**.
The twenty-seventh 25-value Kannada batch added automation workflow controls
and card, label and member triggers. This left **139,923 genuinely untranslated
values across 65 locale files**.
The twenty-eighth 50-value Kannada batch added rule imports, schedules, due-date
triggers and automation buttons. This left **139,873 genuinely untranslated
values across 65 locale files**.
The twenty-ninth 25-value Kannada batch added relative dates, automation units
and card movement conditions. This left **139,848 genuinely untranslated values
across 65 locale files**.
The thirtieth 50-value Kannada batch added automation member, checklist, card
movement, label and email actions. This left **139,798 genuinely untranslated
values across 65 locale files**.
The thirty-first 25-value Kannada batch added checklist, swimlane and date-field
automation actions. This left **139,773 genuinely untranslated values across 65
locale files**.
The thirty-second 50-value Kannada batch added authentication, custom branding,
archive placement and due-time activity. This left **139,723 genuinely
untranslated values across 65 locale files**.
The thirty-third 25-value Kannada batch added due reminders, account deletion,
editor and multi-card settings. This left **139,698 genuinely untranslated
values across 65 locale files**.
The thirty-fourth 50-value Kannada batch added users, notifications, board
roles, weekdays and template sharing. This left **139,648 genuinely
untranslated values across 65 locale files**.
The thirty-fifth 25-value Kannada batch added domains, shared templates and My
Cards views and sorting. This left **139,623 genuinely untranslated values
across 65 locale files**.
The thirty-sixth 50-value Kannada batch added Due Cards, global search, result
messages and search operators. This left **139,573 genuinely untranslated
values across 65 locale files**.
The thirty-seventh 25-value Kannada batch added search predicates and operator
validation errors. This left **139,548 genuinely untranslated values across 65
locale files**.
The thirty-eighth 6-value Kannada batch added pagination and global-search help
headings. This left **139,542 genuinely untranslated values across 65 locale
files**.
The thirty-ninth 10-value Kannada batch added global-search syntax and board,
list, swimlane, comment, label and user operators. This left **139,532 genuinely
untranslated values across 65 locale files**.
The fortieth 14-value Kannada batch added member, organization, date and status
search guidance. This left **139,518 genuinely untranslated values across 65
locale files**.
The forty-first 6-value Kannada batch added field-existence, sorting, limits and
operator-combination guidance. This left **139,512 genuinely untranslated values
across 65 locale files**.
The forty-second 30-value Kannada batch finished search notes and added sorting,
stickers and card dependencies. This left **139,482 genuinely untranslated
values across 65 locale files**.
The forty-third 25-value Kannada batch added dependency imports, board
backgrounds and card locations. This left **139,457 genuinely untranslated
values across 65 locale files**.
The forty-fourth 50-value Kannada batch added map detection, server diagnostics,
string templates and admin reports. This left **139,407 genuinely untranslated
values across 65 locale files**.
The forty-fifth 25-value Kannada batch added office, API and recovery reports,
swimlane copying and wait spinners. This left **139,382 genuinely untranslated
values across 65 locale files**.
The forty-sixth 50-value Kannada batch added tickets, invitations, teams and
Node memory diagnostics. This left **139,332 genuinely untranslated values
across 65 locale files**.
The forty-seventh 25-value Kannada batch added organizations, legal notices,
checklist actions and attachment storage. This left **139,307 genuinely
untranslated values across 65 locale files**.
The forty-eighth 50-value Kannada batch added attachment migration and repair,
storage statistics and MongoDB compaction. This left **139,257 genuinely
untranslated values across 65 locale files**.
The forty-ninth 25-value Kannada batch added board status, upload limits,
workspace dragging and custom translations. This left **139,232 genuinely
untranslated values across 65 locale files**.
The fiftieth 50-value Kannada batch added translation editing, support,
accessibility and login lockout settings. This left **139,182 genuinely
untranslated values across 65 locale files**.
The fifty-first 25-value Kannada batch added active-user filters, storage paths
and scheduled board operations. This left **139,157 genuinely untranslated
values across 65 locale files**.
The fifty-second 50-value Kannada batch added scheduled migrations, storage
backends and database migration guidance. This left **139,107 genuinely
untranslated values across 65 locale files**.
The fifty-third 25-value Kannada batch added Sandstorm cleanup, card loading and
secure text rendering and import/export controls. This left **139,082 genuinely
untranslated values across 65 locale files**.
The fifty-fourth 15-value Kannada batch added avatar controls, user
anonymization and activity, notification and watch controls. This left
**139,067 genuinely untranslated values across 65 locale files**.
The fifty-fifth 25-value Kannada batch added backup scope, scheduling, storage
and restore modes. This left **139,042 genuinely untranslated values across 65
locale files**.
The fifty-sixth 50-value Kannada batch added backup restoration, S3, Azure and
GCS setup and migration controls. This left **138,992 genuinely untranslated
values across 65 locale files**.
The fifty-seventh 25-value Kannada batch added migration lifecycle, S3 and
scheduled board-operation controls. This left **138,967 genuinely untranslated
values across 65 locale files**.
The fifty-eighth 50-value Kannada batch added board integrity, lost-item
recovery, URL repair and migration progress. This left **138,917 genuinely
untranslated values across 65 locale files**.
The fifty-ninth 50-value Kannada batch added migration steps, board conversion,
CPU status and filesystem monitoring. This left **138,867 genuinely
untranslated values across 65 locale files**.
The sixtieth 50-value Kannada batch added migration tuning, monitoring,
scheduling and minicard display. This left **138,817 genuinely untranslated
values across 65 locale files**.
The sixty-first 50-value Kannada batch added system status, repositories,
accounts and problem repair. This left **138,767 genuinely untranslated values
across 65 locale files**.
The final 26-value Kannada batch added repair results, event details, integrity
and scoped import and export guidance. Kannada is now complete, leaving
**138,741 genuinely untranslated values across 64 locale files**.
The first 50-value Konkani batch added board, card, checklist and comment
activity. This left **138,691 genuinely untranslated values across 64 locale
files**.
The second 50-value Konkani batch added movement, checklist activity and
workspace navigation. This left **138,641 genuinely untranslated values across
64 locale files**.
The third 50-value Konkani batch added board selection, Home board and list and
swimlane layout controls. This left **138,591 genuinely untranslated values
across 64 locale files**.
The fourth 25-value Konkani batch added administration, public boards and
archive controls. This left **138,566 genuinely untranslated values across 64
locale files**.
The fifth 50-value Konkani batch added templates, attachments, backgrounds,
board-member display settings and board views. This left **138,516 genuinely
untranslated values across 64 locale files**.
The sixth 25-value Konkani batch added calendar navigation, archive guidance
and card editing. This left **138,491 genuinely untranslated values across 64
locale files**.
The seventh 50-value Konkani batch added card membership, voting, Planning
Poker, dependencies and import dialogs. This left **138,441 genuinely
untranslated values across 64 locale files**.
The eighth 25-value Konkani batch added popup titles, archived-item recovery,
rule transfers and imported-member mapping. This left **138,416 genuinely
untranslated values across 64 locale files**.
The ninth 50-value Konkani batch added themes, fonts, text colors, card aging,
movement and accessibility navigation. This left **138,366 genuinely
untranslated values across 64 locale files**.
The tenth 25-value Konkani batch added board recovery, card closing and color
names. This left **138,341 genuinely untranslated values across 64 locale
files**.
The eleventh 50-value Konkani batch added board roles, deletion confirmations,
clipboard actions, templates and custom fields. This left **138,291 genuinely
untranslated values across 64 locale files**.
The twelfth 25-value Konkani batch added permanent deletion, profile and WIP
controls, date dialogs and enrollment email. This left **138,266 genuinely
untranslated values across 64 locale files**.
The thirteenth 50-value Konkani batch added account email, permission and
import errors, and card exports. This left **138,216 genuinely untranslated
values across 64 locale files**.
The fourteenth 25-value Konkani batch added card-export permissions, list
sorting and date, label and member filters. This left **138,191 genuinely
untranslated values across 64 locale files**.
The fifteenth 50-value Konkani batch added advanced filters, activity controls
and board import guidance and errors. This left **138,141 genuinely
untranslated values across 64 locale files**.
The sixteenth 25-value Konkani batch added Trello ZIP safety, API credentials,
workspace selection and import cancellation. This left **138,116 genuinely
untranslated values across 64 locale files**.
The seventeenth 50-value Konkani batch added Trello job controls, member
mapping, list actions, settings dialogs and navigation. This left **138,066
genuinely untranslated values across 64 locale files**.
The eighteenth 25-value Konkani batch added multi-selection, archive states,
board roles and participation notifications. This left **138,041 genuinely
untranslated values across 64 locale files**.
The nineteenth 50-value Konkani batch added notifications, board visibility,
member removal, search, WIP limits and keyboard actions. This left **137,991
genuinely untranslated values across 64 locale files**.
The twentieth 25-value Konkani batch added starred boards, time tracking,
assignee shortcuts and uploads. This left **137,966 genuinely untranslated
values across 64 locale files**.
The twenty-first 50-value Konkani batch added branding, welcome templates, WIP
errors, attachment and API limits, registration and SMTP settings. This left
**137,916 genuinely untranslated values across 64 locale files**.
The twenty-second 25-value Konkani batch added SMTP tests, invitation email,
webhooks and system version labels. This left **137,891 genuinely untranslated
values across 64 locale files**.
The twenty-third 50-value Konkani batch added database and system status,
custom-field display, account visibility, organizations and teams. This left
**137,841 genuinely untranslated values across 64 locale files**.
The twenty-fourth 25-value Konkani batch added card dates and colors, deletion
confirmations and default subtask boards. This left **137,816 genuinely
untranslated values across 64 locale files**.
The twenty-fifth 50-value Konkani batch added subtask and minicard settings,
parent cards, activity details and automation rule controls. This left
**137,766 genuinely untranslated values across 64 locale files**.
The twenty-sixth 25-value Konkani batch added automation workflow triggers,
schedules and rule imports and exports. This left **137,741 genuinely
untranslated values across 64 locale files**.
The twenty-seventh 50-value Konkani batch added visual-workflow imports,
schedules, due-date triggers, automation buttons and relative dates. This left
**137,691 genuinely untranslated values across 64 locale files**.
The twenty-eighth 25-value Konkani batch added automation movement, label,
member, attachment and checklist conditions. This left **137,666 genuinely
untranslated values across 64 locale files**.
The twenty-ninth 50-value Konkani batch added automation card movement, member,
label, checklist, swimlane and email actions. This left **137,616 genuinely
untranslated values across 64 locale files**.
The thirtieth 25-value Konkani batch added automation date fields, card links,
authentication, custom metadata and layout settings. This left **137,591
genuinely untranslated values across 64 locale files**.
The thirty-first 50-value Konkani batch added board display, authentication,
activity reminders, account deletion and desktop interaction settings. This
left **137,541 genuinely untranslated values across 64 locale files**.
The thirty-second 25-value Konkani batch added multi-window cards, inline
editing, organization and user dialogs, notifications and role permissions.
This left **137,516 genuinely untranslated values across 64 locale files**.
The thirty-third 50-value Konkani batch added role status, weekdays, linked-card
deletion, domains and shared templates. This left **137,466 genuinely
untranslated values across 64 locale files**.
The thirty-fourth 25-value Konkani batch added My Cards and Due Cards views,
global search scopes and missing-item errors. This left **137,441 genuinely
untranslated values across 64 locale files**.
The thirty-fifth 50-value Konkani batch added global-search results, operators
and predicates. This left **137,391 genuinely untranslated values across 64
locale files**.
The thirty-sixth 25-value Konkani batch added operator validation, paging and
global-search guidance for boards, lists, labels and users. This left **137,366
genuinely untranslated values across 64 locale files**.
The thirty-seventh 50-value Konkani batch added global-search guidance for
people, dates, status, fields and sorting, plus card dependencies. This left
**137,316 genuinely untranslated values across 64 locale files**.
The thirty-eighth 25-value Konkani batch added dependency imports, board
backgrounds and card locations. This left **137,291 genuinely untranslated
values across 64 locale files**.
The thirty-ninth 50-value Konkani batch added map coordinates, server
troubleshooting, string templates, reports and office locations. This left
**137,241 genuinely untranslated values across 64 locale files**.
The fortieth 25-value Konkani batch added office and API metrics, recovery
maintenance, swimlane copying and wait indicators. This left **137,216
genuinely untranslated values across 64 locale files**.
The forty-first 50-value Konkani batch added wait indicators, tickets, team
invitations and Node memory metrics. This left **137,166 genuinely untranslated
values across 64 locale files**.
The forty-second 25-value Konkani batch added organizations, legal notices,
checklist actions and attachment storage moves. This left **137,141 genuinely
untranslated values across 64 locale files**.
The forty-third 50-value Konkani batch added bulk storage moves, attachment
repair, file metrics and MongoDB compaction. This left **137,091 genuinely
untranslated values across 64 locale files**.
The forty-fourth 25-value Konkani batch added board status, upload progress,
file limits, workspace dragging and custom translations. This left **137,066
genuinely untranslated values across 64 locale files**.
The forty-fifth 50-value Konkani batch added custom translations, checklist
display, support, accessibility and account-lockout controls. This left
**137,016 genuinely untranslated values across 64 locale files**.
The forty-sixth 25-value Konkani batch added account status, attachment paths
and scheduled board operations and migrations. This left **136,991 genuinely
untranslated values across 64 locale files**.
The forty-seventh 50-value Konkani batch added scheduled-job recovery, storage
backends and database and Sandstorm migration controls. This left **136,941
genuinely untranslated values across 64 locale files**.
The forty-eighth 25-value Konkani batch added Sandstorm cleanup, card-loading
performance and security controls for links, code and imports. This left
**136,916 genuinely untranslated values across 64 locale files**.
The forty-ninth 50-value Konkani batch added export security, anonymization,
notifications, backups and Google Cloud storage settings. This left **136,866
genuinely untranslated values across 64 locale files**.
The fiftieth 25-value Konkani batch added S3, Azure and Google Cloud setup paths,
connection tests and cloud storage moves. This left **136,841 genuinely
untranslated values across 64 locale files**.
The fifty-first 50-value Konkani batch added GridFS and S3 settings, migration
controls, scheduled operations and attachment monitoring. This left **136,791
genuinely untranslated values across 64 locale files**.
The fifty-second 25-value Konkani batch added board-integrity migrations, lost
card recovery and file and avatar URL repair. This left **136,766 genuinely
untranslated values across 64 locale files**.
The fifty-third 50-value Konkani batch added migration confirmations, progress,
repair steps, board conversion and CPU status. This left **136,716 genuinely
untranslated values across 64 locale files**.
The fifty-fourth 50-value Konkani batch added migration scheduling, monitoring,
tuning, storage metrics and progress. This left **136,666 genuinely
untranslated values across 64 locale files**.
The fifty-fifth 50-value Konkani batch added migration status, repositories,
account creation and login errors. This left **136,616 genuinely untranslated
values across 64 locale files**.
The final 42-value Konkani batch added problem repair, event details, integrity
and scoped import and export guidance. Konkani is now complete, leaving
**136,574 genuinely untranslated values across 63 locale files**.
The first 50-value Kashmiri batch added board, card, checklist and comment
activity. This left **136,524 genuinely untranslated values across 63 locale
files**.
The second 50-value Kashmiri batch added card moves, activity history,
checklists and workspace navigation. This left **136,474 genuinely untranslated
values across 63 locale files**.
The third 50-value Kashmiri batch added board selection, home-board controls,
list sizing, swimlane sizing and checklist creation. This left **136,424
genuinely untranslated values across 63 locale files**.
The fourth 50-value Kashmiri batch added administration, announcements,
archives, board appearance, member views and privacy guidance. This left
**136,374 genuinely untranslated values across 63 locale files**.
The fifth 50-value Kashmiri batch added board views, display modes, calendars,
archive guidance and card editing. This left **136,324 genuinely untranslated
values across 63 locale files**.
The sixth 50-value Kashmiri batch added card membership, voting, planning poker,
dependencies, organization and team controls and imports. This left **136,274
genuinely untranslated values across 63 locale files**.
The seventh 50-value Kashmiri batch added member mapping, linked items, themes,
fonts, avatars and permission controls. This left **136,224 genuinely
untranslated values across 63 locale files**.
The eighth 50-value Kashmiri batch added starring, automatic list widths, card
aging, keyboard movement, dialogs and board colors. This left **136,174
genuinely untranslated values across 63 locale files**.
The ninth 50-value Kashmiri batch added board roles, deletion confirmations,
clipboard actions, template copying and custom fields. This left **136,124
genuinely untranslated values across 63 locale files**.
The tenth 50-value Kashmiri batch added permanent deletion, profiles, dates,
account emails, import validation and access errors. This left **136,074
genuinely untranslated values across 63 locale files**.
The eleventh 50-value Kashmiri batch added user validation, card exports, disk
space messages, list sorting and date, label and member filters. This left
**136,024 genuinely untranslated values across 63 locale files**.
The twelfth 50-value Kashmiri batch added advanced filters, activity display,
imported members and board imports from twelve external formats. This left
**135,974 genuinely untranslated values across 63 locale files**.
The thirteenth 50-value Kashmiri batch added Trello API and ZIP imports,
workspace placement, member mapping, date validation and labels. This left
**135,924 genuinely untranslated values across 63 locale files**.
The fourteenth 50-value Kashmiri batch added board membership, list archives,
swimlane actions, bulk selection, role descriptions and notifications. This
left **135,874 genuinely untranslated values across 63 locale files**.
The fifteenth 50-value Kashmiri batch added watch notifications, public and
private access, member removal, search, WIP limits and keyboard shortcuts. This
left **135,824 genuinely untranslated values across 63 locale files**.
The sixteenth 50-value Kashmiri batch added starred boards, time tracking,
uploads, custom branding, welcome templates and WIP validation. This left
**135,774 genuinely untranslated values across 63 locale files**.
The seventeenth 50-value Kashmiri batch added attachment and API limits,
registration, SMTP invitations, webhooks and runtime version labels. This left
**135,724 genuinely untranslated values across 63 locale files**.
The eighteenth 50-value Kashmiri batch added database and operating-system
diagnostics, custom-field display and organization and team tenancy. This left
**135,674 genuinely untranslated values across 63 locale files**.
The nineteenth 50-value Kashmiri batch added card dates, destructive cleanup,
subtask routing, minicard presentation and parent-card paths. This left
**135,624 genuinely untranslated values across 63 locale files**.
The twentieth 50-value Kashmiri batch added activity labels, custom fields,
automation-rule editing, workflow triggers and rule import and export. This left
**135,574 genuinely untranslated values across 63 locale files**.
The twenty-first 50-value Kashmiri batch added visual-workflow imports,
scheduled and button triggers, due-date conditions and list actions. This left
**135,524 genuinely untranslated values across 63 locale files**.
The twenty-second 50-value Kashmiri batch added movement and archive conditions,
label, member and checklist triggers, card positioning and email actions. This
left **135,474 genuinely untranslated values across 63 locale files**.
The twenty-third 50-value Kashmiri batch added rule action descriptions,
checklist and swimlane creation, date-field actions, authentication and custom
branding. This left **135,424 genuinely untranslated values across 63 locale
files**.
The twenty-fourth 50-value Kashmiri batch added member lists, custom HTML,
authentication errors, board duplication, due reminders, deletion confirmations
and resize controls. This left **135,374 genuinely untranslated values across 63
locale files**.
The twenty-fifth 50-value Kashmiri batch added multi-window cards, inline editor
shortcuts, organization and user dialogs, notifications, board roles and weekday
names. This left **135,324 genuinely untranslated values across 63 locale
files**.
The twenty-sixth 50-value Kashmiri batch added linked-card safeguards, tasks,
domain sharing, shared templates, My Cards and Due Cards views and missing-item
errors. This left **135,274 genuinely untranslated values across 63 locale
files**.
The twenty-seventh 50-value Kashmiri batch added search-result counts and
single-token advanced-search operators and predicates for board, card, date and
content fields. This left **135,224 genuinely untranslated values across 63
locale files**.
The twenty-eighth 50-value Kashmiri batch added the remaining search predicates,
validation errors, pagination and the complete advanced-search operator guide.
This left **135,174 genuinely untranslated values across 63 locale files**.
The twenty-ninth 50-value Kashmiri batch added board and card sorting, stickers,
card dependencies, dependency imports, board backgrounds and card locations.
This left **135,124 genuinely untranslated values across 63 locale files**.
The thirtieth 50-value Kashmiri batch added map coordinates and detection,
server troubleshooting, string templates, board activity, Problems reports and
office login reporting. This left **135,074 genuinely untranslated values across
63 locale files**.
The thirty-first 50-value Kashmiri batch added Office and API report details,
data recovery status, swimlane copying, wait indicators, ticket states and card
detail dialogs. This left **135,024 genuinely untranslated values across 63
locale files**.
The thirty-second 50-value Kashmiri batch added team and organization assignment,
Node memory diagnostics, legal notices, checklist actions and attachment storage
moves. This left **134,974 genuinely untranslated values across 63 locale
files**.
The thirty-third 50-value Kashmiri batch added bulk attachment migration, storage
repair and progress, file statistics, storage identifiers and MongoDB compaction.
This left **134,924 genuinely untranslated values across 63 locale files**.
The thirty-fourth 50-value Kashmiri batch added board status and upload progress,
file limits, custom translations, checklist display, Support and Accessibility
pages. This left **134,874 genuinely untranslated values across 63 locale
files**.
The thirty-fifth 50-value Kashmiri batch added Accessibility content, brute-force
lockout settings, Admin Panel user status, storage paths and scheduled board
operations. This left **134,824 genuinely untranslated values across 63 locale
files**.
The thirty-sixth 50-value Kashmiri batch added scheduled-job lifecycle and error
handling, filesystem and cloud storage, database migration and Sandstorm
migration status. This left **134,774 genuinely untranslated values across 63
locale files**.
The thirty-seventh 50-value Kashmiri batch added Sandstorm cleanup, adaptive card
loading, safe text rendering, import and export privacy controls and backup scope.
This left **134,724 genuinely untranslated values across 63 locale files**.
The thirty-eighth 50-value Kashmiri batch added backup scheduling and restore,
Google Cloud credentials, S3, Azure and GCS setup guidance and cloud connection
status. This left **134,674 genuinely untranslated values across 63 locale
files**.
The thirty-ninth 50-value Kashmiri batch added GCS and GridFS storage, migration
lifecycle controls, S3 credentials, scheduled board operations and attachment
monitoring. This left **134,624 genuinely untranslated values across 63 locale
files**.
The fortieth 50-value Kashmiri batch added board-integrity migrations,
duplicate-list cleanup, lost-card and archive recovery, missing-list and file URL
repairs, migration confirmations and progress steps. This left **134,574
genuinely untranslated values across 63 locale files**.
The forty-first 50-value Kashmiri batch added migration repair steps, one-time
board conversion, CPU and storage monitoring, recurring schedules and job-queue
labels. This left **134,524 genuinely untranslated values across 63 locale
files**.
The forty-second 50-value Kashmiri batch added attachment migration targets and
tuning, CPU limits, migration monitoring, progress controls, storage statistics
and pagination. This left **134,474 genuinely untranslated values across 63
locale files**.
The forty-third 50-value Kashmiri batch added repository and account access,
authentication errors, problem reporting, card repair, CPU status and event
metadata. This left **134,424 genuinely untranslated values across 63 locale
files**.
The forty-fourth and final 17-value Kashmiri batch added IP event fields,
filesystem integrity, scoped import and export controls and numeric search
syntax. Kashmiri is complete, leaving **134,407 genuinely untranslated values
across 62 locale files**.
The first 50-value Kurmanji Kurdish batch added activity history for board,
swimlane, list, card, checklist, label, attachment and comment changes. This left
**134,357 genuinely untranslated values across 62 locale files**.
The second 50-value Kurmanji Kurdish batch added card movement, membership,
checklist and date activity plus workspace creation and editing. This left
**134,307 genuinely untranslated values across 62 locale files**.
The third 50-value Kurmanji Kurdish batch added workspace bulk actions, Home-board
selection, list widths, keyboard shortcuts, swimlane height and creation
controls. This left **134,257 genuinely untranslated values across 62 locale
files**.
The fourth 50-value Kurmanji Kurdish batch added administration announcements,
archive and template actions, reconnection guidance, board backgrounds, member
summaries and privacy. This left **134,207 genuinely untranslated values across
62 locale files**.
The fifth 50-value Kurmanji Kurdish batch added board visibility and navigation,
mobile and desktop views, zoom, calendar modes and card, list and swimlane archive
guidance. This left **134,157 genuinely untranslated values across 62 locale
files**.
The sixth 50-value Kurmanji Kurdish batch added card membership, voting and
Planning Poker, dependencies, board organization, team and domain assignment,
backgrounds and import dialogs. This left **134,107 genuinely untranslated
values across 62 locale files**.
The seventh 50-value Kurmanji Kurdish batch added member and restore dialogs,
linked items, safe imported-member mapping, themes, fonts, text colors, avatars,
language and permissions. This left **134,057 genuinely untranslated values
across 62 locale files**.
The eighth 50-value Kurmanji Kurdish batch added starring, automatic list widths,
card-aging tiers, keyboard movement, accessible dialog controls and 23 color
names. This left **134,007 genuinely untranslated values across 62 locale
files**.
The ninth 50-value Kurmanji Kurdish batch added permission roles, comment
visibility, deletion confirmations, clipboard and template copying, valid JSON
examples, labels and custom-field types. This left **133,957 genuinely
untranslated values across 62 locale files**.
The tenth 50-value Kurmanji Kurdish batch added permanent-delete controls,
profile and WIP dialogs, transactional email templates, authorization errors,
import schemas, empty-export recovery and linked-card safety. This left
**133,907 genuinely untranslated values across 62 locale files**.
The eleventh 50-value Kurmanji Kurdish batch added account-conflict errors, card
exports to PDF and Excel, disk-space diagnostics, attachment metadata, sorting
and date, label and member filters. This left **133,857 genuinely untranslated
values across 62 locale files**.
The twelfth 50-value Kurmanji Kurdish batch added assignee and advanced filters,
member status and impersonation, multi-source board import guidance and secure
Trello JSON and ZIP handling. This left **133,807 genuinely untranslated values
across 62 locale files**.
The thirteenth 50-value Kurmanji Kurdish batch added ZIP path safety, workspace
placement, direct Trello API import and job controls, member mapping, validation,
keyboard shortcuts and label lifecycle. This left **133,757 genuinely
untranslated values across 62 locale files**.
The fourteenth 50-value Kurmanji Kurdish batch added last-admin protection,
leaving boards, list and card archive actions, settings and import dialogs,
multi-selection, notification modes and normal roles. This left **133,707
genuinely untranslated values across 62 locale files**.
The fifteenth 50-value Kurmanji Kurdish batch added watched updates, private-page
login markup, previews, visibility, member removal and Sandstorm access, rescue
dialogs, search, WIP limits, shortcuts and default-board behavior. This left
**133,657 genuinely untranslated values across 62 locale files**.
The sixteenth 50-value Kurmanji Kurdish batch added starred boards, time tracking,
assignee and label shortcuts, uploads, custom logos and URL schemes, welcome and
template boards and WIP-limit guidance. This left **133,607 genuinely
untranslated values across 62 locale files**.
The seventeenth 50-value Kurmanji Kurdish batch added attachment and API limits,
avatar-upload blocking, registration and invitations, SMTP and TLS setup, test
mail, webhooks and runtime version labels. This left **133,557 genuinely
untranslated values across 62 locale files**.
The eighteenth 50-value Kurmanji Kurdish batch added database and FerretDB
diagnostics, reactivity, DDP and OS metrics, custom-field display, account
changes, visibility and organization and team multitenancy administration. This
left **133,507 genuinely untranslated values across 62 locale files**.
The nineteenth 50-value Kurmanji Kurdish batch added card lifecycle dates,
colors and attribution, destructive-action safeguards, subtask placement,
minicard metadata, parent paths and label activity. This left **133,457 genuinely
untranslated values across 62 locale files**.
The twentieth 50-value Kurmanji Kurdish batch added label and custom-field
activity, visual rule building, event triggers and JSON, CSV and Trello Butler
rule exchange. This left **133,407 genuinely untranslated values across 62
locale files**.
The twenty-first 50-value Kurmanji Kurdish batch added n8n and Node-RED workflow
imports, scheduled and button triggers, due-date conditions, list and card
automation, relative dates, units and movement phrases. This left **133,357
genuinely untranslated values across 62 locale files**.
The twenty-second 50-value Kurmanji Kurdish batch added rule phrases for board
and list movement, archive restoration, labels, members, attachments,
checklists, card positioning, colors and email actions. This left **133,307
genuinely untranslated values across 62 locale files**.
The twenty-third 50-value Kurmanji Kurdish batch added detailed rule actions for
cards, checklists, swimlanes and dates plus authentication, custom product HTML
and JSON metadata, layout and counters. This left **133,257 genuinely
untranslated values across 62 locale files**.
The twenty-fourth 50-value Kurmanji Kurdish batch added authentication display,
board duplication, custom body HTML, lifecycle activity, due reminders,
deletion confirmations and resizable layout controls. This left **133,207
genuinely untranslated values across 62 locale files**.
The twenty-fifth 50-value Kurmanji Kurdish batch added multi-card windows, editor
submission shortcuts, entity dialogs, notification states, rename and invite
permissions, board-role status, weekdays, ownership and voting. This left
**133,157 genuinely untranslated values across 62 locale files**.
The twenty-sixth 50-value Kurmanji Kurdish batch added linked-list safeguards,
tasks, domain-scoped shared templates, personal and due-card views, global search
scopes and missing board, swimlane, list and label messages. This left **133,107
genuinely untranslated values across 62 locale files**.
The twenty-seventh 50-value Kurmanji Kurdish batch added missing user, comment,
organization and team results, result counts and space-free localized global
search operators and predicates. This left **133,057 genuinely untranslated
values across 62 locale files**.
The twenty-eighth 50-value Kurmanji Kurdish batch added predicate validation,
pagination and complete global-search operator syntax, status, existence,
sorting, limits, boolean combinations and date guidance. This left **133,007
genuinely untranslated values across 62 locale files**.
The twenty-ninth 50-value Kurmanji Kurdish batch added board and card sorting,
stickers, dependency editing and JSON or SVG imports, board backgrounds and
location entry. This left **132,957 genuinely untranslated values across 62
locale files**.
The thirtieth 50-value Kurmanji Kurdish batch added map detection, server
troubleshooting, sorting, string templates, invisible filenames, administration
reports, recovery and office-login summaries. This left **132,907 genuinely
untranslated values across 62 locale files**.
The thirty-first 50-value Kurmanji Kurdish batch added office and API activity,
recovery health and maintenance, swimlane copying, loading-spinner styles, card
sizing, deletion safeguards, tickets, requests, sorting and card details. This
left **132,857 genuinely untranslated values across 62 locale files**.
The thirty-second 50-value Kurmanji Kurdish batch added team invitations, Node
memory diagnostics, organization controls, legal notices, checklist actions and
attachment storage targets. This left **132,807 genuinely untranslated values
across 62 locale files**.
The thirty-third 50-value Kurmanji Kurdish batch added bulk attachment moves,
storage repair, default backends, progress and file statistics, MongoDB Compact
guidance and resource identifiers. This left **132,757 genuinely untranslated
values across 62 locale files**.
The thirty-fourth 50-value Kurmanji Kurdish batch added board and upload status,
account and file limits, workspace dragging, custom translations, checklist
display, support and accessibility. This left **132,707 genuinely untranslated
values across 62 locale files**.
The thirty-fifth 50-value Kurmanji Kurdish batch added accessibility content,
brute-force lockout administration, active-user filters, scheduled Cron jobs,
attachment paths and scheduled board maintenance. This left **132,657 genuinely
untranslated values across 62 locale files**.
The thirty-sixth 50-value Kurmanji Kurdish batch added scheduled-job controls and
migration errors, filesystem, S3 and Azure storage, MongoDB and FerretDB database
migration and Sandstorm migration status. This left **132,607 genuinely
untranslated values across 62 locale files**.
The thirty-seventh 50-value Kurmanji Kurdish batch added Sandstorm cleanup, card
loading performance, secure plain-text rendering, import and export restrictions,
identity anonymization, activity controls and streamed backups. This left
**132,557 genuinely untranslated values across 62 locale files**.
The thirty-eighth 50-value Kurmanji Kurdish batch added backup schedules and
restore modes, Google Cloud credentials and permissions, S3, Azure and GCS setup
paths, secret retention and cloud connection status. This left **132,507
genuinely untranslated values across 62 locale files**.
The thirty-ninth 50-value Kurmanji Kurdish batch added GridFS and GCS storage,
migration lifecycle controls, CollectionFS movement, S3 authentication and TLS,
scheduled board operations and attachment monitoring. This left **132,457
genuinely untranslated values across 62 locale files**.
The fortieth 50-value Kurmanji Kurdish batch added comprehensive board repair,
duplicate-list cleanup, lost and archived item recovery, file URL fixes,
migration confirmations, progress and validation steps. This left **132,407
genuinely untranslated values across 62 locale files**.
The forty-first 50-value Kurmanji Kurdish batch added attachment and missing-ID
repair steps, board conversion, CPU and timing status, scheduled intervals,
filesystem and GridFS monitoring and job-queue details. This left **132,357
genuinely untranslated values across 62 locale files**.
The forty-second 50-value Kurmanji Kurdish batch added storage migration targets
and tuning, CPU limits, background migration guidance, monitoring controls,
progress, scheduling and resource totals. This left **132,307 genuinely
untranslated values across 62 locale files**.
The forty-third 50-value Kurmanji Kurdish batch added OTP account access,
repository management, API endpoints, login errors, problem reporting, card
repair, CPU status and event metadata. This left **132,257 genuinely
untranslated values across 62 locale files**.
The forty-fourth and final 17-value Kurmanji Kurdish batch added IP event fields,
filesystem integrity, scoped import and export controls and numeric search
syntax. Kurmanji Kurdish is complete, leaving **132,240 genuinely untranslated
values across 61 locale files**.
The first 50-value Cornish batch added activity history for board, swimlane,
list, card, checklist, label, attachment, comment and member changes. This left
**132,190 genuinely untranslated values across 61 locale files**.
The second 50-value Cornish batch added card movement, membership, checklist and
date activity plus workspace creation and editing. This left **132,140 genuinely
untranslated values across 61 locale files**.
The third 50-value Cornish batch added workspace deletion, board bulk actions,
Home-board selection, list widths, keyboard shortcuts, swimlane height and
creation controls. This left **132,090 genuinely untranslated values across 61
locale files**.
The fourth 50-value Cornish batch added administration announcements, archive
and template actions, reconnection guidance, board backgrounds, member summaries
and privacy. This left **132,040 genuinely untranslated values across 61 locale
files**.
The fifth 50-value Cornish batch added board visibility and navigation, mobile
and desktop views, zoom, calendar modes and card, list and swimlane archive
guidance. This left **131,990 genuinely untranslated values across 61 locale
files**.
The sixth 50-value Cornish batch added card membership, voting and Planning
Poker, dependencies, board organization, team and domain assignment,
backgrounds and import dialogs. This left **131,940 genuinely untranslated
values across 61 locale files**.
The seventh 50-value Cornish batch added member and restore dialogs, linked
items, safe imported-member mapping, themes, fonts, text colors, avatars,
language and permissions. This left **131,890 genuinely untranslated values
across 61 locale files**.
The eighth 50-value Cornish batch added starring, automatic list widths,
card-aging tiers, keyboard movement, accessible dialog controls and 23 color
names. This left **131,840 genuinely untranslated values across 61 locale
files**.
The ninth 50-value Cornish batch added permission roles, comment visibility,
deletion confirmations, clipboard and template copying, valid JSON examples,
labels and custom-field types. This left **131,790 genuinely untranslated values
across 61 locale files**.
The tenth 50-value Cornish batch added permanent-delete controls, profile and WIP
dialogs, transactional email templates, authorization errors, import schemas,
empty-export recovery and linked-card safety. This left **131,740 genuinely
untranslated values across 61 locale files**.
The eleventh 50-value Cornish batch added account-conflict errors, card exports
to PDF and Excel, disk-space diagnostics, attachment metadata, sorting and date,
label and member filters. This left **131,690 genuinely untranslated values
across 61 locale files**.
The twelfth 50-value Cornish batch added assignee and advanced filters, member
status and impersonation, multi-source board import guidance and secure Trello
JSON and ZIP handling. This left **131,640 genuinely untranslated values across
61 locale files**.
The thirteenth 50-value Cornish batch added ZIP path safety, workspace placement,
direct Trello API import and job controls, member mapping, validation, keyboard
shortcuts and label lifecycle. This left **131,590 genuinely untranslated values
across 61 locale files**.
The fourteenth 50-value Cornish batch added last-admin protection, leaving
boards, list and card archive actions, settings and import dialogs,
multi-selection, notification modes and normal roles. This left **131,540
genuinely untranslated values across 61 locale files**.
The fifteenth 50-value Cornish batch added watched updates, private-page login
markup, previews, visibility, member removal and Sandstorm access, rescue
dialogs, search, WIP limits, shortcuts and default-board behavior. This left
**131,490 genuinely untranslated values across 61 locale files**.
The sixteenth 50-value Cornish batch added starred boards, time tracking,
assignee and label shortcuts, uploads, custom logos and URL schemes, welcome and
template boards and WIP-limit guidance. This left **131,440 genuinely
untranslated values across 61 locale files**.
The seventeenth 50-value Cornish batch added attachment and API limits,
avatar-upload blocking, registration and invitations, SMTP and TLS setup, test
mail, webhooks and runtime version labels. This left **131,390 genuinely
untranslated values across 61 locale files**.
The eighteenth 50-value Cornish batch added database and FerretDB diagnostics,
reactivity, DDP and OS metrics, custom-field display, account changes,
visibility and organization and team multitenancy administration. This left
**131,340 genuinely untranslated values across 61 locale files**.
The nineteenth 50-value Cornish batch added card lifecycle dates, colors and
attribution, destructive-action safeguards, subtask placement, minicard
metadata, parent paths and label activity. This left **131,290 genuinely
untranslated values across 61 locale files**.
The twentieth 50-value Cornish batch added label and custom-field activity,
visual rule building, event triggers and JSON, CSV and Trello Butler rule
exchange. This left **131,240 genuinely untranslated values across 61 locale
files**.
The twenty-first 50-value Cornish batch added n8n and Node-RED workflow imports,
scheduled and button triggers, due-date conditions, list and card automation,
relative dates, units and movement phrases. This left **131,190 genuinely
untranslated values across 61 locale files**.
The twenty-second 50-value Cornish batch added rule phrases for board and list
movement, archive restoration, labels, members, attachments, checklists, card
positioning, colors and email actions. This left **131,140 genuinely untranslated
values across 61 locale files**.
The twenty-third 50-value Cornish batch added detailed rule actions for cards,
checklists, swimlanes and dates plus authentication, custom product HTML and JSON
metadata, layout and counters. This left **131,090 genuinely untranslated values
across 61 locale files**.
The twenty-fourth 50-value Cornish batch added authentication display, board
duplication, custom body HTML, lifecycle activity, due reminders, deletion
confirmations and resizable layout controls. This left **131,040 genuinely
untranslated values across 61 locale files**.
The twenty-fifth 50-value Cornish batch added multi-card windows, editor
submission shortcuts, entity dialogs, notification states, rename and invite
permissions, board-role status, weekdays, ownership and voting. This left
**130,990 genuinely untranslated values across 61 locale files**.
The twenty-sixth 50-value Cornish batch added linked-list safeguards, tasks,
domain-scoped shared templates, personal and due-card views, global search scopes
and missing board, swimlane, list and label messages. This left **130,940
genuinely untranslated values across 61 locale files**.
The twenty-seventh 50-value Cornish batch added missing user, comment,
organization and team results, result counts and space-free localized global
search operators and predicates. This left **130,890 genuinely untranslated
values across 61 locale files**.
The twenty-eighth 50-value Cornish batch added predicate validation, pagination
and complete global-search operator syntax, status, existence, sorting, limits,
boolean combinations and date guidance. This left **130,840 genuinely
untranslated values across 61 locale files**.
The twenty-ninth 50-value Cornish batch added board and card sorting, stickers,
dependency editing and JSON or SVG imports, board backgrounds and location
entry. This left **130,790 genuinely untranslated values across 61 locale
files**.
The thirtieth 50-value Cornish batch added map detection, server troubleshooting,
sorting, string templates, invisible filenames, administration reports, recovery
and office-login summaries. This left **130,740 genuinely untranslated values
across 61 locale files**.
The thirty-first 50-value Cornish batch added office and API activity, recovery
health and maintenance, swimlane copying, loading-spinner styles, card sizing,
deletion safeguards, tickets, requests, sorting and card details. This left
**130,690 genuinely untranslated values across 61 locale files**.
The thirty-second 50-value Cornish batch added team invitations, Node memory
diagnostics, organization controls, legal notices, checklist actions and
attachment storage targets. This left **130,640 genuinely untranslated values
across 61 locale files**.
The thirty-third 50-value Cornish batch added bulk attachment moves, storage
repair, default backends, progress and file statistics, MongoDB Compact guidance
and resource identifiers. This left **130,590 genuinely untranslated values
across 61 locale files**.
The thirty-fourth 50-value Cornish batch added board and upload status, account
and file limits, workspace dragging, custom translations, checklist display,
support and accessibility. This left **130,540 genuinely untranslated values
across 61 locale files**.
The thirty-fifth 50-value Cornish batch added accessibility content, brute-force
lockout administration, active-user filters, scheduled Cron jobs, attachment
paths and scheduled board maintenance. This left **130,490 genuinely
untranslated values across 61 locale files**.
The thirty-sixth 50-value Cornish batch added scheduled-job controls and
migration errors, filesystem, S3 and Azure storage, MongoDB and FerretDB database
migration and Sandstorm migration status. This left **130,440 genuinely
untranslated values across 61 locale files**.
The thirty-seventh 50-value Cornish batch added Sandstorm storage cleanup,
card-loading modes, secure plain-text rendering, import and export privacy
controls, notification controls and backup scope and storage. This left
**130,390 genuinely untranslated values across 61 locale files**.
The thirty-eighth 50-value Cornish batch added scheduled backups, restore modes,
Google Cloud Storage credentials and permissions, S3 and Azure setup guidance,
cloud connection tests and Azure attachment moves. This left **130,340 genuinely
untranslated values across 61 locale files**.
The thirty-ninth 50-value Cornish batch added GridFS and attachment migration,
migration lifecycle controls, S3 authentication and connection settings,
scheduled board operations and writable storage paths. This left **130,290
genuinely untranslated values across 61 locale files**.
The fortieth 50-value Cornish batch added comprehensive board integrity
migrations, recovery of lost and archived cards, list and file-reference repair,
migration confirmations, progress and validation steps. This left **130,240
genuinely untranslated values across 61 locale files**.
The forty-first 50-value Cornish batch added migration step labels, board
conversion status, CPU and runtime monitoring, recurring schedules,
filesystem and GridFS metrics and job-queue controls. This left **130,190
genuinely untranslated values across 61 locale files**.
The forty-second 50-value Cornish batch added attachment migration targets and
tuning, CPU and memory limits, background-migration guidance, monitoring,
pagination, scheduling and progress totals. This left **130,140 genuinely
untranslated values across 61 locale files**.
The forty-third 50-value Cornish batch added account and repository access,
authentication errors, system-problem reporting, broken-card repair results,
CPU load and event metadata. This left **130,090 genuinely untranslated values
across 61 locale files**.
The final 17-value Cornish batch added event network details, filesystem
integrity, scoped WeKan imports and exports and numeric search guidance. Cornish
is now complete. This left **130,073 genuinely untranslated values across 60
locale files**.
The first 50-value Kyrgyz batch added board membership rules, replies and due
dates and detailed activity messages for attachments, subtasks, labels,
checklists, comments, boards, cards, lists and archives. This left **130,023
genuinely untranslated values across 60 locale files**.
The second 50-value Kyrgyz batch added card moves and restoration, compact
activity phrases, checklist and comment activity and workspace navigation and
settings. This left **129,973 genuinely untranslated values across 60 locale
files**.
The third 50-value Kyrgyz batch added workspace deletion, multi-board selection,
Home behavior, date activity, shared and personal list widths, keyboard
shortcuts, swimlane sizing and checklist controls. This left **129,923 genuinely
untranslated values across 60 locale files**.
The fourth 50-value Kyrgyz batch added administrator announcements, archive and
restore flows, template containers, attachment handling, background images,
All Boards display choices and board membership summaries. This left **129,873
genuinely untranslated values across 60 locale files**.
The fifth 50-value Kyrgyz batch added public-board guidance, board movement and
appearance, mobile and desktop views, zoom and calendar controls, archive
warnings and card dates and editing actions. This left **129,823 genuinely
untranslated values across 60 locale files**.
The sixth 50-value Kyrgyz batch added voting and Planning Poker, card
dependencies, organization and team dialogs, account and background
administration and checklist, swimlane, list and card imports. This left
**129,773 genuinely untranslated values across 60 locale files**.
The seventh 50-value Kyrgyz batch added member and restoration dialogs, linked
cards and boards, safe imported-user mapping, themes, fonts, colors, avatars,
language and permissions. This left **129,723 genuinely untranslated values
across 60 locale files**.
The eighth 50-value Kyrgyz batch added starring, automatic list widths, card
aging tiers, keyboard movement and navigation, archive restoration guidance and
the board color palette. This left **129,673 genuinely untranslated values
across 60 locale files**.
The ninth 50-value Kyrgyz batch added restricted board roles, deletion
confirmations, clipboard and card-link actions, bulk JSON card copying,
template and label creation and custom-field types. This left **129,623 genuinely
untranslated values across 60 locale files**.
The tenth 50-value Kyrgyz batch added permanent deletion and WIP controls,
profile and date dialogs, enrollment, invitation, reset and verification emails
and board, import and linked-card errors. This left **129,573 genuinely
untranslated values across 60 locale files**.
The eleventh 50-value Kyrgyz batch added account validation errors, card PDF and
Excel exports, attachment metadata, list sorting and date, label and member
filters. This left **129,523 genuinely untranslated values across 60 locale
files**.
The twelfth 50-value Kyrgyz batch added advanced filtering, member-state labels
and Kanboard, NextCloud Deck, OpenProject, issue, Asana, ZenKit, Trello, CSV,
Jira, Excel and WeKan board imports. This left **129,473 genuinely untranslated
values across 60 locale files**.
The thirteenth 50-value Kyrgyz batch added safe Trello ZIP and API imports,
import cancellation and cleanup, member mapping, date and user validation,
keyboard shortcuts and label creation. This left **129,423 genuinely
untranslated values across 60 locale files**.
The fourteenth 50-value Kyrgyz batch added board leaving, list archive and
deletion flows, user, team and organization settings, swimlane actions, bulk
selection, notification muting and normal board roles. This left **129,373
genuinely untranslated values across 60 locale files**.
The fifteenth 50-value Kyrgyz batch added watched updates, private-page login,
board visibility, member removal and Sandstorm warnings, rescue and search
behavior, WIP limits, shortcuts, sidebars and default-board controls. This left
**129,323 genuinely untranslated values across 60 locale files**.
The sixteenth 50-value Kyrgyz batch added starring and subscriptions, time and
overtime tracking, numeric shortcuts, uploads, custom branding and URL schemes,
welcome and template boards and WIP-limit errors. This left **129,273 genuinely
untranslated values across 60 locale files**.
The seventeenth 50-value Kyrgyz batch added attachment and API transfer limits,
registration and invitations, SMTP setup and test emails, outgoing webhooks and
database, Node and Meteor version labels. This left **129,223 genuinely
untranslated values across 60 locale files**.
The eighteenth 50-value Kyrgyz batch added database and runtime diagnostics,
reactivity, DDP and OS metrics, custom-field display, account changes, board
visibility and organization and team tenancy controls. This left **129,173
genuinely untranslated values across 60 locale files**.
The nineteenth 50-value Kyrgyz batch added received and end dates, colors and
attribution, destructive board and notification actions, subtask settings,
minicard display, parent paths and label activity. This left **129,123 genuinely
untranslated values across 60 locale files**.
The twentieth 50-value Kyrgyz batch added label, attachment and custom-field
activity, visual rule editing, card and checklist triggers, scheduled rules and
JSON, CSV and Trello Butler rule exchange. This left **129,073 genuinely
untranslated values across 60 locale files**.
The twenty-first 50-value Kyrgyz batch added n8n and Node-RED workflow imports,
schedule and due-date triggers, card and board buttons, list sorting, completion
and movement actions, relative dates and rule units. This left **129,023
genuinely untranslated values across 60 locale files**.
The twenty-second 50-value Kyrgyz batch added rule phrases for board, list,
card, label, member, attachment and checklist triggers and card movement,
membership, color, checklist and email actions. This left **128,973 genuinely
untranslated values across 60 locale files**.
The twenty-third 50-value Kyrgyz batch added detailed rule actions and date
fields, authentication controls, custom product and head tags, web manifests,
asset links, layout, logo and card counters. This left **128,923 genuinely
untranslated values across 60 locale files**.
The twenty-fourth 50-value Kyrgyz batch added custom body HTML, authentication
display, board duplication, destructive swimlane and account actions, date
activity and reminders, relative placement and resizable navigation. This left
**128,873 genuinely untranslated values across 60 locale files**.
The twenty-fifth 50-value Kyrgyz batch added multi-card windows, editor
shortcuts, organization, team and user dialogs, notification actions, rename and
role permissions, weekdays, status, ownership and voting. This left **128,823
genuinely untranslated values across 60 locale files**.
The twenty-sixth 50-value Kyrgyz batch added linked-list safeguards, tasks,
domain and shared-template management, My Cards and Due Cards views, global
search scope and missing board-item messages. This left **128,773 genuinely
untranslated values across 60 locale files**.
The twenty-seventh 50-value Kyrgyz batch added missing user, comment,
organization and team results, paginated card counts and localized global-search
operator and predicate vocabulary. This left **128,723 genuinely untranslated
values across 60 locale files**.
The twenty-eighth 50-value Kyrgyz batch added search predicate validation,
pagination and detailed operator guidance for board, list, member, status,
existence, sorting, limits and combined searches. This left **128,673 genuinely
untranslated values across 60 locale files**.
The twenty-ninth 50-value Kyrgyz batch added board and card sorting, completion,
stickers, dependency relationships and JSON and SVG imports, board backgrounds,
upload limits and card locations. This left **128,623 genuinely untranslated
values across 60 locale files**.
The thirtieth 50-value Kyrgyz batch added map detection, server troubleshooting,
sorting, board activity, string templates, file diagnostics, security, speed,
database, recovery, impersonation and office reports. This left **128,573
genuinely untranslated values across 60 locale files**.
The thirty-first 50-value Kyrgyz batch added office and API reporting, automatic
data recovery and MongoDB remediation, swimlane copying, wait spinners,
organization and team safeguards, ticket and request states and card details.
This left **128,523 genuinely untranslated values across 60 locale files**.
The thirty-second 50-value Kyrgyz batch added team invitations, Node memory
diagnostics, organization management, legal notices, checklist transformations
and attachment storage moves. This left **128,473 genuinely untranslated values
across 60 locale files**.
The thirty-third 50-value Kyrgyz batch added bulk attachment and avatar moves,
storage repair and statistics, default storage, file IDs and MongoDB GridFS
compaction guidance and status. This left **128,423 genuinely untranslated
values across 60 locale files**.
The thirty-fourth 50-value Kyrgyz batch added board and upload status, account
and file limits, workspace dragging, custom translations, checklist display,
support and accessibility. This left **128,373 genuinely untranslated values
across 60 locale files**.
The thirty-fifth 50-value Kyrgyz batch added accessibility content, brute-force
lockout administration, active-user filters, scheduled Cron jobs, attachment
paths and scheduled board maintenance. This left **128,323 genuinely
untranslated values across 60 locale files**.
The thirty-sixth 50-value Kyrgyz batch added scheduled-job controls and
migration errors, filesystem, S3 and Azure storage, MongoDB and FerretDB database
migration and Sandstorm migration status. This left **128,273 genuinely
untranslated values across 60 locale files**.
The thirty-seventh 50-value Kyrgyz batch added Sandstorm storage cleanup,
card-loading modes, secure plain-text rendering, import and export privacy
controls, notification controls and backup scope and storage. This left
**128,223 genuinely untranslated values across 60 locale files**.
The thirty-eighth 50-value Kyrgyz batch added scheduled backups, restore modes,
Google Cloud Storage credentials and permissions, S3 and Azure setup guidance,
cloud connection tests and Azure attachment moves. This left **128,173 genuinely
untranslated values across 60 locale files**.
The thirty-ninth 50-value Kyrgyz batch added GridFS and attachment migration,
migration lifecycle controls, S3 authentication and connection settings,
scheduled board operations and writable storage paths. This left **128,123
genuinely untranslated values across 60 locale files**.
The fortieth 50-value Kyrgyz batch added comprehensive board integrity
migrations, recovery of lost and archived cards, list and file-reference repair,
migration confirmations, progress and validation steps. This left **128,073
genuinely untranslated values across 60 locale files**.
The forty-first 50-value Kyrgyz batch added migration step labels, board
conversion status, CPU and runtime monitoring, recurring schedules,
filesystem and GridFS metrics and job-queue controls. This left **128,023
genuinely untranslated values across 60 locale files**.
The forty-second 50-value Kyrgyz batch added attachment migration targets and
tuning, CPU and memory limits, background-migration guidance, monitoring,
pagination, scheduling and progress totals. This left **127,973 genuinely
untranslated values across 60 locale files**.
The forty-third 50-value Kyrgyz batch added account and repository access,
authentication errors, system-problem reporting, broken-card repair results,
CPU load and event metadata. This left **127,923 genuinely untranslated values
across 60 locale files**.
The final 17-value Kyrgyz batch added event network details, filesystem
integrity, scoped WeKan imports and exports and numeric search guidance. Kyrgyz
is now complete. This left **127,906 genuinely untranslated values across 59
locale files**.
The first 50-value Maithili batch added board membership rules, replies and due
dates and detailed activity messages for attachments, subtasks, labels,
checklists, comments, boards, cards, lists and archives. These direct
translations were completed with low confidence and welcome review by a
Maithili speaker. This left **127,856 genuinely untranslated values across 59
locale files**.
The second 50-value Maithili batch added card moves and restoration, compact
activity phrases, checklist and comment activity and workspace navigation and
settings. These direct translations were completed with low confidence and
welcome review by a Maithili speaker. This left **127,806 genuinely untranslated
values across 59 locale files**.
The third 50-value Maithili batch added workspace deletion, multi-board
selection, Home-board behavior, date activity, shared and personal list widths,
keyboard shortcuts, swimlane sizing and checklist controls. These direct
translations were completed with low confidence and welcome review by a
Maithili speaker. This left **127,756 genuinely untranslated values across 59
locale files**.
The fourth 50-value Maithili batch added administrator announcements, archive
and restore flows, template containers, attachment handling, background images,
All Boards display choices and board membership summaries. These direct
translations were completed with low confidence and welcome review by a
Maithili speaker. This left **127,706 genuinely untranslated values across 59
locale files**.
The fifth 50-value Maithili batch added public-board guidance, board movement
and appearance, mobile and desktop views, zoom and calendar controls, archive
warnings and card dates and editing actions. These direct translations were
completed with low confidence and welcome review by a Maithili speaker. This
left **127,656 genuinely untranslated values across 59 locale files**.
The sixth 50-value Maithili batch added voting and Planning Poker, card
dependencies, organization and team dialogs, account and background
administration and checklist, swimlane, list and card imports. These direct
translations were completed with low confidence and welcome review by a
Maithili speaker. This left **127,606 genuinely untranslated values across 59
locale files**.
The seventh 50-value Maithili batch added member and restoration dialogs,
linked cards and boards, safe imported-user mapping, themes, fonts, colors,
avatars, language and permissions. These direct translations were completed
with low confidence and welcome review by a Maithili speaker. This left
**127,556 genuinely untranslated values across 59 locale files**.
The eighth 50-value Maithili batch added starring, automatic list widths, card
aging tiers, keyboard movement and navigation, archive restoration guidance and
most of the board color palette. These direct translations were completed with
low confidence and welcome review by a Maithili speaker. This left **127,506
genuinely untranslated values across 59 locale files**.
The ninth 50-value Maithili batch completed the board color palette and added
restricted board roles, deletion confirmations, clipboard and card-link
actions, bulk JSON card copying, template and label creation and custom-field
types. These direct translations were completed with low confidence and welcome
review by a Maithili speaker. This left **127,456 genuinely untranslated values
across 59 locale files**.
The tenth 50-value Maithili batch added permanent deletion and WIP controls,
profile and date dialogs, enrollment, invitation, reset and verification emails
and board, import and linked-card errors. These direct translations were
completed with low confidence and welcome review by a Maithili speaker. This
left **127,406 genuinely untranslated values across 59 locale files**.
The eleventh 50-value Maithili batch added account validation errors, card PDF
and Excel exports, attachment metadata, list sorting and date, label and member
filters. These direct translations were completed with low confidence and
welcome review by a Maithili speaker. This left **127,356 genuinely untranslated
values across 59 locale files**.
The twelfth 50-value Maithili batch added advanced filtering, member-state
labels and Kanboard, NextCloud Deck, OpenProject, issue, Asana, ZenKit, Trello,
CSV, Jira, Excel and WeKan board imports. These direct translations were
completed with low confidence and welcome review by a Maithili speaker. This
left **127,306 genuinely untranslated values across 59 locale files**.
The thirteenth 50-value Maithili batch added safe Trello ZIP and API imports,
import cancellation and cleanup, member mapping, date and user validation,
keyboard shortcuts and label creation. These direct translations were completed
with low confidence and welcome review by a Maithili speaker. This left
**127,256 genuinely untranslated values across 59 locale files**.
The fourteenth 50-value Maithili batch added board leaving, list archive and
deletion flows, user, team and organization settings, swimlane actions, bulk
selection, notification muting and normal board roles. These direct translations
were completed with low confidence and welcome review by a Maithili speaker.
This left **127,206 genuinely untranslated values across 59 locale files**.
The fifteenth 50-value Maithili batch added watched updates, private-page login,
board visibility, member removal and Sandstorm warnings, rescue and search
behavior, WIP limits, shortcuts, sidebars and default-board controls. These
direct translations were completed with low confidence and welcome review by a
Maithili speaker. This left **127,156 genuinely untranslated values across 59
locale files**.
The sixteenth 50-value Maithili batch added starring and subscriptions, time and
overtime tracking, numeric shortcuts, uploads, custom branding and URL schemes,
welcome and template boards and WIP-limit errors. These direct translations were
completed with low confidence and welcome review by a Maithili speaker. This
left **127,106 genuinely untranslated values across 59 locale files**.
The seventeenth 50-value Maithili batch added attachment and API transfer
limits, registration and invitations, SMTP setup and test emails, outgoing
webhooks and database, Node and Meteor version labels. These direct translations
were completed with low confidence and welcome review by a Maithili speaker.
This left **127,056 genuinely untranslated values across 59 locale files**.
The eighteenth 50-value Maithili batch added database and runtime diagnostics,
reactivity, DDP and OS metrics, custom-field display, account changes, board
visibility and organization and team tenancy controls. These direct translations
were completed with low confidence and welcome review by a Maithili speaker.
This left **127,006 genuinely untranslated values across 59 locale files**.
The nineteenth 50-value Maithili batch added received and end dates, colors and
attribution, destructive board and notification actions, subtask settings,
minicard display, parent paths and label activity. These direct translations
were completed with low confidence and welcome review by a Maithili speaker.
This left **126,956 genuinely untranslated values across 59 locale files**.
The twentieth 50-value Maithili batch added label, attachment and custom-field
activity, visual rule editing, card and checklist triggers, scheduled rules and
JSON, CSV and Trello Butler rule exchange. These direct translations were
completed with low confidence and welcome review by a Maithili speaker. This
left **126,906 genuinely untranslated values across 59 locale files**.
The twenty-first 50-value Maithili batch added n8n and Node-RED workflow imports,
schedule and due-date triggers, card and board buttons, list sorting, completion
and movement actions, relative dates and rule units. These direct translations
were completed with low confidence and welcome review by a Maithili speaker.
This left **126,856 genuinely untranslated values across 59 locale files**.
The twenty-second 50-value Maithili batch added rule phrases for board, list,
card, label, member, attachment and checklist triggers and card movement,
membership, color, checklist and email actions. These direct translations were
completed with low confidence and welcome review by a Maithili speaker. This
left **126,806 genuinely untranslated values across 59 locale files**.
The twenty-third 50-value Maithili batch added detailed rule actions and date
fields, authentication controls, custom product and head tags, web manifests,
asset links, layout, logo and card counters. These direct translations were
completed with low confidence and welcome review by a Maithili speaker. This
left **126,756 genuinely untranslated values across 59 locale files**.
The twenty-fourth 50-value Maithili batch added custom body HTML, authentication
display, board duplication, destructive swimlane and account actions, date
activity and reminders, relative placement and resizable navigation. These
direct translations were completed with low confidence and welcome review by a
Maithili speaker. This left **126,706 genuinely untranslated values across 59
locale files**.
The twenty-fifth 50-value Maithili batch added multi-card windows, editor
shortcuts, organization, team and user dialogs, notification actions, rename and
role permissions, weekdays, status, ownership and voting. These direct
translations were completed with low confidence and welcome review by a
Maithili speaker. This left **126,656 genuinely untranslated values across 59
locale files**.
The twenty-sixth 50-value Maithili batch added linked-list safeguards, tasks,
domain and shared-template management, My Cards and Due Cards views, global
search scope and missing board-item messages. These direct translations were
completed with low confidence and welcome review by a Maithili speaker. This
left **126,606 genuinely untranslated values across 59 locale files**.
The twenty-seventh 50-value Maithili batch added missing user, comment,
organization and team results, paginated card counts and localized global-search
operator and predicate vocabulary. These direct translations were completed
with low confidence and welcome review by a Maithili speaker. This left
**126,556 genuinely untranslated values across 59 locale files**.
The twenty-eighth 50-value Maithili batch added search predicate validation,
pagination and detailed operator guidance for board, list, member, status,
existence, sorting, limits and combined searches. These direct translations were
completed with low confidence and welcome review by a Maithili speaker. This
left **126,506 genuinely untranslated values across 59 locale files**.
The twenty-ninth 50-value Maithili batch added board and card sorting,
completion, stickers, dependency relationships and JSON and SVG imports, board
backgrounds, upload limits and card locations. These direct translations were
completed with low confidence and welcome review by a Maithili speaker. This
left **126,456 genuinely untranslated values across 59 locale files**.
The thirtieth 50-value Maithili batch added map detection, server
troubleshooting, sorting, board activity, string templates, file diagnostics,
security, speed, database, recovery, impersonation and office reports. These
direct translations were completed with low confidence and welcome review by a
Maithili speaker. This left **126,406 genuinely untranslated values across 59
locale files**.
The thirty-first 50-value Maithili batch added office and API reporting,
automatic data recovery and MongoDB remediation, swimlane copying, wait
spinners, organization and team safeguards, ticket and request states and card
details. These direct translations were completed with low confidence and
welcome review by a Maithili speaker. This left **126,356 genuinely untranslated
values across 59 locale files**.
The thirty-second 50-value Maithili batch added team invitations, Node memory
diagnostics, organization management, legal notices, checklist transformations
and attachment storage moves. These direct translations were completed with low
confidence and welcome review by a Maithili speaker. This left **126,306
genuinely untranslated values across 59 locale files**.
The thirty-third 50-value Maithili batch added bulk attachment and avatar moves,
storage repair and statistics, default storage, file IDs and MongoDB GridFS
compaction guidance and status. These direct translations were completed with
low confidence and welcome review by a Maithili speaker. This left **126,256
genuinely untranslated values across 59 locale files**.
The thirty-fourth 50-value Maithili batch added board time status, upload
progress and limits, account prompts, custom translations, board dragging,
checklist display, support and accessibility settings. These direct translations
were completed with low confidence and welcome review by a Maithili speaker.
This left **126,206 genuinely untranslated values across 59 locale files**.
The thirty-fifth 50-value Maithili batch added accessibility content,
brute-force login protection and locked-user administration, scheduled jobs,
attachment and avatar paths and scheduled board maintenance. These direct
translations were completed with low confidence and welcome review by a
Maithili speaker. This left **126,156 genuinely untranslated values across 59
locale files**.
The thirty-sixth 50-value Maithili batch added scheduled-job and migration
controls, filesystem, S3 and Azure storage settings, MongoDB and FerretDB
database migration and Sandstorm grain migration status. These direct
translations were completed with low confidence and welcome review by a
Maithili speaker. This left **126,106 genuinely untranslated values across 59
locale files**.
The thirty-seventh 50-value Maithili batch added Sandstorm storage cleanup,
adaptive card loading, safe link and code rendering, import, export, avatar,
activity, notification and watch controls, user anonymization and backups. These
direct translations were completed with low confidence and welcome review by a
Maithili speaker. This left **126,056 genuinely untranslated values across 59
locale files**.
The thirty-eighth 50-value Maithili batch added scheduled backup and restore
settings, Google Cloud Storage credentials and permissions, and detailed AWS
S3, Azure and Google Cloud configuration paths and connection status. These
direct translations were completed with low confidence and welcome review by a
Maithili speaker. This left **126,006 genuinely untranslated values across 59
locale files**.
The thirty-ninth 50-value Maithili batch added Google Cloud Storage and GridFS
attachment controls, migration execution and status, S3 credentials and TLS,
scheduled board operations and attachment and board migration settings. These
direct translations were completed with low confidence and welcome review by a
Maithili speaker. This left **125,956 genuinely untranslated values across 59
locale files**.
The fortieth 50-value Maithili batch added comprehensive board integrity
migrations for duplicate lists, lost and archived items, missing lists, avatar
and attachment URLs, confirmation dialogs, progress and individual repair
steps. These direct translations were completed with low confidence and welcome
review by a Maithili speaker. This left **125,906 genuinely untranslated values
across 59 locale files**.
The forty-first 50-value Maithili batch added board repair steps, conversion
status, CPU and duration monitoring, scheduled intervals, filesystem and GridFS
statistics, export monitoring and background-job details. These direct
translations were completed with low confidence and welcome review by a
Maithili speaker. This left **125,856 genuinely untranslated values across 59
locale files**.
The forty-second 50-value Maithili batch added attachment migration targets,
batch, CPU and delay controls, migration logs and lifecycle, monitoring and
pagination controls, schedules, system resources and aggregate statistics.
These direct translations were completed with low confidence and welcome review
by a Maithili speaker. This left **125,806 genuinely untranslated values across
59 locale files**.
The forty-third 50-value Maithili batch added repository accounts and uploads,
OTP and login errors, problem status and acknowledgement, broken-card repair,
CPU load and event details. These direct translations were completed with low
confidence and welcome review by a Maithili speaker. This left **125,756
genuinely untranslated values across 59 locale files**.
The final 17-value Maithili batch added IP event details, filesystem integrity,
scoped WeKan imports and exports, numeric global search and import choices. It
also replaced one Latin-only API label exposed by the script audit. These direct
translations were completed with low confidence and welcome review by a
Maithili speaker. This completed Maithili and left **125,739 genuinely
untranslated values across 58 locale files**.
The first 50-value Malagasy batch added board membership rules, replies and due
dates, and detailed activity messages for attachments, subtasks, labels,
checklists, comments, custom fields, members, archives and imports. These direct
translations were completed with low confidence and welcome review by a
Malagasy speaker. This left **125,689 genuinely untranslated values across 58
locale files**.
The second 50-value Malagasy batch added card movement and restoration,
parameterized activity messages, checklist events, received and start dates and
workspace navigation and settings. These direct translations were completed
with low confidence and welcome review by a Malagasy speaker. This left
**125,639 genuinely untranslated values across 58 locale files**.
The third 50-value Malagasy batch added workspace deletion, multi-board
selection and Home boards, due and end dates, templates, list widths, keyboard
shortcuts, swimlane heights, subtasks, checklists, covers, labels and members.
These direct translations were completed with low confidence and welcome review
by a Malagasy speaker. This left **125,589 genuinely untranslated values across
58 locale files**.
The fourth 50-value Malagasy batch added administrator roles and announcements,
public boards, offline recovery, board, list and swimlane archives, templates,
attachments, backgrounds and All Boards member and assignee settings. These
direct translations were completed with low confidence and welcome review by a
Malagasy speaker. This left **125,539 genuinely untranslated values across 58
locale files**.
The fifth 50-value Malagasy batch added public-board guidance, board movement
between workspaces, appearance and views, zoom and calendars, permanent card
deletion, archives, dates, time and card attachment, field, label and member
editing. These direct translations were completed with low confidence and
welcome review by a Malagasy speaker. This left **125,489 genuinely untranslated
values across 58 locale files**.
The sixth 50-value Malagasy batch added card members and dates, voting and
Planning Poker, dependencies, organizations, teams, avatars, backgrounds,
duplicate lists, accounts, domains, imported-member mapping and checklist,
swimlane, list, card and board imports. These direct translations were completed
with low confidence and welcome review by a Malagasy speaker. This left
**125,439 genuinely untranslated values across 58 locale files**.
The seventh 50-value Malagasy batch added member and restoration dialogs, rule
exchange, bookmarks, templates, CAS, linked cards and boards, imported-member
mapping, themes, fonts, text colors, avatars, languages and permissions. These
direct translations were completed with low confidence and welcome review by a
Malagasy speaker. This left **125,389 genuinely untranslated values across 58
locale files**.
The eighth 50-value Malagasy batch added starring, automatic list widths,
clipboard actions, card aging, keyboard movement, accessible dialog controls,
board restoration and most of the board color palette. These direct
translations were completed with low confidence and welcome review by a
Malagasy speaker. This left **125,339 genuinely untranslated values across 58
locale files**.
The ninth 50-value Malagasy batch completed the board color palette and added
comment and read-only roles, worker permissions, subtask and checklist deletion,
clipboard links, bulk card JSON, templates, labels and custom-field types and
options. These direct translations were completed with low confidence and
welcome review by a Malagasy speaker. This left **125,289 genuinely untranslated
values across 58 locale files**.
The tenth 50-value Malagasy batch added custom text and date formats, permanent
deletion, label and member disambiguation, WIP controls, card dates and time,
profiles, localized account email templates, scrolling and board, JSON, CSV,
TSV, import, linked-card and user errors. These direct translations were
completed with low confidence and welcome review by a Malagasy speaker. This
left **125,239 genuinely untranslated values across 58 locale files**.
The eleventh 50-value Malagasy batch added user, organization, team and email
validation, card PDF and Excel exports and attachment metadata, list sorting and
date, label and member filters. These direct translations were completed with
low confidence and welcome review by a Malagasy speaker. This left **125,189
genuinely untranslated values across 58 locale files**.
The twelfth 50-value Malagasy batch added assignee, custom-field and archive
filters, advanced filter syntax, member states and impersonation, Kanboard,
NextCloud Deck, OpenProject, Asana, ZenKit, Trello, Jira, Excel and WeKan board
imports and safe Trello ZIP handling. These direct translations were completed
with low confidence and welcome review by a Malagasy speaker. This left
**125,139 genuinely untranslated values across 58 locale files**.
The thirteenth 50-value Malagasy batch added Trello ZIP path safeguards,
workspace placement, direct API imports, cancellable and resumable import jobs,
member mapping, version and validation labels, invitations, keyboard shortcuts
and labels. These direct translations were completed with low confidence and
welcome review by a Malagasy speaker. This left **125,089 genuinely untranslated
values across 58 locale files**.
The fourteenth 50-value Malagasy batch added board leaving, list archive and
bulk-card actions, user, team and organization settings, Trello and Excel
imports, list deletion, navigation, multi-selection, notification muting,
archives and normal roles. These direct translations were completed with low
confidence and welcome review by a Malagasy speaker. This left **125,039
genuinely untranslated values across 58 locale files**.
The fifteenth 50-value Malagasy batch added watched updates, private-page login,
image previews, board visibility, quick access, member removal and Sandstorm
guidance, unsaved-description rescue, search, WIP limits, keyboard shortcuts,
sidebars, signup and starred and default-board controls. These direct
translations were completed with low confidence and welcome review by a
Malagasy speaker. This left **124,989 genuinely untranslated values across 58
locale files**.
The sixteenth 50-value Malagasy batch added starred boards and subscriptions,
spent time and overtime, numbered assignee and label shortcuts, tracking,
uploads, custom logos and URL schemes, username imports, watching, welcome and
template boards and WIP limit errors. These direct translations were completed
with low confidence and welcome review by a Malagasy speaker. This left
**124,939 genuinely untranslated values across 58 locale files**.
The seventeenth 50-value Malagasy batch added attachment and API transfer
limits, avatar upload blocking, registration and invitations, SMTP and TLS
settings and test mail, localized registration email, authorization, webhooks,
packages, database and Node and Meteor versions. These direct translations were
completed with low confidence and welcome review by a Malagasy speaker. This
left **124,889 genuinely untranslated values across 58 locale files**.
The eighteenth 50-value Malagasy batch added database and FerretDB identity,
reactivity and DDP configuration, operating-system diagnostics, time units,
custom-field display, account changes, visibility and organization and team
tenancy, domain, administration and synchronization settings. These direct
translations were completed with low confidence and welcome review by a
Malagasy speaker. This left **124,839 genuinely untranslated values across 58
locale files**.
The nineteenth 50-value Malagasy batch added received and end dates, colors,
assignment metadata, card sorting, permanent board and notification deletion,
duplicate-list cleanup, subtask and card settings, minicard fields, attachment
and checklist counts, parent paths and label activity. These direct translations
were completed with low confidence and welcome review by a Malagasy speaker.
This left **124,789 genuinely untranslated values across 58 locale files**.
The twentieth 50-value Malagasy batch added label, attachment and custom-field
activity, visual rule editing, card, label, member, checklist, attachment and
schedule triggers and JSON, CSV and Trello Butler rule exchange. These direct
translations were completed with low confidence and welcome review by a
Malagasy speaker. This left **124,739 genuinely untranslated values across 58
locale files**.
The twenty-first 50-value Malagasy batch added n8n and Node-RED workflow
imports, scheduled and button triggers, due-date and list-duration conditions,
card and board buttons, list sorting, completion and movement actions, relative
dates and rule phrase units. These direct translations were completed with low
confidence and welcome review by a Malagasy speaker. This left **124,689
genuinely untranslated values across 58 locale files**.
The twenty-second 50-value Malagasy batch added rule phrases for boards, lists,
cards, labels, members, attachments, checklists and items, archive and movement
states, color, member and checklist actions, email and detailed top and bottom
card moves. These direct translations were completed with low confidence and
welcome review by a Malagasy speaker. This left **124,639 genuinely untranslated
values across 58 locale files**.
The twenty-third 50-value Malagasy batch added detailed rule actions for email,
archive, labels, members, checklists, cards, swimlanes and relative dates,
authentication, product naming, custom head HTML, web manifests,
`assetlinks.json`, layout and card counters. These direct translations were
completed with low confidence and welcome review by a Malagasy speaker. This
left **124,589 genuinely untranslated values across 58 locale files**.
The twenty-fourth 50-value Malagasy batch added custom body HTML, authentication
and OIDC controls, board duplication, organization, team and person counts,
swimlane deletion, card placement, due-date activity and reminders, account,
team and organization deletion and editor and layout controls. These direct
translations were completed with low confidence and welcome review by a
Malagasy speaker. This left **124,539 genuinely untranslated values across 58
locale files**.
The twenty-fifth 50-value Malagasy batch added multi-card windows, editor
shortcuts, card and minicard fields, organization, team and user dialogs,
notification states, rename and board-role controls, weekdays, status,
ownership, activity and voting. These direct translations were completed with
low confidence and welcome review by a Malagasy speaker. This left **124,489
genuinely untranslated values across 58 locale files**.
The twenty-sixth 50-value Malagasy batch added linked-list safeguards, tasks,
domains, shared templates, names, people and time units, My Cards and Due Cards
views and sorting, global-search scope and board, swimlane, list and label lookup
errors. These direct translations were completed with low confidence and
welcome review by a Malagasy speaker. This left **124,439 genuinely untranslated
values across 58 locale files**.
The twenty-seventh 50-value Malagasy batch added user, comment, organization and
team lookup errors, card-search result counts and global-search operators and
predicates for boards, swimlanes, lists, users, dates, content, status and time
ranges. These direct translations were completed with low confidence and
welcome review by a Malagasy speaker. This left **124,389 genuinely untranslated
values across 58 locale files**.
The twenty-eighth 50-value Malagasy batch added remaining search predicates,
operator validation, pagination and comprehensive global-search instructions
for scopes, users, organizations, teams, dates, statuses, field existence,
sorting, limits and combined conditions. These direct translations were
completed with low confidence and welcome review by a Malagasy speaker. This
left **124,339 genuinely untranslated values across 58 locale files**.
The twenty-ninth 50-value Malagasy batch added board and card sorting,
completion, stickers, dependency relationships and JSON and SVG imports, board
backgrounds, upload limits and card locations. These direct translations were
completed with low confidence and welcome review by a Malagasy speaker. This
left **124,289 genuinely untranslated values across 58 locale files**.
The thirtieth 50-value Malagasy batch added map detection, server
troubleshooting, sorting, board activity, string templates, file diagnostics,
security, speed, test, CPU, database, rule, board, card, impersonation, recovery
and office reports. These direct translations were completed with low confidence
and welcome review by a Malagasy speaker. This left **124,239 genuinely
untranslated values across 58 locale files**.
The thirty-first 50-value Malagasy batch added office and REST API reporting,
automatic data recovery and MongoDB remediation, swimlane copying, wait
spinners, organization and team safeguards, mail copies, ticket and request
states, sorting and card details. These direct translations were completed with
low confidence and welcome review by a Malagasy speaker. This left **124,189
genuinely untranslated values across 58 locale files**.
The thirty-second 50-value Malagasy batch added team invitations, Node memory
diagnostics, organization management, legal notices, checklist transformations
and attachment storage moves. These direct translations were completed with low
confidence and welcome review by a Malagasy speaker. This left **124,139
genuinely untranslated values across 58 locale files**.
The thirty-third 50-value Malagasy batch added bulk attachment and avatar moves,
storage repair and statistics, default storage, file IDs and MongoDB GridFS
compaction guidance and status. These direct translations were completed with
low confidence and welcome review by a Malagasy speaker. This left **124,089
genuinely untranslated values across 58 locale files**.
The thirty-fourth 50-value Malagasy batch added board time status, upload
progress and limits, account prompts, custom translations, board dragging,
checklist display, support and accessibility settings. These direct translations
were completed with low confidence and welcome review by a Malagasy speaker.
This left **124,039 genuinely untranslated values across 58 locale files**.
The thirty-fifth 50-value Malagasy batch added accessibility content,
brute-force login protection and locked-user administration, scheduled jobs,
attachment and avatar paths and scheduled board maintenance. These direct
translations were completed with low confidence and welcome review by a
Malagasy speaker. This left **123,989 genuinely untranslated values across 58
locale files**.
The thirty-sixth 50-value Malagasy batch added scheduled-job and migration
controls, filesystem, S3 and Azure storage, MongoDB and FerretDB migration and
Sandstorm migration status. These direct translations were completed with low
confidence and welcome review by a Malagasy speaker. This left **123,939
genuinely untranslated values across 58 locale files**.
The thirty-seventh 50-value Malagasy batch added Sandstorm storage cleanup,
card-loading performance, safe rich-text rendering, import, export, avatar,
activity, notification and watch controls and scoped cloud backups. These direct
translations were completed with low confidence and welcome review by a
Malagasy speaker. This left **123,889 genuinely untranslated values across 58
locale files**.
The thirty-eighth 50-value Malagasy batch added scheduled backups, restore
modes, Google Cloud credentials and permissions, detailed AWS S3, Azure and
Google Cloud setup paths, connection tests and Azure attachment storage. These
direct translations were completed with low confidence and welcome review by a
Malagasy speaker. This left **123,839 genuinely untranslated values across 58
locale files**.
The thirty-ninth 50-value Malagasy batch added Google Cloud and GridFS storage,
migration lifecycle controls, CollectionFS movement, S3 authentication and TLS,
scheduled board operations, writable paths and attachment monitoring. These
direct translations were completed with low confidence and welcome review by a
Malagasy speaker. This left **123,789 genuinely untranslated values across 58
locale files**.
The fortieth 50-value Malagasy batch added comprehensive board repairs,
duplicate-list cleanup, lost-card and archive recovery, missing-list and file
URL fixes, migration confirmations, progress and structure-repair steps. These
direct translations were completed with low confidence and welcome review by a
Malagasy speaker. This left **123,739 genuinely untranslated values across 58
locale files**.
The forty-first 50-value Malagasy batch added migration repair steps, board
conversion, CPU and filesystem metrics, schedules, GridFS monitoring and job
queue details. These direct translations were completed with low confidence and
welcome review by a Malagasy speaker. This left **123,689 genuinely untranslated
values across 58 locale files**.
The forty-second 50-value Malagasy batch added attachment migration targets,
batch and resource thresholds, background processing, monitoring, schedules,
progress and storage statistics. These direct translations were completed with
low confidence and welcome review by a Malagasy speaker. This left **123,639
genuinely untranslated values across 58 locale files**.
The forty-third 50-value Malagasy batch added repositories, account access,
problem reporting, broken-card repair and CPU and event metrics. These direct
translations were completed with low confidence and welcome review by a
Malagasy speaker. This left **123,589 genuinely untranslated values across 58
locale files**.
The final 17-value Malagasy batch added IP event details, filesystem integrity,
scoped WeKan imports and exports, numeric global search and import choices. These
direct translations were completed with low confidence and welcome review by a
Malagasy speaker. This completed Malagasy and left **123,572 genuinely
untranslated values across 57 locale files**.
The first 50-value Māori batch added board membership rules, replies and due
dates, and detailed activity messages for attachments, subtasks, labels,
checklists, comments, custom fields, members, archives and imports. These direct
translations were completed with low confidence and welcome review by a Māori
speaker. This left **123,522 genuinely untranslated values across 57 locale
files**.
The second 50-value Māori batch added card movement and restoration,
parameterized activity messages, checklist events, received and start dates and
workspace navigation and settings. These direct translations were completed
with low confidence and welcome review by a Māori speaker. This left **123,472
genuinely untranslated values across 57 locale files**.
The third 50-value Māori batch added workspace deletion, multi-board selection
and Home boards, due and end dates, templates, list widths, keyboard shortcuts,
swimlane heights, subtasks, checklists, covers, labels and members. These direct
translations were completed with low confidence and welcome review by a Māori
speaker. This left **123,422 genuinely untranslated values across 57 locale
files**.
The fourth 50-value Māori batch added administrator roles and announcements,
public boards, offline recovery, board, list and swimlane archives, templates,
attachments, backgrounds and All Boards member and assignee settings. These
direct translations were completed with low confidence and welcome review by a
Māori speaker. This left **123,372 genuinely untranslated values across 57
locale files**.
The fifth 50-value Māori batch added public-board guidance, board movement
between workspaces, appearance and views, zoom and calendars, permanent card
deletion, archives, dates, time and card attachment, field, label and member
editing. These direct translations were completed with low confidence and
welcome review by a Māori speaker. This left **123,322 genuinely untranslated
values across 57 locale files**.
The sixth 50-value Māori batch added card members and dates, voting and Planning
Poker, dependencies, organizations, teams, avatars, backgrounds, duplicate
lists, accounts, domains, imported-member mapping and checklist, swimlane, list,
card and board imports. These direct translations were completed with low
confidence and welcome review by a Māori speaker. This left **123,272 genuinely
untranslated values across 57 locale files**.
The seventh 50-value Māori batch added member and restoration dialogs, rule
exchange, bookmarks, templates, CAS, linked cards and boards, imported-member
mapping, themes, fonts, text colors, avatars, languages and permissions. These
direct translations were completed with low confidence and welcome review by a
Māori speaker. This left **123,222 genuinely untranslated values across 57
locale files**.
The eighth 50-value Māori batch added starring, automatic list widths,
clipboard actions, card aging, keyboard movement, accessible dialog controls,
board restoration and most of the board color palette. These direct
translations were completed with low confidence and welcome review by a Māori
speaker. This left **123,172 genuinely untranslated values across 57 locale
files**.
The ninth 50-value Māori batch completed the board color palette and added
comment and read-only roles, worker permissions, subtask and checklist deletion,
clipboard links, bulk card JSON, templates, labels and custom-field types and
options. These direct translations were completed with low confidence and
welcome review by a Māori speaker. This left **123,122 genuinely untranslated
values across 57 locale files**.
The tenth 50-value Māori batch added custom text and date formats, permanent
deletion, label and member disambiguation, WIP controls, card dates and time,
profiles, localized account email templates, scrolling and board, JSON, CSV,
TSV, import, linked-card and user errors. These direct translations were
completed with low confidence and welcome review by a Māori speaker. This left
**123,072 genuinely untranslated values across 57 locale files**.
The eleventh 50-value Māori batch added user, organization, team and email
validation, card PDF and Excel exports and attachment metadata, list sorting and
date, label and member filters. These direct translations were completed with
low confidence and welcome review by a Māori speaker. This left **123,022
genuinely untranslated values across 57 locale files**.
The twelfth 50-value Māori batch added assignee, custom-field and archive
filters, advanced filter syntax, member states and impersonation, Kanboard,
NextCloud Deck, OpenProject, Asana, ZenKit, Trello, Jira, Excel and WeKan board
imports and safe Trello ZIP handling. These direct translations were completed
with low confidence and welcome review by a Māori speaker. This left **122,972
genuinely untranslated values across 57 locale files**.
The thirteenth 50-value Māori batch added Trello ZIP path safeguards,
workspace placement, direct API imports, cancellable and resumable import jobs,
member mapping, version and validation labels, invitations, keyboard shortcuts
and labels. These direct translations were completed with low confidence and
welcome review by a Māori speaker. This left **122,922 genuinely untranslated
values across 57 locale files**.
The fourteenth 50-value Māori batch added board leaving, list archive and
bulk-card actions, user, team and organization settings, Trello and Excel
imports, list deletion, navigation, multi-selection, notification muting,
archives and normal roles. These direct translations were completed with low
confidence and welcome review by a Māori speaker. This left **122,872 genuinely
untranslated values across 57 locale files**.
The fifteenth 50-value Māori batch added watched updates, private-page login,
image previews, board visibility, quick access, member removal and Sandstorm
guidance, unsaved-description rescue, search, WIP limits, keyboard shortcuts,
sidebars, signup and starred and default-board controls. These direct
translations were completed with low confidence and welcome review by a Māori
speaker. This left **122,822 genuinely untranslated values across 57 locale
files**.
The sixteenth 50-value Māori batch added starred boards and subscriptions,
spent time and overtime, numbered assignee and label shortcuts, tracking,
uploads, custom logos and URL schemes, username imports, watching, welcome and
template boards and WIP limit errors. These direct translations were completed
with low confidence and welcome review by a Māori speaker. This left **122,772
genuinely untranslated values across 57 locale files**.
The seventeenth 50-value Māori batch added attachment and API transfer limits,
avatar upload blocking, registration and invitations, SMTP and TLS settings and
test mail, localized registration email, authorization, webhooks, packages,
database and Node and Meteor versions. These direct translations were completed
with low confidence and welcome review by a Māori speaker. This left **122,722
genuinely untranslated values across 57 locale files**.
The eighteenth 50-value Māori batch added database and FerretDB identity,
reactivity and DDP configuration, operating-system diagnostics, time units,
custom-field display, account changes, visibility and organization and team
tenancy, domain, administration and synchronization settings. These direct
translations were completed with low confidence and welcome review by a Māori
speaker. This left **122,672 genuinely untranslated values across 57 locale
files**.
The nineteenth 50-value Māori batch added received and end dates, colors,
assignment metadata, card sorting, permanent board and notification deletion,
duplicate-list cleanup, subtask and card settings, minicard fields, attachment
and checklist counts, parent paths and label activity. These direct translations
were completed with low confidence and welcome review by a Māori speaker. This
left **122,622 genuinely untranslated values across 57 locale files**.
The twentieth 50-value Māori batch added label, attachment and custom-field
activity, visual rule editing, card, label, member, checklist, attachment and
schedule triggers and JSON, CSV and Trello Butler rule exchange. These direct
translations were completed with low confidence and welcome review by a Māori
speaker. This left **122,572 genuinely untranslated values across 57 locale
files**.
The twenty-first 50-value Māori batch added n8n and Node-RED workflow imports,
scheduled and button triggers, due-date and list-duration conditions, card and
board buttons, list sorting, completion and movement actions, relative dates and
rule phrase units. These direct translations were completed with low confidence
and welcome review by a Māori speaker. This left **122,522 genuinely
untranslated values across 57 locale files**.
The twenty-second 50-value Māori batch added rule phrases for boards, lists,
cards, labels, members, attachments, checklists and items, archive and movement
states, color, member and checklist actions, email and detailed top and bottom
card moves. These direct translations were completed with low confidence and
welcome review by a Māori speaker. This left **122,472 genuinely untranslated
values across 57 locale files**.
The twenty-third 50-value Māori batch added detailed rule actions for email,
archive, labels, members, checklists, cards, swimlanes and relative dates,
authentication, product naming, custom head HTML, web manifests,
`assetlinks.json`, layout and card counters. These direct translations were
completed with low confidence and welcome review by a Māori speaker. This left
**122,422 genuinely untranslated values across 57 locale files**.
The twenty-fourth 50-value Māori batch added custom body HTML, authentication
and OIDC controls, board duplication, organization, team and person counts,
swimlane deletion, card placement, due-date activity and reminders, account,
team and organization deletion and editor and layout controls. These direct
translations were completed with low confidence and welcome review by a Māori
speaker. This left **122,372 genuinely untranslated values across 57 locale
files**.
The twenty-fifth 50-value Māori batch added multi-card windows, editor
shortcuts, card and minicard fields, organization, team and user dialogs,
notification states, rename and board-role controls, weekdays, status,
ownership, activity and voting. These direct translations were completed with
low confidence and welcome review by a Māori speaker. This left **122,322
genuinely untranslated values across 57 locale files**.
The twenty-sixth 50-value Māori batch added linked-list safeguards, tasks,
domains, shared templates, names, people and time units, My Cards and Due Cards
views and sorting, global-search scope and board, swimlane, list and label lookup
errors. These direct translations were completed with low confidence and
welcome review by a Māori speaker. This left **122,272 genuinely untranslated
values across 57 locale files**.
The twenty-seventh 50-value Māori batch added user, comment, organization and
team lookup errors, card-search result counts and global-search operators and
predicates for boards, swimlanes, lists, users, dates, content, status and time
ranges. These direct translations were completed with low confidence and
welcome review by a Māori speaker. This left **122,222 genuinely untranslated
values across 57 locale files**.
The twenty-eighth 50-value Māori batch added remaining search predicates,
operator validation, pagination and comprehensive global-search instructions
for scopes, users, organizations, teams, dates, statuses, field existence,
sorting, limits and combined conditions. These direct translations were
completed with low confidence and welcome review by a Māori speaker. This left
**122,172 genuinely untranslated values across 57 locale files**.
The twenty-ninth 50-value Māori batch added board and card sorting, completion,
stickers, dependency relationships and imports, board backgrounds and card
locations. These direct translations were completed with low confidence and
welcome review by a Māori speaker. This left **122,122 genuinely untranslated
values across 57 locale files**.
The thirtieth 50-value Māori batch added map coordinates and detection, server
troubleshooting, activity visibility, swimlane movement, string templates and
file, security, speed, test, CPU, database, rule, board, card, impersonation,
recovery and office reports. These direct translations were completed with low
confidence and welcome review by a Māori speaker. This left **122,072 genuinely
untranslated values across 57 locale files**.
The thirty-first 50-value Māori batch added office, API and recovery report
details, recovery maintenance, swimlane copying, wait animations,
organization and team deletion safeguards and support-ticket states. These
direct translations were completed with low confidence and welcome review by a
Māori speaker. This left **122,022 genuinely untranslated values across 57
locale files**.
The thirty-second 50-value Māori batch added team and organization management,
Node heap and memory diagnostics, legal notices, checklist conversion and
movement, subtask and attachment actions and filesystem, GridFS and S3 storage
movement. These direct translations were completed with low confidence and
welcome review by a Māori speaker. This left **121,972 genuinely untranslated
values across 57 locale files**.
The thirty-third 50-value Māori batch added bulk attachment migration,
file-location repair, storage selection and statistics, file identifiers and
MongoDB Compact guidance and progress. These direct translations were completed
with low confidence and welcome review by a Māori speaker. This left **121,922
genuinely untranslated values across 57 locale files**.
The thirty-fourth 50-value Māori batch added board status and transfer progress,
upload and avatar limits, board dragging, custom translations, checklist
display, support and accessibility. These direct translations were completed
with low confidence and welcome review by a Māori speaker. This left **121,872
genuinely untranslated values across 57 locale files**.
The thirty-fifth 50-value Māori batch added accessibility content, brute-force
lockout policy and unlock actions, active-user filtering, scheduled jobs,
attachment paths and scheduled board operations. These direct translations were
completed with low confidence and welcome review by a Māori speaker. This left
**121,822 genuinely untranslated values across 57 locale files**.
The thirty-sixth 50-value Māori batch added scheduled-job and migration
controls, filesystem, S3 and Azure storage, MongoDB and FerretDB migration and
Sandstorm migration status. These direct translations were completed with low
confidence and welcome review by a Māori speaker. This left **121,772 genuinely
untranslated values across 57 locale files**.
The thirty-seventh 50-value Māori batch added Sandstorm cleanup, lazy card
loading, secure text rendering, import and export restrictions, user
anonymization, activity, notification and watch controls and scoped backups.
These direct translations were completed with low confidence and welcome review
by a Māori speaker. This left **121,722 genuinely untranslated values across 57
locale files**.
The thirty-eighth 50-value Māori batch added backup scheduling and restoration,
Google Cloud service accounts, S3, Azure and GCS credential guidance, console
navigation, connection testing and Azure attachment storage. These direct
translations were completed with low confidence and welcome review by a Māori
speaker. This left **121,672 genuinely untranslated values across 57 locale
files**.
The thirty-ninth 50-value Māori batch added Google Cloud and GridFS storage,
migration lifecycle controls, CollectionFS guidance, S3 credentials and TLS,
scheduled board operations, writable paths and attachment and board migration
settings. These direct translations were completed with low confidence and
welcome review by a Māori speaker. This left **121,622 genuinely untranslated
values across 57 locale files**.
The fortieth 50-value Māori batch added board-integrity migrations for duplicate
lists, lost cards, archives, missing structures and file and avatar URLs, with
confirmations, progress and individual repair steps. These direct translations
were completed with low confidence and welcome review by a Māori speaker. This
left **121,572 genuinely untranslated values across 57 locale files**.
The forty-first 50-value Māori batch added remaining migration steps, board
conversion, CPU and timing metrics, monitoring, filesystem and GridFS
statistics and job-queue details. These direct translations were completed with
low confidence and welcome review by a Māori speaker. This left **121,522
genuinely untranslated values across 57 locale files**.
The forty-second 50-value Māori batch added migration batching and resource
thresholds, logs, monitoring navigation, attachment totals, storage
distribution and minicard display. These direct translations were completed
with low confidence and welcome review by a Māori speaker. This left **121,472
genuinely untranslated values across 57 locale files**.
The final 67-value Māori batch added account and repository access, problem and
repair reporting, CPU and event metadata, filesystem integrity, scoped import
and export and numeric global search. These direct translations were completed
with low confidence and welcome review by a Māori speaker. This completed Māori
and left **121,405 genuinely untranslated values across 56 locale files**.
The first 50-value Malayalam batch added organization and team membership,
replies, due-date changes and detailed board, swimlane, list, card, attachment,
subtask, label, checklist, comment, custom-field, archive and import activity.
These direct translations were completed with low confidence and welcome review
by a Malayalam speaker. This left **121,355 genuinely untranslated values
across 56 locale files**.
The second 50-value Malayalam batch added card movement and restoration,
parameterized activity, checklist, comment, received-date and start-date events
and workspace navigation and settings. These direct translations were completed
with low confidence and welcome review by a Malayalam speaker. This left
**121,305 genuinely untranslated values across 56 locale files**.
The third 50-value Malayalam batch added workspace deletion, multi-board
selection, Home-board controls, due and end dates, templates, list widths,
keyboard shortcuts, swimlane height, subtasks, checklists, covers, labels and
members. These direct translations were completed with low confidence and
welcome review by a Malayalam speaker. This left **121,255 genuinely
untranslated values across 56 locale files**.
The fourth 50-value Malayalam batch added administrator roles and announcements,
public and offline states, board, list and swimlane archives, templates,
attachments, backgrounds and All Boards member and assignee settings. These
direct translations were completed with low confidence and welcome review by a
Malayalam speaker. This left **121,205 genuinely untranslated values across 56
locale files**.
The fifth 50-value Malayalam batch added public-board guidance, drag-and-drop
workspace assignment, appearance and board views, zoom and calendars, archive
and deletion guidance, dates, time and card attachment, custom-field, label and
member editing. These direct translations were completed with low confidence
and welcome review by a Malayalam speaker. This left **121,155 genuinely
untranslated values across 56 locale files**.
The sixth 50-value Malayalam batch added card members and dates, voting and
Planning Poker, dependencies, organization, team and domain dialogs, avatars,
backgrounds, accounts, imported-member mapping and checklist, swimlane, list,
card and board imports. These direct translations were completed with low
confidence and welcome review by a Malayalam speaker. This left **121,105
genuinely untranslated values across 56 locale files**.
The seventh 50-value Malayalam batch added member and restoration dialogs, rule
exchange, bookmarks, templates, CAS, linked cards and boards, safe
imported-member mapping, themes, fonts, text colors, avatars, language and
permissions. These direct translations were completed with low confidence and
welcome review by a Malayalam speaker. This left **121,055 genuinely
untranslated values across 56 locale files**.
The eighth 50-value Malayalam batch added starring, automatic list widths,
clipboard and drag-and-drop actions, card aging, keyboard movement, accessible
closing and navigation controls and most of the board color palette. These
direct translations were completed with low confidence and welcome review by a
Malayalam speaker. This left **121,005 genuinely untranslated values across 56
locale files**.
The ninth 50-value Malayalam batch completed the initial color palette and added
comment, read-only and worker roles, subtask and checklist deletion, list
movement, clipboard links, bulk-card JSON, templates, labels and custom-field
types. These direct translations were completed with low confidence and welcome
review by a Malayalam speaker. This left **120,955 genuinely untranslated
values across 56 locale files**.
The tenth 50-value Malayalam batch added custom text and date formats, permanent
deletion, WIP and date and time editing, profiles, localized account emails,
scrolling and board, JSON, CSV, TSV, import, linked-card and user errors. These
direct translations were completed with low confidence and welcome review by a
Malayalam speaker. This left **120,905 genuinely untranslated values across 56
locale files**.
The eleventh 50-value Malayalam batch added user, organization, team and email
validation, card PDF and Excel exports and attachment metadata, list sorting
and date, label and member filters. These direct translations were completed
with low confidence and welcome review by a Malayalam speaker. This left
**120,855 genuinely untranslated values across 56 locale files**.
The twelfth 50-value Malayalam batch added assignment and custom-field filters,
activity visibility, imported-member states and detailed board-import guidance
for Kanboard, Deck, OpenProject, issue trackers, Asana, ZenKit, Trello, CSV/TSV,
Jira, Excel and WeKan. It also translated Trello JSON/ZIP validation, progress,
timeout and failure messages. These direct translations were completed with low
confidence and welcome review by a Malayalam speaker. This left **120,805
genuinely untranslated values across 56 locale files**.
The thirteenth 50-value Malayalam batch added Trello API credentials,
workspace and multi-board selection, import progress, cancellation, recovery
and error controls. It also added imported-member mapping, date/time validation,
invitations, keyboard shortcuts and label management. These direct translations
were completed with low confidence and welcome review by a Malayalam speaker.
This left **120,755 genuinely untranslated values across 56 locale files**.
The fourteenth 50-value Malayalam batch added board departure, list archival,
swimlane and organization settings, card/list links, selection movement and
copying, multi-selection, muted watching, archive-empty states, board roles and
participation notifications. These direct translations were completed with low
confidence and welcome review by a Malayalam speaker. This left **120,705
genuinely untranslated values across 56 locale files**.
The fifteenth 50-value Malayalam batch added watching and participation,
private/public page guidance, previews, board-member removal, Sandstorm access,
card-description rescue, board search, WIP limits, keyboard shortcuts, sidebars,
account creation and starred/default-board controls. These direct translations
were completed with low confidence and welcome review by a Malayalam speaker.
This left **120,655 genuinely untranslated values across 56 locale files**.
The sixteenth 50-value Malayalam batch added starred boards, time tracking,
assignee and label shortcuts, uploads, custom branding and URL schemes,
watching, welcome and template boards, and WIP-limit warnings. These direct
translations were completed with low confidence and welcome review by a
Malayalam speaker. This left **120,605 genuinely untranslated values across 56
locale files**.
The seventeenth 50-value Malayalam batch added attachment and API transfer
limits, avatar upload policy, registration and invitations, SMTP setup and test
mail, authorization errors, webhook controls and runtime package, database,
Node and Meteor labels. These direct translations were completed with low
confidence and welcome review by a Malayalam speaker. This left **120,555
genuinely untranslated values across 56 locale files**.
The eighteenth 50-value Malayalam batch added database, FerretDB, reactivity,
DDP, operating-system and time metrics, custom-field display, account changes,
board visibility and organization/team tenancy controls. These direct
translations were completed with low confidence and welcome review by a
Malayalam speaker. This left **120,505 genuinely untranslated values across 56
locale files**.
The nineteenth 50-value Malayalam batch added card received/end dates, colors,
request and assignment labels, permanent deletion safeguards, notification and
duplicate-list cleanup, subtask/card settings, minicard badges and parent-card
display. These direct translations were completed with low confidence and
welcome review by a Malayalam speaker. This left **120,455 genuinely
untranslated values across 56 locale files**.
The twentieth 50-value Malayalam batch added label, attachment and custom-field
activities plus visual rule creation, triggers, workflow/list views, card,
label, member, checklist and attachment events, and JSON, CSV and Trello Butler
rule import/export. These direct translations were completed with low
confidence and welcome review by a Malayalam speaker. This left **120,405
genuinely untranslated values across 56 locale files**.
The twenty-first 50-value Malayalam batch added imported n8n/Node-RED visual
workflows, scheduled and button triggers, due-date events, card/list buttons,
sorting, completion, bulk movement, relative dates and rule time units. These
direct translations were completed with low confidence and welcome review by a
Malayalam speaker. This left **120,355 genuinely untranslated values across 56
locale files**.
The twenty-second 50-value Malayalam batch added visual-rule grammar for card
movement and archives, labels, members, attachments, checklists and items,
colors, list positions and email actions. These direct translations were
completed with low confidence and welcome review by a Malayalam speaker. This
left **120,305 genuinely untranslated values across 56 locale files**.
The twenty-third 50-value Malayalam batch added concrete rule actions,
checklist/swimlane creation, date-field updates and card links, authentication
labels, custom product/head/manifest/assetlinks settings, layout and card
counters. These direct translations were completed with low confidence and
welcome review by a Malayalam speaker. This left **120,255 genuinely
untranslated values across 56 locale files**.
The twenty-fourth 50-value Malayalam batch added member lists, custom body HTML,
authentication display, board duplication, entity counts, swimlane deletion,
card date reminders and placement, account deletion safeguards and resize/input
controls. These direct translations were completed with low confidence and
welcome review by a Malayalam speaker. This left **120,205 genuinely
untranslated values across 56 locale files**.
The twenty-fifth 50-value Malayalam batch added multi-card and editor behavior,
organization/team/user dialogs, notification management, rename and board-role
permissions, weekdays, status/ownership labels, voting and linked-card deletion
safeguards. These direct translations were completed with low confidence and
welcome review by a Malayalam speaker. This left **120,155 genuinely
untranslated values across 56 locale files**.
The twenty-sixth 50-value Malayalam batch added linked-card safeguards,
checklist display, domain-scoped shared templates, My Cards/Due Cards/global
search views and missing board, swimlane, list and label results. These direct
translations were completed with low confidence and welcome review by a
Malayalam speaker. This left **120,105 genuinely untranslated values across 56
locale files**.
The twenty-seventh 50-value Malayalam batch added missing user, comment,
organization and team results, card-result totals and Malayalam global-search
operators and predicates for boards, members, dates, text, attachments and
checklists. These direct translations were completed with low confidence and
welcome review by a Malayalam speaker. This left **120,055 genuinely
untranslated values across 56 locale files**.
The twenty-eighth 50-value Malayalam batch added search predicate validation,
pagination and complete advanced-search operator, status, existence, sorting,
limit and combination guidance. These direct translations were completed with
low confidence and welcome review by a Malayalam speaker. This left **120,005
genuinely untranslated values across 56 locale files**.
The twenty-ninth 50-value Malayalam batch added card/board sorting, completion,
stickers, card dependencies and JSON/SVG import, board backgrounds and card
locations. These direct translations were completed with low confidence and
welcome review by a Malayalam speaker. This left **119,955 genuinely
untranslated values across 56 locale files**.
The thirtieth 50-value Malayalam batch added map detection, server
troubleshooting, chronological sorting, board activities, custom-field string
templates, file/security/speed/test/database reports and office-login summaries.
These direct translations were completed with low confidence and welcome review
by a Malayalam speaker. This left **119,905 genuinely untranslated values
across 56 locale files**.
The thirty-first 50-value Malayalam batch added Office and REST API reports,
recovery status and maintenance, swimlane copying, wait spinners, card window
size, organization/team deletion safeguards, tickets, requests and status
labels. These direct translations were completed with low confidence and
welcome review by a Malayalam speaker. This left **119,855 genuinely
untranslated values across 56 locale files**.
The thirty-second 50-value Malayalam batch added team/organization invitations,
Node heap and memory metrics, legal notices, checklist actions, subtasks and
attachment movement across filesystem, GridFS and S3 storage. These direct
translations were completed with low confidence and welcome review by a
Malayalam speaker. This left **119,805 genuinely untranslated values across 56
locale files**.
The thirty-third 50-value Malayalam batch added bulk attachment movement,
storage-location repair, default storage, file counts and identifiers, and
MongoDB GridFS compaction guidance and status. These direct translations were
completed with low confidence and welcome review by a Malayalam speaker. This
left **119,755 genuinely untranslated values across 56 locale files**.
The thirty-fourth 50-value Malayalam batch added board status and time summaries,
upload rules, custom translations, checklist display, support and accessibility.
These direct translations were completed with low confidence and welcome review
by a Malayalam speaker. This left **119,705 genuinely untranslated values across
56 locale files**.
The thirty-fifth 50-value Malayalam batch added accessibility copy, brute-force
lockout administration, scheduled jobs, attachment and avatar paths, and board
archive, backup and cleanup scheduling. These direct translations were completed
with low confidence and welcome review by a Malayalam speaker. This left
**119,655 genuinely untranslated values across 56 locale files**.
The thirty-sixth 50-value Malayalam batch added scheduled-job and migration error
recovery, filesystem, S3 and Azure storage settings, database migration, and
Sandstorm migration status. These direct translations were completed with low
confidence and welcome review by a Malayalam speaker. This left **119,605
genuinely untranslated values across 56 locale files**.
The thirty-seventh 50-value Malayalam batch added Sandstorm disk cleanup, card
loading modes, secure plain-text rendering, import/export privacy controls,
activity and notification controls, and backup scope and storage. These direct
translations were completed with low confidence and welcome review by a
Malayalam speaker. This left **119,555 genuinely untranslated values across 56
locale files**.
The thirty-eighth 50-value Malayalam batch added backup schedules and restore
modes, Google Cloud Storage credentials and permissions, cloud-secret handling,
AWS, Azure and GCS setup paths, connection tests and Azure attachment movement.
These direct translations were completed with low confidence and welcome review
by a Malayalam speaker. This left **119,505 genuinely untranslated values across
56 locale files**.
The thirty-ninth 50-value Malayalam batch added GCS attachment movement, GridFS
and CollectionFS settings, migration controls and progress, S3 authentication
and connection settings, scheduled board operations and attachment monitoring.
These direct translations were completed with low confidence and welcome review
by a Malayalam speaker. This left **119,455 genuinely untranslated values across
56 locale files**.
The fortieth 50-value Malayalam batch added comprehensive board repair,
duplicate-list cleanup, lost-card and archived-item restoration, file and avatar
URL repair, migration confirmation and progress, and structural repair steps.
These direct translations were completed with low confidence and welcome review
by a Malayalam speaker. This left **119,405 genuinely untranslated values across
56 locale files**.
The forty-first 50-value Malayalam batch added board-repair steps, conversion
status, CPU and runtime metrics, recurring intervals, export and attachment
monitoring, filesystem and GridFS sizes, board scans and job-queue details. These
direct translations were completed with low confidence and welcome review by a
Malayalam speaker. This left **119,355 genuinely untranslated values across 56
locale files**.
The forty-second 50-value Malayalam batch added bulk storage migrations, batch,
CPU and delay thresholds, migration logs and background status, monitoring
navigation, scheduled operations, minicard display, storage distribution and
system-resource totals. These direct translations were completed with low
confidence and welcome review by a Malayalam speaker. This left **119,305
genuinely untranslated values across 56 locale files**.
The forty-third 50-value Malayalam batch added account and OTP flows,
repositories and API endpoints, login failure handling, problem acknowledgement,
broken-card repair, CPU load and event-log fields. These direct translations were
completed with low confidence and welcome review by a Malayalam speaker. This
left **119,255 genuinely untranslated values across 56 locale files**.
The final 17-value Malayalam batch added event IP fields, filesystem integrity,
scoped export/import, the numbered-card search operator and WeKan import formats.
These direct translations were completed with low confidence and welcome review
by a Malayalam speaker. Malayalam is now complete, leaving **119,238 genuinely
untranslated values across 55 locale files**.
The first 50-value Marathi batch added core activity history for boards, lists,
swimlanes, cards, labels, checklists, comments, attachments, subtasks and custom
fields, plus organization/team membership and due-date wording. These direct
translations were completed with low confidence and welcome review by a Marathi
speaker. This left **119,188 genuinely untranslated values across 55 locale
files**.
The second 50-value Marathi batch added card movement and restoration, concise
activity sentences, checklist activity, received/start dates, and All Boards
workspace creation, editing and settings. These direct translations were
completed with low confidence and welcome review by a Marathi speaker. This left
**119,138 genuinely untranslated values across 55 locale files**.
The third 50-value Marathi batch added workspace deletion, multi-board and Home
board selection, due/end dates, templates, personal and fixed list widths,
keyboard shortcuts, swimlane height, subtasks, checklists, covers, labels and
members. These direct translations were completed with low confidence and
welcome review by a Marathi speaker. This left **119,088 genuinely untranslated
values across 55 locale files**.
The fourth 50-value Marathi batch added administration and announcements,
archives, templates, attachment deletion, automatic watching, board backgrounds,
All Boards display, member and assignee summaries, star counts and private-board
visibility. These direct translations were completed with low confidence and
welcome review by a Marathi speaker. This left **119,038 genuinely untranslated
values across 55 locale files**.
The fifth 50-value Marathi batch added public-board visibility, board opening and
workspace movement, appearance and view modes, zoom, calendar navigation,
archive/delete guidance, due and spent time, and card attachment, field, label
and member editing. These direct translations were completed with low confidence
and welcome review by a Marathi speaker. This left **118,988 genuinely
untranslated values across 55 locale files**.
The sixth 50-value Marathi batch added card membership and dates, voting and
Planning Poker, dependencies, organization/team/domain assignment, avatar and
background administration, account deletion, member mapping, and checklist,
swimlane, list, card and board imports. These direct translations were completed
with low confidence and welcome review by a Marathi speaker. This left **118,938
genuinely untranslated values across 55 locale files**.
The seventh 50-value Marathi batch added member and restoration dialogs, rule
transfer, linked cards/boards, safe imported-member mapping, themes, fonts and
text colors, avatars, language and permission controls. These direct translations
were completed with low confidence and welcome review by a Marathi speaker. This
left **118,888 genuinely untranslated values across 55 locale files**.
The eighth 50-value Marathi batch added starring, automatic list widths,
clipboard/drop input, three-tier card aging, card/list movement, accessible
dialog navigation, board restoration guidance and 23 interface colors. These
direct translations were completed with low confidence and welcome review by a
Marathi speaker. This left **118,838 genuinely untranslated values across 55
locale files**.
The ninth 50-value Marathi batch added remaining colors, comment/read/worker
roles, deletion and swimlane movement confirmations, clipboard actions,
multi-card JSON templates, labels, custom-field creation, currencies, dropdowns
and numbers. These direct translations were completed with low confidence and
welcome review by a Marathi speaker. This left **118,788 genuinely untranslated
values across 55 locale files**.
The tenth 50-value Marathi batch added permanent-delete controls, profile and WIP
settings, dates and notifications, account/invitation/password/verification
emails, scrollbars, role and existence errors, JSON/CSV/TSV validation, empty
imports and linked-card safeguards. These direct translations were completed with
low confidence and welcome review by a Marathi speaker. This left **118,738
genuinely untranslated values across 55 locale files**.
The eleventh 50-value Marathi batch added user/name conflicts, card PDF/Excel
exports and disk-space reporting, people, board, date and attachment export
fields, list sorting, and date, title, label and member filters. These direct
translations were completed with low confidence and welcome review by a Marathi
speaker. This left **118,688 genuinely untranslated values across 55 locale
files**.
The twelfth 50-value Marathi batch added assignee/custom-field filtering,
advanced-filter syntax, activity and imported-member status, and Kanboard, Deck,
OpenProject, issues, Asana, ZenKit, Trello, CSV/TSV, Jira, Excel and WeKan import
guidance, files and failures. These direct translations were completed with low
confidence and welcome review by a Marathi speaker. This left **118,638 genuinely
untranslated values across 55 locale files**.
The thirteenth 50-value Marathi batch added Trello ZIP safety and workspace
placement, direct API imports and credentials, selection, progress, cancellation
and cleanup, imported-member mapping, validity messages, invitations, keyboard
shortcuts and label creation/deletion. These direct translations were completed
with low confidence and welcome review by a Marathi speaker. This left **118,588
genuinely untranslated values across 55 locale files**.
The fourteenth 50-value Marathi batch added last-admin and leave-board safety,
bulk list archive/movement, user, team and organization settings, swimlane and
list imports, login, selection and multi-selection actions, muted watching,
archives, normal roles and participation notifications. These direct translations
were completed with low confidence and welcome review by a Marathi speaker. This
left **118,538 genuinely untranslated values across 55 locale files**.
The fifteenth 50-value Marathi batch added watch notifications, private-page
login, image previews, public/private descriptions, member removal including
Sandstorm access, unsaved-description rescue, search, WIP limits, keyboard
shortcuts, sidebars, signup and default-board behavior. These direct translations
were completed with low confidence and welcome review by a Marathi speaker. This
left **118,488 genuinely untranslated values across 55 locale files**.
The sixteenth 50-value Marathi batch added starring and tracking, spent/overtime
hours, keyboard assignee and label slots, uploads, custom logo/help URLs and URL
schemes, welcome/template boards and lists, archived-card warnings, watching and
WIP-limit errors. These direct translations were completed with low confidence
and welcome review by a Marathi speaker. This left **118,438 genuinely
untranslated values across 55 locale files**.
The seventeenth 50-value Marathi batch added attachment/API transfer limits,
avatar upload blocking, registration and invitations, SMTP/TLS configuration and
tests, invitation emails and authorization, webhook controls, card-title filters,
and database, Node and Meteor labels. These direct translations were completed
with low confidence and welcome review by a Marathi speaker. This left **118,388
genuinely untranslated values across 55 locale files**.
The eighteenth 50-value Marathi batch added database and FerretDB provenance,
reactivity and DDP configuration, operating-system metrics, duration units,
custom-field display, account/board visibility, and organization/team activation,
templates, auth sync, tenancy, domains and scoped administration. These direct
translations were completed with low confidence and welcome review by a Marathi
speaker. This left **118,338 genuinely untranslated values across 55 locale
files**.
The nineteenth 50-value Marathi batch added received/end dates, color and
assignment controls, permanent board/notification/duplicate-list deletion,
subtask and card settings, minicard attachment/checklist display, parent-card
paths and label activity. These direct translations were completed with low
confidence and welcome review by a Marathi speaker. This left **118,288 genuinely
untranslated values across 55 locale files**.
The twentieth 50-value Marathi batch added label, attachment and custom-field
activity, rule creation and workflow/list builders, card/label/member/checklist
and attachment triggers, daily scheduling, received dates, JSON/CSV and Trello
Butler rule transfer, workspaces and all-board scope. These direct translations
were completed with low confidence and welcome review by a Marathi speaker. This
left **118,238 genuinely untranslated values across 55 locale files**.
The twenty-first 50-value Marathi batch added n8n/Node-RED workflow imports,
scheduled and button triggers, one-time/daily/weekday/weekly/monthly schedules,
due and list-age conditions, card/board buttons, sorting, completion, bulk moves,
relative dates and time units. These direct translations were completed with low
confidence and welcome review by a Marathi speaker. This left **118,188 genuinely
untranslated values across 55 locale files**.
The twenty-second 50-value Marathi batch added rule phrases for board/list moves,
archive restoration, label/member/attachment/checklist triggers, checklist item
state, card movement, member removal, colors, checklist actions, email and
generated rule descriptions. These direct translations were completed with low
confidence and welcome review by a Marathi speaker. This left **118,138 genuinely
untranslated values across 55 locale files**.
The twenty-third 50-value Marathi batch added generated email, archive, label,
member and checklist rule actions, card/swimlane creation, checklist item syntax,
date-field changes and card links, authentication, custom product/head/manifest/
assetlinks settings, layout, logo and card counters. These direct translations
were completed with low confidence and welcome review by a Marathi speaker. This
left **118,088 genuinely untranslated values across 55 locale files**.
The twenty-fourth 50-value Marathi batch added member lists, custom body HTML,
authentication/OIDC, board duplication and entity counts, swimlane deletion,
received/start/due/end activity and reminders, card/swimlane/list placement,
account/team/organization deletion and resizable navigation. These direct
translations were completed with low confidence and welcome review by a Marathi
speaker. This left **118,038 genuinely untranslated values across 55 locale
files**.
The twenty-fifth 50-value Marathi batch added multi-card windows, Enter-key
editing, organization/team/user dialogs, notification read state, renaming and
board-role permissions/status, week-start weekdays, ownership/activity status,
voting and linked-card deletion safety. These direct translations were completed
with low confidence and welcome review by a Marathi speaker. This left **117,988
genuinely untranslated values across 55 locale files**.
The twenty-sixth 50-value Marathi batch added linked-list deletion safety,
checklist visibility, tasks, domain validation and user assignment, scoped shared
templates, My Cards and Due Cards views/sorting, global search scope and missing
board/swimlane/list/label diagnostics. These direct translations were completed
with low confidence and welcome review by a Marathi speaker. This left **117,938
genuinely untranslated values across 55 locale files**.
The twenty-seventh 50-value Marathi batch added username/comment/organization/
team diagnostics, paginated search counts, global-search operators for entities,
status, dates, text and fields, and predicates for archive/open state, due ranges,
dates, attachments, descriptions, checklists and assignees. These direct
translations were completed with low confidence and welcome review by a Marathi
speaker. This left **117,888 genuinely untranslated values across 55 locale
files**.
The twenty-eighth 50-value Marathi batch added remaining search predicates,
operator validation and pagination, complete global-search syntax for boards,
lists, swimlanes, text, labels, users, organizations, teams, dates, status,
presence, sorting and limits, plus combination and date-range notes. These direct
translations were completed with low confidence and welcome review by a Marathi
speaker. This left **117,838 genuinely untranslated values across 55 locale
files**.
The twenty-ninth 50-value Marathi batch added label metadata, board/card sorting,
completion and stickers, dependency types, display, filtering and JSON/SVG import,
board-background upload/activation/deletion and card map locations. These direct
translations were completed with low confidence and welcome review by a Marathi
speaker. This left **117,788 genuinely untranslated values across 55 locale
files**.
The thirtieth 50-value Marathi batch added map detection, server troubleshooting,
chronological sorting, board activities, swimlane movement, custom-field string
templates, file/security/speed/test/database reports, problem acknowledgement,
impersonation/recovery and office-login summaries. These direct translations were
completed with low confidence and welcome review by a Marathi speaker. This left
**117,738 genuinely untranslated values across 55 locale files**.
The thirty-first 50-value Marathi batch added office and REST API reports,
recovery status and maintenance, swimlane copying, wait spinners, card window
size, organization/team deletion safeguards, tickets, requests and status
labels. These direct translations were completed with low confidence and welcome
review by a Marathi speaker. This left **117,688 genuinely untranslated values
across 55 locale files**.
The thirty-second 50-value Marathi batch added team/organization invitations,
Node heap and memory metrics, legal notices, checklist actions and text splitting,
subtasks and attachment movement across filesystem, GridFS and S3 storage. These
direct translations were completed with low confidence and welcome review by a
Marathi speaker. This left **117,638 genuinely untranslated values across 55
locale files**.
The thirty-third 50-value Marathi batch added bulk attachment movement,
storage-location repair, default storage, file counts and identifiers, and
MongoDB GridFS compaction guidance and status. These direct translations were
completed with low confidence and welcome review by a Marathi speaker. This left
**117,588 genuinely untranslated values across 55 locale files**.
The thirty-fourth 50-value Marathi batch added board status and time summaries,
upload rules, custom translations, checklist display, support and accessibility.
These direct translations were completed with low confidence and welcome review
by a Marathi speaker. This left **117,538 genuinely untranslated values across 55
locale files**.
The thirty-fifth 50-value Marathi batch added accessibility copy, brute-force
lockout administration, scheduled jobs, attachment and avatar paths, and board
archive, backup and cleanup scheduling. These direct translations were completed
with low confidence and welcome review by a Marathi speaker. This left **117,488
genuinely untranslated values across 55 locale files**.
The thirty-sixth 50-value Marathi batch added scheduled-job and migration error
recovery, filesystem, S3 and Azure storage settings, database migration, and
Sandstorm migration status. These direct translations were completed with low
confidence and welcome review by a Marathi speaker. This left **117,438 genuinely
untranslated values across 55 locale files**.
The thirty-seventh 50-value Marathi batch added Sandstorm disk cleanup, card
loading modes, secure plain-text rendering, import/export privacy controls,
activity and notification controls, and backup scope and storage. These direct
translations were completed with low confidence and welcome review by a Marathi
speaker. This left **117,388 genuinely untranslated values across 55 locale
files**.
The thirty-eighth 50-value Marathi batch added backup schedules and restore
modes, Google Cloud Storage credentials and permissions, cloud-secret handling,
AWS, Azure and GCS setup paths, connection tests and Azure attachment movement.
These direct translations were completed with low confidence and welcome review
by a Marathi speaker. This left **117,338 genuinely untranslated values across 55
locale files**.
The thirty-ninth 50-value Marathi batch added GCS attachment movement, GridFS and
CollectionFS settings, migration controls and progress, S3 authentication and
connection settings, scheduled board operations and attachment monitoring. These
direct translations were completed with low confidence and welcome review by a
Marathi speaker. This left **117,288 genuinely untranslated values across 55
locale files**.
The fortieth 50-value Marathi batch added comprehensive board repair,
duplicate-list cleanup, lost-card and archived-item restoration, file and avatar
URL repair, migration confirmation and progress, and structural repair steps.
These direct translations were completed with low confidence and welcome review
by a Marathi speaker. This left **117,238 genuinely untranslated values across 55
locale files**.
The forty-first 50-value Marathi batch added board-repair steps, conversion
status, CPU and runtime metrics, recurring intervals, export and attachment
monitoring, filesystem and GridFS sizes, board scans and job-queue details. These
direct translations were completed with low confidence and welcome review by a
Marathi speaker. This left **117,188 genuinely untranslated values across 55
locale files**.
The forty-second 50-value Marathi batch added bulk storage migrations, batch,
CPU and delay thresholds, migration logs and background status, monitoring
navigation, scheduled operations, minicard display, storage distribution and
system-resource totals. These direct translations were completed with low
confidence and welcome review by a Marathi speaker. This left **117,138 genuinely
untranslated values across 55 locale files**.
The forty-third 50-value Marathi batch added account and OTP flows, repositories
and API endpoints, login failure handling, problem acknowledgement, broken-card
repair, CPU load and event-log fields. These direct translations were completed
with low confidence and welcome review by a Marathi speaker. This left **117,088
genuinely untranslated values across 55 locale files**.
The final 17-value Marathi batch added event IP fields, filesystem integrity,
scoped export/import, the numbered-card search operator and WeKan import formats.
These direct translations were completed with low confidence and welcome review
by a Marathi speaker. Marathi is now complete, leaving **117,071 genuinely
untranslated values across 54 locale files**.
The first 50-value Burmese batch added organization and team membership rules,
comment and due-date controls, and detailed board, card, list, swimlane,
attachment, label and checklist activity messages. These direct translations
were completed with low confidence and welcome review by a Burmese speaker.
This left **117,021 genuinely untranslated values across 54 locale files**.
The second 50-value Burmese batch added cross-list and cross-board card movement,
compact activity messages, checklist status changes and workspace creation,
editing and navigation. These direct translations were completed with low
confidence and welcome review by a Burmese speaker. This left **116,971
genuinely untranslated values across 54 locale files**.
The third 50-value Burmese batch added workspace deletion and board selection,
Home-board controls, due and end dates, list sizing, keyboard shortcuts,
swimlane height, checklist creation, labels and members. These direct
translations were completed with low confidence and welcome review by a Burmese
speaker. This left **116,921 genuinely untranslated values across 54 locale
files**.
The fourth 50-value Burmese batch added administrator announcements, offline
recovery, archives, templates, attachment deletion, board backgrounds,
All Boards display settings and member and assignee summaries. These direct
translations were completed with low confidence and welcome review by a Burmese
speaker. This left **116,871 genuinely untranslated values across 54 locale
files**.
The fifth 50-value Burmese batch added board visibility and workspace movement,
mobile and desktop views, zoom and calendar controls, archive guidance, card
deletion safety, dates, time, attachments, custom fields, labels and members.
These direct translations were completed with low confidence and welcome review
by a Burmese speaker. This left **116,821 genuinely untranslated values across
54 locale files**.
The sixth 50-value Burmese batch added card members and dates, voting and
Planning Poker, dependencies, board organizations, teams and domains,
background and account deletion, imported-member mapping and checklist, board,
swimlane, list and card imports. These direct translations were completed with
low confidence and welcome review by a Burmese speaker. This left **116,771
genuinely untranslated values across 54 locale files**.
The seventh 50-value Burmese batch added member and template dialogs, archived
item restoration, rule transfer, CAS sign-in, linked cards and boards,
imported-member mapping, themes, fonts, text colors, avatars, language and
permissions. These direct translations were completed with low confidence and
welcome review by a Burmese speaker. This left **116,721 genuinely untranslated
values across 54 locale files**.
The eighth 50-value Burmese batch added subtask and starring controls,
automatic list widths, clipboard input, three-tier card aging, keyboard-friendly
movement and dialog navigation, board closing and 23 color names. These direct
translations were completed with low confidence and welcome review by a Burmese
speaker. This left **116,671 genuinely untranslated values across 54 locale
files**.
The ninth 50-value Burmese batch added the remaining colors, comment and
read-only roles, subtask and checklist deletion, clipboard actions, linked and
bulk-copied cards, template and label creation and custom-field types and
options. These direct translations were completed with low confidence and
welcome review by a Burmese speaker. This left **116,621 genuinely untranslated
values across 54 locale files**.
The tenth 50-value Burmese batch added permanent deletion, WIP limits, dates,
reactions, notifications, account enrollment, invitations, password reset and
email verification, scrolling and detailed board, role, import and linked-card
errors. These direct translations were completed with low confidence and
welcome review by a Burmese speaker. This left **116,571 genuinely untranslated
values across 54 locale files**.
The eleventh 50-value Burmese batch added account and invitation errors,
attachment-free board exports, card PDF and Excel exports with disk-space
diagnostics, list sorting and card, list, date, due-date, label and member
filters. These direct translations were completed with low confidence and
welcome review by a Burmese speaker. This left **116,521 genuinely untranslated
values across 54 locale files**.
The twelfth 50-value Burmese batch added assignee and advanced custom-field
filters, activity visibility, imported-member state, impersonation and detailed
Kanboard, NextCloud Deck, OpenProject, issue, Asana, ZenKit, Trello, CSV/TSV,
Jira, Excel and WeKan board imports. These direct translations were completed
with low confidence and welcome review by a Burmese speaker. This left **116,471
genuinely untranslated values across 54 locale files**.
The thirteenth 50-value Burmese batch added Trello ZIP safety and workspaces,
API-key imports, selection, progress, cancellation and recovery, clipboard and
job states, imported-member mapping, validation, invitations, keyboard
shortcuts and label creation and deletion. These direct translations were
completed with low confidence and welcome review by a Burmese speaker. This
left **116,421 genuinely untranslated values across 54 locale files**.
The fourteenth 50-value Burmese batch added last-administrator protection,
leaving and linking boards, bulk list archiving, user, team and organization
settings, Trello and spreadsheet card imports, list deletion safety, selection
movement, multi-selection, notification muting, archives and restricted Normal
roles. These direct translations were completed with low confidence and welcome
review by a Burmese speaker. This left **116,371 genuinely untranslated values
across 54 locale files**.
The fifteenth 50-value Burmese batch added watched-item notifications, private
page login, previews, public and private board guidance, member removal including
Sandstorm access, description recovery, card search, WIP limits, keyboard
shortcuts, sidebars, signup, starring and default-board controls. These direct
translations were completed with low confidence and welcome review by a Burmese
speaker. This left **116,321 genuinely untranslated values across 54 locale
files**.
The sixteenth 50-value Burmese batch added starred boards, time tracking,
assignee and label shortcuts, uploads, custom branding and URL schemes,
watching, welcome-board content, card, list and board templates and WIP-limit
errors. These direct translations were completed with low confidence and
welcome review by a Burmese speaker. This left **116,271 genuinely untranslated
values across 54 locale files**.
The seventeenth 50-value Burmese batch added attachment and API transfer limits,
avatar-upload controls, registration and invitations, SMTP and TLS settings and
tests, authorization errors, outgoing and bidirectional webhooks and package,
database, Node and Meteor version labels. These direct translations were
completed with low confidence and welcome review by a Burmese speaker. This
left **116,221 genuinely untranslated values across 54 locale files**.
The eighteenth 50-value Burmese batch added database and FerretDB provenance,
Meteor reactivity, DDP transport, operating-system metrics and time units,
custom-field display, account changes, board visibility, organization and team
templates, authentication sync, multitenant domains and organization-admin
boundaries. These direct translations were completed with low confidence and
welcome review by a Burmese speaker. This left **116,171 genuinely untranslated
values across 54 locale files**.
The nineteenth 50-value Burmese batch added card received and end dates, color
selection, assignment attribution, irreversible board and notification deletion,
duplicate-list cleanup, subtask and card settings, minicard descriptions,
attachments, numbering and checklist counts and parent-card paths. These direct
translations were completed with low confidence and welcome review by a Burmese
speaker. This left **116,121 genuinely untranslated values across 54 locale
files**.
The twentieth 50-value Burmese batch added label, attachment and custom-field
activity, board-rule creation, selection and workflow editing, card, label,
member, checklist, attachment and daily triggers and JSON, CSV and Trello Butler
rule transfer. These direct translations were completed with low confidence and
welcome review by a Burmese speaker. This left **116,071 genuinely untranslated
values across 54 locale files**.
The twenty-first 50-value Burmese batch added n8n and Node-RED visual-workflow
imports, scheduled and button triggers, daily, weekday, weekly and monthly
schedules, due-date and list-duration triggers, card and board buttons, list
sorting, completion, bulk movement, relative dates and time units. These direct
translations were completed with low confidence and welcome review by a Burmese
speaker. This left **116,021 genuinely untranslated values across 54 locale
files**.
The twenty-second 50-value Burmese batch added board, list, archive, label,
member, attachment, checklist and item rule phrases and actions for card
movement, restoration, removal, colors, checklist completion and email sending.
These direct translations were completed with low confidence and welcome review
by a Burmese speaker. This left **115,971 genuinely untranslated values across
54 locale files**.
The twenty-third 50-value Burmese batch added rule actions for email, archives,
labels, cards, members, checklists, swimlanes, date fields and linked cards,
authentication labels, custom product names, HTML head tags, web manifests,
assetlinks, layout, logos and card counters. These direct translations were
completed with low confidence and welcome review by a Burmese speaker. This
left **115,921 genuinely untranslated values across 54 locale files**.
The twenty-fourth 50-value Burmese batch added custom body HTML, LDAP and OIDC
authentication, board duplication, organization, team and people totals,
swimlane deletion, card date activity and reminders, selected-item placement,
mentions, account, team and organization deletion, minicard labels, drag handles
and Enter submission. These direct translations were completed with low
confidence and welcome review by a Burmese speaker. This left **115,871
genuinely untranslated values across 54 locale files**.
The twenty-fifth 50-value Burmese batch added multi-card windows, Enter-based
editor behavior, card and minicard detail display, organization, team and user
editing, notification read state, rename and invitation permissions, live board
role capabilities, week-start days, status, ownership, activity and voting.
These direct translations were completed with low confidence and welcome review
by a Burmese speaker. This left **115,821 genuinely untranslated values across
54 locale files**.
The twenty-sixth 50-value Burmese batch added linked-list deletion safety,
checklist hiding, tasks, board domains, shared templates, domain-based users,
My Cards and Due Cards views and sorting, permission-scoped global search and
board, swimlane, list and label not-found errors. These direct translations
were completed with low confidence and welcome review by a Burmese speaker.
This left **115,771 genuinely untranslated values across 54 locale files**.
The twenty-seventh 50-value Burmese batch added user, comment, organization and
team lookup results, card result totals, global-search operators and predicates
for board content, people, dates, status and sorting. These direct translations
were completed with low confidence and welcome review by a Burmese speaker.
This left **115,721 genuinely untranslated values across 54 locale files**.
The twenty-eighth 50-value Burmese batch added search validation errors,
pagination and complete global-search instructions for operators, status,
fields, sorting, limits and Boolean matching. These direct translations were
completed with low confidence and welcome review by a Burmese speaker. This
left **115,671 genuinely untranslated values across 54 locale files**.
The twenty-ninth 50-value Burmese batch added board and card sorting, completion
state, stickers, card dependency relations and imports, board backgrounds and
map locations. These direct translations were completed with low confidence
and welcome review by a Burmese speaker. This left **115,621 genuinely
untranslated values across 54 locale files**.
The thirtieth 50-value Burmese batch added map coordinates and detection,
server-error troubleshooting, sorting, board activity, swimlane movement,
string templates and administration reports for security, performance, data,
impersonation, recovery and login locations. These direct translations were
completed with low confidence and welcome review by a Burmese speaker. This
left **115,571 genuinely untranslated values across 54 locale files**.
The thirty-first 50-value Burmese batch added Office and REST API reporting,
database recovery status, swimlane copying, wait-spinner styles, organization
and team deletion safeguards, support tickets, requests and card details. These
direct translations were completed with low confidence and welcome review by a
Burmese speaker. This left **115,521 genuinely untranslated values across 54
locale files**.
The thirty-second 50-value Burmese batch added team and organization management,
registration invitations, Node.js heap and memory diagnostics, legal notices,
checklist operations and attachment storage migration. These direct
translations were completed with low confidence and welcome review by a Burmese
speaker. This left **115,471 genuinely untranslated values across 54 locale
files**.
The thirty-third 50-value Burmese batch added bulk attachment and avatar
storage migration, location repair, storage statistics, file identifiers and
MongoDB compaction guidance and status. These direct translations were
completed with low confidence and welcome review by a Burmese speaker. This
left **115,421 genuinely untranslated values across 54 locale files**.
The thirty-fourth 50-value Burmese batch added board time status, upload
progress and limits, account and session labels, custom translations, board ZIP
imports, checklist display, support pages and accessibility settings. These
direct translations were completed with low confidence and welcome review by a
Burmese speaker. This left **115,371 genuinely untranslated values across 54
locale files**.
The thirty-fifth 50-value Burmese batch added accessibility content, brute-force
login protection and user unlocking, Admin Panel people filters, scheduled
jobs, attachment paths and scheduled board archive, backup and cleanup results.
These direct translations were completed with low confidence and welcome
review by a Burmese speaker. This left **115,321 genuinely untranslated values
across 54 locale files**.
The thirty-sixth 50-value Burmese batch added scheduled-job and migration
controls, filesystem, S3 and Azure storage settings, MongoDB and FerretDB data
migration and Sandstorm grain migration status. These direct translations were
completed with low confidence and welcome review by a Burmese speaker. This
left **115,271 genuinely untranslated values across 54 locale files**.
The thirty-seventh 50-value Burmese batch added Sandstorm cleanup, automatic
card loading, secure rich-text display, import, export, identity, activity,
notification and watch restrictions and instance or organization backups.
These direct translations were completed with low confidence and welcome
review by a Burmese speaker. This left **115,221 genuinely untranslated values
across 54 locale files**.
The thirty-eighth 50-value Burmese batch added scheduled backup and restore
controls, Google Cloud Storage credentials and permissions, S3, Azure and GCS
setup guidance, cloud-secret state, connection tests and Azure attachment
migration. These direct translations were completed with low confidence and
welcome review by a Burmese speaker. This left **115,171 genuinely untranslated
values across 54 locale files**.
The thirty-ninth 50-value Burmese batch added Google Cloud and GridFS attachment
storage, migration lifecycle controls, S3 credentials and connection settings,
scheduled board operations and attachment and board migration navigation. These
direct translations were completed with low confidence and welcome review by a
Burmese speaker. This left **115,121 genuinely untranslated values across 54
locale files**.
The fortieth 50-value Burmese batch added comprehensive board integrity
migrations for duplicate lists, lost and archived items, missing lists, broken
avatar and attachment URLs and their confirmation and progress states. These
direct translations were completed with low confidence and welcome review by a
Burmese speaker. This left **115,071 genuinely untranslated values across 54
locale files**.
The forty-first 50-value Burmese batch added board repair steps, one-time board
conversion, CPU and filesystem monitoring, recurring intervals, export
monitoring, GridFS statistics and scheduled-job details. These direct
translations were completed with low confidence and welcome review by a Burmese
speaker. This left **115,021 genuinely untranslated values across 54 locale
files**.
The forty-second 50-value Burmese batch added attachment migration tuning,
resource thresholds, migration logs and lifecycle controls, monitoring,
navigation, minicard display and storage and operation totals. These direct
translations were completed with low confidence and welcome review by a Burmese
speaker. This left **114,971 genuinely untranslated values across 54 locale
files**.
The forty-third 50-value Burmese batch added repositories and account creation,
OTP and login validation, problem-report guidance, broken-card repair results,
CPU load and diagnostic event fields. These direct translations were completed
with low confidence and welcome review by a Burmese speaker. This left
**114,921 genuinely untranslated values across 54 locale files**.
The final 17-value Burmese batch added diagnostic event addresses, filesystem
integrity, scoped export and import, numeric global search and supported board
import sources. These direct translations were completed with low confidence
and welcome review by a Burmese speaker. Burmese is now complete. This left
**114,904 genuinely untranslated values across 53 locale files**.
The first 50-value Nahuatl batch added activity messages for title,
description, board, swimlane, list, card, member, label, attachment, subtask,
checklist, custom-field, comment, archive and import changes. These direct
translations were completed with low confidence and welcome review by a Nahuatl
speaker. This left **114,854 genuinely untranslated values across 53 locale
files**.
The second 50-value Nahuatl batch added card movement and membership activity,
general activity phrases, checklist and comment changes, received and start
dates and workspace names, subworkspaces, editing and menus. These direct
translations were completed with low confidence and welcome review by a Nahuatl
speaker. This left **114,804 genuinely untranslated values across 53 locale
files**.
The third 50-value Nahuatl batch added workspace deletion, multi-board
selection and Home boards, due and end dates, templates, card placement,
personal and fixed list widths, keyboard shortcuts, swimlane height, subtasks,
checklists, covers, labels and members. These direct translations were
completed with low confidence and welcome review by a Nahuatl speaker. This
left **114,754 genuinely untranslated values across 53 locale files**.
The fourth 50-value Nahuatl batch added administrator permissions and
announcements, public and archived boards, offline recovery, templates,
attachments, board backgrounds, All Boards display, member and assignee scopes,
stars and private-board information. These direct translations were completed
with low confidence and welcome review by a Nahuatl speaker. This left
**114,704 genuinely untranslated values across 53 locale files**.
The fifth 50-value Nahuatl batch added public-board information, board opening
and workspace assignment, colors, backgrounds, views and zoom, calendar
navigation, archive and deletion guidance, due and spent time and card
attachment, field, label and member editing. These direct translations were
completed with low confidence and welcome review by a Nahuatl speaker. This
left **114,654 genuinely untranslated values across 53 locale files**.
The sixth 50-value Nahuatl batch added card membership and dates, voting and
Planning Poker, estimation, dependencies, organization and team assignment,
avatars, backgrounds, duplicate lists, accounts, domains, imported-member
mapping and board-item imports and exports. These direct translations were
completed with low confidence and welcome review by a Nahuatl speaker. This
left **114,604 genuinely untranslated values across 53 locale files**.
The seventh 50-value Nahuatl batch added member, sticker, sorting, restoration,
rule, shortcut and linked-item dialogs, CAS sign-in, imported-member mapping,
theme categories, fonts, text colors, avatars, language and permissions. These
direct translations were completed with low confidence and welcome review by a
Nahuatl speaker. This left **114,554 genuinely untranslated values across 53
locale files**.
The eighth 50-value Nahuatl batch added settings, subtasks, board and page
stars, automatic list width, clipboard input, three-tier card aging, keyboard
movement, dialog navigation, board and card closing and 23 color names. These
direct translations were completed with low confidence and welcome review by a
Nahuatl speaker. This left **114,504 genuinely untranslated values across 53
locale files**.
The ninth 50-value Nahuatl batch added the final colors, comment and read-only
roles, worker permissions, deletion confirmations, clipboard and link copying,
multi-card JSON templates, labels and checkbox, currency, dropdown and numeric
custom fields. These direct translations were completed with low confidence
and welcome review by a Nahuatl speaker. This left **114,454 genuinely
untranslated values across 53 locale files**.
The tenth 50-value Nahuatl batch added text and date fields, permanent deletion,
profile and WIP settings, card dates and reactions, enrollment, invitation,
password-reset and verification email, scrolling and board, role, JSON, CSV,
import, linked-card and account errors. These direct translations were
completed with low confidence and welcome review by a Nahuatl speaker. This
left **114,404 genuinely untranslated values across 53 locale files**.
The eleventh 50-value Nahuatl batch added account and duplicate-name errors,
card PDF and Excel export fields, attachment metadata and disk-space errors,
list sorting and card and list filters for dates, labels and members. These
direct translations were completed with low confidence and welcome review by a
Nahuatl speaker. This left **114,354 genuinely untranslated values across 53
locale files**.
The twelfth 50-value Nahuatl batch added assignee and custom-field filters,
advanced expression filtering, activity visibility, imported-member states and
board import guidance for Kanboard, Deck, OpenProject, issues, Asana, ZenKit,
Trello, CSV, Jira, Excel and WeKan, including Trello ZIP validation. These
direct translations were completed with low confidence and welcome review by a
Nahuatl speaker. This left **114,304 genuinely untranslated values across 53
locale files**.
The thirteenth 50-value Nahuatl batch added Trello ZIP safety, workspace
placement and direct API imports, saved credentials, board selection, progress,
cancellation and results, imported-member mapping, validation, keyboard
shortcuts and label creation and deletion. These direct translations were
completed with low confidence and welcome review by a Nahuatl speaker. This
left **114,254 genuinely untranslated values across 53 locale files**.
The fourteenth 50-value Nahuatl batch added last-admin protection, leaving
boards, list archiving and movement, user, team and organization settings,
swimlane actions, card imports, list deletion, calendar and login, multi-card
selection, muted boards, archives, normal roles and participation notices.
These direct translations were completed with low confidence and welcome
review by a Nahuatl speaker. This left **114,204 genuinely untranslated values
across 53 locale files**.
The fifteenth 50-value Nahuatl batch added watch notices, private-page login,
image previews, public and private board descriptions, member removal including
Sandstorm guidance, rescue dialogs, search, WIP limits, keyboard shortcuts,
sidebar controls, signup and default-board behavior. These direct translations
were completed with low confidence and welcome review by a Nahuatl speaker.
This left **114,154 genuinely untranslated values across 53 locale files**.
The sixteenth 50-value Nahuatl batch added starred boards, subscriptions,
tracking, spent and overtime status, assignee and label shortcuts, uploads,
custom logo and help links, URL schemes, watching, welcome-board templates and
WIP limit errors. These direct translations were completed with low confidence
and welcome review by a Nahuatl speaker. This left **114,104 genuinely
untranslated values across 53 locale files**.
The seventeenth 50-value Nahuatl batch added attachment and API transfer limits,
avatar upload blocking, registration and invitations, SMTP settings and tests,
invitation email, authorization errors, outgoing, bidirectional and global
webhooks and package, database, Node.js and Meteor labels. These direct
translations were completed with low confidence and welcome review by a Nahuatl
speaker. This left **114,054 genuinely untranslated values across 53 locale
files**.
The eighteenth 50-value Nahuatl batch added database, FerretDB, reactivity, DDP
and operating-system diagnostics, duration units, card-field display, account
changes, board visibility and active organization, team and person settings,
shared templates, authentication sync, multitenancy domains and organization
administrators. These direct translations were completed with low confidence
and welcome review by a Nahuatl speaker. This left **114,004 genuinely
untranslated values across 53 locale files**.
The nineteenth 50-value Nahuatl batch added received and end dates, card, list,
swimlane and selection colors, assignment provenance, board and notification
deletion, duplicate-list cleanup, subtask and card settings, minicard fields,
checklist and attachment counts, parent-card paths and label activity. These
direct translations were completed with low confidence and welcome review by a
Nahuatl speaker. This left **113,954 genuinely untranslated values across 53
locale files**.
The twentieth 50-value Nahuatl batch added label, attachment and custom-field
activity, rule creation and workflow editing, card, label, member, checklist,
attachment, schedule and received-date triggers and JSON, CSV and Trello Butler
rule imports and exports. These direct translations were completed with low
confidence and welcome review by a Nahuatl speaker. This left **113,904
genuinely untranslated values across 53 locale files**.
The twenty-first 50-value Nahuatl batch added n8n and Node-RED workflow imports,
scheduled, due-date, time-in-list and button triggers, list sorting, card
completion, bulk movement, relative dates, duration units and basic rule
trigger and action phrases. These direct translations were completed with low
confidence and welcome review by a Nahuatl speaker. This left **113,854
genuinely untranslated values across 53 locale files**.
The twenty-second 50-value Nahuatl batch added rule conditions for board, list,
card, label, member, attachment, checklist and checklist-item changes and rule
actions for movement, archives, members, colors, checklist state and email.
These direct translations were completed with low confidence and welcome
review by a Nahuatl speaker. This left **113,804 genuinely untranslated values
across 53 locale files**.
The twenty-third 50-value Nahuatl batch added rule actions for email, archives,
labels, cards, members, checklists, swimlanes, date fields and linked cards,
authentication labels, custom product names, HTML head tags, web manifests,
assetlinks, layout, logos and card counters. These direct translations were
completed with low confidence and welcome review by a Nahuatl speaker. This
left **113,754 genuinely untranslated values across 53 locale files**.
The twenty-fourth 50-value Nahuatl batch added custom body HTML, LDAP and OIDC
authentication, board duplication, organization, team and people totals,
swimlane deletion, card date activity and reminders, selected-item placement,
mentions, account, team and organization deletion, minicard labels, drag
handles and Enter submission. These direct translations were completed with
low confidence and welcome review by a Nahuatl speaker. This left **113,704
genuinely untranslated values across 53 locale files**.
The twenty-fifth 50-value Nahuatl batch added multi-card windows, Enter-based
editor behavior, card and minicard detail display, organization, team and user
editing, notification read state, rename and invitation permissions, live board
role capabilities, week-start days, status, ownership, activity and voting.
These direct translations were completed with low confidence and welcome
review by a Nahuatl speaker. This left **113,654 genuinely untranslated values
across 53 locale files**.
The twenty-sixth 50-value Nahuatl batch added linked-list deletion safety,
checklist hiding, tasks, board domains, shared templates, domain-based users,
My Cards and Due Cards views and sorting, permission-scoped global search and
board, swimlane, list and label not-found errors. These direct translations
were completed with low confidence and welcome review by a Nahuatl speaker.
This left **113,604 genuinely untranslated values across 53 locale files**.
The twenty-seventh 50-value Nahuatl batch added user, comment, organization and
team lookup results, card result totals, global-search operators and predicates
for board content, people, dates, status and sorting. These direct translations
were completed with low confidence and welcome review by a Nahuatl speaker.
This left **113,554 genuinely untranslated values across 53 locale files**.
The twenty-eighth 50-value Nahuatl batch added search validation errors,
pagination and complete global-search instructions for operators, status,
fields, sorting, limits and Boolean matching. These direct translations were
completed with low confidence and welcome review by a Nahuatl speaker. This
left **113,504 genuinely untranslated values across 53 locale files**.
The twenty-ninth 50-value Nahuatl batch added board and card sorting, completion
state, stickers, card dependency relations and imports, board backgrounds and
map locations. These direct translations were completed with low confidence
and welcome review by a Nahuatl speaker. This left **113,454 genuinely
untranslated values across 53 locale files**.
The thirtieth 50-value Nahuatl batch added map coordinates and detection,
server-error troubleshooting, board activity and swimlane movement, string
templates and the files, security, performance, test, database, rules, board,
card, impersonation, recovery and office reports. These direct translations
were completed with low confidence and welcome review by a Nahuatl speaker.
This left **113,404 genuinely untranslated values across 53 locale files**.
The thirty-first 50-value Nahuatl batch added Office, REST API and recovery
report details, recovery maintenance, swimlane copying, wait-spinner styles,
card sizing, organization and team deletion warnings and support-ticket status
and requests. These direct translations were completed with low confidence and
welcome review by a Nahuatl speaker. This left **113,354 genuinely untranslated
values across 53 locale files**.
The thirty-second 50-value Nahuatl batch added team and organization management,
invitations, Node heap and memory diagnostics, legal notices, checklist and
subtask actions and filesystem, GridFS and S3 attachment movement. These direct
translations were completed with low confidence and welcome review by a Nahuatl
speaker. This left **113,304 genuinely untranslated values across 53 locale
files**.
The thirty-third 50-value Nahuatl batch added bulk attachment movement between
the filesystem, GridFS and S3, storage-location repair, avatar scope, default
storage, migration progress and file statistics and MongoDB Compact guidance
and results. These direct translations were completed with low confidence and
welcome review by a Nahuatl speaker. This left **113,254 genuinely untranslated
values across 53 locale files**.
The thirty-fourth 50-value Nahuatl batch added board status and time summaries,
upload progress, password confirmation, Mongo sessions, file and avatar upload
limits, PDF fallback, workspace dragging, custom translations, subtasks,
checklist display, support and accessibility pages. These direct translations
were completed with low confidence and welcome review by a Nahuatl speaker.
This left **113,204 genuinely untranslated values across 53 locale files**.
The thirty-fifth 50-value Nahuatl batch added accessibility content, brute-force
lockout settings, known and unknown user controls, locked-user administration,
scheduled jobs, attachment paths and scheduled board archive, backup and
cleanup results. These direct translations were completed with low confidence
and welcome review by a Nahuatl speaker. This left **113,154 genuinely
untranslated values across 53 locale files**.
The thirty-sixth 50-value Nahuatl batch added scheduled-job and migration
controls, filesystem, S3 and Azure storage settings, MongoDB and FerretDB data
migration and Sandstorm grain migration status. These direct translations were
completed with low confidence and welcome review by a Nahuatl speaker. This
left **113,104 genuinely untranslated values across 53 locale files**.
The thirty-seventh 50-value Nahuatl batch added Sandstorm cleanup, automatic
card loading, secure rich-text display, import, export, identity, activity,
notification and watch restrictions and instance or organization backups.
These direct translations were completed with low confidence and welcome
review by a Nahuatl speaker. This left **113,054 genuinely untranslated values
across 53 locale files**.
The thirty-eighth 50-value Nahuatl batch added scheduled backup and restore
controls, Google Cloud Storage credentials and permissions, S3, Azure and GCS
setup guidance, cloud-secret state, connection tests and Azure attachment
migration. These direct translations were completed with low confidence and
welcome review by a Nahuatl speaker. This left **113,004 genuinely untranslated
values across 53 locale files**.
The thirty-ninth 50-value Nahuatl batch added Google Cloud and GridFS attachment
storage, migration lifecycle controls, S3 credentials and connection settings,
scheduled board operations and attachment and board migration navigation. These
direct translations were completed with low confidence and welcome review by a
Nahuatl speaker. This left **112,954 genuinely untranslated values across 53
locale files**.
The fortieth 50-value Nahuatl batch added comprehensive board integrity
migrations for duplicate lists, lost and archived items, missing lists, broken
avatar and attachment URLs and their confirmation and progress states. These
direct translations were completed with low confidence and welcome review by a
Nahuatl speaker. This left **112,904 genuinely untranslated values across 53
locale files**.
The forty-first 50-value Nahuatl batch added board repair steps, one-time board
conversion, CPU and filesystem monitoring, recurring intervals, export
monitoring, GridFS statistics and scheduled-job details. These direct
translations were completed with low confidence and welcome review by a Nahuatl
speaker. This left **112,854 genuinely untranslated values across 53 locale
files**.
The forty-second 50-value Nahuatl batch added attachment migration tuning,
resource thresholds, migration logs and lifecycle controls, monitoring,
navigation, minicard display and storage and operation totals. These direct
translations were completed with low confidence and welcome review by a Nahuatl
speaker. This left **112,804 genuinely untranslated values across 53 locale
files**.
The forty-third 50-value Nahuatl batch added repositories and account creation,
OTP and login validation, problem-report guidance, broken-card repair results,
CPU load and diagnostic event fields. These direct translations were completed
with low confidence and welcome review by a Nahuatl speaker. This left
**112,754 genuinely untranslated values across 53 locale files**.
The final 17-value Nahuatl batch added diagnostic event addresses, filesystem
integrity, scoped export and import, numeric global search and supported board
import sources. These direct translations were completed with low confidence
and welcome review by a Nahuatl speaker. Nahuatl is now complete. This left
**112,737 genuinely untranslated values across 52 locale files**.
The first 50-value Northern Ndebele batch added activity messages for titles,
descriptions, boards, swimlanes, lists, cards, members, labels, attachments,
subtasks, checklists, custom fields, comments, archives and imports. These
direct translations were completed with low confidence and welcome review by a
Northern Ndebele speaker. This left **112,687 genuinely untranslated values
across 52 locale files**.
The second 50-value Northern Ndebele batch added card movement and membership
activity, general activity phrases, checklist and comment changes, received and
start dates and workspace names, subworkspaces, editing and menus. These direct
translations were completed with low confidence and welcome review by a
Northern Ndebele speaker. This left **112,637 genuinely untranslated values
across 52 locale files**.
The third 50-value Northern Ndebele batch added workspace deletion, multi-board
selection and Home boards, due and end dates, templates, card placement,
personal and fixed list widths, keyboard shortcuts, swimlane height, subtasks,
checklists, covers, labels and members. These direct translations were
completed with low confidence and welcome review by a Northern Ndebele speaker.
This left **112,587 genuinely untranslated values across 52 locale files**.
The fourth 50-value Northern Ndebele batch added administrator permissions and
announcements, public and archived boards, offline recovery, templates,
attachments, board backgrounds, All Boards display, member and assignee scopes,
stars and private-board information. These direct translations were completed
with low confidence and welcome review by a Northern Ndebele speaker. This left
**112,537 genuinely untranslated values across 52 locale files**.
The fifth 50-value Northern Ndebele batch added public-board information, board
opening and workspace assignment, backgrounds, views and zoom, calendar
navigation, archive and deletion guidance, due and spent time and card
attachment, field, label and member editing. These direct translations were
completed with low confidence and welcome review by a Northern Ndebele speaker.
This left **112,487 genuinely untranslated values across 52 locale files**.
The sixth 50-value Northern Ndebele batch added card membership and dates,
voting and Planning Poker, estimation, dependencies, organization and team
assignment, avatars, backgrounds, duplicate lists, accounts, domains,
imported-member mapping and board-item imports and exports. These direct
translations were completed with low confidence and welcome review by a
Northern Ndebele speaker. This left **112,437 genuinely untranslated values
across 52 locale files**.
The seventh 50-value Northern Ndebele batch added member, sticker, sorting,
restoration, rule, shortcut and linked-item dialogs, CAS sign-in,
imported-member mapping, theme categories, fonts, text colors, avatars, language
and permissions. These direct translations were completed with low confidence
and welcome review by a Northern Ndebele speaker. This left **112,387 genuinely
untranslated values across 52 locale files**.
The eighth 50-value Northern Ndebele batch added settings, subtasks, board and
page stars, automatic list width, clipboard input, three-tier card aging,
keyboard movement, dialog navigation, board and card closing and 23 color names.
These direct translations were completed with low confidence and welcome review
by a Northern Ndebele speaker. This left **112,337 genuinely untranslated values
across 52 locale files**.
The ninth 50-value Northern Ndebele batch added the final colors, comment and
read-only roles, worker permissions, deletion confirmations, clipboard and link
copying, multi-card JSON templates, labels and checkbox, currency, dropdown and
numeric custom fields. These direct translations were completed with low
confidence and welcome review by a Northern Ndebele speaker. This left **112,287
genuinely untranslated values across 52 locale files**.
The tenth 50-value Northern Ndebele batch added text and date fields, permanent
deletion, profile and WIP settings, card dates and reactions, enrollment,
invitation, password-reset and verification email, scrolling and board, role,
JSON, CSV, import, linked-card and account errors. These direct translations
were completed with low confidence and welcome review by a Northern Ndebele
speaker. This left **112,237 genuinely untranslated values across 52 locale
files**.
The eleventh 50-value Northern Ndebele batch added account and duplicate-name
errors, card PDF and Excel export fields, attachment metadata and disk-space
errors, list sorting and card and list filters for dates, labels and members.
These direct translations were completed with low confidence and welcome review
by a Northern Ndebele speaker. This left **112,187 genuinely untranslated
values across 52 locale files**.
The twelfth 50-value Northern Ndebele batch added assignee and custom-field
filters, advanced expression filtering, activity visibility, imported-member
states and board import guidance for Kanboard, Deck, OpenProject, issues, Asana,
ZenKit, Trello, CSV, Jira, Excel and WeKan, including Trello ZIP validation.
These direct translations were completed with low confidence and welcome review
by a Northern Ndebele speaker. This left **112,137 genuinely untranslated
values across 52 locale files**.
The thirteenth 50-value Northern Ndebele batch added Trello ZIP safety,
workspace placement and direct API imports, saved credentials, board selection,
progress, cancellation and results, imported-member mapping, validation,
keyboard shortcuts and label creation and deletion. These direct translations
were completed with low confidence and welcome review by a Northern Ndebele
speaker. This left **112,087 genuinely untranslated values across 52 locale
files**.
The fourteenth 50-value Northern Ndebele batch added last-admin protection,
leaving boards, list archiving and movement, user, team and organization
settings, swimlane actions, card imports, list deletion, calendar and login,
multi-card selection, muted boards, archives, normal roles and participation
notices. These direct translations were completed with low confidence and
welcome review by a Northern Ndebele speaker. This left **112,037 genuinely
untranslated values across 52 locale files**.
The fifteenth 50-value Northern Ndebele batch added watch notices, private-page
login, image previews, public and private board descriptions, member removal
including Sandstorm guidance, rescue dialogs, search, WIP limits, keyboard
shortcuts, sidebar controls, signup and default-board behavior. These direct
translations were completed with low confidence and welcome review by a
Northern Ndebele speaker. This left **111,987 genuinely untranslated values
across 52 locale files**.
The sixteenth 50-value Northern Ndebele batch added starred boards, time
tracking, uploads, custom branding and URL schemes, watching, welcome-board
templates and WIP-limit warnings. These direct translations were completed
with low confidence and welcome review by a Northern Ndebele speaker. This left
**111,937 genuinely untranslated values across 52 locale files**.
The seventeenth 50-value Northern Ndebele batch added attachment and API size
limits, avatar upload policy, registration and invitations, SMTP setup and test
mail, webhook controls and server-version labels. These direct translations
were completed with low confidence and welcome review by a Northern Ndebele
speaker. This left **111,887 genuinely untranslated values across 52 locale
files**.
The eighteenth 50-value Northern Ndebele batch added database, FerretDB,
reactivity and OS diagnostics, time units, custom-field display, visibility,
account changes and organization, team, domain and multitenancy controls. These
direct translations were completed with low confidence and welcome review by a
Northern Ndebele speaker. This left **111,837 genuinely untranslated values
across 52 locale files**.
The nineteenth 50-value Northern Ndebele batch added card receipt and end dates,
colors, requested and assigned people, destructive board and notification
actions, subtask and card settings, minicard display, parent-card paths and label
activity. These direct translations were completed with low confidence and
welcome review by a Northern Ndebele speaker. This left **111,787 genuinely
untranslated values across 52 locale files**.
The twentieth 50-value Northern Ndebele batch added label, attachment and custom
field activity plus visual board-rule creation, triggers, actions, selection,
workflow editing and JSON, CSV and Trello Butler imports and exports. These
direct translations were completed with low confidence and welcome review by a
Northern Ndebele speaker. This left **111,737 genuinely untranslated values
across 52 locale files**.
The twenty-first 50-value Northern Ndebele batch added n8n and Node-RED visual
workflow imports, scheduled and button triggers, repeat periods, due-date and
list-duration conditions, sorting, completion, relative dates and rule units.
These direct translations were completed with low confidence and welcome review
by a Northern Ndebele speaker. This left **111,687 genuinely untranslated
values across 52 locale files**.
The twenty-second 50-value Northern Ndebele batch added rule grammar for board
and list movement, archive restoration, labels, members, attachments,
checklists, checklist items, colors, card placement and email actions. These
direct translations were completed with low confidence and welcome review by a
Northern Ndebele speaker. This left **111,637 genuinely untranslated values
across 52 locale files**.
The twenty-third 50-value Northern Ndebele batch added concrete rule actions for
email, archives, labels, members, checklists, swimlanes, date fields and linked
cards plus authentication and custom product, HTML, manifest and asset-links
settings. These direct translations were completed with low confidence and
welcome review by a Northern Ndebele speaker. This left **111,587 genuinely
untranslated values across 52 locale files**.
The twenty-fourth 50-value Northern Ndebele batch added board members, custom
body HTML, authentication display, board duplication, entity totals, swimlane
deletion and restoration, card date activity and reminders, account deletion,
minicard labels, resize handles and Enter submission. These direct translations
were completed with low confidence and welcome review by a Northern Ndebele
speaker. This left **111,537 genuinely untranslated values across 52 locale
files**.
The twenty-fifth 50-value Northern Ndebele batch added multi-card windows,
Enter editor behavior, organization, team and user dialogs, notification
filters, rename controls, board-role permissions and status, weekdays, ownership
and linked-card deletion guidance. These direct translations were completed
with low confidence and welcome review by a Northern Ndebele speaker. This left
**111,487 genuinely untranslated values across 52 locale files**.
The twenty-sixth 50-value Northern Ndebele batch added linked-list safeguards,
checklists, tasks, domains, shared templates, people and time periods, My Cards
and Due Cards views, global search scopes and missing board-item messages. These
direct translations were completed with low confidence and welcome review by a
Northern Ndebele speaker. This left **111,437 genuinely untranslated values
across 52 locale files**.
The twenty-seventh 50-value Northern Ndebele batch added missing-result messages
and global-search operators and predicates for board structure, people, dates,
statuses, sorting, comments, custom fields, attachments and checklists. These
direct translations were completed with low confidence and welcome review by a
Northern Ndebele speaker. This left **111,387 genuinely untranslated values
across 52 locale files**.
The twenty-eighth 50-value Northern Ndebele batch added search validation,
paging, available-operator guidance and detailed examples for board structure,
people, dates, statuses, fields, sorting, limits and combined conditions. These
direct translations were completed with low confidence and welcome review by a
Northern Ndebele speaker. This left **111,337 genuinely untranslated values
across 52 locale files**.
The twenty-ninth 50-value Northern Ndebele batch added label summaries, board
and card sorting, completion, stickers, card dependencies and JSON/SVG imports,
board backgrounds and card locations. These direct translations were completed
with low confidence and welcome review by a Northern Ndebele speaker. This left
**111,287 genuinely untranslated values across 52 locale files**.
The thirtieth 50-value Northern Ndebele batch added map detection, server-log
troubleshooting, title and date sorting, activities, swimlane movement, string
templates, file diagnostics, Problems reports, impersonation, recovery and
office-login summaries. These direct translations were completed with low
confidence and welcome review by a Northern Ndebele speaker. This left
**111,237 genuinely untranslated values across 52 locale files**.
The thirty-first 50-value Northern Ndebele batch added office and REST API
reports, automatic recovery status, swimlane copying, wait indicators, card
window sizing, deletion safeguards, ticket states, requests, history and card
details. These direct translations were completed with low confidence and
welcome review by a Northern Ndebele speaker. This left **111,187 genuinely
untranslated values across 52 locale files**.
The thirty-second 50-value Northern Ndebele batch added teams, invitations,
Node heap and memory diagnostics, organizations, legal notices, checklist and
subtask actions, card list display and attachment movement to filesystems,
GridFS and S3. These direct translations were completed with low confidence and
welcome review by a Northern Ndebele speaker. This left **111,137 genuinely
untranslated values across 52 locale files**.
The thirty-third 50-value Northern Ndebele batch added bulk attachment movement,
storage source and destination controls, attachment and avatar repair, file
statistics and identifiers, MongoDB GridFS compaction guidance and board-file
table fields. These direct translations were completed with low confidence and
welcome review by a Northern Ndebele speaker. This left **111,087 genuinely
untranslated values across 52 locale files**.
The thirty-fourth 50-value Northern Ndebele batch added board status and time,
upload progress and limits, card details, visibility, custom translations,
subtasks, ISO weeks, markdown and ZIP imports, checklist display and support and
accessibility pages. These direct translations were completed with low
confidence and welcome review by a Northern Ndebele speaker. This left
**111,037 genuinely untranslated values across 52 locale files**.
The thirty-fifth 50-value Northern Ndebele batch added accessibility content,
login lockout protection and administration, scheduled jobs and migrations,
attachment and avatar paths and scheduled board archive, backup and cleanup
operations. These direct translations were completed with low confidence and
welcome review by a Northern Ndebele speaker. This left **110,987 genuinely
untranslated values across 52 locale files**.
The thirty-sixth 50-value Northern Ndebele batch added scheduled-job and
migration recovery, filesystem, S3 and Azure storage, MongoDB–FerretDB transfer
and Sandstorm migration status. These direct translations were completed with
low confidence and welcome review by a Northern Ndebele speaker. This left
**110,937 genuinely untranslated values across 52 locale files**.
The thirty-seventh 50-value Northern Ndebele batch added Sandstorm cleanup,
adaptive card loading, safe link and code rendering, import and export privacy,
activity, notification and watch suppression and streamed backup scopes. These
direct translations were completed with low confidence and welcome review by a
Northern Ndebele speaker. This left **110,887 genuinely untranslated values
across 52 locale files**.
The thirty-eighth 50-value Northern Ndebele batch added backup scheduling and
restoration, Google Cloud credentials, S3, Azure and GCS setup paths, cloud
secrets and connection diagnostics and Azure attachment storage. These direct
translations were completed with low confidence and welcome review by a
Northern Ndebele speaker. This left **110,837 genuinely untranslated values
across 52 locale files**.
The thirty-ninth 50-value Northern Ndebele batch added Google Cloud and GridFS
attachment storage, migration controls and status, S3 credentials and
connections, scheduled board operations, writable paths and attachment and
board migration settings. These direct translations were completed with low
confidence and welcome review by a Northern Ndebele speaker. This left
**110,787 genuinely untranslated values across 52 locale files**.
The fortieth 50-value Northern Ndebele batch added comprehensive board repairs,
duplicate-list cleanup, lost-card and archive recovery, list and URL repairs,
migration confirmation and progress and board-structure repair steps. These
direct translations were completed with low confidence and welcome review by a
Northern Ndebele speaker. This left **110,737 genuinely untranslated values
across 52 locale files**.
The forty-first 50-value Northern Ndebele batch added board-repair steps,
conversion status, CPU and storage metrics, schedules, export monitoring,
filesystem and GridFS totals and job details and queues. These direct
translations were completed with low confidence and welcome review by a
Northern Ndebele speaker. This left **110,687 genuinely untranslated values
across 52 locale files**.
The forty-second 50-value Northern Ndebele batch added attachment migration
targets, batch and resource thresholds, migration logs and lifecycle controls,
monitoring, navigation, minicard display and storage and operation totals. These
direct translations were completed with low confidence and welcome review by a
Northern Ndebele speaker. This left **110,637 genuinely untranslated values
across 52 locale files**.
The forty-third 50-value Northern Ndebele batch added repositories, account and
OTP access, login validation, Problems status and guidance, broken-card repair,
CPU metrics and diagnostic event fields. These direct translations were
completed with low confidence and welcome review by a Northern Ndebele speaker.
This left **110,587 genuinely untranslated values across 52 locale files**.
The forty-fourth and final 17-value Northern Ndebele batch added diagnostic
details and addresses, filesystem integrity, export selection, import feedback
and the numeric card-search operator. These direct translations were completed
with low confidence and welcome review by a Northern Ndebele speaker. Northern
Ndebele is now complete, leaving **110,570 genuinely untranslated values across
51 locale files**.
The first 50-value Nepali batch added activity history for boards, lists,
swimlanes, cards, attachments, labels, checklists, comments, custom fields and
members, together with organization and team restrictions. These direct
translations were completed with low confidence and welcome review by a Nepali
speaker. This left **110,520 genuinely untranslated values across 51 locale
files**.
The second 50-value Nepali batch added card moves and restoration, detailed
activity history, checklist actions and All Boards workspace names, menus and
settings. These direct translations were completed with low confidence and
welcome review by a Nepali speaker. This left **110,470 genuinely untranslated
values across 51 locale files**.
The third 50-value Nepali batch added workspace deletion and board selection,
home-board controls, due and end dates, personal and shared list widths,
keyboard shortcuts, swimlane heights and common card actions. These direct
translations were completed with low confidence and welcome review by a Nepali
speaker. This left **110,420 genuinely untranslated values across 51 locale
files**.
The fourth 50-value Nepali batch added administrator announcements, offline
reconnection, archives, board visibility and restoration, attachment deletion,
background images, board summaries, members and assignees. These direct
translations were completed with low confidence and welcome review by a Nepali
speaker. This left **110,370 genuinely untranslated values across 51 locale
files**.
The fifth 50-value Nepali batch added public-board guidance, board ordering and
workspace assignment, colors and backgrounds, desktop and mobile views, zoom,
calendar navigation, archive guidance and card editing. These direct
translations were completed with low confidence and welcome review by a Nepali
speaker. This left **110,320 genuinely untranslated values across 51 locale
files**.
The sixth 50-value Nepali batch added card membership and custom fields,
voting, Planning Poker, dependencies, organizations, teams, backgrounds,
domains, imported-member mapping and checklist and board-item imports. These
direct translations were completed with low confidence and welcome review by a
Nepali speaker. This left **110,270 genuinely untranslated values across 51
locale files**.
The seventh 50-value Nepali batch added member and restoration dialogs, linked
cards and boards, imported-member mapping safeguards, themes, font previews and
sizes, text colors, avatars, language and permissions. These direct translations
were completed with low confidence and welcome review by a Nepali speaker. This
left **110,220 genuinely untranslated values across 51 locale files**.
The eighth 50-value Nepali batch added starring, automatic list widths,
clipboard input, three-tier card aging, directional movement, accessible dialog
navigation, board restoration guidance and the board color palette. These
direct translations were completed with low confidence and welcome review by a
Nepali speaker. This left **110,170 genuinely untranslated values across 51
locale files**.
The ninth 50-value Nepali batch added the remaining palette colors, restricted
board roles, deletion confirmations, clipboard actions, linked and copied
cards, JSON bulk-card input and custom-field types and options. These direct
translations were completed with low confidence and welcome review by a Nepali
speaker. This left **110,120 genuinely untranslated values across 51 locale
files**.
The tenth 50-value Nepali batch added permanent-delete safeguards, WIP limits,
profile and card-field editing, account, invitation, password-reset and
verification emails, board authorization errors and JSON, CSV, TSV and import
validation. These direct translations were completed with low confidence and
welcome review by a Nepali speaker. This left **110,070 genuinely untranslated
values across 51 locale files**.
The eleventh 50-value Nepali batch added account and naming errors, card exports
to PDF and Excel with attachment and disk-space details, list sorting and card
and list filters for dates, labels and members. These direct translations were
completed with low confidence and welcome review by a Nepali speaker. This left
**110,020 genuinely untranslated values across 51 locale files**.
The twelfth 50-value Nepali batch added assignee and custom-field filters,
advanced filter syntax, imported and inactive members, board-import guidance
for Kanboard, Deck, OpenProject, issue trackers, Asana, ZenKit, Trello, Jira,
Excel and WeKan, and Trello ZIP validation. These direct translations were
completed with low confidence and welcome review by a Nepali speaker. This left
**109,970 genuinely untranslated values across 51 locale files**.
The thirteenth 50-value Nepali batch added Trello ZIP path and size validation,
workspace placement, direct API imports and resumable import-job controls,
member mapping, date and user validation, invitations, keyboard shortcuts and
label creation and deletion. These direct translations were completed with low
confidence and welcome review by a Nepali speaker. This left **109,920 genuinely
untranslated values across 51 locale files**.
The fourteenth 50-value Nepali batch added last-administrator protection, board
departure, list links, archival and deletion, user, team and organization
settings, swimlane and list imports, selection movement and copying, archive
empty states, restricted normal roles and participation notifications. These
direct translations were completed with low confidence and welcome review by a
Nepali speaker. This left **109,870 genuinely untranslated values across 51
locale files**.
The fifteenth 50-value Nepali batch added watch notifications, private and
public page guidance, previews, member removal including Sandstorm access,
unsaved-description rescue, search and WIP controls, keyboard shortcuts,
sidebars, signup and starred and default-board actions. These direct
translations were completed with low confidence and welcome review by a Nepali
speaker. This left **109,820 genuinely untranslated values across 51 locale
files**.
The sixteenth 50-value Nepali batch added starred boards, time tracking,
assignee and label shortcuts, uploads, custom logo and help URLs, automatic URL
schemes, welcome-board and template names, archive warnings and WIP-limit
feedback. These direct translations were completed with low confidence and
welcome review by a Nepali speaker. This left **109,770 genuinely untranslated
values across 51 locale files**.
The seventeenth 50-value Nepali batch added attachment and API transfer limits,
avatar upload controls, registration and invitation emails, SMTP and TLS
settings and testing, authorization errors, outgoing and two-way webhooks and
runtime package, database, Node and Meteor labels. These direct translations
were completed with low confidence and welcome review by a Nepali speaker. This
left **109,720 genuinely untranslated values across 51 locale files**.
The eighteenth 50-value Nepali batch added database and FerretDB details,
reactivity and DDP settings, operating-system metrics, time units, custom-field
display, account and board visibility, and organization tenancy, domains,
administrators, authentication sync and shared templates. These direct
translations were completed with low confidence and welcome review by a Nepali
speaker. This left **109,670 genuinely untranslated values across 51 locale
files**.
The nineteenth 50-value Nepali batch added received and end dates, card, list
and swimlane colors, assignment sources, destructive board and notification
confirmations, duplicate-list cleanup, subtask and card settings, minicard
details and parent-card paths and labels. These direct translations were
completed with low confidence and welcome review by a Nepali speaker. This left
**109,620 genuinely untranslated values across 51 locale files**.
The twentieth 50-value Nepali batch added label, attachment and custom-field
activity, visual rule building, card, label, member, checklist, attachment and
daily triggers, JSON and CSV rule import and export and Trello Butler command
mapping. These direct translations were completed with low confidence and
welcome review by a Nepali speaker. This left **109,570 genuinely untranslated
values across 51 locale files**.
The twenty-first 50-value Nepali batch added n8n and Node-RED workflow imports,
scheduled and button triggers, one-time, daily, weekday, weekly and monthly
schedules, due-date and list-duration conditions, sorting, completion, bulk
movement and relative-date actions and time units. These direct translations
were completed with low confidence and welcome review by a Nepali speaker. This
left **109,520 genuinely untranslated values across 51 locale files**.
The twenty-second 50-value Nepali batch added rule-builder fragments for card,
label, member, attachment, checklist and checklist-item conditions, card
movement and restoration, labels, members, colors and checklist actions, and
email and movement rule descriptions. These direct translations were completed
with low confidence and welcome review by a Nepali speaker. This left **109,470
genuinely untranslated values across 51 locale files**.
The twenty-third 50-value Nepali batch added automation email, archive, label,
member, checklist, swimlane, date-field and card-link actions, authentication,
custom product names, HTML head metadata, web manifests, asset links and layout
controls. These direct translations were completed with low confidence and
welcome review by a Nepali speaker. This left **109,420 genuinely untranslated
values across 51 locale files**.
The twenty-fourth 50-value Nepali batch added custom body HTML, authentication
errors and OIDC labels, board duplication and entity totals, swimlane deletion,
card placement, due reminders and user mentions, account, team and organization
deletion and desktop and menu resizing. These direct translations were
completed with low confidence and welcome review by a Nepali speaker. This left
**109,370 genuinely untranslated values across 51 locale files**.
The twenty-fifth 50-value Nepali batch added multi-window cards, Enter and
modifier-key editing, organization, team and user forms, notification actions,
rename and board-role permissions and status, week-start days, ownership and
activity metadata and linked-card deletion guidance. These direct translations
were completed with low confidence and welcome review by a Nepali speaker. This
left **109,320 genuinely untranslated values across 51 locale files**.
The twenty-sixth 50-value Nepali batch added linked-list deletion protection,
checklist visibility, tasks, domains and shared templates, My Cards and Due
Cards views and sorting, global search scope and board, swimlane, list and label
not-found errors. These direct translations were completed with low confidence
and welcome review by a Nepali speaker. This left **109,270 genuinely
untranslated values across 51 locale files**.
The twenty-seventh 50-value Nepali batch added username, comment, organization
and team search errors, result counts and pagination, and localized global
search operators and predicates for board structure, people, status, dates,
text, attachments and checklists. These direct translations were completed with
low confidence and welcome review by a Nepali speaker. This left **109,220
genuinely untranslated values across 51 locale files**.
The twenty-eighth 50-value Nepali batch added the remaining search predicates,
operator validation, pagination and detailed global-search instructions for
board structure, users, organizations, teams, dates, status, field existence,
sorting, result limits and AND and OR combinations. These direct translations
were completed with low confidence and welcome review by a Nepali speaker. This
left **109,170 genuinely untranslated values across 51 locale files**.
The twenty-ninth 50-value Nepali batch added board and card sorting, completion,
stickers, dependency relationships, filtering and JSON or SVG imports, board
background upload and deletion and card locations. These direct translations
were completed with low confidence and welcome review by a Nepali speaker. This
left **109,120 genuinely untranslated values across 51 locale files**.
The thirtieth 50-value Nepali batch added map coordinates and detection, server
error troubleshooting, sorting, board activities, swimlane movement, string
templates, invisible-filename filtering, Problems reports, impersonation,
recovery and office login locations. These direct translations were completed
with low confidence and welcome review by a Nepali speaker. This left **109,070
genuinely untranslated values across 51 locale files**.
The thirty-first 50-value Nepali batch added office activity, REST API use,
automatic recovery and maintenance status, swimlane copying, card display and
wait spinners, organization and team deletion safeguards, and ticket and help
request fields and states. These direct translations were completed with low
confidence and welcome review by a Nepali speaker. This left **109,020 genuinely
untranslated values across 51 locale files**.
The thirty-second 50-value Nepali batch added team and organization membership,
registration invitations and email domains, Node heap and memory metrics, legal
notices, checklist movement and copying, and attachment actions and filesystem,
GridFS and S3 storage moves. These direct translations were completed with low
confidence and welcome review by a Nepali speaker. This left **108,970 genuinely
untranslated values across 51 locale files**.
The thirty-third 50-value Nepali batch added bulk attachment and avatar storage
moves, file-location repair, default storage, file statistics and identifiers,
and MongoDB GridFS Compact guidance, progress and results. These direct
translations were completed with low confidence and welcome review by a Nepali
speaker. This left **108,920 genuinely untranslated values across 51 locale
files**.
The thirty-fourth 50-value Nepali batch added board time status, upload progress
and limits, passwords, Mongo sessions, PDF preview fallback, workspace dragging,
custom translations, ISO week display, ZIP board imports, checklist collapsing,
support and accessibility pages. These direct translations were completed with
low confidence and welcome review by a Nepali speaker. This left **108,870
genuinely untranslated values across 51 locale files**.
The thirty-fifth 50-value Nepali batch added accessibility content, brute-force
login protection and locked-user administration, people status filters,
scheduled jobs, attachment and avatar paths and scheduled board archive, backup
and cleanup operations. These direct translations were completed with low
confidence and welcome review by a Nepali speaker. This left **108,820 genuinely
untranslated values across 51 locale files**.
The thirty-sixth 50-value Nepali batch added scheduled-job and migration
controls and errors, filesystem, S3 and Azure storage settings, MongoDB and
FerretDB text-data migration and Sandstorm database and file migration status.
These direct translations were completed with low confidence and welcome review
by a Nepali speaker. This left **108,770 genuinely untranslated values across 51
locale files**.
The thirty-seventh 50-value Nepali batch added Sandstorm raw-database cleanup,
automatic and lazy card loading, link and code rendering safeguards, global
import, export, avatar, activity, notification and watch controls, user
anonymization and scoped streamed backups. These direct translations were
completed with low confidence and welcome review by a Nepali speaker. This left
**108,720 genuinely untranslated values across 51 locale files**.
The thirty-eighth 50-value Nepali batch added scheduled backup frequency and
restore modes, Google Cloud Storage credentials and permissions, and detailed
AWS S3, compatible S3, Azure and GCS configuration paths, secret handling and
connection tests. These direct translations were completed with low confidence
and welcome review by a Nepali speaker. This left **108,670 genuinely
untranslated values across 51 locale files**.
The thirty-ninth 50-value Nepali batch added Google Cloud Storage and GridFS
storage, manual and automatic migration lifecycle controls, CollectionFS moves,
AWS S3 and MinIO credentials and SSL/TLS, scheduled board operations, writable
paths and attachment and board migration settings. These direct translations
were completed with low confidence and welcome review by a Nepali speaker. This
left **108,620 genuinely untranslated values across 51 locale files**.
The fortieth 50-value Nepali batch added comprehensive board migration,
duplicate-list cleanup, lost-card and archive restoration, missing-list repair,
avatar and file URL correction, confirmations, progress and board-structure
repair steps. These direct translations were completed with low confidence and
welcome review by a Nepali speaker. This left **108,570 genuinely untranslated
values across 51 locale files**.
The forty-first 50-value Nepali batch added board-repair steps, conversion
status, CPU and storage metrics, schedules, export monitoring, filesystem and
GridFS totals and job details and queues. These direct translations were
completed with low confidence and welcome review by a Nepali speaker. This left
**108,520 genuinely untranslated values across 51 locale files**.
The forty-second 50-value Nepali batch added attachment migration targets,
batch and resource thresholds, migration logs and lifecycle controls,
monitoring, navigation, minicard display and storage and operation totals. These
direct translations were completed with low confidence and welcome review by a
Nepali speaker. This left **108,470 genuinely untranslated values across 51
locale files**.
The forty-third 50-value Nepali batch added repositories, account and OTP
access, login validation, Problems status and guidance, broken-card repair, CPU
metrics and diagnostic event fields. These direct translations were completed
with low confidence and welcome review by a Nepali speaker. This left **108,420
genuinely untranslated values across 51 locale files**.
The forty-fourth and final 17-value Nepali batch added diagnostic details and
addresses, filesystem integrity, export selection, import feedback and the
numeric card-search operator. These direct translations were completed with low
confidence and welcome review by a Nepali speaker. Nepali is now complete,
leaving **108,403 genuinely untranslated values across 50 locale files**.
The first 50-value Northern Sotho batch added activity history for boards,
lists, swimlanes, cards, attachments, labels, checklists, comments, custom
fields and members, together with organization and team restrictions. These
direct translations were completed with low confidence and welcome review by a
Northern Sotho speaker. This left **108,353 genuinely untranslated values across
50 locale files**.
The second 50-value Northern Sotho batch added card moves and restoration,
detailed activity history, checklist actions and All Boards workspace names,
menus and settings. These direct translations were completed with low
confidence and welcome review by a Northern Sotho speaker. This left **108,303
genuinely untranslated values across 50 locale files**.
The third 50-value Northern Sotho batch added workspace deletion and board
selection, Home-board controls, due and end dates, list-width preferences,
keyboard shortcuts, swimlane heights, subtasks, checklists, covers, labels and
members. These direct translations were completed with low confidence and
welcome review by a Northern Sotho speaker. This left **108,253 genuinely
untranslated values across 50 locale files**.
The fourth 50-value Northern Sotho batch added administrator announcements and
permissions, public-board labels, connection recovery, board and selection
archiving, templates, attachments, background images, All Boards display
settings and board member and assignee summaries. These direct translations
were completed with low confidence and welcome review by a Northern Sotho
speaker. This left **108,203 genuinely untranslated values across 50 locale
files**.
The fifth 50-value Northern Sotho batch added board visibility, drag-and-drop,
background, title, watch and view controls, desktop and mobile modes, zoom,
calendar navigation, archive guidance and card dates, time, attachments, custom
fields, labels and members. These direct translations were completed with low
confidence and welcome review by a Northern Sotho speaker. This left **108,153
genuinely untranslated values across 50 locale files**.
The sixth 50-value Northern Sotho batch added card membership and start dates,
attachments, custom fields, voting and Planning Poker, card dependencies,
organization and team membership, account and background deletion, domains and
checklist, swimlane, list, card and board imports. These direct translations
were completed with low confidence and welcome review by a Northern Sotho
speaker. This left **108,103 genuinely untranslated values across 50 locale
files**.
The seventh 50-value Northern Sotho batch added member, sticker and invitation
dialogs, list sorting and archive restoration, linked cards and boards, secure
mapping of imported members, themes, fonts, text colors, avatars, languages and
permissions. These direct translations were completed with low confidence and
welcome review by a Northern Sotho speaker. This left **108,053 genuinely
untranslated values across 50 locale files**.
The eighth 50-value Northern Sotho batch added settings and subtasks, starred
boards and pages, automatic list width, clipboard input, three-tier card aging,
keyboard movement and dialog navigation, board restoration guidance and 23
interface colors. These direct translations were completed with low confidence
and welcome review by a Northern Sotho speaker. This left **108,003 genuinely
untranslated values across 50 locale files**.
The ninth 50-value Northern Sotho batch added colors, comment and read-only
roles, worker permissions, deletion confirmations, swimlane moves, clipboard
links, bulk card-template JSON, labels and custom-field types and options. These
direct translations were completed with low confidence and welcome review by a
Northern Sotho speaker. This left **107,953 genuinely untranslated values across
50 locale files**.
The tenth 50-value Northern Sotho batch added text and date fields, permanent
deletion, WIP limits, card dates and notifications, enrollment, invitation,
password-reset and verification email templates, scrollbars and authorization,
JSON, CSV, TSV, empty-board, linked-card and disabled-account errors. These
direct translations were completed with low confidence and welcome review by a
Northern Sotho speaker. This left **107,903 genuinely untranslated values across
50 locale files**.
The eleventh 50-value Northern Sotho batch added account-conflict errors,
attachment-free board exports, PDF and Excel card exports, field selection,
attachment metadata and disk-space errors, list sorting and date, label and
member filters. These direct translations were completed with low confidence
and welcome review by a Northern Sotho speaker. This left **107,853 genuinely
untranslated values across 50 locale files**.
The twelfth 50-value Northern Sotho batch added assignee and advanced filters,
activity and imported-member states and board-import guidance for Kanboard,
NextCloud Deck, OpenProject, issue trackers, Asana, ZenKit, Trello, CSV, Jira,
Excel and WeKan, including Trello JSON, ZIP, timeout, size and file-count errors.
These direct translations were completed with low confidence and welcome review
by a Northern Sotho speaker. This left **107,803 genuinely untranslated values
across 50 locale files**.
The thirteenth 50-value Northern Sotho batch added Trello ZIP path and size
validation, workspace placement, direct API import credentials, board selection,
progress, cancellation, resumption and cleanup, imported-member mapping, date,
time and user validation, keyboard shortcuts and label lifecycle. These direct
translations were completed with low confidence and welcome review by a
Northern Sotho speaker. This left **107,753 genuinely untranslated values across
50 locale files**.
The fourteenth 50-value Northern Sotho batch added last-administrator and board
departure safeguards, list and swimlane archiving, movement and imports, user,
team and organization settings, multi-selection, muted notifications, archive
empty states and normal and assigned-only roles. These direct translations were
completed with low confidence and welcome review by a Northern Sotho speaker.
This left **107,703 genuinely untranslated values across 50 locale files**.
The fifteenth 50-value Northern Sotho batch added watched-item notifications,
private-page login, image previews, public and private board descriptions,
member removal including Sandstorm guidance, unsaved-description rescue, board
search, WIP limits, keyboard shortcuts, sidebars, signup and default-board
controls. These direct translations were completed with low confidence and
welcome review by a Northern Sotho speaker. This left **107,653 genuinely
untranslated values across 50 locale files**.
The sixteenth 50-value Northern Sotho batch added starred boards, subscriptions,
time tracking, numeric assignee and label shortcuts, uploads, custom login and
corner logos, URL schemes, watching, welcome and template boards and WIP-limit
errors. These direct translations were completed with low confidence and
welcome review by a Northern Sotho speaker. This left **107,603 genuinely
untranslated values across 50 locale files**.
The seventeenth 50-value Northern Sotho batch added attachment and API transfer
limits, avatar upload controls, registration and invitations, SMTP settings and
test messages, webhooks, card-title filtering and runtime component labels.
These direct translations were completed with low confidence and welcome review
by a Northern Sotho speaker. This left **107,553 genuinely untranslated values
across 50 locale files**.
The eighteenth 50-value Northern Sotho batch added database, reactivity,
transport, operating-system and memory diagnostics, time units, custom-field
display, account changes, board visibility and organization and team tenancy.
These direct translations were completed with low confidence and welcome review
by a Northern Sotho speaker. This left **107,503 genuinely untranslated values
across 50 locale files**.
The nineteenth 50-value Northern Sotho batch added card receipt and end dates,
colors, requester and assigner labels, board and notification deletion
safeguards, subtask and card settings, minicard display and parent-card paths.
These direct translations were completed with low confidence and welcome review
by a Northern Sotho speaker. This left **107,453 genuinely untranslated values
across 50 locale files**.
The twentieth 50-value Northern Sotho batch added label, attachment and custom
field activity, visual rule editing, workflow triggers and JSON, CSV and Trello
Butler rule import and export. These direct translations were completed with low
confidence and welcome review by a Northern Sotho speaker. This left **107,403
genuinely untranslated values across 50 locale files**.
The twenty-first 50-value Northern Sotho batch added imported visual workflows,
scheduled and button triggers, due-date conditions, list sorting, completion,
relative dates and rule units and fragments. These direct translations were
completed with low confidence and welcome review by a Northern Sotho speaker.
This left **107,353 genuinely untranslated values across 50 locale files**.
The twenty-second 50-value Northern Sotho batch added visual-rule grammar for
card movement and archiving, labels, members, attachments, checklists and email
actions. These direct translations were completed with low confidence and
welcome review by a Northern Sotho speaker. This left **107,303 genuinely
untranslated values across 50 locale files**.
The twenty-third 50-value Northern Sotho batch added concrete rule actions for
cards, checklists, swimlanes and dates, authentication labels, custom product
and web metadata and layout controls. These direct translations were completed
with low confidence and welcome review by a Northern Sotho speaker. This left
**107,253 genuinely untranslated values across 50 locale files**.
The twenty-fourth 50-value Northern Sotho batch added board-member lists,
custom body HTML, authentication and duplication controls, activity dates and
reminders, destructive safeguards, selection placement and resize controls.
These direct translations were completed with low confidence and welcome review
by a Northern Sotho speaker. This left **107,203 genuinely untranslated values
across 50 locale files**.
The twenty-fifth 50-value Northern Sotho batch added multi-window card editing,
organization, team and user dialogs, notification filters, board-role
permissions, weekdays, status labels and linked-card deletion guidance. These
direct translations were completed with low confidence and welcome review by a
Northern Sotho speaker. This left **107,153 genuinely untranslated values across
50 locale files**.
The twenty-sixth 50-value Northern Sotho batch added linked-list safeguards,
shared-template domains, personal and due-card views, global search and
missing-board, swimlane, list and label messages. These direct translations were
completed with low confidence and welcome review by a Northern Sotho speaker.
This left **107,103 genuinely untranslated values across 50 locale files**.
The twenty-seventh 50-value Northern Sotho batch added missing-result and card
counts plus compact global-search operators and predicates for boards, users,
dates, attachments, checklists and card metadata. These direct translations were
completed with low confidence and welcome review by a Northern Sotho speaker.
This left **107,053 genuinely untranslated values across 50 locale files**.
The twenty-eighth 50-value Northern Sotho batch added search predicates,
operator validation, pagination and detailed global-search syntax, status,
field, sorting and combination guidance. These direct translations were
completed with low confidence and welcome review by a Northern Sotho speaker.
This left **107,003 genuinely untranslated values across 50 locale files**.
The twenty-ninth 50-value Northern Sotho batch added card and board sorting,
completion, stickers, card dependencies and their imports, board backgrounds
and card locations. These direct translations were completed with low
confidence and welcome review by a Northern Sotho speaker. This left **106,953
genuinely untranslated values across 50 locale files**.
The thirtieth 50-value Northern Sotho batch added map detection, server
troubleshooting, board activity, custom-field string templates, administration
reports and office-login summaries. These direct translations were completed
with low confidence and welcome review by a Northern Sotho speaker. This left
**106,903 genuinely untranslated values across 50 locale files**.
The thirty-first 50-value Northern Sotho batch added office and API reporting,
database recovery, loading indicators, card display controls, organization and
team safeguards, support tickets and request statuses. These direct translations
were completed with low confidence and welcome review by a Northern Sotho
speaker. This left **106,853 genuinely untranslated values across 50 locale
files**.
The thirty-second 50-value Northern Sotho batch added team and organization
membership, Node memory diagnostics, legal notices, checklist and subtask
actions and attachment storage movement. These direct translations were
completed with low confidence and welcome review by a Northern Sotho speaker.
This left **106,803 genuinely untranslated values across 50 locale files**.
The thirty-third 50-value Northern Sotho batch added bulk attachment movement,
storage-location repair, file counts and identifiers, and MongoDB compaction
status and guidance. These direct translations were completed with low
confidence and welcome review by a Northern Sotho speaker. This left **106,753
genuinely untranslated values across 50 locale files**.
The thirty-fourth 50-value Northern Sotho batch added board status, upload
rules, custom translations, checklist display, support and accessibility
controls. These direct translations were completed with low confidence and
welcome review by a Northern Sotho speaker. This left **106,703 genuinely
untranslated values across 50 locale files**.
The thirty-fifth 50-value Northern Sotho batch added accessibility content,
brute-force login protection, locked-user administration, people status,
attachment and avatar paths, and scheduled board operations. These direct
translations were completed with low confidence and welcome review by a
Northern Sotho speaker. This left **106,653 genuinely untranslated values across
50 locale files**.
The thirty-sixth 50-value Northern Sotho batch added scheduled-job and migration
controls, filesystem, S3 and Azure storage, MongoDB and FerretDB text-data
migration, and Sandstorm migration status. These direct translations were
completed with low confidence and welcome review by a Northern Sotho speaker.
This left **106,603 genuinely untranslated values across 50 locale files**.
The thirty-seventh 50-value Northern Sotho batch added Sandstorm cleanup,
automatic and lazy card loading, safe link and code rendering, import, export,
avatar, activity, notification and watch controls, anonymization and backup
scopes. These direct translations were completed with low confidence and welcome
review by a Northern Sotho speaker. This left **106,553 genuinely untranslated
values across 50 locale files**.
The thirty-eighth 50-value Northern Sotho batch added scheduled backups and
restore modes, Google Cloud credentials and permissions, and detailed AWS S3,
Azure and GCS configuration paths, secret handling and connection tests. These
direct translations were completed with low confidence and welcome review by a
Northern Sotho speaker. This left **106,503 genuinely untranslated values across
50 locale files**.
The thirty-ninth 50-value Northern Sotho batch added Google Cloud Storage and
GridFS targets, migration lifecycle controls, CollectionFS movement, AWS S3 and
MinIO security settings, scheduled board operations and attachment monitoring.
These direct translations were completed with low confidence and welcome review
by a Northern Sotho speaker. This left **106,453 genuinely untranslated values
across 50 locale files**.
The fortieth 50-value Northern Sotho batch added comprehensive board integrity
checks, duplicate-list cleanup, lost-card and archive restoration, missing-list
repair, avatar and file URL repair, confirmations and migration progress. These
direct translations were completed with low confidence and welcome review by a
Northern Sotho speaker. This left **106,403 genuinely untranslated values across
50 locale files**.
The forty-first 50-value Northern Sotho batch added board-repair steps,
conversion status, CPU and storage metrics, recurring schedules, export
monitoring, filesystem and GridFS totals and job details and queues. These
direct translations were completed with low confidence and welcome review by a
Northern Sotho speaker. This left **106,353 genuinely untranslated values across
50 locale files**.
The forty-second 50-value Northern Sotho batch added attachment migration
targets, batch and CPU thresholds, migration logs and lifecycle controls,
monitoring, pagination, minicard display and storage and operation totals. These
direct translations were completed with low confidence and welcome review by a
Northern Sotho speaker. This left **106,303 genuinely untranslated values across
50 locale files**.
The forty-third 50-value Northern Sotho batch added repositories, account and
OTP access, login validation, Problems status and guidance, broken-card repair,
CPU metrics and diagnostic event fields. These direct translations were
completed with low confidence and welcome review by a Northern Sotho speaker.
This left **106,253 genuinely untranslated values across 50 locale files**.
The forty-fourth and final 17-value Northern Sotho batch added diagnostic event
details and IP addresses, filesystem integrity, scoped export and import
guidance and the numeric card-search operator. These direct translations were
completed with low confidence and welcome review by a Northern Sotho speaker.
Northern Sotho is now complete, leaving **106,236 genuinely untranslated values
across 49 locale files**.
The first 50-value Chichewa batch added activity history for titles,
descriptions, boards, lists, swimlanes, cards, attachments, labels, checklists,
comments, custom fields and members, together with organization and team
restrictions. These direct translations were completed with low confidence and
welcome review by a Chichewa speaker. This left **106,186 genuinely untranslated
values across 49 locale files**.
The second 50-value Chichewa batch added card movement and restoration,
activity summaries, checklist and comment history, received and start dates,
and All Boards workspace names, menus and settings. These direct translations
were completed with low confidence and welcome review by a Chichewa speaker.
This left **106,136 genuinely untranslated values across 49 locale files**.
The third 50-value Chichewa batch added workspace deletion and board selection,
Home-board controls, due and end dates, list-width preferences, keyboard
shortcuts, swimlane heights, subtasks, checklists, covers, labels and members.
These direct translations were completed with low confidence and welcome review
by a Chichewa speaker. This left **106,086 genuinely untranslated values across
49 locale files**.
The fourth 50-value Chichewa batch added administrator announcements and
permissions, public-board labels, connection recovery, board and selection
archiving, templates, attachments, background images, All Boards display and
board member and assignee summaries. These direct translations were completed
with low confidence and welcome review by a Chichewa speaker. This left
**106,036 genuinely untranslated values across 49 locale files**.
The fifth 50-value Chichewa batch added board visibility, drag-and-drop,
background, title, watch and view controls, desktop and mobile modes, zoom,
calendar navigation, archive guidance and card dates, time, attachments, custom
fields, labels and members. These direct translations were completed with low
confidence and welcome review by a Chichewa speaker. This left **105,986
genuinely untranslated values across 49 locale files**.
The sixth 50-value Chichewa batch added card membership and start dates,
attachments, custom fields, voting and Planning Poker, card dependencies,
organization and team membership, account and background deletion, domains and
checklist, swimlane, list, card and board imports. These direct translations were
completed with low confidence and welcome review by a Chichewa speaker. This
left **105,936 genuinely untranslated values across 49 locale files**.
The seventh 50-value Chichewa batch added member, sticker and invitation
dialogs, list sorting and archive restoration, linked cards and boards, secure
mapping of imported members, themes, fonts, text colors, avatars, languages and
permissions. These direct translations were completed with low confidence and
welcome review by a Chichewa speaker. This left **105,886 genuinely untranslated
values across 49 locale files**.
The eighth 50-value Chichewa batch added settings and subtasks, starred boards
and pages, automatic list width, clipboard input, three-tier card aging,
keyboard movement and dialog navigation, board restoration guidance and 23
interface colors. These direct translations were completed with low confidence
and welcome review by a Chichewa speaker. This left **105,836 genuinely
untranslated values across 49 locale files**.
The ninth 50-value Chichewa batch added the remaining colors, comment and
read-only roles, worker permissions, deletion confirmations, swimlane movement,
clipboard links, bulk card-template JSON, labels and custom-field types and
options. These direct translations were completed with low confidence and
welcome review by a Chichewa speaker. This left **105,786 genuinely untranslated
values across 49 locale files**.
The tenth 50-value Chichewa batch added text and date fields, permanent
deletion, WIP limits, card dates and notifications, enrollment, invitation,
password-reset and verification email templates, scrollbars and authorization,
JSON, CSV, TSV, empty-board, linked-card and disabled-account errors. These
direct translations were completed with low confidence and welcome review by a
Chichewa speaker. This left **105,736 genuinely untranslated values across 49
locale files**.
The eleventh 50-value Chichewa batch added user and organization validation,
card exports to PDF and Excel, attachment metadata, list sorting, and date,
label and member filters. These direct translations were completed with low
confidence and welcome review by a Chichewa speaker. This left **105,686
genuinely untranslated values across 49 locale files**.
The twelfth 50-value Chichewa batch added assignee and advanced filters,
activity visibility, imported-member status, and board-import guidance and
errors for Kanboard, NextCloud Deck, OpenProject, Asana, ZenKit, Trello, Jira,
Excel and WeKan. These direct translations were completed with low confidence
and welcome review by a Chichewa speaker. This left **105,636 genuinely
untranslated values across 49 locale files**.
The thirteenth 50-value Chichewa batch added Trello API credentials, workspace
and board selection, import progress, cancellation and error states, member
mapping, validation messages, keyboard shortcuts and label creation and
deletion. These direct translations were completed with low confidence and
welcome review by a Chichewa speaker. This left **105,586 genuinely
untranslated values across 49 locale files**.
The fourteenth 50-value Chichewa batch added board departure and links, list
archiving and deletion, user, team and organization settings, swimlane and
selection actions, login, muted and archived states, board roles and
participation notifications. These direct translations were completed with low
confidence and welcome review by a Chichewa speaker. This left **105,536
genuinely untranslated values across 49 locale files**.
The fifteenth 50-value Chichewa batch added watched-item notifications, private
and public page messaging, image previews, board and member controls, search,
WIP limits, keyboard shortcuts, sidebars, signup and default-board behavior.
These direct translations were completed with low confidence and welcome
review by a Chichewa speaker. This left **105,486 genuinely untranslated values
across 49 locale files**.
The sixteenth 50-value Chichewa batch added starred boards, time tracking,
assignee and label shortcuts, uploads, custom logos and links, watching,
welcome-board and template labels, and WIP-limit errors. These direct
translations were completed with low confidence and welcome review by a
Chichewa speaker. This left **105,436 genuinely untranslated values across 49
locale files**.
The seventeenth 50-value Chichewa batch added attachment and API transfer
limits, avatar upload policy, registration and invitations, SMTP configuration
and tests, invitation emails, authorization errors, webhooks, package and
runtime version labels. These direct translations were completed with low
confidence and welcome review by a Chichewa speaker. This left **105,386
genuinely untranslated values across 49 locale files**.
The eighteenth 50-value Chichewa batch added database, reactivity, DDP and
operating-system diagnostics, time units, custom-field display, account and
board visibility controls, and organization and team tenancy, domains,
administrators and membership synchronization. These direct translations were
completed with low confidence and welcome review by a Chichewa speaker. This
left **105,336 genuinely untranslated values across 49 locale files**.
The nineteenth 50-value Chichewa batch added received and end dates, color and
sorting controls, permanent board, notification and duplicate-list deletion,
subtask and card settings, minicard content, parent-card paths and label
activity. These direct translations were completed with low confidence and
welcome review by a Chichewa speaker. This left **105,286 genuinely
untranslated values across 49 locale files**.
The twentieth 50-value Chichewa batch added label, attachment and custom-field
activity, visual rule construction, card, label, member, checklist and
attachment triggers, scheduling, and JSON, CSV and Trello Butler rule import
and export. These direct translations were completed with low confidence and
welcome review by a Chichewa speaker. This left **105,236 genuinely
untranslated values across 49 locale files**.
The twenty-first 50-value Chichewa batch added n8n and Node-RED visual workflow
imports, scheduled and button triggers, daily through monthly recurrence,
due-date and list-duration conditions, card and board buttons, list sorting,
completion, movement and relative-date actions. These direct translations were
completed with low confidence and welcome review by a Chichewa speaker. This
left **105,186 genuinely untranslated values across 49 locale files**.
The twenty-second 50-value Chichewa batch added composable automation-rule
fragments for board and list movement, archiving, labels, members, attachments,
checklists and items, card movement, colors and email actions. These direct
translations were completed with low confidence and welcome review by a
Chichewa speaker. This left **105,136 genuinely untranslated values across 49
locale files**.
The twenty-third 50-value Chichewa batch added detailed automation actions for
email, archiving, labels, members, checklists, swimlanes, date fields and card
links, plus authentication, custom HTML, web manifest and assetlinks settings,
layout and card counters. These direct translations were completed with low
confidence and welcome review by a Chichewa speaker. This left **105,086
genuinely untranslated values across 49 locale files**.
The twenty-fourth 50-value Chichewa batch added board members, custom body
HTML, authentication display, board duplication, organization counts,
swimlane deletion, date-change and due-reminder activity, account deletion,
minicard labels, desktop drag handles, resizable menus and editor submission.
These direct translations were completed with low confidence and welcome
review by a Chichewa speaker. This left **105,036 genuinely untranslated values
across 49 locale files**.
The twenty-fifth 50-value Chichewa batch added multi-window cards, keyboard
submission guidance, organization, team and user dialogs, notification
filtering, rename permissions, board-role capabilities and status, weekday
names, ownership and voting labels, and linked-card deletion guidance. These
direct translations were completed with low confidence and welcome review by a
Chichewa speaker. This left **104,986 genuinely untranslated values across 49
locale files**.
The twenty-sixth 50-value Chichewa batch added linked-list deletion guidance,
checklist visibility, tasks, domains and shared templates, My Cards and Due
Cards views and sorting, global search scopes, and missing board, swimlane,
list and label errors. These direct translations were completed with low
confidence and welcome review by a Chichewa speaker. This left **104,936
genuinely untranslated values across 49 locale files**.
The twenty-seventh 50-value Chichewa batch added missing-user, comment,
organization and team errors, global-search result counts, and localized
single-token search operators and predicates for boards, cards, people, dates,
content and status. These direct translations were completed with low
confidence and welcome review by a Chichewa speaker. This left **104,886
genuinely untranslated values across 49 locale files**.
The twenty-eighth 50-value Chichewa batch added the remaining search
predicates, query validation errors, paging, and complete localized global
search instructions for operators, status, field existence, sorting, limits,
combination and date periods. These direct translations were completed with
low confidence and welcome review by a Chichewa speaker. This left **104,836
genuinely untranslated values across 49 locale files**.
The twenty-ninth 50-value Chichewa batch added label metadata, board and card
sorting, completion, stickers, card-dependency relationships and JSON or SVG
imports, board background images, and card locations. These direct
translations were completed with low confidence and welcome review by a
Chichewa speaker. This left **104,786 genuinely untranslated values across 49
locale files**.
The thirtieth 50-value Chichewa batch added map coordinates and link detection,
server-error troubleshooting, sorting and activity labels, swimlane movement,
custom string templates, file, security, speed, test, CPU, database, rule,
board, card, impersonation and recovery reports, and office-login locations.
These direct translations were completed with low confidence and welcome
review by a Chichewa speaker. This left **104,736 genuinely untranslated values
across 49 locale files**.
The thirty-first 50-value Chichewa batch added office and REST API activity,
automatic data recovery and maintenance, swimlane copying, card creators,
waiting animations, card sizing, organization and team deletion warnings, and
support-ticket details, states and requests. These direct translations were
completed with low confidence and welcome review by a Chichewa speaker. This
left **104,686 genuinely untranslated values across 49 locale files**.
The thirty-second 50-value Chichewa batch added team and organization
membership, invitations and legal notices, Node heap and memory diagnostics,
checklist movement and copying, subtask and attachment actions, and filesystem,
GridFS and S3 attachment storage movement. These direct translations were
completed with low confidence and welcome review by a Chichewa speaker. This
left **104,636 genuinely untranslated values across 49 locale files**.
The thirty-third 50-value Chichewa batch added bulk attachment movement across
filesystem, GridFS and S3, storage-location repair, default storage and file
counts, card, attachment, board and GridFS identifiers, MongoDB Compact
maintenance and file metadata. These direct translations were completed with
low confidence and welcome review by a Chichewa speaker. This left **104,586
genuinely untranslated values across 49 locale files**.
The thirty-fourth 50-value Chichewa batch added board status and time summaries,
uploads and file restrictions, Mongo sessions, PDF previews, workspace dragging,
custom translation strings, subtask and calendar display, ZIP board imports,
checklist folding, support pages and accessibility. These direct translations
were completed with low confidence and welcome review by a Chichewa speaker.
This left **104,536 genuinely untranslated values across 49 locale files**.
The thirty-fifth 50-value Chichewa batch added accessibility information,
brute-force login protection and locked-user administration, active-user
filters, scheduled jobs, attachment and avatar paths, and scheduled board
archive, backup and cleanup operations. These direct translations were
completed with low confidence and welcome review by a Chichewa speaker. This
left **104,486 genuinely untranslated values across 49 locale files**.
The thirty-sixth 50-value Chichewa batch added scheduled-job controls and
migration recovery, filesystem, S3 and Azure storage configuration, MongoDB and
FerretDB v1 text-data migration, and Sandstorm grain migration status and disk
cleanup guidance. These direct translations were completed with low confidence
and welcome review by a Chichewa speaker. This left **104,436 genuinely
untranslated values across 49 locale files**.
The thirty-seventh 50-value Chichewa batch added Sandstorm raw MongoDB cleanup,
adaptive card loading, link and code rendering security, import, export, avatar,
activity, notification and watch controls, user anonymization, and instance or
organization backups to local and cloud storage. These direct translations were
completed with low confidence and welcome review by a Chichewa speaker. This
left **104,386 genuinely untranslated values across 49 locale files**.
The thirty-eighth 50-value Chichewa batch added scheduled backup frequency and
restore modes, Google Cloud service-account configuration and permissions, AWS
S3, MinIO-compatible, Azure and Google Cloud console guidance, cloud-secret and
connection states, and Azure Blob Storage movement. These direct translations
were completed with low confidence and welcome review by a Chichewa speaker.
This left **104,336 genuinely untranslated values across 49 locale files**.
The thirty-ninth 50-value Chichewa batch added Google Cloud and GridFS storage,
migration start, pause, stop and status controls, CollectionFS movement, AWS S3
and MinIO credentials and connection settings, scheduled board operations,
writable paths, and attachment and board migration settings. These direct
translations were completed with low confidence and welcome review by a
Chichewa speaker. This left **104,286 genuinely untranslated values across 49
locale files**.
The fortieth 50-value Chichewa batch added minicard list display and
comprehensive board-integrity migrations for duplicate lists, lost cards,
archives, missing lists, avatar and attachment URLs, plus confirmations,
progress and validation steps. These direct translations were completed with
low confidence and welcome review by a Chichewa speaker. This left **104,236
genuinely untranslated values across 49 locale files**.
The forty-first 50-value Chichewa batch added remaining board-migration steps,
cleanup and one-time conversion, CPU and database migration status, scheduled
job intervals, export monitoring, filesystem and GridFS statistics, minicard
list visibility and job queue details. These direct translations were completed
with low confidence and welcome review by a Chichewa speaker. This left
**104,186 genuinely untranslated values across 49 locale files**.
The forty-second 50-value Chichewa batch added memory usage, bulk filesystem,
GridFS and S3 migration, batch size, CPU and delay controls, migration logs,
warnings and progress, monitoring refresh and export, schedules, minicard list
and checklist display, system resources and attachment totals. These direct
translations were completed with low confidence and welcome review by a
Chichewa speaker. This left **104,136 genuinely untranslated values across 49
locale files**.
The forty-third 50-value Chichewa batch added OTP account creation and login,
repository listing and upload, account validation and lockout, server and
protocol summaries, problem-review and repair status, broken-card repair, CPU
metrics and event metadata. These direct translations were completed with low
confidence and welcome review by a Chichewa speaker. This left **104,086
genuinely untranslated values across 49 locale files**.
The final 17-value Chichewa batch added event IP metadata, filesystem integrity,
scoped WeKan JSON and ZIP import and export, and the numeric global-search
operator and its syntax guidance. These direct translations were completed with
low confidence and welcome review by a Chichewa speaker, completing Chichewa.
This left **104,069 genuinely untranslated values across 48 locale files**.
The first 50-value Oromo batch added deletion, organization and team membership,
comment replies, due-date changes, activity notifications, attachments,
subtasks, labels, checklists, comments, creation, archiving and imports. These
direct translations were completed with low confidence and welcome review by an
Oromo speaker. This left **104,019 genuinely untranslated values across 48
locale files**.
The second 50-value Oromo batch added card movement and restoration, member
removal, generic and checklist activity history, comment and card dates,
starred and remaining boards, and workspace creation, editing, icons and
settings. These direct translations were completed with low confidence and
welcome review by an Oromo speaker. This left **103,969 genuinely untranslated
values across 48 locale files**.
The third 50-value Oromo batch added workspace settings and deletion, board
multi-selection, starred and Home boards, card dates and templates, personal
and fixed list widths, keyboard shortcuts, swimlane height, subtasks,
checklists, covers, labels and members. These direct translations were
completed with low confidence and welcome review by an Oromo speaker. This left
**103,919 genuinely untranslated values across 48 locale files**.
The fourth 50-value Oromo batch added administration and announcements, public
boards, offline recovery, archiving and restoration, template containers,
attachment deletion, automatic watching, avatars and backgrounds, All Boards
display, member and assignee summaries, stars and private-board status. These
direct translations were completed with low confidence and welcome review by an
Oromo speaker. This left **103,869 genuinely untranslated values across 48
locale files**.
The fifth 50-value Oromo batch added public-board guidance, board reordering,
workspace assignment, background and visibility controls, desktop and mobile
views, zooming, calendar navigation, archive warnings, deletion consequences,
due and spent time, attachments, custom fields, labels and members. These
direct translations were completed with low confidence and welcome review by
an Oromo speaker. This left **103,819 genuinely untranslated values across 48
locale files**.
The sixth 50-value Oromo batch added card membership and dates, attachments and
custom fields, voting and Planning Poker, estimates, card actions and
dependencies, organization, team, avatar and background controls, duplicate
list and account deletion, domains, imported-member mapping, and checklist,
swimlane, list, card and board imports. These direct translations were
completed with low confidence and welcome review by an Oromo speaker. This
left **103,769 genuinely untranslated values across 48 locale files**.
The seventh 50-value Oromo batch added member and sticker popups, list sorting,
archive restoration, rule transfer, linked cards and boards, safe mapping of
imported members to real users, theme and font controls, text colors, avatars,
language selection and permissions. These direct translations were completed
with low confidence and welcome review by an Oromo speaker. This left
**103,719 genuinely untranslated values across 48 locale files**.
The eighth 50-value Oromo batch added settings, subtasks, board and page stars,
automatic list width, clipboard input, three-tier card aging, card and list
movement, dialog navigation, board restoration and twenty-three color names.
These direct translations were completed with low confidence and welcome
review by an Oromo speaker. This left **103,669 genuinely untranslated values
across 48 locale files**.
The ninth 50-value Oromo batch added the remaining basic colors, comment and
read-only roles, worker permissions, deletion confirmations, list movement,
clipboard links, bulk template copying with intact JSON field names, template
containers, labels and number, currency, checkbox and dropdown custom fields.
These direct translations were completed with low confidence and welcome
review by an Oromo speaker. This left **103,619 genuinely untranslated values
across 48 locale files**.
The tenth 50-value Oromo batch added date formats, permanent deletion, custom
field and label actions, WIP limits, profiles, notification editing, account
enrollment, invitation, password-reset and verification emails, scrollbars,
board permissions, JSON, CSV and TSV validation, empty-board import recovery,
linked-card safety and disabled-account errors. These direct translations were
completed with low confidence and welcome review by an Oromo speaker. This
left **103,569 genuinely untranslated values across 48 locale files**.
The eleventh 50-value Oromo batch added user, organization, team and email
conflict errors, attachment-free board export, card export to PDF and Excel,
field and attachment metadata, disk-space errors, list sorting and filters for
dates, titles, labels and members. These direct translations were completed
with low confidence and welcome review by an Oromo speaker. This left
**103,519 genuinely untranslated values across 48 locale files**.
The twelfth 50-value Oromo batch added assignee and custom-field filters,
archive visibility, advanced filter syntax, activity and member states, user
impersonation, and board import guidance for Kanboard, NextCloud Deck,
OpenProject, issue trackers, Asana, ZenKit, Trello, Jira, Excel and WeKan,
including Trello ZIP progress and failure messages. These direct translations
were completed with low confidence and welcome review by an Oromo speaker.
This left **103,469 genuinely untranslated values across 48 locale files**.
The thirteenth 50-value Oromo batch added Trello ZIP safety, workspace
placement, direct API import and credentials, board selection, import progress,
cancellation, resumption and cleanup, member mapping, version and initials,
date, time, year and user validation, invitations, keyboard shortcuts and label
creation and deletion. These direct translations were completed with low
confidence and welcome review by an Oromo speaker. This left **103,419
genuinely untranslated values across 48 locale files**.
The fourteenth 50-value Oromo batch added last-administrator protection, board
departure, card and list links, list archiving and deletion, user, team and
organization settings, swimlane actions, Trello and spreadsheet card imports,
calendar and login controls, moving, copying and multi-selection, muted boards,
archive empty states, normal roles and participation notifications. These
direct translations were completed with low confidence and welcome review by
an Oromo speaker. This left **103,369 genuinely untranslated values across 48
locale files**.
The fifteenth 50-value Oromo batch added watch notifications, private-page
login links, image pasting and previews, public and private board guidance,
quick access, covers, member removal including Sandstorm access guidance,
description recovery, search, WIP limits, keyboard shortcuts, sidebars, account
creation and default-board controls. These direct translations were completed
with low confidence and welcome review by an Oromo speaker. This left
**103,319 genuinely untranslated values across 48 locale files**.
The sixteenth 50-value Oromo batch added starred boards, subscriptions, spent
and overtime tracking, assignee and label shortcuts, participation tracking,
uploads, custom logo and help URLs, automatic URL schemes, imported usernames,
archive warnings, watching, welcome-board content, template swimlanes and WIP
limit errors. These direct translations were completed with low confidence and
welcome review by an Oromo speaker. This left **103,269 genuinely untranslated
values across 48 locale files**.
The seventeenth 50-value Oromo batch added attachment and API transfer limits,
avatar-upload blocking, registration and invitations, SMTP configuration and
testing, invitation emails and authorization errors, outgoing, bidirectional
and global webhooks, card-title filters and package, database, Node and Meteor
version labels. These direct translations were completed with low confidence
and welcome review by an Oromo speaker. This left **103,219 genuinely
untranslated values across 48 locale files**.
The eighteenth 50-value Oromo batch added database, FerretDB, reactivity, DDP
and operating-system diagnostics, time units, custom-field card display,
account changes, board visibility, activity states, organization and team
templates, membership propagation and authentication synchronization, and
multitenant organization domains and administration. These direct translations
were completed with low confidence and welcome review by an Oromo speaker.
This left **103,169 genuinely untranslated values across 48 locale files**.
The nineteenth 50-value Oromo batch added received and end dates, card,
selection, swimlane and list colors, assignment and request attribution,
numeric card sorting, destructive board, notification and duplicate-list
confirmations, subtask and card settings, minicard metadata, parent-card path
display and label-addition activity. These direct translations were completed
with low confidence and welcome review by an Oromo speaker. This left
**103,119 genuinely untranslated values across 48 locale files**.
The twentieth 50-value Oromo batch added label, attachment and custom-field
activity history, rule creation, editing, deletion, workflow and list views,
drag-and-drop trigger and action building, card, label, member, checklist,
attachment and daily triggers, and JSON, CSV and Trello Butler rule transfer.
These direct translations were completed with low confidence and welcome
review by an Oromo speaker. This left **103,069 genuinely untranslated values
across 48 locale files**.
The twenty-first 50-value Oromo batch added n8n and Node-RED visual workflow
imports, scheduled and button triggers, one-time, daily, weekday, weekly and
monthly schedules, due-date and list-duration conditions, card and board
buttons, list sorting, completion actions, bulk card movement, relative dates
and rule time units. These direct translations were completed with low
confidence and welcome review by an Oromo speaker. This left **103,019
genuinely untranslated values across 48 locale files**.
The twenty-second 50-value Oromo batch added rule phrases for board and list
movement, archiving and restoration, label, member, attachment, checklist and
checklist-item conditions, completion and checkbox states, moving cards within
lists, removing members, setting colors, checklist actions and sending email.
These direct translations were completed with low confidence and welcome
review by an Oromo speaker. This left **102,969 genuinely untranslated values
across 48 locale files**.
The twenty-third 50-value Oromo batch added rule email fields, archive, label,
member, checklist, swimlane, card-creation and date-field actions, comma-
separated checklist input, authentication labels, custom product naming, HTML
head and link tags, JSON web manifests and asset links, layout, logo visibility
and card counters. These direct translations were completed with low
confidence and welcome review by an Oromo speaker. This left **102,919
genuinely untranslated values across 48 locale files**.
The twenty-fourth 50-value Oromo batch added board member lists, custom HTML
body insertion, LDAP and OIDC authentication settings, board duplication,
organization, team and people counts, swimlane deletion and restoration,
multiline card-date activity and reminders, relative insertion positions,
account, team and organization deletion, resizing and Enter submission. These
direct translations were completed with low confidence and welcome review by
an Oromo speaker. This left **102,869 genuinely untranslated values across 48
locale files**.
The twenty-fifth 50-value Oromo batch added simultaneous card windows, Enter,
Shift+Enter and Ctrl/Cmd+Enter editor behavior, card detail display,
organization, team and user editing, notification read states, renaming and
role permissions, weekday settings, ownership and activity metadata, voting
and linked-card deletion protection. These direct translations were completed
with low confidence and welcome review by an Oromo speaker. This left
**102,819 genuinely untranslated values across 48 locale files**.
The twenty-sixth 50-value Oromo batch added linked-list deletion protection,
checklist visibility, tasks, board domains and validation, shared templates by
organization, team and domain, organization identity, My Cards sorting, Due
Cards and global search views, and board, swimlane, list and label not-found
errors. These direct translations were completed with low confidence and
welcome review by an Oromo speaker. This left **102,769 genuinely untranslated
values across 48 locale files**.
The twenty-seventh 50-value Oromo batch added username, comment, organization
and team lookup errors, card result counts and localized global-search
operators and predicates for boards, swimlanes, lists, people, status, dates,
sorting, comments, organizations, teams, text, custom fields, attachments and
checklists. These direct translations were completed with low confidence and
welcome review by an Oromo speaker. This left **102,719 genuinely untranslated
values across 48 locale files**.
The twenty-eighth 16-value Oromo batch added the remaining member, visibility
and query predicates, operator validation errors, pagination and global-search
instruction headings. These direct translations were completed with low
confidence and welcome review by an Oromo speaker. This left **102,703
genuinely untranslated values across 48 locale files**.
The twenty-ninth Oromo batch translated the global-search syntax introduction
with its code examples intact. This direct translation was completed with low
confidence and welcomes review by an Oromo speaker. This left **102,702
genuinely untranslated values across 48 locale files**.
The thirtieth 10-value Oromo batch translated the global-search operator list
and board, list, swimlane, comment, label, user and member syntax guidance with
its code and Markdown examples intact. These direct translations were
completed with low confidence and welcome review by an Oromo speaker. This
left **102,692 genuinely untranslated values across 48 locale files**.
The thirty-first 5-value Oromo batch translated assignee, creator,
organization, team and due-date search guidance with syntax intact. This left
**102,687 genuinely untranslated values across 48 locale files**.
The thirty-second 5-value Oromo batch translated created, modified and status
search guidance. This left **102,682 genuinely untranslated values across 48
locale files**.
The thirty-third 5-value Oromo batch translated ended, public, private,
field-existence and sorting search guidance with syntax intact. This left
**102,677 genuinely untranslated values across 48 locale files**.
The thirty-fourth 20-value Oromo batch translated search limits and notes,
search links, numbers, label metadata, archive timestamps and card and board
sorting controls with syntax and examples intact. These direct translations
were completed with low confidence and welcome review by an Oromo speaker.
This left **102,657 genuinely untranslated values across 48 locale files**.
The thirty-fifth 50-value Oromo batch added completion states, stickers, card
dependencies and imports, board backgrounds, map locations, server-error
troubleshooting and alphabetical title sorting. These direct translations
were completed with low confidence and welcome review by an Oromo speaker.
This left **102,607 genuinely untranslated values across 48 locale files**.
The thirty-sixth 50-value Oromo batch added creation sorting, links, board
activity visibility, swimlane movement, custom-field string templates,
administrative file, security, speed, rules, board, card, impersonation,
office, API and recovery reports. These direct translations were completed
with low confidence and welcome review by an Oromo speaker. This left
**102,557 genuinely untranslated values across 48 locale files**.
The thirty-seventh 50-value Oromo batch added recovery status, swimlane
copying, card creator display, wait-spinner styles, card sizing, organization
and team deletion warnings, support tickets and requests, card details, team
membership, invitations and Node heap labels. These direct translations were
completed with low confidence and welcome review by an Oromo speaker. This
left **102,507 genuinely untranslated values across 48 locale files**.
The thirty-eighth 50-value Oromo batch added Node heap and memory metrics,
organization membership, legal notices, checklist and subtask actions, and
bulk attachment movement among filesystem, GridFS and S3 storage. These direct
translations were completed with low confidence and welcome review by an
Oromo speaker. This left **102,457 genuinely untranslated values across 48
locale files**.
The thirty-ninth 50-value Oromo batch added attachment location repair,
storage selection and progress, file identifiers, MongoDB GridFS compaction,
board status and elapsed-time summaries, uploads and account prompts. These
direct translations were completed with low confidence and welcome review by
an Oromo speaker. This left **102,407 genuinely untranslated values across 48
locale files**.
The fortieth 50-value Oromo batch added upload limits, PDF previews, workspace
assignment, custom translations, checklist display, support and accessibility
pages, and brute-force account-lockout settings. These direct translations
were completed with low confidence and welcome review by an Oromo speaker.
This left **102,357 genuinely untranslated values across 48 locale files**.
The forty-first 50-value Oromo batch added locked-user administration,
active-user filtering, attachment and avatar storage paths, scheduled board
archive, backup and cleanup operations, and scheduled-job and migration
statuses. These direct translations were completed with low confidence and
welcome review by an Oromo speaker. This left **102,307 genuinely untranslated
values across 48 locale files**.
The forty-second 50-value Oromo batch added scheduled-migration recovery,
filesystem, S3 and Azure storage settings, MongoDB–FerretDB database migration,
Sandstorm grain migration and cleanup, and automatic card-loading modes. These
direct translations were completed with low confidence and welcome review by
an Oromo speaker. This left **102,257 genuinely untranslated values across 48
locale files**.
The forty-third 50-value Oromo batch added automatic and lazy card loading,
plain-text security rendering, import and export controls, user anonymization,
activity, notification and watch controls, and instance or organization
backups and schedules. These direct translations were completed with low
confidence and welcome review by an Oromo speaker. This left **102,207
genuinely untranslated values across 48 locale files**.
The forty-fourth 50-value Oromo batch added backup restoration, Google Cloud,
AWS S3 and Azure credential guidance, cloud connection tests, Azure, Google
Cloud and GridFS attachment storage, and migration controls. These direct
translations were completed with low confidence and welcome review by an
Oromo speaker. This left **102,157 genuinely untranslated values across 48
locale files**.
The forty-fifth 50-value Oromo batch added migration lifecycle and CollectionFS
guidance, AWS S3 authentication, scheduled board operations, attachment and
board migrations, duplicate-list cleanup, and restoration of lost or archived
items. These direct translations were completed with low confidence and
welcome review by an Oromo speaker. This left **102,107 genuinely untranslated
values across 48 locale files**.
The forty-sixth 50-value Oromo batch added missing-list repair, avatar and file
URL repair, board-integrity migration confirmations and progress, shared-list
conversion, orphaned-card repair, and lost-item restoration steps. These direct
translations were completed with low confidence and welcome review by an Oromo
speaker. This left **102,057 genuinely untranslated values across 48 locale
files**.
The forty-seventh 50-value Oromo batch added file scanning and URL repair,
board conversion, CPU and memory monitoring, scheduled-job intervals,
filesystem, GridFS and S3 migration targets, and migration batch, CPU and delay
limits. These direct translations were completed with low confidence and
welcome review by an Oromo speaker. This left **102,007 genuinely untranslated
values across 48 locale files**.
The forty-eighth 50-value Oromo batch added migration logs and controls,
monitoring export and refresh, operation progress, attachment totals, system
resources, OTP account creation and repository listings. These direct
translations were completed with low confidence and welcome review by an
Oromo speaker. This left **101,957 genuinely untranslated values across 48
locale files**.
The forty-ninth 50-value Oromo batch added repository uploads, API endpoints,
account and OTP validation, problem and repair reporting, CPU events, network
addresses, filesystem integrity and scoped WeKan imports. This left **101,907
genuinely untranslated values across 48 locale files**. The fiftieth and final
5-value Oromo batch added numeric global search and board import guidance,
completing Oromo. These direct translations were completed with low confidence
and welcome review by an Oromo speaker. This left **101,902 genuinely
untranslated values across 47 locale files**.
The first 50-value Pashto batch added title and description changes, board,
list, swimlane and card deletion, member restrictions, due dates, comments,
attachments, subtasks, labels, checklists, custom fields, archiving and
imports. These direct translations were completed with low confidence and
welcome review by a Pashto speaker. This left **101,852 genuinely untranslated
values across 47 locale files**.
The second 50-value Pashto batch added card movement and restoration, member
removal, general activity history, checklist and comment changes, received and
start dates, and workspace and subworkspace controls. These direct
translations were completed with low confidence and welcome review by a Pashto
speaker. This left **101,802 genuinely untranslated values across 47 locale
files**.
The third 50-value Pashto batch added workspace deletion and multi-selection,
Home boards, due and end dates, templates, personal and fixed list widths,
keyboard shortcuts, swimlane heights, subtasks, checklists, covers, labels and
members. These direct translations were completed with low confidence and
welcome review by a Pashto speaker. This left **101,752 genuinely untranslated
values across 47 locale files**.
The fourth 50-value Pashto batch added administration, announcements, archive
and restoration, templates, attachments, board colors and backgrounds, All
Boards settings, member and assignee summaries, star counts and private-board
guidance. These direct translations were completed with low confidence and
welcome review by a Pashto speaker. This left **101,702 genuinely untranslated
values across 47 locale files**.
The fifth 50-value Pashto batch added public-board guidance, drag-and-drop
workspace assignment, board appearance and views, mobile, desktop and zoom
controls, calendar navigation, archive guidance, card dates, attachments,
custom fields, labels and members. These direct translations were completed
with low confidence and welcome review by a Pashto speaker. This left
**101,652 genuinely untranslated values across 47 locale files**.
The sixth 50-value Pashto batch added card membership, custom-field dates,
voting and Planning Poker, dependencies, organization, team, avatar and board
background dialogs, duplicate-list and account deletion, domains, imported
member mapping, and checklist, swimlane, list, card and board imports. These
direct translations were completed with low confidence and welcome review by
a Pashto speaker. This left **101,602 genuinely untranslated values across 47
locale files**.
The seventh 50-value Pashto batch added member, sticker, invitation, sorting,
archive restoration, rule transfer, templates, CAS login, linked items,
imported-member mapping, themes, font previews and sizes, text colors, avatars,
languages and permissions. These direct translations were completed with low
confidence and welcome review by a Pashto speaker. This left **101,552
genuinely untranslated values across 47 locale files**.
The eighth 50-value Pashto batch added settings, subtasks, board and page
stars, automatic list widths, clipboard input, three-tier card aging,
directional movement, dialog accessibility, board closure and twenty-three
color names. These direct translations were completed with low confidence and
welcome review by a Pashto speaker. This left **101,502 genuinely untranslated
values across 47 locale files**.
The ninth 50-value Pashto batch added colors, comment and read-only roles,
workers, deletion confirmations, clipboard links, linked cards, bulk template
copying with JSON examples, templates, labels and custom-field types and
options. These direct translations were completed with low confidence and
welcome review by a Pashto speaker. This left **101,452 genuinely untranslated
values across 47 locale files**.
The tenth 50-value Pashto batch added date and avatar settings, permanent
deletion, WIP limits, profile, field, reaction, time, label and notification
editing, account, invitation, reset and verification emails, and board, JSON,
CSV, TSV, import, list, linked-card and disabled-user errors. These direct
translations were completed with low confidence and welcome review by a Pashto
speaker. This left **101,402 genuinely untranslated values across 47 locale
files**.
The eleventh 50-value Pashto batch added user, username, organization, team and
email errors, board and card exports, Excel and PDF options, card people,
board, date and attachment fields, disk-space reporting, list sorting and date,
title, label and member filters. These direct translations were completed with
low confidence and welcome review by a Pashto speaker. This left **101,352
genuinely untranslated values across 47 locale files**.
The twelfth 50-value Pashto batch added assignee, custom-field, archive and
advanced filters, activity visibility, imported-member states and Kanboard,
NextCloud Deck, OpenProject, issue, Asana, ZenKit, Trello, CSV, TSV, Jira,
Excel and WeKan import guidance and ZIP errors. These direct translations were
completed with low confidence and welcome review by a Pashto speaker. This
left **101,302 genuinely untranslated values across 47 locale files**.
The thirteenth 50-value Pashto batch added Trello ZIP safety, workspace and
direct API imports, import cancellation, resumption and cleanup, imported
member mapping, version and initials, date, time, year and user validation,
invitations, keyboard shortcuts and label creation and deletion. These direct
translations were completed with low confidence and welcome review by a Pashto
speaker. This left **101,252 genuinely untranslated values across 47 locale
files**.
The fourteenth 50-value Pashto batch added administrator-role protection,
leaving boards, card and list links, bulk list archiving and movement, user,
team and organization settings, swimlane actions, Trello and spreadsheet card
imports, login, multi-selection, muted boards, archives, board roles and
participation notifications. These direct translations were completed with
low confidence and welcome review by a Pashto speaker. This left **101,202
genuinely untranslated values across 47 locale files**.
The fifteenth 50-value Pashto batch added watch notifications, private-page
login, image previews, public and private board descriptions, quick access,
member removal including Sandstorm access guidance, card-description rescue,
search, WIP limits, keyboard shortcuts, sidebars, account creation and starred
and default-board behavior. These direct translations were completed with low
confidence and welcome review by a Pashto speaker. This left **101,152
genuinely untranslated values across 47 locale files**.
The sixteenth 50-value Pashto batch added starred boards, subscriptions, time
tracking and overtime, numeric assignee and label shortcuts, uploads, custom
logo and help URLs, automatic URL schemes, archive warnings, watching,
welcome-board labels, card, list and board templates and WIP-limit errors.
These direct translations were completed with low confidence and welcome
review by a Pashto speaker. This left **101,102 genuinely untranslated values
across 47 locale files**.
The seventeenth 50-value Pashto batch added attachment and API transfer limits,
avatar upload blocking, registration and invitations, SMTP and TLS settings,
invitation and test emails, authorization, outgoing and bidirectional webhooks,
card-title filtering and package, database, Node and Meteor labels. These
direct translations were completed with low confidence and welcome review by
a Pashto speaker. This left **101,052 genuinely untranslated values across 47
locale files**.
The eighteenth 50-value Pashto batch added database and FerretDB metadata,
reactivity and DDP settings, operating-system resources, time units,
custom-field display, account changes, board visibility, organization and team
activity, shared templates, authentication synchronization, multitenancy,
domains and organization administrators. These direct translations were
completed with low confidence and welcome review by a Pashto speaker. This
left **101,002 genuinely untranslated values across 47 locale files**.
The nineteenth 50-value Pashto batch added received and end dates, card, list,
swimlane and selection colors, assignment metadata, board and notification
deletion, duplicate-list cleanup, subtask and card settings, minicard parent,
description, cover, attachment, sorting and checklist displays and card-parent
paths. These direct translations were completed with low confidence and
welcome review by a Pashto speaker. This left **100,952 genuinely untranslated
values across 47 locale files**.
The twentieth 50-value Pashto batch added label, attachment and custom-field
activity, board-rule selection and workflow editing, card, label, member,
checklist, attachment, scheduled-time and received-date triggers and JSON, CSV
and Trello Butler rule transfer. These direct translations were completed with
low confidence and welcome review by a Pashto speaker. This left **100,902
genuinely untranslated values across 47 locale files**.
The twenty-first 50-value Pashto batch added n8n and Node-RED visual-workflow
imports, scheduled and button triggers, recurring schedules, due-date and
list-duration conditions, card and board buttons, list sorting, completion,
bulk movement, relative dates, time units and movement triggers. These direct
translations were completed with low confidence and welcome review by a Pashto
speaker. This left **100,852 genuinely untranslated values across 47 locale
files**.
The twenty-second 50-value Pashto batch added board and list rule targets,
movement, archive, label, member, attachment, checklist and checklist-item
triggers and actions, card positioning, membership removal, colors, checklist
completion and email actions. These direct translations were completed with
low confidence and welcome review by a Pashto speaker. This left **100,802
genuinely untranslated values across 47 locale files**.
The twenty-third 50-value Pashto batch added rule email, archive, label,
member, checklist, card, swimlane and date-field actions, authentication,
custom product naming, HTML head and link tags, JSON web manifests and
assetlinks, layout, logo visibility and card counters. These direct
translations were completed with low confidence and welcome review by a Pashto
speaker. This left **100,752 genuinely untranslated values across 47 locale
files**.
The twenty-fourth 50-value Pashto batch added board member lists, custom HTML
body insertion, LDAP and OIDC authentication, board duplication, organization,
team and people counts, swimlane deletion and restoration, multiline card-date
activity and reminders, relative insertion positions, account, team and
organization deletion, resizing and Enter submission. These direct
translations were completed with low confidence and welcome review by a Pashto
speaker. This left **100,702 genuinely untranslated values across 47 locale
files**.
The twenty-fifth 50-value Pashto batch added simultaneous card windows, Enter,
Shift+Enter and Ctrl/Cmd+Enter editor behavior, card detail display,
organization, team and user editing, notification read states, renaming and
role permissions, weekday settings, ownership and activity metadata, voting
and linked-card deletion protection. These direct translations were completed
with low confidence and welcome review by a Pashto speaker. This left
**100,652 genuinely untranslated values across 47 locale files**.
The twenty-sixth 50-value Pashto batch added linked-list deletion protection,
checklist visibility, tasks, board domains and validation, shared templates by
organization, team and domain, organization identity, My Cards sorting, Due
Cards and global search views, and board, swimlane, list and label not-found
errors. These direct translations were completed with low confidence and
welcome review by a Pashto speaker. This left **100,602 genuinely untranslated
values across 47 locale files**.
The twenty-seventh 50-value Pashto batch added username, comment, organization
and team lookup errors, card result counts and localized global-search
operators and predicates for boards, swimlanes, lists, people, status, dates,
sorting, comments, organizations, teams, text, custom fields, attachments and
checklists. These direct translations were completed with low confidence and
welcome review by a Pashto speaker. This left **100,552 genuinely untranslated
values across 47 locale files**.
The twenty-eighth 50-value Pashto batch added the remaining member, visibility
and query predicates, operator validation errors, pagination and complete
global-search syntax, operator, status, field, sorting, limit and composition
guidance with code and Markdown examples intact. These direct translations
were completed with low confidence and welcome review by a Pashto speaker.
This left **100,502 genuinely untranslated values across 47 locale files**.
The twenty-ninth 50-value Pashto batch added numbers, label metadata, board and
card sorting, completion states, stickers, card dependency relationships and
imports, board backgrounds, and location fields. These direct translations
were completed with low confidence and welcome review by a Pashto speaker.
This left **100,452 genuinely untranslated values across 47 locale files**.
The thirtieth 50-value Pashto batch added map-coordinate detection, server
troubleshooting, title and creation sorting, board activities, swimlane moves,
custom-field string templates, creator metadata, and administrative file,
security, speed, test, CPU, database, rule, board, card, impersonation,
recovery and office reports. These direct translations were completed with
low confidence and welcome review by a Pashto speaker. This left **100,402
genuinely untranslated values across 47 locale files**.
The thirty-first 50-value Pashto batch added office and REST API activity,
database-recovery status and maintenance, swimlane copying, card-creator and
wait-spinner settings, card sizing, organization and team deletion warnings,
and ticket, request, history, sorting and card-detail controls. These direct
translations were completed with low confidence and welcome review by a
Pashto speaker. This left **100,352 genuinely untranslated values across 47
locale files**.
The thirty-second 50-value Pashto batch added team and organization membership,
invitations, card-title filtering, Node heap and memory diagnostics, custom
legal notices, checklist movement and copying, card-list display, subtask and
attachment actions, and filesystem, GridFS and S3 attachment moves. These
direct translations were completed with low confidence and welcome review by
a Pashto speaker. This left **100,302 genuinely untranslated values across 47
locale files**.
The thirty-third 50-value Pashto batch added bulk attachment moves across
filesystem, GridFS and S3 storage, attachment-location repair, avatar scope,
default storage and move progress, file counts and identifiers, MongoDB
Compact guidance and status, and file, storage and board metadata. These
direct translations were completed with low confidence and welcome review by
a Pashto speaker. This left **100,252 genuinely untranslated values across 47
locale files**.
The thirty-fourth 50-value Pashto batch added board time status, upload
progress, account prompts, Mongo sessions, upload and avatar file constraints,
PDF fallback, workspace dragging, custom translation management, subtasks,
ISO week display, Markdown and ZIP imports, checklist collapsing, support and
accessibility settings. These direct translations were completed with low
confidence and welcome review by a Pashto speaker. This left **100,202
genuinely untranslated values across 47 locale files**.
The thirty-fifth 50-value Pashto batch added accessibility content, brute-force
account-lockout settings and user controls, Admin Panel people status filters,
scheduled jobs and migrations, attachment and avatar storage paths, and
scheduled board archive, backup and cleanup operations. These direct
translations were completed with low confidence and welcome review by a
Pashto speaker. This left **100,152 genuinely untranslated values across 47
locale files**.
The thirty-sixth 50-value Pashto batch added scheduled-job lifecycle and
migration errors, filesystem and S3 storage settings, Azure credentials, and
MongoDB, FerretDB v1 and Sandstorm data-migration guidance and status. These
direct translations were completed with low confidence and welcome review by
a Pashto speaker. This left **100,102 genuinely untranslated values across 47
locale files**.
The thirty-seventh 50-value Pashto batch added Sandstorm legacy-file cleanup,
adaptive card loading, safe plain-text rendering, global import, export,
avatar, activity, notification and watch controls, imported and exported user
anonymization, and instance or organization backups. These direct translations
were completed with low confidence and welcome review by a Pashto speaker.
This left **100,052 genuinely untranslated values across 47 locale files**.
The thirty-eighth 50-value Pashto batch added scheduled backup frequency and
restore modes, Google Cloud service-account credentials and permissions,
Azure, AWS S3 and compatible-provider configuration paths, cloud connection
tests, and Azure Blob Storage attachment moves. These direct translations were
completed with low confidence and welcome review by a Pashto speaker. This
left **100,002 genuinely untranslated values across 47 locale files**.
The thirty-ninth 50-value Pashto batch added Google Cloud Storage moves,
GridFS and CollectionFS storage, migration lifecycle and progress, AWS S3 and
MinIO credentials and connections, scheduled board operations, writable
storage paths, and attachment and board migration settings. These direct
translations were completed with low confidence and welcome review by a
Pashto speaker. This left **99,952 genuinely untranslated values across 47
locale files**.
The fortieth 50-value Pashto batch added comprehensive board integrity
migrations, duplicate-list cleanup, lost-card and archived-item restoration,
missing-list repair, avatar and attachment URL repair, confirmation dialogs,
progress reporting and structural migration steps. These direct translations
were completed with low confidence and welcome review by a Pashto speaker.
This left **99,902 genuinely untranslated values across 47 locale files**.
The forty-first 50-value Pashto batch added the remaining board-repair steps,
old-job cleanup, one-time board conversion, CPU and migration monitoring,
scheduled intervals, export and filesystem/GridFS statistics, forced board
scans, minicard list visibility and job-queue metadata. These direct
translations were completed with low confidence and welcome review by a
Pashto speaker. This left **99,852 genuinely untranslated values across 47
locale files**.
The forty-second 50-value Pashto batch added memory and system-resource usage,
bulk filesystem, GridFS and S3 migration, batch size, CPU and delay controls,
migration logs and warnings, monitoring export and refresh, scheduling,
attachment totals, storage distribution and board-migration progress. These
direct translations were completed with low confidence and welcome review by
a Pashto speaker. This left **99,802 genuinely untranslated values across 47
locale files**.
The forty-third and final 67-value Pashto batch added migration resource
controls, account creation and authentication, code repositories, API
endpoints, Admin Panel problem and event details, broken-card repair, and
scoped WeKan import and export controls. These direct translations were
completed with low confidence and welcome review by a Pashto speaker. Pashto
is now complete, leaving **99,735 genuinely untranslated values across 46
locale files**.
The first 50-value Kirundi batch added acceptance, title, description and due
date changes, organization and team membership rules, replies, notifications,
and board, card, list, swimlane, attachment, subtask, label, checklist,
comment, custom-field, archive and import activities. These direct translations
were completed with low confidence and welcome review by a Kirundi speaker.
This left **99,685 genuinely untranslated values across 46 locale files**.
The second 50-value Kirundi batch added card movement and restoration,
membership changes, compact activity phrases for creation, movement, imports,
attachments and checklists, comment and date edits, starred and remaining
boards, and workspace creation, naming, icons, menus and settings. These direct
translations were completed with low confidence and welcome review by a
Kirundi speaker. This left **99,635 genuinely untranslated values across 46
locale files**.
The third 50-value Kirundi batch added workspace deletion, multi-board
selection, permanent-delete guidance, starred and Home-board controls, due and
end dates, templates, card insertion, shared, personal and fixed list widths,
keyboard shortcuts, swimlane height, subtasks, checklists, covers, labels and
members. These direct translations were completed with low confidence and
welcome review by a Kirundi speaker. This left **99,585 genuinely untranslated
values across 46 locale files**.
The fourth 50-value Kirundi batch added administrators and announcements,
public boards, offline recovery, archive and restore controls, template
containers, assignment, attachment deletion, automatic watching, avatar size,
board colors and backgrounds, All Boards settings, member and assignee groups,
stars, missing-board errors and private-board markup. These direct translations
were completed with low confidence and welcome review by a Kirundi speaker.
This left **99,535 genuinely untranslated values across 46 locale files**.
The fifth 50-value Kirundi batch added public-board markup, board dragging and
workspace assignment, colors, fonts, visibility, watching and views, mobile,
desktop and zoom modes, calendar navigation, archive and permanent-delete
guidance, due and spent time, and attachment, custom-field, label and member
editing. These direct translations were completed with low confidence and
welcome review by a Kirundi speaker. This left **99,485 genuinely untranslated
values across 46 locale files**.
The sixth 50-value Kirundi batch added card membership and dates, attachments,
custom fields, voting and Planning Poker, estimation, card actions and
dependencies, organization and team membership, avatars and backgrounds,
duplicate-list and account deletion, domains, imported-member mapping and
checklist, swimlane, list, card and board imports. These direct translations
were completed with low confidence and welcome review by a Kirundi speaker.
This left **99,435 genuinely untranslated values across 46 locale files**.
The seventh 50-value Kirundi batch added member, sticker, invite, sorting,
width, height, archive-restore, rule import/export, bookmark and template
dialogs, CAS sign-in, linked items, imported-member mapping, themes, fonts and
font sizes, text colors, avatar deletion, language and permission settings.
These direct translations were completed with low confidence and welcome
review by a Kirundi speaker. This left **99,385 genuinely untranslated values
across 46 locale files**.
The eighth 50-value Kirundi batch added settings, subtasks, starred boards and
pages, automatic list width, clipboard drag-and-drop, three-tier card aging,
card and list movement, accessible dialog navigation, board and card closing,
and twenty-three color names. Three shared English color loanwords were made
explicit Kirundi phrases so they no longer remain placeholders. These direct
translations were completed with low confidence and welcome review by a
Kirundi speaker. This left **99,335 genuinely untranslated values across 46
locale files**.
The ninth 50-value Kirundi batch added the remaining colors, comment-only and
read-only roles, assigned-card restrictions, worker permissions, subtask and
checklist deletion, list movement, clipboard links and text, linked and copied
cards and lists, a translated JSON card template, template containers, labels,
custom fields, currency, dropdowns and numbers. These direct translations were
completed with low confidence and welcome review by a Kirundi speaker. This
left **99,285 genuinely untranslated values across 46 locale files**.
The tenth 50-value Kirundi batch added text and date formats, permanent-delete
administration, custom-field and label deletion, WIP limits, card dates,
reactions, notifications, enrollment, invitation, password-reset and
verification emails, scrollbars, board-role errors, JSON, CSV and TSV import
validation, empty exports, linked-card safety and disabled users. These direct
translations were completed with low confidence and welcome review by a
Kirundi speaker. This left **99,235 genuinely untranslated values across 46
locale files**.
The eleventh 50-value Kirundi batch added user, username, organization, team
and email errors, board exports without attachments, card exports to PDF and
Excel, people, board, date and attachment export fields, disk-space errors,
list sorting, and card, list, date, due-state, label and member filters. These
direct translations were completed with low confidence and welcome review by
a Kirundi speaker. This left **99,185 genuinely untranslated values across 46
locale files**.
The twelfth 50-value Kirundi batch added assignee, custom-field, archive,
empty-list and advanced-expression filters, activities and member states,
impersonation, and board imports from Kanboard, NextCloud Deck, OpenProject,
issue trackers, Asana, ZenKit, Trello, CSV, TSV, Jira, Excel and WeKan,
including JSON and ZIP inputs, attachments, progress and failure handling.
These direct translations were completed with low confidence and welcome
review by a Kirundi speaker. This left **99,135 genuinely untranslated values
across 46 locale files**.
The thirteenth 50-value Kirundi batch added Trello ZIP safety, personal and
parent workspaces, direct Trello API credentials and imports, board selection,
progress, cancellation, deletion, resumption and errors, member mapping,
version and initials, date, time, year and user validation, invitations,
keyboard shortcuts, label creation and deletion. These direct translations
were completed with low confidence and welcome review by a Kirundi speaker.
This left **99,085 genuinely untranslated values across 46 locale files**.
The fourteenth 50-value Kirundi batch added last-administrator protection,
leaving boards, card and list links, bulk list archive, move and selection,
user, team and organization settings, swimlane actions, Trello and Excel
imports, list deletion, calendar and login, multi-selection, muted boards,
archived-item emptiness, normal and assigned-only roles, invitations and
participation notifications. These direct translations were completed with
low confidence and welcome review by a Kirundi speaker. This left **99,035
genuinely untranslated values across 46 locale files**.
The fifteenth 50-value Kirundi batch added watch notifications, private-page
login markup, previews, public and private board descriptions, quick access,
member removal including Sandstorm access guidance, description rescue,
search, WIP limits, keyboard shortcuts, filter, search and board sidebars,
signup, starred boards and automatic post-login opening. These direct
translations were completed with low confidence and welcome review by a
Kirundi speaker. This left **98,985 genuinely untranslated values across 46
locale files**.
The sixteenth 50-value Kirundi batch added starred boards, subscriptions,
teams, spent and overtime tracking, numbered assignee and label shortcuts,
uploads, custom logos and URL schemes, imported usernames, archived-list
warnings, welcome content, card, list and board templates, and WIP-limit
errors. These direct translations were completed with low confidence and
welcome review by a Kirundi speaker. This left **98,935 genuinely untranslated
values across 46 locale files**.
The seventeenth 50-value Kirundi batch added attachment and API transfer
limits, blocked avatar uploads, registration and invitations, SMTP and TLS
settings and tests, invitation emails and codes, authorization errors,
outgoing, bidirectional and global webhooks, card-title filtering, and package,
database, Node and Meteor version labels. These direct translations were
completed with low confidence and welcome review by a Kirundi speaker. This
left **98,885 genuinely untranslated values across 46 locale files**.
The eighteenth 50-value Kirundi batch added database, FerretDB, reactivity,
DDP and operating-system diagnostics, time units, custom-field display and
sums, account changes, private-board visibility, creation and modification
metadata, active teams, organizations and people, shared templates, member
propagation and authentication synchronization, multitenant organization
domains and delegated administrators. These direct translations were
completed with low confidence and welcome review by a Kirundi speaker. This
left **98,835 genuinely untranslated values across 46 locale files**.
The nineteenth 50-value Kirundi batch added received and end dates, color
dialogs, assigned and requested metadata, numbered card sorting, board,
notification and duplicate-list deletion, default and deposited subtasks,
card and subtask settings, parent-card display, minicard descriptions, covers,
attachment and checklist counts, full-path and parent prefixes, source boards
and label activities. These direct translations were completed with low
confidence and welcome review by a Kirundi speaker. This left **98,785
genuinely untranslated values across 46 locale files**.
The twentieth 50-value Kirundi batch added label, attachment and custom-field
activities, rule triggers, actions, workflow and list views, drag-and-drop
building, card, label, member, checklist, attachment, daily and received-date
triggers, JSON and CSV import/export, Trello Butler command mapping, targets,
workspaces and all-board scope. These direct translations were completed with
low confidence and welcome review by a Kirundi speaker. This left **98,735
genuinely untranslated values across 46 locale files**.
The twenty-first 50-value Kirundi batch added visual workflow imports from n8n
and Node-RED, unmapped-node reporting, scheduled and button triggers, one-time,
daily, weekday, weekly and monthly schedules, due and overdue conditions,
card age in lists, card and board buttons, list sorting, completion states,
bulk movement, relative dates, time units and core trigger/action phrases.
These direct translations were completed with low confidence and welcome
review by a Kirundi speaker. This left **98,685 genuinely untranslated values
across 46 locale files**.
The twenty-second 50-value Kirundi batch added rule phrases for boards, lists,
movement, archives, labels, members, attachments, checklists and checklist
items, card positioning, restoration, member removal, colors, checking and
unchecking, email actions and generated top and bottom movement descriptions.
These direct translations were completed with low confidence and welcome
review by a Kirundi speaker. This left **98,635 genuinely untranslated values
across 46 locale files**.
The twenty-third 50-value Kirundi batch added generated rule descriptions for
email, archive, labels, cards, members and checklists, comma-separated item
syntax, swimlane creation, empty-field and checklist guidance, date-field
updates and card links, authentication methods, custom product naming, HTML
head tags, web manifests, assetlinks.json, layout and card counters. These
direct translations were completed with low confidence and welcome review by
a Kirundi speaker. This left **98,585 genuinely untranslated values across 46
locale files**.
The twenty-fourth 50-value Kirundi batch added board membership, custom body
HTML, authentication, board duplication, organization and team totals,
swimlane deletion, restoration, activity timestamps, card placement, due
reminders, account deletion confirmations and drag-and-submit settings. These
direct translations were completed with low confidence and welcome review by
a Kirundi speaker. This left **98,535 genuinely untranslated values across 46
locale files**.
The twenty-fifth 50-value Kirundi batch added multi-card windows, inline editor
submission, organization, team and user dialogs, notification filtering,
renaming permissions, board-role rights and status, weekdays, ownership,
activity, voting and linked-card deletion guidance. These direct translations
were completed with low confidence and welcome review by a Kirundi speaker.
This left **98,485 genuinely untranslated values across 46 locale files**.
The twenty-sixth 50-value Kirundi batch added linked-list deletion safety,
checklist visibility, tasks, domains, shared templates, names and time spans,
My Cards and Due Cards views, global search and missing-item messages. These
direct translations were completed with low confidence and welcome review by
a Kirundi speaker. This left **98,435 genuinely untranslated values across 46
locale files**.
The twenty-seventh 50-value Kirundi batch added missing-user, comment,
organization and team feedback, card-result counts, advanced-search operators
and predicates for boards, card properties, dates, attachments and checklists.
These direct translations were completed with low confidence and welcome
review by a Kirundi speaker. This left **98,385 genuinely untranslated values
across 46 locale files**.
The twenty-eighth 50-value Kirundi batch added advanced-search predicate
labels, validation feedback, paging and the complete operator, status, sorting,
limit and Boolean-combination guidance with its query examples. These direct
translations were completed with low confidence and welcome review by a
Kirundi speaker. This left **98,335 genuinely untranslated values across 46
locale files**.
The twenty-ninth 50-value Kirundi batch added label metadata, board and card
sorting, completion state, stickers, card dependencies and their JSON/SVG
import, board backgrounds and location fields. These direct translations were
completed with low confidence and welcome review by a Kirundi speaker. This
left **98,285 genuinely untranslated values across 46 locale files**.
The thirtieth 50-value Kirundi batch added map detection, server-error
diagnostics, activity and swimlane controls, custom string templates, creator
metadata and file, security, performance, database, impersonation, recovery
and office reports. These direct translations were completed with low
confidence and welcome review by a Kirundi speaker. This left **98,235
genuinely untranslated values across 46 locale files**.
The thirty-first 50-value Kirundi batch added office history, REST API usage,
automatic recovery reporting, swimlane copying, creator display, loading
indicators, organization and team deletion safeguards, ticket states and card
detail controls. These direct translations were completed with low confidence
and welcome review by a Kirundi speaker. This left **98,185 genuinely
untranslated values across 46 locale files**.
The thirty-second 50-value Kirundi batch added team and organization
administration, invitation feedback, Node memory diagnostics, legal notices,
checklist copying and movement, subtask and attachment actions and filesystem,
GridFS and S3 storage moves. These direct translations were completed with low
confidence and welcome review by a Kirundi speaker. This left **98,135
genuinely untranslated values across 46 locale files**.
The thirty-third 50-value Kirundi batch added bulk attachment moves, storage
repair, avatar scope, default storage, move progress and file counts, storage
identifiers and MongoDB GridFS compaction guidance and results. These direct
translations were completed with low confidence and welcome review by a
Kirundi speaker. This left **98,085 genuinely untranslated values across 46
locale files**.
The thirty-fourth 50-value Kirundi batch added board time status, upload
progress and limits, PDF fallback, workspace dragging, custom translation
management, subtask and checklist display, ZIP imports, support and
accessibility settings. These direct translations were completed with low
confidence and welcome review by a Kirundi speaker. This left **98,035
genuinely untranslated values across 46 locale files**.
The thirty-fifth 50-value Kirundi batch added accessibility content, brute
force login protection, locked-user administration, scheduled jobs,
attachment-storage paths and scheduled board archive, backup and cleanup
operations. These direct translations were completed with low confidence and
welcome review by a Kirundi speaker. This left **97,985 genuinely untranslated
values across 46 locale files**.
The thirty-sixth 50-value Kirundi batch added scheduled-job lifecycle and
migration errors, filesystem and S3/Azure storage settings, MongoDB/FerretDB
text-data migration and Sandstorm grain migration status and guidance. These
direct translations were completed with low confidence and welcome review by
a Kirundi speaker. This left **97,935 genuinely untranslated values across 46
locale files**.
The thirty-seventh 50-value Kirundi batch added Sandstorm cleanup, card-loading
modes, plain-text rendering protections, import/export and avatar controls,
user anonymization, activity, notification and watch controls and instance or
organization backups. These direct translations were completed with low
confidence and welcome review by a Kirundi speaker. This left **97,885
genuinely untranslated values across 46 locale files**.
The thirty-eighth 50-value Kirundi batch added scheduled backup frequency and
restore modes, Google Cloud Storage credentials and permissions, S3, Azure and
GCS console paths, cloud-secret states, connection tests and Azure attachment
movement. These direct translations were completed with low confidence and
welcome review by a Kirundi speaker. This left **97,835 genuinely untranslated
values across 46 locale files**.
The thirty-ninth 50-value Kirundi batch added Google Cloud and GridFS storage,
migration lifecycle and status, CollectionFS movement, S3 credentials and
connections, scheduled board operations, writable paths and attachment and
board migration settings. These direct translations were completed with low
confidence and welcome review by a Kirundi speaker. This left **97,785
genuinely untranslated values across 46 locale files**.
The fortieth 50-value Kirundi batch added comprehensive board-integrity
migration, duplicate-list cleanup, lost-card and archived-item restoration,
missing-list repair, avatar and attachment URL repair, confirmations, progress
and migration steps. These direct translations were completed with low
confidence and welcome review by a Kirundi speaker. This left **97,735
genuinely untranslated values across 46 locale files**.
The forty-first 50-value Kirundi batch added board-repair steps, cleanup and
conversion status, CPU and database-migration monitoring, schedules,
filesystem and GridFS statistics, forced scans and job queue details. These
direct translations were completed with low confidence and welcome review by
a Kirundi speaker. This left **97,685 genuinely untranslated values across 46
locale files**.
The forty-second 50-value Kirundi batch added memory and storage migration,
batch, CPU and delay controls, migration logs and warnings, monitoring,
schedules, scan and progress state, minicard display and system resource and
attachment totals. These direct translations were completed with low
confidence and welcome review by a Kirundi speaker. This left **97,635
genuinely untranslated values across 46 locale files**.
The forty-third 50-value Kirundi batch added repository account and upload
controls, OTP and credential feedback, problem summaries, repair progress and
results, CPU load and event metadata. These direct translations were completed
with low confidence and welcome review by a Kirundi speaker. This left
**97,585 genuinely untranslated values across 46 locale files**.
The final 17-value Kirundi batch added event details and IP addresses,
filesystem-integrity reporting, scoped export choices, WeKan JSON/ZIP import
feedback, numeric search and board-import source guidance. Kirundi is now
complete. These direct translations were completed with low confidence and
welcome review by a Kirundi speaker. This left **97,568 genuinely untranslated
values across 45 locale files**.
The first 50-value Kinyarwanda batch added title and description activity,
board, list and swimlane deletion, organization and team membership limits,
comment replies, due-date history and concrete attachment, subtask, label,
checklist, comment, creation, archive and import activity. These direct
translations were completed with low confidence and welcome review by a
Kinyarwanda speaker. This left **97,518 genuinely untranslated values across
45 locale files**.
The second 50-value Kinyarwanda batch added card movement and restoration,
member removal, generic and checklist activity phrases, received and start
dates and All Boards workspace, subworkspace, menu and settings controls.
These direct translations were completed with low confidence and welcome
review by a Kinyarwanda speaker. This left **97,468 genuinely untranslated
values across 45 locale files**.
The third 50-value Kinyarwanda batch added workspace deletion, multi-board
selection, Home-board behavior, due and end dates, card placement, shared and
personal list widths, keyboard shortcuts, swimlane height and checklist,
cover, label and member controls. These direct translations were completed
with low confidence and welcome review by a Kinyarwanda speaker. This left
**97,418 genuinely untranslated values across 45 locale files**.
The fourth 50-value Kinyarwanda batch added administrator announcements,
offline recovery, archive and template controls, attachment deletion, board
backgrounds, All Boards display, member and assignee summaries and private
board visibility. These direct translations were completed with low confidence
and welcome review by a Kinyarwanda speaker. This left **97,368 genuinely
untranslated values across 45 locale files**.
The fifth 50-value Kinyarwanda batch added public-board visibility, board
opening and workspace movement, backgrounds, fonts and views, mobile and
desktop zoom, archive and deletion guidance, dates, time spent and attachment,
custom-field, label and member editing. These direct translations were
completed with low confidence and welcome review by a Kinyarwanda speaker.
This left **97,318 genuinely untranslated values across 45 locale files**.
The sixth 50-value Kinyarwanda batch added card membership and dates, voting
and Planning Poker, card actions and dependencies, organization, team, domain
and avatar dialogs, background and duplicate-list deletion and checklist,
swimlane, list, card and board imports. These direct translations were
completed with low confidence and welcome review by a Kinyarwanda speaker.
This left **97,268 genuinely untranslated values across 45 locale files**.
The seventh 50-value Kinyarwanda batch added member, sticker, invitation,
sorting and restoration dialogs, rule import/export, linked items, imported
member mapping, themes, font previews and sizes, text colors and avatar,
language and permission controls. These direct translations were completed
with low confidence and welcome review by a Kinyarwanda speaker. This left
**97,218 genuinely untranslated values across 45 locale files**.
The eighth 50-value Kinyarwanda batch added settings, subtasks, page and board
stars, automatic list width, clipboard and drag-and-drop, card aging tiers,
keyboard movement, dialog accessibility and board closing plus the first 23
color names. These direct translations were completed with low confidence and
welcome review by a Kinyarwanda speaker. This left **97,168 genuinely
untranslated values across 45 locale files**.
The ninth 50-value Kinyarwanda batch added remaining colors, comment and
read-only roles, deletion and list-movement confirmations, clipboard links,
linked cards, multi-card template JSON and custom-field creation, deletion and
option types. These direct translations were completed with low confidence and
welcome review by a Kinyarwanda speaker. This left **97,118 genuinely
untranslated values across 45 locale files**.
The tenth 50-value Kinyarwanda batch added date and permanent-delete settings,
custom-field and label dialogs, profile and WIP controls, account enrollment,
invitation, password-reset and verification email templates, scrolling and
board, role, JSON/CSV import and linked-card errors. These direct translations
were completed with low confidence and welcome review by a Kinyarwanda
speaker. This left **97,068 genuinely untranslated values across 45 locale
files**.
The eleventh 50-value Kinyarwanda batch added account-conflict errors, card
PDF/Excel export and selected fields, attachment metadata and disk-space
feedback, list sorting and date, title, label and member filters. These direct
translations were completed with low confidence and welcome review by a
Kinyarwanda speaker. This left **97,018 genuinely untranslated values across
45 locale files**.
The twelfth 50-value Kinyarwanda batch added assignee and custom-field filters,
advanced-filter operators and escape examples, activity visibility, imported
member state and Kanboard, Deck, OpenProject, issue, Asana, ZenKit, Trello,
CSV/TSV, Jira, Excel and WeKan board import and ZIP feedback. These direct
translations were completed with low confidence and welcome review by a
Kinyarwanda speaker. This left **96,968 genuinely untranslated values across
45 locale files**.
The thirteenth 50-value Kinyarwanda batch added Trello ZIP safety and personal
workspaces, direct API imports, saved credentials, board selection, progress,
cancellation and cleanup, member mapping, version and date validation,
invitations, shortcuts and label creation and deletion. These direct
translations were completed with low confidence and welcome review by a
Kinyarwanda speaker. This left **96,918 genuinely untranslated values across
45 locale files**.
The fourteenth 50-value Kinyarwanda batch added last-administrator protection,
board departure, list archive and deletion, user, team and organization
settings, swimlane and import dialogs, list links, multi-selection, muted and
normal roles, archive emptiness and participation notifications. These direct
translations were completed with low confidence and welcome review by a
Kinyarwanda speaker. This left **96,868 genuinely untranslated values across
45 locale files**.
The fifteenth 50-value Kinyarwanda batch added watch notifications, private
page login and missing-page feedback, image pasting and previews, public and
private board descriptions, member removal including Sandstorm access,
description rescue, board search, WIP, keyboard shortcuts, sidebars, signup
and automatic board opening. These direct translations were completed with low
confidence and welcome review by a Kinyarwanda speaker. This left **96,818
genuinely untranslated values across 45 locale files**.
The sixteenth 50-value Kinyarwanda batch added starred boards, subscription,
time and overtime tracking, keyboard assignee and label toggles, uploads,
custom branding and help URLs, automatic URL schemes, welcome and template
content and WIP-limit errors. These direct translations were completed with low
confidence and welcome review by a Kinyarwanda speaker. This left **96,768
genuinely untranslated values across 45 locale files**.
The seventeenth 50-value Kinyarwanda batch added attachment and API transfer
limits, avatar upload blocking, registration and invitations, SMTP settings
and test and invitation emails, authorization feedback, outgoing and
bidirectional webhooks and package, database, Node and Meteor versions. These
direct translations were completed with low confidence and welcome review by
a Kinyarwanda speaker. This left **96,718 genuinely untranslated values across
45 locale files**.
The eighteenth 50-value Kinyarwanda batch added database, FerretDB, reactivity,
DDP and operating-system diagnostics, elapsed-time units, custom-field display,
account changes, board visibility and active team, organization and person
state plus tenant domains, administrators and member propagation. These direct
translations were completed with low confidence and welcome review by a
Kinyarwanda speaker. This left **96,668 genuinely untranslated values across
45 locale files**.
The nineteenth 50-value Kinyarwanda batch added received and end dates, color
dialogs, requester and assignee attribution, permanent board and notification
deletion, duplicate-list cleanup, subtask and card settings, minicard content,
attachment and checklist counts and parent-card paths and activity. These
direct translations were completed with low confidence and welcome review by
a Kinyarwanda speaker. This left **96,618 genuinely untranslated values across
45 locale files**.
The twentieth 50-value Kinyarwanda batch added label, attachment and custom-
field activity, rule creation, selection and workflow building, card, label,
member, checklist, attachment, daily-time and received-date triggers and
JSON/CSV and Trello Butler rule imports and exports. These direct translations
were completed with low confidence and welcome review by a Kinyarwanda
speaker. This left **96,568 genuinely untranslated values across 45 locale
files**.
The twenty-first 50-value Kinyarwanda batch added n8n and Node-RED workflow
imports, scheduled and button triggers, daily, weekly and monthly schedules,
due-date and list-duration triggers, card and board buttons, list sorting,
completion, bulk moves and relative dates. These direct translations were
completed with low confidence and welcome review by a Kinyarwanda speaker.
This left **96,518 genuinely untranslated values across 45 locale files**.
The twenty-second 50-value Kinyarwanda batch added rule phrases for boards,
lists, movement, archives, labels, members, attachments, checklists and
checklist items, card positioning, restoration, member removal, colors,
checking and unchecking, email actions and generated top and bottom movement
descriptions. These direct translations were completed with low confidence and
welcome review by a Kinyarwanda speaker. This left **96,468 genuinely
untranslated values across 45 locale files**.
The twenty-third 50-value Kinyarwanda batch added generated email, archive,
label, card, member and checklist actions, comma-separated checklist items,
swimlane creation, empty-field guidance, date-field updates, card links,
authentication methods and custom product naming, HTML head tags, web
manifests, assetlinks.json, layout and card counters. These direct translations
were completed with low confidence and welcome review by a Kinyarwanda
speaker. This left **96,418 genuinely untranslated values across 45 locale
files**.
The twenty-fourth 50-value Kinyarwanda batch added board membership, custom
body HTML, authentication, board duplication, organization and team totals,
swimlane deletion, restoration, activity timestamps, card placement, due
reminders, account deletion confirmations and drag-and-submit settings. These
direct translations were completed with low confidence and welcome review by
a Kinyarwanda speaker. This left **96,368 genuinely untranslated values across
45 locale files**.
The twenty-fifth 50-value Kinyarwanda batch added multi-card windows, inline
editor submission, organization, team and user dialogs, notification
filtering, renaming permissions, board-role rights and status, weekdays,
ownership, activity, voting and linked-card deletion guidance. These direct
translations were completed with low confidence and welcome review by a
Kinyarwanda speaker. This left **96,318 genuinely untranslated values across
45 locale files**.
The twenty-sixth 50-value Kinyarwanda batch added linked-list deletion safety,
checklist visibility, tasks, domains, shared templates, names and time spans,
My Cards and Due Cards views, global search and missing-item messages. These
direct translations were completed with low confidence and welcome review by
a Kinyarwanda speaker. This left **96,268 genuinely untranslated values across
45 locale files**.
The twenty-seventh 50-value Kinyarwanda batch added missing-user, comment,
organization and team feedback, card-result counts, advanced-search operators
and predicates for boards, card properties, dates, attachments and checklists.
These direct translations were completed with low confidence and welcome
review by a Kinyarwanda speaker. This left **96,218 genuinely untranslated
values across 45 locale files**.
The twenty-eighth 50-value Kinyarwanda batch added advanced-search predicates,
validation errors, paging and detailed operator guidance for boards, lists,
swimlanes, users, organizations, teams, dates, status, fields, sorting and
limits. These direct translations were completed with low confidence and
welcome review by a Kinyarwanda speaker. This left **96,168 genuinely
untranslated values across 45 locale files**.
The twenty-ninth 50-value Kinyarwanda batch added card and board sorting,
completion state, stickers, card dependencies and their JSON or SVG import,
board backgrounds and card locations. These direct translations were completed
with low confidence and welcome review by a Kinyarwanda speaker. This left
**96,118 genuinely untranslated values across 45 locale files**.
The thirtieth 50-value Kinyarwanda batch added map locations, server-error
troubleshooting, sorting, board activity, string templates, file, security,
speed, test, CPU and database reports, impersonation, recovery and office login
reports. These direct translations were completed with low confidence and
welcome review by a Kinyarwanda speaker. This left **96,068 genuinely
untranslated values across 45 locale files**.
The thirty-first 50-value Kinyarwanda batch added office and REST API reports,
data-recovery status, swimlane copying, wait-spinner styles, card sizing,
organization and team deletion safeguards, tickets, requests and card details.
These direct translations were completed with low confidence and welcome
review by a Kinyarwanda speaker. This left **96,018 genuinely untranslated
values across 45 locale files**.
The thirty-second 50-value Kinyarwanda batch added team and organization
management, Node memory metrics, legal notices, checklist actions, card lists,
subtasks and attachment-storage movement for filesystem, GridFS and S3.
These direct translations were completed with low confidence and welcome
review by a Kinyarwanda speaker. This left **95,968 genuinely untranslated
values across 45 locale files**.
The thirty-third 50-value Kinyarwanda batch added bulk attachment movement,
storage-location repair, avatars, default storage and progress statistics,
file identifiers and MongoDB Compact maintenance guidance. These direct
translations were completed with low confidence and welcome review by a
Kinyarwanda speaker. This left **95,918 genuinely untranslated values across
45 locale files**.
The thirty-fourth 50-value Kinyarwanda batch added board status and time
summaries, upload progress and limits, custom translations, workspace dragging,
checklist display, board ZIP import, support and accessibility settings. These
direct translations were completed with low confidence and welcome review by
a Kinyarwanda speaker. This left **95,868 genuinely untranslated values across
45 locale files**.
The thirty-fifth 50-value Kinyarwanda batch added accessibility content,
account lockout and brute-force protection, user-status filtering, scheduled
jobs, attachment paths and scheduled board archive, backup and cleanup
operations. These direct translations were completed with low confidence and
welcome review by a Kinyarwanda speaker. This left **95,818 genuinely
untranslated values across 45 locale files**.
The thirty-sixth 50-value Kinyarwanda batch added scheduled-job and migration
controls, filesystem and cloud-storage configuration, MongoDB and FerretDB
database migration and Sandstorm grain migration status. These direct
translations were completed with low confidence and welcome review by a
Kinyarwanda speaker. This left **95,768 genuinely untranslated values across
45 locale files**.
The thirty-seventh 50-value Kinyarwanda batch added Sandstorm cleanup, adaptive
card loading, plain-text link and code security, import and export controls,
user anonymization, activity, notification and watch controls and instance or
organization backups. These direct translations were completed with low
confidence and welcome review by a Kinyarwanda speaker. This left **95,718
genuinely untranslated values across 45 locale files**.
The thirty-eighth 50-value Kinyarwanda batch added backup scheduling and
restore modes plus Google Cloud Storage, S3-compatible and Azure credential,
permission and console-navigation guidance. These direct translations were
completed with low confidence and welcome review by a Kinyarwanda speaker.
This left **95,668 genuinely untranslated values across 45 locale files**.
The thirty-ninth 50-value Kinyarwanda batch added Google Cloud Storage and
GridFS attachment movement, migration lifecycle controls, S3 authentication,
scheduled board operations, writable paths and attachment and board migration
settings. These direct translations were completed with low confidence and
welcome review by a Kinyarwanda speaker. This left **95,618 genuinely
untranslated values across 45 locale files**.
The fortieth 50-value Kinyarwanda batch added comprehensive board integrity
migrations, duplicate-list cleanup, lost and archived item restoration, list
repair, avatar and attachment URL repair and migration progress steps. These
direct translations were completed with low confidence and welcome review by
a Kinyarwanda speaker. This left **95,568 genuinely untranslated values across
45 locale files**.
The forty-first 50-value Kinyarwanda batch added remaining board-migration
steps, conversion status, scheduled intervals, CPU and filesystem monitoring,
GridFS statistics and job queue details. These direct translations were
completed with low confidence and welcome review by a Kinyarwanda speaker.
This left **95,518 genuinely untranslated values across 45 locale files**.
The forty-second 50-value Kinyarwanda batch added bulk storage migration,
resource thresholds, migration logs and controls, monitoring, schedules,
minicard display, operation progress and storage-distribution statistics.
These direct translations were completed with low confidence and welcome
review by a Kinyarwanda speaker. This left **95,468 genuinely untranslated
values across 45 locale files**.
The forty-third 50-value Kinyarwanda batch added repository accounts, OTP and
login validation, problem summaries, card repair, CPU and event reporting. It
also replaced an existing Kirundi loading message with Kinyarwanda. These
direct translations were completed with low confidence and welcome review by
a Kinyarwanda speaker. This left **95,418 genuinely untranslated values across
45 locale files**.
The final 17-value Kinyarwanda batch added event addresses, filesystem
integrity, scoped import and export, the search number operator and WeKan file
import guidance. Across 44 direct-translation batches, all remaining
Kinyarwanda placeholders are now translated. These direct translations were
completed with low confidence and welcome review by a Kinyarwanda speaker.
This left **95,401 genuinely untranslated values across 44 locale files**.
The first 50-value Sakha batch added activity changes, same-organization and
same-team membership, comment replies, due dates and activity records for
attachments, subtasks, labels, checklists, comments, boards, cards, lists,
swimlanes and members. These direct translations were completed with low
confidence and welcome review by a Sakha speaker. This left **95,351 genuinely
untranslated values across 44 locale files**.
The second 50-value Sakha batch added card movement and restoration, remaining
activity summaries and checklist events, starred and remaining boards and
workspace names, icons, menus and settings. These direct translations were
completed with low confidence and welcome review by a Sakha speaker. This left
**95,301 genuinely untranslated values across 44 locale files**.
The third 50-value Sakha batch added workspace deletion, multi-board selection,
Home and starred boards, due and end dates, templates, list widths, keyboard
shortcuts, swimlane heights, subtasks, checklists, covers, labels and members.
These direct translations were completed with low confidence and welcome
review by a Sakha speaker. This left **95,251 genuinely untranslated values
across 44 locale files**.
The fourth 50-value Sakha batch added administration and announcements,
public boards, loading and reconnection, archive and restoration, template
containers, attachments, automatic watching, backgrounds, board summaries,
members, assignees and private-board status. These direct translations were
completed with low confidence and welcome review by a Sakha speaker. This left
**95,201 genuinely untranslated values across 44 locale files**.
The fifth 50-value Sakha batch added public-board status, board navigation and
appearance, mobile and desktop views, zoom, calendar and table views, archive
and deletion guidance, due and spent time and card attachments, fields, labels
and members. These direct translations were completed with low confidence and
welcome review by a Sakha speaker. This left **95,151 genuinely untranslated
values across 44 locale files**.
The sixth 50-value Sakha batch added card members and dates, voting and
Planning Poker, card actions and dependencies, organizations, teams, avatars,
backgrounds, domains, imported-member mapping and checklist, swimlane, list,
card and board imports. These direct translations were completed with low
confidence and welcome review by a Sakha speaker. This left **95,101 genuinely
untranslated values across 44 locale files**.
The seventh 50-value Sakha batch added member and sticker dialogs, list and
swimlane validation, rules transfer, linked cards and boards, imported-member
mapping, themes, font previews, text colors, avatars, languages and permissions.
These direct translations were completed with low confidence and welcome
review by a Sakha speaker. This left **95,051 genuinely untranslated values
across 44 locale files**.
The eighth 50-value Sakha batch added settings, subtasks, starred pages,
automatic list widths, clipboard and drag-and-drop, card aging, card and list
movement, dialog navigation and 23 interface colors. These direct translations
were completed with low confidence and welcome review by a Sakha speaker. This
left **95,001 genuinely untranslated values across 44 locale files**.
The ninth 50-value Sakha batch completed the color palette and added comment
and read-only roles, worker permissions, deletion confirmations, clipboard
copying, linked cards, multi-card JSON templates and custom-field types and
options. These direct translations were completed with low confidence and
welcome review by a Sakha speaker. This left **94,951 genuinely untranslated
values across 44 locale files**.
The tenth 50-value Sakha batch added date and deletion settings, WIP limits,
profiles, reactions, notifications, enrollment, invitation, password-reset and
verification email, scrolling and validation errors for boards, users, JSON,
CSV, TSV, imports and linked cards. These direct translations were completed
with low confidence and welcome review by a Sakha speaker. This left **94,901
genuinely untranslated values across 44 locale files**.
The eleventh 50-value Sakha batch added account errors, card export to PDF and
Excel, export fields and attachment metadata, disk-space feedback, list sorting
and card, list, date, label and member filters. These direct translations were
completed with low confidence and welcome review by a Sakha speaker. This left
**94,851 genuinely untranslated values across 44 locale files**.
The twelfth 50-value Sakha batch added assignee and custom-field filters,
advanced-filter syntax, activity and member state and imports from Kanboard,
NextCloud Deck, OpenProject, issue trackers, Asana, ZenKit, Trello, CSV, TSV,
Jira, Excel and WeKan. These direct translations were completed with low
confidence and welcome review by a Sakha speaker. This left **94,801 genuinely
untranslated values across 44 locale files**.
The thirteenth 50-value Sakha batch added Trello ZIP safety, workspace
placement, API credentials, board selection, cancellation and recovery,
member mapping, version and date validation, keyboard shortcuts and label
creation and deletion. These direct translations were completed with low
confidence and welcome review by a Sakha speaker. This left **94,751 genuinely
untranslated values across 44 locale files**.
The fourteenth 50-value Sakha batch added last-administrator protection, board
departure, card and list links, archive guidance, user, team and organization
settings, swimlane actions, selection movement and copying, muted and normal
roles and participation notifications. These direct translations were
completed with low confidence and welcome review by a Sakha speaker. This left
**94,701 genuinely untranslated values across 44 locale files**.
The fifteenth 50-value Sakha batch added watch notifications, private and
missing pages, previews, public and private board descriptions, member removal,
Sandstorm access guidance, search, WIP limits, keyboard shortcuts, sidebars,
signup and default-board controls. These direct translations were completed
with low confidence and welcome review by a Sakha speaker. This left **94,651
genuinely untranslated values across 44 locale files**.
The sixteenth 50-value Sakha batch added starred boards, subscriptions, time
tracking, assignee and label shortcuts, uploads, custom logo and help URLs,
linked URL schemes, welcome and template boards and WIP-limit feedback. These
direct translations were completed with low confidence and welcome review by
a Sakha speaker. This left **94,601 genuinely untranslated values across 44
locale files**.
The seventeenth 50-value Sakha batch added attachment and API transfer limits,
avatar upload controls, registration and invitations, SMTP and TLS settings,
invitation email, authorization feedback, webhook controls and database, Node
and Meteor version labels. These direct translations were completed with low
confidence and welcome review by a Sakha speaker. This left **94,551 genuinely
untranslated values across 44 locale files**.
The eighteenth 50-value Sakha batch added database and FerretDB diagnostics,
reactivity and DDP configuration, OS resources and uptime, custom-field display,
account and board visibility, organization tenancy, domains and administrators
and shared team templates. These direct translations were completed with low
confidence and welcome review by a Sakha speaker. This left **94,501 genuinely
untranslated values across 44 locale files**.
The nineteenth 50-value Sakha batch added card receipt and end dates, colors,
board and notification deletion, duplicate-list cleanup, subtask and card
settings, minicard fields, parent-card paths and label activity. These direct
translations were completed with low confidence and welcome review by a Sakha
speaker. This left **94,451 genuinely untranslated values across 44 locale
files**.
The twentieth 50-value Sakha batch added label, attachment and custom-field
activity, rule management and views, workflow triggers and rule interchange in
JSON, CSV and Trello Butler formats. These direct translations were completed
with low confidence and welcome review by a Sakha speaker. This left **94,401
genuinely untranslated values across 44 locale files**.
The twenty-first 50-value Sakha batch added visual-workflow imports, scheduled
and button triggers, due-date and list-duration conditions, sorting, completion
and relative-date actions and time units. These direct translations were
completed with low confidence and welcome review by a Sakha speaker. This left
**94,351 genuinely untranslated values across 44 locale files**.
The twenty-second 50-value Sakha batch added rule filters for board, list,
labels, members, attachments and checklists plus archive, movement, color,
checklist and email actions. These direct translations were completed with low
confidence and welcome review by a Sakha speaker. This left **94,301 genuinely
untranslated values across 44 locale files**.
The twenty-third 50-value Sakha batch added further rule actions and notes,
checklist item examples, date fields, authentication, custom product metadata,
web manifests, asset links and layout controls. These direct translations were
completed with low confidence and welcome review by a Sakha speaker. This left
**94,251 genuinely untranslated values across 44 locale files**.
The twenty-fourth 50-value Sakha batch added member lists, custom HTML
placement, authentication errors, duplication and deletion confirmations,
card-date activity and reminders, positioning and desktop interaction controls.
These direct translations were completed with low confidence and welcome review
by a Sakha speaker. This left **94,201 genuinely untranslated values across 44
locale files**.
The twenty-fifth 50-value Sakha batch added multi-card windows, editor keyboard
behavior, organization, team and user dialogs, notification filters, board-role
permissions and status, weekdays and linked-card deletion guidance. These direct
translations were completed with low confidence and welcome review by a Sakha
speaker. This left **94,151 genuinely untranslated values across 44 locale
files**.
The twenty-sixth 50-value Sakha batch added checklist visibility, domain-scoped
template sharing, My Cards and due-card views, global search choices and
not-found messages for boards, swimlanes, lists and labels. These direct
translations were completed with low confidence and welcome review by a Sakha
speaker. This left **94,101 genuinely untranslated values across 44 locale
files**.
The twenty-seventh 50-value Sakha batch added search-result counts and lookup
errors plus global-search operators and predicates for boards, people, dates,
status, attachments, descriptions and checklists. These direct translations
were completed with low confidence and welcome review by a Sakha speaker. This
left **94,051 genuinely untranslated values across 44 locale files**.
The twenty-eighth 50-value Sakha batch added global-search validation,
pagination and complete operator instructions covering query syntax, status,
field presence, sorting, limits and Boolean matching. These direct translations
were completed with low confidence and welcome review by a Sakha speaker. This
left **94,001 genuinely untranslated values across 44 locale files**.
The twenty-ninth 50-value Sakha batch added card and board sorting, completion,
stickers, dependency relationships and JSON/SVG imports, board backgrounds and
card locations. These direct translations were completed with low confidence
and welcome review by a Sakha speaker. This left **93,951 genuinely untranslated
values across 44 locale files**.
The thirtieth 50-value Sakha batch added map coordinates and providers, server
troubleshooting, activity visibility, string templates, file and system reports,
impersonation, recovery and office-login reporting. These direct translations
were completed with low confidence and welcome review by a Sakha speaker. This
left **93,901 genuinely untranslated values across 44 locale files**.
The thirty-first 50-value Sakha batch added office and REST API reporting,
database recovery status, swimlane copying, wait spinners, organization and team
deletion safeguards, tickets, requests and card-detail dialogs. These direct
translations were completed with low confidence and welcome review by a Sakha
speaker. This left **93,851 genuinely untranslated values across 44 locale
files**.
The thirty-second 50-value Sakha batch added team and organization assignment,
registration invitations, Node heap diagnostics, legal notices, checklist
actions and attachment moves between filesystem, GridFS and S3 storage. These
direct translations were completed with low confidence and welcome review by a
Sakha speaker. This left **93,801 genuinely untranslated values across 44 locale
files**.
The thirty-third 50-value Sakha batch added bulk attachment and avatar storage
migration, location repair, progress and counts, storage identifiers and MongoDB
Compact guidance. These direct translations were completed with low confidence
and welcome review by a Sakha speaker. This left **93,751 genuinely untranslated
values across 44 locale files**.
The thirty-fourth 50-value Sakha batch added board time status, upload limits,
PDF preview guidance, workspace dragging, custom translations, ZIP board import,
checklist display and support and accessibility pages. These direct translations
were completed with low confidence and welcome review by a Sakha speaker. This
left **93,701 genuinely untranslated values across 44 locale files**.
The thirty-fifth 50-value Sakha batch added accessibility content, brute-force
login protection, locked-user administration, scheduled jobs, attachment paths
and scheduled board archive, backup and cleanup operations. These direct
translations were completed with low confidence and welcome review by a Sakha
speaker. This left **93,651 genuinely untranslated values across 44 locale
files**.
The thirty-sixth 50-value Sakha batch added scheduled-job and migration status,
filesystem, S3 and Azure storage settings, MongoDB/FerretDB migration and
Sandstorm grain migration guidance. These direct translations were completed
with low confidence and welcome review by a Sakha speaker. This left **93,601
genuinely untranslated values across 44 locale files**.
The thirty-seventh 50-value Sakha batch added Sandstorm cleanup, card-loading
modes, safe rich-text rendering, import/export restrictions, user anonymization,
activity and notification controls and scoped cloud backups. These direct
translations were completed with low confidence and welcome review by a Sakha
speaker. This left **93,551 genuinely untranslated values across 44 locale
files**.
The thirty-eighth 50-value Sakha batch added backup schedules and restore modes,
Google Cloud credentials and permissions, and guided AWS S3, Azure and GCS
storage configuration and connection tests. These direct translations were
completed with low confidence and welcome review by a Sakha speaker. This left
**93,501 genuinely untranslated values across 44 locale files**.
The thirty-ninth 50-value Sakha batch added Google Cloud, GridFS and S3 attachment
storage, migration lifecycle controls, scheduled board operations and attachment
monitoring and migration settings. These direct translations were completed with
low confidence and welcome review by a Sakha speaker. This left **93,451
genuinely untranslated values across 44 locale files**.
The fortieth 50-value Sakha batch added comprehensive board-integrity migration,
duplicate-list cleanup, lost-card and archive restoration, file URL repair,
confirmation dialogs and migration progress steps. These direct translations
were completed with low confidence and welcome review by a Sakha speaker. This
left **93,401 genuinely untranslated values across 44 locale files**.
The forty-first 50-value Sakha batch added migration repair steps, board
conversion, CPU and filesystem monitoring, recurring intervals, job queues and
concurrency status. These direct translations were completed with low confidence
and welcome review by a Sakha speaker. This left **93,351 genuinely untranslated
values across 44 locale files**.
The forty-second 50-value Sakha batch added attachment migration tuning,
background progress and logs, monitoring refresh and export, scheduling,
resource totals and minicard list and checklist visibility. These direct
translations were completed with low confidence and welcome review by a Sakha
speaker. This left **93,301 genuinely untranslated values across 44 locale
files**.
The forty-third 50-value Sakha batch added OTP login and repository management,
account validation, problem and repair reporting, CPU load and operational event
fields. These direct translations were completed with low confidence and welcome
review by a Sakha speaker. This left **93,251 genuinely untranslated values
across 44 locale files**.
The final 17-value Sakha batch added event network addresses, filesystem
integrity, scoped export choices, WeKan import validation and card-number search.
These direct translations were completed with low confidence and welcome review
by a Sakha speaker. This completed Sakha and left **93,234 genuinely untranslated
values across 43 locale files**.
The first 50-value Sindhi batch added organization and team membership,
comment controls, due-date changes and detailed activity records for boards,
swimlanes, lists, cards, attachments, labels, checklists and custom fields. These
direct translations were completed with low confidence and welcome review by a
Sindhi speaker. This left **93,184 genuinely untranslated values across 43 locale
files**.
The second 50-value Sindhi batch added card movement, membership and restoration,
concise activity summaries, checklist and date activity and workspace creation,
editing and navigation. These direct translations were completed with low
confidence and welcome review by a Sindhi speaker. This left **93,134 genuinely
untranslated values across 43 locale files**.
The third 50-value Sindhi batch added workspace deletion and board selection,
Home boards, list widths, keyboard shortcuts, swimlane heights and checklist,
cover, label and member actions. These direct translations were completed with
low confidence and welcome review by a Sindhi speaker. This left **93,084
genuinely untranslated values across 43 locale files**.
The fourth 50-value Sindhi batch added administrator roles and announcements,
offline recovery, board archiving, templates, attachment safeguards, backgrounds,
All Boards display and board membership and privacy summaries. These direct
translations were completed with low confidence and welcome review by a Sindhi
speaker. This left **93,034 genuinely untranslated values across 43 locale
files**.
The fifth 50-value Sindhi batch added public-board and workspace navigation,
board appearance and view modes, zoom and calendars, archive guidance, deletion
safeguards and card dates, attachments, custom fields, labels and members. These
direct translations were completed with low confidence and welcome review by a
Sindhi speaker. This left **92,984 genuinely untranslated values across 43 locale
files**.
The sixth 50-value Sindhi batch added card membership and custom fields, voting
and Planning Poker, dependency dialogs, organization, team and domain assignment,
backgrounds and checklist, swimlane, list, card and board imports. These direct
translations were completed with low confidence and welcome review by a Sindhi
speaker. This left **92,934 genuinely untranslated values across 43 locale
files**.
The seventh 50-value Sindhi batch added member and restoration dialogs,
CAS sign-in, linked cards and boards, imported-member mapping, themes, fonts,
text colors, avatars, language and permission controls. These direct translations
were completed with low confidence and welcome review by a Sindhi speaker. This
left **92,884 genuinely untranslated values across 43 locale files**.
The eighth 50-value Sindhi batch added starring, automatic list widths, card
aging, keyboard movement, accessible dialog navigation, board restoration and
the interface color palette. These direct translations were completed with low
confidence and welcome review by a Sindhi speaker. This left **92,834 genuinely
untranslated values across 43 locale files**.
The ninth 50-value Sindhi batch added comment and read-only roles, checklist and
subtask safeguards, clipboard links, bulk-card JSON examples, labels and custom
field types and dropdown options. These direct translations were completed with
low confidence and welcome review by a Sindhi speaker. This left **92,784
genuinely untranslated values across 43 locale files**.
The tenth 50-value Sindhi batch added permanent deletion, WIP limits, profile and
date dialogs, localized account emails and validation for permissions, JSON,
CSV/TSV imports, empty boards and linked cards. These direct translations were
completed with low confidence and welcome review by a Sindhi speaker. This left
**92,734 genuinely untranslated values across 43 locale files**.
The eleventh 50-value Sindhi batch added account uniqueness errors, PDF and Excel
card exports, attachment metadata, list sorting and card, date, label and member
filters. These direct translations were completed with low confidence and welcome
review by a Sindhi speaker. This left **92,684 genuinely untranslated values
across 43 locale files**.
The twelfth 50-value Sindhi batch added advanced filters, member states and
impersonation plus Kanboard, NextCloud Deck, OpenProject, issue, Asana, ZenKit,
Trello, CSV/TSV, Jira, Excel and WeKan board imports. These direct translations
were completed with low confidence and welcome review by a Sindhi speaker. This
left **92,634 genuinely untranslated values across 43 locale files**.
The thirteenth 50-value Sindhi batch added Trello ZIP validation, API credentials,
workspace and board selection, resumable import jobs, member mapping, date and
year validation, keyboard shortcuts and label deletion. These direct translations
were completed with low confidence and welcome review by a Sindhi speaker. This
left **92,584 genuinely untranslated values across 43 locale files**.
The fourteenth 50-value Sindhi batch added board departure and roles, list archive
and movement actions, user, team and organization settings, multi-selection,
muting, archived-item states and participation notifications. These direct
translations were completed with low confidence and welcome review by a Sindhi
speaker. This left **92,534 genuinely untranslated values across 43 locale
files**.
The fifteenth 50-value Sindhi batch added watch notifications, private-page
login, previews, board visibility, member removal, unsaved-description rescue,
search, WIP limits, keyboard shortcuts, sidebars and default boards. These direct
translations were completed with low confidence and welcome review by a Sindhi
speaker. This left **92,484 genuinely untranslated values across 43 locale
files**.
The sixteenth 50-value Sindhi batch added starred boards, subscriptions, time
tracking, assignee and label shortcuts, uploads, custom logo and help URLs,
linked URL schemes, welcome and template boards and WIP-limit feedback. These
direct translations were completed with low confidence and welcome review by a
Sindhi speaker. This left **92,434 genuinely untranslated values across 43 locale
files**.
The seventeenth 50-value Sindhi batch added attachment and API transfer limits,
avatar upload controls, registration and invitations, SMTP and TLS settings,
invitation email, authorization feedback, webhooks and database, Node and Meteor
version labels. These direct translations were completed with low confidence and
welcome review by a Sindhi speaker. This left **92,384 genuinely untranslated
values across 43 locale files**.
The eighteenth 50-value Sindhi batch added database and FerretDB diagnostics,
reactivity and DDP configuration, OS resources and uptime, custom-field display,
account and board visibility, organization tenancy, domains and administrators
and shared team templates. These direct translations were completed with low
confidence and welcome review by a Sindhi speaker. This left **92,334 genuinely
untranslated values across 43 locale files**.
The nineteenth 50-value Sindhi batch added card receipt and end dates, colors,
board and notification deletion, duplicate-list cleanup, subtask and card
settings, minicard fields, parent-card paths and label activity. These direct
translations were completed with low confidence and welcome review by a Sindhi
speaker. This left **92,284 genuinely untranslated values across 43 locale
files**.
The twentieth 50-value Sindhi batch added label, attachment and custom-field
activity, rule management and views, workflow triggers and rule interchange in
JSON, CSV and Trello Butler formats. These direct translations were completed
with low confidence and welcome review by a Sindhi speaker. This left **92,234
genuinely untranslated values across 43 locale files**.
The twenty-first 50-value Sindhi batch added visual-workflow imports, scheduled
and button triggers, due-date and list-duration conditions, sorting, completion
and relative-date actions and time units. These direct translations were
completed with low confidence and welcome review by a Sindhi speaker. This left
**92,184 genuinely untranslated values across 43 locale files**.
The twenty-second 50-value Sindhi batch added rule filters for board, list,
labels, members, attachments and checklists plus archive, movement, color,
checklist and email actions. These direct translations were completed with low
confidence and welcome review by a Sindhi speaker. This left **92,134 genuinely
untranslated values across 43 locale files**.
The twenty-third 50-value Sindhi batch added further rule actions and notes,
checklist item examples, date fields, authentication, custom product metadata,
web manifests, asset links and layout controls. These direct translations were
completed with low confidence and welcome review by a Sindhi speaker. This left
**92,084 genuinely untranslated values across 43 locale files**.
The twenty-fourth 50-value Sindhi batch added member lists, custom HTML
placement, authentication errors, duplication and deletion confirmations,
card-date activity and reminders, positioning and desktop interaction controls.
These direct translations were completed with low confidence and welcome review
by a Sindhi speaker. This left **92,034 genuinely untranslated values across 43
locale files**.
The twenty-fifth 50-value Sindhi batch added multi-card windows, editor keyboard
behavior, organization, team and user dialogs, notification filters, board-role
permissions and status, weekdays and linked-card deletion guidance. These direct
translations were completed with low confidence and welcome review by a Sindhi
speaker. This left **91,984 genuinely untranslated values across 43 locale
files**.
The twenty-sixth 50-value Sindhi batch added linked-card safety, checklist
visibility, tasks, domains and shared templates, My Cards and Due Cards views,
global search choices and missing-item messages. These direct translations were
completed with low confidence and welcome review by a Sindhi speaker. This left
**91,934 genuinely untranslated values across 43 locale files**.
The twenty-seventh 50-value Sindhi batch added missing-result messages and
localized global-search operators and predicates for boards, people, dates,
content and status. These direct translations were completed with low confidence
and welcome review by a Sindhi speaker. This left **91,884 genuinely untranslated
values across 43 locale files**.
The twenty-eighth 50-value Sindhi batch completed the localized Global Search
operator reference, validation messages, paging and notes while preserving all
query examples and runtime tokens. These direct translations were completed with
low confidence and welcome review by a Sindhi speaker. This left **91,834
genuinely untranslated values across 43 locale files**.
The twenty-ninth 50-value Sindhi batch added board and card sorting, completion
state, stickers, card dependencies and their imports, board backgrounds and
basic location fields. These direct translations were completed with low
confidence and welcome review by a Sindhi speaker. This left **91,784 genuinely
untranslated values across 43 locale files**.
The thirtieth 50-value Sindhi batch added map-based locations, server-error
troubleshooting, custom string templates, board activity controls and
administrative file, security, performance, impersonation and office reports.
These direct translations were completed with low confidence and welcome review
by a Sindhi speaker. This left **91,734 genuinely untranslated values across 43
locale files**.
The thirty-first 50-value Sindhi batch added office and REST API reporting,
database recovery, swimlane copying, wait-spinner choices, organization and team
deletion warnings, tickets and card-detail controls. These direct translations
were completed with low confidence and welcome review by a Sindhi speaker. This
left **91,684 genuinely untranslated values across 43 locale files**.
The thirty-second 50-value Sindhi batch added team and organization controls,
invitation messages, Node memory metrics, legal notices, checklist actions and
attachment-storage moves. These direct translations were completed with low
confidence and welcome review by a Sindhi speaker. This left **91,634 genuinely
untranslated values across 43 locale files**.
The thirty-third 50-value Sindhi batch added attachment and avatar storage
migration, location repair, file counts and identifiers, MongoDB Compact
guidance and storage metadata. These direct translations were completed with
low confidence and welcome review by a Sindhi speaker. This left **91,584
genuinely untranslated values across 43 locale files**.
The thirty-fourth 50-value Sindhi batch added board time status, upload progress
and file policy, custom translations, checklist display, board ZIP imports,
support and accessibility settings. These direct translations were completed
with low confidence and welcome review by a Sindhi speaker. This left **91,534
genuinely untranslated values across 43 locale files**.
The thirty-fifth 50-value Sindhi batch added accessibility content, brute-force
login protection and user unlocking, people filters, scheduled jobs, attachment
paths and scheduled board operations. These direct translations were completed
with low confidence and welcome review by a Sindhi speaker. This left **91,484
genuinely untranslated values across 43 locale files**.
The thirty-sixth 50-value Sindhi batch added scheduled-job and migration
recovery, filesystem and cloud storage settings, MongoDB-to-FerretDB migration
instructions and Sandstorm migration status. These direct translations were
completed with low confidence and welcome review by a Sindhi speaker. This left
**91,434 genuinely untranslated values across 43 locale files**.
The thirty-seventh 50-value Sindhi batch added Sandstorm cleanup, adaptive card
loading, secure rich-text rendering, import and export controls, identity
anonymization, activity and notification controls and backup scope. These direct
translations were completed with low confidence and welcome review by a Sindhi
speaker. This left **91,384 genuinely untranslated values across 43 locale
files**.
The thirty-eighth 50-value Sindhi batch added backup scheduling and restoration,
Google Cloud credentials and permissions, AWS S3, Azure and Google Cloud console
paths and cloud connection status. External console labels remain exact. These
direct translations were completed with low confidence and welcome review by a
Sindhi speaker. This left **91,334 genuinely untranslated values across 43 locale
files**.
The thirty-ninth 50-value Sindhi batch added GridFS, S3 and writable-path
settings, attachment and board migration controls, migration progress and
scheduled board operations. These direct translations were completed with low
confidence and welcome review by a Sindhi speaker. This left **91,284 genuinely
untranslated values across 43 locale files**.
The fortieth 50-value Sindhi batch added board-integrity migration checks,
duplicate-list cleanup, lost-card and archive restoration, URL repair,
confirmations and migration progress steps. These direct translations were
completed with low confidence and welcome review by a Sindhi speaker. This left
**91,234 genuinely untranslated values across 43 locale files**.
The forty-first 50-value Sindhi batch added board-migration steps, conversion
status, CPU metrics, job schedules and queues, filesystem and GridFS monitoring
and board scans. These direct translations were completed with low confidence
and welcome review by a Sindhi speaker. This left **91,184 genuinely untranslated
values across 43 locale files**.
The forty-second 50-value Sindhi batch added attachment-migration tuning and
monitoring, CPU and memory thresholds, scheduling, progress, storage distribution
and board scanning. These direct translations were completed with low confidence
and welcome review by a Sindhi speaker. This left **91,134 genuinely untranslated
values across 43 locale files**.
The forty-third 50-value Sindhi batch added repository authentication, account
creation and lockout messages, problem reporting, broken-card repair, CPU status
and event metadata. These direct translations were completed with low confidence
and welcome review by a Sindhi speaker. This left **91,084 genuinely untranslated
values across 43 locale files**.
The final 17-value Sindhi batch added network-event metadata, filesystem
integrity, scoped export and WeKan, Trello, Jira, CSV and Excel import guidance.
These direct translations were completed with low confidence and welcome review
by a Sindhi speaker. Sindhi is now complete, leaving **91,067 genuinely
untranslated values across 42 locale files**.
The first 50-value Northern Sami batch added activity records for board, card,
list and swimlane creation, deletion, archiving and imports, plus comments,
labels, checklists, attachments and membership restrictions. These direct
translations were completed with low confidence and welcome review by a Northern
Sami speaker. This left **91,017 genuinely untranslated values across 42 locale
files**.
The second 50-value Northern Sami batch added card moves and restoration,
activity summaries for imports, checklists and dates, starred-board views and
workspace creation and settings. These direct translations were completed with
low confidence and welcome review by a Northern Sami speaker. This left **90,967
genuinely untranslated values across 42 locale files**.
The third 50-value Northern Sami batch added workspace deletion, multi-board and
home-board controls, list width and swimlane height, keyboard shortcuts,
templates, subtasks, checklists, labels and members. These direct translations
were completed with low confidence and welcome review by a Northern Sami
speaker. This left **90,917 genuinely untranslated values across 42 locale
files**.
The fourth 50-value Northern Sami batch added administration and announcements,
archive and template controls, attachment warnings, board appearance, All Boards
settings, member and assignee summaries and private-board status. These direct
translations were completed with low confidence and welcome review by a Northern
Sami speaker. This left **90,867 genuinely untranslated values across 42 locale
files**.
The fifth 50-value Northern Sami batch added public-board and drag-and-drop
guidance, board appearance and views, desktop and mobile modes, zoom and calendar
controls, archive warnings and card metadata editing. These direct translations
were completed with low confidence and welcome review by a Northern Sami
speaker. This left **90,817 genuinely untranslated values across 42 locale
files**.
The sixth 50-value Northern Sami batch added card membership and custom fields,
voting and Planning Poker, card actions and dependencies, organizations, teams,
domains, backgrounds and import and export dialogs. These direct translations
were completed with low confidence and welcome review by a Northern Sami
speaker. This left **90,767 genuinely untranslated values across 42 locale
files**.
The seventh 50-value Northern Sami batch added member, sticker, sorting and
restoration dialogs, imported-member mapping, themes, fonts, text colors,
avatars, language and permissions. These direct translations were completed
with low confidence and welcome review by a Northern Sami speaker. This left
**90,717 genuinely untranslated values across 42 locale files**.
The eighth 50-value Northern Sami batch added starring, automatic list width,
card aging, movement and accessibility controls, dialog navigation and 23 color
names. These direct translations were completed with low confidence and welcome
review by a Northern Sami speaker. This left **90,667 genuinely untranslated
values across 42 locale files**.
The ninth 50-value Northern Sami batch added comment and read-only roles,
deletion confirmations, clipboard links, multi-card JSON templates, labels and
custom-field types and options. These direct translations were completed with
low confidence and welcome review by a Northern Sami speaker. This left **90,617
genuinely untranslated values across 42 locale files**.
The tenth 50-value Northern Sami batch added permanent deletion, profile and WIP
controls, account enrollment, invitation, password-reset and verification
emails, and board, user, JSON, CSV and linked-card validation. These direct
translations were completed with low confidence and welcome review by a Northern
Sami speaker. This left **90,567 genuinely untranslated values across 42 locale
files**.
The eleventh 50-value Northern Sami batch added account conflicts, card PDF and
Excel exports, attachment metadata and disk-space errors, list sorting and date,
label and member filters. These direct translations were completed with low
confidence and welcome review by a Northern Sami speaker. This left **90,517
genuinely untranslated values across 42 locale files**.
The twelfth 50-value Northern Sami batch added advanced filters, imported-member
status and Kanboard, NextCloud Deck, OpenProject, Asana, ZenKit, Trello, Jira,
Excel, CSV and WeKan board-import instructions. These direct translations were
completed with low confidence and welcome review by a Northern Sami speaker.
This left **90,467 genuinely untranslated values across 42 locale files**.
The thirteenth 50-value Northern Sami batch added Trello ZIP safety, workspace
placement, API imports and cancellation, member mapping, clipboard and keyboard
controls, date validation and labels. These direct translations were completed
with low confidence and welcome review by a Northern Sami speaker. This left
**90,417 genuinely untranslated values across 42 locale files**.
The fourteenth 50-value Northern Sami batch added board departure and archive
navigation, user, team and organization settings, list and swimlane actions,
bulk selection, board roles and participation notifications. These direct
translations were completed with low confidence and welcome review by a Northern
Sami speaker. This left **90,367 genuinely untranslated values across 42 locale
files**.
The fifteenth 50-value Northern Sami batch added watched-board notifications,
private-page access, image previews, board visibility, member removal, Sandstorm
access guidance, search, WIP and keyboard shortcuts and default-board controls.
These direct translations were completed with low confidence and welcome review
by a Northern Sami speaker. This left **90,317 genuinely untranslated values
across 42 locale files**.
The sixteenth 50-value Northern Sami batch added starred boards, time tracking,
assignee and label shortcuts, upload status, custom logo and URL branding,
welcome-board templates and WIP validation. These direct translations were
completed with low confidence and welcome review by a Northern Sami speaker.
This left **90,267 genuinely untranslated values across 42 locale files**.
The seventeenth 50-value Northern Sami batch added attachment and API size
limits, avatar blocking, registration and SMTP invitations, webhook controls and
runtime package and version labels. These direct translations were completed
with low confidence and welcome review by a Northern Sami speaker. This left
**90,217 genuinely untranslated values across 42 locale files**.
The eighteenth 50-value Northern Sami batch added database, FerretDB, reactivity,
DDP and operating-system diagnostics, custom-field display, account visibility,
organization tenancy, domains, administrators and membership synchronization.
These direct translations were completed with low confidence and welcome review
by a Northern Sami speaker. This left **90,167 genuinely untranslated values
across 42 locale files**.
The nineteenth 50-value Northern Sami batch added received and end dates, color
and assignee metadata, board and notification deletion, subtask and card
settings, minicard badges, parent paths and label activity. These direct
translations were completed with low confidence and welcome review by a Northern
Sami speaker. This left **90,117 genuinely untranslated values across 42 locale
files**.
The twentieth 50-value Northern Sami batch added label and custom-field activity,
automation rule editing and workflow views, card, label, member, checklist and
attachment triggers and JSON, CSV and Trello Butler rule exchange. These direct
translations were completed with low confidence and welcome review by a Northern
Sami speaker. This left **90,067 genuinely untranslated values across 42 locale
files**.
The twenty-first 50-value Northern Sami batch added n8n and Node-RED workflow
imports, scheduled and button triggers, recurring dates, due-date conditions,
card residence, list sorting, completion and relative-date actions. These direct
translations were completed with low confidence and welcome review by a Northern
Sami speaker. This left **90,017 genuinely untranslated values across 42 locale
files**.
The twenty-second 50-value Northern Sami batch added automation sentence
fragments for board, list, card, label, member, attachment and checklist
conditions, plus move, restore, color, membership, checklist and email actions.
These direct translations were completed with low confidence and welcome review
by a Northern Sami speaker. This left **89,967 genuinely untranslated values
across 42 locale files**.
The twenty-third 50-value Northern Sami batch added further rule actions for
email, archive, labels, cards, members, checklists, swimlanes and date fields,
plus authentication, custom product metadata, web manifests, asset links and
layout controls. These direct translations were completed with low confidence
and welcome review by a Northern Sami speaker. This left **89,917 genuinely
untranslated values across 42 locale files**.
The twenty-fourth 50-value Northern Sami batch added member lists, custom HTML
placement, authentication errors, duplication and deletion confirmations,
card-date activity and reminders, positioning and desktop interaction controls.
These direct translations were completed with low confidence and welcome review
by a Northern Sami speaker. This left **89,867 genuinely untranslated values
across 42 locale files**.
The twenty-fifth 50-value Northern Sami batch added multi-card windows, editor
keyboard behavior, organization, team and user dialogs, notification filters,
board-role permissions and status, weekdays and linked-card deletion guidance.
These direct translations were completed with low confidence and welcome review
by a Northern Sami speaker. This left **89,817 genuinely untranslated values
across 42 locale files**.
The twenty-sixth 50-value Northern Sami batch added linked-card safety,
checklist visibility, tasks, domains and shared templates, My Cards and Due
Cards views, global search choices and missing-item messages. These direct
translations were completed with low confidence and welcome review by a Northern
Sami speaker. This left **89,767 genuinely untranslated values across 42 locale
files**.
The twenty-seventh 50-value Northern Sami batch added missing-result messages
and localized global-search operators and predicates for boards, people, dates,
content and status. These direct translations were completed with low confidence
and welcome review by a Northern Sami speaker. This left **89,717 genuinely
untranslated values across 42 locale files**.
The twenty-eighth 50-value Northern Sami batch completed the localized Global
Search operator reference, validation messages, paging and notes while
preserving all query examples and runtime tokens. These direct translations were
completed with low confidence and welcome review by a Northern Sami speaker.
This left **89,667 genuinely untranslated values across 42 locale files**.
The twenty-ninth 50-value Northern Sami batch added sorting, stickers, card
dependencies and their imports, board backgrounds and location fields while
preserving all data-format names and runtime tokens. These direct translations
were completed with low confidence and welcome review by a Northern Sami
speaker. This left **89,617 genuinely untranslated values across 42 locale
files**.
The thirtieth 50-value Northern Sami batch added map-location detection,
server-error troubleshooting, activity and swimlane controls, string templates,
and administration reports for files, security, performance and office logins.
These direct translations were completed with low confidence and welcome review
by a Northern Sami speaker. This left **89,567 genuinely untranslated values
across 42 locale files**.
The thirty-first 50-value Northern Sami batch added office, REST API and data
recovery reporting, loading indicators, card sizing, organization and team
deletion safeguards, and ticket workflow states. These direct translations were
completed with low confidence and welcome review by a Northern Sami speaker.
This left **89,517 genuinely untranslated values across 42 locale files**.
The thirty-second 50-value Northern Sami batch added team and organization
management, Node memory diagnostics, legal-notice labels, checklist actions and
attachment storage moves. These direct translations were completed with low
confidence and welcome review by a Northern Sami speaker. This left **89,467
genuinely untranslated values across 42 locale files**.
The thirty-third 50-value Northern Sami batch added attachment storage moves,
location repair, storage statistics and MongoDB Compact administration. These
direct translations were completed with low confidence and welcome review by a
Northern Sami speaker. This left **89,417 genuinely untranslated values across
42 locale files**.
The thirty-fourth 50-value Northern Sami batch added board status and upload
progress, file restrictions, custom translations, checklist display controls,
and support and accessibility pages. These direct translations were completed
with low confidence and welcome review by a Northern Sami speaker. This left
**89,367 genuinely untranslated values across 42 locale files**.
The thirty-fifth 50-value Northern Sami batch added accessibility content,
brute-force login protection and account unlocking, scheduled jobs, attachment
paths and scheduled board maintenance. These direct translations were completed
with low confidence and welcome review by a Northern Sami speaker. This left
**89,317 genuinely untranslated values across 42 locale files**.
The thirty-sixth 50-value Northern Sami batch added scheduled-job and migration
recovery, filesystem and cloud storage configuration, database migration and
Sandstorm migration status. These direct translations were completed with low
confidence and welcome review by a Northern Sami speaker. This left **89,267
genuinely untranslated values across 42 locale files**.
The thirty-seventh 50-value Northern Sami batch added Sandstorm cleanup, card
loading modes, security and privacy switches, anonymized import and export, and
backup controls. These direct translations were completed with low confidence
and welcome review by a Northern Sami speaker. This left **89,217 genuinely
untranslated values across 42 locale files**.
The thirty-eighth 50-value Northern Sami batch added backup scheduling and
restore modes plus GCS, AWS S3 and Azure cloud-storage setup guidance. These
direct translations were completed with low confidence and welcome review by a
Northern Sami speaker. This left **89,167 genuinely untranslated values across
42 locale files**.
The thirty-ninth 50-value Northern Sami batch added attachment and board
migration controls, GridFS and S3 storage configuration, and scheduled board
operations. These direct translations were completed with low confidence and
welcome review by a Northern Sami speaker. This left **89,117 genuinely
untranslated values across 42 locale files**.
The fortieth 50-value Northern Sami batch added comprehensive board-integrity
checks, recovery of lost and archived items, URL repair and detailed migration
progress. These direct translations were completed with low confidence and
welcome review by a Northern Sami speaker. This left **89,067 genuinely
untranslated values across 42 locale files**.
The forty-first 50-value Northern Sami batch added board-repair steps,
conversion progress, migration schedules, CPU and filesystem monitoring, and
job-queue details. These direct translations were completed with low confidence
and welcome review by a Northern Sami speaker. This left **89,017 genuinely
untranslated values across 42 locale files**.
The forty-second 50-value Northern Sami batch added migration throttling and
logs, monitoring refresh and export, pagination, resource usage and storage
distribution. These direct translations were completed with low confidence and
welcome review by a Northern Sami speaker. This left **88,967 genuinely
untranslated values across 42 locale files**.
The forty-third 50-value Northern Sami batch added repository accounts and
authentication, problem reporting, broken-card repair, CPU status and event-log
fields. These direct translations were completed with low confidence and
welcome review by a Northern Sami speaker. This left **88,917 genuinely
untranslated values across 42 locale files**.
The final 17-value Northern Sami batch added event network fields, filesystem
integrity, scoped import and export, and the number search operator. These direct
translations were completed with low confidence and welcome review by a
Northern Sami speaker. Northern Sami is now complete, leaving **88,900 genuinely
untranslated values across 41 locale files**.
The first 50-value Sinhala batch added board activity messages for cards,
attachments, subtasks, labels, checklists, comments, members and archive and
import operations. These direct translations were completed with low confidence
and welcome review by a Sinhala speaker. This left **88,850 genuinely
untranslated values across 41 locale files**.
The second 50-value Sinhala batch added card movement and restoration, generic
activity messages, checklist history and workspace controls. These direct
translations were completed with low confidence and welcome review by a Sinhala
speaker. This left **88,800 genuinely untranslated values across 41 locale
files**.
The third 50-value Sinhala batch added workspace deletion and multi-board
selection, Home-board actions, list sizing, keyboard shortcuts, swimlane sizing
and checklist creation. These direct translations were completed with low
confidence and welcome review by a Sinhala speaker. This left **88,750 genuinely
untranslated values across 41 locale files**.
The fourth 50-value Sinhala batch added administration announcements, archive
and template controls, attachment and background settings, board-member views
and private-board status. These direct translations were completed with low
confidence and welcome review by a Sinhala speaker. This left **88,700 genuinely
untranslated values across 41 locale files**.
The fifth 50-value Sinhala batch added public-board status, board views and zoom,
calendar navigation, archive guidance and card dates, time and editing controls.
These direct translations were completed with low confidence and welcome review
by a Sinhala speaker. This left **88,650 genuinely untranslated values across 41
locale files**.
The sixth 50-value Sinhala batch added card membership, voting and Planning
Poker, dependencies, organizations and teams, account and background dialogs,
and board-item import and export. These direct translations were completed with
low confidence and welcome review by a Sinhala speaker. This left **88,600
genuinely untranslated values across 41 locale files**.
The seventh 50-value Sinhala batch added member and import dialogs, identity
mapping, themes, fonts, text colors, avatars, language and permission controls.
These direct translations were completed with low confidence and welcome review
by a Sinhala speaker. This left **88,550 genuinely untranslated values across 41
locale files**.
The eighth 50-value Sinhala batch added starring, automatic list widths, card
aging, keyboard movement and navigation, dialog controls and color names. These
direct translations were completed with low confidence and welcome review by a
Sinhala speaker. This left **88,500 genuinely untranslated values across 41
locale files**.
The ninth 50-value Sinhala batch added comment and read-only roles, deletion
confirmations, clipboard actions, bulk card-copy JSON and custom-field types.
These direct translations were completed with low confidence and welcome review
by a Sinhala speaker. This left **88,450 genuinely untranslated values across 41
locale files**.
The tenth 50-value Sinhala batch added custom fields, permanent-delete settings,
WIP limits, profile and notification dialogs, account emails and import and
permission errors. These direct translations were completed with low confidence
and welcome review by a Sinhala speaker. This left **88,400 genuinely
untranslated values across 41 locale files**.
The eleventh 50-value Sinhala batch added account-validation errors, card export
to PDF and Excel, attachment metadata, list sorting and due-date, label and
member filters. These direct translations were completed with low confidence
and welcome review by a Sinhala speaker. This left **88,350 genuinely
untranslated values across 41 locale files**.
The twelfth 50-value Sinhala batch added assignee and advanced filters, member
status, and import guidance for Kanboard, Deck, OpenProject, issue trackers,
Asana, ZenKit, Trello, CSV, Jira, Excel and WeKan. These direct translations
were completed with low confidence and welcome review by a Sinhala speaker.
This left **88,300 genuinely untranslated values across 41 locale files**.
The thirteenth 50-value Sinhala batch added safe Trello archive and API imports,
workspace placement, import cancellation and member mapping, date validation,
invitations, keyboard shortcuts and label deletion. These direct translations
were completed with low confidence and welcome review by a Sinhala speaker.
This left **88,250 genuinely untranslated values across 41 locale files**.
The fourteenth 50-value Sinhala batch added last-admin protection, leaving and
archiving guidance, list and swimlane actions, multi-selection, muted and normal
roles, archive states and participation notifications. These direct
translations were completed with low confidence and welcome review by a Sinhala
speaker. This left **88,200 genuinely untranslated values across 41 locale
files**.
The fifteenth 50-value Sinhala batch added watch notifications, private and
public page guidance, previews, member removal, card-description recovery,
search, WIP limits, keyboard shortcuts and default-board controls. These direct
translations were completed with low confidence and welcome review by a Sinhala
speaker. This left **88,150 genuinely untranslated values across 41 locale
files**.
The sixteenth 50-value Sinhala batch added starred boards, time tracking,
assignee and label shortcuts, uploads, custom logos and URL schemes, welcome and
template boards, archive warnings and WIP-limit errors. These direct
translations were completed with low confidence and welcome review by a Sinhala
speaker. This left **88,100 genuinely untranslated values across 41 locale
files**.
The seventeenth 50-value Sinhala batch added attachment and API limits,
registration and invitations, SMTP configuration and test email, Webhooks and
server component labels. These direct translations were completed with low
confidence and welcome review by a Sinhala speaker. This left **88,050 genuinely
untranslated values across 41 locale files**.
The eighteenth 50-value Sinhala batch added database and operating-system
diagnostics, reactivity configuration, custom-field display, account changes,
board visibility and organization and team tenancy controls. These direct
translations were completed with low confidence and welcome review by a Sinhala
speaker. This left **88,000 genuinely untranslated values across 41 locale
files**.
The nineteenth 50-value Sinhala batch added received and end dates, card and
selection colors, destructive board and notification actions, subtask and card
settings, minicard metadata, parent paths and label activity. These direct
translations were completed with low confidence and welcome review by a Sinhala
speaker. This left **87,950 genuinely untranslated values across 41 locale
files**.
The twentieth 50-value Sinhala batch added label and attachment activity,
visual rule workflows, triggers and actions, scheduled received dates, and rule
import and export through JSON, CSV and Trello Butler. These direct translations
were completed with low confidence and welcome review by a Sinhala speaker.
This left **87,900 genuinely untranslated values across 41 locale files**.
The twenty-first 50-value Sinhala batch added n8n and Node-RED workflow import,
scheduled and due-date triggers, card and board buttons, list sorting, completion
actions and relative dates. These direct translations were completed with low
confidence and welcome review by a Sinhala speaker. This left **87,850 genuinely
untranslated values across 41 locale files**.
The twenty-second 50-value Sinhala batch added rule conditions for cards,
labels, members, attachments and checklists plus move, archive, color, member,
checklist and email actions. These direct translations were completed with low
confidence and welcome review by a Sinhala speaker. This left **87,800 genuinely
untranslated values across 41 locale files**.
The twenty-third 50-value Sinhala batch added generated rule actions for email,
archive, labels, members, checklists, cards and dates plus authentication,
custom HTML metadata, web manifests, asset links and layout controls. These
direct translations were completed with low confidence and welcome review by a
Sinhala speaker. This left **87,750 genuinely untranslated values across 41
locale files**.
The twenty-fourth 50-value Sinhala batch added member lists, custom HTML
placement, authentication errors, duplication and deletion confirmations,
card-date activity and reminders, positioning and desktop interaction controls.
These direct translations were completed with low confidence and welcome review
by a Sinhala speaker. This left **87,700 genuinely untranslated values across 41
locale files**.
The twenty-fifth 50-value Sinhala batch added multi-card windows, editor
keyboard behavior, organization, team and user dialogs, notification filters,
board-role permissions and status, weekdays and linked-card deletion guidance.
These direct translations were completed with low confidence and welcome review
by a Sinhala speaker. This left **87,650 genuinely untranslated values across 41
locale files**.
The twenty-sixth 50-value Sinhala batch added linked-card safety, checklist
visibility, tasks, domains and shared templates, My Cards and Due Cards views,
Global Search choices and missing-item messages. These direct translations were
completed with low confidence and welcome review by a Sinhala speaker. This
left **87,600 genuinely untranslated values across 41 locale files**.
The twenty-seventh 50-value Sinhala batch added missing-result messages and
localized Global Search operators and predicates for boards, people, dates,
content and status. These direct translations were completed with low
confidence and welcome review by a Sinhala speaker. This left **87,550 genuinely
untranslated values across 41 locale files**.
The twenty-eighth 50-value Sinhala batch completed the localized Global Search
operator reference, validation messages, paging and notes while preserving all
query examples and runtime tokens. These direct translations were completed
with low confidence and welcome review by a Sinhala speaker. This left **87,500
genuinely untranslated values across 41 locale files**.
The twenty-ninth 50-value Sinhala batch added board and card sorting, stickers,
card dependency relations and imports, board backgrounds, and location fields.
These direct translations were completed with low confidence and welcome review
by a Sinhala speaker. This left **87,450 genuinely untranslated values across 41
locale files**.
The thirtieth 50-value Sinhala batch added map detection, server troubleshooting,
board activity controls, custom-field string templates and Admin Panel reports.
These direct translations were completed with low confidence and welcome review
by a Sinhala speaker. This left **87,400 genuinely untranslated values across 41
locale files**.
The thirty-first 50-value Sinhala batch added office, API and recovery reports,
swimlane copying, loading animations, organization safeguards and support-ticket
fields. These direct translations were completed with low confidence and welcome
review by a Sinhala speaker. This left **87,350 genuinely untranslated values
across 41 locale files**.
The thirty-second 50-value Sinhala batch added team and organization controls,
Node memory diagnostics, legal notices, checklist actions and attachment-storage
moves. These direct translations were completed with low confidence and welcome
review by a Sinhala speaker. This left **87,300 genuinely untranslated values
across 41 locale files**.
The thirty-third 50-value Sinhala batch added attachment-storage migration,
location repair, storage statistics and MongoDB compaction controls. These direct
translations were completed with low confidence and welcome review by a Sinhala
speaker. This left **87,250 genuinely untranslated values across 41 locale
files**.
The thirty-fourth 50-value Sinhala batch added board status, upload and account
prompts, custom translations, checklist display, support and accessibility
controls. These direct translations were completed with low confidence and
welcome review by a Sinhala speaker. This left **87,200 genuinely untranslated
values across 41 locale files**.
The thirty-fifth 50-value Sinhala batch added accessibility content, brute-force
lockout administration, scheduled jobs, attachment paths and scheduled board
operations. These direct translations were completed with low confidence and
welcome review by a Sinhala speaker. This left **87,150 genuinely untranslated
values across 41 locale files**.
The thirty-sixth 50-value Sinhala batch added scheduled-job recovery,
filesystem, S3 and Azure storage, database migration and Sandstorm migration
status. These direct translations were completed with low confidence and welcome
review by a Sinhala speaker. This left **87,100 genuinely untranslated values
across 41 locale files**.
The thirty-seventh 50-value Sinhala batch added Sandstorm cleanup, adaptive card
loading, safe text rendering, privacy controls for imports and exports, and
backup creation. These direct translations were completed with low confidence
and welcome review by a Sinhala speaker. This left **87,050 genuinely
untranslated values across 41 locale files**.
The thirty-eighth 50-value Sinhala batch added scheduled backup restoration and
setup guidance for GCS, S3-compatible providers and Azure storage. These direct
translations were completed with low confidence and welcome review by a Sinhala
speaker. This left **87,000 genuinely untranslated values across 41 locale
files**.
The thirty-ninth 50-value Sinhala batch added GridFS and S3 configuration,
migration lifecycle controls and scheduled board operations. These direct
translations were completed with low confidence and welcome review by a Sinhala
speaker. This left **86,950 genuinely untranslated values across 41 locale
files**.
The fortieth 50-value Sinhala batch added board-integrity migrations for lists,
lost cards, archives, avatar and attachment URLs, plus detailed progress steps.
These direct translations were completed with low confidence and welcome review
by a Sinhala speaker. This left **86,900 genuinely untranslated values across 41
locale files**.
The forty-first 50-value Sinhala batch completed board-migration steps and added
cleanup, conversion, CPU, scheduling, filesystem, GridFS and job-queue labels.
These direct translations were completed with low confidence and welcome review
by a Sinhala speaker. This left **86,850 genuinely untranslated values across 41
locale files**.
The forty-second 50-value Sinhala batch added attachment-migration tuning,
monitoring, scheduling and system-resource status. These direct translations
were completed with low confidence and welcome review by a Sinhala speaker. This
left **86,800 genuinely untranslated values across 41 locale files**.
The forty-third 50-value Sinhala batch added repository management,
authentication errors, Problems status, card repair and event-report fields.
These direct translations were completed with low confidence and welcome review
by a Sinhala speaker. This left **86,750 genuinely untranslated values across 41
locale files**.
The final 17-value Sinhala batch added event-address and filesystem-integrity
labels, scoped import and export guidance, and the Global Search card-number
operator. These direct translations were completed with low confidence and
welcome review by a Sinhala speaker. Sinhala is now complete, leaving **86,733
genuinely untranslated values across 40 locale files**.
The first 50-value Samoan batch added activity history for board, card, list,
swimlane, attachment, label, checklist, comment, custom-field and member changes.
These direct translations were completed with low confidence and welcome review
by a Samoan speaker. This left **86,683 genuinely untranslated values across 40
locale files**.
The second 50-value Samoan batch completed core activity sentences and added All
Boards workspace creation, editing and navigation controls. These direct
translations were completed with low confidence and welcome review by a Samoan
speaker. This left **86,633 genuinely untranslated values across 40 locale
files**.
The third 50-value Samoan batch added workspace selection, Home-board behavior,
list widths, swimlane height, keyboard shortcuts and checklist and card actions.
These direct translations were completed with low confidence and welcome review
by a Samoan speaker. This left **86,583 genuinely untranslated values across 40
locale files**.
The fourth 50-value Samoan batch added administration, announcements, offline
recovery, archives, templates, attachments, backgrounds, All Boards display and
member and assignee summaries. These direct translations were completed with low
confidence and welcome review by a Samoan speaker. This left **86,533 genuinely
untranslated values across 40 locale files**.
The fifth 50-value Samoan batch added public-board and workspace navigation,
appearance and responsive views, zoom, calendars, archive warnings and card
metadata. These direct translations were completed with low confidence and
welcome review by a Samoan speaker. This left **86,483 genuinely untranslated
values across 40 locale files**.
The sixth 50-value Samoan batch added voting and Planning Poker, dependencies,
organization, team and domain controls, backgrounds and scoped import and export
dialogs. These direct translations were completed with low confidence and
welcome review by a Samoan speaker. This left **86,433 genuinely untranslated
values across 40 locale files**.
The seventh 50-value Samoan batch added member mapping, linked items, themes,
fonts, avatars, permissions and assorted popup titles. These direct translations
were completed with low confidence and welcome review by a Samoan speaker. This
left **86,383 genuinely untranslated values across 40 locale files**.
The eighth 50-value Samoan batch added starring, automatic list widths, card
aging, navigation and accessibility controls, and localized color names. These
direct translations were completed with low confidence and welcome review by a
Samoan speaker. This left **86,333 genuinely untranslated values across 40 locale
files**.
The ninth 50-value Samoan batch added board roles, deletion confirmations,
clipboard and link actions, bulk template-copy JSON and custom fields. These
direct translations were completed with low confidence and welcome review by a
Samoan speaker. This left **86,283 genuinely untranslated values across 40 locale
files**.
The tenth 50-value Samoan batch added deletion policy, WIP settings, profile and
date dialogs, account and invitation emails, and import and permission errors.
These direct translations were completed with low confidence and welcome review
by a Samoan speaker. This left **86,233 genuinely untranslated values across 40
locale files**.
The eleventh 50-value Samoan batch added account-conflict errors, card export to
PDF and Excel, attachment metadata, list sorting and date, label and member
filters. These direct translations were completed with low confidence and
welcome review by a Samoan speaker. This left **86,183 genuinely untranslated
values across 40 locale files**.
The twelfth 50-value Samoan batch added assignee and custom-field filters,
advanced-filter syntax, activity display and imports from kanban, issue-tracker,
spreadsheet and Trello sources. These direct translations were completed with
low confidence and welcome review by a Samoan speaker. This left **86,133
genuinely untranslated values across 40 locale files**.
The thirteenth 50-value Samoan batch added Trello API imports and job controls,
member mapping, validation, keyboard shortcuts and label management. These direct
translations were completed with low confidence and welcome review by a Samoan
speaker. This left **86,083 genuinely untranslated values across 40 locale
files**.
The fourteenth 50-value Samoan batch added last-admin protection, leaving boards,
list and archive actions, settings dialogs, imports, multi-selection, board roles
and notification preferences. These direct translations were completed with low
confidence and welcome review by a Samoan speaker. This left **86,033 genuinely
untranslated values across 40 locale files**.
The fifteenth 50-value Samoan batch added watch notifications, private and public
page guidance, previews, member removal, description recovery, search, WIP,
keyboard shortcuts and default-board controls. These direct translations were
completed with low confidence and welcome review by a Samoan speaker. This left
**85,983 genuinely untranslated values across 40 locale files**.
The sixteenth 50-value Samoan batch added starred boards, time tracking,
assignee and label shortcuts, uploads, custom logos and URL schemes, welcome and
template boards, archive warnings and WIP-limit errors. These direct translations
were completed with low confidence and welcome review by a Samoan speaker. This
left **85,933 genuinely untranslated values across 40 locale files**.
The seventeenth 50-value Samoan batch added attachment and API limits,
registration and invitations, SMTP configuration and test email, Webhooks and
server component labels. These direct translations were completed with low
confidence and welcome review by a Samoan speaker. This left **85,883 genuinely
untranslated values across 40 locale files**.
The eighteenth 50-value Samoan batch added database and operating-system
diagnostics, reactivity configuration, custom-field display, account changes,
board visibility and organization and team tenancy controls. These direct
translations were completed with low confidence and welcome review by a Samoan
speaker. This left **85,833 genuinely untranslated values across 40 locale
files**.
The nineteenth 50-value Samoan batch added received and end dates, card and
selection colors, destructive board and notification actions, subtask and card
settings, minicard metadata, parent paths and label activity. These direct
translations were completed with low confidence and welcome review by a Samoan
speaker. This left **85,783 genuinely untranslated values across 40 locale
files**.
The twentieth 50-value Samoan batch added label, attachment and custom-field
activity plus visual rule workflows, triggers, actions, received-date scheduling
and JSON, CSV and Trello Butler rule import and export. These direct translations
were completed with low confidence and welcome review by a Samoan speaker. This
left **85,733 genuinely untranslated values across 40 locale files**.
The twenty-first 50-value Samoan batch added n8n and Node-RED workflow imports,
scheduled and due-date triggers, card and board buttons, list sorting, completion
actions and relative dates. These direct translations were completed with low
confidence and welcome review by a Samoan speaker. This left **85,683 genuinely
untranslated values across 40 locale files**.
The twenty-second 50-value Samoan batch added automation conditions for cards,
labels, members, attachments and checklists plus move, archive, color, member,
checklist and email actions. These direct translations were completed with low
confidence and welcome review by a Samoan speaker. This left **85,633 genuinely
untranslated values across 40 locale files**.
The twenty-third 50-value Samoan batch added generated rule actions for email,
archive, labels, members, checklists, cards and dates plus authentication,
custom head metadata, web manifests, asset links and layout controls. These
direct translations were completed with low confidence and welcome review by a
Samoan speaker. This left **85,583 genuinely untranslated values across 40 locale
files**.
The twenty-fourth 50-value Samoan batch added member lists, custom HTML
placement, authentication errors, duplication and deletion confirmations,
card-date activity and reminders, positioning and desktop interaction controls.
These direct translations were completed with low confidence and welcome review
by a Samoan speaker. This left **85,533 genuinely untranslated values across 40
locale files**.
The twenty-fifth 50-value Samoan batch added multi-window card behavior,
keyboard-save help, notifications, organization, team and user dialogs,
board-role permissions, weekdays, status metadata, voting and linked-card
deletion. These direct translations were completed with low confidence and
welcome review by a Samoan speaker. This left **85,483 genuinely untranslated
values across 40 locale files**.
The twenty-sixth 50-value Samoan batch added linked-card safeguards, checklist
visibility, domain sharing, shared templates, My Cards, Due Cards and global
search views plus not-found errors. These direct translations were completed
with low confidence and welcome review by a Samoan speaker. This left **85,433
genuinely untranslated values across 40 locale files**.
The twenty-seventh 50-value Samoan batch added not-found and card-count results
plus the board, member, date, content and status vocabulary shown by global
search operators and predicates. These direct translations were completed with
low confidence and welcome review by a Samoan speaker. This left **85,383
genuinely untranslated values across 40 locale files**.
The twenty-eighth 50-value Samoan batch added global-search predicates,
validation errors, pagination and detailed operator instructions for boards,
lists, people, dates, status, fields, sorting and limits. These direct
translations were completed with low confidence and welcome review by a Samoan
speaker. This left **85,333 genuinely untranslated values across 40 locale
files**.
The twenty-ninth 50-value Samoan batch added board and card sorting, completion,
stickers, card dependencies and their imports, board backgrounds and locations.
These direct translations were completed with low confidence and welcome review
by a Samoan speaker. This left **85,283 genuinely untranslated values across 40
locale files**.
The thirtieth 50-value Samoan batch added map detection, server troubleshooting,
activity and swimlane movement controls, string templates, system and security
reports, impersonation, recovery and login-office data. These direct
translations were completed with low confidence and welcome review by a Samoan
speaker. This left **85,233 genuinely untranslated values across 40 locale
files**.
The thirty-first 50-value Samoan batch added office, API and recovery reporting,
swimlane copying, loading-spinner styles, card sizing, organization and team
deletion guards and support tickets. These direct translations were completed
with low confidence and welcome review by a Samoan speaker. This left **85,183
genuinely untranslated values across 40 locale files**.
The thirty-second 50-value Samoan batch added team and organization invitations,
Node memory metrics, legal notices, checklist and subtask actions and attachment
storage moves. These direct translations were completed with low confidence and
welcome review by a Samoan speaker. This left **85,133 genuinely untranslated
values across 40 locale files**.
The thirty-third 50-value Samoan batch added attachment migration and repair,
storage statistics, file identifiers and MongoDB compaction controls and safety
guidance. These direct translations were completed with low confidence and
welcome review by a Samoan speaker. This left **85,083 genuinely untranslated
values across 40 locale files**.
The thirty-fourth 50-value Samoan batch added board timing and status, uploads,
account prompts, Mongo sessions, file policies, workspace dragging, custom
translations, checklist display, support and accessibility. These direct
translations were completed with low confidence and welcome review by a Samoan
speaker. This left **85,033 genuinely untranslated values across 40 locale
files**.
The thirty-fifth 50-value Samoan batch added accessibility content, brute-force
lockout policy and user controls, scheduled jobs, attachment paths and board
archive, backup and cleanup scheduling. These direct translations were completed
with low confidence and welcome review by a Samoan speaker. This left **84,983
genuinely untranslated values across 40 locale files**.
The thirty-sixth 50-value Samoan batch added scheduled-job and migration
recovery controls, filesystem, S3 and Azure storage settings and MongoDB,
FerretDB and Sandstorm database migration guidance. These direct translations
were completed with low confidence and welcome review by a Samoan speaker. This
left **84,933 genuinely untranslated values across 40 locale files**.
The thirty-seventh 50-value Samoan batch added Sandstorm cleanup, card-loading
modes, safe plain-text rendering, import, export, identity, activity,
notification and watch restrictions and instance or organization backups. These
direct translations were completed with low confidence and welcome review by a
Samoan speaker. This left **84,883 genuinely untranslated values across 40
locale files**.
The thirty-eighth 50-value Samoan batch added scheduled backups, restore modes,
Google Cloud credentials and permissions, S3 and Azure console navigation,
secret handling and cloud connection testing. These direct translations were
completed with low confidence and welcome review by a Samoan speaker. This left
**84,833 genuinely untranslated values across 40 locale files**.
The thirty-ninth 50-value Samoan batch added GridFS and S3 storage controls,
migration lifecycle actions, scheduled board operations, writable paths and
attachment migration and monitoring. These direct translations were completed
with low confidence and welcome review by a Samoan speaker. This left **84,783
genuinely untranslated values across 40 locale files**.
The fortieth 50-value Samoan batch added comprehensive board integrity checks,
duplicate-list cleanup, lost and archived item restoration, file URL repairs,
migration confirmations, progress and repair steps. These direct translations
were completed with low confidence and welcome review by a Samoan speaker. This
left **84,733 genuinely untranslated values across 40 locale files**.
The forty-first 50-value Samoan batch added detailed repair steps, one-time board
conversion, CPU metrics, recurring job intervals, migration monitoring,
filesystem and GridFS statistics and job-queue fields. These direct translations
were completed with low confidence and welcome review by a Samoan speaker. This
left **84,683 genuinely untranslated values across 40 locale files**.
The forty-second 50-value Samoan batch added migration storage targets, batch,
CPU and delay limits, background-processing guidance, monitoring, navigation,
resource statistics and operation controls. These direct translations were
completed with low confidence and welcome review by a Samoan speaker. This left
**84,633 genuinely untranslated values across 40 locale files**.
The forty-third 50-value Samoan batch added repository accounts, authentication
errors, problem reporting, broken-card repair outcomes, CPU details and event
fields. These direct translations were completed with low confidence and welcome
review by a Samoan speaker. This left **84,583 genuinely untranslated values
across 40 locale files**.
The final 17-value Samoan batch added event network fields, filesystem integrity,
scoped import and export controls and numeric global-search instructions. These
direct translations were completed with low confidence and welcome review by a
Samoan speaker. Samoan is now complete. This left **84,566 genuinely
untranslated values across 39 locale files**.
The first 50-value Somali batch added title and due-date changes, comment
replies, organization and team membership restrictions and detailed activity
entries for attachments, labels, checklists, comments, boards, cards and lists.
These direct translations were completed with low confidence and welcome review
by a Somali speaker. This left **84,516 genuinely untranslated values across 39
locale files**.
The second 50-value Somali batch added card movement and restoration, compact
activity phrases for members, checklists, comments and dates and workspace and
subworkspace navigation. These direct translations were completed with low
confidence and welcome review by a Somali speaker. This left **84,466 genuinely
untranslated values across 39 locale files**.
The third 50-value Somali batch added workspace deletion, multi-board selection
and Home behavior, due and end dates, personal and shared list sizing, keyboard
controls, swimlane height and card and checklist additions. These direct
translations were completed with low confidence and welcome review by a Somali
speaker. This left **84,416 genuinely untranslated values across 39 locale
files**.
The fourth 50-value Somali batch added administrator permissions and
announcements, archives, attachment deletion, board backgrounds, All Boards
display, members and assignees and private-board status. These direct
translations were completed with low confidence and welcome review by a Somali
speaker. This left **84,366 genuinely untranslated values across 39 locale
files**.
The fifth 50-value Somali batch added public-board status, board movement,
desktop and mobile modes, zoom and alternate views plus card, list and swimlane
archive and deletion guidance. These direct translations were completed with low
confidence and welcome review by a Somali speaker. This left **84,316 genuinely
untranslated values across 39 locale files**.
The sixth 50-value Somali batch added card membership, voting and Planning
Poker, dependencies, organization, team and domain dialogs, backgrounds,
account deletion and checklist, swimlane, list, card and board imports. These
direct translations were completed with low confidence and welcome review by a
Somali speaker. This left **84,266 genuinely untranslated values across 39
locale files**.
The seventh 50-value Somali batch added member and linked-card dialogs, safe
mapping of imported virtual users, themes, fonts, avatars, language and
permission controls. These direct translations were completed with low
confidence and welcome review by a Somali speaker. This left **84,216 genuinely
untranslated values across 39 locale files**.
The eighth 50-value Somali batch added starred pages and boards, automatic list
widths, card aging, movement and accessibility controls, dialog actions and the
first color-palette values. These direct translations were completed with low
confidence and welcome review by a Somali speaker. This left **84,166 genuinely
untranslated values across 39 locale files**.
The ninth 50-value Somali batch completed the color palette and added comment and
read-only roles, deletion confirmations, clipboard actions, bulk-card JSON and
custom-field types and options. These direct translations were completed with
low confidence and welcome review by a Somali speaker. This left **84,116
genuinely untranslated values across 39 locale files**.
The tenth 50-value Somali batch added custom-field text and dates, permanent
deletion controls, WIP limits, profile and reaction dialogs, account and
invitation email templates and board, import and linked-card errors. These
direct translations were completed with low confidence and welcome review by a
Somali speaker. This left **84,066 genuinely untranslated values across 39
locale files**.
The eleventh 50-value Somali batch added account conflicts, card export to PDF
and Excel, attachment metadata and disk-space failures plus list sorting and
date, label and member filters. These direct translations were completed with
low confidence and welcome review by a Somali speaker. This left **84,016
genuinely untranslated values across 39 locale files**.
The twelfth 50-value Somali batch added assignee and custom-field filters,
advanced-filter syntax, imported-member status and detailed Kanboard,
NextCloud Deck, OpenProject, issue, Asana, ZenKit, Trello, CSV, Jira, Excel and
WeKan board imports. These direct translations were completed with low
confidence and welcome review by a Somali speaker. This left **83,966 genuinely
untranslated values across 39 locale files**.
The thirteenth 50-value Somali batch added Trello API imports and credentials,
selectable and resumable import jobs, cancellation and deletion safeguards,
member mapping, date and user validation, keyboard shortcuts and label creation
and deletion. These direct translations were completed with low confidence and
welcome review by a Somali speaker. This left **83,916 genuinely untranslated
values across 39 locale files**.
The fourteenth 50-value Somali batch added last-admin protection, leaving and
linking boards and lists, list archiving and imports, settings dialogs,
multi-selection, muted notifications, archive status and normal board roles.
These direct translations were completed with low confidence and welcome review
by a Somali speaker. This left **83,866 genuinely untranslated values across 39
locale files**.
The fifteenth 50-value Somali batch added watched notifications, public and
private access, member removal and Sandstorm warnings, unsaved-card rescue,
search, WIP, keyboard shortcuts, sidebars, signup and default-board behavior.
These direct translations were completed with low confidence and welcome review
by a Somali speaker. This left **83,816 genuinely untranslated values across 39
locale files**.
The sixteenth 50-value Somali batch added starred boards, subscriptions, spent
and overtime tracking, label and assignee shortcuts, uploads, custom logo and
help URLs, welcome templates and WIP limit errors. These direct translations
were completed with low confidence and welcome review by a Somali speaker. This
left **83,766 genuinely untranslated values across 39 locale files**.
The seventeenth 50-value Somali batch added attachment and API transfer limits,
avatar blocking, registration invitations, SMTP and TLS settings, invitation
emails, webhooks and database, Node and Meteor version labels. These direct
translations were completed with low confidence and welcome review by a Somali
speaker. This left **83,716 genuinely untranslated values across 39 locale
files**.
The eighteenth 50-value Somali batch added database, FerretDB, reactivity, DDP
and operating-system diagnostics, custom-field display, account settings and
organization and team tenancy, domains, administrators and member propagation.
These direct translations were completed with low confidence and welcome review
by a Somali speaker. This left **83,666 genuinely untranslated values across 39
locale files**.
The nineteenth 50-value Somali batch added received and end dates, colors,
destructive board and notification actions, duplicate-list cleanup, subtask
routing, minicard counters, cover and parent display and label activity. These
direct translations were completed with low confidence and welcome review by a
Somali speaker. This left **83,616 genuinely untranslated values across 39
locale files**.
The twentieth 50-value Somali batch added label, attachment and custom-field
activity plus automation rule building, card and member triggers, scheduled
times and JSON, CSV and Trello Butler rule import and export. These direct
translations were completed with low confidence and welcome review by a Somali
speaker. This left **83,566 genuinely untranslated values across 39 locale
files**.
The twenty-first 50-value Somali batch added n8n and Node-RED workflow imports,
scheduled and due-date triggers, card and board buttons, list sorting,
completion, bulk card movement and relative dates. These direct translations
were completed with low confidence and welcome review by a Somali speaker. This
left **83,516 genuinely untranslated values across 39 locale files**.
The twenty-second 50-value Somali batch added automation conditions for cards,
lists, archives, labels, members, attachments and checklists plus movement,
member, color, checklist and email actions. These direct translations were
completed with low confidence and welcome review by a Somali speaker. This left
**83,466 genuinely untranslated values across 39 locale files**.
The twenty-third 50-value Somali batch added concrete rule actions for email,
archive, labels, members, checklists, cards and dates plus authentication,
custom head metadata, web manifests, asset links and layout controls. These
direct translations were completed with low confidence and welcome review by a
Somali speaker. This left **83,416 genuinely untranslated values across 39
locale files**.
The twenty-fourth 50-value Somali batch added member lists, custom HTML
placement, authentication errors, duplication and deletion confirmations,
card-date activity and reminders, positioning and desktop interaction controls.
These direct translations were completed with low confidence and welcome review
by a Somali speaker. This left **83,366 genuinely untranslated values across 39
locale files**.
The twenty-fifth 50-value Somali batch added multi-card windows, inline editor
behavior, organization, team and user dialogs, unread controls, board-role
permissions and status, weekdays, ownership, activity and voting. These direct
translations were completed with low confidence and welcome review by a Somali
speaker. This left **83,316 genuinely untranslated values across 39 locale
files**.
The twenty-sixth 50-value Somali batch added linked-card deletion guidance,
tasks, email domains, shared templates, personal and due-card views, global
search and missing board-item messages. These direct translations were
completed with low confidence and welcome review by a Somali speaker. This left
**83,266 genuinely untranslated values across 39 locale files**.
The twenty-seventh 50-value Somali batch added missing-user, comment,
organization and team messages, search-result counts and localized search
operators and predicates. These direct translations were completed with low
confidence and welcome review by a Somali speaker. This left **83,216 genuinely
untranslated values across 39 locale files**.
The twenty-eighth 50-value Somali batch added search predicates, validation
messages, pagination and the full operator reference with examples, status
filters, sorting, limits and search notes. These direct translations were
completed with low confidence and welcome review by a Somali speaker. This left
**83,166 genuinely untranslated values across 39 locale files**.
The twenty-ninth 50-value Somali batch added label metadata, board and card
sorting, completion controls, stickers, card dependencies and imports, board
backgrounds and location fields. These direct translations were completed with
low confidence and welcome review by a Somali speaker. This left **83,116
genuinely untranslated values across 39 locale files**.
The thirtieth 50-value Somali batch added map detection, server troubleshooting,
sorting, board activity, string templates and administrative files, security,
performance, impersonation, recovery and office reports. These direct
translations were completed with low confidence and welcome review by a Somali
speaker. This left **83,066 genuinely untranslated values across 39 locale
files**.
The thirty-first 50-value Somali batch added office and API audit details,
database recovery status, swimlane copying, wait-spinner styles, organization
warnings and help-desk tickets and requests. These direct translations were
completed with low confidence and welcome review by a Somali speaker. This left
**83,016 genuinely untranslated values across 39 locale files**.
The thirty-second 50-value Somali batch added team and organization management,
invitations, Node memory diagnostics, legal notices, checklist conversion and
copying, and attachment storage movement. These direct translations were
completed with low confidence and welcome review by a Somali speaker. This left
**82,966 genuinely untranslated values across 39 locale files**.
The thirty-third 50-value Somali batch added bulk attachment movement, storage
repair, avatars, default storage and file statistics plus MongoDB GridFS space
reclamation and compact status. These direct translations were completed with
low confidence and welcome review by a Somali speaker. This left **82,916
genuinely untranslated values across 39 locale files**.
The thirty-fourth 50-value Somali batch added board timing and upload status,
file restrictions, custom translations, workspace dragging, checklist display,
support and accessibility settings. These direct translations were completed
with low confidence and welcome review by a Somali speaker. This left **82,866
genuinely untranslated values across 39 locale files**.
The thirty-fifth 50-value Somali batch added accessibility content, brute-force
login protection and unlocking, user status filters, scheduled jobs, attachment
paths and scheduled board maintenance. These direct translations were
completed with low confidence and welcome review by a Somali speaker. This left
**82,816 genuinely untranslated values across 39 locale files**.
The thirty-sixth 50-value Somali batch added scheduled-job and migration
controls, filesystem, S3 and Azure storage configuration, MongoDB and FerretDB
database migration and Sandstorm migration status. These direct translations
were completed with low confidence and welcome review by a Somali speaker. This
left **82,766 genuinely untranslated values across 39 locale files**.
The thirty-seventh 50-value Somali batch added Sandstorm cleanup, adaptive card
loading, safe plain-text rendering, import and export restrictions,
anonymization, activity and notification controls and instance or organization
backups. These direct translations were completed with low confidence and
welcome review by a Somali speaker. This left **82,716 genuinely untranslated
values across 39 locale files**.
The thirty-eighth 50-value Somali batch added scheduled backup timing and
restore modes, Google Cloud credentials and permissions, S3, Azure and GCS
console guidance, cloud connection tests and Azure attachment movement. These
direct translations were completed with low confidence and welcome review by a
Somali speaker. This left **82,666 genuinely untranslated values across 39
locale files**.
The thirty-ninth 50-value Somali batch added Google Cloud and GridFS attachment
storage, migration lifecycle controls, S3 authentication and connection
settings, scheduled board operations and attachment monitoring. These direct
translations were completed with low confidence and welcome review by a Somali
speaker. This left **82,616 genuinely untranslated values across 39 locale
files**.
The fortieth 50-value Somali batch added comprehensive board integrity
migrations, lost-card and archived-item recovery, duplicate and missing-list
repair, file URL fixes, confirmations and progress steps. These direct
translations were completed with low confidence and welcome review by a Somali
speaker. This left **82,566 genuinely untranslated values across 39 locale
files**.
The forty-first 50-value Somali batch added board-repair steps, conversion and
cleanup status, CPU and database monitoring, recurring intervals, filesystem
and GridFS statistics and scheduled-job details. These direct translations were
completed with low confidence and welcome review by a Somali speaker. This left
**82,516 genuinely untranslated values across 39 locale files**.
The forty-second 50-value Somali batch added attachment migration thresholds,
logs and controls, monitoring navigation, recurring runs, progress, storage
distribution and system resource totals. These direct translations were
completed with low confidence and welcome review by a Somali speaker. This left
**82,466 genuinely untranslated values across 39 locale files**.
The forty-third 50-value Somali batch added repository management,
authentication and account errors, problem summaries, broken-card repair, CPU
load and event metadata. These direct translations were completed with low
confidence and welcome review by a Somali speaker. This left **82,416 genuinely
untranslated values across 39 locale files**.
The final 17-value Somali batch added event network metadata, filesystem
integrity, scoped export details, import sources and numeric search syntax. This
completed all **2,166 Somali values** with low confidence and welcomes review by
a Somali speaker, leaving **82,399 genuinely untranslated values across 38
locale files**.
The first 50-value Swati batch added core activity messages for boards, cards,
lists, swimlanes, attachments, subtasks, labels, checklists, comments, custom
fields, members, imports and archiving. These direct translations were
completed with low confidence and welcome review by a Swati speaker. This left
**82,349 genuinely untranslated values across 38 locale files**.
The second 50-value Swati batch added card movement and restoration, concise
activity summaries, checklist activity, received and start dates and workspace
creation, editing and settings. These direct translations were completed with
low confidence and welcome review by a Swati speaker. This left **82,299
genuinely untranslated values across 38 locale files**.
The third 50-value Swati batch added workspace deletion, multi-board selection,
home boards, due and end dates, templates, personal and fixed list widths,
keyboard shortcuts, swimlane height and checklist and member controls. These
direct translations were completed with low confidence and welcome review by a
Swati speaker. This left **82,249 genuinely untranslated values across 38
locale files**.
The fourth 50-value Swati batch added member administration, announcements,
offline recovery, archives, templates, attachment deletion, board backgrounds,
All Boards display, members and assignees and private-board status. These direct
translations were completed with low confidence and welcome review by a Swati
speaker. This left **82,199 genuinely untranslated values across 38 locale
files**.
The fifth 50-value Swati batch added public-board status, board navigation,
background and view controls, desktop and mobile zoom, calendar navigation,
archive guidance, deletion warnings, dates and card editing controls. These
direct translations were completed with low confidence and welcome review by a
Swati speaker. This left **82,149 genuinely untranslated values across 38
locale files**.
The sixth 50-value Swati batch added card membership, voting and Planning Poker,
dependencies, organization, team and domain dialogs, board backgrounds, account
deletion and checklist and board-item imports. These direct translations were
completed with low confidence and welcome review by a Swati speaker. This left
**82,099 genuinely untranslated values across 38 locale files**.
The seventh 50-value Swati batch added member and sticker dialogs, archived-item
restoration, rule transfer, imported-member mapping, themes, fonts, preview text,
text colors, avatars, languages and permissions. These direct translations were
completed with low confidence and welcome review by a Swati speaker. This left
**82,049 genuinely untranslated values across 38 locale files**.
The eighth 50-value Swati batch added settings, starring, automatic list width,
card aging, movement and accessible dialog navigation plus a broad color
palette. Four color names that matched English were replaced directly with
descriptive Swati terms. These direct translations were completed with low
confidence and welcome review by a Swati speaker. This left **81,999 genuinely
untranslated values across 38 locale files**.
The ninth 50-value Swati batch added the remaining basic colors, comment and
read-only roles, deletion confirmations, clipboard actions, bulk template-card
JSON, labels and custom-field types and options. These direct translations were
completed with low confidence and welcome review by a Swati speaker. This left
**81,949 genuinely untranslated values across 38 locale files**.
The tenth 50-value Swati batch added custom-field text and date settings,
permanent deletion, WIP limits, profile and notification dialogs, enrollment,
invitation, password-reset and verification emails and board, JSON, CSV and
linked-card errors. These direct translations were completed with low
confidence and welcome review by a Swati speaker. This left **81,899 genuinely
untranslated values across 38 locale files**.
The eleventh 50-value Swati batch added account uniqueness errors, card export
to PDF and Excel, export fields and disk-space status, list sorting and date,
label and member filters. These direct translations were completed with low
confidence and welcome review by a Swati speaker. This left **81,849 genuinely
untranslated values across 38 locale files**.
The twelfth 50-value Swati batch added assignee and custom-field filters,
advanced filter syntax, imported-member status and board imports from Kanboard,
Deck, OpenProject, issue trackers, Asana, ZenKit, Trello, Jira, Excel and WeKan,
including Trello ZIP handling. These direct translations were completed with
low confidence and welcome review by a Swati speaker. This left **81,799
genuinely untranslated values across 38 locale files**.
The thirteenth 50-value Swati batch added secure Trello ZIP handling, workspace
placement, API-key imports, selection, cancellation and progress, imported
member mapping, version and date validation, keyboard shortcuts and label
creation and deletion. These direct translations were completed with low
confidence and welcome review by a Swati speaker. This left **81,749 genuinely
untranslated values across 38 locale files**.
The fourteenth 50-value Swati batch added last-administrator protection, leaving
boards, card and list archiving, user, team and organization settings, board-item
imports, movement and multi-selection, muted notifications, archived-item empty
states and board roles. These direct translations were completed with low
confidence and welcome review by a Swati speaker. This left **81,699 genuinely
untranslated values across 38 locale files**.
The fifteenth 50-value Swati batch added watched-item notifications, private and
public page handling, previews, quick access, member removal, Sandstorm access
guidance, unsaved-description rescue, search, WIP limits, keyboard shortcuts,
sidebars, signup and default boards. These direct translations were completed
with low confidence and welcome review by a Swati speaker. This left **81,649
genuinely untranslated values across 38 locale files**.
The sixteenth 50-value Swati batch added starred boards, subscriptions, time
tracking and overtime, keyboard toggles, upload status, custom logo and URL
settings, welcome and template boards and WIP-limit errors. These direct
translations were completed with low confidence and welcome review by a Swati
speaker. This left **81,599 genuinely untranslated values across 38 locale
files**.
The seventeenth 50-value Swati batch added attachment and API transfer limits,
avatar upload blocking, registration and invitations, SMTP configuration and
test email, authorization, outgoing and bidirectional webhooks and database,
Node and Meteor metadata. These direct translations were completed with low
confidence and welcome review by a Swati speaker. This left **81,549 genuinely
untranslated values across 38 locale files**.
The eighteenth 50-value Swati batch added database, FerretDB, reactivity, DDP
and operating-system diagnostics, custom-field display, account changes, board
visibility and organization and team tenancy, domains, administrators and
member synchronization. These direct translations were completed with low
confidence and welcome review by a Swati speaker. This left **81,499 genuinely
untranslated values across 38 locale files**.
The nineteenth 50-value Swati batch added received and end dates, color dialogs,
assignment metadata, destructive board and notification actions, duplicate-list
cleanup, subtask routing, minicard counters, cover and parent display and label
activity. These direct translations were completed with low confidence and
welcome review by a Swati speaker. This left **81,449 genuinely untranslated
values across 38 locale files**.
The twentieth 50-value Swati batch added label, attachment and custom-field
activity plus automation rule building, card and member triggers, scheduled
times and JSON, CSV and Trello Butler rule import and export. These direct
translations were completed with low confidence and welcome review by a Swati
speaker. This left **81,399 genuinely untranslated values across 38 locale
files**.
The twenty-first 50-value Swati batch added n8n and Node-RED workflow imports,
scheduled and due-date triggers, card and board buttons, list sorting,
completion, bulk card movement and relative dates. These direct translations
were completed with low confidence and welcome review by a Swati speaker. This
left **81,349 genuinely untranslated values across 38 locale files**.
The twenty-second 50-value Swati batch added automation conditions for cards,
lists, archives, labels, members, attachments and checklists plus movement,
member, color, checklist and email actions. These direct translations were
completed with low confidence and welcome review by a Swati speaker. This left
**81,299 genuinely untranslated values across 38 locale files**.
The twenty-third 50-value Swati batch added concrete rule actions for email,
archive, labels, members, checklists, cards and dates plus authentication,
custom head metadata, web manifests, asset links and layout controls. These
direct translations were completed with low confidence and welcome review by a
Swati speaker. This left **81,249 genuinely untranslated values across 38
locale files**.
The twenty-fourth 50-value Swati batch added member lists, custom HTML
placement, authentication errors, duplication and deletion confirmations,
card-date activity and reminders, positioning and desktop interaction controls.
These direct translations were completed with low confidence and welcome review
by a Swati speaker. This left **81,199 genuinely untranslated values across 38
locale files**.
The twenty-fifth 50-value Swati batch added multi-card windows, inline editor
behavior, organization, team and user dialogs, unread controls, board-role
permissions and status, weekdays, ownership, activity and voting. These direct
translations were completed with low confidence and welcome review by a Swati
speaker. This left **81,149 genuinely untranslated values across 38 locale
files**.
The twenty-sixth 50-value Swati batch added linked-list deletion, checklist
visibility, tasks, domains and shared templates, My Cards and Due Cards views,
global search and not-found errors. These direct translations were completed
with low confidence and welcome review by a Swati speaker. This left **81,099
genuinely untranslated values across 38 locale files**.
The twenty-seventh 50-value Swati batch added not-found messages, card-result
counts and the localized operators and predicates for advanced card searches.
These direct translations were completed with low confidence and welcome
review by a Swati speaker. This left **81,049 genuinely untranslated values
across 38 locale files**.
The twenty-eighth 50-value Swati batch added advanced-search validation,
pagination and the full localized search grammar, operator reference, examples
and notes. These direct translations were completed with low confidence and
welcome review by a Swati speaker. This left **80,999 genuinely untranslated
values across 38 locale files**.
The twenty-ninth 50-value Swati batch added card and board sorting, completion,
stickers, card dependencies and their import, board backgrounds and the start
of card locations. These direct translations were completed with low
confidence and welcome review by a Swati speaker. This left **80,949 genuinely
untranslated values across 38 locale files**.
The thirtieth 50-value Swati batch completed card locations and added map and
server diagnostics, sorting, swimlane movement, custom-field string templates
and file, security, performance, impersonation, recovery and office reports.
These direct translations were completed with low confidence and welcome
review by a Swati speaker. This left **80,899 genuinely untranslated values
across 38 locale files**.
The thirty-first 50-value Swati batch completed office reporting and added REST
API usage, recovery events and maintenance, swimlane copying, wait-spinner
styles, card sizing, organization and team deletion warnings and help tickets.
These direct translations were completed with low confidence and welcome
review by a Swati speaker. This left **80,849 genuinely untranslated values
across 38 locale files**.
The thirty-second 50-value Swati batch added team and organization management,
invitations, Node heap and memory diagnostics, legal notices, checklist and
subtask actions and the start of attachment-storage movement. These direct
translations were completed with low confidence and welcome review by a Swati
speaker. This left **80,799 genuinely untranslated values across 38 locale
files**.
The thirty-third 50-value Swati batch completed attachment migration and added
storage selection, repair and progress, file statistics and identifiers and
MongoDB compaction guidance and status. These direct translations were
completed with low confidence and welcome review by a Swati speaker. This left
**80,749 genuinely untranslated values across 38 locale files**.
The thirty-fourth 50-value Swati batch added board status and time summaries,
upload progress and limits, custom translations, checklist display, support
pages and the start of accessibility settings. These direct translations were
completed with low confidence and welcome review by a Swati speaker. This left
**80,699 genuinely untranslated values across 38 locale files**.
The thirty-fifth 50-value Swati batch completed accessibility settings and
added brute-force lockout administration, people filters, scheduled jobs,
attachment paths and scheduled board archive, backup and cleanup operations.
These direct translations were completed with low confidence and welcome
review by a Swati speaker. This left **80,649 genuinely untranslated values
across 38 locale files**.
The thirty-sixth 49-value Swati batch completed scheduled-job results and
migration errors, filesystem and cloud-storage basics, database migration and
the start of Sandstorm migration status. This left **80,600 genuinely
untranslated values across 38 locale files**.
The thirty-seventh and thirty-eighth 55-value Swati batches completed Sandstorm
migration and card-loading settings, rich-text safety, import/export and avatar
privacy, activity and notification controls, backups and the AWS, Azure and
Google Cloud storage guidance. This left **80,490 genuinely untranslated values
across 38 locale files**.
The thirty-ninth 55-value Swati batch added migration controls, S3 settings,
scheduled board operations and the board repair and recovery migrations. This
left **80,435 genuinely untranslated values across 38 locale files**.
The fortieth through forty-second 60-value Swati batches completed board and
file repair migrations, progress steps, resource and attachment monitoring,
job schedules and queues, repository accounts and Problems reporting. This
left **80,255 genuinely untranslated values across 38 locale files**.
The final 23-value Swati batch completed security-event fields and scoped board
import/export guidance. Swati is now complete, leaving **80,232 genuinely
untranslated values across 37 locale files**. A same-script vocabulary audit
also replaced bare Zulu-style `ibhodi` in the new settings tail with Swati
`libhodi`; the completion regression rejects those wrong-language forms while
checking every format token and HTML tag against English. These direct
translations were completed with low confidence and welcome review by a Swati
speaker.
The first 50-value Sesotho batch translated core board activity for titles,
descriptions, members, comments, dates, attachments, labels, checklists,
custom fields and archive/import actions while preserving every activity
placeholder. This left **80,182 genuinely untranslated values across 37 locale
files**. These direct translations were completed with low confidence and
welcome review by a Sesotho speaker.
Continue filling English values directly while preserving human translations
and exact tokens from `en.i18n.json`, resuming Sesotho at `act-moveCard` with
`node releases/translations/fill-translations.mjs --list st --limit 50`;
Buryat, Cherokee, Cornish, Central Kurdish, Chuvash, Dzongkha, Ewe, Fulah,
Fijian and Faroese, Irish, Scottish Gaelic and the just-listed warning-only
locales are complete including the newly exposed warning-only values; Guarani,
Manx, Hausa, Haitian Creole, Icelandic, Inuktitut, Javanese, Kazakh, Greenlandic,
Kashmiri and Kurmanji Kurdish, Malagasy, Malayalam, Marathi, Burmese and
Chichewa, Oromo, Pashto, Kirundi, Kinyarwanda and Sakha are now complete.
Sindhi, Northern Sami, Sinhala and Samoan are also now complete.

The newest per-key batch reused each language’s own translated IP-address label
for **282 IPv4 and IPv6 labels** across 141 language tags. It also reset 347
obsolete English Office and Home-board sentences to the current English source,
making those hidden placeholders visible to the safe fill workflow again. The
next batch translated all twelve Office and API report strings across eleven
simplified and traditional Chinese language tags: **132 values**. Japanese and
Korean followed with **60 values** across five language tags, then Russian and
Ukrainian with **72 values** across six language tags, and Arabic with **48
values** across four language tags, then Hebrew and Persian with **48 values**
across four language tags, then Hindi and Gujarati with **36 values** across
three language tags, then Greek with **24 values** across both language tags,
then Belarusian and Bulgarian with **24 values**, and Khmer with **36 values**
across three language tags. Vietnamese followed with **24 values** across both
language tags, then Macedonian and Serbian with **24 values** across both
language tags. Armenian and Georgian followed with **24 values** across both
language tags, then Telugu and Tamil with **24 values** across both language
tags, followed by Odia and Punjabi with **24 values** across both language tags,
then Mongolian with **12 values**.

**What is left, in the order worth doing it.** As of **2026-08-24**:

| Files | To translate | Nothing to translate | Which |
| --- | --- | --- | --- |
| 56 | **463** | 2,171 | non-Latin, near-complete |
| 86 | **2,844** | 3,980 | Latin-script, near-complete |
| 92 | **192,241** | 15,829 | second tier |

The second column is the backlog; the third is strings that equal the English
source because that IS the translation — product names (*Meteor*, *MongoDB*,
*S3/MinIO*, *OAuth2*), bare numbers, symbols, unit abbreviations, and bare
`__board__` placeholders. They will never stop counting, and they are why a flat
count reads several times larger than the work.

1. **The 56 non-Latin near-complete files: 463.** New Office and API
   report strings now dominate this tier; an English string is most glaring
   where it interrupts another script.
2. **The 86 Latin-script near-complete files: 2,844.** Smaller than it looks,
   for a reason worth knowing before starting. Much of what remains is a
   LOANWORD: *magenta* and *indigo* are magenta and indigo nearly everywhere,
   and so are *Filter*, *Container*, *Version*, *Pause*, *Type*, *Status*,
   *Server*, *Normal*, *Ticket*, *Menu* and *Format* across most of Europe.
   The way to find out which is which is to OFFER a key its translation and
   count the refusals: the last batch of twenty everyday words was filled 48
   times and ignored 202.
3. **The 92 second-tier files: 192,241.** Not finishable in one pass. They have
   the board words, the menus, the popup titles and the login page; the natural
   next tiers are the **card details pane**, the **Admin Panel**, the **filter
   and search sidebars**, then the settings and error strings.

**Work by KEY, not by language.** `--status` ends with the remaining keys ranked
by how many files share each, because that ranking is the work order: one key
missing in fifty files is one table, not fifty visits. Everything since the
wrong-language pass was done that way — the search operators in 107 files, the
one-letter shorthands in 89, the import-mapping dialogue in 133.

**Two rules that must not bend.** These are translated DIRECTLY — the maintainer
or the assistant (an LLM) writes each translation from that language's existing
strings and general kanban terminology, with NO external translation service,
API, endpoint, key or password (the old `machine-translate.mjs` was removed on
purpose). And a fill can never overwrite a human translation: `--apply` writes
only where the value is still the English source, reports the rest as skipped,
and filled strings stay LOCAL — they are never pushed to Transifex. `node
releases/translations/verify-human-preference.mjs` proves both directions rather
than asserting them.

**Three things that bit, and will again.** A file whose name says one language
and whose contents are another must be completed in the language it is ACTUALLY
in — `ace` is Malay, `ast-ES` Spanish, `ro` Italian, `ve` Zulu, `vl-SS` Dutch,
and `vo`, `wo`, `zgh` and `wa-RR` are French. A search operator NAME is matched
before the colon and can never contain a space, so a language that writes one as
two words runs them together. And when the ENGLISH source of a key is reworded,
every other file keeps the old English, which is no longer equal to the source
and so stops being offered — 290 values were hiding that way and were reset.

A release can go out at any point: an untranslated key renders its English
source, never the key. What is worth doing before one is the near-complete half,
because those languages are advertised as complete.

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

**In short:** **Build menus** now return immediately after commands finish on
Linux, macOS and Windows instead of waiting for an acknowledgement keystroke.
Release and maintenance output remains visible, but an invisible read or generic
"Press any key" pause no longer makes a completed operation look unfinished.
Prompts that collect versions, paths and other real command arguments are
unchanged. **Mobile layout regression coverage** now follows the current header
and drag-handle structure and tolerates only subpixel browser rounding.
**Security and recovery audits** now cover the current 93-entry vulnerability
catalog, report ScannerBleed attempts, and expose backup/restore failures without
discarding the recovery request needed for retry. **Verified recovery and tamper
audits** now restore corrupt FerretDB SQLite data from checked snapshots or retained
MongoDB source, verify change history and stored files, report evidence in Problems,
and schedule non-urgent checksum work during sustained low CPU usage.

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
<summary><a href="https://github.com/wekan/wekan/commit/1014488c4">Add verified recovery and low-load integrity audits</a>. Thanks to xet7.</summary>

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
<summary><a href="https://github.com/wekan/wekan/commit/a6f20c825">Mobile layout regressions test the current header and subpixel alignment</a>. Thanks to xet7.</summary>

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
<summary><a href="https://github.com/wekan/wekan/commit/d17d51df3">Audit security coverage and recovery failure reporting</a>. Thanks to xet7.</summary>

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
