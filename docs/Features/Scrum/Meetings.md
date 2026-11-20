# Scrum meetings: daily standup timer, retrospective board

Two helpers in the board menu, offline and with no AI
([models/lib/scrumMeetings.js](../../../models/lib/scrumMeetings.js)). Every
member of the board sees them, next to Summary and Since your last visit.

## Daily standup

**Board menu / Daily standup** lists the board's active members in a shuffled
order (**Shuffle** draws another one). **Start** gives the first person the
timebox - *Minutes per person* in the Scrum settings, 2 by default, 1-15 - and
counts it down; past the timebox the clock turns red and counts on. **Next**
hands over to the next person, and after the last the popup says how long the
standup took. The timer runs in the browser that opened it and writes nothing.

## Retrospective board

**Board menu / Retrospective board** makes a new private board, titled with
this board's name and the day, with the lists of a Start / Stop / Continue
retrospective: **Start doing**, **Stop doing**, **Keep doing** and **Action
items**, and opens it. It is the reader's own board, made through the same
server path as Add Board, so Admin Panel's "who may create boards" applies; the
team is invited the usual way.

## Hiding them

- For one board: the **Scrum settings** (Board menu / Scrum settings) have a
  checkbox for each, *Daily standup* and *Retrospective board*, both on.
- For the instance: **Admin Panel / Settings / Visibility / Features**,
  *Daily standup timer* and *Retrospective board*. Feature profiles can hide
  them for some users only.

Tests: `tests/scrumMeetings.test.cjs`, `tests/playwright/specs/scrum-meetings.e2e.js`.
