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

- 2025-04 Opened card has comments at right, copied from [original WeKan feature Maximize Card 2021-06-14](../../old-CHANGELOG/2021.md#v535-2021-06-14-wekan-release). Trello does not have WeKan feature Minimize Card.
  - https://community.atlassian.com/forums/Trello-questions/comments-in-the-ticket-on-the-right/qaq-p/3029030
  - https://community.atlassian.com/forums/Trello-questions/Trello-card-comments-now-appear-in-a-side-tab-how-to-go-back-to/qaq-p/3003380
- 2025-02 Mirror Card, copied from [original WeKan feature Linked Cards from 2018-04-18](https://github.com/wekan/wekan/pull/1592), discussed at [WeKan issue 5683](https://github.com/wekan/wekan/issues/5683)
- 2021-02 New board button position at top, copied from [original WeKan feature from 2018-09-28](../../old-CHANGELOG/2018.md#v1511-2018-09-28-wekan-edge-release)

Existing WeKan ideas, that WeKan has since implemented

- 2025-01-28 Sync Jira Lists to Trello, copied from [original WeKan Multiverse from 2022-07-14](https://boards.wekan.team/b/JctQEtkayWXTTJyzt/wekan-multiverse).
  WeKan added list sync at [2026-09-11 v11.69](../../old-CHANGELOG/2026/09-part5.md#v1169-2026-09-11-wekan--release):
  a list kept up to date from Jira, GitHub, GitLab or Gitea.
- 2021-02 Map Card, copied from [original WeKan feature request from 2017-01-06](https://github.com/wekan/wekan/issues/755).
  WeKan added card location, with a map link, at [2026-06-13 v9.42](../../old-CHANGELOG/2026/06.md#v942-2026-06-13-wekan--release),
  and a Map view at [2026-09-29 v12.10](../../old-CHANGELOG/2026/09.md#v1210-2026-09-29-wekan--release).

News

- https://news.ycombinator.com/item?id=44821127

### Trello features, and when WeKan added them

- 2025-05-21 Email Inbox. WeKan added Email to card at [2026-10-14 v12.40](../../old-CHANGELOG/2026/10.md#v1240-2026-10-14-wekan--release):
  a board's own email address, IMAP mailboxes and provider webhooks make cards from email.
- 2025-02 Complete Card Checkbox: https://github.com/wekan/wekan/issues/5818 .
  WeKan added it at [2026-06-13 v9.42](../../old-CHANGELOG/2026/06.md#v942-2026-06-13-wekan--release).
- 2021-05 Workspaces. WeKan added Workspaces at All Boards page at [2025-11-06 v8.17](../../old-CHANGELOG/2025.md#v817-2025-11-06-wekan--release).
- 2018 Butler Scheduled and Repeating Tasks: https://github.com/wekan/wekan/issues/5825 . [WeKan added IFTTT Rules at 2018-09-16](../../old-CHANGELOG/2018.md#v147-2018-09-16-wekan-release),
  and Scheduled Rules - once on a date, every day / weekday / week / month, on due dates, or by card aging - at
  [2026-06-15 v9.46](../../old-CHANGELOG/2026/06.md#v946-2026-06-15-wekan--release).
- 2016-12 Card Repeater PowerUp: Copy cards daily/weekly/monthly/yearly. WeKan added recurring cards with
  Scheduled Rules at [2026-06-15 v9.46](../../old-CHANGELOG/2026/06.md#v946-2026-06-15-wekan--release).

### Jira copied design from ClickUp

- 2025-06-29 Jira has UI design copied from ClickUp, where is left sidebar menu.
