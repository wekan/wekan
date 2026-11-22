# Due date and the other card dates

## What it is

A card has four dates, each optional, that say where its work is in time:

- received - when a bug or task is found
- start - when work is started
- due - when it should be done
- end - when it's done

The due date is the deadline. Its badge on the minicard and on the opened
card is coloured by how urgent the card is and counts the days left, and the
card shows how many times its due date has been changed.

## Read more

- [Due date](https://en.wikipedia.org/wiki/Due_date) and
  [Deadline](https://en.wikipedia.org/wiki/Deadline) on Wikipedia.
- [Lead time](https://en.wikipedia.org/wiki/Lead_time) and
  [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development)) -
  what the received, start and end dates measure on a board.
- In WeKan: [Due date from the title](Due-Date-From-Title.md),
  [Forecast done date](Forecast.md), [At risk](../At-Risk.md) and
  [Card fields](../Card-Fields.md).

## How to use it

**Setting a date:**

1. Open the card. In its dates, click the **+** beside **Received**,
   **Start**, **Due** or **End** (or click the date's badge to change it).
2. In the popup (for the due date, **Change due date**), pick the day and the
   time and save. A due date without a chosen time gets 17:00.
3. To remove a date, open the same popup and delete it.

**With the keyboard:** press `d` on an opened card, or on a hovered or
selected minicard, to open its due date editor (when keyboard shortcuts are
on in your member settings).

**From the title:** type the date at the end of a new card's title -
[Due date from the title](Due-Date-From-Title.md).

## How the numbers are calculated

From [client/lib/dueDateColor.js](../../../../client/lib/dueDateColor.js) and
[client/components/cards/cardDate.js](../../../../client/components/cards/cardDate.js):

- **Due-date colour** (`dueDateClass`): when the card has an end date, the
  due badge is *completed* (light green), or *completed early* (green) when the
  end is before the due date. Otherwise the hours from now to the due date are
  compared: below 0 is **red** (overdue), 0 to 48 hours is **amber** (due soon),
  more than 48 hours has no status colour and keeps the due date's own
  colour, **yellow**.
- **Countdown** (`dueCountdown`), shown after the due date until the card has
  an end date: the due date's calendar day minus today's, so a card due later
  today reads **Due today**, otherwise **N days left** or **N days overdue**.
- **Start date**: red when it is after the end or the due date, no status
  colour when it is in the future, **green** (current) when it has passed.
- **Received date**: red when it is after the start, end or due date.
- **End date**: completed when there is no due date; when there is,
  **green** (early, before the due date), **orange** (late, after it) or
  **blue** (on time).
- **Due-date change count** (`getDueDateChangeCount` in
  [models/cards.js](../../../../models/cards.js)): the number of the card's
  `a-dueAt` activities - one for every time the due date was set, changed or
  cleared (clearing a date the card does not have records nothing). It is shown
  only when it is at least 1.
- **Default time**: 17:00 for a due date, the current time for the other
  three.

## How it works in WeKan

- The dates are the card's `receivedAt`, `startAt`, `dueAt` and `endAt`
  fields ([models/cards.js](../../../../models/cards.js), `setDue`/`unsetDue`
  and the like). A linked card shows and sets its source card's dates.
- Each change is recorded by the card's update hook in
  [server/models/cards.js](../../../../server/models/cards.js) as an activity
  `a-receivedAt`, `a-startAt`, `a-dueAt` or `a-endAt` with the new and old
  value; rules can trigger on these, and the due-date change count reads the
  `a-dueAt` ones.
- The badges and popups are
  [client/components/cards/cardDate.jade](../../../../client/components/cards/cardDate.jade),
  `cardDate.js` and `cardDate.css` (and `minicard.css` for the minicard). The
  `d` shortcut is in [client/lib/keyboard.js](../../../../client/lib/keyboard.js).
- Tests: `tests/dueDateCountdown.test.cjs`,
  `tests/dueDateKeyboardShortcut.test.cjs`, `tests/dueDateShortcuts.test.cjs`
  and the browser tests `tests/playwright/specs/11-labels-duedates.e2e.js`,
  `due-date-keyboard-shortcut.e2e.js`, `card-date-range.e2e.js` and
  `card-date-position.e2e.js`.

### Due-date colour coding

The due-date badge colour shows how urgent a card is: **red** = overdue, **amber** = due
within 48 hours, and a due date more than 48 hours away has no urgency colour
(it keeps the due date's own yellow). The colour shown on the list/minicard and
on the opened card detail always match.

*Corrected:* this page used to say **grey** for a due date more than 48 hours
away. The code gives that badge no status colour (`.card-date.not-due` is
empty), so it shows the due date's own yellow (`#ffd700`, `.card-date.due-date`).

### Due-date change count

The card detail shows a **"Due date changed N times"** count next to the due date, derived
from the card's activity history, so that changes to a deadline are visible (useful for
accountability when teams commit to dates).

## Commits

 - [card shortcuts open only their popup](https://github.com/wekan/wekan/commit/138f727ebbfc30d395fbcfa18ca244e58abe91d7)
 - [clearing a date no longer goes through the timing hook as a set](https://github.com/wekan/wekan/commit/50334816caf227237124b007c53a467c8f6919f5)
 - [the d shortcut opens the due date editor of a card still being opened](https://github.com/wekan/wekan/commit/b1403ca7afe05f1338a5ea48dfdc80a63ab11bc3)
 - [Save without picking a day saves today instead of Invalid date](https://github.com/wekan/wekan/commit/6f5aab875b0f1627a866f825c5eaa164920dd141)
 - [each card date described once for its card and minicard badge](https://github.com/wekan/wekan/commit/9a73bf917346a81f11e67c234be9f10a730a8c87)
 - [d opens a hovered card's due date](https://github.com/wekan/wekan/commit/04a4f628e122e34d5ec19cc520dac3725d47334b)
 - [a countdown, N days left or N days overdue, on the due-date badge](https://github.com/wekan/wekan/commit/67f1c7c56e3f11030eb4c6c7b9db489b84392d83)
 - [rule triggers for due, start, end and received date changes](https://github.com/wekan/wekan/commit/29488f8d52a0c3a94f9b4218910e0764908d26a2)
 - [existing card dates editable again](https://github.com/wekan/wekan/commit/fd41970ed26e94ffd963c1ce18165142d8d9892f)
 - [how many times a card's due date was changed](https://github.com/wekan/wekan/commit/a8ed326a5bec36ad20dcf9cb73a175b7737d9ee7)
 - [due-date colours correct and the same in every view](https://github.com/wekan/wekan/commit/086254e106051905a442a802ed3a4dc6e7c69d68)
 - [due dates coloured red, amber or not shaded](https://github.com/wekan/wekan/commit/1aa0d849775fbd0dfc83fa8e4cdca84d22a15042)
 - [the received and end dates](https://github.com/wekan/wekan/commit/07217d0e5142028bbe794bdd3611e47890ab4bfb)
 - [start and due dates highlighted by colour](https://github.com/wekan/wekan/commit/5dd554b99960ebd3ac599fa5afc52838c8b7155f)
 - [start and due dates shown on minicards](https://github.com/wekan/wekan/commit/80b93ce7117326464b55a76a9efbeeff36f28248)
 - [start and due dates for cards, first version](https://github.com/wekan/wekan/commit/d4497d7aeb968dbb9f8c4b84fbcc0f7cc3668167)
