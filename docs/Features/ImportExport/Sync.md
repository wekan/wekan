# [Big Picture Roadmap](../../../FUTURE.md): Import/Export/Sync with WeKan

## List sync (implemented, Jira end to end)

A WeKan list can be marked as synced from an external tracker: set
`Lists.syncSource = { type, url, projectKey, enabled }` (`models/lists.js`)
and store the credential separately, server-only, in `ListSyncCredentials`
(`models/listSyncCredentials.js` - no publication exists for it anywhere, so
it can never reach the client). `server/listSync.js` registers a
`quave:synced-cron` job (the same scheduling infrastructure
`server/checklistResetSchedule.js` and `server/scheduledRules.js` use) that,
every 15 minutes, fetches each synced list's current items
(`server/lib/listSyncFetch.js`) and reconciles them against WeKan
(`models/lib/listSyncReconcile.js`, pure and unit-tested in
`tests/listSyncReconcile.test.cjs`):

- a new external item creates a WeKan card;
- a changed title/description updates the existing card;
- an external item that disappeared is **archived**, never deleted - "old
  entries are at list history", per the request this implements.

Fetching and parsing REUSE the existing one-time-import code in
`models/lib/externalParsers.js` (`parseJira`, `parseGithub`, `parseGitlab`,
`parseGitea`) rather than a second implementation; `SYNC_CAPABLE_SOURCES`
lists which of those parsers emit the `externalId` reconcile matches on.
Jira works end to end (fetch, parse, reconcile, create/update/archive).
GitHub/GitLab/Gitea/Forgejo share the exact same job and reconcile logic -
their own fetchers exist in `listSyncFetch.js` - but are less exercised in
this pass; see the CHANGELOG's TODO Later for what remains (moving a card
across lists on an upstream status change, and covering more than issues).
Configuration methods: `setListSyncSource`, `hasListSyncCredential`,
`syncListNow` (`server/methods/listSync.js`), all requiring board write
access.

## Implemented formats and completeness work

The current contract, newest provider/API references, complete field inventory,
loss accounting and restart behavior are maintained in
[Format-Coverage.md](./Format-Coverage.md). The historical issue table below is
retained as provenance; it is not the current format specification.

## Historical issue inventory

[More](https://github.com/wekan/wekan/issues/4578)

### WeKan kanban

From | Import | Export | Sync | In Progress
------------ | ------------- | ------------- | -------------  | -------------
[CSV/TSV](./CSV/CSV.md) | CSV/TSV | [Custom Fields](https://github.com/wekan/wekan/issues/3386), [Hours](https://github.com/wekan/wekan/issues/1907), [Custom Fields value and name](https://github.com/wekan/wekan/issues/3769) | | [Error 500](https://github.com/wekan/wekan/issues/5132)
JSON | [Checklists](https://github.com/wekan/wekan/issues/904), [Sandstorm Header](https://github.com/wekan/wekan/issues/1850), [Upload](https://github.com/wekan/wekan/issues/4615) [File](https://github.com/wekan/wekan/issues/2178), [Templates Name](https://github.com/wekan/wekan/issues/2727), [Cards/Lists](https://github.com/wekan/wekan/issues/2340), [List Order](https://github.com/wekan/wekan/issues/1602), [Invisible](https://github.com/wekan/wekan/issues/5154), [List Color](https://github.com/wekan/wekan/issues/3615), [Comments](https://github.com/wekan/wekan/issues/4228), [Labels](https://github.com/wekan/wekan/issues/813), [Subtasks](https://github.com/wekan/wekan/issues/4420) | JSON, [Checklists](https://github.com/wekan/wekan/issues/904), [Cards/Lists](https://github.com/wekan/wekan/issues/2340), [Card](https://github.com/wekan/wekan/issues/4197), [Labels](https://github.com/wekan/wekan/issues/813), [List Order](https://github.com/wekan/wekan/issues/1602), [Version](https://github.com/wekan/wekan/issues/1922) | [Bidirectional](https://github.com/wekan/wekan/issues/1322) |
[Any](https://github.com/wekan/wekan/issues/3775)
Excel | | XLSX | |
Board HTML |  | [Card Content](https://github.com/wekan/wekan/issues/4004), [Link to Minicard](https://github.com/wekan/wekan/issues/3812) | |
Clipboard | [Markdown](https://github.com/wekan/wekan/issues/2142) | [Markdown](https://github.com/wekan/wekan/issues/2142), [Board JSON](https://github.com/wekan/wekan/issues/1918) | |
Text | [DragDrop](https://github.com/wekan/wekan/issues/1941) | [Boards/Swimlanes](https://github.com/wekan/wekan/issues/2185) | |
Print | | [Board](https://github.com/wekan/wekan/issues/2794) | |
CLI | [Sandstorm](https://github.com/wekan/wekan/issues/1695) | [Sandstorm](https://github.com/wekan/wekan/issues/1695) | |
WeKan All Boards  | | [ZIP](https://github.com/wekan/wekan/issues/4902) | | 

### Other kanban

From | Import | Export | Sync | In Progress
------------ | ------------- | ------------- | -------------  | -------------
[Trello](./Trello/trello/Migrating-from-Trello.md) | JSON, [Feedback](https://github.com/wekan/wekan/issues/1467), [File Upload](https://github.com/wekan/wekan/issues/529) | | | [Attachments](https://github.com/wekan/wekan/issues/4877), [Sandstorm Attachments](https://github.com/wekan/wekan/issues/2893), [CheckLists UserId](https://github.com/wekan/wekan/issues/4417)
[Jira](./Jira/Jira.md) | | | |
[Asana](./Asana/Asana.md) | | | |
[Zenkit](./ZenKit/ZenKit.md) | | | |

## Wishes

### Other Kanban

From | Import | Export | Sync | In Progress
------------ | ------------- | ------------- | -------------  | -------------
[Focalboard](https://github.com/wekan/wekan/issues/4659) |  |  |  |
[Google Tasks](https://github.com/wekan/wekan/issues/5182) |  |  | |
[Notion](https://github.com/wekan/wekan/issues/4659) |  |  |  |
[TaskWarrior](https://github.com/wekan/wekan/issues/827)  |  |  |  |
[Todo.txt](https://github.com/wekan/wekan/issues/152) |  |  |  |
[Todoist](https://github.com/wekan/wekan/issues/4659) |  |  |  |
[Redmine](https://github.com/wekan/wekan/issues/1150) |  |  |  |
[RestyaBoard](https://github.com/wekan/wekan/issues/3181) |  |  |  |
[Rust Kanban](https://github.com/yashs662/rust_kanban) |  |  |  |
[Leo and Emacs Org mode](https://github.com/wekan/wekan/issues/2186)  |  |  |  |
[Microsoft Planner](https://github.com/wekan/wekan/issues/2642)  |  |  |  |

### Issues and SCM

From | Import | Export | Sync | In Progress
------------ | ------------- | ------------- | -------------  | -------------
[GitHub](https://github.com/wekan/wekan/issues/5145) |  |  | |
[GitLab](https://github.com/wekan/wekan/issues/5145) |  |  | |
[Fossil SCM](https://github.com/wekan/wekan/issues/5145) |  |  | |
[Git-Bug](https://github.com/wekan/wekan/issues/5145) |  |  | |
Gitea
Gogs | | | [wekan-gogs](https://github.com/wekan/wekan-gogs) | 

### Wiki

From | Import | Export | Sync | In Progress
------------ | ------------- | ------------- | -------------  | -------------
Confluence |  |  | |
