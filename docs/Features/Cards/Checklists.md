# Checklists

## What it is

A checklist is a list of items on a card, each ticked when done. This page
describes the management features of a card's checklists: an **automatic
reset** interval that unchecks all of a checklist's items on a recurring
schedule, a **bulk text edit** that lets you rewrite a whole checklist's
items as one block of plain text instead of editing items one at a time, and
a checklist's own optional **deadline**.

## Read more

- [Checklist](https://en.wikipedia.org/wiki/Checklist) on Wikipedia.
- [Task list items](https://github.github.com/gfm/#task-list-items-extension-)
  in the GitHub Flavored Markdown specification - the `[x]` / `[ ]` lines
  bulk text edit uses.
- [cron](https://en.wikipedia.org/wiki/Cron) - the kind of scheduled job that
  resets the checklists.
- In WeKan: [Checklist or subtasks from the description](Checklist-From-Description.md),
  [Card recurrence](Card-Recurrence.md) (the same schedule for a whole card),
  [Due date](Dates/Due-Date.md) and the [Checklists REST API](../../API/Checklists.md).

## How to use it

**Card → a checklist's own hamburger menu (☰, Checklist Actions)** - reset
interval and bulk text edit are both entries in that menu, for those who may
edit the card.

```
┌ Card ────────────────────────────────────┐
│ Checklist: Daily routine         [ ☰ ] <-menu
│  ☑ Water the plants                      │
│  ☐ Check backups                         │
└──────────────────────────────────────────┘

┌ Checklist Actions ───────────────────────┐
│ Export / Import ...                      │
│ Edit as text ...                  <-here │
│ ---------------------------------------- │
│ Delete ...                               │
│ Move Checklist ...                       │
│ Copy Checklist ...                       │
│ Automatic reset ...               <-here │
│ Check all items                          │
│ Uncheck all items                        │
│ Hide checked checklist items ... [toggle]│
│ Hide all checklist items ...     [toggle]│
│ Show on Minicard ...             [toggle]│
└──────────────────────────────────────────┘

┌ Automatic reset ─────────────────────────┐
│ ○ Off (do not reset automatically)       │
│ ○ Daily                                  │
│ ○ Weekly                                 │
│ ○ Monthly                                │
└──────────────────────────────────────────┘

┌ Edit checklist items as text ────────────┐
│ [x] Water the plants                     │
│ [ ] Check backups                        │
│ [ ] Feed the cat                         │
│                                          │
│ [Save]                                   │
└──────────────────────────────────────────┘
```

### Steps to use automatic reset

1. Open a card, click a checklist's hamburger menu (☰).
2. Click **Automatic reset ...**.
3. Pick **Daily**, **Weekly** or **Monthly** to make the checklist
   automatically uncheck all of its items once that interval is due again
   (counted from the last reset, or from the checklist's creation date if it
   has never reset) - or pick **Off (do not reset automatically)** to turn
   automatic reset off.
4. Nothing else is needed: a server-side job unchecks the items once the
   interval comes due, no matter who is logged in at the time.

### Steps to use bulk text edit

1. Open a card, click a checklist's hamburger menu (☰).
2. Click **Edit as text ...**. The popup is **Edit checklist items as text**.
3. The textarea shows one line per existing item, `[x]` for a checked item
   and `[ ]` for an unchecked one.
4. Add, remove, reorder or retype lines directly in the textarea - typing,
   pasting, or cutting/pasting lines between two checklists (open the popup
   on each and copy the relevant lines) all work, since it is plain text. A
   line without `[x]` / `[ ]` becomes an unchecked item.
5. Click **Save**. The checklist's items are replaced to match the text
   exactly, in the order the lines appear, with the `[x]`/`[ ]` prefix
   controlling each item's checked state.

### Checklist deadlines

A checklist may have its own optional due date, independent of item due dates.
Use the clock control beneath its title to select a date and time with the
shared calendar popup. Its badge uses the selected member calendar and existing
due-date colors. Open the badge to edit or delete the deadline. Read-only
viewers see the date without editing controls. Checklist and item deadlines
are also readable and writable through the REST API; see [API docs](../../API/Checklists.md).

### Prerequisites

- Both actions require the same permission as editing the checklist itself
  (a board member who can modify the card).
- Automatic reset needs no extra setup beyond picking an interval - there is
  no separate cron/service to configure.

## How the numbers are calculated

- **Automatic reset** ([models/lib/checklistResetSchedule.js](../../../models/lib/checklistResetSchedule.js)):
  the next reset is due at the last reset (`lastResetAt`), or the
  checklist's creation date (`createdAt`) the first time, plus 24 hours
  (Daily), 7 x 24 hours (Weekly) or one calendar month (Monthly, with
  `setMonth`, so a reset on the 31st does not drift). The job runs **once an
  hour**, so a reset happens within an hour after it is due.
- **Progress** ([models/checklists.js](../../../models/checklists.js)): a
  checklist's finished count is its ticked items, its percentage is
  `round(finished / items x 100)` (0 for an empty checklist), and it is
  finished when it has items and all are ticked. The card's checklist count
  is the sum over all its checklists ([models/cards.js](../../../models/cards.js)
  `checklistFinishedCount` / `checklistItemCount`).
- **Bulk text edit** ([models/lib/checklistItemsAsText.js](../../../models/lib/checklistItemsAsText.js)):
  empty lines are dropped, and the new items are numbered `sort` 0, 1, 2 ...
  in the order of the lines.

## How it works in WeKan

- **Automatic reset**: the checklist's `resetInterval`
  (`none`/`daily`/`weekly`/`monthly`) and `lastResetAt`.
  [models/lib/checklistResetSchedule.js](../../../models/lib/checklistResetSchedule.js)
  is the pure arithmetic (`computeNextResetAt`, `isChecklistResetDue`,
  `selectChecklistsDueForReset`), and
  [server/checklistResetSchedule.js](../../../server/checklistResetSchedule.js)
  is the hourly `quave:synced-cron` job that unchecks every item of a due
  checklist in one update. The popup is `checklistResetIntervalPopup` in
  [client/components/cards/checklists.jade](../../../client/components/cards/checklists.jade).
- **Bulk text edit**: `checklistItemsToText` writes the text,
  `parseChecklistItemsText` reads it back, and `planChecklistItemsTextUpdate`
  plans the change - a line whose title matches an existing item keeps that
  item (and so its due date and other fields; only its order and tick
  change), a new line is inserted, and an item no line matches is removed.
  The popup is `editChecklistItemsAsTextPopup` in
  [client/components/cards/checklists.js](../../../client/components/cards/checklists.js).
- **Deadlines**: the checklist's due date, edited through the shared date
  popup, and the checklist REST endpoints.
- Tests: [tests/checklistResetSchedule.test.cjs](../../../tests/checklistResetSchedule.test.cjs),
  [tests/checklistResetIndex.test.cjs](../../../tests/checklistResetIndex.test.cjs),
  [tests/checklistItemsAsText.test.cjs](../../../tests/checklistItemsAsText.test.cjs),
  [tests/checklistBulkCheck.test.cjs](../../../tests/checklistBulkCheck.test.cjs),
  [tests/checklistDeadlines.test.cjs](../../../tests/checklistDeadlines.test.cjs)
  and [tests/playwright/specs/12-checklists.e2e.js](../../../tests/playwright/specs/12-checklists.e2e.js).

## Commits

 - [Checklist items get a person responsible, and dated items show in the calendar and Gantt](https://github.com/wekan/wekan/commit/7ca1489279e35b85e07a6b2d5420694f6b673d47)
 - [Checklist progress and drag sorting shared with minicards](https://github.com/wekan/wekan/commit/b65b45e522875f6e824ba227911c3ca748db5ef1)
 - [Checklist deadlines, and checklist item dates in the REST API](https://github.com/wekan/wekan/commit/70202a849baeede906b5c11be1da809572e1f5b0)
 - [Check all items and Uncheck all items in the checklist menu](https://github.com/wekan/wekan/commit/6d43020212fbad1878d2ac646ec52850ffffe30f)
 - [Automatic reset entry in the checklist menu](https://github.com/wekan/wekan/commit/16a919279d2b21519e6d4a7a5a44798352484213)
 - [The automatic reset job is wired up on the server](https://github.com/wekan/wekan/commit/6ba3a3eb9ac10f344adc06f8d9a96853cee8280b)
 - [Per-checklist automatic reset schedule: daily, weekly, monthly](https://github.com/wekan/wekan/commit/73128dd7fc289406709c331ebed3c20180faf43d)
 - [Bulk edit a checklist's items as plain text](https://github.com/wekan/wekan/commit/bed9bce31227df8a6492e6f1a284ce9d28c01a29)
 - [Due dates for individual checklist items](https://github.com/wekan/wekan/commit/c7bf50deb42d0c293c7db053261bde0f96ef71bd)
 - [A Worker may tick a checklist item without editing or deleting it](https://github.com/wekan/wekan/commit/af847bd0885704c094f903a5cbda368b61aeec7c)
 - [Checklist import and export](https://github.com/wekan/wekan/commit/c8dbb528ec30c5bacd65cbeaf27e181b098efe5e)
 - [Show on minicard is an override, so unchecking it hides the checklist](https://github.com/wekan/wekan/commit/32b61f186f8920f1f82d9b31cae649ed20fbaf21)
 - [Collapsible checklists on the opened card and the minicard](https://github.com/wekan/wekan/commit/1cef5ede9ae685811e1da0d93d38e0547297e9f3)
 - [Per-checklist Hide checked items toggle](https://github.com/wekan/wekan/commit/e98aae278b3ea13dc8588dcc1aa49cbfe8386775)
