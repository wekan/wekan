# Feature: Undo / Redo (position moves) + high-impact confirmation

Status: **Implemented (v1)** in #6478 · Owner: xet7 · Related: `userPositionHistory`,
card/list/swimlane drag-and-drop, `docs/Features/Reports/History/History.md`

This documents the undo/redo feature **shipped in v1** for #6478 ("UI: Confirmation for actions with
impact") — which covers **position moves** (card / list / swimlane) only.

> **Direction (approved design):** undo/redo is being folded into one **universal change-history**
> subsystem that records **every** change and exposes it as History views on card groups, the whole
> card, Member settings, Board Settings, swimlane/list menus, etc. In that model, **Undo/Redo is not
> a separate feature** — `Ctrl+Z`/`Ctrl+Y` simply restore the current user's most recent change from
> that history, for **any** change type, and `userPositionHistory` is superseded by the unified
> `changeHistory` store. The single source of truth for that direction is
> **`docs/Features/Reports/History/History.md`**; this doc describes the current v1 (positions) and the
> migration path. See History.md §7c (Undo/Redo) and §10 (phasing: position undo/redo migrates onto
> `changeHistory` first).

---

## 1. Motivation

A user accidentally dragged a **list** into another swimlane on mobile, merging it with an existing
list, and spent ~15 minutes recovering — there was **no confirmation** and **no undo**. This feature
adds both for the move operations, using the already-present (but previously **inert**) position
history.

## 2. What ships in v1

- **Undo** with `Ctrl+Z` (`⌘Z`) and **Redo** with `Ctrl+Y` / `Ctrl+Shift+Z` (`⌘⇧Z`) for the last
  **position change** on the current board: moving a **card**, **list**, or **swimlane**.
- A **confirmation** prompt before moving a **list to a different swimlane** on **touch / small
  screens** (the exact, card-re-homing accident). Declining reverts the drag. Everyday same-swimlane
  reordering is unaffected.

## 3. Data model — `userPositionHistory`

Pre-existing collection (`models/userPositionHistory.js`), one document per position change:

```
userId, boardId, entityType ('card'|'list'|'swimlane'|'checklist'|'checklistItem'),
entityId, actionType ('move'|'create'|'delete'|'restore'|'archive'),
previousState / newState (blackbox) + flattened previous*/new* (Sort, SwimlaneId, ListId, BoardId),
createdAt, isCheckpoint, checkpointName, batchId,
undone (Boolean), undoneAt (Date)      // <- added in #6478 for the redo stack
```

Helper methods on a document:

- `canUndo()` — the entity still exists.
- `undo()` — restore the **previous** position (per entityType).
- `redo()` — **added in #6478**: re-apply the **new** position (mirror of `undo()`).

## 4. The bug that made undo inert (fixed in #6478)

`UserPositionHistory.trackChange(...)` is server-only, but callers referenced it as an **assumed
global** guarded by `typeof UserPositionHistory !== 'undefined'`. It is an ES-module default export,
**not** a global, so the guard was **false** and **nothing was ever recorded** — undo silently did
nothing. Fix: **import the collection** where `trackChange` is called.

> Lesson (also in the History doc): import your collection helpers; never gate on an assumed global.

## 5. Recording changes (write side)

`trackChange({ userId, boardId, entityType, entityId, actionType, previousState, newState })` inserts
a history row. Wired at:

- **Card moves** — `models/cards.js` (`Card.move`), already present (now actually runs).
- **List moves** — `server/models/lists.js` `updateListSort` (**added in #6478**; imports the
  collection). Captures `{ sort, swimlaneId, boardId }` before the update.
- **Swimlane moves** — the model supports `entityType: 'swimlane'`; wire the swimlane reorder path
  the same way when needed (follow-up).

Recording is **best-effort**: a failure to record never fails the move (wrapped in try/catch).

## 6. Undo / redo stack semantics

The undo stack is the board's real (non-checkpoint) changes in `createdAt` order; the redo stack is
the changes that have been undone.

- **Undo** picks the **most recent not-yet-undone** change, calls `undo()`, sets
  `undone: true, undoneAt: now`.
- **Redo** picks the **most-recently-undone** change (largest `undoneAt`), calls `redo()`, clears
  `undone`.
