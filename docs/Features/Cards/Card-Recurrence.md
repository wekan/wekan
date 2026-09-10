# Card recurrence

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

## Where to find it

Open a card, then the card's **hamburger / "..." menu → Card recurrence**,
right beside **Save card as template** and **Move card** / **Copy card**.

```
┌─ Card actions ──────────────────────┐
│ Move card to top                     │
│ Move card to bottom                  │
├───────────────────────────────────────┤
│ Move card                            │
│ Copy card                            │
│ Save card as template                │
│ Card recurrence ...        <- here   │
│ Link card to board                   │
└───────────────────────────────────────┘
```

Clicking it opens a small popup - the same shape as a checklist's
**Automatic reset** popup - to pick the interval:

```
┌─ Card recurrence ───────────────────┐
│ ○ Off (do not recur automatically)   │
│ ○ Daily                              │
│ ○ Weekly                             │
│ ● Monthly                            │
└───────────────────────────────────────┘
```

## How it works

1. Set a card's recurrence interval from the popup above (or leave it
   `Off`, the default - nothing changes for existing cards).
2. Once an hour, `server/cardRecurrenceSchedule.js` scans every card with a
   recurrence interval set and checks whether it is due
   (`isCardRecurrenceDue()` in `models/lib/cardRecurrenceSchedule.js`,
   counting forward from the card's last recurrence, or its creation date the
   first time).
3. For each due card, a brand-new card is created in the same board,
   swimlane and list, carrying over the title, description, labels and
   custom fields (mirroring what a plain copy carries when the destination
   is the same board). The new card starts otherwise fresh - no members,
   checklists or dates copied over - and keeps the same recurrence interval,
   so the chain keeps recurring.
4. The source card's `lastRecurrenceAt` is stamped so the next due date
   counts from this occurrence, not from when recurrence was first turned on.
5. An archived card is skipped even if its interval is still set, so
   archiving a recurring card's template stops it from spawning further
   copies without having to turn recurrence off first.

## Prerequisites

None beyond a normal WeKan board - no external scheduler or Internet access
is required; the job runs inside the same server process as every other
`SyncedCron` job WeKan already registers (checklist auto-reset, scheduled
Rules, LDAP group sync, list sync).

## Related

- [Checklists](Checklists.md) - the same recurrence idea, but for
  automatically unchecking a checklist's items instead of creating a card.
- [Linked Cards](Linked-Cards.md) and [Subtasks](Subtasks.md) - other ways
  cards relate to each other.
