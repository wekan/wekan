# Scrum meetings: daily standup timer, retrospective board

## What it is

Two helpers in the board menu, offline and with no AI
([models/lib/scrumMeetings.js](../../../../models/lib/scrumMeetings.js)): a
**Daily standup** timer that gives each member of the board the same timebox,
and **Retrospective board**, which makes a new board with the lists of a
Start / Stop / Continue retrospective. Every member of the board sees them,
next to Summary and Since your last visit.

## Read more

- [Wikipedia: Stand-up meeting](https://en.wikipedia.org/wiki/Stand-up_meeting)
- [Wikipedia: Retrospective](https://en.wikipedia.org/wiki/Retrospective)
- [Wikipedia: Scrum (software development)](https://en.wikipedia.org/wiki/Scrum_(software_development))
- [The Scrum Guide](https://scrumguides.org/scrum-guide.html): the Daily Scrum
  and the Sprint Retrospective
- [Scrum settings](Scrum-Settings.md)

## How to use it

### Daily standup

1. Open the board, its right sidebar, then **Board Settings → Daily standup**.
2. The popup lists the board's active members in a shuffled order
   (**Shuffle** draws another one).
3. **Start** gives the first person the timebox - *Minutes per person* in the
   Scrum settings - and counts it down; past the timebox the clock turns red
   and counts on.
4. **Next** hands over to the next person, and after the last the popup says
   how long the standup took.

The timer runs in the browser that opened it and writes nothing.

### Retrospective board

1. Open **Board Settings → Retrospective board**.
2. WeKan makes a new private board, titled with this board's name and the day,
   with the lists **Start doing**, **Stop doing**, **Keep doing** and **Action
   items**, and opens it.

It is the reader's own board, made through the same server path as Add Board,
so Admin Panel's "who may create boards" applies; the team is invited the
usual way.

### Hiding them

- For one board: the **Scrum settings** (Board Settings / Scrum settings) have
  a checkbox for each, *Daily standup* and *Retrospective board*, both on.
- For the instance: **Admin Panel / Settings / Features**,
  *Daily standup timer* and *Retrospective board*. Feature profiles can hide
  them for some users only.

## How the numbers are calculated

From [models/lib/scrumMeetings.js](../../../../models/lib/scrumMeetings.js):

- **Minutes per person**: 2 by default, from 1 to 15; a value outside is
  rounded to a whole number and moved into that range, and a value that is not
  a number gives the default (`STANDUP_MINUTES`, `standupMinutes`).
- **The order** is a random shuffle (Fisher-Yates) of the members, each once.
- **The clock** shows the speaker's remaining seconds: minutes x 60 less the
  whole seconds since that speaker started. Below zero it is overtime and is
  shown with a minus sign, for example `-0:07`; `125` seconds is shown as
  `2:05`.
- **How long the standup took** is the whole seconds since **Start**.
- **The retrospective board's title** is "<board> - retrospective
  <YYYY-MM-DD>" in the reader's language, cut to 250 characters.

## How it works in WeKan

The menu entries are in `boardMenuPopup` in
[client/components/sidebar/sidebar.jade](../../../../client/components/sidebar/sidebar.jade),
shown by `showsStandupTimer` and `showsRetrospectiveBoard`, which follow the
board's Scrum settings and the Admin Panel features. The timer popup is
[client/components/sidebar/scrumMeetings.jade](../../../../client/components/sidebar/scrumMeetings.jade);
[client/components/sidebar/scrumMeetings.js](../../../../client/components/sidebar/scrumMeetings.js)
runs it in the browser and makes the retrospective board with the
`createBoardWithInitialSwimlanes` method (the same "who may create boards"
check as Add Board), then adds its four lists.

Tests: [tests/scrumMeetings.test.cjs](../../../../tests/scrumMeetings.test.cjs),
[tests/playwright/specs/scrum-meetings.e2e.js](../../../../tests/playwright/specs/scrum-meetings.e2e.js).

## Commits

 - [Docs follow the menus: Scrum meetings under Board Settings, the newest features, README feature list](https://github.com/wekan/wekan/commit/0c277c4d187e59f3e32e1ce1cc04900009a8e047)
 - [Daily standup timer and retrospective board in the board menu](https://github.com/wekan/wekan/commit/2f7a4e210f0e90005bba662e7ac418b403ffa2ba)
