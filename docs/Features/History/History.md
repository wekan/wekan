# Design: Per-group card History (view + restore)

Status: **Draft for approval** · Owner: xet7 · Related: card details view, `Activities`,
`userPositionHistory`

This document specifies the "History" feature requested for the card details view: each
*group* on an open card gets a **History** option that opens a large popup with a searchable,
paginated, per-contributor change log, and the ability to **restore** a previous change.

It is a design doc only — no code is implied as final until this is approved.

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

New Mongo collection **`cardGroupHistory`** (append-only). One document per change:

```js
{
  _id,
  boardId,          // for permission scoping + publications
  cardId,           // the card this change belongs to
  group,            // 'description' | 'labels' | 'members' | 'dates' | 'checklists' | ...
  entityId,         // optional finer id (e.g. checklist item id, comment id, label id)
  changeType,       // 'added' | 'removed' | 'edited' | 'moved' | 'restored'
  // Content for display + restore. Kept as structured values, not just strings.
  previousContent,  // blackbox; may be null for 'added'
  newContent,       // blackbox; may be null for 'removed'
  userId,           // who made the change (the "source contributor")
  createdAt,        // Date; formatted client-side with the card's date format
  // Restore provenance (set only when changeType === 'restored'):
  restoredFromId,   // the cardGroupHistory _id whose content was restored
  restoredByUserId, // === userId here; explicit for clarity
}
```

Notes:

- **Append-only.** No update/remove method is exposed to clients. Cleanup (retention cap, à la
  `userPositionHistory.cleanup`) is a server cron.
- `previousContent`/`newContent` are `blackbox` objects so each group can store what it needs
  (e.g. `{ text }` for description, `{ labelId }` for a label, `{ millis }` for a date).
- Alternative considered: **extend `Activities`** with `previousContent`/`newContent`. Rejected for
  v1 — `Activities` is deliberately schemaless/high-volume and drives notifications/webhooks;
  overloading it risks those paths. A dedicated collection keeps concerns separate and lets us cap
  retention independently.

## 5. Write side (recording changes)

Record on the **server**, in each group's mutation path, capturing the value **before** and
**after**. Concretely, a single helper:

```js
CardGroupHistory.record({ boardId, cardId, group, entityId, changeType, previousContent, newContent, userId });
```

called from the existing setters/methods (e.g. `Cards.setDescription`, label add/remove, date
setters, checklist/comment mutations). Best-effort (never fail the mutation if recording throws),
mirroring the `userPositionHistory` card-move wiring — **and** note the lesson from that code: the
helper **must be imported**, not referenced as an assumed global (the position-history guard
`typeof UserPositionHistory !== 'undefined'` silently disabled recording — fixed in #6478).

## 6. Read side (publications, pagination, search, per-user)

Only the current page is loaded. A method (not a naive reactive publication of the whole log)
returns a page:

```js
Meteor.call('cardGroupHistory.page', {
  cardId, group,
  userId,        // optional: filter to one contributor (avatar click)
  search,        // optional: matches changeType label + content text
  page, pageSize // 1-based page, server clamps pageSize
}) -> { rows, total, page, pageSize, contributors: [{ userId, count }] }
```

- **Permission:** caller must have board-visible access (reuse `requireBoardVisible`).
- **Search:** case-insensitive over the rendered change-type label and a text projection of
  `newContent`/`previousContent`. (Same cross-environment caveat as card search: numeric/text.)
- **contributors** powers the left-column avatar list (distinct `userId` + counts).
- Pure, unit-testable helpers (mirroring `undoRedoSelection`): `paginate(rows, page, size)`,
  `matchesSearch(row, term)`, `selectionToIds(selected)` — in `models/lib/…` with a
  `tests/*.test.cjs`.

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

1. **Model + write helper** for ONE group (Description) + pure paging/search/selection helpers +
   unit tests. Proves the end-to-end shape cheaply.
2. **Read method** (`cardGroupHistory.page`) + the **viewer UI** (table, search, pagination,
   avatars) for Description; LTR then RTL.
3. **Restore** for Description (single + multi-select) with dual re-logging.
4. **Roll out** to the remaining groups (labels, dates, members, checklists, subtasks, attachments,
   comments, custom fields), one group per PR, reusing the shared helper + UI.
5. **"History" menu item** wired into every group menu.

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