- **A new real change clears the redo stack** — `trackChange` deletes this user+board's `undone`
  rows, so an undone-then-superseded change can never be redone into stale state.

Server methods (`server/models/userPositionHistory.js`):

- `userPositionHistory.undoLast(boardId)` → `{ undone, entityType, entityId }`
- `userPositionHistory.redoLast(boardId)` → `{ redone, entityType, entityId }`

Both gate on `requireBoardVisible`. The selection rule is a **pure, unit-tested** helper
`models/lib/undoRedoSelection.js` (`pickUndo` / `pickRedo`, tests in
`tests/undoRedoSelection.test.cjs`); the server applies the same rule via Mongo `sort`/`limit`.

## 7. Client bindings

`client/lib/keyboard.js` binds `ctrl+z, command+z` → `undoLast` and
`ctrl+y, ctrl+shift+z, command+shift+z` → `redoLast`, calling the method for
`Session.get('currentBoard')`, only when `Utils.canModifyBoard()`. The global hotkeys **filter**
already disables shortcuts inside inputs / textareas / contentEditable, so **native text undo/redo
keeps working** while typing.

## 8. High-impact confirmation

In `client/components/swimlanes/swimlanes.js` `saveSorting` (the list-drop handler): when the drop
is a move to a **different** swimlane (`isDifferentSwimlane`) **and** the viewport is touch/small
(`Utils.isMiniScreen() || Utils.isTouchScreenOrShowDesktopDragHandles()`), a `window.confirm`
(i18n `confirm-move-list-to-swimlane`) is shown; declining re-subscribes to the board (reverting the
drag) and aborts before any card re-homing. This complements undo (belt-and-suspenders for the
riskiest, hardest-to-notice action).

> Interaction with #6484: board-wide lists (`swimlaneId === null`) are no longer *accidentally*
> bound to a swimlane on a nudge, so this confirm only fires for genuinely swimlane-scoped list moves
> across swimlanes.

## 9. Retention

`userPositionHistory.cleanup` (server cron) caps history per user/board (keeps ~1000 newest
non-checkpoint rows). Toggle via `Meteor.settings.public.enableHistoryCleanup`.

## 10. Limitations / not in v1

- Undo/redo covers **position moves only** — not text edits, labels, members, dates, etc. Those need
  before/after content versioning (see `docs/Features/Reports/History/History.md`).
- No on-screen Undo/Redo **buttons** yet (keyboard only) — a board-header control + a post-move
  "Undo" toast are natural follow-ups.
- Swimlane-move recording is modelled but the reorder path is not yet wired.
- Cross-user concurrency: undo restores the previous stored position; if another user moved the same
  entity meanwhile, the restore uses this history row's previous values (last-writer-wins, as
  elsewhere in WeKan).

## 11. Tests

- `tests/undoRedoSelection.test.cjs` — pure `pickUndo`/`pickRedo` incl. LIFO symmetry, checkpoint
  and already-undone skipping, and the redo-by-`undoneAt` order.
- Runtime paths (keyboard, Meteor methods, Blaze) require a live app to verify.

## 12. Extension checklist (adding a new undoable move)

1. In the mutation path, capture `previousState` **before** the write and call
   `UserPositionHistory.trackChange({ … })` **after** — importing the collection, wrapped in
   try/catch.
2. Ensure `undo()`/`redo()` and `canUndo()` handle the `entityType` (add a `case` if new).
3. Nothing else — `undoLast`/`redoLast`, the redo-stack clearing, and the key bindings are generic.

---

# Soft delete (delete = mark, never destroy)

Status: **Lists implemented (v1) · rest design** · Owner: xet7 · Related: #1023 ("undo button for
deleted lists etc"), History.md, the `archived` flag, `userPositionHistory`
(`actionType: 'delete'|'restore'`)

