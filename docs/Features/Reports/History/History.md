# Design: Universal change History (view + restore) — the basis for Undo/Redo

> **This page uses the shared [Table Page](../../../Features/Page/Table.md) design.**
> Layout, search, pagination, column spec, per-page data loading and RTL rules are
> defined there and are not repeated here. Below is only what is specific to
> History: its store, its scopes, and restore/undo.

Status: **Phase 1 implemented · phases 2-6 outstanding** · Owner: xet7 · Related: card details
view, Member settings, `Activities`, `userPositionHistory`, `docs/Features/Undo/Undo.md`

> **What is live.** Phases 1-3, 5 and 6 of §10, and the write half of 2.
>
> * **The store** — `models/changeHistory.js` (append-only, one row per change,
>   carrying every container id so a scope is a plain equality),
>   `models/lib/changeHistoryQuery.js` (scope / search / selection, pure) and
>   `models/lib/changeHistoryGroups.js` (which field belongs to which group, and
>   the content shape, pure).
> * **The write side** — `server/models/changeHistoryHooks.js`, the choke point
>   §5 asks for: an `after.update` diff per collection, plus insert/remove for
>   the sub-entities. It records card, list, swimlane, checklist, checklist-item
>   and comment changes across every group of §3, and because it is a collection
>   hook it also catches the REST API, the importers and the rules engine, none
>   of which go through the client setters. Moves and the list soft delete record
>   themselves, as one change each, rather than as several field edits.
> * **The read side and restore** — `server/models/changeHistory.js`:
>   `changeHistory.page`, `.restore` (dual re-logging, oldest-to-newest, one
>   batch), `.undoLast` and `.redoLast`.
> * **The UI** — ONE `historyTable` (§7a), with the contributor pane, search,
>   pagination, row selection, Restore and RTL. The card, list and swimlane
>   menus each open it with a different scope; that is one menu item and one
>   two-line handler each, as §7a promises.
> * `Ctrl+Z`/`Ctrl+Y` read this store, for any recorded change.
> * `changeHistory` is in the snap's `MERGE_COLLECTIONS` (§9a.4).
>
> Tests: `changeHistoryQuery`, `changeHistoryGroups`, `changeHistoryWiring`,
> `historyOneTemplate`, `undoRecordsWhatItClaims`.
>
> **What is NOT live.** The Member-settings and Board-settings entries of §7a —
> the table serves those scopes and is tested, but no menu item opens it there
> yet. The retention cron of §9. Restoring a REMOVED sub-entity re-creates
> nothing: the row stores the whole document, so it can be built, but §11 asks
> whether it should be and that is a product decision. Attachments and custom
> fields record their scalar changes only, not their files.
>
> **Verified how.** Everything above is covered by unit tests and source guards,
> and the whole of it has since been exercised against a running WeKan, which
> §10 asks for. What was actually done, in a browser: a card renamed through the
> UI recorded one row with the right group and both values; the card, list and
> swimlane menus each opened the table with their own scope reaching the template
> (`scope: 'swimlane'`, the swimlane's own id, and so on); selecting the row and
> pressing Restore put the title back and left exactly two rows — the edit and
> the restore; search narrowed the table and showed *no results* for a term
> nothing matched; clicking a contributor's avatar filtered to that person; and
> with 32 rows the footer read *1 / 2*, the second page held the remaining seven
> in sequence, and the *next* arrow disabled itself there.
>
> That pass found four faults, three of them fatal to the feature, and none of
> them visible in the source: the table rendered one row of empty cells because
> `{{#each row in rows}}` leaves the data context alone, so bare field names
> resolved against the outer one; the row's checkbox was 0×0 because WeKan hides
> every bare `input[type="checkbox"]` app-wide and draws its own; the panel was
> 380px wide, which left 201px for a four-column table; and a restore was
> recorded twice, once by the very `after.update` hook that §8.2 deliberately
> keeps running. Each now has a regression test.
>
> One design decision is worth keeping: the collection imports **no other model**.
> Its predecessor imported Cards, Lists and the rest so its `undo()` could write
> to them, which made it unimportable from those same files — the direct cause of
> the inert recording in the appendix. Applying a change lives in
> `server/models/changeHistory.js`, which nothing imports.

---

## 1. Goal (from the request)

On the card open-details view, each group menu gains an option **History**. Clicking it opens a
big popup:

- **Left column** (always visible):
  - Top: **History** entry — the current, newest history for that group.
  - Below: an **avatar** (or initials when there is no avatar) for **each user** who has added or
    changed something in that group. Clicking an avatar shows **all changes that user made to that
    group**, newest first.
- **Right area** (always the same table layout):
  - **Above the table** (LTR, left → right): **Search** (left), **pagination controls** (middle),
    **Restore** (right).
  - **Table columns** (LTR, left → right): **select checkbox** (per row), **what was changed**
    (translatable — added / removed / edited / …), **content of change** (e.g. the new text),
    **datetime** (formatted with the card's selected date format).
- Only the **current page** is loaded/rendered (server-side pagination).
- **RTL**: every element and the text order is mirrored (search right, pagination middle, restore
  left; columns reversed).
- **Restore**: restores the selected change to that group. The restore is itself recorded in
  history — on **both** the source contributor's history *and* the restorer's history (who restored
  what to become current). History is **append-only**: you can restore *from* it, but never edit it.

## 2. The core blocker (why this is more than a UI)

WeKan already logs actions in the **`Activities`** collection, but that collection records *what
happened* (an `activityType` plus references: `cardId`, `listId`, `memberId`, …) — **not the
before/after values**. Example: editing a description logs `activityType: 'changedDescription'`
with the card id, but **not the previous text**.

Consequences:

- The **viewer** (what changed, when, by whom) can largely be built from `Activities`.
- **Restore** generally **cannot** be built from `Activities`, because the previous content is not
  stored. Only `userPositionHistory` stores before/after (for positions).

Therefore the feature splits into two efforts:

1. A **content-versioning subsystem** that captures before/after content per group change (the large,
   invasive part; prerequisite for restore).
2. The **history viewer + restore UI**.

## 3. Groups and change types

"Group" maps to the sections of the card details view. Proposed coverage (phase order later):

| Group | Entity / field | Change types |
| --- | --- | --- |
| Description | `cards.description` | edited |
| Title | `cards.title` | edited |
| Labels | `cards.labelIds[]` | added, removed |
| Members / Assignees | `cards.members[]`, `cards.assignees[]` | added, removed |
| Dates | received/start/due/end | added, edited, removed |
| Checklists | checklist + items | added, removed, edited, checked/unchecked, moved |
| Subtasks | linked subtask cards | added, removed, moved |
| Attachments | files/avatars | added, removed, renamed |
| Comments | `card_comments` | added, edited, removed |
| Custom fields | `cards.customFields[]` | edited |

Change types are a small closed set with i18n keys, e.g. `history-change-added`,
`history-change-removed`, `history-change-edited`, `history-change-moved`,
`history-change-restored`. Added to `imports/i18n/data/en.i18n.json` only (translations follow via
Transifex; see the translation-pull auto-heal note in the changelog).

## 4. Data model

One new append-only Mongo collection **`changeHistory`** (working name) covering **every** change,
whatever the entity. One document per change:

```js
{
  _id,
  boardId,          // for permission scoping + publications (null for non-board changes, if any)
  // What was changed — general, not card-only:
  entityType,       // 'card' | 'list' | 'swimlane' | 'board' | 'checklist' | 'checklistItem'
                    //   | 'comment' | 'attachment' | 'customField' | ...
  entityId,         // the changed entity's _id
  cardId,           // set when the change belongs to a card (drives the card-group view); optional
  group,            // logical group for the card view: 'description' | 'labels' | 'members'
                    //   | 'dates' | 'checklists' | 'title' | ...  (optional for non-card changes)
  changeType,       // 'added' | 'removed' | 'edited' | 'moved' | 'restored'
  // Content for display + restore — structured, not just strings:
  previousContent,  // blackbox; null for 'added'
  newContent,       // blackbox; null for 'removed'
  userId,           // WHO made the change — the axis the Member-settings view filters on
  createdAt,        // Date; formatted client-side with the viewer's/card's date format
  // Undo/redo stack (folds in #6478's userPositionHistory fields):
  undone,           // Boolean — restored/undone, redoable until superseded
  undoneAt,         // Date — orders the redo stack
  batchId,          // groups a multi-entity change (e.g. multi-select move / multi-restore)
  // Restore provenance (set only when changeType === 'restored'):
  restoredFromId,   // the changeHistory _id whose content was restored
  restoredByUserId, // who performed the restore
}
```

Notes:

- **Append-only.** No client-exposed update/remove (except the internal `undone`/`undoneAt` flip for
  the undo/redo stack). Retention cap via a server cron (à la `userPositionHistory.cleanup`).
- `previousContent`/`newContent` are `blackbox` so each entity/group stores what it needs
  (`{ text }` for description, `{ labelId }` for a label, `{ millis }` for a date, `{ sort,
  swimlaneId, listId, boardId }` for a move, …).
- **Supersedes `userPositionHistory`.** That collection's move rows map 1:1 onto this schema
  (`entityType` card/list/swimlane, `changeType: 'moved'`, previous/new = the position). Migration:
  keep `userPositionHistory` writing during transition, or one-time copy its rows in; the undo/redo
  methods move to read `changeHistory`.
- Alternative considered: **extend `Activities`** with before/after content. Rejected for v1 —
  `Activities` is deliberately schemaless/high-volume and drives notifications/webhooks; overloading
  it risks those paths. A dedicated collection keeps concerns separate and independently cappable.

## 5. Write side (recording every change)

Record on the **server**, in **every** mutation path (not only card groups), capturing the value
**before** and **after**. A single helper:

```js
ChangeHistory.record({ boardId, entityType, entityId, cardId?, group?, changeType, previousContent, newContent, userId, batchId? });
```

called from the existing setters/methods — card fields (`Cards.setDescription`, title, label
add/remove, member/assignee add/remove, date setters, custom fields), card sub-entities
(checklist/checklist-item, comment, attachment mutations), and **structural** changes (list/swimlane
create/rename/move/archive, board-level changes). Position **moves** come in via the same helper
(replacing `userPositionHistory.trackChange`).

- **Best-effort:** never fail the mutation if recording throws (try/catch).
- **Import the collection** — do not reference it as an assumed global. The shipped position history
  was inert precisely because its guard `typeof UserPositionHistory !== 'undefined'` was false
  without an import (fixed in #6478). This is the single most important implementation lesson.
- Consider a thin, central choke point: many mutations already emit an `Activity`; recording history
  next to `Activities.insert` (with the extra before/after content) avoids sprinkling calls
  everywhere. Evaluate during phase 1.

## 6. Read side (one paginated/searchable method for all three views)

Only the current page is loaded. One method (not a naive reactive publication of the whole log)
serves the card-group view, the per-user Member-settings view, and any filter combination:

```js
Meteor.call('changeHistory.page', {
  // scope (any subset; container scopes match the entity AND its descendants):
  scope,          // 'board' | 'swimlane' | 'list' | 'card' — the container kind
  scopeId,        // that container's _id (boardId / swimlaneId / listId / cardId)
  group,          // narrow a card scope to one group (card-group view)
  userId,         // one contributor — Member view, or an avatar click within another scope
  // list controls:
  search,         // matches changeType label + content text
  page, pageSize, // 1-based page, server clamps pageSize
}) -> { rows, total, page, pageSize, contributors: [{ userId, count }] }
```

The server turns `{scope, scopeId}` into the id-column filter (`board`→`boardId`; `swimlane`→
`swimlaneId` OR its lists'/cards' rows; `list`→`listId` OR its cards'; `card`→`cardId`), then applies
`userId`/`group`/`search` on top. Member-settings view passes just `{ userId }` (optionally
`+ scope:'board'` to limit to the current board).

- **Permission:** caller must have board-visible access to the scoped board(s) (reuse
  `requireBoardVisible`). The Member-settings view is scoped to boards the **caller** can see; it
  never leaks a user's changes on boards the caller can't access.
- **Search:** case-insensitive over the rendered change-type label and a text projection of
  `newContent`/`previousContent` (same cross-environment numeric/text caveat as card search).
- **contributors** powers the card view's left-column avatar list (distinct `userId` + counts);
  unused when the view is already pinned to one `userId`.
- Paging uses the shared `pageInfo()` from `models/lib/tablePage.js` (see
  [Table Page](../../../Features/Page/Table.md)) — do not add a second paginator. The History-specific
  pure helpers are `matchesSearch(row, term)` and `selectionToIds(selected)`, in `models/lib/…`
  with tests, mirroring `models/lib/undoRedoSelection.js`.

## 7. UI

A [table page](../../../Features/Page/Table.md) inside one popup opened from the group menu's
**History** item. Only the History-specific parts are listed here:

- **Left pane** (`historyNav`) — a **History** button (default view = newest, all users) plus a
  list of `+userAvatar` (fallback initials) built from `contributors`. Selecting one sets the
  `userId` filter. This pane is unique to History; no other table page has one.
- **Columns** — a row-select checkbox, the change-type label (`{{_ changeTypeKey}}`), the content,
  and the datetime.
- **Extra control** — **Restore** (`.js-history-restore`) next to the shared search and
  pagination, acting on the checked rows (section 8).
- **State** — current `group`, `userId` filter, `search`, `page` and the `Set` of selected row ids
  live in a `ReactiveDict` on the template instance, **not** on the Blaze data context (#6479).

## 7a. Scoped views (card / member / board / swimlane / list / …)

Every non-card-group surface in the table above is **the same `historyTable`** with a different
`changeHistory.page` scope; there is **one** implementation, parametrised by scope. They share the
columns, search, pagination, RTL, and restore (+ dual re-logging) of section 7/8.

- **Contributor avatars** (left column) appear whenever the scope can span more than one user —
  card, board, swimlane, list. They are omitted for the Member view (already one user). Clicking an
  avatar adds `{ userId }` to the current scope (that user's changes **within** this scope).
- **Permission** per scope, reusing existing guards:
  - card / swimlane / list → board-visible (write access to restore);
  - board (Board Settings) → board **admin**;
  - member (Member settings) → the user themselves, or an admin over boards the admin can see. A
    Member view **never** leaks changes on boards the caller can't access.
- **Nesting** (see the table note): container scopes match the entity **and its descendants** via an
  OR over id columns, so a swimlane's view includes its lists'/cards' changes, etc.

Concretely, adding "History" to a new menu = (1) a menu item that opens `historyPopup` with a scope,
(2) — nothing else. No new method, table, or restore code.

## 7c. Undo / Redo = restore the last own change

`Ctrl+Z` / `Ctrl+Y` are the keyboard front-end to this history for the **current user on the current
board**:

- **Undo** = restore the caller's **most recent, not-yet-undone** `changeHistory` row (mark it
  `undone`), for **any** `entityType`/`changeType` — not just moves.
- **Redo** = re-apply the caller's **most-recently-undone** row.
- A **new change clears the redo stack** (delete/flag this user+board's `undone` rows).

This **generalises** the shipped #6478 methods: `userPositionHistory.undoLast/redoLast` become
`changeHistory.undoLast/redoLast` reading the unified store; the selection rule stays the pure,
tested `pickUndo`/`pickRedo`; the key bindings in `client/lib/keyboard.js` are unchanged. "Restore
selected row" (History UI) and "undo last" (keyboard) are the **same operation** on the same data.

> Undo restores content via the **same setters** as a normal edit (so validation/Activities run),
> and the restore is itself appended to history (see section 8) — so undo is auditable and itself
> undoable/redoable.

## 8. Restore

`Meteor.call('cardGroupHistory.restore', historyId)`:

1. Load the target history row; require board write access.
2. Apply `previousContent` (or `newContent`, per the row's semantics) back to the live group via the
   **same setters** used for normal edits (so validation/activities still run).
3. Append **two** `cardGroupHistory` rows with `changeType: 'restored'` and `restoredFromId`:
   - one attributed to the **source contributor** (`userId` of the restored row) — "their" data was
     restored,
   - one attributed to the **restorer** (`Meteor.userId()`) — who restored what to become current.
4. Restore of **multiple selected** rows applies in a defined order (oldest→newest of the selection)
   and is a single logical batch (shared `batchId`).
5. History rows themselves are **never edited or deleted** by restore.

Per-change-type restore functions live next to each group's setter (description/labels/dates/…), so
each knows how to re-apply its own `previousContent`.

## 9. Security & integrity

- All read/restore methods gate on board access (`requireBoardVisible` / write access), like
  `updateListSort` and `userPositionHistory.*`.
- No client-exposed update/delete on `cardGroupHistory` (append-only invariant).
- Retention cap per card/board via a server cron (reuse the `userPositionHistory.cleanup` pattern).

## 9a. Append-only is what makes two copies of a database mergeable

This section is here because the snap now depends on it (#6583, #6585). It is a
consequence of section 9's invariant, not a new rule.

**The situation.** A WeKan snap can end up holding TWO copies of its data that
have both been written to since they were copies of each other: the MongoDB to
FerretDB migration is a snapshot and nothing keeps it in step, `snap revert` does
not roll back `$SNAP_COMMON`, and both databases can be written to
back and forth. Which copy gets served then decides what a user sees, and getting
it wrong looks exactly like data loss — that is what both of those issues were.

**Why history decides it.** File timestamps cannot answer "which copy holds the
work": an mtime says when a file was touched, and merely starting a database
touches its files. The DATA can answer it, and history is the part of the data
that answers it best — every change a user makes writes a row, so the newest
history row is the newest moment somebody was actually working, on either side.
`snap-src/bin/db-eval.mjs evidence` reads exactly that (per-collection counts plus
the newest timestamp any document carries) and `snap-src/bin/database-choose.mjs`
compares the two.

**Why the other copy is not lost.** Because history is APPEND-ONLY — never
rewritten in place, never updated, only added to — rows from one copy can be
inserted into the other without contradicting anything already there. So the snap
serves the copy holding the newer work and copies into it every document whose
`_id` is ABSENT from it (`snap-src/bin/database-merge-missing.mjs`):

- nothing that exists in the served copy is overwritten, so the newer version of
  a card that was edited on both sides stands;
- nothing is deleted, on either side, and the copy that was not chosen stays on
  disk — switching back is still one `snap set` away;
- the activities, comments and (once this design ships) `changeHistory` rows
  written on the other copy become part of the served copy's history, so the work
  done there is READABLE IN THE CARD'S HISTORY rather than stranded in a database
  nobody opens.

**What is deliberately not attempted.** Reconciling two edits of the same field —
a three-way merge — is a decision about somebody's work and is not made by a
script. When the two copies cannot be told apart (their newest moments are within
hours of each other, or neither carries a timestamp), the snap changes nothing and
says so, which is the behaviour #6583 arrived at the hard way.

**What this design owes the snap**, when it ships:

1. Every `changeHistory` row keeps a stable, content-derived or random `_id` that
   is never reused, so "absent by `_id`" is a safe test for "this row is not here".
2. Rows stay immutable after insert (section 9 already requires this); a row that
   could be updated in place would make two copies of it disagree, and the merge
   would then have to choose between them.
3. The retention cron prunes by age, not by rewriting rows, so a pruned copy and a
   full copy merge to the full one rather than to a contradiction.
4. `changeHistory` is listed in the merge's collection list
   (`MERGE_COLLECTIONS` in `snap-src/bin/database-choose.mjs`) the moment the
   collection exists — the list is the only place the snap learns which
   collections carry history.

## 10. Phasing (each phase verified live before the next)

1. **`changeHistory` model + write helper + pure helpers (paging/search/selection/pick undo-redo) +
   unit tests.** Migrate the shipped position undo/redo onto it: point
   `changeHistory.undoLast/redoLast` at the new store and record card/list/swimlane **moves** there
   (this both proves the model and keeps #6478 working). Ctrl+Z/Ctrl+Y now read `changeHistory`.
2. **First content group — Description:** record before/after on edit; **read method**
   (`changeHistory.page`) + the **viewer UI** (table, search, pagination, avatars); LTR then RTL.
   Ctrl+Z now also undoes a description edit.
3. **Restore** UI for Description (single + multi-select) with dual re-logging (identical to the
   keyboard undo path).
4. **Member-settings "History"** (per-user) and **Board-settings "History"** (per-board) views —
   both are just the same `changeHistory.page` method + `historyTable` UI with a different scope
   (`{ userId }` vs `{ boardId }`), so they land together once step 3's table/restore exist.
5. **Roll out** to every remaining group/entity (title, labels, dates, members/assignees, checklists,
   subtasks, attachments, comments, custom fields, board/swimlane structural changes), one per PR,
   reusing the shared write helper + `page` method + UI.
6. **"History" menu item** wired into every card group menu (and the Member-settings menu from
   step 4).

## 11. Open questions (need product decisions)

- Scope of "content of change" for non-text groups (label = its name/color? member = avatar+name?
  attachment = filename?). Proposal above; confirm.
- Retention: how many history rows per card/board before pruning?
- Does history need to survive card **archive/restore** and **copy/move** across boards?
- Should restore of a **removed** entity re-create it (attachments, comments) or only text/scalar
  fields in v1?
- Per-board on/off setting for history (storage cost)?

---

### Appendix: lessons already banked from this session

- **Import your collection helpers.** `userPositionHistory` recording was dead because
  `trackChange` was guarded by `typeof … !== 'undefined'` without importing the collection (fixed in
  #6478). The new history helper must be a real import.
- **Don't stash state on Blaze data contexts.** #6479 showed a re-render drops ad-hoc fields; keep
  popup/table state on the template instance / `ReactiveDict`.
- **Pagination/search/selection as pure functions** (à la `models/lib/undoRedoSelection.js`) so the
  logic is unit-testable without the Meteor/Blaze runtime.
