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
- upstream title/description changes update the card when local text still
  matches the last synchronized source value; local-only text edits are retained;
- an external item that disappeared is **archived**, never deleted - "old
  entries are at list history", per the request this implements.

Before reconciliation, Sync validates the response using the same source-shape
validator as import. A malformed response or parser failure records the existing
last-sync error and leaves cards unchanged; it is not an empty source.
Parsed tasks must also have unique, valid external IDs and text fields. Missing
IDs, duplicates and malformed normalized tasks abort instead of being silently
dropped or overwritten during reconciliation. A valid
empty issue array retains the existing archive behavior.

Fetchers collect every advertised page before reconciliation. Standard Jira
Cloud tenant URLs ending in `.atlassian.net` use REST v3 enhanced JQL search,
request the fields used by the shared parser, and follow `nextPageToken` until
`isLast` is true. Missing termination metadata and repeated tokens abort.
Other Jira URLs retain REST v2 search, which follows `startAt`/`total`, rejects changing totals and
stalled offsets, and advances by the actual returned issue count. GitHub,
Gitea/Forgejo and GitLab follow `Link: rel="next"`; GitLab's `X-Next-Page` is
also supported. Pagination stays on the configured origin and HTTP redirects
are refused. Use the provider's canonical URL. Loops, malformed pages, later
request failures and limits (1,000 pages or 100,000 items) abort the run without
returning a partial collection. Normal per-request timeouts still apply.

Provider contracts: [Jira search](https://developer.atlassian.com/server/jira/platform/rest/v11002/api-group-search),
[Jira Cloud enhanced search](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/),
[GitHub pagination](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api),
[GitLab REST](https://docs.gitlab.com/api/rest/) and
[Gitea pagination](https://docs.gitea.com/1.26/development/api-usage).
Automated coverage uses mocked provider responses; live-account verification
remain outstanding; Jira Cloud custom domains and government-cloud hostnames
need explicit endpoint configuration in a future change. Pagination cannot
provide an atomic upstream snapshot. Title/description synchronization now stores the last accepted source text on
the card. If both sides change a field differently, the run stops before card
writes and the existing Sync popup identifies up to five conflicting source IDs
and fields. Align the local and upstream text, then retry to accept a common
baseline. Older synced cards without a baseline are adopted only when their
text matches; differing legacy text requires the same resolution.

Updates compare the original title, description, archive state, baseline and
board/list location before writing. A concurrent edit aborts the remaining run.
This is not a transaction: earlier successful updates or creations may remain.
Card and subtask copies omit external Sync IDs, source type and text baselines,
so independent work does not become a second target for an upstream issue.
Existing duplicate local mappings stop the run before updates or archives;
resolve the duplicate mapping before retrying.
Source-absence archives use the same conditional card selector. Sync does not
recursively archive subtasks: each archived card must be matched to an absent
source item. If an active subtask is outside the archive plan, the run stops
before card writes. Concurrent child creation is not covered by a transaction. A dedicated conflict-resolution UI, new Scrum metadata mappings, source-switch handling
and fully atomic synchronization remain pending.

Fetching and parsing REUSE the existing one-time-import code in
`models/lib/externalParsers.js` (`parseJira`, `parseGithub`, `parseGitlab`,
`parseGitea`) rather than a second implementation; `SYNC_CAPABLE_SOURCES`
lists which of those parsers emit the `externalId` reconcile matches on.
Jira works end to end (fetch, parse, reconcile, create/update/archive).
GitHub/GitLab/Gitea/Forgejo share the exact same job and reconcile logic -
their own fetchers exist in `listSyncFetch.js` - but are less exercised in
this pass; see the CHANGELOG's TODO Later for what remains (moving a card
across lists on an upstream status change, and covering more than issues).
The existing list Sync popup has Title and Description switches. Both default
to selected, including configurations saved before this feature. Excluded text
is not compared, overwritten or advanced in the conflict baseline. New cards
still require a title: with Title excluded they use `Imported item`; an
excluded description starts empty. Selecting no text fields is supported.

The same popup also has **Add Card** and **Move Card to Archive** switches.
Both default to enabled, preserving existing configurations. Disable Add Card
to update matched cards without creating newly discovered items. Disable Move
Card to Archive to retain cards whose items disappear from the source. The
switches are independent of field selection. Disabled archival skips child
archive checks; updates still use conflict detection and conditional writes.
Results count only the selected operations. These settings use the existing
board write permission and do not change manual card creation or archival.

For Jira, **Spent time (hours)** is an additional opt-in switch, off for existing
configurations. The shared Jira parser converts numeric seconds using the same
conversion as import. Zero is a real value; an absent total never clears local
time. The source baseline and conditional update include spent hours, so timer
or manual time edits participate in conflict detection. This syncs the aggregate
total, not individual worklogs. Original/remaining estimates and Scrum planning
records remain pending Sync mappings.

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