> **Implemented so far (v1):** deleting a **list** is now a soft delete — the list and its cards are
> marked (`deletedAt`/`deletedBy`/`deleteBatchId`), hidden from the board, recorded as a reversible
> `delete` in history, and restorable via `lists.restore` **or** undone with `Ctrl+Z`. This delivers
> **#1023** for lists. Core pieces that are live: `models/lib/softDelete.js` (pure helpers +
> `tests/softDelete.test.cjs`), the `enablePermanentDelete` feature flag + `Settings` field, the
> `deletedAt/deletedBy/deleteBatchId` schema fields on Lists & Cards, `deletedAt: null` filtering on
> the board/swimlane list render paths, the `lists.softRemove` / `lists.restore` / `lists.purge`
> methods (purge gated by `canPurge`), the client + REST delete paths, and `undo()/redo()` handling
> of `delete`/`restore`. **Still design:** extending the same pattern to swimlanes/boards/cards/
> checklists/comments/attachments, the Recycle Bin UI, and the Admin Panel / Features / Delete table
> (§16b–§16c).

> **Principle:** *Every* user-facing delete is a **soft delete** — it **marks** the document deleted
> instead of removing it. There is **no permanent delete in ordinary use**. Physical removal exists
> only behind **one narrow, guarded purge path** (below). This is the foundation that makes
> **undoing a deletion** possible (#1023): if nothing is destroyed, anything can be restored.

## 13. Why this exists / relation to undo & history

Undo v1 (§1–§12) restores **positions**. It cannot bring back a **deleted** list/card/swimlane
because the delete path physically `removeAsync`-es the rows — there is nothing left to restore. Soft
delete closes that gap: a delete becomes a reversible state change, so:

- **Undo of a delete** = clear the deleted mark (exactly like `undo()` clears a move), satisfying
  **#1023**.
- **History** (History.md) records the `delete` and `restore` events like any other change; the
  `userPositionHistory` schema **already** allows `actionType: 'delete'|'restore'|'archive'`.
- A **Recycle Bin** view can list soft-deleted items per board/user for explicit restore, independent
  of the keyboard undo stack.

## 14. `archived` vs `deleted` — two distinct states

WeKan already has **archive** (`archived: true` + `archivedAt`) as a *user-visible, first-class*
"put it aside" state with its own UI (the Archive). **Soft delete is a separate, deeper state** —
"the user asked to delete this":

| State        | Field(s)                    | Visible where                | Meaning                          |
|--------------|-----------------------------|------------------------------|----------------------------------|
| Active       | `deletedAt: null`           | Board                        | Normal                           |
| Archived     | `archived: true`            | Archive view                 | Set aside, still "kept"          |
| Soft-deleted | `deletedAt`, `deletedBy`    | Recycle Bin only             | Deleted, awaiting restore/purge  |

Do **not** overload `archived` for delete — they have different UIs, different retention, and an item
can be archived *and* then deleted. New fields on every soft-deletable collection:

```
deletedAt   (Date, default null)     // null = live; set = soft-deleted
deletedBy   (String userId, optional)
deleteBatchId (String, optional)     // groups a cascade (list + its cards) into one restorable unit
```

## 15. Scope — what gets soft delete, what is exempt

**Soft-deletable (user content):** Boards, Swimlanes, Lists, Cards (incl. subtasks), Checklists,
ChecklistItems, CardComments, Attachments, Rules/Triggers/Actions, Labels, CustomFields,
Integrations, plus board-scoped settings the user can delete.

**Exempt (transient / infrastructure — hard delete stays):** `SessionData`, the `CronJob*`
collections, `TrelloImportJobs`, `InvitationCodes`, `UserPositionHistory`/`changeHistory` retention
cron, and *cascade bookkeeping* like `Activities` cleanup. These are not user content; soft-deleting
them would only bloat storage with no restore value. `log()`-style note: exemptions are **explicit**,
not accidental — each exempt `removeAsync` should carry a short `// hard-delete OK: transient` comment
so the audit is greppable.

## 16. The one narrow purge path (the only permanent delete)

Physical `removeAsync` of user content is allowed from **exactly two** places, both guarded and
audited:

1. **GDPR / account erasure** — deleting a user (`Users` erasure) may hard-delete or **anonymize**
   that user's personal data. Legally required; cannot be soft-only, so it is **not** gated by the
   toggle below.
2. **Explicit Global-Admin "Permanently delete"** — an admin action on a soft-deleted item (or
   "empty Recycle Bin") that consciously destroys it, **gated by an Admin Panel setting** (below).

### 16a. Admin Panel / Features / Delete → "Enable permanent delete for Global Admin"

Permanent delete of user content is **off by default**. A new toggle lives at **Admin Panel /
Features / Delete**:

```
Admin Panel
  └─ Features
       └─ Delete
            [ ] Enable permanent delete for Global Admin
                (When off, nothing can be physically deleted from the Recycle Bin —
                 all deletes stay soft/restorable. GDPR account erasure is unaffected.)
```

- Stored as a feature flag alongside the existing ones (`models/lib/featureFlags.js` /
  `getFeatureFlags`, the same mechanism the activities publication reads), e.g.
  `enablePermanentDelete` on `Settings`.
- **Only a Global Admin** sees the "Permanently delete" / "Empty Recycle Bin" actions, and **only
  when the flag is on**. Board admins never get it. Both the client (hide the action) and the server
  (the `purge()` method re-checks `Meteor.user().isAdmin` **and** the flag) enforce it — client
  hiding alone is not a guard.
- The physical-delete helper (`purge()`) is the *only* code allowed to call `removeAsync` on user
  content; it hard-fails unless `isAdmin && enablePermanentDelete`, and logs an audit `Activity`
  (`activityType: 'permanentDelete'`).

### 16b. The Delete panel is a History-style category table

**Admin Panel / Features / Delete** is not just the toggle — it renders a **History-design table**
(same layout as History.md: paginated, searchable, actor avatar, timestamp, RTL-aware) that lists
**everything currently soft-deleted, grouped by category**. It works whether or not permanent delete
is enabled:

- **Flag off:** the table is **read-only insight** — the admin can see what has been deleted (and how
  much storage it holds) and could **Restore**, but the "Permanently delete" / "Empty" actions are
  hidden/disabled.
- **Flag on:** each row and each category header gains a **checkbox**; the Global Admin **selects
  what to delete permanently** and confirms. Selection is per-row or whole-category ("select all in
  *Cards*").

Columns: category · title/description · board · deleted by (avatar) · deleted at · size · actions
(Restore / Permanently delete). A server method `softDelete.listDeleted(category, boardId, page)`
feeds it with the same pagination discipline as the activities feed (#2539) — only the visible page
is loaded, so a huge trash never slows the panel.

### 16c. GDPR categories — what a Global Admin may permanently delete, and what each purge must include

The category table is organized around the data classes GDPR erasure and data-minimization actually
require an operator to be able to remove. **Permanently deleting a category deletes the whole object
graph below it** — a purge that leaves orphaned children behind is a data leak, so each category
lists what *must* be included:

| Category | What it is | A permanent delete MUST also remove |
|----------|------------|-------------------------------------|
| **User account (PII)** | A person's identity: profile (name, email, avatar), login/OAuth/LDAP identifiers, sessions, API tokens, notification/subscription rows | Their avatar blob; memberships stripped from every board; **authored content anonymized or reassigned** (comments/activities → "Deleted user") per the board owner's choice; personal settings, invitation codes, password-reset tokens |
| **Boards** | A whole board | Its swimlanes, lists, cards (+ subtasks), checklists & items, card comments, labels, custom-field *values*, rules/triggers/actions, activities, and **all attachments' physical blobs** (S3/GridFS), board background images |
| **Swimlanes / Lists** | A column or row | Their cards and everything under those cards (as in Boards), via the `deleteBatchId` cascade |
| **Cards** | A single card (+ subtasks) | Its checklists & items, comments, activities, attachments (physical blobs), custom-field values, votes, time entries |
| **Attachments** | Files | The **physical bytes** in the storage adapter (S3 / GCS / Azure / GridFS / filesystem), not just the metadata row |
| **Comments & Activities** | Free-text that may contain PII | The rows themselves; referenced attachment blobs if any |
| **Custom-field values** | Per-card values (may hold PII) | The values on cards; definitions remain unless the field itself is deleted |

Rules for the purge implementation:

- **Cascade completeness:** deleting a parent purges the entire subtree; never leave orphaned cards,
  checklist items, comments, or (critically) **attachment blobs** — those live in external storage and
  are the easiest thing to leak.
- **PII beyond content:** account erasure must also clear the identity/auth surface (sessions, tokens,
  OAuth/LDAP links, avatar), not only board content.
- **Anonymize vs. delete:** for authored content that others still rely on (a comment thread), the
  operator chooses **anonymize** (reassign to a tombstone "Deleted user", scrub the PII) instead of a
  hard delete — GDPR is satisfied by removing the *personal data*, not necessarily the row.
- **Audit, not silent:** every permanent delete writes an audit `Activity` (who, what category, how
  many objects, when). The trash is never emptied on a timer.

Everything else **must** soft-delete. To keep this enforceable:

- Route user-content deletes through a single helper (§17), never a bare `removeAsync`.
- **No time-based auto-purge.** Trash is emptied only by the flag-gated Global-Admin action or GDPR
  erasure — the "one narrow purge path" decision, chosen over a retention-window auto-purge, so
  nothing ever disappears on a timer.

## 17. Mechanism — a `softRemove` helper + query default

Replace user-content `removeAsync` call sites (see the ~40 sites in `models/` and `server/models/`)
with a soft-delete helper that mirrors today's cascade but *marks* instead of destroys:

```js
// document method, e.g. on Lists / Cards / Swimlanes …
async softRemove(userId, batchId) {
  const at = /* server time */;
  await this.collection.updateAsync(this._id, {
    $set: { deletedAt: at, deletedBy: userId, deleteBatchId: batchId },
  });
  // cascade: soft-remove children with the SAME batchId (a list marks its cards, etc.)
  // record history: UserPositionHistory.trackChange({ actionType: 'delete', … })
}
```

Reads must hide soft-deleted docs **by default**. Two enforcement layers:

- **Publications / server queries** add `deletedAt: null` to their selectors (a shared
  `notDeleted(selector)` helper keeps this uniform and testable). The Recycle Bin publication is the
  one place that *opts in* to `deletedAt: { $ne: null }`.
- **Cascade & counts** (list card counts, board "N cards", exports) filter `deletedAt: null` too, so a
  soft-deleted card doesn't inflate totals.

Restore is the inverse: `$unset` the three fields for the whole `deleteBatchId` (so restoring a list
brings back exactly the cards deleted with it, not ones deleted separately later).

## 18. Undo/redo & History integration

- **Undo of a delete:** `trackChange({ actionType: 'delete' })` on soft-remove; `undo()` gains a
  `delete` case that clears the delete mark for the `deleteBatchId`; `redo()` re-applies it. This
  extends the generic stack in §6 — `undoLast`/`redoLast` need no change.
- **History:** delete/restore appear in History.md's unified feed with actor avatar + timestamp; the
  Recycle Bin is essentially a History view filtered to `actionType: 'delete'` with a Restore button.

## 19. Migration

1. Add `deletedAt`/`deletedBy`/`deleteBatchId` to the soft-deletable schemas (nullable; no backfill
   needed — absent ⇒ live).
2. Introduce `notDeleted()` and `softRemove()` helpers; convert user-content `removeAsync` sites,
   leaving exempt sites with an explicit `// hard-delete OK` comment.
3. Add `deletedAt: null` to the affected publications/queries **in the same change** as each
   conversion (a converted delete that publications don't filter would make "deleted" items still
   show — the highest-risk step; do it collection-by-collection).
4. Add the Recycle Bin view + the admin purge action + GDPR erasure purge.
5. Wire `delete`/`restore` into undo and History.

## 20. Risks / notes

- **Storage growth** is accepted (the chosen trade for "never lose data"); the admin purge and GDPR
  erasure are the only relief valves. Document this for operators.
- **Query drift:** any *new* query that forgets `deletedAt: null` will leak deleted rows. The
  `notDeleted()` helper + a source-guard test (grep that user-content publications include the filter)
  mitigate this.
- **Unique constraints / slugs:** a soft-deleted board/label still occupies its slug; decide whether
  restore or a new item wins the name (recommend: soft-deleted items release user-facing uniqueness,
  re-acquire on restore or get suffixed).
- **Third-party storage (Attachments):** soft-deleting an attachment keeps the blob in S3/GridFS;
  only the admin purge / GDPR erasure removes the physical bytes.
