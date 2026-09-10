# Flowtime and Pomodoro timers

Two per-card work timers that both feed the same **Spent Time** total as any
other time entry, for whichever technique you prefer: **Flowtime**, an
open-ended session you stop whenever you actually finish (tallying
interruptions along the way), and **Pomodoro**, the classic fixed
work/break cycle (25 minutes work, 5 minutes break, a longer break every 4th
round).

## Where to find it

**Open a card → scroll to the Flowtime / Pomodoro rows**, just below Spent
Time.

```
┌ Card ─────────────────────────────────┐
│ Spent Time: 2h 30m                     │
│                                         │
│ ⚡ Flowtime                             │
│   [ Start ]                            │
│                                         │
│ 🕐 Pomodoro                             │
│   Work minutes: [ 25 ]  [ Start ]       │
└──────────────────────────────────────────┘

┌ While a Flowtime session is running ───┐
│ ⚡ Flowtime                             │
│   00:12:34   Interruptions: 1           │
│   [ Add interruption ]  [ Stop ]        │
└──────────────────────────────────────────┘

┌ While a Pomodoro is running ───────────┐
│ 🕐 Pomodoro                             │
│   Work    00:18:02   Completed: 2       │
│   [ Stop ]                              │
└──────────────────────────────────────────┘
```

## Steps to use Flowtime

1. Open a card, scroll to the **Flowtime** row.
2. Click **Start** to begin a session; an elapsed-time clock starts ticking.
3. If you get interrupted, click **Add interruption** - this tallies the
   interruption count without stopping the clock.
4. When you are done, click **Stop**. The elapsed time is added to the
   card's **Spent Time**.
5. Anyone who may modify the card can stop a session someone else started,
   not only the person who started it.

## Steps to use Pomodoro

1. Open a card, scroll to the **Pomodoro** row.
2. Optionally change the **work minutes** input (defaults to 25).
3. Click **Start**. The row shows the current phase (Work/Break) and a
   countdown.
4. The timer automatically switches between Work and Break phases; every
   4th completed work interval gets a longer break.
5. Click **Stop** at any time to end the Pomodoro session early.
6. Completed work intervals add their time to the card's **Spent Time**.

## Prerequisites

- Both timers require **Time Tracking** to be enabled on the board (the
  board's `allowsSpentTime` setting) and the same card-modify permission as
  any other time entry.
