# Card recurrence

## What it is

A Kanboard-style setting on a card: automatically create a fresh copy of the
card, in the same list, on a recurring schedule (daily, weekly or monthly).
Useful for a card that represents recurring work - a weekly status-report
card, a monthly invoice card - that would otherwise have to be recreated by
hand every time it comes around.

Card recurrence reuses the exact same mechanism WeKan already has for a
checklist's [automatic reset](Checklists.md): a `recurrenceInterval` field on
the card (`none`/`daily`/`weekly`/`monthly`, default `none`), the shared
`quave:synced-cron` job infrastructure `server/checklistResetSchedule.js`
already registers a job on, and the same due-date arithmetic pattern -
`models/lib/cardRecurrenceSchedule.js` is the pure, unit-testable twin of
`models/lib/checklistResetSchedule.js`.

## Read more

- [Recurring Tasks](https://docs.kanboard.org/v1/user/tasks/#recurring-tasks)
  in the Kanboard documentation, and
  [Kanboard](https://en.wikipedia.org/wiki/Kanboard) on Wikipedia - where the
  idea comes from.
- [cron](https://en.wikipedia.org/wiki/Cron) - the kind of scheduled job that
  creates the copies, and [iCalendar](https://en.wikipedia.org/wiki/ICalendar),
  whose repeat rules (RRULE) imports map to a card's recurrence.
- In WeKan: [Checklists](Checklists.md) (automatic reset),
  [Copy Card](Copy-Card.md) and
  [Import and export](../Board-Sidebar/Board-Settings/Import-Export/Format-Coverage.md).

## How to use it

1. Open a card.
2. Open the card's hamburger menu (**Card Actions**). Under **Move and copy**,
   choose **Card recurrence ...** - it is shown to those who may edit the card.

   ```
   ┌─ Card Actions ────────────────────────┐
   │ Move and copy                         │
   │   Move Card                           │
   │   Copy Card                           │
   │   Save as Template                    │
   │   Copy Template to Many Cards         │
   │   Card recurrence ...       <- here   │
   │   Move to Top                         │
   │   Move to Bottom                      │
   └───────────────────────────────────────┘
   ```

3. A small popup - the same shape as a checklist's **Automatic reset** popup
   - lets you pick the interval:

   ```
   ┌─ Card recurrence ───────────────────┐
   │ ○ Off (do not recur automatically)  │
   │ ○ Daily                             │
   │ ○ Weekly                            │
   │ ● Monthly                           │
   └─────────────────────────────────────┘
   ```

4. Nothing else is needed. Leave it **Off**, the default, and nothing changes
   for existing cards.
5. To stop a recurring card, set it back to **Off**, or archive it: an
   archived card is skipped even if its interval is still set, so archiving
   a recurring card's template stops it from spawning further copies without
   having to turn recurrence off first.

### Prerequisites

None beyond a normal WeKan board - no external scheduler or Internet access
is required; the job runs inside the same server process as every other
`SyncedCron` job WeKan already registers (checklist auto-reset, scheduled
Rules, LDAP group sync, list sync).

## How the numbers are calculated

From [models/lib/cardRecurrenceSchedule.js](../../../models/lib/cardRecurrenceSchedule.js):

- The next occurrence is due at the card's last recurrence
  (`lastRecurrenceAt`), or its creation date (`createdAt`) the first time,
  plus the interval:
  - **Daily**: + 24 hours;
  - **Weekly**: + 7 x 24 hours;
  - **Monthly**: + one calendar month (`setMonth(month + 1)`), not a fixed 30
    days, so a recurrence on the 31st does not drift earlier every few months.
- The job runs **once an hour** (`every 1 hour`), so a copy is made within an
  hour after it is due.
- A card is due when `now >= next due time`, it is not archived, and its
  interval is one of the four values and not `none`.
- The new card gets the board's next card number.

## How it works in WeKan

1. Set a card's recurrence interval from the popup above.
2. Once an hour, [server/cardRecurrenceSchedule.js](../../../server/cardRecurrenceSchedule.js)
   (the `wekan-card-recurrence` `SyncedCron` job) scans every card with a
   recurrence interval set that is not archived, and checks whether it is due
   (`isCardRecurrenceDue()` and `selectCardsDueForRecurrence()` in
   `models/lib/cardRecurrenceSchedule.js`). An index on `recurrenceInterval`
   ([server/models/cards.js](../../../server/models/cards.js))
   keeps that scan from reading every card.
3. For each due card, `createCardRecurrence()` creates a brand-new card in
   the same board, swimlane and list, carrying over the title, description,
   labels and custom fields (mirroring what a plain copy carries when the
   destination is the same board). The new card starts otherwise fresh - no
   members, checklists or dates copied over - and keeps the same recurrence
   interval, so the chain keeps recurring.
4. The source card's `lastRecurrenceAt` is stamped so the next due date
   counts from this occurrence, not from when recurrence was first turned on.
5. One card that fails is logged and does not stop the rest.

The job is loaded from the server's import chain; until 2026-10-16 the module
was never imported, so the setting was saved and nothing recurred.

**Imports and exports.** Repeating tasks of other tools become the card's
recurrence when the rule is exactly daily, weekly or monthly
(`models/lib/recurrenceMap.js`): Taskwarrior, Microsoft To Do, Todoist,
TickTick, iCalendar, Org mode, Obsidian Kanban, Tasks.org, Vikunja, Super
Productivity and Kanboard. An imported card's `lastRecurrenceAt` is the
import time, so the job does not copy every imported card at once. Any other
rule (every two weeks, yearly, weekdays, a count or an end) stays in the
import loss report. The exports write the recurrence back, and the WeKan JSON
import keeps `recurrenceInterval`.

Tests: [tests/cardRecurrenceSchedule.test.cjs](../../../tests/cardRecurrenceSchedule.test.cjs),
[tests/recurrenceIndex.test.cjs](../../../tests/recurrenceIndex.test.cjs) and
[tests/recurrenceMap.test.cjs](../../../tests/recurrenceMap.test.cjs).

## Related

- [Checklists](Checklists.md) - the same recurrence idea, but for
  automatically unchecking a checklist's items instead of creating a card.
- [Linked Cards](Linked-Cards.md) and [Subtasks](Subtasks.md) - other ways
  cards relate to each other.

## Commits

 - [Super Productivity export writes a repeating card's repeat config](https://github.com/wekan/wekan/commit/35f3f6c9dbec5de87e1181956ed7bf71c30a2f12)
 - [Kanboard import and export keep the task recurrence](https://github.com/wekan/wekan/commit/28891103f6bec2d51e1dd1531103235d95a1a70c)
 - [Tasks.org, Vikunja and Super Productivity repeats become the card's recurrence](https://github.com/wekan/wekan/commit/878e53f418c2416796b5af00876ada7cc87a4161)
 - [Repeating tasks of other tools become the card's recurrence](https://github.com/wekan/wekan/commit/24ac6b2bd2e55323fa1c6e52eb53ff3291fc80fb)
 - [An index for the hourly recurrence job](https://github.com/wekan/wekan/commit/e9440d503e07f0729a0e1850e05be78f76b4d7a9)
 - [The card menu in its current order, Card recurrence among Move and Copy Card](https://github.com/wekan/wekan/commit/65621f44cc03db9b2b98276ffd2c7bed8590b2fd)
 - [The recurrence job is loaded on the server, so cards really recur](https://github.com/wekan/wekan/commit/3f3a61df0c69565834a4c0827b4c585dc40f1a40)
 - [Card recurrence translated to every language](https://github.com/wekan/wekan/commit/5e255d174f43a8027cc1cda498d14b3d62d7e3bb)
 - [Kanboard-style whole-card recurrence](https://github.com/wekan/wekan/commit/2e09565376b7af7213e8090f2252e11ccfbddea9)
