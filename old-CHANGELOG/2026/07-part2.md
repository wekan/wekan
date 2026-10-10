# WeKan ® 2026-07 releases, part 2

Moved out of [CHANGELOG.md](../../CHANGELOG.md) to keep that
file small enough to open (wekan/wekan#6580). Nothing here has been changed:
a release section is a record, and it reads the same as it did there.

This is part 2 of 2, newest first: [1](07.md), 2.

Releases per day:

| 2026-07 | Releases |
| --- | --- |
| 05 | 2 |
| 06 | 5 |
| 09 | 3 |
| 11 | 4 |
| 13 | 2 |
| 15 | 6 |
| 16 | 1 |
| 17 | 1 |

# v9.97 2026-07-17 WeKan ® release

This release adds the following new features:

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6473">Snap: SELF-HEALING attachments — the fixes below apply themselves automatically on upgrade, no…</a> Thanks to mueschel and xet7.</summary>

**Snap: SELF-HEALING attachments — the fixes below apply themselves
automatically on upgrade, no commands needed** ( #6473 ,
`snap-src/bin/attachment-repair` (new), `snap-src/bin/wekan-control`,
`snap-src/bin/migration-control`, `snap-src/bin/wekan-force-migrate`,
`releases/migrate-mongodb-to-ferretdb.mjs`,
`snap-src/bin/migrate-mongo3-to-ferretdb.mjs`, `snapcraft.yaml`,
`snapcraft-core26.yaml`). The snap auto-refreshes on ~15k servers, so a fix that
needs `snap run wekan.migrate` typed by hand does not reach most of them — and a
full re-migration would be WRONG anyway, because it rebuilds FerretDB from the
frozen MongoDB source and would lose boards/cards users created on FerretDB
since migrating. Instead, on every start on FerretDB, `wekan-control` now
launches `attachment-repair` in the **background**: it starts a temporary source
mongod (7.x or the bundled 3.2 reader — the MongoDB data was never modified, so
everything is recoverable) and runs the migration importer in a new
**incremental FILES_ONLY mode** that **checks what is already migrated and
migrates only what is missing**: text collections are never touched, every
attachment/ avatar whose target record is on `fs` with the file actually on disk
is verified and skipped, records deleted by users since the migration are never
resurrected, and only the missing binaries/records are extracted — so on healthy
servers the repair is a fast no-op and on #6473-affected servers the attachments
simply appear, live, while WeKan runs. It runs **once** (marker
`$SNAP_COMMON/.attachments-files-v2-done`; a fresh successful migration
pre-writes it, `snap run wekan.migrate` clears it, failures retry on the next
start without ever blocking WeKan from starting), and a manual `snap run
wekan.repair-attachments` command is registered too. The importer itself now
stamps the migration marker with `filesVersion` (currently 2) and, when it finds
a marker with an older `filesVersion` — or `FILES_ONLY=true` in the environment
— automatically switches to this incremental repair, so **Docker/source installs
get the same self-healing** by simply re-running the same importer command they
migrated with. Verified end-to-end against two live FerretDB instances with the
real importer: a broken-migration target (missing CollectionFS record,
gridFsFileId-only record, marker without filesVersion) was repaired — record
re-created with its card linkage, binary extracted, record repointed — while a
board renamed on FerretDB after the migration stayed untouched, and the second
run exited immediately as already-migrated. Behavioral tests (positive +
negative) drive the real bash script with stubbed snap tooling:
`tests/attachmentRepair.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/1971">All platforms: startup schema upgrade — WeKan now CHECKS on start that data from EVERY old WeKan…</a> Thanks to mueschel and xet7.</summary>

**All platforms: startup schema upgrade — WeKan now CHECKS on start that data
from EVERY old WeKan version has been migrated to the newest database structure,
and migrates only what is missing**
([#6473](https://github.com/wekan/wekan/issues/6473) follow-up,
[#1959](https://github.com/wekan/wekan/issues/1959), #1971 ,
`server/lib/schemaUpgradeSteps.js` (new), `server/startupSchemaUpgrade.js`
(new), `server/migrations/ensureValidSwimlaneIds.js`, `server/imports.js`).
WeKan v0.9–v8.00 ran startup migrations; v8.01 disabled them (large databases
meant long downtime) in favour of read-time compatibility — which covers the
swimlane era but not everything, so text data from old versions could sit
invisible in the database. The new startup upgrade reinstates the safety net
without the downtime: **version-gated** (the `_wekan_migration` marker stores
the WeKan version and datetime of the previous successful re-check, so while the
version is unchanged a boot costs ONE `findOne` — a full re-check is mandatory
only after a new WeKan release, or `WEKAN_FORCE_SCHEMA_UPGRADE=true`; opt out
with `WEKAN_SKIP_SCHEMA_UPGRADE=true`), **non-blocking** (runs in the
background, WeKan serves immediately), with a **live migration dashboard at
`/schema-upgrade-status`** on every platform that shows the Admin Panel product
name when one is set (not "WeKan") plus per-step progress, and **fast on big
databases** (bounded existence probes, `distinct()` set-joins instead of card
scans, and server-side `updateMany` batches instead of per-document round trips
— thousands of cards never mean thousands of queries). Steps, each verified
against `git show v8.00:server/migrations.js` and each idempotent:
`archived-flag-backfill` (docs missing `archived` never match the `archived:
false` view queries — whole boards/lists/cards were invisible in the Swimlanes
and Lists views), `swimlane-structure` (every board gets a visible swimlane,
every list/card a `swimlaneId`, cards with a dangling `listId` are rescued to a
visible list — and, fixing #1959 and #1971, unarchived cards whose swimlane was
DELETED, ARCHIVED or belongs to another board are reassigned to the board's
first visible swimlane, so everything is visible in both the Swimlanes view and
the Lists view; the card-insert hook now also validates client-supplied
swimlaneIds so new cards can never land under a deleted/archived swimlane
again), `checklist-items-embedded` (pre-v0.79 embedded `checklist.items[]`
extracted to the `ChecklistItems` collection — the text was in the database but
never shown), `customfields-boardIds` (pre-v2.49 scalar `boardId` → `boardIds`
array — old custom field definitions and their card values were orphaned),
`board-allows-defaults` (the ~33 defaultValue-true `allows*` flags backfilled —
a missing flag rendered as false and HID existing
descriptions/checklists/comments/attachments), `board-members-isactive` (members
without `isActive` were denied board access), `board-permission-lowercase`
('PUBLIC' boards had silently become member-only), and `fs-path-heal`
(filesystem attachments/avatars whose recorded path predates the current
WRITABLE_PATH layout — v6.10-18 `uploads/<coll>`, v6.19-v8.4x
`WRITABLE_PATH/<coll>`, CFS→ostrio temp files — are located and repointed/copied
into the current layout). A step that fails or leaves unresolved work never
blocks WeKan from starting and keeps the version un-stamped so the next boot
re-checks. 36+ unit tests with negative cases
(`tests/schemaUpgradeSteps.test.cjs`), plus verified end-to-end against a live
FerretDB (SQLite) with old-shape seed data: all 8 steps migrate correctly and
the second boot is gated to a no-op

</details>

<details>
<summary>Migration speed: batched writes and preloaded lookups instead of per-document round trips. Thanks to mueschel and xet7.</summary>

**Migration speed: batched writes and preloaded lookups instead of per-document
round trips** (5-hour migrations reported;
`releases/migrate-mongodb-to-ferretdb.mjs`). The text phase now copies each
batch with ONE unordered `insertMany` round trip (falling back to per-document
`replaceOne` upserts only for batches that hit duplicates on resumed/re-run
migrations), and the attachment/avatar phases preload the target's metadata
records once per bucket instead of one `findOne` per file (bounded: collections
over 100k records fall back to per-file lookups). The startup schema upgrade
uses the same philosophy (`distinct()`/`updateMany`).

</details>

and fixes the following bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/issues/5695">OAuth2/OIDC: OAUTH2_LOGIN_STYLE=redirect was ignored — a popup always opened</a>. Thanks to ArturRuta and xet7.</summary>

**OAuth2/OIDC: `OAUTH2_LOGIN_STYLE=redirect` was ignored — a popup always
opened** ( #5695 , `packages/wekan-oidc/oidc_client.js`,
`server/authentication.js`, `server/models/settings.js`,
`client/components/main/layouts.js`). The setting was stored correctly in the
OIDC service configuration, but the login button always passed `loginStyle:
'popup'`, and Meteor's `OAuth._loginStyle` gives the caller's option precedence
— so the admin's redirect setting silently lost on every login (and the
Meteor-internal `loginStyle` option even leaked into the provider's
authorization URL). The client now honors a configured `loginStyle: 'redirect'`
over the button's generic popup default (explicit caller choices still win;
Safari-private-mode popup fallback kept) and no longer leaks the option to the
provider. Also repaired the existing `OIDC_REDIRECTION_ENABLED=true` "go
straight to the provider" feature, which was doubly broken since the Meteor 3
port: `isOidcRedirectionEnabled` inspected a Promise (always false), and the
client handler assigned an undeclared variable (strict-mode ReferenceError).
Behavioral tests drive the real client code in a VM against Meteor's loginStyle
precedence: `tests/oauth2LoginStyle.test.cjs` (12 tests, positive + negative)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/1289">Deleting a user left "ghost users" on boards and cards</a>. Thanks to chotaire and xet7.</summary>

**Deleting a user left "ghost users" on boards and cards** ( #1289 ,
`models/users.js`, new `models/lib/userDeletionCleanup.js`): every deletion path
(admin method, self-service delete, `DELETE /api/users/:userId`) removed only
the user document, leaving dangling references — empty-avatar board members that
could not be removed, stale card members/assignees/watchers, orphaned avatar
files — reproducible for 8 years. A server-side `Users.after.remove` hook now
prunes `boards.members/watchers`, `cards.members/assignees/watchers`,
`lists.watchers` and the user's avatar files on every deletion path; activities
and comments are deliberately kept for history (their rendering is already
null-guarded). Tests: `tests/userDeletionCleanup.test.cjs` (6)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/2877">Swimlanes jumped up and down when starting/ending a card drag</a>. Thanks to xet7.</summary>

**Swimlanes jumped up and down when starting/ending a card drag** ( #2877 ,
`client/components/boards/boardBody.css`): drag start hid every list's "+ Add
Card" composer link with `display: none`, collapsing its row — lists shrank,
auto-height swimlanes shrank, and every swimlane below jumped up ~23px (and back
down on drop), shifting the drop target under the cursor mid-drag (root cause
proven by frame-diffing the issue's own GIF). The composer now hides with
`visibility: hidden`, keeping its layout box, so nothing moves; collapsed
multi-selection cards stay collapsed intentionally (they preview the post-drop
list). Tests: `tests/swimlaneDragJump.test.cjs` (8)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/443">Dragging a card toward an off-screen list never auto-scrolled the board</a>. Thanks to anhenghuang, AlexanderS and xet7.</summary>

**Dragging a card toward an off-screen list never auto-scrolled the board** ( #443 , `client/components/lists/list.js`, new `imports/lib/boardAutoScroll.js`):
the horizontal auto-scroll targeted `.board-canvas`, which only overflows
vertically since the swimlane layout — its scrollLeftMax was always 0, so the
guard never fired and users had to drop on an intermediate list and scroll by
hand. Edge-proximity auto-scroll now drives the `.js-lists` lane actually under
the pointer (clamped, overshoot-safe), with vertical scrolling kept on the
canvas. Tests: `tests/boardAutoScroll.test.cjs` (15, incl. a proof the old
no-overflow target could never scroll)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/2674">Board Rules: the Card Title Filter did nothing on several triggers — and rules created via the REST…</a> Thanks to InfoSec812, sfahrenholz and xet7.</summary>

**Board Rules: the Card Title Filter did nothing on several triggers — and rules
created via the REST API never fired at all**
([#2345](https://github.com/wekan/wekan/issues/2345), #2674 ,
`client/components/rules/triggers/boardTriggers.js`, `.jade`,
`server/rulesHelper.js`, `server/models/rules.js`, new
`models/lib/ruleCardTitleFilter.js`, `docs/API/Rules.md`,
`docs/API/REST-API.md`, `api.py`): the generic moved/archive trigger builders
never saved the filter (and a trigger doc MISSING the field can never satisfy
the matcher's `$in`, so those rules fired for nothing); a set filter never
showed in the rule details; archive activities carry no card title so their
filters compared against undefined; and REST-created rules skipped the wildcard
defaulting entirely — the exact "remove user when moved away" rule from #2674
silently never ran. Filters are now stored (empty → `*`), shown in the rule
description, matched with the title resolved from the card when the activity
lacks it, legacy field-less triggers keep matching, the API normalizes missing
matching fields to wildcards and validates types, and the rule actions no longer
crash on unresolvable usernames or member-less cards. The Rules REST API is now
documented (`docs/API/Rules.md`) and listed in api.py's help with the #2674
two-rule example. Tests: `tests/rulesCardTitleFilter.test.cjs` (12) and
`tests/rulesApiTriggerNormalize.test.cjs` (19)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/574">Sandstorm: username uniqueness probe was case-sensitive and raced concurrent logins</a>. Thanks to mitar and xet7.</summary>

**Sandstorm: username uniqueness probe was case-sensitive and raced concurrent
logins** ( #574 , `sandstorm.js`, new `models/lib/sandstormUsername.js`):
deriving `max`, `max1`, … from the preferred handle matched exact case only (an
existing `Max` did not stop a new `max`) and the check-then-set window let a
concurrent insert claim the name first, aborting the hook with E11000. The probe
is now an anchored, escaped, case-insensitive regex and the claim retries the
next number on a duplicate-key loss. Tests: `tests/sandstormUsername.test.cjs`
(11)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/619">Inviting a second user whose email shares a local part failed with a bare "403"</a>. Thanks to lemoer and xet7.</summary>

**Inviting a second user whose email shares a local part failed with a bare
"403"** ( #619 , `server/models/users.js`, new `models/lib/inviteeUsername.js`):
inviting `cats@foo.com` creates user "cats"; inviting `cats@facebook.com` then
crashed into Meteor's raw `403 Username already exists`. The invitee's username
now probes `cats`, `cats1`, `cats2`, … to the first free variant, and exhaustion
raises the translated `error-username-taken` instead of a number. Tests:
`tests/inviteeUsername.test.cjs` (11, incl. the literal reported scenario)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/1502">Date pickers ignored the configured default time and stored 12:00</a>. Thanks to Vlasterx, saschafoerster, suncobran and xet7.</summary>

**Date pickers ignored the configured default time and stored 12:00** ( #1502 ,
`client/lib/datepicker.js`, new `imports/lib/datePickerTime.js`): the due-date
picker configures a 17:00 default (and now() for received/start/end), but an
inverted guard applied it only when the card ALREADY had a date — exactly when
it is unnecessary — so empty time fields fell back to a hard-coded 12:00 on
save. The default now pre-fills empty pickers and backs the submit fallback;
existing dates keep their own time. The issue's original AM/PM parse mismatch
was already resolved by the native date/time inputs (79b94824e). Tests:
`tests/datePickerDefaultTime.test.cjs` (10)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/2769">Dragging a card while someone added a card to the target list dropped it into the WRONG swimlane</a>. Thanks to hever and xet7.</summary>

**Dragging a card while someone added a card to the target list dropped it into
the WRONG swimlane** ( #2769 , new `client/lib/cardDragGeometry.js`,
`client/components/lists/listBody.js`): jQuery UI sortable snapshots container
geometry at drag start; a mid-drag DOM insertion (another user's new card, or
the drag's own composer auto-close) shifted every swimlane below while the
cached rectangles stayed put — the drop landed in the neighbouring swimlane with
no visible placeholder. A MutationObserver now refreshes the active drag's
geometry on real mid-drag layout changes (sortable's own churn filtered out).
Tests: `tests/cardDragGeometry.test.cjs` (13)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/1992">Board import lost card dates</a>. Thanks to xet7.</summary>

**Board import lost card dates** ( #1992 , `models/wekanCreator.js`, new
`models/lib/importedCardDates.js`): the importer derived `createdAt` only from a
`createCard` activity (absent in Sandstorm/pruned exports — dates silently reset
to import time) and never imported `receivedAt`/`endAt` at all. All five date
fields now restore with sane fallbacks (activity → the card's own exported date
→ import time), and the card creator falls back to the exported userId. The
missing-cards half of the report was already fixed by 68e0032c6. Tests:
`tests/importedCardDates.test.cjs` (13)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/2292">Archiving a swimlane made its cards disappear — and restore brought back an empty swimlane</a>. Thanks to Cactusbone and xet7.</summary>

**Archiving a swimlane made its cards disappear — and restore brought back an
empty swimlane** ( #2292 , `models/swimlanes.js`, new
`models/lib/swimlaneArchive.js`): only the swimlane document was flagged; its
unarchived cards became invisible everywhere (board views render unarchived
swimlanes, Archive lists archived docs). Archiving a swimlane now archives its
cards (mirroring lists), and restore brings back exactly the cards archived WITH
it — individually archived cards stay archived. Tests:
`tests/archiveSwimlaneCards.test.cjs` (11)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/2494">"Move/Copy selection to board" wrote sort: NaN to every card</a>. Thanks to Vermeille and xet7.</summary>

**"Move/Copy selection to board" wrote `sort: NaN` to every card** ( #2494 ,
`imports/reactiveCache.js`): the client-side `noCache` card lookup returned a
PROMISE since the Meteor 3 port, so the max-sort read was `undefined` and every
moved card got NaN — cards appeared and disappeared and could not be reordered.
The uncached client path is synchronous minimongo again. Tests:
`tests/reactiveCacheNoCacheCard.test.cjs` (8, incl. a proof the pre-fix routing
yields NaN)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/1853">Subtask "View it" did nothing when the subtask lives on another board</a>. Thanks to Vanclief and xet7.</summary>

**Subtask "View it" did nothing when the subtask lives on another board** ( #1853 , `client/components/cards/subtaskViewHelpers.js`, `subtasks.js`): the
original crash (`board._id` of undefined) had become a silent no-op guard — when
the deposit board is not in minimongo the button just did nothing. Navigation
now falls back to the subtask's own boardId (the route loads the board), and
truly broken subtasks warn instead of dying. Tests:
`tests/subtaskViewNavigation.test.cjs` (11)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/1554">Labels/members could not be dragged onto cards added after the board rendered</a>. Thanks to Miffe and xet7.</summary>

**Labels/members could not be dragged onto cards added after the board
rendered** ( #1554 , `client/components/lists/list.js`): the
droppable-initializing autorun lost its reactive dependency in 7673c77c5 (2023),
so it ran once per list render and later-added minicards silently rejected
sidebar drags until the board was re-entered ("works after search-and-back").
Dependency restored via the ReactiveCache. Tests:
`tests/labelDragDroppable.test.cjs` (3)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/2306">"Add filtered cards to selection" swept cards from OTHER boards into bulk actions</a>. Thanks to IcedQuinn and xet7.</summary>

**"Add filtered cards to selection" swept cards from OTHER boards into bulk
actions** ( #2306 , `client/lib/filter.js`, `client/lib/multiSelection.js`, new
`models/lib/boardScopedSelection.js`): the filter selector carried no boardId,
and minimongo legitimately holds foreign-board cards (linked boards, dialogs,
notifications) — a bulk archive could silently mutate other boards. The
selection and its bulk-action selector are now board-scoped, and foreign ids are
rejected at insertion. Tests: `tests/boardScopedSelection.test.cjs` (17, incl.
the exact reported repro)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/1437">REST API: login tokens could never be revoked</a>. Thanks to ppouliot and xet7.</summary>

**REST API: login tokens could never be revoked** ( #1437 ,
`server/apiAuthRoutes.js`, new `models/lib/apiLogout.js`): every `POST
/users/login` minted another ~90-day resume token with no way to invalidate any
of them. New `POST /users/logout` revokes the presented token (or all of the
user's tokens with `{"all": true}`), always scoped to the authenticated user.
Tests: `tests/apiLogout.test.cjs` (12)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/2418">Editing one checklist item and clicking another left BOTH edit forms open — and submitting…</a> Thanks to Beebo89 and xet7.</summary>

**Editing one checklist item and clicking another left BOTH edit forms open —
and submitting overwrote the new item's title with the previous item's text** ( #2418 , `client/lib/inlinedform.js`, new `client/lib/inlinedFormManager.js`):
since a 2021 change, the "close the previously opened inline form" call was a
silent no-op (the escape action is disabled for click execution), and the submit
handlers grab the template's FIRST textarea — with two forms open the wrong
form's text was saved. Subtasks reproduced the full bug; checklists' workaround
corrupted the open-form tracker so Escape closed the whole card pane. A small
state manager restores the single-open-form invariant (opening a form closes the
previous one, without closing popups — preserving the 2021 intent). Tests:
`tests/inlinedFormSingleOpen.test.cjs` (9, incl. the exact reported repro chain)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/2989">Advanced Filter never matched date custom fields</a>. Thanks to k1ng440 and xet7.</summary>

**Advanced Filter never matched date custom fields** ( #2989 ,
`client/lib/filter.js`, new `imports/lib/advancedFilter.js`): the tokenizer
treated every `/` as a regex delimiter even inside quotes, so `'Date de fin' ==
'06/04/2020'` broke tokenizing and the filter silently did nothing; and date
custom fields store Date OBJECTS while the selectors compared strings/parseInt —
`==`/`<`/`>` could never match and `!=` matched everything. Dates typed in the
user's date format (day-first respected) now build half-open Date-range
selectors (`==` means "that day"), with the legacy behavior untouched for
non-date fields. Tests: `tests/advancedFilterDate.test.cjs` (14, incl. a proof
the old selector shape never matched a stored Date)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/3826">Cards could not be reordered by drag in lists full of subtask cards — with silent data loss on…</a> Thanks to jayki and xet7.</summary>

**Cards could not be reordered by drag in lists full of subtask cards — with
silent data loss on multi-selection drops** ( #3826 , `server/models/cards.js`,
`client/components/lists/list.js`, new `models/lib/cardSortRepair.js`):
`addSubtaskCard` inserted EVERY subtask card with the constant `sort: -1`, so
such lists contained only tied sorts; dropping between two equal sorts computes
a zero increment, the move modifier came out empty and the card snapped back —
and a multi-selection drop wrote the SAME sort to every selected card,
permanently destroying their order. Subtask cards now append with a unique sort,
and the drop handler detects degenerate (tied/inverted) gaps and repairs the
siblings' sorts to a strict order before recomputing the drop index. Tests:
`tests/subtaskCardReorder.test.cjs` (14)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/3453">Cross-board subtask full path disappeared after refresh</a>. Thanks to MPeti1 and xet7.</summary>

**Cross-board subtask full path disappeared after refresh** ( #3453 ,
`server/publications/boards.js`, new `server/lib/subtaskAncestors.js`): the
board publication shipped only the DIRECT parent cards, while the full-path
label walks the whole ancestor chain client-side — after F5 the grandparents
were missing from minimongo and the path truncated/vanished. The publication now
walks and publishes the full ancestor chain (batched per level, cycle-safe,
tolerant of deleted ancestors). Tests: `tests/subtaskAncestors.test.cjs` (11)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/3748">Linked cards: phantom empty custom-field rows and a template TypeError on every render</a>. Thanks to peterbecich and xet7.</summary>

**Linked cards: phantom empty custom-field rows and a template TypeError on
every render** (from #3748 , `models/cards.js`, new
`models/lib/customFieldsWD.js`): a linked card keeps the ORIGINAL board's
custom-field snapshot; unresolvable definitions rendered as empty `{}`
placeholders — a phantom row per entry and `Cannot read properties of undefined
(reading 'type')` from the card details template (also reachable on normal cards
with deleted definitions). Unmatched entries are now skipped. The rest of #3748
is by design: linked cards are pointers that mirror the original;
label/custom-field ids are board-scoped, and name-based inheritance is the COPY
feature. Tests: `tests/customFieldsWD.test.cjs` (9)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/3199">Archive sidebar: Restore/Delete links floated ambiguously between two archived cards</a>. Thanks to fxkr and xet7.</summary>

**Archive sidebar: Restore/Delete links floated ambiguously between two archived
cards** ( #3199 , `client/components/sidebar/sidebarArchives.jade`,
`sidebar.css`): each card and its links were loose siblings with near-equal
spacing above and below, so the links seemed to belong to the card underneath.
Each archived card is now grouped with its own links in one container with a
clear separator gap below (RTL-safe logical properties, theme-neutral). Tests:
`tests/archiveLinkGrouping.test.cjs` (9)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/3843">Attachments uploaded inside card comments: listing in the card's Attachments section is now…</a> Thanks to jghaanstra and xet7.</summary>

**Attachments uploaded inside card comments: listing in the card's Attachments
section is now guaranteed and regression-locked** ( #3843 , new
`models/lib/attachmentMeta.js`, `client/lib/utils.js`): the rich comment editor
already uploads into the same Attachments collection with the same card meta as
the Attachments popup, so they DO list — but nothing pinned that invariant and
the meta was built in two places. One shared, null-safe builder now feeds both
paths, with tests pinning that gallery queries key on `meta.cardId` with no
source filter (and that board backgrounds stay excluded). Tests:
`tests/commentAttachmentsList.test.cjs` (12)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/4822">Maximized card rendered at the wrong place after scrolling in Swimlanes view</a>. Thanks to pravdomil and xet7.</summary>

**Maximized card rendered at the wrong place after scrolling in Swimlanes view**
( #4822 , `client/components/cards/cardDetails.css`): the legacy maximized-pane
CSS had no `position` of its own, so the pane stayed an in-flow item inside the
scrolled board canvas (off-screen after scrolling down); the desktop-mode
floating-window rules also out-specified every maximize geometry rule, and
inline drag offsets survived maximizing. The maximized pane is now
viewport-`fixed` with explicit insets that beat both the floating-window rules
and stale drag offsets (drag position is restored on minimize), RTL-safe via
logical properties. A cascade-resolver regression test pins the behavior against
the real stylesheet and fails on the pre-fix CSS:
`tests/maximizedCardPosition.test.cjs` (11 tests)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/4036">LDAP group filter locked out admins and rejected multiple groups</a>. Thanks to zeisss-mercedes and xet7.</summary>

**LDAP group filter locked out admins and rejected multiple groups** ( #4036 ,
`packages/wekan-ldap/server/ldap.js`): with `LDAP_GROUP_FILTER_ENABLE=true`,
only members of the single `LDAP_GROUP_FILTER_GROUP_NAME` group could log in —
an admin who was only in `LDAP_SYNC_ADMIN_GROUPS` could not log in at all, and a
comma-separated group list produced the literal filter `(cn=A,B)` that matches
nothing. The filter now ORs across every comma-separated group name and, when
admin sync is enabled, also admits the admin-sync groups

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/4043">Board invitation emails could carry a dead invitation code — and signup then failed with "The…</a> Thanks to jkoenig134 and xet7.</summary>

**Board invitation emails could carry a dead invitation code — and signup then
failed with "The invitation code doesn't exist"** ( #4043 ,
`server/models/settings.js`, `server/models/users.js`, new
`models/lib/invitationCodeEmail.js`): re-inviting an unregistered user re-sent
the SAME stale code (invalidated by an earlier OAuth2 signup or deleted account)
instead of regenerating it; a failed SMTP send deleted a previously delivered,
still-valid code; codes were mailed without checking they exist and are valid;
the invitee address was only lowercased client-side; and the signup hook deleted
the code BEFORE the account insert was committed, so a failed insert burned the
code for every retry. Re-invites now regenerate stale codes (still-valid ones
are kept so earlier emails keep working), sends fail loudly on unusable codes,
rollback only removes codes the failed send itself created, and consumption
happens only after a successful signup. Tests:
`tests/invitationCodeEmail.test.cjs` (14)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/4023">Japanese/Chinese UI: the add-card button and footer links wrapped mid-word</a>. Thanks to yuki-snow1823, Sylvain2703 and xet7.</summary>

**Japanese/Chinese UI: the add-card button and footer links wrapped mid-word** ( #4023 , `client/components/forms/forms.css`): CJK text has no spaces, so the
narrow add-card composer footer broke 追加 / リンク / 検索 / テンプレート between any two
characters. The composer/edit footers now use `word-break: keep-all` with
`flex-wrap: wrap` (wrapping between links, never inside a word) and
`white-space: nowrap` on the button and each link group; Latin wrapping is
unchanged and the negative tests pin that no global word-break was introduced.
Tests: `tests/cjkLabelWrap.test.cjs` (9)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/4593">Users added to a team AFTER the team was assigned to a board never became board members — and the…</a> Thanks to szymonsztuka and xet7.</summary>

**Users added to a team AFTER the team was assigned to a board never became
board members — and the Admin Panel bulk team add/remove silently did nothing**
( #4593 , `server/models/users.js`, `client/components/settings/peopleBody.js`,
new `models/lib/teamBoardMemberSync.js`): assigning a team to a board
snapshotted its then-current members, so later joiners could see the board via
publications but every authority gate (`hasMember`, card/list mutations,
attachment downloads, export) denied them; and the Admin Panel "Add/Remove team
to selected users" used a direct client-side `Users.update` that server
permissions silently deny. `editUser`/`createUser` now add new team members to
all boards their teams are assigned to (never touching existing member entries,
skipping template boards), and the bulk actions go through the admin `editUser`
method. Tests: `tests/teamBoardMemberSync.test.cjs` (13)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/4654">LDAP background sync only worked once per user</a>. Thanks to fabianrbz and xet7.</summary>

**LDAP background sync only worked once per user** ( #4654 ,
`packages/wekan-ldap/server/ldap.js`, `sync.js`, new `userIdFilter.js`):
`getUserById` crashed or built the invalid filter `(|(=user))` when
`LDAP_UNIQUE_IDENTIFIER_FIELD` was unset/empty (it never consulted
`LDAP_USER_SEARCH_FIELD`, where the stored id actually comes from), and the
username sync passed `$set` as query OPTIONS to `findOneAsync` — logging
"Syncing user username" while writing nothing. New shared `buildUserIdFilter()`
ORs across both configured fields, `idAttribute` is persisted on new LDAP users,
and the username sync actually updates. Tests: `tests/ldapUserIdFilter.test.cjs`
(11)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/4825">All Boards page: per-list card counts and member avatars never showed</a>. Thanks to mueschel, Miuler and xet7.</summary>

**All Boards page: per-list card counts and member avatars never showed**
([#5174](https://github.com/wekan/wekan/issues/5174), #4825 , new
`models/lib/boardTileData.js`, `server/publications/boards.js`,
`client/components/boards/boardsList.js`, `.jade`): the helpers were stubbed to
`[]` to stop the #4214 reactive "icons dance", and the gating flags were never
published. New non-reactive `getAllBoardsTileData` method (one boards query, one
lists query, one grouped card count) fetched once per page visit; per-board
"Show card count per list"/"Show Board members avatars" settings enforced
strictly both ways. Tests: `tests/boardTileData.test.cjs` (17)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/5659">Lists rendered with different widths by default</a>. Thanks to butteredCat-2021 and xet7.</summary>

**Lists rendered with different widths by default** ( #5659 , new
`models/lib/listWidth.js`, `client/components/lists/list.js`, `listHeader.js`,
`models/users.js`): the default width was duplicated in four resolution paths
that disagreed (270 vs 272), so lists on the same (public) board could differ
with no customization. Single source of truth (272), all paths normalize
out-of-range values the same way; customized widths still win. Tests:
`tests/listWidthDefaults.test.cjs` (12)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/4730">Declining a board invitation kept the board active in the member's overview</a>. Thanks to Griiimm and xet7.</summary>

**Declining a board invitation kept the board active in the member's overview**
( #4730 , `server/models/boards.js`, new `models/lib/boardInvites.js`): the
decline flow called `quitBoard` (deactivate) then `acceptInvite`, which
unconditionally REACTIVATED membership — it also let any removed member re-add
themselves. `quitBoard` now clears the pending invitation (and works for
stale-invite-only users); `acceptInvite` only activates when an invitation
actually exists. Tests: `tests/boardInvites.test.cjs` (11)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/4419">After migrating a user from password to LDAP, the old local password still logged in</a>. Thanks to preciousamorc and xet7.</summary>

**After migrating a user from password to LDAP, the old local password still
logged in** ( #4419 , new `server/lib/ldapPasswordLoginGuard.js`,
`server/authentication.js`): a `validateLoginAttempt` hook now rejects
password-service logins for `authenticationMethod: 'ldap'` users while LDAP is
enabled — respecting the `LDAP_LOGIN_FALLBACK=true` feature, never touching
other services or session resumes, and opt-out-able with
`LDAP_MIGRATION_ALLOW_PASSWORD_LOGIN=true` so no deployment is hard-locked.
Tests: `tests/ldapPasswordLoginGuard.test.cjs` (12)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/4158">LDAP_ENCRYPTION=true (the documented value) silently connected WITHOUT encryption</a>. Thanks to farwayer and xet7.</summary>

**`LDAP_ENCRYPTION=true` (the documented value) silently connected WITHOUT
encryption** ( #4158 , new `packages/wekan-ldap/server/encryptionSetting.js`,
`ldap.js`, `docs/Login/LDAP.md`): only the undocumented `ssl`/`tls` values did
anything, and any other value (including `true`, which JSON-parses to a boolean)
meant silent plaintext. Now `true`→LDAPS, `starttls`→STARTTLS, legacy
`ssl`/`tls` keep their historical meanings with a deprecation notice, and
unknown values log a clear warning listing the accepted ones. Tests:
`tests/ldapEncryptionSetting.test.cjs` (22)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/4560">OIDC login onto an existing account wiped the profile — avatars and templates disappeared</a>. Thanks to LeoLu-eng and xet7.</summary>

**OIDC login onto an existing account wiped the profile — avatars and templates
disappeared** ( #4560 , `server/models/users.js`): the
`OAUTH2_MERGE_EXISTING_USERS` merge path replaced the whole `profile` with the
OIDC-derived one, losing `avatarUrl`, `templatesBoardId` (+ template swimlanes),
language and preferences. The merge now preserves the stored profile and only
fills gaps/updates the asserted fullname; the fail-closed linking rules
(GHSA-mp7g-hj5q-gxhq) are untouched. Tests: `tests/oidcProfileMerge.test.cjs`
(7, fails on pre-fix code)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/4897">OAuth2/OIDC: concurrent logins could contaminate each other's user data — users saw stale or…</a> Thanks to gerardo-junior and xet7.</summary>

**OAuth2/OIDC: concurrent logins could contaminate each other's user data —
users saw stale or missing emails/username/teams, and the database could
disagree with the UI** ( #4897 , `packages/wekan-oidc/oidc_server.js`,
`packages/wekan-oidc/loginHandler.js`). The OIDC server flow kept `profile`,
`serviceData` and `userinfo` as MODULE-SCOPE variables shared by every login of
every user: fields the current login did not overwrite leaked from the previous
user's login (refreshToken, whitelisted id-token claims, branch-dependent
email), and because the handler awaits the token/userinfo requests, two
interleaved logins wrote into the SAME objects — a login could complete carrying
another user's id/email/username, updating the wrong user document. The
`PROPAGATE_OIDC_DATA` group/attribute path additionally ran on implicit GLOBALS
(`teamArray`, `isAdmin`, `user_email`, …) with awaits between assignment and
use, so concurrent logins could write one user's email/teams/admin flag onto
another user's document — real database corruption, matching the "web interface
shows different data vs mongodb" report. All login state is now per-login
locals, the login handler compares actual values (the old username/fullname
comparisons compared a string to an object, always true), and a regression test
proves isolation under concurrent logins and fails against the pre-fix code:
`tests/oidcLoginStateIsolation.test.cjs` (11 tests, positive + negative)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6473">Snap/Docker: after the MongoDB → FerretDB migration ALL CollectionFS-era attachments were missing</a>. Thanks to mueschel and xet7.</summary>

**Snap/Docker: after the MongoDB → FerretDB migration ALL CollectionFS-era
attachments were missing** ( #6473 , `releases/migrate-mongodb-to-ferretdb.mjs`,
`snap-src/bin/migrate-mongo3-to-ferretdb.mjs`,
`snap-src/bin/migrate-gridfs-to-fs.mjs`). Real CollectionFS (old WeKan's
`FS.Store.GridFS('attachments')`) stores each file's GridFS id at
**`copies.<bucket>.key`** (`copies.attachments.key` / `copies.avatars.key`) —
but the importers only looked at `original.gridFsFileId`, `gridFsFileId` and
`copies.gridfs.key`, none of which exist in that layout. So the modern importer
"skipped" every file **silently** and the MongoDB 3.x importer extracted the
binaries but never created an attachment record (and the records it did create
lost their `meta.cardId`/`boardId`, which CollectionFS keeps at the record's TOP
level — an attachment without `meta.cardId` shows on no card). Either way the
migration reported success with zero attachments visible. A new shared
`resolveCfsGridFsId()` resolves the id from all four layouts
(`original.gridFsFileId`, `gridFsFileId`, `copies.<bucket>.key`,
`copies.gridfs.key`, then any `copies.*.key`), the modern importer now **drives
extraction from `cfs_gridfs.<bucket>.files` itself** (so a missing/empty
`cfs.<bucket>.filerecord` collection no longer skips everything — binaries
without a filerecord are still extracted to disk), the mongo3 importer copies
the top-level `boardId`/`cardId`/`listId`/`swimlaneId`/ `userId` into `meta`,
and filerecords whose binary cannot be located are **reported as errors** on the
migration dashboard instead of being silently dropped. If you already migrated
and attachments are missing, run the migration again: `snap run wekan.migrate`
(the source MongoDB data was never modified). Behavioral positive/negative
tests: `tests/migrationAttachmentExtraction.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6473">Snap/Docker: Meteor-Files attachments stored in GridFS without a storage: 'gridfs' flag were left…</a> Thanks to mueschel and xet7.</summary>

**Snap/Docker: Meteor-Files attachments stored in GridFS without a `storage:
'gridfs'` flag were left pointing at a GridFS that no longer exists after
migration** ( #6473 , `releases/migrate-mongodb-to-ferretdb.mjs`,
`snap-src/bin/migrate-gridfs-to-fs.mjs`). WeKan's own `getFileStrategy` serves a
version from GridFS when its storage flag says `'gridfs'` **or** it carries a
`versions.*.meta.gridFsFileId` reference — those reference-only records worked
fine on MongoDB, but the migration's file phase only matched
`versions.original.storage: 'gridfs'`, so their binaries were never extracted
and the record kept pointing into the void (404 after the switch). The record
scan now matches both forms (and every version, not just `original`), and a
**second, bucket-driven sweep** walks `<bucket>.files` by its `metadata.fileId`
back-reference (the way WeKan writes GridFS uploads), recovering binaries even
when the record's flags say nothing about GridFS. Any GridFS-flagged version
whose binary genuinely cannot be located is reported on the dashboard

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6473">Admin Panel &gt; Attachments showed "/data" as the Filesystem Storage path on every platform</a>. Thanks to mueschel and xet7.</summary>

**Admin Panel > Attachments showed "/data" as the Filesystem Storage path on
every platform** ( #6473 , `client/components/settings/attachments.js`,
`client/components/settings/settingBody.js`,
`server/models/attachmentStorageSettings.js`,
`models/lib/attachmentStoragePath.js`). The Blaze helpers computed the path from
`process.env.WRITABLE_PATH` **in the browser**, where `process.env` never has
it, so the page always fell back to "/data" — a path that does not exist on a
Snap install (the real path is `/var/snap/wekan/common/files/attachments`),
sending admins hunting for a directory that was never there. The client now asks
the server via a new admin-only `getAttachmentStoragePaths` method, whose
Snap-aware computation (shared, dependency-free
`models/lib/attachmentStoragePath.js` — WRITABLE_PATH already ends in `/files`
on Snap, `/files` is appended elsewhere) is also used for the settings
document's default filesystem path, which pointed at `/data/attachments` instead
of `/data/files/attachments` on Docker. Unit tests with negative cases:
`tests/attachmentStoragePath.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6473">Snap: snap run wekan.database ferretdb looked like it re-ran the migration — it only switches…</a> Thanks to mueschel and xet7.</summary>

**Snap: `snap run wekan.database ferretdb` looked like it re-ran the migration —
it only switches databases** ( #6473 , `snap-src/bin/wekan-database`). Running
it while already on FerretDB printed "WeKan now uses FerretDB (SQLite)." and
users reasonably read that as "migration done" while their attachments stayed
missing. It now says when nothing was switched, states that the command does NOT
migrate data, and names the command that does: `snap run wekan.migrate`

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB">FerretDB (SQLite) rejected documents with literal dotted field names, silently dropping them during…</a> Thanks to mueschel and xet7.</summary>

**FerretDB (SQLite) rejected documents with literal dotted field names, silently
dropping them during migration**
([#6473](https://github.com/wekan/wekan/issues/6473), wekan/FerretDB
`internal/types/document_validation.go`). MongoDB has accepted documents with
literal `.` in field names since 3.6, and data migrated from a real MongoDB can
legitimately contain them — but FerretDB v1's document validation rejected every
such document (*"invalid key: … (key must not contain '.' sign)"*), and since
per-item migration errors are deliberately non-fatal (#6466), those documents
simply went missing. Fixed in the bundled wekan/FerretDB fork: dotted keys are
stored and round-tripped literally with MongoDB's own semantics (query/update
paths still treat `.` as a path separator), while the other key rules (`$`
prefix, duplicates, UTF-8) still reject. Verified end-to-end against a live
FerretDB (SQLite): insert, nested `$set`, round-trip, and the negative cases

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.96 2026-07-16 WeKan ® release

This release adds the following updates:

<details>
<summary>Releases now include the Sandstorm .spk package. Thanks to xet7.</summary>

**Releases now include the Sandstorm .spk package**
(`.github/workflows/release-all.yml`). The release-all workflow got a new
`build-sandstorm` job that runs after the GitHub Release is created: it builds
the Sandstorm package from the release tag with the same steps as the standalone
sandstorm.yml workflow and attaches `wekan-<version>-sandstorm.spk` to the
Release. The job is non-blocking (`continue-on-error`), so the experimental
Sandstorm build never fails or delays the rest of the release. The standalone
sandstorm.yml workflow still exists for building and testing the .spk on its own
without doing a full release.

</details>

- [Bump websocket-driver from 0.7.4 to
  0.7.5](https://github.com/wekan/wekan/pull/6462). Thanks to dependabot.

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6458">New general cpu-exec + bundled qemu-user: every WeKan platform now runs binaries that need missing…</a> Thanks to a1bert01 and xet7.</summary>

**New general `cpu-exec` + bundled qemu-user: every WeKan platform now runs
binaries that need missing CPU features through emulation automatically** ( #6458 , `snap-src/bin/cpu-exec`, `snap-src/bin/mongodb-control`,
`snap-src/bin/migration-control`, `.github/workflows/release-all.yml`,
`.github/workflows/sandstorm.yml`, `sandstorm-src/build-deps.sh`,
`releases/ferretdb/start-wekan.sh`, `releases/ferretdb/wekan-entrypoint.sh`,
`docs/Databases/mongodb-avx-qemu.md`, `docs/Databases/mongodb-raspi4-qemu.md`).
The #6458 report turned out to run inside a hypervisor that MASKS AVX — and the
snap's old per-tool AVX wrappers (amd64-only, PATH-based) were bypassed by every
absolute-path `mongod` invocation. The new `cpu-exec` helper is one general
mechanism for all scripts, sandboxes, platforms and CPUs: `cpu-exec --features
x86_64=avx,aarch64=atomics <binary> [args]` checks `/proc/cpuinfo` and, when a
required feature is missing, transparently re-runs the binary through a
same-architecture qemu-user (bundled first, then system); with no declared
features it is a plain zero-overhead exec, so every binary can be routed through
it (`WEKAN_REQUIRED_CPU_FEATURES` declares requirements externally). The Snap's
mongodb-control and migration-control now run every mongod 7 through it — so
MongoDB works (slower) on CPUs without AVX and the migration can READ modern
MongoDB data there, with the FerretDB switch/migration fallbacks unchanged;
`aarch64=atomics` covers MongoDB's ARMv8.2-A requirement (Raspberry Pi 4 and
older lack it). release-all.yml now ships `cpu-exec` plus this-arch's static
qemu-user in every Linux bundle .zip (amd64/arm64/ppc64le/s390x/riscv64 —
stripped from the Windows/macOS bundles, where qemu-user does not exist), which
flows into the Docker image and the Snap automatically, and the Sandstorm .spk
gets both via build-deps.sh; the bundle launcher and Docker entrypoint route
node/ferretdb through it

</details>

<details>
<summary>Added regression tests, with negative cases, for all of the fixes below. Thanks to xet7.</summary>

**Added regression tests, with negative cases, for all of the fixes below**
(`tests/htmljsArrayContent.test.cjs`, `tests/cardDescriptionDraft.test.cjs`,
`tests/commentDraft.test.cjs`, `tests/attachmentDeleteGuard.test.cjs`,
`tests/ruleMoveAction.test.cjs`, `tests/snapMigrationRecovery.test.cjs`,
`tests/ferretdbPolling.test.cjs`, `tests/uiDensity.test.cjs`,
`tests/cpuExec.test.cjs` — a BEHAVIORAL test that executes the real cpu-exec
against fake /proc/cpuinfo files and a fake qemu-user, covering direct exec,
qemu fallback, missing-qemu error, per-arch scoping and env overrides —,
`tests/cpuExecWiring.test.cjs` — pins the cpu-exec DELIVERY pipeline: every
Linux bundle in release-all.yml embeds cpu-exec plus its own arch's qemu-user
(arm64/extra arches replace the inherited amd64 one, tolerantly), the Windows
and macOS bundles strip both, qemu-user-static is installed in every
bundle-building job, the Sandstorm .spk ships both via build-deps.sh, the Docker
entrypoint and bundle launcher route ferretdb/node through cpu-exec WITH
direct-exec fallbacks for bundles that lack it, and the snap ships it via the
snap-src helpers part —, `tests/subtasksDefaultBoard.test.cjs` (see the #6456
entry below), and `tests/ferretdbHasData.test.cjs` — a BEHAVIORAL test executing
the real snap-src/bin/ferretdb-has-data guard (the check that gates every switch
to FerretDB) against crafted directories: non-empty .sqlite passes with no -wal
sidecar required, while a 0-byte .sqlite from a failed migration, sidecar-only
leftovers, a directory named *.sqlite, and empty/missing directories are all
rejected — all wired into `test:unit:node` in `package.json`; plus Go table
tests in the wekan/FerretDB fork's `internal/backends/sqlite/query_test.go` and
the fork's integration-test fixes (OTel exporter skipped with a single log line
when no collector is listening, and valid span contexts without a collector so
`TestOtelComment` passes — details in the fork's own CHANGELOG Upcoming). The
htmljs test exercises the vendored compiler's Tag constructor directly (array
content vs. attributes, #6459) and the draft tests run the real extracted
`normalize`/`normalizeTrigger` functions; the UI tests guard the #6465 density
fixes in the repo's CSS-guard style (base font 14px, card details docking right
of the board instead of over its own card, compact admin table headers,
un-clipped zoom pill, one-click board settings cog). The FerretDB Go tests pin
the SQLite filter-pushdown semantics: which strings are pushdown-safe, exact
WHERE/args for `_id` and top-level equality filters, and that dotted paths,
operators, non-strings and unsafe strings stay with the in-Go filter.

</details>

and fixes the following bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6456">Subtasks: creating a subtask crashed with "Exception while invoking method 'addSubtaskCard'"</a>. Thanks to sjohnen and xet7.</summary>

**Subtasks: creating a subtask crashed with "Exception while invoking method
'addSubtaskCard'"** ( #6456 , `models/boards.js`,
`tests/subtasksDefaultBoard.test.cjs`). The lazily-creating getters for the
default subtasks helper board and its landing list still used the SYNC
`Boards.insert` / `Swimlanes.insert` / `Lists.insert` / `Boards.update` APIs,
which Meteor 3 removed from the server — so the `addSubtaskCard` method's async
path crashed with *"insert is not available on the server. Please use
insertAsync() instead"* the first time a board needed its `^Board^` helper board
created (the list creator additionally read `getDefaultSwimline()._id`, which on
the Meteor 3 server is a Promise, so it could never have worked). The sync
getters are now PURE (no creation — also matching the #3868/#2256 rule that only
the server may create these), and the server-side lazy creation lives in
`getDefaultSubtasksBoardAsync`/`getDefaultSubtasksListAsync` using the async
APIs. The never-called date-settings twins, which had the same sync calls and no
server-only guard at all, are pure getters now too. With a regression test
guarding that no sync collection writes come back to `models/boards.js`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6459">GUI: the "More" menu of cards was completely empty, so cards could not be deleted from it</a>. Thanks to thku and xet7.</summary>

**GUI: the "More" menu of cards was completely empty, so cards could not be
deleted from it** ( #6459 ,
`npm-packages/meteor-jade-loader/lib/vendor/htmljs.js`,
`client/components/lists/listHeader.jade`). A WeKan-local vm-sandbox patch in
the vendored jade compiler's htmljs made `isConstructedObject(Array)` return
`false` (upstream returns `true`), so a tag whose inline text compiles to an
ARRAY — the `label {{_ 'source-board'}}:` and `label {{_ 'parent-card'}}:` lines
in cardMorePopup — got its content array mis-assigned as the tag's *attributes*.
At runtime Blaze then found a template view object inside the attributes and
threw *"The basic TransformingVisitor does not support foreign objects in
attributes"* on every render, killing the whole popup — including the card
Delete link. The tag constructor now treats an array first-argument as content,
like upstream htmljs. Also fixed the list "More" popup's copy-link input, which
was always empty because it referenced a `rootUrl` helper that does not exist
(now `absoluteUrl`). Board and swimlane menus intentionally offer archive
(delete lives in Sidebar → Archive), so only the card menu was actually broken

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/1287">Cards: the "You have an unsaved description" warning could never be cleared by saving</a>. Thanks to C0rn3j and xet7.</summary>

**Cards: the "You have an unsaved description" warning could never be cleared by
saving** ([#6455](https://github.com/wekan/wekan/issues/6455), reincarnation of #1287 , `client/components/cards/cardDetails.js`,
`client/components/cards/cardDescription.js`). Two bugs: closing the description
editor only *avoided adding* a draft when the text matched the saved description
— it never *removed* a pre-existing draft record, so once the warning appeared,
"View it" → Save could not clear it, only Discard could. And the comparison
matched a per-line-whitespace-stripped draft against the raw stored description
(or `null` when empty), so descriptions with Markdown `" "` hard-breaks
re-created a phantom draft on every save. Saving now removes the draft record
explicitly, and both sides of the comparison are normalized the same way

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/5547">Comments: a comment being written was lost when the card was closed or a click landed outside the…</a> Thanks to Finnlife, webenefits and xet7.</summary>

**Comments: a comment being written was lost when the card was closed or a click
landed outside the card** ( #5547 , `client/components/activities/comments.js`).
The comment-draft machinery existed (the form even prefills from it) but had
been disarmed since 2019: the escape handler that saved the draft was gated on a
"form is open" flag that nothing ever set — the setter was removed back then
because the handler also *cleared the visible text* on every outside click. Now
the draft is saved continuously (debounced) while typing and flushed when the
form is torn down, submit removes the draft, and the escape handler no longer
clears the visible text — so an unfinished comment survives closing the card,
and reopening the card restores it into the form

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/5282">Attachments: deleting an attachment could log a client-side "Removed nonexistent document"…</a> Thanks to lupuszr and xet7.</summary>

**Attachments: deleting an attachment could log a client-side "Removed
nonexistent document" exception even though the delete succeeded** ( #5282 ,
`client/components/cards/attachments.js`). Same class as the fixed #3252 for
comments and checklists: under publication churn the attachment document can
already be evicted from Minimongo when the confirm handler runs, and removing a
missing _id throws. The delete now only runs when the document is still in the
local cache — the comment/checklist guards' missing sibling

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6472">Rules: the "move card to top/bottom" actions did nothing</a>. Thanks to jmb26240 and xet7.</summary>

**Rules: the "move card to top/bottom" actions did nothing** ( #6472 ,
`server/rulesHelper.js`, `client/components/rules/actions/boardActions.js`,
`client/components/rules/rulesImportExport.js`, `server/rulesButton.js`,
`models/lists.js`). A pile-up of five bugs, all silent because the activity hook
swallows rule-action errors: (1) an unresolved destination list (typo'd,
renamed, case-mismatched, or on another board) crashed on `list.cardsUnfiltered`
— now it falls back to the card's current list; (2) the classic rule wizard's
generic "move to top/bottom" stored the field as `listTitle`, which the rule
engine never reads (`listName`) — so every such rule created from the wizard has
never worked; (3) an empty destination list made `Math.min()/Math.max()` of
nothing write a corrupt `sort: ±Infinity`; (4) the rules JSON/CSV import created
rules with raw client inserts that the board-admin-only allow rules reject into
minimongo limbo — it now uses the same `rules.createRule` server method as the
wizard, and defaults missing trigger matching fields (e.g. `userId`) to the `*`
wildcard so hand-written JSON matches; (5) `rules.createRule` let an empty
`boardId: ''` from a not-yet-loaded board selector override the real board. Also
fixed the server-side orphaned-cards fallback in
`List.cards()/cardsUnfiltered()`, which silently never applied because an async
lookup was read synchronously

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6465">GUI: desktop density regressions from the v7.98–v8.18 mobile UI work</a>. Thanks to Mintyt, csonkaoszimt, micha141076 and xet7.</summary>

**GUI: desktop density regressions from the v7.98–v8.18 mobile UI work** ( #6465
, `client/components/main/layouts.css`,
`client/components/cards/cardDetails.css`, `client/components/main/header.css`,
`client/components/settings/peopleBody.jade`,
`client/components/settings/settingBody.css`,
`client/components/boards/boardHeader.jade`). Restores the WeKan 6.09 desktop
look users asked for: the base font is back to 14px (the `clamp(...2.5vw...)`
introduced in v7.98 and raised in v8.02 resolved to 18px on any window wider
than 720px — +28.5% on every font, button and input, the "everything is way too
big" complaint) and headings back to 22/18/16px; the card details window no
longer opens as a huge floating sheet ON TOP of its own card — it docks to the
right edge like the classic side panel (still movable by its drag handle), with
6.09's 20px content padding instead of ~48px white borders, a 3px corner radius,
and without the v8.18 rule that forced ALL card text to the title's size; the
All Boards page header band is back to 6.09's compact padding; the Admin Panel
Organizations/Teams tables no longer explode column widths ("Select all /
Unselect all" header links are now compact icons and header cells may wrap); the
zoom pill no longer renders cut off (fixed-pixel pill inside the 28px
quick-access row); and board settings opens with ONE click from a new cog button
in the board header (the sidebar path still works). Follow-ups caught by the
Playwright suite: archiving or deleting a card now also CLOSES its details
window (the card id stayed in the openCards session list, so the right-docked
window kept rendering exactly over the archives sidebar and intercepted its
Restore/Delete clicks), and an OPEN sidebar now stacks above the card window
(z-index 2002 vs 2001) so the sidebar is always usable while a card is open.
With Playwright coverage: a new spec proves board settings opens in one click
from the header cog (and that the popup closes again), and the archives spec's
board-menu click is scoped to the sidebar instance since the cog made the bare
class selector ambiguous. Note: a missing watch "eye" icon is the Admin Panel →
Features → Notifications "disable watch" setting, not a regression

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6466">Snap: WeKan served "502 Bad Gateway" forever when mongod could not start — including on CPUs…</a> Thanks to kiarn and xet7.</summary>

**Snap: WeKan served "502 Bad Gateway" forever when mongod could not start —
including on CPUs without AVX ("Illegal instruction")**
([#6458](https://github.com/wekan/wekan/issues/6458), #6466 ,
`snap-src/bin/mongodb-control`, `snap-src/bin/migration-control`). MongoDB 5.0+
x86_64 binaries require AVX; on CPUs without it mongod dies instantly with
SIGILL (exit 132). mongodb-control never checked the mongod fork's exit status:
it pinged the dead port for ~10 minutes, snapd restarted the service, and the
cycle repeated forever — same limbo as when the data files are still MongoDB 3.x
("This version of MongoDB is too recent"). Now there is an AVX pre-flight and
the fork/final-start exit codes are checked: if a COMPLETED FerretDB migration
exists the snap switches to it; otherwise the MongoDB → FerretDB migration is
(re)run — FerretDB is pure Go + SQLite and the 3.x reader uses the bundled
MongoDB 3.2 tools, so neither needs AVX — with a 3-attempt counter so a
persistently failing migration cannot ping-pong, and clear log guidance (`snap
run wekan.migrate`). migration-control also skips the pointless mongod 7 probe
when AVX is missing

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6466">Snap: a migration that finished with a few per-item errors ("Avatars Errors") deleted the…</a> Thanks to Nissulya, S0QR2, lezioul, usrflo and xet7.</summary>

**Snap: a migration that finished with a few per-item errors ("Avatars Errors")
deleted the fully-copied FerretDB database and left the snap serving 502 Bad
Gateway** ( #6466 , `snap-src/bin/migrate-mongo3-to-ferretdb.mjs`,
`releases/migrate-mongodb-to-ferretdb.mjs`, `snap-src/bin/migration-control`).
Both importers treated ≥10 logged errors of ANY kind as failure — but per-item
errors (one document that fails JSON parsing, one avatar that fails to extract)
don't invalidate everything that DID copy. The failure path then discarded the
whole migrated SQLite, set `migrate=off`, and "fell back" to MongoDB —
impossible for a 6.09 upgrade, whose 3.x data files the bundled mongod 7 cannot
open, producing the reported endless `db-eval.mjs ping` loop and 502. Per-item
errors are now logged but non-fatal (only real failures — disk full, unreachable
target/source — still fail), and a failed 3.x-source migration keeps the partial
FerretDB SQLite plus its checkpoint and RESUMES on the next start instead of
deleting hours of copied data

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6468">Snap/Bundle: FerretDB v1 pinned 250–400% CPU and boards took minutes to load after migration</a>. Thanks to anlx-sw, markusst1982 and xet7.</summary>

**Snap/Bundle: FerretDB v1 pinned 250–400% CPU and boards took minutes to load
after migration** ([#6467](https://github.com/wekan/wekan/issues/6467), #6468 ,
`snap-src/bin/wekan-control`, `releases/ferretdb/start-wekan.sh`, and the
wekan/FerretDB fork). Two sides. WeKan side: with FerretDB there is no oplog, so
Meteor observes every query by POLLING — and its defaults re-run every observed
query 50 ms after ANY write and at least every 10 s, which on an active board
multiplies into hundreds of full queries per second; with FerretDB the snap and
the bundle launcher now default to `METEOR_POLLING_THROTTLE_MS=2000` /
`METEOR_POLLING_INTERVAL_MS=30000` (overridable; own changes still appear
instantly, other users' changes may take ~2 s longer). FerretDB side (fork
v1.28): real filter pushdown so `{boardId: X}` uses the SQLite expression
indexes instead of decoding the whole 53k-card collection per query, a
connection pool cap of 2×CPUs (was 100 — dozens of concurrent full scans
thrashing the pure-Go SQLite mutexes were the reported 821k futex calls/30 s),
and inserts no longer take the registry's global write lock

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/pull/6469">LDAP: group search filters were double-escaped and broke group filtering</a>. Thanks to ChristianMa97.</summary>

**LDAP: group search filters were double-escaped and broke group filtering**
([#6460](https://github.com/wekan/wekan/issues/6460), PR #6469 ,
`packages/wekan-ldap/server/ldap.js`). The group filter was post-processed with
a global backslash-doubling replace, a leftover workaround from the ldapjs era
that predates the proper `escapedToHex` hex escaping. It turned already-correct
RFC 4515 escapes like `\5c` and `\28` (an AD DN with an escaped comma, a group
name with parentheses) into `\\5c`/`\\28`, which ldapts' strict filter parser
rejects with *"Invalid escaped hex character"* — so group filtering,
admin-status sync and role sync failed for exactly those directories. The
redundant replace is removed; injection protection is unchanged (`escapedToHex`
still hex-escapes the username)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/pull/6470">LDAP: enabling org/team sync made every LDAP login fail with 'forbidden'</a>. Thanks to ChristianMa97 and xet7.</summary>

**LDAP: enabling org/team sync made every LDAP login fail with 'forbidden'**
([#6461](https://github.com/wekan/wekan/issues/6461), PR #6470 ,
`packages/wekan-ldap/server/loginHandler.js`,
`packages/wekan-ldap/server/sync.js`). On the server, a nested
`Meteor.callAsync` inherits the current method invocation's `connection`, so
when the login handler called the `setUserOrgsTeamsFromLdap` method, its admin
guard saw the client's `login` connection with no logged-in user yet and
rejected the sync — and the unhandled rejection failed the whole login. (The
nightly cron sync runs outside a method invocation, so it was unaffected — which
is why this hid.) The login-time sync call now clears the inherited invocation
context so it is a true server-to-server call, and org/team sync is additionally
wrapped so an optional-enrichment failure is logged instead of blocking login.
The same PR also throws the account-creation error from `addLdapUser` at the
right point (it was previously used as a user object first), fixes
external-avatar localization to use `Avatars.writeAsync` (the callback-style
`write` no longer exists in ostrio:files 3.x, so localizing avatars silently did
nothing), and adds `*`/`?` wildcard support with unit tests to the
`LDAP_SYNC_ORGANIZATIONS_GROUPS` / `LDAP_SYNC_TEAMS_GROUPS` allowlists

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.95 2026-07-15 WeKan ® release

This release fixes the following bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6457">FerretDB: WeKan did not work after migrating to FerretDB — every logged-in browser was logged out…</a> Thanks to markusst1982 and xet7.</summary>

**FerretDB: WeKan did not work after migrating to FerretDB — every logged-in
browser was logged out again and the database CPU was pinned at 100%** ( #6457 ,
`server/accounts-resume-login.js`, `server/imports.js`). Meteor's
`accounts-base` "resume" login handler projects one array element with the
**positional operator** (`{fields: {'services.resume.loginTokens.$': 1}}`), and
FerretDB rejects that find with *"Executor error during find command :: caused
by :: positional operator '.$' couldn't find a matching element in the array"*
(code 51246). Resume is how an already-logged-in browser re-authenticates on
**every page load and every DDP reconnect**, so the throw logged the user out,
the client reconnected, resume threw again, and the retry loop pinned the
FerretDB CPU — the board looked broken right after a migration that had just
taken hours. WeKan now replaces that login handler with one that projects the
whole (small) `loginTokens` array and picks the matching token in JavaScript —
which is what upstream already does in its own `$or` fallback query, so nothing
else about login behaviour changes

</details>

<details>
<summary>Snap: a snap refresh during the MongoDB → FerretDB migration threw away hours of migration progress. Thanks to markusst1982 and xet7.</summary>

**Snap: a snap refresh during the MongoDB → FerretDB migration threw away hours
of migration progress** (`snap-src/bin/migration-control`,
`releases/migrate-mongodb-to-ferretdb.mjs`,
`snap-src/bin/migrate-mongo3-to-ferretdb.mjs`). A big migration can run for **5
hours**, so being interrupted by a snap refresh, `snap stop` or a reboot is
normal — but it was treated as a *failure*: snapd's SIGTERM killed the importer,
`migration-control` read its signal exit code (143) as "the migration failed",
and `fail_and_run_mongodb` **deleted the partial FerretDB SQLite** and set
`migrate=off`. Every refresh meant starting the whole migration from zero. Now
an interruption is distinguished from a failure (a SIGTERM/SIGINT trap, plus an
importer exit code >= 128) and **keeps** the partial database and the
checkpoint, leaves auto-migration on, and hands back to MongoDB so WeKan keeps
working until the next start **resumes**.

</details>

<details>
<summary>Snap: an interrupted migration re-extracted every attachment, needing double the disk space. Thanks to markusst1982 and xet7.</summary>

**Snap: an interrupted migration re-extracted every attachment, needing double
the disk space** (`releases/migrate-mongodb-to-ferretdb.mjs`,
`snap-src/bin/migrate-mongo3-to-ferretdb.mjs`). Only fully-copied *collections*
were checkpointed; the file phase started over, and because the destination path
was picked with a *"add a `_1`, `_2`, … counter while the file exists"* loop,
every already-extracted attachment was written a **second** time under a new
name, orphaning the first copy — so a resumed migration silently needed twice
the disk the up-front space check had budgeted for. Extracted files are now
checkpointed individually (recorded only once the bytes are on disk *and* the
record points at them, and re-verified by size on resume, so a half-written file
is never mistaken for a finished one) and skipped when resuming, and the
destination path is deterministic — an existing file at that path can only be
this record's own partial extraction, so it is overwritten. The MongoDB 3
importer had no checkpoint at all and now resumes collections and files the same
way.

</details>

<details>
<summary>Snap: discarding a partial FerretDB migration left the resume checkpoint behind, so the retry could… Thanks to markusst1982 and xet7.</summary>

**Snap: discarding a partial FerretDB migration left the resume checkpoint
behind, so the retry could switch to a database missing most of its data**
(`snap-src/bin/migration-control`). The importer's checkpoint lists the
collections it has already copied and lives in `$SNAP_COMMON`, **not** in the
SQLite directory that `discard_partial_ferretdb` wipes — so it survived. The
next migration then trusted it, skipped every "already migrated" collection,
copied only the rest into the now-empty database, and reported success — leaving
the snap serving a FerretDB missing most of its data. The checkpoint is only
meaningful together with the SQLite it describes, so the two are now always
discarded together.

</details>

<details>
<summary>Snap: releases are now published to the Snap Store stable channel automatically. Thanks to xet7.</summary>

**Snap: releases are now published to the Snap Store `stable` channel
automatically** (`.github/workflows/release-all.yml`). Both snap jobs (native
and Launchpad) pushed only to `candidate`, `beta` and `edge`, and `stable` had
to be released by hand afterwards. Both now publish to
`stable,candidate,beta,edge`.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.94 2026-07-15 WeKan ® release

This release adds the following new features:

<details>
<summary>Snap: the database setting is now authoritative, with a snap run wekan.database mongodb|ferretdb… Thanks to xet7.</summary>

**Snap: the `database` setting is now authoritative, with a `snap run
wekan.database mongodb|ferretdb` command and no-downtime handling of a failed
migration** (`snap-src/bin/wekan-database`, `snap-src/bin/wekan-control`,
`snap-src/bin/mongodb-control`, `snap-src/bin/ferretdb-control`,
`snap-src/bin/migration-control`, `snap-src/bin/migration-pending`). Previously
the control scripts **force-switched** to FerretDB whenever a `*.sqlite` file
existed, so `snap set wekan database=mongodb` would not stick and there was no
way to keep WeKan on MongoDB while fixing a migration — a failed migration meant
downtime. Now the `database` setting decides which database WeKan runs on, and
**`snap run wekan.database mongodb`** switches WeKan to MongoDB (and pauses
auto-migration, `migrate=off`) while **`snap run wekan.database ferretdb`**
switches to the migrated FerretDB. Auto-migration can be paused with `snap set
wekan migrate=off` and, crucially, **a migration that FAILS now pauses itself
and hands back to MongoDB automatically** (`migration-control`
`fail_and_run_mongodb`) so WeKan keeps working on MongoDB instead of
retrying-and-failing every start; re-run it with `snap run wekan.migrate`. A
successful migration also **restarts `wekan.wekan`** so it reconnects to
FerretDB. The only remaining auto-override is the safety guard that refuses to
start an empty FerretDB while MongoDB still holds data.

</details>

and fixes the following bugs:

<details>
<summary>Snap: the MongoDB → FerretDB migration failed on GridFS collections and left a half-migrated… Thanks to xet7.</summary>

**Snap: the MongoDB → FerretDB migration failed on GridFS collections and left a
half-migrated database behind** (`releases/migrate-mongodb-to-ferretdb.mjs`,
`snap-src/bin/migrate-mongo3-to-ferretdb.mjs`,
`snap-src/bin/migration-control`). FerretDB v1 rejects collection names
containing a dot (*"invalid key: 'attachments.chunks' (key must not contain '.'
sign)"*), and the importers tried to copy the GridFS internals collections
(`attachments.chunks`, `attachments.files`, `avatars.*`, `cfs_gridfs.*`) and the
CollectionFS `cfs.<bucket>.filerecord` collections as **text**, so the migration
aborted. Now the text phase **skips every dotted collection** — none of WeKan's
real data collections contain a dot, and the dotted ones are all GridFS
internals (extracted in the file phase), CollectionFS filerecords (turned into
bare `attachments`/`avatars` records in the file phase, now created with an
upsert) or `system.*` collections. And crucially, when a migration **fails
partway** it now **deletes the partial FerretDB SQLite** it wrote
(`migration-control`'s `discard_partial_ferretdb`): otherwise that
non-empty-but-incomplete `files/db/wekan.sqlite` looked "migrated" to the data
check, so the snap disabled MongoDB and tried to serve an incomplete FerretDB.
Now a failed migration cleanly keeps MongoDB and retries.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.93 2026-07-15 WeKan ® release

This release adds the following new features:

<details>
<summary>Snap: new snap run wekan.migrate command to force a fresh MongoDB → FerretDB migration. Thanks to xet7.</summary>

**Snap: new `snap run wekan.migrate` command to force a fresh MongoDB → FerretDB
migration** (`snap-src/bin/wekan-force-migrate`, registered in
`snapcraft.yaml`). Ignores the `database` setting and the migration marker,
removes any partial FerretDB SQLite + resume checkpoint, then re-runs the
migration so it re-reads the existing MongoDB (3 or 7) data and migrates text +
attachments + avatars to FerretDB again. The source MongoDB data is never
modified or deleted. Watch it with `snap logs -f wekan.mongodb` or the migration
dashboard.

</details>

<details>
<summary>Snap: new maintenance mode (snap run wekan.maintenance on|off) so you can run MongoDB OR FerretDB… Thanks to xet7.</summary>

**Snap: new maintenance mode (`snap run wekan.maintenance on|off`) so you can
run MongoDB OR FerretDB by hand for data access**
(`snap-src/bin/wekan-maintenance`, `snap-src/bin/wekan-maintenance-page.mjs`,
and the DB control scripts). While the `$SNAP_COMMON/.wekan-maintenance` marker
is present, the control scripts do **not** auto-migrate or auto-disable, so
`snap start wekan.mongodb` (old MongoDB data) or `snap start wekan.ferretdb`
(migrated FerretDB SQLite data) stays up instead of shutting itself down —
letting you reach the data over the MongoDB wire protocol on port 27019 (one at
a time; they share the port). WeKan itself serves an **"under maintenance" page
(HTTP 503) on the web port for all URLs** while maintenance is on, so end users
see a clear message. The page shows the **Admin Panel product name** if one is
set (not "WeKan"): it is cached to `$SNAP_COMMON/.productname.txt` while a
database is running (by `wekan-control` on startup and by the migration
importers), so it is still available in maintenance mode when both databases are
stopped.

</details>

and fixes the following bugs:

<details>
<summary>Snap: db-eval could not load the MongoDB driver, so EVERY database readiness check silently failed. Thanks to xet7.</summary>

**Snap: `db-eval` could not load the MongoDB driver, so EVERY database readiness
check silently failed** (`snap-src/bin/db-eval.mjs`; also
`migrate-schema-v843.mjs`, `migrate-gridfs-to-fs.mjs`). `db-eval` is the small
Node helper the snap uses (instead of `mongosh`) to check whether
MongoDB/FerretDB is up, elect the replica-set primary, and run the migration's
mongod-7 readiness probe. It did `import { MongoClient } from 'mongodb'` and the
wrapper set `NODE_PATH=$SNAP/programs/server/node_modules` to point at the
bundled driver — **but Node's ESM loader ignores `NODE_PATH`** (that env var is
honored only by the CommonJS loader). So the import resolved nothing, `db-eval`
exited **before ever opening a connection**, and every `ping`/`primary`/`rs-*`
check "failed." This was the single root cause behind a whole family of
symptoms: WeKan looping *"MongoDB not ready yet, retrying…"* or *"FerretDB not
ready yet…"* forever even though the database was running and listening;
replica-set initialisation failing; and — most damaging — the MongoDB → FerretDB
migration **falling back to MongoDB 3.2** because the mongod-7 readiness probe
never connected (mongod 7 opened the data fine, but `db-eval` couldn't reach it,
so migration-control wrongly concluded "mongod 7 can't open this" and tried the
3.2 reader, which cannot read WiredTiger-7 files — producing no FerretDB
SQLite). Proven by the migration source mongod log: mongod 7 reached `Waiting
for connections` with **zero `Connection accepted`** before being killed by the
readiness timeout. Fixed by resolving the driver with `createRequire` (CommonJS,
which **does** honor `NODE_PATH` and the bundle layout), anchored inside the
modern bundle.

</details>

<details>
<summary>Snap: the presence of a FerretDB SQLite database — not the migration marker — now decides whether… Thanks to xet7.</summary>

**Snap: the presence of a FerretDB SQLite database — not the migration marker —
now decides whether to use FerretDB, so a FAILED migration no longer leaves the
snap with no database** (`snap-src/bin/ferretdb-control`,
`snap-src/bin/mongodb-control`, `snap-src/bin/wekan-control`). An earlier
attempt keyed the "use FerretDB / disable MongoDB" decision off the
`$SNAP_COMMON/.migration-to-ferretdb-done` marker. But `migration-control` also
writes that marker when the migration **falls back** (data unreadable, tools
missing) or when there is nothing to migrate — with **no** FerretDB data
produced. So on a server whose MongoDB → FerretDB migration failed,
`mongodb-control` saw the marker, logged *"migration already finished; disabling
mongodb service"* and disabled MongoDB, while FerretDB's SQLite was empty —
leaving WeKan with no database at all, looping *"MongoDB not ready yet,
retrying…"* forever and refusing to keep `wekan.mongodb` running. Now all three
scripts decide from **actual data on disk**: MongoDB is disabled / FerretDB is
forced **only when a `*.sqlite` database exists in `files/db`**; an empty
`files/db` means the migration did not succeed, so MongoDB starts normally and
WeKan keeps working while the migration can be retried. The check is a single
shared helper (`snap-src/bin/ferretdb-has-data`) that requires a `*.sqlite` file
**bigger than 0 bytes**, not merely present, so a 0-byte stub never counts as
"migrated". And `migration-control`'s `finish_success` now **verifies that
non-empty SQLite (with its WAL) exists before switching to FerretDB** — if the
importer returns success but wrote no data, the snap keeps MongoDB and retries
next start instead of switching to an empty database.

</details>

<details>
<summary>Snap: the migration's mongod-7 readiness probe fast-fails when the temporary mongod has exited. Thanks to xet7.</summary>

**Snap: the migration's mongod-7 readiness probe fast-fails when the temporary
mongod has exited** (`snap-src/bin/migration-control`). `ready_via_node` waits
up to 45 s for the temporary source mongod to accept connections (a large
MongoDB 6/7 database can need that long to replay its journal, #6454), but it
now also checks the process is still alive: if the temp mongod has exited — e.g.
mongod 7 cannot open old MongoDB 3.x data — it stops waiting immediately and
drops to the MongoDB 3.2 reader instead of pinging a dead process for the full
timeout. Matters across many unattended 6.09 → 9.x upgrades.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.92 2026-07-15 WeKan ® release

This release fixes the following bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6454">Snap: WeKan never started on a running MongoDB, looping "MongoDB not ready yet, retrying in 5…</a> Thanks to xet7.</summary>

**Snap: WeKan never started on a running MongoDB, looping "MongoDB not ready
yet, retrying in 5 seconds..." forever, on any server with less than ~34 GB
RAM** ( #6454 , `snap-src/bin/mongodb-control`,
`snap-src/bin/migration-control`). The WiredTiger cache size was **hardcoded to
32 GB**. On a smaller box (e.g. 8 GB) mongod was OOM-killed seconds after it
started — including the *temporary* mongod that `mongodb-control` starts to
initialise the replica set, which died before it could be reached, so the
replica set was **never initiated**. The final mongod then ran with `--replSet
rs0` but no config, **no PRIMARY was ever elected**, and since Meteor requires
the replica-set primary (change streams), `wekan-control` waited on it forever.
Fixes: (1) the cache size is now **RAM-aware** — ~50 % of (RAM − 1 GB), the same
formula mongod uses for its own default, capped at 32 GB, min 1 GB, overridable
with `MONGODB_WIREDTIGER_CACHE_GB`; (2) the temporary-mongod readiness wait is
raised from 30 s to 90 s so a large database that needs longer to replay its
journal still gets its replica set initialised; and (3) the temporary source
mongod that the MongoDB → FerretDB migration starts to *read* the data now uses
a conservative RAM-aware cache (¼ of (RAM − 1 GB), cap 8 GB) so it leaves room
for the target FerretDB and the importer running alongside it

</details>

<details>
<summary>Snap: the MongoDB 6/7 → FerretDB importer now resolves the correct driver and matches the MongoDB… Thanks to xet7.</summary>

**Snap: the MongoDB 6/7 → FerretDB importer now resolves the correct driver and
matches the MongoDB 3.2 importer's safety and dashboard**
(`releases/migrate-mongodb-to-ferretdb.mjs`). It now (a) resolves the `mongodb`
driver by probing the WeKan bundle and **using whichever actually works** —
preferring a v6+ driver that exposes `GridFSBucket` and speaks OP_MSG, because
an older v2 driver's OP_QUERY is rejected by FerretDB ("Unsupported OP_QUERY
command: update"); and (b) gained the same disk-space guard and progress UI as
`migrate-mongo3-to-ferretdb.mjs`: it measures the total attachment/avatar size
up front and **stops before extracting** if it will not fit, and if space runs
out mid-run it **stops, deletes the partially-migrated files, and reports how
much more disk is needed** (a full disk can corrupt the still-running source
MongoDB), shows a **live per-file progress bar**, and **translates the dashboard
into the browser's language**.

</details>

<details>
<summary>Snap: verified the migration's disk-space guard actually works inside snap confinement. Thanks to xet7.</summary>

**Snap: verified the migration's disk-space guard actually works inside snap
confinement** (`snap-src/bin/migrate-mongo3-to-ferretdb.mjs`,
`releases/migrate-mongodb-to-ferretdb.mjs` — comment/documentation only, no
behaviour change). `statfs` (and `statfs64` / `fstatfs` / `fstatfs64` /
`statvfs` / `fstatvfs`) is in snapd's **default seccomp allow-list**
(`snapcore/snapd` → `interfaces/seccomp/template.go`), and a snap has no
per-snap disk quota by default, so the migration's free-space check
(`statfsSync` on `$SNAP_COMMON/files`) returns the real free space and its "stop
before the disk fills" safety is fully active on Snap. `quotactl` is **not**
allowed, but the migration never calls it; the one case it would matter — a
snapd storage-quota group (project quotas invisible to `statfs`) — is still
caught by the `ENOSPC`/`EDQUOT` write-failure fallback. Only Sandstorm grains
genuinely lack `statfs` (FUSE does not implement it, `quotactl` blocked), where
the guard already relies on that write-failure fallback.

</details>

<details>
<summary>Snap: after a MongoDB → FerretDB migration, FerretDB never started and WeKan was stuck on "MongoDB… Thanks to xet7.</summary>

**Snap: after a MongoDB → FerretDB migration, FerretDB never started and WeKan
was stuck on "MongoDB not ready yet, retrying..."**
(`snap-src/bin/migration-control`). The `wekan.ferretdb` service disables itself
while `database` is `mongodb`; the migration then switches the snap with an
**internal** `snapctl set database=ferretdb`, but an internal `snapctl set` does
**not** re-run the `configure` hook that flips the two database services — so
FerretDB was left *disabled* and MongoDB *enabled but stopped*, leaving WeKan
with no database (both bind the same port, so only one runs at a time).
`finish_success` now performs the flip itself, exactly as the configure hook's
ferretdb branch does: enable + start (and restart) `wekan.ferretdb`, then stop +
disable `wekan.mongodb` — using the snap **instance** name so parallel snaps
target their own services. Immediate recovery on an already-migrated install —
flip the setting so the `configure` hook re-runs and enables + starts FerretDB
and stops MongoDB (do **not** try `snap start wekan.ferretdb` directly; while
`database` is still `mongodb`, ferretdb-control reads the setting and disables
itself again — see the next entry): `sudo snap set wekan database=ferretdb`.

</details>

<details>
<summary>Snap: the migration-success marker is now authoritative, so FerretDB starts even if the database… Thanks to xet7.</summary>

**Snap: the migration-success marker is now authoritative, so FerretDB starts
even if the `database` setting was never flipped**
(`snap-src/bin/ferretdb-control`, `snap-src/bin/mongodb-control`,
`snap-src/bin/wekan-control`). Every DB service keyed its behaviour off the
`database` setting alone: `ferretdb-control` logged *"database is 'mongodb', not
'ferretdb'. Disabling ferretdb service."* and self-disabled whenever the setting
still said `mongodb` — so on an already-migrated install `snap start
wekan.ferretdb` started and then immediately stopped itself, unfixable by hand
without first setting `database=ferretdb`. Now the marker
`$SNAP_COMMON/.migration-to-ferretdb-done` overrides the setting: when present,
`ferretdb-control` repairs `database=ferretdb` and keeps running instead of
self-disabling; `mongodb-control` disables itself (before the migration-pending
check, so a finished migration is never re-attempted); and `wekan-control`
forces ferretdb and brings the service up. WeKan thus recovers on its own after
a migration whose setting flip was lost.

</details>

<details>
<summary>Snap: WeKan now starts its database itself on startup instead of waiting forever for a stopped one. Thanks to xet7.</summary>

**Snap: WeKan now starts its database itself on startup instead of waiting
forever for a stopped one** (`snap-src/bin/wekan-control`). Previously the
`wekan.wekan` service only *waited* for whichever database `database` pointed at
(`FerretDB not ready yet…` / `MongoDB not ready yet…`) and never *started* a DB
service, so if both `wekan.ferretdb` and `wekan.mongodb` were stopped/disabled
WeKan hung indefinitely. Now, before waiting, it enables + starts whichever DB
service is configured (`snapctl start --enable` = `snap enable` + `snap start`,
targeting the snap **instance** name so parallel snaps hit their own services).

</details>

<details>
<summary>Snap: WeKan never starts an EMPTY FerretDB while data still lives in MongoDB. Thanks to xet7.</summary>

**Snap: WeKan never starts an EMPTY FerretDB while data still lives in MongoDB**
(`snap-src/bin/wekan-control`). On startup WeKan now checks what data actually
exists on disk — the FerretDB SQLite dir (`$SNAP_COMMON/files/db`) and the
MongoDB WiredTiger data (`$SNAP_COMMON`) — instead of trusting the `database`
setting alone. If `database=ferretdb` was selected (or forced) but the migration
never ran, so the SQLite database is empty while MongoDB still holds the data,
WeKan **reverts to `database=mongodb`** and prints how to run the migration,
rather than starting an empty FerretDB that would look like all data was lost.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.91 2026-07-15 WeKan ® release

This release adds the following new features:

<details>
<summary>Snap / Sandstorm migration dashboard: live per-file progress and a disk-space safety guard. Thanks to xet7.</summary>

**Snap / Sandstorm migration dashboard: live per-file progress and a disk-space
safety guard** (`snap-src/bin/migrate-mongo3-to-ferretdb.mjs`). While a MongoDB
3 database's attachments/avatars are migrated to the filesystem, the progress
page now shows a **live per-file progress bar** for the file currently being
extracted — its name, size, "file N of TOTAL", percent, and whether it is an
**attachment or an avatar** (using WeKan's existing translations in the viewer's
browser language, with an English fallback; there is no logged-in user during
migration, so the browser's `Accept-Language` is used). Big files no longer land
in RAM: each GridFS file is **streamed chunk-by-chunk** straight to disk (the
old approach buffered the whole file through mongoexport's 512 MB stdout limit
and failed on large attachments). Because a full disk can corrupt the
still-running source MongoDB, the migration guards disk space **where it can
measure it** (Snap with a working `statfs`): it shows **remaining disk space**,
checks the total size of all files **up front** and stops before extracting if
the volume cannot hold them, and stops mid-run if free space drops below a
safety margin (default 1 GB, `MIGRATION_MIN_FREE_BYTES`). A Sandstorm grain
cannot see its own free space or quota (its FUSE layer does not implement
`statfs` and `quotactl` is blocked — `statfs` on `/var` would report the *host*
disk, not the grain quota), and a locked-down Snap container may not report it
either; in those "unknown free space" cases the migration hides the space
figures and instead treats an actual **`ENOSPC`/`EDQUOT` write failure** as "out
of space". On **any** such stop it **deletes the partially-migrated files to
free the space back**, reports how many files were migrated before stopping, and
shows how much more disk space is required to migrate them all. Platform is
detected from the environment (`$SNAP`; `SANDSTORM` / `SANDSTORM_RAW_MONGO_PATH`
/ `METEOR_SETTINGS`).

</details>

and adds the following updates:

<details>
<summary>i18n: 10 more selectable languages, corrected native names, and a Transifex-pull safety report. Thanks to xet7.</summary>

**i18n: 10 more selectable languages, corrected native names, and a
Transifex-pull safety report**. Added `languages.js` picker entries for
translation files that were pulled from Transifex but had no entry (so they were
never selectable): Català (Valencià), English (Indonesia / Singapore / Turkey),
Español (Colombia), Français (France), Português (Portugal), Русский (Украина),
Türkmençe (Türkmenistan) and 吴语（简体）. Fixed language names that showed the
English name instead of the native one: Welsh → **Cymraeg** (and `cy-GB` →
*Cymraeg (Y Deyrnas Unedig)*), Acehnese → **Bahsa Acèh**, and *Afrikaans (South
Africa)* → *Afrikaans (Suid-Afrika)*. Also,
`releases/translations/pull-translations.sh` now runs a new
`report-english-regressions.mjs` after `tx pull` that lists any language file
where a previously-translated string reverted to the English source
(untranslated on Transifex), so the regression is visible instead of committed
silently.

</details>

and fixes the following tests:

<details>
<summary>Test / dev infrastructure: starting a dev server now also frees the MongoDB port, not just the app… Thanks to xet7.</summary>

**Test / dev infrastructure: starting a dev server now also frees the MongoDB
port, not just the app and rspack ports** (`build.sh`, `kill_meteor_on_port`).
Picking a "Run Meteor for dev" option stops any server already on the app port,
but it only freed the app port (3000) and the rspack dev-server port (8080) —
not Meteor's bundled MongoDB on app-port+1 (3001). When the previous meteor
parent is SIGKILLed its mongo child is often orphaned and keeps holding 3001, so
the new `meteor run` died with `Unexpected mongo exit code 48 ... port was
closed, or was already taken`. The stop step now also frees app-port+1 (which
additionally clears a leftover standalone test mongod on :3001) and waits for
all three ports before starting.

</details>

and fixes the following bugs:

<details>
<summary>Snap: MongoDB 3 → FerretDB migration failed with "EJSON.parse unavailable", and the progress…</summary>

**Snap: MongoDB 3 → FerretDB migration failed with "EJSON.parse unavailable",
and the progress dashboard should stay on the page you were on**
(`snap-src/bin/migrate-mongo3-to-ferretdb.mjs`). The migrator reads the 3.2
source with the legacy CLI and inserts into FerretDB with the modern Node
driver, which needs WeKan's current `bson` (with EJSON) and `mongodb` v6
(OP_MSG). It anchored those `require`s at paths relative to the script — but in
the snap the script runs from `$SNAP/bin/` while the bundle is at
`$SNAP/programs/server/…` (one level up), so every anchor resolved
`$SNAP/bin/programs/server/…` (nonexistent) and fell through to the ancient
meteor-spk base `bson` 1.x that has no EJSON → `FATAL: EJSON.parse unavailable`
and the migration aborted. Now it builds candidate bundle roots from `$SNAP`
(env) and the script's parent directories and searches the known modern-bundle
sub-paths under each (npm-mongo's nested v6 driver first, so the ancient v2 that
FerretDB rejects with "Unsupported OP_QUERY" is never picked). The migration
progress dashboard already answers on every URL (so reloading any board page
during migration shows progress); on completion it now reloads the **same page
you were on** instead of forcing All Boards. (The dashboard itself also gained
live per-file progress and a disk-space safety guard — see the new features
above.) Thanks to xet7.

</details>

<details>
<summary>Admin Panel / Features / Security: "Always show all code as plain text" did not take effect (links… Thanks to xet7.</summary>

**Admin Panel / Features / Security: "Always show all code as plain text" did
not take effect (links stayed clickable, code stayed rendered)**. The setting is
applied by the inner `markdown` helper, which reads a `ReactiveVar`
(`Markdown.alwaysShowCodeAsText`) that only a separate startup autorun kept in
sync. But the `mentions` viewer wrapper re-renders whenever the settings doc
changes (it reads it for "render links as plain text"), and that re-render
usually ran BEFORE the startup autorun updated the ReactiveVar — so the markdown
helper read the stale value and rendered normally, and because `mentions` does
not depend on that ReactiveVar it never re-rendered again (the race persisted
even after reload). Fixed by setting the flag inside the `mentions` helper, from
the same reactive `getCurrentSetting()` it already reads, right before it
renders the inner markdown — so the toggle now takes effect immediately in every
rich-text field (card titles, descriptions, comments, checklists).

</details>

<details>
<summary>i18n: several languages fell back to English (or clobbered another language) because a browser…</summary>

**i18n: several languages fell back to English (or clobbered another language)
because a browser language string did not map to the right translation file**.
Fixes:

</details>

  - **Japanese `ja_JP` overwrote `ja`.** The Transifex `.tx/config` `lang_map`
    had `ja_JP: ja`, writing Transifex's `ja_JP` into
    `imports/i18n/data/ja.i18n.json` — the same file the real Japanese (`ja`)
    uses — so `tx pull -a -f` reverted Japanese to the English source. Mapped to
    its own file (`ja_JP: ja-JP`); `ja`, `ja-JP` and `ja-Hira` are now three
    separate files, matching `languages.js`.
  - **Language matching is now case- and underscore/hyphen-insensitive**
    (requested): `isLanguageSupported` and a new `TAPi18n.resolveTag()` map any
    input to the canonical tag (`zh-hant` → `zh-Hant`, `JA-JP` → `ja-JP`,
    browser `af-ZA` → legacy key `af_ZA`);
    `loadLanguage`/`setLanguage`/`ensureLanguageLoaded` resolve through it so
    the loaded file, the i18next code and the stored current tag all agree.
  - **Chinese: `zh-Hans-CN` / `zh-Hant-TW` (and bare `zh`) fell back to
    English.** Browser detection now strips trailing subtags progressively
    (`zh-Hans-CN` → `zh-Hans`, `zh-Hant-TW` → `zh-Hant`) instead of jumping to
    the first segment, and bare `zh` is aliased to `zh-Hans` (Simplified). Each
    Chinese variant (`zh-CN`, `zh-TW`, `zh-HK`, `zh-Hans`, `zh-Hant`, `zh-SG`)
    maps to its own file.
  - **Mandarin (`cmn`) was unselectable** — its `tag` was the typo `cnm` (and
    `code` `cn`), which mismatched `supportedLngs`; fixed to `cmn`.

  Regression tests added in `imports/i18n/i18n.test.js`. Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.90 2026-07-15 WeKan ® release

This release fixes the following CRITICAL SECURITY ISSUE of [MimeBleed](https://wekan.fi/hall-of-fame/mimebleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/security/advisories/GHSA-jhph-whx8-wq6p">MimeBleed: file-upload MIME-type validation bypass → stored XSS on deployments without the file…</a></summary>

**[MimeBleed](https://github.com/wekan/wekan/security/advisories/GHSA-jhph-whx8-wq6p):
file-upload MIME-type validation bypass → stored XSS on deployments without the
`file` binary** ( GHSA-jhph-whx8-wq6p , CWE-434 Unrestricted Upload of File with
Dangerous Type). WeKan's upload validation (`models/fileValidation.js`) detects
a file's real MIME type by running the Unix `file` command. On minimal
Docker/Alpine images where `file` is not installed, `detectMimeFromFile()`
silently returned `undefined` and the code fell back to the **client-supplied**
`fileObj.type`. An authenticated board member (with `WITH_API=true`) could
therefore upload an HTML file containing JavaScript while setting `fileType:
"image/png"`: the spoofed type is not on the dangerous-MIME deny-list, so the
dangerous-content scan was skipped and the file was stored, yielding stored XSS
served under the WeKan origin (session theft / actions as the victim, including
admin)

</details>

  - **Fixed** so the client-supplied type can never gate the safety scan: when
    content-based detection via `file` is unavailable, WeKan now falls back to a
    **dependency-free JS content sniff** (`looksLikeDangerousMarkup()`) that
    inspects the real bytes for HTML/SVG/XML/`<script>` signatures and forces
    the dangerous-content scan regardless of the claimed MIME — so a spoofed
    `image/png` that is actually HTML+JS is caught and rejected. The sniff only
    matches definitive markup signatures, so genuine binary uploads (real
    PNG/JPEG/PDF, including large ones) are unaffected. WeKan also now logs a
    one-time warning when the `file` command is missing (previously the failure
    was silent). A regression test
    (`server/lib/tests/fileValidationBypass.security.tests.js`) covers both the
    spoofed dangerous uploads and safe binaries. CVSS:3.1 8.3 High
    (AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N).
  - Affected container deployments without the `file` binary and
    `WITH_API=true`; fixed at the upcoming WeKan release. Reported by
    **HNUfwj**. Also install the `file` package for full content-based MIME
    detection (WeKan's official images already do).
  Thanks to HNUfwj and xet7.

and adds the following new features:

- **Admin Panel / Features / Security: import/export privacy controls**. Six new
  optional toggles govern how boards and user data cross the WeKan boundary:
  - **Disable all import** / **Disable all export** — master switches that turn
    off every import / export feature (WeKan JSON, Trello, CSV/Excel, Jira,
    Kanboard, NextCloud Deck, OpenProject, GitHub/GitLab/Gitea/Forgejo, board
    clone, and the single-attachment export). The server rejects any such
    request, and the import / export menu options are hidden in the UI.
  - **Disable import avatars** / **Disable export avatars** — never carry
    avatars (profile pictures) into / out of WeKan. Import covers WeKan JSON
    import, Trello import and external identity-provider avatar sync on login
    (LDAP, OIDC/OAuth2), gated at the single `localizeAvatarFromBuffer` choke
    point; export covers WeKan JSON and CSV export.
  - **Anonymize import users** / **Anonymize export users** — replace every
    user's username, full name and initials with counter placeholders (user1,
    user2, ...), drop their avatar, and rewrite `@username` mentions plus the
    requested-by / assigned-by fields inside card and comment content, so the
    imported board / exported file carries no real user identity. The
    placeholder word "user" follows the language of the person
    importing/exporting (e.g. "käyttäjä1" in Finnish). Both export paths are
    covered — the in-memory `build()` and the streaming `buildStream()` (which
    does a lightweight id-only pre-scan so mentions streamed before the users
    array still resolve to matching labels).

  All six default to off (current behaviour). Enforcement lives server-side in the
  Exporter, the WekanCreator import path and the avatar localizer, so it cannot be
  bypassed from the client. Thanks to xet7.
<details>
<summary>Admin Panel / Features / Security: new optional "Always show all code as plain text" toggle. Thanks to xet7.</summary>

**Admin Panel / Features / Security: new optional "Always show all code as plain
text" toggle**. When enabled, rich text is never rendered as markdown or HTML —
the entire source is shown as escaped plain text in every rich text field (board
and card titles, descriptions, comments, checklists, etc.), so hidden content is
always revealed: HTML comments (`<!-- -->`), the target URL inside a markdown
link, JavaScript and any other code. All code is always visible, not clickable,
and not running. This extends the existing invisiblebleed protection (which
already showed raw source for description-less markdown links) to all content.
The `wekan-markdown` package cannot import app code, so the setting is bridged
to the markdown renderer through a reactive flag on the exported `Markdown`
object, kept in sync by the rich text viewer. Stored as the global
`alwaysShowCodeAsText` setting; default off, so markdown renders normally.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6453">Admin Panel / Features: new optional "Render links as plain text" security toggle</a>. Thanks to bcook-konza and xet7.</summary>

**Admin Panel / Features: new optional "Render links as plain text" security
toggle**. When enabled, all links — both markdown links like `[label](url)` and
raw HTML `<a href>` tags — are always shown as plain, non-clickable text in
every rich text field (board and card titles, descriptions, comments,
checklists, etc.), so a link can never be clicked and cannot present misleading
anchor text. This is a hardening option on top of the existing XSS sanitization
(which already strips `javascript:`/`data:` schemes, event-handler attributes
and dangerous tags): it addresses #6453 , where a board title could render as a
clickable link. The toggle lives under Admin Panel / Features / Security, is
stored as the global `renderLinksAsPlainText` setting, and defaults to off
(links stay clickable). Implemented by forbidding the `<a>` tag (while keeping
its visible text) in the shared DOMPurify sanitizer used by the rich text
viewer, gated on the setting so toggling it re-renders reactively

</details>

and adds the following updates:

<details>
<summary><a href="https://github.com/wekan/wekan/issues/5143">Outgoing webhooks / notifications: include the card description</a>. Thanks to xet7.</summary>

**Outgoing webhooks / notifications: include the card description** ( #5143 ). A
card's description was saved to the activity log (a `a-changedDescription`
activity, #5482) but was never put into the outgoing-webhook / notification
payload, so integrations received an event with no description text. The payload
now carries `description` (the card's current description, added only when
non-empty) for every card event, and — for a description *change* — the
before/after text as `oldValue` / `value` (previously only
`timeValue`/`timeOldValue` were forwarded). New fields are additive, so existing
webhook consumers are unaffected

</details>

- [Update Sandstorm Docs about how to install newest test
  version](https://github.com/wekan/wekan/commit/422daa6a0c33a578ebd84a77e7a537caf73f2510).
  Thanks to xet7.

and fixes the following tests:

<details>
<summary>Test infrastructure: fix meteor test (Mocha, server-side) crashing at boot with 0 tests run.</summary>

**Test infrastructure: fix `meteor test` (Mocha, server-side) crashing at boot
with 0 tests run** (`scripts/patch-yargs-dirname.cjs`). The whole `yargs`
package is dragged into the Meteor **test** server bundle as a transitive
devDependency, and Meteor 3 wraps every module in a CommonJS function
`function(require, exports, module, __filename, __dirname){…}`. yargs (and its
ESM dependencies) ship native-ESM constructs that are illegal inside that
wrapper and crash the bundle before a single test runs:

</details>

  - `import.meta.url` / `import.meta.resolve(…)` → "Cannot use 'import.meta'
    outside a module"
  - `const __dirname = …` → "Identifier '__dirname' has already been declared"
  - `const require = createRequire(import.meta.url)` (and the guarded bundler
    variant `const require = createRequire ? createRequire(import.meta.url) :
    undefined`) → "Identifier 'require' has already been declared"

  A `postinstall` patch (`patch-yargs-dirname.cjs`) rewrites those constructs to the
  wrapper's own `__filename` / `__dirname` / `require` (yargs is never executed here —
  it only needs to *parse* as CommonJS). Getting the patch right took several iterations,
  each of which failed in a way that looked like an unrelated source-level syntax error:
  1. The patch expanded `import.meta.url` **before** stripping
     `const require = createRequire(…)`. The expansion injected a `require('url')…`
     call whose `)` then terminated the paren-naive `createRequire\([^)]*\)` match early,
     leaving a dangling `.pathToFileURL(__filename).href))` — reify then died with
     `SyntaxError: Unexpected token (19:33)` on the **generated** yargs `esm.mjs`, not on
     any repo file. Diagnosing it required instrumenting reify's Babel parser in the
     Meteor **dev_bundle** copy to dump the exact source string it was choking on, because
     every scan of the repo's own `*.js` came back clean (the broken file was in
     `node_modules`, was `.mjs`, and was *produced by the patch itself*). Fixed by
     removing the `createRequire` line **before** expanding `import.meta.url`, plus a
     repair rule that collapses any already-corrupted `…href))` leftover back to a marker.
  2. With parsing fixed, a **second** ESM shim surfaced at boot — this time in a yargs
     *dependency*, `node_modules/yargs-parser/build/lib/index.js` (not under
     `node_modules/yargs`, so `import.meta.url` there was still unexpanded, a tell that
     the old yargs-only scan had never touched it). Its line 30 used the guarded ternary
     `const require = createRequire ? createRequire(import.meta.url) : undefined;`, whose
     `createRequire ?` (space, not `(`) slipped past the direct `createRequire\(` matcher
     → the leftover `const require` collided with the wrapper parameter and the server
     bundle crashed at **boot** with "Identifier 'require' has already been declared".
     Two changes fixed it: (a) generalize the removal (and its trigger) from
     `const require = createRequire\(…\)` to a line-wise `const require = …createRequire…;`
     so it matches both the direct call and the guarded-ternary form, running it *before*
     the `import.meta.url` expansion so the injected `require('url')…` parens can never
     confuse it; and (b) broaden the scan from just `node_modules/yargs` to yargs **and
     its ESM dependency packages** (`yargs-parser` is the actual offender; cliui, escalade,
     string-width, y18n, get-caller-file, require-directory are scanned too and are
     harmless to include).

  The patch is idempotent, best-effort (never fails an install), and re-runnable by hand
  (`node scripts/patch-yargs-dirname.cjs`) to repair a `node_modules` tree left broken by
  an older version. This is a pre-existing test-only build breakage (the yargs bundling
  predates these fixes); production runtime bundles were never affected. Separately, three
  server test files were present on disk but missing from the curated loader
  `server/lib/tests/index.js` (which the `meteor test` entry imports explicitly rather than
  by `*.tests.js` convention), so they had silently never run — the MimeBleed file-validation
  bypass regression, the import/export privacy settings, and the impersonation report query
  are now registered. With all of the above, the server suite boots and runs clean:
  **450 passing, 0 failing** (411 before the three files were wired in). Thanks to xet7.
<details>
<summary>Test infrastructure: build.sh and build.bat now show live progress in every test path.</summary>

**Test infrastructure: `build.sh` and `build.bat` now show live progress in
every test path**. Several places used to sit silent for minutes, which looked
like a hang. Audited both scripts and closed every gap:

</details>

  - **Server-start wait** (both "Run ALL tests" modes). While the `:3000` server
    came up, the readiness wait printed only dots. `.sh` now shows live progress
    (see the `.build/bundle` item below, where it streams the boot log
    scrolling); `.bat` prints a check counter now and then and points at the
    live server log to `type` in another window (on cmd, echoing arbitrary log
    lines is unsafe as they can contain `> < | &`).
  - **Fixed the readiness poll hanging so nothing showed for minutes** (the
    progress line froze at `[0s]`). The wait polled `curl
    http://127.0.0.1:3000/sign-in` with no timeout; Meteor binds the :3000 proxy
    early and accepts the TCP connection while the app is still building but
    sends no HTTP response until it finishes, so `curl` blocked on that first
    connection for the whole build and the loop never advanced. Added
    `--connect-timeout 2 --max-time 4` so each poll returns quickly, and the
    wait is now bounded by wall-clock time (`.sh` 1200s / `.bat` ~240 polls)
    rather than a fixed count (also applied to the Playwright-ALL precheck).
  - **Sequential per-job** (menu option 2). Each job used to block/redirect to a
    log with nothing on screen while it built and ran. Because only one suite
    runs at a time in this mode, `.sh` now streams each suite's reporter output
    **straight to the console** via `tee` (also saving the log), so you see
    every test tick by one-by-one as Mocha / Playwright / the E2E harness prints
    it, then a final PASS/FAIL + count line; `.bat` runs each job in its own
    minimized window (reusing the proven parallel start-commands + `.done-<key>`
    flags) and polls a live pass counter, one at a time.
  - **Playwright "ALL browsers" single menu item** (`.sh` option 10 /
    `run_playwright_parallel`). It redirected each browser to a log and only
    dumped the output after all finished. It now streams each browser's
    Playwright `list` reporter live via `tee` (progress visible per test) while
    still saving the log; `PIPESTATUS[0]` keeps the per-browser pass/fail
    accurate through the pipe.
  - The single-suite menu items (Mocha, import regression, Node E2E, single
    Playwright browser) already stream straight to the terminal, and the
    parallel-mode combined progress table is unchanged. Thanks to xet7.
<details>
<summary>Test infrastructure: "Run ALL tests" reuses the precompiled .build/bundle for the :3000 server… Thanks to xet7.</summary>

**Test infrastructure: "Run ALL tests" reuses the precompiled `.build/bundle`
for the :3000 server instead of recompiling with `meteor run`** (both `build.sh`
and `build.bat`). Node E2E and Playwright drive a live WeKan over HTTP; that
server is now started from the production bundle you already built with `meteor
build .build --directory` — `node main.js` boots in seconds with no recompile,
using Meteor's bundled `node` and `mongod` (mongod on :3001, or an
already-running MongoDB there is reused). Its one-time `programs/server` npm
install and its boot log now stream live (scrolling) so you can see exactly what
is happening. Two caveats that are inherent to Meteor and are called out in the
script: (1) the bundle is run **as-is**, so after changing source you must
rebuild it or the tests run old code; (2) the server-side **Mocha** suite still
uses `meteor test` (its own `.meteor/local-test` build) — the in-process
unit/security tests cannot run from a production bundle, so copying the bundle
would not help them. In **sequential** mode the suites run strictly one at a
time, each streaming its own output, and the parallel-only combined table is
skipped (only the live WeKan server + MongoDB run alongside — they are the
system under test, not parallel test jobs). Before starting, the run checks for
the **`.build/bundle`** directory specifically (not just `.build`) and builds it
once with `meteor build .build --directory` if it is missing or incomplete, so a
first run with no bundle still works. The bundle server talks to the
**`meteor`** database on :3001 — the DB name Meteor's built-in mongo used under
`meteor run` and the one the Playwright / Node E2E tests seed into
(`tests/playwright/helpers/db.js`, `tests/e2e/list-regressions.js`); an earlier
`/wekan` name made the app read an empty database while the tests seeded a
different one, so every seeded test failed until the names were aligned. Both
the Bash and the Windows batch runners now use this bundle-based :3000 server
(the `.bat` resolves Meteor's bundled `node` / `mongod` from the dev_bundle,
starts mongod in a minimized window, and stops it on exit only when it started
it).

</details>

and fixes the following bugs:

<details>
<summary>Sandstorm: the WeKan Admin Panel is now always available in a migrated grain, not just a freshly… Thanks to xet7.</summary>

**Sandstorm: the WeKan Admin Panel is now always available in a migrated grain,
not just a freshly created one**. On Sandstorm the grain owner (Sandstorm
`configure` permission) is mapped to a WeKan admin, which gates the Admin Panel
(and Admin Panel / Attachments / Sandstorm, used to delete leftover files after
a migration). A brand-new grain worked because `Users.after.insert` derives the
role for the new user, but a grain migrated from an older WeKan already contains
the user, so that insert hook never runs. Sandstorm auto-login uses
`connection.setUserId()` (bypassing accounts-base, so `Accounts.onLogin` never
fires), and the only remaining hook — an `observeChanges` on
`services.sandstorm` — fires solely when that field actually changes on login.
When the migrated user's stored permissions already equal the grain's current
permissions, the login `$set` is a no-op with no oplog entry, so the role was
never derived and the owner had no Admin Panel. WeKan now reconciles this at
grain startup (a migrated grain reboots once migration completes): every
Sandstorm user whose stored permissions include `configure` is granted WeKan
admin. It only promotes, never revokes, so a stale/empty stored permission set
can never lock the owner out.

</details>

<details>
<summary>Admin Panel / Version: show the MongoDB storage engine even with per-database credentials (no more… Thanks to xet7.</summary>

**Admin Panel / Version: show the MongoDB storage engine even with per-database
credentials (no more "unknown")**. The storage engine was read only from the
`serverStatus` command, which requires the cluster-level `clusterMonitor` role.
A per-database WeKan user (`readWrite` on the `wekan` database only, as in the
`docs/Platforms/FOSS/Docker/Meteor3/` setup) is not authorized to run it, so the
command was rejected and the field stayed `unknown`. WeKan now falls back to a
`$collStats` aggregation (which needs only the `collStats` action that
`read`/`readWrite` already grant) and reads the real engine — `wiredTiger` (or
`inMemory`) — from `storageStats`. The MongoDB compatible version and Database
commit were already correct: they come from `buildInfo`, which needs no special
privileges.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.89 2026-07-13 WeKan ® release

This release fixes the following CRITICAL SECURITY ISSUE of
[SortBleed](https://wekan.fi/hall-of-fame/sortbleed/):

<details>
<summary><a href="https://wekan.fi/hall-of-fame/boardbleed/">SortBleed: a low-privilege (comment-only / read-only) board member could escalate to board admin…</a></summary>

**[SortBleed](https://github.com/wekan/wekan/security/advisories/GHSA-xm8x-c8wg-jhmf):
a low-privilege (comment-only / read-only) board member could escalate to board
admin and take over a private board via the board `sort` collection-allow rule**
([GHSA-xm8x-c8wg-jhmf](https://github.com/wekan/wekan/security/advisories/GHSA-xm8x-c8wg-jhmf),
CWE-863 Incorrect Authorization, CWE-269 Improper Privilege Management). Same
broken-access-control class as BoardBleed (CVE-2026-55234) — a Meteor collection
allow-rule field conflation — but on the Board document itself. To support
drag-to-reorder on the All Boards / Public Boards pages, a second
`Boards.allow({ update })` rule returned `true` for any board member whenever
the update touched the `sort` field. Meteor evaluates allow rules with OR
semantics and does **not** scope an approving rule to the field that satisfied
it: once any allow callback returns `true` and no deny callback returns `true`,
the **entire** modifier is applied. Because `canUpdateBoardSort` only checked
that `sort` was **among** the modified fields (not that it was the **only**
one), a comment-only / read-only member could smuggle arbitrary board mutations
into the same `$set` as `sort` in a single unprivileged DDP `Boards.update`
call: `{$set: {sort: 99, members: [...only themselves as admin...], permission:
'public', title: '...'}}`. The member could therefore make themselves board
admin, flip a private board to public (world-readable in Wekan), rename it, and
evict the legitimate owner. The last-admin deny rule did not help because it
only inspected `$pull`, so a wholesale `$set` of the `members` array bypassed it
entirely

</details>

  - **Fixed** by restricting `canUpdateBoardSort` (`server/lib/utils.js`) so the
    sort-reorder rule approves an update **only** when `sort` is the sole
    modified field (`fieldNames` is exactly `['sort']`) — it can no longer
    approve a modifier that also mutates `members`, `permission`, `title` or
    anything else. As defense in depth, the last-admin deny rule
    (`server/permissions/boards.js`) now also rejects a `$set` rewrite of the
    `members` array that would drop the last active admin, not just a `$pull`. A
    regression test covers the multi-field smuggling case
    (`server/lib/tests/boards.security.tests.js`). The legitimate All Boards
    drag-reorder is unaffected: it persists the order per-user in
    `profile.boardSortIndex` (`Users.setBoardSortIndex`), not in the board
    document. CVSS:3.1 8.8 High (AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H).
  - Affected Wekan v9.85 and earlier through the current release; fixed at the
    upcoming WeKan release. Reported by **5ud0 / Tarmo Technologies**.
  Thanks to 5ud0 / Tarmo Technologies and xet7.

and adds the following updates:

- Update Sandstorm WeKan info. [Part
  1](https://github.com/wekan/wekan/commit/1bf68f54b29ab29a54abb90f777a88be4aa45d7e),
  [Part
  2](https://github.com/wekan/wekan/commit/ade9f16db459708200f4d7677c3877f1cdc837a4),
  [Part
  3](https://github.com/wekan/wekan/commit/0d90011affcf3789ed3ea820db5f3402ad1019b3).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.88 2026-07-13 WeKan ® release

This release adds the following new features:

- [Added docs about new Sandstorm
  WeKan](https://github.com/wekan/wekan/commit/9f23e6384bdfa5ca81be18e4f0426c347e9894eb).
  Thanks to xet7.

and fixes the following bugs:

<details>
<summary>Sandstorm build: fixed "not writing through dangling symlink" that failed the sandstorm.yml… Thanks to xet7.</summary>

**Sandstorm build: fixed "not writing through dangling symlink" that failed the
`sandstorm.yml` workflow at `sandstorm-src/build-deps.sh` step [3/7]**. The
meteor-spk 0.6.0 base ships some runtime libs in `meteor-spk.deps/lib` as
DANGLING symlinks (e.g. `libstdc++.so.6` → a library that no longer exists), so
refreshing them with the host's newer libs failed: `cp -fL` refuses to write
through a dangling destination symlink. Added `--remove-destination` so `cp`
deletes the existing destination (dangling symlink included) before copying the
host's real library.

</details>

<details>
<summary>Sandstorm build: write the signing keyring to the path meteor-spk pack actually reads. Thanks to xet7.</summary>

**Sandstorm build: write the signing keyring to the path `meteor-spk pack`
actually reads**. The `sandstorm.yml` "Restore the Sandstorm signing keyring"
step wrote the decoded `SANDSTORM_KEYRING` secret to
`~/.sandstorm/sandstorm-keyring`, but `meteor-spk` / `spk` read the app private
key from `~/.sandstorm-keyring` (a file directly in `$HOME`), so packing aborted
with `open(~/.sandstorm-keyring): No such file or directory` even when the
secret was set. Now it writes `~/.sandstorm-keyring`, and — since the `.spk`
cannot be signed without it — fails early with an actionable message when the
secret is missing, instead of the cryptic later crash.

</details>

<details>
<summary>Sandstorm .spk: trim it back toward Cloudflare's 100 MB upload limit.</summary>

**Sandstorm .spk: trim it back toward Cloudflare's 100 MB upload limit**. The
Sandstorm build no longer bundles the ~300 MB of modern MongoDB Database Tools
(wekan/mongo-tools) — they are unused in Sandstorm (grains back up/restore
themselves; the MongoDB 3 → FerretDB migration uses the legacy migratemongo CLIs
+ the `.mjs` importer). Also set `PUPPETEER_SKIP_DOWNLOAD=1` for the Meteor
build (puppeteer is a test-only devDependency, so its ~150 MB Chromium never
belongs in the `.spk`), and the pack step now prints the `.spk` size and warns
if it exceeds 100 MB. (The Database Tools remain in the WeKan `.zip` bundle /
Docker / Snap, which do use them.) Thanks to xet7.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/143607ef22ae91803cb611053fd4ce00754e7096">Sandstorm .spk: bundle the matching glibc dynamic loader so grains start</a>. Thanks to xet7.</summary>

Sandstorm .spk: bundle the matching glibc dynamic loader so grains start : the
`.spk` bundled the host's new glibc `libc.so.6` (Ubuntu 24.04, glibc 2.39) but
kept the old glibc 2.31 `ld-linux` from the meteor-spk 0.6.0 base, so `node`
failed at startup with `libc.so.6: undefined symbol: _dl_audit_symbind_alt,
version GLIBC_PRIVATE` (HTTP-BRIDGE exit 127) and the grain crash-looped.
`sandstorm-src/build-deps.sh` now also copies the host's `ld-linux-x86-64.so.2`
so the loader and libc are the same glibc, and adds a `[verify]` gate that fails
the build if they differ or the bundled `node` cannot run under them — turning a
silent grain crash-loop into a loud build failure

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66d8706c4d2afab4d127f8c63e05d43407efaf30">Sandstorm build workflow: enable unprivileged user namespaces and build the dispatched branch</a>. Thanks to xet7.</summary>

Sandstorm build workflow: enable unprivileged user namespaces and build the
dispatched branch : Ubuntu 24.04 defaults
`kernel.apparmor_restrict_unprivileged_userns=1`, which blocks the unprivileged
user namespaces the Sandstorm install and the `spk` supervisor rely on, so
`sandstorm.yml` now relaxes it on the runner. A new `ref` `workflow_dispatch`
input also lets the workflow build a fix branch before it is merged, instead of
a hardcoded `main`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60116bc72f68c7bc0aa56a7d5700e33b98e870af">Meteor unit tests: fix server-boot crash from __dirname in an ESM test file</a>. Thanks to xet7.</summary>

Meteor unit tests: fix server-boot crash from `__dirname` in an ESM test file :
`server/lib/tests/dependencies.openapi.tests.js` is an ES module that referenced
the bare `__dirname` global; under Node 24 / Meteor 3.5 the compiler injects
`const __dirname = fileURLToPath(import.meta.url)`, colliding with the
`__dirname` the CommonJS module wrapper already provides, so the server bundle
failed to boot with `Identifier '__dirname' has already been declared` and the
"Meteor unit tests" CI job died before any test ran. Drop the `__dirname` seed
(`process.env.PWD` already reaches the repo root under `meteor test`)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c28b40fd41acd9b9e21671548411f25e55464b8">Sandstorm .spk: point FerretDB state dir to writable /var so the grain starts</a>. Thanks to xet7.</summary>

Sandstorm .spk: point FerretDB state dir to writable /var so the grain starts :
FerretDB persists a `state.json` (version/UUID) via its state provider even with
telemetry disabled, and its `--state-dir` defaults to `.` — which in a Sandstorm
grain is `/`, read-only. So FerretDB failed with `Failed to create state
provider: failed to persist state: open /state.json: read-only file system`,
exited (code 1), and the grain crash-looped. `sandstorm-src/start.js` now
creates `/var/ferretdb` and passes `--state-dir=/var/ferretdb` (plus
`FERRETDB_STATE_DIR`) in `startFerret()`, covering both the migration and
steady-state FerretDB launches

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f4f22bbe24e10659cc80cd1efeb6b4890b58ea49">Sandstorm .spk: don't crash the grain when capnp.node can't load on Node 24</a>. Thanks to xet7.</summary>

Sandstorm .spk: don't crash the grain when capnp.node can't load on Node 24 :
WeKan on Sandstorm bundles Node 24, but `capnp.node` (node-capnp) is built for
an older Node ABI (NODE_MODULE_VERSION 83 = Node 14), so `Npm.require('capnp')`
in `sandstorm.js` failed with `ERR_DLOPEN_FAILED` and crash-looped the whole
grain on boot. Cap'n Proto is now loaded lazily in a `try/catch` and degrades
gracefully: the grain boots and core WeKan works, because login and user
identity come from the sandstorm-http-bridge `X-Sandstorm-*` HTTP headers
(`wekan-accounts-sandstorm`) and need no Cap'n Proto. Only the two capnp-only
features are skipped when the addon cannot load — the Powerbox identity-claim
method and Sandstorm activity notifications — with a clear warning. They can be
restored by rebuilding node-capnp for Node 24, or reimplemented over the
bridge's HTTP/JSON API

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8549a62c85f43ad48e8f049eead64691c3f1dbf0">Snap release: build amd64+arm64 natively on GitHub, exotic arches non-blocking on Launchpad</a>. Thanks to xet7.</summary>

Snap release: build amd64+arm64 natively on GitHub, exotic arches non-blocking
on Launchpad : the single snap job ran `snapcraft remote-build` for all 5
platforms on Launchpad and blocked until the slowest resolved, so the release
hung ~3.5h on riscv64's Launchpad queue even though amd64+arm64 finished in
minutes. It is now split in two: `snap-native` builds amd64 (`ubuntu-24.04`) and
arm64 (`ubuntu-24.04-arm`) natively on GitHub runners via
`snapcore/action-build`; `snap-launchpad` builds s390x/ppc64el/riscv64 on
Launchpad in a non-blocking (`continue-on-error`), per-arch matrix
(`remote-build --build-for <arch>`) so a slow or failed exotic arch never delays
the release or the other arches. Each arch publishes to the Snap Store
(candidate,beta,edge) and attaches to the GitHub Release the moment it finishes
— all 5 arches still ship

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60e40199c965460b95528ef9ea07281172c2d9b6">Sandstorm .spk: fix server-boot crashes from stale globals (Users, HTTP) in sandstorm.js</a>. Thanks to xet7.</summary>

Sandstorm .spk: fix server-boot crashes from stale globals (Users, HTTP) in
sandstorm.js : once the capnp load was made non-fatal, the grain reached the
rest of `sandstorm.js` and hit two latent Meteor-2.x-isms the Meteor 3.x
migration missed (this file only runs on Sandstorm, so it was not exercised): it
referenced the `Users`/`Boards`/`Swimlanes`/`Activities` collections as implicit
globals, but those are now ES module default exports, so `Users.after.insert`
threw `Users is not defined` at boot; and it monkey-patched `HTTP.methods` from
the removed `meteor/http` package, so `HTTP` was undefined. The collections (and
`Accounts`) are now imported explicitly, and the obsolete `HTTP.methods` patch
is removed

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/975316f5cd6e81b6ea8ae6ede588d26055f9f649">Sandstorm .spk: use boolean index options so FerretDB accepts the users index</a>. Thanks to xet7.</summary>

Sandstorm .spk: use boolean index options so FerretDB accepts the users index :
`wekan-accounts-sandstorm` created the unique index on `services.sandstorm.id`
with `{unique: 1, sparse: 1}`. Real MongoDB accepts the truthy `1`, but FerretDB
(used by the Sandstorm `.spk`) is strict and rejects it with `The field 'unique'
has value unique: 1, which is not convertible to bool`, crashing the grain at
boot during index creation. Now uses real booleans (`unique: true, sparse:
true`)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/013b6b5266be34326e36762b1a50e212237b109d">Sandstorm .spk: strip Accept-Encoding so the grain doesn't serve corrupted (gzip) content</a>. Thanks to xet7.</summary>

Sandstorm .spk: strip Accept-Encoding so the grain doesn't serve corrupted
(gzip) content : the grain boots, but the page failed to load with a browser
"Corrupted Content Error" (`NS_ERROR_NET_CORRUPTED_CONTENT`).
`sandstorm-http-bridge` advertises `Accept-Encoding: gzip` to the app regardless
of what the browser actually sent, so Meteor served gzip/brotli-encoded
responses the browser could not decode. A `WebApp.rawHandlers` middleware now
strips `Accept-Encoding` (it runs before Meteor's static/boilerplate serving) so
responses go out uncompressed; bandwidth is a non-issue behind the local bridge

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f0706e45f26aa0937a15a2a8f7336df63830511">Sandstorm .spk: bundle a modern sandstorm-http-bridge to fix "Corrupted Content"</a>. Thanks to xet7.</summary>

Sandstorm .spk: bundle a modern sandstorm-http-bridge to fix "Corrupted Content"
: the grain boots, but the page failed with a browser "Corrupted Content Error"
(`NS_ERROR_NET_CORRUPTED_CONTENT`) on WeKan's `/` redirect. The meteor-spk 0.6.0
base bundles an ancient (~2016) `sandstorm-http-bridge` that mangles responses
(it always advertises `Accept-Encoding: gzip` to the app and mishandles
redirect/encoding). `build-deps.sh` now overwrites the bundled
`/sandstorm-http-bridge` with the modern one from a Sandstorm install
(`/opt/sandstorm/latest/bin/sandstorm-http-bridge`; override with
`SANDSTORM_HTTP_BRIDGE`), and `sandstorm.yml` installs Sandstorm before
assembling the deps so the bridge is available on the CI runner

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ccdd1a0846ffed64546265c38263c7e1b8530480">Sandstorm .spk: fix the "/" redirect (malformed Location + Content-Length mismatch)</a>. Thanks to xet7.</summary>

Sandstorm .spk: fix the "/" redirect (malformed Location + Content-Length
mismatch) : the grain's `/` served a broken `301`: the `Location` was
`.../:6080board` because `FlowRouter.path()` does not resolve on the server in
Meteor 3.x (it returned the bare route name `board`), and the response
advertised `Content-Length: 90` while sending an empty body — which the browser
rejected as a "Corrupted Content Error" (`NS_ERROR_NET_CORRUPTED_CONTENT`). The
handler now builds the board path directly (`/b/:id/:slug`) and sends a real
HTML body (meta refresh + link) with a matching `Content-Length`, so the
redirect to the hard-coded Sandstorm board works

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b5945cf596be546b9440854ee9c39520c3c715c0">Sandstorm .spk: open the grain on the All Boards page, not a hard-coded board</a>. Thanks to xet7.</summary>

Sandstorm .spk: open the grain on the All Boards page, not a hard-coded board :
WeKan on Sandstorm originally opened a single hard-coded board
(`/b/sandstorm/libreboard`) and redirected `/` to it. It now supports many
boards and that board is no longer the right destination, so the
`WebApp.handlers.get("/")` redirect is removed entirely — `/` now falls through
to WeKan's normal serving, whose client `home` route renders the **All Boards**
list, the right landing page for a multi-board grain. This also removes the last
server-side redirect the browser was rejecting as a Corrupted Content Error

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8f11e8ac66d7348f62e8cf9278f4196b44c719b0">Sandstorm .spk: don't auto-create a board; map grain permissions to global role</a>. Thanks to xet7.</summary>

Sandstorm .spk: don't auto-create a board; map grain permissions to global role
: a new grain/user no longer gets a hard-coded `sandstorm`/libreboard board
auto-created — WeKan on Sandstorm is multi-board now, so the user creates their
own boards from the All Boards page. `updateUserPermissions` previously added
the user as a member of that single board (which would now crash since the board
no longer exists); it now maps the grain's Sandstorm permissions to the user's
**global** WeKan role — `configure` (grain owner) becomes a WeKan admin,
everyone else is a regular user who can create and manage their own boards

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b0712e6656ce33bfe7c360547185fea04660c9f7">Sandstorm .spk: set SANDSTORM=1 so the header-based auto-login runs</a>. Thanks to xet7.</summary>

Sandstorm .spk: set SANDSTORM=1 so the header-based auto-login runs : WeKan
loaded in the grain but every page showed "Must be logged in". The
`wekan-accounts-sandstorm` client only starts the automatic `X-Sandstorm-*`
header login when `__meteor_runtime_config__.SANDSTORM` is set, and the package
only sets that when `process.env.SANDSTORM` is present — which nothing did. The
launcher now sets `process.env.SANDSTORM = '1'` before loading the WeKan bundle,
so the client auto-logs-in the Sandstorm user from the headers

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5f707fd37b63ff038f61d7aa1316d5800859b35">Sandstorm .spk: rewrite ROOT_URL per request to the grain URL (fixes login + CORS)</a>. Thanks to xet7.</summary>

Sandstorm .spk: rewrite ROOT_URL per request to the grain URL (fixes login +
CORS) : WeKan loaded but stayed on "Must be logged in", and the console showed
`Cross-Origin Request Blocked …
http://127.0.0.1:4000/__meteor__/dynamic-import/fetch`. The launcher sets a
fixed `ROOT_URL` (`http://127.0.0.1:4000`, the internal bridge target), but
Sandstorm serves each grain at a per-session host (`ui-<hash>.<host>`), so the
client sent its DDP connection and dynamic-import fetches to `127.0.0.1:4000` —
cross-origin and unreachable — and the header-based login handshake (a DDP
method call) never completed. A `WebApp.addRuntimeConfigHook` now rewrites
`ROOT_URL` to the grain's real base URL (`X-Sandstorm-Base-Path`) per request,
so DDP, dynamic imports and the Sandstorm auto-login work

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f3174b23d7072a383703a5fe03711090fe9f844">Sandstorm .spk: bounce from sign-in to the boards list once auto-login lands</a>. Thanks to xet7.</summary>

Sandstorm .spk: bounce from sign-in to the boards list once auto-login lands :
the Sandstorm login was actually succeeding (`Meteor.userId()` gets set), but
the grain stayed on the sign-in page. WeKan's home route checks
`Meteor.userId()` once and, because the Sandstorm header login is asynchronous
and uses `connection.setUserId()` (bypassing accounts-base, so
`Accounts.onLogin` never fires), finds it still null on first render and
redirects to `atSignIn` — where the user is stranded even after login completes.
A Sandstorm-only reactive autorun now sends the user from `atSignIn` back to
`home` as soon as `Meteor.userId()` is set, so the grain lands on the All Boards
page

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68e59ab66f68d1c60bc10c954c50999809e5381b">Sandstorm .spk: keep the grain URL in sync with the in-app route</a>. Thanks to xet7.</summary>

Sandstorm .spk: keep the grain URL in sync with the in-app route : navigating
between boards worked but the Sandstorm shell's grain URL never updated (it
stayed on the grain root), unlike standalone WeKan. The path was synced via a
global `FlowRouter.triggers.enter` callback, which does not fire reliably on
client navigation in this flow-router-extra / Meteor 3 setup; it is now synced
from a reactive `Tracker.autorun` on `FlowRouter.watchPathChange()` (the same
mechanism the title sync uses), so every route change updates the grain URL to
`/grain/<id><path>`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc8ff6e6ca3093298d5e07f2c8726f597d672449">Sandstorm .spk: upload attachments over DDP (bridge strips Meteor-Files' HTTP headers)</a>. Thanks to xet7.</summary>

Sandstorm .spk: upload attachments over DDP (bridge strips Meteor-Files' HTTP
headers) : adding a file to a card in the grain failed with HTTP 400 `Can't
continue upload, session expired [408]` and the file silently disappeared.
Meteor-Files' HTTP upload signals the first chunk with an `x-start` header and
tracks the session with `x-mtok`/`x-chunkid`/`x-fileid`/`x-eof`, but Sandstorm's
request-header whitelist does not include them, so the `sandstorm-http-bridge`
strips them — the server never sees `x-start`, treats every request as a chunk
continuation, cannot find the session and returns 408. Attachment uploads now
use `transport: 'ddp'` on Sandstorm (DDP method calls, no custom HTTP headers);
HTTP transport is kept everywhere else

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ca7bd3bb6016f560aaa3f748bbb23cec514acf0">Sandstorm .spk: authorize attachment/avatar downloads via X-Sandstorm-User-Id</a>. Thanks to xet7.</summary>

Sandstorm .spk: authorize attachment/avatar downloads via X-Sandstorm-User-Id :
once uploads worked, the uploaded image still showed as a broken thumbnail,
minicard cover and slideshow in the grain — the file was on disk but the
download returned HTTP 403. The download route
(`server/routes/universalFileServer.js`) authorizes files on private boards with
a Meteor login token (Authorization / X-Auth-Token / `authToken` query /
`meteor_login_token` cookie), but Sandstorm has none of these: authentication is
via `connection.setUserId()` and the `sandstorm-http-bridge` `X-Sandstorm-*`
request headers, so `extractLoginToken()` returned null and
`isAuthorizedForBoard()` denied every request. Sandstorm already gates grain
access at the platform level, so any request that reaches WeKan is an
authenticated grain user — both `isAuthorizedForBoard()` and
`isAuthorizedForAvatar()` now allow when `Meteor.settings.public.sandstorm` is
set and the request carries the bridge-injected `X-Sandstorm-User-Id` header.
Gating on the setting means a spoofed header cannot bypass auth on non-Sandstorm
deployments

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ab2b9dccbf3b32dd510d4634af88a1b9eb8513c">Sandstorm .spk: open All Boards (not sign-in) and keep the grain URL in sync</a>. Thanks to xet7.</summary>

Sandstorm .spk: open All Boards (not sign-in) and keep the grain URL in sync :
two grain-navigation regressions against the last working Sandstorm build
(v6.15). (1) Opening a grain showed *"Must be logged in"* instead of the All
Boards page: on Sandstorm the platform authenticates the user asynchronously
over DDP via `connection.setUserId()`, which (unlike a password login) does not
set `Meteor.loggingIn()`, so `Meteor.userId()` is null for the first moments
after the grain opens — and useraccounts' `ensureSignedIn` trigger plus
`renderBoardList()` both bounced that brief null window to the `atSignIn` route,
a sign-in page that does not exist inside a grain. `config/router.js` now uses a
Sandstorm-aware `ensureSignedInUnlessSandstorm` wrapper (a no-op on Sandstorm)
and `renderBoardList()` no longer redirects on Sandstorm; the list renders and
fills in reactively once the login lands. (2) The Sandstorm shell's outer grain
URL did not update when switching boards — the shell rewrites
`/grain/<id><path>` when the app posts a `{ setPath }` message, but the sync was
a bare top-level `Tracker.autorun` that could run before flow-router-extra's
reactive path tracking was ready and then never re-run. Restored v6.15's
event-driven `FlowRouter.triggers.enter` (fresh entering path,
order-independent) and kept a `watchPathChange()` autorun wrapped in
`Meteor.startup` as a backup

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0804cd19e">Sandstorm .spk: fix the MongoDB 3 → FerretDB migration of an existing grain: importing an old WeKan…</a> Thanks to xet7.</summary>

[Sandstorm .spk: fix the MongoDB 3 → FerretDB migration of an existing
grain](https://github.com/wekan/wekan/commit/3f5c70e6435c5305cb165eeb866fc1ac88f58dd0):
importing an old WeKan grain crash-looped in the one-time migration — mongod 3.0
forked and its child aborted with exit code 14. Two bugs. (1) *WiredTiger
cache_size=0G*: mongod 3.0 sizes its WiredTiger cache from detected RAM (`RAM/2
− 1GB`), but inside a Sandstorm grain sandbox RAM detection returns 0, so it
computed `cache_size=0G` and WiredTiger refused to open (minimum is 1MB),
logging *"Value too small for key 'cache_size'"* / *"Fatal Assertion 28561"* to
`/var/migration-mongod.log` before aborting. Both mongod invocations (the niscu
→ 3.0 stage and the 3.0 → FerretDB stage) now pass an explicit
`--wiredTigerCacheSizeGB 1` so the cache size never depends on RAM detection
(mongod 3.0.7 parses this option as an integer number of GB — a decimal like
`0.25` fails with `Bad digit "."`, fixed to `1` — and it is a cache cap, not a
preallocation). The data itself is intact (the *"unclean shutdown"* notice is
harmless — WiredTiger recovers from the last checkpoint). (2) *Wrong source
database*: Sandstorm WeKan grains store their data in the Meteor-default
database `meteor`, but the importer was told `SRC_DB=wekan`, so even once mongod
started it would have exported zero collections; only the FerretDB *target*
database is `wekan`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50abd8f95">Sandstorm/Snap migration: import mongodb and bson as default (CommonJS) exports under Node 24: with…</a> Thanks to xet7.</summary>

[Sandstorm/Snap migration: import mongodb and bson as default (CommonJS) exports
under Node
24](https://github.com/wekan/wekan/commit/a5bcb2e27c070643f17c9ed62ca6284564da1c51):
with the WiredTiger cache fixed mongod 3.0 started and the migration importer
ran, but crashed immediately on its named imports — `import { EJSON } from
'bson'` and `import { MongoClient } from 'mongodb'` each threw *"Named export
'…' not found. The requested module is a CommonJS module"*. Both packages, as
bundled in WeKan's server `node_modules`, are CommonJS, so Node 24's ESM loader
exposes no named exports on them. Import the default and destructure, as Node's
own error message advises (bson in the commit linked above; mongodb in the same
way ). Shared by the Snap MongoDB 3 → FerretDB migration too (same Node 24)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62df99153">Sandstorm/Snap migration: connect mongoexport over IPv4 so it can read the old data: with the…</a> Thanks to xet7.</summary>

[Sandstorm/Snap migration: connect mongoexport over IPv4 so it can read the old
data](https://github.com/wekan/wekan/commit/6142396ae9f95872f5b2ff0e3ee889e519fd56e8):
with the importer finally running, every `mongoexport` of a source collection
failed — at first silently (its own [`--quiet` flag suppressed the
reason](https://github.com/wekan/wekan/commit/3076f2317)), and once that was
dropped the real error showed: *"error connecting to db server: no reachable
servers"*. `mongoexport` is a Go tool whose `--host` defaults to `localhost`,
which resolves to `::1` (IPv6) first, but the migration `mongod` listens only on
`--bind_ip 127.0.0.1` (IPv4); the mongo shell defaults its host to `127.0.0.1`
and so connected fine (it listed all 42 collections), which is why only the
shell worked. Pass `--host 127.0.0.1` explicitly. The one-time progress
dashboard also now shows a live Activity panel (mongoexport-ready line,
per-collection export/insert counts, GridFS extraction counts) with a spinner
and an auto-updating timestamp , so it is clear what the migration is doing
rather than sitting on *"(waiting…)"*

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e0a8bbb3">Sandstorm/Snap migration: resolve bson/mongodb from the modern server bundle so EJSON exists: once…</a> Thanks to xet7.</summary>

[Sandstorm/Snap migration: resolve bson/mongodb from the modern server bundle so
EJSON exists](https://github.com/wekan/wekan/commit/beefe441d): once mongoexport
connected, every collection failed with *"Cannot read properties of undefined
(reading 'parse')"* — `EJSON` was undefined. The importer script sits at the
deps root right next to the OLD meteor-spk 0.6.0 base `node_modules` (kept only
for the niscu → 3.0 stage): its `bson` is 1.x with no `EJSON` at all, and its
`mongodb` is ancient — it has `MongoClient` (so the connection worked) but no
`EJSON` re-export. A bare `import`/`require` from the script resolved those
adjacent old copies, so every way of reaching `EJSON` (bare `bson`,
`mongodb.EJSON`) came back undefined. WeKan's current `bson` 7.3 and mongodb
driver (with `EJSON`) live under `programs/server/npm/node_modules`; anchor
`createRequire` inside that modern bundle first (falling back to the deps root)
and load both `mongodb` and `bson` through it — which also moves the importer to
the same modern mongodb driver the WeKan app uses against FerretDB. An upfront
guard fails loudly with a diagnostic list if `EJSON.parse` is still unreachable

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cab231ee3">Sandstorm/Snap migration: insert into FerretDB with the modern mongodb driver (OP_MSG)</a>. Thanks to xet7.</summary>

Sandstorm/Snap migration: insert into FerretDB with the modern mongodb driver
(OP_MSG) : text collections exported and *"inserted N/N"* was logged, but every
document actually failed with *"Unsupported OP_QUERY command: update"* — nothing
reached FerretDB. `requireAny('mongodb')` had resolved the ancient meteor-spk
base driver (v2.x, at the deps root) because the modern driver is not directly
under `programs/server/npm/node_modules` — Meteor nests it at
`…/meteor/npm-mongo/node_modules/mongodb` (v6.16). The 2.x driver speaks legacy
OP_QUERY, which FerretDB rejects; the 6.x driver speaks OP_MSG (the same driver
the WeKan app uses against FerretDB). Add the npm-mongo path as the first
resolver anchor, and log the resolved driver version

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3476cd17c">Sandstorm/Snap migration: extract Meteor-Files GridFS attachments + parse legacy v1 binary</a>. Thanks to xet7.</summary>

Sandstorm/Snap migration: extract Meteor-Files GridFS attachments + parse legacy
v1 binary : with text migrating, attachments still produced 0 files and *"parse
attachments.chunks: Unexpected Binary Extended JSON format"*. Two causes. (1)
mongo 3.x `mongoexport` writes binary as legacy Extended JSON v1
`{"$binary":"<b64>","$type":"00"}`, but modern bson `EJSON.parse` only accepts
v2 `{"$binary":{"base64":…,"subType":…}}` — rewrite v1→v2 per line before
parsing. (2) The grain stores attachments in Meteor-Files' own GridFS buckets
(`attachments.files` + `attachments.chunks`, with the FilesCollection record in
the `attachments` collection), not CollectionFS's `cfs_gridfs.*`. Reassemble
those buckets to disk, link each GridFS file to its record via
`metadata.fileId`/`versionName`, then repoint the record's `versions.<v>` at the
file and drop `versions.<v>.meta.gridFsFileId` — otherwise WeKan's
`getFileStrategy` keeps choosing the now-empty GridFS backend and the image
404s. Verified end to end on a real grain: boards/cards/lists/swimlanes migrate
and all 3 attachments extract and display

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8bdbcd2d">Sandstorm/Snap migration: auto-open All Boards after migrating, WeKan-themed dashboard</a>. Thanks to xet7.</summary>

Sandstorm/Snap migration: auto-open All Boards after migrating, WeKan-themed
dashboard : the one-time progress dashboard used to sit on the grain URL for 60s
after completion, forcing a manual reload to reach WeKan. On success the
importer now hands off quickly and the done page polls `/` until WeKan's app
shell answers (riding out the brief importer→WeKan port hand-off) and then opens
All Boards, with the spinner still spinning so it is clear the grain is still
working. The dashboard is also recoloured to WeKan's blue/white/grey

</details>

<details>
<summary>Avatars and original members now travel with a board (export/import), from every identity source.</summary>

**Avatars and original members now travel with a board (export/import), from
every identity source.** A board could be moved between servers (or imported
into Sandstorm) but member avatars vanished — they lived in Sandstorm / LDAP /
OAuth2, not in WeKan — and original members were collapsed onto the importing
user by a mapping that could attach the wrong person and leak board permissions.
Now:

</details>

  - [External avatars are localized into WeKan's own
    files/avatars](https://github.com/wekan/wekan/commit/dcd5f8fdd), triggered
    when a board is opened and at login, from any source — Sandstorm profile
    picture, LDAP
    [`jpegPhoto`/`thumbnailPhoto`](https://github.com/wekan/wekan/commit/e0c76099f),
    OAuth2/OIDC `picture` claim, gravatar or a pasted URL — every network fetch
    guarded against SSRF (http/https only; no private, loopback, link-local or
    cloud-metadata address; timeout + size + image-type caps). ([board-open
    trigger](https://github.com/wekan/wekan/commit/b4bfc7594). Inside a
    Sandstorm grain outbound fetch is sandboxed, so a still-external Sandstorm
    picture is a best-effort no-op there — but any avatar that is already a
    local file exports/imports fully, grain included.)
  - [Board export embeds each member's local avatar file as
    base64](https://github.com/wekan/wekan/commit/b98abe7b0) alongside their
    username, fullname and initials — never passwords, emails or services.
  - [Board import preserves the original members as inert placeholder
    users](https://github.com/wekan/wekan/commit/0c4b8f4d9)
    (`authenticationMethod:'imported'`, `loginDisabled`, `isActive:false`, no
    secrets), reusing each original `_id` so card/comment/activity references
    resolve to the right person with NO mapping at import time, and restores
    their avatar. The importer stays the sole admin; imported members hold no
    permissions until reconciled.
  - [Reconciliation maps placeholders to the valid accounts deliberately,
    later](https://github.com/wekan/wekan/commit/6784726ba): an admin sweep
    merges each placeholder into a matching real account (provisioned by
    LDAP/OIDC at login) by reassigning every reference, and leaves the rest
    inactive (e.g. a person not in LDAP); a one-off admin merge is available
    too.
  - [Avatars visibly distinguish account
    state](https://github.com/wekan/wekan/commit/db90fb9e6), on card avatars and
    in the right-sidebar member list: a dashed ring + amber "?" badge for
    un-reconciled imported placeholders, greyscale + dim for inactive members,
    and the sidebar now lists everyone (active first, then inactive) instead of
    hiding inactive members. Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.87 2026-07-11 WeKan ® release

This release fixes the following bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b227a931933a3a8abff67c1084f9561b8847f444">Normal users cannot move cards between swimlanes</a>. Thanks to xet7.</summary>

Normal users cannot move cards between swimlanes : in the swimlanes view the
`.js-swimlanes` sortable — which also carries moving a card from one swimlane to
another — was disabled for every non-admin (`!isBoardAdmin()`), even though its
own comment said it should be disabled only for non-members. So ordinary board
members could move a card within a swimlane but not between swimlanes, and could
not reorder swimlanes. Now it is disabled only for users without write access
(`!canModifyCard()`: comment-only, worker, read-only), so board members can move
cards between swimlanes again

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.86 2026-07-11 WeKan ® release

This release fixes the following bugs:

- [At default docker-compose.yml, changed DDP_TRANSPORT from uws to sockjs,
  because uws does not work at
  s390x](https://github.com/wekan/wekan/commit/4a94793f687a770346c2db5280cffcf2936c7ab3).
  Thanks to xet7.
<details>
<summary>FerretDB v1 is now downloaded as an individual per-arch binary, not ferretdb.zip. Thanks to xet7.</summary>

**FerretDB v1 is now downloaded as an individual per-arch binary, not
`ferretdb.zip`**: the wekan/FerretDB release now attaches one `ferretdb-<arch>`
(`.exe` on Windows) asset per platform instead of a single multi-platform
`ferretdb.zip`. Every WeKan build path now downloads only the one binary for the
platform it targets from
`https://github.com/wekan/FerretDB/releases/latest/download/ferretdb-<arch>`:
`release-all.yml` (the amd64/arm64/win64/mac/ppc64le/s390x/riscv64 bundle jobs —
the separate `build-ferretdb` job and its `ferretdb-zip` artifact are removed),
the default `docker-compose.yml`, and the Sandstorm
`sandstorm-src/build-deps.sh`. FerretDB itself also moved its Go toolchain to
1.25.11 to clear the Quay.io `stdlib` security advisories.

</details>

<details>
<summary>Drop the mongosh binary; use bundled Node.js 24 + the mongodb driver instead. Thanks to xet7.</summary>

**Drop the `mongosh` binary; use bundled Node.js 24 + the `mongodb` driver
instead**: WeKan no longer bundles or downloads the MongoDB Shell anywhere
(snap, Windows bundle). Every scripted database operation it was used for —
readiness `ping`, replica-set `initiate`/`status`, and the v8.43 schema
migration — now runs through the new `snap-src/bin/db-eval` (a tiny wrapper
around the bundled Node.js 24 + the `mongodb` driver), so the snap control
scripts (`wekan-control`, `mongodb-control`, `migration-control`), the
`start-wekan.sh`/`start-wekan.bat` launchers, and the ported
`migrate-schema-v843.mjs` are all mongosh-free. This removes a large, CVE-prone
binary and works identically on every architecture (including
s390x/ppc64le/riscv64, which have no prebuilt mongosh). The legacy MongoDB 3.2
`mongo` shell (migratemongo, amd64) stays for migration-time reads only.

</details>

<details>
<summary><a href="https://github.com/wekan/mongo-tools">MongoDB Database Tools now come from wekan/mongo-tools, not the MongoDB website</a>. Thanks to xet7.</summary>

**MongoDB Database Tools now come from `wekan/mongo-tools`, not the MongoDB
website**: every WeKan build downloads the per-arch `<tool>-<arch>` binaries
(bsondump, mongodump, mongoexport, mongofiles, mongoimport, mongorestore,
mongostat, mongotop) built by the wekan/mongo-tools fork (pure Go,
cross-compiled for every architecture) from its newest release, replacing the
`fastdl.mongodb.org` / `downloads.mongodb.com` downloads. They are embedded in
the Linux `.zip` bundles (amd64/arm64/s390x/ppc64le/riscv64) — and therefore in
the Docker image, which is built from those bundles — the Windows and macOS
bundles, the Snap (`mongotools` part), and the Sandstorm `.spk`. The MongoDB 7
server (mongod) is still fetched from MongoDB (amd64/arm64 only), since MongoDB
ships no server for the other architectures; the legacy MongoDB 3.2 CLIs
(migratemongo, amd64) remain only for the one-time MongoDB 3 migration

</details>

<details>
<summary>Snap: the default snapcraft.yaml is now the base: core24, grade: stable build. Thanks to xet7.</summary>

**Snap: the default `snapcraft.yaml` is now the `base: core24`, `grade: stable`
build**: the previous `snapcraft.yaml` (core26, `grade: devel`) is renamed to
`snapcraft-core26.yaml`, and the former `snapcraft-core24.yaml` becomes
`snapcraft.yaml`. Because the default is `base: core24` (a released base), it
can be published to the Snap **candidate** channel, which core26 cannot. The
automated `release-all.yml` workflow publishes the snap to the **candidate +
beta + edge** channels; the **stable** channel is published manually later, once
it is proven stable enough.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.85 2026-07-11 WeKan ® release

This release adds the following features and fixes:

- **Docker: FerretDB v1 + SQLite is now the default `docker-compose.yml`**:

  The default database for `docker compose up -d` is now **FerretDB v1 with embedded
  SQLite** (from https://github.com/wekan/FerretDB) — light and self-contained, no
  separate database server. The compose files were renamed accordingly:
  `docker-compose-ferretdb-v1-sqlite.yml` -> **`docker-compose.yml`** (the new default),
  and the previous MongoDB default `docker-compose.yml` -> **`docker-compose-mongodb-v7.yml`**.
  The other files are unchanged: `docker-compose-ferretdb-v2-postgresql.yml` (FerretDB 2
  + PostgreSQL) and `docker-compose-multitenancy.yml` (MongoDB multitenancy). To use
  MongoDB 7, run `docker compose -f docker-compose-mongodb-v7.yml up -d` or rename that
  file to `docker-compose.yml`. `build.sh` / `build.bat` Docker menus now
  list FerretDB v1 SQLite first (default) and point at the new filenames, the compose
  files' own header comments were updated, and the Docker docs now describe which
  compose file maps to which database. The Docker menus also gained a **Build from
  source & start (up -d --build)** action per compose file, which builds the wekan-app
  image from the local `Dockerfile` (tagged as the image the compose file references)
  and starts that freshly built container instead of a possibly-stale prebuilt image —
  useful when a change (e.g. the FerretDB Version-page detection) isn't in the pulled
  image yet. Finally, the obsolete `version:` attribute (which Docker Compose v2 warns
  about and ignores) was removed from all compose files (`docker-compose.yml`,
  `docker-compose-mongodb-v7.yml`, `docker-compose-ferretdb-v2-postgresql.yml`,
  `docker-compose-multitenancy.yml`, `.devcontainer/docker-compose.yml`, and the
  ToroDB docs example).

- **build.sh / build.bat: reorganized into category submenus + Docker
  start/logs/stop**:

  The long flat menu is now grouped into a short top-level menu — **Setup**,
  **Dev server**, **Tests**, **Docker**, **Tools**, **Quit** — each opening a small
  submenu with `0) Back`, so you read only a handful of items at a time and labels
  are shorter (the category provides the context). **Docker** is a two-stage submenu:
  pick a backend (MongoDB `docker-compose.yml`, FerretDB v1 SQLite, FerretDB v2
  PostgreSQL, MongoDB Multitenancy), then an action — **Start** (`up -d`),
  **Follow logs** (`logs -f`) or **Stop** (`down`) — which removes the previous
  repetition of 12 near-identical entries. The `.sh` auto-detects `docker compose`
  vs legacy `docker-compose`. All existing actions are unchanged, just regrouped.

<details>
<summary>build.sh / build.bat: Dev server options now stop the previous server (including the rspack :8080…</summary>

**build.sh / build.bat: Dev server options now stop the previous server
(including the rspack :8080 dev server) before starting, plus a new "Kill all
dev servers" option, and docs updated for the new menu**:

</details>

  Every **Dev server** option (`localhost:3000`, `+ trace warnings`, `+ bundle
  visualizer`, `CURRENT-IP:3000`, `CURRENT-IP:3000 + MONGO_URL 27019`, and
  `CUSTOM-IP:PORT`) now stops any Meteor dev server already running before starting a
  fresh one, so re-running a dev option no longer fails because a port is taken — no
  need to hunt down and kill the old processes yourself. Crucially it frees **both**
  the app port **and the rspack dev-server port `8080`**: `meteor run` starts an rspack
  dev server on 8080 that can outlive the `meteor` parent, and a leftover one made the
  restart crash with `Error: listen EADDRINUSE ... :8080`. Port detection now checks the
  listening socket directly (`ss`/`lsof`, with a bash `/dev/tcp` fallback that needs no
  external tools, and `netstat` on `.bat`) instead of an HTTP probe, so it also catches
  a server that is still building. A new **Dev server -> Kill all dev servers** option
  frees every dev/test port the scripts use at once — the dev app (3000) and its Mongo
  (3001), the Mocha test server (3100) and its Mongo (3101), a Sandstorm standalone dev
  server (4000) and its Mongo (4001), and the rspack dev server (8080) — killing meteor,
  the rspack watcher and Meteor's bundled `--replSet meteor` Mongos (never a
  production/system Mongo). Both scripts escalate to SIGKILL if a port does not free up.
  Also updated the build-from-source docs (README.md, Build-from-source.md,
  Build-and-Create-Pull-Request.md, Emoji.md, and the two Sandstorm developer docs) to
  the new two-level menu (**Setup -> Install dependencies**, **Setup -> Build WeKan**,
  **Dev server -> localhost:3000**) and fixed a stale dev-server port
  (`localhost:4000` -> `3000`).

- **FerretDB: quieter logs, and removed a dead MongoDB-driver-selection
  subsystem**:

  On FerretDB (SQLite), the driver debug logs revealed a second, TLS-enabled Mongo
  monitor connection retrying every ~0.5s and being rejected by the plaintext FerretDB
  port, which FerretDB logged at WARN (`Connection stopped … invalid message length` /
  `before secure TLS connection was established`) — harmless (WeKan runs fine on the real
  plaintext connection) but very noisy. FerretDB is now started with `--log-level=error`
  in all bundled launch points (Docker entrypoint, snap `ferretdb-control`, the release
  `start-wekan.sh`, and the `docker-compose-ferretdb-v1-sqlite.yml` example), which drops
  the per-connection WARN spam. Separately removed a **dead, unused "MongoDB Driver System"**
  (`server/mongodb-driver-startup.js` + `models/lib/{meteorMongoIntegration,mongodbConnectionManager,mongodbDriverManager}.js`)
  — an abandoned attempt to auto-detect MongoDB 3.0–8.0 and pick versioned driver packages
  that were never even installed; WeKan uses the mongodb-7 driver via Meteor.

- **Fix snap build failing on the `caddy` part (Cloudsmith unreachable on
  Launchpad)**:

  The snap installed Caddy from the Cloudsmith apt repo
  (`curl … dl.cloudsmith.io … | gpg --dearmor`), which fails on the Launchpad remote
  builders — their network is restricted to a fetch proxy that can't reach Cloudsmith, so
  `gpg` got no key (`no valid OpenPGP data found`) and the `caddy` `override-build` failed
  with code 2 on both arches, all attempts. Both `snapcraft.yaml` and `snapcraft-core24.yaml`
  now download the **official prebuilt Caddy static binary from GitHub releases** (per-arch,
  latest stable with a pinned fallback) instead. WeKan uses only built-in Caddy directives,
  so vanilla Caddy is sufficient — no apt repo, no `gpg`, no `xcaddy`/custom-module build.

- **Fix Admin Panel / Version showing "MongoDB" when running on FerretDB**:

  The database detection only recognised a `buildInfo.ferretdb` sub-document, but the
  wekan/FerretDB v1 fork reports its identity as a **top-level `ferretdbVersion`** string
  (e.g. `v1.24.2-60-gb5523566`) plus `ferretdbFeatures`, with its git commit in `gitVersion`.
  So the Version page showed `Database type: MongoDB` and hid the FerretDB rows. Detection now
  handles both shapes ([server/statistics.js](https://github.com/wekan/wekan/blob/main/server/statistics.js)),
  so it shows `Database type: FerretDB`, the `FerretDB version` and `FerretDB commit` rows, and
  the `SQLite` storage engine. (FerretDB v1's `version: 7.0.42` is the MongoDB version it emulates.)

- **Design doc: WeKan on Sandstorm (Meteor 3.5 / Node 24) with MongoDB 3 →
  FerretDB migration**:

  Added [docs/Platforms/FOSS/Sandstorm/Meteor3/Migration.md](https://github.com/wekan/wekan/blob/main/docs/Platforms/FOSS/Sandstorm/Meteor3/Migration.md)
  describing how to build a modern Sandstorm `.spk` (Node 24, replacing meteor-spk
  0.6.0's Node 14) that runs on FerretDB v1 (embedded SQLite) instead of MongoDB 3.0,
  migrating an existing grain's MongoDB 3.0 data on first launch — reusing the snap's
  proven `migrate-mongo3-to-ferretdb` logic (mongoexport read → FerretDB insert;
  CollectionFS/Meteor-Files GridFS attachments+avatars → filesystem). Includes the
  grain sandbox (seccomp) compatibility analysis, the rewritten `start.js`, and a new
  `isSandstorm`-only Admin Panel / Attachments / Sandstorm section (migration status,
  raw-MongoDB disk usage, and a guarded delete-raw-MongoDB-files action). Implementation
  of the in-app pieces follows.

- **Sandstorm: Admin Panel / Attachments / Sandstorm (migration status + free
  raw-MongoDB disk space)**:

  Implemented the in-app pieces from the design above. When WeKan runs inside a
  Sandstorm grain (`isSandstorm`), a new **Sandstorm** section appears in Admin
  Panel / Attachments showing whether the one-time MongoDB 3 → FerretDB v1
  migration succeeded, and the disk space the raw MongoDB 3 database files, the
  FerretDB SQLite, and the attachments/avatars currently use inside the grain.
  An admin can delete the now-redundant raw MongoDB files to free disk space —
  guarded so it only runs after a confirmed-successful migration, behind a
  confirmation. New admin-gated server methods `sandstormMigrationStatus` /
  `sandstormDeleteRawMongo` ([server/methods/sandstormMigration.js](https://github.com/wekan/wekan/blob/main/server/methods/sandstormMigration.js));
  the migration importer now writes a `migration-status.json` the panel reads.

- **Sandstorm: grain launcher + spk build tooling (Node 24 / FerretDB, no
  releases.wekan.team)**:

  Added the grain launcher [sandstorm-src/start.js](https://github.com/wekan/wekan/blob/main/sandstorm-src/start.js):
  on first launch it runs the migration chain for whatever an existing grain holds —
  **niscu (MongoDB 2.x) → MongoDB 3.0** (the preserved legacy path for very old grains) then
  **MongoDB 3.0 → FerretDB v1** — then runs WeKan (Node 24) on FerretDB. Migration support from
  old versions is permanent (niscud + mongod 3.0 are kept). Added the deps-assembly script
  [sandstorm-src/build-deps.sh](https://github.com/wekan/wekan/blob/main/sandstorm-src/build-deps.sh)
  which builds a modern `meteor-spk.deps` on top of **upstream meteor-spk 0.6.0**
  (`dl.sandstorm.io`) — swapping in Node 24, adding FerretDB + the Mongo 3.x CLIs + the
  launcher/importer, keeping niscud — with extra binaries fetched from **GitHub releases**
  (the retired `releases.wekan.team` / old `projects.7z` are no longer used). `sandstorm.yml`
  now calls it, and `WRITABLE_PATH` in `sandstorm-pkgdef.capnp` is `/var/files`. Build/CI only —
  not yet packed/tested end-to-end in a grain.

Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.84 2026-07-11 WeKan ® release

This release adds the following features and fixes:

- **Fix scheduled backup cron init crashing at server startup on Meteor 3**:

  The scheduled-backup cron used Meteor's synchronous Mongo API
  (`BackupSettings.findOne`/`upsert`), which Meteor 3 no longer allows on the
  server — startup logged `findOne is not available on the server. Please use
  findOneAsync() instead.` and the cron silently never registered, so scheduled
  backups did not run. `registerCron()` is now `async` and uses `findOneAsync`,
  the `getBackupSchedule`/`saveBackupSchedule` methods use `findOneAsync`/
  `upsertAsync`, and every `registerCron()` caller awaits it. Added
  `tests/backupCron.test.cjs` (positive + negative cron-registration tests and a
  source guard that fails if the synchronous server-forbidden API is
  reintroduced), wired into the `test:unit:node` suite.

- **Snap: show the correct writable path for parallel installs in backup
  instructions**:

  The backup/migration help text printed by `wekan.help` hardcoded
  `/var/snap/wekan/common/files`, which is wrong for a parallel snap install
  (e.g. `wekan_customer`, whose data lives under `/var/snap/wekan_customer/common`).
  It now prints `$SNAP_COMMON/files`, which snapd sets per instance. Display-only;
  all functional snap paths already derive from `$SNAP_COMMON`/`$SNAP_DATA`, so
  parallel installs were already fully supported.

- **Fix flaky server-side Mocha i18n test (TAPi18n `.loadLanguage`)**:

  The `.loadLanguage` suite stubbed `addResourceBundle` on the shared
  `TAPi18n.i18n` singleton and asserted the call count. Because `loadLanguage()`
  reads `this.i18n` late and each test re-`init()`s the singleton, cross-test
  state could leave the stub watching a different i18next instance than the one
  the bundle was registered on, so the count read 0 and the run intermittently
  reported `expected addResourceBundle to be called once`. The tests now assert
  on observable i18next state (`hasResourceBundle`/`getResourceBundle` under the
  normalised `toI18nCode`), which is instance-agnostic and deterministic and
  mirrors the reliable `.setLanguage` suite. Also stopped a leaked
  `Tracker.autorun` in the `.getLanguage` reactive test (the cross-test hazard).

- **[Fix rebuild-all.yml s390x build; add bundled FerretDB v1 for ppc64le,
  s390x, riscv64 and to the Docker
  image](https://github.com/wekan/wekan/commit/0360ca1583b4b17b465ded20c4fd7560004aee47)**:

  The extra-arch bundle build ran `node:24-slim` under QEMU, but the official
  `node:24` image publishes no `linux/s390x` manifest (only amd64/arm64/ppc64le),
  so the s390x leg failed with "no matching manifest for linux/s390x". The
  emulated native-module rebuild now runs on an `ubuntu:26.04` base (which
  publishes every arch) and installs Node.js from nodejs.org; riscv64 uses
  unofficial-builds.nodejs.org (nodejs.org ships no riscv64).

  MongoDB Community only ships amd64/arm64 server binaries, so on ppc64le, s390x
  and riscv64 — the other architectures with a Node.js 24 build — WeKan now
  bundles FerretDB v1 (the [wekan/FerretDB](https://github.com/wekan/FerretDB)
  fork with its embedded pure-Go SQLite backend, which speaks the MongoDB wire
  protocol) instead of requiring MongoDB. The FerretDB binary is cross-compiled
  once for all five architectures (CGO off, static, no QEMU) and embedded in
  every `.zip` next to `main.js`, so amd64/arm64 users can opt in too with
  `WEKAN_DB=ferretdb`. The Docker image now covers all five architectures and
  auto-starts FerretDB on the MongoDB-less ones. FerretDB telemetry is disabled
  and locked (`--telemetry=disable`, plus `DO_NOT_TRACK`). armv7l/32-bit ARM is
  still not built: there is no Node.js 24 build for it anywhere, so nothing could
  run WeKan there regardless of RAM.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/598aa8dfa1cc406243e0db681573093d9db7783f">Snap: choose MongoDB or FerretDB v1 with "snap set wekan database=ferretdb"; FerretDB default for…</a></summary>

** Snap: choose MongoDB or FerretDB v1 with "snap set wekan database=ferretdb";
FerretDB default for new installs; disable mongosh telemetry **:

</details>

  The WeKan snap gains a `database` setting (`mongodb` or `ferretdb`). A new
  `ferretdb` service runs FerretDB v1 (SQLite) on the same port MongoDB would
  use, so `MONGO_URL` is unchanged; only one database runs at a time, and the
  configure hook stops one and starts the other when the setting changes. Switch
  with `snap set wekan database=ferretdb` (or back with `database=mongodb`).

  New snap installs default to FerretDB on all platforms (via the install hook,
  which runs only on fresh installs — upgrades keep MongoDB, and a pre-existing
  MongoDB data directory is detected and kept so no data is lost). There is no
  `snap install --db=ferretdb` flag (snapd has no custom install options); use
  the two-step `snap install wekan --channel=latest/beta` then
  `snap set wekan database=ferretdb`.

  mongosh collects anonymized usage analytics by default and the snap invokes it
  several times; it is now disabled so nothing phones home. mongod itself has no
  phone-home telemetry (Cloud Free Monitoring is opt-in and stays off).

- **[Admin Panel / Version: show database type, version, commit, storage engine
  and reactivity
  mode](https://github.com/wekan/wekan/commit/d5c69e02595c9a4caf597496a4f1572064142b9f)**:

  Admin Panel / Version now shows whether WeKan is using MongoDB or FerretDB v1
  (SQLite), the MongoDB-compatible version and the server git commit, FerretDB's
  own version and commit when FerretDB is in use, the storage engine, and which
  reactivity mechanism is currently in use — changeStreams / oplog / polling
  (FerretDB has no oplog, so it uses polling).

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3824066f7fb88acd66bc1f4c70350e8516f5f00b">Standalone ferretdb.zip for all platforms, and rebuild-all.yml uses the prebuilt one from…</a></summary>

** Standalone ferretdb.zip for all platforms, and rebuild-all.yml uses the
prebuilt one from wekan/FerretDB releases **:

</details>

  FerretDB v1 (the wekan/FerretDB fork, pure-Go SQLite backend, CGO off, no QEMU)
  is now cross-compiled for every platform Go and modernc.org/sqlite support — far
  beyond the arches Node.js ships — and packed into a single `ferretdb.zip`:

      ferretdb/<arch>/ferretdb-<arch>        (Linux/macOS/BSD, executable)
      ferretdb/<arch>/ferretdb-<arch>.exe    (Windows only)
      ferretdb/README.md                     (links to https://github.com/wekan/FerretDB)

  That zip is produced and released in the wekan/FerretDB repo (by its `build.sh`,
  which gained sequential and parallel "Build ferretdb.zip" menu options). The
  WeKan release workflow no longer builds FerretDB with Go: it downloads the newest
  `ferretdb.zip` from https://github.com/wekan/FerretDB/releases and every WeKan
  build (the bundle .zip for each arch, and via the bundle the Docker image and
  snap, including the Windows and macOS bundles) embeds its per-arch binary from
  that one source. ferretdb.zip is not re-attached to the WeKan releases.

- **[Fix #6445: dynamic-import chunks 404 under a sub-path (duplicated
  build-chunks/build-chunks/)](https://github.com/wekan/wekan/commit/dbca7cd72d4f9791ba109dc25d359cce1e849e3a)**:

  Under a sub-path deployment (ROOT_URL like `https://host/wekan`, usually behind
  a reverse proxy that strips the prefix), language selection and other
  lazy-loaded features failed with `ENOENT ... build-chunks/build-chunks/<id>.js`.
  rspack's client runtime builds each chunk URL as public-path + chunk-name, and
  the chunk name already carries the `build-chunks/` prefix, but
  client/00-startup.js set the sub-path public path to `<sub-path>/build-chunks/`,
  so rspack appended a second `build-chunks/`. It now sets the public path to just
  `<sub-path>/` and lets rspack add `build-chunks/` itself.

- **[Add snapcraft-core24.yaml so the newest WeKan can be published to the Snap
  Stable
  channel](https://github.com/wekan/wekan/commit/3a968052b96d4778797e175ad17205260535cbbe)**:

  The main `snapcraft.yaml` uses `base: core26`, which (until core26 is released)
  needs `build-base: devel` + `grade: devel`, so it can only go to Snap Beta/Edge.
  `snapcraft-core24.yaml` builds the SAME newest WeKan (Meteor 3.5, Node.js 24,
  FerretDB v1, MongoDB 7, Caddy 2) on `base: core24` (a released base, `grade:
  stable`), so the Snap Stable channel can finally be updated from the old 6.09
  snap. Only base/build-base/grade differ.

- **[Self-contained release bundles: bundle Node.js + FerretDB +
  start-wekan.{sh,bat}](https://github.com/wekan/wekan/commit/bfb3fd246bc348900fa1fbda732dcb80afb027d1)**:

  Each `wekan-<version>-<arch>.zip` is now fully offline. Its `bundle/` directory
  contains the WeKan server, a Node.js binary for that platform, a FerretDB v1
  (SQLite) binary, and a `start-wekan.sh` (`start-wekan.bat` on Windows) that by
  default runs WeKan on the bundled Node against the bundled FerretDB SQLite,
  storing data and attachments/avatars on the filesystem under `WRITABLE_PATH`
  (as in the Windows Offline guide) — no separate Node or database install
  needed. The Docker image and snap, which have their own Node and entrypoint,
  strip the redundant bundled Node + launchers to stay small.

- **[Standalone sandstorm.yml workflow to build + attach the .spk (Sandstorm
  removed from
  release-all.yml)](https://github.com/wekan/wekan/commit/5757cfc8ca4f0757206e668f80f9b12d91bafb27)**:

  Sandstorm packaging (mirroring `releases/release-sandstorm.sh` +
  `install-sandstorm.sh`: installs Meteor, meteor-spk 0.6.0 and a dev Sandstorm,
  runs `meteor-spk pack`) is **not tested well enough yet**, so it no longer runs
  as part of a full release — the `build-sandstorm` job was removed from
  `release-all.yml`. Instead a separate, manually-triggered `sandstorm.yml` builds
  ONLY the `.spk` and uploads it as `wekan-sandstorm-YYYY_MM_DD-HH_MM_SS.spk` to the
  newest WeKan GitHub Release (plus a workflow artifact), so it can be downloaded
  and tested for errors without affecting releases. Experimental in CI — Sandstorm
  needs unprivileged user namespaces, and signing the `.spk` needs the app private
  key via the `SANDSTORM_KEYRING` secret; `spk publish` / scp upload stay manual.

- **[Migration: resumable progress in WRITABLE_PATH + compact the old MongoDB
  after
  success](https://github.com/wekan/wekan/commit/4c630d4ba87b3a6e582d0898179898416e6e9890)**:

  The MongoDB → FerretDB / GridFS → filesystem migrator (used by the Snap and
  Sandstorm migrations) now checkpoints progress to
  `$WRITABLE_PATH/migration-progress.json` after every collection and file phase,
  so an interrupted migration (snap refresh, Sandstorm grain restart, power loss)
  **resumes** on restart instead of starting over — skipping collections already
  copied. Once migration has completed, a later boot reclaims the now-duplicated
  disk space in the old MongoDB by running `compact` on each source collection
  (best-effort, once). The existing ROOT_URL progress dashboard and disk-space
  checks are kept, and the dashboard is restored from the checkpoint on resume.

- **[Snap: migrate the Caddyfile from Caddy v1 to Caddy v2 format on
  upgrade](https://github.com/wekan/wekan/commit/748fd2d391ca3ae187c14c1676c682dbebf49eb8)**:

  When upgrading from an old WeKan snap, `$SNAP_COMMON/Caddyfile` may still be in
  Caddy v1 syntax, which Caddy 2 cannot parse (caddy would fail to start).
  `caddy-control` now runs a converter before `caddy run` when caddy is enabled:
  a no-op if the file already parses as Caddy 2, otherwise it backs up the
  original, converts the common v1 directives (`proxy / TARGET` →
  `reverse_proxy TARGET`, drop the v1 `websocket`/`transparent` presets Caddy 2
  does by default, `gzip` → `encode gzip`, strip the `http://` scheme), validates
  with `caddy adapt`, and only keeps a valid result — falling back to the shipped
  Caddy 2 template otherwise, so caddy always starts with valid config.

- **[Rename docker-compose-ferretdb.yml to -v2-postgresql.yml and add
  -v1-sqlite.yml](https://github.com/wekan/wekan/commit/be5ddd77efdd03753acf73feb577ab615da7d3eb)**:

  `docker-compose-ferretdb.yml` (FerretDB 2 + PostgreSQL) is renamed to
  `docker-compose-ferretdb-v2-postgresql.yml`, and a new
  `docker-compose-ferretdb-v1-sqlite.yml` runs WeKan against FerretDB v1 with the
  embedded SQLite backend — no PostgreSQL or MongoDB — fetching the v1 binary for
  the container's architecture from the newest wekan/FerretDB release. Both
  compose files now carry the FULL `wekan` service from `docker-compose.yml`
  (every documented environment variable and feature); the only differences are
  database-related (the `ferretdb` service replaces `mongodb`, `MONGO_URL` points
  at FerretDB, `MONGO_OPLOG_URL` is dropped and reactivity is polling, since
  FerretDB has no MongoDB change streams / replica-set oplog).

- **[Snap: one-time MongoDB → FerretDB v1 migration on upgrade, with live
  progress at
  ROOT_URL](https://github.com/wekan/wekan/commit/6ab29dc81e44c11a3c813d717090e418652b2599)**:

  On first boot after upgrading an old MongoDB-based WeKan snap, `mongodb-control`
  hands off to a new `migration-control` before starting mongod. It opens the
  existing MongoDB data with the right bundled mongod — **mongod 7 for MongoDB 7
  data (all arches, including the arm64 snaps already on newest WeKan)**, or a
  bundled **old mongod 3.2 (amd64 only)** for WeKan 6.09 / MongoDB 3.2 data —
  starts a temporary FerretDB v1 (SQLite), and runs the migrator, which moves text
  data to FerretDB and **both CollectionFS GridFS and Meteor-Files GridFS
  attachments+avatars to the filesystem**, shows a **live progress counter at
  ROOT_URL**, checkpoints to `$SNAP_COMMON` (resumable), and compacts the old
  MongoDB when done. It then switches the snap to `database=ferretdb`. Idempotent,
  resumable, never deletes the source data, only switches on success. (The amd64
  6.09/MongoDB-3.2 path needs testing on real 6.09 data; the arm64/MongoDB-7 path
  uses the already-bundled mongod 7.)

- **[Snap: bundle migratemongo (MongoDB 3.2 binaries + old libraries + AVX
  wrappers) to read 6.09
  data](https://github.com/wekan/wekan/commit/dd4611e43f09aff2b793eb70b0dfd0138c39e87f)**:

  Per docs/Backup/Backup.md and https://github.com/wekan/migratemongo, running the
  old MongoDB tools/server in the snap needs `LC_ALL=C` and their libraries on
  `LD_LIBRARY_PATH` (`$SNAP/lib/<arch>-linux-gnu`), and the 2016 MongoDB 3.2
  binaries additionally need old libraries (`libssl`/`libcrypto.so.1.0.0`,
  `libpng12`, `libexpat`) that modern bases lack. A new `migratemongo` snapcraft
  part (amd64) stages https://github.com/wekan/migratemongo at `$SNAP/migratemongo`
  (its MongoDB 3.2 `bin/`, the old `lib/x86_64-linux-gnu/`, and the `avx/` QEMU
  wrappers) — also filling in the `$SNAP/migratemongo/avx` path that
  `mongodb-control`/`-backup`/`-restore` already referenced but was never bundled.
  `migration-control` now reads the amd64 6.09 MongoDB 3.2 data with that mongod
  (old `LD_LIBRARY_PATH`) and the legacy `mongo` shell (mongosh cannot talk to 3.2).

- **[Snap migration: read MongoDB 3.2 via migratemongo CLI (dump → restore into
  mongod 7), fix migrator
  NODE_PATH](https://github.com/wekan/wekan/commit/b99d21d9f19a867af74166732aaf18c59d52a1d0)**:

  The bundled Node MongoDB driver can't connect to a 3.2 server, and no single
  driver version spans 3.2 and MongoDB 7 / FerretDB — so rather than aliasing an
  EOL Node driver into `package.json`, the amd64 6.09/3.2 case uses the
  migratemongo CLI: `migration-control` dumps the `wekan` database with the old
  migratemongo `mongodump` (MongoDB 3.2, old libraries), then loads it into a fresh
  temporary mongod 7 with the snap's modern `mongorestore`. The existing
  driver-based migrator then reads that mongod 7 exactly like the arm64 MongoDB-7
  case (both GridFS types → filesystem, text → FerretDB v1 SQLite); the MongoDB-7
  path connects the driver directly, unchanged. Also fixes a real bug: the
  standalone migrator in `$SNAP/bin` could not resolve its `mongodb`/`bson`
  imports — `NODE_PATH` now points at the WeKan bundle's `node_modules`.

- **[Snap migration: only MongoDB 3 migrates (mongo CLI read + Node driver
  insert), FerretDB SQLite at
  files/db](https://github.com/wekan/wekan/commit/02cf16d8c6a8941bbab3e7d07fdc952beb2395d8)**:

  Refines the snap migration to the intended design: a **MongoDB 7** database works
  with newest WeKan as-is and is **not** migrated; only the old 6.09 / MongoDB 3.2
  data is. `migration-control` now checks whether mongod 7 can open the data — if
  so it keeps MongoDB; otherwise it migrates the 3.x data. It reads it with the
  legacy `mongoexport` CLI (the Node driver can't talk to 3.2) and inserts into
  FerretDB with the Node driver — text streamed directly, GridFS attachments+avatars
  reassembled per-file straight to `files/attachments`/`files/avatars` — with **no
  mongodump/mongorestore and no intermediate MongoDB 7** (which the earlier commit
  used). FerretDB's SQLite now lives at `<files>/db`, next to attachments/avatars
  (the `files/<name>` layout), across the snap, offline launchers, Docker entrypoint
  and the v1-sqlite compose.

- **[Admin Panel / Attachments: migrate text data between MongoDB and FerretDB
  v1 (SQLite), both
  directions](https://github.com/wekan/wekan/commit/84fee7b660e365d900e1ac355d97fcccf3debc25)**:

  A new "Database migration" section in Admin Panel / Attachments with two buttons:
  migrate text-based data (everything except attachments/avatars, which stay on the
  filesystem) **to FerretDB v1 (SQLite)** or **back to MongoDB**. WeKan is connected
  to one database at a time, so the server opens a second driver connection to the
  OTHER database (both speak the MongoDB wire protocol) and copies the text
  collections into it, upserting by `_id` (idempotent). The target is
  `WEKAN_FERRETDB_URL` (default `mongodb://127.0.0.1:27018/wekan`) or
  `WEKAN_MONGODB_URL` (default `:27019`); both must be running. Progress is shown
  live; afterwards point `MONGO_URL` at the other database and restart (Snap:
  `snap set wekan database=ferretdb` / `=mongodb`). Admin-only.

- **[Admin Panel / Attachments / Backup: scheduled backups streamed to storage,
  restore +
  list](https://github.com/wekan/wekan/commit/c7c8a200ff551f979fe6eeb30266d7c435cd7fa4)**:

  A new Backup section in Admin Panel / Attachments. Select any of **Attachments**,
  **Avatars**, **Data** (all text-based collections that are not attachments/avatars)
  and a **storage** (filesystem, S3/MinIO, Azure, GCS). "Backup now" streams the
  `.zip` **directly to the selected storage — no temp file, no extra disk** — as
  `backup/YYYY/MM/DD/HH_MM_SS/backup.zip` containing
  `YYYY_MM_DD-HH_MM_SS/{attachments,avatars,data/<collection>.json}` (filesystem pipes
  to the file; S3 uses `@aws-sdk/lib-storage` streaming, Azure `uploadStream`, GCS
  `createWriteStream`, with the cloud credentials from the storage tabs). A
  **scheduler** (off/daily/weekly/monthly + time/day) runs backups via synced-cron.
  **List backups** shows a table (storage, datetime, path); pick one and **Restore**
  with "Add missing data only" or "Replace all data". Admin-only. (Cloud upload and
  restore are not exercised end-to-end yet; jszip assembles the whole zip, so very
  large attachment sets use notable memory.)

- **[Backup: switch from jszip to archiver+unzipper for low-memory
  streaming](https://github.com/wekan/wekan/commit/e39dcd4ebf19c4280cc8f48352e91b547c5ff673)**:

  Follow-up to the Backup section above: it no longer holds whole files or the
  whole zip in memory. The backup `.zip` is written with **archiver**, streaming
  each attachment/avatar straight from disk and each text collection a document at
  a time from a Mongo cursor as **NDJSON**, piped directly to the destination
  (filesystem or S3/Azure/GCS streaming upload). Restore uses **unzipper**: each
  file entry is piped to disk and each NDJSON data entry is applied line-by-line
  in 200-doc batches. A board with thousands of cards or a 5 GB attachment now
  backs up and restores with flat memory.

- **[Stream board exports (JSON, CSV/TSV, Excel) with bounded
  memory](https://github.com/wekan/wekan/commit/41cd166358ea40a4517eddd02fe1913c22b7777b)**:

  The board export routes used to buffer the whole board in memory: the JSON
  export built one object with every card, comment, activity, checklist and
  base64 attachment; CSV called that same builder; Excel additionally loaded data
  it never renders and did O(n²) `find()` lookups. On large boards this peaked at
  gigabytes and could exceed V8's max string length. Now the JSON export writes
  the document straight to the response a card at a time from raw cursors
  (attachments base64-encoded in aligned chunks), CSV streams one row per card
  keeping only the small lookup tables in memory, and Excel uses the exceljs
  streaming `WorkbookWriter`, committing each row and resolving card titles via an
  id→title map. Peak memory stays flat regardless of board size, and the JSON
  output is unchanged so import round-trips.

- **[Export board to HTML .zip: stream to disk and include every
  card](https://github.com/wekan/wekan/commit/ae9be62ef31014f5f452d32808c55b96d4e97f54)**:

  The HTML export cloned the live DOM and built the whole `.zip` as an in-memory
  blob — but infinite scroll keeps only ~10 cards per list in the DOM, so most
  cards were missing, and the archive was buffered whole in browser RAM. Every
  list's card limit is now lifted so the entire board renders before the
  snapshot, and the zip is written with JSZip's `generateInternalStream` piped
  straight to the chosen file via the File System Access API, chunk by chunk with
  backpressure (browsers without the API fall back to the previous blob download).

- **[Lazy card loading for very large boards: CARDS_LOADING=all|lazy + Admin
  Panel /
  Features](https://github.com/wekan/wekan/commit/6f7ad270d124bf961b811743d1b78abf24f8f7e5)**:

  A board's `board` publication normally ships **every** non-archived card (with
  full fields, comments, attachments and checklists) into each viewer's minimongo.
  The list rendering is already infinite-scrolled (~10 cards per list in the DOM),
  but the whole dataset still crosses the wire and sits in browser memory, so a
  board with thousands of cards is heavy for every viewer.

  A new **`CARDS_LOADING`** mode (`all` default, or `lazy`) makes each list load
  only the cards it is about to render. In lazy mode the board publication ships
  no cards; instead each list/swimlane subscribes to a windowed publication
  (`boardCardsWindow`) for just its visible window — growing as you scroll — plus
  a reactive total count (`boardListCardCount`) so it knows when more remain. The
  window selector is ANDed with a server-forced board scope and refuses `$where`.
  This is set by the `CARDS_LOADING` env var (exposed in `docker-compose*.yml`,
  the bundle `start-wekan.sh`/`.bat`, and `snap set wekan cards-loading=lazy`) and
  also at runtime in a **new Admin Panel / Features** section — the intended home
  for optional / performance / future tier-gated capabilities. ([client + Features](https://github.com/wekan/wekan/commit/09805a8a9185c41c84b2596e2854f209aecf2ac0),
  [platform env](https://github.com/wekan/wekan/commit/f0d25a24314fe4f11bc01933fd6ebbac0d7fea25))

  Lazy mode is opt-in and **experimental**: card counters and WIP limits are
  accurate (they read a server count for the list's exact selector), but the
  Calendar/Table/Gantt views and multi-select currently reflect only the cards
  loaded so far, and open boards must be reloaded after switching modes. Default
  `all` is unchanged. ([accurate counters + WIP](https://github.com/wekan/wekan/commit/7d5f29e11479be6a3b8393c8817b30620e99a068))

- **[Fix Transifex push: remove duplicate database-migration i18n
  keys](https://github.com/wekan/wekan/commit/4cbefed339d61b9ec10c1d1227c0b201d060dc77)**:

  `en.i18n.json` had `database-migration` and `database-migration-description`
  defined twice, so the Transifex source push failed with "Duplicate string key".
  The later, unused copies ("Database Migration" / "Updating database structure…")
  were removed, keeping the values the Admin Panel / Attachments migration UI
  actually renders. JSON now parses with unique keys.

- **[Finnish translations for the newest
  features](https://github.com/wekan/wekan/commit/43006f9025fd8770c59334189af6bb3b6786226c)**:

  Translated the remaining English strings of the Upcoming features into Finnish
  (`fi.i18n.json`), matching existing terminology: Admin Panel / Version
  (database type, FerretDB/MongoDB version + commit, reactivity mode), Attachments
  / Database migration, Features (card loading all/lazy), and Backup (schedule,
  storage, restore, list). 44 keys; product names/acronyms kept as-is.

- **[Unit + negative tests for the newest
  features](https://github.com/wekan/wekan/commit/d2ec3ee400192b65f87edc29dbe6c12eb0cd0401)**:

  Extract the pure, security-/correctness-critical logic of the recent features
  into Meteor-free `models/lib/*` modules (shared by production and tests) and add
  plain-Node tests with positive and negative cases, wired into `test:unit:node`:
  the windowed-card publication's `$where` selector safety, `CARDS_LOADING` mode
  resolution + window-count id, the JSON export's streaming base64 chunker, and
  the backup files-root + schedule-text helpers. 41 assertions, all passing.

- **[docs:
  Design/Multiverse/Alternative-Architectures.md](https://github.com/wekan/wekan/commit/9828081c762fe180f01f1195351c0b1c2b95d59c)**:

  Document which CPU architectures WeKan can run on and why (the limit is Node.js,
  not FerretDB): the Node 24 / MongoDB / FerretDB v1 matrix, why armhf/armv7l/i386
  are unsupported (Node dropped 32-bit) and loong64 is not buildable in CI (no
  QEMU emulation / base image), the JavaScript-engine alternatives (Deno/Bun cover
  fewer arches; QuickJS/JSC/SpiderMonkey/JVM run on 32-bit but cannot run Meteor),
  and server-rewrite options (Go recommended, QuickJS niche, Tcl/Tk a poor fit).

- **[Fix backup build: archiver@8 (ESM) + @aws-sdk/lib-storage
  dependency](https://github.com/wekan/wekan/commit/abe8af0788d15053770d9f008098ab62a8daf55e)**:

  The Meteor/rspack build failed on `server/methods/backup.js`: `archiver@8` is now
  pure ESM with no default export or `archiver('zip', …)` factory (it exports
  classes), and the S3 streaming upload used `@aws-sdk/lib-storage`, which was not
  a dependency. Use `import { ZipArchive } from 'archiver'` /
  `new ZipArchive({ zlib: { level: 6 } })`, and add `@aws-sdk/lib-storage`
  (pinned to `~3.1073.0` to match the installed `@aws-sdk/client-s3`).

Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.83 2026-07-09 WeKan ® release

This release fixes the following bugs:

- **[Fix #3624 swimlane REST regression: await the async
  board.swimlanes()](https://github.com/wekan/wekan/commit/05fd6fd3a5435aa48acff26e2f15fe028cd6b08d)**:

  The swimlanes CRUD e2e test (23-rest-api-more.e2e.js:209) regressed on all
  browsers. Root cause: on the server ReactiveCache.getSwimlanes is async, so
  board.swimlanes() returns a Promise in the REST handler. The #3624 change read
  board.swimlanes().map(s => s.sort); .map on a Promise throws, the insert never
  ran, the error was swallowed by the handler's catch (returned as 200 with no
  _id), and the test read .title off a null swimlane.

  The earlier "move the require to a top-level import" commit was not the real
  cause (the same module.exports import pattern works server-side, e.g.
  ruleDeletePermission in rulesButton.js). The actual fix is to await
  board.swimlanes() before mapping. This also means API-created swimlanes now get
  a real max(existing sort)+1 sort — previously the un-awaited `.length` yielded
  undefined, so they were stored with no sort at all, which is the #3624 symptom.

  Verified: the swimlane test passed in every kept local run through
  2026-07-09_02-38-07 and failed starting 09-52-25 (right after the #3624 change),
  confirming the regression window; the tests/swimlaneSort.test.cjs unit test
  still passes.

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.82 2026-07-09 WeKan ® release

This release fixes the following bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9f7eac158e99f1ae38dedf586bc43225e267722c">Fix #5536: automated rule can now move/link a card to a different board</a>. Thanks to DarthKillian and xet7.</summary>

** Fix #5536: automated rule can now move/link a card to a different board **:
The rules "move card to top/bottom of a list on another board" and "link card to
another board" actions failed for boards the rule creator did not own. The
action showed BLANK after creating the rule (the wizard's optimistic client
inserts landed in minimongo limbo / were rejected by allow-deny for non-owner
members) — these now create the rule through the server `rules.createRule`
method, keeping the action's destination boardId. And execution crashed with an
"Internal Server Error" because the destination swimlane fallback dereferenced
`._id` on a possibly-undefined swimlane titled exactly `Default`
(renamed/translated/deleted on the destination board); resolution now uses the
board's real default swimlane via a Meteor-free resolver
`models/lib/ruleActionResolve.js`, unit tested in
`tests/ruleActionResolve.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a8470772627aa4b315bdd01712d31051be87a74">Fix #4978: board background updates when switching boards via the favorites bar</a>. Thanks to dasarne and xet7.</summary>

** Fix #4978: board background updates when switching boards via the favorites
bar **: Switching directly between two boards via the favorites bar reused the
same boardBody template instance, so the one-shot `setBackgroundImage()` in
onRendered never re-ran and the previous board's background stuck. It is now
applied inside a reactive autorun and clears any stale inline background when
the new board has no image. The decision is a Meteor-free helper
`models/lib/boardBackground.js`, unit tested in `tests/boardBackground.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e5c844fca7190d158302472862bab380707ff3aa">Fix #4881: Due this week / next week filter respects the start day of week</a>. Thanks to mimZD and xet7.</summary>

** Fix #4881: Due this week / next week filter respects the start day of week
**: The "Due this week" filter selected next week's cards and ignored the
configured start weekday, because it derived its window from `startOf(now(),
'week')` — which the native dateUtils never implemented, so it returned the date
unchanged. A new Meteor-free helper `models/lib/weekStart.js` computes the
correct week window for any start day of week; the this/next-week buttons now
toggle per week too. Unit tested in `tests/weekStart.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/75df523ef0324dd018955c82370df97fb3a3b8cc">Fix #4946: calendar week numbers respect the defined start day of week</a>. Thanks to helioguardabaxo and xet7.</summary>

** Fix #4946: calendar week numbers respect the defined start day of week **: In
the Calendar view the week-number column was numbered from Sunday regardless of
the start-day-of-week setting. The calendar now computes the number with
`weekNumberByFirstDay()` (in `models/lib/weekStart.js`) from the same firstDay
used to lay out the grid, unit tested in `tests/weekStart.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0119e62da5b6021d6a1fd7f67a9e6960efa50322">Fix #4653: LDAP username with a hyphen no longer becomes a dot</a>. Thanks to RowhamD and xet7.</summary>

** Fix #4653: LDAP username with a hyphen no longer becomes a dot **: With
`LDAP_UTF8_NAMES_SLUGIFY` enabled, `limax(text, { separator: '.' })` turned
every non-alphanumeric run — hyphens included — into `.`, so an LDAP username
like `p.parta-partb` became `p.parta.partb` and the user could not log in. The
username is now slugified per hyphen-separated segment and rejoined with `-`,
preserving hyphens while still transliterating UTF-8. Pure helper
`packages/wekan-ldap/server/usernameSlug.js`, unit tested in
`tests/ldapUsernameSlug.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9a5ac7a07050cbea746ab0a0a33e2e1f0f8dc1f">Fix #4236: Enter adds a new line in the card title, consistent with the description</a>. Thanks to listenerri and xet7.</summary>

** Fix #4236: Enter adds a new line in the card title, consistent with the
description **: The card title textarea submitted on plain Enter (only
Shift+Enter made a new line), unlike the description field which inserts a new
line on Enter and saves on Ctrl/Cmd+Enter. The title now uses the same shared,
Meteor-free rule `isSubmitKey()` (`models/lib/editorSubmitKey.js`): submit only
on Ctrl/Cmd+Enter, newline otherwise. Unit tested in
`tests/editorSubmitKey.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84ab805ec1f123f738d12a3a1b6c45a128fa58f3">Fix #4055: ISO week-number regression test (already correct in current code)</a>. Thanks to marcungeschikts and xet7.</summary>

** Fix #4055: ISO week-number regression test (already correct in current code)
**: #4055 reported the week number was one/two weeks too high for 2021-10-25..31
(ISO week 43). That was the old moment-based math; the current native, DST-safe
`getISOWeek()` computes it correctly. Added `tests/isoWeek.test.cjs` pinning the
reported dates so it cannot regress

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e014d5c8169053805da407facdee98531c6c7d14">Fix #4394: Register / Forgot Password links stay hidden after a failed login</a>. Thanks to Alsterdetektive1 and xet7.</summary>

** Fix #4394: Register / Forgot Password links stay hidden after a failed login
**: Security. With registration / forgot-password disabled in the Admin Panel,
the links were hidden by a one-shot `.hide()` that a useraccounts form re-render
(e.g. an LDAP failed login) dropped, so the links reappeared. The disable state
is now a class on the stable `<body>` ancestor with matching CSS, so the links
are re-hidden on every re-render

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/25cdc4db0d490b4bbd1cf3c66ac57325fd52cd04">Fix #4494: creating a board from a template no longer breaks subtasks</a>. Thanks to Xilef11 and xet7.</summary>

** Fix #4494: creating a board from a template no longer breaks subtasks **: A
board created from a template inherited the template's subtasksDefaultBoardId /
dateSettingsDefaultBoardId; when those pointed at the template board itself,
subtasks created on the new board were dropped onto the TEMPLATE board and
linked back across boards. Board.copy() now repoints such self-referential
defaults to the copy and clears the paired list id so it self-heals on the new
board. Pure helper `models/lib/boardCopyDefaults.js`, unit tested in
`tests/boardCopyDefaults.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14b4f5b5ed34a31d6e077114c42ab80a6a965091">Fix #4249: filter by card title now works for renamed linked cards</a>. Thanks to Ben0it-T and xet7.</summary>

** Fix #4249: filter by card title now works for renamed linked cards **:
Renaming a linked card wrote the new title only to the linked target, leaving
the linking card's own title field stale; filter-by-title queries the own field,
so linked cards dropped out of title filters after a rename. Card.setTitle() now
also writes the linking card's own title. Pure helper
`models/lib/linkedCardTitle.js`, unit tested in `tests/linkedCardTitle.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3117e419bbf6e0b0db53b2d1b8328dac1a5bfd8d">Fix #3606: activity feed no longer shows "edited/deleted comment undefined"</a>. Thanks to janchuelo and xet7.</summary>

** Fix #3606: activity feed no longer shows "edited/deleted comment undefined"
**: The feed passed the comment id (absent on old activities, and gone for a
deleted comment) into the activity string. Edit/delete activities now store the
comment text and render it via `Activities.commentDisplayText()`, which falls
back to the live comment text and then to an empty string — never "undefined".
Pure helper `models/lib/commentActivity.js`, unit tested in
`tests/commentActivity.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3f17be14d9841b33be9dc93c2e55759778c5bdc">Fix #3624: new_swimlane REST API appends the swimlane last and accepts a sort</a>. Thanks to tamasberesoebb and xet7.</summary>

** Fix #3624: new_swimlane REST API appends the swimlane last and accepts a sort
**: `POST /api/boards/:boardId/swimlanes` set the sort to the swimlane count, so
a new swimlane appeared FIRST when existing sort values were non-contiguous. It
now appends at max(existing sort)+1 and honors an optional explicit `sort` in
the body. Pure helper `models/lib/swimlaneSort.js`, unit tested in
`tests/swimlaneSort.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/38471577534cfb558c41abe45f3c6cc064dbed50">Fix #3185: copying a card (or template) now copies its subtasks' checklists</a>. Thanks to ramses345 and xet7.</summary>

** Fix #3185: copying a card (or template) now copies its subtasks' checklists
**: Copying a card inserted each subtask as a bare card document, so the
subtasks' checklists (and items) were dropped and the copied subtasks came out
empty. Card.copy() now copies each subtask's checklists onto the new subtask.
Pure helper `models/lib/subtaskCopy.js`, unit tested in
`tests/subtaskCopy.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1621f3784a824fa6f2e23bbd4107c16bf869ccf6">Fix #5439: list scrollbar is always visible on desktop and mobile browsers</a>. Thanks to xet7.</summary>

** Fix #5439: list scrollbar is always visible on desktop and mobile browsers
**: List bodies used `overflow-y: auto`, so overlay scrollbars
(macOS/iOS/Android/ Firefox) auto-hid. The list body now keeps a scrollbar
visible across all engines — `overflow-y: scroll`, `::-webkit-scrollbar`
(Chrome/Safari/Edge/ mobile WebKit), `scrollbar-width`/`scrollbar-color`
(Firefox/Gecko) and `scrollbar-gutter: stable`. Cross-browser rules in
`models/lib/scrollbarCss.js`, applied in `client/components/lists/list.css`,
unit tested (builder contract + applied CSS, positive + negative) in
`tests/scrollbarCss.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3aaf8f9b6180661abb0a86becf15710fc6937ef8">Fix #6444: RTL — typing a card title no longer garbles other lists' minicard titles</a>. Thanks to xet7.</summary>

** Fix #6444: RTL — typing a card title no longer garbles other lists' minicard
titles **: In an RTL language (e.g. Arabic) the board root is `dir="rtl"`, and
both the minicard title (a `dir="auto"` `.viewer`) and the add-card composer
textarea were `dir="auto"` with no bidi isolation, so they shared the
surrounding bidirectional context. Typing a strong RTL character into one list's
composer re-resolved that shared context and visibly reflowed the displayed
minicard titles of the OTHER lists (no data change, reverted on refresh). Each
title and the composer now use `unicode-bidi: isolate`. Locked in (positive +
negative) by `tests/minicardBidiIsolation.test.cjs`; browser RTL behaviour is
covered by `tests/playwright/specs/18-rtl-layout.e2e.js`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/984ec160daec54b0e6b16cd15d89884f1c4fadf1">Fix the Playwright CI test failures introduced by the #3624 and #4236 fixes above</a>. Thanks to xet7.</summary>

**[Fix the Playwright CI test failures introduced by the #3624 and #4236 fixes
above](https://github.com/wekan/wekan/commit/05fd6fd3a5435aa48acff26e2f15fe028cd6b08d)**:
Two browser tests failed on Chromium, Firefox and WebKit after this release's
changes. (1) `23-rest-api-more.e2e.js:209` (swimlanes CRUD): on the server
`ReactiveCache.getSwimlanes` is async, so `board.swimlanes()` returns a Promise
in the REST handler. The #3624 change read `board.swimlanes().map(s => s.sort)`;
`.map` on a Promise throws, so `POST /api/boards/:boardId/swimlanes` never ran
the insert, the error was swallowed by the handler's `try/catch` (returned as
200 with no `_id`), and the test read `.title` off a `null` swimlane. The old
`board.swimlanes().length` had tolerated the un-awaited Promise by silently
yielding `undefined` (so API-created swimlanes were stored with no sort at all —
the very #3624 symptom). Fixed by `await`ing `board.swimlanes()` before mapping,
which also gives API-created swimlanes a real `max(sort)+1` value. (2)
`02-cards-open-view.e2e.js:93` (editing the card title): #4236 deliberately made
plain Enter insert a newline in the card title (Ctrl/Cmd+Enter saves), but the
`CardPage` page object still saved with plain Enter, so the title never
persisted and the read timed out — updated to save with `Control+Enter` (
`984ec16` ). The server-side Mocha, import-regression and Node E2E jobs were
already green; this makes the Playwright jobs green too

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.81 2026-07-09 WeKan ® release

This release adds the following new features:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b07c4d0a7bed0f03ba2d7d1ad1f030e7edf3dfff">Feature #5394: the Link-card popup's Cards dropdown is now sorted alphabetically</a>. Thanks to xet7.</summary>

** Feature #5394: the Link-card popup's Cards dropdown is now sorted
alphabetically **: In the "Link to this card" popup, the Cards pull-down list is
now sorted alphabetically by card title (case-insensitive, locale/numeric aware)
instead of board sort order, so a card can be found on boards with many cards

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7ce71dbb2e1eae5159503eefac7e6f349dfb59c8">Feature #5396: edit Lists (title, color) via the REST API + api.py commands</a>. Thanks to C0rn3j and xet7.</summary>

** Feature #5396: edit Lists (title, color) via the REST API + api.py commands
**: Lists can now be edited through the REST API like cards can. The endpoint
`PUT /api/boards/:boardId/lists/:listId` already accepted `title`, `color`,
`starred` and `wipLimit`, but the color was stored unvalidated; it now validates
the color with `normalizeListColor` (a named palette color or a custom `#rrggbb`
hex) and rejects an unknown color with a clear 400 instead of silently storing
None. The pure field/validation logic lives in a Meteor-free helper
`models/lib/listApiUpdate.js` and is unit tested in
`tests/listApiUpdate.test.cjs`. The `api.py` reference CLI gains two new
commands mirroring `editcard`/`editcardcolor`: `editlist BOARDID LISTID
NEWLISTTITLE` and `editlistcolor BOARDID LISTID COLOR`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30f36a7f319675bd3aac7a4ba0700427000726b9">Feature #5514: custom color-wheel (RGB/hex) picker with automatic readable text contrast</a>. Thanks to Ruyeex and xet7.</summary>

** Feature #5514: custom color-wheel (RGB/hex) picker with automatic readable
text contrast **: The color pickers that previously offered only a fixed set of
named colors now also include a native color wheel (`<input type="color">`), so
any `#rrggbb` color can be chosen. The wheel was added alongside the existing
swatches for card labels ("categories"), swimlanes ("tabs"), lists and cards.
The schema color fields accept a custom hex in addition to the named palette,
and existing named-color data keeps working; a stored hex is rendered with an
inline `background-color` instead of the named CSS class. A new pure,
Meteor-free helper `models/lib/contrastColor.js` computes a readable text color
from sRGB relative luminance (white text on dark backgrounds, black on light),
maps the named palette to hex, and validates/normalizes hex; it is applied as an
inline text color wherever a chosen color is a background behind text (label
chips, swimlane / list headers, minicard, card details header), so text stays
readable on any color. Covered by `tests/contrastColor.test.cjs` (20 assertions
pass)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53328f40c6e092988175ce820c14658c855390de">Feature #5621: Rules can set a date field to a custom time (value + minute/hour/day/week/month…</a> Thanks to xet7.</summary>

** Feature #5621: Rules can set a date field to a custom time (value +
minute/hour/day/week/month later) **: The Rules "Set date relative to now"
action previously only offset a date field (Start / Due / End / Received) by a
whole number of DAYS. It now has a unit selector, so a rule can set a date field
to now + `<value>` `<unit> later`, where the unit is minute(s) / hour(s) /
day(s) / week(s) / month(s); negative values move the date earlier. Months use a
real calendar-month add (e.g. keeping the same day-of-month) rather than a fixed
30-day approximation. Existing rules created before this change have no stored
unit and keep working exactly as before (no unit ⇒ days), so the change is fully
backward compatible. The offset math lives in a new pure, Meteor-free helper
`models/lib/relativeDateOffset.js` used by `server/rulesHelper.js` and covered
by `tests/relativeDateOffset.test.cjs` (15 assertions pass). Note that the
related "overdue" Rules trigger and the "set date field to now" action from the
same feature request already existed in an earlier release; this change adds
only the missing custom-time unit selector

</details>

and fixes the following bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d41e17d6a088edf6abbb1f9517d2ecb58d618f03">Fix #5351: users are auto-added to organizations matching their email domain on sign-up</a>. Thanks to xet7.</summary>

** Fix #5351: users are auto-added to organizations matching their email domain
on sign-up **: the Organization setting "Automatically add users with the domain
name" (`org.orgAutoAddUsersWithDomainName`) could be configured, but nothing at
sign-up ever read it, so a new user whose email domain matched an organization
was never added to it; the `Accounts.onCreateUser` hook now, on every non-admin
sign-up path (password registration, LDAP, invitation code, new OIDC user), adds
the user to each organization whose configured domain exactly matches the domain
part of their email (case-insensitive, exact — a subdomain does not match and an
empty org domain matches nobody), using the same `{ orgId, orgDisplayName }`
membership shape used everywhere else and never duplicating an existing
membership, with the matching decision extracted into a Meteor-free, unit-tested
`orgsToAutoAddForEmail` helper

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ce2d8cc8871e5da6f0ce5dde04520885649c0ba">Fix #5369: the Activities show/hide control is now a clear eye / eye-slash icon toggle</a>. Thanks to xet7.</summary>

** Fix #5369: the Activities show/hide control is now a clear eye / eye-slash
icon toggle **: the Activities panel's show/hide control was a generic,
unlabeled material toggle switch whose ON/OFF meaning was counterintuitive; it
is replaced on the card details Activities panel with an eye / eye-slash icon
toggle (open eye = activities shown, crossed eye = activities hidden) that
mirrors the login/register password-visibility toggle, so the icon reflects the
current visibility, clicking flips it, and the tooltip states the action (Show
activities / Hide activities). For consistency the board sidebar Activities
toggle, which drives the same showActivities state, was switched from the check
/ empty-square icon to the same eye / eye-slash toggle. The underlying show/hide
setting and its persistence are unchanged

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aad00cdba2bb896068f4a896cf67df2a7bd79a73">Fix #5442: outgoing webhooks now include the label name on add/remove label</a>. Thanks to xet7.</summary>

** Fix #5442: outgoing webhooks now include the label name on add/remove label
**: the addedLabel/removedLabel outgoing webhook (and notification) text showed
a bare, generic "label" with no name, because labels are embedded in the board
document but the Activities `label()` helper looked the label id up in the Cards
collection and always returned undefined, so the `__label__` token was never
filled; the hook now resolves the label from the already-loaded board via
`getLabelById` and a pure, unit-tested `labelDisplayName` helper (name, then
color for a nameless label as shown in the UI, then the id), so the webhook
always carries the label's display name

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/da0d338e336ecfd3c120753aaea064e9487bf3cd">Fix #5482: adding/editing a card description now triggers outgoing webhooks</a>. Thanks to xet7.</summary>

** Fix #5482: adding/editing a card description now triggers outgoing webhooks
**: outgoing webhooks fire only when an operation logs an activity (the
Activities.after.insert hook posts to the board's webhooks), but changing a
card's description created no activity — unlike title/date changes — so no
webhook was sent; the Cards before.update hook now logs an
`a-changedDescription` activity on first-time set and later edits (but not on
no-op / empty-to-empty saves), so the existing webhook hook fires, with a
Meteor-free unit-tested `descriptionChanged` helper

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c499823cbc8c5785ec604015d55e28daa11336e">Fix: the Rules Workflow view is now fully translatable via i18n</a>. Thanks to xet7.</summary>

** Fix: the Rules Workflow view is now fully translatable via i18n **: the Rules
Workflow view rendered its trigger/action palette chips ("Card is created",
"Move card to top", "Set received date to now", etc.) as hardcoded English
regardless of the UI language, while the rest of the page was translated; each
palette entry now carries an i18n key translated at render time via TAPi18n.__
(reusing existing rule keys where they fit, plus new r-w-* keys for
workflow-only labels), and the slot clear tooltip now uses the existing r-remove
key, so the whole view follows the selected language

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68dd14140f620574a95db42dc1078a7b4bd97916">Fix: deleting a board rule no longer fails with "Access denied [403]"</a>. Thanks to xet7.</summary>

** Fix: deleting a board rule no longer fails with "Access denied [403]" **:
deleting a rule ran three separate client-side Collection.remove() calls (Rules
+ Triggers + Actions), each gated by a per-collection allow() rule that resolved
the board from that document's own boardId; when a trigger/action document had
no resolvable boardId (legacy docs, or docs not published to the client) the
board came back null, `allowIsBoardAdmin` returned false, and Meteor rejected
the mutation with 403 "Access denied" — so the delete failed even for a
legitimate board admin. Rule deletion now goes through a new server method
`rules.deleteRule` that authorizes once (active board admin or site admin) and
removes the rule, its trigger and its action server-side, bypassing the brittle
client allow/deny; the permission decision is a Meteor-free, unit-tested helper
and no permission is loosened

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e9aed5a4b359188a9390f1132443614b3b0e133">Fix #5510: adding a board label via the REST API no longer errors/hangs</a>. Thanks to xet7.</summary>

** Fix #5510: adding a board label via the REST API no longer errors/hangs **:
PUT /api/boards/:boardId/labels only sent a response when the body had a `label`
key, so a body without one hung until the client timed out, and a bare-string
`label` pushed a schema-invalid label and returned 200; the handler now always
returns JSON (2xx on success, 4xx on bad input, real error status otherwise) via
a pure, unit-tested input helper

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d01526bbff892a946a58aae1b516bd0b82d23113">Fix #5604: CSV export no longer crashes on boards with dangling references</a>. Thanks to xet7.</summary>

** Fix #5604: CSV export no longer crashes on boards with dangling references
**: exporting a large/old board to CSV failed with "Couldn't download - Network
issue" because Exporter.buildCsv read `.title`/`.username`/`.name` directly on
the result of looking up a card's deleted
list/swimlane/owner/member/assignee/label/customField by id, throwing "Cannot
read property 'title' of undefined"; the per-card row builder is now a null-safe
helper that emits a blank cell for missing references while keeping identical
output for well-formed cards

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b0da9097c18dea12ccce8dec6de8a5cf2519551a">Fix #5656: the Calendar view now honors the active board filters</a>. Thanks to kerier and xet7.</summary>

** Fix #5656: the Calendar view now honors the active board filters **: the
Calendar view queried cards by board and date only and ignored the active Filter
sidebar (member / assignee / due-date / label / custom-field), so it showed
every card in the interval unlike the Board / Lists / Swimlanes views; it now
ANDs the Filter selector into its query and refetches when the filter changes

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/457713968cf3c365899271606398b7796a7b07f4">Fix #6442: All Boards "Custom (drag order)" — drop now persists the reorder</a>. Thanks to jullbo and xet7.</summary>

** Fix #6442: All Boards "Custom (drag order)" — drop now persists the reorder
**: Follow-up to #6439, which restored the drag preview but left the drop a
no-op: dragging a board on the All Boards page in Custom (drag order) mode
showed the dashed-border preview, but releasing it snapped the board back
without reordering. The drop handler built the current on-screen order from
`el.classList[0]` of each `.js-board`, but the item is
`li.js-board(class="{{_id}} …")` and Jade emits the literal `js-board` class
FIRST, so `classList[0]` was the string `"js-board"` for every board — never the
board `_id`. The ordered ids were therefore `['js-board','js-board',…]`, the
(correct, unit-tested) `computeReorderedSortIndex` helper could not find the
dragged/target ids among them, returned `null`, and nothing was written to
`profile.boardSortIndex`; the preview still worked because it is driven by the
`dragover` CSS class, independent of the id. The fix reads each board's `_id`
from its Blaze data context (the same source `dragstart` uses via `this._id`)
instead of the literal class, so the real display order reaches the reorder
helper and the drop persists. Guarded by a new case in
`tests/boardSortReorder.test.cjs` (the wrong-class extraction yields no mapping;
real ids reorder)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a37e7d1cc7e1a4541c498c974aa97b2e36136065">Fix #6443: cards on a deleted swimlane are invisible in swimlane view</a>. Thanks to xet7.</summary>

** Fix #6443: cards on a deleted swimlane are invisible in swimlane view **: On
some old boards a swimlane was deleted while its cards kept the now-dangling
`swimlaneId` (an "orphaned" card), so those cards showed no content in swimlane
mode even though they worked in list mode. Cards with no swimlane at all (`null`
/ `''` / missing) already appear in every swimlane, but an orphaned card matched
no existing swimlane and so was visible in NO swimlane (while list view, which
applies no swimlane scope, still showed it) — exactly the reported symptom. The
fix mirrors the existing orphaned-**list** fallback
(`Swimlanes.orphanedSwimlaneLists`, which surfaces orphaned lists in the first
swimlane) for **cards**: when a list's cards are fetched for the board's FIRST
swimlane, the swimlane-membership clause becomes a single `{ swimlaneId: { $nin:
<otherSwimlaneIds> } }` (everything not owned by another existing swimlane: own
id, `null`/`''`, missing, or orphaned). It stays a single field clause with no
second `$or`, so the #6441 board-wide label filter still holds, and orphaned
cards appear once — in the first swimlane — without a database migration.
Threaded through the pure `models/lib/swimlaneFilter.js` helpers, the in-memory
`filterCardsByListAndSwimlane`, a new `List.orphanedCardsSwimlaneIds` helper and
the `cards()`/`cardsUnfiltered()`/`allCards()` model methods plus the `listBody`
`cardsWithLimit` render helper. Covered by new cases in
`tests/swimlaneFilter.test.cjs` (18 assertions pass; the #6441 regression guards
stay intact)

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.80 2026-07-06 WeKan ® release

This release adds the following new features:

<details>
<summary><a href="https://github.com/wekan/wekan/issues/5850">Admin Panel Domains table: pagination, column sort and search (like the Board Table view)</a>. Thanks to xet7.</summary>

** Admin Panel Domains table: pagination, column sort and search (like the Board
Table view) **: The Admin Panel > People > Domains table loaded every domain
(aggregated from all users) into the browser at once, with a fixed order and no
search. It now behaves like the Board Table view: the server aggregates the
domains and returns only one small page, so the whole list is never sent to the
browser. You can order by the Domain or Users column (click the header to toggle
ascending / descending, with a ▲/▼ indicator) and filter with a search box;
prev/next controls page through the results. The search + sort + slice runs in
the new pure, unit-tested `models/lib/domainTablePage.js` behind a new
`getDomainsWithUserCountsPage` admin method (`server/models/users.js`), and the
`domainGeneral` template (`client/components/settings/peopleBody.{jade,js,css}`)
is now self-contained and fetches only the current page. Covered by
`tests/domainTablePage.test.cjs`

</details>

and adds the following tests:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dfa6c78d4f032a698f6feaad189c86da903d27fb">Verified and added a regression test for the board-invitation email language</a>. Thanks to xet7.</summary>

** Verified and added a regression test for the board-invitation email language
**: Confirmed that a board-invitation email is localised in the existing
recipient's own profile language, or — when the invitee is a new account created
by the invite — in the inviter's profile language, defaulting to `en`
(`en.i18n.json`) when none is set. The behaviour was already correct; the
language choice is now extracted into the pure, unit-tested
`models/lib/inviteEmailLanguage.js` used by `inviteUserToBoard`, and locked in
by `tests/inviteEmailLanguage.test.cjs`

</details>

and fixes the following bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ef7f4a07a6b40a2582af24b27fe133119adcd18">Linked-card minicard now shows the cover image of the real card</a>. Thanks to 32Dexter and xet7.</summary>

** Linked-card minicard now shows the cover image of the real card **: A linked
card (created by "Link card to this card") on one board did not show the cover
image of the real card it points at on another board, even though the card's
other fields did. A linked card is only a placeholder — its real content lives
on the card at `linkedId` — and every other minicard getter resolves through the
real card (`getTitle`/`getReceived`/`getDue`/…), but the cover helpers read
`this.coverId` directly, and a linked card has no `coverId` of its own. The real
card's cover attachment is already published to the linking board (see the
"linked cards" / "attachments for linked cards" children of the `board`
publication), so this was purely a client-side resolution gap. `Card.cover()`
and the minicard `cover()` helper now resolve the cover id through the real card
via the pure, unit-tested `models/lib/linkedCardCover.js`; normal cards are
unaffected. Covered by `tests/linkedCardCover.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac368de06a9b1d7a29dd6e4af8dc2f81fa1e3db7">Fix date-picker calendar stays fully visible when opened low on a scrolled page</a>. Thanks to MarcusDger and xet7.</summary>

** Fix date-picker calendar stays fully visible when opened low on a scrolled
page **: Opening a date field (due/start/end date, or a date custom field) low
on the screen showed the calendar popup extending past the visible area, and —
because the pop-over is `position: absolute` (document coordinates) — scrolling
to reach it moved the calendar along with the page, so the full calendar could
never be seen (the workaround was to close it, drag the field to the center and
reopen). `Popup._getOffset` computed the space above/below the opener and the
clamped `top` from the opener's DOCUMENT offset mixed with the VIEWPORT height,
ignoring the page scroll, so on a scrolled page the anchored popup landed
outside the visible viewport. The geometry now runs in viewport coordinates
(subtracting the page scroll) and clamps the popup fully within the visible
viewport, then converts back to document coordinates for the absolute style;
when the page is not scrolled the output is unchanged. Extracted the math into
the pure, unit-tested `client/lib/popupOffset.js`, used by
`client/lib/popup.js`. Covered by `tests/popupOffset.test.cjs`

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.79 2026-07-06 WeKan ® release

This release fixes the following bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8e31745d8104c58dc7bbcb4c1e4c615141a8e82">Fix #6439: Custom (drag order) sort on All Boards page now reorders via drag-and-drop</a>. Thanks to jullbo and xet7.</summary>

** Fix #6439: Custom (drag order) sort on All Boards page now reorders via
drag-and-drop **: On the All Boards page the jQuery-ui sortable that reordered
boards in the "Custom (drag order)" mode was removed when the page switched to
HTML5 drag-and-drop for workspaces, and nothing replaced it, so dragging a board
showed a not-allowed cursor and never updated `profile.boardSortIndex`. Added
HTML5 `dragover`/`drop` reorder handlers on the board tiles in
`client/components/boards/boardsList.js` (active only in the custom sort mode),
a `setBoardSortIndexes` helper in `models/users.js` to persist the new order in
one write, a drop-hint style in `client/components/boards/boardsList.css`, and
extracted the reorder decision/index math into the pure, unit-tested
`models/lib/boardSortReorder.js`. Covered by `tests/boardSortReorder.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd90995db74593228d40bc504405620ec09c175d">Fix #6440: '+' add-item button on minicard checklist does nothing</a>. Thanks to jullbo and xet7.</summary>

** Fix #6440: '+' add-item button on minicard checklist does nothing **: On the
minicard the checklist add-item `<form>` is rendered inside the
`a.minicard-wrapper` anchor, so the native form `submit` event never reached the
Blaze event map — the #5565 minicard-checklist work wired only a `submit
.js-add-checklist-item` handler (which never fires there) and gave the Save
button no click handler, so clicking "+" Save did nothing. Added an explicit
`click .js-submit-add-checklist-item-form` handler in
`client/components/cards/minicard.js` (mirroring the working edit-item button)
that inserts the item, with the blank-input guard and title parsing extracted
into the pure, Meteor-free `models/lib/checklistItemTitles.js`. Card-detail
checklists are unaffected. Covered by `tests/checklistItemTitles.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9dca403782d476eb3c593fe614848ef02bb7f5a3">Fix #6441: label filter now applies board-wide across all swimlanes</a>. Thanks to jullbo and xet7.</summary>

** Fix #6441: label filter now applies board-wide across all swimlanes **: A
label filter hid non-matching cards in one swimlane (e.g. "Focus") but left
another swimlane (e.g. "Background") unfiltered. Each list scopes its cards to
the current swimlane while also showing shared/orphaned cards that have no
swimlane; that fallback was written as a bare top-level `$or`, which competes
with the board Filter's own top-level `$or` (label/member criteria) when the two
selectors are combined — dropping the label criterion in every swimlane except
the default one. The swimlane-membership fallback is now a single `swimlaneId: {
$in: [id, null, ''] }` clause (the same form already used in
`sidebarFilters.js`, `cardDetails.js` and `dialogWithBoardSwimlaneList.js`),
extracted to the pure, unit-tested `models/lib/swimlaneFilter.js` and used by
`client/components/lists/listBody.js` and `models/lists.js`, so no second `$or`
exists and the filter is always `$and`-combined and applied board-wide. Covered
by `tests/swimlaneFilter.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc4eadedc9109602ee029b60c44eeda869aa98c3">Fix flaky server-side Mocha test (i18n zh-CN "is not a spy")</a>. Thanks to xet7.</summary>

** Fix flaky server-side Mocha test (i18n zh-CN "is not a spy") **: The
server-side Mocha suite intermittently reported "1 failing" on the #5756
`imports/i18n/i18n.test.js` region-tag test with `TypeError: [Function] is not a
spy`. The assertion re-read `TAPi18n.i18n.addResourceBundle`, and the sinon-chai
matcher (routed through chai-as-promised) could evaluate after this suite's
`afterEach` had already run `sinon.restore()` — at which point the property is
the original function, not the stub. The `.loadLanguage` tests now assert on the
captured stub reference (restore unwraps the property but leaves the spy
intact), which is deterministic. Reproduced and verified with a standalone
sinon/chai script

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.78 2026-07-06 WeKan ® release

This release fixes the following bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b1b414e850c5494dd3849f8dab6db44fecef0196">Fix "Internal Server Error" when signing up despite the account being created</a>. Thanks to Firas-Git and xet7.</summary>

** Fix "Internal Server Error" when signing up despite the account being created
**: Registering a new account showed a red "Internal server error" on the
sign-up form even though the account was created and could sign in — which
typically happens when SMTP is not configured. Root cause: useraccounts'
`ATCreateUserServer` creates the account and then calls
`Accounts.sendVerificationEmail()` (because `sendVerificationEmail: true`); when
SMTP is missing/misconfigured that send throws **after** the user row is
inserted, and with no try/catch the exception leaves the createUser method as an
opaque HTTP 500. The verification email is best-effort at sign-up, so
`Accounts.sendVerificationEmail` is now wrapped to log and swallow a transport
failure — registration completes and redirects to sign-in — while an "already
verified" error is re-thrown so the resend-verification flow still reports it.
This mirrors the [#5706](https://github.com/wekan/wekan/issues/5706)
reset-password hardening. Covered by `tests/verificationEmail.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb9c8973092df5aa3112d3d59e3da4d8793c628b">Fix can not add members to a Linked Card</a>. Thanks to ITT5 and xet7.</summary>

** Fix can not add members to a Linked Card **: A **linked card** (created by
"Link card to this card") is only a placeholder on the board that links it — its
members are stored on the **real card** it points at (`linkedId`), which lives
on another board, and `Card.getMembers()` / `assignMember()` /
`unassignMember()` already read and write that real card. But the member
**picker** listed the members of the board you were *viewing* the linked card
on, not the board the real card lives on. So on a board that links a card from
another board, the picker offered the wrong set of members and toggling them did
not behave as a consistent add/remove — "can not add members to the linked
card". The picker now resolves a linked card to its real card's board and offers
*that* board's active members (matching where the membership is actually
stored), falling back to the current board for normal cards or when the real
card isn't loaded yet. Extracted the target-card/target-board resolution into
`models/lib/linkedCardMembers.js`, covered by `tests/linkedCardMembers.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/001c258f967caa502bf1d1ebb147b8506596f4bf">Fix can't search numbers in custom fields</a>. Thanks to MarcusDger and xet7.</summary>

** Fix can't search numbers in custom fields **: Searching a board for the value
of a **number** or **currency** custom field (e.g. a transaction number
`2025001`, or a currency amount `123`) found nothing. Those field types store
their value as a JS **Number** (the inputs save `parseInt(...)` /
`Number(...)`), but `Board.searchCards()` only matched custom fields with `{
value: <regex> }` — and a MongoDB / Minimongo regex only matches **string**
values, so it silently skipped every numeric custom field. The search now also
adds an exact numeric-equality clause when the term is a plain number (a comma
is accepted as a decimal separator, matching the currency input), so numeric
custom fields match too; text/title/description matching is unchanged. Card
search runs against Minimongo on the client, which — like MongoDB — cannot regex
a numeric field, so equality is the correct cross-environment match. Covered by
`tests/cardSearch.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2242da4176edcd7ed6bbdd779fe2bafab8457b7c">Fix "Removed nonexistent document" crash during notification_cleanup</a>. Thanks to xet7.</summary>

** Fix "Removed nonexistent document" crash during notification_cleanup **: The
scheduled notification-tray cleanup logged `Exception in removed observeChanges
callback: Error: Removed nonexistent document …`. The crash itself came from the
old `cottz:publish-relations` package (since replaced by
`reywood:publish-composite`), but the cleanup that provoked it still fired one
**un-awaited** `removeNotification()` per expired notification — a separate
`Users.update` `$pull` each time — so a user with K stale notifications produced
K writes to the Users collection, and every publication that republishes user
documents re-ran its observers K times in quick bursts (the churn that surfaced
the removed-document error), while any rejected write went unhandled. The
cleanup now scans only users that have notifications and prunes each user's
stale notifications in a single awaited `$pull … $in`. It also removes an
activity's notifications only when *every* entry for that activity is read and
past its removal age (so a freshly re-created unread notification sharing an
activity id is not dropped), and guards missing/invalid `read` timestamps.
Covered by `tests/notificationCleanup.test.cjs`

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/issues/5698">Fix impossible to select another board in rules</a>. Thanks to Augustin356 and xet7.</summary>

** Fix impossible to select another board in rules **: In the IFTTT-Rules "Move
card to the board" and "Link card to the board" actions, the board dropdown was
empty for some users — the current board included — while colleagues in the same
company could pick boards normally. Root cause: the dropdown filtered the
(already access-scoped) client cache with `'members.userId': me`, i.e. it only
kept boards where the user has a *direct* member entry. A user who reaches a
board through an Organization, Team or email-domain share — but is not listed
individually in `board.members` — matched nothing, so the whole selector came up
empty. The dropdown now filters by the same visibility rule as
`Boards.userBoards()` (public OR active member OR active org OR active team OR
active domain), so org/team/domain-shared boards appear too, while archived
boards, template containers, the user's templates board and internal helper
boards stay excluded

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc1f149ea373be46a6ac1ab6f71d382194acebeb">Fix board disappeared after adding another user</a>. Thanks to DVNBLMHC and xet7.</summary>

** Fix board disappeared after adding another user **: A board admin adding
another user could make the whole board silently vanish from a user's board
list, with no archive and "nothing out of order" in the logs. Root cause: the
`setBoardTeams` server method (used by the board Teams/Members management
popups) blindly overwrote the board's entire `members` array with a snapshot
sent by the client. When that client's board document was stale — e.g. a member
had just been added via `inviteUserToBoard` on the server and the change had not
yet propagated to the client — the overwrite dropped members, and in the worst
case the board's own admin, so the board no longer matched the board-list
publication (which requires an active membership) and disappeared. Because a
wholesale `$set: { members }` never passes through `foreachRemovedMember()`, no
`removeBoardMember` activity was logged and no card/watcher/star cleanup ran,
which is why the logs looked normal. `setBoardTeams` now reconciles against the
authoritative server-side members instead of trusting the client snapshot: it
never drops an active admin, keeps every existing member the client still lists,
adds the members the client introduces, and only removes non-admin members the
client explicitly omitted (an intentional team-leave) — logging and cleaning up
each such removal so it is auditable rather than silent

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.77 2026-07-06 WeKan ® release

This release adds the following updates:

<details>
<summary><a href="https://github.com/wekan/wekan/issues/6454">Snap: migrate any existing MongoDB (3, 7, or other) to FerretDB (SQLite) on upgrade, and fix the…</a> Thanks to xet7.</summary>

**Snap: migrate any existing MongoDB (3, 7, or other) to FerretDB (SQLite) on
upgrade, and fix the upgrade that failed with "could not start migratemongo
mongod on the MongoDB 3.x data"** ( #6454 ). The WeKan snap now moves EVERY
existing MongoDB database onto FerretDB (SQLite) on first boot after an upgrade
— text data into SQLite and the CollectionFS + Meteor-Files GridFS
attachments/avatars onto the filesystem (files/attachments, files/avatars) —
then shuts MongoDB down so only WeKan (Node.js) + FerretDB (SQLite) run. The
MongoDB version only decides HOW the source is read: a modern MongoDB (6/7) is
read with the `mongodb` driver, old MongoDB 3.x with the bundled migratemongo
3.2 CLI (mongoexport). This also fixes the reported failure: the old check was a
false dichotomy — it probed whether mongod 7 could open the data and, if that
short probe failed for ANY reason (journal recovery, a stale `mongod.lock`, a
slow disk, a large oplog), assumed the data was MongoDB 3.x; a healthy MongoDB 7
database then went down the 3.x path, mongod 3.2 also could not open it, and —
because `mongodb-control` `exec`s the migration script — mongod never started,
so the MongoDB service failed to activate and looped on every restart. Now a
mongod-7-openable database is migrated with the modern importer instead of being
misclassified; the mongod-7 readiness probe was lengthened (20s → 45s) so large
databases needing recovery are not misread; the temporary source mongod is
tracked by pidfile and force-stopped so it never leaves the dbpath locked; and
if neither mongod can open the data (unusual/corrupt) or the tools are missing,
the snap falls back to a normal MongoDB start (never leaving the service dead)
and retries next boot. The MongoDB data is never modified or deleted; the snap
only switches to FerretDB once the migration succeeds

</details>

<details>
<summary>Migration dashboard: use the Admin Panel product name instead of "WeKan". Thanks to xet7.</summary>

**Migration dashboard: use the Admin Panel product name instead of "WeKan"**. If
the migrated database has a product name set in Admin Panel
(`settings.productName`), both the Snap and Sandstorm migration progress
dashboards now show that name and do not mention WeKan; otherwise they default
to WeKan.

</details>

- Updated Code of Conduct. [Part
  1](https://github.com/wekan/wekan/commit/3b031bd901916d4c3d0a49421e5f81a6624fa0f4),
  [Part
  2](https://github.com/wekan/wekan/commit/83f63c9efae9fe00a3c04a3a65e65f807a8db4cb).
  Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d4e48ddd6b9ee086f0aa10d9f7c9893fe1637e4">Retry snapcraft install in the release-all.yml snap job</a>. Thanks to xet7.</summary>

** Retry snapcraft install in the release-all.yml snap job **: The v9.76
release's `snap` job failed at `sudo snap install snapcraft --classic` with
`error: cannot install "snapcraft": too many requests` — a transient Snap Store
rate limit (429-style throttle) that instantly failed the whole job before any
build ran. The install now retries up to 5 times with 30s backoff, so one store
throttle no longer fails the release (matching the `remote-build` retry already
in the same job)

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.76 2026-07-06 WeKan ® release

This release adds the following fixes:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b21158736f9e1360332903707c100bce3d6b164">Fix notification emails linked to /b/undefined/board/&lt;cardId&gt; instead of the real board</a>. Thanks to titver968 and xet7.</summary>

** Fix notification emails linked to `/b/undefined/board/<cardId>` instead of
the real board **: On the server `ReactiveCache.getBoard()` is async and returns
a Promise, but `Cards.board()` did not await it, so the synchronous
`Card.originRelativeUrl()`/`absoluteUrl()` interpolated a Promise — `board._id`
and `board.slug` were `undefined`, producing `/b/undefined/board/<cardId>` in
card activity notification emails (the client UI was unaffected because
`this.board()` is synchronous there). Fixed by making
`Card.originRelativeUrl(board)`/`absoluteUrl(board)` accept an already-resolved
board and fall back to `this.boardId` (always available synchronously) when the
board is a Promise, and by passing the awaited board from
`server/models/activities.js` so the correct board id and slug are used

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2802a850b57ef7ac183ddb581be666d14d43705">Release workflow: publish the Helm chart only after the Docker image is pushed</a>. Thanks to xet7.</summary>

** Release workflow: publish the Helm chart only after the Docker image is
pushed **: In `.github/workflows/release-all.yml` the `charts` job now depends
on the `docker` job (`needs: docker`) instead of running in parallel right after
`bump`. GitHub Actions runs a job only when all of its `needs` jobs succeed, so
the wekan/charts Helm chart is published only after the multi-arch image is live
on Docker Hub / Quay.io / GHCR (and is skipped if `docker` fails). This prevents
ArtifactHub from scanning a freshly published chart whose image tag does not
exist yet and emailing the maintainer about the missing Docker image

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45fb54794755663307ef89636e2822ef9c65428d">Fix thousands of unsolicited empty "Default" swimlanes created on some boards</a>. Thanks to brlin-tw and xet7.</summary>

** Fix thousands of unsolicited empty "Default" swimlanes created on some boards
**: `Board.getDefaultSwimline()`/`getDefaultSwimlineAsync()` self-heal a missing
default swimlane by reading the board's swimlanes and inserting one if none
exist. That check-then-insert is a race: concurrent or repeated server calls for
a swimlane-less board each saw zero swimlanes and each inserted a new one, so
some boards accumulated 30 000+ empty "Default" swimlanes and became unloadable
(the `key 'default (en)' returned an object instead of string` log is a harmless
i18n side effect — the title correctly falls back to the string `Default`).
Follow-up to the client-side [#6382](https://github.com/wekan/wekan/issues/6382)
fix, which only stopped the browser from auto-creating them. Fixed by making the
server self-heal **idempotent**: the default swimlane is now upserted with a
deterministic `_id` (`<boardId>-default`), so the `_id` unique index guarantees
at most one default swimlane per board no matter how many times, or how
concurrently, the getters run. `archived`/`type` are set explicitly in the
`$setOnInsert` because their schema autoValue/defaultValue only fire on insert,
not upsert. Note: this prevents new duplicates; boards that already accumulated
thousands still need a one-off cleanup

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2e7c4ede2a6429048882e68084bb286aedbc42a5">Reduce card flicker on drag by only writing changed fields on a card move</a>. Thanks to mimZD and xet7.</summary>

** Reduce card flicker on drag by only writing changed fields on a card move **:
`Card.move()` wrote `boardId`/`swimlaneId`/`listId` into the update
unconditionally, even for a same-board drag to another list (the reported case).
Keeping `boardId` in the `$set` on every drag re-ran the `boardId`-gated
`Cards.after.update` hook that re-syncs the card's checklists and checklist
items via `multi` updates, ran the cross-board consistency guard and the
`denyCrossBoardMove` deny-rule DB lookup, and invalidated more reactive
dependents than necessary — server work and reactivity churn that contributed to
a ~1s card flicker on large boards. `Card.move()` now writes **only the fields
that actually change** (via the pure `computeCardMoveModifier` helper) and skips
the write entirely when a card is dropped back in the same place, so a
same-board move no longer touches boardId or the cross-board hooks. The
`moveCard`/`moveCardBoard` activity generators already re-check `doc.X !==
oldX`, so trimming the modifier does not drop any activity. Note: this reduces
the drag-time work behind the flicker; the residual reactive re-render cost on
very large boards is a separate performance topic

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5596f05b7ee63a114d3479c34e930f0d9d5549c">Fix DEFAULT_AUTHENTICATION_METHOD env var ignored, and Admin Panel Layout save hanging</a>.</summary>

** Fix `DEFAULT_AUTHENTICATION_METHOD` env var ignored, and Admin Panel Layout
save hanging **: Two related problems with the default login authentication
method

</details>

  - **Env var ignored:** the stored setting was only ever seeded as `password`
    and `DEFAULT_AUTHENTICATION_METHOD` was never applied, so operators setting
    it (e.g. Kubernetes/Helm `DEFAULT_AUTHENTICATION_METHOD: ldap`) saw no
    effect. Startup now applies the env var authoritatively: it seeds the value
    on a fresh install and, on existing installs, keeps the stored
    `defaultAuthenticationMethod` in sync with the env var on every boot (the
    operator's env is the source of truth), so the method can be configured
    entirely by env without the Admin Panel. The value is normalized (trimmed +
    lower-cased), so `DEFAULT_AUTHENTICATION_METHOD=LDAP` works.
  - **Layout save hanging / not persisting:** the authentication-method
    `<select>` is populated by an async `Meteor.call`, so clicking **Admin Panel
    > Layout > Save** before it loaded sent an empty value for the **required**
    `defaultAuthenticationMethod` field, which silently failed validation — the
    save looked stuck and nothing changed. The save now falls back to the
    currently stored method when the select is empty, so a real value is never
    overwritten by `''`.
  Both paths share one pure helper (`resolveDefaultAuthenticationMethod`) that never resolves to an empty string.
  Thanks to joe-speedboat and xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/878a24f586d698307bc3af1e65c903147f87a59a">Fix #5808: linking a card to another linked card made both cards inaccessible</a>. Thanks to the reporter and xet7.</summary>

** Fix #5808: linking a card to another linked card made both cards inaccessible
**: The "Link to this card" target picker only excluded template cards, so an
existing **linked** card (or a card that already links back to the current
board) could be chosen as a link target. That builds a chain/cycle of `linkedId`
pointers, but the card helpers (`getTitle`/`getBoardTitle`/`getRealId`) resolve
`linkedId` only **one hop**, so such a card renders as an empty/broken pointer
and becomes effectively inaccessible (the reported freeze). As the reporter
suggested, the fix **prevents the configuration** rather than allowing it: only
a real card — not a linked card/linked board, not one of the linking board's own
cards, and not a card that links back to one of them — may now be a link target.
This is enforced both in the picker's query and re-checked at creation time (the
options can be stale), via the pure `isLinkableCardTarget` guard, mirroring the
existing #3328 parent/subtask cycle guard. Note: this stops new inaccessible
links; any already-created ones still need manual cleanup

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d00dc6056b241b0b3e383bb5b4e75ba10ed78f56">Fix the "Board not found" flicker (stale-while-revalidate for the client board cache)</a>.</summary>

** Fix the "Board not found" flicker (stale-while-revalidate for the client
board cache) **: While viewing a board, the board view could briefly flash the
**"Board not found"** shell — and on WebKit throw a Blaze `Can't select in
removed DomRange` error tearing down the card view. Root cause: the client board
cache (`imports/lib/dataCache.js`) re-fetches its value inside a reactive
computation, and when the board doc is momentarily absent from minimongo (a
subscription stops and restarts, so Meteor transiently removes the doc) the
re-fetch returns `undefined` and that empty value is surfaced immediately. It
self-recovers when the subscription re-delivers the doc, so it presents as a
flicker — reliably reproduced only on Firefox/WebKit, where the reactive-render
timing hits the window (Chromium did not, which is why it surfaced as
browser-specific Playwright failures in `14-voting-watchers` and
`24-feature-issues`). Fixed with an opt-in **stale-while-revalidate** mode on
`DataCache`, enabled only for `getBoard`: a transient miss over an
already-cached board keeps the last value and re-checks after a short delay,
surfacing an empty result only if the board is still gone then (a genuine
deletion / access loss). First-ever loads and caches that did not opt in are
unchanged. Core decision extracted to the pure `shouldDeferCacheMiss` helper
with unit tests

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.75 2026-07-05 WeKan ® release

This release fixes the following CRITICAL SECURITY ISSUE of
[ScannerBleed](https://wekan.fi/hall-of-fame/scannerbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a222c4477e68c76fd6a866954b535fba0a78d05">ScannerBleed</a>.</summary>

** ScannerBleed : shell injection (RCE) via a malicious upload filename in the
external antivirus scanner command path**
([GHSA-x3xm-pxrv-jg7p](https://github.com/wekan/wekan/security/advisories/GHSA-x3xm-pxrv-jg7p),
CWE-78 OS Command Injection). Same RCE class as
[AvatarBleed](https://wekan.fi/hall-of-fame/avatarbleed/) (CVE-2026-52891,
GHSA-35j7-h385-2q9g) and its follow-up regression (CVE-2026-53447 /
GHSA-qfqv-42qw-vvwh area), but in a code path that was **never** covered by
those fixes. In `models/fileValidation.js`, when an admin has configured an
external scanner (antivirus) command line with a `{file}` placeholder, the
uploaded file path was interpolated into the command and run through `asyncExec`
(`promisify(exec)`), which spawns `/bin/sh -c` and interprets **all** shell
metacharacters: ```js await asyncExec(externalCommandLine.replace("{file}", '"'
+ fileObj.path + '"')); ``` Wrapping the path in double quotes is not a shell
boundary — inside double quotes the shell still expands `$(...)`, backticks and
`\`, so a filename such as `` a`id`.png `` or `$(touch /tmp/pwn).png` escaped
the argument and executed as the Wekan server process. Any **authenticated**
user who can upload an attachment could trigger it, on servers that have an
external scanner configured. Unlike the sibling MIME-detection path
(`detectMimeFromFile`, which already uses `execFile` with no shell) and unlike
the AvatarBleed fix (which strips non-alphanumeric characters from the
filename), this scanner path had **zero** sanitization

</details>

  - **Fixed** by POSIX single-quote-escaping the interpolated file path via a
    new `shellQuote()` helper (wrap in single quotes, escape embedded `'` as
    `'\''`). Inside single quotes the shell interprets no metacharacters, so a
    malicious filename can no longer break out of the argument or inject
    commands, while the admin's arbitrary command line and the exact on-disk
    path are both preserved. CVSS:3.1 9.9 Critical
    (AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H).
  - Affected Wekan v9.06 and earlier through the current release; fixed at the
    upcoming WeKan release. Reported by **DavidCarliez**.
  Thanks to DavidCarliez and xet7!

Thanks to above GitHub users for their contributions and translators for their
translations.

# v9.74 2026-07-05 WeKan ® release

This release fixes the following CRITICAL SECURITY ISSUES of
[DnsBleed](https://wekan.fi/hall-of-fame/dnsbleed/) and
[ExcelBleed](https://wekan.fi/hall-of-fame/excelbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef845fe4a0adb82af436313310939cd48c0b1347">DnsBleed</a>.</summary>

** DnsBleed — SSRF filter bypass via DNS-resolving hostname in outgoing
webhooks**
([GHSA-66m2-4wfr-c45p](https://github.com/wekan/wekan/security/advisories/GHSA-66m2-4wfr-c45p),
CWE-918). Incomplete-fix follow-up to
[WebhookBleed](https://wekan.fi/hall-of-fame/webhookbleed/)
([GHSA-hc3x-hq3m-663q](https://github.com/wekan/wekan/security/advisories/GHSA-hc3x-hq3m-663q))
and [IntegrationBleed /
RebindBleed](https://wekan.fi/hall-of-fame/integrationbleed/). The synchronous
URL validator on outgoing-webhook (board **Integrations**) URLs in
`models/integrations.js` blocks private/loopback/link-local IPs by
regex-matching the URL **hostname string** and never resolves DNS. A public
hostname that resolves to a blocked address — e.g. `169-254-169-254.nip.io` →
`169.254.169.254` (cloud metadata), `127-0-0-1.nip.io` → `127.0.0.1`, or any
attacker-controlled domain with an A/AAAA record pointing at an internal IP —
passes that string blocklist. The report notes the underlying weakness: **string
matching is not an SSRF boundary** because it can't see the resolved IP

</details>

  - **The reported PoC was already blocked at delivery** by the earlier
    RebindBleed fix: outgoing webhooks are sent through `fetchSafe`
    (`server/lib/ssrfGuard.js`), which resolves the hostname, validates the
    resolved IP, pins the connection to it and blocks redirects — so
    `169-254-169-254.nip.io` is rejected before any request is made. The REST
    write paths (`POST`/`PUT /api/boards/:boardId/integrations`) were likewise
    already hardened in WebhookBleed to run the DNS-aware
    `validateAttachmentUrl()` at input time.
  - **This release completes the fix and removes the drift risk the advisory
    points at.** The delivery guard previously resolved only IPv4 A-records
    (`dns.resolve4`), leaving it blind to AAAA (an IPv6-only internal target was
    merely fail-closed, and legitimate IPv6 webhooks were unreachable) and
    keeping a *second, less-complete* private-range block-list that could drift
    out of sync with the input-time one. `fetchSafe` now resolves **both address
    families** via `dns.lookup({ all: true })` — the same resolver call the
    input validator uses — and validates every resolved IP through the single
    shared `isIpBlocked` block-list in `models/lib/attachmentUrlValidation.js`.
    The three previously-separate block-lists (schema regex, delivery guard,
    input validator) are now one source of truth, and the schema-level `url`
    validator is documented in code as a non-authoritative first-line UI check
    only.
  - Affected Wekan v8.36 and later (input-side string validator); the
    delivery-time SSRF boundary has been in place since v8.35/v8.36
    (IntegrationBleed) and v9.32 (WebhookBleed). Reported by **4n207**.
  Thanks to 4n207 and xet7!

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7bbd1a3fad5d868fd01d79b5908913e215698e8e">ExcelBleed</a>.</summary>

** ExcelBleed — broken access control in the Excel-export REST route lets any
authenticated user export any private board**
([GHSA-mwq8-ccpm-r533](https://github.com/wekan/wekan/security/advisories/GHSA-mwq8-ccpm-r533),
CWE-862 / CWE-639). Same un-awaited async-auth bug class as
[BFLABleed](https://wekan.fi/hall-of-fame/bflableed/) (48 REST endpoints,
v9.22), [CloneBleed](https://wekan.fi/hall-of-fame/clonebleed/) (un-awaited
`allowIsBoardMemberByCard`, v9.35) and
[TokenBleed](https://wekan.fi/hall-of-fame/tokenbleed/). `models/exportExcel.js`
called its access-control guard `exporterExcel.canExport(user)` **without
`await`**. Because `canExport` is `async`, it returns a Promise (always truthy),
so `if (exporterExcel.canExport(user) || impersonateDone)` was always true and
`exporterExcel.build(res)` ran regardless of the guard's real result — any
authenticated user could download the full contents of any board (card titles +
descriptions, lists, swimlanes, members, metadata) via `GET
/api/boards/:boardId/exportExcel`, including private boards they are not a
member of. The JSON export route (`/export`) was correctly awaited and returned
403 for the same non-member

</details>

  - **Fixed** by awaiting the guard — `if ((await exporterExcel.canExport(user))
    || impersonateDone)` — matching every other export route
    (`models/export.js`, `exportPDF.js`, `exportExcelCard.js`, `import.js`). The
    Excel-export route was the lone remaining un-awaited `canExport` call site.
  - Affected Wekan v9.57.0 (latest) and earlier; present at HEAD until this
    release. Reported by **sec-reex** (defensive research, responsible
    disclosure, read-only PoC).
  Thanks to sec-reex and xet7!

and adds the following updates:

- [Update to Meteor
  3.5](https://github.com/wekan/wekan/commit/df3f519e99a6cf96bf947c72e0639988dc044740).
  Thanks to Meteor developers.
- [Run all tests at parallel or
  sequential](https://github.com/wekan/wekan/commit/7d416cc7ccaf82876b052eeb621794f805e1e3d8).
  Thanks to xet7.
- [Run all tests at parallel or
  sequential](https://github.com/wekan/wekan/commit/7d416cc7ccaf82876b052eeb621794f805e1e3d8).
  Thanks to xet7.
- [Script to be
  executeable](https://github.com/wekan/wekan/commit/267bfc72295839a8b846889703ca4874ffe35eb2).
  Thanks to xet7.
- [Update vscode
  sandbox](https://github.com/wekan/wekan/commit/4533268418f5d081fb70537d6311d4a6c4c94db8).
  Thanks to xet7.
- [Each run all tests now has logs at
  ../log/YYYY-MM-DD_HH-MM-SS/](https://github.com/wekan/wekan/commit/236fdf93381aed72f277be8203a9cd9512bc2092).
  Thanks to xet7.

and fixed the following bugs:

- [Updated
  tests](https://github.com/wekan/wekan/commit/c997c12f88eb35834d4702e331fd65f753fa8260).
  Thanks to xet7.
- [Fix parallel
  tests](https://github.com/wekan/wekan/commit/36efd9c98871e4fa3f59a7d04981f542f7a32a04).
  Thanks to xet7.
- [Fix
  tests](https://github.com/wekan/wekan/commit/4eebdb4278190e4c4bfe5cbbf5cf13559d127a07).
  Thanks to xet7.
- [Board Settings / Card Settings / Checklist item count (0/0) on minicard.
  Default:
  Off](https://github.com/wekan/wekan/commit/bb440b0d7befa936e738a13267052d9a585b964a).
  Thanks to carl-unique and xet7.
- [Card Settings popup options combined to same lines, and added more
  options](https://github.com/wekan/wekan/commit/1e7de6d776571846be6c966d4583f4710b5e0b0d).
  Thanks to xet7.
- [Fix
  tests](https://github.com/wekan/wekan/commit/c48ecb1d88b3c2ba752c8f6ce7884743905d68fb).
  Thanks to xet7.
<details>
<summary><a href="https://github.com/wekan/wekan/commit/f5a4ece29431fc5e3f72986f089a2089e90599ae">Playwright E2E: fixed three cross-process-contention flakes in the parallel run</a>.</summary>

** Playwright E2E: fixed three cross-process-contention flakes in the parallel
run ** The Chromium / Firefox / WebKit browser jobs run as separate processes
against ONE shared server + DB, so specs that used fixed identifiers or global
cleanups raced each other:

</details>

  - `26-shared-templates.e2e.js` seeded a fixed email domain
    (`usera@acme-e2e.invalid`) in all three browsers, hitting `E11000 duplicate
    key` on the unique `emails.address` index. Now uses a unique-per-run token
    for the org / team / domain and template titles.
  - `38-impersonation.e2e.js` cleaned up with a global `deleteMany({ reason:
    'clickedImpersonate' })` that deleted another browser's in-flight audit
    record mid-poll. Scoped the cleanup to the test's own `adminId`.
  - `32-org-team-feature-toggles.e2e.js` exercises `setAllOrgsFeature` /
    `setAllTeamsFeature`, which do a global `updateMany({})` across every org /
    team, so two browsers clobbered each other's rows. These browser-agnostic
    server-method tests now run in a single project (Chromium); Firefox / WebKit
    skip them.
  Thanks to xet7.
- **[Server-side Mocha suite: fixed a startup crash and the 44 latent failures
  it had been
  hiding](https://github.com/wekan/wekan/commit/b9f9390d04d2d8aa27236132784ec448209f17ae).**
  - `imports/i18n/i18n.test.js` crashed the whole run at load: `chai` 6.x
    plugins (`sinon-chai`, `chai-as-promised`) are ESM-only, so
    `use(require('sinon-chai'))` handed `chai.use()` a module namespace instead
    of the plugin function ("fn is not a function"). Now imports the default
    export.
  - That unmasked a second load crash — `PositionHistory.helpers is not a
    function`: the `meteor test` entry (`server/lib/tests/index.js`) never ran
    the `.helpers` / `.attachSchema` shim that `server/main.js` bootstraps, so
    the first model to call `Collection.helpers({...})` threw. The shim is now
    imported first in the test entry.
  - With the suite finally running, 44 server tests failed because `meteor test`
    only loads what the specs import (not the app's `/server/imports`). The
    specs now import the files that register the methods / globals under test
    (`cards.vote` / `cards.pokerVote`, `api.attachment.*`, `cloneBoard`,
    `getBackgroundImageURL`, `applyListWidth`, `updateListSort`,
    `moveChecklist`, `userPositionHistory.*`, `archiveBoard`,
    `sendSMTPTestEmail`, and the `Attachments` global). Also fixed genuine test
    bugs: the `cards.vote` / `cards.pokerVote` specs were written synchronously
    against async methods; the header-login trust specs restored env vars with
    `process.env.X = undefined` (which stores the string `"undefined"` and
    shadowed the trusted-IP allowlist, making every trusted source read as
    untrusted); the DnsBleed decimal-loopback matcher assumed the integer host
    survived URL normalisation; and the dependencies-OpenAPI spec could not
    locate its source file from the built bundle. The two `cards.archive` /
    `cards.move` specs tested Meteor methods that do not exist (archive / move
    are Minimongo document helpers secured by `Cards.allow` / `Cards.deny`,
    already covered by the `cards security` tests) and were removed. Server-side
    Mocha is now 409 passing, 0 failing.
  Thanks to xet7.
- [Fix translations at Login and Register
  pages](https://github.com/wekan/wekan/commit/b46d9588c7dc2d718e108972c97cbccadedb9b5f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their
translations.
