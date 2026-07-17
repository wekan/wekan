# Design: Universal change History (view + restore) — the basis for Undo/Redo

Status: **Draft for approval** · Owner: xet7 · Related: card details view, Member settings,
`Activities`, `userPositionHistory`, `docs/Features/Undo/Undo.md`

This document specifies one unified **change-history** subsystem that records **every change a user
makes**, keeps it **append-only**, and lets changes be **restored**. It is surfaced from **many menus**, but every one is the **same table + restore** over the **same
store**, differing only by the **scope filter** it passes to `changeHistory.page`. A **History**
option is added to each of these menus (and the pattern generalises to any future entity menu — the
UI and method don't change, only the scope):

| Menu / location | View shows the history of… | Scope filter | Section |
| --- | --- | --- | --- |
| Card group menu (open card) | that **group** on that card, with a per-contributor avatar list | `{ cardId, group }` | 7 |
| Card menu (open card) | the **whole card** (all its groups) | `{ cardId }` | 7a |
| Member settings menu | that **user's** own changes | `{ userId }` | 7a |
| Board Settings | the whole **board** (all users/entities) | `{ boardId }` | 7a |
| Swimlane menu | that **swimlane** and its contents | `{ scope:'swimlane', scopeId }` | 7a |
| List menu | that **list** and its cards | `{ scope:'list', scopeId }` | 7a |
| *(future)* Checklist menu, Attachment menu, … | that entity | `{ entityType, entityId }` | 7a |

Scopes **nest**: a card's history ⊂ its list's ⊂ its swimlane's ⊂ the board's. Container scopes
(board/swimlane/list/card) therefore mean "this entity **and its descendants**" — implemented as an
OR over the relevant id columns (`boardId` / `swimlaneId` / `listId` / `cardId` / `entityId`), which
is why the write side (section 5) stores all the applicable id columns on every row.

Plus one keyboard front-end:

- **Undo / Redo** — `Ctrl+Z` / `Ctrl+Y` = "restore the current user's most recent change from this
  history" / "re-apply it". Undo/Redo is therefore **not a separate feature**; it is the keyboard
  restore of the newest own change. (v1 undo/redo of *position moves* already shipped in #6478 via
  `userPositionHistory`; this design **generalises** that to every change and merges the two.)

It is a design doc only — no code is implied as final until this is approved.

> **Scope change (this revision):** the earlier draft covered only card *groups*. Per request, the
> model now records **every change** (all card fields/groups **and** board/list/swimlane/etc.
> structural changes), per user, and adds the Member-settings per-user view. `userPositionHistory`
> becomes a special case that this unified store supersedes.

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
- Pure, unit-testable helpers (mirroring `models/lib/undoRedoSelection.js`): `paginate(rows, page,
  size)`, `matchesSearch(row, term)`, `selectionToIds(selected)` — in `models/lib/…` with tests.

## 7. UI

Templates (Blaze/jade), all inside one popup opened from the group menu's **History** item:

- `cardGroupHistoryPopup` — 2-pane layout.
  - Left: `historyNav` — a **History** button (default view = newest, all users) + a list of
    `+userAvatar` (fallback initials) from `contributors`. Selecting one sets the `userId` filter.
  - Right: `historyTable` —
    - top bar: `.js-history-search` (left) · pagination `.js-history-prev/next` + "page X / N"
      (middle) · `.js-history-restore` (right).
    - table: header row + one row per `rows[]`: `input[type=checkbox].js-history-select`,
      change-type label (`{{_ changeTypeKey}}`), content, `{{ formatWithCardDateFormat createdAt }}`.
- State: current `group`, `userId` filter, `search`, `page`, and a `Set` of selected row ids kept in
  a `ReactiveDict` on the template instance (not the data context — see #6479: don't stash state on
  Blaze data contexts).
- **RTL:** rely on `dir=rtl` + logical CSS (`margin-inline`, `text-align: start`, flex order) so the
  top bar and columns mirror without duplicated markup. Verify live.
- **Date format:** reuse the card's configured date format helper so the datetime column matches the
  rest of the card.

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
