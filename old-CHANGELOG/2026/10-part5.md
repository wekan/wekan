# WeKan ® 2026-10 releases, part 5

Moved out of [CHANGELOG.md](../../CHANGELOG.md) to keep that
file small enough to open (wekan/wekan#6580). Nothing here has been changed:
a release section is a record, and it reads the same as it did there.

This is part 5 of 5, newest first: [1](10.md), [2](10-part2.md), [3](10-part3.md), [4](10-part4.md), 5.

Releases per day:

| 2026-10 | Releases |
| --- | --- |
| 01 | 1 |

# v12.13 2026-10-01 WeKan ® release

**In short:** Fixes **ReplyBleed**: a reply to a notification email is now
attributed only to the person it was sent to. Carries out the maintainer's
2026-09-30 decisions: **incarnations** for Scrum records and activities,
**90-day compaction** of rule email, rule, notification and webhook plans,
**Sync History linked when written**, **online History writer recovery**, and
**manual and scheduled Sync through the durable journal** with replay after a
restart. Image covers and attachment previews show the picture
again, and showing **dependencies** is each user's own choice, with private **My
Dependencies**.
Irish gains the rule email recovery and legacy review translations.

This release fixes the following CRITICAL SECURITY ISSUE of [ReplyBleed](https://wekan.fi/hall-of-fame/replybleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3151f8a81">Attribute email replies to the recipient the reply address was sent to</a>. Thanks to alex131125 and xet7.</summary>

Reported privately in
[GHSA-mc7c-cv99-64h7](https://github.com/wekan/wekan/security/advisories/GHSA-mc7c-cv99-64h7)
(CWE-346, CVSS 4.3). The reply-by-email token signed only the card, so every
recipient of a card's notification held the same Reply-To address, and the
webhook took the comment author from the reply's From address - a field the
sender controls. Anyone holding one card's reply address could comment on it
as any user.

Validation also found that `server/routes/inboundEmail.js` was never imported
by `server/imports.js`, so released versions did not register
`/api/inbound-email`: the documented feature did not work and the flaw could
not be reached. The endpoint is registered now, together with the fix.

- The reply address is `reply+<cardId>.<userId>.<expiry>.<mac>`, an
  HMAC-SHA256 over the card, the recipient and the last valid day
  (`INBOUND_EMAIL_REPLY_DAYS`, default 30).
- The author is that recipient. The From address must be one of the
  recipient's own addresses, and the recipient must be enabled and still allowed
  to comment on the card, including the assigned-only restriction.
- `INBOUND_EMAIL_WEBHOOK_SECRET`, when set, must be presented by the provider
  as the `X-WeKan-Inbound-Secret` header or `?secret=`. It is compared in
  constant time.
- The old card-only token is refused.
- A forged token, a spoofed sender and a wrong provider secret appear as
  ReplyBleed in Admin Panel → Problems. Expired and pre-fix tokens and lost
  access are refused without a record, because real users replying to old mail
  reach them.

Unit tests cover the token and reproduce the advisory's attack as data. A
tree-wide negative test fails if any code picks an author from a From address.
A full-app test posts over HTTP to the endpoint. Multipart provider payloads
are still not parsed; JSON and URL-encoded ones are.

</details>

and adds the following new features:

**Incarnations** - a Scrum record or activity deleted and recreated under the
same id is no longer mistaken for the original.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/20275418d">Give every Scrum record a lifetime incarnation and refuse retries against another lifetime</a>. Thanks to xet7.</summary>

Scrum History treated "the record has the expected values and revision" as
proof of which record it was. A record deleted and recreated under the same
`_id`, for example restored by someone else, passed that test, so a retried
undo could delete a record from another lifetime. Every Scrum sprint, release
and event now carries a random incarnation, set where it is created. The
History checkpoint records the incarnation each target has. For a record it
creates, the checkpoint chooses the incarnation before writing, so a replay
recognizes its own insert. History content never carries an incarnation, and
older checkpoints keep their completion identity. Unit tests cover every state
with and without incarnations. A full-app test replaces a sprint with an
identical record of another lifetime mid-undo: the retry refuses and leaves it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2e583080">Give every activity a lifetime incarnation that notification recovery checks</a>. Thanks to xet7.</summary>

The server insert hook gives every activity a new random incarnation, whatever
the caller passed, before its notification intent captures it. Recovery
already compares the stored activity with the captured one, so an activity
recreated under the same id is refused as unconfirmed. Sync-planned
activities are exempt on purpose: their deterministic id is their identity,
and a replay must match the plan. A full-app test recreates an activity with
the same values and timestamps and recovery refuses it.

</details>

**Retention** - finished rule emails, rule plans, rule archives, notification
plans and webhook plans no longer keep their content forever.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e342170b">Compact finished rule email commands after 90 days</a>. Thanks to xet7.</summary>

A rule email command kept the whole mail, with body and attachments up to 12 MB,
and its outcome row kept recipient addresses forever. A command is compacted
once all of these hold:

- its attempt is sent or dropped;
- the attempt is older than `SYNC_RECEIPT_METADATA_DAYS` (default 90);
- its rule invocation has a receipt, after which no replay reads the mail.

Compaction replaces the command in place with its ids and checksum and removes
the outcome row. The attempt row stays as the receipt a late retry finds. The
recovery and legacy review readers accept the compact form. A MongoDB test
covers what is compacted, what is left for later, idempotence and a command
that no longer matches its attempt.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb591c448">Compact delivered Sync notification plans after 90 days</a>. Thanks to xet7.</summary>

A stored notification plan keeps every recipient's rendered subject and HTML,
and had no completion evidence of its own, so it was kept forever. Delivery
now writes a receipt with its completion time. After
`SYNC_RECEIPT_METADATA_DAYS` (90), a sweep replaces the exact plan with its
ids and checksum in place. A late replay returns as delivered without
resending; within 90 days a replay still re-checks every recipient. Scrum
completions and requests and Sync intents and completions hold only ids and
timestamps already, so there is nothing in them to compact. MongoDB and
full-app tests cover compaction, replay and refusal.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a7b74bd1">Compact delivered Sync webhook plans, with their URLs and tokens, after 90 days</a>. Thanks to xet7.</summary>

A stored webhook plan kept each target's URL, its X-Wekan-Token credential and
the request body forever, beside the receiver's reply and any comment plan.
Notification plan retention becomes a shared kit, and webhooks use it. A
completion receipt is written once every target is delivered. After 90 days
the reply and comment-plan rows are removed and the plan is compacted in
place, so the stored token is gone. A late replay returns as delivered. MongoDB
and full-app tests cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fbea673a1">Compact finished Sync rule plans after 90 days</a>. Thanks to xet7.</summary>

A stored rule plan kept the whole matched rule and action documents, including
a send-email action's recipients and text, forever. Its receipt had no time.
Rules now write a completion receipt once every action is done, and the plan is
compacted in place 90 days later. A replay of the compact form returns as done.
Every other stage refuses the stub, and the legacy email review treats its
commands as finished. MongoDB and full-app tests cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/023090a65">Compact finished rule archive commands and their effects after 90 days</a>. Thanks to xet7.</summary>

An archive command keeps up to 1000 cards' titles, and its effects row keeps
the History and activity content written for them. The archive runner now
writes a completion receipt with its time. 90 days later the effects row is
removed and the command compacted in place. A late replay returns the
invocation as done when the runner's final receipt confirms it. MongoDB and
full-app tests cover it.

</details>

**Sync History** - Sync and stored rule archives append History like ordinary
edits, so a board no longer has to hold still while a batch is written.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76f6eba24">Link Sync History rows to the chain when they are written, not planned</a>. Thanks to xet7.</summary>

Plans fixed each row's `previousHash` when planned. The board's History chain
then had to stay unchanged until the last row was written, which needed a
multi-row reservation that blocked edits, and a coordinated board refused Sync.
Plans are now content only, and each row is linked when appended:

- on a legacy board, after the chain's tip. Rows of one batch share a
  `createdAt`, so the tip is found by walking successors; picking the newest
  row alone forked the chain;
- on a coordinated board, through the chain head.

Appends are idempotent by row id. The archive runner needs no reservation.
Plans in the old chained format are refused. Unit, MongoDB and full-app tests
cover both modes, replay, and History written between planning and writing.

</details>

**History writers** - a server that died while writing History no longer needs
every server stopped before its board can be migrated.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e191baef7">Recover abandoned History writers online, fenced, without stopping servers</a>. Thanks to xet7.</summary>

A legacy History writer holds a token on its board's gate until its write is
confirmed. A writer that died kept that token forever, and removing it needed
every server stopped. Each writer now keeps a renewed lease beside its token,
and claims each row id in it before inserting. Once a lease has been expired
for another full period (`HISTORY_WRITER_LEASE_MS`, default 30 s), recovery:

- fences the lease, so the writer can neither renew nor claim again;
- puts a tombstone under any claimed row id, so a late insert fails on the
  unique `_id`, while a row that had already landed stays;
- only then removes the token.

Safety rests on the fence, not the clock. A chain migration does this while
the board drains, and `releases/recover-history-writer.cjs --recover-expired`
does it on demand. Tokens from older servers have no lease and still need the
offline procedure. MongoDB tests with two clients and a full-app test cover a
dead writer, a fenced slow writer, a landed row, live writers and migration.

</details>

**List Sync** - a restart in the middle of a Sync run no longer loses its
History, activities, rules, notifications or webhooks.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6ed28c41f">Run manual and scheduled Sync through the durable journal, with replay</a>. Thanks to xet7.</summary>

The write-ahead journal and its stored stages were built but never called;
Sync wrote cards directly. A run now takes the durable path when:

- the board enabled Sync effects (and cron effects for a scheduled run);
- the list has a versioned scope;
- every rule action on the board has a durable adapter: sending email and,
  since the guard change below, archive and unarchive.

Otherwise it uses the direct writes as before, so no rule stops running.
Steps are built from the stored cards, and a local edit since the fetch stops
the run. Each step is applied, with its planned effects, as the actor and
trigger that started it. The `wekan-list-sync-replay` job resumes interrupted
runs every minute. A full-app test creates, updates and archives, crashes at a
card write and replays without duplicates.

</details>

- [Record why rule archive is not a durable Sync action yet](https://github.com/wekan/wekan/commit/1e40e7e06):
  measured at 36 s per archived card, because nested delivery re-runs every
  outer guard. Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f06ecdee0">Share guard results within one check, and make rule archive a durable Sync action</a>. Thanks to xet7.</summary>

Every stored stage checks before and after by calling the guard below it
twice, so one innermost check re-ran every outer guard 2^depth times. Each guard
now runs at most once per evaluation. A call from ordinary work, between stages
or after a write, still checks everything afresh, so a policy change or lost
lease between stages still stops the next one. A first attempt with a 100 ms
reuse window missed exactly that and was dropped. Archive and unarchive are now
durable rule adapters. The durable Sync test runs an "archive every created
card" rule end to end in about a second.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ff86170f3">Make colour, label and completion rule actions durable in Sync</a>. Thanks to xet7.</summary>

setColor, addLabel, removeLabel, removeAllLabels and marking a card complete or
incomplete now take durable Sync. Each rule invocation saves one command with
the card field's value before and after, following the ordinary action's
semantics. It also saves the effects the ordinary hooks would write: a History
row and, for single labels, the label activity only when the label changed.
The runner applies the change conditionally with ordinary History deferred,
then writes the planned rows and delivers the activities durably.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ad4ccd5c3">Make the date rule actions durable in Sync</a>. Thanks to xet7.</summary>

setDate, updateDate, setDateRelative and removeDate follow the ordinary
actions, with "now" fixed when the command is captured. A full-app probe of the
ordinary writes fixed exactly what they record: a dates History row and the
timing hook's a-field activity, with no new value when a date is removed. The
timing hook can now be deferred, so the saved activity is written instead of
the hook's own, never both.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0395989d0">Make the member rule actions durable in Sync</a>. Thanks to xet7.</summary>

addMember and removeMember resolve their people at capture exactly as the
ordinary action does - the acting user, username tokens, and the card's
assignees for "remove every member" - and save them. A replay therefore acts
on the same people. Each person who really joined or left gets the ordinary
joinMember or unjoinMember activity, and the change gets one History row.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af1b1bee2">Make the checklist rule actions durable in Sync</a>. Thanks to xet7.</summary>

checkAll, uncheckAll, checkItem and uncheckItem are captured with the ordinary
action's own lookups, so a replay acts on the same items, including its no-ops.
The ordinary hooks record on every item write, changed or not: an
uncompleteChecklist before, a checked or unchecked activity after, a
completeChecklist when the list is finished, and History when the value
changed. The command simulates that sequence, and the runner applies it item by
item, so rules triggered by one item run before the next, as they do now. The
History planner accepts checklist-item rows for this.

</details>

and fixes the following bugs:

**Dependencies** - showing dependency lines is each user's own choice, and
every user can keep private dependencies of their own.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cff80a9d7b">Make showing dependencies each user's own choice, and add My Dependencies</a>. Thanks to nalilord and xet7.</summary>

[#6732](https://github.com/wekan/wekan/issues/6732): the board-header button
wrote one shared board field, so one user's choice changed everyone's view,
and only board admins could write it. The button moved to the top of Member
Settings as Show My Dependencies and Show Board Dependencies, with Import and
Export below them. Both switches are off by default and saved per user. Board
Dependencies stay on the cards. They can be edited by roles that can edit or
move cards, including Workers, and by assigned-only members on their own cards.
My Dependencies live in the user's profile, are drawn dashed and are seen only
by their owner. Every import combines, adding only lines that are not there
yet. The design is in
[Board and My Dependencies](docs/Features/Editor/RedStrings/Board-And-My-Dependencies.md).
Unit, full-app and Playwright tests cover it, run in Chromium and WebKit.

</details>

- [Say how many dependency lines were already there after an All Boards import](https://github.com/wekan/wekan/commit/8a6aeba7d1).
  Thanks to nalilord and xet7.

**Card images** - image covers and attachment previews show the picture again,
on the board and in the open card, instead of a flat band or a blue button.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e4ae7c2829">Show image previews on cards again: a real cover picture, and a neutral attachment tile</a>. Thanks to xet7.</summary>

Reported by email against v12.12. The board cover was empty because the
minicard's cover helper returned a wrapper without the attachment's id, so the
preview URL was blank. It now returns the attachment. The open card's
thumbnail is a button, and the global button style filled it with the theme
colour. Every state of it is now reset to a neutral 144x96 frame that shows
the whole picture. Covers are thumbnail images, cover-fitted on the board and
in the open card. A thumbnail that fails falls back to the original once. The
table page's attachment preview gets the same neutral frame. Unit tests and a
Playwright spec, run in Chromium and WebKit, cover it.

</details>

and has the following developer-tooling fixes:

**Full-app tests** - recovery and retention tests no longer fail by chance in a
full run.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c2aeaff8">Make the paused-scan recovery test read a full pass, not one page</a>. Thanks to xet7.</summary>

The recovery scanner reads 100 pending intents per call and keeps its place,
so with other suites' intents pending one call could miss this test's intent.
The test now pages to the end with its own scanner.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b93e725b">Retry busy operator actions in the activity recovery test</a>. Thanks to xet7.</summary>

The startup scan holds an intent's lease every second, so a pause or cancel
could meet sync-busy, which an operator retries. The test now does too.

</details>

- [Page retention sweeps in the full-app tests until their own record is compacted](https://github.com/wekan/wekan/commit/5b3669b00):
  the test database outlives a run, so older receipts filled the first page.
  Thanks to xet7.

and updates the following translations:

**Languages updated:** Irish, Acehnese, Akan, Albanian, Amharic, Aragonese, Armenian, Aromanian, Assamese, Asturian, Aymara, Azerbaijani, Bambara, Bashkir, Basque, Bhojpuri, Bislama, Breton, Buriat, Burmese, Cantonese, Central Kurdish, Cherokee, Chuvash, Cornish, Corsican, Dzongkha, Esperanto, Ewe, Faroese, Fijian, Flemish, Friulian, Fula, Ganda, Georgian, Guarani, Haitian Creole, Hausa, Hawaiian, Igbo, Inuktitut, Javanese, Kalaallisut, Kashmiri, Kashubian, Kazakh, Khmer, Kinyarwanda, Klingon, Konkani, Kurdish, Kyrgyz, Ladin, Latin, Luxembourgish, Maithili, Malagasy, Malayalam, Maltese, Manx, Marathi, Mongolian, Moroccan Arabic, Māori, Nahuatl, Neapolitan, North Ndebele, Northern Sami, Northern Sotho, Nyanja, Occitan, Odia, Oromo, Papiamento, Pashto, Punjabi, Quechua, Romansh, Rundi, Samoan, Sardinian, Scottish Gaelic, Shona, Sicilian, Silesian, Sindhi, Sinhala, Somali, Southern Sotho, Standard Moroccan Tamazight, Swahili, Swati, Tagalog, Tajik, Tatar, Telugu, Tibetan, Tigre, Tigrinya, Tok Pisin, Tongan, Tsonga, Tswana, Turkmen, Upper Sorbian, Uyghur, Uzbek, Venda, Volapük, Walloon, Welsh, Western Frisian, Wolaytta, Wolof, Wu Chinese, Xhosa, Yakut, Yiddish, Yoruba, Zulu.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f9fc419c">Translate Irish rule email recovery and review messages</a>. Thanks to xet7.</summary>

- Fill 45 Irish recovery, review, variable and todo.txt import messages.
- Translation, registry and human-preference checks pass, including duplicate
  delivery warnings, permanent discard warnings and preserved syntax tokens.
  Existing translations are preserved. Browser and fluent-speaker review were
  not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/664cca9f778ea031a892075acf622aa9e2a6e8b5">Translate Marathi archive settings and date filters</a>. Thanks to xet7.</summary>

- Translate 25 Marathi archive, date filter and Leo import messages.
- Check date query syntax, inclusive ranges and archival exceptions while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e98e42ba64758722a73efb9207087f6a4aa639b9">Translate Marathi notifications and rule settings</a>. Thanks to xet7.</summary>

- Translate 35 Marathi board visibility, rule and notification messages.
- Check reminder timing, variable tokens and visibility restrictions while
  preserving existing translations and URL schemes.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/78e6f5a22d6ccc668a1e07fa19ca535012c2456f">Translate Marathi saved filters and map controls</a>. Thanks to xet7.</summary>

- Translate 34 Marathi filter, map, import and block movement messages.
- Check URL variables, saved filter replacement and movement directions while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/637ad0d3aff86841ef58d75d404dd0b42bf3903d">Translate Marathi block editor accessibility labels</a>. Thanks to xet7.</summary>

- Translate 38 Marathi block editor and accessibility messages.
- Check angle units, add and remove actions, and singular and plural inputs
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/87e51bb811bdbf6be5668eaa21f2b3890eff3066">Translate Marathi colors and block control flow</a>. Thanks to xet7.</summary>

- Translate 35 Marathi color, variable warning and loop control messages.
- Check numeric ranges, deletion restrictions and loop control distinctions
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb92f61ecf5206e23318f579931ff7fc7cee95b0">Translate Marathi editor actions and conditionals</a>. Thanks to xet7.</summary>

- Translate 33 Marathi conditional, repeat and editor action messages.
- Check true and false conditions, activation and deletion confirmations
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/039fc85196012260edd7642ef5eb896419b5f212">Translate Marathi input labels and editor buttons</a>. Thanks to xet7.</summary>

- Translate 35 Marathi input, bitmap and editor button messages.
- Check row and column order, open and close actions, and list positions
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d53dea6478e69e5fb9b30c54ff4f7e5c074870fb">Translate Marathi numeric and text input labels</a>. Thanks to xet7.</summary>

- Translate 35 Marathi number, text and loop input labels.
- Check division terms, limits, coordinates and loop boundaries while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06d8892d0ce69f9681202b9c5820405a8462ee21">Translate Marathi keyboard navigation and list operations</a>. Thanks to xet7.</summary>

- Translate 30 Marathi keyboard navigation and list operation messages.
- Check modifier keys, empty list length and retrieval versus removal while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/28905d1c466503c9e0589ff65ea7657e97d26b5b">Translate Marathi list editing and indexing</a>. Thanks to xet7.</summary>

- Translate 30 Marathi list editing, indexing and copying messages.
- Check missing item results, copy semantics and insertion versus assignment
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/279c35bb1408f7c3dbe48170d5f61f7262b98bd0">Translate Marathi sorting and logic messages</a>. Thanks to xet7.</summary>

- Translate 32 Marathi sorting, text splitting and Boolean logic messages.
- Check sort direction, inclusive comparisons and negation while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b3d66c76564d36b904354662b981b229f1222f0a">Translate Marathi logic and arithmetic messages</a>. Thanks to xet7.</summary>

- Translate 31 Marathi logic, arithmetic and numeric constraint messages.
- Check Boolean conditions, constants, inclusive limits and number signs
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b0e49bd6b45755c0a6c7b27b737d786eab8af39">Translate Marathi statistics and random number messages</a>. Thanks to xet7.</summary>

- Translate 31 Marathi statistics, number property and random value messages.
- Check mean, median and mode terminology and random value boundaries while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/083a6725daec4bce79722c9a422ac44f955fae35">Translate Marathi mathematical function messages</a>. Thanks to xet7.</summary>

- Translate 32 Marathi rounding, logarithm and trigonometric messages.
- Check rounding direction, sign reversal and angle units while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0fe38991edd99785b663194f1773a91d6c5a516e">Translate Marathi variables and procedure messages</a>. Thanks to xet7.</summary>

- Translate 30 Marathi variable, editor and procedure messages.
- Check disabled functions, return values and duplicate parameter warnings
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46746a6bc67b494434438d7fe4f6400f680e1457">Translate Marathi editor shortcuts and navigation</a>. Thanks to xet7.</summary>

- Translate 33 Marathi editor shortcuts, navigation and accessibility messages.
- Check screen reader toggles, navigation directions and move cancellation
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a800a3fe80cecfc9b6323d490332a4829e0a3636">Translate Marathi movement and text operations</a>. Thanks to xet7.</summary>

- Translate 33 Marathi movement, scrolling and text operation messages.
- Check directions, text positions, copying and reordered placeholders while
  preserving existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e99eb2e615499d10615a30e477d3a45b170b0e2e">Translate Marathi text search and replacement messages</a>. Thanks to xet7.</summary>

- Translate 31 Marathi text search, slicing, prompts and replacement messages.
- Check search failure results, spaces and replacing every occurrence while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1783c4013b33ca736d522c26079799d0e3b515d7">Translate Marathi workspace and variable messages</a>. Thanks to xet7.</summary>

- Translate 30 Marathi whitespace, variable and workspace messages.
- Check trimming directions, name conflicts and joined message spacing while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a4cd76fb679a688b16c09b774e681496f5a0778">Translate Marathi workspace search and rule editing</a>. Thanks to xet7.</summary>

- Translate 30 Marathi workspace search and rule editing messages.
- Check keyboard shortcuts, discard warnings and rule editing restrictions
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd8afbd9fcffce4a12485203880d339b8c574538">Translate Marathi Scrum planning messages</a>. Thanks to xet7.</summary>

- Translate 30 Marathi Scrum planning, role and sprint messages.
- Check sprint actions, unfinished work and completion policies while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/afb16089fc84392c8d48c7c78879b135741029e9">Translate Marathi sprint events and estimates</a>. Thanks to xet7.</summary>

- Translate 32 Marathi sprint event, state and estimate messages.
- Check unknown estimates, scope changes and comparison requirements while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/920b45b9fd41562db7dea71b4aeb7bc3b5d6d948">Translate Marathi reports and sync conflict messages</a>. Thanks to xet7.</summary>

- Translate 30 Marathi report and sync conflict messages; update the README
  count to 147 languages above the 90 percent translation threshold.
- Check report limitations, sprint cancellation and sync direction while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/659de3bb569d091a622fbfcf8b80cc51a4222859">Translate Marathi sync previews and recovery choices</a>. Thanks to xet7.</summary>

- Translate 30 Marathi sync preview, mapping and recovery messages.
- Check content retention, unchanged subcards and replacement reuse while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/83ccccb68ff1e90164f5836c018982ff43ee4758">Translate Marathi sync diagnostics and email queue messages</a>. Thanks to xet7.</summary>

- Translate 30 Marathi sync diagnostics and email queue messages.
- Check retention periods, null values and delivery retry warnings while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec67ae42209a610510f96c2fc8d4c6fe29767cb7">Translate Marathi email delivery recovery controls</a>. Thanks to xet7.</summary>

- Translate 20 Marathi delivery recovery controls and SMTP failure messages.
- Check permanent deletion warnings and temporary versus permanent failures
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/835a7bb1d8ddf0b37f314cc560d31a21fdd075d1">Translate Marathi activity recovery and time estimates</a>. Thanks to xet7.</summary>

- Translate 30 Marathi activity recovery, delivery failure and time messages.
- Check retained work, access restrictions and retry behavior while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2451dd05ff8d6ce517bc6393ba253c209a840e1d">Finish Marathi prose placeholder translations</a>. Thanks to xet7.</summary>

- Translate the final 23 Marathi recovery and history prose placeholders.
- Preserve literal keyboard, platform and mathematical identifiers; check
  all Marathi placeholders and key order against English.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2df1c8fb436c006396160e46c8603b05226f5623">Translate Sinhala archive settings and date filters</a>. Thanks to xet7.</summary>

- Translate 25 Sinhala archive, date filter and Leo import messages.
- Check query syntax, inclusive dates and archival exceptions while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c693de00dbd9ba8edc4ed5a4b588f84f33fe4bef">Translate Sinhala board access and notification messages</a>. Thanks to xet7.</summary>

- Translate 30 Sinhala board access, rule and notification messages.
- Check editing restrictions, URL schemes and reminder timing while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fff206973453ef0d26449e29a5620da124da3750">Translate Sinhala saved filters and map controls</a>. Thanks to xet7.</summary>

- Translate 29 Sinhala reminder, filter, map and import messages.
- Check reminder limits, URL variables and saved filter replacement while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e68e4e326211ce7cde2e99afea6bb575f45eeac">Translate Sinhala block movement and accessibility labels</a>. Thanks to xet7.</summary>

- Translate 31 Sinhala block movement and accessibility messages.
- Check movement directions, angle units and add versus remove actions while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8f5bacbffb0b0ea1b2136bf432b049ff763158f">Translate Sinhala block labels and editor warnings</a>. Thanks to xet7.</summary>

- Translate 30 Sinhala block labels, editor warnings and color inputs.
- Check deletion restrictions, warnings and singular versus plural inputs
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/10a045c0f06a6f839cee4b6c3c0c40dce8b66b51">Translate Sinhala colors and control flow messages</a>. Thanks to xet7.</summary>

- Translate 31 Sinhala color, loop and conditional messages.
- Check numeric ranges, loop controls and conditional branches while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a340eb71a6fb4274385d5815ce172fb4a986e1b9">Translate Sinhala editor actions and bitmap labels</a>. Thanks to xet7.</summary>

- Translate 30 Sinhala editor actions, bitmap controls and input labels.
- Check deletion confirmations, activation and row versus column labels
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22b4bfe9053ed2fa520f8d974537a6d5590cde88">Translate Sinhala input labels and editor controls</a>. Thanks to xet7.</summary>

- Translate 30 Sinhala input labels, editor controls and list positions.
- Check open and close actions, condition order and start versus end positions
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0737c9a3a4278eec723e5b8c03636c7258e761c">Translate Sinhala numeric and text input labels</a>. Thanks to xet7.</summary>

- Translate 29 Sinhala numeric, text and value input labels.
- Check division terms, numeric limits, coordinates and text positions while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7638c2d48cf44f2f589d1e91e89fb0b874a37153">Translate Sinhala keyboard navigation and list operations</a>. Thanks to xet7.</summary>

- Translate 30 Sinhala keyboard navigation and list operation messages.
- Check modifier keys, empty list length and retrieval versus removal while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e68252b1da21f8b53f0c07a658085d39a2acf88">Translate Sinhala list editing and indexing</a>. Thanks to xet7.</summary>

- Translate 30 Sinhala list editing, indexing and copying messages.
- Check missing item results, copy semantics and insertion versus assignment
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/213195e5b9bbf8f126bbbdfe93313c2a3d24b4eb">Translate Sinhala sorting and logic messages</a>. Thanks to xet7.</summary>

- Translate 32 Sinhala sorting, text splitting and Boolean logic messages.
- Check sort direction, inclusive comparisons and negation while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a72ef420cd14a02ae4be9910a6f327437c8d3de">Translate Sinhala logic and arithmetic messages</a>. Thanks to xet7.</summary>

- Translate 31 Sinhala logic, arithmetic and numeric constraint messages.
- Check Boolean conditions, constants, inclusive limits and number properties
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac10aaf30a8dcac3a55127267b1a372a82ede89a">Translate Sinhala statistics and random number messages</a>. Thanks to xet7.</summary>

- Translate 31 Sinhala statistics, number property and random value messages.
- Check mean, median and mode terminology and random value boundaries while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d76f2197a5ca462b07e23a61facece176531cb03">Translate Sinhala mathematical function messages</a>. Thanks to xet7.</summary>

- Translate 32 Sinhala rounding, logarithm and trigonometric messages.
- Check rounding direction, sign reversal and angle units while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d182fcd7b53acb4f8a9c361fea93f1b8938457dd">Translate Sinhala procedure and variable messages</a>. Thanks to xet7.</summary>

- Translate 30 Sinhala variable, procedure and block navigation messages.
- Check disabled functions, duplicate parameters and return-value distinctions,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab1f21b8babb97d3989076a55dac3cf39a2c18c8">Translate Sinhala navigation and accessibility messages</a>. Thanks to xet7.</summary>

- Translate 31 Sinhala navigation, screen-reader and function-input messages.
- Check opposite screen-reader controls, rename scope and navigation
  distinctions, while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3151a7dddc1fc63b077c3a7c1a5519ee1b6cca2">Translate Sinhala text operations and keyboard shortcuts</a>. Thanks to xet7.</summary>

- Translate 38 Sinhala keyboard navigation and text-operation messages.
- Check scrolling versus movement, case conversion and text positions,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba526a59a880efe504297b54678b216f3ab206ba">Translate Sinhala text search and transformation messages</a>. Thanks to xet7.</summary>

- Translate 35 Sinhala substring, search, replacement and trimming messages.
- Check missing matches, spaces in length, replacement scope and trim direction,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9325c73788da3908e32352d70dbf8f7d36836b9">Translate Sinhala workspace and variable messages</a>. Thanks to xet7.</summary>

- Translate 32 Sinhala variable, workspace contents and search messages.
- Check variable conflict types, keyboard shortcuts and comment fragments,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/97ecdb65d17a033ce351ce369ce0fe52eba5dd64">Translate Sinhala rule editing and planning messages</a>. Thanks to xet7.</summary>

- Translate 30 Sinhala rule-editing, planning and remaining block labels.
- Check rule conflicts, administrator permissions and unsaved-change warnings,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3553d703939e6e9d78c635eeb2393f3616ee6f37">Translate Sinhala sprint planning messages</a>. Thanks to xet7.</summary>

- Translate 32 Sinhala sprint, backlog and completion-policy messages.
- Check unfinished work, completion rules and planning terminology,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe310a51203db9ebe8c22664e9c4a41a13b5d661">Translate Sinhala sprint reports and lifecycle messages</a>. Thanks to xet7.</summary>

- Translate 32 Sinhala sprint reporting, state and confirmation messages.
- Check unknown estimates, partial reports and cancellation behavior,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec788e2d89e2eaad900312d7e4d0dfce5540f401">Translate Sinhala daily observations and sync review messages</a>. Thanks to xet7.</summary>

- Translate 30 Sinhala daily-observation and sync-conflict messages.
- Check observation limits, source isolation and unchanged subcards,
  while preserving placeholders and existing translations.
- Update the README count to 148 languages above 90 percent translated.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/866664df275ecd37511ce589de9c5c36e65847f6">Translate Sinhala sync preview and report messages</a>. Thanks to xet7.</summary>

- Translate 30 Sinhala sync-preview, omitted-field and run-report messages.
- Check retention limits, access requirements and report-only behavior,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3120268e519b5bd56f8d8bf94d5314f644860797">Translate Sinhala sync diagnostics and email queue messages</a>. Thanks to xet7.</summary>

- Translate 30 Sinhala sync-diagnostic and email-queue messages.
- Check cancellation warnings, retry behavior and existing pauses,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b845e847104ff536dc57825752e2c2a9da0a3a3">Translate Sinhala delivery failures and activity recovery messages</a>. Thanks to xet7.</summary>

- Translate 30 Sinhala delivery-failure and activity-recovery messages.
- Check temporary versus permanent failures and retained pending work,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5238da659c1b67c7069be17aff9bf3e5f2937d25">Complete Sinhala prose translations for recovery and history</a>. Thanks to xet7.</summary>

- Translate the final 27 Sinhala recovery, login and history messages.
- Retain 28 keyboard, platform and code literals; no prose placeholders remain.
- Check cancellation limits, server acceptance and repeated history requests,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85872f5c3d3360a9af98f4f507ad247cfdbc5cea">Translate Kazakh date filters and archive settings</a>. Thanks to xet7.</summary>

- Translate 25 Kazakh date-filter, archive and import messages.
- Check query syntax, inclusive dates and archive exceptions,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3301be03f3ca32b8b13921f79ef07437a673c97">Translate Kazakh rules and notification settings</a>. Thanks to xet7.</summary>

- Translate 25 Kazakh board-visibility, rule and notification messages.
- Check access restrictions, variable tokens and notification exceptions,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a802dd5941002e931c60110911f82542f42436d0">Translate Kazakh reminders, filters and map settings</a>. Thanks to xet7.</summary>

- Translate 30 Kazakh reminder, saved-filter, import and map messages.
- Check reminder timing, template variables and permission guidance,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3bb5687afb65dadb3acc8c09a0509536f205f9e">Translate Kazakh map and block editor messages</a>. Thanks to xet7.</summary>

- Translate 29 Kazakh map-placement and block-editor messages.
- Check movement directions, add/remove controls and angle units,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a3cf34c81cd924f9ae7a757b406acc6a9862bc30">Translate Kazakh block labels and accessibility fields</a>. Thanks to xet7.</summary>

- Translate 29 Kazakh block labels and accessibility-field messages.
- Check singular/plural inputs and variable-deletion restrictions,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2c6c3d5d1be133809646c6d86d44ef90a2ac617">Translate Kazakh colour and loop controls</a>. Thanks to xet7.</summary>

- Translate 30 Kazakh colour, loop and conditional-block messages.
- Check numeric ranges, loop restrictions and reordered placeholders,
  while preserving existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb9675d3be8988764d147c81e074f2654514daeb">Translate Kazakh conditional and editing messages</a>. Thanks to xet7.</summary>

- Translate 28 Kazakh conditional, loop and editing messages.
- Check true/false conditions, fallback branches and deletion placeholders,
  while preserving existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9a2414e0a0755807e0aed1a7f73b98b6b8cc7f8">Translate Kazakh editor inputs and field labels</a>. Thanks to xet7.</summary>

- Translate 30 Kazakh input, field and editor messages.
- Check pixel coordinates, open/close controls and condition ordering,
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a382f72a2868a948393ac77b604804da050fe3af">Translate dependency layers in ten languages and their locale variants</a>. Thanks to xet7.</summary>

- Translate 11 dependency-layer messages for 33 locale tags: Finnish, Swedish,
  German, French, Spanish, Italian, Portuguese, Dutch, Russian and Ukrainian,
  including their locale variants.
- Check key order, count placeholders and distinct layer and transfer labels.
  Focused translation and human-preference checks pass.
- Other locales still need the new strings; full completeness is not claimed.
  Browser and native-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2484e236e1e5a36e209035d1c2ac649f970a4bf6">Translate dependency layers in fourteen more locales</a>. Thanks to xet7.</summary>

- Translate 11 dependency messages into Polish, Czech, Slovak, Bulgarian,
  Greek, Romanian, Hungarian, Danish, Norwegian and Estonian plus variants.
- Update earlier translations for the renamed import/export title keys.
  Coverage now includes 47 locale tags; other locales remain pending.
- Focused key-order, placeholder and human-preference checks pass.
  Browser and native-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8007b62fa58460b7ea434da802155ae088af92b">Translate dependency layers in nineteen more locales</a>. Thanks to xet7.</summary>

- Translate 11 dependency messages into Turkish, Indonesian, Malay, Vietnamese,
  Japanese, Korean and Chinese, including locale and script variants.
- Coverage now includes 66 locale tags; other locales remain pending.
- Focused key-order, placeholder and human-preference checks pass.
  Browser and native-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a3592a4918cf4f9a89c884c000a3fd90c26632fe">Translate dependency layers in twelve more locales</a>. Thanks to xet7.</summary>

- Translate 11 dependency messages into Arabic, Hebrew, Persian, Hindi,
  Bengali, Urdu and Thai, including locale variants.
- Coverage now includes 78 locale tags; other locales remain pending.
- Focused key-order, placeholder and human-preference checks pass.
  Browser and native-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d72f98d019cd6e070c3f6b89a5dd26005e5236c">Translate dependency layers in nine more locales</a>. Thanks to xet7.</summary>

- Translate 11 dependency messages into Slovenian, Croatian, Serbian, Bosnian,
  Macedonian, Lithuanian, Latvian and Belarusian, including Slovenian variants.
- Coverage now includes 87 locale tags; other locales remain pending.
- Focused key-order, placeholder and human-preference checks pass.
  Browser and native-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/def0a35d6ce31c81c9a4d875f649f559d6530c57">Translate dependency layers in eight more locales</a>. Thanks to xet7.</summary>

- Translate 11 dependency messages into Catalan, Galician, Basque and Afrikaans,
  including locale variants and Valencian wording.
- Coverage now includes 95 locale tags; other locales remain pending.
- Focused key-order, placeholder and human-preference checks pass.
  Browser and native-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d4f941073e15f1b186676d114ed6dcd71d46d28">Translate dependency layers in six more locales</a>. Thanks to xet7.</summary>

- Translate 11 dependency messages into Kazakh, Azerbaijani, Armenian and
  Georgian, including Azerbaijani locale variants.
- Coverage now includes 101 locale tags; other locales remain pending.
- Focused key-order, placeholder and human-preference checks pass.
  Browser and native-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a3e2f93ce306fde192a8cd4e524543ca4942c04d">Translate dependency layers in four more languages</a>. Thanks to xet7.</summary>

- Translate 11 dependency messages into Marathi, Nepali, Punjabi and Sinhala.
- Coverage now includes 105 locale tags; other locales remain pending.
- Focused key-order, placeholder and human-preference checks pass.
  Browser and native-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b338f99e3795eea49bfbe726f985b471ce6b553a">Translate dependency layers in four more languages</a>. Thanks to xet7.</summary>

- Translate 11 dependency messages into Tamil, Telugu, Kannada and Malayalam.
- Coverage now includes 109 locale tags; other locales remain pending.
- Focused key-order, placeholder and human-preference checks pass.
  Browser and native-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/853ffb5cafa33a61d5f8677a810ed6228ec4ee5a">Translate dependency layers in four more languages</a>. Thanks to xet7.</summary>

- Translate 11 dependency messages into Gujarati, Albanian, Swahili and Tagalog.
- Coverage now includes 113 locale tags; other locales remain pending.
- Focused key-order, placeholder and human-preference checks pass.
  Browser and native-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5a30c4b9362c2df3794f64df3c18ca7a34d2bc5">Translate dependency layers in four more languages</a>. Thanks to xet7.</summary>

- Translate 11 dependency messages into Esperanto, Icelandic, Luxembourgish
  and Maltese.
- Coverage now includes 117 locale tags; other locales remain pending.
- Focused key-order, placeholder and human-preference checks pass.
  Browser and native-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/475b687d06b422d63d1dbb0af46b27db3a51cab2">Translate dependency layers in six more locales</a>. Thanks to xet7.</summary>

- Translate 11 dependency messages into Mongolian, Kyrgyz, Tajik and Uzbek,
  including the Uzbek Latin-script locale variants.
- Coverage now includes 123 locale tags; other locales remain pending.
- Focused key-order, placeholder and human-preference checks pass.
  Browser and native-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9fd0d67fa28dd92c47498d71badaad1b94f0852">Translate dependency layers in four more languages</a>. Thanks to xet7.</summary>

- Translate 11 dependency messages into Haitian Creole, Latin, Corsican
  and Occitan.
- Coverage now includes 127 locale tags; other locales remain pending.
- Focused key-order, placeholder and human-preference checks pass.
  Browser and native-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b2e94e451d15d3f04fed4abbe1e18ebf5cb5ea1">Translate dependency layers in four more languages</a>. Thanks to xet7.</summary>

- Translate 11 dependency messages into Somali, Malagasy, Javanese
  and Papiamento.
- Coverage now includes 131 locale tags; other locales remain pending.
- Focused key-order, placeholder and human-preference checks pass.
  Somali, Malagasy and Papiamento wording has lower confidence.
  Browser and native-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/847460410">Translate Irish Sync conflicts and recovery reports</a>. Thanks to xet7.</summary>

- Fill 63 Irish Sync conflict, preview, report and recovery messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, placeholders, partial-change warnings and explicit-null
  handling.
  Browser layout and fluent-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cfbf1bf79">Translate Irish Scrum planning and reports</a>. Thanks to xet7.</summary>

- Fill 84 Irish Scrum messages and update the language completion count.
- Translation, registry and human-preference checks pass, including preserved
  translations, placeholders, partial-report warnings and unknown estimates.
  Browser layout and fluent-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/377c392e2">Translate Irish filters, reminders and automation controls</a>. Thanks to xet7.</summary>

- Fill 81 Irish filter, reminder, automation, map and import messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, syntax tokens, visibility restrictions and reminder offsets.
  Browser layout and fluent-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a888aa216">Complete Irish notification and recovery translations</a>. Thanks to xet7.</summary>

- Fill 77 Irish notification, recovery, history and sign-in messages.
- No flagged placeholders remain, including pending translation keys. Keep
  printed key legends, product names and mathematical symbols unchanged.
- Translation, registry and human-preference checks pass, including permanent
  cancellation warnings and preserved translations and placeholders.
  Browser layout and fluent-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a3f824d25">Translate Corsican rule email recovery and review messages</a>. Thanks to xet7.</summary>

- Fill 45 Corsican recovery, review, variable and todo.txt import messages.
- Translation, registry and human-preference checks pass, including duplicate
  delivery warnings, permanent discard warnings and preserved syntax tokens.
  Existing translations are preserved. Browser layout and fluent-speaker
  review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7001bda1a">Translate Corsican Sync conflicts and recovery reports</a>. Thanks to xet7.</summary>

- Fill 63 Corsican Sync messages and update the language completion count.
- Translation, registry and human-preference checks pass, including preserved
  translations, placeholders, partial-change warnings and explicit-null
  handling. Browser layout and fluent-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2afdfdeed">Translate Corsican Scrum planning and reports</a>. Thanks to xet7.</summary>

- Fill 84 Corsican Scrum planning, report and daily observation messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, placeholders, partial-report warnings and unknown estimates.
  Browser layout and fluent-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5562add65">Translate Corsican filters, reminders and automation controls</a>. Thanks to xet7.</summary>

- Fill 81 Corsican filter, reminder, automation, map and import messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, syntax tokens, visibility restrictions and reminder offsets.
  Browser layout and fluent-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2e6687c5">Complete Corsican notification and recovery translations</a>. Thanks to xet7.</summary>

- Fill 79 Corsican notification, recovery, history and keyboard strings.
- No flagged placeholders remain, including pending translation keys. Keep
  printed key legends, product names and mathematical symbols unchanged.
- Translation, registry and human-preference checks pass, including permanent
  cancellation warnings and preserved translations and placeholders.
  Browser layout and fluent-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e44fa0f99">Translate Sardinian rule email recovery and review messages</a>. Thanks to xet7.</summary>

- Fill 45 Sardinian recovery, review, variable and todo.txt import messages.
- Translation, registry and human-preference checks pass, including duplicate
  delivery warnings, permanent discard warnings and preserved syntax tokens.
  Existing translations are preserved. Wording is lower confidence; browser
  layout and fluent-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b15abae45">Translate Sardinian Sync conflicts and recovery reports</a>. Thanks to xet7.</summary>

- Fill 63 Sardinian Sync messages and update the language completion count.
- Translation, registry and human-preference checks pass, including preserved
  translations, placeholders, partial-change warnings and explicit-null
  handling. Wording is lower confidence; browser layout and fluent-speaker
  review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d13c9dc86">Translate Sardinian Scrum planning and reports</a>. Thanks to xet7.</summary>

- Fill 84 Sardinian Scrum planning, report and daily observation messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, placeholders, partial-report warnings and unknown estimates.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/142597737">Translate Sardinian filters, reminders and automation controls</a>. Thanks to xet7.</summary>

- Fill 81 Sardinian filter, reminder, automation, map and import messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, syntax tokens, visibility restrictions and reminder offsets.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/238223e9f">Complete Sardinian notification and recovery translations</a>. Thanks to xet7.</summary>

- Fill 79 Sardinian notification, recovery, history and keyboard strings.
- No flagged placeholders remain, including pending translation keys. Keep
  printed key legends, product names and mathematical symbols unchanged.
- Translation, registry and human-preference checks pass, including permanent
  cancellation warnings and preserved translations and placeholders.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5314cf856">Translate Sicilian rule email recovery and review messages</a>. Thanks to xet7.</summary>

- Fill 45 Sicilian recovery, review, variable and todo.txt import messages.
- Translation, registry and human-preference checks pass, including duplicate
  delivery warnings, permanent discard warnings and preserved syntax tokens.
  Existing translations are preserved. Wording is lower confidence; browser
  layout and fluent-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/40366363d">Translate Sicilian Sync conflicts and recovery reports</a>. Thanks to xet7.</summary>

- Fill 63 Sicilian Sync conflict, preview, report and recovery messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, placeholders, partial-change warnings and explicit-null
  handling. Wording is lower confidence; browser layout and fluent-speaker
  review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/127316635">Translate Sicilian Scrum planning and reports</a>. Thanks to xet7.</summary>

- Fill 84 Sicilian Scrum messages and update the language completion count.
- Translation, registry and human-preference checks pass, including preserved
  translations, placeholders, partial-report warnings and unknown estimates.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0cef9eb86">Translate Sicilian filters, reminders and automation controls</a>. Thanks to xet7.</summary>

- Fill 81 Sicilian filter, reminder, automation, map and import messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, syntax tokens, visibility restrictions and reminder offsets.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ecb4a9293">Complete Sicilian notification and recovery translations</a>. Thanks to xet7.</summary>

- Fill 79 Sicilian notification, recovery, history and keyboard strings.
- No flagged placeholders remain, including pending translation keys. Keep
  printed key legends, product names and mathematical symbols unchanged.
- Translation, registry and human-preference checks pass, including permanent
  cancellation warnings and preserved translations and placeholders.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88fdadda4">Translate Neapolitan rule email recovery and review messages</a>. Thanks to xet7.</summary>

- Fill 45 Neapolitan recovery, review, variable and todo.txt import messages.
- Translation, registry and human-preference checks pass, including duplicate
  delivery warnings, permanent discard warnings and preserved syntax tokens.
  Existing translations are preserved. Wording is lower confidence; browser
  layout and fluent-speaker review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d3a550a6">Translate Neapolitan Sync conflicts and recovery reports</a>. Thanks to xet7.</summary>

- Fill 63 Neapolitan Sync conflict, preview, report and recovery messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, placeholders, partial-change warnings and explicit-null
  handling. Wording is lower confidence; browser layout and fluent-speaker
  review were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8ecd5c29">Translate Neapolitan Scrum planning and reports</a>. Thanks to xet7.</summary>

- Fill 84 Neapolitan Scrum messages and update the language completion count.
- Translation, registry and human-preference checks pass, including preserved
  translations, placeholders, partial-report warnings and unknown estimates.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f37145308">Translate Neapolitan filters, reminders and automation controls</a>. Thanks to xet7.</summary>

- Fill 81 Neapolitan filter, reminder, automation, map and import messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, syntax tokens, visibility restrictions and reminder offsets.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a57750281">Complete Neapolitan notification and recovery translations</a>. Thanks to xet7.</summary>

- Translate the remaining 80 notification, recovery and keyboard messages.
  Neapolitan has no flagged English placeholders, including pending keys.
  Retain reviewed product names, key legends and mathematical symbols.
- Translation, registry and human-preference checks pass, with coverage for
  preserved translations, placeholders and irreversible recovery actions.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. Other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d0ec54bb3">Translate Aragonese rule email recovery and import messages</a>. Thanks to xet7.</summary>

- Fill 45 Aragonese recovery, variable insertion and todo.txt import messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, syntax tokens, duplicate delivery and lost-access warnings.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. Remaining placeholders and older mixed-language text need review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/348e2d85d">Translate Aragonese synchronization conflicts and reports</a>. Thanks to xet7.</summary>

- Fill 63 Aragonese synchronization, preview, report and recovery messages.
  Refresh the measured language completion count.
- Translation, registry and human-preference checks pass, covering preserved
  translations, report limitations, explicit null and estimate-field rules.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. Other placeholders and older mixed-language text remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd7c087d9">Translate Aragonese Scrum planning and reporting</a>. Thanks to xet7.</summary>

- Fill 80 Aragonese Scrum planning, iteration and report messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, placeholders, unknown estimates, partial reports and daily
  observation limitations. Wording is lower confidence; browser layout and
  fluent-speaker review were not run. Other translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a31350f7b">Translate Aragonese filters, reminders and automation controls</a>. Thanks to xet7.</summary>

- Fill 81 Aragonese filter, reminder, automation, map and import messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, syntax tokens, visibility restrictions and reminder offsets.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. Other translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4fbe4af35">Fill remaining Aragonese notification and recovery placeholders</a>. Thanks to xet7.</summary>

- Translate 82 Aragonese notification, recovery and navigation messages.
  No flagged English placeholders remain, including pending keys. Retain
  reviewed technical labels and shared vocabulary.
- Translation, registry and human-preference checks pass, covering tokens,
  preserved translations and irreversible recovery actions. Wording is lower
  confidence; browser layout and fluent-speaker review were not run.
  Older mixed-language values still require correction.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7ed5c2937">Correct mixed-language Aragonese email and import messages</a>. Thanks to xet7.</summary>

- Replace Spanish and mixed-language wording in 30 reviewed Aragonese email,
  template and import messages, preserving all other locale values.
- Translation, registry and human-preference checks pass. Regression coverage
  checks Aragonese wording, placeholders, API paths, JSON fields and Markdown
  syntax. Wording is lower confidence; browser layout and fluent-speaker
  review were not run. The broader language audit remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16d3704da">Correct mixed-language Aragonese interface messages</a>. Thanks to xet7.</summary>

- Correct 42 mixed-language navigation, account, import and settings messages.
  Preserve all other translations and placeholders.
- Translation, registry and human-preference checks pass. Regression coverage
  includes Aragonese wording, permission limits, irreversible deletion and
  retaining saved secrets. Wording is lower confidence; browser layout and
  fluent-speaker review were not run. The wider language audit continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/427fb2d2a">Correct mixed-language Aragonese activity messages</a>. Thanks to xet7.</summary>

- Correct 40 activity messages and restore the meaning of comment edits.
  Preserve placeholders and all other locale values.
- Translation, registry and human-preference checks pass, covering activity
  vocabulary, checklist completion and move sources and destinations.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. The wider language audit continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f61a0a2d3">Correct Aragonese selection and administration messages</a>. Thanks to xet7.</summary>

- Correct 35 mixed-language messages and clarify that a removed member
  receives a notification. Preserve all other translations and placeholders.
- Translation, registry and human-preference checks pass, including deletion,
  read-only role summaries, positioning and API configuration syntax.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. The wider language audit continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5263f205f">Correct Aragonese help text and filter examples</a>. Thanks to xet7.</summary>

- Correct 22 mixed-language help and automation messages. Restore equality
  and escaping in advanced-filter examples, preserving other translations.
- Translation, registry and human-preference checks pass, including native
  wording, list-width scope and executable filter examples.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. The wider language audit continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/08f0a9f01">Translate Asturian rule email recovery and import messages</a>. Thanks to xet7.</summary>

- Fill 45 Asturian recovery, variable insertion and todo.txt import messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, syntax tokens, duplicate delivery and lost-access warnings.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. Other translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6a71ae7c">Translate Asturian synchronization conflicts and reports</a>. Thanks to xet7.</summary>

- Fill 63 Asturian synchronization, preview, report and recovery messages.
- Translation, registry and human-preference checks pass, covering preserved
  translations, report limitations, explicit null and estimate-field rules.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. Other translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0804237f0">Translate Asturian Scrum planning and reporting</a>. Thanks to xet7.</summary>

- Fill 84 Asturian Scrum and navigation messages. Refresh the measured
  language completion count.
- Translation, registry and human-preference checks pass, including preserved
  translations, unknown estimates, partial reports and daily observations.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. Other translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2363be285">Translate Asturian filters, reminders and automation controls</a>. Thanks to xet7.</summary>

- Fill 81 Asturian filter, reminder, automation, map and import messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, syntax tokens, visibility restrictions and reminder offsets.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. Other translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f598b1db1">Fill remaining Asturian notification and recovery placeholders</a>. Thanks to xet7.</summary>

- Translate 78 Asturian notification, recovery and keyboard messages.
  No flagged English placeholders remain, including pending keys. Retain
  reviewed shared terms and technical labels.
- Translation, registry and human-preference checks pass, covering tokens,
  preserved translations and irreversible recovery actions. Wording is lower
  confidence; browser layout and fluent-speaker review were not run.
  Older mixed-language values still require review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ccd04782">Correct Asturian import text and core action labels</a>. Thanks to xet7.</summary>

- Correct 13 mixed-language import and email messages and core labels,
  including Save incorrectly labelled Add. Preserve other translations.
- Translation, registry and human-preference checks pass, covering native
  terminology, placeholders, import field names and API paths.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. The wider language audit continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2cb5a041">Correct Asturian board and card interface messages</a>. Thanks to xet7.</summary>

- Correct 26 mixed-language messages, including the single home-board limit
  and the warning that removing it from Home does not delete it.
- Translation, registry and human-preference checks pass, covering preserved
  translations, placeholders, native terminology and archive actions.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. The wider language audit continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45bc0ba7b">Correct Asturian action labels and timeline wording</a>. Thanks to xet7.</summary>

- Correct 29 mixed-language action messages and clarify that the timeline
  shows the state at a date. Preserve other translations and placeholders.
- Translation, registry and human-preference checks pass, covering native
  action wording, archive restoration and timeline meaning.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. The wider language audit continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5024486dc">Correct Asturian account and card guidance</a>. Thanks to xet7.</summary>

- Correct 30 mixed-language messages and point board restoration to Archive
  on All Boards. Preserve other translations and placeholders.
- Translation, registry and human-preference checks pass, covering role
  restrictions, linked-card deletion order and movement directions.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. The wider language audit continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f7ff8474d">Translate Occitan rule email recovery and import messages</a>. Thanks to xet7.</summary>

- Fill 45 Occitan recovery, variable insertion and todo.txt import messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, syntax tokens, duplicate delivery and lost-access warnings.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. Other translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb16f3739">Translate Occitan synchronization conflicts and reports</a>. Thanks to xet7.</summary>

- Fill 63 Occitan synchronization, preview, report and recovery messages.
- Translation, registry and human-preference checks pass, covering preserved
  translations, report limitations, explicit null and estimate-field rules.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. Other translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/245da61a9">Translate Occitan Scrum planning and reporting</a>. Thanks to xet7.</summary>

- Fill 84 Occitan Scrum and navigation messages. Refresh the measured
  language completion count.
- Translation, registry and human-preference checks pass, including preserved
  translations, unknown estimates, partial reports and daily observations.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. Other translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/20d623493">Translate Occitan filters, reminders and automation controls</a>. Thanks to xet7.</summary>

- Fill 81 Occitan filter, reminder, automation, map and import messages.
- Translation, registry and human-preference checks pass, including preserved
  translations, syntax tokens, visibility restrictions and reminder offsets.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. Other translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/39013666f">Fill remaining Occitan notification and recovery placeholders</a>. Thanks to xet7.</summary>

- Translate 79 Occitan notification, recovery and keyboard messages.
  No flagged English placeholders remain, including pending keys. Retain
  reviewed shared words and technical labels.
- Translation, registry and human-preference checks pass, covering tokens,
  preserved translations and irreversible recovery actions. Wording is lower
  confidence; browser layout and fluent-speaker review were not run.
  The broader language audit remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/161aa2186">Correct Occitan email labels and import guidance</a>. Thanks to xet7.</summary>

- Correct 12 mixed-language or inaccurate messages, including account
  creation described as activation and a missing Trello export menu step.
- Translation, registry and human-preference checks pass, covering preserved
  translations, placeholders, email labels and import API syntax.
  Wording is lower confidence; browser layout and fluent-speaker review were
  not run. The wider language audit continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ce6538dc6">Correct Occitan account and card action translations</a>. Thanks to xet7.</summary>

- Correct 15 strings covering account anonymization, cancellation, board
  restoration, timeline state, deletion warnings and member mapping.
- Translation, registry and human-preference checks pass, including positive
  and negative wording regressions and source-token preservation. Occitan
  wording is lower confidence; browser layout and fluent-speaker review were
  not run. The wider language audit continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef61a9ff8">Translate Breton rule email recovery messages</a>. Thanks to xet7.</summary>

- Fill 56 missing or English entries for rule email recovery, resend and
  discard actions, variable insertion and todo.txt import. Preserve existing
  translations, placeholders and import syntax; 320 Breton entries remain.
- Translation, registry and human-preference checks pass, including duplicate
  delivery and access-denial warnings. Breton wording is lower confidence;
  dictionary terminology was checked, but fluent-speaker and browser review
  were not run. Other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/86431e8e0">Translate Breton synchronization messages</a>. Thanks to xet7.</summary>

- Fill 63 entries for synchronization conflicts, previews, reports and Jira
  estimates, preserving existing translations and tokens. Breton has 257
  flagged entries remaining.
- Translation, registry and human-preference checks pass, covering source
  isolation, report limitations, local content retention and explicit null
  handling. Breton wording is lower confidence; fluent-speaker and browser
  review were not run. Other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7fa5a1003">Translate Breton Scrum planning and reports</a>. Thanks to xet7.</summary>

- Fill 80 Scrum entries for planning, sprint lifecycle and reports. Preserve
  existing translations and source tokens. Breton has 177 flagged entries
  remaining; the README measured language-completion count is now 109.
- Translation, registry and human-preference checks pass, covering unknown
  estimates, partial reports and daily observations. Breton wording is lower
  confidence; fluent-speaker and browser review were not run. The wider
  translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/843b2aaef">Translate Breton filters, reminders and interface controls</a>. Thanks to xet7.</summary>

- Fill 81 entries for filters, reminders, rules, imports and map controls.
  Preserve existing translations, source tokens and filter syntax; Breton
  has 96 flagged entries remaining.
- Translation, registry and human-preference checks pass, covering reminder
  offsets, board visibility, notification exceptions and list age semantics.
  Breton wording is lower confidence; fluent-speaker and browser review were
  not run. Other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/946c2cbf6">Complete flagged Breton notification and keyboard translations</a>. Thanks to xet7.</summary>

- Fill 83 entries and retain 13 reviewed keyboard labels, product names and
  mathematical symbols. Breton has no flagged placeholders, including pending
  keys; existing translations and source tokens are preserved.
- Whole-locale translation, registry and human-preference checks pass, with
  regressions for uncertain delivery and irreversible cancellation. Breton
  wording is lower confidence; fluent-speaker and browser review were not run.
  The older wording audit and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ddefda096">Correct Breton account warnings and mixed-language labels</a>. Thanks to xet7.</summary>

- Correct ten entries covering anonymization consequences, archive restoration,
  timeline state and French text in email-template labels. Other translations
  remain unchanged.
- Translation, registry and human-preference checks pass, including positive
  and negative meaning regressions. Breton wording is lower confidence;
  fluent-speaker and browser review were not run. The wider language audit
  continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b17566396">Translate Basque rule email recovery messages</a>. Thanks to xet7.</summary>

- Fill 56 entries for rule email delivery, resend and discard actions,
  variable insertion and todo.txt import. Preserve existing translations,
  source tokens and import syntax; 320 Basque entries remain flagged.
- Translation, registry and human-preference checks pass, covering duplicate
  delivery, access denial and discarded messages. Fluent-speaker and browser
  review were not run. Other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0407c37ae">Translate Basque synchronization messages</a>. Thanks to xet7.</summary>

- Fill 63 entries for synchronization conflicts, previews, reports and Jira
  estimates. Preserve existing translations and source tokens; 257 Basque
  entries remain flagged.
- Translation, registry and human-preference checks pass, covering source
  isolation, retained local content, report limitations and explicit null
  handling. Fluent-speaker and browser review were not run. Other languages
  remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e5f048c5">Translate Basque Scrum planning and reports</a>. Thanks to xet7.</summary>

- Fill 84 Scrum and navigation entries, preserving existing translations and
  source tokens. Basque has 173 flagged entries remaining; the README measured
  language-completion count is now 110.
- Translation, registry and human-preference checks pass, covering unknown
  estimates, partial reports, daily observations and incomplete imports.
  Fluent-speaker and browser review were not run. Other languages remain
  in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dca2afc45">Translate Basque filters, reminders and interface controls</a>. Thanks to xet7.</summary>

- Fill 81 entries for filters, reminders, rules, imports and map controls.
  Preserve existing translations, source tokens and filter syntax; Basque
  has 92 flagged entries remaining.
- Translation, registry and human-preference checks pass, covering reminder
  offsets, board visibility, notification exceptions and list age semantics.
  Fluent-speaker and browser review were not run. Other languages remain
  in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ee092452">Complete flagged Basque notification and keyboard translations</a>. Thanks to xet7.</summary>

- Fill 79 entries and retain 13 reviewed keyboard labels, product names and
  mathematical symbols. Basque has no flagged placeholders, including pending
  keys; existing translations and source tokens are preserved.
- Whole-locale translation, registry and human-preference checks pass, with
  regressions for uncertain delivery and irreversible cancellation.
  Fluent-speaker and browser review were not run. The older wording audit
  and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/441c30e07">Correct Basque timeline, member mapping and email labels</a>. Thanks to xet7.</summary>

- Correct seven entries with changed meaning or mixed Spanish wording,
  covering timeline state, member mapping and email-template labels.
  Other translations remain unchanged.
- Translation, registry and human-preference checks pass, including positive
  and negative wording regressions. Fluent-speaker and browser review were
  not run. The wider language audit continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5622984cc">Translate Welsh rule email recovery messages</a>. Thanks to xet7.</summary>

- Fill 56 entries in each Welsh locale for rule email delivery, resend and
  discard actions, variable insertion and todo.txt import. Preserve existing
  translations and source tokens; each locale has 321 flagged entries left.
- Translation, registry and human-preference checks pass, covering duplicate
  delivery, access denial and discarded messages. Welsh wording is lower
  confidence; fluent-speaker and browser review were not run. Other languages
  remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/33fd58bb0">Translate Welsh synchronization messages</a>. Thanks to xet7.</summary>

- Fill 63 entries in each Welsh locale for synchronization conflicts,
  previews, reports and Jira estimates. Preserve existing translations and
  source tokens; each locale has 258 flagged entries remaining.
- Translation, registry and human-preference checks pass, covering source
  isolation, retained content, report limitations and explicit null handling.
  Welsh wording is lower confidence; fluent-speaker and browser review were
  not run. Other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6002bb6ff">Translate Welsh Scrum planning and reports</a>. Thanks to xet7.</summary>

- Fill 84 Scrum and navigation entries in each Welsh locale, preserving
  existing translations and tokens. Each has 174 flagged entries remaining;
  the README measured language-completion count is now 112.
- Translation, registry and human-preference checks pass, covering unknown
  estimates, partial reports and daily observations. Welsh wording is lower
  confidence; fluent-speaker and browser review were not run. Other languages
  remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8afaefbb3">Translate Welsh filters, reminders and interface controls</a>. Thanks to xet7.</summary>

- Fill 81 entries in each Welsh locale for filters, reminders, rules, imports
  and map controls. Preserve existing translations and source syntax; each
  locale has 93 flagged entries remaining.
- Translation, registry and human-preference checks pass, covering reminder
  offsets, board visibility, notification exceptions and list age semantics.
  Welsh wording is lower confidence; fluent-speaker and browser review were
  not run. Other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7bf81015b">Complete flagged Welsh notification and keyboard translations</a>. Thanks to xet7.</summary>

- Fill 80 entries in each Welsh locale and retain 13 reviewed keyboard labels,
  product names and mathematical symbols. Neither has flagged placeholders,
  including pending keys; existing translations and tokens are preserved.
- Whole-locale translation, registry and human-preference checks pass, covering
  uncertain delivery and irreversible cancellation. Welsh wording is lower
  confidence; fluent-speaker and browser review were not run. The older
  wording audit and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e96eb39ce">Correct Welsh account and email-template wording</a>. Thanks to xet7.</summary>

- Correct seven entries in each Welsh locale covering member mapping,
  email-template labels and an anonymization warning that incorrectly called
  replacement values temporary. Other translations remain unchanged.
- Translation, registry and human-preference checks pass, including positive
  and negative wording regressions. Welsh wording is lower confidence;
  fluent-speaker and browser review were not run. The wider audit continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0595a513b">Translate Scottish Gaelic rule email recovery messages</a>. Thanks to xet7.</summary>

- Fill 56 entries for rule email delivery, resend and discard actions,
  variable insertion and todo.txt import. Preserve existing translations and
  source tokens; 321 Scottish Gaelic entries remain flagged.
- Translation, registry and human-preference checks pass, covering duplicate
  delivery, access denial and discarded messages. Scottish Gaelic wording is
  lower confidence; dictionary terminology was checked, but fluent-speaker
  and browser review were not run. Other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07979f147">Translate Scottish Gaelic synchronization messages</a>. Thanks to xet7.</summary>

- Fill 63 entries for synchronization conflicts, previews, reports and Jira
  estimates. Preserve existing translations and source tokens; 258 Scottish
  Gaelic entries remain flagged.
- Translation, registry and human-preference checks pass, covering source
  isolation, retained content, report limitations and explicit null handling.
  Scottish Gaelic wording is lower confidence; fluent-speaker and browser
  review were not run. Other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d09373fe">Translate Scottish Gaelic Scrum planning and reports</a>. Thanks to xet7.</summary>

- Translate 84 Scrum planning, reporting and navigation strings, preserving
  unknown estimates, partial reports and daily observation limitations.
- Translation, registry and human-preference checks pass, covering report
  wording and placeholder preservation. Scottish Gaelic wording is lower
  confidence; fluent-speaker and browser review were not run. Other languages
  remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b25d5d6d7">Translate Scottish Gaelic filters and notification controls</a>. Thanks to xet7.</summary>

- Translate 81 filter, reminder, rule-variable, map and import strings.
- Translation, registry and human-preference checks pass, covering date
  commands, rule variables, reminder offsets and access restrictions.
  Scottish Gaelic wording is lower confidence; fluent-speaker and browser
  review were not run. Other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/47b2a0a26">Complete flagged Scottish Gaelic recovery translations</a>. Thanks to xet7.</summary>

- Translate 80 recovery and keyboard strings; retain 13 technical terms.
  No flagged English placeholders remain in Scottish Gaelic.
- Translation, registry and human-preference checks pass, including full
  placeholder coverage and recovery warning checks. Scottish Gaelic wording
  is lower confidence; older wording, fluent-speaker and browser review
  remain outstanding. Other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2159b2f94">Correct Scottish Gaelic account anonymization warning</a>. Thanks to xet7.</summary>

- Replace export instructions in account anonymization with its actual
  permanent effects and correct five email-template labels.
- Translation, registry and human-preference checks pass, including retained
  history, disabled login and irreversibility. Scottish Gaelic wording is
  lower confidence; fluent-speaker and browser review were not run.
  Other languages and older wording remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/714043e90c">Translate Kashubian rule email recovery messages</a>. Thanks to xet7.</summary>

- Translate 56 recovery, variable insertion and todo.txt import strings.
- Translation, registry and human-preference checks pass, covering tokens,
  duplicate delivery, lost access and uncertain delivery. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older Polish-seeded values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c54e53285">Translate Kashubian synchronization messages</a>. Thanks to xet7.</summary>

- Translate 63 synchronization strings, preserving conflict choices,
  missing versus null values and diagnostic report limitations.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older Polish-seeded values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b2a6e87b8">Translate Kashubian Scrum planning and reports</a>. Thanks to xet7.</summary>

- Translate 84 Scrum planning, reporting and navigation strings, preserving
  unknown estimates, partial reports and daily observation limitations.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older Polish-seeded values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/edc6799e7d">Translate Kashubian filters and notification controls</a>. Thanks to xet7.</summary>

- Fill 81 filter, reminder, map and field-control placeholders; correct four
  older Polish date-filter labels.
- Translation, registry and human-preference checks pass, covering tokens,
  reminder offsets and access wording. Kashubian wording is lower confidence;
  fluent-speaker and browser review were not run. Older mixed-language values
  and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/362a51672c">Translate remaining flagged Kashubian recovery strings</a>. Thanks to xet7.</summary>

- Translate 81 recovery and keyboard strings and retain 11 technical terms.
  No flagged English placeholders remain; older Polish-seeded values still
  require correction.
- Translation, registry and human-preference checks pass, covering all tokens
  and recovery warnings. Kashubian wording is lower confidence; fluent-speaker
  and browser review were not run. Other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/519bf946d6">Replace Polish-seeded Kashubian activity and board labels</a>. Thanks to xet7.</summary>

- Correct 65 older strings, including activity messages, workspace controls,
  board views and attachment deletion. Preserve positive-integer height
  validation, recipient direction and multi-board calendar scope.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older mixed-language values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3fb0eb931f">Correct Kashubian card voting and appearance controls</a>. Thanks to xet7.</summary>

- Replace 65 Polish-seeded labels, restore plain poker numbers and the
  uncertainty symbol, and preserve permanent-deletion warnings.
- Translation, registry and human-preference checks pass, including token,
  vote-value and warning coverage. Kashubian wording is lower confidence;
  fluent-speaker and browser review were not run. Older mixed-language values
  and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd4f6ef314">Correct Kashubian permissions, colors and field labels</a>. Thanks to xet7.</summary>

- Replace 65 Polish-seeded strings, including permission roles, colors,
  field controls and enrollment email. Restore the empty comment placeholder
  and unchanged date-format codes.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older mixed-language values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d64861d2d">Correct Kashubian import, export and filter labels</a>. Thanks to xet7.</summary>

- Replace 55 Polish-seeded strings, preserving import syntax, API paths,
  URLs, date-field scope and compact labels.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older mixed-language values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18636280f2">Correct Kashubian navigation and transfer limit labels</a>. Thanks to xet7.</summary>

- Replace 55 Polish-seeded strings, preserving assigned-card restrictions,
  login links, units and upload versus download directions.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older mixed-language values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/204953ec43">Correct Kashubian mail and system information labels</a>. Thanks to xet7.</summary>

- Replace 50 Polish-seeded strings, preserving product names, environment
  variables and reactivity modes. Distinguish email subjects from bodies
  and free from total memory.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older mixed-language values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a8368ade9">Correct Kashubian card details and rule editor labels</a>. Thanks to xet7.</summary>

- Replace 50 Polish-seeded strings, preserving checklist counts, format
  tokens and Trello import limitations.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older mixed-language values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/95340f0e0e">Correct Kashubian workflow and scheduling labels</a>. Thanks to xet7.</summary>

- Replace 45 Polish-seeded strings, retaining weekday schedules, before and
  after offsets, move directions and unmapped workflow-node warnings.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older mixed-language values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57c5edcb6b">Correct Kashubian rule actions and settings labels</a>. Thanks to xet7.</summary>

- Replace 50 Polish-seeded strings, preserving checklist syntax, empty-field
  matching, date triggers and protocol names.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older mixed-language values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae166d97b8">Correct Kashubian date reminders and layout labels</a>. Thanks to xet7.</summary>

- Replace 45 Polish-seeded strings, preserving reminder tokens and line
  breaks, relative positions and read/unread distinctions.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older mixed-language values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f7f589fb1">Correct Kashubian search aliases and shared template labels</a>. Thanks to xet7.</summary>

- Replace 45 Polish-seeded strings and restore short search aliases and
  separator syntax. Check localized operator spelling and parser registration.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older mixed-language values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e01cf95d28">Correct Kashubian search help and card controls</a>. Thanks to xet7.</summary>

- Replace 40 Polish-seeded strings, preserving search syntax, signed day
  offsets, font name, sort directions and completion states.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older mixed-language values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6fbd1ec2b">Correct Kashubian dependency, map and report labels</a>. Thanks to xet7.</summary>

- Replace 40 Polish-seeded strings, preserving relationship directions,
  map coordinates, HTML entities and format tokens.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older mixed-language values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/604b95e0cf">Correct Kashubian report and ticket labels</a>. Thanks to xet7.</summary>

- Replace 40 Polish-seeded strings, keeping ticket states, memory metrics
  and technical identifiers distinct.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older mixed-language values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/75eef42957">Correct Kashubian checklist and storage translations</a>. Thanks to xet7.</summary>

- Correct 40 mixed-language checklist, attachment and storage labels while
  preserving product names and checking translation placeholders.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older mixed-language values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cbb8f4540b">Correct Kashubian status, support and backup translations</a>. Thanks to xet7.</summary>

- Correct 80 mixed-language time, support, account lockout and backup labels.
  Preserve cloud product names, placeholders and technical date/time formats.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older mixed-language values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/174a20bb33">Correct Kashubian cloud storage and migration translations</a>. Thanks to xet7.</summary>

- Correct 60 mixed-language cloud storage, credentials and migration labels.
  Preserve console menu names, hostnames, identifiers and placeholders.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Older mixed-language values and other languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3efc42631">Correct remaining labeled Kashubian translations</a>. Thanks to xet7.</summary>

- Translate 99 scheduling, repository and flow-report entries. Reject the
  old language-label suffix throughout the locale and check technical values.
- Translation, registry and human-preference checks pass. Kashubian wording,
  especially statistical explanations, is lower confidence. Fluent-speaker
  and browser review were not run. Other mixed-language text and languages
  remain in progress; removing the suffix does not prove linguistic quality.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac326b0ac1">Correct mixed-language Kashubian administration messages</a>. Thanks to xet7.</summary>

- Correct 53 attachment, account lockout and copy-dialog translations.
  Preserve placeholders and explain that removed attachment files are kept.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/71545b9bbd">Correct Kashubian migration messages and storage paths</a>. Thanks to xet7.</summary>

- Correct 45 mixed-language migration messages and restore the literal
  files/attachments path. Check database URLs, commands and migration states.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3df83eab85">Correct Kashubian recovery descriptions and confirmations</a>. Thanks to xet7.</summary>

- Correct 21 mixed-language recovery descriptions and confirmation dialogs.
  Preserve field names, removal conditions, archive scope and the undo warning.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d563f024c4">Correct Kashubian progress and offline messages</a>. Thanks to xet7.</summary>

- Correct 19 mixed-language progress and offline messages. Preserve limits,
  background behavior, action labels and the definite data-loss warning.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bec8c65052">Correct Kashubian board selection and import messages</a>. Thanks to xet7.</summary>

- Correct 30 mixed-language selection, import and display messages. Preserve
  permission limits, Excel column names and distinct star/unstar actions.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dabc169b5b">Correct Kashubian display and role settings messages</a>. Thanks to xet7.</summary>

- Correct 20 display and settings messages, including the swimlane selector.
  Preserve global administrator rights and organization deletion conditions.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/227258bbf8">Correct Kashubian errors and empty state translations</a>. Thanks to xet7.</summary>

- Correct 30 error and empty-state messages. Preserve format tokens, import
  extensions, validation examples and matching-card/username distinctions.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/98d007ccb7">Correct Kashubian job and storage result messages</a>. Thanks to xet7.</summary>

- Correct 31 job, storage and error messages. Preserve scheduling failure
  scope, distinct job states and all recoverable item types.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45ed6e9cfb">Correct Kashubian action labels and deletion confirmations</a>. Thanks to xet7.</summary>

- Correct 37 labels and confirmations. Preserve removal scope, notifications
  and undo warnings; fix actions versus rules in the board deletion notice.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ecaa5b4d1f">Correct Kashubian settings and removal confirmations</a>. Thanks to xet7.</summary>

- Correct 28 settings and confirmation messages. Preserve permanent deletion
  warnings, board removal scope and technical names.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ca42c872c">Correct Kashubian archive and import guidance</a>. Thanks to xet7.</summary>

- Correct 26 archive, permission and import messages. Preserve archive recovery
  semantics, role restrictions, placeholders and technical names.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/846d47b130">Correct Kashubian Trello import messages</a>. Thanks to xet7.</summary>

- Correct 22 Trello import messages. Preserve ZIP limits, job-scoped deletion,
  saved credential behavior and technical names.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a1306563c">Correct Kashubian import instructions and Jira endpoint</a>. Thanks to xet7.</summary>

- Correct eight import messages, restore the literal Jira API endpoint and
  align menu labels. Preserve todo.txt syntax, file formats and placeholders.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8239218e69">Correct Kashubian filter instructions and query examples</a>. Thanks to xet7.</summary>

- Correct 16 filtering instructions and restore literal query examples and
  backslash escaping. Check example fields, operators and placeholders.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2c166d08f">Correct Kashubian search logic and status instructions</a>. Thanks to xet7.</summary>

- Correct 15 search instructions and restore literal examples. Clarify AND
  versus OR, unarchived card inclusion and positive integer limits.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/acd1db347b">Correct Kashubian automatic loading and sizing messages</a>. Thanks to xet7.</summary>

- Correct 15 messages and refresh outdated card-loading guidance. Preserve
  automatic mode selection, configuration names and lazy-loading limitations.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/39b6450057">Correct Kashubian storage guidance and backup paths</a>. Thanks to xet7.</summary>

- Correct 22 storage messages and restore the literal backup attachment path.
  Preserve avatar import scope, storage names and compaction prerequisites.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6c4339f47">Correct Kashubian backup scope and export messages</a>. Thanks to xet7.</summary>

- Correct 15 backup and export messages. Preserve organization backup
  exclusions and restore boundaries; correct the monitoring export action.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4705f75e0d">Correct Kashubian account status and login messages</a>. Thanks to xet7.</summary>

- Correct 16 account and login messages. Restore the single home-board limit;
  preserve temporary lockouts, activation actions and export restrictions.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/87fb06ba42">Correct Kashubian notification and sharing messages</a>. Thanks to xet7.</summary>

- Correct 20 notification and sharing messages. Preserve invitation tokens,
  tenant configuration, access warnings and activity-recording distinctions.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89f73c4ae1">Correct Kashubian activity detail messages</a>. Thanks to xet7.</summary>

- Correct 20 activity messages. Preserve placeholder inventories and argument
  order, including move source and destination details.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb0003a975">Correct Kashubian activity results and reminders</a>. Thanks to xet7.</summary>

- Correct 22 activity entries. Preserve argument order, timestamp layout
  and distinctions between approaching, overdue and current deadlines.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/55b7ea9226">Correct Kashubian editing and rule messages</a>. Thanks to xet7.</summary>

- Correct 21 editing and rule messages. Preserve keyboard shortcuts, link
  syntax, personal settings scope and deletion warnings.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d4f605df1">Correct Kashubian feature and anonymization descriptions</a>. Thanks to xet7.</summary>

- Correct eight feature descriptions. Replace incorrect export text in the
  account anonymization confirmation; preserve defaults and restrictions.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9a3695eee3">Correct Kashubian rule builder messages</a>. Thanks to xet7.</summary>

- Correct 19 rule-builder messages. Preserve event distinctions, member and
  assignee roles, time placeholders and Butler import limitations.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6bab0fba484f9ad2350e1436dc1490dffd98d7c">Correct Kashubian rule action summaries</a>. Thanks to xet7.</summary>

- Correct 21 rule action messages, preserving opposite actions, member roles
  and the distinction between the current list and a specified list.
- Translation, registry and human-preference checks pass. Kashubian wording
  is lower confidence; fluent-speaker and browser review were not run.
  Other mixed-language text and languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/341d15da07e480add02226a67b8a5a0c8a9ea638">Translate Esperanto email recovery and todo.txt guidance</a>. Thanks to xet7.</summary>

- Fill 44 missing entries and 11 related English placeholders, preserving
  existing translations, delivery uncertainty and executable import syntax.
- Translation, registry and human-preference checks pass. Fluent-speaker
  and browser review were not run. Older Esperanto placeholders and other
  languages remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/607de044c5496ccbc97099a1fe3413a0ba6142d5">Translate Esperanto filters, notifications and accessibility</a>. Thanks to xet7.</summary>

- Fill 129 English placeholders for filters, reminders, visibility, map
  placement and accessible block editing, preserving existing translations.
- Translation, registry and human-preference checks pass, including rule
  variables, filter syntax, timing and opposite actions. Fluent-speaker and
  browser review were not run. Other translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7cb78fb5f449fa6af61867760645fb8712d2971">Translate Esperanto block editor accessibility and navigation</a>. Thanks to xet7.</summary>

- Fill 212 English placeholders for block editing, mathematical descriptions
  and rule editor messages. Update the coverage count to 115 languages.
- Translation, registry and human-preference checks pass, including tokens,
  opposite operations and rule restrictions. Fluent-speaker and browser
  review were not run. Remaining translation work is still in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac53d6ee924675d298b5623eb387fb074125fceb">Translate Esperanto planning, synchronization and queue messages</a>. Thanks to xet7.</summary>

- Fill 154 English placeholders for planning, reports, synchronization
  diagnostics and email queue controls, preserving existing translations.
- Translation, registry and human-preference checks pass, including variables,
  partial results, retries and cancellation scope. Fluent-speaker and browser
  review were not run. Remaining translation work is still in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0ee1b215d307fd1676a0c1d4f230868d0113e99e">Complete the Esperanto recovery message placeholder fill</a>. Thanks to xet7.</summary>

- Fill the remaining 55 Esperanto prose placeholders and classify 13 unchanged
  key names, product names and mathematical abbreviations explicitly.
- Full key-order, token, registry and human-preference checks pass. No flagged
  English prose placeholders remain in Esperanto. Fluent-speaker and browser
  review were not run; the wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7d461d72f47c0facfc2f9a27c7d3c6a3f271964e">Translate Albanian filters, rules and email recovery messages</a>. Thanks to xet7.</summary>

- Fill 88 missing entries and English placeholders for filters, imports,
  visibility, rule variables and email recovery. Preserve existing translations.
- Translation, key-order, registry and human-preference checks pass. All current
  source keys are present in Albanian, but other English placeholders remain.
  Fluent-speaker and browser review were not run; translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32d46428e26dddf4526027edc4055261fe2fa7b6">Translate Albanian reminders, maps and accessibility messages</a>. Thanks to xet7.</summary>

- Fill 54 English placeholders for reminders, saved filters, maps and
  accessibility announcements, preserving existing translations.
- Translation, registry and human-preference checks pass, including timing,
  template variables and opposite directions. Fluent-speaker and browser
  review were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/039e6882cfa1adffe18d4e0183c83143ff4311ad">Translate Albanian block field accessibility labels</a>. Thanks to xet7.</summary>

- Fill 67 English placeholders for block fields, comments and keyboard controls,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including comment
  state and opposite operations. Fluent-speaker and browser review were not
  run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/594e37c1f3f6c92a43e4f94b395a65f5bdf38911">Translate Albanian block input and navigation labels</a>. Thanks to xet7.</summary>

- Fill 61 English placeholders for inputs, list operations, comparisons and
  keyboard navigation, preserving existing translations and variables.
- Translation, registry and human-preference checks pass, including input
  roles and inclusive comparisons. Fluent-speaker and browser review were
  not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/183e2187f083a4462fee157e981a416faa380c97">Translate Albanian math and screen reader labels</a>. Thanks to xet7.</summary>

- Fill 55 English placeholders for mathematics, keyboard actions and screen
  reader instructions, preserving existing translations and variables.
- Translation, registry and human-preference checks pass, including mathematical
  roles and opposite screen reader states. Fluent-speaker and browser review
  were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2f0869ba2d911002cac48899aaea662ff3997d5">Translate Albanian workspace shortcuts and rule editing</a>. Thanks to xet7.</summary>

- Fill 58 English placeholders for shortcuts, workspace search and rule
  editing, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including navigation
  directions and rule restrictions. Fluent-speaker and browser review were
  not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/574e8f81d7d4111c0602aedf64a9ee24ed086a56">Translate Albanian planning and sprint labels</a>. Thanks to xet7.</summary>

- Fill 60 English placeholders for planning and sprint reporting. Preserve
  existing translations and update the coverage count to 116 languages.
- Translation, registry and human-preference checks pass, including unknown
  estimates and opposite actions. Fluent-speaker and browser review were
  not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f7a0f1aaba2ef44875d661ce5456f9bf31ba8a7">Translate Albanian sprint reports and sync conflicts</a>. Thanks to xet7.</summary>

- Fill 48 English placeholders for sprint reports and synchronization
  conflicts, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including partial
  reports, unknown estimates and local card preservation. Fluent-speaker and
  browser review were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fbf6a40f9da9d24221d2d8d35885676dad45bc7d">Translate Albanian synchronization diagnostics</a>. Thanks to xet7.</summary>

- Fill 40 English placeholders for synchronization diagnostics and email
  queue guidance, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including retention,
  partial changes and explicit null values. Fluent-speaker and browser review
  were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/54d35934eae0514dad82499af6de8be9d81a8f99">Translate Albanian email queue and notification recovery</a>. Thanks to xet7.</summary>

- Fill 43 English placeholders for email queues, time estimates and notification
  recovery, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including cancellation
  scope, retry behavior and activity preservation. Fluent-speaker and browser
  review were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2db35874145e8404b2d4e11cbc5c7036ffc2a742">Complete the Albanian recovery message placeholder fill</a>. Thanks to xet7.</summary>

- Fill the remaining 35 Albanian prose placeholders and classify 12 unchanged
  key names, product names and mathematical terms explicitly.
- Full key-order, token, registry and human-preference checks pass. No flagged
  English prose placeholders remain in Albanian. Fluent-speaker and browser
  review were not run; the wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efd20f3cbb47ff9e23760bea0dd00b1e13635431">Translate Armenian filters, imports and board visibility</a>. Thanks to xet7.</summary>

- Fill 28 missing entries and English placeholders for filters, imports and
  board visibility, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including date
  boundaries, import syntax and access restrictions. Fluent-speaker and browser
  review were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e582efc1c7b5a25589abb0689bec9f2f7c4660f">Translate Armenian rules and reminder messages</a>. Thanks to xet7.</summary>

- Fill 32 English placeholders for rules, notifications and reminders,
  preserving existing translations and executable variables.
- Translation, registry and human-preference checks pass, including reminder
  timing, notification exceptions and URL schemes. Fluent-speaker and browser
  review were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dcad33e135253827c406a0d90610e486784edf0c">Translate Armenian saved filters and map messages</a>. Thanks to xet7.</summary>

- Fill 27 English placeholders for saved filters, maps and import reports,
  preserving existing translations and executable variables.
- Translation, registry and human-preference checks pass, including filter
  replacement, placement and menu labels. Fluent-speaker and browser review
  were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a849e1a5c1bb3757445c31d7b6ff290eeff61cd7">Translate Armenian block accessibility labels</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders for block accessibility, preserving existing
  translations and replacement tokens.
- Translation, registry and human-preference checks pass, including movement
  directions, opposite actions and angle values. Fluent-speaker and browser
  review were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/75ea317047ee4489cf767fde59440fcbfbee8998">Translate Armenian block field and editing labels</a>. Thanks to xet7.</summary>

- Fill 37 English placeholders for block fields, editing and keyboard controls,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including coordinate
  order and distinct editing actions. Fluent-speaker and browser review were
  not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d6da3be3907c7c64068766408d19f9f8a207b6e">Translate Armenian block input roles</a>. Thanks to xet7.</summary>

- Fill 35 English placeholders for block controls and input roles, preserving
  existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including opposite
  controls, positions and arithmetic roles. Fluent-speaker and browser review
  were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ebcd9d23b04517d53570e2fab2cf76787fa96fc8">Translate Armenian input and keyboard navigation labels</a>. Thanks to xet7.</summary>

- Fill 31 English placeholders for numeric and text inputs and keyboard
  navigation, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including coordinates,
  positions and movement confirmation. Fluent-speaker and browser review were
  not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d509aad5569a5d05b9416bbc7d93bbc4877caea">Translate Armenian mathematical accessibility labels</a>. Thanks to xet7.</summary>

- Fill 34 English placeholders for mathematical accessibility and block
  controls, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including comparisons,
  inverse functions and opposite operations. Fluent-speaker and browser review
  were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b78e28ab7e2023996a6ad4729f6f7c89bc80795e">Translate Armenian keyboard and screen reader instructions</a>. Thanks to xet7.</summary>

- Fill 35 English placeholders for keyboard and screen reader instructions,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including mode
  changes, disabled functions and navigation commands. Fluent-speaker and
  browser review were not run. Translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e5d05da135e46e752a981a811621e1ee941f10e">Translate Armenian workspace navigation messages</a>. Thanks to xet7.</summary>

- Fill 30 English placeholders for workspace navigation and announcements,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including opposite
  directions and composed announcements. Fluent-speaker and browser review
  were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59583399ca46b6f3b385e7c8195afff6f8f8a186">Translate Armenian workspace search and rule editing</a>. Thanks to xet7.</summary>

- Fill 25 English placeholders for workspace search and rule editing,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including shortcuts,
  permissions and rule restrictions. Fluent-speaker and browser review were
  not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8f5600584aaca1208e6335647c078830947de2d">Translate Armenian sprint planning labels</a>. Thanks to xet7.</summary>

- Fill 40 English placeholders for sprint planning, preserving existing
  translations. Update the coverage count to 117 languages.
- Translation, registry and human-preference checks pass, including naming,
  time units and opposite actions. Fluent-speaker and browser review were
  not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1667587f2f4d0d1699738f295574168cf8662071">Translate Armenian sprint reports and completion states</a>. Thanks to xet7.</summary>

- Fill 30 English placeholders for sprint reports and completion states,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including unknown
  estimates, partial reports and cancellation behavior. Fluent-speaker and
  browser review were not run. Translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57c14c31ef">Translate Armenian observations and synchronization guidance</a>. Thanks to xet7.</summary>

- Fill 20 English placeholders for daily observations and sync conflicts,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including observation
  limits and local conflict resolution. Fluent-speaker and browser review were
  not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a41b64abc">Translate Armenian synchronization previews and diagnostics</a>. Thanks to xet7.</summary>

- Fill 51 English placeholders for sync previews, conflict recovery and reports,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including report
  limits and missing versus null source values. Fluent-speaker and browser
  review were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6043fbf57b">Translate Armenian email queue recovery guidance</a>. Thanks to xet7.</summary>

- Fill 35 English placeholders for email recovery and time estimates,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including
  cancellation, uncertain delivery and paused retries. Fluent-speaker and
  browser review were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a394622b6a">Translate Armenian activity notification recovery</a>. Thanks to xet7.</summary>

- Fill 35 English placeholders for activity recovery and rule email reports,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including cancellation
  and mail-server acceptance. Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/35286e30d7">Translate Armenian rule email resolution guidance</a>. Thanks to xet7.</summary>

- Translate 35 missing or English strings for manual email resolution and
  legacy email review, preserving translations and replacement tokens.
- Translation, registry and human-preference checks pass, including duplicate
  delivery and uncertain resends. Fluent-speaker and browser review were
  not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fec95a0b97">Fill remaining Armenian translation placeholders</a>. Thanks to xet7.</summary>

- Translate 18 recovery, SAML and history strings. Retain standard key labels,
  OS brands and short mathematical symbols as locale-specific invariants.
- All 3,783 keys and replacement tokens pass completeness checks; no flagged
  English prose remains. Registry and human-preference checks also pass.
- Fluent-speaker and browser review were not run. Older vocabulary review
  and the wider translation work remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/491c2259e4">Translate Azerbaijani filter and import guidance</a>. Thanks to xet7.</summary>

- Translate 30 missing or English strings in each of three Azerbaijani locales
  for filters, imports and visibility, preserving existing translations.
- Translation, registry and human-preference checks pass, including tokens,
  query examples and todo.txt syntax. Fluent-speaker and browser review
  were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/054eb41dbb">Translate Azerbaijani rules and reminder guidance</a>. Thanks to xet7.</summary>

- Translate 35 English strings in each of three Azerbaijani locales for rules,
  notifications and reminders, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including rule
  variables, trigger order and reminder offsets. Fluent-speaker and browser
  review were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ce27dd17f6">Translate Azerbaijani map and accessibility guidance</a>. Thanks to xet7.</summary>

- Translate 34 English strings in each of three Azerbaijani locales for saved
  filters, imports, maps and accessibility, preserving translations and tokens.
- Translation, registry and human-preference checks pass, including movement
  directions and private filter replacement. Fluent-speaker and browser review
  were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de5d41a0e4">Translate Azerbaijani block editor labels</a>. Thanks to xet7.</summary>

- Translate 38 English strings in each of three Azerbaijani locales for
  accessible fields, block structure and keyboard labels, preserving tokens.
- Translation, registry and human-preference checks pass, including input
  counts and comment states. Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/563fc5e698">Translate Azerbaijani editor field guidance</a>. Thanks to xet7.</summary>

- Translate 37 English strings in each of three Azerbaijani locales for editor
  fields, keyboard labels and comment controls, preserving translations.
- Translation, registry and human-preference checks pass, including tokens,
  pixel coordinates and keyboard End semantics. Fluent-speaker and browser
  review were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/635710f57e">Translate Azerbaijani block input labels</a>. Thanks to xet7.</summary>

- Translate 42 English strings in each of three Azerbaijani locales for list,
  loop, math and text inputs, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including division
  operands and coordinates. Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88d43dc89f">Translate Azerbaijani navigation and mathematics labels</a>. Thanks to xet7.</summary>

- Translate 35 English strings in each of three Azerbaijani locales for
  keyboard navigation, comparisons and mathematics, preserving tokens.
- Translation, registry and human-preference checks pass, including movement
  confirmation and square roots. Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aaa8e5aa71">Translate Azerbaijani math and screen reader controls</a>. Thanks to xet7.</summary>

- Translate 38 English strings in each of three Azerbaijani locales for
  trigonometry, screen readers and editor actions, preserving translations.
- Translation, registry and human-preference checks pass, including tokens,
  inverse functions and on/off instructions. Fluent-speaker and browser review
  were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cab2a4a4d6">Translate Azerbaijani editor shortcut labels</a>. Thanks to xet7.</summary>

- Translate 36 English strings in each of three Azerbaijani locales for
  shortcuts, focus controls and parameter warnings, preserving tokens.
- Translation, registry and human-preference checks pass, including movement
  versus scrolling and navigation directions. Fluent-speaker and browser
  review were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b7fc0531a6">Translate Azerbaijani workspace and rule editor guidance</a>. Thanks to xet7.</summary>

- Translate 31 English strings in each of three Azerbaijani locales for
  workspace announcements, search and rule editing, preserving tokens.
- Translation, registry and human-preference checks pass, including shortcuts,
  comment fragments and rule constraints. Fluent-speaker and browser review
  were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1dbf854bad">Translate Azerbaijani sprint planning guidance</a>. Thanks to xet7.</summary>

- Translate 35 English strings in each of three Azerbaijani locales for Scrum
  settings, sprint actions and backlog planning, preserving translations.
- Translation, registry and human-preference checks pass, including tokens,
  consistent labels and distinct sprint actions. Fluent-speaker and browser
  review were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ee15900ad">Translate Azerbaijani sprint reports and events</a>. Thanks to xet7.</summary>

- Translate 30 English strings in each of three Azerbaijani locales for sprint
  events, reports and states. Update the README coverage count to 120 locales.
- Translation, registry and human-preference checks pass, including tokens,
  unknown estimates and sprint cancellation. Fluent-speaker and browser review
  were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2550a151b7">Translate Azerbaijani observations and sync conflicts</a>. Thanks to xet7.</summary>

- Translate 25 English strings in each of three Azerbaijani locales for daily
  observations, partial reports and sync conflicts, preserving translations.
- Translation, registry and human-preference checks pass, including tokens,
  observation limits and local conflict resolution. Fluent-speaker and browser
  review were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/083d10abb3">Translate Azerbaijani synchronization previews</a>. Thanks to xet7.</summary>

- Translate 30 English strings in each of three Azerbaijani locales for sync
  previews, duplicate recovery and source omissions, preserving translations.
- Translation, registry and human-preference checks pass, including tokens,
  unchanged subcards and hidden source values. Fluent-speaker and browser
  review were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/250e4a869c">Translate Azerbaijani synchronization reports</a>. Thanks to xet7.</summary>

- Translate 20 English strings in each of three Azerbaijani locales for sync
  reports and diagnostics, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including retention,
  recovery limits and null values. Fluent-speaker and browser review were
  not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/97a81729eb">Translate Azerbaijani email queue recovery</a>. Thanks to xet7.</summary>

- Translate 35 English strings in each of three Azerbaijani locales for email
  recovery and time estimates, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including delivery
  uncertainty and paused retries. Fluent-speaker and browser review were
  not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63b221b375">Translate Azerbaijani activity notification recovery</a>. Thanks to xet7.</summary>

- Translate 30 English strings in each of three Azerbaijani locales for
  activity recovery and rule email reports, preserving translations and tokens.
- Translation, registry and human-preference checks pass, including retained
  work and cancellation. Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f844ff3423">Translate Azerbaijani rule email resolution</a>. Thanks to xet7.</summary>

- Translate 30 missing or English strings in each of three Azerbaijani locales
  for email review and resending, preserving translations and tokens.
- Translation, registry and human-preference checks pass, including server
  acceptance and duplicate delivery warnings. Fluent-speaker and browser
  review were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd2d0d715e">Fill remaining Azerbaijani translation placeholders</a>. Thanks to xet7.</summary>

- Translate 28 recovery and history strings in each Azerbaijani locale.
  Retain standard key labels, OS brands, trig symbols and the Sprint loanword.
- All 3,783 keys and replacement tokens pass completeness checks; no flagged
  English prose remains. Registry and human-preference checks also pass.
- Fluent-speaker and browser review were not run. Older vocabulary review
  and the wider translation work remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2708d63a29">Translate Georgian filters and import guidance</a>. Thanks to xet7.</summary>

- Translate 25 missing or English strings for filters and imports, preserving
  existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including date-query
  and todo.txt syntax. Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0519144842">Translate Georgian access and rule guidance</a>. Thanks to xet7.</summary>

- Translate 25 English strings for board access, rule variables and
  notifications, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including permissions,
  variable syntax and action order. Fluent-speaker and browser review were
  not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b785f1a735">Translate Georgian reminders and saved filters</a>. Thanks to xet7.</summary>

- Translate 25 English strings for reminders, saved filters and import reports,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including reminder
  offsets and template syntax. Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/431d51adf4">Translate Georgian map and accessibility guidance</a>. Thanks to xet7.</summary>

- Translate 29 English strings for maps, movement announcements and accessible
  controls, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including directions
  and comment controls. Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c36a05a3d8">Translate Georgian block editor labels</a>. Thanks to xet7.</summary>

- Translate 34 English strings for field types, block structure and variable
  deletion guidance, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including input
  counts and parameter restrictions. Fluent-speaker and browser review
  were not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4300732d43">Translate Georgian color and loop controls</a>. Thanks to xet7.</summary>

- Translate 27 English strings for editor actions, color controls and loops,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including color
  limits and loop behavior. Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57b7dcb7b0">Translate Georgian conditions and loop guidance</a>. Thanks to xet7.</summary>

- Translate 22 English strings for conditions, loops and copy actions,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including while/until
  conditions and fallback branches. Fluent-speaker and browser review were
  not run. The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/763019d429">Translate Georgian editor actions and fields</a>. Thanks to xet7.</summary>

- Translate 27 English strings for deletion, editing and bitmap fields,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including deletion
  counts and pixel coordinates. Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6732a50bbb">Translate Georgian editor help and input labels</a>. Thanks to xet7.</summary>

- Translate 27 English strings for keyboard help, editor controls and list
  inputs, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including input
  layout and repeat counts. Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b60ab93758">Translate Georgian numeric and text input labels</a>. Thanks to xet7.</summary>

- Translate 32 English strings for numeric, loop and text inputs, preserving
  existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including division
  operands and coordinates. Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91ecc314b8">Translate Georgian navigation and list creation</a>. Thanks to xet7.</summary>

- Translate 21 English strings for keyboard navigation and list creation,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including movement
  confirmation and empty lists. Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0885eed737">Translate Georgian list retrieval guidance</a>. Thanks to xet7.</summary>

- Translate 21 English strings for list retrieval, removal and sublists,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including checks
  distinguishing reading from removal and indexing from either end.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e89026fd4f">Translate Georgian list transformation guidance</a>. Thanks to xet7.</summary>

- Translate 37 English strings for list indexing, repetition, sorting,
  insertion, replacement and splitting, preserving translations and tokens.
- Translation, registry and human-preference checks pass, including checks
  distinguishing insertion from replacement and joining from splitting.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e388e0866d">Translate Georgian logic and arithmetic guidance</a>. Thanks to xet7.</summary>

- Translate 41 English strings for Boolean values, comparisons, conditional
  expressions, arithmetic and constants, preserving translations and tokens.
- Translation, registry and human-preference checks pass, including comparison
  boundaries, both-versus-either conditions and conditional field labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a712f52e4f">Translate Georgian math and statistics guidance</a>. Thanks to xet7.</summary>

- Translate 35 English strings for numeric bounds, divisibility, remainders
  and list statistics, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including numeric
  bounds, remainders, opposite number properties and statistical terms.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b81f3c8ffc">Translate Georgian math functions and variable controls</a>. Thanks to xet7.</summary>

- Translate 47 English strings for rounding, trigonometry, variable creation
  and editor navigation, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including rounding
  directions, inverse functions, angle units and variable field labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3297dfd2a3">Translate Georgian procedures and editor controls</a>. Thanks to xet7.</summary>

- Translate 34 English strings for functions, variable renaming and editor
  controls, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including return
  values, warning scope, keyboard labels and renaming all matching variables.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c0b224df93">Translate Georgian screen reader and shortcut guidance</a>. Thanks to xet7.</summary>

- Translate 35 English strings for screen reader modes and editor shortcuts,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including on/off
  instructions, opposite directions and cancelling versus finishing a move.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/607545ed5b">Translate Georgian text positions and editor shortcuts</a>. Thanks to xet7.</summary>

- Translate 34 English strings for scrolling, text casing, character positions
  and substrings, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including indexing
  direction, letter case, opposite scroll directions and occurrence counting.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aee6badea8">Translate Georgian text processing guidance</a>. Thanks to xet7.</summary>

- Translate 30 English strings for text searching, replacement, prompts and
  trimming, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including missing
  text, replacing all occurrences, counting spaces and trimming directions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27049e6e88">Translate Georgian workspace and variable guidance</a>. Thanks to xet7.</summary>

- Translate 24 English strings for variables, workspace summaries and search,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including keyboard
  names, comment fragment spacing and variable type versus parameter conflicts.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5eea6b13de">Translate Georgian search and rule editor guidance</a>. Thanks to xet7.</summary>

- Translate 25 English strings for search, rule editing and planning views,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including trigger
  counts, administrator permission, reload instructions and shared labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a503e6476f">Translate Georgian sprint planning controls</a>. Thanks to xet7.</summary>

- Translate 30 English strings for Scrum roles, estimates, completion policies
  and sprint controls, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including completion
  policies, closing versus cancelling a sprint and shared planning labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/357cfcb9cc">Translate Georgian sprint reports and outcomes</a>. Thanks to xet7.</summary>

- Translate 30 English strings for sprint reports, estimates and event outcomes,
  preserving existing translations and tokens. Update the coverage count to 121.
- Translation, registry and human-preference checks pass, including unknown
  estimates, comparable units and closing versus cancelling a sprint.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a47c791ab1">Translate Georgian observations and sync guidance</a>. Thanks to xet7.</summary>

- Translate 25 English strings for workflow categories, daily observations
  and sync conflicts, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including omitted
  days, unknown estimates, observation limits and no writes to source systems.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe244dcebd">Translate Georgian sync conflict and preview guidance</a>. Thanks to xet7.</summary>

- Translate 25 English strings for sync conflict resolution and previews,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including retained
  content, unchanged subcards, replacement reuse and preview limits.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5dd76bdf61">Translate Georgian synchronization reports</a>. Thanks to xet7.</summary>

- Translate 25 English strings for source omissions and sync reports,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including retention
  limits, hidden values, write access and reports not resuming or undoing runs.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84a160102d">Translate Georgian email queue and sync diagnostics</a>. Thanks to xet7.</summary>

- Translate 20 English strings for sync diagnostics and email queue controls,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including null
  handling, uncertain delivery, recall limits and retries respecting pauses.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8a260121f">Translate Georgian email failure and retry guidance</a>. Thanks to xet7.</summary>

- Translate 20 English strings for email failures, recovery and time estimates,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including rejection
  types, cancellation limits, retry review and time units.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3017d9e0a9">Translate Georgian activity recovery guidance</a>. Thanks to xet7.</summary>

- Translate 20 English strings for activity recovery and mapped time estimates,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including retained
  work, missing versus changed activities and retries not recreating activities.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3bd740ff39">Translate Georgian notification controls and rule email reports</a>. Thanks to xet7.</summary>

- Translate 20 English strings for notification controls and rule email reports,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including permanent
  cancellation, recall limits and mail server acceptance wording.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a2e5eee16">Translate Georgian rule email resolution guidance</a>. Thanks to xet7.</summary>

- Translate 20 English strings for rule email recovery decisions and outcomes,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including duplicate
  email warnings, uncertain outcomes and confirming arrival before marking sent.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fbc05d9a96">Complete Georgian placeholder translations</a>. Thanks to xet7.</summary>

- Translate the final 29 flagged Georgian prose entries. Retain ten standard
  keyboard labels, operating system names and math symbols.
- Full Georgian key-order, token and untranslated-prose checks pass against
  3783 English keys, alongside registry and human-preference checks.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e93d568a0">Translate Swahili archive and date filter guidance</a>. Thanks to xet7.</summary>

- Translate 20 English strings for automatic archiving and date filters,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including date
  boundaries, numeric ranges, missing dates and template archive exceptions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d34a7869bc">Translate Swahili import and rule guidance</a>. Thanks to xet7.</summary>

- Translate 20 English strings for filters, imports, board visibility and rules,
  preserving existing translations, syntax examples and replacement tokens.
- Translation, registry and human-preference checks pass, including import
  syntax, date examples, editing permissions and rule action order.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/538580ff42">Translate Swahili notifications and reminders</a>. Thanks to xet7.</summary>

- Translate 20 English strings for activity notifications and due reminders,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including reminder
  offsets, server defaults, day limits and notifications that always arrive.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31602c4a13">Translate Swahili saved filters and map controls</a>. Thanks to xet7.</summary>

- Translate 20 English strings for saved filters, import warnings and maps,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including template
  variables, private filter replacement and recovery menu labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60cca3d15e">Translate Swahili map and movement announcements</a>. Thanks to xet7.</summary>

- Translate 19 English strings for map placement and movement announcements,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including placement
  alternatives, before/after movement and all four scrolling directions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6749d1411">Translate Swahili editor accessibility labels</a>. Thanks to xet7.</summary>

- Translate 20 English strings for editor actions and field types,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including add/remove
  actions, collapse/expand labels, image types and angle units.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/87b51b89b3">Translate Swahili block labels and warnings</a>. Thanks to xet7.</summary>

- Translate 24 English strings for block labels, keyboard names and warnings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including keyboard
  names, singular/plural inputs and collapsed versus disabled blocks.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ede99fc35f">Translate Swahili color and loop controls</a>. Thanks to xet7.</summary>

- Translate 20 English strings for colors, block controls and loop flow,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including color
  ranges and exiting a loop versus continuing with its next iteration.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/305623e208">Translate Swahili loops and conditionals</a>. Thanks to xet7.</summary>

- Translate 20 English strings for loops and conditional guidance,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including loop-only
  restrictions, while/until conditions and the final fallback branch.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e74dcc98a">Translate Swahili editor actions and deletion prompts</a>. Thanks to xet7.</summary>

- Translate 20 English strings for editor actions and deletion prompts,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including deletion
  counts, copy/cut actions, enable/disable actions and keyboard labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9475b3ff42">Translate Swahili editor fields and comment controls</a>. Thanks to xet7.</summary>

- Translate 20 English strings for editor fields, pixels and comment controls,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including pixel
  counts, row/column positions and open/close comment actions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2bca7bcfd7">Translate Swahili list inputs and warning controls</a>. Thanks to xet7.</summary>

- Translate 20 English strings for list inputs, conditions and warnings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including text/list
  operations, start/end positions and open/close warning actions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/307b8a8c5b">Translate Swahili numeric input labels</a>. Thanks to xet7.</summary>

- Translate 20 English strings for numeric, list and loop inputs,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including division
  operands, loop bounds, minimum/maximum values and coordinate labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a60896a71">Translate Swahili text inputs and keyboard navigation</a>. Thanks to xet7.</summary>

- Translate 20 English strings for text inputs and keyboard navigation,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including navigation
  shortcuts, copy/cut states, input positions and shared value labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c785dfa05f">Translate Swahili navigation and list creation guidance</a>. Thanks to xet7.</summary>

- Translate 20 English strings for navigation, list creation and retrieval,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including movement
  shortcuts, empty-list semantics and first/last item labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06f7ae029b">Translate Swahili list retrieval and removal guidance</a>. Thanks to xet7.</summary>

- Translate 20 English strings for list retrieval, removal and sublists,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including removal
  versus return values, missing items and sublist indexing direction.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/da601576a6">Translate Swahili list editing guidance</a>. Thanks to xet7.</summary>

- Translate 20 English strings for list repetition, reversal and editing,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including insertion
  versus value setting, copy semantics and repetition counts.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/65d29d6fa0">Translate Swahili sorting and comparison guidance</a>. Thanks to xet7.</summary>

- Translate 20 English strings for sorting, splitting and comparisons,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including comparison
  boundaries, joining versus splitting, copy semantics and sort direction.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/411d214b0e">Translate Swahili logic guidance</a>. Thanks to xet7.</summary>

- Translate 20 English strings for comparisons, Boolean logic and conditions,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including comparison
  boundaries, both/either conditions and matching conditional field labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e74cc7ab4d">Translate Swahili math constants and operations</a>. Thanks to xet7.</summary>

- Translate 15 English math strings, preserving formulas, coordinates and
  replacement tokens, including inclusive numerical limits.
- Translation, registry and human-preference checks pass.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2454be06b">Translate Swahili numeric checks and statistics</a>. Thanks to xet7.</summary>

- Translate 39 English strings for number properties, statistics, rounding and
  random values, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including inclusive
  and exclusive random range boundaries and distinct average and median labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/753644f3a4">Translate Swahili math functions and block editing</a>. Thanks to xet7.</summary>

- Translate 34 English strings for math functions, workspace navigation and
  variable creation, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including inverse
  functions and degree versus radian guidance.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/baaa73d587">Translate Swahili procedure and editor guidance</a>. Thanks to xet7.</summary>

- Translate 34 English strings for procedures, inputs and editor actions,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including output
  distinctions, disabled functions and function-only block warnings.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c7a7e237c">Translate Swahili accessibility shortcuts</a>. Thanks to xet7.</summary>

- Translate 44 English strings for screen-reader modes, navigation and editor
  shortcuts, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including mode
  toggles and the distinction between block movement and scrolling.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df2c1c8a04">Translate Swahili text positions and keyboard guidance</a>. Thanks to xet7.</summary>

- Translate 39 English strings for text processing and keyboard guidance,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including text
  positions, append behavior and the value returned for a missing match.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/43f22ea8bd">Translate Swahili text operations and variables</a>. Thanks to xet7.</summary>

- Translate 34 English strings for text operations, variables and workspace
  announcements, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including text
  replacement scope, spaces, trim directions and workspace counts.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3eeab4f03e">Translate Swahili workspace search and block guidance</a>. Thanks to xet7.</summary>

- Translate 30 English strings for workspace search, block labels and rule
  guidance, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including keyboard
  shortcuts, unsaved changes and one-trigger/one-action guidance.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/751b3ef513">Translate Swahili rule editing and Scrum planning</a>. Thanks to xet7.</summary>

- Translate 30 English strings for rule editing and Scrum planning,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including permissions,
  rule conflicts and distinct completion policies.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c98f6b3d1">Translate Swahili sprint events and backlog labels</a>. Thanks to xet7.</summary>

- Translate 30 English strings for sprint events and backlog planning,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including unfinished
  work, time units and consistent backlog labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b0320048d">Translate Swahili sprint reporting guidance</a>. Thanks to xet7.</summary>

- Translate 30 English strings for sprint reports and daily observations,
  preserving existing translations and replacement tokens. Update the README
  coverage count to 122 after Swahili passes the 90 percent threshold.
- Translation, registry and human-preference checks pass, including UTC days,
  missing observations and unknown estimates being different from zero.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d90c4ad4b4">Translate Swahili sync conflict guidance</a>. Thanks to xet7.</summary>

- Translate 25 English strings for synchronization conflicts and previews,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including local
  content retention, unchanged subcards and reuse of replacement cards.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/494825e20f">Translate Swahili sync preview and reporting limits</a>. Thanks to xet7.</summary>

- Translate 25 English strings for synchronization previews and reports,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including report
  limits, retention and the warning that reports cannot resume or undo a run.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a30c6ef45e">Translate Swahili sync diagnostics and email queue</a>. Thanks to xet7.</summary>

- Translate 25 English strings for synchronization diagnostics and email queues,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including missing
  versus null values, repeated delivery and respecting an existing pause.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c353bea528">Translate Swahili email failure and recovery guidance</a>. Thanks to xet7.</summary>

- Translate 20 English strings for email failures, recovery and time estimates,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including cancellation
  boundaries, temporary versus permanent failures and hour units.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7887f33788">Translate Swahili activity notification recovery</a>. Thanks to xet7.</summary>

- Translate 20 English strings for activity notification recovery,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including retained
  pending work, no activity recreation and missing versus null source values.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aa4d5a663e">Translate Swahili notification delivery controls</a>. Thanks to xet7.</summary>

- Translate 20 English strings for notification delivery controls and reports,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including permanent
  cancellation, recall limits and mail-server acceptance.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8258a15878">Translate Swahili email resolution actions</a>. Thanks to xet7.</summary>

- Translate 20 missing strings for email resolution actions,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including duplicate
  delivery warnings, uncertain outcomes and confirmation requirements.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73567b3ecc">Fill remaining Swahili recovery translations</a>. Thanks to xet7.</summary>

- Translate 29 missing recovery, sign-in and history strings. Swahili now has
  all 3783 source keys with no flagged English prose; standard key names,
  OS brands and short mathematical symbols are retained.
- Full key-order, replacement-token, registry and human-preference checks pass.
  Fluent-speaker and browser review were not run.
  Wider translation and language-quality work remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e59fbe1464">Translate Tagalog filtering and import guidance</a>. Thanks to xet7.</summary>

- Translate 25 English strings for filtering, archiving and imports,
  preserving existing translations, replacement tokens and import syntax.
- Translation, registry and human-preference checks pass, including inclusive
  date boundaries, template exclusion and literal import tokens.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f4f563334d">Translate Tagalog rules and notification guidance</a>. Thanks to xet7.</summary>

- Translate 25 English strings for board visibility, rules and notifications,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including editing
  restrictions, rule variables, action order and notification exceptions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bcb6bb34fb">Translate Tagalog reminders and saved filters</a>. Thanks to xet7.</summary>

- Translate 25 English strings for reminders, saved filters and import reports,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including reminder
  offsets, saved-filter replacement and matching recovery menu labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/82cb90df61">Translate Tagalog map and accessibility guidance</a>. Thanks to xet7.</summary>

- Translate 24 English strings for maps and accessibility announcements,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including map
  placement, movement order and distinct scroll directions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88615540ea">Translate Tagalog editor field labels</a>. Thanks to xet7.</summary>

- Translate 25 English strings for editor fields and accessibility labels,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including angle
  units, comment expansion and keyboard labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9f337b6c4">Translate Tagalog block labels and editor actions</a>. Thanks to xet7.</summary>

- Translate 24 English strings for block labels and editor actions,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including deletion
  warnings, input counts and consistent conditional labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9fa234bf7f">Translate Tagalog editor actions and bitmap labels</a>. Thanks to xet7.</summary>

- Translate 25 English strings for editor actions and bitmap labels,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including deletion
  counts, pixel coordinates, keyboard labels and comment controls.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e496e44db7">Translate Tagalog list and loop input labels</a>. Thanks to xet7.</summary>

- Translate 25 English strings for list and loop inputs and warning controls,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including warning
  controls, start and end positions and consistent repetition counts.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7edf7492c7">Translate Tagalog numeric and text input labels</a>. Thanks to xet7.</summary>

- Translate 25 English strings for numeric and text inputs,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including division
  operands, coordinates and consistent start and end positions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd1fb11d50">Translate Tagalog navigation and list operations</a>. Thanks to xet7.</summary>

- Translate 25 English strings for keyboard navigation and list operations,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including copy
  semantics, sort directions and movement shortcuts.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a667aa0deb">Translate Tagalog logic and arithmetic guidance</a>. Thanks to xet7.</summary>

- Translate 24 English strings for logic, arithmetic and text splitting,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including comparison
  boundaries, Boolean conditions and matching conditional labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/10c48f8c12">Translate Tagalog math constants and number checks</a>. Thanks to xet7.</summary>

- Translate 25 English strings for math constants and number checks,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including inclusive
  limits, coordinate ranges and distinct numeric concepts.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac2c6d3fd6">Translate Tagalog statistics and rounding guidance</a>. Thanks to xet7.</summary>

- Translate 25 English strings for statistics, random values and rounding,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including random
  bounds, modes and distinct rounding directions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52cec1f5b7">Translate Tagalog math function guidance</a>. Thanks to xet7.</summary>

- Translate 21 English strings for math functions and accessibility labels,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including inverse
  functions, logarithm bases and negation.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2da4fa747f">Translate Tagalog function and navigation guidance</a>. Thanks to xet7.</summary>

- Translate 25 English strings for functions and editor navigation,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including angle
  units, function outputs and disabled definitions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6a97f0ab08">Translate Tagalog procedures and accessibility controls</a>. Thanks to xet7.</summary>

- Translate 25 English strings for procedures and accessibility controls,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including return
  values, function-only restrictions and screen-reader toggles.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca2fa5e111">Translate Tagalog keyboard shortcut labels</a>. Thanks to xet7.</summary>

- Translate 30 English strings for keyboard shortcuts,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including movement
  versus scrolling, navigation endpoints and detailed announcements.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ee45c952f">Translate Tagalog text processing basics</a>. Thanks to xet7.</summary>

- Translate 25 English strings for text processing and keyboard controls,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including append
  semantics, character positions and case conversion.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0dd76c77f2bdd21df877d405d5dba183d81020f8">Translate Tagalog text operations</a>. Thanks to xet7.</summary>

- Translate 30 English strings for text indexing, replacement, length,
  prompts and trimming, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including text
  indexing, replacement and length guidance.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aa47e163cb80ec6b52a00842e2e6c9022a4c7fcb">Translate Tagalog workspace and variable guidance</a>. Thanks to xet7.</summary>

- Translate 33 English strings for variables, workspace descriptions and search,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including search
  navigation and empty workspace descriptions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ece4e1167780605d669147442ba25767f9579502">Translate Tagalog rule editing and Scrum labels</a>. Thanks to xet7.</summary>

- Translate 30 English strings for rule editing and Scrum planning,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including rule
  connection requirements and administrator permissions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3823e773aeb1390d4d104b4c7da8dbf24c5c8f7c">Translate Tagalog sprint planning and events</a>. Thanks to xet7.</summary>

- Translate 35 English strings for sprint planning, events and completion,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including unfinished
  work, time units and distinct sprint actions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3dd97b936c7d89a3e0bdba9aadc34bc76f3fcb23">Translate Tagalog sprint reports and observations</a>. Thanks to xet7.</summary>

- Translate 35 English strings for sprint reports, observations and sync,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including unknown
  estimates, observation limits and sync direction.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/485e34faa12f2653c03731695c6e256b9ba434f9">Translate Tagalog sync conflicts and previews</a>. Thanks to xet7.</summary>

- Translate 30 English strings for sync conflicts and previews, preserving
  existing translations and replacement tokens. Update the README count to
  123 languages above the 90 percent translated threshold.
- Translation, registry and human-preference checks pass, including preserved
  subcards and local versus source choices.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d22d8c34c57ad2f1abd024c6b00c42574ac54712">Translate Tagalog sync diagnostics and delivery guidance</a>. Thanks to xet7.</summary>

- Translate 30 English strings for sync reports and email delivery guidance,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including retention
  periods, null handling and delivery recall limits.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e828e6e1f168b89a0666fd904dc017d30f14f9f3">Translate Tagalog email queue controls and failures</a>. Thanks to xet7.</summary>

- Translate 35 English strings for email controls, failures and time estimates,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including cancellation
  limits, estimate fields and temporary versus permanent failures.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04962bd966c74ea61fec49d2a364fc04c03fc218">Translate Tagalog notification recovery and rule email reports</a>. Thanks to xet7.</summary>

- Translate 35 English strings for notification recovery and rule email reports,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including cancellation
  limits, missing activities and mail-server acceptance.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2947644961399751308683d9cbcc4d2334d940c1">Translate Tagalog email resolution and legacy guidance</a>. Thanks to xet7.</summary>

- Translate 30 English strings for email resolution and older queued messages,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including duplicate
  delivery warnings and uncertain resend outcomes.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5cbfef839fecc477ffea89011df2907381f90e07">Complete Tagalog placeholder translations</a>. Thanks to xet7.</summary>

- Translate the final 21 English prose placeholders in Tagalog, preserving
  existing translations, replacement tokens and standard technical labels.
- Translation, registry and human-preference checks pass, including all 3,783
  source keys and their tokens. No flagged prose placeholders remain in Tagalog.
  Fluent-speaker and browser review were not run.
  Wider translation and language-quality work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0deccee03ba8b95d36a069a67ec0edfce357e7f7">Translate Maltese filters, imports and board visibility</a>. Thanks to xet7.</summary>

- Translate 30 English strings for filters, imports and board visibility,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including import
  syntax and visibility markup.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/291f184aaf0ddbd4426397e6123fbcec4110dcc9">Translate Maltese rules, notifications and reminders</a>. Thanks to xet7.</summary>

- Translate 30 English strings for rules, notifications and due-date reminders,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including rule
  variables and reminder limits.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/338a88170d6004edd614ba40fd90ce3aadd99ab6">Translate Maltese saved filters and map guidance</a>. Thanks to xet7.</summary>

- Translate 29 English placeholders and replace two prefixed English menu labels
  with Maltese. Match import report navigation to the menu labels.
- Translation, registry and token checks pass, including URL variables and
  movement directions. Another 722 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a3f074cad58c6f51b70b94d1327aeb1ce5033dc">Replace prefixed English Maltese interface labels</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for navigation, calendars
  and voting, preserving existing correct-language translations and tokens.
- Translation, registry and human-preference checks pass, including movement
  and voting labels. Another 687 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e4117954eea7b2a054bd828633219996e6e5be7">Translate Maltese appearance and voting labels</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for voting, appearance
  and colors, preserving existing correct-language translations and tokens.
- Translation, registry and human-preference checks pass, including distinct
  font sizes. Another 652 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/073b4f4b5fb8e85164bed05f6c41633fca760f2f">Translate Maltese email, export and permission labels</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for colors, permissions,
  email and exports, preserving correct-language translations and tokens.
- Translation, registry and human-preference checks pass, including invitation
  tokens. Another 617 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f96c84ce73a19f725d65bd772f93ded3c61c1d88">Translate Maltese import and navigation labels</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for imports, exports,
  filtering and navigation, preserving correct-language translations and tokens.
- Translation, registry and human-preference checks pass, including file
  extensions. Another 582 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/97204c95415e26b82f89a3f721e263fa17b9f80b">Translate Maltese settings and attachment limits</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for settings, previews,
  time tracking and file limits, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including distinct
  upload and download labels. Another 547 prefixed English values remain.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ed5f4caf2bc2d45a7e295e4f796c3647988c3dd">Translate Maltese email configuration and system labels</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for email configuration,
  webhooks and system information, preserving tokens and technical identifiers.
- Translation, registry and human-preference checks pass, including invitation
  placeholders. Another 512 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e74e6ba721b86e84b2a229716ec1238270c3fca">Translate Maltese system and workflow labels</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for system information,
  card dates, subtasks and workflows, preserving translations and tokens.
- Translation, registry and human-preference checks pass, including shared
  subtask labels. Another 477 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe7315748db9ed98178fde67aceda93f07df0165">Translate Maltese rule scheduling and checklist actions</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for rule scheduling,
  date triggers and checklist actions, preserving translations and tokens.
- Translation, registry and human-preference checks pass, including weekday
  bounds. Another 442 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9166ee5cb8b3ddded56f271d4b06af72dd6ee787">Translate Maltese roles, weekdays and rule details</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for rule details,
  authentication, roles and weekdays, preserving translations and tokens.
- Translation, registry and human-preference checks pass, including reminder
  placeholders. Another 407 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7328ad039751af3b687a8bb831b4f63bbb307588">Translate Maltese search and shared template labels</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for shared templates,
  dates and search terms, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including search-token
  formatting. Another 372 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/592e83e83ffc1aa70e41cab1aa5b8a7b1c47c275">Translate Maltese dependency and search labels</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for search, card completion
  and dependencies, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including relationship
  directions. Another 337 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/663b89dff959752eb2a4cabc9eb9eb4515c2ac38">Translate Maltese report and location labels</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for locations, reports
  and recovery details, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including template
  placeholders. Another 302 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57112d38650e97bd5415977edc47b4d1b75858cb">Translate Maltese history and memory diagnostic labels</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for loading indicators,
  history, support and memory diagnostics, preserving translations and tokens.
- Translation, registry and human-preference checks pass, including distinct
  history actions. Another 267 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a71e71ea991b9d9f156a94cb655469b283c7381e">Translate Maltese storage and file repair labels</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for storage, file repair
  and memory usage, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including distinct
  source and destination labels. Another 232 prefixed English values remain.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/507cabea4945f4cce17053cb611de8eefe53a311">Translate Maltese support and account lockout labels</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for support, accessibility,
  account lockouts and scheduled jobs, preserving translations and tokens.
- Translation, registry and human-preference checks pass, including lockout
  time units. Another 197 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6235f8f5d44915904eaecb4276c0fa414e185e58">Translate Maltese backup and migration labels</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for migrations, storage
  and backups, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including migration
  outcomes. Another 162 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3ee45b0291bd1fba7e012ad3a6b5dd7d0b1815d">Translate Maltese cloud and migration controls</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for backup schedules,
  cloud connections and migration controls, preserving translations and tokens.
- Translation, registry and human-preference checks pass, including distinct
  pause and stop actions. Another 127 prefixed English values remain.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aa4095671fa4a61b4507c75eaf23953f1542771e">Translate Maltese job progress and schedule labels</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for migration progress,
  job schedules and storage statistics, preserving translations and tokens.
- Translation, registry and human-preference checks pass, including schedule
  intervals. Another 92 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/326f2497666ccbbda666488efd66a4ce85de1d9e">Translate Maltese monitoring and migration controls</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for job monitoring and
  migration controls, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including distinct
  pause and stop labels. Another 57 prefixed English values remain to translate.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed392330b9e2d26aa22bbd11d9bb181ba8c38ccd">Translate Maltese event and flow report labels</a>. Thanks to xet7.</summary>

- Replace 35 prefixed English values with Maltese for event details, sign-in
  labels and flow reports, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including technical
  identifiers. Another 22 prefixed English values and other placeholders remain.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e12e3653a7930ccb0ebcf3b7312ebd00bb8f33f">Translate remaining prefixed Maltese flow explanations</a>. Thanks to xet7.</summary>

- Replace the final 22 prefixed English values with Maltese flow explanations
  and add regression coverage against this pattern throughout the locale.
- Translation, registry and human-preference checks pass, including forecast
  limits and time-adjustment caveats. Other English placeholders remain.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c49d154658ec979a82a4e3b2d4b2c5cd4b9e70f0">Translate Maltese block editor accessibility labels</a>. Thanks to xet7.</summary>

- Translate 25 English placeholders for block editor accessibility and movement
  announcements, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including movement
  directions and comment controls.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cebc36c6fa7ff635a0f88d23dd8ec8ae5bf96d8">Translate Maltese block labels and input types</a>. Thanks to xet7.</summary>

- Translate 24 English placeholders for block labels, input types and warnings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  comment and warning announcements.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6ee245dc89ee4cbb28986978f6ae9a8d0d444a29">Translate Maltese editor fields and bitmap controls</a>. Thanks to xet7.</summary>

- Translate 26 English placeholders for editor fields, bitmap controls and
  keyboard labels, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including coordinate
  placeholders and distinct open and close actions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ab553f27d702b65da0bea15dc4ad95416983764">Translate Maltese list and loop input labels</a>. Thanks to xet7.</summary>

- Translate 25 English placeholders for conditions, lists and loop inputs,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  start and end labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e91d7ac6833614ede39cdce8f89084b1370d245d">Translate Maltese numeric and text input labels</a>. Thanks to xet7.</summary>

- Translate 25 English placeholders for numeric and text inputs,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  minimum, maximum, start and end labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e5ba98d0e4843dcc2c94b9cf5f7eb653ad874ce">Translate Maltese navigation and math announcements</a>. Thanks to xet7.</summary>

- Translate 23 English placeholders for keyboard navigation and mathematical
  announcements, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  comparison operators and square-root labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/786caf0418ce220a70fd6a616e8baed1b833972b">Translate Maltese math and workspace controls</a>. Thanks to xet7.</summary>

- Translate 21 English placeholders for mathematical functions and workspace
  controls, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  inverse functions and page navigation labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a657efa1cb501158c3d9a40688b8c81662a51efc">Translate Maltese screen reader and shortcut guidance</a>. Thanks to xet7.</summary>

- Translate 25 English placeholders for screen reader guidance and keyboard
  shortcuts, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  enable, disable, finish and cancel actions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc9a374352e88f62baadaa06f397e178f2673183">Translate Maltese movement shortcuts and text positions</a>. Thanks to xet7.</summary>

- Translate 24 English placeholders for movement shortcuts and text-position
  announcements, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  directions and positions counted from the end.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d39be2403f7eeb93ac228afe5ef1c5cd0febc484">Translate Maltese block workspace and rule editor</a>. Thanks to xet7.</summary>

- Translate 27 English placeholders for workspace search and rule editing,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including search
  direction and saved-state distinctions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/41d6d21f21ddce0b2c8747fa72981ba7a55a31c6">Translate Maltese Scrum planning and reports</a>. Thanks to xet7.</summary>

- Translate 66 English placeholders for Scrum planning and sprint reports,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including consistent
  backlog labels and distinct sprint states and confirmation messages.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4aaae1a0d442d8d4436cabe800b6d03502c9fab3">Translate Maltese sprint observations and Sync conflicts</a>. Thanks to xet7.</summary>

- Translate 56 English placeholders for sprint observations and Sync conflicts,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass. Update the README
  coverage count after Maltese crosses the 90 percent threshold.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3b76a42a5ddcbc35634724e84d3baa2c43717f7">Translate Maltese Sync diagnostics and email queue</a>. Thanks to xet7.</summary>

- Translate 36 English placeholders for Sync diagnostics and email delivery,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including retention
  periods, null semantics and distinct delivery actions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a1f8f4354b31a64c6d1a29ec298c1b556aacdf6">Translate Maltese email failures and activity recovery</a>. Thanks to xet7.</summary>

- Translate 30 English placeholders for email failures, activity notifications
  and time estimates, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including failure
  categories and original versus remaining time.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ef010535d447e7f9b3b37580cf0a3289b86aa3c">Translate Maltese notification controls and rule email delivery</a>. Thanks to xet7.</summary>

- Translate 35 missing or English strings for notification controls and rule
  email delivery, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  delivery actions and confirmation states.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c274b0558d0e09f69a65b14a03bc5b1e3af4b65">Translate Maltese email resolution and legacy review</a>. Thanks to xet7.</summary>

- Translate 35 missing or English strings for email resolution and reviewing
  older queued messages, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including distinct
  resolution actions and legacy confirmation messages.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0470cb06bb01c088038137ad27fcd8325f9acddd">Finish Maltese source coverage for recovery messages</a>. Thanks to xet7.</summary>

- Translate the final nine missing recovery strings and retain nine technical
  labels. Maltese has all 3,783 source keys and no flagged prose placeholders.
- Translation, registry and human-preference checks pass, including full-locale
  source order, replacement tokens and pending translation keys.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93bd021d4ff88a4a74e88f83af7ad25e2dabc81f">Translate Luxembourgish filters and import instructions</a>. Thanks to xet7.</summary>

- Translate 25 missing or English strings for archiving, date filters and
  imports, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including literal
  filter syntax and todo.txt import markers.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c489a8bdf2b6ffea4ef241c2e685e9d7edb09924">Translate Luxembourgish rules and notifications</a>. Thanks to xet7.</summary>

- Translate 30 missing or English strings for board visibility, rules and
  notifications, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including rule
  variables and visibility markup.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/672c468b801c800d2c343a4c7259067928d22715">Translate Luxembourgish saved filters and map views</a>. Thanks to xet7.</summary>

- Translate 25 missing or English strings for reminders, saved filters,
  imports and maps, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including template
  variables and recovery navigation labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac020df64277c18c2b065cbf8c399526c3d25f81">Translate Luxembourgish block accessibility messages</a>. Thanks to xet7.</summary>

- Translate 29 missing or English strings for map placement and block-editor
  accessibility, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  movement, expand/collapse and add/remove announcements.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7278a6943eea455617b328a80c97d011750b3ad">Translate Luxembourgish block labels and loop controls</a>. Thanks to xet7.</summary>

- Translate 29 missing or English strings for block labels, colors and loop
  controls, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  break/continue and singular/plural input labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6f883e1ee53c6b630cbf49b97a59ba18b2c8dae">Translate Luxembourgish editor fields and conditionals</a>. Thanks to xet7.</summary>

- Translate 25 missing or English strings for conditional blocks, editor
  fields and keyboard labels, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including distinct
  conditional descriptions, copy actions and keyboard End.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5dd0b457b5d9cf3a7b0a2f19849bc14c35c99712">Translate Luxembourgish list inputs and editor icons</a>. Thanks to xet7.</summary>

- Translate 30 missing or English strings for editor icons and list inputs,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  warning actions, conditions and list positions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64aa727ef714d85f60d71533bf4846094ade51aa">Translate Luxembourgish numeric and text inputs</a>. Thanks to xet7.</summary>

- Translate 30 missing or English strings for numeric and text inputs,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  dividend/divisor, minimum/maximum and start/end labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59b3e06777bf477ad1362b9580a1baf0e188a08d">Translate Luxembourgish list operations and navigation</a>. Thanks to xet7.</summary>

- Translate 19 missing or English strings for list operations and keyboard
  navigation, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  retrieval and removal descriptions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/beac3e00e6f16f04828857398d3df378f1d5c322">Translate Luxembourgish sublist and list search messages</a>. Thanks to xet7.</summary>

- Translate 15 missing or English strings for sublists, item searches and
  list repetition, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including first/last
  and start/end distinctions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dafde31d3815fe5526390ce253d227b763f4a7b5">Translate Luxembourgish list sorting and comparisons</a>. Thanks to xet7.</summary>

- Translate 20 missing or English strings for list sorting, text conversion
  and comparisons, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  sorting directions, text conversions and comparison operators.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a401b6aa893a13aac6ab06c0c88ec7c66b8f35e">Translate Luxembourgish logic and math descriptions</a>. Thanks to xet7.</summary>

- Translate 17 missing or English strings for logic and math descriptions,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including comparison
  operators, AND/OR distinctions and conditional-field references.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f8904a3b1f3559eb3fa882129c7f3d909bbeea6">Translate Luxembourgish math constants and statistics</a>. Thanks to xet7.</summary>

- Translate 20 missing or English strings for math constants, limits and
  list statistics, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including math
  symbols and distinct median/mode and square-root labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6665f00c0c717a5ebec093c39e11afc4e993539d">Translate Luxembourgish math function descriptions</a>. Thanks to xet7.</summary>

- Translate 20 missing or English strings for random numbers, logarithms,
  powers and statistics, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including logarithm
  and exponent distinctions and inclusive/exclusive random-number bounds.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64531a49915d444db9adce271e4bd03b8b6271e7">Translate Luxembourgish trigonometry descriptions</a>. Thanks to xet7.</summary>

- Translate 13 missing or English strings for square roots and trigonometry,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including inverse
  function distinctions and degree versus radian wording.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1718091b478c164c98422d10d2bc1bfc4733a22b">Translate Luxembourgish function blocks and navigation</a>. Thanks to xet7.</summary>

- Translate 22 missing or English strings for workspace navigation and
  function blocks, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  return/no-return and Page Up/Page Down labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a42f2a09cf71b980f69bb73cdc5a58f40a40a40d">Translate Luxembourgish screenreader controls and shortcuts</a>. Thanks to xet7.</summary>

- Translate 21 missing or English strings for screen-reader controls and
  editor shortcuts, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  enabled/disabled, abort/finish and focus-target labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a7f9168b8efa0e9c975ca3f99edc265c7159d02">Translate Luxembourgish movement shortcuts and text actions</a>. Thanks to xet7.</summary>

- Translate 25 missing or English strings for movement shortcuts and text
  actions, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  directions, next/previous stacks and top/bottom positions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c55c0e6e8f60f6c1b5ff5f9e3d60bcb56838966d">Translate Luxembourgish text positions and searches</a>. Thanks to xet7.</summary>

- Translate 20 missing or English strings for text positions, searches and
  letter case, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  first/last, start/end and uppercase/lowercase labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4213cb62c75b41ba5e3f536ba4c376c4b31a2a72">Translate Luxembourgish text prompts and variables</a>. Thanks to xet7.</summary>

- Translate 21 missing or English strings for text prompts, trimming,
  variables and workspace announcements, preserving translations and tokens.
- Translation, registry and human-preference checks pass, including distinct
  trim directions, prompt types and get/set actions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d418faf2d22630043da2f8c63fb5fe64336edd23">Translate Luxembourgish workspace search and help</a>. Thanks to xet7.</summary>

- Translate 18 missing or English strings for workspace search and block
  editor help, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including keyboard
  names and distinct next/previous search actions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aabeb10494d7931552d6fd22233a447c68785222">Translate Luxembourgish rule editing and Scrum settings</a>. Thanks to xet7.</summary>

- Translate 24 missing or English strings for rule editing and Scrum settings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass. Update README
  coverage after Luxembourgish crosses the 90 percent threshold.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/430ddf2c0aaef9875d760486653372b67f1a9c7a">Translate Luxembourgish sprint planning and events</a>. Thanks to xet7.</summary>

- Translate 27 missing or English strings for sprint planning and events,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including consistent
  backlog labels and distinct start, close and cancel actions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/909abd4c955d8612da470d3db140ceedc95b61da">Translate Luxembourgish sprint reports and states</a>. Thanks to xet7.</summary>

- Translate 24 missing or English strings for sprint reports and states,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  sprint states and separate close/cancel confirmations.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d127d1bb4ad4a2fe8fb2aba0b6c07c13cf72079">Translate Luxembourgish sprint observation reports</a>. Thanks to xet7.</summary>

- Translate 15 missing or English strings for sprint observations, imports
  and Sync conflicts, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including UTC
  wording, observation limits and unknown versus zero estimates.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d428b56f7ef62776956b14df5684c8dc88fd6261">Translate Luxembourgish Sync conflicts and previews</a>. Thanks to xet7.</summary>

- Translate 20 missing or English strings for synchronization conflicts and
  previews, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  local/source and keep/detach choices.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/963356e6fb74200cf9bc40dcd744ee642e40462a">Translate Luxembourgish Sync source reports</a>. Thanks to xet7.</summary>

- Translate 20 missing or English strings for synchronization previews and
  source-field reports, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including matching
  labels across views and report limits.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5277b9782aad2a9abd367d2c391e49758ef5629e">Translate Luxembourgish Sync diagnostics and estimates</a>. Thanks to xet7.</summary>

- Translate 17 missing or English strings for synchronization diagnostics
  and estimate fields, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including retention
  periods, the null token and distinct run states.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/95dc9b2522447c64df4f44ea510d850ead379f2d">Translate Luxembourgish email delivery queue</a>. Thanks to xet7.</summary>

- Translate 20 missing or English strings for the email delivery queue,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  pause, resume, cancel, busy and failure messages.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/987d5c9e893b8db4cdc6a5a578a22905f25013af">Translate Luxembourgish email failures and activity recovery</a>. Thanks to xet7.</summary>

- Translate 20 missing or English strings for email failures, time estimates
  and activity recovery, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including distinct
  failure types, time estimates and the null token.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6876fa2d66932a0951ed80998524eae466bd106a">Translate Luxembourgish activity notification controls</a>. Thanks to xet7.</summary>

- Translate 21 missing or English strings for activity-notification recovery,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  delivery actions and missing/changed activity states.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32fa01b0324eaa7ff50f4869a0262a3e7020c65f">Translate Luxembourgish rule email delivery</a>. Thanks to xet7.</summary>

- Translate 20 missing or English strings for rule-email delivery,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  accepted/unconfirmed and started/confirmed states.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4891b993d7309a8c5e5d1b1911f82d6bcbf670d8">Translate Luxembourgish email resolution and review</a>. Thanks to xet7.</summary>

- Translate 20 missing or English strings for email resolution and review
  of older queued messages, preserving existing translations and tokens.
- Translation, registry and human-preference checks pass, including distinct
  resend, mark-as-sent and discard confirmations.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1fc287fc0a4ebfd3cc4376b9ae9aed5691494b5">Finish Luxembourgish source coverage for recovery messages</a>. Thanks to xet7.</summary>

- Translate the final 22 missing recovery strings and retain 19 technical
  terms. All 3,783 source keys are present, with no flagged prose placeholders.
- Translation, registry and human-preference checks pass, including full-locale
  source order, replacement tokens and pending translation keys.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/780e60b53cf3c3b88292fb3bffae83b80c96b9e9">Translate Faroese archiving and date filters</a>. Thanks to xet7.</summary>

- Translate 18 missing or English strings for archiving and date filters,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including date
  ranges and recency values. Faroese wording has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/034fbc494e8b812a7bd57e7e1898e823ad15df9f">Translate Faroese imports and board visibility</a>. Thanks to xet7.</summary>

- Translate 12 missing or English strings for filters, imports and board
  visibility, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including filter
  and todo.txt syntax. Faroese wording has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/553fb8a32ae1a792f9584d12c6286784e3eb061f">Translate Faroese rules and notifications</a>. Thanks to xet7.</summary>

- Translate 18 missing or English strings for rules and notifications,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including rule
  variables and trigger/action labels. Faroese wording has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/405b54c524d30e5152a706ae1233c1bb6604c9ba">Translate Faroese reminders and notification categories</a>. Thanks to xet7.</summary>

- Translate 16 reminder, notification, dependency and filter strings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including reminder
  bounds, dependency direction and URL variables. Faroese has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c23df19203b4fde2774f315e9d61e641fc8aa411">Translate Faroese saved filters and map view</a>. Thanks to xet7.</summary>

- Translate 19 saved-filter, import-warning and map-placement strings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  map and card labels and matching admin navigation. Faroese has lower
  confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/183c8f42bb0a7792b7fcaa18d57655a5f238de39">Translate Faroese keyboard and Scrum labels</a>. Thanks to xet7.</summary>

- Translate 37 keyboard and Scrum labels; recognize 13 unchanged terms for
  brands, math notation, Alt and the imperative set. Preserve translations.
- Translation, registry and human-preference checks pass, including key
  direction, replacement tokens and invariants. Faroese has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/229217ccb812e046f6db8cab52c1dbf6085c044d">Translate Faroese Scrum planning and reports</a>. Thanks to xet7.</summary>

- Translate 40 sprint-planning, event, state and report strings, preserving
  existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  sprint states and consistent backlog labels. Faroese has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84859eec67bd4a07dcefdac2786092bf9373c22d">Translate Faroese observations and sync conflicts</a>. Thanks to xet7.</summary>

- Translate 30 Scrum-observation, workflow and synchronization strings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including UTC,
  observation limits and action distinctions. Faroese has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01d388589b6349fe2250eb23f45881885f8ce7fc">Translate Faroese synchronization previews</a>. Thanks to xet7.</summary>

- Translate 25 synchronization strings, preserving existing translations
  and replacement tokens. Update the README coverage count to 126.
- Translation, registry and human-preference checks pass, including preview
  limits and action distinctions. Faroese has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a9a9df01d586ac1f7ecafcd617368e41b925fc7">Translate Faroese synchronization diagnostics</a>. Thanks to xet7.</summary>

- Translate 25 source-field report and synchronization diagnostic strings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including retention
  limits and distinct outcomes. Faroese wording has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/61eed7073721a34f0f9578ec1887e8e2e25879e0">Translate Faroese email queue controls</a>. Thanks to xet7.</summary>

- Translate 25 estimate and email-queue recovery strings, preserving
  existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including technical
  literals and distinct queue actions. Faroese wording has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ea4da07e16ffe2171d7c368a1d724271d6a5460">Translate Faroese delivery failures and activity recovery</a>. Thanks to xet7.</summary>

- Translate 25 delivery-failure, time-estimate and activity-recovery strings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including technical
  literals and recovery states. Faroese wording has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/42375a7951fb60aaed7ab140bce161c0b61a7aab">Translate Faroese notification recovery controls</a>. Thanks to xet7.</summary>

- Translate 20 notification-control and rule-email delivery strings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including matching
  controls and distinct delivery states. Faroese has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/789f65858ed67b17f57f15dbd539accedd32c464">Translate Faroese rule email recovery actions</a>. Thanks to xet7.</summary>

- Translate 20 rule-email recovery actions and confirmations, preserving
  existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  recovery actions and recipient states. Faroese has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eed78d1c4e944356e939a5efcf979ae044820804">Translate Faroese legacy email recovery</a>. Thanks to xet7.</summary>

- Translate 22 rule-email resolution and legacy-delivery recovery strings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  rebind and discard actions. Faroese wording has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/355748920b874f10e5259125f5a19e52c45d6527">Complete Faroese source-string coverage</a>. Thanks to xet7.</summary>

- Translate the final 13 recovery, login and history strings. Faroese now has
  all 3,783 source keys, with no untranslated prose flagged by the checker.
- Translation, registry and human-preference checks pass, including source
  order and replacement tokens. Faroese wording has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation and language-quality work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e4cb59501b075680793a62528b03c8cbadea39db">Translate Friulian date filters</a>. Thanks to xet7.</summary>

- Translate 18 date-filter and automatic-archive strings, preserving existing
  translations and replacement tokens.
- Translation, registry and human-preference checks pass, including numerical
  limits and range direction. Friulian wording has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ffac2e8622859357ebef799564391163915268a2">Translate Friulian imports and board visibility</a>. Thanks to xet7.</summary>

- Translate 12 import, list-age filter and board-visibility strings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including import
  syntax, URL schemes and HTML tags. Friulian has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b36ba3081f4251b06e21a2f1ea68a6b9d4ff2205">Translate Friulian rules and notifications</a>. Thanks to xet7.</summary>

- Translate 20 rule and notification strings, preserving existing
  translations, replacement tokens and rule variables.
- Translation, registry and human-preference checks pass, including distinct
  trigger, action and recipient labels. Friulian has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09509a6ea8fadf738a7f00f713c57ede03972649">Translate Friulian reminders and saved filters</a>. Thanks to xet7.</summary>

- Translate 22 notification, reminder, dependency and saved-filter strings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including template
  variables and reminder bounds. Friulian wording has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6dad31fc0a6848cc6164a8eaa1cd655bec83d3a6">Translate Friulian import reports and map view</a>. Thanks to xet7.</summary>

- Translate 11 import-report and map-view strings, preserving existing
  translations and replacement tokens.
- Translation, registry and human-preference checks pass, including matching
  admin navigation and distinct map actions. Friulian has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6dab1b0419d7256708b9a30ff232c05893ee1f7">Translate Friulian keyboard labels</a>. Thanks to xet7.</summary>

- Translate 15 keyboard labels and recognize 15 unchanged brands, symbols
  and Friulian terms. Preserve existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including keyboard
  directions and invariants. Friulian wording has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5970fd5d089338f4387dddbcc80207893901f989">Translate Friulian Scrum settings</a>. Thanks to xet7.</summary>

- Translate 30 Scrum planning labels, preserving existing translations and
  replacement tokens. Update the README coverage count to 127.
- Translation, registry and human-preference checks pass, including consistent
  backlog labels and distinct sprint actions. Friulian has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b3c74159f3f27581a356b5daa1b4ad2d3f92ff5">Translate Friulian sprint reports and events</a>. Thanks to xet7.</summary>

- Translate 30 sprint-report and event strings, preserving existing
  translations and replacement tokens.
- Translation, registry and human-preference checks pass, including report
  counts and distinct sprint states. Friulian wording has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/140789d355e2510fdd865821eac7d78fe9e30fe4">Translate Friulian sprint observations</a>. Thanks to xet7.</summary>

- Translate 25 workflow and observation strings, preserving existing
  translations and replacement tokens.
- Translation, registry and human-preference checks pass, including UTC,
  observation limits and confirmations. Friulian has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a838ae5c6fd6908b65aedb402c3e8055291caad5">Translate Friulian synchronization conflicts</a>. Thanks to xet7.</summary>

- Translate 25 synchronization conflict and preview strings, preserving
  existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  local/source choices and preview actions. Friulian has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2fa862597e9abe7c397dc15915d5d2134dd544bd">Translate Friulian synchronization reports</a>. Thanks to xet7.</summary>

- Translate 25 source-field and synchronization report strings, preserving
  existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including report
  limits and distinct outcomes. Friulian wording has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2eb25afbb5f14f3d846b8a0de4b449dacbc7adea">Translate Friulian diagnostics and email queue</a>. Thanks to xet7.</summary>

- Translate 18 diagnostic and email-queue strings, preserving existing
  translations and replacement tokens.
- Translation, registry and human-preference checks pass, including retention
  limits and technical literals. Friulian wording has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3ff2065557a3d7dbb0d46dc0f4cba9aa09a3ec2">Translate Friulian email controls and failures</a>. Thanks to xet7.</summary>

- Translate 25 email-queue, delivery-failure and time-estimate strings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  queue actions and SMTP failure types. Friulian has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ccc2d8b2d31605486978b126f6f0d90442025d22">Translate Friulian activity recovery</a>. Thanks to xet7.</summary>

- Translate 25 activity-recovery and time-estimate strings, preserving
  existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including matching
  delivery controls and distinct recovery states. Friulian has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/90b401a416d6da0a104b9e88fc527261a7ead2d6">Translate Friulian rule email delivery</a>. Thanks to xet7.</summary>

- Translate 25 notification-cancellation and rule-email recovery strings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  recovery actions and recipient states. Friulian has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84bd2b036996a81b2ce80de3543f53fc3eef4192">Translate Friulian legacy email recovery</a>. Thanks to xet7.</summary>

- Translate 22 email-resolution and legacy-recovery strings, preserving
  existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  recovery confirmations. Friulian wording has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a58ba9ecb71637a2708f9518ee9f1c25081388a5">Complete Friulian source-string coverage</a>. Thanks to xet7.</summary>

- Translate the final 17 recovery, login and history strings. Friulian has
  all 3,783 source keys, with no untranslated prose flagged by the checker.
- Translation, registry and human-preference checks pass, including source
  order and replacement tokens. Friulian wording has lower confidence.
  Fluent-speaker and browser review were not run.
  The wider translation and language-quality work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5a847db52ba5710454895f54b5d5baa60d2c76c">Translate Frisian date filters</a>. Thanks to xet7.</summary>

- Translate 18 date-filter and automatic-archive strings in each of fy and
  fy-NL, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including numerical
  limits and date-range direction.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8d8e07a3c7982a5f75f3ea9b8e675b2cd4ecff0">Translate Frisian imports and board visibility</a>. Thanks to xet7.</summary>

- Translate 12 import, list-age and board-visibility strings in each of fy
  and fy-NL, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including import
  syntax, URL schemes and HTML tags.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4dde2aa4ae2a2c384ecb009d497e043c9f67038c">Translate Frisian rules and notifications</a>. Thanks to xet7.</summary>

- Translate 20 rule and notification strings in each of fy and fy-NL,
  preserving existing translations, replacement tokens and rule variables.
- Translation, registry and human-preference checks pass, including distinct
  trigger, action and recipient labels.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b1151b404b12ac8db07e61228cb49244afe07c39">Translate Frisian reminders and saved filters</a>. Thanks to xet7.</summary>

- Translate 22 notification, reminder, dependency and saved-filter strings in
  each of fy and fy-NL, preserving translations and replacement tokens.
- Translation, registry and human-preference checks pass, including template
  variables, reminder bounds and distinct actions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aa147ab772b9591d9fac5dc4962102ad01d119b3">Translate Frisian import reports and map view</a>. Thanks to xet7.</summary>

- Translate 11 import-report and map-view strings in each of fy and fy-NL,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including matching
  admin navigation and distinct map actions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a92c1cda2f4615bcdc653708f31665a8714d844">Translate Frisian keyboard and editor labels</a>. Thanks to xet7.</summary>

- Translate 22 keyboard and editor labels in each of fy and fy-NL; recognize
  17 unchanged terms per locale. Preserve translations and replacement tokens.
- Translation, registry and human-preference checks pass, including keyboard
  directions and locale-specific invariants.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4f1d7293047d053ba3a226cb767464149601942">Translate Frisian Scrum settings</a>. Thanks to xet7.</summary>

- Translate 30 Scrum planning labels in each of fy and fy-NL, preserving
  existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including consistent
  backlog labels and distinct sprint actions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76991d28e8c83524d19bd87c181d6dd5331ec80d">Translate Frisian sprint reports and events</a>. Thanks to xet7.</summary>

- Translate 30 sprint-report and event strings in each of fy and fy-NL,
  preserving translations and tokens. Update the README coverage count to 129.
- Translation, registry and human-preference checks pass, including report
  placeholders and distinct sprint states.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1712cd766a3f2609f1e07e39bf79a5c6f393374c">Translate Frisian sprint observations</a>. Thanks to xet7.</summary>

- Translate 25 workflow and observation strings in each of fy and fy-NL,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including UTC,
  observation limits and distinct sprint confirmations.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e32f662f226840d0831433a192b9d805d2762f0">Translate Frisian synchronization conflicts</a>. Thanks to xet7.</summary>

- Translate 25 synchronization conflict and preview strings in each of fy
  and fy-NL, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  local/source choices and preview actions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4de131375a79459ed37ad3635b1faddefe7ca433">Translate Frisian synchronization reports</a>. Thanks to xet7.</summary>

- Translate 25 source-field and synchronization report strings in each of fy
  and fy-NL, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including report
  limits, consistent source labels and distinct outcomes.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9bd500cbc2c61b1f9632a6fc7ca227385f97b0f4">Translate Frisian diagnostics and email queue</a>. Thanks to xet7.</summary>

- Translate 18 diagnostic and email-queue strings in each of fy and fy-NL,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including retention
  limits and technical literals.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5043485ceae745388f3ea538fb0176de4442fdd">Translate Frisian email controls and failures</a>. Thanks to xet7.</summary>

- Translate 25 email-queue, delivery-failure and time-estimate strings in each
  of fy and fy-NL, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including distinct
  queue actions and SMTP failure types.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6a8ed00b952fc2957e3b14b4fb2e68fe5434730c">Translate Frisian activity recovery</a>. Thanks to xet7.</summary>

- Translate 25 activity-recovery and time-estimate strings in each of fy and
  fy-NL, preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including matching
  delivery controls and distinct recovery states.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/327ad7e9c3a8e4bf2be2e9285bb19ac53ece82e6">Complete Frisian recovery and history translations</a>. Thanks to xet7.</summary>

- Translate 64 recovery and history strings in each of fy and fy-NL,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including full
  source-key coverage, recovery warnings and distinct history actions.
  Fluent-speaker and browser review were not run.
  The wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/55dbf1f8031a8bcc51cf74619aafc122d9622cf3">Translate Romansh date filters and correct archive messages</a>. Thanks to xet7.</summary>

- Translate 30 date-filter, import and visibility strings; correct 16
  Italian or mixed-language archive messages in the Romansh locale.
- Translation, registry and human-preference checks pass, covering tokens,
  import syntax, date expressions and archive visibility warnings.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run.
  The wider translation and wrong-language cleanup remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf3a7f950c6bf959bcad828f13414e125ec46187">Translate Romansh rules, reminders and saved filters</a>. Thanks to xet7.</summary>

- Translate 42 rule, notification, reminder and saved-filter strings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, including rule
  variables, reminder timing and limits, and dependency direction.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f7eb39c8209494af809121ad333ae964559a72cc">Translate Romansh maps, imports and keyboard controls</a>. Thanks to xet7.</summary>

- Translate 27 map, import and keyboard strings and correct three report
  navigation labels. Recognize the shared Romansh word Problems.
- Translation, registry and human-preference checks pass, including tokens,
  report navigation, keyboard direction and map placement states.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/00d4abe5e2e23f21e81dded0b35c7c3b18323581">Translate Romansh Scrum planning settings</a>. Thanks to xet7.</summary>

- Translate 46 planning, sprint, backlog and event strings, preserving
  existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, covering shared
  labels, distinct sprint actions, completion policies and timebox units.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66cc677385003a71471a2f377ddf2af4e32423c7">Translate Romansh sprint reports and lifecycle messages</a>. Thanks to xet7.</summary>

- Translate 31 report, state and confirmation strings, preserving existing
  translations and replacement tokens.
- Translation, registry and human-preference checks pass, including unknown
  estimates, report limits, comparable units and unfinished-card handling.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a3d6a31f06c4804db8bde0368166a1d9ad86817">Translate Romansh observations and synchronization conflicts</a>. Thanks to xet7.</summary>

- Translate 25 observation and synchronization strings, preserving existing
  translations and replacement tokens.
- Translation, registry and human-preference checks pass, covering UTC days,
  unknown estimates, export scope and retention of local cards and subcards.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bfd0604e2c5adc76ffde24849d91388a080ec18a">Translate Romansh synchronization previews and reports</a>. Thanks to xet7.</summary>

- Translate 30 preview and report strings. Update the README coverage count
  to 130; the threshold does not establish full translation quality.
- Translation, registry and human-preference checks pass, covering tokens,
  report limits, retention, omitted values and partial-run warnings.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1072865e8ae46fd5b4444f7db2095bad3a14ab8">Translate Romansh diagnostics and email queue messages</a>. Thanks to xet7.</summary>

- Translate 25 diagnostic and email-delivery strings, preserving existing
  translations and replacement tokens.
- Translation, registry and human-preference checks pass, covering report
  limits, null estimates, uncertain delivery and retries during a pause.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb58da9097e6285e5627760f877c95be3a460d9a">Translate Romansh email failures and activity recovery</a>. Thanks to xet7.</summary>

- Translate 25 delivery-failure, estimate and activity-recovery strings,
  preserving existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, covering permanent
  cancellation, future messages, SMTP failure types and notification retries.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5636c0aeef2f0d4b55ccef91a0a5ffab134752e4">Translate Romansh activity recovery controls</a>. Thanks to xet7.</summary>

- Translate 25 activity-recovery and rule-email strings, preserving existing
  translations and replacement tokens.
- Translation, registry and human-preference checks pass, covering distinct
  states, pause and resume labels, and irreversible cancellation warnings.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f25e2ca17ecb00bbaf83fc275f9b6657c88be327">Translate Romansh rule email recovery actions</a>. Thanks to xet7.</summary>

- Translate 25 rule-email recovery strings, preserving existing translations
  and replacement tokens.
- Translation, registry and human-preference checks pass, covering recipient
  states, distinct actions, resend scope and duplicate-delivery warnings.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/413e35afbcfec533e405737cb21b8aa33182f903">Translate Romansh legacy email review messages</a>. Thanks to xet7.</summary>

- Translate 25 email-resolution and legacy-review strings, preserving
  existing translations and replacement tokens.
- Translation, registry and human-preference checks pass, covering delivery
  uncertainty, access checks and permanent discard warnings.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/51d0005cd3424fc327826a049e2c2311c93c5a8e">Complete Romansh source-key translation coverage</a>. Thanks to xet7.</summary>

- Translate 13 recovery, history and Blockly strings; recognize 21 additional
  shared words, brands and mathematical symbols.
- Translation, registry and human-preference checks pass, including all 3783
  source keys and tokens. Older Italian and mixed-language values still need
  correction; source coverage does not establish language quality.
- Low-confidence wording needs fluent-speaker review. Browser review was not
  run; wider translation work remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a1888873771c6ebf0009c4669c1511a031c352f8">Correct mixed-language Romansh board and deletion messages</a>. Thanks to xet7.</summary>

- Replace 31 Italian or mixed-language board, membership, display and
  deletion strings with Romansh, preserving other translations and tokens.
- Translation, registry and human-preference checks pass, covering native
  vocabulary, shared labels and permanent-deletion warnings.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7db0ac8404ebbaf1d4f07b4930908504caf4971">Correct mixed-language Romansh card and list messages</a>. Thanks to xet7.</summary>

- Replace 30 Italian or mixed-language card, date, list, swimlane and
  settings strings with Romansh, preserving other translations and tokens.
- Translation, registry and human-preference checks pass, covering native
  vocabulary and irreversible deletion warnings.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1851a42f87447ebaf9e37a30bfdc1b69d7677de7">Correct mixed-language Romansh import and template messages</a>. Thanks to xet7.</summary>

- Replace 31 mixed-language import, upload, template and loading strings
  with Romansh, preserving other translations and replacement tokens.
- Translation, registry and human-preference checks pass, covering the
  data-loss warning, shared template labels and import format names.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/39acf7d682e03814628dc7875d10641102088b4b">Correct mixed-language Romansh sharing and sorting messages</a>. Thanks to xet7.</summary>

- Replace 24 mixed-language sharing, subtask, sorting and import strings
  with Romansh, preserving other translations and replacement tokens.
- Translation, registry and human-preference checks pass, covering shared
  labels, avatar defaults, template visibility and JSON/CSV format names.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/227c620c4bdf2cb29f1aebf767d319127e212f33">Correct mixed-language Romansh status and maintenance messages</a>. Thanks to xet7.</summary>

- Replace 20 mixed-language status, maintenance, storage and import strings
  with Romansh, preserving other translations and replacement tokens.
- Translation, registry and human-preference checks pass, covering shared
  labels, team membership guards, problem counts and technical names.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b738c51bf3b49d678e14f24c2099999c5d5dfbde">Correct mixed-language Romansh user and editing messages</a>. Thanks to xet7.</summary>

- Replace 20 mixed-language user, editing and permission strings with
  Romansh, preserving other translations and replacement tokens.
- Translation, registry and human-preference checks pass, covering shared
  labels, Home removal, imported-member permissions and card-link limits.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8faf609057a913efd17d9217719a800a8ae3b52">Correct mixed-language Romansh access and rule messages</a>. Thanks to xet7.</summary>

- Replace 20 mixed-language access, import and rule strings with Romansh,
  preserving other translations and replacement tokens.
- Translation, registry and human-preference checks pass, covering public
  editing, member removal, account deletion and technical identifiers.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af82db71852c7dee1dc15d5c292f79206d3c176b">Correct Romansh settings descriptions and stale loading text</a>. Thanks to xet7.</summary>

- Replace 16 mixed-language settings and status strings with Romansh,
  including the current automatic card-loading description.
- Translation, registry and human-preference checks pass, covering tokens,
  configuration identifiers, privacy wording and migration paths.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32782227d8ec1aa32e88a79a0b97057ad52cf848">Correct Romansh backup paths and mixed-language warnings</a>. Thanks to xet7.</summary>

- Replace 17 mixed-language backup, settings and deletion strings with
  Romansh. Restore exact backup directory patterns from English.
- Translation, registry and human-preference checks pass, covering tokens,
  backup paths, deletion warnings and aging levels.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/774c2ef5c78ca4e3f457ee880afec906ecb8a4fb">Correct Romansh confirmations and irreversible deletion warnings</a>. Thanks to xet7.</summary>

- Replace 20 mixed-language confirmation and status strings with Romansh.
  Correct warnings to say deletion cannot be undone, not interrupted.
- Translation, registry and human-preference checks pass, covering tokens,
  irreversible deletion, duplicate-list conditions and removal scope.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/824d7090bcb6692a0fcfa6ad5dac950fcb2dc9ed">Restore complete Romansh flow explanations and correct status text</a>. Thanks to xet7.</summary>

- Correct 12 language and meaning errors, including five chart explanations
  that omitted conditions from the English source.
- Translation, registry and human-preference checks pass, covering tokens,
  forecast limits, missing data, thresholds and technical names.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60419cd0b14f7f8df538185aace29d118935ef5c">Correct Romansh filter instructions and import messages</a>. Thanks to xet7.</summary>

- Replace 20 mixed-language filter, import, display and settings strings
  with Romansh. Restore exact filter examples and escaping.
- Translation, registry and human-preference checks pass, covering tokens,
  filter syntax, shared labels and technical identifiers.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/81df03fcdf3bdda03c136b0a8315f0aca956d982">Correct Romansh search, checklist and permission messages</a>. Thanks to xet7.</summary>

- Replace 15 mixed-language search, checklist, permission and attachment
  strings with Romansh, preserving other translations and tokens.
- Translation, registry and human-preference checks pass, covering search
  examples, global-admin rights, checklist order and storage names.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ace4c2395023be3817c56c4b52f8a646a0236d1">Correct Romansh storage, checklist and access messages</a>. Thanks to xet7.</summary>

- Replace 12 mixed-language storage, checklist and access strings with
  Romansh, preserving other translations and replacement tokens.
- Translation, registry and human-preference checks pass, covering
  compaction timing, file formats, shared labels and signed-in access.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2d342aa00cfa55735f9874f4aecf95be5caa8e7">Correct Romansh cloud storage and migration instructions</a>. Thanks to xet7.</summary>

- Replace 12 mixed-language cloud, avatar and migration strings with
  Romansh. Restore client_email and external navigation labels.
- Translation, registry and human-preference checks pass, covering tokens,
  avatar exclusions, migration field names and storage navigation.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09a8c1dcc4c2e763bb6414b6f432b0a460f0e695">Correct Romansh privacy and migration descriptions</a>. Thanks to xet7.</summary>

- Correct 18 language and meaning errors, including the wrong export text
  previously shown in the account-anonymization confirmation.
- Translation, registry and human-preference checks pass, covering tokens,
  irreversible anonymization, retained history and import/export limits.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eaad52af2936b00224793d8a011020ae03259431">Correct Romansh board view, role and import messages</a>. Thanks to xet7.</summary>

- Replace 23 mixed-language board-view, role and import strings with
  Romansh, preserving other translations and replacement tokens.
- Translation, registry and human-preference checks pass, covering role
  restrictions, opposite star actions and Kanboard/Deck field names.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/25eab73d5c659bcd5c57901e55fb3ec02f4af330">Correct Romansh import and list action translations</a>. Thanks to xet7.</summary>

- Replace 16 mixed-language import, list and permission strings with
  Romansh, preserving other translations and replacement tokens.
- Translation, registry and human-preference checks pass, covering API
  paths, JSON fields, archive navigation and irreversible label deletion.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e00890a4c8d7af7abeea7d1751a419f37b48e836">Correct Romansh notification and board visibility messages</a>. Thanks to xet7.</summary>

- Replace 20 mixed-language notification, visibility and board strings with
  Romansh, preserving other translations and replacement tokens.
- Translation, registry and human-preference checks pass, covering private
  visibility, card scope, irreversible deletion and Butler import limits.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/289e618181cee268954f7c1e56b6302530dff7b2">Correct Romansh search operators and card view labels</a>. Thanks to xet7.</summary>

- Replace 16 mixed-language search and view strings with Romansh,
  preserving other translations and replacement tokens.
- Translation, registry and human-preference checks pass, covering exact
  operator syntax, shared labels and incomplete due-card visibility.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8aef9012b385954da11e89d3efa4c49543f62904">Correct Romansh search help and report labels</a>. Thanks to xet7.</summary>

- Correct 14 mixed-language search instructions, visibility predicates,
  report titles and login labels, preserving search examples and tokens.
- Translation, registry and human-preference checks pass, covering search
  operators, archive defaults and public/private distinctions.
  Low-confidence wording needs fluent-speaker review.
  Browser review was not run; wider language cleanup remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe2577cf5fcd0b0e8a90ea6db6f79e74d3ffdfc1">Translate new import and email recovery strings into Marathi</a>. Thanks to xet7.</summary>

- Fill 44 missing Marathi strings for todo.txt imports and rule-email recovery,
  preserving existing translations, placeholders and import syntax.
- Translation, registry and human-preference checks pass, covering uncertain
  delivery, duplicate delivery warnings and legacy email review actions.
  Existing Marathi translations remain unchanged.
  Browser and fluent-speaker review were not run; translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1c2618d4e4184edc132bdd675c4992bf550b8f9">Translate import and email recovery additions into Malayalam and Telugu</a>. Thanks to xet7.</summary>

- Fill 44 missing strings in each locale for todo.txt imports and rule-email
  recovery, preserving existing translations, placeholders and import syntax.
- Translation, registry and human-preference checks pass, covering uncertain
  delivery, duplicate delivery warnings and legacy email review actions.
  Existing Malayalam and Telugu translations remain unchanged.
  Browser and fluent-speaker review were not run; translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3381d5dff76cfb5d056a7f2c615b72de837100a">Translate import and email recovery additions into Kazakh and Mongolian</a>. Thanks to xet7.</summary>

- Fill 44 missing strings in each locale for todo.txt imports and rule-email
  recovery, preserving existing translations, placeholders and import syntax.
- Translation, registry and human-preference checks pass, covering uncertain
  delivery, duplicate delivery warnings and legacy email review actions.
  Existing Kazakh and Mongolian translations remain unchanged.
  Browser and fluent-speaker review were not run; translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d6f03d6c5c057a83eb1368f1e9a4eab847aa9ef7">Translate import and email recovery additions into Punjabi and Odia</a>. Thanks to xet7.</summary>

- Fill 44 missing strings in each locale for todo.txt imports and rule-email
  recovery, preserving existing translations, placeholders and import syntax.
- Translation, registry and human-preference checks pass, covering uncertain
  delivery, duplicate delivery warnings and legacy email review actions.
  Existing Punjabi and Odia translations remain unchanged.
  Browser and fluent-speaker review were not run; translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a879f8c36dfdccd8f85d2cea8ef6f53c245e56d">Translate import and email recovery additions into Javanese</a>. Thanks to xet7.</summary>

- Fill 44 missing Javanese strings for todo.txt imports and rule-email recovery,
  preserving existing translations, placeholders and import syntax.
- Translation, registry and human-preference checks pass, covering uncertain
  delivery, duplicate delivery warnings and legacy email review actions.
  Existing Javanese translations remain unchanged.
  Browser and fluent-speaker review were not run; translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0ed44da87d187c9466b6ad5c08a65a83511e5c65">Translate import and email recovery additions into Haitian Creole</a>. Thanks to xet7.</summary>

- Fill 44 missing Haitian Creole strings for todo.txt imports and rule-email
  recovery, preserving existing translations, placeholders and import syntax.
- Translation, registry and human-preference checks pass, covering uncertain
  delivery, duplicate delivery warnings and legacy email review actions.
  Existing Haitian Creole translations remain unchanged.
  Browser and fluent-speaker review were not run; translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/993eb724e25cd05dd976e93ed222ed3012c029d5">Translate import and email recovery additions into Somali</a>. Thanks to xet7.</summary>

- Fill 44 missing Somali strings for todo.txt imports and rule-email recovery,
  preserving existing translations, placeholders and import syntax.
- Translation, registry and human-preference checks pass, covering uncertain
  delivery, duplicate delivery warnings and legacy email review actions.
  Existing Somali translations remain unchanged.
  Browser and fluent-speaker review were not run; translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5abba407384d64fbaa615c37fc5c825adf8f7a96">Translate import and email recovery additions into Tajik</a>. Thanks to xet7.</summary>

- Fill 44 missing Tajik strings for todo.txt imports and rule-email recovery,
  preserving existing translations, placeholders and import syntax.
- Translation, registry and human-preference checks pass, covering uncertain
  delivery, duplicate delivery warnings and legacy email review actions.
  Existing Tajik translations remain unchanged.
  Browser and fluent-speaker review were not run; translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b1a8ed59877c59552b7611a9ac93589b38b1ec73">Translate import and email recovery additions into Kyrgyz</a>. Thanks to xet7.</summary>

- Fill 44 missing Kyrgyz strings for todo.txt imports and rule-email recovery,
  preserving existing translations, placeholders and import syntax.
- Translation, registry and human-preference checks pass, covering uncertain
  delivery, duplicate delivery warnings and legacy email review actions.
  Existing Kyrgyz translations remain unchanged.
  Browser and fluent-speaker review were not run; translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a9a3789b747b7cd54a71f397f4f8add9def0197">Translate import and email recovery additions into Turkmen</a>. Thanks to xet7.</summary>

- Fill 44 missing Turkmen strings for todo.txt imports and rule-email recovery,
  preserving existing translations, placeholders and import syntax.
- Translation, registry and human-preference checks pass, covering uncertain
  delivery, duplicate delivery warnings and legacy email review actions.
  Lower-confidence Turkmen wording needs fluent-speaker review.
  Browser review was not run; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d229d0ef116d1b6a3a967cee3c583da8132ca349">Translate import and email recovery additions into Malagasy</a>. Thanks to xet7.</summary>

- Fill 44 missing Malagasy strings for todo.txt imports and rule-email recovery,
  preserving existing translations, placeholders and import syntax.
- Translation, registry and human-preference checks pass, covering uncertain
  delivery, duplicate delivery warnings and legacy email review actions.
  Existing Malagasy translations remain unchanged.
  Browser and fluent-speaker review were not run; translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd5434ab0777d1735967102205ef0e307672e0e3">Translate import and email recovery additions into Hausa</a>. Thanks to xet7.</summary>

- Fill 44 missing Hausa strings for todo.txt imports and rule-email recovery,
  preserving existing translations, placeholders and import syntax.
- Translation, registry and human-preference checks pass, covering uncertain
  delivery, duplicate delivery warnings and legacy email review actions.
  Existing Hausa translations remain unchanged.
  Browser and fluent-speaker review were not run; translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/000787ca86c9864ca8d10acd38c53277640b669f">Translate import and email recovery additions into Igbo</a>. Thanks to xet7.</summary>

- Fill 44 missing Igbo strings for todo.txt imports and rule-email recovery,
  preserving existing translations, placeholders and import syntax.
- Translation, registry and human-preference checks pass, covering uncertain
  delivery, duplicate delivery warnings and legacy email review actions.
  Existing Igbo translations remain unchanged.
  Browser and fluent-speaker review were not run; translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4812611615f11af78501b5f9a69c6d50f1fd7fae">Translate import and email recovery additions into Yoruba</a>. Thanks to xet7.</summary>

- Fill 44 missing Yoruba strings for todo.txt imports and rule-email recovery,
  preserving existing translations, placeholders and import syntax.
- Translation, registry and human-preference checks pass, covering uncertain
  delivery, duplicate delivery warnings and legacy email review actions.
  Lower-confidence Yoruba wording needs fluent-speaker review.
  Browser review was not run; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b056d4be349cd268c01d8294fdcfdcb5b878acb6">Translate import and email recovery additions into Shona</a>. Thanks to xet7.</summary>

- Fill 44 missing Shona strings for todo.txt imports and rule-email recovery,
  preserving placeholders and import syntax. All existing values remain intact.
- Translation, registry and human-preference checks pass, covering uncertain
  delivery, duplicate delivery warnings and legacy email review actions.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Audit found 648 older prefixed English entries still needing replacement.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58357ab5da3bdadb124aff90386a5c59018fb8a7">Replace prefixed English in Shona board and display controls</a>. Thanks to xet7.</summary>

- Translate 54 prefixed English entries and restore 11 numbers, symbols and
  names. Preserve existing values outside this correction batch.
- Translation, registry and human-preference checks pass, covering voting,
  font sizes, zoom limits and exact placeholders.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Another 583 prefixed English entries remain; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/43dccd2fb9e354b6b7613633cef4bdcd6fc2b721">Correct Shona colors fields and invitation labels</a>. Thanks to xet7.</summary>

- Translate 42 prefixed English entries and restore three literal date formats.
  Preserve existing values outside this correction batch.
- Translation, registry and human-preference checks pass, covering distinct
  color choices, date formats, invitation tokens and warning-only work limits.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Another 538 prefixed English entries remain; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/013ab07ff1eea9069824ebd4a7d1783570b9c195">Correct Shona export and selection controls</a>. Thanks to xet7.</summary>

- Translate 32 prefixed English entries and restore three sort labels.
  Preserve existing values outside this correction batch.
- Translation, registry and human-preference checks pass, covering preview
  labels, import tokens, selection controls and exact placeholders.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Another 503 prefixed English entries remain; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/75e47e817a505d05c349e958ac103aaeff65f693">Correct Shona settings and mail labels</a>. Thanks to xet7.</summary>

- Translate 38 prefixed English entries and restore two storage abbreviations.
  Preserve existing values outside this correction batch.
- Translation, registry and human-preference checks pass, covering invitation
  tokens, upload limits, logo links and protocol names.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Another 463 prefixed English entries remain; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/adb21570c633c8d61fa6e77bc56b90488b8a8be4">Correct Shona system information and sharing labels</a>. Thanks to xet7.</summary>

- Translate 38 prefixed English entries and restore two product names.
  Preserve existing values outside this correction batch.
- Translation, registry and human-preference checks pass, covering configuration
  identifiers, shared labels and free versus total memory.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Another 423 prefixed English entries remain; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/38415f04caf9a3536fe8faaca0cda9b8aa38cf57">Correct Shona rule and schedule controls</a>. Thanks to xet7.</summary>

- Translate 40 prefixed English entries for rules, schedules and checklists.
  Preserve existing values outside this correction batch.
- Translation, registry and human-preference checks pass, covering weekday
  ranges, checked versus unchecked actions, examples and placeholders.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Another 383 prefixed English entries remain; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ad749158d0f89ff21c212eb633a5ec973dc90ad">Correct Shona weekdays layout and reminder labels</a>. Thanks to xet7.</summary>

- Translate 30 prefixed English entries and restore ten protocol/syntax tokens.
  Preserve existing values outside this correction batch.
- Translation, registry and human-preference checks pass, covering weekdays,
  reminder placeholders, configuration formats and shared labels.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Another 343 prefixed English entries remain; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7394764008fe99e65c8eff02d64e56a6735f0b8f">Correct Shona search and dependency labels</a>. Thanks to xet7.</summary>

- Translate 37 prefixed English entries and restore three abbreviations/names.
  Preserve existing values outside this correction batch.
- Translation, registry and human-preference checks pass, covering search
  tokens, syntax examples, dependency actions and placeholders.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Another 303 prefixed English entries remain; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4d904f1dcaffe2f79fdcbc3f6e7d3257d606b58">Correct Shona map and report labels</a>. Thanks to xet7.</summary>

- Translate 37 prefixed English entries and restore three abbreviations.
  Preserve existing values outside this correction batch.
- Translation, registry and human-preference checks pass, covering format
  placeholders, shared report labels and distinct waiting indicators.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Another 263 prefixed English entries remain; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4824d28d6f7e610afbdcf7d768a0ac5ed4781578">Correct Shona memory storage and request labels</a>. Thanks to xet7.</summary>

- Translate 37 prefixed English entries and restore three storage names.
  Preserve existing values outside this correction batch.
- Translation, registry and human-preference checks pass, covering memory
  measurements, transfer directions, request states and placeholders.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Another 223 prefixed English entries remain; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8290dd2b94fc4336a719f5592fde8c9bf5171537">Correct Shona maintenance and support labels</a>. Thanks to xet7.</summary>

- Translate 37 prefixed English entries and restore three technical names.
  Preserve existing values outside this correction batch.
- Translation, registry and human-preference checks pass, covering lockout
  timing, scheduled job states, warnings versus errors and placeholders.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Another 183 prefixed English entries remain; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/08f01483a9b97719af56c7f10d2b2dc2e287c229">Correct Shona backup and cloud labels</a>. Thanks to xet7.</summary>

- Translate 34 prefixed English entries and restore six service names.
  Preserve existing values outside this correction batch.
- Translation, registry and human-preference checks pass, covering backup
  schedules, connection results, migration actions and placeholders.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Another 143 prefixed English entries remain; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6fab1c0a349b822dba4949ec0f7752ab1fbd0202">Correct Shona migration and S3 labels</a>. Thanks to xet7.</summary>

- Translate 40 prefixed English entries for migrations and S3 storage.
  Preserve existing values outside this correction batch.
- Translation, registry and human-preference checks pass, covering migration
  states, key labels, region examples, service names and placeholders.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Another 103 prefixed English entries remain; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64661794a57496bf0048af6f43507985ff1e6178">Correct Shona migration monitoring labels</a>. Thanks to xet7.</summary>

- Translate 39 prefixed English entries and restore the GridFS name.
  Preserve existing values outside this correction batch.
- Translation, registry and human-preference checks pass, covering migration
  actions, CPU thresholds, time units and placeholders.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Another 63 prefixed English entries remain; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/866498662dac67b4fa4b21f2024b6a19d779414a">Remove remaining prefixed English from Shona translations</a>. Thanks to xet7.</summary>

- Translate 61 remaining prefixed entries and restore S3 and Cron names.
  Add a whole-file guard against English disguised with a Shona prefix.
- Translation, registry and human-preference checks pass, covering report
  explanations, forecast limits, shared labels and placeholders.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Ordinary English placeholders remain; wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2619510fd692368ba7953ebaa306585bc9e32da5">Translate Shona date filters and Leo import instructions</a>. Thanks to xet7.</summary>

- Fill 25 English placeholders for date filters, archiving and Leo imports.
  Preserve existing translations outside this batch.
- Translation, registry and human-preference checks pass, covering query
  syntax, inclusive date boundaries, list age and archive exclusions.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/10dd427801a7ae92f6cefb4df4f7a5f90258386d">Translate Shona access rules and notification preferences</a>. Thanks to xet7.</summary>

- Fill 25 English placeholders for access, rules and notification preferences.
  Preserve existing translations outside this batch.
- Translation, registry and human-preference checks pass, covering access
  restrictions, rule variables, link schemes and notification exceptions.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a68d4fe6f659038b4550decd8f3eb14c8d69a14">Translate Shona reminders filters and import reports</a>. Thanks to xet7.</summary>

- Fill 25 English placeholders for reminders, saved filters and import reports.
  Preserve existing translations outside this batch.
- Translation, registry and human-preference checks pass, covering reminder
  offsets, template expressions, filter privacy and partial import warnings.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9a0df359a2a3d96089674d034366ffe256c3a670">Translate Shona map and Blockly accessibility instructions</a>. Thanks to xet7.</summary>

- Fill 24 English placeholders for maps and Blockly accessibility instructions.
  Preserve existing translations and the Alt key name.
- Translation, registry and human-preference checks pass, covering map
  placement choices, movement directions and exact positional tokens.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f1e1e95e878e29dd7e91c841ea47bdf75a0b6d5">Translate Shona Blockly field and accessibility labels</a>. Thanks to xet7.</summary>

- Fill 24 English placeholders for Blockly fields and accessible controls.
  Preserve existing translations and keyboard names.
- Translation, registry and human-preference checks pass, covering field
  types, add/remove actions, collapsed comments and positional tokens.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c56de6f29cec29158fa170494aa041b6638bf31">Translate Shona Blockly descriptions and warnings</a>. Thanks to xet7.</summary>

- Fill 24 English placeholders for Blockly descriptions and warnings.
  Preserve existing translations and keyboard/operating-system names.
- Translation, registry and human-preference checks pass, covering block
  descriptions, deletion restrictions, blending ranges and positional tokens.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be721542da7064816b4a6db809f6be3a2be5f821">Translate Shona Blockly color selection and control flow</a>. Thanks to xet7.</summary>

- Translate 24 color selection, loop and conditional strings, preserving
  keyboard names, substitution tokens and RGB bounds.
- Translation, registry and human-preference checks pass, covering tokens,
  distinct controls and numeric bounds.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc780927f16578d0f25b0d4debf5dfb74521b68a">Translate Shona Blockly loops and editing controls</a>. Thanks to xet7.</summary>

- Translate 45 conditional, loop, editing and bitmap accessibility strings,
  preserving keyboard names and substitution tokens.
- Translation, registry and human-preference checks pass, covering tokens,
  loop conditions and distinct editing controls.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85de10d5658b186f0eb8977815c2155f40a2563a">Translate Shona Blockly accessible input labels</a>. Thanks to xet7.</summary>

- Translate 50 condition, list, number and text input labels, preserving
  substitution tokens and coordinate names.
- Translation, registry and human-preference checks pass, covering tokens,
  arithmetic roles and distinct start, end, minimum and maximum labels.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c9dc8a59132175d1869ebb43aeeff21fc99303b8">Translate Shona Blockly navigation and list retrieval</a>. Thanks to xet7.</summary>

- Translate 33 keyboard navigation and list operation strings, preserving
  keyboard names, operating system names and substitution tokens.
- Translation, registry and human-preference checks pass, covering tokens,
  empty lists and distinctions between retrieval and removal.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/caee57c6d44ff7e291620b3735d72860bb72d5ab">Translate Shona Blockly list editing operations</a>. Thanks to xet7.</summary>

- Translate 36 list slicing, removal, insertion and sorting strings,
  preserving substitution tokens and descriptions of copied lists.
- Translation, registry and human-preference checks pass, covering tokens,
  copy semantics and distinct insertion, replacement and removal labels.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e08346f35749ca48a48e89db043dbecf258e0e8b">Translate Shona Blockly sorting and Boolean comparisons</a>. Thanks to xet7.</summary>

- Translate 29 sorting, list conversion and Boolean comparison strings,
  preserving substitution tokens and the programming value null.
- Translation, registry and human-preference checks pass, covering tokens,
  comparison operators, negation and descriptions of copied lists.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/65316d8a206b1d5b15eeb04f2fdfb85235a8c3e2">Translate Shona Blockly logic and arithmetic</a>. Thanks to xet7.</summary>

- Translate 29 logic selection and arithmetic strings, preserving
  substitution tokens, mathematical constants and inclusive bounds.
- Translation, registry and human-preference checks pass, covering tokens,
  true and false branches, angle ranges and mathematical notation.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5355c537bab44a1a07bd6c4693e6faf1e90ac894">Translate Shona Blockly statistics and random values</a>. Thanks to xet7.</summary>

- Translate 30 number property, statistics and random value strings,
  preserving substitution tokens and inclusive or exclusive bounds.
- Translation, registry and human-preference checks pass, covering tokens,
  distinct statistical measures and random value limits.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cae23801d961ccd5fb3be68d2527eec3cb66a01b">Translate Shona Blockly rounding and mathematical functions</a>. Thanks to xet7.</summary>

- Translate 28 rounding and mathematical function strings with descriptive
  wording, preserving function notation and substitution tokens.
- Translation, registry and human-preference checks pass, covering tokens,
  rounding directions, logarithm bases and inverse function labels.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c17c9ef6033e46932581bd3f490d3e561708065">Translate Shona Blockly variables and procedures</a>. Thanks to xet7.</summary>

- Translate 28 workspace, variable, procedure and angle instruction strings,
  preserving substitution tokens and keyboard names.
- Translation, registry and human-preference checks pass, covering tokens,
  degree units, variable types and function return behavior.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2cf38f4bb66ff0ac0adc4622c6b7f0c098f2061c">Translate Shona Blockly procedure and accessibility controls</a>. Thanks to xet7.</summary>

- Translate 32 procedure editing and accessibility strings, preserving
  substitution tokens and distinct screen reader, movement and focus actions.
- Translation, registry and human-preference checks pass, covering tokens,
  screen reader states, function return behavior and navigation targets.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45a30f891f954711a33b0297de90e8aff22726e6">Translate Shona Blockly directional shortcuts</a>. Thanks to xet7.</summary>

- Translate 30 directional navigation and text operation strings,
  preserving substitution tokens and keyboard names.
- Translation, registry and human-preference checks pass, covering tokens,
  navigation directions, previous and next targets, and title case.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d2f87f6f4d9194e27c08aa5657ef0eae31c91da">Translate Shona Blockly character and substring operations</a>. Thanks to xet7.</summary>

- Translate 31 character lookup, substring, joining and letter case strings,
  preserving substitution tokens and indexing directions.
- Translation, registry and human-preference checks pass, covering tokens,
  first and last occurrences, copied text and missing search results.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/33d380b83694858c6f2825455ed0cf5af7b10e4b">Translate Shona Blockly text output and variable validation</a>. Thanks to xet7.</summary>

- Translate 34 text output, trimming, variable and workspace strings,
  preserving substitution tokens and whitespace handling descriptions.
- Translation, registry and human-preference checks pass, covering tokens,
  trim directions, prompt types and distinct variable conflict messages.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/007b456f0305e45b511d5778aae57b969f660fb9">Translate Shona Blockly workspace search and shared labels</a>. Thanks to xet7.</summary>

- Translate 30 workspace search and shared block labels, preserving
  substitution tokens, keyboard shortcuts and announcement spacing.
- Translation, registry and human-preference checks pass, covering tokens,
  search directions, composed announcements and consistent shared labels.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/83409119ee2a4cab8c9c8a7735ae1f998513a96c">Translate Shona rule validation and Scrum planning labels</a>. Thanks to xet7.</summary>

- Translate 24 rule editor and Scrum planning strings, preserving
  permission requirements, conflict recovery instructions and planning roles.
- Translation, registry and human-preference checks pass, covering tokens,
  rule validation, saved states and distinct estimate source and unit labels.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85636f406b94bf52a8adae1b8b9f106d356877d9">Translate Shona sprint lifecycle and backlog labels</a>. Thanks to xet7.</summary>

- Translate 30 sprint, backlog and event labels. Update the README count to
  131 locales above its 90 percent source coverage threshold.
- Translation, registry and human-preference checks pass, covering tokens,
  sprint actions, unfinished work, time units and consistent terminology.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0598a04cc01d84ea78344c69aa713126183ccff">Translate Shona Scrum reports and sprint states</a>. Thanks to xet7.</summary>

- Translate 30 Scrum report and sprint state strings, preserving
  substitution tokens, unknown estimates and partial report limitations.
- Translation, registry and human-preference checks pass, covering tokens,
  sprint states, retained membership and unfinished card destinations.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/103dbd488953546f5246071b366dff71b2435614">Translate Shona daily observations and sync conflicts</a>. Thanks to xet7.</summary>

- Translate 28 daily observation and sync conflict strings, preserving
  observation limits, local content guarantees and unchanged subcards.
- Translation, registry and human-preference checks pass, covering tokens,
  UTC days, unknown estimates, retained content and replacement reuse.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06eed149a8d9bad1624e767a27ed62aa53fed119">Translate Shona sync previews and run reports</a>. Thanks to xet7.</summary>

- Translate 27 sync preview and report strings, preserving report limits,
  retention periods, hidden values and partial run limitations.
- Translation, registry and human-preference checks pass, covering tokens,
  numeric limits, distinct actions and consistent omission labels.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6214db69679fd89cd2c55c6fa3cc24c8c41e776e">Translate Shona sync diagnostics and email queue controls</a>. Thanks to xet7.</summary>

- Translate 32 sync diagnostic and email queue strings, preserving
  null semantics, queue controls and delivery limitations.
- Translation, registry and human-preference checks pass, covering tokens,
  retention, paused retries, uncertain delivery and superseded requests.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8960f2806dcc30f790f13bf592251546c2cd669">Translate Shona delivery failures and activity recovery</a>. Thanks to xet7.</summary>

- Translate 25 delivery recovery and time estimate strings, preserving
  cancellation boundaries, failure reasons and retry limitations.
- Translation, registry and human-preference checks pass, covering tokens,
  null values, estimate fields and distinct notification delivery states.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd4d26b6a4f0fc7d4fd35c9b32bc20e1938ca38a">Translate Shona activity and rule email recovery</a>. Thanks to xet7.</summary>

- Translate 27 activity recovery and rule email report strings, preserving
  cancellation limits, retained work and mail-server acceptance wording.
- Translation, registry and human-preference checks pass, covering tokens,
  permanent cancellation, paused delivery and report action limitations.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1aec49b6fce42d7f167bdf72b02b46d1104d39cf">Complete Shona source coverage and retain technical names</a>. Thanks to xet7.</summary>

- Translate nine remaining English placeholders and retain 28 keyboard names,
  OS brands and mathematical symbols. All 3,783 source keys are covered.
- Translation, registry and human-preference checks pass, covering all Shona
  keys, placeholder inventories and key order. Coverage is not quality review.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/129937096e920afed5c1ad7eac9bc3dadd08ab18">Translate Yoruba date filters and archive settings</a>. Thanks to xet7.</summary>

- Translate 25 date filter, automatic archive and Leo import strings,
  preserving query syntax, numeric limits and import semantics.
- Translation, registry and human-preference checks pass, covering tokens,
  date operators, archive exclusions and list age behavior.
  Wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/90ac607ecc30387cfb1e7df175d3d3e26e48b66a">Translate Yoruba board access and notification controls</a>. Thanks to xet7.</summary>

- Translate 24 board visibility, rule variable and notification strings,
  preserving access restrictions, HTML tags and variable syntax.
- Translation, registry and human-preference checks pass, covering tokens,
  link schemes, distinct recipient roles and always-delivered reminders.
  Wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8bd18886e0c25a146b8f555982ba91d3f3a5fd7">Translate Yoruba reminders and saved filters</a>. Thanks to xet7.</summary>

- Translate 24 reminder, saved filter and import report strings, preserving
  reminder offsets, template variables and recovery navigation labels.
- Translation, registry and human-preference checks pass, covering tokens,
  numeric limits, private filter replacement and distinct saved states.
  Wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9b5ea239a2a13bee46bd7ef8c5be82d37e5e9dc">Translate Yoruba map and Blockly movement labels</a>. Thanks to xet7.</summary>

- Translate 24 map and Blockly accessibility strings, preserving
  movement directions, map placement instructions and substitution tokens.
- Translation, registry and human-preference checks pass, covering tokens,
  map upload permissions, card placement and distinct movement directions.
  Wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60f8a8f7fbfffdbd506788cb060f615914592e0b">Translate Yoruba Blockly accessible controls and field types</a>. Thanks to xet7.</summary>

- Translate 25 Blockly accessibility strings, preserving substitution
  tokens and distinct add, remove, collapse and expand controls.
- Translation, registry and human-preference checks pass, covering tokens,
  empty trash, keyboard names and distinct input and function labels.
  Wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9d13909d5da91d3b07ec593226e2221201fea38">Translate Yoruba Blockly descriptions and clipboard controls</a>. Thanks to xet7.</summary>

- Translate 22 block description and clipboard strings, preserving tokens,
  input plurality and distinct clipboard and backpack actions.
- Translation, registry and human-preference checks pass, covering tokens,
  collapsed warnings, keyboard names and distinct copy and cut labels.
  Wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/12fb7013c989ec605612291e8d7635a0d908a588">Translate Yoruba Blockly editing and warning controls</a>. Thanks to xet7.</summary>

- Translate 23 Blockly editing and accessibility strings, preserving
  substitution tokens, bitmap coordinates and distinct control actions.
- Translation, registry and human-preference checks pass, covering tokens,
  opening and closing controls, condition order and keyboard names.
  Wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a4c85b732959b5f7c0bf17b4df1e0f94c52deae3">Translate Yoruba Blockly list and numeric input labels</a>. Thanks to xet7.</summary>

- Translate 30 list, loop and numeric input labels, preserving
  substitution tokens, coordinate names and distinct arithmetic roles.
- Translation, registry and human-preference checks pass, covering tokens,
  start and end positions, numeric limits and shared repeat labels.
  Wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/585bda252c377ca923bdc41aad60ee005223eda9">Translate Yoruba Blockly text inputs and navigation</a>. Thanks to xet7.</summary>

- Translate 26 text input, navigation and comparison labels, preserving
  substitution tokens, comparison operators and distinct control actions.
- Translation, registry and human-preference checks pass, covering tokens,
  copy and cut distinctions, shared positions and inclusive comparisons.
  Wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec18dd133910741c55c8ed5ae8187d6b6df219ed">Translate Yoruba Blockly mathematical accessibility labels</a>. Thanks to xet7.</summary>

- Translate 21 mathematical accessibility labels, preserving function
  notation, logarithm bases, substitution tokens and distinct operators.
- Translation, registry and human-preference checks pass, covering tokens,
  numerical bases, inverse functions and shared minimum and maximum labels.
  Lower-confidence wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d1f9071f1cbb6e23bdfab337a90765f8f7e4329">Translate Yoruba Blockly workspace and screen reader controls</a>. Thanks to xet7.</summary>

- Translate 19 workspace and screen reader strings, preserving
  substitution tokens, keyboard names and distinct accessibility states.
- Translation, registry and human-preference checks pass, covering tokens,
  disabled functions, backpack actions and inverse function distinctions.
  Wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e389aef6ccb37e941f8deb08a674ae834b29381">Translate Yoruba Blockly keyboard shortcuts</a>. Thanks to xet7.</summary>

- Translate 32 keyboard shortcut strings, preserving distinct navigation
  directions, focus targets and movement actions.
- Translation, registry and human-preference checks pass, covering tokens,
  previous and next targets, stack positions and announcement detail levels.
  Wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed2971a9ec90e339bb1f1b902d6c44fed9e7af77">Translate Yoruba Blockly workspace search and announcements</a>. Thanks to xet7.</summary>

- Translate 26 workspace search and announcement strings, preserving
  substitution tokens, keyboard shortcuts and announcement spacing.
- Translation, registry and human-preference checks pass, covering tokens,
  search directions, movement actions and variable parameter conflicts.
  Wording needs fluent-speaker review; browser review not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c7aed93f157b7d0cc5c33817c68a785595a7849">Translate Yoruba rule editor and Scrum planning labels</a>. Thanks to xet7.</summary>

- Fill 31 Yoruba rule-editor and Scrum planning placeholders. Yoruba now passes
  90 percent source coverage, bringing the README count to 132 languages.
- Translation, registry and human-preference checks pass, covering tokens,
  administrator permission, single-trigger rules and completion policies.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d6f41bf348720b5dda0dca28e495266ae019aec9">Translate Yoruba sprint lifecycle and report strings</a>. Thanks to xet7.</summary>

- Fill 41 Yoruba placeholders for sprint planning, events, cancellation and
  reports, preserving existing translations and source placeholders.
- Translation, registry and human-preference checks pass, covering tokens,
  unknown estimates, closing versus cancelling and shared backlog labels.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24aad1c86c0b09c79a534af4e92c587fe47a0384">Translate Yoruba observations and Sync conflict messages</a>. Thanks to xet7.</summary>

- Fill 40 Yoruba daily-observation, Sync conflict and preview placeholders,
  preserving existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering observation
  limits, unknown estimates, one-way Sync and unchanged subcards.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2b8aa5e94ad48b12c1f7619bd9e16cecf47aa55">Translate Yoruba Sync reports and diagnostics</a>. Thanks to xet7.</summary>

- Fill 36 Yoruba Sync preview, report, diagnostic and mapped-estimate strings,
  preserving existing translations and source placeholders.
- Translation, registry and human-preference checks pass, covering report
  limits, retention, distinct outcomes and missing versus explicit null values.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/736160caa25cb4d7355dfadd878bfd78fa0d6d5a">Translate Yoruba email queue and delivery messages</a>. Thanks to xet7.</summary>

- Fill 31 Yoruba email queue and delivery failure placeholders, preserving
  existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering distinct
  queue actions, cancellation limits and temporary versus permanent rejection.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/95c4516d230af1cbc4968149b03d2fd8cdd58f34">Translate Yoruba activity recovery and time estimates</a>. Thanks to xet7.</summary>

- Fill 29 Yoruba activity recovery and imported time estimate placeholders,
  preserving existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering recovery
  states, retained pending work, time units and missing versus null values.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a66a0ae4e2b60739ed3031e73fbbc491d3a749a">Finish Yoruba source placeholder coverage</a>. Thanks to xet7.</summary>

- Translate the final 20 Yoruba prose placeholders and retain 24 reviewed key
  legends, OS brands and math symbols. No source prose placeholders remain.
- Translation, registry and human-preference checks pass, including full-file
  key order and tokens. Coverage is not a language-quality certification.
  Older wording needs review; fluent-speaker and browser review were not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca9e7bb9c5a1b7de8994740981b8cc2ea0174be9">Translate Igbo date filters and board visibility</a>. Thanks to xet7.</summary>

- Fill 28 Igbo archive, date-filter, Leo import and signed-in access strings,
  preserving existing translations and source placeholders.
- Translation, registry and human-preference checks pass, covering query
  syntax, inclusive dates, access wording, HTML and URL scheme names.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae3082cbe7b8fb14b45bf6409aa7d044d9dacaf3">Translate Igbo rule and notification preferences</a>. Thanks to xet7.</summary>

- Fill 28 Igbo parent-card, rule, notification and reminder placeholders,
  preserving existing translations and source variables.
- Translation, registry and human-preference checks pass, covering tokens,
  rule interpolation, reminder offsets and distinct notification categories.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/906918d3550a5bf4ae43ea236c9a193b2b0de849">Translate Igbo saved filters and map controls</a>. Thanks to xet7.</summary>

- Fill 29 Igbo filter, import-report, map and movement placeholders, preserving
  existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering template
  expressions, reminder limits, private filters and report navigation labels.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f4a200077964f0a8ba9c185236b41e4e261b76d">Translate Igbo Blockly movement and control labels</a>. Thanks to xet7.</summary>

- Fill 29 Igbo Blockly movement and accessible-control placeholders,
  preserving existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering movement
  directions, add/remove controls, comment expansion and field types.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/72229774020a3e0aa6735c19e765b49af52063cc">Translate Igbo block descriptions and backpack actions</a>. Thanks to xet7.</summary>

- Fill 30 Igbo Blockly description, warning and backpack placeholders,
  preserving existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering singular
  and plural inputs, copy-all actions, collapsed states and keyboard End.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e33bf0afd6a3590ed6c323231b5d9be49d8faab3">Translate Igbo Blockly editing and condition labels</a>. Thanks to xet7.</summary>

- Fill 28 Igbo Blockly bitmap, editing and condition placeholders,
  preserving existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering bitmap
  coordinates, open/close actions, condition order and Home/End labels.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8fbd5ed2518351fd0eb3f3aee96796885f3f918">Translate Igbo list loop and numeric inputs</a>. Thanks to xet7.</summary>

- Fill 30 Igbo Blockly list, loop and numeric input placeholders,
  preserving existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering positions,
  division operands, numeric bounds, repeat counts and coordinate names.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efcdf3f7e6c3b9387d91b4374468dc16f91b389c">Translate Igbo text inputs and keyboard navigation</a>. Thanks to xet7.</summary>

- Fill 26 Igbo Blockly text, navigation and comparison placeholders,
  preserving existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering shortcuts,
  text positions, copy/cut, find/replace and inclusive comparison bounds.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31e47230ab4f0b3b6884d1399c86ff773e6c1423">Translate Igbo accessible mathematical labels</a>. Thanks to xet7.</summary>

- Fill 20 Igbo Blockly arithmetic and constant placeholders, preserving
  existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering logarithm
  bases, distinct roots, comparison labels and shared minimum/maximum wording.
  Lower-confidence mathematical wording needs fluent-speaker review.
  Browser review was not run; wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6c1e874de7d19de19bdfd78f802ef326d8ee2a2">Translate Igbo screen reader and workspace controls</a>. Thanks to xet7.</summary>

- Fill 21 Igbo Blockly workspace, screen-reader and mathematical labels,
  preserving existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering opposite
  mode actions, paste-all behavior and distinct inverse-function descriptions.
  Wording needs fluent-speaker review, especially mathematical descriptions.
  Browser review was not run; wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d31e21cd9593bd5e973d17cc6b37a12fc3aa5aa">Translate Igbo keyboard shortcut labels</a>. Thanks to xet7.</summary>

- Fill 34 Igbo Blockly keyboard shortcut placeholders, preserving existing
  translations and source tokens.
- Translation, registry and human-preference checks pass, covering movement
  directions, next/previous navigation, focus targets and move actions.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9bee873b66dd3a02704bf48be310dc607dee1a4d">Translate Igbo workspace search and rule blocks</a>. Thanks to xet7.</summary>

- Fill 28 Igbo workspace, search and rule-editor placeholders, preserving
  existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering composed
  spacing, shortcuts, search direction and single-trigger rule validation.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/552dd49b43ddff34e1eb723e88f18ad6d87e9218">Translate Igbo rule editor and Scrum planning labels</a>. Thanks to xet7.</summary>

- Fill 32 Igbo rule-editor and Scrum placeholders. Igbo passes 90 percent
  source coverage, bringing the README count to 133 languages.
- Translation, registry and human-preference checks pass, covering tokens,
  permissions, saved states, completion policies and shared view labels.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3ceede59a172e99b8d2192b7739bb378fff106b">Translate Igbo sprint events and reports</a>. Thanks to xet7.</summary>

- Fill 32 Igbo sprint event, estimate and report placeholders, preserving
  existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering unknown
  estimates, time units, report counts and distinct sprint states and events.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/846f81fd47ccf2f9f4bb24637cb37a412e3f9e36">Translate Igbo sprint closure and daily observations</a>. Thanks to xet7.</summary>

- Fill 29 Igbo sprint closure, observation and Sync placeholders, preserving
  existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering closure
  behavior, UTC observations, retention limits and unknown estimates.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2cfceb184df59ef608fcd0e7df1c9ca62c5a724c">Translate Igbo Sync conflicts and previews</a>. Thanks to xet7.</summary>

- Fill 28 Igbo Sync conflict and preview placeholders, preserving existing
  translations and source tokens.
- Translation, registry and human-preference checks pass, covering preview
  limits, retained local content, unchanged subcards and distinct actions.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f7e93d2a1548db6067a7de2d3e1b9933ed3fcec6">Translate Igbo Sync reports and diagnostics</a>. Thanks to xet7.</summary>

- Fill 27 Igbo Sync report and diagnostic placeholders, preserving existing
  translations and source tokens.
- Translation, registry and human-preference checks pass, covering report
  limits, retention periods, distinct outcomes and shared omission labels.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf7ca9f90dcdc36f39e76e69d5635c3cd0e5398a">Translate Igbo email queue controls</a>. Thanks to xet7.</summary>

- Fill 26 Igbo email queue and mapped-estimate placeholders, preserving
  existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering queue
  actions, cancellation boundaries, explicit null and SMTP rejection types.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b7808783e6a72a12c5b483a25418fba37aa0d60">Translate Igbo delivery failures and activity recovery</a>. Thanks to xet7.</summary>

- Fill 29 Igbo delivery, time-estimate and activity-recovery placeholders,
  preserving existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering time units,
  field constraints, retained pending work and distinct failure states.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6be1cbe0594fa71def2f10db65242cd127927670">Finish Igbo source placeholder coverage</a>. Thanks to xet7.</summary>

- Translate the final 26 Igbo prose placeholders and retain 22 reviewed
  technical labels. No source prose placeholders remain.
- Translation, registry and human-preference checks pass, including full-file
  key order and tokens. Coverage is not a language-quality certification.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/65b9e307f3e2c78711a53a872ba845c0200685bf">Translate Hausa date filters and board visibility</a>. Thanks to xet7.</summary>

- Fill 28 Hausa archive, date-filter, Leo import and signed-in access strings,
  preserving existing translations and source placeholders.
- Translation, registry and human-preference checks pass, covering query
  syntax, inclusive dates, access wording, HTML and URL scheme names.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eed5ebe70bc2714546a274040080b423437eaad5">Translate Hausa rule and notification preferences</a>. Thanks to xet7.</summary>

- Fill 30 Hausa parent-card, rule, notification and reminder placeholders,
  preserving existing translations and source variables.
- Translation, registry and human-preference checks pass, covering tokens,
  rule interpolation, reminder limits and distinct notification categories.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7b3aebbc999277f28b4af6eeb21f0134c7c34250">Translate Hausa saved filters and map controls</a>. Thanks to xet7.</summary>

- Fill 27 Hausa filter, import-report, map and movement placeholders,
  preserving existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering template
  expressions, private filters, report navigation and movement distinctions.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c1b982840091df1ccde12b6682b8ad61e958ba5">Translate Hausa Blockly movement and control labels</a>. Thanks to xet7.</summary>

- Fill 29 Hausa Blockly movement and accessible-control placeholders,
  preserving existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering movement
  directions, add/remove controls, comment expansion and field types.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68e54d7c2cc0f9cea96505b1bca5483ba4eb0200">Translate Hausa block descriptions and clipboard actions</a>. Thanks to xet7.</summary>

- Fill 28 Hausa Blockly description, warning and clipboard placeholders,
  preserving existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering singular
  and plural inputs, copy-all actions, collapsed states and copy/cut labels.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e58a009de9881713b66a08013530169325e2267">Translate Hausa Blockly editing and condition labels</a>. Thanks to xet7.</summary>

- Fill 30 Hausa Blockly bitmap, editing and condition placeholders,
  preserving existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering bitmap
  coordinates, open/close actions, condition order and Home/End labels.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d66b42bb8b86d193e5565655bfcadaf5cfb001b3">Translate Hausa list loop and numeric inputs</a>. Thanks to xet7.</summary>

- Fill 31 Hausa Blockly list, loop and numeric input placeholders,
  preserving existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering positions,
  division operands, numeric bounds, repeat counts and coordinate names.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd01703f1f41426133f5e4dc2919b50bdd922fe1">Translate Hausa text inputs and keyboard navigation</a>. Thanks to xet7.</summary>

- Fill 25 Hausa Blockly text, navigation and comparison placeholders,
  preserving existing translations and source tokens.
- Translation, registry and human-preference checks pass, covering shortcuts,
  text positions, copy/cut, find/replace and inclusive comparison bounds.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8c83de7fa7e1dbc148884364f0da03e9f5580e9">Translate Hausa mathematical accessibility labels</a>. Thanks to xet7.</summary>

- Fill 24 Hausa comparison and mathematical accessibility labels, including
  roots, logarithm bases and direct versus inverse trigonometric functions.
- Translation, registry and human-preference checks pass, covering tokens,
  operation distinctions and preservation of existing translations.
  Lower-confidence mathematical wording needs fluent-speaker review;
  browser review was not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/38b41a8659d3c5e72f0588ba0972a56c09eaf735">Translate Hausa screen-reader messages and editing shortcuts</a>. Thanks to xet7.</summary>

- Fill 54 Hausa accessibility, clipboard and keyboard editing messages,
  preserving directions, screen-reader states and action distinctions.
- Translation, registry and human-preference checks pass, covering tokens,
  opposite states, navigation boundaries and existing translation preservation.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8d5f3493cfcdcf3a745cf0060f5b9f8c6517ed5">Translate Hausa workspace search and rule editor messages</a>. Thanks to xet7.</summary>

- Fill 34 Hausa workspace announcements, search controls and rule messages,
  including unsaved changes, concurrent edits and administrator permissions.
- Translation, registry and human-preference checks pass, covering tokens,
  composed counts, search shortcuts and rule validation distinctions.
  Wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96b5cf3f2bdce64e24412e5b530740dc3c085ac1">Translate Hausa Scrum planning and report labels</a>. Thanks to xet7.</summary>

- Fill 60 Hausa backlog, sprint lifecycle, estimate and report labels,
  including planning events and unknown-versus-zero estimate guidance.
- Translation, registry and human-preference checks pass, covering tokens,
  sprint states, estimate units and preservation of existing translations.
  Technical wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8fc0cb6097ecb564a74761f84ff092b53fb26fe6">Translate Hausa sprint observations and sync conflicts</a>. Thanks to xet7.</summary>

- Fill 35 Hausa sprint observation and synchronization conflict messages.
  Update the README to 134 languages above the source coverage threshold.
- Translation, registry and human-preference checks pass, covering tokens,
  report limitations, source choices and duplicate-card content retention.
  Technical wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0bbe96cbad245a80cdf74c49cd6235fff7c032ac">Translate Hausa sync previews and retained reports</a>. Thanks to xet7.</summary>

- Fill 49 Hausa sync preview, source omission and retained report messages,
  including existing-card protections and missing-versus-null source values.
- Translation, registry and human-preference checks pass, covering tokens,
  report limits, outcome distinctions and preservation of existing translations.
  Technical wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/925d50f4d14f784d8b944163c0b34a3cddf08f9f">Translate Hausa email queue and time estimate messages</a>. Thanks to xet7.</summary>

- Fill 35 Hausa email delivery and Jira time estimate messages, preserving
  cancellation scope, delivery uncertainty and retries during a pause.
- Translation, registry and human-preference checks pass, covering tokens,
  failure distinctions, estimate units and existing translation preservation.
  Technical wording needs fluent-speaker review; browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/edd7348e71a42b0f4ae319e4eb4fee6af1b1715f">Complete Hausa source coverage for recovery and history messages</a>. Thanks to xet7.</summary>

- Translate 45 remaining Hausa prose placeholders; retain 25 physical key
  legends, operating-system brands and mathematical symbols.
- Full source-order, token, translation and human-preference checks pass.
  Hausa has no remaining prose placeholders in the current English source.
  Wording needs fluent-speaker review; browser review was not run.
  Source coverage is not a quality audit. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/386bf333b68b86b82141becf60cf761b562632b2">Translate new source strings for Uzbek Latin locales</a>. Thanks to xet7.</summary>

- Add 44 import and rule-email recovery translations to each of the Uzbek
  Latin locales uz, uz-LA and uz-UZ, preserving existing translations.
- Translation, registry and human-preference checks pass, covering tokens,
  todo.txt syntax, duplicate-delivery warnings and source key order.
  Wording needs fluent-speaker review; browser review was not run.
  Other placeholders and Arabic-script Uzbek remain for further translation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62c1077ae1ad3b63453f0a570f37443d4e152025">Translate new source strings for Arabic-script Uzbek</a>. Thanks to xet7.</summary>

- Add 44 import and rule-email recovery translations in Arabic-script Uzbek,
  preserving todo.txt syntax, substitution tokens and existing values.
- Translation, registry and human-preference checks pass, including an
  Arabic-script guard for the new prose and source key-order checks.
  Low-confidence wording and orthography need fluent-speaker review.
  Browser review, older mixed-script corrections and other translations remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/10c2ada18901d6b193c6a6ff1f4cacef573de11d">Translate Uzbek archiving and date filters in both scripts</a>. Thanks to xet7.</summary>

- Fill 24 archiving, date filter and Leo import strings in each of four
  Uzbek locales, using Arabic script for uz-AR and Latin for the others.
- Translation, registry and human-preference checks pass, covering tokens,
  query syntax, date boundaries, archive exclusions and list-age behavior.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dca48908bb84985a1ace35075da8b8cc29d443a0">Translate Uzbek board access and rule controls</a>. Thanks to xet7.</summary>

- Fill 20 board access, rule and notification strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  rule variables, link schemes, access restrictions and action distinctions.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb69250ab17fa3e130ca29c17810bfafed339a55">Translate Uzbek reminders and saved filters</a>. Thanks to xet7.</summary>

- Fill 22 notification, reminder and saved-filter strings per Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  reminder offsets, dependency directions and template syntax.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2412a1df7136662f60adc10367f004467981fc14">Translate Uzbek map controls and import warnings</a>. Thanks to xet7.</summary>

- Fill 22 filter, import, map and block-movement strings per Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  partial-import warnings, map actions and movement directions.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19ee6dc5a5d8e6b0691e6865d7f42a52063cedea">Translate Uzbek Blockly accessibility controls</a>. Thanks to xet7.</summary>

- Fill 24 block-editor accessibility strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  movement directions, add/remove actions and expand/collapse distinctions.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/00747d720eb31435344dd0bb6447107263897ce6">Translate Uzbek block descriptions and field types</a>. Thanks to xet7.</summary>

- Fill 23 block descriptions and field labels in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  block states, input counts and protected function-variable warnings.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4743c8787df74473d2f51f556b57eac39424cbf4">Translate Uzbek colour and control-flow blocks</a>. Thanks to xet7.</summary>

- Fill 25 colour, loop and conditional block strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  numeric colour ranges, loop exits and conditional branch distinctions.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80cf56ea450b6f63d6482c3f9038c10a479be251">Translate Uzbek loop conditions and clipboard actions</a>. Thanks to xet7.</summary>

- Fill 18 conditional, loop and clipboard strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  while/until conditions, clipboard actions and variable deletion counts.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/861c8dad55915e1b948100979ef1c18ec4f535b9">Translate Uzbek bitmap and editing labels</a>. Thanks to xet7.</summary>

- Fill 20 bitmap, field and editor labels in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  bitmap coordinates, Home/End keys and editor open/close distinctions.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2fefd734db4e64a84590649fbfd04d055424ff94">Translate Uzbek condition and list inputs</a>. Thanks to xet7.</summary>

- Fill 24 condition, list and warning labels in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  condition ordering, list boundaries and text split/join distinctions.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3939aa9d4b859570365fb057a3629ba05915582c">Translate Uzbek numeric and text input labels</a>. Thanks to xet7.</summary>

- Fill 22 numeric and text input labels in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  numeric roles, coordinate names, repeated counts and text boundaries.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f84224020253a7587c32812010335e96b9ba76d2">Translate Uzbek keyboard navigation and list creation</a>. Thanks to xet7.</summary>

- Fill 25 text, keyboard navigation and list strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  keyboard shortcuts, text operation distinctions and empty-list semantics.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a5ecc6cad47dd227f811b2c2719d55f7be01907">Translate Uzbek list access and removal operations</a>. Thanks to xet7.</summary>

- Fill 20 list access, removal and sub-list strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  read/remove semantics and sub-list boundary markers.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a495ed7d2068efec0d642f5f1ce4fb647b0c7e0">Translate Uzbek list indexing and insertion</a>. Thanks to xet7.</summary>

- Fill 20 list indexing, copying and insertion strings per Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  list boundaries, missing-item results and copy semantics.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57387c4982ac2f80fb0143b4b1f06ff131077ff2">Translate Uzbek list sorting and text conversion</a>. Thanks to xet7.</summary>

- Fill 20 list sorting, replacement and text-conversion strings per locale,
  using Arabic script for uz-AR and Latin for the other three Uzbek locales.
- Translation, registry and human-preference checks pass, covering tokens,
  insertion/replacement distinctions, sort directions and case handling.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/75a5e10ccf40971dec1acb1b2b79fedbb208f26c">Translate Uzbek Boolean and comparison labels</a>. Thanks to xet7.</summary>

- Fill 19 Boolean and comparison strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  equality, inclusive comparisons, negation and conjunction distinctions.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e42517826fb518b36edb12bb575822f51aa80b2">Translate Uzbek conditional and arithmetic tooltips</a>. Thanks to xet7.</summary>

- Fill 14 conditional and arithmetic strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  conditional labels, arithmetic operations, coordinates and angle ranges.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dce04befe53494e4e41a859a2bb8c3bda3e30111">Translate Uzbek constants and number properties</a>. Thanks to xet7.</summary>

- Fill 18 constant, bound and number-property strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  mathematical constants, inclusive bounds and division remainders.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8f6bc7fbb7f251b6aea2c78e788306592a38d1be">Translate Uzbek Blockly statistics and accessible labels</a>. Thanks to xet7.</summary>

- Fill 15 statistics strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  distinct statistical operations and consistent minimum and maximum labels.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b92fb0b136f1b11af79099ab19e104ed9626b4e">Translate Uzbek random-number and rounding controls</a>. Thanks to xet7.</summary>

- Fill 23 mathematical strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  inclusive integer bounds, exclusive fraction bounds and rounding directions.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4314132d69cddf45ddcb3f74e47d55714e609bf">Translate Uzbek trigonometry and workspace controls</a>. Thanks to xet7.</summary>

- Fill 24 mathematical and workspace strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  inverse functions and degree units rather than radians.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/099e9bb36ddddc7988992e8469e23f34fe139fab">Translate Uzbek function and screen-reader controls</a>. Thanks to xet7.</summary>

- Fill 30 function and accessibility strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  function output distinctions and screen-reader toggle actions.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf320206e53ff612f303507143a96af455db4cd5">Translate Uzbek Blockly navigation shortcuts</a>. Thanks to xet7.</summary>

- Fill 25 shortcut labels in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  opposite directions, navigation targets and completing or cancelling moves.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7d4dcc3f9ca3b957f1bb374d8353ee110b97944c">Translate Uzbek scrolling and text case controls</a>. Thanks to xet7.</summary>

- Fill 25 scrolling and text control strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  scrolling directions, letter case and character position markers.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/171fe8ad297370c8a1b2a58a1c0dd4b33e8151d9">Translate Uzbek substring and text search controls</a>. Thanks to xet7.</summary>

- Fill 25 text operation strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  substring boundaries, search failure values and empty-text checks.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/341e17d7dd0075d8af1c5a446ad7ea484a536d8d">Translate Uzbek text processing and variable values</a>. Thanks to xet7.</summary>

- Fill 25 text and variable strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  replacement operands, trimming directions and number versus text prompts.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e33662e9905ef58a8f0f139f218b45fce2749d52">Translate Uzbek workspace announcements and search</a>. Thanks to xet7.</summary>

- Fill 19 workspace and search strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  block counts, comment fragments, search results and keyboard instructions.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d348da2106a48b7673ad4549f540321bfed3147b">Translate Uzbek rule-block editor messages</a>. Thanks to xet7.</summary>

- Fill 22 rule editor and Blockly strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  rule validation, permissions, save conflicts and consistent terminology.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ff3ecb6cf619efe991c3e2a3b3482ea6bd824333">Translate Uzbek Scrum planning labels</a>. Thanks to xet7.</summary>

- Fill 25 Scrum planning strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  roles, estimate sources and units, completion policies and sprint actions.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5148c20df29cb11d87282ff4ba0519c9af84e9aa">Translate Uzbek sprint events and backlog labels</a>. Thanks to xet7.</summary>

- Fill 25 sprint strings in each Uzbek locale; all four now exceed 90 percent
  source coverage, bringing the README count to 138 locales.
- Translation, registry and human-preference checks pass, covering tokens,
  review versus retrospection and committed versus completed work.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5088cd675f170e7edfff76be93512546b47884a8">Translate Uzbek sprint reports and lifecycle states</a>. Thanks to xet7.</summary>

- Fill 25 sprint report strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  unknown versus zero estimates, partial-report scope and lifecycle states.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17aa5cc28cf6bbc08cfea5527d0f893578868674">Translate Uzbek observations and sync conflict messages</a>. Thanks to xet7.</summary>

- Fill 20 observation and sync conflict strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  observation limits, unknown estimates and local-only conflict resolution.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/daed4f13ba50946c5180c54ba5f96b5433ff9417">Translate Uzbek sync preview and recovery messages</a>. Thanks to xet7.</summary>

- Fill 20 sync preview and recovery strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  preview limits, unchanged subcards and reuse of replacement cards.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f939dbed995864040c37c7e2b8ebfcec32d2283e">Translate Uzbek sync reports and source omissions</a>. Thanks to xet7.</summary>

- Fill 20 sync report and source omission strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  retention, report limits, outcomes and the absence of resume or undo behavior.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5320831a6760840668dbe4ee7f280a78e1947063">Translate Uzbek diagnostics and email queue messages</a>. Thanks to xet7.</summary>

- Fill 20 diagnostic and email queue strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  retention, explicit null semantics, uncertain delivery and pause behavior.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f69274a043e1a421238c088e5fba88f3866c419">Translate Uzbek email recovery and failure messages</a>. Thanks to xet7.</summary>

- Fill 20 email recovery and failure strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  rejection types, cancellation boundaries and distinct delivery failures.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd9c901ea9e822c908ec3af5dbdde76c29bb1047">Translate Uzbek time estimates and activity recovery</a>. Thanks to xet7.</summary>

- Fill 20 time estimate and activity recovery strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  hours, explicit null, recovery states and no activity recreation on retry.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c47e61da3ca13df736753e0fb9280e8776cfca9">Translate Uzbek delivery controls and rule email reports</a>. Thanks to xet7.</summary>

- Fill 20 delivery control and rule email strings in each Uzbek locale,
  using Arabic script for uz-AR and Latin for the other three locales.
- Translation, registry and human-preference checks pass, covering tokens,
  pause, permanent cancellation and mail-server acceptance distinctions.
  Wording needs fluent review, especially Arabic-script orthography.
  Browser review and wider translation completion remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3946aad824c47fc5a923f04d1d6a4c2c1ceca0f">Complete Uzbek source placeholder coverage</a>. Thanks to xet7.</summary>

- Fill nine final strings per Uzbek locale and retain 26 reviewed technical
  labels per locale. All four locales pass full source order and token checks.
- Translation, registry and human-preference checks pass. No English prose
  placeholders remain, but source coverage does not establish language quality.
  Older Latin-script text in uz-AR still needs correction; new Arabic-script
  wording needs fluent review. Browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/024c0b14a8999e6eaa74af1c8896b8c3b1583f34">Correct Arabic-script Uzbek activity translations</a>. Thanks to xet7.</summary>

- Replace 20 Latin-script activity and membership values in uz-AR with
  Arabic-script Uzbek, preserving placeholders and membership distinctions.
- Translation, registry and human-preference checks pass. Regression checks
  reject Latin prose in this batch after excluding source placeholders.
  Wording is low confidence and needs fluent review. Browser review was not run.
  Older script corrections and wider translation completion remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ca769f1bcea648c38134aa08fb24e4277817562">Correct Arabic-script Uzbek card activity messages</a>. Thanks to xet7.</summary>

- Replace 20 Latin-script card activity values in uz-AR with Arabic-script
  Uzbek, preserving placeholders and movement origins and destinations.
- Translation, registry and human-preference checks pass. Regression checks
  reject Latin prose and distinguish archive, restore and membership actions.
  Wording is low confidence and needs fluent review. Browser review was not run.
  Older script corrections and wider translation completion remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/415c5da089354ef1f5e1bab373450969c9fd80c8">Correct Arabic-script Uzbek short activity messages</a>. Thanks to xet7.</summary>

- Replace 20 Latin-script activity values in uz-AR with Arabic-script Uzbek,
  preserving percent placeholders and positional source and destination roles.
- Translation, registry and human-preference checks pass. Regression checks
  reject Latin prose and distinguish joining, leaving, adding and removing.
  Wording is low confidence and needs fluent review. Browser review was not run.
  Older script corrections and wider translation completion remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c37ca67e4e9b236988663c0a5c607ceb1b42c572">Correct Arabic-script Uzbek checklist and workspace text</a>. Thanks to xet7.</summary>

- Replace 20 Latin-script checklist, date and workspace values in uz-AR with
  Arabic-script Uzbek, preserving placeholders and template argument roles.
- Translation, registry and human-preference checks pass. Regression checks
  reject Latin prose and distinguish checking, unchecking, adding and removing.
  Wording is low confidence and needs fluent review. Browser review was not run.
  Older script corrections and wider translation completion remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef1ad27022ea5188770b507b88d648ba61bf82cc">Correct Arabic-script Uzbek workspace and board text</a>. Thanks to xet7.</summary>

- Replace 25 Latin-script workspace and board values in uz-AR with Arabic-script
  Uzbek, preserving placeholders and correcting due-date terminology.
- Translation, registry and human-preference checks pass, covering Markdown,
  the one-board limit and removal from Home without deleting the board.
  Wording is low confidence and needs fluent review. Browser review was not run.
  Older script corrections and wider translation completion remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4c53fcd71e70db470ad973afb5dd4569a90e73c">Correct Arabic-script Uzbek creation controls</a>. Thanks to xet7.</summary>

- Replace 25 Latin-script creation and checklist values in uz-AR with
  Arabic-script Uzbek, preserving placeholders and fixing attachment wording.
- Translation, registry and human-preference checks pass, covering positions,
  shortcut toggles and the positive integer requirement for swimlane height.
  Wording is low confidence and needs fluent review. Browser review was not run.
  Older script corrections and wider translation completion remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d983f887e57acb6cebc76ac42e37a7baae2b2b8d">Correct Arabic-script Uzbek membership and archive text</a>. Thanks to xet7.</summary>

- Replace 25 Latin-script membership, announcement and archive values in uz-AR
  with Arabic-script Uzbek, preserving placeholders and fixing action wording.
- Translation, registry and human-preference checks pass, covering archive
  scope, administrator restrictions and the loading data-loss warning.
  Wording is low confidence and needs fluent review. Browser review was not run.
  Older script corrections and wider translation completion remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d6c0d3742ead581c09bff1cb2bae39a0fb30b7e">Correct Arabic-script Uzbek archive and attachment text</a>. Thanks to xet7.</summary>

- Replace 25 Latin-script archive, template and attachment values in uz-AR
  with Arabic-script Uzbek, preserving placeholders and consistent terminology.
- Translation, registry and human-preference checks pass, distinguishing
  permanent deletion from recoverable removal that retains the file.
  Wording is low confidence and needs fluent review. Browser review was not run.
  Older script corrections and wider translation completion remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f51a9d6cfcfa95e6ae3cc5c7adb59b495d5f982">Correct Arabic-script Uzbek board display text</a>. Thanks to xet7.</summary>

- Replace 25 Latin-script board display values in uz-AR with Arabic-script
  Uzbek, translating privacy labels and correcting assignee wording.
- Translation, registry and human-preference checks pass, covering placeholders,
  HTML emphasis, consistent dialog labels and card versus board member scopes.
  Wording is low confidence and needs fluent review. Browser review was not run.
  Older script corrections and wider translation completion remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31f5ae98805992727ce700743a1fd71592192502">Correct Arabic-script Uzbek board view controls</a>. Thanks to xet7.</summary>

- Replace 20 Latin-script board view values in uz-AR with Arabic-script Uzbek,
  correcting Watch and Collapse meanings and preserving the zoom range.
- Translation, registry and human-preference checks pass, covering tokens,
  consistent dialog labels and distinct desktop, mobile and calendar views.
  Wording is low confidence and needs fluent review. Browser review was not run.
  Older script corrections and wider translation completion remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06c589d40e4664508acd5c275bfde87d4774387f">Correct Arabic-script Uzbek timeline and metric labels</a>. Thanks to xet7.</summary>

- Replace 25 Latin-script timeline and reporting values in uz-AR with
  Arabic-script Uzbek, preserving restoration scope and fixing the list example.
- Translation, registry and human-preference checks pass, covering tokens,
  the no-deletion assurance, restored fields and distinct metric labels.
  Wording is low confidence and needs fluent review. Browser review was not run.
  Older script corrections and wider translation completion remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d74079ba2e6a370a3ad24018f3f0779ffe50bc0">Correct Arabic-script Uzbek calendar and card labels</a>. Thanks to xet7.</summary>

- Replace 25 Latin-script calendar and card values in uz-AR with Arabic-script
  Uzbek, preserving calendar variants and the ISO 8601 designation.
- Translation, registry and human-preference checks pass, covering tokens,
  distinct calendar names, month navigation and card versus board archive text.
  Wording is low confidence and needs fluent review. Browser review was not run.
  Older script corrections and wider translation completion remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/581cb69a5003ff4c4a552bb56cc048027dbb4b60">Correct Arabic-script Uzbek card controls</a>. Thanks to xet7.</summary>

- Replace 25 Latin-script card control values with Arabic-script Uzbek.
  Clarify due dates, permanent deletion and archive restoration.
- Translation, registry and human-preference checks pass, covering tokens,
  script, restoration and due-date distinctions. Existing coverage is retained.
  Wording is low confidence and needs fluent review. Browser review was not run.
  Older script corrections and wider translation completion remain in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6946d1416dac9b03f968181fa72c8d7bb48d2962">Translate new import and email recovery strings into Cantonese</a>. Thanks to xet7.</summary>

- Translate 44 missing source keys in yue_CN, preserving existing translations.
  Include todo.txt import instructions and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser review was not run.
  Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/86bb48129c3bc844ca8be27c9930002d4433c935">Translate new recovery strings into Pashto, Sindhi and Yiddish</a>. Thanks to xet7.</summary>

- Translate 44 missing keys each in ps, sd and yi, preserving existing
  translations. Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/43c1a8fd4864208f765515e633fab74bca758c01">Fill new recovery keys in Kurmanji and regional English</a>. Thanks to xet7.</summary>

- Translate 44 missing keys into Kurmanji and add the missing source entries
  to 11 regional English locales. Preserve all existing locale values.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7b46ea977f7df9e3f44c0ef2a7ff7b8ad5e2f6db">Translate new recovery strings into Latin and Moroccan Arabic</a>. Thanks to xet7.</summary>

- Translate 44 missing keys each in la and ary, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e20befe770aaedbb9061858cc082642911eb72e3">Translate new recovery strings into Tatar and Assamese</a>. Thanks to xet7.</summary>

- Translate 44 missing keys each in tt and as, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f21bc2fe030f55546dd18ba6a9257ca029cd2378">Translate new recovery strings into Sorani and Sinhala</a>. Thanks to xet7.</summary>

- Translate 44 missing keys each in ckb and si, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/090cb1fd0bc13d31ba61bed2b2fd2ca9861c9bc7">Translate new recovery strings into Zulu locales</a>. Thanks to xet7.</summary>

- Translate 44 missing keys each in zu and zu-ZA, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d3ecb0cc1080e92ab6c1cead1029077323dd194">Translate new recovery strings into Xhosa</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in xh, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6b46ce029885dbf5f3f3cb460c94826fa60ee2b">Translate new recovery strings into Chichewa</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in ny, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a50e83a3e4f1c8417fe113e0bd69d8296d9bdea">Translate new recovery strings into Kinyarwanda</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in rw, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c61b1a9cd976eb5ea6a0643b22500e961bb8c3b">Translate new recovery strings into Khmer locales</a>. Thanks to xet7.</summary>

- Translate 44 missing keys each in km and km_KH, also serving the km-KH alias.
  Preserve existing values and cover imports and email recovery controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e8b72d7db62c69fe2d97ba9c6a20daf30381448">Translate new recovery strings into Burmese</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in my, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b4711ba09f447fbd1eec6f1918df7abd0af9a30">Translate new recovery strings into Maithili</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in mai, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd159310aba8b32052e16620fddd422e6cf1d4ec">Translate new recovery strings into Bhojpuri</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in bho, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e40b59bb407d397ac63d97037263310f95dc02c7">Translate new recovery strings into Tok Pisin</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in tpi, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1200e8ef306a9877becad4394a57094767e76749">Translate new recovery strings into Bislama</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in bi, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a6d5ef393f8fd737c89acde704c5f104eb18dab">Translate new recovery strings into Māori</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in mi, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/11a0fe80f05e4109df20145c10994a9ab4c7f0bd">Translate new recovery strings into Samoan</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in sm, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b1e19ca90d1ef9ad2db6a50841113a521d074787">Translate new recovery strings into Papiamento</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in pap, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89b1151f60287100cd7a2dd41e31cdc3979eab02">Translate new recovery strings into Sesotho</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in st, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e43c702fc4e1fdc6bb3db2db8fdfc81fc462870">Translate new recovery strings into Setswana</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in tn, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ec63bbcd913c140f2f7122e7464e50a866000ab">Translate new recovery strings into Sepedi</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in nso, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f443853bba0d85bd887fb1a51ae3f2a4677f22f6">Translate new recovery strings into Amharic</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in am, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a56db086927cebe5e2fe3040adfa8f1dcf823b7">Translate new recovery strings into Uyghur</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in ug, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37ab7879627a89cdc098a6695d98f27ee8db219c">Translate new recovery strings into Bashkir</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in ba, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing regression coverage is retained. Browser and fluent-speaker review
  were not run. Wider translation completion remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2937ee11f8c06d85358364f79367eefd4a068d1">Translate new recovery strings into Konkani</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in kok, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e16f7fbd2578e5ac709c0910d986937c7e8e0d6f">Translate new recovery strings into Xitsonga</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in ts, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/acb63f7d4dcd55993b39abfe616cee9525373e45">Translate new recovery strings into siSwati</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in ss, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6cab8db096da876ef0260d53be506b1f60fc9d6">Translate new recovery strings into Ndebele</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in nd, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5bfd14fefcba577f59d54749274e9e7999ee6561">Translate new recovery strings into Fijian</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in fj, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c0f71f90de98dc0b1ea2fa144bf190397b3a9e7f">Translate new recovery strings into Silesian</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in szl, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/945b017c10e4659ccd78048387622060fe082f0c">Translate new recovery strings into Wu Chinese</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in wuu-Hans, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84fe7c73d0a8664c7d005f6ad5372e1bfea38edf">Translate new recovery strings into Upper Sorbian</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in hsb, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/afa1653cb7f6b1f23706c2f79f4d09d144edb18d">Translate new recovery strings into Walloon</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in wa, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df6a1896e9cdaab80d9b4e92823f62c3b3a90881">Translate new recovery strings into Waray</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in wa-RR, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f7646d46b4e03f7676b104f53732b4a4733bfa5b">Translate new recovery strings into Hawaiian</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in haw, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/168aafbde2cc5ac35d847f6a43b09da8261e630c">Translate new recovery strings into Aromanian</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in rup, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8e35d463c1b7337199578cc415723c2298de2bd">Translate new recovery strings into Luganda</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in lg, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b71dbe3557dafa30eafd3867bc638ffe19e0b837">Translate new recovery strings into Kirundi</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in rn, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c9e93d50b8fb3a1cdf156e9e51c84067b57d8f69">Translate new recovery strings into Oromo</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in om, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d9bc92f0168e5178269edb8128589103686fa40">Translate new recovery strings into Ladin</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in lld, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2c4cd64788e70c7340dc98d393007cf65a197d9">Translate new recovery strings into Acehnese</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in ace, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ddb9811b3dd7f0d760fd368c30e22606d5b5dfa">Translate new recovery strings into Wolof</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in wo, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/10e1361982986d5b412b630580251950b2d9e053">Translate new recovery strings into Akan</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in ak, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16f691b255349e0b2e7b77eeaae2de923a1f7925">Translate new recovery strings into Tongan</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in to, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3ea8ec81ccabad2b83ae511c5fb7081c5bf3dbb">Translate new recovery strings into Venetian</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in ve-CC, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/425cb19c296da4bb9f9cfc29c9f720668f87ff6a">Translate new recovery strings into Venda</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in ve, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c8639b708152e459e645b0a14e4d0dca70f8d27">Translate new recovery strings into Bambara</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in bm, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46ccd973c1c8d5d015c5307f63e0ef2193bf9b7a">Translate new recovery strings into Guarani</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in gn, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/034f63437eefc4d90cb3577750302840fa6d9f36">Translate new recovery strings into Ewe</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in ee, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb0a445f47ce2fbca8fe6eb59fc04425197ed9bc">Translate new recovery strings into Quechua</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in qu, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b43300633ba4b19dde3011f8a4e593efcbef4f5c">Translate new recovery strings into Aymara</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in ay, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/afe496c1da0567b71bb9d5d716566d13e90b5763">Translate new recovery strings into Buryat</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in bua, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a1ca2e49fcd1e4f305e085dbc952ffe7b0715ac8">Translate new recovery strings into Northern Sámi</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in se, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/190ee639565bc96194423678cc590d5bc62e3ce1">Translate new recovery strings into Cornish</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in kw, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed1e2f1016d158aa29b56c201e00845af66b69c9">Translate new recovery strings into Manx</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in gv, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c4d2161d4714fa74b08aaaeab790011f7feb7f4">Translate new recovery strings into Chuvash</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in cv, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67d2ce9c437352e20c8dbb704d78657a12a38984">Translate new recovery strings into Tibetan</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in bo, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d0311ee19e6a8541a57a7c8aee92f8cbc296bb2d">Translate new recovery strings into Tigrinya</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in ti, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c9a88023efa6f3ce4d39857ac945ca06019d02e">Translate new recovery strings into Sakha</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in sah, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f14023f098178a7128db4e412822cc81afbbf49">Translate new recovery strings into Volapük</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in vo, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bdffa3a7d13a8ba31257b48f1c48233afe9f6422">Translate new recovery strings into Dzongkha</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in dz, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/275dc3d130570a38db29867378ef4582da2aae49">Translate new recovery strings into Fulah</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in ff, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4154a064d63f66ce6c7c6c87ddcabb3cedae15e0">Translate new recovery strings into Kashmiri</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in ks, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/869bed4f0149928e945b9c90559e5b11a44ae57d">Translate new recovery strings into Klingon</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in tlh, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c8530d4ad16986d45720fd02158ba1040dadf75">Translate new recovery strings into Veps</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in ve-PP, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/95cd3734eecc20b0fbe6c5c2588386b9b3966a0a">Complete remaining Flemish translation placeholders</a>. Thanks to xet7.</summary>

- Fill 910 missing and English placeholder values in vl-SS with standard Dutch
  wording, preserving existing translations and the local Klaar label.
  Include 44 new import and email recovery keys and update the README count.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Browser review was not run.
  Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c9e8a7978891e8e13a268be5ce1fe2b193d2618b">Translate Greenlandic import and email recovery strings</a>. Thanks to xet7.</summary>

- Translate 44 missing keys and 11 older email recovery placeholders in kl,
  preserving existing translations and the English source.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c65c282a8bf3c4d3259c754b99e743552e42c44f">Translate new recovery strings into Nahuatl</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in nah, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d13ad5adca87ed9106f14db2ab7a85446221d77b">Translate new recovery strings into Inuktitut</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in iu using syllabics, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e45589ba15927e94ee58254a30fc2ca8a16d510">Translate new recovery strings into Tigre</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in tig, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e68ed46185fd8efca9c9472f0001441af5b044fa">Translate new recovery strings into Standard Moroccan Tamazight</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in zgh using Tifinagh, preserving existing values.
  Cover todo.txt imports and email recovery and review controls.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2dbb9522cbc25134054dd2e7387686d76a5d9c89">Translate Wolaytta recovery strings and placeholder labels</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in wal and three prefixed English labels.
  Cover todo.txt imports and email recovery; preserve other existing values.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run. Wider work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7a1cfd1a3056814ab3d35d8f264a23ce01ef2a2">Translate new recovery strings into Cherokee</a>. Thanks to xet7.</summary>

- Translate 44 missing keys in chr, preserving existing values.
  All 246 locale paths now contain the 3783 current English keys.
- Translation, registry and human-preference checks pass, covering placeholders,
  import syntax, duplicate delivery, access checks and permanent discard.
  Existing coverage is retained. Longer technical wording is low confidence
  and needs fluent review. Browser review was not run.
  Older English placeholders and broader language-quality work remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc04bcd12736dd51112d16260c6ef047ea9344c5">Translate Haitian Creole filters and automation controls</a>. Thanks to xet7.</summary>

- Fill 65 English placeholders in ht, preserving existing translations.
  Cover archiving, date filters, board visibility, automation and reminders.
- Translation, registry and human-preference checks pass, covering placeholders,
  variable and filter syntax, URL schemes, markup, signed-in access,
  archive exclusions and reminder direction. Existing coverage is retained.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f87b292534c1092fda9c2fb85d7e69288d9a5fe">Translate Haitian Creole maps and Blockly accessibility</a>. Thanks to xet7.</summary>

- Fill 86 English placeholders in ht, preserving existing translations.
  Cover saved filters, import warnings, maps and Blockly accessibility.
- Translation, registry and human-preference checks pass, covering placeholders,
  argument order, movement directions, filter privacy and partial imports.
  Existing coverage is extended. All locales retain the current source keys.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ebd300d63ffddf242f3fadef69be8cf34a4cbc3">Haitian Creole Blockly controls and inputs</a>. Thanks to xet7.</summary>

- Fill 116 English placeholders for control flow, variables, bitmap labels
  and editor inputs, preserving existing translations.
- Translation, language registry and human-preference checks pass. Extend
  coverage for placeholders, argument order, loop semantics and RGB ranges.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6af906f49c0c7825e5483d88e95e25c26a19b4a">Haitian Creole Blockly lists and navigation</a>. Thanks to xet7.</summary>

- Fill 84 English placeholders for keyboard navigation, list operations and
  Boolean values, preserving existing translations.
- Translation, language registry and human-preference checks pass. Extend
  coverage for placeholders, list mutations, copies and Boolean meanings.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f349c4ba8ec2170e098e9c4389bfad255bd73a3">Haitian Creole Blockly logic and mathematics</a>. Thanks to xet7.</summary>

- Fill 82 English placeholders for comparisons, logic, arithmetic and
  statistics, preserving existing translations and mathematical notation.
- Translation, language registry and human-preference checks pass. Extend
  coverage for negation, interval endpoints, constants and angle units.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8576901e560807571a477950ad2443e542b99283">Haitian Creole Blockly functions and screen-reader controls</a>. Thanks to xet7.</summary>

- Fill 71 English placeholders for mathematics, variables, procedures and
  accessibility, preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for negation, angle units, return values and screen-reader states.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed1969154ff9a93947ce41ab235fcc659e663459">Haitian Creole Blockly text operations and shortcuts</a>. Thanks to xet7.</summary>

- Fill 89 English placeholders for keyboard shortcuts and text operations,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for whitespace, replacement arguments and navigation directions.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae83f4f9c7097f6bca57da3a1b4a2bd4e1c27f50">Haitian Creole workspace and rule editor messages</a>. Thanks to xet7.</summary>

- Fill 58 English placeholders for workspace search, variables, rule editing
  and Scrum views, preserving existing translations.
- Translation, language registry and human-preference checks pass. Extend
  coverage for placeholders, keyboard shortcuts, spacing and permissions.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f429086308f97cedb9a454f91feb1bd6b4acc15d">Haitian Creole Scrum planning and reports</a>. Thanks to xet7.</summary>

- Fill 63 English placeholders for sprint planning, workflow states and
  reports, preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for unknown estimates, comparison rules and sprint completion.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/da7cf5e26d5643b6fafb58233952a137150a8098">Haitian Creole sprint observations and sync messages</a>. Thanks to xet7.</summary>

- Fill 53 English placeholders for sprint observations and sync messages.
  Preserve existing translations; update the README language coverage count.
- Translation, language registry and human-preference checks pass. Extend
  coverage for reporting limits, sync safeguards and placeholders.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fcdf9bf6c5fe358c76e7e34448ddb14b9bdb9970">Haitian Creole sync diagnostics and email queue</a>. Thanks to xet7.</summary>

- Fill 38 English placeholders for sync reports and email queue controls,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for retention, null values and email retry safeguards.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/98334e58d5756272fe8cd52f66822a74d4f3ff74">Haitian Creole notification recovery messages</a>. Thanks to xet7.</summary>

- Fill 38 English placeholders for email failures, time estimates and
  activity notification recovery, preserving existing translations.
- Translation, language registry and human-preference checks pass. Extend
  coverage for cancellation boundaries, access checks and activity retention.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c82345642ab5f5e1b2669eb0b5e28dee0acb3bd">Haitian Creole remaining English prose placeholders</a>. Thanks to xet7.</summary>

- Translate 26 delivery, sign-in and history messages. Retain 27 keyboard
  labels, product names and code symbols as intentional locale exceptions.
- Full Haitian Creole key-order, token and placeholder checks now pass,
  alongside language registry and human-preference checks.
  Browser review was not run. Older linguistic quality needs review;
  wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a1dcef8d5240942ffb901f7d680249fe204f0e73">Latin filters and automation hints</a>. Thanks to xet7.</summary>

- Fill 35 English placeholders for filters, access settings and automation,
  preserving existing translations and executable examples.
- Translation, language registry and human-preference checks pass. Extend
  coverage for date queries, variables, access restrictions and archival.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7006178e0653070a9ea19a2ade434a4882a1f50e">Latin notification preferences and reminders</a>. Thanks to xet7.</summary>

- Fill 35 English placeholders for notification settings, due-date reminders
  and saved filters, preserving existing translations and variables.
- Translation, language registry and human-preference checks pass. Extend
  coverage for reminder timing, notification exceptions and filter privacy.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94270921ea3eb7917bd4ee12199c6eecdff458fc">Latin maps and Blockly accessibility messages</a>. Thanks to xet7.</summary>

- Fill 43 English placeholders for maps, import warnings and accessibility,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for map access, import warnings and movement argument order.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/201e45cd61de132dd1bda751f61ef205fb9b303f">Latin Blockly labels and color controls</a>. Thanks to xet7.</summary>

- Fill 43 English placeholders for block labels, warnings and color controls,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for variable deletion, numeric ranges and loop flow semantics.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b27dba699f133459a6026ca8b8279ca6f119ce04">Latin Blockly loops and editing actions</a>. Thanks to xet7.</summary>

- Fill 40 English placeholders for loops, conditions and editing actions,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for loop conditions, argument order and deletion confirmations.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/90be84eddb2175a16dad57ecc69b3b8aab9ab65e">Latin Blockly input and bitmap labels</a>. Thanks to xet7.</summary>

- Fill 66 English placeholders for editor inputs and bitmap accessibility,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for bitmap coordinates, editor states and mathematical operands.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a273894b73669e52621c073c572fd2b3a885e840">Latin Blockly list access and navigation</a>. Thanks to xet7.</summary>

- Fill 49 English placeholders for list access and keyboard navigation,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for list mutations, missing items, copies and argument order.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1575d8e835cdab9ec683721d6305ab0765692b22">Latin Blockly list transformations and logic</a>. Thanks to xet7.</summary>

- Fill 53 English placeholders for list transformations and logic labels,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for copy semantics, sorting and Boolean operations.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c52fe6aabb582b6a3e3e9c6c851b91211db4cb2c">Latin Blockly arithmetic and statistics</a>. Thanks to xet7.</summary>

- Fill 44 English placeholders for arithmetic, constants and statistics,
  preserving existing translations and formulas.
- Translation, language registry and human-preference checks pass. Extend
  coverage for degree limits, inclusive bounds and statistical distinctions.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7b14cef13c8ea72a4d75a925f7a0334bb6428b06">Latin random numbers and trigonometry</a>. Thanks to xet7.</summary>

- Fill 42 English placeholders for numeric operations and trigonometry,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for random-number bounds, negation, rounding and angle units.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4df715579509cf147aa33848518900ee3a10c893">Latin Blockly functions and variables</a>. Thanks to xet7.</summary>

- Fill 33 English placeholders for function and variable controls,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for return values, disabled definitions and function warnings.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed31102118daad2767c0d223c3586e60501e7a87">Latin screen-reader and keyboard shortcuts</a>. Thanks to xet7.</summary>

- Fill 46 English placeholders for screen-reader controls and shortcuts,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for reader states, variable renaming and navigation directions.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd0cf4d4353fc23b8a37b1ca18f9cfedf1fc68ae">Latin Blockly text operations</a>. Thanks to xet7.</summary>

- Fill 65 English placeholders for text operations and variable messages,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for whitespace, replacement arguments and variable type conflicts.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/41e7b04bc4430ca0c9531262d18faffdf2c24868">Latin workspace and rule editor messages</a>. Thanks to xet7.</summary>

- Fill 49 English placeholders for workspace and rule-editor messages.
  Preserve existing translations; update the README language coverage count.
- Translation, language registry and human-preference checks pass. Extend
  coverage for shortcuts, spacing, permissions and rule conflicts.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e4eb1defea1ce4bd2a6d4f8fe9bc04a9d127dc96">Latin Scrum planning and reports</a>. Thanks to xet7.</summary>

- Fill 49 English placeholders for Scrum planning and reports,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for unknown estimates, comparison rules and sprint actions.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3aabaa9f514e305fb1a6502a8fed86a194c98e3">Latin sprint states and daily observations</a>. Thanks to xet7.</summary>

- Fill 34 English placeholders for sprint states and reporting notes,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for observations, cancellation and sync conflict handling.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/023878517165ff3832a6bc3bc5f9b5240c023dcb">Latin sync conflicts and previews</a>. Thanks to xet7.</summary>

- Fill 34 English placeholders for sync conflicts and source previews,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for local content, subcards, replacement reuse and hidden values.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ddcfc7e80f45dc9c82b8959f8bfbff9152a01ca9">Latin sync diagnostics and email queue messages</a>. Thanks to xet7.</summary>

- Fill 29 English placeholders for sync diagnostics and email queue messages,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for retention, null values and delivery retry safeguards.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d47ef88468f629009cd0497a9f973c29c453cd5f">Latin delivery controls and failure messages</a>. Thanks to xet7.</summary>

- Fill 34 English placeholders for delivery controls and failure messages,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for cancellation, SMTP failures and activity-preserving retries.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/39bdccacfdedfb82714fbe6f31d926021c542ccf">Latin remaining English prose placeholders</a>. Thanks to xet7.</summary>

- Translate 37 recovery, sign-in and history messages. Retain 36 keyboard
  labels, brands, code symbols and shared Latin terms as locale exceptions.
- Full Latin key-order, token and placeholder checks now pass,
  alongside language registry and human-preference checks.
  Browser review was not run. Older linguistic quality needs review;
  wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/25c23ec013b704afa143ee178e4a0fd41ee0b930">Mongolian date filters and automatic archival</a>. Thanks to xet7.</summary>

- Fill 20 English placeholders for date filters and automatic archival,
  preserving existing translations and placeholders.
- Translation, language registry and human-preference checks pass. Extend
  coverage for date boundaries, time ranges and template archival exceptions.
  Browser review was not run. Wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73252035ca37c17e2389795672d82fb2e31e7473">Mongolian access and automation messages</a>. Thanks to xet7.</summary>

- Translate 20 English placeholders for access, filters and automation.
- Preserve date queries, template variables, URL schemes and HTML markup.
- Check signed-in visibility, editing restrictions and ordered rule actions.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56dfafe61b251b56de00f602aaa2ddc499744055">Mongolian notifications, saved filters and map views</a>. Thanks to xet7.</summary>

- Translate 40 English placeholders for notifications, reminders, filters,
  import reports and map views while retaining existing translations.
- Check reminder timing, private filter replacement and template variables.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8240c4db7eea82410b292af0be4b456011e8a684">Mongolian map and block accessibility messages</a>. Thanks to xet7.</summary>

- Translate 57 map placement and Blockly accessibility placeholders.
- Preserve substitution tokens and distinguish movement directions,
  expansion controls and the variable deletion restriction.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4817e191a98faa85cec3a85e9c2f12e232325018">Mongolian block controls and colour messages</a>. Thanks to xet7.</summary>

- Translate 59 Blockly colour, loop, condition and editing placeholders.
- Check true and false loop conditions, colour ranges and deletion tokens.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/720ee731eb9835288e4a90b05f825c10c28084fb">Mongolian editor fields and input labels</a>. Thanks to xet7.</summary>

- Translate 55 Blockly field, input and accessibility placeholders.
- Check bitmap dimensions, coordinates and distinct arithmetic operands,
  editing controls and list positions while preserving source tokens.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cfc90a668eef7a133934de5d5f8b932275ac3c8b">Mongolian list operations and navigation hints</a>. Thanks to xet7.</summary>

- Translate 53 Blockly list, input and keyboard navigation placeholders.
- Check list retrieval versus removal, positions counted from the end,
  empty lists and keyboard confirmation while preserving source tokens.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8c8b82ec1fcb3e4f527032765834761952232a2">Mongolian list transformations and logic labels</a>. Thanks to xet7.</summary>

- Translate 48 list transformation, sorting and logic placeholders.
- Check copied lists, insertion versus assignment, missing-item results
  and Boolean labels while preserving source substitution tokens.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9943e0efc1be4303b5c10a8121930ce6d029e365">Mongolian logic and arithmetic messages</a>. Thanks to xet7.</summary>

- Translate 46 logic, comparison and arithmetic placeholders.
- Check Boolean operations, inclusive bounds, constants and the distinction
  between quotients and remainders while preserving substitution tokens.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7aa429883a5a92fb1defb9cc7de431d4ecab42c">Mongolian numerical operation messages</a>. Thanks to xet7.</summary>

- Translate 45 statistics, random number and numerical operation strings.
- Check random bounds, mean and median, modes, logarithm bases and rounding
  directions while preserving source substitution tokens.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d11269614da959835909814bc4a02c1a05180da4">Mongolian function and trigonometry messages</a>. Thanks to xet7.</summary>

- Translate 41 function, trigonometry and editor placeholders.
- Check degree units, disabled definitions, duplicate parameters and return
  values while preserving source substitution tokens.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/faba58345b71598ff2d3021de90dd2a2c8791bfd">Mongolian procedure and shortcut messages</a>. Thanks to xet7.</summary>

- Translate 50 procedure, screen reader and keyboard shortcut placeholders.
- Check screen reader toggles, movement directions and variable renaming
  while preserving source substitution tokens.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01fe8abf8343604ea7ce73897c662c31b7e7accf">Mongolian text operation messages</a>. Thanks to xet7.</summary>

- Translate 53 text operation and editor shortcut placeholders.
- Check character positions, missing-text results, spaces in text length
  and replacement of every occurrence while preserving source tokens.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37510a578318e51cb3f6acb68c94e90848ecb080">Mongolian workspace and rule editor messages</a>. Thanks to xet7.</summary>

- Translate 52 workspace, variable and rule editor placeholders.
- Check search shortcuts, variable conflicts, unsaved changes and required
  trigger connections while preserving source substitution tokens.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d79d8a3b8daa71fe22b42d8522993c1c45977d5">Mongolian rule saving and Scrum planning messages</a>. Thanks to xet7.</summary>

- Translate 52 rule saving and Scrum planning placeholders.
- Check administrator permissions, conflicting edits and completion policies.
- Update the README coverage count to 142 after Mongolian crosses its
  existing threshold; this does not mean all Mongolian strings are complete.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f618ae28d53f2d583f23a2812251d6e8b8c69487">Mongolian sprint reports and synchronization conflicts</a>. Thanks to xet7.</summary>

- Translate 42 sprint report and synchronization conflict placeholders.
- Check unknown estimates, partial observations, cancellation membership
  and the absence of writes to the source system; preserve all tokens.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9bf2bbf565345af26b4c39da2258f6b45313897a">Mongolian synchronization previews and conflicts</a>. Thanks to xet7.</summary>

- Translate 34 synchronization preview, conflict and source field strings.
- Check retained card content, unchanged subcards, reused replacements and
  refreshed previews while preserving source substitution tokens.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/992f84131fb4739c0d752da375663015c0bd79d1">Mongolian sync diagnostics and email queue messages</a>. Thanks to xet7.</summary>

- Translate 32 synchronization diagnostic and email queue placeholders.
- Check retention limits, missing versus null values, hidden email content
  and delivery warnings while preserving source substitution tokens.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19a37f1003c0b6942f9913eebc4f703b73b20075">Mongolian delivery failures and recovery controls</a>. Thanks to xet7.</summary>

- Translate 32 email delivery, time estimate and activity recovery strings.
- Check irreversible cancellation, retained new messages, SMTP failure
  types and activity retries while preserving source substitution tokens.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92c8ba172417404d00f3f3bdfe68f2c5c36f00e5">Mongolian recovery messages and prose placeholder completion</a>. Thanks to xet7.</summary>

- Translate the remaining 37 Mongolian recovery and history placeholders.
- Retain 28 physical key labels, platform names and code terms explicitly.
- Check all Mongolian keys and tokens, cancellation warnings and retry
  behavior; the placeholder report now contains no untranslated prose.
- Translation, language registration and human-preference checks pass.
  Browser and older linguistic review remain; wider translation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/106617b8dd8fecd4c3e236f7ae57522367d542ed">Telugu filters and board access messages</a>. Thanks to xet7.</summary>

- Translate 30 Telugu filter, archive, import and board access placeholders.
- Check date syntax, template exceptions and signed-in access boundaries
  while preserving source substitution tokens and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eac93bb32393b206c2f4b1c9290391aa8e054741">Telugu automation and notification messages</a>. Thanks to xet7.</summary>

- Translate 35 automation, notification and saved filter placeholders.
- Check template variables, action order, reminder timing and notification
  exceptions while preserving existing translations and source tokens.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d58a3e5ca90c8643301b56e5402dae5d8fc32da6">Telugu map views and editor announcements</a>. Thanks to xet7.</summary>

- Translate 39 saved filter, map and editor accessibility placeholders.
- Check private filters, map permissions, movement directions and expansion
  controls while preserving source tokens and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c08b9df22e7640028f5bc7c20a61a27d3b484478">Telugu editor labels and loop warnings</a>. Thanks to xet7.</summary>

- Translate 40 editor field, block and loop warning placeholders.
- Check protected variables, loop-only blocks and break versus continue
  while preserving source substitution tokens and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3935271838446e61aaa4db303a2969d68bb1b36d">Telugu conditional controls and editor inputs</a>. Thanks to xet7.</summary>

- Translate 35 conditional control and editor input placeholders.
- Check branches, deletion counts, bitmap dimensions and keyboard help
  while preserving source substitution tokens and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e24d6bd3a23659dcb91851231b37664a985fe012">Telugu field and accessibility labels</a>. Thanks to xet7.</summary>

- Translate 50 editor input and accessibility placeholders.
- Check arithmetic operands, positions, bounds and warning controls while
  preserving source substitution tokens and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a43ace68e19eb0df0b1129723d124f1494ba759f">Telugu navigation and list operations</a>. Thanks to xet7.</summary>

- Translate 38 navigation, input and list operation placeholders.
- Check retrieval versus removal, sublist copies and keyboard confirmation
  while preserving source substitution tokens and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3961e75a780f4457c80dcf158772d37f2cd183ae">Telugu list transformations and logic labels</a>. Thanks to xet7.</summary>

- Translate 43 list transformation and logic placeholders.
- Check copied lists, insertion versus assignment, missing-item results
  and comparisons while preserving tokens and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64434bf9165d15c5f038b9b039680214ecf63329">Telugu logic and arithmetic messages</a>. Thanks to xet7.</summary>

- Translate 37 logic and arithmetic placeholders.
- Check Boolean operations, conditional labels, inclusive bounds, constants
  and remainders while preserving tokens and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03597b4466406b0473458a59abc830f3a43b56aa">Telugu statistical and numerical operations</a>. Thanks to xet7.</summary>

- Translate 37 statistical and numerical operation placeholders.
- Check random bounds, mean and median, modes, logarithms and rounding
  while preserving source substitution tokens and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96be9f42083dec880920e1c9794c44ca19c406a7">Telugu function and trigonometry messages</a>. Thanks to xet7.</summary>

- Translate 37 function, trigonometry and editor placeholders.
- Check degree units, disabled functions and return values while preserving
  source substitution tokens and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64682f0be35188f26ad5f531b527b0634ed1f893">Telugu shortcuts and screen reader messages</a>. Thanks to xet7.</summary>

- Translate 46 shortcut, procedure and accessibility placeholders.
- Check screen reader toggles, variable renaming and navigation directions
  while preserving source substitution tokens and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b7619ccec6a595b3a9e92bab7598c98669ccd2a">Telugu text operations and character positions</a>. Thanks to xet7.</summary>

- Translate 34 text operation and shortcut placeholders.
- Check title case, character positions, missing-text results and spaces
  in text length while preserving tokens and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f296e32d3939eaf4a0516e13d08f1d416240878b">Telugu text editing and workspace messages</a>. Thanks to xet7.</summary>

- Translate 38 text editing, variable and workspace placeholders.
- Check replacement scope, copied text, variable conflicts and announcement
  spacing while preserving source tokens and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f883003505773faf792a479cb41e247d34004a7a">Telugu rule editor and planning messages</a>. Thanks to xet7.</summary>

- Translate 33 search, rule editor and planning placeholders.
- Check shortcuts, permissions, unsaved changes and conflicting edits.
- Update the README coverage count to 143 after Telugu crosses its existing
  threshold; untranslated Telugu strings still remain.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b7af520f731ddfbcc0b02bfae22249e002ef928">Telugu sprint planning and reporting messages</a>. Thanks to xet7.</summary>

- Translate 43 sprint planning and reporting placeholders.
- Check completion policies, unfinished work, time units and unknown
  estimates while preserving source tokens and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/941cdabf1220d18d83bd4ae153021bed2bf23342">Telugu sprint reports and synchronization warnings</a>. Thanks to xet7.</summary>

- Translate 30 sprint report and synchronization placeholders.
- Check partial observations, cancellation membership and the absence of
  source writes while preserving tokens and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ff2c9724eb5d7d98e8b462435161d5b47d6a5952">Telugu synchronization previews and conflicts</a>. Thanks to xet7.</summary>

- Translate 33 synchronization preview, conflict and source field strings.
- Check retained content, unchanged subcards, reused replacements and
  preview limits while preserving source tokens and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/38d3cf63f87a1259caa61d03664bc1420b7619dc">Translate Telugu synchronization diagnostics and email queue controls</a>. Thanks to xet7.</summary>

- Translate 28 synchronization report, recovery and email queue strings.
- Check report limits, retry warnings and hidden email fields while preserving
  placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b1527ec4a29e02c67f35ac2287bb5a01081c62db">Translate Telugu delivery failures and notification recovery</a>. Thanks to xet7.</summary>

- Translate 63 email failure, activity recovery and time estimate strings.
- Check cancellation boundaries, retained work and missing versus null values,
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser review was not run; the wider translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a0ad3a591f487bfe77e273e401a3bb74b3456d2">Complete Telugu prose placeholders and correct Blockly null label</a>. Thanks to xet7.</summary>

- Translate the final 13 Telugu prose placeholders and correct the null label.
- Preserve physical key legends, platform names and mathematical notation.
  Check all Telugu placeholder inventories and prevent untranslated prose.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/81a7e3447c714a4adebdd7e00e03d049275e76e1">Translate Pashto date filters and archive controls</a>. Thanks to xet7.</summary>

- Translate 25 Pashto date filter, automatic archive and Leo import strings.
- Check inclusive dates, template exclusions and literal query syntax while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8411c13755649cf70d76bb3a7e12489cb41de96e">Translate Pashto board access and activity notifications</a>. Thanks to xet7.</summary>

- Translate 25 Pashto board access, rule and notification strings.
- Check access restrictions, variable tokens and notification exceptions while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6e11c45588081ae82af3e00b3d315ff2ec74db57">Translate Pashto reminders and saved filters</a>. Thanks to xet7.</summary>

- Translate 30 Pashto reminder, filter, import warning and map strings.
- Check reminder timing, private filters and literal URL variables while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b89ce7aa77401d4ef46fb91afaca3510cccf8545">Translate Pashto map and block accessibility controls</a>. Thanks to xet7.</summary>

- Translate 34 Pashto map and block accessibility strings.
- Check movement placeholders and opposite control labels while preserving
  existing translations and literal keyboard legends.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64b093b2715fecc4a8fb32f382c77c914dedaf13">Translate Pashto block labels and loop controls</a>. Thanks to xet7.</summary>

- Translate 37 Pashto block label, colour and loop control strings.
- Check variable tokens, colour ranges and loop exit versus continuation while
  preserving existing translations and literal keyboard legends.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8b29da92510106f28e39567c7df8c7f37c521e1">Translate Pashto conditionals and pixel controls</a>. Thanks to xet7.</summary>

- Translate 29 Pashto conditional, clipboard and pixel control strings.
- Check true and false conditions, deletion counts and pixel coordinates while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09bd2ebfecd64c129872db217ed419fe2bd4ab87">Translate Pashto editor and list field labels</a>. Thanks to xet7.</summary>

- Translate 32 Pashto editor and list field labels.
- Check opposite controls, condition order and list positions while preserving
  placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b507b050523c595b23d8b809cbbe8681391fe42">Translate Pashto number and text input labels</a>. Thanks to xet7.</summary>

- Translate 34 Pashto number, text and loop input labels.
- Check coordinate names, division operands and opposite bounds while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/98ec420e52f74547facfee24692608f4e4dbd098">Translate Pashto navigation and list operations</a>. Thanks to xet7.</summary>

- Translate 32 Pashto navigation and list operation strings.
- Check reading versus removing list items and keyboard movement placeholders
  while preserving existing translations and literal keyboard legends.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53e0e1cccb5712c40cbb185eaa964a2446f4bf67">Translate Pashto list editing and sorting</a>. Thanks to xet7.</summary>

- Translate 32 Pashto list editing and sorting strings.
- Check copy semantics, missing-item results and insertion versus replacement
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8c07192b70a34f291e153a1f31c2494347db69a">Translate Pashto logic and arithmetic help</a>. Thanks to xet7.</summary>

- Translate 27 Pashto list, logic and arithmetic strings.
- Check comparison boundaries, conditional labels and coordinate ranges while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/259904bd53e3aebd36b6d9308ad172cad15d48c6">Translate Pashto mathematical labels and constants</a>. Thanks to xet7.</summary>

- Translate 25 Pashto mathematical labels and help strings.
- Check constants, inclusive limits and distinct statistical labels while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/891bf1b238e086eccae6c96b514f76e3cf555590">Translate Pashto statistics and number operations</a>. Thanks to xet7.</summary>

- Translate 30 Pashto statistics and number operation strings.
- Check random-number boundaries, rounding directions and negation while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8148748df401e7285613d2979249e849bcbe58f">Translate Pashto trigonometry and function controls</a>. Thanks to xet7.</summary>

- Translate 28 Pashto trigonometry, workspace and function strings.
- Check angle units, returned outputs and disabled definitions while preserving
  placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bfbd5e9cdaa56fdae8429fd9a028aecb9fc1dcd6">Translate Pashto function and accessibility shortcuts</a>. Thanks to xet7.</summary>

- Translate 29 Pashto function, screen-reader and shortcut strings.
- Check screen-reader toggles, movement controls and function outputs while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb731991a8240a21276c14fef96a2ac9dc911752">Translate Pashto navigation and text controls</a>. Thanks to xet7.</summary>

- Translate 32 Pashto navigation and text control strings.
- Check movement directions, next and previous controls and text case while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6136d045f13ca0706f2f3dc0377b87f20aa52f4">Translate Pashto text operations and indexing</a>. Thanks to xet7.</summary>

- Translate 30 Pashto text operation and indexing strings.
- Check search direction, missing-text results and spaces in text length while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9377b821372f10504d7f8bd0228ef7e10be9f492">Translate Pashto text and workspace controls</a>. Thanks to xet7.</summary>

- Translate 29 Pashto text, variable and workspace strings.
- Check replacement arguments, trimming directions and comment spacing while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1546f9f1cfe18419fcafb14b875d6d2744e5fe40">Translate Pashto workspace and rule editor messages</a>. Thanks to xet7.</summary>

- Translate 28 Pashto workspace and rule editor strings.
- Check search shortcuts, administrator access and rule validation while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/571d9fb5274e55eba9c6923fa904b5e4a8aad419">Translate Pashto Scrum planning controls</a>. Thanks to xet7.</summary>

- Translate 36 Pashto Scrum planning strings.
- Check shared backlog labels, sprint actions and completion policies while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8929af9198aff5c1bc41d9c3da1785eadfc47136">Translate Pashto sprint reporting</a>. Thanks to xet7.</summary>

- Translate 30 Pashto sprint report and state strings.
- Check unknown estimates and card membership after sprint cancellation.
  Update the README count as Pashto passes the 90 percent coverage threshold.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d54532ff2388f74f6ab8edadb7157be39cad51b4">Translate Pashto observation reports and sync warnings</a>. Thanks to xet7.</summary>

- Translate 21 Pashto reporting and synchronization strings.
- Check UTC observations, restricted report scope and source-system boundaries
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68e247396a44db3c2acfa4a8bbb58cf576b081f4">Translate Pashto synchronization conflicts and previews</a>. Thanks to xet7.</summary>

- Translate 25 Pashto synchronization conflict and preview strings.
- Check retained local cards, unchanged subcards and replacement reuse while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4dd15f3b667b072bc70e38b751aa8ac84006978">Translate Pashto synchronization diagnostics</a>. Thanks to xet7.</summary>

- Translate 25 Pashto synchronization diagnostic strings.
- Check report retention, hidden values and recovery limitations while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba624a95a8ee050521498daabf81dd161b13bae4">Translate Pashto recovery and email queue controls</a>. Thanks to xet7.</summary>

- Translate 20 Pashto recovery and email queue strings.
- Check missing versus null values, delivery warnings and paused retries while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/836e5331d8622f5d21cf6c94d1c6b87edcdd2330">Translate Pashto delivery failures and recovery warnings</a>. Thanks to xet7.</summary>

- Translate 23 Pashto delivery failure and recovery strings.
- Check cancellation boundaries, failure types and activity retry limits while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d72a35d3d2a13a38a34dccb6454bc03269e07a5">Translate Pashto notification recovery controls</a>. Thanks to xet7.</summary>

- Translate 26 Pashto notification recovery strings.
- Check retained work, permanent cancellation and delivery restrictions while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8214a341230ffdcc61fc4ca07dac47e8ff76f1f3">Complete Pashto prose placeholders</a>. Thanks to xet7.</summary>

- Translate the final 17 Pashto prose placeholders.
- Preserve keyboard legends, platform names and inverse-trig notation.
  Check all Pashto placeholder inventories and prevent untranslated prose.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ee1a1e75a944437c44abb4485ed531eb1516ca2">Translate Punjabi date filters and archive controls</a>. Thanks to xet7.</summary>

- Translate 25 Punjabi date filter, automatic archive and Leo import strings.
- Check inclusive dates, template exclusions and literal query syntax while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b4725042c99e09cecc0229b67fe8ab3b9e933c87">Translate Punjabi access and notification controls</a>. Thanks to xet7.</summary>

- Translate 25 Punjabi access, rule and notification strings.
- Check variable tokens, editing restrictions and notification exceptions while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2393ed5c53a3dd810ed90d10cf2a7d5183ddf200">Translate Punjabi reminders and saved filters</a>. Thanks to xet7.</summary>

- Translate 30 Punjabi reminder, filter, import warning and map strings.
- Check reminder timing, private filters and literal URL variables while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7deb6015f4eba6703c092f769a086e289216c805">Translate Punjabi map and block accessibility controls</a>. Thanks to xet7.</summary>

- Translate 35 Punjabi map and block accessibility strings.
- Check movement placeholders and opposite control labels while preserving
  existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b0487c9b842eec499d8a2452a91b49a9834aa2c4">Translate Punjabi block labels and loop controls</a>. Thanks to xet7.</summary>

- Translate 31 Punjabi block label and loop control strings.
- Check variable deletion restrictions, loop scope and iteration behavior while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/08a4bfb223659257f38f6464905bf03638b9b438">Translate Punjabi conditionals and pixel controls</a>. Thanks to xet7.</summary>

- Translate 27 Punjabi conditional, clipboard and pixel control strings.
- Check true and false conditions, deletion counts and pixel coordinates while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/deb0f10a7f3004398d82d4fa44f154350d1e5aca">Translate Punjabi editor and list field labels</a>. Thanks to xet7.</summary>

- Translate 31 Punjabi editor and list field labels.
- Check opposite controls, condition order and list positions while preserving
  placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37027278e193344ca9a088b61f77d55779db43bf">Translate Punjabi number and text input labels</a>. Thanks to xet7.</summary>

- Translate 34 Punjabi number, text and loop input labels.
- Check coordinate names, division operands and opposite bounds while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1042dc1edfbee41f8b0af6fea75d09e3a0600965">Translate Punjabi navigation and list operations</a>. Thanks to xet7.</summary>

- Translate 30 Punjabi navigation and list operation strings.
- Check reading versus removing list items and keyboard movement placeholders
  while preserving existing translations and literal keyboard legends.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c5e1f607af9202800662ab002a45c1310349069">Translate Punjabi list editing and indexing</a>. Thanks to xet7.</summary>

- Translate 30 Punjabi list editing and indexing strings.
- Check copy semantics, missing-item results and insertion versus replacement
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49cc4c407e066b19ee3b9c9356866de1dbb933dd">Translate Punjabi sorting and logic controls</a>. Thanks to xet7.</summary>

- Translate 29 Punjabi sorting and logic strings.
- Check comparison boundaries, conditional labels and copy behavior while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/97487c53a662d122ac906903dfea946e22a5e942">Translate Punjabi arithmetic and mathematical constants</a>. Thanks to xet7.</summary>

- Translate 27 Punjabi arithmetic and mathematical strings.
- Check constants, coordinate ranges and inclusive limits while preserving
  placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae96220512b8a668a4b0522a4ffda9f2ce1c374d">Translate Punjabi statistics and number operations</a>. Thanks to xet7.</summary>

- Translate 30 Punjabi statistics, random-number and rounding strings.
- Check inclusive and exclusive bounds, rounding directions and placeholders
  while preserving existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ccf8bad21fec8de048471585d0cb3e0529b3cd98">Translate Punjabi mathematical functions and block controls</a>. Thanks to xet7.</summary>

- Translate 45 Punjabi logarithm, trigonometry, variable and function strings.
- Check angle units, inverse functions and disabled-function warnings while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d63faec533b28931f731762a46165f518821710">Translate Punjabi function definitions and keyboard navigation</a>. Thanks to xet7.</summary>

- Translate 44 Punjabi function, screen-reader and navigation strings.
- Check output distinctions, mode toggles and movement directions while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8646402b970d1554fcf2a61d7f0e336250d1a2d">Translate Punjabi text operations and scrolling shortcuts</a>. Thanks to xet7.</summary>

- Translate 42 Punjabi text-operation and scrolling strings.
- Check letter case, text positions and reordered placeholders while
  preserving existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c45e1ad4129a152bdd3ad87ea9aaf100f7a4d3f2">Translate Punjabi text handling and workspace messages</a>. Thanks to xet7.</summary>

- Translate 41 Punjabi text, variable and workspace strings.
- Check replacement arguments, trimming directions and comment fragments
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a2c8d4fb77ad1af5285a9ac4f0bd85e1615f964">Translate Punjabi block rules and planning labels</a>. Thanks to xet7.</summary>

- Translate 36 Punjabi search, block-rule and planning strings.
- Check search keys, rule constraints and reload instructions while
  preserving placeholders and existing translations.
- Update the README count to 145 locales above 90% translated strings.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0daa15a78aeb7406d8741d0727e402e75811607d">Translate Punjabi sprint planning and event labels</a>. Thanks to xet7.</summary>

- Translate 36 Punjabi sprint-planning, completion-policy and event strings.
- Check sprint actions, unfinished work and planned or active assignments
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c9bd621065bda4c1ab3f78d39eded9e7da4345d8">Translate Punjabi sprint reports and observation guidance</a>. Thanks to xet7.</summary>

- Translate 36 Punjabi sprint-report and daily-observation strings.
- Check unknown estimates, partial reports and observation limits while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5cbe3caf696c50c1d7ae9a4d3319588374402e06">Translate Punjabi sync conflicts and previews</a>. Thanks to xet7.</summary>

- Translate 30 Punjabi sync-conflict and preview strings.
- Check local content retention, unchanged subcards and source distinctions
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b7c03322b82bc41538264012fc01aca091f0be65">Translate Punjabi sync diagnostics and estimate guidance</a>. Thanks to xet7.</summary>

- Translate 30 Punjabi sync-report, parser and estimate-field strings.
- Check retention limits, report limitations and missing versus null values
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0b3ba0ce625e078354687c3c2552ce22b489f37">Translate Punjabi email queue and delivery messages</a>. Thanks to xet7.</summary>

- Translate 30 Punjabi email-queue controls and delivery-failure strings.
- Check distinct failure and pause states, language and placeholders while
  preserving existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21c15e550787e786dbfc704fb5ffde47ee5439ca">Translate Punjabi activity recovery and time estimates</a>. Thanks to xet7.</summary>

- Translate 30 Punjabi notification-recovery and time-estimate strings.
- Check retained pending work, retry limitations and null handling while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67d6cd437233ca534c96ea8b37a0801074b7be36">Complete Punjabi prose placeholder translations</a>. Thanks to xet7.</summary>

- Translate the final 20 Punjabi recovery, sign-in and history placeholders.
- Retain physical key legends, platform names and mathematical notation.
  The placeholder report is empty; existing translations are preserved.
- Check all source keys and placeholders, plus cancellation and retry wording.
  Translation, language registration and human-preference checks pass.
- Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd84ca22522f515f8bb76f4f3adcca76d2d91260">Translate Malayalam date filters and archival guidance</a>. Thanks to xet7.</summary>

- Translate 25 Malayalam date-filter, archival and import strings.
- Check query syntax, inclusive dates and archival exceptions while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d893464332136940319e70d454b4000d430958ee">Translate Malayalam access and notification settings</a>. Thanks to xet7.</summary>

- Translate 30 Malayalam access, rule-variable and notification strings.
- Check variable tokens, markup, URL schemes and reminder timing while
  preserving existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec80ba52b72c2012933e81e376fae6ee36dcf35c">Translate Malayalam saved filters and map controls</a>. Thanks to xet7.</summary>

- Translate 29 Malayalam reminder, saved-filter, import and map strings.
- Check reminder limits, replacement behavior and formatting tokens while
  preserving existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76f6f8ca251f3c67b79d5d9bc089b0193d097519">Translate Malayalam block movement and accessibility labels</a>. Thanks to xet7.</summary>

- Translate 31 Malayalam Blockly movement and accessibility strings.
- Check movement directions, add/remove controls and placeholders while
  preserving existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed2e53b021631d359df534fcf1e44c887f82a3c3">Translate Malayalam block labels and colour controls</a>. Thanks to xet7.</summary>

- Translate 31 Malayalam block-label, warning and colour-control strings.
- Check numeric ranges, variable-deletion warnings and placeholders while
  preserving existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ea749e8f4e4ef7c3bb43169aec3abd20e3c7c81">Translate Malayalam control flow and editing actions</a>. Thanks to xet7.</summary>

- Translate 32 Malayalam loop, condition and editing strings.
- Check while/until conditions, loop restrictions and deletion tokens while
  preserving existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/72fb675a84d7843722ea9335ceaefb07f8351e7a">Translate Malayalam block editors and pixel controls</a>. Thanks to xet7.</summary>

- Translate 28 Malayalam editor, pixel-control and icon-label strings.
- Check coordinates, open/close actions and enable/disable labels while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1b0588e87c0f6db42c453eea5fc172589cd1d0a">Translate Malayalam list and numeric input labels</a>. Thanks to xet7.</summary>

- Translate 32 Malayalam list, loop and numeric input labels.
- Check division terminology, coordinates and list positions while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5efeaf5406edad3045604b116bca3ac856ece0ad">Translate Malayalam values and keyboard navigation</a>. Thanks to xet7.</summary>

- Translate 30 Malayalam value, text-input and keyboard-navigation strings.
- Check key placeholders, copy/cut messages and empty-list wording while
  preserving existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b1d0c6a64815a083c92e02a0c61a8c1b540dd42">Translate Malayalam list retrieval and removal</a>. Thanks to xet7.</summary>

- Translate 30 Malayalam list creation, retrieval and removal strings.
- Check retrieval versus removal, sublist copies and index positions while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ac0de09b2ad0ccbc0e235a96b6287c886faa10f">Translate Malayalam list editing and sorting</a>. Thanks to xet7.</summary>

- Translate 30 Malayalam list-search, insertion and sorting strings.
- Check insertion versus replacement, search failures and copies while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/246fa4de79771b328a6dc9dff34b9ec538a66289">Translate Malayalam logic and comparison blocks</a>. Thanks to xet7.</summary>

- Translate 29 Malayalam split/join, boolean and comparison strings.
- Check inclusive comparisons, AND/OR conditions and ternary labels while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b27d3763a5870556b493c6dd7284f26f0c02f35">Translate Malayalam arithmetic and mathematical constants</a>. Thanks to xet7.</summary>

- Translate 29 Malayalam arithmetic, constant and number-property strings.
- Check mathematical notation, angle ranges and inclusive limits while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4268efcbcc720766e11500da9d6a1591791cfed8">Translate Malayalam statistics and rounding controls</a>. Thanks to xet7.</summary>

- Translate 30 Malayalam statistics, random-number and rounding strings.
- Check range boundaries, rounding directions and statistical terms while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b87d248745e2740da2872e8e950a285420371e83">Translate Malayalam mathematical functions and workspace controls</a>. Thanks to xet7.</summary>

- Translate 32 Malayalam mathematical-function and workspace strings.
- Check inverse functions, angle units and sign changes while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0de24b65703677ad12e914541c9b1f32ba7cd2a8">Translate Malayalam procedures and screen reader controls</a>. Thanks to xet7.</summary>

- Translate 30 Malayalam function, variable and screen-reader strings.
- Check output distinctions, disabled functions and mode toggles while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9abbd121639a3c0fdb46e9d777e283cb46406600">Translate Malayalam keyboard shortcut labels</a>. Thanks to xet7.</summary>

- Translate 33 Malayalam keyboard-navigation and shortcut strings.
- Check movement directions, navigation order and cancel/finish actions
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cbf98d3850bf74e45b5c41a47e8a4c4f0c9f3c44">Translate Malayalam text operations and remaining shortcuts</a>. Thanks to xet7.</summary>

- Translate 33 Malayalam text-operation and shortcut strings.
- Check character positions, title case and reordered placeholders while
  preserving existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dcab4ac25a3201d40e30fd7aae6548100714d3c4">Translate Malayalam text handling and variable actions</a>. Thanks to xet7.</summary>

- Translate 31 Malayalam text-handling and variable-action strings.
- Check replacement arguments, trimming directions and space counts while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f80a956fded75ba5776297d8ce8b92c865c3b04">Translate Malayalam workspace search and variable messages</a>. Thanks to xet7.</summary>

- Translate 30 Malayalam workspace, search and variable strings.
- Check search keys, comment fragments and consistent function labels while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ad523a418fdd1cf8553dacebf54d22ea660a56d4">Translate Malayalam block rules and planning settings</a>. Thanks to xet7.</summary>

- Translate 30 Malayalam block-rule and planning-setting strings.
- Check permissions, reload instructions and completion policies while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6d25dce63cd42137e60d7ecfba1f51b2442772c">Translate Malayalam sprint planning and events</a>. Thanks to xet7.</summary>

- Translate 32 Malayalam sprint-planning, event and work-scope strings.
- Check sprint actions, unfinished work and time units while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f2f9714b298fa00ad9c576ba5b73f64367d7637">Translate Malayalam sprint reports and observations</a>. Thanks to xet7.</summary>

- Translate 30 Malayalam sprint-report and daily-observation strings.
- Check unknown estimates, retained membership and observation limits while
  preserving placeholders and existing translations.
- Update the README count to 146 locales above 90% translated strings.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/854cb69d37e38c9cdfdce437d343333192ba6b51">Translate Malayalam sync conflicts and previews</a>. Thanks to xet7.</summary>

- Translate 30 Malayalam sync-conflict, preview and reporting strings.
- Check retained content, unchanged subcards and source-system boundaries
  while preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd1f81233e960751af1dea0943a09ce2015741dc">Translate Malayalam sync reports and diagnostics</a>. Thanks to xet7.</summary>

- Translate 30 Malayalam sync-report and parser-diagnostic strings.
- Check retention limits, report limitations and consistent labels while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c78297f8365a13961c1abf3610c894a91c459e8">Translate Malayalam email queue controls and guidance</a>. Thanks to xet7.</summary>

- Translate 20 Malayalam email-queue and estimate-field strings.
- Check retry guidance, pause behavior and explicit null handling while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af0bdfb1ff3e61b85e9e290014d869efaf42aa3e">Translate Malayalam delivery failures and activity recovery</a>. Thanks to xet7.</summary>

- Translate 30 Malayalam delivery-failure, recovery and time-estimate strings.
- Check failure types, cancellation effects and retry limitations while
  preserving placeholders and existing translations.
- Translation, language registration and human-preference checks pass.
  Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba074895d2d4eb3757157f55fb3e5bfb6f480fd7">Complete Malayalam prose placeholder translations</a>. Thanks to xet7.</summary>

- Translate the final 32 Malayalam recovery, sign-in and history placeholders.
- Retain physical key legends, platform names and mathematical notation.
  The placeholder report is empty; existing translations are preserved.
- Check all source keys and placeholders, plus cancellation and retry wording.
  Translation, language registration and human-preference checks pass.
- Browser and native-speaker review were not run.
  The wider translation work remains.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.
