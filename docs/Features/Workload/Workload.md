# Workload and capacity

## What it is

Member menu → **Workload and capacity** (`/workload`) shows, week by week, how
much work each person has against the hours they have, across every board you
work on. It answers the questions a board's Swimlanes per member and the
board's own *Workload* chart (a count of open cards per person) cannot: who has
too much in a given week, who could take more, and what a coming project needs
before anybody is named.

## Read more

- [Resource management](https://en.wikipedia.org/wiki/Resource_management)
  and [Capacity planning](https://en.wikipedia.org/wiki/Capacity_planning) on
  Wikipedia - planning work against the people's available time.
- [Utilization rate](https://en.wikipedia.org/wiki/Utilization_rate) - the
  billable utilization shown under each name.
- [Professional services automation](https://en.wikipedia.org/wiki/Professional_services_automation)
  - the kind of tool this and [Budget and billing](../Billing/Billing.md) are
  part of.
- [Story point](https://en.wikipedia.org/wiki/Story_point) - the unit of the
  Scrum estimates it can sum.
- In WeKan: [Budget and billing](../Billing/Billing.md),
  [Pages](../Pages/README.md).

## How to use it

1. Open the member menu (your avatar in the header bar) and choose **Workload
   and capacity**. It is there while Admin Panel / Settings / Features keeps
   the feature on.
2. Choose **From** (the first week), **Weeks** (4, 8, 12 or 26) and **Show**
   (hours or story points); an administrator may choose **All boards**.
3. Read each person's row week by week; click a week to see its cards.
4. Under **My working time**, set **Hours per week**, **Work time percent**,
   **Working days**, **Billable target** and **My skills**, and click **Save**.
5. Under **My absences**, click **Add absence**, choose the type, the start and
   the end, and save.
6. A board admin adds **Allocations** (**Add allocation**): a person, or a role
   with a headcount for a placeholder, a percent and a period. An administrator
   adds **Public holidays** (**Add public holiday**).

### What is counted

- **Hours.** Each card can have **Estimated hours**, set in the card's *Time*
  section beside the time spent (the same popup). What is still to do is the
  estimate less the time spent, never below zero. A board whose Scrum estimate
  unit is hours (`h`, `hours`, `tunti`, ...) counts its Scrum estimates as hours
  for cards that have no estimate of their own.
- **Story points.** On a board with Scrum on, the board's estimate (Planning
  Poker or the numeric custom field chosen in Scrum settings) is summed as
  points. *Show* switches the table between hours and points.
- **Who carries a card.** Its assignees, shared equally; a card with no
  assignee is carried by its members. A card nobody carries is shown once, on
  the *Not assigned to anybody* row.
- **When.** A card's work is spread from its start (or received) date to its
  due (or end) date, over the days the person works, in proportion to their
  hours on each day. Work whose dates are past is due now and is counted
  today, and the card is counted as overdue. A card with no dates is shown
  under *No dates*; a card with no estimate is counted under *Cards without an
  estimate*. Finished (due complete) and archived cards count nothing.

### Capacity

- **My working time**: hours per week (default 37.5), work time percent (a
  part-time 60 % of 37.5 h is 22.5 h) and the working days. A day's hours are
  the week's hours shared over the working days.
- **My absences**: vacation, sick leave, day off, training or other, from one
  day to another. An absent day has no hours, and work spread over a period is
  moved to the days the person is there.
- **Public holidays**: set by an administrator on the same page; a day off for
  everybody.

A week is **red** when its work is more than its hours (over 100 %), when the
person's allocations add up to more than 100 %, or when there is work and no
hours at all (an absence). It is **grey-blue** when it is under half full. Click
a week to see the cards in it.

### Utilization

Under each person's name, the report shows their **billable utilization**:
the hours they logged on billable cards in the report's weeks, against the
hours they had. **Billable target** in *My working time* sets the share they
aim for; under it, the figure is red. Time logged on a card marked not
billable counts as logged, not as billable. Only the time on the boards of the
report is counted.

### Skills

*My working time* also lists a person's **skills**, each with a level 1 to 5
("React 4, Go, Finnish 5"; 3 when not given). A placeholder can name the
**skill it needs** and the lowest level that will do; its row then shows who
**could do it** - the people of the report with that skill at that level or
better, the most free hours first over the weeks it needs them. Free hours
are the hours a person has less the work they carry or the time promised to
boards, whichever is more.

### Allocations and placeholders

A board's admins can allocate a share of a person's time to the board for a
period - "A works on board X 50 % of their time in April" - shown in each week
as a percent beside the load. Without a person, an allocation is a
**placeholder** for a role: "Developer × 1, 100 %, next month" is drawn as its
own row with the hours it will need, so a project can be planned before the
people are chosen. A person allocated must be an active member of that board.

## How the numbers are calculated

All in [models/lib/workload.js](../../../models/lib/workload.js):

- **Hours a person has on a day** = hours per week × work percent / 100 /
  number of working days, and 0 on a day that is not a working day, a public
  holiday or an absence (`dayCapacity`). Defaults: 37.5 hours, 100 %, Monday to
  Friday.
- **Hours still to do on a card** = estimated hours - time spent, never below 0
  (`remainingHours`). A card's hours and points are divided equally between the
  people who carry it.
- **Spreading**: the days from the start (or received) date to the due (or end)
  date; each day gets the person's hours that day divided by the sum of their
  hours over those days. With no working day in the span, everything falls on
  its last day. A span already past is moved to today and counted as overdue;
  a span that has started counts from today. At most 3 × 366 days are spread.
- **Utilization** of a week = load hours / capacity hours × 100, rounded; null
  when there is load and no capacity. **Billable** = billable hours logged /
  capacity hours × 100, rounded.
- **Red (over)**: load hours > capacity hours, or allocations > 100 %, or load
  with no capacity. **Grey-blue (under)**: not over, with capacity, load under
  50 % of capacity and allocations under 50 %.
- **Allocations** add `percent` of the week's covered hours to the person (or,
  for a placeholder, `percent` × headcount as the hours it will need). A
  percent is 1-100, a headcount 1-100, a skill level 1-5 (3 when not given; a
  placeholder's lowest level 1 when not given), at most 30 skills a person.
- **Report limits**: 1-26 weeks (`MAX_WEEKS`); at most 500 boards, 500 people,
  20,000 cards and 100,000 time entries ([server/workload.js](../../../server/workload.js));
  beyond that the page says *Too much to show at once*. Hours are rounded to
  two decimals.

## How it works in WeKan

### Who sees what

- A report covers the boards you are an active member of, except boards where
  you only see the cards assigned to you, and the active members of those
  boards. Public boards are not included: somebody's workload is not public
  because one of their boards is. An administrator may choose *All boards*.
- Only the cards of those boards are counted, and the cards themselves never
  reach the browser: the server computes the report and sends the numbers.
- Somebody else's absence is shown only as days absent. Its type and note -
  whether somebody is sick, and why - are shown only to that person and to
  administrators.
- Your working time and absences are yours to change; an administrator can
  change anybody's. Allocations are changed by the board's admins, holidays by
  administrators.

### Code

| | |
| --- | --- |
| `models/lib/workload.js` | the rules, as pure functions: capacity, spreading, allocations, placeholders |
| `models/lib/workloadView.js` | how a week is drawn: colour, bar, text |
| `models/workload.js` | the collections `workloadCapacities`, `workloadAbsences`, `workloadHolidays`, `workloadAllocations` - no client writes, no publications |
| `server/workload.js` | the methods, with who may call them |
| `client/components/main/workload.*` | the page |
| `tests/workload.test.cjs` | the rules; `tests/workloadAccess.test.cjs` who may do what |

The browser tests are
[tests/playwright/specs/workload-capacity.e2e.js](../../../tests/playwright/specs/workload-capacity.e2e.js).

## Commits

 - [Saves show, forms render and PDFs print in Workload, Budget and billing](https://github.com/wekan/wekan/commit/1032b472f3264e82c1cb860e59ebda3719f374ef)
 - [Utilization, billable target and skills](https://github.com/wekan/wekan/commit/d88662d69c212650a7ed5d0ab82d69262a2c6690)
 - [Workload and capacity: hours against working time, across boards, with absences and allocations](https://github.com/wekan/wekan/commit/165dfa3c1676f6069d456ead021fa0db69f92e22)
