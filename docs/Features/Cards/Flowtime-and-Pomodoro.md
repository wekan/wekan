# Flowtime and Pomodoro timers

## What it is

Two per-card work timers that both feed the same **Spent Time** total as any
other time entry, for whichever technique you prefer: **Flowtime**, an
open-ended session you stop whenever you actually finish (tallying
interruptions along the way), and **Pomodoro**, the classic fixed
work/break cycle (25 minutes work, 5 minutes break, a longer break every 4th
round). Flowtime came from [#3919](https://github.com/wekan/wekan/issues/3919),
Pomodoro from [#4862](https://github.com/wekan/wekan/issues/4862).

## Read more

- [Pomodoro Technique](https://en.wikipedia.org/wiki/Pomodoro_Technique) on
  Wikipedia.
- Flowtime has no Wikipedia page of its own; it is built on the idea of
  [Flow (psychology)](https://en.wikipedia.org/wiki/Flow_(psychology)) - work
  until the focus ends, not until a clock says so. See also
  [Time management](https://en.wikipedia.org/wiki/Time_management) and
  [Timesheet](https://en.wikipedia.org/wiki/Timesheet).
- In WeKan: [Time Tracking](Time-Tracking.md), [Card Settings](Card-Settings.md).

## How to use it

**Where to find it**: open a card → scroll to the **Flowtime** / **Pomodoro**
rows, just below Spent Time.

```
┌ Card ─────────────────────────────────┐
│ Spent Time: 2h 30m                     │
│                                         │
│ ⚡ Flowtime                             │
│   [ Start Flow ]                       │
│                                         │
│ 🕐 Pomodoro                             │
│   [ 25 ]  [ Start Pomodoro ]            │
└──────────────────────────────────────────┘

┌ While a Flowtime session is running ───┐
│ ⚡ Flowtime                             │
│   00:12:34   1 interruptions            │
│   [ Add Interruption ]  [ Stop Flow ]   │
└──────────────────────────────────────────┘

┌ While a Pomodoro is running ───────────┐
│ 🕐 Pomodoro                             │
│   Work    18:02   2 completed           │
│   [ Stop ]                              │
└──────────────────────────────────────────┘
```

**Prerequisites**

- Each timer has its own row in **Board Settings / Card**: **Flowtime** and
  **Pomodoro** (*Show on Card*, board fields `allowsFlowtime` and
  `allowsPomodoro`, both on by default). *Show on Minicard* (off by default)
  shows a badge on the minicard while a session runs: the interruption count for
  Flowtime, the completed count for Pomodoro.
- The buttons are shown to whoever may modify the card, the same permission as
  any other time entry.

**Steps to use Flowtime**

1. Open a card, scroll to the **Flowtime** row.
2. Click **Start Flow** to begin a session; an elapsed-time clock starts
   ticking.
3. If you get interrupted, click **Add Interruption** - this tallies the
   interruption count without stopping the clock.
4. When you are done, click **Stop Flow**. The elapsed time is added to the
   card's **Spent Time**.
5. Anyone who may modify the card can stop a session someone else started,
   not only the person who started it.

**Steps to use Pomodoro**

1. Open a card, scroll to the **Pomodoro** row.
2. Optionally change the **work minutes** input (25 when the card opens).
3. Click **Start Pomodoro**. The row shows the current phase (Work/Break), a
   countdown and how many work intervals are completed.
4. When the work countdown reaches zero, the work interval is added to the
   card's **Spent Time** and the Break starts by itself; every 4th completed
   work interval gets a longer break.
5. When the break ends, the timer goes back to ready: click **Start Pomodoro**
   again for the next work interval. The completed count carries on.
6. Click **Stop** at any time to end the Pomodoro session early. Stopped during
   Work, the minutes worked so far are added to **Spent Time**; stopped during a
   Break, nothing is added. Stop also sets the completed count back to 0.

## How the numbers are calculated

From [models/cards.js](../../../models/cards.js) (the session helpers) and the
two client templates:

- **Flowtime elapsed clock**: now minus `flowStartAt`, shown as `HH:MM:SS`,
  updated every second.
- **Flowtime time added on Stop**: (now - `flowStartAt`) / 3 600 000 hours,
  added to Spent Time with `$inc`.
- **Interruptions**: +1 per **Add Interruption** (`flowInterruptions`), set back
  to 0 on Start and on Stop. They do not change the time.
- **Pomodoro work length**: the minutes typed (whole numbers from 1 up), saved as
  `pomodoroWorkMinutes`; 25 when none is set.
- **Break length**: 5 minutes (`BREAK_MINUTES`), or 15 (`LONG_BREAK_MINUTES`)
  when the completed count is a multiple of 4 - after the 4th, 8th, ... work
  interval.
- **Countdown**: phase length minus the time since `pomodoroStartAt`, never
  below 0, shown as `MM:SS` (rounded up to the next second).
- **Time added by a completed work interval**: the work minutes / 60 hours, and
  the completed count (`pomodoroCount`) goes up by 1.
- **Time added by Stop during Work**: (now - `pomodoroStartAt`) / 3 600 000
  hours.
- Every addition is an `$inc` of the total, never a replacement of it.

## How it works in WeKan

- **Client**: [client/components/cards/cardFlowtime.js](../../../client/components/cards/cardFlowtime.js)
  and `cardFlowtime.jade`,
  [client/components/cards/cardPomodoro.js](../../../client/components/cards/cardPomodoro.js)
  and `cardPomodoro.jade`. Each ticks once a second from the start time stored
  on the card, so a page reload does not lose a session; the Pomodoro tick
  switches the phase when its countdown reaches zero.
- **Model**: `startFlowSession`, `addFlowInterruption`, `stopFlowSession`,
  `startPomodoro`, `completePomodoroWorkInterval`,
  `completePomodoroBreakInterval`, `stopPomodoro` and `addSpentTime` in
  [models/cards.js](../../../models/cards.js). Card fields: `flowStartAt`,
  `flowInterruptions`, `flowUserId`, `pomodoroStartAt`, `pomodoroPhase`,
  `pomodoroCount`, `pomodoroUserId`, `pomodoroWorkMinutes`.
- **Settings rows**: `flowtime` and `pomodoro` in
  [models/lib/cardSettingsRows.js](../../../models/lib/cardSettingsRows.js).
- Tests: `tests/flowtimeSession.test.cjs`, `tests/pomodoroTimer.test.cjs`,
  `tests/linkedTimerSessions.test.cjs` and the Playwright spec
  `linked-timer-sessions.e2e.js`.

### Linked cards and boards

The live session belongs to the displayed link card: starting, interrupting,
changing phase or resetting it does not change a source card's timer session.
Completed work still uses the same Spent Time destination as manual time entry
(the linked source card or board). Its current total is used, rather than a
stale value copied into the link card. If the total cannot be saved, the
session is retained. Saving the total and clearing the local session are
separate writes; they are not a cross-document transaction.

## Commits

 - [Spent time is shown as a duration, not decimal hours](https://github.com/wekan/wekan/commit/3e8e8039ffd4e26ab9a060b229c67dfffe0d82af)
 - [Stopping a timer adds its time to the total, never replaces it](https://github.com/wekan/wekan/commit/570cc34552ff21b640d37b773de8d2b6cfdbb116)
 - [Every Board Settings / Card row can be shown on the card and the minicard](https://github.com/wekan/wekan/commit/79b44675464d829b8b9ac05d01ec0aad2a8423b0)
 - [Linked timer sessions stay local and credit the current source total](https://github.com/wekan/wekan/commit/0bd4dc0a587f8d8e01aa9b05c5d2288fc51f035c)
 - [A Board Settings / Card toggle for each timer](https://github.com/wekan/wekan/commit/970213010013529150101d3fd6c59f33eab542d4)
 - [Add Interruption has the same theme as Start Pomodoro](https://github.com/wekan/wekan/commit/aa728a8dcea864d332b1dfa3f75d5b9fab1de77c)
 - [Fix "Utils is not defined" in the timer templates](https://github.com/wekan/wekan/commit/2f626d099d17d4ec4dc69629e877647bfd259986)
 - [Pomodoro timer on the opened card](https://github.com/wekan/wekan/commit/74e4248ee9e936b51654e1a1781305b1ab963392)
 - [Flowtime session tracking](https://github.com/wekan/wekan/commit/d8eee59e6f4445c0bfd1d49378cabf10b256ebb5)
