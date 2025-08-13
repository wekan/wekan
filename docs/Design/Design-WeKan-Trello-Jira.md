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

- 2025-04 Opened card has comments at right, copied from [original WeKan feature Maximize Card 2021-06-14](https://github.com/wekan/wekan/blob/main/CHANGELOG.md#v535-2021-06-14-wekan-release). Trello does not have WeKan feature Minimize Card.
  - https://community.atlassian.com/forums/Trello-questions/comments-in-the-ticket-on-the-right/qaq-p/3029030
  - https://community.atlassian.com/forums/Trello-questions/Trello-card-comments-now-appear-in-a-side-tab-how-to-go-back-to/qaq-p/3003380
- 2025-02 Mirror Card, copied from [original WeKan feature Linked Cards from 2018-04-18](https://github.com/wekan/wekan/pull/1592), discussed at [WeKan issue 5683](https://github.com/wekan/wekan/issues/5683)
- 2021-02 New board button position at top, copied from [original WeKan feature from 2018-09-28](../../CHANGELOG.md#v1511-2018-09-28-wekan-edge-release)

Existing WeKan ideas, that are not yet implemented in WeKan

- 2025-01-28 Sync Jira Lists to Trello, copied from [original WeKan Multiverse from 2022-07-14](https://boards.wekan.team/b/JctQEtkayWXTTJyzt/wekan-multiverse)
- 2021-02 Map Card, copied from [original WeKan feature request from 2017-01-06](https://github.com/wekan/wekan/issues/755).

### Trello features, that are not yet implemented in WeKan

- 2025-05-21 Email Inbox
- 2025-02 Complete Card Checkbox: https://github.com/wekan/wekan/issues/5818
- 2021-05 Workspaces
- 2018 Butler Scheduled and Repeating Tasks: https://github.com/wekan/wekan/issues/5825 . [WeKan added IFTTT Rules at 2018-09-16](../../CHANGELOG.md#v147-2018-09-16-wekan-release), but not yet scheduled or repeating IFTTT Rules.
- 2016-12 Card Repeater PowerUp: Copy cards daily/weekly/monthly/yearly

### Jira copied design from ClickUp

- 2025-06-29 Jira has UI design copied from ClickUp, where is left sidebar menu.
