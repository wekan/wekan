# Design: WeKan vs Trello vs Jira

### Kanban originally from Toyota paper cards

- https://en.wikipedia.org/wiki/Kanban
- Every kanban software usually implements similar features, original or inspired by some other kanban software

### WeKan copied design from Trello, then WeKan did redesign, then Trello copied design from WeKan

- WeKan has all original developed Open Source MIT licensed code, that is different than Trello propietary code. 
- WeKan UI redesign was done at 2015-01-20 [after DMCA from Trello](../FAQ/FAQ.md#werent-you-called-libreboard-before)
  - by original WeKan creator [mquandalle](https://github.com/mquandalle)
    - [Original redesign](../FAQ/FAQ.md#werent-you-called-libreboard-before)
  - by [xet7](https://github.com/xet7) current maintainer of WeKan
    - [Improvements to original design](Design-Principles.md)
    - [Monkey Proof Software](Monkey-Proof-Software.md)
- Then Trello started copying from original WeKan design

### Trello copied design from WeKan

Existing WeKan features

- 2025-04 Opened card has comments at right, copied from [original WeKan feature Maximize Card 2021-06-14](../../CHANGELOG.md#v535-2021-06-14-wekan-release). Trello does not have WeKan feature Minimize Card.
  - https://community.atlassian.com/forums/Trello-questions/comments-in-the-ticket-on-the-right/qaq-p/3029030
  - https://community.atlassian.com/forums/Trello-questions/Trello-card-comments-now-appear-in-a-side-tab-how-to-go-back-to/qaq-p/3003380
- 2025-02 Mirror Card, copied from [original WeKan feature Linked Cards from 2018-04-18](https://github.com/wekan/wekan/pull/1592), discussed at [WeKan issue 5683](https://github.com/wekan/wekan/issues/5683)
- 2021-02 New board button position at top, copied from [original WeKan feature from 2018-09-28](../../CHANGELOG.md#v1511-2018-09-28-wekan-edge-release)

Existing WeKan ideas, that are not yet implemented in WeKan

- 2025-01-28 Sync Jira Lists to Trello, copied from [original WeKan Multiverse from 2022-07-14](https://boards.wekan.team/b/JctQEtkayWXTTJyzt/wekan-multiverse)
- 2021-02 Map Card, copied from [original WeKan feature request from 2017-01-06](https://github.com/wekan/wekan/issues/755).

News

- https://news.ycombinator.com/item?id=44821127

### Current Trello parity

Checked against the current source and the Trello web app on 2026-08-17.
This replaces the older list that still described Complete Card, Workspaces and
scheduled/repeating rules as missing after they had been implemented.

Already implemented in WeKan:

- Complete Card is available on opened cards and, when enabled in Board
  Settings, on minicards. See
  [cardDetails.jade](../../client/components/cards/cardDetails.jade) and
  [minicard.jade](../../client/components/cards/minicard.jade).
- Workspaces are a nested tree on All Boards. Boards can be assigned by drag and
  drop, and workspaces can contain sub-workspaces. See
  [Workspaces.md](Page/Workspaces.md).
- Scheduled and repeating Rules support once, daily, weekday, weekly and monthly
  schedules, due-date triggers and card aging. They can create recurring cards
  through normal rule actions. See
  [Rules.md](../Features/Automation/Rules/Rules.md).
- Linked Cards and Linked Boards provide the live cross-board card relationship
  that Trello calls Mirror Cards.
- Board views already include Swimlanes, Lists, Calendar, Gantt, Table and
  Statistics.

The remaining product gaps are grouped by delivery phase so this list stays a
testable roadmap rather than a catalogue of names:

| Phase | Gap | Acceptance boundary |
| --- | --- | --- |
| 1 | Personal Inbox | A user-private capture queue can accept a title, URL, description and attachment, then move the real card into an authorized board/list without losing its source. |
| 2 | My Work and advanced checklist items | Checklist items can have one assignee, due date and reminder; My Work shows permitted cards and checklist items across boards with overdue/today/upcoming filters. |
| 3 | Personal Planner | A 1/3/7-day view shows assigned and due cards across boards and can link a card to a focus block without changing its due date. External calendars remain a separate credential-gated integration. |
| 4 | Dashboard, Map and saved searches | Statistics gains drill-down charts by list/member/label/due; Map plots authorized cards that already have locations; global-search queries can be saved per user. |
| 5 | Capture integrations and extension surface | Email-to-Inbox verifies sender/token and attachment safety; browser/chat connectors use a permissioned API; templates can be installed from reviewable JSON packages. |

Every phase requires unit and negative permission tests, relevant UI tests, and
fresh screenshots from the normal WeKan frontend reading persistent non-fixture
data. A phase is not complete when its only evidence is a test fixture, terminal,
standalone report page or generated image.

### Jira copied design from ClickUp

- 2025-06-29 Jira has UI design copied from ClickUp, where is left sidebar menu.
