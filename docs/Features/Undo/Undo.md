# Feature: Undo / Redo (position moves) + high-impact confirmation

Status: **Implemented (v1)** in #6478 · Owner: xet7 · Related: `userPositionHistory`,
card/list/swimlane drag-and-drop, `docs/Features/History/History.md`

This documents the undo/redo feature **shipped in v1** for #6478 ("UI: Confirmation for actions with
impact") — which covers **position moves** (card / list / swimlane) only.

> **Direction (approved design):** undo/redo is being folded into one **universal change-history**
> subsystem that records **every** change and exposes it as History views on card groups, the whole
> card, Member settings, Board Settings, swimlane/list menus, etc. In that model, **Undo/Redo is not
> a separate feature** — `Ctrl+Z`/`Ctrl+Y` simply restore the current user's most recent change from
> that history, for **any** change type, and `userPositionHistory` is superseded by the unified
> `changeHistory` store. The single source of truth for that direction is
> **`docs/Features/History/History.md`**; this doc describes the current v1 (positions) and the
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
  before/after content versioning (see `docs/Features/History/History.md`).
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
